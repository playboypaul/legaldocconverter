from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form, Request
from fastapi.responses import FileResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import tempfile
import shutil
import aiofiles
import asyncio
import io
import json
from file_converter import FileConverter
from ai_analyzer import AIAnalyzer
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Import database and Stripe webhook
from database import db as postgres_db
import stripe_webhook

# Persistent storage directories
STORAGE_BASE_DIR = os.path.join(os.path.dirname(__file__), "storage")
UPLOADS_DIR = os.path.join(STORAGE_BASE_DIR, "uploads")
CONVERSIONS_DIR = os.path.join(STORAGE_BASE_DIR, "conversions")
PDF_OPERATIONS_DIR = os.path.join(STORAGE_BASE_DIR, "pdf_operations")

# Ensure directories exist
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(CONVERSIONS_DIR, exist_ok=True)
os.makedirs(PDF_OPERATIONS_DIR, exist_ok=True)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (keeping for backwards compatibility during migration)
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'legalconverter')]

# Create the main app without a prefix
app = FastAPI(
    title="Legal Document Converter API",
    description="API for converting and analyzing legal documents",
    version="1.0.0"
)

# Configure FastAPI max request size to prevent internal 413 errors
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB limit

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoints for Kubernetes
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes liveness probe"""
    return {"status": "healthy", "service": "LegalDocConverter API"}

@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint for Kubernetes readiness probe"""
    try:
        # Check if we can access the database
        await db.command('ping')
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        # Return 503 if not ready
        from fastapi import Response
        return Response(
            content='{"status": "not ready", "error": "database unavailable"}',
            status_code=503,
            media_type="application/json"
        )

# Initialize services
file_converter = FileConverter()
ai_analyzer = AIAnalyzer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class FileUploadResponse(BaseModel):
    file_id: str
    original_name: str
    file_type: str
    file_size: int
    supported_conversions: List[str]

class ConversionRequest(BaseModel):
    file_id: str
    target_format: str

class ConversionResponse(BaseModel):
    conversion_id: str
    status: str
    download_url: str
    original_file: str
    converted_file: str

class AnalysisRequest(BaseModel):
    file_id: str

class RiskAssessment(BaseModel):
    level: str
    issue: str
    recommendation: str

class ComplianceScore(BaseModel):
    score: int
    details: str

class AnalysisResponse(BaseModel):
    analysis_id: str
    summary: str
    key_findings: List[str]
    risk_assessment: List[RiskAssessment]
    compliance: ComplianceScore

class SupportedFormats(BaseModel):
    input: List[str]
    output: List[str]

# Persistent storage file paths
STORAGE_METADATA_FILE = os.path.join(STORAGE_BASE_DIR, "file_storage.json")
CONVERSION_METADATA_FILE = os.path.join(STORAGE_BASE_DIR, "conversion_storage.json")

# Load or initialize storage from disk
def load_storage():
    """Load file storage metadata from disk"""
    file_storage = {}
    conversion_storage = {}
    
    try:
        if os.path.exists(STORAGE_METADATA_FILE):
            with open(STORAGE_METADATA_FILE, 'r') as f:
                data = json.load(f)
                # Convert datetime strings back to datetime objects
                for file_id, file_info in data.items():
                    if 'upload_time' in file_info and isinstance(file_info['upload_time'], str):
                        file_info['upload_time'] = datetime.fromisoformat(file_info['upload_time'])
                    file_storage[file_id] = file_info
                logger.info(f"Loaded {len(file_storage)} files from persistent storage")
        else:
            logger.info("No existing file storage found - starting fresh")
    except Exception as e:
        logger.warning(f"Error loading file storage, starting fresh: {e}")
        file_storage = {}
    
    try:
        if os.path.exists(CONVERSION_METADATA_FILE):
            with open(CONVERSION_METADATA_FILE, 'r') as f:
                data = json.load(f)
                for conv_id, conv_info in data.items():
                    if 'conversion_time' in conv_info and isinstance(conv_info['conversion_time'], str):
                        conv_info['conversion_time'] = datetime.fromisoformat(conv_info['conversion_time'])
                    conversion_storage[conv_id] = conv_info
                logger.info(f"Loaded {len(conversion_storage)} conversions from persistent storage")
        else:
            logger.info("No existing conversion storage found - starting fresh")
    except Exception as e:
        logger.warning(f"Error loading conversion storage, starting fresh: {e}")
        conversion_storage = {}
    
    return file_storage, conversion_storage

def save_storage():
    """Save file storage metadata to disk"""
    try:
        # Convert datetime objects to strings for JSON serialization
        file_data = {}
        for file_id, file_info in file_storage.items():
            info_copy = file_info.copy()
            if 'upload_time' in info_copy and isinstance(info_copy['upload_time'], datetime):
                info_copy['upload_time'] = info_copy['upload_time'].isoformat()
            file_data[file_id] = info_copy
        
        with open(STORAGE_METADATA_FILE, 'w') as f:
            json.dump(file_data, f, indent=2)
        
        # Save conversion storage
        conv_data = {}
        for conv_id, conv_info in conversion_storage.items():
            info_copy = conv_info.copy()
            if 'conversion_time' in info_copy and isinstance(info_copy['conversion_time'], datetime):
                info_copy['conversion_time'] = info_copy['conversion_time'].isoformat()
            conv_data[conv_id] = info_copy
        
        with open(CONVERSION_METADATA_FILE, 'w') as f:
            json.dump(conv_data, f, indent=2)
            
    except Exception as e:
        logger.error(f"Error saving storage metadata: {e}")

# Load existing storage on startup
file_storage, conversion_storage = load_storage()
analysis_storage = {}

# Supported formats
SUPPORTED_FORMATS = {
    "input": ["pdf", "docx", "doc", "txt", "rtf", "odt", "html", "xml", "csv", "xlsx", "xls", "ppt", "pptx", "epub", "md"],
    "output": ["pdf", "pdfa", "docx", "doc", "txt", "rtf", "odt", "html", "xml", "csv", "xlsx", "xls", "ppt", "pptx", "epub", "md", "json", "yaml", "tex", "docbook", "opml", "rst", "asciidoc", "wiki", "jira", "fb2", "icml", "tei", "context", "man", "ms", "zimwiki"]
}

@api_router.get("/")
async def root():
    return {"message": "Legal Document Converter API"}

@api_router.get("/formats", response_model=SupportedFormats)
async def get_supported_formats():
    """Get list of supported input and output formats"""
    return SupportedFormats(**SUPPORTED_FORMATS)

@api_router.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload a document for processing with enhanced error handling"""
    temp_file_path = None
    try:
        # Validate file exists and has a filename
        if not file or not file.filename:
            logger.error("Upload attempt with no file or filename")
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read file content with proper error handling
        try:
            file_content = await file.read()
        except Exception as e:
            logger.error(f"Failed to read uploaded file {file.filename}: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to read uploaded file. File may be corrupted.")
        
        file_size = len(file_content)
        
        # Validate file is not empty
        if file_size == 0:
            logger.error(f"Empty file uploaded: {file.filename}")
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Check file size against limit (redundant check as FastAPI should handle this, but kept for safety)
        if file_size > MAX_FILE_SIZE:
            logger.error(f"File too large: {file.filename} ({file_size} bytes)")
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size allowed is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Enhanced file type validation
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if not file_extension:
            logger.error(f"File without extension: {file.filename}")
            raise HTTPException(status_code=400, detail="File must have a valid extension")
        
        if file_extension not in SUPPORTED_FORMATS["input"]:
            logger.error(f"Unsupported file type: {file_extension} for file {file.filename}")
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type '{file_extension}'. Supported formats: {', '.join(SUPPORTED_FORMATS['input'])}"
            )
        
        # Special validation for PDF files
        if file_extension == 'pdf':
            # Check if file starts with PDF signature
            if not file_content.startswith(b'%PDF'):
                logger.error(f"Invalid PDF file: {file.filename} - missing PDF signature")
                raise HTTPException(status_code=400, detail="Invalid PDF file format")
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        logger.info(f"Starting upload process for {file.filename} with ID: {file_id}")
        
        # Create file in persistent uploads directory
        # Enhanced filename sanitization
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._-")
        if len(safe_filename) == 0:
            safe_filename = f"uploaded_file.{file_extension}"
        
        temp_file_path = os.path.join(UPLOADS_DIR, f"{file_id}_{safe_filename}")
        
        # Save uploaded file with comprehensive error handling
        try:
            async with aiofiles.open(temp_file_path, 'wb') as f:
                await f.write(file_content)
                
            # Verify file was written correctly
            if not os.path.exists(temp_file_path):
                logger.error(f"File not found after write: {temp_file_path}")
                raise Exception("Failed to save uploaded file")
                
            actual_size = os.path.getsize(temp_file_path)
            if actual_size != file_size:
                logger.error(f"File size mismatch for {file.filename}: expected {file_size}, got {actual_size}")
                raise Exception(f"File size mismatch: expected {file_size}, got {actual_size}")
                
        except Exception as e:
            # Cleanup on failure
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info(f"Cleaned up failed upload file: {temp_file_path}")
                except Exception as cleanup_error:
                    logger.error(f"Failed to cleanup file {temp_file_path}: {str(cleanup_error)}")
            
            logger.error(f"File save error for {file.filename}: {str(e)}")
            raise Exception(f"Failed to save file: {str(e)}")
        
        # Store file metadata
        file_info = {
            "file_id": file_id,
            "original_name": file.filename,
            "file_path": temp_file_path,
            "file_type": file_extension,
            "file_size": file_size,
            "upload_time": datetime.utcnow(),
            "supported_conversions": [fmt for fmt in SUPPORTED_FORMATS["output"] if fmt != file_extension]
        }
        
        file_storage[file_id] = file_info
        save_storage()
        
        logger.info(f"File uploaded successfully: {file.filename} ({file_size} bytes) with ID: {file_id}")
        
        return FileUploadResponse(
            file_id=file_id,
            original_name=file.filename,
            file_type=file_extension,
            file_size=file_size,
            supported_conversions=file_info["supported_conversions"]
        )
        
    except HTTPException as he:
        # Re-raise HTTP exceptions with proper logging
        logger.error(f"HTTP error during upload of {file.filename if file else 'unknown'}: {he.detail}")
        raise he
    except Exception as e:
        # Cleanup temp file if it was created
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f"Cleaned up temp file after error: {temp_file_path}")
            except Exception as cleanup_error:
                logger.error(f"Failed to cleanup temp file {temp_file_path}: {str(cleanup_error)}")
        
        logger.error(f"Unexpected error uploading file {file.filename if file else 'unknown'}: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while processing your file. Please try again.")

@api_router.post("/convert", response_model=ConversionResponse)
async def convert_file(request: ConversionRequest):
    """Convert uploaded file to target format"""
    try:
        # Check if file exists
        if request.file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[request.file_id]
        
        # Validate target format
        if request.target_format not in SUPPORTED_FORMATS["output"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported target format. Supported formats: {', '.join(SUPPORTED_FORMATS['output'])}"
            )
        
        # Generate conversion ID
        conversion_id = str(uuid.uuid4())
        
        # Convert file
        converted_file_path = await file_converter.convert_file(
            file_info["file_path"],
            file_info["file_type"],
            request.target_format,
            conversion_id
        )
        
        # Store conversion metadata
        converted_filename = f"{file_info['original_name'].rsplit('.', 1)[0]}.{request.target_format}"
        conversion_info = {
            "conversion_id": conversion_id,
            "original_file_id": request.file_id,
            "converted_file_path": converted_file_path,
            "original_file": file_info["original_name"],
            "converted_file": converted_filename,
            "target_format": request.target_format,
            "conversion_time": datetime.utcnow(),
            "status": "completed"
        }
        
        conversion_storage[conversion_id] = conversion_info
        
        # ALSO add converted file to file_storage so it can be converted again
        file_storage[conversion_id] = {
            "file_id": conversion_id,
            "original_name": converted_filename,
            "file_path": converted_file_path,
            "file_type": request.target_format,
            "file_size": os.path.getsize(converted_file_path),
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        logger.info(f"File converted: {file_info['original_name']} to {request.target_format}")
        
        return ConversionResponse(
            conversion_id=conversion_id,
            status="completed",
            download_url=f"/api/download/{conversion_id}",
            original_file=file_info["original_name"],
            converted_file=converted_filename
        )
        
    except Exception as e:
        logger.error(f"Error converting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error converting file: {str(e)}")

@api_router.post("/analyze", response_model=AnalysisResponse)
async def analyze_document(request: AnalysisRequest):
    """Analyze document using AI for legal insights"""
    try:
        # Check if file exists
        if request.file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[request.file_id]
        
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        
        # Analyze document
        analysis_result = await ai_analyzer.analyze_document(
            file_info["file_path"],
            file_info["file_type"],
            analysis_id
        )
        
        # Store analysis metadata
        analysis_info = {
            "analysis_id": analysis_id,
            "original_file_id": request.file_id,
            "analysis_time": datetime.utcnow(),
            "result": analysis_result
        }
        
        analysis_storage[analysis_id] = analysis_info
        
        logger.info(f"Document analyzed: {file_info['original_name']}")
        
        return AnalysisResponse(**analysis_result)
        
    except Exception as e:
        logger.error(f"Error analyzing document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing document: {str(e)}")

@api_router.get("/download/{file_id}")
async def download_file(file_id: str):
    """Download converted file or PDF operation result"""
    try:
        # Check if it's a conversion result
        if file_id in conversion_storage:
            conversion_info = conversion_storage[file_id]
            
            # Check if file exists
            if not os.path.exists(conversion_info["converted_file_path"]):
                raise HTTPException(status_code=404, detail="Converted file not found")
            
            return FileResponse(
                path=conversion_info["converted_file_path"],
                filename=conversion_info["converted_file"],
                media_type='application/octet-stream'
            )
        
        # Check if it's a file in file_storage (PDF operations, uploads)
        elif file_id in file_storage:
            file_info = file_storage[file_id]
            
            # Check if file exists
            if not os.path.exists(file_info["file_path"]):
                raise HTTPException(status_code=404, detail="File not found")
            
            return FileResponse(
                path=file_info["file_path"],
                filename=file_info["original_name"],
                media_type='application/octet-stream'
            )
        
        else:
            raise HTTPException(status_code=404, detail="File not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")

# Cleanup background task
async def cleanup_old_files():
    """Background task to cleanup old temporary files"""
    while True:
        try:
            current_time = datetime.utcnow()
            files_to_remove = []
            conversions_to_remove = []
            analyses_to_remove = []
            
            # Cleanup files older than 1 hour
            for file_id, file_info in file_storage.items():
                if (current_time - file_info["upload_time"]).seconds > 3600:
                    files_to_remove.append(file_id)
                    # Remove physical file
                    if os.path.exists(file_info["file_path"]):
                        os.remove(file_info["file_path"])
            
            # Cleanup conversions older than 1 hour
            for conv_id, conv_info in conversion_storage.items():
                if (current_time - conv_info["conversion_time"]).seconds > 3600:
                    conversions_to_remove.append(conv_id)
                    # Remove physical file
                    if os.path.exists(conv_info["converted_file_path"]):
                        os.remove(conv_info["converted_file_path"])
            
            # Cleanup analyses older than 1 hour
            for analysis_id, analysis_info in analysis_storage.items():
                if (current_time - analysis_info["analysis_time"]).seconds > 3600:
                    analyses_to_remove.append(analysis_id)
            
            # Remove from memory
            for file_id in files_to_remove:
                del file_storage[file_id]
            for conv_id in conversions_to_remove:
                del conversion_storage[conv_id]
            for analysis_id in analyses_to_remove:
                del analysis_storage[analysis_id]
            
            if files_to_remove or conversions_to_remove or analyses_to_remove:
                save_storage()
                logger.info(f"Cleaned up {len(files_to_remove)} files, {len(conversions_to_remove)} conversions, {len(analyses_to_remove)} analyses")
            
            # Sleep for 30 minutes before next cleanup
            await asyncio.sleep(1800)
            
        except Exception as e:
            logger.error(f"Error in cleanup task: {str(e)}")
            await asyncio.sleep(300)  # Sleep 5 minutes on error

# PDF Editing API Endpoints

@api_router.post("/pdf/merge")
async def merge_pdfs(request: dict):
    """Merge multiple PDF files into one"""
    try:
        file_ids = request.get("file_ids", [])
        if len(file_ids) < 2:
            raise HTTPException(status_code=400, detail="At least 2 PDF files required for merging")
        
        # Validate all files exist and are PDFs
        pdf_paths = []
        for file_id in file_ids:
            if file_id not in file_storage:
                raise HTTPException(status_code=404, detail=f"File {file_id} not found")
            
            file_info = file_storage[file_id]
            if file_info["file_type"].lower() != "pdf":
                raise HTTPException(status_code=400, detail=f"File {file_info['original_name']} is not a PDF")
            
            pdf_paths.append(file_info["file_path"])
        
        # Generate merge ID and output filename
        merge_id = str(uuid.uuid4())
        output_filename = f"merged_document_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        temp_dir = PDF_OPERATIONS_DIR
        output_path = os.path.join(temp_dir, f"{merge_id}_{output_filename}")
        
        # Merge PDFs using PyPDF2
        from PyPDF2 import PdfMerger
        merger = PdfMerger()
        
        for pdf_path in pdf_paths:
            merger.append(pdf_path)
        
        merger.write(output_path)
        merger.close()
        
        # Store merge result
        merge_info = {
            "merge_id": merge_id,
            "output_file": output_filename,
            "output_path": output_path,
            "source_files": [file_storage[fid]["original_name"] for fid in file_ids],
            "merge_time": datetime.utcnow()
        }
        
        file_storage[merge_id] = {
            "file_id": merge_id,
            "original_name": output_filename,
            "file_path": output_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        logger.info(f"PDF merge completed: {len(file_ids)} files merged into {output_filename}")
        
        return {
            "merge_id": merge_id,
            "output_file": output_filename,
            "source_files": merge_info["source_files"],
            "download_url": f"/api/download/{merge_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF merge error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF merge failed: {str(e)}")

@api_router.post("/pdf/split")
async def split_pdf(request: dict):
    """Split PDF into individual pages or page ranges"""
    try:
        file_id = request.get("file_id")
        split_type = request.get("split_type", "pages")  # "pages" or "ranges"
        page_ranges = request.get("page_ranges", [])  # For range splitting: [{"start": 1, "end": 3}, {"start": 4, "end": 6}]
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Split PDF using PyPDF2
        from PyPDF2 import PdfReader, PdfWriter
        
        split_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        temp_dir = CONVERSIONS_DIR
        
        # Read the PDF
        reader = PdfReader(file_info["file_path"])
        total_pages = len(reader.pages)
        
        split_files = []
        
        if split_type == "pages":
            # Split into individual pages
            for i in range(total_pages):
                writer = PdfWriter()
                writer.add_page(reader.pages[i])
                
                page_filename = f"{base_name}_page_{i+1}.pdf"
                page_path = os.path.join(temp_dir, f"{split_id}_page_{i+1}_{page_filename}")
                
                with open(page_path, 'wb') as output_file:
                    writer.write(output_file)
                
                page_id = f"{split_id}_page_{i+1}"
                file_storage[page_id] = {
                    "file_id": page_id,
                    "original_name": page_filename,
                    "file_path": page_path,
                    "file_type": "pdf",
                    "file_size": os.path.getsize(page_path),
                    "upload_time": datetime.utcnow()
                }
                
                split_files.append({
                    "file_id": page_id,
                    "filename": page_filename,
                    "page_number": i + 1,
                    "download_url": f"/api/download/{page_id}"
                })
        else:
            # Split by ranges
            for idx, range_info in enumerate(page_ranges):
                writer = PdfWriter()
                start_page = range_info.get('start', 1) - 1  # Convert to 0-based index
                end_page = min(range_info.get('end', total_pages), total_pages)  # Ensure within bounds
                
                for page_num in range(start_page, end_page):
                    if 0 <= page_num < total_pages:
                        writer.add_page(reader.pages[page_num])
                
                range_filename = f"{base_name}_pages_{start_page+1}-{end_page}.pdf"
                range_path = os.path.join(temp_dir, f"{split_id}_range_{idx}_{range_filename}")
                
                with open(range_path, 'wb') as output_file:
                    writer.write(output_file)
                
                range_id = f"{split_id}_range_{idx}"
                file_storage[range_id] = {
                    "file_id": range_id,
                    "original_name": range_filename,
                    "file_path": range_path,
                    "file_type": "pdf",
                    "file_size": os.path.getsize(range_path),
                    "upload_time": datetime.utcnow()
                }
                
                split_files.append({
                    "file_id": range_id,
                    "filename": range_filename,
                    "page_range": f"{start_page+1}-{end_page}",
                    "download_url": f"/api/download/{range_id}"
                })
        
        save_storage()
        logger.info(f"PDF split completed: {file_info['original_name']} split into {len(split_files)} files")
        
        return {
            "split_id": split_id,
            "original_file": file_info["original_name"],
            "split_type": split_type,
            "split_files": split_files,
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF split error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF split failed: {str(e)}")

@api_router.post("/pdf/encrypt")
async def encrypt_pdf(request: dict):
    """Encrypt PDF with password protection"""
    try:
        file_id = request.get("file_id")
        password = request.get("password")
        permissions = request.get("permissions", {
            "print": True,
            "copy": False,
            "modify": False,
            "extract": False
        })
        
        if not file_id or not password:
            raise HTTPException(status_code=400, detail="file_id and password are required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Encrypt PDF using PyPDF2
        from PyPDF2 import PdfReader, PdfWriter
        
        encrypt_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        encrypted_filename = f"{base_name}_encrypted.pdf"
        temp_dir = CONVERSIONS_DIR
        encrypted_path = os.path.join(temp_dir, f"{encrypt_id}_{encrypted_filename}")
        
        # Read and encrypt the PDF
        reader = PdfReader(file_info["file_path"])
        writer = PdfWriter()
        
        # Copy all pages
        for page in reader.pages:
            writer.add_page(page)
        
        # Encrypt with password and permissions
        writer.encrypt(
            user_password=password,
            owner_password=password,
            permissions_flag=0 if not any(permissions.values()) else -1
        )
        
        # Write encrypted PDF
        with open(encrypted_path, 'wb') as output_file:
            writer.write(output_file)
        
        # Store encrypted file info
        file_storage[encrypt_id] = {
            "file_id": encrypt_id,
            "original_name": encrypted_filename,
            "file_path": encrypted_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(encrypted_path),
            "upload_time": datetime.utcnow(),
            "encrypted": True,
            "permissions": permissions
        }
        save_storage()
        
        logger.info(f"PDF encryption completed: {file_info['original_name']} encrypted as {encrypted_filename}")
        
        return {
            "encrypt_id": encrypt_id,
            "original_file": file_info["original_name"],
            "encrypted_file": encrypted_filename,
            "permissions": permissions,
            "download_url": f"/api/download/{encrypt_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF encryption error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF encryption failed: {str(e)}")

@api_router.post("/pdf/esign")
async def esign_pdf(request: dict):
    """Add electronic signature to PDF"""
    try:
        file_id = request.get("file_id")
        signature_data = request.get("signature_data")  # Base64 encoded signature image
        signature_position = request.get("position", {"page": 1, "x": 100, "y": 100, "width": 200, "height": 50})
        signer_info = request.get("signer_info", {
            "name": "John Doe",
            "email": "john@example.com",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Generate eSign ID and signed filename
        esign_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        signed_filename = f"{base_name}_signed.pdf"
        
        temp_dir = PDF_OPERATIONS_DIR
        signed_path = os.path.join(temp_dir, f"{esign_id}_{signed_filename}")
        
        # Read the original PDF
        from PyPDF2 import PdfReader, PdfWriter
        reader = PdfReader(file_info["file_path"])
        writer = PdfWriter()
        
        # Create signature overlay
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        
        # Get signature position
        page_num = signature_position.get("page", 1) - 1  # Convert to 0-based index
        x = signature_position.get("x", 100)
        y = signature_position.get("y", 100)
        
        # Draw signature text
        can.setFont("Helvetica", 12)
        can.drawString(x, y, f"Signed by: {signer_info.get('name', 'Unknown')}")
        can.drawString(x, y - 15, f"Date: {signer_info.get('date', datetime.now().strftime('%Y-%m-%d'))}")
        can.save()
        
        # Merge signature with PDF
        packet.seek(0)
        signature_pdf = PdfReader(packet)
        
        # Copy all pages and add signature to specified page
        for i, page in enumerate(reader.pages):
            if i == page_num and len(signature_pdf.pages) > 0:
                page.merge_page(signature_pdf.pages[0])
            writer.add_page(page)
        
        # Write signed PDF
        with open(signed_path, 'wb') as output_file:
            writer.write(output_file)
        
        # Store signature metadata
        signature_info = {
            "signature_id": esign_id,
            "signer": signer_info,
            "position": signature_position,
            "timestamp": datetime.utcnow(),
            "verification_hash": f"sha256_{esign_id[:16]}"
        }
        
        # Store signed file info
        file_storage[esign_id] = {
            "file_id": esign_id,
            "original_name": signed_filename,
            "file_path": signed_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(signed_path),
            "upload_time": datetime.utcnow(),
            "signed": True,
            "signature_info": signature_info
        }
        save_storage()
        
        logger.info(f"PDF eSigning completed: {file_info['original_name']} signed as {signed_filename}")
        
        return {
            "esign_id": esign_id,
            "original_file": file_info["original_name"],
            "signed_file": signed_filename,
            "signer_info": signer_info,
            "signature_verification": signature_info["verification_hash"],
            "download_url": f"/api/download/{esign_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF eSigning error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF eSigning failed: {str(e)}")

# New Enhanced API Endpoints

@api_router.post("/batch-upload")
async def batch_upload(files: List[UploadFile] = File(...)):
    """Upload multiple files for batch processing"""
    try:
        results = []
        for file in files:
            # Use existing upload logic
            file_id = str(uuid.uuid4())
            file_content = await file.read()
            file_size = len(file_content)
            file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
            
            if file_extension not in SUPPORTED_FORMATS["input"]:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "error": f"Unsupported file type: {file_extension}"
                })
                continue
            
            # Save file
            temp_dir = CONVERSIONS_DIR
            safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._-")
            temp_file_path = os.path.join(temp_dir, f"{file_id}_{safe_filename}")
            
            async with aiofiles.open(temp_file_path, 'wb') as f:
                await f.write(file_content)
            
            # Store file info
            file_info = {
                "file_id": file_id,
                "original_name": file.filename,
                "file_path": temp_file_path,
                "file_type": file_extension,
                "file_size": file_size,
                "upload_time": datetime.utcnow()
            }
            
            file_storage[file_id] = file_info
            
            results.append({
                "filename": file.filename,
                "file_id": file_id,
                "status": "success",
                "file_size": file_size
            })
        
        save_storage()
        return {"results": results}
        
    except Exception as e:
        logger.error(f"Batch upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")

@api_router.post("/batch-convert")
async def batch_convert(request: dict):
    """Convert multiple files to target format"""
    try:
        file_ids = request.get("file_ids", [])
        target_format = request.get("target_format")
        
        if not file_ids or not target_format:
            raise HTTPException(status_code=400, detail="Missing file_ids or target_format")
        
        results = []
        for file_id in file_ids:
            try:
                if file_id not in file_storage:
                    results.append({
                        "file_id": file_id,
                        "status": "error",
                        "error": "File not found"
                    })
                    continue
                
                file_info = file_storage[file_id]
                conversion_id = str(uuid.uuid4())
                
                # Convert file
                converted_file_path = await file_converter.convert_file(
                    file_info["file_path"],
                    file_info["file_type"],
                    target_format,
                    conversion_id
                )
                
                # Store conversion result
                conversion_info = {
                    "conversion_id": conversion_id,
                    "original_file": file_info["original_name"],
                    "converted_file": f"{file_info['original_name'].rsplit('.', 1)[0]}.{target_format}",
                    "converted_file_path": converted_file_path,
                    "target_format": target_format,
                    "conversion_time": datetime.utcnow()
                }
                
                conversion_storage[conversion_id] = conversion_info
                
                results.append({
                    "file_id": file_id,
                    "conversion_id": conversion_id,
                    "status": "success",
                    "original_file": file_info["original_name"],
                    "converted_file": conversion_info["converted_file"]
                })
                
            except Exception as e:
                results.append({
                    "file_id": file_id,
                    "status": "error",
                    "error": str(e)
                })
        
        save_storage()
        return {"results": results}
        
    except Exception as e:
        logger.error(f"Batch conversion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch conversion failed: {str(e)}")

@api_router.post("/compare")
async def compare_documents(request: dict):
    """Compare two documents and highlight differences"""
    try:
        original_file_id = request.get("original_file_id")
        modified_file_id = request.get("modified_file_id")
        
        if not original_file_id or not modified_file_id:
            raise HTTPException(status_code=400, detail="Both original_file_id and modified_file_id are required")
        
        if original_file_id not in file_storage or modified_file_id not in file_storage:
            raise HTTPException(status_code=404, detail="One or both files not found")
        
        original_file = file_storage[original_file_id]
        modified_file = file_storage[modified_file_id]
        
        # Extract text content from both files
        import difflib
        import re
        
        def extract_text(file_path, file_type):
            """Extract text from various file types"""
            try:
                if file_type.lower() == 'pdf':
                    from PyPDF2 import PdfReader
                    reader = PdfReader(file_path)
                    text = ""
                    for page in reader.pages:
                        text += page.extract_text() + "\n"
                    return text
                elif file_type.lower() in ['txt', 'text']:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        return f.read()
                elif file_type.lower() in ['docx']:
                    # For DOCX, we'd need python-docx library
                    # For now, return a placeholder
                    return "Document comparison for DOCX files requires python-docx library"
                else:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        return f.read()
            except Exception as e:
                return f"Error extracting text: {str(e)}"
        
        # Extract text from both documents
        original_text = extract_text(original_file["file_path"], original_file["file_type"])
        modified_text = extract_text(modified_file["file_path"], modified_file["file_type"])
        
        # Split into lines for comparison
        original_lines = original_text.splitlines()
        modified_lines = modified_text.splitlines()
        
        # Perform diff comparison
        differ = difflib.Differ()
        diff = list(differ.compare(original_lines, modified_lines))
        
        # Analyze differences
        insertions = []
        deletions = []
        modifications = []
        
        for i, line in enumerate(diff):
            if line.startswith('+ '):
                insertions.append({
                    "type": "insertion",
                    "location": f"line {i}",
                    "text": line[2:].strip()
                })
            elif line.startswith('- '):
                deletions.append({
                    "type": "deletion",
                    "location": f"line {i}",
                    "text": line[2:].strip()
                })
            elif line.startswith('? '):
                # This indicates a modification in the previous line
                if modifications:
                    modifications[-1]["hint"] = line[2:].strip()
        
        # Generate unified diff for redlining
        unified_diff = list(difflib.unified_diff(
            original_lines,
            modified_lines,
            fromfile=original_file["original_name"],
            tofile=modified_file["original_name"],
            lineterm=''
        ))
        
        comparison_result = {
            "comparison_id": str(uuid.uuid4()),
            "original_file": original_file["original_name"],
            "modified_file": modified_file["original_name"],
            "differences": {
                "insertions": len(insertions),
                "deletions": len(deletions),
                "modifications": len(modifications),
                "total_changes": len(insertions) + len(deletions) + len(modifications)
            },
            "changes": (insertions + deletions + modifications)[:50],  # Limit to first 50 changes
            "diff_summary": "\n".join(unified_diff[:100]),  # Limit unified diff
            "comparison_time": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Document comparison completed: {original_file['original_name']} vs {modified_file['original_name']}")
        
        return comparison_result
        
    except Exception as e:
        logger.error(f"Document comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document comparison failed: {str(e)}")

@api_router.post("/save-document")
async def save_document(request: dict):
    """Save edited document content"""
    try:
        content = request.get("content")
        format_type = request.get("format")
        
        if not content or not format_type:
            raise HTTPException(status_code=400, detail="Content and format are required")
        
        # Generate file ID for saved document
        file_id = str(uuid.uuid4())
        filename = f"edited_document_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format_type}"
        
        # Save content to file
        temp_dir = CONVERSIONS_DIR
        file_path = os.path.join(temp_dir, f"{file_id}_{filename}")
        
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(content)
        
        # Store file info
        file_info = {
            "file_id": file_id,
            "original_name": filename,
            "file_path": file_path,
            "file_type": format_type,
            "file_size": len(content.encode('utf-8')),
            "upload_time": datetime.utcnow()
        }
        
        file_storage[file_id] = file_info
        save_storage()
        
        return {
            "file_id": file_id,
            "filename": filename,
            "status": "saved",
            "download_url": f"/api/download/{file_id}"
        }
        
    except Exception as e:
        logger.error(f"Document save error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save document: {str(e)}")

# Annotation storage
annotation_storage = {}

@api_router.post("/annotate")
async def add_annotation(request: dict):
    """Add annotation to a document"""
    try:
        file_id = request.get("file_id")
        annotation = request.get("annotation")
        
        if not file_id or not annotation:
            raise HTTPException(status_code=400, detail="file_id and annotation are required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize annotation storage for this file if needed
        if file_id not in annotation_storage:
            annotation_storage[file_id] = []
        
        # Add annotation with unique ID
        annotation_id = str(uuid.uuid4())
        annotation_data = {
            "annotation_id": annotation_id,
            "file_id": file_id,
            "type": annotation.get("type", "comment"),  # comment, highlight, note, bookmark
            "text": annotation.get("text", ""),
            "location": annotation.get("location", ""),
            "color": annotation.get("color", "yellow"),
            "page": annotation.get("page", 1),
            "position": annotation.get("position", {}),
            "created_at": datetime.utcnow().isoformat(),
            "author": annotation.get("author", "Anonymous")
        }
        
        annotation_storage[file_id].append(annotation_data)
        
        logger.info(f"Annotation added to file {file_id}: {annotation_data['type']}")
        
        return {
            "annotation_id": annotation_id,
            "status": "success",
            "message": "Annotation added successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Annotation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add annotation: {str(e)}")

@api_router.get("/annotations/{file_id}")
async def get_annotations(file_id: str):
    """Get all annotations for a document"""
    try:
        # Return empty annotations if file doesn't exist or has no annotations
        # This is more user-friendly than returning 404
        annotations = annotation_storage.get(file_id, [])
        
        return {
            "file_id": file_id,
            "annotations": annotations,
            "total": len(annotations)
        }
        
    except Exception as e:
        logger.error(f"Get annotations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get annotations: {str(e)}")

@api_router.delete("/annotations/{annotation_id}")
async def delete_annotation(annotation_id: str):
    """Delete a specific annotation"""
    try:
        # Find and delete the annotation
        for file_id, annotations in annotation_storage.items():
            for i, annotation in enumerate(annotations):
                if annotation["annotation_id"] == annotation_id:
                    del annotation_storage[file_id][i]
                    logger.info(f"Annotation {annotation_id} deleted from file {file_id}")
                    return {
                        "annotation_id": annotation_id,
                        "status": "success",
                        "message": "Annotation deleted successfully"
                    }
        
        raise HTTPException(status_code=404, detail="Annotation not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete annotation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete annotation: {str(e)}")

@api_router.post("/annotations/export")
async def export_annotations(request: dict):
    """Export annotations to a file"""
    try:
        file_id = request.get("file_id")
        export_format = request.get("format", "json")  # json or pdf
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        annotations = annotation_storage.get(file_id, [])
        
        if export_format == "json":
            # Export as JSON
            export_id = str(uuid.uuid4())
            export_filename = f"annotations_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            temp_dir = CONVERSIONS_DIR
            export_path = os.path.join(temp_dir, f"{export_id}_{export_filename}")
            
            import json
            with open(export_path, 'w', encoding='utf-8') as f:
                json.dump({
                    "file_id": file_id,
                    "file_name": file_storage[file_id]["original_name"],
                    "annotations": annotations,
                    "total_annotations": len(annotations),
                    "export_date": datetime.utcnow().isoformat()
                }, f, indent=2)
            
            # Store export file
            file_storage[export_id] = {
                "file_id": export_id,
                "original_name": export_filename,
                "file_path": export_path,
                "file_type": "json",
                "file_size": os.path.getsize(export_path),
                "upload_time": datetime.utcnow()
            }
            save_storage()
            
            return {
                "export_id": export_id,
                "filename": export_filename,
                "format": export_format,
                "download_url": f"/api/download/{export_id}",
                "status": "success"
            }
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export annotations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export annotations: {str(e)}")

# Enhanced PDF Editing Tools

@api_router.post("/pdf/rotate")
async def rotate_pdf_pages(request: dict):
    """Rotate pages in a PDF document"""
    try:
        file_id = request.get("file_id")
        rotation = request.get("rotation", 90)  # 90, 180, 270
        pages = request.get("pages", "all")  # "all" or list of page numbers [1, 2, 3]
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if rotation not in [90, 180, 270]:
            raise HTTPException(status_code=400, detail="Rotation must be 90, 180, or 270 degrees")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        from PyPDF2 import PdfReader, PdfWriter
        
        rotate_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        rotated_filename = f"{base_name}_rotated.pdf"
        output_path = os.path.join(PDF_OPERATIONS_DIR, f"{rotate_id}_{rotated_filename}")
        
        reader = PdfReader(file_info["file_path"])
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        pages_to_rotate = list(range(total_pages)) if pages == "all" else [p - 1 for p in pages if 0 < p <= total_pages]
        
        for i, page in enumerate(reader.pages):
            if i in pages_to_rotate:
                page.rotate(rotation)
            writer.add_page(page)
        
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        file_storage[rotate_id] = {
            "file_id": rotate_id,
            "original_name": rotated_filename,
            "file_path": output_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        logger.info(f"PDF rotation completed: {rotation} degrees on {len(pages_to_rotate)} pages")
        
        return {
            "rotate_id": rotate_id,
            "original_file": file_info["original_name"],
            "rotated_file": rotated_filename,
            "rotation": rotation,
            "pages_rotated": len(pages_to_rotate),
            "download_url": f"/api/download/{rotate_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF rotation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF rotation failed: {str(e)}")

@api_router.post("/pdf/compress")
async def compress_pdf(request: dict):
    """Compress PDF to reduce file size"""
    try:
        file_id = request.get("file_id")
        quality = request.get("quality", "medium")  # "low", "medium", "high"
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        from PyPDF2 import PdfReader, PdfWriter
        
        compress_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        compressed_filename = f"{base_name}_compressed.pdf"
        output_path = os.path.join(PDF_OPERATIONS_DIR, f"{compress_id}_{compressed_filename}")
        
        reader = PdfReader(file_info["file_path"])
        writer = PdfWriter()
        
        for page in reader.pages:
            page.compress_content_streams()
            writer.add_page(page)
        
        # Remove unused objects
        writer.remove_links()
        
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        original_size = file_info["file_size"]
        compressed_size = os.path.getsize(output_path)
        reduction = ((original_size - compressed_size) / original_size) * 100 if original_size > 0 else 0
        
        file_storage[compress_id] = {
            "file_id": compress_id,
            "original_name": compressed_filename,
            "file_path": output_path,
            "file_type": "pdf",
            "file_size": compressed_size,
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        logger.info(f"PDF compression completed: {reduction:.1f}% reduction")
        
        return {
            "compress_id": compress_id,
            "original_file": file_info["original_name"],
            "compressed_file": compressed_filename,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "reduction_percent": round(reduction, 1),
            "download_url": f"/api/download/{compress_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF compression error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF compression failed: {str(e)}")

@api_router.post("/pdf/watermark")
async def add_watermark(request: dict):
    """Add text watermark to PDF"""
    try:
        file_id = request.get("file_id")
        watermark_text = request.get("text", "CONFIDENTIAL")
        position = request.get("position", "center")  # "center", "diagonal", "header", "footer"
        opacity = request.get("opacity", 0.3)
        font_size = request.get("font_size", 50)
        color = request.get("color", "gray")  # "gray", "red", "blue"
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        from PyPDF2 import PdfReader, PdfWriter
        from reportlab.pdfgen import canvas as reportlab_canvas
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.colors import gray, red, blue, Color
        import io
        
        watermark_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        watermarked_filename = f"{base_name}_watermarked.pdf"
        output_path = os.path.join(PDF_OPERATIONS_DIR, f"{watermark_id}_{watermarked_filename}")
        
        # Create watermark PDF
        packet = io.BytesIO()
        c = reportlab_canvas.Canvas(packet, pagesize=letter)
        width, height = letter
        
        color_map = {"gray": Color(0.5, 0.5, 0.5, alpha=opacity), "red": Color(1, 0, 0, alpha=opacity), "blue": Color(0, 0, 1, alpha=opacity)}
        c.setFillColor(color_map.get(color, color_map["gray"]))
        c.setFont("Helvetica-Bold", font_size)
        
        if position == "center":
            c.drawCentredString(width/2, height/2, watermark_text)
        elif position == "diagonal":
            c.saveState()
            c.translate(width/2, height/2)
            c.rotate(45)
            c.drawCentredString(0, 0, watermark_text)
            c.restoreState()
        elif position == "header":
            c.drawCentredString(width/2, height - 50, watermark_text)
        elif position == "footer":
            c.drawCentredString(width/2, 50, watermark_text)
        
        c.save()
        packet.seek(0)
        
        watermark_pdf = PdfReader(packet)
        watermark_page = watermark_pdf.pages[0]
        
        reader = PdfReader(file_info["file_path"])
        writer = PdfWriter()
        
        for page in reader.pages:
            page.merge_page(watermark_page)
            writer.add_page(page)
        
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        file_storage[watermark_id] = {
            "file_id": watermark_id,
            "original_name": watermarked_filename,
            "file_path": output_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        logger.info(f"PDF watermark added: '{watermark_text}' at {position}")
        
        return {
            "watermark_id": watermark_id,
            "original_file": file_info["original_name"],
            "watermarked_file": watermarked_filename,
            "watermark_text": watermark_text,
            "position": position,
            "download_url": f"/api/download/{watermark_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF watermark error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF watermark failed: {str(e)}")

@api_router.post("/pdf/remove-pages")
async def remove_pages(request: dict):
    """Remove specific pages from PDF"""
    try:
        file_id = request.get("file_id")
        pages_to_remove = request.get("pages", [])  # List of page numbers to remove [1, 3, 5]
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if not pages_to_remove:
            raise HTTPException(status_code=400, detail="pages list is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        from PyPDF2 import PdfReader, PdfWriter
        
        remove_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        output_filename = f"{base_name}_pages_removed.pdf"
        output_path = os.path.join(PDF_OPERATIONS_DIR, f"{remove_id}_{output_filename}")
        
        reader = PdfReader(file_info["file_path"])
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        pages_to_remove_indices = set(p - 1 for p in pages_to_remove if 0 < p <= total_pages)
        
        pages_kept = 0
        for i, page in enumerate(reader.pages):
            if i not in pages_to_remove_indices:
                writer.add_page(page)
                pages_kept += 1
        
        if pages_kept == 0:
            raise HTTPException(status_code=400, detail="Cannot remove all pages from PDF")
        
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        file_storage[remove_id] = {
            "file_id": remove_id,
            "original_name": output_filename,
            "file_path": output_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        logger.info(f"PDF pages removed: {len(pages_to_remove_indices)} pages removed, {pages_kept} remaining")
        
        return {
            "remove_id": remove_id,
            "original_file": file_info["original_name"],
            "output_file": output_filename,
            "pages_removed": list(pages_to_remove_indices),
            "pages_remaining": pages_kept,
            "download_url": f"/api/download/{remove_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF remove pages error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF remove pages failed: {str(e)}")

@api_router.post("/pdf/reorder")
async def reorder_pages(request: dict):
    """Reorder pages in a PDF"""
    try:
        file_id = request.get("file_id")
        new_order = request.get("order", [])  # New page order [3, 1, 2, 4]
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if not new_order:
            raise HTTPException(status_code=400, detail="order list is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        from PyPDF2 import PdfReader, PdfWriter
        
        reorder_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        output_filename = f"{base_name}_reordered.pdf"
        output_path = os.path.join(PDF_OPERATIONS_DIR, f"{reorder_id}_{output_filename}")
        
        reader = PdfReader(file_info["file_path"])
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        
        # Validate new_order
        if len(set(new_order)) != len(new_order):
            raise HTTPException(status_code=400, detail="Page numbers in order must be unique")
        
        for page_num in new_order:
            if page_num < 1 or page_num > total_pages:
                raise HTTPException(status_code=400, detail=f"Invalid page number: {page_num}. PDF has {total_pages} pages.")
            writer.add_page(reader.pages[page_num - 1])
        
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        file_storage[reorder_id] = {
            "file_id": reorder_id,
            "original_name": output_filename,
            "file_path": output_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        logger.info(f"PDF pages reordered: new order {new_order}")
        
        return {
            "reorder_id": reorder_id,
            "original_file": file_info["original_name"],
            "output_file": output_filename,
            "new_order": new_order,
            "download_url": f"/api/download/{reorder_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF reorder error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF reorder failed: {str(e)}")

@api_router.post("/pdf/extract-text")
async def extract_text_from_pdf(request: dict):
    """Extract all text from a PDF"""
    try:
        file_id = request.get("file_id")
        output_format = request.get("format", "txt")  # "txt" or "json"
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        from PyPDF2 import PdfReader
        
        extract_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        
        reader = PdfReader(file_info["file_path"])
        
        pages_text = []
        full_text = ""
        
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            pages_text.append({
                "page_number": i + 1,
                "text": page_text,
                "word_count": len(page_text.split())
            })
            full_text += page_text + "\n\n"
        
        if output_format == "json":
            output_filename = f"{base_name}_text.json"
            output_path = os.path.join(PDF_OPERATIONS_DIR, f"{extract_id}_{output_filename}")
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump({
                    "source_file": file_info["original_name"],
                    "total_pages": len(reader.pages),
                    "total_words": len(full_text.split()),
                    "pages": pages_text
                }, f, indent=2, ensure_ascii=False)
            
            file_type = "json"
        else:
            output_filename = f"{base_name}_text.txt"
            output_path = os.path.join(PDF_OPERATIONS_DIR, f"{extract_id}_{output_filename}")
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(full_text)
            
            file_type = "txt"
        
        file_storage[extract_id] = {
            "file_id": extract_id,
            "original_name": output_filename,
            "file_path": output_path,
            "file_type": file_type,
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        logger.info(f"PDF text extracted: {len(reader.pages)} pages, {len(full_text.split())} words")
        
        return {
            "extract_id": extract_id,
            "original_file": file_info["original_name"],
            "output_file": output_filename,
            "total_pages": len(reader.pages),
            "total_words": len(full_text.split()),
            "download_url": f"/api/download/{extract_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF text extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF text extraction failed: {str(e)}")

@api_router.get("/pdf/info/{file_id}")
async def get_pdf_info(file_id: str):
    """Get detailed information about a PDF file"""
    try:
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        from PyPDF2 import PdfReader
        
        reader = PdfReader(file_info["file_path"])
        
        # Get metadata
        metadata = reader.metadata
        
        # Get page info
        pages_info = []
        for i, page in enumerate(reader.pages):
            media_box = page.mediabox
            pages_info.append({
                "page_number": i + 1,
                "width": float(media_box.width),
                "height": float(media_box.height),
                "rotation": page.get("/Rotate", 0)
            })
        
        return {
            "file_id": file_id,
            "filename": file_info["original_name"],
            "file_size": file_info["file_size"],
            "total_pages": len(reader.pages),
            "metadata": {
                "title": metadata.get("/Title", "N/A") if metadata else "N/A",
                "author": metadata.get("/Author", "N/A") if metadata else "N/A",
                "subject": metadata.get("/Subject", "N/A") if metadata else "N/A",
                "creator": metadata.get("/Creator", "N/A") if metadata else "N/A",
                "producer": metadata.get("/Producer", "N/A") if metadata else "N/A",
                "creation_date": str(metadata.get("/CreationDate", "N/A")) if metadata else "N/A",
                "modification_date": str(metadata.get("/ModDate", "N/A")) if metadata else "N/A"
            },
            "is_encrypted": reader.is_encrypted,
            "pages": pages_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF info error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get PDF info: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

# Include Stripe webhook router
app.include_router(stripe_webhook.router, prefix="/api", tags=["Stripe Webhooks"])

# Add CORS middleware with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Start background cleanup task and connect to databases"""
    # Connect to PostgreSQL (Supabase)
    await postgres_db.connect()
    # Start file cleanup task
    asyncio.create_task(cleanup_old_files())

@app.on_event("shutdown")
async def shutdown_db_client():
    # Close MongoDB connection
    client.close()
    # Close PostgreSQL connection
    await postgres_db.disconnect()
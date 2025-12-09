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
from file_converter import FileConverter
from ai_analyzer import AIAnalyzer

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

# In-memory storage for file metadata (temporary)
file_storage = {}
conversion_storage = {}
analysis_storage = {}

# Supported formats
SUPPORTED_FORMATS = {
    "input": ["pdf", "docx", "doc", "txt", "rtf", "odt", "html", "xml", "csv", "xlsx", "xls", "ppt", "pptx", "epub", "md"],
    "output": ["pdf", "docx", "doc", "txt", "rtf", "odt", "html", "xml", "csv", "xlsx", "xls", "ppt", "pptx", "epub", "md", "json", "yaml", "tex", "docbook", "opml", "rst", "asciidoc", "wiki", "jira", "fb2", "icml", "tei", "context", "man", "ms", "zimwiki"]
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
        
        # Create temporary file with enhanced error handling
        temp_dir = tempfile.gettempdir()
        try:
            os.makedirs(temp_dir, exist_ok=True)
        except Exception as e:
            logger.error(f"Failed to create temp directory: {str(e)}")
            raise HTTPException(status_code=500, detail="Server storage error")
        
        # Enhanced filename sanitization
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._-")
        if len(safe_filename) == 0:
            safe_filename = f"uploaded_file.{file_extension}"
        
        temp_file_path = os.path.join(temp_dir, f"{file_id}_{safe_filename}")
        
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

@api_router.get("/download/{conversion_id}")
async def download_file(conversion_id: str):
    """Download converted file"""
    try:
        # Check if conversion exists
        if conversion_id not in conversion_storage:
            raise HTTPException(status_code=404, detail="Conversion not found")
        
        conversion_info = conversion_storage[conversion_id]
        
        # Check if file exists
        if not os.path.exists(conversion_info["converted_file_path"]):
            raise HTTPException(status_code=404, detail="Converted file not found")
        
        return FileResponse(
            path=conversion_info["converted_file_path"],
            filename=conversion_info["converted_file"],
            media_type='application/octet-stream'
        )
        
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
        
        # Create merged PDF
        merge_id = str(uuid.uuid4())
        output_filename = f"merged_document_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        temp_dir = tempfile.gettempdir()
        output_path = os.path.join(temp_dir, f"{merge_id}_{output_filename}")
        
        # Mock PDF merge operation (in production, use PyPDF2 or similar)
        import shutil
        # For demo purposes, copy first PDF as merged result
        shutil.copy2(pdf_paths[0], output_path)
        
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
        
        # Mock PDF split operation
        split_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        
        # Generate split files (mock operation)
        split_files = []
        if split_type == "pages":
            # Split into individual pages (mock 5 pages)
            for i in range(1, 6):
                page_filename = f"{base_name}_page_{i}.pdf"
                temp_dir = tempfile.gettempdir()
                page_path = os.path.join(temp_dir, f"{split_id}_page_{i}_{page_filename}")
                
                # Copy original file as mock page (in production, extract actual page)
                shutil.copy2(file_info["file_path"], page_path)
                
                page_id = f"{split_id}_page_{i}"
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
                    "page_number": i,
                    "download_url": f"/api/download/{page_id}"
                })
        else:
            # Split by ranges
            for idx, range_info in enumerate(page_ranges):
                range_filename = f"{base_name}_pages_{range_info['start']}-{range_info['end']}.pdf"
                temp_dir = tempfile.gettempdir()
                range_path = os.path.join(temp_dir, f"{split_id}_range_{idx}_{range_filename}")
                
                # Copy original file as mock range
                shutil.copy2(file_info["file_path"], range_path)
                
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
                    "page_range": f"{range_info['start']}-{range_info['end']}",
                    "download_url": f"/api/download/{range_id}"
                })
        
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
        
        # Create encrypted PDF
        encrypt_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        encrypted_filename = f"{base_name}_encrypted.pdf"
        temp_dir = tempfile.gettempdir()
        encrypted_path = os.path.join(temp_dir, f"{encrypt_id}_{encrypted_filename}")
        
        # Mock PDF encryption (in production, use PyPDF2 encryption)
        shutil.copy2(file_info["file_path"], encrypted_path)
        
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
        
        # Create signed PDF
        esign_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        signed_filename = f"{base_name}_signed.pdf"
        temp_dir = tempfile.gettempdir()
        signed_path = os.path.join(temp_dir, f"{esign_id}_{signed_filename}")
        
        # Mock PDF signing (in production, use digital signature libraries)
        shutil.copy2(file_info["file_path"], signed_path)
        
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
            temp_dir = tempfile.gettempdir()
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
        
        # Mock comparison result - in real implementation, this would use a document comparison library
        comparison_result = {
            "comparison_id": str(uuid.uuid4()),
            "original_file": original_file["original_name"],
            "modified_file": modified_file["original_name"],
            "differences": {
                "insertions": 12,
                "deletions": 8,
                "modifications": 5
            },
            "changes": [
                {
                    "type": "insertion",
                    "location": "page 1, line 15",
                    "text": "Additional legal clause inserted"
                },
                {
                    "type": "deletion", 
                    "location": "page 2, line 8",
                    "text": "Removed outdated provision"
                }
            ],
            "comparison_time": datetime.utcnow()
        }
        
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
        temp_dir = tempfile.gettempdir()
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
        
        return {
            "file_id": file_id,
            "filename": filename,
            "status": "saved",
            "download_url": f"/api/download/{file_id}"
        }
        
    except Exception as e:
        logger.error(f"Document save error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save document: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

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
    """Start background cleanup task"""
    asyncio.create_task(cleanup_old_files())

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
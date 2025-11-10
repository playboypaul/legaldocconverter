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

# Add file size limit middleware
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB limit

async def validate_file_size(request: Request, call_next):
    """Middleware to validate file size before processing"""
    try:
        if request.url.path == "/api/upload" and request.method == "POST":
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > MAX_FILE_SIZE:
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=413,
                    content={"detail": f"File too large. Maximum size allowed is {MAX_FILE_SIZE // (1024*1024)}MB"}
                )
        
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"File size validation error: {str(e)}")
        return await call_next(request)

app.middleware("http")(validate_file_size)

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
    "input": ["pdf", "docx", "doc", "txt", "rtf", "odt"],
    "output": ["pdf", "docx", "doc", "txt", "rtf", "odt", "html"]
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
    """Upload a document for processing"""
    try:
        # Validate file exists
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Validate file size
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size allowed is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Validate file type
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if file_extension not in SUPPORTED_FORMATS["input"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Supported formats: {', '.join(SUPPORTED_FORMATS['input'])}"
            )
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Create temporary file with better error handling
        temp_dir = tempfile.gettempdir()
        os.makedirs(temp_dir, exist_ok=True)
        
        # Sanitize filename to prevent path traversal
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._-")
        temp_file_path = os.path.join(temp_dir, f"{file_id}_{safe_filename}")
        
        # Save uploaded file with atomic write
        try:
            async with aiofiles.open(temp_file_path, 'wb') as f:
                await f.write(file_content)
                
            # Verify file was written correctly
            if not os.path.exists(temp_file_path):
                raise Exception("Failed to save uploaded file")
                
            actual_size = os.path.getsize(temp_file_path)
            if actual_size != file_size:
                raise Exception(f"File size mismatch: expected {file_size}, got {actual_size}")
                
        except Exception as e:
            # Cleanup on failure
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except:
                    pass
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

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
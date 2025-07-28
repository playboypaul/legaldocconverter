from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
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
app = FastAPI()

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
        # Validate file type
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in SUPPORTED_FORMATS["input"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Supported formats: {', '.join(SUPPORTED_FORMATS['input'])}"
            )
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Create temporary file
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, f"{file_id}_{file.filename}")
        
        # Save uploaded file
        async with aiofiles.open(temp_file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Store file metadata
        file_info = {
            "file_id": file_id,
            "original_name": file.filename,
            "file_path": temp_file_path,
            "file_type": file_extension,
            "file_size": len(content),
            "upload_time": datetime.utcnow(),
            "supported_conversions": [fmt for fmt in SUPPORTED_FORMATS["output"] if fmt != file_extension]
        }
        
        file_storage[file_id] = file_info
        
        logger.info(f"File uploaded: {file.filename} with ID: {file_id}")
        
        return FileUploadResponse(
            file_id=file_id,
            original_name=file.filename,
            file_type=file_extension,
            file_size=len(content),
            supported_conversions=file_info["supported_conversions"]
        )
        
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
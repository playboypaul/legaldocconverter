"""
Document conversion routes
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
import os
import uuid
import logging
import aiofiles
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Conversion"])

# These will be injected from server.py
file_storage = {}
conversion_storage = {}
file_converter = None
SUPPORTED_FORMATS = {}
UPLOADS_DIR = ""
CONVERSIONS_DIR = ""

def init_conversion_routes(storage, conv_storage, converter, formats, uploads_dir, conversions_dir, save_func):
    """Initialize routes with shared dependencies"""
    global file_storage, conversion_storage, file_converter, SUPPORTED_FORMATS, UPLOADS_DIR, CONVERSIONS_DIR, save_storage
    file_storage = storage
    conversion_storage = conv_storage
    file_converter = converter
    SUPPORTED_FORMATS = formats
    UPLOADS_DIR = uploads_dir
    CONVERSIONS_DIR = conversions_dir
    save_storage = save_func

# Models
class ConversionRequest(BaseModel):
    file_id: str
    target_format: str

class ConversionResponse(BaseModel):
    conversion_id: str
    status: str
    download_url: str
    original_file: str
    converted_file: str

@router.post("/convert", response_model=ConversionResponse)
async def convert_file(request: ConversionRequest):
    """Convert a document to specified format"""
    try:
        file_id = request.file_id
        target_format = request.target_format.lower()
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        
        if target_format not in SUPPORTED_FORMATS["output"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported output format. Supported: {', '.join(SUPPORTED_FORMATS['output'])}"
            )
        
        # Perform conversion
        conversion_id = str(uuid.uuid4())
        converted_filename = f"{file_info['original_name'].rsplit('.', 1)[0]}.{target_format}"
        output_path = os.path.join(CONVERSIONS_DIR, f"{conversion_id}_{converted_filename}")
        
        # Use file converter
        success = await file_converter.convert(
            input_path=file_info["file_path"],
            output_path=output_path,
            source_format=file_info["file_type"],
            target_format=target_format
        )
        
        if not success or not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Conversion failed")
        
        # Store conversion metadata
        conversion_info = {
            "conversion_id": conversion_id,
            "original_file_id": file_id,
            "original_file": file_info["original_name"],
            "converted_file": converted_filename,
            "file_path": output_path,
            "file_type": target_format,
            "file_size": os.path.getsize(output_path),
            "conversion_time": datetime.utcnow()
        }
        
        conversion_storage[conversion_id] = conversion_info
        
        # Also store as a file for download
        file_storage[conversion_id] = {
            "file_id": conversion_id,
            "original_name": converted_filename,
            "file_path": output_path,
            "file_type": target_format,
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        logger.info(f"Conversion completed: {file_info['original_name']} -> {converted_filename}")
        
        return ConversionResponse(
            conversion_id=conversion_id,
            status="completed",
            download_url=f"/api/download/{conversion_id}",
            original_file=file_info["original_name"],
            converted_file=converted_filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Conversion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.post("/batch-convert")
async def batch_convert(request: dict):
    """Convert multiple files to target format"""
    try:
        file_ids = request.get("file_ids", [])
        target_format = request.get("target_format")
        
        if not file_ids or not target_format:
            raise HTTPException(status_code=400, detail="Missing file_ids or target_format")
        
        results = []
        for fid in file_ids:
            try:
                if fid not in file_storage:
                    results.append({"file_id": fid, "status": "error", "error": "File not found"})
                    continue
                
                # Convert each file
                conv_req = ConversionRequest(file_id=fid, target_format=target_format)
                result = await convert_file(conv_req)
                results.append({
                    "file_id": fid,
                    "status": "success",
                    "conversion_id": result.conversion_id,
                    "download_url": result.download_url
                })
            except Exception as e:
                results.append({"file_id": fid, "status": "error", "error": str(e)})
        
        return {"results": results}
        
    except Exception as e:
        logger.error(f"Batch conversion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch conversion failed: {str(e)}")

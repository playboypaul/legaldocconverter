"""
OCR (Optical Character Recognition) routes for scanned documents
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import logging
import aiofiles
from datetime import datetime
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import io
import tempfile

logger = logging.getLogger(__name__)

router = APIRouter(tags=["OCR"])

# Storage - will be injected
file_storage = {}
CONVERSIONS_DIR = ""

def init_ocr_routes(f_storage, conv_dir, save_func):
    """Initialize routes with shared dependencies"""
    global file_storage, CONVERSIONS_DIR, save_storage
    file_storage = f_storage
    CONVERSIONS_DIR = conv_dir
    save_storage = save_func


class OCRRequest(BaseModel):
    file_id: str
    language: str = "eng"  # Tesseract language code
    enhance_image: bool = True
    output_format: str = "txt"  # txt, docx, pdf


class OCRResult(BaseModel):
    ocr_id: str
    file_id: str
    status: str
    text: Optional[str] = None
    pages: int = 0
    word_count: int = 0
    confidence: float = 0.0
    download_url: Optional[str] = None


# Track OCR jobs
ocr_jobs = {}


def preprocess_image(image: Image.Image) -> Image.Image:
    """Preprocess image for better OCR accuracy"""
    # Convert to grayscale
    if image.mode != 'L':
        image = image.convert('L')
    
    # Enhance contrast using simple thresholding
    # This helps with scanned documents
    threshold = 128
    image = image.point(lambda p: 255 if p > threshold else 0)
    
    return image


def perform_ocr_on_image(image: Image.Image, language: str = "eng", enhance: bool = True) -> Dict[str, Any]:
    """Perform OCR on a single image"""
    if enhance:
        image = preprocess_image(image)
    
    # Get detailed OCR data including confidence
    data = pytesseract.image_to_data(image, lang=language, output_type=pytesseract.Output.DICT)
    
    # Extract text
    text = pytesseract.image_to_string(image, lang=language)
    
    # Calculate average confidence (excluding empty entries)
    confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    
    # Count words
    word_count = len([w for w in data['text'] if w.strip()])
    
    return {
        'text': text,
        'word_count': word_count,
        'confidence': avg_confidence
    }


def perform_ocr_on_pdf(pdf_path: str, language: str = "eng", enhance: bool = True) -> Dict[str, Any]:
    """Perform OCR on a PDF file"""
    # Convert PDF to images
    try:
        images = convert_from_path(pdf_path, dpi=300)
    except Exception as e:
        logger.error(f"Failed to convert PDF to images: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to convert PDF: {str(e)}")
    
    all_text = []
    total_words = 0
    total_confidence = 0
    
    for i, image in enumerate(images):
        result = perform_ocr_on_image(image, language, enhance)
        all_text.append(f"--- Page {i + 1} ---\n{result['text']}")
        total_words += result['word_count']
        total_confidence += result['confidence']
    
    avg_confidence = total_confidence / len(images) if images else 0
    
    return {
        'text': '\n\n'.join(all_text),
        'pages': len(images),
        'word_count': total_words,
        'confidence': round(avg_confidence, 2)
    }


@router.post("/ocr/extract")
async def extract_text_ocr(request: OCRRequest):
    """Extract text from scanned PDF or image using OCR"""
    try:
        file_id = request.file_id
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        file_type = file_info["file_type"].lower()
        
        # Supported formats
        supported_types = ['pdf', 'png', 'jpg', 'jpeg', 'tiff', 'bmp', 'gif']
        if file_type not in supported_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type for OCR. Supported: {', '.join(supported_types)}"
            )
        
        ocr_id = str(uuid.uuid4())
        
        # Update job status
        ocr_jobs[ocr_id] = {
            'status': 'processing',
            'file_id': file_id,
            'started_at': datetime.utcnow().isoformat()
        }
        
        # Perform OCR based on file type
        if file_type == 'pdf':
            result = perform_ocr_on_pdf(
                file_info["file_path"], 
                request.language, 
                request.enhance_image
            )
        else:
            # Image file
            image = Image.open(file_info["file_path"])
            ocr_result = perform_ocr_on_image(image, request.language, request.enhance_image)
            result = {
                'text': ocr_result['text'],
                'pages': 1,
                'word_count': ocr_result['word_count'],
                'confidence': round(ocr_result['confidence'], 2)
            }
        
        # Save extracted text to file
        output_filename = f"ocr_{file_info['original_name'].rsplit('.', 1)[0]}.txt"
        output_path = os.path.join(CONVERSIONS_DIR, f"{ocr_id}_{output_filename}")
        
        async with aiofiles.open(output_path, 'w', encoding='utf-8') as f:
            await f.write(result['text'])
        
        # Store file info
        file_storage[ocr_id] = {
            "file_id": ocr_id,
            "original_name": output_filename,
            "file_path": output_path,
            "file_type": "txt",
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow(),
            "ocr_source": file_id
        }
        save_storage()
        
        # Update job status
        ocr_jobs[ocr_id] = {
            'status': 'completed',
            'file_id': file_id,
            'completed_at': datetime.utcnow().isoformat()
        }
        
        logger.info(f"OCR completed: {file_info['original_name']} -> {result['word_count']} words extracted")
        
        return {
            "ocr_id": ocr_id,
            "file_id": file_id,
            "status": "completed",
            "text": result['text'][:5000] if len(result['text']) > 5000 else result['text'],  # Truncate for response
            "text_truncated": len(result['text']) > 5000,
            "full_text_length": len(result['text']),
            "pages": result['pages'],
            "word_count": result['word_count'],
            "confidence": result['confidence'],
            "download_url": f"/api/download/{ocr_id}",
            "language": request.language
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR error: {str(e)}")
        if ocr_id in ocr_jobs:
            ocr_jobs[ocr_id]['status'] = 'failed'
            ocr_jobs[ocr_id]['error'] = str(e)
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")


@router.get("/ocr/status/{ocr_id}")
async def get_ocr_status(ocr_id: str):
    """Get the status of an OCR job"""
    if ocr_id not in ocr_jobs:
        raise HTTPException(status_code=404, detail="OCR job not found")
    
    return ocr_jobs[ocr_id]


@router.get("/ocr/languages")
async def get_supported_languages():
    """Get list of supported OCR languages"""
    # Common languages supported by Tesseract
    languages = {
        "eng": "English",
        "fra": "French",
        "deu": "German",
        "spa": "Spanish",
        "ita": "Italian",
        "por": "Portuguese",
        "nld": "Dutch",
        "pol": "Polish",
        "rus": "Russian",
        "jpn": "Japanese",
        "chi_sim": "Chinese (Simplified)",
        "chi_tra": "Chinese (Traditional)",
        "kor": "Korean",
        "ara": "Arabic",
        "hin": "Hindi"
    }
    
    # Check which languages are actually installed
    try:
        installed = pytesseract.get_languages()
        available = {k: v for k, v in languages.items() if k in installed}
    except:
        available = {"eng": "English"}  # Default fallback
    
    return {
        "available_languages": available,
        "default": "eng",
        "note": "Additional languages can be installed on request"
    }


@router.post("/ocr/batch")
async def batch_ocr(request: dict):
    """Perform OCR on multiple files"""
    try:
        file_ids = request.get("file_ids", [])
        language = request.get("language", "eng")
        enhance = request.get("enhance_image", True)
        
        if not file_ids:
            raise HTTPException(status_code=400, detail="No file_ids provided")
        
        results = []
        for fid in file_ids:
            try:
                ocr_request = OCRRequest(
                    file_id=fid,
                    language=language,
                    enhance_image=enhance
                )
                result = await extract_text_ocr(ocr_request)
                results.append({
                    "file_id": fid,
                    "status": "success",
                    "ocr_id": result["ocr_id"],
                    "word_count": result["word_count"],
                    "confidence": result["confidence"]
                })
            except Exception as e:
                results.append({
                    "file_id": fid,
                    "status": "error",
                    "error": str(e)
                })
        
        return {
            "total": len(file_ids),
            "successful": len([r for r in results if r["status"] == "success"]),
            "failed": len([r for r in results if r["status"] == "error"]),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch OCR error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch OCR failed: {str(e)}")


@router.post("/ocr/searchable-pdf")
async def create_searchable_pdf(request: dict):
    """Convert scanned PDF to searchable PDF with text layer"""
    try:
        file_id = request.get("file_id")
        language = request.get("language", "eng")
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Generate searchable PDF using Tesseract's PDF output
        searchable_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        output_filename = f"{base_name}_searchable.pdf"
        output_path = os.path.join(CONVERSIONS_DIR, f"{searchable_id}_{output_filename}")
        
        # Convert PDF pages to images and run OCR to create searchable PDF
        images = convert_from_path(file_info["file_path"], dpi=300)
        
        # Create a temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            pdf_pages = []
            
            for i, image in enumerate(images):
                # Save image temporarily
                img_path = os.path.join(temp_dir, f"page_{i}.png")
                image.save(img_path, 'PNG')
                
                # Create searchable PDF page
                pdf_page_path = os.path.join(temp_dir, f"page_{i}")
                pdf_data = pytesseract.image_to_pdf_or_hocr(image, lang=language, extension='pdf')
                
                page_pdf_path = os.path.join(temp_dir, f"page_{i}.pdf")
                with open(page_pdf_path, 'wb') as f:
                    f.write(pdf_data)
                pdf_pages.append(page_pdf_path)
            
            # Merge all PDF pages using PyPDF2
            from PyPDF2 import PdfMerger
            merger = PdfMerger()
            
            for page_pdf in pdf_pages:
                merger.append(page_pdf)
            
            merger.write(output_path)
            merger.close()
        
        # Store file info
        file_storage[searchable_id] = {
            "file_id": searchable_id,
            "original_name": output_filename,
            "file_path": output_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow(),
            "searchable": True,
            "source_file": file_id
        }
        save_storage()
        
        logger.info(f"Searchable PDF created: {output_filename}")
        
        return {
            "searchable_id": searchable_id,
            "original_file": file_info["original_name"],
            "output_file": output_filename,
            "pages": len(images),
            "download_url": f"/api/download/{searchable_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Searchable PDF error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create searchable PDF: {str(e)}")

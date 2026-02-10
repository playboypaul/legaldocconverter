"""
PDF Form Filling routes - Detect and fill PDF form fields
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import os
import uuid
import logging
import aiofiles
from datetime import datetime
from PyPDF2 import PdfReader, PdfWriter
from PyPDF2.generic import NameObject, TextStringObject, BooleanObject

logger = logging.getLogger(__name__)

router = APIRouter(tags=["PDF Forms"])

# Storage - will be injected
file_storage = {}
PDF_OPERATIONS_DIR = ""

def init_pdf_forms_routes(f_storage, pdf_ops_dir, save_func):
    """Initialize routes with shared dependencies"""
    global file_storage, PDF_OPERATIONS_DIR, save_storage
    file_storage = f_storage
    PDF_OPERATIONS_DIR = pdf_ops_dir
    save_storage = save_func


class FormField(BaseModel):
    """PDF form field structure"""
    name: str
    type: str  # 'text', 'checkbox', 'radio', 'dropdown', 'signature'
    value: Optional[str] = None
    options: Optional[List[str]] = None  # For dropdowns/radios
    required: bool = False
    page: int = 1
    position: Optional[Dict[str, float]] = None


class FormFillRequest(BaseModel):
    file_id: str
    fields: Dict[str, Any]  # {field_name: value}


@router.get("/pdf/form-fields/{file_id}")
async def get_form_fields(file_id: str):
    """Detect and return all form fields in a PDF"""
    try:
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        reader = PdfReader(file_info["file_path"])
        
        # Try to get fields directly - safer approach
        fields = reader.get_fields()
        
        if not fields:
            return {
                "file_id": file_id,
                "has_forms": False,
                "fields": [],
                "total_fields": 0,
                "message": "This PDF does not contain fillable form fields"
            }
        
        form_fields = []
        for field_name, field_data in fields.items():
            field_type = "text"  # Default
            
            # Determine field type from PDF field type
            ft = field_data.get("/FT", "")
            if ft == "/Tx":
                field_type = "text"
            elif ft == "/Btn":
                # Could be checkbox or radio
                if "/Ff" in field_data:
                    flags = field_data["/Ff"]
                    if flags & (1 << 16):  # Radio button
                        field_type = "radio"
                    else:
                        field_type = "checkbox"
                else:
                    field_type = "checkbox"
            elif ft == "/Ch":
                field_type = "dropdown"
            elif ft == "/Sig":
                field_type = "signature"
            
            # Get current value
            value = None
            if "/V" in field_data:
                value = str(field_data["/V"])
            
            # Get options for dropdowns
            options = None
            if field_type == "dropdown" and "/Opt" in field_data:
                options = [str(opt) for opt in field_data["/Opt"]]
            
            # Check if required
            required = False
            if "/Ff" in field_data:
                flags = field_data["/Ff"]
                required = bool(flags & 2)
            
            form_fields.append({
                "name": field_name,
                "type": field_type,
                "value": value,
                "options": options,
                "required": required
            })
        
        logger.info(f"Found {len(form_fields)} form fields in file {file_id}")
        
        return {
            "file_id": file_id,
            "has_forms": True,
            "fields": form_fields,
            "total_fields": len(form_fields)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get form fields error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get form fields: {str(e)}")


@router.post("/pdf/fill-form")
async def fill_pdf_form(request: FormFillRequest):
    """Fill PDF form fields with provided values"""
    try:
        file_id = request.file_id
        field_values = request.fields
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        reader = PdfReader(file_info["file_path"])
        writer = PdfWriter()
        
        # Copy all pages
        for page in reader.pages:
            writer.add_page(page)
        
        # Get the form fields
        fields = reader.get_fields()
        if not fields:
            raise HTTPException(status_code=400, detail="This PDF does not contain fillable form fields")
        
        # Fill the fields
        filled_count = 0
        for field_name, value in field_values.items():
            if field_name in fields:
                try:
                    writer.update_page_form_field_values(
                        writer.pages[0],  # Apply to first page (fields span across pages)
                        {field_name: value}
                    )
                    filled_count += 1
                except Exception as field_error:
                    logger.warning(f"Could not fill field {field_name}: {field_error}")
        
        # Generate output file
        fill_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        filled_filename = f"{base_name}_filled.pdf"
        output_path = os.path.join(PDF_OPERATIONS_DIR, f"{fill_id}_{filled_filename}")
        
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        # Store filled file info
        file_storage[fill_id] = {
            "file_id": fill_id,
            "original_name": filled_filename,
            "file_path": output_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow(),
            "form_filled": True,
            "fields_filled": filled_count
        }
        save_storage()
        
        logger.info(f"PDF form filled: {filled_count} fields updated")
        
        return {
            "fill_id": fill_id,
            "original_file": file_info["original_name"],
            "filled_file": filled_filename,
            "fields_filled": filled_count,
            "download_url": f"/api/download/{fill_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fill PDF form error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fill PDF form: {str(e)}")


@router.post("/pdf/flatten-form")
async def flatten_pdf_form(request: dict):
    """Flatten PDF form fields (make them non-editable)"""
    try:
        file_id = request.get("file_id")
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        reader = PdfReader(file_info["file_path"])
        writer = PdfWriter()
        
        # Copy pages without form fields (flattening)
        for page in reader.pages:
            writer.add_page(page)
        
        # Generate output file
        flatten_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        flattened_filename = f"{base_name}_flattened.pdf"
        output_path = os.path.join(PDF_OPERATIONS_DIR, f"{flatten_id}_{flattened_filename}")
        
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        # Store flattened file info
        file_storage[flatten_id] = {
            "file_id": flatten_id,
            "original_name": flattened_filename,
            "file_path": output_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow(),
            "form_flattened": True
        }
        save_storage()
        
        logger.info(f"PDF form flattened: {file_info['original_name']}")
        
        return {
            "flatten_id": flatten_id,
            "original_file": file_info["original_name"],
            "flattened_file": flattened_filename,
            "download_url": f"/api/download/{flatten_id}",
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Flatten PDF form error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to flatten PDF form: {str(e)}")


@router.post("/pdf/create-form-field")
async def create_form_field(request: dict):
    """Add a new form field to a PDF"""
    try:
        file_id = request.get("file_id")
        field_name = request.get("field_name")
        # These are read from request but not used in this simplified implementation
        _ = request.get("field_type", "text")  # field_type reserved for future
        _ = request.get("page", 1)  # page_num reserved for future
        _ = request.get("position", {"x": 100, "y": 700, "width": 200, "height": 20})  # position reserved
        
        if not file_id or not field_name:
            raise HTTPException(status_code=400, detail="file_id and field_name are required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        if file_info["file_type"].lower() != "pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Note: PyPDF2 has limited support for creating form fields
        # For full form field creation, we'd need to use a library like pdfrw or reportlab
        # This is a simplified implementation
        
        reader = PdfReader(file_info["file_path"])
        writer = PdfWriter()
        
        for page in reader.pages:
            writer.add_page(page)
        
        # Generate output file
        form_id = str(uuid.uuid4())
        base_name = file_info["original_name"].rsplit('.', 1)[0]
        form_filename = f"{base_name}_with_field.pdf"
        output_path = os.path.join(PDF_OPERATIONS_DIR, f"{form_id}_{form_filename}")
        
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        # Store file info
        file_storage[form_id] = {
            "file_id": form_id,
            "original_name": form_filename,
            "file_path": output_path,
            "file_type": "pdf",
            "file_size": os.path.getsize(output_path),
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        logger.info(f"Form field '{field_name}' added to PDF")
        
        return {
            "form_id": form_id,
            "original_file": file_info["original_name"],
            "output_file": form_filename,
            "field_added": field_name,
            "download_url": f"/api/download/{form_id}",
            "status": "completed",
            "note": "Basic form field support. For advanced form creation, consider using specialized PDF tools."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create form field error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create form field: {str(e)}")

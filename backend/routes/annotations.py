"""
Document annotation routes - Enhanced with visual annotation support
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import json
import logging
import aiofiles
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Annotations"])

# Storage - will be injected
annotation_storage = {}
file_storage = {}
CONVERSIONS_DIR = ""

def init_annotation_routes(ann_storage, f_storage, conv_dir, save_func):
    """Initialize routes with shared dependencies"""
    global annotation_storage, file_storage, CONVERSIONS_DIR, save_storage
    annotation_storage = ann_storage
    file_storage = f_storage
    CONVERSIONS_DIR = conv_dir
    save_storage = save_func


# Enhanced Annotation Models
class AnnotationPosition(BaseModel):
    """Position for visual annotations on PDF"""
    page: int = 1
    x: float = 0
    y: float = 0
    width: Optional[float] = None
    height: Optional[float] = None
    # For text selection annotations
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None

class DrawingPath(BaseModel):
    """Path for freehand drawing annotations"""
    points: List[Dict[str, float]]  # [{x: 0, y: 0}, ...]
    stroke_width: float = 2
    stroke_color: str = "#FF0000"

class VisualAnnotation(BaseModel):
    """Enhanced annotation with visual properties"""
    file_id: str
    type: str  # 'highlight', 'underline', 'strikethrough', 'text_box', 'drawing', 'shape', 'comment', 'sticky_note'
    text: Optional[str] = None
    position: AnnotationPosition
    color: str = "#FFFF00"
    opacity: float = 0.5
    # For drawings/shapes
    drawing_path: Optional[DrawingPath] = None
    shape_type: Optional[str] = None  # 'rectangle', 'circle', 'arrow', 'line'
    # Metadata
    author: str = "Anonymous"
    created_at: Optional[str] = None
    reply_to: Optional[str] = None  # For threaded comments


class AnnotationResponse(BaseModel):
    annotation_id: str
    file_id: str
    type: str
    status: str


@router.post("/annotate")
async def add_annotation(request: dict):
    """Add annotation to a document (legacy support)"""
    try:
        file_id = request.get("file_id")
        annotation = request.get("annotation")
        
        if not file_id or not annotation:
            raise HTTPException(status_code=400, detail="file_id and annotation are required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        if file_id not in annotation_storage:
            annotation_storage[file_id] = []
        
        annotation_id = str(uuid.uuid4())
        annotation_data = {
            "annotation_id": annotation_id,
            "file_id": file_id,
            "type": annotation.get("type", "comment"),
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
            "file_id": file_id,
            "status": "created"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add annotation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add annotation: {str(e)}")


@router.post("/annotations/visual")
async def add_visual_annotation(annotation: VisualAnnotation):
    """Add enhanced visual annotation with precise positioning"""
    try:
        file_id = annotation.file_id
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        if file_id not in annotation_storage:
            annotation_storage[file_id] = []
        
        annotation_id = str(uuid.uuid4())
        
        # Convert to dict and add metadata
        annotation_data = {
            "annotation_id": annotation_id,
            "file_id": file_id,
            "type": annotation.type,
            "text": annotation.text,
            "position": annotation.position.dict(),
            "color": annotation.color,
            "opacity": annotation.opacity,
            "drawing_path": annotation.drawing_path.dict() if annotation.drawing_path else None,
            "shape_type": annotation.shape_type,
            "author": annotation.author,
            "created_at": annotation.created_at or datetime.utcnow().isoformat(),
            "reply_to": annotation.reply_to,
            "is_visual": True  # Flag for enhanced annotations
        }
        
        annotation_storage[file_id].append(annotation_data)
        
        logger.info(f"Visual annotation added: {annotation.type} on page {annotation.position.page}")
        
        return {
            "annotation_id": annotation_id,
            "file_id": file_id,
            "type": annotation.type,
            "status": "created"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add visual annotation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add visual annotation: {str(e)}")


@router.get("/annotations/{file_id}")
async def get_annotations(file_id: str):
    """Get all annotations for a document"""
    try:
        annotations = annotation_storage.get(file_id, [])
        
        return {
            "file_id": file_id,
            "annotations": annotations,
            "total": len(annotations)
        }
        
    except Exception as e:
        logger.error(f"Get annotations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get annotations: {str(e)}")


@router.get("/annotations/{file_id}/page/{page_num}")
async def get_page_annotations(file_id: str, page_num: int):
    """Get annotations for a specific page"""
    try:
        all_annotations = annotation_storage.get(file_id, [])
        
        # Filter by page
        page_annotations = [
            ann for ann in all_annotations 
            if ann.get("position", {}).get("page", ann.get("page", 1)) == page_num
        ]
        
        return {
            "file_id": file_id,
            "page": page_num,
            "annotations": page_annotations,
            "total": len(page_annotations)
        }
        
    except Exception as e:
        logger.error(f"Get page annotations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get page annotations: {str(e)}")


@router.put("/annotations/{annotation_id}")
async def update_annotation(annotation_id: str, update_data: dict):
    """Update an existing annotation"""
    try:
        for file_id, annotations in annotation_storage.items():
            for i, ann in enumerate(annotations):
                if ann["annotation_id"] == annotation_id:
                    # Update allowed fields
                    if "text" in update_data:
                        ann["text"] = update_data["text"]
                    if "color" in update_data:
                        ann["color"] = update_data["color"]
                    if "position" in update_data:
                        ann["position"] = update_data["position"]
                    if "opacity" in update_data:
                        ann["opacity"] = update_data["opacity"]
                    
                    ann["updated_at"] = datetime.utcnow().isoformat()
                    annotation_storage[file_id][i] = ann
                    
                    logger.info(f"Annotation {annotation_id} updated")
                    return {"annotation_id": annotation_id, "status": "updated"}
        
        raise HTTPException(status_code=404, detail="Annotation not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update annotation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update annotation: {str(e)}")


@router.delete("/annotations/{annotation_id}")
async def delete_annotation(annotation_id: str):
    """Delete a specific annotation"""
    try:
        for file_id, annotations in annotation_storage.items():
            for i, annotation in enumerate(annotations):
                if annotation["annotation_id"] == annotation_id:
                    del annotation_storage[file_id][i]
                    logger.info(f"Annotation {annotation_id} deleted from file {file_id}")
                    return {"annotation_id": annotation_id, "status": "deleted"}
        
        raise HTTPException(status_code=404, detail="Annotation not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete annotation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete annotation: {str(e)}")


@router.post("/annotations/export")
async def export_annotations(request: dict):
    """Export annotations to a file"""
    try:
        file_id = request.get("file_id")
        export_format = request.get("format", "json")  # json, pdf, txt
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        annotations = annotation_storage.get(file_id, [])
        
        if not annotations:
            raise HTTPException(status_code=404, detail="No annotations found for this file")
        
        export_id = str(uuid.uuid4())
        
        if export_format == "json":
            export_filename = f"annotations_{file_id[:8]}.json"
            export_path = os.path.join(CONVERSIONS_DIR, f"{export_id}_{export_filename}")
            
            export_data = {
                "file_id": file_id,
                "exported_at": datetime.utcnow().isoformat(),
                "total_annotations": len(annotations),
                "annotations": annotations
            }
            
            async with aiofiles.open(export_path, 'w') as f:
                await f.write(json.dumps(export_data, indent=2))
        
        elif export_format == "txt":
            export_filename = f"annotations_{file_id[:8]}.txt"
            export_path = os.path.join(CONVERSIONS_DIR, f"{export_id}_{export_filename}")
            
            lines = [f"Annotations Export - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}", "=" * 50, ""]
            for ann in annotations:
                lines.append(f"Page {ann.get('position', {}).get('page', ann.get('page', 1))}")
                lines.append(f"Type: {ann.get('type', 'comment')}")
                lines.append(f"Author: {ann.get('author', 'Anonymous')}")
                lines.append(f"Text: {ann.get('text', 'N/A')}")
                lines.append(f"Color: {ann.get('color', 'N/A')}")
                lines.append("-" * 30)
            
            async with aiofiles.open(export_path, 'w') as f:
                await f.write("\n".join(lines))
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported export format: {export_format}")
        
        # Store export file info
        file_storage[export_id] = {
            "file_id": export_id,
            "original_name": export_filename,
            "file_path": export_path,
            "file_type": export_format,
            "file_size": os.path.getsize(export_path),
            "upload_time": datetime.utcnow()
        }
        save_storage()
        
        return {
            "export_id": export_id,
            "filename": export_filename,
            "format": export_format,
            "download_url": f"/api/download/{export_id}",
            "total_annotations": len(annotations)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export annotations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export annotations: {str(e)}")


@router.post("/annotations/import")
async def import_annotations(request: dict):
    """Import annotations from a JSON file"""
    try:
        file_id = request.get("file_id")
        annotations_data = request.get("annotations", [])
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="Target file not found")
        
        if file_id not in annotation_storage:
            annotation_storage[file_id] = []
        
        imported_count = 0
        for ann in annotations_data:
            annotation_id = str(uuid.uuid4())
            ann["annotation_id"] = annotation_id
            ann["file_id"] = file_id
            ann["imported_at"] = datetime.utcnow().isoformat()
            annotation_storage[file_id].append(ann)
            imported_count += 1
        
        logger.info(f"Imported {imported_count} annotations to file {file_id}")
        
        return {
            "file_id": file_id,
            "imported_count": imported_count,
            "status": "imported"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Import annotations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to import annotations: {str(e)}")

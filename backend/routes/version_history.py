"""
Document Version History routes - Track changes, view history, and revert versions
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import json
import logging
import aiofiles
import shutil
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Version History"])

# Storage - will be injected
file_storage = {}
CONVERSIONS_DIR = ""
VERSION_STORAGE_FILE = ""

# Version history storage
version_history = {}


def init_version_routes(f_storage, conv_dir, save_func):
    """Initialize routes with shared dependencies"""
    global file_storage, CONVERSIONS_DIR, save_storage, VERSION_STORAGE_FILE
    file_storage = f_storage
    CONVERSIONS_DIR = conv_dir
    save_storage = save_func
    VERSION_STORAGE_FILE = os.path.join(os.path.dirname(conv_dir), "version_history.json")
    load_version_history()


def load_version_history():
    """Load version history from file"""
    global version_history
    try:
        if os.path.exists(VERSION_STORAGE_FILE):
            with open(VERSION_STORAGE_FILE, 'r') as f:
                version_history = json.load(f)
    except Exception as e:
        logger.error(f"Error loading version history: {e}")
        version_history = {}


def save_version_history():
    """Save version history to file"""
    try:
        with open(VERSION_STORAGE_FILE, 'w') as f:
            json.dump(version_history, f, indent=2, default=str)
    except Exception as e:
        logger.error(f"Error saving version history: {e}")


def calculate_file_hash(file_path: str) -> str:
    """Calculate MD5 hash of a file for change detection"""
    hash_md5 = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except Exception:
        return ""


class VersionInfo(BaseModel):
    version_id: str
    file_id: str
    version_number: int
    file_path: str
    file_size: int
    file_hash: str
    created_at: str
    created_by: str
    change_description: str
    is_current: bool


class CreateVersionRequest(BaseModel):
    file_id: str
    change_description: str = "Document updated"
    created_by: str = "User"


class RevertVersionRequest(BaseModel):
    file_id: str
    version_id: str
    created_by: str = "User"


@router.post("/versions/create")
async def create_version(request: CreateVersionRequest):
    """Create a new version snapshot of a document"""
    try:
        file_id = request.file_id
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        
        # Initialize version history for this file if not exists
        if file_id not in version_history:
            version_history[file_id] = {
                "file_id": file_id,
                "original_name": file_info["original_name"],
                "versions": [],
                "current_version": 0
            }
        
        # Calculate file hash
        file_hash = calculate_file_hash(file_info["file_path"])
        
        # Check if file has actually changed
        versions = version_history[file_id]["versions"]
        if versions:
            last_version = versions[-1]
            if last_version["file_hash"] == file_hash:
                return {
                    "message": "No changes detected since last version",
                    "file_id": file_id,
                    "current_version": last_version["version_number"]
                }
        
        # Create version snapshot
        version_number = len(versions) + 1
        version_id = str(uuid.uuid4())
        
        # Copy file to versions directory
        versions_dir = os.path.join(CONVERSIONS_DIR, "versions", file_id)
        os.makedirs(versions_dir, exist_ok=True)
        
        version_filename = f"v{version_number}_{file_info['original_name']}"
        version_path = os.path.join(versions_dir, version_filename)
        
        shutil.copy2(file_info["file_path"], version_path)
        
        # Create version record
        version_record = {
            "version_id": version_id,
            "version_number": version_number,
            "file_path": version_path,
            "file_size": os.path.getsize(version_path),
            "file_hash": file_hash,
            "created_at": datetime.utcnow().isoformat(),
            "created_by": request.created_by,
            "change_description": request.change_description,
            "is_current": True
        }
        
        # Mark previous versions as not current
        for v in versions:
            v["is_current"] = False
        
        versions.append(version_record)
        version_history[file_id]["current_version"] = version_number
        
        save_version_history()
        
        logger.info(f"Version {version_number} created for file {file_id}")
        
        return {
            "version_id": version_id,
            "file_id": file_id,
            "version_number": version_number,
            "created_at": version_record["created_at"],
            "change_description": request.change_description,
            "status": "created"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create version error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create version: {str(e)}")


@router.get("/versions/{file_id}")
async def get_version_history(file_id: str):
    """Get complete version history for a document"""
    try:
        if file_id not in version_history:
            # Check if file exists but has no versions
            if file_id in file_storage:
                return {
                    "file_id": file_id,
                    "original_name": file_storage[file_id]["original_name"],
                    "versions": [],
                    "total_versions": 0,
                    "current_version": 0,
                    "message": "No version history. Create a version to start tracking changes."
                }
            raise HTTPException(status_code=404, detail="File not found")
        
        history = version_history[file_id]
        
        return {
            "file_id": file_id,
            "original_name": history["original_name"],
            "versions": history["versions"],
            "total_versions": len(history["versions"]),
            "current_version": history["current_version"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get version history error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get version history: {str(e)}")


@router.get("/versions/{file_id}/{version_id}")
async def get_version_details(file_id: str, version_id: str):
    """Get details of a specific version"""
    try:
        if file_id not in version_history:
            raise HTTPException(status_code=404, detail="File not found")
        
        versions = version_history[file_id]["versions"]
        
        for version in versions:
            if version["version_id"] == version_id:
                return {
                    "file_id": file_id,
                    "version": version,
                    "download_url": f"/api/versions/download/{file_id}/{version_id}"
                }
        
        raise HTTPException(status_code=404, detail="Version not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get version details error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get version details: {str(e)}")


@router.get("/versions/download/{file_id}/{version_id}")
async def download_version(file_id: str, version_id: str):
    """Download a specific version of a document"""
    from fastapi.responses import FileResponse
    
    try:
        if file_id not in version_history:
            raise HTTPException(status_code=404, detail="File not found")
        
        versions = version_history[file_id]["versions"]
        
        for version in versions:
            if version["version_id"] == version_id:
                if not os.path.exists(version["file_path"]):
                    raise HTTPException(status_code=404, detail="Version file not found on disk")
                
                return FileResponse(
                    path=version["file_path"],
                    filename=f"v{version['version_number']}_{version_history[file_id]['original_name']}",
                    media_type="application/octet-stream"
                )
        
        raise HTTPException(status_code=404, detail="Version not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download version error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download version: {str(e)}")


@router.post("/versions/revert")
async def revert_to_version(request: RevertVersionRequest):
    """Revert document to a previous version"""
    try:
        file_id = request.file_id
        version_id = request.version_id
        
        if file_id not in version_history:
            raise HTTPException(status_code=404, detail="File not found")
        
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="Original file not found")
        
        history = version_history[file_id]
        versions = history["versions"]
        
        # Find the version to revert to
        target_version = None
        for version in versions:
            if version["version_id"] == version_id:
                target_version = version
                break
        
        if not target_version:
            raise HTTPException(status_code=404, detail="Version not found")
        
        # First, create a backup of current state
        current_file_info = file_storage[file_id]
        backup_request = CreateVersionRequest(
            file_id=file_id,
            change_description=f"Auto-backup before reverting to v{target_version['version_number']}",
            created_by=request.created_by
        )
        await create_version(backup_request)
        
        # Copy the target version file to replace current
        shutil.copy2(target_version["file_path"], current_file_info["file_path"])
        
        # Update file storage info
        file_storage[file_id]["file_size"] = os.path.getsize(current_file_info["file_path"])
        save_storage()
        
        # Create a new version record for the revert
        revert_version_id = str(uuid.uuid4())
        new_version_number = len(versions) + 1
        
        revert_record = {
            "version_id": revert_version_id,
            "version_number": new_version_number,
            "file_path": target_version["file_path"],
            "file_size": target_version["file_size"],
            "file_hash": target_version["file_hash"],
            "created_at": datetime.utcnow().isoformat(),
            "created_by": request.created_by,
            "change_description": f"Reverted to version {target_version['version_number']}",
            "is_current": True,
            "reverted_from": target_version["version_id"]
        }
        
        # Mark all versions as not current
        for v in versions:
            v["is_current"] = False
        
        versions.append(revert_record)
        history["current_version"] = new_version_number
        
        save_version_history()
        
        logger.info(f"File {file_id} reverted to version {target_version['version_number']}")
        
        return {
            "file_id": file_id,
            "reverted_to_version": target_version["version_number"],
            "new_version_number": new_version_number,
            "status": "reverted",
            "message": f"Successfully reverted to version {target_version['version_number']}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Revert version error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to revert: {str(e)}")


@router.post("/versions/compare")
async def compare_versions(request: dict):
    """Compare two versions of a document"""
    try:
        file_id = request.get("file_id")
        version_id_1 = request.get("version_id_1")
        version_id_2 = request.get("version_id_2")
        
        if not all([file_id, version_id_1, version_id_2]):
            raise HTTPException(status_code=400, detail="file_id, version_id_1, and version_id_2 are required")
        
        if file_id not in version_history:
            raise HTTPException(status_code=404, detail="File not found")
        
        versions = version_history[file_id]["versions"]
        
        version_1 = None
        version_2 = None
        
        for v in versions:
            if v["version_id"] == version_id_1:
                version_1 = v
            if v["version_id"] == version_id_2:
                version_2 = v
        
        if not version_1 or not version_2:
            raise HTTPException(status_code=404, detail="One or both versions not found")
        
        # Basic comparison info
        comparison = {
            "file_id": file_id,
            "version_1": {
                "version_number": version_1["version_number"],
                "created_at": version_1["created_at"],
                "created_by": version_1["created_by"],
                "file_size": version_1["file_size"],
                "file_hash": version_1["file_hash"]
            },
            "version_2": {
                "version_number": version_2["version_number"],
                "created_at": version_2["created_at"],
                "created_by": version_2["created_by"],
                "file_size": version_2["file_size"],
                "file_hash": version_2["file_hash"]
            },
            "size_difference": version_2["file_size"] - version_1["file_size"],
            "files_identical": version_1["file_hash"] == version_2["file_hash"],
            "download_urls": {
                "version_1": f"/api/versions/download/{file_id}/{version_id_1}",
                "version_2": f"/api/versions/download/{file_id}/{version_id_2}"
            }
        }
        
        return comparison
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Compare versions error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to compare versions: {str(e)}")


@router.delete("/versions/{file_id}/{version_id}")
async def delete_version(file_id: str, version_id: str):
    """Delete a specific version (cannot delete current version)"""
    try:
        if file_id not in version_history:
            raise HTTPException(status_code=404, detail="File not found")
        
        versions = version_history[file_id]["versions"]
        
        for i, version in enumerate(versions):
            if version["version_id"] == version_id:
                if version["is_current"]:
                    raise HTTPException(status_code=400, detail="Cannot delete current version")
                
                # Delete the file
                if os.path.exists(version["file_path"]):
                    os.remove(version["file_path"])
                
                # Remove from history
                del versions[i]
                save_version_history()
                
                logger.info(f"Version {version['version_number']} deleted from file {file_id}")
                
                return {
                    "file_id": file_id,
                    "version_id": version_id,
                    "status": "deleted"
                }
        
        raise HTTPException(status_code=404, detail="Version not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete version error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete version: {str(e)}")


@router.get("/versions/stats/{file_id}")
async def get_version_stats(file_id: str):
    """Get statistics about version history for a file"""
    try:
        if file_id not in version_history:
            if file_id in file_storage:
                return {
                    "file_id": file_id,
                    "total_versions": 0,
                    "has_history": False
                }
            raise HTTPException(status_code=404, detail="File not found")
        
        history = version_history[file_id]
        versions = history["versions"]
        
        if not versions:
            return {
                "file_id": file_id,
                "total_versions": 0,
                "has_history": False
            }
        
        # Calculate stats
        total_storage = sum(v["file_size"] for v in versions)
        authors = list(set(v["created_by"] for v in versions))
        first_version = versions[0]
        latest_version = versions[-1]
        
        return {
            "file_id": file_id,
            "original_name": history["original_name"],
            "total_versions": len(versions),
            "current_version": history["current_version"],
            "total_storage_bytes": total_storage,
            "total_storage_mb": round(total_storage / (1024 * 1024), 2),
            "authors": authors,
            "first_version_date": first_version["created_at"],
            "latest_version_date": latest_version["created_at"],
            "has_history": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get version stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get version stats: {str(e)}")

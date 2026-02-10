"""
User Dashboard routes - Account management, history, usage stats
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(tags=["User Dashboard"])

# Database instance - will be injected
db = None
file_storage = {}

def init_dashboard_routes(database, f_storage):
    """Initialize routes with shared dependencies"""
    global db, file_storage
    db = database
    file_storage = f_storage


class UserStats(BaseModel):
    total_uploads: int
    total_conversions: int
    total_analyses: int
    storage_used_mb: float
    subscription_tier: str
    subscription_status: str
    member_since: str


class DocumentHistory(BaseModel):
    file_id: str
    filename: str
    file_type: str
    file_size: int
    action: str  # 'upload', 'convert', 'analyze'
    timestamp: str


class SubscriptionInfo(BaseModel):
    tier: str
    status: str
    features: List[str]
    limits: Dict[str, Any]
    stripe_customer_id: Optional[str] = None
    next_billing_date: Optional[str] = None


@router.get("/dashboard/stats/{user_id}")
async def get_user_stats(user_id: int):
    """Get user statistics and usage summary"""
    try:
        if not db or not db.pool:
            # Fallback for when database is not connected
            return {
                "user_id": user_id,
                "total_uploads": 0,
                "total_conversions": 0,
                "total_analyses": 0,
                "storage_used_mb": 0,
                "subscription_tier": "free",
                "subscription_status": "active",
                "member_since": datetime.utcnow().isoformat()
            }
        
        user = await db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate storage used from files
        storage_used = 0
        user_files = 0
        for fid, finfo in file_storage.items():
            # In a real app, we'd track which user owns which files
            storage_used += finfo.get("file_size", 0)
            user_files += 1
        
        storage_used_mb = round(storage_used / (1024 * 1024), 2)
        
        return {
            "user_id": user_id,
            "email": user.get("email"),
            "full_name": user.get("full_name"),
            "total_uploads": user.get("upload_count", 0),
            "total_conversions": user_files,  # Approximation
            "total_analyses": user.get("analysis_count", 0),
            "storage_used_mb": storage_used_mb,
            "subscription_tier": user.get("subscription_tier", "free"),
            "subscription_status": user.get("subscription_status", "active"),
            "member_since": str(user.get("created_at", datetime.utcnow()))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")


@router.get("/dashboard/history/{user_id}")
async def get_document_history(user_id: int, limit: int = 20, offset: int = 0):
    """Get user's document processing history"""
    try:
        # In a real implementation, we'd query the database for user-specific history
        # For now, return recent files from storage
        
        history = []
        sorted_files = sorted(
            file_storage.items(),
            key=lambda x: x[1].get("upload_time", datetime.min),
            reverse=True
        )
        
        for fid, finfo in sorted_files[offset:offset + limit]:
            history.append({
                "file_id": fid,
                "filename": finfo.get("original_name", "Unknown"),
                "file_type": finfo.get("file_type", "unknown"),
                "file_size": finfo.get("file_size", 0),
                "action": "upload" if not finfo.get("converted") else "convert",
                "timestamp": finfo.get("upload_time", datetime.utcnow()).isoformat() if isinstance(finfo.get("upload_time"), datetime) else str(finfo.get("upload_time", ""))
            })
        
        return {
            "user_id": user_id,
            "history": history,
            "total": len(file_storage),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Get document history error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get document history: {str(e)}")


@router.get("/dashboard/subscription/{user_id}")
async def get_subscription_info(user_id: int):
    """Get user's subscription details"""
    try:
        if not db or not db.pool:
            # Fallback subscription info
            return get_tier_info("free", None)
        
        user = await db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        tier = user.get("subscription_tier", "free")
        stripe_customer_id = user.get("stripe_customer_id")
        
        return get_tier_info(tier, stripe_customer_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get subscription info error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get subscription info: {str(e)}")


def get_tier_info(tier: str, stripe_customer_id: Optional[str]) -> dict:
    """Get tier-specific information"""
    tiers = {
        "free": {
            "tier": "free",
            "status": "active",
            "price": "$0/month",
            "features": [
                "5 document uploads per day",
                "Basic format conversion",
                "1 AI analysis per day",
                "Community support"
            ],
            "limits": {
                "uploads_per_day": 5,
                "analyses_per_day": 1,
                "max_file_size_mb": 10,
                "batch_processing": False,
                "priority_processing": False
            }
        },
        "professional": {
            "tier": "professional",
            "status": "active",
            "price": "$29/month",
            "features": [
                "Unlimited document uploads",
                "All format conversions including PDF/A",
                "Unlimited AI analysis",
                "Priority processing",
                "Batch processing",
                "Advanced PDF tools",
                "Email support",
                "API access"
            ],
            "limits": {
                "uploads_per_day": -1,  # Unlimited
                "analyses_per_day": -1,
                "max_file_size_mb": 100,
                "batch_processing": True,
                "priority_processing": True
            }
        },
        "enterprise": {
            "tier": "enterprise",
            "status": "active",
            "price": "Custom pricing",
            "features": [
                "Everything in Professional",
                "Custom integrations",
                "Dedicated support",
                "SLA guarantees",
                "On-premise deployment option",
                "Custom branding",
                "Team management"
            ],
            "limits": {
                "uploads_per_day": -1,
                "analyses_per_day": -1,
                "max_file_size_mb": 500,
                "batch_processing": True,
                "priority_processing": True
            }
        }
    }
    
    info = tiers.get(tier, tiers["free"])
    info["stripe_customer_id"] = stripe_customer_id
    
    return info


@router.put("/dashboard/profile/{user_id}")
async def update_user_profile(user_id: int, update_data: dict):
    """Update user profile information"""
    try:
        if not db or not db.pool:
            raise HTTPException(status_code=503, detail="Database not available")
        
        user = await db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Only allow updating certain fields
        allowed_fields = ["full_name"]
        updates = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if not updates:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Update in database
        async with db.pool.acquire() as conn:
            set_clause = ", ".join([f"{k} = ${i+1}" for i, k in enumerate(updates.keys())])
            values = list(updates.values()) + [user_id]
            
            await conn.execute(
                f"UPDATE users SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ${len(values)}",
                *values
            )
        
        logger.info(f"User {user_id} profile updated")
        
        return {
            "user_id": user_id,
            "updated_fields": list(updates.keys()),
            "status": "updated"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update profile error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


@router.get("/dashboard/usage-chart/{user_id}")
async def get_usage_chart_data(user_id: int, days: int = 30):
    """Get usage data for charts (last N days)"""
    try:
        # Generate sample chart data
        # In production, this would query actual usage logs
        
        end_date = datetime.utcnow()
        chart_data = []
        
        for i in range(days):
            date = end_date - timedelta(days=days - 1 - i)
            chart_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "uploads": 0,  # Would come from database
                "conversions": 0,
                "analyses": 0
            })
        
        return {
            "user_id": user_id,
            "period_days": days,
            "chart_data": chart_data
        }
        
    except Exception as e:
        logger.error(f"Get usage chart error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get usage chart data: {str(e)}")


@router.delete("/dashboard/file/{file_id}")
async def delete_user_file(file_id: str, user_id: int):
    """Delete a file from user's history"""
    try:
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_storage[file_id]
        
        # Delete the actual file
        import os
        if os.path.exists(file_info.get("file_path", "")):
            os.remove(file_info["file_path"])
        
        # Remove from storage
        del file_storage[file_id]
        
        logger.info(f"File {file_id} deleted by user {user_id}")
        
        return {
            "file_id": file_id,
            "status": "deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete file error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

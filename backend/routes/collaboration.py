"""
Real-time collaboration WebSocket handler for annotations
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import logging
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Collaboration"])

# Active connections per document
class ConnectionManager:
    def __init__(self):
        # {file_id: {user_id: WebSocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # {file_id: [annotations]}
        self.document_annotations: Dict[str, List[dict]] = {}
        # {file_id: {user_id: cursor_position}}
        self.user_cursors: Dict[str, Dict[str, dict]] = {}
    
    async def connect(self, websocket: WebSocket, file_id: str, user_id: str):
        await websocket.accept()
        
        if file_id not in self.active_connections:
            self.active_connections[file_id] = {}
            self.user_cursors[file_id] = {}
        
        self.active_connections[file_id][user_id] = websocket
        self.user_cursors[file_id][user_id] = {"x": 0, "y": 0, "page": 1}
        
        # Notify others about new user
        await self.broadcast_to_document(file_id, {
            "type": "user_joined",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "active_users": list(self.active_connections[file_id].keys())
        }, exclude_user=user_id)
        
        logger.info(f"User {user_id} connected to document {file_id}")
    
    def disconnect(self, file_id: str, user_id: str):
        if file_id in self.active_connections:
            if user_id in self.active_connections[file_id]:
                del self.active_connections[file_id][user_id]
            if user_id in self.user_cursors.get(file_id, {}):
                del self.user_cursors[file_id][user_id]
            
            # Clean up empty documents
            if not self.active_connections[file_id]:
                del self.active_connections[file_id]
                if file_id in self.user_cursors:
                    del self.user_cursors[file_id]
        
        logger.info(f"User {user_id} disconnected from document {file_id}")
    
    async def broadcast_to_document(self, file_id: str, message: dict, exclude_user: str = None):
        """Broadcast message to all users viewing a document"""
        if file_id not in self.active_connections:
            return
        
        disconnected = []
        for user_id, connection in self.active_connections[file_id].items():
            if user_id != exclude_user:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to {user_id}: {e}")
                    disconnected.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected:
            self.disconnect(file_id, user_id)
    
    async def send_to_user(self, file_id: str, user_id: str, message: dict):
        """Send message to a specific user"""
        if file_id in self.active_connections:
            if user_id in self.active_connections[file_id]:
                try:
                    await self.active_connections[file_id][user_id].send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to {user_id}: {e}")
    
    def get_active_users(self, file_id: str) -> List[str]:
        """Get list of users currently viewing a document"""
        return list(self.active_connections.get(file_id, {}).keys())
    
    def get_user_cursors(self, file_id: str) -> Dict[str, dict]:
        """Get all user cursor positions for a document"""
        return self.user_cursors.get(file_id, {})


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws/collaborate/{file_id}/{user_id}")
async def websocket_collaborate(websocket: WebSocket, file_id: str, user_id: str):
    """WebSocket endpoint for real-time collaboration"""
    await manager.connect(websocket, file_id, user_id)
    
    # Send initial state to the new user
    await websocket.send_json({
        "type": "init",
        "active_users": manager.get_active_users(file_id),
        "cursors": manager.get_user_cursors(file_id),
        "timestamp": datetime.utcnow().isoformat()
    })
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "cursor_move":
                # Update cursor position and broadcast
                manager.user_cursors[file_id][user_id] = {
                    "x": data.get("x", 0),
                    "y": data.get("y", 0),
                    "page": data.get("page", 1)
                }
                await manager.broadcast_to_document(file_id, {
                    "type": "cursor_update",
                    "user_id": user_id,
                    "position": manager.user_cursors[file_id][user_id],
                    "timestamp": datetime.utcnow().isoformat()
                }, exclude_user=user_id)
            
            elif message_type == "annotation_add":
                # Broadcast new annotation
                await manager.broadcast_to_document(file_id, {
                    "type": "annotation_added",
                    "user_id": user_id,
                    "annotation": data.get("annotation"),
                    "timestamp": datetime.utcnow().isoformat()
                }, exclude_user=user_id)
            
            elif message_type == "annotation_update":
                # Broadcast annotation update
                await manager.broadcast_to_document(file_id, {
                    "type": "annotation_updated",
                    "user_id": user_id,
                    "annotation_id": data.get("annotation_id"),
                    "changes": data.get("changes"),
                    "timestamp": datetime.utcnow().isoformat()
                }, exclude_user=user_id)
            
            elif message_type == "annotation_delete":
                # Broadcast annotation deletion
                await manager.broadcast_to_document(file_id, {
                    "type": "annotation_deleted",
                    "user_id": user_id,
                    "annotation_id": data.get("annotation_id"),
                    "timestamp": datetime.utcnow().isoformat()
                }, exclude_user=user_id)
            
            elif message_type == "selection":
                # Broadcast text/area selection
                await manager.broadcast_to_document(file_id, {
                    "type": "user_selection",
                    "user_id": user_id,
                    "selection": data.get("selection"),
                    "page": data.get("page"),
                    "timestamp": datetime.utcnow().isoformat()
                }, exclude_user=user_id)
            
            elif message_type == "comment":
                # Broadcast comment in real-time
                await manager.broadcast_to_document(file_id, {
                    "type": "new_comment",
                    "user_id": user_id,
                    "comment": data.get("comment"),
                    "annotation_id": data.get("annotation_id"),
                    "timestamp": datetime.utcnow().isoformat()
                }, exclude_user=user_id)
            
            elif message_type == "ping":
                # Keep-alive ping
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect(file_id, user_id)
        await manager.broadcast_to_document(file_id, {
            "type": "user_left",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "active_users": manager.get_active_users(file_id)
        })
    except Exception as e:
        logger.error(f"WebSocket error for {user_id}: {e}")
        manager.disconnect(file_id, user_id)


@router.get("/collaborate/active-users/{file_id}")
async def get_active_users(file_id: str):
    """Get list of users currently viewing a document"""
    return {
        "file_id": file_id,
        "active_users": manager.get_active_users(file_id),
        "user_count": len(manager.get_active_users(file_id))
    }


@router.get("/collaborate/cursors/{file_id}")
async def get_user_cursors(file_id: str):
    """Get all user cursor positions for a document"""
    return {
        "file_id": file_id,
        "cursors": manager.get_user_cursors(file_id)
    }

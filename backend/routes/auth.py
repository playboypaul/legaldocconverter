"""
Authentication routes - Google OAuth and Password Reset
"""
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import logging
import httpx
from datetime import datetime, timezone, timedelta
import secrets
import hashlib

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"])

# Database instance - will be injected
db = None

def init_auth_routes(database):
    """Initialize routes with shared dependencies"""
    global db
    db = database


# Models
class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    subscription: str = "free"
    created_at: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


# In-memory stores (for demo - in production use database)
password_reset_tokens = {}
users_store = {
    "demo@legaldocconverter.com": {
        "user_id": "user_demo123",
        "email": "demo@legaldocconverter.com",
        "name": "Demo User",
        "password_hash": hashlib.sha256("password".encode()).hexdigest(),
        "subscription": "free",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    "pro@legaldocconverter.com": {
        "user_id": "user_pro456",
        "email": "pro@legaldocconverter.com",
        "name": "Pro User",
        "password_hash": hashlib.sha256("password".encode()).hexdigest(),
        "subscription": "professional",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
}
sessions_store = {}


def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_session_token() -> str:
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)


def generate_reset_token() -> str:
    """Generate a password reset token"""
    return secrets.token_urlsafe(32)


# =====================================================
# GOOGLE OAUTH ENDPOINTS
# =====================================================

@router.get("/auth/session")
async def exchange_session(session_id: str, response: Response):
    """
    Exchange session_id from Google OAuth for user data and session token.
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    """
    try:
        # Call Emergent Auth to get session data
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                logger.error(f"Auth service error: {auth_response.status_code}")
                raise HTTPException(status_code=401, detail="Invalid session")
            
            user_data = auth_response.json()
        
        # Extract user info from Google OAuth response
        email = user_data.get("email")
        name = user_data.get("name", email.split("@")[0])
        picture = user_data.get("picture")
        session_token = user_data.get("session_token")
        
        if not email or not session_token:
            raise HTTPException(status_code=400, detail="Invalid user data from OAuth")
        
        # Generate user_id (avoid MongoDB _id issues)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        # Check if user exists, create if not
        if email in users_store:
            user = users_store[email]
            user_id = user["user_id"]
        else:
            # Create new user
            users_store[email] = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "subscription": "free",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "auth_provider": "google"
            }
        
        # Store session
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        sessions_store[session_token] = {
            "user_id": user_id,
            "email": email,
            "expires_at": expires_at.isoformat()
        }
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        logger.info(f"User authenticated via Google: {email}")
        
        return {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "subscription": users_store[email].get("subscription", "free"),
            "created_at": users_store[email]["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session exchange error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


@router.get("/auth/me")
async def get_current_user(request: Request):
    """Get current authenticated user from session token"""
    try:
        # Check cookie first, then Authorization header
        session_token = request.cookies.get("session_token")
        
        if not session_token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                session_token = auth_header.split(" ")[1]
        
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Validate session
        if session_token not in sessions_store:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        session = sessions_store[session_token]
        
        # Check expiry
        expires_at = datetime.fromisoformat(session["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            del sessions_store[session_token]
            raise HTTPException(status_code=401, detail="Session expired")
        
        # Get user data
        email = session["email"]
        if email not in users_store:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users_store[email]
        
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "picture": user.get("picture"),
            "subscription": user.get("subscription", "free"),
            "created_at": user["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    try:
        session_token = request.cookies.get("session_token")
        
        if session_token and session_token in sessions_store:
            del sessions_store[session_token]
        
        # Clear cookie
        response.delete_cookie(
            key="session_token",
            path="/",
            secure=True,
            samesite="none"
        )
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# EMAIL/PASSWORD AUTH ENDPOINTS
# =====================================================

@router.post("/auth/login")
async def login(request: LoginRequest, response: Response):
    """Login with email and password"""
    try:
        email = request.email.lower()
        password_hash = hash_password(request.password)
        
        if email not in users_store:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = users_store[email]
        
        if user.get("password_hash") != password_hash:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create session
        session_token = generate_session_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        sessions_store[session_token] = {
            "user_id": user["user_id"],
            "email": email,
            "expires_at": expires_at.isoformat()
        }
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        logger.info(f"User logged in: {email}")
        
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "picture": user.get("picture"),
            "subscription": user.get("subscription", "free"),
            "created_at": user["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/signup")
async def signup(request: SignupRequest, response: Response):
    """Create new account with email and password"""
    try:
        email = request.email.lower()
        
        if email in users_store:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        if len(request.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Create user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        password_hash = hash_password(request.password)
        
        users_store[email] = {
            "user_id": user_id,
            "email": email,
            "name": request.name,
            "password_hash": password_hash,
            "subscription": "free",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "auth_provider": "email"
        }
        
        # Create session
        session_token = generate_session_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        sessions_store[session_token] = {
            "user_id": user_id,
            "email": email,
            "expires_at": expires_at.isoformat()
        }
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        logger.info(f"New user registered: {email}")
        
        return {
            "user_id": user_id,
            "email": email,
            "name": request.name,
            "subscription": "free",
            "created_at": users_store[email]["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# FORGOT PASSWORD ENDPOINTS
# =====================================================

@router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    """Request password reset - generates a reset token"""
    try:
        email = request.email.lower()
        
        # Always return success to prevent email enumeration
        if email not in users_store:
            logger.info(f"Password reset requested for non-existent email: {email}")
            return {
                "message": "If an account exists with this email, a password reset link has been sent.",
                "demo_mode": True,
                "reset_token": None
            }
        
        # Generate reset token
        reset_token = generate_reset_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        password_reset_tokens[reset_token] = {
            "email": email,
            "expires_at": expires_at.isoformat(),
            "used": False
        }
        
        # In production, send email here
        # For demo, return the token directly
        logger.info(f"Password reset token generated for: {email}")
        
        # Since we don't have email service, provide token in response for demo
        return {
            "message": "If an account exists with this email, a password reset link has been sent.",
            "demo_mode": True,
            "reset_token": reset_token,  # In production, this would be sent via email
            "note": "In production, this token would be emailed. For demo, use this token to reset password."
        }
        
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/reset-password")
async def reset_password(request: PasswordResetConfirm):
    """Reset password using token"""
    try:
        token = request.token
        new_password = request.new_password
        
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        if token not in password_reset_tokens:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        token_data = password_reset_tokens[token]
        
        # Check if token was already used
        if token_data.get("used"):
            raise HTTPException(status_code=400, detail="Reset token already used")
        
        # Check expiry
        expires_at = datetime.fromisoformat(token_data["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            del password_reset_tokens[token]
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        # Update password
        email = token_data["email"]
        if email not in users_store:
            raise HTTPException(status_code=404, detail="User not found")
        
        users_store[email]["password_hash"] = hash_password(new_password)
        
        # Mark token as used
        password_reset_tokens[token]["used"] = True
        
        logger.info(f"Password reset successful for: {email}")
        
        return {
            "message": "Password has been reset successfully. You can now sign in with your new password."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auth/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """Verify if a reset token is valid"""
    try:
        if token not in password_reset_tokens:
            return {"valid": False, "message": "Invalid token"}
        
        token_data = password_reset_tokens[token]
        
        if token_data.get("used"):
            return {"valid": False, "message": "Token already used"}
        
        expires_at = datetime.fromisoformat(token_data["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            return {"valid": False, "message": "Token expired"}
        
        return {"valid": True, "email": token_data["email"]}
        
    except Exception as e:
        logger.error(f"Verify token error: {str(e)}")
        return {"valid": False, "message": "Error verifying token"}

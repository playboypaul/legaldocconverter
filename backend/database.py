import os
import logging
from datetime import datetime, timedelta
from typing import Optional
import asyncpg
from passlib.context import CryptContext
import jwt

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

class Database:
    """PostgreSQL database handler for Supabase"""
    
    def __init__(self):
        self.pool = None
        self.database_url = os.getenv("DATABASE_URL")
    
    async def connect(self):
        """Create connection pool"""
        if not self.database_url:
            logger.warning("DATABASE_URL not set - database features disabled")
            return False
        
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("Connected to PostgreSQL database")
            await self.create_tables()
            return True
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            return False
    
    async def disconnect(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Disconnected from PostgreSQL database")
    
    async def create_tables(self):
        """Create necessary tables if they don't exist"""
        async with self.pool.acquire() as conn:
            # Users table
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255),
                    subscription_tier VARCHAR(50) DEFAULT 'free',
                    subscription_status VARCHAR(50) DEFAULT 'active',
                    stripe_customer_id VARCHAR(255),
                    stripe_subscription_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    upload_count INTEGER DEFAULT 0,
                    analysis_count INTEGER DEFAULT 0
                )
            ''')
            
            # Usage tracking table
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS usage_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    action_type VARCHAR(50) NOT NULL,
                    details JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Subscription history table
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS subscription_history (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    stripe_subscription_id VARCHAR(255),
                    tier VARCHAR(50),
                    status VARCHAR(50),
                    started_at TIMESTAMP,
                    ended_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            logger.info("Database tables created/verified")
    
    # ============ USER METHODS ============
    
    async def create_user(self, email: str, password: str, full_name: str = None) -> Optional[dict]:
        """Create a new user"""
        if not self.pool:
            return None
            
        password_hash = pwd_context.hash(password)
        
        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow('''
                    INSERT INTO users (email, password_hash, full_name)
                    VALUES ($1, $2, $3)
                    RETURNING id, email, full_name, subscription_tier, created_at
                ''', email, password_hash, full_name)
                
                return dict(row) if row else None
        except asyncpg.UniqueViolationError:
            logger.warning(f"User with email {email} already exists")
            return None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email"""
        if not self.pool:
            return None
            
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT id, email, password_hash, full_name, subscription_tier, 
                       subscription_status, stripe_customer_id, created_at,
                       upload_count, analysis_count
                FROM users WHERE email = $1
            ''', email)
            
            return dict(row) if row else None
    
    async def get_user_by_id(self, user_id: int) -> Optional[dict]:
        """Get user by ID"""
        if not self.pool:
            return None
            
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT id, email, full_name, subscription_tier, subscription_status,
                       created_at, upload_count, analysis_count
                FROM users WHERE id = $1
            ''', user_id)
            
            return dict(row) if row else None
    
    async def verify_password(self, email: str, password: str) -> Optional[dict]:
        """Verify user password and return user if valid"""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        
        if pwd_context.verify(password, user['password_hash']):
            # Update last login
            await self.update_last_login(user['id'])
            return user
        return None
    
    async def update_last_login(self, user_id: int):
        """Update user's last login timestamp"""
        if not self.pool:
            return
            
        async with self.pool.acquire() as conn:
            await conn.execute('''
                UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1
            ''', user_id)
    
    # ============ SUBSCRIPTION METHODS ============
    
    async def update_subscription(self, user_id: int = None, email: str = None, 
                                   stripe_customer_id: str = None,
                                   stripe_subscription_id: str = None,
                                   tier: str = None, status: str = None) -> bool:
        """Update user subscription details"""
        if not self.pool:
            return False
        
        try:
            async with self.pool.acquire() as conn:
                # Build dynamic update query
                updates = []
                params = []
                param_count = 1
                
                if stripe_customer_id:
                    updates.append(f"stripe_customer_id = ${param_count}")
                    params.append(stripe_customer_id)
                    param_count += 1
                
                if stripe_subscription_id:
                    updates.append(f"stripe_subscription_id = ${param_count}")
                    params.append(stripe_subscription_id)
                    param_count += 1
                
                if tier:
                    updates.append(f"subscription_tier = ${param_count}")
                    params.append(tier)
                    param_count += 1
                
                if status:
                    updates.append(f"subscription_status = ${param_count}")
                    params.append(status)
                    param_count += 1
                
                updates.append("updated_at = CURRENT_TIMESTAMP")
                
                if not updates:
                    return False
                
                # Determine WHERE clause
                if user_id:
                    where_clause = f"id = ${param_count}"
                    params.append(user_id)
                elif email:
                    where_clause = f"email = ${param_count}"
                    params.append(email)
                elif stripe_customer_id:
                    where_clause = f"stripe_customer_id = ${param_count}"
                    params.append(stripe_customer_id)
                else:
                    return False
                
                query = f"UPDATE users SET {', '.join(updates)} WHERE {where_clause}"
                await conn.execute(query, *params)
                
                return True
        except Exception as e:
            logger.error(f"Error updating subscription: {e}")
            return False
    
    async def get_user_by_stripe_customer(self, stripe_customer_id: str) -> Optional[dict]:
        """Get user by Stripe customer ID"""
        if not self.pool:
            return None
            
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT id, email, full_name, subscription_tier, subscription_status
                FROM users WHERE stripe_customer_id = $1
            ''', stripe_customer_id)
            
            return dict(row) if row else None
    
    # ============ USAGE TRACKING ============
    
    async def increment_upload_count(self, user_id: int):
        """Increment user's upload count"""
        if not self.pool:
            return
            
        async with self.pool.acquire() as conn:
            await conn.execute('''
                UPDATE users SET upload_count = upload_count + 1 WHERE id = $1
            ''', user_id)
    
    async def increment_analysis_count(self, user_id: int):
        """Increment user's analysis count"""
        if not self.pool:
            return
            
        async with self.pool.acquire() as conn:
            await conn.execute('''
                UPDATE users SET analysis_count = analysis_count + 1 WHERE id = $1
            ''', user_id)
    
    async def log_usage(self, user_id: int, action_type: str, details: dict = None):
        """Log user action"""
        if not self.pool:
            return
            
        async with self.pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO usage_logs (user_id, action_type, details)
                VALUES ($1, $2, $3)
            ''', user_id, action_type, details)
    
    # ============ JWT TOKEN METHODS ============
    
    def create_access_token(self, user_id: int, email: str) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(user_id),
            "email": email,
            "exp": expire
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None


# Global database instance
db = Database()

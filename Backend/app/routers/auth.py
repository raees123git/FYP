# SkillEdge-API/app/routers/auth.py
"""
Authentication endpoints for user signup, login, and JWT management
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
import os
from bson.objectid import ObjectId

from app.database import get_users_collection, get_profiles_collection
from app.models import UserAuth, UserSignup, UserLogin, TokenResponse, UserProfile, PasswordChange

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production-skilledge-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Validate JWT token and return user_id"""
    try:
        token = credentials.credentials
        
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            print(f"❌ JWT VALIDATION - No user_id in token")
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        print(f"🔐 JWT VALIDATION - Authenticated user_id: {user_id}")
        
        # Verify user exists in database
        users_collection = get_users_collection()
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            print(f"❌ JWT VALIDATION - User not found in database: {user_id}")
            raise HTTPException(status_code=401, detail="User not found")
        
        print(f"✅ JWT VALIDATION - User verified and exists: {user_id}")
        return user_id
        
    except JWTError as e:
        print(f"❌ JWT VALIDATION - Token decode error: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception as e:
        print(f"❌ JWT VALIDATION - Unexpected error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    """Register a new user"""
    try:
        users_collection = get_users_collection()
        profiles_collection = get_profiles_collection()
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user authentication record
        user_auth = UserAuth(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            created_at=datetime.utcnow()
        )
        
        user_dict = user_auth.dict(by_alias=True)
        user_dict.pop("_id", None)
        
        # Insert user
        result = await users_collection.insert_one(user_dict)
        user_id = str(result.inserted_id)
        
        # Create initial profile
        profile = UserProfile(
            user_id=user_id,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        profile_dict = profile.dict(by_alias=True)
        profile_dict.pop("_id", None)
        await profiles_collection.insert_one(profile_dict)
        
        # Create access token
        access_token = create_access_token(data={"sub": user_id})
        
        return TokenResponse(
            access_token=access_token,
            user={
                "id": user_id,
                "email": user_data.email,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user"""
    try:
        users_collection = get_users_collection()
        
        # Find user by email
        user = await users_collection.find_one({"email": credentials.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update last login
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        user_id = str(user["_id"])
        
        # Create access token
        access_token = create_access_token(data={"sub": user_id})
        
        return TokenResponse(
            access_token=access_token,
            user={
                "id": user_id,
                "email": user["email"],
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", "")
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

@router.get("/me")
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    """Get current user information"""
    try:
        users_collection = get_users_collection()
        profiles_collection = get_profiles_collection()
        
        # Get user auth info
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user profile
        profile = await profiles_collection.find_one({"user_id": user_id})
        
        return {
            "id": user_id,
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "profile": profile if profile else None
        }
        
    except Exception as e:
        print(f"Get user error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/logout")
async def logout(user_id: str = Depends(get_current_user)):
    """Logout user (client should delete token)"""
    return {"message": "Logged out successfully"}

@router.get("/validate")
async def validate_token(user_id: str = Depends(get_current_user)):
    """Validate JWT token"""
    return {"valid": True, "user_id": user_id}

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    user_id: str = Depends(get_current_user)
):
    """Change user password"""
    try:
        users_collection = get_users_collection()
        
        # Get user from database
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not verify_password(password_data.current_password, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Hash new password
        new_password_hash = get_password_hash(password_data.new_password)
        
        # Update password in database
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password_hash": new_password_hash}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update password")
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Password change error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-account")
async def delete_account(user_id: str = Depends(get_current_user)):
    """Delete user account and all associated data"""
    try:
        from app.file_handler import FileHandler
        
        users_collection = get_users_collection()
        profiles_collection = get_profiles_collection()
        
        # Get user profile to find resume file
        profile = await profiles_collection.find_one({"user_id": user_id})
        
        # Delete resume file from GridFS if exists
        if profile and profile.get("resume_file_id"):
            try:
                fs = FileHandler.get_gridfs_bucket()
                await fs.delete(ObjectId(profile["resume_file_id"]))
            except Exception as e:
                print(f"Error deleting resume file: {str(e)}")
        
        # Import collection getters for reports
        from app.database import (
            get_interview_reports_collection, 
            get_verbal_reports_collection, 
            get_nonverbal_reports_collection,
            get_overall_reports_collection
        )
        
        interview_reports = get_interview_reports_collection()
        verbal_reports = get_verbal_reports_collection()
        nonverbal_reports = get_nonverbal_reports_collection()
        overall_reports = get_overall_reports_collection()
        
        # Delete all interview reports
        await interview_reports.delete_many({"user_id": user_id})
        
        # Delete all verbal reports
        await verbal_reports.delete_many({"user_id": user_id})
        
        # Delete all nonverbal reports
        await nonverbal_reports.delete_many({"user_id": user_id})
        
        # Delete all overall reports
        await overall_reports.delete_many({"user_id": user_id})
        
        # Delete user profile
        await profiles_collection.delete_one({"user_id": user_id})
        
        # Delete user auth record
        result = await users_collection.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete account error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

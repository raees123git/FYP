# SkillEdge-API/app/routers/profile.py
"""
API endpoints for user profile management
"""

from fastapi import APIRouter, HTTPException, Header, Depends, File, UploadFile, Response
from typing import Optional, Dict, Any
from datetime import datetime
import json

from app.database import (
    get_profiles_collection,
    get_interview_reports_collection,
    get_verbal_reports_collection,
    get_nonverbal_reports_collection
)
from app.file_handler import FileHandler
from app.models import (
    UserProfile,
    ProfileUpdate,
    ProfileResponse,
    CreateProfileRequest,
    UpdateProfileRequest,
    InterviewReport,
    VerbalReport,
    NonVerbalReport,
    SaveInterviewReportRequest
)

router = APIRouter(prefix="/api/profile", tags=["Profile"])

# Helper function to get user_id from headers (sent by Clerk from frontend)
async def get_current_user_id(authorization: str = Header(...)) -> str:
    """Extract user ID from authorization header"""
    # In production, you should validate the JWT token from Clerk
    # For now, we'll expect the user_id to be sent directly
    # Format: "Bearer user_id"
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        return parts[1]
    except Exception as e:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/", response_model=Dict[str, Any])
async def get_profile(user_id: str = Depends(get_current_user_id)):
    """Get user profile by user ID"""
    try:
        profiles_collection = get_profiles_collection()
        
        # Find profile by user_id
        profile = await profiles_collection.find_one({"user_id": user_id})
        
        if not profile:
            return {
                "success": False,
                "message": "Profile not found",
                "profile": None
            }
        
        # Convert ObjectId to string for JSON serialization
        profile["_id"] = str(profile["_id"])
        
        # Ensure all datetime fields are strings
        if "created_at" in profile:
            profile["created_at"] = profile["created_at"].isoformat()
        if "updated_at" in profile:
            profile["updated_at"] = profile["updated_at"].isoformat()
            
        return {
            "success": True,
            "profile": profile
        }
        
    except Exception as e:
        print(f"Error fetching profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ProfileResponse)
async def create_profile(
    request: CreateProfileRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new user profile"""
    try:
        profiles_collection = get_profiles_collection()
        
        # Check if profile already exists
        existing_profile = await profiles_collection.find_one({"user_id": user_id})
        if existing_profile:
            raise HTTPException(status_code=400, detail="Profile already exists")
        
        # Create new profile
        profile = UserProfile(
            user_id=user_id,
            first_name=request.firstName,
            last_name=request.lastName,
            email=request.email or "",
            industry=request.industry or "",
            position=request.position or "",
            experience=request.experience or 0,
            skills=request.skills or [],
            bio=request.bio or "",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Convert to dict and remove the id field (MongoDB will create its own)
        profile_dict = profile.dict(by_alias=True)
        profile_dict.pop("_id", None)
        
        # Insert into MongoDB
        result = await profiles_collection.insert_one(profile_dict)
        
        # Fetch the created profile
        created_profile = await profiles_collection.find_one({"_id": result.inserted_id})
        created_profile["_id"] = str(created_profile["_id"])
        
        return ProfileResponse(
            success=True,
            message="Profile created successfully",
            profile=created_profile
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/", response_model=ProfileResponse)
async def update_profile(
    request: UpdateProfileRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Update user profile"""
    try:
        profiles_collection = get_profiles_collection()
        
        # Check if profile exists
        existing_profile = await profiles_collection.find_one({"user_id": user_id})
        
        if not existing_profile:
            # Create new profile if it doesn't exist
            profile = UserProfile(
                user_id=user_id,
                first_name=request.firstName or "",
                last_name=request.lastName or "",
                email=request.email or "",
                industry=request.industry or "",
                position=request.position or "",
                experience=request.experience or 0,
                skills=request.skills or [],
                bio=request.bio or "",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            profile_dict = profile.dict(by_alias=True)
            profile_dict.pop("_id", None)
            
            result = await profiles_collection.insert_one(profile_dict)
            updated_profile = await profiles_collection.find_one({"_id": result.inserted_id})
        else:
            # Update existing profile
            update_data = {}
            
            if request.firstName is not None:
                update_data["first_name"] = request.firstName
            if request.lastName is not None:
                update_data["last_name"] = request.lastName
            if request.email is not None:
                update_data["email"] = request.email
            if request.industry is not None:
                update_data["industry"] = request.industry
            if request.position is not None:
                update_data["position"] = request.position
            if request.experience is not None:
                update_data["experience"] = request.experience
            if request.skills is not None:
                update_data["skills"] = request.skills
            if request.bio is not None:
                update_data["bio"] = request.bio
                
            update_data["updated_at"] = datetime.utcnow()
            
            # Update in MongoDB
            await profiles_collection.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
            
            updated_profile = await profiles_collection.find_one({"user_id": user_id})
        
        # Convert ObjectId to string
        updated_profile["_id"] = str(updated_profile["_id"])
        
        # Convert datetime to string
        if "created_at" in updated_profile:
            updated_profile["created_at"] = updated_profile["created_at"].isoformat()
        if "updated_at" in updated_profile:
            updated_profile["updated_at"] = updated_profile["updated_at"].isoformat()
        
        return ProfileResponse(
            success=True,
            message="Profile updated successfully",
            profile=updated_profile
        )
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/", response_model=Dict[str, Any])
async def delete_profile(user_id: str = Depends(get_current_user_id)):
    """Delete user profile and all related data"""
    try:
        profiles_collection = get_profiles_collection()
        interview_reports_collection = get_interview_reports_collection()
        verbal_reports_collection = get_verbal_reports_collection()
        nonverbal_reports_collection = get_nonverbal_reports_collection()
        
        # Delete profile
        profile_result = await profiles_collection.delete_one({"user_id": user_id})
        
        # Delete all related reports
        interview_result = await interview_reports_collection.delete_many({"user_id": user_id})
        verbal_result = await verbal_reports_collection.delete_many({"user_id": user_id})
        nonverbal_result = await nonverbal_reports_collection.delete_many({"user_id": user_id})
        
        return {
            "success": True,
            "message": "Profile and related data deleted successfully",
            "deleted": {
                "profile": profile_result.deleted_count,
                "interview_reports": interview_result.deleted_count,
                "verbal_reports": verbal_result.deleted_count,
                "nonverbal_reports": nonverbal_result.deleted_count
            }
        }
        
    except Exception as e:
        print(f"Error deleting profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports", response_model=Dict[str, Any])
async def get_user_reports(user_id: str = Depends(get_current_user_id)):
    """Get all interview reports for a user"""
    try:
        interview_reports_collection = get_interview_reports_collection()
        verbal_reports_collection = get_verbal_reports_collection()
        nonverbal_reports_collection = get_nonverbal_reports_collection()
        
        # Fetch all reports
        interview_reports = await interview_reports_collection.find({"user_id": user_id}).to_list(100)
        verbal_reports = await verbal_reports_collection.find({"user_id": user_id}).to_list(100)
        nonverbal_reports = await nonverbal_reports_collection.find({"user_id": user_id}).to_list(100)
        
        # Convert ObjectIds to strings
        for report in interview_reports:
            report["_id"] = str(report["_id"])
            if "created_at" in report:
                report["created_at"] = report["created_at"].isoformat()
                
        for report in verbal_reports:
            report["_id"] = str(report["_id"])
            if "created_at" in report:
                report["created_at"] = report["created_at"].isoformat()
                
        for report in nonverbal_reports:
            report["_id"] = str(report["_id"])
            if "created_at" in report:
                report["created_at"] = report["created_at"].isoformat()
        
        return {
            "success": True,
            "interview_reports": interview_reports,
            "verbal_reports": verbal_reports,
            "nonverbal_reports": nonverbal_reports
        }
        
    except Exception as e:
        print(f"Error fetching reports: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Upload a resume PDF file"""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Check file size (max 10MB)
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Upload to GridFS
        result = await FileHandler.upload_resume(
            file_content=file_content,
            filename=file.filename,
            user_id=user_id
        )
        
        if result["success"]:
            # Update user profile with resume file ID
            profiles_collection = get_profiles_collection()
            await profiles_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "resume_file_id": result["file_id"],
                        "resume_filename": result["original_filename"],
                        "resume_uploaded_at": datetime.utcnow()
                    }
                }
            )
            
            return {
                "success": True,
                "message": "Resume uploaded successfully",
                "file_id": result["file_id"],
                "filename": result["original_filename"],
                "size": result["size"]
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Upload failed"))
            
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error uploading resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resume/download/{file_id}")
async def download_resume(
    file_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Download a resume file"""
    try:
        # Download from GridFS
        result = await FileHandler.download_resume(file_id)
        
        if result and result["success"]:
            # Verify the file belongs to the user
            if result["metadata"].get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="Access denied")
            
            return Response(
                content=result["content"],
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{result["filename"]}"'
                }
            )
        else:
            raise HTTPException(status_code=404, detail="File not found")
            
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error downloading resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/resume/{file_id}")
async def delete_resume(
    file_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a resume file"""
    try:
        # First verify the file belongs to the user
        result = await FileHandler.download_resume(file_id)
        
        if not result or result["metadata"].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete from GridFS
        success = await FileHandler.delete_resume(file_id)
        
        if success:
            # Update user profile to remove resume reference
            profiles_collection = get_profiles_collection()
            await profiles_collection.update_one(
                {"user_id": user_id},
                {
                    "$unset": {
                        "resume_file_id": "",
                        "resume_filename": "",
                        "resume_uploaded_at": ""
                    }
                }
            )
            
            return {
                "success": True,
                "message": "Resume deleted successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete resume")
            
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error deleting resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resumes")
async def get_user_resumes(user_id: str = Depends(get_current_user_id)):
    """Get all resumes for the current user"""
    try:
        resumes = await FileHandler.get_user_resumes(user_id)
        
        return {
            "success": True,
            "resumes": resumes,
            "count": len(resumes)
        }
        
    except Exception as e:
        print(f"Error fetching resumes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

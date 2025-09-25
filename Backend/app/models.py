# SkillEdge-API/app/models.py
"""
Pydantic models for MongoDB documents
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson.objectid import ObjectId

class PyObjectId(str):
    """Custom ObjectId field for Pydantic models"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

# User Profile Models
class UserProfile(BaseModel):
    """User profile model for MongoDB"""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="Clerk user ID")
    first_name: str = Field(default="")
    last_name: str = Field(default="")
    email: Optional[str] = Field(default="")
    industry: Optional[str] = Field(default="")
    position: Optional[str] = Field(default="")
    experience: int = Field(default=0, description="Years of experience")
    skills: List[str] = Field(default_factory=list)
    bio: Optional[str] = Field(default="")
    # Resume stored in GridFS - referenced by resume_file_id in profile
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ProfileUpdate(BaseModel):
    """Model for profile updates"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    industry: Optional[str] = None
    position: Optional[str] = None
    experience: Optional[int] = None
    skills: Optional[List[str]] = None
    bio: Optional[str] = None

class ProfileResponse(BaseModel):
    """Response model for profile endpoints"""
    success: bool
    message: Optional[str] = None
    profile: Optional[Dict[str, Any]] = None

# Interview Report Models
class InterviewReport(BaseModel):
    """Interview report model"""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="Clerk user ID")
    interview_type: str = Field(..., description="Type of interview (technical/behavioral/resume)")
    role: str = Field(..., description="Position/role for the interview")
    questions: List[str] = Field(default_factory=list)
    answers: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class VerbalReport(BaseModel):
    """Verbal analysis report model"""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="Clerk user ID")
    interview_id: Optional[str] = Field(default=None, description="Reference to interview report")
    overall_score: float = Field(..., ge=0, le=100)
    summary: str
    metrics: Dict[str, Any] = Field(default_factory=dict)
    individual_answers: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    interview_readiness: str = Field(default="")
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class NonVerbalReport(BaseModel):
    """Non-verbal analysis report model - stores comprehensive non-verbal data including advanced voice analysis"""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="Clerk user ID")
    interview_id: Optional[str] = Field(default=None, description="Reference to interview report")
    analytics: Dict[str, Any] = Field(default_factory=dict)  # Store complete comprehensive non-verbal data
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class OverallReport(BaseModel):
    """Overall performance report model"""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="Clerk user ID")
    interview_id: Optional[str] = Field(default=None, description="Reference to interview report")
    overall_score: float = Field(..., ge=0, le=100)
    verbal_score: float = Field(..., ge=0, le=100)
    nonverbal_score: float = Field(..., ge=0, le=100)
    interview_readiness: str = Field(..., description="Overall readiness level")
    correlations: Dict[str, Any] = Field(default_factory=dict)
    action_items: List[Dict[str, Any]] = Field(default_factory=list)
    insights: Dict[str, Any] = Field(default_factory=dict)
    summary: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Request/Response models for API
class CreateProfileRequest(BaseModel):
    """Request model for creating a profile"""
    firstName: str
    lastName: str
    email: Optional[str] = None
    industry: Optional[str] = None
    position: Optional[str] = None
    experience: Optional[int] = 0
    skills: Optional[List[str]] = []
    bio: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    """Request model for updating a profile"""
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    industry: Optional[str] = None
    position: Optional[str] = None
    experience: Optional[int] = None
    skills: Optional[List[str]] = None
    bio: Optional[str] = None

class SaveInterviewReportRequest(BaseModel):
    """Request model for saving interview reports"""
    interview_type: str
    role: str
    questions: List[str]
    answers: List[str]
    verbal_report: Optional[Dict[str, Any]] = None
    nonverbal_report: Optional[Dict[str, Any]] = None
    overall_report: Optional[Dict[str, Any]] = None

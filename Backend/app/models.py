# SkillEdge-API/app/models.py
"""
Pydantic models for MongoDB documents
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson.objectid import ObjectId
import re

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

# User Authentication Models
class UserAuth(BaseModel):
    """User authentication model"""
    id: Optional[str] = Field(default=None, alias="_id")
    email: EmailStr = Field(..., description="User email address")
    password_hash: str = Field(..., description="Hashed password")
    first_name: str = Field(default="")
    last_name: str = Field(default="")
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserSignup(BaseModel):
    """User signup request"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    """Password change request"""
    current_password: str
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# User Profile Models
class UserProfile(BaseModel):
    """User profile model for MongoDB"""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="User ID from auth collection")
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
    impactAnalysis: Optional[Dict[str, Any]] = Field(default=None, description="Impact analysis data")
    summary: str
    # New fields for enhanced reporting
    next_steps: Optional[List[str]] = Field(default=None, description="Step-by-step actions for improvement")
    pro_tip: Optional[str] = Field(default=None, description="Guidance on how to prioritize actions")
    quick_win: Optional[str] = Field(default=None, description="Labeled quick win from report")
    estimated_time_to_complete: Optional[str] = Field(default=None, description="Estimated time to complete action items")
    key_insight_narrative: Optional[str] = Field(default=None, description="Narrative insight summarizing strengths vs weaknesses")
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
    session_id: Optional[str] = None  # For optimized duplicate detection
    created_at: Optional[str] = None  # For client-side timestamp

# Progress Tracking & Analytics Models
class UserGoal(BaseModel):
    """User goal model for tracking progress targets"""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="Clerk user ID")
    goal_type: str = Field(..., description="Type of goal (score_improvement, filler_words, speaking_speed, etc.)")
    target_value: float = Field(..., description="Target value for the goal")
    current_value: Optional[float] = Field(default=None, description="Current value")
    start_value: Optional[float] = Field(default=None, description="Starting value when goal was set")
    metric_name: str = Field(..., description="Name of the metric being tracked")
    deadline: Optional[datetime] = Field(default=None, description="Target completion date")
    status: str = Field(default="in_progress", description="Status: in_progress, completed, abandoned")
    progress_percentage: float = Field(default=0.0, ge=0, le=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SkillProgress(BaseModel):
    """Model to track progress of specific skills over time"""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="Clerk user ID")
    skill_category: str = Field(..., description="Category: communication, technical, non_verbal, etc.")
    skill_name: str = Field(..., description="Specific skill name")
    scores: List[float] = Field(default_factory=list, description="Historical scores")
    dates: List[datetime] = Field(default_factory=list, description="Dates corresponding to scores")
    interview_ids: List[str] = Field(default_factory=list, description="Interview IDs for reference")
    average_score: float = Field(default=0.0, ge=0, le=100)
    trend: str = Field(default="stable", description="Trend: improving, declining, stable")
    improvement_rate: float = Field(default=0.0, description="Rate of improvement per session")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ProgressSnapshot(BaseModel):
    """Periodic snapshot of overall user progress"""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="Clerk user ID")
    snapshot_date: datetime = Field(default_factory=datetime.utcnow)
    total_interviews: int = Field(default=0)
    average_overall_score: float = Field(default=0.0, ge=0, le=100)
    average_verbal_score: float = Field(default=0.0, ge=0, le=100)
    average_nonverbal_score: float = Field(default=0.0, ge=0, le=100)
    skills_improved: List[str] = Field(default_factory=list)
    skills_need_work: List[str] = Field(default_factory=list)
    active_goals: int = Field(default=0)
    completed_goals: int = Field(default=0)
    strengths: List[str] = Field(default_factory=list)
    improvements_needed: List[str] = Field(default_factory=list)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Request/Response Models for Progress & Analytics
class CreateGoalRequest(BaseModel):
    """Request model for creating a new goal"""
    goal_type: str
    target_value: float
    metric_name: str
    deadline: Optional[str] = None

class UpdateGoalRequest(BaseModel):
    """Request model for updating a goal"""
    status: Optional[str] = None
    progress_percentage: Optional[float] = None
    current_value: Optional[float] = None

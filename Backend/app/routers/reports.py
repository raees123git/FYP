# SkillEdge-API/app/routers/reports.py
"""
API endpoints for interview report management (trimmed to non-verbal saving and updates)
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Dict, Any
from datetime import datetime

from app.database import (
    get_interview_reports_collection,
    get_nonverbal_reports_collection,
)
from app.models import (
    InterviewReport,
    NonVerbalReport,
    SaveInterviewReportRequest,
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])

# Helper function to get user_id from headers
async def get_current_user_id(authorization: str = Header(...)) -> str:
    """Extract user ID from authorization header"""
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        return parts[1]
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.post("/save-interview", response_model=Dict[str, Any])
async def save_interview_report(
    request: SaveInterviewReportRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Save interview metadata and (optionally) a comprehensive non-verbal report."""
    try:
        interview_reports_collection = get_interview_reports_collection()
        nonverbal_reports_collection = get_nonverbal_reports_collection()

        # Check for recent duplicate (same user, same questions within last 5 minutes)
        from datetime import timedelta
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        existing = await interview_reports_collection.find_one({
            "user_id": user_id,
            "questions": request.questions,
            "created_at": {"$gte": five_minutes_ago}
        })
        if existing:
            return {
                "success": True,
                "message": "Interview already saved",
                "data": {
                    "interview_id": str(existing["_id"]),
                    "duplicate": True
                }
            }

        # Save interview metadata
        interview_report = InterviewReport(
            user_id=user_id,
            interview_type=request.interview_type,
            role=request.role,
            questions=request.questions,
            answers=request.answers,
            created_at=datetime.utcnow()
        )
        interview_dict = interview_report.dict(by_alias=True)
        interview_dict.pop("_id", None)
        interview_result = await interview_reports_collection.insert_one(interview_dict)
        interview_id = str(interview_result.inserted_id)

        response_data: Dict[str, Any] = {
            "interview_id": interview_id,
            "nonverbal_report_id": None,
        }

        # Save non-verbal report if provided
        if request.nonverbal_report:
            nonverbal_report = NonVerbalReport(
                user_id=user_id,
                interview_id=interview_id,
                analytics=request.nonverbal_report,  # Store the entire comprehensive report
                created_at=datetime.utcnow()
            )
            nonverbal_dict = nonverbal_report.dict(by_alias=True)
            nonverbal_dict.pop("_id", None)
            nonverbal_result = await nonverbal_reports_collection.insert_one(nonverbal_dict)
            response_data["nonverbal_report_id"] = str(nonverbal_result.inserted_id)

        return {
            "success": True,
            "message": "Interview saved successfully",
            "data": response_data,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

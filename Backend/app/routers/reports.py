# SkillEdge-API/app/routers/reports.py
"""
API endpoints for interview report management
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Dict, Any, List
from datetime import datetime
import json

from app.database import (
    get_interview_reports_collection,
    get_verbal_reports_collection,
    get_nonverbal_reports_collection,
    get_overall_reports_collection
)
from app.models import (
    InterviewReport,
    VerbalReport,
    NonVerbalReport,
    OverallReport,
    SaveInterviewReportRequest
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
    except Exception as e:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.post("/save-interview", response_model=Dict[str, Any])
async def save_interview_report(
    request: SaveInterviewReportRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Save complete interview report with verbal and non-verbal analysis"""
    try:
        interview_reports_collection = get_interview_reports_collection()
        verbal_reports_collection = get_verbal_reports_collection()
        nonverbal_reports_collection = get_nonverbal_reports_collection()
        
        # Check for recent duplicate (same user, same questions within last 5 minutes)
        from datetime import datetime, timedelta
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        
        existing = await interview_reports_collection.find_one({
            "user_id": user_id,
            "questions": request.questions,
            "created_at": {"$gte": five_minutes_ago}
        })
        
        if existing:
            print(f"Duplicate interview detected for user {user_id}, returning existing")
            return {
                "success": True,
                "message": "Interview already saved",
                "data": {
                    "interview_id": str(existing["_id"]),
                    "duplicate": True
                }
            }
        
        # Save interview report
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
        
        saved_reports = {
            "interview_id": interview_id,
            "verbal_report_id": None,
            "nonverbal_report_id": None
        }
        
        # Save verbal report if provided
        if request.verbal_report:
            verbal_report = VerbalReport(
                user_id=user_id,
                interview_id=interview_id,
                overall_score=request.verbal_report.get("overall_score", 0),
                summary=request.verbal_report.get("summary", ""),
                metrics=request.verbal_report.get("metrics", {}),
                strengths=request.verbal_report.get("strengths", []),
                improvements=request.verbal_report.get("improvements", []),
                created_at=datetime.utcnow()
            )
            
            verbal_dict = verbal_report.dict(by_alias=True)
            verbal_dict.pop("_id", None)
            
            verbal_result = await verbal_reports_collection.insert_one(verbal_dict)
            saved_reports["verbal_report_id"] = str(verbal_result.inserted_id)
        
        # Save non-verbal report if provided
        if request.nonverbal_report:
            nonverbal_report = NonVerbalReport(
                user_id=user_id,
                interview_id=interview_id,
                eye_contact_score=request.nonverbal_report.get("eye_contact_score", 0),
                body_language_score=request.nonverbal_report.get("body_language_score", 0),
                voice_modulation_score=request.nonverbal_report.get("voice_modulation_score", 0),
                facial_expressions_score=request.nonverbal_report.get("facial_expressions_score", 0),
                overall_confidence=request.nonverbal_report.get("overall_confidence", 0),
                feedback=request.nonverbal_report.get("feedback", ""),
                created_at=datetime.utcnow()
            )
            
            nonverbal_dict = nonverbal_report.dict(by_alias=True)
            nonverbal_dict.pop("_id", None)
            
            nonverbal_result = await nonverbal_reports_collection.insert_one(nonverbal_dict)
            saved_reports["nonverbal_report_id"] = str(nonverbal_result.inserted_id)
        
        return {
            "success": True,
            "message": "Interview report saved successfully",
            "data": saved_reports
        }
        
    except Exception as e:
        print(f"Error saving interview report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save-verbal", response_model=Dict[str, Any])
async def save_verbal_report(
    verbal_data: Dict[str, Any],
    user_id: str = Depends(get_current_user_id)
):
    """Save verbal analysis report from existing interview analysis"""
    try:
        verbal_reports_collection = get_verbal_reports_collection()
        
        # Extract metrics from the verbal data
        metrics = verbal_data.get("metrics", {})
        
        # Create strengths and improvements from the metrics
        strengths = []
        improvements = []
        
        # Extract strengths
        if "domain_knowledge" in metrics and "strengths" in metrics["domain_knowledge"]:
            strengths.extend(metrics["domain_knowledge"]["strengths"])
        
        if "answer_correctness" in metrics and metrics["answer_correctness"].get("score", 0) >= 70:
            strengths.append("Good technical accuracy in answers")
            
        if "response_structure" in metrics and metrics["response_structure"].get("score", 0) >= 70:
            strengths.append("Well-structured responses")
        
        # Extract improvements
        if "domain_knowledge" in metrics and "gaps" in metrics["domain_knowledge"]:
            improvements.extend([f"Improve knowledge in: {gap}" for gap in metrics["domain_knowledge"]["gaps"]])
        
        if "concepts_understanding" in metrics and "missing_concepts" in metrics["concepts_understanding"]:
            improvements.extend([f"Study: {concept}" for concept in metrics["concepts_understanding"]["missing_concepts"]])
        
        if "vocabulary_richness" in metrics and metrics["vocabulary_richness"].get("score", 0) < 70:
            improvements.append("Enhance technical vocabulary")
        
        verbal_report = VerbalReport(
            user_id=user_id,
            interview_id=verbal_data.get("interview_id"),
            overall_score=verbal_data.get("overall_score", 0),
            summary=verbal_data.get("summary", ""),
            metrics=metrics,
            strengths=strengths[:5],  # Limit to top 5
            improvements=improvements[:5],  # Limit to top 5
            created_at=datetime.utcnow()
        )
        
        verbal_dict = verbal_report.dict(by_alias=True)
        verbal_dict.pop("_id", None)
        
        result = await verbal_reports_collection.insert_one(verbal_dict)
        
        # Fetch the created report
        created_report = await verbal_reports_collection.find_one({"_id": result.inserted_id})
        created_report["_id"] = str(created_report["_id"])
        created_report["created_at"] = created_report["created_at"].isoformat()
        
        return {
            "success": True,
            "message": "Verbal report saved successfully",
            "report": created_report
        }
        
    except Exception as e:
        print(f"Error saving verbal report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/interview/{interview_id}", response_model=Dict[str, Any])
async def get_interview_report(
    interview_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific interview report with all analysis"""
    try:
        from bson import ObjectId
        
        interview_reports_collection = get_interview_reports_collection()
        verbal_reports_collection = get_verbal_reports_collection()
        nonverbal_reports_collection = get_nonverbal_reports_collection()
        
        # Fetch interview report
        interview = await interview_reports_collection.find_one({
            "_id": ObjectId(interview_id),
            "user_id": user_id
        })
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview report not found")
        
        # Fetch related verbal report
        verbal_report = await verbal_reports_collection.find_one({
            "interview_id": interview_id,
            "user_id": user_id
        })
        
        # Fetch related non-verbal report
        nonverbal_report = await nonverbal_reports_collection.find_one({
            "interview_id": interview_id,
            "user_id": user_id
        })
        
        # Convert ObjectIds to strings
        interview["_id"] = str(interview["_id"])
        if "created_at" in interview:
            interview["created_at"] = interview["created_at"].isoformat()
        
        if verbal_report:
            verbal_report["_id"] = str(verbal_report["_id"])
            if "created_at" in verbal_report:
                verbal_report["created_at"] = verbal_report["created_at"].isoformat()
        
        if nonverbal_report:
            nonverbal_report["_id"] = str(nonverbal_report["_id"])
            if "created_at" in nonverbal_report:
                nonverbal_report["created_at"] = nonverbal_report["created_at"].isoformat()
        
        return {
            "success": True,
            "interview": interview,
            "verbal_report": verbal_report,
            "nonverbal_report": nonverbal_report
        }
        
    except Exception as e:
        print(f"Error fetching interview report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent", response_model=Dict[str, Any])
async def get_recent_reports(
    limit: int = 10,
    user_id: str = Depends(get_current_user_id)
):
    """Get recent interview reports for a user"""
    try:
        interview_reports_collection = get_interview_reports_collection()
        
        # Fetch recent reports, sorted by creation date
        reports = await interview_reports_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Convert ObjectIds and dates to strings
        for report in reports:
            report["_id"] = str(report["_id"])
            if "created_at" in report:
                report["created_at"] = report["created_at"].isoformat()
        
        return {
            "success": True,
            "count": len(reports),
            "reports": reports
        }
        
    except Exception as e:
        print(f"Error fetching recent reports: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-nonverbal/{interview_id}", response_model=Dict[str, Any])
async def update_nonverbal_report(
    interview_id: str,
    nonverbal_data: Dict[str, Any],
    user_id: str = Depends(get_current_user_id)
):
    """Update or create non-verbal report for an existing interview"""
    try:
        nonverbal_reports_collection = get_nonverbal_reports_collection()
        
        # Check if non-verbal report already exists for this interview
        existing = await nonverbal_reports_collection.find_one({
            "interview_id": interview_id,
            "user_id": user_id
        })
        
        if existing:
            # Update existing report
            update_result = await nonverbal_reports_collection.update_one(
                {"interview_id": interview_id, "user_id": user_id},
                {"$set": {
                    "eye_contact_score": nonverbal_data.get("eye_contact_score", 0),
                    "body_language_score": nonverbal_data.get("body_language_score", 0),
                    "voice_modulation_score": nonverbal_data.get("voice_modulation_score", 0),
                    "facial_expressions_score": nonverbal_data.get("facial_expressions_score", 0),
                    "overall_confidence": nonverbal_data.get("overall_confidence", 0),
                    "feedback": nonverbal_data.get("feedback", ""),
                    "updated_at": datetime.utcnow()
                }}
            )
            return {
                "success": True,
                "message": "Non-verbal report updated successfully",
                "updated": update_result.modified_count
            }
        else:
            # Create new non-verbal report
            nonverbal_report = NonVerbalReport(
                user_id=user_id,
                interview_id=interview_id,
                eye_contact_score=nonverbal_data.get("eye_contact_score", 0),
                body_language_score=nonverbal_data.get("body_language_score", 0),
                voice_modulation_score=nonverbal_data.get("voice_modulation_score", 0),
                facial_expressions_score=nonverbal_data.get("facial_expressions_score", 0),
                overall_confidence=nonverbal_data.get("overall_confidence", 0),
                feedback=nonverbal_data.get("feedback", ""),
                created_at=datetime.utcnow()
            )
            
            nonverbal_dict = nonverbal_report.dict(by_alias=True)
            nonverbal_dict.pop("_id", None)
            
            result = await nonverbal_reports_collection.insert_one(nonverbal_dict)
            
            return {
                "success": True,
                "message": "Non-verbal report created successfully",
                "report_id": str(result.inserted_id)
            }
            
    except Exception as e:
        print(f"Error updating non-verbal report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-overall/{interview_id}", response_model=Dict[str, Any])
async def update_overall_report(
    interview_id: str,
    overall_data: Dict[str, Any],
    user_id: str = Depends(get_current_user_id)
):
    """Update or create overall report for an existing interview"""
    try:
        overall_reports_collection = get_overall_reports_collection()
        
        # Check if overall report already exists for this interview
        existing = await overall_reports_collection.find_one({
            "interview_id": interview_id,
            "user_id": user_id
        })
        
        if existing:
            # Update existing report
            update_result = await overall_reports_collection.update_one(
                {"interview_id": interview_id, "user_id": user_id},
                {"$set": {
                    "overall_score": overall_data.get("overall_score", 0),
                    "verbal_score": overall_data.get("verbal_score", 0),
                    "nonverbal_score": overall_data.get("nonverbal_score", 0),
                    "interview_readiness": overall_data.get("interview_readiness", ""),
                    "correlations": overall_data.get("correlations", {}),
                    "action_items": overall_data.get("action_items", []),
                    "insights": overall_data.get("insights", {}),
                    "summary": overall_data.get("summary", ""),
                    "updated_at": datetime.utcnow()
                }}
            )
            return {
                "success": True,
                "message": "Overall report updated successfully",
                "updated": update_result.modified_count
            }
        else:
            # Create new overall report
            overall_report = OverallReport(
                user_id=user_id,
                interview_id=interview_id,
                overall_score=overall_data.get("overall_score", 0),
                verbal_score=overall_data.get("verbal_score", 0),
                nonverbal_score=overall_data.get("nonverbal_score", 0),
                interview_readiness=overall_data.get("interview_readiness", ""),
                correlations=overall_data.get("correlations", {}),
                action_items=overall_data.get("action_items", []),
                insights=overall_data.get("insights", {}),
                summary=overall_data.get("summary", ""),
                created_at=datetime.utcnow()
            )
            
            overall_dict = overall_report.dict(by_alias=True)
            overall_dict.pop("_id", None)
            
            result = await overall_reports_collection.insert_one(overall_dict)
            
            return {
                "success": True,
                "message": "Overall report created successfully",
                "report_id": str(result.inserted_id)
            }
            
    except Exception as e:
        print(f"Error updating non-verbal report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-overall/{interview_id}", response_model=Dict[str, Any])
async def update_overall_report(
    interview_id: str,
    overall_data: Dict[str, Any],
    user_id: str = Depends(get_current_user_id)
):
    """Update or create overall report for an existing interview"""
    try:
        overall_reports_collection = get_overall_reports_collection()
        
        # Check if overall report already exists for this interview
        existing = await overall_reports_collection.find_one({
            "interview_id": interview_id,
            "user_id": user_id
        })
        
        if existing:
            # Update existing report
            update_result = await overall_reports_collection.update_one(
                {"interview_id": interview_id, "user_id": user_id},
                {"$set": {
                    "overall_score": overall_data.get("overall_score", 0),
                    "verbal_score": overall_data.get("verbal_score", 0),
                    "nonverbal_score": overall_data.get("nonverbal_score", 0),
                    "interview_readiness": overall_data.get("interview_readiness", ""),
                    "correlations": overall_data.get("correlations", {}),
                    "action_items": overall_data.get("action_items", []),
                    "insights": overall_data.get("insights", {}),
                    "summary": overall_data.get("summary", ""),
                    "updated_at": datetime.utcnow()
                }}
            )
            return {
                "success": True,
                "message": "Overall report updated successfully",
                "updated": update_result.modified_count
            }
        else:
            # Create new overall report
            overall_report = OverallReport(
                user_id=user_id,
                interview_id=interview_id,
                overall_score=overall_data.get("overall_score", 0),
                verbal_score=overall_data.get("verbal_score", 0),
                nonverbal_score=overall_data.get("nonverbal_score", 0),
                interview_readiness=overall_data.get("interview_readiness", ""),
                correlations=overall_data.get("correlations", {}),
                action_items=overall_data.get("action_items", []),
                insights=overall_data.get("insights", {}),
                summary=overall_data.get("summary", ""),
                created_at=datetime.utcnow()
            )
            
            overall_dict = overall_report.dict(by_alias=True)
            overall_dict.pop("_id", None)
            
            result = await overall_reports_collection.insert_one(overall_dict)
            
            return {
                "success": True,
                "message": "Overall report created successfully",
                "report_id": str(result.inserted_id)
            }
            
    except Exception as e:
        print(f"Error updating overall report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{report_id}", response_model=Dict[str, Any])
async def delete_report(
    report_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete an interview report and its analysis"""
    try:
        from bson import ObjectId
        
        interview_reports_collection = get_interview_reports_collection()
        verbal_reports_collection = get_verbal_reports_collection()
        nonverbal_reports_collection = get_nonverbal_reports_collection()
        
        # Delete interview report
        interview_result = await interview_reports_collection.delete_one({
            "_id": ObjectId(report_id),
            "user_id": user_id
        })
        
        # Delete related verbal and non-verbal reports
        verbal_result = await verbal_reports_collection.delete_many({
            "interview_id": report_id,
            "user_id": user_id
        })
        
        nonverbal_result = await nonverbal_reports_collection.delete_many({
            "interview_id": report_id,
            "user_id": user_id
        })
        
        if interview_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {
            "success": True,
            "message": "Report deleted successfully",
            "deleted": {
                "interview": interview_result.deleted_count,
                "verbal": verbal_result.deleted_count,
                "nonverbal": nonverbal_result.deleted_count
            }
        }
        
    except Exception as e:
        print(f"Error deleting report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
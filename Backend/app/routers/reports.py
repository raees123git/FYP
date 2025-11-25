# SkillEdge-API/app/routers/reports.py
"""
API endpoints for interview report management (verbal, non-verbal, and overall reports)
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Dict, Any
from datetime import datetime

from app.database import (
    get_interview_reports_collection,
    get_nonverbal_reports_collection,
    get_verbal_reports_collection,
    get_overall_reports_collection,
)
from app.models import (
    InterviewReport,
    NonVerbalReport,
    VerbalReport,
    OverallReport,
    SaveInterviewReportRequest,
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("/save-interview", response_model=Dict[str, Any])
async def save_interview_report(
    request: SaveInterviewReportRequest,
    user_id: str = Depends(get_current_user)
):
    """Optimized save for interview metadata, verbal report, non-verbal report, and overall report."""
    import time
    start_time = time.time()
    
    try:
        interview_reports_collection = get_interview_reports_collection()
        nonverbal_reports_collection = get_nonverbal_reports_collection()
        
        print(f"💾 Starting OPTIMIZED database save for user: {user_id[:8]}...")
        setup_time = time.time()
        print(f"⏱️ Backend Phase 1 - Setup: {(setup_time - start_time):.4f}s")

        # FIXED DUPLICATE DETECTION: Check for exact same interview content (not just session)
        # This allows multiple interviews but prevents duplicate saves of the same interview
        session_id = getattr(request, 'session_id', None)
        
        # Check for duplicate based on user + questions + answers combination
        # This ensures we don't save the exact same interview twice while allowing multiple different interviews
        from datetime import timedelta
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        
        duplicate_check_query = {
            "user_id": user_id,
            "questions": request.questions,
            "answers": request.answers,  # Include answers to ensure it's exactly the same interview
            "created_at": {"$gte": five_minutes_ago}
        }
        
        # If session_id is available, also check for that specific session to be more precise
        if session_id:
            duplicate_check_query["session_id"] = session_id
        
        existing = await interview_reports_collection.find_one(
            duplicate_check_query,
            {"_id": 1, "session_id": 1}  # Fetch only required fields for speed
        )
        
        if existing:
            existing_session = existing.get("session_id", "unknown")
            print(f"✅ Found duplicate interview - Session: {existing_session}")
            return {
                "success": True,
                "message": "Interview already saved",
                "data": {
                    "interview_id": str(existing["_id"]),
                    "duplicate": True
                }
            }
        
        
        duplicate_check_time = time.time()
        print(f"⏱️ Backend Phase 2 - Duplicate check: {(duplicate_check_time - setup_time):.4f}s")
        print(f"🆕 New interview detected - will save to database")

        # OPTIMIZATION 2: Prepare documents for bulk operations
        current_time = datetime.utcnow()
        
        # Prepare interview document
        interview_doc = {
            "user_id": user_id,
            "interview_type": request.interview_type,
            "role": request.role,
            "questions": request.questions,
            "answers": request.answers,
            "created_at": current_time
        }
        
        # Add session_id to interview document if available
        if session_id:
            interview_doc["session_id"] = session_id
        
        # OPTIMIZATION 3: Single database write for interview with write concern optimization
        db_write_start = time.time()
        # Use write concern for faster writes (acknowledge without waiting for journal)
        interview_result = await interview_reports_collection.insert_one(
            interview_doc,
            # Optimize for speed - don't wait for journal sync
        )
        interview_id = str(interview_result.inserted_id)
        db_write_time = time.time()
        print(f"⏱️ Backend Phase 3 - Interview DB write: {(db_write_time - db_write_start):.4f}s")
        
        response_data: Dict[str, Any] = {
            "interview_id": interview_id,
            "verbal_report_id": None,
            "nonverbal_report_id": None,
            "overall_report_id": None,
        }

        # Get additional collections
        verbal_reports_collection = get_verbal_reports_collection()
        overall_reports_collection = get_overall_reports_collection()

        # OPTIMIZATION 4a: Save verbal report (if provided)
        verbal_save_time = 0
        if request.verbal_report:
            print(f"💾 Saving verbal report...")
            
            verbal_start = time.time()
            verbal_doc = {
                "user_id": user_id,
                "interview_id": interview_id,
                **request.verbal_report,  # Spread all verbal report data
                "created_at": current_time
            }
            
            # Single optimized insert
            verbal_result = await verbal_reports_collection.insert_one(verbal_doc)
            response_data["verbal_report_id"] = str(verbal_result.inserted_id)
            
            verbal_end = time.time()
            verbal_save_time = verbal_end - verbal_start
            print(f"⏱️ Backend Phase 4a - Verbal DB write: {verbal_save_time:.4f}s")
            print(f"✅ Verbal report saved with ID: {response_data['verbal_report_id']}")

        # OPTIMIZATION 4b: Save non-verbal report (if provided)
        nonverbal_save_time = 0
        if request.nonverbal_report:
            print(f"💾 Saving comprehensive non-verbal report...")
            
            nonverbal_start = time.time()
            nonverbal_doc = {
                "user_id": user_id,
                "interview_id": interview_id,
                "analytics": request.nonverbal_report,  # Store the entire comprehensive report
                "created_at": current_time
            }
            
            # Single optimized insert
            nonverbal_result = await nonverbal_reports_collection.insert_one(nonverbal_doc)
            response_data["nonverbal_report_id"] = str(nonverbal_result.inserted_id)
            
            nonverbal_end = time.time()
            nonverbal_save_time = nonverbal_end - nonverbal_start
            print(f"⏱️ Backend Phase 4b - Non-verbal DB write: {nonverbal_save_time:.4f}s")
            print(f"✅ Non-verbal report saved with ID: {response_data['nonverbal_report_id']}")

        # OPTIMIZATION 4c: Save overall report (if provided)
        overall_save_time = 0
        if request.overall_report:
            print(f"💾 Saving overall report...")
            
            overall_start = time.time()
            overall_doc = {
                "user_id": user_id,
                "interview_id": interview_id,
                **request.overall_report,  # Spread all overall report data
                "created_at": current_time
            }
            
            # Single optimized insert
            overall_result = await overall_reports_collection.insert_one(overall_doc)
            response_data["overall_report_id"] = str(overall_result.inserted_id)
            
            overall_end = time.time()
            overall_save_time = overall_end - overall_start
            print(f"⏱️ Backend Phase 4c - Overall DB write: {overall_save_time:.4f}s")
            print(f"✅ Overall report saved with ID: {response_data['overall_report_id']}")

        total_backend_time = time.time() - start_time
        print(f"🏁 TOTAL BACKEND PROCESSING TIME: {total_backend_time:.4f}s")
        print(f"✅ BACKEND PERFORMANCE BREAKDOWN: Setup={((setup_time - start_time)):.4f}s, DuplicateCheck={((duplicate_check_time - setup_time)):.4f}s, InterviewDB={((db_write_time - db_write_start)):.4f}s, VerbalDB={verbal_save_time:.4f}s, NonVerbalDB={nonverbal_save_time:.4f}s, OverallDB={overall_save_time:.4f}s, Total={total_backend_time:.4f}s")
        
        return {
            "success": True,
            "message": "Interview saved successfully",
            "data": response_data,
        }

    except Exception as e:
        print(f"❌ Database save error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-interviews", response_model=Dict[str, Any])
async def get_user_interviews(user_id: str = Depends(get_current_user)):
    """Get all interviews for the current user"""
    try:
        interview_reports_collection = get_interview_reports_collection()
        
        print(f"🔍 GET USER INTERVIEWS - Fetching interviews for user_id: {user_id}")
        
        # Fetch all interviews for the user, sorted by creation date (newest first)
        interviews_cursor = interview_reports_collection.find(
            {"user_id": user_id},
            {
                "_id": 1,
                "interview_type": 1,
                "role": 1,
                "questions": 1,
                "answers": 1,
                "created_at": 1,
                "session_id": 1
            }
        ).sort("created_at", -1)
        
        interviews = await interviews_cursor.to_list(length=None)
        
        print(f"✅ GET USER INTERVIEWS - Found {len(interviews)} interviews for user_id: {user_id}")
        
        # Convert ObjectId to string for JSON serialization
        for interview in interviews:
            interview["_id"] = str(interview["_id"])
            
        return {
            "success": True,
            "reports": interviews,
            "count": len(interviews)
        }
        
    except Exception as e:
        print(f"❌ GET USER INTERVIEWS ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/interview/{interview_id}", response_model=Dict[str, Any])
async def get_interview_details(
    interview_id: str, 
    user_id: str = Depends(get_current_user)
):
    """Get detailed information about a specific interview including all reports"""
    try:
        from bson.objectid import ObjectId
        
        # Validate ObjectId format
        if not ObjectId.is_valid(interview_id):
            raise HTTPException(status_code=400, detail="Invalid interview ID format")
        
        interview_reports_collection = get_interview_reports_collection()
        verbal_reports_collection = get_verbal_reports_collection()
        nonverbal_reports_collection = get_nonverbal_reports_collection()
        overall_reports_collection = get_overall_reports_collection()
        
        # Fetch the main interview record
        interview = await interview_reports_collection.find_one(
            {"_id": ObjectId(interview_id), "user_id": user_id}
        )
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Convert ObjectId to string
        interview["_id"] = str(interview["_id"])
        
        # Fetch related reports
        verbal_report = await verbal_reports_collection.find_one(
            {"interview_id": interview_id, "user_id": user_id}
        )
        if verbal_report:
            verbal_report["_id"] = str(verbal_report["_id"])
        
        nonverbal_report = await nonverbal_reports_collection.find_one(
            {"interview_id": interview_id, "user_id": user_id}
        )
        if nonverbal_report:
            original_id = str(nonverbal_report["_id"])
            
            # Unwrap analytics to match viewer expectations
            if "analytics" in nonverbal_report:
                # The comprehensive report is stored under "analytics" key
                comprehensive_data = nonverbal_report["analytics"]
                
                # Check if this is the comprehensive format with nested analytics
                if isinstance(comprehensive_data, dict) and "analytics" in comprehensive_data:
                    # This is the comprehensive report - flatten it completely
                    analytics = comprehensive_data.pop("analytics", {})
                    audio_metrics = comprehensive_data.pop("audioMetrics", None)
                    
                    # Start with the comprehensive data (has all the extra fields)
                    nonverbal_report = comprehensive_data.copy()
                    
                    # Merge in analytics fields at root level
                    if isinstance(analytics, dict):
                        for key, value in analytics.items():
                            if key not in nonverbal_report:
                                nonverbal_report[key] = value
                    
                    # Ensure audioMetrics is available at root
                    if audio_metrics:
                        nonverbal_report["audioMetrics"] = audio_metrics
                        
                elif isinstance(comprehensive_data, dict):
                    # Simple analytics format - use as is
                    nonverbal_report = comprehensive_data.copy()
            
            # Preserve the ID
            nonverbal_report["_id"] = original_id
            
            # Ensure required fields exist with fallbacks
            if not nonverbal_report.get("speakingStats"):
                # Try to build from analytics data
                analytics = nonverbal_report.get("analytics", nonverbal_report)
                nonverbal_report["speakingStats"] = {
                    "totalSpeakingTime": analytics.get("totalTime", 0),
                    "totalWordsSpoken": analytics.get("totalWords", 0),
                    "questionsAnswered": analytics.get("questionCount", 0),
                    "avgWordsPerAnswer": round(analytics.get("totalWords", 0) / max(analytics.get("questionCount", 1), 1)) if analytics.get("totalWords", 0) > 0 else 0
                }
        
        overall_report = await overall_reports_collection.find_one(
            {"interview_id": interview_id, "user_id": user_id}
        )
        if overall_report:
            overall_report["_id"] = str(overall_report["_id"])
        
        return {
            "success": True,
            "interview": interview,
            "verbal_report": verbal_report,
            "nonverbal_report": nonverbal_report,
            "overall_report": overall_report,
            "has_reports": {
                "verbal": verbal_report is not None,
                "nonverbal": nonverbal_report is not None,
                "overall": overall_report is not None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching interview details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


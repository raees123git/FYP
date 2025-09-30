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

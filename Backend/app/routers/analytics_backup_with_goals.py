# # SkillEdge-API/app/routers/analytics.py
# """
# API endpoints for progress tracking and analytics
# """

# from fastapi import APIRouter, HTTPException, Depends
# from typing import Dict, Any, List
# from datetime import datetime, timedelta
# from bson.objectid import ObjectId
# import statistics

# from app.database import (
#     get_database,
#     get_interview_reports_collection,
#     get_verbal_reports_collection,
#     get_nonverbal_reports_collection,
#     get_overall_reports_collection,
# )
# from app.models import (
#     SkillProgress,
#     ProgressSnapshot,
# )
# from app.routers.auth import get_current_user

# router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


# @router.get("/test-data", response_model=Dict[str, Any])
# async def test_data(user_id: str = Depends(get_current_user)):
#     """Test endpoint to check what data exists"""
#     try:
#         interview_reports_collection = get_interview_reports_collection()
        
#         # Get count of all interviews
#         total_count = await interview_reports_collection.count_documents({})
        
#         # Get count for this user
#         user_count = await interview_reports_collection.count_documents({"user_id": user_id})
        
#         # Get sample interviews
#         all_samples = await interview_reports_collection.find({}).limit(3).to_list(length=3)
#         user_samples = await interview_reports_collection.find({"user_id": user_id}).limit(3).to_list(length=3)
        
#         return {
#             "success": True,
#             "current_user_id": user_id,
#             "total_interviews_in_db": total_count,
#             "interviews_for_current_user": user_count,
#             "sample_all_interviews": [
#                 {
#                     "_id": str(s.get("_id")),
#                     "user_id": s.get("user_id"),
#                     "interview_type": s.get("interview_type"),
#                     "created_at": s.get("created_at").isoformat() if s.get("created_at") else None
#                 } for s in all_samples
#             ],
#             "sample_user_interviews": [
#                 {
#                     "_id": str(s.get("_id")),
#                     "user_id": s.get("user_id"),
#                     "interview_type": s.get("interview_type"),
#                     "created_at": s.get("created_at").isoformat() if s.get("created_at") else None
#                 } for s in user_samples
#             ]
#         }
#     except Exception as e:
#         return {
#             "success": False,
#             "error": str(e)
#         }


# @router.get("/dashboard", response_model=Dict[str, Any])
# async def get_analytics_dashboard(user_id: str = Depends(get_current_user)):
#     """Get comprehensive analytics dashboard data for the user"""
#     try:
#         print(f"🔍 Analytics Dashboard - User ID: {user_id}")
        
#         interview_reports_collection = get_interview_reports_collection()
#         verbal_reports_collection = get_verbal_reports_collection()
#         nonverbal_reports_collection = get_nonverbal_reports_collection()
#         overall_reports_collection = get_overall_reports_collection()
        
#         # Get all interviews for the user
#         interviews_cursor = interview_reports_collection.find(
#             {"user_id": user_id}
#         ).sort("created_at", 1)  # Sort by oldest first for trend analysis
        
#         interviews = await interviews_cursor.to_list(length=None)
        
#         print(f"📊 Found {len(interviews)} interviews for user {user_id}")
        
#         if not interviews:
#             # Debug: Let's check if there are any interviews at all
#             all_interviews = await interview_reports_collection.find({}).to_list(length=5)
#             print(f"⚠️ No interviews found for user_id: {user_id}")
#             print(f"📝 Sample of interview user_ids in database:")
#             for interview in all_interviews:
#                 print(f"   - Interview ID: {interview.get('_id')}, user_id: {interview.get('user_id')}")
            
#             return {
#                 "success": True,
#                 "message": "No interviews found. Complete some interviews to see your progress!",
#                 "data": {
#                     "total_interviews": 0,
#                     "trends": [],
#                     "recent_performance": {},
#                     "skill_breakdown": {}
#                 }
#             }
        
#         # Get all related reports
#         interview_ids = [str(interview["_id"]) for interview in interviews]
        
#         verbal_reports = await verbal_reports_collection.find(
#             {"interview_id": {"$in": interview_ids}}
#         ).to_list(length=None)
        
#         nonverbal_reports = await nonverbal_reports_collection.find(
#             {"interview_id": {"$in": interview_ids}}
#         ).to_list(length=None)
        
#         overall_reports = await overall_reports_collection.find(
#             {"interview_id": {"$in": interview_ids}}
#         ).to_list(length=None)
        
#         # Create lookup dictionaries
#         verbal_lookup = {report["interview_id"]: report for report in verbal_reports}
#         nonverbal_lookup = {report["interview_id"]: report for report in nonverbal_reports}
#         overall_lookup = {report["interview_id"]: report for report in overall_reports}
        
#         # Calculate trends over time
#         trends = []
#         for interview in interviews:
#             interview_id = str(interview["_id"])
#             overall = overall_lookup.get(interview_id, {})
            
#             if overall:
#                 trends.append({
#                     "date": interview.get("created_at", datetime.utcnow()).isoformat(),
#                     "overall_score": overall.get("overall_score", 0),
#                     "verbal_score": overall.get("verbal_score", 0),
#                     "nonverbal_score": overall.get("nonverbal_score", 0),
#                     "interview_type": interview.get("interview_type", "Unknown"),
#                     "role": interview.get("role", ""),
#                 })
        
#         # Calculate skill breakdown
#         skill_scores = {
#             "communication": [],
#             "technical_knowledge": [],
#             "clarity": [],
#             "confidence": [],
#             "filler_words": [],
#             "speaking_speed": [],
#         }
        
#         for interview in interviews:
#             interview_id = str(interview["_id"])
#             verbal = verbal_lookup.get(interview_id, {})
#             nonverbal = nonverbal_lookup.get(interview_id, {})
            
#             # Extract skill metrics from verbal reports
#             if verbal and "metrics" in verbal:
#                 metrics = verbal.get("metrics", {})
                
#                 # Communication: Average of response_structure and vocabulary_richness
#                 if "response_structure" in metrics and "vocabulary_richness" in metrics:
#                     response_struct = metrics["response_structure"]
#                     vocab_rich = metrics["vocabulary_richness"]
                    
#                     # Extract score from dict
#                     response_score = response_struct.get("score", 0) if isinstance(response_struct, dict) else response_struct
#                     vocab_score = vocab_rich.get("score", 0) if isinstance(vocab_rich, dict) else vocab_rich
                    
#                     if response_score > 0 or vocab_score > 0:
#                         communication_score = (response_score + vocab_score) / 2
#                         skill_scores["communication"].append(communication_score)
#                         print(f"✅ Communication: {communication_score} (response={response_score}, vocab={vocab_score})")
                
#                 # Technical Knowledge: Average of domain_knowledge and concepts_understanding
#                 if "domain_knowledge" in metrics and "concepts_understanding" in metrics:
#                     domain = metrics["domain_knowledge"]
#                     concepts = metrics["concepts_understanding"]
                    
#                     # Extract score from dict
#                     domain_score = domain.get("score", 0) if isinstance(domain, dict) else domain
#                     concepts_score = concepts.get("score", 0) if isinstance(concepts, dict) else concepts
                    
#                     if domain_score > 0 or concepts_score > 0:
#                         tech_score = (domain_score + concepts_score) / 2
#                         skill_scores["technical_knowledge"].append(tech_score)
#                         print(f"✅ Technical Knowledge: {tech_score} (domain={domain_score}, concepts={concepts_score})")
                
#                 # Clarity: Average of answer_correctness and depth_of_explanation
#                 if "answer_correctness" in metrics and "depth_of_explanation" in metrics:
#                     correctness = metrics["answer_correctness"]
#                     depth = metrics["depth_of_explanation"]
                    
#                     # Extract score from dict
#                     correctness_score = correctness.get("score", 0) if isinstance(correctness, dict) else correctness
#                     depth_score = depth.get("score", 0) if isinstance(depth, dict) else depth
                    
#                     if correctness_score > 0 or depth_score > 0:
#                         clarity_score = (correctness_score + depth_score) / 2
#                         skill_scores["clarity"].append(clarity_score)
#                         print(f"✅ Clarity: {clarity_score} (correctness={correctness_score}, depth={depth_score})")
            
#             # Extract skill metrics from non-verbal reports
#             if nonverbal and "analytics" in nonverbal:
#                 analytics = nonverbal.get("analytics", {})
                
#                 # Confidence: Extract from confidenceScores
#                 if "confidenceScores" in analytics:
#                     confidence_data = analytics["confidenceScores"]
#                     if isinstance(confidence_data, dict):
#                         # Try overallConfidence first (from your actual data)
#                         if "overallConfidence" in confidence_data:
#                             conf_score = confidence_data["overallConfidence"]
#                             if isinstance(conf_score, (int, float)):
#                                 skill_scores["confidence"].append(conf_score)
#                                 print(f"✅ Confidence: {conf_score}")
#                         # Fallback to other confidence metrics
#                         elif "voiceModulationScore" in confidence_data:
#                             voice_score = confidence_data.get("voiceModulationScore", 0)
#                             if isinstance(voice_score, (int, float)):
#                                 skill_scores["confidence"].append(voice_score)
#                                 print(f"✅ Confidence: {voice_score} (from voiceModulation)")
                
#                 # Filler words: Extract from fillerWordsBreakdown
#                 if "fillerWordsBreakdown" in analytics:
#                     filler_data = analytics["fillerWordsBreakdown"]
#                     if isinstance(filler_data, dict):
#                         # Get percentage directly (it's a string in your data: '0.0')
#                         if "percentage" in filler_data:
#                             filler_pct_str = filler_data.get("percentage", "0")
#                             try:
#                                 filler_pct = float(filler_pct_str)
#                                 # Convert to score (lower filler = higher score)
#                                 # If 0% fillers = 100 score, if 10% fillers = 0 score
#                                 filler_score = max(0, 100 - (filler_pct * 10))
#                                 skill_scores["filler_words"].append(filler_score)
#                                 print(f"✅ Filler Words: {filler_score} (from {filler_pct}% fillers)")
#                             except (ValueError, TypeError):
#                                 pass
#                         # Fallback: calculate from totalCount
#                         elif "totalCount" in filler_data:
#                             total_fillers = filler_data.get("totalCount", 0)
#                             # Assume good score if no fillers detected
#                             if total_fillers == 0:
#                                 skill_scores["filler_words"].append(100)
#                                 print(f"✅ Filler Words: 100 (no fillers detected)")
#                         # Or use percentage directly if available
#                         elif "fillerPercentage" in filler_data:
#                             filler_pct = filler_data.get("fillerPercentage", 0)
#                             filler_score = max(0, 100 - (filler_pct * 2))
#                             skill_scores["filler_words"].append(filler_score)
                
#                 # Speaking speed: Extract from speakingStats
#                 if "speakingStats" in analytics:
#                     speaking_data = analytics["speakingStats"]
#                     if isinstance(speaking_data, dict):
#                         # Calculate WPM from totalWordsSpoken and totalSpeakingTime
#                         if "totalWordsSpoken" in speaking_data and "totalSpeakingTime" in speaking_data:
#                             total_words = speaking_data.get("totalWordsSpoken", 0)
#                             total_time_seconds = speaking_data.get("totalSpeakingTime", 1)
                            
#                             if total_time_seconds > 0:
#                                 # Calculate words per minute
#                                 wpm = (total_words / total_time_seconds) * 60
                                
#                                 # Ideal WPM is 130-150, score based on proximity
#                                 ideal_wpm = 140
#                                 deviation = abs(wpm - ideal_wpm)
#                                 speed_score = max(0, 100 - (deviation / 2))
#                                 skill_scores["speaking_speed"].append(speed_score)
#                                 print(f"✅ Speaking Speed: {speed_score} ({wpm:.1f} WPM)")
#                         # Fallback: if wordsPerMinute is directly available
#                         elif "wordsPerMinute" in speaking_data:
#                             wpm = speaking_data.get("wordsPerMinute", 0)
#                             if isinstance(wpm, (int, float)):
#                                 ideal_wpm = 140
#                                 deviation = abs(wpm - ideal_wpm)
#                                 speed_score = max(0, 100 - (deviation / 2))
#                                 skill_scores["speaking_speed"].append(speed_score)
#                                 print(f"✅ Speaking Speed: {speed_score} ({wpm:.1f} WPM)")
        
#         # Calculate averages and trends for each skill
#         skill_breakdown = {}
#         print(f"🔍 Skill scores collected: {[(skill, len(scores)) for skill, scores in skill_scores.items()]}")
        
#         for skill, scores in skill_scores.items():
#             if scores:
#                 avg_score = statistics.mean(scores)
                
#                 # Calculate trend (comparing first half vs second half)
#                 mid_point = len(scores) // 2
#                 if len(scores) >= 4:
#                     first_half = statistics.mean(scores[:mid_point]) if mid_point > 0 else 0
#                     second_half = statistics.mean(scores[mid_point:]) if len(scores[mid_point:]) > 0 else 0
#                     improvement = second_half - first_half
                    
#                     if improvement > 5:
#                         trend = "improving"
#                     elif improvement < -5:
#                         trend = "declining"
#                     else:
#                         trend = "stable"
#                 else:
#                     trend = "insufficient_data"
#                     improvement = 0
                
#                 skill_breakdown[skill] = {
#                     "average_score": round(avg_score, 2),
#                     "trend": trend,
#                     "improvement": round(improvement, 2),
#                     "total_sessions": len(scores),
#                     "scores_history": scores,
#                 }
        
#         # Recent performance (last 5 interviews)
#         recent_trends = trends[-5:] if len(trends) >= 5 else trends
        
#         recent_performance = {
#             "average_overall": round(statistics.mean([t["overall_score"] for t in recent_trends if t.get("overall_score")]), 2) if recent_trends else 0,
#             "average_verbal": round(statistics.mean([t["verbal_score"] for t in recent_trends if t.get("verbal_score")]), 2) if recent_trends else 0,
#             "average_nonverbal": round(statistics.mean([t["nonverbal_score"] for t in recent_trends if t.get("nonverbal_score")]), 2) if recent_trends else 0,
#             "recent_interviews": recent_trends,
#         }
        
#         # Calculate overall statistics
#         if overall_reports:
#             all_overall_scores = [r.get("overall_score", 0) for r in overall_reports if r.get("overall_score")]
#             best_score = max(all_overall_scores) if all_overall_scores else 0
#             avg_score = statistics.mean(all_overall_scores) if all_overall_scores else 0
#         else:
#             best_score = 0
#             avg_score = 0
        
#         return {
#             "success": True,
#             "data": {
#                 "total_interviews": len(interviews),
#                 "trends": trends,
#                 "recent_performance": recent_performance,
#                 "skill_breakdown": skill_breakdown,
#                 "statistics": {
#                     "best_score": round(best_score, 2),
#                     "average_score": round(avg_score, 2),
#                     "total_questions_answered": sum([len(i.get("questions", [])) for i in interviews]),
#                 }
#             }
#         }
        
#     except Exception as e:
#         print(f"❌ Error fetching analytics dashboard: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# @router.get("/skill-trends", response_model=Dict[str, Any])
# async def get_skill_trends(
#     skill: str = None,
#     user_id: str = Depends(get_current_user)
# ):
#     """Get detailed trend analysis for specific skills"""
#     try:
#         verbal_reports_collection = get_verbal_reports_collection()
#         nonverbal_reports_collection = get_nonverbal_reports_collection()
#         interview_reports_collection = get_interview_reports_collection()
        
#         # Get all reports for the user
#         verbal_reports = await verbal_reports_collection.find(
#             {"user_id": user_id}
#         ).sort("created_at", 1).to_list(length=None)
        
#         nonverbal_reports = await nonverbal_reports_collection.find(
#             {"user_id": user_id}
#         ).sort("created_at", 1).to_list(length=None)
        
#         # Analyze trends for all skills
#         skill_trends = {}
        
#         # Communication skills from verbal reports
#         communication_data = []
#         for report in verbal_reports:
#             if "metrics" in report and "communication_skills" in report["metrics"]:
#                 comm = report["metrics"]["communication_skills"]
#                 if isinstance(comm, dict) and "score" in comm:
#                     communication_data.append({
#                         "date": report.get("created_at", datetime.utcnow()).isoformat(),
#                         "score": comm["score"],
#                         "interview_id": report.get("interview_id", ""),
#                     })
        
#         if communication_data:
#             skill_trends["communication"] = {
#                 "data": communication_data,
#                 "average": statistics.mean([d["score"] for d in communication_data]),
#                 "trend": "improving" if communication_data[-1]["score"] > communication_data[0]["score"] else "declining" if communication_data[-1]["score"] < communication_data[0]["score"] else "stable",
#             }
        
#         # Technical knowledge from verbal reports
#         technical_data = []
#         for report in verbal_reports:
#             if "metrics" in report and "technical_depth" in report["metrics"]:
#                 tech = report["metrics"]["technical_depth"]
#                 if isinstance(tech, dict) and "score" in tech:
#                     technical_data.append({
#                         "date": report.get("created_at", datetime.utcnow()).isoformat(),
#                         "score": tech["score"],
#                         "interview_id": report.get("interview_id", ""),
#                     })
        
#         if technical_data:
#             skill_trends["technical_knowledge"] = {
#                 "data": technical_data,
#                 "average": statistics.mean([d["score"] for d in technical_data]),
#                 "trend": "improving" if technical_data[-1]["score"] > technical_data[0]["score"] else "declining" if technical_data[-1]["score"] < technical_data[0]["score"] else "stable",
#             }
        
#         # Non-verbal skills
#         filler_data = []
#         speed_data = []
        
#         for report in nonverbal_reports:
#             if "analytics" in report:
#                 analytics = report["analytics"]
#                 created_at = report.get("created_at", datetime.utcnow()).isoformat()
#                 interview_id = report.get("interview_id", "")
                
#                 # Filler words
#                 if "fillerPercentage" in analytics:
#                     filler_pct = analytics["fillerPercentage"]
#                     # Convert to score (lower filler = higher score)
#                     filler_score = max(0, 100 - (filler_pct * 10))
#                     filler_data.append({
#                         "date": created_at,
#                         "score": filler_score,
#                         "raw_value": filler_pct,
#                         "interview_id": interview_id,
#                     })
                
#                 # Speaking speed
#                 if "wordsPerMinute" in analytics:
#                     wpm = analytics["wordsPerMinute"]
#                     ideal_wpm = 140
#                     deviation = abs(wpm - ideal_wpm)
#                     speed_score = max(0, 100 - (deviation / 2))
#                     speed_data.append({
#                         "date": created_at,
#                         "score": speed_score,
#                         "raw_value": wpm,
#                         "interview_id": interview_id,
#                     })
        
#         if filler_data:
#             skill_trends["filler_words"] = {
#                 "data": filler_data,
#                 "average": statistics.mean([d["score"] for d in filler_data]),
#                 "trend": "improving" if filler_data[-1]["score"] > filler_data[0]["score"] else "declining" if filler_data[-1]["score"] < filler_data[0]["score"] else "stable",
#             }
        
#         if speed_data:
#             skill_trends["speaking_speed"] = {
#                 "data": speed_data,
#                 "average": statistics.mean([d["score"] for d in speed_data]),
#                 "trend": "improving" if speed_data[-1]["score"] > speed_data[0]["score"] else "declining" if speed_data[-1]["score"] < speed_data[0]["score"] else "stable",
#             }
        
#         # If specific skill requested, return only that
#         if skill and skill in skill_trends:
#             return {
#                 "success": True,
#                 "skill": skill,
#                 "data": skill_trends[skill]
#             }
        
#         return {
#             "success": True,
#             "data": skill_trends
#         }
        
#     except Exception as e:
#         print(f"❌ Error fetching skill trends: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# @router.get("/progress-history", response_model=Dict[str, Any])
# async def get_progress_history(
#     days: int = 30,
#     user_id: str = Depends(get_current_user)
# ):
#     """Create a new goal for the user"""
#     try:
#         db = get_database()
#         goals_collection = db.get_collection("user_goals")
        
#         # Parse deadline if provided
#         deadline = None
#         if request.deadline:
#             try:
#                 deadline = datetime.fromisoformat(request.deadline.replace('Z', '+00:00'))
#             except:
#                 deadline = None
        
#         # Create goal document
#         goal_doc = {
#             "user_id": user_id,
#             "goal_type": request.goal_type,
#             "target_value": request.target_value,
#             "metric_name": request.metric_name,
#             "deadline": deadline,
#             "status": "in_progress",
#             "progress_percentage": 0.0,
#             "current_value": None,
#             "start_value": None,
#             "created_at": datetime.utcnow(),
#             "updated_at": datetime.utcnow(),
#             "completed_at": None,
#         }
        
#         result = await goals_collection.insert_one(goal_doc)
#         goal_doc["_id"] = str(result.inserted_id)
        
#         return {
#             "success": True,
#             "message": "Goal created successfully",
#             "data": goal_doc
#         }
        
#     except Exception as e:
#         print(f"❌ Error creating goal: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# @router.get("/goals", response_model=Dict[str, Any])
# async def get_user_goals(user_id: str = Depends(get_current_user)):
#     """Get all goals for the user"""
#     try:
#         db = get_database()
#         goals_collection = db.get_collection("user_goals")
        
#         goals_cursor = goals_collection.find(
#             {"user_id": user_id}
#         ).sort("created_at", -1)
        
#         goals = await goals_cursor.to_list(length=None)
        
#         # Convert ObjectId to string
#         for goal in goals:
#             goal["_id"] = str(goal["_id"])
        
#         return {
#             "success": True,
#             "data": goals,
#             "count": len(goals)
#         }
        
#     except Exception as e:
#         print(f"❌ Error fetching goals: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# @router.put("/goals/{goal_id}", response_model=Dict[str, Any])
# async def update_goal(
#     goal_id: str,
#     request: UpdateGoalRequest,
#     user_id: str = Depends(get_current_user)
# ):
#     """Update a goal"""
#     try:
#         db = get_database()
#         goals_collection = db.get_collection("user_goals")
        
#         # Validate ObjectId
#         if not ObjectId.is_valid(goal_id):
#             raise HTTPException(status_code=400, detail="Invalid goal ID")
        
#         # Build update document
#         update_doc = {"updated_at": datetime.utcnow()}
        
#         if request.status is not None:
#             update_doc["status"] = request.status
#             if request.status == "completed":
#                 update_doc["completed_at"] = datetime.utcnow()
#                 update_doc["progress_percentage"] = 100.0
        
#         if request.progress_percentage is not None:
#             update_doc["progress_percentage"] = request.progress_percentage
        
#         if request.current_value is not None:
#             update_doc["current_value"] = request.current_value
        
#         result = await goals_collection.update_one(
#             {"_id": ObjectId(goal_id), "user_id": user_id},
#             {"$set": update_doc}
#         )
        
#         if result.matched_count == 0:
#             raise HTTPException(status_code=404, detail="Goal not found")
        
#         # Fetch updated goal
#         updated_goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})
#         if updated_goal:
#             updated_goal["_id"] = str(updated_goal["_id"])
        
#         return {
#             "success": True,
#             "message": "Goal updated successfully",
#             "data": updated_goal
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error updating goal: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# @router.post("/goals/recalculate-all", response_model=Dict[str, Any])
# async def recalculate_all_goals(user_id: str = Depends(get_current_user)):
#     """
#     Manually recalculate all goals based on past interviews.
#     Useful for updating goals after they were created.
#     """
#     try:
#         db = get_database()
#         goals_collection = db.user_goals
#         interview_reports_collection = get_interview_reports_collection()
#         verbal_reports_collection = get_verbal_reports_collection()
#         nonverbal_reports_collection = get_nonverbal_reports_collection()
        
#         print(f"\n{'='*80}")
#         print(f"🔄 RECALCULATING ALL GOALS FOR USER: {user_id}")
#         print(f"{'='*80}\n")
        
#         # Get all active goals
#         active_goals = await goals_collection.find({
#             "user_id": user_id,
#             "status": {"$in": ["in_progress", "not_started"]}
#         }).to_list(None)
        
#         print(f"📊 Found {len(active_goals)} active goal(s)")
#         for i, goal in enumerate(active_goals, 1):
#             print(f"   Goal {i}: {goal.get('metric_name')} - Type: {goal.get('goal_type')}, Target: {goal.get('target_value')}, Current Progress: {goal.get('progress_percentage', 0)}%")
        
#         if not active_goals:
#             return {
#                 "success": True,
#                 "message": "No active goals to update",
#                 "data": {"goals_updated": 0}
#             }
        
#         # Get all interviews for this user
#         interviews = await interview_reports_collection.find({
#             "user_id": user_id
#         }).sort("created_at", -1).to_list(None)
        
#         print(f"\n📚 Found {len(interviews)} total interview(s) for user")
        
#         if not interviews:
#             return {
#                 "success": True,
#                 "message": "No interviews found to calculate progress from",
#                 "data": {"goals_updated": 0, "interviews_found": 0}
#             }
        
#         # Get interview IDs
#         interview_ids = [str(i["_id"]) for i in interviews]
#         print(f"📝 Interview IDs: {[id[:8] + '...' for id in interview_ids[:5]]}")
        
#         # Fetch all verbal and non-verbal reports
#         verbal_reports = await verbal_reports_collection.find({
#             "interview_id": {"$in": interview_ids}
#         }).to_list(None)
        
#         nonverbal_reports = await nonverbal_reports_collection.find({
#             "interview_id": {"$in": interview_ids}
#         }).to_list(None)
        
#         print(f"📋 Found {len(verbal_reports)} verbal report(s)")
#         print(f"📊 Found {len(nonverbal_reports)} non-verbal report(s)")
        
#         # Create lookups
#         verbal_lookup = {r["interview_id"]: r for r in verbal_reports}
#         nonverbal_lookup = {r["interview_id"]: r for r in nonverbal_reports}
        
#         goals_updated = 0
        
#         # Process each goal
#         for goal in active_goals:
#             print(f"\n{'='*60}")
#             print(f"🎯 PROCESSING GOAL: {goal.get('metric_name', 'Unknown')}")
#             print(f"   Type: {goal.get('goal_type')}")
#             print(f"   Target: {goal.get('target_value')}")
#             print(f"   Current: {goal.get('current_value')}")
#             print(f"   Start: {goal.get('start_value')}")
#             print(f"{'='*60}")
            
#             # Find the most recent interview AFTER the goal was created
#             goal_created = goal.get("created_at", datetime.utcnow())
#             print(f"📅 Goal created at: {goal_created}")
            
#             relevant_interviews = [
#                 i for i in interviews 
#                 if i.get("created_at", datetime.utcnow()) >= goal_created
#             ]
            
#             if not relevant_interviews:
#                 print(f"   ⚠️ No interviews found after goal creation date")
#                 print(f"   📅 Goal created: {goal_created}")
#                 print(f"   📅 Oldest interview: {interviews[-1].get('created_at') if interviews else 'None'}")
#                 continue
            
#             print(f"   ✅ Found {len(relevant_interviews)} interview(s) after goal creation")
            
#             # DEBUG: Show scores from ALL interviews to see if there's actual progress
#             print(f"\n   📊 Checking scores across all {len(relevant_interviews)} interview(s):")
#             for idx, interview in enumerate(reversed(relevant_interviews), 1):  # Show oldest to newest
#                 int_id = str(interview["_id"])
#                 int_date = interview.get("created_at")
#                 v_report = verbal_lookup.get(int_id)
                
#                 if v_report and "metrics" in v_report:
#                     metrics = v_report["metrics"]
                    
#                     # Extract technical score
#                     domain = metrics.get("domain_knowledge", {})
#                     concepts = metrics.get("concepts_understanding", {})
#                     domain_score = domain.get("score", 0) if isinstance(domain, dict) else 0
#                     concepts_score = concepts.get("score", 0) if isinstance(concepts, dict) else 0
#                     tech_score = (domain_score + concepts_score) / 2 if (domain_score or concepts_score) else 0
                    
#                     # Extract communication score
#                     response = metrics.get("response_structure", {})
#                     vocab = metrics.get("vocabulary_richness", {})
#                     response_score = response.get("score", 0) if isinstance(response, dict) else 0
#                     vocab_score = vocab.get("score", 0) if isinstance(vocab, dict) else 0
#                     comm_score = (response_score + vocab_score) / 2 if (response_score or vocab_score) else 0
                    
#                     print(f"      {idx}. {int_id[:8]}... ({int_date}) - Tech: {tech_score:.1f}, Comm: {comm_score:.1f}")
#                 else:
#                     print(f"      {idx}. {int_id[:8]}... ({int_date}) - No metrics found")
#             print()
            
#             # Strategy: Use FIRST interview for start_value, LATEST for current_value
#             # This way we can track progress over multiple interviews
            
#             # Get the FIRST interview (oldest after goal creation) for baseline
#             first_interview = relevant_interviews[-1]  # List is sorted newest first, so last = oldest
#             first_interview_id = str(first_interview["_id"])
            
#             # Get the LATEST interview for current progress
#             latest_interview = relevant_interviews[0]  # First in list = newest
#             latest_interview_id = str(latest_interview["_id"])
            
#             print(f"   📍 First interview (baseline): {first_interview_id[:8]}... on {first_interview.get('created_at')}")
#             print(f"   � Latest interview (current): {latest_interview_id[:8]}... on {latest_interview.get('created_at')}")
            
#             # Get reports for BOTH interviews
#             first_verbal = verbal_lookup.get(first_interview_id)
#             first_nonverbal = nonverbal_lookup.get(first_interview_id)
            
#             latest_verbal = verbal_lookup.get(latest_interview_id)
#             latest_nonverbal = nonverbal_lookup.get(latest_interview_id)
            
#             if not first_verbal or not first_nonverbal:
#                 print(f"   ❌ Missing reports for first interview {first_interview_id[:8]}")
#                 continue
            
#             if not latest_verbal or not latest_nonverbal:
#                 print(f"   ❌ Missing reports for latest interview {latest_interview_id[:8]}")
#                 continue
            
#             print(f"   ✅ Found reports for both first and latest interviews")
            
#             # BUILD COMPLETE SCORE HISTORY across ALL interviews
#             print(f"   � Building score history from all {len(relevant_interviews)} interview(s)...")
            
#             score_history = []
#             for interview in reversed(relevant_interviews):  # Oldest to newest
#                 int_id = str(interview["_id"])
#                 v_report = verbal_lookup.get(int_id)
#                 nv_report = nonverbal_lookup.get(int_id)
                
#                 if v_report and nv_report:
#                     score = extract_score_for_goal_type(goal.get("goal_type"), v_report, nv_report)
#                     score_history.append({
#                         "date": interview.get("created_at").isoformat() if interview.get("created_at") else None,
#                         "score": round(score, 1),
#                         "interview_id": int_id
#                     })
            
#             score_values = [s["score"] for s in score_history]
#             print(f"   ✅ Score history: {score_values}")
            
#             # Extract baseline and current values
#             baseline_value = score_history[0]["score"] if score_history else 0
#             current_value_from_latest = score_history[-1]["score"] if score_history else 0
            
#             print(f"   ✅ Baseline (first interview): {baseline_value:.1f}")
#             print(f"   ✅ Current (latest interview): {current_value_from_latest:.1f}")
            
#             # Calculate TREND analysis
#             trend = "stable"
#             change_amount = current_value_from_latest - baseline_value
#             change_percentage = 0
            
#             if baseline_value > 0:
#                 change_percentage = (change_amount / baseline_value) * 100
            
#             if len(score_history) >= 2:
#                 # Check last 2 interviews for recent trend
#                 recent_change = score_history[-1]["score"] - score_history[-2]["score"]
                
#                 if change_amount > baseline_value * 0.05:  # More than 5% improvement
#                     trend = "improving"
#                 elif change_amount < -baseline_value * 0.05:  # More than 5% decline
#                     trend = "declining"
#                 else:
#                     trend = "stable"
                
#                 # Check if recently improving/declining (last 2 interviews)
#                 if abs(recent_change) > baseline_value * 0.05:
#                     if recent_change > 0:
#                         trend = "improving"
#                     else:
#                         trend = "declining"
            
#             print(f"   📊 Trend: {trend} (change: {change_amount:+.1f} / {change_percentage:+.1f}%)")
            
#             # Calculate progress towards goal
#             target_value = goal["target_value"]
#             goal_type = goal.get("goal_type", "")
            
#             if goal_type == "filler_words":
#                 # For filler words, lower is better
#                 if baseline_value > target_value:
#                     progress = ((baseline_value - current_value_from_latest) / (baseline_value - target_value)) * 100
#                 else:
#                     progress = 0
#             else:
#                 # For other metrics, higher is better
#                 if target_value > baseline_value:
#                     progress = ((current_value_from_latest - baseline_value) / (target_value - baseline_value)) * 100
#                 else:
#                     progress = 100 if current_value_from_latest >= target_value else 0
            
#             # Clamp progress between 0 and 100
#             progress = max(0, min(100, progress))
            
#             # Check if goal is completed
#             status = "in_progress"
#             completed_at = None
            
#             if progress >= 100:
#                 status = "completed"
#                 completed_at = datetime.utcnow()
#                 print(f"   🎉 Goal COMPLETED!")
            
#             # Update the goal directly
#             update_result = await goals_collection.update_one(
#                 {"_id": goal["_id"]},
#                 {
#                     "$set": {
#                         "start_value": baseline_value,
#                         "current_value": current_value_from_latest,
#                         "progress_percentage": progress,
#                         "status": status,
#                         "trend": trend,
#                         "change_amount": change_amount,
#                         "change_percentage": change_percentage,
#                         "score_history": score_history,
#                         "updated_at": datetime.utcnow(),
#                         **({"completed_at": completed_at} if completed_at else {})
#                     }
#                 }
#             )
            
#             print(f"   ✅ Updated goal '{goal.get('metric_name')}': Progress = {progress:.1f}% (Start: {baseline_value:.1f}, Current: {current_value_from_latest:.1f}, Target: {target_value}, Trend: {trend})")
            
#             if update_result.modified_count > 0:
#                 print(f"   ✅ Database update successful")
#             else:
#                 print(f"   ⚠️ No changes made to database")
            
#             goals_updated += 1
        
#         print(f"\n{'='*80}")
#         print(f"✅ RECALCULATION COMPLETE: {goals_updated} goal(s) updated")
#         print(f"{'='*80}\n")
        
#         return {
#             "success": True,
#             "message": f"Recalculated {goals_updated} goal(s) based on {len(interviews)} interview(s)",
#             "data": {
#                 "goals_updated": goals_updated,
#                 "interviews_found": len(interviews),
#                 "active_goals": len(active_goals)
#             }
#         }
        
#     except Exception as e:
#         print(f"❌ Error recalculating goals: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))


# @router.delete("/goals/{goal_id}", response_model=Dict[str, Any])
# async def delete_goal(
#     goal_id: str,
#     user_id: str = Depends(get_current_user)
# ):
#     """Delete a goal"""
#     try:
#         db = get_database()
#         goals_collection = db.get_collection("user_goals")
        
#         # Validate ObjectId
#         if not ObjectId.is_valid(goal_id):
#             raise HTTPException(status_code=400, detail="Invalid goal ID")
        
#         result = await goals_collection.delete_one(
#             {"_id": ObjectId(goal_id), "user_id": user_id}
#         )
        
#         if result.deleted_count == 0:
#             raise HTTPException(status_code=404, detail="Goal not found")
        
#         return {
#             "success": True,
#             "message": "Goal deleted successfully"
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error deleting goal: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# @router.get("/progress-history", response_model=Dict[str, Any])
# async def get_progress_history(
#     days: int = 30,
#     user_id: str = Depends(get_current_user)
# ):
#     """Get progress history over time"""
#     try:
#         interview_reports_collection = get_interview_reports_collection()
#         overall_reports_collection = get_overall_reports_collection()
        
#         # Calculate date range
#         end_date = datetime.utcnow()
#         start_date = end_date - timedelta(days=days)
        
#         # Get interviews in date range
#         interviews_cursor = interview_reports_collection.find({
#             "user_id": user_id,
#             "created_at": {"$gte": start_date, "$lte": end_date}
#         }).sort("created_at", 1)
        
#         interviews = await interviews_cursor.to_list(length=None)
        
#         if not interviews:
#             return {
#                 "success": True,
#                 "message": f"No interviews found in the last {days} days",
#                 "data": []
#             }
        
#         # Get overall reports for these interviews
#         interview_ids = [str(interview["_id"]) for interview in interviews]
#         overall_reports = await overall_reports_collection.find({
#             "interview_id": {"$in": interview_ids}
#         }).to_list(length=None)
        
#         # Create lookup
#         overall_lookup = {report["interview_id"]: report for report in overall_reports}
        
#         # Build progress history
#         progress_history = []
#         for interview in interviews:
#             interview_id = str(interview["_id"])
#             overall = overall_lookup.get(interview_id, {})
            
#             if overall:
#                 progress_history.append({
#                     "date": interview.get("created_at", datetime.utcnow()).isoformat(),
#                     "interview_id": interview_id,
#                     "interview_type": interview.get("interview_type", "Unknown"),
#                     "role": interview.get("role", ""),
#                     "overall_score": overall.get("overall_score", 0),
#                     "verbal_score": overall.get("verbal_score", 0),
#                     "nonverbal_score": overall.get("nonverbal_score", 0),
#                     "interview_readiness": overall.get("interview_readiness", ""),
#                 })
        
#         return {
#             "success": True,
#             "data": progress_history,
#             "period": f"{days} days",
#             "count": len(progress_history)
#         }
        
#     except Exception as e:
#         print(f"❌ Error fetching progress history: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# # AUTOMATIC GOAL UPDATE FUNCTION
# async def update_user_goals_after_interview(
#     user_id: str, 
#     verbal_report: Dict[str, Any], 
#     nonverbal_report: Dict[str, Any]
# ):
#     """
#     Automatically update user goals based on new interview performance.
#     This function is called after each interview is saved.
#     """
#     try:
#         db = get_database()
#         goals_collection = db.user_goals
        
#         # Get all active goals for this user
#         active_goals = await goals_collection.find({
#             "user_id": user_id,
#             "status": "in_progress"
#         }).to_list(None)
        
#         if not active_goals:
#             print(f"📊 No active goals found for user {user_id[:8]}...")
#             return
        
#         print(f"📊 Found {len(active_goals)} active goal(s) to update for user {user_id[:8]}...")
        
#         for goal in active_goals:
#             current_value = None
            
#             # Extract current value based on goal type
#             goal_type = goal.get("goal_type", "")
#             metric_name = goal.get("metric_name", "")
            
#             print(f"🎯 Processing goal: {metric_name} (type: {goal_type})")
            
#             if goal_type == "score_improvement":
#                 # Use overall score from verbal report
#                 current_value = verbal_report.get("overall_score", 0)
#                 print(f"   📈 Score improvement: current_value = {current_value}")
            
#             elif goal_type == "communication":
#                 # Extract communication score from verbal report metrics
#                 if verbal_report and "metrics" in verbal_report:
#                     metrics = verbal_report["metrics"]
#                     # Communication: Average of response_structure and vocabulary_richness
#                     response_struct = metrics.get("response_structure", {})
#                     vocab_rich = metrics.get("vocabulary_richness", {})
                    
#                     response_score = response_struct.get("score", 0) if isinstance(response_struct, dict) else response_struct
#                     vocab_score = vocab_rich.get("score", 0) if isinstance(vocab_rich, dict) else vocab_rich
                    
#                     if response_score > 0 or vocab_score > 0:
#                         current_value = (response_score + vocab_score) / 2
#                         print(f"   💬 Communication: current_value = {current_value:.1f} (response={response_score}, vocab={vocab_score})")
#                     else:
#                         print(f"   ⚠️ No communication scores found in metrics")
#                 else:
#                     print(f"   ⚠️ No metrics found in verbal report")
            
#             elif goal_type == "technical":
#                 # Extract technical knowledge score from verbal report metrics
#                 if verbal_report and "metrics" in verbal_report:
#                     metrics = verbal_report["metrics"]
#                     # Technical: Average of domain_knowledge and concepts_understanding
#                     domain = metrics.get("domain_knowledge", {})
#                     concepts = metrics.get("concepts_understanding", {})
                    
#                     domain_score = domain.get("score", 0) if isinstance(domain, dict) else domain
#                     concepts_score = concepts.get("score", 0) if isinstance(concepts, dict) else concepts
                    
#                     if domain_score > 0 or concepts_score > 0:
#                         current_value = (domain_score + concepts_score) / 2
#                         print(f"   🧠 Technical Knowledge: current_value = {current_value:.1f} (domain={domain_score}, concepts={concepts_score})")
#                     else:
#                         print(f"   ⚠️ No technical scores found in metrics")
#                 else:
#                     print(f"   ⚠️ No metrics found in verbal report")
                
#             elif goal_type == "filler_words":
#                 # Extract filler word percentage from non-verbal report
#                 if nonverbal_report and "analytics" in nonverbal_report:
#                     filler_data = nonverbal_report["analytics"].get("fillerWordsBreakdown", {})
#                     filler_pct_str = filler_data.get("percentage", "0")
#                     try:
#                         current_value = float(filler_pct_str)
#                         print(f"   🗣️ Filler words: current_value = {current_value}%")
#                     except (ValueError, TypeError):
#                         print(f"   ⚠️ Could not parse filler percentage: {filler_pct_str}")
                    
#             elif goal_type == "speaking_speed":
#                 # Calculate words per minute from non-verbal report
#                 if nonverbal_report and "analytics" in nonverbal_report:
#                     stats = nonverbal_report["analytics"].get("speakingStats", {})
#                     total_time = stats.get("totalSpeakingTime", 0)
#                     total_words = stats.get("totalWordsSpoken", 0)
#                     if total_time > 0:
#                         wpm = (total_words / total_time) * 60
#                         current_value = wpm
#                         print(f"   ⚡ Speaking speed: current_value = {current_value:.1f} WPM")
#                     else:
#                         print(f"   ⚠️ Speaking time is 0, cannot calculate WPM")
            
#             elif goal_type == "confidence":
#                 # Extract confidence score from non-verbal report
#                 if nonverbal_report and "analytics" in nonverbal_report:
#                     confidence_data = nonverbal_report["analytics"].get("confidenceScores", {})
#                     current_value = confidence_data.get("overallConfidence", 0)
#                     print(f"   💪 Confidence: current_value = {current_value}")
            
#             if current_value is not None:
#                 # Get current goal state from database (to check existing start_value)
#                 start_value = goal.get("start_value")
                
#                 # Only set start_value if it's not already set
#                 if start_value is None or start_value == 0:
#                     start_value = current_value
#                     print(f"   🆕 Setting start_value = {start_value} (first time)")
#                 else:
#                     print(f"   ℹ️  Keeping existing start_value = {start_value}")
                
#                 print(f"   📊 Values: start={start_value}, current={current_value}, target={goal['target_value']}")
                
#                 # Get target value
#                 target_value = goal["target_value"]
                
#                 # Calculate progress percentage
#                 # For filler words, lower is better (reverse calculation)
#                 if goal_type == "filler_words":
#                     if start_value > target_value:
#                         progress = ((start_value - current_value) / (start_value - target_value)) * 100
#                     else:
#                         progress = 0
#                 else:
#                     # For other metrics, higher is better
#                     if target_value > start_value:
#                         progress = ((current_value - start_value) / (target_value - start_value)) * 100
#                     else:
#                         progress = 100 if current_value >= target_value else 0
                
#                 # Clamp progress between 0 and 100
#                 progress = max(0, min(100, progress))
                
#                 # Check if goal is completed
#                 status = goal["status"]
#                 completed_at = goal.get("completed_at")
                
#                 if progress >= 100 and status != "completed":
#                     status = "completed"
#                     completed_at = datetime.utcnow()
#                     print(f"   🎉 Goal COMPLETED!")
                
#                 # Update the goal in database
#                 update_data = {
#                     "current_value": current_value,
#                     "start_value": start_value,
#                     "progress_percentage": progress,
#                     "status": status,
#                     "updated_at": datetime.utcnow()
#                 }
                
#                 if completed_at:
#                     update_data["completed_at"] = completed_at
                
#                 update_result = await goals_collection.update_one(
#                     {"_id": goal["_id"]},
#                     {"$set": update_data}
#                 )
                
#                 print(f"   ✅ Updated goal '{metric_name}': Progress = {progress:.1f}% (Start: {start_value}, Current: {current_value}, Target: {target_value})")
                
#                 if update_result.modified_count > 0:
#                     print(f"   ✅ Database update successful")
#                 else:
#                     print(f"   ⚠️ No changes made to database")
#             else:
#                 print(f"   ⚠️ Could not extract value for goal type: {goal_type}")
                
#     except Exception as e:
#         print(f"❌ Error updating goals: {str(e)}")
#         import traceback
#         traceback.print_exc()

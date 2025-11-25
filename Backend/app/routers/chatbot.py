# SkillEdge-AI Chatbot API Router
"""
FastAPI router for chatbot endpoints
"""

import asyncio
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime
import logging
import json

def serialize_document(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively serialize MongoDB document to make it JSON serializable"""
    if doc is None:
        return None
    
    serialized = {}
    for key, value in doc.items():
        if key == "_id":
            continue  # Skip MongoDB ObjectId
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, dict):
            serialized[key] = serialize_document(value)
        elif isinstance(value, list):
            serialized[key] = [serialize_document(item) if isinstance(item, dict) else item for item in value]
        else:
            serialized[key] = value
    
    return serialized

# Import database functions
from app.database import (
    get_database, 
    get_profiles_collection, 
    get_verbal_reports_collection,
    get_nonverbal_reports_collection,
    get_overall_reports_collection
)

# Import authentication
from app.routers.auth import get_current_user

# Import chatbot service and models
from app.chatbot.service import get_chatbot_service, ChatbotService
from app.chatbot.agentic_service import get_agentic_chatbot_service
from app.chatbot.models import (
    ChatRequest, 
    ChatResponse, 
    ConversationHistory, 
    ChatMessage,
    ChatbotStatus
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# In-memory conversation storage (in production, use Redis or database)
conversations: Dict[str, ConversationHistory] = {}

async def get_user_reports(user_id: str) -> Dict[str, Any]:
    """Fetch user's latest interview reports"""
    try:
        logger.info(f"Fetching reports for user: {user_id}")
        db = get_database()
        
        # Get latest reports for the user
        verbal_collection = get_verbal_reports_collection()
        nonverbal_collection = get_nonverbal_reports_collection()
        overall_collection = get_overall_reports_collection()
        
        logger.info("Collections retrieved, searching for reports...")
        
        # Find latest verbal report
        verbal_report = await verbal_collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)]
        )
        
        # Find latest non-verbal report
        nonverbal_report = await nonverbal_collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)]
        )
        
        # Find latest overall report
        overall_report = await overall_collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)]
        )
        
        logger.info(f"Found reports - Verbal: {bool(verbal_report)}, Non-verbal: {bool(nonverbal_report)}, Overall: {bool(overall_report)}")
        
        reports = {}
        if verbal_report:
            reports["verbal_report"] = serialize_document(verbal_report)
            
        if nonverbal_report:
            reports["nonverbal_report"] = serialize_document(nonverbal_report)
            
        if overall_report:
            reports["overall_report"] = serialize_document(overall_report)
        
        logger.info(f"Returning {len(reports)} reports for user {user_id}")
        return reports
        
    except Exception as e:
        logger.error(f"Error fetching user reports: {e}")
        logger.exception("Full traceback:")
        return {}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(
    request: ChatRequest,
    user_id: str = Depends(get_current_user)
):
    """Main chat endpoint with automatic agent routing (agentic behavior)"""
    try:
        # Get agentic chatbot service (uses LangGraph for automatic routing)
        agentic_chatbot = get_agentic_chatbot_service()
        
        # Generate or use existing conversation ID
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        # Get or create conversation history for tracking
        if conversation_id not in conversations:
            conversations[conversation_id] = ConversationHistory(
                conversation_id=conversation_id,
                user_id=user_id,
                messages=[]
            )
        
        conversation = conversations[conversation_id]
        
        # Add user message to conversation
        user_message = ChatMessage(role="user", content=request.message)
        conversation.messages.append(user_message)
        
        logger.info(f"🔄 Processing agentic chat for user {user_id}: {request.message[:50]}...")
        
        # Use agentic chatbot service - it will automatically route to the right agent
        # No need for include_reports or include_resume flags - supervisor decides!
        result = await agentic_chatbot.chat(
            user_query=request.message,
            user_id=user_id,
            conversation_id=conversation_id
        )
        
        bot_response = result["response"]
        sources = result["sources"]
        route = result["route"]
        
        logger.info(f"✅ Agentic chatbot routed to '{route}' agent")
        
        # Add bot response to conversation
        bot_message = ChatMessage(role="assistant", content=bot_response)
        conversation.messages.append(bot_message)
        
        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        
        return ChatResponse(
            message=bot_response,
            conversation_id=conversation_id,
            sources=sources
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request")

@router.get("/conversations/{conversation_id}", response_model=ConversationHistory)
async def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get conversation history by ID"""
    try:
        if conversation_id not in conversations:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation = conversations[conversation_id]
        
        # Verify user owns this conversation
        if conversation.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return conversation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching conversation")

@router.get("/conversations", response_model=List[ConversationHistory])
async def get_user_conversations(
    user_id: str = Depends(get_current_user)
):
    """Get all conversations for the current user"""
    try:
        user_conversations = [
            conv for conv in conversations.values() 
            if conv.user_id == user_id
        ]
        
        # Sort by last updated
        user_conversations.sort(key=lambda x: x.updated_at, reverse=True)
        
        return user_conversations
        
    except Exception as e:
        logger.error(f"Error getting user conversations: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching conversations")

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user)
):
    """Delete a conversation"""
    try:
        if conversation_id not in conversations:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation = conversations[conversation_id]
        
        # Verify user owns this conversation
        if conversation.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete conversation
        del conversations[conversation_id]
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while deleting conversation")

@router.get("/status", response_model=ChatbotStatus)
async def get_chatbot_status():
    """Get chatbot service status and information"""
    try:
        chatbot = get_chatbot_service()
        
        return ChatbotStatus(
            status="active",
            knowledge_base_size=len(chatbot.knowledge_base),
            embedding_model="sentence-transformers/all-MiniLM-L6-v2",
            llm_model="gemini-2.0-flash-exp"
        )
        
    except Exception as e:
        logger.error(f"Error getting chatbot status: {e}")
        raise HTTPException(status_code=500, detail="Chatbot service unavailable")

@router.post("/knowledge-base")
async def add_knowledge_entry(
    content: str,
    category: str,
    metadata: Optional[Dict[str, Any]] = None,
    user_id: str = Depends(get_current_user)
):
    """Add new entry to knowledge base (admin function)"""
    try:
        # In production, add admin role check here
        chatbot = get_chatbot_service()
        
        chatbot.add_to_knowledge_base(
            content=content,
            category=category,
            metadata=metadata or {}
        )
        
        return {"message": "Knowledge entry added successfully"}
        
    except Exception as e:
        logger.error(f"Error adding knowledge entry: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while adding knowledge entry")

@router.get("/resume/status")
async def get_resume_status(user_id: str = Depends(get_current_user)):
    """Check if user's resume is indexed for chatbot"""
    try:
        from app.chatbot.resume_rag import get_resume_rag_service
        resume_rag = get_resume_rag_service()
        
        has_index = resume_rag.has_resume_index(user_id)
        
        # Get profile to check if resume file exists
        profiles_collection = get_profiles_collection()
        profile = await profiles_collection.find_one({"user_id": user_id})
        
        has_resume_file = bool(profile and profile.get("resume_file_id"))
        
        return {
            "has_resume_file": has_resume_file,
            "has_resume_index": has_index,
            "resume_filename": profile.get("resume_filename") if profile else None,
            "indexed": has_index,
            "can_use_resume_chat": has_index
        }
    except Exception as e:
        logger.error(f"Error checking resume status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resume/reindex")
async def reindex_resume(user_id: str = Depends(get_current_user)):
    """Manually reindex user's resume for chatbot"""
    try:
        # Get profile to find resume file ID
        profiles_collection = get_profiles_collection()
        profile = await profiles_collection.find_one({"user_id": user_id})
        
        if not profile or not profile.get("resume_file_id"):
            raise HTTPException(status_code=404, detail="No resume found for this user")
        
        # Index the resume
        from app.chatbot.resume_rag import get_resume_rag_service
        resume_rag = get_resume_rag_service()
        
        result = await resume_rag.index_user_resume(user_id, profile["resume_file_id"])
        
        if result.get("success"):
            return {
                "success": True,
                "message": "Resume indexed successfully",
                "chunks": result.get("chunks", 0)
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Indexing failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reindexing resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_knowledge_base(
    query: str,
    top_k: int = 5,
    user_id: str = Depends(get_current_user)
):
    """Search knowledge base for relevant information"""
    try:
        chatbot = get_chatbot_service()
        
        results = chatbot.search_knowledge_base(query, top_k)
        
        return {
            "query": query,
            "results": results,
            "total_found": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error searching knowledge base: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while searching knowledge base")
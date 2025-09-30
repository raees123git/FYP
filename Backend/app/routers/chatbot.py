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

# Import chatbot service and models
from app.chatbot.service import get_chatbot_service, ChatbotService
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

def get_user_id_from_header(authorization: str = Header(None)) -> str:
    """Extract user ID from authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract user ID from authorization header
    # Assuming format: "Bearer clerk_user_id"
    try:
        if authorization.startswith("Bearer "):
            user_id = authorization.split("Bearer ")[1]
            return user_id
        else:
            raise HTTPException(status_code=401, detail="Invalid authorization format")
    except Exception as e:
        logger.error(f"Error extracting user ID: {e}")
        raise HTTPException(status_code=401, detail="Invalid authorization header")

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
    user_id: str = Depends(get_user_id_from_header)
):
    """Main chat endpoint for interacting with the chatbot"""
    try:
        # Get chatbot service
        chatbot = get_chatbot_service()
        
        # Generate or use existing conversation ID
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        # Get or create conversation history
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
        
        # Get user reports if requested
        user_reports = {}
        if request.include_reports:
            user_reports = await get_user_reports(user_id)
            logger.info(f"Fetched reports for user {user_id}: {len(user_reports)} reports found")
        
        # Prepare conversation history for context
        conversation_history = [
            {"role": msg.role, "content": msg.content} 
            for msg in conversation.messages[-10:]  # Last 10 messages
        ]
        
        # Generate chatbot response
        if request.include_reports:
            if user_reports:
                # Use report analysis function for personalized insights
                logger.info(f"Using report analysis mode for user {user_id} with {len(user_reports)} reports")
                bot_response = await chatbot.analyze_user_reports(
                    query=request.message,
                    user_reports=user_reports
                )
            else:
                # User requested report analysis but has no reports
                logger.info(f"User {user_id} requested report analysis but has no reports")
                bot_response = "I don't see any interview reports for your account yet. Please complete an interview first to get personalized insights about your performance. In the meantime, I can help you with general questions about SkillEdge-AI!"
        else:
            # Use general RAG function
            logger.info(f"Using general Q&A mode for user {user_id}")
            bot_response = await chatbot.generate_response(
                query=request.message,
                conversation_history=conversation_history[:-1]  # Exclude current message
            )
        
        # Add bot response to conversation
        bot_message = ChatMessage(role="assistant", content=bot_response)
        conversation.messages.append(bot_message)
        
        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        
        return ChatResponse(
            message=bot_response,
            conversation_id=conversation_id,
            sources=["SkillEdge-AI Knowledge Base"] if not request.include_reports else ["SkillEdge-AI Knowledge Base", "User Reports"]
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request")

@router.get("/conversations/{conversation_id}", response_model=ConversationHistory)
async def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_user_id_from_header)
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
    user_id: str = Depends(get_user_id_from_header)
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
    user_id: str = Depends(get_user_id_from_header)
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
    user_id: str = Depends(get_user_id_from_header)
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

@router.get("/search")
async def search_knowledge_base(
    query: str,
    top_k: int = 5,
    user_id: str = Depends(get_user_id_from_header)
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
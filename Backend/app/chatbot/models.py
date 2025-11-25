# SkillEdge-AI Chatbot Models
"""
Pydantic models for chatbot API endpoints
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class ChatMessage(BaseModel):
    """Individual chat message model"""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    """Chat request model - Agentic routing automatically determines which data to use"""
    message: str = Field(..., description="User's message to the chatbot", min_length=1)
    conversation_id: Optional[str] = Field(None, description="Conversation ID for maintaining context")

class ChatResponse(BaseModel):
    """Chat response model"""
    message: str = Field(..., description="Chatbot's response")
    conversation_id: str = Field(..., description="Conversation ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sources: Optional[List[str]] = Field(default=None, description="Sources used for the response")

class ConversationHistory(BaseModel):
    """Conversation history model"""
    conversation_id: str = Field(..., description="Unique conversation identifier")
    user_id: str = Field(..., description="Clerk user ID")
    messages: List[ChatMessage] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class KnowledgeBaseEntry(BaseModel):
    """Knowledge base entry model"""
    content: str = Field(..., description="Knowledge content")
    category: str = Field(..., description="Content category")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatbotStatus(BaseModel):
    """Chatbot service status model"""
    status: str = Field(..., description="Service status")
    knowledge_base_size: int = Field(..., description="Number of entries in knowledge base")
    embedding_model: str = Field(..., description="Embedding model name")
    llm_model: str = Field(..., description="LLM model name")
    last_updated: datetime = Field(default_factory=datetime.utcnow)
# SkillEdge-AI Agentic Chatbot Service
"""
LangGraph-based intelligent chatbot with automatic agent routing.
Routes user queries to specialized agents: Resume, Reports, or General.
"""

import os
import sys
import json
import logging
from typing import TypedDict, Literal, Annotated, Dict, List, Any
from datetime import datetime

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from app.chatbot.resume_rag import get_resume_rag_service
from app.database import (
    get_verbal_reports_collection,
    get_nonverbal_reports_collection,
    get_overall_reports_collection
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatbotState(TypedDict):
    """State schema for the chatbot graph"""
    messages: Annotated[list, add_messages]  # Chat history
    user_query: str  # Current user query
    route: str  # Which agent to route to
    response: str  # Final response to user
    user_id: str  # User identifier (for context)


class AgenticChatbotService:
    """Intelligent chatbot service with LangGraph-based agent routing"""
    
    def __init__(self):
        self.llm = None
        self.resume_rag = None
        self.workflow_app = None
        self.conversation_histories: Dict[str, List] = {}
        
        # Initialize models and workflow
        self._initialize_llm()
        self._initialize_resume_rag()
        self._build_workflow()
    
    def _initialize_llm(self):
        """Initialize Gemini LLM"""
        try:
            gemini_api_key2 = os.getenv("GEMINI_API_KEY2") 
            print(gemini_api_key2)
            
            if not gemini_api_key2:
                raise ValueError("GEMINI_API_KEY or GEMINI_API_KEY2 not found in environment variables")
            
            # Set environment variable for Google
            os.environ["GOOGLE_API_KEY"] = gemini_api_key2
            
            # Initialize the LLM
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                temperature=0.3,
                convert_system_message_to_human=True
            )
            
            logger.info("✅ Gemini LLM initialized successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error initializing LLM: {e}")
            raise
    
    def _initialize_resume_rag(self):
        """Initialize Resume RAG service"""
        try:
            self.resume_rag = get_resume_rag_service()
            logger.info("✅ Resume RAG service initialized!")
        except Exception as e:
            logger.error(f"❌ Error initializing Resume RAG: {e}")
            raise
    
    def _build_workflow(self):
        """Build LangGraph workflow with supervisor and agent nodes"""
        try:
            # Create the graph
            workflow = StateGraph(ChatbotState)
            
            # Add nodes
            workflow.add_node("supervisor", self._supervisor_agent)
            workflow.add_node("resume_agent", self._resume_agent)
            workflow.add_node("reports_agent", self._reports_agent)
            workflow.add_node("general_agent", self._general_agent)
            
            # Set entry point
            workflow.set_entry_point("supervisor")
            
            # Add conditional edges from supervisor to sub-agents
            workflow.add_conditional_edges(
                "supervisor",
                self._route_query,
                {
                    "resume_agent": "resume_agent",
                    "reports_agent": "reports_agent",
                    "general_agent": "general_agent"
                }
            )
            
            # All sub-agents lead to END
            workflow.add_edge("resume_agent", END)
            workflow.add_edge("reports_agent", END)
            workflow.add_edge("general_agent", END)
            
            # Compile the graph
            self.workflow_app = workflow.compile()
            
            logger.info("✅ LangGraph workflow compiled successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error building workflow: {e}")
            raise
    
    def _supervisor_agent(self, state: ChatbotState) -> ChatbotState:
        """
        Supervisor agent that analyzes the user query and determines which sub-agent should handle it.
        
        Routes:
        - resume_agent: Questions about resume, skills, experience, education, projects
        - reports_agent: Questions about interview performance, analytics, scores, feedback, WPM, pace, etc.
        - general_agent: General conversation, greetings, other questions
        """
        
        user_query = state["user_query"]
        
        # System prompt for the supervisor
        supervisor_prompt = """You are an intelligent routing agent for a career interview platform chatbot.
Your job is to analyze the user's query and decide which specialized agent should handle it.

Available agents:
1. "resume" - Handles questions about:
   - User's resume content (skills, experience, education, projects)
   - Resume improvements and suggestions
   - Career profile information
   - Skills assessment
   - Professional background
   - regarding personal information like name, email, phone, address, etc.

2. "reports" - Handles questions about:
   - Interview performance and scores
   - Past interview reports and analytics
   - Interview feedback and recommendations
   - Performance trends and statistics
   - Speaking metrics (WPM, pace, speed, fluency, clarity)
   - Verbal analysis (answer quality, domain knowledge, correctness)
   - Non-verbal analysis (body language, confidence, voice)
   - Any specific performance data or metrics

3. "general" - Handles:
   - General conversation and greetings
   - Platform usage questions
   - Unrelated or unclear queries
   - Small talk

Important: Questions about performance metrics like WPM, pace, speed, scores, feedback should go to "reports" agent.

Analyze the query and respond with ONLY ONE WORD from: resume, reports, or general
Do not provide any explanation, just the routing decision."""
        
        # Get routing decision from LLM
        messages = [
            SystemMessage(content=supervisor_prompt),
            HumanMessage(content=f"User Query: {user_query}")
        ]
        response = self.llm.invoke(messages)
        
        # Extract and normalize the route
        route = response.content.strip().lower()
        
        # Validate route
        if route not in ["resume", "reports", "general"]:
            route = "general"  # Default fallback
        
        logger.info(f"📍 Supervisor Decision: Routing to '{route}' agent")
        
        state["route"] = route
        state["messages"].append(AIMessage(content=f"[Routing to {route} agent]"))
        
        return state
    
    async def _resume_agent(self, state: ChatbotState) -> ChatbotState:
        """
        Resume agent handles queries about user's resume, skills, experience, and career profile.
        Uses FAISS vector DB for semantic search on actual resume data.
        """
        
        user_query = state["user_query"]
        user_id = state.get("user_id", "unknown")
        
        try:
            logger.info(f"📌 Using user ID: {user_id} for resume search")
            
            # Check if user has a resume indexed
            has_resume = self.resume_rag.has_resume_index(user_id)
            
            if not has_resume:
                response_text = "I'd love to help you with your resume questions, but I don't see a resume indexed for your account yet. Please upload your resume first, and I'll be able to answer questions about your skills, experience, and projects!"
                logger.info(f"📄 Resume Agent Response: {response_text}")
                state["response"] = response_text
                state["messages"].append(AIMessage(content=response_text))
                return state
            
            # Use top_k=3 to match production behavior
            resume_results = await self.resume_rag.search_user_resume(user_id, user_query, top_k=3)
            
            if not resume_results:
                response_text = "I couldn't find relevant information in your resume for that query. Could you rephrase your question?"
                logger.info(f"📄 Resume Agent Response: {response_text}")
                state["response"] = response_text
                state["messages"].append(AIMessage(content=response_text))
                return state
            
            # Build context from search results
            context_parts = []
            for i, result in enumerate(resume_results, 1):
                context_parts.append(f"[Context {i}] {result['content']}")
            
            context = "\n\n".join(context_parts)
            
            logger.info(f"✅ Found {len(resume_results)} relevant resume chunks")
            
            # System prompt matching production behavior
            resume_prompt = f"""You are SkillEdge-AI Assistant helping users with questions about their resume.

Information from the user's resume:
{context}

User Question: {user_query}

Guidelines:
- Answer based ONLY on the information provided above from their resume
- Be specific and reference actual content from the resume context
- Keep responses concise and to the point
- If the information isn't in the provided context, say you couldn't find it in their resume

Provide your answer:"""
            
            messages = [
                SystemMessage(content=resume_prompt),
                HumanMessage(content=user_query)
            ]
            response = self.llm.invoke(messages)
            
            answer = response.content
            logger.info(f"📄 Resume Agent Response: {answer[:100]}...")
            
            state["response"] = answer
            state["messages"].append(AIMessage(content=answer))
            
        except Exception as e:
            error_msg = f"I encountered an error while searching your resume: {str(e)}"
            logger.error(f"❌ Resume Agent Error: {error_msg}")
            state["response"] = error_msg
            state["messages"].append(AIMessage(content=error_msg))
        
        return state
    
    async def _reports_agent(self, state: ChatbotState) -> ChatbotState:
        """
        Reports agent handles queries about interview performance, analytics, and feedback.
        Uses MongoDB to fetch detailed verbal, nonverbal, and overall reports.
        """
        
        user_query = state["user_query"]
        user_id = state.get("user_id", "unknown")
        
        try:
            # Get all report collections
            verbal_collection = get_verbal_reports_collection()
            nonverbal_collection = get_nonverbal_reports_collection()
            overall_collection = get_overall_reports_collection()
            
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
            
            # Check if user has any reports
            if not verbal_report and not nonverbal_report and not overall_report:
                response_text = "I don't see any interview reports for your account yet. Complete an interview to get personalized feedback and analytics!"
                logger.info(f"📊 Reports Agent Response: {response_text}")
                state["response"] = response_text
                state["messages"].append(AIMessage(content=response_text))
                return state
            
            logger.info(f"📊 Reports Agent - Found reports: Verbal={bool(verbal_report)}, NonVerbal={bool(nonverbal_report)}, Overall={bool(overall_report)}")
            
            # Helper function to serialize MongoDB documents
            def serialize_doc(doc):
                """Convert MongoDB document to JSON-serializable format"""
                if doc is None:
                    return None
                serialized = {}
                for key, value in doc.items():
                    if key == "_id":
                        continue  # Skip ObjectId
                    elif hasattr(value, 'isoformat'):  # datetime
                        serialized[key] = value.isoformat()
                    elif isinstance(value, dict):
                        serialized[key] = serialize_doc(value)
                    elif isinstance(value, list):
                        serialized[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
                    else:
                        serialized[key] = value
                return serialized
            
            # Build comprehensive context with FULL report data
            context_text = "User's Interview Reports:\n\n"
            
            if verbal_report:
                context_text += "=== VERBAL REPORT ===\n"
                context_text += json.dumps(serialize_doc(verbal_report), indent=2) + "\n\n"
            
            if nonverbal_report:
                context_text += "=== NON-VERBAL REPORT ===\n"
                context_text += json.dumps(serialize_doc(nonverbal_report), indent=2) + "\n\n"
            
            if overall_report:
                context_text += "=== OVERALL REPORT ===\n"
                context_text += json.dumps(serialize_doc(overall_report), indent=2) + "\n\n"
            
            # System prompt matching the implemented chatbot's behavior
            reports_prompt = f"""You are SkillEdge-AI Assistant, an intelligent chatbot for the SkillEdge-AI interview preparation platform.
You are analyzing user's interview performance reports.

Guidelines:
- Be helpful, professional, and encouraging
- Provide SPECIFIC answers using the EXACT data from the reports (scores, metrics, WPM, etc.)
- When user asks about specific metrics (like WPM, scores, pace), extract and report the EXACT values from the report data
- Be concise and to the point
- If the data doesn't contain what they're asking for, politely say so
- Focus on helping users improve their interview performance

User Query: {user_query}

{context_text}

Please provide a helpful and relevant response based on the report data above.

Important: If user asks about specific metrics (WPM, pace, scores, etc.), extract the EXACT values from the reports and provide them in your answer.
"""
            
            messages = [
                SystemMessage(content=reports_prompt),
                HumanMessage(content=user_query)
            ]
            response = self.llm.invoke(messages)
            
            answer = response.content
            logger.info(f"📊 Reports Agent Response: {answer[:100]}...")
            
            state["response"] = answer
            state["messages"].append(AIMessage(content=answer))
            
        except Exception as e:
            error_msg = f"I encountered an error while fetching your interview reports: {str(e)}"
            logger.error(f"❌ Reports Agent Error: {error_msg}")
            import traceback
            traceback.print_exc()
            state["response"] = error_msg
            state["messages"].append(AIMessage(content=error_msg))
        
        return state
    
    def _general_agent(self, state: ChatbotState) -> ChatbotState:
        """
        General agent handles greetings, platform questions, and general conversation.
        Uses SkillEdge-AI knowledge base context.
        """
        
        user_query = state["user_query"]
        
        # SkillEdge-AI Knowledge Base
        knowledge_base_context = """
SkillEdge-AI Platform Information:

- SkillEdge-AI is an advanced AI-powered interview simulation platform designed to help job seekers prepare for interviews.
- It provides comprehensive feedback on both verbal and non-verbal communication skills.
- Offers three main types of interviews: Technical (for programming/technical skills), Behavioral (for soft skills and personality fit), and Resume-based (focusing on professional background).
- Provides three detailed reports after each interview:
  * Verbal Report: Analyzes answer correctness, depth, domain knowledge
  * Non-Verbal Report: Examines speech patterns (WPM, pace, fluency), content quality, confidence level, communication clarity
  * Overall Report: Combines both analyses with actionable insights and improvement recommendations
- Uses advanced AI technologies including speech recognition, natural language processing, and machine learning.
- Helps improve interview performance by providing objective feedback on speaking pace, clarity, confidence, and content quality.
- Perfect for job seekers at any career level, students preparing for campus placements, professionals switching careers.
"""
        
        # System prompt for general agent
        general_prompt = f"""You are SkillEdge-AI Assistant, a friendly assistant for the SkillEdge-AI interview preparation platform.

Platform Information:
{knowledge_base_context}

Guidelines:
- Be helpful, professional, and encouraging
- Provide accurate information about SkillEdge-AI platform features and benefits
- If greeting, greet warmly
- If asking about platform, explain clearly using the information above
- Keep responses concise and conversational (2-3 sentences)
- If question is outside platform scope, politely acknowledge and redirect to platform features

User Question: {user_query}

Provide a helpful response:"""
        
        messages = [
            SystemMessage(content=general_prompt),
            HumanMessage(content=user_query)
        ]
        response = self.llm.invoke(messages)
        
        answer = response.content
        logger.info(f"💬 General Agent Response: {answer[:100]}...")
        
        state["response"] = answer
        state["messages"].append(AIMessage(content=answer))
        
        return state
    
    def _route_query(self, state: ChatbotState) -> Literal["resume_agent", "reports_agent", "general_agent"]:
        """
        Router function that determines which agent node to visit next based on supervisor's decision.
        """
        route = state["route"]
        
        if route == "resume":
            return "resume_agent"
        elif route == "reports":
            return "reports_agent"
        else:
            return "general_agent"
    
    async def chat(
        self, 
        user_query: str, 
        user_id: str, 
        conversation_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Main chat function that processes user queries through the LangGraph workflow.
        
        Args:
            user_query: The user's question or message
            user_id: User identifier (Clerk user ID)
            conversation_id: Unique identifier for this conversation (maintains context)
        
        Returns:
            Dictionary containing response, sources, and route information
        """
        logger.info(f"🧑 User ({user_id[:8]}...): {user_query[:50]}...")
        
        # Get or initialize conversation history for this conversation
        if conversation_id not in self.conversation_histories:
            self.conversation_histories[conversation_id] = []
        
        conversation_history = self.conversation_histories[conversation_id]
        
        # Add current user message to history
        conversation_history.append(HumanMessage(content=user_query))
        
        # Build context from last 10 messages for the supervisor
        context_messages = conversation_history[-10:]  # Last 10 messages
        
        # Build a context summary for the supervisor to understand previous conversation
        if len(conversation_history) > 1:
            recent_context = "\n".join([
                f"{'User' if isinstance(msg, HumanMessage) else 'Assistant'}: {msg.content[:100]}..."
                for msg in conversation_history[-4:-1]  # Last 3 exchanges (exclude current)
            ])
            context_aware_query = f"[Previous context: {recent_context}]\n\nCurrent query: {user_query}"
        else:
            context_aware_query = user_query
        
        # Initialize state with conversation history
        initial_state = {
            "messages": context_messages,
            "user_query": context_aware_query,  # Include context for better routing
            "route": "",
            "response": "",
            "user_id": user_id
        }
        
        # Run the workflow
        result = await self.workflow_app.ainvoke(initial_state)
        
        # Add assistant response to conversation history
        conversation_history.append(AIMessage(content=result['response']))
        
        # Determine sources based on route
        sources = []
        if result['route'] == "resume":
            sources = ["Resume Database"]
        elif result['route'] == "reports":
            sources = ["Interview Reports"]
        else:
            sources = ["SkillEdge-AI Knowledge Base"]
        
        logger.info(f"🤖 Response generated via '{result['route']}' agent")
        
        return {
            "response": result["response"],
            "sources": sources,
            "route": result["route"]
        }
    
    def clear_conversation(self, conversation_id: str = "default"):
        """Clear conversation history for a given conversation ID"""
        if conversation_id in self.conversation_histories:
            del self.conversation_histories[conversation_id]
            logger.info(f"✅ Cleared conversation history for: {conversation_id}")


# Singleton instance
_agentic_chatbot_service = None


def get_agentic_chatbot_service() -> AgenticChatbotService:
    """Get or create singleton instance of AgenticChatbotService"""
    global _agentic_chatbot_service
    
    if _agentic_chatbot_service is None:
        _agentic_chatbot_service = AgenticChatbotService()
    
    return _agentic_chatbot_service

# SkillEdge-AI Chatbot Service
"""
Advanced RAG-based chatbot service using FAISS vector database and Gemini API
Handles both general SkillEdge-AI queries and personalized report analysis
"""

import os
import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from datetime import datetime
import json
import pickle
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatbotService:
    """Advanced RAG-based chatbot service for SkillEdge-AI"""
    
    def __init__(self):
        self.embedding_model = None
        self.faiss_index = None
        self.knowledge_base = []
        self.gemini_model = None
        self.vector_dimension = 384  # all-MiniLM-L6-v2 embedding dimension
        self.knowledge_base_path = "app/chatbot/knowledge_base"
        self.index_path = "app/chatbot/faiss_index"
        
        # Create directories if they don't exist
        Path(self.knowledge_base_path).mkdir(parents=True, exist_ok=True)
        Path(self.index_path).mkdir(parents=True, exist_ok=True)
        
        # Initialize models
        self._initialize_models()
        
        # Load or create knowledge base
        self._setup_knowledge_base()
    
    def _initialize_models(self):
        """Initialize embedding and LLM models"""
        try:
            # Initialize sentence transformer for embeddings
            logger.info("Loading sentence transformer model...")
            self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            
            # Initialize Gemini API
            gemini_api_key = os.getenv("GEMINI_API_KEY")
            if gemini_api_key:
                genai.configure(api_key=gemini_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
                logger.info("Gemini API initialized successfully")
            else:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
                
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            raise
    
    def _setup_knowledge_base(self):
        """Setup or load existing knowledge base and FAISS index"""
        try:
            # Try to load existing index and knowledge base
            if self._load_existing_index():
                logger.info("Loaded existing FAISS index and knowledge base")
                return
            
            # Create new knowledge base if none exists
            logger.info("Creating new knowledge base...")
            self._create_initial_knowledge_base()
            self._build_faiss_index()
            self._save_index()
            
        except Exception as e:
            logger.error(f"Error setting up knowledge base: {e}")
            raise
    
    def _load_existing_index(self) -> bool:
        """Load existing FAISS index and knowledge base"""
        try:
            index_file = f"{self.index_path}/skilledge.index"
            kb_file = f"{self.knowledge_base_path}/knowledge_base.pkl"
            
            if os.path.exists(index_file) and os.path.exists(kb_file):
                # Load FAISS index
                self.faiss_index = faiss.read_index(index_file)
                
                # Load knowledge base
                with open(kb_file, 'rb') as f:
                    self.knowledge_base = pickle.load(f)
                
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error loading existing index: {e}")
            return False
    
    def _save_index(self):
        """Save FAISS index and knowledge base"""
        try:
            # Save FAISS index
            index_file = f"{self.index_path}/skilledge.index"
            faiss.write_index(self.faiss_index, index_file)
            
            # Save knowledge base
            kb_file = f"{self.knowledge_base_path}/knowledge_base.pkl"
            with open(kb_file, 'wb') as f:
                pickle.dump(self.knowledge_base, f)
                
            logger.info("FAISS index and knowledge base saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving index: {e}")
    
    def _create_initial_knowledge_base(self):
        """Create initial knowledge base with SkillEdge-AI information"""
        
        # SkillEdge-AI Knowledge Base
        skilledge_knowledge = [
            {
                "content": "SkillEdge-AI is an advanced AI-powered interview simulation platform designed to help job seekers prepare for interviews. It provides comprehensive feedback on both verbal and non-verbal communication skills.",
                "category": "general",
                "metadata": {"type": "overview", "importance": "high"}
            },
            {
                "content": "SkillEdge-AI offers three main types of interviews: Technical interviews for assessing programming and technical skills, Behavioral interviews for evaluating soft skills and personality fit, and Resume-based interviews that focus on your professional background and experiences.",
                "category": "features",
                "metadata": {"type": "interview_types", "importance": "high"}
            },
            {
                "content": "The platform provides three detailed reports after each interview: Verbal Report analyzing your answers correctness, answers deth, domain knowledge etc; Non-Verbal Report for examing speech patterns, content quality, confidence level, and communication clarity and overall presentation; Overall Report combining both analyses with actionable insights and improvement recommendations.",
                "category": "reports",
                "metadata": {"type": "report_types", "importance": "high"}
            },
            {
                "content": "SkillEdge-AI uses advanced AI technologies including speech recognition, natural language processing, and machine learning to provide accurate and detailed feedback on your interview performance.",
                "category": "technology",
                "metadata": {"type": "ai_capabilities", "importance": "medium"}
            },
            {
                "content": "To get started with SkillEdge-AI: 1) Create your profile with professional details, 2) Choose your interview type based on your preparation needs, 3) Complete the AI-powered interview simulation, 4) Review your detailed reports and recommendations, 5) Practice regularly to improve your performance.",
                "category": "getting_started",
                "metadata": {"type": "how_to_use", "importance": "high"}
            },
            {
                "content": "SkillEdge-AI helps improve your interview performance by providing objective feedback on areas like speaking pace, clarity, confidence and content quality. The platform identifies specific areas for improvement and provides actionable recommendations.",
                "category": "benefits",
                "metadata": {"type": "improvement_areas", "importance": "high"}
            },
            {
                "content": "The Verbal Report analyzes your answers correctness, domain knowledge, answers depth etc.",
                "category": "verbal_analysis",
                "metadata": {"type": "verbal_metrics", "importance": "medium"}
            },
            {
                "content": "The Non-Verbal Report analyzes various aspects of your speech including fluency, pace, volume, clarity, filler words usage, vocabulary richness, grammar accuracy, and overall communication effectiveness. It provides specific scores and detailed feedback for each aspect",
                "category": "nonverbal_analysis",
                "metadata": {"type": "nonverbal_metrics", "importance": "medium"}
            },
            {
                "content": "SkillEdge-AI is perfect for job seekers at any career level, students preparing for campus placements, professionals looking to switch careers, and anyone wanting to improve their interview skills and build confidence.",
                "category": "target_audience",
                "metadata": {"type": "who_should_use", "importance": "medium"}
            },
            {
                "content": "Common issues identified by SkillEdge-AI include speaking too fast or too slow, using excessive filler words, unclear articulation, lack of confidence in voice, and insufficient preparation for specific question types.",
                "category": "common_issues",
                "metadata": {"type": "typical_problems", "importance": "high"}
            },
            {
                "content": "SkillEdge-AI provides personalized improvement strategies based on your specific performance patterns. These may include speech exercises, confidence-building techniques, content structure improvements, and practice recommendations tailored to your weaknesses.",
                "category": "improvement_strategies",
                "metadata": {"type": "personalized_help", "importance": "high"}
            },
            {
                "content": "You can track your progress over time with SkillEdge-AI by taking multiple interviews and comparing your scores across different sessions. The platform maintains a history of your performance metrics and shows improvement trends.",
                "category": "progress_tracking",
                "metadata": {"type": "performance_monitoring", "importance": "medium"}
            }
        ]
        
        self.knowledge_base = skilledge_knowledge
        logger.info(f"Created knowledge base with {len(self.knowledge_base)} entries")
    
    def _build_faiss_index(self):
        """Build FAISS index from knowledge base"""
        try:
            # Generate embeddings for all knowledge base entries
            contents = [item["content"] for item in self.knowledge_base]
            embeddings = self.embedding_model.encode(contents, convert_to_numpy=True)
            
            # Create FAISS index
            self.faiss_index = faiss.IndexFlatIP(self.vector_dimension)  # Inner product for cosine similarity
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(embeddings)
            
            # Add embeddings to index
            self.faiss_index.add(embeddings.astype('float32'))
            
            logger.info(f"Built FAISS index with {self.faiss_index.ntotal} vectors")
            
        except Exception as e:
            logger.error(f"Error building FAISS index: {e}")
            raise
    
    def add_to_knowledge_base(self, content: str, category: str, metadata: Dict[str, Any] = None):
        """Add new content to knowledge base and update FAISS index"""
        try:
            # Add to knowledge base
            new_entry = {
                "content": content,
                "category": category,
                "metadata": metadata or {}
            }
            self.knowledge_base.append(new_entry)
            
            # Generate embedding for new content
            embedding = self.embedding_model.encode([content], convert_to_numpy=True)
            faiss.normalize_L2(embedding)
            
            # Add to FAISS index
            self.faiss_index.add(embedding.astype('float32'))
            
            # Save updated index
            self._save_index()
            
            logger.info(f"Added new entry to knowledge base: {category}")
            
        except Exception as e:
            logger.error(f"Error adding to knowledge base: {e}")
    
    def search_knowledge_base(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search knowledge base using semantic similarity"""
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query], convert_to_numpy=True)
            faiss.normalize_L2(query_embedding)
            
            # Search FAISS index
            scores, indices = self.faiss_index.search(query_embedding.astype('float32'), top_k)
            
            # Retrieve relevant knowledge base entries
            results = []
            for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
                if idx < len(self.knowledge_base):
                    result = self.knowledge_base[idx].copy()
                    result["similarity_score"] = float(score)
                    result["rank"] = i + 1
                    results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching knowledge base: {e}")
            return []
    
    async def generate_response(self, 
                              query: str, 
                              context: List[Dict[str, Any]] = None,
                              user_reports: Dict[str, Any] = None,
                              conversation_history: List[Dict[str, str]] = None) -> str:
        """Generate response using Gemini API with RAG context"""
        try:
            # Search knowledge base for relevant information
            relevant_context = self.search_knowledge_base(query, top_k=3)
            
            # Build context for LLM
            context_text = ""
            
            # Add relevant knowledge base context
            if relevant_context:
                context_text += "Relevant SkillEdge-AI Information:\n"
                for item in relevant_context:
                    context_text += f"- {item['content']}\n"
                context_text += "\n"
            
            # Add user report context if analyzing reports
            if user_reports:
                context_text += "User's Interview Reports:\n"
                if "verbal_report" in user_reports:
                    context_text += f"Verbal Report: {json.dumps(user_reports['verbal_report'], indent=2, default=str)}\n"
                if "nonverbal_report" in user_reports:
                    context_text += f"Non-Verbal Report: {json.dumps(user_reports['nonverbal_report'], indent=2, default=str)}\n"
                if "overall_report" in user_reports:
                    context_text += f"Overall Report: {json.dumps(user_reports['overall_report'], indent=2, default=str)}\n"
                context_text += "\n"
            
            # Build conversation history
            history_text = ""
            if conversation_history:
                history_text = "Previous conversation:\n"
                for msg in conversation_history[-5:]:  # Last 5 messages for context
                    history_text += f"{msg['role']}: {msg['content']}\n"
                history_text += "\n"
            
            # Create comprehensive prompt
            prompt = f"""You are SkillEdge-AI Assistant, an intelligent chatbot for the SkillEdge-AI interview preparation platform. 
You have two main functions:

1. Answer general questions about SkillEdge-AI platform (features, benefits, how to use, etc.)
2. Provide personalized analysis and advice based on user's interview reports

Guidelines:
- Be helpful, professional, and encouraging
- Use the provided context to give accurate information
- When analyzing reports, be specific and actionable in your advice
- If you don't have enough information, ask clarifying questions
- Keep responses concise but comprehensive
- Focus on helping users improve their interview performance

{history_text}

{context_text}

User Question: {query}

Please provide a helpful and relevant response:

Note: as you are a chatbot assistane, please give short concise and to the point answers
"""

            # Generate response using Gemini
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt
            )
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            logger.exception("Full traceback:")
            return f"I apologize, but I'm experiencing technical difficulties: {str(e)}. Please try again later."
    
    async def analyze_user_reports(self, query: str, user_reports: Dict[str, Any]) -> str:
        """Analyze user's interview reports and provide personalized insights"""
        try:
            logger.info(f"Analyzing user reports for query: {query}")
            logger.info(f"User reports available: {list(user_reports.keys()) if user_reports else 'None'}")
            
            # Check if user has any reports
            if not user_reports:
                return "I don't see any interview reports for your account yet. Please complete an interview first to get personalized insights about your performance."
            
            # Check if this is just a greeting or simple message
            query_lower = query.lower().strip()
            greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "how are you", "what's up", "sup"]
            simple_responses = ["thanks", "thank you", "ok", "okay", "yes", "no", "sure", "alright"]
            
            if query_lower in greetings or any(greeting in query_lower for greeting in greetings):
                return "Hi! I'm here to help you analyze your interview performance. You can ask me specific questions about your reports, like:\n\n• 'Why did I score low on verbal skills?'\n• 'How can I improve my speaking pace?'\n• '\n• 'Give me tips based on my performance'\n\nWhat would you like to know about your interview results?"
            
            if query_lower in simple_responses:
                return "Great! Feel free to ask me any specific questions about your interview performance. I can help explain your scores, identify areas for improvement, or provide personalized recommendations based on your reports."
            
            # Check if the query is actually asking about performance/reports
            report_keywords = [
                "score", "report", "performance", "analysis", "feedback", "improve", "better", "why", "how",
                "verbal", "nonverbal", "non-verbal", "speaking", "voice", "body language", "confidence",
                "recommendations", "tips", "advice", "weak", "strong", "strength", "weakness", "problem",
                "good", "bad", "rate", "speech rate", "words per minute", "wpm", "pace", "speed", "slow", "fast",
                "time", "total", "minutes", "seconds", "speaking time", "stats", "statistics", "data",
                "tell me", "what was", "how much", "how many", "analyze", "explain", "understand"
            ]
            
            # Also check for question patterns that likely relate to reports
            question_patterns = [
                "what", "how", "why", "when", "where", "which", "tell me", "show me", "explain",
                "was my", "is my", "did i", "do i", "can you", "could you"
            ]
            
            # Check if it's a report-related query
            has_report_keywords = any(keyword in query_lower for keyword in report_keywords)
            has_question_pattern = any(pattern in query_lower for pattern in question_patterns)
            
            # If it doesn't seem report-related, give the generic response
            if not has_report_keywords and not has_question_pattern:
                return "I see you're in Report Analysis mode! I can help you understand your interview performance and provide personalized insights. Try asking something like:\n\n• 'Analyze my interview performance'\n• 'What are my weak areas?'\n• 'How can I improve my scores?'\n• 'Why did I get this feedback?'\n\nWhat specific aspect of your interview would you like me to analyze?"
            
            # Extract key issues from query for actual report analysis
            focus_area = "general"
            if any(word in query_lower for word in ["speak", "voice", "talk", "verbal", "communication", "speak slow", "speak fast", "filler"]):
                focus_area = "verbal"
            elif any(word in query_lower for word in ["posture", "nonverbal", "non-verbal", "nervous"]):
                focus_area = "nonverbal"
            
            logger.info(f"Focus area determined: {focus_area}")
            
            # Generate personalized response
            response = await self.generate_response(
                query=query,
                user_reports=user_reports
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error analyzing user reports: {e}")
            logger.exception("Full traceback:")
            return f"I encountered an issue while analyzing your reports: {str(e)}. Please try rephrasing your question or contact support if the issue persists."

# Global chatbot instance
chatbot_service = None

def get_chatbot_service() -> ChatbotService:
    """Get or create chatbot service instance"""
    global chatbot_service
    if chatbot_service is None:
        chatbot_service = ChatbotService()
    return chatbot_service
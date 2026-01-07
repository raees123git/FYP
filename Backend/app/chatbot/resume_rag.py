# SkillEdge-AI Resume RAG Service
"""
Dedicated RAG service for user resume indexing and querying
Maintains separate FAISS index for each user's resume
"""

import os
import logging
from typing import List, Dict, Any, Optional
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path
import pickle
from bson.objectid import ObjectId

from app.file_handler import FileHandler
from app.resume_parser import ResumeParser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeRAGService:
    """Handle resume-specific RAG operations with separate FAISS indexes per user"""
    
    def __init__(self):
        self.embedding_model = None
        self.vector_dimension = 384  # all-MiniLM-L6-v2 embedding dimension
        self.resume_index_path = "app/chatbot/faiss_index/resumes"
        
        # Create directories if they don't exist
        Path(self.resume_index_path).mkdir(parents=True, exist_ok=True)
        
        # Initialize embedding model
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize sentence transformer for embeddings"""
        try:
            logger.info("Loading sentence transformer model for resume RAG...")
            self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            logger.info("Resume RAG model initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing resume RAG model: {e}")
            raise
    
    def _get_user_index_path(self, user_id: str) -> str:
        """Get the file path for user's resume index"""
        return f"{self.resume_index_path}/{user_id}_resume.index"
    
    def _get_user_kb_path(self, user_id: str) -> str:
        """Get the file path for user's resume knowledge base"""
        return f"{self.resume_index_path}/{user_id}_resume_kb.pkl"
    
    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
        """
        Split text into overlapping chunks for better retrieval
        
        Args:
            text: Text to chunk
            chunk_size: Size of each chunk in characters
            overlap: Overlap between chunks
            
        Returns:
            List of text chunks
        """
        if not text or len(text) < chunk_size:
            return [text] if text else []
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > chunk_size * 0.5:  # Only break if we're past 50% of chunk size
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return chunks
    
    async def index_user_resume(self, user_id: str, resume_file_id: str) -> Dict[str, Any]:
        """
        Download user's resume, parse it, and create a FAISS index
        
        Args:
            user_id: User's ID
            resume_file_id: GridFS file ID of the resume
            
        Returns:
            Status dictionary
        """
        try:
            logger.info(f"Indexing resume for user {user_id}, file_id: {resume_file_id}")
            
            # Download resume from GridFS
            resume_data = await FileHandler.download_resume(resume_file_id)
            
            if not resume_data or not resume_data.get("success"):
                logger.error(f"Failed to download resume: {resume_data}")
                return {"success": False, "error": "Failed to download resume"}
            
            # Extract text from PDF
            resume_content = resume_data.get("content")
            if not resume_content:
                return {"success": False, "error": "No content in resume"}
            
            # Parse resume text
            resume_text = ResumeParser.extract_text_from_pdf(resume_content)
            
            if not resume_text:
                return {"success": False, "error": "Failed to extract text from resume"}
            
            logger.info(f"Extracted {len(resume_text)} characters from resume")
            
            # Parse resume for structured information
            parsed_resume = ResumeParser.parse_resume(resume_content)
            
            # Create knowledge base entries from resume
            knowledge_base = []
            
            # Add full text as chunks for comprehensive search
            text_chunks = self._chunk_text(resume_text, chunk_size=500, overlap=100)
            for i, chunk in enumerate(text_chunks):
                knowledge_base.append({
                    "content": chunk,
                    "type": "text_chunk",
                    "chunk_index": i,
                    "metadata": {"source": "resume_text"}
                })
            
            # Add structured information if available
            if parsed_resume.get("success"):
                # Add skills section
                skills = parsed_resume.get("skills", [])
                if skills:
                    skills_text = f"Technical Skills: {', '.join(skills)}"
                    knowledge_base.append({
                        "content": skills_text,
                        "type": "skills",
                        "metadata": {"source": "parsed_skills"}
                    })
                
                # Add experience information
                exp_years = parsed_resume.get("experience_years")
                if exp_years:
                    exp_text = f"Total years of professional experience: {exp_years} years"
                    knowledge_base.append({
                        "content": exp_text,
                        "type": "experience",
                        "metadata": {"source": "parsed_experience"}
                    })
                
                # Add education information
                education = parsed_resume.get("education", [])
                if education:
                    edu_text = f"Education: {', '.join(education)}"
                    knowledge_base.append({
                        "content": edu_text,
                        "type": "education",
                        "metadata": {"source": "parsed_education"}
                    })
                
                # Add contact info
                contact = parsed_resume.get("contact_info", {})
                contact_parts = []
                if contact.get("email"):
                    contact_parts.append(f"Email: {contact['email']}")
                if contact.get("phone"):
                    contact_parts.append(f"Phone: {contact['phone']}")
                if contact.get("linkedin"):
                    contact_parts.append(f"LinkedIn: {contact['linkedin']}")
                if contact.get("github"):
                    contact_parts.append(f"GitHub: {contact['github']}")
                
                if contact_parts:
                    contact_text = "Contact Information: " + ", ".join(contact_parts)
                    knowledge_base.append({
                        "content": contact_text,
                        "type": "contact",
                        "metadata": {"source": "parsed_contact"}
                    })
            
            logger.info(f"Created {len(knowledge_base)} knowledge base entries")
            
            # Generate embeddings
            contents = [item["content"] for item in knowledge_base]
            embeddings = self.embedding_model.encode(contents, convert_to_numpy=True)
            
            # Create FAISS index
            faiss_index = faiss.IndexFlatIP(self.vector_dimension)
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(embeddings)
            
            # Add embeddings to index
            faiss_index.add(embeddings.astype('float32'))
            
            # Save index and knowledge base
            index_path = self._get_user_index_path(user_id)
            kb_path = self._get_user_kb_path(user_id)
            
            faiss.write_index(faiss_index, index_path)
            
            with open(kb_path, 'wb') as f:
                pickle.dump(knowledge_base, f)
            
            logger.info(f"Resume indexed successfully for user {user_id}: {faiss_index.ntotal} vectors")
            
            return {
                "success": True,
                "message": "Resume indexed successfully",
                "chunks": len(knowledge_base),
                "resume_text_length": len(resume_text)
            }
            
        except Exception as e:
            logger.error(f"Error indexing resume for user {user_id}: {e}")
            logger.exception("Full traceback:")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _load_user_index(self, user_id: str) -> tuple[Optional[faiss.Index], Optional[List[Dict[str, Any]]]]:
        """
        Load user's resume index and knowledge base
        
        Returns:
            Tuple of (faiss_index, knowledge_base) or (None, None) if not found
        """
        try:
            index_path = self._get_user_index_path(user_id)
            kb_path = self._get_user_kb_path(user_id)
            
            if not os.path.exists(index_path) or not os.path.exists(kb_path):
                logger.info(f"No resume index found for user {user_id}")
                return None, None
            
            # Load FAISS index
            faiss_index = faiss.read_index(index_path)
            
            # Load knowledge base
            with open(kb_path, 'rb') as f:
                knowledge_base = pickle.load(f)
            
            logger.info(f"Loaded resume index for user {user_id}: {faiss_index.ntotal} vectors")
            return faiss_index, knowledge_base
            
        except Exception as e:
            logger.error(f"Error loading resume index for user {user_id}: {e}")
            return None, None
    
    async def search_user_resume(self, user_id: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Search user's resume using semantic similarity
        
        Args:
            user_id: User's ID
            query: Search query
            top_k: Number of results to return
            
        Returns:
            List of relevant resume chunks with similarity scores
        """
        try:
            # Load user's index
            faiss_index, knowledge_base = self._load_user_index(user_id)
            
            if faiss_index is None or knowledge_base is None:
                logger.info(f"No resume index available for user {user_id}")
                return []
            
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query], convert_to_numpy=True)
            faiss.normalize_L2(query_embedding)
            
            # Search FAISS index
            scores, indices = faiss_index.search(query_embedding.astype('float32'), min(top_k, faiss_index.ntotal))
            
            # Retrieve relevant entries
            results = []
            for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
                if idx < len(knowledge_base) and idx >= 0:
                    result = knowledge_base[idx].copy()
                    result["similarity_score"] = float(score)
                    result["rank"] = i + 1
                    results.append(result)
            
            logger.info(f"Found {len(results)} resume chunks for user {user_id}")
            return results
            
        except Exception as e:
            logger.error(f"Error searching resume for user {user_id}: {e}")
            logger.exception("Full traceback:")
            return []
    
    async def delete_user_resume_index(self, user_id: str) -> bool:
        """
        Delete user's resume index and knowledge base
        
        Args:
            user_id: User's ID
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            index_path = self._get_user_index_path(user_id)
            kb_path = self._get_user_kb_path(user_id)
            
            deleted = False
            
            if os.path.exists(index_path):
                os.remove(index_path)
                deleted = True
                logger.info(f"Deleted resume index for user {user_id}")
            
            if os.path.exists(kb_path):
                os.remove(kb_path)
                deleted = True
                logger.info(f"Deleted resume knowledge base for user {user_id}")
            
            return deleted
            
        except Exception as e:
            logger.error(f"Error deleting resume index for user {user_id}: {e}")
            return False
    
    def has_resume_index(self, user_id: str) -> bool:
        """
        Check if user has a resume index
        
        Args:
            user_id: User's ID
            
        Returns:
            True if user has resume index, False otherwise
        """
        index_path = self._get_user_index_path(user_id)
        kb_path = self._get_user_kb_path(user_id)
        return os.path.exists(index_path) and os.path.exists(kb_path)

# Global instance
resume_rag_service = None

def get_resume_rag_service() -> ResumeRAGService:
    """Get or create resume RAG service instance"""
    global resume_rag_service
    if resume_rag_service is None:
        resume_rag_service = ResumeRAGService()
    return resume_rag_service

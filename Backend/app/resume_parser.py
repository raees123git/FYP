# SkillEdge-API/app/resume_parser.py
"""
Resume parser utility for extracting and processing text from PDF resumes
"""

import PyPDF2
import io
from typing import Optional, Dict, Any
import re

class ResumeParser:
    """Parse and extract information from PDF resumes"""
    
    @staticmethod
    def extract_text_from_pdf(pdf_content: bytes) -> str:
        """
        Extract plain text from PDF content
        
        Args:
            pdf_content: PDF file content in bytes
            
        Returns:
            Extracted text as string
        """
        try:
            # Create a PDF reader object
            pdf_file = io.BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            # Extract text from all pages
            text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n"
            
            # Clean up the text
            text = ResumeParser._clean_text(text)
            
            return text
            
        except Exception as e:
            print(f"Error extracting text from PDF: {str(e)}")
            return ""
    
    @staticmethod
    def _clean_text(text: str) -> str:
        """
        Clean and normalize extracted text
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s\-.,;:!?()\[\]{}/@#$%&*+=\'\"]+', '', text)
        
        # Strip leading/trailing whitespace
        text = text.strip()
        
        return text
    
    @staticmethod
    def parse_resume(pdf_content: bytes) -> Dict[str, Any]:
        """
        Parse resume and extract structured information
        
        Args:
            pdf_content: PDF file content in bytes
            
        Returns:
            Dictionary containing parsed resume information
        """
        text = ResumeParser.extract_text_from_pdf(pdf_content)
        
        if not text:
            return {
                "success": False,
                "error": "Could not extract text from resume",
                "text": ""
            }
        
        # Extract sections (basic parsing - can be enhanced)
        parsed_data = {
            "success": True,
            "text": text,
            "sections": ResumeParser._extract_sections(text),
            "skills": ResumeParser._extract_skills(text),
            "experience_years": ResumeParser._extract_experience_years(text),
            "education": ResumeParser._extract_education(text),
            "contact_info": ResumeParser._extract_contact_info(text)
        }
        
        return parsed_data
    
    @staticmethod
    def _extract_sections(text: str) -> Dict[str, str]:
        """Extract common resume sections"""
        sections = {}
        common_headers = [
            "objective", "summary", "experience", "education", 
            "skills", "projects", "achievements", "certifications",
            "professional experience", "work experience", "technical skills"
        ]
        
        text_lower = text.lower()
        
        for header in common_headers:
            # Look for section headers
            pattern = rf"{header}[\s:]*(.+?)(?={'|'.join(common_headers)}|$)"
            match = re.search(pattern, text_lower, re.IGNORECASE | re.DOTALL)
            if match:
                sections[header] = match.group(1).strip()[:500]  # Limit section length
        
        return sections
    
    @staticmethod
    def _extract_skills(text: str) -> list:
        """Extract technical skills from resume"""
        # Common programming languages and technologies
        tech_keywords = [
            "python", "java", "javascript", "c++", "c#", "ruby", "go", "rust",
            "react", "angular", "vue", "node.js", "django", "flask", "spring",
            "sql", "nosql", "mongodb", "postgresql", "mysql", "redis",
            "aws", "azure", "gcp", "docker", "kubernetes", "git", "ci/cd",
            "machine learning", "deep learning", "ai", "tensorflow", "pytorch",
            "html", "css", "typescript", "swift", "kotlin", "php", "scala"
        ]
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in tech_keywords:
            if skill in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
    @staticmethod
    def _extract_experience_years(text: str) -> Optional[int]:
        """Extract years of experience from resume"""
        # Look for patterns like "X years of experience"
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'experience\s*:\s*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s*in'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return int(match.group(1))
        
        return None
    
    @staticmethod
    def _extract_education(text: str) -> list:
        """Extract education information"""
        degrees = []
        degree_patterns = [
            r"bachelor['s]?\s*(?:of\s*)?\w+",
            r"master['s]?\s*(?:of\s*)?\w+",
            r"phd\s*(?:in\s*)?\w+",
            r"b\.?s\.?\s*(?:in\s*)?\w+",
            r"m\.?s\.?\s*(?:in\s*)?\w+",
            r"b\.?tech",
            r"m\.?tech",
            r"mba"
        ]
        
        text_lower = text.lower()
        
        for pattern in degree_patterns:
            matches = re.findall(pattern, text_lower)
            degrees.extend(matches)
        
        return degrees
    
    @staticmethod
    def _extract_contact_info(text: str) -> Dict[str, Optional[str]]:
        """Extract contact information"""
        contact = {}
        
        # Email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, text)
        contact["email"] = email_match.group(0) if email_match else None
        
        # Phone (basic pattern)
        phone_pattern = r'[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}'
        phone_match = re.search(phone_pattern, text)
        contact["phone"] = phone_match.group(0) if phone_match else None
        
        # LinkedIn
        linkedin_pattern = r'linkedin\.com/in/[\w-]+'
        linkedin_match = re.search(linkedin_pattern, text.lower())
        contact["linkedin"] = linkedin_match.group(0) if linkedin_match else None
        
        # GitHub
        github_pattern = r'github\.com/[\w-]+'
        github_match = re.search(github_pattern, text.lower())
        contact["github"] = github_match.group(0) if github_match else None
        
        return contact
    
    @staticmethod
    def prepare_for_interview(parsed_resume: Dict[str, Any], position: str = None) -> str:
        """
        Prepare resume content for interview question generation
        
        Args:
            parsed_resume: Parsed resume data
            position: Target position for the interview
            
        Returns:
            Formatted text suitable for question generation
        """
        if not parsed_resume.get("success"):
            return ""
        
        # Build a structured summary for the AI model
        summary = f"Resume Content for Interview:\n\n"
        
        if position:
            summary += f"Target Position: {position}\n\n"
        
        # Add full text (limited to prevent token overflow)
        full_text = parsed_resume.get("text", "")
        summary += f"Full Resume Text:\n{full_text[:3000]}\n\n"  # Limit to 3000 chars
        
        # Add extracted skills
        skills = parsed_resume.get("skills", [])
        if skills:
            summary += f"Technical Skills Found: {', '.join(skills)}\n\n"
        
        # Add experience years
        exp_years = parsed_resume.get("experience_years")
        if exp_years:
            summary += f"Years of Experience: {exp_years}\n\n"
        
        # Add education
        education = parsed_resume.get("education", [])
        if education:
            summary += f"Education: {', '.join(education)}\n\n"
        
        # Add key sections
        sections = parsed_resume.get("sections", {})
        for section_name, section_content in sections.items():
            if section_content:
                summary += f"\n{section_name.title()}:\n{section_content[:500]}\n"
        
        return summary
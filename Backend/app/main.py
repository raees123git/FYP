# SkillEdge-API/app/main.py

from fastapi import FastAPI, HTTPException, Depends, Header
import re
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from peft import PeftModel
from dotenv import load_dotenv
import google.generativeai as genai
import json
from app.file_handler import FileHandler
from app.resume_parser import ResumeParser

# Load env vars
load_dotenv()
app = FastAPI()

# Import database connection
from app.database import connect_to_mongo, close_mongo_connection

# Import routers
from app.routers import profile, reports, chatbot

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
else:
    print("Warning: GEMINI_API_KEY not found in environment")

# CORS Configuration
enabled_origins = [
    "http://localhost:3000", 
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=enabled_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(profile.router)
app.include_router(reports.router)
app.include_router(chatbot.router)

# Health check endpoint for connection warming
@app.get("/")
async def health_check():
    """Simple health check endpoint for connection pre-warming"""
    return {"status": "ok", "message": "SkillEdge API is running"}

@app.get("/ping")
async def ping():
    """Ultra-lightweight ping endpoint"""
    return {"ping": "pong"}

# Startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Local cache paths (update if paths differ on your system)
ADAPTER_LOCAL_PATH = r"C:\Users\User\.cache\huggingface\hub\models--raees456--QA_Generation_Model22\snapshots\779f3d85096944cc3c196d834524205a452f8363"
BASE_LOCAL_PATH = r"C:\Users\User\.cache\huggingface\hub\models--google--gemma-3-1b-it\snapshots\dcc83ea841ab6100d6b47a070329e1ba4cf78752"

# Load base model
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_LOCAL_PATH,
    dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto"
)

# Apply LoRA adapter
model = PeftModel.from_pretrained(
    base_model,
    ADAPTER_LOCAL_PATH
)

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(BASE_LOCAL_PATH)

# 1) Where are the parameters?
devices = {p.device for p in model.parameters()}
print("Model parameter devices:", devices)

# 2) How much GPU RAM is used?
if torch.cuda.is_available():
    used = torch.cuda.memory_allocated(0) / 1024**3
    total = torch.cuda.get_device_properties(0).total_memory / 1024**3
    print(f"GPU memory in use: {used:.2f} GB / {total:.2f} GB")
else:
    print("CUDA not available — running on CPU.")

# Text generation pipeline
device = 0 if torch.cuda.is_available() else -1
print("Running on:", "GPU" if device == 0 else "CPU")
text_generator = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
)

# Request schemas
class QuestionRequest(BaseModel):
    type: str
    role: str
    count: int
    resume_content: Optional[str] = None  # For resume-based interviews

class VerbalReportRequest(BaseModel):
    questions: List[str] = Field(..., description="List of interview questions")
    answers: List[str] = Field(..., description="List of user answers")
    interview_type: str = Field(default="technical", description="Type of interview")
    role: str = Field(default="Software Engineer", description="Role/position for the interview")

@app.get("/api/interview/parse-resume/{file_id}")
async def parse_resume(
    file_id: str,
    authorization: str = Header(...)
):
    """Parse a resume and extract its content for interview question generation"""
    try:
        # Extract user_id from authorization header
        try:
            parts = authorization.split()
            if len(parts) != 2 or parts[0].lower() != "bearer":
                raise HTTPException(status_code=401, detail="Invalid authorization header format")
            user_id = parts[1]
        except Exception:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        # Download resume from GridFS
        result = await FileHandler.download_resume(file_id)
        
        if not result or not result["success"]:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Verify the file belongs to the user
        if result["metadata"].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Parse the resume
        parsed = ResumeParser.parse_resume(result["content"])
        
        if not parsed["success"]:
            raise HTTPException(status_code=500, detail="Failed to parse resume")
        
        # Prepare content for interview
        interview_content = ResumeParser.prepare_for_interview(parsed)
        
        return {
            "success": True,
            "parsed_content": parsed,
            "interview_content": interview_content,
            "file_id": file_id,
            "filename": result["filename"]
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error parsing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interview/generate-question")
async def generate_question(request: QuestionRequest):
    if not request.type or not request.role:
        raise HTTPException(status_code=400, detail="Missing type or role")
    
    print(f"Generating questions for type: {request.type}, role: {request.role}")
    
    # Check if this is a resume-based interview
    if request.type == "resume" and request.resume_content:
        # Create a specialized prompt for resume-based questions
        prompt = (
            "You are a helpful assistant specialized in generating interview questions from a resume. \n\n"
            "Please generate questions based on the candidate's resume (as the content of resume is provided).\n\n"
            "Given the following inputs:\n"
            f"Interview Type: {request.type}\n"
            f"Role: {request.role}\n\n"
            f"Resume Content:\n{request.resume_content[:2500]}\n\n"
            f"Please generate exactly {request.count} unique interview questions tailored to the above.\n"
            "– Output only the questions (no answers, no extra commentary).\n"
            "– Number them sequentially, in this exact template:\n\n"
            "Question1: <your first question here>\n"
            "Question2: <your second question here>\n"
            "Question3: <…>\n"
            "Question4: <…>\n"
            "Question5: <…>\n"
            "Question6: <…>\n"
            "Question7: <your seventh question here>\n"
            "note: These are just a syntax for you to follow, suppose if user ask for 5 questions, then generate 5 questions according to the template, always starting from Question1"
            "note: follow the format above of printing Question1 and then the question. it is necessary to follow the format\n"
        
        )
        #     else:
        # # Original prompt for technical/behavioral interviews
        # prompt = (
        # # "You are an expert interviewer conducting a resume-based interview.\n\n"
        #     # "Given the following resume content and target position, generate personalized interview questions:\n\n"
        #     # f"Target Position: {request.role}\n\n"
        #     # f"Resume Content:\n{request.resume_content[:2500]}\n\n"  # Limit resume content
        #     # f"Please generate exactly {request.count} unique, personalized interview questions based on:"
        #     # "\n- The candidate's specific experience mentioned in the resume"
        #     # "\n- Their listed skills and technologies"
        #     # "\n- Their projects and achievements"
        #     # "\n- Gaps or areas that need clarification"
        #     # "\n- How their background aligns with the target position\n\n"
        #     # "Questions should be specific to this candidate's background.\n"
        #     # "– Output only the questions (no answers, no extra commentary).\n"
        #     # "– Number them sequentially, in this exact template:\n\n"
        #     # "Question1: <your first question here>\n"
        #     # "Question2: <your second question here>\n"
        #     # "(continue for all questions requested)\n"
        # )
    else:
        # Original prompt for technical/behavioral interviews
        prompt = (
            "You are a helpful assistant specialized in generating interview questions.\n\n"
            "Given the following inputs:\n"
            f"Interview Type: {request.type}\n"
            f"Role: {request.role}\n\n"
            f"Please generate exactly {request.count} unique interview questions tailored to the above.\n"
            "– Output only the questions (no answers, no extra commentary).\n"
            "– Number them sequentially, in this exact template:\n\n"
            "Question1: <your first question here>\n"
            "Question2: <your second question here>\n"
            "Question3: <…>\n"
            "Question4: <…>\n"
            "Question5: <…>\n"
            "Question6: <…>\n"
            "Question7: <your seventh question here>\n"
            "note: These are just a syntax for you to follow, suppose if user ask for 5 questions, then generate 5 questions according to the template, always starting from Question1"
            "note: follow the format above of printing Question1 and then the question. it is necessary to follow the format\n"
        )

    print(f"You are an interviewer conducting a {request.type} interview for the position of {request.role}.\n")
    print(f"Questions demanded by user are {request.count}")
    print(request.role)

    try:
        outputs = text_generator(
            prompt,
            max_new_tokens=100,
            do_sample=True,
            temperature=0.7,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            num_return_sequences=1
        )
        generated = outputs[0]["generated_text"]
        question_text = generated[len(prompt):].strip() or generated.strip()

        # Use a regex to pull out each "QuestionN: ..." line
        print(question_text)
        question_text = re.findall(r"(?m)(?:Question\d+:|\d+\.)\s*(.+)", question_text)
        question_text = question_text[:request.count]  # Limit to requested count
        return {"question": question_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")


# @app.post("/api/interview/generate-question")
# async def generate_question(request: QuestionRequest):
#         question_text = ["What technical challenges did you encounter in your previous projects, and how did you overcome them?"]     
#         print(question_text)
#         return {"question": question_text}


@app.post("/api/interview/analyze-verbal")
async def analyze_verbal_report(request: VerbalReportRequest):
    """Analyze interview answers using Gemini for verbal report generation"""
    
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    if len(request.questions) != len(request.answers):
        raise HTTPException(status_code=400, detail="Questions and answers count mismatch")
    
    try:
        # Prepare the prompt for Gemini
        prompt = f"""
        You are an expert interview evaluator. Analyze the following {request.interview_type} interview for the role of {request.role}.
        
        Please evaluate each question-answer pair and provide a comprehensive analysis in JSON format.
        
        Interview Data:
        {json.dumps([{"question": q, "answer": a} for q, a in zip(request.questions, request.answers)], indent=2)}
        
        Provide analysis in the following JSON structure:
        {{
            "overall_score": <number between 0-100>,
            "summary": "<brief overall assessment>",
            "metrics": {{
                "answer_correctness": {{
                    "score": <0-100>,
                    "description": "<assessment of technical accuracy>",
                    "details": ["<specific feedback per answer>"]
                }},
                "concepts_understanding": {{
                    "score": <0-100>,
                    "description": "<assessment of concept grasp>",
                    "key_concepts": ["<list of demonstrated concepts>"],
                    "missing_concepts": ["<concepts that could be improved>"]
                }},
                "domain_knowledge": {{
                    "score": <0-100>,
                    "description": "<assessment of domain expertise>",
                    "strengths": ["<strong areas>"],
                    "gaps": ["<knowledge gaps>"]
                }},
                "response_structure": {{
                    "score": <0-100>,
                    "description": "<assessment of answer organization>",
                    "logical_flow": "<evaluation of flow>",
                    "completeness": "<evaluation of completeness>"
                }},
                "depth_of_explanation": {{
                    "score": <0-100>,
                    "description": "<assessment of explanation depth>",
                    "examples_used": <boolean>,
                    "technical_depth": "<shallow/moderate/deep>"
                }},
                "vocabulary_richness": {{
                    "score": <0-100>,
                    "description": "<assessment of vocabulary>",
                    "technical_terms_used": ["<list of technical terms>"],
                    "repetitive_words": ["<overused words>"],
                    "vocabulary_level": "<basic/intermediate/advanced>"
                }}
            }},
            "individual_answers": [
                {{
                    "question_number": <number>,
                    "correctness": <0-100>,
                    "strengths": ["<what was good>"],
                    "improvements": ["<what could be better>"],
                    "key_points_covered": ["<main points addressed>"],
                    "missing_points": ["<important points missed>"]
                }}
            ],
            "recommendations": [
                "<specific improvement suggestions>"
            ],
            "interview_readiness": "<not ready/needs improvement/ready/excellent>"
        }}
        
        Be thorough, fair, and constructive in your evaluation. Focus on both strengths and areas for improvement.
        Return ONLY valid JSON, no additional text.
        """
        
        # Generate response from Gemini
        response = gemini_model.generate_content(prompt)
        
        # Parse the JSON response
        try:
            # Clean the response text to extract JSON
            response_text = response.text
            # Find JSON content between curly braces
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                analysis = json.loads(json_str)
            else:
                raise ValueError("No valid JSON found in response")
        except json.JSONDecodeError as e:
            print(f"Failed to parse Gemini response: {response_text}")
            raise HTTPException(status_code=500, detail=f"Failed to parse analysis: {str(e)}")
        
        return analysis
        
    except Exception as e:
        print(f"Error in verbal analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

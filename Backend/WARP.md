# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the SkillEdge backend API - an AI-powered interview preparation platform built with FastAPI, MongoDB, and various ML models. The system provides interview question generation, speech-to-text transcription, and comprehensive verbal/non-verbal analysis of interview responses.

## Development Commands

### Environment Setup
```powershell
# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Deactivate when done
deactivate
```

### Running the Application
```powershell
# Main FastAPI server (default port 8000)
python -m uvicorn app.main:app --reload

# Run on custom port
python -m uvicorn app.main:app --reload --port 8001

# Alternative: Direct execution
python app/main.py

# Run STT server separately (if needed)
python STT/server.py
```

### Code Quality
```powershell
# Format code with black (if installed)
pip install black
black app/

# Lint with flake8 (if installed)
pip install flake8
flake8 app/ --max-line-length=120

# Type checking with mypy (if installed)
pip install mypy
mypy app/
```

### Database Operations
```powershell
# Start MongoDB locally
# Ensure MongoDB is running on localhost:27017

# MongoDB connection string is in .env:
# MONGODB_URL=mongodb://localhost:27017
# DB_NAME=skilledge
```

### Testing
```powershell
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests (when created)
pytest tests/

# Run with coverage
pip install pytest-cov
pytest --cov=app tests/
```

## Architecture & Key Components

### Core Architecture
The application follows a modular FastAPI architecture with clear separation of concerns:

1. **API Layer** (`app/main.py`): Central FastAPI application that orchestrates all components
   - Loads Gemma-2B model with LoRA adapter for question generation
   - Integrates Gemini API for verbal analysis
   - Manages CORS, routing, and database lifecycle

2. **Routers** (`app/routers/`): RESTful API endpoints organized by domain
   - `profile.py`: User profile CRUD operations with MongoDB
   - `reports.py`: Interview report persistence and retrieval

3. **Database Layer** (`app/database.py`): Async MongoDB integration using Motor
   - Connection pooling and lifecycle management
   - Collection accessors for profiles, interview reports, verbal/non-verbal analyses

4. **Models** (`app/models.py`): Pydantic schemas for data validation
   - MongoDB document models with ObjectId handling
   - Request/response DTOs for API contracts

5. **Speech Processing** (`STT/`): Real-time speech transcription capabilities
   - `server.py`: WebRTC VAD + Faster Whisper for efficient STT
   - `audio_analyzer.py`: Audio processing utilities
   - `realtime_enhanced_server.py`: Enhanced real-time transcription

### ML Model Integration

The system integrates multiple AI models:

1. **Question Generation**: Fine-tuned Gemma-2B model with LoRA adapter
   - Base model: `google/gemma-2-1b-it`
   - Adapter: Custom QA generation model
   - Loaded on startup, runs on GPU if available

2. **Verbal Analysis**: Google Gemini API (gemini-2.5-flash)
   - Analyzes interview responses across multiple metrics
   - Returns structured JSON with scores and feedback

3. **Speech Recognition**: Faster Whisper model
   - Model size: small.en
   - Optimized with CTranslate2 for real-time performance
   - WebRTC VAD for speech detection

### API Endpoints

Key endpoints requiring authentication (Bearer token in header):

- `POST /api/interview/generate-question`: Generate interview questions
- `POST /api/interview/analyze-verbal`: Analyze interview responses
- `GET/POST/PUT /api/profile/`: Profile management
- `POST /api/reports/save-interview`: Persist complete interview session
- `GET /api/reports/interview/{id}`: Retrieve interview report

### Environment Configuration

Required environment variables (`.env` file):
- `GEMINI_API_KEY`: Google Gemini API key for verbal analysis
- `MONGODB_URL`: MongoDB connection string
- `DB_NAME`: Database name (default: skilledge)
- `FRONTEND_URL`: Allowed CORS origins
- `PORT`: Server port (default: 8000)
- `HF_TOKEN`: Hugging Face token (for model downloads if needed)

### Database Schema

MongoDB collections:
- `profiles`: User profile information
- `interview_reports`: Interview session data (questions/answers)
- `verbal_reports`: Verbal analysis results with metrics
- `nonverbal_reports`: Non-verbal analysis scores

### Key Dependencies

Critical packages:
- **FastAPI & Uvicorn**: Async web framework
- **Motor**: Async MongoDB driver
- **Transformers & PEFT**: LLM integration
- **Faster-whisper**: Optimized speech recognition
- **Google-generativeai**: Gemini API client
- **PyTorch**: Deep learning runtime (CUDA-enabled)

## Development Workflow

1. **Adding New Endpoints**: Create router in `app/routers/`, add models in `app/models.py`, include router in `main.py`

2. **Database Changes**: Update models in `app/models.py`, modify collection accessors in `app/database.py`

3. **ML Model Updates**: Modify model paths in `main.py`, ensure GPU memory management

4. **Environment Setup**: Always work within venv, keep requirements.txt updated

5. **Error Handling**: Use HTTPException for API errors, implement proper async exception handling

## Performance Considerations

- Models are loaded once at startup to avoid repeated initialization
- MongoDB connection pooling configured for concurrent requests
- GPU memory monitoring implemented for model inference
- Real-time STT uses VAD to minimize unnecessary transcription

## Security Notes

- User authentication expected via Clerk (Bearer token)
- Environment variables for sensitive configuration
- CORS configured for specific frontend origins
- Input validation via Pydantic models
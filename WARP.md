# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SkillEdge AI is a final year project featuring an AI-powered interview simulation platform with real-time speech-to-text capabilities. The system consists of:

1. **Frontend**: Next.js application with React 18+, Clerk authentication, and Supabase integration
2. **Backend**: FastAPI server with machine learning models for question generation
3. **STT Service**: Real-time speech-to-text using Whisper models

## Development Commands

### Frontend (SkillEdge-AI)
```bash
# Navigate to frontend
cd "SkillEdge-AI"

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Database operations
npm run prisma:generate
npm run prisma:migrate
npm run supabase:setup
```

### Backend (Python FastAPI)
```bash
# Navigate to backend
cd Backend

# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI server
python app/main.py
# or
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run STT server (separate terminal)
python STT/server.py
```

### Full System Development Workflow
```bash
# Start all services (run each in separate terminal)
cd "SkillEdge-AI" && npm run dev     # Frontend on :3000
cd Backend && python app/main.py    # API on :8000
cd Backend && python STT/server.py  # WebSocket STT on :8765
```

## Architecture

### Frontend Architecture
- **App Router Structure**: Uses Next.js 15 App Router with nested layouts
- **Authentication**: Clerk for user management with custom onboarding flow
- **Database**: Prisma ORM with PostgreSQL/Supabase backend
- **UI Components**: Radix UI primitives with Tailwind CSS styling
- **State Management**: React hooks with local storage for interview results
- **Real-time Communication**: WebSocket connection to STT service

### Backend Architecture
- **Question Generation**: Fine-tuned LLaMA/Gemma model with LoRA adapters for generating interview questions
- **Model Pipeline**: Hugging Face Transformers with PyTorch for GPU acceleration
- **STT Processing**: Faster-whisper with WebRTC VAD for real-time speech recognition
- **API Layer**: FastAPI with CORS middleware for frontend communication

### Key Integration Points
1. **Authentication Flow**: Clerk → Next.js → Supabase user creation
2. **Interview Flow**: Frontend → FastAPI (questions) → STT WebSocket (answers)
3. **AI Services**: Gemini API for industry insights, local models for question generation

## Development Environment Setup

### Required Services
- Node.js 18+ for frontend development
- Python 3.8+ with CUDA support for ML models
- PostgreSQL database (Supabase recommended)
- WebSocket server for real-time STT

### Environment Variables
Frontend (`.env.local`):
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
GEMINI_API_KEY=
```

Backend:
```bash
FRONTEND_URL=http://localhost:3000
PORT=8000
```

### Model Dependencies
- Base model: `google/gemma-1b-it` (cached locally)
- LoRA adapter: `raees456/QA_Generation_Model22` (fine-tuned for interview questions)
- STT model: `openai/whisper-small.en` (via faster-whisper)

## Testing and Debugging

### Frontend Testing
```bash
# Check Next.js build
npm run build

# Lint check
npm run lint

# Database schema validation
npm run prisma:generate
```

### Backend Testing
```bash
# Test API endpoints
curl -X POST http://localhost:8000/api/interview/generate-question \
  -H "Content-Type: application/json" \
  -d '{"type":"technical","role":"Software Engineer","count":5}'

# Check model loading
python -c "import torch; print('CUDA available:', torch.cuda.is_available())"

# Test STT WebSocket (requires separate client)
# wscat -c ws://localhost:8765
```

### Common Issues
1. **Model Loading**: Ensure CUDA is available and models are cached locally
2. **WebSocket Connection**: STT server must be running before frontend attempts connection
3. **Database Connection**: Verify Supabase credentials and network access
4. **CORS Issues**: Check FRONTEND_URL environment variable in backend

## Key Files and Patterns

### Frontend Patterns
- Server Actions: `/actions/` - Database operations and AI service calls
- UI Components: `/components/ui/` - Reusable Radix UI components
- Interview Logic: `/components/InterviewSimulator/` - Core interview flow
- Schema Validation: `/app/lib/schema.js` - Zod schemas for form validation

### Backend Patterns
- Model Initialization: Models loaded at startup for performance
- Request/Response: Pydantic models for API validation
- Error Handling: FastAPI exception handling with user-friendly messages
- Real-time Processing: WebSocket with audio chunking and VAD

### Database Schema
- User management through Clerk integration
- Industry insights cached with periodic updates
- Interview results stored in localStorage (client-side)

## Performance Considerations

1. **Model Loading**: Base models are cached locally to avoid download delays
2. **Memory Management**: GPU memory monitoring for model inference
3. **Real-time Audio**: Chunked processing with silence detection
4. **Database Queries**: Prisma with optimized includes/selects
5. **Build Optimization**: Next.js with image optimization and code splitting

## Deployment Notes

- Frontend: Vercel deployment with environment variables
- Backend: Requires GPU instance for optimal ML model performance  
- Database: Supabase managed PostgreSQL
- Model Storage: Local cache or cloud storage for model files

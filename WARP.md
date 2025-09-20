# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SkillEdge AI is a full-stack AI-powered platform that helps job seekers with mock interviews, featuring:
- **Frontend**: Next.js 15 application with React 19 and Tailwind CSS
- **Backend**: FastAPI Python server with ML model integration  
- **Speech-to-Text**: Real-time transcription using faster-whisper and WebRTC VAD
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk for user management
- **AI Models**: Custom fine-tuned Gemma model for question generation, Gemini for analysis

## Development Commands

### Frontend (SkillEdge-AI/)
```bash
# Development server
npm run dev

# Build for production 
npm run build

# Production server
npm start

# Lint code
npm run lint

# Database operations
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run supabase:setup     # Setup Supabase connection
```

### Backend (Backend/)
```bash
# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python app/main.py
# Or with uvicorn directly:
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run STT server
python STT/server.py

# Run enhanced STT server 
python STT/realtime_enhanced_server.py
```

### Testing Individual Components
```bash
# Test speech transcription locally
cd Backend/STT && python server.py

# Test specific API endpoints
curl -X POST http://localhost:8000/api/interview/generate-question \
  -H "Content-Type: application/json" \
  -d '{"type":"technical","role":"Software Engineer","count":5}'

# Run single Next.js page for testing
npm run dev -- --port 3001
```

## Architecture

### High-Level System Design
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Next.js App   │    │   FastAPI        │    │   ML Models         │
│   (Frontend)    │◄──►│   (Backend)      │◄──►│   - Custom Gemma    │
│   - Auth (Clerk)│    │   - Interview AI │    │   - Gemini API      │
│   - UI/UX       │    │   - STT Server   │    │   - Faster Whisper  │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   PostgreSQL    │    │   File Storage   │
│   (via Prisma)  │    │   - Audio Files  │
│   - User Data   │    │   - Model Cache  │
│   - Interview   │    │   - Transcripts  │
│   - Results     │    │                  │
└─────────────────┘    └──────────────────┘
```

### Frontend Architecture (SkillEdge-AI/)
- **App Router**: Uses Next.js 15 app directory structure
- **Authentication Flow**: Clerk middleware protects routes, redirects unauthenticated users
- **Profile Management**: Profile completion check in middleware before accessing protected routes
- **State Management**: React hooks with local state, no external state library
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Database Layer**: Prisma client for type-safe database operations

### Backend Architecture (Backend/)
- **FastAPI Application** (`app/main.py`): Main API server
  - CORS configured for frontend communication
  - Environment-based configuration
  - Custom fine-tuned Gemma model for question generation
  - Gemini integration for interview analysis
- **Speech Processing** (`STT/`):
  - `server.py`: Basic real-time transcription
  - `realtime_enhanced_server.py`: Advanced STT with WebRTC VAD
  - `whisper.py`: Optimized Whisper model wrapper
  - `audio_analyzer.py`: Audio quality analysis

### Database Schema (Prisma)
- **User Model**: Core user data with Clerk integration
- **Profile Model**: Extended user profile synced with Supabase
- **Assessment Model**: Interview question/answer storage with scoring
- **Resume/CoverLetter Models**: Document generation and ATS scoring
- **IndustryInsight Model**: Market data and salary insights
- **Feedback Model**: User feedback collection

### Model Integration
- **Custom Gemma Model**: Fine-tuned on QA_dataset.json for technical interview questions
  - Uses PEFT (LoRA) adapters for efficient fine-tuning
  - Cached locally in Windows user directory
  - GPU acceleration with float16 precision
- **Gemini API**: Structured interview analysis with JSON output parsing
- **Faster-Whisper**: Real-time speech-to-text with WebRTC VAD for speech detection

## Environment Configuration

### Required Environment Variables
**Frontend (.env.local)**:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication
- `CLERK_SECRET_KEY`: Clerk server-side secret

**Backend (.env)**:
- `GEMINI_API_KEY`: Google Gemini API key
- `FRONTEND_URL`: Allowed CORS origins (comma-separated)
- `PORT`: Server port (default: 8000)

## Development Workflow

### Setting Up New Development Environment
1. Clone repository and navigate to project root
2. **Frontend Setup**:
   ```bash
   cd SkillEdge-AI
   npm install
   cp .env.sample .env.local  # Configure environment variables
   npm run prisma:generate
   ```
3. **Backend Setup**:
   ```bash
   cd Backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```
4. **Model Setup**: Ensure Hugging Face models are cached locally (paths in `main.py`)

### Common Development Tasks
- **Database Changes**: Update `prisma/schema.prisma`, run `npm run prisma:migrate`
- **API Development**: Add endpoints in `Backend/app/main.py`, test with FastAPI docs at `/docs`
- **Component Development**: Use existing shadcn/ui patterns, follow Tailwind conventions
- **Speech Feature Development**: Test with `Backend/STT/server.py` first, then integrate

### Production Deployment Notes
- Frontend deployable to Vercel (configuration in `vercel.json`)
- Backend requires GPU instance for optimal model performance
- Database migrations run automatically via Prisma
- Model files must be available in production environment

## AI Model Specifications

### Custom Question Generation Model
- **Base**: `google/gemma-3-1b-it`
- **Adapter**: Custom LoRA fine-tuned on interview QA dataset
- **Input Format**: Structured prompts with role, type, and count specifications
- **Output**: Numbered questions in specific template format

### Speech Recognition Pipeline
- **VAD**: WebRTC Voice Activity Detection (aggressiveness level 2)
- **Model**: `faster-whisper` small.en model with int8 quantization
- **Processing**: Real-time audio chunking with silence detection
- **Output**: Timestamped transcriptions with speech rate analysis

This architecture enables real-time AI-powered mock interviews with comprehensive analysis and feedback generation.
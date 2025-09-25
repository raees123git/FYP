# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository overview
- This is a two-service project:
  - Backend (Python/FastAPI) in Backend/
  - Frontend (Next.js + Prisma/Postgres + Clerk) in SkillEdge-AI/
  - A separate real-time Speech-to-Text utility in Backend/STT/

Common commands
Frontend (SkillEdge-AI)
- Install dependencies
  - npm ci
- Development server (Next.js)
  - npm run dev
- Build
  - npm run build
- Start production server
  - npm start
- Lint
  - npm run lint
- Prisma (DB client and migrations)
  - Generate client: npm run prisma:generate
  - Dev migration: npm run prisma:migrate

Backend API (Backend)
- Create and activate virtual environment (PowerShell on Windows)
  - python -m venv Backend/venv
  - Backend/venv/Scripts/Activate.ps1
- Install dependencies
  - pip install -r Backend/requirements.txt
- Run FastAPI app (option 1: via Python entrypoint)
  - python Backend/app/main.py
- Run FastAPI app (option 2: via Uvicorn, from Backend directory)
  - uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
- Real-time Speech-to-Text utility
  - python Backend/STT/server.py

Notes on tests
- No dedicated test scripts or configs detected for either service.

Environment configuration
Frontend (SkillEdge-AI)
- Uses .env.local (see .env.sample for keys)
- Typical variables (names only; provide values locally):
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - CLERK_SECRET_KEY
  - NEXT_PUBLIC_CLERK_SIGN_IN_URL
  - NEXT_PUBLIC_CLERK_SIGN_UP_URL
  - NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
  - NEXT_PUBLIC_CLERK_BEFORE_SIGN_UP_URL
  - DATABASE_URL (PostgreSQL)
  - DIRECT_URL (PostgreSQL direct connection)
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - GEMINI_API_KEY (if the frontend calls Gemini-backed routes)

Backend (FastAPI)
- Uses environment variables loaded via python-dotenv
- Typical variables (names only; provide values locally):
  - MONGODB_URL (e.g., mongodb://localhost:27017)
  - DB_NAME (e.g., skilledge)
  - FRONTEND_URL (CORS allowlist, default http://localhost:3000)
  - GEMINI_API_KEY (for Google Generative AI usage)
  - PORT (optional; main.py defaults to 8000)

High-level architecture and flow
Frontend (SkillEdge-AI)
- Next.js (App Router) application
- Authentication/identity with Clerk (see usage of NEXT_PUBLIC_CLERK_* and CLERK_SECRET_KEY)
- Database via Prisma schema at SkillEdge-AI/prisma/schema.prisma targeting PostgreSQL
  - Models include User, Profile (mapped to profiles), Assessment, Resume, CoverLetter, IndustryInsight, Feedback
  - Run prisma generate/migrate when schema changes
- Linting configured via eslint.config.mjs extending next/core-web-vitals

Backend (FastAPI)
- Application entrypoint: Backend/app/main.py
  - Sets up CORS using FRONTEND_URL (comma-separated origins supported)
  - Includes two routers: app/routers/profile.py and app/routers/reports.py
  - Connects to MongoDB on startup via app/database.py using Motor (AsyncIOMotorClient)
  - GridFS used for resume file storage via app/file_handler.py
  - Pydantic models defined in app/models.py for Profiles and Reports
  - Provides endpoints for:
    - Profile CRUD and resume upload/download (Bearer {user_id} header expected)
    - Saving interview metadata and optional non-verbal analytics
    - Generating interview questions (currently a stub returning one example question)
    - Verbal analysis using Google Gemini (returns structured JSON)
  - main.py also initializes a local Hugging Face model+adapter for question generation
    - Paths ADAPTER_LOCAL_PATH and BASE_LOCAL_PATH are hard-coded to local cache directories; ensure these exist or adjust before running

Speech-to-Text utility (Backend/STT)
- Standalone real-time transcription tool using faster-whisper, webrtcvad, and sounddevice
- Entry script: Backend/STT/server.py
  - Captures microphone input, performs VAD, transcribes with WhisperModel, and prints time-coded transcripts
  - Designed for CUDA by default (device='cuda'); adjust compute_type/device for CPU-only systems

Service interaction contracts
- Authorization header format expected by backend routers: "Bearer {user_id}"
  - The FastAPI endpoints extract user_id directly from the Authorization header
- CORS is configured via FRONTEND_URL; default allows http://localhost:3000
- File storage for resumes is handled through MongoDB GridFS (bucket name: resumes)

CI/CD and automation
- No CI configs detected in .github/workflows

Quick start (local, Windows PowerShell)
1) Backend
- python -m venv Backend/venv
- Backend/venv/Scripts/Activate.ps1
- pip install -r Backend/requirements.txt
- Set MONGODB_URL and GEMINI_API_KEY in Backend/.env (or system env)
- Ensure model paths in Backend/app/main.py are valid for your machine
- python Backend/app/main.py

2) Frontend
- cd SkillEdge-AI
- npm ci
- Copy .env.sample to .env.local and fill values (Clerk, Postgres URLs, Supabase, etc.)
- npm run prisma:generate
- npm run dev

Conventions and gotchas
- Backend startup will attempt to load local Hugging Face models via paths defined in main.py; adjust these paths or change the loading strategy as needed for your environment
- Backend endpoints assume Authorization: Bearer {user_id} rather than validating a full JWT; align with Clerk integration if moving to production
- Prisma migrations require a valid DATABASE_URL; ensure Postgres is reachable before running prisma:migrate

# SkillEdge-AI Chatbot Installation Guide

## Backend Dependencies

Install the new Python packages:

```bash
cd Backend
pip install -r requirements.txt
```

The following new packages were added:
- `faiss-cpu>=1.7.4` - Vector similarity search
- `sentence-transformers>=2.2.2` - Text embeddings
- `langchain>=0.1.0` - LLM utilities
- `langchain-community>=0.0.13` - Additional LLM tools

## Frontend Dependencies

Install the new React package:

```bash
cd SkillEdge-AI
npm install @radix-ui/react-scroll-area
```

## Environment Variables

Make sure you have the following environment variables set:

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URL=your_mongodb_connection_string
DB_NAME=skilledge
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

## Starting the Application

1. Start the backend:
```bash
cd Backend
uvicorn app.main:app --reload --port 8000
```

2. Start the frontend:
```bash
cd SkillEdge-AI
npm run dev
```

## Features

### Chatbot Widget
- Floating chat button on all pages
- Two modes: General Q&A and Report Analysis
- Real-time messaging with typing indicators
- Conversation history management
- Export conversations

### Chatbot Page
- Full-screen chat interface at `/chatbot`
- Enhanced UI with sidebar navigation
- Suggested questions
- Conversation management

### Backend API
- RAG-based question answering using FAISS
- Personalized report analysis
- Conversation persistence
- User authentication integration

## Usage

1. **General Questions**: Ask about SkillEdge-AI features, how to use the platform, etc.
2. **Report Analysis**: Toggle "Report Analysis" mode to get personalized insights about your interview performance

The chatbot will automatically use your latest interview reports when in analysis mode.
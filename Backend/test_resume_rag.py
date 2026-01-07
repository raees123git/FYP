"""
Test script for Resume RAG feature
Run this to verify the resume chatbot functionality
"""

import asyncio
from app.chatbot.resume_rag import get_resume_rag_service, ResumeRAGService

async def test_resume_rag():
    print("=" * 60)
    print("Testing Resume RAG Service")
    print("=" * 60)
    
    # Initialize service
    print("\n1. Initializing Resume RAG Service...")
    try:
        resume_rag = get_resume_rag_service()
        print("✓ Service initialized successfully")
        print(f"   - Embedding model loaded: all-MiniLM-L6-v2")
        print(f"   - Vector dimension: {resume_rag.vector_dimension}")
    except Exception as e:
        print(f"✗ Failed to initialize: {e}")
        return
    
    # Test chunking
    print("\n2. Testing text chunking...")
    test_text = """
    John Doe
    Software Engineer with 5 years of experience in full-stack development.
    
    Skills:
    - Python, JavaScript, TypeScript
    - React, Node.js, Django
    - MongoDB, PostgreSQL, Redis
    - AWS, Docker, Kubernetes
    
    Experience:
    Senior Software Engineer at Tech Corp (2021-2024)
    - Led development of microservices architecture
    - Improved system performance by 40%
    - Mentored junior developers
    
    Software Developer at StartupXYZ (2019-2021)
    - Built REST APIs using Django
    - Implemented CI/CD pipelines
    - Collaborated with cross-functional teams
    """
    
    chunks = resume_rag._chunk_text(test_text, chunk_size=200, overlap=50)
    print(f"✓ Text chunked into {len(chunks)} segments")
    for i, chunk in enumerate(chunks[:3]):  # Show first 3 chunks
        print(f"   Chunk {i+1}: {chunk[:100]}...")
    
    # Test index path generation
    print("\n3. Testing index path generation...")
    test_user_id = "test_user_123"
    index_path = resume_rag._get_user_index_path(test_user_id)
    kb_path = resume_rag._get_user_kb_path(test_user_id)
    print(f"✓ Index path: {index_path}")
    print(f"✓ Knowledge base path: {kb_path}")
    
    # Test has_resume_index
    print("\n4. Testing index existence check...")
    has_index = resume_rag.has_resume_index(test_user_id)
    print(f"✓ Has index for test_user_123: {has_index}")
    
    print("\n" + "=" * 60)
    print("Basic tests completed successfully!")
    print("=" * 60)
    
    print("\n📝 Next steps to test with actual resume:")
    print("1. Upload a resume PDF through the /profile/resume/upload endpoint")
    print("2. Check indexing status with /chatbot/resume/status")
    print("3. Test chatbot with include_resume=true in /chatbot/chat")
    print("4. Ask questions like:")
    print("   - 'What are my technical skills?'")
    print("   - 'Summarize my work experience'")
    print("   - 'What programming languages do I know?'")

if __name__ == "__main__":
    print("\n🚀 Starting Resume RAG Tests...\n")
    asyncio.run(test_resume_rag())

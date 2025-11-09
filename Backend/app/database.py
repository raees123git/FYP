# SkillEdge-API/app/database.py
"""
MongoDB database configuration and connection management
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database = None

# MongoDB instance
mongodb = MongoDB()

async def connect_to_mongo():
    """Create database connection pool"""
    # Get MongoDB URL from environment or use local default
    MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "skilledge")
    
    try:
        # Create motor client for async operations
        mongodb.client = AsyncIOMotorClient(
            MONGO_URL,
            maxPoolSize=10,
            minPoolSize=1
        )
        
        # Test the connection
        await mongodb.client.admin.command('ping')
        
        # Select database
        mongodb.database = mongodb.client[DB_NAME]
        
        print(f"✅ Connected to MongoDB at {MONGO_URL}")
        print(f"📊 Using database: {DB_NAME}")
        
    except Exception as e:
        print(f"❌ Could not connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Close database connection"""
    if mongodb.client:
        mongodb.client.close()
        print("🔌 Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    if mongodb.database is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo first.")
    return mongodb.database

# Collection helpers
def get_collection(collection_name: str):
    """Get a specific collection"""
    db = get_database()
    return db[collection_name]

# Collections
def get_users_collection():
    """Get users collection for authentication"""
    return get_collection("users")

def get_profiles_collection():
    """Get profiles collection"""
    return get_collection("profiles")

def get_interview_reports_collection():
    """Get interview reports collection"""
    return get_collection("interview_reports")

def get_verbal_reports_collection():
    """Get verbal reports collection"""
    return get_collection("verbal_reports")

def get_nonverbal_reports_collection():
    """Get non-verbal reports collection"""
    return get_collection("nonverbal_reports")

def get_overall_reports_collection():
    """Get overall reports collection"""
    return get_collection("overall_reports")

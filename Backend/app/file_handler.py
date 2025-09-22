# SkillEdge-API/app/file_handler.py
"""
GridFS file handler for storing resumes in MongoDB
"""

from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from bson.objectid import ObjectId
import hashlib
from typing import Optional, BinaryIO
from datetime import datetime
import io

from app.database import get_database

class FileHandler:
    """Handle file operations with MongoDB GridFS"""
    
    @staticmethod
    def get_gridfs_bucket():
        """Get GridFS bucket for file storage"""
        db = get_database()
        return AsyncIOMotorGridFSBucket(db, bucket_name="resumes")
    
    @staticmethod
    async def upload_resume(file_content: bytes, filename: str, user_id: str) -> dict:
        """
        Upload resume to GridFS
        
        Args:
            file_content: File content in bytes
            filename: Original filename
            user_id: User ID who owns the file
            
        Returns:
            dict with file_id and metadata
        """
        try:
            fs = FileHandler.get_gridfs_bucket()
            
            # Create file metadata
            metadata = {
                "user_id": user_id,
                "original_filename": filename,
                "upload_date": datetime.utcnow(),
                "file_type": "resume"
            }
            
            # Generate unique filename with user_id prefix
            unique_filename = f"{user_id}_{datetime.utcnow().timestamp()}_{filename}"
            
            # Upload file to GridFS
            file_id = await fs.upload_from_stream(
                unique_filename,
                file_content,
                metadata=metadata
            )
            
            return {
                "success": True,
                "file_id": str(file_id),
                "filename": unique_filename,
                "original_filename": filename,
                "size": len(file_content)
            }
            
        except Exception as e:
            print(f"Error uploading file: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def download_resume(file_id: str) -> Optional[dict]:
        """
        Download resume from GridFS
        
        Args:
            file_id: GridFS file ID
            
        Returns:
            dict with file content and metadata
        """
        try:
            fs = FileHandler.get_gridfs_bucket()
            
            # Convert string to ObjectId
            object_id = ObjectId(file_id)
            
            # Open download stream
            download_stream = await fs.open_download_stream(object_id)
            
            # Read file content
            content = await download_stream.read()
            
            # Get metadata
            metadata = download_stream.metadata or {}
            
            return {
                "success": True,
                "content": content,
                "filename": download_stream.filename,
                "metadata": metadata,
                "upload_date": download_stream.upload_date
            }
            
        except Exception as e:
            print(f"Error downloading file: {str(e)}")
            return None
    
    @staticmethod
    async def delete_resume(file_id: str) -> bool:
        """
        Delete resume from GridFS
        
        Args:
            file_id: GridFS file ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            fs = FileHandler.get_gridfs_bucket()
            
            # Convert string to ObjectId
            object_id = ObjectId(file_id)
            
            # Delete file
            await fs.delete(object_id)
            
            return True
            
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
            return False
    
    @staticmethod
    async def get_user_resumes(user_id: str) -> list:
        """
        Get all resumes for a specific user
        
        Args:
            user_id: User ID
            
        Returns:
            List of resume metadata
        """
        try:
            fs = FileHandler.get_gridfs_bucket()
            
            # Find all files for this user
            cursor = fs.find({"metadata.user_id": user_id})
            
            resumes = []
            async for file_doc in cursor:
                resumes.append({
                    "file_id": str(file_doc._id),
                    "filename": file_doc.filename,
                    "upload_date": file_doc.upload_date.isoformat() if file_doc.upload_date else None,
                    "size": file_doc.length,
                    "metadata": file_doc.metadata
                })
            
            return resumes
            
        except Exception as e:
            print(f"Error getting user resumes: {str(e)}")
            return []
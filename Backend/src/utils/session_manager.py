from uuid import uuid4
from sqlalchemy.orm import Session
from ..models.chat_models import ChatSession
from src.database.db import SessionLocal

def create_chat_session(model: str) -> dict:
    """Create a new chat session."""
    if not model or not model.strip():
        return {"success": False, "error": "Model name is required"}
    
    db: Session = SessionLocal()
    try:
        session_id = str(uuid4())
        new_session = ChatSession(
            id=session_id,
            model=model.strip(),
            title=f"New Chat"
            # Let defaults handle created_at and modified_at
        )
        
        db.add(new_session)
        db.commit()
        
        return {
            "success": True,
            "session_id": session_id,
            "message": "Session created successfully",
            "title":"New Chat"
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error creating session: {e}")
        return {"success": False, "error": f"Failed to create session: {str(e)}"}
    
    finally:
        db.close()

def delete_chat_session(db: Session, id: str):
    try:
        record = db.query(ChatSession).filter(ChatSession.id == id).first()
        if not record:
            return f"No session found with id: {id}"
        
        db.delete(record)
        db.commit()
        return "Session successfully deleted!"
    except Exception as e:
        db.rollback()
        return f"Error deleting session: {e}"
    finally:
        db.close()

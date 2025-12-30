from sqlalchemy.orm import Session
from ..models.chat_models import ChatSession, ChatConversations
from uuid import uuid4
from datetime import datetime,timezone
from src.database.db import SessionLocal

def generate_uuid(db: Session):
    new_id = str(uuid4())
    db.add(ChatSession(id=new_id))
    db.commit()
    return new_id

def edit_title(db: Session, session_id: str, new_title: str):
    chat = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if chat:
        chat.title = new_title
        chat.modified_at = datetime.now(timezone.utc)
        db.commit()

def save_conversation(session_id: str, user_message: str, assistant_message: str):
    db: Session = SessionLocal()
    try:
        current = datetime.now(timezone.utc)        # Create user message
        conversation = ChatConversations(
            id=str(uuid4()),
            session_id=session_id,
            user_message=user_message,
            assistant_response=assistant_message
        )
        db.add(conversation)
        db.commit()
        print("Conversation saved successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error saving conversation: {e}")
    finally:
        db.close()

def get_chat_history(session_id: str):
    db: Session = SessionLocal()
    try:
        conversations = db.query(ChatConversations).filter(
            ChatConversations.session_id == session_id
        ).order_by(ChatConversations.created_at).all()
        return conversations
    except Exception as e:
        print(f"Error retrieving conversations: {e}")
        return []
    finally:
        db.close()

def edit_conversation(
    message_id: str, new_user_msg: str = None, new_assistant_msg: str = None):
    # Input validation
    if not message_id or not message_id.strip():
        return {"success": False, "error": "Invalid message ID"}
    
    if new_user_msg is None and new_assistant_msg is None:
        return {"success": False, "error": "At least one field must be provided for update"}

    db: Session = SessionLocal()
    try:
        conversation = db.query(ChatConversations).filter(
            ChatConversations.id == message_id.strip()
        ).first()
        
        if not conversation:
            return {"success": False, "error": "Conversation not found"}

        # Track what was updated
        updates = []
        
        if new_user_msg is not None:
            old_msg = conversation.user_message
            conversation.user_message = new_user_msg
            updates.append(f"user_message: '{old_msg[:30]}...' -> '{new_user_msg[:30]}...'")
            
        if new_assistant_msg is not None:
            old_msg = conversation.assistant_response or ""
            conversation.assistant_response = new_assistant_msg
            updates.append(f"assistant_response: '{old_msg[:30]}...' -> '{new_assistant_msg[:30]}...'")

        # Update timestamps
        conversation.modified_at = datetime.now(timezone.utc)
        if conversation.session:
            conversation.session.modified_at = datetime.now(timezone.utc)

        db.commit()
        
        print(f"Updated conversation {message_id}: {'; '.join(updates)}")
        
        return {
            "success": True,
            "message": "Conversation updated successfully",
            "conversation_id": message_id,
            "updates": len(updates)
        }

    except Exception as e:
        db.rollback()
        print(f"Error updating conversation {message_id}: {e}")
        return {"success": False, "error": f"Database error: {str(e)}"}
    
    finally:
        db.close()




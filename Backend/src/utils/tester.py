from sqlalchemy.orm import Session
from ..models.chat_models import ChatConversations  # Replace ChatSession with ChatMessage
from ..database.db import SessionLocal  # Your DB session setup

def print_chat_messages():
    db: Session = SessionLocal()
    try:
        messages = db.query(ChatConversations).all()
        for message in messages:
            print(f"ID: {message.id}, Session ID: {message.session_id}, user_msg: {message.user_message}")
            print(f"Agent_msg: {message.assistant_response}")
            print("-" * 40)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print_chat_messages()

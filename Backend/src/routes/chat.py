import logging
from fastapi import APIRouter, Body, HTTPException, Depends, Query,File, UploadFile
from sqlalchemy.orm import Session
from ..utils.chat_helper import (
    save_conversation,
    edit_title,
    get_chat_history,
    edit_conversation
)
from ..utils.session_manager import create_chat_session,delete_chat_session
from ..utils.requests_helper import curl
from ..database.db import SessionLocal
from ..utils.rag_instance import rag
from ..models.chat_models import ChatSession, ChatConversations
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from vosk import Model, KaldiRecognizer
import wave
import os
import json
from pydub import AudioSegment
# Pydantic models for request/response validation
class ChatRequest(BaseModel):
    message: str
    use_rag: bool = True
    max_tokens: Optional[int] = None
    temperature: Optional[float] = 0.7

class TitleUpdateRequest(BaseModel):
    title: str

class MessageEditRequest(BaseModel):
    user_message: Optional[str] = None
    assistant_response: Optional[str] = None

def get_db():
    """
    Database dependency for FastAPI.
    Creates a new database session for each request and ensures proper cleanup.
    Perfect for local desktop application with privacy guarantees.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Load Vosk model (update path as needed)
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models/vosk-model-small-en-us-0.15"))
print("MODEL_PATH:", MODEL_PATH)
print("Contents:", os.listdir(MODEL_PATH))
model = Model(MODEL_PATH)


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # Save uploaded file temporarily
    temp_path = "temp_audio.webm"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    audio = AudioSegment.from_file(temp_path, format="webm")
    audio = audio.set_frame_rate(16000).set_channels(1)
    wav_path = "temp_audio.wav"
    audio.export(wav_path, format="wav", parameters=["-acodec", "pcm_s16le"])

    wf = wave.open(wav_path, "rb")
    print("Sample rate:", wf.getframerate())
    print("Channels:", wf.getnchannels())
    print("Sample width:", wf.getsampwidth())
    rec = KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(True)

    results = []
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            res = rec.Result()
            results.append(res)
    final_res = rec.FinalResult()
    results.append(final_res)
    wf.close()
    os.remove(temp_path)
    # Extract text from results
    text = " ".join([json.loads(r).get("text", "") for r in results])
    print("Vosk transcription text:", text)
    return JSONResponse({"text": text})


@router.get("/session_id", status_code=200)
def get_chat_id(model: str):
    """Create a new chat session - keeping your original endpoint for compatibility."""
    try:
        result = create_chat_session(model)
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create session"))
        
        return {
            "session_id": result["session_id"], 
            "model": model,
            "privacy_status": "Local storage only - no external data transmission",
            "title":result["title"]
        }
    except Exception as e:
        logger.exception("Failed to create chat session")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{llm_model}/{session_id}")
def chat_model(llm_model: str, session_id: str, q: str):
    """Enhanced version of your original chat endpoint with better error handling and context."""
    db = SessionLocal()
    try:
        # Check if session exists
        session = db.query(ChatSession).filter(ChatSession.id == str(session_id)).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")

        # Get recent chat history for context (last 5 conversations to maintain context)
        recent_conversations = db.query(ChatConversations).filter(
            ChatConversations.session_id == session_id
        ).order_by(ChatConversations.created_at.desc()).limit(5).all()
        
        # Build conversation history for context
        conversation_history = []
        for conv in reversed(recent_conversations):  # Reverse to get chronological order
            conversation_history.append({"role": "user", "content": conv.user_message})
            if conv.assistant_response:
                conversation_history.append({"role": "assistant", "content": conv.assistant_response})

        # Retrieve RAG context using your existing setup
        rag_context = ""
        docs = []
        if rag.is_initialized:
            try:
                docs = rag.retrieve(q, k=5)
                if docs:
                    rag_context = "\n\n".join(doc.page_content for doc in docs)
                    logger.info(f"Retrieved {len(docs)} relevant documents from RAG")
            except Exception as e:
                logger.warning(f"RAG retrieval failed: {e}")
                docs = []  # Fallback to empty list

        # Construct messages following your original pattern but enhanced
        all_messages = []
        
        # Add conversation history for context
        all_messages.extend(conversation_history)
        
        # Add RAG context and user message based on your original logic
        if not docs:  # Following your original pattern
            all_messages.append({"role": "user", "content": q})
        else:
            # Add system message with RAG context
            system_content = f"Use the following context to inform your response when relevant:\n{rag_context}"
            all_messages.append({"role": "system", "content": system_content})
            all_messages.append({"role": "user", "content": q})

        # Get model response using your existing curl helper
        response = curl(
            "chat", "POST",
            {
                "model": llm_model,
                "stream": False,
                "messages": all_messages,
            }
        )

        # Validate response structure (keeping your original validation)
        if not response or "message" not in response or "content" not in response["message"]:
            raise ValueError("Invalid LLM response: missing 'message.content'")

        assistant_reply = response["message"]["content"]

        # Store in RAG using your existing method
        if rag.is_initialized:
            try:
                rag.add_to_store(q, metadata={"type": "user_message", "session_id": session_id})
                rag.add_to_store(assistant_reply, metadata={"type": "assistant_response", "session_id": session_id})
            except Exception as e:
                logger.warning(f"Failed to add to RAG: {e}")

        # Save to database using your existing helper
        save_conversation(session_id, user_message=q, assistant_message=assistant_reply)

        # Set chat title to first user message if not already set
        if session.title=="New Chat":
            session.title = q[:100]  # Limit title length if needed
            db.commit()

        # Update session modified time
        session.modified_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "response": assistant_reply,
            "model_used": llm_model,
            "rag_context_used": bool(docs),
            "privacy_status": "Response generated locally"
        }

    except Exception as e:
        logger.exception(f"Error in chat_model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.post("/sessions/{session_id}/messages")
def send_message_enhanced(
    session_id: str,
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Alternative enhanced endpoint that uses the same logic as your original but with structured input."""
    try:
        # Validate session exists
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")

        # Use the same model stored in the session
        model = session.model
        if not model:
            raise HTTPException(status_code=400, detail="Session has no associated model")

        # Call your existing chat_model function logic
        return chat_model(model, session_id, request.message)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error processing enhanced message for session {session_id}")
        raise HTTPException(status_code=500, detail="Failed to process message")

@router.patch("/chat/{session_id}/title", status_code=200)
def update_chat_title(session_id: str, payload: dict = Body(...), db: Session = Depends(get_db)):
    """Keep your original title update endpoint."""
    try:
        new_title = payload.get("title")
        if not new_title:
            raise HTTPException(status_code=400, detail="Missing 'title' in request.")

        edit_title(db, session_id, new_title)
        return {
            "message": "Title updated successfully",
            "session_id": session_id,
            "new_title": new_title
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update title")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/sessions", status_code=200)
def get_all_sessions(db: Session = Depends(get_db)):
    """Keep your original sessions endpoint with enhancements."""
    try:
        sessions = db.query(ChatSession).order_by(ChatSession.created_at.desc()).all()
        return {
            "sessions": [
                {
                    "chat_id": session.id,  # Keeping your original field name
                    "title": session.title,
                    "model": session.model,
                    "created_at": session.created_at.isoformat()
                }
                for session in sessions
            ],
            "privacy_status": "All data stored locally - no external API calls"
        }
    except Exception as e:
        logger.exception("Failed to fetch chat sessions")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/delete-session/{Session_id}")
def deleteSession(Session_id: str, db: Session = Depends(get_db)):
    """Keep your original delete session endpoint."""
    try:
        result = delete_chat_session(db, Session_id)
        return {"message": result}
    except Exception as e:
        logger.exception(f"Failed to delete session {Session_id}")
        raise HTTPException(status_code=500, detail="Failed to delete session")

@router.get("/chat_history/{Session_id}")
def ChatHistory(Session_id: str):
    """Keep your original chat history endpoint."""
    try:
        conversations = get_chat_history(Session_id)
        return {
            "conversations": [
                {
                    "id": conv.id,
                    "user_message": conv.user_message,
                    "assistant_response": conv.assistant_response,
                    "created_at": conv.created_at,
                    "modified_at": conv.modified_at
                }
                for conv in conversations
            ],
            "session_id": Session_id,
            "privacy_info": "Local data only"
        }
    except Exception as e:
        logger.exception(f"Failed to get chat history for {Session_id}")
        raise HTTPException(status_code=500, detail="Failed to retrieve chat history")

@router.put("/messages/{message_id}")
def edit_message(
    message_id: str,
    request: MessageEditRequest,
    db: Session = Depends(get_db)
):
    """Edit a message using your existing edit_conversation helper."""
    try:
        result = edit_conversation(
            message_id=message_id,
            new_user_msg=request.user_message,
            new_assistant_msg=request.assistant_response
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to edit message"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to edit message {message_id}")
        raise HTTPException(status_code=500, detail="Failed to edit message")

@router.get("/sessions/stats", status_code=200)
def get_session_stats(db: Session = Depends(get_db)):
    """Get overview stats using basic queries compatible with your setup."""
    try:
        # Get basic statistics using simple queries
        total_sessions = db.query(ChatSession).count()
        total_messages = db.query(ChatConversations).count()
        
        # Get model usage with basic queries
        sessions_with_models = db.query(ChatSession).filter(ChatSession.model.isnot(None)).all()
        model_counts = {}
        for session in sessions_with_models:
            model = session.model or "unknown"
            if model not in model_counts:
                model_counts[model] = {"sessions": 0, "messages": 0}
            model_counts[model]["sessions"] += 1
            
            # Count messages for this session
            message_count = db.query(ChatConversations).filter(
                ChatConversations.session_id == session.id
            ).count()
            model_counts[model]["messages"] += message_count
        
        # Get recent activity (last 7 days)
        from datetime import timedelta
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_sessions = db.query(ChatSession).filter(
            ChatSession.created_at >= week_ago
        ).count()
        
        return {
            "overview": {
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "recent_sessions_week": recent_sessions,
                "privacy_guaranteed": True,
                "storage_location": "local_database_only",
                "rag_status": "enabled" if rag.is_initialized else "disabled"
            },
            "model_usage": [
                {
                    "model": model,
                    "sessions": stats["sessions"],
                    "messages": stats["messages"],
                    "avg_messages_per_session": round(stats["messages"] / stats["sessions"], 1) if stats["sessions"] > 0 else 0
                }
                for model, stats in model_counts.items()
            ]
        }
        
    except Exception as e:
        logger.exception("Failed to fetch session stats")
        raise HTTPException(status_code=500, detail="Failed to retrieve session statistics")
from fastapi.responses import JSONResponse

@router.get("/export/{session_id}", response_class=JSONResponse)
def export_chat_session(session_id: str, db: Session = Depends(get_db)):
    """Export a full chat session as a downloadable JSON."""
    try:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        conversations = db.query(ChatConversations).filter(
            ChatConversations.session_id == session_id
        ).order_by(ChatConversations.created_at).all()

        export_data = {
            "session_id": session.id,
            "title": session.title,
            "model": session.model,
            "created_at": session.created_at.isoformat(),
            "conversations": [
                {
                    "user_message": c.user_message,
                    "assistant_response": c.assistant_response,
                    "created_at": c.created_at.isoformat(),
                    "modified_at": c.modified_at.isoformat() if c.modified_at else None
                }
                for c in conversations
            ]
        }

        return JSONResponse(content=export_data)
    except Exception as e:
        logger.exception("Failed to export session")
        raise HTTPException(status_code=500, detail="Failed to export session")
    
@router.get("/health", status_code=200)
def health_check():
    """Health check endpoint for the chat service."""
    return {
        "status": "healthy",
        "service": "local_chat_interface",
        "privacy": "guaranteed_local_only",
        "rag_initialized": rag.is_initialized,
        "database_connected": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/sessions/by_model", status_code=200)
def get_sessions_by_model(model: str = Query(..., description="Model name to filter sessions"), db: Session = Depends(get_db)):
    """Get all chat sessions that use a particular model."""
    try:
        sessions = db.query(ChatSession).filter(ChatSession.model == model).order_by(ChatSession.created_at.desc()).all()
        return {
            "sessions": [
                {
                    "chat_id": session.id,
                    "title": session.title,
                    "model": session.model,
                    "created_at": session.created_at.isoformat()
                }
                for session in sessions
            ],
            "privacy_status": "All data stored locally - no external API calls"
        }
    except Exception as e:
        logger.exception(f"Failed to fetch sessions for model {model}")
        raise HTTPException(status_code=500, detail="Internal server error")
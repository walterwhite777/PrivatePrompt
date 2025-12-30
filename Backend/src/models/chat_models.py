from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from uuid import uuid4
from ..database.db import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    title = Column(String, default="New Chat")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    modified_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    convs = relationship("ChatConversations", back_populates="session", cascade="all, delete")
    model = Column(String, nullable=True)


class ChatConversations(Base):
    __tablename__ = "chat_convs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)

    user_message = Column(Text, nullable=False)
    assistant_response = Column(Text, nullable=True)  # Can start as null, fill in after response is generated

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    modified_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    session = relationship("ChatSession", back_populates="convs")

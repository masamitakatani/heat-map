"""
User model - Anonymous user management
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class User(Base):
    """User model for anonymous user tracking"""

    __tablename__ = "users"

    # Primary key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Anonymous identifier (browser-specific UUID)
    anonymous_id: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )

    # Connected One user ID (optional)
    connected_one_user_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )

    # Visit tracking
    first_visit_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    last_visit_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    total_sessions: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    sessions: Mapped[list["Session"]] = relationship(
        "Session", back_populates="user", cascade="all, delete-orphan"
    )
    funnel_events: Mapped[list["FunnelEvent"]] = relationship(
        "FunnelEvent", back_populates="user", cascade="all, delete-orphan"
    )
    api_keys: Mapped[list["APIKey"]] = relationship(
        "APIKey", back_populates="user", cascade="all, delete-orphan"
    )
    webhook_configs: Mapped[list["WebhookConfig"]] = relationship(
        "WebhookConfig", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, anonymous_id={self.anonymous_id})>"

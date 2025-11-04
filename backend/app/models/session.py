"""
Session model - User sessions
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Session(Base):
    """Session model for user session tracking"""

    __tablename__ = "sessions"

    # Primary key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Foreign keys
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    page_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Session information
    session_start: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    session_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Device information
    device_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    browser: Mapped[str | None] = mapped_column(String(100), nullable=True)
    screen_width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    screen_height: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sessions")
    page: Mapped["Page"] = relationship("Page", back_populates="sessions")
    click_events: Mapped[list["ClickEvent"]] = relationship(
        "ClickEvent", back_populates="session", cascade="all, delete-orphan"
    )
    scroll_events: Mapped[list["ScrollEvent"]] = relationship(
        "ScrollEvent", back_populates="session", cascade="all, delete-orphan"
    )
    mouse_move_events: Mapped[list["MouseMoveEvent"]] = relationship(
        "MouseMoveEvent", back_populates="session", cascade="all, delete-orphan"
    )
    funnel_events: Mapped[list["FunnelEvent"]] = relationship(
        "FunnelEvent", back_populates="session", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Session(id={self.id}, user_id={self.user_id})>"

"""
Page model - Analyzed pages
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Page(Base):
    """Page model for tracking analyzed pages"""

    __tablename__ = "pages"

    # Primary key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Page information
    url: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    domain: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    sessions: Mapped[list["Session"]] = relationship(
        "Session", back_populates="page", cascade="all, delete-orphan"
    )
    click_events: Mapped[list["ClickEvent"]] = relationship(
        "ClickEvent", back_populates="page", cascade="all, delete-orphan"
    )
    scroll_events: Mapped[list["ScrollEvent"]] = relationship(
        "ScrollEvent", back_populates="page", cascade="all, delete-orphan"
    )
    mouse_move_events: Mapped[list["MouseMoveEvent"]] = relationship(
        "MouseMoveEvent", back_populates="page", cascade="all, delete-orphan"
    )
    funnel_steps: Mapped[list["FunnelStep"]] = relationship(
        "FunnelStep", back_populates="page"
    )

    def __repr__(self) -> str:
        return f"<Page(id={self.id}, url={self.url})>"

"""
Mouse Move Event model - Mouse movement tracking
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class MouseMoveEvent(Base):
    """Mouse move event model for tracking mouse movements (sampled)"""

    __tablename__ = "mouse_move_events"

    # Primary key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Foreign keys
    session_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    page_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Mouse coordinates
    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)

    # Viewport dimensions
    viewport_width: Mapped[int] = mapped_column(Integer, nullable=False)
    viewport_height: Mapped[int] = mapped_column(Integer, nullable=False)

    # Timestamps
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    session: Mapped["Session"] = relationship(
        "Session", back_populates="mouse_move_events"
    )
    page: Mapped["Page"] = relationship("Page", back_populates="mouse_move_events")

    def __repr__(self) -> str:
        return f"<MouseMoveEvent(id={self.id}, x={self.x}, y={self.y})>"

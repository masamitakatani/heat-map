"""
Click Event model - Click tracking
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class ClickEvent(Base):
    """Click event model for tracking user clicks"""

    __tablename__ = "click_events"

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

    # Click coordinates
    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)

    # Viewport dimensions
    viewport_width: Mapped[int] = mapped_column(Integer, nullable=False)
    viewport_height: Mapped[int] = mapped_column(Integer, nullable=False)

    # Element information
    element_tag: Mapped[str | None] = mapped_column(String(50), nullable=True)
    element_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    element_class: Mapped[str | None] = mapped_column(Text, nullable=True)
    element_text: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Timestamps
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="click_events")
    page: Mapped["Page"] = relationship("Page", back_populates="click_events")

    def __repr__(self) -> str:
        return f"<ClickEvent(id={self.id}, x={self.x}, y={self.y})>"

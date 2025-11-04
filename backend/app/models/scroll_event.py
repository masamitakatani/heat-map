"""
Scroll Event model - Scroll depth tracking
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class ScrollEvent(Base):
    """Scroll event model for tracking scroll depth"""

    __tablename__ = "scroll_events"
    __table_args__ = (
        CheckConstraint(
            "depth_percent >= 0 AND depth_percent <= 100",
            name="check_depth_percent_range",
        ),
    )

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

    # Scroll information
    depth_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    max_scroll_y: Mapped[int] = mapped_column(Integer, nullable=False)
    page_height: Mapped[int] = mapped_column(Integer, nullable=False)

    # Timestamps
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="scroll_events")
    page: Mapped["Page"] = relationship("Page", back_populates="scroll_events")

    def __repr__(self) -> str:
        return f"<ScrollEvent(id={self.id}, depth={self.depth_percent}%)>"

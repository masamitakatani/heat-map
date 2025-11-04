"""
Funnel Event model - Funnel progression events
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class FunnelEvent(Base):
    """Funnel event model for tracking funnel progression"""

    __tablename__ = "funnel_events"

    # Primary key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Foreign keys
    funnel_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("funnels.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    funnel_step_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("funnel_steps.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Event status
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    dropped_off: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    funnel: Mapped["Funnel"] = relationship("Funnel", back_populates="funnel_events")
    funnel_step: Mapped["FunnelStep"] = relationship(
        "FunnelStep", back_populates="funnel_events"
    )
    session: Mapped["Session"] = relationship("Session", back_populates="funnel_events")
    user: Mapped["User"] = relationship("User", back_populates="funnel_events")

    def __repr__(self) -> str:
        return f"<FunnelEvent(id={self.id}, completed={self.completed})>"

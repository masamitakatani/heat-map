"""
Funnel Step model - Funnel step definitions
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class FunnelStep(Base):
    """Funnel step model for defining steps in a funnel"""

    __tablename__ = "funnel_steps"
    __table_args__ = (
        UniqueConstraint("funnel_id", "step_order", name="uq_funnel_step_order"),
    )

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
    page_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pages.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Step information
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    step_name: Mapped[str] = mapped_column(String(255), nullable=False)
    page_url: Mapped[str] = mapped_column(Text, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    funnel: Mapped["Funnel"] = relationship("Funnel", back_populates="steps")
    page: Mapped["Page | None"] = relationship("Page", back_populates="funnel_steps")
    funnel_events: Mapped[list["FunnelEvent"]] = relationship(
        "FunnelEvent", back_populates="funnel_step", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<FunnelStep(id={self.id}, name={self.step_name}, order={self.step_order})>"

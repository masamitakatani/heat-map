"""
Funnel model - Funnel definitions
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Funnel(Base):
    """Funnel model for defining conversion funnels"""

    __tablename__ = "funnels"

    # Primary key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Funnel information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Connected One integration
    connected_one_project_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )

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
    steps: Mapped[list["FunnelStep"]] = relationship(
        "FunnelStep",
        back_populates="funnel",
        cascade="all, delete-orphan",
        order_by="FunnelStep.step_order",
    )
    funnel_events: Mapped[list["FunnelEvent"]] = relationship(
        "FunnelEvent", back_populates="funnel", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Funnel(id={self.id}, name={self.name})>"

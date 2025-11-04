"""
Webhook Log model - Webhook delivery logs
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Integer, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class WebhookLog(Base):
    """Webhook log model for tracking webhook deliveries"""

    __tablename__ = "webhook_logs"

    # Primary key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Event information
    event_type: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Response information
    response_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_body: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    sent_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<WebhookLog(id={self.id}, event_type={self.event_type})>"

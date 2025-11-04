"""
Webhook Configuration model - User-specific webhook settings
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import secrets

from app.database import Base


class WebhookConfig(Base):
    """Webhook configuration model for user-specific webhook settings"""

    __tablename__ = "webhook_configs"

    # Primary key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # User association
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Webhook URL
    url: Mapped[str] = mapped_column(Text, nullable=False)

    # Webhook secret for HMAC signature verification
    secret: Mapped[str] = mapped_column(String(64), nullable=False)

    # Configuration name/description
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Webhook status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Event types to send (e.g., ["funnel.completed", "funnel.dropped_off"])
    event_types: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )

    # Retry configuration
    max_retries: Mapped[int] = mapped_column(default=3, nullable=False)
    retry_delay_seconds: Mapped[int] = mapped_column(default=60, nullable=False)

    # Usage tracking
    last_triggered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    total_deliveries: Mapped[int] = mapped_column(default=0, nullable=False)
    failed_deliveries: Mapped[int] = mapped_column(default=0, nullable=False)

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
    user: Mapped["User"] = relationship("User", back_populates="webhook_configs")

    def __repr__(self) -> str:
        return f"<WebhookConfig(id={self.id}, name={self.name}, user_id={self.user_id})>"

    @staticmethod
    def generate_secret() -> str:
        """Generate a secure random webhook secret"""
        return secrets.token_urlsafe(48)

    def is_enabled_for_event(self, event_type: str) -> bool:
        """Check if webhook is enabled for a specific event type"""
        if not self.is_active:
            return False

        # If no event types specified, send all events
        if not self.event_types:
            return True

        return event_type in self.event_types

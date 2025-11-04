"""
API Key model - User-specific API key management
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import secrets

from app.database import Base


class APIKey(Base):
    """API Key model for user authentication"""

    __tablename__ = "api_keys"

    # Primary key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # API key (unique, indexed for fast lookup)
    key: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )

    # Key name/description
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # User association
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Key status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Usage tracking
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Expiration
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

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
    user: Mapped["User"] = relationship("User", back_populates="api_keys")

    def __repr__(self) -> str:
        return f"<APIKey(id={self.id}, name={self.name}, user_id={self.user_id})>"

    @staticmethod
    def generate_key() -> str:
        """Generate a secure random API key"""
        return f"hm_{secrets.token_urlsafe(48)}"

    def is_valid(self) -> bool:
        """Check if API key is valid (active and not expired)"""
        if not self.is_active:
            return False

        if self.expires_at and self.expires_at < datetime.utcnow():
            return False

        return True

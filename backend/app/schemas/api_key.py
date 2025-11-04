"""
API Key schemas for request/response validation
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class APIKeyBase(BaseModel):
    """Base API key schema"""

    name: str = Field(..., min_length=1, max_length=255, description="API key name")


class APIKeyCreate(APIKeyBase):
    """API key creation schema"""

    expires_at: Optional[datetime] = Field(None, description="Expiration date (optional)")


class APIKeyUpdate(BaseModel):
    """API key update schema"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class APIKeyResponse(APIKeyBase):
    """API key response schema (without the actual key)"""

    id: UUID
    user_id: UUID
    is_active: bool
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class APIKeyCreateResponse(APIKeyResponse):
    """API key creation response (includes the actual key, shown only once)"""

    key: str = Field(..., description="API key (only shown once on creation)")

    class Config:
        from_attributes = True


class APIKeyList(BaseModel):
    """API key list response"""

    api_keys: list[APIKeyResponse]
    total: int

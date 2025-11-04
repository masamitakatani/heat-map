"""
User schemas
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    """User creation request schema"""

    anonymous_id: str = Field(..., min_length=1, max_length=255)
    connected_one_user_id: Optional[str] = Field(None, max_length=255)


class UserResponse(BaseModel):
    """User response schema"""

    id: UUID
    anonymous_id: str
    connected_one_user_id: Optional[str]
    first_visit_at: datetime
    last_visit_at: datetime
    total_sessions: int
    created_at: datetime

    class Config:
        from_attributes = True

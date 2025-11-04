"""
Session schemas
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class DeviceInfo(BaseModel):
    """Device information schema"""

    type: str = Field(..., description="Device type: desktop, mobile, tablet")
    browser: str = Field(..., description="Browser name")
    screen_width: int = Field(..., gt=0)
    screen_height: int = Field(..., gt=0)


class SessionStart(BaseModel):
    """Session start request schema"""

    user_id: UUID
    page_url: str = Field(..., min_length=1)
    page_title: Optional[str] = Field(None, max_length=500)
    device: DeviceInfo


class SessionEnd(BaseModel):
    """Session end request schema"""

    session_end: datetime
    duration_seconds: int = Field(..., ge=0)


class SessionResponse(BaseModel):
    """Session response schema"""

    id: UUID
    user_id: UUID
    page_id: UUID
    session_start: datetime
    session_end: Optional[datetime]
    duration_seconds: Optional[int]
    device_type: Optional[str]
    browser: Optional[str]
    screen_width: Optional[int]
    screen_height: Optional[int]

    class Config:
        from_attributes = True

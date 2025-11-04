"""
Event schemas
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class ElementInfo(BaseModel):
    """HTML element information"""

    tag: str = Field(..., max_length=50)
    id: Optional[str] = Field(None, max_length=255)
    class_: Optional[str] = Field(None, alias="class", max_length=1000)
    text: Optional[str] = Field(None, max_length=500)


class ClickEventCreate(BaseModel):
    """Single click event schema"""

    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)
    viewport_width: int = Field(..., gt=0)
    viewport_height: int = Field(..., gt=0)
    element: ElementInfo
    timestamp: datetime


class ClickEventBatch(BaseModel):
    """Batch click events request schema"""

    session_id: UUID
    page_url: str = Field(..., min_length=1)
    events: List[ClickEventCreate] = Field(..., max_length=100)

    @field_validator("events")
    @classmethod
    def validate_events_not_empty(cls, v):
        if len(v) == 0:
            raise ValueError("events list cannot be empty")
        return v


class ScrollEventCreate(BaseModel):
    """Single scroll event schema"""

    depth_percent: int = Field(..., ge=0, le=100)
    max_scroll_y: int = Field(..., ge=0)
    page_height: int = Field(..., gt=0)
    timestamp: datetime


class ScrollEventBatch(BaseModel):
    """Batch scroll events request schema"""

    session_id: UUID
    page_url: str = Field(..., min_length=1)
    events: List[ScrollEventCreate] = Field(..., max_length=100)

    @field_validator("events")
    @classmethod
    def validate_events_not_empty(cls, v):
        if len(v) == 0:
            raise ValueError("events list cannot be empty")
        return v


class MouseMoveEventCreate(BaseModel):
    """Single mouse move event schema"""

    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)
    viewport_width: int = Field(..., gt=0)
    viewport_height: int = Field(..., gt=0)
    timestamp: datetime


class MouseMoveEventBatch(BaseModel):
    """Batch mouse move events request schema"""

    session_id: UUID
    page_url: str = Field(..., min_length=1)
    events: List[MouseMoveEventCreate] = Field(..., max_length=100)

    @field_validator("events")
    @classmethod
    def validate_events_not_empty(cls, v):
        if len(v) == 0:
            raise ValueError("events list cannot be empty")
        return v


class EventBatchResponse(BaseModel):
    """Batch event response schema"""

    inserted: int
    message: str = "Events recorded successfully"

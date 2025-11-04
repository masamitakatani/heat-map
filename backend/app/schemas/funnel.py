"""
Funnel schemas
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class FunnelStepCreate(BaseModel):
    """Funnel step creation schema"""

    step_order: int = Field(..., ge=1)
    step_name: str = Field(..., min_length=1, max_length=255)
    page_url: str = Field(..., min_length=1)


class FunnelStepResponse(BaseModel):
    """Funnel step response schema"""

    id: UUID
    step_order: int
    step_name: str
    page_url: str

    class Config:
        from_attributes = True


class FunnelCreate(BaseModel):
    """Funnel creation request schema"""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    connected_one_project_id: Optional[str] = Field(None, max_length=255)
    steps: List[FunnelStepCreate] = Field(..., min_length=1)


class FunnelResponse(BaseModel):
    """Funnel response schema"""

    id: UUID
    name: str
    description: Optional[str]
    connected_one_project_id: Optional[str]
    steps: List[FunnelStepResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class FunnelEventCreate(BaseModel):
    """Funnel event creation schema"""

    session_id: UUID
    user_id: UUID
    funnel_step_id: UUID
    completed: bool = False
    dropped_off: bool = False
    timestamp: datetime


class FunnelStepStats(BaseModel):
    """Funnel step statistics"""

    step_order: int
    step_name: str
    users_entered: int
    users_completed: int
    completion_rate: float = Field(..., ge=0.0, le=100.0)
    drop_off_rate: float = Field(..., ge=0.0, le=100.0)


class FunnelInfo(BaseModel):
    """Funnel information"""

    id: UUID
    name: str


class DateRange(BaseModel):
    """Date range"""

    start: datetime
    end: datetime


class FunnelStatsResponse(BaseModel):
    """Funnel statistics response"""

    funnel: FunnelInfo
    stats: List[FunnelStepStats]
    overall_conversion_rate: float = Field(..., ge=0.0, le=100.0)
    date_range: DateRange

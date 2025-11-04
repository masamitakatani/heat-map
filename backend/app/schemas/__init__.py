"""
Pydantic schemas for request/response validation
"""

from app.schemas.user import UserCreate, UserResponse
from app.schemas.session import SessionStart, SessionEnd, SessionResponse
from app.schemas.event import (
    ClickEventCreate,
    ScrollEventCreate,
    MouseMoveEventCreate,
    ClickEventBatch,
    ScrollEventBatch,
    MouseMoveEventBatch,
    EventBatchResponse,
)
from app.schemas.heatmap import (
    ClickHeatmapResponse,
    ScrollHeatmapResponse,
    MouseMoveHeatmapResponse,
)
from app.schemas.funnel import (
    FunnelCreate,
    FunnelResponse,
    FunnelStepCreate,
    FunnelEventCreate,
    FunnelStatsResponse,
)
from app.schemas.webhook import WebhookPayload
from app.schemas.common import ErrorResponse

__all__ = [
    "UserCreate",
    "UserResponse",
    "SessionStart",
    "SessionEnd",
    "SessionResponse",
    "ClickEventCreate",
    "ScrollEventCreate",
    "MouseMoveEventCreate",
    "ClickEventBatch",
    "ScrollEventBatch",
    "MouseMoveEventBatch",
    "EventBatchResponse",
    "ClickHeatmapResponse",
    "ScrollHeatmapResponse",
    "MouseMoveHeatmapResponse",
    "FunnelCreate",
    "FunnelResponse",
    "FunnelStepCreate",
    "FunnelEventCreate",
    "FunnelStatsResponse",
    "WebhookPayload",
    "ErrorResponse",
]

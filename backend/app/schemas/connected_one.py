"""
Connected One integration schemas
"""

from typing import Optional, Any
from pydantic import BaseModel, Field


class FunnelStepSchema(BaseModel):
    """Funnel step schema from Connected One"""

    step_index: int
    step_name: str
    page_url: str


class FunnelSchema(BaseModel):
    """Funnel schema from Connected One"""

    funnel_id: str
    funnel_name: str
    description: Optional[str] = None
    steps: list[FunnelStepSchema]
    created_at: str


class FunnelsResponse(BaseModel):
    """Funnels response from Connected One"""

    project_id: str
    funnels: list[FunnelSchema]


class ProjectSettingsSchema(BaseModel):
    """Project settings from Connected One"""

    project_id: str
    project_name: str
    heatmap_enabled: bool
    tracking_domains: list[str]
    settings: dict[str, Any]


class HeatmapEventPayload(BaseModel):
    """Heatmap event payload to send to Connected One"""

    event_type: str = Field(..., description="Event type (e.g., funnel.completed)")
    project_id: str
    user: dict[str, Any]
    timestamp: str


class FunnelCompletedEvent(HeatmapEventPayload):
    """Funnel completed event"""

    funnel_id: str
    funnel_data: dict[str, Any]
    device: dict[str, Any]


class FunnelDroppedOffEvent(HeatmapEventPayload):
    """Funnel dropped off event"""

    funnel_id: str
    funnel_data: dict[str, Any]
    device: dict[str, Any]

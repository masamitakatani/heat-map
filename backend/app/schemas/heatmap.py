"""
Heatmap schemas
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PageInfo(BaseModel):
    """Page information"""

    url: str
    title: Optional[str]
    total_clicks: Optional[int] = None
    average_page_height: Optional[int] = None


class DateRange(BaseModel):
    """Date range"""

    start: datetime
    end: datetime


class ClickHeatmapPoint(BaseModel):
    """Click heatmap data point"""

    x: int
    y: int
    click_count: int
    element_tag: str
    element_text: Optional[str] = None


class ClickHeatmapResponse(BaseModel):
    """Click heatmap response"""

    page: PageInfo
    heatmap_data: List[ClickHeatmapPoint]
    date_range: DateRange


class ScrollDepthData(BaseModel):
    """Scroll depth data point"""

    depth_percent: int = Field(..., ge=0, le=100)
    users_reached: int
    reach_rate: float = Field(..., ge=0.0, le=100.0)


class ScrollHeatmapResponse(BaseModel):
    """Scroll heatmap response"""

    page: PageInfo
    scroll_data: List[ScrollDepthData]
    date_range: DateRange


class MouseMoveHeatmapPoint(BaseModel):
    """Mouse move heatmap data point"""

    x_bucket: int
    y_bucket: int
    move_count: int
    intensity: float = Field(..., ge=0.0, le=1.0)


class MouseMoveHeatmapResponse(BaseModel):
    """Mouse move heatmap response"""

    page: PageInfo
    heatmap_data: List[MouseMoveHeatmapPoint]
    grid_size: int = 10
    date_range: DateRange

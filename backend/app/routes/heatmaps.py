"""
Heatmap data retrieval API endpoints
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.page import Page
from app.models.click_event import ClickEvent
from app.models.scroll_event import ScrollEvent
from app.models.mouse_move_event import MouseMoveEvent
from app.models.session import Session
from app.schemas.heatmap import (
    ClickHeatmapResponse,
    ScrollHeatmapResponse,
    MouseMoveHeatmapResponse,
    PageInfo,
    DateRange,
    ClickHeatmapPoint,
    ScrollDepthData,
    MouseMoveHeatmapPoint,
)

router = APIRouter()


@router.get(
    "/heatmaps/clicks",
    response_model=ClickHeatmapResponse,
    status_code=status.HTTP_200_OK,
)
async def get_click_heatmap(
    page_url: str = Query(..., description="Page URL"),
    start_date: Optional[datetime] = Query(None, description="Start date (ISO8601)"),
    end_date: Optional[datetime] = Query(None, description="End date (ISO8601)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get click heatmap data for a specific page

    - **page_url**: Page URL (required)
    - **start_date**: Start date filter (optional)
    - **end_date**: End date filter (optional)
    """

    # Get page
    stmt = select(Page).where(Page.url == page_url)
    result = await db.execute(stmt)
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Page not found: {page_url}",
                }
            },
        )

    # Build query with date filters
    query = select(
        ClickEvent.x,
        ClickEvent.y,
        func.count(ClickEvent.id).label("click_count"),
        ClickEvent.element_tag,
        ClickEvent.element_text,
    ).where(ClickEvent.page_id == page.id)

    if start_date:
        query = query.where(ClickEvent.timestamp >= start_date)
    if end_date:
        query = query.where(ClickEvent.timestamp <= end_date)

    query = query.group_by(
        ClickEvent.x,
        ClickEvent.y,
        ClickEvent.element_tag,
        ClickEvent.element_text,
    )

    # Execute query
    result = await db.execute(query)
    rows = result.all()

    # Get total clicks count
    total_clicks_query = select(func.count(ClickEvent.id)).where(
        ClickEvent.page_id == page.id
    )
    if start_date:
        total_clicks_query = total_clicks_query.where(
            ClickEvent.timestamp >= start_date
        )
    if end_date:
        total_clicks_query = total_clicks_query.where(ClickEvent.timestamp <= end_date)

    total_clicks_result = await db.execute(total_clicks_query)
    total_clicks = total_clicks_result.scalar()

    # Build response
    heatmap_data = [
        ClickHeatmapPoint(
            x=row.x,
            y=row.y,
            click_count=row.click_count,
            element_tag=row.element_tag,
            element_text=row.element_text,
        )
        for row in rows
    ]

    return ClickHeatmapResponse(
        page=PageInfo(url=page.url, title=page.title, total_clicks=total_clicks),
        heatmap_data=heatmap_data,
        date_range=DateRange(
            start=start_date or datetime.min,
            end=end_date or datetime.utcnow(),
        ),
    )


@router.get(
    "/heatmaps/scrolls",
    response_model=ScrollHeatmapResponse,
    status_code=status.HTTP_200_OK,
)
async def get_scroll_heatmap(
    page_url: str = Query(..., description="Page URL"),
    start_date: Optional[datetime] = Query(None, description="Start date (ISO8601)"),
    end_date: Optional[datetime] = Query(None, description="End date (ISO8601)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get scroll depth data for a specific page

    - **page_url**: Page URL (required)
    - **start_date**: Start date filter (optional)
    - **end_date**: End date filter (optional)
    """

    # Get page
    stmt = select(Page).where(Page.url == page_url)
    result = await db.execute(stmt)
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Page not found: {page_url}",
                }
            },
        )

    # Get total unique users
    total_users_query = (
        select(func.count(distinct(Session.user_id)))
        .select_from(ScrollEvent)
        .join(Session, ScrollEvent.session_id == Session.id)
        .where(ScrollEvent.page_id == page.id)
    )

    if start_date:
        total_users_query = total_users_query.where(ScrollEvent.timestamp >= start_date)
    if end_date:
        total_users_query = total_users_query.where(ScrollEvent.timestamp <= end_date)

    total_users_result = await db.execute(total_users_query)
    total_users = total_users_result.scalar() or 1  # Avoid division by zero

    # Get scroll depth statistics
    depth_thresholds = [0, 25, 50, 75, 100]
    scroll_data = []

    for depth in depth_thresholds:
        users_query = (
            select(func.count(distinct(Session.user_id)))
            .select_from(ScrollEvent)
            .join(Session, ScrollEvent.session_id == Session.id)
            .where(ScrollEvent.page_id == page.id)
            .where(ScrollEvent.depth_percent >= depth)
        )

        if start_date:
            users_query = users_query.where(ScrollEvent.timestamp >= start_date)
        if end_date:
            users_query = users_query.where(ScrollEvent.timestamp <= end_date)

        users_result = await db.execute(users_query)
        users_reached = users_result.scalar() or 0

        reach_rate = (users_reached / total_users) * 100 if total_users > 0 else 0.0

        scroll_data.append(
            ScrollDepthData(
                depth_percent=depth,
                users_reached=users_reached,
                reach_rate=round(reach_rate, 2),
            )
        )

    # Get average page height
    avg_height_query = select(func.avg(ScrollEvent.page_height)).where(
        ScrollEvent.page_id == page.id
    )
    if start_date:
        avg_height_query = avg_height_query.where(ScrollEvent.timestamp >= start_date)
    if end_date:
        avg_height_query = avg_height_query.where(ScrollEvent.timestamp <= end_date)

    avg_height_result = await db.execute(avg_height_query)
    avg_height = avg_height_result.scalar() or 0

    return ScrollHeatmapResponse(
        page=PageInfo(
            url=page.url, title=page.title, average_page_height=int(avg_height)
        ),
        scroll_data=scroll_data,
        date_range=DateRange(
            start=start_date or datetime.min,
            end=end_date or datetime.utcnow(),
        ),
    )


@router.get(
    "/heatmaps/mouse-moves",
    response_model=MouseMoveHeatmapResponse,
    status_code=status.HTTP_200_OK,
)
async def get_mouse_move_heatmap(
    page_url: str = Query(..., description="Page URL"),
    start_date: Optional[datetime] = Query(None, description="Start date (ISO8601)"),
    end_date: Optional[datetime] = Query(None, description="End date (ISO8601)"),
    grid_size: int = Query(10, description="Grid bucket size in pixels", ge=5, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Get mouse movement heatmap data for a specific page (bucketed into grid)

    - **page_url**: Page URL (required)
    - **start_date**: Start date filter (optional)
    - **end_date**: End date filter (optional)
    - **grid_size**: Grid bucket size in pixels (default: 10, range: 5-50)
    """

    # Get page
    stmt = select(Page).where(Page.url == page_url)
    result = await db.execute(stmt)
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Page not found: {page_url}",
                }
            },
        )

    # Build query with grid bucketing
    x_bucket = (func.round(MouseMoveEvent.x / grid_size) * grid_size).label("x_bucket")
    y_bucket = (func.round(MouseMoveEvent.y / grid_size) * grid_size).label("y_bucket")

    query = select(
        x_bucket,
        y_bucket,
        func.count(MouseMoveEvent.id).label("move_count"),
    ).where(MouseMoveEvent.page_id == page.id)

    if start_date:
        query = query.where(MouseMoveEvent.timestamp >= start_date)
    if end_date:
        query = query.where(MouseMoveEvent.timestamp <= end_date)

    query = query.group_by(x_bucket, y_bucket)

    # Execute query
    result = await db.execute(query)
    rows = result.all()

    # Calculate max move count for intensity normalization
    max_move_count = max((row.move_count for row in rows), default=1)

    # Build response
    heatmap_data = [
        MouseMoveHeatmapPoint(
            x_bucket=int(row.x_bucket),
            y_bucket=int(row.y_bucket),
            move_count=row.move_count,
            intensity=round(row.move_count / max_move_count, 2),
        )
        for row in rows
    ]

    return MouseMoveHeatmapResponse(
        page=PageInfo(url=page.url, title=page.title),
        heatmap_data=heatmap_data,
        grid_size=grid_size,
        date_range=DateRange(
            start=start_date or datetime.min,
            end=end_date or datetime.utcnow(),
        ),
    )

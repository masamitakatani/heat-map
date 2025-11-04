"""
Funnel management API endpoints
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, distinct, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.funnel import Funnel
from app.models.funnel_step import FunnelStep
from app.models.funnel_event import FunnelEvent
from app.schemas.funnel import (
    FunnelCreate,
    FunnelResponse,
    FunnelEventCreate,
    FunnelStatsResponse,
    FunnelStepStats,
    FunnelInfo,
    DateRange,
)

router = APIRouter()


@router.post("/funnels", response_model=FunnelResponse, status_code=status.HTTP_201_CREATED)
async def create_funnel(
    funnel_data: FunnelCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new funnel with steps

    - **name**: Funnel name (required)
    - **description**: Funnel description (optional)
    - **connected_one_project_id**: Connected One project ID (optional)
    - **steps**: List of funnel steps (required, min 1)
    """

    # Create funnel
    funnel = Funnel(
        name=funnel_data.name,
        description=funnel_data.description,
        connected_one_project_id=funnel_data.connected_one_project_id,
    )
    db.add(funnel)
    await db.flush()  # Get funnel.id

    # Create funnel steps
    steps = [
        FunnelStep(
            funnel_id=funnel.id,
            step_order=step_data.step_order,
            step_name=step_data.step_name,
            page_url=step_data.page_url,
        )
        for step_data in funnel_data.steps
    ]
    db.add_all(steps)

    await db.commit()

    # Reload with relationships
    stmt = select(Funnel).options(selectinload(Funnel.steps)).where(Funnel.id == funnel.id)
    result = await db.execute(stmt)
    funnel = result.scalar_one()

    return funnel


@router.get("/funnels", response_model=List[FunnelResponse], status_code=status.HTTP_200_OK)
async def get_funnels(
    project_id: Optional[str] = Query(None, description="Connected One project ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of funnels, optionally filtered by project ID

    - **project_id**: Connected One project ID filter (optional)
    """

    query = select(Funnel).options(selectinload(Funnel.steps))

    if project_id:
        query = query.where(Funnel.connected_one_project_id == project_id)

    result = await db.execute(query)
    funnels = result.scalars().all()

    return funnels


@router.get(
    "/funnels/{funnel_id}",
    response_model=FunnelResponse,
    status_code=status.HTTP_200_OK,
)
async def get_funnel(
    funnel_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get funnel details by ID

    - **funnel_id**: Funnel UUID (required)
    """

    stmt = select(Funnel).options(selectinload(Funnel.steps)).where(Funnel.id == funnel_id)
    result = await db.execute(stmt)
    funnel = result.scalar_one_or_none()

    if not funnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Funnel {funnel_id} not found",
                }
            },
        )

    return funnel


@router.post(
    "/funnels/{funnel_id}/events",
    status_code=status.HTTP_201_CREATED,
)
async def create_funnel_event(
    funnel_id: UUID,
    event_data: FunnelEventCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Record funnel event (step completion or drop-off)

    - **funnel_id**: Funnel UUID (required)
    - **session_id**: Session UUID (required)
    - **user_id**: User UUID (required)
    - **funnel_step_id**: Funnel step UUID (required)
    - **completed**: Step completed flag (default: false)
    - **dropped_off**: Dropped off flag (default: false)
    """

    # Verify funnel exists
    funnel_stmt = select(Funnel).where(Funnel.id == funnel_id)
    funnel_result = await db.execute(funnel_stmt)
    funnel = funnel_result.scalar_one_or_none()

    if not funnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Funnel {funnel_id} not found",
                }
            },
        )

    # Create funnel event
    event = FunnelEvent(
        funnel_id=funnel_id,
        funnel_step_id=event_data.funnel_step_id,
        session_id=event_data.session_id,
        user_id=event_data.user_id,
        completed=event_data.completed,
        dropped_off=event_data.dropped_off,
        timestamp=event_data.timestamp,
    )

    db.add(event)
    await db.commit()

    return {"status": "success", "message": "Funnel event recorded"}


@router.get(
    "/funnels/{funnel_id}/stats",
    response_model=FunnelStatsResponse,
    status_code=status.HTTP_200_OK,
)
async def get_funnel_stats(
    funnel_id: UUID,
    start_date: Optional[datetime] = Query(None, description="Start date (ISO8601)"),
    end_date: Optional[datetime] = Query(None, description="End date (ISO8601)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get funnel statistics (conversion rates, drop-off rates)

    - **funnel_id**: Funnel UUID (required)
    - **start_date**: Start date filter (optional)
    - **end_date**: End date filter (optional)
    """

    # Get funnel with steps
    funnel_stmt = (
        select(Funnel).options(selectinload(Funnel.steps)).where(Funnel.id == funnel_id)
    )
    funnel_result = await db.execute(funnel_stmt)
    funnel = funnel_result.scalar_one_or_none()

    if not funnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Funnel {funnel_id} not found",
                }
            },
        )

    # Calculate stats for each step
    stats = []
    first_step_users = 0

    for step in sorted(funnel.steps, key=lambda s: s.step_order):
        # Count unique users who entered this step
        entered_query = (
            select(func.count(distinct(FunnelEvent.user_id)))
            .where(FunnelEvent.funnel_step_id == step.id)
        )

        if start_date:
            entered_query = entered_query.where(FunnelEvent.timestamp >= start_date)
        if end_date:
            entered_query = entered_query.where(FunnelEvent.timestamp <= end_date)

        entered_result = await db.execute(entered_query)
        users_entered = entered_result.scalar() or 0

        # Count unique users who completed this step
        completed_query = (
            select(func.count(distinct(FunnelEvent.user_id)))
            .where(FunnelEvent.funnel_step_id == step.id)
            .where(FunnelEvent.completed == True)
        )

        if start_date:
            completed_query = completed_query.where(FunnelEvent.timestamp >= start_date)
        if end_date:
            completed_query = completed_query.where(FunnelEvent.timestamp <= end_date)

        completed_result = await db.execute(completed_query)
        users_completed = completed_result.scalar() or 0

        # Calculate rates
        completion_rate = (
            (users_completed / users_entered * 100) if users_entered > 0 else 0.0
        )
        drop_off_rate = 100.0 - completion_rate

        stats.append(
            FunnelStepStats(
                step_order=step.step_order,
                step_name=step.step_name,
                users_entered=users_entered,
                users_completed=users_completed,
                completion_rate=round(completion_rate, 2),
                drop_off_rate=round(drop_off_rate, 2),
            )
        )

        # Track first step users for overall conversion
        if step.step_order == 1:
            first_step_users = users_entered

    # Calculate overall conversion rate (first step to last step)
    last_step_completed = stats[-1].users_completed if stats else 0
    overall_conversion = (
        (last_step_completed / first_step_users * 100) if first_step_users > 0 else 0.0
    )

    return FunnelStatsResponse(
        funnel=FunnelInfo(id=funnel.id, name=funnel.name),
        stats=stats,
        overall_conversion_rate=round(overall_conversion, 2),
        date_range=DateRange(
            start=start_date or datetime.min,
            end=end_date or datetime.utcnow(),
        ),
    )

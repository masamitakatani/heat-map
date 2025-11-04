"""
Event recording API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.page import Page
from app.models.click_event import ClickEvent
from app.models.scroll_event import ScrollEvent
from app.models.mouse_move_event import MouseMoveEvent
from app.schemas.event import (
    ClickEventBatch,
    ScrollEventBatch,
    MouseMoveEventBatch,
    EventBatchResponse,
)

router = APIRouter()


async def get_page_by_url(db: AsyncSession, url: str) -> Page:
    """Get page by URL"""
    stmt = select(Page).where(Page.url == url)
    result = await db.execute(stmt)
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Page not found: {url}",
                }
            },
        )

    return page


@router.post(
    "/events/clicks",
    response_model=EventBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_click_events(
    batch: ClickEventBatch,
    db: AsyncSession = Depends(get_db),
):
    """
    Record click events in batch (max 100 events)

    - **session_id**: Session UUID (required)
    - **page_url**: Page URL (required)
    - **events**: List of click events (required, max 100)
    """

    # Get page
    page = await get_page_by_url(db, batch.page_url)

    # Create click events
    click_events = [
        ClickEvent(
            session_id=batch.session_id,
            page_id=page.id,
            x=event.x,
            y=event.y,
            viewport_width=event.viewport_width,
            viewport_height=event.viewport_height,
            element_tag=event.element.tag,
            element_id=event.element.id,
            element_class=event.element.class_,
            element_text=event.element.text,
            timestamp=event.timestamp,
        )
        for event in batch.events
    ]

    db.add_all(click_events)
    await db.commit()

    return EventBatchResponse(
        inserted=len(click_events),
        message="Click events recorded successfully",
    )


@router.post(
    "/events/scrolls",
    response_model=EventBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_scroll_events(
    batch: ScrollEventBatch,
    db: AsyncSession = Depends(get_db),
):
    """
    Record scroll events in batch (max 100 events)

    - **session_id**: Session UUID (required)
    - **page_url**: Page URL (required)
    - **events**: List of scroll events (required, max 100)
    """

    # Get page
    page = await get_page_by_url(db, batch.page_url)

    # Create scroll events
    scroll_events = [
        ScrollEvent(
            session_id=batch.session_id,
            page_id=page.id,
            depth_percent=event.depth_percent,
            max_scroll_y=event.max_scroll_y,
            page_height=event.page_height,
            timestamp=event.timestamp,
        )
        for event in batch.events
    ]

    db.add_all(scroll_events)
    await db.commit()

    return EventBatchResponse(
        inserted=len(scroll_events),
        message="Scroll events recorded successfully",
    )


@router.post(
    "/events/mouse-moves",
    response_model=EventBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_mouse_move_events(
    batch: MouseMoveEventBatch,
    db: AsyncSession = Depends(get_db),
):
    """
    Record mouse move events in batch (max 100 events, pre-sampled at 100ms)

    - **session_id**: Session UUID (required)
    - **page_url**: Page URL (required)
    - **events**: List of mouse move events (required, max 100)
    """

    # Get page
    page = await get_page_by_url(db, batch.page_url)

    # Create mouse move events
    mouse_move_events = [
        MouseMoveEvent(
            session_id=batch.session_id,
            page_id=page.id,
            x=event.x,
            y=event.y,
            viewport_width=event.viewport_width,
            viewport_height=event.viewport_height,
            timestamp=event.timestamp,
        )
        for event in batch.events
    ]

    db.add_all(mouse_move_events)
    await db.commit()

    return EventBatchResponse(
        inserted=len(mouse_move_events),
        message="Mouse move events recorded successfully",
    )

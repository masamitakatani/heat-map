"""
Session management API endpoints
"""

from urllib.parse import urlparse
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.page import Page
from app.models.session import Session
from app.schemas.session import SessionStart, SessionEnd, SessionResponse

router = APIRouter()


async def get_or_create_page(db: AsyncSession, url: str, title: str | None) -> Page:
    """Get existing page or create new one"""
    # Parse domain from URL
    parsed_url = urlparse(url)
    domain = parsed_url.netloc

    # Check if page exists
    stmt = select(Page).where(Page.url == url)
    result = await db.execute(stmt)
    page = result.scalar_one_or_none()

    if not page:
        # Create new page
        page = Page(url=url, title=title, domain=domain)
        db.add(page)
        await db.flush()  # Flush to get page.id

    return page


@router.post("/sessions/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    session_data: SessionStart,
    db: AsyncSession = Depends(get_db),
):
    """
    Start a new session

    - **user_id**: User UUID (required)
    - **page_url**: Page URL (required)
    - **page_title**: Page title (optional)
    - **device**: Device information (required)
    """

    # Get or create page
    page = await get_or_create_page(db, session_data.page_url, session_data.page_title)

    # Create session
    session = Session(
        user_id=session_data.user_id,
        page_id=page.id,
        device_type=session_data.device.type,
        browser=session_data.device.browser,
        screen_width=session_data.device.screen_width,
        screen_height=session_data.device.screen_height,
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return session


@router.post(
    "/sessions/{session_id}/end",
    response_model=SessionResponse,
    status_code=status.HTTP_200_OK,
)
async def end_session(
    session_id: UUID,
    session_end_data: SessionEnd,
    db: AsyncSession = Depends(get_db),
):
    """
    End a session

    - **session_id**: Session UUID (required)
    - **session_end**: Session end timestamp (required)
    - **duration_seconds**: Session duration in seconds (required)
    """

    # Get session
    stmt = select(Session).where(Session.id == session_id)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Session {session_id} not found",
                }
            },
        )

    # Update session
    session.session_end = session_end_data.session_end
    session.duration_seconds = session_end_data.duration_seconds

    await db.commit()
    await db.refresh(session)

    return session

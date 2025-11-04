"""
User management API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.post("/users/identify", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def identify_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Identify user by anonymous_id. Create if not exists, update if exists.

    - **anonymous_id**: Browser-specific UUID (required)
    - **connected_one_user_id**: Connected One user ID (optional)
    """

    # Check if user exists
    stmt = select(User).where(User.anonymous_id == user_data.anonymous_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user:
        # Update existing user
        user.total_sessions += 1
        user.last_visit_at = user.last_visit_at  # Will trigger onupdate

        # Update connected_one_user_id if provided
        if user_data.connected_one_user_id:
            user.connected_one_user_id = user_data.connected_one_user_id

        await db.commit()
        await db.refresh(user)
    else:
        # Create new user
        user = User(
            anonymous_id=user_data.anonymous_id,
            connected_one_user_id=user_data.connected_one_user_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user

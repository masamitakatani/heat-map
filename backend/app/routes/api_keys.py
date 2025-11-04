"""
API Key management endpoints
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.api_key import APIKey
from app.schemas.api_key import (
    APIKeyCreate,
    APIKeyUpdate,
    APIKeyResponse,
    APIKeyCreateResponse,
    APIKeyList,
)

router = APIRouter()


@router.post("/api-keys", response_model=APIKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    request: Request,
    api_key_data: APIKeyCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new API key for the authenticated user

    - **name**: API key name/description
    - **expires_at**: Optional expiration date
    """
    user_id = request.state.user_id

    # Generate new API key
    new_key = APIKey(
        key=APIKey.generate_key(),
        name=api_key_data.name,
        user_id=user_id,
        expires_at=api_key_data.expires_at,
    )

    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    return new_key


@router.get("/api-keys", response_model=APIKeyList)
async def list_api_keys(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """
    List all API keys for the authenticated user

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    user_id = request.state.user_id

    # Get total count
    count_result = await db.execute(
        select(func.count(APIKey.id)).where(APIKey.user_id == user_id)
    )
    total = count_result.scalar_one()

    # Get API keys
    result = await db.execute(
        select(APIKey)
        .where(APIKey.user_id == user_id)
        .order_by(APIKey.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    api_keys = result.scalars().all()

    return APIKeyList(api_keys=api_keys, total=total)


@router.get("/api-keys/{api_key_id}", response_model=APIKeyResponse)
async def get_api_key(
    request: Request,
    api_key_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get details of a specific API key

    - **api_key_id**: API key ID (UUID)
    """
    user_id = request.state.user_id

    result = await db.execute(
        select(APIKey).where(
            APIKey.id == api_key_id,
            APIKey.user_id == user_id,
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "API key not found",
                }
            },
        )

    return api_key


@router.patch("/api-keys/{api_key_id}", response_model=APIKeyResponse)
async def update_api_key(
    request: Request,
    api_key_id: UUID,
    api_key_data: APIKeyUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update an API key

    - **api_key_id**: API key ID (UUID)
    - **name**: Optional new name
    - **is_active**: Optional active status
    - **expires_at**: Optional new expiration date
    """
    user_id = request.state.user_id

    result = await db.execute(
        select(APIKey).where(
            APIKey.id == api_key_id,
            APIKey.user_id == user_id,
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "API key not found",
                }
            },
        )

    # Update fields
    if api_key_data.name is not None:
        api_key.name = api_key_data.name
    if api_key_data.is_active is not None:
        api_key.is_active = api_key_data.is_active
    if api_key_data.expires_at is not None:
        api_key.expires_at = api_key_data.expires_at

    await db.commit()
    await db.refresh(api_key)

    return api_key


@router.delete("/api-keys/{api_key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    request: Request,
    api_key_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an API key

    - **api_key_id**: API key ID (UUID)
    """
    user_id = request.state.user_id

    result = await db.execute(
        select(APIKey).where(
            APIKey.id == api_key_id,
            APIKey.user_id == user_id,
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "API key not found",
                }
            },
        )

    await db.delete(api_key)
    await db.commit()

    return None

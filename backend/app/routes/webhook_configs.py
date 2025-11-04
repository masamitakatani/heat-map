"""
Webhook Configuration management endpoints
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.webhook_config import WebhookConfig
from app.schemas.webhook_config import (
    WebhookConfigCreate,
    WebhookConfigUpdate,
    WebhookConfigResponse,
    WebhookConfigCreateResponse,
    WebhookConfigList,
    WebhookTestRequest,
    WebhookTestResponse,
)
from app.services.webhook_service import WebhookService

router = APIRouter()


@router.post(
    "/webhook-configs",
    response_model=WebhookConfigCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_webhook_config(
    request: Request,
    webhook_data: WebhookConfigCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new webhook configuration for the authenticated user

    - **name**: Webhook name/description
    - **url**: Webhook URL
    - **event_types**: Event types to send (empty = all events)
    - **max_retries**: Maximum retry attempts
    - **retry_delay_seconds**: Retry delay in seconds
    """
    user_id = request.state.user_id

    # Create new webhook config
    new_webhook = WebhookConfig(
        name=webhook_data.name,
        url=webhook_data.url,
        secret=WebhookConfig.generate_secret(),
        user_id=user_id,
        event_types=webhook_data.event_types,
        max_retries=webhook_data.max_retries,
        retry_delay_seconds=webhook_data.retry_delay_seconds,
    )

    db.add(new_webhook)
    await db.commit()
    await db.refresh(new_webhook)

    return new_webhook


@router.get("/webhook-configs", response_model=WebhookConfigList)
async def list_webhook_configs(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """
    List all webhook configurations for the authenticated user

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    user_id = request.state.user_id

    # Get total count
    count_result = await db.execute(
        select(func.count(WebhookConfig.id)).where(WebhookConfig.user_id == user_id)
    )
    total = count_result.scalar_one()

    # Get webhook configs
    result = await db.execute(
        select(WebhookConfig)
        .where(WebhookConfig.user_id == user_id)
        .order_by(WebhookConfig.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    webhooks = result.scalars().all()

    return WebhookConfigList(webhooks=webhooks, total=total)


@router.get("/webhook-configs/{webhook_id}", response_model=WebhookConfigResponse)
async def get_webhook_config(
    request: Request,
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get details of a specific webhook configuration

    - **webhook_id**: Webhook config ID (UUID)
    """
    user_id = request.state.user_id

    result = await db.execute(
        select(WebhookConfig).where(
            WebhookConfig.id == webhook_id,
            WebhookConfig.user_id == user_id,
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Webhook configuration not found",
                }
            },
        )

    return webhook


@router.patch("/webhook-configs/{webhook_id}", response_model=WebhookConfigResponse)
async def update_webhook_config(
    request: Request,
    webhook_id: UUID,
    webhook_data: WebhookConfigUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update a webhook configuration

    - **webhook_id**: Webhook config ID (UUID)
    - **name**: Optional new name
    - **url**: Optional new URL
    - **is_active**: Optional active status
    - **event_types**: Optional new event types
    - **max_retries**: Optional new max retries
    - **retry_delay_seconds**: Optional new retry delay
    """
    user_id = request.state.user_id

    result = await db.execute(
        select(WebhookConfig).where(
            WebhookConfig.id == webhook_id,
            WebhookConfig.user_id == user_id,
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Webhook configuration not found",
                }
            },
        )

    # Update fields
    if webhook_data.name is not None:
        webhook.name = webhook_data.name
    if webhook_data.url is not None:
        webhook.url = webhook_data.url
    if webhook_data.is_active is not None:
        webhook.is_active = webhook_data.is_active
    if webhook_data.event_types is not None:
        webhook.event_types = webhook_data.event_types
    if webhook_data.max_retries is not None:
        webhook.max_retries = webhook_data.max_retries
    if webhook_data.retry_delay_seconds is not None:
        webhook.retry_delay_seconds = webhook_data.retry_delay_seconds

    await db.commit()
    await db.refresh(webhook)

    return webhook


@router.delete("/webhook-configs/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook_config(
    request: Request,
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a webhook configuration

    - **webhook_id**: Webhook config ID (UUID)
    """
    user_id = request.state.user_id

    result = await db.execute(
        select(WebhookConfig).where(
            WebhookConfig.id == webhook_id,
            WebhookConfig.user_id == user_id,
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Webhook configuration not found",
                }
            },
        )

    await db.delete(webhook)
    await db.commit()

    return None


@router.post("/webhook-configs/{webhook_id}/regenerate-secret", response_model=WebhookConfigCreateResponse)
async def regenerate_webhook_secret(
    request: Request,
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Regenerate webhook secret

    - **webhook_id**: Webhook config ID (UUID)

    Returns the new secret (only shown once)
    """
    user_id = request.state.user_id

    result = await db.execute(
        select(WebhookConfig).where(
            WebhookConfig.id == webhook_id,
            WebhookConfig.user_id == user_id,
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Webhook configuration not found",
                }
            },
        )

    # Generate new secret
    webhook.secret = WebhookConfig.generate_secret()

    await db.commit()
    await db.refresh(webhook)

    return webhook


@router.post("/webhook-configs/{webhook_id}/test", response_model=WebhookTestResponse)
async def test_webhook(
    request: Request,
    webhook_id: UUID,
    test_data: WebhookTestRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Test webhook delivery

    - **webhook_id**: Webhook config ID (UUID)
    - **event_type**: Event type to test
    - **test_payload**: Test payload data
    """
    user_id = request.state.user_id

    result = await db.execute(
        select(WebhookConfig).where(
            WebhookConfig.id == webhook_id,
            WebhookConfig.user_id == user_id,
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Webhook configuration not found",
                }
            },
        )

    # Send test webhook
    payload = {
        "project_id": "test_project",
        "test": True,
        **test_data.test_payload,
    }

    success = await WebhookService.send_webhook(
        db, webhook, test_data.event_type, payload
    )

    # Get the last webhook log for response details
    from app.models.webhook_log import WebhookLog

    log_result = await db.execute(
        select(WebhookLog)
        .where(WebhookLog.event_type == test_data.event_type)
        .order_by(WebhookLog.sent_at.desc())
        .limit(1)
    )
    log = log_result.scalar_one_or_none()

    return WebhookTestResponse(
        success=success,
        status_code=log.response_status if log else None,
        response_body=log.response_body if log else None,
        error=None if success else "Webhook delivery failed",
    )

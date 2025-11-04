"""
Webhook integration API endpoints
"""

import httpx
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.webhook_log import WebhookLog
from app.schemas.webhook import WebhookPayload, WebhookResponse
from app.config import settings

router = APIRouter()


@router.post(
    "/webhooks/connected-one",
    response_model=WebhookResponse,
    status_code=status.HTTP_200_OK,
)
async def receive_webhook(
    payload: WebhookPayload,
    db: AsyncSession = Depends(get_db),
):
    """
    Receive webhook from Connected One

    - **event_type**: Event type (required)
    - **data**: Event data (required)
    - **timestamp**: Event timestamp (optional, auto-generated)
    """

    # Log webhook receipt
    log = WebhookLog(
        event_type=f"received_{payload.event_type}",
        payload={"event_type": payload.event_type, "data": payload.data},
        response_status=200,
        response_body="Webhook received",
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    return WebhookResponse(
        status="received",
        webhook_log_id=str(log.id),
        message="Webhook processed successfully",
    )


@router.post(
    "/webhooks/send",
    response_model=WebhookResponse,
    status_code=status.HTTP_200_OK,
)
async def send_webhook(
    payload: WebhookPayload,
    db: AsyncSession = Depends(get_db),
):
    """
    Send webhook to Connected One (internal API)

    - **event_type**: Event type (required)
    - **data**: Event data (required)
    - **timestamp**: Event timestamp (optional, auto-generated)
    """

    if not settings.CONNECTED_ONE_WEBHOOK_URL:
        return WebhookResponse(
            status="skipped",
            message="Connected One webhook URL not configured",
        )

    # Prepare payload
    webhook_data = {
        "event_type": payload.event_type,
        "data": payload.data,
        "timestamp": payload.timestamp.isoformat(),
    }

    # Send webhook
    response_status = None
    response_body = None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                settings.CONNECTED_ONE_WEBHOOK_URL,
                json=webhook_data,
                headers={
                    "Authorization": f"Bearer {settings.CONNECTED_ONE_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            response_status = response.status_code
            response_body = response.text

            response.raise_for_status()

    except httpx.HTTPError as e:
        response_status = getattr(e.response, "status_code", None) if hasattr(e, "response") else 500
        response_body = str(e)

    # Log webhook delivery
    log = WebhookLog(
        event_type=payload.event_type,
        payload=webhook_data,
        response_status=response_status,
        response_body=response_body,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    if response_status and 200 <= response_status < 300:
        return WebhookResponse(
            status="sent",
            webhook_log_id=str(log.id),
            response_status=response_status,
            message="Webhook sent successfully",
        )
    else:
        return WebhookResponse(
            status="failed",
            webhook_log_id=str(log.id),
            response_status=response_status,
            message=f"Webhook delivery failed: {response_body}",
        )

"""
Connected One proxy endpoints
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.database import get_db
from app.services.connected_one_service import ConnectedOneService
from app.services.webhook_service import WebhookService
from app.schemas.connected_one import (
    FunnelsResponse,
    ProjectSettingsSchema,
    HeatmapEventPayload,
)

router = APIRouter()


@router.get("/connected-one/funnels/{project_id}", response_model=FunnelsResponse)
async def get_funnels(
    request: Request,
    project_id: str,
    connected_one_api_key: str = Header(..., alias="X-Connected-One-API-Key"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get funnel information from Connected One

    - **project_id**: Project ID
    - **X-Connected-One-API-Key**: Connected One API key (header)

    This endpoint proxies requests to Connected One API
    """
    service = ConnectedOneService(api_key=connected_one_api_key)

    try:
        funnels_data = await service.get_funnels(project_id)
        return funnels_data
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail={
                "error": {
                    "code": "CONNECTED_ONE_ERROR",
                    "message": f"Connected One API error: {e.response.text}",
                }
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "SERVER_ERROR",
                    "message": f"Failed to fetch funnels: {str(e)}",
                }
            },
        )


@router.get("/connected-one/projects/{project_id}/settings", response_model=ProjectSettingsSchema)
async def get_project_settings(
    request: Request,
    project_id: str,
    connected_one_api_key: str = Header(..., alias="X-Connected-One-API-Key"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get project settings from Connected One

    - **project_id**: Project ID
    - **X-Connected-One-API-Key**: Connected One API key (header)

    This endpoint proxies requests to Connected One API
    """
    service = ConnectedOneService(api_key=connected_one_api_key)

    try:
        settings_data = await service.get_project_settings(project_id)
        return settings_data
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail={
                "error": {
                    "code": "CONNECTED_ONE_ERROR",
                    "message": f"Connected One API error: {e.response.text}",
                }
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "SERVER_ERROR",
                    "message": f"Failed to fetch project settings: {str(e)}",
                }
            },
        )


@router.post("/connected-one/webhooks/heatmap-events")
async def send_heatmap_event(
    request: Request,
    event_data: HeatmapEventPayload,
    connected_one_api_key: str = Header(..., alias="X-Connected-One-API-Key"),
    webhook_signature: str = Header(..., alias="X-Webhook-Signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Send heatmap event to Connected One webhook

    - **event_data**: Event payload
    - **X-Connected-One-API-Key**: Connected One API key (header)
    - **X-Webhook-Signature**: HMAC-SHA256 signature (header)

    This endpoint proxies webhook events to Connected One
    """
    user_id = request.state.user_id

    # Verify webhook signature
    # Note: In production, you should validate the signature against a stored secret
    # For now, we'll just pass it through

    service = ConnectedOneService(api_key=connected_one_api_key)

    try:
        response_data = await service.send_heatmap_event(
            event_data.project_id, event_data.dict()
        )

        # Log the webhook delivery
        await WebhookService.send_to_user_webhooks(
            db,
            user_id,
            event_data.event_type,
            event_data.dict(),
        )

        return response_data
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail={
                "error": {
                    "code": "CONNECTED_ONE_ERROR",
                    "message": f"Connected One webhook error: {e.response.text}",
                }
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "SERVER_ERROR",
                    "message": f"Failed to send webhook: {str(e)}",
                }
            },
        )

"""
Webhook service - Send webhooks with HMAC signature
"""

import hmac
import hashlib
import json
from typing import Any, Dict
from datetime import datetime
from uuid import UUID
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook_config import WebhookConfig
from app.models.webhook_log import WebhookLog


class WebhookService:
    """Service for sending webhooks to configured endpoints"""

    @staticmethod
    def generate_signature(payload: Dict[str, Any], secret: str) -> str:
        """
        Generate HMAC-SHA256 signature for webhook payload

        Args:
            payload: Webhook payload dict
            secret: Webhook secret

        Returns:
            Base64-encoded HMAC signature
        """
        payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True)
        signature = hmac.new(
            secret.encode("utf-8"),
            payload_json.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return signature

    @staticmethod
    async def send_webhook(
        session: AsyncSession,
        webhook_config: WebhookConfig,
        event_type: str,
        payload: Dict[str, Any],
    ) -> bool:
        """
        Send webhook to configured endpoint

        Args:
            session: Database session
            webhook_config: Webhook configuration
            event_type: Event type (e.g., "funnel.completed")
            payload: Event payload

        Returns:
            True if webhook was sent successfully, False otherwise
        """
        # Check if webhook is enabled for this event type
        if not webhook_config.is_enabled_for_event(event_type):
            return False

        # Add event type and timestamp to payload
        full_payload = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **payload,
        }

        # Generate HMAC signature
        signature = WebhookService.generate_signature(
            full_payload, webhook_config.secret
        )

        # Send webhook
        log = WebhookLog(
            event_type=event_type,
            payload=full_payload,
            sent_at=datetime.utcnow(),
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    webhook_config.url,
                    json=full_payload,
                    headers={
                        "Content-Type": "application/json",
                        "X-Webhook-Signature": signature,
                        "User-Agent": "Heatmap-Webhook/1.0",
                    },
                )

                log.response_status = response.status_code
                log.response_body = response.text[:1000]  # Limit to 1000 chars

                # Update webhook config stats
                webhook_config.last_triggered_at = datetime.utcnow()
                webhook_config.total_deliveries += 1

                if response.status_code >= 400:
                    webhook_config.failed_deliveries += 1
                    session.add(log)
                    await session.commit()
                    return False

                session.add(log)
                await session.commit()
                return True

        except Exception as e:
            log.response_status = 0
            log.response_body = f"Error: {str(e)}"

            webhook_config.failed_deliveries += 1
            session.add(log)
            await session.commit()
            return False

    @staticmethod
    async def send_to_user_webhooks(
        session: AsyncSession,
        user_id: UUID,
        event_type: str,
        payload: Dict[str, Any],
    ) -> int:
        """
        Send webhook to all active webhooks for a user

        Args:
            session: Database session
            user_id: User ID
            event_type: Event type
            payload: Event payload

        Returns:
            Number of successful webhook deliveries
        """
        # Get all active webhook configs for user
        result = await session.execute(
            select(WebhookConfig).where(
                WebhookConfig.user_id == user_id,
                WebhookConfig.is_active == True,
            )
        )
        webhook_configs = result.scalars().all()

        success_count = 0
        for webhook_config in webhook_configs:
            if await WebhookService.send_webhook(
                session, webhook_config, event_type, payload
            ):
                success_count += 1

        return success_count

    @staticmethod
    def verify_signature(payload: Dict[str, Any], signature: str, secret: str) -> bool:
        """
        Verify HMAC-SHA256 signature for incoming webhook

        Args:
            payload: Webhook payload
            signature: Signature to verify
            secret: Webhook secret

        Returns:
            True if signature is valid, False otherwise
        """
        expected_signature = WebhookService.generate_signature(payload, secret)
        return hmac.compare_digest(signature, expected_signature)

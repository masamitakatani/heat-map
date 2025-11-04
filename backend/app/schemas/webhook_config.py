"""
Webhook Configuration schemas for request/response validation
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl


class WebhookConfigBase(BaseModel):
    """Base webhook config schema"""

    name: str = Field(..., min_length=1, max_length=255, description="Webhook name")
    url: str = Field(..., description="Webhook URL")
    event_types: list[str] = Field(
        default_factory=list,
        description="Event types to send (empty = all events)",
    )


class WebhookConfigCreate(WebhookConfigBase):
    """Webhook config creation schema"""

    max_retries: int = Field(3, ge=0, le=10, description="Max retry attempts")
    retry_delay_seconds: int = Field(60, ge=0, description="Retry delay in seconds")


class WebhookConfigUpdate(BaseModel):
    """Webhook config update schema"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[str] = None
    is_active: Optional[bool] = None
    event_types: Optional[list[str]] = None
    max_retries: Optional[int] = Field(None, ge=0, le=10)
    retry_delay_seconds: Optional[int] = Field(None, ge=0)


class WebhookConfigResponse(WebhookConfigBase):
    """Webhook config response schema (without secret)"""

    id: UUID
    user_id: UUID
    is_active: bool
    max_retries: int
    retry_delay_seconds: int
    last_triggered_at: Optional[datetime]
    total_deliveries: int
    failed_deliveries: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WebhookConfigCreateResponse(WebhookConfigResponse):
    """Webhook config creation response (includes secret, shown only once)"""

    secret: str = Field(..., description="Webhook secret (only shown once on creation)")

    class Config:
        from_attributes = True


class WebhookConfigList(BaseModel):
    """Webhook config list response"""

    webhooks: list[WebhookConfigResponse]
    total: int


class WebhookTestRequest(BaseModel):
    """Webhook test request"""

    event_type: str = Field(..., description="Event type to test")
    test_payload: dict = Field(default_factory=dict, description="Test payload data")


class WebhookTestResponse(BaseModel):
    """Webhook test response"""

    success: bool
    status_code: Optional[int]
    response_body: Optional[str]
    error: Optional[str]

"""
Webhook schemas
"""

from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class WebhookPayload(BaseModel):
    """Webhook payload schema"""

    event_type: str = Field(..., max_length=100)
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class WebhookResponse(BaseModel):
    """Webhook response schema"""

    status: str
    webhook_log_id: Optional[str] = None
    response_status: Optional[int] = None
    message: str = "Webhook processed successfully"

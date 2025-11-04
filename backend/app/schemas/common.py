"""
Common schemas
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Error response schema"""

    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ErrorResponseWrapper(BaseModel):
    """Error response wrapper"""

    error: ErrorResponse

"""
Authentication middleware - API Key validation
"""

from typing import Callable
from datetime import datetime
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.api_key import APIKey


class AuthMiddleware(BaseHTTPMiddleware):
    """
    API Key authentication middleware

    All endpoints except health check require Bearer token authentication
    """

    # Paths that don't require authentication
    EXCLUDED_PATHS = [
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
    ]

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process request and validate API key"""

        # Skip authentication for excluded paths
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)

        # Get Authorization header
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Missing Authorization header",
                    }
                },
            )

        # Validate Bearer token format
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise ValueError("Invalid authentication scheme")
        except ValueError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Invalid Authorization header format. Use: Bearer <token>",
                    }
                },
            )

        # Validate API key from database
        async with AsyncSessionLocal() as session:
            try:
                result = await session.execute(
                    select(APIKey).where(APIKey.key == token)
                )
                api_key = result.scalar_one_or_none()

                if not api_key or not api_key.is_valid():
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={
                            "error": {
                                "code": "UNAUTHORIZED",
                                "message": "Invalid or expired API key",
                            }
                        },
                    )

                # Update last used timestamp
                api_key.last_used_at = datetime.utcnow()
                await session.commit()

                # Store user_id in request state for later use
                request.state.user_id = api_key.user_id
                request.state.api_key_id = api_key.id

            except Exception as e:
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={
                        "error": {
                            "code": "SERVER_ERROR",
                            "message": "Authentication failed",
                        }
                    },
                )

        # Authentication successful, proceed with request
        return await call_next(request)

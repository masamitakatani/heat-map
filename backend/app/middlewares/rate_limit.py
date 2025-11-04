"""
Rate limiting middleware
"""

import time
from typing import Callable, Dict
from collections import defaultdict
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware

    Limits requests per minute based on endpoint type:
    - /events/* : 100 req/min
    - /heatmaps/* : 60 req/min
    - /funnels/* (POST/PUT/DELETE) : 30 req/min
    - Other GET : 120 req/min
    """

    def __init__(self, app):
        super().__init__(app)
        # Store request counts: {client_ip: {endpoint_key: [(timestamp, count)]}}
        self.request_counts: Dict[str, Dict[str, list]] = defaultdict(
            lambda: defaultdict(list)
        )
        self.window_size = 60  # 1 minute in seconds

    def _get_rate_limit(self, path: str, method: str) -> int:
        """Get rate limit for specific endpoint"""
        if path.startswith("/api/v1/events"):
            return settings.RATE_LIMIT_EVENTS
        elif path.startswith("/api/v1/heatmaps"):
            return settings.RATE_LIMIT_HEATMAPS
        elif path.startswith("/api/v1/funnels") and method in ["POST", "PUT", "DELETE"]:
            return settings.RATE_LIMIT_FUNNELS
        else:
            return settings.RATE_LIMIT_GENERAL

    def _clean_old_requests(self, client_ip: str, endpoint_key: str) -> None:
        """Remove requests older than window_size"""
        current_time = time.time()
        cutoff_time = current_time - self.window_size

        if endpoint_key in self.request_counts[client_ip]:
            self.request_counts[client_ip][endpoint_key] = [
                (timestamp, count)
                for timestamp, count in self.request_counts[client_ip][endpoint_key]
                if timestamp > cutoff_time
            ]

    def _get_request_count(self, client_ip: str, endpoint_key: str) -> int:
        """Get total request count in current window"""
        return sum(
            count for _, count in self.request_counts[client_ip][endpoint_key]
        )

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process request and check rate limits"""

        # Skip rate limiting for health check
        if request.url.path == "/health":
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Create endpoint key (path + method)
        endpoint_key = f"{request.url.path}:{request.method}"

        # Clean old requests
        self._clean_old_requests(client_ip, endpoint_key)

        # Get rate limit for this endpoint
        rate_limit = self._get_rate_limit(request.url.path, request.method)

        # Get current request count
        current_count = self._get_request_count(client_ip, endpoint_key)

        # Check if rate limit exceeded
        if current_count >= rate_limit:
            remaining = 0
            reset_at = time.time() + self.window_size

            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={
                    "Retry-After": str(self.window_size),
                },
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded. Try again in {self.window_size} seconds.",
                        "details": {
                            "limit": rate_limit,
                            "remaining": remaining,
                            "reset_at": reset_at,
                        },
                    }
                },
            )

        # Record this request
        current_time = time.time()
        self.request_counts[client_ip][endpoint_key].append((current_time, 1))

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        remaining = rate_limit - current_count - 1
        response.headers["X-RateLimit-Limit"] = str(rate_limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(int(current_time + self.window_size))

        return response

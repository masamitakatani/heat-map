"""
Connected One integration service - Proxy API for Connected One
"""

from typing import Any, Dict, List, Optional
import httpx
from app.config import settings


class ConnectedOneService:
    """Service for integrating with Connected One API"""

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        """
        Initialize Connected One service

        Args:
            api_key: Connected One API key
            base_url: Base URL for Connected One API (defaults to settings)
        """
        self.api_key = api_key
        self.base_url = base_url or settings.CONNECTED_ONE_API_URL
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def get_funnels(self, project_id: str) -> Dict[str, Any]:
        """
        Get funnel information from Connected One

        Args:
            project_id: Project ID

        Returns:
            Funnel data from Connected One API

        Raises:
            httpx.HTTPError: If API request fails
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/v1/funnels/{project_id}",
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    async def get_project_settings(self, project_id: str) -> Dict[str, Any]:
        """
        Get project settings from Connected One

        Args:
            project_id: Project ID

        Returns:
            Project settings from Connected One API

        Raises:
            httpx.HTTPError: If API request fails
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/v1/projects/{project_id}/settings",
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    async def send_heatmap_event(
        self, project_id: str, event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send heatmap event to Connected One webhook

        Args:
            project_id: Project ID
            event_data: Event data to send

        Returns:
            Response from Connected One API

        Raises:
            httpx.HTTPError: If API request fails
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/v1/webhooks/heatmap-events",
                headers=self.headers,
                json=event_data,
            )
            response.raise_for_status()
            return response.json()

    async def validate_api_key(self) -> bool:
        """
        Validate Connected One API key

        Returns:
            True if API key is valid, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/v1/auth/validate",
                    headers=self.headers,
                )
                return response.status_code == 200
        except Exception:
            return False

"""
FastAPI application entry point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db, close_db
from app.middlewares.auth import AuthMiddleware
from app.middlewares.rate_limit import RateLimitMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middlewares
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)


# Health check endpoint (no auth required)
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "version": settings.VERSION,
    }


# API routes
from app.routes import (
    users,
    sessions,
    events,
    heatmaps,
    funnels,
    webhooks,
    api_keys,
    webhook_configs,
    connected_one,
)

app.include_router(users.router, prefix=settings.API_V1_PREFIX, tags=["Users"])
app.include_router(sessions.router, prefix=settings.API_V1_PREFIX, tags=["Sessions"])
app.include_router(events.router, prefix=settings.API_V1_PREFIX, tags=["Events"])
app.include_router(heatmaps.router, prefix=settings.API_V1_PREFIX, tags=["Heatmaps"])
app.include_router(funnels.router, prefix=settings.API_V1_PREFIX, tags=["Funnels"])
app.include_router(webhooks.router, prefix=settings.API_V1_PREFIX, tags=["Webhooks"])
app.include_router(api_keys.router, prefix=settings.API_V1_PREFIX, tags=["API Keys"])
app.include_router(
    webhook_configs.router, prefix=settings.API_V1_PREFIX, tags=["Webhook Configs"]
)
app.include_router(
    connected_one.router, prefix=settings.API_V1_PREFIX, tags=["Connected One"]
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all unhandled exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "SERVER_ERROR",
                "message": "Internal server error occurred",
                "details": str(exc) if settings.DEBUG else None,
            }
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )

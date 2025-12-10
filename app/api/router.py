"""
API Router
Combines all v1 API routers
"""
from fastapi import APIRouter

from app.api.v1 import candidates, admin, scraper, proxy

# Create main API router
api_router = APIRouter(prefix="/api")

# Include all v1 routers
api_router.include_router(candidates.router)
api_router.include_router(admin.router)
api_router.include_router(scraper.router)
api_router.include_router(proxy.router)

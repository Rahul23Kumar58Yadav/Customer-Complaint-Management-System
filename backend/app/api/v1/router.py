from fastapi import APIRouter

from app.api.v1.routes_complaints import router as complaints_router
from app.api.v1.routes_ai import router as ai_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(complaints_router)
api_router.include_router(ai_router)


@api_router.get("/", tags=["system"])
def api_root():
    """Simple index so hitting /api/v1 directly doesn't 404 - useful when
    sanity-checking a deployment before wiring up the frontend."""
    return {
        "message": "Pharma Complaint Management System API v1",
        "endpoints": {
            "complaints": "/api/v1/complaints",
            "extract_file": "/api/v1/ai/extract/file",
            "extract_text": "/api/v1/ai/extract/text",
            "chat": "/api/v1/ai/chat",
            "stats": "/api/v1/complaints/stats/summary",
        },
    }
import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.db.init_db import init_db
from app.api.v1.router import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    if not settings.GROQ_API_KEY:
        logger.warning("Starting up WITHOUT a configured GROQ_API_KEY — AI endpoints will fail.")
    init_db()
    logger.info("Application startup complete (env=%s)", settings.APP_ENV)
    yield
    logger.info("Application shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered customer complaint intake & triage for API/FDF QMS",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Attaches a request ID + timing to every request, for tracing a complaint's
    AI pipeline run across logs (extraction -> risk -> CAPA -> summary)."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start = time.perf_counter()

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 1)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = str(duration_ms)

        logger.info(
            "%s %s -> %s (%sms) [%s]",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            request_id,
        )
        return response


app.add_middleware(RequestContextMiddleware)


# --- Global exception handlers ---
# Ensures the frontend always gets a consistent JSON error shape ({"detail": "..."}),
# even for unexpected DB/LLM failures, rather than a raw 500 traceback leaking internals.

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Invalid request data.", "errors": exc.errors()},
    )


@app.exception_handler(SQLAlchemyError)
async def db_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Database error on %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database temporarily unavailable. Please try again."},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred."},
    )


app.include_router(api_router)


@app.get("/health", tags=["system"])
def health():
    """Liveness/readiness probe - also surfaces whether the Groq key is configured,
    so a frontend 'backend offline' banner can distinguish DB-down vs AI-misconfigured."""
    return {
        "status": "ok",
        "env": settings.APP_ENV,
        "groq_configured": bool(settings.GROQ_API_KEY),
    }
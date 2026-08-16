import logging

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
# Import models so they register on Base.metadata before create_all
from app.models import complaint, document  # noqa: F401

logger = logging.getLogger(__name__)


def init_db() -> None:
    """Creates all tables if they don't exist. For anything beyond local/dev use,
    prefer Alembic migrations (see backend/alembic/) so schema changes are
    versioned and reversible - this is a convenience for quick local startup."""
    Base.metadata.create_all(bind=engine)
    logger.info(
        "Database tables ensured (%d models registered)", len(Base.metadata.tables)
    )


def reset_db() -> None:
    """DEV ONLY - drops and recreates all tables. Never call this in staging/production."""
    if settings.is_production:
        raise RuntimeError("reset_db() is disabled in production to prevent accidental data loss.")
    logger.warning("Dropping and recreating all tables (env=%s)", settings.APP_ENV)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
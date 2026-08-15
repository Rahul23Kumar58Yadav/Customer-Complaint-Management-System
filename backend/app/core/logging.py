"""
Logging configuration.

Development: human-readable console output.
Production/staging: structured JSON logs (one line per record) so they can be
ingested by a log aggregator - relevant for a QMS system where AI-driven
decisions (risk classification, CAPA suggestions) should be traceable.
"""
import json
import logging
import sys
from datetime import datetime, timezone

from app.core.config import settings


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        # Allow callers to attach extra structured context, e.g.
        # logger.info("complaint extracted", extra={"complaint_id": id, "risk": "High Risk"})
        for key in ("complaint_id", "request_id", "duration_ms"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        return json.dumps(payload)


def setup_logging() -> None:
    root = logging.getLogger()
    root.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))

    handler = logging.StreamHandler(sys.stdout)
    if settings.is_production:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")
        )

    root.handlers = [handler]

    # Quiet noisy third-party libraries regardless of environment.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("groq").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(
        logging.WARNING if settings.is_production else logging.INFO
    )

    logging.getLogger(__name__).info(
        "Logging configured (env=%s, level=%s)", settings.APP_ENV, settings.LOG_LEVEL
    )
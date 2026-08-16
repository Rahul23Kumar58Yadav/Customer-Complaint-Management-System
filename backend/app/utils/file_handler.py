"""
Utilities for safely handling uploaded complaint documents: filename
sanitization, size/type validation, and content hashing.
"""
import hashlib
import logging
import re
import unicodedata

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "eml"}
DANGEROUS_EXTENSIONS = {"exe", "sh", "bat", "cmd", "com", "scr", "js", "vbs", "msi", "app"}


class FileValidationError(ValueError):
    """Raised when an uploaded file fails validation."""


def get_extension(filename: str) -> str:
    return filename.lower().rsplit(".", 1)[-1] if "." in filename else ""


def sanitize_filename(filename: str) -> str:
    filename = unicodedata.normalize("NFKD", filename)
    filename = filename.replace("\\", "/").split("/")[-1]
    filename = re.sub(r"[^A-Za-z0-9._\-]", "_", filename)
    filename = re.sub(r"_{2,}", "_", filename).strip("._") or "unnamed_file"
    return filename[:255]


def validate_upload(filename: str, content: bytes) -> None:
    ext = get_extension(filename)

    if not ext:
        raise FileValidationError("File must have an extension (.pdf, .docx, .txt, .eml).")

    if ext in DANGEROUS_EXTENSIONS:
        logger.warning("Rejected upload with dangerous extension: %s", filename)
        raise FileValidationError(f"File type '.{ext}' is not permitted.")

    if ext not in ALLOWED_EXTENSIONS:
        raise FileValidationError(
            f"Unsupported file type '.{ext}'. Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
        )

    if len(content) == 0:
        raise FileValidationError("File is empty.")

    if len(content) > settings.max_upload_bytes:
        raise FileValidationError(f"File exceeds the {settings.MAX_UPLOAD_MB}MB limit.")


def compute_content_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def human_readable_size(num_bytes: int) -> str:
    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024:
            return f"{size:.1f}{unit}"
        size /= 1024
    return f"{size:.1f}TB"
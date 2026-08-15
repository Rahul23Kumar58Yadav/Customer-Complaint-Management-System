import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, Enum, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DocumentType(str, enum.Enum):
    PDF = "pdf"
    DOCX = "docx"
    EML = "eml"
    TXT = "txt"
    PASTED_TEXT = "pasted_text"


class ExtractionStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class ComplaintDocument(Base):
    __tablename__ = "complaint_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    complaint_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True
    )

    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    document_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType))
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    extraction_status: Mapped[ExtractionStatus] = mapped_column(
        Enum(ExtractionStatus), default=ExtractionStatus.PENDING
    )
    extraction_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    extraction_confidence: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    extraction_model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reasoning_model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", backref="documents")
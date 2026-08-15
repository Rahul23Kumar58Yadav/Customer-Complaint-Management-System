import enum
import uuid
from datetime import datetime, date

from sqlalchemy import String, Text, Date, DateTime, Enum, Float, Integer, JSON, Index, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ComplaintStatus(str, enum.Enum):
    PENDING_TRIAGE = "pending_triage"
    UNDER_REVIEW = "under_review"
    INVESTIGATING = "investigating"
    CAPA_ASSIGNED = "capa_assigned"
    CLOSED = "closed"


class SeverityLevel(str, enum.Enum):
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"


class PriorityLevel(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Complaint(Base):
    __tablename__ = "complaints"
    __table_args__ = (
        Index("ix_complaints_status", "status"),
        Index("ix_complaints_severity", "initial_severity"),
        Index("ix_complaints_batch_lot", "batch_lot_number"),
        Index("ix_complaints_created_at", "created_at"),
        CheckConstraint(
            "ai_completeness_score IS NULL OR (ai_completeness_score >= 0 AND ai_completeness_score <= 100)",
            name="ck_completeness_score_range",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # --- 1. Origin & Customer Details ---
    complaint_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # --- 2. Product & Batch Identification ---
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_strength_grade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    batch_lot_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    manufacturing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    quantity_affected: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity_unit: Mapped[str | None] = mapped_column(String(20), default="kg")

    # --- 3. Complaint Details ---
    complaint_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    complaint_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    detailed_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- 4. Initial Assessment & Priority ---
    initial_severity: Mapped[SeverityLevel | None] = mapped_column(Enum(SeverityLevel), nullable=True)
    priority: Mapped[PriorityLevel | None] = mapped_column(Enum(PriorityLevel), nullable=True)

    # --- AI Copilot outputs (bonus features) ---
    ai_completeness_score: Mapped[int | None] = mapped_column(Integer, nullable=True)      # 0-100
    ai_missing_fields: Mapped[list | None] = mapped_column(JSON, nullable=True)
    ai_risk_classification: Mapped[str | None] = mapped_column(String(50), nullable=True)   # e.g. "High Risk"
    ai_risk_rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_root_cause_suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_capa_recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_duplicate_of: Mapped[str | None] = mapped_column(String(36), nullable=True)  # complaint.id if dup found
    ai_duplicate_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_extraction_confidence: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # per-field confidence

    status: Mapped[ComplaintStatus] = mapped_column(Enum(ComplaintStatus), default=ComplaintStatus.PENDING_TRIAGE)

    source_document_text: Mapped[str | None] = mapped_column(Text, nullable=True)  # raw parsed text, for audit/dup-check

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def is_high_priority(self) -> bool:
        """Convenience helper used by dashboards/notifications - true if either the
        reviewer-set priority or the AI risk classification indicates urgency."""
        if self.priority == PriorityLevel.HIGH:
            return True
        if self.ai_risk_classification in {"Critical Risk", "High Risk"}:
            return True
        return False
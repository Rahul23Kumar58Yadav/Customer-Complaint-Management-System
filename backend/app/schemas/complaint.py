from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

VALID_SEVERITIES = {"critical", "major", "minor"}
VALID_PRIORITIES = {"high", "medium", "low"}
VALID_STATUSES = {"pending_triage", "under_review", "investigating", "capa_assigned", "closed"}


class ComplaintBase(BaseModel):
    complaint_source: str | None = None
    customer_name: str | None = None

    product_name: str | None = None
    product_strength_grade: str | None = None
    batch_lot_number: str | None = None
    manufacturing_date: date | None = None
    expiry_date: date | None = None
    quantity_affected: float | None = None
    quantity_unit: str | None = "kg"

    complaint_type: str | None = None
    complaint_date: date | None = None
    detailed_description: str | None = None

    initial_severity: str | None = None
    priority: str | None = None

    @field_validator("initial_severity")
    @classmethod
    def _validate_severity(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_SEVERITIES:
            raise ValueError(f"initial_severity must be one of {sorted(VALID_SEVERITIES)}")
        return v

    @field_validator("priority")
    @classmethod
    def _validate_priority(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_PRIORITIES:
            raise ValueError(f"priority must be one of {sorted(VALID_PRIORITIES)}")
        return v

    @field_validator("quantity_affected")
    @classmethod
    def _validate_quantity(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("quantity_affected cannot be negative")
        return v

    @field_validator("customer_name", "product_name", "detailed_description")
    @classmethod
    def _strip_whitespace(cls, v: str | None) -> str | None:
        return v.strip() if isinstance(v, str) else v

    @model_validator(mode="after")
    def _validate_date_order(self) -> "ComplaintBase":
        if (
            self.manufacturing_date
            and self.expiry_date
            and self.manufacturing_date >= self.expiry_date
        ):
            raise ValueError("manufacturing_date must be before expiry_date")
        return self


class ComplaintCreate(ComplaintBase):
    pass


class ComplaintUpdate(ComplaintBase):
    status: str | None = None

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {sorted(VALID_STATUSES)}")
        return v


class ComplaintOut(ComplaintBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str

    ai_completeness_score: int | None = None
    ai_missing_fields: list[str] | None = None
    ai_risk_classification: str | None = None
    ai_risk_rationale: str | None = None
    ai_root_cause_suggestion: str | None = None
    ai_capa_recommendation: str | None = None
    ai_summary: str | None = None
    ai_duplicate_of: str | None = None
    ai_duplicate_score: float | None = None
    ai_extraction_confidence: dict | None = None

    created_at: datetime
    updated_at: datetime

    @property
    def is_high_priority(self) -> bool:
        return self.priority == "high" or self.ai_risk_classification in {
            "Critical Risk",
            "High Risk",
        }


class ComplaintListResponse(BaseModel):
    items: list[ComplaintOut]
    total: int
    skip: int
    limit: int


class ComplaintStatsResponse(BaseModel):
    total: int
    by_status: dict[str, int]
    by_risk_classification: dict[str, int]
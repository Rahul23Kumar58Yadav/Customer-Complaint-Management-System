from pydantic import BaseModel, field_validator, Field

MAX_PASTED_TEXT_CHARS = 20000
MAX_CHAT_MESSAGE_CHARS = 2000


class ExtractionTextRequest(BaseModel):
    """Used when the user pastes raw complaint text/email instead of uploading a file."""
    text: str = Field(..., min_length=1, max_length=MAX_PASTED_TEXT_CHARS)

    @field_validator("text")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text cannot be blank or whitespace-only")
        return v


class ExtractedFields(BaseModel):
    complaint_source: str | None = None
    customer_name: str | None = None
    product_name: str | None = None
    product_strength_grade: str | None = None
    batch_lot_number: str | None = None
    manufacturing_date: str | None = None
    expiry_date: str | None = None
    quantity_affected: str | None = None
    quantity_unit: str | None = None
    complaint_type: str | None = None
    complaint_date: str | None = None
    detailed_description: str | None = None
    initial_severity: str | None = None
    priority: str | None = None


class ExtractionResponse(BaseModel):
    extracted_fields: ExtractedFields
    extraction_confidence: dict[str, float]
    completeness_score: int = Field(..., ge=0, le=100)
    missing_fields: list[str]
    risk_classification: str | None = None
    risk_rationale: str | None = None
    root_cause_suggestion: str | None = None
    capa_recommendation: str | None = None
    summary: str | None = None
    duplicate_of: str | None = None
    duplicate_score: float | None = Field(None, ge=0.0, le=1.0)
    raw_text: str

    @field_validator("extraction_confidence")
    @classmethod
    def _clamp_confidence_values(cls, v: dict[str, float]) -> dict[str, float]:
        # LLM-reported confidence scores are advisory, not guaranteed well-formed -
        # clamp rather than reject so a single out-of-range value doesn't fail
        # an otherwise-good extraction.
        return {k: max(0.0, min(1.0, float(val))) for k, val in v.items()}


class ChatRequest(BaseModel):
    complaint_id: str | None = None
    message: str = Field(..., min_length=1, max_length=MAX_CHAT_MESSAGE_CHARS)
    # Optional: current form state so chat has context even before saving
    form_context: dict | None = None

    @field_validator("message")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message cannot be blank or whitespace-only")
        return v.strip()


class ChatResponse(BaseModel):
    reply: str
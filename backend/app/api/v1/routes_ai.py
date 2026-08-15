import logging
import time

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.schemas.ai import (
    ExtractionTextRequest,
    ExtractionResponse,
    ChatRequest,
    ChatResponse,
)
from app.ai.document_utils import extract_text_from_bytes
from app.ai.langgraph_workflow.graph import complaint_workflow
from app.ai.llm_client import call_llm_text
from app.crud.complaint import list_recent_for_duplicate_check
from app.models.document import ComplaintDocument, DocumentType, ExtractionStatus
from app.utils.file_handler import validate_upload, sanitize_filename, FileValidationError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])

EXT_TO_DOCTYPE = {
    "pdf": DocumentType.PDF,
    "docx": DocumentType.DOCX,
    "eml": DocumentType.EML,
    "txt": DocumentType.TXT,
}


def _build_duplicate_context(db: Session) -> str:
    """Serialize recent complaints as 'id|||product|batch|description' lines for
    duplicate_detection_node's weighted field comparison."""
    recent = list_recent_for_duplicate_check(db)
    lines = []
    for c in recent:
        product = (c.product_name or "").replace("|", " ")
        batch = (c.batch_lot_number or "").replace("|", " ")
        description = (c.detailed_description or "").replace("|", " ")
        lines.append(f"{c.id}|||{product}|{batch}|{description}")
    return "\n".join(lines)


def _run_workflow(raw_text: str, db: Session) -> tuple[dict, float]:
    initial_state = {
        "raw_text": raw_text,
        "existing_complaints_context": _build_duplicate_context(db),
        "errors": [],
    }
    start = time.perf_counter()
    final_state = complaint_workflow.invoke(initial_state)
    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    return final_state, duration_ms


def _to_extraction_response(raw_text: str, final_state: dict) -> ExtractionResponse:
    return ExtractionResponse(
        extracted_fields=final_state.get("extracted_fields", {}),
        extraction_confidence=final_state.get("extraction_confidence", {}),
        completeness_score=final_state.get("completeness_score", 0),
        missing_fields=final_state.get("missing_fields", []),
        risk_classification=final_state.get("risk_classification"),
        risk_rationale=final_state.get("risk_rationale"),
        root_cause_suggestion=final_state.get("root_cause_suggestion"),
        capa_recommendation=final_state.get("capa_recommendation"),
        summary=final_state.get("summary"),
        duplicate_of=final_state.get("duplicate_of"),
        duplicate_score=final_state.get("duplicate_score"),
        raw_text=raw_text,
    )


def _persist_document_record(
    db: Session,
    raw_text: str,
    final_state: dict,
    document_type: DocumentType,
    filename: str | None = None,
    file_size_bytes: int | None = None,
) -> ComplaintDocument:
    """Logs every extraction attempt (success or failure) for QMS audit traceability,
    independent of whether the reviewer ever saves the resulting complaint."""
    errors = final_state.get("errors", [])
    doc = ComplaintDocument(
        filename=filename,
        document_type=document_type,
        file_size_bytes=file_size_bytes,
        raw_text=raw_text,
        extraction_status=ExtractionStatus.FAILED if errors else ExtractionStatus.SUCCEEDED,
        extraction_error="; ".join(errors) if errors else None,
        extraction_confidence=final_state.get("extraction_confidence"),
        extraction_model_used=settings.GROQ_EXTRACTION_MODEL,
        reasoning_model_used=settings.GROQ_REASONING_MODEL,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/extract/file", response_model=ExtractionResponse)
async def extract_from_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()

    try:
        validate_upload(file.filename, content)
    except FileValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    safe_filename = sanitize_filename(file.filename)
    raw_text = extract_text_from_bytes(safe_filename, content)
    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text from the document")

    ext = safe_filename.lower().rsplit(".", 1)[-1] if "." in safe_filename else ""
    doc_type = EXT_TO_DOCTYPE.get(ext, DocumentType.TXT)

    final_state, duration_ms = _run_workflow(raw_text, db)
    doc = _persist_document_record(
        db, raw_text, final_state, doc_type, filename=safe_filename, file_size_bytes=len(content)
    )

    logger.info(
        "Extraction complete doc_id=%s file=%s duration_ms=%s completeness=%s risk=%s",
        doc.id,
        file.filename,
        duration_ms,
        final_state.get("completeness_score"),
        final_state.get("risk_classification"),
    )

    return _to_extraction_response(raw_text, final_state)


@router.post("/extract/text", response_model=ExtractionResponse)
def extract_from_text(payload: ExtractionTextRequest, db: Session = Depends(get_db)):
    if not payload.text.strip():
        raise HTTPException(status_code=422, detail="Text is empty")

    final_state, duration_ms = _run_workflow(payload.text, db)
    doc = _persist_document_record(db, payload.text, final_state, DocumentType.PASTED_TEXT)

    logger.info(
        "Extraction complete doc_id=%s (pasted text) duration_ms=%s completeness=%s risk=%s",
        doc.id,
        duration_ms,
        final_state.get("completeness_score"),
        final_state.get("risk_classification"),
    )

    return _to_extraction_response(payload.text, final_state)


CHAT_SYSTEM_PROMPT = """You are the AI Complaint Intake Assistant embedded in a pharmaceutical
QMS complaint form. Answer the QA reviewer's questions about the currently loaded complaint using
only the provided form context. Be concise, factual, and QA-appropriate. If asked something not
answerable from the context, say so plainly rather than guessing."""


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=422, detail="Message is empty")

    context_str = str(payload.form_context or {})
    user_prompt = f"Current complaint form data:\n{context_str}\n\nQuestion: {payload.message}"
    try:
        reply = call_llm_text(CHAT_SYSTEM_PROMPT, user_prompt)
    except Exception as exc:  # noqa: BLE001
        logger.exception("chat endpoint failed complaint_id=%s", payload.complaint_id)
        raise HTTPException(status_code=502, detail="AI assistant is temporarily unavailable.") from exc
    return ChatResponse(reply=reply)
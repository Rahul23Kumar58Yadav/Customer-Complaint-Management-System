import logging

from app.ai.llm_client import call_llm_text
from app.ai.langgraph_workflow.state import ComplaintWorkflowState
from app.ai.langgraph_workflow.nodes._node_utils import traced_node, with_llm_retry
from app.core.config import settings

logger = logging.getLogger(__name__)

SUMMARY_SYSTEM_PROMPT = """You write concise 2-3 sentence executive summaries of pharmaceutical
customer complaints for a QA dashboard. Be factual and specific (product, batch, issue, impact).
No preamble, no headers - just the summary text."""


def _fallback_summary(fields: dict, risk: str) -> str:
    product = fields.get("product_name") or "Unknown product"
    batch = fields.get("batch_lot_number") or "unknown batch"
    complaint_type = fields.get("complaint_type") or "quality issue"
    risk_text = f" Preliminary risk: {risk}." if risk else ""
    return f"{complaint_type} reported for {product} (batch {batch}).{risk_text}"


@traced_node("summary")
def summary_node(state: ComplaintWorkflowState) -> ComplaintWorkflowState:
    errors = list(state.get("errors", []))
    fields = state.get("extracted_fields", {})
    risk = state.get("risk_classification", "")

    def _call():
        return call_llm_text(
            system_prompt=SUMMARY_SYSTEM_PROMPT,
            user_prompt=f"Complaint data:\n{fields}",
            model=settings.GROQ_REASONING_MODEL,
        )

    try:
        summary = with_llm_retry(_call, max_retries=settings.GROQ_MAX_RETRIES)
    except Exception as exc:  # noqa: BLE001
        logger.exception("summary_node failed after retries, using deterministic fallback")
        errors.append(f"summary_node: {exc}")
        summary = _fallback_summary(fields, risk)

    return {"summary": summary, "errors": errors}
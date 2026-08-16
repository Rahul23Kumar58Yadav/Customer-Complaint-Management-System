import logging

from app.ai.llm_client import call_llm_json
from app.ai.langgraph_workflow.state import ComplaintWorkflowState
from app.ai.langgraph_workflow.nodes._node_utils import traced_node, with_llm_retry
from app.ai.langgraph_workflow.prompts.extraction_prompt import (
    EXTRACTION_SYSTEM_PROMPT,
    build_extraction_user_prompt,
)
from app.core.config import settings

logger = logging.getLogger(__name__)

EXPECTED_FIELD_COUNT = 14


@traced_node("extraction")
def extraction_node(state: ComplaintWorkflowState) -> ComplaintWorkflowState:
    errors = list(state.get("errors", []))

    def _call():
        return call_llm_json(
            system_prompt=EXTRACTION_SYSTEM_PROMPT,
            user_prompt=build_extraction_user_prompt(state["raw_text"]),
            model=settings.GROQ_EXTRACTION_MODEL,
        )

    errors = []
    try:
        result = with_llm_retry(_call, max_retries=settings.GROQ_MAX_RETRIES)
        extracted_fields = result.get("extracted_fields", {})
        extraction_confidence = result.get("extraction_confidence", {})
        if not extracted_fields:
            errors.append("extraction_node: LLM returned no extractable fields")
        elif len(extracted_fields) < EXPECTED_FIELD_COUNT / 2:
            logger.warning(...)  # keep as-is
    except Exception as exc:
        logger.exception("extraction_node failed after retries")
        errors.append(f"extraction_node: {exc}")
        extracted_fields, extraction_confidence = {}, {}

    return {
        "extracted_fields": extracted_fields,
        "extraction_confidence": extraction_confidence,
        "errors": errors,
    }
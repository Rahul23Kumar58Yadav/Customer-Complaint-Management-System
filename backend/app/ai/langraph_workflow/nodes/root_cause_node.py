import logging

from app.ai.llm_client import call_llm_json
from app.ai.langgraph_workflow.state import ComplaintWorkflowState
from app.ai.langgraph_workflow.nodes._node_utils import traced_node, with_llm_retry
from app.ai.langgraph_workflow.prompts.capa_prompt import (
    ROOT_CAUSE_SYSTEM_PROMPT,
    build_root_cause_user_prompt,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


@traced_node("root_cause")
def root_cause_node(state: ComplaintWorkflowState) -> ComplaintWorkflowState:
    errors = list(state.get("errors", []))
    fields = state.get("extracted_fields", {})

    if not fields.get("detailed_description"):
        return {
            **state,
            "root_cause_suggestion": "Insufficient detail in complaint description for a root cause hypothesis.",
            "errors": errors,
        }

    def _call():
        return call_llm_json(
            system_prompt=ROOT_CAUSE_SYSTEM_PROMPT,
            user_prompt=build_root_cause_user_prompt(fields),
            model=settings.GROQ_REASONING_MODEL,
        )

    try:
        result = with_llm_retry(_call, max_retries=settings.GROQ_MAX_RETRIES)
        root_cause_suggestion = result.get("root_cause_suggestion", "")
    except Exception as exc:  # noqa: BLE001
        logger.exception("root_cause_node failed after retries")
        errors.append(f"root_cause_node: {exc}")
        root_cause_suggestion = ""

    return {"root_cause_suggestion": "...", "errors": errors}
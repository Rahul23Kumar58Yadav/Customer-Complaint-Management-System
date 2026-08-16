import logging

from app.ai.llm_client import call_llm_json
from app.ai.langgraph_workflow.state import ComplaintWorkflowState
from app.ai.langgraph_workflow.nodes._node_utils import traced_node, with_llm_retry
from app.ai.langgraph_workflow.prompts.capa_prompt import CAPA_SYSTEM_PROMPT, build_capa_user_prompt
from app.core.config import settings

logger = logging.getLogger(__name__)


@traced_node("capa_recommendation")
def capa_recommendation_node(state: ComplaintWorkflowState) -> ComplaintWorkflowState:
    errors = list(state.get("errors", []))
    fields = state.get("extracted_fields", {})
    risk = state.get("risk_classification", "")

    def _call():
        return call_llm_json(
            system_prompt=CAPA_SYSTEM_PROMPT,
            user_prompt=build_capa_user_prompt(fields, risk, state.get("root_cause_suggestion", "")),
            model=settings.GROQ_REASONING_MODEL,
        )

    try:
        result = with_llm_retry(_call, max_retries=settings.GROQ_MAX_RETRIES)
        capa_recommendation = result.get("capa_recommendation", "")
    except Exception as exc:  # noqa: BLE001
        logger.exception("capa_recommendation_node failed after retries")
        errors.append(f"capa_recommendation_node: {exc}")
        capa_recommendation = ""

    return {"capa_recommendation": capa_recommendation, "errors": errors}
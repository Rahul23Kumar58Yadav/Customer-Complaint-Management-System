import logging

from app.ai.llm_client import call_llm_json
from app.ai.langgraph_workflow.state import ComplaintWorkflowState
from app.ai.langgraph_workflow.nodes._node_utils import traced_node, with_llm_retry
from app.ai.langgraph_workflow.prompts.risk_prompt import RISK_SYSTEM_PROMPT, build_risk_user_prompt
from app.core.config import settings

logger = logging.getLogger(__name__)

RISK_RANK = {"Low Risk": 0, "Medium Risk": 1, "High Risk": 2, "Critical Risk": 3}

CRITICAL_KEYWORDS = {
    "adverse event", "hospitalization", "hospitalized", "death", "fatal",
    "anaphylaxis", "contamination", "sterility failure", "microbial",
}
HIGH_RISK_KEYWORDS = {"recall", "regulatory", "fda", "field alert", "cross-contamination"}


def _keyword_floor(fields: dict) -> str | None:
    text = " ".join(str(v or "") for v in fields.values()).lower()
    if any(kw in text for kw in CRITICAL_KEYWORDS):
        return "Critical Risk"
    if any(kw in text for kw in HIGH_RISK_KEYWORDS):
        return "High Risk"
    return None


@traced_node("risk_classification")
def risk_classification_node(state: ComplaintWorkflowState) -> ComplaintWorkflowState:
    errors = list(state.get("errors", []))
    fields = state.get("extracted_fields", {})

    def _call():
        return call_llm_json(
            system_prompt=RISK_SYSTEM_PROMPT,
            user_prompt=build_risk_user_prompt(fields),
            model=settings.GROQ_REASONING_MODEL,
        )

    try:
        result = with_llm_retry(_call, max_retries=settings.GROQ_MAX_RETRIES)
        risk_classification = result.get("risk_classification", "Medium Risk")
        risk_rationale = result.get("risk_rationale", "")
    except Exception as exc:  # noqa: BLE001
        logger.exception("risk_classification_node failed after retries")
        errors.append(f"risk_classification_node: {exc}")
        risk_classification, risk_rationale = "Medium Risk", "Risk engine unavailable; defaulted."

    floor = _keyword_floor(fields)
    if floor and RISK_RANK.get(floor, 0) > RISK_RANK.get(risk_classification, 0):
        logger.warning(
            "risk_classification_node: upgrading LLM classification '%s' -> '%s' due to keyword floor",
            risk_classification, floor,
        )
        risk_rationale = f"{risk_rationale} [Escalated to {floor} by safety-critical keyword match.]".strip()
        risk_classification = floor

    return {"risk_classification": risk_classification, "risk_rationale": risk_rationale, "errors": errors}
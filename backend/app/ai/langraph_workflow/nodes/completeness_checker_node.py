from app.ai.langgraph_workflow.state import ComplaintWorkflowState
from app.ai.langgraph_workflow.nodes._node_utils import traced_node

FIELD_WEIGHTS = {
    "customer_name": 10,
    "product_name": 20,
    "batch_lot_number": 20,
    "complaint_type": 15,
    "detailed_description": 25,
    "initial_severity": 10,
}


@traced_node("completeness_checker")
def completeness_checker_node(state: ComplaintWorkflowState) -> ComplaintWorkflowState:
    fields = state.get("extracted_fields", {}) or {}

    missing = []
    score = 0
    for field, weight in FIELD_WEIGHTS.items():
        value = fields.get(field)
        if value and str(value).strip():
            score += weight
        else:
            missing.append(field)

    return {"completeness_score": score, "missing_fields": missing}
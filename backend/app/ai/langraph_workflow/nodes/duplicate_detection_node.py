from difflib import SequenceMatcher

from app.ai.langgraph_workflow.state import ComplaintWorkflowState
from app.ai.langgraph_workflow.nodes._node_utils import traced_node

SIMILARITY_THRESHOLD = 0.65

FIELD_WEIGHTS = {
    "batch_lot_number": 0.5,
    "product_name": 0.2,
    "detailed_description": 0.3,
}


def _text_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def _weighted_similarity(candidate: dict, existing: dict) -> float:
    total = 0.0
    for field, weight in FIELD_WEIGHTS.items():
        a = str(candidate.get(field, "") or "")
        b = str(existing.get(field, "") or "")
        if not a or not b:
            continue
        sim = 1.0 if field == "batch_lot_number" and a.strip().lower() == b.strip().lower() else _text_similarity(a, b)
        total += weight * sim
    return total


@traced_node("duplicate_detection")
def duplicate_detection_node(state: ComplaintWorkflowState) -> ComplaintWorkflowState:
    candidate = state.get("extracted_fields", {}) or {}
    context = state.get("existing_complaints_context", "")

    best_id, best_score = None, 0.0

    if context and candidate:
        for line in context.splitlines():
            if "|||" not in line:
                continue
            comp_id, comp_text = line.split("|||", 1)
            parts = comp_text.split("|", 2)
            existing = {
                "product_name": parts[0] if len(parts) > 0 else "",
                "batch_lot_number": parts[1] if len(parts) > 1 else "",
                "detailed_description": parts[2] if len(parts) > 2 else "",
            }
            score = _weighted_similarity(candidate, existing)
            if score > best_score:
                best_id, best_score = comp_id, score

    duplicate_of = best_id if best_score >= SIMILARITY_THRESHOLD else None

    return {"duplicate_of": duplicate_of, "duplicate_score": round(best_score, 3)}
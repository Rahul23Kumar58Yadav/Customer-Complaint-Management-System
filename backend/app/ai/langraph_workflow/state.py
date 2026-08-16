import operator
from typing import TypedDict, Optional, Annotated


def _merge_dicts(a: dict, b: dict) -> dict:
    return {**(a or {}), **(b or {})}


class ComplaintWorkflowState(TypedDict, total=False):
    raw_text: str
    existing_complaints_context: str

    extracted_fields: dict
    extraction_confidence: dict

    completeness_score: int
    missing_fields: list[str]

    risk_classification: str
    risk_rationale: str

    duplicate_of: Optional[str]
    duplicate_score: float

    root_cause_suggestion: str
    capa_recommendation: str
    summary: str

    # These three can be written by multiple parallel nodes in the same
    # step (completeness_checker, risk_classification_node, duplicate_detection
    # all branch off extraction concurrently), so they need reducers that
    # merge writes instead of the default "last value wins" behavior,
    # which raises InvalidUpdateError on concurrent writes.
    errors: Annotated[list[str], operator.add]
    node_timings_ms: Annotated[dict[str, float], _merge_dicts]
    retry_counts: Annotated[dict[str, int], _merge_dicts]
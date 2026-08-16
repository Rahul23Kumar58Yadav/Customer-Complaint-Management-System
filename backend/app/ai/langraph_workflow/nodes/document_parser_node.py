import re

from app.ai.langgraph_workflow.state import ComplaintWorkflowState
from app.ai.langgraph_workflow.nodes._node_utils import traced_node

MAX_CHARS = 12000

_DISCLAIMER_MARKER = re.compile(
    r"(this email and any attachments|confidential.*intended recipient)",
    re.IGNORECASE,
)


def _strip_boilerplate(text: str) -> str:
    match = _DISCLAIMER_MARKER.search(text)
    if match and match.start() > 200:
        text = text[: match.start()]
    return text


@traced_node("document_parser")
def document_parser_node(state: ComplaintWorkflowState) -> ComplaintWorkflowState:
    text = state.get("raw_text", "") or ""
    text = _strip_boilerplate(text)
    text = " ".join(text.split())
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]

    return {"raw_text": text}
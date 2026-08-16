
from langgraph.graph import StateGraph, END

from app.ai.langgraph_workflow.state import ComplaintWorkflowState
from app.ai.langgraph_workflow.nodes.document_parser_node import document_parser_node
from app.ai.langgraph_workflow.nodes.extraction_node import extraction_node
from app.ai.langgraph_workflow.nodes.completeness_checker_node import completeness_checker_node
from app.ai.langgraph_workflow.nodes.risk_classification_node import risk_classification_node
from app.ai.langgraph_workflow.nodes.duplicate_detection_node import duplicate_detection_node
from app.ai.langgraph_workflow.nodes.root_cause_node import root_cause_node
from app.ai.langgraph_workflow.nodes.capa_recommendation_node import capa_recommendation_node
from app.ai.langgraph_workflow.nodes.summary_node import summary_node


def build_complaint_graph():
    graph = StateGraph(ComplaintWorkflowState)

    graph.add_node("document_parser", document_parser_node)
    graph.add_node("extraction", extraction_node)
    graph.add_node("completeness_checker", completeness_checker_node)
    graph.add_node("risk_classification_node", risk_classification_node)
    graph.add_node("duplicate_detection", duplicate_detection_node)
    graph.add_node("root_cause", root_cause_node)
    graph.add_node("capa_recommendation_node", capa_recommendation_node)
    graph.add_node("summary_node", summary_node)

    graph.set_entry_point("document_parser")
    graph.add_edge("document_parser", "extraction")

    graph.add_edge("extraction", "completeness_checker")
    graph.add_edge("extraction", "risk_classification_node")
    graph.add_edge("extraction", "duplicate_detection")

    graph.add_edge("risk_classification_node", "root_cause")
    graph.add_edge("root_cause", "capa_recommendation_node")

    graph.add_edge("completeness_checker", "summary_node")
    graph.add_edge("duplicate_detection", "summary_node")
    graph.add_edge("capa_recommendation_node", "summary_node")

    graph.add_edge("summary_node", END)

    return graph.compile()


complaint_workflow = build_complaint_graph()


def run_workflow_with_diagnostics(initial_state: dict) -> dict:
    import logging
    logger = logging.getLogger(__name__)
    final_state = complaint_workflow.invoke(initial_state)

    timings = final_state.get("node_timings_ms", {})
    if timings:
        breakdown = ", ".join(f"{node}={ms}ms" for node, ms in timings.items())
        logger.info("LangGraph node timing breakdown: %s", breakdown)

    if final_state.get("errors"):
        logger.warning("LangGraph workflow completed with errors: %s", final_state["errors"])

    return final_state
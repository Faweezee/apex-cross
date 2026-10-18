"""Main LangGraph execution graph for ApexCross (Understand -> Plan / Clarify)."""
from typing import Any, Callable, Dict, Optional

from app.agent.nodes import (
    clarification_node,
    plan_remittance_node,
    understand_intent_node,
)
from app.agent.state import AgentState
from app.schemas import CurrencyEnum, UniversityInvoice

START = "__start__"
END = "__end__"


class DeterministicStateGraph:
    """Deterministic acyclic state graph engine compatible with LangGraph StateGraph semantics."""

    def __init__(self, state_schema: Any):
        self.state_schema = state_schema
        self.nodes: Dict[str, Callable[[AgentState], Dict[str, Any]]] = {}
        self.edges: Dict[str, str] = {}
        self.conditional_edges: Dict[str, tuple[Callable[[AgentState], str], Dict[str, str]]] = {}

    def add_node(self, name: str, fn: Callable[[AgentState], Dict[str, Any]]) -> None:
        self.nodes[name] = fn

    def add_edge(self, source: str, target: str) -> None:
        self.edges[source] = target

    def add_conditional_edges(
        self,
        source: str,
        router_fn: Callable[[AgentState], str],
        mapping: Dict[str, str],
    ) -> None:
        self.conditional_edges[source] = (router_fn, mapping)

    def compile(self) -> "CompiledDeterministicGraph":
        return CompiledDeterministicGraph(
            nodes=self.nodes,
            edges=self.edges,
            conditional_edges=self.conditional_edges,
        )


class CompiledDeterministicGraph:
    """Compiled acyclic state graph executing deterministic node transitions."""

    def __init__(
        self,
        nodes: Dict[str, Callable[[AgentState], Dict[str, Any]]],
        edges: Dict[str, str],
        conditional_edges: Dict[str, tuple[Callable[[AgentState], str], Dict[str, str]]],
    ):
        self.nodes = nodes
        self.edges = edges
        self.conditional_edges = conditional_edges

    def invoke(self, initial_state: AgentState) -> Dict[str, Any]:
        state: Dict[str, Any] = dict(initial_state)
        current = self.edges.get(START, END)
        steps = 0
        max_steps = 20

        while current != END and steps < max_steps:
            steps += 1
            node_fn = self.nodes[current]
            updates = node_fn(state)  # type: ignore[arg-type]
            if updates:
                state.update(updates)

            if current in self.conditional_edges:
                router_fn, mapping = self.conditional_edges[current]
                route_key = router_fn(state)  # type: ignore[arg-type]
                current = mapping.get(route_key, END)
            else:
                current = self.edges.get(current, END)

        return state


def _route_after_understanding(state: AgentState) -> str:
    if state.get("requires_clarification"):
        return "clarification"
    return "plan_remittance"


def build_agent_graph():
    """Compile the deterministic acyclic LangGraph workflow."""
    try:
        from langgraph.graph import END as LG_END, START as LG_START, StateGraph as LGStateGraph

        workflow = LGStateGraph(AgentState)
        start_sym, end_sym = LG_START, LG_END
    except Exception:
        workflow = DeterministicStateGraph(AgentState)
        start_sym, end_sym = START, END

    workflow.add_node("understand_intent", understand_intent_node)
    workflow.add_node("clarification", clarification_node)
    workflow.add_node("plan_remittance", plan_remittance_node)

    workflow.add_edge(start_sym, "understand_intent")
    workflow.add_conditional_edges(
        "understand_intent",
        _route_after_understanding,
        {
            "clarification": "clarification",
            "plan_remittance": "plan_remittance",
        },
    )
    workflow.add_edge("clarification", end_sym)
    workflow.add_edge("plan_remittance", end_sym)
    return workflow.compile()


agent_graph = build_agent_graph()


def run_agent_planning(
    user_id: str,
    message: str,
    source_currency: CurrencyEnum = CurrencyEnum.CNY,
    invoice: Optional[UniversityInvoice] = None,
) -> Dict[str, Any]:
    """Execute the compiled LangGraph agent state machine for a student request."""
    initial_state: AgentState = {
        "user_id": user_id,
        "message": message,
        "source_currency": source_currency,
        "invoice": invoice,
    }
    return agent_graph.invoke(initial_state)

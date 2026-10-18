"""FastAPI route for the LangGraph cross-border remittance planning agent."""
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agent.graph import run_agent_planning
from app.schemas import (
    CurrencyEnum,
    RemittancePlan,
    RemittanceRoute,
    SecurityTier,
    UniversityInvoice,
)
from app.security.firewall import SecurityFirewall

router = APIRouter(prefix="/api/agent", tags=["Agent"])
firewall = SecurityFirewall()


class AgentChatRequest(BaseModel):
    """Conversational input and optional parsed invoice for the ApexCross planner."""

    user_id: str = Field(default="student-001")
    message: str = Field(..., description="Student conversational remittance instruction")
    source_currency: CurrencyEnum = Field(default=CurrencyEnum.CNY)
    invoice: Optional[UniversityInvoice] = None


class AgentChatResponse(BaseModel):
    """Structured response containing conversational guidance, clarification flags, and compiled DAG plan."""

    status: str
    assistant_message: str
    requires_clarification: bool
    missing_fields: List[str] = Field(default_factory=list)
    required_security_tier: Optional[SecurityTier] = None
    routes: List[RemittanceRoute] = Field(default_factory=list)
    plan: Optional[RemittancePlan] = None


@router.post("/chat", response_model=AgentChatResponse)
async def agent_chat(payload: AgentChatRequest) -> AgentChatResponse:
    """
    Inspect prompt through the pre-agent security firewall (raising HTTP 403 on attack),
    then invoke the LangGraph state machine to compile a remittance DAG or request clarification.
    """
    sanitized_message = firewall.enforce_or_raise(payload.message)
    state_out = run_agent_planning(
        user_id=payload.user_id,
        message=sanitized_message,
        source_currency=payload.source_currency,
        invoice=payload.invoice,
    )
    return AgentChatResponse(
        status=state_out.get("status", "PLAN_READY"),
        assistant_message=state_out.get("assistant_message", ""),
        requires_clarification=state_out.get("requires_clarification", False),
        missing_fields=state_out.get("missing_fields", []),
        required_security_tier=state_out.get("required_security_tier"),
        routes=state_out.get("routes", []),
        plan=state_out.get("plan"),
    )

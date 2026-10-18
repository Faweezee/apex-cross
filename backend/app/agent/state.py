"""Typed state definition for the ApexCross LangGraph state machine."""
from typing import Dict, List, Optional, TypedDict
from app.schemas import (
    CurrencyEnum,
    DagTask,
    RemittancePlan,
    RemittanceRoute,
    SecurityTier,
    UniversityInvoice,
)


class AgentState(TypedDict, total=False):
    """State passed across LangGraph nodes in the Understand -> Plan -> Execute loop."""

    user_id: str
    message: str
    source_currency: CurrencyEnum
    invoice: Optional[UniversityInvoice]
    parsed_institution: Optional[str]
    parsed_swift_code: Optional[str]
    parsed_beneficiary_account: Optional[str]
    parsed_amount: Optional[float]
    parsed_currency: Optional[CurrencyEnum]
    parsed_student_id: Optional[str]
    parsed_due_date: Optional[str]
    missing_fields: List[str]
    requires_clarification: bool
    status: str
    assistant_message: str
    amount_usd: float
    quota_decision: str
    remaining_annual_quota_usd: float
    routes: List[RemittanceRoute]
    selected_route: Optional[RemittanceRoute]
    required_security_tier: SecurityTier
    dag_tasks: List[DagTask]
    plan: Optional[RemittancePlan]

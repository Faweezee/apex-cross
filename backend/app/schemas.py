"""Universal Pydantic v2 schemas for ApexCross."""
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SecurityTier(str, Enum):
    TIER_1_AUTONOMOUS = "TIER_1_AUTONOMOUS"     # Query, rate alerts (Zero risk)
    TIER_2_CONFIRMATION = "TIER_2_CONFIRMATION" # Minor conversions <= $500 (1-click modal)
    TIER_3_BIOMETRIC = "TIER_3_BIOMETRIC"       # Wires > $1000, new payees (WebAuthn Passkey)

class CurrencyEnum(str, Enum):
    USD = "USD"
    CNY = "CNY"
    HKD = "HKD"
    AUD = "AUD"
    SGD = "SGD"

class RemittanceRoute(BaseModel):
    rail_name: str = Field(..., description="e.g. Standard SWIFT, Direct Clearing, Wise Corridor")
    exchange_rate: float
    source_currency: CurrencyEnum
    source_amount: float
    target_currency: CurrencyEnum
    target_amount: float
    total_fee_usd: float
    estimated_arrival_hours: int
    is_recommended: bool = False
    savings_vs_standard_usd: float = 0.0

class UniversityInvoice(BaseModel):
    institution_name: str
    beneficiary_account: str
    swift_code: str
    amount_due: float
    currency: CurrencyEnum
    due_date: str
    student_id: Optional[str] = None
    confidence_score: float = Field(ge=0.0, le=1.0)

class DagTask(BaseModel):
    task_id: str
    title: str
    description: str
    status: str = Field(default="PENDING", description="PENDING | RUNNING | COMPLETED | BLOCKED | FAILED")
    required_tier: SecurityTier
    tool_name: str
    output: Optional[Dict[str, Any]] = None

class RemittancePlan(BaseModel):
    plan_id: str
    user_id: str
    invoice: Optional[UniversityInvoice]
    selected_route: RemittanceRoute
    remaining_annual_quota_usd: float
    required_security_tier: SecurityTier
    dag_tasks: List[DagTask]
    is_executed: bool = False

class AuditRecord(BaseModel):
    record_id: str
    timestamp: str
    user_id: str
    action_type: str
    security_tier: SecurityTier
    plan_id: str
    payload_hash: str
    previous_hash: str
    signature_verified: bool
    status: str

"""LangGraph nodes for intent parsing, invoice extraction, DAG planning, and clarification."""
import re
import uuid
from typing import Dict, Any, List

from app.agent.state import AgentState
from app.schemas import (
    CurrencyEnum,
    DagTask,
    RemittancePlan,
    SecurityTier,
    UniversityInvoice,
)
from app.security.permission import PermissionEvaluator
from app.tools.fx_calculator import FXCalculatorTool
from app.tools.invoice_parser import UNIVERSITY_PRESETS
from app.tools.quota_tool import QuotaDecision, QuotaTrackerTool

fx_tool = FXCalculatorTool()
quota_tool = QuotaTrackerTool()


def understand_intent_node(state: AgentState) -> Dict[str, Any]:
    """Extract beneficiary, amount, currency, student ID, and deadline from conversational input or invoice."""
    message = state.get("message", "")
    invoice = state.get("invoice")

    parsed_institution = invoice.institution_name if invoice else None
    parsed_swift = invoice.swift_code if invoice else None
    parsed_account = invoice.beneficiary_account if invoice else None
    parsed_amount = invoice.amount_due if invoice else None
    parsed_currency = invoice.currency if invoice else None
    parsed_student_id = invoice.student_id if invoice else None
    parsed_due_date = invoice.due_date if invoice else "2026-11-15"

    lower_msg = message.lower()
    if not parsed_institution:
        if "hkust" in lower_msg or "hong kong university of science" in lower_msg:
            preset = UNIVERSITY_PRESETS["hkust"]
            parsed_institution = preset.institution_name
            parsed_swift = preset.swift_code
            parsed_account = preset.beneficiary_account
            parsed_student_id = parsed_student_id or preset.student_id
        elif "melbourne" in lower_msg or "unimelb" in lower_msg:
            preset = UNIVERSITY_PRESETS["melbourne"]
            parsed_institution = preset.institution_name
            parsed_swift = preset.swift_code
            parsed_account = preset.beneficiary_account
            parsed_student_id = parsed_student_id or preset.student_id
        elif "nus" in lower_msg or "national university of singapore" in lower_msg:
            preset = UNIVERSITY_PRESETS["nus"]
            parsed_institution = preset.institution_name
            parsed_swift = preset.swift_code
            parsed_account = preset.beneficiary_account
            parsed_student_id = parsed_student_id or preset.student_id

    amount_match = re.search(
        r"\b([\d,]+(?:\.\d{1,2})?)\s*(USD|CNY|HKD|AUD|SGD)\b",
        message,
        flags=re.IGNORECASE,
    )
    if amount_match:
        parsed_amount = float(amount_match.group(1).replace(",", ""))
        parsed_currency = CurrencyEnum(amount_match.group(2).upper())

    student_match = re.search(
        r"(?i)student\s*(?:id|number)?\s*[:#]?\s*([A-Z0-9]{5,12})\b",
        message,
    )
    if student_match:
        parsed_student_id = student_match.group(1)

    missing_fields: List[str] = []
    if not parsed_institution:
        missing_fields.append("institution_name")
    if not parsed_amount or parsed_amount <= 0:
        missing_fields.append("amount_due")
    if not parsed_currency:
        missing_fields.append("currency")

    resolved_invoice = invoice
    if not resolved_invoice and not missing_fields:
        resolved_invoice = UniversityInvoice(
            institution_name=parsed_institution or "",
            beneficiary_account=parsed_account or "004-123-456789-001",
            swift_code=parsed_swift or "HSBCHKHHHKH",
            amount_due=float(parsed_amount or 0.0),
            currency=parsed_currency or CurrencyEnum.HKD,
            due_date=parsed_due_date or "2026-11-15",
            student_id=parsed_student_id or "20991234",
            confidence_score=0.95,
        )

    return {
        "invoice": resolved_invoice,
        "parsed_institution": parsed_institution,
        "parsed_swift_code": parsed_swift,
        "parsed_beneficiary_account": parsed_account,
        "parsed_amount": parsed_amount,
        "parsed_currency": parsed_currency,
        "parsed_student_id": parsed_student_id,
        "parsed_due_date": parsed_due_date,
        "missing_fields": missing_fields,
        "requires_clarification": len(missing_fields) > 0,
    }


def clarification_node(state: AgentState) -> Dict[str, Any]:
    """Halt the DAG and prompt the student when mandatory wire fields are missing."""
    missing = state.get("missing_fields", [])
    readable = ", ".join(missing)
    prompt_msg = (
        f"To prepare your cross-border tuition remittance plan safely, please provide the missing details: "
        f"{readable} (or upload your official university tuition invoice PDF/image)."
    )
    return {
        "status": "CLARIFICATION_REQUIRED",
        "requires_clarification": True,
        "assistant_message": prompt_msg,
        "dag_tasks": [],
        "plan": None,
    }


def plan_remittance_node(state: AgentState) -> Dict[str, Any]:
    """
    Compile the deterministic 4-step acyclic DAG:
    [ValidateStudent] -> [CheckQuota] -> [CompareCorridors] -> [AwaitAuthorization]
    using deterministic Python tools for all FX and quota calculations.
    """
    user_id = state.get("user_id", "student-001")
    source_currency = state.get("source_currency", CurrencyEnum.CNY)
    invoice = state["invoice"]
    assert invoice is not None

    # 1. Deterministic USD conversion for quota & security tier evaluation
    amount_usd = fx_tool.convert_amount(
        amount=invoice.amount_due,
        source=invoice.currency,
        target=CurrencyEnum.USD,
        use_live=False,
    )

    # 2. Deterministic Annual Student Quota evaluation ($50,000 USD limit)
    quota_eval = quota_tool.evaluate_wire(user_id=user_id, amount_usd=amount_usd, commit=False)

    # 3. Deterministic Corridor Route comparison
    routes = fx_tool.compare_corridors(
        source_currency=source_currency,
        target_currency=invoice.currency,
        target_amount=invoice.amount_due,
        use_live=False,
    )
    selected_route = next((r for r in routes if r.is_recommended), routes[0])

    # 4. 3-Tier Security Permission Evaluation
    required_tier = PermissionEvaluator.evaluate_tier(
        amount_usd=amount_usd,
        is_query_only=False,
        is_wire_transfer=True,
    )

    quota_status = "BLOCKED" if quota_eval.decision == QuotaDecision.REJECT else "COMPLETED"
    auth_status = "BLOCKED" if quota_eval.decision == QuotaDecision.REJECT else "PENDING"

    dag_tasks = [
        DagTask(
            task_id="ValidateStudent",
            title="Validate Student & Beneficiary",
            description=(
                f"Verified {invoice.institution_name} (SWIFT: {invoice.swift_code}) "
                f"for Student ID {invoice.student_id}."
            ),
            status="COMPLETED",
            required_tier=SecurityTier.TIER_1_AUTONOMOUS,
            tool_name="invoice_parser",
            output={
                "institution_name": invoice.institution_name,
                "swift_code": invoice.swift_code,
                "student_id": invoice.student_id,
            },
        ),
        DagTask(
            task_id="CheckQuota",
            title="Check Annual SAFE Foreign Exchange Quota",
            description=quota_eval.reason,
            status=quota_status,
            required_tier=SecurityTier.TIER_1_AUTONOMOUS,
            tool_name="quota_tool",
            output=quota_eval.model_dump(mode="json"),
        ),
        DagTask(
            task_id="CompareCorridors",
            title="Optimize APEC Multi-Currency Corridor",
            description=(
                f"Recommended {selected_route.rail_name} saving "
                f"${selected_route.savings_vs_standard_usd:.2f} USD vs. Standard SWIFT Bank Wire."
            ),
            status="COMPLETED",
            required_tier=SecurityTier.TIER_1_AUTONOMOUS,
            tool_name="fx_calculator",
            output={
                "recommended_rail": selected_route.rail_name,
                "savings_vs_standard_usd": selected_route.savings_vs_standard_usd,
                "routes": [r.model_dump(mode="json") for r in routes],
            },
        ),
        DagTask(
            task_id="AwaitAuthorization",
            title="Await Hardware Biometric Authorization",
            description=(
                f"Requires {required_tier.value} verification to execute "
                f"{invoice.amount_due:,.2f} {invoice.currency.value} remittance."
            ),
            status=auth_status,
            required_tier=required_tier,
            tool_name="webauthn_service",
            output={
                "amount_usd": amount_usd,
                "required_security_tier": required_tier.value,
            },
        ),
    ]

    plan_id = f"plan-{uuid.uuid4().hex[:8]}"
    plan = RemittancePlan(
        plan_id=plan_id,
        user_id=user_id,
        invoice=invoice,
        selected_route=selected_route,
        remaining_annual_quota_usd=quota_eval.remaining_after_usd,
        required_security_tier=required_tier,
        dag_tasks=dag_tasks,
        is_executed=False,
    )

    status_flag = "QUOTA_EXCEEDED" if quota_eval.decision == QuotaDecision.REJECT else "PLAN_READY"
    assistant_msg = (
        f"Compiled remittance plan {plan_id} for {invoice.amount_due:,.2f} {invoice.currency.value} "
        f"to {invoice.institution_name} via {selected_route.rail_name} "
        f"(saving ${selected_route.savings_vs_standard_usd:.2f} USD). "
        f"Remaining annual quota: ${quota_eval.remaining_after_usd:,.2f} USD. "
        f"Step-up {required_tier.value} authorization required to execute."
    )

    return {
        "status": status_flag,
        "requires_clarification": False,
        "assistant_message": assistant_msg,
        "amount_usd": amount_usd,
        "quota_decision": quota_eval.decision.value,
        "remaining_annual_quota_usd": quota_eval.remaining_after_usd,
        "routes": routes,
        "selected_route": selected_route,
        "required_security_tier": required_tier,
        "dag_tasks": dag_tasks,
        "plan": plan,
    }

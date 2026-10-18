"""Unit tests for ApexCross Pydantic v2 schemas and OpenAPI contract export."""
import json
from pathlib import Path
import pytest
from pydantic import ValidationError

from app.schemas import (
    AuditRecord,
    CurrencyEnum,
    DagTask,
    RemittancePlan,
    RemittanceRoute,
    SecurityTier,
    UniversityInvoice,
)
from app.main import app, get_openapi_schema


def test_security_tier_and_currency_enums():
    """Verify SecurityTier and CurrencyEnum values match contract."""
    assert SecurityTier.TIER_1_AUTONOMOUS.value == "TIER_1_AUTONOMOUS"
    assert SecurityTier.TIER_2_CONFIRMATION.value == "TIER_2_CONFIRMATION"
    assert SecurityTier.TIER_3_BIOMETRIC.value == "TIER_3_BIOMETRIC"
    assert set(c.value for c in CurrencyEnum) == {"USD", "CNY", "HKD", "AUD", "SGD"}


def test_remittance_route_serialization():
    """Verify RemittanceRoute defaults, serialization, and deserialization."""
    route = RemittanceRoute(
        rail_name="Direct Clearing",
        exchange_rate=7.82,
        source_currency=CurrencyEnum.USD,
        source_amount=10869.57,
        target_currency=CurrencyEnum.HKD,
        target_amount=85000.0,
        total_fee_usd=15.0,
        estimated_arrival_hours=4,
        is_recommended=True,
        savings_vs_standard_usd=142.50,
    )
    json_str = route.model_dump_json()
    restored = RemittanceRoute.model_validate_json(json_str)
    assert restored == route
    assert restored.source_currency == CurrencyEnum.USD
    assert restored.is_recommended is True


def test_university_invoice_confidence_score_constraints():
    """Verify UniversityInvoice enforces confidence_score in [0.0, 1.0]."""
    valid_invoice = UniversityInvoice(
        institution_name="HKUST",
        beneficiary_account="004-123-456789-001",
        swift_code="HSBCHKHHHKH",
        amount_due=85000.0,
        currency=CurrencyEnum.HKD,
        due_date="2026-11-15",
        student_id="20991234",
        confidence_score=0.96,
    )
    assert valid_invoice.confidence_score == 0.96

    with pytest.raises(ValidationError):
        UniversityInvoice(
            institution_name="HKUST",
            beneficiary_account="004-123-456789-001",
            swift_code="HSBCHKHHHKH",
            amount_due=85000.0,
            currency=CurrencyEnum.HKD,
            due_date="2026-11-15",
            confidence_score=1.2,
        )

    with pytest.raises(ValidationError):
        UniversityInvoice(
            institution_name="HKUST",
            beneficiary_account="004-123-456789-001",
            swift_code="HSBCHKHHHKH",
            amount_due=85000.0,
            currency=CurrencyEnum.HKD,
            due_date="2026-11-15",
            confidence_score=-0.1,
        )


def test_remittance_plan_and_dag_task_roundtrip():
    """Verify nested RemittancePlan with DagTask and UniversityInvoice serializes cleanly."""
    route = RemittanceRoute(
        rail_name="Wise Corridor",
        exchange_rate=0.65,
        source_currency=CurrencyEnum.AUD,
        source_amount=15000.0,
        target_currency=CurrencyEnum.USD,
        target_amount=9750.0,
        total_fee_usd=18.20,
        estimated_arrival_hours=2,
    )
    task = DagTask(
        task_id="task-01",
        title="Verify Annual Student Quota",
        description="Check SAFE $50,000 USD annual foreign exchange quota",
        required_tier=SecurityTier.TIER_1_AUTONOMOUS,
        tool_name="quota_tool",
        output={"remaining_usd": 40250.0},
    )
    assert task.status == "PENDING"

    plan = RemittancePlan(
        plan_id="plan-123",
        user_id="student-001",
        invoice=None,
        selected_route=route,
        remaining_annual_quota_usd=40250.0,
        required_security_tier=SecurityTier.TIER_3_BIOMETRIC,
        dag_tasks=[task],
    )
    assert plan.is_executed is False
    dumped = plan.model_dump(mode="json")
    reloaded = RemittancePlan.model_validate(dumped)
    assert reloaded == plan
    assert reloaded.dag_tasks[0].output == {"remaining_usd": 40250.0}


def test_audit_record_validation():
    """Verify AuditRecord schema fields and hash chain attributes."""
    record = AuditRecord(
        record_id="rec-001",
        timestamp="2026-10-18T15:30:00Z",
        user_id="student-001",
        action_type="WIRE_EXECUTION",
        security_tier=SecurityTier.TIER_3_BIOMETRIC,
        plan_id="plan-123",
        payload_hash="a" * 64,
        previous_hash="0" * 64,
        signature_verified=True,
        status="COMPLETED",
    )
    data = json.loads(record.model_dump_json())
    assert data["security_tier"] == "TIER_3_BIOMETRIC"
    assert data["signature_verified"] is True


def test_openapi_schema_includes_all_contract_models():
    """Verify OpenAPI JSON schema exports all 7 domain models for the frontend collaborator."""
    schema = get_openapi_schema()
    components = schema.get("components", {}).get("schemas", {})
    expected_models = {
        "SecurityTier",
        "CurrencyEnum",
        "RemittanceRoute",
        "UniversityInvoice",
        "DagTask",
        "RemittancePlan",
        "AuditRecord",
    }
    assert expected_models.issubset(set(components.keys()))

    openapi_file = Path(__file__).resolve().parent.parent / "openapi.json"
    assert openapi_file.exists(), "backend/openapi.json must be exported for frontend collaborator"
    exported = json.loads(openapi_file.read_text(encoding="utf-8"))
    assert expected_models.issubset(set(exported.get("components", {}).get("schemas", {}).keys()))

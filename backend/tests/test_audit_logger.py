"""Unit and API tests for the SQLite SHA-256 hash-chained cryptographic audit ledger."""
from pathlib import Path
import sqlite3
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.schemas import SecurityTier
from app.security.audit_logger import AuditLogger, GENESIS_HASH

client = TestClient(app)


@pytest.fixture
def temp_ledger(tmp_path: Path) -> AuditLogger:
    db_file = tmp_path / "test_audit_ledger.db"
    return AuditLogger(db_path=str(db_file))


def test_audit_logger_appends_and_chains_sha256_hashes(temp_ledger: AuditLogger):
    """Verify records chain previous_hash -> record_hash starting from GENESIS_HASH."""
    rec1 = temp_ledger.log_event(
        user_id="student-001",
        action_type="PLAN_COMPILED",
        security_tier=SecurityTier.TIER_1_AUTONOMOUS,
        plan_id="plan-001",
        payload={"amount_hkd": 85000.0, "institution": "HKUST"},
        signature_verified=True,
        status="COMPLETED",
    )
    assert rec1.previous_hash == GENESIS_HASH
    assert len(rec1.payload_hash) == 64
    assert len(rec1.record_hash) == 64

    rec2 = temp_ledger.log_event(
        user_id="student-001",
        action_type="TIER3_WIRE_SETTLED",
        security_tier=SecurityTier.TIER_3_BIOMETRIC,
        plan_id="plan-001",
        payload={"mt103_ref": "APX123456", "amount_hkd": 85000.0},
        signature_verified=True,
        status="SETTLED",
    )
    assert rec2.previous_hash == rec1.record_hash
    assert rec2.record_hash != rec1.record_hash

    verification = temp_ledger.verify_chain()
    assert verification.is_valid is True
    assert verification.total_records == 2
    assert verification.tampered_record_id is None


def test_audit_logger_detects_database_tampering(temp_ledger: AuditLogger):
    """Verify modifying any stored column in SQLite breaks the SHA-256 hash chain and flags tampering."""
    rec1 = temp_ledger.log_event(
        user_id="student-001",
        action_type="TIER2_MICRO_CONVERT",
        security_tier=SecurityTier.TIER_2_CONFIRMATION,
        plan_id="conv-001",
        payload={"source_usd": 200.0},
        signature_verified=True,
        status="COMPLETED",
    )
    temp_ledger.log_event(
        user_id="student-001",
        action_type="TIER3_WIRE_SETTLED",
        security_tier=SecurityTier.TIER_3_BIOMETRIC,
        plan_id="plan-002",
        payload={"amount_hkd": 85000.0},
        signature_verified=True,
        status="SETTLED",
    )

    # Simulate an attacker directly mutating the SQLite database row
    with sqlite3.connect(temp_ledger.db_path) as conn:
        conn.execute(
            "UPDATE audit_logs SET action_type = ? WHERE record_id = ?",
            ("UNAUTHORIZED_MODIFICATION", rec1.record_id),
        )
        conn.commit()

    verification = temp_ledger.verify_chain()
    assert verification.is_valid is False
    assert verification.tampered_record_id == rec1.record_id
    assert "mismatch" in verification.reason.lower() or "tamper" in verification.reason.lower()


def test_audit_api_endpoints_return_logs_and_chain_verification():
    """Verify GET /api/audit/logs and GET /api/audit/verify endpoints return valid hash-chained records."""
    from app.routes.audit_routes import audit_logger

    audit_logger.log_event(
        user_id="student-api",
        action_type="RATE_QUERY",
        security_tier=SecurityTier.TIER_1_AUTONOMOUS,
        plan_id="plan-api-01",
        payload={"pair": "CNY/HKD"},
        signature_verified=True,
        status="COMPLETED",
    )

    logs_res = client.get("/api/audit/logs")
    assert logs_res.status_code == 200
    logs_data = logs_res.json()
    assert len(logs_data["records"]) >= 1
    first = logs_data["records"][0]
    assert "record_hash" in first
    assert "previous_hash" in first
    assert "payload_hash" in first

    verify_res = client.get("/api/audit/verify")
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["is_valid"] is True
    assert verify_data["total_records"] >= 1

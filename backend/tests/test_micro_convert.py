"""Unit and API tests for Tier 2 micro-conversion (<= $500 USD equivalent)."""
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.schemas import CurrencyEnum, SecurityTier

client = TestClient(app)


def test_micro_convert_executes_valid_tier2_conversion():
    """Verify <= $500 USD equivalent conversion executes without biometrics and updates wallet balances."""
    response = client.post(
        "/api/transfers/micro-convert",
        json={
            "user_id": "student-tier2-ok",
            "source_currency": "USD",
            "target_currency": "HKD",
            "source_amount": 250.0,
            "quoted_rate": 7.81,
            "max_slippage_bps": 50,
            "user_confirmed": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["security_tier"] == SecurityTier.TIER_2_CONFIRMATION.value
    assert data["biometric_required"] is False
    assert data["source_currency"] == "USD"
    assert data["target_currency"] == "HKD"
    assert data["source_amount"] == 250.0
    assert data["converted_target_amount"] > 0.0
    assert data["fee_usd"] >= 0.0
    assert data["source_balance_after"] < data["source_balance_before"]
    assert data["target_balance_after"] > data["target_balance_before"]


def test_micro_convert_rejects_amount_exceeding_500_usd_limit():
    """Verify conversion > $500 USD equivalent fails closed (HTTP 403) because it requires Tier 3 biometrics."""
    response = client.post(
        "/api/transfers/micro-convert",
        json={
            "user_id": "student-tier2-over",
            "source_currency": "USD",
            "target_currency": "HKD",
            "source_amount": 650.0,
            "quoted_rate": 7.81,
            "max_slippage_bps": 50,
            "user_confirmed": True,
        },
    )
    assert response.status_code == 403
    body = response.json()
    assert body["error"] == "SecurityException"
    assert "500" in body["reason"] or "tier" in body["reason"].lower()


def test_micro_convert_enforces_slippage_limit():
    """Verify conversion fails closed (HTTP 400) if locked quoted_rate deviates beyond max_slippage_bps."""
    response = client.post(
        "/api/transfers/micro-convert",
        json={
            "user_id": "student-tier2-slippage",
            "source_currency": "USD",
            "target_currency": "HKD",
            "source_amount": 100.0,
            "quoted_rate": 8.50,  # Deviates ~8.8% from 7.81 mid-market rate
            "max_slippage_bps": 50,  # 0.50% max slippage
            "user_confirmed": True,
        },
    )
    assert response.status_code == 400
    assert "slippage" in response.json()["detail"].lower()


def test_micro_convert_requires_explicit_user_confirmation_click():
    """Verify Tier 2 requires explicit 1-click modal confirmation (user_confirmed=True)."""
    response = client.post(
        "/api/transfers/micro-convert",
        json={
            "user_id": "student-tier2-unconfirmed",
            "source_currency": "USD",
            "target_currency": "HKD",
            "source_amount": 100.0,
            "quoted_rate": 7.81,
            "max_slippage_bps": 50,
            "user_confirmed": False,
        },
    )
    assert response.status_code == 403
    assert response.json()["error"] == "SecurityException"

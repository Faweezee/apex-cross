"""Unit and API tests for deterministic FX calculator and corridor optimizer."""
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.schemas import CurrencyEnum, RemittanceRoute
from app.tools.fx_calculator import FXCalculatorTool

client = TestClient(app)


@pytest.fixture
def fx_tool() -> FXCalculatorTool:
    return FXCalculatorTool()


def test_supported_apec_currencies_present_in_fallback_rates(fx_tool: FXCalculatorTool):
    """Verify deterministic base exchange rates exist across USD, CNY, HKD, AUD, SGD."""
    rates = fx_tool.get_mid_market_rates(base_currency=CurrencyEnum.USD, use_live=False)
    for currency in CurrencyEnum:
        assert currency.value in rates
        assert rates[currency.value] > 0.0
    assert rates["USD"] == 1.0


def test_deterministic_cross_currency_conversion_math(fx_tool: FXCalculatorTool):
    """Verify exact deterministic conversion math without floating point hallucination."""
    rate_cny_to_hkd = fx_tool.get_pair_rate(
        source=CurrencyEnum.CNY,
        target=CurrencyEnum.HKD,
        use_live=False,
    )
    assert rate_cny_to_hkd > 1.0
    converted = fx_tool.convert_amount(
        amount=10000.0,
        source=CurrencyEnum.CNY,
        target=CurrencyEnum.HKD,
        use_live=False,
    )
    assert converted == round(10000.0 * rate_cny_to_hkd, 2)


def test_compare_corridors_calculates_spreads_and_savings(fx_tool: FXCalculatorTool):
    """Verify corridor comparison returns Standard Bank Wire, Direct Clearing, and Wise Corridor with savings."""
    routes = fx_tool.compare_corridors(
        source_currency=CurrencyEnum.CNY,
        target_currency=CurrencyEnum.HKD,
        target_amount=85000.0,
        use_live=False,
    )
    assert len(routes) == 3
    assert all(isinstance(r, RemittanceRoute) for r in routes)

    rail_map = {r.rail_name: r for r in routes}
    assert "Standard SWIFT Bank Wire" in rail_map
    assert "APEC Direct Clearing" in rail_map
    assert "Wise Multi-Currency Corridor" in rail_map

    standard_route = rail_map["Standard SWIFT Bank Wire"]
    direct_route = rail_map["APEC Direct Clearing"]

    assert standard_route.savings_vs_standard_usd == 0.0
    assert direct_route.savings_vs_standard_usd > 0.0
    assert direct_route.total_fee_usd < standard_route.total_fee_usd

    recommended = [r for r in routes if r.is_recommended]
    assert len(recommended) == 1
    assert recommended[0].savings_vs_standard_usd == max(r.savings_vs_standard_usd for r in routes)


def test_fx_rates_api_endpoint_returns_corridors():
    """Verify GET /api/fx/rates returns 200 with mid-market rates, corridor routes, and savings."""
    response = client.get(
        "/api/fx/rates",
        params={
            "source_currency": "CNY",
            "target_currency": "HKD",
            "target_amount": 85000.0,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["source_currency"] == "CNY"
    assert payload["target_currency"] == "HKD"
    assert payload["target_amount"] == 85000.0
    assert payload["mid_market_rate"] > 0.0
    assert len(payload["routes"]) == 3
    recommended = [r for r in payload["routes"] if r["is_recommended"]]
    assert len(recommended) == 1
    assert recommended[0]["savings_vs_standard_usd"] > 0.0

"""Unit tests for the annual foreign exchange quota engine."""
import pytest
from app.tools.quota_tool import QuotaDecision, QuotaTrackerTool


@pytest.fixture
def quota_tool() -> QuotaTrackerTool:
    return QuotaTrackerTool()


def test_quota_allows_standard_tuition_wire(quota_tool: QuotaTrackerTool):
    res = quota_tool.evaluate_wire(user_id="student-101", amount_usd=12000.0)
    assert res.decision == QuotaDecision.ALLOW
    assert res.remaining_after_usd == 38000.0


def test_quota_flags_55000_wire_as_exceeding_annual_allowance(quota_tool: QuotaTrackerTool):
    res = quota_tool.evaluate_wire(user_id="student-102", amount_usd=55000.0)
    assert res.decision == QuotaDecision.REJECT
    assert res.remaining_after_usd == 50000.0

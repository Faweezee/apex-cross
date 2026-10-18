"""Deterministic annual student foreign exchange quota engine ($50,000 USD limit)."""
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import Dict
from pydantic import BaseModel

ANNUAL_QUOTA_USD = Decimal("50000.00")
WARNING_THRESHOLD_USD = Decimal("5000.00")


class QuotaDecision(str, Enum):
    ALLOW = "ALLOW"
    WARNING = "WARNING"
    REJECT = "REJECT"


class QuotaEvaluation(BaseModel):
    """Result of deterministic annual student foreign exchange quota evaluation."""

    user_id: str
    decision: QuotaDecision
    requested_usd: float
    remaining_before_usd: float
    remaining_after_usd: float
    reason: str


def _round_cents(val: Decimal) -> float:
    return float(val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


class QuotaTrackerTool:
    """Tracks and enforces the $50,000 USD annual foreign exchange quota for students."""

    def __init__(self, annual_limit_usd: float = 50000.0):
        self.annual_limit = Decimal(str(annual_limit_usd))
        self._used_quota_by_user: Dict[str, Decimal] = {}

    def get_remaining_quota(self, user_id: str) -> float:
        used = self._used_quota_by_user.get(user_id, Decimal("0.00"))
        remaining = max(Decimal("0.00"), self.annual_limit - used)
        return _round_cents(remaining)

    def evaluate_wire(
        self,
        user_id: str,
        amount_usd: float,
        commit: bool = False,
    ) -> QuotaEvaluation:
        """
        Deterministically check whether amount_usd fits within the user's remaining
        $50,000 USD annual allowance without LLM math.
        """
        dec_requested = Decimal(str(amount_usd))
        used = self._used_quota_by_user.get(user_id, Decimal("0.00"))
        remaining_before = max(Decimal("0.00"), self.annual_limit - used)

        if dec_requested > remaining_before:
            return QuotaEvaluation(
                user_id=user_id,
                decision=QuotaDecision.REJECT,
                requested_usd=_round_cents(dec_requested),
                remaining_before_usd=_round_cents(remaining_before),
                remaining_after_usd=_round_cents(remaining_before),
                reason=(
                    f"Requested wire (${_round_cents(dec_requested):,.2f} USD) exceeds "
                    f"remaining annual student FX quota (${_round_cents(remaining_before):,.2f} USD)."
                ),
            )

        remaining_after = remaining_before - dec_requested
        if commit:
            self._used_quota_by_user[user_id] = used + dec_requested

        if remaining_after < WARNING_THRESHOLD_USD:
            return QuotaEvaluation(
                user_id=user_id,
                decision=QuotaDecision.WARNING,
                requested_usd=_round_cents(dec_requested),
                remaining_before_usd=_round_cents(remaining_before),
                remaining_after_usd=_round_cents(remaining_after),
                reason=(
                    f"Quota approved with warning: only ${_round_cents(remaining_after):,.2f} USD "
                    "annual student allowance remains."
                ),
            )

        return QuotaEvaluation(
            user_id=user_id,
            decision=QuotaDecision.ALLOW,
            requested_usd=_round_cents(dec_requested),
            remaining_before_usd=_round_cents(remaining_before),
            remaining_after_usd=_round_cents(remaining_after),
            reason="Annual student foreign exchange quota verified.",
        )

"""3-Tier Security Permission Evaluator for ApexCross."""
from decimal import Decimal
from app.schemas import SecurityTier

TIER_2_LIMIT_USD = Decimal("500.00")
TIER_3_THRESHOLD_USD = Decimal("1000.00")


class PermissionEvaluator:
    """Evaluates required security tier based on operation type and USD equivalent value."""

    @staticmethod
    def evaluate_tier(
        amount_usd: float,
        is_query_only: bool = False,
        is_wire_transfer: bool = False,
        is_new_beneficiary: bool = False,
    ) -> SecurityTier:
        """
        Enforce the 3-Tier Security Matrix:
        - Tier 1 (Autonomous): Read-only inquiries.
        - Tier 2 (Confirmation): Micro-operations / conversions <= $500 USD.
        - Tier 3 (Biometric Passkey): High-risk operations (> $1,000 USD, wire transfers, new beneficiaries).
        """
        if is_query_only:
            return SecurityTier.TIER_1_AUTONOMOUS

        dec_amount = Decimal(str(amount_usd))
        if is_wire_transfer or is_new_beneficiary or dec_amount > TIER_2_LIMIT_USD:
            return SecurityTier.TIER_3_BIOMETRIC

        return SecurityTier.TIER_2_CONFIRMATION

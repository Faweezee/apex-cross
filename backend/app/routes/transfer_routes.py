"""FastAPI routes for Tier 2 micro-conversions (<= $500 USD equivalent)."""
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.schemas import CurrencyEnum, SecurityTier
from app.security.firewall import SecurityException
from app.security.permission import PermissionEvaluator, TIER_2_LIMIT_USD
from app.tools.fx_calculator import FXCalculatorTool

router = APIRouter(prefix="/api/transfers", tags=["Transfers"])
fx_tool = FXCalculatorTool()

DEFAULT_WALLET_BALANCES: Dict[str, Decimal] = {
    "USD": Decimal("10000.00"),
    "CNY": Decimal("150000.00"),
    "HKD": Decimal("50000.00"),
    "AUD": Decimal("15000.00"),
    "SGD": Decimal("15000.00"),
}

_user_wallets: Dict[str, Dict[str, Decimal]] = {}


def _get_user_wallet(user_id: str) -> Dict[str, Decimal]:
    if user_id not in _user_wallets:
        _user_wallets[user_id] = dict(DEFAULT_WALLET_BALANCES)
    return _user_wallets[user_id]


def _round_cents(val: Decimal) -> float:
    return float(val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


class MicroConvertRequest(BaseModel):
    """Request payload for Tier 2 micro-conversion (<= $500 USD equivalent)."""

    user_id: str = Field(default="student-001")
    source_currency: CurrencyEnum
    target_currency: CurrencyEnum
    source_amount: float = Field(..., gt=0.0)
    quoted_rate: float = Field(..., gt=0.0)
    max_slippage_bps: int = Field(default=50, ge=0, le=500)
    user_confirmed: bool = Field(default=False)


class MicroConvertResponse(BaseModel):
    """Structured receipt for an executed Tier 2 micro-conversion."""

    conversion_id: str
    status: str
    security_tier: SecurityTier
    biometric_required: bool = False
    source_currency: CurrencyEnum
    target_currency: CurrencyEnum
    source_amount: float
    executed_rate: float
    converted_target_amount: float
    fee_usd: float
    slippage_bps: float
    source_balance_before: float
    source_balance_after: float
    target_balance_before: float
    target_balance_after: float


@router.post("/micro-convert", response_model=MicroConvertResponse)
async def execute_micro_conversion(payload: MicroConvertRequest) -> MicroConvertResponse:
    """
    Execute a Tier 2 micro-conversion (<= $500 USD equivalent) after verifying:
    1. Explicit 1-click user confirmation (`user_confirmed=True`).
    2. Transfer amount in USD equivalent is <= $500.00 USD (Tier 2 boundary).
    3. Locked `quoted_rate` is within `max_slippage_bps` of the live/cached mid-market rate.
    4. Sufficient wallet balance in `source_currency`.
    """
    if not payload.user_confirmed:
        raise SecurityException(
            "Tier 2 micro-conversion requires explicit 1-click user confirmation."
        )

    amount_usd = fx_tool.convert_amount(
        amount=payload.source_amount,
        source=payload.source_currency,
        target=CurrencyEnum.USD,
        use_live=False,
    )

    required_tier = PermissionEvaluator.evaluate_tier(
        amount_usd=amount_usd,
        is_query_only=False,
        is_wire_transfer=False,
    )
    if required_tier != SecurityTier.TIER_2_CONFIRMATION or Decimal(str(amount_usd)) > TIER_2_LIMIT_USD:
        raise SecurityException(
            f"Transfer amount (${amount_usd:,.2f} USD) exceeds the $500.00 USD Tier 2 micro-conversion limit "
            f"and requires {SecurityTier.TIER_3_BIOMETRIC.value} WebAuthn Passkey authorization."
        )

    mid_rate = Decimal(
        str(
            fx_tool.get_pair_rate(
                source=payload.source_currency,
                target=payload.target_currency,
                use_live=False,
            )
        )
    )
    quoted_dec = Decimal(str(payload.quoted_rate))
    actual_slippage_bps = abs(quoted_dec - mid_rate) / mid_rate * Decimal("10000")

    if actual_slippage_bps > Decimal(str(payload.max_slippage_bps)):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Rate slippage ({float(actual_slippage_bps):.1f} bps) exceeds maximum allowed "
                f"slippage ({payload.max_slippage_bps} bps)."
            ),
        )

    wallet = _get_user_wallet(payload.user_id)
    src_key = payload.source_currency.value
    tgt_key = payload.target_currency.value

    src_before = wallet[src_key]
    tgt_before = wallet[tgt_key]
    dec_source_amount = Decimal(str(payload.source_amount))

    if src_before < dec_source_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient {src_key} balance for micro-conversion.",
        )

    # Apply deterministic 0.20% (20 bps) Tier 2 wallet conversion fee
    fee_fraction = Decimal("0.0020")
    fee_usd = Decimal(str(amount_usd)) * fee_fraction
    net_source = dec_source_amount * (Decimal("1") - fee_fraction)
    converted_target = net_source * quoted_dec

    src_after = src_before - dec_source_amount
    tgt_after = tgt_before + converted_target
    wallet[src_key] = src_after
    wallet[tgt_key] = tgt_after

    return MicroConvertResponse(
        conversion_id=f"conv-{uuid.uuid4().hex[:8]}",
        status="COMPLETED",
        security_tier=SecurityTier.TIER_2_CONFIRMATION,
        biometric_required=False,
        source_currency=payload.source_currency,
        target_currency=payload.target_currency,
        source_amount=_round_cents(dec_source_amount),
        executed_rate=float(quoted_dec),
        converted_target_amount=_round_cents(converted_target),
        fee_usd=_round_cents(fee_usd),
        slippage_bps=_round_cents(actual_slippage_bps),
        source_balance_before=_round_cents(src_before),
        source_balance_after=_round_cents(src_after),
        target_balance_before=_round_cents(tgt_before),
        target_balance_after=_round_cents(tgt_after),
    )

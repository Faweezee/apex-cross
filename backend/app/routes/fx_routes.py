"""FastAPI routes for Tier 1 foreign exchange rate queries and corridor comparisons."""
from typing import Dict, List
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.schemas import CurrencyEnum, RemittanceRoute, SecurityTier
from app.tools.fx_calculator import FXCalculatorTool

router = APIRouter(prefix="/api/fx", tags=["Foreign Exchange"])
fx_calculator = FXCalculatorTool()


class FXRatesResponse(BaseModel):
    """Typed response for live FX spreads and corridor comparisons."""

    source_currency: CurrencyEnum
    target_currency: CurrencyEnum
    target_amount: float
    mid_market_rate: float
    security_tier: SecurityTier = SecurityTier.TIER_1_AUTONOMOUS
    all_usd_rates: Dict[str, float]
    routes: List[RemittanceRoute]


@router.get("/rates", response_model=FXRatesResponse)
async def get_fx_rates(
    source_currency: CurrencyEnum = Query(default=CurrencyEnum.CNY),
    target_currency: CurrencyEnum = Query(default=CurrencyEnum.HKD),
    target_amount: float = Query(default=85000.0, gt=0.0),
    use_live: bool = Query(default=False),
) -> FXRatesResponse:
    """Return live or cached FX rates, spread comparisons, and corridor fee savings."""
    mid_rate = fx_calculator.get_pair_rate(
        source=source_currency,
        target=target_currency,
        use_live=use_live,
    )
    all_usd_rates = fx_calculator.get_mid_market_rates(
        base_currency=CurrencyEnum.USD,
        use_live=use_live,
    )
    routes = fx_calculator.compare_corridors(
        source_currency=source_currency,
        target_currency=target_currency,
        target_amount=target_amount,
        use_live=use_live,
    )
    return FXRatesResponse(
        source_currency=source_currency,
        target_currency=target_currency,
        target_amount=target_amount,
        mid_market_rate=mid_rate,
        security_tier=SecurityTier.TIER_1_AUTONOMOUS,
        all_usd_rates=all_usd_rates,
        routes=routes,
    )

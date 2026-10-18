"""Deterministic FX calculator and corridor optimizer for ApexCross."""
from decimal import Decimal, ROUND_HALF_UP
import json
from pathlib import Path
from typing import Dict, List, Optional
import httpx

from app.schemas import CurrencyEnum, RemittanceRoute

FALLBACK_USD_RATES: Dict[str, float] = {
    "USD": 1.0,
    "CNY": 7.24,
    "HKD": 7.81,
    "AUD": 1.52,
    "SGD": 1.34,
}

CORRIDOR_RAILS = [
    {
        "rail_name": "Standard SWIFT Bank Wire",
        "spread_bps": 380,  # 3.80% average bank FX markup
        "fixed_fee_usd": 45.0,
        "estimated_arrival_hours": 72,
    },
    {
        "rail_name": "APEC Direct Clearing",
        "spread_bps": 35,  # 0.35% wholesale interbank clearing spread
        "fixed_fee_usd": 12.0,
        "estimated_arrival_hours": 4,
    },
    {
        "rail_name": "Wise Multi-Currency Corridor",
        "spread_bps": 55,  # 0.55% corridor spread
        "fixed_fee_usd": 18.0,
        "estimated_arrival_hours": 8,
    },
]


def _round_cents(val: Decimal) -> float:
    return float(val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _round_rate(val: Decimal) -> float:
    return float(val.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP))


class FXCalculatorTool:
    """Deterministic foreign exchange and corridor optimization calculator."""

    def __init__(self, cache_file: Optional[Path] = None):
        self.cache_file = cache_file or (Path(__file__).resolve().parent / "fx_rates_cache.json")
        self._ensure_local_cache()

    def _ensure_local_cache(self) -> None:
        if not self.cache_file.exists():
            self.cache_file.write_text(
                json.dumps({"base": "USD", "rates": FALLBACK_USD_RATES}, indent=2),
                encoding="utf-8",
            )

    def _load_fallback_usd_rates(self) -> Dict[str, float]:
        try:
            data = json.loads(self.cache_file.read_text(encoding="utf-8"))
            rates = data.get("rates", {})
            if all(c.value in rates for c in CurrencyEnum):
                return {c.value: float(rates[c.value]) for c in CurrencyEnum}
        except Exception:
            pass
        return dict(FALLBACK_USD_RATES)

    def get_mid_market_rates(
        self,
        base_currency: CurrencyEnum = CurrencyEnum.USD,
        use_live: bool = False,
    ) -> Dict[str, float]:
        """Return mid-market exchange rates relative to base_currency with local JSON fallback."""
        usd_rates = self._load_fallback_usd_rates()

        if use_live:
            try:
                with httpx.Client(timeout=2.0) as client:
                    response = client.get("https://open.er-api.com/v6/latest/USD")
                    if response.status_code == 200:
                        live_data = response.json().get("rates", {})
                        if all(c.value in live_data for c in CurrencyEnum):
                            usd_rates = {c.value: float(live_data[c.value]) for c in CurrencyEnum}
            except Exception:
                pass

        base_in_usd = Decimal(str(usd_rates[base_currency.value]))
        result: Dict[str, float] = {}
        for currency in CurrencyEnum:
            target_in_usd = Decimal(str(usd_rates[currency.value]))
            result[currency.value] = _round_rate(target_in_usd / base_in_usd)
        return result

    def get_pair_rate(
        self,
        source: CurrencyEnum,
        target: CurrencyEnum,
        use_live: bool = False,
    ) -> float:
        """Return deterministic mid-market exchange rate for 1 unit of source in target currency."""
        rates = self.get_mid_market_rates(base_currency=source, use_live=use_live)
        return rates[target.value]

    def convert_amount(
        self,
        amount: float,
        source: CurrencyEnum,
        target: CurrencyEnum,
        use_live: bool = False,
    ) -> float:
        """Deterministically convert amount from source currency to target currency."""
        rate = Decimal(str(self.get_pair_rate(source=source, target=target, use_live=use_live)))
        dec_amount = Decimal(str(amount))
        return _round_cents(dec_amount * rate)

    def compare_corridors(
        self,
        source_currency: CurrencyEnum,
        target_currency: CurrencyEnum,
        target_amount: float,
        use_live: bool = False,
    ) -> List[RemittanceRoute]:
        """
        Deterministically compute corridor options, effective exchange rates, total USD fees,
        and exact USD savings vs. Standard SWIFT Bank Wire.
        """
        usd_rates = self.get_mid_market_rates(base_currency=CurrencyEnum.USD, use_live=use_live)
        source_per_usd = Decimal(str(usd_rates[source_currency.value]))
        target_per_usd = Decimal(str(usd_rates[target_currency.value]))

        # Mid-market rate: units of target_currency per 1 unit of source_currency
        mid_rate = target_per_usd / source_per_usd
        dec_target_amount = Decimal(str(target_amount))

        # Ideal USD value of target_amount at mid-market
        ideal_usd = dec_target_amount / target_per_usd

        routes: List[RemittanceRoute] = []
        total_costs_usd: List[Decimal] = []

        for rail in CORRIDOR_RAILS:
            spread_fraction = Decimal(str(rail["spread_bps"])) / Decimal("10000")
            # Customer receives fewer target units per source unit due to FX markup spread
            effective_rate = mid_rate * (Decimal("1") - spread_fraction)
            required_source_for_fx = dec_target_amount / effective_rate

            # Convert required source into USD equivalent to measure spread cost in USD
            fx_usd_cost = required_source_for_fx / source_per_usd
            spread_cost_usd = fx_usd_cost - ideal_usd
            fixed_fee_usd = Decimal(str(rail["fixed_fee_usd"]))
            total_fee_usd = spread_cost_usd + fixed_fee_usd

            # Total source amount includes both the FX conversion and the fixed wire fee in source currency
            fixed_fee_in_source = fixed_fee_usd * source_per_usd
            total_source_amount = required_source_for_fx + fixed_fee_in_source
            total_cost_usd = ideal_usd + total_fee_usd
            total_costs_usd.append(total_cost_usd)

            routes.append(
                RemittanceRoute(
                    rail_name=str(rail["rail_name"]),
                    exchange_rate=_round_rate(effective_rate),
                    source_currency=source_currency,
                    source_amount=_round_cents(total_source_amount),
                    target_currency=target_currency,
                    target_amount=_round_cents(dec_target_amount),
                    total_fee_usd=_round_cents(total_fee_usd),
                    estimated_arrival_hours=int(rail["estimated_arrival_hours"]),
                    is_recommended=False,
                    savings_vs_standard_usd=0.0,
                )
            )

        standard_cost_usd = total_costs_usd[0]
        min_cost_idx = min(range(len(total_costs_usd)), key=lambda idx: total_costs_usd[idx])

        for idx, route in enumerate(routes):
            savings = max(Decimal("0.0"), standard_cost_usd - total_costs_usd[idx])
            route.savings_vs_standard_usd = _round_cents(savings)
            route.is_recommended = idx == min_cost_idx

        return routes

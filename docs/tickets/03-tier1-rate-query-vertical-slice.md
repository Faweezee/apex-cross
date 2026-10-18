# 03: Tier 1 Rate Query & Corridor Optimizer (Vertical Slice)

**What to build:** An end-to-end tracer bullet for Tier 1 autonomous rate inquiries. The user requests exchange rates and fee comparisons across APEC currencies in the UI; the system fetches live rates, runs deterministic fee comparison without LLM math, and renders an interactive rate card with zero confirmation needed.

**Blocked by:** 02: Universal Pydantic Schemas & TypeScript Contracts.

**Status:** ready-for-agent

- [ ] `backend/app/tools/fx_calculator.py` implements deterministic spread and fee comparison across USD, CNY, HKD, AUD, SGD with local JSON fallback.
- [ ] `GET /api/fx/rates` endpoint returns live spreads and corridor fee estimates.
- [ ] Frontend displays interactive rate card showing fee savings between Standard Bank Wire vs. Direct Clearing.
- [ ] Unit test `backend/tests/test_fx_calculator.py` passes 100% of mathematical currency conversion assertions.

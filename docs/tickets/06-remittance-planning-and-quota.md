# 06: Corridor Planning & Annual Quota Engine

**What to build:** The planning engine that evaluates the student's remaining annual foreign exchange quota ($50,000 USD limit) and compiles an executable Directed Acyclic Graph (DAG) comparing multi-rail clearing routes.

**Blocked by:** 03: Tier 1 Rate Query & Corridor Optimizer, 05: Multimodal Tuition Invoice Ingestion.

**Status:** completed (Backend Track)

- [x] `backend/app/tools/quota_tool.py` tracks remaining annual student quota and returns compliance clearance.
- [x] LangGraph agent compiles multi-step DAG: `[ValidateStudent] -> [CheckQuota] -> [CompareCorridors] -> [AwaitAuthorization]`.
- [ ] Frontend renders dynamic visual execution graph showing step progress and calculated corridor savings.

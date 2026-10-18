# 02: Universal Pydantic Schemas & TypeScript Contracts

**What to build:** Shared, typed data contracts across backend and frontend defining the data structures for foreign exchange rates, university tuition invoices, task DAGs, security tiers, and audit records.

**Blocked by:** 01: Monorepo Scaffolding & Dual-Runtime Healthcheck.

**Status:** ready-for-agent

- [ ] `backend/app/schemas.py` defines `SecurityTier`, `CurrencyEnum`, `RemittanceRoute`, `UniversityInvoice`, `DagTask`, `RemittancePlan`, and `AuditRecord`.
- [ ] `frontend/src/types/index.ts` exports mirroring TypeScript interfaces with zero `any` types.
- [ ] Unit tests in `backend/tests/test_schemas.py` verify JSON serialization and validation constraints.

# Quality Report

Maintained by Antigravity (QA). Branch: `feat/frontend-mvp`.

## Progress

| Task | Status | Commit |
| :--- | :--- | :--- |
| D: Static assets | Done | `ef3b26a` chore(assets): add svg patterns, noise texture, and favicons |
| A: Mock fixtures | Done (standalone tsc clean) | `4c63f26` chore(mocks): create api mock fixtures for all 8 endpoints |
| C: Vitest config and unit tests | Waiting on Cline Phase 2 | - |
| B: E2E suite | Waiting on Cline Phases 3-6 | - |

## Phase 1: Scaffold
- [ ] `npx tsc --noEmit`: zero errors
- [ ] `npm run build`: succeeds
- [ ] All design tokens present in tailwind.config.ts

## Phase 2: App Shell
- [ ] `npm run build`: zero errors
- [ ] Theme toggle persists
- [ ] Health indicator renders

## Phase 3: Chat & Invoice
- [ ] `npm run build`: zero errors
- [ ] Chat input accepts and submits text
- [ ] Invoice dropzone accepts files
- [ ] Invoice modal opens and closes

## Phase 4: DAG & Corridors
- [ ] `npm run build`: zero errors
- [ ] DAG renders 4 steps
- [ ] 3 corridor cards render
- [ ] Quota bar shows correct data

## Phase 5: Execution Modals
- [ ] `npm run build`: zero errors
- [ ] Tier 2 modal opens and closes
- [ ] Tier 3 modal opens and closes
- [ ] SWIFT receipt displays correctly

## Phase 6: Audit & Final
- [ ] `npm run build`: zero errors
- [ ] Audit table renders records
- [ ] Chain verification works
- [ ] ALL E2E tests pass (`npx playwright test`)
- [ ] ALL unit tests pass (`npx vitest run`)
- [ ] Zero TypeScript errors (`npx tsc --noEmit`)
- [ ] Zero ESLint warnings (`npx next lint`)

## Pending Test Hooks

None yet. `data-testid` requests will be listed here once E2E specs are written.

## Mock vs API Discrepancies

- `src/types/index.ts` has no `AgentChatResponse`, `FXRatesResponse`, `InvoiceUploadResponse`, `SwiftWireReceipt`, `WebAuthnVerifyResponse`, `MicroConvertResponse`, `ChainedAuditRecord`, `AuditChainVerification` or `AuditLogsResponse`. The mocks define these locally in `src/lib/__mocks__/types.ts`, copied from `backend/openapi.json`. Request to Cline: export them from `src/types` so `api.ts` and mocks share one definition.
- `GET /api/fx/rates` returns `FXRatesResponse` (`mid_market_rate`, `all_usd_rates`, `routes`), not a plain rate table. `mockFxRatesResponse()` follows the OpenAPI shape. The brief's other pairs (CNY/USD 0.1389, CNY/AUD 0.2134, CNY/SGD 0.1863) are exported as constants only, since the response carries just one target pair and USD-based rates.
- `GET /api/audit/logs` records include `record_hash`, which `AuditRecord` in `src/types` lacks.
- `GET /api/health` returns `Record<string, string>`. The mock uses `{ status: 'healthy', service: 'apexcross-backend' }`. `mockUnhealthyResponse()` is an HTTP 503 error object. Tests simulate a fully offline backend with `route.abort()`.
- Error mocks (403 and 400) are `{ status, body: { detail } }`. The OpenAPI spec doesn't document error bodies, so the `detail` text is an assumption to check against the backend.

## Open Questions / Environment Notes

- `frontend/node_modules` is not installed, so `npx tsc --noEmit --project tsconfig.json` and `npx playwright test --list` cannot run yet. The mocks were checked with a standalone `tsc` run against a scratch tsconfig outside the repo.
- `frontend/tsconfig.json` lists `vitest/globals` in `types`, so `vitest` must be in Cline's `package.json` devDependencies. `@playwright/test` is also needed.

# ApexCross Frontend — Test Suite

All frontend tests live under this single root. Production code never imports from here.

```
tests/
├── fixtures/          Shared API response factories (no test-runner dependency)
│   ├── agent.ts         POST /api/agent/chat  — plan ready, clarification, quota, firewall 403
│   ├── fx.ts            GET  /api/fx/rates
│   ├── invoice.ts       POST /api/invoice/upload
│   ├── auth.ts          POST /api/auth/reauth/options + /verify
│   ├── transfers.ts     POST /api/transfers/micro-convert
│   ├── audit.ts         GET  /api/audit/logs + /verify
│   ├── health.ts        GET  /api/health
│   ├── types.ts         Response types used by the fixtures
│   └── index.ts         Barrel export
│
├── unit/              Vitest — pure logic, no browser
│   ├── api.test.ts      Typed API client: endpoints, 403 parsing, error mapping
│   ├── utils.test.ts    cn(), formatters, hash truncation, quota maths
│   └── fixtures.test.ts Contract checks on the fixture factories themselves
│
└── e2e/               Playwright — real browser against the Next.js server
    ├── support/
    │   └── helpers.ts   mockBackend(), openApp(), sendMessage(), WebAuthn stub, RAILS
    ├── shell/           App chrome & first-run experience
    │   ├── health-indicator.spec.ts
    │   ├── theme-toggle.spec.ts
    │   └── welcome-screen.spec.ts
    ├── components/      One spec per interactive surface
    │   ├── audit-ledger.spec.ts
    │   ├── corridor-cards.spec.ts
    │   ├── dag-visualizer.spec.ts
    │   ├── invoice-upload.spec.ts
    │   ├── quota-display.spec.ts
    │   ├── swift-receipt.spec.ts
    │   ├── tier2-modal.spec.ts
    │   └── tier3-passkey.spec.ts
    ├── flows/           Multi-step user journeys
    │   ├── chat-flow.spec.ts
    │   └── full-happy-path.spec.ts
    └── security/        Adversarial & fail-closed behaviour
        └── security-firewall.spec.ts
```

## Running

```bash
npm run test        # Vitest unit suite (tests/unit)
npm run test:e2e    # Playwright suite  (tests/e2e, Chromium + Firefox)
npm run test:watch  # Vitest in watch mode
```

Playwright reuses a server already listening on `:3000`, otherwise it runs
`npm run start` itself — so build first with `npm run build`.

## Conventions

- **Import paths are relative.** `../../fixtures` from a spec, `../support/helpers`
  for helpers, `@/...` only for application source under `src/`.
- **All backend traffic is mocked** via `page.route()` in `support/helpers.ts`. The
  E2E suite never needs the FastAPI backend running.
- **Every assertion targets a `data-testid`** rather than copy or CSS, so design
  changes do not break tests. The one exception is the welcome headline copy.
- **Add a spec to the right bucket:** app chrome -> `shell/`, a single interactive
  surface -> `components/`, a multi-screen journey -> `flows/`, adversarial or
  fail-closed behaviour -> `security/`.
- **New backend endpoint?** Add a fixture factory in `fixtures/`, then cover it in
  `unit/api.test.ts`.

# CONTEXT & ARCHITECTURE: ApexCross (汇护通)

---

## 1. Project Objective & Strategic Context

* **Event:** Fintechathon 2026 (Shenzhen International FinTech Competition - WeBank Challenge).
* **Track:** International Track (Artificial Intelligence Direction).
* **Guiding Bodies:** Shenzhen Municipal Local Financial Administration, Shenzhen University, WeBank. Technical guidance by CCF, Tsinghua Institute of FinTech, IEEE CIS Singapore & Shenzhen.
* **Core Theme:** *"AI as a Financial Participant"* - building an agent that can **Understand, Plan, and Execute Securely**.
* **Chosen Track:** **Direction C - Cross-border / International Student Financial Assistant** *(Official Website Highlight: "APEC 特色 / APEC Feature")*.
* **One-Line Objective:** *ApexCross is an autonomous, compliance-first cross-border financial agent that parses university tuition invoices, optimizes multi-currency FX remittance corridors across APEC economies, and securely executes bank-grade wires under FIDO2/WebAuthn biometric guardrails.*

---

## 2. Tech Stack & Environmental Truth

| Layer | Technology | Version / Specifics | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js | 15.x (App Router, TypeScript) | Blazing fast, React Server Components, clean API routes. |
| **Styling & Icons** | Tailwind CSS + Lucide React | v3.4+ / standard icons | Rapid UI scaffolding, zero bundle bloat. |
| **Native Modals** | HTML5 `<dialog>` + Popovers | Modern Web Baseline | Accessible, native top-layer focus management without third-party dialog weight. |
| **Biometric Auth** | WebAuthn / FIDO2 | `@simplewebauthn/browser` (v10+) | Hardware-backed biometric confirmation (Touch ID / Face ID / Windows Hello). |
| **Backend Framework** | FastAPI | 0.115+ (Python 3.11+) | Async performance, native Pydantic v2 validation, OpenAPI docs. |
| **Agent Orchestration** | LangGraph + LiteLLM | LangGraph 0.2+, LiteLLM 1.50+ | Deterministic cyclic state graphs, explicit rollback hooks, unified model gateway. |
| **LLM Models** | OpenAI GPT-4o-mini / Claude 3.5 Sonnet | Via LiteLLM API keys | Deterministic JSON schema compliance, high speed, multi-modal invoice parsing. |
| **Audit Ledger** | SQLite with WAL Mode | Python built-in `sqlite3` | Zero-config, append-only, cryptographic SHA-256 hash chaining. |
| **FX Data Source** | ExchangeRate-API / Mock Local | REST JSON | Real-time rates with instant local cache fallback for demo resilience. |

---

## 3. System Architecture & Component Boundaries

```
apex-cross/
├── backend/
│   ├── app/
│   │   ├── agent/               # LangGraph state machine, nodes, and router
│   │   │   ├── graph.py         # Main execution graph (Understand -> Plan -> Execute)
│   │   │   ├── prompts.py       # System instructions, few-shot injection filters
│   │   │   └── state.py         # AgentState Pydantic definition
│   │   ├── routes/              # FastAPI REST API endpoints
│   │   │   ├── agent_routes.py  # Chat stream, invoice upload, clarification
│   │   │   ├── auth_routes.py   # WebAuthn options generation & verification
│   │   │   └── fx_routes.py     # Live FX rates and currency routes
│   │   ├── security/            # Security middleware & validation
│   │   │   ├── firewall.py      # Llama-Guard / RegEx injection & jailbreak firewall
│   │   │   ├── permission.py    # 3-Tier authorization evaluator
│   │   │   └── audit_logger.py  # Append-only SHA-256 hash-chained ledger
│   │   ├── tools/               # Deterministic execution tools
│   │   │   ├── fx_calculator.py # Mathematical spread & fee comparison
│   │   │   ├── quota_tool.py    # Annual student foreign exchange quota tracking
│   │   │   └── wire_service.py  # Sandbox SWIFT MT103 / Wise mock clearing rail
│   │   ├── config.py            # Environment settings and secrets
│   │   ├── main.py              # FastAPI application factory
│   │   └── schemas.py           # Universal Pydantic v2 data models
│   └── tests/                   # Pytest test suite
│       ├── test_firewall.py     # 15 adversarial injection test cases
│       └── test_agent_dag.py    # DAG compilation and rollback verification
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router (layout, page)
│   │   ├── components/          # React components
│   │   │   ├── ChatInterface.tsx# Interactive message stream & dropzone
│   │   │   ├── DagViewer.tsx    # Visual DAG task progression indicator
│   │   │   ├── InvoiceModal.tsx # Invoice extraction preview modal
│   │   │   ├── PasskeyModal.tsx # Tier 3 WebAuthn biometric trigger component
│   │   │   └── AuditTable.tsx   # Cryptographic ledger inspector
│   │   ├── lib/                 # Frontend utilities & WebAuthn helper
│   │   └── types/               # TypeScript interfaces matching backend schemas
│   ├── package.json
│   └── tailwind.config.ts
└── docs/                        # Submission artifacts & documentation
    ├── technical_document.docx
    ├── presentation_deck.pptx
    └── security_assessment.docx
```

---

## 4. The 3-Tier Security Architecture

The system strictly enforces the competition's high-priority permission model:

```
[ Tier 1: Read-Only / Inquiries ]
- Operations: Balance query, FX rate check, tuition due date alert, historical fee lookup.
- Security Policy: Autonomous execution. No user confirmation needed.

[ Tier 2: Low-Risk / Micro-Operations (<= $500 USD equivalent) ]
- Operations: Currency wallet rebalancing, rate limit trigger setup.
- Security Policy: Explicit confirmation via native <dialog> card displaying fees, slippage, and balances. Requires one click.

[ Tier 3: High-Risk Operations (> $1,000 USD, Wire Transfers, Beneficiary Additions) ]
- Operations: Cross-border tuition remittance, adding unverified beneficiary IBAN.
- Security Policy: Hardware-backed WebAuthn Passkey (FIDO2) step-up challenge. The user MUST provide biometric verification (FaceID/TouchID/Windows Hello) constrained strictly to their pre-registered public key credential.
```

---

## 5. The Graveyard (Rejected Approaches & Negative Constraints)

Do NOT re-propose or implement any of the following rejected concepts:

| Rejected Concept | Why It Was Rejected | Hard Rule for New Agent |
| :--- | :--- | :--- |
| **Direction A (Personal Finance / Budgeting)** | Highly crowded, generic, low technical barrier. Previous hackathons had dozens of identical budget bots. | Do not pivot to generic expense tracking or budget chatbot features. |
| **Direction B (Wealth / Investment Advisory)** | Directly duplicates recent winning projects (2025 1st 灵操盘, 2nd 易金经, 3rd FinAgent). Judges will find it repetitive. | Do not implement stock picking, ETF backtesting, or portfolio optimization. |
| **Direction F (Autonomous Web3 Agent Wallet)** | On-chain gas fees, faucet dependencies, private key custody risks, and testnet RPC rate limits make live demos extremely fragile in 24 hours. | Do not make real blockchain smart contracts or on-chain crypto wallet keys a mandatory dependency for the core flow. |
| **LLM Floating-Point Arithmetic** | Large language models regularly hallucinate decimals, currency conversions, and fee sums. | Never allow an LLM prompt to compute totals. Always invoke deterministic Python tools (`fx_calculator.py`). |
| **Mocking Security via Simple 'OK' Buttons** | The rubric allocates 30% to Security & Compliance and heavily penalizes superficial guardrails. | All Tier 3 transfers must trigger real WebAuthn biometric challenges via browser APIs. |
| **Heavy UI Component Libraries (e.g., MUI, AntD)** | Inflate bundle size, complicate styling overrides, and introduce hydration bugs during 24h rapid builds. | Rely strictly on Tailwind CSS, Lucide icons, and native HTML5 elements. |
| **Unbounded Autonomous Agent Loops** | Pure ReAct loops can get trapped in recursive tool-calling cycles during a live presentation. | All plans must compile to a deterministic, acyclic Directed Acyclic Graph (DAG) with finite retry limits. |

# ROADMAP & EXECUTION GRAPH: ApexCross (汇护通)

> **Execution Policy:** Strictly implement one ticket at a time. Individual vertical-slice tickets following the `/to-tickets` specification are maintained in `docs/tickets/` (`01-environment-scaffold.md` through `10-hackathon-deliverables-package.md`). Run each ticket's verification command and obtain a passing state before moving to the next ticket.

---

### Ticket 01: Monorepo Scaffolding & Dual-Runtime Healthcheck
* **Skill Focus:** `codebase-design`, `git-commit-sage`
* **Input Context:** `AGENT_BOOTSTRAP.md`, `CONTEXT_AND_ARCHITECTURE.md`
* **Tasks:**
  - [x] Initialize Python backend with `pyproject.toml` / `requirements.txt` (`fastapi`, `uvicorn`, `langgraph`, `litellm`, `pydantic`, `py_webauthn`, `pytest`).
  - [ ] Initialize Next.js 15 frontend with TypeScript, Tailwind CSS, and Lucide React.
  - [x] Setup CORS middleware and healthcheck endpoint (`GET /api/health`).
  - [x] Verify directory structure matches `CONTEXT_AND_ARCHITECTURE.md`.
* **Definition of Done:**
  ```bash
  curl http://localhost:8000/api/health
  # Returns: {"status": "healthy", "service": "ApexCross"}
  ```

---

### Ticket 02: Pydantic v2 Schemas & Data Model Contracts
* **Skill Focus:** `superpowers`, `codebase-design`
* **Input Context:** `INITIAL_ARTIFACTS.md`
* **Tasks:**
  - [x] Create `backend/app/schemas.py` with typed models:
    - `SecurityTier`, `CurrencyEnum`, `RemittanceRoute`, `UniversityInvoice`, `DagTask`, `RemittancePlan`, `AuditRecord`.
  - [x] Create `frontend/src/types/index.ts` mirroring all backend interfaces.
  - [x] Write schema validation tests in `backend/tests/test_schemas.py`.
* **Definition of Done:**
  ```bash
  pytest backend/tests/test_schemas.py
  # Passes 100% of schema serialization/deserialization tests.
  ```

---

### Ticket 03: Deterministic FX Calculator & Corridor Optimizer
* **Skill Focus:** `tdd`, `codebase-design`
* **Input Context:** `backend/app/schemas.py`
* **Tasks:**
  - [x] Write failing unit test `backend/tests/test_fx_calculator.py` testing cross-currency conversions and fee savings.
  - [x] Implement `backend/app/tools/fx_calculator.py`:
    - Real-time exchange rate fetching with local JSON fallback.
    - Deterministic corridor comparator (Standard Bank Wire vs. Direct Clearing vs. Wise).
    - Precise fee and arrival time calculation without LLM math.
* **Definition of Done:**
  ```bash
  pytest backend/tests/test_fx_calculator.py
  # Passes all mathematical currency conversion and spread comparison tests.
  ```

---

### Ticket 04: Annual Regulatory Quota Engine
* **Skill Focus:** `tdd`
* **Input Context:** Regulatory quota requirement ($50,000 USD annual limit for students)
* **Tasks:**
  - [x] Write unit test `backend/tests/test_quota.py` checking allowance boundaries and rejection logic.
  - [x] Implement `backend/app/tools/quota_tool.py`:
    - Tracks user's remaining annual education quota.
    - Returns `ALLOW`, `WARNING`, or `REJECT` flags with exact remaining allowance.
* **Definition of Done:**
  ```bash
  pytest backend/tests/test_quota.py
  # Successfully flags a $55,000 wire as exceeding annual allowance.
  ```

---

### Ticket 05: Prompt Injection & Adversarial Security Firewall
* **Skill Focus:** `security-scanner`, `tdd`
* **Input Context:** 30% Security & Compliance judging rubric
* **Tasks:**
  - [x] Port `backend/app/security/firewall.py` from `INITIAL_ARTIFACTS.md`.
  - [x] Port `backend/tests/test_security_firewall.py` with 15 adversarial injection test cases.
  - [x] Implement heuristic & regex regex patterns blocking prompt overrides, delimiter leaks, and unauthorized wire calls.
* **Definition of Done:**
  ```bash
  pytest backend/tests/test_security_firewall.py
  # Passes 100% of adversarial jailbreak tests with zero false positives on valid wires.
  ```

---

### Ticket 06: LangGraph Multi-Modal Agent State Machine
* **Skill Focus:** `superpowers`, `codebase-design`
* **Input Context:** "Understand -> Plan -> Execute Securely" loop
* **Tasks:**
  - [x] Implement `backend/app/agent/state.py` (`AgentState`).
  - [x] Implement `backend/app/agent/nodes.py`:
    - `understand_intent_node`: Extract beneficiary, amount, currency, deadline.
    - `parse_invoice_node`: Ingest and OCR university fee invoice.
    - `plan_remittance_node`: Compile sequential DAG tasks (`ValidateStudent` -> `CheckQuota` -> `CompareCorridors` -> `AwaitingAuth`).
    - `clarification_node`: Interactively prompt user when critical fields are missing.
  - [x] Compile graph in `backend/app/agent/graph.py` with rollback support.
  - [x] Expose endpoint `POST /api/agent/chat`.
* **Definition of Done:**
  ```bash
  curl -X POST http://localhost:8000/api/agent/chat -H "Content-Type: application/json" -d '{"message": "Wire 85,000 HKD tuition to HKUST"}'
  # Returns structured DAG response with Tier 3 security flag and corridor route.
  ```

---

### Ticket 07: WebAuthn FIDO2 Biometric Challenge & Verification
* **Skill Focus:** `security-scanner`, `modern-web-guidance`
* **Input Context:** FIDO2 Passkey re-authentication specification
* **Tasks:**
  - [x] Implement `backend/app/security/webauthn_service.py`:
    - Generate cryptographic challenge with `allowCredentials` restricted to user.
    - Verify assertion response against stored user credentials.
  - [x] Implement `backend/app/security/audit_logger.py`:
    - SQLite append-only log with SHA-256 hash chaining.
  - [x] Expose endpoints `POST /api/auth/reauth/options` and `POST /api/auth/reauth/verify`.
* **Definition of Done:**
  ```bash
  pytest backend/tests/test_webauthn_service.py
  # Verifies successful assertion verification and rejection of spoofed credentials.
  ```

---

### Ticket 08: Next.js Frontend Shell & Anti-Vibe Design System
* **Skill Focus:** `modern-web-guidance`, `impeccable`, `ui-ux-pro-max`
* **Input Context:** Zero generic AI tropes. Clean, accessible fintech styling.
* **Tasks:**
  - [ ] Setup base layout with dark/light mode toggle and clean neutral/navy palette.
  - [ ] Implement `frontend/src/components/ChatInterface.tsx` with streaming chat bubbles and invoice dropzone.
  - [ ] Add invoice upload drag-and-drop supporting PDF/image preview.
* **Definition of Done:**
  ```bash
  npm run build --prefix frontend
  # Next.js builds with zero TypeScript errors or ESLint warnings.
  ```

---

### Ticket 09: Dynamic DAG Visualizer & Native Passkey Modal Integration
* **Skill Focus:** `modern-web-guidance`, `impeccable`
* **Input Context:** Interactive DAG visualization and WebAuthn browser trigger
* **Tasks:**
  - [ ] Implement `frontend/src/components/DagViewer.tsx`:
    - Animated execution graph showing step progress (Pending, Active, Completed, Blocked).
  - [ ] Implement `frontend/src/components/PasskeyModal.tsx`:
    - Trigger native FaceID/TouchID/Windows Hello via `@simplewebauthn/browser`.
  - [ ] Implement `frontend/src/components/AuditTable.tsx`:
    - Live cryptographic audit log inspector showing SHA-256 hash-chaining.
* **Definition of Done:**
  - Dropping an invoice renders the visual DAG, prompts for biometric Touch ID, and displays confirmed SWIFT MT103 receipt upon biometric success.

---

### Ticket 10: E2E Integration, Packaging & Hackathon Submission
* **Skill Focus:** `code-review`, `security-scanner`, `git-commit-sage`
* **Input Context:** Official Fintechathon 2026 International Track Submission Package
* **Tasks:**
  - [ ] Run full end-to-end integration test across frontend and backend.
  - [ ] Fill out `docs/technical_document.docx` (Project Overview, System Architecture, Agent Design, Security Design, Deployment).
  - [ ] Fill out `docs/presentation_deck.pptx` (10-slide defense outline).
  - [ ] Fill out `docs/security_assessment.docx` and `docs/execution_evidence.docx`.
  - [ ] Record and edit 4-minute demo video (`docs/demo_video.mp4`).
  - [ ] Format root `README.md` with one-command Docker launch instructions.
* **Definition of Done:**
  - All unit/security tests pass (100% green).
  - Docker compose launches both services without errors.
  - Complete submission archive matches the official naming convention.

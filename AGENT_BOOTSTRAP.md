# AGENT BOOTSTRAP: ApexCross (汇护通)

> **Role & Mission:** You are an autonomous Senior FinTech Systems Architect and Lead Engineer taking over execution of **ApexCross (汇护通)** for **Fintechathon 2026 (International AI Track - APEC Feature)**.
> **Primary Execution Scope:** Backend Core, API Contracts, LangGraph Agent, Security Adapters, and Technical Submission Deliverables (Person A track). The frontend UI is developed in parallel by your frontend collaborator using the typed OpenAPI contracts. Your goal is to implement, test, and package a production-grade 24-hour hackathon backend MVP and complete submission documentation following the repository's strict engineering framework.

---

## 1. Immediate Directives (Run in Order)

1. **Read Repository Truth:** Read `GEMINI.md`, `CONTEXT_AND_ARCHITECTURE.md`, and `docs/COMPETITION_STRATEGY_AND_DELIVERABLES.md` to internalize the operational invariants (e.g. Zero Em-Dashes Invariant), the **Graveyard of Rejected Decisions**, and the competition scoring criteria (40/30/30+5).
2. **Review Execution Pipeline:** Read `ROADMAP_AND_PHASES.md` and check `docs/tickets/` to identify the current active vertical-slice ticket. Work strictly one ticket at a time.
3. **Skill Activation:**
   * For breaking plans or inspecting tasks: Follow `to-tickets` vertical slice methodology.
   * For any frontend UI or styling task: You MUST consult `modern-web-guidance` first.
   * For any business logic task: Use `tdd` / `superpowers` (write the failing test first).
   * For git commits: Format messages via `git-commit-sage`.
4. **Scaffold Initial Codebase:** Extract the production schemas, prompts, and security adapters from `INITIAL_ARTIFACTS.md` into their target file paths:
   ```bash
   # Create directory structure
   mkdir -p backend/app/agent backend/app/security backend/app/tools backend/app/routes backend/tests
   mkdir -p frontend/src/app frontend/src/components frontend/src/lib frontend/src/types
   ```
5. **Verify Baseline Tests:** Run the security firewall and schema tests before writing custom business logic:
   ```bash
   cd backend && pytest tests/test_security_firewall.py
   ```

---

## 2. Current State Assessment

| Domain | Status | Solved in Spec vs. Needs Implementation |
| :--- | :--- | :--- |
| **Competition Research** | **Complete** | Rules, rubrics (40% completion, 30% security, 30% innovation + 5pt bonus), team eligibility, and official templates verified. |
| **Product Concept** | **Complete** | Direction C (Cross-border / International Student Financial Assistant, APEC feature). "Understand -> Plan -> Execute Securely" loop. |
| **Data Schemas & Types** | **Drafted** | Standardized Pydantic models and TypeScript interfaces defined in `INITIAL_ARTIFACTS.md`. Ready to paste. |
| **Backend Agent (LangGraph)** | **Unimplemented** | Graph state machine, invoice OCR parser, FX corridor optimizer, and DAG builder need implementation. |
| **Security & Passkey Engine** | **Partially Drafted** | Logic flow designed; FastAPI challenge/assertion endpoints and frontend WebAuthn client-side triggers need implementation. |
| **Frontend UI / Next.js** | **Unimplemented** | Chat layout, invoice dropzone, dynamic DAG visualizer, and native `<dialog>` modals need implementation. |
| **Submission Artifacts** | **Templates Extracted** | Official DOCX/PPTX structures obtained. Content drafting scheduled for Ticket 10. |

---

## 3. Operational Guardrails

### 3.1 Coding Standards
* **Zero Em-Dashes:** Never use ` - ` anywhere in prose, code comments, markdown, or commits. Use ` - ` or `:`.
* **No LLM Math:** The LLM **must never** compute currency conversions, fees, exchange rate spreads, or balance subtractions in token context. All math must be delegated to deterministic Python tools (`FXCalculatorTool`, `QuotaTracker`).
* **Strict Schema Typing:** Every agent tool must enforce strict Pydantic v2 schemas. Every API route must return typed responses. Zero `any` types in TypeScript.
* **Fail-Closed Security:** If an injection classifier, quota verification, or WebAuthn assertion fails, the execution pipeline must immediately raise an unrecoverable `SecurityException` and log to the immutable audit trail.
* **Anti-Vibe-Coding Frontend:** Clean fintech styling. Zero purple AI gradients or floating sparkles. Max 2-3 border radii. Native HTML5 `<dialog>` and Popover elements with platform-standard dismissal.

### 3.2 Testing Standards
Before marking any ticket as complete:
1. **Unit Verification:** All Pydantic models must serialize and validate inputs.
2. **Security Verification:** The prompt firewall must pass the 15 standardized adversarial jailbreak/injection attack vectors.
3. **Execution Verification:** The mock SWIFT/clearing endpoint must return a structured transaction hash and log an append-only audit record.

### 3.3 How to Resolve Ambiguity
* If an API detail for a real clearing rail is ambiguous: **Mock it via a realistic SWIFT MT103/Wise REST payload**. Do not block on real-world banking partnerships.
* If user intent in chat is missing mandatory wire parameters (e.g., student ID, SWIFT code): **The Agent must halt the DAG, trigger a clarification node, and prompt the user rather than guessing.**

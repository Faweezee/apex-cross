# ApexCross (汇护通)

> **Autonomous, Compliance-First Cross-Border Financial Participant Agent for APEC International Students**
> **Competition:** Fintechathon 2026 (Shenzhen International FinTech Competition - WeBank Challenge)
> **Track:** International Track - Artificial Intelligence Direction (Direction C: Cross-Border / International Student Financial Assistant - APEC Feature)

---

## 1. Overview & Core Architecture

**ApexCross (汇护通)** solves the \$120B annual international student tuition remittance problem across APEC economies through a strict **Understand -> Plan -> Execute Securely** loop:

1. **Understand (Multimodal Invoice Ingestion):** Parses university tuition bills (`PDF`, `PNG`, `JPG`) and conversational requests into a typed `UniversityInvoice` schema (`institution_name`, `beneficiary_account`, `swift_code`, `amount_due`, `currency`, `due_date`, `student_id`, and `confidence_score`).
2. **Plan (Deterministic Acyclic DAG & Zero LLM Math):** Compiles a finite 4-step Directed Acyclic Graph (`[ValidateStudent] -> [CheckQuota] -> [CompareCorridors] -> [AwaitAuthorization]`). All currency conversions, spread comparisons (`Standard SWIFT Bank Wire` vs. `APEC Direct Clearing` vs. `Wise Multi-Currency Corridor`), and \$50,000 USD annual student foreign exchange quota checks are executed by deterministic Python `Decimal` tools (`fx_calculator.py`, `quota_tool.py`).
3. **Execute Securely (3-Tier Permission Matrix & FIDO2 WebAuthn):**
   * **Tier 1 (`TIER_1_AUTONOMOUS`):** Read-only live/cached APEC FX rate queries and corridor comparisons (`GET /api/fx/rates`).
   * **Tier 2 (`TIER_2_CONFIRMATION`):** Micro-conversions $\le \$500$ USD equivalent with explicit 1-click confirmation and basis-point slippage locks (`POST /api/transfers/micro-convert`).
   * **Tier 3 (`TIER_3_BIOMETRIC`):** High-value tuition wires ($> \$1,000$ USD) protected by FIDO2 WebAuthn hardware passkey challenges (`POST /api/auth/reauth/options` and `POST /api/auth/reauth/verify`) verified cryptographically via `py_webauthn` before dispatching a settled SWIFT MT103 receipt.
4. **Defense-in-Depth & Immutable Audit Trail:**
   * **Pre-Agent Adversarial Firewall:** Intercepts 15 standardized prompt injection, jailbreak, delimiter leak, XSS, and SQLi vectors with fail-closed `HTTP 403` (`SecurityException`).
   * **SHA-256 Cryptographic Audit Ledger:** Append-only SQLite WAL database chaining every transaction and security event (`previous_hash -> record_hash`), inspectable via `GET /api/audit/logs` and `GET /api/audit/verify`.

---

## 2. One-Command Quick Start (Docker Compose)

Launch both the FastAPI backend (port `8000`) and Next.js 15 frontend (port `3000`):

```bash
docker compose up --build
```

* **Backend Healthcheck:** `http://localhost:8000/api/health`
* **Interactive OpenAPI / Swagger Documentation:** `http://localhost:8000/docs`
* **Exported OpenAPI 3.1 Contract:** `backend/openapi.json` and `frontend/src/types/openapi.json`
* **Frontend Application:** `http://localhost:3000`

---

## 3. Local Backend Development & Verification

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Run the Automated Test Suite (100% Green)

```bash
cd backend
pytest
```

Test coverage includes:
* `tests/test_health.py`: Healthcheck and CORS (`http://localhost:3000`) verification.
* `tests/test_schemas.py`: Universal Pydantic v2 schema serialization and OpenAPI 3.1 contract export.
* `tests/test_fx_calculator.py`: Deterministic `Decimal` cross-currency conversions and corridor fee savings.
* `tests/test_security_firewall.py`: 15 standardized adversarial attack vectors blocked (`HTTP 403`) with zero false positives.
* `tests/test_invoice_parser.py`: Multimodal tuition invoice extraction and per-field confidence scoring.
* `tests/test_agent_graph.py` & `tests/test_quota.py`: LangGraph 4-node DAG compilation, clarification loops, and \$50,000 USD annual SAFE quota enforcement.
* `tests/test_micro_convert.py`: Tier 2 micro-conversion ($\le \$500$ USD), rate locking, and slippage enforcement.
* `tests/test_webauthn_service.py`: FIDO2 WebAuthn ES256 cryptographic signature verification (`py_webauthn`) and SWIFT MT103 wire generation.
* `tests/test_audit_logger.py`: Append-only SQLite SHA-256 hash chaining and tamper detection.

---

## 4. Competition Submission Deliverables (`docs/`)

* [`docs/technical_document.docx`](docs/technical_document.docx): Official 5-section Technical Documentation (Project Overview, System Architecture, Agent Design, Security Design, Deployment and Testing).
* [`docs/presentation_deck.pptx`](docs/presentation_deck.pptx): Official 10-slide Defense Deck aligned with the 40/30/30+5 rubric.
* [`docs/demo_video_script.md`](docs/demo_video_script.md): Shot-by-shot 4-minute Demo Video Script & Walkthrough.
* [`docs/security_assessment.docx`](docs/security_assessment.docx): Security Self-Assessment & 15-Vector Adversarial Benchmark Report.
* [`docs/execution_evidence.docx`](docs/execution_evidence.docx): Automated Test Suite & Verifiable SWIFT MT103 Execution Evidence.

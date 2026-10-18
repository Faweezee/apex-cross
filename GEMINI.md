﻿# GEMINI.md: ApexCross (汇护通) System Rules & Invariants

> Project: ApexCross (汇护通) - Autonomous Cross-Border Financial Participant Agent
> Competition: Fintechathon 2026 (International AI Track - APEC Feature)
> Workspace: C:\Users\USER\Desktop\Programs\Projects\apex-cross

---

## 1. Non-Negotiable Operational Invariants

1. **Zero Em-Dashes Invariant:**
   * NEVER use em-dashes (` - `) anywhere in code, comments, commit messages, PR descriptions, or documentation files.
   * Always use standard hyphens with spaces (` - `) or colons (`:`).
2. **Strict Spec-First & Ticketized Execution:**
   * Never implement random ad-hoc features. All work must follow sequential, numbered Tickets (Ticket 01, Ticket 02, etc.) defined in `ROADMAP_AND_PHASES.md`.
   * Only work on ONE ticket at a time per context window. Do not jump ahead.
3. **Strict Test-Driven Development (TDD):**
   * Follow Red-Green-Refactor. Write failing tests first, confirm failure, implement the minimum code to pass, then refactor.
   * Every ticket must end with a concrete, passing verification command before marking it complete.
4. **No LLM Math in Prompts:**
   * The LLM must NEVER compute currency conversions, fee totals, or quota subtractions in token context. All math must be executed by deterministic Python tools (`fx_calculator.py`, `quota_tool.py`).
5. **Fail-Closed Security Posture:**
   * If input sanitization, quota checks, or WebAuthn cryptographic assertions fail, the pipeline must immediately raise an unrecoverable `SecurityException` and log to the immutable audit trail.
6. **Anti-Vibe-Coding Frontend Standard:**
   * Strict typography and color scales. Zero generic purple AI gradients, zero floating sparkles, max 2-3 border radii across the entire UI.
   * Rely on native HTML5 `<dialog>` and Popovers with standard platform dismissal.

---

## 2. Mandatory Skill Usage Matrix

Every agent working in this repository must proactively trigger and invoke these specialized skills:

| Development Activity | Required Skill | Trigger / Protocol |
| :--- | :--- | :--- |
| **All HTML/CSS & Client JS** | `modern-web-guidance` | **MANDATORY FIRST STEP** before writing UI components or layouts. Search best practices. |
| **Feature Implementation** | `superpowers` & `tdd` | Enforce spec-first design, strict TDD red-green cycles, YAGNI, and deep modular seams. |
| **UI/UX Styling & Tokens** | `impeccable` & `ui-ux-pro-max` | Execute `/impeccable polish` or `/impeccable layout` to eliminate AI tropes and enforce clean fintech palettes. |
| **Git Commits** | `git-commit-sage` | Format all commits using Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). |
| **Code Review & Audits** | `code-review` & `security-scanner` | Audit every completed phase against repo standards and OWASP Top 10 vulnerabilities. |
| **Architecture Design** | `codebase-design` | Ensure deep modules with narrow interfaces, minimizing surface area between frontend and agent state. |

---

## 3. Monorepo Structure

```
apex-cross/
├── GEMINI.md                    # This file (Repository system truth & invariants)
├── AGENT_BOOTSTRAP.md           # Agent onboarding, state assessment & direct command
├── CONTEXT_AND_ARCHITECTURE.md  # Core problem, tech stack, data models & graveyard
├── ROADMAP_AND_PHASES.md        # Numbered execution tickets & verification criteria
├── INITIAL_ARTIFACTS.md         # Production schemas, security firewall & types
├── docker-compose.yml           # Local multi-container staging environment
├── backend/                     # Python 3.11+ FastAPI + LangGraph agent engine
│   ├── app/
│   │   ├── agent/               # State machine, nodes, prompts, DAG compiler
│   │   ├── routes/              # FastAPI endpoints (chat, auth, fx, audit)
│   │   ├── security/            # Firewall, WebAuthn service, permission evaluator
│   │   ├── tools/               # Deterministic FX calculator, quota tracker, mock SWIFT
│   │   ├── config.py            # Environment configurations
│   │   ├── main.py              # Application entrypoint
│   │   └── schemas.py           # Pydantic v2 data models
│   └── tests/                   # Pytest test suite (unit, security, e2e)
├── frontend/                    # Next.js 15 (App Router, Tailwind CSS, TypeScript)
│   └── src/
│       ├── app/                 # App Router pages and layouts
│       ├── components/          # ChatInterface, DagViewer, PasskeyModal, AuditTable
│       ├── lib/                 # WebAuthn browser helpers, API client
│       └── types/               # TypeScript interfaces
└── docs/                        # Hackathon submission documentation
    ├── technical_document.docx  # Official 5-section technical document
    ├── presentation_deck.pptx   # Official 10-slide defense deck
    └── security_assessment.docx # Official security self-assessment
```

# 04: Adversarial Security Firewall & Prompt Sanitizer

**What to build:** An input safety shield that intercepts prompt injection, jailbreaks, delimiter attacks, and unauthorized transfer commands at the API gateway before user input reaches the agent planner.

**Blocked by:** 02: Universal Pydantic Schemas & TypeScript Contracts.

**Status:** ready-for-agent

- [ ] `backend/app/security/firewall.py` implements heuristic and regex pattern matching blocking system overrides and unauthorized wire calls.
- [ ] Gateway returns HTTP 403 with structured security warning on detected attack.
- [ ] Unit test `backend/tests/test_security_firewall.py` passes all 15 standardized adversarial attack test vectors with zero false positives on legitimate student wire prompts.

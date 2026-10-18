# 08: Tier 3 WebAuthn Passkey Biometric Execution (Vertical Slice)

**What to build:** The marquee security feature. High-value wires (> $1,000 USD) trigger a hardware-backed WebAuthn FIDO2 biometric challenge (Touch ID / Face ID / Windows Hello). Upon biometric verification, the backend verifies the cryptographic signature, calls the sandbox SWIFT MT103 clearing rail, and renders a formal wire receipt.

**Blocked by:** 04: Adversarial Security Firewall, 06: Corridor Planning & Annual Quota Engine.

**Status:** completed (Backend Track)

- [x] Backend endpoints `POST /api/auth/reauth/options` and `POST /api/auth/reauth/verify` implement challenge generation and assertion verification.
- [ ] Frontend integrates `@simplewebauthn/browser` to invoke native biometric authenticator.
- [x] Sandbox SWIFT generator returns structured MT103 confirmation message upon successful verification.
- [x] Rejects spoofed or expired credentials with fail-closed security error.

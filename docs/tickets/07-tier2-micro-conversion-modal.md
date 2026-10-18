# 07: Tier 2 Micro-Conversion Modal (Vertical Slice)

**What to build:** An end-to-end flow for low-risk micro-conversions (<= $500 USD equivalent). The system presents a native `<dialog>` confirmation modal showing fee breakdown, slippage, and source/target balances, executing instantly upon a single user click without requiring biometrics.

**Blocked by:** 03: Tier 1 Rate Query & Corridor Optimizer.

**Status:** ready-for-agent

- [ ] Native HTML5 `<dialog>` component with platform-standard dismissal and accessible focus trapping.
- [ ] One-click authorization triggers conversion and updates virtual wallet balances.
- [ ] Audit logger records Tier 2 confirmation with timestamp and user action signature.

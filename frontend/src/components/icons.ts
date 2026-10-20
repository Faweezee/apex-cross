'use client';

/**
 * ApexCross icon layer — premium icon set.
 *
 * Library: `@phosphor-icons/react` (MIT, 1,512 icons, six weight variants).
 * Chosen over generic stroke-only sets because weight variants map directly onto the
 * design system's emphasis tiers, and the optical sizing is consistent at 12–28px.
 *
 * IMPORT STRATEGY: each icon is imported from its own module subpath rather than the
 * package barrel. The barrel re-exports 1,512 declaration files, which makes the
 * TypeScript program graph enormous and slows `tsc` to a crawl; per-icon imports keep
 * the graph to the ~30 icons actually used.
 *
 * WEIGHT CONVENTION (replaces the old `stroke-width` rule — DESIGN_SYSTEM.md §10):
 *   weight="light"    -> decorative, navigation, metadata, large display marks
 *   weight="regular"  -> default body and inline icons
 *   weight="bold"     -> action affordances, primary buttons, emphasis
 *   weight="fill"     -> status indicators and active states
 *   weight="duotone"  -> large feature marks where two-tone depth helps
 *
 * Always import icons from this module, never directly from the package, so the
 * icon system can be swapped in one place.
 */

/* --- Status & signal --- */
export { Broadcast } from '@phosphor-icons/react/dist/csr/Broadcast';
export { Pulse } from '@phosphor-icons/react/dist/csr/Pulse';
export { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
export { CircleDashed } from '@phosphor-icons/react/dist/csr/CircleDashed';
export { XCircle } from '@phosphor-icons/react/dist/csr/XCircle';
export { WarningCircle } from '@phosphor-icons/react/dist/csr/WarningCircle';

/* --- Security & compliance --- */
export { ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck';
export { ShieldWarning } from '@phosphor-icons/react/dist/csr/ShieldWarning';
export { ShieldSlash } from '@phosphor-icons/react/dist/csr/ShieldSlash';
export { Fingerprint } from '@phosphor-icons/react/dist/csr/Fingerprint';
export { Lock } from '@phosphor-icons/react/dist/csr/Lock';

/* --- Money movement --- */
export { ArrowsLeftRight } from '@phosphor-icons/react/dist/csr/ArrowsLeftRight';
export { TrendDown } from '@phosphor-icons/react/dist/csr/TrendDown';
export { Lightning } from '@phosphor-icons/react/dist/csr/Lightning';
export { Gauge } from '@phosphor-icons/react/dist/csr/Gauge';
export { Wallet } from '@phosphor-icons/react/dist/csr/Wallet';

/* --- Documents & receipts --- */
export { FileMagnifyingGlass } from '@phosphor-icons/react/dist/csr/FileMagnifyingGlass';
export { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple';
export { SealCheck } from '@phosphor-icons/react/dist/csr/SealCheck';
export { Paperclip } from '@phosphor-icons/react/dist/csr/Paperclip';

/* --- Audit & verification --- */
export { Link } from '@phosphor-icons/react/dist/csr/Link';
export { ArrowsClockwise } from '@phosphor-icons/react/dist/csr/ArrowsClockwise';
export { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
export { Copy } from '@phosphor-icons/react/dist/csr/Copy';
export { Check } from '@phosphor-icons/react/dist/csr/Check';

/* --- Navigation & chrome --- */
export { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
export { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
export { Sun } from '@phosphor-icons/react/dist/csr/Sun';
export { Moon } from '@phosphor-icons/react/dist/csr/Moon';
export { X } from '@phosphor-icons/react/dist/csr/X';
export { Question } from '@phosphor-icons/react/dist/csr/Question';
export { User } from '@phosphor-icons/react/dist/csr/User';
export { PaperPlaneRight } from '@phosphor-icons/react/dist/csr/PaperPlaneRight';
export { SpinnerGap } from '@phosphor-icons/react/dist/csr/SpinnerGap';

export type { Icon, IconProps, IconWeight } from '@phosphor-icons/react/dist/lib/types';


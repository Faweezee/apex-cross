# ApexCross (汇护通) — Design System

> **Status:** LOCKED — single source of truth for all frontend visual decisions.
> **Scope:** Next.js 15 App Router · TypeScript · Tailwind CSS v3.4 · Lucide React
> **Rule:** Every component references this file. If a value is not here, it does not exist.

---

## 0. Design Intent

ApexCross is an **institutional cross-border banking workspace**, not a consumer app.
It must read as: engineered, trustworthy, calm, precise, premium.

**Tone:** Bank-grade infrastructure. Generous negative space. Quiet confidence.
**Anti-tone:** Playful, gradient-heavy, purple, sparkly, emoji-laden, card-stuffed.

---

## 1. Color Tokens

### 1.1 Selected Primary Pair
`#07191E` (Abyss) × `#02F5A1` (Mint)

**Rationale:** Deep teal-navy conveys institutional authority while remaining culturally
neutral across APEC corridors (CN, HK, AU, SG). Mint reads as "cleared / verified / settled"
— the color of funds moving successfully. Contrast ratio **11.2:1** (WCAG AAA).

### 1.2 Base Layers

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `abyss` | `#07191E` | Root page background, app canvas |
| `deep` | `#0A1628` | Card backgrounds, sidebar, footer |
| `surface` | `#0F172A` | Elevated panels, modal backdrops |
| `elevated` | `#1E293B` | Hover surfaces, active borders, inner cards |

### 1.3 Accents

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `mint` | `#02F5A1` | PRIMARY — CTAs, success, settled badges, active nav, progress |
| `cobalt` | `#0284C7` | SECONDARY — links, Tier 1 badges, informational accents, focus |

### 1.4 Semantic

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `success` | `#059669` | DAG completed, chain verified, quota ALLOW |
| `warning` | `#D97706` | Quota warning, PENDING states, rate expiry countdown |
| `danger` | `#DC2626` | Firewall blocked, quota exceeded, auth failure, tamper |
| `success-soft` | `rgba(5,150,105,0.12)` | Badge backgrounds |
| `warning-soft` | `rgba(217,119,6,0.12)` | Badge backgrounds |
| `danger-soft` | `rgba(220,38,38,0.12)` | Badge backgrounds |

### 1.5 Text

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `text-primary` | `#F1F5F9` | Headings, primary copy |
| `text-secondary` | `#94A3B8` | Descriptions, labels, timestamps |
| `text-muted` | `#64748B` | Placeholders, disabled, metadata |
| `text-on-accent` | `#07191E` | Text on mint buttons/badges |

### 1.6 Glass Tokens

| Token | Value | Usage |
| :--- | :--- | :--- |
| `glass-bg` | `rgba(15, 23, 42, 0.60)` | Tier 1 card backdrop |
| `glass-bg-modal` | `rgba(7, 25, 30, 0.85)` | `<dialog>` backdrop |
| `glass-bg-inline` | `rgba(30, 41, 59, 0.70)` | Badges, pills, tooltips |
| `glass-border` | `rgba(255, 255, 255, 0.08)` | Frosted card edges |
| `glass-border-strong` | `rgba(255, 255, 255, 0.12)` | Hover edges |
| `glass-border-mint` | `rgba(2, 245, 161, 0.20)` | Active / recommended edges |
| `glass-highlight` | `rgba(2, 245, 161, 0.06)` | Top-edge sheen on glass |

### 1.7 Gradients

| Name | Value | Usage |
| :--- | :--- | :--- |
| Hero Mesh | `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(2,245,161,0.12) 0%, transparent 60%)` | Header backdrop glow |
| Card Sheen | `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)` | Overlay on glass cards |
| Accent Glow | `linear-gradient(135deg, #02F5A1 0%, #0284C7 100%)` | Primary CTA fill, active nav bar |
| Mint Fade | `linear-gradient(180deg, rgba(2,245,161,0.15) 0%, transparent 100%)` | Behind success states |
| Danger Fill | `linear-gradient(135deg, #DC2626 0%, #991B1B 100%)` | Blocked/error buttons only |

### 1.8 Texture
## 2. Typography

### 2.1 Font Stack (LOCKED)

| Role | Family | Weight | Fallback |
| :--- | :--- | :--- | :--- |
| **Display** | Abril Fatface | 400 (single weight) | `Georgia, serif` |
| **Headings + Body + UI** | Archivo | 400 / 500 / 600 / 700 | `system-ui, sans-serif` |
| **Monospace (financial)** | IBM Plex Mono | 400 / 500 | `ui-monospace, monospace` |

**Rejected:** Inter, Roboto (generic), Proxima Nova (overused), Times (academic),
Airone (too delicate for fintech), Bahnschrift (Windows-only).

**Rules:**
- Abril Fatface is used for **exactly one element per view** — the welcome headline.
- All currency figures, FX rates, SWIFT MT103 blocks, SHA-256 hashes, wallet balances,
  and transaction IDs use **IBM Plex Mono with `font-variant-numeric: tabular-nums`**.
- Never use monospace for prose. Never use Abril for anything but the display headline.

### 2.2 Type Scale

| Token | Size | Line Height | Tracking | Weight | Family |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display` | 48px | 1.10 | -0.02em | 400 | Abril Fatface |
| `h1` | 32px | 1.20 | -0.01em | 700 | Archivo |
| `h2` | 24px | 1.30 | -0.005em | 600 | Archivo |
| `h3` | 20px | 1.40 | 0 | 600 | Archivo |
| `h4` | 16px | 1.50 | +0.01em | 500 | Archivo (uppercase) |
| `body` | 15px | 1.60 | 0 | 400 | Archivo |
| `small` | 13px | 1.50 | 0 | 400 | Archivo |
| `caption` | 11px | 1.40 | +0.05em | 500 | Archivo (uppercase) |
| `mono` | 13px | 1.50 | 0 | 400 | IBM Plex Mono |
| `mono-sm` | 11px | 1.40 | +0.02em | 400 | IBM Plex Mono |

### 2.3 Responsive Scaling
| Breakpoint | `display` | `h1` | `h2` | `body` |
| :--- | :--- | :--- | :--- | :--- |
| `< 640px` | 32px | 24px | 20px | 14px |
| `640–1024px` | 40px | 28px | 22px | 15px |
| `> 1024px` | 48px | 32px | 24px | 15px |

---

## 3. Spacing & Layout

### 3.1 Grid
- Base unit: **4px**. All spacing is a multiple of 4.
- Content max-width: **1200px**, centered, with `24px` horizontal gutters.
- Chat column max-width: **760px** (70% of viewport max).
- Modal max-width: **480px** (narrow) / **640px** (receipt).

### 3.2 Spacing Scale
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 120`

| Context | Value |
| :--- | :--- |
| Page top padding | 120px |
| Section vertical gap | 48px |
| Card internal padding | 24px |
| Modal internal padding | 32px |
| Form field gap | 16px |
| Header height | 56px (fixed, never scrolls) |
| Chat input bottom offset | 32px |

### 3.3 Negative Space Rules
- Minimum 48px between any two major content blocks.
- Cards never touch viewport edges — minimum 24px gutter.
- One primary focus element per viewport. Do not crowd.

---

## 4. Border Radius (STRICT — 3 values only)

| Token | Value | Applied To |
| :--- | :--- | :--- |
| `rounded-sm` | **4px** | Badges, code pills, status indicators, hash chips, tags |
| `rounded-md` | **8px** | Inputs, buttons, dropdowns, inner cards, tooltips |
| `rounded-lg` | **12px** | Primary panels, glass cards, `<dialog>` containers |

**Zero exceptions.** No `rounded-xl`, `rounded-2xl`, `rounded-3xl`.
`rounded-full` is permitted **only** for avatar circles and the theme-toggle knob.

---


## 5. Glassmorphism (3 Tiers)

### Tier 1 — Primary Cards
```css
background: rgba(15, 23, 42, 0.60);
backdrop-filter: blur(24px) saturate(1.4);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 12px;
box-shadow:
  0 1px 0 rgba(255, 255, 255, 0.06) inset,
  0 1px 2px rgba(0, 0, 0, 0.30),
  0 4px 16px rgba(0, 0, 0, 0.25),
  0 12px 40px rgba(0, 0, 0, 0.15);
```

### Tier 2 — Modals (`<dialog>`)
```css
background: rgba(7, 25, 30, 0.85);
backdrop-filter: blur(40px) saturate(1.6);
border: 1px solid rgba(2, 245, 161, 0.12);
border-radius: 12px;
box-shadow:
  0 0 0 1px rgba(2, 245, 161, 0.06),
  0 2px 4px rgba(0, 0, 0, 0.35),
  0 8px 24px rgba(0, 0, 0, 0.30),
  0 24px 80px rgba(0, 0, 0, 0.25);
```
Dialog backdrop: `rgba(7, 25, 30, 0.60)` + `backdrop-filter: blur(8px)`.

### Tier 3 — Inline Elements
```css
background: rgba(30, 41, 59, 0.70);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 4px;
```

### Fallback
`@supports not (backdrop-filter: blur(1px))` → solid `#0A1628` / `#0F172A` backgrounds.

---

## 6. Shadow System (Layered — never single-layer)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.25)` | Badges, pills |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.20)` | Inputs, small buttons |
| `shadow-md` | `0 1px 2px rgba(0,0,0,0.30), 0 4px 16px rgba(0,0,0,0.25), 0 12px 40px rgba(0,0,0,0.15)` | Cards, corridor options |
| `shadow-lg` | `0 2px 4px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.30), 0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(2,245,161,0.08)` | Modals, `<dialog>` |
| `shadow-glow-mint` | `0 0 20px rgba(2,245,161,0.12), 0 0 60px rgba(2,245,161,0.06)` | Hover states, recommended corridor |
| `shadow-glow-danger` | `0 0 20px rgba(220,38,38,0.15), 0 0 60px rgba(220,38,38,0.08)` | Blocked states, auth failure |
| `shadow-inset-sheen` | `inset 0 1px 0 rgba(255,255,255,0.06)` | **MANDATORY on every glass card** |

**Composition rule:** Every elevated element = `shadow-inset-sheen` + at least `shadow-md`.
Hover states ADD `shadow-glow-mint`. Modals use all four `shadow-lg` layers.

---

## 7. Motion & Animation

### 7.1 Easing Curves
| Token | Value | Usage |
| :--- | :--- | :--- |
| `ease-out-expo` | `cubic-bezier(0.22, 1, 0.36, 1)` | PRIMARY — modal reveals, card lifts, DAG transitions |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Color transitions, opacity fades |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Badge pop-ins, button press feedback |

### 7.2 Element Animations
| Element | Enter | Exit | Duration |
| :--- | :--- | :--- | :--- |
| Modal `<dialog>` | `opacity 0→1` + `scale 0.95→1` + `translateY(8px→0)` | reverse | 300ms `ease-out-expo` |
| Modal backdrop | `opacity 0→0.60` | reverse | 200ms `ease-in-out` |
| Cards (staggered) | `opacity 0→1` + `translateY(12px→0)`, stagger 80ms | reverse | 400ms `ease-out-expo` |
| DAG step | `opacity 0→1` + `translateX(-8px→0)`, stagger 150ms | instant | 500ms `ease-out-expo` |
| Chat message | `opacity 0→1` + `translateY(6px→0)` | — | 250ms `ease-out-expo` |
| Badge pop-in | `scale 0.8→1` + `opacity 0→1` | — | 200ms `ease-spring` |
| Quota bar fill | `width 0→target%` | — | 800ms `ease-out-expo` |
| Button press | `scale 1→0.97→1` | — | 150ms `ease-spring` |
| Section reveal | `opacity 0→1` + `translateY(20px→0)` | — | 600ms `ease-out-expo` |

### 7.3 Hover Lift
```css
transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.4s ease;
```
- Card / corridor option: `translateY(-2px)` (max `-4px`)
- Button: `translateY(-1px)` + `shadow-glow-mint`
- **Never exceed -4px.** No dramatic float.

### 7.4 Accessibility
All animation wrapped in `@media (prefers-reduced-motion: no-preference)`.
Reduced-motion users get instant state changes with no transforms.

---

Noise grain overlay at `opacity: 0.03`, `mix-blend-mode: overlay` on the `abyss` canvas.
Asset: `src/assets/noise-texture.svg`. Prevents flat, digital-looking dark surfaces.

---


## 8. Navigation (Minimum-Effort, Intuitive)

### 8.1 Structure
Two views only: **Workspace** (chat) and **Ledger** (audit).

```
+------------------------------------------------------------------+
|  APEXCROSS       Workspace   Ledger   |   Connected      [sun]    |
|  ---------       ---------   ------   |   ---------      -----    |
|  logo + wordmark  active tab (mint     |   signal status  theme    |
|                   accent bar beneath)  |                  toggle   |
+------------------------------------------------------------------+
```

### 8.2 Rules
- **Two tabs, text-only labels.** No icons beside tab labels. No hamburger. No sidebar.
- **Active indicator:** 2px mint accent bar beneath the label + `text-primary` color.
  Inactive: `text-secondary`, no bar.
- **Header is fixed at 56px** and never scrolls. Content scrolls beneath it.
- **Keyboard shortcuts:** `Cmd/Ctrl + 1` -> Workspace, `Cmd/Ctrl + 2` -> Ledger.
- **View switching is instant** with a 200ms cross-fade. No page reloads, no route transitions
  that feel like navigation — it is one workspace with two surfaces.
- **No breadcrumbs.** The app is two levels deep at most. Breadcrumbs would be noise.

### 8.3 Health Indicator (NOT a heartbeat dot)
Use the Lucide **`Radio`** icon (concentric signal waves) — thematic for cross-border signal.

| State | Visual |
| :--- | :--- |
| Connected | `Radio` in `#02F5A1`, outer wave pulses via `opacity` (3s infinite) |
| Disconnected | `Radio` in `#DC2626`, static. Label: "Offline" |
| Checking | `Radio` in `#D97706`, slow `rotate` (1.5s linear infinite) |

### 8.4 Theme Toggle
Single `Sun` / `Moon` Lucide icon. No label. 40x40px hit area, `rounded-full` permitted.
Persists to `localStorage` under key `apexcross-theme`.

---

## 9. Banned Elements

| Banned | Replacement |
| :--- | :--- |
| Purple gradients of any kind | Mint/cobalt accent gradients only |
| Sparkles, emojis, decorative glyphs | Lucide vector icons, `stroke-width: 1.5–2` |
| `border-dashed` (zero instances) | Solid `rgba(255,255,255,0.08)` glass border |
| Visible gray outlines on cards | Glass border + inset sheen |
| `<hr>` and dashed separators | `1px` gradient rule fading at both ends |
| Generic blue focus rings | `ring-2 ring-mint/40 ring-offset-2 ring-offset-abyss` |
| Generic heartbeat/status dot | Lucide `Radio` signal icon |
| Single-layer flat shadows | Layered 3–4 stop shadows |
| Heavy UI libraries (MUI, AntD) | Tailwind + Lucide + native HTML5 |
| `rounded-xl` / `rounded-2xl` | `rounded-sm` / `rounded-md` / `rounded-lg` only |
| Inter, Roboto, system default fonts | Archivo + Abril Fatface + IBM Plex Mono |

---

## 10. Icon Strategy (Lucide React)

| Context | Stroke Width |
| :--- | :--- |
| Navigation / decorative | 1.5 |
| Action buttons | 2 |
| Status indicators | 2 (or filled variants) |

| Purpose | Icon |
| :--- | :--- |
| Security tier / WebAuthn | `ShieldCheck`, `Fingerprint` |
| Corridor / FX | `ArrowRightLeft`, `TrendingDown` |
| Invoice upload | `FileSearch`, `Upload` |
| SWIFT receipt | `ScrollText`, `FileCheck` |
| Hash chain / audit | `Link2`, `ShieldCheck` |
| DAG / live status | `Activity`, `CircleCheck`, `CircleDashed` |
| Quota telemetry | `Gauge` |
| Health signal | `Radio` |
| Theme | `Sun`, `Moon` |
| Recommended corridor | `Zap` |
| Copy | `Copy`, `Check` |
| Close / dismiss | `X` |
| Expand | `ChevronRight`, `ChevronDown` |
| Language helper | `Languages`, `Info` |

---


## 11. One-Modal-At-A-Time Rule

**Only one `<dialog>` may be open at any time.** Screens are never stacked.

```
Chat Canvas (always the base layer)
     |
     +-- Invoice Modal --+
     +-- Tier 2 Modal  --+  exactly one open,
     +-- Tier 3 Modal  --+  others blocked
     +-- Receipt Modal --+
              |
              v close -> 200ms fade + scale-down -> return to canvas
```

- Closing a modal triggers a 200ms fade-out before any other element may appear.
- A new modal cannot open until the previous one has fully exited.
- Modals trap focus (native `<dialog>` `showModal()` behavior).
- `Escape` always closes the topmost modal.
- Backdrop click closes only non-destructive modals (not the Tier 3 auth modal
  while verification is in flight).

---

## 12. Design Principles Mapping

| Principle | Implementation |
| :--- | :--- |
| **Balance** | Fixed symmetric header; left-weighted chat canvas with right-aligned user bubbles; equal-width 3-column corridor grid |
| **Contrast** | Mint `#02F5A1` on Abyss `#07191E` = 11.2:1; Abril display vs Archivo body; glass sheen vs dark surface |
| **Emphasis** | Exactly one Abril headline per view; exactly one mint primary CTA visible; recommended corridor gets the only glow border |
| **Alignment** | Strict 4px base grid; all prose left-aligned; all currency figures right-aligned in tabular mono |
| **Repetition** | Same 3 radii, same 3 glass tiers, same easing curve, same badge anatomy, everywhere |
| **Proportion** | Chat max 760px; modal max 480/640px; card padding 24px; modal padding 32px |
| **Hierarchy** | Abril -> Archivo 700 -> 600 -> 500 -> 400 -> IBM Plex Mono; size 48->32->24->20->16->15->13->11 |
| **Negative Space** | 120px page top; 48px section gaps; 24px card padding; 16px field gaps |
| **Movement** | DAG steps animate sequentially; cards stagger-enter; quota bar fills eased; modals scale+fade |

---

## 13. Component Anatomy Reference

### 13.1 Corridor Card
```
+-------------------------------------------------+  radius 12px, Tier 1 glass
|  APEC Direct Clearing            * RECOMMENDED  |  h3 Archivo 600 + mint badge
|                                                   |
|  +-------------------------------------------+   |  radius 8px, Tier 3 glass
|  |  CNY 77,812.50  -->  HKD 85,000.00        |   |  IBM Plex Mono tabular
|  |  Rate: 1 CNY = 1.0924 HKD                 |   |
|  +-------------------------------------------+   |
|                                                   |
|  Fee        $18.50 USD                            |  label: caption / value: mono
|  Arrival    4-8 hours                             |
|  Savings    $395.95 USD                           |  mint #02F5A1
|                                                   |
|  +-------------------------------------------+   |  radius 8px
|  |           Select This Route        ->     |   |  accent glow gradient button
|  +-------------------------------------------+   |
+-------------------------------------------------+
        hover: translateY(-2px) + mint border + glow
```

### 13.2 Status Badge
```
+--------------+  radius 4px, Tier 3 glass, height 22px, padding 0 8px
| COMPLETED    |  caption uppercase, color per semantic token
+--------------+
```

### 13.3 Financial Value Display
```
Label (caption, text-secondary, uppercase, +0.05em tracking)
$85,000.00 USD          <- IBM Plex Mono 13px, tabular-nums, text-primary
```

---


## 14. Tailwind Token Mapping

These are wired into `tailwind.config.ts` — components must use the token names,
never raw hex values.

```
colors:
  abyss / deep / surface / elevated
  mint / cobalt
  success / warning / danger
  (+ -soft variants)
  text-primary / text-secondary / text-muted / text-on-accent

borderRadius:
  sm: 4px / md: 8px / lg: 12px

boxShadow:
  xs / sm / md / lg
  glow-mint / glow-danger
  inset-sheen

transitionTimingFunction:
  out-expo: cubic-bezier(0.22, 1, 0.36, 1)
  spring: cubic-bezier(0.34, 1.56, 0.64, 1)

fontFamily:
  display: Abril Fatface
  sans: Archivo
  mono: IBM Plex Mono
```

---

## 15. Verification Checklist

Before any component is considered complete:

- [ ] Uses only tokens from this file — zero raw hex values in JSX
- [ ] Border radius is one of 4px / 8px / 12px
- [ ] Glass element carries `shadow-inset-sheen`
- [ ] Hover lift is <= 4px with `ease-out-expo`
- [ ] Currency figures use `font-mono tabular-nums`
- [ ] No `border-dashed`, no emoji, no purple
- [ ] Focus ring is mint, not default blue
- [ ] Animation respects `prefers-reduced-motion`
- [ ] Only one modal open at a time
- [ ] Contrast ratio >= 4.5:1 for all text

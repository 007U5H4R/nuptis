# Nuptis — Mobile Responsiveness

**Date:** 2026-08-10
**Status:** Approved (design)

## Problem

The app was built desktop-first and breaks on phones. The `<meta viewport>` tag is
correct, so the problem is entirely layout CSS + shell markup:

- `.shell` is a fixed two-column grid (`220px 1fr`) with `overflow: hidden` and **no
  nav toggle** — on a 375px phone the sidebar eats ~60% of the width and content is
  unreachable. `Shell.tsx` has no mobile nav state.
- The stylesheet has a **single** media query (`@media (max-width: 1100px)`) that only
  restacks tablet grids. Nothing targets phones.
- Fixed-width elements overflow the viewport: topbar search (`340px`), search popover
  (`480px`, anchored `left: 24px`), notification popover (`380px`, `right: 84px`).
- Data tables have no narrow-screen treatment and force sideways page scroll.

## Goal / Success Criteria

Demo-solid responsiveness for phones + tablets (~375–768px):

- No horizontal page scroll at any width in range.
- Nav reachable on phones via a hamburger drawer.
- KPI cards, grids, and tables all readable without pinch-zoom.
- Topbar popovers stay fully on-screen.
- Desktop/tablet (>640px) behavior **unchanged**.

## Non-Goals (YAGNI)

- No 320px small-phone or landscape audit; no touch-target (44px) resize pass.
- No component-library refactor (`ui.tsx` `Badge`/`MiniStepper` untouched).
- Drawers (`.drawer`) and assistant panel already use `max-width: 92vw/94vw` — left as-is.
- No unrelated refactoring.

## Approach

One new breakpoint at **≤640px** (phone). The existing `@media (max-width: 1100px)`
tablet query stays. Three areas change: **Shell** (nav), **stylesheet** (layout +
popovers), **table markup** (card reflow).

### 1. Navigation — hamburger + off-canvas drawer

- `Shell.tsx`: add `navOpen` state; add a **☰ button** as the first child of `.topbar`,
  visible only on phones (`.tb-hamburger` — `display: none` by default, shown ≤640px).
- CSS ≤640px:
  - `.shell` collapses to a single column (`grid-template-columns: 1fr`).
  - `.sidebar` becomes `position: fixed; z-index: 70; transform: translateX(-100%)` and
    slides in (`transform: none`) when `.shell` carries a `nav-open` class (driven by
    `navOpen`).
  - A scrim behind the open drawer, reusing the `.pop-scrim` pattern (rendered from
    `Shell.tsx` when `navOpen`), `z-index` below the drawer, above content.
- Drawer **auto-closes** on: nav item tap (route change — close in the `NavLink`
  handler / a `useEffect` on `location`), scrim tap, and Escape (extend the existing
  keydown handler).
- Hamburger + off-canvas rules live **only** inside the ≤640px query, so >640px is
  untouched.

### 2. Topbar + popovers

- `.tb-search`: on phones drop the fixed `340px` → `flex: 1; width: auto; min-width: 0`;
  hide the `⌘K` `.kbd` hint.
- Popover width/anchor fixes so nothing clips off-screen, applied ≤640px:
  - `.search-pop { left: 12px; right: 12px; width: auto; }`
  - `.notif-pop { right: 12px; left: 12px; width: auto; }`
  - `.profile-pop { right: 12px; width: min(280px, calc(100vw - 24px)); }`

### 3. Content + KPIs

- `.content` padding `24px` → `16px` ≤640px.
- `.kpi-row` → `grid-template-columns: 1fr` ≤640px (already 2-col at ≤1100).
- `.stage-grid` / `.grid-2` already stack at ≤1100 — no change.

### 4. Tables — card reflow via `data-label`

CSS can't pull `<th>` text into stacked rows, so add a `data-label="<column>"` attribute
to every `<td>` in the 5 table screens (Dashboard, Procurement, Payments, Weddings,
Settings). Then a **single generic** CSS block at ≤640px reflows every `.table`:

- `.table thead { display: none; }`
- `.table, .table tbody, .table tr, .table td { display: block; width: 100%; }`
- each `tr` → bordered card (border/radius/margin, matching `.card` tokens).
- each `td` → flex row: `td::before { content: attr(data-label); }` label on the left
  (muted, uppercase like existing `th`), value right-aligned.
- Action-only / chevron cells get `data-label=""` → render as a full-width row with no
  label (hide empty `::before`).
- Empty-state cells with `colSpan` (e.g. Dashboard "No vendors match…") get
  `data-label=""` and stay centered.

Everything remains a real `<table>` — only presentation changes. Estimated ~40 `<td>`
edits, mechanical.

## Files Touched

- `src/components/Shell.tsx` — nav state, hamburger button, scrim, auto-close.
- `src/styles/app.css` — new `@media (max-width: 640px)` block; hamburger style; small
  desktop-side tweaks (`.tb-hamburger { display: none }`).
- `src/screens/Dashboard.tsx`, `Procurement.tsx`, `Payments.tsx`, `Weddings.tsx`,
  `Settings.tsx` — `data-label` attributes on `<td>`s.

## Verification

1. `npm run build` passes (tsc + vite).
2. Drive in Chrome at **375px** and **768px** widths and confirm:
   - No horizontal page scroll.
   - Hamburger opens/closes drawer; nav tap navigates and closes drawer; scrim + Esc close.
   - KPI cards stack; tables render as labeled cards; no clipped content.
   - Search / notification / profile popovers open fully on-screen.
3. Confirm >640px (desktop) is visually unchanged.

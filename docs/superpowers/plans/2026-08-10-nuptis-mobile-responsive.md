# Nuptis Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop-first Nuptis app usable on phones and tablets (~375–768px) with no horizontal page scroll.

**Architecture:** Add one `@media (max-width: 640px)` block to the single stylesheet, an off-canvas hamburger drawer driven by new state in the `Shell` component, and card-reflow of data tables via `data-label` attributes. Desktop/tablet (>640px) rendering is left unchanged.

**Tech Stack:** React 18 + TypeScript, Vite, react-router-dom v6, plain CSS with design tokens (`src/styles/tokens.css`, `src/styles/app.css`). No test framework is installed — **verification is `npm run build` (tsc + vite) plus visual checks in Chrome at 375px and 768px.** Do not add a test runner.

## Global Constraints

- New responsive rules go **only** inside `@media (max-width: 640px)` (plus one desktop default `.tb-hamburger { display: none }`). Nothing above 640px may change visually.
- Existing `@media (max-width: 1100px)` block stays as-is.
- Use existing design tokens (`var(--…)`); do not hardcode colors/radii.
- Everything stays a real `<table>` — reflow is presentation-only.
- After every task: `npm run build` must pass before committing.
- Commit trailer on every commit:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: Off-canvas hamburger navigation

**Files:**
- Modify: `src/components/ui.tsx:6-66` (add `menu` icon path)
- Modify: `src/components/Shell.tsx` (nav state, hamburger button, scrim, auto-close, Esc)
- Modify: `src/styles/app.css` (desktop `.tb-hamburger` default + nav rules in a new `@media (max-width: 640px)` block)

**Interfaces:**
- Consumes: existing `Icon` component (`src/components/ui.tsx`), `.pop-scrim`/`fadeIn`/`slideIn` patterns and `--scrim`, `--subtle`, `--border`, `--radius-md`, `--text-secondary` tokens.
- Produces: `.shell.nav-open` class contract (CSS shows the drawer when `.shell` carries `nav-open`); `.tb-hamburger` button; `.nav-scrim` element; `menu` icon key. Later tasks add more rules to the same `@media (max-width: 640px)` block created here.

- [ ] **Step 1: Add a `menu` icon path**

In `src/components/ui.tsx`, inside the `PATHS` object (after the `bell` entry, before the closing `}` on line 66), add:

```tsx
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
```

- [ ] **Step 2: Add nav state + auto-close to Shell**

In `src/components/Shell.tsx`:

Change the react-router import (line 2) to include `useLocation`:

```tsx
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
```

After `const navigate = useNavigate();` (line 19) add:

```tsx
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
```

Add an effect (below the existing keydown `useEffect`, after line 34) to close the drawer whenever the route changes:

```tsx
  useEffect(() => { setNavOpen(false); }, [location.pathname]);
```

Extend the Escape handler inside the existing keydown `useEffect` (line 30) so Escape also closes the drawer:

```tsx
      if (e.key === 'Escape') { setPop(null); setNavOpen(false); }
```

- [ ] **Step 3: Add the `nav-open` class, hamburger button, and scrim to the markup**

In `src/components/Shell.tsx`:

Change the shell wrapper (line 54) to carry the state class:

```tsx
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
```

Immediately after the opening `<header className="topbar">` (line 74), insert the hamburger as the first child:

```tsx
          <button className="tb-hamburger" onClick={() => setNavOpen(true)} aria-label="Open navigation">
            <Icon name="menu" size={18} />
          </button>
```

Immediately after the closing `</aside>` of the sidebar (line 71), insert the drawer scrim:

```tsx
      {navOpen && <div className="nav-scrim" onClick={() => setNavOpen(false)} />}
```

(No change needed to the `NavLink`s — Step 2's `location` effect closes the drawer on navigation.)

- [ ] **Step 4: Add the CSS — desktop default + nav rules**

In `src/styles/app.css`, at the very end of the file (after the existing `@media (max-width: 1100px)` block on line 562), append:

```css
/* Hamburger hidden on desktop/tablet */
.tb-hamburger { display: none; }

/* ============ phone breakpoint ============ */
@media (max-width: 640px) {
  .shell { grid-template-columns: 1fr; }

  .sidebar {
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 70;
    width: 240px; max-width: 82vw;
    transform: translateX(-100%);
    transition: transform 0.22s cubic-bezier(0.2, 0.7, 0.3, 1);
  }
  .shell.nav-open .sidebar { transform: none; }

  .nav-scrim {
    position: fixed; inset: 0; z-index: 65;
    background: var(--scrim);
    animation: fadeIn 0.15s ease;
  }

  .tb-hamburger {
    display: inline-flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; flex: 0 0 34px;
    border: 1px solid var(--border); background: var(--subtle);
    border-radius: var(--radius-md); color: var(--text-secondary);
  }
}
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS (no TypeScript or Vite errors).

- [ ] **Step 6: Visual verification in Chrome at 375px**

Serve the build (`npm run preview`) or dev server, open at 375px width, and confirm:
- Sidebar is hidden; a ☰ button shows at the left of the topbar.
- Tapping ☰ slides the sidebar in over a dimmed scrim.
- Tapping a nav item navigates AND closes the drawer.
- Tapping the scrim closes the drawer; Escape closes it.
- At >640px the ☰ is gone and the sidebar is the normal fixed column.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui.tsx src/components/Shell.tsx src/styles/app.css
git commit -m "feat(mobile): off-canvas hamburger navigation at <=640px

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Responsive topbar, popovers, KPIs, and content spacing

**Files:**
- Modify: `src/styles/app.css` (add rules **inside** the `@media (max-width: 640px)` block created in Task 1)

**Interfaces:**
- Consumes: the `@media (max-width: 640px)` block from Task 1; existing selectors `.tb-search`, `.kbd`, `.search-pop`, `.notif-pop`, `.profile-pop`, `.kpi-row`, `.content`.
- Produces: no new class contracts — CSS-only overrides.

- [ ] **Step 1: Add layout rules inside the phone breakpoint**

In `src/styles/app.css`, inside the `@media (max-width: 640px)` block from Task 1 (before its closing `}`), add:

```css
  /* topbar search fills the row; drop the keyboard hint */
  .topbar { padding: 0 14px; gap: 10px; }
  .tb-search { width: auto; flex: 1; min-width: 0; }
  .tb-search .kbd { display: none; }
  .tb-right { gap: 10px; }

  /* popovers stay on-screen */
  .search-pop { left: 12px; right: 12px; width: auto; }
  .notif-pop { left: 12px; right: 12px; width: auto; }
  .profile-pop { right: 12px; width: min(280px, calc(100vw - 24px)); }

  /* single-column KPIs + tighter content padding */
  .kpi-row { grid-template-columns: 1fr; }
  .content { padding: 16px; }
  .page-title { font-size: 18px; }
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Visual verification in Chrome at 375px**

Confirm:
- Search pill spans the width between ☰ and the bell; no ⌘K hint.
- Opening search, notifications, and profile popovers each stay fully within the viewport (no clipping off either edge).
- KPI cards on the Dashboard stack in a single column.
- No horizontal page scroll on any screen.

- [ ] **Step 4: Commit**

```bash
git add src/styles/app.css
git commit -m "feat(mobile): responsive topbar, on-screen popovers, stacked KPIs

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Table card-reflow — generic CSS + `data-label` attributes

**Files:**
- Modify: `src/styles/app.css` (reflow rules inside the `@media (max-width: 640px)` block)
- Modify: `src/screens/Dashboard.tsx` (`<td>` `data-label`s)
- Modify: `src/screens/Procurement.tsx` (`<td>` `data-label`s)
- Modify: `src/screens/Payments.tsx` (`<td>` `data-label`s)
- Modify: `src/screens/Weddings.tsx` (`<td>` `data-label`s)
- Modify: `src/screens/Settings.tsx` (`<td>` `data-label`s)

**Interfaces:**
- Consumes: the `@media (max-width: 640px)` block from Task 1; `.table` markup on the 5 screens; tokens `--card-border`, `--radius-lg`, `--surface-solid`, `--muted`, `--border`.
- Produces: reflow presentation contract — every `.table td` must carry a `data-label` attribute (label text for data cells, `data-label=""` for action/chevron/empty cells).

- [ ] **Step 1: Add the generic reflow CSS**

In `src/styles/app.css`, inside the `@media (max-width: 640px)` block, add:

```css
  /* data tables -> stacked cards */
  .table thead { display: none; }
  .table, .table tbody { display: block; width: 100%; }
  .table tbody tr {
    display: block;
    background: var(--surface-solid);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-lg);
    padding: 4px 4px;
    margin-bottom: 10px;
  }
  .table tbody tr td {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
    text-align: right;
  }
  .table tbody tr td:last-child { border-bottom: 0; }
  .table tbody tr td::before {
    content: attr(data-label);
    font-size: 11px; font-weight: 500; letter-spacing: 0.5px;
    text-transform: uppercase; color: var(--muted);
    text-align: left; flex: 0 0 auto;
  }
  /* action / chevron / empty cells: no label, full width */
  .table tbody tr td[data-label=""]::before { content: none; }
  .table tbody tr td[data-label=""] { justify-content: flex-end; }
```

- [ ] **Step 2: Add `data-label` to Dashboard cells**

In `src/screens/Dashboard.tsx`, the roster table body (around lines 97-108). Set each `<td>` to match its header (`Vendor, Category, Risk tier, Roster tier, Compliance, Last verified`, then the action cell):

```tsx
                <tr key={v.id}>
                  <td data-label="Vendor"><div className="cell-main">{v.name}</div><div className="cell-sub">{v.empanelled}</div></td>
                  <td data-label="Category">{v.category}</td>
                  <td data-label="Risk tier"><Badge label={v.risk} /></td>
                  <td data-label="Roster tier"><Badge label={v.tier} /></td>
                  <td data-label="Compliance"><Badge label={v.compliance} /></td>
                  <td data-label="Last verified" className="muted">{v.lastVerified}</td>
                  <td data-label=""><button className="btn btn-ghost btn-sm" onClick={() => setView(v)}>View</button></td>
```

For the empty-state row, set the `colSpan` cell to `data-label=""`:

```tsx
                <tr><td colSpan={7} data-label="" className="muted" style={{ textAlign: 'center', padding: 28 }}>No vendors match the current filters.</td></tr>
```

- [ ] **Step 3: Add `data-label` to Procurement cells**

In `src/screens/Procurement.tsx`, the work-order table body (around lines 75-95). Headers are `Work order, Wedding · ceremony, Vendor, Quote, Progress, Stage`, then the chevron cell. Add to each `<td>`:

- `<td>` at line 76 → `data-label="Work order"`
- `<td>` at line 80 → `data-label="Wedding · ceremony"`
- `<td>` at line 84 → `data-label="Vendor"`
- `<td>{fmtINR(w.quote)}</td>` at line 88 → `data-label="Quote"`
- `<td>` at line 89 (MiniStepper) → `data-label="Progress"`
- `<td>` at line 90 (Stage) → `data-label="Stage"`
- `<td><span className="muted">›</span></td>` at line 95 → `data-label=""`

Keep the existing `className="clickable"` and `onClick` on the `<tr>` unchanged.

- [ ] **Step 4: Add `data-label` to Payments cells**

In `src/screens/Payments.tsx`, read the `<thead>` row to get the exact column titles, then add a matching `data-label="<column title>"` to every `<td>` in the `<tbody>` row, in column order. Any trailing action/status-only or chevron cell that has no header gets `data-label=""`. Any `colSpan` empty-state cell gets `data-label=""`.

- [ ] **Step 5: Add `data-label` to Weddings cells**

In `src/screens/Weddings.tsx`, same procedure as Step 4: read the `<thead>`, add `data-label` matching each header to each `<td>` in column order; action/chevron/empty cells get `data-label=""`.

- [ ] **Step 6: Add `data-label` to Settings cells**

In `src/screens/Settings.tsx`, same procedure: read the `<thead>` for each table present, add `data-label` matching each header to each `<td>` in column order; action-only cells get `data-label=""`.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 8: Visual verification in Chrome at 375px**

On each of Dashboard, Procurement, Payments, Weddings, Settings, confirm:
- Each table row renders as a bordered card; the header row is hidden.
- Each data cell shows its uppercase label on the left and the value on the right.
- Action buttons / chevrons render as a full-width row with no stray label.
- Empty-state rows are readable and not prefixed by a label.
- No horizontal page scroll.
- At >640px the tables render exactly as before (normal table layout).

- [ ] **Step 9: Commit**

```bash
git add src/styles/app.css src/screens/Dashboard.tsx src/screens/Procurement.tsx src/screens/Payments.tsx src/screens/Weddings.tsx src/screens/Settings.tsx
git commit -m "feat(mobile): reflow data tables into labeled cards at <=640px

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Whole-app responsive verification pass

**Files:** none (verification only; fixes, if any, amend the relevant file + task).

**Interfaces:** Consumes the full app.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 2: Sweep every route at 375px**

In Chrome at 375px width, visit each route — Roster Dashboard (`/`), Vendor Onboarding (`/onboarding`), Weddings (`/weddings`), Procurement Board (`/procurement`) and a stage view (`/procurement/:id`), Contingency Panel (`/contingency`), Payment Tracker (`/payments`), Settings (`/settings`), and Login (`/login`). For each confirm:
- No horizontal page scroll.
- Nav drawer reachable and closes correctly.
- Cards/forms/tables fit the width and are readable.
- Any drawer/assistant panel opens within the viewport.

- [ ] **Step 3: Spot-check at 768px (tablet)**

Confirm the tablet layout (existing `@media (max-width: 1100px)`) still looks right and the phone rules are NOT applied (sidebar visible, no hamburger).

- [ ] **Step 4: Spot-check desktop unchanged**

At ~1440px confirm the app looks identical to before this branch.

- [ ] **Step 5: Fix + record any issues**

If a screen breaks, make the minimal fix in the owning file, rebuild, re-verify, and commit with a clear message. If everything passes, no commit is needed for this task.

---

## Self-Review

**Spec coverage:**
- §1 nav drawer → Task 1. ✓
- §2 topbar search + popover clamping → Task 2. ✓
- §3 KPI single-column + content padding → Task 2. ✓
- §4 table card-reflow + `data-label` across 5 screens → Task 3. ✓
- Verification (build + Chrome 375/768, desktop unchanged) → per-task steps + Task 4. ✓
- Non-goals respected: no test runner added, no >640px changes, drawers/assistant untouched. ✓

**Placeholder scan:** Steps 4-6 of Task 3 say "read the `<thead>` then map headers to `<td>`s in column order" — this is a deterministic procedure, not a placeholder, because Payments/Weddings/Settings markup must be read at implementation time; the rule (label = header text, action/empty = `data-label=""`) is fully specified. Dashboard and Procurement have exact code. No other placeholders.

**Type/name consistency:** `.shell.nav-open`, `.tb-hamburger`, `.nav-scrim`, and the `menu` icon key are defined in Task 1 and only consumed there. The `data-label` contract is defined in Task 3 Step 1 and applied in Steps 2-6. `@media (max-width: 640px)` block created in Task 1, extended in Tasks 2-3. Consistent.

# Nuptis

**Vendor onboarding & procurement ops for wedding planning agencies** — a working SaaS front-end built 1:1 from the [NuptisV2 Figma design system](https://www.figma.com/design/2hvOt6R9g9iseQxHXTDRpv/NuptisV2).

Wedding agencies run dozens of vendors (caterers, decor, pyrotechnics, priests, transport…) across parallel ceremonies. When a vendor fails on the day, trust normally resets to zero and someone starts cold-calling. Nuptis's core bet: **onboard once with risk-tiered verification, keep a pre-vetted Backup tier, and make day-of recovery a one-click activation** — penalty clauses and SLAs included.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Sign in with any valid email + a 4-character password (demo auth — you enter as the workspace Owner). All data is seeded and persisted to `localStorage`; use **Profile → Reset demo data** to restore the original dataset.

## What's implemented

| Area | What works |
|---|---|
| **Roster Dashboard** | Live KPIs (backup-tier coverage is computed, not hardcoded), compliance banner, category/risk/tier filters, vendor record drawer |
| **Vendor Onboarding** | 5-step wizard on the chevron Stage Stepper — risk tier drives the document checklist; publishing adds the vendor to the roster |
| **Weddings** | Wedding list + new wedding setup |
| **Procurement Board** | All work orders with 8-segment mini-steppers; rows deep-link to each order's live stage |
| **Stage view** | Salesforce-Path-style 8-stage stepper, per-stage guidance, stage advancement, amber contingency-resolved flags |
| **Contingency Panel** ⚑ | The flagship. Four trigger types (no-show / extra resources / scope change / reconciliation), each opening a real slide-over drawer with backup-vendor options, impact summary and what-happens-next — confirming **actually mutates state**: work orders reassign, penalty milestones appear, flags resolve, stages get amber flags |
| **Payment Tracker** | Milestone table with computed collected/due/overdue KPIs, mark-paid, penalty recoveries from contingency activations |
| **Settings** | 4 tabs — Workspace (profile + light/dark/system appearance + typed-confirmation danger zone), Team (roles + invite drawer + pending invites), Notifications (high-severity alerts **locked on** — a product rule, not an oversight), Vendor defaults (the 30% advance / 2× penalty terms the drawers cite) |
| **Global layer** | ⌘K search over vendors/weddings/work-orders, notifications panel with deep links, profile menu, toast system, and the **rotating aurora orb** opening the Nuptis Assistant (canned process-guide Q&A) |

## Architecture

```
src/
  types.ts        domain model (Vendor, WorkOrder, Flag, Milestone, …)
  seed.ts         demo dataset — mirrors the Figma mockup's content exactly
  store.tsx       React context + reducer; every business action
                  (ACTIVATE_BACKUP, APPROVE_CO, ADVANCE_STAGE, …) is a
                  reducer case; state persists to localStorage
  styles/
    tokens.css    the NuptisV2 token set — light + dark via [data-theme],
                  ported from the Figma variable collection (Light 3:2 / Dark 86:0)
    app.css       components & layout, incl. the glass material system,
                  chevron steppers and the aurora orb animation
  components/     Shell (sidebar/topbar/popovers), Stepper, Assistant, ui kit
  screens/        one file per screen
```

**Design decisions**

- **Tokens over hardcoding** — every color flows through the CSS custom properties in `tokens.css`, so light/dark parity is structural (the same guarantee the Figma file makes with its variable modes).
- **The reducer is the API surface.** Each contingency confirmation maps to one action with real consequences (vendor reassignment, penalty milestone creation, compliance downgrades). Swapping `localStorage` for a backend means implementing these actions server-side; the UI doesn't change.
- **HashRouter** so a static `dist/` build works from any host (or `file://`) with zero server config.
- **No UI framework** — the Figma design system is small and specific enough that Tailwind/MUI would fight it. ~25KB of purpose-built CSS implements it exactly.

## Productionizing path

This is a front-end with an honest mock data layer, not a hosted product. To take it live: (1) replace the store's reducer effects with API calls (each action is already a named, typed mutation); (2) real auth (the session object and route guard are in place); (3) Postgres schema is essentially `types.ts` (Vendor → Wedding → WorkOrder → Milestone → ContingencyEvent, mirroring the PRD's data model); (4) notifications move server-side with the same tone/route contract.

## Provenance

Built from the Case Study 3 grounding exercise: process doc → PRD → NuptisV2 Figma prototype (~230 frames, dual-mode glass design system, click-through wired) → this code. The seed data (Annapurna Caterers, WO-2041, the ₹5,04,000 penalty…) is the mockup's own narrative, kept 1:1 so the prototype and the product tell the same story.

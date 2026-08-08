# Nuptis

**Vendor onboarding & procurement ops for wedding planning agencies** — a working SaaS front-end built 1:1 from the [NuptisV2 Figma design system](https://www.figma.com/design/2hvOt6R9g9iseQxHXTDRpv/NuptisV2).

Wedding agencies run dozens of vendors (caterers, decor, pyrotechnics, priests, transport…) across parallel ceremonies. When a vendor fails on the day, trust normally resets to zero and someone starts cold-calling. Nuptis's core bet: **onboard once with risk-tiered verification, keep a pre-vetted Backup tier, and make day-of recovery a one-click activation** — penalty clauses and SLAs included.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

**Two modes, same UI, zero code branches in the screens:**

- **Offline demo (default, no setup)** — sign in with any valid email + a 4-character password; you enter as the workspace Owner. Data is seeded and persisted to `localStorage`. **Profile → Reset demo data** restores the original dataset.
- **Supabase-backed (real backend)** — once `.env.local` is present (see below), Login switches to real email/password auth, and every action in `store.tsx` mirrors to Postgres instead of `localStorage`. **Profile → Refresh workspace data** re-pulls from the database.

### Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com) → **Settings → API** → copy the **Project URL** and **`anon` `public`** key (never the `service_role` key).
2. Create `.env.local` in the repo root (gitignored):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. **Authentication → Providers → Email** → turn off "Confirm email" for instant demo sign-ups (or leave it on for a real confirmation flow).
4. **SQL Editor** → paste all of [`supabase/schema.sql`](supabase/schema.sql) → Run. This creates every table, Row Level Security policies, the seed dataset, and four Postgres functions (`activate_backup`, `source_backup`, `approve_change_order`, `log_outcome`) that each wrap a Contingency Panel confirmation in one atomic transaction.
5. `npm run dev` (or rebuild) — Login now shows a Sign in / Create account toggle.

RLS model: any authenticated user has full read/write access — this is a single-workspace app today (matches the product's current scope), not a multi-tenant SaaS. Adding tenants later means a `workspace_id` column plus a policy swap, not a rewrite.

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
                  reducer case. Dispatch is optimistic: it applies locally,
                  then — only when Supabase is configured and a session
                  exists — mirrors the same action to Postgres; offline mode
                  persists to localStorage instead, untouched by any of this.
  lib/
    supabase.ts   client + isSupabaseConfigured flag (env-driven)
    cloud.ts      one function per mutating action + row<->type mappers;
                  this is the entire surface a real backend has to implement
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

**Done:** real Postgres schema (`supabase/schema.sql`), real auth, RLS, and the four contingency actions as atomic server-side transactions instead of client-side object spreads.

**Still ahead for a real multi-tenant product:** workspace scoping (one `workspace_id` column + policy change, not a rewrite — see above); role-based row access beyond "any authenticated user" (Settings already models Owner/Vendor Manager/Finance, RLS doesn't enforce it yet); Realtime subscriptions on `flags`/`notifications` so a second open tab sees a new risk flag land live; moving the two demo-scenario constants in `schema.sql` (the 30%-advance/2×-penalty math, the WO-2052 reprice amount) from hardcoded SQL into the already-editable Vendor Defaults tab.

## Provenance

Built from the Case Study 3 grounding exercise: process doc → PRD → NuptisV2 Figma prototype (~230 frames, dual-mode glass design system, click-through wired) → this code. The seed data (Annapurna Caterers, WO-2041, the ₹5,04,000 penalty…) is the mockup's own narrative, kept 1:1 so the prototype and the product tell the same story.

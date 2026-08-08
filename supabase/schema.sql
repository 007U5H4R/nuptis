-- =============================================================================
-- Nuptis — Supabase schema
-- Paste this whole file into Supabase Studio → SQL Editor → Run.
-- Safe to re-run: tables/policies/functions are dropped and recreated first.
--
-- Model: single workspace (one agency), any authenticated user has full
-- access — matches the current product (no multi-tenancy yet). To add
-- multi-tenancy later: add a workspace_id column to every table and swap
-- the "authenticated" policies below for `workspace_id = auth.jwt() ->> …`.
-- =============================================================================

-- ---------- clean slate ----------
drop function if exists add_manual_flag(text, text, text, text, text, text, text, text);
drop function if exists log_outcome(text, boolean);
drop function if exists approve_change_order(text);
drop function if exists source_backup(text, text);
drop function if exists activate_backup(text, text);

drop table if exists notifications;
drop table if exists invites;
drop table if exists team_members;
drop table if exists milestones;
drop table if exists flags;
drop table if exists work_orders;
drop table if exists weddings;
drop table if exists vendors;
drop table if exists settings;

-- ---------- tables (mirror src/types.ts) ----------

create table vendors (
  id            text primary key,
  name          text not null,
  category      text not null,
  risk          text not null check (risk in ('High','Medium','Low')),
  tier          text not null check (tier in ('Preferred','Approved','Backup')),
  compliance    text not null check (compliance in ('Verified','Pending','Expired','Under Review')),
  last_verified text not null,
  empanelled    text not null,
  contact       text,
  rate          text,
  note          text,
  created_at    timestamptz not null default now()
);

create table weddings (
  id         text primary key,
  couple     text not null,
  ceremonies integer not null default 1,
  month      text not null,
  budget     text not null,
  status     text not null check (status in ('Planning','Live','Wrapped')) default 'Planning',
  created_at timestamptz not null default now()
);

create table work_orders (
  id                        text primary key,
  wedding_id                text not null references weddings(id) on delete cascade,
  ceremony                  text not null,
  vendor_id                 text not null references vendors(id),
  category                  text not null,
  stage                     integer not null default 1 check (stage between 1 and 8),
  quote                     bigint not null default 0,
  flagged                   boolean not null default false,
  contingency_resolved_stage integer,
  note                      text,
  created_at                timestamptz not null default now()
);

create table flags (
  id         text primary key,
  type       text not null check (type in ('vendor_no_show','extra_resources','scope_change','reconciliation')),
  severity   text not null check (severity in ('high','medium','low')),
  label      text not null,
  title      text not null,
  meta       text not null,
  wo_id      text not null references work_orders(id) on delete cascade,
  opened     text not null,
  status     text not null check (status in ('open','resolved')) default 'open',
  created_at timestamptz not null default now()
);

create table milestones (
  id         text primary key,
  wo_id      text not null references work_orders(id) on delete cascade,
  label      text not null,
  amount     bigint not null,
  due        text not null,
  status     text not null check (status in ('paid','due','pending','overdue')),
  created_at timestamptz not null default now()
);

create table team_members (
  id         text primary key,
  name       text not null,
  email      text not null unique,
  role       text not null check (role in ('Owner','Vendor Manager','Finance')),
  status     text not null check (status in ('Active','Invited')) default 'Invited',
  created_at timestamptz not null default now()
);

create table invites (
  id         text primary key,
  email      text not null,
  role       text not null check (role in ('Owner','Vendor Manager','Finance')),
  sent_label text not null default 'Invited just now',
  created_at timestamptz not null default now()
);

create table notifications (
  id         text primary key,
  tone       text not null check (tone in ('danger','warning','info','success','neutral')),
  title      text not null,
  meta       text not null,
  time_label text,                 -- null = compute "Xm/Xh/Xd" from created_at client-side
  route      text not null default '/',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create table settings (
  id           smallint primary key default 1 check (id = 1),  -- single-row table
  agency_name  text not null default 'Meraki Weddings',
  gst          text not null default '',
  city         text not null default '',
  address      text not null default '',
  notif        jsonb not null default '{
    "highSeverity": true, "mediumSeverity": true, "payments": true,
    "documents": true, "onboarding": true, "changeOrders": false,
    "email": true, "inApp": true, "digest": "8:00 AM · weekdays"
  }'::jsonb,
  defaults     jsonb not null default '{
    "riskTier": "By category (recommended)", "expiryWindow": "30 days before expiry",
    "backupCoverage": true, "advance": "30% on booking confirmation",
    "penalty": "2× advance on vendor no-show",
    "structure": "Milestone-based (advance · pre-event · settlement)"
  }'::jsonb,
  updated_at   timestamptz not null default now()
);

-- ---------- row level security ----------
-- Any signed-in user is a trusted member of the one workspace (matches the
-- current app — Settings → Team already gates *approvals* by role in the UI,
-- not row access). Tighten with a workspace_id column if you add tenants.

alter table vendors        enable row level security;
alter table weddings       enable row level security;
alter table work_orders    enable row level security;
alter table flags          enable row level security;
alter table milestones     enable row level security;
alter table team_members   enable row level security;
alter table invites        enable row level security;
alter table notifications  enable row level security;
alter table settings       enable row level security;

create policy "authenticated full access" on vendors       for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on weddings      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on work_orders    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on flags          for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on milestones     for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on team_members   for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on invites        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on notifications  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on settings       for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- contingency actions as transactions ----------
-- Each Contingency Panel confirm touches 3-4 tables at once (reassign a work
-- order, invoke a penalty, downgrade a vendor, resolve the flag). Doing that
-- as one RPC — instead of four separate client requests — is what makes it
-- atomic: either the whole contingency event lands, or none of it does.

create or replace function activate_backup(p_flag_id text, p_backup_vendor_id text)
returns void
language plpgsql
security invoker
as $$
declare
  v_wo_id      text;
  v_old_vendor text;
  v_old_name   text;
  v_backup_name text;
  v_quote      bigint;
  v_penalty    bigint;
begin
  select wo_id into v_wo_id from flags where id = p_flag_id;
  if v_wo_id is null then raise exception 'Flag % not found', p_flag_id; end if;

  select vendor_id, quote into v_old_vendor, v_quote from work_orders where id = v_wo_id;
  select name into v_old_name from vendors where id = v_old_vendor;
  select name into v_backup_name from vendors where id = p_backup_vendor_id;

  -- 2× advance, advance assumed at the workspace default of 30% of quote
  v_penalty := round(v_quote * 0.3 * 2);

  update work_orders
    set vendor_id = p_backup_vendor_id,
        flagged = false,
        contingency_resolved_stage = stage,
        note = 'Reassigned to ' || v_backup_name || ' via contingency — SLA re-locked'
    where id = v_wo_id;

  insert into milestones (id, wo_id, label, amount, due, status)
    values ('m-pen-' || extract(epoch from now())::bigint, v_wo_id,
            'Penalty invoked — ' || v_old_name || ' (2× advance)', v_penalty,
            'Auto-invoked on activation', 'due');

  update vendors
    set compliance = 'Under Review',
        note = 'No-show on ' || v_wo_id || ' — penalty invoked, re-certification required'
    where id = v_old_vendor;

  update flags set status = 'resolved' where id = p_flag_id;

  insert into notifications (id, tone, title, meta, route)
    values ('n-' || extract(epoch from now())::bigint, 'success',
            'Backup activated — ' || v_backup_name,
            v_wo_id || ' reassigned · penalty clause invoked · SLA re-locked', '/contingency');
end;
$$;

create or replace function source_backup(p_flag_id text, p_vendor_id text)
returns text  -- returns the new addendum work order id
language plpgsql
security invoker
as $$
declare
  v_wo_id     text;
  v_wedding   text;
  v_ceremony  text;
  v_category  text;
  v_new_id    text;
begin
  select wo_id into v_wo_id from flags where id = p_flag_id;
  if v_wo_id is null then raise exception 'Flag % not found', p_flag_id; end if;

  select wedding_id, ceremony into v_wedding, v_ceremony from work_orders where id = v_wo_id;
  select category into v_category from vendors where id = p_vendor_id;
  v_new_id := v_wo_id || '-A';

  update work_orders set flagged = false where id = v_wo_id;

  insert into work_orders (id, wedding_id, ceremony, vendor_id, category, stage, quote, note)
    values (v_new_id, v_wedding, v_ceremony || ' (addendum)', p_vendor_id, v_category, 4, 120000,
            'Addendum work order — adds capacity, does not replace the original vendor');

  update flags set status = 'resolved' where id = p_flag_id;
  return v_new_id;
end;
$$;

create or replace function approve_change_order(p_flag_id text)
returns void
language plpgsql
security invoker
as $$
declare
  v_wo_id text;
begin
  select wo_id into v_wo_id from flags where id = p_flag_id;
  if v_wo_id is null then raise exception 'Flag % not found', p_flag_id; end if;

  update work_orders
    set quote = 1050000, flagged = false,
        note = 'Repriced via approved change order — amended WO issued, client notified'
    where id = v_wo_id;

  update milestones set amount = 315000, label = 'Advance (30% of revised)'
    where wo_id = v_wo_id and label ilike 'Advance%';

  update flags set status = 'resolved' where id = p_flag_id;
end;
$$;

create or replace function log_outcome(p_flag_id text, p_recommend boolean)
returns void
language plpgsql
security invoker
as $$
declare
  v_wo_id  text;
  v_vendor text; -- whoever currently holds the work order is the backup that served it
begin
  select wo_id into v_wo_id from flags where id = p_flag_id;
  if v_wo_id is null then raise exception 'Flag % not found', p_flag_id; end if;

  select vendor_id into v_vendor from work_orders where id = v_wo_id;

  update milestones set status = 'paid', due = 'Settled via Finance'
    where wo_id = v_wo_id and label ilike 'Penalty%' and status in ('due','overdue');

  update work_orders
    set flagged = false, note = p_flag_id || ' closed — reconciliation logged to vendor record'
    where id = v_wo_id;

  update vendors
    set compliance = 'Verified',
        note = case when p_recommend then 'Backup performance +1 · recommended for future backup'
                     else 'Backup performance logged' end
    where id = v_vendor;

  update flags set status = 'resolved' where id = p_flag_id;
end;
$$;

create or replace function add_manual_flag(
  p_id text, p_type text, p_severity text, p_label text,
  p_title text, p_meta text, p_wo_id text, p_opened text
)
returns void
language plpgsql
security invoker
as $$
begin
  insert into flags (id, type, severity, label, title, meta, wo_id, opened, status)
    values (p_id, p_type, p_severity, p_label, p_title, p_meta, p_wo_id, p_opened, 'open');

  update work_orders set flagged = true where id = p_wo_id;

  insert into notifications (id, tone, title, meta, route)
    values ('n-' || extract(epoch from now())::bigint,
            case p_severity when 'high' then 'danger' when 'medium' then 'warning' else 'neutral' end,
            'Risk flagged manually — ' || p_label, p_wo_id || ' · ' || p_title, '/contingency');
end;
$$;

-- ---------- seed data (mirrors src/seed.ts 1:1) ----------

insert into vendors (id, name, category, risk, tier, compliance, last_verified, empanelled, contact, rate, note) values
  ('v-annapurna','Annapurna Caterers','Caterer','High','Preferred','Verified','12 Jun 2026','Empanelled 2023 · 41 events','ops@annapurna.in','₹2,400 per plate', null),
  ('v-rangoli','Rangoli Decor Co.','Decor','Medium','Preferred','Verified','02 Jul 2026','Empanelled 2024 · 28 events','hello@rangolidecor.in','₹1,80,000 per setup', null),
  ('v-agni','Agni Fireworks','Pyrotechnics','High','Approved','Expired','28 Feb 2026','Empanelled 2022 · 17 events', null, null,'Liability insurance expired — renewal requested'),
  ('v-lumiere','Lumière Photography','Photography','Medium','Approved','Pending','18 Jul 2026','Empanelled 2025 · 9 events', null, null, null),
  ('v-pandit','Pandit Sharma Ji','Priest / Rituals','Low','Preferred','Verified','05 May 2026','Empanelled 2021 · 63 events', null, null, null),
  ('v-shaadi-wheels','Shaadi Wheels','Transport','Medium','Backup','Pending','21 Jul 2026','Empanelled 2023 · 22 events', null, null, null),
  ('v-meera','Meera Mehndi Studio','Beauty & Attire','Low','Approved','Verified','11 Apr 2026','Empanelled 2024 · 15 events', null, null, null),
  ('v-swaad','Swaad Sweets & Mithai','Caterer','High','Backup','Under Review','01 Aug 2026','Empanelled 2025 · 4 events', null,'Rate fit 92% vs Annapurna','Served as backup on WO-2019 — full scope on schedule, no client complaints'),
  ('v-rasoi','Rasoi Royale','Caterer','High','Approved','Verified','15 Jul 2026','Empanelled 2023 · 19 events', null,'Rate fit 85%', null),
  ('v-saanjh','Saanjh Decor Studio','Decor','Medium','Backup','Verified','09 Jun 2026','Empanelled 2024 · 7 events', null,'Rate fit 88% · 9 km from venue', null);

insert into weddings (id, couple, ceremonies, month, budget, status) values
  ('w-sharma-mehta','Sharma × Mehta',5,'Nov 2026','₹68,00,000','Planning'),
  ('w-kapoor-singh','Kapoor × Singh',3,'Dec 2026','₹42,00,000','Planning'),
  ('w-rao-iyer','Rao × Iyer',4,'Oct 2026','₹51,00,000','Wrapped');

insert into work_orders (id, wedding_id, ceremony, vendor_id, category, stage, quote, flagged, contingency_resolved_stage, note) values
  ('WO-2041','w-sharma-mehta','Sangeet','v-annapurna','Caterer',6,840000,true,null,'350 guests · locked quote · 13 Nov'),
  ('WO-2051','w-kapoor-singh','Mehndi','v-rangoli','Decor',5,180000,true,null,'At capacity — 2 extra flower walls requested'),
  ('WO-2052','w-kapoor-singh','Reception','v-rasoi','Caterer',3,840000,true,null,'Client change order awaiting sign-off · quote delta +₹2.1L'),
  ('WO-2019','w-rao-iyer','Reception','v-swaad','Caterer',8,500000,true,7,'Backup activation closed 28 Oct — reconciliation pending'),
  ('WO-2033','w-sharma-mehta','Wedding Day','v-lumiere','Photography',4,320000,false,null,null),
  ('WO-2036','w-sharma-mehta','Haldi','v-pandit','Priest / Rituals',2,45000,false,null,null),
  ('WO-2044','w-kapoor-singh','Baraat','v-shaadi-wheels','Transport',1,120000,false,null,null);

insert into flags (id, type, severity, label, title, meta, wo_id, opened, status) values
  ('FLG-1','vendor_no_show','high','Vendor No-show','Caterer unreachable — Sharma × Mehta, Sangeet (Nov 14)','Work order WO-2041 · Annapurna Caterers · 2 backup vendors available','WO-2041','Flagged 22 min ago','open'),
  ('FLG-2','extra_resources','medium','Extra Resources','2 extra mandap flower walls needed — Kapoor × Singh, Mehndi (Dec 1)','WO-2051 · Rangoli Decor at capacity · 1 Backup-tier decor vendor available','WO-2051','Flagged 1 hr ago','open'),
  ('FLG-3','scope_change','medium','Scope Change','Guest count +150 — Kapoor × Singh, Reception (Dec 4)','WO-2052 · Rasoi Royale · client change order awaiting sign-off · quote delta +₹2.1L','WO-2052','Flagged 3 hrs ago','open'),
  ('CE-114','reconciliation','low','Reconciliation','Post-incident reconciliation — Rao × Iyer backup activation (Oct 28)','CE-114 closed · penalty ₹84,000 pending Finance sign-off · backup vendor rating due','WO-2019','2 days open','open');

insert into milestones (id, wo_id, label, amount, due, status) values
  ('m-2041-adv','WO-2041','Advance (30%)',252000,'Paid 02 Aug','paid'),
  ('m-2041-pre','WO-2041','Pre-event (30%)',252000,'Due Fri, 14 Aug','due'),
  ('m-2041-set','WO-2041','Settlement (40%)',336000,'After Sangeet','pending'),
  ('m-2019-adv','WO-2019','Advance (30%)',150000,'Due Fri, 14 Aug','due'),
  ('m-2019-pen','WO-2019','Penalty recovery — Annapurna Caterers (2× advance)',84000,'Pending Finance sign-off','overdue'),
  ('m-2033-adv','WO-2033','Advance (30%)',96000,'Paid 21 Jul','paid'),
  ('m-2052-adv','WO-2052','Advance (30%)',252000,'On booking confirmation','pending'),
  ('m-2051-set','WO-2051','Settlement (40%)',72000,'After Mehndi','pending');

insert into team_members (id, name, email, role, status) values
  ('t-asha','Asha Sharma','asha@meraki.in','Owner','Active'),
  ('t-rohan','Rohan Mehta','rohan@meraki.in','Vendor Manager','Active'),
  ('t-priya','Priya Nair','priya@meraki.in','Finance','Invited');

insert into invites (id, email, role, sent_label) values
  ('inv-1','priya.n@merakiweddings.in','Vendor Manager','Invited 2 days ago');

insert into notifications (id, tone, title, meta, time_label, route, read) values
  ('n1','danger','Vendor no-show flagged — Annapurna Caterers','WO-2041 · Sangeet · 2 pre-vetted backups ready','2m','/contingency',false),
  ('n2','warning','3 documents expire within 30 days','FSSAI (Annapurna) · Insurance (Agni) · Police verif. (Shaadi Wheels)','1h','/',false),
  ('n3','info','Payment milestone due Friday','WO-2019 · Advance ₹1,50,000 · Swaad Sweets & Mithai','3h','/payments',false),
  ('n4','success','Meera Mehndi Studio added to roster','Onboarding complete · Beauty & Attire · Low risk','1d','/',true),
  ('n5','neutral','Change order awaiting client sign-off','WO-2052 · Rasoi Royale · quote delta +₹2,10,000','2d','/contingency',true);

insert into settings (id, agency_name, gst, city, address) values
  (1, 'Meraki Weddings', '27AAHCM4021R1Z6', 'Mumbai', '4th Floor, Trellis House, Bandra West, Mumbai 400050');

-- =============================================================================
-- Done. Next: Authentication → Providers → Email → turn OFF "Confirm email"
-- so sign-ups work instantly in the demo, then sign up from the Nuptis app.
-- =============================================================================

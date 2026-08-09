-- Run this once in Supabase SQL Editor to bring an existing (already-seeded) database
-- up to date with the new per-stage editable fields on Procurement work orders.
-- Non-destructive: adds a column and backfills the 7 original demo rows only —
-- it does not touch any data you've since created or edited.

alter table work_orders add column if not exists details jsonb not null default '{}'::jsonb;

update work_orders set details = '{"guestCount":"350","budgetBand":"₹8L–12L","mustHaves":"Live counters ×4, vegetarian + Jain menu, buffet by 7pm","shortlist":["v-annapurna","v-rasoi"],"sharedWithClient":true,"negotiationNotes":"Locked at rate card — no discount requested.","quoteLocked":true,"advancePct":"30%","workOrderIssued":true,"tastingApproved":true,"runOfShow":"Sangeet-RunOfShow.pdf","loadIn":"4:00 PM","loadOut":"11:30 PM"}'::jsonb
  where id = 'WO-2041' and details = '{}'::jsonb;

update work_orders set details = '{"guestCount":"220","budgetBand":"₹1.5L–2L","mustHaves":"Marigold mandap backdrop, 2 flower walls, fairy-light canopy","shortlist":["v-rangoli","v-saanjh"],"sharedWithClient":true,"negotiationNotes":"Approved at rate card.","quoteLocked":true,"advancePct":"30%","workOrderIssued":true}'::jsonb
  where id = 'WO-2051' and details = '{}'::jsonb;

update work_orders set details = '{"guestCount":"350","budgetBand":"₹8L–12L","mustHaves":"4 live counters, dessert bar","shortlist":["v-rasoi","v-annapurna"],"sharedWithClient":true,"negotiationNotes":"Awaiting change-order sign-off — guest count +150 pending."}'::jsonb
  where id = 'WO-2052' and details = '{}'::jsonb;

update work_orders set details = '{"guestCount":"400","budgetBand":"₹5L–8L","mustHaves":"Simple buffet, no live counters (reduced backup scope)","shortlist":["v-swaad"],"sharedWithClient":true,"negotiationNotes":"Backup activation — rate fit 92% vs Annapurna.","quoteLocked":true,"advancePct":"30%","workOrderIssued":true,"tastingApproved":true,"runOfShow":"Reception-RunOfShow.pdf","loadIn":"5:00 PM","loadOut":"11:00 PM","vendorArrived":true,"setupConfirmed":true,"photoProof":true,"executionNote":"Delivered full scope on schedule — no client complaints."}'::jsonb
  where id = 'WO-2019' and details = '{}'::jsonb;

update work_orders set details = '{"guestCount":"500","budgetBand":"₹2.5L–3.5L","mustHaves":"Candid + traditional coverage, drone shots, same-day highlight reel","shortlist":["v-lumiere"],"sharedWithClient":true,"negotiationNotes":"Package locked, no add-ons.","quoteLocked":true,"advancePct":"30%"}'::jsonb
  where id = 'WO-2033' and details = '{}'::jsonb;

update work_orders set details = '{"guestCount":"150","budgetBand":"Under ₹1L","mustHaves":"Havan samagri included, 90-minute ceremony window"}'::jsonb
  where id = 'WO-2036' and details = '{}'::jsonb;

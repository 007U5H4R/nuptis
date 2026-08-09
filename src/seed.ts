import type { AppState, OnboardingDraft } from './types';

export const emptyDraft: OnboardingDraft = {
  step: 1,
  name: '',
  category: 'Caterer',
  risk: 'High',
  overrideReason: '',
  docs: {},
  reference1: '',
  reference2: '',
  trialDone: false,
  baseRate: '',
  rateUnit: 'per plate',
  advancePct: '30%',
  terms: 'Milestone-based (advance · pre-event · settlement)',
  tier: 'Approved',
};

/** Documents required at intake, by risk tier (from the onboarding process doc). */
export const DOCS_BY_RISK: Record<string, string[]> = {
  High: ['FSSAI license', 'GST registration', 'Liability insurance', 'Police verification', 'PAN / bank proof'],
  Medium: ['GST registration', 'Liability insurance', 'PAN / bank proof'],
  Low: ['PAN / bank proof', 'Basic KYC'],
};

export const CATEGORY_RISK: Record<string, 'High' | 'Medium' | 'Low'> = {
  Caterer: 'High',
  Pyrotechnics: 'High',
  Decor: 'Medium',
  Photography: 'Medium',
  Transport: 'Medium',
  'Priest / Rituals': 'Low',
  'Beauty & Attire': 'Low',
};

export function seedState(): AppState {
  return {
    session: null,
    theme: 'system',
    vendors: [
      { id: 'v-annapurna', name: 'Annapurna Caterers', category: 'Caterer', risk: 'High', tier: 'Preferred', compliance: 'Verified', lastVerified: '12 Jun 2026', empanelled: 'Empanelled 2023 · 41 events', rate: '₹2,400 per plate', contact: 'ops@annapurna.in' },
      { id: 'v-rangoli', name: 'Rangoli Decor Co.', category: 'Decor', risk: 'Medium', tier: 'Preferred', compliance: 'Verified', lastVerified: '02 Jul 2026', empanelled: 'Empanelled 2024 · 28 events', rate: '₹1,80,000 per setup', contact: 'hello@rangolidecor.in' },
      { id: 'v-agni', name: 'Agni Fireworks', category: 'Pyrotechnics', risk: 'High', tier: 'Approved', compliance: 'Expired', lastVerified: '28 Feb 2026', empanelled: 'Empanelled 2022 · 17 events', note: 'Liability insurance expired — renewal requested' },
      { id: 'v-lumiere', name: 'Lumière Photography', category: 'Photography', risk: 'Medium', tier: 'Approved', compliance: 'Pending', lastVerified: '18 Jul 2026', empanelled: 'Empanelled 2025 · 9 events' },
      { id: 'v-pandit', name: 'Pandit Sharma Ji', category: 'Priest / Rituals', risk: 'Low', tier: 'Preferred', compliance: 'Verified', lastVerified: '05 May 2026', empanelled: 'Empanelled 2021 · 63 events' },
      { id: 'v-shaadi-wheels', name: 'Shaadi Wheels', category: 'Transport', risk: 'Medium', tier: 'Backup', compliance: 'Pending', lastVerified: '21 Jul 2026', empanelled: 'Empanelled 2023 · 22 events' },
      { id: 'v-meera', name: 'Meera Mehndi Studio', category: 'Beauty & Attire', risk: 'Low', tier: 'Approved', compliance: 'Verified', lastVerified: '11 Apr 2026', empanelled: 'Empanelled 2024 · 15 events' },
      { id: 'v-swaad', name: 'Swaad Sweets & Mithai', category: 'Caterer', risk: 'High', tier: 'Backup', compliance: 'Under Review', lastVerified: '01 Aug 2026', empanelled: 'Empanelled 2025 · 4 events', rate: 'Rate fit 92% vs Annapurna', note: 'Served as backup on WO-2019 — full scope on schedule, no client complaints' },
      { id: 'v-rasoi', name: 'Rasoi Royale', category: 'Caterer', risk: 'High', tier: 'Approved', compliance: 'Verified', lastVerified: '15 Jul 2026', empanelled: 'Empanelled 2023 · 19 events', rate: 'Rate fit 85%' },
      { id: 'v-saanjh', name: 'Saanjh Decor Studio', category: 'Decor', risk: 'Medium', tier: 'Backup', compliance: 'Verified', lastVerified: '09 Jun 2026', empanelled: 'Empanelled 2024 · 7 events', rate: 'Rate fit 88% · 9 km from venue' },
    ],
    weddings: [
      { id: 'w-sharma-mehta', couple: 'Sharma × Mehta', ceremonies: 5, month: 'Nov 2026', budget: '₹68,00,000', status: 'Planning' },
      { id: 'w-kapoor-singh', couple: 'Kapoor × Singh', ceremonies: 3, month: 'Dec 2026', budget: '₹42,00,000', status: 'Planning' },
      { id: 'w-rao-iyer', couple: 'Rao × Iyer', ceremonies: 4, month: 'Oct 2026', budget: '₹51,00,000', status: 'Wrapped' },
    ],
    workOrders: [
      {
        id: 'WO-2041', weddingId: 'w-sharma-mehta', ceremony: 'Sangeet', vendorId: 'v-annapurna', category: 'Caterer', stage: 6, quote: 840000, flagged: true, note: '350 guests · locked quote · 13 Nov',
        details: {
          guestCount: '350', budgetBand: '₹8L–12L', mustHaves: 'Live counters ×4, vegetarian + Jain menu, buffet by 7pm',
          shortlist: ['v-annapurna', 'v-rasoi'], sharedWithClient: true,
          negotiationNotes: 'Locked at rate card — no discount requested.', quoteLocked: true,
          advancePct: '30%', workOrderIssued: true,
          tastingApproved: true, runOfShow: 'Sangeet-RunOfShow.pdf', loadIn: '4:00 PM', loadOut: '11:30 PM',
        },
      },
      {
        id: 'WO-2051', weddingId: 'w-kapoor-singh', ceremony: 'Mehndi', vendorId: 'v-rangoli', category: 'Decor', stage: 5, quote: 180000, flagged: true, note: 'At capacity — 2 extra flower walls requested',
        details: {
          guestCount: '220', budgetBand: '₹1.5L–2L', mustHaves: 'Marigold mandap backdrop, 2 flower walls, fairy-light canopy',
          shortlist: ['v-rangoli', 'v-saanjh'], sharedWithClient: true,
          negotiationNotes: 'Approved at rate card.', quoteLocked: true,
          advancePct: '30%', workOrderIssued: true,
        },
      },
      {
        id: 'WO-2052', weddingId: 'w-kapoor-singh', ceremony: 'Reception', vendorId: 'v-rasoi', category: 'Caterer', stage: 3, quote: 840000, flagged: true, note: 'Client change order awaiting sign-off · quote delta +₹2.1L',
        details: {
          guestCount: '350', budgetBand: '₹8L–12L', mustHaves: '4 live counters, dessert bar',
          shortlist: ['v-rasoi', 'v-annapurna'], sharedWithClient: true,
          negotiationNotes: 'Awaiting change-order sign-off — guest count +150 pending.',
        },
      },
      {
        id: 'WO-2019', weddingId: 'w-rao-iyer', ceremony: 'Reception', vendorId: 'v-swaad', category: 'Caterer', stage: 8, quote: 500000, flagged: true, contingencyResolvedStage: 7, note: 'Backup activation closed 28 Oct — reconciliation pending',
        details: {
          guestCount: '400', budgetBand: '₹5L–8L', mustHaves: 'Simple buffet, no live counters (reduced backup scope)',
          shortlist: ['v-swaad'], sharedWithClient: true,
          negotiationNotes: 'Backup activation — rate fit 92% vs Annapurna.', quoteLocked: true,
          advancePct: '30%', workOrderIssued: true,
          tastingApproved: true, runOfShow: 'Reception-RunOfShow.pdf', loadIn: '5:00 PM', loadOut: '11:00 PM',
          vendorArrived: true, setupConfirmed: true, photoProof: true, executionNote: 'Delivered full scope on schedule — no client complaints.',
        },
      },
      {
        id: 'WO-2033', weddingId: 'w-sharma-mehta', ceremony: 'Wedding Day', vendorId: 'v-lumiere', category: 'Photography', stage: 4, quote: 320000,
        details: {
          guestCount: '500', budgetBand: '₹2.5L–3.5L', mustHaves: 'Candid + traditional coverage, drone shots, same-day highlight reel',
          shortlist: ['v-lumiere'], sharedWithClient: true,
          negotiationNotes: 'Package locked, no add-ons.', quoteLocked: true,
          advancePct: '30%',
        },
      },
      {
        id: 'WO-2036', weddingId: 'w-sharma-mehta', ceremony: 'Haldi', vendorId: 'v-pandit', category: 'Priest / Rituals', stage: 2, quote: 45000,
        details: { guestCount: '150', budgetBand: 'Under ₹1L', mustHaves: 'Havan samagri included, 90-minute ceremony window' },
      },
      {
        id: 'WO-2044', weddingId: 'w-kapoor-singh', ceremony: 'Baraat', vendorId: 'v-shaadi-wheels', category: 'Transport', stage: 1, quote: 120000,
        details: {},
      },
    ],
    flags: [
      { id: 'FLG-1', type: 'vendor_no_show', severity: 'high', label: 'Vendor No-show', title: 'Caterer unreachable — Sharma × Mehta, Sangeet (Nov 14)', meta: 'Work order WO-2041 · Annapurna Caterers · 2 backup vendors available', woId: 'WO-2041', opened: 'Flagged 22 min ago', status: 'open' },
      { id: 'FLG-2', type: 'extra_resources', severity: 'medium', label: 'Extra Resources', title: '2 extra mandap flower walls needed — Kapoor × Singh, Mehndi (Dec 1)', meta: 'WO-2051 · Rangoli Decor at capacity · 1 Backup-tier decor vendor available', woId: 'WO-2051', opened: 'Flagged 1 hr ago', status: 'open' },
      { id: 'FLG-3', type: 'scope_change', severity: 'medium', label: 'Scope Change', title: 'Guest count +150 — Kapoor × Singh, Reception (Dec 4)', meta: 'WO-2052 · Rasoi Royale · client change order awaiting sign-off · quote delta +₹2.1L', woId: 'WO-2052', opened: 'Flagged 3 hrs ago', status: 'open' },
      { id: 'CE-114', type: 'reconciliation', severity: 'low', label: 'Reconciliation', title: 'Post-incident reconciliation — Rao × Iyer backup activation (Oct 28)', meta: 'CE-114 closed · penalty ₹84,000 pending Finance sign-off · backup vendor rating due', woId: 'WO-2019', opened: '2 days open', status: 'open' },
    ],
    milestones: [
      { id: 'm-2041-adv', woId: 'WO-2041', label: 'Advance (30%)', amount: 252000, due: 'Paid 02 Aug', status: 'paid' },
      { id: 'm-2041-pre', woId: 'WO-2041', label: 'Pre-event (30%)', amount: 252000, due: 'Due Fri, 14 Aug', status: 'due' },
      { id: 'm-2041-set', woId: 'WO-2041', label: 'Settlement (40%)', amount: 336000, due: 'After Sangeet', status: 'pending' },
      { id: 'm-2019-adv', woId: 'WO-2019', label: 'Advance (30%)', amount: 150000, due: 'Due Fri, 14 Aug', status: 'due' },
      { id: 'm-2019-pen', woId: 'WO-2019', label: 'Penalty recovery — Annapurna (2× advance)', amount: 84000, due: 'Pending Finance sign-off', status: 'overdue' },
      { id: 'm-2033-adv', woId: 'WO-2033', label: 'Advance (30%)', amount: 96000, due: 'Paid 21 Jul', status: 'paid' },
      { id: 'm-2052-adv', woId: 'WO-2052', label: 'Advance (30%)', amount: 252000, due: 'On booking confirmation', status: 'pending' },
      { id: 'm-2051-set', woId: 'WO-2051', label: 'Settlement (40%)', amount: 72000, due: 'After Mehndi', status: 'pending' },
    ],
    team: [
      { id: 't-asha', name: 'Asha Sharma', email: 'asha@meraki.in', role: 'Owner', status: 'Active' },
      { id: 't-rohan', name: 'Rohan Mehta', email: 'rohan@meraki.in', role: 'Vendor Manager', status: 'Active' },
      { id: 't-priya', name: 'Priya Nair', email: 'priya@meraki.in', role: 'Finance', status: 'Invited' },
    ],
    invites: [{ id: 'inv-1', email: 'priya.n@merakiweddings.in', role: 'Vendor Manager', sent: 'Invited 2 days ago' }],
    notifications: [
      { id: 'n1', tone: 'danger', title: 'Vendor no-show flagged — Annapurna Caterers', meta: 'WO-2041 · Sangeet · 2 pre-vetted backups ready', time: '2m', route: '/contingency', read: false },
      { id: 'n2', tone: 'warning', title: '3 documents expire within 30 days', meta: 'FSSAI (Annapurna) · Insurance (Agni) · Police verif. (Shaadi Wheels)', time: '1h', route: '/', read: false },
      { id: 'n3', tone: 'info', title: 'Payment milestone due Friday', meta: 'WO-2019 · Advance ₹1,50,000 · Swaad Sweets & Mithai', time: '3h', route: '/payments', read: false },
      { id: 'n4', tone: 'success', title: 'Meera Mehndi Studio added to roster', meta: 'Onboarding complete · Beauty & Attire · Low risk', time: '1d', route: '/', read: true },
      { id: 'n5', tone: 'neutral', title: 'Change order awaiting client sign-off', meta: 'WO-2052 · Rasoi Royale · quote delta +₹2,10,000', time: '2d', route: '/contingency', read: true },
    ],
    toasts: [],
    draft: { ...emptyDraft },
    settings: {
      agencyName: 'Meraki Weddings',
      gst: '27AAHCM4021R1Z6',
      city: 'Mumbai',
      address: '4th Floor, Trellis House, Bandra West, Mumbai 400050',
      notif: {
        highSeverity: true,
        mediumSeverity: true,
        payments: true,
        documents: true,
        onboarding: true,
        changeOrders: false,
        email: true,
        inApp: true,
        digest: '8:00 AM · weekdays',
      },
      defaults: {
        riskTier: 'By category (recommended)',
        expiryWindow: '30 days before expiry',
        backupCoverage: true,
        advance: '30% on booking confirmation',
        penalty: '2× advance on vendor no-show',
        structure: 'Milestone-based (advance · pre-event · settlement)',
      },
    },
  };
}

export const fmtINR = (n: number) => '₹' + n.toLocaleString('en-IN');

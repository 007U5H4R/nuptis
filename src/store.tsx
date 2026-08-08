import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { AppState, Flag, Invite, Notification, OnboardingDraft, Session, Settings, Theme, Toast, Vendor, Wedding } from './types';
import { emptyDraft, seedState } from './seed';

const STORAGE_KEY = 'nuptis-state-v1';
const THEME_KEY = 'nuptis-theme';

type Action =
  | { type: 'LOGIN'; session: Session }
  | { type: 'LOGOUT' }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'TOAST_PUSH'; toast: Omit<Toast, 'id'> }
  | { type: 'TOAST_DISMISS'; id: number }
  | { type: 'NOTIFS_READ' }
  | { type: 'NOTIF_READ'; id: string }
  | { type: 'SET_STAGE'; woId: string; stage: number }
  | { type: 'ADVANCE_STAGE'; woId: string }
  | { type: 'ACTIVATE_BACKUP'; flagId: string; backupVendorId: string }
  | { type: 'SOURCE_BACKUP'; flagId: string; vendorId: string }
  | { type: 'APPROVE_CO'; flagId: string }
  | { type: 'LOG_OUTCOME'; flagId: string; recommend: boolean }
  | { type: 'DRAFT_SET'; patch: Partial<OnboardingDraft> }
  | { type: 'DRAFT_RESET' }
  | { type: 'PUBLISH_VENDOR'; vendor: Vendor }
  | { type: 'WEDDING_ADD'; wedding: Wedding }
  | { type: 'MILESTONE_PAY'; id: string }
  | { type: 'INVITE_ADD'; invite: Invite }
  | { type: 'INVITE_REMOVE'; id: string }
  | { type: 'SETTINGS_SET'; patch: Partial<Settings> }
  | { type: 'NOTIF_PREF_SET'; key: keyof Settings['notif']; value: boolean | string }
  | { type: 'DEFAULT_SET'; key: keyof Settings['defaults']; value: boolean | string }
  | { type: 'RESET_DEMO' };

let toastSeq = 1;

function pushToast(state: AppState, toast: Omit<Toast, 'id'>): AppState {
  return { ...state, toasts: [...state.toasts, { ...toast, id: toastSeq++ }] };
}

function pushNotif(state: AppState, n: Omit<Notification, 'id' | 'read' | 'time'>): AppState {
  const notif: Notification = { ...n, id: 'n' + Date.now(), read: false, time: 'now' };
  return { ...state, notifications: [notif, ...state.notifications] };
}

function resolveFlag(state: AppState, flagId: string): { state: AppState; flag: Flag | undefined } {
  const flag = state.flags.find((f) => f.id === flagId);
  return {
    state: { ...state, flags: state.flags.map((f) => (f.id === flagId ? { ...f, status: 'resolved' as const } : f)) },
    flag,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, session: action.session };
    case 'LOGOUT':
      return { ...state, session: null };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'TOAST_PUSH':
      return pushToast(state, action.toast);
    case 'TOAST_DISMISS':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'NOTIFS_READ':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'NOTIF_READ':
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)) };

    case 'SET_STAGE':
      return {
        ...state,
        workOrders: state.workOrders.map((w) => (w.id === action.woId ? { ...w, stage: Math.min(8, Math.max(1, action.stage)) } : w)),
      };
    case 'ADVANCE_STAGE': {
      const wo = state.workOrders.find((w) => w.id === action.woId);
      if (!wo) return state;
      const next = Math.min(8, wo.stage + 1);
      let s: AppState = {
        ...state,
        workOrders: state.workOrders.map((w) => (w.id === action.woId ? { ...w, stage: next } : w)),
      };
      s = pushToast(s, {
        tone: 'success',
        title: `Stage ${wo.stage} complete`,
        desc: `${wo.id} moved to stage ${next} of 8.`,
        route: `/procurement/${wo.id}`,
      });
      return s;
    }

    case 'ACTIVATE_BACKUP': {
      const { state: s0, flag } = resolveFlag(state, action.flagId);
      if (!flag) return state;
      const backup = state.vendors.find((v) => v.id === action.backupVendorId);
      let s: AppState = {
        ...s0,
        workOrders: s0.workOrders.map((w) =>
          w.id === flag.woId
            ? { ...w, vendorId: action.backupVendorId, flagged: false, contingencyResolvedStage: w.stage, note: `Reassigned to ${backup?.name} via contingency — SLA re-locked` }
            : w,
        ),
        milestones: [
          ...s0.milestones,
          { id: 'm-pen-' + Date.now(), woId: flag.woId, label: 'Penalty invoked — Annapurna (2× advance)', amount: 504000, due: 'Auto-invoked on activation', status: 'due' as const },
        ],
        vendors: s0.vendors.map((v) => (v.id === 'v-annapurna' ? { ...v, compliance: 'Under Review' as const, note: 'No-show on WO-2041 — penalty invoked, re-certification required' } : v)),
      };
      s = pushNotif(s, { tone: 'success', title: `Backup activated — ${backup?.name}`, meta: `${flag.woId} reassigned · penalty clause invoked · SLA re-locked`, route: '/contingency' });
      s = pushToast(s, { tone: 'success', title: 'Backup activated', desc: `${backup?.name} confirmed on ${flag.woId} — work order updated.`, route: `/procurement/${flag.woId}` });
      return s;
    }

    case 'SOURCE_BACKUP': {
      const { state: s0, flag } = resolveFlag(state, action.flagId);
      if (!flag) return state;
      const vendor = state.vendors.find((v) => v.id === action.vendorId);
      const parent = state.workOrders.find((w) => w.id === flag.woId);
      let s: AppState = {
        ...s0,
        workOrders: [
          ...s0.workOrders.map((w) => (w.id === flag.woId ? { ...w, flagged: false } : w)),
          {
            id: flag.woId + '-A',
            weddingId: parent?.weddingId ?? 'w-kapoor-singh',
            ceremony: (parent?.ceremony ?? 'Mehndi') + ' (addendum)',
            vendorId: action.vendorId,
            category: vendor?.category ?? 'Decor',
            stage: 4,
            quote: 120000,
            note: 'Addendum work order — adds capacity, does not replace the original vendor',
          },
        ],
      };
      s = pushToast(s, { tone: 'success', title: 'Backup sourced', desc: `${vendor?.name} added on ${flag.woId}-A — addendum work order issued.`, route: `/procurement/${flag.woId}-A` });
      return s;
    }

    case 'APPROVE_CO': {
      const { state: s0, flag } = resolveFlag(state, action.flagId);
      if (!flag) return state;
      let s: AppState = {
        ...s0,
        workOrders: s0.workOrders.map((w) =>
          w.id === flag.woId ? { ...w, quote: 1050000, flagged: false, note: 'Repriced via approved change order — amended WO issued, client notified' } : w,
        ),
        milestones: s0.milestones.map((m) =>
          m.woId === flag.woId && m.label.startsWith('Advance') ? { ...m, amount: 315000, label: 'Advance (30% of revised)' } : m,
        ),
      };
      s = pushToast(s, { tone: 'success', title: 'Change order approved', desc: `${flag.woId} repriced to ₹10,50,000 — client notified, Finance updated.`, route: '/payments' });
      return s;
    }

    case 'LOG_OUTCOME': {
      const { state: s0, flag } = resolveFlag(state, action.flagId);
      if (!flag) return state;
      let s: AppState = {
        ...s0,
        milestones: s0.milestones.map((m) => (m.id === 'm-2019-pen' ? { ...m, status: 'paid' as const, due: 'Settled via Finance' } : m)),
        workOrders: s0.workOrders.map((w) => (w.id === flag.woId ? { ...w, flagged: false, note: 'CE-114 closed — reconciliation logged to vendor record' } : w)),
        vendors: s0.vendors.map((v) =>
          v.id === 'v-swaad'
            ? { ...v, compliance: 'Verified' as const, note: action.recommend ? 'Backup performance +1 · recommended for future backup' : 'Backup performance logged' }
            : v,
        ),
      };
      s = pushToast(s, { tone: 'success', title: 'Outcome logged', desc: 'CE-114 closed — penalty settled, Swaad Sweets & Mithai score updated.', route: '/' });
      return s;
    }

    case 'DRAFT_SET':
      return { ...state, draft: { ...state.draft, ...action.patch } };
    case 'DRAFT_RESET':
      return { ...state, draft: { ...emptyDraft } };
    case 'PUBLISH_VENDOR': {
      let s: AppState = { ...state, vendors: [action.vendor, ...state.vendors], draft: { ...emptyDraft } };
      s = pushNotif(s, { tone: 'success', title: `${action.vendor.name} added to roster`, meta: `Onboarding complete · ${action.vendor.category} · ${action.vendor.risk} risk`, route: '/' });
      s = pushToast(s, { tone: 'success', title: 'Published to roster', desc: `${action.vendor.name} is live — ${action.vendor.tier} tier, ${action.vendor.risk} risk.`, route: '/' });
      return s;
    }
    case 'WEDDING_ADD': {
      let s: AppState = { ...state, weddings: [action.wedding, ...state.weddings] };
      s = pushToast(s, { tone: 'success', title: 'Wedding created', desc: `${action.wedding.couple} — ${action.wedding.ceremonies} ceremonies, ${action.wedding.month}.` });
      return s;
    }
    case 'MILESTONE_PAY': {
      const m = state.milestones.find((x) => x.id === action.id);
      let s: AppState = {
        ...state,
        milestones: state.milestones.map((x) => (x.id === action.id ? { ...x, status: 'paid' as const, due: 'Paid today' } : x)),
      };
      if (m) s = pushToast(s, { tone: 'success', title: 'Milestone recorded as paid', desc: `${m.label} · ${m.woId}` });
      return s;
    }
    case 'INVITE_ADD': {
      let s: AppState = { ...state, invites: [action.invite, ...state.invites] };
      s = pushToast(s, { tone: 'success', title: 'Invite sent', desc: `${action.invite.email} · ${action.invite.role} — access starts when they accept.` });
      return s;
    }
    case 'INVITE_REMOVE':
      return { ...state, invites: state.invites.filter((i) => i.id !== action.id) };
    case 'SETTINGS_SET':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'NOTIF_PREF_SET':
      if (action.key === 'highSeverity') return state; // locked — load-bearing rule
      return { ...state, settings: { ...state.settings, notif: { ...state.settings.notif, [action.key]: action.value } } };
    case 'DEFAULT_SET':
      return { ...state, settings: { ...state.settings, defaults: { ...state.settings.defaults, [action.key]: action.value } } };
    case 'RESET_DEMO': {
      const fresh = seedState();
      return { ...fresh, session: state.session, theme: state.theme };
    }
    default:
      return state;
  }
}

function loadInitial(): AppState {
  const base = seedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const theme = (localStorage.getItem(THEME_KEY) as Theme) || 'system';
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppState>;
      return { ...base, ...saved, theme, toasts: [] };
    }
    return { ...base, theme };
  } catch {
    return base;
  }
}

const StoreCtx = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  // persist (toasts excluded)
  useEffect(() => {
    const { toasts, theme, ...rest } = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [state]);

  // apply theme
  useEffect(() => {
    const apply = () => {
      const dark = state.theme === 'dark' || (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [state.theme]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useApp must be used inside StoreProvider');
  return ctx;
}

export function useToast() {
  const { dispatch } = useApp();
  return (toast: Omit<Toast, 'id'>) => dispatch({ type: 'TOAST_PUSH', toast });
}

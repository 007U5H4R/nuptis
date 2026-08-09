import { supabase } from './supabase';
import type { AppState, Flag, Invite, Milestone, Notification, Settings, TeamMember, Vendor, Wedding, WorkOrder } from '../types';

/** All non-UI slices of AppState, as they live in Postgres. */
export type CloudData = Pick<AppState, 'vendors' | 'weddings' | 'workOrders' | 'flags' | 'milestones' | 'team' | 'invites' | 'notifications' | 'settings'>;

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

const mapVendor = (r: any): Vendor => ({
  id: r.id, name: r.name, category: r.category, risk: r.risk, tier: r.tier, compliance: r.compliance,
  lastVerified: r.last_verified, empanelled: r.empanelled, contact: r.contact ?? undefined, rate: r.rate ?? undefined, note: r.note ?? undefined,
});
const mapWedding = (r: any): Wedding => ({ id: r.id, couple: r.couple, ceremonies: r.ceremonies, month: r.month, budget: r.budget, status: r.status });
const mapWorkOrder = (r: any): WorkOrder => ({
  id: r.id, weddingId: r.wedding_id, ceremony: r.ceremony, vendorId: r.vendor_id, category: r.category, stage: r.stage,
  quote: Number(r.quote), flagged: r.flagged, contingencyResolvedStage: r.contingency_resolved_stage ?? undefined, note: r.note ?? undefined,
  details: r.details ?? {},
});
const mapFlag = (r: any): Flag => ({
  id: r.id, type: r.type, severity: r.severity, label: r.label, title: r.title, meta: r.meta, woId: r.wo_id, opened: r.opened, status: r.status,
});
const mapMilestone = (r: any): Milestone => ({ id: r.id, woId: r.wo_id, label: r.label, amount: Number(r.amount), due: r.due, status: r.status });
const mapTeamMember = (r: any): TeamMember => ({ id: r.id, name: r.name, email: r.email, role: r.role, status: r.status });
const mapInvite = (r: any): Invite => ({ id: r.id, email: r.email, role: r.role, sent: r.sent_label });
const mapNotification = (r: any): Notification => ({
  id: r.id, tone: r.tone, title: r.title, meta: r.meta, time: r.time_label ?? relativeTime(r.created_at), route: r.route, read: r.read,
});
const mapSettings = (r: any): Settings => ({ agencyName: r.agency_name, gst: r.gst, city: r.city, address: r.address, notif: r.notif, defaults: r.defaults });

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

export async function fetchAll(): Promise<CloudData> {
  const db = client();
  const [vendors, weddings, workOrders, flags, milestones, team, invites, notifications, settingsRow] = await Promise.all([
    db.from('vendors').select('*').order('created_at'),
    db.from('weddings').select('*').order('created_at'),
    db.from('work_orders').select('*').order('created_at'),
    db.from('flags').select('*').order('created_at'),
    db.from('milestones').select('*').order('created_at'),
    db.from('team_members').select('*').order('created_at'),
    db.from('invites').select('*').order('created_at', { ascending: false }),
    db.from('notifications').select('*').order('created_at', { ascending: false }),
    db.from('settings').select('*').eq('id', 1).single(),
  ]);
  for (const r of [vendors, weddings, workOrders, flags, milestones, team, invites, notifications, settingsRow]) {
    if (r.error) throw r.error;
  }
  return {
    vendors: (vendors.data ?? []).map(mapVendor),
    weddings: (weddings.data ?? []).map(mapWedding),
    workOrders: (workOrders.data ?? []).map(mapWorkOrder),
    flags: (flags.data ?? []).map(mapFlag),
    milestones: (milestones.data ?? []).map(mapMilestone),
    team: (team.data ?? []).map(mapTeamMember),
    invites: (invites.data ?? []).map(mapInvite),
    notifications: (notifications.data ?? []).map(mapNotification),
    settings: mapSettings(settingsRow.data),
  };
}

export async function fetchProfile(email: string): Promise<TeamMember | null> {
  const { data, error } = await client().from('team_members').select('*').eq('email', email).maybeSingle();
  if (error) throw error;
  return data ? mapTeamMember(data) : null;
}

// ---------- writes (mirror the reducer cases in store.tsx 1:1) ----------

export async function cloudInsertVendor(v: Vendor) {
  const { error } = await client().from('vendors').insert({
    id: v.id, name: v.name, category: v.category, risk: v.risk, tier: v.tier, compliance: v.compliance,
    last_verified: v.lastVerified, empanelled: v.empanelled, contact: v.contact ?? null, rate: v.rate ?? null, note: v.note ?? null,
  });
  if (error) throw error;
}

export async function cloudInsertWedding(w: Wedding) {
  const { error } = await client().from('weddings').insert({ id: w.id, couple: w.couple, ceremonies: w.ceremonies, month: w.month, budget: w.budget, status: w.status });
  if (error) throw error;
}

export async function cloudInsertWorkOrder(wo: WorkOrder) {
  const { error } = await client().from('work_orders').insert({
    id: wo.id, wedding_id: wo.weddingId, ceremony: wo.ceremony, vendor_id: wo.vendorId, category: wo.category,
    stage: wo.stage, quote: wo.quote, flagged: wo.flagged ?? false, note: wo.note ?? null, details: wo.details ?? {},
  });
  if (error) throw error;
}

export async function cloudSetStage(woId: string, stage: number) {
  const { error } = await client().from('work_orders').update({ stage }).eq('id', woId);
  if (error) throw error;
}

export async function cloudSetWorkOrderQuote(woId: string, quote: number) {
  const { error } = await client().from('work_orders').update({ quote }).eq('id', woId);
  if (error) throw error;
}

/** Merge-patches the work order's `details` jsonb column — same read-merge-write shape as patchSettingsJson below. */
export async function cloudSetWorkOrderDetails(woId: string, patch: Record<string, unknown>) {
  const db = client();
  const { data, error } = await db.from('work_orders').select('details').eq('id', woId).single();
  if (error) throw error;
  const merged = { ...(data?.details ?? {}), ...patch };
  const { error: upErr } = await db.from('work_orders').update({ details: merged }).eq('id', woId);
  if (upErr) throw upErr;
}

export async function cloudInsertMilestone(m: Milestone) {
  const { error } = await client().from('milestones').insert({ id: m.id, wo_id: m.woId, label: m.label, amount: m.amount, due: m.due, status: m.status });
  if (error) throw error;
}

export async function cloudAdvanceStage(woId: string) {
  const db = client();
  const { data, error } = await db.from('work_orders').select('stage').eq('id', woId).single();
  if (error) throw error;
  const next = Math.min(8, (data?.stage ?? 1) + 1);
  const { error: upErr } = await db.from('work_orders').update({ stage: next }).eq('id', woId);
  if (upErr) throw upErr;
}

export async function cloudAddManualFlag(f: Flag) {
  const { error } = await client().rpc('add_manual_flag', {
    p_id: f.id, p_type: f.type, p_severity: f.severity, p_label: f.label, p_title: f.title, p_meta: f.meta, p_wo_id: f.woId, p_opened: f.opened,
  });
  if (error) throw error;
}

export async function cloudActivateBackup(flagId: string, backupVendorId: string) {
  const { error } = await client().rpc('activate_backup', { p_flag_id: flagId, p_backup_vendor_id: backupVendorId });
  if (error) throw error;
}
export async function cloudSourceBackup(flagId: string, vendorId: string) {
  const { error } = await client().rpc('source_backup', { p_flag_id: flagId, p_vendor_id: vendorId });
  if (error) throw error;
}
export async function cloudApproveChangeOrder(flagId: string) {
  const { error } = await client().rpc('approve_change_order', { p_flag_id: flagId });
  if (error) throw error;
}
export async function cloudLogOutcome(flagId: string, recommend: boolean) {
  const { error } = await client().rpc('log_outcome', { p_flag_id: flagId, p_recommend: recommend });
  if (error) throw error;
}

export async function cloudMarkMilestonePaid(id: string) {
  const { error } = await client().from('milestones').update({ status: 'paid', due: 'Paid today' }).eq('id', id);
  if (error) throw error;
}

export async function cloudInsertInvite(i: Invite) {
  const { error } = await client().from('invites').insert({ id: i.id, email: i.email, role: i.role, sent_label: i.sent });
  if (error) throw error;
}
export async function cloudRemoveInvite(id: string) {
  const { error } = await client().from('invites').delete().eq('id', id);
  if (error) throw error;
}

export async function cloudNotifRead(id: string) {
  const { error } = await client().from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}
export async function cloudNotifsReadAll() {
  const { error } = await client().from('notifications').update({ read: true }).eq('read', false);
  if (error) throw error;
}

async function patchSettingsJson(field: 'notif' | 'defaults', key: string, value: unknown) {
  const db = client();
  const { data, error } = await db.from('settings').select(field).eq('id', 1).single();
  if (error) throw error;
  const merged = { ...(data as any)[field], [key]: value };
  const { error: upErr } = await db.from('settings').update({ [field]: merged }).eq('id', 1);
  if (upErr) throw upErr;
}
export async function cloudSetNotifPref(key: string, value: boolean | string) {
  return patchSettingsJson('notif', key, value);
}
export async function cloudSetDefault(key: string, value: boolean | string) {
  return patchSettingsJson('defaults', key, value);
}
export async function cloudUpdateProfile(patch: Partial<Pick<Settings, 'agencyName' | 'gst' | 'city' | 'address'>>) {
  const row: Record<string, string> = {};
  if (patch.agencyName !== undefined) row.agency_name = patch.agencyName;
  if (patch.gst !== undefined) row.gst = patch.gst;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.address !== undefined) row.address = patch.address;
  if (Object.keys(row).length === 0) return;
  const { error } = await client().from('settings').update(row).eq('id', 1);
  if (error) throw error;
}

export type RiskTier = 'High' | 'Medium' | 'Low';
export type RosterTier = 'Preferred' | 'Approved' | 'Backup';
export type Compliance = 'Verified' | 'Pending' | 'Expired' | 'Under Review';

export interface Vendor {
  id: string;
  name: string;
  category: string;
  risk: RiskTier;
  tier: RosterTier;
  compliance: Compliance;
  lastVerified: string;
  empanelled: string; // e.g. "Empanelled 2023 · 41 events"
  contact?: string;
  rate?: string;
  note?: string;
}

export interface Wedding {
  id: string;
  couple: string;
  ceremonies: number;
  month: string;
  budget: string;
  status: 'Planning' | 'Live' | 'Wrapped';
}

export const STAGES = [
  'Requirements',
  'Shortlist',
  'Quote & Negotiation',
  'Booking',
  'Pre-Event',
  'Payments',
  'Execution',
  'Settlement',
] as const;

export interface WorkOrder {
  id: string; // WO-2041
  weddingId: string;
  ceremony: string;
  vendorId: string;
  category: string;
  stage: number; // 1..8
  quote: number; // ₹
  flagged?: boolean;
  contingencyResolvedStage?: number; // stage completed via contingency (amber flag)
  note?: string;
}

export type FlagType = 'vendor_no_show' | 'extra_resources' | 'scope_change' | 'reconciliation';
export type Severity = 'high' | 'medium' | 'low';

export interface Flag {
  id: string; // FLG-1 / CE-114
  type: FlagType;
  severity: Severity;
  label: string; // "Vendor No-show"
  title: string;
  meta: string;
  woId: string;
  opened: string; // "Flagged 22 min ago"
  status: 'open' | 'resolved';
}

export type MilestoneStatus = 'paid' | 'due' | 'pending' | 'overdue';

export interface Milestone {
  id: string;
  woId: string;
  label: string;
  amount: number;
  due: string;
  status: MilestoneStatus;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Vendor Manager' | 'Finance';
  status: 'Active' | 'Invited';
}

export interface Invite {
  id: string;
  email: string;
  role: TeamMember['role'];
  sent: string;
}

export type NotifTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

export interface Notification {
  id: string;
  tone: NotifTone;
  title: string;
  meta: string;
  time: string;
  route: string;
  read: boolean;
}

export interface Toast {
  id: number;
  tone: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  desc?: string;
  route?: string;
}

export interface OnboardingDraft {
  step: number; // 1..5
  name: string;
  category: string;
  risk: RiskTier;
  overrideReason: string;
  docs: Record<string, boolean>;
  reference1: string;
  reference2: string;
  trialDone: boolean;
  baseRate: string;
  rateUnit: string;
  advancePct: string;
  terms: string;
  tier: RosterTier;
}

export interface Settings {
  agencyName: string;
  gst: string;
  city: string;
  address: string;
  notif: {
    highSeverity: true; // locked on — load-bearing rule
    mediumSeverity: boolean;
    payments: boolean;
    documents: boolean;
    onboarding: boolean;
    changeOrders: boolean;
    email: boolean;
    inApp: boolean;
    digest: string;
  };
  defaults: {
    riskTier: string;
    expiryWindow: string;
    backupCoverage: boolean;
    advance: string;
    penalty: string;
    structure: string;
  };
}

export interface Session {
  email: string;
  name: string;
  role: TeamMember['role'];
}

export type Theme = 'light' | 'dark' | 'system';

export interface AppState {
  session: Session | null;
  theme: Theme;
  vendors: Vendor[];
  weddings: Wedding[];
  workOrders: WorkOrder[];
  flags: Flag[];
  milestones: Milestone[];
  team: TeamMember[];
  invites: Invite[];
  notifications: Notification[];
  toasts: Toast[];
  draft: OnboardingDraft;
  settings: Settings;
}

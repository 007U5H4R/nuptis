import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp, useToast } from '../store';
import { Badge, Drawer, NextStepsBlock, SegmentedControl, SelectField, TextField, ToggleRow, initials } from '../components/ui';
import type { TeamMember, Theme } from '../types';

const TABS = ['workspace', 'team', 'notifications', 'vendor-defaults'] as const;
const TAB_LABELS: Record<string, string> = {
  workspace: 'Workspace',
  team: 'Team',
  notifications: 'Notifications',
  'vendor-defaults': 'Vendor defaults',
};

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') ?? 'workspace') as (typeof TABS)[number];
  const s = state.settings;

  const [form, setForm] = useState({ agencyName: s.agencyName, gst: s.gst, city: s.city, address: s.address });
  const [invite, setInvite] = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState<TeamMember['role']>('Vendor Manager');
  const [deact, setDeact] = useState('');

  const save = () => {
    dispatch({ type: 'SETTINGS_SET', patch: form });
    toast({ tone: 'success', title: 'Settings saved', desc: 'Workspace profile updated.' });
  };

  const themeLabel = state.theme === 'light' ? 'Light' : state.theme === 'dark' ? 'Dark' : 'System';

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Settings</h1>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => setForm({ agencyName: s.agencyName, gst: s.gst, city: s.city, address: s.address })}>Discard</button>
          <button className="btn btn-primary" onClick={save}>Save changes</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setParams(t === 'workspace' ? {} : { tab: t })}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'workspace' && (
        <div className="grid-2">
          <div className="col">
            <div className="card stack" style={{ gap: 12 }}>
              <div className="card-title">Agency profile</div>
              <TextField label="Agency name" value={form.agencyName} onChange={(v) => setForm({ ...form, agencyName: v })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <TextField label="GSTIN" value={form.gst} onChange={(v) => setForm({ ...form, gst: v })} />
                <TextField label="Home city" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              </div>
              <TextField label="Registered address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            </div>
          </div>
          <div className="col">
            <div className="card stack" style={{ gap: 10 }}>
              <div className="card-title">Appearance</div>
              <SegmentedControl
                value={themeLabel}
                options={['Light', 'Dark', 'System']}
                onChange={(v) => dispatch({ type: 'SET_THEME', theme: v.toLowerCase() as Theme })}
              />
              <div className="caption muted">Both themes render from the same design tokens — no separate dark styles to maintain.</div>
            </div>
            <div className="card stack" style={{ gap: 10 }}>
              <div className="card-title" style={{ color: 'var(--danger-text)' }}>Danger zone</div>
              <div className="caption muted">Deactivating hides the workspace from all members. Type <b>DEACTIVATE</b> to arm the button.</div>
              <TextField label="" value={deact} onChange={setDeact} placeholder="DEACTIVATE" />
              <button className="btn btn-danger" disabled={deact !== 'DEACTIVATE'} onClick={() => toast({ tone: 'danger', title: 'Workspace deactivation requested', desc: 'Demo build — no destructive action was performed.' })}>
                Deactivate workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div className="grid-2">
          <div className="col">
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="hstack" style={{ padding: '16px 20px 12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="card-title" style={{ marginBottom: 2 }}>Team &amp; roles</div>
                  <div className="caption muted">Roles gate what each member can approve — Finance signs off settlements, Vendor Managers own the roster.</div>
                </div>
                <button className="btn btn-primary right" onClick={() => setInvite(true)}>+ Invite member</button>
              </div>
              <table className="table">
                <thead><tr><th>Member</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>
                  {state.team.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="hstack">
                          <span className="avatar-s">{initials(m.name)}</span>
                          <span><div className="cell-main">{m.name}</div><div className="cell-sub">{m.email}</div></span>
                        </div>
                      </td>
                      <td>{m.role}</td>
                      <td><Badge label={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col">
            <div className="card stack" style={{ gap: 10 }}>
              <div className="card-title">Roles &amp; permissions</div>
              <div className="roles-grid">
                <Badge tone="neutral" label="Owner" /><span className="desc">Full access — billing, danger zone, every approval</span>
                <Badge tone="neutral" label="Vendor Manager" /><span className="desc">Runs weddings, onboarding and procurement day-to-day</span>
                <Badge tone="neutral" label="Finance" /><span className="desc">Signs settlements, payouts and penalty invocations</span>
              </div>
            </div>
            <div className="card stack" style={{ gap: 10 }}>
              <div className="card-title">Pending invites</div>
              {state.invites.length === 0 && <div className="caption muted">No pending invites.</div>}
              {state.invites.map((i) => (
                <div className="hstack" key={i.id}>
                  <span style={{ flex: 1 }}>
                    <div className="cell-main small">{i.email}</div>
                    <div className="caption muted">{i.sent} · {i.role}</div>
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => toast({ tone: 'success', title: 'Invite re-sent', desc: `${i.email} · ${i.role}` })}>Resend</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-text)' }} onClick={() => dispatch({ type: 'INVITE_REMOVE', id: i.id })}>Revoke</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="grid-2">
          <div className="col">
            <div className="card stack" style={{ gap: 14 }}>
              <div className="card-title">Contingency alerts</div>
              <ToggleRow label="High-severity contingency alerts" caption="Cannot be disabled — these gate day-of recovery" on disabled />
              <ToggleRow label="Medium-severity risk flags" caption="Scope changes, capacity warnings, expiring documents" on={s.notif.mediumSeverity} onChange={(v) => dispatch({ type: 'NOTIF_PREF_SET', key: 'mediumSeverity', value: v })} />
            </div>
            <div className="card stack" style={{ gap: 14 }}>
              <div className="card-title">Workflow notifications</div>
              <ToggleRow label="Payment milestones due" caption="Advance, pre-event and settlement reminders" on={s.notif.payments} onChange={(v) => dispatch({ type: 'NOTIF_PREF_SET', key: 'payments', value: v })} />
              <ToggleRow label="Document expiry warnings" caption="FSSAI, insurance, police verification — 30-day window" on={s.notif.documents} onChange={(v) => dispatch({ type: 'NOTIF_PREF_SET', key: 'documents', value: v })} />
              <ToggleRow label="Onboarding completions" caption="When a vendor is published to the roster" on={s.notif.onboarding} onChange={(v) => dispatch({ type: 'NOTIF_PREF_SET', key: 'onboarding', value: v })} />
              <ToggleRow label="Change-order approvals" caption="When a client signs off a revised scope" on={s.notif.changeOrders} onChange={(v) => dispatch({ type: 'NOTIF_PREF_SET', key: 'changeOrders', value: v })} />
            </div>
          </div>
          <div className="col">
            <div className="card stack" style={{ gap: 14 }}>
              <div className="card-title">Delivery</div>
              <ToggleRow label="Email" on={s.notif.email} onChange={(v) => dispatch({ type: 'NOTIF_PREF_SET', key: 'email', value: v })} />
              <ToggleRow label="In-app" on={s.notif.inApp} onChange={(v) => dispatch({ type: 'NOTIF_PREF_SET', key: 'inApp', value: v })} />
              <SelectField label="Daily digest" value={s.notif.digest} options={['8:00 AM · weekdays', '6:00 PM · daily', 'Off']} onChange={(v) => dispatch({ type: 'NOTIF_PREF_SET', key: 'digest', value: v })} />
            </div>
            <div className="guidance">
              <span className="g-tag">GUIDANCE</span>
              <p>Delivery follows roles — Finance always receives settlement and penalty alerts, regardless of the preferences above. Owners always receive danger-zone events.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'vendor-defaults' && (
        <div className="grid-2">
          <div className="col">
            <div className="card stack" style={{ gap: 12 }}>
              <div className="card-title">Onboarding defaults</div>
              <SelectField label="Default risk tier" value={s.defaults.riskTier} options={['By category (recommended)', 'Always High', 'Always Medium']} onChange={(v) => dispatch({ type: 'DEFAULT_SET', key: 'riskTier', value: v })} />
              <SelectField label="Document expiry warning window" value={s.defaults.expiryWindow} options={['30 days before expiry', '45 days before expiry', '60 days before expiry']} onChange={(v) => dispatch({ type: 'DEFAULT_SET', key: 'expiryWindow', value: v })} />
              <ToggleRow label="Require backup-tier coverage" caption="High-risk categories must keep at least one Backup-tier vendor" on={s.defaults.backupCoverage} onChange={(v) => dispatch({ type: 'DEFAULT_SET', key: 'backupCoverage', value: v })} />
            </div>
            <div className="card stack" style={{ gap: 12 }}>
              <div className="card-title">Procurement defaults</div>
              <SelectField label="Advance payment" value={s.defaults.advance} options={['30% on booking confirmation', '25% on booking confirmation', '40% on booking confirmation']} onChange={(v) => dispatch({ type: 'DEFAULT_SET', key: 'advance', value: v })} />
              <SelectField label="Penalty clause" value={s.defaults.penalty} options={['2× advance on vendor no-show', '1.5× advance on vendor no-show', 'None']} onChange={(v) => dispatch({ type: 'DEFAULT_SET', key: 'penalty', value: v })} />
              <SelectField label="Payment structure" value={s.defaults.structure} options={['Milestone-based (advance · pre-event · settlement)', '50/50 (booking · settlement)']} onChange={(v) => dispatch({ type: 'DEFAULT_SET', key: 'structure', value: v })} />
            </div>
          </div>
          <div className="col">
            <div className="guidance">
              <span className="g-tag">GUIDANCE</span>
              <p>These defaults pre-fill every new vendor intake and work order. Editing them never rewrites live work orders — only new ones.</p>
            </div>
            <div className="card stack" style={{ gap: 4 }}>
              <div className="card-title">Where defaults apply</div>
              <div className="kv-grid">
                <span className="k">Onboarding</span><span className="v">Step 1 risk tier · Step 2 document checklist</span>
                <span className="k">Procurement</span><span className="v">Stage 3 quotes · Stage 4 booking terms · Stage 6 payments</span>
                <span className="k">Contingency</span><span className="v">Penalty maths when a backup is activated</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {invite && (
        <Drawer
          title="Invite team member"
          desc="They’ll get an email with a sign-in link. Access begins the moment they accept — their role controls what they can approve."
          onClose={() => setInvite(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setInvite(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invEmail)}
                onClick={() => {
                  dispatch({ type: 'INVITE_ADD', invite: { id: 'inv-' + Date.now(), email: invEmail, role: invRole, sent: 'Invited just now' } });
                  setInvite(false);
                  setInvEmail('');
                }}
              >
                Send invite
              </button>
            </>
          }
        >
          <TextField label="Email address" value={invEmail} onChange={setInvEmail} placeholder="name@merakiweddings.in" />
          <SelectField label="Role" value={invRole} options={['Vendor Manager', 'Finance', 'Owner']} onChange={(v) => setInvRole(v as TeamMember['role'])} />
          <div className="block">
            <div className="b-head">Role permissions</div>
            <div className="b-row"><span className="lbl">Owner</span><span>full access, billing, danger zone</span></div>
            <div className="b-row"><span className="lbl">Vendor Manager</span><span>runs weddings, onboarding, procurement</span></div>
            <div className="b-row"><span className="lbl">Finance</span><span>signs settlements, payouts, penalties</span></div>
          </div>
          <NextStepsBlock items={[`Email invite sent to ${invEmail || 'the address above'}`, 'Access starts the moment the invite is accepted', 'Role can be changed anytime from the Team tab']} />
        </Drawer>
      )}
    </div>
  );
}

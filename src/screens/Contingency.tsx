import { useState } from 'react';
import { useApp } from '../store';
import { Badge, Drawer, EmptyState, ImpactBlock, NextStepsBlock, SelectField, TextField } from '../components/ui';
import { fmtINR } from '../seed';
import type { Flag, FlagType, Severity } from '../types';

type Open = { flag: Flag } | null;

const TYPE_LABELS: Record<string, FlagType> = {
  'Vendor no-show': 'vendor_no_show',
  'Extra resources needed': 'extra_resources',
  'Client scope change': 'scope_change',
  'Post-incident reconciliation': 'reconciliation',
};
const FLAG_LABEL: Record<FlagType, string> = {
  vendor_no_show: 'Vendor No-show',
  extra_resources: 'Extra Resources',
  scope_change: 'Scope Change',
  reconciliation: 'Reconciliation',
};
const DEFAULT_SEV: Record<FlagType, Severity> = {
  vendor_no_show: 'high',
  extra_resources: 'medium',
  scope_change: 'medium',
  reconciliation: 'low',
};

export default function Contingency() {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState<Open>(null);
  const [backupChoice, setBackupChoice] = useState('v-swaad');
  const [recommend, setRecommend] = useState(true);
  const [manual, setManual] = useState(false);
  const [mWo, setMWo] = useState('');
  const [mType, setMType] = useState('Vendor no-show');
  const [mSev, setMSev] = useState<string>('High');
  const [mTitle, setMTitle] = useState('');
  const [mMeta, setMMeta] = useState('');

  const active = state.flags.filter((f) => f.status === 'open');
  const resolved = state.flags.filter((f) => f.status === 'resolved');

  const ACTION_LABEL: Record<Flag['type'], string> = {
    vendor_no_show: 'Activate Backup',
    extra_resources: 'Source Backup',
    scope_change: 'Review Change Order',
    reconciliation: 'Log Outcome',
  };
  const ACTION_CLASS: Record<Flag['type'], string> = {
    vendor_no_show: 'btn-danger',
    extra_resources: 'btn-danger',
    scope_change: 'btn-primary',
    reconciliation: 'btn-secondary',
  };

  const close = () => setOpen(null);
  const flag = open?.flag;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Contingency Panel</h1>
          <div className="muted small">
            {active.length} active risk flags · every action here draws from pre-vetted Backup-tier vendors — never a cold search
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => { setMWo(state.workOrders.find((w) => !w.flagged)?.id ?? state.workOrders[0]?.id ?? ''); setManual(true); }}>
            Log risk manually
          </button>
        </div>
      </div>

      {active.length > 0 && <div className="overline" style={{ marginBottom: 10 }}>Active risks — sorted by severity, then event proximity</div>}

      {active.map((f) => (
        <div className="alert-row" key={f.id}>
          <span className={`sev-bar ${f.severity}`} />
          <div style={{ flex: 1 }}>
            <div className="hstack">
              <span className={`alert-label ${f.severity}`}>{f.label}</span>
              <span className="alert-title">{f.title}</span>
            </div>
            <div className="alert-meta">{f.meta}</div>
          </div>
          <div className="alert-side">
            <button className={`btn btn-sm ${ACTION_CLASS[f.type]}`} onClick={() => setOpen({ flag: f })}>
              {ACTION_LABEL[f.type]}
            </button>
            <span className="alert-time">{f.opened}</span>
          </div>
        </div>
      ))}

      {active.length === 0 && (
        <div className="card">
          <EmptyState
            icon="✓"
            title="0 active risk flags"
            desc="Every high-risk work order currently has a live backup vendor and current compliance. This screen being boring is the system working."
          />
        </div>
      )}

      {resolved.length > 0 && (
        <>
          <div className="overline" style={{ margin: '18px 0 10px' }}>Resolved</div>
          {resolved.map((f) => (
            <div className="alert-row" key={f.id} style={{ opacity: 0.72 }}>
              <span className="sev-bar low" />
              <div style={{ flex: 1 }}>
                <div className="hstack">
                  <span className="alert-label low">{f.label}</span>
                  <span className="alert-title">{f.title}</span>
                </div>
                <div className="alert-meta">{f.meta}</div>
              </div>
              <div className="alert-side"><Badge tone="success" label="Resolved" /></div>
            </div>
          ))}
        </>
      )}

      <p className="caption muted" style={{ marginTop: 14 }}>
        Clicking a primary action opens a confirmation drawer listing the specific Backup-tier vendors available for that category — visibly pre-vetted, never sourced cold. Resolved flags mark their work-order stage with the amber contingency flag.
      </p>

      {/* ---------- drawers ---------- */}
      {flag?.type === 'vendor_no_show' && (
        <Drawer
          title="Activate Backup — Caterer"
          desc="Replacing Annapurna Caterers on WO-2041 · Sharma × Mehta, Sangeet · 13 Nov · 350 guests · locked quote ₹8,40,000. Both options below were vetted at onboarding and hold current FSSAI + insurance."
          onClose={close}
          actions={
            <>
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { dispatch({ type: 'ACTIVATE_BACKUP', flagId: flag.id, backupVendorId: backupChoice }); close(); }}>
                Confirm Activation
              </button>
            </>
          }
        >
          {[
            { id: 'v-swaad', name: 'Swaad Sweets & Mithai', tier: 'Backup', meta: 'Compliance current · rate fit 92% · 22 km from venue · can serve 350 with 1 live counter (reduced scope)' },
            { id: 'v-rasoi', name: 'Rasoi Royale', tier: 'Approved', meta: 'Compliance current · rate fit 85% · already serving Rao × Iyer that evening — split-crew risk' },
          ].map((o) => (
            <button key={o.id} className={`option-card ${backupChoice === o.id ? 'selected' : ''}`} onClick={() => setBackupChoice(o.id)}>
              <div className="option-title">{o.name} <Badge label={o.tier} /></div>
              <div className="option-meta">{o.meta}</div>
              {backupChoice === o.id && <div className="small" style={{ color: 'var(--link)', marginTop: 4 }}>● Selected</div>}
            </button>
          ))}
          <div className="amber-note">
            On confirmation: WO-2041 reassigns to the selected backup, the risk flag closes, a ContingencyEvent (trigger: no_show) is logged, and the penalty clause (2× advance = {fmtINR(504000)}) is invoked against Annapurna Caterers.
          </div>
          <ImpactBlock rows={[['Penalty invoked vs Annapurna', fmtINR(504000)], ['Reissued work order', backupChoice === 'v-swaad' ? 'Swaad Sweets & Mithai' : 'Rasoi Royale'], ['SLA status', 'Re-locked · 13 Nov']]} />
          <NextStepsBlock items={['Client + both vendors notified instantly', 'Finance reissues WO-2041 to the selected backup', 'Sangeet stage marked contingency-resolved (amber flag)']} />
        </Drawer>
      )}

      {flag?.type === 'extra_resources' && (
        <Drawer
          title="Source Backup — Decor"
          desc="Sourcing additional decor support for WO-2051 · Kapoor × Singh, Mehndi · 1 Dec. Rangoli Decor Co. is at capacity for 2 extra flower walls. The option below was vetted at onboarding and holds current compliance."
          onClose={close}
          actions={
            <>
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { dispatch({ type: 'SOURCE_BACKUP', flagId: flag.id, vendorId: 'v-saanjh' }); close(); }}>
                Confirm Sourcing
              </button>
            </>
          }
        >
          <div className="option-card selected">
            <div className="option-title">Saanjh Decor Studio <Badge label="Backup" /></div>
            <div className="option-meta">Compliance current · rate fit 88% · 9 km from venue · can deliver 2 additional flower walls within timeline</div>
            <div className="small" style={{ color: 'var(--link)', marginTop: 4 }}>● Selected</div>
          </div>
          <div className="amber-note">
            On confirmation: WO-2051 gets an addendum work order for Saanjh Decor Studio, the risk flag closes, and a ContingencyEvent (trigger: extra_resources) is logged. No penalty applies — this adds capacity, it does not replace a vendor.
          </div>
          <ImpactBlock rows={[['Addendum work order', 'WO-2051-A · Saanjh Decor'], ['Added capacity', '2 flower walls · 1 Dec'], ['Penalty', 'None — capacity add']]} />
          <NextStepsBlock items={['Addendum WO-2051-A issued to Saanjh Decor Studio', 'Rangoli Decor scope unchanged — no penalty applies', 'Mehndi stage keeps its original 1 Dec timeline']} />
        </Drawer>
      )}

      {flag?.type === 'scope_change' && (
        <Drawer
          title="Review Change Order — Catering"
          desc="Kapoor × Singh, Reception · 4 Dec · Rasoi Royale. Client has requested a guest count increase from the original scope. Review the delta below before approving — Finance reprices automatically on approval."
          onClose={close}
          actions={
            <>
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { dispatch({ type: 'APPROVE_CO', flagId: flag.id }); close(); }}>
                Approve Change Order
              </button>
            </>
          }
        >
          <div className="option-card selected" style={{ cursor: 'default' }}>
            <div className="option-title">Original scope <Badge label="Backup" tone="neutral" /></div>
            <div className="option-meta">350 guests · quote ₹8,40,000 · 4 live counters · signed 2 Oct</div>
            <div className="small" style={{ color: 'var(--link)', marginTop: 4 }}>As booked</div>
          </div>
          <div className="option-card" style={{ cursor: 'default' }}>
            <div className="option-title">Revised scope <Badge tone="warning" label="Pending" /></div>
            <div className="option-meta">500 guests (+150) · quote ₹10,50,000 (+₹2,10,000) · 6 live counters needed · awaiting sign-off</div>
          </div>
          <div className="amber-note">
            On approval: WO-2052 is repriced to ₹10,50,000, an amended work order is issued to Rasoi Royale, and the client is notified. No penalty applies — this is a scope change, not a vendor failure.
          </div>
          <ImpactBlock rows={[['Quote delta', '₹8,40,000 → ₹10,50,000'], ['Client sign-off', 'Pending · client notified'], ['Finance', 'Auto-reprice on approval']]} />
          <NextStepsBlock items={['Amended work order sent for client e-sign', 'Finance locks revised quote ₹10,50,000', 'Reception stage updated — vendor unchanged']} />
        </Drawer>
      )}

      {manual && (
        <Drawer
          title="Log risk manually"
          desc="For anything the Day-of monitor didn’t catch automatically — venue issues, weather calls, a vendor phoning in a problem. The flag lands on this panel sorted by severity."
          onClose={() => setManual(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setManual(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={mTitle.trim().length < 4 || !mWo}
                onClick={() => {
                  const type = TYPE_LABELS[mType];
                  dispatch({
                    type: 'FLAG_ADD',
                    flag: {
                      id: 'FLG-' + Date.now(),
                      type,
                      severity: mSev.toLowerCase() as Severity,
                      label: FLAG_LABEL[type],
                      title: mTitle.trim(),
                      meta: mMeta.trim() || `${mWo} · logged manually`,
                      woId: mWo,
                      opened: 'Flagged just now',
                      status: 'open',
                    },
                  });
                  setManual(false);
                  setMTitle('');
                  setMMeta('');
                }}
              >
                Open risk flag
              </button>
            </>
          }
        >
          <SelectField label="Work order" value={mWo} options={state.workOrders.map((w) => w.id)} onChange={setMWo} />
          {(() => {
            const w = state.workOrders.find((x) => x.id === mWo);
            const v = w && state.vendors.find((x) => x.id === w.vendorId);
            return w ? <div className="caption muted" style={{ marginTop: -8 }}>{w.ceremony} · {v?.name} · stage {w.stage}/8</div> : null;
          })()}
          <SelectField
            label="Trigger type"
            value={mType}
            options={Object.keys(TYPE_LABELS)}
            onChange={(v) => {
              setMType(v);
              const sev = DEFAULT_SEV[TYPE_LABELS[v]];
              setMSev(sev.charAt(0).toUpperCase() + sev.slice(1));
            }}
          />
          <SelectField label="Severity" value={mSev} options={['High', 'Medium', 'Low']} onChange={setMSev} />
          <TextField label="What happened?" value={mTitle} onChange={setMTitle} placeholder="e.g. Generator failure risk at outdoor mandap — Sharma × Mehta" />
          <TextField label="Details (optional)" value={mMeta} onChange={setMMeta} placeholder="Context the responder needs — counts, timings, who reported it" />
          <NextStepsBlock
            items={[
              'Flag opens on this panel, sorted by severity then event proximity',
              'The work order is marked contingency-flagged on the Procurement Board',
              'High-severity flags alert the whole team instantly — that alert cannot be muted',
            ]}
          />
        </Drawer>
      )}

      {flag?.type === 'reconciliation' && (
        <Drawer
          title="Log Outcome — Reconciliation"
          desc="CE-114 · Rao × Iyer, Reception · 28 Oct. Backup activation for this work order has closed. Confirm the penalty settlement and rate the backup vendor’s performance before closing this flag."
          onClose={close}
          actions={
            <>
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { dispatch({ type: 'LOG_OUTCOME', flagId: flag.id, recommend }); close(); }}>
                Log Outcome
              </button>
            </>
          }
        >
          <div className="option-card selected" style={{ cursor: 'default' }}>
            <div className="option-title">Swaad Sweets &amp; Mithai <Badge tone="info" label="Activated" /></div>
            <div className="option-meta">Served as backup for WO-2019 · delivered full scope on schedule · no client complaints logged</div>
          </div>
          <label className="checkrow">
            <input type="checkbox" checked={recommend} onChange={(e) => setRecommend(e.target.checked)} />
            Recommend for future backup activations
          </label>
          <div className="amber-note">
            On confirmation: CE-114 closes, the ₹84,000 penalty against Annapurna Caterers is marked settled with Finance, and Swaad Sweets &amp; Mithai’s performance score updates — feeding back into Onboarding re-certification.
          </div>
          <ImpactBlock rows={[['Penalty settled', '₹84,000 · via Finance'], ['Vendor score', `Swaad +1 · future backup: ${recommend ? 'Yes' : 'No'}`], ['Risk flag', 'CE-114 closed']]} />
          <NextStepsBlock items={['Penalty ₹84,000 settled via Finance', 'Swaad score update feeds Onboarding re-certification', 'CE-114 archived to vendor history']} />
        </Drawer>
      )}
    </div>
  );
}

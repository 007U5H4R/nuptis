import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { StageStepper } from '../components/Stepper';
import { SelectField, TextField } from '../components/ui';
import { CATEGORY_RISK, DOCS_BY_RISK } from '../seed';
import type { RiskTier, RosterTier } from '../types';

const STEPS = ['Category & Risk', 'Documents', 'References', 'Rate Card', 'Contract'] as const;

const GUIDE: Record<number, string> = {
  1: 'Risk tier drives everything downstream — the document checklist, verification depth and whether Backup-tier coverage is required. Caterers and pyrotechnics default to High risk; override only with a reason.',
  2: 'High-risk vendors cannot progress to the roster without FSSAI, liability insurance and police verification. Documents inside their expiry warning window block publication.',
  3: 'Two independent references, or one reference plus a paid trial. For Backup-tier candidates, note their response-time commitment — it is what the Contingency Panel relies on.',
  4: 'Lock the rate card now: advance %, unit pricing and penalty terms. Work orders inherit these terms — renegotiating later resets trust to zero.',
  5: 'Completing this step publishes the vendor to the live roster. Preferred tier is earned after 5 clean events; new vendors start as Approved or Backup.',
};

export default function Onboarding() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const d = state.draft;
  const set = (patch: Partial<typeof d>) => dispatch({ type: 'DRAFT_SET', patch });

  const docs = DOCS_BY_RISK[d.risk] ?? [];
  const allDocs = docs.every((k) => d.docs[k]);
  const autoRisk = CATEGORY_RISK[d.category] ?? 'Medium';
  const overridden = d.risk !== autoRisk;

  const canContinue =
    d.step === 1 ? d.name.trim().length > 1 && (!overridden || d.overrideReason.trim().length > 3)
    : d.step === 2 ? allDocs
    : d.step === 3 ? d.reference1.trim().length > 1 && (d.reference2.trim().length > 1 || d.trialDone)
    : d.step === 4 ? d.baseRate.trim().length > 0
    : true;

  const publish = () => {
    const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    dispatch({
      type: 'PUBLISH_VENDOR',
      vendor: {
        id: 'v-' + slug,
        name: d.name,
        category: d.category,
        risk: d.risk,
        tier: d.tier,
        compliance: 'Pending',
        lastVerified: 'Today',
        empanelled: 'Empanelled 2026 · new',
        rate: d.baseRate ? `${d.baseRate} ${d.rateUnit}` : undefined,
      },
    });
    navigate('/');
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Vendor Onboarding</h1>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'DRAFT_RESET' })}>Discard intake</button>
        </div>
      </div>

      <StageStepper labels={STEPS} current={d.step} onJump={(n) => n < d.step && set({ step: n })} />

      <div className="stage-grid">
        <div className="card stack" style={{ gap: 14 }}>
          {d.step === 1 && (
            <>
              <div className="card-title">Step 1 — Category &amp; risk tier</div>
              <TextField label="Vendor name" value={d.name} onChange={(v) => set({ name: v })} placeholder="e.g. Annapurna Caterers" />
              <SelectField label="Category" value={d.category} options={Object.keys(CATEGORY_RISK)} onChange={(v) => set({ category: v, risk: CATEGORY_RISK[v] })} />
              <SelectField label={`Risk tier (auto: ${autoRisk})`} value={d.risk} options={['High', 'Medium', 'Low']} onChange={(v) => set({ risk: v as RiskTier })} />
              {overridden && (
                <TextField label="Override reason (required)" value={d.overrideReason} onChange={(v) => set({ overrideReason: v })} placeholder="Why does this vendor deviate from the category default?" />
              )}
            </>
          )}
          {d.step === 2 && (
            <>
              <div className="card-title">Step 2 — Document checklist <span className="muted small">({d.risk} risk)</span></div>
              {docs.map((doc) => (
                <label key={doc} className="checkrow">
                  <input type="checkbox" checked={!!d.docs[doc]} onChange={(e) => set({ docs: { ...d.docs, [doc]: e.target.checked } })} />
                  {doc}
                </label>
              ))}
              {!allDocs && <div className="caption muted">All documents are required before this intake can progress.</div>}
            </>
          )}
          {d.step === 3 && (
            <>
              <div className="card-title">Step 3 — References &amp; trial</div>
              <TextField label="Reference 1" value={d.reference1} onChange={(v) => set({ reference1: v })} placeholder="Agency / planner + contact" />
              <TextField label="Reference 2" value={d.reference2} onChange={(v) => set({ reference2: v })} placeholder="Optional if a trial is completed" />
              <label className="checkrow">
                <input type="checkbox" checked={d.trialDone} onChange={(e) => set({ trialDone: e.target.checked })} />
                Paid trial completed (waives second reference)
              </label>
            </>
          )}
          {d.step === 4 && (
            <>
              <div className="card-title">Step 4 — Rate card &amp; terms</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <TextField label="Base rate (₹)" value={d.baseRate} onChange={(v) => set({ baseRate: v })} placeholder="2,400" />
                <SelectField label="Unit" value={d.rateUnit} options={['per plate', 'per setup', 'per event', 'per hour']} onChange={(v) => set({ rateUnit: v })} />
              </div>
              <SelectField label="Advance" value={d.advancePct} options={['30%', '25%', '40%']} onChange={(v) => set({ advancePct: v })} />
              <SelectField label="Payment terms" value={d.terms} options={['Milestone-based (advance · pre-event · settlement)', '50/50 (booking · settlement)']} onChange={(v) => set({ terms: v })} />
            </>
          )}
          {d.step === 5 && (
            <>
              <div className="card-title">Step 5 — Contract &amp; empanelment</div>
              <div className="block">
                <div className="b-head">Intake summary</div>
                <div className="b-row"><span className="lbl">Vendor</span><span className="val">{d.name || '—'}</span></div>
                <div className="b-row"><span className="lbl">Category / risk</span><span className="val">{d.category} · {d.risk}</span></div>
                <div className="b-row"><span className="lbl">Documents</span><span className="val">{docs.filter((k) => d.docs[k]).length}/{docs.length} verified</span></div>
                <div className="b-row"><span className="lbl">Rate</span><span className="val">{d.baseRate ? `₹${d.baseRate} ${d.rateUnit}` : '—'}</span></div>
                <div className="b-row"><span className="lbl">Terms</span><span className="val">{d.advancePct} advance · milestones</span></div>
              </div>
              <SelectField label="Empanelment tier" value={d.tier} options={['Approved', 'Backup']} onChange={(v) => set({ tier: v as RosterTier })} />
              <div className="caption muted">Preferred tier is earned after 5 clean events — it cannot be assigned at intake.</div>
            </>
          )}

          <div className="hstack" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
            {d.step > 1 && <button className="btn btn-secondary" onClick={() => set({ step: d.step - 1 })}>Back</button>}
            {d.step < 5 && <button className="btn btn-primary" disabled={!canContinue} onClick={() => set({ step: d.step + 1 })}>Continue</button>}
            {d.step === 5 && <button className="btn btn-primary" onClick={publish}>Complete &amp; publish to roster</button>}
          </div>
        </div>

        <div className="guidance">
          <span className="g-tag">GUIDANCE</span>
          <p>{GUIDE[d.step]}</p>
        </div>
      </div>
    </div>
  );
}

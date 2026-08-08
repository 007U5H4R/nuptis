import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store';
import { StageStepper } from '../components/Stepper';
import { Badge } from '../components/ui';
import { fmtINR } from '../seed';
import { STAGES } from '../types';

const GUIDE: string[] = [
  'Define the requirement precisely — guest count, service windows, power/space needs. Vague requirements are the root cause of day-of scope disputes.',
  'Shortlist only from the live roster. Preferred tier first; Approved as alternates. Never shortlist an unvetted vendor under time pressure.',
  'Quotes are compared against the vendor’s locked rate card. A quote more than 10% off rate card needs a written justification before negotiation.',
  'Booking locks the quote and fires the advance milestone (default 30%). The penalty clause — 2× advance on no-show — is embedded in the work order here.',
  'Pre-event checks: reconfirm logistics, headcount and delivery windows 7 days out. High-risk categories get a call check 48h before.',
  'Milestone payments clear here. Pre-event tranches must be settled before day-of; anything overdue blocks the Day-Of stage.',
  'Day-of execution — the monitor flags no-shows and capacity gaps in real time. Flags route to the Contingency Panel, never handled ad hoc.',
  'Settlement closes the loop: reconcile deliverables, release the final tranche, and log vendor performance back into the roster record.',
];

export default function StageView() {
  const { woId } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const wo = state.workOrders.find((w) => w.id === woId);
  if (!wo) {
    return (
      <div>
        <p className="muted">Work order not found.</p>
        <Link to="/procurement">← Back to Procurement Board</Link>
      </div>
    );
  }
  const vendor = state.vendors.find((v) => v.id === wo.vendorId);
  const wedding = state.weddings.find((x) => x.id === wo.weddingId);
  const milestones = state.milestones.filter((m) => m.woId === wo.id);
  const stageName = STAGES[wo.stage - 1];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="small"><Link to="/procurement">Procurement Board</Link> <span className="muted">/ {wo.id}</span></div>
          <h1 className="page-title">{wo.id} — {wo.ceremony}</h1>
          <div className="muted small">{wedding?.couple} · {vendor?.name} · {fmtINR(wo.quote)}</div>
        </div>
        <div className="page-actions">
          {wo.flagged && <Badge tone="warning" label="Contingency flagged" />}
          {wo.stage < 8 ? (
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'ADVANCE_STAGE', woId: wo.id })}>
              Mark “{stageName}” complete
            </button>
          ) : (
            <Badge tone="success" label="Settled" />
          )}
        </div>
      </div>

      <StageStepper
        labels={STAGES}
        current={wo.stage}
        resolvedStage={wo.contingencyResolvedStage}
        onJump={(n) => dispatch({ type: 'SET_STAGE', woId: wo.id, stage: n })}
      />

      {wo.flagged && (
        <div className="banner warning">
          <span>⚠</span>
          <span>An open risk flag is attached to this work order — resolve it through the Contingency Panel, never inline.</span>
          <button className="btn btn-ghost btn-sm link" onClick={() => navigate('/contingency')}>Open Contingency Panel</button>
        </div>
      )}

      <div className="stage-grid">
        <div className="card stack" style={{ gap: 12 }}>
          <div className="card-title">Key fields — Stage {wo.stage} · {stageName}</div>
          <div className="block">
            <div className="b-row"><span className="lbl">Wedding</span><span className="val">{wedding?.couple} · {wo.ceremony}</span></div>
            <div className="b-row"><span className="lbl">Vendor</span><span className="val">{vendor?.name} ({vendor?.tier})</span></div>
            <div className="b-row"><span className="lbl">Locked quote</span><span className="val">{fmtINR(wo.quote)}</span></div>
            <div className="b-row"><span className="lbl">Compliance</span><span className="val">{vendor?.compliance}</span></div>
            {wo.contingencyResolvedStage && (
              <div className="b-row"><span className="lbl">Stage {wo.contingencyResolvedStage}</span><span className="val" style={{ color: 'var(--warning-text)' }}>Resolved via Contingency ⚑</span></div>
            )}
          </div>
          {wo.note && <div className="amber-note">{wo.note}</div>}
          {milestones.length > 0 && (
            <div className="block">
              <div className="b-head">Milestones on this order</div>
              {milestones.map((m) => (
                <div className="b-row" key={m.id}>
                  <span className="lbl">{m.label}</span>
                  <span className="val">{fmtINR(m.amount)}</span>
                  <Badge label={m.status} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="guidance">
          <span className="g-tag">GUIDANCE</span>
          <p>{GUIDE[wo.stage - 1]}</p>
        </div>
      </div>
    </div>
  );
}

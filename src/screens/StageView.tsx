import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store';
import { StageStepper } from '../components/Stepper';
import { Badge } from '../components/ui';
import { fmtINR } from '../seed';
import { STAGES } from '../types';
import type { Milestone, Vendor, WorkOrder } from '../types';

const GUIDE: string[] = [
  'Define the requirement precisely — guest count, service windows, power/space needs. Vague requirements are the root cause of day-of scope disputes.',
  'Shortlist only from the live roster. Preferred tier first; Approved as alternates. Never shortlist an unvetted vendor under time pressure.',
  'Quotes are compared against the vendor’s locked rate card. A quote more than 10% off rate card needs a written justification before negotiation.',
  'Booking locks the quote and fires the advance milestone (default 30%). The penalty clause — 2× advance on no-show — is embedded in the work order here.',
  'Pre-event checks: reconfirm logistics, headcount and delivery windows 7 days out. High-risk categories get a call check 48h before.',
  'Milestone payments clear here. Pre-event tranches must be settled before execution day; anything overdue blocks the Execution stage.',
  'Execution day — the monitor flags no-shows and capacity gaps in real time. Flags route to the Contingency Panel, never handled ad hoc.',
  'Settlement closes the loop: reconcile deliverables, release the final tranche, and log vendor performance back into the roster record.',
];

/** Stage-specific key fields — each stage surfaces what matters at that point. */
function stageFields(stage: number, wo: WorkOrder, vendor: Vendor | undefined, ms: Milestone[], categoryCount: number): [string, string][] {
  const paid = ms.filter((m) => m.status === 'paid').reduce((a, m) => a + m.amount, 0);
  const owed = ms.filter((m) => m.status === 'due' || m.status === 'overdue').reduce((a, m) => a + m.amount, 0);
  const advance = ms.find((m) => m.label.startsWith('Advance'));
  const settlement = ms.find((m) => m.label.startsWith('Settlement'));
  switch (stage) {
    case 1:
      return [
        ['Requirement brief', wo.note ?? `${wo.category} for ${wo.ceremony}`],
        ['Requirement owner', 'Rohan Mehta (Vendor Manager)'],
        ['Needed before', 'Shortlist can open'],
      ];
    case 2:
      return [
        ['Shortlist source', 'Live roster only — never a cold search'],
        [`${wo.category} vendors on roster`, `${categoryCount} available`],
        ['Tier order', 'Preferred first · Approved as alternates'],
      ];
    case 3:
      return [
        ['Rate-card reference', vendor?.rate ?? 'On file'],
        ['Quote under review', fmtINR(wo.quote)],
        ['Variance rule', '>10% off rate card needs written justification'],
      ];
    case 4:
      return [
        ['Quote locked at', fmtINR(wo.quote)],
        ['Advance milestone', advance ? `${fmtINR(advance.amount)} · ${advance.status}` : '30% fires on booking'],
        ['Penalty clause', '2× advance on vendor no-show (embedded in WO)'],
      ];
    case 5:
      return [
        ['Reconfirm window', '7 days out — logistics, headcount, delivery slots'],
        ['Call check', vendor?.risk === 'High' ? 'Required 48h before (high-risk category)' : 'Not required for this risk tier'],
        ['Documents', vendor ? `${vendor.compliance} · last verified ${vendor.lastVerified}` : '—'],
      ];
    case 6:
      return [
        ['Cleared so far', fmtINR(paid)],
        ['Outstanding', owed > 0 ? fmtINR(owed) : 'Nothing due'],
        ['Blocker rule', 'Overdue tranches block the Execution stage'],
      ];
    case 7:
      return [
        ['Day-of monitor', 'Armed — no-shows and capacity gaps flag in real time'],
        ['Escalation path', 'Flags route to the Contingency Panel, never ad hoc'],
        ['On-site contact', vendor?.contact ?? 'Via Vendor Manager'],
      ];
    default:
      return [
        ['Deliverables', 'Reconcile against the locked scope before sign-off'],
        ['Final tranche', settlement ? `${fmtINR(settlement.amount)} · ${settlement.status}` : 'Released after reconciliation'],
        ['Performance log', 'Feeds the vendor’s roster record and re-certification'],
      ];
  }
}

export default function StageView() {
  const { woId } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const wo = state.workOrders.find((w) => w.id === woId);
  const [viewStage, setViewStage] = useState(wo?.stage ?? 1);

  useEffect(() => {
    if (wo) setViewStage(wo.stage);
  }, [wo?.id, wo?.stage]);

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
  const categoryCount = state.vendors.filter((v) => v.category === wo.category).length;
  const currentName = STAGES[wo.stage - 1];
  const viewingName = STAGES[viewStage - 1];
  const reviewing = viewStage !== wo.stage;

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
              Mark “{currentName}” complete
            </button>
          ) : (
            <Badge tone="success" label="Settled" />
          )}
        </div>
      </div>

      <StageStepper
        labels={STAGES}
        current={wo.stage}
        viewing={viewStage}
        clickableUpTo={wo.stage}
        resolvedStage={wo.contingencyResolvedStage}
        onJump={setViewStage}
      />

      {reviewing && (
        <div className="banner" style={{ background: 'var(--subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <span>👁</span>
          <span>Reviewing the completed “{viewingName}” stage — actions always apply to the current stage ({currentName}).</span>
          <button className="btn btn-ghost btn-sm link" onClick={() => setViewStage(wo.stage)}>Back to current stage</button>
        </div>
      )}

      {wo.flagged && !reviewing && (
        <div className="banner warning">
          <span>⚠</span>
          <span>An open risk flag is attached to this work order — resolve it through the Contingency Panel, never inline.</span>
          <button className="btn btn-ghost btn-sm link" onClick={() => navigate('/contingency')}>Open Contingency Panel</button>
        </div>
      )}

      <div className="stage-grid">
        <div className="card stack" style={{ gap: 12 }}>
          <div className="card-title">Key fields — Stage {viewStage} · {viewingName}</div>
          <div className="block">
            <div className="b-row"><span className="lbl">Wedding</span><span className="val">{wedding?.couple} · {wo.ceremony}</span></div>
            <div className="b-row"><span className="lbl">Vendor</span><span className="val">{vendor?.name} ({vendor?.tier})</span></div>
            {stageFields(viewStage, wo, vendor, milestones, categoryCount).map(([lbl, val]) => (
              <div className="b-row" key={lbl}><span className="lbl">{lbl}</span><span className="val">{val}</span></div>
            ))}
            {wo.contingencyResolvedStage === viewStage && (
              <div className="b-row"><span className="lbl">Resolution</span><span className="val" style={{ color: 'var(--warning-text)' }}>Resolved via Contingency ⚑</span></div>
            )}
          </div>
          {wo.note && !reviewing && <div className="amber-note">{wo.note}</div>}
          {(viewStage === 6 || viewStage === 8) && milestones.length > 0 && (
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
          <p>{GUIDE[viewStage - 1]}</p>
        </div>
      </div>
    </div>
  );
}

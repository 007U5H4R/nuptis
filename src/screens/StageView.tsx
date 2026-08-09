import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store';
import { StageStepper } from '../components/Stepper';
import { Badge, SelectField, TextField, ToggleRow } from '../components/ui';
import { fmtINR } from '../seed';
import { STAGES } from '../types';
import type { Milestone, Vendor, WorkOrder, WorkOrderDetails } from '../types';

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

/** Per-stage completion rule — mirrors the Figma "Blocked-stage" alternate state:
 *  Mark-Complete stays disabled with an inline reason until the stage's required fields are filled. */
function blockReason(stage: number, wo: WorkOrder, ms: Milestone[]): string | null {
  const d = wo.details;
  switch (stage) {
    case 1:
      return d.guestCount?.trim() && d.mustHaves?.trim() ? null : 'Enter guest count and must-haves before this stage can complete.';
    case 2:
      return (d.shortlist?.length ?? 0) > 0 ? null : 'Shortlist at least one roster vendor before this stage can complete.';
    case 3:
      return wo.quote > 0 && d.quoteLocked ? null : 'Lock the final quote before this stage can complete.';
    case 4: {
      const hasAdvance = ms.some((m) => m.label.startsWith('Advance'));
      return hasAdvance && d.workOrderIssued ? null : 'Log the advance milestone and mark the work order issued before this stage can complete.';
    }
    case 5:
      return d.tastingApproved && d.loadIn?.trim() && d.loadOut?.trim() ? null : 'Approve the tasting/mock-up and set load-in / load-out times before this stage can complete.';
    case 6: {
      const overdue = ms.some((m) => m.status === 'overdue');
      return overdue ? 'Clear the overdue tranche below before Execution can open.' : null;
    }
    case 7:
      return d.vendorArrived && d.setupConfirmed ? null : 'Confirm vendor arrival and setup before this stage can complete.';
    default:
      return null;
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
  const roster = state.vendors.filter((v) => v.category === wo.category);
  const currentName = STAGES[wo.stage - 1];
  const viewingName = STAGES[viewStage - 1];
  const reviewing = viewStage !== wo.stage;
  const d: WorkOrderDetails = wo.details;

  const patch = (p: Partial<WorkOrderDetails>) => dispatch({ type: 'WO_DETAILS_SET', woId: wo.id, patch: p });
  const reason = blockReason(wo.stage, wo, milestones);

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
          {!reviewing && wo.stage < 8 && (
            <button
              className="btn btn-primary"
              disabled={!!reason}
              title={reason ?? undefined}
              onClick={() => dispatch({ type: 'ADVANCE_STAGE', woId: wo.id })}
            >
              Mark “{currentName}” complete
            </button>
          )}
          {wo.stage === 8 && <Badge tone={d.closed ? 'success' : 'neutral'} label={d.closed ? 'Closed' : 'Settled'} />}
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

      {!reviewing && reason && wo.stage < 8 && (
        <div className="banner warning">
          <span>⚠</span>
          <span>{reason}</span>
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
            {wo.contingencyResolvedStage === viewStage && (
              <div className="b-row"><span className="lbl">Resolution</span><span className="val" style={{ color: 'var(--warning-text)' }}>Resolved via Contingency ⚑</span></div>
            )}
          </div>

          <StageFields
            stage={viewStage}
            wo={wo}
            vendor={vendor}
            roster={roster}
            milestones={milestones}
            readOnly={reviewing}
            patch={patch}
            dispatch={dispatch}
          />

          {wo.note && !reviewing && <div className="amber-note">{wo.note}</div>}
        </div>
        <div className="guidance">
          <span className="g-tag">GUIDANCE</span>
          <p>{GUIDE[viewStage - 1]}</p>
        </div>
      </div>
    </div>
  );
}

/** The editable "Key Fields" panel content — one branch per Figma stage (9-16). */
function StageFields(props: {
  stage: number;
  wo: WorkOrder;
  vendor: Vendor | undefined;
  roster: Vendor[];
  milestones: Milestone[];
  readOnly: boolean;
  patch: (p: Partial<WorkOrderDetails>) => void;
  dispatch: ReturnType<typeof useApp>['dispatch'];
}) {
  const { stage, wo, vendor, roster, milestones, readOnly, patch, dispatch } = props;
  const d = wo.details;

  switch (stage) {
    case 1:
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <TextField label="Guest count" value={d.guestCount ?? ''} onChange={(v) => !readOnly && patch({ guestCount: v })} placeholder="350" disabled={readOnly} />
            <SelectField
              label="Budget band"
              value={d.budgetBand ?? 'Under ₹1L'}
              options={['Under ₹1L', '₹1L–2L', '₹1.5L–2L', '₹2.5L–3.5L', '₹5L–8L', '₹8L–12L', '₹12L+']}
              onChange={(v) => !readOnly && patch({ budgetBand: v })}
              disabled={readOnly}
            />
          </div>
          <TextField label="Must-haves" value={d.mustHaves ?? ''} onChange={(v) => !readOnly && patch({ mustHaves: v })} placeholder="Live counters, dietary needs, service windows…" disabled={readOnly} />
        </>
      );

    case 2: {
      const shortlist = d.shortlist ?? [];
      return (
        <>
          <div className="caption muted">Shortlist source: live roster only — never a cold search.</div>
          <div className="block">
            {roster.length === 0 && <div className="b-row"><span className="val muted">No {wo.category} vendors on the roster yet.</span></div>}
            {roster.map((v) => (
              <label key={v.id} className="checkrow">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={shortlist.includes(v.id)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...shortlist, v.id] : shortlist.filter((id) => id !== v.id);
                    patch({ shortlist: next });
                  }}
                />
                {v.name} <span className="muted small">· {v.tier} tier</span>
              </label>
            ))}
          </div>
          <ToggleRow label="Shared with client" caption="Client has seen this shortlist" on={!!d.sharedWithClient} disabled={readOnly} onChange={(v) => patch({ sharedWithClient: v })} />
        </>
      );
    }

    case 3:
      return (
        <>
          <TextField
            label="Quote under review (₹)"
            value={String(wo.quote)}
            type="number"
            onChange={(v) => !readOnly && dispatch({ type: 'WO_QUOTE_SET', woId: wo.id, quote: parseInt(v, 10) || 0 })}
            disabled={readOnly}
          />
          <div className="caption muted" style={{ marginTop: -8 }}>Rate-card reference: {vendor?.rate ?? 'On file'} · variance over 10% needs written justification</div>
          <TextField label="Negotiation notes" value={d.negotiationNotes ?? ''} onChange={(v) => !readOnly && patch({ negotiationNotes: v })} placeholder="What changed from the initial quote…" disabled={readOnly} />
          <label className="checkrow">
            <input type="checkbox" disabled={readOnly} checked={!!d.quoteLocked} onChange={(e) => patch({ quoteLocked: e.target.checked })} />
            Final quote locked
          </label>
        </>
      );

    case 4: {
      const advance = milestones.find((m) => m.label.startsWith('Advance'));
      return (
        <>
          <SelectField label="Advance %" value={d.advancePct ?? '30%'} options={['20%', '25%', '30%']} onChange={(v) => !readOnly && patch({ advancePct: v })} disabled={readOnly} />
          {advance ? (
            <div className="block">
              <div className="b-row"><span className="lbl">Advance milestone</span><span className="val">{fmtINR(advance.amount)} · {advance.status}</span></div>
            </div>
          ) : (
            !readOnly && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const pct = parseInt(d.advancePct ?? '30', 10) / 100;
                  dispatch({
                    type: 'MILESTONE_ADD',
                    milestone: { id: 'm-' + wo.id + '-adv-' + Date.now(), woId: wo.id, label: `Advance (${d.advancePct ?? '30%'})`, amount: Math.round(wo.quote * pct), due: 'Logged just now', status: 'due' },
                  });
                }}
              >
                Log advance milestone
              </button>
            )
          )}
          <div className="caption muted">Penalty clause: 2× advance on vendor no-show (embedded in this work order).</div>
          <label className="checkrow">
            <input type="checkbox" disabled={readOnly} checked={!!d.workOrderIssued} onChange={(e) => patch({ workOrderIssued: e.target.checked })} />
            Signed work order issued to vendor
          </label>
        </>
      );
    }

    case 5:
      return (
        <>
          <label className="checkrow">
            <input type="checkbox" disabled={readOnly} checked={!!d.tastingApproved} onChange={(e) => patch({ tastingApproved: e.target.checked })} />
            Tasting / decor mock-up approved
          </label>
          <TextField label="Run-of-show reference" value={d.runOfShow ?? ''} onChange={(v) => !readOnly && patch({ runOfShow: v })} placeholder="e.g. Sangeet-RunOfShow.pdf" disabled={readOnly} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <TextField label="Load-in time" value={d.loadIn ?? ''} onChange={(v) => !readOnly && patch({ loadIn: v })} placeholder="4:00 PM" disabled={readOnly} />
            <TextField label="Load-out time" value={d.loadOut ?? ''} onChange={(v) => !readOnly && patch({ loadOut: v })} placeholder="11:30 PM" disabled={readOnly} />
          </div>
          <div className="caption muted">{vendor?.risk === 'High' ? 'High-risk category — call check required 48h before.' : 'Call check not required for this risk tier.'}</div>
        </>
      );

    case 6: {
      const paid = milestones.filter((m) => m.status === 'paid').reduce((a, m) => a + m.amount, 0);
      const owed = milestones.filter((m) => m.status === 'due' || m.status === 'overdue').reduce((a, m) => a + m.amount, 0);
      return (
        <>
          <div className="block">
            <div className="b-row"><span className="lbl">Cleared so far</span><span className="val">{fmtINR(paid)}</span></div>
            <div className="b-row"><span className="lbl">Outstanding</span><span className="val">{owed > 0 ? fmtINR(owed) : 'Nothing due'}</span></div>
          </div>
          {milestones.length === 0 && <div className="caption muted">No milestones logged on this work order yet.</div>}
          {milestones.map((m) => (
            <div className="b-row" key={m.id}>
              <span className="lbl">{m.label}</span>
              <span className="val">{fmtINR(m.amount)}</span>
              <Badge label={m.status} />
              {!readOnly && m.status !== 'paid' && (
                <button className="btn btn-ghost btn-sm link" onClick={() => dispatch({ type: 'MILESTONE_PAY', id: m.id })}>Mark paid</button>
              )}
            </div>
          ))}
          {!readOnly && !milestones.some((m) => m.label.startsWith('Pre-event')) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => dispatch({ type: 'MILESTONE_ADD', milestone: { id: 'm-' + wo.id + '-pre-' + Date.now(), woId: wo.id, label: 'Pre-event (30%)', amount: Math.round(wo.quote * 0.3), due: 'Logged just now', status: 'due' } })}
            >
              + Log pre-event tranche
            </button>
          )}
        </>
      );
    }

    case 7:
      return (
        <>
          <label className="checkrow">
            <input type="checkbox" disabled={readOnly} checked={!!d.vendorArrived} onChange={(e) => patch({ vendorArrived: e.target.checked })} />
            Vendor arrival confirmed
          </label>
          <label className="checkrow">
            <input type="checkbox" disabled={readOnly} checked={!!d.setupConfirmed} onChange={(e) => patch({ setupConfirmed: e.target.checked })} />
            Setup confirmed on-site
          </label>
          <label className="checkrow">
            <input type="checkbox" disabled={readOnly} checked={!!d.photoProof} onChange={(e) => patch({ photoProof: e.target.checked })} />
            Photo-proof received
          </label>
          <TextField label="Execution note" value={d.executionNote ?? ''} onChange={(v) => !readOnly && patch({ executionNote: v })} placeholder="On-ground notes for the record…" disabled={readOnly} />
          <div className="caption muted">On-site contact: {vendor?.contact ?? 'via Vendor Manager'} · flags route to the Contingency Panel, never handled ad hoc.</div>
        </>
      );

    default: {
      const settlement = milestones.find((m) => m.label.startsWith('Settlement'));
      const paidSoFar = milestones.filter((m) => m.id !== settlement?.id).reduce((a, m) => a + (m.status === 'paid' ? m.amount : 0), 0);
      const remaining = Math.max(0, wo.quote - paidSoFar);
      const canClose = !!settlement && settlement.status === 'paid' && !!d.vendorRating;
      return (
        <>
          {settlement ? (
            <div className="block">
              <div className="b-row"><span className="lbl">Final tranche</span><span className="val">{fmtINR(settlement.amount)} · {settlement.status}</span></div>
              {!readOnly && settlement.status !== 'paid' && (
                <div className="b-row"><button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'MILESTONE_PAY', id: settlement.id })}>Release final tranche</button></div>
              )}
            </div>
          ) : (
            !readOnly && !d.closed && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => dispatch({ type: 'MILESTONE_ADD', milestone: { id: 'm-' + wo.id + '-set-' + Date.now(), woId: wo.id, label: 'Settlement (final)', amount: remaining, due: 'Logged just now', status: 'due' } })}
              >
                Log final tranche ({fmtINR(remaining)})
              </button>
            )
          )}
          <SelectField label="Vendor rating" value={d.vendorRating ?? ''} options={['', '5 — Excellent', '4 — Good', '3 — Fair', '2 — Poor', '1 — Unacceptable']} onChange={(v) => !readOnly && patch({ vendorRating: v })} disabled={readOnly || !!d.closed} />
          <TextField label="Performance note" value={d.performanceNote ?? ''} onChange={(v) => !readOnly && patch({ performanceNote: v })} placeholder="Feeds the vendor's roster record and re-certification…" disabled={readOnly || !!d.closed} />
          {!readOnly && !d.closed && (
            <button className="btn btn-primary" disabled={!canClose} title={canClose ? undefined : 'Release the final tranche and set a vendor rating before closing.'} onClick={() => patch({ closed: true })}>
              Close work order
            </button>
          )}
          {d.closed && <div className="caption muted">Closed — deliverables reconciled, vendor performance logged to the roster record.</div>}
        </>
      );
    }
  }
}

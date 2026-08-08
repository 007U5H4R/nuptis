import { useApp } from '../store';
import { Badge } from '../components/ui';
import { fmtINR } from '../seed';

export default function Payments() {
  const { state, dispatch } = useApp();
  const sum = (f: (s: string) => boolean) => state.milestones.filter((m) => f(m.status)).reduce((a, m) => a + m.amount, 0);

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Payment Tracker</h1>
      </div>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card kpi"><div className="kpi-label">Collected</div><div className="kpi-value">{fmtINR(sum((s) => s === 'paid'))}</div><div className="kpi-sub">across all work orders</div></div>
        <div className="card kpi"><div className="kpi-label">Due</div><div className="kpi-value">{fmtINR(sum((s) => s === 'due'))}</div><div className="kpi-sub">this week</div></div>
        <div className="card kpi"><div className="kpi-label">Overdue / disputed</div><div className="kpi-value" style={{ color: 'var(--danger-text)' }}>{fmtINR(sum((s) => s === 'overdue'))}</div><div className="kpi-sub">needs Finance sign-off</div></div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead><tr><th>Work order</th><th>Milestone</th><th>Amount</th><th>Due</th><th>Status</th><th /></tr></thead>
          <tbody>
            {state.milestones.map((m) => {
              const wo = state.workOrders.find((w) => w.id === m.woId);
              const vendor = wo && state.vendors.find((v) => v.id === wo.vendorId);
              return (
                <tr key={m.id}>
                  <td><div className="cell-main">{m.woId}</div><div className="cell-sub">{vendor?.name} · {wo?.ceremony}</div></td>
                  <td>{m.label}</td>
                  <td>{fmtINR(m.amount)}</td>
                  <td className="muted">{m.due}</td>
                  <td><Badge label={m.status} /></td>
                  <td>
                    {(m.status === 'due' || m.status === 'overdue') && (
                      <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'MILESTONE_PAY', id: m.id })}>Mark paid</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="caption muted" style={{ marginTop: 10 }}>
        Milestone structure follows workspace defaults: 30% advance on booking · pre-event tranche before day-of · settlement after reconciliation. Penalty recoveries appear here when the Contingency Panel invokes a clause.
      </p>
    </div>
  );
}

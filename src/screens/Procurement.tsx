import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { MiniStepper } from '../components/Stepper';
import { Badge } from '../components/ui';
import { fmtINR } from '../seed';
import { STAGES } from '../types';

export default function Procurement() {
  const { state } = useApp();
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Procurement Board</h1>
        <div className="page-actions">
          <span className="muted small" style={{ alignSelf: 'center' }}>
            {state.workOrders.length} work orders · rows deep-link to each order’s current stage
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr><th>Work order</th><th>Wedding · ceremony</th><th>Vendor</th><th>Quote</th><th>Progress</th><th>Stage</th><th /></tr>
          </thead>
          <tbody>
            {state.workOrders.map((w) => {
              const vendor = state.vendors.find((v) => v.id === w.vendorId);
              const wedding = state.weddings.find((x) => x.id === w.weddingId);
              return (
                <tr key={w.id} className="clickable" onClick={() => navigate(`/procurement/${w.id}`)}>
                  <td>
                    <div className="cell-main">{w.id}</div>
                    {w.note && <div className="cell-sub">{w.note}</div>}
                  </td>
                  <td>
                    <div>{wedding?.couple}</div>
                    <div className="cell-sub">{w.ceremony}</div>
                  </td>
                  <td>
                    <div>{vendor?.name}</div>
                    <div className="cell-sub">{w.category}</div>
                  </td>
                  <td>{fmtINR(w.quote)}</td>
                  <td><MiniStepper total={8} current={w.stage} amberStage={w.contingencyResolvedStage} /></td>
                  <td>
                    {w.flagged
                      ? <Badge tone="warning" label="Contingency" />
                      : <span className="small muted">{w.stage}/8 · {STAGES[w.stage - 1]}</span>}
                  </td>
                  <td><span className="muted">›</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Badge, Drawer } from '../components/ui';
import type { Vendor } from '../types';

const CATEGORIES = ['Caterer', 'Decor', 'Photography', 'Priest / Rituals', 'Transport', 'Beauty & Attire', 'Pyrotechnics'];

export default function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [cats, setCats] = useState<string[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [tiers, setTiers] = useState<string[]>([]);
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [view, setView] = useState<Vendor | null>(null);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const vendors = useMemo(
    () =>
      state.vendors.filter(
        (v) =>
          (cats.length === 0 || cats.includes(v.category)) &&
          (risks.length === 0 || risks.includes(v.risk)) &&
          (tiers.length === 0 || tiers.includes(v.tier)) &&
          (!issuesOnly || v.compliance !== 'Verified'),
      ),
    [state.vendors, cats, risks, tiers, issuesOnly],
  );

  const pendingVerifs = state.vendors.filter((v) => v.compliance === 'Pending' || v.compliance === 'Under Review').length;
  const highRiskCats = [...new Set(state.vendors.filter((v) => v.risk === 'High').map((v) => v.category))];
  const covered = highRiskCats.filter((c) => state.vendors.some((v) => v.category === c && v.tier === 'Backup')).length;
  const coverage = highRiskCats.length ? Math.round((covered / highRiskCats.length) * 100) : 100;

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Vendor Roster Dashboard</h1>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => setIssuesOnly(true)}>Review compliance</button>
          <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>+ Add Vendor</button>
        </div>
      </div>

      <div className="banner warning">
        <span>⚠</span>
        <span>
          3 vendor documents expire within 30 days — FSSAI (Annapurna Caterers), liability insurance (Agni Fireworks), police verification (Shaadi Wheels).
        </span>
        <button className="btn btn-ghost btn-sm link" onClick={() => setIssuesOnly(true)}>Review compliance</button>
      </div>

      <div className="kpi-row">
        <div className="card kpi"><div className="kpi-label">Active vendors</div><div className="kpi-value">{state.vendors.length}</div><div className="kpi-sub">12 added this quarter</div></div>
        <div className="card kpi"><div className="kpi-label">Pending verifications</div><div className="kpi-value">{pendingVerifs}</div><div className="kpi-sub">{state.vendors.filter((v) => v.risk === 'High' && v.compliance !== 'Verified').length} high-risk tier</div></div>
        <div className="card kpi"><div className="kpi-label">Compliance expiring</div><div className="kpi-value">3</div><div className="kpi-sub">within 30 days</div></div>
        <div className="card kpi"><div className="kpi-label">Backup-tier coverage</div><div className="kpi-value">{coverage}%</div><div className="kpi-sub">of high-risk categories</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'start' }}>
        <aside className="card" style={{ padding: 16 }}>
          <div className="overline" style={{ marginBottom: 8 }}>Category</div>
          {CATEGORIES.map((c) => (
            <label key={c} className="hstack small" style={{ padding: '3px 0' }}>
              <input type="checkbox" checked={cats.includes(c)} onChange={() => toggle(cats, setCats, c)} /> {c}
            </label>
          ))}
          <div className="overline" style={{ margin: '12px 0 8px' }}>Risk tier</div>
          {['High', 'Medium', 'Low'].map((r) => (
            <label key={r} className="hstack small" style={{ padding: '3px 0' }}>
              <input type="checkbox" checked={risks.includes(r)} onChange={() => toggle(risks, setRisks, r)} /> {r}
            </label>
          ))}
          <div className="overline" style={{ margin: '12px 0 8px' }}>Roster tier</div>
          {['Preferred', 'Approved', 'Backup'].map((t) => (
            <label key={t} className="hstack small" style={{ padding: '3px 0' }}>
              <input type="checkbox" checked={tiers.includes(t)} onChange={() => toggle(tiers, setTiers, t)} /> {t}
            </label>
          ))}
          {(cats.length || risks.length || tiers.length || issuesOnly) ? (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => { setCats([]); setRisks([]); setTiers([]); setIssuesOnly(false); }}>
              Clear filters
            </button>
          ) : null}
        </aside>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr><th>Vendor</th><th>Category</th><th>Risk tier</th><th>Roster tier</th><th>Compliance</th><th>Last verified</th><th /></tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td><div className="cell-main">{v.name}</div><div className="cell-sub">{v.empanelled}</div></td>
                  <td>{v.category}</td>
                  <td><Badge label={v.risk} /></td>
                  <td><Badge label={v.tier} /></td>
                  <td><Badge label={v.compliance} /></td>
                  <td className="muted">{v.lastVerified}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setView(v)}>View</button></td>
                </tr>
              ))}
              {vendors.length === 0 && (
                <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 28 }}>No vendors match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {view && (
        <Drawer
          title={view.name}
          desc={`${view.category} · ${view.empanelled}`}
          onClose={() => setView(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setView(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setView(null); navigate('/procurement'); }}>View work orders</button>
            </>
          }
        >
          <div className="block">
            <div className="b-head">Vendor record</div>
            <div className="b-row"><span className="lbl">Risk tier</span><span className="val">{view.risk}</span></div>
            <div className="b-row"><span className="lbl">Roster tier</span><span className="val">{view.tier}</span></div>
            <div className="b-row"><span className="lbl">Compliance</span><span className="val">{view.compliance}</span></div>
            <div className="b-row"><span className="lbl">Last verified</span><span className="val">{view.lastVerified}</span></div>
            {view.rate && <div className="b-row"><span className="lbl">Rate card</span><span className="val">{view.rate}</span></div>}
            {view.contact && <div className="b-row"><span className="lbl">Contact</span><span className="val">{view.contact}</span></div>}
          </div>
          {view.note && <div className="amber-note">{view.note}</div>}
        </Drawer>
      )}
    </div>
  );
}

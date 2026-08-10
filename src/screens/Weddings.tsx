import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Badge, SelectField, TextField } from '../components/ui';

export default function Weddings() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [couple, setCouple] = useState('');
  const [month, setMonth] = useState('Jan 2027');
  const [ceremonies, setCeremonies] = useState('3');
  const [budget, setBudget] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (couple.trim().length < 3) return;
    dispatch({
      type: 'WEDDING_ADD',
      wedding: {
        id: 'w-' + couple.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        couple: couple.trim(),
        ceremonies: parseInt(ceremonies, 10) || 1,
        month,
        budget: budget ? `₹${budget}` : '—',
        status: 'Planning',
      },
    });
    setCouple(''); setBudget('');
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Weddings</h1>
      </div>
      <div className="grid-2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead><tr><th>Couple</th><th>Ceremonies</th><th>Month</th><th>Budget</th><th>Status</th><th>Work orders</th></tr></thead>
            <tbody>
              {state.weddings.map((w) => {
                const wos = state.workOrders.filter((x) => x.weddingId === w.id);
                return (
                  <tr key={w.id} className="clickable" onClick={() => navigate('/procurement')}>
                    <td data-label="Couple" className="cell-main">{w.couple}</td>
                    <td data-label="Ceremonies">{w.ceremonies}</td>
                    <td data-label="Month">{w.month}</td>
                    <td data-label="Budget">{w.budget}</td>
                    <td data-label="Status"><Badge label={w.status} /></td>
                    <td data-label="Work orders" className="muted">{wos.length} open</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <form className="card stack" style={{ gap: 12 }} onSubmit={add}>
          <div className="card-title">New wedding setup</div>
          <TextField label="Couple" value={couple} onChange={setCouple} placeholder="e.g. Verma × Joshi" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <SelectField label="Month" value={month} options={['Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027']} onChange={setMonth} />
            <SelectField label="Ceremonies" value={ceremonies} options={['1', '2', '3', '4', '5', '6']} onChange={setCeremonies} />
          </div>
          <TextField label="Budget (₹)" value={budget} onChange={setBudget} placeholder="45,00,000" />
          <button className="btn btn-primary" type="submit" disabled={couple.trim().length < 3}>Create wedding</button>
          <div className="caption muted">Creating a wedding opens its procurement pipeline — work orders are raised per ceremony from the board.</div>
        </form>
      </div>
    </div>
  );
}

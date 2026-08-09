import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { MiniStepper } from '../components/Stepper';
import { Badge, Drawer, NextStepsBlock, SelectField, TextField } from '../components/ui';
import { CATEGORY_RISK, fmtINR } from '../seed';
import { STAGES } from '../types';

export default function Procurement() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [weddingId, setWeddingId] = useState('');
  const [ceremony, setCeremony] = useState('');
  const [category, setCategory] = useState('Caterer');
  const [vendorName, setVendorName] = useState('');
  const [quote, setQuote] = useState('');

  const candidates = useMemo(
    () => state.vendors.filter((v) => v.category === category),
    [state.vendors, category],
  );

  const nextWoId = () => {
    const nums = state.workOrders.map((w) => parseInt(w.id.replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    return 'WO-' + (Math.max(2000, ...nums) + 1);
  };

  const openDrawer = () => {
    setWeddingId(state.weddings[0]?.id ?? '');
    setCategory('Caterer');
    setVendorName('');
    setCeremony('');
    setQuote('');
    setOpen(true);
  };

  const quoteNum = parseInt(quote.replace(/[^0-9]/g, ''), 10) || 0;
  const vendor = candidates.find((v) => v.name === vendorName) ?? candidates[0];
  const canRaise = Boolean(weddingId && ceremony.trim().length >= 3 && vendor && quoteNum > 0);

  const raise = () => {
    if (!canRaise || !vendor) return;
    const id = nextWoId();
    dispatch({
      type: 'WO_ADD',
      wo: { id, weddingId, ceremony: ceremony.trim(), vendorId: vendor.id, category, stage: 1, quote: quoteNum, details: {} },
    });
    setOpen(false);
    navigate(`/procurement/${id}`);
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Procurement Board</h1>
        <div className="page-actions">
          <span className="muted small" style={{ alignSelf: 'center' }}>
            {state.workOrders.length} work orders · rows deep-link to each order’s current stage
          </span>
          <button className="btn btn-primary" onClick={openDrawer}>+ New work order</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr><th>Work order</th><th>Wedding · ceremony</th><th>Vendor</th><th>Quote</th><th>Progress</th><th>Stage</th><th /></tr>
          </thead>
          <tbody>
            {state.workOrders.map((w) => {
              const v = state.vendors.find((x) => x.id === w.vendorId);
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
                    <div>{v?.name}</div>
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

      {open && (
        <Drawer
          title="New work order"
          desc="One work order per vendor per ceremony. It opens at Requirements and advances only via “Mark stage complete” — the advance milestone fires automatically at Booking."
          onClose={() => setOpen(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!canRaise} onClick={raise}>Raise work order</button>
            </>
          }
        >
          <SelectField
            label="Wedding"
            value={state.weddings.find((w) => w.id === weddingId)?.couple ?? ''}
            options={state.weddings.map((w) => w.couple)}
            onChange={(couple) => setWeddingId(state.weddings.find((w) => w.couple === couple)?.id ?? '')}
          />
          <TextField label="Ceremony" value={ceremony} onChange={setCeremony} placeholder="e.g. Sangeet, Baraat, Reception" />
          <SelectField
            label="Category"
            value={category}
            options={Object.keys(CATEGORY_RISK)}
            onChange={(c) => { setCategory(c); setVendorName(''); }}
          />
          <SelectField
            label="Vendor (from live roster)"
            value={vendorName || (candidates[0]?.name ?? '')}
            options={candidates.map((v) => `${v.name}`)}
            onChange={setVendorName}
          />
          {candidates.length === 0 ? (
            <div className="amber-note">No {category} vendors on the roster — onboard one first. Work orders can only draw from the live roster, never a cold search.</div>
          ) : (
            <div className="caption muted" style={{ marginTop: -8 }}>
              {(vendor ?? candidates[0]) && `${(vendor ?? candidates[0]).tier} tier · ${(vendor ?? candidates[0]).risk} risk · ${(vendor ?? candidates[0]).compliance}`}
            </div>
          )}
          <TextField label="Quote (₹)" value={quote} onChange={setQuote} placeholder="1,20,000" />
          <NextStepsBlock
            items={[
              'Work order opens at Stage 1 · Requirements',
              'Advance milestone (per workspace defaults) fires at Booking',
              'It appears on this board and in ⌘K search immediately',
            ]}
          />
        </Drawer>
      )}
    </div>
  );
}

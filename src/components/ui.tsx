import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';

/* ---------- icons (16px, stroke, currentColor) ---------- */
const PATHS: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  'user-check': (
    <>
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a4 4 0 0 1 4-4h6" />
      <polyline points="16 11 18 13 22 9" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </>
  ),
  clipboard: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </>
  ),
  alert: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </>
  ),
  sliders: (
    <>
      <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
};

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

/* ---------- badge ---------- */
const TONE_MAP: Record<string, string> = {
  Verified: 'b-success', Active: 'b-success', Paid: 'b-success', paid: 'b-success', Preferred: 'b-success', Live: 'b-success', Wrapped: 'b-neutral',
  Pending: 'b-warning', 'Under Review': 'b-warning', Invited: 'b-warning', due: 'b-warning', Planning: 'b-info',
  Expired: 'b-danger', overdue: 'b-danger',
  Approved: 'b-neutral', Backup: 'b-neutral', pending: 'b-neutral',
  High: 'b-danger', Medium: 'b-warning', Low: 'b-neutral',
};
export function Badge({ label, tone }: { label: string; tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }) {
  const cls = tone ? `b-${tone}` : TONE_MAP[label] ?? 'b-neutral';
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ---------- fields ---------- */
export function TextField(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string; disabled?: boolean }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      <input type={props.type ?? 'text'} value={props.value} placeholder={props.placeholder} disabled={props.disabled} onChange={(e) => props.onChange(e.target.value)} />
      {props.error && <span className="err">{props.error}</span>}
    </div>
  );
}
export function SelectField(props: { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      <select value={props.value} disabled={props.disabled} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export function ToggleRow(props: { label: string; caption?: string; on: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="toggle-row">
      <div style={{ flex: 1 }}>
        <div className="t-label">{props.label}</div>
        {props.caption && <div className="t-cap">{props.caption}</div>}
      </div>
      <button
        type="button"
        className={`switch ${props.on ? 'on' : ''}`}
        disabled={props.disabled}
        aria-pressed={props.on}
        onClick={() => props.onChange?.(!props.on)}
      />
    </div>
  );
}

export function SegmentedControl(props: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="segmented" role="tablist">
      {props.options.map((o) => (
        <button key={o} className={`seg-btn ${props.value === o ? 'on' : ''}`} onClick={() => props.onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

/* ---------- drawer ---------- */
export function Drawer(props: { title: string; desc?: string; onClose: () => void; children: React.ReactNode; actions?: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && props.onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props.onClose]);
  return (
    <>
      <div className="scrim" onClick={props.onClose} />
      <aside className="drawer" role="dialog" aria-label={props.title}>
        <div className="drawer-title">{props.title}</div>
        {props.desc && <div className="drawer-desc">{props.desc}</div>}
        {props.children}
        <div className="drawer-spacer" />
        {props.actions && <div className="drawer-actions">{props.actions}</div>}
      </aside>
    </>
  );
}

/* ---------- info blocks (Impact Summary / Next Steps from the Figma drawers) ---------- */
export function ImpactBlock({ rows }: { rows: [string, string][] }) {
  return (
    <div className="block">
      <div className="b-head">Impact summary</div>
      {rows.map(([lbl, val]) => (
        <div className="b-row" key={lbl}>
          <span className="lbl">{lbl}</span>
          <span className="val">{val}</span>
        </div>
      ))}
    </div>
  );
}
export function NextStepsBlock({ items }: { items: string[] }) {
  return (
    <div className="block">
      <div className="b-head">What happens on confirm</div>
      {items.map((it) => (
        <div className="b-row" key={it}>
          <span className="check">✓</span>
          <span>{it}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- empty state ---------- */
export function EmptyState(props: { icon: string; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-ico">{props.icon}</div>
      <h3>{props.title}</h3>
      <p>{props.desc}</p>
      {props.children}
    </div>
  );
}

/* ---------- toasts ---------- */
export function ToastHost() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  useEffect(() => {
    if (state.toasts.length === 0) return;
    const t = state.toasts[0];
    const timer = setTimeout(() => dispatch({ type: 'TOAST_DISMISS', id: t.id }), 5200);
    return () => clearTimeout(timer);
  }, [state.toasts, dispatch]);
  return (
    <div className="toast-host">
      {state.toasts.slice(-3).map((t) => (
        <button
          key={t.id}
          className={`toast ${t.tone}`}
          onClick={() => {
            dispatch({ type: 'TOAST_DISMISS', id: t.id });
            if (t.route) navigate(t.route);
          }}
        >
          <span className="t-ico" />
          <span>
            <div className="t-title">{t.title}</div>
            {t.desc && <div className="t-desc">{t.desc}</div>}
          </span>
        </button>
      ))}
    </div>
  );
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

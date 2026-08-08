import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Assistant } from './Assistant';
import { Icon, ToastHost, initials } from './ui';

const NAV = [
  { to: '/', label: 'Roster Dashboard', icon: 'grid', end: true },
  { to: '/onboarding', label: 'Vendor Onboarding', icon: 'user-check' },
  { to: '/weddings', label: 'Weddings', icon: 'calendar' },
  { to: '/procurement', label: 'Procurement Board', icon: 'clipboard' },
  { to: '/contingency', label: 'Contingency Panel', icon: 'alert' },
  { to: '/payments', label: 'Payment Tracker', icon: 'card' },
];

export default function Shell() {
  const { state, dispatch, refresh } = useApp();
  const navigate = useNavigate();
  const [pop, setPop] = useState<'search' | 'notif' | 'profile' | null>(null);
  const [assistOpen, setAssistOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPop((p) => (p === 'search' ? null : 'search'));
      }
      if (e.key === 'Escape') setPop(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const unread = state.notifications.some((n) => !n.read);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => s.toLowerCase().includes(q);
    const vendors = state.vendors.filter((v) => !q || match(v.name) || match(v.category)).slice(0, 3);
    const weddings = state.weddings.filter((w) => !q || match(w.couple)).slice(0, 3);
    const wos = state.workOrders.filter((w) => !q || match(w.id) || match(w.ceremony) || match(w.category)).slice(0, 4);
    return { vendors, weddings, wos };
  }, [query, state]);

  const go = (route: string) => {
    setPop(null);
    setQuery('');
    navigate(route);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="side-brand">NUPTIS</div>
        <nav className="side-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end as boolean | undefined} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><Icon name={n.icon} size={15} /></span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-bottom side-nav">
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><Icon name="sliders" size={15} /></span>
            Settings
          </NavLink>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="tb-search" onClick={() => setPop(pop === 'search' ? null : 'search')}>
            <Icon name="search" size={14} />
            <span style={{ flex: 1, textAlign: 'left' }}>Search vendors, weddings, work orders…</span>
            <span className="kbd">⌘K</span>
          </button>
          <div className="tb-right">
            <button className="tb-bell" onClick={() => setPop(pop === 'notif' ? null : 'notif')} aria-label="Notifications">
              <Icon name="bell" size={17} />
              {unread && <span className="dot" />}
            </button>
            <button className="tb-org" onClick={() => setPop(pop === 'profile' ? null : 'profile')}>
              {state.settings.agencyName} ▾
            </button>
            <button className="tb-avatar" onClick={() => setPop(pop === 'profile' ? null : 'profile')}>
              {initials(state.settings.agencyName)}
            </button>
          </div>

          {pop && <div className="pop-scrim" onClick={() => setPop(null)} />}

          {pop === 'search' && (
            <div className="search-pop">
              <div className="s-head">
                <Icon name="search" size={15} />
                <input autoFocus value={query} placeholder="Type to filter…" onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const first = results.vendors[0] ? '/' : results.weddings[0] ? '/weddings' : results.wos[0] ? `/procurement/${results.wos[0].id}` : null;
                      if (first) go(first);
                    }
                  }} />
              </div>
              {results.vendors.length > 0 && (
                <div className="s-section">
                  <div className="overline">Vendors</div>
                  {results.vendors.map((v, i) => (
                    <button key={v.id} className={`s-row ${i === 0 && !query ? 'focus' : ''}`} onClick={() => go('/')}>
                      <span className="entity-ico"><Icon name="grid" size={13} /></span>
                      <span style={{ flex: 1 }}>
                        <div className="s-title">{v.name}</div>
                        <div className="s-meta">{v.category} · {v.tier} tier · {v.compliance}</div>
                      </span>
                      {i === 0 && !query ? <span className="kbd">↵</span> : <span className="muted">›</span>}
                    </button>
                  ))}
                </div>
              )}
              {results.weddings.length > 0 && (
                <div className="s-section">
                  <div className="overline">Weddings</div>
                  {results.weddings.map((w) => (
                    <button key={w.id} className="s-row" onClick={() => go('/weddings')}>
                      <span className="entity-ico"><Icon name="calendar" size={13} /></span>
                      <span style={{ flex: 1 }}>
                        <div className="s-title">{w.couple}</div>
                        <div className="s-meta">{w.ceremonies} ceremonies · {w.month}</div>
                      </span>
                      <span className="muted">›</span>
                    </button>
                  ))}
                </div>
              )}
              {results.wos.length > 0 && (
                <div className="s-section">
                  <div className="overline">Work orders</div>
                  {results.wos.map((w) => (
                    <button key={w.id} className="s-row" onClick={() => go(`/procurement/${w.id}`)}>
                      <span className={`entity-ico ${w.flagged ? 'warn' : ''}`}><Icon name={w.flagged ? 'alert' : 'clipboard'} size={13} /></span>
                      <span style={{ flex: 1 }}>
                        <div className="s-title">{w.id}</div>
                        <div className="s-meta">{state.vendors.find((v) => v.id === w.vendorId)?.name} · {w.ceremony}</div>
                      </span>
                      {w.flagged ? <span className="badge b-warning">Contingency</span> : <span className="muted">›</span>}
                    </button>
                  ))}
                </div>
              )}
              <div className="s-foot"><span>↵ opens the highlighted result</span><span>esc to close</span></div>
            </div>
          )}

          {pop === 'notif' && (
            <div className="notif-pop">
              <div className="n-head">
                <span className="title">Notifications</span>
                <button className="btn-ghost btn btn-sm right" onClick={() => dispatch({ type: 'NOTIFS_READ' })}>Mark all read</button>
              </div>
              {state.notifications.slice(0, 6).map((n) => (
                <button key={n.id} className="n-row" onClick={() => { dispatch({ type: 'NOTIF_READ', id: n.id }); go(n.route); }}>
                  <span className={`n-dot ${n.tone}`} style={{ opacity: n.read ? 0.35 : 1 }} />
                  <span style={{ flex: 1 }}>
                    <div className="n-title">{n.title}</div>
                    <div className="n-meta">{n.meta}</div>
                  </span>
                  <span className="n-time">{n.time}</span>
                </button>
              ))}
              <div className="n-foot">
                <button className="btn btn-ghost btn-sm" onClick={() => go('/settings?tab=notifications')}>Notification settings</button>
              </div>
            </div>
          )}

          {pop === 'profile' && (
            <div className="profile-pop">
              <div className="p-ident">
                <span className="tb-avatar" style={{ width: 32, height: 32 }}>{initials(state.session?.name ?? 'A S')}</span>
                <span style={{ flex: 1 }}>
                  <div className="p-name">{state.session?.name}</div>
                  <div className="p-mail">{state.session?.email}</div>
                </span>
                <span className="badge b-neutral">{state.session?.role}</span>
              </div>
              <div className="overline" style={{ padding: '2px 10px 6px' }}>Workspace</div>
              <div className="p-row" style={{ cursor: 'default' }}>
                <span className="org-tile">{initials(state.settings.agencyName)}</span>
                <span style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{state.settings.agencyName}</div>
                  <div className="caption muted">{state.team.length} team members</div>
                </span>
                <span style={{ color: 'var(--link)', fontWeight: 600 }}>✓</span>
              </div>
              <hr className="divider" style={{ margin: '6px 0' }} />
              <button className="p-row" onClick={() => go('/settings')}>Workspace settings</button>
              <button className="p-row" onClick={() => go('/settings?tab=notifications')}>Notification preferences</button>
              <button className="p-row" onClick={() => { setPop(null); setAssistOpen(true); }}>Help &amp; process guide</button>
              <button className="p-row" onClick={() => { setPop(null); refresh(); }}>
                {isSupabaseConfigured ? 'Refresh workspace data' : 'Reset demo data'}
              </button>
              <hr className="divider" style={{ margin: '6px 0' }} />
              <button
                className="p-row danger"
                onClick={async () => {
                  if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
                  else dispatch({ type: 'LOGOUT' });
                  navigate('/login');
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <ToastHost />
      <Assistant open={assistOpen} onOpen={() => setAssistOpen(true)} onClose={() => setAssistOpen(false)} />
    </div>
  );
}

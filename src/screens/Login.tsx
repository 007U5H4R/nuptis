import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { TextField } from '../components/ui';

export default function Login() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('asha@merakiweddings.in');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false);

  if (state.session) return <Navigate to="/" replace />;

  const submitLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Enter a valid email address.');
    if (password.length < 4) return setErr('Password must be at least 4 characters (demo build).');
    dispatch({ type: 'LOGIN', session: { email, name: 'Asha Sharma', role: 'Owner' } });
    navigate('/');
  };

  const submitCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setInfo('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Enter a valid email address.');
    if (password.length < 6) return setErr('Password must be at least 6 characters.');
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) setErr(error.message);
        // On success, the StoreProvider's auth listener hydrates + logs in — this
        // screen redirects itself via the `state.session` check above once that lands.
      } else {
        const { data, error } = await supabase!.auth.signUp({ email, password });
        if (error) setErr(error.message);
        else if (!data.session) setInfo('Account created — check your email to confirm, then sign in.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={isSupabaseConfigured ? submitCloud : submitLocal}>
        <div className="auth-brand">NUPTIS</div>
        <div className="auth-sub">Vendor ops for wedding planning agencies</div>
        <TextField label="Email address" value={email} onChange={setEmail} placeholder="you@agency.in" />
        <TextField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" error={err} />
        {info && <div className="caption" style={{ color: 'var(--success-text)' }}>{info}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {isSupabaseConfigured ? (busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account') : 'Sign in'}
        </button>
        {isSupabaseConfigured ? (
          <div className="caption muted" style={{ textAlign: 'center' }}>
            {mode === 'signin' ? (
              <>New workspace? <button type="button" style={{ border: 0, background: 'none', padding: 0, font: 'inherit', color: 'var(--link)', cursor: 'pointer' }} onClick={() => { setMode('signup'); setErr(''); setInfo(''); }}>Create an account</button></>
            ) : (
              <>Already have one? <button type="button" style={{ border: 0, background: 'none', padding: 0, font: 'inherit', color: 'var(--link)', cursor: 'pointer' }} onClick={() => { setMode('signin'); setErr(''); setInfo(''); }}>Sign in</button></>
            )}
          </div>
        ) : (
          <div className="caption muted" style={{ textAlign: 'center' }}>
            Demo build — any valid email and a 4+ character password signs you in as the workspace Owner.
          </div>
        )}
      </form>
    </div>
  );
}

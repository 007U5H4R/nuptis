import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { TextField } from '../components/ui';

export default function Login() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('asha@merakiweddings.in');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  if (state.session) return <Navigate to="/" replace />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Enter a valid email address.');
    if (password.length < 4) return setErr('Password must be at least 4 characters (demo build).');
    dispatch({ type: 'LOGIN', session: { email, name: 'Asha Sharma', role: 'Owner' } });
    navigate('/');
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">NUPTIS</div>
        <div className="auth-sub">Vendor ops for wedding planning agencies</div>
        <TextField label="Email address" value={email} onChange={setEmail} placeholder="you@agency.in" />
        <TextField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" error={err} />
        <button className="btn btn-primary" type="submit">Sign in</button>
        <div className="caption muted" style={{ textAlign: 'center' }}>
          Demo build — any valid email and a 4+ character password signs you in as the workspace Owner.
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from './auth';
import './ThinkX.css';
import CognitronLogo from './assets/cognitron.png';

function LoginSection({ onNavigate, standalone }) {
  const { user, signIn, logout, request, checking } = useAuth();
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      let data;
      if (mode === 'register') {
        data = await request('/api/auth/register', { method: 'POST', body: { name: form.name, email: form.email, password: form.password } });
      } else {
        data = await request('/api/auth/login', { method: 'POST', body: { email: form.email, password: form.password } });
      }
      signIn(data.token, data.user);
      setForm({ name: '', email: '', password: '', confirm: '' });
      onNavigate('thinkx', 'register');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return <section className="tx-page"><p className="tx-muted" style={{ textAlign: 'center' }}>Loading…</p></section>;
  }

  if (user) {
    return (
      <section className="tx-page">
        <div className="tx-auth">
          <div className="tx-card" style={{ textAlign: 'center' }}>
            <span className="tx-badge">Participant</span>
            <h2 className="tx-h2" style={{ marginTop: '1rem' }}>Hi, {user.name}</h2>
            {user.email && <p className="tx-muted">{user.email}</p>}
            <p className="tx-p">You are logged in.</p>
            <div className="tx-row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <button className="tx-btn" onClick={() => onNavigate('thinkx', 'register')}>
                Go to Think-X
              </button>
              <button className="tx-btn ghost" onClick={logout}>Logout</button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const card = (
      <div className="tx-auth">
        <div className="tx-card">
          <h2 className="tx-h2" style={{ textAlign: 'center' }}>
            {mode === 'register' ? 'Create Account' : 'Participant Login'}
          </h2>

          {error && <div className="tx-alert err">{error}</div>}

          <form className="tx-form" onSubmit={submit}>
            {mode === 'register' && (
              <div className="tx-field">
                <label>Full name <span className="req">*</span></label>
                <input className="tx-input" value={form.name} onChange={set('name')} autoComplete="name" required />
              </div>
            )}
            <div className="tx-field">
              <label>Email ID <span className="req">*</span></label>
              <input className="tx-input" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
            </div>
            <div className="tx-field">
              <label>Password <span className="req">*</span></label>
              <input className="tx-input" type="password" value={form.password} onChange={set('password')}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 6 : undefined} />
            </div>
            {mode === 'register' && (
              <div className="tx-field">
                <label>Confirm password <span className="req">*</span></label>
                <input className="tx-input" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" required />
              </div>
            )}
            <button className="tx-btn" type="submit" disabled={busy} style={{ marginTop: '0.5rem' }}>
              {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Login'}
            </button>
          </form>

          <p className="tx-muted" style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            {mode === 'login' ? 'New here? ' : 'Already have an account? '}
            <button type="button" className="tx-link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Create an account' : 'Login'}
            </button>
          </p>
        </div>
      </div>
  );

  if (!standalone) return <section className="tx-page">{card}</section>;

  // separate full-screen login page
  return (
    <div className="tx-login-page">
      <section className="tx-page" style={{ paddingTop: '1.5rem' }}>
        <div className="tx-login-top">
          <button type="button" className="tx-link" onClick={() => onNavigate('home')}>← Back to website</button>
        </div>
        <div className="tx-login-brand">
          <img src={CognitronLogo} alt="AI Cognitron" />
          <div>
            <div className="tx-login-title">AICOGNITRON</div>
            <div className="tx-muted">THINK-X · Campus Edition portal</div>
          </div>
        </div>
        {card}
        <p className="tx-muted" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          Log in or create an account to register your team.
        </p>
      </section>
    </div>
  );
}

export default LoginSection;

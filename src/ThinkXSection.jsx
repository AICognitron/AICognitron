import { useCallback, useEffect, useState } from 'react';
import { useAuth, fmtDate } from './auth';
import {
  PHASES, LEADERBOARD, PRIZES, JUDGE_QUESTIONS, COORDINATORS, CONVENER, YEARS,
} from './thinkxData';
import { Field, Countdown } from './ThinkXUi';
import { PhasePanel } from './ThinkXPhases';
import './ThinkX.css';

// ======================================================================
function ThinkXSection({ initialTab, onNavigate }) {
  const { user, request, refreshUser } = useAuth();
  const isTester = !!user?.isTester;
  useEffect(() => { refreshUser(); }, [refreshUser]);
  const [state, setState] = useState({ loaded: false, activePhase: 1, eventStart: null, domains: [], resources: [], twists: {}, deadlines: {}, teamCount: 0 });
  const [stateErr, setStateErr] = useState('');
  const [tab, setTab] = useState(initialTab?.tab || 'overview');

  const loadState = useCallback(async () => {
    try {
      setState({ ...(await request('/api/thinkx/state')), loaded: true });
      setStateErr('');
    } catch (e) {
      setStateErr(e.message);
    }
  }, [request]);

  // load now, then refresh every 15 s and whenever the tab gets focus,
  // so new domains / phase changes / twists appear for participants without reloading
  useEffect(() => {
    loadState();
    const t = setInterval(loadState, 15000);
    const onFocus = () => loadState();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [loadState]);
  useEffect(() => { if (initialTab?.tab) setTab(initialTab.tab); }, [initialTab]);

  // tabs that no longer exist (old links) fall back to the overview
  useEffect(() => {
    if (!['overview', 'register', 'phase1', 'phase2', 'phase3', 'phase4'].includes(tab)) setTab('overview');
  }, [tab]);

  const active = state.activePhase;
  const beforeStart = !!state.eventStart && Date.now() < new Date(state.eventStart).getTime();
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'register', label: 'Register' },
    ...PHASES.map(p => ({
      key: `phase${p.n}`,
      label: `Phase ${p.n} · ${p.name}`,
      live: p.n === active,
      locked: !isTester && (beforeStart || p.n > active),
    })),
  ];

  return (
    <section className="tx-page">
      {/* Hero */}
      <div className="tx-card">
        <div className="tx-hero">
          <div>
            <div className="tx-row">
              {beforeStart
                ? <span className="tx-badge">Starts {fmtDay(state.eventStart)}</span>
                : <span className="tx-badge live">Phase {active} live{PHASES[active - 1]?.name ? ` · ${PHASES[active - 1].name}` : ''}</span>}
              <span className="tx-muted">AI Cognitron Club · Organised by AI &amp; DS</span>
            </div>
            <h1 className="tx-h1">THINK-X</h1>
            <div className="tx-h3 gold" style={{ fontSize: '1.3rem' }}>CAMPUS EDITION</div>
            <p className="tx-tagline">Observe. Think. Solve. Defend. Win.</p>
            <p className="tx-p">Your ideas can make our campus smarter! Real campus problems, real solutions, bigger impact.</p>
            <div className="tx-pill-row">
              <span className="tx-pill"><b>4</b> Weeks</span>
              <span className="tx-pill"><b>4</b> Real Problems</span>
              <span className="tx-pill"><b>1</b> Campus Innovation Champion</span>
            </div>
            <HeroClock state={state} />
            {!user && (
              <div className="tx-row" style={{ marginTop: '1rem' }}>
                <button className="tx-btn" onClick={() => onNavigate('login')}>Login to Register</button>
              </div>
            )}
          </div>
          <img className="tx-poster" src="/assets/thinkx.jpg" alt="Think-X Campus Edition poster" />
        </div>
      </div>

      {state.loaded && (state.apiVersion || 0) < 8 && (
        <div className="tx-alert err">
          The backend server is running an old version. Stop it (Ctrl + C in Terminal) and run <b>npm run dev</b> again.
        </div>
      )}
      {stateErr && <div className="tx-alert err">{stateErr}</div>}

      <div className="tx-tabs" role="tablist">
        {tabs.map(t => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
            className={`tx-tab ${tab === t.key ? 'active' : ''} ${t.locked ? 'locked' : ''}`}
            onClick={() => setTab(t.key)}>
            {t.live && <span className="dot" />}
            {t.locked && <span aria-hidden>🔒</span>}
            {t.label}
          </button>
        ))}
      </div>

      {isTester && (
        <div className="tx-alert info">
          🧪 <b>Tester access</b> ({user.email}): every phase is open for you at any time, ignoring the start date and deadlines.
          Your team and entries are marked <b>TEST</b> and get no submission number.
          Other participants only see each phase between its start time and deadline.
        </div>
      )}
      {tab === 'overview' && <Overview active={active} deadlines={state.deadlines} />}
      {tab === 'register' && <RegisterPanel onNavigate={onNavigate} setTab={setTab} />}
      {PHASES.map(p => tab === `phase${p.n}` && (
        <PhasePanel key={p.n} phase={p} state={state} reload={loadState}
          onNavigate={onNavigate} setTab={setTab} />
      ))}
    </section>
  );
}

const fmtDay = iso => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ---------- countdown in the hero ----------
function HeroClock({ state }) {
  const now = Date.now();
  const start = state.eventStart ? new Date(state.eventStart).getTime() : 0;
  const n = state.activePhase;
  const dl = state.deadlines?.[n];
  if (start && now < start) {
    return <Countdown to={state.eventStart} label={`Think-X starts in · ${fmtDate(state.eventStart)}`} />;
  }
  if (dl && now < new Date(dl).getTime()) {
    const pName = PHASES[n - 1]?.name ? ` · ${PHASES[n - 1].name}` : '';
    return <Countdown to={dl} label={`Phase ${n}${pName} ends in`} doneText={`Phase ${n} submissions are closed.`} />;
  }
  if (dl) return <div className="tx-cd-done">Phase {n} submissions closed on {fmtDate(dl)}.</div>;
  return null;
}

// ---------- overview ----------
function Overview({ active, deadlines = {} }) {
  return (
    <>
      <div className="tx-grid" style={{ marginBottom: '1.5rem' }}>
        {PHASES.map(p => <WeekCard key={p.n} p={p} active={active} deadline={deadlines[p.n]} />)}
      </div>

      <div className="tx-grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="tx-sub">
          <h3 className="tx-h3">🤖 AI Usage Policy</h3>
          <p className="tx-p">AI tools may be used for assistance, but your solution must demonstrate your own observation, reasoning and decision-making.</p>
          <p className="tx-p" style={{ color: '#f7c873', fontWeight: 700, margin: 0 }}>Generic AI-generated answers will not be considered.</p>
        </div>
        <div className="tx-sub pink">
          <h3 className="tx-h3 pink">🎤 Finalists Must Defend Their Idea</h3>
          <p className="tx-p"><b>Each finalist gets 3 minutes.</b> Judges can ask:</p>
          <ul className="tx-ol">{JUDGE_QUESTIONS.map(q => <li key={q}>{q}</li>)}</ul>
        </div>
      </div>

      <div className="tx-grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="tx-sub gold">
          <h3 className="tx-h3 gold">🏆 Monthly Leaderboard</h3>
          <table className="tx-points"><tbody>
            {LEADERBOARD.map(([a, pts]) => <tr key={a}><td>{a}</td><td>{pts}</td></tr>)}
          </tbody></table>
          <p className="tx-muted" style={{ marginTop: '0.8rem', marginBottom: 0 }}>Think. Lead. Be the Champion!</p>
        </div>
        <div className="tx-sub gold">
          <h3 className="tx-h3 gold">🎁 Exciting Prizes</h3>
          <ul className="tx-list">
            {PRIZES.map(([i, t, d]) => (
              <li key={t}><span style={{ fontSize: '1.3rem' }}>{i}</span><span><b style={{ color: '#f7c873' }}>{t}</b><br />{d}</span></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="tx-sub">
        <div className="tx-grid-2">
          <div>
            <h3 className="tx-h3">Coordinators</h3>
            <ul className="tx-list">{COORDINATORS.map(c => <li key={c}>{c}</li>)}</ul>
          </div>
          <div>
            <h3 className="tx-h3">Convener</h3>
            <p className="tx-p">{CONVENER}</p>
            <p className="tx-tagline" style={{ margin: 0 }}>Be the change you want to see in our campus!</p>
          </div>
        </div>
      </div>
    </>
  );
}

function WeekCard({ p, active, deadline }) {
  const status = p.n < active ? 'done' : p.n === active ? 'live' : 'lock';
  return (
    <div className={`tx-week ${p.cls}`}>
      <div className="tx-row" style={{ justifyContent: 'space-between' }}>
        <span className="wk">{p.week}</span>
        <span className={`tx-badge ${status}`} style={{ fontSize: 11, padding: '3px 10px' }}>
          {status === 'done' ? 'Completed' : status === 'live' ? 'Live' : 'Upcoming'}
        </span>
      </div>
      <div className="nm">{p.name}</div>
      {deadline && <div className="tx-muted" style={{ marginTop: '-0.3rem', marginBottom: '0.4rem' }}>Ends {fmtDate(deadline)}</div>}
      <div className="hd">{p.heading}</div>
      <p>{p.text}</p>
      <div className="tx-muted" style={{ fontWeight: 700, marginBottom: 4 }}>SUBMIT{p.submitNote ? ` (${p.submitNote})` : ''}:</div>
      <ol className="tx-ol" style={{ fontSize: '0.88rem' }}>{p.submit.map(s => <li key={s}>{s}</li>)}</ol>
      {p.twist && <div className="tx-twist"><b>{p.twistLabel}:</b> {p.twist}</div>}
      <div className="award">🏆 {p.award}</div>
    </div>
  );
}

// ---------- participant: team registration ----------
const blankMember = () => ({ name: '', email: '', phone: '', department: '', year: '', registerNo: '' });

function RegisterPanel({ onNavigate, setTab }) {
  const { user, request } = useAuth();
  const [team, setTeam] = useState(undefined); // undefined = loading
  const [form, setForm] = useState({ teamName: '', leaderName: '', leaderEmail: '', phone: '', college: '', memberCount: 1 });
  const [members, setMembers] = useState([blankMember(), blankMember(), blankMember(), blankMember()]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role !== 'participant') return;
    setForm(f => ({ ...f, leaderName: f.leaderName || user?.name || '', leaderEmail: f.leaderEmail || user?.email || '' }));
    request('/api/thinkx/team').then(d => setTeam(d.team)).catch(e => { setErr(e.message); setTeam(null); });
  }, [user, request]);

  if (!user) {
    return (
      <div className="tx-card" style={{ textAlign: 'center' }}>
        <h2 className="tx-h2">Register for Think-X</h2>
        <p className="tx-p">Login or create a participant account to register your team.</p>
        <button className="tx-btn" onClick={() => onNavigate('login')}>Login / Create account</button>
      </div>
    );
  }
  if (team === undefined) return <p className="tx-muted">Loading…</p>;
  if (team) return <TeamSummary team={team} onPhase={() => setTab('phase1')} />;

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setM = (i, k) => e => setMembers(ms => ms.map((m, j) => (j === i ? { ...m, [k]: e.target.value } : m)));
  const count = Number(form.memberCount);

  // Member 1 is the team leader: name/email/phone come from the leader fields
  const memberData = members.slice(0, count).map((m, i) =>
    i === 0 ? { ...m, name: form.leaderName, email: form.leaderEmail, phone: form.phone } : m);

  const submit = async e => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const d = await request('/api/thinkx/team', { method: 'POST', body: { ...form, memberCount: count, members: memberData } });
      setTeam(d.team);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="tx-card">
      <h2 className="tx-h2">Team Registration</h2>
      <p className="tx-muted" style={{ marginTop: '-0.5rem', marginBottom: '1.25rem' }}>Fields marked <span style={{ color: '#f87171' }}>*</span> are mandatory.</p>
      {err && <div className="tx-alert err">{err}</div>}
      <form className="tx-form" onSubmit={submit}>
        <div className="tx-form-grid">
          <Field label="Team name" req><input className="tx-input" value={form.teamName} onChange={set('teamName')} required maxLength={100} /></Field>
          <Field label="Team leader name" req><input className="tx-input" value={form.leaderName} onChange={set('leaderName')} required maxLength={100} /></Field>
          <Field label="Team leader email ID" req><input className="tx-input" type="email" value={form.leaderEmail} onChange={set('leaderEmail')} required /></Field>
          <Field label="Phone number" req>
            <input className="tx-input" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" title="10-digit mobile number"
              value={form.phone} onChange={set('phone')} required maxLength={10} placeholder="10-digit mobile" />
          </Field>
          <Field label="College name" req><input className="tx-input" value={form.college} onChange={set('college')} required maxLength={200} /></Field>
          <Field label="Number of members" req>
            <select className="tx-select" value={form.memberCount} onChange={set('memberCount')}>
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        </div>

        {memberData.map((m, i) => (
          <div className="tx-member" key={i}>
            <h4>Member {i + 1}{i === 0 ? ' (Team Leader)' : ''}</h4>
            <div className="tx-form-grid">
              <Field label="Name" req>
                <input className="tx-input" value={m.name} onChange={setM(i, 'name')} readOnly={i === 0} required maxLength={100} />
              </Field>
              <Field label="Email ID" req>
                <input className="tx-input" type="email" value={m.email} onChange={setM(i, 'email')} readOnly={i === 0} required />
              </Field>
              <Field label="Phone number">
                <input className="tx-input" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" title="10-digit mobile number"
                  value={m.phone} onChange={setM(i, 'phone')} readOnly={i === 0} maxLength={10} />
              </Field>
              <Field label="Department" req>
                <input className="tx-input" value={m.department} onChange={setM(i, 'department')} required maxLength={100} placeholder="e.g. AI&DS" />
              </Field>
              <Field label="Year of study" req>
                <select className="tx-select" value={m.year} onChange={setM(i, 'year')} required>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </Field>
              <Field label="Register number">
                <input className="tx-input" value={m.registerNo} onChange={setM(i, 'registerNo')} maxLength={40} />
              </Field>
            </div>
            {i === 0 && <p className="tx-muted" style={{ margin: '0.6rem 0 0' }}>Name, email and phone are taken from the team leader details above.</p>}
          </div>
        ))}

        <div><button className="tx-btn" type="submit" disabled={busy}>{busy ? 'Registering…' : 'Register Team'}</button></div>
      </form>
    </div>
  );
}

function TeamSummary({ team, onPhase }) {
  return (
    <div className="tx-card">
      <div className="tx-alert ok">✅ Your team is registered for Think-X. {team.regNo ? `Registration #${team.regNo}` : '🧪 Test team'} · {fmtDate(team.registeredAt)}</div>
      <h2 className="tx-h2">{team.teamName}</h2>
      <dl className="tx-kv" style={{ marginBottom: '1.25rem' }}>
        <dt>Team leader</dt><dd>{team.leaderName}</dd>
        <dt>Email</dt><dd>{team.leaderEmail}</dd>
        <dt>Phone</dt><dd>{team.phone}</dd>
        <dt>College</dt><dd>{team.college}</dd>
        <dt>Members</dt><dd>{team.memberCount}</dd>
      </dl>
      <MembersTable members={team.members} />
      <div style={{ marginTop: '1.25rem' }}><button className="tx-btn" onClick={onPhase}>Go to Phase 1</button></div>
    </div>
  );
}

function MembersTable({ members }) {
  return (
    <div className="tx-table-wrap">
      <table className="tx-table">
        <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Department</th><th>Year</th><th>Reg. No</th></tr></thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={i}><td>{i + 1}</td><td>{m.name}</td><td>{m.email}</td><td>{m.phone || '—'}</td><td>{m.department}</td><td>{m.year}</td><td>{m.registerNo || '—'}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ThinkXSection;

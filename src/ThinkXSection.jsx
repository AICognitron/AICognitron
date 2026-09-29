import { useEffect, useState } from 'react';
import {
  PHASES, LEADERBOARD, PRIZES, JUDGE_QUESTIONS, COORDINATORS, CONVENER,
  EVENT_START, DEADLINES, REGISTER_FORM,
} from './thinkxData';
import { Countdown, fmtDate } from './ThinkXUi';
import { PhasePanel } from './ThinkXPhases';
import './ThinkX.css';

// Current phase from the dates in thinkxData.js (moves on after each deadline)
function livePhase() {
  let p = 1;
  while (p < 4 && DEADLINES[p] && Date.now() > new Date(DEADLINES[p]).getTime()) p += 1;
  return p;
}
const TAB_KEYS = ['overview', 'register', 'phase1', 'phase2', 'phase3', 'phase4'];

// ======================================================================
function ThinkXSection({ initialTab }) {
  const [tab, setTab] = useState(TAB_KEYS.includes(initialTab?.tab) ? initialTab.tab : 'overview');
  const [, tickNow] = useState(0);
  // re-check the live phase once a minute
  useEffect(() => {
    const t = setInterval(() => tickNow(x => x + 1), 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (TAB_KEYS.includes(initialTab?.tab)) setTab(initialTab.tab); }, [initialTab]);

  const active = livePhase();
  const beforeStart = Date.now() < new Date(EVENT_START).getTime();
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'register', label: 'Register' },
    ...PHASES.map(p => ({ key: `phase${p.n}`, label: `Phase ${p.n} · ${p.name}`, live: !beforeStart && p.n === active })),
  ];

  return (
    <section className="tx-page">
      {/* Hero */}
      <div className="tx-card">
        <div className="tx-hero">
          <div>
            <div className="tx-row">
              {beforeStart
                ? <span className="tx-badge">Starts {fmtDay(EVENT_START)}</span>
                : <span className="tx-badge live">Phase {active} live · {PHASES[active - 1].name}</span>}
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
            <HeroClock active={active} beforeStart={beforeStart} />
            <div className="tx-row" style={{ marginTop: '1rem' }}>
              <a className="tx-btn" href={REGISTER_FORM} target="_blank" rel="noopener noreferrer">Register Now</a>
            </div>
          </div>
          <img className="tx-poster" src="/assets/thinkx.jpg" alt="Think-X Campus Edition poster" loading="lazy" decoding="async" />
        </div>
      </div>

      <div className="tx-tabs" role="tablist">
        {tabs.map(t => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
            className={`tx-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}>
            {t.live && <span className="dot" />}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview active={beforeStart ? 0 : active} />}
      {tab === 'register' && <RegisterPanel />}
      {PHASES.map(p => tab === `phase${p.n}` && (
        <PhasePanel key={p.n} phase={p} active={active} beforeStart={beforeStart} />
      ))}
    </section>
  );
}

const fmtDay = iso => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ---------- countdown in the hero ----------
function HeroClock({ active, beforeStart }) {
  if (beforeStart) return <Countdown to={EVENT_START} label={`Think-X starts in · ${fmtDate(EVENT_START)}`} />;
  const dl = DEADLINES[active];
  if (dl && Date.now() < new Date(dl).getTime()) {
    return <Countdown to={dl} label={`Phase ${active} · ${PHASES[active - 1].name} ends in`} doneText={`Phase ${active} submissions are closed.`} />;
  }
  if (dl) return <div className="tx-cd-done">Think-X submissions closed on {fmtDate(dl)}.</div>;
  return null;
}

// ---------- overview ----------
function Overview({ active }) {
  return (
    <>
      <div className="tx-grid" style={{ marginBottom: '1.5rem' }}>
        {PHASES.map(p => <WeekCard key={p.n} p={p} active={active} deadline={DEADLINES[p.n]} />)}
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

// ---------- team registration (Google Form) ----------
function RegisterPanel() {
  return (
    <div className="tx-card" style={{ textAlign: 'center' }}>
      <h2 className="tx-h2">Register for Think-X</h2>
      <p className="tx-p">Registration is done through a Google Form. One registration per team.</p>
      <ul className="tx-list" style={{ display: 'inline-block', textAlign: 'left', margin: '0.5rem 0 1.5rem' }}>
        <li><span>👥</span><span>Teams of 1–4 members</span></li>
        <li><span>📝</span><span>Keep team name, leader name, email, phone, college and each member's name, email, department and year ready</span></li>
        <li><span>📄</span><span>Phase submissions are made later through each phase's Google Form using the Word template</span></li>
      </ul>
      <div>
        <a className="tx-btn" href={REGISTER_FORM} target="_blank" rel="noopener noreferrer">Open Registration Form</a>
      </div>
    </div>
  );
}

export default ThinkXSection;

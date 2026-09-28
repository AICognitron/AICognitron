// Think-X phase pages (Phase 1–4): participant forms
import { useCallback, useEffect, useState } from 'react';
import { useAuth, fmtDate } from './auth';
import { PHASE_FORMS, FILE_RULES, fmtSize } from './thinkxData';
import { Field, KV, Countdown } from './ThinkXUi';

const deadlinePassed = iso => !!iso && Date.now() > new Date(iso).getTime();
const beforeStart = state => !!state.eventStart && Date.now() < new Date(state.eventStart).getTime();

// ======================================================================
export function PhasePanel({ phase, state, onNavigate, setTab }) {
  const { user } = useAuth();
  const isTester = !!user?.isTester;
  const n = phase.n;
  const form = PHASE_FORMS[n];
  const active = state.activePhase;
  const status = n < active ? 'done' : n === active ? 'live' : 'lock';
  const deadline = state.deadlines?.[n];
  const resources = (state.resources || []).filter(r => r.phase === n);

  if (!isTester && (status === 'lock' || beforeStart(state))) {
    // when does it open? Phase 1 at the event start, later phases when the previous deadline ends
    const opensAt = beforeStart(state) && n === 1 ? state.eventStart
      : n === active + 1 && state.deadlines?.[active] ? state.deadlines[active] : null;
    return (
      <div className="tx-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem' }}>🔒</div>
        <h2 className="tx-h2">Phase {n} · {phase.name}</h2>
        <p className="tx-p">
          {opensAt ? `This phase is locked. It opens on ${fmtDate(opensAt)}.`
            : beforeStart(state) ? `This phase is locked. Think-X starts on ${fmtDate(state.eventStart)}.`
              : 'This phase is locked. It opens after the previous phase ends.'}
        </p>
        {opensAt && <div style={{ display: 'flex', justifyContent: 'center' }}><Countdown to={opensAt} label="Opens in" /></div>}
      </div>
    );
  }

  return (
    <>
      <div className={`tx-card tx-plain tx-week ${phase.cls}`} style={{ borderRadius: 25 }}>
        <div className="tx-row" style={{ justifyContent: 'space-between' }}>
          <span className="wk">{phase.week} · PHASE {n}</span>
          <span className="tx-row" style={{ gap: '0.4rem' }}>
            {isTester && <span className="tx-badge lock">🧪 Tester access</span>}
            <span className={`tx-badge ${status}`}>{status === 'done' ? 'Completed' : status === 'live' ? 'Live now' : 'Not started'}</span>
          </span>
        </div>
        <div className="nm" style={{ fontSize: '2rem' }}>{phase.name}</div>
        <div className="hd" style={{ fontSize: '1.15rem' }}>{phase.heading}</div>
        <p>{phase.text}</p>
        {n === 1 && phase.twist && <div className="tx-twist"><b>{phase.twistLabel}:</b> {phase.twist}</div>}
        {n !== 1 && phase.twist && <div className="tx-twist"><b>{phase.twistLabel}:</b> revealed during the week. Watch this page.</div>}
        <div className="award">🏆 {phase.award}</div>
        {deadline && (
          <div className="tx-muted" style={{ marginTop: '0.6rem', color: deadlinePassed(deadline) ? '#f87171' : '#bbf7d0' }}>
            ⏰ {deadlinePassed(deadline) ? 'Submissions closed on' : 'Submissions close on'} {fmtDate(deadline)}
          </div>
        )}
        {status === 'live' && beforeStart(state) && !isTester && (
          <Countdown to={state.eventStart} label="Submissions open in" compact />
        )}
        {status === 'live' && !beforeStart(state) && deadline && !deadlinePassed(deadline) && (
          <Countdown to={deadline} label="Time left to submit" doneText="Submissions are closed." compact />
        )}
      </div>

      {n === 1 && <DomainsBlock domains={state.domains} />}
      {n !== 1 && (resources.length > 0 || n === 3) && (
        <ResourcesBlock n={n} resources={resources} label={form.resourcesLabel || 'Phase Brief & Resources'} />
      )}
      {form.twist && <TwistBlock n={n} phase={phase} twist={state.twists?.[n]} isTester={isTester} />}
      <PhaseParticipant n={n} state={state} onNavigate={onNavigate} setTab={setTab} />
    </>
  );
}

// ---------- phase 1 domains ----------
function DomainsBlock({ domains }) {
  return (
    <div className="tx-card">
      <h2 className="tx-h2">Phase 1 Domains</h2>
      {domains.length === 0 ? (
        <p className="tx-muted">The domains will appear here when Phase 1 opens. This page updates automatically.</p>
      ) : (
        <div className="tx-grid" style={{ marginBottom: 0 }}>
          {domains.map(d => (
            <div className="tx-domain" key={d.id}>
              <h4>{d.title}</h4>
              <p>{d.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- resources / datasets for phases 2–4 ----------
function ResourcesBlock({ n, resources, label }) {
  const { download } = useAuth();
  const [err, setErr] = useState('');
  return (
    <div className="tx-card">
      <h2 className="tx-h2">{label}</h2>
      {err && <div className="tx-alert err">{err}</div>}
      {resources.length === 0 ? (
        <p className="tx-muted">
          {n === 3 ? 'The THINK-X team will share the dataset here. This page updates automatically.' : 'Nothing posted yet.'}
        </p>
      ) : (
        <div className="tx-grid" style={{ marginBottom: 0 }}>
          {resources.map(r => (
            <div className="tx-domain" key={r.id}>
              <h4>{r.title}</h4>
              {r.description && <p>{r.description}</p>}
              {r.file && (
                <button className="tx-btn small" type="button" style={{ marginTop: '0.8rem' }}
                  onClick={() => download(`/api/thinkx/resources/${r.id}/file`, r.file.originalName).catch(e => setErr(e.message))}>
                  ⬇ {r.file.originalName} ({fmtSize(r.file.size)})
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- twist (phases 2 and 3): revealed automatically at its scheduled time ----------
function TwistBlock({ n, phase, twist, isTester }) {
  const { download } = useAuth();
  const [err, setErr] = useState('');
  const title = PHASE_FORMS[n].twist.title;

  if (!twist) {
    if (!isTester) return null; // still secret
    return (
      <div className="tx-card" style={{ borderColor: 'rgba(247,200,115,0.6)' }}>
        <h2 className="tx-h2">⚡ {title}</h2>
        <div className="tx-twist" style={{ marginTop: 0, fontSize: '1rem' }}>{phase.twist}</div>
        <p className="tx-muted" style={{ marginTop: '0.8rem', marginBottom: 0 }}>
          🧪 Tester preview: other participants will not see this until its reveal time. You can send the revised entry after your main submission.
        </p>
      </div>
    );
  }

  return (
    <div className="tx-card" style={{ borderColor: 'rgba(247,200,115,0.6)' }}>
      <h2 className="tx-h2">⚡ {title}</h2>
      {err && <div className="tx-alert err">{err}</div>}
      <div className="tx-twist" style={{ marginTop: 0, fontSize: '1rem', whiteSpace: 'pre-wrap' }}>{twist.text}</div>
      {twist.file && (
        <button className="tx-btn small" type="button" style={{ marginTop: '0.8rem' }}
          onClick={() => download(`/api/thinkx/twist/${n}/file`, twist.file.originalName).catch(e => setErr(e.message))}>
          ⬇ {twist.file.originalName}
        </button>
      )}
      <p className="tx-muted" style={{ marginTop: '0.8rem', marginBottom: 0 }}>
        Revealed {fmtDate(twist.revealedAt)}. Teams that have submitted must now send their revised entry below.
      </p>
    </div>
  );
}

// ======================================================================
// Participant side
// ======================================================================
function PhaseParticipant({ n, state, onNavigate, setTab }) {
  const { user, request } = useAuth();
  const form = PHASE_FORMS[n];
  const [info, setInfo] = useState(undefined); // { team, submission, prefill }
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setErr('');
    let team = null;
    try {
      team = (await request('/api/thinkx/team')).team;
    } catch (e) {
      setErr(e.message);
      setInfo({ failed: true });
      return;
    }
    try {
      const [s, p1] = await Promise.all([
        request(`/api/thinkx/phase/${n}/mine`),
        n === 2 && team ? request('/api/thinkx/phase/1/mine') : Promise.resolve(null),
      ]);
      setInfo({ team, submission: s.submission, prefill: p1?.submission ? { problemStatement: p1.submission.answers.problem } : {} });
    } catch (e) {
      setErr(e.message);
      setInfo({ failed: true });
    }
  }, [n, request]);

  useEffect(() => { if (user?.role === 'participant') load(); }, [user, load]);

  if (!user) {
    return (
      <div className="tx-card" style={{ textAlign: 'center' }}>
        <p className="tx-p">Login and register your team to take part in Phase {n}.</p>
        <button className="tx-btn" onClick={() => onNavigate('login')}>Login</button>
      </div>
    );
  }
  if (info === undefined) return <p className="tx-muted">Loading…</p>;
  if (info.failed) {
    return (
      <div className="tx-card">
        <div className="tx-alert err">Could not load your Phase {n} details: {err}</div>
        <p className="tx-muted" style={{ margin: 0 }}>If this keeps happening, restart the site (Ctrl + C, then npm run dev).</p>
        <button className="tx-btn small ghost" type="button" style={{ marginTop: '1rem' }} onClick={load}>Try again</button>
      </div>
    );
  }

  const isTester = !!user?.isTester;
  const isOpen = isTester || (state.activePhase === n && !deadlinePassed(state.deadlines?.[n]) && !beforeStart(state));
  const sub = info.submission;
  const twist = state.twists?.[n];

  if (sub) {
    return (
      <>
        <SubmissionView n={n} sub={sub} />
        {form.twist && (twist || isTester) && !sub.revision && isOpen && (
          <PhaseForm n={n} mode="revise" team={info.team} onDone={s => setInfo(i => ({ ...i, submission: s }))} />
        )}
      </>
    );
  }
  if (!info.team) {
    return (
      <div className="tx-card" style={{ textAlign: 'center' }}>
        <p className="tx-p">Register your team first, then come back here to submit.</p>
        <button className="tx-btn" onClick={() => setTab('register')}>Register team</button>
      </div>
    );
  }
  if (!isTester && state.activePhase === n && beforeStart(state)) {
    return (
      <div className="tx-card" style={{ textAlign: 'center' }}>
        <h2 className="tx-h2">Team {info.team.teamName}, you are registered ✅</h2>
        <p className="tx-p">Think-X starts on <b>{fmtDate(state.eventStart)}</b>. The Phase {n} form opens here at that time.</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Countdown to={state.eventStart} label="Opens in" /></div>
      </div>
    );
  }
  if (!isOpen) {
    return (
      <div className="tx-card">
        <div className="tx-alert info" style={{ margin: 0 }}>
          {state.activePhase > n ? `Phase ${n} is over. Your team did not submit for this phase.` : `Phase ${n} submissions are closed.`}
        </div>
      </div>
    );
  }
  if (form.needsDomain && state.domains.length === 0) return null;

  return (
    <PhaseForm n={n} mode="submit" team={info.team} domains={state.domains} prefill={info.prefill}
      onDone={s => setInfo(i => ({ ...i, submission: s }))} />
  );
}

function PhaseForm({ n, mode, team, domains = [], prefill = {}, onDone }) {
  const { request } = useAuth();
  const cfg = mode === 'revise' ? PHASE_FORMS[n].twist : PHASE_FORMS[n];
  const [domainId, setDomainId] = useState('');
  const [values, setValues] = useState(() => Object.fromEntries(cfg.fields.map(f => [f.key, prefill[f.key] || ''])));
  const [files, setFiles] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr('');
    if (PHASE_FORMS[n].needsDomain && mode === 'submit' && !domainId) return setErr('Choose a domain.');
    for (const f of cfg.fields) {
      if (f.type === 'number' && f.max && Number(values[f.key]) > f.max) return setErr(`"${f.label}" cannot be more than ₹${f.max.toLocaleString('en-IN')}.`);
    }
    for (const spec of cfg.files) {
      const rule = FILE_RULES[spec.key];
      const file = files[spec.key];
      if (!file) { if (spec.required) return setErr(`Upload the ${rule.label}.`); continue; }
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      if (!rule.ext.includes(ext)) return setErr(`${rule.label}: allowed types are ${rule.ext.join(', ')}.`);
      if (file.size < rule.minSize) return setErr(`${rule.label} is too small (minimum ${fmtSize(rule.minSize)}). Please upload your complete file.`);
      if (file.size > rule.maxSize) return setErr(`${rule.label} is too large (maximum ${fmtSize(rule.maxSize)}).`);
    }
    if (!window.confirm(mode === 'revise' ? 'Submit your revised entry? You cannot edit it later.' : `Submit your Phase ${n} entry? You cannot edit it after submitting.`)) return;
    const fd = new FormData();
    if (domainId) fd.append('domainId', domainId);
    Object.entries(values).forEach(([k, v]) => fd.append(k, v));
    Object.entries(files).forEach(([k, f]) => f && fd.append(k, f));
    setBusy(true);
    try {
      const d = await request(`/api/thinkx/phase/${n}/${mode === 'revise' ? 'revise' : 'submit'}`, { method: 'POST', form: fd });
      onDone(d.submission);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="tx-card">
      <h2 className="tx-h2">{mode === 'revise' ? `Revised entry · ${cfg.title}` : `Submit Phase ${n} · Team ${team.teamName}`}</h2>
      {n === 1 && mode === 'submit' && (
        <div className="tx-twist" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
          <b>Remember:</b> the problem must be something you personally observed on campus, not copied from the internet or an AI-generated list.
        </div>
      )}
      {err && <div className="tx-alert err">{err}</div>}
      <form className="tx-form" onSubmit={submit}>
        {PHASE_FORMS[n].needsDomain && mode === 'submit' && (
          <div className="tx-field">
            <label>Choose a domain <span className="req">*</span></label>
            <div className="tx-grid">
              {domains.map(d => (
                <div key={d.id} role="radio" aria-checked={domainId === d.id} tabIndex={0}
                  className={`tx-domain pick ${domainId === d.id ? 'selected' : ''}`}
                  onClick={() => setDomainId(d.id)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setDomainId(d.id)}>
                  <h4>{domainId === d.id ? '● ' : '○ '}{d.title}</h4>
                  <p>{d.description.length > 160 ? d.description.slice(0, 160) + '…' : d.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {cfg.fields.map((f, i) => (
          <Field key={f.key} label={`${i + 1}. ${f.label}`} req>
            {f.type === 'number' ? (
              <input className="tx-input" type="number" min="0" max={f.max} step="1" value={values[f.key]} placeholder={f.ph} required
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} style={{ maxWidth: 260 }} />
            ) : (
              <textarea className="tx-textarea" value={values[f.key]} placeholder={f.ph} required maxLength={5000}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} />
            )}
          </Field>
        ))}
        {cfg.files.map(spec => {
          const rule = FILE_RULES[spec.key];
          return (
            <Field key={spec.key} label={rule.label} req={spec.required}
              hint={`Allowed: ${rule.ext.join(' ')} · min ${fmtSize(rule.minSize)} · max ${fmtSize(rule.maxSize)}`}>
              <input className="tx-input" type="file" accept={rule.ext.join(',')} required={spec.required}
                onChange={e => setFiles(fs => ({ ...fs, [spec.key]: e.target.files?.[0] || null }))} />
            </Field>
          );
        })}
        <div><button className="tx-btn" type="submit" disabled={busy}>{busy ? 'Submitting…' : mode === 'revise' ? 'Submit revised entry' : `Submit Phase ${n}`}</button></div>
      </form>
    </div>
  );
}

const VIEWABLE = /\.(pdf|png|jpe?g)$/i;

function FileButtons({ subId, files, onError, withPreview, onPreview, compact }) {
  const { download, token } = useAuth();
  const entries = Object.entries(files || {}).filter(([, f]) => f);
  if (!entries.length) return <span className="tx-muted">—</span>;
  // open PDF / image in a new browser tab
  const view = async key => {
    const win = window.open('', '_blank');
    try {
      const res = await fetch(`/api/thinkx/submissions/${subId}/files/${key}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Could not open the file.');
      const url = URL.createObjectURL(await res.blob());
      if (win) win.location.href = url; else window.open(url, '_blank');
    } catch (e) { if (win) win.close(); onError(e.message); }
  };
  if (compact) {
    return (
      <div className="tx-doclist" onClick={e => e.stopPropagation()}>
        {entries.map(([key, f]) => (
          <button key={key} className="tx-link" type="button" style={{ textAlign: 'left', fontSize: '0.82rem' }} title={FILE_RULES[key]?.label}
            onClick={() => download(`/api/thinkx/submissions/${subId}/files/${key}`, f.originalName).catch(e => onError(e.message))}>
            📄 {f.originalName.length > 22 ? f.originalName.slice(0, 19) + '…' : f.originalName}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="tx-row">
      {entries.map(([key, f]) => (
        <span key={key} className="tx-row" style={{ gap: '0.4rem' }}>
          <button className="tx-btn small" type="button" title={FILE_RULES[key]?.label}
            onClick={() => download(`/api/thinkx/submissions/${subId}/files/${key}`, f.originalName).catch(e => onError(e.message))}>
            ⬇ {f.originalName.length > 26 ? f.originalName.slice(0, 23) + '…' : f.originalName}
          </button>
          {withPreview && f.originalName.toLowerCase().endsWith('.docx') && (
            <button className="tx-btn small ghost" type="button" onClick={() => onPreview(key)}>Read here</button>
          )}
          {withPreview && VIEWABLE.test(f.originalName) && (
            <button className="tx-btn small ghost" type="button" onClick={() => view(key)}>View</button>
          )}
          <span className="tx-muted">{fmtSize(f.size)}</span>
        </span>
      ))}
    </div>
  );
}

function SubmissionView({ n, sub }) {
  const [err, setErr] = useState('');
  const form = PHASE_FORMS[n];
  return (
    <div className="tx-card">
      <div className="tx-alert ok">
        ✅ Phase {n} submitted on {fmtDate(sub.submittedAt)}.{sub.isTest ? ' 🧪 Test submission (no priority number).' : ' Your documents are stored safely.'}
      </div>
      <h2 className="tx-h2">Your Phase {n} Submission</h2>
      <dl className="tx-kv">
        {sub.domainTitle && <KV k="Domain" v={sub.domainTitle} />}
        {form.fields.map(f => <KV key={f.key} k={f.label} v={sub.answers[f.key]} />)}
        <dt>Files</dt><dd><FileButtons subId={sub.id} files={sub.files} onError={setErr} /></dd>
      </dl>
      {sub.revision && form.twist && (
        <>
          <h3 className="tx-h3 gold" style={{ marginTop: '1.25rem' }}>Revised entry · {form.twist.title}</h3>
          <p className="tx-muted">Sent {fmtDate(sub.revision.submittedAt)}</p>
          <dl className="tx-kv">
            {form.twist.fields.map(f => <KV key={f.key} k={f.label} v={sub.revision.answers[f.key]} />)}
            {Object.keys(sub.revision.files || {}).length > 0 && (<><dt>Files</dt><dd><FileButtons subId={sub.id} files={sub.revision.files} onError={setErr} /></dd></>)}
          </dl>
        </>
      )}
      {sub.evaluation && (
        <div className="tx-sub gold" style={{ marginTop: '1.25rem' }}>
          <b style={{ color: '#f7c873' }}>Result: {sub.evaluation.result}</b> · {sub.evaluation.points} points
          {sub.evaluation.remarks && <p className="tx-p" style={{ margin: '0.5rem 0 0' }}>{sub.evaluation.remarks}</p>}
        </div>
      )}
      {err && <div className="tx-alert err" style={{ marginTop: '1rem' }}>{err}</div>}
    </div>
  );
}

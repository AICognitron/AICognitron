// Think-X phase pages (Phase 1–4): shows the submission format only.
// Teams write their answers in the Word template and submit through the phase's Google Form.
import { PHASE_FORMS, FILE_RULES, fmtSize, SUBMIT_FORMS, TEMPLATES, DEADLINES } from './thinkxData';
import { Countdown, fmtDate } from './ThinkXUi';

const passed = iso => !!iso && Date.now() > new Date(iso).getTime();

export function PhasePanel({ phase, active, beforeStart }) {
  const n = phase.n;
  const form = PHASE_FORMS[n];
  const deadline = DEADLINES[n];
  const status = beforeStart || n > active ? 'lock' : n < active ? 'done' : 'live';
  const submitLink = SUBMIT_FORMS[n];
  const template = TEMPLATES[n];

  return (
    <>
      <div className={`tx-card tx-plain tx-week ${phase.cls}`} style={{ borderRadius: 25 }}>
        <div className="tx-row" style={{ justifyContent: 'space-between' }}>
          <span className="wk">{phase.week} · PHASE {n}</span>
          <span className={`tx-badge ${status}`}>{status === 'done' ? 'Completed' : status === 'live' ? 'Live now' : 'Upcoming'}</span>
        </div>
        <div className="nm" style={{ fontSize: '2rem' }}>{phase.name}</div>
        <div className="hd" style={{ fontSize: '1.15rem' }}>{phase.heading}</div>
        <p>{phase.text}</p>
        {phase.twist && (
          <div className="tx-twist">
            <b>{phase.twistLabel}:</b> {n === 1 ? phase.twist : 'revealed during the week. Watch this page and the club group.'}
          </div>
        )}
        <div className="award">🏆 {phase.award}</div>
        {deadline && (
          <div className="tx-muted" style={{ marginTop: '0.6rem', color: passed(deadline) ? '#f87171' : '#bbf7d0' }}>
            ⏰ {passed(deadline) ? 'Submissions closed on' : 'Last date to submit:'} {fmtDate(deadline)}
          </div>
        )}
        {status === 'live' && !passed(deadline) && (
          <Countdown to={deadline} label="Time left to submit" doneText="Submissions are closed." compact />
        )}
      </div>

      {/* How to submit */}
      <div className="tx-card">
        <h2 className="tx-h2">How to submit</h2>
        <ol className="tx-ol">
          <li>Download the Phase {n} Word template.</li>
          <li>Fill in every section listed below in the Word document.</li>
          <li>Upload it (and any other files) in the Phase {n} Google Form before the deadline.</li>
        </ol>
        <div className="tx-row" style={{ marginTop: '1rem' }}>
          {template
            ? <a className="tx-btn" href={`/templates/${template}`} download>⬇ Download Word template</a>
            : <span className="tx-btn ghost" aria-disabled="true" style={{ cursor: 'default', opacity: 0.6 }}>Word template coming soon</span>}
          {submitLink
            ? <a className="tx-btn" href={submitLink} target="_blank" rel="noopener noreferrer">Submit Phase {n} (Google Form)</a>
            : <span className="tx-btn ghost" aria-disabled="true" style={{ cursor: 'default', opacity: 0.6 }}>Submission form opens with the phase</span>}
        </div>
      </div>

      {/* Format of the Word document */}
      <div className="tx-card">
        <h2 className="tx-h2">Submission format</h2>
        <p className="tx-muted" style={{ marginTop: '-0.5rem' }}>Your Word document must contain these sections{n === 1 ? ', plus your team name and the domain you chose' : ', plus your team name'}.</p>
        <ol className="tx-format">
          {form.fields.map(f => (
            <li key={f.key}>
              <b>{f.label}</b>
              {f.max ? <span className="tx-muted"> · max ₹{f.max.toLocaleString('en-IN')}</span> : null}
              {f.ph && <div className="tx-muted">{f.ph}</div>}
            </li>
          ))}
        </ol>

        <h3 className="tx-h3" style={{ marginTop: '1.5rem' }}>Files to upload in the Google Form</h3>
        <ul className="tx-list">
          {form.files.map(f => {
            const r = FILE_RULES[f.key];
            return (
              <li key={f.key}>
                <span>{f.required ? '📄' : '📎'}</span>
                <span><b>{r.label}</b> · {f.required ? 'required' : 'optional'} · {r.ext.join(', ')} · max {fmtSize(r.maxSize)}</span>
              </li>
            );
          })}
        </ul>

        {form.twist && (
          <>
            <h3 className="tx-h3 gold" style={{ marginTop: '1.5rem' }}>After the twist · {form.twist.title}</h3>
            <p className="tx-muted" style={{ marginTop: 0 }}>When the twist is revealed, send a revised entry with:</p>
            <ol className="tx-format">
              {form.twist.fields.map(f => (
                <li key={f.key}>
                  <b>{f.label}</b>
                  {f.max ? <span className="tx-muted"> · max ₹{f.max.toLocaleString('en-IN')}</span> : null}
                  {f.ph && <div className="tx-muted">{f.ph}</div>}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </>
  );
}

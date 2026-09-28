import { useEffect, useState } from 'react';

// Small shared pieces for the Think-X pages

export function Field({ label, req, hint, children }) {
  return (
    <div className="tx-field">
      <label>{label} {req && <span className="req">*</span>}</label>
      {children}
      {hint && <span className="tx-muted" style={{ fontSize: '0.8rem' }}>{hint}</span>}
    </div>
  );
}

export function KV({ k, v }) {
  return (<><dt>{k}</dt><dd>{v}</dd></>);
}

export function downloadCsv(filename, rows) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map(r => r.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// value for <input type="datetime-local"> from an ISO string (local time)
export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Live countdown clock (days / hours / minutes / seconds)

export function Countdown({ to, label, doneText, compact }) {
  const target = to ? new Date(to).getTime() : 0;
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!to) return null;
  const left = Math.max(0, target - nowMs);
  if (left === 0) return doneText ? <div className="tx-cd-done">{doneText}</div> : null;
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const p = n => String(n).padStart(2, '0');
  const urgent = left < 24 * 3600000;
  return (
    <div className={`tx-cd ${compact ? 'compact' : ''} ${urgent ? 'urgent' : ''}`} role="timer" aria-live="off">
      {label && <div className="tx-cd-label">{label}</div>}
      <div className="tx-cd-boxes">
        {[[d, 'Days'], [p(h), 'Hours'], [p(m), 'Mins'], [p(s), 'Secs']].map(([v, l]) => (
          <div className="tx-cd-box" key={l}><span className="v">{v}</span><span className="l">{l}</span></div>
        ))}
      </div>
    </div>
  );
}

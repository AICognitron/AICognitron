import { useEffect, useState } from 'react';

// Small shared pieces for the Think-X pages

export const fmtDate = iso => new Date(iso).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
});

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

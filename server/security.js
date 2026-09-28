// Security helpers for the Think-X backend: headers, rate limits, login lockout, file checks.
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

// ---------- security headers ----------
export function securityHeaders({ csp } = {}) {
  return (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    if (csp) res.setHeader('Content-Security-Policy', csp);
    if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
    next();
  };
}

export const SITE_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

// ---------- rate limiting (in memory, per key, sliding window of fixed buckets) ----------
export function rateLimiter() {
  const buckets = new Map();
  setInterval(() => {
    const t = Date.now();
    for (const [k, b] of buckets) if (b.reset < t) buckets.delete(k);
  }, 60_000).unref();
  return function limit({ name, windowMs, max, key, message }) {
    return (req, res, next) => {
      const k = `${name}:${key(req)}`;
      const t = Date.now();
      let b = buckets.get(k);
      if (!b || b.reset < t) { b = { count: 0, reset: t + windowMs }; buckets.set(k, b); }
      b.count += 1;
      if (b.count > max) {
        const wait = Math.ceil((b.reset - t) / 1000);
        res.setHeader('Retry-After', String(wait));
        return res.status(429).json({ error: message || `Too many requests. Please wait ${wait} seconds and try again.` });
      }
      next();
    };
  };
}

// ---------- failed-login lockout ----------
export function loginGuard({ maxFails, lockMs }) {
  const fails = new Map();
  setInterval(() => {
    const t = Date.now();
    for (const [k, v] of fails) if (v.until < t && v.last + lockMs < t) fails.delete(k);
  }, 60_000).unref();
  return {
    // returns seconds remaining if locked, otherwise 0
    locked(key) {
      const v = fails.get(key);
      if (!v || !v.until) return 0;
      const left = v.until - Date.now();
      return left > 0 ? Math.ceil(left / 1000) : 0;
    },
    fail(key) {
      const v = fails.get(key) || { count: 0, until: 0, last: 0 };
      if (v.until && v.until < Date.now()) { v.count = 0; v.until = 0; }
      v.count += 1;
      v.last = Date.now();
      if (v.count >= maxFails) v.until = Date.now() + lockMs;
      fails.set(key, v);
    },
    ok(key) { fails.delete(key); },
  };
}

// constant-time string compare
export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// ---------- file content checks ----------
// Checks that a file really is what its extension says (e.g. a renamed .exe is rejected).
const SIG = {
  zip: [0x50, 0x4b, 0x03, 0x04],               // .docx .pptx .xlsx .zip
  ole: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], // old .doc .ppt .xls
  pdf: [0x25, 0x50, 0x44, 0x46],               // %PDF
  png: [0x89, 0x50, 0x4e, 0x47],
  jpg: [0xff, 0xd8, 0xff],
};
const EXT_KIND = {
  '.docx': ['zip'], '.pptx': ['zip'], '.xlsx': ['zip'], '.zip': ['zip'],
  '.doc': ['ole'], '.ppt': ['ole'], '.xls': ['ole', 'zip'],
  '.pdf': ['pdf'], '.png': ['png'], '.jpg': ['jpg'], '.jpeg': ['jpg'],
  '.csv': ['text'], '.txt': ['text'], '.json': ['text'], '.py': ['text'], '.ipynb': ['text'],
};

export function fileLooksValid(filePath, originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const kinds = EXT_KIND[ext];
  if (!kinds) return false;
  let buf;
  try {
    const fd = fs.openSync(filePath, 'r');
    buf = Buffer.alloc(4096);
    const n = fs.readSync(fd, buf, 0, 4096, 0);
    fs.closeSync(fd);
    buf = buf.subarray(0, n);
  } catch { return false; }
  return kinds.some(k => {
    if (k === 'text') return !buf.includes(0); // plain text has no NUL bytes
    const sig = SIG[k];
    return buf.length >= sig.length && sig.every((b, i) => buf[i] === b);
  });
}

// AI Cognitron – Think-X backend
//   Database: SQLite (server/data/thinkx.db) with automatic hourly backups (server/data/backups)
//   Uploads:  server/uploads/
//   Run:      npm run dev    (development, with the Vite website)
//             npm start      (event day: builds the website and serves everything from this server)
import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { PHASE_FORMS, FILE_RULES, fmtSize } from '../src/thinkxData.js';
import { EVENT_START, DEADLINES, DOMAINS, RESOURCES, TWISTS } from './thinkx-config.js';
import { openStore } from './store.js';
import { securityHeaders, SITE_CSP, rateLimiter, loginGuard, fileLooksValid } from './security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const CONTENT_DIR = path.join(__dirname, 'content'); // datasets / twist files named in thinkx-config.js
const DIST_DIR = path.join(ROOT, 'dist');
const SECRET_FILE = path.join(DATA_DIR, '.secret');
const PORT = Number(process.env.PORT) || 5091;
const SERVE_SITE = process.argv.includes('--serve') || process.env.SERVE_SITE === '1';

// Tester accounts: can open and submit every phase at any time (for testing the full pipeline).
// Their team and entries are marked TEST and get no priority number.
const TESTER_EMAILS = (process.env.TESTER_EMAILS || 'krithikdev25@gmail.com')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(48).toString('hex'), { mode: 0o600 });
const JWT_SECRET = process.env.JWT_SECRET || fs.readFileSync(SECRET_FILE, 'utf8').trim();

const PHASE_NUMS = [1, 2, 3, 4];
const API_VERSION = 8;

// ---------- database ----------
const store = await openStore(DATA_DIR);
const db = store.data;
console.log(`[db] using ${store.kind} → ${path.relative(ROOT, store.file)}`);

// bring older saved data up to date
// ---------- event settings (from server/thinkx-config.js) ----------
const iso = (v, what) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error(`thinkx-config.js: invalid date for ${what}: "${v}"`);
  return d.toISOString();
};
const contentFile = name => {
  if (!name) return null;
  const p = path.join(CONTENT_DIR, path.basename(name));
  if (!fs.existsSync(p)) { console.warn(`[config] file not found: server/content/${path.basename(name)}`); return null; }
  return { path: p, originalName: path.basename(name), size: fs.statSync(p).size };
};
const EVENT = {
  eventStart: iso(EVENT_START, 'EVENT_START'),
  deadlines: Object.fromEntries(PHASE_NUMS.filter(n => DEADLINES[n]).map(n => [n, iso(DEADLINES[n], `phase ${n} deadline`)])),
  domains: DOMAINS.map(d => ({ id: String(d.id), title: d.title, description: d.description })),
  resources: RESOURCES.map(r => ({ id: String(r.id), phase: Number(r.phase), title: r.title, description: r.description || '', file: contentFile(r.file) })),
  twists: Object.fromEntries(Object.entries(TWISTS).map(([n, t]) => [n, { text: t.text, revealAt: iso(t.revealAt, `phase ${n} twist`), file: contentFile(t.file) }])),
};
console.log(`[config] Think-X starts ${EVENT_START}; deadlines ${PHASE_NUMS.map(n => DEADLINES[n] || '-').join(' | ')}`);

db.settings = { ...db.settings }; // old coordinator settings are ignored; the schedule comes from thinkx-config.js
db.counters = { order: {}, ...db.counters };
if (db.counters.phase1Order !== undefined) {
  db.counters.order[1] = Math.max(db.counters.order[1] || 0, db.counters.phase1Order);
  delete db.counters.phase1Order;
}
for (const s of db.submissions) {
  if (!s.answers) {
    s.answers = {};
    for (const f of PHASE_FORMS[1].fields) { s.answers[f.key] = s[f.key] || ''; delete s[f.key]; }
    s.files = s.file ? { abstract: s.file } : {};
    delete s.file;
    s.revision = null;
  }
  s.evaluation = { result: 'Pending', points: 0, marks: null, remarks: '', evaluatedAt: null, ...s.evaluation };
}
store.importAll();

// backups: one at start-up, then every hour (last 48 kept in server/data/backups)
try { store.backup('startup'); } catch (e) { console.warn('[db] backup failed:', e.message); }
setInterval(() => { try { store.backup('hourly'); } catch (e) { console.warn('[db] backup failed:', e.message); } }, 3600_000).unref();

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const clean = (v, max = 5000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const extOf = name => path.extname(name || '').toLowerCase();

// ---------- app ----------
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);
app.use(securityHeaders({ csp: SERVE_SITE ? SITE_CSP : null }));
app.use('/api', express.json({ limit: '200kb' }));

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
}
function verify(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}
function tokenUser(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try { return verify(h.slice(7)); } catch { return null; }
}
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in.' });
  try {
    req.user = verify(token);
    if (req.user.purpose) throw new Error('wrong token');
    if (req.user.role !== 'participant') throw new Error('old token');
    if (!db.users.find(u => u.id === req.user.id)) {
      return res.status(401).json({ error: 'Account not found. Please log in again.' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}
const participantOnly = (req, res, next) =>
  req.user?.role === 'participant' ? next() : res.status(403).json({ error: 'Participant access only.' });
function phaseParam(req, res, next) {
  const n = Number(req.params.n);
  if (!PHASE_NUMS.includes(n)) return res.status(404).json({ error: 'Unknown phase.' });
  req.phase = n;
  next();
}

// ---------- passwords ----------
// New passwords: scrypt (built into Node, runs on background threads, strong against guessing).
// Older bcrypt hashes still work.
const scryptAsync = (pw, salt) => new Promise((resolve, reject) =>
  crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? reject(e) : resolve(k))));
async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(pw, salt);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}
async function checkPassword(pw, stored) {
  if (typeof stored !== 'string') return false;
  if (stored.startsWith('scrypt$')) {
    const [, salt, key] = stored.split('$');
    const got = await scryptAsync(pw, Buffer.from(salt, 'base64'));
    const want = Buffer.from(key, 'base64');
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  }
  return bcrypt.compare(pw, stored);
}
const DUMMY_HASH = 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');

// async route handlers: send errors to the error handler instead of leaving the request hanging
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- rate limits ----------
// Generous per-IP limits (a whole college can share one Wi-Fi IP), tighter per-account limits.
const limit = rateLimiter();
const ipKey = req => req.ip || req.socket.remoteAddress || 'unknown';
const userOrIp = req => tokenUser(req)?.id || ipKey(req);
const RL_OFF = process.env.RATE_LIMIT === 'off';
const rl = opts => (RL_OFF ? (req, res, next) => next() : limit(opts));
// public read-only pages (polled by every open browser) get a much higher per-IP allowance
const PUBLIC_GET = new Set(['/thinkx/state', '/health']);
const apiLimit = rl({ name: 'api', windowMs: 60_000, max: 600, key: userOrIp });
const publicLimit = rl({ name: 'public', windowMs: 60_000, max: 20_000, key: ipKey });
app.use('/api', (req, res, next) => (req.method === 'GET' && PUBLIC_GET.has(req.path) && !tokenUser(req) ? publicLimit : apiLimit)(req, res, next));
const authLimit = rl({ name: 'auth', windowMs: 60_000, max: 300, key: ipKey, message: 'Too many login attempts from this network. Please wait a minute.' });
const uploadLimit = rl({ name: 'upload', windowMs: 10 * 60_000, max: 30, key: userOrIp, message: 'Too many uploads. Please wait a few minutes and try again.' });
const loginFails = loginGuard({ maxFails: 8, lockMs: 15 * 60_000 });

// ---------- helpers ----------
const isTesterEmail = email => TESTER_EMAILS.includes((email || '').toLowerCase());
const isTesterId = userId => isTesterEmail(db.users.find(u => u.id === userId)?.email);
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: 'participant', isTester: isTesterEmail(u.email) });
const isTestTeam = t => !!t && isTesterId(t.userId);
const teamOf = userId => db.teams.find(t => t.userId === userId);
const fileMeta = f => (f ? { originalName: f.originalName, size: f.size } : null);
const filesMeta = files => Object.fromEntries(Object.entries(files || {}).map(([k, f]) => [k, fileMeta(f)]));
const deadlineOf = n => EVENT.deadlines[n] || null;
const deadlinePassed = n => !!deadlineOf(n) && Date.now() > new Date(deadlineOf(n)).getTime();
// a twist is visible once its reveal time has passed
function twistOf(n) {
  const t = EVENT.twists[n];
  if (!t?.revealAt || !t.text || Date.now() < new Date(t.revealAt).getTime()) return null;
  return { text: t.text, file: t.file, revealedAt: t.revealAt };
}
// The live phase: Phase 1 from the start, moving forward automatically once each deadline passes
function livePhase() {
  let p = 1;
  while (p < 4 && deadlinePassed(p)) p += 1;
  return p;
}
const notStarted = () => !!EVENT.eventStart && Date.now() < new Date(EVENT.eventStart).getTime();
const startText = () => new Date(EVENT.eventStart).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
const isUnique = e => /UNIQUE|constraint/i.test(`${e?.code} ${e?.message}`);

function publicSubmission(s) {
  const out = {
    ...s,
    files: filesMeta(s.files),
    revision: s.revision ? { ...s.revision, files: filesMeta(s.revision.files) } : null,
  };
  delete out.order; // submission order is internal
  if (out.revision) delete out.revision.order;
  out.evaluation = s.evaluation?.evaluatedAt
    ? { result: s.evaluation.result, points: s.evaluation.points, remarks: s.evaluation.remarks }
    : null;
  return out;
}

// ---------- uploads ----------
function makeUpload(maxBytes) {
  return multer({
    storage: multer.diskStorage({
      destination: UPLOAD_DIR,
      filename: (req, file, cb) => cb(null, id() + extOf(file.originalname).replace(/[^.a-z0-9]/g, '')),
    }),
    limits: { fileSize: maxBytes, files: 5, fields: 40, fieldSize: 20 * 1024, parts: 50 },
  });
}
const submitUpload = makeUpload(25 * 1024 * 1024);

const uploadedList = req => Object.values(req.files || {}).flat();
const discardUploads = req => uploadedList(req).forEach(f => fs.rm(f.path, () => {}));
const stored = f => ({ stored: path.basename(f.path), originalName: f.originalname.slice(0, 200), size: f.size });
const safeUploadPath = name => {
  const p = path.join(UPLOAD_DIR, path.basename(name));
  return p.startsWith(UPLOAD_DIR) ? p : null;
};

function runUpload(upload, fields) {
  return (req, res, next) => {
    upload.fields(fields)(req, res, err => {
      if (!err) return next();
      discardUploads(req);
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.'
        : err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Unexpected file in the form.'
          : err.code?.startsWith?.('LIMIT_') ? 'The form is too large.'
            : 'Upload failed. Please try again.';
      res.status(400).json({ error: msg });
    });
  };
}

function readAnswers(fields, body) {
  const answers = {};
  for (const f of fields) {
    const v = clean(body[f.key]);
    if (!v) return { error: `"${f.label}" is required.` };
    if (f.type === 'number') {
      const num = Number(v.replace(/[,₹\s]/g, ''));
      if (!Number.isFinite(num) || num < 0) return { error: `"${f.label}" must be a number.` };
      if (f.max && num > f.max) return { error: `"${f.label}" cannot be more than ₹${f.max.toLocaleString('en-IN')}.` };
      answers[f.key] = String(num);
    } else {
      answers[f.key] = v;
    }
  }
  return { answers };
}

// type, real file contents, min/max size, required
function readFiles(fileSpecs, req) {
  const out = {};
  for (const spec of fileSpecs) {
    const rule = FILE_RULES[spec.key];
    const f = req.files?.[spec.key]?.[0];
    if (!f) {
      if (spec.required) return { error: `Upload the ${rule.label}.` };
      continue;
    }
    if (!rule.ext.includes(extOf(f.originalname))) return { error: `${rule.label}: allowed types are ${rule.ext.join(', ')}.` };
    if (f.size < rule.minSize) return { error: `${rule.label} is too small (minimum ${fmtSize(rule.minSize)}). Please upload your complete file.` };
    if (f.size > rule.maxSize) return { error: `${rule.label} is too large (maximum ${fmtSize(rule.maxSize)}).` };
    if (!fileLooksValid(f.path, f.originalname)) return { error: `${rule.label}: this file is damaged or is not really a ${extOf(f.originalname)} file.` };
    out[spec.key] = stored(f);
  }
  return { files: out };
}

// Submission order in a phase (1 = first), stored with each entry. Test entries are counted separately.
const nextOrder = n => {
  db.counters.order[n] = (db.counters.order[n] || 0) + 1;
  return db.counters.order[n];
};

// ---------- auth ----------
app.post('/api/auth/register', authLimit, ah(async (req, res) => {
  const name = clean(req.body.name, 100);
  const email = clean(req.body.email, 200).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 6 || password.length > 128) return res.status(400).json({ error: 'Password must be 6–128 characters.' });
  if (db.users.some(u => u.email === email)) return res.status(409).json({ error: 'This email is already registered. Please log in.' });
  const user = {
    id: id(), name, email,
    passwordHash: await hashPassword(password),
    createdAt: now(), lastLoginAt: now(), loginCount: 1,
  };
  if (db.users.some(u => u.email === email)) return res.status(409).json({ error: 'This email is already registered. Please log in.' });
  try { store.putUser(user); } catch (e) {
    if (isUnique(e)) return res.status(409).json({ error: 'This email is already registered. Please log in.' });
    throw e;
  }
  db.users.push(user);
  res.json({ token: sign({ id: user.id, role: 'participant' }), user: publicUser(user) });
}));

app.post('/api/auth/login', authLimit, ah(async (req, res) => {
  const password = typeof req.body.password === 'string' ? req.body.password.slice(0, 200) : '';
  const email = clean(req.body.email, 200).toLowerCase();
  const key = `user:${email}`;
  const wait = loginFails.locked(key);
  if (wait) return res.status(429).json({ error: `Too many wrong passwords for this email. Try again in ${Math.ceil(wait / 60)} minute(s).` });
  const user = db.users.find(u => u.email === email);
  // always spend the same effort, so response time does not reveal whether an email exists
  const good = await checkPassword(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !good) {
    loginFails.fail(key);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  loginFails.ok(key);
  user.lastLoginAt = now();
  user.loginCount = (user.loginCount || 0) + 1;
  store.putUser(user);
  res.json({ token: sign({ id: user.id, role: 'participant' }), user: publicUser(user) });
}));

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: publicUser(db.users.find(u => u.id === req.user.id)) });
});

// ---------- Think-X public state ----------
app.get('/api/thinkx/state', (req, res) => {
  const v = tokenUser(req);
  const privileged = v?.role === 'participant' && isTesterId(v.id);
  const live = livePhase();
  const started = !notStarted();
  const twists = {};
  for (const n of PHASE_NUMS) {
    const t = twistOf(n);
    twists[n] = t ? { text: t.text, revealedAt: t.revealedAt, file: fileMeta(t.file) } : null;
  }
  res.json({
    apiVersion: API_VERSION,
    activePhase: live,
    eventStart: EVENT.eventStart,
    deadlines: EVENT.deadlines,
    domains: privileged || started ? EVENT.domains : [],
    resources: EVENT.resources
      .filter(r => privileged || (started && r.phase <= live))
      .map(r => ({ ...r, file: fileMeta(r.file) })),
    twists,
    teamCount: db.teams.filter(t => !isTestTeam(t)).length,
    serverTime: now(),
  });
});

// ---------- team registration ----------
app.get('/api/thinkx/team', auth, participantOnly, (req, res) => {
  res.json({ team: teamOf(req.user.id) || null });
});

app.post('/api/thinkx/team', auth, participantOnly, (req, res) => {
  if (teamOf(req.user.id)) return res.status(409).json({ error: 'Your team is already registered.' });
  const b = req.body || {};
  const team = {
    teamName: clean(b.teamName, 100),
    leaderName: clean(b.leaderName, 100),
    leaderEmail: clean(b.leaderEmail, 200).toLowerCase(),
    phone: clean(b.phone, 15).replace(/\D/g, ''),
    college: clean(b.college, 200),
  };
  if (!team.teamName || !team.leaderName || !team.leaderEmail || !team.phone || !team.college) {
    return res.status(400).json({ error: 'Team name, team leader name, email, phone number and college name are mandatory.' });
  }
  if (!EMAIL_RE.test(team.leaderEmail)) return res.status(400).json({ error: 'Enter a valid team leader email.' });
  team.phone = team.phone.slice(-10);
  if (!PHONE_RE.test(team.phone)) return res.status(400).json({ error: 'Enter a valid 10-digit phone number.' });
  if (db.teams.some(t => t.teamName.toLowerCase() === team.teamName.toLowerCase())) {
    return res.status(409).json({ error: 'That team name is already taken.' });
  }
  const count = Number(b.memberCount);
  if (!Number.isInteger(count) || count < 1 || count > 4) return res.status(400).json({ error: 'Number of members must be between 1 and 4.' });
  const members = Array.isArray(b.members) ? b.members.slice(0, count) : [];
  if (members.length !== count) return res.status(400).json({ error: 'Please fill details for every member.' });
  const cleanMembers = [];
  for (let i = 0; i < members.length; i++) {
    const m = members[i] || {};
    const cm = {
      name: clean(m.name, 100),
      email: clean(m.email, 200).toLowerCase(),
      phone: clean(m.phone, 15).replace(/\D/g, ''),
      department: clean(m.department, 100),
      year: clean(m.year, 20),
      registerNo: clean(m.registerNo, 40),
    };
    if (!cm.name || !cm.department || !cm.year || !cm.email) {
      return res.status(400).json({ error: `Member ${i + 1}: name, email, department and year of study are required.` });
    }
    if (!EMAIL_RE.test(cm.email)) return res.status(400).json({ error: `Member ${i + 1}: enter a valid email.` });
    if (cm.phone && !PHONE_RE.test(cm.phone.slice(-10))) return res.status(400).json({ error: `Member ${i + 1}: enter a valid 10-digit phone number.` });
    cleanMembers.push(cm);
  }
  const record = {
    id: id(), userId: req.user.id, ...team,
    memberCount: count, members: cleanMembers,
    registeredAt: now(),
    regNo: isTesterId(req.user.id) ? null : db.teams.filter(t => !isTestTeam(t)).reduce((m, t) => Math.max(m, t.regNo || 0), 0) + 1,
  };
  try { store.putTeam(record); } catch (e) {
    if (isUnique(e)) return res.status(409).json({ error: 'That team name is taken, or your team is already registered.' });
    throw e;
  }
  db.teams.push(record);
  res.json({ team: record });
});

// ---------- phase submissions (participant) ----------
const phaseUploadFields = n => {
  const form = PHASE_FORMS[n];
  const keys = [...form.files, ...(form.twist?.files || [])].map(f => f.key);
  return [...new Set(keys)].map(name => ({ name, maxCount: 1 }));
};

app.get('/api/thinkx/phase/:n/mine', auth, participantOnly, phaseParam, (req, res) => {
  const team = teamOf(req.user.id);
  const sub = team ? db.submissions.find(s => s.teamId === team.id && s.phase === req.phase) : null;
  res.json({ submission: sub ? publicSubmission(sub) : null });
});

app.post('/api/thinkx/phase/:n/submit', auth, participantOnly, phaseParam, uploadLimit,
  (req, res, next) => runUpload(submitUpload, phaseUploadFields(req.phase))(req, res, next),
  (req, res) => {
    const n = req.phase;
    const form = PHASE_FORMS[n];
    const fail = (code, error) => { discardUploads(req); res.status(code).json({ error }); };
    const tester = isTesterId(req.user.id);
    if (!tester) {
      if (notStarted()) return fail(400, `Think-X starts on ${startText()}. Submissions open then.`);
      if (deadlinePassed(n)) return fail(400, `The Phase ${n} deadline has passed. Submissions are closed.`);
      if (livePhase() !== n) return fail(400, `Phase ${n} is not open for submissions.`);
    }
    const team = teamOf(req.user.id);
    if (!team) return fail(400, 'Register your team for Think-X first.');
    if (db.submissions.some(s => s.teamId === team.id && s.phase === n)) return fail(409, `Your team has already submitted for Phase ${n}.`);
    let domain = null;
    if (form.needsDomain) {
      domain = EVENT.domains.find(d => d.id === req.body.domainId);
      if (!domain) return fail(400, 'Choose a domain.');
    }
    const a = readAnswers(form.fields, req.body);
    if (a.error) return fail(400, a.error);
    const f = readFiles(form.files, req);
    if (f.error) return fail(400, f.error);
    const sub = {
      id: id(), phase: n, teamId: team.id, teamName: team.teamName, userId: req.user.id,
      ...(domain ? { domainId: domain.id, domainTitle: domain.title } : {}),
      answers: a.answers, files: f.files,
      submittedAt: now(), order: tester ? nextOrder(`${n}test`) : nextOrder(n), isTest: tester,
      revision: null,
      evaluation: { result: 'Pending', points: 0, marks: null, remarks: '', evaluatedAt: null },
    };
    try {
      store.tx(() => { store.putSub(sub); store.putSettings(); });
    } catch (e) {
      if (isUnique(e)) return fail(409, `Your team has already submitted for Phase ${n}.`);
      discardUploads(req);
      throw e;
    }
    const used = new Set(Object.values(f.files).map(x => x.stored));
    uploadedList(req).forEach(u => { if (!used.has(path.basename(u.path))) fs.rm(u.path, () => {}); });
    db.submissions.push(sub);
    res.json({ submission: publicSubmission(sub) });
  });

// twist: revised submission
app.post('/api/thinkx/phase/:n/revise', auth, participantOnly, phaseParam, uploadLimit,
  (req, res, next) => runUpload(submitUpload, phaseUploadFields(req.phase))(req, res, next),
  (req, res) => {
    const n = req.phase;
    const tw = PHASE_FORMS[n].twist;
    const fail = (code, error) => { discardUploads(req); res.status(code).json({ error }); };
    if (!tw) return fail(400, 'This phase has no twist.');
    const tester = isTesterId(req.user.id);
    if (!tester) {
      if (!twistOf(n)) return fail(400, 'The twist has not been revealed yet.');
      if (deadlinePassed(n)) return fail(400, `The Phase ${n} deadline has passed. Submissions are closed.`);
      if (livePhase() !== n) return fail(400, `Phase ${n} is closed.`);
    }
    const team = teamOf(req.user.id);
    const sub = team && db.submissions.find(s => s.teamId === team.id && s.phase === n);
    if (!sub) return fail(400, 'Submit your main entry first.');
    if (sub.revision) return fail(409, 'You have already submitted your revised entry.');
    const a = readAnswers(tw.fields, req.body);
    if (a.error) return fail(400, a.error);
    const f = readFiles(tw.files, req);
    if (f.error) return fail(400, f.error);
    const used = new Set(Object.values(f.files).map(x => x.stored));
    uploadedList(req).forEach(u => { if (!used.has(path.basename(u.path))) fs.rm(u.path, () => {}); });
    sub.revision = { answers: a.answers, files: f.files, submittedAt: now(), order: tester ? nextOrder(`${n}rtest`) : nextOrder(`${n}r`) };
    store.tx(() => { store.putSub(sub); store.putSettings(); });
    res.json({ submission: publicSubmission(sub) });
  });

// download a submitted file (only the team that owns it)
function sendFile(res, f) {
  const p = f.path || safeUploadPath(f.stored); // config files carry a path; uploads carry a stored name
  if (!p || !fs.existsSync(p)) return res.status(404).json({ error: 'File not found on the server.' });
  res.download(p, f.originalName);
}
function sendSubmissionFile(req, res, key) {
  const s = db.submissions.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found.' });
  if (s.userId !== req.user.id) return res.status(403).json({ error: 'Not allowed.' });
  const f = s.files?.[key] || s.revision?.files?.[key];
  if (!f) return res.status(404).json({ error: 'File not found.' });
  sendFile(res, f);
}
app.get('/api/thinkx/submissions/:id/files/:key', auth, (req, res) => sendSubmissionFile(req, res, req.params.key));
app.get('/api/thinkx/submissions/:id/file', auth, (req, res) => sendSubmissionFile(req, res, 'abstract'));

app.get('/api/thinkx/resources/:id/file', auth, (req, res) => {
  const r = EVENT.resources.find(x => x.id === req.params.id);
  if (!r?.file) return res.status(404).json({ error: 'File not found.' });
  const privileged = isTesterId(req.user.id);
  if (!privileged && (notStarted() || r.phase > livePhase())) return res.status(403).json({ error: 'Not available yet.' });
  sendFile(res, r.file);
});
app.get('/api/thinkx/twist/:n/file', auth, phaseParam, (req, res) => {
  const t = isTesterId(req.user.id) ? EVENT.twists[req.phase] : twistOf(req.phase);
  if (!t?.file) return res.status(404).json({ error: 'File not found.' });
  sendFile(res, t.file);
});


// ---------- health check ----------
app.get('/api/health', (req, res) => res.json({ ok: true, db: store.kind, uptime: Math.round(process.uptime()) }));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// ---------- event-day mode: serve the built website from this server ----------
if (SERVE_SITE) {
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.error('[site] dist/ not found. Run "npm run build" first (npm start does this for you).');
  }
  app.use('/assets', express.static(path.join(DIST_DIR, 'assets'), { immutable: true, maxAge: '30d', fallthrough: true }));
  app.use(express.static(DIST_DIR, { maxAge: '1h', index: false }));
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html'), { headers: { 'Cache-Control': 'no-cache' } }));
}

// ---------- errors never crash the server ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', req.method, req.originalUrl, err?.message || err);
  if (res.headersSent) return;
  const status = err?.type === 'entity.too.large' ? 413 : err?.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ error: status === 500 ? 'Something went wrong on the server. Please try again.' : 'Invalid request.' });
});
process.on('unhandledRejection', e => console.error('[unhandled]', e?.message || e));

const server = app.listen(PORT, () => {
  console.log(`Think-X ${SERVE_SITE ? 'website + API' : 'API'} running on http://localhost:${PORT}`);
}).on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use. Stop the other program using it (lsof -i :${PORT}) and try again.`);
  else console.error(e);
  process.exit(1);
});
server.requestTimeout = 10 * 60_000;  // big uploads on slow Wi-Fi
server.headersTimeout = 65_000;
server.keepAliveTimeout = 61_000;

function shutdown() {
  server.close();
  try { store.close(); } catch { /* ignore */ }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

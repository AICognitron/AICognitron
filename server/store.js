// Think-X data store.
//
// Data lives in a SQLite database (server/data/thinkx.db) using the SQLite built into Node
// (node:sqlite, Node 22.13+) or the better-sqlite3 package. If neither is available the
// store falls back to a JSON file so the site still runs.
//
// All records are also kept in memory for fast reads; every change is written to the
// database immediately (inside a transaction when several rows change together).
// UNIQUE rules in the database stop duplicates even under heavy load:
//   one account per email · one team per account · unique team names · one entry per team per phase
import fs from 'fs';
import path from 'path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users       (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS teams       (id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, name_lc TEXT NOT NULL UNIQUE, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, team_id TEXT NOT NULL, phase INTEGER NOT NULL, data TEXT NOT NULL, UNIQUE(team_id, phase));
CREATE TABLE IF NOT EXISTS domains     (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS resources   (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings    (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_sub_phase ON submissions(phase);
`;

const emptyData = () => ({
  users: [], teams: [], domains: [], resources: [], submissions: [],
  settings: {}, counters: { order: {} },
});

async function openSqlite(file) {
  // hide Node's "SQLite is experimental" warning
  const emit = process.emitWarning;
  process.emitWarning = (w, ...rest) => (String(w?.message || w).includes('SQLite') ? undefined : emit.call(process, w, ...rest));
  const force = process.env.THINKX_DB; // 'node' | 'better' | 'json' (testing only)
  if (force === 'json') return null;
  if (force !== 'better') try {
    const { DatabaseSync } = await import('node:sqlite');
    return { kind: 'SQLite (built into Node)', conn: new DatabaseSync(file) };
  } catch { /* not available in this Node version */ }
  try {
    const Better = (await import('better-sqlite3')).default;
    return { kind: 'SQLite (better-sqlite3)', conn: new Better(file) };
  } catch { /* package not installed */ }
  return null;
}

export async function openStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const backupDir = path.join(dataDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const sqliteFile = path.join(dataDir, 'thinkx.db');
  const jsonFile = path.join(dataDir, 'db.json');

  const opened = await openSqlite(sqliteFile);
  if (opened) return sqliteStore(opened, { sqliteFile, jsonFile, backupDir });
  console.warn('[db] SQLite is not available in this Node.js version — using the JSON file store.');
  console.warn('[db] For the stronger database, update Node.js to 22.13+ (or run: npm install better-sqlite3).');
  return jsonStore({ jsonFile, backupDir });
}

// ---------------------------------------------------------------------------
function sqliteStore({ kind, conn }, { sqliteFile, jsonFile, backupDir }) {
  conn.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;');
  conn.exec(SCHEMA);

  const q = {
    putUser: conn.prepare('INSERT INTO users (id, email, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET email = excluded.email, data = excluded.data'),
    delUser: conn.prepare('DELETE FROM users WHERE id = ?'),
    putTeam: conn.prepare('INSERT INTO teams (id, user_id, name_lc, data) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, name_lc = excluded.name_lc, data = excluded.data'),
    delTeam: conn.prepare('DELETE FROM teams WHERE id = ?'),
    putSub: conn.prepare('INSERT INTO submissions (id, team_id, phase, data) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data'),
    delSub: conn.prepare('DELETE FROM submissions WHERE id = ?'),
    putDomain: conn.prepare('INSERT INTO domains (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data'),
    delDomain: conn.prepare('DELETE FROM domains WHERE id = ?'),
    putResource: conn.prepare('INSERT INTO resources (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data'),
    delResource: conn.prepare('DELETE FROM resources WHERE id = ?'),
    putSetting: conn.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
  };

  const data = emptyData();
  const rows = sql => conn.prepare(sql).all().map(r => JSON.parse(r.data));
  data.users = rows('SELECT data FROM users');
  data.teams = rows('SELECT data FROM teams');
  data.submissions = rows('SELECT data FROM submissions');
  data.domains = rows('SELECT data FROM domains');
  data.resources = rows('SELECT data FROM resources');
  for (const r of conn.prepare('SELECT key, value FROM settings').all()) data[r.key] = JSON.parse(r.value);

  let depth = 0;
  const store = {
    kind,
    data,
    file: sqliteFile,
    // run several writes as one all-or-nothing transaction
    tx(fn) {
      if (depth > 0) return fn();
      depth++;
      conn.exec('BEGIN IMMEDIATE');
      try { const r = fn(); conn.exec('COMMIT'); return r; } catch (e) { try { conn.exec('ROLLBACK'); } catch { /* ignore */ } throw e; } finally { depth--; }
    },
    putUser: u => q.putUser.run(u.id, u.email, JSON.stringify(u)),
    delUser: id => q.delUser.run(id),
    putTeam: t => q.putTeam.run(t.id, t.userId, t.teamName.toLowerCase(), JSON.stringify(t)),
    delTeam: id => q.delTeam.run(id),
    putSub: s => q.putSub.run(s.id, s.teamId, s.phase, JSON.stringify(s)),
    delSub: id => q.delSub.run(id),
    putDomain: d => q.putDomain.run(d.id, JSON.stringify(d)),
    delDomain: id => q.delDomain.run(id),
    putResource: r => q.putResource.run(r.id, JSON.stringify(r)),
    delResource: id => q.delResource.run(id),
    putSettings: () => {
      q.putSetting.run('settings', JSON.stringify(data.settings));
      q.putSetting.run('counters', JSON.stringify(data.counters));
    },
    // copy of the whole database, safe while the site is running
    backup(label = 'auto') {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const out = path.join(backupDir, `thinkx-${stamp}-${label}.db`);
      conn.exec(`VACUUM INTO '${out.replace(/'/g, "''")}'`);
      pruneBackups(backupDir, 48);
      return out;
    },
    close() { try { conn.close(); } catch { /* ignore */ } },
    importAll: () => importAllImpl(store),
    isEmpty: () => !data.users.length && !data.teams.length && !data.submissions.length && !data.domains.length && !data.resources.length && !Object.keys(data.settings).length,
  };

  // first run after the upgrade: bring over everything from the old db.json
  if (store.isEmpty() && fs.existsSync(jsonFile)) {
    let old;
    try { old = JSON.parse(fs.readFileSync(jsonFile, 'utf8')); } catch { old = null; }
    if (old) {
      Object.assign(data, emptyData(), old);
      data.counters = { order: {}, ...(old.counters || {}) };
      store.importAll();
      const moved = `${jsonFile}.migrated-${Date.now()}`;
      fs.renameSync(jsonFile, moved);
      console.log(`[db] moved ${data.users.length} accounts, ${data.teams.length} teams, ${data.submissions.length} submissions from db.json into SQLite (old file kept as ${path.basename(moved)})`);
    }
  }
  return store;
}

// write every in-memory record to the database (used after migrations)
function importAllImpl(store) {
  const d = store.data;
  store.tx(() => {
    d.users.forEach(store.putUser);
    d.teams.forEach(store.putTeam);
    d.submissions.forEach(store.putSub);
    d.domains.forEach(store.putDomain);
    d.resources.forEach(store.putResource);
    store.putSettings();
  });
}

// ---------------------------------------------------------------------------
function jsonStore({ jsonFile, backupDir }) {
  let data = emptyData();
  try { data = { ...emptyData(), ...JSON.parse(fs.readFileSync(jsonFile, 'utf8')) }; } catch { /* new file */ }
  data.counters = { order: {}, ...(data.counters || {}) };
  const write = () => {
    const tmp = `${jsonFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data));
    fs.renameSync(tmp, jsonFile);
  };
  let depth = 0;
  let dirty = false;
  const touch = () => { if (depth > 0) dirty = true; else write(); };
  // uniqueness rules the SQLite version enforces
  const conflict = msg => Object.assign(new Error(msg), { code: 'SQLITE_CONSTRAINT_UNIQUE' });
  const store = {
    kind: 'JSON file',
    data,
    file: jsonFile,
    tx(fn) {
      depth++;
      try { return fn(); } finally { depth--; if (depth === 0 && dirty) { dirty = false; write(); } }
    },
    putUser: u => { if (data.users.some(x => x.email === u.email && x.id !== u.id)) throw conflict('email'); touch(); },
    delUser: () => touch(),
    putTeam: t => {
      if (data.teams.some(x => x.id !== t.id && (x.userId === t.userId || x.teamName.toLowerCase() === t.teamName.toLowerCase()))) throw conflict('team');
      touch();
    },
    delTeam: () => touch(),
    putSub: s => { if (data.submissions.some(x => x.id !== s.id && x.teamId === s.teamId && x.phase === s.phase)) throw conflict('submission'); touch(); },
    delSub: () => touch(),
    putDomain: () => touch(), delDomain: () => touch(),
    putResource: () => touch(), delResource: () => touch(),
    putSettings: () => touch(),
    backup(label = 'auto') {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const out = path.join(backupDir, `db-${stamp}-${label}.json`);
      fs.writeFileSync(out, JSON.stringify(data));
      pruneBackups(backupDir, 48);
      return out;
    },
    close() { /* nothing to close */ },
    importAll: () => write(),
    isEmpty: () => false,
  };
  return store;
}

function pruneBackups(dir, keep) {
  try {
    const files = fs.readdirSync(dir).filter(f => /^(thinkx|db)-/.test(f)).sort();
    files.slice(0, Math.max(0, files.length - keep)).forEach(f => fs.rmSync(path.join(dir, f), { force: true }));
  } catch { /* ignore */ }
}

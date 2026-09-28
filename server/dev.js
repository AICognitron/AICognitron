// Keeps the Think-X backend running.
//  - restarts it automatically if it ever crashes
//  - in development (npm run dev) also restarts it when server code changes
// Usage: node server/dev.js            (development, watches files)
//        node server/dev.js --serve    (event day: serves the built website too, no file watching)
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const serve = process.argv.includes('--serve');
const WATCH = serve ? [] : ['index.js', 'store.js', 'security.js'].map(f => path.join(here, f)).concat(path.join(root, 'src', 'thinkxData.js'));

let child = null;
let stopping = false;
let restarting = false;
let crashes = [];

function start() {
  const args = [path.join(here, 'index.js'), ...(serve ? ['--serve'] : [])];
  child = spawn(process.execPath, args, { stdio: 'inherit', env: process.env });
  child.on('exit', (code, signal) => {
    if (stopping) return;
    if (restarting) { restarting = false; start(); return; }
    // crashed: restart, but back off if it keeps crashing
    const t = Date.now();
    crashes = crashes.filter(c => t - c < 60_000).concat(t);
    const wait = crashes.length > 5 ? 10_000 : 1_000;
    console.log(`[api] backend stopped (${signal || `code ${code}`}). Restarting in ${wait / 1000}s…`);
    setTimeout(start, wait);
  });
}

let timer = null;
function restart() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log('[api] code changed, restarting backend…');
    if (child && child.exitCode === null) { restarting = true; child.kill(); } else start();
  }, 300);
}

for (const file of WATCH) {
  if (fs.existsSync(file)) fs.watchFile(file, { interval: 700 }, (cur, prev) => { if (cur.mtimeMs !== prev.mtimeMs) restart(); });
}

const stop = () => { stopping = true; if (child) child.kill('SIGTERM'); setTimeout(() => process.exit(0), 1500).unref(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

start();

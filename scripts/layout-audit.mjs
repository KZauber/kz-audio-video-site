// Layout audit. Catches what a static check physically cannot: elements that overflow
// their container and horizontal scroll at real breakpoints.
//
// WHY THIS EXISTS
//   audit.mjs reads files. Overflow is a layout fact that only exists once a browser
//   has laid the page out, so "responsive at 375/768/1024/1440" and "no horizontal
//   scroll on mobile" sat in the checklist unenforced. A stated rule with no check is
//   not a rule. This is the check.
//
// HOW IT WORKS
//   Drives the already-installed Edge or Chrome over the DevTools Protocol using
//   Node 22's built-in WebSocket. No puppeteer, no playwright, no downloads, no
//   dependencies. Same zero-install contract as audit.mjs.
//
// USAGE
//   Serve the built site first (astro preview, or any static server), then:
//     node scripts/layout-audit.mjs http://localhost:4321
//     node scripts/layout-audit.mjs http://localhost:4321 /,/about,/services
//
//   Exits non-zero when any page scrolls horizontally, so CI can gate on it.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.argv[2] || '').replace(/\/$/, '');
const RAW_PATHS = (process.argv[3] || '/').split(',').map(s => s.trim()).filter(Boolean);

// Git Bash / MSYS rewrites a leading-slash argument into a Windows path, so
// "/about" silently arrives as "C:/Program Files/Git/about". The old version of this
// script then measured about:blank and reported a clean bill of health, which is the
// worst thing a checking tool can do. Refuse to run instead of lying.
const mangled = RAW_PATHS.filter(p => /^[A-Za-z]:[\\/]/.test(p));
if (mangled.length) {
  console.error('Path arguments were rewritten by the shell (Git Bash/MSYS):');
  mangled.forEach(p => console.error('  ' + p));
  console.error('\nPass paths WITHOUT a leading slash:');
  console.error('  node scripts/layout-audit.mjs http://localhost:4321 about,services');
  console.error('or prefix the command with MSYS_NO_PATHCONV=1');
  process.exit(2);
}
const PATHS = RAW_PATHS;
const WIDTHS = [375, 768, 1024, 1440];
const HEIGHT = 900;
const SETTLE_MS = 700;

if (!BASE) {
  console.error('usage: node scripts/layout-audit.mjs <baseUrl> [comma,separated,paths]');
  console.error('example: node scripts/layout-audit.mjs http://localhost:4321 /,/about');
  process.exit(2);
}

const BROWSERS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
];
const bin = BROWSERS.find(p => existsSync(p));
if (!bin) { console.error('No Edge or Chrome found. Checked:\n' + BROWSERS.join('\n')); process.exit(2); }

const PORT = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'layout-audit-'));
const child = spawn(bin, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function targetWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('browser did not expose a debugging target in 15s');
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      }
    };
    ws.onerror = e => reject(new Error('websocket error: ' + (e.message || 'unknown')));
    ws.onopen = () => resolve({
      send: (method, params = {}) => new Promise((res, rej) => {
        const mid = ++id;
        pending.set(mid, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id: mid, method, params }));
      }),
      close: () => ws.close(),
    });
  });
}

// Runs inside the page. An element only counts as overflowing when nothing above it
// clips: without that filter every deliberate overflow:hidden crop (a scaled hero
// photo, a marquee) reports as a defect and the check gets ignored.
const PROBE = `(() => {
  const vw = window.innerWidth;
  const clipped = el => {
    let p = el.parentElement;
    while (p && p !== document.documentElement) {
      const cs = getComputedStyle(p);
      if (/hidden|clip|auto|scroll/.test(cs.overflowX + cs.overflow)) return true;
      p = p.parentElement;
    }
    return false;
  };
  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    if (b.right <= vw + 2 && b.left >= -2) continue;
    // Wholly off the LEFT edge is the standard visually-hidden pattern (skip-to-content
    // links, screen-reader text at left:-999px). It cannot cause sideways scrolling and
    // nobody sees it clipped. Flagging it failed every page of zaubergroup.com
    // (2026-10-15), and a check that fails correct pages gets switched off.
    // Partly off-screen content (left < 0 < right) is still caught.
    if (b.right <= 0) continue;
    if (getComputedStyle(el).position === 'fixed') continue;
    if (clipped(el)) continue;
    const cls = (typeof el.className === 'string' && el.className.trim())
      ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
    bad.push({ el: el.tagName.toLowerCase() + cls, left: Math.round(b.left), right: Math.round(b.right) });
  }
  // Display type crushed into a narrow column. A ch-based max-width on a WRAPPER
  // resolves against the wrapper's inherited 16px, not the 67px heading inside it,
  // which puts one word per line and leaves the page empty beside it. That shipped
  // once. It causes no overflow, so the checks above cannot see it.
  // Threshold calibrated on both cases: the real bug ran 3.3x (222px box / 67px type),
  // a deliberate short display measure runs 7x, so 4x separates them.
  const cramped = [];
  for (const el of document.querySelectorAll('h1,h2,h3,blockquote')) {
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const w = el.getBoundingClientRect().width;
    if (fs >= 34 && w > 0 && w < fs * 4) {
      const cls = (typeof el.className === 'string' && el.className.trim())
        ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
      cramped.push({ el: el.tagName.toLowerCase() + cls, fontPx: Math.round(fs), boxPx: Math.round(w) });
    }
  }

  return JSON.stringify({
    vw,
    href: location.href,
    cramped,
    scrollW: document.documentElement.scrollWidth,
    horizontalScroll: document.documentElement.scrollWidth > vw + 2,
    overflowing: bad.slice(0, 10)
  });
})()`;

const problems = [];
let cdp;

try {
  cdp = await connect(await targetWs());
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  for (const path of PATHS) {
    const url = BASE + (path.startsWith('/') ? path : '/' + path);
    for (const width of WIDTHS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width, height: HEIGHT, deviceScaleFactor: 1, mobile: width < 768,
      });
      await cdp.send('Page.navigate', { url });
      // Wait for THIS url to be the live document, not just for readyState to say
      // complete. Polling readyState alone passes instantly against the previous
      // page, so the probe measures the old document and every check reports clean.
      // A false clean is the worst output a checking tool can produce.
      const want = url.replace(/\/$/, '');
      let loaded = false;
      for (let i = 0; i < 60; i++) {
        const { result } = await cdp.send('Runtime.evaluate', {
          expression: 'JSON.stringify({rs:document.readyState,href:location.href})',
          returnByValue: true,
        });
        try {
          const s = JSON.parse(result.value);
          if (s.rs === 'complete' && s.href.replace(/\/$/, '') === want) { loaded = true; break; }
        } catch {}
        await sleep(150);
      }
      const where = `${path} @ ${width}px`;
      if (!loaded) {
        problems.push({ sev: 'FAIL', where, msg: `page never finished loading at ${url}` });
        continue;
      }
      await sleep(SETTLE_MS);

      const { result } = await cdp.send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
      const r = JSON.parse(result.value);
      if (r.href.replace(/\/$/, '') !== want) {
        problems.push({ sev: 'FAIL', where, msg: `probe ran against ${r.href}, expected ${url}` });
        continue;
      }

      if (r.horizontalScroll) {
        problems.push({ sev: 'FAIL', where, msg: `horizontal scroll: page is ${r.scrollW}px wide in a ${r.vw}px viewport` });
      }
      for (const c of r.cramped || []) {
        problems.push({ sev: 'FAIL', where, msg: `${c.el} is ${c.fontPx}px type in a ${c.boxPx}px box (under 4 characters per line). Check for a ch max-width on a wrapper instead of on the heading.` });
      }
      for (const o of r.overflowing) {
        problems.push({ sev: r.horizontalScroll ? 'WARN' : 'FAIL', where, msg: `${o.el} overflows its container (left ${o.left}, right ${o.right}, viewport ${r.vw})` });
      }
    }
  }
} catch (err) {
  console.error('layout audit could not run: ' + err.message);
  try { cdp?.close(); } catch {}
  child.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(2);
}

try { cdp.close(); } catch {}
child.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch {}

const fails = problems.filter(p => p.sev === 'FAIL');
const warns = problems.filter(p => p.sev === 'WARN');
console.log('\n=== layout audit ===');
console.log(`Pages: ${PATHS.length}   Widths: ${WIDTHS.join(', ')}`);
console.log(`FAIL: ${fails.length}   WARN: ${warns.length}\n`);
for (const p of [...fails, ...warns]) {
  console.log(`${p.sev === 'FAIL' ? 'X' : '!'} [${p.sev}] ${p.where}\n     ${p.msg}`);
}
if (!problems.length) console.log('All clear. Nothing overflows at any tested width.');
console.log('');
process.exit(fails.length ? 1 : 0);

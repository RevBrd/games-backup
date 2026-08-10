#!/usr/bin/env node
// ============================================================================
// shot.js — screenshot the built game at an EXACT viewport, from the command
// line, with no browser extension and no npm dependency.
//
// Why this exists: the layout is fitted to the window by measurement, so
// looking at it is the only honest test — and the in-app browser preview could
// not give an accurate picture at a chosen size. Locally installed Chrome can,
// via `--headless --screenshot --window-size`, and it costs nothing to use.
//
//   node tools/shot.js out.png
//   node tools/shot.js out.png --size 1366x768
//   node tools/shot.js out.png --size 1920x1080 --board
//   node tools/shot.js out.png --board --seed 12345 --turns 6
//   node tools/shot.js out.png --js "UI.devTab='cards'; render()"
//
// Chrome cannot be told to run a script from the command line, so anything that
// needs a game in progress is injected instead: the built HTML is copied to a
// temp file with a bootstrap <script> appended, and THAT is what gets shot. The
// shipped artifact is never modified and needs no dev hooks of its own.
// ============================================================================

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

function findBrowser() {
  if (process.env.SHADOWLESS_CHROME) return process.env.SHADOWLESS_CHROME;
  for (const c of CHROME_CANDIDATES) if (fs.existsSync(c)) return c;
  return null;
}

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const flag = (name) => process.argv.includes('--' + name);

// --- viewport calibration -----------------------------------------------------
// `--window-size` is NOT the viewport. Headless Chrome reserves room for a
// virtual frame and a scrollbar gutter, so `--window-size=1366,768` renders the
// page at 1348x672 — 96px shorter than asked for, which is more than the whole
// action bar. Every conclusion drawn from an uncalibrated shot is drawn about a
// window nobody has.
//
// The offset was (18, 96) on Chrome 140 in both headless modes, but it is a
// browser implementation detail and baking it in would fail silently the day it
// changes. So we ask, every run: load a page that reports its own innerWidth /
// innerHeight through --dump-dom, and subtract. It costs about two seconds and
// it is the difference between measuring and guessing.
function measureViewport(browser, w, h) {
  const probe = path.join(os.tmpdir(), 'shadowless-vp-probe.html');
  fs.writeFileSync(probe, '<!doctype html><body><b id=v></b><script>' +
    'addEventListener("load",()=>{v.textContent="VP:"+innerWidth+"x"+innerHeight});<\/script>');
  try {
    const dom = execFileSync(browser, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars',
      '--force-device-scale-factor=1', '--virtual-time-budget=1500',
      '--window-size=' + w + ',' + h, '--dump-dom',
      'file:///' + probe.replace(/\\/g, '/'),
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const m = /VP:(\d+)x(\d+)/.exec(dom);
    return m ? { w: +m[1], h: +m[2] } : null;
  } catch (e) {
    return null;
  } finally {
    try { fs.unlinkSync(probe); } catch (e) { /* nothing to clean up */ }
  }
}

// --- what to run in the page before the shot ---------------------------------
// `--board` skips the title screen and deals a real game. Setup is driven the
// same way a player would drive it, so the board it shoots is a legitimate one:
// setupAuto() already confirms, which is why nothing calls setupConfirm here.
function bootstrapScript() {
  const seed = arg('seed', '');
  const turns = parseInt(arg('turns', '0'), 10) || 0;
  const extra = arg('js', '');
  if (!flag('board') && !extra) return '';

  const lines = [];
  if (flag('board')) {
    lines.push(`UI.seedDraft = ${JSON.stringify(String(seed))};`);
    lines.push(`UI.flipDelay = 0;`);          // no flip presentation to wait on
    lines.push(`UI.aiDelay = 30;`);
    lines.push(`startMatch();`);
    lines.push(`UI.E.setupAuto(0);`);
    // Let the AI take its turns synchronously rather than waiting on timers,
    // so a shot of "turn 6" really is turn 6 by the time Chrome captures.
    lines.push(`for (let i = 0; i < ${turns} && UI.E.state.phase === 'main'; i++) {`);
    lines.push(`  const s = UI.E.state;`);
    lines.push(`  const pi = s.pendingPromote !== null ? s.pendingPromote`);
    lines.push(`    : s.pendingSwitch !== null ? s.pendingSwitch : s.active;`);
    lines.push(`  const a = UI.E.aiChoose(pi, 'expert');`);
    lines.push(`  if (!a) break;`);
    lines.push(`  UI.E.act(pi, a);`);
    lines.push(`}`);
    lines.push(`UI.aiDelay = 100000;`);       // freeze the opponent for the shot
    lines.push(`render();`);
  }
  if (extra) lines.push(extra);
  return lines.join('\n');
}

// -----------------------------------------------------------------------------
function main() {
  const out = process.argv[2];
  if (!out || out.startsWith('--')) {
    console.error('usage: node tools/shot.js <out.png> [--size WxH] [--board] [--seed N] [--turns N] [--js "..."]');
    process.exit(2);
  }
  const browser = findBrowser();
  if (!browser) {
    console.error('No Chrome or Edge found. Set SHADOWLESS_CHROME to the executable.');
    process.exit(1);
  }

  const root = path.resolve(__dirname, '..');
  const srcHtml = path.resolve(root, arg('file', 'shadowless.html'));
  if (!fs.existsSync(srcHtml)) { console.error('Missing ' + srcHtml); process.exit(1); }

  const size = arg('size', '1366x768');
  const m = /^(\d+)x(\d+)$/.exec(size);
  if (!m) { console.error('--size wants WxH, e.g. 1366x768'); process.exit(2); }
  const want = { w: +m[1], h: +m[2] };

  // --size is the VIEWPORT the page will see. Ask for it, measure what we got,
  // and correct the window by the shortfall. `--raw` opts out and passes the
  // size straight through as a window size.
  let win = { w: want.w, h: want.h };
  if (!flag('raw')) {
    const probe = measureViewport(browser, want.w, want.h);
    if (!probe) { console.error('Could not calibrate the viewport; re-run with --raw.'); process.exit(1); }
    win = { w: want.w + (want.w - probe.w), h: want.h + (want.h - probe.h) };
  }

  // The temp page must sit BESIDE the real one: card faces are loaded from the
  // relative path assets/cards/, so a copy in the system temp folder would show
  // a board with every scan missing and look like a regression that isn't one.
  const boot = bootstrapScript();
  let pageUrl = 'file:///' + srcHtml.replace(/\\/g, '/');
  let tmp = null;
  if (boot) {
    let html = fs.readFileSync(srcHtml, 'utf8');
    const inject = `<script>window.addEventListener('load',()=>{try{\n${boot}\n}catch(e){document.title='SHOT ERROR: '+e.message;console.error(e);}});<\/script>\n</body>`;
    if (!html.includes('</body>')) { console.error('No </body> in the built file'); process.exit(1); }
    html = html.replace('</body>', inject);
    tmp = path.join(root, '.shot-tmp.html');
    fs.writeFileSync(tmp, html);
    pageUrl = 'file:///' + tmp.replace(/\\/g, '/');
  }

  const outAbs = path.resolve(process.cwd(), out);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });

  try {
    execFileSync(browser, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars',
      '--allow-file-access-from-files',
      '--force-device-scale-factor=1',
      '--virtual-time-budget=' + (arg('wait', '4000')),
      '--window-size=' + win.w + ',' + win.h,
      '--screenshot=' + outAbs,
      pageUrl,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    console.error('Chrome failed: ' + (e.stderr ? String(e.stderr).trim() : e.message));
    process.exit(1);
  } finally {
    if (tmp) fs.unlinkSync(tmp);
  }

  // The PNG comes out at the WINDOW size while the page was laid out at the
  // viewport size, so Chrome stretches the bitmap on the way out — and because
  // the frame is 96px tall against an 18px scrollbar gutter, it stretches more
  // vertically than horizontally. The layout is exact; the IMAGE is not square.
  // Judge proportion from the DEV tab's readout, not by eye off the PNG.
  const kb = (fs.statSync(outAbs).size / 1024).toFixed(0);
  if (flag('raw')) {
    console.log(`${outAbs}  ${want.w}x${want.h} window, viewport UNKNOWN  ${kb} KB`);
  } else {
    const sx = (win.w / want.w), sy = (win.h / want.h);
    const skew = Math.abs(sy - sx) > 0.01
      ? `  [image stretched ${sx.toFixed(3)}x wide / ${sy.toFixed(3)}x tall]` : '';
    console.log(`${outAbs}  laid out at ${want.w}x${want.h}, image ${win.w}x${win.h}${skew}  ${kb} KB`);
  }
}

main();

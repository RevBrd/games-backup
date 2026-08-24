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
const path = require('path');
// Finding the browser, calibrating the viewport, staging the page beside the
// real one and launching it — all four moved to lib/chrome.js on 23 Aug 2026,
// when probe.js needed exactly the same four things. The comments moved with
// them; nothing here behaves differently, and the viewport is still calibrated
// on every run rather than assumed.
const C = require('./lib/chrome.js');

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const flag = (name) => process.argv.includes('--' + name);

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
  const browser = C.findBrowser();
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
  const cal = C.calibrate(browser, want, flag('raw'));
  if (!cal) { console.error('Could not calibrate the viewport; re-run with --raw.'); process.exit(1); }
  const win = cal.win;

  let staged;
  try { staged = C.stagePage(root, srcHtml, bootstrapScript()); }
  catch (e) { console.error(e.message); process.exit(1); }

  const outAbs = path.resolve(process.cwd(), out);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });

  try {
    C.launch(browser, { url: staged.url, win, wait: arg('wait', '4000'), mode: 'shot', out: outAbs });
  } catch (e) {
    console.error('Chrome failed: ' + (e.stderr ? String(e.stderr).trim() : e.message));
    process.exit(1);
  } finally {
    staged.cleanup();
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

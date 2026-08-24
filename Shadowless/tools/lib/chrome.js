// ============================================================================
// chrome.js — the headless-Chrome plumbing shared by shot.js and probe.js.
//
// Extracted on 23 Aug 2026 when a second tool needed to drive the built file in
// a real browser. Everything in here was written for `shot.js` and every comment
// records something that cost a session; none of it is new. The one rule worth
// restating at the top: **`--window-size` is not the viewport**, and a tool that
// assumes it is measures a window nobody has.
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

// Ask for a viewport, measure what the window actually gave us, and correct the
// window by the shortfall. Returns { win, want } — `win` is what to hand Chrome.
function calibrate(browser, want, raw) {
  if (raw) return { win: { w: want.w, h: want.h }, want };
  const probe = measureViewport(browser, want.w, want.h);
  if (!probe) return null;
  return { win: { w: want.w + (want.w - probe.w), h: want.h + (want.h - probe.h) }, want };
}

// The temp page must sit BESIDE the real one: card faces load from the relative
// path assets/cards/, so a copy in the system temp folder would show a board
// with every scan missing and look like a regression that isn't one. The
// shipped artifact is never modified and needs no dev hooks of its own.
//
// Returns { url, cleanup }.
function stagePage(root, srcHtml, boot) {
  if (!boot) return { url: 'file:///' + srcHtml.replace(/\\/g, '/'), cleanup: () => {} };
  let html = fs.readFileSync(srcHtml, 'utf8');
  const inject = `<script>window.addEventListener('load',()=>{try{\n${boot}\n}catch(e){document.title='PAGE ERROR: '+e.message;console.error(e);}});<\/script>\n</body>`;
  if (!html.includes('</body>')) throw new Error('No </body> in the built file');
  html = html.replace('</body>', inject);
  const tmp = path.join(root, '.shot-tmp.html');
  fs.writeFileSync(tmp, html);
  return {
    url: 'file:///' + tmp.replace(/\\/g, '/'),
    cleanup: () => { try { fs.unlinkSync(tmp); } catch (e) { /* already gone */ } },
  };
}

// mode 'shot' writes a PNG to `out`; mode 'dom' returns the serialised DOM.
function launch(browser, { url, win, wait, mode, out }) {
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--allow-file-access-from-files',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=' + (wait || 4000),
    '--window-size=' + win.w + ',' + win.h,
    mode === 'dom' ? '--dump-dom' : '--screenshot=' + out,
    url,
  ];
  return execFileSync(browser, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', mode === 'dom' ? 'pipe' : 'ignore', 'pipe'],
  });
}

module.exports = { findBrowser, measureViewport, calibrate, stagePage, launch };

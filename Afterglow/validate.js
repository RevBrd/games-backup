#!/usr/bin/env node
// Afterglow — headless validation harness.
//   node validate.js
// Extracts the game script from afterglow.html, runs it against DOM/canvas stubs,
// drives real frames, and asserts on what the canvas was actually asked to draw.
// The 2D context stub rejects NaN/Infinity on every numeric argument, so a broken
// motion model surfaces here as a hard failure instead of an invisible blank frame.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = path.join(__dirname, 'afterglow.html');
const results = [];
let failed = 0;

function check(name, fn){
  try {
    const note = fn();
    results.push(['PASS', name, note || '']);
  } catch (err){
    failed++;
    results.push(['FAIL', name, err.message]);
  }
}
function assert(cond, msg){ if (!cond) throw new Error(msg); }

// ---------------------------------------------------------------- source
const html = fs.readFileSync(FILE, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m){ console.error('No <script> block found in afterglow.html'); process.exit(1); }
const code = m[1];

check('script block extracted', () => `${code.split('\n').length} lines`);
check('parses as JavaScript', () => { new vm.Script(code, { filename: 'afterglow.js' }); });
check('single self-contained file (no external fetches)', () => {
  const bad = html.match(/<script[^>]+src=|<link[^>]+href="https?:|fetch\s*\(|XMLHttpRequest|import\s+.*from/);
  assert(!bad, `found external dependency: ${bad && bad[0]}`);
});
check('title renamed to AFTERGLOW', () => {
  assert(!/halation/i.test(html), 'stale HALATION reference remains');
  assert(/<title>AFTERGLOW<\/title>/.test(html), 'missing <title>AFTERGLOW</title>');
});

// ---------------------------------------------------------------- stubs
const draws = { fillRect:0, arc:0, fill:0, stroke:0, gradients:0, total:0 };
let numberViolation = null;

function num(where, v){
  if (typeof v === 'number' && !Number.isFinite(v) && !numberViolation){
    numberViolation = `${where} received ${v}`;
  }
  return v;
}
function guard(where, args){ for (const a of args) num(where, a); }

function makeCtx(){
  const grad = { addColorStop(){} };
  const ctx = {
    canvas: null,
    setTransform(){}, save(){}, restore(){}, translate(){}, rotate(){}, scale(){}, clip(){},
    beginPath(){}, closePath(){}, moveTo(...a){ guard('moveTo', a); }, lineTo(...a){ guard('lineTo', a); },
    createRadialGradient(...a){ guard('createRadialGradient', a); draws.gradients++; return grad; },
    createLinearGradient(...a){ guard('createLinearGradient', a); draws.gradients++; return grad; },
    fillRect(...a){ guard('fillRect', a); draws.fillRect++; draws.total++; },
    strokeRect(...a){ guard('strokeRect', a); draws.total++; },
    clearRect(...a){ guard('clearRect', a); },
    rect(...a){ guard('rect', a); },
    arc(...a){ guard('arc', a); draws.arc++; },
    ellipse(...a){ guard('ellipse', a); },
    fill(){ draws.fill++; draws.total++; },
    stroke(){ draws.stroke++; draws.total++; },
    fillText(t, ...a){ guard('fillText', a); draws.total++; },
    drawImage(img, ...a){ guard('drawImage', a); draws.total++; },
    measureText(){ return { width: 10 }; },
    setLineDash(){},
  };
  // style properties: catch a NaN baked into an rgba() string, which canvas
  // silently ignores at runtime and which is exactly how a bad alpha hides.
  for (const p of ['fillStyle','strokeStyle','shadowColor','font','textAlign','lineCap','globalCompositeOperation']){
    let v = '';
    Object.defineProperty(ctx, p, {
      get(){ return v; },
      set(nv){
        if (typeof nv === 'string' && /NaN|Infinity|undefined/.test(nv) && !numberViolation){
          numberViolation = `${p} set to "${nv}"`;
        }
        v = nv;
      }
    });
  }
  for (const p of ['lineWidth','shadowBlur','globalAlpha']){
    let v = 1;
    Object.defineProperty(ctx, p, { get(){ return v; }, set(nv){ num(p, nv); v = nv; } });
  }
  return ctx;
}

function makeEl(id){
  const handlers = {};
  const el = {
    id, textContent: '', innerHTML: '', width: 0, height: 0,
    style: {}, dataset: {},
    classList: {
      _s: new Set(),
      add(c){ this._s.add(c); }, remove(c){ this._s.delete(c); },
      contains(c){ return this._s.has(c); }, toggle(c){ this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
    },
    addEventListener(type, fn){ (handlers[type] = handlers[type] || []).push(fn); },
    removeEventListener(){},
    getBoundingClientRect(){ return { left: 0, top: 0, width: 960, height: 600 }; },
    getContext(){ return el._ctx || (el._ctx = makeCtx()); },
    querySelector(){ return null; }, closest(){ return null; },
    _fire(type, evt){
      const list = handlers[type] || [];
      for (const fn of list) fn(Object.assign({ target: el, preventDefault(){}, stopPropagation(){} }, evt));
      return list.length;
    },
    _handlers: handlers
  };
  return el;
}

const els = new Map();
function getEl(id){ if (!els.has(id)) els.set(id, makeEl(id)); return els.get(id); }

const winHandlers = {};
let rafPending = null;
let clock = 0;

const sandbox = {
  console,
  Math, JSON, Set, Map, Array, Object, String, Number, Boolean, Date, Float32Array, Infinity, NaN,
  document: {
    getElementById: getEl,
    addEventListener(){}, querySelector(){ return null; },
    createElement(){ return makeEl('created'); }
  },
  window: {
    innerWidth: 1280, innerHeight: 900, devicePixelRatio: 2,
    addEventListener(type, fn){ (winHandlers[type] = winHandlers[type] || []).push(fn); }
  },
  performance: { now(){ return clock; } },
  requestAnimationFrame(fn){ rafPending = fn; return 1; }
};
sandbox.globalThis = sandbox;
sandbox.self = sandbox;

function fireWindow(type, evt){
  const list = winHandlers[type] || [];
  for (const fn of list) fn(Object.assign({ preventDefault(){}, stopPropagation(){} }, evt));
  return list.length;
}
// Advance the real rAF loop by `n` frames of `ms` each.
function step(n, ms = 16.667){
  for (let i = 0; i < n; i++){
    if (!rafPending) throw new Error('animation loop stopped requesting frames');
    const fn = rafPending; rafPending = null;
    clock += ms;
    fn(clock);
  }
}
function snapshotDraws(){ const s = { ...draws }; return s; }
function resetDraws(){ for (const k of Object.keys(draws)) draws[k] = 0; }

// ---------------------------------------------------------------- run
check('executes against DOM stubs', () => {
  vm.createContext(sandbox);
  new vm.Script(code, { filename: 'afterglow.js' }).runInContext(sandbox);
});
check('canvas sized by fit()', () => {
  const c = getEl('c');
  assert(c.width === 1920 && c.height === 1200, `expected 1920x1200 backing store, got ${c.width}x${c.height}`);
  return `${c.width}x${c.height} @dpr2`;
});
check('animation loop started', () => { assert(rafPending, 'no requestAnimationFrame after init'); });

check('menu renders without drawing garbage', () => {
  step(5);
  assert(!numberViolation, numberViolation);
});

check('game starts from overlay click', () => {
  const n = getEl('overlay')._fire('pointerdown', {});
  assert(n > 0, 'overlay has no pointerdown handler');
  step(30);
  assert(!numberViolation, numberViolation);
});

check('60s of live play stays finite', () => {
  step(3600);
  assert(!numberViolation, numberViolation);
  return '3600 frames';
});

// ---------------------------------------------------------------- thermite
check('dev panel toggles with backtick', () => {
  const n = fireWindow('keydown', { key: '`' });
  assert(n > 0, 'no window keydown handler');
  assert(getEl('dev').style.display === 'block', 'dev panel did not open');
});

let peakFrameDraws = 0;
check('T releases a thermite burst', () => {
  resetDraws();
  step(1);
  const before = snapshotDraws().total;
  fireWindow('keydown', { key: 'T' });
  resetDraws();
  step(1);
  const after = snapshotDraws().total;
  assert(after > before + 100, `expected a large draw spike after release, got ${after} vs baseline ${before}`);
  assert(!numberViolation, numberViolation);
  return `${after} draw calls on the release frame`;
});

check('thermite motion stays finite through a full fall', () => {
  // The curtain falls slowly by design; give it well past the longest mote life.
  for (let i = 0; i < 1200; i++){
    resetDraws();
    step(1);
    peakFrameDraws = Math.max(peakFrameDraws, snapshotDraws().total);
    if (numberViolation) break;
  }
  assert(!numberViolation, numberViolation);
  return `peak ${peakFrameDraws} draw calls/frame`;
});

check('draw cost per frame stays affordable', () => {
  // ~190 motes x ~42 trail beads + heads + flecks. Well under this ceiling means
  // the batched-palette approach is holding; blowing past it means a rewrite.
  assert(peakFrameDraws < 16000, `peak ${peakFrameDraws} draw calls/frame is too high`);
  assert(peakFrameDraws > 2000, `peak ${peakFrameDraws} suggests the curtain never actually rendered`);
});

check('thermite drains completely (no leaked motes)', () => {
  fireWindow('keydown', { key: '`' });   // reopen dev readout path
  step(600);
  resetDraws();
  step(1);
  const idle = snapshotDraws().total;
  assert(idle < 2000, `still drawing ${idle} calls/frame long after the burst — motes are leaking`);
  return `idle baseline ${idle} draw calls/frame`;
});

check('repeated bursts do not accumulate', () => {
  fireWindow('keydown', { key: '`' });
  for (let i = 0; i < 6; i++){ fireWindow('keydown', { key: 'T' }); step(40); }
  step(1500);
  resetDraws();
  step(1);
  const idle = snapshotDraws().total;
  assert(!numberViolation, numberViolation);
  assert(idle < 2000, `${idle} draw calls/frame after six bursts drained — leak`);
  return `six bursts drained to ${idle}`;
});

check('no orphaned wavebreak code', () => {
  assert(!/wavebreak|waveBreakHTML|breakTimer|waveBonus/.test(code), 'dead wave-break code still present');
});

// ---------------------------------------------------------------- report
const w = Math.max(...results.map(r => r[1].length));
console.log('');
for (const [status, name, note] of results){
  const tag = status === 'PASS' ? '  ok  ' : ' FAIL ';
  console.log(`${tag} ${name.padEnd(w)}  ${note}`);
}
console.log('');
console.log(failed ? `${failed} check(s) failed.` : `All ${results.length} checks passed.`);
process.exit(failed ? 1 : 0);

/* Headless validation harness for combat-circuit.html
   1. syntax  2. loads under DOM stubs  3. logic  4. integration  */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = path.join(__dirname, 'combat-circuit.html');
const html = fs.readFileSync(FILE, 'utf8');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')); }
}
function section(s){ console.log('\n=== ' + s + ' ==='); }

/* ---------- 1. extract + syntax ---------- */
section('1. syntax');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
ok('script block found', !!m);
const src = m[1];
try { new Function(src); ok('parses as valid JS', true); }
catch (e) { ok('parses as valid JS', false, e.message); process.exit(1); }

/* ---------- 2. DOM stubs ---------- */
section('2. loads under DOM stubs');

function stubCtx() {
  const noop = () => {};
  const c = {
    canvas: { width: 900, height: 600 },
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop,
    ellipse: noop, rect: noop, clip: noop, fill: noop, stroke: noop,
    fillRect: noop, strokeRect: noop, fillText: noop, strokeText: noop,
    quadraticCurveTo: noop, setLineDash: noop,
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
    measureText: () => ({ width: 10 }),
  };
  return c;
}
function stubEl(tag) {
  const el = {
    tagName: (tag || 'DIV').toUpperCase(),
    value: '', textContent: '', innerHTML: '', checked: false,
    dataset: {}, style: {},
    classList: { _s: new Set(), add(x){this._s.add(x);}, remove(x){this._s.delete(x);},
                 toggle(x,f){ f ? this._s.add(x) : this._s.delete(x); },
                 contains(x){ return this._s.has(x); } },
    _handlers: {},
    addEventListener(t, fn) { (this._handlers[t] = this._handlers[t] || []).push(fn); },
    removeEventListener(){},
    querySelector(){ return stubEl(); },
    querySelectorAll(){ return []; },
    getContext(){ return stubCtx(); },
    appendChild(){}, focus(){}, click(){},
  };
  return el;
}
const elCache = {};
const documentStub = {
  querySelector(sel) {
    if (!elCache[sel]) {
      const e = stubEl(sel === '#cv' ? 'canvas' : 'div');
      elCache[sel] = e;
    }
    return elCache[sel];
  },
  querySelectorAll(){ return []; },
  addEventListener(){},
  createElement(t){ return stubEl(t); },
};

let rafCount = 0;
const sandbox = {
  document: documentStub,
  window: {},
  performance: { now: () => Date.now() },
  requestAnimationFrame: (fn) => { rafCount++; return 0; },  // never actually ticks
  console,
  Math, Date, JSON, String, Number, Array, Object, Error, parseInt, parseFloat, isNaN,
  setTimeout: (fn) => { return 0; },
  module: { exports: {} },
};
sandbox.globalThis = sandbox;
sandbox.window = sandbox;

let API = null;
try {
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'combat-circuit.js' });
  API = sandbox.module.exports;
  ok('script executes with DOM stubs', true);
} catch (e) {
  ok('script executes with DOM stubs', false, e.stack.split('\n').slice(0,3).join(' | '));
  process.exit(1);
}
ok('module exports populated', API && !!API.runHeadless);
ok('boot requested an animation frame', rafCount > 0);

const { T, PARTS, makeWorld, stepWorld, runHeadless, buildWeight, CHIPS, judge,
        integrityFrac, driveStats } = API;

/* ---------- 3. logic ---------- */
section('3. logic');

ok('catalog groups present',
   ['chassis','drive','weapon','armor','module','chip'].every(k => PARTS[k] && Object.keys(PARTS[k]).length));

// every part definition has the fields the sim reads
let defOk = true, defWhy = '';
for (const g of Object.keys(PARTS)) for (const k of Object.keys(PARTS[g])) {
  const d = PARTS[g][k];
  if (typeof d.n !== 'string' || typeof d.wt !== 'number') { defOk = false; defWhy = g+'.'+k; }
  if (g !== 'chassis' && typeof d.hp !== 'number') { defOk = false; defWhy = g+'.'+k+' hp'; }
}
ok('every part def has n/wt/hp', defOk, defWhy);

// weapon types the sim actually handles
const HANDLED = ['none','wedge','saw','spinner','hammer','flipper'];
ok('all weapon types are handled by resolveWeapons',
   Object.values(PARTS.weapon).every(w => HANDLED.includes(w.type)),
   Object.values(PARTS.weapon).filter(w=>!HANDLED.includes(w.type)).map(w=>w.n).join(','));

// every chip id maps to an implemented function
ok('every chip fn exists',
   Object.values(PARTS.chip).every(c => typeof CHIPS[c.fn] === 'function'),
   Object.values(PARTS.chip).filter(c=>!CHIPS[c.fn]).map(c=>c.n).join(','));

const bTest = {name:'T', team:0, chassis:'boxframe', drive:'chain', w1:'drum', w2:'wedge',
               armor:'sheet', module:'none', chip:'charger'};
const expected = 34 + 12*2 + 26 + 10 + 8 + 2;
ok('buildWeight arithmetic', buildWeight(bTest) === expected,
   buildWeight(bTest) + ' vs ' + expected);

// a stock build fits inside its chassis capacity
ok('reference build is within capacity', buildWeight(bTest) <= PARTS.chassis.boxframe.cap,
   buildWeight(bTest)+'/'+PARTS.chassis.boxframe.cap);

/* ---------- 4. integration ---------- */
section('4. integration — headless matches');

function mk(name, team, over) {
  return Object.assign({name, team, chassis:'boxframe', drive:'chain', w1:'saw', w2:'none',
                        armor:'sheet', module:'none', chip:'charger'}, over || {});
}

// 4a. matches terminate and produce a legal result
let terminated = 0, nanSeen = false, badResult = 0, tooLong = 0;
const HOWS = {};
const chipIds = Object.keys(PARTS.chip);
const weapIds = Object.keys(PARTS.weapon).filter(k => k !== 'none');
let n = 0;
for (let i = 0; i < 240; i++) {
  const a = mk('A',0,{ w1: weapIds[i % weapIds.length], chip: chipIds[i % chipIds.length] });
  const b = mk('B',1,{ w1: weapIds[(i+3) % weapIds.length], chip: chipIds[(i+2) % chipIds.length] });
  const { result, world } = runHeadless([a,b], 5000 + i, 60);
  n++;
  if (world.over) terminated++;
  if (![-1,0,1].includes(result.winner)) badResult++;
  if (result.t > 60.5) tooLong++;
  HOWS[result.how] = (HOWS[result.how] || 0) + 1;
  for (const bot of world.bots) {
    if (!isFinite(bot.x) || !isFinite(bot.y) || !isFinite(bot.ang) ||
        !isFinite(bot.vx) || !isFinite(bot.vy) || !isFinite(bot.av)) nanSeen = true;
  }
}
ok('all ' + n + ' matches terminated', terminated === n, terminated + '/' + n);
ok('no NaN/Infinity in bot state', !nanSeen);
ok('every result has a legal winner', badResult === 0, badResult + ' bad');
ok('no match ran past the clock', tooLong === 0, tooLong + ' overran');
console.log('        outcomes: ' + JSON.stringify(HOWS));

// 4b. all three win conditions are reachable
ok('knockouts occur',        (HOWS['KNOCKOUT'] || 0) > 0);
ok('judges decisions occur', (HOWS['JUDGES\u2019 DECISION'] || 0) > 0);
ok('no TIMEOUT escapes',     !(HOWS['TIMEOUT'] > 0), (HOWS['TIMEOUT']||0) + ' timeouts');

ok('immobilisations occur in the matrix', (HOWS['IMMOBILISATION'] || 0) > 0);
console.log('        avg match length: ' + (
  (() => { let s=0,c=0; for (let i=0;i<60;i++){ const r=runHeadless(
      [mk('A',0,{w1:weapIds[i%weapIds.length]}), mk('B',1,{w1:weapIds[(i+3)%weapIds.length]})],
      6000+i, 60).result; s+=r.t; c++; } return (s/c).toFixed(1); })()
) + 's of 60s');

// count-out mechanism, tested directly rather than hoped for
{
  const w = makeWorld([mk('LIVE',0,{w1:'none',chip:'coward'}),
                       mk('DEAD',1,{w1:'none',chip:'coward'})], 4242, {headless:true});
  const victim = w.bots[1];
  for (const p of victim.parts) if (p.kind === 'drive') { p.hp = 0; p.dead = true; }
  ok('a bot with no live drive is immobile', driveStats(victim).live === 0);
  let steps = 0;
  while (!w.over && steps < T.MAX_STEPS) { stepWorld(w, T.DT); steps++; }
  ok('immobile bot is counted out', victim.countedOut, 'countT=' + victim.countT.toFixed(1));
  ok('count-out ends the match as IMMOBILISATION',
     w.result.how === 'IMMOBILISATION' && w.result.winner === 0, JSON.stringify(w.result));
  ok('count-out takes about COUNT_SEC seconds',
     w.result.t > T.COUNT_SEC && w.result.t < T.COUNT_SEC + 4, w.result.t.toFixed(1) + 's');
}

// losing half your drives should bias steering, not stop the bot
{
  const w = makeWorld([mk('LIMP',0,{chassis:'boxframe',drive:'chain'}),
                       mk('FOE',1)], 55, {headless:true});
  const limp = w.bots[0];
  const oneDrive = limp.parts.filter(p => p.kind === 'drive');
  oneDrive[0].hp = 0; oneDrive[0].dead = true;
  ok('half-drive bot still mobile', driveStats(limp).live === 1);
  ok('half-drive bot has a steering bias', driveStats(limp).bias !== 0);
}

// 4c. determinism
const dA = mk('A',0,{w1:'drum',chip:'circler'}), dB = mk('B',1,{w1:'hammer',chip:'wedgeDoc'});
const r1 = runHeadless([dA,dB], 424242, 60).result;
const r2 = runHeadless([dA,dB], 424242, 60).result;
ok('same seed -> same result',
   r1.winner === r2.winner && r1.how === r2.how && Math.abs(r1.t - r2.t) < 1e-9,
   JSON.stringify(r1) + ' vs ' + JSON.stringify(r2));
const r3 = runHeadless([dA,dB], 424243, 60).result;
ok('different seed -> sim actually varies', r3.t !== r1.t || r3.winner !== r1.winner);

// 4d. every chip runs without throwing, in a 3v3 (N-vs-M capability)
let chipErr = '';
for (const c of chipIds) {
  try {
    const team = [mk('X1',0,{chip:c}), mk('X2',0,{chip:c, chassis:'roller'}),
                  mk('Y1',1,{chip:'charger'}), mk('Y2',1,{chip:'scavenger'}),
                  mk('Y3',1,{chip:'circler', chassis:'rollerLT'})];
    const { result, world } = runHeadless(team, 777, 60);
    if (world.bots.length !== 5) chipErr = c + ': wrong bot count';
    if (![-1,0,1].includes(result.winner)) chipErr = c + ': bad winner';
  } catch (e) { chipErr = c + ': ' + e.message; }
}
ok('all chips survive a 3v2 team fight', chipErr === '', chipErr);

// 4e. team win condition respects multiple bots
{
  const team = [mk('A1',0), mk('A2',0), mk('B1',1)];
  const { world } = runHeadless(team, 31337, 60);
  ok('N-vs-M world builds the right roster', world.bots.length === 3 &&
     world.bots.filter(b=>b.team===0).length === 2);
}

// 4f. sanity direction check — a real weapon should beat no weapon
{
  let armed = 0, N = 100;
  for (let i = 0; i < N; i++) {
    const a = mk('ARMED',0,{ w1:'drum', chip:'charger' });
    const b = mk('UNARMED',1,{ w1:'none', chip:'charger' });
    if (runHeadless([a,b], 900 + i, 60).result.winner === 0) armed++;
  }
  ok('armed bot beats unarmed bot >80%', armed / N > 0.8, (armed/N*100).toFixed(0) + '%');
}

// 4g. weight/mobility relationship — a heavy frame on tiny drives should be sluggish
{
  const w = makeWorld([mk('SLOW',0,{chassis:'leviathan', drive:'caster'}),
                       mk('FAST',1,{chassis:'rollerLT', drive:'hub'})], 11, {headless:true});
  const slow = w.bots[0], fast = w.bots[1];
  for (let i = 0; i < 240; i++) stepWorld(w, T.DT);   // 2 seconds
  const sSlow = Math.hypot(slow.vx, slow.vy), sFast = Math.hypot(fast.vx, fast.vy);
  ok('heavy+weak drive is slower than light+strong', sFast > sSlow,
     sFast.toFixed(0) + ' vs ' + sSlow.toFixed(0));
}

// 4h. perf — the batch tool needs to be usable
{
  const t0 = Date.now();
  for (let i = 0; i < 200; i++) runHeadless([mk('A',0,{w1:'drum'}), mk('B',1,{w1:'saw'})], i, 60);
  const ms = Date.now() - t0;
  ok('200 headless matches under 4s', ms < 4000, ms + 'ms (' + (ms/200).toFixed(1) + 'ms each)');
  console.log('        batch throughput: ' + (ms/200).toFixed(1) + ' ms/match');
}

/* ---------- summary ---------- */
console.log('\n========================================');
console.log('  ' + pass + ' passed, ' + fail + ' failed');
console.log('========================================');
process.exit(fail ? 1 : 0);

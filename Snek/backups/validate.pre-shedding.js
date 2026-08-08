/* SNEK — headless validation harness.
 *
 * Run:  & "C:\Program Files\nodejs\node.exe" validate.js
 * (node is installed on this machine but is NOT on PATH)
 *
 * Three layers, per the house conventions:
 *   1. syntax  — the inline <script> parses
 *   2. boot    — it runs to completion against stubbed DOM/canvas
 *   3. logic   — the rules actually hold, driven through window.SNEK
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const FILE = path.join(__dirname, 'snek.html');
let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, detail){
  if (cond){ pass++; console.log('  \u2713 ' + name); }
  else { fail++; failures.push(name + (detail ? '  \u2014 ' + detail : '')); console.log('  \u2717 ' + name + (detail ? '  \u2014 ' + detail : '')); }
}
function section(s){ console.log('\n' + s); }

/* ---------- 1. extract + syntax ---------- */
section('syntax');
const html = fs.readFileSync(FILE, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
ok('inline <script> found', !!m);
const src = m[1];

let script;
try { script = new vm.Script(src, {filename:'snek.html:script'}); ok('script parses', true); }
catch(e){ ok('script parses', false, e.message); report(); }

/* ---------- 2. DOM / canvas stubs ---------- */
const drawCalls = {};
function ctxStub(){
  const target = {
    canvas: null,
    save(){}, restore(){}, beginPath(){}, closePath(){}, moveTo(){}, lineTo(){},
    arc(){}, arcTo(){}, rect(){}, fill(){}, stroke(){}, clearRect(){}, fillRect(){},
    translate(){}, rotate(){}, scale(){}, setTransform(){}, fillText(){}, measureText(){return {width:10};},
  };
  return new Proxy(target, {
    get(t,k){
      if (k in t){
        const v = t[k];
        if (typeof v === 'function'){
          return (...a)=>{ drawCalls[k] = (drawCalls[k]||0)+1; return v.apply(t,a); };
        }
        return v;
      }
      return undefined;                       // style props read back as undefined; fine
    },
    set(t,k,v){ t[k]=v; return true; }
  });
}

function elStub(id){
  return {
    id,
    width: 624, height: 540,
    textContent:'', innerHTML:'',
    style:{},
    classList:{
      _s:new Set(),
      add(c){this._s.add(c);}, remove(c){this._s.delete(c);},
      toggle(c,on){ if(on===undefined){ this._s.has(c)?this._s.delete(c):this._s.add(c); } else { on?this._s.add(c):this._s.delete(c); } },
      contains(c){return this._s.has(c);}
    },
    getContext(){ const c = ctxStub(); c.canvas = {width:624,height:540}; return c; },
    addEventListener(){},
  };
}

const els = {};
const doc = {
  getElementById(id){ return els[id] || (els[id] = elStub(id)); },
  querySelector(sel){ return els[sel] || (els[sel] = elStub(sel)); },
  documentElement: elStub('html'),
  addEventListener(){},
};

// rAF: never auto-runs. The harness pumps frames by hand.
let rafQueue = [];
const store = {};
let clock = 1000;

const sandbox = {
  console,
  document: doc,
  window: null,
  performance: { now: ()=>clock },
  requestAnimationFrame(cb){ rafQueue.push(cb); return rafQueue.length; },
  cancelAnimationFrame(){ rafQueue = []; },
  setTimeout(){ return 0; },
  clearTimeout(){},
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k,v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  },
  getComputedStyle(){ return { getPropertyValue: ()=>'#000000' }; },
  Math, Date, JSON, Number, String, Array, Object, Error, isNaN, parseInt, parseFloat,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.window.addEventListener = (t,f)=>{ (sandbox.__listeners[t] ||= []).push(f); };
sandbox.__listeners = {};

section('boot');
try {
  vm.createContext(sandbox);
  script.runInContext(sandbox);
  ok('script boots without throwing', true);
} catch(e){
  ok('script boots without throwing', false, e.stack.split('\n').slice(0,3).join(' | '));
  report();
}

const S = sandbox.window.SNEK;
ok('window.SNEK exposed', !!S);
if (!S) report();

// pump one frame so the idle renderer runs at least once
function frame(ms){
  clock += ms;
  const q = rafQueue; rafQueue = [];
  q.forEach(cb=>cb(clock));
}
try { frame(16); ok('idle frame renders', drawCalls.stroke > 0 && drawCalls.fill > 0,
       'stroke='+drawCalls.stroke+' fill='+drawCalls.fill); }
catch(e){ ok('idle frame renders', false, e.message); }

/* ---------- 3. logic ---------- */
section('rules');
S.reset();
let st = S.state;
ok('reset gives START_LEN segments', st.snake.length === S.T.START_LEN, 'len='+st.snake.length);
ok('reset zeroes score', st.score === 0);
ok('food is not on the snake', !st.snake.some(s=>s.x===st.food.x && s.y===st.food.y));
ok('food is in bounds', st.food.x>=0 && st.food.x<S.T.CELLS && st.food.y>=0 && st.food.y<S.T.CELLS);

S.start();
ok('start sets alive', S.isAlive());

// --- eating
st = S.state;
const before = st.snake.length;
S.setFood(st.snake[0].x + st.dir.x, st.snake[0].y + st.dir.y);
S.step();
st = S.state;
ok('eating scores', st.score === 1, 'score='+st.score);
ok('eating grows the snake by 1', st.snake.length === before + 1, 'len='+st.snake.length);
ok('eating records a belly lump', st.lumps.length === 1);
ok('eating relocates the food', !(st.food.x === st.snake[0].x && st.food.y === st.snake[0].y));
ok('speed rises with score', st.speed > 1000/S.T.STEP_MS, 'speed='+st.speed.toFixed(2));

// --- the ramp must be geometric: every apple worth the same PERCENTAGE, so the
//     late ones don't fall under the just-noticeable threshold and read as lurching
{
  const ms = s => Math.max(S.T.STEP_MS_MIN, S.T.STEP_MS * Math.pow(S.T.STEP_RAMP, s));
  const pcts = [];
  for (let s=1; s<=20; s++) pcts.push((ms(s-1) - ms(s)) / ms(s-1) * 100);
  const lo = Math.min(...pcts), hi = Math.max(...pcts);
  ok('every apple changes speed by the same percentage', hi - lo < 0.01,
     `range ${lo.toFixed(2)}%..${hi.toFixed(2)}%`);
  ok('the ramp actually accelerates', ms(20) < ms(0), `${ms(0).toFixed(0)}ms -> ${ms(20).toFixed(0)}ms`);
  ok('speed is capped', ms(400) === S.T.STEP_MS_MIN, 'floor='+ms(400));
  ok('start speed is sane', Math.abs(1000/ms(0) - 5) < 0.5, (1000/ms(0)).toFixed(2)+' c/s');
}

// --- belly lumps have to be visible at cell scale, and must not stack absurdly
{
  S.reset(); S.start();
  const plain = S.T.BODY_W;
  // three apples back to back is the worst case for stacking
  for (let i=0;i<3;i++){
    const h = S.state.snake[0];
    S.setFood(h.x + S.state.dir.x, h.y + S.state.dir.y);
    S.step();
  }
  const widest = Math.max(...S.state.snake.map((_,i)=>S.segWidth(i)));
  ok('a swallowed apple is a visible bulge', widest > plain + 8,
     `body ${plain} -> ${widest.toFixed(1)}px in a ${S.T.CELL}px cell`);
  ok('stacked lumps stay within the cap', widest <= S.T.HEAD_W + S.T.LUMP_MAX + 0.01,
     widest.toFixed(1)+'px');
}

// --- lumps travel tailward and eventually pass out of the body
const lumpT0 = S.state.lumps[0].t;
S.setFood(-5,-5);                                   // park the food off-board
S.step(); S.step();
ok('lump migrates toward the tail', S.state.lumps[0].t === lumpT0 + 2, 't='+S.state.lumps[0].t);
for (let i=0;i<40 && S.isAlive();i++) S.step();
ok('lump is digested eventually', S.state.lumps.length === 0);

// --- movement + wrap
S.reset(); S.start(); S.setFood(-5,-5);
let head = S.state.snake[0];
const startX = head.x;
S.step();
ok('head advances one cell', S.state.snake[0].x === (startX+1) % S.T.CELLS);
for (let i=0;i<S.T.CELLS+2 && S.isAlive();i++) S.step();
ok('survives a full lap (wrap-around walls)', S.isAlive());
head = S.state.snake[0];
ok('stays in bounds after wrapping', head.x>=0 && head.x<S.T.CELLS && head.y>=0 && head.y<S.T.CELLS);

// --- 180s are rejected by turn(), but a forced reverse must still kill
S.reset(); S.start(); S.setFood(-5,-5);
S.turn(-1,0);
S.step();
ok('turn() refuses a 180', S.isAlive() && S.state.dir.x === 1, 'dir='+JSON.stringify(S.state.dir));

S.setDir(-1,0);                                     // bypass the guard on purpose
S.step();
ok('biting yourself is fatal', !S.isAlive());
ok('death shows the overlay', !els.overlay.classList.contains('hidden'));
ok('death writes a message', els.ovBody.innerHTML.length > 0, JSON.stringify(els.ovBody.innerHTML));

// --- following your own vacating tail is legal
S.reset(); S.start(); S.setFood(-5,-5);
// square loop: right, down, left, up — with START_LEN 4 the head lands where the tail just left
S.setDir(0,1);  S.step();
S.setDir(-1,0); S.step();
S.setDir(0,-1); S.step();
ok('a tight loop into the vacating tail survives', S.isAlive());

// --- best score persists
S.reset(); S.start();
for (let i=0;i<3;i++){
  const h = S.state.snake[0];
  S.setFood(h.x + S.state.dir.x, h.y + S.state.dir.y);
  S.step();
}
const scored = S.state.score;
S.setDir(-S.state.dir.x, -S.state.dir.y); S.step();
ok('game over on demand', !S.isAlive());
ok('best score is written to storage', Number(store['snek.best.v1']) >= scored,
   'stored='+store['snek.best.v1']+' scored='+scored);

// --- board-full is survivable rather than a crash
S.reset();
{
  const st2 = S.state;
  const all = [];
  for (let y=0;y<S.T.CELLS;y++) for (let x=0;x<S.T.CELLS;x++) all.push({x,y});
  st2.snake.length = 0;
  all.forEach(c=>st2.snake.push(c));
  let threw = false;
  try { S.draw(); } catch(e){ threw = true; failures.push('full-board draw: '+e.message); }
  ok('a board-filling snake still renders', !threw);
}

// --- STILL things must not re-jitter when the boil advances
section('boil');
{
  const line = [{x:10,y:10},{x:50,y:10},{x:50,y:50}];
  const same = (a,b) => a.every((p,i)=>p.x===b[i].x && p.y===b[i].y);

  const still0 = S.wobblePts(line, 42, 2, S.STILL);
  const live0  = S.wobblePts(line, 42, 2);
  const b0 = S.boil;

  let b1 = b0, tries = 0;
  while (b1 === b0 && tries++ < 40){ frame(S.T.BOIL_MS); b1 = S.boil; }
  ok('the boil counter advances with time', b1 !== b0, `${b0} -> ${b1}`);

  ok('STILL geometry is identical across boil phases', same(still0, S.wobblePts(line, 42, 2, S.STILL)));
  ok('un-phased geometry does re-jitter', !same(live0, S.wobblePts(line, 42, 2)));
  ok('the boil has exactly 3 phases', S.boil >= 0 && S.boil <= 2, 'boil='+S.boil);
}

// --- render survives every direction, a wrap seam, and the dead state
section('render');
{
  let threw = null;
  try {
    for (const d of [[1,0],[0,1],[-1,0],[0,-1]]){
      S.reset(); S.start(); S.setFood(-5,-5);
      S.setDir(d[0], d[1]);
      for (let i=0;i<S.T.CELLS+3 && S.isAlive();i++){ S.step(); S.draw(); }
    }
    S.reset(); S.start();
    S.setDir(-1,0); S.step();      // dead
    S.draw();
  } catch(e){ threw = e; }
  ok('draw() survives all headings, wrap seams and death', !threw, threw && threw.stack.split('\n')[0]);
}

// --- googly eyes: gravity toys that must never leave the socket
section('googly eyes');
{
  S.reset(); S.start(); S.setFood(-5,-5);
  const lim = S.T.EYE_R - S.T.PUPIL_R;
  let escaped = 0, maxOff = 0, moved = 0;
  const dirs = [[1,0],[0,1],[-1,0],[0,-1]];
  for (let i=0;i<600;i++){
    const d = dirs[i%4];
    S.setDir(d[0], d[1]);
    if (S.isAlive()) S.step(); else { S.reset(); S.start(); S.setFood(-5,-5); }
    S.updateEyes(1/60);
    for (const e of S.state.eyes){
      const off = Math.hypot(e.ox, e.oy);
      if (off > lim + 1e-6) escaped++;
      if (off > maxOff) maxOff = off;
      if (Math.abs(e.vx) + Math.abs(e.vy) > 1) moved++;
      if (!Number.isFinite(off)) escaped++;
    }
  }
  ok('pupils never escape the socket', escaped === 0, escaped+' escapes, max off='+maxOff.toFixed(2)+' lim='+lim.toFixed(2));
  ok('pupils actually move (not frozen)', moved > 300, 'moving frames='+moved);
  ok('pupils use the whole socket', maxOff > lim*0.6, 'max='+maxOff.toFixed(2));
}

// --- a dead snake's eyes settle at the bottom, like real googly eyes
{
  S.reset(); S.start(); S.setDir(-1,0); S.step();
  ok('snake is dead for the settle test', !S.isAlive());
  for (let i=0;i<400;i++) S.updateEyes(1/60);
  const lim = S.T.EYE_R - S.T.PUPIL_R;
  const settled = S.state.eyes.every(e => e.oy > lim*0.85 && Math.abs(e.ox) < lim*0.5);
  ok('pupils settle to the bottom when dead', settled,
     S.state.eyes.map(e=>`(${e.ox.toFixed(2)},${e.oy.toFixed(2)})`).join(' '));
}

/* ---------- 4. input: the ready/dead note must clear on ANY key ---------- */
section('input');
{
  const fire = (key, mods) => {
    let prevented = false;
    const ev = Object.assign(
      {key, ctrlKey:false, metaKey:false, altKey:false, preventDefault(){ prevented = true; }},
      mods || {}
    );
    (sandbox.__listeners.keydown || []).forEach(f => f(ev));
    return prevented;
  };
  const kill = () => {                       // land on the dead screen
    S.reset(); S.start(); S.setFood(-5,-5);
    S.setDir(-S.state.dir.x, -S.state.dir.y); S.step();
  };

  kill();
  ok('dead screen is showing', !S.isAlive() && !els.overlay.classList.contains('hidden'));

  fire('x');
  ok("a plain letter starts the game", S.isAlive());
  ok('...and clears the note', els.overlay.classList.contains('hidden'));

  kill(); fire('Escape');
  ok('Escape starts the game', S.isAlive());

  kill(); fire('Enter');
  ok('Enter still starts the game', S.isAlive());

  kill(); fire('p');
  ok("'p' starts rather than being swallowed by pause", S.isAlive());

  kill(); fire('Shift');
  ok('a bare modifier does NOT start the game', !S.isAlive());
  kill(); fire('F5');
  ok('F5 is left to the browser', !S.isAlive());
  kill();
  const prevented = fire('r', {ctrlKey:true});
  ok('ctrl+R is left to the browser', !S.isAlive() && !prevented);

  kill(); fire('`');
  ok('backtick toggles dev without starting', !S.isAlive());
  fire('`');                                  // toggle back off

  kill(); fire('ArrowDown');
  S.setFood(-5,-5); S.step();                 // turn() queues nextDir; dir picks it up on the tick
  ok('starting on a direction key sets that heading',
     S.isAlive() && S.state.dir.y === 1, JSON.stringify(S.state.dir));

  // pause still belongs to P once you're actually playing
  S.reset(); S.start();
  fire('p');
  ok('P pauses a live game', S.state.paused);
  fire('p');
  ok('P unpauses', !S.state.paused);
}

report();

function report(){
  console.log('\n' + '-'.repeat(46));
  console.log(`  ${pass} passed, ${fail} failed`);
  if (fail){ console.log('\nfailures:'); failures.forEach(f=>console.log('  \u2022 ' + f)); }
  console.log('-'.repeat(46));
  process.exit(fail ? 1 : 0);
}

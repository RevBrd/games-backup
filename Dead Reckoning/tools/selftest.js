// Validation harness for dead-reckoning.html — syntax + physics logic.
const fs = require('fs'), vm = require('vm');
const P = 'C:/Users/fonte/Projects/Games/Dead Reckoning/dead-reckoning.html';
const html = fs.readFileSync(P, 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];

let fail = 0;
const ok = (n, c, extra='') => { console.log((c?'  PASS  ':'  FAIL  ')+n+(extra?'   '+extra:'')); if(!c) fail++; };

// --- 1. syntax ---
try { new vm.Script(src); console.log('  PASS  script parses'); }
catch (e) { console.log('  FAIL  script parses  '+e.message); process.exit(1); }

// --- 2. run it under DOM stubs ---
const els = {};
const mkEl = id => els[id] || (els[id] = {
  id, value:'', textContent:'', innerHTML:'', style:{}, tagName:'DIV', children:[],
  classList:{ _s:new Set(), add(c){this._s.add(c)}, remove(c){this._s.delete(c)},
              toggle(c,f){ f===undefined ? (this._s.has(c)?this._s.delete(c):this._s.add(c)) : (f?this._s.add(c):this._s.delete(c)); },
              contains(c){return this._s.has(c)} },
  appendChild(c){ this.children.push(c); }, addEventListener(){}, focus(){}, select(){}, blur(){},
  querySelector(){ return mkEl(id+'::h4'); },
  getBoundingClientRect(){ return {width:1000, height:700}; },
  getContext(){ return g2d; },
  width:1000, height:700,
});
const g2d = new Proxy({}, { get:(t,k)=> k==='canvas' ? {width:1000,height:700}
  : (k==='createRadialGradient'||k==='createLinearGradient') ? (()=>({addColorStop(){}}))
  : (typeof k==='string' && !(k in t)) ? (()=>{}) : t[k],
  set:()=>true });
const listeners = {};
const sandbox = {
  console, performance:{ now:()=>0 },
  requestAnimationFrame:()=>{},
  addEventListener:(t,f)=>{ (listeners[t]=listeners[t]||[]).push(f); },
  document: {
    getElementById:mkEl,
    createElement:t=>{ const e=mkEl('_new_'+Math.random()); e.tagName=t.toUpperCase(); return e; },
    activeElement:null,
  },
  window:{ devicePixelRatio:1, addEventListener:()=>{} },
};
sandbox.window.addEventListener = sandbox.addEventListener;
// top-level const/let in a vm script live in lexical scope, not on the sandbox object,
// so hand them out explicitly
const exposed = src + `\n;globalThis.__x = { CONFIG, wellAccel, predictPath, ship, step, keys,
  get bullets(){return bullets}, DIALS, dget, dset, DEFAULTS };`;
try { vm.createContext(sandbox); new vm.Script(exposed).runInContext(sandbox); console.log('  PASS  runs under DOM stubs'); }
catch (e) { console.log('  FAIL  runs under DOM stubs  '+e.message); process.exit(1); }

Object.assign(sandbox, sandbox.__x);
const { CONFIG, wellAccel, predictPath, ship, step } = sandbox;
const W = CONFIG.world.w, H = CONFIG.world.h;
const RMAX = Math.hypot(W/2, H/2);

console.log('\n--- well profile: anchored ---');
CONFIG.well.model = 'anchored';
const a = r => wellAccel(r);
ok('flat at/inside the softening floor', Math.abs(a(0)-CONFIG.well.aCore) < 1e-9 && Math.abs(a(CONFIG.well.minR)-CONFIG.well.aCore) < 1e-9,
   `a(0)=${a(0).toFixed(1)} aCore=${CONFIG.well.aCore}`);
ok('hits aEdge exactly at reach', Math.abs(a(CONFIG.well.reach)-CONFIG.well.aEdge) < 1e-9,
   `a(reach)=${a(CONFIG.well.reach).toFixed(2)}`);
ok('holds at aEdge past reach (no dead corner)', Math.abs(a(RMAX)-CONFIG.well.aEdge) < 1e-9,
   `a(corner r=${RMAX.toFixed(0)})=${a(RMAX).toFixed(2)}`);
let mono = true; for (let r=0; r<RMAX; r+=2) if (a(r+2) > a(r)+1e-9) mono = false;
ok('monotonically decreasing (iso-rings can be found by scan)', mono);
ok('core pull is escapable by the engine', CONFIG.well.aCore < CONFIG.mainThrust,
   `aCore=${CONFIG.well.aCore} < mainThrust=${CONFIG.mainThrust}`);
const spreadA = a(CONFIG.well.minR)/a(RMAX);
ok('core:corner spread is a sane ratio', spreadA < 12, `${spreadA.toFixed(1)}x`);

console.log('\n--- well profile: newton (the v1 failure, for comparison) ---');
CONFIG.well.model = 'newton';
const spreadN = a(CONFIG.well.minR)/a(RMAX);
console.log(`  core a=${a(CONFIG.well.minR).toFixed(1)}   corner a=${a(RMAX).toFixed(2)}   spread=${spreadN.toFixed(0)}x`);
ok('newton demonstrably starves the outfield', a(RMAX) < 5 && spreadN > 50,
   'this is the arithmetic that made v1 untunable');
CONFIG.well.model = 'anchored';

console.log('\n--- shape parameter ---');
const mid = CONFIG.well.minR + (CONFIG.well.reach-CONFIG.well.minR)/2;
CONFIG.well.shape = 1; const lin = a(mid);
CONFIG.well.shape = 3; const fast = a(mid);
CONFIG.well.shape = 0.5; const slow = a(mid);
ok('shape 1 is the linear midpoint', Math.abs(lin - (CONFIG.well.aCore+CONFIG.well.aEdge)/2) < 1e-9, lin.toFixed(1));
ok('k>1 weaker at midpoint, k<1 stronger', fast < lin && slow > lin,
   `k=3:${fast.toFixed(0)}  k=1:${lin.toFixed(0)}  k=0.5:${slow.toFixed(0)}`);
CONFIG.well.shape = 1.6;

console.log('\n--- prediction line ---');
CONFIG.well.enabled = false;
Object.assign(ship, { x:100, y:100, vx:200, vy:0, alive:true });
let p = predictPath();
ok('emits the right number of samples', p.length === Math.round(CONFIG.predictSec*40), `${p.length}`);
ok('all samples inside the arena (wrapped)', p.every(([x,y])=>x>=0&&x<=W&&y>=0&&y<=H));
ok('ballistic path is straight with gravity off',
   Math.abs(p[p.length-1][1] - 100) < 1e-6, `end y=${p[p.length-1][1].toFixed(4)}`);
ok('no false seam flags on a path that never wraps', p.every(s=>s[2] === false),
   `x 100 -> ${p[p.length-1][0].toFixed(0)}, seam at ${W}`);
Object.assign(ship, { x:900, y:100, vx:200, vy:0 });   // 900 + 200*4 = 1700, wraps once
const pw = predictPath();
ok('flags a real seam crossing so the pen lifts', pw.filter(s=>s[2]).length === 1,
   `${pw.filter(s=>s[2]).length} crossing(s), expected exactly 1`);
CONFIG.well.enabled = true;
Object.assign(ship, { x:CONFIG.world.w/2, y:120, vx:0, vy:0 });
p = predictPath();
ok('gravity curves the path toward the core', p[p.length-1][1] > 120,
   `y 120 -> ${p[p.length-1][1].toFixed(0)}, core at ${H/2}`);

console.log('\n--- prediction agrees with the simulation ---');
// Same start, same well: predictPath must land near where step() actually puts the ship.
CONFIG.well.enabled = true; CONFIG.timeScale = 1;
const start = { x:300, y:200, vx:60, vy:-30 };
Object.assign(ship, start, { alive:true, ang:0, av:0, heat:0, over:false, fcd:0,
                             thr:false, strL:false, strR:false, rotL:false, rotR:false });
const pred = predictPath();
const predEnd = pred[pred.length-1];
Object.assign(ship, start, { alive:true, ang:0, av:0, heat:0, over:false, fcd:0 });
const N = Math.round(CONFIG.predictSec*120);
for (let i=0;i<N;i++) step(1/120);
const drift = Math.hypot(ship.x-predEnd[0], ship.y-predEnd[1]);
ok('predicted endpoint matches simulated endpoint', drift < 12,
   `drift ${drift.toFixed(2)} units after ${CONFIG.predictSec}s (integrator step mismatch only)`);

console.log('\n--- time scale ---');
CONFIG.well.enabled = false;
function runFor(scale, ticks){
  CONFIG.timeScale = scale;
  Object.assign(ship, { x:500, y:350, vx:0, vy:0, ang:0, av:0, heat:0, over:false, fcd:0, alive:true,
                        thr:true, strL:false, strR:false, rotL:false, rotR:false });
  sandbox.keys && Object.keys(sandbox.keys).forEach(k=>delete sandbox.keys[k]);
  sandbox.keys['arrowup'] = true;
  for (let i=0;i<ticks;i++) step((1/120)*scale);
  return { v:Math.hypot(ship.vx,ship.vy), heat:ship.heat };
}
const full = runFor(1, 240), quarter = runFor(0.25, 240);
ok('quarter time scale => quarter the speed gained', Math.abs(quarter.v - full.v/4) < 1,
   `full ${full.v.toFixed(1)} u/s vs quarter ${quarter.v.toFixed(1)} u/s`);
ok('heat scales with it too (nothing gets cheaper when slowed)',
   Math.abs(quarter.heat - full.heat/4) < 0.01, `${full.heat.toFixed(3)} vs ${quarter.heat.toFixed(3)}`);
CONFIG.timeScale = 1;

console.log('\n--- held fire ---');
sandbox.keys[' '] = true; sandbox.keys['arrowup'] = false;
Object.assign(ship, { x:500, y:350, vx:0, vy:0, ang:0, av:0, heat:0, over:false, fcd:0, alive:true, thr:false });
sandbox.__x.bullets.length = 0;
for (let i=0;i<120;i++) step(1/120);   // one simulated second
const shots = sandbox.__x.bullets.length;
ok('holding fire produces a burst, not one shot', shots > 1, `${shots} shots in 1s`);
ok('burst respects fireCd', Math.abs(shots - Math.floor(1/CONFIG.fireCd)) <= 1,
   `expected ~${Math.floor(1/CONFIG.fireCd)} at fireCd=${CONFIG.fireCd}`);
ok('recoil accumulated backwards over the burst', ship.vx < 0,
   `vx=${ship.vx.toFixed(1)} after firing along +x`);
CONFIG.autoFire = false;
sandbox.__x.bullets.length = 0; ship.fcd = 0; ship.heat = 0;
for (let i=0;i<120;i++) step(1/120);
ok('autoFire:false restores single-shot behaviour', sandbox.__x.bullets.length === 0,
   'keydown is the only path when the toggle is off');
CONFIG.autoFire = true;

console.log('\n--- dev bench wiring ---');
ok('every dial resolves to a real CONFIG path',
   sandbox.DIALS.every(d=>typeof sandbox.dget(d.p) === 'number'),
   sandbox.DIALS.map(d=>d.p).filter(p=>typeof sandbox.dget(p)!=='number').join(',') || 'all 14 ok');
ok('every dial default sits inside its own slider range',
   sandbox.DIALS.every(d=>{ const v=sandbox.dget(d.p); return v>=d.min && v<=d.max; }),
   sandbox.DIALS.filter(d=>{const v=sandbox.dget(d.p); return v<d.min||v>d.max;}).map(d=>d.l).join(',') || 'all in range');
const before = sandbox.dget('well.aCore');
sandbox.dset('well.aCore', 99);
ok('dset writes through a dotted path', CONFIG.well.aCore === 99);
sandbox.dset('well.aCore', before);
ok('DEFAULTS snapshot is a deep copy, not a live reference',
   sandbox.DEFAULTS.well.aCore === 170 && sandbox.DEFAULTS !== CONFIG);

console.log('\n--- external dependencies ---');
const cdn = [...html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)].map(m=>m[1]);
console.log(cdn.length ? '  NOTE  runtime CDN refs still present:' : '  PASS  no external refs');
cdn.forEach(u=>console.log('        '+u));

console.log('\n'+(fail ? `${fail} FAILURE(S)` : 'all checks passed'));
process.exit(fail ? 1 : 0);

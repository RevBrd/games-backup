#!/usr/bin/env node
/* ============================================================================
   GEM TD — headless simulation harness
   ----------------------------------------------------------------------------
   Plays the real game, in Node, with no browser and no canvas.

       node tools/simulate.js                    one seeded run, wave by wave
       node tools/simulate.js --runs 20          20 runs, aggregate report
       node tools/simulate.js --seed 7 --verbose per-wave detail for one seed
       node tools/simulate.js --runs 20 --quiet  just the summary table

   HOW IT WORKS, AND WHY IT IS TRUSTWORTHY
   The harness does NOT reimplement the game. It loads gemtd.html into a V8
   context with stubbed DOM/canvas objects, then calls the game's own
   updateGems / updateProjectiles / updateHazards / updateEnemies in the same
   order and with the same dt accumulation as the real frame loop. Every number
   it reports comes out of the shipping combat code. If the sim and the browser
   ever disagree, the bug is in here, not there.

   Math.random is replaced by a seeded PRNG before the game loads, so a given
   --seed always produces the same gem rolls, the same wave weaknesses and the
   same crits. That is the whole point: it makes a balance change measurable
   instead of anecdotal. Run a baseline, change one number, run the same seeds.

   THE BOT IS A YARDSTICK, NOT A GOOD PLAYER.
   It mazes greedily (sample legal placements, keep the one that lengthens the
   route most), always takes a free advanced tower when a recipe is complete,
   and spends on the Upgrade Chances ladder before anything else. It does not
   plan gem synergies, position for range, or hold blocks back for a recipe.
   A human will beat it. That is fine — its value is being *consistent*, so
   that two runs differ only by the thing you changed. If it dies somewhere
   surprising, check whether the bot was dumb before concluding the game is.

   WHAT TO WATCH
   The `air` column in the summary is the game's thesis under test: air waves
   every 4th level are supposed to be where runs end. If deaths start landing
   mostly on ground waves, something has drifted.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME_FILE = path.join(__dirname, '..', 'gemtd.html');

/* ------------------------------- seeded RNG ------------------------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------- DOM stubs -------------------------------- */
// Just enough shape that the game's UI code can assign to it without throwing.
// Nothing here is read back; the harness reads game state, never the "DOM".
function stubCtx() {
  const noop = () => {};
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient')
        return () => ({ addColorStop: noop });
      if (k === 'measureText') return () => ({ width: 0 });
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  return ctx;
}
function stubEl(id) {
  return {
    id, textContent: '', innerHTML: '', disabled: false, className: '',
    style: {}, dataset: {}, width: 600, height: 600,
    addEventListener() {}, removeEventListener() {},
    getContext: () => stubCtx(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 600 }),
  };
}

/* --------------------------- load the real game --------------------------- */
function loadGame(seed) {
  const html = fs.readFileSync(GAME_FILE, 'utf8');
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('no <script> block found in gemtd.html');

  const els = new Map();
  const doc = {
    getElementById(id) {
      if (!els.has(id)) els.set(id, stubEl(id));
      return els.get(id);
    },
    addEventListener() {},
  };
  let clock = 0;
  const sandbox = {
    document: doc,
    window: { addEventListener() {} },
    performance: { now: () => (clock += 16) },
    requestAnimationFrame: () => 0,   // the real loop never starts; we drive it
    console,
    Math: Object.create(Math),
  };
  sandbox.Math.random = mulberry32(seed);
  sandbox.globalThis = sandbox;

  const ctx = vm.createContext(sandbox);
  vm.runInContext(m[1], ctx, { filename: 'gemtd.html' });

  // Bridge out the pieces the driver needs. `const`/`let` at script top level
  // live in the context's lexical scope, not on the sandbox object, so they
  // have to be re-exported from inside.
  vm.runInContext(`globalThis.__api = {
    get G(){ return G; },
    N, CELL, SPAWN, CPS, ENDPOINT, TARGETS, ROUTE, BAL, UPGRADE_LADDER,
    GEM_TYPES, TYPE_KEYS, SPECIALS, QNAMES,
    idx, inB, noBuildHit, placementLegal, findRecipeFor,
    startPlacing, tryPlaceCandidate, candGroup,
    keepCandidate, combineCandidate, combineSpecialCandidate, combineSpecialMaze,
    upgradeSpecial, buyUpgradeChance, buyLife,
    updateSpawning, updateGems, updateProjectiles, updateHazards, updateEnemies,
  };`, ctx);

  return vm.runInContext('globalThis.__api', ctx);
}

/* ------------------------- route length (bot brain) ----------------------- */
// Plain BFS — the grid is unweighted and orthogonal, so this is O(V) where the
// game's own Dijkstra is O(V^2). Used only for *scoring* candidate placements;
// legality is always decided by the game's placementLegal().
function bfs(blocked, N, sx, sy) {
  const dist = new Int32Array(N * N).fill(-1);
  const start = sy * N + sx;
  dist[start] = 0;
  const q = new Int32Array(N * N);
  let head = 0, tail = 0;
  q[tail++] = start;
  while (head < tail) {
    const cur = q[head++], d = dist[cur];
    const x = cur % N, y = (cur / N) | 0;
    if (x + 1 < N) { const n = cur + 1;  if (!blocked[n] && dist[n] < 0) { dist[n] = d + 1; q[tail++] = n; } }
    if (x - 1 >= 0) { const n = cur - 1;  if (!blocked[n] && dist[n] < 0) { dist[n] = d + 1; q[tail++] = n; } }
    if (y + 1 < N) { const n = cur + N;  if (!blocked[n] && dist[n] < 0) { dist[n] = d + 1; q[tail++] = n; } }
    if (y - 1 >= 0) { const n = cur - N; if (!blocked[n] && dist[n] < 0) { dist[n] = d + 1; q[tail++] = n; } }
  }
  return dist;
}
function routeLength(api, blocked) {
  const { N, ROUTE } = api;
  let total = 0;
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const to = ROUTE[i + 1], from = ROUTE[i];
    const d = bfs(blocked, N, to.x, to.y)[from.y * N + from.x];
    if (d < 0) return -1;             // sealed — should never happen post-legality
    total += d;
  }
  return total;
}

/* --------------------------------- the bot -------------------------------- */
// `rng` is the BOT's own seeded stream, deliberately separate from the game's.
// Two reasons: runs must be reproducible (an unseeded bot makes the whole
// harness worthless), and bot decisions must not consume draws from the game's
// stream, or changing the bot would silently change every gem roll after it.
function placeOneBlock(api, samples, rng) {
  const { G, N, noBuildHit, placementLegal, tryPlaceCandidate } = api;
  const before = G.blocked;
  let best = null, bestScore = -Infinity;
  let tries = 0;
  while (tries < samples * 12 && (best === null || tries < samples * 4)) {
    tries++;
    const x = (rng() * (N - 1)) | 0, y = (rng() * (N - 1)) | 0;
    if (noBuildHit(x, y)) continue;
    if (!placementLegal(x, y)) continue;
    const trial = Uint8Array.from(before);
    for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) trial[(y + dy) * N + (x + dx)] = 1;
    const score = routeLength(api, trial);
    if (score > bestScore) { bestScore = score; best = [x, y]; }
  }
  if (!best) return false;
  tryPlaceCandidate(best[0], best[1]);
  return true;
}

function chooseAndStart(api) {
  const { G, findRecipeFor, candGroup, keepCandidate, combineCandidate, combineSpecialCandidate } = api;
  // 1. a free advanced tower always wins
  for (let i = 0; i < G.candidates.length; i++) {
    if (findRecipeFor(G.candidates[i], G.candidates)) { combineSpecialCandidate(i); return 'special'; }
  }
  // 2. otherwise combine the largest matching group, preferring higher quality
  let bi = -1, bq = -1, bn = 1;
  for (let i = 0; i < G.candidates.length; i++) {
    const n = candGroup(i).length;
    if (n >= 2 && (n > bn || (n === bn && G.candidates[i].quality > bq))) { bn = n; bq = G.candidates[i].quality; bi = i; }
  }
  if (bi >= 0) { combineCandidate(bi); return 'combine'; }
  // 3. else keep the best single gem
  let ki = 0;
  for (let i = 1; i < G.candidates.length; i++) if (G.candidates[i].quality > G.candidates[ki].quality) ki = i;
  keepCandidate(ki);
  return 'keep';
}

function tryMazeCombines(api) {
  const { G, findRecipeFor, combineSpecialMaze } = api;
  let made = 0;
  for (let guard = 0; guard < 8; guard++) {
    let found = null;
    for (const g of G.gems) { if (!g.isSpecial && findRecipeFor(g, G.gems)) { found = g; break; } }
    if (!found) break;
    combineSpecialMaze(found);
    made++;
  }
  return made;
}

// Spending policy, in priority order. Documented because it is a policy, not a
// law: the ladder is the strongest long-run scaling lever in the game, so the
// bot maxes it before it buys anything else.
function spend(api) {
  const { G, BAL, UPGRADE_LADDER, SPECIALS, buyUpgradeChance, upgradeSpecial, buyLife } = api;
  while (G.upgradeLevel < UPGRADE_LADDER.length - 1 && G.gold >= UPGRADE_LADDER[G.upgradeLevel + 1].cost) {
    const before = G.upgradeLevel; buyUpgradeChance(); if (G.upgradeLevel === before) break;
  }
  for (let guard = 0; guard < 40; guard++) {
    let best = null, cost = Infinity;
    for (const g of G.gems) {
      if (!g.isSpecial) continue;
      const next = SPECIALS[g.special].tiers[g.tier + 1];
      if (next && next.upgradeCost <= G.gold && next.upgradeCost < cost) { best = g; cost = next.upgradeCost; }
    }
    if (!best) break;
    const t = best.tier; upgradeSpecial(best); if (best.tier === t) break;
  }
  // Surplus gold goes to lives. Dying with gold in hand is the single worst
  // thing the bot used to do — a leak costs bounty(level) lives and a life
  // costs a flat 10g, so idle gold is strictly worse than stored lives. The
  // reserve keeps enough on hand for a special upgrade that may appear next wave.
  const RESERVE = 80;
  while (G.gold - RESERVE >= BAL.buy5Cost && G.lives <= 45) { const l = G.lives; buyLife(5); if (G.lives === l) break; }
  while (G.gold - RESERVE >= BAL.buyLifeCost && G.lives < BAL.livesCap) { const l = G.lives; buyLife(1); if (G.lives === l) break; }
}

/* -------------------------------- the run --------------------------------- */
function runOnce(seed, opts) {
  const api = loadGame(seed);
  const { G } = api;
  const DT = opts.dt;
  const log = [];
  const botRng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  let outcome = 'maxwave';

  for (let wave = 1; wave <= opts.maxWave; wave++) {
    if (G.phase === 'gameover') break;
    const level = G.level;
    const isAir = level % 4 === 0;
    const weakness = G.waveWeakness;

    spend(api);
    tryMazeCombines(api);
    // Captured AFTER spending: lives BOUGHT must not register as lives lost, or
    // a wave the bot shopped before reads as safer than it was. (It did, once.)
    const livesBefore = G.lives;
    api.startPlacing();
    let placed = 0;
    for (let i = 0; i < 5; i++) if (placeOneBlock(api, opts.samples, botRng)) placed++;
    if (placed === 0) { log.push({ level, note: 'bot found no legal placement' }); outcome = 'noplace'; break; }
    const action = chooseAndStart(api);

    // run the wave using the game's own update order and dt accumulation
    let simSec = 0;
    while (G.phase === 'combat' && simSec < opts.waveTimeout) {
      G.vnow += DT * 1000;
      api.updateSpawning(DT);
      api.updateGems(G.vnow);
      api.updateProjectiles(DT, G.vnow);
      api.updateHazards(DT, G.vnow);
      api.updateEnemies(DT, G.vnow);
      simSec += DT;
    }
    const stalled = G.phase === 'combat';
    // A stalled wave is a bug, not a balance result — the wave can only end by
    // every enemy dying or leaking, so a timeout means something is neither.
    // Dump enough state to tell the two causes apart: unkillable (moving, but
    // towers can't finish them) vs stuck (no path, frozen in place forever).
    let stallInfo = null;
    if (stalled) {
      const now = G.vnow;
      stallInfo = { alive: G.enemies.length, queued: G.spawnQueue, noPath: 0, frozen: 0, sample: [] };
      for (const e of G.enemies) {
        if (!e.isAir && !e.path) stallInfo.noPath++;
        const stunned = e.stunUntil && now < e.stunUntil;
        if (stunned) stallInfo.frozen++;
        if (stallInfo.sample.length < 4) stallInfo.sample.push({
          air: !!e.isAir, hp: +(100 * e.hp / e.maxHp).toFixed(1),
          cell: `${Math.floor(e.x / api.CELL)},${Math.floor(e.y / api.CELL)}`,
          tgt: e.target, path: e.path ? e.path.length - e.wp : null, stunned,
        });
      }
    }
    const specials = G.gems.filter(g => g.isSpecial).length;
    log.push({
      level, isAir, weakness, action,
      livesLost: livesBefore - G.lives, lives: G.lives, gold: G.gold,
      gems: G.gems.length, specials, ladder: G.upgradeLevel,
      secs: +simSec.toFixed(1), stalled, stallInfo,
    });
    if (stalled) { outcome = 'stalled'; break; }
    if (G.phase === 'gameover') { outcome = 'died'; break; }
  }

  const died = outcome === 'died';
  return { seed, outcome, died, deathLevel: died ? G.level : null, reached: G.level, score: G.score, log };
}

/* --------------------------------- report --------------------------------- */
function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }
function padL(s, n) { s = String(s); return s.length >= n ? s : ' '.repeat(n - s.length) + s; }

function printRun(r) {
  console.log(`\nseed ${r.seed}`);
  console.log('  lvl  type   weak        got       lost  lives   gold  gems  sp  ladder');
  for (const w of r.log) {
    if (w.note) { console.log(`  ${padL(w.level, 3)}  ${w.note}`); continue; }
    console.log('  ' + padL(w.level, 3) + '  ' + pad(w.isAir ? 'AIR' : 'gnd', 6) +
      pad(w.weakness, 12) + pad(w.action, 10) + padL(w.livesLost, 4) +
      padL(w.lives, 7) + padL(w.gold, 7) + padL(w.gems, 6) + padL(w.specials, 4) +
      padL(w.ladder, 8) + (w.stalled ? '   STALLED' : ''));
    if (w.stallInfo) {
      const s = w.stallInfo;
      console.log(`       stall: ${s.alive} alive, ${s.queued} unspawned, ${s.noPath} with no path, ${s.frozen} stunned`);
      for (const e of s.sample)
        console.log(`         ${e.air ? 'air' : 'gnd'} hp ${e.hp}%  cell ${e.cell}  target ${e.tgt}  ` +
                    `path ${e.path === null ? 'NONE' : e.path + ' steps left'}${e.stunned ? '  STUNNED' : ''}`);
    }
  }
  const tail = { died: () => `died on wave ${r.deathLevel} (${r.deathLevel % 4 === 0 ? 'AIR' : 'ground'})`,
                 stalled: () => `STALLED on wave ${r.reached} — raise --timeout or investigate`,
                 noplace: () => `ENDED EARLY on wave ${r.reached} — bot could not place, not a game outcome`,
                 maxwave: () => `reached the --maxwave cap at ${r.reached} without dying` }[r.outcome];
  console.log(`  -> ${tail()}, score ${r.score}`);
}

function main() {
  const argv = process.argv.slice(2);
  const flag = (name, def) => {
    const i = argv.indexOf('--' + name);
    return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : def;
  };
  const opts = {
    runs: +flag('runs', 1),
    seed: +flag('seed', 1),
    samples: +flag('samples', 24),
    // 60fps matches the browser's real frame rate. Coarser steps genuinely
    // change outcomes (20fps drifts by several waves), so don't lower this to
    // go faster unless you only care about rough shape.
    dt: 1 / +flag('fps', 60),
    maxWave: +flag('maxwave', 60),
    // Generous on purpose. Waves 1-17 have NO minimum-speed floor in the wave
    // table, so a well-slowed last enemy can legitimately take many minutes of
    // game time to walk out. 180s produced false "stalls" that were just slow.
    waveTimeout: +flag('timeout', 900),
    verbose: !!flag('verbose', false),
    quiet: !!flag('quiet', false),
  };

  console.log(`GemTD harness — ${opts.runs} run(s), ${Math.round(1 / opts.dt)}fps sim, ` +
              `${opts.samples} placement samples/block`);

  const results = [];
  const t0 = Date.now();
  for (let i = 0; i < opts.runs; i++) {
    const seed = opts.seed + i;
    const r = runOnce(seed, opts);
    results.push(r);
    if (!opts.quiet && (opts.runs === 1 || opts.verbose)) printRun(r);
    else if (!opts.quiet) console.log(`  seed ${padL(seed, 4)}  ${r.died ? 'died wave ' + padL(r.deathLevel, 3) + '  (' + (r.deathLevel % 4 === 0 ? 'AIR' : 'ground') + ')' : r.outcome + ' at ' + padL(r.reached, 3) + '       '}  score ${r.score}`);
  }

  const deaths = results.filter(r => r.died);
  const stalls = results.filter(r => r.outcome === 'stalled');
  const noplace = results.filter(r => r.outcome === 'noplace');
  console.log(`\n${'='.repeat(64)}`);
  console.log(`runs ${results.length}  ·  died ${deaths.length}  ·  stalled ${stalls.length}  ·  ` +
              `bot-ended ${noplace.length}  ·  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (deaths.length) {
    const lv = deaths.map(r => r.deathLevel).sort((a, b) => a - b);
    const med = lv[Math.floor(lv.length / 2)];
    console.log(`death wave: min ${lv[0]}  median ${med}  max ${lv[lv.length - 1]}`);
    const hist = {};
    for (const l of lv) hist[l] = (hist[l] || 0) + 1;
    console.log('distribution: ' + Object.keys(hist).map(k => `${k}${+k % 4 === 0 ? '(air)' : ''}×${hist[k]}`).join('  '));
  }

  // WHERE THE DAMAGE HAPPENS — the metric that actually tests the air thesis.
  // "Died on wave N" is a bad instrument: a run bled out on an air wave often
  // records its death two waves later, when a single leak on an easy ground
  // wave takes the last life. Lives lost per wave is not fooled by that.
  let airLost = 0, gndLost = 0, airWaves = 0, gndWaves = 0, airLeak = 0, gndLeak = 0;
  for (const r of results) for (const w of r.log) {
    if (w.note || w.livesLost == null) continue;
    // A leak costs bounty(level) lives, so lives/bounty recovers how many of the
    // wave's 10 enemies got through. Slightly undercounts on the wave that kills
    // the run, where lives clamp at zero.
    const leaks = w.livesLost / (1 + Math.floor(w.level / 4));
    if (w.isAir) { airLost += w.livesLost; airWaves++; airLeak += leaks; }
    else { gndLost += w.livesLost; gndWaves++; gndLeak += leaks; }
  }
  const airRate = airWaves ? airLost / airWaves : 0, gndRate = gndWaves ? gndLost / gndWaves : 0;
  console.log(`\nlives lost per wave played:`);
  console.log(`  AIR    ${airRate.toFixed(2)}  (${airLost} over ${airWaves} air waves)`);
  console.log(`  ground ${gndRate.toFixed(2)}  (${gndLost} over ${gndWaves} ground waves)`);
  console.log(`enemies leaked, of 10 per wave:`);
  console.log(`  AIR    ${airWaves ? (airLeak / airWaves).toFixed(1) : '—'} / 10`);
  console.log(`  ground ${gndWaves ? (gndLeak / gndWaves).toFixed(1) : '—'} / 10`);
  console.log(`  air is ${gndRate > 0 ? (airRate / gndRate).toFixed(1) + 'x' : 'infinitely'} deadlier per wave` +
              ` — the design intends this asymmetry, so a ratio near 1.0 means either it has\n` +
              `  drifted OR the bot died too early to sample the late waves where it lives. Check\n` +
              `  the median death wave before concluding anything about the game.`);
  if (stalls.length) console.log(`WARNING: ${stalls.length} run(s) hit the wave timeout — enemies unkillable or stuck.`);
}

main();

/* validate.js — headless harness for "blocks, i guess"
 *
 * Run:  & "C:\Program Files\nodejs\node.exe" validate.js
 * (node is installed on this machine but is NOT on PATH)
 *
 * Two jobs, and the second one is the unusual half:
 *
 *   1. Protect the physics engine. It is a real impulse-based rigid-body solver and it is the
 *      one part of this game worth protecting. Nobody plays with it, so nobody would notice it
 *      rotting.
 *
 *   2. Protect the JOKES. Almost everything that looks broken in this game is authored — no CSS,
 *      a dead options menu, an unsorted leaderboard that never resets, a random score. Those are
 *      the spec, so they get asserted like a spec. A future instance who "fixes" the leaderboard
 *      gets a red X instead of a compliment. See CLAUDE.md's register for why each one exists.
 *
 * The game file is never modified. This reads it, slices the <script> out, appends one export
 * line of its own, and evaluates it against DOM stubs.
 */

'use strict';

var fs = require('fs');
var path = require('path');

// optional path argument so a mutated copy can be checked without touching the real file:
//   node validate.js ..\some\mutant.html
var GAME = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'blocks-i-guess.html');
var html = fs.readFileSync(GAME, 'utf8');

// ---------------------------------------------------------------
// harness plumbing
// ---------------------------------------------------------------
var pass = 0, fail = 0, groupName = '';
var failures = [];

function group(n) { groupName = n; console.log('\n' + n); }

function check(name, fn) {
  var ok, detail = '';
  try {
    var r = fn();
    if (r === true || r === undefined) ok = true;
    else { ok = false; detail = String(r); }
  } catch (e) {
    ok = false;
    detail = e && e.stack ? e.stack.split('\n').slice(0, 2).join(' | ') : String(e);
  }
  if (ok) { pass++; console.log('  ok   ' + name); }
  else {
    fail++;
    failures.push(groupName + ' :: ' + name + (detail ? ' -> ' + detail : ''));
    console.log('  FAIL ' + name + (detail ? '\n         ' + detail : ''));
  }
}

function approx(a, b, tol) { return Math.abs(a - b) <= tol; }

// deterministic RNG so runs are reproducible; mulberry32
function seedRandom(seed) {
  var s = seed >>> 0;
  Math.random = function () {
    s = (s + 0x6D2B79F5) >>> 0;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
var REAL_RANDOM = Math.random;
function restoreRandom() { Math.random = REAL_RANDOM; }

// ---------------------------------------------------------------
// DOM stubs — just enough for wireUp(), showScreen() and renderLb()
// ---------------------------------------------------------------
function makeEl(id) {
  return {
    id: id,
    style: {},
    textContent: '',
    value: '',
    innerHTML: '',
    children: [],
    listeners: {},
    appendChild: function (c) { this.children.push(c); },
    addEventListener: function (t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
    // deliberately NO getContext: keeps ctx null so render() no-ops
  };
}

var els = {};
var docListeners = {};
var doc = {
  getElementById: function (id) { return (els[id] = els[id] || makeEl(id)); },
  createElement: function (tag) { return makeEl('<' + tag + '>'); },
  getElementsByClassName: function () { return []; },
  addEventListener: function (t, f) { (docListeners[t] = docListeners[t] || []).push(f); }
};

var timeouts = [];
function fakeSetTimeout(fn, ms) { timeouts.push({ fn: fn, ms: ms }); return timeouts.length; }
function flushTimeouts() { var t = timeouts; timeouts = []; t.forEach(function (x) { x.fn(); }); }

var win = {};
var rafCalls = 0;
function fakeRaf() { rafCalls++; return 1; }

// ---------------------------------------------------------------
// load the game
// ---------------------------------------------------------------
var scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.error('FATAL: could not find <script> block in ' + GAME); process.exit(2); }
var src = scriptMatch[1];

// the game exposes window.__blocksTest, but not the DOM-side functions the joke tests need.
// append our own export rather than editing the game file.
var EXTRA = '\n;window.__harness={submitScore:submitScore,renderLb:renderLb,showDone:showDone,' +
            'showScreen:showScreen,setMsg:setMsg,el:el,SCREENS:SCREENS,LB_SEED:LB_SEED,' +
            'COLORS:COLORS,SHAPES:SHAPES,sqCorners:sqCorners,collectContacts:collectContacts};\n';

var factory = new Function('window', 'document', 'requestAnimationFrame', 'setTimeout',
                           src + EXTRA + '\nreturn window;');
var W = factory(win, doc, fakeRaf, fakeSetTimeout);
var T = W.__blocksTest;
var H = W.__harness;
var C = T.CONFIG;
var S = T.S;

// ---------------------------------------------------------------
// helpers over the loaded game
// ---------------------------------------------------------------
function runToEnd(maxSteps) {
  maxSteps = maxSteps || 3000;
  T.startGame();
  var n = 0;
  while (n < maxSteps && !S.over) { T.stepSim(1 / 60); n++; }
  return { steps: n, seconds: n / 60, ended: S.over, bodies: S.bodies.length };
}

function settle(steps) {
  for (var i = 0; i < steps; i++) T.stepSim(1 / 60);
}

function allCorners() {
  var out = [];
  for (var i = 0; i < S.bodies.length; i++) {
    for (var k = 0; k < 4; k++) {
      var c = H.sqCorners(S.bodies[i], k);
      for (var q = 0; q < 4; q++) out.push(c[q]);
    }
  }
  return out;
}

// quiet the sim: stop spawning so a scenario can be set up by hand
function freezeSpawns() { S.over = true; S.doneShown = true; }

// ---------------------------------------------------------------
group('load');
// ---------------------------------------------------------------
check('game file parses and exposes __blocksTest', function () {
  return !!T || 'no __blocksTest';
});
check('wireUp() ran against stubs without throwing', function () {
  return !!els.cv || 'canvas never looked up — wireUp did not run';
});
check('render() is inert headless (no 2d context)', function () {
  return rafCalls === 1 || 'expected exactly one rAF schedule at load, got ' + rafCalls;
});
check('all six screens exist in the DOM', function () {
  var missing = H.SCREENS.filter(function (id) { return html.indexOf('id="' + id + '"') === -1; });
  return missing.length === 0 || 'missing: ' + missing.join(', ');
});

// ---------------------------------------------------------------
group('physics — piece construction');
// ---------------------------------------------------------------
check('all 7 tetromino shapes present, 4 cells each', function () {
  var keys = Object.keys(H.SHAPES);
  if (keys.length !== 7) return 'expected 7 shapes, got ' + keys.length;
  for (var i = 0; i < keys.length; i++) {
    if (H.SHAPES[keys[i]].length !== 4) return keys[i] + ' has ' + H.SHAPES[keys[i]].length + ' cells';
  }
  return true;
});
check('every shape has a colour', function () {
  var missing = Object.keys(H.SHAPES).filter(function (k) { return !H.COLORS[k]; });
  return missing.length === 0 || 'no colour for: ' + missing.join(', ');
});
check('makePiece centroids its offsets about the origin', function () {
  var keys = Object.keys(H.SHAPES);
  for (var i = 0; i < keys.length; i++) {
    var p = T.makePiece(keys[i], 100, 100);
    var sx = 0, sy = 0;
    for (var j = 0; j < 4; j++) { sx += p.offs[j][0]; sy += p.offs[j][1]; }
    if (!approx(sx / 4, 0, 1e-9) || !approx(sy / 4, 0, 1e-9)) {
      return keys[i] + ' centroid off by (' + (sx / 4) + ',' + (sy / 4) + ')';
    }
  }
  return true;
});
check('makePiece produces finite, positive mass properties', function () {
  var keys = Object.keys(H.SHAPES);
  for (var i = 0; i < keys.length; i++) {
    var p = T.makePiece(keys[i], 100, 100);
    if (!(p.invM > 0) || !isFinite(p.invM)) return keys[i] + ' bad invM ' + p.invM;
    if (!(p.invI > 0) || !isFinite(p.invI)) return keys[i] + ' bad invI ' + p.invI;
    if (!(p.rad > 0) || !isFinite(p.rad)) return keys[i] + ' bad radius ' + p.rad;
  }
  return true;
});
check('bounding radius actually encloses every corner', function () {
  var keys = Object.keys(H.SHAPES);
  for (var i = 0; i < keys.length; i++) {
    var p = T.makePiece(keys[i], 0, 0);
    p.a = 0.7; // arbitrary rotation: radius must hold at any angle
    for (var k = 0; k < 4; k++) {
      var cor = H.sqCorners(p, k);
      for (var q = 0; q < 4; q++) {
        var d = Math.sqrt(cor[q][0] * cor[q][0] + cor[q][1] * cor[q][1]);
        if (d > p.rad) return keys[i] + ' corner at ' + d.toFixed(2) + ' > rad ' + p.rad.toFixed(2);
      }
    }
  }
  return true;
});

// ---------------------------------------------------------------
group('physics — behaviour');
// ---------------------------------------------------------------
check('a single piece falls and comes to rest on the floor', function () {
  seedRandom(11);
  T.startGame();
  S.bodies = [];
  freezeSpawns();
  T.spawnPiece(C.W / 2, -30);
  settle(240);
  if (S.bodies.length !== 1) return 'body vanished';
  var b = S.bodies[0];
  var lowest = -Infinity;
  for (var k = 0; k < 4; k++) {
    var cor = H.sqCorners(b, k);
    for (var q = 0; q < 4; q++) if (cor[q][1] > lowest) lowest = cor[q][1];
  }
  if (!approx(lowest, C.H, 3)) return 'lowest corner at y=' + lowest.toFixed(1) + ', floor is ' + C.H;
  return true;
});
check('a resting piece falls asleep', function () {
  return S.bodies[0].asleep || 'still awake after settling; v=' +
         Math.hypot(S.bodies[0].vx, S.bodies[0].vy).toFixed(2);
});
check('pieces stack rather than merging into one layer', function () {
  seedRandom(4);
  T.startGame();
  S.bodies = [];
  freezeSpawns();
  for (var i = 0; i < 6; i++) T.spawnPiece(C.W / 2, -40 - i * 70);
  settle(600);
  var top = Infinity;
  for (var j = 0; j < S.bodies.length; j++) top = Math.min(top, T.bodyMinY(S.bodies[j]));
  // six pieces in one column must build higher than a single square
  return top < C.H - C.SQ * 3 || 'pile top only reached y=' + top.toFixed(1);
});
check('bodies stay inside the box while stacking', function () {
  var cor = allCorners();
  for (var i = 0; i < cor.length; i++) {
    if (cor[i][0] < -8 || cor[i][0] > C.W + 8) return 'corner escaped sideways to x=' + cor[i][0].toFixed(1);
    if (cor[i][1] > C.H + 8) return 'corner fell through the floor to y=' + cor[i][1].toFixed(1);
  }
  return true;
});
check('bodies stay inside the box through a full run', function () {
  seedRandom(77);
  runToEnd();
  var cor = allCorners();
  for (var i = 0; i < cor.length; i++) {
    if (cor[i][0] < -8 || cor[i][0] > C.W + 8) return 'corner escaped sideways to x=' + cor[i][0].toFixed(1);
    if (cor[i][1] > C.H + 8) return 'corner fell through the floor to y=' + cor[i][1].toFixed(1);
  }
  return true;
});
check('no NaN or Infinity anywhere after a full run', function () {
  for (var i = 0; i < S.bodies.length; i++) {
    var b = S.bodies[i];
    var vals = [b.x, b.y, b.a, b.vx, b.vy, b.w];
    for (var j = 0; j < vals.length; j++) {
      if (!isFinite(vals[j])) return 'body ' + i + ' has non-finite value ' + vals[j];
    }
  }
  return true;
});
check('no body reaches an absurd speed (explosion guard)', function () {
  for (var i = 0; i < S.bodies.length; i++) {
    var sp = Math.hypot(S.bodies[i].vx, S.bodies[i].vy);
    if (sp > 5000) return 'body ' + i + ' at ' + sp.toFixed(0) + ' px/s';
  }
  return true;
});
check('a fast impact wakes a sleeping body', function () {
  seedRandom(21);
  T.startGame();
  S.bodies = [];
  freezeSpawns();
  T.spawnPiece(C.W / 2, -30);
  settle(240);
  if (!S.bodies[0].asleep) return 'setup failed: base piece never slept';
  var base = S.bodies[0];
  T.spawnPiece(base.x, -60);
  S.bodies[1].vy = 900; // hard hit, well over WAKE_SPD
  // must POLL: SLEEP_T is 0.55s, so a body that wakes on impact re-sleeps within
  // ~33 steps. Checking only at the end reports a false failure.
  var woke = false;
  for (var i = 0; i < 120; i++) {
    T.stepSim(1 / 60);
    if (!base.asleep) { woke = true; break; }
  }
  return woke || 'sleeping body ignored a 900px/s impact across 120 steps';
});
check('simulation is deterministic under a fixed seed', function () {
  function fingerprint(seed) {
    seedRandom(seed);
    T.startGame();
    for (var i = 0; i < 300; i++) T.stepSim(1 / 60);
    return S.bodies.map(function (b) {
      return b.type + b.x.toFixed(4) + ',' + b.y.toFixed(4) + ',' + b.a.toFixed(4);
    }).join('|');
  }
  var a = fingerprint(1234);
  var b = fingerprint(1234);
  return a === b || 'two runs at the same seed diverged';
});
check('dt clamp survives a monstrous frame', function () {
  seedRandom(5);
  T.startGame();
  T.stepSim(10); // stepSim clamps at 0.05
  var bad = S.bodies.filter(function (b) { return !isFinite(b.x) || !isFinite(b.y); });
  return bad.length === 0 || bad.length + ' bodies detonated on a 10s frame';
});

// ---------------------------------------------------------------
group('run shape — the thirteen-second joke');
// ---------------------------------------------------------------
var RUNS = [];
check('20 seeded runs all end on their own', function () {
  RUNS = [];
  for (var i = 0; i < 20; i++) {
    seedRandom(1000 + i);
    var r = runToEnd();
    r.nice = Object.keys(S.nicedRows).length;
    RUNS.push(r);
    if (!r.ended) return 'run ' + i + ' never topped out in ' + r.steps + ' steps';
  }
  return true;
});
check('runs land in the 8–22s band', function () {
  var bad = RUNS.filter(function (r) { return r.seconds < 8 || r.seconds > 22; });
  var secs = RUNS.map(function (r) { return +r.seconds.toFixed(1); });
  return bad.length === 0 || 'out of band: ' + JSON.stringify(secs);
});
check('MAX_PIECES stays a safety net, never the reason a run ends', function () {
  var capped = RUNS.filter(function (r) { return r.bodies >= C.MAX_PIECES; });
  return capped.length === 0 ||
         capped.length + '/20 runs ended by hitting the ' + C.MAX_PIECES + '-piece cap';
});
check('"nice" holds Trevor\'s ruled rate of roughly once per run', function () {
  // Ruled 10 Aug 2026: once-ish per run is the keeper rate and it must not go higher.
  // See CLAUDE.md > "nice" — settled at once-ish per run.
  var total = RUNS.reduce(function (a, r) { return a + r.nice; }, 0);
  var mean = total / RUNS.length;
  if (mean < 0.4) return 'mean ' + mean.toFixed(2) + '/run — too rare, the gag has gone back to invisible';
  if (mean > 3.0) return 'mean ' + mean.toFixed(2) + '/run — too common, it is becoming a scoring system';
  return true;
});

// ---------------------------------------------------------------
group('known defect — square interpenetration (documented, not fixed)');
// ---------------------------------------------------------------
// Found 10 Aug 2026 while writing this harness, and confirmed visually.
// Pieces that get more than half-overlapped are driven into PERFECT coincidence
// instead of being pushed apart, then sleep there forever. Mechanism and the
// decision not to fix it are in CLAUDE.md > "Known defect: square interpenetration".
//
// These checks deliberately do NOT assert zero. That would be permanently red, which
// trains everyone to ignore the harness. They are one-sided regression guards: if the
// overlap gets materially worse they fail, and if someone genuinely fixes the solver
// they keep passing.
function overlapStats() {
  var deep = 0, involved = {};
  for (var i = 0; i < S.bodies.length; i++) {
    for (var j = i + 1; j < S.bodies.length; j++) {
      var best = Infinity;
      for (var k = 0; k < 4; k++) {
        var ca = (function (b, n) {
          var c = Math.cos(b.a), s = Math.sin(b.a), o = b.offs[n];
          return [b.x + o[0] * c - o[1] * s, b.y + o[0] * s + o[1] * c];
        })(S.bodies[i], k);
        for (var m = 0; m < 4; m++) {
          var cb = (function (b, n) {
            var c = Math.cos(b.a), s = Math.sin(b.a), o = b.offs[n];
            return [b.x + o[0] * c - o[1] * s, b.y + o[0] * s + o[1] * c];
          })(S.bodies[j], m);
          var d = Math.hypot(ca[0] - cb[0], ca[1] - cb[1]);
          if (d < best) best = d;
        }
      }
      if (best < 6) { deep++; involved[i] = 1; involved[j] = 1; }
    }
  }
  return { deep: deep, pct: Object.keys(involved).length / Math.max(S.bodies.length, 1) * 100 };
}

var OVERLAP = [];
check('measure the overlap across 15 seeded runs (baseline: ~28 pairs, ~50% of bodies)', function () {
  OVERLAP = [];
  for (var i = 0; i < 15; i++) {
    seedRandom(3000 + i);
    runToEnd();
    settle(60);
    OVERLAP.push(overlapStats());
  }
  var mp = OVERLAP.reduce(function (a, o) { return a + o.deep; }, 0) / OVERLAP.length;
  var mb = OVERLAP.reduce(function (a, o) { return a + o.pct; }, 0) / OVERLAP.length;
  console.log('         measured: ' + mp.toFixed(1) + ' deeply-overlapped pairs per run, ' +
              mb.toFixed(1) + '% of bodies involved');
  return true;
});
check('regression guard: overlap has not got materially worse', function () {
  var mean = OVERLAP.reduce(function (a, o) { return a + o.deep; }, 0) / OVERLAP.length;
  // baseline 28.4 pairs/run as measured 10 Aug 2026; 45 is a generous ceiling
  return mean <= 45 || 'mean deep pairs per run rose to ' + mean.toFixed(1) +
                       ' (baseline 28.4). Something made the solver worse.';
});
check('regression guard: overlap never destabilises the pile', function () {
  // the overlap is cosmetic-invisible and must stay that way — it must never turn
  // into escapes, explosions or non-finite state. Those are checked above on a full
  // run; this re-checks after the longest settle.
  for (var i = 0; i < S.bodies.length; i++) {
    var b = S.bodies[i];
    if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.a)) return 'non-finite body after settle';
    if (Math.hypot(b.vx, b.vy) > 5000) return 'body exploded after settle';
  }
  var cor = allCorners();
  for (var j = 0; j < cor.length; j++) {
    if (cor[j][0] < -8 || cor[j][0] > C.W + 8 || cor[j][1] > C.H + 8) return 'body escaped the box';
  }
  return true;
});

// ---------------------------------------------------------------
group('the register — authored defects, asserted as spec');
// ---------------------------------------------------------------
var headHtml = html.split('<script>')[0];

check('register 1: there is no CSS at all', function () {
  if (/<style[\s>]/i.test(html)) return 'a <style> block appeared — see register item 1';
  if (/rel=["']?stylesheet/i.test(html)) return 'an external stylesheet appeared — see register item 1';
  if (/<link[\s>]/i.test(html)) return 'a <link> appeared — see register item 1';
  return true;
});
check('register 1: no class attributes doing visual work', function () {
  // navBack is the only class in the file and it is a selector, not styling
  var classes = headHtml.match(/class="([^"]*)"/g) || [];
  var odd = classes.filter(function (c) { return c !== 'class="navBack"'; });
  return odd.length === 0 || 'unexpected classes: ' + odd.join(', ');
});
check('register 2: options menu is inert (one difficulty, nothing wired)', function () {
  var opts = headHtml.match(/<option>/g) || [];
  if (opts.length !== 1) return 'difficulty dropdown has ' + opts.length + ' options, must have exactly 1';
  if (headHtml.indexOf('there is no music') === -1) return 'the music label lost its joke';
  if (headHtml.indexOf('colors: yes') === -1) return '"colors: yes" is gone';
  if ('difficulty' in C || 'music' in C) return 'CONFIG grew a key the options menu could drive';
  return true;
});
check('register 3: version is "probably"', function () {
  return headHtml.indexOf('version: probably') !== -1 || 'the version string got real';
});
check('register 4: credits stay fake, no real name on screen', function () {
  if (headHtml.indexOf('made by: someone') === -1) return '"made by: someone" is gone';
  var names = ['Fable', 'Opus', 'Claude', 'Anthropic', 'Trevor'];
  for (var i = 0; i < names.length; i++) {
    if (headHtml.indexOf(names[i]) !== -1) return 'real credit "' + names[i] + '" leaked onto a screen';
  }
  return true;
});
check('register 5: leaderboard seed is unsorted and bob is beating you with 8', function () {
  var seed = H.LB_SEED.map(function (e) { return e.s; });
  var asc = seed.slice().sort(function (a, b) { return a - b; }).join(',');
  var desc = asc.split(',').reverse().join(',');
  if (seed.join(',') === asc || seed.join(',') === desc) return 'the leaderboard got sorted';
  var bob = H.LB_SEED.filter(function (e) { return e.n === 'bob' && e.s === 8; });
  return bob.length === 1 || 'bob and his single-digit score are gone';
});
check('register 5: your entry lands at a random index, not appended', function () {
  var positions = {};
  for (var i = 0; i < 60; i++) {
    S.lb = H.LB_SEED.map(function (e) { return { n: e.n, s: e.s, you: false }; });
    S.score = 500;
    H.el('initials').value ='abc';
    H.submitScore();
    var at = S.lb.findIndex(function (e) { return e.you; });
    positions[at] = true;
  }
  var distinct = Object.keys(positions).length;
  return distinct >= 3 || 'entry landed at only ' + distinct + ' distinct index/indices — insert is no longer random';
});
check('register 6: startGame() does not reset the leaderboard', function () {
  S.lb = H.LB_SEED.map(function (e) { return { n: e.n, s: e.s, you: false }; });
  var before = S.lb.length;
  for (var i = 0; i < 3; i++) {
    T.startGame();
    S.score = 300 + i;
    H.el('initials').value ='xyz';
    H.submitScore();
  }
  var yous = S.lb.filter(function (e) { return e.you; }).length;
  if (S.lb.length !== before + 3) return 'expected the table to grow to ' + (before + 3) + ', got ' + S.lb.length;
  return yous === 3 || 'expected 3 entries marked "(you)", found ' + yous;
});
check('register 7: the score is random and in [100, 999]', function () {
  restoreRandom();
  var seen = {};
  for (var i = 0; i < 200; i++) {
    H.showDone();
    if (S.score < 100 || S.score > 999) return 'score out of range: ' + S.score;
    seen[S.score] = true;
  }
  return Object.keys(seen).length > 100 ||
         'only ' + Object.keys(seen).length + ' distinct scores in 200 draws — it stopped being random';
});
check('register 7: the score card thinks before answering', function () {
  timeouts = [];
  H.showDone();
  if (timeouts.length !== 1) return 'expected one deferred reveal, got ' + timeouts.length;
  if (timeouts[0].ms < 400) return 'reveal delay dropped to ' + timeouts[0].ms + 'ms — the beat is gone';
  if (els.scoreLine.textContent !== 'score:') return 'score appeared immediately: "' + els.scoreLine.textContent + '"';
  flushTimeouts();
  return els.scoreLine.textContent === 'score: ' + S.score ||
         'reveal never landed: "' + els.scoreLine.textContent + '"';
});
check('register 8: top-out can fire on a settled piece that is merely high', function () {
  seedRandom(9);
  T.startGame();
  S.bodies = [];
  S.over = false; S.doneShown = false;
  T.spawnPiece(C.W / 2, C.END_Y - 20);
  var b = S.bodies[0];
  b.vx = 0; b.vy = 0; b.w = 0;
  b.still = C.SETTLED_T + 0.1; // held still a quarter second, nothing underneath it
  return T.checkTopOut() === true || 'a wedged-high piece no longer ends the run — the technicality was guarded';
});

// ---------------------------------------------------------------
group('the one rule — the player never gets a verb');
// ---------------------------------------------------------------
var KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'z', 'x', 'Enter', 'Escape'];

function fireKeys() {
  var handlers = docListeners.keydown || [];
  KEYS.forEach(function (k) {
    handlers.forEach(function (h) {
      h({ key: k, code: k, keyCode: 0, target: { tagName: 'BODY' }, preventDefault: function () {} });
    });
  });
  return handlers.length;
}

check('the rebuff message appears on any key', function () {
  seedRandom(3);
  T.startGame();
  H.setMsg(' ');
  if (!fireKeys()) return 'nothing is listening for keys at all';
  return els.inputMsg.textContent.indexOf('doesn') !== -1 ||
         'expected the rebuff message, got "' + els.inputMsg.textContent + '"';
});

check('mashing keys cannot influence the sim, now or on any later step', function () {
  // A/B against an identical seeded run. Comparing positions at the instant of the
  // key press is NOT enough -- a handler that only nudged VELOCITY would slip through,
  // and did: mutation testing caught this test failing to catch it (10 Aug 2026).
  // So: same seed, same steps, keys in one run only, compare the full body state after
  // the sim has had time to carry any injected impulse into position.
  function fingerprint(withKeys) {
    seedRandom(808);
    T.startGame();
    for (var i = 0; i < 60; i++) T.stepSim(1 / 60);
    if (withKeys) fireKeys();
    for (var j = 0; j < 90; j++) T.stepSim(1 / 60);
    return S.bodies.map(function (b) {
      return [b.type, b.x.toFixed(6), b.y.toFixed(6), b.a.toFixed(6),
              b.vx.toFixed(6), b.vy.toFixed(6), b.w.toFixed(6)].join(',');
    }).join('|');
  }
  var quiet = fingerprint(false);
  var mashed = fingerprint(true);
  return quiet === mashed ||
         'the pile diverged after key presses — the player got a verb (see CLAUDE.md, "The one rule")';
});

check('mashing keys cannot spawn, delete or freeze pieces', function () {
  seedRandom(55);
  T.startGame();
  var n0 = S.bodies.length, over0 = S.over;
  fireKeys();
  if (S.bodies.length !== n0) return 'body count changed from ' + n0 + ' to ' + S.bodies.length;
  if (S.over !== over0) return 'a key press ended or restarted the run';
  return true;
});
check('clicking the canvas is answered with "no"', function () {
  var handlers = (els.cv.listeners.mousedown || []);
  if (!handlers.length) return 'the canvas is not listening for clicks';
  var before = S.bodies.length;
  handlers.forEach(function (h) { h({}); });
  if (S.bodies.length !== before) return 'a click changed the pile';
  return els.inputMsg.textContent === 'no' || 'expected "no", got "' + els.inputMsg.textContent + '"';
});
check('typing in the initials box is not treated as gameplay input', function () {
  T.startGame();
  H.setMsg('\u00a0');
  var handlers = docListeners.keydown || [];
  handlers.forEach(function (h) { h({ key: 'a', target: { tagName: 'INPUT' }, preventDefault: function () {} }); });
  return els.inputMsg.textContent === '\u00a0' ||
         'the rebuff fired while typing initials: "' + els.inputMsg.textContent + '"';
});
check('the game exposes no input API that could move a piece', function () {
  var verbs = ['rotate', 'moveLeft', 'moveRight', 'drop', 'softDrop', 'hardDrop', 'nudge'];
  var found = verbs.filter(function (v) { return typeof W[v] === 'function' || typeof T[v] === 'function'; });
  return found.length === 0 || 'input verbs appeared: ' + found.join(', ');
});

// ---------------------------------------------------------------
restoreRandom();
console.log('\n' + '-'.repeat(60));
console.log(pass + ' passed, ' + fail + ' failed');
if (fail) {
  console.log('\nfailures:');
  failures.forEach(function (f) { console.log('  - ' + f); });
  console.log('\nBefore "fixing" a failure in the register or the one-rule group, read CLAUDE.md.');
  console.log('Those tests assert jokes on purpose. A red X there may mean the joke was removed.');
}
process.exit(fail ? 1 : 0);

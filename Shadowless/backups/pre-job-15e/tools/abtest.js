// A/B a SYMMETRIC CHANGE: the working tree against a committed one, same AI on
// both seats, same seeds, and the headline number is how many games came out
// DIFFERENT rather than who won.
//
//   node tools/abtest.js                    ladder decks vs HEAD, 8 seeds a pair
//   node tools/abtest.js 24                 24 seeds a pair
//   node tools/abtest.js 24 HEAD~5          against an older commit
//   node tools/abtest.js 24 HEAD --card base1-96     only decks running that card
//   node tools/abtest.js 24 HEAD --theme    the four theme decks instead
//   node tools/abtest.js 8 HEAD --pairs 400 a tenth of the run, an interval you
//                                           can still quote — see the cost note
//
// WHY THIS EXISTS, AND WHY aiduel.js IS NOT IT. `aiduel.js` swaps ai.js only,
// seats new against old, and asks "is the bot better" — it MANUFACTURES an
// asymmetry so a win rate means something. This swaps the whole of src/, puts
// the same bot on both seats, and asks a blunter question: "did my change alter
// anything at all, and where".
//
// THE HEADER USED TO SAY "A/B the RULES" AND THE TOOL OUTGREW IT. Eight of the
// fourteen files in AI-INVARIANTS/ quote a divergence from here, and almost all
// of them are AI changes rather than rules changes — PLAY-ORDER, DRAG-TARGET,
// EVOLUTION-PLAN. That is correct use, not drift, and the reason is worth having
// written down: a change to what the bot PERCEIVES lands on both seats too, so
// `aiduel` cancels it and reads ~50% however large it is. The dividing line is
// not rules-versus-AI. It is SYMMETRIC versus ASYMMETRIC:
//
//   both seats get the change   -> abtest. Divergence. (rules, and any change to
//                                  perception or scoring that ships to everyone)
//   one seat gets the change    -> aiduel. Win rate. (a bot you are grading
//                                  against an older bot)
//
// Blessed rather than corrected, 2 Sep 2026, Job 15d.
//
// IT EXISTS BECAUSE OF THE SEVENTH LIE IN MEASUREMENT.md, which is worth reading
// before you trust a flat result here. The 17 Aug 2026 retreat reversal produced
// BYTE-IDENTICAL selftest win rates, which reads as "no effect" and actually
// meant "no exposure": the rule only bites where a multi-symbol Energy meets a
// retreat cost, and not one of the four theme decks contains a Double Colorless.
// Measured on the ladder, where 7 of 18 decks run it, 22.5% of games diverged.
//
// So `--card` is the important flag and not a convenience. It restricts the pool
// to decks that actually contain the card your change is about, and prints how
// many were dropped. A divergence of 0% over a pool that cannot deal the
// situation is not evidence of anything.
//
// LIMIT, STATED PLAINLY. It materialises the whole baseline `src/` from git, so
// the two sides may know different cards. Any deck the baseline cannot build is
// dropped and counted. That makes this the wrong tool for measuring a set
// ADDITION against a ref that predates the set — there is nothing to compare —
// and the right one for every change to how the existing cards behave.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const { owedBy } = require('./lib/owed.js');

const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, '..');

// ---- arguments --------------------------------------------------------------
// THE REF SCAN USED TO SWALLOW A FLAG'S VALUE. `abtest 4 --card base1-96` took
// `base1-96` as the git ref, because the old scan was "the first argument after
// the first that does not begin with --", and a flag's value does not begin with
// --. It died in `git show` naming a card id as a commit, which reads as a git
// problem rather than an argument-order one. Exactly the shape aiduel.js fixed
// for itself on 21 Aug 2026 and this file never got. Job 15d, 2 Sep 2026.
//
// So: flags that TAKE a value are declared, and their value is consumed with
// them. What is left over is positional.
const VALUE_FLAGS = ['--card', '--pairs'];
const args = process.argv.slice(2);
const positional = [];
const flagValue = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (VALUE_FLAGS.includes(a)) { flagValue[a] = args[++i]; continue; }
  if (a.startsWith('--')) continue;
  positional.push(a);
}

const N = parseInt(positional[0], 10) || 8;
const REF = positional[1] || 'HEAD';
const THEME = args.includes('--theme');
const CARD = flagValue['--card'] || null;
// --pairs SUBSAMPLES THE ROUND-ROBIN, and it exists because the pool has tripled
// since this tool was written. See the cost note in the run banner below.
const PAIRS = parseInt(flagValue['--pairs'], 10) || 0;

// A ref that does not resolve is worth catching before the temp dir and eight
// `git show`s, because the failure it produces otherwise names a module rather
// than the argument that was wrong.
// execFileSync, not execSync: this runs on Windows, where cmd.exe treats `^` as
// its escape character and a `REF^{commit}` written for a POSIX shell resolves
// to nothing. No shell, no quoting question.
try {
  execFileSync('git', ['rev-parse', '--verify', '--quiet', `${REF}^{commit}`], { cwd: REPO, stdio: 'pipe' });
} catch (e) {
  console.error(`\n  "${REF}" is not a commit this repository knows.`);
  console.error(`  Usage: node tools/abtest.js [seeds] [ref] [--card ID] [--theme] [--pairs N]`);
  console.error(`  If you meant a flag value, it needs its flag: --card ${REF}\n`);
  process.exit(1);
}

// ---- materialise the baseline ----------------------------------------------
// engine.js requires ./art.js and ./ai.js by relative path, so a single temp
// FILE will not do — the baseline needs a directory it can resolve inside.
const SRC = path.join(ROOT, 'src');
const tmp = path.join(os.tmpdir(), `shadowless-ab-${REF.replace(/[^\w]/g, '_')}`);
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

const modules = fs.readdirSync(SRC).filter(f => f.endsWith('.js'));
for (const f of modules) {
  let src;
  try {
    src = execSync(`git show ${REF}:Shadowless/src/${f}`, { cwd: REPO, maxBuffer: 1 << 26 });
  } catch (e) {
    console.error(`  ${REF} has no src/${f} — cannot build a baseline from it.`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(tmp, f), src);
}

const NEW = {
  Engine: require(path.join(SRC, 'engine.js')).Engine,
  CARD_DB: require(path.join(SRC, 'cards.js')).CARD_DB,
  EFFECTS: require(path.join(SRC, 'effects.js')).EFFECTS,
  cards: require(path.join(SRC, 'cards.js')),
};
const OLD = {
  Engine: require(path.join(tmp, 'engine.js')).Engine,
  CARD_DB: require(path.join(tmp, 'cards.js')).CARD_DB,
  EFFECTS: require(path.join(tmp, 'effects.js')).EFFECTS,
  cards: require(path.join(tmp, 'cards.js')),
};

// LINE ENDINGS, AND THIS COMPARISON LIED FOR AS LONG AS IT EXISTED — 22 Aug
// 2026. `git show` hands back the blob as stored; the working copy has whatever
// the checkout filter put there. On this machine `src/ai.js` is LF in the blob
// and CRLF on disk, so a raw byte compare called it changed even when it was
// byte-for-byte HEAD. Consequences, both backwards: the "src/ is identical"
// NOTE could never print, and the "0% divergence with a REAL diff" warning fired
// on a deliberate null control — telling whoever ran the control, exactly as
// MEASUREMENT.md instructs, that their control was suspicious. Found by running
// one. Normalise before comparing; nothing else here cares, because Node parses
// the two the same.
const norm = s => s.replace(/\r\n/g, '\n');
const identical = modules.every(f =>
  norm(fs.readFileSync(path.join(SRC, f), 'utf8')) === norm(fs.readFileSync(path.join(tmp, f), 'utf8')));

// ---- the pool ---------------------------------------------------------------
const poolOf = m => (THEME ? m.cards.DECKS : m.cards.OPPONENT_DECKS);
const newPool = poolOf(NEW), oldPool = poolOf(OLD);

const listOf = d => d.list || d.cards || d;
const holds = (d, id) => listOf(d).some(e => (Array.isArray(e) ? e[1] : e) === id);

let names = Object.keys(newPool);
const missing = names.filter(n => !oldPool[n]);
names = names.filter(n => oldPool[n]);

// Without --card the pool plays itself; with it, the decks that hold the card
// play the ones that do not, so the subject-deck win rate below means something.
let filtered = names, others = names;
if (CARD) {
  filtered = names.filter(n => holds(newPool[n], CARD));
  others = names.filter(n => !holds(newPool[n], CARD));
  if (!filtered.length) {
    console.error(`\n  No deck in the pool contains ${CARD}. There is nothing here to measure.`);
    console.error(`  That is the finding, not an error: this pool cannot deal the situation, so`);
    console.error(`  it could never have measured the change.` + (THEME
      ? ` Drop --theme for the ${Object.keys(oldPool).length} ladder decks.\n`
      : ' Try a pool that runs it.\n'));
    process.exit(1);
  }
  if (!others.length) others = filtered;   // everything holds it; play the pool against itself
}

// ---- the pairs, and what they cost ------------------------------------------
// THE COST IS QUADRATIC IN THE ROSTER AND THE ROSTER HAS TRIPLED. This tool was
// written against 18 ladder decks, the invariant files were written against 47,
// and OPPONENT_DECKS is larger again every time a bracket lands. Every figure in
// AI-INVARIANTS/ says "17,296 games per side", which is exactly 47*46*8 — a
// number that was true for one roster and is quoted as though it were a property
// of the tool. So the banner below PRINTS the count instead, and nothing has to
// remember it. Job 15d, 2 Sep 2026.
const allPairs = [];
for (const d of filtered) for (const o of others) if (d !== o) allPairs.push([d, o]);

// --pairs subsamples deterministically, by a fixed stride rather than a shuffle,
// so a run is reproducible and two runs at the same --pairs play the same pairs.
//
// WHAT IT COSTS YOU, STATED HONESTLY, because a smaller sample is exactly the
// thing MISREADINGS.md is a file about. Divergence is a proportion, so its
// standard error is sqrt(p(1-p)/n). Every divergence in AI-INVARIANTS/ is quoted
// to one decimal place over ~17k games, where the SE is around 0.15% — three
// times finer than the figure is written. At 400 pairs the SE is nearer 0.6%,
// which is still well inside "did this change anything, and roughly how much".
// It is NOT fine enough to compare two runs a fraction of a percent apart, and
// the run banner prints the SE so you do not have to work that out in your head.
let pairs = allPairs;
if (PAIRS && PAIRS < allPairs.length) {
  const stride = allPairs.length / PAIRS;
  pairs = Array.from({ length: PAIRS }, (_, i) => allPairs[Math.floor(i * stride)]);
}

// ---- one game, recorded as a sequence ---------------------------------------
// The signature is what makes divergence detectable at all. Comparing winners
// alone misses a change that alters the whole middlegame and still ends the same
// way, which is most of them.
function playGame(M, pool, a, b, seed) {
  const E = new M.Engine(M.CARD_DB, M.EFFECTS, { seed });
  E.newGame(pool[a], pool[b], ['A', 'B']);
  E.setupAuto(0); E.setupConfirm(0);
  E.setupAuto(1); E.setupConfirm(1);
  const sig = [];
  let acts = 0;
  while (E.state.winner === null && acts++ < 8000) {
    const s = E.state;
    // owedBy: all four owed choices, one definition. This read only
    // pendingSwitch and pendingPromote, so an unhandled pendingAsk aborted
    // ~1.3% of ladder games early. See tools/lib/owed.js. Job 15d.
    const p = owedBy(s);
    const action = E.aiChoose(p, 'expert');
    if (!action) return { sig, acts, winner: null, stalled: true };
    sig.push(p + ':' + action.t);
    E.act(p, action);
  }
  return { sig, acts, winner: E.state.winner, stalled: E.state.winner === null };
}

// ---- run --------------------------------------------------------------------
console.log(`\nRules A/B — working tree vs ${REF}${THEME ? '  (theme decks)' : '  (ladder decks)'}`);
if (CARD) console.log(`  restricted to decks holding ${CARD}: ${filtered.length} of ${names.length}`);
if (missing.length) console.log(`  ${missing.length} deck(s) dropped — ${REF} cannot build them: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? '…' : ''}`);
if (PAIRS && pairs.length < allPairs.length) {
  console.log(`  SUBSAMPLED: ${pairs.length} of ${allPairs.length} deck pairs (--pairs). Quote the interval below, not the rate alone.`);
}
console.log(`  pool ${Object.keys(newPool).length} decks -> ${pairs.length} pairs x ${N} seeds = ${pairs.length * N} games per side, ${pairs.length * N * 2} total`);
if (identical) console.log('  NOTE: src/ is identical to the baseline. Expect 0% divergence.');
console.log('');

let games = 0, diverged = 0, stalls = 0, winNew = 0, winOld = 0;
const firstDiff = [];

{
  for (const [d, o] of pairs) {
    for (let s = 0; s < N; s++) {
      // Mirror the seats every other seed so first-player advantage falls on
      // both decks equally — the same rule aiduel.js learned the hard way.
      const [x, y] = s % 2 ? [d, o] : [o, d];
      const seed = s * 7919 + d.length * 31 + o.length;
      const rn = playGame(NEW, newPool, x, y, seed);
      const ro = playGame(OLD, oldPool, x, y, seed);
      games++;
      if (rn.stalled || ro.stalled) stalls++;
      const subject = s % 2 ? 0 : 1;          // the seat holding deck `d`
      if (rn.winner === subject) winNew++;
      if (ro.winner === subject) winOld++;
      const n = Math.min(rn.sig.length, ro.sig.length);
      let k = 0;
      while (k < n && rn.sig[k] === ro.sig[k]) k++;
      if (k < Math.max(rn.sig.length, ro.sig.length)) { diverged++; firstDiff.push(k); }
    }
  }
}

const pct = n => (100 * n / (games || 1)).toFixed(1) + '%';
firstDiff.sort((a, b) => a - b);
const median = firstDiff.length ? firstDiff[firstDiff.length >> 1] : null;

// Standard error of a proportion. Printed rather than left to the reader,
// because the whole point of --pairs is that the interval changes with n and
// nobody works that out in their head. Games within a deck pair are not
// independent, so treat this as a floor on the uncertainty rather than the
// whole of it.
const se = p => 100 * Math.sqrt((p / games) * (1 - p / games) / (games || 1));

console.log(`  games per side            ${games}`);
console.log(`  DIVERGED                  ${diverged}  (${pct(diverged)} ± ${(1.96 * se(diverged)).toFixed(1)})`);
if (median !== null) console.log(`  median first difference   action ${median}`);

// ---- stalls ------------------------------------------------------------------
// THIS LINE USED TO SHOUT ON A CLEAN TREE, AND THE NUMBER WAS NOISE. It read
// "investigate before reading anything else" whenever `stalls` was non-zero, and
// on an IDENTICAL tree with a correct 0.0% divergence it fires every time: the
// floor is ~1.1-1.8% of games. MISREADINGS.md has two entries about it — one
// saying quote it as a rate, one saying the absolute floor scales with the pool
// — and the fix for both is the same and was never applied: print the rate, and
// only shout when the rate is outside its known band.
//
// WHAT A STALL IS, instrumented 31 Aug 2026 rather than reasoned about: almost
// always `aiChoose` returning null, about six times in every four hundred games,
// and only rarely the 8000-action cap. That rate is a property of the bot and
// the pool, not of the change under test.
//
// AND THEN THE FLOOR MOVED, because the cause was fixed the same afternoon.
// Null control, 2400 games per side, identical tree, before and after adding
// pendingAsk to the dispatch:
//
//   before   34 stalls   1.4%
//   after     3 stalls   0.1%
//
// So the 1.1-1.8% written down in MISREADINGS.md is now a historical figure
// rather than a floor. THE THRESHOLD IS ONE-SIDED ON PURPOSE: zero is the
// healthy reading, and a lower bound would have made "no stalls at all" look
// like a fault — which is exactly the mistake this whole line was making in the
// other direction an hour ago.
//
// A run that diverges is not replaying the same games, so its stalls are a fresh
// sample; treat a small movement as sample noise rather than as a regression.
// The 3 that remain are unexplained and are few enough that nobody has needed
// to. If you want to know, tools/lib/owed.js has the method.
const STALL_WARN = 1.0;   // percent of games; measured floor is ~0.1
const stallPct = 100 * stalls / (games || 1);
if (stalls) {
  console.log(`  stalled (either side)     ${stalls}  (${stallPct.toFixed(1)}%)`
    + (stallPct > STALL_WARN ? '   <- above the measured ~0.1% floor, worth reading' : '   (floor is ~0.1%)'));
}
console.log('');
console.log(`  subject-deck wins, ${REF.padEnd(10)} ${pct(winOld)}  (${winOld}/${games})`);
console.log(`  subject-deck wins, working  ${pct(winNew)}  (${winNew}/${games})`);
console.log('');
if (!diverged && !identical) {
  console.log('  0% divergence with a real diff in src/ means one of two things, and they are');
  console.log('  not the same: the change is inert, or THE POOL NEVER DEALT IT. Check exposure');
  console.log('  with --card before believing the first. See MEASUREMENT.md, seventh lie.\n');
}

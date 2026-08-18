// A/B the RULES: the working tree's engine against a committed one, same AI on
// both seats, same seeds, and the headline number is how many games came out
// DIFFERENT rather than who won.
//
//   node tools/abtest.js                    ladder decks vs HEAD, 8 seeds a pair
//   node tools/abtest.js 24                 24 seeds a pair
//   node tools/abtest.js 24 HEAD~5          against an older commit
//   node tools/abtest.js 24 HEAD --card base1-96     only decks running that card
//   node tools/abtest.js 24 HEAD --theme    the four theme decks instead
//
// WHY THIS EXISTS, AND WHY aiduel.js IS NOT IT. `aiduel.js` swaps ai.js and asks
// "is the bot better". This swaps the whole of src/ and asks a different, blunter
// question: "did my change alter anything at all, and where". Those need
// different harnesses because a rules change is usually SYMMETRIC — both seats
// play under the same new rule, so a win rate is the wrong instrument and will
// sit at 50% however large the change is. Divergence is the right one.
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
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, '..');

const args = process.argv.slice(2);
const N = parseInt(args[0], 10) || 8;
const REF = args.find((a, i) => i > 0 && !a.startsWith('--')) || 'HEAD';
const THEME = args.includes('--theme');
const CARD = (args[args.indexOf('--card') + 1] && args.includes('--card'))
  ? args[args.indexOf('--card') + 1] : null;

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

const identical = modules.every(f =>
  fs.readFileSync(path.join(SRC, f), 'utf8') === fs.readFileSync(path.join(tmp, f), 'utf8'));

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
      ? ' Drop --theme for the 18 ladder decks.\n'
      : ' Try a pool that runs it.\n'));
    process.exit(1);
  }
  if (!others.length) others = filtered;   // everything holds it; play the pool against itself
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
    const p = s.pendingSwitch !== null ? s.pendingSwitch
      : (s.pendingPromote === null || s.pendingPromote === undefined) ? s.active : s.pendingPromote;
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
if (identical) console.log('  NOTE: src/ is identical to the baseline. Expect 0% divergence.');
console.log('');

let games = 0, diverged = 0, stalls = 0, winNew = 0, winOld = 0;
const firstDiff = [];

for (const d of filtered) {
  for (const o of others) {
    if (d === o) continue;
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

console.log(`  games per side            ${games}`);
console.log(`  DIVERGED                  ${diverged}  (${pct(diverged)})`);
if (median !== null) console.log(`  median first difference   action ${median}`);
if (stalls) console.log(`  stalled (either side)     ${stalls}   <- investigate before reading anything else`);
console.log('');
console.log(`  subject-deck wins, ${REF.padEnd(10)} ${pct(winOld)}  (${winOld}/${games})`);
console.log(`  subject-deck wins, working  ${pct(winNew)}  (${winNew}/${games})`);
console.log('');
if (!diverged && !identical) {
  console.log('  0% divergence with a real diff in src/ means one of two things, and they are');
  console.log('  not the same: the change is inert, or THE POOL NEVER DEALT IT. Check exposure');
  console.log('  with --card before believing the first. See MEASUREMENT.md, seventh lie.\n');
}

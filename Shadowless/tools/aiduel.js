// Head-to-head: the working-tree AI against a committed one.
//
//   node tools/aiduel.js              current src/ai.js vs HEAD's
//   node tools/aiduel.js 20           20 seeds per matchup
//   node tools/aiduel.js 10 HEAD~3    against an older commit
//
// WHY THIS EXISTS. aitest.js counts behaviours and selftest.js proves the
// difficulty ladder is ordered, but neither can answer "is the AI better than it
// was an hour ago". The obvious proxy — watching selftest's win rates move — is
// worthless for that, because both seats run the SAME AI: seat 0's win rate
// measures first-player advantage, not quality, and it drifts a few points from
// any change that alters game length.
//
// So: seat the new AI against the old one, and ALTERNATE SEATS every game so the
// first-player advantage (58-67% by the standing measurement, see CLAUDE.md)
// falls on both sides equally. What comes out is a like-for-like win rate.
//
// It loads a second copy of ai.js from git into a temp file. That works because
// ai.js is self-contained and exports its class, and it means the baseline can
// never drift out of sync with what is committed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const { CARD_DB, DECKS, OPPONENT_DECKS } = require('../src/cards.js');
const { EFFECTS } = require('../src/effects.js');
const { Engine } = require('../src/engine.js');

const N = parseInt(process.argv[2], 10) || 8;
// Positional, but flags may sit anywhere: `aiduel 10 --gbc` used to send `--gbc`
// to `git show` and die with an unrecognized-argument trace that looks like a
// git problem rather than an argument-order one.
//
// --baseline PINS THE COMPARISON, and it exists because HEAD is the wrong
// yardstick for the question people actually ask. Against HEAD this tool answers
// "did the last commit help", resets every commit, and therefore reads ~50%
// forever no matter how far the AI has come. Trevor spotted the same shape in
// the decksim benchmark on 21 Aug 2026 — every time the AI gets better so does
// the opponent it is measured against.
//
// A FIXED commit accumulates instead: a run against it is a running score rather
// than a diff. Move the pin only deliberately, and record it in MEASUREMENT.md's
// pin table when you do — resetting it silently throws away every comparison
// anyone has written down.
//
// THE PIN ROTS, AND IT IS NOT THE PIN THAT CHANGES. A frozen `ai.js` is run
// against the CURRENT engine and the CURRENT decks, so the game can grow into a
// bug the old file has always had. That is exactly what happened to `e23c747`,
// the original pin: it predates the 25 Aug 2026 fix for three PROVISIONAL Power
// cases that referenced variables their function never defined, and the note on
// that fix says they "had never been reached before". Then the Team Rocket
// roster shipped a deck fielding one, and `--baseline --gbc` began dying inside
// the baseline with `ReferenceError: p is not defined`. Nothing about the pin
// changed. The game reached it.
//
// **Moved to `582761b` on 28 Aug 2026, Trevor's call** — the first commit whose
// `ai.js` carries that fix, verified by running it against the live ladder before
// changing this line. What that costs is honest and is recorded rather than
// hidden: readings against `e23c747` are no longer comparable, so the 21–25 Aug
// accumulation is behind the new pin and is not measured by it any more.
//
// **RUN `--checkpin` AFTER ADDING A SET OR A ROSTER.** That is when new Powers
// enter the ladder, which is the only thing that has ever broken this. It plays a
// few games with the baseline on both sides and says PIN OK or PIN BROKEN in
// seconds, so the rot is caught by whoever caused it instead of by whoever next
// tries to measure an AI change. `TOOLING.md`'s "Adding a set" carries the same
// instruction.
const BASELINE = '582761b';
const REF = process.argv.includes('--baseline') ? BASELINE
  : (process.argv.slice(3).find(a => !a.startsWith('--')) || 'HEAD');
// --control seats the BASELINE on both sides. Run it to read the per-deck table
// honestly: those rows count games where one side happened to hold that deck, and
// the decks are not balanced against each other (74/60/42/25 by CLAUDE.md). A
// deck sitting at 40% is only a regression if the control says it should be 50.
const CONTROL = process.argv.includes('--control');
const ROOT = path.join(__dirname, '..');

// --gbc DUELS ON THE LADDER'S DECKS INSTEAD OF THE FOUR THEME DECKS, and it
// exists because the default pool made this tool blind to a whole class of
// change — 13 Aug 2026.
//
// The four theme decks are Base Set only and hold 11 "wall" cards between them
// (240 cards), none of them Kangaskhan, Chansey, Snorlax or Electabuzz. So the
// stickiness change, which is entirely about how those are played, measured at
// 51.0% +/- 5.0 — and that number was not "no effect", it was "the harness
// never dealt the situation". The 18 ladder decks hold 112, and they are what
// the player actually faces now.
//
// Read the per-deck table with even more care here: 18 unbalanced decks across
// three sets are further from each other than the four theme decks are, so a
// row means very little without --control beside it.
const GBC = process.argv.includes('--gbc');
const POOL = GBC ? OPPONENT_DECKS : DECKS;

// Pull the baseline out of git rather than keeping a copy around to rot.
const baseSrc = execSync(`git show ${REF}:Shadowless/src/ai.js`, { cwd: path.join(ROOT, '..'), maxBuffer: 1 << 24 }).toString();
const tmp = path.join(os.tmpdir(), `shadowless-ai-${REF.replace(/[^\w]/g, '_')}.js`);
fs.writeFileSync(tmp, baseSrc);

const NewAI = require('../src/ai.js').AI;
const OldAI = require(tmp).AI;

console.log(`\nAI duel — working tree vs ${REF}\n`);
if (baseSrc === fs.readFileSync(path.join(ROOT, 'src/ai.js'), 'utf8')) {
  console.log('  NOTE: the two are identical. Expect ~50%.\n');
}

// One game. `newSeat` says which seat the working-tree AI takes.
function playGame(deckA, deckB, seed, newSeat) {
  const E = new Engine(CARD_DB, EFFECTS, { seed });
  E.newGame(POOL[deckA], POOL[deckB], ['A', 'B']);
  E.setupAuto(0); E.setupConfirm(0);
  E.setupAuto(1); E.setupConfirm(1);
  const Challenger = CONTROL ? OldAI : NewAI;
  const bots = [
    new (newSeat === 0 ? Challenger : OldAI)(E, { mode: 'expert' }),
    new (newSeat === 1 ? Challenger : OldAI)(E, { mode: 'expert' }),
  ];
  let acts = 0;
  while (E.state.winner === null && acts++ < 8000) {
    const s = E.state;
    const p = s.pendingSwitch !== null ? s.pendingSwitch
      : (s.pendingPromote === null || s.pendingPromote === undefined) ? s.active : s.pendingPromote;
    const action = bots[p].choose(p);
    if (!action) return null;
    E.act(p, action);
  }
  if (E.state.winner === null) return null;
  return E.state.winner === newSeat ? 'new' : 'old';
}

// --checkpin — IS THE BASELINE STILL RUNNABLE? Seconds, not minutes, and it is
// the whole sustainability answer to a yardstick that rots. Run it after adding
// a set or a roster; those are the only things that have ever broken the pin,
// because they put cards in front of the frozen scorer that did not exist when
// it was frozen.
//
// It plays the baseline against ITSELF, deliberately: the question is "can this
// old file still take a turn against today's cards", not "how does it do". A
// crash is reported with the deck that caused it, which is what turns a stack
// trace into a diagnosis.
if (process.argv.includes('--checkpin')) {
  const names = Object.keys(POOL);
  const pairs = [];
  for (let i = 0; i < names.length; i++) pairs.push([names[i], names[(i + 1) % names.length]]);
  let ok = 0;
  const broken = [];
  for (const [a, b] of pairs) {
    try {
      const E = new Engine(CARD_DB, EFFECTS, { seed: 4242 });
      E.newGame(POOL[a], POOL[b], ['A', 'B']);
      E.setupAuto(0); E.setupConfirm(0);
      E.setupAuto(1); E.setupConfirm(1);
      const bots = [new OldAI(E, { mode: 'expert' }), new OldAI(E, { mode: 'expert' })];
      let acts = 0;
      while (E.state.winner === null && acts++ < 8000) {
        const s = E.state;
        const p = s.pendingSwitch !== null ? s.pendingSwitch
          : (s.pendingPromote === null || s.pendingPromote === undefined) ? s.active : s.pendingPromote;
        const action = bots[p].choose(p);
        if (!action) break;
        E.act(p, action);
      }
      ok++;
    } catch (e) {
      broken.push(`${a} v ${b}: ${e.message}`);
    }
  }
  if (!broken.length) {
    console.log(`  PIN OK — ${REF} played ${ok} of ${pairs.length} matchups against today's cards.\n`);
    process.exit(0);
  }
  console.log(`  PIN BROKEN — ${REF} crashed in ${broken.length} of ${pairs.length} matchups:\n`);
  for (const b of broken.slice(0, 5)) console.log(`    ${b}`);
  console.log(`
  This is almost certainly NOT a bug in your working tree. The pin is a frozen
  ai.js run against the CURRENT engine and decks, so a card added since it was
  pinned can reach a fault the old file always had. See MEASUREMENT.md's pin
  table. Moving the pin is Trevor's call and it costs every recorded comparison.
`);
  process.exit(1);
}

const names = Object.keys(POOL);
let win = 0, loss = 0, dead = 0;
const perDeck = {};

// EVERY SEED IS PLAYED TWICE, once with the challenger on each seat.
//
// Alternating seats by seed instead (newSeat = i % 2) is not good enough and
// this tool shipped that way for an hour. It correlates the seat with the seed,
// so whichever side the challenger happened to take on even seeds also got one
// side of a deterministic opening coin flip — and the control, baseline against
// itself, came out at 55.7% instead of 50%. A harness that reports a 6-point
// edge for a change that does not exist will confirm anything you ask it.
//
// Mirrored, the two AIs face the identical shuffle from both sides and the bias
// cancels exactly rather than on average.
for (const a of names) {
  for (const b of names) {
    for (let i = 0; i < N; i++) {
      const seed = 9000 + i * 53;
      for (const newSeat of [0, 1]) {
        const r = playGame(a, b, seed, newSeat);
        if (r === null) { dead++; continue; }
        const deck = newSeat === 0 ? a : b;
        perDeck[deck] = perDeck[deck] || { w: 0, n: 0 };
        perDeck[deck].n++;
        if (r === 'new') { win++; perDeck[deck].w++; } else loss++;
      }
    }
  }
}

const total = win + loss;
const rate = total ? (win / total * 100) : 0;
// Normal approximation is fine at these counts and keeps the tool dependency-free.
const se = total ? Math.sqrt(0.25 / total) * 100 : 0;

console.log(`  working tree ${win} — ${loss} ${REF}      ${rate.toFixed(1)}%  ±${(1.96 * se).toFixed(1)} (95%)`);
if (dead) console.log(`  ${dead} games did not finish and were dropped`);

console.log('\n  by the deck the new AI was holding:');
for (const d of names) {
  const p = perDeck[d];
  if (p) console.log(`    ${d.padEnd(12)} ${String(p.w).padStart(3)}/${String(p.n).padStart(3)}  ${(p.w / p.n * 100).toFixed(0)}%`);
}

const verdict = rate - 1.96 * se > 50 ? 'BETTER — significant'
  : rate + 1.96 * se < 50 ? 'WORSE — significant'
  : 'no significant difference at this sample size';
console.log(`\n  ${verdict}\n`);

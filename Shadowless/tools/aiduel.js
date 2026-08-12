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

const { CARD_DB, DECKS } = require('../src/cards.js');
const { EFFECTS } = require('../src/effects.js');
const { Engine } = require('../src/engine.js');

const N = parseInt(process.argv[2], 10) || 8;
const REF = process.argv[3] || 'HEAD';
// --control seats the BASELINE on both sides. Run it to read the per-deck table
// honestly: those rows count games where one side happened to hold that deck, and
// the decks are not balanced against each other (74/60/42/25 by CLAUDE.md). A
// deck sitting at 40% is only a regression if the control says it should be 50.
const CONTROL = process.argv.includes('--control');
const ROOT = path.join(__dirname, '..');

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
  E.newGame(DECKS[deckA], DECKS[deckB], ['A', 'B']);
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

const names = Object.keys(DECKS);
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

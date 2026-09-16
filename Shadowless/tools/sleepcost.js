#!/usr/bin/env node
// ============================================================================
// sleepcost.js — how many TURNS does one Asleep actually deny?
//
//   node tools/sleepcost.js              40,000 applications
//   node tools/sleepcost.js 5000         fewer, for a quick look
//
// WHY THIS EXISTS. AI.md's open item 5 sat unresolved for two weeks with THREE
// answers and no two alike: reading `endTurn` said 0.67, a 130-game sample said
// 1.20, and the shipped weights implied 0.85. The item also named the instrument
// that would settle it — "one that counts turns lost per APPLICATION rather than
// sampling the board, because the crude one cannot separate a re-application
// from a persistence" — and then nobody built it, because it reads like a
// research project and it is about forty lines.
//
// It is kept rather than thrown away for the reason probe.js is kept: #20 built
// a throwaway Chrome probe, found a real fault with it, deleted it, and the next
// session had to build it again. A number quoted in a doc that nobody can
// re-derive becomes folklore in about a month.
//
// WHAT IT MEASURES, EXACTLY. One Asleep applied to a real Active in a real
// Engine, then `endTurn()` until that player gets a turn they can act on. It
// counts the turns they could not act on. Nothing re-applies the status, which
// is the whole point — a board sample cannot tell a second Good Night from a
// coin that kept coming up tails, and that is how 0.67 became 1.20.
//
// WHAT IT DOES NOT MEASURE. What a denied turn is WORTH. A turn taken away on
// turn 3 and a turn taken away on turn 20 are the same row here and are not the
// same thing in a game. Do not retune a weight off this number alone; it settles
// the arithmetic, not the value. See MEASUREMENT.md.
// ============================================================================

const path = require('path');
const { Engine } = require('../src/engine.js');
const { CARD_DB, DECKS } = require('../src/cards.js');
const { EFFECTS } = require('../src/effects.js');

const N = parseInt(process.argv[2], 10) || 40000;
const deck = DECKS[Object.keys(DECKS)[0]];

let denied = 0, trials = 0;
const hist = {};
const t0 = Date.now();

for (let t = 0; t < N; t++) {
  const E = new Engine(CARD_DB, EFFECTS, { seed: 1000 + t, cfg: { prizeCount: 6 } });
  E.newGame(deck, deck, ['ME', 'THEM']);
  E.setupAuto(0); E.setupConfirm(0); E.setupAuto(1); E.setupConfirm(1);
  // Apply it on OUR turn, which is when an attack would. The first wake flip
  // then runs at the end of this turn, before they ever act — that single flip
  // is the whole reason the first missed attack is 50% and not 25%.
  while (E.state.active !== 0) E.endTurn();
  E.state.players[1].active.status.asleep = true;

  let missed = 0;
  for (let k = 0; k < 12; k++) {
    E.endTurn();
    if (E.state.phase === 'over') break;
    if (E.state.active !== 1) continue;
    if (E.canAttackAtAll(1)) break;      // awake: this application is spent
    missed++;
  }
  denied += missed; trials++;
  hist[missed] = (hist[missed] || 0) + 1;
}

const mean = denied / trials;
console.log(`\nsleep cost — ${trials.toLocaleString()} applications, ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
console.log(`  mean turns denied by ONE Asleep:  ${mean.toFixed(4)}`);
console.log(`  closed form 0.5 / (1 - 0.25):     ${(0.5 / 0.75).toFixed(4)}`);
console.log('');
for (const k of Object.keys(hist).sort((a, b) => a - b))
  console.log(`    missed ${k} turn(s)   ${(hist[k] / trials * 100).toFixed(2)}%`);
console.log('\n  paralysis denies exactly 1.000 by construction.');
console.log(`  ratio sleep:paralyze = ${mean.toFixed(4)}`);
// The implication, stated rather than applied. Reading a ratio off a run and
// editing a weight in the same session is how an unmeasured number becomes
// load-bearing; this prints the arithmetic and stops.
const W = require('../src/ai.js').AI_WEIGHTS || null;
const par = W && W.paralyze, slp = W && W.sleep;
if (par && slp) {
  console.log(`\n  shipped: paralyze ${par}, sleep ${slp}`);
  console.log(`  a paralyze of ${par} implies a sleep of ${(par * mean).toFixed(1)} — shipped is ${slp}.`);
}
console.log('\n  This settles the ARITHMETIC, not the value. AI.md item 5.\n');

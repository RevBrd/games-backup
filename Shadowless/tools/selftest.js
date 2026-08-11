// Statistical self-test for the Shadowless rules engine and AI.
//
//   node tools/selftest.js            quick pass  (~100 games)
//   node tools/selftest.js 40         deeper pass (40 seeds per matchup)
//
// This drives the SOURCE modules directly — they are DOM-free and export
// cleanly, so no browser and no DOM stubs are involved. Its companion,
// tools/smoke.js, tests the BUILT artifact including the UI layer. Run both:
// this one catches rules and AI regressions, that one catches build and UI
// regressions, and neither subsumes the other.

const { CARD_DB, DECKS } = require('../src/cards.js');
const { EFFECTS } = require('../src/effects.js');
const { Engine } = require('../src/engine.js');
require('../src/ai.js');
require('../src/deckgen.js');

// --- play one game to completion, both seats driven by the AI -------------
function playGame(deckA, deckB, seed, modeA = 'expert', modeB = 'expert') {
  const E = new Engine(CARD_DB, EFFECTS, { seed });
  E.newGame(DECKS[deckA], DECKS[deckB], ['A', 'B']);
  E.setupAuto(0); E.setupConfirm(0);
  E.setupAuto(1); E.setupConfirm(1);
  let acts = 0;
  // NOTE: winner can legitimately be 0, so test against null — never truthiness.
  while (E.state.winner === null && acts++ < 8000) {
    // Three things can owe an action: a Whirlwind switch, a forced promotion, or
    // just whoever's turn it is. The theme decks contain no Whirlwind today, but
    // relying on that would make this loop quietly wrong the moment they do.
    const st = E.state;
    const p = st.pendingSwitch !== null ? st.pendingSwitch
      : (st.pendingPromote === null || st.pendingPromote === undefined) ? st.active : st.pendingPromote;
    const action = E.aiChoose(p, p === 0 ? modeA : modeB);
    if (!action) return { stalled: true, turn: E.state.turn, acts, E };
    E.act(p, action);
  }
  return { winner: E.state.winner, turn: E.state.turn, acts, reason: E.state.winReason, E };
}

const N = parseInt(process.argv[2], 10) || 12;
const DECK_NAMES = Object.keys(DECKS);
let fail = 0;
const check = (ok, label, detail = '') => {
  if (!ok) fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
};

console.log(`\nShadowless self-test  (${N} seeds per matchup)\n`);

// --- 1. every deck is legal and fully implemented ------------------------
console.log('Deck validation');
for (const name of DECK_NAMES) {
  const r = new Engine(CARD_DB, EFFECTS, { seed: 1 }).validateDeck(DECKS[name]);
  check(r.ok, `${name} (${r.total} cards, ${r.basics} basics)`, r.errors.join('; '));
}

// --- 2. card coverage ----------------------------------------------------
// CARD_DB holds the whole set, implemented or not, so 100% is not the bar yet.
// Instead: pin the cards known to be unimplemented. A card that drops off this
// list is progress; a card that appears on it unexpectedly is a regression.
// Keep this list in step with the missing-cards section of CLAUDE.md.
// Base Set is COMPLETE — all 102 cards. Keep this list here rather than deleting
// the check: Job 6 widens the pool to Jungle and Fossil, and everything new
// arrives unimplemented. An empty set means "nothing is allowed to be missing".
const EXPECTED_UNIMPLEMENTED = new Set([]);

console.log('\nCard coverage');
const all = Object.keys(CARD_DB).filter(id => CARD_DB[id].kind !== 'energy');
const unscripted = all.filter(id => !EFFECTS[id]);
const surprises = unscripted.filter(id => !EXPECTED_UNIMPLEMENTED.has(id));
const done = [...EXPECTED_UNIMPLEMENTED].filter(id => EFFECTS[id]);

console.log(`  ${all.length - unscripted.length} of ${all.length} scriptable cards implemented`);
check(surprises.length === 0, 'no unexpected gaps in card coverage',
  surprises.map(id => `${id} ${CARD_DB[id].name}`).join(', '));
if (done.length) console.log(`  newly implemented since this list was written: `
  + done.map(id => CARD_DB[id].name).join(', ') + ' — trim EXPECTED_UNIMPLEMENTED');

// Whatever else is missing, the playable decks must be fully implemented.
const inDecks = new Set();
for (const d of Object.values(DECKS)) for (const [, id] of d.list) inDecks.add(id);
const brokenDeckCards = [...inDecks].filter(id => CARD_DB[id].kind !== 'energy' && !EFFECTS[id]);
check(brokenDeckCards.length === 0, 'every card in a playable deck is implemented',
  brokenDeckCards.join(', '));

// --- 2b. AI verb coverage ------------------------------------------------
// The card check above exists because an unimplemented card must never silently
// do nothing. This is the same failure one level up: ai.js scores attacks with a
// switch over verb names, and a verb it has no case for is valued as PLAIN BASE
// DAMAGE — no throw, no red suite, and the card works perfectly for the human.
// The AI just misplays it forever. See ENGINE.md, "The silent-failure surface".
//
// Source-scanned rather than introspected, because a `switch` is not reflectable
// at runtime. Comment lines are stripped from effects.js first, or the verb
// reference in its own header would count as usage.
//
// UNSCORED_ON_PURPOSE is the whole point of this check. A verb on it is a
// decision somebody made; a verb missing from it is an oversight. Before adding
// one, be sure it genuinely cannot change what the AI should choose.
const UNSCORED_ON_PURPOSE = new Set([
  // Legality gates. The engine refuses the attack outright, so an illegal one is
  // never in the action list for the AI to score in the first place.
  'REQUIRE_DEF_STATUS',
]);

console.log('\nAI verb coverage');
{
  const fs = require('fs');
  const rd = f => fs.readFileSync(require('path').join(__dirname, '..', 'src', f), 'utf8');
  const effSrc = rd('effects.js').replace(/^\s*\/\/.*$/gm, '');
  const aiSrc = rd('ai.js');

  const used = new Set([...effSrc.matchAll(/\bv:\s*'([A-Z_0-9]+)'/g)].map(m => m[1]));
  const handled = new Set([
    ...[...aiSrc.matchAll(/case\s*'([A-Z_0-9]+)'/g)].map(m => m[1]),
    ...[...aiSrc.matchAll(/\.v\s*===\s*'([A-Z_0-9]+)'/g)].map(m => m[1]),
  ]);

  const blind = [...used].filter(v => !handled.has(v) && !UNSCORED_ON_PURPOSE.has(v)).sort();
  const stale = [...UNSCORED_ON_PURPOSE].filter(v => !used.has(v)).sort();

  console.log(`  ${[...used].filter(v => handled.has(v)).length} of ${used.size} verbs scored`
    + `, ${UNSCORED_ON_PURPOSE.size} unscored on purpose`);
  check(blind.length === 0, 'every verb in effects.js is scored by ai.js or opted out',
    blind.join(', '));
  check(stale.length === 0, 'nothing on UNSCORED_ON_PURPOSE has left effects.js',
    stale.join(', '));
}

// --- 3. games finish, without throwing and without stalling --------------
console.log('\nFull games');
const rec = {}; let games = 0, turns = 0, stalls = 0, threw = [];
for (const a of DECK_NAMES) for (const b of DECK_NAMES) {
  if (a === b || a === 'Sandbox' || b === 'Sandbox') continue;
  for (let s = 1; s <= N; s++) {
    try {
      const g = playGame(a, b, s * 7919 + a.length * 31 + b.length);
      if (g.stalled) { stalls++; console.log(`  stall: ${a} v ${b} seed ${s} turn ${g.turn}`); continue; }
      rec[a] = rec[a] || [0, 0]; rec[b] = rec[b] || [0, 0];
      if (g.winner === 0) { rec[a][0]++; rec[b][1]++; } else { rec[b][0]++; rec[a][1]++; }
      games++; turns += g.turn;
    } catch (e) { threw.push(`${a} v ${b} seed ${s}: ${e.message}`); }
  }
}
check(threw.length === 0, `${games} games completed with no exception`, threw.slice(0, 3).join(' | '));
check(stalls === 0, 'no game stalled with a live board and no legal action');
console.log(`  ${games} games, average ${(turns / games).toFixed(1)} turns (${(turns / games / 2).toFixed(1)} each)`);

// --- 4. the AI ladder is ordered ----------------------------------------
console.log('\nAI ladder (mirror match, Brushfire, expert as player 0)');
for (const mode of ['random', 'greedy', 'novice', 'expert']) {
  let w = 0, n = 0;
  for (let s = 1; s <= N * 3; s++) {
    const g = playGame('Brushfire', 'Brushfire', s * 104729, 'expert', mode);
    if (g.stalled) continue;
    if (g.winner === 0) w++; n++;
  }
  const pct = (100 * w / n).toFixed(0);
  console.log(`  expert vs ${mode.padEnd(7)} ${String(w).padStart(3)}/${n}  (${pct}%)`);
  if (mode !== 'expert') check(w / n > 0.5, `expert beats ${mode}`);
}

// --- 5. deck balance, reported not asserted ------------------------------
console.log('\nDeck win rate (informational — these are the authentic theme decks,');
console.log('and the real ones were never balanced against each other)');
for (const k of Object.keys(rec).sort((x, y) => rec[y][0] / (rec[y][0] + rec[y][1]) - rec[x][0] / (rec[x][0] + rec[x][1]))) {
  const [w, l] = rec[k];
  console.log(`  ${k.padEnd(12)} ${String(w).padStart(3)}-${String(l).padEnd(3)}  ${(100 * w / (w + l)).toFixed(0)}%`);
}

console.log(fail === 0 ? '\nAll checks passed.\n' : `\n${fail} check(s) FAILED.\n`);
process.exit(fail === 0 ? 0 : 1);

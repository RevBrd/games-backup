// Headless self-test for the Shadowless rules engine.
//
//   node tools/selftest.js            quick pass  (~150 games)
//   node tools/selftest.js 40         deeper pass (40 seeds per matchup)
//
// The engine is pure logic with no DOM, so it can be lifted straight out of the
// HTML and driven in Node. This slices the file from `const CARD_DB` to the
// `// UI LAYER` banner and evaluates that — everything below the banner touches
// `document` and is left behind. If you ever split the file up (see CLAUDE.md),
// this is the seam to split on, and this harness should switch to `require`.

const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'shadowless.html'), 'utf8');
const start = HTML.indexOf('const CARD_DB = {');
const end = HTML.indexOf('// UI LAYER');
if (start < 0 || end < 0) throw new Error('Could not find the engine slice — did the section banners change?');

const sandbox = {};
new Function('exports', HTML.slice(start, end) + `
  Object.assign(exports, { CARD_DB, DECKS, EFFECTS, Engine, generateDeck, mulberry32, CONFIG_DEFAULTS, AI_WEIGHTS });
`)(sandbox);

const { CARD_DB, DECKS, EFFECTS, Engine } = sandbox;

// --- play one game to completion, both seats driven by the AI -------------
function playGame(deckA, deckB, seed, modeA = 'expert', modeB = 'expert') {
  const E = new Engine(CARD_DB, EFFECTS, { seed });
  E.newGame(DECKS[deckA], DECKS[deckB], ['A', 'B']);
  E.setupAuto(0); E.setupConfirm(0);
  E.setupAuto(1); E.setupConfirm(1);
  let acts = 0;
  // NOTE: winner can legitimately be 0, so test against null — never truthiness.
  while (E.state.winner === null && acts++ < 8000) {
    const pending = E.state.pendingPromote;
    const p = (pending === null || pending === undefined) ? E.state.active : pending;
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

// --- 2. every card in CARD_DB has an effect script -----------------------
console.log('\nCard coverage');
const unscripted = Object.keys(CARD_DB)
  .filter(id => CARD_DB[id].kind !== 'energy' && !EFFECTS[id]);
check(unscripted.length === 0, `${Object.keys(CARD_DB).length} cards in CARD_DB, all scripted`,
  unscripted.join(', '));

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

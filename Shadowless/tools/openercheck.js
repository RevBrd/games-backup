// ============================================================================
// OPENER CHECK — what the opening-Active rule actually promotes.
//
//   node tools/openercheck.js [data/base1_decks.json] [games]
//
// This DRIVES THE REAL ENGINE. The first version of this tool reimplemented
// setupAuto's rule in order to measure it, which meant it reported identical
// figures before and after the rule was fixed — it was measuring a copy of the
// code, not the code. Same shape as the green-for-the-wrong-reason trap in
// HISTORY.md. If you change what this measures, call the engine, never mirror it.
//
// It reports how often the opening Active is an evolution-line starter that is
// STRANDED — no evolution in hand, no spare copy — while a Basic that was not
// stranded sat in the same hand. That is the case HP alone cannot see.
//
// NOT pass/fail. It is a measurement, like aitest.js. See AI.md.
// ============================================================================
const fs = require('fs');
const path = require('path');
const { CARD_DB } = require('../src/cards.js');
const { Engine } = require('../src/engine.js');
const { EFFECTS } = require('../src/effects.js');

const file = process.argv[2] || 'data/base1_decks.json';
const N = parseInt(process.argv[3], 10) || 4000;
const decks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));

const evolvesInto = {};
Object.values(CARD_DB).forEach(c => { if (c.evolvesFrom) evolvesInto[c.evolvesFrom] = 1; });
const isBasic = c => c && c.kind === 'pokemon' && c.stage === 'Basic';

// Stranded = a line-starter with neither its evolution nor a spare copy in hand.
function strandedIn(card, hand) {
  if (!evolvesInto[card.name]) return false;
  const copies = hand.filter(x => CARD_DB[x.id] && CARD_DB[x.id].name === card.name).length;
  if (copies > 1) return false;
  return !hand.some(x => CARD_DB[x.id] && CARD_DB[x.id].evolvesFrom === card.name);
}

let gBad = 0, gTot = 0;
console.log(`opening-Active check — ${file}, ${N} games per deck, via the live engine
`);
console.log('deck                          stranded   (of hands with a real choice)');
for (const key of Object.keys(decks)) {
  if (key === '_meta') continue;
  const d = decks[key];
  let bad = 0, tot = 0;
  for (let g = 0; g < N; g++) {
    const E = new Engine(CARD_DB, EFFECTS, { seed: 1000 + g });
    E.newGame(d, d, ['A', 'B']);
    const hand = E.state.players[0].hand.slice();     // BEFORE placement
    const bas = hand.filter(x => isBasic(CARD_DB[x.id]));
    if (bas.length < 2) continue;                     // forced, not chosen
    // was there any non-stranded option at all?
    const anySafe = bas.some(x => !strandedIn(CARD_DB[x.id], hand));
    E.setupAuto(0);
    const act = E.state.players[0].active;
    if (!act) continue;
    tot++;
    if (anySafe && strandedIn(CARD_DB[act.stack[0].id], hand)) bad++;
  }
  gBad += bad; gTot += tot;
  const pct = tot ? (100 * bad / tot).toFixed(1) : 'n/a';
  console.log(`${(d.name || key).padEnd(28)} ${String(pct).padStart(6)}%   (${tot} of ${N})`);
}
console.log(`
OVERALL ${(100 * gBad / gTot).toFixed(1)}% of chosen openings strand a line-starter.`);

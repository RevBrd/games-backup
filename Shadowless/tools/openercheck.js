// ============================================================================
// OPENER CHECK — what the opening-Active rule actually promotes.
//
//   node tools/openercheck.js [data/base1_decks.json] [hands]
//
// `setupAuto` in engine.js chooses the opening Active by ONE line: sort the
// Basics in hand by HP, take the biggest. ai.js is never consulted. This deals
// hands against real deck lists and reports how often that rule strands an
// evolution-line starter in the Active spot while a standalone Basic was
// sitting in the same hand — the case the HP rule structurally cannot see.
//
// NOT pass/fail. It is a measurement, like aitest.js. See AI.md's Open list.
// ============================================================================
const fs = require('path') && require('fs');
const { CARD_DB } = require('../src/cards.js');

const file = process.argv[2] || 'data/base1_decks.json';
const N = parseInt(process.argv[3], 10) || 6000;
const decks = JSON.parse(fs.readFileSync(file, 'utf8'));

// Anything some other card evolves from is a line-starter.
const evolvesInto = {};
Object.values(CARD_DB).forEach(c => { if (c.evolvesFrom) evolvesInto[c.evolvesFrom] = 1; });

// Deterministic, so the figure is reproducible run to run.
let seed = 98765;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const isBasic = id => CARD_DB[id] && CARD_DB[id].kind === 'pokemon' && CARD_DB[id].stage === 'Basic';

let gBad = 0, gTot = 0;
console.log(`opening-Active check — ${file}, ${N} hands per deck\n`);
console.log('deck                          stranded   (of hands with a real choice)');
for (const key of Object.keys(decks)) {
  if (key === '_meta') continue;
  const d = decks[key];
  const pile = [];
  d.list.forEach(([q, id]) => { for (let i = 0; i < q; i++) pile.push(id); });

  let bad = 0, tot = 0;
  for (let g = 0; g < N; g++) {
    let hand;
    for (;;) {                                  // mulligan until a Basic shows
      const p = pile.slice();
      for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
      hand = p.slice(0, 7);
      if (hand.some(isBasic)) break;
    }
    const bas = hand.filter(isBasic).sort((x, y) => CARD_DB[y].hp - CARD_DB[x].hp);
    if (bas.length < 2) continue;               // forced, not chosen
    tot++;
    const pick = CARD_DB[bas[0]];
    const starter = !!evolvesInto[pick.name];
    const evoInHand = hand.some(id => CARD_DB[id] && CARD_DB[id].evolvesFrom === pick.name);
    const altStandalone = bas.slice(1).some(id => !evolvesInto[CARD_DB[id].name]);
    if (starter && !evoInHand && altStandalone) bad++;
  }
  gBad += bad; gTot += tot;
  console.log(`${(d.name || key).padEnd(28)} ${String((100 * bad / tot).toFixed(1)).padStart(6)}%   (${tot} of ${N})`);
}
console.log(`\nOVERALL ${(100 * gBad / gTot).toFixed(1)}% of chosen openings strand an evolution-starter.`);
console.log('The fix needs no new data — evolvesFrom is already in CARD_DB. See AI.md.');

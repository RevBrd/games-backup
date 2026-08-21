// ============================================================================
// DECK SIM — do the tiers actually order? Round-robin, AI on both sides.
//
//   node tools/decksim.js                       base1 decks, 6 Prizes, 45 seeds
//   node tools/decksim.js 45 4                  45 seeds, 4 Prizes
//   node tools/decksim.js 45 6 data/x_decks.json
//   node tools/decksim.js 30 6 data/base1_decks.json data/base2_decks.json
//
// MORE THAN ONE FILE merges the rosters into one field and adds a `from`
// column. That is a DIFFERENT question from the single-file run and the two
// answers are not interchangeable: one roster alone asks whether its own tiers
// order, and a five-deck field is small enough that one deck's type coverage
// can dominate it. Merging asks whether a later bracket actually sits above an
// earlier one, which is the question a second roster creates.
//
// OPPONENTS.md's tier table is a RECIPE — the five metrics agree because they
// were built together. This is the instrument that can disagree with it, by
// playing the decks. Every deck meets every other from BOTH seats on the same
// seeds, because seat correlates with a deterministic opening flip; aiduel.js
// shipped unmirrored for an hour and reported a 6-point edge that did not exist.
//
// NOT pass/fail. A tier boundary is real when the tiers separate here.
//
// It also reports how often each deck's ENGINE reaches play, which is usually
// the explanation for the standings: a centrepiece that lands a third of the
// time in a game that is decided by turn 20 is not a centrepiece.
// ============================================================================
const fs = require('fs'), path = require('path');
const { CARD_DB } = require('../src/cards.js');
const { Engine } = require('../src/engine.js');
const { EFFECTS } = require('../src/effects.js');
const { AI } = require('../src/ai.js');

const N  = parseInt(process.argv[2], 10) || 45;
const PR = parseInt(process.argv[3], 10) || 6;
const FILES = process.argv.slice(4).filter(a => !a.startsWith('--'));
if (!FILES.length) FILES.push('data/base1_decks.json');
// Merged, with a note of which file each deck came from. Keys have never
// collided (b1_*, b2_*) but a collision would silently delete a deck, so it is
// refused rather than trusted.
const D = {}, FROM = {};
for (const f of FILES) {
  const one = JSON.parse(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
  const tag = path.basename(f).replace(/_decks[.]json$/, '');
  for (const k of Object.keys(one)) {
    if (k === '_meta') continue;
    if (D[k]) { console.error(`duplicate deck key "${k}" in ${f}; rosters must not share keys`); process.exit(1); }
    D[k] = one[k]; FROM[k] = tag;
  }
}
const MULTI = FILES.length > 1;
const keys = Object.keys(D);

// THE BENCHMARK DECK — the closest thing this project has to a ground truth for
// AI quality, and it exists because Trevor said on 21 Aug 2026 that `b1_t4_fire`
// is very close to the deck HE used to win the whole Base Set bracket, and that
// it is still winning for him against the newer opponents.
//
// That converts an unfalsifiable question into a measurable one. A round robin
// runs the same AI on both sides, so it can say a deck is strong RELATIVE to the
// field and can never say the whole field is being played badly — a bot that
// retreats too much beats a bot that retreats too much about half the time. But
// a deck known to win in a human's hands finishing eighth of thirteen is not a
// fact about the deck.
//
// So this row is called out separately, and **its rank is an AI metric rather
// than a deck metric.** Move it by improving the bot, never by editing the deck.
const BENCH = process.argv.includes('--no-benchmark') ? null
  : ((process.argv.find(a => a.startsWith('--benchmark=')) || '').slice(12) || 'b1_t4_fire');

// The engine card is the highest-stage Pokemon the deck runs — good enough, and
// it means no deck file has to declare one.
function centrepiece(d) {
  let best = null, rank = -1;
  for (const [, id] of d.list) {
    const c = CARD_DB[id]; if (!c || c.kind !== 'pokemon') continue;
    const r = c.stage === 'Stage 2' ? 2 : c.stage === 'Stage 1' ? 1 : 0;
    if (r > rank) { rank = r; best = c.name; }
  }
  return rank >= 2 ? best : null;
}

const rec = {}; keys.forEach(k => rec[k] = { w: 0, n: 0, saw: 0, turns: [] });
const t0 = Date.now();
for (let i = 0; i < keys.length; i++) for (let j = 0; j < keys.length; j++) {
  if (i === j) continue;
  const eng = centrepiece(D[keys[i]]);
  for (let s = 0; s < N; s++) for (const seat of [0, 1]) {          // MIRRORED
    const pair = seat === 0 ? [D[keys[i]], D[keys[j]]] : [D[keys[j]], D[keys[i]]];
    const E = new Engine(CARD_DB, EFFECTS, { seed: 31000 + s * 97, cfg: { prizeCount: PR } });
    E.newGame(pair[0], pair[1], ['X', 'Y']);
    E.setupAuto(0); E.setupConfirm(0); E.setupAuto(1); E.setupConfirm(1);
    const bots = [new AI(E, { mode: 'expert' }), new AI(E, { mode: 'expert' })];
    let a = 0, landed = 0;
    while (E.state.winner === null && a++ < 8000) {
      const st = E.state;
      const p = st.pendingSwitch !== null ? st.pendingSwitch
        : (st.pendingPromote == null) ? st.active : st.pendingPromote;
      if (!landed && eng && E.allSlots(seat).some(sl =>
          CARD_DB[sl.stack[sl.stack.length - 1].id].name === eng)) landed = st.turn;
      const act = bots[p].choose(p); if (!act) break;
      E.act(p, act);
    }
    if (E.state.winner === null) continue;
    const r = rec[keys[i]];
    r.n++; if (E.state.winner === seat) r.w++;
    if (landed) { r.saw++; r.turns.push(landed); }
  }
}

console.log(`\ndeck sim — ${FILES.join(' + ')}, ${PR} Prizes, ${N} seeds x2 per ordered pair, ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
const rows = keys.map(k => {
  const r = rec[k], t = r.turns.sort((a, b) => a - b);
  return { k, tier: D[k].tier, from: FROM[k], wr: 100 * r.w / r.n, n: r.n,
           reach: 100 * r.saw / r.n, med: t.length ? t[Math.floor(t.length / 2)] : null,
           eng: centrepiece(D[k]) };
}).sort((a, b) => b.wr - a.wr);

console.log('rank  deck                      tier  ' + (MULTI ? 'from    ' : '') + '  win%   centrepiece      lands   median turn');
rows.forEach((r, i) => console.log(
  `${String(i + 1).padStart(3)}   ${r.k.padEnd(24)}  T${r.tier}  ` + (MULTI ? `${r.from.padEnd(8)}` : '')
  + `  ${r.wr.toFixed(1).padStart(5)}%  `
  + `${(r.eng || '—').padEnd(15)} ${(r.reach.toFixed(0) + '%').padStart(5)}   ${r.med ?? '—'}`));

// Does the tier label predict the standing?
const byTier = {};
rows.forEach(r => { (byTier[r.tier] = byTier[r.tier] || []).push(r.wr); });
console.log('\ntier averages:');
Object.keys(byTier).sort().forEach(t => {
  const v = byTier[t], m = v.reduce((a, b) => a + b, 0) / v.length;
  console.log(`  T${t}  ${m.toFixed(1)}%   (${v.length} deck${v.length > 1 ? 's' : ''}, `
    + `${Math.min(...v).toFixed(1)}–${Math.max(...v).toFixed(1)})`);
});
if (BENCH && D[BENCH]) {
  const i = rows.findIndex(r => r.k === BENCH), r = rows[i];
  console.log(`
benchmark — ${BENCH} is the deck Trevor won the Base Set bracket with`);
  console.log(`  rank ${i + 1} of ${rows.length}   ${r.wr.toFixed(1)}%   `
    + `${r.eng || '-'} lands ${r.reach.toFixed(0)}% at median turn ${r.med ?? '-'}`);
  console.log('  Its RANK is a measure of the AI, not of the deck. See MEASUREMENT.md.');
}

if (MULTI) {
  const byFile = {};
  rows.forEach(r => { (byFile[r.from] = byFile[r.from] || []).push(r.wr); });
  console.log('\nroster averages:');
  Object.keys(byFile).sort().forEach(f => {
    const v = byFile[f], m = v.reduce((a, b) => a + b, 0) / v.length;
    console.log(`  ${f.padEnd(6)}  ${m.toFixed(1)}%   (${v.length} decks, `
      + `${Math.min(...v).toFixed(1)}–${Math.max(...v).toFixed(1)})`);
  });
}
console.log('\nA tier boundary is only real if the bands do not overlap. See OPPONENTS.md.');

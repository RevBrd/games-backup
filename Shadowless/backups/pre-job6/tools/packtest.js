// Booster pack tests — src/packs.js.
//
//   node tools/packtest.js              200,000 packs
//   node tools/packtest.js 20000        faster pass while iterating
//
// Half of this is structural (a pack is 11 cards, the Energy floor holds, no
// card repeats itself). The other half is the point: PACKS.md's rarity table
// is a PACING SCHEDULE — "one Shadowless every 200 packs" — and a pacing
// schedule is a claim about long-run frequency that can only be checked by
// running it. So it runs it, and compares observed packs-per-hit against the
// numbers the document promises.
//
// The seed is fixed, so this is deterministic and cannot flake. Tolerances are
// therefore set to catch a real mistake (a wrong denominator, a roll on the
// wrong slot count) rather than to accommodate noise.

const { CARD_DB } = require('../src/cards.js');
const { mulberry32 } = require('../src/engine.js');
const P = require('../src/packs.js');
const C = require('../src/collection.js');

const N = parseInt(process.argv[2], 10) || 200000;
let fail = 0, pass = 0;
const check = (ok, label, detail = '') => {
  if (ok) pass++; else fail++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
};
const eq = (a, b, label) => check(a === b, label, a === b ? '' : `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const head = t => console.log(`\n${t}`);

// Observed packs-per-hit vs. what PACKS.md promises, within a tolerance.
const near = (observed, want, tolPct, label) => {
  const off = Math.abs(observed - want) / want * 100;
  check(off <= tolPct, label, `1 per ${observed.toFixed(1)} packs, want ~${want} (${off.toFixed(1)}% off)`);
};

// ===========================================================================
head('Pools partition Base Set correctly');

const pools = P.buildPools(CARD_DB, 'base1');
eq(pools.rareHolo.length, 16, 'sixteen Rare Holo');
eq(pools.rare.length, 16, 'sixteen non-holo Rare');
eq(pools.uncommon.length, 32, 'thirty-two Uncommon');
eq(pools.energy.length, 6, 'six basic Energy');
eq(pools.common.length, 38, 'the Common bucket is 32 Common plus the 6 Energy');
const allPooled = pools.rareHolo.length + pools.rare.length + pools.uncommon.length + pools.common.length;
eq(allPooled, 102, 'every one of the 102 cards is reachable from a pack');

// Double Colorless is Energy by kind but Uncommon by rarity, and is NOT basic
// Energy — the floor is about basic Energy for a first deck.
const dce = Object.keys(CARD_DB).find(id => CARD_DB[id].name === 'Double Colorless Energy');
check(pools.uncommon.indexOf(dce) >= 0, 'Double Colorless sits in the Uncommon pool');
check(pools.energy.indexOf(dce) < 0, 'and does not count toward the Energy floor');
check(pools.energy.every(id => CARD_DB[id].cls === 'Basic'), 'the Energy floor pool is basic Energy only');

eq(P.promoPool(CARD_DB).length, 0, 'no promos are loaded at Base Set, so none can intrude');

// ===========================================================================
head('One pack, structurally');

const one = P.openPack(CARD_DB, 'base1', mulberry32(7));
eq(one.cards.length, 11, 'a pack is eleven cards');
eq(one.cards.filter(c => c.slot === 'rare').length, 1, 'exactly one Rare slot');
eq(one.cards.filter(c => c.slot === 'uncommon').length, 3, 'three Uncommon');
eq(one.cards.filter(c => c.slot === 'common').length, 7, 'seven Common-tier');
eq(one.cards[0].slot, 'rare', 'the Rare comes first, so a reveal can build to it');
check(one.cards.every(c => !!CARD_DB[c.id]), 'every card in a pack is a real card');

const again = P.openPack(CARD_DB, 'base1', mulberry32(7));
eq(JSON.stringify(again), JSON.stringify(one), 'the same seed opens the same pack');
const other = P.openPack(CARD_DB, 'base1', mulberry32(8));
check(JSON.stringify(other) !== JSON.stringify(one), 'a different seed does not');

throws_(() => P.openPack(CARD_DB, 'base2', mulberry32(1)), 'a set with no cards loaded refuses to fill a pack');
function throws_(fn, label) {
  try { fn(); check(false, label, 'did not throw'); } catch (e) { check(true, label); }
}

// ===========================================================================
head(`Opening ${N.toLocaleString()} packs`);

const t0 = Date.now();
const rand = mulberry32(20260809);
const tally = { firstEd: 0, rh: 0, sh: 0, sl: 0, mp: 0, holo: 0, intrusion: 0 };
const mpFlavour = {};
let energyShort = 0, dupes = 0, wrongSize = 0, rareRH = 0, feStraggler = 0;
let totalCards = 0, energyCards = 0;
const seenIds = {};

for (let i = 0; i < N; i++) {
  const pk = P.openPack(CARD_DB, 'base1', rand, { pools });
  if (pk.cards.length !== 11) wrongSize++;
  totalCards += pk.cards.length;

  if (pk.firstEd) tally.firstEd++;
  if (pk.intrusion) tally.intrusion++;
  if (pk.cards[0].holo) tally.holo++;

  let nEnergy = 0;
  const seenHere = {};
  for (const c of pk.cards) {
    seenIds[c.id] = 1;
    const card = CARD_DB[c.id];
    const isBasicEnergy = card.kind === 'energy' && card.cls === 'Basic';
    if (isBasicEnergy) { nEnergy++; energyCards++; }
    else if (seenHere[c.id]) dupes++;
    seenHere[c.id] = 1;

    if (c.flags.indexOf('rh') >= 0) { tally.rh++; if (c.slot === 'rare') rareRH++; }
    if (c.flags.indexOf('sh') >= 0) tally.sh++;
    if (c.flags.indexOf('sl') >= 0) tally.sl++;
    const mp = c.flags.find(f => f[0] === 'm');
    if (mp) { tally.mp++; mpFlavour[mp] = (mpFlavour[mp] || 0) + 1; }

    // 1st Edition is a WHOLE-PACK roll: if the pack has it, every card has it.
    if (pk.firstEd !== (c.flags.indexOf('fe') >= 0)) feStraggler++;
  }
  if (nEnergy < 2) energyShort++;
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`  (${secs}s)`);

// --- structural, across the whole run ------------------------------------
eq(wrongSize, 0, 'every pack was eleven cards');
eq(energyShort, 0, 'every Base Set pack met the two-Energy floor');
eq(dupes, 0, 'no pack ever repeated a non-Energy card');
eq(feStraggler, 0, '1st Edition is all-or-nothing across a pack');
eq(rareRH, 0, 'Reverse Holo never lands on the Rare slot');
eq(tally.intrusion, 0, 'no intrusion is possible with no promo pool loaded');
eq(Object.keys(seenIds).length, 102, 'all 102 Base Set cards are actually reachable');
eq(Object.keys(mpFlavour).length, 3, 'all three Misprint flavours occur');

// The floor is a floor, not a quota — Energy should sometimes exceed 2,
// because the general Common pool contains it too.
const energyPerPack = energyCards / N;
check(energyPerPack > 2.0 && energyPerPack < 3.2, 'Energy averages a little above the floor',
  `${energyPerPack.toFixed(3)} per pack`);

// ===========================================================================
head('Do the odds match the pacing schedule in PACKS.md?');

near(N / tally.holo, 3, 2, 'Rare slot is holo about one time in three');
near(N / tally.firstEd, 25, 4, '1st Edition: one pack in ~25');
near(N / tally.rh, 10, 4, 'Reverse Holo: one pack in ~10');
near(N / tally.sh, 40, 6, 'Shiny: one pack in ~40');
near(N / tally.sl, 200, 12, 'Shadowless: one pack in ~200');
near(N / tally.mp, 1000, 25, 'Misprint: one pack in ~1000');

// The ladder PACKS.md asks to be preserved if these are ever retuned: each
// tier roughly 5x the one below. Checked as a property of the table rather
// than of any single number, so a retune that breaks the SHAPE gets caught.
head('The ~5x ladder holds');
const rungs = [
  ['Reverse Holo', N / tally.rh],
  ['Shiny', N / tally.sh],
  ['Shadowless', N / tally.sl],
  ['Misprint', N / tally.mp],
];
for (let i = 1; i < rungs.length; i++) {
  const ratio = rungs[i][1] / rungs[i - 1][1];
  check(ratio >= 3.2 && ratio <= 7, `${rungs[i][0]} is ~5x rarer than ${rungs[i - 1][0]}`,
    `${ratio.toFixed(2)}x`);
}

// ===========================================================================
head('Intrusion, with a promo pool supplied');

// No promos exist at Base Set, so a fake pool proves the mechanism instead of
// waiting for Job 8. Odds are raised so the run does not need to be enormous.
const fakePromos = ['base1-4', 'base1-58'];
let intruded = 0, intrudedRare = 0, intrudedSize = 0;
const ir = mulberry32(99);
for (let i = 0; i < 20000; i++) {
  const pk = P.openPack(CARD_DB, 'base1', ir, { pools, promos: fakePromos, odds: { intrusion: 0.5 } });
  if (!pk.intrusion) continue;
  intruded++;
  if (pk.cards.length !== 11) intrudedSize++;
  if (pk.cards[0].slot === 'promo') intrudedRare++;
  if (pk.cards.filter(c => c.slot === 'promo').length !== 1) intrudedSize++;
}
check(intruded > 9000 && intruded < 11000, 'intrusion fires at the rate it is given', `${intruded}/20000`);
eq(intrudedRare, 0, 'an intrusion never displaces the Rare slot');
eq(intrudedSize, 0, 'and an intruded pack is still eleven cards with one promo');

// ===========================================================================
head('A pack feeds the collection directly');

// The reason packs.js emits flag ARRAYS rather than canonical keys: grant()
// canonicalises, so the two modules need no knowledge of each other.
const save = C.newSave({ now: 1 });
const pk = P.openPack(CARD_DB, 'base1', mulberry32(3));
for (const c of pk.cards) C.grant(save, c.id, c.flags);
let owned = 0;
for (const id in save.owned) owned += C.ownedTotal(save, id);
eq(owned, 11, 'all eleven cards land in the collection');
check(C.collectionStats(save, CARD_DB).cards.owned <= 11, 'and the dex counts them as distinct cards');

// A 1st Edition pack must produce piles that are actually flagged, not plain.
const feSave = C.newSave({ now: 1 });
const fePack = P.openPack(CARD_DB, 'base1', mulberry32(1), { pools, odds: { firstEd: 1 } });
for (const c of fePack.cards) C.grant(feSave, c.id, c.flags);
const anyPlain = Object.keys(feSave.owned).some(id => feSave.owned[id][''] > 0);
check(!anyPlain, 'nothing from a 1st Edition pack is stored as plain');
check(C.vflags(C.bestVariant(feSave, fePack.cards[0].id)).indexOf('fe') >= 0,
  'and the stored key really carries the 1st Edition flag');

// ===========================================================================
// INFORMATIONAL — no assertions. How long is the collection game?
//
// This is the number Job 5's economy actually turns on, and nothing in
// PACKS.md computes it: the per-axis odds say how often a Shiny appears, not
// how long it takes to finish a set. Printed the way selftest.js prints deck
// win rates — a measurement to design against, not a pass/fail.
//
// The Rare slot dominates, and it is worth understanding why: 32 Rares split
// across a 2:1 holo roll means the 16 holos each arrive at 1/3 x 1/16 per
// pack. Commons and Uncommons finish long before them.
head('How many packs to finish Base Set?  (informational)');

function packsToComplete(seed, predicate) {
  const r = mulberry32(seed);
  const need = {};
  let missing = 0;
  for (const id in CARD_DB) if (predicate(CARD_DB[id])) { need[id] = 1; missing++; }
  let opened = 0;
  while (missing > 0 && opened < 200000) {
    opened++;
    for (const c of P.openPack(CARD_DB, 'base1', r, { pools }).cards) {
      if (need[c.id]) { delete need[c.id]; missing--; }
    }
  }
  return opened;
}

const TRIALS = 40;
const median = xs => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const runs = {
  'Commons + Energy': [], 'Uncommons': [], 'Rares (non-holo)': [], 'Rare Holos': [], 'ALL 102': [],
};
for (let t = 0; t < TRIALS; t++) {
  runs['Commons + Energy'].push(packsToComplete(500 + t, c => c.rarity === 'Common' || (c.kind === 'energy' && c.cls === 'Basic')));
  runs['Uncommons'].push(packsToComplete(600 + t, c => c.rarity === 'Uncommon'));
  runs['Rares (non-holo)'].push(packsToComplete(700 + t, c => c.rarity === 'Rare'));
  runs['Rare Holos'].push(packsToComplete(800 + t, c => c.rarity === 'Rare Holo'));
  runs['ALL 102'].push(packsToComplete(900 + t, () => true));
}
for (const k in runs) {
  const xs = runs[k];
  const med = median(xs);
  console.log(`  ${k.padEnd(18)} median ${String(med).padStart(4)} packs  ` +
    `(${Math.min(...xs)}-${Math.max(...xs)})   ~${Math.round(med / 2)} wins at 2 packs/win`);
}
console.log('  Nothing here is asserted — it is the pacing measurement Job 5 should design against.');

// ===========================================================================
console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail ? 1 : 0);

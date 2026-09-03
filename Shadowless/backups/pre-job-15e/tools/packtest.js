// Booster pack tests — src/packs.js.
//
//   node tools/packtest.js              200,000 packs
//   node tools/packtest.js 20000        faster pass while iterating
//
// Half of this is structural (a pack is PACK_SIZE cards, the Energy floor
// holds, no card repeats itself). The other half is the point: PACKS.md's
// rarity table is a PACING SCHEDULE — "one Shadowless every N packs" — and a
// pacing schedule is a claim about long-run frequency that can only be
// checked by running it. So it runs it, and compares observed packs-per-hit
// against what the odds in PACK_ODDS actually predict.
//
// Most per-axis targets below are DERIVED from PACK_ODDS + PACK_SHAPE rather
// than copied as literals — 25 Aug 2026, after the pack shrank from 11 cards
// to 8 and every one of Reverse Holo/Shiny/Shadowless/Misprint's hardcoded
// "~10"/"~40"/"~200"/"~1000" targets went stale at once, because all four
// roll per SLOT and the slot count moved. A literal target silently rots the
// next time PACK_SHAPE changes; a derived one cannot.
//
// The seed is fixed, so this is deterministic and cannot flake. Tolerances are
// therefore set to catch a real mistake (a wrong denominator, a roll on the
// wrong slot count) rather than to accommodate noise.

const { CARD_DB } = require('../src/cards.js');
const { mulberry32 } = require('../src/engine.js');
const P = require('../src/packs.js');
const C = require('../src/collection.js');

const N = parseInt(process.argv[2], 10) || 200000;
// The set every measurement below is taken against. Base Set remains the one
// the pacing schedule in PACKS.md was designed around.
const SET = 'base1';
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
  check(off <= tolPct, label, `1 per ${observed.toFixed(1)} packs, want ~${want.toFixed(1)} (${off.toFixed(1)}% off)`);
};
// A rate (0-1), for the per-card jump odds — the actual PACK_ODDS values,
// rather than a derived pack-level frequency.
const nearRate = (observed, want, tolPct, label) => {
  const off = Math.abs(observed - want) / want * 100;
  check(off <= tolPct, label,
    `${(observed * 100).toFixed(2)}%, want ~${(want * 100).toFixed(2)}% (${off.toFixed(1)}% off)`);
};

// Expected packs-per-hit for a flat per-slot probability `p` rolled
// independently across `slots` cards in every pack — the general form behind
// "one Shadowless every N packs". See the header comment for why these
// targets are computed rather than copied.
const packsPerHit = (p, slots) => 1 / (1 - Math.pow(1 - p, slots));
const RH_SLOTS = P.PACK_SHAPE.uncommon + P.PACK_SHAPE.common;   // the Rare slot is excluded
const RH_TARGET = packsPerHit(P.PACK_ODDS.reverseHolo, RH_SLOTS);
const SHINY_TARGET = packsPerHit(P.PACK_ODDS.shiny, P.PACK_SIZE);
const SL_TARGET = packsPerHit(P.PACK_ODDS.shadowless, P.PACK_SIZE);
const MP_TARGET = packsPerHit(P.PACK_ODDS.misprint, P.PACK_SIZE);

// ===========================================================================
head('Pools partition Base Set correctly');

const pools = P.buildPools(CARD_DB, 'base1');
eq(pools.rareHolo.length, 16, 'sixteen Rare Holo');
eq(pools.rare.length, 16, 'sixteen non-holo Rare');
eq(pools.uncommon.length, 32, 'thirty-two Uncommon');
eq(pools.energy.length, 6, 'six basic Energy');
eq(pools.common.length, 38, 'the Common bucket is 32 Common plus the 6 Energy');
const allPooled = pools.rareHolo.length + pools.rare.length + pools.uncommon.length + pools.common.length;
const setSize = Object.keys(CARD_DB).filter(id => CARD_DB[id].set === SET).length;
eq(allPooled, setSize, `every one of the ${setSize} cards is reachable from a pack`);

// Double Colorless is Energy by kind but Uncommon by rarity, and is NOT basic
// Energy — the floor is about basic Energy for a first deck.
const dce = Object.keys(CARD_DB).find(id => CARD_DB[id].name === 'Double Colorless Energy');
check(pools.uncommon.indexOf(dce) >= 0, 'Double Colorless sits in the Uncommon pool');
check(pools.energy.indexOf(dce) < 0, 'and does not count toward the Energy floor');
check(pools.energy.every(id => CARD_DB[id].cls === 'Basic'), 'the Energy floor pool is basic Energy only');

// PROMO INTRUSION IS OPT-IN, and this used to be asserted by a proxy that Job 13
// falsified. The line was `promoPool(CARD_DB).length === 0` labelled "so none can
// intrude" — but that was only ever true because `basep` was not in the build. It
// measured what had been GENERATED while claiming to measure what the pack DOES,
// and the moment the promos were generated it read 53 and went red without a
// single behaviour having changed.
//
// The property that actually holds the line is openPack's `opts.promos || []`: a
// pack intrudes nothing unless a caller hands it an eligible pool. That is now
// asserted directly, against a build that HAS the promos in it, which is the only
// version of this test worth having.
{
  const promos = P.promoPool(CARD_DB);
  check(promos.length > 0, 'the promo pool is non-empty once basep is generated', `${promos.length} promos`);
  check(promos.every(id => P.NON_BOOSTER_SETS[CARD_DB[id].set]),
    'and holds nothing from a booster set');
  eq(P.promoPool(CARD_DB, ['base1']).length, 0,
    'gating to a booster set alone yields no eligible promos');
  eq(P.promoPool(CARD_DB, ['basep']).length, promos.length,
    'gating to basep yields all of them — the switch has something to hand over');

  // The real guard: 20,000 ordinary packs, promos generated, none passed in.
  let intruded = 0;
  const pools = P.buildPools(CARD_DB, SET);
  for (let i = 0; i < 20000; i++) {
    const pk = P.openPack(CARD_DB, SET, mulberry32(90000 + i), { pools });
    if (pk.intrusion || pk.cards.some(c => c.slot === 'promo')) intruded++;
  }
  eq(intruded, 0, 'no pack intrudes a promo unless the caller supplies the eligible pool');

  // ...and that it DOES when one is supplied, or the guard above is vacuous.
  let withPool = 0;
  for (let i = 0; i < 20000; i++) {
    const pk = P.openPack(CARD_DB, SET, mulberry32(90000 + i), { pools, promos });
    if (pk.intrusion) withPool++;
  }
  check(withPool > 0, 'and DOES intrude when one is supplied — the control', `${withPool} of 20000`);
}

// ===========================================================================
head('One pack, structurally');

const one = P.openPack(CARD_DB, 'base1', mulberry32(7));
eq(one.cards.length, P.PACK_SIZE, `a pack is ${P.PACK_SIZE} cards`);
// Exactly one Rare slot is no longer a promise — the guarantee is "at LEAST
// one", since 25 Aug 2026 a lesser slot can jump up and add a second (or
// third) Rare-tier card. See the jump-rate section below for how often.
check(one.cards.filter(c => c.slot === 'rare').length >= 1, 'at least one Rare-tier card, the guaranteed slot');
eq(one.cards[0].slot, 'rare', 'the Rare comes first, so a reveal can build to it');
check(one.cards.every(c => !!CARD_DB[c.id]), 'every card in a pack is a real card');

const again = P.openPack(CARD_DB, 'base1', mulberry32(7));
eq(JSON.stringify(again), JSON.stringify(one), 'the same seed opens the same pack');
const other = P.openPack(CARD_DB, 'base1', mulberry32(8));
check(JSON.stringify(other) !== JSON.stringify(one), 'a different seed does not');

// A set code this build has no cards for. Was 'base2' until Jungle generated,
// at which point it started asserting that a real set was empty.
throws_(() => P.openPack(CARD_DB, 'neo4', mulberry32(1)), 'a set with no cards loaded refuses to fill a pack');
function throws_(fn, label) {
  try { fn(); check(false, label, 'did not throw'); } catch (e) { check(true, label); }
}

// ===========================================================================
head(`Opening ${N.toLocaleString()} packs`);

const t0 = Date.now();
const rand = mulberry32(20260809);
const tally = { firstEd: 0, rh: 0, sh: 0, sl: 0, mp: 0, holo: 0, intrusion: 0 };
const mpFlavour = {};
let energyShort = 0, energyOver = 0, dupes = 0, wrongSize = 0, rareRH = 0, feStraggler = 0;
let totalCards = 0, energyCards = 0;
let jumpU2R = 0, jumpC2U = 0, jumpC2R = 0, bonusRarePacks = 0;
const seenIds = {};

for (let i = 0; i < N; i++) {
  const pk = P.openPack(CARD_DB, 'base1', rand, { pools });
  if (pk.cards.length !== P.PACK_SIZE) wrongSize++;
  totalCards += pk.cards.length;

  if (pk.firstEd) tally.firstEd++;
  if (pk.intrusion) tally.intrusion++;
  if (pk.cards[0].holo) tally.holo++;
  if (pk.cards.filter(c => c.slot === 'rare').length > 1) bonusRarePacks++;

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
    if (c.jump === 'u2r') jumpU2R++;
    else if (c.jump === 'c2u') jumpC2U++;
    else if (c.jump === 'c2r') jumpC2R++;

    // 1st Edition is a WHOLE-PACK roll: if the pack has it, every card has it.
    if (pk.firstEd !== (c.flags.indexOf('fe') >= 0)) feStraggler++;
  }
  if (nEnergy < 2) energyShort++;
  if (nEnergy > P.ENERGY_CAP) energyOver++;
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`  (${secs}s)`);

// --- structural, across the whole run ------------------------------------
eq(wrongSize, 0, `every pack was ${P.PACK_SIZE} cards`);
eq(energyShort, 0, 'every Base Set pack met the two-Energy floor');
eq(dupes, 0, 'no pack ever repeated a non-Energy card');
eq(feStraggler, 0, '1st Edition is all-or-nothing across a pack');
eq(rareRH, 0, 'Reverse Holo never lands on the Rare slot');
eq(tally.intrusion, 0, 'no intrusion is possible with no promo pool loaded');
eq(Object.keys(seenIds).length, setSize, `all ${setSize} ${SET} cards are actually reachable`);
eq(Object.keys(mpFlavour).length, 3, 'all three Misprint flavours occur');

// THE FLOOR AND THE CAP MEET AT TWO for base1 — 16 Aug 2026. This used to
// assert the opposite ("Energy averages a little above the floor", 2.0-3.2 per
// pack) because the five non-floor Common slots drew from a pool containing
// Energy. Trevor, from play: too many Energy reads as being robbed of cards.
const energyPerPack = energyCards / N;
check(energyPerPack === 2, 'a floored set delivers exactly the cap, never more',
  `${energyPerPack.toFixed(3)} per pack`);
eq(energyOver, 0, 'and no pack anywhere exceeds ENERGY_CAP');

// ===========================================================================
head('Do the odds match the pacing schedule in PACKS.md?');

near(N / tally.holo, 3, 2, 'Rare slot is holo about one time in three');
near(N / tally.firstEd, 20, 3, '1st Edition: one pack in ~20');
near(N / tally.rh, RH_TARGET, 4, `Reverse Holo: one pack in ~${RH_TARGET.toFixed(1)}`);
near(N / tally.sh, SHINY_TARGET, 6, `Shiny: one pack in ~${SHINY_TARGET.toFixed(1)}`);
near(N / tally.sl, SL_TARGET, 12, `Shadowless: one pack in ~${SL_TARGET.toFixed(1)}`);
near(N / tally.mp, MP_TARGET, 25, `Misprint: one pack in ~${MP_TARGET.toFixed(1)}`);

// ===========================================================================
head('Does the bonus rare-tier jump land where v3 tuned it? (25 Aug 2026)');

// Common-slot jumps are only rolled on the slots that reach the while loop in
// openPack — the Energy FLOOR is drawn before it and is deliberately exempt
// (a set's Energy guarantee has to stay a guarantee, not "usually two"). base1
// is the one live set with a floor, and this whole run only opens base1
// packs, so the per-card denominator has to subtract it out or the observed
// rate reads as mysteriously low against the configured odds.
const eligibleCommon = P.PACK_SHAPE.common - (P.ENERGY_FLOOR[SET] || 0);
nearRate(jumpU2R / (N * P.PACK_SHAPE.uncommon), P.PACK_ODDS.jumpUncommonToRare, 6,
  'Uncommon-to-Rare jump fires at its per-card odds');
nearRate(jumpC2U / (N * eligibleCommon), P.PACK_ODDS.jumpCommonToUncommon, 6,
  'Common-to-Uncommon jump fires at its per-card odds (floor-exempt slots excluded)');
nearRate(jumpC2R / (N * eligibleCommon), P.PACK_ODDS.jumpCommonToRare, 15,
  'Common-to-Rare (two-tier) jump fires at its per-card odds (floor-exempt slots excluded)');

// The two design goals from the tuning conversation — Trevor: a bonus
// Rare-tier card should feel more common than Reverse Holo, and the two-tier
// jump should feel rarer than it. Checked against what this run actually
// produced, not a formula, because base1's floor is exactly the kind of
// interaction a formula can get wrong quietly (it did, once, above).
//
// INFORMATIONAL rather than asserted, and on purpose: base1 is the one live
// set where the floor trims 2 of its 5 Common slots out of jump eligibility,
// so its bonus-rare rate runs closer to Reverse Holo's than every other live
// set does (see the per-set sweep below for the sets without a floor). Left
// as a print rather than a `check` because whether that's an acceptable
// Base-Set-is-already-the-exception outcome, or something to retune further,
// is Trevor's call — the same way ENERGY_FLOOR itself was.
//
// THE GOAL IS RETIRED — 1 Sep 2026, Job 15b — AND THE PRINT IS KEPT. Restoring
// Reverse Holo to its pre-shrink pacing moved it to ~9.5% of packs, above the
// bonus-rare rate in EVERY set rather than only in base1, so "does it clear it"
// is now uniformly no. That is the intended outcome and the reasoning is in
// PACK_ODDS: the rule was anchored to a Reverse Holo rate that was itself 44%
// below its design intent, and the rarer of the two surprises being the more
// valuable one is the right way round.
//
// **What is worth watching is now the OTHER number**, and it is why this stayed:
// base1's own bonus-rare rate against everyone else's. That gap is the real
// asymmetry the floor creates, it is ~0.2 points (6.7% vs 6.9-7.0%), and it was
// only ever alarming because it was being read against a moving target.
const rhRate = tally.rh / N, bonusRareRate = bonusRarePacks / N;
console.log(`  base1: bonus Rare-tier card ${(bonusRareRate * 100).toFixed(2)}% of packs ` +
  `vs Reverse Holo ${(rhRate * 100).toFixed(2)}% — ordering retired 1 Sep 2026, see PACK_ODDS`);

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
// EVERY LIVE SET, AND THE RNG PATH THE GAME ACTUALLY USES — 24 Aug 2026.
//
// Both halves of this exist because of a report from Trevor that his Shiny and
// 1st Edition pulls felt too frequent, and both are gaps the 200,000-pack run
// above could not have seen no matter how large it got:
//
//   1. It only ever opened `base1`. Three other sets are live, the pools differ
//      in size and rarity split, and he was opening Team Rocket. A gate that
//      covers a quarter of the live content and reports clean is the shape
//      MISREADINGS.md is full of.
//   2. It reuses ONE mulberry32 stream across every pack. The game makes a
//      FRESH mulberry32 per pack, seeded from Math.random() — so every real
//      pack samples the first ~50 outputs of a brand new stream, and that is
//      the one property a single long stream can never test. A PRNG whose
//      early output was biased as a function of its seed would have produced
//      exactly the symptom reported, while this file stayed green forever.
//
// Both came back clean, and that is a result rather than a formality: it is
// what turns "the odds are broken" into "you got lucky", which is not a claim
// anyone should make without having looked.
head('The rates hold in every live set');

const LIVE_SETS = ['base1', 'base2', 'base3', 'base5'];
// A quarter of the main run each, so the sweep costs about what one more set
// of the main run would. Tolerances are widened to match the smaller sample
// rather than to accommodate a fault — at N/4 the Shadowless interval is
// genuinely that wide, and pretending otherwise is how a gate starts flaking.
const SWEEP = Math.max(4000, Math.round(N / 4));
for (const set of LIVE_SETS) {
  const rng = mulberry32(20260824);
  const st = { fe: 0, rh: 0, sh: 0, sl: 0, bonusRare: 0 };
  for (let i = 0; i < SWEEP; i++) {
    const pk = P.openPack(CARD_DB, set, rng);
    if (pk.firstEd) st.fe++;
    if (pk.cards.filter(c => c.slot === 'rare').length > 1) st.bonusRare++;
    for (const c of pk.cards) {
      if (c.flags.indexOf('rh') >= 0) st.rh++;
      if (c.flags.indexOf('sh') >= 0) st.sh++;
      if (c.flags.indexOf('sl') >= 0) st.sl++;
    }
  }
  // Misprint is deliberately absent: at 1-in-1000 the sweep sample holds ~50
  // hits and the interval is wider than any fault worth catching. The main run
  // above is where that one is asserted, and saying so beats a check that
  // passes whatever happens.
  near(SWEEP / st.fe, 20, 8, `${set}: 1st Edition`);
  near(SWEEP / st.rh, RH_TARGET, 8, `${set}: Reverse Holo`);
  near(SWEEP / st.sh, SHINY_TARGET, 15, `${set}: Shiny`);
  near(SWEEP / st.sl, SL_TARGET, 30, `${set}: Shadowless`);

  // Design intent — INFORMATIONAL, not asserted, and that took a wrong turn
  // to learn. The true gap in expectation is only ~0.2 percentage points
  // (bonus-rare ~7.5% vs Reverse Holo ~6.8% at these odds), and at a 50,000-
  // pack sample that is inside ordinary sampling noise for either rate — a
  // `check()` here would pass or fail depending on which set's fixed seed
  // happened to land, which is a property of the sample, not of PACK_ODDS.
  // Printed so the real numbers stay visible without a flaky gate pretending
  // to measure something a margin this thin cannot reliably show.
  console.log(`    ${set}: bonus Rare-tier card ${(st.bonusRare / SWEEP * 100).toFixed(2)}% ` +
    `vs Reverse Holo ${(st.rh / SWEEP * 100).toFixed(2)}%`);
}

head('...and on the fresh-RNG-per-pack path the game uses');

// A NEW generator per pack, which is the property under test — but seeded
// deterministically, so this cannot flake the way a Math.random() run would.
//
// The seeds come from a shared generator rather than from an arithmetic
// stride, and that is not cosmetic. The first version used `i * 2654435761`,
// which read 1-in-9.1 for Reverse Holo at the fast-pass sizes and 1-in-9.9 at
// the full one: a structured seed sequence gives structured first outputs, so
// it went red identically on every run at 20,000 and green at 200,000.
// Deterministic, reproducible, and a finding about the fixture rather than
// about the game — the worst kind, because it reads as a result. Drawing the
// seeds from a generator is also what the game actually does, since
// Math.random() is not an arithmetic sequence either.
const seeder = mulberry32(20260824);
const liveRng = { fe: 0, rh: 0, sh: 0, sl: 0 };
for (let i = 0; i < SWEEP; i++) {
  const pk = P.openPack(CARD_DB, 'base1', mulberry32((seeder() * 2147483647) | 0));
  if (pk.firstEd) liveRng.fe++;
  for (const c of pk.cards) {
    if (c.flags.indexOf('rh') >= 0) liveRng.rh++;
    if (c.flags.indexOf('sh') >= 0) liveRng.sh++;
    if (c.flags.indexOf('sl') >= 0) liveRng.sl++;
  }
}
near(SWEEP / liveRng.fe, 20, 8, 'fresh stream per pack: 1st Edition');
near(SWEEP / liveRng.rh, RH_TARGET, 8, 'fresh stream per pack: Reverse Holo');
near(SWEEP / liveRng.sh, SHINY_TARGET, 15, 'fresh stream per pack: Shiny');
near(SWEEP / liveRng.sl, SL_TARGET, 30, 'fresh stream per pack: Shadowless');

// ===========================================================================
head('Intrusion, with a promo pool supplied');

// No promos exist at Base Set, so a fake pool proves the mechanism instead of
// waiting for Job 8. Odds are raised so the run does not need to be enormous.
//
// THE SIZE ASSERTION INVERTED ON 27 AUG 2026 and it is worth knowing why the old
// one is gone rather than wrong. Until Job 13b an intrusion REPLACED a Common, so
// this line read "an intruded pack is still PACK_SIZE cards with one promo" and
// was the correct guard for the rule of the day. Trevor reversed the rule — the
// promo is now an EXTRA card — so the guard now checks the opposite, and the
// interesting part is that it went red by itself the moment packs.js changed.
// That is what a structural assertion is for. See PACKS.md.
const fakePromos = ['base1-4', 'base1-58'];
let intruded = 0, intrudedRare = 0, intrudedShort = 0, intrudedDouble = 0, cleanSize = 0;
const ir = mulberry32(99);
for (let i = 0; i < 20000; i++) {
  const pk = P.openPack(CARD_DB, 'base1', ir, { pools, promos: fakePromos, odds: { intrusion: 0.5 } });
  if (!pk.intrusion) { if (pk.cards.length !== P.PACK_SIZE) cleanSize++; continue; }
  intruded++;
  if (pk.cards.length !== P.PACK_SIZE + 1) intrudedShort++;
  if (pk.cards[0].slot === 'promo') intrudedRare++;
  if (pk.cards.filter(c => c.slot === 'promo').length !== 1) intrudedDouble++;
}
check(intruded > 9000 && intruded < 11000, 'intrusion fires at the rate it is given', `${intruded}/20000`);
eq(intrudedRare, 0, 'an intrusion never displaces the Rare slot');
eq(intrudedShort, 0, `an intruded pack is ${P.PACK_SIZE + 1} cards — the promo is ADDED, not swapped in`);
eq(intrudedDouble, 0, 'and exactly one of them is the promo');
eq(cleanSize, 0, `while a pack that did NOT intrude is still exactly ${P.PACK_SIZE}`);

// The point of the change, stated as a measurement rather than as prose: the
// eight set cards you were always going to get are still there. Under the old
// rule one of them was gone.
let commonsWhenIntruded = 0, intrudedRuns = 0;
const ir2 = mulberry32(1234);
for (let i = 0; i < 4000; i++) {
  const pk = P.openPack(CARD_DB, 'base1', ir2, { pools, promos: fakePromos, odds: { intrusion: 1 } });
  intrudedRuns++;
  commonsWhenIntruded += pk.cards.filter(c => c.slot !== 'promo').length;
}
eq(commonsWhenIntruded / intrudedRuns, P.PACK_SIZE,
  'and the set cards are untouched — an intrusion costs the player nothing');

// ===========================================================================
head('A pack feeds the collection directly');

// The reason packs.js emits flag ARRAYS rather than canonical keys: grant()
// canonicalises, so the two modules need no knowledge of each other.
const save = C.newSave({ now: 1 });
const pk = P.openPack(CARD_DB, 'base1', mulberry32(3));
for (const c of pk.cards) C.grant(save, c.id, c.flags);
let owned = 0;
for (const id in save.owned) owned += C.ownedTotal(save, id);
eq(owned, P.PACK_SIZE, `all ${P.PACK_SIZE} cards land in the collection`);
check(C.collectionStats(save, CARD_DB).cards.owned <= P.PACK_SIZE, 'and the dex counts them as distinct cards');

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

// Scoped to the set whose packs it opens. It used to build `need` from the
// whole of CARD_DB, which was correct while Base Set was the only set and
// became a six-minute hang the moment Jungle generated: it chased 126 cards no
// base1 pack can contain, hit the 200,000 cap on all five measurements, forty
// times over, and reported the cap as the answer.
function packsToComplete(seed, predicate, setCode = SET) {
  const r = mulberry32(seed);
  const need = {};
  let missing = 0;
  for (const id in CARD_DB) {
    if (CARD_DB[id].set !== setCode) continue;
    if (predicate(CARD_DB[id])) { need[id] = 1; missing++; }
  }
  let opened = 0;
  while (missing > 0 && opened < 200000) {
    opened++;
    for (const c of P.openPack(CARD_DB, setCode, r, { pools }).cards) {
      if (need[c.id]) { delete need[c.id]; missing--; }
    }
  }
  return opened;
}

const TRIALS = 40;
const median = xs => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const ALL_LABEL = `ALL ${Object.keys(CARD_DB).filter(id => CARD_DB[id].set === SET).length}`;
const runs = {
  'Commons + Energy': [], 'Uncommons': [], 'Rares (non-holo)': [], 'Rare Holos': [], [ALL_LABEL]: [],
};
for (let t = 0; t < TRIALS; t++) {
  runs['Commons + Energy'].push(packsToComplete(500 + t, c => c.rarity === 'Common' || (c.kind === 'energy' && c.cls === 'Basic')));
  runs['Uncommons'].push(packsToComplete(600 + t, c => c.rarity === 'Uncommon'));
  runs['Rares (non-holo)'].push(packsToComplete(700 + t, c => c.rarity === 'Rare'));
  runs['Rare Holos'].push(packsToComplete(800 + t, c => c.rarity === 'Rare Holo'));
  runs[ALL_LABEL].push(packsToComplete(900 + t, () => true));
}
for (const k in runs) {
  const xs = runs[k];
  const med = median(xs);
  console.log(`  ${k.padEnd(18)} median ${String(med).padStart(4)} packs  ` +
    `(${Math.min(...xs)}-${Math.max(...xs)})   ~${Math.round(med / 2)} wins at 2 packs/win`);
}
console.log('  Nothing here is asserted — it is the pacing measurement Job 5 should design against.');

// ===========================================================================
// BORROWED ENERGY, and the cap (16 Aug 2026 — this replaced the stipend).
//
// Jungle and Fossil print no basic Energy. Job 6a delivered their guarantee
// BESIDE the pack, which made a Jungle booster thirteen cards with two of them
// mandatory; Trevor's note from play is that this reads as being handed filler
// instead of cards. base1's Energy is in every set's Common pool now, under its
// own base1 ids, drawn like anything else and capped at two.
//
// Against a synthetic database rather than the real one, deliberately: this
// mechanism has to be testable independently of which sets happen to have
// generated, which is why the original was written this way too.
// ===========================================================================
head('Borrowed Energy and the cap');
{
  const mk = (set, num, rarity, extra = {}) => Object.assign(
    { id: `${set}-${num}`, set, num: String(num), name: `${set} ${num}`, rarity, kind: 'pokemon' }, extra);
  const DB = {};
  const fill = (set, energy) => {
    for (let i = 1; i <= 4; i++) DB[`${set}-${i}`] = mk(set, i, 'Rare Holo');
    for (let i = 5; i <= 8; i++) DB[`${set}-${i}`] = mk(set, i, 'Rare');
    for (let i = 9; i <= 16; i++) DB[`${set}-${i}`] = mk(set, i, 'Uncommon');
    for (let i = 17; i <= 30; i++) DB[`${set}-${i}`] = mk(set, i, 'Common');
    if (energy) for (let i = 31; i <= 36; i++)
      DB[`${set}-${i}`] = mk(set, i, '', { kind: 'energy', cls: 'Basic', provides: 'R' });
  };
  fill('base1', true);
  fill('base2', false);
  const isEnergy = id => DB[id].kind === 'energy';

  eq(P.energySource(DB), 'base1', 'the borrow source is the set that actually prints Energy');
  const b2 = P.buildPools(DB, 'base2');
  eq(b2.energy.length, 6, "base2 prints none, so it carries base1's six");
  check(b2.energy.every(id => DB[id].set === 'base1'), 'and they keep their base1 ids');
  check(b2.commonNoEnergy.every(id => !isEnergy(id)), 'the no-Energy Common pool has none in it');
  // A borrowing set inherits the SOURCE's share, not the share its own array
  // length happens to produce — six Energy among 14 Commons would otherwise be
  // 30% of Jungle's slots against base1's 6-of-38.
  const b1 = P.buildPools(DB, 'base1');
  eq(b2.energyShare, b1.energyShare, 'a borrowing set draws Energy at the source set\'s rate');
  // Shown against the REAL database, because the synthetic sets are the same
  // size as each other and so cannot demonstrate the thing being prevented.
  // Jungle has 16 Commons against Base Set's 32, which is where the gap lives.
  const jungle = P.buildPools(CARD_DB, 'base2');
  if (jungle.energy.length) {
    const naive = jungle.energy.length / jungle.common.length;
    check(jungle.energyShare < naive - 0.05,
      'and in the real pools that is well under what array length would have given',
      `${(jungle.energyShare * 100).toFixed(1)}% vs ${(naive * 100).toFixed(1)}%`);
  }

  let wrongSize = 0, over = 0, baseShort = 0, strayNonEnergy = 0, everEnergy = 0;
  for (let i = 0; i < 3000; i++) {
    const a = P.openPack(DB, 'base1', mulberry32(i + 1));
    const b = P.openPack(DB, 'base2', mulberry32(i + 1));
    if (a.cards.length !== P.PACK_SIZE || b.cards.length !== P.PACK_SIZE) wrongSize++;
    if (a.cards.filter(c => isEnergy(c.id)).length < P.ENERGY_FLOOR.base1) baseShort++;
    for (const pk of [a, b]) if (pk.cards.filter(c => isEnergy(c.id)).length > P.ENERGY_CAP) over++;
    // The ONLY base1 card allowed into a base2 pack is basic Energy.
    if (b.cards.some(c => DB[c.id].set !== 'base2' && !isEnergy(c.id))) strayNonEnergy++;
    if (b.cards.some(c => isEnergy(c.id))) everEnergy++;
  }
  eq(wrongSize, 0, 'every pack is exactly PACK_SIZE — there is no twelfth card any more');
  eq(baseShort, 0, 'a floored set still meets its floor');
  eq(over, 0, 'and nothing, floored or not, exceeds the cap');
  eq(strayNonEnergy, 0, 'the only Base Set card that reaches a Jungle-shaped pack is Energy');
  check(everEnergy > 0 && everEnergy < 3000,
    'an unfloored set gets Energy sometimes and not always — pool rate, not a quota',
    `${(everEnergy / 30).toFixed(0)}% of packs`);

  const one2 = P.openPack(DB, 'base2', mulberry32(7));
  check(!('stipend' in one2), 'openPack no longer returns a stipend at all');
  check(one2.cards.filter(c => isEnergy(c.id)).every(c => c.slot === 'common'),
    'borrowed Energy occupies an ordinary Common slot');

  // A set nobody floored still gets pool Energy — scarcity is the cap and the
  // pool rate now, not a missing entry in a table.
  fill('neo2', false);
  eq(P.ENERGY_FLOOR.neo2, undefined, 'Neo Discovery has no floor');
  const late = P.openPack(DB, 'neo2', mulberry32(3), { energyCap: 0 });
  eq(late.cards.filter(c => isEnergy(c.id)).length, 0, 'and a cap of 0 shuts Energy out entirely');
}


// ---------------------------------------------------------------------------
head('The Challenge pack — a pack TYPE, not a set');
{
  // Job 15a. A Challenge bracket belongs to no set, so its pack draws from a
  // UNION handed in by the caller. Everything here is about the union behaving
  // like a pool rather than like a set, and about the key not accidentally
  // becoming one.
  const SETS = ['base1', 'base2', 'base3'];
  const pools = P.buildPools(CARD_DB, SETS);
  const b1 = P.buildPools(CARD_DB, 'base1');

  check(pools !== b1, 'an array of one-plus sets is memoised separately from a bare set code');
  eq(P.buildPools(CARD_DB, SETS), pools, '...and the union itself is memoised');
  eq(P.buildPools(CARD_DB, ['base3', 'base1', 'base2']), pools,
    '...by CONTENT, so argument order cannot produce two pools of the same thing');

  const all = pools.rareHolo.concat(pools.rare, pools.uncommon, pools.common);
  check(all.every(id => SETS.indexOf(CARD_DB[id].set) >= 0),
    'the union holds nothing from outside the sets it was given');
  check(!all.some(id => CARD_DB[id].set === 'base5'),
    '...and specifically nothing from a set past the bracket');
  check(!all.some(id => P.NON_BOOSTER_SETS[CARD_DB[id].set]),
    'and no promo leaks in through the pool — an intrusion is the only way one arrives');
  check(pools.rareHolo.length > b1.rareHolo.length && pools.rare.length > b1.rare.length,
    'it is genuinely bigger than any one set in it',
    `${pools.rareHolo.length} holo / ${pools.rare.length} rare vs base1's ${b1.rareHolo.length} / ${b1.rare.length}`);

  // ENERGY. The union contains base1, so nothing is borrowed and the share is
  // the union's own — six Energy diluted across three sets' Commons rather than
  // one set's. Lower than Base Set's on purpose: a Challenge pack is a reward,
  // not the deck-building faucet the base1 floor exists to be.
  eq(P.ENERGY_FLOOR.challenge1, undefined, 'a Challenge pack has no Energy floor');
  check(pools.energyShare > 0 && pools.energyShare < b1.energyShare,
    'and draws Energy at the union rate, below Base Set’s own',
    `${(pools.energyShare * 100).toFixed(1)}% vs ${(b1.energyShare * 100).toFixed(1)}%`);

  // The pack itself, opened the way ui.js opens one.
  let wrongSize = 0, outside = 0, energyOver = 0, kinds = {};
  const n = Math.min(N, 40000);
  for (let i = 0; i < n; i++) {
    const pk = P.openPack(CARD_DB, 'challenge1', mulberry32(9000 + i), { pools });
    if (pk.cards.length !== P.PACK_SIZE + (pk.intrusion ? 1 : 0)) wrongSize++;
    for (const c of pk.cards) {
      if (c.slot === 'promo') continue;
      if (SETS.indexOf(CARD_DB[c.id].set) < 0) outside++;
      kinds[c.slot] = (kinds[c.slot] || 0) + 1;
    }
    // BASIC Energy, which is what ENERGY_CAP means. Written as `kind ===
    // 'energy'` first and it went red at 59 in 40,000 — every one of them a
    // Double Colorless, which is an Uncommon that happens to be an Energy card
    // and has never been under the cap. packs.js says so in the pools comment;
    // the test was measuring a superset of the thing the cap is about.
    if (pk.cards.filter(c => CARD_DB[c.id].kind === 'energy' && CARD_DB[c.id].cls === 'Basic')
        .length > P.ENERGY_CAP) energyOver++;
  }
  eq(wrongSize, 0, 'a Challenge pack is the same shape as any other');
  eq(outside, 0, 'and every card in it comes from a set the bracket actually covers');
  eq(energyOver, 0, 'the Energy cap still holds without a floor to meet');
  check(kinds.rare > 0 && kinds.uncommon > 0 && kinds.common > 0,
    'all three tiers fill from the union', JSON.stringify(kinds));

  // THE ODDS HOOK, filled in by Job 15b at 4x the standard jump — Trevor's
  // proposal, and the only lever the Challenge pack pulls. Asserted as a
  // MULTIPLE of the base table rather than as three literals, so a later retune
  // of the base odds carries the Challenge pack with it instead of silently
  // leaving it at whatever 4x used to mean.
  check(!!P.PACK_ODDS_BY_KIND.challenge1, 'the per-kind odds table carries a challenge1 row');
  {
    const c = P.PACK_ODDS_BY_KIND.challenge1;
    const ratio = k => c[k] / P.PACK_ODDS[k];
    for (const k of ['jumpUncommonToRare', 'jumpCommonToUncommon', 'jumpCommonToRare']) {
      const r = ratio(k);
      check(Math.abs(r - 4) < 0.05, `challenge1 ${k} is 4x the standard rate`, `${r.toFixed(2)}x`);
    }
    // THE POINT OF IT, measured rather than computed: a Challenge pack really
    // does hand out more Rare-tier cards. Both halves matter — the rate has to
    // move, and the pack must still be a normal pack.
    let cRare = 0, cBonus = 0, nRare = 0, nBonus = 0;
    const M = Math.min(N, 40000);
    for (let i = 0; i < M; i++) {
      const a = P.openPack(CARD_DB, 'challenge1', mulberry32(50000 + i), { pools });
      const b = P.openPack(CARD_DB, 'base3', mulberry32(50000 + i));
      const ra = a.cards.filter(x => x.slot === 'rare').length;
      const rb = b.cards.filter(x => x.slot === 'rare').length;
      cRare += ra; nRare += rb;
      if (ra > 1) cBonus++;
      if (rb > 1) nBonus++;
    }
    check(cBonus / M > 0.20 && cBonus / M < 0.32,
      'a Challenge pack carries a bonus Rare-tier card in roughly a quarter of packs',
      `${(cBonus / M * 100).toFixed(1)}% vs an ordinary pack's ${(nBonus / M * 100).toFixed(1)}%`);
    check(cRare / M > nRare / M * 1.15,
      '...and averages meaningfully more Rare-tier cards than an ordinary one',
      `${(cRare / M).toFixed(3)} vs ${(nRare / M).toFixed(3)} per pack`);
    // The spillover PACKS.md warned about, asserted as ABSENT. Cranking the jump
    // cannot make a Challenge pack the best place to pull a Shadowless, because
    // the cosmetic axes roll per slot regardless of tier — and Reverse Holo goes
    // very slightly DOWN, since a jumped card is Rare-tier and therefore
    // ineligible. If somebody swaps the lever for a holo bump, this goes red.
    let cSl = 0, nSl = 0, cRh = 0, nRh = 0;
    for (let i = 0; i < M; i++) {
      const a = P.openPack(CARD_DB, 'challenge1', mulberry32(70000 + i), { pools });
      const b = P.openPack(CARD_DB, 'base3', mulberry32(70000 + i));
      if (a.cards.some(x => x.flags.includes('sl'))) cSl++;
      if (b.cards.some(x => x.flags.includes('sl'))) nSl++;
      if (a.cards.some(x => x.flags.includes('rh'))) cRh++;
      if (b.cards.some(x => x.flags.includes('rh'))) nRh++;
    }
    check(Math.abs(cSl - nSl) <= Math.max(20, nSl * 0.25),
      'richer jump odds do NOT make a Challenge pack a better place to pull a Shadowless',
      `${cSl} vs ${nSl} in ${M}`);
    check(cRh <= nRh * 1.02,
      '...and Reverse Holo goes down rather than up, since a jumped card is Rare-tier',
      `${cRh} vs ${nRh} in ${M}`);
  }
  {
    // ...and that a row, once filled, actually reaches openPack. Proved against a
    // temporary override rather than trusting the Object.assign by eye: an odds
    // table that is merged in the wrong order is exactly the silent failure this
    // whole file exists for.
    const saved = P.PACK_ODDS_BY_KIND.challenge1;
    P.PACK_ODDS_BY_KIND.challenge1 = { holo: 1 };
    const forced = P.openPack(CARD_DB, 'challenge1', mulberry32(11), { pools });
    P.PACK_ODDS_BY_KIND.challenge1 = saved;
    check(forced.cards[0].holo === true, 'a per-kind odds row does reach the pack when it is filled');
    const normal = P.openPack(CARD_DB, 'base1', mulberry32(11));
    check(P.PACK_ODDS_BY_KIND.base1 === undefined && normal.set === 'base1',
      '...and a set with no row is untouched by the mechanism');
  }
}

// ===========================================================================
console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail ? 1 : 0);

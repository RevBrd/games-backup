// ============================================================================
// BOOSTER PACKS — the rarity table from PACKS.md, as logic.
//
// Job 5b. Pure and dependency-free: takes a card database and a random
// function, returns what a pack contained. No DOM, no engine, no collection —
// which is what lets tools/packtest.js open a few hundred thousand of them and
// check the odds actually land where PACKS.md claims before anyone tunes a
// number by feel.
//
// Variants come out as FLAG ARRAYS, not canonical keys: collection.js's
// grant(save, id, flags) canonicalises on the way in, so this module never has
// to know how a key is spelled. It also means packs.js has no dependencies.
//
// EVERY NUMBER IN PACK_ODDS IS A PLACEHOLDER. PACKS.md is explicit that the
// table is a pacing schedule rather than tuned values. It lives in one object
// for exactly that reason.
// ============================================================================

// 1 Rare + 3 Uncommon + 7 Common-tier = 11, constant across the whole game.
const PACK_SHAPE = { rare: 1, uncommon: 3, common: 7 };
const PACK_SIZE = PACK_SHAPE.rare + PACK_SHAPE.uncommon + PACK_SHAPE.common;

const PACK_ODDS = {
  // Flat 2:1 non-holo:holo on the Rare slot for every set. Deliberately not
  // each set's real pool ratio, which drifts 45-55% and isn't worth chasing.
  holo: 1 / 3,

  // Whole-pack rolls.
  firstEd: 1 / 20,
  intrusion: 1 / 100,      // a promo or Southern Islands card replaces one Common

  // Per-card rolls. reverseHolo is offered only on the 10 Common/Uncommon
  // slots — the Rare slot already has its own holo axis. The other three roll
  // against all 11.
  reverseHolo: 1 / 100,
  shiny: 1 / 440,
  shadowless: 1 / 2200,
  misprint: 1 / 11000,
};

// PACKS.md wants 2-3 glitch flavours so a Misprint sighting reads as a fresh
// joke rather than "oh, the misprint effect again". They are separate variant
// keys, so two differently-broken cards are different collectibles.
const MISPRINT_FLAVOURS = ['mp1', 'mp2', 'mp3'];

// How much basic Energy a pack of this set is guaranteed to DELIVER. Early game
// the player is starved for Energy building a first deck and this reproduces
// that pressure on purpose; from Team Rocket on there is no guarantee, so Energy
// goes scarce exactly when a stocked player stops needing it.
//
// Settled in Job 6a. Jungle and Fossil print no basic Energy AT ALL, so the
// original floor had nothing to draw from in two of the three sets it was
// written for. One number, two delivery mechanisms:
//
//   set prints Energy  -> a FLOOR inside the 7 Common-tier slots (base1)
//   set prints none    -> a STIPEND alongside the pack (base2, base3)
//
// The stipend is deliberately NOT inside the pack. A Jungle booster is eleven
// Jungle cards; smuggling Base Set cards into it would undercut the set identity
// that the reveal exists to show, and quietly make the pack a 9-card pack. The
// reason it exists at all is a pacing one rather than a supply one — reservation
// returns Energy when a deck is un-built, so nobody can be permanently stuck —
// it is that opening the exciting new set should not tax the boring necessary
// grind. See PACKS.md.
const ENERGY_GRANT = { base1: 2, base2: 2, base3: 2 };

// Where a stipend's Energy comes from. Only consulted for sets printing none,
// and resolved from the database rather than hardcoded, so a build generated
// without base1 still works instead of silently granting nothing.
function stipendSource(db) {
  let best = null;
  for (const id in db) {
    const c = db[id];
    if (c.kind !== 'energy' || c.cls !== 'Basic') continue;
    if (best === null || c.set < best) best = c.set;
  }
  return best;
}

// Not boosters. Southern Islands was a fixed boxed set and promos came from
// magazines, tins and events, so neither belongs in a normal pack's pools —
// they are only reachable through the intrusion roll.
const NON_BOOSTER_SETS = { basep: 1, si1: 1 };

// The Rare slot's foil half. Rare Shining and Rare Secret are real printed
// rarities that sit in the Rare slot, and both are foil treatments, so they
// pool with Rare Holo.
//
// FLAG FOR JOB 8: this makes an RS as likely as any other holo Rare. Neo
// Destiny prints 8 RS against ~40 holos, which would land them at ~20% of
// holo pulls — nothing like their real scarcity. PACKS.md says RS needs no RNG
// layer of its own, and at Base Set that is true because there are none. It
// stops being true the moment neo3/neo4 load.
const HOLO_RARITIES = { 'Rare Holo': 1, 'Rare Shining': 1, 'Rare Secret': 1 };

// --------------------------------------------------------------- pools -----
// Partition a set into the buckets a pack draws from.
//
// Basic Energy carries a blank `rarity` in the corpus (see PACKS.md Part 1 —
// it is a quirk of the data, not evidence of an unnumbered pool). It is a
// Common-tier card, so it goes in `common` AND is tracked separately in
// `energy` for the floor. Double Colorless is Uncommon and is not Energy for
// the floor's purposes — the floor is about basic Energy for a first deck.
//
// Memoised per (database, set). openPack() calls this once per pack, and the
// scan is O(whole database) — invisible when a player opens one, and the
// dominant cost when packtest.js opens 200,000. It was already 3x worse the
// moment Jungle and Fossil generated, and would be 12x worse at fourteen sets.
//
// Safe because pools are READ-ONLY downstream (pickFrom and drawSlots only
// read) and a card database is built once and not mutated. If you ever do
// mutate one, build it fully before opening a pack against it.
const POOL_CACHE = new WeakMap();

function buildPools(db, setCode) {
  let perSet = POOL_CACHE.get(db);
  if (!perSet) { perSet = {}; POOL_CACHE.set(db, perSet); }
  const key = setCode || '*';
  if (perSet[key]) return perSet[key];

  const pools = { rareHolo: [], rare: [], uncommon: [], common: [], energy: [] };
  for (const id in db) {
    const c = db[id];
    if (setCode && c.set !== setCode) continue;
    if (NON_BOOSTER_SETS[c.set]) continue;
    const isBasicEnergy = c.kind === 'energy' && c.cls === 'Basic';
    if (isBasicEnergy) { pools.energy.push(id); pools.common.push(id); continue; }
    if (HOLO_RARITIES[c.rarity]) pools.rareHolo.push(id);
    else if (c.rarity === 'Rare') pools.rare.push(id);
    else if (c.rarity === 'Uncommon') pools.uncommon.push(id);
    else if (c.rarity === 'Common') pools.common.push(id);
    // Anything else (Promo, or a rarity we have not met) is deliberately
    // dropped rather than guessed into a bucket.
  }
  for (const k in pools) pools[k].sort();     // deterministic given a seed
  perSet[key] = pools;
  return pools;
}

// The pool a promo intrusion may draw from. Progression-gated in principle —
// PACKS.md is clear that a promo from an era the player hasn't reached would
// read as broken rather than delightful — but Job 7 doesn't exist, so the
// caller passes the eligible pool and the default is none.
function promoPool(db, allowedSets) {
  const out = [];
  for (const id in db) {
    const c = db[id];
    if (!NON_BOOSTER_SETS[c.set]) continue;
    if (allowedSets && allowedSets.indexOf(c.set) < 0) continue;
    out.push(id);
  }
  return out.sort();
}

// ---------------------------------------------------------------- draws ----
const pickFrom = (arr, rand) => arr[Math.floor(rand() * arr.length)];

// Draw n cards, refusing a repeat WITHIN THIS PACK unless the card is basic
// Energy.
//
// Two different rules on purpose. Three identical Rattata in one pack is
// annoying and reads as a bug; two of the same Energy is normal and is exactly
// what you want when you are building a deck around one type. Real packs could
// repeat a Common, so this is a feel decision over a fidelity one — noted here
// because it is the kind of thing a later session would otherwise "fix".
//
// The retry is bounded: a pool smaller than the slot count would otherwise
// spin forever, so it gives up and allows the duplicate rather than hanging.
function drawSlots(pool, n, rand, isEnergy, taken) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let id = null;
    for (let tries = 0; tries < 40; tries++) {
      const cand = pickFrom(pool, rand);
      if (isEnergy[cand] || !taken[cand]) { id = cand; break; }
    }
    if (id === null) id = pickFrom(pool, rand);
    if (!isEnergy[id]) taken[id] = 1;
    out.push(id);
  }
  return out;
}

// Per-card cosmetic rolls. `slot` decides whether Reverse Holo is on the table.
function rollVariants(rand, slot, odds, firstEd) {
  const flags = [];
  if (firstEd) flags.push('fe');
  if (slot !== 'rare' && rand() < odds.reverseHolo) flags.push('rh');
  if (rand() < odds.shiny) flags.push('sh');
  if (rand() < odds.shadowless) flags.push('sl');
  if (rand() < odds.misprint) flags.push(MISPRINT_FLAVOURS[Math.floor(rand() * MISPRINT_FLAVOURS.length)]);
  return flags;
}

// --------------------------------------------------------------- a pack ----
// Returns:
//   {
//     set, firstEd, intrusion,
//     cards: [ { id, slot, flags, holo }, ... ]   // 11 of them, Rare first
//   }
//
// `slot` is 'rare' | 'uncommon' | 'common' | 'promo'. `holo` is only meaningful
// on the Rare slot and records which side of the 2:1 the roll landed.
function openPack(db, setCode, rand, opts = {}) {
  const odds = Object.assign({}, PACK_ODDS, opts.odds);
  const pools = opts.pools || buildPools(db, setCode);
  const promos = opts.promos || [];

  if (!pools.common.length || !pools.uncommon.length ||
      (!pools.rare.length && !pools.rareHolo.length)) {
    throw new Error(`set "${setCode}" cannot fill a pack — pools are empty`);
  }

  const firstEd = rand() < odds.firstEd;
  const wantIntrusion = promos.length > 0 && rand() < odds.intrusion;

  const isEnergy = {};
  pools.energy.forEach(id => { isEnergy[id] = 1; });
  const taken = {};
  const cards = [];

  // --- the Rare slot. Roll holo-vs-not FIRST, then pick within that tier.
  // If a set has only one side (nothing does today, but Job 8 might), fall
  // back rather than throwing.
  let holo = rand() < odds.holo;
  if (holo && !pools.rareHolo.length) holo = false;
  if (!holo && !pools.rare.length) holo = true;
  const rareId = pickFrom(holo ? pools.rareHolo : pools.rare, rand);
  taken[rareId] = 1;
  cards.push({ id: rareId, slot: 'rare', holo, flags: rollVariants(rand, 'rare', odds, firstEd) });

  // --- 3 Uncommon
  for (const id of drawSlots(pools.uncommon, PACK_SHAPE.uncommon, rand, isEnergy, taken)) {
    cards.push({ id, slot: 'uncommon', holo: false, flags: rollVariants(rand, 'uncommon', odds, firstEd) });
  }

  // --- 7 Common-tier, Energy floor first.
  // The floor slots draw from `energy`; the rest draw from `common`, which
  // CONTAINS energy — so Energy can still turn up above the floor at its
  // natural share, which is what "no floor" means for the later sets.
  const floor = Math.min(ENERGY_GRANT[setCode] || 0, pools.energy.length ? PACK_SHAPE.common : 0);
  const commonIds = [];
  if (floor > 0) commonIds.push(...drawSlots(pools.energy, floor, rand, isEnergy, taken));
  commonIds.push(...drawSlots(pools.common, PACK_SHAPE.common - floor, rand, isEnergy, taken));
  for (const id of commonIds) {
    cards.push({ id, slot: 'common', holo: false, flags: rollVariants(rand, 'common', odds, firstEd) });
  }

  // --- intrusion replaces ONE Common, never the Rare. PACKS.md: the Rare slot
  // stays the pack's emotional centre, and an intrusion is a bonus surprise
  // rather than competition for the headline pull.
  let intrusion = null;
  if (wantIntrusion) {
    const at = cards.findIndex(c => c.slot === 'common');
    if (at >= 0) {
      intrusion = pickFrom(promos, rand);
      cards[at] = { id: intrusion, slot: 'promo', holo: false, flags: rollVariants(rand, 'promo', odds, firstEd) };
    }
  }

  // --- the stipend, for a set that prints no basic Energy of its own. Granted
  // BESIDE the pack, never inside it, so `cards` stays exactly PACK_SIZE and the
  // reveal can name it as what it is. It rolls variants like anything else: a
  // Shiny Energy falling out of a Jungle pack is the convergence PACKS.md calls
  // a feature, not an accident to be suppressed.
  const stipend = [];
  const owed = pools.energy.length ? 0 : (ENERGY_GRANT[setCode] || 0);
  if (owed > 0) {
    const src = stipendSource(db);
    const from = src ? buildPools(db, src).energy : [];
    for (let i = 0; i < owed && from.length; i++) {
      stipend.push({ id: pickFrom(from, rand), slot: 'stipend', holo: false,
                     flags: rollVariants(rand, 'common', odds, firstEd) });
    }
  }

  return { set: setCode, firstEd, intrusion, cards, stipend };
}

if (typeof module !== 'undefined') module.exports = { PACK_SHAPE, PACK_SIZE, PACK_ODDS, MISPRINT_FLAVOURS, ENERGY_GRANT, NON_BOOSTER_SETS, HOLO_RARITIES, buildPools, promoPool, stipendSource, openPack };

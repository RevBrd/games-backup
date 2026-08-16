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

// HOW MUCH BASIC ENERGY A PACK CAN CONTAIN, AND HOW LITTLE — 16 Aug 2026, and
// this replaced the stipend outright. Trevor, from play, in two notes:
//
//   "There are just way too many and it ends up feeling to the player like
//    they're being robbed of other cards when too many energies come in."
//
//   "...just including energies in the common pool for every set, and do that by
//    pretty much just throwing them right into each set but with their original
//    base1 card codes, and not tracking them as part of the number in the new
//    set."
//
// WHAT WENT. Jungle and Fossil print no basic Energy at all, so Job 6a handed
// their packs two Energy BESIDE the eleven cards. That made a Jungle booster a
// 13-card pack with two mandatory Energy in it, which is the thing being
// complained about. base1's Energy now sits in every set's Common pool instead,
// under its own base1 ids, so it is drawn rather than granted and it never
// counts toward the set it turns up in.
//
// TWO NUMBERS, AND THEY MEAN DIFFERENT THINGS.
//
//   ENERGY_FLOOR   a guarantee, per set. Only base1 has one, and it is the same
//                  early-game pacing the floor always was: the first packs a
//                  player opens have to be able to build a deck. A set that is
//                  not listed gets Energy at the pool's own natural rate, which
//                  is what "include them in the common pool" means.
//   ENERGY_CAP     a ceiling, everywhere, and the actual fix. base1's remaining
//                  five Common slots drew from a pool CONTAINING Energy, so a
//                  Base Set pack could and did run well past two.
//
// Set the floor to 0 to make base1 behave like every other set; that is the one
// line, and it is the only thing separating the two readings of the note above.
const ENERGY_FLOOR = { base1: 2 };
const ENERGY_CAP = 2;

// Which set's basic Energy stands in for a set that prints none. Resolved from
// the database rather than hardcoded, so a build generated without base1 still
// works instead of silently borrowing nothing.
function energySource(db) {
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

  const pools = { rareHolo: [], rare: [], uncommon: [], common: [], commonNoEnergy: [], energy: [] };
  for (const id in db) {
    const c = db[id];
    if (setCode && c.set !== setCode) continue;
    if (NON_BOOSTER_SETS[c.set]) continue;
    const isBasicEnergy = c.kind === 'energy' && c.cls === 'Basic';
    if (isBasicEnergy) { pools.energy.push(id); pools.common.push(id); continue; }
    if (HOLO_RARITIES[c.rarity]) pools.rareHolo.push(id);
    else if (c.rarity === 'Rare') pools.rare.push(id);
    else if (c.rarity === 'Uncommon') pools.uncommon.push(id);
    else if (c.rarity === 'Common') { pools.common.push(id); pools.commonNoEnergy.push(id); }
    // Anything else (Promo, or a rarity we have not met) is deliberately
    // dropped rather than guessed into a bucket.
  }

  // HOW OFTEN A COMMON SLOT IS ENERGY, as a share rather than as a side effect
  // of how long an array is.
  //
  // Drawing uniformly from `common` looks like it means "at the set's natural
  // rate" and does not, the moment a set borrows: base1's six Energy are six of
  // its own 38 Commons (16%), but dropped into Jungle's 16 they become six of 22
  // (27%). Jungle would get more Energy than Base Set for no reason other than
  // having fewer Commons to dilute it. So a borrowing set inherits the SOURCE's
  // share, and the roll is explicit.
  //
  // For a set that prints its own this is exactly what uniform drawing already
  // did, so nothing about Base Set changes.
  pools.energyShare = pools.common.length ? pools.energy.length / pools.common.length : 0;

  // A set that prints no basic Energy of its own borrows base1's, ids and all.
  // This is what replaced the stipend: the Energy is IN the Common pool and is
  // drawn like anything else, rather than handed over beside an eleven-card pack
  // as a twelfth and thirteenth card. It keeps its base1 number, so it is never
  // part of the set it fell out of — Trevor's call, and the reason the dex and
  // the set-completion counters need no special case for it.
  if (setCode && !pools.energy.length) {
    const src = energySource(db);
    if (src && src !== setCode) {
      const from = buildPools(db, src);
      for (const id of from.energy) { pools.energy.push(id); pools.common.push(id); }
      pools.energyShare = from.energyShare;
    }
  }

  const share = pools.energyShare;
  for (const k in pools) if (Array.isArray(pools[k])) pools[k].sort();   // deterministic given a seed
  pools.energyShare = share;
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

  // --- 7 Common-tier: the floor first, then the rest against the cap.
  //
  // The floor slots draw from `energy`; the rest draw from `common`, which
  // CONTAINS Energy, so it can still turn up at its natural share — and that is
  // exactly what used to let a base1 pack run to five or six of them. The draw
  // is now one slot at a time so it can switch to `commonNoEnergy` the moment
  // the cap is reached. `taken` is threaded through, so no-repeats still holds.
  const cap = Math.max(0, opts.energyCap === undefined ? ENERGY_CAP : opts.energyCap);
  const floor = Math.min(ENERGY_FLOOR[setCode] || 0, cap, pools.energy.length ? PACK_SHAPE.common : 0);
  const commonIds = [];
  let energyCount = 0;
  if (floor > 0) {
    const got = drawSlots(pools.energy, floor, rand, isEnergy, taken);
    energyCount += got.length;
    commonIds.push(...got);
  }
  while (commonIds.length < PACK_SHAPE.common) {
    const roomLeft = energyCount < cap && pools.energy.length;
    const wantEnergy = roomLeft && rand() < pools.energyShare;
    const from = wantEnergy ? pools.energy
      : (pools.commonNoEnergy.length ? pools.commonNoEnergy : pools.common);
    const [id] = drawSlots(from, 1, rand, isEnergy, taken);
    if (isEnergy[id]) energyCount++;
    commonIds.push(id);
  }
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

  // The STIPEND is gone — 16 Aug 2026. It hung two extra Energy off the side of
  // a pack for any set printing none, which made a Jungle booster thirteen cards
  // with two of them mandatory. Borrowed Energy is in the Common pool now and is
  // drawn like anything else, so a pack is eleven cards again, always.
  return { set: setCode, firstEd, intrusion, cards };
}

if (typeof module !== 'undefined') module.exports = { PACK_SHAPE, PACK_SIZE, PACK_ODDS, MISPRINT_FLAVOURS, ENERGY_FLOOR, ENERGY_CAP, NON_BOOSTER_SETS, HOLO_RARITIES, buildPools, promoPool, energySource, openPack };

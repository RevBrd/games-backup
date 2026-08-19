// ============================================================================
// PRESSURE SURVEY — what a set can actually threaten you with.
//
//   node tools/pressure.js            every live set
//   node tools/pressure.js base3      one set, with the full card list
//
// OPPONENTS.md asks every roster to give a bracket VARIETY of pressure, not
// just a ramp of strength. Which pressures a set can field is a fact about the
// set — Base Set prints almost no bench damage and Fossil is made of it — so
// this answers it by reading the effect scripts rather than by anyone reading
// 102 cards. DERIVED, never hand-tagged: a hand-copied derivable fact drifts.
//
// A card counts once per category however many qualifying verbs it has. The
// figure is "how many cards could contribute", not a power rating.
//
// DECK-OUT IS DELIBERATELY ABSENT. It is not a card behaviour anywhere in this
// era — no card mills a deck. It is what a wall deck does to you by refusing to
// provide a clock, so it is a property of a DECK and cannot be derived here.
// ============================================================================
const { CARD_DB, SET_INFO } = require('../src/cards.js');
const { EFFECTS } = require('../src/effects.js');

const PRESSURES = {
  'energy denial':       ['DISCARD_DEF_ENERGY', 'MOVE_DEF_ENERGY_TO_BENCH', 'T_DISCARD_OPP_ENERGY'],
  'bench damage':        ['BENCH_SNIPE', 'BENCH_SPLASH', 'BENCH_SPLASH_DOUBLE_FLIP', 'BENCH_SPLASH_FLIP_SIDE',
                          'BENCH_SPLASH_PER_FLIP', 'BENCH_SPLASH_TYPED', 'SPLASH_NAMED', 'OPTIONAL_DISCARD_THEN_SNIPE'],
  'position control':    ['WHIRLWIND', 'WHIRLWIND_ON_FLIP', 'SWITCH_DEFENDER_CHOOSE', 'SWITCH_DEFENDER_FIRST',
                          'RETURN_DEFENDER_TO_HAND'],
  'status lock':         ['STATUS', 'STATUS_ON_FLIP', 'STATUS_COIN_EITHER', 'TOXIC', 'ATTACK_LOCK',
                          'ATTACK_DISABLED', 'CANT_ATTACK_ON_FLIP', 'CANT_RETREAT_ON_FLIP', 'JAM_DEFENDER'],
  'hand/trainer denial': ['NO_TRAINERS_NEXT_TURN', 'T_LASS', 'SHUFFLE_OPP_DECK'],
  'wall / prevention':   ['PREVENT_ALL_DAMAGE', 'PREVENT_AT_LEAST', 'PREVENT_UP_TO', 'DAMAGE_REDUCTION',
                          'DAMAGE_REDUCTION_FROM', 'DAMAGE_REDUCTION_SELF', 'DAMAGE_HALVE', 'BARRIER',
                          'BARRIER_ON_FLIP', 'HARDEN', 'FLIP_TO_NEGATE', 'MIRROR_SHELL', 'RETALIATE',
                          'PREVENT_ALL_EFFECTS', 'PREVENT_ALL_DMG_SELF_ON_FLIP'],
  'attrition / recovery':['ENERGY_FROM_DISCARD', 'TRAINER_FROM_DISCARD', 'T_ENERGY_RETRIEVAL', 'T_RECYCLE',
                          'T_POKEMON_FLUTE', 'HEAL_SELF_ALL', 'HEAL_SELF_EQUAL_DAMAGE', 'HEAL_SELF_IF_DAMAGED',
                          'HEAL_SELF_ON_FLIP', 'HEAL_ON_FLIP'],
};
const OF = {};
for (const p in PRESSURES) PRESSURES[p].forEach(v => { OF[v] = p; });

// Verbs sit at `v` on attack scripts and at `kind` on Powers, at any depth.
function verbsIn(entry) {
  const out = [];
  (function walk(x) {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) return x.forEach(walk);
    if (x.v) out.push(x.v);
    if (x.kind) out.push(x.kind);
    Object.values(x).forEach(walk);
  })(entry);
  return out;
}

const only = process.argv[2];
const bySet = {};
for (const id in EFFECTS) {
  const c = CARD_DB[id];
  if (!c) continue;
  const set = id.slice(0, id.lastIndexOf('-'));
  const found = new Set();
  for (const v of verbsIn(EFFECTS[id])) if (OF[v]) found.add(OF[v]);
  if (!found.size) continue;
  bySet[set] = bySet[set] || {};
  for (const p of found) (bySet[set][p] = bySet[set][p] || []).push(c.name);
}

const sets = only ? [only] : Object.keys(bySet).sort();
for (const s of sets) {
  if (!bySet[s]) { console.log(`\n${s}: no cards with effect scripts — not generated?`); continue; }
  const label = (SET_INFO && SET_INFO[s] && SET_INFO[s].name) || s;
  console.log(`\n=== ${label} (${s}) ===`);
  for (const p of Object.keys(PRESSURES)) {
    const list = bySet[s][p] || [];
    const bar = '#'.repeat(Math.min(20, list.length));
    console.log(`  ${p.padEnd(22)} ${String(list.length).padStart(3)} ${bar}`);
    if (only && list.length) console.log(`      ${[...new Set(list)].join(', ')}`);
  }
  const thin = Object.keys(PRESSURES).filter(p => (bySet[s][p] || []).length < 3);
  if (thin.length) console.log(`  THIN OR ABSENT: ${thin.join(', ')} — a bracket here cannot lean on these.`);
}

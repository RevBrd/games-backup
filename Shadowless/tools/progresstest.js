// ============================================================================
// PROGRESSION TESTS — the Job 7 ladder, headless.
//
//   node tools/progresstest.js
//
// src/progress.js is pure, so the whole ladder can be driven with no browser:
// build it, beat people, check what opens. What this suite CANNOT see is the
// opponent screen, which is Job 7b — same blind spot smoke.js has, for the same
// reason. See TOOLING.md.
//
// The cases that matter most here are the DERIVED ones. The ladder is built
// from the live-set list rather than declared, and unlock is recomputed from
// `beaten` rather than stored, so the interesting failures are "a set went live
// and no bracket appeared" and "the save says one thing and the screen another".
// Both are asserted directly.
// ============================================================================

const { CARD_DB, DECKS, SET_INFO, OPPONENT_DECKS, LADDER } = require('../src/cards.js');
const { Engine } = require('../src/engine.js');
const { EFFECTS } = require('../src/effects.js');
const { generateDeck } = require('../src/deckgen.js');
const { newSave, ensureShape, addPacks, packsHeld } = require('../src/collection.js');
const P = require('../src/progress.js');

let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}`); }
};
const eq = (a, b, name) => ok(a === b, `${name}${a === b ? '' : `  (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`}`);
const group = t => console.log(`\n${t}`);

const LIVE = Object.keys(SET_INFO);
const hasDeck = ref => ref.startsWith('theme:') ? !!DECKS[ref.slice(6)] : !!OPPONENT_DECKS[ref];
const build = (sets = LIVE, data = LADDER) => P.buildLadder(sets, data, { hasDeck });
const fresh = () => ensureShape(newSave());

// beat everyone in a bracket's roster up to `n`, so the boss gate can be reached
const clear = (save, bracket, n) => bracket.roster.slice(0, n).forEach(o => P.recordWin(save, build(), o.id));

// ---------------------------------------------------------------------------
group('the ladder is derived from the live sets');

const L = build();
eq(L.length, LIVE.length, 'one bracket per live set');
eq(L.map(b => b.set).join(','), LIVE.join(','), 'brackets follow the live-set order');
ok(L.every(b => !b.generated), 'all three live sets have an authored bracket');
eq(L[0].name, 'The Clubs', 'the first bracket is named from the data');

// The whole point of deriving: a set nobody authored still gets a bracket.
const withRocket = build(LIVE.concat(['base5']));
eq(withRocket.length, LIVE.length + 1, 'a newly live set adds a bracket with no data change');
const rocket = withRocket[withRocket.length - 1];
ok(rocket.generated, 'the unauthored bracket is flagged as generated');
eq(rocket.roster.length, P.PROGRESS_DEFAULTS.bossAfter, 'it is backfilled to exactly bossAfter opponents');
ok(rocket.roster.every(o => o.deck === 'generate'), 'all of its opponents are generated');
ok(rocket.boss && rocket.boss.isBoss, 'it gets a boss too');
ok(rocket.roster.every(o => o.placeholder), 'and every one is marked placeholder');

// ...and a bracket for a set that is NOT live must never appear.
const onlyBase = build(['base1']);
eq(onlyBase.length, 1, 'a bracket whose set is not live does not appear');

group('a bracket backfills around a missing deck instead of breaking');

// Simulates `gen_cards.js --sets base1`: the Jungle and Fossil decks are gone,
// so most of base1's authored roster cannot resolve.
const narrow = P.buildLadder(['base1'], LADDER, { hasDeck: ref => ref.startsWith('theme:') });
ok(narrow[0].roster.length >= P.PROGRESS_DEFAULTS.bossAfter, 'the roster is still long enough to reach the boss');
ok(narrow[0].roster.some(o => o.deck === 'generate'), 'the unresolvable entries became generated challengers');
ok(narrow[0].roster.filter(o => o.deck.startsWith('theme:')).length === 4, 'the four resolvable theme decks survived');
ok(narrow[0].boss.deck === 'generate', 'an unresolvable boss is replaced rather than left dangling');
eq(new Set(narrow[0].roster.map(o => o.id)).size, narrow[0].roster.length, 'backfilled ids do not collide with authored ones');

group('every authored deck reference resolves, and to a legal deck');

const E = new Engine(CARD_DB, EFFECTS, { seed: 1 });
const sources = { theme: DECKS, gbc: {}, jungle: {} };
for (const k of Object.keys(OPPONENT_DECKS)) {
  const cut = k.indexOf(':');
  sources[k.slice(0, cut)][k.slice(cut + 1)] = OPPONENT_DECKS[k];
}
let authored = 0, illegal = [];
for (const b of L) {
  for (const o of P.allOpponents(b)) {
    if (o.deck === 'generate') continue;
    authored++;
    const deck = P.resolveOpponentDeck(o, sources);
    if (!deck) { illegal.push(`${o.id}: unresolved`); continue; }
    const r = E.validateDeck(deck);
    if (!r.ok) illegal.push(`${o.id}: ${r.errors.join('; ')}`);
  }
}
eq(authored, 22, 'the three brackets name 22 authored opponents — 16 GBC, 4 theme, 2 Jungle');
ok(illegal.length === 0, `every authored opponent fields a legal 60-card deck${illegal.length ? '\n        ' + illegal.join('\n        ') : ''}`);

// All sixteen GBC decks are used, none stranded — DATA.md's roster is fully spent.
const usedGbc = new Set();
L.forEach(b => P.allOpponents(b).forEach(o => { if (o.deck.startsWith('gbc:')) usedGbc.add(o.deck.slice(4)); }));
eq(usedGbc.size, 16, 'all sixteen GBC decks are assigned to an opponent');

group('a generated opponent brings a legal deck, and the same one every time');

const genOpp = rocket.roster[0];
const poolFor = sets => Object.keys(CARD_DB).filter(id => sets.includes(CARD_DB[id].set));
const gen = (poolSets, seed) => {
  let s = seed >>> 0;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  return generateDeck(CARD_DB, poolFor(poolSets), rand, { name: 'gen' });
};
const d1 = P.resolveOpponentDeck(genOpp, sources, { generate: gen, poolSets: LIVE });
const d2 = P.resolveOpponentDeck(genOpp, sources, { generate: gen, poolSets: LIVE });
ok(d1 !== null, 'a generated opponent produces a deck');
ok(d1 && E.validateDeck(d1).ok, 'and it is legal');
eq(JSON.stringify(d1), JSON.stringify(d2), 'the same opponent brings the same deck twice — the seed is stable');
ok(P.opponentSeed('base3-gen1') !== P.opponentSeed('base3-gen2'), 'different opponents get different seeds');

// The pool widens as you climb, which is what makes a late generated challenger
// harder than an early one without anybody tuning a number.
eq(P.poolSetsFor(L, L[0]).join(','), 'base1', 'a first-bracket challenger draws from Base only');
eq(P.poolSetsFor(L, L[2]).join(','), 'base1,base2,base3', 'a third-bracket challenger draws from all three');

group('what is open, and when');

let s = fresh();
eq(P.unlockedSets(s, L).join(','), 'base1', 'a fresh save has only the first bracket');
ok(P.canFight(s, L, L[0].roster[0].id), 'its first opponent is fightable immediately');
ok(!P.canFight(s, L, L[1].roster[0].id), 'a second-bracket opponent is not');
ok(!P.canFight(s, L, L[0].boss.id), 'and neither is the first boss');
eq(P.availableOpponents(s, L).length, L[0].roster.length, 'exactly the first roster is available');

clear(s, L[0], 4);
eq(P.rosterCleared(s, L[0]), 4, 'four beaten is four');
ok(!P.bossAvailable(s, L[0]), 'four is not enough for the boss');

// Beating the SAME opponent again must not count twice — the gate is five
// distinct opponents, not five wins.
P.recordWin(s, L, L[0].roster[0].id);
eq(P.timesBeaten(s, L[0].roster[0].id), 2, 'a repeat win is recorded');
eq(P.rosterCleared(s, L[0]), 4, 'but it does not advance the boss gate');
ok(!P.bossAvailable(s, L[0]), 'still four distinct, still no boss');

P.recordWin(s, L, L[0].roster[4].id);
ok(P.bossAvailable(s, L[0]), 'a fifth DISTINCT opponent summons the boss');
ok(P.canFight(s, L, L[0].boss.id), 'and the boss becomes fightable');
ok(!P.canFight(s, L, L[1].roster[0].id), 'the next bracket is still shut until the boss falls');

group('beating a boss is the only thing that opens a bracket');

const r = P.winReward(s, L, L[0].boss.id);
eq(r.set, 'base1', 'the reward pays in the bracket\'s own set');
eq(r.packs, 3, 'a first boss win is 2 packs plus the 1-pack bonus');
ok(r.firstWin, 'and is flagged as a first win');
eq(r.unlocks, 'base2', 'and it unlocks the next set');

const before = P.unlockedSets(s, L).length;
P.recordWin(s, L, L[0].boss.id);
eq(P.unlockedSets(s, L).join(','), 'base1,base2', 'the second bracket is now open');
eq(P.unlockedSets(s, L).length, before + 1, 'exactly one bracket opened');
ok(P.canFight(s, L, L[1].roster[0].id), 'its opponents are fightable');
ok(P.canFight(s, L, L[0].roster[0].id), 'and the first bracket stays open forever');

const again = P.winReward(s, L, L[0].boss.id);
eq(again.packs, 2, 'beating the same boss again drops back to 2 packs');
eq(again.bonus, 0, 'no repeat bonus');
eq(again.unlocks, null, 'and unlocks nothing a second time');

const plain = P.winReward(s, L, L[1].roster[0].id);
eq(plain.packs, 2, 'a first win over a NON-boss pays no bonus');
eq(plain.set, 'base2', 'and pays in the second bracket\'s set');

group('the extra opponent waits for the boss');

const s2 = fresh();
const third = L[2];
ok(third.extra.length === 1, 'the third bracket has one post-boss challenger');
ok(!P.canFight(s2, L, third.extra[0].id), 'who is not fightable on a fresh save');
// open bracket 3 the long way: clear and beat both earlier bosses
[0, 1].forEach(i => { clear(s2, L[i], L[i].cfg.bossAfter); P.recordWin(s2, L, L[i].boss.id); });
ok(P.bracketOpen(s2, L, 2), 'the third bracket opens after two bosses');
ok(!P.canFight(s2, L, third.extra[0].id), 'the extra is still shut behind its own boss');
clear(s2, L[2], L[2].cfg.bossAfter);
P.recordWin(s2, L, third.boss.id);
ok(P.canFight(s2, L, third.extra[0].id), 'and opens once that boss falls');
eq(P.winReward(s2, L, third.extra[0].id).packs, 2, 'the extra pays a normal 2 packs');

group('the save, and what it does not store');

const s3 = fresh();
ok(s3.progress && s3.progress.beaten, 'a new save carries a progress map');
ok(!('unlocked' in s3.progress), 'and NO unlocked list — it is derived, not stored');

// A save written before Job 7 must load and simply have beaten nobody.
const old = newSave();
delete old.progress;
const shaped = ensureShape(old);
ok(shaped.progress && shaped.progress.beaten, 'a pre-Job-7 save gains the field on load');
eq(P.unlockedSets(shaped, L).join(','), 'base1', 'and starts at the first bracket');
eq(P.progressStats(shaped, L).beaten, 0, 'having beaten nobody');

// The reward is computed but NOT granted by progress.js — collection.js owns packs.
const s4 = fresh();
const rw = P.winReward(s4, L, L[0].roster[0].id);
eq(packsHeld(s4, 'base1'), 0, 'recording a win grants no packs by itself');
P.recordWin(s4, L, L[0].roster[0].id);
eq(packsHeld(s4, 'base1'), 0, 'still none — progress.js never touches the collection');
addPacks(s4, rw.set, rw.packs);
eq(packsHeld(s4, 'base1'), 2, 'the caller grants them, through the one function that creates packs');

group('reporting');

const st = P.progressStats(s, L);
eq(st.bossTotal, 3, 'three bosses across three brackets');
eq(st.bosses, 1, 'one of them beaten');
eq(st.total, L.reduce((a, b) => a + b.roster.length, 0), 'the roster total counts every bracket');
ok(P.findOpponent(L, 'gbc-ronald-1') !== null, 'an opponent can be looked up by id');
ok(P.findOpponent(L, 'nobody') === null, 'and an unknown id returns null rather than throwing');
eq(P.bracketOf(L, 'gbc-ronald-2').set, 'base2', 'and the bracket it belongs to is findable');

// ---------------------------------------------------------------------------
console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail ? 1 : 0);

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

// GENERATED IS NOT LIVE. This read `Object.keys(SET_INFO)` until 17 Aug 2026,
// which is every set the build generated — true only while no set was ever
// generated before it was finished. Job 10b generates Team Rocket at the START
// of the work, so SET_INFO gained a set that has no ladder bracket and whose
// cards cannot legally be put in a deck, and three assertions here failed for a
// reason that had nothing to do with progression.
const LIVE = P.liveSets(CARD_DB, EFFECTS, SET_INFO);
const hasDeck = ref => ref.startsWith('theme:') ? !!DECKS[ref.slice(6)] : !!OPPONENT_DECKS[ref];
const setName = code => (SET_INFO[code] || {}).name || code;
const build = (sets = LIVE, data = LADDER) => P.buildLadder(sets, data, { hasDeck, setName });
const fresh = () => ensureShape(newSave());

// beat everyone in a bracket's roster up to `n`, so the boss gate can be reached
const clear = (save, bracket, n) => bracket.roster.slice(0, n).forEach(o => P.recordWin(save, build(), o.id));

// ---------------------------------------------------------------------------
group('the ladder is derived from the live sets');

const L = build();
eq(L.length, LIVE.length, 'one bracket per live set');
eq(L.map(b => b.set).join(','), LIVE.join(','), 'brackets follow the live-set order');
// AUTHORED vs GENERATED, counted rather than assumed. This said "all three live
// sets have an authored bracket" and went red the moment Team Rocket went live —
// correctly, and for a reason that is not a bug: base5 has no roster in
// OPPONENTS.md yet, so it gets a generated bracket, which is exactly what the
// derivation is FOR and what the three cases below already assert.
//
// So the claim worth holding is not "every set is authored" — that one expires
// with every set job — but that the sets which ARE authored come first and the
// generated ones trail. A generated bracket wedged between two authored ones
// would mean the derivation had lost the live-set order.
{
  const gen = L.map(b => !!b.generated);
  const firstGen = gen.indexOf(true);
  ok(firstGen === -1 || gen.slice(firstGen).every(Boolean),
     'authored brackets come first, generated ones trail');
  console.log(`    ${gen.filter(x => !x).length} authored, ${gen.filter(Boolean).length} generated`);
}
eq(L[0].name, 'The Clubs', 'the first bracket is named from the data');

// The whole point of deriving: a set nobody authored still gets a bracket.
//
// THE UNAUTHORED SET IS FABRICATED, not borrowed. This block used to reach for
// base5, which was unauthored only by accident — and on 21 Aug 2026 Team Rocket
// got a roster and five assertions about the derivation went red without a
// single thing being wrong. A test whose subject is "whichever set nobody has
// got to yet" expires every time somebody gets to one. So: take the real ladder
// data, delete one bracket from a copy, and assert against that.
const noRocket = JSON.parse(JSON.stringify(LADDER));
delete noRocket.brackets.base5;
const withRocket = build(LIVE, noRocket);
eq(withRocket.length, LIVE.length, 'a set with no bracket in the data still gets one');
const rocket = withRocket[withRocket.length - 1];
eq(rocket.set, 'base5', 'and it is the one whose bracket was removed');
ok(rocket.generated, 'the unauthored bracket is flagged as generated');
eq(rocket.roster.length, P.PROGRESS_DEFAULTS.bossAfter, 'it is backfilled to exactly bossAfter opponents');
ok(rocket.roster.every(o => o.deck === 'generate'), 'all of its opponents are generated');
ok(rocket.boss && rocket.boss.isBoss, 'it gets a boss too');
ok(rocket.roster.every(o => o.placeholder), 'and every one is marked placeholder');
// It is NAMED, not labelled with its own set code. It was: Team Rocket going live
// put a bracket titled "base5" on screen beside "The Clubs" and "The Jungle". The
// name is the caller's to supply because progress.js is pure and cannot see
// SET_INFO — so a caller that forgets falls back to the code and this catches it.
eq(rocket.name, 'Team Rocket', 'a generated bracket is named from SET_INFO, not the raw set code');
ok(!/^based/.test(rocket.name), 'and never reads as a set code');

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
// DERIVED, not listed. This was `{ theme: DECKS, gbc: {}, jungle: {} }` and adding a
// fourth source to gen_cards.js made the suite THROW on an undefined bucket instead of
// failing a named assertion — a test that has to be edited whenever the thing it tests
// grows is a test that will be edited wrongly. Every prefix in OPPONENT_DECKS gets a
// bucket; 'theme' is the only one that comes from somewhere else.
const sources = { theme: DECKS };
for (const k of Object.keys(OPPONENT_DECKS)) {
  const cut = k.indexOf(':');
  const prefix = k.slice(0, cut);
  (sources[prefix] || (sources[prefix] = {}))[k.slice(cut + 1)] = OPPONENT_DECKS[k];
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
eq(authored, 41, 'the four brackets name 41 authored opponents — 16 GBC, 4 theme, 2 Jungle, and Trevor 8 + 5 + 6');
ok(illegal.length === 0, `every authored opponent fields a legal 60-card deck${illegal.length ? '\n        ' + illegal.join('\n        ') : ''}`);

// Nothing in a deck FILE is stranded. A deck that resolves but that no rung fields is
// invisible: it passes every other check in here and no player ever meets it, which is
// how data sits unwired for a week. Asserted per source file rather than once.
const usedFrom = prefix => {
  const used = new Set();
  L.forEach(b => P.allOpponents(b).forEach(o => {
    if (o.deck.startsWith(prefix + ':')) used.add(o.deck.slice(prefix.length + 1));
  }));
  return used;
};
eq(usedFrom('gbc').size, 16, 'all sixteen GBC decks are assigned to an opponent');
eq(usedFrom('b1').size, 8, "all eight of Trevor's Base Set decks are assigned to an opponent");
eq(usedFrom('jungle').size, 2, 'both Jungle decks are assigned to an opponent');

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
// DERIVED, not counted by hand — this said 3 and went red on the fourth set.
// "One boss per bracket" is the invariant; the number of brackets is not.
eq(st.bossTotal, L.filter(b => b.boss).length, 'one boss per bracket that has one');
eq(st.bossTotal, L.length, '...which is every bracket, generated ones included');
eq(st.bosses, 1, 'one of them beaten');
eq(st.total, L.reduce((a, b) => a + b.roster.length, 0), 'the roster total counts every bracket');
ok(P.findOpponent(L, 'gbc-ronald-1') !== null, 'an opponent can be looked up by id');
ok(P.findOpponent(L, 'nobody') === null, 'and an unknown id returns null rather than throwing');
eq(P.bracketOf(L, 'gbc-ronald-2').set, 'base2', 'and the bracket it belongs to is findable');

// ---------------------------------------------------------------------------
console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail ? 1 : 0);

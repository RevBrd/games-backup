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
// A BRACKET IS NO LONGER ALWAYS A SET — Job 15a. So the invariant is not
// "one bracket per live set" any more; it is "every live set has exactly one
// bracket, in order, and anything extra is standalone and anchored". Written as
// the stronger pair rather than relaxed to a count, because a count would have
// gone green on a challenge bracket landing in the wrong place.
eq(L.filter(b => !b.standalone).length, LIVE.length, 'one SET bracket per live set');
eq(L.filter(b => !b.standalone).map(b => b.set).join(','), LIVE.join(','),
  'the set brackets follow the live-set order');
{
  const names = L.map(b => b.set);
  for (const b of L.filter(x => x.standalone)) {
    const src = LADDER.brackets[b.set];
    eq(names[b.index - 1], src.after, `${b.set} sits immediately after ${src.after}`);
    ok(b.index > 0, '...and never first, since it is anchored to something');
  }
  console.log(`    ${L.length} brackets: ${L.filter(x => !x.standalone).length} sets, ${L.filter(x => x.standalone).length} standalone`);
}
// A STANDALONE APPEARS ONLY WHEN EVERYTHING IT IS MADE OF IS LIVE. Challenge 1's
// decks are drawn from Base, Jungle and Fossil, so a build generated without one
// of them must not offer a bracket whose whole roster would backfill to generated
// challengers — which is what would happen, silently, without `requires`.
{
  const early = build(['base1', 'base2']);
  ok(early.every(b => !b.standalone), 'a standalone whose `requires` are not all live never appears');
  const ready = build(['base1', 'base2', 'base3']);
  ok(ready.some(b => b.set === 'challenge1'), '...and appears the moment they are');
  eq(ready[ready.length - 1].set, 'challenge1', 'as the last bracket, if nothing follows its anchor');
}
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
eq(withRocket.filter(b => !b.standalone).length, LIVE.length, 'a set with no bracket in the data still gets one');
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
eq(authored, 46, 'the five brackets name 46 authored opponents — 4 GBC Grand Masters, ' +
  '8 theme (4 Base + 2 Jungle + 2 Team Rocket), and Trevor 8 + 5 + 6 + 8 + 7');
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
// TWELVE of the sixteen are now unassigned and that is the placeholder rule
// working, not a leak: eight club masters retired on 25 Aug 2026 when Team Rocket
// got its own roster, and the four Ronalds retired on 1 Sep 2026 when Job 15a
// removed him. They are never deleted — gbc_decks.json still carries all sixteen.
// Only the four Grand Masters are assigned, holding base3's stand-in intro.
//
// NOTE THE ASYMMETRY, because it is the point of this whole block: `gbc` is a
// PLACEHOLDER source and being partly unused is correct for it, while every
// hand-built source below must be fully assigned or a deck Trevor made is sitting
// in a file that nothing reads.
eq(usedFrom('gbc').size, 4, 'four GBC decks are still assigned — the Grand Masters, and nobody else');
eq(usedFrom('b1').size, 8, "all eight of Trevor's Base Set decks are assigned to an opponent");
eq(usedFrom('b2').size, 5, "all five of Trevor's Jungle decks are assigned to an opponent");
eq(usedFrom('b3').size, 6, "all six of Trevor's Fossil decks are assigned to an opponent");
eq(usedFrom('b5').size, 8, "all eight of Trevor's Team Rocket decks are assigned to an opponent");
eq(usedFrom('c1').size, 7, "all seven of Trevor's Challenge 1 decks are assigned to an opponent");
eq(usedFrom('jungle').size, 2, 'both Jungle theme decks are assigned to an opponent');
eq(usedFrom('tr').size, 2, 'both Team Rocket theme decks are assigned to an opponent');

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

// DRIVEN OFF A FIXTURE, NOT OFF THE LIVE LADDER, since 1 Sep 2026 — and the
// reason is worth the paragraph. Ronald was the only content `extra` had ever
// held, one per bracket, and Job 15a removed him from all four at Trevor's ask.
// These assertions went red instantly, which put a real choice in front of
// whoever was standing there: delete them, or re-point them.
//
// Deleting them was wrong. `extra` is a working mechanism that the detailing pass
// is expected to hang a real post-boss encounter on, and a mechanism with no
// tests and no users is a mechanism that quietly stops working and nobody finds
// out until somebody tries to use it. A fixture keeps the coverage alive across
// however long the slot stays empty. **If a real `extra` ever lands on the live
// ladder, this can point back at it** — but it does not have to.
{
  const fixture = JSON.parse(JSON.stringify(LADDER));
  fixture.brackets.base3.extra = [
    { id: 'fixture-extra', name: 'Fixture', title: 'post-boss', deck: 'gbc:ronald_powerful' },
  ];
  const F = build(LIVE, fixture);
  const s2 = fresh();
  const third = F[2];
  eq(third.set, 'base3', 'the fixture bracket is the one we think it is');
  ok(third.extra.length === 1, 'it has one post-boss challenger');
  ok(!P.canFight(s2, F, third.extra[0].id), 'who is not fightable on a fresh save');
  // open bracket 3 the long way: clear and beat both earlier bosses
  [0, 1].forEach(i => { clear(s2, F[i], F[i].cfg.bossAfter); P.recordWin(s2, F, F[i].boss.id); });
  ok(P.bracketOpen(s2, F, 2), 'the third bracket opens after two bosses');
  ok(!P.canFight(s2, F, third.extra[0].id), 'the extra is still shut behind its own boss');
  clear(s2, F[2], F[2].cfg.bossAfter);
  P.recordWin(s2, F, third.boss.id);
  ok(P.canFight(s2, F, third.extra[0].id), 'and opens once that boss falls');
  eq(P.winReward(s2, F, third.extra[0].id).packs, 2, 'the extra pays a normal 2 packs');
}

// ...and the live ladder has none, which is a fact worth asserting rather than
// leaving as an absence. If one reappears it should be a decision.
ok(L.every(b => b.extra.length === 0),
  'no bracket on the LIVE ladder carries an extra — Ronald was removed 1 Sep 2026');

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

group('the promo gates');

// A PROMO IS GATED PER CARD, so these are the two things that can go wrong:
// the table disagrees with the workbook it was copied from, and a gate lets a
// card through at the wrong moment. Both are checked directly.

const GATE_KEY = {
  'base1': 'base1', 'Jungle': 'base2', 'Fossil': 'base3', 'Team Rocket': 'base5',
  'Challenge 1': 'challenge1', 'Challenge 2': 'challenge2',
  'Gym Heroes': 'gym1', 'Gym Challenge': 'gym2',
};

// THE DRIFT GUARD. PROMO_GATES is a hand-copied transcription of the `Gated
// Until` column in the workbook's Index tab, and the two cannot see each other —
// which is this tree's most reliable source of a wrong fact. So the suite reads
// the workbook and asserts they still agree.
//
// IF THIS GOES RED, TREVOR MOVED A GATE. That is a normal thing for him to do:
// he said on 27 Aug 2026 that he is reconsidering the whole gate ORDER against a
// cleared-based reading. Regenerate the table from the workbook rather than
// editing the one line that differs, and do not "fix" it by loosening this.
//
// A row for a card that is not in CARD_DB is SKIPPED rather than failed —
// `basep-54` Ancient Mew is an unnumbered movie promo that the corpus does not
// carry, so Trevor's note for it is filed ahead of the card existing. That is the
// documented state, not a gap. See DATA.md.
{
  const { openWorkbook, tabulate, newestWorkbook } = require('./lib/xlsx.js');
  const path = require('path');
  const picked = newestWorkbook(path.join(__dirname, '..', 'data', 'v1 Opp Decks'));
  const rows = tabulate(openWorkbook(picked.file).sheet('Index'));

  const fromBook = {};
  let skipped = 0, unmapped = 0;
  for (const r of rows) {
    if (!r.ID || !r.ID.trim().startsWith('basep')) continue;
    const id = r.ID.trim();
    const raw = (r['Gated Until (promo only)'] || '').trim();
    if (!CARD_DB[id]) { skipped++; continue; }
    if (!raw) continue;
    if (!GATE_KEY[raw]) { unmapped++; continue; }
    fromBook[id] = GATE_KEY[raw];
  }

  eq(unmapped, 0, 'every gate Trevor wrote maps to a bracket key this suite knows');
  eq(skipped, 1, 'exactly one gated promo has no card in the corpus (basep-54, Ancient Mew)');

  const a = Object.keys(fromBook).sort().join(',');
  const b = Object.keys(P.PROMO_GATES).sort().join(',');
  eq(a, b, 'PROMO_GATES covers exactly the promos the workbook gates');

  const wrong = Object.keys(fromBook).filter(id => P.PROMO_GATES[id] !== fromBook[id]);
  eq(wrong.length, 0, `and every gate matches the workbook${wrong.length ? ` — ${wrong.join(', ')}` : ''}`);
}

// PLAYABILITY IS THE SECOND TEST AND IT IS NOT OPTIONAL. basep is deliberately
// half-scripted, so a gate opening is necessary but not sufficient — CLAUDE.md's
// "no collecting a card you cannot play" is what the callback enforces.
{
  const gated = Object.keys(P.PROMO_GATES);
  const unscripted = gated.filter(id => !EFFECTS[id]);
  eq(unscripted.length, 0,
    'every promo with a gate is scripted today, so the gate is currently the only filter');
  ok(gated.length < Object.keys(CARD_DB).filter(id => CARD_DB[id].set === 'basep').length,
    '...but not every promo has a gate, which is why the filter still has to exist');
}

// THE GATE IS "BRACKET OPEN", NOT "BRACKET CLEARED" — Trevor's call, 27 Aug 2026.
// The base1 bracket is open from the first second, so a brand-new save can pull
// its four base1-gated promos immediately. If this ever reads 0 for a fresh save,
// somebody has changed the reading and PACKS.md has to change with it.
{
  const s = fresh();
  const day1 = P.unlockedPromos(s, L);
  eq(day1.length, 4, 'a brand-new save has already unlocked the four base1-gated promos');
  ok(day1.indexOf('basep-8') >= 0, '...including Mew, the only #151 anywhere in the live pool');
  ok(day1.every(id => P.PROMO_GATES[id] === 'base1'), 'and nothing from a later bracket');

  // Beat Base Set's boss and Jungle's five arrive. Derived from the same
  // `beaten` map as everything else, never stored.
  P.recordWin(s, L, L[0].boss.id);
  const day2 = P.unlockedPromos(s, L);
  eq(day2.length, 9, 'clearing Base Set opens Jungle\u2019s five');
  ok(day2.indexOf('basep-12') >= 0, '...including Mewtwo GP');

  // Eleven of the twenty-eight are gated on brackets that do not exist. They
  // must FAIL CLOSED — an unmatched key locks a card rather than leaking one.
  const everything = { progress: { beaten: {} } };
  L.forEach(b => { everything.progress.beaten[b.boss.id] = 1; });
  const all = P.unlockedPromos(everything, L);
  // 21 SINCE 1 SEP 2026, up from 17. Job 15a built the `challenge1` bracket and
  // four promos gated on it turned on with no change to PROMO_GATES and no code —
  // Venusaur CH, Cool Porygon, Flying Pikachu and Surfing Pikachu. That is the
  // per-card gate paying off exactly as designed, and it is the reason this
  // number is allowed to move: what must NOT move is the line below it.
  eq(all.length, 21, 'clearing every live bracket opens 21 of the 28');
  const locked = Object.keys(P.PROMO_GATES).filter(id => all.indexOf(id) < 0);
  ok(locked.every(id => ['challenge2', 'gym1', 'gym2'].indexOf(P.PROMO_GATES[id]) >= 0),
    'and every one still locked is waiting on a bracket that does not exist yet');
  ok(all.indexOf('basep-15') >= 0, 'Cool Porygon arrived with the bracket its gate names');

  // The playability callback, proved rather than assumed.
  eq(P.unlockedPromos(everything, L, () => false).length, 0,
    'an isPlayable that refuses everything yields nothing, however far you have got');
}

group('a bracket that is not a set');

// Job 15a. Challenge 1 is the first bracket on the ladder that belongs to no set,
// and almost everything here is asserting that `bracket.set` is being read as an
// IDENTITY by the things that should and never as a POOL by the things that
// should not. See buildLadder's header on why those are four different questions.
{
  const c = L.find(b => b.standalone);
  ok(c, 'the ladder carries a standalone bracket');
  eq(c.set, 'challenge1', 'whose `set` is its own key, which is what PROMO_GATES matches');
  ok(!SET_INFO[c.set], '...and which is deliberately NOT a set — no dex section, no completion %');
  eq(c.roster.length, 7 - 1, 'six rungs and a boss, from seven authored decks');
  ok(c.roster.concat([c.boss]).every(o => o.deck.startsWith('c1:')),
    'every one of the seven fields one of Trevor’s Challenge decks');

  // WHAT IT IS MADE OF, which is the question `set` cannot answer.
  eq(c.packSets.join(','), 'base1,base2,base3',
    'its packs draw from every booster set BEFORE it, derived from ladder position');
  ok(c.packSets.indexOf('challenge1') < 0, 'and never from its own key, which names no cards');
  ok(c.packSets.indexOf('base5') < 0, 'nor from anything after it, however far the player has got');
  // The property that makes it stable: it is a fact about the LADDER, so a pack
  // sitting in the save cannot change contents because the player beat somebody.
  // Asserted by beating everybody and asking again.
  {
    const done = { progress: { beaten: {} } };
    L.forEach(b => { done.progress.beaten[b.boss.id] = 1; });
    eq(build().find(b => b.standalone).packSets.join(','), 'base1,base2,base3',
      '...and it is the same list on a finished save as on a fresh one');
  }
  eq(P.poolSetsFor(L, c).join(','), 'base1,base2,base3',
    'a generated challenger inside it draws from real sets only');

  // bossAfter: 'all' — the word never escapes buildLadder.
  eq(c.cfg.bossAfter, c.roster.length, "cfg.bossAfter 'all' resolves to the roster's real length");
  eq(typeof c.cfg.bossAfter, 'number', '...as a number, so nothing downstream has to know the word exists');
  {
    const s = fresh();
    L.slice(0, c.index).forEach(b => { clear(s, b, b.cfg.bossAfter); P.recordWin(s, L, b.boss.id); });
    ok(P.bracketOpen(s, L, c.index), 'the Challenge opens once Fossil’s boss is down');
    clear(s, c, c.roster.length - 1);
    ok(!P.bossAvailable(s, c), 'and beating all but ONE of its roster is not enough');
    P.recordWin(s, L, c.roster[c.roster.length - 1].id);
    ok(P.bossAvailable(s, c), '...the last one summons the boss');

    // IT PAYS IN ITS OWN KEY, which is the whole reason a Challenge pack can exist.
    const rw = P.winReward(s, L, c.boss.id);
    eq(rw.set, 'challenge1', 'a Challenge win pays in a pack keyed by the bracket');
    eq(rw.packs, 3, '...3 for a first boss win, same as any other bracket');
    // AND IT RE-GATES WHAT FOLLOWS. Team Rocket used to open off Fossil's boss.
    eq(rw.unlocks, 'base5', 'clearing it is what opens Team Rocket now');
    ok(!P.bracketOpen(s, L, c.index + 1), '...which is shut until that happens');
  }
}

group('reporting');

const st = P.progressStats(s, L);
// DERIVED, not counted by hand — this said 3 and went red on the fourth set.
// "One boss per bracket" is the invariant; the number of brackets is not.
eq(st.bossTotal, L.filter(b => b.boss).length, 'one boss per bracket that has one');
eq(st.bossTotal, L.length, '...which is every bracket, generated ones included');
eq(st.bosses, 1, 'one of them beaten');
eq(st.total, L.reduce((a, b) => a + b.roster.length, 0), 'the roster total counts every bracket');
// Named from the DATA rather than typed, so this pair stops expiring. It named
// two Ronalds and both vanished on 1 Sep 2026 — the third time an assertion in
// this file has been written against whoever happened to be standing in a slot.
{
  const someone = L[1].roster[0].id;
  ok(P.findOpponent(L, someone) !== null, 'an opponent can be looked up by id');
  ok(P.findOpponent(L, 'nobody') === null, 'and an unknown id returns null rather than throwing');
  eq(P.bracketOf(L, someone).set, L[1].set, 'and the bracket it belongs to is findable');
  // ...including inside a bracket that is not a set, which is the lookup path a
  // Challenge win takes on its way to being paid.
  const chal = L.find(b => b.standalone);
  eq(P.bracketOf(L, chal.boss.id).set, chal.set, 'a standalone bracket is findable from its boss');
}

// ---------------------------------------------------------------------------
console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail ? 1 : 0);

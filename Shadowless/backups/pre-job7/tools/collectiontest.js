// Behavioural tests for the collection layer — src/collection.js.
//
//   node tools/collectiontest.js
//
// The fourth suite, and like the other three it subsumes none of them.
// selftest proves games don't break, powertest proves Powers do what the cards
// say, smoke proves the built HTML works. This one proves the SAVE FILE is
// trustworthy: that variant keys canonicalise, that reservation arithmetic is
// right, that a corrupt save is preserved rather than overwritten, and that
// migration actually runs.
//
// It stubs localStorage rather than skipping persistence, because "does a save
// survive a round trip" is the single most important property here and testing
// everything except that would be testing the easy half.

const C = require('../src/collection.js');
const { CARD_DB, DECKS } = require('../src/cards.js');

let fail = 0, pass = 0;
const check = (ok, label, detail = '') => {
  if (ok) pass++; else fail++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
};
const eq = (a, b, label) => check(a === b, label, a === b ? '' : `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const throws = (fn, label) => {
  try { fn(); check(false, label, 'did not throw'); }
  catch (e) { check(true, label); }
};
const head = t => console.log(`\n${t}`);

// --- a localStorage stub, so persistence is tested rather than skipped -----
function installStorage() {
  const map = {};
  const ls = {
    _map: map,
    _throwOnSet: false,
    getItem: k => (k in map ? map[k] : null),
    setItem: (k, v) => {
      if (ls._throwOnSet) throw new Error('QuotaExceededError');
      map[k] = String(v);
    },
    removeItem: k => { delete map[k]; },
  };
  global.localStorage = ls;
  return ls;
}

// ===========================================================================
head('Variant keys');

eq(C.vkey(), '', 'no flags is the plain key');
eq(C.vkey(''), '', 'the empty string is already canonical');
eq(C.vkey(['sh']), 'sh', 'a single flag round-trips');
eq(C.vkey(['sh', 'fe']), 'fe+sh', 'flags sort into declared order');
eq(C.vkey(['fe', 'sh']), 'fe+sh', 'the same set in either order is the same pile');
eq(C.vkey('sh+fe'), 'fe+sh', 'a joined string is canonicalised too');
eq(C.vkey(['sh', 'sh']), 'sh', 'a repeated flag is collapsed');
eq(C.vkey(['sh', 'nonsense']), 'sh', 'an unknown flag is dropped, not stored');
eq(C.vkey(['mp1', 'mp2']), 'mp1', 'Misprint flavours are mutually exclusive');
eq(C.vkey(new Set(['sl', 'rh'])), 'rh+sl', 'a Set works as input');
check(C.isPlain(C.vkey([])), 'isPlain agrees with the plain key');

// The whole point of the ordering: one expensive flag beats several cheap ones.
check(C.vscore('sl') > C.vscore('rh+fe'), 'one Shadowless outranks Reverse Holo + 1st Edition');
check(C.vscore('mp1') > C.vscore('sl'), 'Misprint is the top of the ladder');
check(C.vscore('') === 0, 'plain scores zero');
eq(C.vlabel(''), 'Normal', 'the plain pile has a readable label');
eq(C.vlabel('fe+sh'), '1st Edition · Shiny', 'a combined label reads both flags');

// ===========================================================================
head('Owning cards');

let s = C.newSave({ starter: 'Brushfire', now: 1 });
eq(C.ownedTotal(s, 'base1-61'), 0, 'a fresh save owns nothing');
eq(C.bestVariant(s, 'base1-61'), '', 'an unowned card still reports a renderable variant');

C.grant(s, 'base1-61', '', 9);
C.grant(s, 'base1-61', 'sh', 1);
C.grant(s, 'base1-61', ['rh'], 2);
eq(C.ownedTotal(s, 'base1-61'), 12, 'piles sum to the total owned');
eq(C.ownedOf(s, 'base1-61', 'sh'), 1, 'a specific pile reads back');
eq(Object.keys(s.owned['base1-61']).length, 3, 'twelve cards are stored as three numbers');
eq(C.bestVariant(s, 'base1-61'), 'sh', 'the best owned variant is the face of the stack');

C.grant(s, 'base1-61', 'fe+sh', 1);
eq(C.bestVariant(s, 'base1-61'), 'fe+sh', 'a better pull takes over the face');
eq(C.pilesOf(s, 'base1-61').length, 4, 'every non-empty pile is listed');
eq(C.pilesOf(s, 'base1-61')[0].key, 'fe+sh', 'piles list best first');
C.grant(s, 'base1-61', 'sh', 0);
eq(C.ownedOf(s, 'base1-61', 'sh'), 1, 'granting zero is a no-op');

// Granting via either key form must land in the SAME pile, not two.
C.grant(s, 'base1-4', 'sh+fe', 1);
C.grant(s, 'base1-4', ['fe', 'sh'], 1);
eq(Object.keys(s.owned['base1-4']).length, 1, 'equivalent keys land in one pile');
eq(C.ownedOf(s, 'base1-4', 'fe+sh'), 2, 'and the counts add');

// ===========================================================================
head('The starter grant');

const st = C.newSave({ starter: 'Brushfire', now: 1 });
C.grantDeck(st, DECKS.Brushfire);
const starterTotal = DECKS.Brushfire.list.reduce((a, [q]) => a + q, 0);
let granted = 0;
for (const id in st.owned) granted += C.ownedTotal(st, id);
eq(granted, starterTotal, 'the starter grant hands over the whole 60-card list');
eq(starterTotal, 60, 'and that list really is 60 cards');
const anyVariant = Object.keys(st.owned).some(id => Object.keys(st.owned[id]).some(k => k !== ''));
check(!anyVariant, 'nothing in the starter deck carries a variant');

// ===========================================================================
head('Reservation (derived, never stored)');

const r = C.newSave({ now: 1 });
C.grant(r, 'base1-61', '', 4);
C.grant(r, 'base1-61', 'sh', 1);
eq(C.available(r, 'base1-61', ''), 4, 'nothing is reserved with no decks');

r.decks.push({ name: 'A', list: [[2, 'base1-61'], [1, 'base1-61', 'sh']] });
eq(C.available(r, 'base1-61', ''), 2, 'a deck reserves from the plain pile');
eq(C.available(r, 'base1-61', 'sh'), 0, 'and the Shiny is spoken for');
eq(C.available(r, 'base1-61', 'sh', 'A'), 1, 'editing deck A frees what deck A holds');

r.decks.push({ name: 'B', list: [[2, 'base1-61']] });
eq(C.available(r, 'base1-61', ''), 0, 'a second deck takes the rest');
check(C.available(r, 'base1-61', 'sh') < 1, 'the one Shiny cannot be in two decks at once');
check(!('reserved' in r), 'reservation is never written into the save');

// The two-element deck entry has to keep meaning "plain" — data/decks.json and
// the DECKS in cards.js are all written that way and must not need migrating.
const legacy = C.newSave({ now: 1 });
C.grant(legacy, 'base1-61', '', 4);
legacy.decks.push({ name: 'legacy', list: [[3, 'base1-61']] });
eq(C.available(legacy, 'base1-61', ''), 1, 'a [qty, id] entry reserves from the plain pile');

// ===========================================================================
head('Built decks vs. saved layouts');

// The distinction that fell out of "a draft should not hold cards hostage":
// a draft and a blueprint are the same object, and it reproduces the GBC
// split between decks you have BUILT and layouts you have merely SAVED.
const bd = C.newSave({ now: 1 });
C.grant(bd, 'base1-61', '', 4);
bd.decks.push({ id: '1', name: 'Built', list: [[3, 'base1-61']], built: true });
bd.decks.push({ id: '2', name: 'Draft', list: [[3, 'base1-61']], built: false });
eq(C.available(bd, 'base1-61', ''), 1, 'only the built deck reserves; the draft holds nothing');
eq(C.builtDecks(bd).length, 1, 'one deck is built');
eq(C.findDeck(bd, '2').name, 'Draft', 'decks are found by id');
eq(C.findDeck(bd, 'nope'), null, 'an unknown id is null, not a throw');

// A layout can go stale: another deck takes what it wanted. That is why
// availability is recomputed at build time and never cached.
const short = C.deckShortfall(bd, C.findDeck(bd, '2'), CARD_DB);
eq(short.length, 1, 'the draft is short, because the built deck took the cards');
eq(short[0].need, 3, 'and says how many it wanted');
eq(short[0].have, 1, 'and how many are actually free');
eq(short[0].name, 'Rattata', 'named for a message the player can act on');
eq(C.deckShortfall(bd, C.findDeck(bd, '1'), CARD_DB).length, 0, 'a built deck is not short against itself');

eq(C.canUnbuild(bd, '1').ok, false, 'the only built deck cannot be un-built');
bd.decks.push({ id: '3', name: 'Other', list: [], built: true });
eq(C.canUnbuild(bd, '1').ok, true, 'with a second built deck it can');
eq(C.canUnbuild(bd, '2').ok, false, 'a draft was never built, so it cannot be un-built');
eq(C.canUnbuild(bd, 'nope').ok, false, 'an unknown deck refuses rather than throwing');

// Un-building is LOSSLESS — that is what makes it safe to allow at all.
const before = JSON.stringify(C.findDeck(bd, '1').list);
C.findDeck(bd, '1').built = false;
eq(JSON.stringify(C.findDeck(bd, '1').list), before, 'un-building keeps the list intact');
eq(C.available(bd, 'base1-61', ''), 4, 'and returns every card to the pool');

eq(C.nextDeckId(bd), '4', 'ids are sequential and predictable');

// A save written before either field existed must gain both, and every deck
// in it was by definition a real reserving deck.
const old = C.validate(C.migrate({ v: 1, owned: {}, decks: [{ name: 'Legacy', list: [] }] }));
eq(old.decks[0].id, '1', 'a deck with no id gets one');
eq(old.decks[0].built, true, 'and a deck with no `built` flag is built');

// ===========================================================================
head('The 4-copy rule counts by name, across variants');

const byName = C.copiesByNameIn(CARD_DB, [[3, 'base1-61'], [1, 'base1-61', 'sh']]);
eq(byName.Rattata, 4, 'a Shiny Rattata is still a Rattata for the 4-copy rule');
const themeCounts = C.copiesByNameIn(CARD_DB, DECKS.Brushfire.list);
const overFour = Object.keys(themeCounts).filter(n => themeCounts[n] > 4 && !/Energy$/.test(n));
eq(overFour.length, 0, 'the authentic theme deck obeys its own rule', overFour.join(', '));

// ===========================================================================
head('Dex arithmetic comes from the database, not a constant');

const dx = C.newSave({ now: 1 });
let stats = C.collectionStats(dx, CARD_DB);
eq(stats.cards.owned, 0, 'an empty collection owns no cards');
eq(stats.cards.total, Object.keys(CARD_DB).length, 'the denominator is the live database');
const speciesInDb = new Set(Object.values(CARD_DB).filter(c => c.dex).map(c => c.dex)).size;
eq(stats.species.total, speciesInDb, 'the species count comes from the database, not a constant');
check(stats.species.total < stats.cards.total, 'species and cards are counted separately');

C.grantDeck(dx, DECKS.Brushfire);
stats = C.collectionStats(dx, CARD_DB);
check(stats.cards.owned > 0 && stats.cards.owned < stats.cards.total, 'a starter deck is a partial collection');
const setSum = Object.values(stats.bySet).reduce((a, x) => a + x.total, 0);
eq(setSum, Object.keys(CARD_DB).length, 'per-set totals add up to the pool');
check(stats.bySet.base1.owned === stats.cards.owned, 'with one set loaded, the set is the collection');

// Owning four copies of one card must not count as four cards collected.
const dup = C.newSave({ now: 1 });
C.grant(dup, 'base1-4', '', 4);
eq(C.collectionStats(dup, CARD_DB).cards.owned, 1, 'duplicates do not inflate the dex');

// ===========================================================================
head('Validation');

throws(() => C.validate(null), 'null is not a save');
throws(() => C.validate({}), 'a save with no version is refused');
throws(() => C.validate({ v: 1, decks: [] }), 'a save with no owned map is refused');
throws(() => C.validate({ v: 1, owned: {}, decks: {} }), 'decks must be an array');
throws(() => C.validate({ v: 1, owned: { 'base1-4': { '': -1 } }, decks: [] }), 'a negative count is refused');
throws(() => C.validate({ v: 1, owned: { 'base1-4': { '': 'lots' } }, decks: [] }), 'a non-numeric count is refused');
throws(() => C.validate({ v: 1, owned: {}, decks: [{ list: [] }] }), 'an unnamed deck is refused');
check(!!C.validate(C.newSave({ now: 1 })), 'a fresh save validates');

// A save from a future Job 6 build must still LOAD on a Base-only build. It
// shows what it can rather than refusing — the alternative is a player who
// rebuilds and finds their collection gone.
const future = C.newSave({ now: 1 });
// Deliberately an id no set will ever mint. This was 'base2-15' until Jungle
// generated and the card became real, at which point the test asserted the
// opposite of what it meant.
C.grant(future, 'zz9-999', '', 1);
check(!!C.validate(future), 'a save naming cards outside the current pool still validates');
eq(C.collectionStats(future, CARD_DB).cards.owned, 0, 'and the unknown card simply is not counted');

// ===========================================================================
head('Migration');

eq(C.migrate(C.newSave({ now: 1 })).v, C.SAVE_VERSION, 'a current save passes through unchanged');
throws(() => C.migrate({ v: C.SAVE_VERSION + 1, owned: {}, decks: [] }), 'a save from the future is refused');
throws(() => C.migrate({ v: 0, owned: {}, decks: [] }), 'a gap in the migration chain is refused loudly');

// Exercise the machinery for real rather than trusting an empty table: register
// a fake v0 -> v1 step, migrate through it, then put the table back.
C.MIGRATIONS[0] = old => ({ v: 1, created: 0, owned: old.cards || {}, decks: [], starter: '', stats: {} });
const upgraded = C.migrate({ v: 0, cards: { 'base1-4': { '': 1 } } });
eq(upgraded.v, 1, 'a registered migration runs');
eq(C.ownedOf(upgraded, 'base1-4', ''), 1, 'and carries the collection across');
delete C.MIGRATIONS[0];

// ===========================================================================
head('Persistence round trip');

const ls = installStorage();
eq(C.loadSave().status, 'empty', 'an untouched browser reports empty, not corrupt');

const live = C.newSave({ starter: 'Brushfire', now: 1 });
C.grantDeck(live, DECKS.Brushfire);
C.grant(live, 'base1-4', 'fe+sh', 1);
live.decks.push({ name: 'Mine', list: [[1, 'base1-4', 'fe+sh']] });
check(C.writeSave(live).ok, 'a save writes');

const back = C.loadSave();
eq(back.status, 'ok', 'and reads back');
eq(C.ownedOf(back.save, 'base1-4', 'fe+sh'), 1, 'the variant pile survives the round trip');
eq(back.save.decks[0].list[0][2], 'fe+sh', 'a deck entry keeps its chosen copy');
eq(C.available(back.save, 'base1-4', 'fe+sh'), 0, 'and reservation still computes after a reload');

// Corruption must not be silently destroyed. A save that cannot be parsed today
// may be recoverable by hand tomorrow; overwriting it is not.
ls._map[C.SAVE_KEY] = '{this is not json';
const bad = C.loadSave();
eq(bad.status, 'corrupt', 'unparseable storage reports corrupt');
eq(bad.save, null, 'and hands back no save');
eq(ls._map[C.SAVE_BACKUP_KEY], '{this is not json', 'the unreadable text is preserved under a backup key');

ls._map[C.SAVE_KEY] = JSON.stringify({ v: 1, owned: { 'base1-4': { '': -3 } }, decks: [] });
eq(C.loadSave().status, 'corrupt', 'a structurally invalid save is corrupt, not loaded');

ls._throwOnSet = true;
const quota = C.writeSave(C.newSave({ now: 1 }));
check(!quota.ok && !!quota.error, 'a full quota reports failure instead of throwing');
ls._throwOnSet = false;

delete global.localStorage;
eq(C.loadSave().status, 'nostore', 'no localStorage is distinguishable from an empty one');
check(!C.writeSave(C.newSave({ now: 1 })).ok, 'and writing says so rather than pretending');

// ===========================================================================
head('Export and import');

const exp = C.exportSave(live);
check(exp.length > 0 && exp.indexOf('shadowless') >= 0, 'export produces a labelled blob');
const imp = C.importSave(exp);
eq(C.ownedOf(imp, 'base1-4', 'fe+sh'), 1, 'import restores the collection');
eq(imp.decks[0].name, 'Mine', 'and the decks');
check(!!C.importSave(JSON.stringify(live)), 'a bare save imports too, not only a wrapped one');
throws(() => C.importSave('nope'), 'garbage is refused');
throws(() => C.importSave('{"save":{"v":1,"owned":{},"decks":"no"}}'), 'a structurally bad import is refused');

// ensureShape() must fill an ABSENT field and refuse a wrong-typed one. Getting
// this backwards means a corrupt save gets quietly "repaired" into an empty one
// and validate() never sees it — which is exactly what happened first time.
const sparse = C.importSave('{"v":1,"owned":{"base1-4":{"":1}},"decks":[]}');
eq(typeof sparse.packs, 'object', 'a save predating `packs` gains it on load');
eq(sparse.stats.wins, 0, 'and gains zeroed counters');
throws(() => C.importSave('{"v":1,"owned":"nope","decks":[]}'), 'a wrong-typed owned map is still refused, not repaired');
// An export taken before a format change must still restore afterwards.
C.MIGRATIONS[0] = old => ({ v: 1, created: 0, owned: old.owned || {}, decks: [], starter: '', stats: {} });
eq(C.importSave('{"v":0,"owned":{"base1-4":{"":2}}}').v, 1, 'an old export is migrated on import');
delete C.MIGRATIONS[0];

// ===========================================================================
console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail ? 1 : 0);

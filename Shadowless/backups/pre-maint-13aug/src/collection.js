// ============================================================================
// COLLECTION — what the player owns, and the save file that remembers it.
//
// Job 5a. Pure data: no DOM, no engine, no CARD_DB import. Everything that
// needs the card database takes a `db` argument, which is what lets the whole
// module be driven from tools/collectiontest.js with no browser.
//
// THE ONE IDEA WORTH READING BEFORE THE CODE
//
// The unit of storage is the VARIANT COMBINATION, not the physical card. A
// player with twelve Rattata, one of them Shiny and two Reverse Holo, is:
//
//     owned['base1-61'] = { '': 9, 'sh': 1, 'rh': 2 }
//
// Twelve cards, three numbers. This is what makes two things true at once:
// the collection screen can show a card ONCE with its best variant as the
// face, and the deck builder can still let you put that specific Shiny in a
// deck while the other eleven stay plain. Per-physical-card objects would give
// the same power and cost thousands of entries to do it.
//
// A deck entry is therefore [qty, id] or [qty, id, vkey]. The two-element form
// means plain, which is why data/decks.json and the DECKS in cards.js remain
// valid deck definitions with no migration at all.
// ============================================================================

const SAVE_VERSION = 1;
const SAVE_KEY = 'shadowless.save';
const SAVE_BACKUP_KEY = 'shadowless.save.corrupt';

// --------------------------------------------------------------- variants --
// Declared in ascending order of how impressive a pull is. That single order
// does three jobs: it canonicalises keys (so 'sh+fe' and 'fe+sh' are the same
// pile), it ranks variants for bestVariant(), and it is the order the UI should
// list them in. Add a flag here and the rest follows.
//
// mp1/mp2/mp3 are the Misprint glitch flavours. They live in the key rather
// than beside it so that two differently-broken Rattata are genuinely different
// collectibles, while two identically-broken ones still collapse into one pile.
// They are mutually exclusive: a card is misprinted one way or not at all.
const VARIANTS = [
  { key: 'rh',  label: 'Reverse Holo', family: 'rh' },
  { key: 'fe',  label: '1st Edition',  family: 'fe' },
  { key: 'sh',  label: 'Shiny',        family: 'sh' },
  { key: 'sl',  label: 'Shadowless',   family: 'sl' },
  { key: 'mp1', label: 'Misprint',     family: 'mp' },
  { key: 'mp2', label: 'Misprint',     family: 'mp' },
  { key: 'mp3', label: 'Misprint',     family: 'mp' },
];
const VARIANT_ORDER = VARIANTS.map(v => v.key);
const VARIANT_BY_KEY = {};
VARIANTS.forEach((v, i) => { VARIANT_BY_KEY[v.key] = Object.assign({ rank: i + 1 }, v); });

const PLAIN = '';

// Canonicalise a set of flags into a storage key. Accepts an array, a Set, or
// an already-joined string, so callers never have to care which they have.
// Unknown flags are dropped rather than stored — a typo must not silently
// create a pile that no renderer will ever draw.
function vkey(flags) {
  if (!flags) return PLAIN;
  let list;
  if (typeof flags === 'string') list = flags.split('+');
  else if (Array.isArray(flags)) list = flags.slice();
  else list = Array.from(flags);
  const seen = {};
  const fams = {};
  const out = [];
  for (const f of list) {
    const v = VARIANT_BY_KEY[f];
    if (!v || seen[f]) continue;
    if (fams[v.family]) continue;      // one per family; first declared wins
    seen[f] = 1; fams[v.family] = 1;
    out.push(f);
  }
  out.sort((a, b) => VARIANT_BY_KEY[a].rank - VARIANT_BY_KEY[b].rank);
  return out.join('+');
}

const vflags = key => (key ? String(key).split('+').filter(f => VARIANT_BY_KEY[f]) : []);
const isPlain = key => vkey(key) === PLAIN;

// How impressive a pile is, for picking the face of a stack. Rarer flags are
// worth exponentially more so that one Shadowless outranks any number of
// Reverse Holos, rather than three cheap flags out-scoring one expensive one.
function vscore(key) {
  return vflags(key).reduce((a, f) => a + (1 << VARIANT_BY_KEY[f].rank), 0);
}

function vlabel(key) {
  const f = vflags(key);
  if (!f.length) return 'Normal';
  return f.map(x => VARIANT_BY_KEY[x].label).join(' · ');
}

// --------------------------------------------------------------- the save --
function newSave(opts = {}) {
  return {
    v: SAVE_VERSION,
    created: opts.now || Date.now(),
    owned: {},                 // cardId -> { vkey: count }
    decks: [],                 // [{ name, list: [[qty, id, vkey?], ...] }]
    packs: {},                 // setCode -> unopened packs held
    starter: opts.starter || '',
    stats: { wins: 0, losses: 0, packsOpened: 0, cardsPulled: 0 },
    // Job 7. Which named opponents you have beaten, and how often. There is no
    // `unlocked` list beside it on purpose — progress.js derives what is open
    // from this map every time it is asked, so the two can never disagree.
    progress: { beaten: {}, lost: {} },
  };
}

// Fill in fields a save predates. Distinct from migrate() on purpose: migrate
// handles a FORMAT change and must fail loudly on a version it cannot bridge,
// whereas this is for additive fields where "absent" and "empty" mean the same
// thing. Adding an optional field to the save is a change to this function and
// nothing else — no version bump, no migration step.
// Fills only fields that are ABSENT. A present-but-wrong-typed field is
// corruption, not an old format, and repairing it here would hide it from
// validate() and silently discard whatever the player actually had. That
// distinction is the whole reason this is a separate function: `decks: "no"`
// must still be refused, while a save written before `packs` existed must not.
// (Written the lenient way first, which quietly turned a refused import into
// an accepted one — caught by collectiontest.)
function ensureShape(s) {
  if (s.owned == null) s.owned = {};
  if (s.decks == null) s.decks = [];
  if (s.packs == null) s.packs = {};
  // Counters are bookkeeping rather than collection data, so they are the one
  // place a wrong type is cheaper to reset than to reject.
  if (s.stats == null || typeof s.stats !== 'object') s.stats = {};
  ['wins', 'losses', 'packsOpened', 'cardsPulled'].forEach(k => {
    if (typeof s.stats[k] !== 'number') s.stats[k] = 0;
  });
  if (typeof s.starter !== 'string') s.starter = '';
  // Additive field (Job 7), so it belongs here rather than in a migration: a
  // save written before progression existed has beaten nobody, which is exactly
  // what an empty map means. Absent and empty are the same thing.
  if (s.progress == null || typeof s.progress !== 'object') s.progress = {};
  if (s.progress.beaten == null || typeof s.progress.beaten !== 'object') s.progress.beaten = {};
  if (s.progress.lost == null || typeof s.progress.lost !== 'object') s.progress.lost = {};
  // Decks predate both `id` and `built`. Absent id gets one; absent `built`
  // means true, because every deck that existed before the flag was a real,
  // playable, card-reserving deck. Filling only what is ABSENT, as above.
  let next = 0;
  for (const d of s.decks) { const n = parseInt(d && d.id, 10); if (n > next) next = n; }
  for (const d of s.decks) {
    if (!d || typeof d !== 'object') continue;
    if (d.id == null) d.id = String(++next);
    if (d.built == null) d.built = true;
  }
  return s;
}

const packsHeld = (save, set) => (save.packs && save.packs[set]) || 0;
const packsTotal = save => Object.keys(save.packs || {}).reduce((a, k) => a + save.packs[k], 0);

function addPacks(save, set, n) {
  if (!save.packs) save.packs = {};
  save.packs[set] = (save.packs[set] || 0) + n;
  return save;
}

function takePack(save, set) {
  if (packsHeld(save, set) <= 0) return false;
  save.packs[set]--;
  if (save.packs[set] <= 0) delete save.packs[set];
  return true;
}

function grant(save, cardId, key, n = 1) {
  if (n <= 0) return save;
  const k = vkey(key);
  const pile = save.owned[cardId] || (save.owned[cardId] = {});
  pile[k] = (pile[k] || 0) + n;
  return save;
}

// Hand the player a whole deck definition as loose cards. Used for the starter
// grant. `variants` is deliberately not a parameter: a granted deck is always
// plain. Trevor, 9 Aug — the first Shiny should be something a pack gave you,
// not something that was already in the box.
function grantDeck(save, deckDef) {
  for (const [qty, id] of deckDef.list) grant(save, id, PLAIN, qty);
  return save;
}

const ownedOf = (save, cardId, key) => (save.owned[cardId] || {})[vkey(key)] || 0;

function ownedTotal(save, cardId) {
  const pile = save.owned[cardId];
  if (!pile) return 0;
  let n = 0;
  for (const k in pile) n += pile[k];
  return n;
}

const isOwned = (save, cardId) => ownedTotal(save, cardId) > 0;

// The pile a stack should show its face as: the best variant owned, or plain.
// Returns a vkey, so a caller that owns nothing gets '' and renders normally
// rather than having to special-case an absence.
function bestVariant(save, cardId) {
  const pile = save.owned[cardId];
  if (!pile) return PLAIN;
  let best = PLAIN, bestScore = -1;
  for (const k in pile) {
    if (pile[k] <= 0) continue;
    const s = vscore(k);
    if (s > bestScore) { bestScore = s; best = k; }
  }
  return best;
}

// Every non-empty pile for a card, best first. This is what the deck builder
// lists under a card and what the collection screen shows on a detail view.
function pilesOf(save, cardId) {
  const pile = save.owned[cardId] || {};
  return Object.keys(pile)
    .filter(k => pile[k] > 0)
    .map(k => ({ key: k, n: pile[k], score: vscore(k), label: vlabel(k) }))
    .sort((a, b) => b.score - a.score);
}

// ------------------------------------------------------------- decks -------
// A deck is { id, name, list, built }.
//
// BUILT IS THE WHOLE MODEL, and it arrived by accident. Trevor's answer to
// "should an illegal draft be saveable" was yes, but its cards should stay in
// the pool for other decks — which is exactly the definition of a deck that
// does not reserve. That makes a draft and a "blueprint" (a deck you cannot
// afford yet) the same object, and it independently reproduces the GBC game's
// split between decks you have BUILT and layouts you have merely SAVED.
//
//   built: true   reserves its cards, and can be played
//   built: false  reserves nothing, cannot be played, costs nothing to keep
//
// Two consequences worth knowing. Un-building is LOSSLESS — the list survives,
// so dismantling is a reversible act rather than a destructive one. And a
// saved layout can go stale: another deck may claim a card it wanted, so its
// availability has to be rechecked at build time, never cached.
const deckIsBuilt = d => d.built !== false;
const builtDecks = save => save.decks.filter(deckIsBuilt);

// Ids are sequential rather than random so a save diffs cleanly and a test can
// predict them. Names are display only — they may repeat, and they may be
// anything the player types.
function nextDeckId(save) {
  let max = 0;
  for (const d of save.decks) { const n = parseInt(d.id, 10); if (n > max) max = n; }
  return String(max + 1);
}

const findDeck = (save, id) => save.decks.find(d => String(d.id) === String(id)) || null;

// The last BUILT deck may not be un-built or deleted. With un-building now
// lossless this is no longer protection against losing work — it is protection
// against a confusing empty state where deck select offers nothing but
// Sandbox and it is not obvious why.
function canUnbuild(save, id) {
  const d = findDeck(save, id);
  if (!d) return { ok: false, why: 'no such deck' };
  if (!deckIsBuilt(d)) return { ok: false, why: 'that deck is not built' };
  if (builtDecks(save).length <= 1) return { ok: false, why: 'this is your only built deck' };
  return { ok: true, why: '' };
}

// What a deck needs that the player cannot currently supply, counting only
// cards locked up by OTHER built decks. Returns [] when the deck is buildable.
// Recomputed on demand and never stored — see the note on reservation below.
function deckShortfall(save, deck, db) {
  const want = {};
  for (const entry of deck.list) {
    const id = entry[1], k = vkey(entry[2]);
    (want[id] = want[id] || {})[k] = (want[id][k] || 0) + entry[0];
  }
  const res = reservedCounts(save, deck.id);
  const out = [];
  for (const id in want) {
    for (const k in want[id]) {
      const own = ownedOf(save, id, k);
      const held = (res[id] || {})[k] || 0;      // locked up by other BUILT decks
      const have = own - held;
      if (want[id][k] > have) {
        // `own` and `held` are reported separately because "you have none" and
        // "your other deck is holding them" are completely different problems
        // with completely different fixes — open packs, or dismantle. A single
        // "0 free" number cannot tell the player which one they are looking at,
        // and that is the most confusing state a reservation model can produce.
        out.push({ id, vkey: k, need: want[id][k], have: Math.max(0, have),
          owned: own, held,
          name: (db && db[id] && db[id].name) || id });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------- reservation ----
// DERIVED, never stored. "How many plain Rattata are free" is owned minus the
// sum across every BUILT deck, recomputed on demand. Storing it would mean two
// numbers that can disagree, and they always eventually do.
//
// `exceptDeck` matches an id or a name, so a deck being edited does not
// reserve against itself.
function reservedCounts(save, exceptDeck) {
  const out = {};
  for (const d of save.decks) {
    if (!deckIsBuilt(d)) continue;              // drafts and blueprints hold nothing
    if (exceptDeck !== undefined && (String(d.id) === String(exceptDeck) || d.name === exceptDeck)) continue;
    for (const entry of d.list) {
      const [qty, id] = entry;
      const k = vkey(entry[2]);
      const pile = out[id] || (out[id] = {});
      pile[k] = (pile[k] || 0) + qty;
    }
  }
  return out;
}

function available(save, cardId, key, exceptDeck) {
  const k = vkey(key);
  const res = reservedCounts(save, exceptDeck);
  return ownedOf(save, cardId, k) - ((res[cardId] || {})[k] || 0);
}

// The 4-copy rule is BY NAME and ignores variants entirely — four Rattata is
// four Rattata whether or not one of them is Shiny. Counting per vkey here
// would silently allow a 16-Rattata deck.
function copiesByNameIn(db, list) {
  const out = {};
  for (const [qty, id] of list) {
    const c = db[id];
    if (!c) continue;
    out[c.name] = (out[c.name] || 0) + qty;
  }
  return out;
}

// ------------------------------------------------------------------ dex ----
// Denominators come from `db`, never from a constant. A dex that hardcodes 102
// starts lying the moment tools/gen_cards.js is run with --sets.
function collectionStats(save, db) {
  const ids = Object.keys(db);
  let ownedCards = 0, totalCards = 0;
  const speciesAll = {}, speciesOwned = {};
  const bySet = {};
  for (const id of ids) {
    const c = db[id];
    totalCards++;
    const set = (bySet[c.set] = bySet[c.set] || { owned: 0, total: 0 });
    set.total++;
    const have = isOwned(save, id);
    if (have) { ownedCards++; set.owned++; }
    if (c.dex) {
      speciesAll[c.dex] = 1;
      if (have) speciesOwned[c.dex] = 1;
    }
  }
  return {
    cards: { owned: ownedCards, total: totalCards },
    species: { owned: Object.keys(speciesOwned).length, total: Object.keys(speciesAll).length },
    bySet,
  };
}

// ------------------------------------------------------------ migration ----
// One entry per version step: MIGRATIONS[n] upgrades a v(n) save to v(n+1).
// Empty today because v1 is the first format — the machinery exists so that
// Job 6 widening the pool, or Job 7 adding progression, is an added function
// rather than a save wipe. tools/collectiontest.js exercises it with a fake
// step, so it is tested rather than merely present.
const MIGRATIONS = {};

function migrate(raw) {
  let s = raw;
  let guard = 0;
  while ((s.v || 0) < SAVE_VERSION) {
    const step = MIGRATIONS[s.v || 0];
    if (!step) throw new Error(`no migration from save version ${s.v} to ${SAVE_VERSION}`);
    s = step(s);
    if (++guard > 64) throw new Error('migration did not converge');
  }
  if (s.v > SAVE_VERSION) throw new Error(`save is from a newer version (${s.v} > ${SAVE_VERSION})`);
  return ensureShape(s);
}

// Structural check only. Deliberately does NOT verify that every card id exists
// in CARD_DB: a save made after Job 6 must still load when someone runs a build
// generated for Base Set alone, showing what it can rather than refusing.
function validate(s) {
  if (!s || typeof s !== 'object') throw new Error('save is not an object');
  if (typeof s.v !== 'number') throw new Error('save has no version');
  if (!s.owned || typeof s.owned !== 'object') throw new Error('save has no owned map');
  if (!Array.isArray(s.decks)) throw new Error('save has no deck list');
  for (const id in s.owned) {
    const pile = s.owned[id];
    if (!pile || typeof pile !== 'object') throw new Error(`owned["${id}"] is not a pile`);
    for (const k in pile) {
      if (typeof pile[k] !== 'number' || pile[k] < 0 || !isFinite(pile[k]))
        throw new Error(`owned["${id}"]["${k}"] is not a count`);
    }
  }
  for (const d of s.decks) {
    if (!d || typeof d.name !== 'string' || !Array.isArray(d.list))
      throw new Error('a saved deck is malformed');
  }
  return s;
}

// ---------------------------------------------------------- persistence ----
// Guarded so the module can be required in Node, where there is no
// localStorage. Every storage path returns a result rather than throwing, and
// nothing here is called at load time.
function storage() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) return null;
    return localStorage;
  } catch (e) { return null; }        // Firefox throws outright when cookies are off
}

// Returns { save, status } where status is one of:
//   'ok'      loaded and migrated
//   'empty'   nothing stored yet — save is null
//   'nostore' localStorage unavailable — save is null, and the caller should
//             say so rather than silently running a session that won't persist
//   'corrupt' something was there and could not be read. The raw text is moved
//             to a backup key first: a save that cannot be parsed today might
//             be recoverable by hand, and overwriting it is unrecoverable.
function loadSave() {
  const ls = storage();
  if (!ls) return { save: null, status: 'nostore' };
  let text;
  try { text = ls.getItem(SAVE_KEY); } catch (e) { return { save: null, status: 'nostore' }; }
  if (!text) return { save: null, status: 'empty' };
  try {
    return { save: validate(migrate(JSON.parse(text))), status: 'ok' };
  } catch (e) {
    try { ls.setItem(SAVE_BACKUP_KEY, text); } catch (e2) { /* nothing more we can do */ }
    return { save: null, status: 'corrupt', error: String(e && e.message || e) };
  }
}

// Returns { ok, error }. Quota is the realistic failure: a full collection is
// small, but a browser at its limit will throw and the caller must be able to
// tell the player their progress is not being written down.
function writeSave(save) {
  const ls = storage();
  if (!ls) return { ok: false, error: 'no local storage available' };
  try {
    ls.setItem(SAVE_KEY, JSON.stringify(save));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

// ------------------------------------------------------- export / import ---
// There is no server and no remote, so a cleared browser profile is the only
// thing standing between the player and their whole collection. Export is the
// backup; import is the restore, and it validates and migrates exactly the way
// a load does, so an old exported file still works after a format change.
function exportSave(save) {
  return JSON.stringify({ game: 'shadowless', exported: Date.now(), save }, null, 2);
}

function importSave(text) {
  let blob;
  try { blob = JSON.parse(text); } catch (e) { throw new Error('that is not valid JSON'); }
  const raw = (blob && blob.save) ? blob.save : blob;   // accept a bare save too
  return validate(migrate(raw));
}

// ONE LINE, deliberately. tools/build.js strips this with a line-anchored
// regex, so a multi-line export leaves its own body behind in the bundle and
// breaks the built HTML. The builder now refuses that rather than emitting it.
if (typeof module !== 'undefined') module.exports = { SAVE_VERSION, SAVE_KEY, SAVE_BACKUP_KEY, PLAIN, VARIANTS, VARIANT_ORDER, VARIANT_BY_KEY, vkey, vflags, isPlain, vscore, vlabel, newSave, ensureShape, grant, grantDeck, ownedOf, ownedTotal, isOwned, bestVariant, pilesOf, packsHeld, packsTotal, addPacks, takePack, deckIsBuilt, builtDecks, nextDeckId, findDeck, canUnbuild, deckShortfall, reservedCounts, available, copiesByNameIn, collectionStats, MIGRATIONS, migrate, validate, loadSave, writeSave, exportSave, importSave };

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
    starter: opts.starter || '',
    stats: { wins: 0, losses: 0, packsOpened: 0, cardsPulled: 0 },
  };
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

// ---------------------------------------------------------- reservation ----
// DERIVED, never stored. "How many plain Rattata are free" is owned minus the
// sum across every saved deck, recomputed on demand. Storing it would mean two
// numbers that can disagree, and they always eventually do.
//
// This also means the reserve-or-not design question is not load-bearing: if
// decks turn out not to reserve, nothing calls available() and no stored field
// is left behind.
function reservedCounts(save, exceptDeckName) {
  const out = {};
  for (const d of save.decks) {
    if (exceptDeckName !== undefined && d.name === exceptDeckName) continue;
    for (const entry of d.list) {
      const [qty, id] = entry;
      const k = vkey(entry[2]);
      const pile = out[id] || (out[id] = {});
      pile[k] = (pile[k] || 0) + qty;
    }
  }
  return out;
}

function available(save, cardId, key, exceptDeckName) {
  const k = vkey(key);
  const res = reservedCounts(save, exceptDeckName);
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
  return s;
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
if (typeof module !== 'undefined') module.exports = { SAVE_VERSION, SAVE_KEY, SAVE_BACKUP_KEY, PLAIN, VARIANTS, VARIANT_ORDER, VARIANT_BY_KEY, vkey, vflags, isPlain, vscore, vlabel, newSave, grant, grantDeck, ownedOf, ownedTotal, isOwned, bestVariant, pilesOf, reservedCounts, available, copiesByNameIn, collectionStats, MIGRATIONS, migrate, validate, loadSave, writeSave, exportSave, importSave };

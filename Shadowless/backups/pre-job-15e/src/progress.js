// ============================================================================
// PROGRESSION — the opponent ladder, and what beating one is worth.
//
// Job 7a. Pure data, in the same shape as collection.js: no DOM, no engine, no
// CARD_DB import. Anything needing the card database takes a `db` argument, and
// anything needing a deck takes a resolver. That is what lets
// tools/progresstest.js drive the whole module with no browser. Keep it.
//
// THE LADDER IS DERIVED, NOT DECLARED. data/ladder.json holds one BRACKET per
// set and no bracket names its position or what it unlocks. buildLadder() walks
// the live sets in order and, for each, uses the authored bracket if there is
// one and synthesises a generated bracket if there is not. So:
//
//   * a set going live adds a bracket with no code change and no data change
//   * authoring real opponents later is an override, not a prerequisite
//   * a bracket for a set that is NOT live never appears
//
// That is the whole reason this file exists rather than a LADDER constant.
// Trevor's ask, 12 Aug 2026: brackets, not defined sets, because we will not
// have authored decks for most of the fourteen sets for a long time.
//
// UNLOCK IS DERIVED TOO. There is no `unlocked` list in the save. A bracket is
// open if it is the first or if the previous bracket's boss has been beaten,
// computed fresh every time from `save.progress.beaten`. A stored list would be
// a second source of truth that can drift from the one the player can see.
// ============================================================================

const PROGRESS_DEFAULTS = {
  // DISTINCT roster opponents beaten before the boss appears. The number is a
  // floor as well as a gate — see the backfill below.
  //
  // 'all' MEANS EVERY ROSTER OPPONENT, resolved against the roster's real length
  // after backfill rather than written as a number. Job 15a, and Trevor wants it
  // eventually to be the default everywhere: "make the boss battle completely
  // earned at every tier". It is per bracket for now and `challenge1` is the only
  // one carrying it, because flipping the DEFAULT re-gates four shipped brackets
  // in a live save and that is its own decision rather than a side effect of this
  // one. When that decision comes, it is this line and nothing else.
  bossAfter: 5,
  packsPerWin: 2,         // PACKS.md's yardstick, unchanged
  bossFirstWinBonus: 1,   // an extra pack the FIRST time you beat a boss, and only a boss
  ai: 'expert',
};

// A generated bracket needs enough opponents for its boss to be reachable at
// all, so it is never shorter than bossAfter. Authored brackets are backfilled
// to the same floor if a deck reference goes missing under a narrow --sets.
//
// 'all' BACKFILLS TO NOTHING, deliberately. "Everyone" is a shape rather than a
// count, so there is no floor to pad to — and padding one would be actively
// wrong, since a generated challenger would then be standing between the player
// and a boss on a bracket whose whole point is that you cleared the real roster.
const GENERATED_SUFFIX = ['Challenger', 'Challenger', 'Challenger', 'Challenger',
                          'Challenger', 'Challenger', 'Challenger', 'Challenger'];

// Stable per-opponent seed, so "Wren" brings the same generated deck in every
// session rather than a fresh one each match. Same mixer as art.js's hash32.
function opponentSeed(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}

// ---------------------------------------------------------------- the ladder

function normaliseOpponent(raw, bracketSet, cfg, index) {
  return {
    id: raw.id,
    name: raw.name,
    title: raw.title || '',
    deck: raw.deck || 'generate',
    ai: raw.ai || cfg.ai,
    placeholder: !!raw.placeholder,
    set: bracketSet,
    seed: opponentSeed(raw.id),
    index,
  };
}

function generatedOpponent(setCode, n, cfg) {
  return normaliseOpponent({
    id: `${setCode}-gen${n}`,
    name: `${GENERATED_SUFFIX[n % GENERATED_SUFFIX.length]} ${n + 1}`,
    title: 'Challenger',
    deck: 'generate',
    placeholder: true,
  }, setCode, cfg, n);
}

// WHICH SETS ARE LIVE. One definition, here, because there were briefly two and
// they disagreed the moment a set was generated before it was finished — which
// is the supported workflow, not an edge case.
//
// A set is live once EVERY non-Energy card in it has an effect script. That is
// CLAUDE.md's gating rule (no half-open sets, no collecting a card you cannot
// play) expressed as a derivation rather than a list, so a set goes live the
// moment its last script lands with nothing to flip by hand.
//
// GENERATED IS NOT LIVE, and conflating them is the specific mistake this exists
// to prevent. `SET_INFO` holds what this build generated; a set can sit in there
// half-written for a whole job. ui.js used to own this derivation and everything
// else re-derived it or assumed SET_INFO — progresstest assumed, and went red the
// first time the assumption was false.
//
// Pure, so the suites can call it. Order follows SET_INFO, which is generation
// order, which is release order.
//
// A NON-BOOSTER SET IS NEVER LIVE, however complete it is — Job 13, and this is a
// landmine rather than a tidy-up. `basep` and `si1` sell no boosters; they reach
// the player through the pack INTRUSION roll, which is a pack type and not a set.
// But this derivation only ever asked "is every card scripted?", and every caller
// of it — the ladder, the pack pool, the dex — reads the answer as "is this a
// set". So the day somebody finished the last promo script, `basep` would have
// promoted itself to a ladder bracket titled "Wizards Black Star Promos", with a
// generated roster, a dex section and a completion percentage, and nothing in the
// tree would have said a word. Nobody would have connected it to a card they wrote
// six months earlier.
//
// The flag lives in SET_INFO because that is where a set is DECLARED — so the
// question gets asked when someone adds the name, which is the only moment anybody
// is thinking about it. packs.js holds the same fact as `NON_BOOSTER_SETS` and
// cannot read SET_INFO (it takes a `db`); selftest.js asserts the two name the
// same sets, because two lists that must agree and cannot see each other is this
// tree's most reliable source of drift.
//
// DO NOT REACH FOR THIS FILTER WHEN THE PROMO SWITCH GETS BUILT. Making promos
// collectible is a COLLECTIBLE-sets question, and that is a wider set than this
// one; un-filtering here would buy the collection a ladder bracket it does not
// want. See PACKS.md "Still open" and CHALLENGES.md on pack-type-versus-set.
function liveSets(cardDb, effects, setInfo) {
  const gaps = {};
  for (const id in cardDb) {
    const c = cardDb[id];
    if (c.kind !== 'energy' && !effects[id]) gaps[c.set] = 1;
  }
  return Object.keys(setInfo).filter(code =>
    !gaps[code] && (setInfo[code] || {}).booster !== false);
}
// liveSets  ordered set codes that are LIVE, from liveSets() above
// data      the parsed data/ladder.json
// opts.hasDeck(ref) -> bool. Optional. A roster entry whose deck cannot be
//           resolved is DROPPED and backfilled with a generated one rather than
//           throwing, so a narrow `gen_cards.js --sets base1` still produces a
//           working ladder instead of a broken one.
// opts.setName(code) -> string. Optional. What to call a bracket NOBODY AUTHORED.
//           This fell back to the raw set code, so Team Rocket going live in Job 10
//           put a bracket titled "base5" on the screen beside three called "The
//           Clubs", "The Jungle" and "The Dome". Kept as a callback rather than an
//           import because this module is pure and SET_INFO lives in cards.js.
//
// A BRACKET NEED NOT BE A SET — Job 15a, and this is the one structural change to
// this function since Job 7. A bracket entry carrying `standalone: true` belongs
// to no set at all: it is anchored after one with `after`, guarded by `requires`,
// and it takes its own KEY as its `set`. `challenge1` is the first, and the promo
// gates were already written against that key.
//
// WHAT `bracket.set` MEANS, because four different consumers read it and they are
// asking four different questions. Today they still all take the same answer for a
// set bracket, and a Challenge is where they stop agreeing:
//
//   IDENTITY   `unlockedSets()` and PROMO_GATES want the bracket's key. Correct.
//   PAYMENT    the save keys held packs by it. Correct — a Challenge pack is a
//              pack TYPE with its own key, which is exactly what this gives it.
//   POOL       what a pack of it CONTAINS, and what a generated challenger in it
//              draws from. NOT correct for a standalone, whose key names no cards
//              at all. That question now has its own field, `packSets`.
//   LABEL      what to print. Also not correct — see ui.js's setName.
//
// So the split is `set` for identity and payment, `packSets` for content. Anything
// that reaches for `.set` to answer a question about CARDS is the bug this field
// exists to stop, and it is the same shape as the one PACKS.md records about a
// pulled card's `slot`: a field naming ORIGIN is not a field naming ROLE.
function buildLadder(liveSets, data, opts = {}) {
  const cfg = Object.assign({}, PROGRESS_DEFAULTS, (data && data.defaults) || {});
  const brackets = (data && data.brackets) || {};
  const hasDeck = opts.hasDeck || (() => true);
  const setName = opts.setName || (code => code);
  const usable = o => o.deck === 'generate' || hasDeck(o.deck);
  const live = {};
  liveSets.forEach(s => { live[s] = 1; });

  // THE ORDER, and it is still derived rather than declared. Walk the live sets;
  // after each one, drop in any standalone bracket anchored to it whose `requires`
  // are all live. A standalone whose anchor set is not live never appears, exactly
  // like a set bracket, and nothing anywhere names a position.
  const anchored = {};
  for (const key of Object.keys(brackets)) {
    const b = brackets[key];
    if (!b || !b.standalone) continue;
    (anchored[b.after] = anchored[b.after] || []).push(key);
  }
  const slots = [];
  for (const setCode of liveSets) {
    slots.push({ key: setCode, src: brackets[setCode], standalone: false });
    for (const key of (anchored[setCode] || [])) {
      const req = brackets[key].requires || [];
      if (req.every(s => live[s])) slots.push({ key, src: brackets[key], standalone: true });
    }
  }

  return slots.map((slot, i) => {
    const setCode = slot.key;
    const src = slot.src;
    const bcfg = Object.assign({}, cfg, (src && src.cfg) || {});
    const everyone = bcfg.bossAfter === 'all';

    let roster = ((src && src.roster) || [])
      .map((o, n) => normaliseOpponent(o, setCode, bcfg, n))
      .filter(usable);

    // Backfill to the floor. Covers both an unauthored set and an authored one
    // whose decks are not all present in this build. `bossAfter: 'all'` has no
    // floor — see PROGRESS_DEFAULTS.
    if (!everyone) {
      for (let n = roster.length; n < bcfg.bossAfter; n++) roster.push(generatedOpponent(setCode, n, bcfg));
    }
    roster.forEach((o, n) => { o.index = n; });
    // Resolved here, after the roster is final, so 'all' is a real number
    // everywhere downstream and no other function has to know the word exists.
    // Never below 1: a bracket with an empty roster must not hand you its boss.
    if (everyone) bcfg.bossAfter = Math.max(1, roster.length);

    let boss = src && src.boss ? normaliseOpponent(src.boss, setCode, bcfg, -1) : null;
    if (!boss || !usable(boss)) {
      boss = normaliseOpponent({ id: `${setCode}-boss`, name: 'Champion', title: 'Champion',
                                 deck: 'generate', placeholder: true }, setCode, bcfg, -1);
    }
    boss.isBoss = true;

    const extra = ((src && src.extra) || [])
      .map((o, n) => normaliseOpponent(o, setCode, bcfg, n))
      .filter(usable);
    extra.forEach(o => { o.isExtra = true; });

    return {
      set: setCode,
      index: i,
      standalone: !!slot.standalone,
      // WHICH REAL SETS THIS BRACKET IS MADE OF. A set bracket is its own set. A
      // standalone is every booster set BEFORE it on the ladder, which is where
      // Trevor's "the C1 pack already knows it holds base1-3" lands: derived from
      // ladder position, so it is fixed the moment the bracket exists and cannot
      // drift with the save. A pack sitting in your inventory does not change its
      // contents because you went and beat somebody.
      packSets: slot.standalone
        ? slots.slice(0, i).filter(s => !s.standalone).map(s => s.key)
        : [setCode],
      name: (src && src.name) || setName(setCode),
      blurb: (src && src.blurb) || '',
      generated: !src,
      cfg: bcfg,
      roster, boss, extra,
    };
  });
}

const allOpponents = bracket => bracket.roster.concat([bracket.boss], bracket.extra);
const findOpponent = (ladder, id) => {
  for (const b of ladder) for (const o of allOpponents(b)) if (o.id === id) return o;
  return null;
};
const bracketOf = (ladder, id) => ladder.find(b => allOpponents(b).some(o => o.id === id)) || null;

// ------------------------------------------------------------- save reading

// Distinct from a win COUNT on purpose: the boss gate is "five different
// opponents have each lost at least once", not "five wins".
const timesBeaten = (save, id) => ((save.progress && save.progress.beaten) || {})[id] || 0;
const hasBeaten = (save, id) => timesBeaten(save, id) > 0;
const rosterCleared = (save, bracket) => bracket.roster.filter(o => hasBeaten(save, o.id)).length;

function bossAvailable(save, bracket) {
  return rosterCleared(save, bracket) >= bracket.cfg.bossAfter;
}

const bracketCleared = (save, bracket) => hasBeaten(save, bracket.boss.id);

// The first bracket is always open; every other one waits on the previous
// bracket's boss. Derived, never stored — see the header.
function bracketOpen(save, ladder, index) {
  if (index <= 0) return true;
  return bracketCleared(save, ladder[index - 1]);
}

function unlockedSets(save, ladder) {
  return ladder.filter((b, i) => bracketOpen(save, ladder, i)).map(b => b.set);
}


// ------------------------------------------------------- the promo gates ---
// WHICH PROMOS THE PLAYER HAS REACHED. Job 13b, and the second half of Job 13:
// the cards landed in Job 13a and nothing could hand them out.
//
// A PROMO IS GATED PER CARD, NOT PER SET, and that is the whole reason this
// table exists rather than a `basep` entry in the ladder. Promos were printed
// across four years of magazines, tins, movie tickets and league seasons, so
// "the promo set" is not an era the player passes through — it is a drip that
// runs alongside every era. Trevor authored the drip in the `Gated Until` column
// of the workbook's Index tab, one row per card, and this is that column.
//
// THE VALUE IS A BRACKET KEY, matched against `unlockedSets()`. Today that is a
// live set's code; when a Challenge bracket exists it will be that bracket's own
// key. Trevor's call, 27 Aug 2026: the gate is the bracket being OPEN, not
// CLEARED — so the four `base1` promos are reachable from the first pack. He is
// reconsidering the gate ORDER against a cleared-based reading, which would be a
// change to the values here and to nothing else.
//
// FOUR KEYS RESOLVE TODAY AND FOUR DO NOT, AND THAT IS THE DESIGN. `challenge1`,
// `challenge2`, `gym1` and `gym2` name brackets that do not exist, so eleven of
// the twenty-eight are permanently locked — and they FAIL CLOSED, which is the
// safe direction: an unmatched key locks a card rather than leaking one. The
// condition that turns each on is exactly one thing, with no code change here: a
// ladder bracket whose `set` equals the key. `gym1`/`gym2` get theirs for free
// the day those sets go live; the Challenge keys need CHALLENGES.md's bracket,
// which "belongs to NO SET" and so must pick this key deliberately.
//
// TWENTY-EIGHT OF FIFTY-THREE, and the other twenty-five are absent rather than
// ungated. A promo with no row here can never be pulled, which is what keeps
// CLAUDE.md's "no collecting a card you cannot play" true for a set that is
// deliberately half-scripted — the callers also test playability, so this table
// and the effects file have to agree twice before a card reaches a pack.
//
// GENERATED FROM THE WORKBOOK, NOT TYPED. tools/packtest.js re-reads the Index
// tab and asserts this table still matches it, because a hand-copied table and
// its source are two lists that must agree and cannot see each other — this
// tree's most reliable source of drift. If that check goes red, Trevor moved a
// gate: regenerate, do not edit one line.
const PROMO_GATES = {
  'basep-1':  'base1',       // Pikachu GP
  'basep-2':  'base1',       // Electabuzz MS
  'basep-3':  'base1',       // Mewtwo MS
  'basep-4':  'base2',       // Pikachu MS
  'basep-5':  'base2',       // Dragonite MS
  'basep-6':  'base2',       // Arcanine GP
  'basep-7':  'base3',       // Jigglypuff GP
  'basep-8':  'base1',       // Mew GP
  'basep-9':  'base2',       // Mew GP CH
  'basep-10': 'base3',       // Meowth CH
  'basep-11': 'base3',       // Eevee CH
  'basep-12': 'base2',       // Mewtwo GP
  'basep-13': 'challenge1',  // Venusaur CH
  'basep-14': 'base3',       // Mewtwo GP 2
  'basep-15': 'challenge1',  // Cool Porygon
  'basep-16': 'base5',       // Computer Error
  'basep-17': 'base5',       // Dark Persian CH
  'basep-18': 'gym2',        // Team Rocket's Meowth
  'basep-19': 'gym1',        // Sabrina's Abra
  'basep-20': 'base5',       // Psyduck GP
  'basep-21': 'challenge2',  // Moltres GP
  'basep-22': 'challenge2',  // Articuno GP
  'basep-23': 'challenge2',  // Zapdos GP
  'basep-24': 'gym1',        // _____'s Pikachu
  'basep-25': 'challenge1',  // Flying Pikachu
  'basep-26': 'base3',       // Pikachu GP 2
  'basep-27': 'gym2',        // Pikachu GP 3
  'basep-28': 'challenge1',  // Surfing Pikachu
};

// The promos this save has reached, sorted so a seeded pull is reproducible.
//
// `isPlayable(id)` is the caller's own eligibility test and is the second of the
// two agreements described above. The game passes "does this card have an effect
// script", which is the same question `liveSets()` asks of a whole set — asked
// per card here because a promo arrives per card. Omitting it returns everything
// the ladder has opened, which is what a suite wants and what the game must not
// use: basep is deliberately half-scripted and will be for a long time.
// SORTED BY GATE, THEN BY NUMBER, and the order is load-bearing twice over.
//
// It is what the collection screen shows, so the promos you can chase RIGHT NOW
// sit at the front of the group and the ones from later brackets trail behind
// them — Trevor's ask, 28 Aug 2026. A plain `.sort()` gave lexicographic id
// order, which put basep-12 between basep-1 and basep-2 and told the player
// nothing.
//
// It is also the array a pack indexes into, and gate order happens to be the
// STABLER of the two for that. Unlocking a bracket appends its promos to the
// end, so every index that already existed keeps meaning the same card;
// lexicographic order inserted new ids into the middle and silently repointed
// every seed after them. Neither is wrong, but only one of them lets a seed keep
// its meaning across a boss fight.
function unlockedPromos(save, ladder, isPlayable) {
  const open = {};
  const rank = {};
  unlockedSets(save, ladder).forEach(s => { open[s] = 1; });
  ladder.forEach((b, i) => { rank[b.set] = i; });
  const num = id => parseInt(id.split('-')[1], 10) || 0;
  return Object.keys(PROMO_GATES)
    .filter(id => open[PROMO_GATES[id]] && (!isPlayable || isPlayable(id)))
    .sort((a, b) => (rank[PROMO_GATES[a]] - rank[PROMO_GATES[b]]) || (num(a) - num(b)));
}

// Everything you are allowed to play right now, bracket by bracket. An opponent
// stays fightable forever once it is open — that is what makes the ~79 wins a
// set takes reachable at all, and it is why nothing here consumes anything.
function availableOpponents(save, ladder) {
  const out = [];
  ladder.forEach((b, i) => {
    if (!bracketOpen(save, ladder, i)) return;
    b.roster.forEach(o => out.push(o));
    if (bossAvailable(save, b)) out.push(b.boss);
    if (bracketCleared(save, b)) b.extra.forEach(o => out.push(o));
  });
  return out;
}

const canFight = (save, ladder, id) => availableOpponents(save, ladder).some(o => o.id === id);

// ------------------------------------------------------------------ rewards

// What a win pays, WITHOUT touching the save. Split from recordWin so the UI
// can show the number before the match and the tests can assert it without
// mutating anything.
function winReward(save, ladder, id) {
  const opp = findOpponent(ladder, id);
  if (!opp) return null;
  const bracket = bracketOf(ladder, id);
  const first = !hasBeaten(save, id);
  const bonus = (opp.isBoss && first) ? bracket.cfg.bossFirstWinBonus : 0;
  return {
    set: bracket.set,
    packs: bracket.cfg.packsPerWin + bonus,
    bonus,
    firstWin: first,
    // Beating a boss for the first time is the only thing that opens a bracket.
    unlocks: (opp.isBoss && first && ladder[bracket.index + 1])
      ? ladder[bracket.index + 1].set : null,
  };
}

// Records the win and returns what it was worth. Does NOT grant the packs —
// collection.js owns the save's card and pack data and this module does not
// reach into it. The caller does `addPacks(save, r.set, r.packs)`, which keeps
// the one place packs are created the one place packs are created.
function recordWin(save, ladder, id) {
  const r = winReward(save, ladder, id);
  if (!r) return null;
  if (!save.progress) save.progress = { beaten: {} };
  if (!save.progress.beaten) save.progress.beaten = {};
  save.progress.beaten[id] = (save.progress.beaten[id] || 0) + 1;
  return r;
}

function recordLoss(save, id) {
  if (!save.progress) save.progress = { beaten: {} };
  if (!save.progress.lost) save.progress.lost = {};
  save.progress.lost[id] = (save.progress.lost[id] || 0) + 1;
}

// ------------------------------------------------------------- deck lookup

// Turns a roster entry's `deck` reference into a deck definition. The three
// authored sources are pure lookups; 'generate' needs deckgen and a pool, which
// is why the caller supplies them rather than this module importing either.
//
//   sources: { theme: {name->deck}, gbc: {key->deck}, jungle: {name->deck} }
//   opts.generate(poolSets, seed, opponent) -> deck definition
function resolveOpponentDeck(opp, sources, opts = {}) {
  if (!opp) return null;
  if (opp.deck === 'generate') {
    if (!opts.generate) return null;
    // A generated opponent draws from every set up to and including its own,
    // so a late bracket's challengers get the deeper pool automatically.
    return opts.generate(opts.poolSets || [opp.set], opp.seed, opp);
  }
  const cut = opp.deck.indexOf(':');
  if (cut < 0) return null;
  const kind = opp.deck.slice(0, cut), key = opp.deck.slice(cut + 1);
  const table = sources && sources[kind];
  return (table && table[key]) || null;
}

// The pool a generated opponent in this bracket should draw from: every live
// set up to and including its own.
//
// STANDALONE BRACKETS ARE SKIPPED because their `set` is a bracket key and names
// no cards — `challenge1` in a pool spec would silently contribute nothing, which
// is the harmless half of the same confusion `packSets` exists to stop. A
// generated challenger inside a Challenge still gets everything before it, since
// those entries are the real sets.
const poolSetsFor = (ladder, bracket) =>
  ladder.slice(0, bracket.index + 1).filter(b => !b.standalone).map(b => b.set);

// ---------------------------------------------------------------- reporting

function progressStats(save, ladder) {
  let beaten = 0, total = 0, bosses = 0, bossTotal = 0;
  for (const b of ladder) {
    for (const o of b.roster) { total++; if (hasBeaten(save, o.id)) beaten++; }
    bossTotal++; if (bracketCleared(save, b)) bosses++;
  }
  return { beaten, total, bosses, bossTotal, sets: unlockedSets(save, ladder) };
}

if (typeof module !== 'undefined') module.exports = { PROGRESS_DEFAULTS, liveSets, opponentSeed, buildLadder, allOpponents, findOpponent, bracketOf, timesBeaten, hasBeaten, rosterCleared, bossAvailable, bracketCleared, bracketOpen, unlockedSets, PROMO_GATES, unlockedPromos, availableOpponents, canFight, winReward, recordWin, recordLoss, resolveOpponentDeck, poolSetsFor, progressStats };

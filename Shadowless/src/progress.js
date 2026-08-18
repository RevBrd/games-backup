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
  bossAfter: 5,           // distinct roster opponents beaten before the boss appears
  packsPerWin: 2,         // PACKS.md's yardstick, unchanged
  bossFirstWinBonus: 1,   // an extra pack the FIRST time you beat a boss, and only a boss
  ai: 'expert',
};

// A generated bracket needs enough opponents for its boss to be reachable at
// all, so it is never shorter than bossAfter. Authored brackets are backfilled
// to the same floor if a deck reference goes missing under a narrow --sets.
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
function liveSets(cardDb, effects, setInfo) {
  const gaps = {};
  for (const id in cardDb) {
    const c = cardDb[id];
    if (c.kind !== 'energy' && !effects[id]) gaps[c.set] = 1;
  }
  return Object.keys(setInfo).filter(code => !gaps[code]);
}
// liveSets  ordered set codes that are LIVE, from liveSets() above
// data      the parsed data/ladder.json
// opts.hasDeck(ref) -> bool. Optional. A roster entry whose deck cannot be
//           resolved is DROPPED and backfilled with a generated one rather than
//           throwing, so a narrow `gen_cards.js --sets base1` still produces a
//           working ladder instead of a broken one.
function buildLadder(liveSets, data, opts = {}) {
  const cfg = Object.assign({}, PROGRESS_DEFAULTS, (data && data.defaults) || {});
  const brackets = (data && data.brackets) || {};
  const hasDeck = opts.hasDeck || (() => true);
  const usable = o => o.deck === 'generate' || hasDeck(o.deck);

  return liveSets.map((setCode, i) => {
    const src = brackets[setCode];
    const bcfg = Object.assign({}, cfg, (src && src.cfg) || {});

    let roster = ((src && src.roster) || [])
      .map((o, n) => normaliseOpponent(o, setCode, bcfg, n))
      .filter(usable);

    // Backfill to the floor. Covers both an unauthored set and an authored one
    // whose decks are not all present in this build.
    for (let n = roster.length; n < bcfg.bossAfter; n++) roster.push(generatedOpponent(setCode, n, bcfg));
    roster.forEach((o, n) => { o.index = n; });

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
      name: (src && src.name) || setCode,
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
const poolSetsFor = (ladder, bracket) =>
  ladder.slice(0, bracket.index + 1).map(b => b.set);

// ---------------------------------------------------------------- reporting

function progressStats(save, ladder) {
  let beaten = 0, total = 0, bosses = 0, bossTotal = 0;
  for (const b of ladder) {
    for (const o of b.roster) { total++; if (hasBeaten(save, o.id)) beaten++; }
    bossTotal++; if (bracketCleared(save, b)) bosses++;
  }
  return { beaten, total, bosses, bossTotal, sets: unlockedSets(save, ladder) };
}

if (typeof module !== 'undefined') module.exports = { PROGRESS_DEFAULTS, liveSets, opponentSeed, buildLadder, allOpponents, findOpponent, bracketOf, timesBeaten, hasBeaten, rosterCleared, bossAvailable, bracketCleared, bracketOpen, unlockedSets, availableOpponents, canFight, winReward, recordWin, recordLoss, resolveOpponentDeck, poolSetsFor, progressStats };

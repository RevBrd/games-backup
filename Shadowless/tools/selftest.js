// Statistical self-test for the Shadowless rules engine and AI.
//
//   node tools/selftest.js            quick pass  (~100 games)
//   node tools/selftest.js 40         deeper pass (40 seeds per matchup)
//
// This drives the SOURCE modules directly — they are DOM-free and export
// cleanly, so no browser and no DOM stubs are involved. Its companion,
// tools/smoke.js, tests the BUILT artifact including the UI layer. Run both:
// this one catches rules and AI regressions, that one catches build and UI
// regressions, and neither subsumes the other.

const { CARD_DB, DECKS } = require('../src/cards.js');
const { EFFECTS } = require('../src/effects.js');
const { Engine } = require('../src/engine.js');
const { owedBy } = require('./lib/owed.js');
require('../src/ai.js');
require('../src/deckgen.js');

// --- play one game to completion, both seats driven by the AI -------------
function playGame(deckA, deckB, seed, modeA = 'expert', modeB = 'expert') {
  const E = new Engine(CARD_DB, EFFECTS, { seed });
  E.newGame(DECKS[deckA], DECKS[deckB], ['A', 'B']);
  E.setupAuto(0); E.setupConfirm(0);
  E.setupAuto(1); E.setupConfirm(1);
  let acts = 0;
  // NOTE: winner can legitimately be 0, so test against null — never truthiness.
  while (E.state.winner === null && acts++ < 8000) {
    // Three things can owe an action: a Whirlwind switch, a forced promotion, or
    // just whoever's turn it is. The theme decks contain no Whirlwind today, but
    // relying on that would make this loop quietly wrong the moment they do.
    const st = E.state;
    // owedBy: all four owed choices, one definition. This read only
    // pendingSwitch and pendingPromote, so an unhandled pendingAsk aborted
    // ~1.3% of ladder games early. See tools/lib/owed.js. Job 15d.
    const p = owedBy(st);
    const action = E.aiChoose(p, p === 0 ? modeA : modeB);
    if (!action) return { stalled: true, turn: E.state.turn, acts, E };
    E.act(p, action);
  }
  return { winner: E.state.winner, turn: E.state.turn, acts, reason: E.state.winReason, E };
}

const N = parseInt(process.argv[2], 10) || 12;
const DECK_NAMES = Object.keys(DECKS);
let fail = 0;
const check = (ok, label, detail = '') => {
  if (!ok) fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
};

console.log(`\nShadowless self-test  (${N} seeds per matchup)\n`);

// --- 1. every deck is legal and fully implemented ------------------------
console.log('Deck validation');
for (const name of DECK_NAMES) {
  const r = new Engine(CARD_DB, EFFECTS, { seed: 1 }).validateDeck(DECKS[name]);
  check(r.ok, `${name} (${r.total} cards, ${r.basics} basics)`, r.errors.join('; '));
}

// --- 2. card coverage ----------------------------------------------------
// Job 6 replaced a pinned list of ids with two claims, because a set arriving
// 64 cards at a time makes the list the thing you maintain instead of the code.
//
// The HARD one is CLAUDE.md's gating rule stated as an assertion: a set is live
// only when every card in it is playable, so no live set may contain a gap.
// That is what makes "Base Set is complete" a checked fact rather than a note,
// and it cannot regress no matter how many half-finished sets sit beside it.
//
// The SOFT one is a high-water mark per set still being written. One number,
// which only ever moves down. It catches a script being deleted or an id being
// misspelled, without anybody hand-editing a list of 126 ids as they go.
// Add a set here the moment you generate one, and take it out again when its
// last script lands. A set listed here is EXEMPT from the hard assertion above,
// which is the whole point — it is how a set sits in CARD_DB half-written
// without the suite going red, and it is why `gen_cards.js --sets` can be run
// at the START of a set job rather than the end.
//
// THE NUMBER MUST ONLY EVER GO DOWN. It is not documentation, it is a ratchet:
// lower it as scripts land, and if a run reports MORE unimplemented cards than
// the number here, something was deleted or an id was misspelled. That failure
// is otherwise completely silent, because an unscripted card simply cannot be
// put in a deck and nothing else complains.
// EMPTY, and Team Rocket is why it is empty rather than why it is here.
//
// base5 went live 19 Aug 2026 at 83 of 83 printings, which is what removing its
// entry MEANS: the hard gate above — no live set contains an unimplemented card
// — now covers it, and any future card added to base5 without a script fails a
// suite instead of sitting quietly in a pack.
//
// Put a set back in here the moment work starts on it, with the count it starts
// at. The ratchet only ever goes down.
const REMAINING = {
  // Job 13 opened basep on 26 Aug 2026 at all 53 unscripted. The job scope is
  // basep-1..28, so this number is expected to land at 25 and STOP there — the
  // remaining 25 are Neo-era promos nobody has written logic for. A 25 that never
  // moves again is the correct resting state for this entry, not an unfinished one.
  basep: 25,
};

console.log('\nCard coverage');
// ENERGY IS COUNTED, and it used to be filtered out of this line entirely.
// That was a hole exactly the shape of the rule above, and Team Rocket is the
// first set that would have fallen through it: base5 prints three SPECIAL
// Energy, and a special Energy needs a script like anything else. With energy
// excluded, both the hard gate and the ratchet below were blind to them — so
// deleting REMAINING.base5 at the end of the job would have gone green with
// Rainbow Energy unplayable, and the player would collect a card no deck can
// legally contain. Basic Energy passes on its own merits: it carries a script
// that does nothing rather than no script at all, which is not the same thing.
//
// It never bit before because the three live sets hold exactly one special
// Energy between them (Double Colorless) and it was scripted on day one.
const all = Object.keys(CARD_DB);
const unscripted = all.filter(id => !EFFECTS[id]);
const bySet = {};
for (const id of unscripted) bySet[CARD_DB[id].set] = (bySet[CARD_DB[id].set] || 0) + 1;
const sets = [...new Set(all.map(id => CARD_DB[id].set))];

console.log(`  ${all.length - unscripted.length} of ${all.length} scriptable cards implemented`);
for (const s of sets) {
  const left = bySet[s] || 0;
  const total = all.filter(id => CARD_DB[id].set === s).length;
  console.log(`  ${s.padEnd(6)} ${String(total - left).padStart(3)}/${total}`
    + (left ? `   ${left} to go` : '   LIVE'));
}

const liveGaps = sets.filter(s => REMAINING[s] === undefined && bySet[s]);
check(liveGaps.length === 0, 'no live set contains an unimplemented card',
  liveGaps.map(s => `${s}: ${unscripted.filter(id => CARD_DB[id].set === s)
    .map(id => CARD_DB[id].name).join(', ')}`).join(' | '));

// TWO LISTS THAT MUST AGREE AND CANNOT SEE EACH OTHER — Job 13. `basep` and `si1`
// sell no boosters, and that fact is written down twice: as `booster: false` in
// SET_INFO (read by progress.js's liveSets, which is pure and takes setInfo) and
// as NON_BOOSTER_SETS in packs.js (which is pure and takes a `db`). Neither module
// can import the other without giving up the purity that lets these suites run
// with no browser, so the agreement is asserted here instead.
//
// What it protects: a non-booster set that loses its flag becomes a ladder bracket
// with a generated roster and a dex section the moment its last script lands, and
// the person who wrote that script months earlier would never connect the two.
// The other direction is quieter and worse — a flagged set missing from
// NON_BOOSTER_SETS would have its cards drawn into an ordinary pack pool.
{
  const { SET_INFO } = require('../src/cards.js');
  const { NON_BOOSTER_SETS } = require('../src/packs.js');
  const flagged = Object.keys(SET_INFO).filter(s => SET_INFO[s].booster === false);
  const listed = Object.keys(NON_BOOSTER_SETS).filter(s => SET_INFO[s]);
  const missingFlag = listed.filter(s => SET_INFO[s].booster !== false);
  const missingList = flagged.filter(s => !NON_BOOSTER_SETS[s]);
  check(missingFlag.length === 0 && missingList.length === 0,
    'non-booster sets agree between SET_INFO and packs.js',
    [missingFlag.length ? `packs.js says non-booster, SET_INFO does not: ${missingFlag.join(', ')}` : '',
     missingList.length ? `SET_INFO says non-booster, packs.js does not: ${missingList.join(', ')}` : '']
      .filter(Boolean).join(' | '));
  if (flagged.length) console.log(`  non-booster (never a bracket, never a pack pool): ${flagged.join(', ')}`);
}

// The ratchet. A set under construction may have at most as many gaps as the
// last time somebody looked — never more.
{
  const slipped = Object.keys(REMAINING).filter(s => (bySet[s] || 0) > REMAINING[s]);
  check(slipped.length === 0, 'no set under construction has gone backwards',
    slipped.map(s => `${s}: ${bySet[s]} unimplemented, REMAINING says ${REMAINING[s]}`).join(' | '));
  for (const s of Object.keys(REMAINING)) {
    if ((bySet[s] || 0) < REMAINING[s])
      console.log(`  ${s}: ${bySet[s] || 0} left — REMAINING says ${REMAINING[s]}, lower it`);
  }
}

// Card art is a DERIVED, gitignored asset fetched per set. Nothing else in the
// project can see it: the suites never touch the filesystem and smoke.js has no
// layout engine, so a set going live without its scans would show the player a
// grid of broken images with every test green. A warning rather than a failure,
// because a fresh clone legitimately has none of it.
{
  const fs = require('fs'), path = require('path');
  const dir = s => path.join(__dirname, '..', 'assets', 'cards', s);
  const anyFetched = sets.some(s => fs.existsSync(dir(s)));
  if (anyFetched) {
    const short = [];
    for (const s of sets) {
      if (REMAINING[s] !== undefined) continue;            // not live yet, art not needed
      const want = Object.keys(CARD_DB).filter(id => CARD_DB[id].set === s).length;
      const have = fs.existsSync(dir(s)) ? fs.readdirSync(dir(s)).length : 0;
      if (have < want) short.push(`${s} (${have}/${want})`);
    }
    if (short.length) console.log('  ART MISSING for live set(s): ' + short.join(', ')
      + ' — run `node tools/fetch_art.js <set>`; nothing else can see this');
  }
}

const wentUp = Object.keys(REMAINING).filter(s => (bySet[s] || 0) > REMAINING[s]);
check(wentUp.length === 0, 'no in-progress set went backwards',
  wentUp.map(s => `${s}: ${bySet[s]} > ${REMAINING[s]}`).join(', '));

const ahead = Object.keys(REMAINING).filter(s => (bySet[s] || 0) < REMAINING[s]);
if (ahead.length) console.log('  progress since REMAINING was last set: '
  + ahead.map(s => `${s} ${REMAINING[s]} -> ${bySet[s] || 0}`).join(', ') + ' — lower it');
const finished = Object.keys(REMAINING).filter(s => !bySet[s]);
if (finished.length) console.log(`  ${finished.join(', ')} now complete `
  + '— remove from REMAINING to make the live-set assertion cover it');

// --- 2a. identical printed text means an identical script ----------------
// If two cards print the SAME rules text, they do the same thing, and their
// verb lists must match. Across 136 distinct attack texts this holds without a
// single exception, which makes it a cheap and very broad correctness net: it
// catches a card scripted by hand that drifted from the one it was copied off,
// and it catches a fix applied to one printing and not its twin.
//
// IT IS ALSO THE CHECK THAT LICENCES DERIVING ENTRIES. Team Rocket's first
// block in effects.js was not typed — twelve cards whose attacks print text
// already live had their scripts COPIED from the cards that print it. That is
// only safe while identical text really does imply an identical script, and
// this is what keeps saying so.
//
// `label` IS EXCLUDED, and it is the one field that has to be. It is the string
// the log prints, not behaviour: Sandshrew's Sand-attack and Horsea's
// Smokescreen are the same effect under two names, and four cards across three
// sets share that text with two different labels. Comparing labels would fail
// on a difference that is purely cosmetic and correct.
{
  const strip = list => JSON.stringify((list || []).map(o => {
    const { label, ...rest } = o; return rest;
  }));
  const scriptFor = id => EFFECTS[id] || EFFECTS[require('../src/effects.js').EFFECT_ALIASES[id]];
  const byText = new Map();
  for (const id in CARD_DB) {
    const c = CARD_DB[id], e = scriptFor(id);
    if (!e || !e.a) continue;
    (c.attacks || []).forEach((a, i) => {
      const t = (a.text || '').trim();
      if (!t) return;
      if (!byText.has(t)) byText.set(t, []);
      byText.get(t).push({ id, what: `${c.name} — ${a.name}`, v: strip(e.a[i]) });
    });
  }
  const clashes = [];
  for (const [t, list] of byText) {
    if (new Set(list.map(x => x.v)).size > 1)
      clashes.push(`"${t.slice(0, 50)}..." — ${list.map(x => x.what).join(' vs ')}`);
  }
  check(clashes.length === 0, 'cards printing identical text run identical scripts',
    clashes.join('; '));
  console.log(`  ${byText.size} distinct attack texts, no two scripted differently`);
}

// --- 2b. the DSL verb reference is complete ------------------------------
// effects.js opens with a verb reference that calls itself THE CONTRACT, and it
// has gone stale TWICE — during Base Set, where it cost the Job 6 planning pass
// an hour of rediscovering verbs that already existed, and again by Job 10, when
// 42 of 117 were missing. Five of those forty-two are ones Team Rocket needs on
// its first day, so the second drift was about to cost the same hour again.
//
// The failure is invisible by construction: an undocumented verb WORKS. Nothing
// breaks, no suite goes red, and the only symptom is a later session building a
// second verb that does the same thing under a different name. A warning in prose
// did not survive two sets, so it is a test now.
//
// If this goes red, WRITE THE ENTRY. Deleting the check restores exactly the
// condition it was written for.
{
  const fs = require('fs'), path = require('path');
  const effSrc = fs.readFileSync(path.join(__dirname, '../src/effects.js'), 'utf8');
  const engSrc = fs.readFileSync(path.join(__dirname, '../src/engine.js'), 'utf8');
  const effLines = effSrc.split(/\r?\n/);
  const cut = effLines.findIndex(l => l.startsWith('const EFFECTS'));
  const header = effLines.slice(0, cut).join('\n');
  const body = effLines.slice(cut).join('\n');

  // Two sources, deliberately. What the ENGINE dispatches catches a verb built
  // ahead of the cards that need it — which is the Job 6b pattern and exactly
  // the kind most likely to go unwritten. What a CARD uses catches one added
  // straight into effects.js without ever touching the reference.
  const verbs = new Set();
  for (const m of engSrc.matchAll(/case '([A-Z][A-Z_0-9]{2,})'/g)) verbs.add(m[1]);
  for (const m of engSrc.matchAll(/v\.v === '([A-Z][A-Z_0-9]{2,})'/g)) verbs.add(m[1]);
  for (const m of body.matchAll(/\bv: '([A-Z][A-Z_0-9]{2,})'/g)) verbs.add(m[1]);
  for (const m of body.matchAll(/\bkind: '([A-Z][A-Z_0-9]{2,})'/g)) verbs.add(m[1]);

  // Word-ish boundary on both sides, because a plain substring test passes DRAW
  // on the strength of T_DRAW and passed it for a week. Underscores count as
  // word characters here on purpose — that is the whole point.
  const documented = v => new RegExp('(^|[^A-Z_])' + v + '([^A-Z_]|$)', 'm').test(header);
  const missing = [...verbs].filter(v => !documented(v)).sort();

  check(missing.length === 0, 'every verb appears in the effects.js reference block',
    missing.length ? `${missing.length} undocumented: ${missing.join(', ')}` : '');
  console.log(`  ${verbs.size} verbs, all documented`);
}

// --- 2c. the alias table is justified, and complete -----------------------
// 31 of Jungle and Fossil's cards are exact mechanical duplicates of another
// card in their own set, and share one effect script rather than a copy of it.
// Proved in BOTH directions: no alias may flatten a real difference, and no
// real duplicate may be missed. Structure only — attack TEXT is excluded
// deliberately, because the corpus words Raichu's reminder line two different
// ways across its two printings and means the same rule both times.
{
  const { EFFECT_ALIASES } = require('../src/effects.js');
  const sig = c => JSON.stringify({
    n: c.name, hp: c.hp, st: c.stage, ev: c.evolvesFrom, t: c.type,
    wk: c.wkType + c.wkVal, rs: c.rsType + c.rsVal, r: c.retreat,
    a: (c.attacks || []).map(x => [x.name, x.cost, x.dmg]),
    p: c.power ? c.power.name : null,
  });

  const wrong = Object.keys(EFFECT_ALIASES).filter(dup => {
    const src = CARD_DB[EFFECT_ALIASES[dup]];
    return !CARD_DB[dup] || !src || sig(CARD_DB[dup]) !== sig(src);
  });
  check(wrong.length === 0, 'every alias points at a mechanically identical card',
    wrong.map(d => `${d} -> ${EFFECT_ALIASES[d]}`).join(', '));

  const groups = {};
  for (const id of all) (groups[sig(CARD_DB[id])] = groups[sig(CARD_DB[id])] || []).push(id);
  const missed = [];
  for (const g of Object.values(groups)) {
    if (g.length < 2) continue;
    // Same card printed twice in ONE set. Across sets is a reprint, which is a
    // separate collectible and may legitimately want its own script.
    const bySetGroup = {};
    for (const id of g) (bySetGroup[CARD_DB[id].set] = bySetGroup[CARD_DB[id].set] || []).push(id);
    for (const ids of Object.values(bySetGroup)) {
      if (ids.length < 2) continue;
      const canon = ids.slice().sort((a, b) => CARD_DB[a].num - CARD_DB[b].num)[0];
      for (const id of ids) {
        if (id === canon) continue;
        if (EFFECT_ALIASES[id] !== canon) missed.push(`${id} should alias ${canon}`);
      }
    }
  }
  check(missed.length === 0, 'every in-set duplicate is aliased rather than duplicated',
    missed.join(', '));
  console.log(`  ${Object.keys(EFFECT_ALIASES).length} duplicate printings share a script`);
}

// Whatever else is missing, the playable decks must be fully implemented.
const inDecks = new Set();
for (const d of Object.values(DECKS)) for (const [, id] of d.list) inDecks.add(id);
const brokenDeckCards = [...inDecks].filter(id => !EFFECTS[id]);   // energy included — see above
check(brokenDeckCards.length === 0, 'every card in a playable deck is implemented',
  brokenDeckCards.join(', '));

// --- 2d. AI verb coverage ------------------------------------------------
// The card check above exists because an unimplemented card must never silently
// do nothing. This is the same failure one level up: ai.js scores attacks with a
// switch over verb names, and a verb it has no case for is valued as PLAIN BASE
// DAMAGE — no throw, no red suite, and the card works perfectly for the human.
// The AI just misplays it forever. See ENGINE.md, "The silent-failure surface".
//
// Source-scanned rather than introspected, because a `switch` is not reflectable
// at runtime. Comment lines are stripped from effects.js first, or the verb
// reference in its own header would count as usage.
//
// UNSCORED_ON_PURPOSE is the whole point of this check. A verb on it is a
// decision somebody made; a verb missing from it is an oversight. Before adding
// one, be sure it genuinely cannot change what the AI should choose.
const UNSCORED_ON_PURPOSE = new Set([
  // Legality gates. The engine refuses the attack outright, so an illegal one is
  // never in the action list for the AI to score in the first place.
  'REQUIRE_DEF_STATUS',
  'REQUIRE_SELF_ENERGY',
  'REQUIRE_OPP_BENCH',
  'REQUIRE_EQUAL_ENERGY',


  // Mankey's Mischief — shuffle the opponent's deck. Unscored SCORES AS ZERO,
  // which is the honest number: this bot has no memory of deck order, so it
  // cannot be hurt by a shuffle and cannot value inflicting one. Mischief does
  // no damage, so zero also means the bot will pick literally any real attack
  // over it, which is correct play.
  //
  // WHAT WOULD MAKE THIS WRONG, written down so it can be revisited rather than
  // rediscovered: the card is genuinely strong against an opponent who has just
  // stacked their own deck with Prophecy or looked at it with Peek. The day
  // anything in ai.js tracks known deck order, this stops being worthless and
  // comes off this list. See the Peek ruling — deliberately worthless is not the
  // same claim as deliberately unscored, and this is the declaration.
  'SHUFFLE_OPP_DECK',
]);

// PROVISIONAL — scored, but on a first guess rather than on a measurement.
//
// There used to be exactly two states a verb could be in: scored, or opted out
// with a written reason. That is a real gap, because a set job adding eighty
// cards must give every one of them a weight, and a weight nobody has measured
// is INDISTINGUISHABLE from a considered one the moment the session ends. The
// next AI pass then has to re-derive which of the hundred-odd verbs were
// reasoned about and which were guessed, which nobody will do.
//
// So: put a verb here when you ship a plausible weight you have not verified.
// It costs nothing at runtime and it is not a failure — it is a WORKLIST. The
// declaration is the whole value, exactly as it is for the list above.
//
// Take a verb OFF this list when you have measured it — `aiduel.js`, `abtest.js`
// or `decksim.js`, and read MEASUREMENT.md first, because all three have lied.
// Removing it is the only thing that marks the work as done.
//
// Trevor's ask, 18 Aug 2026, and #18 had already been doing this informally on
// the Team Rocket run without a place to write it down.
const PROVISIONAL = new Set([
  // Job 10c, the five triggered-Power verbs. Every weight behind these is a
  // first guess priced off an existing weight — benching, drawing, sniping —
  // rather than off a measurement. The two that most want measuring are
  // P_SEARCH_BENCH, where "which two Basics" is decided by a crude rank nobody
  // has checked, and P_RETREAT_TOLL, where the bot is being told to fear a coin
  // it has never actually been beaten by.
  'P_SEARCH_BENCH', 'P_FROM_DISCARD', 'P_SNIPE',
  // These two are on the list for the opposite reason: their weight is ZERO and
  // that is also a guess. Nothing prices what it costs to attack into a Final
  // Beam, and P_RETREAT_TOLL is priced only in the retreat decision.
  'P_REVENGE', 'P_RETREAT_TOLL',
  // The Power kinds themselves, so the worklist reads as the job it is rather
  // than as five loose verbs.
  'ON_PLAY', 'ON_KO', 'ON_OPP_RETREAT',
  // Job 10c widened — the ordinary Powers. Four interactive kinds and one attack
  // verb, none of them measured. SEARCH_EVOLUTION_TO_HAND's "does it fit the
  // board" bonus and STATUS_COIN_EITHER_POWER's whole asymmetry argument are the
  // two most likely to be wrong: the first is a round number, and the second
  // claims a Power is worthless unless your own Active is spent, which is a
  // strong claim nobody has checked against a game.
  //
  // NOT here: PRIZE_SWAP, which is scored at -Infinity ON PURPOSE and is a
  // declaration rather than a guess. Deliberately worthless is not an unmeasured
  // weight — see Rulings/PEEK-CLAIRVOYANCE.md, and do not "promote" it here.
  'SEARCH_EVOLUTION_TO_HAND', 'STATUS_COIN_EITHER_POWER', 'DISCARD_THEN_DRAW',
  'SEARCH_ENERGY_TO_SELF',
  // Hay Fever's self-cost — the bot pays for the Trainers it is locking out of
  // its own hand, at a rate nobody has tested.
  'NO_TRAINERS',
  // Job 10d. The special Energy on-attach weights, borrowed from the Trainers
  // that do the same job — a Full Heal and a Potion — which keeps them on one
  // scale and is not the same as having measured them.
  'E_CLEAR_STATUS', 'E_HEAL',
  // Rainbow's 10 damage. The refusal to kill its own Pokemon is not a weight and
  // is not in doubt; the price of the 10 on a healthy target is a guess.
  'E_SELF_DAMAGE',
  // Job 10e, the six Trainers. T_POWERS_OFF is the one most likely to be wrong:
  // it counts Powers rather than valuing them, on the grounds that pricing an
  // arbitrary Power is a problem nobody here has solved and a count at least has
  // the right sign. T_COIN_PINGPONG is the one least likely to be — its odds are
  // exact and simulated, and only the weighting of self-damage is a guess.
  'T_STATUS_ON_FLIP', 'T_SEARCH_TO_HAND', 'T_SHUFFLE_FROM_DISCARD',
  'T_DISCARD_THEN_OPP_REDRAW', 'T_POWERS_OFF', 'T_COIN_PINGPONG',
  // The last three. T_CHALLENGE carries the only weight here that is a JUDGEMENT
  // rather than a guess — the bot estimates the opponent's gain from visible
  // bench room alone, on purpose, and whether that reads as smart or as naive
  // can only be answered by playing it. T_LOOK_AND_SHUFFLE_BACK's threat list is
  // eight card ids picked by eye.
  //
  // NOT here: T_PRIZES_FACE_UP, refused at -Infinity on a written reason.
  'T_CHALLENGE', 'T_LOOK_AND_SHUFFLE_BACK',
]);

// --- 2e. no switch dispatches the same case twice -------------------------
//
// Found 19 Aug 2026: doTrainer contained a COMPLETE SECOND COPY of
// trainerPlayable's legality switch — 21 case labels, every one of them already
// handled earlier in the same switch. JavaScript takes the first match, so none
// of the 63 lines had ever run.
//
// Dead code is normally harmless. This kind is not, because it FAILS OPEN AND IT
// FAILS SILENTLY, and it has a specific victim: the next person adding a Trainer
// finds a block that reads exactly like the legality switch, adds their card's
// legality test to it, and ships a Trainer that is playable when it should not
// be. Nothing throws, no suite goes red, and the card simply does nothing on an
// empty board instead of being refused.
//
// So the property is asserted rather than trusted: within one method, a case
// label appears once. Cheap, general, and it would have caught the original.
{
  const fs = require('fs');
  for (const file of ['engine.js', 'ai.js', 'effects.js']) {
    const lines = fs.readFileSync(require('path').join(__dirname, '..', 'src', file), 'utf8')
      .split(/\r?\n/);
    // Methods start at exactly two spaces of indent; same scoping the enterPlay
    // check uses, and it is good enough for the same reason — a switch does not
    // span two methods.
    const dups = [];
    let name = null, seen = {}, depth = 0;
    for (let i = 0; i < lines.length; i++) {
      const h = lines[i].match(/^  ([A-Za-z_$][\w$]*)\s*\(/);
      if (h) { name = h[1]; seen = {}; }
      const m = lines[i].match(/^\s*case '([A-Z_0-9]+)':/);
      if (m && name) {
        if (seen[m[1]]) dups.push(`${file} ${name}(): '${m[1]}' at :${seen[m[1]]} and :${i + 1}`);
        else seen[m[1]] = i + 1;
      }
    }
    check(dups.length === 0, `no method in ${file} handles the same case twice`,
      dups.slice(0, 6).join(' | '));
  }
}

// --- 2f. every doorway into play goes through enterPlay --------------------
//
// THE GUARD BEHIND Rulings/PLAYED-FROM-HAND.md, and the reason that ruling is
// enforceable rather than merely written down.
//
// A Power that reads "when you play this from your hand" has to know how the
// card got into play, and no single site can answer that — the answer lives in
// which of eight doorways was used. engine.enterPlay is the one doorway, and a
// ninth added in Gym that forgets to call it does not crash, does not fail a
// game, and does not show up anywhere: the Power simply never fires.
//
// SCOPED BY ENCLOSING METHOD, and the first draft was not. It looked at a window
// of a few lines around each site, which sounds tighter and is in fact useless:
// deleting the enterPlay call from doPlayBasic left the check GREEN, because the
// window ran on into the next method. It had also never matched doPlayBasic at
// all, since that site pushes a variable rather than a `this.mkSlot(...)` call
// inline — so the guard was watching a site it could not see, through a window
// that would have forgiven it anyway, and printing a hardcoded 8 as if it were
// a count.
//
// Written up rather than quietly fixed, because "watch it go red" is the step
// that caught it and the failure is exactly what a decoration looks like.
//
// KNOWN LIMIT, stated rather than hidden: a method containing TWO sites passes
// if either one is declared. Splitting further would mean parsing the file, and
// the ratchet this backs up — a whole set going live — is not the failure mode
// that misses.
{
  const fs = require('fs');
  const src = fs.readFileSync(require('path').join(__dirname, '..', 'src', 'engine.js'), 'utf8');
  const lines = src.split(/\r?\n/);
  const isSite = l => !l.trim().startsWith('//')
    && (/this\.mkSlot\(/.test(l) || /\.stack\.push\(/.test(l));
  // Methods start at exactly two spaces of indent and end at a lone two-space `}`.
  const methods = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^  ([A-Za-z_$][\w$]*)\s*\(/);
    if (m) { cur = { name: m[1], line: i + 1, body: [] }; methods.push(cur); continue; }
    if (cur) cur.body.push(lines[i]);
    if (/^  \}\s*$/.test(lines[i])) cur = null;
  }
  const withSites = methods.filter(f => f.body.some(isSite));
  const misses = withSites
    .filter(f => !f.body.some(l => /this\.enterPlay\(/.test(l)))
    // enterPlay and mkSlot are both named inside enterPlay's own doc comment and
    // inside mkSlot itself, which creates a slot belonging to nobody yet.
    .filter(f => f.name !== 'mkSlot' && f.name !== 'enterPlay');
  check(misses.length === 0, 'every path into play goes through enterPlay',
    misses.map(f => `${f.name}() at engine.js:${f.line}`).join(', '));
  const sites = lines.filter(isSite).length;
  console.log(`  ${sites} sites put a card into play, across ${withSites.length} methods`);
}

console.log('\nAI verb coverage');
{
  const fs = require('fs');
  const rd = f => fs.readFileSync(require('path').join(__dirname, '..', 'src', f), 'utf8');
  const effSrc = rd('effects.js').replace(/^\s*\/\/.*$/gm, '');
  const aiSrc = rd('ai.js');

  const used = new Set([...effSrc.matchAll(/\bv:\s*'([A-Z_0-9]+)'/g)].map(m => m[1]));
  const handled = new Set([
    ...[...aiSrc.matchAll(/case\s*'([A-Z_0-9]+)'/g)].map(m => m[1]),
    ...[...aiSrc.matchAll(/\.v\s*===\s*'([A-Z_0-9]+)'/g)].map(m => m[1]),
  ]);

  // The same check one level down, for Pokemon Powers. Energy Burn is the
  // reason this exists: it worked perfectly and the AI never once used it.
  // PASSIVE powers produce no action at all, so scorePower never sees them and
  // they belong on the opt-out list by their nature rather than by choice.
  const PASSIVE_POWERS = new Set([
    'RETALIATE', 'PREVENT_AT_LEAST', 'DAMAGE_HALVE', 'FLIP_TO_NEGATE',
    'STATUS_IMMUNE', 'NO_EVOLUTION', 'TOXIC_GAS', 'RETREAT_DISCOUNT',
    'REVEAL_OPP_HAND',
    // Transform fires from settleTransforms after every action rather than being
    // an action the player takes, so scorePower never sees it.
    'TRANSFORM',
    // ENERGY_AS joined this list on 16 Aug 2026, which is a small piece of
    // history given the note above: Energy Burn is the reason this check exists,
    // and it is now the passive it was always behaving like. `slotSymbols`
    // consults it, `powerActions` never offers it, and there is nothing for
    // scorePower to weigh. This check going red is what said so.
    'ENERGY_AS',
    // Job 10c widened. Three more consulted-never-fired passives: Hay Fever is
    // read by trainersLocked, Sticky Goo by retreatCostOf, and Frenzy by
    // computeDamage — which is where every DETERMINISTIC passive goes, so the
    // AI forecasts it for free rather than needing a term of its own.
    'NO_TRAINERS', 'RETREAT_TAX', 'CONFUSED_BONUS',
  ]);

  // TRIGGERED POWERS (Job 10c). Also never seen by scorePower, and it would be
  // easy to file them under PASSIVE_POWERS above and move on. They are a
  // separate list because the REASON is different, and the reason is the whole
  // content of both lists.
  //
  // A passive Power is invisible to the AI because there is nothing to decide:
  // it is consulted, it changes a number, and no player ever reaches for it.
  // A TRIGGERED Power is invisible to scorePower because it is not an action —
  // but there IS a decision, and it is somewhere else entirely. ON_PLAY is
  // decided when the bot chooses to play the card; ON_OPP_RETREAT is decided
  // when it chooses to retreat into one.
  //
  // So filing these as passive would assert something false: that no decision
  // depends on them. What each one is actually scored by is named here, and
  // the P_ verbs underneath are on PROVISIONAL because none of it is measured.
  const TRIGGERED_POWERS = new Set([
    'ON_PLAY',          // scoreOnPlay, reached from the evolve and playBasic cases
    'ON_OPP_RETREAT',   // the retreat case in scoreAction prices the toll
    // ON_KO is the honest gap. Final Beam should make the bot think twice about
    // which Pokemon it finishes and with what, and nothing reads it — the
    // forecast has no term for what dying does back to you. AI.md's open list.
    'ON_KO',
    // The fourth trigger, Job 13. Eevee answers an allied evolution with one of
    // its own and NOBODY chooses it, so there is no action for ai.js to score —
    // the decision it belongs to is the evolve that fires it, which the evolve
    // case already prices. A genuine gap remains and it is small: the bot does
    // not know that evolving something ALSO evolves its Eevee, so it undervalues
    // that evolve by a whole Stage 1. AI.md, when somebody plays a deck with one.
    'CHAIN_REACTION',
  ]);
  const kinds = new Set([...effSrc.matchAll(/\bkind:\s*'([A-Z_0-9]+)'/g)].map(m => m[1]));
  const blindKinds = [...kinds].filter(k => !handled.has(k)
    && !PASSIVE_POWERS.has(k) && !TRIGGERED_POWERS.has(k)).sort();
  check(blindKinds.length === 0, 'every interactive Power kind is scored by ai.js',
    blindKinds.join(', '));
  const notPassive = [...PASSIVE_POWERS].filter(k => handled.has(k)).sort();
  check(notPassive.length === 0, 'nothing on PASSIVE_POWERS is secretly being scored',
    notPassive.join(', '));
  // The same claim for triggers, and it can go red the same way: a `case
  // 'ON_PLAY'` appearing in scorePower would mean somebody had started offering
  // a triggered Power as an action, which is a different card.
  const notTrig = [...TRIGGERED_POWERS].filter(k => handled.has(k)).sort();
  check(notTrig.length === 0, 'nothing on TRIGGERED_POWERS is offered as an action',
    notTrig.join(', '));
  const goneTrig = [...TRIGGERED_POWERS].filter(k => !kinds.has(k)).sort();
  check(goneTrig.length === 0, 'nothing on TRIGGERED_POWERS has left effects.js',
    goneTrig.join(', '));

  const blind = [...used].filter(v => !handled.has(v) && !UNSCORED_ON_PURPOSE.has(v)).sort();
  const stale = [...UNSCORED_ON_PURPOSE].filter(v => !used.has(v)).sort();

  console.log(`  ${[...used].filter(v => handled.has(v)).length} of ${used.size} verbs scored`
    + `, ${UNSCORED_ON_PURPOSE.size} unscored on purpose`
    + `, ${PROVISIONAL.size} provisional`);
  check(blind.length === 0, 'every verb in effects.js is scored by ai.js or opted out',
    blind.join(', '));
  check(stale.length === 0, 'nothing on UNSCORED_ON_PURPOSE has left effects.js',
    stale.join(', '));

  // STALL_VERBS AGAINST THE SCORER — 3 Sep 2026.
  //
  // `wallScore` decides what a card is FOR from a hand-written list of verbs,
  // and `scoreAttack` decides what an effect is WORTH from a switch. Both encode
  // "this denies them a turn or protects me", and they had drifted:
  // `CANT_ATTACK_ON_FLIP` was priced at half a paralysis by the scorer and was
  // not a stalling move according to the list. Nothing could see that, because
  // a verb missing from `STALL_VERBS` is the silent-failure surface one level
  // up — no error, no red suite, and a wall that is simply never recognised.
  //
  // WHAT MAKES THIS ASSERTABLE IS THE FLAG NAMES, NOT THE VERBS. Verbs grow with
  // every set (159 and climbing); the handful of flags below is stable. So a new
  // set adding a verb that maps to `lockAttack` is caught automatically, which
  // is the whole reason this is a derivation and not a third list.
  //
  // `softShield` is the one that carries both a member and an exclusion, which
  // is exactly why the exclusion has to be written down rather than implied.
  const STALL_FLAGS = ['lockAttack', 'softShield'];
  //
  // NOT A JOB — deliberately excluded, with the reason. `wallScore` asks what a
  // card exists to DO, and blunting one named attacker for one turn is a trick
  // somebody plays, not a role somebody fills. Leer is not on this list because
  // it negates the attack rather than reducing it; see the note in `ai.js`.
  const NOT_A_JOB = new Set(['DAMAGE_REDUCTION_FROM']);

  const stallList = new Set([...aiSrc.matchAll(/^\s*([A-Z_0-9]+):\s*1,/gm)]
    .map(m => m[1]));
  const denial = [...aiSrc.matchAll(/case\s*'([A-Z_0-9]+)':\s*flags\.([A-Za-z]+)/g)]
    .filter(m => STALL_FLAGS.includes(m[2])).map(m => m[1]);
  const drifted = denial
    .filter(v => used.has(v) && !stallList.has(v) && !NOT_A_JOB.has(v)).sort();
  const staleNotJob = [...NOT_A_JOB].filter(v => !denial.includes(v)).sort();

  check(drifted.length === 0,
    'every denial/protection verb the scorer prices is in STALL_VERBS or NOT_A_JOB',
    drifted.join(', '));
  check(staleNotJob.length === 0,
    'nothing on NOT_A_JOB has stopped being a denial verb in ai.js',
    staleNotJob.join(', '));

  // PROVISIONAL means "scored, but on a guess". All three claims below would be
  // contradictions rather than opinions, which is what makes them assertable.
  const notScored = [...PROVISIONAL].filter(v => !handled.has(v) && !kinds.has(v)).sort();
  check(notScored.length === 0, 'everything on PROVISIONAL is actually scored by ai.js',
    notScored.join(', '));
  const bothWays = [...PROVISIONAL].filter(v => UNSCORED_ON_PURPOSE.has(v)).sort();
  check(bothWays.length === 0, 'nothing is both PROVISIONAL and UNSCORED_ON_PURPOSE',
    bothWays.join(', '));
  const goneProv = [...PROVISIONAL].filter(v => !used.has(v) && !kinds.has(v)).sort();
  check(goneProv.length === 0, 'nothing on PROVISIONAL has left effects.js',
    goneProv.join(', '));
  if (PROVISIONAL.size) console.log(`  PROVISIONAL (unmeasured weights, a worklist): ${[...PROVISIONAL].sort().join(', ')}`);
}

// --- 2g. every harness asks the same question about who is owed an action ---
//
// The ratchet behind tools/lib/owed.js. On 2 Sep 2026 six tools held fourteen
// copies of the "who is the engine waiting for" expression in three different
// versions, and the worst of them aborted 8.8% of ladder games early — silently,
// because a loop that asks the wrong player and gets nothing back looks exactly
// like a game that ended.
//
// WHY A GUARD AND NOT A NOTE. The correct version of that expression already
// existed, in smoke.js, under a comment stating the rule in full. It never
// reached the seven other loops in its own file. #34's argument from the
// eleventh documentation pass applies exactly: a correction that leaves a human
// instruction behind has a half-life, and one that removes the thing needing
// maintenance does not.
//
// WHAT IT LOOKS FOR: a harness reading `pending*` to decide WHO to ask. Reading
// or writing those fields for any other purpose is ordinary and common — smoke
// sets `s.pendingPromote = null` when building a board, powertest asserts on it
// — so the pattern is deliberately narrow: an assignment whose right-hand side
// tests a pending field AND falls through to `.active`. That is the dispatch and
// nothing else looks like it.
//
// KNOWN LIMIT, stated rather than hidden: someone who writes the dispatch across
// two statements defeats this. It is a ratchet against the copy-paste that
// actually happened, not a proof.
{
  const fs = require('fs');
  const dir = require('path').join(__dirname);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'test.js');
  const offenders = [];
  for (const f of files) {
    const src = fs.readFileSync(require('path').join(dir, f), 'utf8');
    // Join continuation lines: the expression is habitually written over two or
    // three of them, which is why it was so easy to clone and so hard to see.
    const flat = src.replace(/\r?\n\s*/g, ' ');
    const re = /const\s+\w+\s*=\s*[^;]*\bpending(?:Ask|Switch|Promote|Prize)\b[^;]*\.active\b[^;]*;/g;
    let m;
    while ((m = re.exec(flat))) {
      if (/owedBy\s*\(/.test(m[0])) continue;
      offenders.push(`${f}: ${m[0].slice(0, 70).replace(/\s+/g, ' ')}…`);
    }
  }
  check(offenders.length === 0,
    `every game loop in tools/ dispatches through owedBy (${files.length} files scanned)`,
    offenders.join(' | '));
}

// --- 3. games finish, without throwing and without stalling --------------
console.log('\nFull games');
const rec = {}; let games = 0, turns = 0, stalls = 0, threw = [];
for (const a of DECK_NAMES) for (const b of DECK_NAMES) {
  if (a === b || a === 'Sandbox' || b === 'Sandbox') continue;
  for (let s = 1; s <= N; s++) {
    try {
      const g = playGame(a, b, s * 7919 + a.length * 31 + b.length);
      if (g.stalled) { stalls++; console.log(`  stall: ${a} v ${b} seed ${s} turn ${g.turn}`); continue; }
      rec[a] = rec[a] || [0, 0]; rec[b] = rec[b] || [0, 0];
      if (g.winner === 0) { rec[a][0]++; rec[b][1]++; } else { rec[b][0]++; rec[a][1]++; }
      games++; turns += g.turn;
    } catch (e) { threw.push(`${a} v ${b} seed ${s}: ${e.message}`); }
  }
}
check(threw.length === 0, `${games} games completed with no exception`, threw.slice(0, 3).join(' | '));
check(stalls === 0, 'no game stalled with a live board and no legal action');
console.log(`  ${games} games, average ${(turns / games).toFixed(1)} turns (${(turns / games / 2).toFixed(1)} each)`);

// --- 4. the AI ladder is ordered ----------------------------------------
console.log('\nAI ladder (mirror match, Brushfire, expert as player 0)');
// THE ONE STATISTICAL ASSERTION IN THIS FILE, and it was being made at a sample
// that could not support it. At N*3 = 36 games and a true rate near 61%, one
// standard error is 8 points and the 50% threshold sits 1.6 of them away — so
// the check failed for roughly one change in twenty regardless of whether the
// change was good, bad or irrelevant. It is deterministic per tree rather than
// flaky per run, which is worse: it looks like a verdict.
//
// It cost a real diagnosis on 13 Aug 2026. A confusion fix tripped it at 61% vs
// a 66% baseline, and the mirror control — expert against ITSELF, which measures
// nothing but noise and seat advantage — had moved in the same direction by half
// as much. Same lesson as `aiduel --control` in AI.md, one file along.
//
// Two changes, and neither costs anything: this section gets a sample floor
// (the whole suite runs in under two seconds, so the sample size was never a
// runtime tradeoff), and the assertion fails only on a SIGNIFICANT inversion.
// A tighter number is available to anyone who wants one by raising N, which
// narrows the interval automatically.
const LADDER_N = Math.max(N * 3, 90);
for (const mode of ['random', 'greedy', 'novice', 'expert']) {
  let w = 0, n = 0;
  for (let s = 1; s <= LADDER_N; s++) {
    const g = playGame('Brushfire', 'Brushfire', s * 104729, 'expert', mode);
    if (g.stalled) continue;
    if (g.winner === 0) w++; n++;
  }
  const pct = 100 * w / n;
  // Normal approximation at p=0.5, matching aiduel.js so the two read alike.
  const ci = n ? 1.96 * Math.sqrt(0.25 / n) * 100 : 0;
  console.log(`  expert vs ${mode.padEnd(7)} ${String(w).padStart(3)}/${n}  (${pct.toFixed(0)}% ±${ci.toFixed(0)})`
    + (mode === 'expert' ? '   <- control: both seats are the same bot' : ''));
  // Only a ladder that has genuinely INVERTED should go red. "Expert did not
  // clear 50% this run" is a sentence about the sample, not about the AI.
  // `detail` prints on PASS as well as FAIL, so the verdict half is conditional —
  // it read "99% — significantly below even odds" on a passing row until 14 Aug 2026.
  const inverted = !(pct + ci > 50);
  if (mode !== 'expert') check(!inverted, `expert beats ${mode}`,
    `${pct.toFixed(0)}% ±${ci.toFixed(0)} over ${n} games`
    + (inverted ? ' — significantly below even odds' : ''));
}

// --- 5. deck balance, reported not asserted ------------------------------
console.log('\nDeck win rate (informational — these are the authentic theme decks,');
console.log('and the real ones were never balanced against each other)');
for (const k of Object.keys(rec).sort((x, y) => rec[y][0] / (rec[y][0] + rec[y][1]) - rec[x][0] / (rec[x][0] + rec[x][1]))) {
  const [w, l] = rec[k];
  console.log(`  ${k.padEnd(12)} ${String(w).padStart(3)}-${String(l).padEnd(3)}  ${(100 * w / (w + l)).toFixed(0)}%`);
}

console.log(fail === 0 ? '\nAll checks passed.\n' : `\n${fail} check(s) FAILED.\n`);
process.exit(fail === 0 ? 0 : 1);

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
    const p = st.pendingSwitch !== null ? st.pendingSwitch
      : (st.pendingPromote === null || st.pendingPromote === undefined) ? st.active : st.pendingPromote;
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
const REMAINING = { base5: 40 };   // Team Rocket, Job 10b in progress

console.log('\nCard coverage');
const all = Object.keys(CARD_DB).filter(id => CARD_DB[id].kind !== 'energy');
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

// --- 2c. identical printed text means an identical script ----------------
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

// --- 2a. the alias table is justified, and complete -----------------------
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
const brokenDeckCards = [...inDecks].filter(id => CARD_DB[id].kind !== 'energy' && !EFFECTS[id]);
check(brokenDeckCards.length === 0, 'every card in a playable deck is implemented',
  brokenDeckCards.join(', '));

// --- 2b. AI verb coverage ------------------------------------------------
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
  ]);
  const kinds = new Set([...effSrc.matchAll(/\bkind:\s*'([A-Z_0-9]+)'/g)].map(m => m[1]));
  const blindKinds = [...kinds].filter(k => !handled.has(k) && !PASSIVE_POWERS.has(k)).sort();
  check(blindKinds.length === 0, 'every interactive Power kind is scored by ai.js',
    blindKinds.join(', '));
  const notPassive = [...PASSIVE_POWERS].filter(k => handled.has(k)).sort();
  check(notPassive.length === 0, 'nothing on PASSIVE_POWERS is secretly being scored',
    notPassive.join(', '));

  const blind = [...used].filter(v => !handled.has(v) && !UNSCORED_ON_PURPOSE.has(v)).sort();
  const stale = [...UNSCORED_ON_PURPOSE].filter(v => !used.has(v)).sort();

  console.log(`  ${[...used].filter(v => handled.has(v)).length} of ${used.size} verbs scored`
    + `, ${UNSCORED_ON_PURPOSE.size} unscored on purpose`);
  check(blind.length === 0, 'every verb in effects.js is scored by ai.js or opted out',
    blind.join(', '));
  check(stale.length === 0, 'nothing on UNSCORED_ON_PURPOSE has left effects.js',
    stale.join(', '));
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

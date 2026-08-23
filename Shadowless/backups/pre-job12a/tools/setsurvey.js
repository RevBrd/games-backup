// How big is the set you are about to add? Measured, not eyeballed.
//
//   node tools/setsurvey.js base5           Team Rocket
//   node tools/setsurvey.js gym1 --novel    ...and print every novel attack in full
//
// DATA.md says to ask this first, because PRINTINGS ARE NOT JOBS: Job 6's most
// useful number was the one that stopped 126 Jungle and Fossil printings being
// 126 pieces of work. This is that measurement, run against the raw corpus for a
// set that has not been generated yet, so it can be taken BEFORE committing to a
// job rather than discovered inside one.
//
// It answers four questions in the order they matter:
//
//   1. how many of the printings are DISTINCT behaviours, and how many are
//      aliases of another printing in the same set or of a card already live
//   2. how many attacks are plain damage with no rules text at all
//   3. how many print rules text WE HAVE ALREADY IMPLEMENTED VERBATIM, so the
//      script exists and can be pointed at
//   4. what is left, bucketed by the machinery it leans on
//
// TWO TRAPS BAKED IN, both from DATA.md.
//
// The signature IGNORES rules-text wording entirely, because WotC reworded across
// printings without changing behaviour — Blastoise's Hydro Pump says the same
// thing two ways in Base Set and Base Set 2. A signature that reads prose called
// Base Set 2 sixteen new cards against a true zero. Compare mechanics, never prose.
//
// And step 3 uses EXACT text matching on purpose, which makes it a LOWER BOUND on
// reuse rather than an estimate. A card whose text differs by a comma is counted
// as novel and will turn out to be free when you read it. That is the safe
// direction for a number a job gets planned against.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SET = process.argv[2];
const FULL = process.argv.includes('--novel');

if (!SET) {
  console.error('\n  usage: node tools/setsurvey.js <setcode> [--novel]');
  console.error('  set codes are in DATA.md, and TWO OF THEM READ BACKWARDS:');
  console.error('  base4 is Base Set 2 and base5 is Team Rocket. Check the data, not the number.\n');
  process.exit(1);
}

const rawPath = path.join(ROOT, 'data/raw', SET + '.json');
if (!fs.existsSync(rawPath)) {
  console.error(`\n  no data/raw/${SET}.json — see DATA.md for the set codes.\n`);
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const { CARD_DB } = require(path.join(ROOT, 'src/cards.js'));
const { EFFECTS } = require(path.join(ROOT, 'src/effects.js'));

const SYM = {
  Grass: 'G', Fire: 'R', Water: 'W', Lightning: 'L', Psychic: 'P',
  Fighting: 'F', Colorless: 'C', Darkness: 'D', Metal: 'M',
};
const stageOf = c => {
  const st = c.subtypes || [];
  return ['Basic', 'Stage 1', 'Stage 2'].find(x => st.includes(x)) || st[0] || '';
};
const costStr = a => (a.cost || []).map(x => SYM[x] || x[0]).join('');
const sig = c => JSON.stringify({
  n: c.name, sup: c.supertype, hp: c.hp, st: stageOf(c), ev: c.evolvesFrom || '',
  t: (c.types || [])[0] || '',
  wk: (c.weaknesses || []).map(w => w.type + w.value).join(),
  rs: (c.resistances || []).map(w => w.type + w.value).join(),
  r: (c.retreatCost || []).length,
  a: (c.attacks || []).map(x => [x.name, costStr(x), x.damage || '']),
  p: (c.abilities || []).map(x => x.name),
});

// ---- 1. distinct behaviours -------------------------------------------------
const groups = new Map();
for (const c of raw) {
  const k = sig(c);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(c);
}
const distinct = [...groups.values()].map(g => g[0]);

console.log(`\n${SET} — ${raw.length} printings`);
console.log(`  distinct behaviours    ${distinct.length}`);
console.log(`  in-set aliases         ${raw.length - distinct.length}`);

// SAME NAME, DIFFERENT MECHANICS is worth surfacing on its own. Two printings of
// one card that differ are either a real printing variation or a corpus error,
// and either way somebody has to look — a later pass will otherwise "tidy" them
// into one alias and silently ship the wrong Weakness.
const byName = {};
raw.forEach(c => (byName[c.name] = byName[c.name] || []).push(c));
const splits = [];
for (const n in byName) {
  const g = byName[n];
  if (g.length < 2) continue;
  // Attacks and Powers are compared by MECHANICS ONLY — name, cost, damage —
  // for the same reason the signature is. Comparing the whole object flagged
  // Fossil's two Raichu, whose reminder line the corpus words two different ways
  // and means the same rule both times. That is the trap this file is supposed
  // to be immune to, and it caught the author of this line on the first run.
  const mech = c => JSON.stringify({
    hp: c.hp, t: c.types, ev: c.evolvesFrom, r: (c.retreatCost || []).length,
    wk: c.weaknesses, rs: c.resistances,
    a: (c.attacks || []).map(x => [x.name, costStr(x), x.damage || '']),
    p: (c.abilities || []).map(x => [x.name, x.type]),
  });
  const keys = ['hp', 'types', 'evolvesFrom', 'retreatCost', 'weaknesses', 'resistances', 'attacks', 'abilities'];
  if (new Set(g.map(mech)).size === 1) continue;
  const diff = keys.filter(k => new Set(g.map(c => JSON.stringify(
    k === 'attacks' ? (c.attacks || []).map(x => [x.name, costStr(x), x.damage || ''])
      : k === 'abilities' ? (c.abilities || []).map(x => [x.name, x.type])
      : c[k]))).size > 1);
  if (diff.length) splits.push(`${n}: ${diff.join(', ')} (${g.map(c => c.id).join(' / ')})`);
}
if (splits.length) {
  console.log(`\n  SAME NAME, DIFFERENT MECHANICS — check these against a second source:`);
  splits.forEach(x => console.log(`    ${x}`));
}

// ---- 2 & 3. attack reuse ----------------------------------------------------
const liveText = new Map();
for (const id in CARD_DB) {
  if (!EFFECTS[id]) continue;
  (CARD_DB[id].attacks || []).forEach(a => {
    if (a.text) liveText.set(a.text.trim(), `${CARD_DB[id].name} — ${a.name}`);
  });
}

// THIS TOOL READS data/raw AND COMPARES AGAINST CARD_DB, and those are not the
// same text. `gen_cards.js` applies CORRECTIONS on the way through — places
// where the corpus is wrong and we have a better source — so a corrected card
// can never match itself, and reports as novel work on a set that is fully
// built.
//
// Team Rocket found it, 19 Aug 2026. base5 went live at 83 of 83 and this tool
// still called two attacks novel: both printings of Dark Vileplume's Petal
// Whirlwind, whose corpus text reads "Flip a coins." and whose corrected text
// reads "Flip 3 coins." The tool was right about the raw data and wrong about
// the job, which is the worse of the two ways to be wrong — TOOLING.md offers
// "a live set reports zero novel" as this tool's own control, and a control
// that cries wolf on a documented defect stops being read.
//
// So a set that is ALREADY GENERATED is compared against its generated text.
// The raw file is the right source for a set that does not exist yet, and
// CARD_DB is the right source for one that does; this picks whichever applies
// per card rather than per run, so a half-generated set behaves too.
const correctedText = (rawCard, atk) => {
  const gen = CARD_DB[rawCard.id];
  if (!gen) return String(atk.text || '').trim();
  const match = (gen.attacks || []).find(x => x.name === atk.name);
  return String((match && match.text) || atk.text || '').trim();
};
const pk = distinct.filter(c => c.supertype === 'Pokémon');
let vanilla = 0;
const reused = [], novel = [];
for (const c of pk) {
  for (const a of (c.attacks || [])) {
    const t = (a.text || '').trim();
    if (!t) { vanilla++; continue; }
    if (liveText.has(t)) { reused.push(`${c.name} — ${a.name}  =  ${liveText.get(t)}`); continue; }
    // ...and again against the corrected text, for a set already generated.
    const ct = correctedText(c, a);
    if (ct !== t && liveText.has(ct)) { reused.push(`${c.name} — ${a.name}  =  ${liveText.get(ct)}`); continue; }
    novel.push({ card: c.name, atk: a.name, cost: costStr(a), dmg: a.damage || '', text: t });
  }
}
const total = vanilla + reused.length + novel.length;
console.log(`\n  ATTACKS on ${pk.length} distinct Pokemon — ${total} total`);
console.log(`    plain damage, no text     ${vanilla}`);
console.log(`    text already implemented  ${reused.length}   (script exists, point at it)`);
console.log(`    novel text                ${novel.length}   <- this is the job`);

// ---- 4. what the novel ones lean on ----------------------------------------
// Indicative only: first match wins, and the point is to group the work, not to
// classify it correctly. Read the cards.
const BUCKETS = [
  [/Don't apply Weakness and Resistance for this attack/i, 'ignores W/R (NO_WR)'],
  [/Choose 1 of your opponent's Pok/i, 'snipe any of theirs (BENCH_SNIPE)'],
  [/each of your opponent's Benched/i, 'bench splash, theirs'],
  [/switch .*with the Defending|switches it with the Defending|Benched Pok.mon and switch/i, 'forced switch'],
  [/shuffles? .*into (his or her|your) deck/i, 'shuffle into deck'],
  [/Search your deck/i, 'deck search'],
  [/attach .*to (your Benched|it)|attach that Energy/i, 'energy movement'],
  [/discard .*Energy card.* attached to/i, 'energy discard'],
  [/number of coins equal to|Flip a number of coins/i, 'variable coin count'],
  [/your opponent flips/i, 'opponent flips'],
  [/for each damage counter on/i, 'scales on own damage'],
  [/but not used to pay for this attack/i, 'spare-energy scaling'],
  [/plus \d+ more damage for each/i, 'scales on a count'],
  [/is now (Asleep|Confused|Paralyzed|Poisoned)/i, 'status'],
  [/prevent all damage|during your opponent's next turn/i, 'next-turn effect'],
];
const tally = new Map();
const loose = [];
for (const n of novel) {
  const hit = BUCKETS.find(([re]) => re.test(n.text));
  if (!hit) { loose.push(n); continue; }
  if (!tally.has(hit[1])) tally.set(hit[1], []);
  tally.get(hit[1]).push(`${n.card} — ${n.atk}`);
}
console.log(`\n  NOVEL ATTACKS by machinery (indicative — first match wins)`);
[...tally.entries()].sort((a, b) => b[1].length - a[1].length)
  .forEach(([k, v]) => console.log(`    ${String(v.length).padStart(3)}  ${k}`));
if (loose.length) {
  console.log(`    ${String(loose.length).padStart(3)}  unclassified — read every one of these`);
  loose.forEach(n => console.log(`         ${n.card} — ${n.atk}: ${n.text.slice(0, 96)}`));
}

// ---- the rest ---------------------------------------------------------------
const powers = distinct.filter(c => (c.abilities || []).length);
const trainers = distinct.filter(c => c.supertype === 'Trainer');
const energy = distinct.filter(c => c.supertype === 'Energy');
console.log(`\n  POWERS    ${powers.reduce((a, c) => a + c.abilities.length, 0)} on ${powers.length} distinct cards`);
powers.forEach(c => c.abilities.forEach(a => console.log(`    ${c.name} — ${a.name}`)));
console.log(`\n  TRAINERS  ${trainers.length} distinct`);
trainers.forEach(c => console.log(`    ${c.name}`));
if (energy.length) {
  console.log(`\n  ENERGY    ${energy.length} distinct`);
  energy.forEach(c => console.log(`    ${c.name}`));
}

console.log(`\n  ALREADY IMPLEMENTED, verbatim (${reused.length})`);
[...new Set(reused)].forEach(r => console.log(`    ${r}`));

if (FULL) {
  console.log(`\n  EVERY NOVEL ATTACK IN FULL (${novel.length})`);
  novel.forEach(n => console.log(`    ${n.card} — ${n.atk} [${n.cost}] ${n.dmg}\n      ${n.text}`));
}
console.log('');

#!/usr/bin/env node
// ============================================================================
// pullcheck.js — did the packs actually behave, in a REAL save?
//
//   node tools/pullcheck.js "Save File/shadowless-collection (15).json"
//   node tools/pullcheck.js <file> --packs 140      # override the denominator
//
// `packtest.js` proves the generator matches the table in PACKS.md. It cannot
// answer the question a player actually asks, which is *"did MY packs behave"* —
// and that question has come up twice, both times as "these Shinies feel too
// frequent". Answering it by hand means digging a variant tally out of an
// exported save and doing Poisson arithmetic in a scratch file, which is how it
// was answered the first time and is why this exists.
//
// It reads the save, counts what came out of packs, and compares each variant
// against what PACK_ODDS says should have. Nothing here asserts; it prints.
//
// TWO THINGS ABOUT READING THE OUTPUT, and the second is the important one.
//
// **1st Edition is counted in PACKS, not cards.** It is a whole-pack roll, so a
// single 1st Edition pack flags all eleven of its cards — read as cards it looks
// like eleven hits and reads eleven times too lucky. That is very likely what a
// bare tally would have suggested the first time anyone looked.
//
// **A tally you went looking for BECAUSE it felt wrong is a biased sample.** You
// noticed the streak, then counted; the noticing is a filter and the count comes
// after it. So a mild excess here is close to meaningless, and the honest use of
// this tool is the opposite of the one it gets reached for: it is good at saying
// *"no, that is ordinary"* and weak at saying *"yes, something is wrong"*. If a
// number here does look extreme, the next step is `packtest.js` — a fresh,
// unfiltered sample — and not a change to the odds.
// ============================================================================

const fs = require('fs');
const path = require('path');
const P = require('../src/packs.js');

const file = process.argv[2];
if (!file) {
  console.error('usage: node tools/pullcheck.js <exported-save.json> [--packs N]');
  process.exit(2);
}
const argPacks = (() => {
  const i = process.argv.indexOf('--packs');
  return i >= 0 && process.argv[i + 1] ? parseInt(process.argv[i + 1], 10) : null;
})();

let raw;
try { raw = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')); }
catch (e) { console.error('Could not read ' + file + ': ' + e.message); process.exit(1); }

// The game exports `{ game, exported, save }`; the save itself is also accepted
// so a hand-extracted one still works.
const save = raw.save || raw;
if (!save.owned) { console.error('No `owned` map in that file — is it a Shadowless save?'); process.exit(1); }

const packs = argPacks || (save.stats && save.stats.packsOpened);
if (!packs) {
  console.error('No packsOpened in the save and no --packs given; there is no denominator.');
  process.exit(1);
}

// --- count what is actually in the binder ----------------------------------
const tally = {};
let owned = 0, plain = 0;
for (const id in save.owned) {
  for (const key in save.owned[id]) {
    const n = save.owned[id][key];
    owned += n;
    if (!key) { plain += n; continue; }
    for (const f of key.split('+')) {
      // Misprints are three separate variant keys so two differently-broken
      // cards are different collectibles. For a RATE they are one thing.
      const k = /^mp\d$/.test(f) ? 'mp' : f;
      tally[k] = (tally[k] || 0) + n;
    }
  }
}

// --- what the table says should have happened -------------------------------
const O = P.PACK_ODDS, SHAPE = P.PACK_SHAPE;
const SLOTS = SHAPE.rare + SHAPE.uncommon + SHAPE.common;
const NON_RARE = SHAPE.uncommon + SHAPE.common;

const ROWS = [
  { key: 'fe', label: '1st Edition', unit: 'packs',
    got: () => (tally.fe || 0) / SLOTS,          // whole-pack roll — see the header
    want: () => packs * O.firstEd,
    note: 'whole-pack roll, so this is packs and not cards' },
  { key: 'rh', label: 'Reverse Holo', unit: 'cards',
    got: () => tally.rh || 0,
    want: () => packs * NON_RARE * O.reverseHolo,
    note: 'the ' + NON_RARE + ' Common/Uncommon slots only' },
  { key: 'sh', label: 'Shiny', unit: 'cards',
    got: () => tally.sh || 0, want: () => packs * SLOTS * O.shiny, note: '' },
  { key: 'sl', label: 'Shadowless', unit: 'cards',
    got: () => tally.sl || 0, want: () => packs * SLOTS * O.shadowless, note: '' },
  { key: 'mp', label: 'Misprint', unit: 'cards',
    got: () => tally.mp || 0, want: () => packs * SLOTS * O.misprint,
    note: 'all three flavours together' },
];

// Exact two-sided Poisson tail. Normal approximation is wrong in the direction
// that matters here: at a mean under 5 — which Shadowless and Misprint will be
// for any realistic save — it reports a symmetric interval for a distribution
// that has no left tail to speak of, and calls an ordinary zero surprising.
function poissonTwoSided(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  const pmf = (i) => {
    let logp = -lambda + i * Math.log(lambda);
    for (let j = 2; j <= i; j++) logp -= Math.log(j);
    return Math.exp(logp);
  };
  let tail = 0;
  if (k >= lambda) { for (let i = k; i <= Math.ceil(lambda + 12 * Math.sqrt(lambda) + 12); i++) tail += pmf(i); }
  else { for (let i = 0; i <= k; i++) tail += pmf(i); }
  return Math.min(1, 2 * tail);
}

// --- report ------------------------------------------------------------------
const stat = save.stats || {};
console.log(`\n  ${path.basename(file)}`);
console.log(`  ${packs} packs opened${argPacks ? ' (given)' : ''}` +
  (stat.cardsPulled ? `, ${stat.cardsPulled} cards pulled` : '') +
  `, ${owned} in the binder (${plain} with no variant)\n`);

const W = 14;
console.log('  ' + 'variant'.padEnd(W) + '  got'.padStart(7) + '  expected'.padStart(11) +
  '   p'.padStart(9) + '   verdict');
console.log('  ' + '-'.repeat(W) + '  ' + '-'.repeat(5) + '  ' + '-'.repeat(9) + '  ' +
  '-'.repeat(7) + '  ' + '-'.repeat(24));

let anyOdd = false;
for (const r of ROWS) {
  const got = r.got(), want = r.want();
  const p = poissonTwoSided(Math.round(got), want);
  // 0.01 rather than 0.05, on purpose: five rows are tested at once, and at
  // p<0.05 apiece roughly one save in four would flag something by chance —
  // which would teach whoever runs it to ignore the output.
  const odd = p < 0.01;
  if (odd) anyOdd = true;
  const verdict = odd ? (got > want ? 'HIGH — look again' : 'LOW — look again')
    : got > want ? 'ordinary (running high)'
      : got < want ? 'ordinary (running low)' : 'ordinary';
  console.log('  ' + r.label.padEnd(W) +
    String(got % 1 ? got.toFixed(1) : got).padStart(7) +
    want.toFixed(1).padStart(11) +
    (p >= 0.999 ? '1.00' : p.toFixed(3)).padStart(9) + '   ' + verdict);
}

console.log('');
for (const r of ROWS) if (r.note) console.log(`  ${r.label}: ${r.note}.`);

console.log('');
if (anyOdd) {
  console.log('  Something is flagged. Before touching PACK_ODDS: run `node tools/packtest.js`,');
  console.log('  which samples fresh and is not filtered by anyone having noticed anything.');
} else {
  console.log('  Nothing is out of range. Every variant is where the table in PACKS.md puts it.');
}
console.log('  A count you went looking for because it FELT wrong is a biased sample — this is');
console.log('  good at saying "that is ordinary" and weak at saying "something is broken".\n');

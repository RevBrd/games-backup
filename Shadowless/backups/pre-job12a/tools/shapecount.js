// How many cards in the WHOLE ERA have this shape? Measured before deciding
// whether to build machinery or a special case.
//
//   node tools/shapecount.js "When you play .* from your hand"
//   node tools/shapecount.js "is Knocked Out" --texts
//   node tools/shapecount.js "flip a coin" --attacks --by-set
//
// THE QUESTION THIS ANSWERS IS NOT THE ONE setsurvey.js ANSWERS, and the two get
// confused because both print counts. `setsurvey` looks DOWN at one set and asks
// how much of it is already built. This looks ACROSS all fourteen and asks how
// often a shape recurs — which is the question that decides how to build the
// thing in front of you, and it is the one that has no natural moment to be
// asked unless somebody writes it down.
//
// It was worth writing because it changed a job. Job 10c had three triggered
// Powers to build and three plausible designs. Two minutes of this settled it:
//
//   "When you play .* from your hand"   20 printings, 7 sets, 15 DISTINCT texts
//   "When .* is Knocked Out"              3 printings, 2 sets,  2 distinct texts
//
// NOTE THE SECOND PATTERN, because the obvious one is wrong. A bare
// "is Knocked Out" returns 6 printings and 5 texts — it also catches Strikes
// Back's parenthetical "(even if Machamp is Knocked Out)", which is a card that
// answers damage rather than one that triggers on dying. The tool will not tell
// you that; only reading the hits will, which is why --texts exists and why a
// count from here is a starting point rather than an answer.
//
// Twenty heterogeneous cards means the trigger takes a VERB LIST, because
// building a bespoke Power kind per card writes fourteen of them by Neo 4. Three
// printings and two behaviours means the opposite — generalising ON_KO would
// have been pure waste. Same job, opposite answers, and only the count could
// tell them apart. Guessing would have got one of the two wrong.
//
// READ THE DISTINCT-TEXT COUNT, NOT THE PRINTING COUNT. Twenty printings that
// are four reprints of five cards is a very different job from twenty that are
// twenty cards, and this is the same lesson `setsurvey.js` and DATA.md keep
// making: printings are not jobs.

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = n => args.includes('--' + n);
const pattern = args.filter(a => !a.startsWith('--'))[0];

if (!pattern) {
  console.log('\n  usage: node tools/shapecount.js "<regex>" [--attacks] [--powers] [--trainers] [--texts] [--by-set]\n');
  console.log('  Searches Pokemon Power / ability text by default. Add --attacks to');
  console.log('  search attack text, --trainers for Trainer rules text; combine freely.\n');
  process.exit(1);
}

const re = new RegExp(pattern, 'i');
// Default: search abilities. Any explicit flag replaces that default rather than
// adding to it, so `--attacks` alone means attacks alone.
const explicit = flag('attacks') || flag('powers') || flag('trainers');
const want = {
  powers: explicit ? flag('powers') : true,
  attacks: flag('attacks'),
  trainers: flag('trainers'),
};

const dir = path.join(__dirname, '..', 'data', 'raw');
const hits = [];           // {set, card, where, label, text}

for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json'))) {
  const set = f.replace(/\.json$/, '');
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const cards = Array.isArray(j) ? j : (j.data || j.cards || []);
  for (const c of cards) {
    const push = (where, label, text) => {
      const t = String(text || '').replace(/\s+/g, ' ').trim();
      if (t && re.test(t)) hits.push({ set, card: c.name, where, label, text: t });
    };
    if (want.powers) for (const ab of (c.abilities || [])) push('power', ab.name, ab.text);
    if (want.attacks) for (const at of (c.attacks || [])) push('attack', at.name, at.text);
    if (want.trainers) if (c.supertype === 'Trainer' || c.kind === 'trainer') {
      push('trainer', c.name, (c.rules || []).join(' ') || c.text);
    }
  }
}

if (!hits.length) {
  console.log(`\n  /${pattern}/  no matches in any set.\n`);
  console.log('  A zero here is worth as much as a large number: it means the shape');
  console.log('  in front of you is unique in the era, so a special case is correct');
  console.log('  and machinery would be built for one card.\n');
  process.exit(0);
}

// DISTINCT TEXTS IS THE NUMBER THAT MATTERS. Normalised only for whitespace —
// deliberately NOT for the card's own name, because two cards doing the same
// thing under different names are still two behaviours to a reader and one to
// the engine, and conflating them is how a count lies in the optimistic
// direction. setsurvey.js makes the same choice for the same reason.
const distinct = new Map();
for (const h of hits) {
  const key = h.text;
  if (!distinct.has(key)) distinct.set(key, []);
  distinct.get(key).push(h);
}
const sets = [...new Set(hits.map(h => h.set))];

console.log(`\n  /${pattern}/`);
console.log(`\n  ${hits.length} printings across ${sets.length} sets`);
console.log(`  ${distinct.size} distinct texts   <- THIS is the size of the job\n`);

if (flag('by-set') || !flag('texts')) {
  const bySet = {};
  for (const h of hits) (bySet[h.set] = bySet[h.set] || []).push(h);
  for (const s of sets) {
    console.log(`  ${s.padEnd(7)} ${String(bySet[s].length).padStart(3)}   `
      + [...new Set(bySet[s].map(h => `${h.card} — ${h.label}`))].join(', ').slice(0, 96));
  }
  console.log('');
}

if (flag('texts')) {
  console.log('  DISTINCT TEXTS, most-reprinted first:\n');
  [...distinct.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([text, list]) => {
      const names = [...new Set(list.map(h => h.card))];
      console.log(`  x${String(list.length).padStart(2)}  ${names.join(', ')}`);
      console.log(`       ${text.slice(0, 150)}${text.length > 150 ? '…' : ''}\n`);
    });
}

console.log('  Printings are not jobs. Build machinery for the DISTINCT count,');
console.log('  and only when it is large enough that per-card code would repeat.\n');

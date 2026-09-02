// The gate. Everything that returns pass or fail, in the order it has to run in.
//
//   node tools/test.js              the whole gate
//   node tools/test.js --verbose    stream each suite's own output too
//   node tools/test.js --quick      packtest at 200k is most of the runtime; skip it
//
// WHY THIS EXISTS. The six suites were six separate commands, one of which
// needed an argument and one of which goes red if you give it a small number.
// TOOLING.md says to run all six before calling anything done, and nothing made
// that one action. Job 15d, 2 Sep 2026.
//
// THE ORDERING IS THE POINT, NOT THE CONVENIENCE. `smoke.js` tests the BUILT
// artifact. If you edit `src/` and do not rebuild, it reads the previous build,
// tests code you have already replaced, and passes — so a green six-suite run
// can be describing a version of the game that no longer exists. Nothing in the
// tree caught that, because every suite was individually correct.
//
// So the two generator `--check`s run FIRST and the rest are gated behind them:
//
//   gen_cards --check   is src/cards.js still what data/ generates?
//   build --check       is shadowless.html still what src/ builds?
//
// Both are cheap, both already existed, and neither was in anybody's routine.
// They also catch the thing CLAUDE.md warns about loudest — a hand-edit to a
// generated file — which no suite can see because the hand-edit is perfectly
// valid JavaScript.
//
// WHAT IS DELIBERATELY NOT HERE. `claimtest.js` is pass/fail and is still not in
// the gate: a red row there is a fault report about the AI, filed on purpose,
// and putting it here would teach everybody to read red as "you broke
// something". `aitest`, `aiduel`, `abtest`, `decksim`, `pressure`, `openercheck`
// and `pullcheck` are not pass/fail at all. `shot.js` and `probe.js` need a
// browser. See TOOLING.md and MEASUREMENT.md for both boundaries.

const path = require('path');
const { spawnSync } = require('child_process');

const VERBOSE = process.argv.includes('--verbose');
const QUICK = process.argv.includes('--quick');
const ROOT = path.join(__dirname, '..');

const STEPS = [
  { name: 'gen_cards --check', args: ['tools/gen_cards.js', '--check'],
    why: 'src/cards.js matches data/' },
  { name: 'build --check', args: ['tools/build.js', '--check'],
    why: 'shadowless.html matches src/ — everything below is testing the right code' },
  { name: 'selftest', args: ['tools/selftest.js'],
    why: 'rules, coverage, AI ladder' },
  { name: 'powertest', args: ['tools/powertest.js'],
    why: 'Powers, the bespoke cards, AI verb scoring' },
  { name: 'smoke', args: ['tools/smoke.js'],
    why: 'the built artifact, through a stubbed DOM' },
  { name: 'collectiontest', args: ['tools/collectiontest.js'],
    why: 'the save file, decks and variants' },
  { name: 'progresstest', args: ['tools/progresstest.js'],
    why: 'the ladder, unlocks and rewards' },
  { name: 'packtest', args: ['tools/packtest.js'], slow: true,
    why: '200k packs against the odds table' },
];

const results = [];
let failed = null;

console.log('\nShadowless gate\n');

for (const step of STEPS) {
  if (QUICK && step.slow) {
    results.push({ ...step, skipped: true });
    console.log(`  ....  ${step.name.padEnd(18)} skipped (--quick)`);
    continue;
  }
  const t0 = Date.now();
  const r = spawnSync(process.execPath, step.args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  const ms = Date.now() - t0;
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = r.status === 0;
  results.push({ ...step, ok, ms, out });

  if (VERBOSE) console.log(out);
  // The last non-empty line of every suite in this repo is its own verdict.
  const verdict = out.trim().split(/\r?\n/).filter(Boolean).pop() || '(no output)';
  console.log(`  ${ok ? ' ok ' : 'FAIL'}  ${step.name.padEnd(18)} ${String(ms).padStart(6)} ms   ${verdict.trim().slice(0, 60)}`);

  // The two --checks gate the rest: a stale artifact makes everything below
  // meaningless rather than merely also-failing, so say so and stop.
  if (!ok && step.args[1] === '--check') {
    failed = step;
    console.log(`\n  STOPPED. ${step.name} failed, so nothing below it would be testing the current code.`);
    console.log(out.trim().split(/\r?\n/).slice(-8).join('\n'));
    break;
  }
  if (!ok && !failed) failed = step;
}

console.log('');
const ran = results.filter(r => !r.skipped);
const bad = ran.filter(r => !r.ok);
const total = ran.reduce((a, r) => a + (r.ms || 0), 0);

if (!bad.length) {
  console.log(`  ${ran.length} green in ${(total / 1000).toFixed(1)}s.` + (QUICK ? '  (--quick: packtest was skipped)' : ''));
  console.log('');
  process.exit(0);
}

console.log(`  ${bad.length} FAILED: ${bad.map(b => b.name).join(', ')}\n`);
for (const b of bad) {
  if (b === failed && b.args[1] === '--check') continue;   // already printed above
  console.log(`--- ${b.name} ---`);
  console.log(b.out.trim().split(/\r?\n/).filter(l => /FAIL|Error|error:/.test(l)).slice(0, 20).join('\n') || b.out.trim().split(/\r?\n/).slice(-15).join('\n'));
  console.log('');
}
console.log(`  Re-run one on its own for the full output, or use --verbose.\n`);
process.exit(1);

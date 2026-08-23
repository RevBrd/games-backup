// Run the playbook claims — does the bot play these cards the way Trevor says?
//
//   node tools/claimtest.js                    assert every claim
//   node tools/claimtest.js Dewgong            just this card
//   node tools/claimtest.js --explore          print every board and what the bot weighed
//   node tools/claimtest.js Zapdos --explore   investigate one before you know the answer
//   node tools/claimtest.js --baseline e23c747 run the same rows against an OLDER bot
//   node tools/claimtest.js --open             just the clauses nothing can assert yet
//
// THIS IS PASS/FAIL, which puts it with `TOOLING.md`'s suites and not with
// `MEASUREMENT.md`'s instruments. A claim is a statement about one constructed
// board, and it is either true on that board or it is not — no sample, no
// interval, nothing to misread. That is deliberate: `PLAYBOOK.md` says to assert
// these rather than duel them, because they are symmetric between the seats and
// about what the bot can PERCEIVE, and `aiduel.js` is blind to both by
// construction and will report ~50% no matter how large the change is.
//
// --explore IS THE HALF THAT DID NOT EXIST. Every measurement table in
// `Playbook/ATTACK-CHOICE.md` was produced by a throwaway script that is gone, so
// none of them can be re-run and none of them was reviewable. The same rows now
// serve both jobs: you write the board, run --explore to see what the bot
// actually does, and only then decide whether you are looking at a fault. The
// investigation leaves the artifact behind instead of a table in a document.
//
// --baseline IS THE CONTROL, AND IT IS THE POINT. A suite that has only ever been
// green proves nothing about itself. `MEASUREMENT.md` says to always run the
// control first and `LOGBOOK.md` has an instance finding three broken guards in a
// day by deliberately breaking things and watching. So: the Gyarados and Fearow
// rows below encode faults that were fixed on 22 Aug 2026, and against the commit
// before that fix they MUST go red. If they do not, this harness is not measuring
// what it claims and nothing it reports should be believed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, '..');
const CLAIMS_DIR = path.join(__dirname, 'claims');

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const EXPLORE = flags.has('--explore');
const ONLY_OPEN = flags.has('--open');
const bi = args.indexOf('--baseline');
const BASELINE = bi >= 0 ? args[bi + 1] : null;
const filter = args.filter(a => !a.startsWith('--') && a !== BASELINE)[0] || null;

// ---- baseline: re-exec against a src/ materialised from a git ref ----------
// Same trick as abtest.js, and the same stated limit: the whole of src/ comes
// from the ref, so a claim about a card that ref does not know will error rather
// than fail. That is the honest outcome and it is reported as its own bucket.
if (BASELINE && !process.env.SHADOWLESS_SRC) {
  const tmp = path.join(os.tmpdir(), `shadowless-claims-${BASELINE.replace(/[^\w]/g, '_')}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const mods = fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js'));
  for (const f of mods) {
    try {
      fs.writeFileSync(path.join(tmp, f),
        execSync(`git show ${BASELINE}:Shadowless/src/${f}`, { cwd: REPO, maxBuffer: 1 << 26 }));
    } catch (e) {
      console.error(`  ${BASELINE} has no src/${f} — cannot build a baseline from it.`);
      process.exit(1);
    }
  }
  console.log(`\nBASELINE MODE — src/ from ${BASELINE}`);
  console.log('Claims written for a fault fixed after this commit SHOULD FAIL here.\n');
  const r = require('child_process').spawnSync(process.execPath,
    [__filename, ...args.filter(a => a !== '--baseline' && a !== BASELINE)],
    { stdio: 'inherit', env: { ...process.env, SHADOWLESS_SRC: tmp } });
  process.exit(r.status === 0 ? 0 : 0);   // a red baseline is the expected result
}

const { setup } = require('./lib/board.js');

// ---- load ------------------------------------------------------------------

const claims = [];
for (const f of fs.readdirSync(CLAIMS_DIR).filter(f => f.endsWith('.js')).sort()) {
  const mod = require(path.join(CLAIMS_DIR, f));
  for (const c of (mod.CLAIMS || mod)) claims.push({ ...c, _file: f });
}
const want = filter
  ? claims.filter(c => (c.card || '').toLowerCase().includes(filter.toLowerCase())
                    || (c.id || '') === filter
                    || (c.pattern || '').toLowerCase().includes(filter.toLowerCase()))
  : claims;

if (!want.length) { console.log(`\nno claims matching "${filter}".\n`); process.exit(1); }

// ---- open clauses ----------------------------------------------------------
// A clause nobody can assert yet is a ROW, not an omission. It is the record that
// somebody read the note, found the term missing, and did not quietly drop the
// half of the sentence the scorer cannot reach.

const open = want.filter(c => c.open);
if (ONLY_OPEN || EXPLORE) {
  if (open.length) {
    console.log(`\nOPEN — ${open.length} clause${open.length === 1 ? '' : 's'} with no term to assert against\n`);
    for (const c of open) {
      console.log(`  ${c.card} (${c.id})`);
      console.log(`    want:  ${c.claim || '(see note)'}`);
      console.log(`    why:   ${c.open}\n`);
    }
  } else console.log('\nno open clauses.\n');
  if (ONLY_OPEN) process.exit(0);
}

const runnable = want.filter(c => !c.open);

// ---- run -------------------------------------------------------------------

let pass = 0, fail = 0, broke = 0;
const failures = [];

for (const c of runnable) {
  let b;
  try { b = setup(c.board); }
  catch (e) { broke++; console.log(`  BOARD  ${c.card} — ${e.message}`); continue; }

  if (EXPLORE) {
    console.log(`\n${'='.repeat(78)}`);
    console.log(`${c.card}  (${c.id})   ${c.pattern || ''}`);
    console.log(`  claim: ${c.claim}`);
    const mine = b.card(b.me.active), theirs = b.card(b.them.active);
    console.log(`  board: ${mine.name} ${b.hp()}/${mine.hp} hp, ${b.me.active.energy.length}E` +
                `   vs   ${theirs.name} ${b.theirHP()}/${theirs.hp} hp, ${b.them.active.energy.length}E`);
    console.log(`         incoming threat ${b.threat()}`);
    for (const n of b.attacks()) {
      const ok = b.affordable().includes(n);
      console.log(`    ${ok ? ' ' : '·'} ${n.padEnd(18)} ${ok ? b.score(n).toFixed(2).padStart(8) : '  (unaffordable)'}` +
                  `${ok ? `   dmg ${b.damage(n).toFixed(0).padStart(3)}   pKO ${b.lethal(n).toFixed(2)}` : ''}`);
    }
    console.log('  the whole turn:');
    for (const e of b.explain().slice(0, 6)) {
      console.log(`      ${e.label.padEnd(22)} ${Number.isFinite(e.score) ? e.score.toFixed(2).padStart(8) : '       —'}`);
    }
  }

  // THE FIXTURE ASSERTION RUNS FIRST AND ITS FAILURE IS NOT THE CLAIM FAILING.
  // It says the board is still the board the claim was written about. When a
  // scoring change makes a fixture ambiguous, this is what goes off — and it is
  // reported as its own kind, because "your board no longer isolates anything"
  // and "the bot got this wrong" want completely different responses.
  if (typeof c.sane === 'function') {
    let ok = false, err = null;
    try { ok = !!c.sane(b); } catch (e) { err = e; }
    if (!ok) {
      broke++;
      console.log(`  FIXTURE  ${c.card} — the board no longer satisfies its own precondition`);
      console.log(`           ${c.claim}`);
      if (err) console.log(`           ${err.message}`);
      continue;
    }
  } else {
    broke++;
    console.log(`  NO SANE  ${c.card} — every claim needs a fixture assertion. See the header of ${c._file}.`);
    continue;
  }

  let ok = false, err = null;
  try { ok = !!c.expect(b); } catch (e) { err = e; }
  if (ok) { pass++; if (!EXPLORE) console.log(`  ok    ${c.card.padEnd(12)} ${c.claim}`); }
  else {
    fail++;
    failures.push({ c, b, err });
    console.log(`  FAIL  ${c.card.padEnd(12)} ${c.claim}`);
    if (err) console.log(`        threw: ${err.message}`);
  }
}

// ---- what actually happened on the ones that failed ------------------------
// A bare FAIL is a bug report with the evidence left at the scene. Print the
// board's own numbers so the next step is reading rather than re-deriving.

if (failures.length && !EXPLORE) {
  console.log(`\n${'-'.repeat(78)}\nwhat the bot did instead\n`);
  for (const { c, b } of failures) {
    console.log(`  ${c.card} (${c.id}) — ${c.claim}`);
    console.log(`    threat ${b.threat()}, ${b.hp()} hp left, best attack: ${b.bestAttack()}`);
    for (const n of b.affordable()) {
      console.log(`      ${n.padEnd(18)} ${b.score(n).toFixed(2).padStart(8)}   pKO ${b.lethal(n).toFixed(2)}`);
    }
    console.log('');
  }
}

const bits = [`${pass} passed`, `${fail} failed`];
if (broke) bits.push(`${broke} unusable`);
if (open.length && !EXPLORE) bits.push(`${open.length} open (--open)`);
console.log(`\n=========== ${bits.join(', ')} ===========\n`);
process.exit(fail === 0 && broke === 0 ? 0 : 1);

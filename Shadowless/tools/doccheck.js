// The documentation lint. Every sweep MAINTENANCE.md says is cheap and nobody runs.
//
//   node tools/doccheck.js              the live tree
//   node tools/doccheck.js --verbose    list every hit, not just the count
//   node tools/doccheck.js <dir>        lint some other copy of the tree
//
// WHY THIS EXISTS. MAINTENANCE.md's own diagnosis is that "a correction which
// leaves a human instruction behind has a half-life". Its three most repeated
// findings are all human instructions, and all three have been missed by
// consecutive passes that had the instruction in front of them:
//
//   "Check every register's own number at the start of a pass; it is the
//    cheapest finding available. It is also the one nobody runs."
//        -> four passes in a row then found a register over its own limit.
//           GRABHIST at 649, HISTORY at 461, AI-INVARIANTS at 471, LOGBOOK
//           at 555 (8 Sep 2026, this session).
//
//   "Do not hand-list the archives."
//        -> written directly underneath a hand-list of archives, which was
//           three behind. Twice, from the same cause: the first "fix" in
//           Aug 2026 EXTENDED the list instead of deleting it.
//
//   "Grep for 'exactly', 'all four', 'every one of them'."
//        -> the highest-yield trigger in that file, by measurement, and it is
//           a grep nobody types.
//
// So this file is the instruction, executed. Job 15g, 8 Sep 2026, Shadowless 39.
//
// IT IS NOT IN tools/test.js AND MUST NOT BE. That gate answers "is the game
// broken"; a stale doc is not a broken game, and a doc lint that can redden the
// build teaches everybody to read red as "you broke something" -- exactly the
// argument TOOLING.md already makes for keeping claimtest.js out.
//
// WHAT IT CANNOT DO, STATED SO NOBODY TRUSTS IT FURTHER THAN IT GOES. It cannot
// tell you whether a sentence is true. Sections 5 and 6 print candidates for a
// human to check and will always print some; a clean run of those two is
// evidence the grep is broken, not that the tree is clean. Treat FLAG as "go and
// look" and FAIL as "this is wrong".
//
// THIS TOOL WAS WATCHED GOING RED BEFORE IT WAS TRUSTED, which is claimtest.js's
// doctrine one folder over and the reason MAINTENANCE.md distrusts the link
// checker that cried wolf. Run it against the backup taken before this pass:
//
//   node tools/doccheck.js backups/pre-docs-cleanup-12
//
// That copy holds LOGBOOK at 555 over its own 450, CREDITS' stale hand-list, its
// duplicate #33 and its stray one-cell table row. Every check below fires there
// and is quiet on the live tree. A verifier that has only ever been green proves
// nothing about itself.

const fs = require('fs');
const path = require('path');

const VERBOSE = process.argv.includes('--verbose');
const argDir = process.argv.slice(2).find(a => !a.startsWith('--'));
const ROOT = path.resolve(argDir || path.join(__dirname, '..'));
const SUBS = ['Rulings', 'Playbook', 'AI-INVARIANTS', 'data'];

// The line target is 200; the truncation zone starts around 400, and a working
// session stops reading all of a file somewhere above 300. Registers are exempt
// and carry their own, larger number in their own header -- which is the number
// this tool exists to read rather than to hardcode.
const TARGET = 200;
const ATTENTION = 300;

let fails = 0, flags = 0;
const fail = m => { fails++; console.log('  FAIL  ' + m); };
const flag = m => { flags++; console.log('  FLAG  ' + m); };
const pass = m => console.log('  ok    ' + m);

const rel = f => path.relative(ROOT, f).replace(/\\/g, '/');
const read = f => fs.readFileSync(f, 'utf8');
const lines = f => read(f).split('\n').length - 1;

function collect() {
  const out = fs.readdirSync(ROOT).filter(f => f.endsWith('.md')).map(f => path.join(ROOT, f));
  for (const d of SUBS) {
    const p = path.join(ROOT, d);
    if (fs.existsSync(p)) out.push(...fs.readdirSync(p).filter(f => f.endsWith('.md')).map(f => path.join(p, f)));
  }
  return out;
}
const FILES = collect();

// A register declares itself append-only in its own header, and declares its own
// split threshold there too. Both are read from the file rather than listed here,
// because MAINTENANCE.md is explicit that "it is the roll that rots and the label
// that does not" -- a hardcoded list of registers is the very thing it bans.
//
// THREE DISTINCTIONS THAT ARE NOT PEDANTRY. The first draft of this section
// produced 66 FAILs, of which about four were real, and MAINTENANCE.md is
// explicit that a checker which cries wolf is worse than no checker.
//
//   LIVE vs CLOSED. A closed archive cannot grow, so it needs no threshold of
//   its own -- its job is to say which file the NEXT entry goes in. Only a live
//   register is asked for a number.
//
//   THE FILE vs THE FOLDER. Once a register becomes a directory, "the register
//   is the folder" and each entry inside is append-only by inheritance. Asking
//   28 ruling files for a growth threshold each is asking the wrong unit.
//
//   PARENT vs REGISTER. A directory page like RULINGS.md is method and an index.
//   It is revised, it is not exempt, and MAINTENANCE.md names it as the file
//   whose own exemption had to be taken away.
const REG = new Map();
function registerOf(f) {
  if (REG.has(f)) return REG.get(f);
  const body = read(f);
  const head = body.split('\n').slice(0, 80).join('\n');
  const inFolder = path.dirname(f) !== ROOT;
  const isArchive = /-ARCHIVE-\d+\.md$/.test(f);
  // A directory PAGE (RULINGS.md beside Rulings/) is method and an index. Its
  // header says its entries are append-only, which is a statement about the
  // folder rather than about itself -- it is revised, it is not exempt, and
  // MAINTENANCE.md names it as the file whose exemption had to be taken away.
  const isDirPage = fs.existsSync(path.join(ROOT, path.basename(f, '.md').replace(/^(.)(.*)$/, (_, a, b) => a + b.toLowerCase())))
                 || fs.existsSync(path.join(ROOT, path.basename(f, '.md')));
  const declared = /append-only/i.test(head) && !isDirPage;
  // BOTH OF THE NEXT TWO LINES WERE WRONG IN THE FIRST DRAFT, AND ONLY THE
  // CONTROL RUN SAID SO. Together they made this tool silently skip LOGBOOK.md
  // at 555 against its own 450 -- the single finding the section exists for.
  //
  // "closed" has to be about the FILE. Matching the bare word caught LOGBOOK's
  // "entries move out of this file when the work they describe is CLOSED",
  // which is about the work, and the live file was then exempted from itself.
  const closed = isArchive || /this file is (?:an? )?[\w -]*closed\b/i.test(head);
  // The threshold is stated in prose that varies -- "growing this one past ~450",
  // "when this file passes ~450", "Both limits are ~450". Matching a verb before
  // the number missed the third, so take the largest ~NNN in the header instead.
  // Headers cite their own history ("the old split was ~250 live against ~450"),
  // so the largest is the current one in every case here; if that ever stops
  // being true it fails loud, by reporting a limit nobody wrote.
  const nums = [...head.matchAll(/~\s*(\d{3,4})\b/g)].map(x => +x[1]).filter(n => n >= 200);
  const m = nums.length ? [null, Math.max(...nums)] : null;
  const r = {
    isReg: declared || isArchive,     // exempt from the 200-line target
    wantsLimit: (declared || isArchive) && !closed && !inFolder,
    limit: m ? +m[1] : null,
    // A file carrying a growth threshold but not the append-only label is the
    // hole this tool fell into on its first control run: MAINTENANCE.md says to
    // find the registers by reading headers rather than by keeping a list, so a
    // register that never says the word is invisible to anybody obeying the
    // instruction. LOGBOOK.md was in exactly that state, at 555 against its own
    // 450, and this check is the reason it cannot happen quietly again.
    // The test for "is a register" is that ARCHIVES OF ITSELF exist and are
    // named in its own header. That is what a register is, structurally, and it
    // cannot be faked by a file merely citing somebody else's number -- which
    // both CREDITS.md and MAINTENANCE.md do, and which two earlier drafts of
    // this line reported as defects.
    unlabelled: !declared && !isArchive && !inFolder && !isDirPage &&
      new RegExp(`${path.basename(f, '.md')}-ARCHIVE-\\d+\\.md`).test(head),
  };
  REG.set(f, r);
  return r;
}

console.log('\nShadowless doc lint  ' + (argDir ? rel(ROOT) || argDir : 'live tree'));

// 1 -- REGISTERS AGAINST THE LIMIT IN THEIR OWN HEADER.
console.log('\nRegisters against their own stated threshold');
let regs = 0, before = fails;
for (const f of FILES) {
  const r = registerOf(f);
  if (r.unlabelled) {
    fail(`${rel(f)} states a ~${r.limit} growth threshold but never calls itself append-only. The label is what makes a register findable by a pass reading headers — without it, it is exempt from nothing and watched by nobody, which is how one reached ${lines(f)}`);
    continue;
  }
  if (!r.isReg) continue;
  regs++;
  const n = lines(f);
  if (!r.wantsLimit) continue;                 // closed, or a member of a directory register
  if (r.limit === null) {
    fail(`${rel(f)} is a live register and states NO threshold in its own header. Two files have been caught this way and both would have crossed unremarked`);
  } else if (n > r.limit) {
    fail(`${rel(f)} is ${n} lines against the ~${r.limit} written in its own header`);
  } else if (n > r.limit * 0.92) {
    flag(`${rel(f)} is ${n} of ~${r.limit} — close, so plan the next archive now rather than at the overrun`);
  }
}
if (fails === before) pass(`${regs} registers, every one inside the number in its own header`);

// 2 -- EVERYTHING ELSE AGAINST THE 200-LINE TARGET.
console.log('\nNon-register files against the 200-line target');
const over = [];
for (const f of FILES) {
  if (registerOf(f).isReg) continue;
  const n = lines(f);
  if (n > TARGET) over.push([rel(f), n]);
}
over.sort((a, b) => b[1] - a[1]);
for (const [name, n] of over) {
  if (n > ATTENTION) flag(`${name} is ${n} lines — past the point a working session stops reading all of it`);
  else if (VERBOSE) flag(`${name} is ${n} lines`);
}
if (!over.length) pass('nothing over target');
else if (!VERBOSE) console.log(`        (${over.length} over ${TARGET}; the ${over.filter(o => o[1] <= ATTENTION).length} under ${ATTENTION} are not printed — --verbose for all)`);

// 3 -- LINKS. The `#` in the character class is load-bearing: without it an
// anchored link to a real file is reported MISSING, which is the worst failure a
// verifier can have and cost this tree a pass's trust in Aug 2026.
console.log('\nLinks');
let links = 0, broken = 0;
for (const f of FILES) {
  const dir = path.dirname(f);
  for (const m of read(f).matchAll(/\]\(([A-Za-z0-9_./#-]+\.md)(?:#[A-Za-z0-9_-]*)?\)/g)) {
    const target = m[1].split('#')[0];
    links++;
    if (!fs.existsSync(path.join(dir, target))) { fail(`${rel(f)} links to ${target}, which is not there`); broken++; }
  }
}
if (!broken) pass(`${links} links, all resolving — subfolder links resolved relative to their own file`);

// 4 -- TRAILING NEWLINE. An append onto a file without one lands on the last
// line and eats it, silently, inside registers that are otherwise append-safe.
console.log('\nTrailing newlines');
let nonl = 0;
for (const f of FILES) if (!read(f).endsWith('\n')) { fail(`${rel(f)} does not end with a newline — the next append will land on its last line and eat it`); nonl++; }
if (!nonl) pass(`${FILES.length} files, all ending with a newline`);

// 5 -- QUANTIFIERS. The highest-yield trigger in MAINTENANCE.md, measured: nine
// of eleven findings on the tenth pass had this shape. It cannot be verified
// mechanically -- a quantifier reads as a property and nobody checks a property,
// so the whole job of this section is to make somebody check.
console.log('\nQuantifiers over sets that grow  (FLAG = go and count it; never a failure)');
const QUANT = /\b(exactly (?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)|all (?:three|four|five|six|seven|eight|nine|ten|\d+)|the rest of the|every one of them|both of them|the only one|the last (?:two|three|four|five|six))\b/gi;
const hits = [];
for (const f of FILES) {
  if (/MAINTENANCE\.md$/.test(f)) continue;       // it is the file defining the pattern
  if (registerOf(f).isReg) continue;              // corrected, never rewritten
  read(f).split('\n').forEach((l, i) => { for (const m of l.matchAll(QUANT)) hits.push([rel(f), i + 1, m[0], l.trim().slice(0, 96)]); });
}
if (VERBOSE) for (const [file, n, word, text] of hits) flag(`${file}:${n}  "${word}"  ${text}`);
else console.log(`        ${hits.length} in live files. --verbose to list them, then go and count each set.`);
if (!hits.length) console.log('        ZERO hits is evidence the grep is broken, not that the tree is clean.');

// 6 -- CLOSED MATERIAL INSIDE A LIVE LIST. A struck heading is easy to spot; a
// finished paragraph under a live heading is not, and AI.md's Open list was 176
// lines of 448 that way.
console.log('\nClosed items sitting inside live files');
const CLOSED = /~~|\*\*(BUILT|CLOSED|RESOLVED|DONE|ANSWERED|RETIRED)\b/g;
let closed = 0;
for (const f of FILES) {
  if (registerOf(f).isReg) continue;
  const n = [...read(f).matchAll(CLOSED)].length;
  if (!n) continue;
  closed += n;
  if (VERBOSE) flag(`${rel(f)}: ${n} closed marker(s)`);
}
console.log(`        ${closed} in live files. Some are corrections that must stay; the question is whether any is a finished item taking up room in a list somebody has to scan.`);

// 7 -- HAND-LISTED ARCHIVES. The specific failure that has cost this tree three
// preserved artifacts, twice from one file.
//
// THE RULE IS NOT "do not name an archive". A register naming its OWN archives
// is the roll, and every register here holds one; citing one or two of somebody
// else's is an ordinary link. The failure is a file holding a ROLL of somebody
// else's archives -- three or more of one register, which reads as a complete
// list, is not the file anyone updates when a new one is created, and falls
// behind taking its pointers with it. CREDITS.md held four of LOGBOOK's.
//
// The threshold is three because two is where AI.md legitimately sits: it is the
// only place its folder and both its archives are indexed together, on purpose.
console.log('\nHand-listed archives');
let rolls = 0;
for (const f of FILES) {
  const own = path.basename(f).replace(/(-ARCHIVE-\d+)?\.md$/, '');
  const byRegister = new Map();
  for (const m of read(f).matchAll(/([A-Z][A-Z-]*)-ARCHIVE-\d+\.md/g)) {
    if (m[1] === own) continue;
    if (!byRegister.has(m[1])) byRegister.set(m[1], new Set());
    byRegister.get(m[1]).add(m[0]);
  }
  for (const [reg, set] of byRegister) {
    if (set.size < 3) continue;
    flag(`${rel(f)} lists ${set.size} of ${reg}'s archives by hand. ${reg}.md holds that roll and is what gets updated when a new one is created; this copy falls behind and takes its pointers with it`);
    rolls++;
  }
}
if (!rolls) pass('no file holds a roll of another register\'s archives');

// 8 -- DESIGNATIONS. A designation is a session, not a job. Two rows sharing one
// is a credit that cannot be attributed, which is the whole point of the table.
console.log('\nDesignations in CREDITS.md');
const cred = path.join(ROOT, 'CREDITS.md');
if (fs.existsSync(cred)) {
  const seen = new Map();
  read(cred).split('\n').filter(l => l.startsWith('|')).forEach(l => {
    const m = l.match(/\|\s*\*\*[^|]*?\*\*\s*#(\d+)\s*\|/);
    if (m) seen.set(m[1], (seen.get(m[1]) || 0) + 1);
  });
  const dupes = [...seen].filter(([, n]) => n > 1);
  for (const [d, n] of dupes) fail(`CREDITS.md has ${n} rows signed #${d}. One instance, one row, however many jobs it did`);
  if (!dupes.length) pass(`${seen.size} designations, none duplicated`);
}

// 9 -- TABLE HYGIENE. A blank or one-cell line inside a table ends it, and every
// row below renders as a stray fragment. It looks fine in the source, which is
// why it has survived twice for days at a time.
//
// `| | |` FOLLOWED BY A SEPARATOR IS NOT THAT BUG. It is the headerless-table
// idiom this tree uses in a dozen places, and the first draft of this check
// reported all thirteen of them as defects.
console.log('\nTable rows');
let bad = 0;
for (const f of FILES) {
  const ls = read(f).split('\n');
  ls.forEach((l, i) => {
    const t = l.trim();
    if (!t.startsWith('|')) return;
    const inTable = (ls[i - 1] || '').trim().startsWith('|') || (ls[i + 1] || '').trim().startsWith('|');
    if (!inTable) return;
    const nextIsSeparator = /^\|[\s:|-]+\|$/.test((ls[i + 1] || '').trim());
    if (t.split('|').filter(c => c.trim()).length === 0) {
      if (nextIsSeparator) return;   // the headerless-table idiom, on purpose
      fail(`${rel(f)}:${i + 1} is an empty row inside a table — it ends the table, and everything under it renders as stray fragments`);
      bad++;
    } else if (!t.endsWith('|')) {
      fail(`${rel(f)}:${i + 1} is a table row with no closing pipe`);
      bad++;
    }
  });
}
if (!bad) pass('no empty rows and no missing closing pipes');

console.log(`\n${fails} FAIL, ${flags} FLAG.`);
console.log(fails
  ? 'FAIL is wrong and fixable. FLAG is "go and look" — sections 2, 5 and 6 always have some.\n'
  : 'Nothing mechanically wrong. FLAG is "go and look" — sections 2, 5 and 6 always have some.\n');
process.exitCode = 0;   // never blocks anything; it reports.

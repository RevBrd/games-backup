// What Trevor said each card wants, and which of it has been turned into a claim.
//
//   node tools/wants.js                     summary, every live set
//   node tools/wants.js base1               the notes for one set, in full
//   node tools/wants.js base1 --todo        ...only the ones with no claim yet
//   node tools/wants.js --coverage          the backlog readout
//   node tools/wants.js Nidoking            one card, by name or id
//
// WHY THIS EXISTS. `PLAYBOOK.md` says the `Wants` column of the newest workbook
// in `data/v1 Opp Decks/` is the inbox and there is no second one. That was true
// and nothing could read it, so the inbox was only reachable by opening Excel —
// which meant nobody could answer "how much is left" without doing it by hand,
// and the one time somebody tried they read a stale workbook and got a third of
// the real number.
//
// THE COUNT THAT MATTERS IS CLAIMS, NOT NOTES, AND THIS IS THE WHOLE REASON FOR
// THE --coverage MODE. One note is not one claim. Dark Alakazam's is six: hit and
// run with Teleport Blast; hide behind fodder; hide behind a tank instead, which
// is a different trade; Mind Shock when they resist Psychic; Mind Shock when the
// extra 10 is lethal; stay in when they are harmless. If coverage counted notes
// touched, that card reads DONE the moment one of the six is tested and the other
// five are invisible forever. So a note is "covered" only in the weakest sense
// this tool can honestly report — at least one claim points at it — and the note's
// own text is printed beside its claims so the gap stays visible to a human.
//
// IT DOES NOT ROUTE. An earlier pass tried to auto-detect the pattern by pulling
// capitalised terms out of the prose. It found "Bench Manipulation" and "Poison
// Vapor" and "Mega Punch" — attack names, not vocabulary — and it would have filed
// cards under patterns that do not exist. Trevor writes the pattern name inline
// when he means it and misspells it sometimes ("Kamakaze"); reading that is a
// person's job. This tool reports, it does not classify.

const fs = require('fs');
const path = require('path');
const { openWorkbook, tabulate, newestWorkbook } = require('./lib/xlsx.js');

const ROOT = path.join(__dirname, '..');
const WB_DIR = path.join(ROOT, 'data', 'v1 Opp Decks');
const CLAIMS_DIR = path.join(__dirname, 'claims');

// Which sets the game actually gates open. A note on a set that is not live is
// filed early, not missing — PLAYBOOK.md is explicit about that — so it is
// counted separately rather than shown as a gap.
const LIVE = ['base1', 'base2', 'base3', 'base5'];
const SET_NAME = { base1: 'Base Set', base2: 'Jungle', base3: 'Fossil',
                   base4: 'Base Set 2', base5: 'Team Rocket', basep: 'Promos' };

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const target = args.find(a => !a.startsWith('--')) || null;

// ---- the inbox -------------------------------------------------------------

const picked = newestWorkbook(WB_DIR);
console.log(`workbook: ${picked.name}  (${picked.mtime.toISOString().slice(0, 10)})`);
if (picked.others.length) console.log(`          ${picked.others.length} older not read`);

const rows = tabulate(openWorkbook(picked.file).sheet('Index'));

const notes = rows
  .filter(r => r.ID && r.Wants && r.Wants.trim().length > 3)
  .map(r => ({
    id: r.ID.trim(),
    card: (r.Card || '').trim(),
    set: r.ID.split('-')[0],
    gated: (r['Gated Until (promo only)'] || '').trim(),
    pressure: (r.Pressure || '').trim(),
    note: r.Wants.trim(),
  }));

// The NH twins carry the same sentence as their holo counterpart, so counting
// rows double-counts the work. Group by note text; the claim covers both cards.
const groups = new Map();
for (const n of notes) {
  const key = n.set + '|' + n.note.toLowerCase();
  if (!groups.has(key)) groups.set(key, { ...n, cards: [], ids: [] });
  const g = groups.get(key);
  g.cards.push(n.card);
  g.ids.push(n.id);
}
const claimsNeeded = [...groups.values()];

// ---- what has been claimed -------------------------------------------------

function loadClaims() {
  if (!fs.existsSync(CLAIMS_DIR)) return [];
  const out = [];
  for (const f of fs.readdirSync(CLAIMS_DIR).filter(f => f.endsWith('.js'))) {
    const mod = require(path.join(CLAIMS_DIR, f));
    for (const c of (mod.CLAIMS || mod)) out.push({ ...c, _file: f });
  }
  return out;
}
const claims = loadClaims();
const claimsFor = id => claims.filter(c => c.id === id || (c.ids || []).includes(id));

// ---- drift: has a note been REWRITTEN since its claim was written? ---------
//
// The dangerous case, and it runs on every invocation because it is cheap and
// because nobody would remember to ask for it. A claim quotes Trevor's note
// verbatim so a reader can check the row against the sentence it came from — and
// the moment he revises that sentence, the row is silently testing something he
// no longer says. It still passes. Nothing else in the project can see it.
//
// This is the same shape as every other stale-claim failure in the tree: a fact
// asserted about two things that decays whenever either one moves. Here the two
// things are a spreadsheet cell and a JS string, which cannot possibly stay in
// step on their own.
//
// A note VANISHING matters too, and differently: it means the card lost its
// `Wants`, so the claim is now orphaned rather than wrong.
const norm = s => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
const noteById = {};
for (const n of notes) noteById[n.id] = n.note;

const drift = [];
const orphan = [];
const checked = new Set();
for (const c of claims) {
  if (!c.note || !c.id || c.note.startsWith('(')) continue;    // '(' marks a claim with no workbook note
  const key = c.id + '|' + c.note;
  if (checked.has(key)) continue;
  checked.add(key);
  const cur = noteById[c.id];
  if (cur === undefined) orphan.push(c);
  else if (norm(cur) !== norm(c.note)) drift.push({ c, cur });
}
if (drift.length || orphan.length) {
  console.log('');
  for (const { c, cur } of drift) {
    console.log(`  !! REWRITTEN  ${c.card} (${c.id}) — the claim quotes a note Trevor has since changed`);
    console.log(`     claim: ${c.note.slice(0, 110)}`);
    console.log(`     now:   ${cur.slice(0, 110)}`);
  }
  for (const c of orphan) {
    console.log(`  !! ORPHANED   ${c.card} (${c.id}) — no Wants on this card in the current workbook`);
  }
  console.log('  Re-read the note and the row together. A claim that still passes against a');
  console.log('  sentence he no longer stands behind is the worst outcome here, not the best.');
}

// ---- output ----------------------------------------------------------------

const isLive = g => LIVE.includes(g.set) && !g.gated;
const wrap = (s, w, pad) => {
  const words = s.split(/\s+/); const lines = []; let cur = '';
  for (const x of words) {
    if ((cur + ' ' + x).trim().length > w) { lines.push(cur.trim()); cur = x; }
    else cur += ' ' + x;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.map((l, i) => (i ? pad : '') + l).join('\n');
};

function showGroup(g) {
  const cs = claimsFor(g.ids[0]);
  const mark = cs.length ? `${cs.length} claim${cs.length > 1 ? 's' : ''}` : 'no claims';
  const names = g.cards.length > 1 ? `${g.cards[0]} (+${g.cards.length - 1})` : g.cards[0];
  console.log(`\n  ${names.padEnd(22)} ${g.ids[0].padEnd(10)} ${mark}`);
  console.log('    ' + wrap(g.note, 84, '    '));
  for (const c of cs) console.log(`      · ${c.claim}`);
}

if (flags.has('--coverage')) {
  console.log('\nBACKLOG — live sets, one row per distinct note\n');
  console.log('  set          notes   claimed   claims   unclaimed');
  let tn = 0, tc = 0, tk = 0;
  for (const s of LIVE) {
    const g = claimsNeeded.filter(x => x.set === s && !x.gated);
    const done = g.filter(x => claimsFor(x.ids[0]).length);
    const nclaims = g.reduce((a, x) => a + claimsFor(x.ids[0]).length, 0);
    tn += g.length; tc += done.length; tk += nclaims;
    console.log(`  ${(SET_NAME[s] || s).padEnd(12)} ${String(g.length).padStart(5)}   ${String(done.length).padStart(7)}   ${String(nclaims).padStart(6)}   ${String(g.length - done.length).padStart(9)}`);
  }
  console.log(`  ${'TOTAL'.padEnd(12)} ${String(tn).padStart(5)}   ${String(tc).padStart(7)}   ${String(tk).padStart(6)}   ${String(tn - tc).padStart(9)}`);
  const gated = claimsNeeded.filter(x => x.gated || !LIVE.includes(x.set));
  console.log(`\n  ${gated.length} more notes are filed early — gated or on a set that is not live.`);
  console.log('  A note is "claimed" if ANY claim points at it. That is the weak reading;');
  console.log('  read the notes themselves to see whether every clause is covered.');
  process.exit(0);
}

if (target) {
  const key = target.toLowerCase();
  let sel = claimsNeeded.filter(g => g.set === key);
  if (!sel.length) sel = claimsNeeded.filter(g =>
    g.ids.some(i => i.toLowerCase() === key) ||
    g.cards.some(c => c.toLowerCase().includes(key)));
  if (!sel.length) { console.log(`\nnothing matching "${target}".`); process.exit(1); }
  if (flags.has('--todo')) sel = sel.filter(g => !claimsFor(g.ids[0]).length);
  const label = SET_NAME[key] || target;
  console.log(`\n${label} — ${sel.length} note${sel.length === 1 ? '' : 's'}${flags.has('--todo') ? ' with no claim yet' : ''}`);
  sel.forEach(showGroup);
  console.log('');
  process.exit(0);
}

console.log('\nNOTES BY SET — distinct texts, NH twins collapsed\n');
for (const s of [...LIVE, 'basep']) {
  const g = claimsNeeded.filter(x => x.set === s);
  const live = g.filter(isLive).length;
  const lens = g.map(x => x.note.length).sort((a, b) => a - b);
  const med = lens.length ? lens[Math.floor(lens.length / 2)] : 0;
  console.log(`  ${(SET_NAME[s] || s).padEnd(12)} ${String(g.length).padStart(4)} notes` +
              `   ${String(live).padStart(4)} live` +
              `   median ${String(med).padStart(4)} chars` +
              `   ${String(g.filter(x => x.note.length > 200).length).padStart(3)} over 200`);
}
console.log(`\n  ${claimsNeeded.filter(isLive).length} live notes total, ${claims.length} claims written.`);
console.log('  node tools/wants.js base1 --todo     what is left on a set');
console.log('  node tools/wants.js --coverage       the backlog readout\n');

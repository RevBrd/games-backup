// Trevor's opponent workbook, read from the LIVE Google Sheet instead of an export.
//
//   const { readIndex, freshness, syncIndex } = require('./lib/sheet.js');
//
// WHAT CHANGED AND WHY. Until Job 15f the inbox was whichever `.xlsx` in
// `data/v1 Opp Decks/` had the newest mtime, and Trevor kept it current by
// exporting one by hand. `xlsx.js` was written because nothing could read those
// files; this module exists because by 7 Sep 2026 nothing was reading the RIGHT
// one. The newest local export was Team Rocket at 24 Aug. The live Team Rocket
// sheet had been edited on 4 Sep, and a whole Gym Heroes workbook — 126 new gym1
// rows on top of the same 339 — existed only on Drive.
//
// So the tool was doing exactly what it was built to prevent, by a door it could
// not see: it reported the file it opened, honestly, and that file had quietly
// stopped being the newest thing in the world. A guard against staleness that
// only watches one folder is a guard against staleness in that folder.
//
// THREE FACTS ABOUT THE SOURCE, EACH OF WHICH SHAPED SOMETHING HERE.
//
// 1. The sheet is PUBLISHED TO THE WEB as CSV (Trevor, 7 Sep 2026), so this file
//    fetches it with no credentials and no connector. The `/d/e/2PACX-.../pub` id
//    is the publish id, not the document id — it grants read of one tab and cannot
//    be walked back to the editable doc. `gid` selects the tab; ours is `Index`.
//
// 2. Google sends NO `Last-Modified` and NO `ETag`, only `cache-control: max-age=300`.
//    There is therefore no cheap way to ask the web whether the sheet has changed,
//    and a fetch can be up to five minutes behind an edit. A conditional GET was
//    the obvious design and it is not available.
//
// 3. Google Drive for Desktop mounts the sheet at `G:\` as a 177-byte stub that
//    CANNOT BE READ — `EISDIR` in Node, `Incorrect function` in both shells — but
//    whose MTIME TRACKS THE LIVE DOCUMENT EXACTLY. Verified against the Drive API
//    on 7 Sep: stub 2026-09-04T20:41, API `modifiedTime` 2026-09-04T20:41:00.514Z.
//    That is the freshness signal this module runs on: free, offline, instant, and
//    the one thing HTTP would not give us.
//
// WHY A CACHE AT ALL, WHEN THE FETCH IS FREE. `progresstest.js` reads this same
// Index tab as a drift guard on `PROMO_GATES`, and it is IN THE GATE. A suite that
// reaches the network is a suite that fails on a train. So nothing here fetches
// unless asked: `readIndex()` is pure filesystem, and `syncIndex()` is the only
// thing that opens a socket. The cache is committed for the same reason — a fresh
// clone has to be able to run `node tools/test.js`.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

// The published Index tab. One entry today; add a row rather than a parameter if
// a second sheet is ever published, so a caller still cannot pick the wrong one.
const SOURCE = {
  title: 'Gym Heroes Opponent Decks v1',
  tab: 'Index',
  url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJ2dYhGl1W0yq8Kvh0oS58vPptb3tLDatKbQJ0KcQGB5wvQUsegCXZP8r5wZNVewRSrn4SV0QnyeIp/pub?gid=1282069851&single=true&output=csv',
  stub: 'G:/My Drive/Shadowless Data/Gym Heroes Opponent Decks v1.gsheet',
  cache: path.join(ROOT, 'data', 'wants-index.csv'),
  meta: path.join(ROOT, 'data', 'wants-index.meta.json'),
};

// ---- CSV -------------------------------------------------------------------
// RFC 4180, because the `Wants` column is full paragraphs with commas in them and
// several carry embedded newlines. A split on ',' would have shredded the payload
// this whole system exists to read.

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  let row = [], field = '', quoted = false, i = 0;
  while (i < text.length) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { quoted = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Objects keyed by HEADER TEXT, the same contract `xlsx.js`'s `tabulate` offered —
// so a column moving left or right in the spreadsheet breaks nothing, and every
// caller that read the workbook keeps working unchanged.
//
// Blank headers are dropped. The Index tab has two, plus a `Feature Tier Key`
// legend column parked out to the right; none of them is data.
function tabulate(grid) {
  const hdr = grid[0] || [];
  const names = hdr.map(h => String(h).trim());
  const out = [];
  for (let r = 1; r < grid.length; r++) {
    const o = { _row: r + 1 };
    let any = false;
    for (let c = 0; c < names.length; c++) {
      if (!names[c]) continue;
      const v = grid[r][c];
      if (v === undefined) continue;
      o[names[c]] = v;
      if (String(v).trim()) any = true;
    }
    if (any) out.push(o);
  }
  return out;
}

// ---- reading (never touches the network) -----------------------------------

function readIndex() {
  if (!fs.existsSync(SOURCE.cache)) {
    throw new Error(
      `no snapshot at ${path.relative(ROOT, SOURCE.cache)}.\n` +
      `  Run:  node tools/wants.js --sync`);
  }
  const csv = fs.readFileSync(SOURCE.cache, 'utf8');
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(SOURCE.meta, 'utf8')); } catch (e) { /* reported by freshness */ }
  return { rows: tabulate(parseCsv(csv)), meta, source: SOURCE };
}

// Has Trevor edited the sheet since this snapshot was taken? Answered from the
// Drive stub's mtime, so it costs nothing and works with the network down. It
// CANNOT answer when Drive for Desktop is not mounted, and says so rather than
// guessing — an unknown reported as "current" is the failure this replaced.
function freshness(meta) {
  let live = null;
  try { live = fs.statSync(SOURCE.stub).mtime; } catch (e) { /* not mounted */ }
  if (!live) return { state: 'unknown', why: `Drive is not mounted at ${SOURCE.stub}` };
  const taken = meta && meta.sourceMtime ? new Date(meta.sourceMtime) : null;
  if (!taken) return { state: 'unknown', why: 'the snapshot records no source mtime', live };
  const drift = Math.round((live - taken) / 1000);
  if (drift > 2) return { state: 'stale', live, taken, drift };
  return { state: 'current', live, taken };
}

// ---- syncing (the only thing here that opens a socket) ---------------------

// REFUSES RATHER THAN OVERWRITES, on three separate grounds, because the failure
// mode being guarded is a good snapshot replaced by a bad one — which is worse
// than no sync at all and would not look like an error afterwards.
//
// Unpublishing the sheet does not produce a 404. Google serves an HTML page, and
// it can serve it with a 200, so the status code alone proves nothing.
async function syncIndex({ force = false, url = SOURCE.url } = {}) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status} ${res.statusText}`);

  const ctype = res.headers.get('content-type') || '';
  if (!ctype.includes('csv')) {
    throw new Error(
      `the URL returned ${ctype || 'no content-type'}, not CSV.\n` +
      `  The sheet has most likely been unpublished, or the publish was re-made and\n` +
      `  the URL in tools/lib/sheet.js is now a dead one. Nothing was overwritten.`);
  }

  const text = await res.text();
  const grid = parseCsv(text);
  const hdr = (grid[0] || []).map(h => String(h).trim());
  for (const need of ['ID', 'Card', 'Wants']) {
    if (!hdr.includes(need)) {
      throw new Error(
        `the CSV has no "${need}" column — this is not the Index tab.\n` +
        `  Check the gid in tools/lib/sheet.js. Nothing was overwritten.`);
    }
  }
  const rows = tabulate(grid);
  const withId = rows.filter(r => r.ID && String(r.ID).trim()).length;

  // A partial publish, or a sheet mid-edit, arrives as a short but perfectly
  // well-formed CSV. Losing two hundred of Trevor's paragraphs to one would be
  // silent and permanent, so shrinkage is a refusal and not a warning.
  let had = 0;
  if (fs.existsSync(SOURCE.cache)) {
    had = tabulate(parseCsv(fs.readFileSync(SOURCE.cache, 'utf8')))
      .filter(r => r.ID && String(r.ID).trim()).length;
  }
  if (had && withId < had * 0.8 && !force) {
    throw new Error(
      `the fetched sheet has ${withId} rows against the snapshot's ${had} — a drop of ` +
      `${Math.round((1 - withId / had) * 100)}%.\n` +
      `  Refusing to overwrite. If Trevor really did delete that much, re-run with --force.`);
  }

  let stub = null;
  try { stub = fs.statSync(SOURCE.stub).mtime.toISOString(); } catch (e) { /* not mounted */ }

  const meta = {
    title: SOURCE.title,
    tab: SOURCE.tab,
    url: SOURCE.url,
    fetchedAt: new Date().toISOString(),
    sourceMtime: stub,
    bytes: text.length,
    rows: withId,
  };
  fs.writeFileSync(SOURCE.cache, text);
  fs.writeFileSync(SOURCE.meta, JSON.stringify(meta, null, 2) + '\n');
  return { meta, rows, before: had };
}

// ---- the escape hatch ------------------------------------------------------
//
// Reads the old way, out of the newest `.xlsx` in `data/v1 Opp Decks/`. It is not
// a legacy path kept out of sentiment: it is what this project falls back to if
// the publish is ever revoked, and it is `xlsx.js`'s only remaining caller, so the
// reader stays exercised rather than becoming two hundred lines of dead code
// nobody notices has rotted. `node tools/wants.js --xlsx` runs it.
function readIndexFromWorkbook() {
  const { openWorkbook, tabulate: xtab, newestWorkbook } = require('./xlsx.js');
  const picked = newestWorkbook(path.join(ROOT, 'data', 'v1 Opp Decks'));
  return {
    rows: xtab(openWorkbook(picked.file).sheet('Index')),
    meta: { title: picked.name, tab: 'Index', fetchedAt: picked.mtime.toISOString(),
            sourceMtime: picked.mtime.toISOString(), rows: null, offline: true },
    source: { ...SOURCE, title: picked.name },
    others: picked.others,
  };
}

module.exports = { SOURCE, parseCsv, tabulate, readIndex, freshness, syncIndex, readIndexFromWorkbook };

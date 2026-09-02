// A minimal .xlsx reader. No dependencies, and that is the point.
//
// Trevor's opponent workbooks in `data/v1 Opp Decks/` are the inbox for every
// plain-English note about how a card wants to be played — 148 distinct ones on
// the live sets as of 23 Aug 2026 — and until now NOTHING in the project could
// read them. `DATA.md` called them reference-only for that reason. They are not
// reference; they are the source PLAYBOOK.md's whole method runs on.
//
// An .xlsx is a ZIP of XML, so this is a small ZIP reader plus enough SpreadsheetML
// to get cell values out of a worksheet. It handles what these workbooks actually
// contain and deliberately not one thing more: no formulas (it reads the CACHED
// value, which is what we want), no styles, no dates, no merged cells.
//
// WHAT IT REFUSES TO DO. It will not guess which workbook you meant — see
// `newestWorkbook` below. Being pointed at a stale workbook is not hypothetical:
// this file exists because a session read `Challenge 1` believing it was current,
// concluded Team Rocket had no notes at all, and sized a job at a third of its
// real weight off that. The reader prints what it opened, every time.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---- ZIP ------------------------------------------------------------------
// Central-directory walk. We scan back from the end for the End Of Central
// Directory record rather than trusting a fixed offset, because the comment
// field is variable-length.

function unzip(file) {
  const buf = fs.readFileSync(file);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 65558; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error(`${path.basename(file)} is not a zip (no EOCD record)`);

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map();

  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory entry');
    const method   = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen  = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commLen  = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name     = buf.toString('utf8', p + 46, p + 46 + nameLen);

    // The local header repeats the name and carries its OWN extra field, whose
    // length routinely differs from the central one. Read it rather than assuming.
    const lNameLen  = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compSize);

    if (method === 0) out.set(name, raw);
    else if (method === 8) out.set(name, zlib.inflateRawSync(raw));
    // anything else (bzip2, lzma) we simply do not carry; Sheets and Excel emit 8.

    p += 46 + nameLen + extraLen + commLen;
  }
  return out;
}

// ---- XML ------------------------------------------------------------------

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = s => s
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENT[e]);

// A shared string is <si> with one <t>, or several <t> inside <r> runs when the
// cell carries mixed formatting. Trevor bolds words inside notes, so the run form
// is common here and concatenating is the only correct reading.
function sharedStrings(zip) {
  const xml = zip.get('xl/sharedStrings.xml');
  if (!xml) return [];
  const s = xml.toString('utf8');
  const out = [];
  for (const si of s.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    let t = '';
    for (const m of si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) t += m[1];
    out.push(decode(t));
  }
  return out;
}

// ---- sheets ---------------------------------------------------------------

// Returns { name -> sheetPath } in workbook order, so "the first tab" is a thing
// you can ask for by position and the Index tab is findable by name.
function sheetIndex(zip) {
  const wb = zip.get('xl/workbook.xml').toString('utf8');
  const rels = zip.get('xl/_rels/workbook.xml.rels').toString('utf8');
  const byId = {};
  for (const m of rels.matchAll(/<Relationship([^>]*)\/>/g)) {
    const id = /Id="([^"]+)"/.exec(m[1]), tgt = /Target="([^"]+)"/.exec(m[1]);
    if (id && tgt) byId[id[1]] = tgt[1].replace(/^\/?xl\//, '').replace(/^\//, '');
  }
  const out = [];
  for (const m of wb.matchAll(/<sheet([^>]*)\/>/g)) {
    const nm = /name="([^"]*)"/.exec(m[1]);
    const rid = /r:id="([^"]+)"/.exec(m[1]);
    if (nm && rid && byId[rid[1]]) out.push({ name: decode(nm[1]), path: 'xl/' + byId[rid[1]] });
  }
  return out;
}

// One sheet -> { rowNumber: { COL: value } }. Empty cells are absent rather than
// present-and-blank, so `if (r.I)` is a safe test for "this card has a note".
function readSheet(zip, sheetPath, strs) {
  const xml = zip.get(sheetPath).toString('utf8');
  const rows = {};
  for (const rm of xml.matchAll(/<row[^>]*\sr="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    for (const cm of rm[2].matchAll(/<c\s+r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const [, col, attrs, inner] = cm;
      const t = /t="([^"]+)"/.exec(attrs);
      let val = null;
      if (t && t[1] === 'inlineStr') {
        let s = '';
        for (const m of inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) s += m[1];
        val = decode(s);
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner);
        if (v) val = (t && t[1] === 's') ? strs[+v[1]] : decode(v[1]);
      }
      if (val !== null && val !== '') cells[col] = val;
    }
    if (Object.keys(cells).length) rows[+rm[1]] = cells;
  }
  return rows;
}

// ---- the public shape -----------------------------------------------------

function openWorkbook(file) {
  const zip = unzip(file);
  const strs = sharedStrings(zip);
  const sheets = sheetIndex(zip);
  return {
    file,
    sheetNames: sheets.map(s => s.name),
    sheet(nameOrIndex = 0) {
      const s = typeof nameOrIndex === 'number'
        ? sheets[nameOrIndex]
        : sheets.find(x => x.name.toLowerCase() === String(nameOrIndex).toLowerCase());
      if (!s) throw new Error(`no sheet ${nameOrIndex} in ${path.basename(file)}; has ${sheets.map(x => x.name).join(', ')}`);
      return readSheet(zip, s.path, strs);
    },
  };
}

// Rows keyed by number are awkward to work with. This turns a sheet into objects
// keyed by the HEADER TEXT, which is what every caller actually wants — and it
// means a column moving left or right in the spreadsheet breaks nothing.
function tabulate(rows, headerRow = 1) {
  const hdr = rows[headerRow] || {};
  const names = {};
  for (const col of Object.keys(hdr)) names[col] = String(hdr[col]).trim();
  const out = [];
  for (const k of Object.keys(rows).map(Number).sort((a, b) => a - b)) {
    if (k <= headerRow) continue;
    const rec = { _row: k };
    let any = false;
    for (const col of Object.keys(rows[k])) {
      const name = names[col];
      if (!name) continue;                    // scratch cells past the header
      rec[name] = String(rows[k][col]).trim();
      any = true;
    }
    if (any) out.push(rec);
  }
  return out;
}

// THE ANTI-GUESSING RULE. Trevor's method is to duplicate the previous workbook,
// add the next set, and keep filling in — so each is a strict superset of the last
// and the newest is the only one worth reading. Newest by mtime, and it SAYS which
// one it chose, because the failure this prevents is silent.
function newestWorkbook(dir) {
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'))
    .map(f => ({ f, m: fs.statSync(path.join(dir, f)).mtime }))
    .sort((a, b) => b.m - a.m);
  if (!files.length) throw new Error(`no .xlsx in ${dir}`);
  return { file: path.join(dir, files[0].f), name: files[0].f, mtime: files[0].m,
           others: files.slice(1).map(x => x.f) };
}

module.exports = { openWorkbook, tabulate, newestWorkbook, unzip };

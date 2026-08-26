#!/usr/bin/env node
// ============================================================================
// probe.js — measure the SAME board in several UI states and diff the geometry.
//
// Why this exists, and why it is not shot.js or smoke.js:
//
//   * smoke.js has no layout engine at all. A stubbed DOM has no cascade, no
//     containing blocks and no flexbox, so it cannot see a size.
//   * shot.js renders one state at a time, as a picture. The picture is also
//     stretched relative to the layout, so it is the wrong instrument for
//     "did this get 9px taller".
//
// The bug class this is for — "the board resizes itself when something happens"
// — is a COMPARISON between two states, which is exactly what neither of those
// can do. #20 hit that wall in Aug 2026, built a throwaway Chrome probe, found
// the hand-height fault with it, and threw it away. This is that instrument,
// kept.
//
//   node tools/probe.js                          # every state, 1366x768
//   node tools/probe.js --size 1191x684          # Trevor's real viewport
//   node tools/probe.js --only ko,prompt-long
//   node tools/probe.js --setup                  # the opening-setup screen
//   node tools/probe.js --pack                   # the booster-pack reveal
//   node tools/probe.js --state "myown:UI.sel={idx:0}"
//   node tools/probe.js --raw-json               # the measurements, unformatted
//   node tools/probe.js --eval "<expression>"    # re-derive a MEASURED number
//
// READ THIS BEFORE BELIEVING A ROW. Every state is applied to one board in one
// page load, measured, and then reverted — so a row that differs from `idle`
// differs because of the state and nothing else. If a revert is incomplete the
// error accumulates down the table, so `idle` is measured AGAIN at the end and
// the tool shouts if the two disagree. That check is the control; it is not
// decoration, and it caught nothing only because it was written first.
// ============================================================================

const fs = require('fs');
const path = require('path');
const C = require('./lib/chrome.js');

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const flag = (name) => process.argv.includes('--' + name);
const argAll = (name) => process.argv.reduce(
  (acc, v, i) => (v === '--' + name && process.argv[i + 1] ? acc.concat(process.argv[i + 1]) : acc), []);

// --- the states -------------------------------------------------------------
// Each is a pair of snippets: `on` puts the UI into the state, `off` takes it
// back out. Both run in the page. `render()` is called by the harness after
// each, so a state only has to set the flag the renderer reads.
//
// The board states are deliberately the ones that appear ON THE CENTRE LINE,
// because that strip is shared by four different things and is the one part of
// the mat whose content is not a card.
const BOARD_STATES = [
  { key: 'ko',
    why: 'a Knock Out banner — .kobanner on the centre line',
    on: `UI.fx.ko0 = Date.now() + 600000;`,
    off: `delete UI.fx.ko0;` },
  { key: 'prompt-short',
    why: 'a targeting prompt, short',
    on: `UI.targeting = { scope:'oppBench', prompt:'Choose a Pokemon' };`,
    off: `UI.targeting = null;` },
  { key: 'prompt-long',
    why: "a targeting prompt, the longest real one: Gust of Wind's",
    on: `UI.targeting = { scope:'oppBench', prompt:'Choose which Benched Pokemon to drag into the Active spot' };`,
    off: `UI.targeting = null;` },
  { key: 'coin',
    why: 'a coin in the air — the strip that is SUPPOSED to be zero-height',
    on: `UI.pres = { queue:[], banner:{ phase:'flipping', reason:'Confusion' }, before:null };`,
    off: `UI.pres = null;` },
  { key: 'coin-landed',
    why: 'a coin that has landed, with its reason line',
    on: `UI.pres = { queue:[], banner:{ phase:'landed', result:'HEADS', reason:'Confusion' }, before:null };`,
    off: `UI.pres = null;` },
  { key: 'select',
    why: 'a card in hand selected — Trevor first suspected selection',
    on: `UI.sel = { idx: 0 };`,
    off: `UI.sel = null;` },
  { key: 'hand-big',
    why: 'four more cards in hand — #20 fixed this one; it is the control',
    on: `UI.__hb = UI.E.state.players[0].hand.slice();
         const d = UI.E.state.players[0].deck;
         for (let i = 0; i < 4 && d.length; i++) UI.E.state.players[0].hand.push(d.pop());`,
    off: `UI.E.state.players[0].hand = UI.__hb;` },
];

// The opening-setup screen is a different render path (renderSetup()), so its
// states place cards rather than setting flags. `--setup` swaps the whole table.
const SETUP_STATES = [
  { key: 'active-placed',
    why: 'one Basic moved into the Active spot',
    on: `UI.__basic = () => UI.E.state.players[0].hand.findIndex(
           x => { const c = CARD_DB[x.id]; return c.kind === 'pokemon' && c.stage === 'Basic'; });
         UI.__a = UI.__basic();
         if (UI.__a >= 0) UI.E.setupPlace(0, UI.__a, 'active');`,
    off: `if (UI.__a >= 0) UI.E.setupTakeBack(0, 'active', 0);` },
  { key: 'active-plus-bench',
    why: 'an Active and one benched — does the strip move again',
    on: `UI.__basic = () => UI.E.state.players[0].hand.findIndex(
           x => { const c = CARD_DB[x.id]; return c.kind === 'pokemon' && c.stage === 'Basic'; });
         UI.__n = 0;
         for (let k = 0; k < 2; k++) {
           const i = UI.__basic();
           if (i < 0) break;
           UI.E.setupPlace(0, i, UI.__n === 0 ? 'active' : 'bench');
           UI.__n++;
         }`,
    off: `if (UI.__n > 1) UI.E.setupTakeBack(0, 'bench', 0);
          if (UI.__n > 0) UI.E.setupTakeBack(0, 'active', 0);` },
];

// The pack screen is its own render path too, and its states are how many cards
// have been turned over. `--pack` swaps the table.
//
// COUNTED FROM THE PACK, never written down. These said `reveal-5` / `reveal-10`
// for a pack that had eleven cards; the pack shrank to eight on 25 Aug 2026 and
// `reveal-10` quietly became a duplicate of `reveal-all` — a state that measured
// nothing, in the one instrument built to notice that something moved. Deriving
// the boundary from `UI.pack.revealed.length` means the next reshape cannot do
// it again.
const reset = `UI.pack.revealed = UI.pack.revealed.map(() => false);`;
const PACK_STATES = [
  { key: 'reveal-1', why: 'one card turned over', on: `UI.pack.revealed[0] = true;`,
    off: `UI.pack.revealed[0] = false;` },
  { key: 'reveal-half', why: 'half the strip',
    on: `for (let i = 0; i < Math.floor((UI.pack.revealed.length - 1) / 2); i++) UI.pack.revealed[i] = true;`,
    off: reset },
  { key: 'reveal-strip', why: 'the whole strip, hero still face down',
    on: `for (let i = 0; i < UI.pack.revealed.length - 1; i++) UI.pack.revealed[i] = true;`,
    off: reset },
  { key: 'reveal-all', why: 'the hero too — and the summary line arrives with it',
    on: `UI.pack.revealed = UI.pack.revealed.map(() => true);`, off: reset },
];

// --- what gets measured -----------------------------------------------------
// offsetWidth/offsetHeight everywhere, never getBoundingClientRect: fitBoard()
// zooms the board column, and getBoundingClientRect reports POST-zoom screen
// pixels while offset* reports PRE-zoom layout pixels. Mixing the two is the
// coordinate-space trap in LAYOUT.md, and it only misreports on the viewports
// that needed scaling — which is every viewport that matters.
const MEASURE = `(function () {
  const q = (s) => document.querySelector(s);
  const box = (e) => e ? [e.offsetWidth, e.offsetHeight] : [0, 0];
  const col = UI.boardEl, table = UI.tableEl;
  return {
    zoom:    Math.round((UI.fitZoom || 1) * 1000) / 1000,
    wide:    UI.wideLayout ? 1 : 0,
    col:     col ? [col.clientWidth, col.clientHeight] : [0, 0],
    table:   box(table),
    tblOver: table ? table.scrollHeight - table.clientHeight : 0,
    mat:     box(q('.mat')),
    centre:  box(q('.centreline')),
    setupmat: box(q('.setupmat')),
    // The board renders BEHIND the setup overlay and its empty Active carries
    // .slot.act too, so a shared selector silently measures the placeholder
    // instead of the card you just placed. Two fields, never one.
    // (No backticks in here: this whole block is a template literal.)
    setupRow: box(q('.setupmat .activerow')),
    setupAct: box(q('.setupmat .activerow > *')),
    setupBench: box(q('.setupmat .bench')),
    // The pack screen centres its box in the viewport, so a box that grows
    // moves everything already on screen. packTop is what the eye actually
    // notices: where the title sits.
    packbox: box(q('.packbox')),
    packgrid: box(q('.packgrid')),
    packTop: (function () { var e = q('.packhead'); return e ? [0, Math.round(e.getBoundingClientRect().top)] : [0, 0]; })(),
    pullslot: box(q('.pullslot')),
    myAct:   box(q('.side.mine .slot.act')),
    foeAct:  box(q('.side.foe .slot.act')),
    handpnl: box(UI.handPanelEl),
    bar:     box(UI.barEl),
  };
})()`;

function bootstrap(states, opts) {
  const L = [];
  L.push(`UI.seedDraft = ${JSON.stringify(String(opts.seed))};`);
  L.push(`UI.flipDelay = 0; UI.aiDelay = 100000;`);
  if (opts.pack) {
    // A real pack, opened the way the game opens one: grant one, take it, roll
    // it. Nothing here hand-builds UI.pack, because a fake would not carry the
    // isNew and variant flags the ribbons are made of — and the ribbons are
    // what this mode exists to measure.
    L.push(`UI.save = UI.save || newSave();`);
    L.push(`addPacks(UI.save, ${JSON.stringify(opts.packSet)}, 1);`);
    L.push(`openNextPack(${JSON.stringify(opts.packSet)});`);
    L.push(`render();`);
    L.push(`const OUT = [];`);
    L.push(`const take = (k, why) => OUT.push(Object.assign({ state: k, why: why || '' }, ${MEASURE}));`);
    return finish(L, states, opts);
  }
  L.push(`startMatch();`);
  if (!opts.setup) {
    // setupAuto() confirms for us, which is why nothing here calls
    // setupConfirm — calling it again deals a second set of Prizes and every
    // harness in this repo did exactly that for two months. See MISREADINGS.md.
    L.push(`UI.E.setupAuto(0);`);
    L.push(`for (let i = 0; i < ${opts.turns} && UI.E.state.phase === 'main'; i++) {`);
    L.push(`  const s = UI.E.state;`);
    L.push(`  const pi = s.pendingPromote !== null ? s.pendingPromote`);
    L.push(`    : s.pendingSwitch !== null ? s.pendingSwitch : s.active;`);
    L.push(`  const a = UI.E.aiChoose(pi, 'expert');`);
    L.push(`  if (!a) break; UI.E.act(pi, a);`);
    L.push(`}`);
  }
  L.push(`render();`);
  L.push(`const OUT = [];`);
  L.push(`const take = (k, why) => OUT.push(Object.assign({ state: k, why: why || '' }, ${MEASURE}));`);
  return finish(L, states, opts);
}

// The states, the control and the sink — identical whichever screen we booted.
function finish(L, states, opts) {
  L.push(`take('idle', 'nothing happening — the baseline');`);
  for (const s of states) {
    L.push(`try { ${s.on} } catch (e) { OUT.push({ state: ${JSON.stringify(s.key)}, error: String(e && e.message) }); }`);
    L.push(`render(); take(${JSON.stringify(s.key)}, ${JSON.stringify(s.why)});`);
    L.push(`try { ${s.off} } catch (e) {} render();`);
  }
  // The control: if every revert was clean this is byte-identical to the first
  // row. If it is not, the table above is measuring accumulated drift and the
  // rows cannot be trusted individually.
  L.push("take('idle-again', 'the control - must match idle exactly');");
  // --eval runs one expression after the states and reports whatever it
  // returns. It is here because several numbers in style.css are MEASURED
  // against the whole card pool rather than chosen (the Active's 249px, the
  // hand card's 118px), and re-deriving one has meant a throwaway script every
  // time. Give it an expression, get the number.
  if (opts.evalExpr) {
    L.push(`try { OUT.push({ state: '--eval', evaluated: String(${opts.evalExpr}) }); }`);
    L.push(`catch (e) { OUT.push({ state: '--eval', error: String(e && e.message) }); }`);
  }
  L.push(`const sink = document.createElement('b'); sink.id = 'probeout';`);
  // The sentinel is assembled from halves ON PURPOSE. `--dump-dom` serialises
  // the injected <script> element too, so a literal marker in this source is
  // also in the output and the regex matches the SCRIPT instead of the result.
  L.push(`sink.textContent = 'PRO' + 'BE:' + JSON.stringify(OUT) + ':' + 'END';`);
  L.push(`document.body.appendChild(sink);`);
  return L.join('\n');
}

// --- reporting ---------------------------------------------------------------
const FIELDS = ['zoom', 'wide', 'col', 'table', 'tblOver', 'mat', 'centre',
  'setupmat', 'setupRow', 'setupAct', 'setupBench',
  'packbox', 'packgrid', 'packTop', 'pullslot',
  'myAct', 'foeAct', 'handpnl', 'bar'];
const fmt = (v) => Array.isArray(v) ? v[0] + 'x' + v[1] : String(v);
const same = (a, b) => fmt(a) === fmt(b);

function report(allRows, opts) {
  // The --eval row carries no geometry, so it is reported on its own and never
  // enters the table or the control comparison.
  const evalRow = allRows.find(r => r.state === '--eval');
  const rows = allRows.filter(r => r.state !== '--eval');
  const base = rows[0];
  const last = rows[rows.length - 1];

  // Only print columns that ever move, plus zoom. A table of twelve identical
  // columns hides the one that changed, which is the whole thing we are here to
  // see.
  const live = FIELDS.filter(f => f === 'zoom' ||
    rows.some(r => !r.error && !same(r[f], base[f])));
  const w = {};
  for (const f of live) w[f] = Math.max(f.length, ...rows.map(r => r.error ? 0 : fmt(r[f]).length));
  const nameW = Math.max(...rows.map(r => r.state.length));

  console.log(`\nviewport ${opts.want.w}x${opts.want.h}   seed ${opts.seed}   ` +
    (opts.pack ? 'PACK OPENING - ' + opts.packSet
      : opts.setup ? 'OPENING SETUP' : `turns ${opts.turns}`));
  console.log('  ' + 'state'.padEnd(nameW) + '  ' + live.map(f => f.padStart(w[f])).join('  '));
  console.log('  ' + '-'.repeat(nameW) + '  ' + live.map(f => '-'.repeat(w[f])).join('  '));
  for (const r of rows) {
    if (r.error) { console.log('  ' + r.state.padEnd(nameW) + '  ERROR: ' + r.error); continue; }
    const cells = live.map(f => (same(r[f], base[f]) ? fmt(r[f]) : fmt(r[f]) + '*').padStart(w[f]));
    console.log('  ' + r.state.padEnd(nameW) + '  ' + cells.join('  '));
  }
  console.log('\n  * = differs from `idle`.');

  const moved = rows.slice(1, -1).filter(r => !r.error &&
    FIELDS.some(f => !same(r[f], base[f])));
  console.log('');
  for (const r of moved) {
    const what = FIELDS.filter(f => !same(r[f], base[f]))
      .map(f => `${f} ${fmt(base[f])} -> ${fmt(r[f])}`).join(', ');
    console.log(`  MOVED  ${r.state}: ${r.why}`);
    console.log(`         ${what}`);
  }
  if (!moved.length) console.log('  Nothing moved. Every state measured identical to idle.');

  const drift = FIELDS.filter(f => last && !last.error && !same(last[f], base[f]));
  if (evalRow) {
    console.log('');
    console.log('  --eval  ' + (evalRow.error ? 'ERROR: ' + evalRow.error : evalRow.evaluated));
  }

  console.log('');
  if (drift.length) {
    console.log('  CONTROL FAILED — `idle-again` does not match `idle`: ' + drift.join(', '));
    console.log('  A revert above was incomplete, so the rows are measuring accumulated');
    console.log('  drift and cannot be read individually. Fix the revert, not the game.');
    return 1;
  }
  console.log('  control OK — `idle-again` matches `idle`, so each row stands alone.');
  return 0;
}

function main() {
  const browser = C.findBrowser();
  if (!browser) { console.error('No Chrome or Edge found. Set SHADOWLESS_CHROME.'); process.exit(1); }

  const root = path.resolve(__dirname, '..');
  const srcHtml = path.resolve(root, arg('file', 'shadowless.html'));
  if (!fs.existsSync(srcHtml)) { console.error('Missing ' + srcHtml); process.exit(1); }

  const m = /^(\d+)x(\d+)$/.exec(arg('size', '1366x768'));
  if (!m) { console.error('--size wants WxH'); process.exit(2); }
  const cal = C.calibrate(browser, { w: +m[1], h: +m[2] }, flag('raw'));
  if (!cal) { console.error('Could not calibrate the viewport.'); process.exit(1); }

  const opts = {
    seed: arg('seed', '814247252'),
    turns: parseInt(arg('turns', '4'), 10) || 0,
    setup: flag('setup'),
    pack: flag('pack'),
    packSet: arg('pack-set', 'base5'),
    evalExpr: arg('eval', ''),
    want: cal.want,
  };

  let states = (opts.pack ? PACK_STATES : opts.setup ? SETUP_STATES : BOARD_STATES).slice();
  for (const spec of argAll('state')) {
    const at = spec.indexOf(':');
    if (at < 0) { console.error('--state wants name:js'); process.exit(2); }
    states.push({ key: spec.slice(0, at), why: 'ad hoc', on: spec.slice(at + 1), off: '' });
  }
  const only = arg('only', '');
  if (only) {
    const want = new Set(only.split(',').map(s => s.trim()));
    states = states.filter(s => want.has(s.key));
    if (!states.length) { console.error('No state matched --only ' + only); process.exit(2); }
  }

  const staged = C.stagePage(root, srcHtml, bootstrap(states, opts));
  let dom;
  try {
    dom = C.launch(browser, { url: staged.url, win: cal.win, wait: arg('wait', '5000'), mode: 'dom' });
  } catch (e) {
    console.error('Chrome failed: ' + (e.stderr ? String(e.stderr).trim() : e.message));
    process.exit(1);
  } finally { staged.cleanup(); }

  // Non-greedy up to the sentinel, NOT `\[.*?\]` — the payload is full of
  // `[971,766]` pairs and a lazy bracket match stops at the first one.
  const hit = /PROBE:(.*?):END/s.exec(dom);
  if (!hit) {
    const err = /<title>(PAGE ERROR:[^<]*)<\/title>/.exec(dom);
    console.error(err ? err[1] : 'The probe never reported. Is the page throwing before load?');
    process.exit(1);
  }
  const rows = JSON.parse(hit[1]);
  if (flag('raw-json')) { console.log(JSON.stringify(rows, null, 2)); return; }
  process.exit(report(rows, opts));
}

main();

// Assemble the source modules into the single self-contained shadowless.html.
//
//   node tools/build.js                 -> ../shadowless.html
//   node tools/build.js path/to/out.html
//   node tools/build.js --check         build to memory and diff against the
//                                       committed HTML; exit 1 if they differ
//
// A Node port of the original build.py, which cannot run here — this machine has
// no Python. Behaviour is otherwise identical: concatenate the modules in
// dependency order, inline the CSS, strip the CommonJS export tails.

const fs = require('fs');
const path = require('path');

const HERE = path.join(__dirname, '..');
const SRC = path.join(HERE, 'src');
// collection.js sits between the engine and the UI: it is pure data with no
// dependency on either, and the UI is the only thing that reads it.
const ORDER = ['cards.js', 'effects.js', 'art.js', 'deckgen.js', 'ai.js', 'engine.js', 'collection.js', 'ui.js'];
const TITLE = 'Shadowless — a WotC-era Pokémon TCG';

const read = n => fs.readFileSync(path.join(SRC, n), 'utf8');

// Each module ends with a `if (typeof module ...)` export line so Node can require
// it directly. Those lines are meaningless in a browser and get stripped on the way in.
const stripExports = src => src.replace(/^\s*if \(typeof module.*$/gm, '');

// The stripper is line-anchored, so a module whose export list is wrapped over
// several lines loses only its first line and leaves the orphaned object body
// behind — which builds happily and then dies as "Unexpected token '}'" some
// thousands of lines into the generated HTML. Cost a session once.
//
// This has to run on the SOURCE, not on the stripped output: stripping removes
// the `module.exports = {` along with the rest of the line, so by then there is
// nothing left to recognise. What gives it away is the opening line itself —
// an unbalanced brace, or no closing semicolon.
function checkExportLine(name, src) {
  src.split('\n').forEach((ln, i) => {
    if (!/^\s*if \(typeof module\b/.test(ln)) return;
    const opens = (ln.match(/\{/g) || []).length;
    const closes = (ln.match(/\}/g) || []).length;
    if (opens === closes && /;\s*$/.test(ln)) return;
    console.error(`ERROR: ${name}:${i + 1} — the CommonJS export spans more than one line.`);
    console.error('  tools/build.js strips it with a line-anchored regex, so the rest of');
    console.error('  the export would be left behind in the bundle. Put it on one line.');
    console.error(`  ${ln.trim().slice(0, 90)}`);
    process.exit(1);
  });
}

function build() {
  const js = ORDER.map(f => {
    const src = read(f);
    checkExportLine(f, src);
    return stripExports(src);
  }).join('\n');
  const css = read('style.css');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${TITLE}</title>
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<script>
${js}
</script>
</body>
</html>
`;
}

const html = build();
const args = process.argv.slice(2);

if (args[0] === '--check') {
  const current = fs.readFileSync(path.join(HERE, 'shadowless.html'), 'utf8');
  if (current === html) {
    console.log('shadowless.html is in sync with the sources.');
    process.exit(0);
  }
  console.error('shadowless.html DIFFERS from a fresh build of the sources.');
  console.error(`  built:     ${html.length.toLocaleString()} bytes`);
  console.error(`  committed: ${current.length.toLocaleString()} bytes`);
  const a = html.split('\n'), b = current.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      console.error(`  first difference at line ${i + 1}:`);
      console.error(`    built:     ${JSON.stringify((a[i] ?? '').slice(0, 120))}`);
      console.error(`    committed: ${JSON.stringify((b[i] ?? '').slice(0, 120))}`);
      break;
    }
  }
  process.exit(1);
}

const out = args[0] ? path.resolve(args[0]) : path.join(HERE, 'shadowless.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`wrote ${out}  (${html.length.toLocaleString()} bytes)`);

// Generate src/cards.js (CARD_DB + the theme deck lists) from data/.
//
//   node tools/gen_cards.js                 regenerate src/cards.js
//   node tools/gen_cards.js --check         regenerate to memory and diff; exit 1 if different
//   node tools/gen_cards.js --sets base1,base2,base3
//
// Replaces tools/chat-era/gen_cards.py, which cannot run here: it read a clone of
// the pokemon-tcg-data repo from /tmp and Trevor's P_TCG_Data.xlsx from the Claude
// Chat upload directory, neither of which survived the port. This one reads the
// CSVs in data/, which carry everything CARD_DB holds and more.
//
// The four theme deck lists came from named sheets in that spreadsheet and CANNOT
// be regenerated from the CSVs. They were extracted verbatim into data/decks.json,
// which is now their only home. Treat that file as source, not as output.

const fs = require('fs');
const path = require('path');

const HERE = path.join(__dirname, '..');
const DATA = path.join(HERE, 'data');
const OUT = path.join(HERE, 'src', 'cards.js');

// Which sets to emit. Base Set only for now; widen as the jobs land.
const flagIdx = process.argv.indexOf('--sets');
const argSets = (process.argv.find(a => a.startsWith('--sets=')) || '=').split('=')[1]
  || (flagIdx > -1 ? (process.argv[flagIdx + 1] || '') : '');
const SETS = argSets ? argSets.split(',') : ['base1'];

// --- CSV ------------------------------------------------------------------
function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  text = text.replace(/\r\n/g, '\n');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift();
  return rows.filter(r => r.length > 1)
    .map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}
const load = f => parseCSV(fs.readFileSync(path.join(DATA, f), 'utf8'));

// --- build one CARD_DB entry per kind -------------------------------------
// Key order matters: it is the order they serialise in, and keeping it stable
// keeps regeneration diffs readable.
function pokemonEntry(r) {
  const attacks = [];
  for (const n of ['1', '2', '3']) {
    if (!r[`attack${n}_name`]) continue;
    attacks.push({
      name: r[`attack${n}_name`],
      cost: r[`attack${n}_cost`],
      dmg: r[`attack${n}_damage`],
      text: r[`attack${n}_text`],
    });
  }
  return {
    id: r.card_id, name: r.name, set: r.set_code, num: r.number,
    rarity: r.rarity, artist: r.artist, kind: 'pokemon',
    stage: r.stage, hp: parseInt(r.hp, 10), type: r.type,
    evolvesFrom: r.evolves_from,
    wkType: r.weakness_type, wkVal: r.weakness_value,
    rsType: r.resistance_type, rsVal: r.resistance_value,
    retreat: parseInt(r.retreat_cost, 10),
    attacks,
    // A Pokemon Power is data, not an effect script. effects.js says what it DOES;
    // this says that it exists, so the UI and the coverage report can see it.
    power: r.power_name ? { kind: r.power_type, name: r.power_name, text: r.power_text } : null,
  };
}

const trainerEntry = r => ({
  id: r.card_id, name: r.name, set: r.set_code, num: r.number,
  rarity: r.rarity, artist: r.artist, kind: 'trainer',
  sub: r.subtype, text: r.text,
});

// The CSV leaves `provides` blank for basic Energy (the type is implied by the
// name) and says a useless "any" for every Special. So derive it here.
const TYPE_BY_NAME = {
  Grass: 'G', Fire: 'R', Water: 'W', Lightning: 'L', Psychic: 'P',
  Fighting: 'F', Darkness: 'D', Metal: 'M', Colorless: 'C',
};
const unresolvedEnergy = [];

function energyProvides(r) {
  if (r.name === 'Double Colorless Energy') return 'CC';
  const m = r.name.match(/^(\w+) Energy$/);
  if (m && TYPE_BY_NAME[m[1]]) return TYPE_BY_NAME[m[1]];
  // Rainbow, Full Heal, Potion, Recycle, Miracle — each has its own rules text and
  // will need a hand-authored entry in effects.js when its set lands. Emitting ''
  // rather than a guess keeps the deck validator honest about them.
  unresolvedEnergy.push(`${r.card_id} ${r.name}`);
  return '';
}

const energyEntry = r => ({
  id: r.card_id, name: r.name, set: r.set_code, num: r.number,
  rarity: r.rarity, artist: r.artist, kind: 'energy',
  cls: r.energy_class,
  provides: energyProvides(r),
  text: r.text,
});

// --- assemble -------------------------------------------------------------
const wanted = new Set(SETS);
const keep = r => wanted.has(r.set_code);

const cards = [];
for (const r of load('wotc_pokemon.csv')) if (keep(r)) cards.push(pokemonEntry(r));
for (const r of load('core_trainers.csv')) if (keep(r)) cards.push(trainerEntry(r));
for (const r of load('wotc_energy.csv')) if (keep(r)) cards.push(energyEntry(r));

// Sort by set, then by card number. The Chat-era file was in deck-discovery order,
// which was an artifact of how it was built; set order is what a human wants.
cards.sort((a, b) => a.set.localeCompare(b.set) || (parseInt(a.num, 10) - parseInt(b.num, 10)));

const decks = JSON.parse(fs.readFileSync(path.join(DATA, 'decks.json'), 'utf8'));
const byId = Object.fromEntries(cards.map(c => [c.id, c]));

// Deck lists reference cards by id; if a set is dropped from SETS the lists break.
const missing = [];
for (const k of Object.keys(decks))
  for (const [, id] of decks[k].list) if (!byId[id] && !missing.includes(id)) missing.push(id);
if (missing.length) {
  console.error(`ERROR: data/decks.json references cards not in the generated set: ${missing.join(', ')}`);
  process.exit(1);
}

let out = '// AUTO-GENERATED by tools/gen_cards.js from data/. Do not hand-edit.\n';
out += `// Sets: ${SETS.join(', ')}.  ${cards.length} cards.\n`;
out += 'const CARD_DB = {\n';
for (const c of cards) out += `  ${JSON.stringify(c.id)}: ${JSON.stringify(c)},\n`;
out += '};\n\nconst DECKS = {\n';
for (const k of Object.keys(decks)) {
  out += `  ${JSON.stringify(k)}: { name: ${JSON.stringify(decks[k].name)}, list: [\n`;
  for (const [q, id] of decks[k].list) out += `    [${q}, ${JSON.stringify(id)}],  // ${byId[id].name}\n`;
  out += '  ]},\n';
}
out += '};\n\nif (typeof module !== \'undefined\') module.exports = { CARD_DB, DECKS };\n';

if (process.argv.includes('--check')) {
  const cur = fs.readFileSync(OUT, 'utf8');
  if (cur === out) { console.log('src/cards.js is in sync with data/.'); process.exit(0); }
  console.error('src/cards.js DIFFERS from a fresh generation.');
  process.exit(1);
}

fs.writeFileSync(OUT, out);
console.log(`wrote ${OUT}`);
console.log(`  ${cards.length} cards from ${SETS.join(', ')}: `
  + ['pokemon', 'trainer', 'energy'].map(k => `${cards.filter(c => c.kind === k).length} ${k}`).join(', '));
const powers = cards.filter(c => c.power);
console.log(`  ${powers.length} with a Pokemon Power: ${powers.map(c => c.name).join(', ')}`);
if (unresolvedEnergy.length)
  console.log(`  ${unresolvedEnergy.length} Special Energy with no derivable type, `
    + `needs a hand-authored effect: ${unresolvedEnergy.join(', ')}`);

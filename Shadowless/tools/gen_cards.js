// Generate src/cards.js (CARD_DB + the theme deck lists) from data/raw/.
//
//   node tools/gen_cards.js                       regenerate src/cards.js (Base Set)
//   node tools/gen_cards.js --sets base1,base2    widen to more sets
//   node tools/gen_cards.js --check               regenerate to memory and diff; exit 1 if different
//
// data/raw/*.json is the pokemon-tcg-data corpus — the same source the original
// tools/chat-era/gen_cards.py read out of /tmp before the port lost it. It carries
// all 1,251 WotC cards including rules text for every Trainer, which the CSVs in
// data/ never had past Fossil.
//
// The four theme deck lists came from named sheets in Trevor's P_TCG_Data.xlsx and
// CANNOT be regenerated from anything here. They live in data/decks.json, which is
// source, not output.

const fs = require('fs');
const path = require('path');

const HERE = path.join(__dirname, '..');
const RAW = path.join(HERE, 'data', 'raw');
const OUT = path.join(HERE, 'src', 'cards.js');

const flagIdx = process.argv.indexOf('--sets');
const argSets = (process.argv.find(a => a.startsWith('--sets=')) || '=').split('=')[1]
  || (flagIdx > -1 ? (process.argv[flagIdx + 1] || '') : '');
const SETS = argSets ? argSets.split(',') : ['base1'];

// Upstream spells types out; the engine uses single letters throughout.
const T = {
  Grass: 'G', Fire: 'R', Water: 'W', Lightning: 'L', Psychic: 'P',
  Fighting: 'F', Colorless: 'C', Darkness: 'D', Metal: 'M',
};
const letter = n => T[n] || '';

// Upstream uses U+00D7 MULTIPLICATION SIGN in Weakness values ("×2"); the engine
// and every existing effect script expect a plain ASCII "x". Damage values keep
// their × — that is what the card face prints and what the UI renders.
const asciiTimes = s => String(s || '').replace(/×/g, 'x');

const costString = arr => (arr || []).map(letter).join('');
const rulesText = c => (c.rules || []).join('\n');

function pokemonEntry(c) {
  const wk = (c.weaknesses || [])[0] || {};
  const rs = (c.resistances || [])[0] || {};
  const power = (c.abilities || []).find(a => a.type === 'Pokémon Power' || a.type === 'Poké-Body');
  return {
    id: c.id, name: c.name, set: c.set, num: c.number,
    rarity: c.rarity || '', artist: c.artist || '', kind: 'pokemon',
    stage: (c.subtypes || [])[0] || '',
    hp: parseInt(c.hp, 10),
    type: letter((c.types || [])[0]),
    evolvesFrom: c.evolvesFrom || '',
    wkType: letter(wk.type), wkVal: asciiTimes(wk.value),
    rsType: letter(rs.type), rsVal: asciiTimes(rs.value),
    retreat: c.convertedRetreatCost || 0,
    attacks: (c.attacks || []).map(a => ({
      name: a.name, cost: costString(a.cost), dmg: a.damage || '', text: a.text || '',
    })),
    // Data only: this says a Power EXISTS. effects.js says what it does.
    power: power ? { kind: power.type, name: power.name, text: power.text } : null,
  };
}

// Clefairy Doll and Mysterious Fossil are Trainers PLAYED AS Basic Pokemon.
// Upstream flags them by giving a Trainer an `hp`, which across all 14 sets
// picks out exactly those two cards (three rows — Fossil reprints one) and
// nothing else. They stay kind:'trainer' so deck-building still counts them as
// Trainers; `playsAs` is what the engine reads.
function trainerEntry(c) {
  const e = {
    id: c.id, name: c.name, set: c.set, num: c.number,
    rarity: c.rarity || '', artist: c.artist || '', kind: 'trainer',
    sub: (c.subtypes || [])[0] || 'Trainer',
    text: rulesText(c),
  };
  if (c.hp) {
    e.playsAs = 'pokemon';
    e.hp = parseInt(c.hp, 10);
    e.stage = 'Basic';
    // No type, so no Weakness or Resistance ever applies. Retreat is nominally
    // free but the engine refuses it outright — the card says it can't retreat.
    e.type = ''; e.evolvesFrom = '';
    e.wkType = ''; e.wkVal = ''; e.rsType = ''; e.rsVal = '';
    e.retreat = 0;
    e.attacks = [];
    e.power = null;
  }
  return e;
}

// Neither the CSVs nor upstream state what a basic Energy provides — the type is
// implied by the name. Special Energy needs a hand-authored effect regardless, so
// anything unrecognised gets an empty `provides` and a warning rather than a guess.
const unresolvedEnergy = [];
function energyProvides(c) {
  if (c.name === 'Double Colorless Energy') return 'CC';
  const m = c.name.match(/^(\w+) Energy$/);
  if (m && T[m[1]]) return T[m[1]];
  unresolvedEnergy.push(`${c.id} ${c.name}`);
  return '';
}

const energyEntry = c => ({
  id: c.id, name: c.name, set: c.set, num: c.number,
  rarity: c.rarity || '', artist: c.artist || '', kind: 'energy',
  cls: (c.subtypes || [])[0] || '',
  provides: energyProvides(c),
  text: rulesText(c),
});

// --- assemble -------------------------------------------------------------
const cards = [];
for (const set of SETS) {
  const file = path.join(RAW, `${set}.json`);
  if (!fs.existsSync(file)) {
    console.error(`ERROR: no data for set "${set}" — expected ${path.relative(HERE, file)}`);
    process.exit(1);
  }
  for (const c of JSON.parse(fs.readFileSync(file, 'utf8'))) {
    c.set = set;                                   // upstream omits it; the id carries it
    if (c.supertype === 'Pokémon') cards.push(pokemonEntry(c));
    else if (c.supertype === 'Trainer') cards.push(trainerEntry(c));
    else if (c.supertype === 'Energy') cards.push(energyEntry(c));
    else console.error(`WARNING: ${c.id} has unknown supertype "${c.supertype}", skipped`);
  }
}
cards.sort((a, b) => a.set.localeCompare(b.set) || (parseInt(a.num, 10) - parseInt(b.num, 10)));

const decks = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'decks.json'), 'utf8'));
const byId = Object.fromEntries(cards.map(c => [c.id, c]));

const missing = [];
for (const k of Object.keys(decks))
  for (const [, id] of decks[k].list) if (!byId[id] && !missing.includes(id)) missing.push(id);
if (missing.length) {
  console.error(`ERROR: data/decks.json references cards not in the generated sets: ${missing.join(', ')}`);
  process.exit(1);
}

let out = '// AUTO-GENERATED by tools/gen_cards.js from data/raw/. Do not hand-edit.\n';
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
  if (fs.readFileSync(OUT, 'utf8') === out) { console.log('src/cards.js is in sync with data/raw/.'); process.exit(0); }
  console.error('src/cards.js DIFFERS from a fresh generation.');
  process.exit(1);
}

fs.writeFileSync(OUT, out);
console.log(`wrote ${OUT}`);
console.log(`  ${cards.length} cards from ${SETS.join(', ')}: `
  + ['pokemon', 'trainer', 'energy'].map(k => `${cards.filter(c => c.kind === k).length} ${k}`).join(', '));
const powers = cards.filter(c => c.power);
console.log(`  ${powers.length} with a Pokemon Power`);
if (unresolvedEnergy.length)
  console.log(`  ${unresolvedEnergy.length} Special Energy needing a hand-authored effect: `
    + unresolvedEnergy.join(', '));

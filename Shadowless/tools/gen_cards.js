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

// With no --sets, regenerate WHATEVER THE COMMITTED FILE WAS BUILT FROM, read
// back out of its own SET_INFO. Two reasons, and the second one cost a session:
//
//   --check has to compare against the sets that file was built from, or it
//   reports drift on a widened build and trains everyone to ignore it.
//
//   And a bare `node tools/gen_cards.js` — the command CLAUDE.md documents —
//   has to be non-destructive. Until 12 Aug 2026 the SET_INFO read was gated
//   behind --check, so the bare command silently narrowed a three-set build
//   back to Base Set: 221 cards to 102, Jungle and Fossil gone, every opponent
//   deck dropped, and the only sign of it was a stdout line reading "102 cards
//   from base1" that looks exactly like success. Widening is now the only thing
//   --sets is needed for; regenerating in place never narrows.
//
// ['base1'] survives as the fresh-checkout fallback only, for when there is no
// committed cards.js to read a set list out of.
function committedSets() {
  try {
    const cur = require(OUT);
    const keys = Object.keys(cur.SET_INFO || {});
    if (keys.length) return keys;
  } catch (e) { /* no committed file yet, or an older one without SET_INFO */ }
  return null;
}
const SETS = argSets ? argSets.split(',') : (committedSets() || ['base1']);

// Set display names. HAND-AUTHORED, unavoidably: data/raw/*.json are bare arrays
// of cards with no set metadata on them at all, and the code is only known from
// the filename. Emitted into cards.js as SET_INFO so everything that needs to
// NAME a set — the pack reveal, pack select, the dex — reads one table rather
// than growing its own. `short` is for chrome with no room for "Legendary
// Collection".
//
// base4 and base5 were SWAPPED here until 11 Aug 2026, and the generator's
// refuse-to-name-an-unknown-set guard could never have caught it: that fires on
// a MISSING name, and a wrong one is present. Verify a code against the data
// before trusting the label, because nothing downstream can:
//   base4  130 cards, 6 basic Energy, no Dark cards, ends Water Energy #130
//   base5   83 cards, 0 basic Energy, 45 Dark cards, ends Dark Raichu #83
// Team Rocket is the one with the Dark Pokémon in it. Base Set 2 is the reprint
// set, and it is the one that comes first — Feb 2000 against Apr 2000.
const SET_INFO = {
  base1: { name: 'Base Set',             short: 'Base' },
  base2: { name: 'Jungle',               short: 'Jungle' },
  base3: { name: 'Fossil',               short: 'Fossil' },
  base4: { name: 'Base Set 2',           short: 'Base 2' },
  base5: { name: 'Team Rocket',          short: 'Rocket' },
  base6: { name: 'Legendary Collection', short: 'Legendary' },
  gym1:  { name: 'Gym Heroes',           short: 'Heroes' },
  gym2:  { name: 'Gym Challenge',        short: 'Challenge' },
  neo1:  { name: 'Neo Genesis',          short: 'Genesis' },
  neo2:  { name: 'Neo Discovery',        short: 'Discovery' },
  neo3:  { name: 'Neo Revelation',       short: 'Revelation' },
  neo4:  { name: 'Neo Destiny',          short: 'Destiny' },

  // `booster: false` — this set sells no booster packs. It is NOT a synonym for
  // 'unfinished': these two can be fully scripted and still must never become a
  // ladder bracket, a dex section or a pack pool, because the player reaches them
  // through the pack INTRUSION roll instead. progress.js's liveSets() reads this
  // flag and the long comment there is the one worth reading. Declared HERE, beside
  // the name, because adding a set is the only moment anyone thinks about it.
  basep: { name: 'Wizards Black Star Promos', short: 'Promo', booster: false },
  si1:   { name: 'Southern Islands',     short: 'Islands', booster: false },
};

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
    // Dex fields. The engine never reads these — they exist for Job 5's dex,
    // which groups cards by species rather than by printing. Upstream gives
    // nationalPokedexNumbers as an array, but it is exactly one entry on all
    // 1,020 Pokemon across all 14 sets, so it is flattened to a number here.
    // 191 of those cards carry no flavorText (mostly Neo holos) — the dex has
    // to tolerate an empty string rather than assume every species has one.
    dex: (c.nationalPokedexNumbers || [])[0] || 0,
    flavor: c.flavorText || '',
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
  // RAINBOW IS THE ONE CARD THAT BREAKS THE STRING. Job 10d.
  //
  // `provides` is a string of symbols — 'W' is one Water, 'CC' is two Colorless.
  // Rainbow provides ONE symbol that is EVERY TYPE AT ONCE, which no string of
  // letters can say. So it gets a sentinel: '*' is one symbol matching any type.
  //
  // The alternative was "choose a type on attachment", and the ruling forbids it
  // in as many words: Rainbow is genuinely Water AND Fighting AND Psychic
  // simultaneously, so it can be the spare Water for one attack and the spare
  // Fire for another in the same turn. Nothing chooses, so nothing has to
  // remember what was chosen. See Rulings/ENERGY-VS-ENERGY-CARD.md.
  //
  // The name check is deliberate rather than reading subtypes: Metal, Darkness
  // and Recycle Energy are all Special too and none of them is a wildcard.
  if (c.name === 'Rainbow Energy') return '*';
  // Full Heal and Potion Energy print "provides Colorless energy" outright. They
  // are Special by class, which is what keeps them out of the basic-only checks,
  // but their symbol is an ordinary one.
  if (c.name === 'Full Heal Energy' || c.name === 'Potion Energy') return 'C';
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

// --- corpus corrections -----------------------------------------------------
// PLACES WHERE data/raw IS WRONG AND WE KNOW BETTER. It is the source of truth
// and stays unedited — it is downloaded, and a hand-edit there is destroyed by
// the next fetch without leaving a trace. Corrections belong here instead,
// applied on the way through, each carrying the evidence that justifies it.
//
// THE BAR IS DELIBERATELY HIGH. The corpus reproduced all 102 Base Set cards
// byte-identically against an independent source, and one defect in 1,251 cards
// is the tally so far. Do not add an entry because a card reads oddly — add one
// when you have a source that outranks the data. See DATA.md.
//
// `from` is not decoration. It is asserted before the change is applied, so a
// corpus refresh that fixes something upstream fails loudly here instead of
// silently re-applying a correction to text that has moved on.
const CORRECTIONS = [
  {
    ids: ['base5-13', 'base5-30'],
    where: 'attack:Petal Whirlwind',
    from: 'Flip a coins.',
    to: 'Flip 3 coins.',
    why: 'The corpus drops the coin count, and data/wotc_pokemon.csv drops it too — '
       + 'the two are less independent here than DATA.md hopes, so agreement between '
       + 'them was not evidence. Resolved 17 Aug 2026 from a photograph of Trevor s '
       + 'own physical base5-30, which reads "Flip 3 coins." Without this the attack '
       + 'is unimplementable (30x damage times heads, of how many?) and the player is '
       + 'shown broken English on the card face.',
  },
];

let correctionsApplied = 0;
function applyCorrections(c) {
  for (const fix of CORRECTIONS) {
    if (!fix.ids.includes(c.id)) continue;
    const [kind, name] = fix.where.split(':');
    const targets = kind === 'attack' ? (c.attacks || []).filter(a => a.name === name)
      : kind === 'power' ? (c.abilities || []).filter(a => a.name === name)
      : [];
    if (!targets.length) {
      console.error('ERROR: correction for ' + c.id + ' found no ' + fix.where + ' — the corpus has moved.');
      process.exit(1);
    }
    for (const t of targets) {
      if (!String(t.text || '').includes(fix.from)) {
        console.error('ERROR: correction for ' + c.id + ' expected "' + fix.from + '" and the corpus no longer says it.');
        console.error('       Upstream may have fixed this. Check, then delete the entry or update it.');
        process.exit(1);
      }
      t.text = t.text.replace(fix.from, fix.to);
      correctionsApplied++;
    }
  }
  return c;
}

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
    applyCorrections(c);
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
out += '};\n\n';

// --- Job 7: the opponent decks and the ladder -------------------------------
// OPPONENT_DECKS is source-qualified — 'gbc:ken_fire_charge', 'jungle:water_blast'
// — because Job 7 already has three deck sources and will grow more as real
// per-set decks get authored. A ladder entry names a source and a key; nothing
// downstream has to know which file a deck came from.
//
// A deck referencing a card outside the generated sets is DROPPED with a
// warning rather than being a fatal error, which is the opposite of the rule
// for data/decks.json above, and deliberately so. decks.json decks are the
// player's — a missing one is a broken game. Opponent decks are one rung of a
// ladder that backfills itself: progress.js replaces a dropped entry with a
// generated challenger, so `--sets base1` still produces a working ladder
// instead of refusing to build.
const OPPONENT_SOURCES = [
  ['gbc', 'gbc_decks.json'],
  ['jungle', 'jungle_decks.json'],
  ['b1', 'base1_decks.json'],
  ['b2', 'base2_decks.json'],
  ['b3', 'base3_decks.json'],
  ['tr', 'team_rocket_decks.json'],
  ['b5', 'base5_decks.json'],
];
const opponentDecks = {}, droppedDecks = [];
for (const [prefix, file] of OPPONENT_SOURCES) {
  const raw = JSON.parse(fs.readFileSync(path.join(HERE, 'data', file), 'utf8'));
  for (const key of Object.keys(raw)) {
    if (key === '_meta') continue;
    const deck = raw[key];
    if (!deck || !Array.isArray(deck.list)) continue;
    const absent = deck.list.filter(([, id]) => !byId[id]).map(([, id]) => id);
    if (absent.length) { droppedDecks.push(`${prefix}:${key} (${[...new Set(absent)].join(', ')})`); continue; }
    // A hand-built deck may name its own COVER CARD — the card the deck is
    // about, which is not always the biggest Pokemon in it. ui.js falls back to
    // heroOfList() when there is none, so this is additive: Juno's Eevee deck
    // was fronted by its Electrode, which is taller and is not what the deck is.
    // Resolved to an id here, against the deck's OWN list, so a cover naming a
    // card the deck does not contain is caught at generation rather than
    // rendering as a blank tile.
    const entry = { name: deck.name || key, list: deck.list };
    if (deck.coverCard) {
      const hit = deck.list.find(([, id]) => byId[id] && byId[id].name === deck.coverCard);
      if (hit) entry.cover = hit[1];
      else console.error(`WARNING: ${prefix}:${key} names cover card "${deck.coverCard}", which is not in its list`);
    }
    opponentDecks[`${prefix}:${key}`] = entry;
  }
}
if (droppedDecks.length)
  console.error(`WARNING: ${droppedDecks.length} opponent deck(s) reference cards outside the generated sets and were dropped:\n  ${droppedDecks.join('\n  ')}`);

out += 'const OPPONENT_DECKS = {\n';
for (const k of Object.keys(opponentDecks)) {
  const cov = opponentDecks[k].cover ? `, cover: ${JSON.stringify(opponentDecks[k].cover)}` : '';
  out += `  ${JSON.stringify(k)}: { name: ${JSON.stringify(opponentDecks[k].name)}${cov}, list: [\n`;
  for (const [q, id] of opponentDecks[k].list) out += `    [${q}, ${JSON.stringify(id)}],  // ${byId[id].name}\n`;
  out += '  ]},\n';
}
out += '};\n\n';

// The ladder ships as data, not as a built structure: src/progress.js derives
// the live brackets from it at runtime, so a bracket for a set that is not in
// this build simply never appears. Only `_meta` is stripped.
const ladder = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'ladder.json'), 'utf8'));
delete ladder._meta;
for (const setCode of Object.keys(ladder.brackets || {})) {
  if (!SETS.includes(setCode)) continue;      // not in this build; progress.js drops it
  const b = ladder.brackets[setCode];
  for (const o of (b.roster || []).concat(b.boss ? [b.boss] : [], b.extra || [])) {
    if (o.deck === 'generate') continue;
    const known = opponentDecks[o.deck] || (o.deck.startsWith('theme:') && decks[o.deck.slice(6)]);
    if (!known) console.error(`WARNING: ladder ${setCode}/${o.id} wants deck "${o.deck}", which is not available — progress.js will substitute a generated challenger`);
  }
}
out += `const LADDER = ${JSON.stringify(ladder, null, 2)};\n\n`;

// Only the sets actually generated. A name for a set whose cards do not exist
// would let the UI offer a pack nobody can open.
const unnamed = SETS.filter(s => !SET_INFO[s]);
if (unnamed.length) {
  console.error(`ERROR: no display name for set(s): ${unnamed.join(', ')} — add them to SET_INFO in tools/gen_cards.js`);
  process.exit(1);
}
out += 'const SET_INFO = {\n';
for (const s of SETS) out += `  ${JSON.stringify(s)}: ${JSON.stringify(SET_INFO[s])},\n`;
out += '};\n\nif (typeof module !== \'undefined\') module.exports = { CARD_DB, DECKS, SET_INFO, OPPONENT_DECKS, LADDER };\n';

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

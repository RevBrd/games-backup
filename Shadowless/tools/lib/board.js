// Build a position out of card NAMES, then ask the bot what it thinks.
//
//   const b = setup({
//     me:   { card: 'Dewgong',    energy: '4 Water' },
//     them: { card: 'Electabuzz', energy: '3 Lightning' },
//   });
//   b.prefers('Ice Beam')        // -> true/false
//   b.threat()                   // -> 80
//   b.explain()                  // -> every action the bot weighed, scored
//
// WHY THIS EXISTS. `powertest.js` had twenty-nine bespoke fixture functions —
// `zardBoard`, `dyingWall`, `weezingBoard`, `duel2`, `arbokBoard` — and most of
// them are the same eight lines: make an engine, put a card in the Active spot,
// push some Energy onto it, set damage, hand out Prizes, force the phase to main
// and zero every `playedTurn` so things are allowed to attack. That boilerplate
// was the tax on writing a new assertion, and with 148 plain-English notes in the
// workbook waiting to become several claims each, it was the whole bottleneck.
//
// Cards come in by NAME because the claims are transcriptions of sentences about
// cards. `base1-25` is not Dewgong to anybody reading a diff, and a claim file
// full of ids is a claim file nobody can review against the note it came from.
//
// WHAT IT WILL NOT DO. It will not guess between two printings of a name. Say
// `'base5:Dark Alakazam'` when there are several, and it will list them for you
// when there are and you did not. Silently picking one is the kind of failure
// that produces a green test measuring the wrong card.
//
// THE FAILURE MODE IS A NEW SET, AND IT DOES NOT LOOK LIKE A FAILURE. Every set
// added reprints names, so a claim board that has read unambiguously for months
// starts throwing the moment somebody runs `gen_cards.js --sets`. Job 13 generated
// `basep` and turned three passing rows into "unusable" — and claimtest reports
// UNUSABLE separately from FAILED and is deliberately not in the six-suite gate,
// so the total simply dropped from 52 to 49 with nothing red anywhere.
//
// After widening a build, run `claimtest.js` and compare the PASS count against
// the one before, not just the fail count. The repair is to prefix the printing
// you meant (`base1:Arcanine`), which is always the right fix — the refusal above
// is the feature working.
//
// THE COORDINATE TRAP, STATED ONCE. Player 0 is always "me" and player 1 is
// always "them", and every probe on the returned object is written from player
// 0's seat. The engine's own methods are not — `incomingThreat(0)` means the
// threat *against* player 0. Use the probes rather than reaching for `b.ai`
// unless you know which way a given method faces.

const path = require('path');
// SHADOWLESS_SRC lets `claimtest.js --baseline` point this at a `src/` it
// materialised from a git ref, so the same claim rows can be run against an older
// bot. That is the control this whole harness needs in order to be believed: a
// claim written for a fault that was fixed on 22 Aug must go RED against the
// commit before it, or the row is not measuring what it says it measures.
const SRC = process.env.SHADOWLESS_SRC || path.join(__dirname, '..', '..', 'src');
const { Engine } = require(path.join(SRC, 'engine.js'));
const { CARD_DB } = require(path.join(SRC, 'cards.js'));
const { EFFECTS } = require(path.join(SRC, 'effects.js'));
const { DECKS } = require(path.join(SRC, 'cards.js'));

// ---- naming ---------------------------------------------------------------

const byName = new Map();
for (const id of Object.keys(CARD_DB)) {
  const n = CARD_DB[id].name.toLowerCase();
  if (!byName.has(n)) byName.set(n, []);
  byName.get(n).push(id);
}

// AMBIGUITY IS ABOUT BEHAVIOUR, NOT ABOUT PRINTING. Every set prints some cards
// twice at two rarities — `base5-1` and `base5-18` are both Dark Alakazam and
// they play identically; Trevor's workbook calls the second one "Dark Alakazam
// NH" but the card's own name is the same. Refusing to choose between those would
// force every Team Rocket claim to carry an id, which is exactly the readability
// this module exists to buy back. So candidates are collapsed by what they DO,
// and what is left is a real ambiguity: two Pikachus that are actually different
// cards. Same rule, two answers, and the fingerprint is the thing that separates
// them rather than a list of exceptions that would need a line per set.
const fingerprint = id => {
  const c = CARD_DB[id];
  return JSON.stringify([c.name, c.kind, c.hp, c.type, c.stage, c.evolvesFrom,
    c.wkType, c.wkVal, c.rsType, c.rsVal, c.retreat, c.provides, c.text,
    (c.attacks || []).map(a => [a.name, a.cost, a.dmg, a.text]),
    c.power && [c.power.name, c.power.text]]);
};

// 'Dewgong' | 'base1:Dewgong' | 'base1-25'
function resolve(spec) {
  const s = String(spec).trim();
  if (CARD_DB[s]) return s;
  let set = null, name = s;
  const c = s.indexOf(':');
  if (c > 0) { set = s.slice(0, c).trim().toLowerCase(); name = s.slice(c + 1).trim(); }
  let ids = byName.get(name.toLowerCase()) || [];
  if (set) ids = ids.filter(i => CARD_DB[i].set === set);
  if (!ids.length) throw new Error(`no card named "${spec}"`);
  if (ids.length > 1) {
    // First printing wins a tie — the holo is the canonical one and a claim
    // reading `base5-1` is easier to check against the workbook than `base5-18`.
    const seen = new Map();
    for (const i of ids) if (!seen.has(fingerprint(i))) seen.set(fingerprint(i), i);
    const distinct = [...seen.values()];
    if (distinct.length > 1) {
      const opts = distinct.map(i => `${CARD_DB[i].set}:${CARD_DB[i].name} (${i})`).join(', ');
      throw new Error(`"${spec}" is ambiguous — say which: ${opts}`);
    }
    return distinct[0];
  }
  return ids[0];
}

// '4 Water' | 'Water' | '3 Fire, 1 Double Colorless' | ['2 Psychic','1 Rainbow']
// The bare type name is accepted because "Water" reads better than "Water Energy"
// in a claim, and there is exactly one basic Energy per type.
const ENERGY_ALIAS = {
  water: 'Water Energy', fire: 'Fire Energy', grass: 'Grass Energy',
  lightning: 'Lightning Energy', psychic: 'Psychic Energy', fighting: 'Fighting Energy',
  dce: 'Double Colorless Energy', double: 'Double Colorless Energy',
  rainbow: 'Rainbow Energy',
};
function parseEnergy(spec) {
  if (!spec) return [];
  const parts = Array.isArray(spec) ? spec : String(spec).split(',');
  const out = [];
  for (const raw of parts) {
    const t = String(raw).trim();
    if (!t) continue;
    const m = /^(\d+)\s+(.*)$/.exec(t);
    const n = m ? +m[1] : 1;
    let name = (m ? m[2] : t).trim();
    const alias = ENERGY_ALIAS[name.toLowerCase()];
    if (alias) name = alias;
    let id;
    try { id = resolve(name); }
    catch (e) {
      // Rainbow has two printings and they are the same card; prefer the plain one.
      const ids = byName.get(name.toLowerCase()) || [];
      const basics = ids.filter(i => CARD_DB[i].cls === 'Basic');
      if (basics.length === 1) id = basics[0];
      else if (ids.length && CARD_DB[ids[0]].name === 'Rainbow Energy') id = ids[ids.length - 1];
      else throw e;
    }
    if (CARD_DB[id].kind !== 'energy') throw new Error(`"${name}" is not an Energy card`);
    for (let i = 0; i < n; i++) out.push(id);
  }
  return out;
}

// ---- slots ----------------------------------------------------------------

// 'Dewgong' | { card, energy, dmg, status, stack }
// `card: 'Seel > Dewgong'` builds the real evolution stack, which matters for
// anything reading `baseCard` — Devolution, and the played-from-hand rule.
function makeSlot(E, spec) {
  const o = typeof spec === 'string' ? { card: spec } : { ...spec };
  const chain = String(o.stack ? o.stack : o.card).split('>').map(x => x.trim()).filter(Boolean);
  const ids = chain.map(resolve);
  for (const id of ids) {
    if (CARD_DB[id].kind !== 'pokemon') throw new Error(`"${CARD_DB[id].name}" is not a Pokemon`);
  }
  const slot = E.mkSlot({ id: ids[0], uid: E.uid++ });
  for (const id of ids.slice(1)) slot.stack.push({ id, uid: E.uid++ });
  for (const id of parseEnergy(o.energy)) slot.energy.push({ id, uid: E.uid++ });
  if (o.dmg) slot.dmg = o.dmg;
  for (const s of [].concat(o.status || [])) {
    const k = String(s).toLowerCase();
    if (!(k in slot.status)) throw new Error(`no status "${s}" — asleep/paralyzed/confused/poisoned`);
    slot.status[k] = true;
    if (k === 'paralyzed') slot.paralyzedTurn = 0;
  }
  // Poison has a STRENGTH as well as a presence, and Toxic is the card that
  // makes the difference matter: it upgrades a 10 to a 20 and does nothing at
  // all to a target already on 20. A board that cannot say which is which
  // cannot test Nidoking's note.
  if (o.poisonDamage) slot.poisonDamage = o.poisonDamage;
  slot.playedTurn = 0;             // arrived long enough ago to act
  return slot;
}

// ---- the board ------------------------------------------------------------

class Board {
  constructor(E) { this.E = E; this.refresh(); }

  // The AI caches state, so anything that mutates the board wants this after.
  refresh() { this.E.aiChoose(0, 'expert'); this.ai = this.E._ai; return this; }

  get me()   { return this.E.state.players[0]; }
  get them() { return this.E.state.players[1]; }

  card(slot) { return this.E.db[slot.stack[slot.stack.length - 1].id]; }

  // ---- probes. All from player 0's seat. --------------------------------
  threat()    { return this.ai.incomingThreat(0); }          // what THEY can do to ME
  hp()        { return this.ai.remainingHP(this.me.active); }
  theirHP()   { return this.ai.remainingHP(this.them.active); }

  attacks() { return (this.card(this.me.active).attacks || []).map(a => a.name); }

  idxOf(name) {
    const list = this.card(this.me.active).attacks || [];
    const i = list.findIndex(a => a.name.toLowerCase() === String(name).toLowerCase());
    if (i < 0) throw new Error(`${this.card(this.me.active).name} has no attack "${name}" — has ${list.map(a => a.name).join(', ')}`);
    return i;
  }

  // Score one attack by name. Only attacks that are actually affordable are
  // meaningful here; `affordable()` says which are.
  score(name) { return this.ai.scoreAttack(0, this.idxOf(name)); }

  affordable() {
    return this.E.legalActions(0).filter(a => a.t === 'attack')
      .map(a => (this.card(this.me.active).attacks || [])[a.idx].name);
  }

  // pLethal from the bot's own forecast, so Weakness, Resistance, Invisible Wall
  // and Transparency are all already in it. Never re-derive this by hand.
  lethal(name) {
    const f = this.ai.forecast(0, this.idxOf(name));
    return f ? f.pLethal : 0;
  }
  damage(name) {
    const f = this.ai.forecast(0, this.idxOf(name));
    return f ? f.expDmg : 0;
  }

  // The best-scoring AFFORDABLE attack, by name. This is the question almost
  // every attack-choice claim is really asking.
  bestAttack() {
    const legal = this.E.legalActions(0).filter(a => a.t === 'attack');
    if (!legal.length) return null;
    let best = null, bs = -Infinity;
    for (const a of legal) {
      const sc = this.ai.scoreAttack(0, a.idx);
      if (sc > bs) { bs = sc; best = a.idx; }
    }
    return (this.card(this.me.active).attacks || [])[best].name;
  }
  prefers(name) {
    const b = this.bestAttack();
    return !!b && b.toLowerCase() === String(name).toLowerCase();
  }

  // ---- Trainers ---------------------------------------------------------
  // A whole half of `ai.js` the playbook method had not touched until 24 Aug
  // 2026, when the workbook turned out to carry 36 Trainer notes. They are
  // played from hand, so `myHand` has to contain the card; this finds it and
  // scores the actual legal action rather than reaching into `scoreTrainer`
  // with a hand-built one, because filling `a.opts` is half of what that
  // function does and a synthetic action skips it.
  trainerAction(name) {
    const id = resolve(name);
    const acts = this.E.legalActions(0).filter(a => a.t === 'playTrainer');
    for (const a of acts) {
      const inst = this.me.hand[a.hand];
      if (inst && inst.id === id) return a;
    }
    return null;
  }
  playable(name) { return !!this.trainerAction(name); }
  trainer(name) {
    const a = this.trainerAction(name);
    if (!a) {
      const inHand = this.me.hand.some(h => h.id === resolve(name));
      throw new Error(inHand
        ? `${name} is in hand but not a legal play on this board`
        : `${name} is not in hand — put it in myHand`);
    }
    return this.ai.scoreTrainer(0, a);
  }
  // Would the bot actually play it this turn, against everything else it could do?
  wouldPlay(name) {
    const m = this.move();
    if (!m || m.action.t !== 'playTrainer') return false;
    const inst = this.me.hand[m.action.hand];
    return !!inst && inst.id === resolve(name);
  }

  // What the bot would actually DO with the whole turn — not just which attack.
  // Retreat, evolution, bench and Power claims all need this one.
  move() {
    const a = this.ai.choose(0);
    return a ? { label: this.ai.actionLabel(a), action: a, score: a.__score } : null;
  }
  does(label) {
    const m = this.move();
    return !!m && m.label.toLowerCase().startsWith(String(label).toLowerCase());
  }

  // Every legal action with its score, sorted. This is the --explore payload and
  // the reason a claim can be investigated before anybody knows the answer.
  // `detail` and `opts` are here because `actionLabel` collapses an attack's
  // OPTIONS — Job 13. Cool Porygon's Texture Magic offers seven type choices and
  // --explore printed seven identical "attack:Texture Magic" lines with seven
  // different scores beside them, which is precisely the question the tool exists
  // to answer and precisely the one it could not show. Metronome and both
  // Conversions have the same shape.
  //
  // The engine's own action label carries the choice ("Texture Magic: Resistance
  // to F"), so it rides along rather than replacing `label` — existing rows read
  // `label` and `does()` reads the engine's separately.
  explain() {
    const out = [];
    for (const a of this.E.legalActions(0)) {
      let sc;
      try { sc = this.ai.scoreAction(0, a); } catch (e) { sc = NaN; }
      out.push({ label: this.ai.actionLabel(a), detail: a.label || '', opts: a.opts || null, score: sc });
    }
    return out.sort((x, y) => y.score - x.score);
  }
}

// ---- setup ----------------------------------------------------------------

function setup(spec = {}) {
  const E = new Engine(CARD_DB, EFFECTS, { seed: spec.seed || 1 });
  // Any two decks will do; every slot below is replaced. They exist so the engine
  // has a legal game to be in and so `deckRisk` has cards to count.
  E.newGame(DECKS.Brushfire, DECKS.Zap, ['A', 'B']);
  const me = E.state.players[0], them = E.state.players[1];

  if (!spec.me || !spec.them) throw new Error('setup needs both `me` and `them`');

  me.active = makeSlot(E, spec.me);
  them.active = makeSlot(E, spec.them);
  me.bench = (spec.myBench || []).map(s => makeSlot(E, s));
  them.bench = (spec.theirBench || []).map(s => makeSlot(E, s));

  const toHand = list => (list || []).map(n => ({ id: resolve(n), uid: E.uid++ }));
  if (spec.myHand) me.hand = toHand(spec.myHand);
  if (spec.theirHand) them.hand = toHand(spec.theirHand);

  // Prizes must exist or the engine reads an empty pile as somebody having won.
  const pr = () => ({ id: 'base1-99', uid: E.uid++ });
  const pz = spec.prizes == null ? 6 : spec.prizes;
  const mine = typeof pz === 'object' ? pz.mine : pz;
  const theirs = typeof pz === 'object' ? pz.theirs : pz;
  me.prizes = Array.from({ length: mine }, pr);
  them.prizes = Array.from({ length: theirs }, pr);

  E.state.phase = 'main';
  E.state.active = 0;
  E.state.turn = spec.turn == null ? 3 : spec.turn;
  E.state.pendingPromote = null;
  E.state.pendingSwitch = null;
  E.state.pendingAsk = null;
  E.state.pendingPrize = null;
  [...E.allSlots(0), ...E.allSlots(1)].forEach(s => { s.playedTurn = 0; });

  return new Board(E);
}

module.exports = { setup, resolve, Board, CARD_DB };

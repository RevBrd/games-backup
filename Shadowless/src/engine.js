// ============================================================================
// RULES ENGINE  —  WOTC-era (Base Set) Pokemon TCG
// Pure logic. No DOM. Drives both the UI and the headless test harness.
// ============================================================================

const CONFIG_DEFAULTS = {
  prizeCount: 6,          // dev-adjustable to shorten games
  benchMax: 5,
  handSize: 7,
  deckSize: 60,
  maxCopiesByName: 4,     // basic Energy exempt
  weaknessMultiplier: 2,  // WOTC: x2
  resistanceFlat: 30,     // WOTC: -30
  firstPlayerMayAttack: true,   // ASSUMPTION - see notes
  noEvolveFirstTurn: true,      // ASSUMPTION - see notes
  trainersPerTurn: Infinity,    // Base Set has no Supporter restriction
  maxMulligans: 20,
};

// ---------------------------------------------------------------- RNG -------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------- helpers ------
// Clearing Special Conditions must also reset Toxic's escalated Poison damage,
// or a Pokemon that retreats out of Toxic and is later re-Poisoned normally
// would still be taking 20 a turn.
function clearStatus(slot) {
  slot.status = { asleep: false, paralyzed: false, confused: false, poisoned: false };
  slot.poisonDamage = 10;
}

const cardOf = (db, inst) => db[inst.id];
const topInst = (slot) => slot.stack[slot.stack.length - 1];
const topCard = (db, slot) => db[topInst(slot).id];

function parseDamage(d) {
  if (!d) return 0;
  const m = String(d).match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function energyProvides(db, inst) {
  // A card can BE an Energy card without being one in the card data: Electrode's
  // Buzzap turns the Electrode itself into one. `asEnergy` is that override, set
  // on the card instance rather than the definition, because it is true of this
  // one Electrode in play and not of Electrode the card.
  if (inst && inst.asEnergy) return inst.asEnergy;
  const c = db[inst.id];
  return c && c.kind === 'energy' ? (c.provides || 'C') : '';
}
// Double Colorless Energy provides TWO symbols from one card, so cost matching
// and retreat have to count symbols while discarding whole cards.
function energySymbols(db, inst) {
  return energyProvides(db, inst).split('').filter(Boolean);
}
function symbolCount(db, list) {
  return list.reduce((a, e) => a + energySymbols(db, e).length, 0);
}

// ============================================================================
// ENGINE
// ============================================================================
class Engine {
  constructor(db, effects, opts = {}) {
    this.db = db;
    this.effects = effects;
    this.cfg = Object.assign({}, CONFIG_DEFAULTS, opts.cfg || {});
    this.seed = (opts.seed === undefined) ? (Date.now() & 0x7fffffff) : opts.seed;
    this.rand = mulberry32(this.seed);
    this.uid = 1;
    this.dev = { forceFlip: null };   // null | 'H' | 'T'
    this.state = null;
  }

  // ------------------------------------------------------------ logging ----
  log(text, kind = 'info') {
    this.state.log.push({ t: this.state.turn, p: this.state.active, text, kind });
    if (this.state.log.length > 4000) this.state.log.shift();
  }

  flip(reason = '') {
    let heads;
    if (this.dev.forceFlip === 'H') heads = true;
    else if (this.dev.forceFlip === 'T') heads = false;
    else heads = this.rand() < 0.5;
    this.log(`Coin flip${reason ? ' (' + reason + ')' : ''}: ${heads ? 'HEADS' : 'TAILS'}`, 'flip');
    return heads;
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ------------------------------------------------------- deck building ---
  buildDeck(deckDef) {
    const out = [];
    for (const [qty, id] of deckDef.list) {
      for (let i = 0; i < qty; i++) out.push({ uid: this.uid++, id });
    }
    return out;
  }

  validateDeck(deckDef) {
    const errors = [], warnings = [];
    const total = deckDef.list.reduce((a, [q]) => a + q, 0);
    if (total !== this.cfg.deckSize) errors.push(`Deck has ${total} cards, needs ${this.cfg.deckSize}`);

    const byName = {}, names = new Set();
    let basics = 0, unimplemented = [];
    for (const [q, id] of deckDef.list) {
      const c = this.db[id];
      if (!c) { errors.push(`Unknown card_id ${id}`); continue; }
      names.add(c.name);
      const isBasicEnergy = c.kind === 'energy' && c.cls === 'Basic';
      if (!isBasicEnergy) byName[c.name] = (byName[c.name] || 0) + q;
      if (c.kind === 'pokemon' && c.stage === 'Basic') basics += q;
      if (!this.isImplemented(id)) unimplemented.push(`${c.name} (${id})`);
    }
    for (const n in byName) {
      if (byName[n] > this.cfg.maxCopiesByName)
        errors.push(`${byName[n]}x "${n}" exceeds the ${this.cfg.maxCopiesByName}-copy limit`);
    }
    if (basics === 0) errors.push('Deck contains no Basic Pokemon');
    if (unimplemented.length) errors.push(`Not yet implemented: ${unimplemented.join(', ')}`);

    for (const [q, id] of deckDef.list) {
      const c = this.db[id];
      if (c && c.kind === 'pokemon' && c.evolvesFrom && !names.has(c.evolvesFrom))
        warnings.push(`${c.name} has no ${c.evolvesFrom} in deck`);
    }
    return { ok: errors.length === 0, errors, warnings, total, basics };
  }

  isImplemented(id) {
    const c = this.db[id];
    if (!c) return false;
    const e = this.effects[id];
    if (!e) return false;
    if (c.kind === 'pokemon') {
      if (!e.a || e.a.length !== (c.attacks || []).length) return false;
      return e.a.every(x => Array.isArray(x));
    }
    return Array.isArray(e.t);
  }

  coverageReport() {
    const rows = [];
    for (const id in this.db) rows.push({ id, name: this.db[id].name, kind: this.db[id].kind, done: this.isImplemented(id) });
    return { rows, done: rows.filter(r => r.done).length, total: rows.length };
  }

  // ------------------------------------------------------------- setup -----
  newGame(deckA, deckB, names = ['Player', 'Opponent']) {
    const mkPlayer = (def, name) => ({
      name, deckDef: def,
      deck: this.shuffle(this.buildDeck(def)),
      hand: [], discard: [], prizes: [],
      active: null, bench: [],
      turnsTaken: 0, energyAttached: false, retreated: false, trainersPlayed: 0,
      mulligans: 0,
    });
    this.state = {
      cfg: this.cfg, turn: 0, active: 0, phase: 'setup',
      winner: null, winReason: '', log: [],
      players: [mkPlayer(deckA, names[0]), mkPlayer(deckB, names[1])],
      pendingPromote: null, promoteQueue: [], pendingEndTurn: false, setupDone: [false, false],
      // Whirlwind: the DEFENDING player owes a choice of who comes up.
      pendingSwitch: null,
    };
    this.log(`New game. Seed ${this.seed}.`, 'sys');

    for (let i = 0; i < 2; i++) this.openingHand(i);

    // who goes first
    this.state.active = this.flip('who goes first') ? 0 : 1;
    this.log(`${this.state.players[this.state.active].name} will go first.`, 'sys');
    return this.state;
  }

  openingHand(pi) {
    const p = this.state.players[pi];
    let tries = 0;
    while (tries++ < this.cfg.maxMulligans) {
      p.hand = p.deck.splice(0, this.cfg.handSize);
      if (p.hand.some(x => { const c = this.db[x.id]; return c.kind === 'pokemon' && c.stage === 'Basic'; })) break;
      this.log(`${p.name} has no Basic Pokemon - mulligan.`, 'sys');
      p.deck = this.shuffle(p.deck.concat(p.hand)); p.hand = []; p.mulligans++;
    }
    // opponent draws 1 extra per mulligan
    if (p.mulligans > 0) {
      const opp = this.state.players[1 - pi];
      // deferred: opponent's hand may not be dealt yet; record and apply at setup end
      opp.bonusDraws = (opp.bonusDraws || 0) + p.mulligans;
    }
  }

  setupPlace(pi, handIdx, where) {
    const p = this.state.players[pi];
    if (this.state.phase !== 'setup') return this.fail('Not in setup');
    if (this.state.setupDone[pi]) return this.fail('Setup already confirmed');
    const inst = p.hand[handIdx];
    if (!inst) return this.fail('No such card');
    const c = this.db[inst.id];
    if (!(c.kind === 'pokemon' && c.stage === 'Basic')) return this.fail('Only Basic Pokemon may be placed');
    if (where === 'active') {
      if (p.active) return this.fail('Active already set');
      p.hand.splice(handIdx, 1); p.active = this.mkSlot(inst);
    } else {
      if (!p.active) return this.fail('Set your Active first');
      if (p.bench.length >= this.cfg.benchMax) return this.fail('Bench is full');
      p.hand.splice(handIdx, 1); p.bench.push(this.mkSlot(inst));
    }
    return { ok: true };
  }

  // Take a Pokemon back off the board during setup. Legal because setup is
  // arranging cards face-down before anything is revealed, and the GBC game
  // lets you rearrange freely until you confirm. Safe to do bluntly: a setup
  // slot is always a fresh mkSlot holding one Basic, with no energy, no damage
  // and no evolution stack, so there is no state to strand. Taking the Active
  // back also empties the bench, because a bench with no Active is not a legal
  // board and putting the player there would need a rule to dig them out of.
  setupTakeBack(pi, where, idx) {
    const p = this.state.players[pi];
    if (this.state.phase !== 'setup') return this.fail('Not in setup');
    if (this.state.setupDone[pi]) return this.fail('Setup already confirmed');
    if (where === 'active') {
      if (!p.active) return this.fail('No Active to take back');
      while (p.bench.length) p.hand.push(p.bench.pop().stack[0]);
      p.hand.push(p.active.stack[0]);
      p.active = null;
    } else {
      const slot = p.bench[idx];
      if (!slot) return this.fail('No such benched Pokemon');
      p.bench.splice(idx, 1);
      p.hand.push(slot.stack[0]);
    }
    return { ok: true };
  }

  setupAuto(pi) {
    const p = this.state.players[pi];
    const basics = () => p.hand.map((x, i) => [i, this.db[x.id]])
      .filter(([, c]) => c.kind === 'pokemon' && c.stage === 'Basic');
    let b = basics();
    if (!b.length) return this.fail('No Basic to place');
    b.sort((x, y) => y[1].hp - x[1].hp);
    this.setupPlace(pi, b[0][0], 'active');
    while (p.bench.length < this.cfg.benchMax) {
      b = basics(); if (!b.length) break;
      this.setupPlace(pi, b[0][0], 'bench');
    }
    return this.setupConfirm(pi);
  }

  setupConfirm(pi) {
    const p = this.state.players[pi];
    if (!p.active) return this.fail('You must place an Active Pokemon');
    this.state.setupDone[pi] = true;
    if (this.state.setupDone[0] && this.state.setupDone[1]) this.beginPlay();
    return { ok: true };
  }

  mkSlot(inst) {
    return {
      uid: this.uid++, stack: [inst], dmg: 0, energy: [],
      status: { asleep: false, paralyzed: false, confused: false, poisoned: false },
      poisonDamage: 10,
      paralyzedTurn: -1, playedTurn: 0, effects: [], usedAttacks: {}, forcedKO: false,
    };
  }

  beginPlay() {
    for (let i = 0; i < 2; i++) {
      const p = this.state.players[i];
      for (let k = 0; k < this.cfg.prizeCount; k++) p.prizes.push(p.deck.shift());
      if (p.bonusDraws) { for (let k = 0; k < p.bonusDraws; k++) if (p.deck.length) p.hand.push(p.deck.shift()); this.log(`${p.name} draws ${p.bonusDraws} extra (opponent mulligans).`, 'sys'); }
    }
    this.state.phase = 'main';
    this.state.turn = 0;
    this.startTurn();
  }

  fail(msg) { if (this.state) this.log('Illegal: ' + msg, 'err'); return { ok: false, error: msg }; }

  // Both Active Pokemon can be Knocked Out at once (Take Down recoil, Poison),
  // so promotion is a queue, not a single slot. Turn player promotes first.
  syncPromote() {
    const s = this.state;
    s.promoteQueue.sort((a, b) => (a === s.active ? -1 : b === s.active ? 1 : 0));
    s.pendingPromote = s.promoteQueue.length ? s.promoteQueue[0] : null;
  }
  addPromote(i) {
    const s = this.state;
    if (!s.promoteQueue.includes(i)) s.promoteQueue.push(i);
    this.syncPromote();
  }
  clearPromote(i) {
    const s = this.state;
    s.promoteQueue = s.promoteQueue.filter(x => x !== i);
    this.syncPromote();
  }

  // -------------------------------------------------------- turn cycle -----
  cur() { return this.state.players[this.state.active]; }
  opp() { return this.state.players[1 - this.state.active]; }

  startTurn() {
    const s = this.state;
    s.turn++;
    const p = this.cur();
    p.turnsTaken++; p.energyAttached = false; p.retreated = false; p.trainersPlayed = 0;

    // ENERGY_AS lasts "for the rest of the turn", so it lapses on both sides at
    // every turn boundary rather than only on its owner's.
    this.eachSlot((slot) => { if (slot.energyAs) slot.energyAs = null; });

    // purge lasting effects that expire at the start of this turn
    this.eachSlot((slot) => {
      slot.effects = slot.effects.filter(e => {
        if (e.expireAtStartOfTurn !== undefined && e.expireAtStartOfTurn <= s.turn) {
          this.log(`${this.nameOf(slot)}: ${e.kind} wears off.`, 'eff'); return false;
        }
        return true;
      });
    });

    this.log(`--- Turn ${s.turn}: ${p.name} ---`, 'turn');

    if (p.deck.length === 0) {
      return this.endGame(1 - s.active, `${p.name} could not draw a card`);
    }
    p.hand.push(p.deck.shift());
    this.log(`${p.name} draws a card. (${p.deck.length} left)`);
    return { ok: true };
  }

  endTurn() {
    const s = this.state;
    if (s.phase === 'over') return { ok: true };
    const ended = s.active;

    // end-of-turn effect expiry (e.g. PlusPower is discarded)
    this.eachSlot((slot, pi) => {
      slot.effects = slot.effects.filter(e => {
        if (e.expireAtEndOfTurn !== undefined && e.expireAtEndOfTurn <= s.turn) {
          if (e.card) { s.players[pi].discard.push(e.card); this.log(`${this.db[e.card.id].name} is discarded.`, 'eff'); }
          else this.log(`${this.nameOf(slot)}: ${e.kind} ends.`, 'eff');
          return false;
        }
        return true;
      });
    });

    this.betweenTurns(ended);
    if (s.phase === 'over') return { ok: true };
    if (s.pendingPromote !== null || s.pendingSwitch !== null) { s.pendingEndTurn = true; return { ok: true }; }

    s.active = 1 - s.active;
    return this.startTurn();
  }

  // Between turns: poison damage, then Asleep flips, then Paralysis recovery
  // for the player whose turn just ended.
  betweenTurns(endedPlayer) {
    const s = this.state;
    for (let i = 0; i < 2; i++) {
      const a = s.players[i].active;
      if (a && a.status.poisoned) {
        const pd = a.poisonDamage || 10;
        a.dmg += pd;
        this.log(`${this.nameOf(a)} takes ${pd} from Poison. (${a.dmg} total)`, 'status');
      }
    }
    this.checkKOs();
    if (s.phase === 'over') return;

    for (let i = 0; i < 2; i++) {
      const a = s.players[i].active;
      if (a && a.status.asleep) {
        if (this.flip(`${this.nameOf(a)} waking`)) { a.status.asleep = false; this.log(`${this.nameOf(a)} woke up.`, 'status'); }
        else this.log(`${this.nameOf(a)} is still Asleep.`, 'status');
      }
    }
    const ea = s.players[endedPlayer].active;
    if (ea && ea.status.paralyzed && ea.paralyzedTurn < s.turn) {
      ea.status.paralyzed = false;
      this.log(`${this.nameOf(ea)} is no longer Paralyzed.`, 'status');
    }
  }

  eachSlot(fn) {
    for (let i = 0; i < 2; i++) {
      const p = this.state.players[i];
      if (p.active) fn(p.active, i);
      p.bench.forEach(s => fn(s, i));
    }
  }

  nameOf(slot) { return topCard(this.db, slot).name; }

  // ------------------------------------------------------------ actions ----
  legalActions(pi) {
    const s = this.state;
    const acts = [];
    if (s.phase === 'over') return acts;
    if (s.pendingSwitch === pi) {
      s.players[pi].bench.forEach((b, i) =>
        acts.push({ t: 'switchIn', bench: i, label: `Send up ${this.nameOf(b)}` }));
      return acts;
    }
    if (s.pendingPromote === pi) {
      s.players[pi].bench.forEach((b, i) => acts.push({ t: 'promote', bench: i, label: `Promote ${this.nameOf(b)}` }));
      return acts;
    }
    if (s.pendingSwitch !== null || s.pendingPromote !== null) return acts;   // owed by the other player
    if (s.phase !== 'main' || s.active !== pi) return acts;
    const p = s.players[pi];

    p.hand.forEach((inst, i) => {
      const c = this.db[inst.id];
      if (this.playableAsBasic(c) && p.bench.length < this.cfg.benchMax)
        acts.push({ t: 'playBasic', hand: i, label: `Bench ${c.name}` });
      if (c.kind === 'pokemon' && c.evolvesFrom) {
        this.allSlots(pi).forEach(sl => {
          if (this.canEvolve(pi, sl, c)) acts.push({ t: 'evolve', hand: i, target: sl.uid, label: `Evolve into ${c.name}` });
        });
      }
      if (c.kind === 'energy' && !p.energyAttached) {
        this.allSlots(pi).forEach(sl => acts.push({ t: 'attachEnergy', hand: i, target: sl.uid, label: `Attach ${c.name} to ${this.nameOf(sl)}` }));
      }
      if (c.kind === 'trainer' && c.playsAs !== 'pokemon'
          && p.trainersPlayed < this.cfg.trainersPerTurn && this.trainerPlayable(pi, inst))
        acts.push({ t: 'playTrainer', hand: i, label: `Play ${c.name}` });
    });

    if (!p.retreated && p.active && p.bench.length && this.canRetreat(p.active))
      p.bench.forEach((b, i) => acts.push({ t: 'retreat', bench: i, label: `Retreat to ${this.nameOf(b)}` }));

    // "At any time during your turn before your attack, you may discard Clefairy
    // Doll." This is its only exit — it cannot retreat — so without it a Doll in
    // the Active spot would lock you there until something Knocked it Out.
    for (const slot of this.allSlots(pi)) {
      if (this.playsAsPokemon(slot))
        acts.push({ t: 'discardInPlay', uid: slot.uid, label: `Discard ${this.nameOf(slot)}` });
    }

    // Powers come before the attack: every "as often as you like" Power in the
    // era says "before your attack", and attacking ends the turn anyway.
    this.powerActions(pi).forEach(a => acts.push(a));

    if (p.active && this.canAttackAtAll(pi)) {
      const c = topCard(this.db, p.active);
      (c.attacks || []).forEach((atkDef, i) => {
        if (!this.canUseAttack(pi, i).ok) return;
        // An attack that needs a choice made up front enumerates one action per
        // legal choice, exactly as interactive Powers do — so the AI scores each
        // option and the UI never has to restate which are legal.
        for (const variant of this.attackVariants(pi, i)) {
          if (variant === null) acts.push({ t: 'attack', idx: i, label: `Attack: ${atkDef.name}` });
          else acts.push({ t: 'attack', idx: i, opts: variant.opts, label: variant.label });
        }
      });
    }
    acts.push({ t: 'pass', label: 'End turn' });
    return acts;
  }

  allSlots(pi) {
    const p = this.state.players[pi];
    return (p.active ? [p.active] : []).concat(p.bench);
  }
  findSlot(pi, uid) { return this.allSlots(pi).find(s => s.uid === uid); }

  // ------------------------------------------------------------- powers ----
  // A Power belongs to the card on TOP of the stack, so evolving away from a
  // Power loses it and evolving into one gains it, both immediately.
  powerOf(slot) {
    if (!slot) return null;
    const e = this.effects[topCard(this.db, slot).id];
    return (e && e.p) ? e.p : null;
  }

  // Every Base Set Power is switched off by Sleep, Confusion and Paralysis, so
  // the gate lives here rather than being restated on each card. A Power also
  // stops working if the Pokemon is having all effects prevented (Barrier).
  //
  // Jungle and Fossil break the blanket gate in one direction and add a master
  // switch above it, so it is now two steps:
  //
  //   powerActive()  the card's own condition — status, Barrier, and `always`
  //                  for the handful of cards that print no status clause at
  //                  all (Dodrio's Retreat Aid, Dragonite's Step In).
  //   powerUsable()  that, AND not suppressed by somebody's Toxic Gas.
  //
  // Splitting them is what stops Toxic Gas asking whether Toxic Gas is on.
  powerActive(slot) {
    const p = this.powerOf(slot);
    if (!p) return false;
    const st = slot.status;
    if (!p.always && (st.asleep || st.confused || st.paralyzed)) return false;
    if (this.effectsBlocked(slot)) return false;
    return true;
  }

  // Muk. "Ignore all Pokemon Powers other than Toxic Gases" — plural, so several
  // Muks coexist and none switches the others off. Either side of the board, and
  // from the Bench.
  //
  // CONSULTED, never materialised. Passive Powers are asked at the moment they
  // matter rather than pushed into slot.effects when a card enters play, because
  // this switch flips constantly — Muk falls asleep, is Knocked Out, retreats,
  // or evolves out of a Grimer mid-turn — and a materialised copy of every
  // passive in the game would have to be resynchronised on all of those. See
  // ENGINE.md.
  toxicGasActive() {
    for (let i = 0; i < 2; i++) {
      for (const sl of this.allSlots(i)) {
        const p = this.powerOf(sl);
        if (p && p.kind === 'TOXIC_GAS' && this.powerActive(sl)) return true;
      }
    }
    return false;
  }

  powerUsable(slot) {
    if (!this.powerActive(slot)) return false;
    if (this.powerOf(slot).kind === 'TOXIC_GAS') return true;   // never itself
    return !this.toxicGasActive();
  }

  // The switched-on Power of a given kind on this slot, or null. The one way
  // anything should ask "does this Pokemon currently have X".
  activePower(slot, kind) {
    const p = this.powerOf(slot);
    return (p && p.kind === kind && this.powerUsable(slot)) ? p : null;
  }

  // Aerodactyl. Applies to BOTH players — the card says "no more Evolution cards
  // can be played", not "your opponent can't". Order of arrival decides an
  // Aerodactyl/Muk standoff, and the reasoning is in RULINGS.md.
  evolutionLocked() {
    for (let i = 0; i < 2; i++) {
      for (const sl of this.allSlots(i)) if (this.activePower(sl, 'NO_EVOLUTION')) return true;
    }
    return false;
  }

  // Dodrio. Bench-only, by the card's own wording, and it stacks.
  retreatCostOf(slot) {
    const base = topCard(this.db, slot).retreat;
    let off = 0;
    const owner = this.sideOf(slot);
    if (owner !== null) {
      for (const b of this.state.players[owner].bench) {
        const p = this.activePower(b, 'RETREAT_DISCOUNT');
        if (p) off += (p.n || 1);
      }
    }
    return Math.max(0, base - off);
  }

  sideOf(slot) {
    for (let i = 0; i < 2; i++) if (this.allSlots(i).indexOf(slot) >= 0) return i;
    return null;
  }

  // Energy symbols a slot currently provides, honouring an ENERGY_AS override
  // (Charizard's Energy Burn). Count is preserved — Double Colorless still pays
  // twice — only the type changes.
  slotSymbols(slot) {
    const out = [];
    slot.energy.forEach(e => energySymbols(this.db, e).forEach(x => out.push(slot.energyAs || x)));
    return out;
  }

  // "1 Water Energy card" and the like mean a BASIC one. In Base Set the type
  // check alone would do, since Double Colorless is Colorless — but Rainbow
  // Energy counts as every type, so the class check is what keeps this honest
  // once Base Set 2 lands.
  isBasicEnergyOf(inst, type) {
    const c = this.db[inst.id];
    return !!c && c.kind === 'energy' && c.cls === 'Basic' && c.provides === type;
  }

  // One action per legal (source, target) pair, so the AI scores Powers with the
  // same machinery as everything else and the UI can just highlight what's legal.
  powerActions(pi) {
    const acts = [];
    const me = this.state.players[pi];
    for (const slot of this.allSlots(pi)) {
      const p = this.powerOf(slot);
      if (!p || !this.powerUsable(slot)) continue;
      const owner = this.nameOf(slot);
      switch (p.kind) {
        case 'ENERGY_AS':
          if (slot.energyAs) break;                      // already on; no point offering it again
          if (!slot.energy.length) break;
          acts.push({ t: 'power', uid: slot.uid, kind: p.kind, label: `${owner}: ${p.name}` });
          break;
        case 'MOVE_DAMAGE':
          for (const from of this.allSlots(pi)) {
            if (from.dmg < 10) continue;
            for (const to of this.allSlots(pi)) {
              if (to === from) continue;
              if (to.dmg + 10 >= topCard(this.db, to).hp) continue;   // may not Knock Out
              acts.push({
                t: 'power', uid: slot.uid, kind: p.kind, from: from.uid, to: to.uid,
                label: `${p.name}: ${this.nameOf(from)} → ${this.nameOf(to)}`,
              });
            }
          }
          break;
        case 'MOVE_ENERGY':
          for (const from of this.allSlots(pi)) {
            if (!from.energy.some(e => this.isBasicEnergyOf(e, p.energy))) continue;
            for (const to of this.allSlots(pi)) {
              if (to === from) continue;
              acts.push({
                t: 'power', uid: slot.uid, kind: p.kind, from: from.uid, to: to.uid,
                label: `${p.name}: ${this.nameOf(from)} → ${this.nameOf(to)}`,
              });
            }
          }
          break;
        case 'EXTRA_ATTACH': {
          // Every basic Energy of a given type is interchangeable, so the source
          // card is not a choice — only the destination is. That keeps this a
          // one-click flow rather than making the player pick between identical
          // cards in hand.
          const hand = me.hand.findIndex(e => this.isBasicEnergyOf(e, p.energy));
          if (hand === -1) break;
          for (const to of this.allSlots(pi)) {
            if (p.targetType && topCard(this.db, to).type !== p.targetType) continue;
            acts.push({
              t: 'power', uid: slot.uid, kind: p.kind, hand, to: to.uid,
              label: `${p.name}: attach to ${this.nameOf(to)}`,
            });
          }
          break;
        }
        case 'BUZZAP':
          // "1 of your OTHER Pokemon" — so there has to be somewhere to put it.
          for (const to of this.allSlots(pi)) {
            if (to === slot) continue;
            for (const type of this.energyTypes()) {
              acts.push({
                t: 'power', uid: slot.uid, kind: p.kind, to: to.uid, type,
                label: `${p.name}: become ${type} Energy on ${this.nameOf(to)}`,
              });
            }
          }
          break;
        default: break;                                  // passive Powers offer no action
      }
    }
    return acts;
  }

  // Which Energy types this card pool actually uses. Offering Darkness and Metal
  // in a Base-Set-only game would be legal but silly, and this scales itself as
  // sets are added rather than needing a hand-kept list.
  energyTypes() {
    if (!this._energyTypes) {
      const seen = new Set(['C']);
      for (const id in this.db) if (this.db[id].kind === 'pokemon' && this.db[id].type) seen.add(this.db[id].type);
      this._energyTypes = [...seen].sort();
    }
    return this._energyTypes;
  }

  doPower(pi, a) {
    const slot = this.findSlot(pi, a.uid);
    if (!slot) return this.fail('No such Pokemon');
    const p = this.powerOf(slot);
    if (!p) return this.fail('That Pokemon has no Pokemon Power');
    if (!this.powerUsable(slot)) return this.fail(`${this.nameOf(slot)} can't use ${p.name} right now`);

    switch (p.kind) {
      case 'ENERGY_AS': {
        if (!slot.energy.length) return this.fail('No Energy attached');
        slot.energyAs = p.type;
        // art.js owns the type names. Same bundle-or-Node guard used for AI below.
        const names = (typeof ENERGY_NAME !== 'undefined')
          ? ENERGY_NAME : require('./art.js').ENERGY_NAME;
        this.log(`${p.name}: all Energy on ${this.nameOf(slot)} counts as `
          + `${names[p.type] || p.type} for the rest of the turn.`, 'eff');
        return { ok: true };
      }
      case 'MOVE_DAMAGE': {
        const from = this.findSlot(pi, a.from), to = this.findSlot(pi, a.to);
        if (!from || !to) return this.fail('No such Pokemon');
        if (from === to) return this.fail('Pick two different Pokemon');
        if (from.dmg < 10) return this.fail(`${this.nameOf(from)} has no damage counters`);
        const tc = topCard(this.db, to);
        if (to.dmg + 10 >= tc.hp) return this.fail(`That would Knock Out ${tc.name}`);
        from.dmg -= 10; to.dmg += 10;
        this.log(`${p.name}: 1 damage counter moved from ${this.nameOf(from)} `
          + `to ${this.nameOf(to)}. (${to.dmg}/${tc.hp})`, 'eff');
        return { ok: true };
      }
      case 'MOVE_ENERGY': {
        const from = this.findSlot(pi, a.from), to = this.findSlot(pi, a.to);
        if (!from || !to) return this.fail('No such Pokemon');
        if (from === to) return this.fail('Pick two different Pokemon');
        const k = from.energy.findIndex(e => this.isBasicEnergyOf(e, p.energy));
        if (k === -1) return this.fail(`${this.nameOf(from)} has no ${p.energy} Energy to move`);
        const moved = from.energy.splice(k, 1)[0];
        to.energy.push(moved);
        this.log(`${p.name}: ${this.db[moved.id].name} moved from ${this.nameOf(from)} `
          + `to ${this.nameOf(to)}.`, 'eff');
        return { ok: true };
      }
      case 'EXTRA_ATTACH': {
        const to = this.findSlot(pi, a.to);
        if (!to) return this.fail('No such Pokemon');
        if (p.targetType && topCard(this.db, to).type !== p.targetType)
          return this.fail(`${this.nameOf(to)} is not a ${p.targetType} Pokemon`);
        const me2 = this.state.players[pi];
        const k = me2.hand.findIndex(e => this.isBasicEnergyOf(e, p.energy));
        if (k === -1) return this.fail(`No ${p.energy} Energy in hand`);
        const card = me2.hand.splice(k, 1)[0];
        to.energy.push(card);
        // Deliberately does NOT touch me2.energyAttached — the whole point of
        // the Power is that it sits outside the one-attachment-per-turn rule.
        this.log(`${p.name}: ${this.db[card.id].name} attached to ${this.nameOf(to)} `
          + `without using this turn's Energy attachment.`, 'eff');
        return { ok: true };
      }
      // The one Power in Base Set that changes what a card IS. See RULINGS.md:
      // the Electrode card itself becomes ONE Energy card providing TWO Energy
      // of the chosen type, the Voltorb beneath it is discarded, and the
      // opponent takes a Prize because a Knock Out is a Knock Out even when you
      // did it to yourself.
      case 'BUZZAP': {
        const me3 = this.state.players[pi], opp = this.state.players[1 - pi];
        const to = this.findSlot(pi, a.to);
        if (!to) return this.fail('No such Pokemon');
        if (to === slot) return this.fail('Buzzap needs one of your OTHER Pokemon');
        if (!a.type || !this.energyTypes().includes(a.type)) return this.fail('Choose a type of Energy');
        const name = this.nameOf(slot);

        // Only the top card survives. Everything else attached to the Electrode
        // — the Voltorb, its Energy, any Trainer cards — goes to the discard,
        // exactly as it would on any other Knock Out.
        const card = slot.stack.pop();
        slot.stack.forEach(x => me3.discard.push(x));
        slot.energy.forEach(x => me3.discard.push(x));
        slot.effects.forEach(e => { if (e.card) me3.discard.push(e.card); });
        slot.stack = []; slot.energy = []; slot.effects = [];
        this.removeSlot(pi, slot);

        card.asEnergy = a.type + a.type;                 // one card, two symbols
        to.energy.push(card);
        const tn = (typeof ENERGY_NAME !== 'undefined')
          ? ENERGY_NAME : require('./art.js').ENERGY_NAME;
        this.log(`${p.name}: ${name} is Knocked Out and becomes an Energy card `
          + `providing 2 ${tn[a.type] || a.type} Energy, attached to ${this.nameOf(to)}.`, 'eff');

        if (opp.prizes.length) {
          opp.hand.push(opp.prizes.shift());
          this.log(`${opp.name} takes a Prize. (${opp.prizes.length} left)`, 'prize');
        }
        if (opp.prizes.length === 0) { this.endGame(1 - pi, `${opp.name} took all Prizes`); return { ok: true }; }
        if (!me3.active && me3.bench.length === 0) {
          this.endGame(1 - pi, `${me3.name} has no Pokemon left`); return { ok: true };
        }
        if (!me3.active && me3.bench.length > 0) this.addPromote(pi);
        return { ok: true };
      }

      default:
        return this.fail(`${p.name} is not an activated Power`);
    }
  }

  canEvolve(pi, slot, evoCard) {
    const s = this.state;
    if (this.evolutionLocked()) return false;                          // Prehistoric Power
    if (topCard(this.db, slot).name !== evoCard.evolvesFrom) return false;
    if (slot.playedTurn >= s.turn) return false;                       // played this turn
    if (slot.evolvedTurn === s.turn) return false;                     // already evolved this turn
    if (this.cfg.noEvolveFirstTurn && s.players[pi].turnsTaken <= 1) return false;
    return true;
  }

  // Clefairy Doll and Mysterious Fossil are Trainers played AS Basic Pokemon.
  // Note what this deliberately does NOT cover: the opening setup, where they are
  // still Trainer cards in hand and neither satisfy the "must start with a Basic"
  // check nor prevent a mulligan; and basicsIn(), because a Doll in the discard
  // pile is a Trainer card again and Revive cannot reach it.
  playableAsBasic(c) {
    return !!c && ((c.kind === 'pokemon' && c.stage === 'Basic') || c.playsAs === 'pokemon');
  }
  playsAsPokemon(slot) {
    return !!slot && topCard(this.db, slot).playsAs === 'pokemon';
  }

  canRetreat(slot) {
    if (this.playsAsPokemon(slot)) return false;          // "can't retreat", flatly
    if (slot.status.asleep || slot.status.paralyzed) return false;
    return symbolCount(this.db, slot.energy) >= this.retreatCostOf(slot);
  }

  canAttackAtAll(pi) {
    const s = this.state, p = s.players[pi];
    if (!p.active || !this.opp().active) return false;
    if (p.active.status.asleep || p.active.status.paralyzed) return false;
    if (!this.cfg.firstPlayerMayAttack && s.turn === 1) return false;
    return true;
  }

  // Does the attached Energy satisfy the cost string (e.g. "RRC")?
  costSatisfied(slot, cost) {
    const pool = this.slotSymbols(slot);
    const need = cost.split('').filter(x => x !== 'C');
    const generic = cost.length - need.length;
    const used = new Array(pool.length).fill(false);
    for (const t of need) {
      const k = pool.findIndex((p, i) => !used[i] && p === t);
      if (k === -1) return false;
      used[k] = true;
    }
    return pool.filter((p, i) => !used[i]).length >= generic;
  }

  canUseAttack(pi, idx) {
    const p = this.state.players[pi];
    if (!p.active) return { ok: false, why: 'No Active Pokemon' };
    const c = topCard(this.db, p.active);
    const a = (c.attacks || [])[idx];
    if (!a) return { ok: false, why: 'No such attack' };
    if (!this.costSatisfied(p.active, a.cost)) return { ok: false, why: 'Not enough Energy' };
    const script = (this.effects[c.id] && this.effects[c.id].a && this.effects[c.id].a[idx]) || [];
    if (p.active.usedAttacks && p.active.usedAttacks[idx]
        && script.some(v => v.v === 'ONCE_WHILE_IN_PLAY'))
      return { ok: false, why: 'Already used while this Pokemon has been in play' };
    const locked = p.active.effects.find(e => e.kind === 'ATTACK_DISABLED' && e.idx === idx);
    if (locked) return { ok: false, why: `${a.name} is disabled this turn` };
    for (const v of script) {
      if (v.v === 'COST_DISCARD_ENERGY') {
        // No `t` means any Energy card will do (Charizard's Fire Spin discards 2
        // Energy of any type; Ninetales' Fire Blast demands Fire specifically).
        const have = p.active.energy.filter(e => !v.t || energyProvides(this.db, e) === v.t).length;
        if (have < v.n) return { ok: false, why: `Needs ${v.n} ${v.t || ''} Energy to discard`.replace('  ', ' ') };
      }
      if (v.v === 'COST_DISCARD_ALL_ENERGY') {
        if (p.active.energy.length === 0) return { ok: false, why: 'No Energy to discard' };
      }
      if (v.v === 'REQUIRE_DEF_STATUS') {
        const def = this.state.players[1 - pi].active;
        if (!def || !def.status[v.s]) return { ok: false, why: `Defending Pokemon must be ${v.label || v.s}` };
      }
    }
    return { ok: true };
  }

  trainerPlayable(pi, inst) {
    const p = this.state.players[pi], o = this.state.players[1 - pi];
    const script = (this.effects[inst.id] && this.effects[inst.id].t) || [];
    for (const v of script) {
      switch (v.v) {
        case 'T_DRAW': if (p.deck.length === 0) return false; break;
        case 'T_SWITCH_OWN': if (!p.active || p.bench.length === 0) return false; break;
        case 'T_SWITCH_OPPONENT': if (!o.active || o.bench.length === 0) return false; break;
        case 'T_DISCARD_OPP_ENERGY':
          if (!this.allSlots(1 - pi).some(s => s.energy.length)) return false; break;
        case 'T_HEAL': if (!this.allSlots(pi).some(s => s.dmg > 0)) return false; break;
        case 'T_DISCARD_ENERGY_THEN_HEAL':
          if (!this.allSlots(pi).some(s => s.dmg > 0 && s.energy.length)) return false; break;
        case 'T_PLUSPOWER': if (!p.active) return false; break;
        case 'T_PROFESSOR_OAK': if (p.deck.length === 0) return false; break;
        case 'T_DEFENDER': if (!this.allSlots(pi).length) return false; break;
        case 'T_FULL_HEAL': {
          if (!p.active) return false;
          const st = p.active.status;
          if (!(st.asleep || st.confused || st.paralyzed || st.poisoned)) return false;
          break;
        }
        case 'T_IMPOSTOR_OAK': if (!o.hand.length && !o.deck.length) return false; break;
        case 'T_MAINTENANCE': if (p.hand.length < 3 || !p.deck.length) return false; break;
        case 'T_POKEMON_CENTER': if (!this.allSlots(pi).some(x => x.dmg > 0)) return false; break;
        case 'T_REVIVE':
          if (p.bench.length >= this.cfg.benchMax) return false;
          if (!this.basicsIn(p.discard).length) return false;
          break;
        case 'T_POKEMON_FLUTE':
          if (o.bench.length >= this.cfg.benchMax) return false;
          if (!this.basicsIn(o.discard).length) return false;
          break;
        case 'T_SCOOP_UP':
          if (!this.allSlots(pi).length) return false;
          break;
        case 'T_DEVOLUTION_SPRAY':
          if (!this.allSlots(pi).some(x => x.stack.length > 1)) return false;
          break;
        case 'T_ITEM_FINDER':
          if (p.hand.length < 3) return false;
          if (!p.discard.some(x => this.db[x.id].kind === 'trainer')) return false;
          break;
        case 'T_POKEMON_TRADER':
          if (!p.deck.some(x => this.db[x.id].kind === 'pokemon')) return false;
          if (!p.hand.some(x => x.uid !== inst.uid && this.db[x.id].kind === 'pokemon')) return false;
          break;
        case 'T_POKEDEX': if (!p.deck.length) return false; break;
        case 'T_POKEMON_BREEDER': {
          const s2 = p.hand.filter(x => x.uid !== inst.uid && this.db[x.id].kind === 'pokemon' && this.db[x.id].stage === 'Stage 2');
          if (!s2.length) return false;
          const ok = s2.some(x => {
            const want = this.basicBehind(this.db[x.id].name);
            return this.allSlots(pi).some(sl => topCard(this.db, sl).name === want
              && sl.playedTurn < this.state.turn && sl.evolvedTurn !== this.state.turn
              && !(this.cfg.noEvolveFirstTurn && p.turnsTaken <= 1));
          });
          if (!ok) return false;
          break;
        }
        case 'T_COMPUTER_SEARCH':
          if (p.deck.length === 0) return false;
          if (p.hand.length < 3) return false;   // the card itself + 2 to discard
          break;
        case 'T_SUPER_ENERGY_REMOVAL':
          if (!this.allSlots(pi).some(x => x.energy.length)) return false;
          if (!this.allSlots(1 - pi).some(x => x.energy.length)) return false;
          break;
        case 'T_ENERGY_RETRIEVAL':
          if (!p.discard.some(x => { const c = this.db[x.id]; return c.kind === 'energy' && c.cls === 'Basic'; })) return false;
          if (p.hand.length < 2) return false; break;
      }
    }
    return true;
  }

  // ------------------------------------------------------------- dispatch --
  act(pi, a) {
    const s = this.state;
    if (s.phase === 'over') return this.fail('Game is over');
    if (s.pendingSwitch !== null || s.pendingPromote !== null) {
      if (s.pendingSwitch === pi) {
        if (a.t !== 'switchIn') return this.fail('A Pokemon must be sent up first');
      } else if (s.pendingPromote === pi) {
        if (a.t !== 'promote') return this.fail('Must promote a Pokemon first');
      } else return this.fail('Waiting on the other player');
    } else if (s.active !== pi) return this.fail('Not your turn');

    switch (a.t) {
      case 'playBasic':    return this.doPlayBasic(pi, a);
      case 'evolve':       return this.doEvolve(pi, a);
      case 'attachEnergy': return this.doAttach(pi, a);
      case 'playTrainer':  return this.doTrainer(pi, a);
      case 'retreat':      return this.doRetreat(pi, a);
      case 'attack':       return this.doAttack(pi, a);
      case 'power':        return this.doPower(pi, a);
      case 'promote':      return this.doPromote(pi, a);
      case 'switchIn':     return this.doSwitchIn(pi, a);
      case 'discardInPlay': return this.doDiscardInPlay(pi, a);
      case 'pass':         return this.endTurn();
      default:             return this.fail('Unknown action ' + a.t);
    }
  }

  doPlayBasic(pi, a) {
    const p = this.state.players[pi];
    const inst = p.hand[a.hand]; if (!inst) return this.fail('No such card');
    const c = this.db[inst.id];
    if (!this.playableAsBasic(c)) return this.fail('Not a Basic Pokemon');
    if (p.bench.length >= this.cfg.benchMax) return this.fail('Bench is full');
    p.hand.splice(a.hand, 1);
    const sl = this.mkSlot(inst); sl.playedTurn = this.state.turn;
    p.bench.push(sl);
    this.log(`${p.name} benches ${c.name}.`);
    return { ok: true };
  }

  doEvolve(pi, a) {
    const p = this.state.players[pi];
    const inst = p.hand[a.hand]; if (!inst) return this.fail('No such card');
    const c = this.db[inst.id];
    const sl = this.findSlot(pi, a.target); if (!sl) return this.fail('No such target');
    if (!this.canEvolve(pi, sl, c)) return this.fail('Cannot evolve that Pokemon now');
    p.hand.splice(a.hand, 1);
    const was = this.nameOf(sl);
    sl.stack.push(inst);
    sl.evolvedTurn = this.state.turn;
    clearStatus(sl);
    this.log(`${was} evolves into ${c.name}. Special Conditions removed.`, 'eff');
    return { ok: true };
  }

  doAttach(pi, a) {
    const p = this.state.players[pi];
    if (p.energyAttached) return this.fail('Already attached Energy this turn');
    const inst = p.hand[a.hand]; if (!inst) return this.fail('No such card');
    const c = this.db[inst.id];
    if (c.kind !== 'energy') return this.fail('Not an Energy card');
    const sl = this.findSlot(pi, a.target); if (!sl) return this.fail('No such target');
    p.hand.splice(a.hand, 1);
    sl.energy.push(inst); p.energyAttached = true;
    this.log(`${p.name} attaches ${c.name} to ${this.nameOf(sl)}.`);
    return { ok: true };
  }

  doRetreat(pi, a) {
    const p = this.state.players[pi];
    if (p.retreated) return this.fail('Already retreated this turn');
    if (!p.active) return this.fail('No Active Pokemon');
    if (!this.canRetreat(p.active)) return this.fail('Cannot retreat (status or insufficient Energy)');
    const b = p.bench[a.bench]; if (!b) return this.fail('No such benched Pokemon');
    const cost = this.retreatCostOf(p.active);
    let pay = a.pay;
    if (!pay) {
      pay = [];
      let paid = 0;
      for (const e of this.retreatPayOrder(p.active)) {
        if (paid >= cost) break;
        pay.push(e.uid);
        paid += energySymbols(this.db, e).length;
      }
    }
    let paidSymbols = 0;
    for (const uid of pay) {
      const e = p.active.energy.find(x => x.uid === uid);
      if (!e) return this.fail('Energy not attached');
      paidSymbols += energySymbols(this.db, e).length;
    }
    if (paidSymbols < cost) return this.fail(`Must discard Energy worth ${cost}`);
    for (const uid of pay) {
      const k = p.active.energy.findIndex(e => e.uid === uid);
      if (k === -1) return this.fail('Energy not attached');
      p.discard.push(p.active.energy.splice(k, 1)[0]);
    }
    const old = p.active;
    clearStatus(old);
    p.active = b; p.bench.splice(a.bench, 1); p.bench.push(old);
    p.retreated = true;
    this.log(`${p.name} retreats ${this.nameOf(old)}; ${this.nameOf(b)} is now Active.`);
    return { ok: true };
  }

  // When the caller doesn't specify which Energy to discard for retreat, spend
  // the ones this Pokemon's own attacks don't ask for, so we never eat the last
  // Fire off a Charmeleon to pay a Colorless cost.
  retreatPayOrder(slot) {
    const c = topCard(this.db, slot);
    const needed = new Set();
    (c.attacks || []).forEach(a => a.cost.split('').forEach(x => { if (x !== 'C') needed.add(x); }));
    return slot.energy.slice().sort((x, y) => {
      const nx = needed.has(energyProvides(this.db, x)) ? 1 : 0;
      const ny = needed.has(energyProvides(this.db, y)) ? 1 : 0;
      return nx - ny;
    });
  }

  doPromote(pi, a) {
    const s = this.state;
    if (s.pendingPromote !== pi) return this.fail('Not waiting on you');
    const p = s.players[pi];
    const b = p.bench[a.bench]; if (!b) return this.fail('No such benched Pokemon');
    p.bench.splice(a.bench, 1); p.active = b;
    this.log(`${p.name} promotes ${this.nameOf(b)} to Active.`);
    this.clearPromote(pi);
    if (s.pendingPromote !== null || s.pendingSwitch !== null) return { ok: true };  // still owed
    if (s.pendingEndTurn) {
      s.pendingEndTurn = false;
      s.active = 1 - s.active;
      return this.startTurn();
    }
    return { ok: true };
  }

  // Discarding a Clefairy Doll / Mysterious Fossil straight off the board. Not a
  // Knock Out, so no Prize either way, and anything attached goes to the discard
  // with it exactly as it would on a Knock Out.
  doDiscardInPlay(pi, a) {
    const slot = this.findSlot(pi, a.uid);
    if (!slot) return this.fail('No such Pokemon');
    if (!this.playsAsPokemon(slot)) return this.fail('That card cannot be discarded from play');
    const name = this.nameOf(slot);
    const p = this.state.players[pi];
    this.scrapSlot(pi, slot, false);
    const where = this.removeSlot(pi, slot);
    this.log(`${name} is discarded from play.`, 'eff');
    if (where === 'active') {
      if (p.bench.length === 0) return this.endGame(1 - pi, `${p.name} has no Pokemon left`);
      this.addPromote(pi);
    }
    return { ok: true };
  }

  // Whirlwind's switch, chosen by the DEFENDING player. Same deferred-turn-end
  // shape as doPromote: whoever owes the choice makes it, and only once nothing
  // is outstanding does the turn actually change hands.
  doSwitchIn(pi, a) {
    const s = this.state;
    if (s.pendingSwitch !== pi) return this.fail('Not waiting on you');
    const p = s.players[pi];
    const b = p.bench[a.bench]; if (!b) return this.fail('No such benched Pokemon');
    const old = p.active;
    if (old) { clearStatus(old); p.bench.splice(a.bench, 1); p.active = b; p.bench.push(old); }
    else { p.bench.splice(a.bench, 1); p.active = b; }
    this.log(`${p.name} sends up ${this.nameOf(b)}.`, 'eff');
    s.pendingSwitch = null;
    if (s.pendingPromote !== null) return { ok: true };
    if (s.pendingEndTurn) {
      s.pendingEndTurn = false;
      s.active = 1 - s.active;
      return this.startTurn();
    }
    return { ok: true };
  }

  // ------------------------------------------------------------- trainers --
  doTrainer(pi, a) {
    const p = this.state.players[pi], o = this.state.players[1 - pi];
    const inst = p.hand[a.hand]; if (!inst) return this.fail('No such card');
    const c = this.db[inst.id];
    if (c.kind !== 'trainer') return this.fail('Not a Trainer card');
    if (p.trainersPlayed >= this.cfg.trainersPerTurn) return this.fail('Trainer limit reached this turn');
    const script = (this.effects[inst.id] && this.effects[inst.id].t);
    if (!script) return this.fail(`${c.name} is not implemented`);
    if (!this.trainerPlayable(pi, inst)) return this.fail(`${c.name} would do nothing`);

    p.hand.splice(a.hand, 1);
    this.log(`${p.name} plays ${c.name}.`, 'trainer');
    let toDiscard = true;

    for (const v of script) {
      switch (v.v) {
        case 'T_DRAW': {
          for (let i = 0; i < v.n && p.deck.length; i++) p.hand.push(p.deck.shift());
          this.log(`${p.name} draws ${v.n}.`); break;
        }
        case 'T_SWITCH_OWN': {
          const bi = (a.opts && a.opts.bench !== undefined) ? a.opts.bench : this.pick(p.bench.length);
          const b = p.bench[bi]; if (!b) return this.fail('Bad target');
          const old = p.active;
          clearStatus(old);
          p.active = b; p.bench.splice(bi, 1); p.bench.push(old);
          this.log(`${this.nameOf(b)} is now Active.`); break;
        }
        case 'T_SWITCH_OPPONENT': {
          const bi = (a.opts && a.opts.bench !== undefined) ? a.opts.bench : this.pick(o.bench.length);
          const b = o.bench[bi]; if (!b) return this.fail('Bad target');
          const old = o.active;
          clearStatus(old);
          o.active = b; o.bench.splice(bi, 1); o.bench.push(old);
          this.log(`${o.name}'s ${this.nameOf(b)} is dragged into the Active spot.`); break;
        }
        case 'T_DISCARD_OPP_ENERGY': {
          const slots = this.allSlots(1 - pi).filter(s => s.energy.length);
          const tgt = (a.opts && a.opts.targetUid) ? slots.find(s => s.uid === a.opts.targetUid) : slots[this.pick(slots.length)];
          if (!tgt) return this.fail('No Energy to remove');
          const e = tgt.energy.splice((a.opts && a.opts.energyIdx) || 0, 1)[0];
          o.discard.push(e);
          this.log(`${this.db[e.id].name} discarded from ${this.nameOf(tgt)}.`); break;
        }
        case 'T_HEAL': {
          const slots = this.allSlots(pi).filter(s => s.dmg > 0);
          const tgt = (a.opts && a.opts.targetUid) ? slots.find(s => s.uid === a.opts.targetUid) : slots[this.pick(slots.length)];
          if (!tgt) return this.fail('Nothing damaged');
          const heal = Math.min(v.n * 10, tgt.dmg);
          tgt.dmg -= heal;
          this.log(`${this.nameOf(tgt)} heals ${heal}. (${tgt.dmg} damage left)`); break;
        }
        case 'T_DISCARD_ENERGY_THEN_HEAL': {
          const slots = this.allSlots(pi).filter(s => s.dmg > 0 && s.energy.length);
          const tgt = (a.opts && a.opts.targetUid) ? slots.find(s => s.uid === a.opts.targetUid) : slots[this.pick(slots.length)];
          if (!tgt) return this.fail('No valid target');
          p.discard.push(tgt.energy.splice(0, 1)[0]);
          const heal = Math.min(v.n * 10, tgt.dmg);
          tgt.dmg -= heal;
          this.log(`${this.nameOf(tgt)} discards Energy and heals ${heal}.`); break;
        }
        case 'T_DEFENDER': {
          const slots = this.allSlots(pi);
          const tgt = (a.opts && a.opts.targetUid) ? slots.find(x => x.uid === a.opts.targetUid) : (p.active || slots[0]);
          if (!tgt) return this.fail('No Pokemon to attach to');
          tgt.effects.push({
            kind: 'DAMAGE_REDUCTION', amount: 20, label: 'Defender',
            expireAtEndOfTurn: this.state.turn + 1, card: inst,
          });
          this.log(`Defender attached to ${this.nameOf(tgt)} (-20 damage until the end of the opponent's next turn).`, 'eff');
          toDiscard = false;   // discarded when the effect expires
          break;
        }
        case 'T_COMPUTER_SEARCH': {
          // Hand indices are unsafe here: this Trainer has already been removed
          // from hand, shifting every index after it. Always resolve by uid.
          let uids = (a.opts && a.opts.discardUids) || null;
          if (!uids) {
            const pool = p.hand.map(x => x.uid);
            uids = [];
            while (uids.length < 2 && pool.length) uids.push(pool.splice(this.pick(pool.length), 1)[0]);
          }
          if (uids.length !== 2) return this.fail('Must discard exactly 2 other cards');
          for (const u of uids) {
            const k = p.hand.findIndex(x => x.uid === u);
            if (k === -1) return this.fail('Card to discard is not in hand');
            p.discard.push(p.hand.splice(k, 1)[0]);
          }
          let want = (a.opts && a.opts.pickUid !== undefined)
            ? p.deck.findIndex(x => x.uid === a.opts.pickUid) : -1;
          if (want === -1) want = this.pick(p.deck.length);
          const got = p.deck.splice(want, 1)[0];
          if (got) { p.hand.push(got); this.log(`Computer Search: found ${this.db[got.id].name}.`); }
          this.shuffle(p.deck);
          break;
        }
        case 'T_PLUSPOWER': {
          if (!p.active) return this.fail('No Active Pokemon');
          p.active.effects.push({
            kind: 'DAMAGE_BONUS', amount: 10,
            expireAtEndOfTurn: this.state.turn, card: inst,
          });
          this.log(`PlusPower attached to ${this.nameOf(p.active)} (+10 this turn).`, 'eff');
          toDiscard = false;   // discarded when the effect expires
          break;
        }
        case 'T_FULL_HEAL': {
          clearStatus(p.active);
          this.log(`${this.nameOf(p.active)} is healed of all Special Conditions.`);
          break;
        }
        case 'T_IMPOSTOR_OAK': {
          const n = o.hand.length;
          while (o.hand.length) o.deck.push(o.hand.pop());
          this.shuffle(o.deck);
          let drew = 0;
          for (let i = 0; i < 7 && o.deck.length; i++) { o.hand.push(o.deck.shift()); drew++; }
          this.log(`${o.name} shuffles ${n} card(s) away and draws ${drew}.`);
          break;
        }
        case 'T_MAINTENANCE': {
          let uids = (a.opts && a.opts.shuffleUids) || null;
          if (!uids) {
            const pool = p.hand.map(x => x.uid);
            uids = [];
            while (uids.length < 2 && pool.length) uids.push(pool.splice(this.pick(pool.length), 1)[0]);
          }
          if (uids.length !== 2) return this.fail('Must shuffle back exactly 2 cards');
          for (const u of uids) {
            const k = p.hand.findIndex(x => x.uid === u);
            if (k === -1) return this.fail('Card is not in hand');
            p.deck.push(p.hand.splice(k, 1)[0]);
          }
          this.shuffle(p.deck);
          if (p.deck.length) p.hand.push(p.deck.shift());
          this.log(`${p.name} shuffles 2 cards back and draws 1.`);
          break;
        }
        case 'T_POKEMON_CENTER': {
          let healed = 0, burned = 0;
          for (const sl of this.allSlots(pi)) {
            if (sl.dmg <= 0) continue;
            healed += sl.dmg; sl.dmg = 0;
            while (sl.energy.length) { p.discard.push(sl.energy.pop()); burned++; }
          }
          this.log(`Pokemon Center removes ${healed} damage and discards ${burned} Energy.`);
          break;
        }
        case 'T_REVIVE': {
          const cands = this.basicsIn(p.discard);
          const want = (a.opts && a.opts.pickUid) ? cands.find(x => x.uid === a.opts.pickUid) : cands[this.pick(cands.length)];
          if (!want) return this.fail('No Basic Pokemon in your discard pile');
          const k = p.discard.findIndex(x => x.uid === want.uid);
          const inst2 = p.discard.splice(k, 1)[0];
          const sl = this.mkSlot(inst2);
          sl.playedTurn = this.state.turn;
          const hp = this.db[inst2.id].hp;
          sl.dmg = Math.floor(hp / 2 / 10) * 10;
          p.bench.push(sl);
          this.log(`${this.db[inst2.id].name} is revived onto the Bench with ${sl.dmg} damage.`);
          break;
        }
        case 'T_POKEMON_FLUTE': {
          const cands = this.basicsIn(o.discard);
          const want = (a.opts && a.opts.pickUid) ? cands.find(x => x.uid === a.opts.pickUid) : cands[this.pick(cands.length)];
          if (!want) return this.fail("No Basic Pokemon in your opponent's discard pile");
          const k = o.discard.findIndex(x => x.uid === want.uid);
          const inst2 = o.discard.splice(k, 1)[0];
          const sl = this.mkSlot(inst2);
          sl.playedTurn = this.state.turn;
          o.bench.push(sl);
          this.log(`${this.db[inst2.id].name} is forced back onto ${o.name}'s Bench.`);
          break;
        }
        case 'T_SCOOP_UP': {
          const slots = this.allSlots(pi);
          const tgt = (a.opts && a.opts.targetUid) ? slots.find(x => x.uid === a.opts.targetUid) : slots[this.pick(slots.length)];
          if (!tgt) return this.fail('No Pokemon to scoop up');
          const name = this.nameOf(tgt);
          const where = this.removeSlot(pi, tgt);
          const kept = this.scrapSlot(pi, tgt, true);
          if (kept) p.hand.push(kept);
          this.log(`${name} is scooped up; ${this.db[kept.id].name} returns to hand and everything else is discarded.`);
          if (where === 'active' && p.bench.length) this.addPromote(pi);
          break;
        }
        case 'T_DEVOLUTION_SPRAY': {
          const slots = this.allSlots(pi).filter(x => x.stack.length > 1);
          const tgt = (a.opts && a.opts.targetUid) ? slots.find(x => x.uid === a.opts.targetUid) : slots[this.pick(slots.length)];
          if (!tgt) return this.fail('Nothing is evolved');
          // keep `keep` cards from the bottom of the stack
          const maxKeep = tgt.stack.length - 1;
          let keep = (a.opts && a.opts.keep !== undefined) ? a.opts.keep : maxKeep;
          keep = Math.max(1, Math.min(keep, maxKeep));
          const before = this.nameOf(tgt);
          const removed = tgt.stack.splice(keep);
          removed.forEach(x => p.discard.push(x));
          clearStatus(tgt);
          tgt.effects = tgt.effects.filter(e => { if (e.card) p.discard.push(e.card); return false; });
          const cap = topCard(this.db, tgt).hp;
          if (tgt.dmg > cap) tgt.dmg = cap;
          this.log(`${before} devolves to ${this.nameOf(tgt)}; ${removed.length} Evolution card(s) discarded.`, 'eff');
          this.checkKOs();
          break;
        }
        case 'T_ITEM_FINDER': {
          let uids = (a.opts && a.opts.discardUids) || null;
          if (!uids) {
            const pool = p.hand.map(x => x.uid);
            uids = [];
            while (uids.length < 2 && pool.length) uids.push(pool.splice(this.pick(pool.length), 1)[0]);
          }
          if (uids.length !== 2) return this.fail('Must discard exactly 2 other cards');
          for (const u of uids) {
            const k = p.hand.findIndex(x => x.uid === u);
            if (k === -1) return this.fail('Card is not in hand');
            p.discard.push(p.hand.splice(k, 1)[0]);
          }
          const trs = p.discard.filter(x => this.db[x.id].kind === 'trainer');
          const want = (a.opts && a.opts.pickUid) ? trs.find(x => x.uid === a.opts.pickUid) : trs[this.pick(trs.length)];
          if (want) {
            const k = p.discard.findIndex(x => x.uid === want.uid);
            p.hand.push(p.discard.splice(k, 1)[0]);
            this.log(`Item Finder recovers ${this.db[want.id].name}.`);
          } else this.log('Item Finder found no Trainer to recover.');
          break;
        }
        case 'T_POKEMON_TRADER': {
          const handMons = p.hand.filter(x => this.db[x.id].kind === 'pokemon');
          const give = (a.opts && a.opts.giveUid) ? handMons.find(x => x.uid === a.opts.giveUid) : handMons[this.pick(handMons.length)];
          if (!give) return this.fail('No Pokemon card in hand to trade');
          const deckMons = p.deck.filter(x => this.db[x.id].kind === 'pokemon');
          const take = (a.opts && a.opts.takeUid) ? deckMons.find(x => x.uid === a.opts.takeUid) : deckMons[this.pick(deckMons.length)];
          if (!take) return this.fail('No Pokemon card in deck to trade for');
          p.deck.push(p.hand.splice(p.hand.findIndex(x => x.uid === give.uid), 1)[0]);
          p.hand.push(p.deck.splice(p.deck.findIndex(x => x.uid === take.uid), 1)[0]);
          this.shuffle(p.deck);
          this.log(`Traded ${this.db[give.id].name} for ${this.db[take.id].name}.`);
          break;
        }
        case 'T_POKEDEX': {
          const n = Math.min(v.n || 5, p.deck.length);
          const order = (a.opts && a.opts.order) || null;
          if (order && order.length === n) {
            const top = p.deck.splice(0, n);
            const rearranged = [];
            for (const u of order) {
              const k = top.findIndex(x => x.uid === u);
              if (k === -1) return this.fail('Bad Pokedex ordering');
              rearranged.push(top.splice(k, 1)[0]);
            }
            p.deck = rearranged.concat(top, p.deck);
          }
          this.log(`${p.name} looks at the top ${n} cards and rearranges them.`);
          break;
        }
        case 'T_POKEMON_BREEDER': {
          const s2s = p.hand.filter(x => this.db[x.id].kind === 'pokemon' && this.db[x.id].stage === 'Stage 2');
          const card2 = (a.opts && a.opts.evoUid) ? s2s.find(x => x.uid === a.opts.evoUid) : null;
          const slots = this.allSlots(pi);
          const legalFor = (evoInst) => {
            const want = this.basicBehind(this.db[evoInst.id].name);
            return slots.filter(sl => topCard(this.db, sl).name === want
              && sl.playedTurn < this.state.turn && sl.evolvedTurn !== this.state.turn
              && !(this.cfg.noEvolveFirstTurn && p.turnsTaken <= 1));
          };
          let chosen = card2, targets = chosen ? legalFor(chosen) : [];
          if (!chosen || !targets.length) {
            for (const c2 of s2s) { const t = legalFor(c2); if (t.length) { chosen = c2; targets = t; break; } }
          }
          if (!chosen || !targets.length) return this.fail('No legal Pokemon Breeder play');
          const tgt = (a.opts && a.opts.targetUid) ? targets.find(x => x.uid === a.opts.targetUid) || targets[0] : targets[0];
          const was = this.nameOf(tgt);
          const k = p.hand.findIndex(x => x.uid === chosen.uid);
          tgt.stack.push(p.hand.splice(k, 1)[0]);
          tgt.evolvedTurn = this.state.turn;
          clearStatus(tgt);
          this.log(`Pokemon Breeder: ${was} evolves straight into ${this.nameOf(tgt)}.`, 'eff');
          break;
        }
        case 'T_PROFESSOR_OAK': {
          const n = p.hand.length;
          while (p.hand.length) p.discard.push(p.hand.pop());
          let drew = 0;
          for (let i = 0; i < 7 && p.deck.length; i++) { p.hand.push(p.deck.shift()); drew++; }
          this.log(`${p.name} discards ${n} card(s) and draws ${drew}.`);
          break;
        }
        case 'T_SUPER_ENERGY_REMOVAL': {
          const mine = this.allSlots(pi).filter(x => x.energy.length);
          const src = (a.opts && a.opts.selfUid) ? mine.find(x => x.uid === a.opts.selfUid) : mine[this.pick(mine.length)];
          if (!src) return this.fail('You have no Energy to discard');
          const theirs = this.allSlots(1 - pi).filter(x => x.energy.length);
          const tgt = (a.opts && a.opts.targetUid) ? theirs.find(x => x.uid === a.opts.targetUid) : theirs[this.pick(theirs.length)];
          if (!tgt) return this.fail('Opponent has no Energy to remove');
          p.discard.push(src.energy.splice(0, 1)[0]);
          let removed = 0;
          for (let i = 0; i < 2 && tgt.energy.length; i++) { o.discard.push(tgt.energy.splice(0, 1)[0]); removed++; }
          this.log(`${this.nameOf(src)} discards 1 Energy; ${removed} Energy discarded from ${this.nameOf(tgt)}.`);
          break;
        }
        case 'T_LASS': {
          let moved = 0;
          for (const pl of [p, o]) {
            const keep = [];
            for (const x of pl.hand) {
              if (this.db[x.id].kind === 'trainer') { pl.deck.push(x); moved++; }
              else keep.push(x);
            }
            pl.hand = keep; this.shuffle(pl.deck);
          }
          this.log(`Lass: ${moved} Trainer card(s) shuffled back into decks.`); break;
        }
        case 'T_PROFESSOR_OAK': if (p.deck.length === 0) return false; break;
        case 'T_DEFENDER': if (!this.allSlots(pi).length) return false; break;
        case 'T_FULL_HEAL': {
          if (!p.active) return false;
          const st = p.active.status;
          if (!(st.asleep || st.confused || st.paralyzed || st.poisoned)) return false;
          break;
        }
        case 'T_IMPOSTOR_OAK': if (!o.hand.length && !o.deck.length) return false; break;
        case 'T_MAINTENANCE': if (p.hand.length < 3 || !p.deck.length) return false; break;
        case 'T_POKEMON_CENTER': if (!this.allSlots(pi).some(x => x.dmg > 0)) return false; break;
        case 'T_REVIVE':
          if (p.bench.length >= this.cfg.benchMax) return false;
          if (!this.basicsIn(p.discard).length) return false;
          break;
        case 'T_POKEMON_FLUTE':
          if (o.bench.length >= this.cfg.benchMax) return false;
          if (!this.basicsIn(o.discard).length) return false;
          break;
        case 'T_SCOOP_UP':
          if (!this.allSlots(pi).length) return false;
          break;
        case 'T_DEVOLUTION_SPRAY':
          if (!this.allSlots(pi).some(x => x.stack.length > 1)) return false;
          break;
        case 'T_ITEM_FINDER':
          if (p.hand.length < 3) return false;
          if (!p.discard.some(x => this.db[x.id].kind === 'trainer')) return false;
          break;
        case 'T_POKEMON_TRADER':
          if (!p.deck.some(x => this.db[x.id].kind === 'pokemon')) return false;
          if (!p.hand.some(x => x.uid !== inst.uid && this.db[x.id].kind === 'pokemon')) return false;
          break;
        case 'T_POKEDEX': if (!p.deck.length) return false; break;
        case 'T_POKEMON_BREEDER': {
          const s2 = p.hand.filter(x => x.uid !== inst.uid && this.db[x.id].kind === 'pokemon' && this.db[x.id].stage === 'Stage 2');
          if (!s2.length) return false;
          const ok = s2.some(x => {
            const want = this.basicBehind(this.db[x.id].name);
            return this.allSlots(pi).some(sl => topCard(this.db, sl).name === want
              && sl.playedTurn < this.state.turn && sl.evolvedTurn !== this.state.turn
              && !(this.cfg.noEvolveFirstTurn && p.turnsTaken <= 1));
          });
          if (!ok) return false;
          break;
        }
        case 'T_COMPUTER_SEARCH':
          if (p.deck.length === 0) return false;
          if (p.hand.length < 3) return false;   // the card itself + 2 to discard
          break;
        case 'T_SUPER_ENERGY_REMOVAL':
          if (!this.allSlots(pi).some(x => x.energy.length)) return false;
          if (!this.allSlots(1 - pi).some(x => x.energy.length)) return false;
          break;
        case 'T_ENERGY_RETRIEVAL': {
          if (p.hand.length < 1) return this.fail('No card to trade');
          let di;
          if (a.opts && a.opts.discardUid !== undefined) {
            di = p.hand.findIndex(x => x.uid === a.opts.discardUid);
            if (di === -1) return this.fail('Card to discard is not in hand');
          } else di = this.pick(p.hand.length);
          p.discard.push(p.hand.splice(di, 1)[0]);
          let got = 0;
          for (let i = 0; i < v.n; i++) {
            const k = p.discard.findIndex(x => { const c2 = this.db[x.id]; return c2.kind === 'energy' && c2.cls === 'Basic'; });
            if (k === -1) break;
            p.hand.push(p.discard.splice(k, 1)[0]); got++;
          }
          this.log(`Energy Retrieval: recovered ${got} basic Energy.`); break;
        }
        default: return this.fail(`Unimplemented verb ${v.v}`);
      }
    }
    p.trainersPlayed++;
    if (toDiscard) p.discard.push(inst);
    this.checkKOs();
    return { ok: true };
  }

  pick(n) { return n <= 0 ? 0 : Math.floor(this.rand() * n); }

  // name -> what it evolves from, for walking evolution chains backwards
  evolvesFromName(name) {
    for (const id in this.db) {
      const c = this.db[id];
      if (c.kind === 'pokemon' && c.name === name) return c.evolvesFrom || '';
    }
    return '';
  }
  // The Basic at the bottom of a Stage 2's chain (Pokemon Breeder needs this).
  basicBehind(stage2Name) {
    const s1 = this.evolvesFromName(stage2Name);
    if (!s1) return '';
    return this.evolvesFromName(s1) || s1;
  }
  // Discard a whole slot's contents (Scoop Up, KO cleanup).
  scrapSlot(pi, slot, keepBottom) {
    const p = this.state.players[pi];
    const kept = keepBottom ? slot.stack.shift() : null;
    slot.stack.forEach(x => p.discard.push(x));
    slot.energy.forEach(x => p.discard.push(x));
    slot.effects.forEach(e => { if (e.card) p.discard.push(e.card); });
    slot.stack = []; slot.energy = []; slot.effects = [];
    return kept;
  }
  removeSlot(pi, slot) {
    const p = this.state.players[pi];
    if (p.active === slot) { p.active = null; return 'active'; }
    const k = p.bench.indexOf(slot);
    if (k >= 0) { p.bench.splice(k, 1); return 'bench'; }
    return null;
  }
  basicsIn(list) {
    return list.filter(x => { const c = this.db[x.id]; return c.kind === 'pokemon' && c.stage === 'Basic'; });
  }

  // --------------------------------------------------------------- combat --
  doAttack(pi, a) {
    const s = this.state;
    const me = s.players[pi], you = s.players[1 - pi];
    if (!this.canAttackAtAll(pi)) return this.fail('Cannot attack right now');
    const chk = this.canUseAttack(pi, a.idx);
    if (!chk.ok) return this.fail(chk.why);

    const atk = me.active, def = you.active;
    const card = topCard(this.db, atk);
    const attack = card.attacks[a.idx];
    const script = (this.effects[card.id] && this.effects[card.id].a && this.effects[card.id].a[a.idx]) || [];
    this.log(`${card.name} uses ${attack.name}.`, 'attack');

    // Confusion gate
    if (atk.status.confused) {
      if (!this.flip('Confusion')) {
        this.log(`${card.name} is Confused - the attack fails and it hits itself for 30.`, 'status');
        atk.dmg += 30;
        return this.finishAttack();
      }
    }

    // Sand-attack style interference: the ATTACKER carries the effect, applied by
    // whoever attacked it last turn.
    const jam = atk.effects.find(e => e.kind === 'ATTACK_FLIP');
    if (jam) {
      if (!this.flip(jam.label || 'attack succeeds?')) {
        this.log(`${card.name}'s attack does nothing.`, 'eff');
        if (script.some(v => v.v === 'ONCE_WHILE_IN_PLAY')) atk.usedAttacks[a.idx] = true;
        return this.finishAttack();
      }
    }
    if (script.some(v => v.v === 'ONCE_WHILE_IN_PLAY')) atk.usedAttacks[a.idx] = true;

    const r = this.runAttack(pi, atk, def, card, attack, script, a);
    if (!r.ok) return r;
    return this.finishAttack();
  }

  // The body of an attack, split from the business of deciding whether the
  // attacker may attack at all. Everything above stays in doAttack: legality,
  // the Confusion flip, Sand-attack interference, the once-per-play mark.
  //
  // The split exists so Metronome can re-enter HERE with the defender's attack
  // while `atk` is still Clefairy. That one fact gives the card's own footnote
  // for free — Weakness and Resistance are computed from `atk`, so a copied
  // attack really is Colorless — and makes "does N damage to itself" land on
  // Clefairy rather than on the Pokemon it was copied from.
  runAttack(pi, atk, def, card, attack, script, a, opts = {}) {
    const s = this.state;
    const me = s.players[pi], you = s.players[1 - pi];

    // --- attacks that REPLACE themselves with something else ---------------
    // Both of these resolve to a different attack entirely, so they run before
    // costs and damage rather than as post-damage effects.

    // Metronome. `atk` stays Clefairy; only the attack and its script change.
    if (script.some(v => v.v === 'METRONOME') && !opts.noMetronome) {
      const choices = this.metronomeChoices(pi);
      if (!choices.length) { this.log('There is no attack to copy.', 'eff'); return { ok: true }; }
      const dc = topCard(this.db, def);
      const which = (a && a.opts && choices.includes(a.opts.copyIdx))
        ? a.opts.copyIdx : choices[this.pick(choices.length)];
      const copied = dc.attacks[which];
      const cscript = (this.effects[dc.id] && this.effects[dc.id].a && this.effects[dc.id].a[which]) || [];
      this.log(`Metronome copies ${dc.name}'s ${copied.name}.`, 'eff');
      return this.runAttack(pi, atk, def, card, copied, cscript, a,
        { skipCosts: true, noMetronome: true });
    }

    // Mirror Move replays a RECORDED result rather than recomputing an attack.
    // "The final result" is already past Weakness and Resistance, so it is
    // re-applied flat — see RULINGS.md.
    if (script.some(v => v.v === 'MIRROR_MOVE')) {
      const rec = atk.lastAttackResult;
      if (!rec || rec.turn < s.turn - 1) {
        this.log(`${card.name} was not attacked last turn - Mirror Move does nothing.`, 'eff');
        return { ok: true };
      }
      if (!rec.damage && !(rec.statuses || []).length) {
        this.log('The attack being mirrored had no result to copy.', 'eff');
        return { ok: true };
      }
      this.log(`Mirror Move returns ${rec.label || 'that attack'}.`, 'eff');
      if (rec.damage > 0) this.dealDamage(atk, def, rec.damage, { noWR: true });
      if (!this.effectsBlocked(def)) for (const st of (rec.statuses || [])) this.applyStatus(def, st);
      return { ok: true };
    }

    // pay attack costs — skipped when copied, since Metronome explicitly does not
    // inherit "anything else required in order to use that attack"
    if (!opts.skipCosts) for (const v of script) {
      if (v.v === 'COST_DISCARD_ALL_ENERGY') {
        const n = atk.energy.length;
        while (atk.energy.length) me.discard.push(atk.energy.pop());
        this.log(`${card.name} discards all ${n} Energy as a cost.`);
      }
      if (v.v === 'COST_DISCARD_ENERGY') {
        for (let i = 0; i < v.n; i++) {
          const k = atk.energy.findIndex(e => !v.t || energyProvides(this.db, e) === v.t);
          if (k === -1) return this.fail('Cost could not be paid');
          me.discard.push(atk.energy.splice(k, 1)[0]);
        }
        this.log(`${card.name} discards ${v.n} ${v.t || ''} Energy as a cost.`.replace('  ', ' '));
      }
    }

    // base damage / damage-shaping verbs
    let base = parseDamage(attack.dmg);
    let nothing = false;
    let pendingRecoil = 0;
    for (const v of script) {
      if (v.v === 'FLIP_OR_NOTHING') { if (!this.flip('attack succeeds?')) nothing = true; }
      else if (v.v === 'DMG_PER_HEAD') {
        let h = 0;
        for (let i = 0; i < v.coins; i++) if (this.flip(`coin ${i + 1}/${v.coins}`)) h++;
        base = v.per * h;
        this.log(`${h} head(s) -> ${base} damage.`);
      } else if (v.v === 'DMG_PER_COUNTER_SELF') {
        base = v.per * (atk.dmg / 10);
        this.log(`${Math.floor(atk.dmg / 10)} damage counter(s) -> ${base} damage.`);
      } else if (v.v === 'DMG_PER_SPARE_ENERGY') {
        // "plus 10 more for each Water Energy attached but not used to pay
        // for this attack's cost"
        const need = attack.cost.split('').filter(x => x === v.t).length;
        const have = atk.energy.filter(e => energyProvides(this.db, e) === v.t).length;
        const spare = Math.max(0, have - need);
        base = v.base + v.per * spare;
        this.log(`${v.base} plus ${v.per} per spare ${v.t} Energy (${spare}) -> ${base} damage.`);
      } else if (v.v === 'DMG_HALF_REMAINING') {
        const hpLeft = def ? topCard(this.db, def).hp - def.dmg : 0;
        base = Math.ceil(hpLeft / 2 / 10) * 10;
        this.log(`Half of ${hpLeft} remaining HP, rounded up -> ${base} damage.`);
      } else if (v.v === 'FLIP_BONUS_OR_RECOIL') {
        // one flip governs both the bonus and the recoil
        if (this.flip(v.label || 'bonus damage?')) {
          base = v.base + v.bonus;
          this.log(`Heads -> ${base} damage.`);
        } else {
          base = v.base;
          pendingRecoil += v.recoil;
          this.log(`Tails -> ${base} damage, and ${card.name} will take ${v.recoil}.`);
        }
      } else if (v.v === 'DMG_PER_DEF_ENERGY') {
        const n2 = def ? def.energy.length : 0;
        base = v.base + v.per * n2;
        this.log(`${v.base} plus ${v.per} per Energy on the defender (${n2}) -> ${base} damage.`);
      } else if (v.v === 'DMG_PER_DEF_COUNTER') {
        const n2 = def ? Math.floor(def.dmg / 10) : 0;
        base = v.base + v.per * n2;
        this.log(`${v.base} plus ${v.per} per damage counter on the defender (${n2}) -> ${base} damage.`);
      } else if (v.v === 'DMG_MINUS_PER_COUNTER_SELF') {
        const c2 = Math.floor(atk.dmg / 10);
        base = Math.max(0, v.base - v.per * c2);
        this.log(`${v.base} minus ${v.per} per counter (${c2}) -> ${base} damage.`);
      }
    }

    if (nothing) { this.log('The attack does nothing.', 'eff'); return { ok: true }; }

    // Snapshot the defender's conditions so the post-damage loop's additions can
    // be diffed out afterwards. This is what Mirror Move replays: an EVENT
    // RECORD, written when the attack resolves, rather than the log — which is
    // prose for humans and would have to be parsed back into numbers.
    const stBefore = def ? Object.assign({}, def.status) : null;

    // Haunter. ONE coin for the whole attack, flipped before anything resolves,
    // because the card is "whenever an attack does anything" rather than a
    // per-instance shield. It lives here and not in computeDamage() for the same
    // reason: computeDamage is pure and the AI forecasts with it, so a flip in
    // there would consume RNG every time the bot thought about attacking.
    //
    // Only what is done TO Haunter is prevented. Recoil, bench splash and the
    // attacker's own buffs are untouched, which falls out of `blocked` gating
    // exactly the defender-targeting verbs and nothing else.
    const veil = def ? this.activePower(def, 'FLIP_TO_NEGATE') : null;
    let negated = false;
    if (veil) {
      negated = this.flip(`${veil.name}: prevent the attack?`);
      if (negated) this.log(`${veil.name}: everything done to ${this.nameOf(def)} is prevented.`, 'eff');
    }

    const res = negated ? { dealt: 0, prevented: true } : this.dealDamage(atk, def, base);
    if (pendingRecoil > 0) {
      atk.dmg += pendingRecoil;
      this.log(`${card.name} does ${pendingRecoil} damage to itself. (${atk.dmg} total)`, 'eff');
    }

    // post-damage verbs
    const blocked = negated || this.effectsBlocked(def);
    for (const v of script) {
      switch (v.v) {
        case 'STATUS':
          if (blocked) this.log(`${this.nameOf(def)} is protected - no ${v.s}.`, 'eff');
          else this.applyStatus(def, v.s);
          break;
        case 'STATUS_ON_FLIP':
          if (this.flip(`${v.s}?`)) {
            if (blocked) this.log(`${this.nameOf(def)} is protected - no ${v.s}.`, 'eff');
            else this.applyStatus(def, v.s);
          }
          break;
        case 'BARRIER_ON_FLIP':
          if (this.flip(v.label || 'prevent all effects?')) {
            atk.effects.push({ kind: 'PREVENT_ALL_EFFECTS', label: v.label || 'Agility',
                               expireAtStartOfTurn: s.turn + 2 });
            this.log(`${card.name} will prevent all effects of attacks during the opponent's next turn.`, 'eff');
          }
          break;
        case 'STATUS_COIN_EITHER':
          // heads one condition, tails the other - never nothing
          if (blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          this.applyStatus(def, this.flip(`${v.heads} or ${v.tails}?`) ? v.heads : v.tails);
          break;
        case 'TOXIC':
          if (blocked) { this.log(`${this.nameOf(def)} is protected - no Poison.`, 'eff'); break; }
          this.applyStatus(def, 'Poisoned');
          def.poisonDamage = v.n;
          this.log(`${this.nameOf(def)} now takes ${v.n} Poison damage between turns.`, 'status');
          break;
        case 'DISCARD_DEF_ENERGY': {
          if (blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          if (!def || !def.energy.length) { this.log('No Energy to discard.', 'eff'); break; }
          const k = (a.opts && a.opts.energyIdx !== undefined) ? a.opts.energyIdx : 0;
          const e2 = def.energy.splice(Math.min(k, def.energy.length - 1), 1)[0];
          you.discard.push(e2);
          this.log(`${this.db[e2.id].name} is discarded from ${this.nameOf(def)}.`, 'eff');
          break;
        }
        case 'BENCH_SPLASH_OWN': {
          for (const b of me.bench) this.dealDamage(atk, b, v.n, { noWR: true });
          this.log(`${v.n} damage to each of ${me.name}'s own Benched Pokemon.`, 'eff');
          break;
        }
        case 'ATTACK_LOCK': {
          if (blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          if (!def) break;
          const dc = topCard(this.db, def);
          const which = (a.opts && a.opts.attackIdx !== undefined)
            ? a.opts.attackIdx : this.pick((dc.attacks || []).length);
          def.effects.push({ kind: 'ATTACK_DISABLED', idx: which,
                             label: (dc.attacks[which] || {}).name || 'an attack',
                             expireAtStartOfTurn: s.turn + 2 });
          this.log(`${dc.name} can't use ${(dc.attacks[which] || {}).name} during the opponent's next turn.`, 'eff');
          break;
        }
        // Porygon. Both changes are permanent for as long as that Pokemon stays
        // in play — the card sets no expiry, and evolving or leaving play drops
        // the override with the slot.
        case 'CONVERT_DEF_WEAKNESS': {
          if (blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          if (!def || !this.weaknessOf(def)) { this.log('The Defending Pokemon has no Weakness to change.', 'eff'); break; }
          const t = (a && a.opts && a.opts.type) || this.energyTypes().filter(x => x !== 'C')[0];
          def.wkOverride = t;
          this.log(`Conversion 1: ${this.nameOf(def)}'s Weakness is now ${t}.`, 'eff');
          break;
        }
        case 'CONVERT_SELF_RESISTANCE': {
          const t2 = (a && a.opts && a.opts.type) || this.energyTypes().filter(x => x !== 'C')[0];
          atk.rsOverride = t2;
          this.log(`Conversion 2: ${card.name}'s Resistance is now ${t2}.`, 'eff');
          break;
        }
        case 'WHIRLWIND':
          // The DEFENDER chooses, not the attacker — the one place in Base Set
          // where a player makes a decision during their opponent's turn. The
          // engine defers the end of turn until they have.
          if (blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          if (!you.bench.length) { this.log(`${you.name} has no Benched Pokemon to switch to.`, 'eff'); break; }
          s.pendingSwitch = 1 - pi;
          this.log(`${you.name} must choose a Benched Pokemon to switch in.`, 'eff');
          break;
        case 'BARRIER':
          atk.effects.push({ kind: 'PREVENT_ALL_EFFECTS', label: 'Barrier',
                             expireAtStartOfTurn: s.turn + 2 });
          this.log(`${card.name} raises a Barrier - all effects of attacks, including damage, are prevented during the opponent's next turn.`, 'eff');
          break;
        case 'DESTINY_BOND':
          atk.effects.push({ kind: 'DESTINY_BOND', label: 'Destiny Bond',
                             expireAtStartOfTurn: s.turn + 2 });
          this.log(`${card.name} seals a Destiny Bond - whatever Knocks it out next turn goes down with it.`, 'eff');
          break;
        case 'RECOIL_ON_FLIP':
          if (!this.flip(v.label || 'avoid recoil?')) {
            atk.dmg += v.n;
            this.log(`${card.name} does ${v.n} damage to itself. (${atk.dmg} total)`, 'eff');
          }
          break;
        case 'HARDEN':
          atk.effects.push({ kind: 'PREVENT_UP_TO', threshold: v.threshold,
                             label: 'Harden', expireAtStartOfTurn: s.turn + 2 });
          this.log(`${card.name} hardens: ${v.threshold} or less damage will be prevented during the opponent's next turn.`, 'eff');
          break;
        case 'JAM_DEFENDER':
          if (blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          def.effects.push({ kind: 'ATTACK_FLIP', label: v.label || 'Sand-attack',
                             expireAtStartOfTurn: s.turn + 2 });
          this.log(`${this.nameOf(def)} is dazed - it must flip to attack next turn.`, 'eff');
          break;
        case 'BENCH_SPLASH': {
          for (let pi2 = 0; pi2 < 2; pi2++) {
            for (const b of s.players[pi2].bench) this.dealDamage(atk, b, v.n, { noWR: true });
          }
          this.log(`${v.n} damage splashed onto every Benched Pokemon.`, 'eff');
          break;
        }
        case 'RECOIL':
          atk.dmg += v.n;
          this.log(`${card.name} does ${v.n} damage to itself. (${atk.dmg} total)`, 'eff'); break;
        case 'HEAL_SELF_ALL':
          if (atk.dmg > 0) { this.log(`${card.name} removes all ${atk.dmg} damage from itself.`, 'eff'); atk.dmg = 0; }
          break;
        case 'HEAL_SELF_IF_DAMAGED':
          if (!res.prevented && atk.dmg > 0) {
            const h = Math.min(v.n * 10, atk.dmg); atk.dmg -= h;
            this.log(`${card.name} removes ${h} damage from itself.`, 'eff');
          }
          break;
        case 'PREVENT_ALL_DMG_SELF_ON_FLIP':
          if (this.flip('prevent damage?')) {
            atk.effects.push({ kind: 'PREVENT_ALL_DAMAGE', expireAtStartOfTurn: s.turn + 2 });
            this.log(`${card.name} will prevent all damage during the opponent's next turn.`, 'eff');
          }
          break;
        case 'SWITCH_DEFENDER_CHOOSE': {
          if (you.active && you.bench.length) {
            const bi = (a.opts && a.opts.bench !== undefined) ? a.opts.bench : this.pick(you.bench.length);
            const b = you.bench[bi];
            if (b) {
              const old = you.active;
              clearStatus(old);
              you.active = b; you.bench.splice(bi, 1); you.bench.push(old);
              this.log(`${this.nameOf(b)} is dragged into the Active spot.`, 'eff');
            }
          }
          break;
        }
      }
    }

    // Write the event record onto the DEFENDER. Mirror Move on that Pokemon's
    // next turn reads exactly this and nothing else.
    if (def && stBefore) {
      const gained = ['Asleep', 'Confused', 'Paralyzed', 'Poisoned']
        .filter(n => def.status[n.toLowerCase()] && !stBefore[n.toLowerCase()]);
      def.lastAttackResult = {
        turn: s.turn, by: atk.uid, label: `${card.name}'s ${attack.name}`,
        damage: res.dealt, statuses: gained,
      };
    }
    return { ok: true };
  }

  // Which of the defender's attacks Metronome may copy. A Metronome copying a
  // Metronome has no sensible resolution, so it is excluded — logged as a
  // deliberate call in RULINGS.md rather than left to recurse.
  metronomeChoices(pi) {
    const def = this.state.players[1 - pi].active;
    if (!def) return [];
    const dc = topCard(this.db, def);
    const out = [];
    (dc.attacks || []).forEach((x, i) => {
      const ds = (this.effects[dc.id] && this.effects[dc.id].a && this.effects[dc.id].a[i]) || [];
      if (ds.some(v => v.v === 'METRONOME')) return;
      out.push(i);
    });
    return out;
  }

  // Some attacks need a parameter chosen before they can be used, the same way
  // interactive Powers do. One entry per legal choice; [null] means "no choice
  // to make"; an EMPTY array means the attack is unusable right now.
  attackVariants(pi, idx) {
    const p = this.state.players[pi];
    if (!p.active) return [];
    const c = topCard(this.db, p.active);
    const script = (this.effects[c.id] && this.effects[c.id].a && this.effects[c.id].a[idx]) || [];
    const def = this.state.players[1 - pi].active;
    const types = this.energyTypes().filter(t => t !== 'C');   // "other than Colorless"

    if (script.some(v => v.v === 'METRONOME')) {
      if (!def) return [];
      const dc = topCard(this.db, def);
      return this.metronomeChoices(pi).map(i => ({
        opts: { copyIdx: i }, label: `Metronome: copy ${dc.attacks[i].name}`,
      }));
    }
    if (script.some(v => v.v === 'CONVERT_DEF_WEAKNESS')) {
      if (!def || !this.weaknessOf(def)) return [];            // "if it HAS a Weakness"
      return types.map(t => ({ opts: { type: t }, label: `Conversion 1: Weakness to ${t}` }));
    }
    if (script.some(v => v.v === 'CONVERT_SELF_RESISTANCE')) {
      return types.map(t => ({ opts: { type: t }, label: `Conversion 2: Resistance to ${t}` }));
    }
    return [null];
  }

  // Weakness and Resistance are normally the card's, but Porygon's Conversion
  // rewrites them per slot, so every read goes through these.
  weaknessOf(slot) {
    return slot.wkOverride !== undefined ? slot.wkOverride : topCard(this.db, slot).wkType;
  }
  resistanceOf(slot) {
    return slot.rsOverride !== undefined ? slot.rsOverride : topCard(this.db, slot).rsType;
  }

  finishAttack() {
    this.checkKOs();
    const s = this.state;
    if (s.phase === 'over') return { ok: true };
    // A Whirlwind switch is moot if the damage Knocked that Pokemon Out — the
    // player is promoting a replacement instead, which is the same decision.
    if (s.pendingSwitch !== null && !s.players[s.pendingSwitch].active) s.pendingSwitch = null;
    if (s.pendingSwitch !== null && !s.players[s.pendingSwitch].bench.length) s.pendingSwitch = null;
    return this.endTurn();
  }

  applyStatus(slot, s) {
    if (!slot) return;
    if (this.playsAsPokemon(slot)) {
      this.log(`${this.nameOf(slot)} can't be ${s}.`, 'eff');
      return;
    }
    // Snorlax. Note the card's own joke, which is faithfully reproduced by the
    // shared gate rather than special-cased: "can't be used if Snorlax is
    // ALREADY Asleep, Confused, or Paralyzed" — so the Power that prevents
    // those conditions stops working once one of them lands by another route.
    const skin = this.activePower(slot, 'STATUS_IMMUNE');
    if (skin) {
      this.log(`${skin.name}: ${this.nameOf(slot)} can't be ${s}.`, 'eff');
      return;
    }
    if (s === 'Poisoned') { slot.status.poisoned = true; if (!slot.poisonDamage) slot.poisonDamage = 10; }
    else {
      slot.status.asleep = false; slot.status.paralyzed = false; slot.status.confused = false;
      if (s === 'Asleep') slot.status.asleep = true;
      if (s === 'Paralyzed') { slot.status.paralyzed = true; slot.paralyzedTurn = this.state.turn; }
      if (s === 'Confused') slot.status.confused = true;
    }
    this.log(`${this.nameOf(slot)} is now ${s}.`, 'status');
  }

  // PURE. Returns what `base` damage from atkSlot would do to defSlot, with a
  // step log, without mutating anything. dealDamage() applies the result, and
  // the AI uses it to forecast. Single source of truth: the AI can never
  // predict something the engine wouldn't actually do.
  computeDamage(atkSlot, defSlot, base, opts = {}) {
    const steps = [];
    if (!defSlot) return { dmg: 0, prevented: false, steps };
    const A = topCard(this.db, atkSlot), D = topCard(this.db, defSlot);
    let dmg = base;
    if (dmg > 0 && !opts.noWR) {
      // Read through the per-slot overrides — Porygon's Conversion rewrites these.
      const wk = this.weaknessOf(defSlot), rs = this.resistanceOf(defSlot);
      if (wk && wk === A.type) {
        dmg *= this.cfg.weaknessMultiplier;
        steps.push(`Weakness: ${D.name} takes double -> ${dmg}.`);
      }
      if (rs && rs === A.type) {
        dmg -= this.cfg.resistanceFlat;
        steps.push(`Resistance: -${this.cfg.resistanceFlat} -> ${Math.max(0, dmg)}.`);
      }
      if (dmg < 0) dmg = 0;
    }
    if (dmg > 0) {
      for (const e of atkSlot.effects) {
        if (e.kind === 'DAMAGE_BONUS') { dmg += e.amount; steps.push(`+${e.amount} from ${e.label || 'a bonus'} -> ${dmg}.`); }
      }
    }
    if (dmg > 0) {
      for (const e of defSlot.effects) {
        if (e.kind === 'DAMAGE_REDUCTION') {
          dmg -= e.amount;
          steps.push(`-${e.amount} from ${e.label || 'a shield'} -> ${Math.max(0, dmg)}.`);
        }
      }
      if (dmg < 0) dmg = 0;
    }
    // Passive Powers that reshape incoming damage. CONSULTED here rather than
    // living in defSlot.effects, so Muk switching them off is one question asked
    // at the moment it matters instead of a cache to keep in step. Both are
    // "after applying Weakness and Resistance" by their own text, which is why
    // they sit below the W/R block and inside the same band as PlusPower and
    // Defender. Deterministic on purpose: this function is PURE and the AI
    // forecasts with it, so Haunter's coin lives in dealDamage instead.
    if (dmg > 0) {
      const halve = this.activePower(defSlot, 'DAMAGE_HALVE');
      if (halve) {
        dmg = Math.floor(dmg / 2 / 10) * 10;                 // "rounded DOWN to the nearest 10"
        steps.push(`${halve.name}: halved to ${dmg}.`);
      }
    }
    let prevented = false;
    const absolute = defSlot.effects.find(e => e.kind === 'PREVENT_ALL_DAMAGE' || e.kind === 'PREVENT_ALL_EFFECTS');
    const threshold = defSlot.effects.find(e => e.kind === 'PREVENT_UP_TO');
    // Mr. Mime. The inverse of Harden: big hits bounce, small ones land.
    const wall = this.activePower(defSlot, 'PREVENT_AT_LEAST');
    if (absolute) {
      if (dmg > 0) { steps.push(`All damage to ${D.name} is prevented.`); prevented = true; }
      dmg = 0;
    } else if (threshold && dmg > 0 && dmg <= threshold.threshold) {
      steps.push(`${D.name} is Hardened: ${dmg} damage (${threshold.threshold} or less) is prevented.`);
      dmg = 0; prevented = true;
    } else if (wall && dmg >= wall.n) {
      steps.push(`${wall.name}: ${dmg} damage (${wall.n} or more) is prevented.`);
      dmg = 0; prevented = true;
    }
    return { dmg, prevented, steps };
  }

  dealDamage(atkSlot, defSlot, base, opts = {}) {
    if (!defSlot) return { dealt: 0, prevented: false };
    const D = topCard(this.db, defSlot);
    const r = this.computeDamage(atkSlot, defSlot, base, opts);
    r.steps.forEach(t => this.log(t, t.indexOf('prevented') >= 0 || t.indexOf('Hardened') >= 0 ? 'eff' : 'dmg'));
    if (r.dmg > 0) {
      defSlot.dmg += r.dmg;
      defSlot.lastHitBy = { uid: atkSlot.uid, turn: this.state.turn };
      this.log(`${D.name} takes ${r.dmg}. (${defSlot.dmg}/${D.hp})`, 'dmg');
      this.retaliate(atkSlot, defSlot, opts);
    }
    return { dealt: r.dmg, prevented: r.prevented };
  }

  // RETALIATE (Machamp's Strikes Back). Fires here, immediately after the damage
  // lands and before checkKOs, which is what makes it work "even if Machamp is
  // Knocked Out". Every dealDamage() call is attack damage from one Pokemon to
  // another — recoil adds to `dmg` directly and never comes through here — so
  // the only guards needed are self-damage and one level of recursion, the
  // latter for the Machamp-versus-Machamp case.
  retaliate(atkSlot, defSlot, opts) {
    if (opts.noRetaliate || !atkSlot || atkSlot === defSlot) return;
    const p = this.powerOf(defSlot);
    if (!p || p.kind !== 'RETALIATE' || !this.powerUsable(defSlot)) return;
    this.log(`${p.name}: ${this.nameOf(defSlot)} strikes back at `
      + `${this.nameOf(atkSlot)} for ${p.dmg}.`, 'eff');
    this.dealDamage(defSlot, atkSlot, p.dmg, { noWR: true, noRetaliate: true });
  }

  // True when an attack's non-damage effects should be suppressed on this target.
  effectsBlocked(slot) {
    return !!slot && slot.effects.some(e => e.kind === 'PREVENT_ALL_EFFECTS');
  }

  // ---------------------------------------------------------- KO / win -----
  checkKOs() {
    const s = this.state;
    if (s.phase === 'over') return;
    let any = true;
    while (any) {
      any = false;
      for (let i = 0; i < 2 && !any; i++) {
        const p = s.players[i], o = s.players[1 - i];
        const kill = (slot, fromBench, idx) => {
          const c = topCard(this.db, slot);
          this.log(`${c.name} is Knocked Out!`, 'ko');
          // Destiny Bond: whatever Knocked this out is Knocked Out in turn.
          const bond = slot.effects.find(e => e.kind === 'DESTINY_BOND');
          if (bond && slot.lastHitBy) {
            const killer = this.allSlots(1 - i).find(x => x.uid === slot.lastHitBy.uid);
            if (killer && !killer.forcedKO) {
              killer.forcedKO = true;
              this.log(`Destiny Bond: ${this.nameOf(killer)} is dragged down with ${c.name}!`, 'ko');
            }
          }
          slot.stack.forEach(x => p.discard.push(x));
          slot.energy.forEach(x => p.discard.push(x));
          slot.effects.forEach(e => { if (e.card) p.discard.push(e.card); });
          if (fromBench) p.bench.splice(idx, 1); else p.active = null;
          // "If Clefairy Doll is Knocked Out, it doesn't count as a Knocked Out
          // Pokemon" — no Prize. The no-Pokemon-left loss below still applies,
          // because that keys on the board, not on the Knock Out.
          if (c.playsAs === 'pokemon') {
            this.log(`${c.name} doesn't count as a Knocked Out Pokemon - no Prize.`, 'eff');
          } else if (o.prizes.length) {
            o.hand.push(o.prizes.shift());
            this.log(`${o.name} takes a Prize. (${o.prizes.length} left)`, 'prize');
          }
        };
        const dead = (sl) => sl.forcedKO || sl.dmg >= topCard(this.db, sl).hp;
        if (p.active && dead(p.active)) { kill(p.active, false, -1); any = true; }
        if (!any) for (let k = 0; k < p.bench.length; k++) {
          if (dead(p.bench[k])) { kill(p.bench[k], true, k); any = true; break; }
        }
        if (any) {
          if (o.prizes.length === 0) return this.endGame(1 - i, `${o.name} took all Prizes`);
          if (!p.active && p.bench.length === 0) return this.endGame(1 - i, `${p.name} has no Pokemon left`);
          if (!p.active && p.bench.length > 0) this.addPromote(i);
        }
      }
    }
  }

  endGame(winner, reason) {
    this.state.phase = 'over';
    this.state.winner = winner;
    this.state.winReason = reason;
    this.state.pendingPromote = null;
    this.state.promoteQueue = [];
    this.log(`GAME OVER - ${this.state.players[winner].name} wins: ${reason}`, 'win');
    return { ok: true, over: true };
  }

  // ---------------------------------------------------------------- AI -----
  // Returns ONE action, or null if this player has nothing to do. The UI steps
  // through these so the opponent's turn reads at human pace; the harness loops.
  //
  // 'expert' / 'novice' delegate to the expected-value AI in ai.js.
  // 'greedy' and 'random' are kept as rules fuzzers - see the note in choose().
  aiChoose(pi, mode = 'expert') {
    if (mode === 'expert' || mode === 'novice') {
      if (!this._ai || this._ai.mode !== mode) {
        // ai.js is concatenated before this file in the browser bundle, and
        // required here under Node. Resolve at call time so both work.
        const Klass = (typeof AI !== 'undefined') ? AI : require('./ai.js').AI;
        this._ai = new Klass(this, { mode });
      }
      return this._ai.choose(pi);
    }
    const s = this.state;
    if (s.phase === 'over') return null;

    // Whirlwind asks the DEFENDER, so this has to be answered even by the simple
    // bots — otherwise nobody replies and the turn never ends.
    if (s.pendingSwitch !== null) {
      if (s.pendingSwitch !== pi) return null;
      const sw = this.legalActions(pi).filter(a => a.t === 'switchIn');
      if (!sw.length) return null;
      if (mode === 'random') return sw[this.pick(sw.length)];
      const pp = s.players[pi];
      let bestSw = sw[0], bhSw = -1;
      sw.forEach(a => { const h = topCard(this.db, pp.bench[a.bench]).hp; if (h > bhSw) { bhSw = h; bestSw = a; } });
      return bestSw;
    }

    if (s.pendingPromote !== null) {
      if (s.pendingPromote !== pi) return null;
      const acts = this.legalActions(pi).filter(a => a.t === 'promote');
      if (!acts.length) return null;
      if (mode === 'random') return acts[this.pick(acts.length)];
      const p = s.players[pi];
      let best = acts[0], bh = -1;
      acts.forEach(a => { const h = topCard(this.db, p.bench[a.bench]).hp; if (h > bh) { bh = h; best = a; } });
      return best;
    }

    if (s.active !== pi) return null;
    const acts = this.legalActions(pi);
    if (!acts.length) return null;

    if (mode === 'random') {
      const attacks = acts.filter(x => x.t === 'attack');
      const others = acts.filter(x => x.t !== 'attack' && x.t !== 'pass');
      if (others.length && this.rand() < 0.72) return others[this.pick(others.length)];
      if (attacks.length) return attacks[this.pick(attacks.length)];
      return acts.find(x => x.t === 'pass');
    }

    const p = s.players[pi];
    const evolve = acts.find(a => a.t === 'evolve' && p.active && a.target === p.active.uid)
                || acts.find(a => a.t === 'evolve');
    const attachActive = acts.find(a => a.t === 'attachEnergy' && p.active && a.target === p.active.uid);
    const benchIt = acts.find(a => a.t === 'playBasic');
    const attacks = acts.filter(a => a.t === 'attack');

    if (evolve) return evolve;
    if (attachActive) return attachActive;
    if (p.bench.length < 2 && benchIt) return benchIt;
    if (attacks.length) {
      let best = attacks[0], bd = -1;
      for (const a of attacks) {
        const d = parseDamage(topCard(this.db, p.active).attacks[a.idx].dmg);
        if (d > bd) { bd = d; best = a; }
      }
      return best;
    }
    return acts.find(a => a.t === 'pass');
  }

  aiTurn(pi, mode = 'expert', maxActions = 40) {
    let n = 0;
    while (n++ < maxActions) {
      const s = this.state;
      if (s.phase === 'over') return;
      const a = this.aiChoose(pi, mode);
      if (!a) return;
      const before = s.turn;
      this.act(pi, a);
      if (s.turn !== before || (s.active !== pi && s.pendingPromote === null)) return;
    }
    if (this.state.active === pi && this.state.phase !== 'over' && this.state.pendingPromote === null) {
      this.act(pi, { t: 'pass' });
    }
  }

  randomTurn(pi) { return this.aiTurn(pi, 'random'); }

  // A blunt "always builds the Active and swings" player. Not smart - its job is
  // to drive games to Prize-based endings so the KO / promote / win paths get
  // exercised, which pure random play almost never does.
  greedyTurn(pi) { return this.aiTurn(pi, 'greedy'); }
}

if (typeof module !== 'undefined') module.exports = { Engine, CONFIG_DEFAULTS, mulberry32 };

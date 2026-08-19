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
// TWO views of what a slot is, and the difference is Ditto.
//
//   baseCard  the card actually sitting there — always Ditto, for Ditto.
//   topCard   what it is TREATED as, which is the transformed copy.
//
// topCard is the one nearly everything wants: HP, type, Weakness, Resistance,
// retreat cost, attacks and name all come from it, so Transform gets all of
// them from one override instead of seven. baseCard is for the handful of
// questions about the physical card — which Power it has, whether it may
// evolve, and what goes to the discard pile when it dies.
const baseCard = (db, slot) => db[topInst(slot).id];
const topCard = (db, slot) =>
  (slot && slot.transformedId && db[slot.transformedId]) || db[topInst(slot).id];

function parseDamage(d) {
  if (!d) return 0;
  const m = String(d).match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// ONE SYMBOL, EVERY TYPE. The sentinel Rainbow Energy provides, and the reason
// it is a sentinel rather than a longer string: `provides` says both HOW MANY
// symbols and WHICH types, and Rainbow is one symbol whose type is "all of
// them". 'WFPLGR' would be six symbols, which is a different and absurd card.
//
// Three questions read it and THEY DO NOT ALL ANSWER THE SAME WAY, which is the
// whole subtlety of this card:
//   costSatisfied()    pays for any one symbol of any type          — yes
//   energyIsType()     counts toward "for each <type> Energy"       — yes
//   isBasicEnergyOf()  is it a basic <type> Energy CARD             — ONLY IN PLAY
// See Rulings/ENERGY-VS-ENERGY-CARD.md.
const WILD = '*';

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

// DOES THIS ATTACHED CARD COUNT AS `type`? Every "for each Water Energy attached
// to it" in the game asks this, and until 18 Aug 2026 all seven sites asked it
// as `energyProvides(...) === t` and got the right answer for the wrong reason.
//
// The right reason is the ruling in Rulings/ENERGY-VS-ENERGY-CARD.md: the word
// *Energy* counts by LIVE TYPE, not by which card it physically is. Every card
// in the three live sets happens to provide exactly one type, so the two
// readings agree everywhere and the distinction is invisible.
//
// RAINBOW ENERGY IS WHERE THEY COME APART, and it lands in Job 10d. It provides
// every type AT ONCE — not a wildcard resolved to one type when asked — so it is
// a spare Water for Hydrocannon and a spare Fire for a Fire-scaling attack in the
// same turn, with nothing choosing and nothing to remember. `energyProvides`
// returns one string and cannot say that, which the ruling flags as unsolved.
//
// So this exists BEFORE the card does, and its whole job is to be the one place
// that has to learn. Seven call sites now route through it; if they had not, 10d
// would have had to find all seven and would have missed one in silence — which
// is a card quietly scaling wrong, with every suite green.
function energyIsType(db, inst, type) {
  if (!type) return true;
  const p = energyProvides(db, inst);
  // Rainbow. It IS every type, simultaneously, rather than a wildcard that
  // resolves to one when asked — so the same card is a spare Water for
  // Hydrocannon and a spare Fire for a Fire-scaling attack in the same turn,
  // and nothing has to remember a choice because none was made.
  if (p === WILD) return true;
  return p === type;
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
  // A deck entry is [qty, id] or [qty, id, vkey], and THE THIRD ELEMENT USED TO
  // BE DROPPED HERE — silently, by the destructuring. The deck builder lets you
  // choose which physical copy goes in, wrote that choice into the list, and the
  // engine discarded it at the door, so no card in play could ever carry a
  // variant and the whole in-play half of the feature was unreachable rather
  // than merely unbuilt. Found 16 Aug 2026 from a grab bag item that asked
  // whether variants displayed in game; the answer was that they could not.
  //
  // The key rides on the instance as `v`. The engine does nothing with it — it
  // is cosmetic, and every rules path reads `id` — but it must survive, because
  // the renderers and the match log both want it.
  buildDeck(deckDef) {
    const out = [];
    for (const [qty, id, v] of deckDef.list) {
      for (let i = 0; i < qty; i++) {
        const inst = { uid: this.uid++, id };
        if (v) inst.v = v;
        out.push(inst);
      }
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
      this.enterPlay(pi, p.active, { source: 'setup' });
    } else {
      if (!p.active) return this.fail('Set your Active first');
      if (p.bench.length >= this.cfg.benchMax) return this.fail('Bench is full');
      p.hand.splice(handIdx, 1); p.bench.push(this.mkSlot(inst));
      this.enterPlay(pi, p.bench[p.bench.length - 1], { source: 'setup' });
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

  // Is this a Basic that something in the card pool evolves from? Cached on
  // first use — it is a property of the DATABASE, not of the game.
  isLineStarter(name) {
    if (!this._lineStarters) {
      this._lineStarters = {};
      for (const id in this.db) {
        const f = this.db[id].evolvesFrom;
        if (f) this._lineStarters[f] = 1;
      }
    }
    return !!this._lineStarters[name];
  }

  // OPENING PLACEMENT, and it is BOTH sides' — the opponent uses it and so does
  // the player's "auto" button, so it is a sensible default rather than an AI
  // decision. That is why it lives here and not in ai.js.
  //
  // IT USED TO BE `sort by HP, take the biggest`, one line. The opening Active
  // takes the first hits and cannot retreat without Energy nobody has yet, so
  // that one number was deciding the most locked-in choice in the game.
  //
  // What HP alone cannot see is that a Charmander is not a 50 HP Pokemon, it is
  // the bottom of a line — putting it Active with no Charmeleon behind it feeds
  // the deck's own engine to the opponent. Measured over Trevor's eight Base Set
  // decks at 6,000 hands each: 6.0% of hands WITH A REAL CHOICE opened a stranded
  // line-starter while a standalone Basic sat in the same hand, and three of the
  // eight were between 11% and 20%. `tools/openercheck.js` is that measurement.
  //
  // So Basics are ranked before HP is consulted, and a starter is only demoted
  // when it is genuinely stranded. Three things rescue it:
  //
  //   - its evolution is in hand, so it evolves next turn and is the right lead
  //   - a SPARE COPY is in hand. Trevor's refinement, 18 Aug: only one can be
  //     Active, so the duplicate covers the evolution path and the one out front
  //     is free to be spent. Redundancy converts a liability into an attacker
  //   - nothing evolves from it at all, so there is nothing to strand
  //
  // Within a rank it is still HP, which was never the wrong tiebreak — only the
  // wrong first question.
  setupAuto(pi) {
    const p = this.state.players[pi];
    const basics = () => p.hand.map((x, i) => [i, this.db[x.id]])
      .filter(([, c]) => c.kind === 'pokemon' && c.stage === 'Basic');
    let b = basics();
    if (!b.length) return this.fail('No Basic to place');

    const counts = {};
    b.forEach(([, c]) => { counts[c.name] = (counts[c.name] || 0) + 1; });
    const stranded = (c) => {
      if (!this.isLineStarter(c.name)) return 0;
      if (counts[c.name] > 1) return 0;
      const evoInHand = p.hand.some(x => this.db[x.id] && this.db[x.id].evolvesFrom === c.name);
      return evoInHand ? 0 : 1;
    };
    b.sort((x, y) => (stranded(x[1]) - stranded(y[1])) || (y[1].hp - x[1].hp));

    this.setupPlace(pi, b[0][0], 'active');
    while (p.bench.length < this.cfg.benchMax) {
      b = basics(); if (!b.length) break;
      b.sort((x, y) => y[1].hp - x[1].hp);   // the Bench does not care; biggest first
      this.setupPlace(pi, b[0][0], 'bench');
    }
    return this.setupConfirm(pi);
  }

  // Idempotent, and it has to be. `setupAuto` ends by calling this, so the
  // natural-looking script `setupAuto(0); setupConfirm(0); setupAuto(1);
  // setupConfirm(1)` confirms each player TWICE — and the fourth call found both
  // players done and ran beginPlay() a second time, dealing a second opening
  // hand and a second set of Prizes.
  //
  // That is exactly the "robustness nit" CLAUDE.md listed as unreachable through
  // the UI, and it had been biting every harness in the repo since Job 4:
  // selftest.js, aitest.js and aiduel.js all used that pattern, so every scripted
  // game ran at **12 Prizes instead of 6** — twice the length and a completely
  // different pace. Found on 11 Aug 2026 by reading a match log and noticing the
  // deck drop seven cards between two identical turn banners.
  setupConfirm(pi) {
    const p = this.state.players[pi];
    if (!p.active) return this.fail('You must place an Active Pokemon');
    if (this.state.setupDone[pi]) return { ok: true };      // already confirmed
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
      // Job 6e. `powerTurn` is the turn a once-per-turn Power last fired;
      // `typeAs` is Venomoth's Shift, read through typeOf() rather than
      // baked into the card, exactly like slotSymbols and wkOverride.
      powerTurn: -1, typeAs: null, transformedId: null,
    };
  }

  // ----------------------------------------------------------- triggers ----
  // Job 10c. A THIRD kind of Power, after interactive and passive.
  //
  // An interactive Power is offered as an action and the player chooses to use
  // it. A passive Power is never fired at all — it is CONSULTED at the moment it
  // matters. A triggered Power is neither: nobody chooses it and there is a
  // definite moment it happens.
  //
  // THREE TRIGGERS, AND THEY ARE NOT ONE MECHANISM. That is deliberate, and the
  // survey behind it is the reason:
  //
  //   ON_PLAY        20 printings across six sets, and THE EFFECTS ARE ALL
  //                  DIFFERENT — search the deck, mill either deck on a coin,
  //                  heal every Grass in play, hand the opponent a redraw. What
  //                  generalises is the trigger, not the effect, so this one
  //                  takes a VERB LIST and a card author writes a script rather
  //                  than engine code.
  //   ON_KO          three printings, two behaviours, in the whole era. Nothing
  //                  to generalise, so it is narrow and exact instead.
  //   ON_OPP_RETREAT two behaviours, and they DISAGREE — Sinkhole fires when the
  //                  opponent "retreats", Unown [C] when it "tries to retreat".
  //                  The flag between them is the whole design.
  //
  // A POKEMON POWER IS NOT AN ATTACK. Every damaging thing here passes
  // noRetaliate and noMirror, because Strikes Back reads "whenever an opponent's
  // ATTACK damages" and Mirror Shell reads "if an ATTACK does damage". It is the
  // same principle that keeps Final Beam answering attacks only. See RULINGS.md.
  // "When <this> is Knocked Out BY AN ATTACK." Three printings in the era and
  // two behaviours, so this is narrow on purpose rather than general.
  //
  // ONLY AN ATTACK COUNTS — Trevor's call, 18 Aug 2026, from Pocket, and the
  // argument for it is that the opposite reading has no natural edge. Damage
  // from a Power, from Poison, from Confusion, from Retaliate or from a Mirror
  // Shell all leave the same corpse, and a rule that answered "anything that
  // originated during an attack step" would need re-deciding for every future
  // card that deals damage without attacking. `lastHitBy.byAttack` is the whole
  // test. See RULINGS.md.
  fireOnKO(pi, slot) {
    const p = this.powerOf(slot);
    if (!p || p.kind !== 'ON_KO') return;
    if (!this.powerUsable(slot)) return;
    const hit = slot.lastHitBy;
    if (!hit || !hit.byAttack) return;
    const killer = this.allSlots(1 - pi).find(x => x.uid === hit.uid);
    if (!killer) return;
    this.log(`${p.name}: ${this.nameOf(slot)} answers.`, 'eff');
    this.runPowerScript(pi, slot, p.do || [], null, { killer });
  }

  // "Whenever your opponent's Active Pokemon retreats." Fires from anywhere on
  // the owner's board — Powers work wherever their Pokemon is unless the card
  // says otherwise, and Sinkhole does not say otherwise — so several Dark
  // Dugtrios each take their own flip, exactly as several Muks each carry their
  // own Toxic Gas.
  //
  // A FAILED CONFUSED RETREAT DOES NOT COUNT, and the era settles this itself:
  // Neo 4's Unown [C] is printed "whenever your opponent's Active Pokemon TRIES
  // to retreat", which is a distinction nobody draws unless the plain wording
  // means the successful one. `onAttempt` is where that card will hang; it is
  // not built, because building a flag for a card two sets away is how a shape
  // gets guessed wrong. See RULINGS.md.
  fireOnOppRetreat(pi, retreated) {
    // pi is the player who just retreated; the Powers that care belong to the
    // other one.
    for (const slot of this.allSlots(1 - pi)) {
      const p = this.powerOf(slot);
      if (!p || p.kind !== 'ON_OPP_RETREAT' || p.onAttempt) continue;
      if (!this.powerUsable(slot)) continue;
      this.log(`${p.name}: ${this.nameOf(slot)} opens up underneath ${this.nameOf(retreated)}.`, 'eff');
      this.runPowerScript(1 - pi, slot, p.do || [], null, { retreated });
    }
    this.checkKOs();
  }

  fireOnPlay(pi, slot, opts) {
    const p = this.powerOf(slot);
    if (!p || p.kind !== 'ON_PLAY') return;
    // powerUsable, not powerActive: a Muk on either side switches this off, and
    // that is the one gate that can really bite here. The status gate cannot —
    // a card arriving from hand has no conditions, and evolving clears them.
    if (!this.powerUsable(slot)) {
      this.log(`${p.name} does not work right now.`, 'eff');
      return;
    }
    this.log(`${p.name}: ${this.nameOf(slot)} arrives.`, 'eff');
    this.runPowerScript(pi, slot, p.do || [], opts, null);
    this.checkKOs();
  }

  // The Power verb pipeline. A THIRD namespace after attack verbs and Trainer
  // cases, and consistent with them rather than a new idea — Trainers have had
  // their own switch since Base Set for exactly this reason.
  //
  // It deliberately does NOT re-enter the attack pipeline. That loop is built
  // around an attacker, a defender, a damage number and a Barrier check, and
  // most of its cases assume a defender exists. Re-entering it with a null
  // defender would mean auditing every one of them on behalf of a card that has
  // no defender at all — a bigger and far more dangerous job than writing the
  // handful of verbs a Power actually needs.
  //
  // Choices arrive the way every other choice in this engine arrives — on the
  // action's `opts`, with a deterministic fallback so the AI and older callers
  // work untouched. Named by ROLE:
  //   opts.trigUids       cards chosen out of a hidden zone (deck, discard)
  //   opts.trigTargetUid  a slot chosen on the board
  //   ctx                 engine-supplied context for a trigger — who Knocked
  //                       this out, who just retreated. Kept SEPARATE from opts
  //                       rather than merged into it for the same reason
  //                       costUids and energyUids are two keys: one is the
  //                       player's answer and one is the engine's fact, and a
  //                       single bag would be split by a rule the reader cannot
  //                       see.
  runPowerScript(pi, slot, script, opts, ctx) {
    const me = this.state.players[pi], you = this.state.players[1 - pi];
    const o = opts || {}, c = ctx || {};
    for (const v of script) {
      switch (v.v) {
        case 'P_SEARCH_BENCH': {
          // Summon Minions. "Up to n", so an empty result and a full Bench are
          // both fine rather than failures.
          const room = this.cfg.benchMax - me.bench.length;
          const want = Math.min(v.n || 1, room);
          if (want <= 0) { this.log('The Bench is full.', 'eff'); break; }
          const wants = c => c && c.kind === 'pokemon' && c.stage === (v.stage || 'Basic');
          const taken = [];
          const picks = Array.isArray(o.trigUids) ? o.trigUids.slice(0, want) : null;
          if (picks) {
            for (const u of picks) {
              const k = me.deck.findIndex(x => x.uid === u && wants(this.db[x.id]));
              if (k >= 0) taken.push(me.deck.splice(k, 1)[0]);
            }
          } else {
            // Unattended fallback: random among the eligible, seeded, which is
            // what the neighbouring SEARCH_BASIC_TO_BENCH does. The shuffle
            // below means deck order carries no information either way.
            while (taken.length < want) {
              const elig = me.deck.map((x, i) => [x, i]).filter(([x]) => wants(this.db[x.id]));
              if (!elig.length) break;
              taken.push(me.deck.splice(elig[this.pick(elig.length)][1], 1)[0]);
            }
          }
          for (const inst of taken) {
            const sl = this.mkSlot(inst);
            me.bench.push(sl);
            this.enterPlay(pi, sl, { source: 'power' });
            this.log(`${this.db[inst.id].name} is summoned to the Bench.`, 'eff');
          }
          if (!taken.length) this.log('Nothing in the deck to summon.', 'eff');
          this.shuffle(me.deck);
          break;
        }
        case 'P_FROM_DISCARD': {
          // Reel In. "Up to 3", and an empty discard pile is not a failure.
          const wants = c => c && c.kind === 'pokemon';
          const taken = [];
          const picks = Array.isArray(o.trigUids) ? o.trigUids.slice(0, v.n || 1) : null;
          if (picks) {
            for (const u of picks) {
              const k = me.discard.findIndex(x => x.uid === u && wants(this.db[x.id]));
              if (k >= 0) taken.push(me.discard.splice(k, 1)[0]);
            }
          } else {
            // Most recently discarded first — deterministic, so a seeded game
            // replays exactly. The same choice ENERGY_FROM_DISCARD made.
            for (let i = me.discard.length - 1; i >= 0 && taken.length < (v.n || 1); i--) {
              if (wants(this.db[me.discard[i].id])) taken.push(me.discard.splice(i, 1)[0]);
            }
          }
          taken.forEach(x => me.hand.push(x));
          this.log(taken.length
            ? `${taken.map(x => this.db[x.id].name).join(', ')} returned to hand.`
            : 'Nothing in the discard pile to take back.', 'eff');
          break;
        }
        case 'P_SNIPE': {
          // Sneak Attack. "You MAY choose 1 of your opponent's Pokemon" — any of
          // them, Active included, which is the Team Rocket wording BENCH_SNIPE
          // already distinguishes with target: 'any'.
          //
          // Declining is trigTargetUid === null. ABSENT means take it, aimed at
          // their Active, which keeps the AI and every older caller aggressive —
          // the same convention OPTIONAL_DISCARD_THEN_SNIPE settled on.
          if (v.optional && o.trigTargetUid === null) { this.log('No target chosen.', 'eff'); break; }
          const cands = this.allSlots(1 - pi);
          if (!cands.length) break;
          let tgt = o.trigTargetUid !== undefined && o.trigTargetUid !== null
            ? cands.find(x => x.uid === o.trigTargetUid) : null;
          if (!tgt) tgt = you.active || cands[0];
          this.dealDamage(slot, tgt, v.dmg, { noWR: !v.wr, noRetaliate: true, noMirror: true, notAttack: true });
          break;
        }
        case 'P_REVENGE': {
          // Final Beam. "20 damage for each Water Energy attached to Dark
          // Gyarados to the Pokemon that Knocked Out Dark Gyarados."
          //
          // THE ENERGY IS STILL ATTACHED WHEN THIS RUNS, and that is the whole
          // reason the ON_KO hook sits where it does — inside kill(), one line
          // BEFORE the stack and the Energy are swept into the discard. Fire it
          // from checkKOs instead and the count is always zero, which is a bug
          // that looks exactly like a card that does nothing.
          if (!c.killer) break;
          const n = slot.energy.filter(e => energyIsType(this.db, e, v.t)).length;
          if (!this.flip(`${this.nameOf(slot)}: one last shot?`)) break;
          if (!n) { this.log('No Energy left to fire it with.', 'eff'); break; }
          // "Apply Weakness and Resistance" — the unusual half of this card, and
          // the reason `wr` is a flag rather than an assumption.
          this.dealDamage(slot, c.killer, v.per * n, { noWR: !v.wr, noRetaliate: true, noMirror: true, notAttack: true });
          break;
        }
        case 'P_RETREAT_TOLL': {
          // Sinkhole. The card has the OPPONENT flip, which changes nothing
          // mechanically and everything in the log — a player reading back a
          // turn should see whose coin cost them 20.
          if (!c.retreated) break;
          const heads = this.flip(`${you.name} flips for ${v.label || 'the toll'}`);
          if (heads === !!v.onHeads) {
            this.dealDamage(slot, c.retreated, v.dmg, { noWR: true, noRetaliate: true, noMirror: true, notAttack: true });
          }
          break;
        }
        default:
          throw new Error(`Unimplemented Power verb ${v.v}`);
      }
    }
  }

  // ------------------------------------------------------- entering play ----
  // THE ONE DOORWAY. Every path that puts a Pokemon card into play calls this,
  // and it exists because Job 10c needed to know something no single site could
  // answer on its own: was this card PLAYED FROM HAND?
  //
  // Three Team Rocket Powers read "When you play <this> from your hand", and 20
  // printings across six sets do by Neo 4. The distinction is not decorative —
  // Dark Golbat's Sneak Attack does 10 damage on arrival, and a Golbat that got
  // there by Pokemon Flute must not.
  //
  // THERE ARE EIGHT PATHS INTO PLAY AND ONLY THREE ARE FROM HAND:
  //
  //   from hand   doPlayBasic, doEvolve, T_POKEMON_BREEDER
  //   otherwise   opening setup (face down, nothing has begun), T_REVIVE,
  //               T_POKEMON_FLUTE, SEARCH_BASIC_TO_BENCH, EVOLVE_SELF_FROM_DECK
  //
  // "From hand" is the SMALL, CLOSED set and "some other way" is the open one
  // that Gym and Neo keep growing, so the default is silence and the hand paths
  // declare themselves. That is the opposite of how it first looked.
  //
  // WHY A HELPER RATHER THAN A FLAG AT EACH SITE. The stamps below — playedTurn
  // and evolvedTurn — are not optional anywhere: canEvolve and COWARDICE read
  // them, and a path that omits one is visibly broken within a turn. Hanging the
  // trigger off the thing a path CANNOT forget is the guard. `selftest.js` then
  // asserts statically that every mkSlot and stack.push site in this file is
  // followed by an enterPlay call, so a ninth path added in Gym cannot quietly
  // skip it. See ENGINE.md.
  enterPlay(pi, slot, opts = {}) {
    if (opts.evolved) { slot.evolvedTurn = this.state.turn; clearStatus(slot); }
    else if (opts.source !== 'setup') slot.playedTurn = this.state.turn;
    if (opts.source === 'hand') this.fireOnPlay(pi, slot, opts.opts || null);
    return slot;
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

  // The name a log line, an action label or a picker button uses for a Pokemon
  // that is in play.
  //
  // DISAMBIGUATED WHEN IT HAS TO BE — 16 Aug 2026. A deck runs three Squirtle,
  // and a match log reading "attaches Water Energy to Squirtle" with two of them
  // on the board is a line nobody can resolve. That is not hypothetical: a
  // playtest report of the AI declining to attack turned entirely on which of
  // two identical Squirtle was holding the Energy, and the file could not say.
  //
  // A letter is appended ONLY while a side genuinely has more than one in play
  // under the same name, so an ordinary game never sees one. Letters run in uid
  // order, which is fixed at creation, so they are stable for as long as both
  // Pokemon are in play. If one leaves and a third arrives the letters are
  // re-dealt over whatever is in play then — the alternative is per-side
  // bookkeeping for a case that is already rare, and a suffix that reappears
  // months later attached to nothing is worse than one that is re-used.
  nameOf(slot) {
    const name = topCard(this.db, slot).name;
    const side = this.sideOf(slot);
    if (side === null) return name;
    const same = this.allSlots(side).filter(s => topCard(this.db, s).name === name);
    if (same.length < 2) return name;
    same.sort((a, b) => a.uid - b.uid);
    const i = same.indexOf(slot);
    return i < 0 ? name : `${name} ${String.fromCharCode(65 + i)}`;
  }

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
          && !this.trainersLocked(pi)
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
    // baseCard, not topCard: Ditto keeps Transform and does NOT gain the copied
    // Pokemon's Power. "Always has this Pokemon Power" is read as *this one*.
    const e = this.effects[baseCard(this.db, slot).id];
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
        // A SUPPRESSED MUK IS NOT SPREADING TOXIC GAS. This check has to be
        // here as well as in powerUsable, and a test caught that it was not:
        // powerUsable asks whether THIS slot's Power works, while this asks
        // whether Muk's is filling the board. Marking Muk without consulting the
        // mark here left everyone else suppressed by a Power that was off.
        if (p && p.kind === 'TOXIC_GAS' && this.powerActive(sl) && !this.powerSuppressed(sl)) return true;
      }
    }
    return false;
  }

  // A Power switched off by an ATTACK rather than by another Power. Dark Arbok's
  // Stare puts this on one chosen Pokemon for a turn, and it sits beside Toxic
  // Gas rather than inside it: Muk suppresses continuously and from anywhere,
  // this is a timed mark on one slot. Both are consulted, never materialised —
  // see ENGINE.md on why that is the only shape that survives Muk.
  powerSuppressed(slot) {
    return !!(slot && slot.effects.some(e => e.kind === 'POWER_OFF'));
  }

  powerUsable(slot) {
    if (!this.powerActive(slot)) return false;
    // STARE SWITCHES OFF A TOXIC GAS TOO, and the order of these two lines is
    // what decides that. Muk exempts itself from its own suppression; it does
    // NOT get to exempt itself from an attack that named it. So the targeted
    // mark is asked first, and Staring a Muk turns everybody else's Powers back
    // on for a turn — which falls out rather than being special-cased.
    if (this.powerSuppressed(slot)) return false;
    if (this.powerOf(slot).kind === 'TOXIC_GAS') return true;   // never itself
    return !this.toxicGasActive();
  }

  // A Power printed "once during your turn". Tracked per slot rather than per
  // player, so two Gengars each get their own Curse.
  powerSpent(slot) {
    return slot.powerTurn === this.state.turn;
  }
  markPower(slot) { slot.powerTurn = this.state.turn; }

  // Is this slot a Ditto — the physical card, whatever it is currently pretending
  // to be?
  isTransformer(slot) {
    if (!slot) return false;
    const e = this.effects[baseCard(this.db, slot).id];
    return !!(e && e.p && e.p.kind === 'TRANSFORM');
  }

  // Transform, settled after every action rather than at the eight separate
  // places a Pokemon can reach the Active spot. Idempotent, so calling it
  // unconditionally is both safe and the reason a ninth entry path added later
  // cannot forget about Ditto.
  //
  // The rule, settled with Trevor 10 Aug and written up in RULINGS.md:
  // Transform is a SNAPSHOT taken when Ditto enters the Active spot, not a live
  // mirror. It holds until Ditto is benched, at which point it becomes a Ditto
  // again and re-snapshots on its way back up. Anything that switches the Power
  // off blocks the firing but never reverses one already made.
  settleTransforms() {
    let changed = false;
    for (let i = 0; i < 2; i++) {
      const me = this.state.players[i], foe = this.state.players[1 - i];
      for (const sl of this.allSlots(i)) {
        if (!this.isTransformer(sl)) continue;
        const base = baseCard(this.db, sl);

        if (me.active !== sl) {
          if (sl.transformedId) {
            sl.transformedId = null;
            changed = true;
            this.log(`${base.name} is itself again.`, 'eff');
          }
          continue;
        }
        if (sl.transformedId) continue;          // snapshot holds while it is Active
        if (!this.powerUsable(sl)) continue;     // status or Toxic Gas blocks the FIRING
        const target = foe.active;
        if (!target) continue;                   // deferred: copies the first thing it sees
        const copy = topCard(this.db, target);   // whatever that Pokemon currently IS
        if (copy.id === base.id) continue;       // a Ditto facing an untransformed Ditto
        sl.transformedId = copy.id;
        changed = true;
        this.log(`Transform: ${base.name} becomes ${copy.name}.`, 'eff');
      }
    }
    // A transform in either direction changes maximum HP without touching the
    // damage on the card, so it can be lethal both ways. Deliberate — see
    // RULINGS.md for the damage pump that killed the first version of this rule.
    if (changed) this.checkKOs();
  }

  // The switched-on Power of a given kind on this slot, or null. The one way
  // anything should ask "does this Pokemon currently have X".
  activePower(slot, kind) {
    const p = this.powerOf(slot);
    return (p && p.kind === kind && this.powerUsable(slot)) ? p : null;
  }

  // Every card physically on a slot — the evolution stack, the Energy, and any
  // Trainer still attached to it. Hurricane sends the lot to hand and Mr. Fuji
  // shuffles the lot into the deck, so both need it whole rather than scrapped.
  gatherSlot(slot) {
    const out = [];
    slot.stack.forEach(x => out.push(x));
    slot.energy.forEach(x => out.push(x));
    slot.effects.forEach(e => { if (e.card) out.push(e.card); });
    slot.stack = []; slot.energy = []; slot.effects = [];
    return out;
  }

  // Psyduck's Headache. The first PLAYER-scoped continuous effect in the game —
  // everything else so far attaches to a Pokemon.
  trainersLocked(pi) {
    const p = this.state.players[pi];
    if (!!p.noTrainersUntil && this.state.turn < p.noTrainersUntil) return true;
    // Dark Vileplume's Hay Fever. "No Trainer cards can be played" — no owner
    // named, so it is BOTH players, exactly as Aerodactyl's is below. From
    // either side of the board and from the Bench.
    //
    // TREVOR'S RULING, 18 Aug 2026, and it settles the loop this creates:
    // Goop Gas Attack is a TRAINER that switches all Pokemon Powers off, so it
    // is the obvious answer to a Hay Fever — and it cannot be played, because
    // Hay Fever is already in place when you try. Order of events decides it.
    // That is the Aerodactyl/Muk rule again: whichever continuous effect is
    // already there wins the moment the other is attempted.
    for (let i = 0; i < 2; i++) {
      for (const sl of this.allSlots(i)) if (this.activePower(sl, 'NO_TRAINERS')) return true;
    }
    return false;
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
      // Dark Muk's Sticky Goo, the mirror image of Retreat Aid and deliberately
      // computed in the same place: "as long as Dark Muk is your ACTIVE Pokemon,
      // your opponent pays CC more to retreat". Active only — the one Power in
      // Team Rocket that stops working from the Bench, which is why it reads the
      // opposing active rather than looping their whole board.
      const foe = this.state.players[1 - owner].active;
      const tax = foe ? this.activePower(foe, 'RETREAT_TAX') : null;
      if (tax) off -= (tax.n || 1);
    }
    return Math.max(0, base - off);
  }

  // The SYMBOL total attached to a slot — a Double Colorless counts two. This is
  // the currency retreat costs and attack costs are denominated in.
  // `slot.energy.length` counts CARDS and is what "discard N Energy cards" wants
  // instead; the two are the same number until a multi-symbol Energy is attached,
  // which is the whole surface Rulings/RETREAT-COST.md is about.
  // EVERY slot on EITHER side whose card name is in the list. One function, used
  // by both halves of Mass Explosion — the damage that counts the group and the
  // splash that damages it — because the ruling turns on those being the same
  // enumeration rather than two that happen to agree.
  namedInPlay(names) {
    const want = [].concat(names);
    const out = [];
    for (let side = 0; side < 2; side++)
      for (const sl of this.allSlots(side))
        if (want.indexOf(topCard(this.db, sl).name) >= 0) out.push(sl);
    return out;
  }

  energyTotal(slot) {
    return slot ? symbolCount(this.db, slot.energy) : 0;
  }

  // What one Energy card is worth in symbols. Two for a Double Colorless, one
  // for everything else in the live pool.
  energyValue(inst) {
    return energySymbols(this.db, inst).length;
  }

  // Every legal way to pay this retreat: the subsets that cover the cost and
  // contain no redundant card. Two callers, and they want different halves of it
  // — doRetreat validates one list against this rule, and the UI counts the
  // DISTINCT options to decide whether the question is worth asking at all.
  //
  // That second use is `energyChoiceIsReal`'s doctrine carried over to a cost
  // measured in symbols, and it needs the enumeration because the card-count
  // version gets it wrong in both directions now. A Double Colorless beside a
  // basic, retreat 2, LOOKS like a choice — two cards, one needed — and is not:
  // the basic cannot cover 2 and adding it to the DCE is redundant, so the only
  // legal payment is the DCE alone. The same pair at retreat 1 IS a choice, and
  // a sharp one, because paying with the DCE throws a symbol away.
  //
  // Brute force over subsets, which is fine at the sizes involved — a slot with
  // more than a handful of Energy on it is already a strange board — and falls
  // back to the greedy order rather than hanging if one ever gets absurd.
  retreatPayOptions(slot) {
    const cost = this.retreatCostOf(slot);
    if (!cost || !slot) return [];
    const pool = this.energyChoices(slot, null);
    if (pool.length > 12) return [this.retreatPayGreedy(slot)];
    const out = [];
    for (let mask = 1; mask < (1 << pool.length); mask++) {
      const set = pool.filter((_, i) => mask & (1 << i));
      const total = symbolCount(this.db, set);
      if (total < cost) continue;
      if (set.some(e => total - energySymbols(this.db, e).length >= cost)) continue;
      out.push(set);
    }
    return out;
  }

  // Is the retreat payment a real decision? Distinct options only: two identical
  // basic Fire are one option wearing two hats, exactly as energyChoiceIsReal
  // has always held. A Buzzap'd Electrode is NOT identical to anything, which is
  // the case that rule was written for.
  retreatChoiceIsReal(slot) {
    const sigs = new Set(this.retreatPayOptions(slot).map(set =>
      set.map(e => e.id + '/' + (e.asEnergy || '')).sort().join(',')));
    return sigs.size > 1;
  }

  // The fallback pay list for a retreat: what gets spent when nobody chose.
  //
  // BUILT ON retreatPayOptions ON PURPOSE, and the reason is a bug this had in
  // its first version. It was a greedy scan — take the smallest card that still
  // fits the remaining cost — and greedy is not sound here. Retreat 2 against a
  // Fire and a Double Colorless: it took the Fire (1, fits), leaving 1 to find,
  // which only the DCE could cover, for a total of 3 against a cost of 2. That
  // is a REDUNDANT payment, doRetreat refused it, the AI re-picked the same
  // retreat next action, and the game span until the harness cut it off. 26% of
  // ladder games hit it.
  //
  // So the fallback now chooses from the enumerated legal payments rather than
  // constructing one. It cannot propose something the validator rejects, because
  // both read the same list. Ranked:
  //
  //   1. fewest symbols spent          — waste nothing that can be kept
  //   2. fewest multi-symbol cards     — a Double Colorless is worth hoarding,
  //                                      which is where the old card-counting
  //                                      ruling's tax on it now lives
  //   3. energyPayOrder rank           — and among equals, spend what this
  //                                      Pokemon's own attacks do not ask for
  //
  // Rule 2 is the one with a card behind it. Retreat 3 with a DCE and three
  // basics can be paid exactly two ways, neither wasteful; spending the three
  // basics keeps the flexible card, and that is the play.
  retreatPayOrder(slot) {
    const opts = this.retreatPayOptions(slot);
    if (!opts.length) return [];
    const rank = new Map(this.energyPayOrder(slot).map((e, i) => [e.uid, i]));
    const score = set => [
      symbolCount(this.db, set),
      set.filter(e => this.energyValue(e) > 1).length,
      set.reduce((a2, e) => a2 + (rank.has(e.uid) ? rank.get(e.uid) : 99), 0),
    ];
    return opts.reduce((best, set) => {
      if (!best) return set;
      const x = score(set), y = score(best);
      for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? set : best;
      return best;
    }, null);
  }

  // The escape hatch for a slot carrying so much Energy that enumerating every
  // subset stops being free. Largest-first to cover, then strip anything the
  // rest made redundant — the prune is what keeps it agreeing with doRetreat,
  // and it is the step the greedy version above was missing.
  retreatPayGreedy(slot) {
    const cost = this.retreatCostOf(slot);
    const pool = this.energyChoices(slot, null)
      .slice().sort((x, y) => this.energyValue(y) - this.energyValue(x));
    const out = [];
    let got = 0;
    for (const e of pool) { if (got >= cost) break; out.push(e); got += this.energyValue(e); }
    for (let i = out.length - 1; i >= 0; i--) {
      if (got - this.energyValue(out[i]) >= cost) { got -= this.energyValue(out[i]); out.splice(i, 1); }
    }
    return out;
  }

  sideOf(slot) {
    for (let i = 0; i < 2; i++) if (this.allSlots(i).indexOf(slot) >= 0) return i;
    return null;
  }

  // A slot's CURRENT type, honouring Venomoth's Shift. Weakness and Resistance
  // are matched against the attacker's type, so this is what makes Shift do
  // anything at all. Same shape as slotSymbols and the Porygon overrides: read
  // through a helper, never written onto the card.
  typeOf(slot) {
    return (slot && slot.typeAs) || topCard(this.db, slot).type;
  }

  // Every type in play right now, which is what Shift may choose from.
  typesInPlay(exceptSlot) {
    const out = [];
    for (let i = 0; i < 2; i++) {
      for (const sl of this.allSlots(i)) {
        if (sl === exceptSlot) continue;
        const t = this.typeOf(sl);
        if (t && t !== 'C' && out.indexOf(t) < 0) out.push(t);
      }
    }
    return out;
  }

  // Energy symbols a slot currently provides, honouring Charizard's Energy Burn.
  // Count is preserved — Double Colorless still pays twice — only the type
  // changes.
  //
  // ENERGY BURN IS ALWAYS ON — Trevor, 16 Aug 2026, "similar to Muk's Toxic
  // Gas". It used to be an interactive Power you switched on for the turn, which
  // is a click with no decision behind it: Charizard's only attack is Fire Spin
  // at RRRR, so there has never been a board on which you would decline. Now it
  // is CONSULTED, the same way every other passive in this engine is, which also
  // means it switches off under Sleep, Confusion, Paralysis and Toxic Gas for
  // free instead of surviving them as a flag that was already set.
  //
  // Note what it deliberately does NOT reach: a cost that says "discard a FIRE
  // Energy" still reads the real card through `energyProvides`, matching the
  // Buzzap ruling that a card standing in for Energy is not that Energy card.
  slotSymbols(slot) {
    const burn = this.activePower(slot, 'ENERGY_AS');
    const as = burn ? burn.type : null;
    const out = [];
    slot.energy.forEach(e => energySymbols(this.db, e).forEach(x => out.push(as || x)));
    return out;
  }

  // "1 Water Energy card" and the like mean a BASIC one, matching the WotC
  // rulings — see Rulings/ENERGY-CARD-MEANS-BASIC.md.
  //
  // `inPlay` IS THE HALF THAT ARRIVED WITH RAINBOW, and it is printed on the
  // card in as many words: "(Doesn't count as a basic Energy card WHEN NOT IN
  // PLAY.)" That parenthetical exists to distinguish two zones, so it must:
  //
  //   Energy Trans moves an ATTACHED Energy      -> in play  -> a Rainbow qualifies
  //   Rain Dance attaches one FROM YOUR HAND     -> not in play -> it does not
  //   Afternoon Nap searches the DECK            -> not in play -> it does not
  //
  // Trevor settled the first line, 19 Aug 2026, against WotC's own rules — and
  // his phrasing carries the second for free: "when it's on a Pokemon, it's
  // whatever that Pokemon needs it to be". A card in your hand is not on a
  // Pokemon. Two rulings written before this card existed said Rainbow was never
  // a basic Energy card; both are corrected.
  //
  // DEFAULT FALSE, because "not in play" is three zones (hand, deck, discard)
  // and "in play" is one. A new call site that forgets the flag gets the
  // conservative answer rather than silently widening a card.
  isBasicEnergyOf(inst, type, inPlay) {
    const c = this.db[inst.id];
    if (!c || c.kind !== 'energy') return false;
    if (inPlay && c.provides === WILD) return true;
    return c.cls === 'Basic' && c.provides === type;
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
        // ENERGY_AS is passive as of 16 Aug 2026 and is not offered as an action
        // at all — see slotSymbols. Nothing to choose, so nothing to click.
        case 'ENERGY_AS': break;
        case 'MOVE_DAMAGE': {
          // Damage Swap, Gengar's Curse and Slowbro's Strange Behavior are one
          // mechanism with three settings:
          //   side       whose Pokemon the counters move among (Curse: theirs)
          //   allowKO    Curse explicitly may Knock Out the receiver
          //   toSelf     Strange Behavior only ever moves damage ONTO Slowbro
          //   once       Heal and Curse are once a turn; the others repeat
          if (p.once && this.powerSpent(slot)) break;
          const side = p.side === 'opponent' ? 1 - pi : pi;
          const froms = this.allSlots(side);
          const tos = p.toSelf ? [slot] : this.allSlots(side);
          for (const from of froms) {
            if (from.dmg < 10) continue;
            for (const to of tos) {
              if (to === from) continue;
              if (!p.allowKO && to.dmg + 10 >= topCard(this.db, to).hp) continue;
              acts.push({
                t: 'power', uid: slot.uid, kind: p.kind, from: from.uid, to: to.uid,
                label: `${p.name}: ${this.nameOf(from)} → ${this.nameOf(to)}`,
              });
            }
          }
          break;
        }
        case 'HEAL_ON_FLIP':
          // Vileplume. The coin is flipped when it resolves, not now — the
          // player is choosing a target, not a gamble.
          if (this.powerSpent(slot)) break;
          for (const to of this.allSlots(pi)) {
            if (to.dmg < 10) continue;
            acts.push({ t: 'power', uid: slot.uid, kind: p.kind, to: to.uid,
                        label: `${p.name}: flip to heal ${this.nameOf(to)}` });
          }
          break;
        case 'CHANGE_OWN_TYPE':
          if (this.powerSpent(slot)) break;
          for (const t of this.typesInPlay(slot)) {
            if (t === this.typeOf(slot)) continue;
            acts.push({ t: 'power', uid: slot.uid, kind: p.kind, type: t,
                        label: `${p.name}: become ${t}` });
          }
          break;
        case 'STEP_IN':
          // Bench only, and it swaps with the Active rather than retreating —
          // no Energy, no retreat cost, and it does not use up the retreat.
          if (this.powerSpent(slot)) break;
          if (me.bench.indexOf(slot) < 0 || !me.active) break;
          acts.push({ t: 'power', uid: slot.uid, kind: p.kind,
                      label: `${p.name}: switch in for ${this.nameOf(me.active)}` });
          break;
        // ---- Job 10c, the ordinary Powers behind the triggers ----
        // Four cards, and three of them need nothing chosen at all — the whole
        // action is "use it". They enumerate ONE action each rather than one per
        // outcome, because the coin and the card are part of the resolution and
        // not of the choice. Same reasoning as HEAL_ON_FLIP above.
        case 'STATUS_COIN_EITHER_POWER':
          // Pollen Stench and Long-Distance Hypnosis are ONE mechanism with the
          // condition as a setting — Confused and Asleep. Both flip, both hit
          // the Defending Pokemon on heads and YOUR OWN Active on tails, and
          // both are once a turn. Two cards, no second shape.
          if (this.powerSpent(slot)) break;
          if (!me.active || !this.state.players[1 - pi].active) break;
          acts.push({ t: 'power', uid: slot.uid, kind: p.kind,
                      label: `${p.name}: flip for ${p.status}` });
          break;
        case 'DISCARD_THEN_DRAW':
          // Matter Exchange. "Discard a card from your hand IN ORDER TO draw a
          // card" — the discard is the cost, so a hand of one (this card's own
          // Pokemon is in play, not in hand) still qualifies, and an EMPTY hand
          // does not.
          if (this.powerSpent(slot)) break;
          if (!me.hand.length || !me.deck.length) break;
          acts.push({ t: 'power', uid: slot.uid, kind: p.kind,
                      label: `${p.name}: discard 1 to draw 1` });
          break;
        case 'PRIZE_SWAP':
          // Rattata's Trickery. Enumerated PER PRIZE, because which one you
          // swap is a real choice to anybody who has seen a Prize — and Here
          // Comes Team Rocket! turns every Prize face up, which is a Team Rocket
          // card in the same set.
          if (this.powerSpent(slot)) break;
          if (!me.deck.length) break;
          for (let k = 0; k < me.prizes.length; k++)
            acts.push({ t: 'power', uid: slot.uid, kind: p.kind, idx: k,
                        label: `${p.name}: swap Prize ${k + 1} with the top of your deck` });
          break;
        case 'SEARCH_EVOLUTION_TO_HAND': {
          // Dark Dragonair's Evolutionary Light. Any Evolution card — the card
          // does not ask for one that fits anything you have, which makes it a
          // tutor rather than a combo piece.
          if (this.powerSpent(slot)) break;
          const evos = me.deck.filter(x => {
            const c = this.db[x.id];
            return c && c.kind === 'pokemon' && c.stage !== 'Basic';
          });
          if (!evos.length) break;
          acts.push({ t: 'power', uid: slot.uid, kind: p.kind,
                      label: `${p.name}: search your deck for an Evolution card` });
          break;
        }
        case 'PEEK':
          if (this.powerSpent(slot)) break;
          acts.push({ t: 'power', uid: slot.uid, kind: p.kind, look: 'deck', side: 'me',
                      label: `${p.name}: the top of your deck` });
          acts.push({ t: 'power', uid: slot.uid, kind: p.kind, look: 'deck', side: 'them',
                      label: `${p.name}: the top of their deck` });
          if (this.state.players[1 - pi].hand.length)
            acts.push({ t: 'power', uid: slot.uid, kind: p.kind, look: 'hand', side: 'them',
                        label: `${p.name}: a random card from their hand` });
          for (let k = 0; k < me.prizes.length; k++)
            acts.push({ t: 'power', uid: slot.uid, kind: p.kind, look: 'prize', side: 'me', idx: k,
                        label: `${p.name}: your Prize ${k + 1}` });
          for (let k = 0; k < this.state.players[1 - pi].prizes.length; k++)
            acts.push({ t: 'power', uid: slot.uid, kind: p.kind, look: 'prize', side: 'them', idx: k,
                        label: `${p.name}: their Prize ${k + 1}` });
          break;
        case 'COWARDICE':
          // "Can't be used the turn you put Tentacool into play" — playedTurn is
          // already on every slot for exactly this shape of rule.
          if (slot.playedTurn >= this.state.turn) break;
          if (me.active === slot && !me.bench.length) break;   // nothing to promote
          acts.push({ t: 'power', uid: slot.uid, kind: p.kind,
                      label: `${p.name}: return ${this.nameOf(slot)} to hand` });
          break;
        case 'MOVE_ENERGY': {
          // Energy Trans, and now Charmander's Gather Fire, which is the same
          // mechanism with two settings turned on:
          //   once     Gather Fire is once a turn; Energy Trans repeats
          //   toSelf   Gather Fire only ever moves energy ONTO Charmander,
          //            "attached to 1 of your OTHER Pokemon"
          // The same pair of settings MOVE_DAMAGE already carries for Strange
          // Behavior. A third shape was not needed and would have been a second
          // way to say the same thing.
          if (p.once && this.powerSpent(slot)) break;
          const froms = this.allSlots(pi).filter(x => p.toSelf ? x !== slot : true);
          const tos = p.toSelf ? [slot] : this.allSlots(pi);
          for (const from of froms) {
            if (!from.energy.some(e => this.isBasicEnergyOf(e, p.energy, true))) continue;
            for (const to of tos) {
              if (to === from) continue;
              acts.push({
                t: 'power', uid: slot.uid, kind: p.kind, from: from.uid, to: to.uid,
                label: `${p.name}: ${this.nameOf(from)} -> ${this.nameOf(to)}`,
              });
            }
          }
          break;
        }
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
      case 'MOVE_DAMAGE': {
        if (p.once && this.powerSpent(slot)) return this.fail(`${p.name} has already been used this turn`);
        const side = p.side === 'opponent' ? 1 - pi : pi;
        const from = this.findSlot(side, a.from);
        const to = p.toSelf ? slot : this.findSlot(side, a.to);
        if (!from || !to) return this.fail('No such Pokemon');
        if (from === to) return this.fail('Pick two different Pokemon');
        if (from.dmg < 10) return this.fail(`${this.nameOf(from)} has no damage counters`);
        const tc = topCard(this.db, to);
        if (!p.allowKO && to.dmg + 10 >= tc.hp) return this.fail(`That would Knock Out ${tc.name}`);
        from.dmg -= 10; to.dmg += 10;
        if (p.once) this.markPower(slot);
        this.log(`${p.name}: 1 damage counter moved from ${this.nameOf(from)} `
          + `to ${this.nameOf(to)}. (${Math.max(0, tc.hp - to.dmg)}/${tc.hp} left)`, 'eff');
        // Curse can deliberately Knock Out, which hands over a Prize like any
        // other Knock Out. Trevor confirms it is the point of the card.
        if (p.allowKO) this.checkKOs();
        return { ok: true };
      }
      case 'HEAL_ON_FLIP': {
        if (this.powerSpent(slot)) return this.fail(`${p.name} has already been used this turn`);
        const to = this.findSlot(pi, a.to);
        if (!to) return this.fail('No such Pokemon');
        if (to.dmg < 10) return this.fail(`${this.nameOf(to)} has no damage counters`);
        this.markPower(slot);
        if (this.flip(`${p.name}?`)) {
          const h = Math.min((p.n || 1) * 10, to.dmg);
          to.dmg -= h;
          this.log(`${p.name}: ${h} damage removed from ${this.nameOf(to)}.`, 'eff');
        } else {
          this.log(`${p.name}: tails, nothing healed.`, 'eff');
        }
        return { ok: true };
      }
      case 'CHANGE_OWN_TYPE': {
        if (this.powerSpent(slot)) return this.fail(`${p.name} has already been used this turn`);
        const t = a.type;
        if (!t || t === 'C') return this.fail('Pick a type other than Colorless');
        if (this.typesInPlay(slot).indexOf(t) < 0) return this.fail(`No ${t} Pokemon is in play`);
        slot.typeAs = t;
        this.markPower(slot);
        this.log(`${p.name}: ${this.nameOf(slot)} is now ${t}.`, 'eff');
        return { ok: true };
      }
      case 'STEP_IN': {
        if (this.powerSpent(slot)) return this.fail(`${p.name} has already been used this turn`);
        const me3 = this.state.players[pi];
        const k = me3.bench.indexOf(slot);
        if (k < 0) return this.fail(`${this.nameOf(slot)} is not on the Bench`);
        if (!me3.active) return this.fail('No Active Pokemon to switch with');
        const old = me3.active;
        clearStatus(old);
        me3.active = slot; me3.bench.splice(k, 1); me3.bench.push(old);
        this.markPower(slot);
        this.log(`${p.name}: ${this.nameOf(slot)} steps in for ${this.nameOf(old)}.`, 'eff');
        return { ok: true };
      }
      case 'STATUS_COIN_EITHER_POWER': {
        if (this.powerSpent(slot)) return this.fail(`${p.name} has already been used this turn`);
        const mine = this.state.players[pi], them = this.state.players[1 - pi];
        if (!mine.active || !them.active) return this.fail('Both sides need an Active Pokemon');
        this.markPower(slot);
        // ONE coin, two outcomes, never nothing — the STATUS_COIN_EITHER shape,
        // one level up. It is a gamble you take, not a target you pick, so the
        // flip happens here rather than being enumerated as two actions.
        const heads = this.flip(`${p.name}?`);
        const victim = heads ? them.active : mine.active;
        this.log(`${p.name}: ${heads ? 'heads' : 'tails'} — ${this.nameOf(victim)} is affected.`, 'eff');
        this.applyStatus(victim, p.status);
        return { ok: true };
      }
      case 'DISCARD_THEN_DRAW': {
        if (this.powerSpent(slot)) return this.fail(`${p.name} has already been used this turn`);
        const mine2 = this.state.players[pi];
        if (!mine2.hand.length) return this.fail('No card in hand to discard');
        if (!mine2.deck.length) return this.fail('No cards left in your deck');
        let k = a.discardUid !== undefined ? mine2.hand.findIndex(x => x.uid === a.discardUid) : -1;
        // Unattended fallback: the last card in hand. Deterministic, so a seeded
        // game replays exactly — the AI supplies a real choice.
        if (k < 0) k = mine2.hand.length - 1;
        const gone = mine2.hand.splice(k, 1)[0];
        mine2.discard.push(gone);
        mine2.hand.push(mine2.deck.shift());
        this.markPower(slot);
        this.log(`${p.name}: ${this.db[gone.id].name} discarded, one card drawn.`, 'eff');
        return { ok: true };
      }
      case 'PRIZE_SWAP': {
        if (this.powerSpent(slot)) return this.fail(`${p.name} has already been used this turn`);
        const mine3 = this.state.players[pi];
        if (!mine3.deck.length) return this.fail('No cards left in your deck');
        const k3 = a.idx !== undefined ? a.idx : 0;
        if (k3 < 0 || k3 >= mine3.prizes.length) return this.fail('No such Prize');
        // A straight exchange: the Prize goes to the top of the deck and the top
        // of the deck becomes the Prize. NOTHING IS REVEALED and nothing is
        // logged about either card, because the Prize is face down to both
        // players — unless Here Comes Team Rocket! has been played, and that is
        // the UI's business rather than this one's.
        const wasPrize = mine3.prizes[k3];
        mine3.prizes[k3] = mine3.deck.shift();
        mine3.deck.unshift(wasPrize);
        this.markPower(slot);
        this.log(`${p.name}: ${mine3.name} swaps a Prize with the top of their deck.`, 'eff');
        return { ok: true };
      }
      case 'SEARCH_EVOLUTION_TO_HAND': {
        if (this.powerSpent(slot)) return this.fail(`${p.name} has already been used this turn`);
        const mine4 = this.state.players[pi];
        const legal = x => {
          const c = this.db[x.id];
          return c && c.kind === 'pokemon' && c.stage !== 'Basic';
        };
        const pool = mine4.deck.filter(legal);
        if (!pool.length) return this.fail('No Evolution card in your deck');
        let want = a.pickUid !== undefined ? pool.find(x => x.uid === a.pickUid) : null;
        if (!want) want = pool[this.pick(pool.length)];
        mine4.deck.splice(mine4.deck.indexOf(want), 1);
        mine4.hand.push(want);
        this.markPower(slot);
        // "Show it to your opponent" — so this one IS logged by name, unlike the
        // Prize swap above. The card says to reveal it.
        this.log(`${p.name}: ${this.db[want.id].name} shown and taken into hand.`, 'eff');
        this.shuffle(mine4.deck);
        return { ok: true };
      }
      case 'PEEK': {
        if (this.powerSpent(slot)) return this.fail(`${p.name} has already been used this turn`);
        const them = this.state.players[1 - pi], mine = this.state.players[pi];
        const who = a.side === 'them' ? them : mine;
        let seen = null;
        if (a.look === 'deck') seen = who.deck[0];
        else if (a.look === 'hand') seen = them.hand[this.pick(them.hand.length)];
        else if (a.look === 'prize') seen = who.prizes[a.idx];
        if (!seen) return this.fail('There is nothing there to look at');
        this.markPower(slot);
        // The card is REVEALED to the player, not moved. The UI shows it; the
        // log records only that a look happened, so a shared screen stays fair.
        this.state.peeked = { id: seen.id, uid: seen.uid, what: a.look, side: a.side };
        this.log(`${p.name}: ${mine.name} takes a look.`, 'eff');
        return { ok: true, peeked: this.state.peeked };
      }
      case 'COWARDICE': {
        if (slot.playedTurn >= this.state.turn) return this.fail(`${this.nameOf(slot)} only just came into play`);
        const me4 = this.state.players[pi];
        const wasActive = me4.active === slot;
        if (wasActive && !me4.bench.length) return this.fail('Nothing could take its place');
        const nm = this.nameOf(slot);
        this.removeSlot(pi, slot);
        // "Discard all cards attached" — the Pokemon itself returns to hand and
        // everything else is lost, which is what makes it a cost and not a free
        // reset. scrapSlot already does exactly that.
        const kept = this.scrapSlot(pi, slot, true);
        if (kept) me4.hand.push(kept);
        this.log(`${p.name}: ${nm} returns to hand; everything attached is discarded.`, 'eff');
        if (wasActive && me4.bench.length) this.addPromote(pi);
        return { ok: true };
      }
      case 'MOVE_ENERGY': {
        if (p.once && this.powerSpent(slot)) return this.fail(`${p.name} has already been used this turn`);
        const from = this.findSlot(pi, a.from), to = p.toSelf ? slot : this.findSlot(pi, a.to);
        if (!from || !to) return this.fail('No such Pokemon');
        if (from === to) return this.fail('Pick two different Pokemon');
        const k = from.energy.findIndex(e => this.isBasicEnergyOf(e, p.energy, true));
        if (k === -1) return this.fail(`${this.nameOf(from)} has no ${p.energy} Energy to move`);
        const moved = from.energy.splice(k, 1)[0];
        to.energy.push(moved);
        if (p.once) this.markPower(slot);
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
        if (this.state.koThisAction) this.state.koThisAction.push({ uid: slot.uid, pi });
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
    if (this.isTransformer(slot)) return false;                        // "except Ditto can't evolve"
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

  // Whether a retreat may be ATTEMPTED. Confusion is deliberately not here:
  // under the original ruleset a Confused Pokemon may try, and pays whether or
  // not it succeeds. The flip lives in doRetreat because it has a cost, and a
  // predicate that charges you is a predicate nobody can call twice.
  canRetreat(slot) {
    if (this.playsAsPokemon(slot)) return false;          // "can't retreat", flatly
    if (slot.status.asleep || slot.status.paralyzed) return false;
    if (slot.effects.some(e => e.kind === 'CANT_RETREAT')) return false;   // Victreebel's Acid
    // A RETREAT COST IS A COST, AND COSTS COUNT SYMBOLS — so a Double Colorless
    // covers a retreat of 2 on its own. Reversed 17 Aug 2026; between 12 and 17
    // Aug this counted physical cards. What is paid in whole CARDS is the
    // discard: you cannot spend half a Double Colorless, so a Colorless retreat
    // paid with one loses the spare symbol. See Rulings/RETREAT-COST.md, which
    // carries both the original ruling and the correction.
    return this.energyTotal(slot) >= this.retreatCostOf(slot);
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
    // "You may treat any Energy attached to Ditto as Energy of any type."
    // QUANTITY matters and quality does not, so Double Colorless still pays for
    // two. Keyed on being transformed rather than on the Power being switched
    // on, because a transform already made is never reversed — same rule that
    // stops Toxic Gas undoing one. Note this covers attack COSTS only: a
    // "discard 1 Fire Energy" cost still wants real Fire, matching the Buzzap
    // ruling that a card standing in for Energy is not that Energy card.
    if (slot && slot.transformedId) return pool.length >= cost.length;
    const need = cost.split('').filter(x => x !== 'C');
    const generic = cost.length - need.length;
    const used = new Array(pool.length).fill(false);
    for (const t of need) {
      // EXACT MATCHES FIRST, WILDCARDS ONLY WHEN NOTHING ELSE FITS, and the order
      // of these two lines is load-bearing. A Rainbow plus a Water paying "WR"
      // fails if the W need greedily eats the Rainbow: the R then has only a
      // real Water left. Spending a universal substitute while a specific one is
      // available is never right, which makes exact-first optimal here rather
      // than merely better.
      let k = pool.findIndex((p, i) => !used[i] && p === t);
      if (k === -1) k = pool.findIndex((p, i) => !used[i] && p === WILD);
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
    // Tail Wag, Leer. Blocks EVERY attack, and only against the Pokemon that
    // used it — "benching either Pokemon ends this effect", which falls out of
    // the uid no longer being the Active one.
    const cant = p.active.effects.find(e => e.kind === 'CANT_ATTACK');
    if (cant) {
      const foe = this.state.players[1 - pi].active;
      if (foe && foe.uid === cant.fromUid) return { ok: false, why: `Can't attack ${this.nameOf(foe)} this turn` };
    }
    for (const v of script) {
      if (v.v === 'COST_DISCARD_ENERGY') {
        // No `t` means any Energy card will do (Charizard's Fire Spin discards 2
        // Energy of any type; Ninetales' Fire Blast demands Fire specifically).
        const have = p.active.energy.filter(e => energyIsType(this.db, e, v.t)).length;
        if (have < v.n) return { ok: false, why: `Needs ${v.n} ${v.t || ''} Energy to discard`.replace('  ', ' ') };
      }
      if (v.v === 'COST_DISCARD_ALL_ENERGY') {
        if (p.active.energy.length === 0) return { ok: false, why: 'No Energy to discard' };
      }
      if (v.v === 'REQUIRE_OPP_BENCH') {
        // `opp()` reads state.active and takes no argument, so it is the wrong
        // call here — a legality check must answer for the pi it was ASKED about.
        if (!this.state.players[1 - pi].bench.length) return { ok: false, why: 'They have no Benched Pokemon' };
      }
      if (v.v === 'REQUIRE_SELF_ENERGY') {
        const n = p.active.energy.filter(e => energyIsType(this.db, e, v.t)).length;
        if (!n) return { ok: false, why: `No ${v.t} Energy attached` };
      }
      if (v.v === 'REQUIRE_SELF_DAMAGED') {
        if (p.active.dmg <= 0) return { ok: false, why: 'No damage counters to remove' };
      }
      if (v.v === 'SEARCH_BASIC_TO_BENCH') {
        if (p.bench.length >= this.cfg.benchMax) return { ok: false, why: 'Bench is full' };
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
        case 'T_POKE_BALL': if (p.deck.length === 0) return false; break;
        case 'T_ENERGY_SEARCH':
          // BASIC Energy only — the printed text, kept deliberately against a
          // real GBC contradiction. See Rulings/ENERGY-SEARCH.md.
          if (!p.deck.some(x => { const c2 = this.db[x.id]; return c2.kind === 'energy' && c2.cls === 'Basic'; })) return false;
          break;
        case 'T_MR_FUJI': if (!p.bench.length) return false; break;
        case 'T_GAMBLER': break;   // always legal; an empty hand still shuffles and draws
        case 'T_RECYCLE': if (!p.discard.length) return false; break;
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
    // WHICH POKEMON WERE ACTUALLY KNOCKED OUT BY THIS ACTION — 16 Aug 2026.
    // The UI used to infer it from "a slot that was there is gone", which is
    // also true of Scoop Up, Mr. Fuji and Hurricane, so playing a Scoop Up threw
    // the Knock Out banner. Recorded rather than inferred, and cleared per
    // action like `peeked`.
    s.koThisAction = [];
    if (s.pendingSwitch !== null || s.pendingPromote !== null) {
      if (s.pendingSwitch === pi) {
        if (a.t !== 'switchIn') return this.fail('A Pokemon must be sent up first');
      } else if (s.pendingPromote === pi) {
        if (a.t !== 'promote') return this.fail('Must promote a Pokemon first');
      } else return this.fail('Waiting on the other player');
    } else if (s.active !== pi) return this.fail('Not your turn');

    const r = this.dispatchAction(pi, a);
    this.settleTransforms();
    this.settleWinConditions();
    return r;
  }



  dispatchAction(pi, a) {
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
    const sl = this.mkSlot(inst);
    p.bench.push(sl);
    this.log(`${p.name} benches ${c.name}.`);
    this.enterPlay(pi, sl, { source: 'hand', opts: a.opts });
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
    this.log(`${was} evolves into ${c.name}. Special Conditions removed.`, 'eff');
    this.enterPlay(pi, sl, { source: 'hand', evolved: true, opts: a.opts });
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
    // Team Rocket's special Energy. Three of the era's eight print an effect
    // that happens ON ARRIVAL, and all three qualify it the same way — "IF YOU
    // PLAY THIS CARD FROM YOUR HAND". That is the played-from-hand rule again,
    // one card kind along, and it is why the hook is here rather than anywhere
    // an Energy can end up attached: Energy Trans moving one, or a Buzzapped
    // Electrode becoming one, must not re-fire it.
    //
    // doAttach is the ONLY from-hand attachment path today. Rain Dance and its
    // relatives attach from hand too but are all qualified to "basic <type>
    // Energy card", which no special Energy is. If a later set prints an
    // unqualified one, it needs this call and nothing will say so.
    this.runEnergyScript(pi, sl, (this.effects[inst.id] || {}).t || []);
    this.checkKOs();
    return { ok: true };
  }

  // The on-attach half of a special Energy card. A FOURTH small namespace, after
  // attack verbs, Trainer cases and Power verbs — and kept small on purpose: the
  // whole era has eight distinct special Energy and only three of them do
  // anything on arrival. The other five are continuous (Metal reduces damage,
  // Darkness adds it) and that is a different system nobody needs until Neo.
  runEnergyScript(pi, slot, script) {
    for (const v of script) {
      switch (v.v) {
        case 'E_CLEAR_STATUS':
          // Full Heal Energy. A ONE-SHOT on arrival, not a continuous immunity —
          // "the Pokemon you attach it to is no longer Asleep, Confused,
          // Paralyzed, or Poisoned". Nothing stops it being Paralyzed again next
          // turn, and the card stays attached as a plain Colorless afterwards.
          clearStatus(slot);
          this.log(`Full Heal Energy: ${this.nameOf(slot)} is no longer affected by Special Conditions.`, 'eff');
          break;
        case 'E_HEAL': {
          // Potion Energy. "Remove 1 damage counter... IF IT HAS ANY", so an
          // undamaged Pokemon is a legal target and simply gets nothing.
          const h = Math.min(v.n || 10, slot.dmg);
          if (!h) { this.log('Potion Energy: nothing to heal.', 'eff'); break; }
          slot.dmg -= h;
          this.log(`Potion Energy: ${h} damage removed from ${this.nameOf(slot)}.`, 'eff');
          break;
        }
        case 'E_SELF_DAMAGE':
          // Rainbow Energy. "When you attach this card from your hand to 1 of
          // your Pokemon, it does 10 damage to that Pokemon. (Don't apply
          // Weakness and Resistance.)"
          //
          // AND IT CAN KILL. Settled with Trevor 19 Aug 2026: attaching a
          // Rainbow to something on its last 10 Knocks it Out and the opponent
          // takes a Prize, which is the Buzzap principle — a Knock Out is a
          // Knock Out even when you did it to yourself. doAttach calls checkKOs
          // straight after this for exactly that reason.
          //
          // Not an attack, so no Retaliate and no Mirror Shell, and there is no
          // attacker to aim them at anyway. Applied directly rather than through
          // dealDamage because dealDamage needs an attacking slot.
          slot.dmg += v.n || 10;
          this.log(`Rainbow Energy does ${v.n || 10} damage to ${this.nameOf(slot)}.`, 'eff');
          break;
        default:
          throw new Error(`Unimplemented Energy verb ${v.v}`);
      }
    }
  }

  doRetreat(pi, a) {
    const p = this.state.players[pi];
    if (p.retreated) return this.fail('Already retreated this turn');
    if (!p.active) return this.fail('No Active Pokemon');
    if (!this.canRetreat(p.active)) return this.fail('Cannot retreat (status or insufficient Energy)');
    const b = p.bench[a.bench]; if (!b) return this.fail('No such benched Pokemon');
    const cost = this.retreatCostOf(p.active);
    // Symbols, not cards — see canRetreat. The supplied list is checked three
    // ways: every uid is really attached and named once, the symbols cover the
    // cost, and NO CARD IN IT IS REDUNDANT.
    //
    // That last check is the one worth understanding. It stops a client paying a
    // cost of 1 with three basic Energy, which the symbol rule would otherwise
    // permit and no player would ever mean. It still allows the forced waste of
    // a Double Colorless on a Colorless retreat, because there the single card
    // is not redundant — take it out of the list and nothing is paid at all.
    // Overpayment you cannot avoid is legal; overpayment you chose is not.
    let pay = a.pay;
    if (!pay) pay = this.retreatPayOrder(p.active).map(e => e.uid);
    const cards = [], seen = new Set();
    for (const uid of pay) {
      if (seen.has(uid)) return this.fail('Energy listed twice');
      seen.add(uid);
      const e = p.active.energy.find(x => x.uid === uid);
      if (!e) return this.fail('Energy not attached');
      cards.push(e);
    }
    const total = symbolCount(this.db, cards);
    if (total < cost) return this.fail(`Must discard Energy worth ${cost} to retreat`);
    for (const e of cards) {
      if (total - energySymbols(this.db, e).length >= cost)
        return this.fail('That discards more Energy than the retreat costs');
    }
    for (const e of cards) {
      p.discard.push(p.active.energy.splice(p.active.energy.indexOf(e), 1)[0]);
    }
    // CONFUSION IS PAID FOR BEFORE IT IS ROLLED. Settled with Trevor 13 Aug
    // 2026 from the GBC game: a Confused Pokemon may attempt to retreat, the
    // Energy is discarded up front, and on tails the retreat simply fails —
    // Energy gone, Pokemon still Active, still Confused. The discard above has
    // already happened by the time we get here, which is the whole point of
    // doing it in this order rather than flipping first.
    //
    // A failed attempt still uses up the turn's retreat. Otherwise a Confused
    // Pokemon with spare Energy just re-rolls until it succeeds, which turns a
    // real decision — is this worth the Energy? — into a formality. It is also
    // what makes "end the turn doing nothing" a live option, which Trevor names
    // as the correct play often enough that the rule has to permit it.
    if (p.active.status.confused && !this.flip('Confused - retreat?')) {
      p.retreated = true;
      this.log(`${this.nameOf(p.active)} is Confused - the retreat fails, and the Energy is still discarded.`, 'status');
      return { ok: true };
    }
    const old = p.active;
    clearStatus(old);
    p.active = b; p.bench.splice(a.bench, 1); p.bench.push(old);
    p.retreated = true;
    this.log(`${p.name} retreats ${this.nameOf(old)}; ${this.nameOf(b)} is now Active.`);
    // AFTER the switch, not before. Sinkhole's 20 lands on the Pokemon that
    // retreated, which by then is on the Bench — so a Weakness it had as the
    // Active is irrelevant, and the card says not to apply it anyway.
    this.fireOnOppRetreat(pi, old);
    return { ok: true };
  }

  // ---- WHICH Energy gets discarded ------------------------------------------
  // Seven places in this file discard Energy off a slot, and each used to decide
  // for itself — "the first one attached", or "the first one of the right type".
  // That is a real decision being made by array order: which Fire Energy leaves
  // a Charizard is the difference between attacking next turn and not.
  //
  // These four are the single decision point, so the player's pick, the AI's and
  // the fallback all agree and there is one thing to test.
  //
  // `chosen` is a list of uids in the order the player picked them. Anything not
  // supplied, or no longer attached, falls back to `energyPayOrder` — which is
  // what keeps every existing caller, the whole AI and every older test working
  // unchanged, and is already better than the index 0 that most sites used.
  //
  // Two option keys, named by ROLE rather than by site, because one attack can
  // do both and a single list would be split by a rule the caller cannot see:
  //   opts.costUids    Energy discarded off YOUR attacker to pay a cost
  //                    (COST_DISCARD_ENERGY, Wildfire, Super Energy Removal's half)
  //   opts.energyUids  Energy the effect TARGETS, on either side
  //                    (Energy Removal, Super Potion, DISCARD_DEF_ENERGY)
  // Retreat is the exception and predates both: it takes `a.pay`, because it
  // validates against a symbol total rather than a card count, and because it
  // may legitimately have to overshoot. See doRetreat and retreatPayOrder.

  // The entries a given discard is allowed to take. `filter` is by provided type
  // ('R' for a Fire cost), or null for "anything attached".
  energyChoices(slot, filter) {
    if (!slot) return [];
    return slot.energy.filter(e => energyIsType(this.db, e, filter));
  }

  // Worth stopping to ask? Only when there is slack AND the eligible cards are
  // not all the same thing. Three basic Fire is not a decision and a prompt for
  // it is pure friction — this is what keeps the picker rare enough to be
  // meaningful. Buzzap'd Electrodes count as distinct, which is correct: one is
  // a Pokemon you may want back.
  energyChoiceIsReal(slot, n, filter) {
    const pool = this.energyChoices(slot, filter);
    if (pool.length <= n) return false;
    const kinds = new Set(pool.map(e => e.id + '/' + (e.asEnergy || '')));
    return kinds.size > 1;
  }

  // Takes n CARDS and returns them, already removed from the slot. The caller
  // decides which discard pile they land in, because that differs by effect.
  takeEnergy(slot, n, filter, chosen) {
    const out = [];
    const queue = (chosen || []).slice();
    while (out.length < n) {
      const pool = this.energyChoices(slot, filter);
      if (!pool.length) break;
      let pick = null;
      while (queue.length && !pick) {
        const uid = queue.shift();
        pick = pool.find(e => e.uid === uid) || null;
      }
      if (!pick) pick = this.energyPayOrder(slot, filter)[0];
      if (!pick) break;
      out.push(slot.energy.splice(slot.energy.indexOf(pick), 1)[0]);
    }
    return out;
  }

  // When the caller doesn't specify which Energy to discard, spend the ones this
  // Pokemon's own attacks don't ask for, so we never eat the last Fire off a
  // Charmeleon to pay a Colorless cost. Also the AI's choice, for free.
  energyPayOrder(slot, filter) {
    const c = topCard(this.db, slot);
    const needed = new Set();
    (c.attacks || []).forEach(a => a.cost.split('').forEach(x => { if (x !== 'C') needed.add(x); }));
    return this.energyChoices(slot, filter).sort((x, y) => {
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
    if (this.trainersLocked(pi)) return this.fail('Trainer cards cannot be played this turn');
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
          const e = this.takeEnergy(tgt, 1, null, a.opts && a.opts.energyUids)[0];
          if (!e) return this.fail('No Energy to remove');
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
          const se = this.takeEnergy(tgt, 1, null, a.opts && a.opts.energyUids)[0];
          if (!se) return this.fail('No Energy to discard');
          p.discard.push(se);
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
        case 'T_POKE_BALL': {
          if (!this.flip('Poke Ball finds something?')) { this.log('Poke Ball: tails, nothing found.'); break; }
          const eligible = p.deck.map((x, i) => [x, i]).filter(([x]) => this.db[x.id].kind === 'pokemon');
          if (!eligible.length) { this.log('Poke Ball: no Pokemon left in the deck.'); this.shuffle(p.deck); break; }
          let at = -1;
          // AN INELIGIBLE pickUid IS REFUSED, not obeyed. This looked the card
          // up in the whole zone and never checked it against `eligible`, so a
          // caller could hand any uid in the deck to a restricted search —
          // Energy Search fetched a Charizard. EVOLVE_SELF_FROM_DECK had the
          // check from the start; these did not. See Rulings/ENERGY-SEARCH.md.
          if (a.opts && a.opts.pickUid !== undefined) {
            const k = p.deck.findIndex(x => x.uid === a.opts.pickUid);
            at = eligible.some(([, i]) => i === k) ? k : -1;
          }
          if (at === -1) at = eligible[this.pick(eligible.length)][1];
          const got = p.deck.splice(at, 1)[0];
          p.hand.push(got);
          this.log(`Poke Ball: found ${this.db[got.id].name}.`);
          this.shuffle(p.deck);
          break;
        }
        case 'T_ENERGY_SEARCH': {
          // BASIC Energy only. The GBC game let you take a Double Colorless and
          // we proposed matching it; it was reversed the same day, because clear
          // printed text beats the arbiter and Peek already settled that. The
          // argument on both sides is in Rulings/ENERGY-SEARCH.md — read it
          // before "fixing" this to match the Game Boy.
          const eligible = p.deck.map((x, i) => [x, i])
            .filter(([x]) => { const c2 = this.db[x.id]; return c2.kind === 'energy' && c2.cls === 'Basic'; });
          if (!eligible.length) { this.log('Energy Search: no basic Energy left.'); this.shuffle(p.deck); break; }
          let at = -1;
          // AN INELIGIBLE pickUid IS REFUSED, not obeyed. This looked the card
          // up in the whole zone and never checked it against `eligible`, so a
          // caller could hand any uid in the deck to a restricted search —
          // Energy Search fetched a Charizard. EVOLVE_SELF_FROM_DECK had the
          // check from the start; these did not. See Rulings/ENERGY-SEARCH.md.
          if (a.opts && a.opts.pickUid !== undefined) {
            const k = p.deck.findIndex(x => x.uid === a.opts.pickUid);
            at = eligible.some(([, i]) => i === k) ? k : -1;
          }
          if (at === -1) at = eligible[this.pick(eligible.length)][1];
          const got = p.deck.splice(at, 1)[0];
          p.hand.push(got);
          this.log(`Energy Search: found ${this.db[got.id].name}.`);
          this.shuffle(p.deck);
          break;
        }
        case 'T_MR_FUJI': {
          // A Benched Pokemon only, and the WHOLE slot goes back — evolution
          // stack, Energy, everything attached — shuffled into the deck rather
          // than discarded, which is what makes it a rescue and not a scoop.
          const tgt = (a.opts && a.opts.targetUid)
            ? p.bench.find(x => x.uid === a.opts.targetUid) : p.bench[this.pick(p.bench.length)];
          if (!tgt) return this.fail('No Benched Pokemon to return');
          const nm = this.nameOf(tgt);
          this.removeSlot(pi, tgt);
          const cards = this.gatherSlot(tgt);
          cards.forEach(x => p.deck.push(x));
          this.shuffle(p.deck);
          this.log(`Mr. Fuji: ${nm} and everything attached are shuffled into the deck (${cards.length} cards).`);
          break;
        }
        case 'T_GAMBLER': {
          // Shuffle the hand in FIRST, then draw — so the cards you gave up are
          // themselves candidates to come back.
          const gave = p.hand.length;
          while (p.hand.length) p.deck.push(p.hand.pop());
          this.shuffle(p.deck);
          const heads = this.flip('Gambler pays off?');
          const want = heads ? 8 : 1;
          let drew = 0;
          for (let i = 0; i < want && p.deck.length; i++) { p.hand.push(p.deck.shift()); drew++; }
          this.log(`Gambler: ${gave} shuffled away, ${heads ? 'heads' : 'tails'}, ${drew} drawn.`);
          break;
        }
        case 'T_RECYCLE': {
          if (!this.flip('Recycle?')) { this.log('Recycle: tails, nothing comes back.'); break; }
          let k = -1;
          if (a.opts && a.opts.pickUid !== undefined) k = p.discard.findIndex(x => x.uid === a.opts.pickUid);
          if (k === -1) k = p.discard.length - 1;
          if (k < 0) { this.log('Recycle: the discard pile is empty.'); break; }
          const got = p.discard.splice(k, 1)[0];
          p.deck.unshift(got);              // ON TOP, so it is the next card drawn
          this.log(`Recycle: ${this.db[got.id].name} goes on top of the deck.`);
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
          const hp = this.db[inst2.id].hp;
          sl.dmg = Math.floor(hp / 2 / 10) * 10;
          p.bench.push(sl);
          this.enterPlay(pi, sl, { source: 'discard' });
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
          o.bench.push(sl);
          this.enterPlay(1 - pi, sl, { source: 'discard' });
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
          this.log(`Pokemon Breeder: ${was} evolves straight into ${this.nameOf(tgt)}.`, 'eff');
          this.enterPlay(pi, tgt, { source: 'hand', evolved: true, opts: a.opts });
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
          // Two separate choices in one card: which of YOURS you pay with, then
          // which two of THEIRS go. Hence the two keys — see takeEnergy.
          const cost = this.takeEnergy(src, 1, null, a.opts && a.opts.costUids)[0];
          if (!cost) return this.fail('You have no Energy to discard');
          p.discard.push(cost);
          const taken = this.takeEnergy(tgt, 2, null, a.opts && a.opts.energyUids);
          taken.forEach(e => o.discard.push(e));
          const removed = taken.length;
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
        case 'T_POKE_BALL': if (p.deck.length === 0) return false; break;
        case 'T_ENERGY_SEARCH':
          // BASIC Energy only — the printed text, kept deliberately against a
          // real GBC contradiction. See Rulings/ENERGY-SEARCH.md.
          if (!p.deck.some(x => { const c2 = this.db[x.id]; return c2.kind === 'energy' && c2.cls === 'Basic'; })) return false;
          break;
        case 'T_MR_FUJI': if (!p.bench.length) return false; break;
        case 'T_GAMBLER': break;   // always legal; an empty hand still shuffles and draws
        case 'T_RECYCLE': if (!p.discard.length) return false; break;
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
    slot.transformedId = null;
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
        // "EVEN TO ITSELF" REACHES HERE, and this line is the whole reason the
        // ruling exists. The Confusion penalty never goes through computeDamage —
        // it is a flat add — so Frenzy has to be consulted a second time, or a
        // Confused Dark Primeape would take 30 where the card says 60.
        //
        // Never Weakness or Resistance: Confusion damage is not an attack's.
        // See Rulings/FRENZY-SELF-DAMAGE.md, and expect the log to look wrong —
        // it hands over a Prize for an attack that never resolved.
        const fr = this.activePower(atk, 'CONFUSED_BONUS');
        const self = 30 + (fr ? (fr.n || 0) : 0);
        this.log(`${card.name} is Confused - the attack fails and it hits itself for ${self}.`, 'status');
        if (fr) this.log(`${fr.name}: +${fr.n}, even to itself.`, 'eff');
        atk.dmg += self;
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
        if (this.energyChoices(atk, v.t || null).length < v.n) return this.fail('Cost could not be paid');
        this.takeEnergy(atk, v.n, v.t || null, a.opts && a.opts.costUids)
          .forEach(e => me.discard.push(e));
        this.log(`${card.name} discards ${v.n} ${v.t || ''} Energy as a cost.`.replace('  ', ' '));
      }
      // DRAG OFF SWITCHES FIRST AND THEN HITS WHAT IT DRAGGED UP. The existing
      // SWITCH_DEFENDER_CHOOSE runs after the damage, which is the Lure shape —
      // hurt what is there, then replace it. Dark Machoke does the opposite and
      // says so: "Before doing damage... Do the damage to the NEW Defending
      // Pokemon."
      //
      // `def` is a parameter rather than a closure, so reassigning it here
      // really does redirect everything downstream — damage, Weakness, status,
      // the lot. That is the whole reason this sits in the cost phase instead of
      // being a post-damage verb with a note attached.
      if (v.v === 'SWITCH_DEFENDER_FIRST') {
        const bench = you.bench;
        if (bench.length) {
          const bi = (a.opts && a.opts.bench !== undefined && a.opts.bench >= 0)
            ? Math.min(a.opts.bench, bench.length - 1) : this.pick(bench.length);
          const up = bench[bi];
          const old = you.active;
          bench.splice(bi, 1);
          clearStatus(old);
          you.active = up; bench.push(old);
          def = up;
          this.log(`${card.name} drags ${this.nameOf(up)} into the Active spot first.`, 'eff');
        }
      }
    }

    // base damage / damage-shaping verbs
    let base = parseDamage(attack.dmg);
    // Scyther's Swords Dance armed this attack last turn. Read before anything
    // else shapes it, so a later verb still overrides in the normal way.
    const buff = atk.effects.find(e => e.kind === 'ATTACK_BUFF' && e.name === attack.name);
    if (buff) {
      base = buff.base;
      this.log(`${buff.label || 'A buff'} raises ${attack.name} to ${base}.`, 'eff');
    }
    let nothing = false;
    let pendingRecoil = 0;
    // Statuses owed by a damage-shaping coin, applied with the post-damage ones
    // so a Barrier stops them exactly as it stops a printed STATUS.
    const pendingStatus = [];
    // Self-statuses decided during the DAMAGE-SHAPING phase, held until after
    // the damage lands. Only Petal Whirlwind uses it today: its three coins
    // decide the damage and the Confusion together, but the card says the
    // Confusion happens "after doing damage". Kept separate from pendingStatus
    // because that list goes to the DEFENDER and is gated on their Barrier,
    // which has no bearing on what a Pokemon does to itself.
    const selfStatus = [];
    for (const v of script) {
      if (v.v === 'FLIP_OR_NOTHING') { if (!this.flip('attack succeeds?')) nothing = true; }
      else if (v.v === 'DMG_PER_HEAD') {
        let h = 0;
        for (let i = 0; i < v.coins; i++) if (this.flip(`coin ${i + 1}/${v.coins}`)) h++;
        base = v.per * h;
        this.log(`${h} head(s) -> ${base} damage.`);
        // Petal Whirlwind. THE SAME THREE COINS decide the damage and whether
        // Dark Vileplume Confuses itself — "if you get 2 or more heads" — so it
        // is one verb reading one roll. Two verbs would flip six times and could
        // pay 90 without the Confusion, which is a different card.
        //
        // Deferred to the post-damage phase like every other self-status: the
        // card says "after doing damage", and STATUS_SELF deliberately ignores
        // the defender's Barrier for the same reason.
        if (v.selfStatusAtHeads && h >= v.selfStatusAtHeads.n) {
          selfStatus.push(v.selfStatusAtHeads.s);
          this.log(`${h} heads -> ${card.name} will be ${v.selfStatusAtHeads.s}.`, 'status');
        }
      } else if (v.v === 'DMG_PER_COUNTER_SELF') {
        // `base` is optional and defaults to 0. Flail is pure multiplication;
        // Rage is "10 damage plus 10 more for each counter".
        base = (v.base || 0) + v.per * Math.floor(atk.dmg / 10);
        this.log(`${Math.floor(atk.dmg / 10)} damage counter(s) -> ${base} damage.`);
      } else if (v.v === 'DMG_PER_SPARE_ENERGY') {
        // "plus 10 more for each Water Energy attached but not used to pay
        // for this attack's cost"
        const need = attack.cost.split('').filter(x => x === v.t).length;
        const have = atk.energy.filter(e => energyIsType(this.db, e, v.t)).length;
        let spare = Math.max(0, have - need);
        // Lapras, Omastar, Seadra and Omanyte all cap the bonus; Vaporeon caps
        // the COUNT ("extra Water Energy after the 2nd doesn't count"), which is
        // the same cap expressed the other way round.
        if (v.maxSpare !== undefined) spare = Math.min(spare, v.maxSpare);
        base = v.base + v.per * spare;
        this.log(`${v.base} plus ${v.per} per spare ${v.t} Energy (${spare}) -> ${base} damage.`);
      } else if (v.v === 'DMG_HALF_REMAINING') {
        const hpLeft = def ? topCard(this.db, def).hp - def.dmg : 0;
        base = Math.ceil(hpLeft / 2 / 10) * 10;
        this.log(`Half of ${hpLeft} remaining HP, rounded up -> ${base} damage.`);
      } else if (v.v === 'FLIP_BONUS_OR_RECOIL') {
        // ONE FLIP GOVERNS EVERYTHING THIS VERB DOES, and Team Rocket is what
        // widened it past damage. Three of its cards hang a status or an Energy
        // discard off the SAME coin as the damage bonus — Sticky Hands paralyses
        // on the heads that pays 30, Thunder Attack paralyses on heads and hurts
        // itself on tails, Playing with Fire burns an Energy on heads for 50.
        //
        // Scripting those as two verbs would flip TWICE, which is a different
        // card: it can pay the bonus and miss the status, or paralyse without
        // the bonus, neither of which any of them can do. If a card ties several
        // consequences to one coin, they belong in one verb.
        //
        // `statusOnHeads` is DEFERRED rather than applied here, because this
        // phase runs before the damage does — the same reason pendingRecoil is
        // deferred — and a status must land after the hit and must respect a
        // Barrier. It goes through the ordinary post-damage `blocked` gate.
        // `onTails` INVERTS WHICH FACE PAYS, and it exists for the log rather
        // than for the odds. Dark Dugtrio's Knock Down has the OPPONENT flip and
        // pays the bonus on TAILS; a coin is a coin, so scripting it as an
        // ordinary heads-bonus would play identically and read back as
        // "Heads -> 40 damage" on a card that says tails does that. The log is
        // what a player reads to work out what just happened to their board, and
        // it does not get to be approximately true.
        const paid = this.flip(v.label || 'bonus damage?');
        if (v.onTails ? !paid : paid) {
          base = v.base + v.bonus;
          if (v.statusOnHeads) pendingStatus.push(v.statusOnHeads);
          if (v.discardOnHeads) {
            const got = this.takeEnergy(atk, v.discardOnHeads.n || 1, v.discardOnHeads.t || null,
              (a && a.opts && a.opts.costUids) || null);
            got.forEach(e => me.discard.push(e));
            if (got.length) this.log(`${card.name} discards ${got.length} Energy.`, 'eff');
          }
          this.log(`${paid ? 'Heads' : 'Tails'} -> ${base} damage.`);
        } else {
          base = v.base;
          pendingRecoil += v.recoil;
          const face = paid ? 'Heads' : 'Tails';
          if (v.recoil) this.log(`${face} -> ${base} damage, and ${card.name} will take ${v.recoil}.`);
          else this.log(`${face} -> ${base} damage.`);
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
      } else if (v.v === 'DMG_PER_HEAD_UNTIL_TAILS') {
        // Geodude's Stone Barrage. Unbounded in principle; capped at 20 flips so
        // a pathological seed cannot hang a turn, which is far beyond any
        // reachable outcome (1 in a million past 20).
        let h2 = 0;
        while (h2 < 20 && this.flip(`Stone Barrage ${h2 + 1}`)) h2++;
        base = v.per * h2;
        this.log(`${h2} head(s) before tails -> ${base} damage.`);
      } else if (v.v === 'DMG_PER_OPP_BENCH_TAILS') {
        // Dark Hypno's Bench Manipulation. THE OPPONENT flips, one coin per
        // Pokemon on their OWN Bench, and the damage counts TAILS — so a wide
        // bench is a liability to them rather than a shield. An empty bench
        // means no coins and no damage at all, which is the card working.
        const n7 = you.bench.length;
        let tails7 = 0;
        for (let i = 0; i < n7; i++) if (!this.flip(`their coin ${i + 1}/${n7}`)) tails7++;
        base = v.per * tails7;
        this.log(`${tails7} of ${n7} tails -> ${base} damage.`);
      } else if (v.v === 'DMG_PER_ENERGY_HEADS') {
        // Big Eggsplosion: one coin per Energy ATTACHED, not per Energy paid.
        //
        // `t` narrows the count to one type — Continuous Fireball flips per FIRE
        // Energy rather than per Energy — and `discardPerHead` then burns that
        // many of them. Both default off, so Big Eggsplosion is untouched.
        const pool6 = atk.energy.filter(e => energyIsType(this.db, e, v.t));
        const n6 = pool6.length;
        let h3 = 0;
        for (let i = 0; i < n6; i++) if (this.flip(`coin ${i + 1}/${n6}`)) h3++;
        base = v.per * h3;
        if (v.discardPerHead && h3 > 0) {
          const gone = this.takeEnergy(atk, h3, v.t || null, (a && a.opts && a.opts.costUids) || null);
          gone.forEach(e => me.discard.push(e));
          this.log(`${card.name} discards ${gone.length} Energy — one per head.`, 'eff');
        }
        this.log(`${h3} of ${n6} heads -> ${base} damage.`);
      } else if (v.v === 'BUFF_OWN_ATTACK') {
        // Swords Dance does no damage itself; it arms the NEXT turn's Slash.
        // Handled below as a lasting effect, so nothing to shape here.
      } else if (v.v === 'DMG_PER_OWN_BENCH') {
        // Wigglytuff's Do the Wave. A Clefairy Doll on the Bench DOES count —
        // it is a Pokemon while in play. Settled with Trevor, see RULINGS.md.
        const n3 = me.bench.length;
        base = v.base + v.per * n3;
        this.log(`${v.base} plus ${v.per} per Benched Pokemon (${n3}) -> ${base} damage.`);
      } else if (v.v === 'DMG_PER_NAMED_IN_PLAY') {
        // Nidoqueen's Boyfriends. Matched on card NAME rather than species, so a
        // differently-named Nidoking would not count.
        //
        // THREE SCOPES, and the default is the Base Set one. `names` takes a
        // list (Magnemite's Magnetism counts three different cards); `where`
        // picks the search: 'mine' (default, every slot you have), 'bench' (yours
        // only, which is what Magnetism says), or 'all' (both sides, which is
        // what Mass Explosion's "in play" means).
        const want4 = v.names || [v.name];
        const pool4 = v.where === 'all' ? this.namedInPlay(want4)
          : v.where === 'bench' ? this.state.players[pi].bench.filter(sl => want4.indexOf(topCard(this.db, sl).name) >= 0)
          : this.allSlots(pi).filter(sl => want4.indexOf(topCard(this.db, sl).name) >= 0);
        const n4 = pool4.length;
        base = v.base + v.per * n4;
        this.log(`${v.base} plus ${v.per} per ${v.name} in play (${n4}) -> ${base} damage.`);
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

    // Magneton's Sonicboom. "Don't apply Weakness and Resistance for this
    // attack" — everything AFTER W/R (PlusPower, Defender, Kabuto Armor) still
    // applies, which is exactly what dealDamage's existing noWR already means.
    const flat = script.some(v => v.v === 'NO_WR');
    const res = negated ? { dealt: 0, prevented: true }
      : this.dealDamage(atk, def, base, { noWR: flat });

    // RECOIL DOES NOT APPLY WHEN THE DEFENDER STOPPED THE DAMAGE — 16 Aug 2026,
    // settled with Trevor. Take Down into Chansey's Scrunch was hurting Arcanine
    // for 30 while achieving nothing.
    //
    // The printed text reads the other way and I argued for that: Scrunch
    // prevents damage done to CHANSEY, and Take Down's 30 is damage Arcanine
    // does to ITSELF, so they look like separate things. Trevor's answer is both
    // the arbiter and the better argument — it is how the Game Boy game plays it
    // and how Pocket plays it, and the balance reasoning is to reverse the
    // viewpoint: preventing the damage is already the whole reward for standing
    // there, and handing the preventer a free 30 on top swings it too far.
    //
    // SCOPE, and this is the part to read before widening it. It covers damage
    // and DEFENDER-SIDE consequences only. Self-inflicted status — Tauros
    // confusing itself on tails — still applies, because that is the attacker's
    // own coin rather than anything the defender did. The defender-side half was
    // already right by accident: `retaliate()` sits inside `if (r.dmg > 0)`, so
    // a Strikes Back never fired on a prevented hit.
    //
    // Keyed on the DEFENDER having stopped it, not on "the number came out 0".
    // A whiffed coin flip is the attacker's own bad luck and pays its recoil.
    const stopped = res.prevented || (base > 0 && res.dealt === 0);
    if (stopped && (pendingRecoil > 0 || script.some(v => v.v === 'RECOIL' || v.v === 'RECOIL_ON_FLIP'))) {
      this.log(`${this.nameOf(def)} took no damage, so ${card.name} takes no recoil.`, 'eff');
    }
    if (pendingRecoil > 0 && !stopped) {
      atk.dmg += pendingRecoil;
      this.log(`${card.name} does ${pendingRecoil} damage to itself. (${atk.dmg} total)`, 'eff');
    }

    // post-damage verbs
    const blocked = negated || this.effectsBlocked(def);
    for (const st of pendingStatus) {
      if (blocked) this.log(`${this.nameOf(def)} is protected - no ${st}.`, 'eff');
      else if (def) this.applyStatus(def, st);
    }
    for (const st of selfStatus) this.applyStatus(atk, st);
    for (const v of script) {
      switch (v.v) {
        // `s` may be a list. Venom Powder applies Confused AND Poisoned on one
        // coin, which is legal because Poison sits outside the
        // Asleep/Confused/Paralyzed group rather than replacing it.
        case 'STATUS':
          if (blocked) this.log(`${this.nameOf(def)} is protected - no ${v.s}.`, 'eff');
          else for (const st of [].concat(v.s)) this.applyStatus(def, st);
          break;
        case 'STATUS_ON_FLIP':
          if (this.flip(`${[].concat(v.s).join(' and ')}?`)) {
            if (blocked) this.log(`${this.nameOf(def)} is protected - no ${v.s}.`, 'eff');
            else for (const st of [].concat(v.s)) this.applyStatus(def, st);
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
          const e2 = this.takeEnergy(def, 1, null, a.opts && a.opts.energyUids)[0];
          if (!e2) { this.log('No Energy to discard.', 'eff'); break; }
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
          // The flip is skipped entirely rather than rolled and discarded: it is
          // announced to the player, and a coin nobody is bound by is noise.
          if (stopped) break;
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
        case 'BENCH_SPLASH':
          // `side: 'theirs'` is Dark Arbok's Poison Vapor. The default hits BOTH
          // benches, which is what Base Set's Selfdestruct family asks for.
          if (v.side === 'theirs') {
            for (const b of you.bench) this.dealDamage(atk, b, v.n, { noWR: true });
            this.log(`${v.n} to each of ${you.name}'s Benched Pokemon.`, 'eff');
            break;
          } {
          for (let pi2 = 0; pi2 < 2; pi2++) {
            for (const b of s.players[pi2].bench) this.dealDamage(atk, b, v.n, { noWR: true });
          }
          this.log(`${v.n} damage splashed onto every Benched Pokemon.`, 'eff');
          break;
        }
        case 'RECOIL':
          if (stopped) break;
          atk.dmg += v.n;
          this.log(`${card.name} does ${v.n} damage to itself. (${atk.dmg} total)`, 'eff'); break;
        case 'HEAL_SELF_ALL':
          if (atk.dmg > 0) { this.log(`${card.name} removes all ${atk.dmg} damage from itself.`, 'eff'); atk.dmg = 0; }
          break;
        // Leech Life, Mega Drain, Absorb. `half` rounds UP to the nearest 10, as
        // both cards printing it say; the plain version removes the damage dealt.
        // Capped at what is actually on the Pokemon, which is the "if it has
        // fewer damage counters than that, remove all of them" clause.
        case 'SEARCH_ENERGY_TO_SELF': {
          // Slowpoke's Afternoon Nap. "Search your deck for a Psychic Energy
          // card and attach it to Slowpoke."
          //
          // ENERGY *CARD*, so it is basic by class — the Rain Dance reading, not
          // the Hydrocannon one. A Rainbow Energy will not be found by this even
          // once Rainbow exists, and that is the split the two rulings turn on.
          // See Rulings/ENERGY-VS-ENERGY-CARD.md.
          //
          // It does NOT consume the turn's one Energy attachment: the attachment
          // rule governs playing an Energy card from your HAND, and this one
          // never reaches a hand.
          const wantE = x => this.isBasicEnergyOf(x, v.t);
          const poolE = me.deck.map((x, i2) => [x, i2]).filter(([x]) => wantE(x));
          if (!poolE.length) { this.log('No such Energy in the deck.', 'eff'); this.shuffle(me.deck); break; }
          let atE = -1;
          if (a && a.opts && a.opts.pickUid !== undefined) atE = me.deck.findIndex(x => x.uid === a.opts.pickUid && wantE(x));
          if (atE === -1) atE = poolE[0][1];
          const gotE = me.deck.splice(atE, 1)[0];
          atk.energy.push(gotE);
          this.log(`${card.name} finds ${this.db[gotE.id].name} and attaches it.`, 'eff');
          this.shuffle(me.deck);
          break;
        }
        case 'SEARCH_BASIC_TO_BENCH': {
          // Call for Family / Call for Friend / Sprout. Named, or by type for
          // Marowak. Legality already refused a full Bench.
          const wants = (c2) => {
            if (c2.kind !== 'pokemon' || c2.stage !== 'Basic') return false;
            if (v.names) return v.names.indexOf(c2.name) >= 0;
            if (v.name) return c2.name === v.name;
            if (v.type) return c2.type === v.type;
            return true;
          };
          const eligible = me.deck.map((x, i) => [x, i]).filter(([x]) => wants(this.db[x.id]));
          if (!eligible.length) { this.log('Nothing in the deck to call.', 'eff'); this.shuffle(me.deck); break; }
          let at = -1;
          // AN INELIGIBLE pickUid IS REFUSED, not obeyed. This looked the card
          // up in the whole zone and never checked it against `eligible`, so a
          // caller could hand any uid in the deck to a restricted search —
          // Energy Search fetched a Charizard. EVOLVE_SELF_FROM_DECK had the
          // check from the start; these did not. See Rulings/ENERGY-SEARCH.md.
          if (a && a.opts && a.opts.pickUid !== undefined) {
            const k = me.deck.findIndex(x => x.uid === a.opts.pickUid);
            at = eligible.some(([, i]) => i === k) ? k : -1;
          }
          if (at === -1) at = eligible[this.pick(eligible.length)][1];
          const got = me.deck.splice(at, 1)[0];
          me.bench.push(this.mkSlot(got));
          this.enterPlay(pi, me.bench[me.bench.length - 1], { source: 'deck' });
          this.log(`${card.name} calls ${this.db[got.id].name} to the Bench.`, 'eff');
          this.shuffle(me.deck);
          break;
        }
        case 'HEAL_SELF_ON_FLIP':
          if (this.flip(v.label || 'remove a damage counter?')) {
            const h4 = Math.min((v.n || 1) * 10, atk.dmg);
            atk.dmg -= h4;
            this.log(`${card.name} removes ${h4} damage from itself.`, 'eff');
          }
          break;
        case 'ENERGY_FROM_DISCARD': {
          // Gastly's Energy Conversion: UP TO n, so an empty discard is fine.
          const picks = (a && a.opts && a.opts.uids) || null;
          const taken2 = [];
          if (picks) {
            for (const u of picks.slice(0, v.n)) {
              const k = me.discard.findIndex(x => x.uid === u);
              if (k >= 0 && this.db[me.discard[k].id].kind === 'energy') taken2.push(me.discard.splice(k, 1)[0]);
            }
          } else {
            // Unattended fallback: the most recently discarded Energy, which is
            // deterministic and therefore keeps a seeded game reproducible.
            for (let i = me.discard.length - 1; i >= 0 && taken2.length < v.n; i--) {
              if (this.db[me.discard[i].id].kind === 'energy') taken2.push(me.discard.splice(i, 1)[0]);
            }
          }
          taken2.forEach(x => me.hand.push(x));
          this.log(`${card.name} takes back ${taken2.length} Energy.`, 'eff');
          break;
        }
        case 'TRAINER_FROM_DISCARD': {
          let k2 = -1;
          // AN INELIGIBLE pickUid IS REFUSED, not obeyed. This looked the card
          // up in the whole zone and never checked it against `eligible`, so a
          // caller could hand any uid in the deck to a restricted search —
          // Energy Search fetched a Charizard. EVOLVE_SELF_FROM_DECK had the
          // check from the start; these did not. See Rulings/ENERGY-SEARCH.md.
          if (a && a.opts && a.opts.pickUid !== undefined) {
            const k = me.discard.findIndex(x => x.uid === a.opts.pickUid);
            if (k >= 0 && this.db[me.discard[k].id].kind === 'trainer') k2 = k;
          }
          if (k2 === -1) k2 = me.discard.map((x, i) => [x, i])
            .filter(([x]) => this.db[x.id].kind === 'trainer').map(([, i]) => i).pop() ?? -1;
          if (k2 === -1) { this.log('No Trainer card in the discard pile.', 'eff'); break; }
          const got2 = me.discard.splice(k2, 1)[0];
          me.hand.push(got2);
          this.log(`${card.name} salvages ${this.db[got2.id].name}.`, 'eff');
          break;
        }
        case 'WILDFIRE': {
          // Moltres. The player chooses how many Fire to burn, capped at what is
          // attached — Trevor, 10 Aug. Each one mills a card from their deck.
          const fire = atk.energy.filter(e => energyIsType(this.db, e, 'R'));
          const max = fire.length;
          let n7 = (a && a.opts && a.opts.count !== undefined) ? a.opts.count : max;
          n7 = Math.max(0, Math.min(n7, max));
          if (n7 === 0) { this.log('No Fire Energy discarded, so nothing burns.', 'eff'); break; }
          this.takeEnergy(atk, n7, 'R', a.opts && a.opts.costUids).forEach(e => me.discard.push(e));
          let burned = 0;
          for (let i = 0; i < n7 && you.deck.length; i++) { you.discard.push(you.deck.shift()); burned++; }
          this.log(`Wildfire: ${n7} Fire discarded, ${burned} card(s) burned off ${you.name}'s deck.`, 'eff');
          break;
        }
        case 'REARRANGE_TOP': {
          // Hypno's Prophecy. Either deck — rearranging THEIRS is a real effect
          // even against an opponent that sees everything, because it decides
          // what they draw and when. See RULINGS.md.
          const side = (a && a.opts && a.opts.side === 'them') ? you : me;
          const n8 = Math.min(v.n, side.deck.length);
          if (n8 === 0) { this.log('That deck is empty.', 'eff'); break; }
          const order = (a && a.opts && a.opts.order) || null;
          if (order && order.length === n8) {
            const head = side.deck.slice(0, n8);
            const seen = {};
            const rebuilt = [];
            for (const i of order) {
              if (i >= 0 && i < n8 && !seen[i]) { seen[i] = 1; rebuilt.push(head[i]); }
            }
            for (let i = 0; i < n8; i++) if (!seen[i]) rebuilt.push(head[i]);
            side.deck.splice(0, n8, ...rebuilt);
          }
          this.log(`${card.name} looks at the top ${n8} of ${side.name}'s deck.`, 'eff');
          break;
        }
        case 'RETURN_DEFENDER_TO_HAND': {
          // Pidgeot's Hurricane. "Unless this attack Knocks Out the Defending
          // Pokemon" — so a lethal hit simply Knocks it Out in the normal way.
          if (!def) break;
          if (blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          if (def.dmg >= topCard(this.db, def).hp) { this.log('It was Knocked Out instead.', 'eff'); break; }
          const nm = this.nameOf(def);
          const where2 = this.removeSlot(1 - pi, def);
          this.gatherSlot(def).forEach(x => you.hand.push(x));
          this.log(`${nm} and everything attached go back to ${you.name}'s hand.`, 'eff');
          if (where2 === 'active' && you.bench.length) this.addPromote(1 - pi);
          break;
        }
        case 'WHIRLWIND_ON_FLIP':
          // Arbok's Terror Strike. The damage lands either way; only the switch
          // is on the coin.
          if (blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          if (this.flip(v.label || 'force a switch?')) {
            if (!you.bench.length) this.log(`${you.name} has no Benched Pokemon to switch to.`, 'eff');
            else { s.pendingSwitch = 1 - pi; this.log(`${you.name} must choose a Benched Pokemon to switch in.`, 'eff'); }
          }
          break;
        case 'DAMAGE_REDUCTION_SELF':
          atk.effects.push({ kind: 'DAMAGE_REDUCTION', amount: v.n, label: v.label || 'Minimize',
                             expireAtStartOfTurn: s.turn + 2 });
          this.log(`Damage to ${card.name} is reduced by ${v.n} during the opponent's next turn.`, 'eff');
          break;
        case 'DAMAGE_REDUCTION_FROM':
          // Pounce, Snivel. Only from THIS defender — `fromUid` is what
          // computeDamage checks, and it doubles as the "benching either Pokemon
          // ends this effect" clause, since a benched attacker stops being the
          // Active one whose uid it names.
          if (!def) break;
          atk.effects.push({ kind: 'DAMAGE_REDUCTION', amount: v.n, fromUid: def.uid,
                             label: v.label || 'a flinch', expireAtStartOfTurn: s.turn + 2 });
          this.log(`Damage from ${this.nameOf(def)} is reduced by ${v.n} next turn.`, 'eff');
          break;
        case 'CANT_ATTACK_ON_FLIP':
          if (blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          if (!def) break;
          if (this.flip(v.label || 'stop them attacking?')) {
            def.effects.push({ kind: 'CANT_ATTACK', fromUid: atk.uid, label: v.label || 'Tail Wag',
                               expireAtStartOfTurn: s.turn + 2 });
            this.log(`${this.nameOf(def)} can't attack ${card.name} during the opponent's next turn.`, 'eff');
          }
          break;
        case 'CANT_RETREAT_ON_FLIP':
          if (blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          if (!def) break;
          if (this.flip(v.label || 'stop them retreating?')) {
            def.effects.push({ kind: 'CANT_RETREAT', label: v.label || 'Acid',
                               expireAtStartOfTurn: s.turn + 2 });
            this.log(`${this.nameOf(def)} can't retreat during the opponent's next turn.`, 'eff');
          }
          break;
        case 'BENCH_SPLASH_FLIP_SIDE': {
          // Articuno's Blizzard. One coin decides WHOSE bench takes it.
          const mineSide = !this.flip(v.label || 'their bench?');
          const side = mineSide ? me.bench : you.bench;
          for (const b of side) this.dealDamage(atk, b, v.n, { noWR: true });
          this.log(`${v.n} to each of ${(mineSide ? me : you).name}'s Benched Pokemon.`, 'eff');
          break;
        }
        case 'BENCH_SPLASH_PER_FLIP': {
          // Zapdos' Thunderstorm. A coin per benched Pokemon, then self-damage
          // for every tail — so a wide opposing bench is a real risk to take.
          let tails = 0;
          for (const b of you.bench) {
            if (this.flip(`hit ${this.nameOf(b)}?`)) this.dealDamage(atk, b, v.dmg, { noWR: true });
            else tails++;
          }
          if (tails > 0) {
            atk.dmg += tails * v.selfPerTail;
            this.log(`${tails} tail(s): ${card.name} takes ${tails * v.selfPerTail}. (${atk.dmg} total)`, 'eff');
          }
          break;
        }
        case 'BENCH_SPLASH_TYPED': {
          // Electrode's Chain Lightning. Nothing happens at all against a
          // Colorless defender, which is the card's own clause and not a guard.
          if (!def) break;
          const dt = topCard(this.db, def).type;
          if (!dt || dt === 'C') { this.log('The Defending Pokemon is Colorless - Chain Lightning stops there.', 'eff'); break; }
          for (let pi2 = 0; pi2 < 2; pi2++) {
            for (const b of s.players[pi2].bench) {
              if (topCard(this.db, b).type === dt) this.dealDamage(atk, b, v.n, { noWR: true });
            }
          }
          this.log(`${v.n} to every Benched ${dt} Pokemon on both sides.`, 'eff');
          break;
        }
        case 'SWITCH_SELF_CHOOSE': {
          // Exeggutor's Teleport. A free switch the ATTACKER chooses, with no
          // retreat cost and no Energy paid.
          //
          // `optional: true` IS THE DIFFERENCE BETWEEN "switch" AND "YOU MAY
          // switch", and it is not cosmetic. Teleport switches; Dark Alakazam's
          // Teleport Blast offers. Forcing the offer would drag a charged
          // attacker off the front every time the attack is used, which makes a
          // strictly better card strictly worse — so a `may` verb that cannot
          // decline is a misprint, not a simplification.
          //
          // A declining player sends `bench: -1`. Absent is NOT declining: every
          // caller that predates this — the AI, every older test — supplies
          // nothing and must keep switching, so the fallback stays as it was.
          if (!me.bench.length) { this.log('No Benched Pokemon to switch with.', 'eff'); break; }
          if (v.optional && a && a.opts && a.opts.bench === -1) {
            this.log(`${card.name} stays in the Active spot.`, 'eff');
            break;
          }
          const bi2 = (a && a.opts && a.opts.bench !== undefined && a.opts.bench >= 0) ? a.opts.bench : this.pick(me.bench.length);
          const b2 = me.bench[bi2];
          if (b2) {
            const old2 = me.active;
            clearStatus(old2);
            me.active = b2; me.bench.splice(bi2, 1); me.bench.push(old2);
            this.log(`${card.name} switches out for ${this.nameOf(b2)}.`, 'eff');
          }
          break;
        }
        case 'NO_TRAINERS_NEXT_TURN':
          you.noTrainersUntil = s.turn + 2;
          this.log(`${you.name} can't play Trainer cards during their next turn.`, 'eff');
          break;
        case 'BUFF_OWN_ATTACK':
          atk.effects.push({ kind: 'ATTACK_BUFF', name: v.attack, base: v.base,
                             label: v.label || 'Swords Dance', expireAtStartOfTurn: s.turn + 2 });
          this.log(`${card.name}'s ${v.attack} does ${v.base} during your next turn.`, 'eff');
          break;
        case 'HEAL_SELF_EQUAL_DAMAGE': {
          const dealt = res.dealt || 0;
          if (dealt > 0 && atk.dmg > 0) {
            const want = v.half ? Math.ceil(dealt / 2 / 10) * 10 : dealt;
            const h2 = Math.min(want, atk.dmg);
            atk.dmg -= h2;
            this.log(`${card.name} removes ${h2} damage from itself.`, 'eff');
          }
          break;
        }
        case 'STATUS_SELF':
          // Petal Dance, Foul Odor. On SELF, so Barrier on the defender is
          // irrelevant and `blocked` is deliberately not consulted.
          this.applyStatus(atk, v.s);
          break;
        case 'STATUS_SELF_ON_TAILS':
          if (!this.flip(v.label || `${v.s}?`)) this.applyStatus(atk, v.s);
          break;
        case 'DRAW':
          for (let i = 0; i < v.n && me.deck.length; i++) me.hand.push(me.deck.shift());
          this.log(`${me.name} draws ${v.n}.`, 'eff');
          break;
        case 'DRAW_ON_FLIP':
          if (this.flip('draw a card?')) {
            if (me.deck.length) { me.hand.push(me.deck.shift()); this.log(`${me.name} draws a card.`, 'eff'); }
          }
          break;
        // Dark Mind, Spark, Stretch Kick, Gigashock. The ATTACKER chooses, and
        // Weakness and Resistance never apply to Bench damage.
        case 'BENCH_SNIPE': {
          // TWO SCOPES, and Team Rocket is why. Base Set's snipes say "1 of your
          // opponent's BENCHED Pokemon"; Dark Arbok, Dark Golbat, Diglett and
          // Meowth say "1 of your opponent's Pokemon" — the Active included,
          // which is a different set and is the whole point of those cards. They
          // can hit what is in front of them for a fixed amount past Weakness,
          // Resistance and any damage reduction the defender is carrying.
          //
          // `target: 'any'` opts in. The default stays Bench-only so no existing
          // card changes behaviour, and the verb keeps ONE implementation rather
          // than growing a near-identical twin.
          const pool = v.target === 'any'
            ? (you.active ? [you.active].concat(you.bench) : you.bench.slice())
            : you.bench;
          if (!pool.length) { this.log('No Pokemon to hit.', 'eff'); break; }
          const want = Math.min(v.n || 1, pool.length);
          let picks = (a && a.opts && a.opts.bench) || [];
          if (!Array.isArray(picks)) picks = [picks];
          picks = picks.filter(i => i >= 0 && i < pool.length).slice(0, want);
          for (let i = 0; picks.length < want; i++) if (picks.indexOf(i) < 0) picks.push(i);
          for (const i of picks) {
            const tgt = pool[i];
            // PROTECTION IS ASKED PER TARGET, not inherited from the defender.
            // A snipe can hit a BENCHED Pokemon, and `blocked` upstream answers
            // only for whoever is Active — so a protected Pokemon standing on
            // the Bench would otherwise be hit anyway. Trevor, 18 Aug: it should
            // be protected wherever it is standing.
            if (this.effectsBlocked(tgt)) {
              this.log(`${this.nameOf(tgt)} is protected.`, 'eff');
              continue;
            }
            this.dealDamage(atk, tgt, v.dmg, { noWR: true });
            const where = tgt === you.active ? '' : ' on the Bench';
            this.log(`${v.dmg} to ${this.nameOf(tgt)}${where}.`, 'eff');
            // Dark Arbok's Stare. The suppression rides the SAME chosen target
            // as the damage, which is why it is a flag here rather than a second
            // verb — two verbs would each pick their own and could disagree.
            //
            // IT IS NOT CONDITIONAL ON THE DAMAGE LANDING. The card gates it on
            // "if that Pokemon has a Pokemon Power", not on being hurt, and the
            // settled scope table in Rulings/PREVENTED-DAMAGE-RECOIL.md puts
            // effects landed on the target in the `unchanged` row — governed by
            // effectsBlocked, which is the check immediately above. A Defender
            // reducing the damage to zero does not stop a Poisonpowder today and
            // must not stop this either.
            if (v.suppressPower) {
              tgt.effects.push({
                kind: 'POWER_OFF', label: v.label || 'Stare',
                expireAtStartOfTurn: s.turn + 2,
              });
              this.log(`${this.nameOf(tgt)}'s Pokemon Power stops working until the end of `
                + `${you.name}'s next turn.`, 'eff');
            }
          }
          break;
        }
        case 'EVOLVE_SELF_FROM_DECK': {
          // Magikarp's Rapid Evolution. Searches out a named Evolution and puts
          // it straight onto the attacker — "(This counts as evolving Magikarp.)"
          //
          // It reuses doEvolve's mechanics rather than reimplementing them: push
          // onto the stack, stamp evolvedTurn, clear Special Conditions. Those
          // three together ARE evolving, and a card that says it counts as
          // evolving must not be a fourth thing that looks similar.
          //
          // NO TIMING GATE, and that is deliberate. `canEvolve` refuses a Pokemon
          // played this turn and one already evolved this turn; neither can apply
          // here, because the attacker has to have been in play since last turn
          // to attack at all. Trevor, 17 Aug: the three-Energy cost puts it out
          // of reach of a first turn on its own.
          const names = v.names || [v.name];
          const legal = i => {
            const c2 = this.db[me.deck[i].id];
            return c2 && c2.kind === 'pokemon' && names.indexOf(c2.name) >= 0
                && c2.evolvesFrom === topCard(this.db, atk).name;
          };
          const idxs = me.deck.map((_, i) => i).filter(legal);
          if (!idxs.length) { this.log('No such Evolution card in the deck.', 'eff'); break; }
          // The player picks WHICH — the two are a different card each. Absent a
          // choice, take the first legal one so the AI and older callers work.
          let k = idxs[0];
          if (a && a.opts && a.opts.pickUid !== undefined) {
            const want = me.deck.findIndex(x => x.uid === a.opts.pickUid);
            if (idxs.indexOf(want) >= 0) k = want;
          }
          const inst = me.deck.splice(k, 1)[0];
          const was = this.nameOf(atk);
          atk.stack.push(inst);
          this.enterPlay(pi, atk, { source: 'deck', evolved: true });
          this.shuffle(me.deck);
          this.log(`${was} evolves into ${this.db[inst.id].name}. Special Conditions removed.`, 'eff');
          break;
        }
        case 'OPTIONAL_DISCARD_THEN_SNIPE': {
          // Dark Rapidash's Flame Pillar. "You MAY discard 1 Fire Energy... IF
          // YOU DO and if your opponent has any Benched Pokemon, choose 1 of
          // them and this attack does 10 damage to it."
          //
          // Two conditions chained, and the order matters: no discard means no
          // snipe, and no Bench means the discard is pointless — so it is not
          // taken at all. A player who declines sends `costUids: []`; ABSENT
          // means take it, which keeps the AI and older callers doing the
          // aggressive thing rather than silently opting out of the card.
          const declined = a && a.opts && Array.isArray(a.opts.costUids) && a.opts.costUids.length === 0;
          if (declined) { this.log(`${card.name} keeps its Energy.`, 'eff'); break; }
          if (!you.bench.length) { this.log('No Benched Pokemon to hit — the Energy is kept.', 'eff'); break; }
          const fuel = this.takeEnergy(atk, v.n || 1, v.t || null, (a && a.opts && a.opts.costUids) || null);
          if (!fuel.length) break;
          fuel.forEach(e => me.discard.push(e));
          const bi3 = (a && a.opts && a.opts.bench !== undefined && you.bench[a.opts.bench])
            ? a.opts.bench : this.pick(you.bench.length);
          this.dealDamage(atk, you.bench[bi3], v.dmg, { noWR: true });
          this.log(`${card.name} burns an Energy and hits ${this.nameOf(you.bench[bi3])} for ${v.dmg}.`, 'eff');
          break;
        }
        case 'MIRROR_SHELL':
          atk.effects.push({ kind: 'MIRROR_SHELL', label: v.label || 'Mirror Shell',
            expireAtStartOfTurn: s.turn + 2 });
          this.log(`${card.name} raises its shell.`, 'eff');
          break;
        case 'SCATTER_OWN_ENERGY': {
          // Dark Electrode's Energy Bomb. Everything on the attacker moves to
          // our OWN Bench, distributed however we like — and is DISCARDED
          // outright if there is no Bench to move it to, which is the card's own
          // clause and the reason this is not just a move.
          const bench = me.bench;
          const pile = atk.energy.splice(0, atk.energy.length);
          if (!bench.length) {
            pile.forEach(e => me.discard.push(e));
            this.log(`No Bench — ${card.name} discards all ${pile.length} Energy.`, 'eff');
            break;
          }
          // `opts.spread` is a list of bench indices parallel to the pile. The
          // fallback deals them round-robin, which is the least-bad default: it
          // never dumps everything on one Pokemon the player did not choose.
          const spread = (a && a.opts && a.opts.spread) || null;
          pile.forEach((e, i) => {
            const bi = spread && spread[i] !== undefined && bench[spread[i]] ? spread[i] : i % bench.length;
            bench[bi].energy.push(e);
          });
          this.log(`${card.name} scatters ${pile.length} Energy onto the Bench.`, 'eff');
          break;
        }
        case 'MOVE_DEF_ENERGY_TO_BENCH': {
          // Dark Magneton's Magnetic Lines. BASIC Energy only — the card says
          // "basic Energy cards", which under the Energy/Energy-card ruling means
          // the physical class and excludes Rainbow. See
          // Rulings/ENERGY-VS-ENERGY-CARD.md.
          //
          // Both halves are conditional and independent: no basic Energy on the
          // defender, or no Bench to move it to, and nothing happens.
          if (!def || blocked) break;
          const basics = def.energy.filter(e => {
            const c2 = this.db[e.id];
            return c2 && c2.kind === 'energy' && c2.cls === 'Basic';
          });
          if (!basics.length || !you.bench.length) break;
          const wantUid = a && a.opts && a.opts.energyUids && a.opts.energyUids[0];
          const pick = basics.find(e => e.uid === wantUid) || basics[0];
          const bi = (a && a.opts && a.opts.bench !== undefined && you.bench[a.opts.bench])
            ? a.opts.bench : this.pick(you.bench.length);
          def.energy.splice(def.energy.indexOf(pick), 1);
          you.bench[bi].energy.push(pick);
          this.log(`${this.db[pick.id].name} moves from ${this.nameOf(def)} to `
            + `${this.nameOf(you.bench[bi])}.`, 'eff');
          break;
        }
        case 'SHUFFLE_INTO_DECK': {
          // Abra's Vanish and Dark Machamp's Fling are ONE verb, and the two
          // things that differ are both parameters rather than special cases:
          // WHO goes, and where the Energy on them ends up.
          //
          //   Vanish  target 'self',     attached 'discard'
          //           "Shuffle Abra into your deck. (Discard all cards attached.)"
          //   Fling   target 'defender', attached 'deck'
          //           "...his or her Active Pokemon AND ALL CARDS ATTACHED TO IT
          //            into his or her deck."
          //
          // Fling therefore RECYCLES their Energy and Vanish BURNS yours, which
          // is a real difference in card power and not a detail to smooth over.
          const self = v.target === 'self';
          const sl = self ? atk : def;
          if (!sl) break;
          if (!self && blocked) { this.log(`${this.nameOf(def)} is protected.`, 'eff'); break; }
          const owner = self ? pi : 1 - pi;
          const side = this.state.players[owner];
          const nm = this.nameOf(sl);
          const where = this.removeSlot(owner, sl);
          // gatherSlot returns the whole pile — the evolution stack and the
          // Energy — which is exactly what both cards move.
          const pile = this.gatherSlot(sl);
          const toDeck = v.attached === 'deck'
            ? pile
            : pile.filter(x => this.db[x.id] && this.db[x.id].kind === 'pokemon');
          const toDiscard = pile.filter(x => toDeck.indexOf(x) < 0);
          toDeck.forEach(x => side.deck.push(x));
          toDiscard.forEach(x => side.discard.push(x));
          this.shuffle(side.deck);
          this.log(`${nm} is shuffled into ${side.name}'s deck`
            + (toDiscard.length ? `; ${toDiscard.length} attached card(s) discarded.` : '.'), 'eff');
          // NO INVENTED GATE ON VANISH. Fling prints "can't be used if your
          // opponent has no Benched Pokemon" and gets that as a legality check;
          // Abra prints nothing of the kind, so shuffling away your last Pokemon
          // is legal and loses you the game. Inventing a guard for comfort is
          // exactly what Rulings/MASS-EXPLOSION.md argues against, and the engine
          // already ends the game correctly when a side has nothing left.
          if (where === 'active' && side.bench.length) this.addPromote(owner);
          break;
        }
        case 'BENCH_SPLASH_DOUBLE_FLIP': {
          // Dark Raichu's Surprise Thunder. The first coin decides WHETHER the
          // bench is hit; the second decides HOW HARD. Tails on the first is
          // nothing — but the attack's own 30 to the Active still lands, which is
          // why this is a post-damage verb rather than a damage-shaping one.
          if (!this.flip(v.label || 'hit their bench?')) {
            this.log('Tails - the Bench is untouched.', 'eff');
            break;
          }
          const big = this.flip('...and how hard?');
          const n8 = big ? v.hi : v.lo;
          for (const b of you.bench) this.dealDamage(atk, b, n8, { noWR: true });
          this.log(`${n8} to each of ${you.name}'s Benched Pokemon.`, 'eff');
          break;
        }
        case 'SPLASH_NAMED': {
          // Mass Explosion's second wave. Shares `namedInPlay` with the damage
          // half above it, which is the ruling's requirement rather than a tidy:
          // count the group once, then damage that same group. See
          // Rulings/MASS-EXPLOSION.md.
          //
          // EVERY member, both sides, THE ATTACKER INCLUDED — it is one of the
          // things it names and is standing in its own blast. A Defending
          // Pokemon that is also one takes this ON TOP of the main damage, which
          // is two hits from one attack and is what the card says.
          const hit = this.namedInPlay(v.names);
          for (const sl of hit) this.dealDamage(atk, sl, v.n, { noWR: true });
          this.log(`${v.n} to each ${v.names.join('/')} in play (${hit.length}).`, 'eff');
          break;
        }
        case 'SHUFFLE_OPP_DECK':
          // Mankey's Mischief. Worth almost nothing against a bot that has no
          // memory of its own deck order, and genuinely disruptive against a
          // human who has just used Peek or Prophecy. Implemented straight.
          this.shuffle(you.deck);
          this.log(`${you.name}'s deck is shuffled.`, 'eff');
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
      const at = this.typeOf(atkSlot);          // Shift can change this mid-game
      if (wk && wk === at) {
        dmg *= this.cfg.weaknessMultiplier;
        steps.push(`Weakness: ${D.name} takes double -> ${dmg}.`);
      }
      if (rs && rs === at) {
        dmg -= this.cfg.resistanceFlat;
        steps.push(`Resistance: -${this.cfg.resistanceFlat} -> ${Math.max(0, dmg)}.`);
      }
      if (dmg < 0) dmg = 0;
    }
    if (dmg > 0) {
      for (const e of atkSlot.effects) {
        if (e.kind === 'DAMAGE_BONUS') { dmg += e.amount; steps.push(`+${e.amount} from ${e.label || 'a bonus'} -> ${dmg}.`); }
      }
      // Dark Primeape's Frenzy. Deterministic, so it lives in computeDamage and
      // the AI forecasts it for free — see ENGINE.md on why the coin-flip
      // passives deliberately do not.
      //
      // It is ALWAYS-ON in the `always: true` sense and that is not a shortcut:
      // this Power only does anything WHILE ITS POKEMON IS CONFUSED, so the
      // blanket "can't be used if Asleep, Confused or Paralyzed" gate would
      // switch it off in precisely the state it keys on. The card prints no such
      // clause. Read the card, every time.
      const fren = atkSlot.status.confused ? this.activePower(atkSlot, 'CONFUSED_BONUS') : null;
      if (fren) { dmg += (fren.n || 0); steps.push(`${fren.name}: +${fren.n} while Confused -> ${dmg}.`); }
    }
    if (dmg > 0) {
      for (const e of defSlot.effects) {
        if (e.kind === 'DAMAGE_REDUCTION') {
          // Pounce and Snivel reduce damage only from the Pokemon that used
          // them; Minimize and Defender reduce it from anything. `fromUid` is
          // what tells them apart.
          if (e.fromUid !== undefined && (!atkSlot || atkSlot.uid !== e.fromUid)) continue;
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
      // `byAttack` is what lets Final Beam answer an attack and nothing else.
      //
      // DEFAULT TRUE, AND THE DEFAULT IS THE DESIGN. Thirteen of the sixteen
      // callers here are an attack's own damage — the hit itself, every bench
      // splash, every snipe — and they are the list that grows with every set.
      // The three that are not (Retaliate, Mirror Shell, a Power that deals
      // damage) are a small closed set, so THEY declare themselves and a new
      // attack verb added in Gym is correct without anybody remembering.
      //
      // A SEPARATE FLAG FROM noRetaliate ON PURPOSE, even though the same three
      // callers pass both today. They mean different things — one is "do not
      // provoke a counter", the other is "this was not an attack" — and reusing
      // one for the other is the mistake STATUS_IMMUNE was carefully kept out of.
      defSlot.lastHitBy = { uid: atkSlot.uid, turn: this.state.turn, byAttack: !opts.notAttack };
      // HP REMAINING, not damage dealt — the same way round as the board reads.
      // It printed `dmg/hp`, so a Staryu on exactly lethal damage logged
      // "(40/40)" on the line directly above "is Knocked Out!", which reads as
      // untouched. One convention across the game; the board's is the one every
      // player is already looking at.
      this.log(`${D.name} takes ${r.dmg}. (${Math.max(0, D.hp - defSlot.dmg)}/${D.hp} left)`, 'dmg');
      this.retaliate(atkSlot, defSlot, opts);
      // Beside retaliate on purpose: both fire on damage that LANDED, and both
      // must fire before anything is Knocked Out. `noMirror` stops two Mirror
      // Shells answering each other forever.
      if (!opts.noMirror) this.mirrorShell(defSlot, r.dmg);
    }
    return { dealt: r.dmg, prevented: r.prevented };
  }

  // RETALIATE (Machamp's Strikes Back). Fires here, immediately after the damage
  // lands and before checkKOs, which is what makes it work "even if Machamp is
  // Knocked Out". Every dealDamage() call is attack damage from one Pokemon to
  // another — recoil adds to `dmg` directly and never comes through here — so
  // the only guards needed are self-damage and one level of recursion, the
  // latter for the Machamp-versus-Machamp case.
  // MIRROR SHELL. Dark Wartortle answers any attack that damages it during the
  // opponent's next turn, for the amount that landed — "even if Dark Wartortle is
  // Knocked Out". That clause is why this hangs off the same hook as retaliate()
  // rather than off checkKOs: the damage has landed but nothing has died yet.
  //
  // The reflected amount is FIXED, not recomputed — the card says "an equal
  // amount", and applying Weakness on top would make it unequal. Same reasoning
  // and same `noWR` as Machamp's Strikes Back.
  //
  // It reflects at THE DEFENDING POKEMON, which from Dark Wartortle's side of the
  // board is whoever is Active opposite it — not necessarily the slot that dealt
  // the damage, since a Bench splash can hurt it from a Pokemon that is not
  // Active. The card names the Defending Pokemon and that is what it gets.
  mirrorShell(defSlot, dealt) {
    if (!defSlot || dealt <= 0) return;
    const shell = defSlot.effects.find(e => e.kind === 'MIRROR_SHELL');
    if (!shell) return;
    const side = this.sideOf(defSlot);
    if (side === null) return;
    const target = this.state.players[1 - side].active;
    if (!target) return;
    this.log(`Mirror Shell: ${this.nameOf(defSlot)} answers for ${dealt}.`, 'eff');
    this.dealDamage(defSlot, target, dealt, { noWR: true, noRetaliate: true, noMirror: true, notAttack: true });
  }

  retaliate(atkSlot, defSlot, opts) {
    if (opts.noRetaliate || !atkSlot || atkSlot === defSlot) return;
    const p = this.powerOf(defSlot);
    if (!p || p.kind !== 'RETALIATE' || !this.powerUsable(defSlot)) return;
    this.log(`${p.name}: ${this.nameOf(defSlot)} strikes back at `
      + `${this.nameOf(atkSlot)} for ${p.dmg}.`, 'eff');
    this.dealDamage(defSlot, atkSlot, p.dmg, { noWR: true, noRetaliate: true, notAttack: true });
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
          if (s.koThisAction) s.koThisAction.push({ uid: slot.uid, pi: i });
          // ON_KO FIRES HERE, before a single card leaves the slot. Final Beam
          // counts the Energy attached to the Pokemon that just died, and four
          // lines below this one that Energy is in the discard pile. There is no
          // later place this card can work from.
          this.fireOnKO(i, slot);
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
        // BACKWARDS, and all of them. It used to take one Benched Pokemon per
        // pass and `break`; a Selfdestruct that kills three leaves three corpses
        // and they should all go before anybody counts Prizes.
        for (let k = p.bench.length - 1; k >= 0; k--) {
          if (dead(p.bench[k])) { kill(p.bench[k], true, k); any = true; }
        }
        if (!p.active && p.bench.length > 0) this.addPromote(i);
      }
    }
    // ...and only NOW does anybody win. See settleWinConditions.
    this.settleWinConditions();
  }

  // WHO HAS WON, ASKED FOR BOTH PLAYERS AT ONCE.
  //
  // This used to be three `return this.endGame(...)` lines inside the Knock Out
  // loop, which meant the FIRST player the loop happened to look at won any
  // simultaneous finish — and `for (let i = 0; i < 2; i++)` always looks at seat
  // 0 first, so seat 1 won every tie. Measured before the change: both Actives
  // dead at once with both players on their last Prize ended `winner: 1`, with
  // seat 1's Pokemon still standing because its Knock Out was never processed.
  // Seat 1 is the CPU. Destiny Bond, Strikes Back and any mutual Selfdestruct
  // could all reach it, so this was live long before Team Rocket.
  //
  // Now every Knock Out resolves first and the question is asked once. A player
  // wins by taking their last Prize or by their opponent running out of Pokemon;
  // if BOTH are true it is a DRAW, which is a real outcome in this era rather
  // than an error state.
  //
  // `winner: 'draw'` rather than null or -1, and that is not cosmetic: `winner
  // === null` is the in-progress sentinel every loop in the project tests, so a
  // draw stored as null would read as "keep playing" forever. Trevor picked the
  // word — the Game Boy game and Pocket both use it.
  settleWinConditions() {
    const s = this.state;
    if (s.phase === 'over') return;
    const wins = i => {
      const me = s.players[i], them = s.players[1 - i];
      if (me.prizes.length === 0) return `${me.name} took all Prizes`;
      if (!them.active && them.bench.length === 0) return `${them.name} has no Pokemon left`;
      return null;
    };
    const w0 = wins(0), w1 = wins(1);
    if (w0 && w1) return this.endGame('draw', `${w0}; ${w1}`);
    if (w0) return this.endGame(0, w0);
    if (w1) return this.endGame(1, w1);
  }

  // `winner` is 0, 1, or the string 'draw'. NEVER null — that is the
  // in-progress sentinel, and CLAUDE.md's list of things that have cost an hour
  // already warns that it can legitimately be 0, so every comparison here is
  // against null explicitly rather than for truthiness.
  endGame(winner, reason) {
    this.state.phase = 'over';
    this.state.winner = winner;
    this.state.winReason = reason;
    this.state.pendingPromote = null;
    this.state.promoteQueue = [];
    this.log(winner === 'draw'
      ? `GAME OVER - a draw: ${reason}`
      : `GAME OVER - ${this.state.players[winner].name} wins: ${reason}`, 'win');
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

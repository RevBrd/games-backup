// ============================================================================
// AI — expected-value play.
//
// The core idea: never judge an attack by its printed damage. Enumerate the
// coin-flip outcomes into a probability distribution, run each outcome through
// the ENGINE's own damage calculation, and score the result. That way the bot
// values Twineedle at its true average, understands that Bubblebeam's paralysis
// is worth more than 10 extra damage, and refuses to attack into a Barrier.
//
// Scoring is in abstract "points". Roughly: 1 point ~= 1 damage. A Knock Out is
// worth much more than the damage it took, because Prizes are the win condition.
// ============================================================================

const AI_WEIGHTS = {
  damage: 1.0,          // per point of expected damage dealt
  knockout: 55,         // landing a KO (on top of the damage)
  lastPrize: 240,       // KO that wins the game outright
  selfDamage: 0.8,      // per point of expected damage to self
  selfKO: 70,           // killing your own Pokemon
  benchDamageFoe: 0.7,  // splash onto their bench
  benchDamageMine: 0.9, // splash onto mine
  paralyze: 26,         // costs them a turn
  sleep: 22,            // ~50% they stay down, plus they can't attack
  confuse: 15,          // ~50% their attack fails and they self-hit
  poison: 12,           // 10/turn until they switch
  energyDiscard: 7,     // per Energy burned as an attack cost
  drag: 14,             // forcing a benched Pokemon into the Active spot
  dragKill: 40,         // ...onto something we can finish once it is up
  dragNoKill: -30,      // ...onto something we can neither kill nor silence,
                        // which is a free switch for them, not a tempo gain.
                        // Must outweigh `drag` plus the selection term above it
  healDisarm: 22,       // healing that discards the Energy its own Active needed
                        // to attack. A heal is not worth a turn of offence
  healWaste: 4.0,       // per 10 HP of healing poured past the damage. Sized so
                        // a 20-heal on a 10-damage Pokemon lands UNDER threshold
                        // rather than exactly on it — at 3.0 it scored 0.5
                        // against a 0.5 gate and still went through
  shieldSelf: 20,       // Stiffen / Withdraw / Barrier
  destinyBond: 18,      // arming Destiny Bond when death looks likely
  attachEnable: 1.0,    // scale on "how much better my attacks get"
  attachBuild: 3.5,     // finishing an attack we could not afford yet, per step
  attachAmortise: 1.0,  // progress toward one we still cannot: a step is worth
                        // this much of its share of the attack at the end.
                        // 1.0 = one of the three Energy Zapdos still needs is
                        // worth a third of Thunder. Discounted if the Pokemon
                        // will not survive to fire it
  attachOnType: 4,      // the card pays a TYPED symbol this Pokemon actually
                        // needs, not just its Colorless. Breaks the tie toward
                        // Fire-on-Arcanine over Grass-on-Arcanine
  ammoTurns: 2,         // extra shots to stock on an attack that eats its own
                        // Energy to fire. Charizard: RRRR + 2 discarded x 2 = 8
  attachSurplus: -2,    // attaching to a Pokemon that needs nothing. Negative so
                        // it falls under `threshold` and the card is HELD
  evolveHP: 0.45,       // per point of max-HP gained
  evolveBase: 16,       // evolving is good almost always
  benchDuplicate: 9,    // per copy already on the board, from the SECOND onward,
                        // when benching another of the same name. Resistance, not a cap
  evolveEarly: 8,       // per Energy short of the EVOLUTION being able to attack,
                        // beyond the first. Trevor's GBC rule; a penalty, not a veto
  benchFirst: 26,       // first spare Basic on the bench is important
  benchMore: 7,         // each additional one
  benchTooMany: 2,
  retreatBase: -6,      // the TURN a retreat spends. The Energy is charged
                        // separately, at retreatSaveEnergy — same rate the rescue
                        // credits it, because paying it and losing it are one loss
  selfSwitchGain: 0.6,  // Teleport: what the destination is worth over staying put
  dangerSwap: 22,       // ...but escaping a lethal threat is worth it — CAPS the
                        // rescue value below, so a bare Basic is never worth 22
  retreatTempo: 0.55,   // per point of printed damage the swap gives up this turn
  retreatSaveEnergy: 7, // rescue value per Energy already invested in the Active
  retreatSaveEvolved: 9,// ...plus this if it is not a Basic
  retreatNoCause: -14,  // retreating when nothing actually threatens the Active
  retreatIntoDeath: 24, // ...and swapping a survivor for one that dies on arrival
  wallRoadInDeck: 0.5,  // a Basic whose evolution is in the DECK rather than the
                        // hand is half a wall: the road is a hope and the card is
                        // standing there now. UNMEASURED first guess, and the only
                        // guess in `roadLive` - in-hand and nowhere are both facts.
                        // See AI.md, which records it as untuned rather than derived
  wallPlanFloor: 0.5,   // above this much wall-ness, the CHEAP attack is the plan
                        // and the card is not charged toward a bigger one. Chansey
                        // (0.80) and Kangaskhan (0.90) are the two cards in the live
                        // pool this holds back, and both are named as walls in
                        // Trevor's own workbook; Moltres (0.40) and Hitmonchan (0.40)
                        // are the nearest cards on the other side. Derived from that
                        // split rather than tuned - see Playbook/WALLS.md
  wallStick: 1.0,       // how much a Pokemon's "stickiness" cancels the value of
                        // rescuing it. 1.0 = a perfect wall is never worth
                        // saving for its own sake; the Prize term still applies
  retreatPrize: 60,     // value of denying a Prize, over the SQUARE of how many
                        // they still need — 1.7 at six left, 60 at one
  promoteReady: 25,     // sending up something that can attack NOW, divided by
                        // one plus how many Energy it is short — 25 ready, 12.5
                        // one away, 5 at four or more. Was a flat 25-or-nothing
  drawCard: 5,          // per card drawn
  deckBurn: 250,        // cost of spending deck, over the SQUARE of the share of
                        // what remains that the play consumes. Tuned with Trevor
                        // so the BAND runs 20 down to 10: Bill costs 2.5 points
                        // of its 10 at twenty cards left and exactly 10 — its
                        // whole value — at ten. Squaring is what makes that a
                        // band rather than a switch; this number is only how
                        // wide and how high it sits. See deckRisk()
  deckRecycle: 0.15,    // Gambler's credit for handing cards BACK, as a fraction
                        // of deckBurn. Not symmetric on purpose: at the full
                        // weight a recycle would pay more than a Knock Out
  deckLoss: 150,        // running yourself out of cards is not an expensive
                        // draw, it is losing. Same shape as lastPrize
  healPer10: 3.5,
  healRescue: 12,       // a heal that actually buys the Active another turn.
                        // Was a bare `12` at two call sites that fired on
                        // `threat >= remaining` alone — i.e. on every doomed
                        // Active, including the ones the heal could not save.
                        // Named rather than retuned: the VALUE is unchanged and
                        // the CONDITION is what moved. See `healRescues`
  stripEnergy: 11,      // per Energy removed from the opponent
  threshold: 0.5,       // don't bother with actions scoring below this
};

// Local copy: ai.js is concatenated BEFORE engine.js in the bundle, so it
// cannot rely on engine-scope helpers being defined yet.
function aiParseDamage(d) {
  if (!d) return 0;
  const m = String(d).match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// Local copy of engine.js's energyIsType, for the same reason aiParseDamage is
// local: ai.js is concatenated BEFORE engine.js in the bundle.
//
// RAINBOW ENERGY IS WHY THIS EXISTS. Its `provides` is the sentinel '*' — one
// symbol, every type at once — and six places in this file used to compare
// `provides` to a type letter directly. Every one of them would have answered
// "no, that is not a Water Energy" about a card that is, and the worst of them
// filed Rainbows as the junkiest card in hand and threw them away.
const AI_WILD = '*';
function aiEnergyIsType(db, inst, t) {
  if (!t) return true;
  const c = db[inst && inst.id !== undefined ? inst.id : inst];
  if (!c || c.kind !== 'energy') return false;
  return c.provides === AI_WILD || c.provides === t;
}

const STATUS_VALUE = { Paralyzed: 'paralyze', Asleep: 'sleep', Confused: 'confuse', Poisoned: 'poison' };

// WHICH STATUSES BUY A TURN, which is not all of them. Paralysis, Sleep and
// Confusion take the opponent's next turn away in whole or in part, so what they
// are worth depends entirely on what that turn was going to do to you. POISON IS
// NOT ONE OF THESE: it is 10 a turn whether or not they could ever attack, so it
// keeps a flat weight. Scaling it by their threat would price a real and
// unconditional clock at nothing against an opponent with no Energy.
const DENIES_A_TURN = { Paralyzed: 1, Asleep: 1, Confused: 1 };

// The format's mean attack, measured across ~64 games at 25.4 printed and 27.0
// expected — see MEASUREMENT.md. It is the divisor that lets a board-sensitive
// term reproduce the old flat weights against an average opponent, and it is not
// a coincidence that `paralyze` was already 26: a flat weight for a thing that
// depends on the board IS the average board, written down once.
const AVG_ATTACK = 26;

// ============================================================================
// WHAT A POKEMON IS FOR — "stickiness", 13 Aug 2026
// ============================================================================
// Trevor, from playtest: Kangaskhan, Chansey, Snorlax and that Electabuzz are
// meant to stand in the Active spot and soak damage until they die. The bot
// retreated them. No weight can express that, because it is not a claim about
// this position — it is a claim about what the card is.
//
// PROPOSED AS A PER-CARD TAG AND BUILT AS A DERIVATION, deliberately. A tag is
// per-card design labour on 221 cards going on 1,251, inherited by every set
// added afterwards and skipped by the first session in a hurry. Everything that
// makes those four walls is already sitting in the card data, so the tag is a
// fact we would be re-typing rather than one we would be adding.
//
// TERMINAL BASICS ONLY, which is Trevor's refinement and the load-bearing part.
// The tempting rule is "cannot evolve any further" and it is wrong: it calls
// Charizard a wall. A Stage 2 is three cards of investment and you absolutely do
// want to rescue it. A Basic with nowhere to go has no future to protect —
// retreating it spends Energy to park a damaged card on the Bench.
//
// Three signals, each already true of the card before we ask:
//   HP        the resource the Pokemon exists to spend. 50 is nothing, 100+ is
//             the whole point. Chansey's 120 is why it is playable at all.
//   RETREAT   what walking away actually costs. Snorlax's 4 is not a drawback
//             bolted on, it is the card telling you it is not going anywhere.
//   UTILITY   an attack that pays rent for standing there — drawing, stalling,
//             or locking the opponent down. Listed by VERB rather than matched
//             on text, because Tauros carries STATUS_SELF_ON_TAILS and that is
//             self-confusion, the exact opposite of a stalling tool. A regex on
//             "Confused" would have made Tauros a wall.
const STALL_VERBS = {
  DRAW: 1, DRAW_ON_FLIP: 1,                      // Kangaskhan's Fetch
  STATUS: 1, STATUS_ON_FLIP: 1, STATUS_COIN_EITHER: 1,   // Snorlax, Electabuzz, Lapras
  PREVENT_ALL_DMG_SELF_ON_FLIP: 1,               // Chansey's Scrunch
  DAMAGE_REDUCTION_SELF: 1,
  HEAL_SELF: 1, HEAL_SELF_ALL: 1, HEAL_SELF_IF_DAMAGED: 1, HEAL_SELF_ON_FLIP: 1,
  HEAL_SELF_EQUAL_DAMAGE: 1,
  // Rhyhorn's Leer — 3 Sep 2026, from Trevor watching the GBC sequel bring one
  // in "just to use Leer as long as it can and be thrown away, on purpose,
  // because the AI needed to buy time for the bench".
  //
  // IT IS HERE BECAUSE THE SCORER ALREADY AGREED AND THIS LIST DID NOT.
  // `scoreAttack` prices this verb through `flags.lockAttack` at half a
  // paralysis — the same currency `DENIES_A_TURN` is measured in — so the bot
  // knew Leer denies a turn while `wallScore` said Leer was not a stalling move
  // at all. Two lists, one idea, disagreeing.
  //
  // AND IT SITS WITH SCRUNCH, NOT WITH THE DAMAGE REDUCTIONS. The exclusion
  // below is for effects that blunt one attacker for one turn. Leer negates the
  // attack outright, which is what `PREVENT_ALL_DMG_SELF_ON_FLIP` does — both
  // are coin-gated, one-turn and self-only, and against the Pokemon actually
  // standing opposite they are the same thing.
  //
  // ON ITS OWN IT CHANGES NOTHING, and that is worth knowing before reading it
  // as a fix. Both printings carrying this verb are Basics that EVOLVE, and
  // `wallScore` gates on terminal Basics first — so Rhyhorn still scores 0.
  // See the Open section of Playbook/WALLS.md for the half that is not built.
  CANT_ATTACK_ON_FLIP: 1,
};
// STATUS_SELF and STATUS_SELF_ON_TAILS are POINTEDLY absent. So is
// DAMAGE_REDUCTION_FROM, which shields against one attacker for one turn —
// a trick, not a job.
//
// `selftest.js` asserts this list against the verbs `scoreAttack` actually
// prices as denial-or-protection, so the two cannot drift apart again silently.
// A verb belongs in one place or the other and the suite says which are missing.

const EVOLVED_NAMES = new WeakMap();   // db -> Set of names something evolves FROM
function namesWithAnEvolution(db) {
  let s = EVOLVED_NAMES.get(db);
  if (!s) {
    s = new Set();
    for (const k in db) if (db[k].evolvesFrom) s.add(db[k].evolvesFrom);
    EVOLVED_NAMES.set(db, s);
  }
  return s;
}

// THE SHAPE OF A WALL, with no question asked about evolutions — 3 Sep 2026.
//
// Split out of `wallScore` so the same three signals can be read for a Basic
// that HAS an evolution. It is still Basics only: a Stage 2 is three cards of
// investment and calling one a wall is the mistake the terminal rule was
// written to prevent, which is structural here rather than a condition anybody
// can relax. See `AI.wallHere`.
const WALL_SHAPES = new WeakMap();
function wallShape(db, effects, card) {
  if (!card || card.kind !== 'pokemon') return 0;
  let m = WALL_SHAPES.get(db);
  if (!m) { m = new Map(); WALL_SHAPES.set(db, m); }
  if (m.has(card.id)) return m.get(card.id);

  let v = 0;
  if (card.stage === 'Basic') {
    const hp = Math.min(1, Math.max(0, ((card.hp || 0) - 50) / 50));
    const ret = Math.min(1, (card.retreat || 0) / 3);
    const scripts = (effects[card.id] && effects[card.id].a) || [];
    const util = scripts.some(l => (l || []).some(x => STALL_VERBS[x.v])) ? 1 : 0;
    v = 0.5 * hp + 0.3 * ret + 0.2 * util;
  }
  m.set(card.id, v);
  return v;
}

// 0 for everything that is not a wall, up to 1 for the most immovable thing in
// the format. Memoised per db: the answer is a property of the card, and the
// evolution scan is over the whole pool.
//
// STILL THE CARD PROPERTY, AND DELIBERATELY UNCHANGED. `AI.wallHere` is the
// board-aware one and is what the scorer calls now; this is what a card is
// worth knowing nothing about the position, and `powertest.js` pins its
// terminal-only meaning. Do not merge the two — they answer different questions
// and one of them has to stay answerable without a game in progress.
function wallScore(db, effects, card) {
  if (!card || card.kind !== 'pokemon') return 0;
  if (namesWithAnEvolution(db).has(card.name)) return 0;
  return wallShape(db, effects, card);
}

class AI {
  constructor(engine, opts = {}) {
    this.E = engine;
    this.W = Object.assign({}, AI_WEIGHTS, opts.weights || {});
    this.mode = opts.mode || 'expert';
  }

  get db() { return this.E.db; }
  get eff() { return this.E.effects; }
  // Honours Transform, exactly as the engine's topCard does. Without this the
  // bot would forecast every Ditto as a 50 HP Basic with no attacks at all —
  // it would never attack with one and would badly misjudge attacking into one.
  top(slot) {
    return (slot && slot.transformedId && this.db[slot.transformedId])
      || this.db[slot.stack[slot.stack.length - 1].id];
  }
  script(slot, idx) {
    const c = this.top(slot);
    const e = this.eff[c.id];
    return (e && e.a && e.a[idx]) || [];
  }
  remainingHP(slot) { return this.top(slot).hp - slot.dmg; }

  // ==========================================================================
  // OVER-ATTACH: printed damage is a FUNCTION of the Energy on the slot
  // ==========================================================================
  //
  // `aiParseDamage` reads the leading number off a printed damage string, and for
  // eleven cards in the live pool that number is not what the attack does. Water
  // Gun prints "10+" and a Lapras on three Water deals 30; Big Eggsplosion prints
  // "20x" and an Exeggutor on four Energy averages 40. **The bot read 10 and 20.**
  //
  // That is not the Active/Bench currency problem in AI.md's open item 1 — this
  // is the RAW DAMAGE currency being wrong about itself, and it is fixable
  // without making expected value computable off the Active slot. The two are
  // deliberately separate; closing this one leaves that one exactly where it was.
  //
  // WHAT IT COST. `potentialOf` prices a benched slot in printed damage, so an
  // attachment that grows one of these attacks moved `best` from 10 to 10 and the
  // surplus rule in `attachBuild` refused it at `attachSurplus`. Measured on a
  // Lapras holding one Water with a Water Energy in hand: **Active +23.04,
  // benched -2.00.** The Over-Attach notes are mostly about the BENCH — Omanyte
  // "prefers to stay on the bench", Mysterious Fossil's "preferred spot is the
  // bench, where it's Over-Attached", Charmeleon "prefers to sit on the bench and
  // pre-Over-Attach" — so the family was refused exactly where it lives.
  //
  // DERIVED FROM THE VERB, not from a list of cards, and only the two verbs whose
  // damage moves when you attach: the other scaling verbs read the bench count,
  // the damage counters or a coin, and no attachment changes any of them.
  slotPrintedDamage(slot, card, idx) {
    const atk = ((card || this.top(slot)).attacks || [])[idx];
    if (!atk) return 0;
    const e = this.eff[(card || this.top(slot)).id];
    const script = (e && e.a && e.a[idx]) || [];
    let base = aiParseDamage(atk.dmg);
    for (const v of script) {
      if (v.v === 'DMG_PER_SPARE_ENERGY') base = this.spareEnergyDamage(slot, atk, v);
      // Big Eggsplosion and Continuous Fireball: a coin per Energy attached, so
      // the honest printed-currency number is the mean rather than the print.
      else if (v.v === 'DMG_PER_ENERGY_HEADS') base = v.per * slot.energy.length / 2;
    }
    return base;
  }

  // THE ENGINE'S ARITHMETIC, AND NOW LITERALLY THE ENGINE'S — it has drifted
  // twice, in opposite directions, and an assertion that two copies agree was
  // not enough either time.
  //
  //   `maxSpare` went into the engine in Job 6 and never into the scorer, so the
  //   bot valued a Lapras on five Water at 50 where both the card and the engine
  //   say 30. Eleven weeks, invisible.
  //
  //   Then the shared arithmetic itself turned out to be wrong — a Water paying a
  //   Colorless symbol was never counted as used — which no agreement test could
  //   ever have seen, because both copies were wrong the same way.
  //
  // So `spareEnergyFor` lives in `engine.js` and this calls it. Instance methods
  // resolve at call time, so the concatenation order that forces `aiParseDamage`
  // and `aiEnergyIsType` to be local copies does not apply here — the same reason
  // `potentialOf` already asks `E.slotSymbols`. **Do not re-inline it.**
  //
  // `maxSpare` stays on this side because it is a scoring-visible cap the engine
  // applies at its own call site; the two are asserted equal by `powertest.js`.
  spareEnergyDamage(slot, atk, v) {
    let spare = this.E.spareEnergyFor(slot, atk, v.t);
    if (v.maxSpare !== undefined) spare = Math.min(spare, v.maxSpare);
    return (v.base || 0) + v.per * spare;
  }

  // ============================================================================
  // YOUR DECK IS A RESOURCE AND RUNNING OUT OF IT LOSES — 16 Aug 2026
  // ============================================================================
  //
  // Until now `deck.length` reached the scorer in exactly ONE place: Wildfire,
  // which prices the OPPONENT decking out as a weapon. So the bot understood
  // running you out of cards as a way to win and had no concept at all of doing
  // it to itself. Every draw was flat `drawCard` per card — Bill, Fetch, Pay
  // Day, Gambler, and Professor Oak at up to 35 points — none of them looking
  // at what was left.
  //
  // Measured over 648 games on the 18 ladder decks: **17.7% of them end in a
  // deck-out**, 20.5% of all voluntary draws happen with under 20 cards left,
  // and 45 times the side that then lost had burned cards with fewer than five
  // remaining. (The four theme decks say 6.3%, which is the unrepresentative-
  // pool trap in MEASUREMENT.md — do not measure this on them.)
  //
  // TWO TERMS, and they are different in kind. That distinction is the recoil
  // work's lesson reused: `selfKO` could never be made big enough to express
  // "and then the game ends", so the game-ending branch got its own term.
  //
  //   deckBurn  a cost, on the SQUARE of the share of what remains that this
  //             play consumes. Deliberately a curve and not a floor at 20 —
  //             a floor is the cliff shape that has now bitten six times, and
  //             it would make 21-vs-19 cards a personality change.
  //   deckLoss  terminal. If the play empties the deck, you cannot draw on your
  //             next turn and you have simply lost.
  //
  // `burn` is SIGNED. Gambler shuffles the hand back in before drawing, so it
  // is deck-POSITIVE on any hand bigger than about five — it is the only
  // recycling card in the game, and the one you actually want when short.
  deckRisk(pi, burn) {
    const W = this.W;   // per-instance, so `opts.weights` overrides still apply
    const left = this.E.state.players[pi].deck.length;
    if (burn <= 0) {
      // Deck-positive: worth something, and worth more the shorter you are.
      // Scaled by `deckRecycle` rather than sharing `deckBurn` outright — the
      // two were one number until 16 Aug, and widening the burn band to Trevor's
      // 20-to-10 range would have quietly made recycling pay 55 points, more
      // than a Knock Out. **A constant doing two jobs gets retuned for one.**
      return left >= 25 ? 0 : (-burn) * W.deckBurn * W.deckRecycle / Math.max(4, left);
    }
    if (left - burn <= 0) return -W.deckLoss;
    const frac = burn / left;
    return -W.deckBurn * frac * frac;
  }

  // WHAT ONE CARD IS WORTH HAVING, extracted from handKeepValue on 19 Aug 2026
  // so the Prize picker could reuse it instead of growing a second opinion.
  // Trevor's rule, 16 Aug: evolutions you can use, Energy you are short of, and
  // Trainers are all real cards; the same card with nothing to attach to is not.
  cardKeepValue(pi, inst, inPlay) {
    const E = this.E, me = E.state.players[pi];
    const c = this.db[inst.id];
    if (!c) return 0;
    if (c.kind === 'energy') {
      return inPlay.some(sl => this.potential(pi, sl).short > 0) ? 4 : 1;
    }
    if (c.kind === 'pokemon' && c.evolvesFrom) {
      return inPlay.some(sl => this.top(sl).name === c.evolvesFrom) ? 9 : 1.5;
    }
    if (c.kind === 'pokemon') return me.bench.length < 3 ? 4 : 1.5;
    return 2.5;   // a Trainer. Playable ones are worth more, but scoring every
                  // one of them here would recurse into this scorer.
  }

  // What a card in hand is actually worth keeping, for the two cards that throw
  // a hand away. Trevor's rule, 16 Aug: don't pitch evolutions you can use,
  // Energy you are short of, or a Trainer worth playing — but get a desperation
  // boost when the hand holds none of what you need.
  handKeepValue(pi, excludeUid) {
    const E = this.E, me = E.state.players[pi];
    const inPlay = E.allSlots(pi);
    let v = 0;
    for (const inst of me.hand) {
      if (inst.uid === excludeUid) continue;
      v += this.cardKeepValue(pi, inst, inPlay);
    }
    return v;
  }

  // Am I starved of the things a turn is actually made of? Drives the
  // desperation boost on Oak and Gambler.
  handStarved(pi) {
    const E = this.E, me = E.state.players[pi];
    const inPlay = E.allSlots(pi);
    const hasEnergy = me.hand.some(x => (this.db[x.id] || {}).kind === 'energy');
    const wantsEnergy = inPlay.some(sl => this.potential(pi, sl).short > 0);
    const hasBasic = me.hand.some(x => {
      const c = this.db[x.id] || {};
      return c.kind === 'pokemon' && !c.evolvesFrom;
    });
    let n = 0;
    if (wantsEnergy && !hasEnergy) n++;
    if (me.bench.length <= 1 && !hasBasic) n++;
    return n;
  }

  // ---------------------------------------------------------------- forecast
  // Enumerate coin-flip outcomes for an attack into a probability distribution.
  // Returns raw (pre-Weakness) damage outcomes plus effect probabilities.
  rawOutcomes(atkSlot, defSlot, idx, vopts) {
    const c = this.top(atkSlot);
    const empty = { outcomes: [{ p: 1, dmg: 0 }], statuses: {}, selfDmg: 0, selfWorst: 0, pSelfWorst: 0, energyCost: 0, flags: {} };
    let atk = (c.attacks || [])[idx];
    if (!atk) return { outcomes: [], statuses: {}, selfDmg: 0, selfWorst: 0, pSelfWorst: 0, energyCost: 0, flags: {} };
    let script = this.script(atkSlot, idx);

    // Metronome and Mirror Move resolve to something OTHER than their own
    // printed line, which is blank on both. Forecasting them literally scores
    // them at zero forever — the card works and the bot never picks it, which
    // is exactly how Energy Burn hid a bug earlier in this job.
    if (script.some(v => v.v === 'METRONOME')) {
      const ci = vopts && vopts.copyIdx;
      if (ci === undefined || !defSlot) return empty;
      const dc = this.top(defSlot);
      const copied = (dc.attacks || [])[ci];
      if (!copied) return empty;
      atk = copied;
      // Copied attacks skip their costs, so the cost verbs must not be forecast.
      script = ((this.eff[dc.id] && this.eff[dc.id].a && this.eff[dc.id].a[ci]) || [])
        .filter(v => v.v.indexOf('COST_') !== 0);
    }
    if (script.some(v => v.v === 'MIRROR_MOVE')) {
      const rec = atkSlot.lastAttackResult;
      if (!rec || rec.turn < this.E.state.turn - 1) return empty;
      const st = {};
      for (const x of (rec.statuses || [])) st[x] = 1;
      // A recorded final result is already past Weakness and Resistance.
      return { outcomes: [{ p: 1, dmg: rec.damage || 0 }], statuses: st,
               selfDmg: 0, selfWorst: 0, pSelfWorst: 0, energyCost: 0, flags: { flat: true } };
    }

    let base = aiParseDamage(atk.dmg);
    let outcomes = [{ p: 1, dmg: base }];
    const statuses = {};
    const flags = {};
    let selfDmg = 0, energyCost = 0;
    const discardTypes = [];        // [n, type] per COST_DISCARD_ENERGY, for discardSilence
    // WORST-CASE self-damage and how often it happens, alongside the expected
    // figure. An average hides the branch that ends the game: 10 recoil on a
    // coin is "5 expected", and 5 never killed anybody.
    let selfWorst = 0, pSelfWorst = 1;

    const split = (fn) => {
      const next = [];
      for (const o of outcomes) for (const [p2, d2] of fn(o.dmg)) next.push({ p: o.p * p2, dmg: d2 });
      outcomes = next;
    };

    for (const v of script) {
      switch (v.v) {
        case 'COST_DISCARD_ENERGY': energyCost += v.n; discardTypes.push([v.n, v.t]); break;
        case 'FLIP_OR_NOTHING':
          split(() => [[0.5, 0], [0.5, base]]);
          flags.halfWhiff = true;
          break;
        case 'DMG_PER_HEAD': {
          const n = v.coins, dist = [];
          for (let h = 0; h <= n; h++) {
            let ways = 1;
            for (let k = 0; k < h; k++) ways = ways * (n - k) / (k + 1);
            dist.push([ways / Math.pow(2, n), v.per * h]);
          }
          split(() => dist);
          break;
        }
        // `base` was DROPPED here and read one line below — Job 13, found while
        // pricing Arcanine's Flames of Rage. The engine has supported an optional
        // base on this verb since Dodrio (`base + per * counters`, engine.js), and
        // this scorer multiplied and never added, so the bot has been undervaluing
        // four live cards by a flat amount forever: Dodrio and Cubone's Rage and
        // Dark Flareon's by 10, Tauros's Rampage by 20.
        //
        // Textbook silent failure, and the shape is worth recognising: TWO
        // implementations of one verb, in two modules, with nothing asserting they
        // agree. Nothing could see it. The attack is legal, it deals full damage
        // when used, and every suite is green — the bot simply declines to reach
        // for it and no counter anywhere goes up. The sibling verb directly below
        // reads `v.base` correctly, which is what made the omission visible at all.
        case 'DMG_PER_COUNTER_SELF':
          split(() => [[1, (v.base || 0) + v.per * Math.floor(atkSlot.dmg / 10)]]); break;
        case 'DMG_MINUS_PER_COUNTER_SELF':
          split(() => [[1, Math.max(0, v.base - v.per * Math.floor(atkSlot.dmg / 10))]]); break;
        case 'DMG_PER_DEF_ENERGY':
          split(() => [[1, v.base + v.per * (defSlot ? defSlot.energy.length : 0)]]); break;
        case 'DMG_PER_DEF_COUNTER':
          split(() => [[1, v.base + v.per * (defSlot ? Math.floor(defSlot.dmg / 10) : 0)]]); break;
        // `s` may be a list — Venom Powder lands Confused AND Poisoned on one coin.
        case 'STATUS': for (const st of [].concat(v.s)) statuses[st] = 1; break;
        case 'STATUS_ON_FLIP': for (const st of [].concat(v.s)) statuses[st] = 0.5; break;
        case 'RECOIL': selfDmg += v.n; selfWorst += v.n; break;
        case 'RECOIL_ON_FLIP': selfDmg += v.n * 0.5; selfWorst += v.n; pSelfWorst *= 0.5; break;
        // `side` WAS DROPPED HERE — Job 13. The verb has taken a side since Team
        // Rocket (Poison Vapor hits THEIRS only, the Selfdestruct family hits
        // both) and this scorer read only the number, so Dark Arbok was charged
        // for wrecking a Bench it never touches. Both printings, on a live
        // bracket. Same shape as the `base` that went missing from
        // DMG_PER_COUNTER_SELF: one verb, two implementations, nothing asserting
        // they agree.
        case 'BENCH_SPLASH':
          flags.benchSplash = v.n;
          flags.benchSplashSide = v.side || 'both';
          break;
        case 'SWITCH_DEFENDER_CHOOSE': flags.drag = true; break;
        case 'PREVENT_ALL_DMG_SELF_ON_FLIP': flags.shield = 0.5; break;
        case 'BARRIER': flags.shield = 1; break;
        case 'HARDEN': flags.harden = v.threshold; break;
        case 'DESTINY_BOND': flags.destinyBond = true; break;
        case 'JAM_DEFENDER': flags.jam = true; break;
        case 'HEAL_SELF_ALL': flags.healAll = true; break;
        case 'HEAL_SELF': flags.heal = v.n; break;
        case 'HEAL_SELF_IF_DAMAGED': flags.heal = v.n; break;
        case 'ONCE_WHILE_IN_PLAY': flags.oncePerStay = true; break;

        // Everything below scored as plain base damage until 10 Aug 2026. See
        // ENGINE.md, "The silent-failure surface", and the coverage check in
        // selftest.js that now refuses to let a verb land here unnoticed.
        case 'COST_DISCARD_ALL_ENERGY':
          // Thunderbolt. The bot thought this was free and fired it on sight.
          // The flag matters as much as the count: emptying the slot is a
          // different event from spending two of six, and `discardSilence` reads
          // it rather than re-deriving which cards would have gone.
          energyCost += atkSlot.energy.length; flags.discardAll = true; break;
        case 'DMG_PER_SPARE_ENERGY':
          // The Water Gun / Hydro Pump family. `spareEnergyDamage` IS the
          // engine's arithmetic and is shared with `slotPrintedDamage` — this
          // case used to re-implement it and had missed `maxSpare` since Job 6.
          split(() => [[1, this.spareEnergyDamage(atkSlot, atk, v)]]);
          break;
        case 'DMG_HALF_REMAINING':
          // Super Fang prints no damage number, so the bot valued it at zero.
          split(() => [[1, defSlot ? Math.ceil(this.remainingHP(defSlot) / 2 / 10) * 10 : 0]]);
          break;
        case 'FLIP_BONUS_OR_RECOIL':
          // `nothingOnTails` is Fly: the tails branch pays NO damage at all rather
          // than the base, so the split is against 0. Everything else this verb
          // can carry rides the same 50%, because it is the same coin.
          split(() => v.nothingOnTails
            ? [[0.5, v.base + v.bonus], [0.5, 0]]
            : [[0.5, v.base + v.bonus], [0.5, v.base]]);
          selfDmg += v.recoil * 0.5; selfWorst += v.recoil; pSelfWorst *= 0.5;
          if (v.barrierOnHeads) flags.shield = 0.5;
          if (v.benchSplashOnHeads) {
            flags.benchSplash = v.benchSplashOnHeads.n * 0.5;
            flags.benchSplashSide = v.benchSplashOnHeads.side || 'both';
          }
          if (v.snipeOnHeads) flags.snipe = { n: 1, dmg: v.snipeOnHeads.dmg * 0.5 };
          break;
        case 'STATUS_COIN_EITHER':
          statuses[v.heads] = 0.5; statuses[v.tails] = 0.5; break;
        case 'TOXIC':
          // Poison at v.n per turn rather than the usual 10, so scale the weight
          // rather than treating it as ordinary Poison.
          statuses.Poisoned = Math.max(1, v.n / 10); break;
        case 'DISCARD_DEF_ENERGY': flags.stripEnergy = 1; break;
        case 'BENCH_SPLASH_OWN': flags.benchSplashOwn = v.n; break;
        case 'ATTACK_LOCK': flags.attackLock = true; break;
        case 'BARRIER_ON_FLIP': flags.shield = 0.5; break;
        case 'WHIRLWIND': flags.dragWeak = true; break;

        // ---- Job 6d ----
        case 'NO_WR': flags.flat = true; break;      // forecast past W/R, as the card says
        case 'DMG_PER_OWN_BENCH': {
          const side = this.E.sideOf(atkSlot);
          const nb = side === null ? 0 : this.E.state.players[side].bench.length;
          split(() => [[1, v.base + v.per * nb]]);
          break;
        }
        case 'DMG_PER_NAMED_IN_PLAY': {
          const side2 = this.E.sideOf(atkSlot);
          let n5 = 0;
          if (side2 !== null) for (const sl of this.E.allSlots(side2)) if (this.top(sl).name === v.name) n5++;
          split(() => [[1, v.base + v.per * n5]]);
          break;
        }
        case 'HEAL_SELF_EQUAL_DAMAGE': flags.leech = v.half ? 0.5 : 1; break;
        case 'STATUS_SELF': flags.selfStatus = 1; break;
        case 'STATUS_SELF_ON_TAILS': flags.selfStatus = 0.5; break;
        case 'DRAW': flags.draw = v.n; break;
        case 'DRAW_ON_FLIP': flags.draw = 0.5; break;
        // `target: 'any'` lets the snipe hit the Active too, so it is strictly
        // more valuable than the Bench-only form — it can finish something the
        // main damage could not, and it ignores Weakness, Resistance and any
        // reduction. Passed through rather than folded in, because the scorer
        // that reads `snipe` needs to know which targets were available.
        case 'BENCH_SNIPE': flags.snipe = { n: v.n || 1, dmg: v.dmg, any: v.target === 'any' }; break;
        // Slowpoke's Afternoon Nap. An attack that does no damage at all and
        // fetches an Energy onto the attacker instead — so if this is not scored
        // it is an attack worth literally nothing and the bot will never use it,
        // which is the silent failure this whole surface is about.
        case 'SEARCH_ENERGY_TO_SELF': flags.selfCharge = v.t || null; break;

        // ---- Job 6d, second batch ----
        case 'DMG_PER_HEAD_UNTIL_TAILS': {
          // Geometric: p(k heads) = 0.5^(k+1). Enumerated to 6 with the tail
          // lumped in, which is ~1.5% of the mass and keeps pLethal honest
          // rather than collapsing the whole thing to its mean.
          const dist = [];
          let acc = 0;
          for (let k = 0; k <= 6; k++) { const pk = Math.pow(0.5, k + 1); acc += pk; dist.push([pk, v.per * k]); }
          dist.push([1 - acc, v.per * 7]);
          split(() => dist);
          break;
        }
        case 'DMG_PER_ENERGY_HEADS': {
          const n = atkSlot.energy.length, dist = [];
          for (let h = 0; h <= n; h++) {
            let ways = 1;
            for (let k = 0; k < h; k++) ways = ways * (n - k) / (k + 1);
            dist.push([ways / Math.pow(2, n), v.per * h]);
          }
          split(() => (n ? dist : [[1, 0]]));
          break;
        }
        case 'WHIRLWIND_ON_FLIP': flags.dragWeak = 0.5; break;
        case 'DAMAGE_REDUCTION_SELF': flags.softShield = v.n; break;
        case 'DAMAGE_REDUCTION_FROM': flags.softShield = v.n; break;
        case 'CANT_ATTACK_ON_FLIP': flags.lockAttack = 0.5; break;
        case 'CANT_RETREAT_ON_FLIP': flags.lockRetreat = 0.5; break;
        case 'BENCH_SPLASH_FLIP_SIDE': flags.splashEither = v.n; break;
        case 'BENCH_SPLASH_PER_FLIP': flags.splashPerFlip = v; break;
        case 'BENCH_SPLASH_TYPED': flags.splashTyped = v.n; break;
        case 'SWITCH_SELF_CHOOSE': flags.selfSwitch = v.optional ? 'may' : true; break;
        case 'NO_TRAINERS_NEXT_TURN': flags.lockTrainers = true; break;
        case 'BUFF_OWN_ATTACK': flags.buff = v; break;

        // ---- Job 6d, third batch ----
        // Mass Explosion's second wave hits OUR side too, including the attacker.
        // Scored as a cost rather than a benefit, because the damage half is
        // already counted as damage and this part is what it costs us.
        // UNTUNED: the 0.6 is a guess at how much of a full hit our own board
        // taking 20 is worth against theirs taking it.
        case 'SPLASH_NAMED': flags.splashNamed = { names: v.names, n: v.n }; break;
        // Fling and Vanish. Removing their Active outright is close to a Knock
        // Out in effect without the Prize — it undoes every Energy on it — so it
        // is scored as a drag plus what they had invested. Vanish points the
        // same verb at ourselves and is scored as a COST for the same reason.
        // UNTUNED: the 0.7 and the self-side sign are judgement, not measurement.
        case 'SHUFFLE_INTO_DECK': flags.shuffleAway = v.target || 'defender'; break;
        case 'DMG_PER_OPP_BENCH_TAILS': flags.benchTails = v.per; break;
        case 'BENCH_SPLASH_DOUBLE_FLIP': flags.snipe = { n: 99, dmg: (v.hi + v.lo) / 4 }; break;
        // Mirror Shell is a deterrent rather than damage — it is worth the most
        // when the bot expects to be hit hard and least when nothing threatens.
        // UNTUNED: priced off incoming threat, which is the closest existing
        // measure, at a guessed fraction.
        case 'MIRROR_SHELL': flags.mirror = true; break;
        case 'SWITCH_DEFENDER_FIRST': flags.dragFirst = true; break;
        case 'SCATTER_OWN_ENERGY': flags.scatter = true; break;
        case 'MOVE_DEF_ENERGY_TO_BENCH': flags.stripToBench = true; break;
        // ---- Job 13, the coin batch ----
        // Miraculous Comeback. Both halves come off ONE roll of N coins, so the
        // expectation is exact and symmetric: half the coins land, half do not.
        // Enumerating N+1 outcomes would be honest too but tells the scorer
        // nothing it does not already get from the mean at these sizes.
        case 'DMG_PER_HEAD_IN_PLAY': {
          // rawOutcomes works from SLOTS and has no `pi` or `E` in scope — the
          // side comes off the attacker, the way DMG_PER_OWN_BENCH already does it.
          const mcSide = this.E.sideOf(atkSlot);
          const inPlay = this.E.allSlots(mcSide).length + this.E.allSlots(1 - mcSide).length;
          split(() => [[1, v.per * inPlay / 2]]);
          selfDmg += v.per * inPlay / 2; selfWorst += v.per * inPlay; pSelfWorst *= 0.5;
          break;
        }
        // Tempt. Half a Gust of Wind, and Trevor prices it below one: "only
        // useful in the same pattern as Ninetales' Lure, except it relies on a
        // coin flip and should be treated with even less value because of that."
        case 'SWITCH_DEFENDER_CHOOSE_ON_FLIP': flags.drag = 0.5; break;
        // Hyper Flame. Heads burns one, tails empties the slot — so the EXPECTED
        // discard is halfway between, and `discardAll` is not set because half
        // the time it is not an emptying at all. discardSilence reads this.
        case 'DISCARD_ENERGY_COIN':
          flags.energyDiscard = (flags.energyDiscard || 0) + 1;
          flags.discardCoin = v;
          break;
        // Birthday Surprise. Scored at its floor on all but one day of the year,
        // which is correct rather than pessimistic — and the engine, not the
        // scorer, decides which day it is.
        case 'BIRTHDAY': split(() => [[1, v.base]]); break;
        // ---- Job 13, the promo batch ----
        case 'ENERGY_FROM_DISCARD_TO_SELF': flags.absorb = v.n; break;
        case 'DAMAGE_HALVE_SELF': flags.halveSelf = true; break;
        case 'DEVOLVE_CHOOSE': flags.devolve = true; break;
        // Trevor: "Energy Control should only be used when Telekinesis can't, and
        // should not be intentionally used as a stalling move." So it is priced as
        // Magnetic Lines is and no higher — half an Energy discard, on a coin —
        // which leaves the three-Energy attack winning whenever it is affordable.
        case 'MOVE_OPP_ENERGY_ON_FLIP': flags.stripToBench = 0.5; break;
        case 'CAT_PUNCH': flags.catPunch = v.dmg; break;
        case 'OPTIONAL_DISCARD_THEN_SNIPE': flags.snipe = { n: 1, dmg: v.dmg }; break;
        case 'SEARCH_BASIC_TO_BENCH': flags.callFamily = true; break;
        // Rapid Evolution. Priced on the HP SWING it buys rather than as a flat
        // bonus, because that is what the attack actually is: a 30 HP Magikarp
        // becomes a 100 HP Gyarados for no Energy and no card from hand, and the
        // gap is the whole value. Computed at scoring time from what is really
        // in the deck, so it is worth nothing when neither target is there.
        case 'EVOLVE_SELF_FROM_DECK': flags.evolveFromDeck = v.names || [v.name]; break;
        case 'HEAL_SELF_ON_FLIP': flags.heal = (flags.heal || 0) + (v.n || 1) * 0.5; break;
        case 'ENERGY_FROM_DISCARD': flags.recover = v.n; break;
        case 'TRAINER_FROM_DISCARD': flags.recover = (flags.recover || 0) + 1; break;
        case 'RETURN_DEFENDER_TO_HAND': flags.bounce = true; break;
        case 'REARRANGE_TOP': flags.peek = v.n; break;
        case 'WILDFIRE': flags.wildfire = true; break;
        // Legality gate, like REQUIRE_DEF_STATUS: the engine never offers the
        // attack when it would be illegal, so there is nothing to price.
        case 'REQUIRE_SELF_DAMAGED': break;
      }
    }
    // FLIP_OR_NOTHING suppresses the whole attack, statuses included.
    if (flags.halfWhiff) for (const k in statuses) statuses[k] *= 0.5;
    return { outcomes, statuses, selfDmg, selfWorst, pSelfWorst: selfWorst ? pSelfWorst : 0,
             energyCost, discardTypes, flags };
  }

  // Run each raw outcome through the engine's own damage maths.
  forecast(pi, idx, vopts) {
    const E = this.E;
    const me = E.state.players[pi], you = E.state.players[1 - pi];
    const atkSlot = me.active, defSlot = you.active;
    if (!atkSlot || !defSlot) return null;
    const raw = this.rawOutcomes(atkSlot, defSlot, idx, vopts);
    const hpLeft = this.remainingHP(defSlot);
    // TWO damage numbers, because overkill is worth nothing and everything else
    // here needs the real one.
    //
    //   expDmg     what the attack actually does. What "turns it lethal" and
    //              the leech and Transparency checks all have to read.
    //   expUseful  the same, with each outcome capped at what is left to kill.
    //              There is no trample in this game: 80 into a Pokemon with 40
    //              HP left removes 40 and wastes 40.
    //
    // Capped PER OUTCOME rather than on the mean, which is not the same number
    // for anything that flips a coin — an attack that does 0 or 80 against 40 HP
    // averages 40 raw and 20 useful, and the mean of the capped values is the
    // one that is true.
    let expDmg = 0, expUseful = 0, pLethal = 0, pStopped = 0;
    for (const o of raw.outcomes) {
      const r = E.computeDamage(atkSlot, defSlot, o.dmg, { noWR: !!raw.flags.flat });
      expDmg += o.p * r.dmg;
      expUseful += o.p * Math.min(r.dmg, hpLeft);
      if (r.dmg >= hpLeft) pLethal += o.p;
      // How often the DEFENDER stops it outright, which as of 16 Aug 2026 is
      // also how often the attack's recoil is waived. Same test the engine uses.
      if (r.prevented || (o.dmg > 0 && r.dmg === 0)) pStopped += o.p;
    }
    // Kabuto Armor and Invisible Wall need nothing here — they live inside
    // computeDamage, which is the whole reason the bot can never predict a
    // number the engine would not actually produce.
    //
    // Haunter's Transparency does, because its coin is deliberately NOT in
    // computeDamage (that function is pure). Half the time the attack does
    // nothing at all, so halve both the damage and the odds of the Knock Out.
    if (E.activePower(defSlot, 'FLIP_TO_NEGATE')) {
      expDmg *= 0.5; expUseful *= 0.5; pLethal *= 0.5;
      pStopped += 0.5 * (1 - pStopped);        // the coin stops it half the time on top
    }

    const blocked = E.effectsBlocked(defSlot);
    // Snorlax cannot be given a CONDITION — but it can still be Smokescreened,
    // dragged, and stripped of Energy, so this is its own flag rather than
    // reusing `blocked`, which suppresses all of those too.
    const statusProof = !!E.activePower(defSlot, 'STATUS_IMMUNE');
    return { expDmg, expUseful, pLethal, pStopped, hpLeft, blocked, statusProof, ...raw };
  }

  // ------------------------------------------------------------ attack score
  scoreAttack(pi, idx, vopts) {
    const W = this.W, E = this.E;
    const f = this.forecast(pi, idx, vopts);
    if (!f) return -Infinity;
    const me = E.state.players[pi], you = E.state.players[1 - pi];
    const atkSlot = me.active;

    // USEFUL damage, not printed damage. Two attacks that both kill are worth
    // the same for killing, so the choice between them is their COST — which is
    // how Take Down stopped beating Flamethrower by a tenth of a point while
    // eating 30 recoil to overkill something already dead.
    let s = f.expUseful * W.damage;
    if (f.pLethal > 0) {
      // A Knock Out ends the game two different ways and the bot could see
      // NEITHER of them. Both were found from one of Trevor's games, where it
      // held a lethal attack against his last Pokemon and spent the turn on a
      // Super Potion instead.
      //
      // 1. Taking your last Prize. This read `you.prizes` — the OPPONENT's pile
      //    — which is inverted. Verified against the engine: the player who
      //    scores a KO draws from their OWN pile and wins when it empties
      //    (engine.js checkKOs, `opp.prizes.shift()` then `endGame(1 - pi)`).
      //    So the bonus was firing when the opponent was about to win, and
      //    never when we were. The defensive checks elsewhere — Buzzap, and the
      //    Prize term in retreat — genuinely do mean `you`, and are untouched.
      // 2. Emptying their board. Knocking out their only Pokemon wins on the
      //    spot whatever the Prize count says, and nothing in the AI knew this
      //    win condition existed at all.
      const takesLastPrize = me.prizes.length <= 1;
      const emptiesTheirBoard = you.bench.length === 0;
      s += f.pLethal * ((takesLastPrize || emptiesTheirBoard) ? W.lastPrize : W.knockout);

      // Job 10c. KILLING A DARK GYARADOS COSTS SOMETHING, and until this was
      // written nothing in the forecast could say so — every term here prices
      // what an attack DOES and none of them priced what the corpse does back.
      //
      // Final Beam is a coin for 20 per Water attached, aimed at whatever
      // finished it. So a fully charged one is 80 on a coin, which is enough to
      // change which Pokemon should throw the punch — and the bot was walking
      // its own Charizard into it for free.
      //
      // Priced as expected damage, and separately as the risk of losing the
      // attacker outright, because those are not the same decision: 40 on
      // something healthy is a scratch, and 40 on something at 40 is a Prize.
      const dyingPower = you.active && this.E.powerOf(you.active);
      if (dyingPower && dyingPower.kind === 'ON_KO' && f.pLethal > 0
          && this.E.powerUsable(you.active)) {
        for (const v of (dyingPower.do || [])) {
          if (!(v.v === 'P_REVENGE')) continue;
          const fuel = you.active.energy.filter(e => aiEnergyIsType(this.db, e, v.t)).length;
          let back = v.per * fuel;
          if (v.wr) {
            const mine = this.top(atkSlot);
            if (mine.wkType && this.top(you.active).type === mine.wkType) back *= 2;
          }
          const exp = 0.5 * f.pLethal * back;                 // the coin, and the kill
          s -= Math.min(exp, this.remainingHP(atkSlot)) * W.selfDamage;
          if (back >= this.remainingHP(atkSlot)) s -= 0.5 * f.pLethal * W.selfKO;
        }
      }
    }

    // status conditions - suppressed entirely if they're behind a Barrier
    //
    // A RIDER IS WORTH NOTHING ON A POKEMON THE ATTACK REMOVES — 22 Aug 2026.
    // Paralysing a corpse buys no turn: the Knocked Out Pokemon leaves and a
    // fresh one comes up unafflicted. This was worth a flat 13 on Gyarados, so
    // it took Bubblebeam (293) over an equally lethal Dragon Rage (280) and paid
    // an extra Water for a coin flip that could not land on anything.
    //
    // `survives` is the same per-outcome discipline `expUseful` uses, not an
    // on/off switch: at pLethal 0.5 the status only matters in the half of the
    // distribution where they are still standing, so it is worth half.
    //
    // THE GUARD ALREADY EXISTED ONE FLAG OVER and was never generalised —
    // `f.flags.bounce` has carried `pLethal < 0.9` since it was written. Every
    // rider in this block is a claim about a Pokemon that has to survive to be
    // affected by it, so they all take the same discount. Poison, Confusion and
    // an Energy strip are all worthless on something already leaving the board.
    const survives = 1 - f.pLethal;

    // WHAT THEIR NEXT TURN WOULD DO TO US, and it has two consumers: the status
    // block immediately below and the barrier further down. Declared once, here,
    // because Trevor's whole point is that those are one idea.
    const danger = this.incomingThreat(pi);
    const hpLeft = this.remainingHP(atkSlot);
    const denied = Math.min(danger, hpLeft);

    // A TURN TAKEN AWAY IS WORTH THE ATTACK IT DENIES — 22 Aug 2026, Trevor's
    // call, and this is the other caller of `denied` above.
    //
    // `paralyze: 26` was a flat number for a thing that is entirely about the
    // board: paralysing a Chansey that cannot reach an attack buys nothing, and
    // paralysing a charged Charizard buys 100. THE OLD CONSTANT WAS THE AVERAGE
    // BOARD STANDING IN FOR THE REAL ONE — and not loosely. This file measures
    // the format's mean attack at 25.4 raw and 27.0 expected, so 26 is that mean
    // almost exactly. Dividing by it makes the term read the board while
    // reproducing every old value at an average opponent, which is the same
    // discipline the barrier fix used one block up.
    //
    // POISON IS POINTEDLY EXCLUDED and that is the whole reason this is a table
    // and not a blanket multiply. Poison is damage over time, not a turn taken
    // away — it ticks whether or not they were ever going to attack, so scaling
    // it by their threat would price a real, unconditional 10 a turn at zero
    // against an opponent with no Energy. `poison` keeps its flat weight.
    //
    // NO SHARE-OF-A-TURN TABLE, because the weights are already one. Paralyze 26,
    // sleep 22, confuse 15 is 1 : 0.85 : 0.58 — which is exactly how much of a
    // turn each takes away, priced when they were written. A second table would
    // have applied that ratio twice. So this scales all three by the same board
    // factor and the relative pricing between them is untouched.
    const turnScale = denied / AVG_ATTACK;

    if (!f.blocked) {
      if (!f.statusProof) for (const st in f.statuses) {
        const key = STATUS_VALUE[st];
        if (!key) continue;
        s += f.statuses[st] * W[key] * survives * (DENIES_A_TURN[st] ? turnScale : 1)
             * this.statusNovelty(st, you.active);
      }
      // Jam is Confusion by another name, so it reads the same board.
      if (f.flags.jam) s += W.confuse * survives * 0.5 * turnScale;
      // Scaled the way `dragWeak` directly below already is, so Tempt's
      // coin-gated drag is worth half of Gust of Wind's certain one. Existing
      // callers pass `true` and are unchanged.
      // PRICED ON WHO COMES UP, not on the fact that somebody does — the same
      // ranking Gust of Wind has always used, through `bestDragTarget`. A flat
      // `W.drag` said a Rattata and a fully charged Charizard were equally good
      // things to pull into the Active spot.
      if (f.flags.drag && you.bench.length) {
        const d = this.bestDragTarget(pi);
        s += this.dragScore(d) * (f.flags.drag === true ? 1 : f.flags.drag);
      }
      // Whirlwind drags too, but THEY choose, so they send up their best answer.
      if (f.flags.dragWeak && you.bench.length) s += W.drag * 0.5 * (f.flags.dragWeak === true ? 1 : f.flags.dragWeak);
      // Amnesia. Shuts off one attack rather than making them flip for all of
      // them, so it is worth somewhat less than a jam.
      if (f.flags.attackLock) s += W.confuse * 0.6 * survives;
      if (f.flags.stripEnergy && you.active && you.active.energy.length) s += W.stripEnergy * survives;
    }
    // DRAG IS DELIBERATELY NOT DISCOUNTED and it is the one exception in the
    // block above. Every other rider needs the defender alive to land on. A drag
    // acts on the BENCH, and if the attack is lethal the promote happens anyway
    // — the difference is who picks, which is worth exactly as much either way.

    // self-harm
    //
    // RECOIL IS PRICED ON HOW CLOSE IT LEAVES YOU, NOT ON ITS SIZE — 13 Aug
    // 2026, from a match log of Trevor's. This was a flat charge with a cliff at
    // the very end: 30 recoil cost the same 24 points whether Arcanine was
    // untouched or already at 60 damage, and only the blow that killed outright
    // paid `selfKO`.
    //
    // What the log showed. Ken's Arcanine, 60 damage on a 100 HP body, chose
    // Take Down (56) over Flamethrower (43) for 30 extra damage that killed
    // nothing, and finished the turn at 90 — one hit from handing over a Prize
    // it did not need to give. It had done the same thing four turns earlier.
    // The two Take Downs in that game that DID knock something out were both
    // correct, because Flamethrower's 50 could not have reached either target;
    // the fault is entirely in the ones that killed nothing.
    //
    // So the cost of recoil is not the HP. It is the share of what remains, and
    // therefore how much closer the NEXT hit is to a Prize. Squared, for the
    // same reason `retreatPrize` is: a tenth of your remaining HP is nothing and
    // three quarters of it is nearly the whole cost of the Pokemon.
    //
    // It MEETS the old cliff rather than replacing it — at `frac` of 1 the term
    // is exactly `selfKO`, which is what a lethal recoil always cost. Every
    // decision the old rule got right is unchanged; only the slope below it is
    // new.
    //
    // RECOIL IS WAIVED WHEN THE DEFENDER STOPS THE DAMAGE — 16 Aug 2026, settled
    // with Trevor and implemented in the engine. The bot has to know, or it goes
    // on refusing Take Down into a Scrunched Chansey for a cost it will not pay.
    // Charged at the odds the recoil actually lands rather than as an on/off
    // switch, because Transparency is a coin and this must not become the fifth
    // flat-with-a-cliff in this file.
    const lands = 1 - (f.pStopped || 0);
    const recoil = f.selfDmg * lands;
    if (recoil > 0) {
      s -= recoil * W.selfDamage;
      const left = Math.max(1, this.remainingHP(atkSlot));
      const frac = Math.min(1, recoil / left);
      s -= W.selfKO * frac * frac;
    }

    // DON'T LOSE THE GAME EITHER — 16 Aug 2026, the exact mirror of the "win the
    // game if you can win the game" rule in `choose`, and found the same way: a
    // match Trevor lost the other way round.
    //
    // Log 06-53-35, final turn. Electabuzz on 10 HP took Thunderpunch, which is
    // a coin: heads a bonus, tails 30 and 10 recoil. It Knocked Arcanine out —
    // and the recoil killed Electabuzz, handed Trevor his last Prize, and lost
    // the game on the turn it scored. The bot rated it 73.5 against a safe
    // Thundershock at 33.
    //
    // AN AVERAGE HID IT. `selfDmg` for that attack is "5 expected", and 5 never
    // killed anybody — the branch that ends the game is invisible the moment it
    // is folded into a mean. So the WORST case is carried alongside, with the
    // odds of reaching it, and priced at `lastPrize` rather than `selfKO`
    // whenever that death is the one that ends the match. Losing is not a big
    // Knock Out; it is a different kind of thing, and `selfKO` at 70 could never
    // outweigh a Knock Out worth 55 plus the damage.
    //
    // Note which pile is which, because the same inversion has bitten twice in
    // this file: when OUR Pokemon dies the OPPONENT draws from THEIR OWN pile,
    // so the pile to read is `you.prizes`.
    const worst = (f.selfWorst || 0) * lands;
    if (worst > 0 && worst >= this.remainingHP(atkSlot)) {
      const givesTheirLastPrize = you.prizes.length <= 1;
      const leavesUsEmpty = me.bench.length === 0;
      if (givesTheirLastPrize || leavesUsEmpty) s -= (f.pSelfWorst || 1) * W.lastPrize;
    }
    // A DISCARD COSTS TURNS OF SILENCE, NOT CARDS. Flat at `energyCost * 7`
    // until 23 Aug 2026, which charged Charizard the same rate for ammunition it
    // would replace as it charged Zapdos for emptying itself to nothing.
    // *[Both halves of the rule, and whose they are →](discardSilence)*
    if (f.energyCost > 0) {
      const silence = this.discardSilence(pi, atkSlot, f);
      s -= W.energyDiscard * silence * silence * this.survivesCharge(pi, atkSlot, silence);
    }

    // bench splash cuts both ways
    if (f.flags.benchSplash) {
      const n = f.flags.benchSplash;
      for (const b of you.bench) {
        s += Math.min(n, this.remainingHP(b)) * W.benchDamageFoe;
        if (this.remainingHP(b) <= n) s += W.knockout * 0.6;
      }
      // Only when the splash actually reaches our own side. Poison Vapor does
      // not, and pretending otherwise made a one-sided attack look like a trade.
      for (const b of (f.flags.benchSplashSide === 'theirs' ? [] : me.bench)) {
        s -= Math.min(n, this.remainingHP(b)) * W.benchDamageMine;
        if (this.remainingHP(b) <= n) s -= W.selfKO * 0.6;
      }
    }

    // Earthquake hits ONLY our own bench — pure downside, and the bot used to
    // see none of it.
    if (f.flags.benchSplashOwn) {
      const n = f.flags.benchSplashOwn;
      for (const b of me.bench) {
        s -= Math.min(n, this.remainingHP(b)) * W.benchDamageMine;
        if (this.remainingHP(b) <= n) s -= W.selfKO * 0.6;
      }
    }

    // defensive plays are worth more the more danger we're in.
    // `danger`, `hpLeft` and `denied` are declared at the top of this function
    // rather than here, because the STATUS block above is the other half of the
    // same idea and needs them first. Moving them back down breaks it loudly.
    const frail = danger >= hpLeft;
    // A BARRIER IS WORTH WHAT IT PREVENTS — 22 Aug 2026, cliff instance seven.
    // This was flat at 0.7 below the frail line, so Agility scored an identical
    // 27.00 on Fearow against an incoming 0, an incoming 30 and an incoming 60.
    // A shield that stops nothing was priced the same as one stopping most of
    // the card. Trevor named it from play, on Agility, Rapidash and Seadra.
    //
    // LINEAR, NOT SQUARED, and that is a departure from the recoil fix the cliff
    // table will point you at. Recoil squares because a cost should fall away
    // faster than its size; here the benefit really is proportional — preventing
    // 30 is exactly half as good as preventing 60. Squaring it would invent a
    // shape the game does not have.
    //
    // 1.4 is chosen so the curve passes through the OLD constant at half HP:
    // 1.4 * 0.5 = 0.7. Every board where the flat value was about right is
    // unchanged, and only the two ends move. The frail multiplier is untouched,
    // so nothing above the line changes at all.
    // ONE QUANTITY FOR BOTH HALVES OF A BOUGHT TURN — 22 Aug 2026, and the fact
    // that it is shared is the point rather than an economy. Trevor: Agility is
    // the same shape as Ice Beam, because instead of inflicting paralysis it has
    // a coin flip that prevents all damage. One buys the turn by taking theirs
    // away, the other by making it not matter. They were priced through
    // unrelated paths with no relationship between them, which is why the family
    // behaved inconsistently — see the status block below for the other caller.
    const shieldFrac = hpLeft > 0 ? denied / hpLeft : 0;
    // A BARRIER THAT PREVENTS YOUR DEATH IS PRICED AS A DEATH — 22 Aug 2026, and
    // it is the same fault as the Energy that was priced twice in one function.
    // `selfKO` charges **70** for a Pokemon the bot kills with its own recoil,
    // while preventing exactly that outcome credited `0.5 * 20 * 1.6` = 16. One
    // event, two prices, and the cheap one was the defensive side — so Fearow
    // took Drill Peck's 40 over an Agility that was its only out at 36, on a
    // board where the incoming attack kills it. Trevor named it: *Agility unless
    // Drill Peck can kill.*
    //
    // TWO TERMS BECAUSE THERE ARE TWO THINGS BEING PREVENTED, and they have
    // different shapes. Damage prevented is **linear** — stopping 30 is half as
    // good as stopping 60. The Knock Out is **squared**, because it is a risk
    // rather than a quantity: at half your HP their attack is not close to
    // killing you and the term should be nearly gone, which is the same argument
    // recoil settled. Cliff table in AI.md, and note the two entries disagree on
    // the curve on purpose.
    //
    // THE `frail` STEP IS GONE. It was a boolean standing in for the top of this
    // curve, and now that the curve reaches the top on its own it would only
    // reintroduce a discontinuity. `frail` is still computed for destinyBond.
    if (f.flags.shield) {
      s += f.flags.shield * (1.4 * shieldFrac * W.shieldSelf + shieldFrac * shieldFrac * W.selfKO);
    }
    // HARDEN'S THRESHOLD IS NOT A CLIFF AND MUST NOT BE GRADED. Harden absorbs
    // an attack of N or less and does nothing at all against N+1, so the step is
    // in the card rather than in the model. Checked while fixing the line above.
    if (f.flags.harden) s += W.shieldSelf * (danger <= f.flags.harden ? 1.2 : 0.3);
    if (f.flags.destinyBond) s += frail ? W.destinyBond * 1.8 : W.destinyBond * 0.3;
    if (f.flags.healAll) s += Math.min(atkSlot.dmg, this.top(atkSlot).hp) / 10 * W.healPer10;
    if (f.flags.heal) s += Math.min(f.flags.heal * 10, atkSlot.dmg) / 10 * W.healPer10;
    // Leech Life and friends heal from the damage actually dealt, so it is worth
    // nothing on an undamaged attacker and nothing against a Barrier.
    if (f.flags.leech) s += Math.min(f.expDmg * f.flags.leech, atkSlot.dmg) / 10 * W.healPer10;
    // Fetch and Pay Day draw off the same deck everything else does. Trevor's
    // note names them alongside Bill for exactly this reason.
    if (f.flags.draw) s += f.flags.draw * W.drawCard + this.deckRisk(pi, f.flags.draw);
    // Confusing or poisoning yourself is a real cost, priced as the mirror of
    // doing it to them.
    if (f.flags.selfStatus) s -= f.flags.selfStatus * W.confuse * 0.8;
    // Worth an attachment, and an attachment out of the DECK rather than out of
    // hand — it does not spend the turn's one attachment, so it is strictly
    // extra. Priced off attachValue's own currency, discounted because it takes
    // the whole turn's attack to do it.
    //
    // UNMEASURED, and it has the shape the tally in this file keeps catching:
    // it is worth the most when the attacker is short of exactly this type and
    // nothing when it is already paid up, so it is scaled by the shortfall
    // rather than being a flat number.
    if (f.flags.selfCharge !== undefined && f.flags.selfCharge !== null) {
      const t = f.flags.selfCharge;
      const has = atkSlot.energy.filter(e => aiEnergyIsType(this.db, e, t)).length;
      const wants = Math.max(0, ...(this.top(atkSlot).attacks || [])
        .map(at => String(at.cost || '').split('').filter(ch => ch === t).length));
      const short = Math.max(0, wants - has);
      // The DECK, not the board — and Afternoon Nap searches for an Energy
      // CARD, so a Rainbow does not qualify there. isBasicEnergyOf's `inPlay`
      // half, expressed the only way this file can express it.
      const inDeck = me.deck.some(x => {
        const c = this.db[x.id];
        return c && c.kind === 'energy' && c.cls === 'Basic' && c.provides === t;
      });
      // attachBuild is the per-step weight for finishing an attack you cannot
      // yet afford, which is exactly what this fetch is doing — and it is a real
      // weight rather than the W.attachBase I first wrote, which does not exist.
      // undefined arithmetic would have made the whole attack score NaN in
      // silence, which is the same class of failure as an unscored verb and is
      // why every new term should be checked against the W block rather than
      // against memory.
      if (inDeck) s += (short > 0 ? W.attachBuild * short : W.attachBuild * 0.25);
    }

    if (f.flags.snipe) {
      const { n, dmg } = f.flags.snipe;
      for (const b of you.bench.slice(0, n)) {
        s += Math.min(dmg, this.remainingHP(b)) * W.benchDamageFoe;
        if (this.remainingHP(b) <= dmg) s += W.knockout * 0.6;
      }
    }

    // ---- Job 6d, second batch ----
    // Blizzard is a coin on WHOSE bench takes it, so it is worth the average of
    // a good outcome and a bad one rather than either.
    if (f.flags.splashEither) {
      const n = f.flags.splashEither;
      for (const b of you.bench) s += 0.5 * Math.min(n, this.remainingHP(b)) * W.benchDamageFoe;
      for (const b of me.bench) s -= 0.5 * Math.min(n, this.remainingHP(b)) * W.benchDamageMine;
    }
    if (f.flags.splashPerFlip) {
      const { dmg, selfPerTail } = f.flags.splashPerFlip;
      for (const b of you.bench) {
        s += 0.5 * Math.min(dmg, this.remainingHP(b)) * W.benchDamageFoe;
        if (this.remainingHP(b) <= dmg) s += 0.5 * W.knockout * 0.6;
      }
      // Half the bench comes back at us on average, and it can be lethal.
      const expSelf = 0.5 * selfPerTail * you.bench.length;
      s -= expSelf * W.selfDamage;
      if (atkSlot.dmg + expSelf >= this.top(atkSlot).hp) s -= W.selfKO * 0.5;
    }
    if (f.flags.splashTyped && you.active) {
      const t = this.top(you.active).type;
      if (t && t !== 'C') {
        const n = f.flags.splashTyped;
        for (const b of you.bench) if (this.top(b).type === t) s += Math.min(n, this.remainingHP(b)) * W.benchDamageFoe;
        for (const b of me.bench) if (this.top(b).type === t) s -= Math.min(n, this.remainingHP(b)) * W.benchDamageMine;
      }
    }
    // A flat reduction is a weaker shield than preventing everything, and worth
    // more the harder we are about to be hit.
    if (f.flags.softShield) s += Math.min(f.flags.softShield, danger) / 20 * W.shieldSelf;
    // Stopping them attacking at all is close to Paralysis in effect.
    if (f.flags.lockAttack) s += f.flags.lockAttack * W.paralyze * 0.9;
    if (f.flags.lockRetreat) s += f.flags.lockRetreat * W.drag * 0.4;
    if (f.flags.lockTrainers) s += W.drawCard;
    // TELEPORT IS ONLY WORTH WHERE IT GOES. This was `frail ? dangerSwap : 2`
    // — a flat number that never looked at the Bench — and Trevor's log
    // 04-37-10 is what it does: Exeggutor Teleported on four consecutive turns,
    // each time scoring an identical 22, once swapping itself for a second
    // Exeggutor in the same condition. Nothing changed and a turn was spent.
    //
    // Worse, the bot was not choosing the destination AT ALL. `SWITCH_SELF_CHOOSE`
    // falls back to `this.pick(me.bench.length)` — a seeded random — when the
    // action carries no `opts.bench`, and nothing in this file had ever written
    // one. That is the same shape as the triggered-Power gap in AI.md: a choice
    // the bot is owed, quietly handed to the engine.
    //
    // `promoteValue` is the answer to "what is sending this one up worth" and is
    // already the shared home for three other callers including "who does a
    // Switch bring in". This is the fourth. Measured as a DIFFERENCE against
    // staying put, so an even swap is worth nothing without needing a rule that
    // says so — and it already prices dying, which is why `frail` is gone from
    // here rather than added to it.
    if (f.flags.selfSwitch && me.bench.length) {
      const sw = this.bestSelfSwitch(pi);
      // A `may` switch can be declined, so its downside is never paid.
      s += sw ? (f.flags.selfSwitch === 'may' ? Math.max(0, sw.gain) : sw.gain) * W.selfSwitchGain : 0;
    }
    // Swords Dance only pays off if we are still here next turn to use it.
    if (f.flags.buff) s += frail ? 4 : (f.flags.buff.base || 0) * 0.35;

    // ---- Job 6d, third batch ----
    // A free Basic onto the Bench is worth roughly what benching one from hand
    // is, and much more when the Bench is nearly empty.
    if (f.flags.callFamily) s += me.bench.length === 0 ? W.benchFirst : W.benchMore;

    // Dragging first is the Gust half of a Gust-plus-attack, so it is worth what
    // reaching past the wall is worth. UNTUNED: reuses the drag weight directly.
    if (f.flags.dragFirst && you.bench.length) s += W.drag;
    if (f.flags.mirror) s += this.incomingThreat(pi) * 0.4;
    // Magnetic Lines moves ONE basic Energy off their Active. Strictly weaker
    // than discarding it — they keep the card — so priced under energyDiscard.
    if (f.flags.stripToBench && you.active && you.bench.length) s += W.energyDiscard * 0.5;
    // ---- Job 13, the promo batch -------------------------------------------

    // Mewtwo's Energy Absorption. Trevor's note is a conditional, not a value:
    // "Does not want to fight if there is insufficient energy in the discard pile
    // and doesn't have enough energy for Psyburn on its own." So the term is
    // gated on what is ACTUALLY in the discard pile and is worth nothing when it
    // is empty — the attack becomes a wasted turn there, and the old failure mode
    // for a verb like this is scoring the intent rather than the outcome.
    if (f.flags.absorb) {
      const inDiscard = me.discard.filter(x => {
        const c = this.db[x.id];
        return c && c.kind === 'energy';
      }).length;
      const gets = Math.min(f.flags.absorb, inDiscard);
      if (gets > 0) {
        // Worth what it saves: each Energy is a turn of attaching that no longer
        // has to happen, priced with the same weight the deck-search fetch uses.
        const short = this.shortfallFor(atkSlot, this.top(atkSlot));
        s += Math.min(gets, Math.max(1, short)) * W.attachBuild;
      }
    }

    // Light Screen. `softShield` prices a FLAT reduction and this one is
    // proportional, so it is valued where `danger` is known rather than at flag
    // time: halving denies half of whatever is coming, rounded down to 10 the way
    // the engine rounds it. Against an opponent that cannot hurt you it denies
    // nothing and correctly scores nothing — no cliff at either end.
    if (f.flags.halveSelf) {
      const denies = Math.floor(danger / 2 / 10) * 10;
      s += Math.min(denies, danger) / 20 * W.shieldSelf;
    }

    // Mew's Devolution Beam, and Trevor's note is the whole rule: "only when the
    // HP reduction from the de-evolved opponent would result in its death.
    // Otherwise, the opponent can just re-evolve it again."
    //
    // So this is scored as a KNOCK OUT when the damage already on the target
    // meets the devolved card's HP, and as nearly nothing otherwise. Checked
    // against every evolved Pokemon they have rather than just the Active, since
    // the attack may be aimed anywhere.
    if (f.flags.devolve) {
      let best = 0;
      for (const sl of E.allSlots(1 - pi)) {
        if (sl.stack.length < 2) continue;
        const under = this.db[sl.stack[sl.stack.length - 2].id];
        if (!under) continue;
        // The engine caps damage at the new HP, so "would result in its death" is
        // damage already taken reaching what the smaller card can hold.
        if (sl.dmg >= under.hp) best = Math.max(best, W.knockout);
        else best = Math.max(best, W.stripEnergy * 0.3);   // a tempo nuisance, no more
      }
      s += best;
    }

    // Meowth's Cat Punch. Trevor: "50/50 chance to force the opponent to choose
    // which pokemon to damage on the bench. Our bot should probably weight that
    // slightly below getting to pick its own pokemon to damage."
    //
    // Half the time it is ordinary damage to the Active. The other half it is a
    // Bench hit THEY aim, which is strictly worse than a snipe the attacker aims
    // — they will feed it whatever they care least about — so the Bench half is
    // priced against their CHEAPEST Pokemon rather than their best, and then
    // discounted again. With no Bench, tails does nothing at all and that half is
    // worth zero rather than being quietly averaged away.
    if (f.flags.catPunch) {
      const dmg = f.flags.catPunch;
      if (you.active) s += 0.5 * Math.min(dmg, this.remainingHP(you.active)) * W.damage;
      if (you.active && this.remainingHP(you.active) <= dmg) s += 0.5 * W.knockout;
      if (you.bench.length) {
        const worst = Math.min(...you.bench.map(b => this.remainingHP(b)));
        s += 0.5 * Math.min(dmg, worst) * W.benchDamageFoe * 0.6;
      }
    }
    // Energy Bomb empties the attacker to seed the Bench. Good when the Bench
    // wants it, an outright loss when there is no Bench and it all burns.
    if (f.flags.scatter && me.active) {
      s += me.bench.length ? me.active.energy.length * 2 : -me.active.energy.length * W.retreatSaveEnergy;
    }

    if (f.flags.shuffleAway === 'defender' && you.active) {
      s += W.drag + you.active.energy.length * W.energyDiscard * 0.7;
    } else if (f.flags.shuffleAway === 'self' && me.active) {
      // Vanish throws away our own board position and every Energy on it. It is
      // an escape, so it is worth something when the Active is doomed and a real
      // cost otherwise — priced off what we would lose, same as the retreat rule.
      s -= me.active.energy.length * W.retreatSaveEnergy * 0.7;
    }
    // The opponent flips, and TAILS is what hurts them, so a wide bench is worth
    // attacking into rather than away from. Already inside the damage forecast
    // via base damage; nothing extra to add beyond noting it is scored.
    if (f.flags.benchTails) s += 0;

    // What the blast costs US. Counting only our own side is the point: the
    // damage it does to theirs is already priced by the damage half of the
    // attack, and counting it twice would make a self-destructive card look
    // better the more it hurts us.
    if (f.flags.splashNamed) {
      const mine = E.allSlots(pi).filter(sl =>
        f.flags.splashNamed.names.indexOf(this.top(sl).name) >= 0);
      s -= mine.length * f.flags.splashNamed.n * 0.6;
    }

    // EVOLVING OFF THE DECK, priced as the HP it gains plus the damage it will
    // then be able to deal. Worth nothing if the deck holds neither target — and
    // that check is the load-bearing half, because Magikarp's other attack is a
    // 10-damage Flop and the bot would otherwise pick a no-op over it forever.
    //
    // UNTUNED, AND SAID SO HERE ON PURPOSE. The HP term is a guess: I know the
    // sign and the rough scale, not the weight. It is the first thing to look at
    // if Trevor reports Magikarp doing something odd, and the honest place to
    // write that down is beside the number rather than in a list somebody has to
    // find. See the grab-bag policy in AI.md.
    if (f.flags.evolveFromDeck && me.active) {
      const here = this.top(me.active).name;
      const found = E.state.players[pi].deck.filter(x => {
        const c2 = this.db[x.id];
        return c2 && c2.kind === 'pokemon' && f.flags.evolveFromDeck.indexOf(c2.name) >= 0
            && c2.evolvesFrom === here;
      });
      if (found.length) {
        const best = found.reduce((m, x) => Math.max(m, this.db[x.id].hp || 0), 0);
        const gain = Math.max(0, best - (this.top(me.active).hp || 0));
        s += gain * 0.35;
      }
    }
    if (f.flags.recover) s += f.flags.recover * W.drawCard * 0.8;
    // Hurricane undoes an entire investment — every Energy on it goes back to
    // hand with it — so it scales with what they have committed, and is worth
    // nothing at all if the hit would Knock the target Out anyway.
    if (f.flags.bounce && you.active && f.pLethal < 0.9) {
      s += W.drag + you.active.energy.length * W.energyDiscard * 0.5;
    }
    if (f.flags.peek) s += f.flags.peek * 1.5;
    // Wildfire trades our Energy for their deck. Worth real points only when
    // they are close to decking out, and a cost the rest of the time.
    if (f.flags.wildfire) {
      const fire = atkSlot.energy.filter(e => {
        const c2 = this.db[e.id]; return aiEnergyIsType(this.db, e, 'R');
      }).length;
      s += you.deck.length <= 12 ? fire * 9 : -fire * W.energyDiscard * 0.4;
    }

    // don't burn a once-per-stay attack on a whiff-heavy turn for nothing
    if (f.flags.oncePerStay && f.expDmg <= 0 && !Object.keys(f.statuses).length) s -= 10;

    // ATTACKING WHILE CONFUSED IS A COIN FLIP THE BOT COULD NOT SEE — 16 Aug
    // 2026, from Trevor watching a Confused Kangaskhan use Fetch on three
    // separate turns to draw one card, and hit itself for 30 doing it.
    //
    // Nothing in this scorer knew Confusion existed. The retreat rule learned it
    // on 13 Aug and the attack path never did, which is the same omission twice
    // in the same engine — worth a look at any other decision that reads
    // `status` for one branch and not the others.
    //
    // Half the time the whole attack simply does not happen AND the attacker
    // takes 30, so the honest value is half of what it is worth against half of
    // what it costs. That is why it lands on Fetch and not on a real attack: a
    // 5-point draw goes deeply negative and the bot passes instead, while a
    // 60-point swing halves to 30 and is still plainly worth taking. Trevor's
    // note is exactly that — "it risks damage for little reward".
    if (atkSlot.status.confused) {
      const left = Math.max(1, this.remainingHP(atkSlot));
      const frac = Math.min(1, 30 / left);
      const tails = -(30 * W.selfDamage) - W.selfKO * frac * frac;
      s = 0.5 * s + 0.5 * tails;
    }

    return s;
  }

  // Biggest single hit the opponent's Active could land on ours right now.
  incomingThreat(pi) {
    return this.threatAgainst(pi, this.E.state.players[pi].active);
  }

  // The same question asked about a Pokemon that is NOT our Active — "how hard
  // would they hit this one if I sent it up?". `incomingThreat` could not ask it,
  // which is why `promote` had no idea it was feeding a 40 HP Voltorb to an
  // Arcanine that had just dealt 80.
  threatAgainst(pi, mySlot) {
    const E = this.E;
    const you = E.state.players[1 - pi];
    if (!you.active || !mySlot) return 0;
    let worst = 0;
    const c = this.top(you.active);
    (c.attacks || []).forEach((a, i) => {
      if (!E.costSatisfied(you.active, a.cost)) return;
      const raw = this.rawOutcomes(you.active, mySlot, i);
      for (const o of raw.outcomes) {
        const r = E.computeDamage(you.active, mySlot, o.dmg);
        if (r.dmg > worst) worst = r.dmg;
      }
    });
    return worst;
  }

  // WHAT SENDING THIS ONE UP IS WORTH. One home, shared by the three places that
  // ask it — promoting after a Knock Out, being Whirlwinded up, and choosing who
  // a Switch brings in.
  //
  // IT USED TO BE THREE NEARLY-IDENTICAL FORMULAS, and they disagreed. From
  // Trevor's log 04-22-45: the bot promoted Voltorb over Zapdos after a Knock
  // Out, then spent a Switch on its very next turn undoing it. Both decisions
  // were defensible on their own scorer, which is the whole problem — a promote
  // that the next turn immediately reverses cost a card, a turn, and any belief
  // the player had that the opponent knew what it was doing.
  //
  // Two things it now knows that none of the three did:
  //
  // READY IS A COUNTDOWN, NOT A SWITCH. `short === 0 ? 25 : 0` charged the same
  // nothing for one Energy short as for four, so "which of these can actually
  // fight soonest" was a question the bot could not ask — which is Trevor's
  // other note on promotion, from a different game. This is the fourth time in
  // this file a quantity that should fall away with distance from an edge turned
  // out to be written flat with a cliff at the end. Suspect it on sight.
  //
  // SURVIVING THE TURN, priced exactly as the retreat rule prices it, because it
  // is the same bill read from the other side: what dies with the Pokemon is the
  // Energy invested in it, and conceding the Prize is the larger half and scales
  // with how few they still need. Reusing that arithmetic rather than inventing
  // a second one is the point — the two decisions were inconsistent, and one
  // formula cannot disagree with itself. It also keeps the sacrificial promote,
  // which is real play: a bare Basic with nothing on it is CHEAP to feed, and
  // falls out of `invested` being zero instead of needing a rule.
  // WHICH FACE-UP PRIZE TO TAKE, and it exists for one narrow case: Here Comes
  // Team Rocket! has made every Prize visible to BOTH players, so choosing well
  // is no longer private knowledge and a bot picking at random would be playing
  // badly on purpose. Everywhere else the bot takes one at RANDOM on purpose —
  // it reads full engine state, so letting it choose from a face-DOWN pile would
  // hand it Peek's entire value for free, every game, which is the same
  // self-restriction as scoring PEEK at -Infinity. Trevor's call, 19 Aug 2026.
  //
  // It reuses cardKeepValue rather than having an opinion of its own, so the
  // Prize picker cannot drift from what the bot thinks a card is worth
  // everywhere else. Ties fall to the first: the pile is already in an order
  // nobody chose.
  prizeIndex(pi) {
    const me = this.E.state.players[pi];
    if (!me.prizes.length) return 0;
    const inPlay = this.E.allSlots(pi);
    let best = 0, bestV = -Infinity;
    me.prizes.forEach((inst, i) => {
      const v = this.cardKeepValue(pi, inst, inPlay);
      if (v > bestV) { bestV = v; best = i; }
    });
    return best;
  }

  promoteValue(pi, b) {
    const W = this.W, E = this.E;
    const you = E.state.players[1 - pi];
    const pot = this.potential(pi, b, null);
    const hp = this.remainingHP(b);
    let s = hp * 0.35
          + W.promoteReady / (1 + Math.min(pot.short, 4))
          + Math.max(0, pot.best) * 0.2;
    if (this.threatAgainst(pi, b) >= hp) {
      const invested = b.energy.length * W.retreatSaveEnergy
        + (this.top(b).stage !== 'Basic' ? W.retreatSaveEvolved : 0);
      const left = Math.max(1, you.prizes.length);
      s -= Math.min(W.dangerSwap, invested) + W.retreatPrize / (left * left);
    }
    return s;
  }

  // WHERE A SELF-SWITCH SHOULD GO, and what the move is worth over staying.
  // One function so the score and the chosen destination cannot disagree: both
  // `scoreAttack` and the attack case in `scoreAction` call it on the same
  // state, so the bench index that gets written into `opts` is the one the
  // score was computed from.
  // HOW MANY MORE ENERGY BEFORE THIS CARD COULD ATTACK, if it were sitting on
  // this slot. Split out of `potential`'s inner loop, which computes the same
  // thing for the card already on top — this one takes the card as an argument,
  // which is what lets `evolve` ask about a form that is not in play yet.
  //
  // Symbols, not cards: `slotSymbols` resolves Double Colorless to two pips and
  // honours per-instance `asEnergy`, so a Buzzap'd Electrode and an Energy Burn
  // Charizard are both priced correctly here for free.
  shortfallFor(slot, card) {
    const pool = [];
    this.E.slotSymbols(slot).forEach(x => pool.push(x));
    let least = 99;
    for (const a of (card.attacks || [])) {
      const need = a.cost.split('').filter(x => x !== 'C');
      const generic = a.cost.length - need.length;
      const used = new Array(pool.length).fill(false);
      let short = 0;
      for (const t of need) {
        const k = pool.findIndex((x, j) => !used[j] && x === t);
        if (k === -1) short++; else used[k] = true;
      }
      const spare = pool.filter((x, j) => !used[j]).length;
      if (spare < generic) short += generic - spare;
      if (short < least) least = short;
    }
    return least;
  }

  // HOW MANY SYMBOLS THIS POKEMON CAN STILL USEFULLY HOLD, when its own attack
  // EATS Energy to fire. Charizard's Fire Spin costs RRRR and discards two cards
  // every time it is used, so a fifth Fire is not surplus — it is the second
  // shot. You may attach one Energy a turn and Fire Spin spends two, so a
  // Charizard that is not pre-loaded fires once and then stands there.
  //
  // Trevor's account of the deck, 21 Aug 2026, and it is the whole strategy:
  // "evolve on the bench and pre-load it with as much energy as you can beyond
  // the 4 energy limit... try your best to pre-load it enough to last."
  //
  // DERIVED FROM THE EFFECT SCRIPT, not from a list of cards — `COST_DISCARD_ENERGY`
  // is a DSL verb and every card that carries it gets this for free. Returns 0
  // for everything else, so the surplus rule is untouched for the other 1,200.
  //
  // `COST_DISCARD_ALL_ENERGY` is deliberately NOT counted. Wildfire discards any
  // number and mills that many, so "how much is useful" is unbounded and a
  // headroom figure would be a guess dressed as a derivation.
  // TWO CONDITIONS, AND THE VERB ALONE WAS THE WRONG GENERALISATION — 28 Aug
  // 2026, Trevor. This rule was written from Charizard and generalised by the
  // presence of `COST_DISCARD_ENERGY`, which is a derivation and was still too
  // wide: it told the bot to stock Arcanine GP to SIX Fire (cost 2 + 2 x
  // ammoTurns) for a 40-damage attack, and Trevor's account is that past two
  // "additional ones better serve the bench". Both conditions below are things
  // the card says about itself, so this is still a derivation and not a list.
  //
  // 1. THE BURN MUST ACTUALLY OUTPACE THE ATTACHMENT. You may attach one Energy
  //    a turn. An attack burning ONE is rate-neutral — it replaces itself every
  //    turn forever, so there are no "extra rounds" to stock up for, and the
  //    23 Aug table's Flamethrower row is that fact stated per card. Only a burn
  //    of two or more falls behind. Swept: of nineteen discard-to-fire attacks
  //    in the live pool, fourteen burn one, three burn everything (excluded
  //    below and priced by `discardSilence` instead), and exactly TWO burn two.
  //
  // 2. THE CARD MUST HAVE NOTHING ELSE TO SHOOT WITH. Ammunition buys rounds,
  //    and rounds are only worth stockpiling if running out means standing there.
  //    Fire Spin is Charizard's ONLY attack, so an empty Charizard is mute and
  //    every spare Fire is a turn it gets to act. Arcanine GP keeps Quick Attack
  //    at CC and burns nothing to fire it, so it is never mute and a spare Fire
  //    buys it a bigger attack rather than a turn.
  //
  //    THIS IS THE SAME DISCRIMINATOR `discardSilence` ALREADY TURNS ON, which
  //    is the reason to trust it: that function reads the CHEAPEST attack for
  //    exactly this reason, and #28 named "a card with a cheap fallback defeats
  //    it" as the shape of the Arcanine GP fault. Both halves of the Ammo family
  //    hinge on whether the card owns a non-burning attack. See Playbook/AMMO.md.
  //
  // Together they select Charizard and nothing else in the live pool, which is
  // the card the rule was written for. Trevor's other three reasons — 100 damage
  // against 40, Energy Burn making a DCE worth two Fire, and 120 HP to live long
  // enough to spend a pre-load — all point the same way and none of them
  // generalises without a threshold somebody would have to invent.
  //
  // `COST_DISCARD_ALL_ENERGY` is still deliberately NOT counted. Wildfire
  // discards any number and mills that many, so "how much is useful" is unbounded
  // and a headroom figure would be a guess dressed as a derivation.
  // THE SECOND TEST IS NESTED INSIDE THE FIRST, AND THE NESTING IS THE WHOLE
  // CARE. Written flat first — "no headroom for any card with a free attack" —
  // and swept: that moved FIFTEEN cards, not one. Ninetales, Charmeleon,
  // Charmander, Magmar, Starmie, Kadabra, Mewtwo, Gastly, Slowpoke, both
  // Flareons, Ponyta, Dark Golduck and base1 Arcanine all lost their headroom on
  // the strength of an argument about two cards that are nothing like them.
  //
  // A rate-neutral card was never at risk of running out, so the fallback test
  // has nothing to say about it. Burning one against attaching one means the next
  // round always arrives; the headroom there is a small buffer, it is the
  // behaviour the 23 Aug measurement blessed, and it is not what Trevor was
  // talking about. The fallback only discriminates between cards that actually
  // DRAIN — which is why it is asked second and only when the first has fired.
  ammoSymbols(slot) {
    const c = this.top(slot);
    const attacks = c.attacks || [];
    // Does this card own an attack it can fire without eating Energy? Asked once
    // for the card rather than per attack, and consulted only under a real drain.
    const hasFreeAttack = attacks.some((a, i) =>
      !this.script(slot, i).some(v => v.v === 'COST_DISCARD_ENERGY' || v.v === 'COST_DISCARD_ALL_ENERGY'));
    let target = 0;
    attacks.forEach((a, i) => {
      for (const v of this.script(slot, i)) {
        if (v.v !== 'COST_DISCARD_ENERGY' || !v.n) continue;
        // Condition 1: a burn of one replaces itself every turn. Untouched.
        if (v.n > 1 && hasFreeAttack) continue;       // condition 2, drain cards only
        target = Math.max(target, a.cost.length + v.n * this.W.ammoTurns);
      }
    });
    return target;
  }

  bestSelfSwitch(pi) {
    const me = this.E.state.players[pi];
    if (!me.active || !me.bench.length) return null;

    // RE-ENTRY GUARD, and it is not defensive programming — without it this
    // recurses until the stack dies, on any board where a self-switch attack is
    // legal. `promoteValue` calls `potential`, which calls
    // `scoreAttackHypothetical`, which for the ACTIVE slot is `scoreAttack`
    // itself — and `scoreAttack` is what called us. It only closes for the
    // Active, which is why the bench half is safe and why nothing caught it: no
    // theme deck holds a self-switch attack, so 396 assertions and 144 full
    // games passed with the loop sitting there.
    //
    // Returning null one level down is the right answer as well as the safe one.
    // The inner question is "what would this attack be worth", and a self-switch
    // nested inside the valuation of a self-switch is not a play anybody makes.
    if (this._inSelfSwitch) return null;
    this._inSelfSwitch = true;
    try {
      let bench = -1, best = -Infinity;
      for (let i = 0; i < me.bench.length; i++) {
        const v = this.promoteValue(pi, me.bench[i]);
        if (v > best) { best = v; bench = i; }
      }
      return { bench, gain: best - this.promoteValue(pi, me.active) };
    } finally { this._inSelfSwitch = false; }
  }

  bestAttackScore(pi) {
    const E = this.E, p = E.state.players[pi];
    if (!p.active || !E.canAttackAtAll(pi)) return { score: -Infinity, idx: -1 };
    const c = this.top(p.active);
    let best = { score: -Infinity, idx: -1 };
    (c.attacks || []).forEach((a, i) => {
      if (!E.canUseAttack(pi, i).ok) return;
      const s = this.scoreAttack(pi, i);
      if (s > best.score) best = { score: s, idx: i };
    });
    return best;
  }

  // How good is this slot's best attack if we pretend `extra` Energy is on it?
  // Used to decide where an Energy attachment does the most good.
  potential(pi, slot, extraEnergyId) {
    const E = this.E;
    const c = this.top(slot);
    // THE HYPOTHETICAL ENERGY GOES ON THE SLOT, not just into a local pool —
    // 16 Aug 2026.
    //
    // It used to be counted only against attack COSTS, which answers "could it
    // pay?" and nothing else. `scoreAttackHypothetical` reads the board, so the
    // card it was being asked about was not there when the damage was worked
    // out — and the consequence is that **no attack in the game could ever be
    // known to get bigger from an attachment.** Every `DMG_PER_SPARE_ENERGY`
    // card is one: Blastoise's Hydro Pump, Poliwrath, Lapras, both Vaporeon,
    // Omastar, Seadra. A paid-up Blastoise scored a fourth Water at exactly the
    // same value as the third, so the surplus rule held the card and Hydro Pump
    // never grew.
    //
    // Found by a test written for something else. The push/pop-and-restore shape
    // is the one `MOVE_ENERGY` and `BUZZAP` already use for the same reason.
    const fake = extraEnergyId ? { id: extraEnergyId, uid: -1 } : null;
    if (fake) slot.energy.push(fake);
    try {
      return this.potentialOf(pi, slot, c);
    } finally {
      if (fake) slot.energy.pop();
    }
  }

  potentialOf(pi, slot, c) {
    const E = this.E;
    // WHAT THE SLOT ACTUALLY PROVIDES, asked of the engine — not what the cards
    // are printed as. An Energy card may provide several symbols (Double
    // Colorless), and it may provide DIFFERENT ONES depending on what it is
    // attached to.
    //
    // THIS READ `this.db[e.id].provides` UNTIL 18 AUG 2026, and it made the
    // entire Charizard deck unplayable for the bot. Fire Spin costs RRRR; a
    // Double Colorless on a Charizard is RR under Energy Burn, which is the best
    // attachment in the deck and the whole reason the archetype exists. Read off
    // the printed card it is CC, which pays NOTHING toward RRRR — so attaching it
    // moved `short` from 4 to 4, scored 4.4 against a Fire Energy's 33.0, and the
    // bot simply never did it. Four dead cards in a sixty-card deck.
    //
    // Energy Burn being passive is what hid it: there was no unscored verb and no
    // unoffered action for a coverage check to catch, because the Power is not an
    // action at all. `powertest.js` asserted the ENGINE saw RRRR and it did. Only
    // the AI's private copy of the question was wrong.
    //
    // `slotSymbols` also resolves the per-instance `asEnergy` override, so a
    // Buzzap'd Electrode is priced correctly here for free — it was mispriced the
    // same way and by the same line. Found by Trevor asking whether the bot knew
    // a DCE turns into Fire. It did not.
    const pool = [];
    E.slotSymbols(slot).forEach(x => pool.push(x));
    // `goal` is the printed damage of the attack we are actually working
    // TOWARD — the cheapest one to reach, ties broken by size. It is what an
    // Energy part-way there is a fraction OF, so it has to be the same attack
    // `short` is counting down to and not simply the biggest number on the card.
    let best = -Infinity, bestShort = 99, goal = 0;
    // `destShort` — the shortfall to the cheapest attack this card is trying to
    // REACH, which is not always the cheapest attack it owns. See
    // `attackThreatens`. Computed in this loop rather than in a second one, so
    // it can never disagree with `short` about what a cost solves to.
    let destShort = 99;
    // `destGoal` is to `destShort` what `goal` is to `short`, and it exists
    // because the two roads can lead to DIFFERENT attacks — 5 Sep 2026. A Fossil
    // Moltres holding one Fire has `short` 0 and `goal` 0, because Wildfire costs
    // R and deals nothing; `destShort` is 3, to an 80-damage Dive Bomb. Anything
    // amortising a step along the `destShort` road against `goal` divides the
    // wrong number by the wrong distance.
    let destGoal = 0;
    // (short, damage) per attack, for the upgrade road below. Collected in this
    // loop rather than recomputed, so it can never disagree with `short`.
    const rows = [];
    (c.attacks || []).forEach((a, i) => {
      const need = a.cost.split('').filter(x => x !== 'C');
      const generic = a.cost.length - need.length;
      const used = new Array(pool.length).fill(false);
      let short = 0;
      for (const t of need) {
        const k = pool.findIndex((x, j) => !used[j] && x === t);
        if (k === -1) short++; else used[k] = true;
      }
      const spare = pool.filter((x, j) => !used[j]).length;
      if (spare < generic) short += generic - spare;
      // `isReal` GUARDS AN ASSUMPTION THIS FUNCTION HELD SILENTLY UNTIL 28 AUG
      // 2026: that `c` is the card actually on the slot. It always was, because
      // `potential()` was the only caller and it passes `this.top(slot)`.
      // `scoreAttackHypothetical` takes an attack INDEX and looks it up on the
      // real top card — so the moment `potentialAs` started asking "what would
      // this slot be worth as its evolution", an evolution with more attacks than
      // the Basic underneath it indexed off the end and the whole scorer threw on
      // `a.dmg` of undefined. Three Overgrowth games, caught by selftest.
      //
      // Printed damage is the right fallback and not just the safe one: a card
      // that is not on the board yet cannot be scored as though it were attacking
      // this turn, which is the same reason the Bench takes the printed number.
      // See AI.md on the two currencies.
      const isActive = E.state.players[pi].active === slot;
      const isReal = c === this.top(slot);
      let val;
      if (short === 0) {
        // `slotPrintedDamage` rather than `aiParseDamage` — the printed number is
        // wrong about itself for the Over-Attach family, and this is the branch
        // that made the whole family invisible on the Bench. `c` is passed
        // explicitly because `potentialAs` asks this about an evolution that is
        // not on the slot yet, where `this.top(slot)` is the Basic underneath.
        val = (isActive && isReal) ? this.scoreAttackHypothetical(pi, slot, i)
                                   : this.slotPrintedDamage(slot, c, i);
      } else {
        val = -1;
      }
      // `goal` is what an Energy part-way there is a fraction OF, so it has to
      // grow with the Over-Attach too — otherwise `attachBuild` amortises against
      // a number the attack stopped being worth two Energy ago.
      const dmg = this.slotPrintedDamage(slot, c, i);
      if (short < bestShort) { bestShort = short; goal = dmg; }
      else if (short === bestShort && dmg > goal) goal = dmg;
      if (val > best) best = val;
      if (this.attackThreatens(slot, c, i) && short < destShort) { destShort = short; destGoal = dmg; }
      else if (this.attackThreatens(slot, c, i) && short === destShort && dmg > destGoal) destGoal = dmg;
      rows.push({ short, dmg });
    });

    // THE UPGRADE ROAD — 6 Sep 2026, Trevor's damage-per-turn rule. THE THIRD
    // ROAD, and the three answer three different questions on purpose:
    //
    //   short     -> the cheapest attack this card owns. "Can it act at all"
    //   destShort -> the cheapest attack WORTH ARRIVING FOR. "Is the evolved form
    //                functional" — the evolution destination, 1 Sep
    //   upShort   -> the nearest attack BETTER THAN WHAT IS AFFORDABLE NOW.
    //                "Is there a reason to keep feeding this card"
    //
    // **Do not merge them and do not add a fourth without reading this list.**
    // Two lists holding one idea and drifting apart is this project's most
    // frequently diagnosed failure; three roads holding three questions is the
    // thing that stops it, and each is named for the question rather than the
    // mechanism.
    //
    // Trevor's rule: *"a pokemon like Hitmonchan or Raichu should be powered up
    // toward their bigger attack... but this only applies to USEFUL more
    // expensive attacks."* Useful is measured against what the card can already
    // do — Jab at 20 is affordable, Special Punch at 40 is two Energy away and
    // strictly better, so the road is live. An attack that is not an improvement
    // on what you can already pay for is not a destination.
    //
    // MEASURED AGAINST WHAT IS AFFORDABLE, NOT AGAINST THE CHEAPEST. Those differ
    // the moment a card owns three attacks, and the affordable one is the honest
    // baseline: what you would lose by stopping here.
    let upShort = 99, upGoal = 0, affordable = 0;
    for (const r of rows) if (r.short === 0 && r.dmg > affordable) affordable = r.dmg;
    for (const r of rows) {
      if (r.dmg <= affordable || r.short <= 0) continue;
      if (r.short < upShort || (r.short === upShort && r.dmg > upGoal)) { upShort = r.short; upGoal = r.dmg; }
    }
    if (upShort === 99) { upShort = 0; upGoal = 0; }
    // NO THREATENING ATTACK AT ALL falls back to the cheapest of any, because
    // then the utility attack genuinely IS the destination — a card with nothing
    // but Scrunch is not "never ready", it is ready when Scrunch is affordable.
    return { best: best === -Infinity ? 0 : best, short: bestShort, goal,
             destShort: destShort === 99 ? bestShort : destShort,
             destGoal: destShort === 99 ? goal : destGoal,
             upShort, upGoal };
  }

  // ==========================================================================
  // AN ATTACK WORTH ARRIVING FOR — 1 Sep 2026
  // ==========================================================================
  //
  // Trevor's rule, and his own parenthetical is the load-bearing half: *"the AI
  // prices its pre-evolution energies at what the evolved card needs for its
  // cheapest offensive (or otherwise specified) attack, minus one."*
  //
  // **"Offensive" is nearly right and is wrong on its own**, which is what the
  // parenthetical was reaching for. Chansey's Scrunch and Ninetales' Lure are
  // both zero-damage cheapest attacks, and they are opposite cases — standing
  // there IS Chansey's job, while Ninetales explicitly does not want to be Active
  // without Fire Blast. What separates them is not the attack; it is that a
  // **wall is a terminal Basic and is never an evolution target**, so the wall
  // case cannot reach this predicate at all. See Playbook/WALLS.md.
  //
  // MEASURED BEFORE BUILDING: 53 cards in the live pool have a cheapest attack
  // that deals no damage while a pricier one does, **24 of them Evolutions** —
  // Kadabra (Recover 2 / Super Psy 3), Wartortle, Graveler, Hypno, Poliwhirl,
  // Nidorina, Parasect, Victreebel, Dark Arbok, Dark Golduck, Ninetales, Starmie,
  // Tentacruel, Scizor, Rapidash. On every one the bot was targeting one Energy
  // lower than it should. Three of Trevor's own notes independently name the
  // damaging attack as the destination on cards in that list, which is the
  // corroboration this is derived toward rather than a guess.
  //
  // WHY NOT JUST `aiParseDamage(dmg) > 0`. Because that is the exact fault this
  // job spent two days on — the printed number lying about what the attack does.
  // Six attacks print NOTHING and deal damage anyway: Stretch Kick, Dig Under,
  // Stare, Flitter, Coin Hurl and Telekinesis all snipe the Bench, Super Fang
  // halves the defender, Miraculous Comeback counts heads. Reading the script is
  // the only honest version, and `powertest.js` asserts this predicate against
  // what `rawOutcomes` actually produces so the name-matching cannot drift.
  //
  // The defensive verbs deliberately do NOT qualify — `DAMAGE_REDUCTION_SELF`
  // (Minimize), `DAMAGE_HALVE_SELF` (Light Screen), `DAMAGE_REDUCTION_FROM`
  // (Growl, Snivel) — nor `RECOIL`, which is damage pointed the wrong way.
  attackThreatens(slot, card, idx) {
    const c = card || this.top(slot);
    const atk = (c.attacks || [])[idx];
    if (!atk) return false;
    if (aiParseDamage(atk.dmg) > 0) return true;
    const e = this.eff[c.id];
    const script = (e && e.a && e.a[idx]) || [];
    return script.some(v => v.v.indexOf('DMG_') === 0 || v.v === 'BENCH_SNIPE');
  }

  // ------------------------------------------------ evolving, as a PLAN -----
  // THE AI HAS NO LOOKAHEAD, and these two functions are the narrowest possible
  // exception to that: one card ahead, and only when the card is already in hand.
  // Job 13b, 28 Aug 2026, from Trevor's account of how the GBC game does it:
  //
  //   "their AI planned for future evolutions, but this was weighted much higher
  //    if they actually had the evolution card in their hand. It was usually
  //    careful not to evolve unless it was one energy away from being able to use
  //    the evolution's cheapest attack of value, so it would get energies close to
  //    that point before actually evolving."
  //
  // That is TWO rules and they are the two halves AI.md's open item 4 says must
  // ship together — "the attach half has to come first" — because a readiness
  // penalty on its own strands Vileplume at two Energy forever. Attaching to a
  // Gloom scores -2 today, so evolving is currently the only thing that unblocks
  // the Energy; take that away without giving the Gloom a reason to be fed and
  // the bot simply stops.
  //
  // ONLY FROM HAND, deliberately. Trevor's account has the GBC bot planning for
  // evolutions it does not hold as well, at a lower weight. That needs the deck as
  // a probability rather than as a fact and it is a bigger change; this is the
  // half where the plan is CERTAIN, which is where the weight belongs anyway.

  // The card in hand that this slot is about to become, or null. Name-matched on
  // `evolvesFrom` the way the engine matches it, and it deliberately does NOT ask
  // whether the evolution is legal THIS turn — a Pokemon played this turn cannot
  // evolve yet, and that is exactly when you want to start feeding it.
  // ==========================================================================
  // A CARD'S WALL-NESS RISES AS ITS EVOLUTION STOPS BEING LIVE — 3 Sep 2026
  // ==========================================================================
  //
  // Trevor, watching the GBC sequel: Rhyhorn "brought in just to use Leer as
  // long as it can and be thrown away, on purpose, because the AI needed to buy
  // time for the bench, never powering up Horn Attack."
  //
  // `wallScore` could never say that. It refuses every Basic that has an
  // evolution, and Rhyhorn evolves — so the archetypal example of the behaviour
  // Trevor was describing scored zero.
  //
  // THE OLD GATE IS NOT REMOVED, IT IS DERIVED. A terminal Basic is simply a
  // card whose road is permanently dead: nothing evolves from it, so `roadLive`
  // is 0 and `wallHere` returns exactly `wallScore`. **That equivalence is
  // asserted in `powertest.js`** — it is what makes this a generalisation rather
  // than a replacement, and if it ever stops holding, this went wrong.
  //
  // AND THE STAGE-2 PROTECTION IS STRUCTURAL RATHER THAN INHERITED. The reason
  // written down for terminal-only was that "cannot evolve further" would call
  // Charizard a wall — but `stage === 'Basic'` already excludes Charizard, and
  // that condition lives in `wallShape` where nothing here can relax it. What
  // the evolution half was ACTUALLY buying is that a Squirtle you mean to evolve
  // is not treated as disposable, and that is a fact about the board rather than
  // about the card. This is that fact, asked properly.
  //
  // Trevor, 3 Sep: a DISCOUNT rather than a hard stop, to keep it tunable.
  //
  // THREE STATES, AND ONLY THE MIDDLE ONE IS A GUESS:
  //   in hand   the road is a certainty THIS TURN         -> 1, no wall-ness
  //   in deck   it is a hope, and the card is standing
  //             there now                                 -> W.wallRoadInDeck
  //   nowhere   discarded, in play or prized: the road is
  //             over and the card has no future           -> 0, full wall-ness
  //
  // Reading our own deck is legitimate and already done in five places — a
  // player knows their own decklist. It is not `prizeIndex`'s problem.
  roadLive(pi, slot) {
    const card = this.top(slot);
    // The common case short-circuits before any scan: most cards in most decks
    // have no evolution at all, and this runs inside the retreat scoring.
    if (!namesWithAnEvolution(this.db).has(card.name)) return 0;
    if (this.evolutionInHand(pi, slot)) return 1;
    const me = this.E.state.players[pi];
    const inDeck = me.deck.some(x => {
      const c = this.db[x.id];
      return c && c.kind === 'pokemon' && c.evolvesFrom === card.name;
    });
    return inDeck ? this.W.wallRoadInDeck : 0;
  }

  wallHere(pi, slot) {
    return wallShape(this.db, this.eff, this.top(slot)) * (1 - this.roadLive(pi, slot));
  }

  evolutionInHand(pi, slot) {
    const me = this.E.state.players[pi];
    const from = this.top(slot).name;
    let best = null, bestHP = -1;
    for (const h of me.hand) {
      const c = this.db[h.id];
      if (!c || c.kind !== 'pokemon' || c.evolvesFrom !== from) continue;
      if (c.hp > bestHP) { bestHP = c.hp; best = c.id; }
    }
    return best;
  }

  // ==========================================================================
  // THE PLAN IS THE WHOLE LINE, AND EACH STEP PAYS FOR ITSELF — 1 Sep 2026
  // ==========================================================================
  //
  // Trevor, from the GBC game and confirmed in Pocket: the bot attaches Energy
  // **last**, after everything else on its checklist. So a Pokemon on an
  // evolution road does not need its evolution's full cost before it evolves —
  // **every evolution step is a turn, and every turn brings an attachment**, so
  // the line finances itself one Energy per step.
  //
  //   "It would only give Abra 1 energy. Why? Because Alakazam needs 3, and Abra
  //    would need two turns to evolve twice. Turn 2 results in Kadabra with two
  //    energies. Turn 3 results in Alakazam with three energies. But if a Kadabra
  //    shows up in its hand without an Alakazam, the bot will still want to evolve
  //    it but will wait an extra turn while it attaches a second energy to Abra."
  //
  // **THE SAME CARD WANTS A DIFFERENT AMOUNT DEPENDING ON HOW DEEP THE PLAN IS**,
  // which is the thing no per-card target could ever express. One Energy on an
  // Abra when an Alakazam is coming; two when only a Kadabra is.
  //
  //   want = destShort(deepest planned form) - (evolution steps remaining)
  //
  // Checked against all three of Trevor's own numbers before it was built:
  //
  //   Abra -> Kadabra -> Alakazam   Confuse Ray PPP = 3, 2 steps -> target 1
  //   Abra -> Kadabra only          Super Psy   PPC = 3, 1 step  -> target 2
  //   Machop -> Machoke             Karate Chop FFC = 3, 1 step  -> target 2
  //
  // **The rule shipped earlier today is this one truncated to depth 1.** It looked
  // exactly one evolution ahead, which is right for Machop and one Energy too
  // generous for Abra. `readiness > 1` and `roadWant > 0` are the same test when
  // `steps` is 1, so nothing about the one-step case changes.
  //
  // ONLY CARDS IN HAND COUNT, so the plan is a certainty rather than a hope — the
  // same bound `evolutionInHand` has had since 28 Aug. Planning toward an
  // evolution that is only in the DECK is a real thing the GBC bot does and it is
  // deliberately not here; see AI.md's open item 9 for the shape Trevor wants.
  //
  // The engine enforces one evolution per Pokemon per turn — verified on a board,
  // not assumed — so the step count really is a turn count.
  evolutionPlan(pi, slot) {
    const me = this.E.state.players[pi];
    // Walk the line through the hand. Each hop consumes the card it used, so two
    // Kadabras cannot be counted as two steps.
    const taken = new Set();
    let from = this.top(slot).name, cardId = null, steps = 0;
    for (;;) {
      let best = null, bestHP = -1, bestUid = null;
      for (const h of me.hand) {
        if (taken.has(h.uid)) continue;
        const c = this.db[h.id];
        if (!c || c.kind !== 'pokemon' || c.evolvesFrom !== from) continue;
        if (c.hp > bestHP) { bestHP = c.hp; best = c.id; bestUid = h.uid; }
      }
      if (!best) break;
      taken.add(bestUid);
      cardId = best; steps++; from = this.db[best].name;
    }
    return cardId ? { cardId, steps } : null;
  }

  // HOW MUCH MORE ENERGY THIS SLOT WANTS BEFORE IT IS READY TO START EVOLVING.
  // Zero means go. Read by all three places that ask it — the `evolve` case, the
  // road in `attachBuild`, and the surplus rule's `evolving` exception.
  //
  // **THAT IT IS THREE PLACES IS THE WHOLE WARNING.** The surplus rule returns
  // `attachSurplus` before either of the others is reached, so changing two of
  // them produces no behaviour change at all — measured exactly that way once,
  // and it nearly got a correct change written up as a null.
  // `firstStep` is the immediate evolution the caller already has in hand — the
  // one `evolutionRoadFor` chose, or the card being played by `case 'evolve'`.
  // Passing it keeps this honest about WHICH decision is being priced: the plan
  // is only this slot's if its first hop is that card.
  roadWant(pi, slot, firstStep) {
    const plan = this.evolutionPlan(pi, slot);
    if (!plan) return 0;
    if (firstStep) {
      const c = this.db[firstStep];
      if (!c || c.evolvesFrom !== this.top(slot).name) return 0;
    }
    const short = this.potentialOf(pi, slot, this.db[plan.cardId]).destShort;
    return Math.max(0, short - plan.steps);
  }

  // ONE OF THE TWINS GETS FED — 28 Aug 2026, Trevor, and it is the clause of his
  // GBC note the first evolution pass deliberately left out:
  //
  //   "If you have two or more equal basics, then you should primarily invest in
  //    only one of them for evolution. Once one is fully at the point it needs to
  //    be and is just waiting on the evolution card, the other can be invested in
  //    as a staller or attacker in its own right, or even as a backup evolution if
  //    there's time and surplus. The point is one should be selected and invested
  //    in first, and then the other isn't blocked but evolution investment gets
  //    weighted much lower."
  //
  // WHAT IS WITHHELD IS THE ROAD, NOT THE ENERGY, and that distinction is the
  // whole of "not blocked". A non-primary duplicate still scores attachments
  // against its OWN attacks the way any other Pokemon does — it can be built as
  // a staller or an attacker, which is Trevor's second sentence. What it does not
  // get is the evolution road: `potentialAs` measuring it against the card it
  // might one day become, and the fourth surplus exception that goes with it.
  // Both of those are what make a Growlithe worth a third Fire, so withholding
  // them is exactly "weighted much lower" without ever being a veto.
  //
  // THE PRIMARY IS THE MOST-INVESTED COPY THAT IS NOT YET READY, which makes the
  // release automatic rather than a second rule. Once the leader's shortfall
  // against its evolution reaches 0 it stops being short, drops out of the
  // running, and the next copy inherits the road — Trevor's "once one is fully at
  // the point it needs to be and is just waiting on the evolution card".
  //
  // STABLE BY CONSTRUCTION, because a leader that flip-flops is worse than no
  // rule at all: ordering is by Energy attached, and feeding the leader is what
  // keeps it the leader. `uid` breaks the opening tie, where every copy is
  // identical and any stable choice is correct.
  //
  // MATCHED BY NAME rather than by card id. Two printings of Growlithe are two
  // Growlithe to a player, and the workbook's notes are about names.
  evolutionRoadFor(pi, slot) {
    const evo = this.evolutionInHand(pi, slot);
    if (!evo) return null;
    const name = this.top(slot).name;
    const twins = this.E.allSlots(pi).filter(x => this.top(x).name === name);
    if (twins.length < 2) return evo;
    // Only copies still short of the evolution are in the running; a ready one
    // has had its turn and steps aside.
    // `potentialAs` is not cheap — it pushes a hypothetical card onto the slot and
    // re-scores it — and this function runs per attach action per slot. Measured
    // once per twin and reused, because asking twice here doubled an `abtest` run.
    const shortOf = new Map();
    for (const x of twins) shortOf.set(x, this.potentialAs(pi, x, evo, null).short);
    let contenders = twins.filter(x => shortOf.get(x) > 0);
    if (!contenders.length) return evo;              // all ready — nothing to ration

    // A COPY THAT WILL NOT LIVE TO FINISH ITS ROAD STEPS ASIDE TOO, which is the
    // same shape as the release above rather than a new kind of rule: a leader
    // stops leading when it can no longer be the one that arrives.
    //
    // Trevor, 31 Aug 2026, on an Active Charmeleon with a Charizard in hand and a
    // second Charmeleon benched: "I'd say the active one is pretty safe to write
    // off... switching powerup focus to the Charmeleon on the bench."
    //
    // Measured before it: the road was worth 101.0 to the Active whether it stood
    // on 80 HP or on 10, while the safe twin was passed over at 62.0. Sweeping the
    // Active from 80 down to 10 never moved the number by a point, because the
    // ranking is investment and nothing else.
    //
    // ONLY WHEN SOMEBODY ELSE CAN TAKE IT UP. A sole carrier keeps its road however
    // doomed it is — there is no better home for the Energy and refusing the road
    // would just strand it. That is what keeps this from being a veto.
    //
    // Hedged, through `survivesCharge`'s own +1 rather than the raw count, so the
    // two places that ask "will you be here" cannot drift apart. A healthy Active
    // two turns from death with a shortfall of two keeps the road; the Charmeleon
    // above, zero turns left against a shortfall of two, does not.
    if (contenders.length > 1) {
      const living = contenders.filter(x => this.turnsLeft(pi, x) + 1 >= shortOf.get(x));
      if (living.length) contenders = living;
    }
    contenders.sort((a, b) =>
      (b.energy.length - a.energy.length) || (a.uid - b.uid));
    return contenders[0] === slot ? evo : null;
  }

  // `potential` for a card this slot is not yet — same push/pop shape, so a
  // hypothetical Energy and a hypothetical card compose.
  potentialAs(pi, slot, cardId, extraEnergyId) {
    const fake = extraEnergyId ? { id: extraEnergyId, uid: -1 } : null;
    if (fake) slot.energy.push(fake);
    try {
      return this.potentialOf(pi, slot, this.db[cardId]);
    } finally {
      if (fake) slot.energy.pop();
    }
  }

  // What putting `energyId` on `slot` is worth. ONE home, used by both the
  // normal one-per-turn attachment and by Rain Dance's free one.
  //
  // It lives here because it used to live in two places. Adding the on-type
  // preference to `attachEnergy` alone left `EXTRA_ATTACH` with the old formula,
  // and since Rain Dance's whole advantage is a +attachBuild premium of 3.5, a
  // 4-point bonus on the ordinary path silently made spending your one
  // attachment look better than the free unlimited Power. `powertest.js` caught
  // it immediately. **Any new attachment term goes here, not in a caller.**
  // What a SPECIAL Energy's on-attach effect is worth, on top of the symbols it
  // provides. Job 10d.
  //
  // Small but not zero, and the sign of it is the whole point: Full Heal Energy
  // on a Paralyzed Active is a Full Heal that also pays for an attack, and on a
  // healthy one it is a Double Colorless that provides one symbol instead of two.
  // Without this the bot cannot tell those apart and will burn it on whichever
  // Pokemon it happened to be charging.
  //
  // UNMEASURED — both weights are borrowed from the Trainers that do the same
  // job, which keeps them on one scale but is not the same as having checked.
  energyOnAttachValue(pi, slot, energyId) {
    const W = this.W;
    const script = (this.eff[energyId] || {}).t || [];
    let s = 0;
    for (const v of script) {
      if (v.v === 'E_CLEAR_STATUS') {
        // Worth exactly the conditions it actually removes, so it is worth
        // nothing on a clean Pokemon — which is what stops it being spent early.
        const st = slot.status;
        if (st.paralyzed) s += W.paralyze;
        if (st.asleep) s += W.sleep;
        if (st.confused) s += W.confuse;
        if (st.poisoned) s += W.poison;
      } else if (v.v === 'E_HEAL') {
        const h = Math.min(v.n || 10, slot.dmg);
        s += (h / 10) * W.healPer10;
      } else if (v.v === 'E_SELF_DAMAGE') {
        // Rainbow Energy costs 10 damage to attach, AND IT CAN KILL. The second
        // half is not a rounding error on the first: a Rainbow onto something on
        // its last 10 is a free Prize for the opponent, and nothing else in this
        // function can express "never do this".
        const n = v.n || 10;
        if (this.remainingHP(slot) <= n) return -Infinity;
        s -= (n / 10) * W.selfDamage;
      }
    }
    return s;
  }

  attachValue(pi, slot, energyId) {
    const W = this.W, E = this.E;
    const before = this.potential(pi, slot, null);
    const after = this.potential(pi, slot, energyId);
    // SHORTFALL IS MEASURED AGAINST WHAT THIS SLOT IS BECOMING, when the card
    // that turns it into that is already in hand. AI.md open item 4 asked for
    // exactly this sentence and Trevor's GBC account is the same rule: get the
    // Energy close BEFORE evolving, rather than evolving and then discovering the
    // new card cannot attack.
    //
    // ONLY THE PROGRESS HALF SWITCHES. `best` stays the current card's, because
    // that is what this Pokemon can actually do if it is attacked this turn —
    // crediting a Gloom with Vileplume's damage would be a lie the rest of the
    // scorer reads as fact. What changes is the ROAD: how short it is, and what
    // is waiting at the end of it. See the amortise branch below.
    const evo = this.evolutionRoadFor(pi, slot);
    const beforeR = evo ? this.potentialAs(pi, slot, evo, null) : before;
    const afterR = evo ? this.potentialAs(pi, slot, evo, energyId) : after;

    // THE ROAD'S LENGTH IS MEASURED TO THE DESTINATION — 1 Sep 2026, and this is
    // the site Trevor's rule is actually about: *"the AI prices its PRE-EVOLUTION
    // ENERGIES at what the evolved card needs for its cheapest offensive attack,
    // minus one."* `evolve` reading `destShort` while the road read `short` made
    // two halves of one idea target two different attacks — the road called a
    // Kadabra finished at Recover's two Energy and stopped feeding, while
    // `evolve` was still waiting for Super Psy's three.
    //
    // **Only when there IS an evolution.** A card fighting now is fed toward the
    // cheapest attack it owns, because a utility attack it can actually use this
    // turn is a real destination — that is Chansey being fed toward Scrunch, and
    // it is the case `attackThreatens` deliberately cannot see, since walls are
    // terminal Basics and never appear on a road.
    //
    // AND THE ROAD STOPS AT THE TARGET, NOT AT FULL PAYMENT — 1 Sep 2026. On an
    // evolution road the length is `roadWant`: `destShort` to the deepest form the
    // hand can reach, less one Energy per remaining step, because the evolution
    // turns bring their own attachments. Feeding an Abra past that is feeding it
    // Energy the line was going to supply anyway.
    //
    // The road is measured to the DEEPEST form the hand can reach, so `potentialAs`
    // is asked about that card rather than about the next one — a Charmander whose
    // hand holds Charmeleon and Charizard is building toward Fire Spin, not Slash.
    const plan = evo ? this.evolutionPlan(pi, slot) : null;
    const roadShort = r => (evo ? r.destShort : r.short);
    let beforeShort = roadShort(beforeR), afterShort = roadShort(afterR);
    if (plan) {
      beforeShort = Math.max(0, this.potentialAs(pi, slot, plan.cardId, null).destShort - plan.steps);
      afterShort = Math.max(0, this.potentialAs(pi, slot, plan.cardId, energyId).destShort - plan.steps);
    }
    // ...AND A CARD WITH NO EVOLUTION STILL HAS A ROAD: to its own bigger attack.
    // 5 Sep 2026, the value half of the fifth surplus exception in `attachBuild`.
    //
    // `short` pins at zero the moment any attack is payable, so a Moltres holding
    // one Fire reads as finished and every branch below floors it at 0.4. The card
    // is three Energy from an 80. `destShort` is the honest distance and `destGoal`
    // is what is waiting at the end of it — without the second one this amortises a
    // step toward Dive Bomb against Wildfire's zero.
    //
    // ONLY WHEN THE ORDINARY ROAD IS PINNED AND THERE IS NO EVOLUTION, so every
    // path the evolution road already covers is untouched and this can only add
    // value where the old code had none to give.
    let roadGoal = beforeR.goal;
    if (!evo && beforeShort === 0 && afterR.upShort < beforeR.upShort) {
      beforeShort = beforeR.upShort;
      afterShort = afterR.upShort;
      roadGoal = beforeR.upGoal;
    }
    let s = Math.max(0, after.best - Math.max(0, before.best)) * W.attachEnable;
    s += this.energyOnAttachValue(pi, slot, energyId);

    // PROGRESS IS WORTH A SHARE OF WHAT IT IS PROGRESS TOWARD — 16 Aug 2026,
    // from Trevor watching the bot feed a Voltorb while its Zapdos starved.
    //
    // Finishing an attack pays `attachEnable` for the whole of that attack.
    // Advancing one paid a FLAT `attachBuild` per step, with no idea what was at
    // the end of the road — so one Lightning completing a Voltorb's 10-damage
    // Tackle beat one of four Lightning on the way to a 60, and would have
    // forever. The card that can never do anything wins because it is cheap.
    //
    // Amortised instead: one Energy of the N a Pokemon still needs is worth
    // roughly its share of the attack waiting at the end. A third of a 60 beats
    // all of a 10, which is the answer Trevor gave in plain English.
    //
    // `goal` is the printed damage of the attack `short` is actually counting
    // down to, not the biggest number on the card — amortising a step toward
    // Thunder against a Thunderbolt the Pokemon will never afford would price
    // the wrong road.
    // `beforeR`/`afterR` — the ROAD, which is the evolution's when one is in hand
    // and this card's otherwise. `before`/`after` stay on the last branch because
    // "did this card get me a bigger attack RIGHT NOW" is a question about what is
    // standing there, not about what it is going to be.
    if (afterShort === 0 && beforeShort > 0 && !evo) {
      // Completing. `attachEnable` has already paid the attack's real value, so
      // this stays the flat finishing bonus it has always been.
      //
      // `!evo` — AND THAT GUARD IS NOT DEFENSIVE, it repairs an assumption this
      // branch has always made and that the evolution road broke the same day it
      // was written. The sentence above is only true when the attack is on the
      // card that is STANDING THERE: `attachEnable` reads `best`, and `best` is
      // deliberately the current card's, so on an evolution road it paid nothing
      // at all. Completing a Charmeleon's cost through a flat `attachBuild * 1 * 2`
      // priced the last Fire before a 50-damage evolution at SEVEN — below what a
      // second, untouched Charmander scored for its first Energy, so the bot fed
      // the twin and left the leader one short. Trevor's duplicates rule made it
      // visible; the fault is older and belongs to the evolution road itself.
      //
      // An evolution road therefore always takes the amortise branch below, where
      // the step is worth its share of what is waiting at the end.
      s += W.attachBuild * beforeShort * 2;
    } else if (afterShort < beforeShort) {
      const steps = beforeShort - afterShort;
      s += Math.max(10, roadGoal) * (steps / beforeShort)
         * W.attachAmortise * this.survivesCharge(pi, slot, afterShort);
    } else if (after.best > before.best) s += W.attachBuild;
    else s += 0.4;
    s += (slot === E.state.players[pi].active) ? 4 : 1;   // the Active uses it soonest

    // Prefer ON-TYPE Energy. Colorless accepts anything, so a Grass really can
    // pay an Arcanine's CC — the cost solver in potential() is right about that
    // and stays as it is. But the TYPED half of a cost is the binding
    // constraint, and the two cards are not interchangeable: a Fire helps
    // Arcanine twice over, a Grass only once. Untied, the bot picked whichever
    // action came first and stranded Pokemon one on-type Energy short while
    // their Colorless sat paid. Trevor's call, from play.
    const gives = (this.db[energyId].provides || 'C').split('');
    const typedNeed = new Set();
    for (const atk of (this.top(slot).attacks || [])) {
      for (const ch of (atk.cost || '').split('')) if (ch !== 'C') typedNeed.add(ch);
    }
    // A Rainbow pays ANY typed symbol, so it earns this bonus whenever the
    // Pokemon needs a typed symbol at all — which is the correct answer and is
    // also what makes it the best card in the deck for a two-colour attacker.
    const onType = gives.includes(AI_WILD)
      ? typedNeed.size > 0
      : gives.some(x => x !== 'C' && typedNeed.has(x));
    if (onType) s += W.attachOnType;
    return s;
  }

  // WILL IT STILL BE STANDING WHEN IT IS CHARGED? Trevor's own reasoning for
  // preferring the Zapdos: it is in the Active spot and can *realistically
  // survive* long enough to power its move up, and the alternatives — retreat
  // with no Switch, or sacrifice it — are worse. An Energy toward a four-turn
  // attack on something that dies in one is a card thrown away.
  //
  // Only the Active is being hit, so only the Active is discounted. Graded
  // rather than a cliff, on the by-now well-earned suspicion of any quantity
  // about proximity to an edge written as an equality test.
  // HOW LIKELY IS THIS PLAYER TO KILL THE DEFENDING POKEMON THIS TURN?
  //
  // The attack path gets this for free — `forecast` computes `pLethal` for the
  // attack being scored. A Trainer does not: it is played BEFORE the attack, so
  // "will this target still be here" has to be asked about the best attack the
  // Pokemon could follow up with.
  //
  // Deliberately the MAXIMUM across affordable attacks rather than the one the
  // bot will actually pick. Over-stating the kill chance under-values the rider,
  // which is the safe direction — the failure being fixed is a Trainer spent on
  // something already leaving, so erring toward "do not spend it" costs a card
  // and erring the other way wastes one.
  pLethalThisTurn(pi) {
    const me = this.E.state.players[pi];
    if (!me.active || !this.E.state.players[1 - pi].active) return 0;
    let best = 0;
    for (const a of this.E.legalActions(pi)) {
      if (a.t !== 'attack') continue;
      const f = this.forecast(pi, a.idx, a.opts);
      if (f && f.pLethal > best) best = f.pLethal;
    }
    return best;
  }

  // IS THIS STATUS WORTH ANYTHING AGAINST A TARGET THAT ALREADY HAS ONE?
  //
  // The 22 Aug rider rule said a rider is worth nothing on a Pokemon the attack
  // REMOVES. This is the same sentence with a different ending: a rider is worth
  // nothing on a Pokemon that already HAS it. Both were flat — every status verb
  // in the game scored identically against a clean target and an afflicted one,
  // so Poison Sting kept its poison credit against something already poisoned
  // and Toxic scored 44 against a target it could not affect in any way.
  //
  // **Found by two of Trevor's notes landing on one cause**, 23 Aug 2026.
  // Nidoking: *"Once the opponent is poisoned, Toxic cannot add additional poison
  // damage, so Thrash becomes more valuable."* Beedrill: *"Poison Sting first, and
  // then Twineedle when the opponent is already poisoned."* Neither note is about
  // the other's card and neither mentions a scoring term.
  //
  // IT IS NOT ONE RULE FOR ALL FOUR, AND THAT IS THE WHOLE CARE IN IT. The answer
  // is read off what the engine actually does with each, not off a table of
  // opinions:
  //
  //   Poisoned     persists until cured, so re-applying is worthless — EXCEPT
  //                Toxic, which raises the tick from 10 to 20 and is printed
  //                "(even if it was already Poisoned)" precisely because of this
  //   Asleep       persists until a wake flip succeeds; re-applying changes nothing
  //   Confused     persists until cured; likewise
  //   Paralyzed    **NOT redundant.** `endTurn` clears it when `paralyzedTurn <
  //                turn`, so a second application REFRESHES the timer and really
  //                does buy another turn
  //
  // And the big three are mutually exclusive — `applyStatus` clears all of them
  // before setting one — so putting a DIFFERENT one on an afflicted Pokemon is a
  // swap rather than a redundancy, and swaps are not discounted here at all.
  //
  // Returns a multiplier rather than a boolean because a partial case exists:
  // Toxic against a 10-poison target is genuinely worth something, just not
  // full price.
  statusNovelty(st, defSlot) {
    if (!defSlot) return 1;
    const cur = defSlot.status || {};
    if (st === 'Paralyzed') return 1;                    // refreshes; see above
    if (st === 'Poisoned') {
      if (!cur.poisoned) return 1;
      // Already poisoned. The only thing left to gain is a stronger tick, and
      // `poisonDamage` is where the engine keeps it.
      return (defSlot.poisonDamage || 10) < 20 ? 0.5 : 0;
    }
    if (st === 'Asleep')   return cur.asleep ? 0 : 1;
    if (st === 'Confused') return cur.confused ? 0 : 1;
    return 1;
  }

  // HOW MANY TURNS OF SILENCE A DISCARD BUYS — the cost of an attack that eats
  // its own Energy, measured in the thing you actually lose.
  //
  // Trevor, 23 Aug 2026, in two halves he did not know were one term. On
  // Arcanine: *"an energy burn while holding an energy abundance is rather cheap
  // ... you don't really lose a turn if it was an extra energy."* On Zapdos:
  // *"could this be weighed over turns of expected life? If it's expected to die
  // on the opponent's next turn then burning energy doesn't really matter."*
  //
  // Those are the two factors of one quantity: **how much you will miss it**,
  // and **how long you will live to miss it.** A flat charge per card knows
  // neither, and a flat charge is what this was — `energyDiscard` at 7 a card,
  // the same rate `retreatSaveEnergy` pays, applied identically to Charizard
  // spending two of six and to Zapdos emptying itself down to nothing.
  //
  // WHAT IT MEASURES: symbols short of the CHEAPEST attack once the discard has
  // happened. You may attach one Energy a turn, so that number is turns you
  // cannot attack at all. Six Fire firing Fire Spin leaves four and can fire
  // again — zero. Four Lightning firing Thunderbolt leaves nothing and needs
  // four — four.
  //
  // AND IT IS SQUARED, which is the cliff table's own rule rather than a taste:
  // silence is a COST, and a cost is squared where a benefit is linear. Two
  // turns of standing there doing nothing while they attack you freely is worse
  // than twice one turn, because the turns compound. `shieldSelf` settled the
  // same argument in the same words on 22 Aug.
  //
  // THE SURVIVAL FACTOR IS NOT A SECOND IDEA. `survivesCharge` already answers
  // "will this Pokemon live long enough for a shortfall of N to matter", and a
  // discard is exactly that question asked backwards. So Thunderbolt is priced
  // out of a healthy Zapdos and priced back IN when it is about to die anyway —
  // which is Trevor's own endgame clause, closed by the term that was written
  // for the other half of his note.
  //
  // It reads the cheapest attack rather than the best on purpose, and that is
  // the opposite of what Arcanine's note asks for at first reading. "Keep Take
  // Down in reserve" is a claim about an option this does not price. What it
  // does price is being unable to act at all, and Arcanine at four Fire can
  // Flamethrower again at three — so the burn is free and Flamethrower wins on
  // the recoil alone. If the reserve half turns out to need its own term, it is
  // a separate change with its own measurement; see PLAYBOOK's Energy Funnel.
  //
  // A SECOND ARCANINE SHARPENED THIS — 26 Aug 2026. basep-6's Flames of Rage
  // discards TWO where Flamethrower discards one, against one attachment a turn,
  // and Trevor's note on it asks for the opposite ordering. The paragraph above
  // is still right; what it does not say is that a card with a CHEAP FALLBACK
  // defeats the cheapest-attack reading entirely. Arcanine keeps Quick Attack at
  // CC, so burning two of four Fire leaves it "not silenced" and unpenalised
  // while the attack it actually cannot repeat is the expensive one.
  // Measurements, and why this wants extending rather than rebuilding:
  // Playbook/AMMO.md, "Silence is measured against the CHEAPEST attack".
  discardSilence(pi, slot, f) {
    const n = f.energyCost || 0;
    if (n <= 0 || !slot) return 0;
    let left;
    if (f.flags && f.flags.discardAll) left = [];
    else {
      // Which cards go is the engine's call and it has its own rule; rather than
      // mirroring it — the failure `openercheck.js` was built out of — drop the
      // cards that hurt LEAST and accept an under-charge. Wrong in the safe
      // direction is the only kind of wrong worth building in here.
      const want = [];
      for (const [k, t] of (f.discardTypes || [])) for (let i = 0; i < k; i++) want.push(t);
      left = slot.energy.slice();
      for (const t of want) {
        let idx = -1;
        for (let i = 0; i < left.length; i++) {
          const syms = this.E.db[left[i].id] && this.E.db[left[i].id].provides || '';
          if (!t || syms.includes(t)) { if (idx < 0 || syms.length < 2) idx = i; }
        }
        if (idx < 0) idx = left.length - 1;
        if (idx >= 0) left.splice(idx, 1);
      }
      if (left.length === slot.energy.length) left = slot.energy.slice(0, -n);
    }
    const after = Object.assign({}, slot, { energy: left });
    return this.shortfallFor(after, this.top(slot));
  }

  // HOW MANY MORE TURNS OF MINE THIS SLOT GETS. A fact, with no policy in it, and
  // extracted 31 Aug 2026 because the same idea had been written four times —
  // here, in `discardSilence`, in `attachBuild`, and as a bare boolean in
  // `T_PLUSPOWER` that DISAGREED with this function on the same board.
  //
  // DOES THIS HEAL ACTUALLY BUY A TURN — the fact, not what it is worth.
  //
  // Two call sites priced a heal's rescue value off `threat >= remaining` alone,
  // which asks whether the Active is dying and never whether the heal changes
  // that. A Potion on a Chansey with 50 HP left under an incoming 80 scored the
  // full rescue bonus for lifting it to 70, and it still dies to the same
  // attack. The bonus fired hardest on exactly the boards where the card was
  // wasted, because more damage on the Active is what makes it doomed.
  //
  // Trevor, from the GBC sequel: "Potions applied to the active pokemon seem to
  // be purposefully timed for when they would prevent the opponent from killing
  // it on the next turn, rather than as soon as it would be useful."
  //
  // THE SPLIT IS `turnsLeft`/`survivesCharge`'S, DELIBERATELY. This returns the
  // fact and each call site states its own policy about it, because a third
  // heal site — `HEAL_ON_FLIP` — asks a genuinely different question
  // (`threat >= remaining - heal`, a near-miss band) and is left alone rather
  // than quietly folded in. Do not add a weight in here.
  //
  // Only the Active has a horizon: nothing on the Bench is being attacked, so
  // there is no turn to buy.
  healRescues(pi, slot, heal) {
    if (!slot || slot !== this.E.state.players[pi].active) return false;
    const threat = this.incomingThreat(pi), rem = this.remainingHP(slot);
    return threat >= rem && rem + heal > threat;
  }

  // A Pokemon acts BEFORE each of their attacks, so the attack that kills it is
  // not a turn it got: at 10 HP under a threat of 30 the answer is zero, not one.
  // Nothing on the Bench is being attacked, so it has no horizon at all.
  turnsLeft(pi, slot) {
    if (!slot || slot !== this.E.state.players[pi].active) return Infinity;
    const threat = this.incomingThreat(pi);
    if (threat <= 0) return Infinity;
    return Math.max(0, Math.ceil(this.remainingHP(slot) / threat) - 1);
  }

  // ONE TURN OF OPTIMISM, AND IT IS A POLICY RATHER THAN AN ERROR — 31 Aug 2026.
  //
  // This function read `ceil(hp / threat)` for as long as it existed, which
  // counts the attack that kills you as a turn you survived. That looks like an
  // off-by-one and correcting it was the obvious next move. It was run as an
  // experiment and it is NOT what it looks like.
  //
  // `incomingThreat` is a snapshot of the worst thing they can do RIGHT NOW,
  // and this projects it forward as a certainty — no heal, no switch, no Prize
  // taken, no coin landing wrong. That over-projection gets less true the further
  // out it reaches, and `+1` is the hedge against it: **assume you get one more
  // turn than the worst case says.**
  //
  // IT IS LOAD-BEARING, MEASURED. With the hedge removed, three claim rows flip
  // and all three sit in the same narrow band — a Pokemon that survives EXACTLY
  // one more hit, where the honest count halves the discount:
  //
  //   Zapdos     70 HP under 80   1 -> 0   already discounted; STAYS GREEN
  //   Charizard 120 HP under 80   2 -> 1   "firing at four is charged for" FLIPS
  //   Arcanine   70 HP under 40   2 -> 1   "never at exactly two Fire"      FLIPS
  //
  // Trevor's notes are what settle it. Zapdos is genuinely dying and its note
  // says burn freely; the other two are at or near FULL HP facing one hit, and
  // his notes say do not silence yourself there. A Pokemon at full HP is not
  // "about to die" in any sense a player would recognise — it is one heal, one
  // Gust or one bad coin away from a completely different board.
  //
  // SO DO NOT "FIX" THIS. If the hedge is ever revisited it is a POLICY change
  // wanting its own measurement, not a bug fix — and `turnsLeft` above is the
  // unhedged fact for anything that wants to decide differently.
  survivesCharge(pi, slot, turnsNeeded) {
    if (turnsNeeded <= 0 || slot !== this.E.state.players[pi].active) return 1;
    const left = this.turnsLeft(pi, slot);
    if (left === Infinity) return 1;
    return Math.min(1, (left + 1) / turnsNeeded);
  }

  // Best printed damage this slot could actually pay for right now, ignoring
  // Weakness, Resistance and coin flips.
  //
  // Deliberately cruder than scoreAttack, and that is the point: it is the only
  // offensive measure that means the same thing for the Active and for a benched
  // Pokemon. `potential()` scores the Active with full expected value — knockout
  // bonus and all — and a bench slot with the printed number, so comparing the
  // two directly says the Active is better even when it is worse. Any decision
  // that weighs "this one versus that one" has to use one currency, and this is
  // it. See the retreat case in scoreAction.
  //
  // WEAKNESS AND RESISTANCE ARE APPLIED — 13 Aug 2026, from Trevor's note that
  // the bot was not reading them into its damage predictions. Three of the four
  // forecast paths already went through `computeDamage`; this one did not, and
  // it is the one the retreat decision runs on.
  //
  // The consequence was specific rather than diffuse. "Would the Pokemon I am
  // swapping to hit harder than the one I am swapping out?" was answered in
  // printed numbers, so a 30-damage attack that is really 60 against the thing
  // actually standing opposite counted as 30, and a 40 that is really 10 counted
  // as 40. Both sides of the comparison were wrong in different directions at
  // once, which is why it never looked like a constant bias.
  //
  // Still printed damage rather than expected value, deliberately: this exists
  // to be ONE currency shared across slots that cannot all be priced in EV (see
  // the Active/Bench note in AI.md), and both operands are now measured against
  // the same defender, so the comparison is honest even though the unit is
  // coarse. Making it EV is a separate change and wants its own measurement.
  bestAffordableDamage(pi, slot) {
    if (!slot) return 0;
    const E = this.E;
    const def = E.state.players[1 - pi].active;
    let best = 0;
    (this.top(slot).attacks || []).forEach((a, i) => {
      if (!E.costSatisfied(slot, a.cost)) return;
      // `slotPrintedDamage`, not `aiParseDamage` — 31 Aug 2026. The unit here is
      // deliberately printed damage rather than expected value (see the comment
      // above), but a Lapras on three Water PRINTS 30 and this read 10. That is
      // not coarseness, it is the same wrong fact `potentialOf` was holding, and
      // leaving it here would mean the game answers "how hard does this hit"
      // two different ways depending on which decision is asking.
      const base = this.slotPrintedDamage(slot, null, i);
      // No defender is the setup/knockout gap, not a matchup — fall back to the
      // printed number rather than scoring every attack at zero.
      const d = def ? E.computeDamage(slot, def, base).dmg : base;
      if (d > best) best = d;
    });
    return best;
  }

  // Expected damage our Active would land on a chosen defender, which may be a
  // Pokemon that is not currently Active — that is the whole point. Used to ask
  // "if I drag this one up, can I actually punish it?", a question the bot had
  // no way to pose before: `forecast` only ever looks at who is opposite now.
  bestDamageAgainst(pi, defSlot) {
    const E = this.E, me = E.state.players[pi];
    if (!me.active || !defSlot) return 0;
    let best = 0;
    (this.top(me.active).attacks || []).forEach((atk, i) => {
      if (!E.canUseAttack(pi, i).ok) return;
      const raw = this.rawOutcomes(me.active, defSlot, i);
      let exp = 0;
      for (const o of raw.outcomes) exp += (o.p || 0) * E.computeDamage(me.active, defSlot, o.dmg).dmg;
      if (exp > best) best = exp;
    });
    return best;
  }

  // --------------------------------------------------------- power score ---
  // How good a place to dump damage counters is this Pokemon? Trevor's
  // recollection of how the GBC game played Alakazam, which turns out to be
  // strategically sound: prefer high max HP and low offensive value. A Chansey
  // at 120 HP with feeble attacks is the ideal sink; an Electabuzz is not.
  //
  // Note it deliberately uses MAX HP, not remaining HP — the GBC bot happily
  // piled counters onto already-injured Pokemon, and that is correct. What
  // matters is total capacity to absorb, and the "don't Knock Out" rule already
  // stops it going too far. `potential()` supplies the offensive term, so this
  // reuses the same expected-value machinery as everything else.
  sinkScore(pi, slot) {
    const hp = this.top(slot).hp;
    const threat = Math.max(0, this.potential(pi, slot).best);
    return hp / (10 + threat);
  }

  // How close the whole team is to being able to attack. Used as a strictly
  // increasing yardstick for Energy-moving Powers, so they cannot loop.
  // The Active is weighted heaviest because it is the one that swings this turn;
  // a benched Pokemon losing its own attack costs nothing yet, but is not free
  // either, which is what stops Energy sloshing around the Bench.
  teamReadiness(pi) {
    const E = this.E, me = E.state.players[pi];
    let v = 0;
    for (const sl of E.allSlots(pi)) {
      const w = (sl === me.active) ? 4 : 1;
      const pot = this.potential(pi, sl, null);
      v += w * (Math.max(0, pot.best) * 0.1 - Math.min(pot.short, 9) * 10);
    }
    return v;
  }

  scorePower(pi, a) {
    const E = this.E, W = this.W;
    const slot = E.allSlots(pi).find(x => x.uid === a.uid);
    if (!slot) return -Infinity;

    switch (a.kind) {
      // ENERGY_AS is passive as of 16 Aug 2026 — Charizard's Energy Burn is
      // simply always on, so there is no action to score and no flag to flip.
      // `bestAttackScore` already sees Fire symbols wherever the engine does.
      // ---- Job 13, the promo Powers ----
      case 'TOP_DECK_SWAP': {
        // Special Delivery. Net card count is UNCHANGED — draw one, put one back —
        // so this is worth a look at the top of the deck plus the option to bury
        // the worst card in hand, not a draw. Priced well below drawCard for that
        // reason, and above zero because it is free and repeats every turn.
        //
        // Trevor: "the card just drawn from the deck [can] be the one returned if
        // it's not desirable", so the floor is a free peek and the ceiling is
        // cycling a dead card. A bigger hand has more dead weight to bury.
        const me = E.state.players[pi];
        if (!me.deck.length) return -Infinity;
        return W.drawCard * 0.35 + Math.min(me.hand.length, 6) * 0.4;
      }
      case 'CLEAR_STATUS_BOTH_ACTIVE': {
        // Solar Power. Worth exactly what it removes, and it removes from BOTH
        // Actives — so a board where only the opponent is afflicted is a card that
        // helps THEM and must score negative, which is the half a naive "count the
        // statuses" version gets backwards.
        const mine = E.state.players[pi].active;
        const theirs = E.state.players[1 - pi].active;
        // PRICED WITH FULL HEAL'S OWN NUMBERS rather than a new weight. Solar
        // Power clears exactly what Full Heal clears, and the first draft of this
        // reached for a W.statusClear that does not exist — which would have made
        // the whole Power score NaN in silence, the failure this file warns about
        // two hundred lines up. Check a weight against the W block, never memory.
        const worth = sl => {
          if (!sl) return 0;
          const st = sl.status;
          return (st.paralyzed || st.asleep ? 24 : 0) + (st.confused ? 16 : 0)
               + (st.poisoned ? (sl.poisonDamage || 10) : 0);
        };
        const count = sl => sl ? Object.keys(sl.status).filter(k => sl.status[k]).length : 0;
        const gain = worth(mine) - worth(theirs);
        // Nothing to clear on either side is a wasted use of a once-a-turn Power,
        // not a neutral one — it is spent for the turn either way.
        return count(mine) + count(theirs) === 0 ? -1 : gain;
      }
      case 'MOVE_DAMAGE': {
        // Gengar's Curse moves the OPPONENT's counters, so both slots live on
        // the other side of the board. Looking them up on ours returned
        // undefined and scored -Infinity, which is a Power the bot would simply
        // never have used — the Energy Burn failure again. See ENGINE.md.
        const pw = E.powerOf(slot) || {};
        const side = pw.side === 'opponent' ? 1 - pi : pi;
        const from = E.allSlots(side).find(x => x.uid === a.from);
        const to = E.allSlots(side).find(x => x.uid === a.to);
        if (!from || !to) return -Infinity;

        if (pw.side === 'opponent') {
          // Curse. Piling damage onto something already hurt is how it wins a
          // Prize outright; short of that, concentrating damage is mildly good
          // because it shortens the next Knock Out.
          const lethal = to.dmg + 10 >= this.top(to).hp;
          if (lethal) {
            // Same inversion as scoreAttack had: winning means OUR pile empties,
            // and emptying their board wins outright too. See the note there.
            const mine = E.state.players[pi], them = E.state.players[1 - pi];
            const wins = mine.prizes.length <= 1
              || (them.bench.length === 0 && to === them.active);
            return wins ? W.lastPrize : W.knockout + 12;
          }
          return 4 + Math.min(to.dmg, 40) * 0.12;
        }

        // Never move damage the wrong way: onto something more valuable, or off
        // a Pokemon that was in no danger to begin with.
        const gain = this.sinkScore(pi, to) - this.sinkScore(pi, from);
        if (gain <= 0) return -Infinity;

        // The point of the Power is keeping something alive. Weight the move by
        // how close the source is to dying and by how much it is worth keeping.
        const srcHP = this.remainingHP(from);
        const active = E.state.players[pi].active;
        const urgency = from === active ? this.incomingThreat(pi) : 0;
        const doomed = urgency >= srcHP ? 1 : 0;          // dies next turn if nothing changes
        const worth = Math.max(0, this.potential(pi, from).best);

        let score = gain * 2;
        if (doomed) score += W.knockout * 0.35 + worth * 0.2;
        else if (urgency > 0 && urgency >= srcHP - 20) score += worth * 0.1;
        return score;
      }

      case 'HEAL_ON_FLIP': {
        const to = E.allSlots(pi).find(x => x.uid === a.to);
        if (!to) return -Infinity;
        // Half a counter on average, and worth more on something about to die.
        const p2 = E.powerOf(slot) || {};
        const heal = Math.min((p2.n || 1) * 10, to.dmg);
        const urgent = to === E.state.players[pi].active
          && this.incomingThreat(pi) >= this.remainingHP(to) - heal;
        return 0.5 * (heal / 10 * W.healPer10) + (urgent ? 6 : 0);
      }
      case 'CHANGE_OWN_TYPE': {
        // Measured the same way Energy Burn is: change it, ask how much better
        // our attacks got, change it back. Never guessed from the type chart.
        const before = (() => { const b = this.bestAttackScore(pi); return b.score === -Infinity ? 0 : b.score; })();
        const saved = slot.typeAs;
        slot.typeAs = a.type;
        const after = (() => { const b = this.bestAttackScore(pi); return b.score === -Infinity ? 0 : b.score; })();
        slot.typeAs = saved;
        return after - before;
      }
      case 'STEP_IN': {
        // Free, so it is worth taking whenever the Active is in trouble or
        // Dragonite simply hits harder than what is up there.
        const me = E.state.players[pi];
        if (!me.active) return -Infinity;
        const danger = this.incomingThreat(pi);
        const dying = danger >= this.remainingHP(me.active);
        const mine = Math.max(0, this.potential(pi, slot).best);
        const theirs = Math.max(0, this.potential(pi, me.active).best);
        return (dying ? W.dangerSwap : 0) + (mine - theirs) * 0.3;
      }
      // Peek is a no-op for a bot that already reads full state — it would be
      // spending its Power to learn something it knows. Deliberately worthless
      // rather than accidentally unscored. See RULINGS.md.
      // ---- Job 10c, the ordinary Powers ----------------------------------
      // All four weights are first guesses priced off existing weights and all
      // four are on PROVISIONAL.
      case 'SEARCH_EVOLUTION_TO_HAND': {
        // A tutor for ANY Evolution card, which is worth far more when it
        // fetches something that fits the board than when it fetches a card to
        // look at. Priced as a draw, plus a real bonus for a live one — and the
        // pick is filled in here so the engine's random fallback is never used.
        const me = E.state.players[pi];
        const inPlay = new Set(E.allSlots(pi).map(sl => this.top(sl).name));
        const pool = me.deck.filter(x => {
          const c = this.db[x.id];
          return c && c.kind === 'pokemon' && c.stage !== 'Basic';
        });
        if (!pool.length) return -Infinity;
        let best = pool[0], bestFits = false;
        for (const x of pool) {
          const fits = inPlay.has(this.db[x.id].evolvesFrom);
          if (fits && !bestFits) { best = x; bestFits = true; }
        }
        a.pickUid = best.uid;
        return W.drawCard + (bestFits ? 10 : 0);
      }
      case 'STATUS_COIN_EITHER_POWER': {
        // HALF THE TIME IT LANDS ON YOU, and the bot has to see that or it will
        // fire it every turn for free. Worth the condition against them, minus
        // the same condition against us, both halved — which correctly makes it
        // close to worthless in the abstract and genuinely good when their
        // Active is a threat and ours is expendable.
        const pw = E.powerOf(slot) || {};
        const key = STATUS_VALUE[pw.status];
        if (!key) return -Infinity;
        const me = E.state.players[pi], them = E.state.players[1 - pi];
        if (!me.active || !them.active) return -Infinity;
        let sc = 0.5 * W[key];
        // Confusing or sleeping our OWN Active costs what it costs us: the
        // attack we were going to make with it.
        sc -= 0.5 * W[key];
        // ...so the whole value is in the asymmetry. A spent or worthless Active
        // has nothing to lose, and one about to attack has everything.
        const mineWorth = this.bestAttackScore(pi).score;
        if (mineWorth <= 0) sc += 0.5 * W[key];
        return sc;
      }
      case 'DISCARD_THEN_DRAW': {
        // A card for a card, so it is only worth the DIFFERENCE between the
        // worst card in hand and an unknown one — near zero on a good hand and
        // real on a hand of dead Energy. Reuses the junk-picking the Trainers
        // already do rather than inventing a second opinion about what is junk.
        const me = E.state.players[pi];
        if (!me.hand.length || !me.deck.length) return -Infinity;
        const junk = this.junkiestInHand(pi);
        if (junk === null) return -Infinity;
        a.discardUid = junk.uid;
        return junk.score * W.drawCard;
      }
      case 'PRIZE_SWAP':
        // Deliberately scored at -Infinity, and this is a DECLARATION rather than
        // an oversight — the same call the Peek ruling makes, for the same
        // reason one level along. Swapping a face-down Prize for a face-down
        // card changes nothing this bot can perceive: it reads full engine state,
        // so it already knows both cards, and it has no notion of hiding
        // information from an opponent who also cannot be surprised.
        //
        // It becomes worth scoring the day the AI models what the opponent knows,
        // or the day Here Comes Team Rocket! turns the Prizes face up — which is
        // a card in this same set and lands in 10e. See Rulings/PEEK-CLAIRVOYANCE.md.
        return -Infinity;
      case 'PEEK': return -Infinity;
      case 'COWARDICE': {
        // A rescue that costs everything attached. Only when it is about to die
        // and there is something worth saving.
        const me = E.state.players[pi];
        const danger = slot === me.active ? this.incomingThreat(pi) : 0;
        if (danger < this.remainingHP(slot)) return -Infinity;
        return 8 - slot.energy.length * W.energyDiscard * 0.5;
      }
      // Rain Dance. Mechanically an Energy attachment that costs nothing, so it
      // reuses the attachEnergy scoring and adds a premium for being free — the
      // bot should always prefer the free attachment over spending its one.
      case 'EXTRA_ATTACH': {
        const to = E.allSlots(pi).find(x => x.uid === a.to);
        const inst = E.state.players[pi].hand[a.hand];
        if (!to || !inst) return -Infinity;
        // Same valuation as a normal attachment, plus a premium: this one is
        // free and does not spend the turn's attachment. Shared deliberately —
        // see attachValue.
        return this.attachValue(pi, to, inst.id) + W.attachBuild;
      }

      // Energy Trans. Scored against a single board-wide figure that the move
      // must strictly improve.
      //
      // This is deliberately not a source-versus-destination comparison. Two
      // earlier versions were, and both were wrong in opposite directions: one
      // weighed a benched Pokemon's loss as heavily as the Active's gain and so
      // refused to feed a starving Active, and the fix for that ignored the
      // source's loss entirely — which made A→B and B→A BOTH look like gains and
      // sent the bot into an infinite shuffle. It moved Energy 44,000 times in
      // 80 games and hung eleven of them.
      //
      // A scalar that must strictly increase cannot cycle: the number of Energy
      // arrangements is finite, so there is nowhere for an endless sequence of
      // improvements to go.
      case 'MOVE_ENERGY': {
        const from = E.allSlots(pi).find(x => x.uid === a.from);
        const to = E.allSlots(pi).find(x => x.uid === a.to);
        if (!from || !to) return -Infinity;
        const def = E.powerOf(E.allSlots(pi).find(x => x.uid === a.uid)) || {};
        // In play — the Energy is already attached. See isBasicEnergyOf.
        const k = from.energy.findIndex(e => E.isBasicEnergyOf(e, def.energy, true));
        if (k === -1) return -Infinity;

        const before = this.teamReadiness(pi);
        const moved = from.energy.splice(k, 1)[0];
        to.energy.push(moved);
        const after = this.teamReadiness(pi);
        to.energy.pop();
        from.energy.splice(k, 0, moved);

        if (after <= before + 1e-6) return -Infinity;
        return W.attachBuild * (after - before);
      }

      // Buzzap. Unlike the other Powers this one COSTS something real — a Prize —
      // so the bar is high and the default is don't.
      case 'BUZZAP': {
        const me3 = E.state.players[pi], opp = E.state.players[1 - pi];
        const to = E.allSlots(pi).find(x => x.uid === a.to);
        if (!to) return -Infinity;

        // Never hand over the Prize that ends the game. This is a hard rule, not
        // a preference — Buzzap can lose on the spot.
        if (opp.prizes.length <= 1) return -Infinity;
        // Nor the last Pokemon standing, nor a Pokemon that is doing fine.
        if (!me3.bench.length && me3.active === slot) return -Infinity;

        // The Prize is only cheap when it was going to be lost anyway. If the
        // Electrode survives the turn, sacrificing it is just giving one away.
        const doomed = slot === me3.active
          && this.remainingHP(slot) <= this.incomingThreat(pi);
        if (!doomed) return -Infinity;

        // Two Energy of a chosen type, so value it as two attachments onto the
        // target — but only counting types that actually get it closer to
        // attacking, which is what stops it picking a useless type.
        const before = this.potential(pi, to, null);
        const fake = { id: to.stack[0].id, uid: -1, asEnergy: a.type + a.type };
        to.energy.push(fake);
        const after = this.potential(pi, to, null);
        to.energy.pop();

        const gain = Math.max(0, before.short - after.short);
        if (gain <= 0) return -Infinity;
        return W.attachBuild * gain * 2 + Math.max(0, after.best - Math.max(0, before.best)) * W.attachEnable;
      }

      default: return -Infinity;
    }
  }

  // Score an attack as if `slot` were Active (used for bench planning).
  scoreAttackHypothetical(pi, slot, idx) {
    const E = this.E, p = E.state.players[pi];
    // Both fallbacks are the printed-damage currency, so both read the Energy
    // actually on the slot. See `slotPrintedDamage`.
    if (p.active === slot) {
      const chk = E.canUseAttack(pi, idx);
      return chk.ok ? this.scoreAttack(pi, idx) : this.slotPrintedDamage(slot, null, idx);
    }
    return this.slotPrintedDamage(slot, null, idx);
  }

  // ------------------------------------------------------------ action score
  scoreAction(pi, a) {
    const E = this.E, W = this.W;
    const me = E.state.players[pi], you = E.state.players[1 - pi];

    switch (a.t) {
      case 'attack': {
        let sc = this.scoreAttack(pi, a.idx, a.opts);
        // Porygon deals no damage with either Conversion, so the whole value is
        // in picking a USEFUL type. Without this the bot would choose at random
        // among options that all score the same nothing.
        // Fill in the destination for a self-switch, for the same reason and by
        // the same pattern as `scoreOnPlay`: the engine's fallback is a seeded
        // random pick, so a choice nobody makes is a choice made badly.
        // AND THE SAME FOR DRAGGING ONE OF THEIRS. Identical shape to the
        // self-switch below and to `scoreOnPlay`: the engine's fallback is a
        // seeded random pick, so a choice nobody makes is a choice made badly.
        // `attackVariants` deliberately does not enumerate this one, so there is
        // no per-option action to score and the pick has to be filled in here.
        if (me.active && E.state.players[1 - pi].bench.length) {
          const scr = this.script(me.active, a.idx);
          if (scr.some(v => v.v === 'SWITCH_DEFENDER_CHOOSE' || v.v === 'SWITCH_DEFENDER_CHOOSE_ON_FLIP')) {
            a.opts = a.opts || {};
            a.opts.bench = this.bestDragTarget(pi).bench;
          }
        }
        if (me.active) {
          const scr = this.script(me.active, a.idx);
          const sv = scr.find(v => v.v === 'SWITCH_SELF_CHOOSE');
          if (sv && me.bench.length) {
            const sw = this.bestSelfSwitch(pi);
            if (sw) {
              a.opts = a.opts || {};
              a.opts.bench = (sv.optional && sw.gain <= 0) ? -1 : sw.bench;
            }
          }
        }
        if (a.opts && a.opts.type && me.active) {
          const scr = this.script(me.active, a.idx);
          const wk = scr.some(v => v.v === 'CONVERT_DEF_WEAKNESS');
          const rs = scr.some(v => v.v === 'CONVERT_SELF_RESISTANCE');
          // TWO BONUSES THAT PULL OPPOSITE WAYS, and on Cool Porygon they were
          // both being charged against ONE chosen type. Weakness wants a type MY
          // team deals; Resistance wants the type THEY deal. Those are different
          // types in every matchup that matters, so scoring both made the choice
          // incoherent — it rewarded a type for being simultaneously mine and
          // theirs, which is only true in a mirror.
          //
          // When a card does both (Texture Magic, and nothing else in the era),
          // the chosen type governs the RESISTANCE and the Weakness half rides
          // along, so only the Resistance bonus is real. That also matches what
          // the card is played for: Trevor's note is "become resistant to its
          // opponent, and then use 3-D Attack".
          if (wk && !rs) {
            const mine = new Set(E.allSlots(pi).map(x => this.top(x).type));
            if (mine.has(a.opts.type)) sc += 12;
          }
          if (rs) {
            const theirs = E.state.players[1 - pi].active;
            if (theirs && this.top(theirs).type === a.opts.type) {
              // A RESISTANCE IS A BARRIER THAT DOES NOT EXPIRE, and this was a
              // flat 10 — the cliff sniff test again, worth the same whether it
              // denied nothing or denied every point coming at you.
              //
              // Priced in the currency that already exists rather than a new
              // constant: `softShield` values a ONE-TURN reduction of n as
              // min(n, danger) / 20 * shieldSelf, and era Resistance is always
              // -30. The only thing added here is persistence.
              //
              // Trevor confirmed the mechanic on 26 Aug: it holds while the
              // Pokemon stays Active, which is what makes the multiplier legal.
              // Capped at three turns because an uncapped one is unbounded the
              // moment the reduction meets or beats the incoming damage — the
              // Pokemon becomes immortal against THAT attacker and the score
              // runs away, and a cap is honest where an infinity is not.
              const cut = 30;
              const danger = this.incomingThreat(pi);
              const perTurn = Math.min(cut, danger) / 20 * W.shieldSelf;
              const hp = me.active ? this.remainingHP(me.active) : 0;
              const after = Math.max(0, danger - cut);
              const holds = after > 0 ? Math.ceil(hp / after) : 3;
              // THE FLOOR IS NOT A FUDGE, and leaving it out reintroduced the very
              // cliff this block removes — at the other end. Against an opponent
              // holding no Energy the threat is 0, so every type priced at exactly 0,
              // and the bot picked whichever came first in the list. A powertest that
              // had guarded this since 14 Aug went red immediately and correctly.
              //
              // Matching their type is INFORMATION and is worth something even when
              // the denial is currently nothing, because they will attach Energy. The
              // threat scales the size; the floor only keeps the ordering.
              sc += 2 + perTurn * Math.min(3, Math.max(1, holds));
            }
          }
        }
        return sc;
      }

      case 'power': return this.scorePower(pi, a);
      case 'answer': {
        // Answering a question the OPPONENT asked, during their turn. The first
        // of these; the mechanism is general and this switch grows per card.
        const q = this.E.state.pendingAsk;
        if (!q) return -Infinity;
        if (q.kind === 'CAT_PUNCH') {
          // The bot is the DEFENDER here, naming which of its own Benched Pokemon
          // eats 20. Without this case the switch below returns 0 for every option
          // and it picks at random — the silent-failure surface exactly, and the
          // reason Trevor's note on this card is a spec rather than a nicety:
          // "as long as the bot doesn't do anything obviously dumb like killing
          // something with it or picking a pokemon it was actively investing in."
          //
          // Those two sentences are the two terms, and nothing more is needed. No
          // call to promoteValue: it re-enters scoreAttack for the Active slot and
          // that trap has cost this file a session once already (AI-INVARIANTS).
          // Remaining HP and Energy attached answer both halves on their own.
          const b = me.bench[a.value];
          if (!b) return -Infinity;
          const dmg = (q.ctx && q.ctx.dmg) || 20;
          let sc = 0;
          if (this.remainingHP(b) <= dmg) sc -= W.selfKO;                  // never feed it a kill
          sc -= b.energy.length * W.energyDiscard;                         // nor the one being built
          sc -= (this.top(b).stage === 'Basic' ? 0 : W.knockout * 0.15);   // nor an evolved card
          // AND A TIEBREAK THAT IS NOT POSITIONAL. Two undamaged Basics with no
          // Energy on them scored an identical 0 and the bot took whichever came
          // first — flat with a cliff at the end, the sniff test this tree keeps
          // paying for. 20 damage is a bigger share of a 40 HP Voltorb than of a
          // 60 HP Growlithe, so the hit goes where it costs the least. Small
          // enough that the three terms above always outrank it.
          sc -= (dmg / Math.max(10, this.remainingHP(b))) * W.knockout * 0.1;
          return sc;
        }
        if (q.kind === 'CONVERT_WEAKNESS') {
          // Texture Magic's Weakness half, asked of the ATTACKER rather than the
          // opponent. This is the bonus that used to ride on the attack's own
          // type option and pulled against the Resistance choice; it lives here
          // now, where it is a decision of its own and can be priced properly.
          //
          // Worth a type MY side can actually exploit. Colorless is excluded by
          // the card, so a Colorless-only board genuinely has nothing to gain and
          // should decline rather than set a Weakness at random — declining is
          // the printed option ("you may") and 0 beats a wrong guess.
          if (!a.value) return 0.5;                     // "Leave it", just above nothing
          const mine = E.allSlots(pi).map(x => this.top(x).type).filter(t => t !== 'C');
          const hits = mine.filter(t => t === a.value).length;
          return hits ? 12 + 2 * (hits - 1) : 0;
        }
        if (q.kind === 'CHALLENGE') {
          const mine = this.challengeGain(pi, true);
          const theirs = this.challengeGain(1 - pi, false);
          // Accepting when it gains you more than them; declining otherwise —
          // and declining hands them two cards, which is priced in.
          const worth = (mine - theirs) * this.W.benchMore - 2 * this.W.drawCard;
          return a.value ? worth : -worth;
        }
        return 0;
      }

      case 'attachEnergy': {
        const slot = E.allSlots(pi).find(x => x.uid === a.target);
        if (!slot) return -Infinity;
        const inst = me.hand[a.hand];
        const before = this.potential(pi, slot, null);
        const after = this.potential(pi, slot, inst.id);

        // SURPLUS. The target can already pay for every attack it owns and this
        // card buys it no new one, so the attachment achieves nothing at all.
        // It was still being made: the branches below have a floor of 0.4 and
        // then add 4 for the Active, which clears the 0.5 action threshold, so
        // the bot attached Energy every single turn whether or not it helped.
        // 18% of its attachments were this.
        //
        // Hold it instead. The ATTACHMENT is one per turn and expires, but the
        // CARD does not — and a Pokemon that actually needs this type turns up
        // soon enough. Measured: when this fires there is never a better target
        // on the board (0% misdirected in aitest.js), so the choice really is
        // attach-or-keep and not attach-here-or-there.
        //
        // Two exceptions, both cases where "spare" Energy is not spare:
        //   - it cannot cover its own retreat cost yet, so the Energy is an
        //     escape route rather than an attack cost;
        //   - an attack that scales with leftover Energy would improve, which
        //     shows up as after.best rising and so is already excluded.
        // INERT is the same rule one step wider — 16 Aug 2026, from Trevor's
        // note that the bot still attaches Energy its Pokemon cannot use "when
        // no other options exist".
        //
        // SURPLUS was "the target needed nothing". INERT is "the target needed
        // something else": a Grass onto a Pokemon whose only cost is RRR leaves
        // it exactly as short as it was, buys no attack, and strands the card
        // where it can never be spent. The old test only caught `short === 0`,
        // so the whole of this case fell through to the branches below — which
        // floor at 0.4 and then add 4 for the Active, clearing the 0.5 action
        // threshold every time. Measured at **9% of all attachments** by
        // `aitest.js`, against 3% for the surplus case that was already fixed.
        //
        // Stated as "no progress on either axis" rather than as a second
        // special case, and it subsumes the old one exactly: when `before.short`
        // is 0, `after.short >= before.short` is always true.
        //
        // Trevor wondered whether this was the bot planning for a future
        // evolution. It is not — `potential()` reads only the card on top of the
        // stack and the AI has no lookahead at all — so there is nothing here
        // worth preserving.
        // THE ESCAPE-ROUTE EXCEPTION IS THE ACTIVE'S ALONE — and this is where
        // the whole of the above actually lives or dies. Measured: with the
        // exception applying board-wide, the wider rule suppressed 218 inert
        // attachments down to 190, which is nothing. Removing the exception
        // entirely took it to 0. Every single one was being waved through on
        // "but it could pay for a retreat".
        //
        // Only the Active can retreat, and only the Active can be forced to. A
        // benched Pokemon's retreat cost is a bill it will not be handed until
        // it is Active — at which point the Energy can be attached then, to a
        // slot that by then may actually want it. So the exception is real, and
        // it is one slot wide.
        const noProgress = after.short >= before.short && after.best <= before.best;
        const isActive = slot === me.active;

        // AMMUNITION IS NOT SURPLUS — the third exception to this rule, and the
        // first that applies on the Bench as well as in the Active spot. An
        // attack that discards its own Energy to fire turns spare Energy into
        // rounds, and the bot hard-capped Charizard at four: measured 21 Aug
        // 2026, a fifth Fire scored -2 whether the Charizard was Active or
        // benched. It could never fire Fire Spin twice in a row, which is the
        // deck.
        const stocking = this.E.energyTotal(slot) < this.ammoSymbols(slot);
        // Symbols, not cards, and the LIVE cost rather than the printed one —
        // `retreatCostOf` is what actually gets charged, and it already knows
        // about Dodrio. Both halves of that were wrong here before 17 Aug and
        // both were invisible: a Double Colorless read as one, and a benched
        // Dodrio was not consulted at all.
        const needsEscape = isActive
          && this.E.energyTotal(slot) < this.E.retreatCostOf(slot);

        // A POKEMON THAT IS ABOUT TO BECOME SOMETHING ELSE IS NOT PAID UP — the
        // fourth exception, 28 Aug 2026, and the one AI.md's open item 4 has been
        // waiting for by name. `noProgress` asks whether the card buys the SLOT a
        // new attack; a Gloom holding two Grass can already pay for Foul Odor, so
        // a third Grass scored `attachSurplus` and the bot refused it — even with
        // a Vileplume in hand needing three.
        //
        // That is why open item 4 says a readiness penalty on `evolve` must not
        // ship alone: evolving was the ONLY thing that unblocked the Energy, so
        // penalising it without this would strand Vileplume at two Grass forever.
        //
        // BOUNDED BY THE EVOLUTION'S OWN COST, so it is not a licence to hoard: it
        // stops the moment the evolved form could pay for the attack it is
        // actually trying to reach. That is Trevor's "get energies close to that
        // point before actually evolving", and it composes with the readiness term
        // in `case 'evolve'` — that one fires at one-short, so the card evolves a
        // turn before this exception would have closed and attaches onto the
        // evolved form instead.
        //
        // `destShort`, NOT `short` — 1 Sep 2026, and this is the THIRD of the
        // three places one idea is asked. `evolve` measures readiness to the
        // destination and `attachBuild` measures the road to it; if this guard
        // kept asking about the cheapest attack the evolution merely OWNS, it
        // returns `attachSurplus` before either of them is ever reached and the
        // other two changes do nothing at all. Measured exactly that way first:
        // an Abra on two Psychic with a Kadabra in hand still scored -2.00 after
        // both other sites were fixed, because Recover costs 2 and Super Psy
        // costs 3. **When a rule is asked in three places, find all three before
        // you measure** — this file's own recurring lesson, and it cost a wrong
        // reading of a claim row here.
        const evoId = this.evolutionRoadFor(pi, slot);
        const evolving = !!evoId && this.roadWant(pi, slot, evoId) > 0;

        // A CARD HAS A ROAD TO ITS OWN BIGGER ATTACK, exactly as it has one to its
        // evolution — the fifth exception, 5 Sep 2026, from Trevor's note that a
        // Fire went to a Zapdos that could not use it while a Moltres sat unfed.
        //
        // `noProgress` reads `short`, which counts to the cheapest attack the card
        // can ALREADY pay for — so the moment any attack is affordable it pins at
        // zero and this rule declares the card finished forever. A Fossil Moltres
        // holding one Fire can pay Wildfire (R, no damage) and is therefore never
        // given a second Fire, so Dive Bomb (RRRR, 80) is unreachable in every game
        // that has ever been played. `destShort` is the fact that was missing and it
        // already existed: 3 on that Moltres, falling to 2 with the Fire on.
        //
        // MEASURED BEFORE BUILDING: 35 terminal cards in the four live sets have a
        // road closed this way — Magneton, Kabutops, Rhydon, Dugtrio, Raichu, both
        // Moltres. It is not the rare tail it looks like.
        //
        // WHY THE WALL GATE. `attackThreatens` did not need one where it is already
        // used, and its comment says why: a wall is a terminal Basic and is never an
        // evolution target, so the wall case could not reach that predicate. Here it
        // can. Standing there IS Chansey's job and Scrunch IS the plan — charging it
        // to Double-edge would be the bot picking up the kamikaze pattern by
        // accident, which is a decision nobody has made. `wallPlanFloor` holds back
        // exactly Chansey and Kangaskhan, which are the two cards Trevor's workbook
        // names as walls.
        // WIDENED TO `upShort` — 6 Sep 2026, Trevor. `destShort` pins the same way
        // `short` does the moment any *threatening* attack is payable, so the first
        // version of this rule freed a Moltres (Wildfire deals nothing) and did
        // nothing at all for a Hitmonchan on one Fighting, whose Jab does 20 and
        // whose Special Punch does 40 two Energy away. His answer: *"Hitmonchan in
        // particular is a very good opener because Jab comes at a single energy cost
        // and Special Punch can be powered up in just a couple turns."*
        //
        // AND SELF-DAMAGE IS NOT EXCLUDED, which was the shape I proposed and he
        // corrected. A Magneton that stopped charging at Sonicboom can never press
        // the button: *"it wants to be used at a specific time, but in order to do
        // that it needs to be ready to be used at any given moment... It serves no
        // one if its owner had stopped powering it up at Sonicboom."* **Charging and
        // firing are different decisions.** Kamikaze Timing is about WHEN to fire and
        // belongs in `scoreAttack`; this road only says the card is worth feeding.
        // Chansey is held by the wall gate below rather than by its Double-edge, and
        // that is the correct discriminator: Chansey's job is standing there.
        const charging = after.upShort < before.upShort
                      && this.wallHere(pi, slot) <= W.wallPlanFloor;

        if (noProgress && !needsEscape && !stocking && !evolving && !charging) return W.attachSurplus;

        // The surplus rule above is deliberately NOT in attachValue: it is about
        // whether to spend the once-per-turn attachment, and Rain Dance does not
        // spend one. Everything about the attachment's actual worth is shared.
        return this.attachValue(pi, slot, inst.id);
      }

      case 'evolve': {
        const slot = E.allSlots(pi).find(x => x.uid === a.target);
        if (!slot) return -Infinity;
        const oldC = this.top(slot), newC = this.db[me.hand[a.hand].id];
        let s = W.evolveBase + Math.max(0, newC.hp - oldC.hp) * W.evolveHP;
        if (slot === me.active) s += 6;

        // READY, NOT MERELY ABLE — 28 Aug 2026, Trevor, from the GBC game: "it
        // was usually careful not to evolve unless it was one energy away from
        // being able to use the evolution's cheapest attack of value."
        //
        // This is AI.md open item 4, which measured `evolve` at a flat 31.0
        // whether the target held one Energy or three, and Vileplume arriving
        // unable to attack. **It must not ship without the attach half** — see the
        // fourth exception in `case 'attachEnergy'` — because until that landed,
        // evolving was the only thing that unblocked the Energy.
        //
        // "Cheapest attack of value" is `potentialOf().destShort` — **and it was
        // `.short` until 1 Sep 2026, which is not the same thing on 24 of the
        // era's Evolutions.** `short` is the cheapest attack the card OWNS;
        // `destShort` is the cheapest one it is trying to REACH. A Kadabra
        // targeting Recover (2) is ready one Energy before a Kadabra targeting
        // Super Psy (3), and Trevor's rule is the second one.
        //
        // Trevor, 1 Sep 2026, proposing the general rule rather than a per-card
        // number: *"the AI prices its pre-evolution energies at what the evolved
        // card needs for its cheapest offensive (or otherwise specified) attack,
        // minus one (because that last energy can be attached on the turn it
        // evolves)."* The minus-one half is the `> 1` below and shipped 28 Aug;
        // this is the other half. *[Why "offensive" alone is wrong, and the
        // fallback when nothing threatens →](`attackThreatens`)*
        //
        // A PENALTY AND NOT A VETO, which is Trevor's "usually". Everything above
        // can outvote it — a status wipe is 14, a big HP jump is real, and an ON_PLAY
        // Power is priced on its own. Evolving early to survive is still allowed;
        // it just stops being free.
        // `roadWant` is `destShort` minus one Energy per remaining evolution
        // step, because each step is a turn and each turn brings an attachment.
        // At depth 1 it is exactly the old `readiness > 1` test — see its comment
        // for Trevor's Abra and Machop numbers.
        const want = this.roadWant(pi, slot, newC.id);
        if (want > 0) s -= want * W.evolveEarly;
        // evolving also wipes Special Conditions
        const st = slot.status;
        if (st.asleep || st.paralyzed || st.confused) s += 14;
        if (st.poisoned) s += 8;
        // Job 10c. Dark Golbat is worth playing for Sneak Attack alone, and Dark
        // Dragonite arrives with two Basics. Without this the bot evolves into
        // them at the plain rate and lets the engine pick their targets.
        s += this.scoreOnPlay(pi, a, newC.id);
        // HAY FEVER LOCKS YOUR OWN TRAINERS. "No Trainer cards can be played"
        // names no owner, so evolving into a Dark Vileplume switches off the
        // Trainers in your own hand as well as theirs. Without this the bot
        // plays it happily and then finds half its hand illegal.
        //
        // Priced off what it is actually giving up — the Trainers it is holding —
        // rather than a flat penalty, so it is free with none in hand and
        // expensive with five. UNMEASURED.
        const newP = (this.eff[newC.id] || {}).p;
        if (newP && newP.kind === 'NO_TRAINERS') {
          const mine = me.hand.filter(x => (this.db[x.id] || {}).kind === 'trainer').length;
          s -= mine * W.drawCard;
        }
        return s;
      }

      case 'playBasic': {
        const n = me.bench.length;
        let s = n === 0 ? W.benchFirst : n < 3 ? W.benchMore : W.benchTooMany;
        s += this.scoreOnPlay(pi, a, me.hand[a.hand].id);

        // A THIRD OF THE SAME THING CROWDS OUT WHAT YOU HAVE NOT DRAWN YET —
        // 28 Aug 2026, Trevor, and the word he used is the specification:
        //
        //   "If there are more than two, then maybe the AI would be more
        //    resistant to even playing the third one onto the bench, to ensure
        //    room for variety when future cards are drawn. Not blocked but
        //    resistant."
        //
        // RESISTANT AND NOT BLOCKED, so it is a slope rather than a cap: the
        // third copy pays once, the fourth twice. A bench of five Rattata is a
        // bench that cannot answer anything, and the cost is not the Rattata —
        // it is the slot a Chansey drawn three turns from now will not have.
        //
        // Counted across the WHOLE board rather than the bench alone, because an
        // Active Growlithe is just as much "one of them" as a benched one, and by
        // NAME for the same reason `evolutionRoadFor` matches by name.
        //
        // Deliberately silent for the first two: Trevor's duplicates rule is
        // built on there being a second copy to fall back on, so making one
        // expensive would fight the rule directly above it.
        const named = this.db[me.hand[a.hand].id].name;
        const already = this.E.allSlots(pi).filter(x => this.top(x).name === named).length;
        if (already >= 2) s -= (already - 1) * W.benchDuplicate;
        return s;
      }

      // Retreating is an ESCAPE, and it is only worth what the escapee is worth.
      // Before this was written the bot retreated at almost any excuse: 37% of
      // its retreats cost it that turn's attack (29.5 points each on average)
      // and 24% happened with nothing threatening the Active at all. Both
      // measured by tools/aitest.js — run it before and after touching this.
      //
      // The doctrine is Buzzap's, generalised: a Prize is only cheap when the
      // Pokemon was going to be lost anyway, and a Pokemon with nothing invested
      // in it is cheap to lose. Sometimes the right play is to let a bare Basic
      // die while the real threat finishes charging on the Bench.
      case 'retreat': {
        if (!me.active) return -Infinity;
        const b = me.bench[a.bench];
        if (!b) return -Infinity;
        const cost = this.E.retreatCostOf(me.active);   // live cost, not printed
        const danger = this.incomingThreat(pi);
        const dying = danger >= this.remainingHP(me.active);
        const mineNow = this.bestAttackScore(pi).score;
        const theirs = this.potential(pi, b, null);
        // THE ENERGY A RETREAT BURNS IS PRICED AT THE SAME RATE THE RESCUE VALUES
        // IT, and until 21 Aug 2026 it was not: this line charged 4 per Energy
        // while `retreatSaveEnergy` below credits 7 for the same commodity. One
        // function, one Energy, two prices — so a retreat that spent two to save
        // three came out ahead by more than the one Energy it actually netted.
        //
        // Trevor's argument, and it is an economic one rather than a preference:
        // you may attach ONE Energy per turn, so an Energy is a turn. Discarding
        // two to retreat is two turns of attachment gone, and it is gone in
        // exactly the sense `retreatSaveEnergy` already measures — that weight is
        // "what dies with this Pokemon and cannot be re-attached". Paying it and
        // losing it are the same loss.
        //
        // `retreatBase` stays at -6 and is now purely tempo: the turn spent, not
        // the cards. Do not read it as covering Energy any more.
        let s = W.retreatBase - cost * W.retreatSaveEnergy;

        // What the swap does to our offence THIS turn. The replacement can still
        // attack after retreating, so what matters is the difference between the
        // two, not the whole of the current attack — and both sides are measured
        // in printed damage because that is the only currency they share.
        //
        // SYMMETRIC on purpose. Swapping down costs; swapping UP pays, and it
        // has to, or bringing a charged attacker off the Bench to replace a
        // spent one becomes impossible. An early version penalised every
        // unthreatened retreat flat and killed that play outright.
        let delta = this.bestAffordableDamage(pi, b)
                  - this.bestAffordableDamage(pi, me.active);

        // A WALL'S LOW DAMAGE IS NOT A DEFICIENCY, so the upgrade half of this
        // comparison is an illusion when a wall is the one leaving. Chansey's
        // best affordable attack is Scrunch at ZERO printed damage, which makes
        // literally any Bench Pokemon look like an upgrade, every single turn —
        // and swapping it out is the one thing it must not do. Its job is to
        // hold the Active spot while the Bench powers up and then die there.
        // Trevor, 21 Aug 2026, and it is the same argument as the Energy above:
        // you attach one Energy a turn, so retreating a wall to bring up a
        // half-charged attacker spends the very Energy that was going to charge
        // it.
        //
        // ASYMMETRIC, and that is the whole of it. Only the POSITIVE half is
        // suppressed. Swapping a wall out for something WEAKER is still a real
        // loss and still costs full price; it is only "I could be hitting
        // harder" that stops being a reason.
        //
        // Stickiness already suppresses the rescue term below by the same
        // factor, and the two are the same claim read from opposite ends: what
        // a wall has invested was always going to be spent, and what a wall
        // gives up by staying was never damage. Reusing `wallScore` rather than
        // adding a second notion of what a wall is — see AI.md.
        if (delta > 0) {
          const wall = this.wallHere(pi, me.active);
          delta *= (1 - wall * W.wallStick);
        }
        s += delta * W.retreatTempo;

        // Job 10c. RETREATING INTO A SINKHOLE COSTS MORE THAN THE ENERGY. Dark
        // Dugtrio takes a coin at whoever just retreated, and several of them
        // each take their own — so the bot has to see a board that has made
        // retreating expensive, and see it get worse as they add copies.
        //
        // Priced as expected damage on the Pokemon that is leaving, which is the
        // one it lands on. It is NOT priced as a Knock Out even when it would be
        // lethal, and that is the honest gap: `dying` below already covers the
        // case where the Active is being abandoned, and stacking a second
        // penalty on top would double-count the same Pokemon. UNMEASURED.
        for (const sl of this.E.allSlots(1 - pi)) {
          const pw = this.E.powerOf(sl);
          if (!pw || pw.kind !== 'ON_OPP_RETREAT') continue;
          if (!this.E.powerUsable(sl)) continue;
          for (const v of (pw.do || [])) {
            if (!(v.v === 'P_RETREAT_TOLL')) continue;
            const exp = 0.5 * Math.min(v.dmg, this.remainingHP(me.active));
            s -= exp * W.benchDamageMine;
          }
        }

        if (dying) {
          // How much is actually being rescued. Energy already spent is the
          // honest measure of investment — it is what dies with the Pokemon and
          // what cannot be re-attached. An evolved Pokemon also took cards and
          // turns to assemble.
          const invested = me.active.energy.length * W.retreatSaveEnergy
            + (this.top(me.active).stage !== 'Basic' ? W.retreatSaveEvolved : 0);

          // Losing the Active also concedes a PRIZE, and that is the larger half
          // of the bill. An early version priced the rescue on invested Energy
          // alone, capped at 22 — which made a Prize cheaper than two Energy and
          // had the bot feeding Pokemon it could not spare. It cost Zap, whose
          // Pokemon are all cheap 30-40 HP Basics, twenty points of win rate.
          //
          // Priced on a curve rather than a threshold: a Prize is worth little
          // when they need six more and everything when they need one. That
          // single term replaces the old "if they are one Prize away" special
          // case, and it is the only place the AI reads its opponent's Prize
          // count defensively — without it, "spend this one as fodder" is a
          // sentence the bot cannot think.
          // SQUARED, and the square is the whole correction — 13 Aug 2026.
          //
          // The line above this one used to divide by the Prize count flat,
          // which the comment described as "little when they need six more and
          // everything when they need one". It was never little: 60/6 is 10,
          // a sixth of the endgame value rather than a rounding error, and it
          // was paid on EVERY rescue from the first turn onwards.
          //
          // That is also why the 12-Prize bug hid it. The term was fitted in a
          // game that opened at 60/12 = 5 and it doubled the day the Prize
          // count was fixed, so the AI came out of that repair quietly twice as
          // eager to run away — nothing failed, and the weights had been
          // measured against the wrong game.
          //
          // Measured by aiduel against the flat divisor at 60: shrinking the
          // scalar to 30 / 20 / 10 / 0 gave 51.3 / 55.2 / 57.0 / 56.8 percent,
          // a clean plateau. Every one of those buys the early game by selling
          // the endgame, because the scalar moves both ends at once — at 0 the
          // bot will happily feed the last Prize it can afford to lose, which
          // AI.md records as costing Zap twenty points and which a duel is the
          // wrong instrument to see (rare, endgame, and shared by both seats).
          //
          // The square moves only the end that was wrong. 1.7 early, 6.7 at
          // three, 60 at one — the curve the comment always claimed.
          const left = Math.max(1, you.prizes.length);
          const prize = W.retreatPrize / (left * left);

          // STICKINESS SUPPRESSES THE RESCUE, NOT THE PRIZE. A wall being about
          // to die is the card doing its job, so what it has "invested" is not
          // really at risk — it was always going to be spent. But conceding the
          // Prize can still lose the game outright, and that is what the term
          // beside it is for, so it is left alone.
          //
          // This is also exactly Trevor's caveat — leave them in "unless the
          // opponent has 1 prize". At one Prize the squared divisor puts `prize`
          // at 60 and no amount of stickiness touches it, so the exception falls
          // out of the two terms rather than needing to be written.
          const stick = this.wallHere(pi, me.active);
          s += Math.min(W.dangerSwap, invested) * (1 - stick * W.wallStick) + prize;
        } else if (delta <= 0) {
          // Nothing threatens the Active AND the replacement hits no harder, so
          // this is neither an escape nor an upgrade — just Energy spent to
          // rearrange the board. This is what 24% of the bot's retreats were.
          s += W.retreatNoCause;
        }

        if (mineNow < 0 || mineNow === -Infinity) s += 10;
        if (theirs.short === 0) s += 8;

        // NEVER RETREAT INTO SOMETHING THAT DIES INSTANTLY — and until 21 Aug
        // 2026 this line asked the wrong Pokemon. It compared `danger`, which is
        // the threat against the Active that is LEAVING, with the remaining HP
        // of the one ARRIVING. Those are only the same number when both have the
        // same matchup against the attacker, which is exactly the case where the
        // guard was never needed.
        //
        // Trevor's log 04-06-28, turn 10, is the shape of it. Moltres resists
        // Fighting, so Hitmonlee's High Jump Kick was 20 into its 30 remaining —
        // two more turns of holding the spot. Magmar does not resist anything, so
        // the same attack was 50 into its 50. The bot read `danger` as 20, found
        // 20 >= 50 false, waived the penalty, retreated, and handed over a Prize
        // to an attack the Pokemon it abandoned would have walked away from.
        //
        // `threatAgainst` is the function that asks it properly and it has been
        // here since Job 9 — it was written for `promote`, which had the identical
        // fault ("no idea it was feeding a 40 HP Voltorb to an Arcanine"). The fix
        // was made there and never carried across to the retreat rule.
        //
        // TWO PENALTIES, because they are two different mistakes. Walking into a
        // Knock Out is bad. Walking into a Knock Out having just declined a
        // Pokemon that was going to SURVIVE is worse — it is a conceded Prize
        // that did not have to exist, and it is the one Trevor keeps seeing.
        const dangerIn = this.threatAgainst(pi, b);
        if (dangerIn >= this.remainingHP(b)) {
          s -= 18;
          if (!dying) s -= W.retreatIntoDeath;
        }

        // A CONFUSED RETREAT IS A COIN FLIP THAT CHARGES BEFORE IT ROLLS. The
        // Energy is discarded either way, so the cost is certain and only the
        // escape is a gamble — expected value is the guaranteed bill plus half
        // of everything above it.
        //
        // Without this the bot pays full price for a 50% product and does it
        // repeatedly, which is exactly the behaviour that made the rule worth
        // implementing. It also, correctly, makes Switch worth more than
        // retreating while Confused rather than merely different: T_SWITCH_OWN
        // already scores +20 for a statused Active and skips the flip entirely.
        if (me.active.status.confused) {
          const paid = W.retreatBase - cost * 4;   // charged on heads and tails alike
          s = paid + (s - paid) * 0.5;
        }
        return s;
      }

      // MUST return a real number, for the reason spelled out on switchIn below:
      // an all -Infinity option set makes pickBest yield null, and a null here
      // means nobody takes the Prize and the game stalls with the turn frozen.
      // Face down, every option is genuinely identical and a flat score is the
      // honest answer — the ENGINE picks at random in that case, not this.
      case 'takePrize': {
        if (!this.E.state.prizesFaceUp) return 1;
        const inst = me.prizes[a.idx];
        return inst ? this.cardKeepValue(pi, inst, this.E.allSlots(pi)) : 0;
      }

      case 'promote': {
        const b = me.bench[a.bench];
        if (!b) return -Infinity;
        return this.promoteValue(pi, b);
      }

      // Being Whirlwinded up is not the same as choosing to promote — the timing
      // is the opponent's — but the preference is: whatever survives longest and
      // can actually swing next turn. Scored on the same basis as a promotion.
      //
      // It MUST return a real number rather than falling through to the default:
      // pickBest yields null when every option scores -Infinity, and a null there
      // means nobody answers the prompt and the game stalls with the turn frozen.
      case 'switchIn': {
        const b = me.bench[a.bench];
        if (!b) return -Infinity;
        return this.promoteValue(pi, b);
      }

      case 'playTrainer': return this.scoreTrainer(pi, a);
      case 'pass': return 0;
      default: return -Infinity;
    }
  }

  // ----------------------------------------------------------- trainer score
  // WHAT A TRIGGERED POWER IS WORTH, AND WHICH ANSWER TO GIVE IT.
  //
  // Job 10c. This is the silent-failure surface AI.md warns about, arriving in a
  // new shape: an ON_PLAY Power fires whether or not anybody scored it, so a bot
  // that does not read this gets Summon Minions' two free Basics for nothing —
  // and, worse, hands the ENGINE the choice of which two, which falls back to a
  // seeded random. The card works perfectly and is played badly forever.
  //
  // So this does both jobs at once, exactly as scoreTrainer does: it returns what
  // the arrival is worth, and it fills in a.opts so the fallback is never reached.
  //
  // Called from BOTH `evolve` and `playBasic` — 17 of the era's 20 ON_PLAY
  // printings are Evolutions and 3 are Basics, and the trigger does not care.
  //
  // EVERY WEIGHT BELOW IS A FIRST GUESS and all five verbs are on PROVISIONAL in
  // selftest.js. They are priced off existing weights rather than new numbers,
  // which keeps them on the same scale as everything else but is not the same as
  // having measured them.
  scoreOnPlay(pi, a, cardId) {
    const E = this.E, W = this.W;
    const me = E.state.players[pi], you = E.state.players[1 - pi];
    const eff = this.eff[cardId];
    const p = eff && eff.p;
    if (!p || p.kind !== 'ON_PLAY') return 0;
    // A Muk anywhere switches this off, and the bot must not pay for a Power it
    // is not going to get. It cannot ask powerUsable — the card is still in hand
    // and has no slot — so it asks the one question that matters.
    if (E.toxicGasActive()) return 0;
    a.opts = a.opts || {};
    let s = 0;

    for (const v of (p.do || [])) {
      switch (v.v) {
        case 'P_SEARCH_BENCH': {
          // Priced as benching that many Basics, which is what it is — the same
          // weights `callFamily` uses, and for the same reason.
          const room = Math.max(0, E.cfg.benchMax - me.bench.length);
          const want = Math.min(v.n || 1, room);
          const wants = c => c && c.kind === 'pokemon' && c.stage === (v.stage || 'Basic');
          const pool = me.deck.filter(x => wants(this.db[x.id]));
          const take = Math.min(want, pool.length);
          for (let k = 0; k < take; k++) s += (me.bench.length + k === 0) ? W.benchFirst : W.benchMore;
          // WHICH ones. Highest printed damage first, HP as the tie-break — a
          // deliberately crude ordering, and the honest reason is that "how good
          // is this Basic on an empty bench" has no measured answer anywhere in
          // this file. A benched Basic's job is to be evolved into or to hold
          // Energy, and both scale with the body.
          const rank = x => {
            const c = this.db[x.id];
            let best = 0;
            for (const at of (c.attacks || [])) best = Math.max(best, aiParseDamage(at.dmg));
            return best * 2 + (c.hp || 0);
          };
          a.opts.trigUids = pool.slice().sort((x, y) => rank(y) - rank(x)).slice(0, take).map(x => x.uid);
          break;
        }
        case 'P_FROM_DISCARD': {
          // Cards back into hand, priced as draws. An Evolution that fits
          // something already on the board is worth more than a loose Basic,
          // because it is a play next turn rather than a card.
          const pool = me.discard.filter(x => this.db[x.id].kind === 'pokemon');
          const inPlay = new Set(E.allSlots(pi).map(sl => this.top(sl).name));
          const rank = x => {
            const c = this.db[x.id];
            return (c.evolvesFrom && inPlay.has(c.evolvesFrom) ? 100 : 0) + (c.hp || 0);
          };
          const take = pool.slice().sort((x, y) => rank(y) - rank(x)).slice(0, v.n || 1);
          a.opts.trigUids = take.map(x => x.uid);
          s += take.length * W.drawCard;
          for (const x of take) if (rank(x) >= 100) s += 4;
          break;
        }
        case 'P_SNIPE': {
          // Free damage on arrival, and it may pick ANY of their Pokemon. Priced
          // the way every other snipe in this file is: what it actually lands,
          // plus a fraction of a Knock Out when it finishes something.
          const cands = E.allSlots(1 - pi);
          if (!cands.length) break;
          const newC = this.db[cardId];
          const landed = (t) => {
            const tc = this.top(t);
            // Weakness only — Sneak Attack says to apply W and R, and Resistance
            // in this era is a flat -30 that would take this to zero anyway.
            let d = v.dmg;
            if (v.wr && tc.wkType && newC && tc.wkType === newC.type) d *= 2;
            if (v.wr && tc.rsType && newC && tc.rsType === newC.type) d = Math.max(0, d - 30);
            return d;
          };
          let best = null, bestScore = -Infinity;
          for (const t of cands) {
            const d = landed(t);
            const hpLeft = this.remainingHP(t);
            let sc = Math.min(d, hpLeft) * W.benchDamageFoe;
            if (d >= hpLeft) sc += W.knockout * 0.6;
            if (sc > bestScore) { bestScore = sc; best = t; }
          }
          // "You MAY" — but every reading of it that does nothing is worse than
          // one that does 10, so it is only declined when it would do nothing at
          // all, which cannot happen while they have a Pokemon in play.
          if (best && bestScore > 0) { a.opts.trigTargetUid = best.uid; s += bestScore; }
          else a.opts.trigTargetUid = null;
          break;
        }
        // P_REVENGE and P_RETREAT_TOLL are never reached from here: they hang off
        // ON_KO and ON_OPP_RETREAT, which nobody plays. They are scored where the
        // decision they affect is actually made — see the retreat case in
        // scoreAction for the toll, and AI.md's open list for Final Beam.
      }
    }
    return s;
  }

  // HOW MUCH A CHALLENGE IS WORTH TO ONE SIDE, in Pokemon it would actually
  // bench. `known` is the honest half of this and it is Trevor's constraint,
  // 19 Aug 2026: the bot judges its OWN side from its deck, and the opponent's
  // side only from what it can SEE.
  //
  // That is a deliberate self-restriction rather than a limitation. ai.js reads
  // full engine state everywhere else — it is why Peek is scored at -Infinity —
  // so it COULD count the Basics left in the opponent's deck and answer exactly.
  // It does not, because a Challenge is a gamble on both sides and a bot that
  // knew the answer would not be playing the same card the human is.
  //
  // DO NOT "FIX" THIS BY LETTING IT LOOK. The restriction is the design.
  challengeGain(pi, known) {
    const E = this.E, pl = E.state.players[pi];
    const room = E.cfg.benchMax - pl.bench.length;
    if (room <= 0) return 0;
    if (!known) return room;      // visible only: assume they can fill the room
    const wants = x => { const c = this.db[x.id]; return c && c.kind === 'pokemon' && c.stage === 'Basic'; };
    return Math.min(room, pl.deck.filter(wants).length);
  }

  // The least useful card in hand, and how bad it is. Extracted for Matter
  // Exchange, which needs the same judgement the discard-cost Trainers already
  // make: what is safe to throw away.
  //
  // Returns {uid, score} where score is roughly "how much better an unknown card
  // would be" — 0 for something the board wants, up to 1 for a dead card.
  junkiestInHand(pi) {
    const me = this.E.state.players[pi];
    if (!me.hand.length) return null;
    const need = new Set();
    for (const sl of this.E.allSlots(pi)) {
      const c = this.top(sl);
      for (const at of (c.attacks || [])) for (const ch of String(at.cost || '')) need.add(ch);
    }
    let best = null;
    for (const inst of me.hand) {
      const c = this.db[inst.id];
      let junk;
      if (!c) junk = 1;
      // A Rainbow is wanted by anything that wants a typed symbol at all, and
      // the first draft of this line filed it at 0.9 — the junkiest thing in
      // hand — because '*' is in no needs set.
      else if (c.kind === 'energy') {
        junk = (c.provides === AI_WILD ? need.size > 0 : need.has(c.provides)) ? 0.15 : 0.9;
      }
      else if (c.kind === 'trainer') junk = 0.4;
      else if (c.stage === 'Basic') junk = me.bench.length >= 4 ? 0.7 : 0.2;
      else {
        // An Evolution whose pre-evolution is nowhere is a dead card in hand.
        const have = this.E.allSlots(pi).some(sl => this.top(sl).name === c.evolvesFrom)
                  || me.hand.some(x => this.db[x.id] && this.db[x.id].name === c.evolvesFrom);
        junk = have ? 0.1 : 0.8;
      }
      if (!best || junk > best.score) best = { uid: inst.uid, score: junk };
    }
    return best;
  }

  // Also fills in a.opts, so the engine never has to pick targets at random.
  // WHICH OF THEIR BENCH TO DRAG UP, for every card that drags one of THEIRS.
  //
  // This was inside `T_SWITCH_OPPONENT` and nothing else could reach it, so Gust
  // of Wind chose carefully and Ninetales' Lure — the same effect, printed as an
  // attack — scored a flat `W.drag` and let the engine's seeded random pick
  // decide. Trevor caught it in play before anybody found it in the code: "Lure
  // to draw out a much more dangerous pokemon on turn 49."
  //
  // The standing invariant is 21 Aug's, on `selfSwitch`: **the scorer fills in
  // `a.opts` so the engine's random fallback is never reached.** It was written
  // for switching one of ours and is exactly as true for dragging one of theirs.
  //
  // "Cannot kill it" is NOT the fault on its own, and treating it as one throws
  // away the card's other real use. Dragging up a Pokemon that cannot pay for an
  // attack costs them a whole turn — tempo denial is a perfectly good reason to
  // spend a Gust, and it is the exact use Trevor's Ninetales note names: "removing
  // a dangerous pokemon and replacing it with one that is not ready to attack."
  // The genuinely bad drag is the one that pulls up something we can neither kill
  // NOR silence, which is a free switch performed on the opponent's behalf.
  bestDragTarget(pi) {
    const E = this.E, you = E.state.players[1 - pi];
    let bench = 0, value = -Infinity, kills = false, swings = true;
    you.bench.forEach((b, i) => {
      const pot = this.potential(1 - pi, b, null);
      // Can we finish it once it is up? bestDamageAgainst forecasts our Active
      // against a defender that is still on their Bench, which is the only way
      // to ask this before committing the card.
      const k = this.bestDamageAgainst(pi, b) >= this.remainingHP(b);
      const canSwing = pot.short === 0;
      let v = (100 - this.remainingHP(b)) * 0.4 + (canSwing ? 0 : 18);
      if (k) v += this.W.dragKill;
      if (v > value) { value = v; bench = i; kills = k; swings = canSwing; }
    });
    return { bench, value, kills, swings };
  }

  // What that drag is worth, so the Trainer and the attack cannot drift apart.
  dragScore(d) {
    const W = this.W;
    return W.drag + d.value * 0.3 + (!d.kills && d.swings ? W.dragNoKill : 0);
  }

  scoreTrainer(pi, a) {
    const E = this.E, W = this.W;
    const me = E.state.players[pi], you = E.state.players[1 - pi];
    const inst = me.hand[a.hand];
    const script = (this.eff[inst.id] && this.eff[inst.id].t) || [];
    let s = 0;
    a.opts = a.opts || {};

    // Is our Active going to erase their Active this turn anyway? If so,
    // disrupting that Pokemon is wasted - it is about to be discarded.
    const finisher = this.bestAttackScore(pi);
    let killingActiveNow = false;
    if (finisher.idx >= 0) {
      const f = this.forecast(pi, finisher.idx);
      if (f && f.pLethal >= 0.85) killingActiveNow = true;
    }

    for (const v of script) {
      switch (v.v) {
        case 'T_POKE_BALL': s += 0.5 * W.drawCard * 2; break;

        // ---- Job 10e ------------------------------------------------------
        // A TRAINER'S STATUS IS THE SAME STATUS AN ATTACK APPLIES — 24 Aug 2026.
        //
        // This was a flat `0.5 * W[key]` and carried none of the three things the
        // attack path had learned about riders, because all three were written
        // into `scoreAttack` and this is a different function. Sleep! scored an
        // identical 11.00 against a healthy target, a target the bot could kill
        // that same turn, and a target **already asleep**.
        //
        // Trevor's note names two of the three from play: *"should not be played
        // against a pokemon that's going to die in the same turn or is already
        // asleep."* The third — pricing a bought turn off what it actually denies
        // — is not in his note and is included anyway, because leaving it out
        // would mean the game holds two different prices for one bought turn, and
        // that exact inconsistency is the fault #22 fixed for attacks on 22 Aug.
        //
        // **The lesson is about code paths, not about this card.** A rule proven
        // in `scoreAttack` does not reach `scoreTrainer`, and nothing was going to
        // tell us: no suite covers it, the situation is rare enough to be a null
        // in every duel, and the card works perfectly for the human.
        case 'T_STATUS_ON_FLIP':
        case 'T_STATUS': {
          const key = STATUS_VALUE[v.s];
          if (!key || !you.active) return -Infinity;
          const certain = v.v === 'T_STATUS' ? 1 : 0.5;
          // Already has it? Worth nothing — and Paralysis is exempt because it
          // refreshes its own timer. Same derivation as the attack path.
          const novel = this.statusNovelty(v.s, you.active);
          // About to die anyway? A status on a corpse buys nothing, and the
          // Pokemon that replaces it comes up clean.
          const pKill = this.pLethalThisTurn(pi);
          // And a bought turn is worth the attack it denies.
          const scale = DENIES_A_TURN[v.s]
            ? Math.min(this.incomingThreat(pi), this.remainingHP(me.active) || Infinity) / AVG_ATTACK
            : 1;
          s += certain * W[key] * novel * (1 - pKill) * scale;
          break;
        }
        case 'T_SEARCH_TO_HAND': {
          // A tutor. Worth a draw, plus real money when what it fetches fits
          // something already on the board — and the pick is filled in here so
          // the engine's random fallback is never reached.
          const inPlay = new Set(E.allSlots(pi).map(sl => this.top(sl).name));
          const pool = me.deck.filter(x => E.searchMatches(this.db[x.id], v));
          if (!pool.length) return -Infinity;
          let best = pool[0], fits = false;
          for (const x of pool) {
            if (!fits && inPlay.has(this.db[x.id].evolvesFrom)) { best = x; fits = true; }
          }
          a.opts.pickUid = best.uid;
          s += W.drawCard + (fits ? 10 : 0);
          break;
        }
        case 'T_SHUFFLE_FROM_DISCARD': {
          // Recycling. Worth the most on a thin deck and on Pokemon whose line
          // is still in play, worth least as a deck-thickener nobody asked for —
          // and note it puts cards BACK, so it is never a tempo play.
          const inPlay = new Set(E.allSlots(pi).map(sl => this.top(sl).name));
          const pool = me.discard.filter(x => E.nightlyEligible(this.db[x.id]));
          if (!pool.length) return -Infinity;
          const rank = x => {
            const cc = this.db[x.id];
            if (cc.kind !== 'pokemon') return 1;
            return (inPlay.has(cc.evolvesFrom) || inPlay.has(cc.name)) ? 6 : 3;
          };
          const take = pool.slice().sort((x, y) => rank(y) - rank(x)).slice(0, v.n || 3);
          a.opts.uids = take.map(x => x.uid);
          s += take.reduce((acc, x) => acc + rank(x), 0) * 0.5;
          // Running out of deck is a loss. The thinner it is, the more this is
          // worth, and that outweighs everything above once it is genuinely low.
          if (me.deck.length < 10) s += (10 - me.deck.length) * 2;
          break;
        }
        case 'T_DISCARD_THEN_OPP_REDRAW': {
          // Disruption that costs a card. Worth it when their hand is big and
          // they have been holding it — which is the case this bot can actually
          // see — and a straight loss when their hand is small, because they
          // draw back up to four.
          const junk = this.junkiestInHand(pi);
          if (junk === null) return -Infinity;
          a.opts.discardUid = junk.uid;
          s += (you.hand.length - (v.n || 4)) * W.drawCard;
          s -= (1 - junk.score) * W.drawCard;
          break;
        }
        case 'T_POWERS_OFF': {
          // WORTH WHAT THEIR POWERS ARE WORTH, MINUS WHAT YOURS ARE, and the
          // second half is the one that would be forgotten: Goop Gas Attack
          // switches off BOTH boards, so a deck built on Rain Dance blacking out
          // its own engine to stop a Muk is usually a bad trade.
          //
          // Counted rather than valued, because pricing an arbitrary Power is a
          // problem nobody here has solved. A count at least has the right sign.
          const theirs = E.allSlots(1 - pi).filter(sl => E.powerOf(sl) && E.powerUsable(sl)).length;
          const mine = E.allSlots(pi).filter(sl => E.powerOf(sl) && E.powerUsable(sl)).length;
          if (theirs === 0) return -Infinity;
          s += (theirs - mine) * 8;
          break;
        }
        case 'T_PRIZES_FACE_UP':
          // DELIBERATELY REFUSED, and this is a declaration rather than a gap —
          // the Peek shape, with a stronger reason than Peek has.
          //
          // Turning every Prize face up gives this bot NOTHING, because it reads
          // full engine state and already knows them. It gives a human opponent
          // a real advantage, and it exposes the bot's own Prizes to them. So it
          // is not merely worthless here, it is one-sidedly bad, and the honest
          // score is a refusal.
          //
          // The day ai.js models what the opponent knows, this becomes a real
          // question and so does Rattata's Trickery. Both are on AI.md's open
          // list. See Rulings/PEEK-CLAIRVOYANCE.md.
          return -Infinity;
        case 'T_LOOK_AND_SHUFFLE_BACK': {
          // The LOOK is worth nothing to a full-state bot. Taking a Trainer out
          // of their hand is worth something to anybody, so that half is scored
          // and the pick is made properly rather than at random.
          const trainers = you.hand.filter(x => this.db[x.id].kind === 'trainer');
          if (!trainers.length) return -Infinity;      // a look, and nothing else
          // Crude threat ranking: the cards that swing a board hardest. Untuned,
          // and it is a list rather than a model on purpose — anything cleverer
          // would be pretending to a judgement nobody has measured.
          const BIG = new Set(['base1-88', 'base1-71', 'base1-77', 'base1-76',
                               'base1-93', 'base1-92', 'base1-79', 'base1-80']);
          let best = trainers[0], bestScore = -1;
          for (const x of trainers) {
            const sc = BIG.has(x.id) ? 2 : 1;
            if (sc > bestScore) { bestScore = sc; best = x; }
          }
          a.opts.pickUid = best.uid;
          // Worth more against a small hand, where one card is a bigger share of
          // what they can do.
          s += W.drawCard * (bestScore + 1) * (you.hand.length <= 3 ? 1.4 : 1);
          break;
        }
        case 'T_CHALLENGE': {
          // Filling BOTH benches, so it is worth the difference rather than the
          // gain. Scored with the same visible-only rule doAnswer uses below —
          // see there for why the bot deliberately does not look at their deck.
          const mine = this.challengeGain(pi, true);
          const theirs = this.challengeGain(1 - pi, false);
          // Declining is not a failure: it draws two, which is the floor and is
          // why the card is always legal.
          s += Math.max(2 * W.drawCard, (mine - theirs) * W.benchMore);
          const room = E.cfg.benchMax - me.bench.length;
          const wants = x => { const cc = this.db[x.id]; return cc && cc.kind === 'pokemon' && cc.stage === 'Basic'; };
          a.opts.myPicks = me.deck.filter(wants).slice(0, room).map(x => x.uid);
          break;
        }
        case 'T_COIN_PINGPONG': {
          // DIGGER IS A BAD CARD AND THE BOT HAS TO KNOW IT. The coin starts
          // with YOU, so you take the 10 two times in three: p(you) = 0.5 +
          // 0.5*0.5*0.5 + ... = 2/3, p(them) = 1/3. Confirmed by simulation.
          //
          // So its expected value is 3.33 damage to them against 6.67 to you,
          // and it is only ever right when their Active is on its last 10 and
          // yours is not — a finisher that misses two times in three, rather
          // than a damage card.
          const dmg = v.n || 10;
          const kills = you.active && this.remainingHP(you.active) <= dmg;
          const dies = me.active && this.remainingHP(me.active) <= dmg;
          s += (1 / 3) * dmg * W.damage - (2 / 3) * dmg * W.selfDamage;
          if (kills) s += (1 / 3) * W.knockout;
          if (dies) s -= (2 / 3) * W.selfKO;
          break;
        }
        case 'T_ENERGY_SEARCH': s += W.drawCard; break;
        case 'T_MR_FUJI': {
          // A rescue, so it is only worth anything on something badly hurt —
          // and it costs us the whole investment on that Pokemon.
          let best = -Infinity;
          for (const b of me.bench) {
            const hurt = b.dmg, inv = b.energy.length;
            best = Math.max(best, hurt * 0.5 - inv * W.energyDiscard * 0.5);
          }
          s += Math.max(0, best === -Infinity ? 0 : best);
          break;
        }
        case 'T_GAMBLER': {
          // Heads 8, tails 1, so 4.5 expected — for the hand we give up. But the
          // hand is SHUFFLED BACK IN, not discarded, and the Gambler card itself
          // has already left the hand by the time the script runs. So on a hand
          // of more than about five this card makes the deck BIGGER, and it is
          // the only card in the game that does. Capping it alongside Bill would
          // suppress the one play that digs out of a deck-out.
          const held = me.hand.filter(x => x.uid !== inst.uid).length;
          s += (4.5 - held) * W.drawCard * 0.6;
          s += this.deckRisk(pi, 4.5 - held);
          // Losing the hand still costs what the hand was worth, and being
          // starved is what makes throwing it away right.
          s -= this.handKeepValue(pi, inst.uid) * 0.35;
          s += this.handStarved(pi) * W.drawCard * 2.2;
          break;
        }
        case 'T_RECYCLE': {
          // Half the time it does nothing at all; when it lands it is one
          // specific card, on top, next draw.
          s += 0.5 * W.drawCard * 1.4;
          break;
        }
        case 'T_DRAW': s += v.n * W.drawCard + this.deckRisk(pi, v.n); break;

        case 'T_PROFESSOR_OAK': {
          // Discards the hand — gone, not shuffled back — and draws seven. So it
          // burns exactly seven every time, which is the largest single bite any
          // card takes out of your own deck.
          //
          // The card count alone was the whole of this before: `(7 - keep)`
          // treats a hand of six Energy you cannot attach the same as a hand of
          // six you are about to play. Trevor's rule, 16 Aug: don't pitch
          // evolutions you can use, Energy something is short of, or a Trainer
          // worth playing — and take it anyway when the hand holds none of what
          // the board actually needs.
          const keep = me.hand.filter(x => x.uid !== inst.uid).length;
          s += (7 - keep) * W.drawCard;
          s -= this.handKeepValue(pi, inst.uid) * 0.55;
          s += this.handStarved(pi) * W.drawCard * 2.6;
          s += this.deckRisk(pi, 7);
          break;
        }

        // THE TARGET IS CHOSEN BY WHAT THE HEAL IS WORTH, not by which slot
        // carries the most damage counters — 2 Sep 2026, from Trevor's GBC 2
        // note. The two agree on almost every board and diverge on the one his
        // note is about: an Active a Potion would save outright, standing beside
        // a benched Pokemon that is merely more hurt. The card went to the Bench
        // and the rescue bonus, which requires the target to BE the Active, then
        // suppressed itself. Two faults, and the first one hid the second.
        //
        // WITHOUT THE RESCUE TERM THIS IS THE OLD SELECTION EXACTLY, which is
        // why it is safe. `healValue` is non-decreasing in `dmg` — rising while
        // the heal is still being wasted, flat once the damage exceeds it — so
        // argmax value and argmax damage are the same slot, and the `dmg`
        // tiebreak below reproduces the old "most hurt wins" among the ties.
        // The only board where behaviour moves is one with a rescue on it.
        case 'T_HEAL': {
          const cands = E.allSlots(pi).filter(x => x.dmg > 0);
          if (!cands.length) return -Infinity;
          const value = c => {
            const heal = Math.min(v.n * 10, c.dmg);
            // Healing poured past the damage is thrown away, and nothing charged
            // for it: a Potion on a Pokemon with 10 damage still scored 3.5 and
            // cleared the action threshold, so 34% of heals were premature.
            // Super Potion never had this problem, purely by accident — its
            // Energy cost happens to cancel the value at exactly 20 damage. This
            // is that brake, made deliberate and applied to the card that lacked it.
            return heal / 10 * W.healPer10
                 - Math.max(0, v.n * 10 - c.dmg) / 10 * W.healWaste
                 // ...and a heal that actually buys the Active another turn is
                 // worth more than the damage it removes. It has to BUY one:
                 // see `healRescues`.
                 + (this.healRescues(pi, c, heal) ? W.healRescue : 0);
          };
          let best = null, bestV = -Infinity;
          for (const c of cands) {
            const x = value(c);
            if (x > bestV || (x === bestV && best && c.dmg > best.dmg)) { best = c; bestV = x; }
          }
          a.opts.targetUid = best.uid;
          s += bestV;
          break;
        }

        // SAME SELECTION, SAME REASON — and the disarm moves INTO it rather than
        // being computed after the target is already picked. Trevor's Super
        // Potion note is the one that asks for that: "Should not be used to save
        // a pokemon that it would prevent from powering up enough to attack, as
        // that would just be stalling for no benefit." Charging the disarm to
        // the whole card, after choosing the worst slot to pay it on, can only
        // ever refuse the play; charging it per candidate lets the card go
        // somewhere the Energy is spare instead.
        case 'T_DISCARD_ENERGY_THEN_HEAL': {
          const cands = E.allSlots(pi).filter(x => x.dmg > 0 && x.energy.length);
          if (!cands.length) return -Infinity;
          const value = c => {
            const heal = Math.min(v.n * 10, c.dmg);
            let x = heal / 10 * W.healPer10 - W.energyDiscard
                  - Math.max(0, v.n * 10 - c.dmg) / 10 * W.healWaste
                  + (this.healRescues(pi, c, heal) ? W.healRescue : 0);
            // The Energy it discards can switch the target's OWN attack off,
            // which turns a heal into a disarm. This is the first half of a
            // compound Trevor caught: Super Potion healed a lethal Beedrill and
            // stripped the Energy it needed to swing, and the retreat logic then
            // correctly observed that the Active could no longer attack and
            // swapped it out. Two defensible decisions, one disastrous turn —
            // and the fault is here, in the one that created the situation.
            const held = c.energy.pop();
            const shortAfter = this.potential(pi, c, null).short;
            c.energy.push(held);
            const shortBefore = this.potential(pi, c, null).short;
            if (shortAfter > shortBefore) x -= (c === me.active) ? W.healDisarm : W.healDisarm * 0.3;
            return x;
          };
          let best = null, bestV = -Infinity;
          for (const c of cands) {
            const x = value(c);
            if (x > bestV || (x === bestV && best && c.dmg > best.dmg)) { best = c; bestV = x; }
          }
          a.opts.targetUid = best.uid;
          s += bestV;
          break;
        }

        case 'T_SWITCH_OWN': {
          if (!me.bench.length || !me.active) return -Infinity;
          // A SWITCH IS WORTH THE RETREAT COST IT NULLIFIES, so on a Pokemon that
          // can already walk away for nothing it is worth nothing at all —
          // retreating does the identical thing and keeps the card. Trevor:
          // "Does not want to be used on a free-retreat cost pokemon."
          //
          // Measured before this: a Switch on a free-retreat Rattata scored 24.00
          // and was played. The retreat cost was not read anywhere in this case.
          //
          // A GATE, NOT A WEIGHT, and deliberately only the half of his note that
          // is one. "Prefers heavier retreat costs to nullify" is a quantity and
          // pricing it is open — see the `open:` row in `tools/claims/base1.js`,
          // which says why the obvious version is circular.
          //
          // The three conditions are all load-bearing. `canRetreat` is what makes
          // this safe under Paralysis and Sleep, where retreating is illegal and
          // the card is the only way out; `retreated` is the once-a-turn limit,
          // after which the card is again the only way out; and the cost is read
          // LIVE through `retreatCostOf` rather than off the printed card, so
          // Dodrio's Retreat Aid is already in it.
          if (!me.retreated && E.canRetreat(me.active) && E.retreatCostOf(me.active) === 0)
            return -Infinity;
          // Same yardstick as promoting, deliberately. When these were two
          // formulas they picked different Pokemon, and the visible symptom was
          // the bot promoting one and then spending a Switch to undo it.
          //
          // THE GAIN WAS COMPUTED AND THROWN AWAY — 3 Sep 2026, and it is why
          // this card scored a flat -4.00 on every board that was not an
          // emergency: measured across Machop, Charmander, Chansey, Onix and
          // Kangaskhan, five different Actives with five different Bench
          // upgrades behind them, all -4.00. **How much you want to move was not
          // in the score at all**, so the only Switch the bot ever played was one
          // escaping a Knock Out.
          //
          // `bestSelfSwitch` is the same loop with the answer kept, and
          // `selfSwitchGain` is the rate Teleport already prices it at. This is
          // one expression of the idea replacing two, not a new weight.
          const sw = this.bestSelfSwitch(pi);
          if (!sw) return -Infinity;
          a.opts.bench = sw.bench;
          s += sw.gain * W.selfSwitchGain;
          // THE RETREAT COST IS DELIBERATELY NOT PRICED, and this closes the
          // `open:` row that has been asking about it since 30 Aug 2026.
          //
          // Trevor, 3 Sep: "I'm not sure we need to price cost at all... it would
          // be almost entirely situational without the exact retreat cost it was
          // saving getting much consideration beyond the fact that it's being
          // saved. If you really think we should price it, I'd say we should
          // price it lower than the spot's desire to run."
          //
          // IT IS ALREADY IN THE ARITHMETIC, which is the part worth checking
          // before adding a term. A Switch does not pay `retreatSaveEnergy` and a
          // retreat does, so the Switch's advantage over retreating rises with
          // the cost on its own — measured on one board at 16.50 for a Machop,
          // 42.05 for an Onix, 55.35 for a Kangaskhan. Adding `cost *
          // retreatSaveEnergy` here would be a SECOND rate for a commodity the
          // retreat path already owns, and it would buy Switches for Snorlaxes
          // that were perfectly happy standing there. Same shape as the Chansey
          // caveat in WALLS.md: it falls out rather than being special-cased.
          const danger = this.incomingThreat(pi);
          s += (danger >= this.remainingHP(me.active)) ? 24 : -4;
          const st = me.active.status;
          if (st.asleep || st.paralyzed || st.confused) s += 20;
          break;
        }

        // Gust of Wind. What it is FOR is dragging up something hurt and
        // finishing it. What it was DOING is dragging up whatever looked
        // weakest and then failing to punish it — 80% of drags could not kill
        // what they pulled, measured by tools/aitest.js.
        //
        // That is worse than wasting the card. An unpunished drag is a free
        // switch for the opponent: they were going to promote something next
        // turn anyway, and we just did it for them at the cost of a Trainer.
        case 'T_SWITCH_OPPONENT': {
          if (!you.bench.length) return -Infinity;
          if (killingActiveNow) return -Infinity;   // don't rescue a doomed Active
          // The ranking moved to `bestDragTarget` on 30 Aug so the ATTACKS that
          // drag can read the same answer. Behaviour here is unchanged and there
          // are two claim rows saying so.
          const d = this.bestDragTarget(pi);
          a.opts.bench = d.bench;
          s += this.dragScore(d);
          break;
        }

        case 'T_DISCARD_OPP_ENERGY': {
          let cands = E.allSlots(1 - pi).filter(x => x.energy.length);
          if (!cands.length) return -Infinity;
          // Stripping Energy off something we're about to Knock Out achieves
          // nothing - the Energy is going to the discard pile either way.
          if (killingActiveNow) {
            const others = cands.filter(x => x !== you.active);
            if (!others.length) return -Infinity;
            cands = others;
          }
          let best = cands[0];
          for (const c of cands) if (c.energy.length > best.energy.length) best = c;
          // WHICH Energy, not just whose. `energyIdx` was a dead key — see
          // `energyStripOrder`, which is where the ordering lives so that both
          // removal cards and anything added later share one answer.
          a.opts.targetUid = best.uid;
          a.opts.energyUids = [E.energyStripOrder(best)[0].uid];
          s += W.stripEnergy + (best === you.active && !killingActiveNow ? 6 : 0);
          break;
        }

        case 'T_SUPER_ENERGY_REMOVAL': {
          const mine = E.allSlots(pi).filter(x => x.energy.length);
          let theirs = E.allSlots(1 - pi).filter(x => x.energy.length);
          if (killingActiveNow) theirs = theirs.filter(x => x !== you.active);
          if (!mine.length || !theirs.length) return -Infinity;
          // spend from whoever needs it least; strip from whoever has most
          let src = mine[0];
          for (const c of mine) if (c !== me.active && c.energy.length <= src.energy.length) src = c;
          let tgt = theirs[0];
          for (const c of theirs) if (c.energy.length > tgt.energy.length) tgt = c;
          a.opts.selfUid = src.uid; a.opts.targetUid = tgt.uid;
          // Both halves were falling through. The self side wants the friendly
          // order and gets it by default; the hostile side needs the other one.
          a.opts.energyUids = E.energyStripOrder(tgt).slice(0, 2).map(e => e.uid);
          // THE CARD IS PART OF THE PRICE, and on this card alone that is what
          // decides it. Trevor: "DOES NOT want to be used on an opponent pokemon
          // with only one energy because then you don't gain an advantage." At
          // one Energy you trade your Energy AND the card for their Energy,
          // which is a loss; the old formula scored it 4 and played it.
          //
          // Written as a term that applies at every count rather than a test for
          // one, because a quantity about how bad a trade is, expressed as an
          // equality check, is this project's most reliable sniff test for a
          // wrong curve. Energy Removal is deliberately NOT charged this — it
          // costs the card and nothing else, which is the whole difference
          // between "use it liberally" and this note.
          s += Math.min(2, tgt.energy.length) * W.stripEnergy - W.energyDiscard - W.drawCard;
          if (src === me.active) s -= 10;
          break;
        }

        case 'T_PLUSPOWER': {
          if (!me.active) return -Infinity;
          // only worth it if we're actually attacking, and best if it converts a KO
          const best = this.bestAttackScore(pi);
          if (best.idx < 0) return -Infinity;
          const f = this.forecast(pi, best.idx);
          if (!f || f.expDmg <= 0) return -Infinity;
          // WORTH THE TURN IT TAKES OFF THE KILL, and the old term priced only
          // the last one. It paid a flat 6 and then +34 for a single case — the
          // extra 10 makes THIS attack lethal — which is the top rung of a
          // staircase written as though it were the whole staircase. Trevor
          // names the general quantity and hands over the arithmetic: "when an
          // additional 10 damage would result in 1 fewer turn to kill the
          // opponent, as in a move doing 30 damage attacking a pokemon with 70
          // HP." Three turns becomes two, and the bot scored that board 6.00 —
          // the same as a board where the 10 changes nothing whatsoever.
          //
          // The cliff table's tenth row. Ask what the quantity IS: turns removed
          // is a quantity, so it is linear, discounted by how far off the turn it
          // removes actually is. `turnsWith === 1` is the lethal case and comes
          // out at the top by arithmetic rather than by a branch.
          //
          // PlusPower is applied AFTER Weakness and Resistance — see the
          // DAMAGE_BONUS loop in `computeDamage` — so `expDmg + 10` is the real
          // number and not an approximation.
          const turnsNow  = Math.ceil(f.hpLeft / f.expDmg);
          const turnsWith = Math.ceil(f.hpLeft / (f.expDmg + 10));
          if (turnsWith < turnsNow) {
            s += 40 / turnsWith;
          } else {
            // TEN DAMAGE THAT CHANGES NO TURN COUNT CHANGES NOTHING, and playing
            // it now spends the option of playing it on the turn that it would
            // have converted. That option is the whole of Trevor's "plan to hit
            // for 30 on the first turn and use the PlusPower for 40 on the
            // second" — so the default here is to hold, below `threshold`.
            //
            // UNLESS THERE IS NO LATER TURN TO HOLD IT FOR. His own next
            // sentence: "If you might not survive until the second turn, the
            // PlusPower could probably be used early." The card survives your
            // Pokemon; the PLAN does not, because the attacker it was built
            // around is the thing about to die. Priced back at the old flat 6,
            // which is what this branch used to pay unconditionally.
            // "No later turn to hold it for" is `turnsLeft` at zero, and this used to
            // say `incomingThreat >= remainingHP` inline. Identical arithmetic —
            // `hp <= threat` and `ceil(hp/threat) - 1 === 0` are the same
            // condition — but written once, in the place that owns it, instead of
            // a fourth private copy of the idea.
            s += this.turnsLeft(pi, me.active) === 0 ? 6 : 0.2;
          }
          break;
        }

        case 'T_DEFENDER': {
          const danger = this.incomingThreat(pi);
          if (!me.active) return -Infinity;
          a.opts.targetUid = me.active.uid;
          s += danger > 0 ? 8 : -2;
          if (danger >= this.remainingHP(me.active) && danger - 20 < this.remainingHP(me.active)) s += 26;

          // DEFENDER ALSO BLUNTS THE ATTACK WE ARE ABOUT TO MAKE — 29 Aug 2026,
          // settled with Trevor. A Defender on a Take Down Arcanine turns 30
          // recoil into 10, at the price of the card being used up before their
          // turn. Without this the bot owns a capability it can never reach for,
          // which is the silent-failure surface arriving in `scoreTrainer` — and
          // the standing invariant is that a rule proven in `scoreAttack` does
          // NOT reach this function on its own.
          //
          // PRICED AS THE BARRIER IT IS, reusing `shieldSelf`'s own curve rather
          // than inventing a second notion of prevented self-damage: linear in
          // the damage stopped, squared in the share of remaining HP it stops,
          // off `selfKO`. Those two curves disagree on purpose and the reason is
          // in AI.md's cliff table — a quantity is linear, a risk is squared.
          //
          // The attack is read the way `T_PLUSPOWER` directly above reads it,
          // through `bestAttackScore` + `forecast`. That is deliberately the
          // attack the bot would pick ANYWAY rather than the worst self-harm it
          // could choose: over-stating the recoil here would buy Defenders for
          // attacks it was never going to use, and the failure this closes is a
          // capability never used at all, so the conservative direction is the
          // safe one.
          const best = this.bestAttackScore(pi);
          if (best && best.idx >= 0) {
            const f = this.forecast(pi, best.idx);
            if (f && f.selfDmg > 0) {
              const stopped = Math.min(20, f.selfDmg);
              const left = this.remainingHP(me.active);
              const frac = left > 0 ? Math.min(1, stopped / left) : 1;
              s += 1.4 * (stopped / 20) * W.shieldSelf + frac * frac * W.selfKO;
            }
          }
          break;
        }

        case 'T_ENERGY_RETRIEVAL': {
          const basics = me.discard.filter(x => { const c = this.db[x.id]; return c.kind === 'energy' && c.cls === 'Basic'; });
          if (!basics.length || me.hand.length < 2) return -Infinity;
          const junk = this.worstHandCard(pi, inst.uid);
          if (junk === null) return -Infinity;
          a.opts.discardUid = junk;
          s += Math.min(v.n, basics.length) * 6;
          break;
        }

        case 'T_COMPUTER_SEARCH': {
          const others = me.hand.filter(x => x.uid !== inst.uid);
          if (others.length < 2 || !me.deck.length) return -Infinity;
          const junk = this.rankHandJunk(pi, inst.uid).slice(0, 2);
          if (junk.length < 2) return -Infinity;
          a.opts.discardUids = junk;
          const want = this.wantFromDeck(pi);
          if (want) a.opts.pickUid = want;
          s += 12;
          break;
        }

        case 'T_FULL_HEAL': {
          if (!me.active) return -Infinity;
          const st = me.active.status;
          if (st.paralyzed || st.asleep) s += 24;
          if (st.confused) s += 16;
          if (st.poisoned) s += (me.active.poisonDamage || 10);
          break;
        }
        case 'T_COMPUTER_ERROR': {
          // Trevor: "to be used only when desperate, as the card drawing also
          // benefits your opponent AND it makes you miss a turn."
          //
          // FILED AS UNSCORED FIRST, AND THAT WAS WRONG. Unscored means zero, and
          // zero is exactly what End turn scores — so on a board where the bot
          // could not act it tied, and the tie broke on list order in favour of
          // handing the opponent five cards for nothing. A card that ENDS YOUR OWN
          // TURN cannot be left to a default; the default is indistinguishable
          // from the alternative it is supposed to lose to.
          //
          // NO FLAT TURN PENALTY. The turn is already paid for by competing with
          // the attack action, which scores what the attack is worth; charging it
          // again here would price the turn twice and is the double-count that
          // ENGINE.md's Energy note warns about. What is left is three real terms.
          const mineDraw = Math.min(5, me.deck.length);
          const theirDraw = Math.min(5, you.deck.length);
          s += Math.max(0, 5 - me.hand.length) * W.drawCard * 0.5;   // escaping a dead hand
          s += (mineDraw - theirDraw) * W.drawCard * 0.5;            // and a deck-length edge
          s -= theirDraw * 1.5;                                      // they get the cards too
          break;
        }
        case 'T_IMPOSTOR_OAK':
          // best when they are holding a big hand
          s += Math.max(0, you.hand.length - 3) * 4 - 2;
          break;
        case 'T_MAINTENANCE': {
          const junk = this.rankHandJunk(pi, inst.uid).slice(0, 2);
          if (junk.length < 2) return -Infinity;
          a.opts.shuffleUids = junk;
          s += 3;
          break;
        }
        case 'T_POKEMON_CENTER': {
          const dmgTotal = E.allSlots(pi).reduce((x, y) => x + y.dmg, 0);
          const energyLost = E.allSlots(pi).reduce((x, y) => x + (y.dmg > 0 ? y.energy.length : 0), 0);
          if (dmgTotal <= 0) return -Infinity;
          s += dmgTotal / 10 * W.healPer10 - energyLost * W.energyDiscard;
          break;
        }
        case 'T_REVIVE': {
          const cands = me.discard.filter(x => {
            const c = this.db[x.id]; return c.kind === 'pokemon' && c.stage === 'Basic';
          });
          if (!cands.length || me.bench.length >= E.cfg.benchMax) return -Infinity;
          let best = cands[0];
          for (const c of cands) if (this.db[c.id].hp > this.db[best.id].hp) best = c;
          a.opts.pickUid = best.uid;
          s += 8 + (me.bench.length === 0 ? 18 : 0);
          break;
        }
        case 'T_POKEMON_FLUTE': {
          // clutters their bench; mildly useful, and it can feed our own KOs
          const cands = you.discard.filter(x => {
            const c = this.db[x.id]; return c.kind === 'pokemon' && c.stage === 'Basic';
          });
          if (!cands.length || you.bench.length >= E.cfg.benchMax) return -Infinity;
          let best = cands[0];
          for (const c of cands) if (this.db[c.id].hp < this.db[best.id].hp) best = c;
          a.opts.pickUid = best.uid;
          s += 3;
          break;
        }
        case 'T_SCOOP_UP': {
          const slots = E.allSlots(pi);
          if (!slots.length) return -Infinity;
          // rescue something about to die, and prefer not to throw away Energy
          let best = null, bestV = -Infinity;
          for (const sl of slots) {
            const threat = sl === me.active ? this.incomingThreat(pi) : 0;
            const doomed = threat >= this.remainingHP(sl);
            const v = (doomed ? 30 : 0) + sl.dmg * 0.25 - sl.energy.length * W.energyDiscard
                    - (sl.stack.length - 1) * 12;
            if (v > bestV) { bestV = v; best = sl; }
          }
          a.opts.targetUid = best.uid;
          s += bestV - 6;
          break;
        }
        case 'T_DEVOLUTION_SPRAY':
          // only ever a liability for us; the AI declines unless something odd
          return -Infinity;
        case 'T_ITEM_FINDER': {
          const trs = me.discard.filter(x => this.db[x.id].kind === 'trainer');
          const junk = this.rankHandJunk(pi, inst.uid).slice(0, 2);
          if (!trs.length || junk.length < 2) return -Infinity;
          a.opts.discardUids = junk;
          a.opts.pickUid = trs[0].uid;
          s += 8;
          break;
        }
        case 'T_POKEMON_TRADER': {
          const handMons = me.hand.filter(x => x.uid !== inst.uid && this.db[x.id].kind === 'pokemon');
          const deckMons = me.deck.filter(x => this.db[x.id].kind === 'pokemon');
          if (!handMons.length || !deckMons.length) return -Infinity;
          const inPlay = E.allSlots(pi).map(x => this.top(x).name);
          // trade away something we can't use for an evolution we can
          const want = deckMons.find(x => {
            const c = this.db[x.id];
            return c.evolvesFrom && inPlay.includes(c.evolvesFrom);
          });
          const junkMon = handMons.find(x => {
            const c = this.db[x.id];
            return c.evolvesFrom && !inPlay.includes(c.evolvesFrom);
          }) || handMons[0];
          a.opts.giveUid = junkMon.uid;
          a.opts.takeUid = (want || deckMons[0]).uid;
          s += want ? 14 : 2;
          break;
        }
        case 'T_POKEDEX':
          s += 2;   // small, and the AI has no lookahead to exploit it
          break;
        case 'T_POKEMON_BREEDER': {
          const s2s = me.hand.filter(x => x.uid !== inst.uid
            && this.db[x.id].kind === 'pokemon' && this.db[x.id].stage === 'Stage 2');
          if (!s2s.length) return -Infinity;
          for (const c2 of s2s) {
            const want = E.basicBehind(this.db[c2.id].name);
            const tgt = E.allSlots(pi).find(sl => this.top(sl).name === want
              && sl.playedTurn < E.state.turn && sl.evolvedTurn !== E.state.turn);
            if (tgt) {
              a.opts.evoUid = c2.uid; a.opts.targetUid = tgt.uid;
              s += W.evolveBase + Math.max(0, this.db[c2.id].hp - this.top(tgt).hp) * W.evolveHP + 10;
              break;
            }
          }
          if (a.opts.evoUid === undefined) return -Infinity;
          break;
        }
        case 'T_LASS': {
          const theirTrainers = you.hand.length;     // hidden in practice; value it flat
          s += 3;
          break;
        }
      }
    }
    return s;
  }

  // Cards we'd least mind pitching: spare Energy beyond what we can attach,
  // then evolutions with no pre-evolution in play, then duplicates.
  rankHandJunk(pi, excludeUid) {
    const E = this.E, me = E.state.players[pi];
    const inPlay = new Set(E.allSlots(pi).map(s => this.top(s).name));
    const scored = me.hand
      .filter(x => x.uid !== excludeUid)
      .map(x => {
        const c = this.db[x.id];
        let junk = 0;
        if (c.kind === 'energy') junk = 3;
        else if (c.kind === 'pokemon' && c.evolvesFrom && !inPlay.has(c.evolvesFrom)) junk = 5;
        else if (c.kind === 'pokemon' && c.stage === 'Basic') junk = 2;
        else junk = 1;
        return { uid: x.uid, junk };
      })
      .sort((a, b) => b.junk - a.junk);
    return scored.map(x => x.uid);
  }
  worstHandCard(pi, excludeUid) {
    const r = this.rankHandJunk(pi, excludeUid);
    return r.length ? r[0] : null;
  }

  // What would we most like Computer Search to fetch?
  wantFromDeck(pi) {
    const E = this.E, me = E.state.players[pi];
    const inPlay = E.allSlots(pi).map(s => this.top(s).name);
    // 1) an evolution for something we already have out
    for (const inst of me.deck) {
      const c = this.db[inst.id];
      if (c.kind === 'pokemon' && c.evolvesFrom && inPlay.includes(c.evolvesFrom)) return inst.uid;
    }
    // 2) Energy the Active still needs
    if (me.active) {
      const c = this.top(me.active);
      const need = new Set();
      (c.attacks || []).forEach(a => a.cost.split('').forEach(t => { if (t !== 'C') need.add(t); }));
      for (const inst of me.deck) {
        const e = this.db[inst.id];
        if (e.kind === 'energy' && (e.provides === AI_WILD ? need.size > 0 : need.has(e.provides)))
          return inst.uid;
      }
    }
    // 3) any Basic Pokemon
    for (const inst of me.deck) {
      const c = this.db[inst.id];
      if (c.kind === 'pokemon' && c.stage === 'Basic') return inst.uid;
    }
    return me.deck.length ? me.deck[0].uid : null;
  }

  // ------------------------------------------------------------------ choose
  // Sequencing rule that matters more than any weight: attacking ENDS the turn,
  // so every worthwhile non-attack action must happen first.
  // ORDER OF OPERATIONS, and it is information rather than value — 31 Aug 2026,
  // from Trevor watching the GBC sequel and Pocket. Both play their hand-growing
  // cards BEFORE attaching, so the attachment is made knowing what arrived; and
  // both play a deck-NARROWING card before a random draw, because taking a known
  // card out of the deck improves the odds of everything drawn after it.
  //
  // `choose` picks setup actions purely by score, so an attach scoring 101 has
  // always gone before a Bill scoring 10 — and then the Bill draws the Charizard
  // that would have changed where the Energy went. No score can express this,
  // because the value of the Bill is not higher; it is EARLIER.
  //
  // ONLY CARDS THAT COST NOTHING FROM HAND ARE REORDERED, and that carve-out is
  // the whole care in this. Professor Oak discards your hand, Gambler shuffles it
  // back, Computer Search pitches two — forcing any of those ahead of an
  // attachment can eat the very Energy you were about to attach. Trevor's own
  // Professor Oak note is this rule from the other side: "consumables want to be
  // used immediately before Professor Oak even if they're not needed, because
  // they get discarded otherwise." **An action that can consume your hand must
  // never be promoted ahead of one that uses it.**
  //
  // So this is deliberately four verbs rather than a category, and a new card
  // joins only if it takes nothing from hand.
  handGrowKind(pi, a) {
    if (a.t !== 'playTrainer') return null;
    const inst = this.E.state.players[pi].hand[a.hand];
    const script = (inst && this.eff[inst.id] && this.eff[inst.id].t) || [];
    for (const v of script) {
      if (v.v === 'T_ENERGY_SEARCH' || v.v === 'T_POKE_BALL' || v.v === 'T_SEARCH_TO_HAND') return 'narrow';
      if (v.v === 'T_DRAW') return 'draw';
    }
    return null;
  }

  // Given the action scoring highest, is there one that should simply happen
  // first? Returns null when the order is already right, which is most turns.
  //
  // It never promotes something the bot did not already want: every candidate
  // has to clear `threshold` on its own score, exactly as it would have to to be
  // chosen at all. This reorders; it does not add plays.
  playFirst(pi, setup, best) {
    if (!best) return null;
    const kindOf = a => this.handGrowKind(pi, a);
    const worth = a => this.scoreAction(pi, a) >= this.W.threshold;
    const pick = list => (list.length ? this.pickBest(pi, list) : null);

    // An attachment is the last thing you do, because everything else can change
    // where it should go.
    if (best.t === 'attachEnergy') {
      const grow = setup.filter(a => kindOf(a) && worth(a));
      if (grow.length) {
        const narrow = grow.filter(a => kindOf(a) === 'narrow');
        return pick(narrow.length ? narrow : grow);
      }
      // AND AN EVOLUTION GOES BEFORE IT TOO — 1 Sep 2026, Trevor, from the GBC
      // game and confirmed in Pocket: *"the opponent attaches the energy
      // absolutely last before attacking, almost like the bot goes down a
      // checklist of everything else before it's allowed to roll the energy
      // attach numbers at all."*
      //
      // #31 named this exact case and declined to extend the rule to it, on the
      // grounds that `attachBuild` already looks ahead through `evolutionInHand`
      // so an attachment made first is not blind to the evolution. That is true
      // of the attachment's VALUE and it was the right call without evidence.
      // What it does not cover: after the evolve, the card competes for the
      // Energy as the evolved form, so every term that reads the BODY rather than
      // the plan sees the right one — `survivesCharge` prices an Abra at 30 HP and
      // a Kadabra at 60, and only one of them is going to be holding the Energy.
      //
      // **READY ONES ONLY, and this guard is the whole safety of it.** A
      // `roadWant > 0` evolve is the bot deliberately WAITING, and promoting one
      // would let an ordering rule silently overrule the readiness rule two
      // functions away — which is exactly the failure #31 was protecting against.
      //
      // DELIBERATELY NOT EXTENDED TO `playBasic`, which #31 flags as the one with
      // a real case of its own. Trevor's observation was about evolving; extending
      // an ordering rule because its argument happens to reach is how a narrow fix
      // becomes a turn-structure rewrite.
      const readyEvolve = a => {
        if (a.t !== 'evolve') return false;
        const inst = this.E.state.players[pi].hand[a.hand];
        const slot = this.E.findSlot(pi, a.target);
        return !!inst && !!slot && this.roadWant(pi, slot, inst.id) === 0;
      };
      const evos = setup.filter(a => readyEvolve(a) && worth(a));
      if (evos.length) return pick(evos);
      return null;
    }
    // Trevor's Poke Ball point: a search takes a card out of the deck, so every
    // draw made after it is drawn from a better pool. One card of improvement,
    // and it is free.
    if (kindOf(best) === 'draw') {
      const narrow = setup.filter(a => kindOf(a) === 'narrow' && worth(a));
      if (narrow.length) return pick(narrow);
    }
    return null;
  }

  choose(pi) {
    const E = this.E, s = E.state;
    if (s.phase === 'over') return null;

    // WHAT DOES *THIS PLAYER* OWE — asked in priority order, once, rather than
    // as four independent "is anything pending" blocks. It was the second shape
    // and that is a bug: each block returned null when its own thing was owed by
    // somebody ELSE, so a Prize owed to player 1 was swallowed by the promotion
    // owed to player 0 and nobody ever answered. The game hung.
    //
    // That is now the fourth time this exact mistake has been made in this
    // engine — Whirlwind's pendingSwitch, pendingAsk, the Prize gate in act(),
    // and here. THE RULE: every owed choice is PER PLAYER, and a new one needs a
    // branch in all three places (act(), legalActions() and this) that asks what
    // *pi* owes rather than what is outstanding anywhere.
    //
    // Priority within a player: answer a question, get a body onto the empty
    // Active spot, then take the Prize. A board with no Active is not a board.
    const owedBy = (v) => v !== null && v !== undefined;
    const anyOwed = owedBy(s.pendingAsk) || owedBy(s.pendingSwitch)
                 || owedBy(s.pendingPromote) || owedBy(s.pendingPrize);
    if (anyOwed) {
      const pick = (kind) => {
        const acts = E.legalActions(pi).filter(x => x.t === kind);
        return acts.length ? this.pickBest(pi, acts, true) : null;
      };
      if (owedBy(s.pendingAsk) && s.pendingAsk.player === pi) return pick('answer');
      if (s.pendingSwitch === pi) return pick('switchIn');
      if (s.pendingPromote === pi) return pick('promote');
      if (s.pendingPrize === pi) return pick('takePrize');
      return null;                      // owed by the other player
    }
    if (s.active !== pi) return null;

    const acts = E.legalActions(pi);
    if (!acts.length) return null;

    // WIN THE GAME IF YOU CAN WIN THE GAME.
    //
    // Everything below this is a greedy setup loop: any non-attack action
    // scoring over `threshold` is taken, one per call, and attacking is only
    // considered once nothing else clears the bar. That ordering is right in
    // general — setup does not end your turn and attacking does, so you should
    // always spend your Energy and Trainers first.
    //
    // It is catastrophically wrong in exactly one case. From one of Trevor's
    // games: his last Pokemon was on 10 HP, the bot had a lethal Beedrill, and
    // it spent the turn on a Super Potion and a retreat instead of winning. No
    // score could have saved it, because the attack was never in the comparison
    // — a 0.6-point Trainer beats a 240-point attack when the attack is not on
    // the table. So a winning attack is checked FIRST and taken outright.
    //
    // The bar is deliberately near-certain. A coin-flip lethal is not a win, and
    // setup that turns 50% into 100% is worth doing first — that case belongs to
    // the scoring, which now knows what a win is worth.
    const attacksNow = acts.filter(a => a.t === 'attack');
    for (const a of attacksNow) {
      const f = this.forecast(pi, a.idx, a.opts);
      if (!f || f.pLethal < 0.99) continue;
      const me = s.players[pi], you = s.players[1 - pi];
      // ...unless taking it kills us too and hands them the game. The shortcut
      // bypasses scoring entirely, so the rule above cannot save us here.
      const suicide = (f.selfWorst || 0) >= this.remainingHP(me.active)
        && (you.prizes.length <= 1 || me.bench.length === 0);
      if (suicide) continue;
      if (me.prizes.length <= 1 || you.bench.length === 0) {
        a.__score = this.W.lastPrize;
        a.__why = you.bench.length === 0
          ? 'this Knock Out leaves them with no Pokemon'
          : 'this Knock Out takes our last Prize';
        if (this.explain) a.__considered = [{ label: this.actionLabel(a), score: this.W.lastPrize }];
        return a;
      }
    }

    const setup = acts.filter(a => a.t !== 'attack' && a.t !== 'pass');
    const best = setup.length ? this.pickBest(pi, setup) : null;
    if (best && best.__score >= this.W.threshold) {
      // Same set of plays, better order. See `playFirst`.
      const first = this.playFirst(pi, setup, best);
      // THE PROMOTED ACTION KEEPS ITS OWN SCORE. An earlier version copied the
      // attachment's score onto it, which would have written a Bill into the match
      // log at 101.00 — a number that is true of nothing. The log is the one
      // instrument that shows what the bot weighed, so a promotion has to read as
      // a promotion; `__why` is what says so.
      if (first) {
        first.__why = `played before ${this.actionLabel(best)}, which can only get better for it`;
        return first;
      }
      return best;
    }

    const attacks = acts.filter(a => a.t === 'attack');
    if (attacks.length) {
      const bestAtk = this.pickBest(pi, attacks);
      if (bestAtk && bestAtk.__score > 0) return bestAtk;
    }
    const passAct = acts.find(a => a.t === 'pass') || null;
    if (passAct && this.explain) this.explainPass(pi, passAct, attacks);
    return passAct;
  }

  // A PASS HAS TO SAY WHY IT DID NOT ATTACK — 16 Aug 2026.
  //
  // Every other decision the bot makes prints its runners-up. The pass printed
  // nothing at all, because it is the bare action off `legalActions` and never
  // went through `pickBest`. So the one question a reader has when they see the
  // opponent do nothing — *why didn't it swing?* — was the one question the
  // match log could not answer, and a playtest report sat open for two days on
  // exactly that. Two different silences were indistinguishable in the file:
  // "every attack scored zero or less" and "there was no legal attack".
  //
  // Gated on `explain` like the rest of the reasoning, so the suites pay nothing.
  explainPass(pi, a, attacks) {
    const E = this.E, me = E.state.players[pi];
    a.__score = 0;
    if (attacks && attacks.length) {
      const rows = [];
      for (const x of attacks) {
        const sc = this.scoreAction(pi, x);
        if (isFinite(sc)) rows.push({ label: this.actionLabel(x), score: Math.round(sc * 10) / 10 });
      }
      rows.sort((p, q) => q.score - p.score);
      // The renderer treats the first entry as the one that was chosen and lists
      // the rest as "passed over", so passing itself leads, scored as it scores.
      a.__considered = [{ label: 'pass', score: 0 }].concat(rows.slice(0, 5));
      a.__why = 'no attack was worth taking';
      return;
    }
    // Nothing legal. The engine already knows the reason for each attack and
    // says so in plain English — this just carries it out to the reader instead
    // of throwing it away.
    if (!me.active) { a.__why = 'no Active Pokemon'; return; }
    if (!E.canAttackAtAll(pi)) {
      const st = me.active.status;
      a.__why = st.asleep ? 'the Active is Asleep'
        : st.paralyzed ? 'the Active is Paralyzed'
        : 'attacking is not allowed this turn';
      return;
    }
    const c = this.top(me.active);
    const why = (c.attacks || []).map((atk, i) => {
      const chk = E.canUseAttack(pi, i);
      return `${atk.name}: ${chk.ok ? 'legal' : chk.why}`;
    });
    a.__why = why.length ? `no attack available — ${why.join('; ')}` : 'this Pokemon has no attacks';
  }

  pickBest(pi, acts, allowNegative = false) {
    const noisy = this.mode === 'novice';
    let best = null, bestScore = -Infinity;
    const scored = [];
    for (const a of acts) {
      let sc = this.scoreAction(pi, a);
      if (noisy && sc > -Infinity) sc += (this.E.rand() - 0.5) * 12;
      scored.push({ a, sc });
      if (sc > bestScore) { bestScore = sc; best = a; }
    }
    if (!best) return null;
    if (!allowNegative && bestScore === -Infinity) return null;

    // A novice misses the best line sometimes - but picks another SENSIBLE
    // move, not a random one. Deliberately fumbling into nonsense made it play
    // worse than the dumb greedy bot, which is not what "easier" should mean.
    if (noisy && this.E.rand() < 0.22) {
      const ok = scored.filter(x => x.sc > 0 && x.a !== best);
      if (ok.length) {
        const pickIt = ok[Math.floor(this.E.rand() * ok.length)];
        this.scoreAction(pi, pickIt.a);      // re-run so opts are populated
        pickIt.a.__score = pickIt.sc;
        return pickIt.a;
      }
    }
    best.__score = bestScore;
    // The runners-up, for the match log. Gated on `explain` because populating
    // it on every decision would cost the test suites real time for nothing —
    // selftest alone plays a few hundred games. See src/eventlog.js.
    if (this.explain) best.__considered = this.explainScored(scored);
    return best;
  }

  // Sort and label a pickBest score list for a human reading the match log.
  // Labels are the action's shape rather than its card name; the log line above
  // already names what was actually played.
  explainScored(scored) {
    return scored
      .filter(x => isFinite(x.sc))
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 6)
      .map(x => ({ label: this.actionLabel(x.a), score: Math.round(x.sc * 10) / 10 }));
  }

  actionLabel(a) {
    switch (a.t) {
      case 'attack': {
        const act = this.E.state.players[this.E.state.active];
        const c = act && act.active && this.top(act.active);
        const atk = c && (c.attacks || [])[a.idx];
        return atk ? `attack:${atk.name}` : `attack#${a.idx}`;
      }
      case 'attachEnergy': return 'attach';
      case 'playTrainer': return 'trainer';
      case 'playBasic': return 'bench';
      case 'evolve': return 'evolve';
      case 'retreat': return 'retreat';
      case 'power': return `power:${a.kind || ''}`;
      case 'promote': return 'promote';
      case 'switchIn': return 'switchIn';
      default: return a.t;
    }
  }
}

if (typeof module !== 'undefined') module.exports = { AI, AI_WEIGHTS, wallScore };

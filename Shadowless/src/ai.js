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
  attachSurplus: -2,    // attaching to a Pokemon that needs nothing. Negative so
                        // it falls under `threshold` and the card is HELD
  evolveHP: 0.45,       // per point of max-HP gained
  evolveBase: 16,       // evolving is good almost always
  benchFirst: 26,       // first spare Basic on the bench is important
  benchMore: 7,         // each additional one
  benchTooMany: 2,
  retreatBase: -6,      // retreating costs tempo and Energy
  dangerSwap: 22,       // ...but escaping a lethal threat is worth it — CAPS the
                        // rescue value below, so a bare Basic is never worth 22
  retreatTempo: 0.55,   // per point of printed damage the swap gives up this turn
  retreatSaveEnergy: 7, // rescue value per Energy already invested in the Active
  retreatSaveEvolved: 9,// ...plus this if it is not a Basic
  retreatNoCause: -14,  // retreating when nothing actually threatens the Active
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

const STATUS_VALUE = { Paralyzed: 'paralyze', Asleep: 'sleep', Confused: 'confuse', Poisoned: 'poison' };

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
  HEAL_SELF_ALL: 1, HEAL_SELF_IF_DAMAGED: 1, HEAL_SELF_ON_FLIP: 1,
  HEAL_SELF_EQUAL_DAMAGE: 1,
};
// STATUS_SELF and STATUS_SELF_ON_TAILS are POINTEDLY absent. So is
// DAMAGE_REDUCTION_FROM, which shields against one attacker for one turn —
// a trick, not a job.

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

// 0 for everything that is not a wall, up to 1 for the most immovable thing in
// the format. Memoised per db: the answer is a property of the card, and the
// evolution scan is over the whole pool.
const WALL_SCORES = new WeakMap();
function wallScore(db, effects, card) {
  if (!card || card.kind !== 'pokemon') return 0;
  let m = WALL_SCORES.get(db);
  if (!m) { m = new Map(); WALL_SCORES.set(db, m); }
  if (m.has(card.id)) return m.get(card.id);

  let v = 0;
  if (card.stage === 'Basic' && !namesWithAnEvolution(db).has(card.name)) {
    const hp = Math.min(1, Math.max(0, ((card.hp || 0) - 50) / 50));
    const ret = Math.min(1, (card.retreat || 0) / 3);
    const scripts = (effects[card.id] && effects[card.id].a) || [];
    const util = scripts.some(l => (l || []).some(x => STALL_VERBS[x.v])) ? 1 : 0;
    v = 0.5 * hp + 0.3 * ret + 0.2 * util;
  }
  m.set(card.id, v);
  return v;
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
      const c = this.db[inst.id];
      if (!c) continue;
      if (c.kind === 'energy') {
        // Only worth keeping if something actually wants it.
        v += inPlay.some(sl => this.potential(pi, sl).short > 0) ? 4 : 1;
      } else if (c.kind === 'pokemon' && c.evolvesFrom) {
        // An evolution whose target is on the board is a real card.
        v += inPlay.some(sl => this.top(sl).name === c.evolvesFrom) ? 9 : 1.5;
      } else if (c.kind === 'pokemon') {
        v += me.bench.length < 3 ? 4 : 1.5;
      } else {
        v += 2.5;   // a Trainer. Playable ones are worth more, but scoring every
                    // one of them here would recurse into this scorer.
      }
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
        case 'COST_DISCARD_ENERGY': energyCost += v.n; break;
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
        case 'DMG_PER_COUNTER_SELF':
          split(() => [[1, v.per * Math.floor(atkSlot.dmg / 10)]]); break;
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
        case 'BENCH_SPLASH': flags.benchSplash = v.n; break;
        case 'SWITCH_DEFENDER_CHOOSE': flags.drag = true; break;
        case 'PREVENT_ALL_DMG_SELF_ON_FLIP': flags.shield = 0.5; break;
        case 'BARRIER': flags.shield = 1; break;
        case 'HARDEN': flags.harden = v.threshold; break;
        case 'DESTINY_BOND': flags.destinyBond = true; break;
        case 'JAM_DEFENDER': flags.jam = true; break;
        case 'HEAL_SELF_ALL': flags.healAll = true; break;
        case 'HEAL_SELF_IF_DAMAGED': flags.heal = v.n; break;
        case 'ONCE_WHILE_IN_PLAY': flags.oncePerStay = true; break;

        // Everything below scored as plain base damage until 10 Aug 2026. See
        // ENGINE.md, "The silent-failure surface", and the coverage check in
        // selftest.js that now refuses to let a verb land here unnoticed.
        case 'COST_DISCARD_ALL_ENERGY':
          // Thunderbolt. The bot thought this was free and fired it on sight.
          energyCost += atkSlot.energy.length; break;
        case 'DMG_PER_SPARE_ENERGY': {
          // The Water Gun / Hydro Pump family. Mirrors the engine's arithmetic:
          // Energy of type t attached, minus what this attack's own cost eats.
          const need = (atk.cost || '').split('').filter(x => x === v.t).length;
          const have = atkSlot.energy.filter(e =>
            this.db[e.id] && this.db[e.id].provides === v.t).length;
          split(() => [[1, v.base + v.per * Math.max(0, have - need)]]);
          break;
        }
        case 'DMG_HALF_REMAINING':
          // Super Fang prints no damage number, so the bot valued it at zero.
          split(() => [[1, defSlot ? Math.ceil(this.remainingHP(defSlot) / 2 / 10) * 10 : 0]]);
          break;
        case 'FLIP_BONUS_OR_RECOIL':
          split(() => [[0.5, v.base + v.bonus], [0.5, v.base]]);
          selfDmg += v.recoil * 0.5; selfWorst += v.recoil; pSelfWorst *= 0.5; break;
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
        case 'SWITCH_SELF_CHOOSE': flags.selfSwitch = true; break;
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
             energyCost, flags };
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
          const fuel = you.active.energy.filter(e => !v.t
            || (this.db[e.id] && this.db[e.id].provides) === v.t).length;
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
    if (!f.blocked) {
      if (!f.statusProof) for (const st in f.statuses) {
        const key = STATUS_VALUE[st];
        if (key) s += f.statuses[st] * W[key];
      }
      if (f.flags.jam) s += W.confuse;          // same shape as Confusion
      if (f.flags.drag && you.bench.length) s += W.drag;
      // Whirlwind drags too, but THEY choose, so they send up their best answer.
      if (f.flags.dragWeak && you.bench.length) s += W.drag * 0.5 * (f.flags.dragWeak === true ? 1 : f.flags.dragWeak);
      // Amnesia. Shuts off one attack rather than making them flip for all of
      // them, so it is worth somewhat less than a jam.
      if (f.flags.attackLock) s += W.confuse * 0.6;
      if (f.flags.stripEnergy && you.active && you.active.energy.length) s += W.stripEnergy;
    }

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
    if (f.energyCost > 0) s -= f.energyCost * W.energyDiscard;

    // bench splash cuts both ways
    if (f.flags.benchSplash) {
      const n = f.flags.benchSplash;
      for (const b of you.bench) {
        s += Math.min(n, this.remainingHP(b)) * W.benchDamageFoe;
        if (this.remainingHP(b) <= n) s += W.knockout * 0.6;
      }
      for (const b of me.bench) {
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

    // defensive plays are worth more the more danger we're in
    const danger = this.incomingThreat(pi);
    const frail = danger >= this.remainingHP(atkSlot);
    if (f.flags.shield) s += f.flags.shield * W.shieldSelf * (frail ? 1.6 : 0.7);
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
      const has = atkSlot.energy.filter(e => {
        const c = this.db[e.id];
        return c && c.kind === 'energy' && c.cls === 'Basic' && c.provides === t;
      }).length;
      const wants = Math.max(0, ...(this.top(atkSlot).attacks || [])
        .map(at => String(at.cost || '').split('').filter(ch => ch === t).length));
      const short = Math.max(0, wants - has);
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
    if (f.flags.selfSwitch && me.bench.length) s += frail ? W.dangerSwap : 2;
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
        const c2 = this.db[e.id]; return c2 && c2.provides === 'R';
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
      const isActive = E.state.players[pi].active === slot;
      let val;
      if (short === 0) {
        val = isActive ? this.scoreAttackHypothetical(pi, slot, i) : aiParseDamage(a.dmg);
      } else {
        val = -1;
      }
      const dmg = aiParseDamage(a.dmg);
      if (short < bestShort) { bestShort = short; goal = dmg; }
      else if (short === bestShort && dmg > goal) goal = dmg;
      if (val > best) best = val;
    });
    return { best: best === -Infinity ? 0 : best, short: bestShort, goal };
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
      }
    }
    return s;
  }

  attachValue(pi, slot, energyId) {
    const W = this.W, E = this.E;
    const before = this.potential(pi, slot, null);
    const after = this.potential(pi, slot, energyId);
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
    if (after.short === 0 && before.short > 0) {
      // Completing. `attachEnable` has already paid the attack's real value, so
      // this stays the flat finishing bonus it has always been.
      s += W.attachBuild * before.short * 2;
    } else if (after.short < before.short) {
      const steps = before.short - after.short;
      s += Math.max(10, before.goal) * (steps / before.short)
         * W.attachAmortise * this.survivesCharge(pi, slot, after.short);
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
    if (gives.some(x => x !== 'C' && typedNeed.has(x))) s += W.attachOnType;
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
  survivesCharge(pi, slot, turnsNeeded) {
    if (turnsNeeded <= 0 || slot !== this.E.state.players[pi].active) return 1;
    const threat = this.incomingThreat(pi);
    if (threat <= 0) return 1;
    const turnsLeft = Math.ceil(this.remainingHP(slot) / threat);
    return Math.min(1, turnsLeft / turnsNeeded);
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
    for (const a of (this.top(slot).attacks || [])) {
      if (!E.costSatisfied(slot, a.cost)) continue;
      const base = aiParseDamage(a.dmg);
      // No defender is the setup/knockout gap, not a matchup — fall back to the
      // printed number rather than scoring every attack at zero.
      const d = def ? E.computeDamage(slot, def, base).dmg : base;
      if (d > best) best = d;
    }
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
        const key = STATUS_VALUE[p.status];
        if (!key) return -Infinity;
        const them = E.state.players[1 - pi];
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
        const k = from.energy.findIndex(e => E.isBasicEnergyOf(e, def.energy));
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
    if (p.active === slot) {
      const chk = E.canUseAttack(pi, idx);
      return chk.ok ? this.scoreAttack(pi, idx) : aiParseDamage(this.top(slot).attacks[idx].dmg);
    }
    return aiParseDamage(this.top(slot).attacks[idx].dmg);
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
        if (a.opts && a.opts.type && me.active) {
          const scr = this.script(me.active, a.idx);
          if (scr.some(v => v.v === 'CONVERT_DEF_WEAKNESS')) {
            const mine = new Set(E.allSlots(pi).map(x => this.top(x).type));
            if (mine.has(a.opts.type)) sc += 12;
          }
          if (scr.some(v => v.v === 'CONVERT_SELF_RESISTANCE')) {
            const theirs = E.state.players[1 - pi].active;
            if (theirs && this.top(theirs).type === a.opts.type) sc += 10;
          }
        }
        return sc;
      }

      case 'power': return this.scorePower(pi, a);

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
        // Symbols, not cards, and the LIVE cost rather than the printed one —
        // `retreatCostOf` is what actually gets charged, and it already knows
        // about Dodrio. Both halves of that were wrong here before 17 Aug and
        // both were invisible: a Double Colorless read as one, and a benched
        // Dodrio was not consulted at all.
        const needsEscape = isActive
          && this.E.energyTotal(slot) < this.E.retreatCostOf(slot);
        if (noProgress && !needsEscape) return W.attachSurplus;

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
        let s = W.retreatBase - cost * 4;

        // What the swap does to our offence THIS turn. The replacement can still
        // attack after retreating, so what matters is the difference between the
        // two, not the whole of the current attack — and both sides are measured
        // in printed damage because that is the only currency they share.
        //
        // SYMMETRIC on purpose. Swapping down costs; swapping UP pays, and it
        // has to, or bringing a charged attacker off the Bench to replace a
        // spent one becomes impossible. An early version penalised every
        // unthreatened retreat flat and killed that play outright.
        const delta = this.bestAffordableDamage(pi, b)
                    - this.bestAffordableDamage(pi, me.active);
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
          const stick = wallScore(E.db, this.eff, this.top(me.active));
          s += Math.min(W.dangerSwap, invested) * (1 - stick * W.wallStick) + prize;
        } else if (delta <= 0) {
          // Nothing threatens the Active AND the replacement hits no harder, so
          // this is neither an escape nor an upgrade — just Energy spent to
          // rearrange the board. This is what 24% of the bot's retreats were.
          s += W.retreatNoCause;
        }

        if (mineNow < 0 || mineNow === -Infinity) s += 10;
        if (theirs.short === 0) s += 8;
        // never retreat into something that dies instantly
        if (danger >= this.remainingHP(b)) s -= 18;

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
      else if (c.kind === 'energy') junk = need.has(c.provides) ? 0.15 : 0.9;
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

        case 'T_HEAL': {
          const cands = E.allSlots(pi).filter(x => x.dmg > 0);
          if (!cands.length) return -Infinity;
          let best = cands[0];
          for (const c of cands) if (c.dmg > best.dmg) best = c;
          a.opts.targetUid = best.uid;
          s += Math.min(v.n * 10, best.dmg) / 10 * W.healPer10;
          // Healing poured past the damage is thrown away, and nothing charged
          // for it: a Potion on a Pokemon with 10 damage still scored 3.5 and
          // cleared the action threshold, so 34% of heals were premature.
          // Super Potion never had this problem, purely by accident — its Energy
          // cost happens to cancel the value at exactly 20 damage. This is that
          // brake, made deliberate and applied to the card that lacked it.
          s -= Math.max(0, v.n * 10 - best.dmg) / 10 * W.healWaste;
          // ...unless it is about to die, where topping off a scratch is still
          // the difference between surviving the turn and not.
          if (best === me.active && this.incomingThreat(pi) >= this.remainingHP(best)) s += 12;
          break;
        }

        case 'T_DISCARD_ENERGY_THEN_HEAL': {
          const cands = E.allSlots(pi).filter(x => x.dmg > 0 && x.energy.length);
          if (!cands.length) return -Infinity;
          let best = cands[0];
          for (const c of cands) if (c.dmg > best.dmg) best = c;
          a.opts.targetUid = best.uid;
          s += Math.min(v.n * 10, best.dmg) / 10 * W.healPer10 - W.energyDiscard;
          s -= Math.max(0, v.n * 10 - best.dmg) / 10 * W.healWaste;

          // The Energy it discards can switch the target's OWN attack off, which
          // turns a heal into a disarm. This is the first half of a compound
          // Trevor caught: Super Potion healed a lethal Beedrill and stripped
          // the Energy it needed to swing, and the retreat logic then correctly
          // observed that the Active could no longer attack and swapped it out.
          // Two defensible decisions, one disastrous turn — and the fault is
          // here, in the one that created the situation.
          const held = best.energy.pop();
          const shortAfter = this.potential(pi, best, null).short;
          best.energy.push(held);
          const shortBefore = this.potential(pi, best, null).short;
          if (shortAfter > shortBefore) s -= (best === me.active) ? W.healDisarm : W.healDisarm * 0.3;

          if (best === me.active && this.incomingThreat(pi) >= this.remainingHP(best)) s += 12;
          break;
        }

        case 'T_SWITCH_OWN': {
          if (!me.bench.length || !me.active) return -Infinity;
          // Same yardstick as promoting, deliberately. When these were two
          // formulas they picked different Pokemon, and the visible symptom was
          // the bot promoting one and then spending a Switch to undo it.
          let bestI = -1, bestV = -Infinity;
          me.bench.forEach((b, i) => {
            const v2 = this.promoteValue(pi, b);
            if (v2 > bestV) { bestV = v2; bestI = i; }
          });
          a.opts.bench = bestI;
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
          // "Cannot kill it" is NOT the fault on its own, and treating it as one
          // throws away the card's other real use. Dragging up a Pokemon that
          // cannot pay for an attack costs them a whole turn — tempo denial is a
          // perfectly good reason to spend a Gust. The genuinely bad drag is the
          // one that pulls up something we can neither kill NOR silence, which
          // is a free switch performed on the opponent's behalf.
          let bestI = 0, bestV = -Infinity, bestKills = false, bestSwings = true;
          you.bench.forEach((b, i) => {
            const pot = this.potential(1 - pi, b, null);
            // Can we finish it once it is up? bestDamageAgainst forecasts our
            // Active against a defender that is still on their Bench, which is
            // the only way to ask this before committing the card.
            const kills = this.bestDamageAgainst(pi, b) >= this.remainingHP(b);
            const canSwing = pot.short === 0;
            let v2 = (100 - this.remainingHP(b)) * 0.4 + (canSwing ? 0 : 18);
            if (kills) v2 += W.dragKill;
            if (v2 > bestV) { bestV = v2; bestI = i; bestKills = kills; bestSwings = canSwing; }
          });
          a.opts.bench = bestI;
          s += W.drag + bestV * 0.3;
          if (!bestKills && bestSwings) s += W.dragNoKill;
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
          a.opts.targetUid = best.uid; a.opts.energyIdx = 0;
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
          s += Math.min(2, tgt.energy.length) * W.stripEnergy - W.energyDiscard;
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
          s += 6;
          if (f.expDmg < f.hpLeft && f.expDmg + 10 >= f.hpLeft) s += 34;   // turns it lethal
          break;
        }

        case 'T_DEFENDER': {
          const danger = this.incomingThreat(pi);
          if (!me.active) return -Infinity;
          a.opts.targetUid = me.active.uid;
          s += danger > 0 ? 8 : -2;
          if (danger >= this.remainingHP(me.active) && danger - 20 < this.remainingHP(me.active)) s += 26;
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
        if (e.kind === 'energy' && need.has(e.provides)) return inst.uid;
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
  choose(pi) {
    const E = this.E, s = E.state;
    if (s.phase === 'over') return null;

    // Whirlwind dragged one of ours up. Send the one we least mind exposing:
    // biggest HP pool, same instinct as choosing a replacement after a KO.
    if (s.pendingSwitch !== null) {
      if (s.pendingSwitch !== pi) return null;
      const acts = E.legalActions(pi).filter(a => a.t === 'switchIn');
      if (!acts.length) return null;
      return this.pickBest(pi, acts, true);
    }
    if (s.pendingPromote !== null) {
      if (s.pendingPromote !== pi) return null;
      const acts = E.legalActions(pi).filter(a => a.t === 'promote');
      if (!acts.length) return null;
      return this.pickBest(pi, acts, true);
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
    if (best && best.__score >= this.W.threshold) return best;

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

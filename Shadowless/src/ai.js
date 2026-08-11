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
  shieldSelf: 20,       // Stiffen / Withdraw / Barrier
  destinyBond: 18,      // arming Destiny Bond when death looks likely
  attachEnable: 1.0,    // scale on "how much better my attacks get"
  attachBuild: 3.5,     // progress toward an attack we can't afford yet
  evolveHP: 0.45,       // per point of max-HP gained
  evolveBase: 16,       // evolving is good almost always
  benchFirst: 26,       // first spare Basic on the bench is important
  benchMore: 7,         // each additional one
  benchTooMany: 2,
  retreatBase: -6,      // retreating costs tempo and Energy
  dangerSwap: 22,       // ...but escaping a lethal threat is worth it
  drawCard: 5,          // per card drawn
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

class AI {
  constructor(engine, opts = {}) {
    this.E = engine;
    this.W = Object.assign({}, AI_WEIGHTS, opts.weights || {});
    this.mode = opts.mode || 'expert';
  }

  get db() { return this.E.db; }
  get eff() { return this.E.effects; }
  top(slot) { return this.db[slot.stack[slot.stack.length - 1].id]; }
  script(slot, idx) {
    const c = this.top(slot);
    const e = this.eff[c.id];
    return (e && e.a && e.a[idx]) || [];
  }
  remainingHP(slot) { return this.top(slot).hp - slot.dmg; }

  // ---------------------------------------------------------------- forecast
  // Enumerate coin-flip outcomes for an attack into a probability distribution.
  // Returns raw (pre-Weakness) damage outcomes plus effect probabilities.
  rawOutcomes(atkSlot, defSlot, idx, vopts) {
    const c = this.top(atkSlot);
    const empty = { outcomes: [{ p: 1, dmg: 0 }], statuses: {}, selfDmg: 0, energyCost: 0, flags: {} };
    let atk = (c.attacks || [])[idx];
    if (!atk) return { outcomes: [], statuses: {}, selfDmg: 0, energyCost: 0, flags: {} };
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
               selfDmg: 0, energyCost: 0, flags: { flat: true } };
    }

    let base = aiParseDamage(atk.dmg);
    let outcomes = [{ p: 1, dmg: base }];
    const statuses = {};
    const flags = {};
    let selfDmg = 0, energyCost = 0;

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
        case 'STATUS': statuses[v.s] = 1; break;
        case 'STATUS_ON_FLIP': statuses[v.s] = 0.5; break;
        case 'RECOIL': selfDmg += v.n; break;
        case 'RECOIL_ON_FLIP': selfDmg += v.n * 0.5; break;
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
          selfDmg += v.recoil * 0.5; break;
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
      }
    }
    // FLIP_OR_NOTHING suppresses the whole attack, statuses included.
    if (flags.halfWhiff) for (const k in statuses) statuses[k] *= 0.5;
    return { outcomes, statuses, selfDmg, energyCost, flags };
  }

  // Run each raw outcome through the engine's own damage maths.
  forecast(pi, idx, vopts) {
    const E = this.E;
    const me = E.state.players[pi], you = E.state.players[1 - pi];
    const atkSlot = me.active, defSlot = you.active;
    if (!atkSlot || !defSlot) return null;
    const raw = this.rawOutcomes(atkSlot, defSlot, idx, vopts);
    const hpLeft = this.remainingHP(defSlot);
    let expDmg = 0, pLethal = 0;
    for (const o of raw.outcomes) {
      const r = E.computeDamage(atkSlot, defSlot, o.dmg, { noWR: !!raw.flags.flat });
      expDmg += o.p * r.dmg;
      if (r.dmg >= hpLeft) pLethal += o.p;
    }
    // Kabuto Armor and Invisible Wall need nothing here — they live inside
    // computeDamage, which is the whole reason the bot can never predict a
    // number the engine would not actually produce.
    //
    // Haunter's Transparency does, because its coin is deliberately NOT in
    // computeDamage (that function is pure). Half the time the attack does
    // nothing at all, so halve both the damage and the odds of the Knock Out.
    if (E.activePower(defSlot, 'FLIP_TO_NEGATE')) { expDmg *= 0.5; pLethal *= 0.5; }

    const blocked = E.effectsBlocked(defSlot);
    // Snorlax cannot be given a CONDITION — but it can still be Smokescreened,
    // dragged, and stripped of Energy, so this is its own flag rather than
    // reusing `blocked`, which suppresses all of those too.
    const statusProof = !!E.activePower(defSlot, 'STATUS_IMMUNE');
    return { expDmg, pLethal, hpLeft, blocked, statusProof, ...raw };
  }

  // ------------------------------------------------------------ attack score
  scoreAttack(pi, idx, vopts) {
    const W = this.W, E = this.E;
    const f = this.forecast(pi, idx, vopts);
    if (!f) return -Infinity;
    const me = E.state.players[pi], you = E.state.players[1 - pi];
    const atkSlot = me.active;

    let s = f.expDmg * W.damage;
    if (f.pLethal > 0) {
      s += f.pLethal * (you.prizes.length <= 1 ? W.lastPrize : W.knockout);
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
      if (f.flags.dragWeak && you.bench.length) s += W.drag * 0.5;
      // Amnesia. Shuts off one attack rather than making them flip for all of
      // them, so it is worth somewhat less than a jam.
      if (f.flags.attackLock) s += W.confuse * 0.6;
      if (f.flags.stripEnergy && you.active && you.active.energy.length) s += W.stripEnergy;
    }

    // self-harm
    if (f.selfDmg > 0) {
      s -= f.selfDmg * W.selfDamage;
      if (atkSlot.dmg + f.selfDmg >= this.top(atkSlot).hp) s -= W.selfKO;
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

    // don't burn a once-per-stay attack on a whiff-heavy turn for nothing
    if (f.flags.oncePerStay && f.expDmg <= 0 && !Object.keys(f.statuses).length) s -= 10;

    return s;
  }

  // Biggest single hit the opponent's Active could land on ours right now.
  incomingThreat(pi) {
    const E = this.E;
    const me = E.state.players[pi], you = E.state.players[1 - pi];
    if (!you.active || !me.active) return 0;
    let worst = 0;
    const c = this.top(you.active);
    (c.attacks || []).forEach((a, i) => {
      if (!E.costSatisfied(you.active, a.cost)) return;
      const raw = this.rawOutcomes(you.active, me.active, i);
      for (const o of raw.outcomes) {
        const r = E.computeDamage(you.active, me.active, o.dmg);
        if (r.dmg > worst) worst = r.dmg;
      }
    });
    return worst;
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
    // an Energy card may provide several symbols (Double Colorless)
    const pool = [];
    slot.energy.forEach(e => (this.db[e.id].provides || 'C').split('').forEach(x => pool.push(x)));
    if (extraEnergyId) (this.db[extraEnergyId].provides || 'C').split('').forEach(x => pool.push(x));
    let best = -Infinity, bestShort = 99;
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
      if (short < bestShort) bestShort = short;
      if (val > best) best = val;
    });
    return { best: best === -Infinity ? 0 : best, short: bestShort };
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
      // Only worth switching on when it actually unlocks an attack. Free
      // otherwise, but a no-op action the bot could loop on forever.
      case 'ENERGY_AS': {
        // bestAttackScore returns {score, idx}, not a number, and its score is
        // -Infinity when nothing is playable. Flatten both to a comparable
        // figure before touching them.
        const reach = () => {
          const b = this.bestAttackScore(pi);
          return b.score === -Infinity ? 0 : b.score;
        };
        const before = reach();
        const saved = slot.energyAs;
        slot.energyAs = (E.powerOf(slot) || {}).type;
        const after = reach();
        slot.energyAs = saved;
        // Free and harmless, but a no-op action the bot could otherwise loop on,
        // so only worth doing when it actually improves what we can attack with.
        if (after <= before) return -Infinity;
        return W.threshold + (after - before);
      }

      case 'MOVE_DAMAGE': {
        const from = E.allSlots(pi).find(x => x.uid === a.from);
        const to = E.allSlots(pi).find(x => x.uid === a.to);
        if (!from || !to) return -Infinity;

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

      // Rain Dance. Mechanically an Energy attachment that costs nothing, so it
      // reuses the attachEnergy scoring and adds a premium for being free — the
      // bot should always prefer the free attachment over spending its one.
      case 'EXTRA_ATTACH': {
        const to = E.allSlots(pi).find(x => x.uid === a.to);
        const inst = E.state.players[pi].hand[a.hand];
        if (!to || !inst) return -Infinity;
        const before = this.potential(pi, to, null);
        const after = this.potential(pi, to, inst.id);
        let s = Math.max(0, after.best - Math.max(0, before.best)) * W.attachEnable;
        if (after.short < before.short) s += W.attachBuild * (before.short - after.short) * 2;
        else if (after.best > before.best) s += W.attachBuild;
        else s += 0.4;
        s += (to === E.state.players[pi].active) ? 4 : 1;
        return s + W.attachBuild;                        // free, so worth more than the normal one
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
        let s = Math.max(0, after.best - Math.max(0, before.best)) * W.attachEnable;
        if (after.short < before.short) s += W.attachBuild * (before.short - after.short) * 2;
        else if (after.best > before.best) s += W.attachBuild;
        else s += 0.4;
        if (slot === me.active) s += 4;                 // the Active uses it soonest
        else s += 1;
        return s;
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
        return s;
      }

      case 'playBasic': {
        const n = me.bench.length;
        if (n === 0) return W.benchFirst;
        if (n < 3) return W.benchMore;
        return W.benchTooMany;
      }

      case 'retreat': {
        if (!me.active) return -Infinity;
        const b = me.bench[a.bench];
        if (!b) return -Infinity;
        const cost = this.top(me.active).retreat;
        const danger = this.incomingThreat(pi);
        const dying = danger >= this.remainingHP(me.active);
        const mineNow = this.bestAttackScore(pi).score;
        const theirs = this.potential(pi, b, null);
        let s = W.retreatBase - cost * 4;
        if (dying) s += W.dangerSwap;
        if (mineNow < 0 || mineNow === -Infinity) s += 10;
        if (theirs.short === 0) s += 8;
        // never retreat into something that dies instantly
        if (danger >= this.remainingHP(b)) s -= 18;
        return s;
      }

      case 'promote': {
        const b = me.bench[a.bench];
        if (!b) return -Infinity;
        const pot = this.potential(pi, b, null);
        return this.remainingHP(b) * 0.35 + (pot.short === 0 ? 25 : 0) + pot.best * 0.2;
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
        const pot = this.potential(pi, b, null);
        return this.remainingHP(b) * 0.35 + (pot.short === 0 ? 25 : 0) + Math.max(0, pot.best) * 0.2;
      }

      case 'playTrainer': return this.scoreTrainer(pi, a);
      case 'pass': return 0;
      default: return -Infinity;
    }
  }

  // ----------------------------------------------------------- trainer score
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
        case 'T_DRAW': s += v.n * W.drawCard; break;

        case 'T_PROFESSOR_OAK': {
          // good when the hand is dead, terrible when it's full of gas
          const keep = me.hand.filter(x => x.uid !== inst.uid).length;
          s += (7 - keep) * W.drawCard;
          if (keep >= 6) s -= 30;
          break;
        }

        case 'T_HEAL': {
          const cands = E.allSlots(pi).filter(x => x.dmg > 0);
          if (!cands.length) return -Infinity;
          let best = cands[0];
          for (const c of cands) if (c.dmg > best.dmg) best = c;
          a.opts.targetUid = best.uid;
          s += Math.min(v.n * 10, best.dmg) / 10 * W.healPer10;
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
          break;
        }

        case 'T_SWITCH_OWN': {
          if (!me.bench.length || !me.active) return -Infinity;
          let bestI = -1, bestV = -Infinity;
          me.bench.forEach((b, i) => {
            const pot = this.potential(pi, b, null);
            const v2 = this.remainingHP(b) * 0.3 + (pot.short === 0 ? 20 : 0);
            if (v2 > bestV) { bestV = v2; bestI = i; }
          });
          a.opts.bench = bestI;
          const danger = this.incomingThreat(pi);
          s += (danger >= this.remainingHP(me.active)) ? 24 : -4;
          const st = me.active.status;
          if (st.asleep || st.paralyzed || st.confused) s += 20;
          break;
        }

        case 'T_SWITCH_OPPONENT': {
          if (!you.bench.length) return -Infinity;
          if (killingActiveNow) return -Infinity;   // don't rescue a doomed Active
          // drag up whatever we can kill fastest / whatever is least ready
          let bestI = 0, bestV = -Infinity;
          you.bench.forEach((b, i) => {
            const pot = this.potential(1 - pi, b, null);
            const v2 = (100 - this.remainingHP(b)) * 0.4 + (pot.short > 0 ? 18 : 0);
            if (v2 > bestV) { bestV = v2; bestI = i; }
          });
          a.opts.bench = bestI;
          s += W.drag + bestV * 0.3;
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

    const setup = acts.filter(a => a.t !== 'attack' && a.t !== 'pass');
    const best = setup.length ? this.pickBest(pi, setup) : null;
    if (best && best.__score >= this.W.threshold) return best;

    const attacks = acts.filter(a => a.t === 'attack');
    if (attacks.length) {
      const bestAtk = this.pickBest(pi, attacks);
      if (bestAtk && bestAtk.__score > 0) return bestAtk;
    }
    return acts.find(a => a.t === 'pass') || null;
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
    return best;
  }
}

if (typeof module !== 'undefined') module.exports = { AI, AI_WEIGHTS };

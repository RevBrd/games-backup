// Behavioural instrument for the AI.
//
//   node tools/aitest.js            quick pass  (6 seeds per matchup)
//   node tools/aitest.js 30         deeper pass
//   node tools/aitest.js 12 novice  measure a different tier
//
// This is NOT a pass/fail suite. selftest.js already asserts the AI is correct
// and that the difficulty ladder is ordered; this measures whether it plays
// WELL, which no other tool can see. It counts specific decisions Trevor named
// from real play, so a weight change can be shown to help rather than argued
// about:
//
//   - retreats that threw away an attack the Active could have made
//   - retreats with nothing actually threatening the Active
//   - Energy attached to an Active that dies before it can spend it
//   - healing poured into a Pokemon that had barely been scratched
//
// Every counter here is a SUSPICION, not a bug. Retreating out of a good attack
// is occasionally right. Read the rates, not the individual events, and compare
// two runs rather than judging one — that is why it prints per-100-turns rates
// alongside raw totals.
//
// Baselines live in the table at the bottom of the output. If you change ai.js,
// run this before and after and put both numbers in the commit.

const { CARD_DB, DECKS, OPPONENT_DECKS } = require('../src/cards.js');
const { EFFECTS } = require('../src/effects.js');
const { Engine } = require('../src/engine.js');
require('../src/ai.js');

const N = parseInt(process.argv[2], 10) || 6;
const MODE = process.argv.slice(2).find(x => /^(expert|novice|greedy|random)$/.test(x)) || 'expert';

// --gbc SWAPS THE POOL FOR THE 18 LADDER DECKS, and it matters more than it
// looks. The four theme decks were the whole game when this tool was written
// and are now a sixth of the card pool; MEASUREMENT.md's most dangerous entry
// is a harness that cannot see the situation reporting a clean null result.
// The deck-out counters below are the sharpest case yet — the theme decks say
// 6.3% of games end that way and the ladder decks say 17.7%.
const GBC = process.argv.includes('--gbc');
const POOL = GBC ? OPPONENT_DECKS : DECKS;
const DECK_NAMES = Object.keys(POOL);

const blank = () => ({
  turns: 0, games: 0, wins: 0,
  retreats: 0, retreatAbandonedAttack: 0, retreatNoThreat: 0, retreatEnergyBurned: 0,
  retreatScoreLost: 0, retreatImproved: 0,
  attaches: 0, attachDoomed: 0, attachDoomedUseless: 0,
  attachSurplus: 0, attachInert: 0, attachMisdirected: 0,
  promotes: 0, promoteDoomed: 0, promoteUndone: 0,
  heals: 0, healWasted: 0, healWastedHP: 0,
  gusts: 0, gustNoKill: 0, gustFreeSwitch: 0,
  kosSuffered: 0, declinedWin: 0,
  burns: 0, burnUnder10: 0, burnFatal: 0, deckOutLosses: 0,
});

const add = (a, b) => { for (const k in b) a[k] += b[k]; return a; };

// Hardest single hit the opponent's Active could land on one of ours — asked
// about a Pokemon that is not necessarily Active, which is the whole point when
// the question is "what happens if I send this one up?".
function threatAgainst(E, ai, pi, mySlot) {
  const you = E.state.players[1 - pi];
  if (!you.active || !mySlot) return 0;
  let worst = 0;
  (ai.top(you.active).attacks || []).forEach((a, i) => {
    if (!E.costSatisfied(you.active, a.cost)) return;
    for (const o of ai.rawOutcomes(you.active, mySlot, i).outcomes) {
      const d = E.computeDamage(you.active, mySlot, o.dmg).dmg;
      if (d > worst) worst = d;
    }
  });
  return worst;
}

// Classify one chosen action against the state it was chosen in. Called after
// aiChoose (so E._ai exists) and before act (so the state is the one the AI
// actually looked at).
function classify(E, pi, a, st) {
  const ai = E._ai;
  if (!ai || !a) return;
  const me = E.state.players[pi];
  const you = E.state.players[1 - pi];
  const active = me.active;

  // DECLINED A WIN. The rarest and worst class of error: a lethal attack was on
  // the table, taking it would have ended the game, and the bot did something
  // else. A duel cannot see this — the position is uncommon and both sides of an
  // AI-vs-AI game share the fault, so it cancels — but a human watching sees it
  // once and never trusts the opponent again. Trevor caught it in one game.
  //
  // IT ONLY COUNTS WHEN THE TURN IS BEING GIVEN UP. Until 21 Aug 2026 this fired
  // on ANY non-attack action taken in such a turn, which made attaching an
  // Energy and then winning read as declining to win. That is not a small
  // over-count, it is the wrong question: playing a card before attacking is
  // ordinary correct play, and the fault being hunted is ENDING the turn with
  // the lethal still on the table. `pass` is the only action that does that.
  // The old figures — 13 and 20 over 9,610 games — are not comparable with what
  // this prints now, and the counter was labelled "must be 0" the whole time.
  if (a.t === 'pass' && me.active && you.active) {
    const wins = me.prizes.length <= 1 || you.bench.length === 0;
    if (wins) {
      for (const act of E.legalActions(pi)) {
        if (act.t !== 'attack') continue;
        const f = ai.forecast(pi, act.idx, act.opts);
        if (f && f.pLethal >= 0.99) { st.declinedWin++; break; }
      }
    }
  }

  // YOUR DECK IS A RESOURCE, 16 Aug 2026. Every draw used to be flat `drawCard`
  // per card with no reference to what was left — `deck.length` reached the
  // scorer in exactly one place, Wildfire, where it prices the OPPONENT running
  // out. Measured over 648 ladder games, 17.7% of them ended in a deck-out and
  // 45 of those losers had burned cards with under five remaining.
  //
  // `burnFatal` is the one to watch: a play that empties the deck outright is
  // not an expensive draw, it is a loss, and it is counted separately for the
  // same reason recoil-that-ends-the-game is.
  {
    const left = me.deck.length;
    let burn = 0;
    if (a.t === 'playTrainer') {
      const inst = me.hand[a.hand];
      const sc = (inst && E.effects[inst.id] && E.effects[inst.id].t) || [];
      for (const v of sc) {
        if (v.v === 'T_DRAW') burn += v.n || 0;
        else if (v.v === 'T_PROFESSOR_OAK') burn += 7;
        else if (v.v === 'T_GAMBLER') burn += 4.5 - (me.hand.length - 1);
      }
    } else if (a.t === 'attack' && active) {
      for (const v of ai.script(active, a.idx)) {
        if (v.v === 'DRAW') burn += v.n || 1;
        else if (v.v === 'DRAW_ON_FLIP') burn += 0.5;
      }
    }
    if (burn > 0) {
      st.burns++;
      if (left < 10) st.burnUnder10++;
      if (left - burn <= 0) st.burnFatal++;
    }
  }

  if (a.t === 'retreat' && active) {
    st.retreats++;
    st.retreatEnergyBurned += ai.top(active).retreat;
    const threat = ai.incomingThreat(pi);
    if (threat < ai.remainingHP(active)) st.retreatNoThreat++;

    // "Walked away from an attack" is the wrong question: the NEW Active can
    // still attack this turn. The right one is whether the swap cost us damage,
    // so measure the best attack available before and after and compare. That
    // delta is exactly the trade the retreat score never prices.
    const before = ai.bestAttackScore(pi).score;
    return () => {
      const after = ai.bestAttackScore(pi).score;
      const b = before === -Infinity ? 0 : before;
      const c = after === -Infinity ? 0 : after;
      if (b - c > 1) { st.retreatAbandonedAttack++; st.retreatScoreLost += (b - c); }
      else if (c - b > 1) st.retreatImproved++;   // swapped UP — this is good play
    };
  }

  // WHO GETS SENT UP, and whether the bot immediately regrets it. Trevor's log
  // 04-22-45: it promoted a 40 HP Voltorb into an Arcanine that had just dealt
  // 80, then spent a Switch on its next turn undoing the promotion. Both halves
  // are counted, because the second is the one a human actually notices.
  if (a.t === 'promote' || a.t === 'switchIn') {
    const b = me.bench[a.bench];
    if (b) {
      st.promotes++;
      // Worked out here rather than called off the AI on purpose: an instrument
      // that borrows a method from the tree it is measuring cannot be pointed at
      // an older tree, and comparing two trees is the only thing this file does.
      if (threatAgainst(E, ai, pi, b) >= ai.remainingHP(b)) st.promoteDoomed++;
      const uid = b.uid, turn = E.state.turn;
      return () => { E.__promoted = { uid, turn }; };
    }
  }
  // Undoing it: our own Switch or retreat moving that same Pokemon straight back
  // out, within a turn of sending it up.
  if ((a.t === 'retreat' || a.t === 'playTrainer') && active && E.__promoted
      && E.__promoted.uid === active.uid && E.state.turn - E.__promoted.turn <= 2) {
    const undo = a.t === 'retreat'
      || ((EFFECTS[me.hand[a.hand] && me.hand[a.hand].id] || {}).t || [])
           .some(v => v.v === 'T_SWITCH_OWN');
    if (undo) { st.promoteUndone++; E.__promoted = null; }
  }

  if (a.t === 'attachEnergy') {
    st.attaches++;
    const slot = E.allSlots(pi).find(x => x.uid === a.target);
    const inst0 = me.hand[a.hand];

    // Trevor's report: it attaches Energy its Pokemon do not need. Two different
    // faults wear that description, and they want different fixes.
    if (slot) {
      const b4 = ai.potential(pi, slot, null);
      const af = ai.potential(pi, slot, inst0 && inst0.id);
      // (a) SURPLUS — the target could already pay for everything it owns, and
      //     the card buys no new attack either. Pure overflow.
      if (b4.short === 0 && af.best <= b4.best) st.attachSurplus++;
      // (a2) INERT — the target is STILL short after the attachment and gained
      //      no attack from it either. A Grass onto a Pokemon whose only cost is
      //      RRR: the card is spent, the board is no better, and the Energy is
      //      now stuck where it can never be used. Trevor's report from play,
      //      and a different fault from surplus: surplus is "it needed nothing",
      //      this is "it needed something else".
      if (b4.short > 0 && af.short >= b4.short && af.best <= b4.best) st.attachInert++;
      // (b) MISDIRECTED — somewhere else on the board could not afford an attack
      //     at all, and would have been made able to. Only one attachment
      //     happens per turn, so picking the wrong slot is the whole cost.
      // Requires SURPLUS as well, not just a paid-up target: a slot that gains a
      // bigger attack from the card has a real claim on it, and counting those
      // as misdirected inflated this from the true figure to 7%.
      if (b4.short === 0 && af.best <= b4.best) {
        const needier = E.allSlots(pi).some(x => {
          if (x === slot) return false;
          const s0 = ai.potential(pi, x, null);
          if (s0.short === 0) return false;
          return ai.potential(pi, x, inst0 && inst0.id).short < s0.short;
        });
        if (needier) st.attachMisdirected++;
      }
    }

    if (slot && slot === active) {
      const doomed = ai.incomingThreat(pi) >= ai.remainingHP(active);
      if (doomed) {
        st.attachDoomed++;
        // Worse than doomed: even WITH this Energy it cannot attack this turn,
        // so the card is guaranteed to die attached to a corpse.
        const inst = me.hand[a.hand];
        const after = ai.potential(pi, slot, inst && inst.id);
        if (after.short > 0) st.attachDoomedUseless++;
      }
    }
  }

  if (a.t === 'playTrainer') {
    const inst = me.hand[a.hand];
    const script = (EFFECTS[inst.id] && EFFECTS[inst.id].t) || [];

    // Gust of Wind. Trevor's read of what it is FOR: drag up something hurt and
    // finish it. Dragging up a Pokemon we cannot punish just hands the opponent
    // a free switch — they promote whatever they wanted next turn anyway.
    if (script.some(v => v.v === 'T_SWITCH_OPPONENT')) {
      st.gusts++;
      return () => {
        const foe = E.state.players[1 - pi].active;
        if (!foe) return;
        const best = ai.bestAttackScore(pi);
        let lethal = false;
        if (best.idx >= 0) {
          const f = ai.forecast(pi, best.idx);
          if (f && f.pLethal >= 0.5) lethal = true;
        }
        if (!lethal) st.gustNoKill++;
        // The drag that is actually WASTED: we cannot kill what we pulled and it
        // can pay for an attack, so they simply carry on. Dragging up something
        // that cannot swing is tempo denial and belongs in neither bucket —
        // counting it as a fault is what made this metric look stuck at 78%.
        if (!lethal && ai.potential(1 - pi, foe, null).short === 0) st.gustFreeSwitch++;
      };
    }

    for (const v of script) {
      if (v.v !== 'T_HEAL' && v.v !== 'T_DISCARD_ENERGY_THEN_HEAL') continue;
      st.heals++;
      const tgt = E.allSlots(pi).find(x => x.uid === a.opts && a.opts.targetUid);
      const target = tgt || E.allSlots(pi).filter(x => x.dmg > 0)
        .sort((p, q) => q.dmg - p.dmg)[0];
      if (!target) break;
      const capacity = v.n * 10;
      if (target.dmg < capacity) {
        st.healWasted++;
        st.healWastedHP += capacity - target.dmg;
      }
    }
  }
}

function playGame(deckA, deckB, seed, st) {
  const E = new Engine(CARD_DB, EFFECTS, { seed });
  E.newGame(POOL[deckA], POOL[deckB], ['A', 'B']);
  E.setupAuto(0); E.setupConfirm(0);
  E.setupAuto(1); E.setupConfirm(1);
  let acts = 0;
  const prizesAtStart = E.state.players[1].prizes.length;
  while (E.state.winner === null && acts++ < 8000) {
    const s = E.state;
    const p = s.pendingSwitch !== null ? s.pendingSwitch
      : (s.pendingPromote === null || s.pendingPromote === undefined) ? s.active : s.pendingPromote;
    const action = E.aiChoose(p, MODE);
    if (!action) break;
    // Measure seat 0 only. Both seats play identically, so counting one keeps
    // the rates per-player rather than per-board and makes them comparable to
    // a future asymmetric matchup.
    const post = (p === 0) ? classify(E, p, action, st) : null;
    E.act(p, action);
    if (post) post();
  }
  st.games++;
  st.turns += E.state.turn;
  if (E.state.winner === 0) st.wins++;
  if (E.state.winner === 1 && /could not draw/.test(E.state.winReason || '')) st.deckOutLosses++;
  st.kosSuffered += prizesAtStart - E.state.players[1].prizes.length;
  return E.state.winner;
}

console.log(`\nShadowless AI behaviour  —  mode "${MODE}", ${N} seeds per matchup\n`);

const total = blank();
for (const a of DECK_NAMES) {
  for (const b of DECK_NAMES) {
    const st = blank();
    for (let i = 0; i < N; i++) playGame(a, b, 5000 + i * 37, st);
    add(total, st);
  }
}

const per100 = v => (v / total.turns * 100).toFixed(1);
const pct = (v, d) => d ? (v / d * 100).toFixed(0) + '%' : '—';

console.log(`  ${total.games} games, ${total.turns} turns, seat-0 win rate ${pct(total.wins, total.games)}\n`);

console.log('Declining to win');
console.log(`  ${String(total.declinedWin).padStart(5)}  turns ENDED holding a lethal that ends the game`);
console.log('         (must be 0 — a duel cannot see this, both sides share the fault)\n');

console.log('Retreat');
console.log(`  ${String(total.retreats).padStart(5)}  retreats                        ${per100(total.retreats)} per 100 turns`);
console.log(`  ${String(total.retreatAbandonedAttack).padStart(5)}  ...that cost us this turn's hit ${pct(total.retreatAbandonedAttack, total.retreats)} of retreats`);
console.log(`  ${String(Math.round(total.retreatScoreLost)).padStart(5)}  attack score given up           ${total.retreatAbandonedAttack ? (total.retreatScoreLost / total.retreatAbandonedAttack).toFixed(1) : '—'} per such retreat`);
console.log(`  ${String(total.retreatImproved).padStart(5)}  ...that IMPROVED our hit (good)  ${pct(total.retreatImproved, total.retreats)} of retreats`);
console.log(`  ${String(total.retreatNoThreat).padStart(5)}  ...with nothing threatening it  ${pct(total.retreatNoThreat, total.retreats)} of retreats`);
console.log(`  ${String(total.retreatEnergyBurned).padStart(5)}  Energy burned on retreat costs  ${per100(total.retreatEnergyBurned)} per 100 turns`);

console.log('\nPromotion');
console.log(`  ${String(total.promotes).padStart(5)}  Pokemon sent up`);
console.log(`  ${String(total.promoteDoomed).padStart(5)}  ...into a hit that kills it     ${pct(total.promoteDoomed, total.promotes)} of promotions`);
console.log(`  ${String(total.promoteUndone).padStart(5)}  ...undone by our own Switch     ${pct(total.promoteUndone, total.promotes)} of promotions`);

console.log('\nEnergy attachment');
console.log(`  ${String(total.attaches).padStart(5)}  attachments`);
console.log(`  ${String(total.attachDoomed).padStart(5)}  ...onto an Active that dies     ${pct(total.attachDoomed, total.attaches)} of attachments`);
console.log(`  ${String(total.attachDoomedUseless).padStart(5)}  ...and could not attack anyway  ${pct(total.attachDoomedUseless, total.attaches)} of attachments`);
console.log(`  ${String(total.attachSurplus).padStart(5)}  ...onto a fully-paid Pokemon    ${pct(total.attachSurplus, total.attaches)} of attachments`);
console.log(`  ${String(total.attachInert).padStart(5)}  ...that helped nothing at all   ${pct(total.attachInert, total.attaches)} of attachments`);
console.log(`  ${String(total.attachMisdirected).padStart(5)}  ...while something else needed  ${pct(total.attachMisdirected, total.attaches)} of attachments`);

console.log('\nHealing');
console.log(`  ${String(total.heals).padStart(5)}  heals played`);
console.log(`  ${String(total.healWasted).padStart(5)}  ...on a target not hurt enough  ${pct(total.healWasted, total.heals)} of heals`);
console.log(`  ${String(total.healWastedHP).padStart(5)}  HP of healing thrown away       ${total.heals ? (total.healWastedHP / total.heals).toFixed(1) : '—'} per heal`);

console.log('\nGust of Wind');
console.log(`  ${String(total.gusts).padStart(5)}  dragged an opponent up`);
console.log(`  ${String(total.gustNoKill).padStart(5)}  ...and could not then kill it   ${pct(total.gustNoKill, total.gusts)} of drags`);
console.log(`  ${String(total.gustFreeSwitch).padStart(5)}  ...nor even silence it (WASTE)  ${pct(total.gustFreeSwitch, total.gusts)} of drags`);

console.log('\nYour own deck');
console.log(`  ${String(total.burns).padStart(5)}  plays that spend deck`);
console.log(`  ${String(total.burnUnder10).padStart(5)}  ...with under 10 cards left     ${pct(total.burnUnder10, total.burns)} of them`);
console.log(`  ${String(total.burnFatal).padStart(5)}  ...that empty it outright       ${pct(total.burnFatal, total.burns)} of them`);
console.log(`  ${String(total.deckOutLosses).padStart(5)}  games lost to deck-out          ${pct(total.deckOutLosses, total.games)} of games`);

console.log('\nNothing here is a failure. Compare two runs; do not judge one.\n');

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

const { CARD_DB, DECKS } = require('../src/cards.js');
const { EFFECTS } = require('../src/effects.js');
const { Engine } = require('../src/engine.js');
require('../src/ai.js');

const N = parseInt(process.argv[2], 10) || 6;
const MODE = process.argv[3] || 'expert';
const DECK_NAMES = Object.keys(DECKS);

const blank = () => ({
  turns: 0, games: 0, wins: 0,
  retreats: 0, retreatAbandonedAttack: 0, retreatNoThreat: 0, retreatEnergyBurned: 0,
  retreatScoreLost: 0, retreatImproved: 0,
  attaches: 0, attachDoomed: 0, attachDoomedUseless: 0,
  attachSurplus: 0, attachMisdirected: 0,
  heals: 0, healWasted: 0, healWastedHP: 0,
  gusts: 0, gustNoKill: 0, gustFreeSwitch: 0,
  kosSuffered: 0,
});

const add = (a, b) => { for (const k in b) a[k] += b[k]; return a; };

// Classify one chosen action against the state it was chosen in. Called after
// aiChoose (so E._ai exists) and before act (so the state is the one the AI
// actually looked at).
function classify(E, pi, a, st) {
  const ai = E._ai;
  if (!ai || !a) return;
  const me = E.state.players[pi];
  const active = me.active;

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
  E.newGame(DECKS[deckA], DECKS[deckB], ['A', 'B']);
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

console.log('Retreat');
console.log(`  ${String(total.retreats).padStart(5)}  retreats                        ${per100(total.retreats)} per 100 turns`);
console.log(`  ${String(total.retreatAbandonedAttack).padStart(5)}  ...that cost us this turn's hit ${pct(total.retreatAbandonedAttack, total.retreats)} of retreats`);
console.log(`  ${String(Math.round(total.retreatScoreLost)).padStart(5)}  attack score given up           ${total.retreatAbandonedAttack ? (total.retreatScoreLost / total.retreatAbandonedAttack).toFixed(1) : '—'} per such retreat`);
console.log(`  ${String(total.retreatImproved).padStart(5)}  ...that IMPROVED our hit (good)  ${pct(total.retreatImproved, total.retreats)} of retreats`);
console.log(`  ${String(total.retreatNoThreat).padStart(5)}  ...with nothing threatening it  ${pct(total.retreatNoThreat, total.retreats)} of retreats`);
console.log(`  ${String(total.retreatEnergyBurned).padStart(5)}  Energy burned on retreat costs  ${per100(total.retreatEnergyBurned)} per 100 turns`);

console.log('\nEnergy attachment');
console.log(`  ${String(total.attaches).padStart(5)}  attachments`);
console.log(`  ${String(total.attachDoomed).padStart(5)}  ...onto an Active that dies     ${pct(total.attachDoomed, total.attaches)} of attachments`);
console.log(`  ${String(total.attachDoomedUseless).padStart(5)}  ...and could not attack anyway  ${pct(total.attachDoomedUseless, total.attaches)} of attachments`);
console.log(`  ${String(total.attachSurplus).padStart(5)}  ...onto a fully-paid Pokemon    ${pct(total.attachSurplus, total.attaches)} of attachments`);
console.log(`  ${String(total.attachMisdirected).padStart(5)}  ...while something else needed  ${pct(total.attachMisdirected, total.attaches)} of attachments`);

console.log('\nHealing');
console.log(`  ${String(total.heals).padStart(5)}  heals played`);
console.log(`  ${String(total.healWasted).padStart(5)}  ...on a target not hurt enough  ${pct(total.healWasted, total.heals)} of heals`);
console.log(`  ${String(total.healWastedHP).padStart(5)}  HP of healing thrown away       ${total.heals ? (total.healWastedHP / total.heals).toFixed(1) : '—'} per heal`);

console.log('\nGust of Wind');
console.log(`  ${String(total.gusts).padStart(5)}  dragged an opponent up`);
console.log(`  ${String(total.gustNoKill).padStart(5)}  ...and could not then kill it   ${pct(total.gustNoKill, total.gusts)} of drags`);
console.log(`  ${String(total.gustFreeSwitch).padStart(5)}  ...nor even silence it (WASTE)  ${pct(total.gustFreeSwitch, total.gusts)} of drags`);

console.log('\nNothing here is a failure. Compare two runs; do not judge one.\n');

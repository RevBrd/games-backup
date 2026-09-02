// WHO IS THE ENGINE WAITING FOR? One answer, for every harness in this repo.
//
//   const { owedBy } = require('./lib/owed.js');
//   const pi = owedBy(E.state);
//   const action = E.aiChoose(pi, 'expert');
//
// WHY THIS IS A FILE. `CLAUDE.md` carries this as a standing design decision:
// "Every choice a player is owed is PER PLAYER, and there are four of them...
// A new one needs a branch in act(), legalActions() AND ai.js's choose(), each
// asking what THIS player owes. Getting it wrong hangs the game, which has now
// happened four times."
//
// It happened a fifth time, in the harnesses rather than in the game, and it had
// been happening quietly for as long as they existed. On 2 Sep 2026 there were
// FOURTEEN copies of this expression across six tools and THREE different
// versions of it:
//
//   pendingPromote only .................. 7 loops, all inside smoke.js
//   pendingSwitch + pendingPromote ....... 5 tools: selftest, abtest, aiduel,
//                                          decksim, aitest
//   pendingAsk + both of those ........... 1 loop, in smoke.js, correct
//
// and the correct one sits in the same file as the seven worst, under a comment
// that says exactly what the others get wrong: "ANY state that owes an action by
// somebody other than s.active has to be listed here, or the loop asks the wrong
// player, gets nothing, and breaks out of a game that was merely waiting."
//
// MEASURED, over 600 ladder games per form, expert on both seats:
//
//   form                       games finished   aiChoose returned null
//   pendingPromote only            547/600            53   (8.8%)
//   +pendingSwitch                 592/600             8   (1.3%)
//   +pendingAsk                    600/600             0
//   +pendingPrize                  600/600             0
//
// Two things fall out of that table and both were open questions.
//
// FIRST, THE `abtest` STALL FLOOR HAS A CAUSE. MISREADINGS.md carries two
// entries about it — "~1.1-1.8% of games on a clean tree", "the cause was NOT
// found and that is stated rather than implied" — and it is this: an unhandled
// `pendingAsk`. Not the bot, not the action cap, not the harness's git plumbing.
// One missing branch, and the rate matches.
//
// SECOND, `pendingPrize` REALLY IS UNREACHABLE FROM A LOOP, which the 31 Aug
// session guessed from a 140-game reproduction and is now measured at 600. It is
// listed here anyway. The engine owes it, `ai.js` answers it, and a harness that
// silently depends on it never coming up is one card away from the same bug —
// which is precisely how the other three got here.
//
// WHY selftest's "no game stalled" ASSERTION IS GREEN WITH A BROKEN DISPATCH:
// it plays the four theme decks, which are Base Set only and cannot produce a
// pendingAsk. The assertion is true of its pool rather than of the engine. That
// is MISREADINGS.md's central shape — a harness that never deals the situation —
// sitting inside the suite meant to catch it.

// Order matters only in that every branch must precede `s.active`; the four are
// mutually exclusive in practice. Written defensively against both null and
// undefined because the engine has used both over its life and a `0` player
// index is a legitimate answer to every one of them.
const has = v => v !== null && v !== undefined;

function owedBy(s) {
  if (s.pendingAsk) return s.pendingAsk.player;
  if (has(s.pendingSwitch)) return s.pendingSwitch;
  if (has(s.pendingPromote)) return s.pendingPromote;
  if (has(s.pendingPrize)) return s.pendingPrize;
  return s.active;
}

// What is outstanding, as a string — for a harness that wants to REPORT a stall
// rather than only survive one. A null from aiChoose after this returns
// '(nothing owed)' is a real fault; anything else names the branch that is
// missing from whoever asked.
function owedShape(s) {
  const bits = [];
  if (s.pendingAsk) bits.push('ask:p' + s.pendingAsk.player);
  if (has(s.pendingSwitch)) bits.push('switch:p' + s.pendingSwitch);
  if (has(s.pendingPromote)) bits.push('promote:p' + s.pendingPromote);
  if (has(s.pendingPrize)) bits.push('prize:p' + s.pendingPrize);
  return bits.length ? bits.join('+') : '(nothing owed)';
}

module.exports = { owedBy, owedShape };

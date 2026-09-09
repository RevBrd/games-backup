# 30 Aug 2026 — one drag, one rule, and the attack half was rolling dice

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `bestDragTarget`, `dragScore`

---

**`bestDragTarget`, `dragScore`** · Job 14b · Trevor's `Wants` on Ninetales, and his GRABBAG report
of the same thing from play.

**The invariant: dragging one of THEIRS is one decision with one ranking, wherever it is printed.**
Gust of Wind, Lure, Fascinate and Tempt are the same effect. `T_SWITCH_OPPONENT` ranked their whole
Bench and filled `a.opts.bench`; the **attack** path scored a flat `W.drag` and filled nothing, so
`SWITCH_DEFENDER_CHOOSE` fell through to the engine's seeded random pick.

**This is 21 Aug's `selfSwitch` invariant, unhonoured in the mirror case.** *The scorer fills in
`a.opts` so the engine's random fallback is never reached* — written for switching one of ours, and
exactly as true for dragging one of theirs. `scoreAction` already does it for `SWITCH_SELF_CHOOSE`
three lines away.

**Trevor found it in play first**, and the report is the reason to trust the diagnosis rather than
the other way round: *"Ninetales also used Lure to draw out a much more dangerous pokemon on turn
49"* — GRABBAG, log# 04-02-53.

**The demonstration is one board printed twice.** Their Bench holds a fully charged Charizard and an
Energy-less Rattata:

| | `[Charizard, Rattata]` | `[Rattata, Charizard]` |
|---|---|---|
| **Lure**, before | Rattata | **Charizard** |
| **Lure**, after | Rattata | Rattata |
| **Gust of Wind**, before *and* after | Rattata | Rattata |

**Same effect, same board, two answers — and the answer changed with the order of their Bench.**
Lure also scored a flat 14.00 either way, so nothing in the score could have told anyone.

**ASSERT BOTH BENCH ORDERINGS.** The first of the two Ninetales rows was **green before the fix**, on
this seed, by coincidence. A row a coin is winning is indistinguishable from a row a rule is winning,
and only the pair separates them — the same reason `dragsUp()` and `strips()` execute the card and
read the board rather than reading `a.opts` back. **A single row here would have shipped a false
green.**

**`attackVariants` deliberately does not enumerate this choice**, unlike Metronome and both
Conversions, so there is no per-option action for `pickBest` to score and the pick has to be filled
in from `scoreAction`. That is a decision, not an oversight — enumerating it would multiply the
action list and the UI builds its own bench prompt in `doAttack` rather than reading variants. **If
anyone changes that, this fill becomes redundant rather than wrong.**

**Two callers, one ranking, and the Trainer's behaviour is unchanged** — 39.80 on the demonstration
board before and after, held by two control rows written for exactly this refactor. **Do not grow a
second ranking for attacks.** The whole finding is that there were two paths and only one of them was
thinking.

**Blast radius is four cards** — Ninetales, Victreebel, and Dark Persian twice — across three live
sets, and Ninetales is in Trevor's own ladder decks, which is why he saw it.

**Measured.** `abtest 8 HEAD`: **4.1% of 17,296 games diverge**, median first difference at action 83
— late, which is when a Lure gets used — against a null control reading 0.0%. Win rate flat and
symmetric, as it must be.

# 2 Sep 2026 — a heal is worth a rescue only if it actually rescues

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `healRescues`, `T_HEAL`, `T_DISCARD_ENERGY_THEN_HEAL`, `W.healRescue`

---

**`T_HEAL`, `T_DISCARD_ENERGY_THEN_HEAL`** · Job 15e · Trevor's GBC 2 note on Potion timing.

**The invariant, in two halves that turned out to be one fault wearing two coats.**

1. **The rescue bonus fires only when the heal crosses the line.** `healRescues(pi, slot, heal)` is
   true when the slot is the Active, `threat >= remaining`, **and** `remaining + heal > threat`.
2. **The heal's target is chosen by what the heal is WORTH**, not by which slot carries the most
   damage counters.

## What it was doing

Trevor, watching the Japan-only GBC sequel: *"Potions applied to the active pokemon seem to be
purposefully timed for when they would prevent the opponent from killing it on the next turn, rather
than as soon as it would be useful, though not exclusively so."*

**Half of that note was already built** — `healWaste` is the brake on healing before it is useful,
and it closed 34% of premature heals when it shipped. The other half had never been asked.

The rescue term read `best === me.active && incomingThreat(pi) >= remainingHP(best)`, i.e. *is this
Pokémon dying*, and never *does the heal change that*. Swept across one board with the threat held
at 80:

| Chansey's damage | remaining | a Potion takes it to | Potion scores |
|---|---|---|---|
| 40 | 80 | 100 — **survives** | 19.00 |
| 50 | 70 | 90 — **survives** | 19.00 |
| 60 | 60 | 80 — dies to the same attack | 19.00 |
| 70 | 50 | 70 — dies to the same attack | 19.00 |

**Flat across the boundary, and it is the AI.md sniff test in mirror image.** That test looks for *a
quantity that should fall away with distance from an edge, written flat with a cliff at the end*.
This is a cliff at the **start** and flat forever after — and the flat part runs straight through the
point where the card stops working. Worse, the term is **anti-correlated with its own usefulness**:
more damage on the Active is exactly what makes the heal unable to save it.

## The second half, which was hiding the first

The target was picked before anything was scored — most damage counters win — and the rescue bonus
then required the winner to *be* the Active. **So the selection could suppress its own correction.**
Measured: an Active on 70 HP under an incoming 80, which a Potion saves outright, standing beside a
benched Snorlax with more damage and no threat at all. The Potion went to the Snorlax, and the score
fell from 19.00 to 7.00 because the rescue branch never ran.

**Two faults, and the first one hid the second.** This is the Energy Removal shape again — a choice
made on a criterion that has nothing to do with what the score cares about — and it is the fifth
Trainer in a row whose fault was in the plumbing rather than in a weight.

## Why the new selection is safe

**Without the rescue term it is the old selection exactly, and that is provable rather than
measured.** `healValue` is non-decreasing in a slot's damage — rising while the heal is still being
wasted, flat once the damage exceeds what the card can remove — so argmax-value and argmax-damage are
the same slot, and the `dmg` tiebreak reproduces the old "most hurt wins" among the ties. **The only
boards where behaviour moves are ones with a rescue on them.**

## Super Potion, and why the disarm moved into the selection

The same restructure, plus the disarm term computed **per candidate** rather than charged to the card
after the worst slot had already been chosen. Trevor's Super Potion note is the one asking for it:
*"Should not be used to save a pokemon that it would prevent from powering up enough to attack, as
that would just be stalling for no benefit."*

**Charging it afterwards can only ever refuse the play.** Measured against the pre-fix source on an
Active Chansey whose only attack the discard would silence, with a benched Machop holding a spare:
**−15.00, which is under `threshold`** — the card sat in hand unplayable while a slot that wanted
exactly this heal stood on the Bench. It now scores 7.00 and goes to the Machop. He wrote
should-not-be-used-**on**; the fix is to let it be used **somewhere else**.

## The third heal site is deliberately untouched

`HEAL_ON_FLIP` asks `threat >= remaining - heal`, which is a **near-miss** band — "the threat is
within one heal of killing me" — rather than a rescue test. It is a different question, it has no
note behind it and no measurement, and folding it in would have been a policy change smuggled into a
correctness fix.

**`healRescues` returns the FACT and each call site states its own policy**, which is
[SURVIVES-CHARGE-HEDGE](SURVIVES-CHARGE-HEDGE.md)'s rule applied as written. Do not put a weight
inside it. **`HEAL_ON_FLIP`'s `- heal` is recorded as suspicious and not acted on** — the sign reads
backwards for a quantity that increases remaining HP, and somebody should ask what it was for before
changing it.

## What it measured

**`abtest.js 8 HEAD --pairs 400` — 3,200 games a side: 9.4% ± 1.0 diverged, median first difference
at action 74. Win rate 49.6% → 49.6%.**

**Read both halves.** The divergence says the change is real and the ladder decks actually deal it —
the seventh lie in [MISREADINGS.md](../MISREADINGS.md) is a 0% that means "the pool never dealt it",
and this is not that. The flat win rate says nothing at all and **cannot**: this is a symmetric change
and both seats get it, which `abtest` cancels by construction. It shipped on correctness, like
`statusNovelty` before it, and for the same stated reason — **a bot that Potions something it cannot
save is visibly stupid to the person sitting opposite it**, and that is the class of error a duel is
blindest to and a human notices first.

## The row that was green because of this fault

**The first case in `tools/claims/` of a passing row protecting a fault rather than a rule**, and it
is worth more than the fix. `base1-94`'s second claim was named *"...unless it is life-saving, which
is the clause the note turns on"* and stood a Pikachu on 10 remaining HP in front of a Hitmonchan.
Pikachu is weak to Fighting, so Special Punch reads **80**, and the Potion took it from 10 to 30. The
bot played it, the row went green, and the word *life-saving* was doing no work whatsoever.

**PLAYBOOK.md's "pick the opponent on purpose" hazard, arriving from the other side.** That file warns
that a fully charged Hitmonchan silently turns a claim into *"...against something about to kill
you"* and makes rows **fail**. Here the same board made one **pass**, which is much harder to notice —
nobody re-reads a green row. **A row asserting an exception has to stand on a board where the
exception is arithmetically true.** Check the clause, not just the verb the bot chose.

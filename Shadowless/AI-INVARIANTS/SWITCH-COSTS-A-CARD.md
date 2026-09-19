# 19 Sep 2026 — the card is not free, and the third formula was the one that was missed

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `T_SWITCH_OWN`'s card charge

---

**Job 17b** · #43 · from Trevor's match log `06-38-17`, and it is the third clause of his own Switch
note — the one that was never built.

**The invariant: playing a Switch costs what the card is worth, read through `cardKeepValue`. A move
the bot could have made for free by retreating correctly is not worth a card.**

## What the log showed

> **Turn 8 — Wren**
> `AI  retreat [1.4]` — Wren retreats Misty's Horsea A; Misty's Horsea B is now Active.
> `AI  trainer [1.3]` — Wren plays Switch. Misty's Staryu is now Active.
> `AI  pass — no attack available` — Wren ended the turn without attacking.

**Two moves, one destination, a card gone, and no attack at the end of it.**

**The note said the bot "pays a retreat cost" and it did not** — there is no Energy discard on that
turn, because Misty's Horsea retreats free. The waste is the card. *[Why the report is a symptom and
not a diagnosis →](../PLAYTEST.md)*

## Why it happened: three formulas, and the fix in September caught two

**This exact symptom was diagnosed and fixed once before.** `T_SWITCH_OWN` carries the note from
3 Sep 2026: *"Same yardstick as promoting, deliberately. When these were two formulas they picked
different Pokemon, and the visible symptom was the bot promoting one and then spending a Switch to
undo it."*

**There are three places that choose which body comes up, and that fix aligned two of them.**

| Decision | Ranks destinations by |
|---|---|
| `promote` | `promoteValue` |
| `T_SWITCH_OWN` | `bestSelfSwitch` → `promoteValue` |
| **the retreat case** | **its own terms: damage this turn, and death on arrival** |

On Wren's board neither of those separated Horsea B from Staryu — two unpowered Basics, neither
dying — so **the retreat scored them identically at −2.10 and picked by Bench index**, while
`promoteValue` separates them on HP remaining and readiness. The Switch then paid a card to correct a
coin-flip.

**That deeper fault is NOT fixed here.** It is [AI.md](../AI.md) item 23.

## The first fix was wrong, and this card's own control row caught it

A blanket `if (me.retreated) return -Infinity` — *you choose your Active once a turn* — took
`claimtest` from 156/1 to **155/2**.

The row it broke is this card's **CONTROL**, written on 3 Sep: a Rattata Active with a fully charged
Hitmonchan behind it and the retreat already spent, where the card plainly *is* the move. Its comment
says why it exists: *"the case the gate must not swallow."* **It was written three weeks before the
over-reach it caught, against a different fix, and it still landed.**

**What separates the two boards is not the retreat — it is whether the move is worth anything.**
Wren's gained 1.3 and ended in a pass; the control's gains a charged attacker.

## The rule that shipped

Trevor's Switch note has three clauses. Two were built on 30 Aug and 3 Sep. This is the third:

> *"Should not be played just because it exists in the bot's hand."*

`s -= this.cardKeepValue(pi, inst, E.allSlots(pi))`, which is **2.50** for a Trainer today.

**`cardKeepValue` rather than a constant, and that is the load-bearing choice.** This project has one
answer to what a card is worth keeping and a second opinion here is the failure it keeps diagnosing —
the same argument that made `T_SWITCH_OWN` share `promoteValue` in the first place. The arithmetic is
identical today because a Trainer is flat there; what differs is that it moves when that function
does. *[Why `cardKeepValue` is safe to call from here →](SCORE-ATTACK-REENTRY.md)*

| board | before | after |
|---|---|---|
| Wren's turn 8, post-retreat | played at 1.3 | **refused** |
| the control, charged Hitmonchan behind a Rattata | played | **played at 37.50** |

## The measurement

| | result |
|---|---|
| `abtest 8 HEAD --pairs 400` | **15.6% ± 1.3 diverged** |
| `aiduel 8 HEAD --gbc` | **50.0% ± 0.4** over 67,590 games — *no significant difference* |
| `aiduel 8 HEAD --control --gbc` | **50.0% ± 0.4** — *no significant difference* |

**A measured null with exposure, shipped on correctness, and recorded as a null.** 33,795 — 33,795 is
a dead tie and it is not a bug in the instrument; the control read the same. **Do not read it as
inert** — 15.6% of games play differently. A one-card economy rule on decks that run few copies is
not going to move a ladder win rate, and this tree has the pairing that makes that case:
*[a day of real change reading null against its own morning →](../YARDSTICKS.md)*

**What would show it working is not a win rate.** It is a log with no Switch played into a pass, which
is where it came from.

## The generalisation somebody should take, deliberately not taken here

**No Trainer in `scoreTrainer` pays for itself.** Every one of them is free to the scorer, and the
rule above is one card's local fix for a general property. Charging every Trainer its
`cardKeepValue` is a one-line change and **a very large behavioural one** — it would raise the bar
under Bill, Oak, Energy Removal and thirty others at once, all of them tuned against a free card.
**Measure it as its own job, with its own control.** It is not a tidy-up.

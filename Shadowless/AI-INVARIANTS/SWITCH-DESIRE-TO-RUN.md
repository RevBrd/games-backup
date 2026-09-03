# 3 Sep 2026 — a Switch is worth how much you want to move, and the cost is already priced

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `T_SWITCH_OWN`, `bestSelfSwitch`, `W.selfSwitchGain`

**Closes the open half of [SWITCH-NULLIFIES-RETREAT](SWITCH-NULLIFIES-RETREAT.md)**, whose title says
half of it is open. It is not any more.

---

**`T_SWITCH_OWN`** · Job 15e · Trevor's `Wants` on Switch, and his answer of 3 Sep 2026.

**The invariant, and the second half is the load-bearing one.**

1. **A Switch is worth `bestSelfSwitch`'s gain at `selfSwitchGain`** — the same quantity, at the same
   rate, that Teleport is already priced with.
2. **The retreat cost it nullifies is NOT priced, and must not be.** It is already in the arithmetic.

## The question this was open on, and why it was the wrong question

The `open:` row asked whether the nullified cost should be an **addend** or a **scale**, and said in
capitals to ask Trevor. He was asked, and answered something else:

> I'm not sure we need to price cost at all… it would be almost entirely situational without the exact
> retreat cost it was saving getting much consideration beyond the fact that it's being saved. If you
> really think we should price it, I'd say we should price it lower than the spot's desire to run.

**Measured before building anything, and he is right — it is already there.** A Switch does not pay
`retreatSaveEnergy` and a retreat does, so the Switch's advantage over retreating rises with the cost
with no term for it at all. One board, five Actives:

| Active | retreat cost | Switch | retreat | Switch's advantage |
|---|---|---|---|---|
| Machop | 1 | −4.00 | −20.50 | 16.50 |
| Charmander | 1 | −4.00 | −36.00 | 32.00 |
| Chansey | 1 | −4.00 | −43.70 | 39.70 |
| Onix | 3 | −4.00 | −46.05 | 42.05 |
| Kangaskhan | 3 | −4.00 | −59.35 | 55.35 |
| Snorlax | 4 | −4.00 | *cannot retreat* | — |

So *"prefers heavier retreat costs to nullify"*, the clause the row was written about, **was already
true and nobody had checked.** Adding `cost * retreatSaveEnergy` would have been a **second rate for a
commodity the retreat path already owns** — the exact duplication this project has now diagnosed in
`turnsLeft`, `maxSpare`, `spareEnergyFor` and the owed-choice dispatch.

**This is WALLS.md's Chansey caveat again**: the rule fell out of arithmetic that was already there
rather than needing a special case. **Check whether the comparison already encodes the preference
before adding a term to express it.**

## What was actually broken

**Look at the middle column of that table.** The Switch scores a **flat −4.00** on all five boards —
five different Actives with five different Bench upgrades behind them. `T_SWITCH_OWN` ran the
`promoteValue` loop to pick a target and **threw the value away**, keeping only the index. So *how
much you want to move* was not in the score, and the card could only clear `threshold` on the flat
`+24` for an imminent Knock Out or `+20` for a status.

`bestSelfSwitch` is that same loop with the answer kept. Using it is one expression of the idea
replacing two, not a new weight — and `selfSwitchGain` is the rate that already existed for it.

## The controls matter more than the fix here

A term that makes a card playable is a term that can make it played for nothing. Three of the five
claim rows are controls, and one of them is somebody else's rule holding:

| Board | gain | result |
|---|---|---|
| Machop → charged Hitmonchan, cost 1 | +27.5 | **plays** |
| hurt Onix → charged Hitmonchan, cost 3 | +38.0 | **plays** |
| Rattata → charged Hitmonchan, cost 0 | +34.5 | refused — the free-retreat **gate** |
| **Chansey** → charged Hitmonchan | **−9.8** | refused — **a wall does not run** |
| charged Hitmonchan → empty Rattata | −34.5 | refused — swapping down |

**The Chansey row is `WALLS.md` reaching a term added a fortnight later, through `promoteValue`,
with nothing card-shaped anywhere.** It is the row that would go red if somebody "fixed" the gain by
taking its absolute value, and it is the reason this change did not need a wall carve-out of its own.

## What it measured

**`abtest.js 8 HEAD --pairs 400` — 3,200 games a side: 34.5% ± 1.6 diverged, median first difference
at action 37. Win rate 49.6% → 49.4%, which is flat inside the interval.**

**And the rate of Switch plays barely moved, which is the number that answers "did you make it
trigger-happy".** 40 ladder games each side: **2.55 → 2.69 plays per 100 turns**, retreats 15.46 →
14.67. **The composition is what moved** — of the Switches played, status cases 9 → 6, low-HP cases
27 → 27, and Switches played on a **healthy, unafflicted** Active 1 → 3. Small absolute numbers on 40
games, so read that last row as directional rather than as a figure.

**That is the honest shape: the emergency use is untouched and the card gained its second purpose** —
Trevor's *"launch a sudden switch for a quick attack that the opponent wasn't expecting"* — which is
a genuinely rare board rather than a common one. **A 34.5% divergence off ~0.9 Switch decisions per
game is cascade, not frequency**, and the median first difference at action 37 says those decisions
land early enough to change everything after them.

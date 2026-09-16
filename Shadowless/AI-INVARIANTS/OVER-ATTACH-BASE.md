# 15 Sep 2026 — the benched copy ASSIGNED where the forecast ADDS, and one card paid for it

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `slotPrintedDamage`'s `DMG_PER_ENERGY_HEADS` branch, and its agreement with
`rawOutcomes`

---

**Job 17a** · #41 · found while writing a claim row for Trevor's Misty's Poliwhirl note, not while
looking for a bug.

**The invariant: the two places that price a coin-scaling attack must read the card the same way, and
one of them was throwing the printed base away.**

```js
// rawOutcomes — the real forecast, used when the card is ACTIVE.  Correct.
dist.push([ways / Math.pow(2, n), (v.base || 0) + v.per * h]);

// slotPrintedDamage — the printed-damage currency, used when it is BENCHED.  Was:
base = v.per * slot.energy.filter(...).length / 2;      // ASSIGNS. The base is gone.
```

`let base = aiParseDamage(atk.dmg)` reads the leading number off the print, and the branch then
overwrote it. **That was right for every card that existed.** Big Eggsplosion prints `20×`,
Continuous Fireball `50×`, Discharge `30×`, Eggsplosion `10×` — the leading number *is* the per, and
keeping it would have double-counted.

**Misty's Poliwhirl is the only printing in fourteen sets with a real base**, and it is still the only
one. Water Punch is `30+`: 30 damage, plus 10 for each heads, one coin per Water attached.

## What it cost

The benched bot valued Water Punch at `5 × waters` with the 30 missing — **under Rapids' flat 20
until the fifth Water.** The symptom was an attach curve that went backwards:

| Water already on it | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| attach score, before | 32.00 | **−2.00** | **−2.00** | 13.50 | 13.50 |
| attach score, after | 32.00 | **37.00** | 13.50 | 13.50 | 13.50 |
| what that Energy actually buys | reaches Rapids | **Rapids 20 → Water Punch 45** | +5 | +5 | +5 |

**The bot refused the Energy worth +25 damage and took the one worth +5.** `potential().best` read 20,
20, 20, 25, 30 where the truth is 20, 20, 45, 50, 55.

## Why it was invisible

**An ACTIVE Poliwhirl was fine the whole time**, because the Active path goes through `rawOutcomes`,
which has always added the base. So every instrument pointed at the card playing it worked, and only
the Bench was wrong — and the Over-Attach family's notes are *mostly about the Bench*, which is the
same observation that motivated `slotPrintedDamage` existing at all.

**Two copies of one card's arithmetic, agreeing for five cards and disagreeing on the sixth.** That is
the third time this exact pair has drifted: `maxSpare` went into the engine and not the scorer, then
the shared spare-counting arithmetic turned out to be wrong in both copies the same way, and now this.
The comment above `spareEnergyFor` in `ai.js` already tells that story. **An agreement test would not
have caught any of the three** — the first two because both copies were wrong together, and this one
because no card could tell them apart until gym1.

## The rule

**Add, never assign.** The printed number and the scaling term are different facts about the attack
and only the card says whether both are present. If a future verb needs to *replace* the parsed
damage rather than add to it, say so with a field on the descriptor rather than by overwriting a
variable, so that the next card with a base does not have to be discovered by its attach curve going
backwards.

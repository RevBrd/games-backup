# 6 Sep 2026 — one home for what a status on their Active is worth

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `statusWorthAgainst`, and the three callers — `scoreAttack`, `scoreTrainer`'s
`T_STATUS`/`T_STATUS_ON_FLIP`, and `scorePower`'s `STATUS_COIN_EITHER_POWER`

---

**Three paths → one** · Job 15e · Trevor's reopened GBC 2 item, which was half done and did not look
it.

**The invariant: there is ONE definition of what a status on the opponent's Active is worth, and the
three paths differ in exactly one parameter — how likely the defender is to still be standing.** An
attack knows its own forecast (`survives`); a Trainer and a Power have to ask the board
(`1 - pLethalThisTurn`). Everything else — the novelty rider, the about-to-die rider, and the
turn-scale rider — is shared and was supposed to be shared already.

## What it looked like before

```
scoreAttack    W[key] * survives     * turnScale * novelty     three riders
scoreTrainer   W[key] * (1 - pKill)  * turnScale * novelty     three riders
scorePower     0.5 * W[key]                                    NONE
```

**The Sleep! block predicted this in writing and got the count wrong.** Its comment reads *"a rule
proven in `scoreAttack` does not reach `scoreTrainer`, and nothing was going to tell us."* Correct,
and there was a third path it did not know about — added later, by a different job, for a Pokémon
Power.

`STATUS_COIN_EITHER_POWER` scored a flat **11.00** whether their Active was fresh, already asleep,
holding no Energy at all, or about to be Knocked Out. Sleep! prices three of those four at nothing
and had since 2 Sep.

## Why it stayed hidden, which is the better half of the story

Trevor: *"the original job for that one was to tune them together but due to the pokemon power search
issue you found, only Sleep! ended up getting tuned."*

The corpus check written into `GRABBAG.md` — presented as the ten-second way to confirm a GBC 2 note
names a real card — prints `c.attacks`. Long-Distance Hypnosis is a **Power**. The card came back
absent, the note was struck as describing something we do not have, and half the job evaporated with
a confident written record saying it was unnecessary.

**A broken verification tool does not give one wrong answer. It cancels the work downstream of it and
leaves a justification behind**, which is far harder to spot than a gap. *[The corrected command
→](../GRABBAG.md)*

## The refactor was proven before the behaviour change went on top

`abtest.js 8 HEAD --pairs 400`: **0 diverged of 3,200 games a side, 0.0% ± 0.0.** Committed on its
own, so the behaviour change that followed could be attributed to itself rather than to the move.

**`ourSlot` is a parameter rather than a read of `me.active`**, and that is the one place this could
have gone silently wrong: `turnScale` measures the attack *we* would lose, and
`scoreAttackHypothetical` asks about a bench slot that is not the Active. Reading `me.active` inside
the helper would have changed the attack path on exactly the boards nobody looks at, and the 0%
control is what says it did not.

## The self-half cliff had to go with it

**This was flagged to Trevor as optional and turned out not to be.** Once the enemy half scales with
the board, a flat self half puts the two in different units. Measured mid-change: the Power went
**0.00 → 5.92** on a board where our Active was fully charged — over the action threshold, so it
would have fired exactly where Trevor's rule says it must not. The old code was at least
self-consistent in being flat on both sides.

**Both halves are one rule — *a turn taken away is worth the attack it denies* — measured against
their attack and against ours.** Divided by `AVG_ATTACK` for the same reason the enemy half is: every
old value is reproduced at an average board and only the two ends move.

Trevor's clause (*"only use it on turns where its own active pokemon can't attack anyway"*) is now
**arrived at rather than special-cased**: at zero attack value the self-cost is zero. It was
`mineWorth <= 0 ? full refund : nothing`, which priced an Active that could swing for 10 identically
to one that could swing for 100.

| board | before | after |
|---|---|---|
| ours spent, theirs charged | 11.00 | **16.92** fires |
| ours fully charged | 0.00 | **−5.86** refused |
| theirs already asleep | 11.00 | **0.00** |
| theirs with no Energy | 11.00 | **0.00** |
| we can Knock it Out | 11.00 | **−105.77** |

**The self-cost is deliberately uncapped** and that is worth knowing: `mineWorth` is a `scoreAttack`
output including knockout and Prize value, so on a lethal board it reaches −105. It only ever makes
the bot refuse harder, so nothing is at risk — but it is not a pure "one turn of damage" figure and
should not be reused as one.

## What it measured

Restricted to the **2 of 54** ladder decks that field the card — a whole-pool run would have diluted
it to nothing:

**`abtest.js 24 HEAD --card base5-54` — 2,496 games a side: 66.1% ± 1.9 diverged**, median first
difference at **action 15**. Subject-deck wins 23.8% → 22.7%, which is **−1.1 against a ±2.3
interval**.

**And the smaller run said something different, which is why it is recorded here.** At 8 seeds the
same measurement read **−2.2**, and it was reported to Trevor as a possible regression before the
larger run existed. **At three times the sample the gap halved** — the signature of noise regressing
toward zero, not of an effect. *The temptation with a shrinking effect is to quietly stop mentioning
it; the correction belongs in the same place the alarm was raised.*

**The card did not go inert**, which was the real risk of a more selective rule: it fires on **16.4%
of the chances it has, against 25.5% before**, across 108 games. More selective, not switched off.

## What is NOT settled

**Whether the wrecking-ball behaviour was wrong at all.** Trevor's note flagged GBC 2 for firing this
Power almost every turn, and our old code did effectively the same thing. Three of the four riders
are not arguable — a status on something already asleep, already dying, or with no Energy to spend is
worth nothing. **The self-cost is the arguable part**, and this measurement cannot settle it: −1.1
± 2.3 is consistent with a small cost, a small gain, and nothing at all.

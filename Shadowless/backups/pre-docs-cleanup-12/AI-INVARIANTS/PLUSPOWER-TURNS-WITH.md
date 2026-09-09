# 30 Aug 2026 — PlusPower is worth the turn it takes off the kill, not only the last one

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `turnsWith`, `T_PLUSPOWER`

---

**`turnsWith`, `T_PLUSPOWER`** · Job 14b · Trevor's `Wants` on PlusPower, worked as claims.

**The invariant: the value of ten damage is how much sooner the target dies, and it is a staircase
rather than a step.** `T_PLUSPOWER` paid a flat 6 and then +34 for exactly one board — the extra 10
makes *this* attack lethal. That is the top rung, priced as though it were the only rung.

**Trevor names the general quantity and hands over the arithmetic**: *"when an additional 10 damage
would result in 1 fewer turn to kill the opponent, as in a move doing 30 damage attacking a pokemon
with 70 HP."* Three turns becomes two. The bot scored that board **6.00 — identical to a board where
the extra 10 changes nothing at all.**

**This is the cliff table's tenth row and it is in a Trainer**, which is worth noticing on its own:
the sniff test has now paid in `ai.js`, in a test suite, and here in `scoreTrainer`. *A quantity
about proximity, written as an equality check.* Turns removed is a **quantity**, so it is linear,
discounted by how far off the turn it removes is: `40 / turnsWith`.

**The lethal case comes out at exactly 40.00 by arithmetic, not by a branch** — `turnsWith === 1` —
which is the same 6 + 34 it used to score. That is the calibration check: a general term that
subsumes a special case should land on it, and this one does to the point.

| board (Fire Punch, 30 flat) | before | after |
|---|---|---|
| 70 HP left — three turns becomes two | 6.00 | **20.00** |
| 60 HP left — two turns becomes two | 6.00 | **0.20**, held |
| 40 HP left — two turns becomes one | 40.00 | **40.00**, unchanged |
| 60 HP left, attacker about to die | 6.00 | **6.00**, spent anyway |

**Holding is the default and it has an escape clause, which is Trevor's next sentence.** Ten damage
that changes no turn count changes nothing, and spending it now spends the option of playing it on
the turn it *would* have converted — that option is the whole of *"plan to hit for 30 on the first
turn and use the PlusPower for 40 on the second."* But: *"If you might not survive until the second
turn, the PlusPower could probably be used early."* **The card survives your Pokemon; the PLAN does
not**, because the attacker it was built around is the thing about to die. So the held branch pays
0.2 — under `threshold` — unless `incomingThreat >= remainingHP`, where it pays the old flat 6.

**`expDmg + 10` is exact, not an approximation.** PlusPower is a `DAMAGE_BONUS` effect and
`computeDamage` applies those **after** Weakness and Resistance. Checked rather than assumed; if that
order ever changes, this term changes with it.

**Measured.** `abtest 8 HEAD`: **15.9% of 17,296 games diverge**, median first difference at action
48, against a null control reading 0.0%. Win rate 49.1% → 49.1% — symmetric, both seats hold
PlusPowers, and that null says nothing either way. Four rows hold it; three of them are controls and
**only one goes red against the prior commit**, which is the point of writing the already-correct
behaviours down.

**Do not re-collapse this into a lethality test.** The old form is recoverable from the new one and
looks simpler; it is the special case.

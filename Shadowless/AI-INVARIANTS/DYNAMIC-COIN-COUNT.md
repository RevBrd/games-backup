# The dynamic coin count — count the pool the card counts, not the pool it sits on

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `rawOutcomes` — `DMG_PER_ENERGY_HEADS` and `DMG_PER_NAMED_IN_PLAY` — and
`slotPrintedDamage`

---

*10 Sep 2026, Shadowless 40, Job 16. Found while widening the dynamic-coin family for Gym Heroes;
the fault it uncovered was in **Team Rocket**, shipped and live, and had been there since that set
went in.*

**`DMG_PER_ENERGY_HEADS` throws one coin per Energy OF A NAMED TYPE. Both places in `ai.js` that
counted those coins used the untyped total.**

Dark Charizard's Continuous Fireball flips per **Fire** Energy at 50 a head. Its cost is `RRCC`, so
the ordinary board is Fire *plus* something paying the Colorless half. On 2 Fire and 2 Double
Colorless the card throws **two** coins and the scorer enumerated **four** — forecasting **100
damage where the true expectation is 50**.

Measured before it was believed, and asserted in `powertest` with the fix reverted to watch it go
red. That matters here more than usual: the arithmetic was never wrong. A binomial over four coins is
a perfectly correct distribution — of a card that does not exist.

## What generalises

**A coin-scaling attack is a correct multiplication over a pool, and the pool is the only thing that
can be wrong.** The damage formula is short, obviously right, and reviews clean; the *counter* is a
filter written somewhere else, and a filter that is missing looks exactly like a filter that passes
everything.

So the rule for this whole family — 21 distinct texts across 12 sets — is: **whenever the engine
narrows what it counts, find the scorer's copy of that count and narrow it too.** They are separate
code by necessity (`ai.js` is concatenated before `engine.js`, so it keeps local copies of
`energyIsType` and the damage parser), and separate code drifts.

## The second one, caught before it shipped

The same read of the same family found `DMG_PER_NAMED_IN_PLAY` scoring only `v.name` and only the
attacker's own slots — where the engine has supported a `names` **list** and three `where` scopes
since Magnemite's Magnetism. **Nothing shipped used `names`, so this was latent rather than live**,
and Sabrina's Haunter's Night Spirits is the first card that would have found it: it counts a
three-name family, so the scorer would have counted zero and forecast the attack at its base damage
forever.

**Latent is not harmless, it is just quiet.** The engine grew a capability and the scorer did not,
and the gap sat there until a card reached for it. Nothing in the suite could see a parameter nobody
had used yet — which is the same shape as an unscored verb, one level further in.

## The check that exists, and the one that does not

`selftest.js` catches a **verb** the scorer cannot price. It cannot catch a **parameter** the scorer
ignores, and both faults here are that. There is no cheap guard for it: the scorer is not obliged to
read every field, and most fields it correctly ignores.

What is written down instead is the habit — **when adding a flag to a damage-shaping verb, open
`rawOutcomes` in the same edit.** Both flags added this pass (`base` on the Energy count, `flip` on
the named count) were carried into the scorer in the same commit, which is the only reason they are
not two more entries in this file.

## The measurement — 10 Sep 2026

`abtest 8 HEAD~1`, which is the right instrument because **the change is symmetric**: it lands on
both seats, so `aiduel` would cancel it exactly.

```
games per side            22896
DIVERGED                  536  (2.3% ± 0.2)
median first difference   action 52
subject-deck wins, before 50.1%
subject-deck wins, after  50.1%
```

**Read the divergence, not the win rate.** A flat 50.1% either side is what a symmetric change is
*supposed* to produce — both seats got the better forecast, and across 2,862 deck pairs both hold
Dark Charizard equally often. Reporting "no effect" off that column would be the exact misreading
`MEASUREMENT.md` exists to prevent.

**536 games played out differently, and the shape of that number checks out.** 13 of the 76 decks in
`data/` run Dark Charizard, so the change can only fire in a minority of pairs — and only once that
card is evolved to Stage 2 *and* carrying a mixed Energy load. The median first difference at
**action 52** is that requirement showing up in the data: this is a late-game card, and the fix
cannot bite until it is on the board and loaded.

**A narrow, deep, symmetric change is exactly what this fix should look like.** Had the divergence
come in at 20%, or at action 6, the fix would have been touching something other than what it
claimed to.

## A third one, same pass, same shape — 10 Sep 2026

**`statusWorthAgainst` measures what a status DENIES, so asked about one already on the board it
answers zero.** The threat it would deny is suppressed by the very status being valued.

That is correct for the question it was written for — *should I apply this?* — and wrong for the one
Sabrina's Jynx asks: *what does removing this cost me?* Priced the first way, waking a sleeping
attacker looked **free**, and the bot took Good Morning's 20 over Good Night's 10 while the thing it
was waking had four Energy on it.

**The fix asks the counterfactual**: the status comes off for the measurement and goes straight back.
Cheap, exact, and it keeps `statusWorthAgainst` as the one home rather than growing a second opinion
about what a Sleep is worth — which is the fault
[STATUS-ONE-HOME](STATUS-ONE-HOME.md) already records.

**What generalises past this card:** a "what is this worth?" function written for *adding* a thing
will read zero when asked about *removing* it, whenever the value is computed from a board the thing
is already changing. It is not a wrong number so much as a wrong question, and it will look perfectly
reasonable in the debugger.

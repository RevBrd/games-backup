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

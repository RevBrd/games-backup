# 18 Sep 2026 — a benched Pokémon can say "I could take a Prize"

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `forecast`'s `fromSlot` parameter, `slotKOChance`, `promoteValue`, `W.promoteKO`

---

**Job 17b** · #43 · AI.md item 1, open since 13 Aug 2026 and the oldest item on that list.

**The invariant: `forecast` takes the attacker as a parameter, and `slotKOChance` is the one answer
to "could this slot take a Prize if it were up there." It returns a PROBABILITY — the chance of
taking the Prize AND keeping the body — and the caller prices it, because `promoteValue` is
reachable from `scoreAttack` and may not ask what an attack is worth.**

## The self-cost clause, which is Trevor's and arrived within the hour

The first version returned the best `pLethal` and nothing else. **A Chansey on 60 HP reported a 1.00
chance of a Prize through Double-edge, which deals 80 to itself.**

> *"A tank isn't really built to attack even if it has an attack move. Sending Chansey in for a quick
> kill also gets 80 recoil damage, so Chansey's dead on the following turn and both players are 1
> prize better off with nothing else really gained."* — Trevor, 18 Sep 2026

**One Prize for one Prize is not a Prize.** So the function returns `pLethal × (1 − pSelfKO)` — still
probability arithmetic, still scoreless, still safe inside `scoreAttack`. At full HP Chansey keeps
its 1.00 and deserves it: 80 recoil on 120 HP leaves it standing.

**The sweep written to check this had already returned zero, and the sweep was the fault.** 0 of 188
printings, because every one was benched at full HP where recoil is survivable almost by definition.
*[The shape, and the check that costs nothing →](../MISREADINGS.md)*

**His exception is NOT built and is the interesting half:** *"the exception might be if it kamikazes a
very strong pokemon to ruin the other player's large active threat."* A trade is only a trade while
the two bodies are worth the same, and pricing theirs needs a currency this function deliberately does
not have. `AI.md` item 1 carries it.

## What the item had budgeted for, and why it cost a parameter instead

The item read: *"Closing it means making expected value computable for a slot that is not Active,
which is a real refactor of `scoreAttack`'s relationship with engine state."*

It is one line. `forecast` opened with `const atkSlot = me.active, defSlot = you.active` and then
handed both to `rawOutcomes` and `computeDamage`, **which have taken slots as parameters for months**
— the Over-Attach and drag-target work parameterised them for their own reasons. So the refactor had
already happened piecemeal, in service of other jobs, and nothing had gone back to look.

**The transferable part is that the estimate was written before three other jobs moved the
substrate, and nothing re-derives an estimate.** A cost written into an open item is a measurement
with an expiry date exactly like any other. Re-read the code before you inherit a scope.

## Why it is safe to call from inside `scoreAttack`, which is the part that matters

`promoteValue` carries a comment saying **"printed damage both sides, never the scorer"**, because it
is reachable from `scoreAttack` through `bestSelfSwitch`, and item 19's rule forbids anything on that
path from asking what a card is worth.

`forecast` does not ask. It reads the effect script and runs the engine's own damage arithmetic; no
path from it reaches a scoring function. **So it is precisely the "one level lower" shape item 19
names as safe**, and until now that rung did not exist:

| | unit | safe inside `scoreAttack` |
|---|---|---|
| `bestAffordableDamage` | printed damage | yes |
| **`forecast` / `slotKOChance`** | **outcomes, and a probability over them** | **yes** |
| `scoreAttack`, `potential` | score | no |

**Most of why the Bench was stuck on printed damage is that there were only two rungs.** Anything
forbidden the scorer had nowhere else to go.

## What printed damage could not say

`bestAffordableDamage(pi, b) >= remainingHP(def)` is the test that was available, and it is a `>=`
against a number that is an average of outcomes it never enumerated. **56 of 243 live printings —
23% — have an affordable attack whose damage is a distribution the printed number cannot describe**,
and the error is always in the same direction:

| card | attack | printed | outcomes |
|---|---|---|---|
| Kangaskhan | Comet Punch | 20 | 0..80 |
| Vileplume | Petal Dance | 40 | 0..120 |
| Beedrill | Twineedle | 30 | 0..60 |
| Jynx | Doubleslap | 10 | 0..20 |

A Kangaskhan that prints 20 kills a 60 HP Pokémon one time in sixteen, and the printed test says it
cannot kill at all.

## The size of the gap, on Trevor's own board

Omastar on four Water, and the same Omastar benched, against the same defender:

| their Active | Active, expected value | Bench, printed damage |
|---|---|---|
| Hitmonchan, 70 HP | 40 | 40 |
| Hitmonchan, 40 HP | 280 | 40 |
| Hitmonchan, 30 HP | 270 | 40 |

**The currencies agree exactly while nothing is in reach and come apart by 7x the moment a Prize
is.** That is the fault stated better than the p90/p99 tail table in `AI.md`, which measured the
spread without saying what causes it.

## The weight, and why linear

`promoteKO: 27`, priced at half of `knockout: 55` rather than invented. **The dominant caller is the
promote after a Knock Out**, where the body cannot swing until our next turn and they get one in
between to retreat, heal, or kill it.

**Linear in the chance, and the cliff table does not apply here.** `slotKOChance` is already a
probability of an event, not a quantity that should fall away with distance from an edge — so the
rule is *ask what the quantity is first*, and this one is an expectation. Do not reach for a curve.

**It projects their current Active forward**, which is the same hedge `incomingThreat` makes: after a
Knock Out they may promote something else before this body ever swings. The snapshot is the honest
option — the alternative is scoring every promotion against a Pokémon nobody has chosen yet.

## The named blind spot

**`slotKOChance` asks `costSatisfied`, which is about Energy and not about legality.** Ten attacks in
the whole corpus sit behind a gate the engine enforces separately — `REQUIRE_DEF_STATUS`,
`REQUIRE_SELF_ENERGY`, `REQUIRE_OPP_BENCH`, `REQUIRE_EQUAL_ENERGY` — and a benched Haunter is credited
a Dream Eater knockout whether or not anything is Asleep.

**It is not fixed, and the reason is the rule it would break.** `canUseAttack` answers for the Active
slot and the engine offers no equivalent for a bench one, so closing this means re-implementing
legality inside `ai.js` — and the `bestAffordableDamage` invariant exists precisely to stop the AI
predicting numbers the engine would not produce, which a second copy of the gates would eventually
start doing. **`bestAffordableDamage` has the identical gap**, so the two agree; this is a known
limit of the whole printed/forecast family rather than something new. Ten of about 1,250 printings.

**The right fix is an engine-side "could this slot use this attack", not a list here.** If you build
one, both functions should take it.

## The sites this did NOT reach, which are the item's open half

`promoteValue` is one of four places the Bench is priced in printed damage. The others are listed in
`AI.md` item 1. **The retreat case is the loudest** — its own comment says both sides are printed
damage *"because that is the only currency they share"*, and that sentence stopped being true when
`forecast` gained a parameter.

**One site was chased and cleared rather than fixed:** `teamReadiness` adds the two currencies across
every slot with a ×4 on the Active, and swings 5.6× on the opponent's HP — but it is only ever read as
a difference across an Energy move, so the baseline cancels.
*[The probe, and the rule it produced →](../MISREADINGS.md)*

## And it does not close the Omastar claim row

The row is filed under this item as *"the cheapest statement of it anybody has written down"* and it
is a different fault. Omastar in the **Active** spot, where this fix applies by definition, plateaus
identically — 30, 30, 40 across two, three and four Water — because expected value does not rank a
guaranteed 30 above a two-coin 30. That is now `AI.md` item 21.
*[The measurement, and the re-run sweep →](../tools/claims/base3.js)*

## The measurement

**It reads BETTER, which most changes here do not.** Ladder decks, 8 seeds a matchup, and the control
run on the same pool in the same session:

| | result |
|---|---|
| `abtest 8 HEAD --pairs 400` — does it reach any game | **27.8% ± 1.6 diverged**, median first difference at action 70 |
| `aiduel 8 HEAD --gbc` — is the bot better | **50.8% ± 0.4** over 67,578 games. *BETTER — significant* |
| `aiduel 8 HEAD --control --gbc` | **50.0% ± 0.4**. *no significant difference*, as a control must |

**Read the control against the subject rather than the subject alone.** Same pool, same seed count,
same interval — the control lands on exactly 50.0 and the subject 0.8 above it. That is what makes
+0.8 a result rather than a rounding artifact, and it is the whole reason to spend the second run.

**+0.8 is small and is not a disappointment.** A term that only fires when a promotion decision is
live, on a board where one bench body can take a Prize and another cannot, is not going to move a
ladder win rate far. **28% of games changing tells you it is reached; the duel tells you the changes
were right.** Neither number answers the other's question.

**Against the pin: 55.5% ± 0.4**, up from 53.2% on 5 Sep — accumulated work, attributable to nobody
in particular. **The pair of readings taken that day is the useful part:** the version *before* the
self-cost clause read 55.6% ± 0.4 and the version that shipped read 55.5%. **The correctness fix is
invisible to the yardstick**, which is the expected shape for a clause that fires only where a
promotion is live and the promoted body's best lethal attack would kill it.
*[Both readings, and what the pin can and cannot resolve →](../YARDSTICKS.md)*

## The stress sweep, and why it is not a guard

243 of 243 live printings asked `slotKOChance` from a bench slot without throwing, and **188 of them
report a real chance of a Knock Out** — so the sentence the Bench could not say is available on 77% of
the pool rather than in a corner. **It is deliberately not in `selftest.js`:** the five guards there
exist because nothing else could see those failures, and a script that assumed an Active attacker
would throw loudly in any game the suites already play. A sweep that can only ever repeat what the
gate covers is cost without cover.

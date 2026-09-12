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

### ...and a correction to how that third one was reported — 10 Sep 2026

**"The bot woke a sleeping attacker" was reported as a fault without its condition, and Trevor pushed
back on it correctly.** His argument: Sleep is a coin between turns, so preserving one buys a *chance*
at a denied turn rather than a denied turn; and the Sleep is **renewable** — if it wakes on its own,
you can apply it again next turn. So 10 extra damage now can genuinely beat what the Sleep was
holding.

**He is right, and the model agrees with him — on most boards.** `W.sleep` is 22 and its own comment
already says *"~50% they stay down"*, so the coin is inside the weight; `turnScale` then scales it by
what that turn would have cost us against an `AVG_ATTACK` of 26. The crossover therefore sits near
**one average attack**, and measured on Jynx it lands between a threat of 20 and 50:

| the sleeper threatens | Good Night | Good Morning | the bot |
|---|---|---|---|
| nothing (no Energy) | 10.0 | 20.0 | **wakes them** |
| 20 (Low Kick) | 20.0 | 23.1 | **wakes them** |
| 50 (Gyarados) | 10.0 | −22.3 | leaves it asleep |
| 60 into a 60 HP Jynx | 10.0 | −30.8 | leaves it asleep |

**So the fault was never "waking them is wrong". It was that waking them was UNCONDITIONAL** — priced
at zero cost, the bot woke a Venusaur sitting on four Grass with a lethal attack. Everything above
the crossover changed; everything below it, which is most boards, plays exactly as it did and exactly
as Trevor described.

**One correction to his numbers, which does not change his conclusion.** `betweenTurns` flips both
Actives after *every* turn, so a Sleep standing on our turn faces **one** flip before their turn:
**50%**, not 25%. 25% is the chance of missing a *second* turn, which is what he was describing. The
decision in front of the bot is the one-turn version.

Written up as three rows in `tools/claims/gym1.js` — the first claims file for this set, and the
first in the project sourced from a conversation rather than from the workbook.

### ...and a correction to the correction — 11 Sep 2026

**The entry above over-credited the pushback, and the record should say so plainly.** Trevor came back
the next day having re-derived the ordering himself and reached the same 50%; the exchange is worth
keeping because of what it shows about *how* the wrong conclusion was nearly reached, not because
anything in the code moved. **Nothing did. The fix was right when it was written and is unchanged.**

Three things, derived rather than recalled — the second is the one neither of us had examined:

1. **One flip, not two.** `betweenTurns` runs after every turn and flips both Actives, so a Sleep
   standing on our turn faces exactly one coin before theirs. Verified by passing a turn and counting
   the flips in the log, which is the check that should have come first both times.
2. **The renewal argument cancels.** "If it wakes on its own I can re-apply next turn" is true, and
   it is equally true if we wake it ourselves — Good Night is available in both branches. It would
   only discount the cost of waking if sleeping were a scarce resource, and it is not. A true
   statement about the card that does not bear on the comparison.
3. **A small point the other way, unmodelled and staying that way.** Leaving them asleep partly
   *clogs* our own next turn: Good Night against a sleeper is a no-op, so branch A can arrive at turn
   N+2 with one fewer real option. That is a depth-2 consideration and this scorer is depth-1, so it
   is named here rather than priced.

**What this is really an entry about.** The claim under dispute rested on explicit event ordering —
whose turn, which flip, in what order — and that is a documented weak spot for this project's
assistants; it is the whole reason `Rulings/` exists in the shape it does. The first response checked
the engine and got the number right. The second conceded the *framing* anyway, on an argument (2)
that dissolves the moment it is written out. **Deriving the sequence is the cheap part and it was
done; writing out the consequence is the part that got skipped.**

The three rows in `tools/claims/gym1.js` are unaffected — they pin where the crossover sits, which is
worth pinning no matter who argued what.

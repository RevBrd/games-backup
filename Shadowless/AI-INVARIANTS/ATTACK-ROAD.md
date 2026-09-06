# 5 Sep 2026 — a card has a road to its own bigger attack, not only to its evolution

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `potentialOf`'s `destGoal`, `attachValue`'s road selection, the fifth exception in
`attachBuild`'s surplus rule, `W.wallPlanFloor`

---

**`short` → `destShort` in the surplus rule** · Job 15e · a GRABBAG note about a Zapdos, whose
subject turned out to be a Moltres.

**The invariant: `potential().short` counts to the cheapest attack a card can ALREADY pay for, so it
pins at zero the moment any attack is affordable — and anything using it to ask "is this card
finished" gets the answer *yes* forever.** `destShort` is the honest distance, to an attack worth
arriving for, and the surplus rule reads it now. **`destGoal` is what is waiting at the end of that
road**, and it exists because the two roads can end at different attacks.

| | `short` / `goal` | `destShort` / `destGoal` |
|---|---|---|
| Fossil Moltres, one Fire | **0** / **0** — Wildfire costs `R` and deals nothing | **3** / **80** — Dive Bomb at `RRRR` |

## The report named the wrong slot

> **GRABBAG** — *"Zapdos gets a fire energy even though it doesn't want those — log# 04-16-41"*

True, and not the fault. Reproduced exactly from the log:

```
  4.40 attach Fire to Zapdos      <- chosen, twice
  0.00 pass
 -2.00 attach Fire to Moltres
 -2.00 attach Fire to Jolteon
 -2.00 attach Fire to Dratini
```

Fossil Zapdos' only attack is Thunderstorm at `LLLL`, so a Fire pays nothing toward it — but it was
Active on **no Energy at all** with a retreat cost of 2, and a Fire pays a Colorless retreat. The
**escape-route exception** waved it through and the bot retreated Zapdos two turns later. That
decision is defensible on its own terms.

**Moltres scored `attachValue` 5.40 — higher than Zapdos' 4.40 — and the surplus rule vetoed it to
-2.00.** The bot never preferred Zapdos; it was the only positive action left on the board.

**Carry this forward: a defensible decision can be the symptom of an indefensible one beside it.**
When a choice looks wrong, price what it was chosen *over* before you price the choice. The
passed-over column is printed on every AI line in a match log and is where this lives.

## This is the "asked in three places" lesson recurring, four days later

**`destShort` was built on 1 Sep 2026** — [EVOLUTION-DESTINATION](EVOLUTION-DESTINATION.md) — for
exactly this fault in a different consumer, and its own comment in `ai.js` ends with the rule:

> *"When a rule is asked in three places, find all three before you measure."*

**Three places were found and switched. The surplus rule was a fourth and nobody looked at it**, so a
correct fact sat one line away from a consumer still reading the broken one, for four days, with the
lesson written above it. That is not a criticism of the 1 Sep work — the fourth site is in a different
function, gated behind four exceptions, and reads `short` for what looks like a completely different
purpose ("does this card need anything at all").

**The transferable part: when a fact gets a corrected twin, the old name is the search term, and the
search is not done when the story you are working on stops.** `grep short` in `attachBuild` was
always going to find this; nothing prompted anyone to run it, because the evolution job had no reason
to care about a Moltres.

## It is not one card

**35 terminal cards in the four live sets** had a road closed this way, measured before building by
benching each one with exactly its cheap attack's cost and offering one more Energy: Magneton,
Kabutops, Rhydon, Dugtrio, Raichu, Butterfree, Kingler, Golduck, Arbok, Pinsir, Nidoqueen, both
Moltres, both Jolteon, Dark Electrode, Dark Jolteon.

## Why the wall gate, and why it is not a tuned number

`attackThreatens` needed no wall gate where it was already used, and **its own comment says why**: a
wall is a terminal Basic and is never an evolution target, so the wall case could not reach that
predicate. **Here it can.** Read literally, this rule charges Chansey to Double-edge — which is
[WALLS.md](../Playbook/WALLS.md)'s own note (*"power up Scrunch and then tank"*) being overridden by a
general fix, and it is the unbuilt **Kamikaze Timing** pattern being picked up by accident. Magneton
B3's workbook note names that pattern explicitly for the same card shape.

`W.wallPlanFloor` is 0.5, and the split is read off the pool rather than chosen:

| | `wallHere` | |
|---|---|---|
| Kangaskhan | 0.90 | held — *"to go first/stall while using Fetch. Only rarely wants to use Comet Punch"* |
| Chansey | 0.80 | held — *"power up Scrunch and then tank"* |
| — floor — | 0.50 | |
| Moltres, Hitmonchan, Jynx, Pinsir | 0.40 | fed |

**Both held cards are the two Trevor's workbook names as walls, and nothing sits between 0.40 and
0.80.** That is corroboration, not a threshold somebody tuned until the tests went green.

## Where the rule deliberately stops

**It only reaches cards whose cheap attack does ZERO damage.** `destShort` pins the same way `short`
does the moment any *threatening* attack is payable — so Hitmonchan (Jab `F`/20 → Special Punch
`FFC`/40) and Raichu (Agility/20 → Thunder/60) are untouched.

**That boundary is a real distinction and not an accident of the implementation.** A Moltres holding
one Fire is doing literally nothing; a Hitmonchan holding one Fighting is doing real work. Whether a
card that already threatens should be charged toward a bigger attack is
[Over-Attach](../Playbook/OVER-ATTACH.md)'s open territory and a design question, **not something to
settle by widening this fix.** Raised with Trevor rather than decided here.

## The guards, and the first one was worthless

Two assertions in `powertest.js`, plus four claim rows in `tools/claims/base3.js`.

**The agreement half alone does not work, and it was watched not working.** *"`destGoal` equals `goal`
wherever the two roads coincide"* is satisfied trivially by `destGoal = goal` — the exact merge the
guard exists to prevent leaves it **green**. So the count of states where they legitimately *disagree*
is asserted too (135 of 1,275 across the pool), which is the half a merge cannot survive, along with
a by-number pin of the Moltres case. Both were then watched going red against a merged build.

**Generalise that.** An equivalence assertion pins one direction only. If the thing you are guarding
against is *collapse*, you have to assert that the two things still differ somewhere — otherwise the
strongest-looking assertion in the file is the one a regression walks straight through.

**Three of the four claim rows go red against the pre-change bot** (`claimtest.js --baseline HEAD`);
the fourth is the Chansey guard, which asserts behaviour that was correct before and must stay
correct. Its precondition originally read `W.wallPlanFloor` — a weight this change introduced — so
`--baseline` reported it **UNUSABLE**, the harness being honest and the row being useless. It spells
the number instead. **A precondition that names something the change introduced cannot run against
the bot before it.**

## What it measured

**`abtest.js 8 HEAD --pairs 400` — 3,200 games a side: 37.8% ± 1.7 diverged, median first difference
at action 43. Subject-deck win rate 48.6% → 48.3%, flat.**

**37.8% is large — larger than any AI change in this folder — and the reason is that it is not 35
cards, it is 35 cards plus a changed unit.** Every card in the game whose cheap and threatening
attacks differ now amortises against `destGoal` where it amortised against `goal`, which moves prices
far more widely than it moves choices.

## And it is BETTER, which is the uncommon outcome here

**`aiduel.js 4 HEAD~2 --gbc` — 23,320 games: 51.6% ± 0.6 (95%), significant.** The interval is
[51.0, 52.2] and excludes 50. The baseline is this job's own backup commit, whose `ai.js` predates
the change and whose only other content is `backups/`, so the result is cleanly attributable to this
change and nothing else.

**Say plainly why that is worth flagging rather than celebrating.** Most entries in this folder
shipped on a measured *null* and said so — [WALL-ROAD-LIVE](WALL-ROAD-LIVE.md) is the immediately
preceding one. The standing doctrine is that correctness ships regardless, and a result that comes
back significant is the less common case, so it is the one to check hardest.

**What was checked.** `aiduel` swaps `ai.js` only and alternates seats; this change is entirely in
`ai.js`; the `--gbc` pool is the 54 ladder decks, which contain the affected cards — Courtney's
Legendary Moltres deck is in it by name. **The per-deck column is not evidence about this change** and
should not be read as such: both sides play the same pool, so a deck's rate there is that deck's
strength, which is why Ronald's Powerful reads 71% and Rick's Wonders of Science reads 25%.

**Both numbers are needed and they answer different questions.** `abtest`'s 37.8% is *did this change
anything*, with the change on both seats as it ships. `aiduel`'s 51.6% is *is the new bot stronger*,
with the asymmetry manufactured on purpose. Quoting either alone would be a partial answer.
*[Which tool for which question →](../MEASUREMENT.md)*

**The pin agrees, and that is the check worth more than either number.** `aiduel.js 2 --baseline
--gbc` against `582761b` reads **53.2% ±0.9**, against 51.5% ±0.9 on 3 Sep — **+1.7**, where the HEAD
form attributed **+1.6** to this change alone. Two independent runs against different baselines
landing a tenth of a point apart is much harder to fake than either result is to get on its own.
*[The pin table →](../YARDSTICKS.md)*

**One honest limit: this does not tell you WHICH half won the 1.6 points.** The change is a fifth
surplus exception plus a changed amortisation unit, shipped together, and nothing separates them.
If anyone retunes `wallPlanFloor` or narrows the exception, this number stops applying and a fresh
duel is owed.

*(This section was committed as a stated gap first — the run had not returned — and filled in
afterwards. **The headline was lost once to a `tail -20` in the calling command**, which kept the
per-deck breakdown and cut the only line that mattered; the re-run cost forty minutes. Pipe an
instrument's output through nothing until you know where its headline sits.)*

## What is a guess

**`wallPlanFloor` is not** — it is read off a gap in the pool with nothing inside it, which is a
stronger footing than `wallRoadInDeck` had. **`destGoal` is not** — it is a printed damage number.

**What is unmeasured is the boundary**, in the sense that nobody has checked whether the 35 cards
freed here are *better off* fed. The claim rows assert that they *can* be, which is a different thing,
and the win rate below does not separate them.

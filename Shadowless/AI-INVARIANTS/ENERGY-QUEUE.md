# 17 Sep 2026 — one hand-quality opinion, and Energy in hand is a queue

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `cardKeepValue`, `energyKeepValue`, `energyKeepCtx`, `handDiscardOrder`, and the three
functions now expressed through them — `rankHandJunk`, `junkiestInHand`, `handCycleChoice`

---

**Job 17b** · #42 · AI.md item 17, with the Energy rule from Trevor on 17 Sep 2026.

**The invariant: there is ONE answer to "what is this card worth keeping", and it is
`cardKeepValue`. Anything that orders a hand for discarding goes through `handDiscardOrder`, which
reprices after every pitch.**

## What it replaced

Four opinions that disagreed, the sharpest on Energy: `rankHandJunk` filed an Energy one step off the
junkiest thing in hand *unconditionally*, while `cardKeepValue` called it the most valuable card in
hand once anything was short. Which answer you got depended only on which card asked.
The table of all four is in the verbatim item at the foot of this file.

What `junkiestInHand` alone knew was folded in rather than lost: **an evolution whose Basic is in
hand is live**, and **an Energy that pays nothing on this board is junk** — the second now asked of
the engine by attaching the card and taking it off again, so a Double Colorless and Energy Burn price
themselves.

`junkiestInHand` keeps its 0..1 junk scale because its two callers price with it. The translation
table is anchored at **that function's own old answers** at the keep values that used to produce
them, so no caller's weight had to move.

## The Energy queue

Trevor: *"In any turn after the bot has already attached its allotted energy for that turn, if it
still has one energy left in its hand, it should feel insecure... if it has 3 or more energies in hand
after that turn's energy allowance is already attached, then energies should be considered cheap,
scaling up in cheapness past 3. If required to drop 2 cards from the hand and it has 3 energies,
dropping the first should be cheaper than dropping the second. DCE should be slightly more expensive
to drop but situation-dependent."*

**Why the curve is right, not only his taste:** one attachment a turn makes Energy in hand a queue,
and the Nth spare is not wanted for N turns. It is "an Energy is a turn" read along the queue.

**Counted at the END of the turn — Trevor's call, after the turn order was raised.** The attachment
is played last (PLAY-ORDER), so when a discard card asks, this turn's Energy is usually still in hand.
It is spoken for. **Keep this:** a version that counts it as a spare gambles away the only
guaranteed Energy for next turn.

| n = useful Energy in hand after this turn's attachment | worth |
|---|---|
| `n <= energyScarceAt` (1) | 4, plus up to 1.5 of sweat scaled by how slowly the deck produces Energy |
| between | linear from 4 down to 2 |
| `n >= energyCheapAt` (3) | `2 * C / n`, floor 1 |

Two caps sit in front of the curve. **An Energy that pays nothing here is worth 1**, and **so is one
the others already cover**: if the rest of the useful Energy in hand meets the board's whole demand,
it is surplus. Demand is the road to each slot's *biggest* attack, read with `attackShortfalls` —
over-reading it is the safe direction, since it only ever keeps an Energy.
**A Double Colorless is worth 25% more per extra symbol it actually pays**, so it is 1x where it pays one.

**The first-guess numbers, named:** the sweat of 1.5, the 4 → 2 band, the 25% DCE premium, 0.75 for
an evolution with no Basic left anywhere, 2 for a playable Basic on a crowded Bench, 1 for one that
cannot be played. The two thresholds are weights (`energyScarceAt`, `energyCheapAt`) because Trevor
asked for them to be duelled.

## Must not regress

**Nothing in `cardKeepValue` may reach `scoreAttack`** (AI.md item 19). Costs are read with
`shortfallFor` / `attackShortfalls`, never `potential`.

**Ties go by card id, never by hand position** — the positional tiebreak Cat Punch exists to kill.

## Measured

| | |
|---|---|
| `abtest 8 HEAD --pairs 400` | **34.4% ± 1.6 diverged** — it touches every discard, draw and face-up Prize |
| `aiduel 1 HEAD --gbc`, 8,450 mirrored games | **50.3% ± 1.1 — a null** |
| its `--control` | 50.0% ± 1.1 |

**Shipped on the null, on correctness**, the same call EVOLUTION-READINESS made: four disagreeing
answers became one, and the rules are rows. A third of games moving with no change in who wins says
these decisions are real but small at ladder scale. The threshold variants, and the finding that the win rate cannot see them, are in AI.md item 17.

`powertest.js`, *Hand quality — the Energy queue*: seven rows. They call a function that did not
exist before, so there is no pre-change control for them; the claims harness was unchanged at 155/1.

## The AI.md item as it read, verbatim

Moved out of [AI.md](../AI.md)'s open list on 17 Sep 2026 by #42, once the item closed — that
file's own rule is that a shipped item leaves the live claim and a pointer behind, and six
closures in one session had instead left their full text in place (644 lines to 737). Indentation
is the list's; nothing else is changed.

    **Four hand-quality opinions, and they disagree — 9 Sep 2026, Job 16.** Found while building the
    "as many as you want" cluster, which needed a read of hand quality and turned out to have a
    choice of three existing ones.

    | | shape | knows about |
    |---|---|---|
    | `cardKeepValue` | a value per card, high = keep | Energy shortfall (`potential`), whether an evolution's base is **in play**, bench room |
    | `rankHandJunk` | an **ordering** of uids, high = pitch | in-play names only. Rates Energy **near-junk unconditionally** |
    | `junkiestInHand` | the single worst uid | the attack **cost symbols** actually needed, and the pre-evolution being **in hand** |
    | `handCycleChoice` | a **subset**, built on `cardKeepValue` | whatever `cardKeepValue` knows, against the deck average |

    **The sharpest disagreement is Energy.** `rankHandJunk` files it one step off the junkiest thing
    in hand no matter what; `cardKeepValue` calls it the *most* valuable thing in hand the moment
    anything on the board is short of it. Those are opposite answers to the same question, and which
    one you get depends only on which card asked. `junkiestInHand` is the only one that reads the
    symbols the board actually needs, and the only one that notices a Charmeleon is live because its
    Charmander is *also in hand*.

    **This is the Sleep problem (item 1's neighbour) in a different room**: one question, several
    scorers, no single owner. It is also the reason the fourth one was added rather than
    `rankHandJunk` being reused — **consolidating them changes four shipped Base and Jungle Trainers,
    which is a measurement job with `abtest`, not a tidy-up to smuggle into a set addition.**

    **What it would cost:** `cardKeepValue` is the best-informed of the three and the natural
    survivor, but it is not directly usable as an ordering — it ties a dead evolution and a Basic
    with a full bench at 1.5, and a tie in an ordering is the positional tiebreak Cat Punch exists to
    kill. So the job is: give `cardKeepValue` the two facts only `junkiestInHand` has (cost symbols,
    pre-evolution in hand), break the ties, express the other three in terms of it, then
    `abtest 8 HEAD~1` — a symmetric change, so `aiduel` would cancel it.

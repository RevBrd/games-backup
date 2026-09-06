# 6 Sep 2026 — silence is counted in Energy and was billed as turns

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `energyRefillTurns`, the `f.energyCost` branch of `scoreAttack`, and what
`survivesCharge` must NOT be asked

**See also:** the original [`discardSilence`](../AI-INVARIANTS-ARCHIVE-2.md) entry, which built the
quantity this one learned to spend correctly.

---

**`discardSilence` → turns** · Job 15e · Trevor's account of Charmeleon, and one clause of it did all
the work.

**The invariant: `discardSilence` returns how many ENERGY short a card is after the burn, and that is
the same as a number of TURNS only when an Energy is guaranteed to arrive.** It is billed through
`energyRefillTurns` now — 1 when the hand holds an Energy, otherwise how many draws the deck takes to
produce one.

**And the aliveness discount reads `turnsLeft` rather than `survivesCharge`.** Charging and billing
are different questions and one function was answering both.

## The clause that found it

> *"For Charmeleon, if it expects to survive the opponent's next turn, then Slash should have been
> the move… **If the hand is genuinely empty, then there's no guarantee the next card will be a R
> energy to top it back up, meaning even Slash becomes unusable if it doesn't.**"*

The second sentence is the fault, and the arithmetic is worse than it reads. Charmeleon at three Fire
can pay Slash (`CCC`) or Flamethrower (`RRC`, burn one). Flamethrower leaves **two** Fire — at which
point it can pay **neither**. Not a weaker turn. Silent, until an Energy turns up.

`discardSilence` knew this and returned **1**. The line spending it charged `energyDiscard * 1 * 1`,
which prices one Energy short as one turn — true only if you have an Energy.

## Two faults, and the second hid behind the first

**`survivesCharge` was doing nothing in that position and structurally could not.** It returns
`min(1, (left + 1) / turnsNeeded)`. At the `silence === 1` that most cards produce, that is
`min(1, (left+1)/1)` — **exactly 1 for every value of `left`, including zero.**

So the discount meant to price *"it is dying anyway, burn it"* was unreachable on the boards it was
written for. Both Charmeleon claim rows scored an identical **30.00 / 43.00** whether the card was
untouched or one hit from death, and the twin row's own comment had already flagged itself as a false
green without anyone finding the cause.

**The `+1` is not a bug.** It is the deliberate hedge from `turnsLeft`, load-bearing for *charging*
decisions, where three claim rows flip without it. **It is the wrong question here.** Charging asks
*is it worth starting*; billing asks *will this cost ever be paid*. One function, two questions —
the same shape as the three roads in [ATTACK-ROAD](ATTACK-ROAD.md), and the same fix: ask the honest
fact directly and leave the hedged one alone.

| board | before | after |
|---|---|---|
| Charmeleon expects to live | Slash 30, Flamethrower **43** | Slash 30, Flamethrower **15.9** |
| Charmeleon dies next turn | Slash 30, Flamethrower **43** | Slash 30, Flamethrower **46.1** |

## Two wrong shapes were built first, and both are the point of this entry

**Version one: `min(silence, turnsLeft)`.** A hard zero at `turnsLeft === 0` — **the exact cliff
[AI.md](../AI.md)'s sniff test hunts, written by the session that had just documented that section.**
It broke two rows that assert the burn *is* charged for. A hard floor is never the answer to "will it
be here", because `turnsLeft` is an unhedged projection of a snapshot threat; that is why
`survivesCharge` carries a hedge at all.

**Version two: a graded discount that ignored `silence`.** No cliff, principled shape, and **it
passed the four rows it was fitted against.** Then a fifth row broke it: Zapdos emptying itself with
Thunderbolt is four turns of silence, not one, and a discount that cannot tell those apart charges
the same for both.

**When a fifth case breaks a fit, the SHAPE is wrong, not the constant.** That is the whole value of
having rows to fit against, and version two would have shipped if the Zapdos row had not existed.

**The version that holds** caps the silence by the turns actually remaining, plus a fractional hedge
so it never reaches zero — `survivesCharge`'s `+1` idea, sized down to `0.75`, because a whole turn
of optimism swallows the entire penalty at `silence === 1`, which is precisely how the old discount
came to be unreachable.

## The constraint set is tight, and that is worth knowing before retuning

Five rows across four cards pin this, and two of them sit close:

| board | `turnsLeft` | silence | outcome | margin |
|---|---|---|---|---|
| Charmeleon alive | ∞ | 1 | Slash 30 over Flamethrower 15.9 | wide |
| Charmeleon doomed | 0 | 1 | Flamethrower 46.1 over Slash 30 | wide |
| Zapdos doomed | 0 | 4 | Thunderbolt fires | wide |
| Charizard at exactly four Fire | 1 | 2 | 78.6 against a threshold of 80 | **1.4** |
| Arcanine GP at exactly two Fire | 1 | 2 | 18.6 against Quick Attack's 20 | **1.4** |

**The last two are the SAME constraint point** — `turnsLeft` 1, silence 2, refill 1 — so it is one
tight spot rather than two independent ones. **If a future card lands near it, the hedge constant is
what needs re-deriving, not the shape**, and the shape is what the Zapdos row is guarding.

## What is a guess

**`energyRefillTurns`' cap of 4 is.** A deck with one Energy in fifty gives 50, which would swamp
every other term, and the difference between "four turns away" and "fifty turns away" is not one the
rest of the scorer can act on — both mean *not coming*. Unmeasured, and stated here rather than left
to be rediscovered.

**Reading our own deck is legitimate** and `ai.js` already does it in several places: a player knows
their own decklist. This counts cards, not order, so it is not `prizeIndex`'s problem and the
comparison should not be made.

## What it measured

**`aiduel.js 4 HEAD --gbc` — 23,323 games: 50.0% ±0.6.** 11,663 against 11,660. A dead-flat null.

**Exposure was checked and is not the explanation: 24 of the 54 ladder decks field a card that burns
Energy as an attack cost** — Kadabra in 7, Mewtwo in 6, Arcanine in 5, Magmar in 4, Charmeleon and
Ninetales in 3 each. Forty-four percent of the pool can reach this term.

**`abtest.js 8 HEAD --pairs 400`: 4.0% ± 0.7 diverged**, median first difference at action **70**.
And that number is the one that actually explains the null.

**Four percent is an order of magnitude below this session's other two changes** — the attack road
diverged 37.8% and its widening 39.7%, both at a median first difference around action 45. So deck
membership was answering the wrong question: **44% of decks can reach this term and only 4% of games
turn on it.** The decision is rare, and it arrives late, which fits a card running out of Energy
being a late-game event.

**That makes the null much weaker evidence than a null usually is here, and the arithmetic is worth
stating.** If the change alters 4% of games and wins a fraction *p* of them, the shift in overall win
rate is `0.04 × (p − 0.5)`. For that to clear the duel's ±0.6% interval, *p* would have to exceed
about **0.65**. **So 23,000 games rule out this change being a large edge inside the games it
touches, and say nothing whatever about it being a small one.** Quoting the 50.0% without the 4%
would be quoting a null the instrument was never able to refute.

**A coherent reading, offered as a hypothesis rather than a finding:** the change makes the bot more
reluctant to burn when it will live *and* more willing when it will not, and those two corrections
may cancel in aggregate. Nothing here separates that from "rare and mildly good", and no instrument
in this project can.

**It ships on correctness**, which is the ground stated in [PLAYTEST.md](../PLAYTEST.md) for exactly
this case: a bot that walks a Charmeleon into total silence to gain 20 damage is doing something a
person watching would call wrong, and a win rate is worst at seeing that.

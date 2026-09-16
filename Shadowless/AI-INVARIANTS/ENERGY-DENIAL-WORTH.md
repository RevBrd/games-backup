# 15 Sep 2026 — a strip is worth what it turns off, and a coin-flip strip is half of one

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `stripDenial`, `flags.stripEnergy`, the `DISCARD_DEF_ENERGY` rider in `scoreAttack`,
and `energyUids` on stripping **attacks**

---

**Job 17a** · #41 · Trevor's note on Misty's Poliwhirl: *"Rapids is a 50/50 chance at Energy Denial,
and Energy Denial is disproportionately valuable (though still dampened by the coin flip)."*

Three faults in one rider, and all three were correct-by-accident until Gym Heroes landed.

## 1. It was flat in their Energy count, with a cliff at zero

```js
if (f.flags.stripEnergy && you.active && you.active.energy.length) s += W.stripEnergy * survives;
```

**`energy.length` used as a boolean.** Taking one Fire off a Charizard that needs all four for Fire
Spin scored exactly what taking one off a Charizard holding a spare did. Measured on Zapdos before
the change: **51.00 at one Lightning, 51.00 at two, 51.00 at three, 51.00 at four** — and 40.00 at
zero, the cliff.

**This is the sniff test `CLAUDE.md` already names**, and the worked example of it is **twenty lines
below the bug in the same function**: *"RECOIL IS PRICED ON HOW CLOSE IT LEAVES YOU, NOT ON ITS SIZE
— this was a flat charge with a cliff at the very end."* Same shape, same function, learned once
already in August and not carried across the blank line.

**The invariant: what a strip is worth is the drop in their threat, not the fact of it.**
`stripDenial(pi)` is a difference in `threatAgainst` — remove the instance, ask again, put it back.
Defined as a difference rather than as a rule about costs for the reason `spareEnergyFor` lives in
the engine: a Double Colorless pays two symbols and a Rainbow pays any, and a second copy of that
arithmetic would drift. It picks up Weakness and Resistance free, because `threatAgainst` already
runs the engine's own `computeDamage`.

**Scaled by `denied / AVG_ATTACK` with a floor of `W.stripEnergy * 0.3`, and neither number is new.**
The scale is this file's standing currency for a share of a turn. The floor is the number
`potentialOf` already uses for the same idea, where it is commented *"a tempo nuisance, no more"*. So
a strip that denies exactly one average attack scores **11 — the old constant, exactly**. The flat
weight was the average board written down once, and this reproduces it there while reading the board
everywhere else. Same discipline as the paralyze and barrier fixes above it.

After: Zapdos on 4 Lightning **39.04**, on 2 Lightning **21.65**, on none **20.00** — against a
printed 20 either way.

## 2. The coin was not priced at all

`flags.stripEnergy = 1`, with `v.flip` read nowhere. **All three coin-flip strippers arrived with Gym
Heroes** — Rapids, Lt. Surge's Magnemite's Removal Pulse, Sabrina's Venonat's Removal Beam — and
every energy-denial attack in Base, Jungle, Fossil and Team Rocket is guaranteed. So the weight was
correct for the entire live pool, by accident, for five sets.

**A weight that is right for every card that exists is not a correct weight. It is an untested one**,
and the test arrives with the set that breaks it. It is `v.flip ? 0.5 : 1` now, and the consumer
multiplies by it instead of treating it as a flag.

## 3. The bot was not choosing WHICH Energy to take — on attacks

[ENERGY-STRIP-ORDER.md](ENERGY-STRIP-ORDER.md) established on 30 Aug 2026 that *"which Energy a
HOSTILE effect takes is the AI's decision, and it is the inverse of the order a Pokemon pays its own
costs in"*, and wired `energyStripOrder` into Energy Removal and Super Energy Removal.

**It never reached the eight ATTACKS that do the same thing.** With no `energyUids`, `takeEnergy`
falls through to `energyPayOrder` **on the defender** and politely takes whatever they needed least —
the precise failure that entry describes, one card type over. `scoreAction` fills it now, from the
same `energyStripOrder(you.active)[0]` line the Trainer path already used.

**The three are not independent and the ORDER matters.** Fault 1's fix prices the strip at *the best
Energy available to take*. That is only honest because of fault 3's fix. **A scorer that assumes a
smart choice, sitting on top of a bot that makes a bad one, is worse than the flat weight it
replaced** — it would have been a confident number about a decision nobody was making.

## Measured

**Corrected 16 Sep 2026, and the first number in this file was the wrong one.** It read
*"`abtest 8 HEAD --pairs 400`: 3.8% ± 0.7 ... about what eight printings in 65 decks should reach"* —
real, but the **combined** figure for these fixes plus the `base` drop shipped beside them, attributed
here to the strip alone because that is what had just been built. *[Why the two runs appeared to
disagree, and the rule that comes out of it →](../MISREADINGS.md)*

Full pool, 41,600 games a side, against the commit before each:

| change | decks running an affected card, of 65 | ordered pairs exposed | diverged |
|---|---|---|---|
| the `base` drop alone | 2 | ~6% | **1.5% ± 0.1** |
| that plus these three fixes | 14 | ~39% | **3.7% ± 0.2** |
| **these three, marginal** | | | **2.2 points** |

**Read the denominator, not the rate.** `abtest` prints the pool size and not the exposure, so 1.5%
across 65 decks is really *a quarter of every game involving that one card*, and 2.2 points across
fourteen decks is about a tenth of every game involving a stripper. One card whose slot is revalued
every turn against eight printings that change one rider — which is the right relative size, and is
the only thing here that reads as confirmation rather than as noise.

Win rate unmoved at 49.7% either side, and stalls flat at 10. That figure is ~50% by construction in
a symmetric self-play pool, so it is **not evidence either way**: this instrument says the change
fires and destabilises nothing, and cannot say whether it plays better.

**Three of the six claim rows written for Trevor's note go RED against the commit before this**, and
the two Rapids rows both read `31.00` there — the flatness printed in one place.

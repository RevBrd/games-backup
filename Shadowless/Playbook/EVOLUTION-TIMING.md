# Evolution timing — ready, not legal

**Read this before touching the `evolve` case or `scoreOnPlay`.** The bot evolves as soon as it
*can* rather than as soon as it is *ready*, so a Vileplume arrives unable to attack. **This is the
default behaviour Trevor wants for every evolution in the game, not a Gloom rule** — he retitled the
entry to say so.

**State: open, and blocked in a known order.** Fixing the evolve side alone makes the bot worse.
*[The ordering, measured →](../AI.md)* — open item 4.

## Trevor's notes

Verbatim and append-only.

> **This should be a general rule and is the most important item on the list. Gloom and Vileplume are
> used as examples, but this should be the default.**
>
> The answer from GBC and Pocket, except where a card requires an exception, **comes from what is in
> the AI's hand.**
>
> - No Vileplume in hand → the Gloom stays at two Energy.
> - Vileplume drawn, and it seems realistic Gloom survives the opponent's next turn → give Gloom the
>   third Energy **now** and evolve the following turn, so Vileplume can attack right away.
> - Gloom might be killed next turn but Vileplume would survive it → **evolve early**, take the hit,
>   attack the turn after.
> - Base it on the Energy in hand too: with only one Grass available it might hold off on powering up
>   or evolving at all, unless desperate enough to bank on the next draw.

From the workbook's `Wants` column:

> **Aerodactyl** — To evolve before most opponent pokemon
> **Sandslash** — A quick evolution for a Sandshrew that opened the game
> **Gyarados** — Magikarp kept safe enough to evolve
> **Jigglypuff GP** — To evolve before fighting
> **Eevee CH** — To jump in play and evolve quickly
> **Kabuto** / **Omanyte** — To sit on the bench and wait for an evolution
> **Gloom** — To confuse the defending pokemon (and itself) and then evolve out of its confusion

**Note the pull in two directions.** Trevor's main note says *wait until ready*; five of the `Wants`
say *evolve fast*. They are not in conflict — the fast ones are line-starters with nothing to lose by
advancing, and the slow one is a Stage 1 that can already attack and would be trading a working
attacker for a silent one. **Whatever gets built has to produce both**, and a rule that only produces
one of them is wrong even if it fixes Vileplume.

## Why the obvious fix makes it worse

**Measured 21 Aug 2026, in a constructed position rather than reasoned about.** `evolve` scores a flat
**31.0** whether the target holds one Energy or three — there is no term anywhere for whether the
evolved form can attack. But **attaching a third Grass to a Gloom scores −2**, because `potential`'s
`short` is the distance to the *cheapest* attack the card can reach and both of Gloom's are already
paid.

So the bot cannot walk a Gloom to three Energy, **and evolving is currently what unblocks it** —
Vileplume's shortfall of 1 then reads as real progress. Penalise early evolution on its own and
Vileplume is stranded at two Energy forever.

**The order is fixed: the attach rule first, or neither.**

## What the attach half is, and what it is not

**It is not the general cliff fix.** Trevor's own doctrine is that Chansey should *not* walk up to
Double-edge one card at a time, so `short` pinning at zero is right there and irrelevant here.

What this needs is narrower: **when the evolution is in your hand, measure the target's shortfall
against the evolved form.** One specific, cheap case rather than lookahead in general.

**The same capability unblocks [Ammo](AMMO.md)'s Charmeleon half**, which is the harder version — that
one has no evolution in hand to measure against. Build this one first and see how far it reaches.

## BUILT — 28 Aug 2026, both halves together

**Shipped exactly as this file demanded: the attach rule first, in the same commit.** The prediction
above held in every particular, including the one nobody had checked — the blocker turned out not to
be `attachValue` at all but the **surplus rule one level up**, which returns `attachSurplus` before
`attachValue` is ever called. A Gloom holding two Grass can pay for Foul Odor, so `noProgress` was
true and the third Grass was refused at −2 regardless of what `attachValue` would have said.

### Trevor's note, verbatim and append-only

> I'm positive that GBC and Pocket do it, and how I think GBC works is their AI planned for future
> evolutions, but this was weighted much higher if they actually had the evolution card in their hand.
> It was usually careful not to evolve unless it was one energy away from being able to use the
> evolution's cheapest attack of value, so it would get energies close to that point (on a single
> pokemon of the same name, not duplicates at the same time unless nowhere else to go and energies
> aren't in short supply. Those duplicates still might get energies for their own attacks before then
> though) before actually evolving.

### The three terms

1. **`evolutionInHand(pi, slot)`** — the card in hand this slot is about to become. It deliberately
   does *not* ask whether the evolution is legal **this** turn: a Pokemon played this turn cannot
   evolve yet, and that is precisely when you want to start feeding it.
2. **The shortfall is measured against what the slot is BECOMING.** `potentialAs` runs `potentialOf`
   with a card the slot is not yet, so the *road* is the evolution's while `best` — what this Pokemon
   can actually do if attacked right now — stays the current card's. And a fourth exception to the
   surplus rule: **a Pokemon about to become something else is not paid up.** Bounded by the
   evolution's own cost, so it is not a licence to hoard.
3. **Readiness on `evolve`.** `potentialOf(pi, slot, newC).short` is already "symbols short of the
   cheapest attack this card can reach, ties broken by damage" — Trevor's *"cheapest attack of value"*
   with no new definition and no threshold anybody had to invent. Beyond one short it costs
   `evolveEarly` per symbol. **A penalty and not a veto**, which is his "usually": a status wipe is
   still 14 points and can outvote it.

Measured on the Vileplume case — the card this whole item was named for:

| Gloom holds | Vileplume short | attach scores | evolve scores | the bot |
|---|---|---|---|---|
| 1 Grass | 2 | 47.08 | 23.00 | feeds it |
| 2 Grass | 1 | **15.00** (was **−2**) | **31.00** | **evolves** |
| 3 Grass | 0 | −2 | 31.00 | evolves |

**`evolve` was a flat 31.0 at every one of those rows before.** That flat number is what open item 4
measured in the first place.

### The honest result: it changes behaviour and it does NOT change the win rate

**`aiduel 8 --gbc` against `HEAD` reads no significant difference, and the `--control` reads the same
— so the null is a real null and not a broken harness.** The change fires: 17,672 ladder games went
from 228,832 attachments to **229,737**, and from 633,654 turns to 635,509. It is doing something, and
that something is worth about nothing in win rate at this sample size.

**Shipped anyway, and the reasoning should be checked rather than inherited.** Three grounds: it is
the behaviour Trevor specified; it closes a fault he named *from play* rather than from a metric
("the AI evolves pokemon as soon as it can rather than as soon as it's ready"), and a silent Vileplume
is visible to a human in a way 0.4% of attachments is not; and [MEASUREMENT.md](../MEASUREMENT.md)'s
standing prediction is that symmetric perception fixes read flat. **What is NOT claimed is that the
AI got better.** If a later pass finds this term is costing something, the null is why it is fair game.

## Still open here

**The two clauses of Trevor's note that were not built**, both deliberately:

- **Evolutions in the DECK rather than the hand.** His *"planned for future evolutions, but weighted
  much higher if they actually had the evolution card in their hand"* has a lower-weight arm for the
  ones you do not hold. That needs the deck as a *probability* rather than as a fact, which is a
  different kind of reasoning from anything in the scorer.
- **The duplicates rule.** *"On a single pokemon of the same name, not duplicates at the same time
  unless nowhere else to go and energies aren't in short supply."* Nothing stops the bot funnelling
  two Gloom at once, and the exception clause needs the scarcity measure that
  [AI.md](../AI.md) open item 9(b) measured at near-inert — so building it would need that first,
  for a term that fires about once in a thousand attachments. **Raise it with Trevor rather than
  assuming it follows.**

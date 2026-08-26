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

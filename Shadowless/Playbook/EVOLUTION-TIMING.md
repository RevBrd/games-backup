# Evolution timing — ready, not legal

**Read this before touching the `evolve` case or `scoreOnPlay`.** The bot evolves as soon as it
*can* rather than as soon as it is *ready*, so a Vileplume arrives unable to attack. **This is the
default behaviour Trevor wants for every evolution in the game, not a Gloom rule** — he retitled the
entry to say so.

**State: BUILT 28 Aug 2026, both halves in one commit** — and the blocked-in-a-known-order warning
this header used to carry was right, so it is preserved in the section below rather than deleted.
Fixing the evolve side alone *would* have made the bot worse; the attach rule went first, in the same
commit, and the actual blocker turned out to sit one level higher than predicted. **Two clauses of
Trevor's note are still open** and they are at the bottom of this file, not here.
*[What shipped, and the measured null it shipped on →](../AI.md)* — open item 4.

*(This line said **open** for a day after the work landed, while its own body carried a section headed
`BUILT`. A header contradicting its file is worse than a stale header alone: a reader who trusts it
stops reading, which is exactly the audience a state marker exists for. Corrected by #30, 29 Aug 2026
— **when you ship a pattern, the header is the first thing to change, not the last.**)*

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

## The duplicates rule — BUILT 28 Aug 2026

### Trevor's note, verbatim and append-only

> If you have two (or more) equal basics, then you should primarily invest in only one of them for
> evolution (or attack if it's a single-stage). If investing for evolution, then once one is fully at
> the point it needs to be and is just waiting on the evolution card, the other one can be invested in
> as a staller or attacker in its own right, or even as a backup evolution if there's time and
> surplus. The point is one should be selected and invested in first, and then the other isn't blocked
> but evolution investment gets weighted much lower than maybe other pokemon on the bench that might
> want energy. If there are more than two, then maybe the AI would be more resistant to even playing
> the third one onto the bench, to ensure room for variety when future cards are drawn. Not blocked
> but resistant.

### What is withheld is the ROAD, not the Energy

That distinction is the whole of *"not blocked"*. A non-primary duplicate still scores attachments
against **its own** attacks exactly as any other Pokemon does — it can be built as a staller or an
attacker, which is Trevor's second sentence. What it does not get is the **evolution road**:
`potentialAs` measuring it against the card it might become, and the fourth surplus exception that
travels with it. Those two are what make a Growlithe worth a third Fire, so withholding them is
"weighted much lower" without ever being a veto.

### The release is automatic, because the primary is defined by what it lacks

**The primary is the most-invested copy that is not yet ready.** Once the leader's shortfall against
its evolution reaches zero it stops being short, drops out of the running, and the next copy inherits
the road. That is Trevor's *"once one is fully at the point it needs to be and is just waiting on the
evolution card"* — expressed as the definition rather than as a second rule that could disagree with
the first.

**Stable by construction**, because a leader that flip-flops is worse than no rule: the ordering is by
Energy attached, and feeding the leader is what keeps it the leader. `uid` breaks the opening tie,
where every copy is identical and any stable choice is right.

Two Charmander, a Charmeleon in hand, a Squirtle on the bench for contrast:

| leader holds | leader | twin | Squirtle | what happens |
|---|---|---|---|---|
| 0 Fire | **34.67** | 22.00 | −2.00 | leader fed |
| 1 Fire | **53.00** | 22.00 | −2.00 | leader fed |
| 2 Fire | **58.00** | 22.00 | −2.00 | leader fed — the last step before ready |
| 3 Fire | 8.40 | **31.67** | −2.00 | **releases**; leader waits on the card, twin inherits |

The twin never drops below 22 and never goes negative. That is the difference between resistance and
a block, and it is visible in the same table as the rule working.

### The rule exposed an older fault — and it was mine, from the same morning

**At two Fire the leader originally scored 15.00 and the untouched twin scored 22.00**, so the bot fed
the twin and left the leader one Energy short of a Charmeleon. That is not the duplicates rule failing;
it is the **evolution road** being mispriced at its last step.

`attachValue`'s completing branch pays a flat `attachBuild * short * 2` on the stated grounds that
*"`attachEnable` has already paid the attack's real value"*. **That sentence is only true when the
attack is on the card standing there.** `attachEnable` reads `best`, and `best` is deliberately the
*current* card's — so on an evolution road it paid nothing at all, and the last Fire before a
50-damage Charmeleon was priced at seven. An evolution road now always takes the amortise branch,
where a step is worth its share of what is waiting at the end.

**Worth knowing as a shape**: a rule can be right and still look wrong because the thing it depends on
was never exercised at that value before. The duplicates rule is what put two roads side by side and
made the mispricing visible.

### Third-copy resistance

`benchDuplicate`, counted across the **whole board** by name — an Active Growlithe is as much "one of
them" as a benched one. It is a slope, not a cap: the third copy pays once, the fourth twice. And it
is **deliberately silent for the first two**, because the duplicates rule above is built on there
being a second copy to fall back on; charging for it would fight the rule directly overhead.

| already on board | benching another | a different Basic |
|---|---|---|
| 1 | 7.00 | 7.00 |
| 2 | **−2.00** | 7.00 |
| 3 | **−16.00** | 2.00 |

The cost is not the third Rattata. It is the bench slot a Chansey drawn three turns from now will not
have.

### Measured: null, again, and shipped for the same reasons

`aiduel 8 --gbc` against HEAD reads **50.3% ±0.5** — inside the interval. Against the freshly moved
pin the whole day's AI work reads **50.1% ±0.5**. Both nulls, both with the harness behaving.
See [AI.md](../AI.md) open item 4 and [MEASUREMENT.md](../MEASUREMENT.md) on why a specified,
play-visible behaviour is still worth shipping on a null — and on why nobody should quote these as
improvements.

## Still open here

**The two clauses of Trevor's note that were not built**, both deliberately:

- **Evolutions in the DECK rather than the hand.** His *"planned for future evolutions, but weighted
  much higher if they actually had the evolution card in their hand"* has a lower-weight arm for the
  ones you do not hold. That needs the deck as a *probability* rather than as a fact, which is a
  different kind of reasoning from anything in the scorer.
- ~~**The duplicates rule.**~~ **BUILT the same day** — raised with Trevor, and his answer replaced the
  clause this bullet was worried about. The version here does not need the scarcity measure at all:
  the release condition is *"the leader is ready and waiting on the card"*, which the board already
  knows, rather than *"energies aren't in short supply"*, which it does not. **Asking was worth more
  than the four lines it cost** — the note's own wording pointed at a term measured at near-inert, and
  the rule he actually wanted rests on something free. See the section above.

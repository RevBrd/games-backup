# Evolution timing — the working, archive 1

**The dated working behind [EVOLUTION-TIMING.md](EVOLUTION-TIMING.md), for episodes whose finding has
closed and whose rule has landed in the live file.** Moved here verbatim on 2 Sep 2026 by
Shadowless 34; nothing has been edited or condensed.

**Why a pattern file has an archive at all.** A pattern file turned out to be two things stapled
together: **the rule** — what the cards want, what shipped, what is still open — and **a chronological
log of every session that touched it**, one dated section each. The second one grows forever and the
first does not. That is the same register-inside-a-rule-file shape that produced
[AI-INVARIANTS.md](../AI-INVARIANTS.md) out of `AI.md` and [ROSTERS.md](../ROSTERS.md) out of
`OPPONENTS.md`, diagnosed twice before and fixed the same way both times.
*[The convention, and when a pattern file earns one of these →](../PLAYBOOK.md)*

**Append-only and closed.** Correct an entry if it turns out wrong; never shorten one. Trevor's notes
inside these episodes are his words and are append-only twice over. The 200-line target does not
apply. **Start archive 2 rather than growing this past ~450.**

**What is in it:** the 28 Aug 2026 build of both halves — the readiness rule and the duplicates rule
— including Trevor's two notes from that day, the three terms, and the measured null each shipped on.

---

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

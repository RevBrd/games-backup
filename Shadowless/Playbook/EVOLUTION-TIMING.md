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

## A carrier that cannot finish its road steps aside — 31 Aug 2026

**The road was rationed on investment and nothing else**, so a Charmeleon about to be Knocked Out held
it exactly as firmly as a healthy twin standing safely on the Bench. Measured, with two Charmeleons on
two Fire each and a Charizard in hand against a threat of 30:

| the Active | attach → Active | attach → benched twin |
|---|---|---|
| 80 HP | **101.0** | 62.0 |
| 10 HP | **101.0** | 62.0 |

Sweeping the Active from 80 HP down to 10 never moved the number by a point.

### Trevor's note, verbatim and append-only

> A Charmeleon that isn't explicitly in a stalling role doesn't want to fight, but if it finds itself
> fighting it might still use Flamethrower if that's what it takes to survive. If a new Charmander is
> gained while it's fighting, the AI might shift its future evolution focus to that instead, if that
> one seems more realistic to get to its full evolution at full power.
>
> If there's a Charizard in its hand and a Charmeleon on the bench (let's say Charmeleon instead of
> Charmander), I'd say the active one is pretty safe to write off. Best strategy there in my opinion
> would be to hit hard with Flamethrower if it results in a kill and Slash if it doesn't, while
> switching powerup focus to the Charmeleon on the bench. It's just really not good for the viability
> of the eventual Charizard if the Charmeleon you're powering up ends up active and having to choose
> between an energy funnel and taking extra damage from an opponent given more time by Slash.

### What was built, and the turning that was nearly taken

**A copy that will not live to finish its road steps aside, exactly as a ready one does** — the same
shape as the release rule rather than a new kind of rule. **Only when another contender can take it
up**: a sole carrier keeps its road however doomed it is, because there is no better home for the
Energy and refusing would strand it.

**The nearly-taken turning is worth more than the fix.** The open item pointed at the survival
*discount* in `attachBuild`, and **no discount could have fixed this** — the road is a selection, and a
cheaper road is still the same road. *[Why the "off-by-one" underneath it is a hedge →](../AI-INVARIANTS/SURVIVES-CHARGE-HEDGE.md)*

### Still open — the attack half of his note

**"Flamethrower if it results in a kill and Slash if it doesn't" is NOT built**, and it is not
obviously derivable. Charmeleon's Slash is CCC for 30 and its Flamethrower is RRC for 50 discarding a
Fire; on a Pokemon that has just been written off, the Energy is lost either way when it is Knocked
Out, so the usual discard argument does not reach. **Ask what the Slash preference is protecting**
before building it — the last sentence of his note reads as a caution about the whole line rather than
the reason for the choice.

## The destination is not always the cheapest attack — 1 Sep 2026

**Trevor proposed this as a general rule rather than as data, and it is worth quoting because the
question he asked is the more interesting half:**

> Would it benefit us if I went back through the list and added target energy numbers for any where
> it wouldn't automatically be their most expensive move? Or is it better to generalize a rule where
> the AI prices its pre-evolution energies at what the evolved card needs for its cheapest
> *offensive* (or otherwise specified) attack, minus one (because that last energy can be attached on
> the turn it evolves)?

**Generalise, and the deciding argument was not the usual one.** "A tag is a fact we would be
re-typing" is true and had already turned this down three times. The stronger reason is that
**his own notes then become the oracle rather than the input** — a handful of cards where the derived
rule gets it wrong is worth more than 219 hand-entered targets, and it is a much smaller ask.

**The minus-one half already existed**, shipped 28 Aug as `readiness > 1` in the `evolve` case, off
his GBC account. He re-derived it independently, which is a decent sign it is right.

### "Offensive" is nearly right, and the parenthetical is where the real rule was

**Chansey's Scrunch and Ninetales' Lure are both zero-damage cheapest attacks and they are opposite
cases.** Standing there *is* Chansey's job; Ninetales explicitly *"never wants to be required to
choose between Lure and nothing."* What separates them is not the attack — it is that **a wall is a
terminal Basic and is never an evolution target**, so the wall case cannot reach this rule at all.
That is [WALLS.md](WALLS.md)'s own derivation doing the work from one file away, and it is why the
predicate can be as blunt as *"does this attack put damage on them"* without eating the walls.

`attackThreatens` reads the effect script rather than the printed number, because **six attacks print
nothing and deal damage anyway** — Stretch Kick, Dig Under, Stare, Flitter, Coin Hurl and Telekinesis
snipe the Bench, Super Fang halves the defender, Miraculous Comeback counts heads. Trusting the
printed number here would have been the exact fault the Over-Attach work had just finished fixing.
**Fallback**: a card with no threatening attack at all falls back to the cheapest of any, because then
the utility attack genuinely is the destination.

### It is asked in THREE places, and fixing two of them does nothing

**This is the part to carry forward.** One idea — *how far is this card from being worth having* —
turned out to have three call sites, and the third one returns before the other two are reached:

| Site | What it decides |
|---|---|
| `evolve`'s `readiness` | when to pull the trigger |
| `attachBuild`'s road | how long the road is, and what is at the end |
| **the surplus rule's `evolving` exception** | **whether an attachment is even considered** |

The first two were changed, measured, and produced **no behaviour change at all** — an Abra on two
Psychic with a Kadabra in hand still scored the next attachment at −2.00, because the surplus rule
returns `attachSurplus` before either. **Find all the call sites before you measure**, or a correct
change reads as a null.

**Only the evolution road switches.** A card fighting now is still fed toward the cheapest attack it
owns, because a utility attack it can use *this turn* is a real destination. Verified as a control: an
Abra with no Kadabra in hand takes one Psychic and refuses the second, unchanged.

### The curve, and what the rule is worth

Abra on the Bench, Kadabra in hand. Recover costs 2 and does nothing; Super Psy costs 3 and hits 50.

| Abra holds | attach | evolve | |
|---|---|---|---|
| 0 Psychic | 18.33 | 13.50 | |
| 1 | 10.00 | 21.50 | |
| 2 | **15.00** | **29.50** | full marks — one short of Super Psy |
| 3 | **−2.00** | 29.50 | the road is finished |

**Before**, the road called the Abra finished at *one* Psychic and the evolve reached full marks
there too — one short of *Recover*.

### Eight of his own notes confirm it, and none contradicts it

**22 evolution printings of 151 change target**, and the confirmation is the thing worth recording:
these notes were written before the rule existed, name no code, and every one of them names the
damaging attack as the destination the derivation independently picked.

| Card | moves | Trevor's note |
|---|---|---|
| Ninetales | 2 → 4 | *"to come in after it's ready to use Fire Blast, and to never be required to choose between Lure and nothing"* |
| Wigglytuff | 1 → 3 | *"Lullaby should only be used when Do The Wave can't be, and this card doesn't like being put in a position where it has to use it"* |
| Nidorina | 1 → 3 | *"Double Kick is primary. It doesn't want to be in a situation where it has to use Supersonic"* |
| Hypno | 1 → 3 | *"doesn't want to enter a match when Dark Mind isn't available"* |
| Kadabra | 2 → 3 | *"a pokemon that wants to stay at 3 energies at all times"* |
| Wartortle | 2 → 3 | *"only withdraws when it can't use Bite"* |
| Parasect | 2 → 3 | *"Slash is usually preferable"* |
| Victreebel | 1 → 2 | *"Acid is the primary attack… Lure follows the same logic as it does with Ninetales"* |

**Three of them use nearly the same sentence** — *"doesn't want to be in a situation where it has to
use it"* — which is the readiness discount stated in English before anybody wrote it in code.

The other fourteen movers are Dark Golduck, Dark Persian ×2, Gloom, Graveler, Haunter, Hypno's
second printing, Poliwhirl, Rapidash, Scizor, Starmie, Tentacruel, Victreebel's second printing and
Wigglytuff's second printing. **None has a note that disagrees**; most have no note at all, which is
the whole point of deriving it.

### It is a discount, not a veto

Unchanged from 28 Aug and worth restating because the targets got further away: everything else can
outvote it. A status wipe is 14, a big HP jump is real, an ON_PLAY Power is priced on its own.
Evolving early to survive is still allowed; it just stops being free.

### And it reads null on a duel, like every other change in this file

`aiduel 8 HEAD --gbc`: **49.9% ±0.5 over 34,564 ladder games, no significant difference.** The 28 Aug
readiness work shipped on a null too and its section above says the same thing, so this is the
pattern's normal result rather than a disappointment — **do not inherit "this helped" from the fact
that it shipped, and do not inherit "this failed" from the null.**

**Why a null is the expected shape here rather than a worrying one.** The rule moves 22 printings of
151, most of them by one Energy, and only on turns where an evolution is already in hand and already
being fed. Both seats play under it. A win rate is close to the least sensitive instrument available
for that, which is the same argument `abtest` exists for one file over.
*[What the grounds actually were, and the control that was deliberately not run →](../AI-INVARIANTS.md)*

## The plan is the whole LINE, and each step pays for itself — 1 Sep 2026

**Trevor's, from the GBC game and confirmed in Pocket. It is the rule above, un-truncated.**

> The opponent attaches the energy absolutely last before attacking, almost like the bot goes down a
> checklist of everything else before it's allowed to roll the energy attach numbers at all. So with
> that resolved, a pokemon like Machop only needs to power up to 2 energy before it's considered
> "ready" to evolve on a subsequent turn. Then on the next turn, it evolves into Machoke *first* and
> gets its energy second.
>
> For Abra… it would only give Abra 1 energy. Why? Because Alakazam needs 3, and Abra would need two
> turns to evolve twice. Turn 2 results in Kadabra with two energies. Turn 3 results in Alakazam with
> three energies. But if it's in the active spot and a Kadabra shows up in its hand without an
> Alakazam, the bot will still want to evolve it but will wait an extra turn while it attaches a
> second energy to Abra… and on turn 3 will evolve to Kadabra with three energies ready to use Super
> Psy. **Recover is never factored in at all.**

**Every evolution step is a turn, and every turn brings an attachment.** So a card on a road does not
need its evolution's full cost — the line finances one Energy per step:

> **want = destShort(deepest form the hand can reach) − (evolution steps remaining)**

| plan | destination | steps | target | Trevor said |
|---|---|---|---|---|
| Abra → Kadabra → **Alakazam** | Confuse Ray `PPP` = 3 | 2 | **1** | *"only give Abra 1 energy"* |
| Abra → **Kadabra** only | Super Psy `PPC` = 3 | 1 | **2** | *"wait an extra turn"* |
| Machop → **Machoke** | Karate Chop `FFC` = 3 | 1 | **2** | *"only needs to power up to 2"* |

**Three for three, and the Machop figure fell out before anyone looked it up.** Measured on a board:
an Abra with a Kadabra in hand is fed to two and refused a third; **the same Abra with an Alakazam
behind it is fed to one and refused a second.** The control — nothing in hand — takes one Psychic for
its own Psyshock and refuses the rest, unchanged.

**The rule shipped hours earlier is this one truncated to depth 1**, and `readiness > 1` is
`roadWant > 0` when `steps` is 1, so nothing about the one-step case moved. *"Recover is never
factored in"* is a third independent confirmation of `destShort`, arriving from a different direction
than the eight `Wants` notes did.

**Only cards in hand count**, so the plan is a certainty. The engine enforces one evolution per
Pokémon per turn — verified on a board rather than assumed — so the step count really is a turn count.

### And the evolve goes before the attach

The other half of his observation, and **the case #31 named and declined to extend** — its reasoning
was that `attachBuild` already looks ahead through `evolutionInHand`, so an attachment made first is
not blind to the evolution. True of the attachment's *value*, and it was the right call without
evidence.

**What it does not cover is the body.** After the evolve, the card competes for the Energy as the
evolved form, so every term reading HP rather than the plan sees the one that will actually be holding
it — `survivesCharge` prices an Abra at 30 and a Kadabra at 60. Measured: an Arcanine attach worth
38.50 now waits behind an Abra's evolve worth 29.50.

**Ready ones only, and that guard is the whole safety of it.** A `roadWant > 0` evolve is the bot
deliberately waiting, and promoting one would let an ordering rule silently overrule the readiness
rule two functions away. Both directions are pinned in `powertest.js`, and the control was watched:
removing the promotion turns the first red and leaves the second green.

**`playBasic` is still deliberately not extended.** #31 flags it as the one with a real case of its
own, wanting its own measurement.

## The deck arm — Trevor's framing, 1 Sep 2026, and it is cheaper than "probability"

**Still not built, and this is context for whoever does.** [AI.md](../AI.md)'s open item 9 has parked
*"evolutions in the DECK"* as needing *"probability rather than fact, which is a different kind of
reasoning from anything in the scorer"* — and Trevor's own account of what he wants is **not a
probability model**:

> I think we should have it price "in hand" and "in deck" both as green lights to plan for evolution
> in favorable conditions, but with "in hand" weighted much higher, whereas "in deck" might result in
> Machop's second energy being added after some bench pokemon have had their available move powered up
> or been prepped for a more impending evolution themselves.

**That is a priority ordering, not a likelihood.** An in-deck road is a real claim on Energy that
**yields to every more concrete one** — a Pokémon whose attack it would switch on now, or a road whose
evolution is actually in hand. It gets the *surplus*, not a share.

**Which matters for scoping**, because "needs probability" reads as a research problem and this reads
as a weight below the existing ones. It is still not small — the deck is a pool the scorer has never
reasoned about, `namesWithAnEvolution` is the only machinery pointing that way, and the
"favorable conditions" clause is unspecified. But **do not inherit the estimate from the old
framing**; ask him what "favorable" means and price it as a low-priority road rather than a forecast.

### Measured — 63.8% of games diverge

`abtest 8 HEAD`, full ladder pool: **11,042 of 17,296 games come out differently**, median first
difference at action 24. Win rate 48.6% → 48.5%, symmetric and uninformative as it always is here.

**That is the second-largest change this project has measured**, behind #31's turn ordering at 75.6%,
and for the same reason — evolution roads run in most decks in the format. Which is worth holding
next to the win rate: a change can rewrite two thirds of the games in the pool and leave the outcome
flat, because both seats got it. *[Why that is the expected shape rather than a null result
→](../MEASUREMENT.md)*

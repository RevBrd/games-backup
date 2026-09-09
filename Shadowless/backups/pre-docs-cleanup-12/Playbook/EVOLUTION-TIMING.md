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

**The dated working for the 28 Aug 2026 build is in
[EVOLUTION-TIMING-ARCHIVE-1.md](EVOLUTION-TIMING-ARCHIVE-1.md).** *[Why a pattern file gets an
archive, and the ~350 that triggers one →](../PLAYBOOK.md)*

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

## What shipped on 28 Aug 2026, and where the working went

**Both halves landed in one commit** — the readiness rule (evolve at one Energy short of the
evolution's cheapest attack, rather than as soon as it is legal) and the duplicates rule (the
evolution ROAD is rationed to one carrier; the Energy is not). **Both shipped on a measured null and
said so.**

**The full working, Trevor's two notes from that day, the three terms and the nulls are in
[EVOLUTION-TIMING-ARCHIVE-1.md](EVOLUTION-TIMING-ARCHIVE-1.md)** — moved there on 2 Sep 2026 because
this file had reached 493 lines, which is past the point where a session stops reading all of it.
**Two things from it are load-bearing and stay here:**

- **Fixing the evolve side alone would have made the bot worse**, and that warning was right. The
  attach rule had to go first, in the same commit.
- **The blocker sat one level higher than anybody predicted** — in the surplus rule above
  `attachValue`, not in `attachValue`. A Gloom on two Grass can pay for Foul Odor, so `noProgress`
  was true and the third Grass was refused no matter what `attachValue` thought.

*[The invariants →](../AI-INVARIANTS/EVOLUTION-READINESS.md) ·
[the twins →](../AI-INVARIANTS/EVOLUTION-ROAD-TWINS.md)*

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

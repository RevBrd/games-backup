# Ammo — attacks that eat their own Energy

**Read this before touching the surplus rule in `attachBuild` or `potential`.** An attack that
discards its own Energy to fire turns spare Energy into **rounds**. Energy past the printed cost is
not surplus on these cards; it is how many more times the card gets to act.

**State: built.** Shipped 21 Aug 2026, and it is the largest single move the AI has had. One half
of the note is still open. **The other side of the same coin — what a discard COSTS when there is no
ammunition behind it — landed 23 Aug 2026 and is at the bottom of this file.**

## Trevor's notes

Verbatim and append-only.

> **Charizard, and anything whose attack eats its own Energy.** Evolve it **on the bench** and
> pre-load it with as much Energy as you can beyond the four the attack costs. Fire Spin discards two
> per turn and you can only attach one, so pre-load enough to last, supplement with DCE as you go,
> and try not to run out.
>
> **A DCE is worth two Fire on a Charizard because of Energy Burn**, so when you are forced to
> discard one it takes two away by itself — keep enough basic Fire attached to be the thing that gets
> discarded each turn.
>
> A player might pre-load a **Charmeleon** on the bench with extra Energy in anticipation, even with
> no Charizard in hand yet.

## How the family is detected

**`ammoSymbols()` derives the headroom from the `COST_DISCARD_ENERGY` verb**, not from a list of
cards. Every card carrying that verb gets this behaviour for free and the other ~1,200 are untouched
— there is a test asserting Hitmonchan still caps at its printed cost.

**`COST_DISCARD_ALL_ENERGY` is deliberately excluded.** Wildfire discards any number, so *"how much is
useful"* is unbounded and a headroom figure would be a guess dressed as a derivation.

## What the note bought

Two faults, both fixed, worth **+5.3 points** on the benchmark deck — `b1_t4_fire` went from **8th of
13 at 46.9%** to **6th at 52.8%**, above five decks it had been below.

**The surplus rule hard-capped Charizard at four Energy.** A fifth Fire scored **−2**, Active or
benched. Fire Spin discards two per use against one attachment per turn, so **the bot could never fire
it twice in a row** — which is the entire deck.

**The engine's discard order read the *card* rather than the *slot*** and spent the Double Colorless
first, on the one Pokémon where it is worth two Fire. That half is an engine fix and lives in
[ENGINE.md](../ENGINE.md)'s `takeEnergy` section.

*[Both invariants, and what each measured →](../AI.md)*

## Open

**The Charmeleon half is not built.** Pre-loading a Stage 1 on the bench in anticipation of an
evolution you do not yet hold needs the same *attach-toward-an-evolution* capability
[Evolution timing](EVOLUTION-TIMING.md) needs, and it is the harder version of it — Gloom's case at
least has the evolution in hand to measure against. Nothing in the scorer reasons about the hand as a
resource for a multi-turn plan.

**Do not build it here.** If the capability lands, it lands once and both patterns read it.

## The cost side — silence, 23 Aug 2026

**Ammunition was priced and disarmament was not.** `ammoSymbols` answered *"how much Energy is worth
holding"* and got Charizard right. Nothing answered the opposite question — *"what does spending it
cost"* — which was a flat `energyDiscard` at 7 a card, the same rate whether Charizard spent two of
six it would replace or Zapdos emptied itself down to nothing.

### Trevor's notes

Verbatim and append-only.

> **Arcanine.** Could we adjust this by putting the cost of an energy burn (at four existing
> energies) slightly above the 30 added damage and 30 self-damage combo that Take Down brings? Maybe
> we can do that by making an energy burn while holding an energy abundance rather cheap, instead of
> a flat value of weighting it low. You don't really lose a turn if it was an extra energy, and while
> you do still want to refill it with Arcanine to keep Take Down available, it's still a much cheaper
> burn than burning down 3 -> 2.
>
> **Zapdos.** Could this be weighed over turns of expected life? If it's expected to die on the
> opponent's next turn then burning energy doesn't really matter much (and in Arcanine's case might
> prevent it from being topped up when it's about to die anyway), so could we tie it to that somehow?

### They are one term, and that is the finding

**Trevor sent these as two guesses about two cards.** They are the two factors of a single quantity:
**how much you will miss the Energy**, and **how long you will live to miss it.** Abundance is the
first, expected life is the second, and his own parenthesis — *"in Arcanine's case might prevent it
from being topped up when it's about to die anyway"* — is the Zapdos rule arriving at the Arcanine
card. This is the second time he has unified a cluster from outside it; the first was paralysis and
an Agility barrier being one bought turn, which cracked [Attack choice](ATTACK-CHOICE.md).

**`discardSilence` measures turns you cannot attack**, being symbols short of the *cheapest* attack
once the discard has happened, since you may attach one Energy a turn. Squared, because silence is a
cost and costs are squared here. Discounted by `survivesCharge`, which already existed for the other
half of exactly this question. *[The invariant →](../AI-INVARIANTS.md)*

| | before | after |
|---|---|---|
| Charizard, Fire Spin at six Fire | 86 | **100** — ammunition it replaces is free |
| Charizard, Fire Spin at four Fire | 86 | **72** — emptying below its own cost is not |
| Zapdos, Thunderbolt, healthy | 72 (beat Thunder's 46) | **44** — Thunder wins, which is the note |
| Zapdos, Thunderbolt, dies next turn | 72 | **72** — unchanged, and now for a reason |
| Arcanine, Flamethrower at four Fire | 43 | **50** — the burn is free, it re-attaches |

### What it did NOT close, stated because the test passing hides it

**Arcanine's ordering now matches Trevor's note by 0.3 points out of 50, and that is not the rule
working.** Take Down at full HP is 80 damage minus a recoil the curve prices cheapest there, and
Flamethrower is 50 that now costs nothing to fire. The model rates them equivalent and the discard
simply stopped breaking the tie the wrong way. **The reserve half — *"Take Down should stay powered up
and ready to go"* — is still unbuilt**, and nothing prices holding an attack in reserve.
That is the open row in `tools/claims/base1.js`, and it is probably one rule with Ninetales and
Charmeleon rather than three.

**It reversed a 14 Aug assertion in `powertest.js`** which had a fresh Arcanine preferring Take Down.
*[Why that test was rewritten rather than deleted →](../HISTORY.md)*

## Silence is measured against the CHEAPEST attack — 26 Aug 2026

**A second Arcanine, and the finding is about the first one.** `basep-6`'s Flames of Rage discards
**two** Fire where Flamethrower discards one, and Trevor's note on it says the opposite of what the
table above concluded: *"It requires a double Energy Funnel to maintain, so it should not plan to be
maintained. Quick Attack is preferred unless near death."*

**That is not a contradiction and reading it as one would send the next session round in a circle.**
It is a difference of degree the model should be able to see on its own:

| | discards | re-attach | sustainable |
|---|---|---|---|
| Flamethrower | 1 | 1/turn | **every turn** — the burn really is free, which is why the row above is right |
| Flames of Rage | 2 | 1/turn | **every other turn** — half your tempo, which is why the note says don't plan on it |

### What `discardSilence` actually asks

**`shortfallFor` measures the CHEAPEST attack the slot owns**, which answers *"can I attack at all?"*
That was the right question for Charizard, whose only attack is the expensive one — empty it and it
is genuinely mute, and the four-Fire row above is that working.

**A card with a cheap fallback defeats it.** Arcanine keeps Quick Attack at CC, so after burning two
of four Fire it still has two, still affordable, shortfall **0**, no penalty at all. The bot reads
"not silenced" and fires. But the attack it cannot repeat is Flames of Rage, and *that* is what
Trevor's note is about. **"Can I act?" and "can I keep doing THIS?" are different questions and only
the first is asked.**

Measured, `basep:Arcanine` at 0 self-damage against a threat-40 Hitmonchan:

| Fire attached | Flames of Rage | Quick Attack | picks | why |
|---|---|---|---|---|
| 2 | **12** | 20 | Quick Attack | discarding 2 of 2 silences everything — the term fires correctly |
| 3 | **33** | 20 | Flames of Rage | partial shortfall, partial penalty |
| 4+ | **40** | 20 | Flames of Rage | shortfall 0, **no penalty exists** |

**The shape is already right and one term is missing.** Two of the three rows in
`tools/claims/basep.js` pass — it escalates as Arcanine is hurt, and it refuses outright at two Fire.
Only "healthy, with Energy to spare" fails. **Do not rebuild this term; extend it.**

### Trevor's note, verbatim and append-only

> The logic behind the Flames of Rage one is that it discards both energy cards each time, requiring
> a double energy funnel. You can only attach one per turn, so this means you can only attack once
> every two turns. So while Quick Attack might work out to the same damage on average, it doesn't
> require an *enormous* energy investment that takes away from readying the bench.

**The second sentence names a cost nothing in the scorer has**: Energy spent here is Energy that
never reached the Bench. `discardSilence` prices the tempo of *this slot* and stops there. That is a
board-level opportunity cost, and it is the same missing capability the Charmeleon half of this file
and [Evolution timing](EVOLUTION-TIMING.md) both wait on — *reasoning about Energy as a resource with
somewhere else to be.*

**Left unbuilt deliberately.** It is probably one rule with the reserve half above rather than a
second one, and both of them want the same capability. If that capability lands, it lands once and
every row in this file reads it.

## How wide is this rule really — 28 Aug 2026

**Two cards. That is the entire blast radius of any sustain rule, and nobody had counted.**
Swept every attack in the live pool carrying `COST_DISCARD_ENERGY` or `COST_DISCARD_ALL_ENERGY` —
nineteen attacks across nineteen cards — and grouped them by how much they burn:

| burns | attacks | what a sustain rule would do to them |
|---|---|---|
| **1** | fourteen — Flamethrower ×4, Ember ×2, Fire Blast, Recover ×2, Barrier, Destiny Bond, Scavenge, Third Eye, Quick-Attack Flareons | **nothing.** One burned against one attached a turn is rate-neutral, which is the 23 Aug table's Flamethrower row arriving as a general fact rather than a card |
| **2** | **Charizard** (Fire Spin) and **Arcanine GP** (Flames of Rage) | the only two that can be charged at all |
| **all** | Zapdos, Pikachu MS, Pikachu GP 2 (Thunderbolt ×3) | already fully priced — `discardAll` empties the slot and `discardSilence` reads the whole shortfall |

**And one of the two has nothing to choose between.** Fire Spin is Charizard's only attack, so any
term here can move its absolute score and can never change its decision. **So a sustain rule is, in
this pool, a rule about one card** — which is worth knowing before anyone designs a general mechanism
for it, in either direction: it means the risk is tiny, and it means the evidence for tuning it is
one data point.

## The reserve arithmetic, which the obvious fix runs into

**Written down because the obvious fix is obvious, and it does not bind on the board the claim
uses.** Trevor's note reads as a rate — *"you can only attack once every two turns"*, and 40 every
other turn is 20 a turn, which is Quick Attack exactly. That is a real rule and it needs no unbuilt
capability. It is also **not what is happening at four Fire**:

| Fire | fires FoR on turn… | because |
|---|---|---|
| 4 | 1, 2, 3, 4, then every other | attach 1 and burn 2 is a net drain of **one**, so four attached is three turns of buffer over a cost of two |
| 2 | 1, 2, then every other | same drain, no buffer |

**"Once every two turns" is the steady state, not the board.** An Arcanine sitting on four Fire can
fire Flames of Rage four turns running, so a rule that reads the rate correctly still says *fire it*
here. Any version that charges anyway is charging the card for a shortage it does not have, and it
would take Charizard's ammunition rule down with it — at six Fire, Charizard has exactly the same
buffer and the 23 Aug row says that buffer is free.

**So the healthy-board claim wants one of two things, and they are different rules.** Either the cost
is the **board-level** one this file already names — four Fire on an Arcanine is four Energy that
never reached the Bench, and sustaining it means it never will — or **the claim's board is wrong**
and the note is about a card at three Fire or fewer, where the rate genuinely binds. At three the bot
scores Flames of Rage 33 against Quick Attack's 20 and is still wrong by the note, so the rate rule
would earn its keep there. **Ask before building.** *[Why a report can turn out not to mean what it
says →](../PLAYTEST.md)*

## Resolved — the claim was wrong and the fault was one decision upstream, 28 Aug 2026

**Trevor, asked the question this file left open:**

> If it ever found itself in a situation where it did have 4 energies attached then yes, it should
> use Flames of Rage. However, it should be **exceedingly rare** that it finds itself in that
> situation, since Over-Attaching in anticipation of that move for Arcanine GP is **the same price as
> spending the energy reactively instead**. After it's at 2 energies, additional ones better serve the
> bench. If the bench has enough energies including potential evolutions, then saving the energy for
> later might even be preferable unless they're in abundance. If they're in abundance and no other
> card is worth building up, then it becomes cheap.
>
> The reason it's different from Charizard is the damage potential. Flames of Rage and Fire Spin have
> hugely different levels of output, plus Charizard accepts DCE, plus Charizard has a much higher HP
> to fight for a long time and burn all those pre-loaded energies in high damage attacks. Plus
> there's no alternative for Charizard, so an opponent with 10 HP left still needs a 2 card burn to
> finish it.

**The bot was right and the claim was wrong.** Two sessions read a red row as a scoring fault in
ATTACK CHOICE and went looking for a sustain term. The attack choice at four Fire was correct the
whole time; what was wrong was that the bot was **stocking Arcanine GP to six Fire** — `ammoSymbols`
returned `cost + burn × ammoTurns` = 2 + 4, handing a 40-damage attack the pre-load treatment written
for a 100-damage one. *[Why a report is a symptom and not a diagnosis →](../PLAYTEST.md)*

### The rule, and why the verb alone was too wide

**Ammunition is only ammunition if you have nothing else to shoot with.** Headroom exists to buy
rounds you would otherwise not get, so it needs two things to be true and both are things the card
says about itself:

1. **The burn outpaces the attachment.** One a turn in, one a turn out is rate-neutral — the round
   always arrives, so there is nothing to stockpile *for*. Only a burn of two or more falls behind.
2. **The card has no free attack.** Fire Spin is all Charizard has, so an empty Charizard is mute and
   every spare Fire is a turn it gets to act. Arcanine GP keeps Quick Attack and burns nothing to fire
   it, so it is never mute — a spare Fire buys it a *bigger* attack rather than a *possible* one, and
   Trevor's first sentence is that the bigger attack costs the same either way.

**This is the same discriminator `discardSilence` already turns on**, which is the reason to trust
it: that function reads the *cheapest* attack for exactly this reason, and #28 named "a card with a
cheap fallback defeats it" as the shape of the fault. Both halves of the Ammo family hinge on whether
the card owns a non-burning attack.

Trevor's other three reasons — 100 damage against 40, Energy Burn making a DCE worth two Fire, and
120 HP to live long enough to spend a pre-load — all point the same way and **none of them
generalises without a threshold somebody would have to invent.** They are why the answer is right,
not how the code finds it.

### The nesting is the whole care — it moved FIFTEEN cards before it moved one

Written flat first: *no headroom for any card with a free attack.* Swept, and it took the headroom
off **Ninetales, Charmeleon, Charmander, Magmar, Starmie, Kadabra, Mewtwo, Gastly, Slowpoke, both
Flareons, Ponyta, Dark Golduck and base1 Arcanine** — fourteen rate-neutral cards, most of them in
live ladder decks, on the strength of an argument about two cards that are nothing like them.

**A rate-neutral card was never at risk of running out, so the fallback test has nothing to say about
it.** Asking it second, and only under a real drain, moves exactly one card. That is the difference
between a derivation and a coincidence, and the sweep is the only thing that told them apart.

| | headroom before | after |
|---|---|---|
| **Charizard**, Fire Spin | 8 | **8** — unchanged, and the 21 Aug +5.3 result with it |
| **Arcanine GP**, Flames of Rage | 6 | **0** — the surplus rule now bites at four Fire instead of six |
| every other burner | unchanged | unchanged |

### What the instruments can and cannot say about it

**`aiduel` and `decksim` are blind to this and running them would produce a null that means nothing.**
`basep-6` appears in **0 of 51 authored decks**, and promos are excluded from *generated* decks by
design, so the card the change touches never reaches the table. This is recorded rather than measured
on purpose: a symmetric null from an instrument with no exposure is the exact failure
[MISREADINGS.md](../MISREADINGS.md) exists for. The evidence here is the claim rows and the sweep.

**Three claim rows now hold it**, including a **control**: a fifth Fire on Charizard must still score
positive. Without that row, deleting `ammoSymbols` entirely would pass.

### Still open — and MEASURED on 28 Aug 2026, which narrowed it

**Before anyone scopes "Energy as a resource with somewhere else to be" as one large job, read
[AI.md](../AI.md) open item 9.** It was measured over 17,672 ladder games and two of its three halves
turned out to be finished or inert: misrouting runs at **0.26% of attachments** and a hold-for-later
term would fire about once in a thousand. **What is left is the forward-looking half** — attaching
toward a card that is not in play yet — which is exactly the Charmeleon note above, and which no
instrument in this repo can currently measure.

## Still open, and unchanged

**The board-level half is still unbuilt and Trevor's answer sharpened it rather than closing it.**
*"If the bench has enough energies including potential evolutions, then saving the energy for later
might even be preferable unless they're in abundance"* is three conditions about the rest of the
board, and nothing in the scorer reasons about Energy as a resource with somewhere else to be. It is
still the same capability the Charmeleon half and [Evolution timing](EVOLUTION-TIMING.md) wait on,
and it is still one rule rather than three.

## The reserve half is closed, and it was never one rule — 30 Aug 2026

**Three files carried the sentence "this probably wants to be one rule with Charmeleon and
Ninetales."** Asked directly, Trevor took all three apart, and **not one of them turned out to be a
reserve case**:

| card | what it actually is |
|---|---|
| **Ninetales** | *entry*, not holding — "it does not want to be in battle when its main attack is unavailable", plus a narrow Lure exception that `bestDragTarget` now serves |
| **Charmeleon** | *lookahead*, which is [AI.md](../AI.md)'s open item on attaching toward a card not yet in play, and always was |
| **Arcanine** | a *slot* question, and the open row was asking for the opposite of what he wants |

**Trevor on Arcanine, verbatim, 30 Aug 2026:**

> Being in the active spot should change things, in terms of it forces certain realities before your
> pokemon is ready sometimes. An Arcanine in the active spot with 3 energies should probably attack
> anyway, if pausing for a turn to gather energies would result in a net negative in terms of what
> would be gained by powering up Take Down, which would probably be most situations where it would
> take damage. But on the bench, the AI shouldn't want to stop powering it up at Flamethrower, and
> always continue on to Takedown.

**Both halves measured as already correct** and are claim rows now. An Active on three Fire with
nothing to attach swings; a benched one on three Fire is fed a fourth at 38.5 while a Hitmonchan that
already pays for Special Punch is refused one at −2, so the surplus rule is doing the discriminating
rather than a blanket "feed the Bench".

**What generalises is not about Arcanine.** *The open row was written about a CARD and the answer was
about a SLOT.* Standing still to bank an Energy is a thing a Bench does; an Active that declines to
swing is paying a turn of damage for the privilege. **A note that does not say which slot it is about
can be true in one place and wrong in the other**, and every note in this file should be read with
that question asked first.

**The genuinely open thing moved rather than closed**, and it is in the neighbouring pattern: the
evolution road prices a dying carrier exactly like a healthy one. See [AI.md](../AI.md)'s open list
and [EVOLUTION-TIMING.md](EVOLUTION-TIMING.md).

## The board-level half has a first testable case — 31 Aug 2026

**This file has said since 26 August that the missing capability is "Energy as a resource with
somewhere else to be", and that it is the same one [Evolution timing](EVOLUTION-TIMING.md) waits on.
Trevor's Charmeleon rule is the first version of it small enough to hold in one board.**

> If it's not actually going to die on the next turn, you can still maximize damage per energy spent
> by using Slash when Flamethrower can't kill... Slash on the turns that Flamethrower wouldn't kill
> allows it to be a pest while not depriving the bench of energy due the funnel, except for maybe one
> or two turns where it resulted in a kill. If it seems like it *would* die on the next turn, burning
> that energy with Flamethrower just to maximize damage costs nothing.

**Measured at three Fire, where both attacks cost three and neither kills a Chansey:** Slash 30.0 and
Flamethrower 43.0 on a healthy board, a hurt board and a dying board — **a flat 13-point gap in all
three.** The rule is not reached anywhere.

### Two reasons, and only one of them is this file's

**The discard costs a flat 7 because `discardSilence` prices the wrong thing here.** It measures being
unable to *act*, and Charmeleon can always act, so a one-symbol burn is one turn of silence and
nothing more. **Trevor's cost is not on this slot at all**: you may attach one Energy a turn, so the
Fire that replaces the burned one is an attachment the **Bench** does not get. That is the board-level
opportunity cost, stated as a card decision for the first time.

**And something changed underneath it on 31 Aug that this file should know about.**
`evolutionRoadFor` now names *which* other slot wants the Energy — it picks the copy that will
actually arrive, and it does it before any of this. **The half of the capability that was missing was
"who else wants it", and that half now exists.** What is still missing is a rate: what one forgone
attachment is worth against 20 damage. **Do not invent one** — `attachValue` already prices an
attachment per slot, and the honest version reads that rather than adding a weight beside it.

### The second reason is a tension, not a gap, and it must not be "fixed"

**Trevor's dying clause cannot fire, and the thing blocking it is load-bearing.**
`survivesCharge(pi, slot, 1)` returns **1** even at `turnsLeft` zero, because the `+1` hedge exactly
cancels a one-symbol discard. That hedge is what keeps three other claim rows green — including this
file's own Arcanine GP row — so this is two of his rules pulling opposite ways rather than a bug.
*[The hedge, and the experiment that found it →](../AI-INVARIANTS.md)* ·
*[How to tell a bug from a policy →](../MEASUREMENT.md)*

**Raise it with him before touching either.** The clean resolution may be that the dying clause wants
`turnsLeft` directly rather than the hedged number — a caller stating its own policy, which is exactly
what the split was built for — but that is a decision, not a derivation.

## Proactive and reactive funnelling, and the sweep that says don't build the guard — 31 Aug 2026

**Trevor's framing, and it is a real thing he is describing:**

> Proactive funnelling is sort of what we've been doing, where the replacement energy is attached
> right before it's burned in the attack. GBC and general strategy would also use reactive funnelling
> at times, where it would allow Flamethrower (or similar move) to drain to 2 energies while
> attaching that turn's energy to a bench pokemon, and then top it back up to 3 if it needs to be used
> again on the following turn, right before burning again. The situation we're talking about would be
> a great candidate for reactive funnelling, though proactive should stay the default in my opinion.

**It is correctly observed and it should NOT be built as two modes.** The bot holds no funnelling
policy — it scores each attach per slot and each attack independently, so proactive and reactive are
*descriptions of where the attachments landed*, not settings. Building a mode switch would put a
policy above a scorer that is already capable of producing both, which is the tagging mistake this
project has turned down three times.

**All four of his clauses fall out of ONE term** — the attachment a self-discarding attack commits,
priced at what it was worth elsewhere:

| board | the charge | what falls out |
|---|---|---|
| nothing on the Bench wants Energy | ~0 | **proactive** — keep burning |
| a benched copy is on the evolution road | real | **reactive** — Slash, feed the Bench |
| the burn converts a kill | outweighed | Flamethrower |
| the attacker will not see another turn | ~0 | Flamethrower |

### The sweep, and it is the reason this is a conversation rather than a commit

**The obvious guard is "the card owns a non-discarding attack" — the same discriminator the 28 Aug
ammunition rule turns on. Swept across the live sets, it charges FOURTEEN cards to move one:**

| would be charged | | would not |
|---|---|---|
| Ninetales, Arcanine, **Charmeleon**, Charmander, Starmie, Mewtwo, Gastly, Kadabra, **Zapdos**, Magmar, Flareon ×2, Slowpoke, Dark Golduck | | Charizard, base5 Ponyta — the burn is all they have |

**And most of them are not funnel cards at all.** Starmie's and Kadabra's burn is *Recover* — the
discard **is** the healing cost. Mewtwo's is Barrier and Gastly's is Destiny Bond, where it buys a
utility effect. **Zapdos is the dangerous one**: Thunderbolt against Thunder is a shipped invariant
with Trevor's own note behind it and three claim rows on it.

**This is the "fifteen cards before it moved one" finding arriving a second time, in the same file.**
The 28 Aug entry above records exactly this shape and the answer was to nest the condition until it
moved one card. The same discipline applies and the answer is not the same nesting.

### The nesting that would work, and it only became available on 31 Aug

**Charge only when another slot has an actual claim on the Energy** — which `evolutionRoadFor` now
answers, because it names the copy that will arrive. That is derived rather than listed, it encodes
Trevor's own reason (*"not depriving the bench of energy"* means a Bench that **needs** it for a
plan), and it excludes every card in that table whose deck has no road running.

**It is narrow to the point of being nearly card-specific, and that is honest here** — this file
already records that a sustain rule in this pool is a rule about one or two cards, which cuts both
ways: the risk is tiny and the evidence for tuning it is one data point.

**Build it as an experiment and read `claimtest`**, which is the procedure in
[MEASUREMENT.md](../MEASUREMENT.md) run forwards instead of backwards. If Zapdos, Arcanine or
Charizard flip, the term is too wide and the sweep was right.

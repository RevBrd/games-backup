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

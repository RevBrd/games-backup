# Ammo — attacks that eat their own Energy

**Read this before touching the surplus rule in `attachBuild` or `potential`.** An attack that
discards its own Energy to fire turns spare Energy into **rounds**. Energy past the printed cost is
not surplus on these cards; it is how many more times the card gets to act.

**State: built.** Shipped 21 Aug 2026, and it is the largest single move the AI has had. One half
of the note is still open.

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

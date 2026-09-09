# Ammo — attacks that eat their own Energy

**Read this before touching the surplus rule in `attachBuild` or `potential`.** An attack that
discards its own Energy to fire turns spare Energy into **rounds**. Energy past the printed cost is
not surplus on these cards; it is how many more times the card gets to act.

**State: built.** Shipped 21 Aug 2026, and it is the largest single move the AI has had. One half
of the note is still open. **The other side of the same coin — what a discard COSTS when there is no
ammunition behind it — landed 23 Aug 2026 and its rule is below.**

**The dated working for everything closed between 23 and 28 Aug 2026 is in
[AMMO-ARCHIVE-1.md](AMMO-ARCHIVE-1.md).** *[Why a pattern file gets an archive, and the ~350 that
triggers one →](../PLAYBOOK.md)*

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

## What closed between 23 and 28 August 2026, and where the working went

**Ammo's cost side shipped as `discardSilence`** — an attack that burns its own Energy costs **turns
of silence**, squared, discounted by whether the Pokemon lives to feel them, and it reads the
**cheapest** attack rather than the best. The 28 Aug sweep then narrowed the derivation: **a card that
DRAINS and owns a free attack stockpiles nothing**, so headroom is granted only when the burn
outpaces the attachment.

**The full working is in [AMMO-ARCHIVE-1.md](AMMO-ARCHIVE-1.md)** — moved there on 2 Sep 2026 when
this file reached 449 lines. **Three things from it stay here because they are still live:**

- **The cost side and the ammunition side are one term**, not two, and that was the finding rather
  than the fix.
- **The narrowing moved fifteen cards before it moved one**, which is why the derivation is nested
  rather than flat. Do not flatten it.
- **A red claim row localises a fault to a CARD, not to a verb.** Arcanine GP's row was red for two
  days while two sessions hunted a missing term in attack choice; Trevor's answer was that the bot
  was right and the fault was one decision upstream, in what it **attached**.

*[The invariant →](../AI-INVARIANTS/AMMO-SYMBOLS.md)*

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
*[The hedge, and the experiment that found it →](../AI-INVARIANTS/SURVIVES-CHARGE-HEDGE.md)* ·
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

# Walls — cards that go in to be spent

**Read this before touching the retreat case in `scoreAction`, or `promoteValue`.** Some Pokémon
exist to stand in the Active spot and soak until they die. Standing there *is* the job, so their low
damage is not a deficiency and their staying put is not a failure to act.

**State: built.** The derivation and the two retreat fixes shipped 13 and 21 Aug 2026; a wall stopped
having to be a terminal Basic on 3 Sep 2026.
*[What the scorer does about it, and the invariants →](../AI.md)*

## Trevor's notes

Verbatim and append-only. The analysis below them is not.

> **Chansey.** Chansey is a tank. It goes in, uses Scrunch, and stalls while everything else is
> powered up on the bench, ending in a sacrifice. **There are very few circumstances where it would
> ever retreat rather than let itself get killed.** Six Prizes is time you are able to stall for
> before you can power up something strong enough to fight — but leave it too late and you still
> might not dig yourself out of the hole before your opponent gets something else going.
>
> Double Edge is almost never used **unless you get a DCE that could power it up the rest of the way
> in one turn** — then you can land a surprise kamikaze on the attacker, at the cost of the opponent
> going first with the new Pokémon in play.

From the workbook's `Wants` column:

> **Chansey** — Power up Scrunch and then tank
> **Snorlax** — To stall, not attack or retreat
> **Kangaskhan** — To go first/stall while using Fetch. Only rarely wants to use Comet Punch
> **Mr. Mime** — To go against medium-high damage pokemon w/ no attacks 20 dmg or below
> **Flying Pikachu** — To stall as long as possible
> **Lickitung** — An opening role

**Kangaskhan's second sentence is a wall note, not an attack-choice one** — Trevor, 22 Aug 2026,
correcting where it had been filed. *"Comet Punch is because it's a tank that should only really use
Fetch until it dies."* **The attack preference is a consequence of the card being a wall**, so if the
wall rule is right this needs no rule of its own. That makes Kangaskhan a live check on the wall
work rather than a separate item: if the bot is still reaching for Comet Punch, `wallScore` is not
reaching the attack path the way it reaches the retreat path.

## How the family is detected

**Derived rather than tagged** — everything that makes a card a wall is already in the card data, so
a tag would be a fact re-typed 1,251 times. Three signals over Basics: HP above 50, retreat cost, and
a utility attack matched by verb through `STALL_VERBS`.

**It is asked in two places and they are not interchangeable.** `wallShape` is the three signals
alone. `wallScore` is the CARD property — `wallShape` for a terminal Basic, zero for anything else —
and it is what `powertest.js` pins. **`AI.wallHere(pi, slot)` is what the scorer calls**, and it is
`wallShape` scaled by how dead this slot's evolution road is. Read the comment blocks above all three
before changing any of them; the reasoning for each is there and not in this paragraph.

**37 of 257 printings score above zero** as of 21 Aug 2026. Run it rather than quoting that.

## What the notes bought

**The tempo term compared best affordable printed damage, and a wall's is zero** — so every benched
Pokémon read as an upgrade, every turn. The positive half of that delta is suppressed by `wallScore`
now, **asymmetrically on purpose**: swapping a wall out for something *weaker* is still a real loss
at full price. It is only *"I could be hitting harder"* that stops being a reason.

**And the Energy a retreat burns is now priced at the rate the rescue values it.** That came out of
the second half of the Chansey note and changed every retreat in the game, not one card's — *you may
attach one Energy per turn, so an Energy is a turn.*

Measured together on the ladder decks: retreats **7.1 → 6.0 per 100 turns**, Energy burned on retreat
**8.2 → 6.1**. *[The invariants both left →](../AI.md)*

**A non-terminal Basic CAN be a wall now — built 3 Sep 2026.** `wallScore` refused every Basic with
an evolution, so Rhyhorn — the archetypal example of the behaviour — scored zero. `AI.wallHere` scales
the shape by `1 - roadLive`, where the road is live if the evolution is in hand (certain), half-live
if it is in the deck (a hope) and dead otherwise. **The old terminal gate is derived rather than
removed**: a terminal Basic is a card whose road is permanently dead, and `powertest.js` asserts the
two agree exactly across the whole pool.
*[The entry, including what is a guess →](../AI-INVARIANTS/WALL-ROAD-LIVE.md)*

**Two sources asked for it and neither knew about the other.** Trevor's workbook note predates his
first GBC 2 session: *"Leer is the primary as it turns Rhyhorn into a very good staller. Horn Attack
should only be powered up **if it's planning to evolve**."* The conditional is the rule.

**Read the size honestly: 26.5% of games diverge, and it is a broad nudge rather than one card.**
Every non-terminal Basic without its evolution in hand gains a little wall-ness — Squirtle 0.15,
Machop 0.10 — against Rhyhorn's 0.70. **And on Rhyhorn the decision does not flip**, because its
retreat cost of 3 is a −21 penalty consulted first; wall-ness moved the price (−13.50 in hand,
−15.43 in deck, −17.35 nowhere) and not the choice.

## Open

**A wall does not prefer its stalling attack, and this is the other half of both Rhyhorn notes.**
Measured 3 Sep 2026 on a board where wall-ness is 0.70: **Leer scores 11.70 and Horn Attack 30.00**,
and the bot takes Horn Attack — identically whether the road is dead or a Rhydon is sitting in hand.
`scoreAttack` never consults wall-ness at all.

That is Trevor's *"Leer is the primary"*, and the GBC 2 bullet's *"which cheap moves from those cards
it can hide behind… never powering up Horn Attack"* — **one clause, two sources, and it now has the
term it was missing.** `wallHere` exists; nothing in the attack path reads it. Note the second half is
a different decision again: not *which attack* but *whether to attach toward the big one*, which is
`attachBuild`'s question rather than `scoreAttack`'s.

**A wall whose wall-ness is a POWER is still invisible to the derivation.** `wallShape` reads attack
verbs only, so **Mr. Mime scores 0.100** — the lowest of every card Trevor has named as a wall, and
below Jynx — because Invisible Wall is a Pokémon Power and nothing in `STALL_VERBS` can see it.
Trevor's note describes it doing exactly the wall job, against exactly the opponents the Power is good
against. Verified 21 Aug 2026 by running the derivation over the pool. **This is the one clean miss
the `Wants` column found in a system that was already built**, and it generalises: any card whose job
is done by a passive rather than by an attack is unreadable here.

**Chansey scores 0.800, below Snorlax, Kangaskhan and Lickitung at 0.900**, because its retreat cost
is 1.

**The kamikaze half of the Chansey note is not here.** *"Double Edge unless a DCE finishes it in one
turn"* is kamikaze timing, which is its own pattern and is not yet written. Filed as a pointer rather
than a copy, per [PLAYBOOK.md](../PLAYBOOK.md). The related finding — that `potential`'s `short` pins
at zero once any attack is payable, so the bot can never walk a Chansey up to Double-edge — is
**correct behaviour here and wrong elsewhere**; it belongs to over-attaching, also unwritten.

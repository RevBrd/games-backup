# Over-Attach — cards that want Energy past the printed cost

**Read this before touching `slotPrintedDamage`, or the printed-damage fallback anywhere in
`ai.js`.** An Over-Attach card's damage is a *function of the Energy attached to it*, so the number
printed on the card is not what the attack does. Energy past the cost is not surplus on these cards;
it is damage.

**State: built.** Shipped 31 Aug 2026, Job 14b. **The largest pattern named in the two sets that had
never been claimed against** — nine mentions across Jungle and Fossil, sixteen printings across the
live pool, and every one of them mispriced on the Bench since Base Set.

**It is the neighbour of [Ammo](AMMO.md) and they are not the same rule.** Ammo is about an attack
that *eats* its Energy, where a spare buys another **round**. Over-Attach is about an attack that
*reads* its Energy, where a spare buys **damage** and nothing is ever spent. Charizard is the first;
Lapras is the second. They share a symptom — "the surplus rule refuses the fourth Energy" — and have
completely different causes, which is worth knowing before anyone tries to unify them.

## Trevor's notes

Verbatim and append-only. Ten cards across all four live sets; the family is not a Fossil quirk.

> **Vaporeon.** Water Gun asks to Over-Attach two extra energies for extra damage, and should be seen
> as the primary attack. Quick Attack has two use cases: When Water Gun can't be afforded, and when
> Vaporeon is played in a non-water deck.
>
> **Exeggutor.** To Over-Attach for Big Eggsplosion by as many energies as it can (unless about to
> die and the bot weighs a bench powerup's future benefit higher than an additional coin flip for Big
> Eggsplosion). … Teleport is rarely beneficial, as it's usually better to try for high damage with
> Big Eggsplosion even if it risks death on the next turn.
>
> **Lapras.** To Over-Attach energy for Water Gun, which is used as the primary attack. … Performs
> the function of a tank but fully invests in its attacks, unlike most other tanks, which is why it's
> not labeled as one.
>
> **Omastar.** Water Gun asks for an Over-Attach of up to two additional energies. As long as the bot
> can do that freely and purposefully, it should handle this card fine.
>
> **Seadra.** Water Gun asks for an Over-Attach in the same pattern as Omastar. Normal Attack Choice
> decisions after that, with Agility's potential damage denial being preferred unless Water Gun's
> added damage can kill or cost fewer turns to get to a kill.
>
> **Omanyte.** To Over-Attach two additional energies, though it prefers to stay on the bench and
> evolve.
>
> **Blastoise.** 5-ish extra W energy in deck, Over-Attach 2 extra energy for Hydro Pump's max
> potential, which is worth it. Loves to fight.
>
> **Poliwrath.** …Water Gun can be Over-Attached into doing higher damage. Water Gun should be used
> when it results in a kill that Whirlpool wouldn't, and the bot should be willing to add that fifth
> energy to do so.
>
> **Dark Blastoise.** Hydrocannon wants Over-attach. Attack Choice between that and Rocket Tackle
> once powered up enough.
>
> **Dark Charizard.** Wants Coin Luck for Continuous Fireball, and to Over-Attach as many energies as
> possible (though maybe not more than 8 or so) for additional chances at Coin Luck.

**Two more notes use the word and are NOT this pattern.** One note, one home:

- **Mysterious Fossil** — *"its preferred spot is the bench, where it's Over-Attached with energy
  needed for its eventual evolution"*. That is the evolution road, not damage scaling; it belongs to
  [Evolution timing](EVOLUTION-TIMING.md) and `evolutionRoadFor` already owns it.
- **Charmeleon** — *"pre-Over-Attach energies for an evolution to Charizard"*. Same thing, and it is
  [AI.md](../AI.md)'s open item 9(c), the attach-toward-a-card-not-in-play half.

**And one is this pattern through a mechanism the fix does not reach** — see *Still open* below.

## How the family is detected

**Two verbs, and the derivation is that the damage moves when you attach.**

| Verb | Cards | What a spare buys |
|---|---|---|
| `DMG_PER_SPARE_ENERGY` | thirteen printings — every Water Gun, Hydro Pump, Hydrocannon | +`per` damage, capped by `maxSpare` |
| `DMG_PER_ENERGY_HEADS` | three — Big Eggsplosion, Continuous Fireball | another coin, so `per / 2` expected, **uncapped** |

**No card is named anywhere in the code.** `slotPrintedDamage` walks the effect script and asks
whether either verb is present; every other attack in the game returns `aiParseDamage` exactly as
before, so the blast radius is these sixteen printings by construction. The other damage-scaling
verbs — `DMG_PER_OWN_BENCH`, `DMG_PER_COUNTER_SELF`, `DMG_PER_HEAD`, `DMG_PER_NAMED_IN_PLAY` — are
deliberately excluded: they read the bench, the damage counters or a coin, and **no attachment
changes any of them**, so including them would price a decision they cannot affect.

**The cap comes off the card, never off a number somebody picked.** Trevor's notes say "up to two
additional energies" for Omastar and "as many as it can" for Exeggutor, and the code contains
neither figure — the first is `maxSpare: 2` transcribed from the printed text, the second is the
absence of one. That is what makes Exeggutor a control rather than an exception.

## What the note bought

**Three faults, and only the first is the one the notes were about.**

### 1. The Bench could not see its own scaling

`potentialOf` prices a benched Pokemon at printed damage, `aiParseDamage("10+")` is 10, so an
attachment that grew Water Gun by 10 moved `best` from 10 to 10 — `noProgress`, and the surplus rule
in `attachBuild` refused it. Measured on a Lapras holding one Water with a Water Energy in hand:

| | before | after |
|---|---|---|
| Lapras **Active**, second Water | 23.04 | 23.04 — always worked |
| Lapras **benched**, second Water | **−2.00** | **+18.50** |
| Lapras benched at its printed cap, fourth Water | −2.00 | **−2.00** — unchanged, and now for a reason |

**The family lives on the Bench**, which is what makes this the whole pattern rather than an edge:
Omanyte *"prefers to stay on the bench and evolve"*, Vaporeon and Blastoise are built there, and the
one slot that worked is the one the notes talk about least.

**This is NOT [AI.md](../AI.md)'s open item 1 and that item is untouched.** That one is about a
benched Pokemon having no way to say *"I could take a Prize"* — expected value off the Active slot,
a real refactor. This was the **raw-damage currency being wrong about itself**, which is a fact, not
a unit. Fixing a wrong fact does not need the currencies unified. *(The `KNOWN GAP` test in
`powertest.js` that named this case has been flipped rather than deleted, and its comment says so.)*

### 2. `maxSpare` had never reached the scorer — eleven weeks

The engine learned the cap in Job 6, for the Jungle and Fossil Water Guns. `rawOutcomes` kept its own
copy of the arithmetic and never did, so **the AI valued a Lapras on five Water at 50 where the card,
the printed text and the engine all say 30.**

**That is #28's finding for the fifth time** — *one verb, two implementations, in two modules, with
nothing asserting they agree* — and this one had a cheap guard available, which #28 doubted. For a
verb whose damage is a pure function of the attacker's own board, the engine can simply be made to
**resolve the attack** and the two numbers compared. `powertest.js` now sweeps every
`DMG_PER_SPARE_ENERGY` printing in the pool at five Energy counts each and names the card when they
disagree. It was watched failing on Poliwrath before being trusted.

**The arithmetic is now in one place**, `spareEnergyDamage`, called by both halves of `ai.js`. A
sixth divergence of this shape cannot happen to this verb.

### 3. Three Base Set cards printed a cap the engine did not have

**Blastoise, Poliwrath and Poliwag** all read *"Extra Water Energy after the 2nd doesn't count"* and
all three carried no `maxSpare` at all. They were written in Job 4b, **before** Job 6 added the
parameter for the cards that needed it, and nobody went back — so the three oldest cards carrying the
verb were the three the engine over-paid. A Blastoise under Rain Dance, which can dump a whole hand
of Water onto itself, was the worst case: every card of it added 10.

**Agreement is not correctness and the guard above cannot see this** — two halves wrong the same way
pass it, which is exactly what was happening. So there is a **second** guard, and it reads the
printed text rather than either implementation: any attack whose text matches *"after the Nth doesn't
count"* or *"can't add more than N damage"* must carry a `maxSpare`. Both wordings are the same rule,
one capping the count and one capping the bonus.

### 4. The clause itself was wrong, in both halves at once

**Found by writing a claim straight off Trevor's Poliwrath note and watching it go red.**
`DMG_PER_SPARE_ENERGY` counted only the cost's **typed** symbols, so a Water paying a **Colorless**
was never marked as used — Water Gun is `WWC`, four Water pay it with three cards and leave one
spare, and the engine called two of them spare.

**Neither half of the game could see it**, because both halves were wrong the same way and the
agreement guard above passes on a shared mistake. What saw it was the printed card, and what pointed
at the card was Trevor's own sentence: *"the bot should be willing to add that fifth energy"* is only
true under the card's arithmetic. Under the engine's, a Poliwrath on four Water was already at the
cap and the fifth Energy was worth nothing — so the bot's refusal was correct and the **engine** was
the fault. *[The ruling, including who chooses which Energy pays the Colorless →](../Rulings/SPARE-ENERGY-PAYS-COLORLESS.md)*

Six live printings moved: Poliwrath, both Vaporeons, Omastar, Seadra, Psyduck. The cards whose costs
are typed all the way through — Blastoise, Lapras, Omanyte, Poliwag, both Dark Blastoises — are
unchanged and are the control.

## Where the claims are

`tools/claims/base2.js` and `tools/claims/base3.js` — **both files were created for this pattern and
were the first claims ever written against Jungle and Fossil.** Ten rows, of which four are controls,
and the controls are the point: without them, a `slotPrintedDamage` that ignored the cap entirely
would pass every positive row in both files.

| Control | What it stops |
|---|---|
| Lapras refused a fourth Water | "always feed a Water Pokemon" |
| Omastar refused a fifth | the cap being a number somebody chose |
| Vaporeon refused a sixth | the same, at a different cost |
| Poliwag's surplus Grass still held (`powertest.js`) | the surplus rule being switched off rather than informed |

## Still open

**Omastar takes one of its two spares and refuses the other, and the cause is the OTHER attack.**
Spike Cannon prints "30×" and `aiParseDamage` reads 30, so at two Water the slot's `best` is already
30 and the third Water brings Water Gun **level** with it rather than past it — `noProgress`, and the
surplus rule refuses. The fourth is taken normally.

**A guaranteed 30 and a coin-flip 30 are equal in the printed-damage currency, and they are not
equal.** That is [AI.md](../AI.md)'s open item 1 — the Active/Bench unit split — showing up as a
single card, and it is the cheapest statement of that item in the tree. **Deliberately not fixed
here**: this pattern's whole discipline was correcting a wrong *fact* without touching the *unit*,
and closing it the other way round would have hidden the item rather than solved it. Red row with the
diagnosis in `tools/claims/base3.js`.

**Dark Gyarados is in this family through a Pokémon Power, and nothing here reaches it.** Trevor:
*"It also has the potential to Over-Attach energies to deal even more potential damage upon death,
with the aim of being just enough to take its attacker with it. However, the 50/50 chance should make
this a secondary investment, with the primary investment still being readying the bench."* That is an
`ON_KO` trigger whose damage scales with attached Energy, and `slotPrintedDamage` prices *attacks*.
**The note also contains its own priority ordering**, which is a board-level judgement of the kind
[Ammo](AMMO.md) has been waiting on since 26 August — so this is probably not a small row.

**Dark Charizard's "maybe not more than 8 or so" is unbuilt and deliberately so.** Continuous Fireball
is uncapped, so the scorer will keep feeding it forever, and Trevor's parenthesis is the only thing
saying where to stop. It is a soft ceiling on a coin count rather than a printed rule, and inventing
a threshold is what this pattern's whole derivation avoids. **Ask him what the 8 is doing** before
building anything — the honest reading may be that it is a *deckbuild* want rather than a play one.

**Exeggutor's dying clause is untested.** *"Unless about to die and the bot weighs a bench powerup's
future benefit higher than an additional coin flip"* is the board-level opportunity cost again, and
it is the same capability [Ammo](AMMO.md) and [Evolution timing](EVOLUTION-TIMING.md) both name. Not
written as an `open:` row because it is theirs rather than this file's; if that capability lands, it
lands once.

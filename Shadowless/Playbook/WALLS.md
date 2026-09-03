# Walls — cards that go in to be spent

**Read this before touching the retreat case in `scoreAction`, or `promoteValue`.** Some Pokémon
exist to stand in the Active spot and soak until they die. Standing there *is* the job, so their low
damage is not a deficiency and their staying put is not a failure to act.

**State: built.** The derivation and the two retreat fixes shipped 13 and 21 Aug 2026.
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

**`wallScore` in `ai.js`, and it is derived rather than tagged** — everything that makes a card a wall
is already in the card data, so a tag would be a fact re-typed 1,251 times. Three signals over
**terminal Basics only**: HP above 50, retreat cost, and a utility attack matched by verb through
`STALL_VERBS`. The full reasoning, including why *terminal* and not *cannot evolve further*, is the
comment block above the function — read that, not this paragraph, before changing it.

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

## Open

**A wall whose wall-ness is a POWER is invisible to the derivation.** `wallScore` reads attack verbs
only, so **Mr. Mime scores 0.100** — the lowest of every card Trevor has named as a wall, and below
Jynx — because Invisible Wall is a Pokémon Power and nothing in `STALL_VERBS` can see it. Trevor's
note describes it doing exactly the wall job, against exactly the opponents the Power is good against.
Verified 21 Aug 2026 by running `wallScore` over the pool. **This is the one clean miss the `Wants`
column found in a system that was already built**, and it generalises: any card whose job is done by
a passive rather than by an attack is currently unreadable to this derivation.

**A non-terminal Basic cannot be a wall, and the GBC sequel says that is wrong — 3 Sep 2026.**
Trevor, watching it: *"Rhyhorn is the example here, being brought in just to use Leer as long as it
can and be thrown away, on purpose, because the AI needed to buy time for the bench, never powering
up Horn Attack."*

**Half of that was a drift between two lists and is fixed.** `scoreAttack` prices `CANT_ATTACK_ON_FLIP`
at half a paralysis through `flags.lockAttack`, while `STALL_VERBS` did not list it at all — so the
bot knew Leer denies a turn and `wallScore` said Leer was not a stalling move. The verb is in the list
now, and **`selftest.js` asserts the two cannot drift apart again**: every verb the scorer prices
through a denial-or-protection flag must be in `STALL_VERBS` or on `NOT_A_JOB` with a reason. Both
checks were watched going red before being trusted.

**The other half is unbuilt, and on its own the fix above changes nothing.** `wallScore` gates on
**terminal** Basics before it ever consults the verb list, and Rhyhorn evolves into Rhydon — so it
still scores 0. Measured across the whole live pool:

- **34 non-terminal Basics carry a stall attack** and are invisible to the derivation, against 17
  terminal ones that are scored.
- **Exactly one of them would score as a meaningful wall**: Rhyhorn at 0.70, which is Onix's and
  Lapras's score. The next best is Jigglypuff at 0.40, and the rest are 30–50 HP Basics that would
  land near 0.30 whatever happened.

**So the question is worth one card today, and it is not a one-card question.** The recorded reason
for the terminal gate is *"'cannot evolve further' would call Charizard a wall and a Stage 2 is three
cards you badly want to rescue"* — but `stage === 'Basic'` already excludes Charizard. What the second
condition actually buys is that a Squirtle you intend to evolve is not treated as disposable, **and
that is a fact about the board rather than about the card.** `wallScore` is memoised per card by
design, so it cannot express it.

**It is the same mechanism Trevor's Charmeleon clause wants** — *"a Charmeleon that ends up fighting
and having to use Flamethrower should almost be written off for evolution and used only as a fodder
attacker"* — and he has already said that one should be a **discount rather than a hard stop**, to
keep it tunable. Two notes, one build: *a card's wall-ness rises as its evolution stops being live.*
The machinery that knows whether a road is live already exists in `evolutionRoadFor`. **Build it once
for both, or not at all** — a wall carve-out for one Rhyhorn would be the special-casing
[PLAYBOOK.md](../PLAYBOOK.md) warns about.

**Chansey scores 0.800, below Snorlax, Kangaskhan and Lickitung at 0.900**, because its retreat cost
is 1. That is defensible — a cheap retreat genuinely does make a card easier to walk away from — but
the archetypal wall ranking fourth is worth knowing before you tune the weights.

**The kamikaze half of the Chansey note is not here.** *"Double Edge unless a DCE finishes it in one
turn"* is kamikaze timing, which is its own pattern and is not yet written. Filed as a pointer rather
than a copy, per [PLAYBOOK.md](../PLAYBOOK.md). The related finding — that `potential`'s `short` pins
at zero once any attack is payable, so the bot can never walk a Chansey up to Double-edge — is
**correct behaviour here and wrong elsewhere**; it belongs to over-attaching, also unwritten.

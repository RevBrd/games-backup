# Attack choice — the small attack is usually right

**Read this before touching how `scoreAttack` picks between two legal attacks.** Across four sets,
the most common thing Trevor says about a card is *which of its two attacks it should actually use* —
and the answer is almost always **the cheap utility one**, with the big one gated on lethal.

**State: unmeasured, and it should already be derivable.** Expected value over damage plus status is
arithmetic this scorer claims to do, so **this is a test of the scorer rather than knowledge it
lacks.** If it comes out wrong, the fix is in how status and tempo are priced — never in a per-card
branch.

**This is the largest cluster in the workbook: eleven cards say some version of it.** That is what
makes it worth measuring rather than assuming. One card behaving oddly is an anecdote; eleven cards
describing the same preference is a claim about a whole term.

## Trevor's notes

Verbatim and append-only.

> **Dewgong, and choosing between two attacks.** Dewgong uses **Aurora Beam** if its 50 is enough to
> kill outright, and **Ice Beam** if it is not — because even though Ice Beam does 30 and costs more,
> its coin flip can paralyse, which buys a turn and may let Aurora Beam finish the job next turn.

From the workbook's `Wants` column:

> **Fearow** — To use Agility unless Drill Peck can kill
> **Seadra** — To hide behind Agility until Water Gun will kill
> **Rapidash** — To use Agility whenever possible
> **Cloyster** — To mainly use Clamp
> **Marowak** — To use Bonemerang primarily
> **Venonat** — To use Stun Spore primarily
> **Paras** — To use Scratch instead of Spore in most cases
> **Grimer** — To almost never use Minimize
> **Kangaskhan** — Only rarely wants to use Comet Punch
> **Arcanine GP** — To use Quick Attack until about to die, then use Flames of Rage for high damage

## The shape underneath them

They are not all the same rule, and separating them is most of the job:

**Gated on lethal.** Dewgong, Fearow, Seadra. *Use the small one until the big one kills.* This is the
purest form and the easiest to assert — it is a claim that a knockout should dominate, which
`scoreAttack` already believes, so if it fails the fault is that the small attack's status or tempo
value is **under**-priced, not that damage is.

**A standing preference with no stated trigger.** Rapidash, Cloyster, Marowak, Venonat, Paras,
Kangaskhan. *Mostly use this one.* These need the `because` asked for before anything is built —
[PLAYTEST.md](../PLAYTEST.md)'s rule for a note that is a preference rather than a prohibition. A
preference is not testable in one position; the trigger behind it is.

**A prohibition, which is the most valuable kind.** Grimer — *almost never use Minimize.* One
position proves or disproves it.

**Inverted: the big attack is the endgame.** Arcanine GP — *Quick Attack until about to die, then
Flames of Rage.* This is the same card reading its own HP as a signal, which is
damage-scaling-attacker territory and probably files there instead once that pattern is written.

## How to measure it

**Do not duel this.** It is symmetric between the two seats and it is about what the bot can perceive
— `aiduel.js` is blind to both and will report ~50%.
*[Why, and every other way measurement here has lied →](../MEASUREMENT.md)*

**Build the position and assert it in `powertest.js`.** For each of the three lethal-gated cards, two
boards: one where the big attack kills and one where it does not. That is six assertions and it
settles whether there is a fault at all before anybody prices anything.

**Start with Dewgong**, because it is the one Trevor wrote out in full with the reasoning attached,
and because both of its attacks are plain damage-plus-status with no other machinery in the way.

## Open

Everything. Nothing here has been reproduced yet, and per [PLAYTEST.md](../PLAYTEST.md) that means
nobody yet knows what this is.

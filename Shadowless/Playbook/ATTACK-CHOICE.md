# Attack choice — the small attack is usually right

**Read this before touching how `scoreAttack` picks between two legal attacks.** Across four sets,
the most common thing Trevor says about a card is *which of its two attacks it should actually use* —
and the answer is almost always **the cheap utility one**, with the big one gated on lethal.

**State: measured 22 Aug 2026. Two faults found and fixed; the central one is open and is a design
question.** It was a test of the scorer rather than knowledge it lacked, exactly as predicted — and
the scorer failed it in two ways nobody had guessed and passed the third by accident.

**This is the largest cluster in the workbook: eleven cards say some version of it.** That is what
made it worth measuring rather than assuming. One card behaving oddly is an anecdote; eleven cards
describing the same preference is a claim about a whole term.

## The unification — Trevor's, 22 Aug 2026, and it is the key to the whole cluster

> Agility is the same shape [as Ice Beam] because instead of inflicting paralysis, it has a 50/50
> chance of preventing all damage to the attacker on the next turn.

**Paralysis and a barrier are the same currency: a bought turn.** One buys it by taking their turn
away, the other by making it not matter. That is one claim covering Dewgong, Gyarados, Fearow,
Rapidash and Seadra — five cards, two verbs, one idea — and **the scorer priced the two through
entirely separate paths with no relationship between them**, which is why the family behaved
inconsistently.

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

**A standing preference with no stated trigger.** Cloyster, Marowak, Venonat, Paras. *Mostly use this
one.* These need the `because` asked for before anything is built — [PLAYTEST.md](../PLAYTEST.md)'s
rule for a note that is a preference rather than a prohibition. A preference is not testable in one
position; the trigger behind it is.

**Two of that group turned out not to belong here at all**, which is why the `because` gets asked.
**Rapidash** is the Agility shape above, not a preference — Trevor, 22 Aug. And **Kangaskhan's
*rarely Comet Punch*** is not attack choice in any form: it is a wall that should use Fetch until it
dies, so the note files under [Walls](WALLS.md) and the attack preference falls out of that rather
than needing a rule. **A note that looks like this pattern and belongs to another one is the normal
case, not the exception.**

**A prohibition, which is the most valuable kind.** Grimer — *almost never use Minimize.* One
position proves or disproves it.

**Inverted: the big attack is the endgame.** Arcanine GP — *Quick Attack until about to die, then
Flames of Rage.* This is the same card reading its own HP as a signal, which is
damage-scaling-attacker territory and probably files there instead once that pattern is written.

## What the measurement found

Constructed boards, both attacks affordable, nothing else on the field.

| Board | Was | Verdict |
|---|---|---|
| Dewgong, Aurora Beam **not** lethal | Aurora Beam 50.00 vs Ice Beam 43.00 | **fault, still open** |
| Dewgong, Aurora Beam lethal | Aurora Beam 280 | correct |
| Gyarados, Dragon Rage **not** lethal | Bubblebeam 53.00 vs Dragon Rage 50.00 | correct — **by accident** |
| Gyarados, Dragon Rage lethal | Bubblebeam **293** vs Dragon Rage 280 | **fault, fixed** |
| Fearow, Drill Peck not lethal | Drill Peck 40.00 vs Agility 27.00 | **fault, still open** |
| Fearow, barrier against threat 0 / 30 / 60 | **27.00 / 27.00 / 27.00** | **fault, fixed** |

**Gyarados passing is the most useful row in the table.** It does the right thing only because its
damage gap is 10 and paralysis is a flat 26×0.5 = 13, while Dewgong's gap is 20 and loses to the same
13. **The family's behaviour is an accident of where one constant falls**, not a decision — which is
what a flat weight standing in for a board quantity always produces.

### Fixed: a rider is worth nothing on a Pokémon the attack removes

Gyarados took Bubblebeam over an equally lethal Dragon Rage and paid an extra Water for a coin flip
that could only land on something already gone. Every rider in that block is discounted by `1 -
pLethal` now — proportionally, not switched off. `drag` is the deliberate exception.
*[The invariant →](../AI.md)*

### Fixed: a barrier is worth what it prevents

Agility scored the same whether it was stopping nothing or stopping 60. Cliff instance seven, and the
first one in the table that is **linear rather than squared** — a benefit really is proportional to
the damage prevented, where a cost is not. *[Why, and the coefficient →](../AI.md)*

### Fixed: a bought turn is worth what the opponent would have done with it

**The central one, and it needed Trevor's answer before it could be built.** His note said *Ice Beam
whenever Aurora Beam is not lethal*; pricing a bought turn off the incoming threat says buying a turn
from a Chansey is worthless. Asked rather than guessed, 22 Aug 2026 — **the rule has an unstated
clause and it is *"when there's something to be afraid of"***.

So `paralyze`'s flat 26 now reads the board. **The old constant was the format's measured mean
attack**, which is what a flat weight for a board-dependent thing always is, so dividing by it adds
board sensitivity without retuning anything. Paralysis, Sleep and Confusion scale; **Poison does not**,
because it is damage over time rather than a turn taken away. *[The full invariant →](../AI.md)*

Measured, on one card with one Energy load and no lethal outcome anywhere:

| Dewgong faces | Threat | Picks |
|---|---|---|
| Chansey, no Energy | 0 | Aurora Beam — nothing to buy |
| Hitmonchan, charged | 40 | tie, goes to damage — the true break-even |
| Electabuzz, charged | 80 | **Ice Beam** |
| Zapdos, charged | 200 | **Ice Beam** |
| anything Aurora Beam kills | any | Aurora Beam |

### The other eight, measured 22 Aug 2026

**Five of eight already behaved, and the two that failed were not the two you would guess.**

| Card | Trevor wants | Result |
|---|---|---|
| Rapidash | Agility whenever possible | **passes** — Agility is also its bigger attack |
| Marowak | Bonemerang primarily | **passes** comfortably |
| Venonat | Stun Spore primarily | **passes** |
| Grimer | almost never use Minimize | **passes** at every threat |
| Cloyster | mainly use Clamp | **passes under threat**, prefers Spike Cannon at zero |
| Fearow | Agility unless Drill Peck can kill | **failed** → fixed |
| Seadra | hide behind Agility until Water Gun kills | **failed** → fixed |
| Paras | Scratch instead of Spore in most cases | **disputed** — see below |

**Fearow and Seadra were one cause, and it was not the one this file predicted.** The barrier read the
right quantity after the morning's work; what it did not do was price *dying*. `selfKO` charges 70 for
a Pokémon the bot kills with its own recoil, and preventing that same event paid 16. Fearow took Drill
Peck's 40 over an Agility worth 36 on a board where the incoming attack kills it.
*[The invariant, and why the two halves of a barrier take different curves →](../AI.md)*

**Three of the five that passed were on this file's own suspect list.** That is the argument for
building boards rather than reasoning about them, stated against my own reasoning.

## Open — two questions for Trevor, both needing the *because*

**Paras: is the bot wrong, or is the note?** Scratch does 20; Spore does nothing and applies a
**guaranteed** Sleep. Against a harmless target the bot takes Scratch, as you say. Against something
threatening 80 it takes Spore at 33.8 against Scratch's 20 — and under the bought-turn rule that is
*arithmetically right*: Paras is a 40 HP Basic about to die, and Sleep is the only thing that stops
the attack landing. **Your note says Scratch in most cases and does not say why.** If the reason is
that Sleep is unreliable in a way the weight does not capture, that is a weight; if it is that Paras
is chip damage in a deck that has better answers, that is not a Paras rule at all.

**Cloyster: does "mainly Clamp" hold against something that cannot hurt you?** Clamp is a coin flip
for 30 plus a status; Spike Cannon averages 30 flat. With nothing incoming the bot takes Spike Cannon,
which is honest expected value. Under threat it takes Clamp. **Same clause as Dewgong, and if the
answer is the same the bot is already right.**

Both are the *"standing preference with no stated trigger"* group. Neither is worth a line of code
until the trigger is known.

## Lapras is a different and harder claim

Trevor's Confuse Ray reasoning is not attack choice at all — it is a **path search with an Energy
prior**, and it is worth reading in full before anyone starts on the setup-turn pattern:

> if the defending pokemon is 60 HP at the start, then your best path to killing it is Water Gun 10
> damage -> WG 20 damage (30 total) -> WG 30 damage (60 total). But if the defender is 50 HP, it can
> go WG 10 damage -> Confuse Ray 10 damage (20 total w/ chance at confuse) -> WG 30 damage (50
> total). And part of the math should include the number of energies currently in hand.

**The generalisable rule underneath it: when two paths kill in the same number of turns, take the one
carrying a rider.** The status is free when it costs no tempo. That is a claim no greedy single-turn
scorer can express — measured, Confuse Ray scores a flat 17.50 at one, two and three Energy while
Water Gun scales 10 / 20 / 30, so the bot simply takes the bigger number every time and never notices
both paths reach 50 in three turns.

**The Energy-in-hand half is the capability [AI.md](../AI.md) says does not exist** — nothing in the
scorer reasons about the hand as a resource for a multi-turn plan. It is the same missing piece
[Evolution timing](EVOLUTION-TIMING.md) and [Ammo](AMMO.md)'s Charmeleon half both need. **Three
patterns now want one capability**, which is the strongest argument yet for building it.

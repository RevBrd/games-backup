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

## Open — and this is the real one

**A bought turn is currently a constant, and it should be a board quantity.** `paralyze` is 26 and
`shieldSelf` is 20 no matter what the opponent could have done with the turn you took away. Against a
Chansey doing nothing it is worth nothing; against a charged Charizard it is worth 100. The barrier
half now reads `incomingThreat` — **the paralysis half still does not**, and that asymmetry is exactly
the shape [AI.md](../AI.md) warns about: *check any decision that reads status for one branch and not
its siblings.*

**The question that has to be answered before this is built, and it is Trevor's:** does Dewgong want
Ice Beam against a target that cannot hurt it? His note says use Ice Beam whenever Aurora Beam is not
lethal. Pricing a bought turn off the incoming threat says buying a turn from a Chansey is worthless
and Aurora Beam's 50 is right. **Both readings are defensible and they disagree on a real board.**
Do not guess it.

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

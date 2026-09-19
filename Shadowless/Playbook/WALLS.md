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

**18 Sep 2026, asked whether a wall should retreat to bring up something that can take a Prize** —
the question arose while `slotKOChance` was being wired into `promoteValue`:

> **I wouldn't retreat a wall to bring up a killer unless the opponent was low on prizes.**
>
> A tank isn't really built to attack even if it has an attack move. Sending Chansey in for a quick
> kill also gets 80 recoil damage, so Chansey's dead on the following turn and both players are 1
> prize better off with nothing else really gained. The exception might be if it kamikazes a very
> strong pokemon to ruin the other player's large active threat.

**Shown a board where the rule fired anyway — Chansey walling on one Energy, a charged Hitmonchan
benched, their Active on 20 HP — he gave the reason, and the reason is not about walls at all:**

> In most cases (assuming not later in the game and an opponent low on prizes), it's usually better
> to still buy time (but probably some variance depending on what it's buying), and the reason is
> worth explaining. The question becomes what is beyond the Hitmonchan and what is beyond the
> opponent's pokemon? If it's just the Chansey and Hitmonchan and the opponent has a few bench
> pokemon regardless of powerup (since we're looking a few turns out and things can be powered or
> evolved in that time), then you risk losing the Hitmonchan afterward and be at risk of having
> nothing to go to. The better option is often to keep stalling, draw more cards, and try to get
> something even stronger ready on the bench. You don't have to worry too much about the
> Charizard/Blastoise example from one of the AI.md items if you have two Blastoises, and a deep
> bench once all the actual blows start landing can be a big asset. If the opponent is low on bench
> pokemon (maybe one unpowered/underpowered one) and knocking out the Chansey might realistically
> lead to winning by leaving the opponent with no pokemon remaining rather than prize-out or
> deck-out.

**19 Sep 2026, on how the wall eventually gets powered** — offered as planning rather than a work
order:

> I think they just made it hard for Chansey to retreat, that way the bench built up naturally behind
> it. If Chansey somehow survived a really long time, like if the opponent also had a Chansey or
> something, it would eventually power up Chansey as the last pokemon once all or most others had
> already been powered. Then Chansey naturally gets Double-Edge in a couple turns and even if it's
> taken out itself after, the entire reason it was able to finish getting powered was the bench is
> deep.
>
> The thing we'd have to guard for is the bot powering it beyond Scrunch in the early game when it
> might be better to save those energies for future bench pokemon/evolutions you haven't drawn yet
> and not take yourself out with Double-Edge when you have nothing to replace it with.

**Both guards he names are already built, and the third clause is not.** `wallPlanFloor` holds a wall
back from charging toward its big attack at all — its comment names Chansey and Kangaskhan as exactly
the two cards it catches — and `scoreAttack` prices a self-Knock Out that empties our board at
`lastPrize` rather than `selfKO`, so Double-edge with nothing behind it is a 240-point mistake rather
than a 70-point one. **What is missing is the eventual release**: the gate is fixed, so Chansey is
refused on turn 3 and on turn 30 alike and never arrives at Double-edge at all.
*[The open item, and why the denominator matters more than a turn number →](../AI.md)*

**Both halves are the same claim measured from different ends, and neither is new — they sharpen the
Chansey note above.** *"Very few circumstances where it would ever retreat"* now has its circumstance:
**the opponent being close to winning.** And the Double Edge clause gains its condition: a kamikaze is
worth it when what it kills is worth more than the wall.

**The first half is implementable with arithmetic that already exists and the second is not.**
`retreatPrize` already prices "they are close to winning" as 60 over the *square* of the Prizes they
still need — 1.7 at six left, 60 at one — so the wall suppression lifting as their pile empties is
that curve, not a new threshold. The kamikaze clause needs the value of *their* body, which is the
quantity `AI.md` item 1 has never had.

**The second half also found a live fault the day it was said.** `slotKOChance` shipped that morning
crediting a benched Chansey on 60 HP a full 1.00 chance of a Prize through an attack that kills it.
*[The fix, and the sweep that missed it →](../AI-INVARIANTS/SLOT-KO-CHANCE.md)*

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

**AND THE STALLING BEHAVIOUR ALREADY WORKS — verified 3 Sep 2026, so do not build a veto for it.**
Trevor proposed one: *"the rule that makes the bot only evolve when the minimum useful attack can be
powered up to on the same turn. That right there would provide the Rhyhorn evolution gate we need."*

**That rule exists and it is firing.** It shipped 28 Aug as `roadWant` against `evolveEarly`, and it
is Trevor's own earlier sentence — *"one energy away from being able to use the evolution's cheapest
attack"* — which is the same rule, since you attach one Energy a turn. Evolving Rhyhorn with a Rhydon
in hand scores **19.50 at zero Energy, 27.50 at one, 35.50 at two and above**, the penalty falling
away exactly at `destShort - 1`. It is a **penalty rather than a veto** on purpose, citing his word
*"usually"*.

**A veto would not have produced the behaviour he described anyway, and that is the part worth
keeping.** *"Spamming Leer at 1 energy"* is a claim about what gets ATTACHED. The evolve gate does not
decide that; the road does. Measured on one board, a 1-Energy Rhyhorn beside a Hitmonchan one short of
Special Punch:

| | attach to Rhyhorn | attach to the Bench | bot feeds |
|---|---|---|---|
| Rhydon **in hand** | **38.00** | 28.50 | Rhyhorn — correct, it is about to evolve |
| Rhydon **not in hand** | 8.40 | **28.50** | **the Bench** — which is the note |

**The second row is exactly what Trevor is asking for, and it has been there since `roadWant`
landed.** With no Rhydon in hand there is no road, so nothing bids the Energy toward Rhyhorn, and it
stands at one Energy using Leer — its only legal attack below three — while the Bench powers up. With
a Rhydon in hand, feeding it is right, and his own *"if a Rhydon just happens to show up in its hand
the next turn, the bot should be willing to evolve it"* is satisfied by the same term rather than
despite it.

**The general lesson is the one this session kept re-learning: measure the behaviour before building
the mechanism.** Two rules were proposed here, both reasonable, and the board already did the thing.

## Open

**~~A wall does not prefer its stalling attack.~~ THAT ITEM WAS WRONG AND IT WAS MINE — corrected
3 Sep 2026, same day it was written.** It said Rhyhorn takes Horn Attack over Leer at wall-ness 0.70
and called that a fault. **There is no board on which it is one:**

| Rhyhorn's Energy | legal attacks | bot |
|---|---|---|
| 1–2 | **Leer only** — Horn Attack is `FCC` | Leer |
| 3+ | Leer, Horn Attack | Horn Attack |

Trevor, 3 Sep: *"if both attacks are available at the same time, then the bot is correct."* Below 3
there is no choice to make, and at 3 there is no fault. **I measured at 3 Energy and read a correct
decision as a broken one** — [PLAYBOOK.md](../PLAYBOOK.md)'s "pick the opponent on purpose" hazard
aimed at my own board instead of at the opponent. The stalling Trevor describes is *"spamming Leer at
1 energy"*, which is a claim about what gets ATTACHED, not about which attack is chosen.

**~~The real version of the item is Kangaskhan.~~ RETIRED THE SAME DAY — 3 Sep 2026, and it is the
second false finding of mine on this page.** I reported that Comet Punch beating Fetch 40.00 to 4.91
against a Chansey it cannot kill was the fault this file had been predicting since 22 Aug. Trevor's
answer retired it in a sentence:

> *"Fetch should almost always ever be the only move even powered up unless there's absolutely
> nowhere else to go with the energy. However if for whatever reason Comet Punch **is** able to be
> used, it should be."*

**The second clause says the attack choice was right.** The gate is the **attach** — a wall should not
be built to four Energy while anything else wants them — and that is a different function from the
one I was measuring.

**And the attach is mostly already right.** Kangaskhan Active against a Chansey, a Hitmonchan benched
one short of Special Punch:

| Kangaskhan's Energy | attach to it | attach to the Bench | bot feeds |
|---|---|---|---|
| 1 | 4.40 | **28.50** | the Bench |
| 2 | 4.40 | **28.50** | the Bench |
| 3 | **42.59** | 28.50 | Kangaskhan |

**Two of three rows are his rule already**, and `wallHere` is not what produces them — the wall simply
has nothing worth charging until one Energy from Comet Punch. **And the third row was put to Trevor and KEPT — 4 Sep 2026.** At three, `attachBuild` sees the
payoff of completing a 4-cost attack and the wall outbids a Bench that wants the card. Whether that
is wrong turns on how it reached three, and *"unless there's absolutely nowhere else to go with the
energy"* is exactly the condition under which reaching three was correct in the first place. Trevor:
*"I'm honestly not sure what GBC does but I like it for us. If you agree, let's keep it."* **Agreed and
settled — the whole Kangaskhan thread is closed, and the card is no longer a live check on anything.**

**The pattern in both of my false findings is the same and worth naming.** I measured the decision
that was easy to reach — which attack — when the note was about the decision upstream of it: what gets
attached. [AI.md](../AI.md) records the same shape from 28 Aug, when Arcanine's row was red for two
days while two sessions looked for a missing term in attack choice and the fault was one decision
earlier. **A red row localises a fault to a card, not to a verb**, and a *note* localises it even less
than that.

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

**THE "ELSEWHERE" WAS FOUND AND FIXED — 5 Sep 2026 — and this paragraph is why the fix has a wall
gate.** The pin closes the road to a bigger attack for **35 terminal cards in the four live sets**,
of which a Fossil Moltres is the plainest: Wildfire costs `R` and deals nothing, so one Fire makes it
look finished and Dive Bomb's 80 was unreachable in every game ever played. The attach rule now reads
`destShort` — distance to an attack *worth arriving for* — rather than `short`.

**Read literally, that rule would charge Chansey to Double-edge**, which is this pattern's own note
(*"power up Scrunch and then tank"*) being overridden by a general fix, and it would be the unbuilt
Kamikaze Timing pattern getting picked up by accident. `W.wallPlanFloor` at 0.5 is the gate, and the
split lands exactly where this file already put it: **Chansey 0.80 and Kangaskhan 0.90 are held; the
nearest cards on the other side are Moltres and Hitmonchan at 0.40.** Both held cards are named as
walls in Trevor's own workbook, which is the corroboration rather than a tuned threshold.

**So the sentence above is now load-bearing in a way it was not when written**: it is the reason a
general rule about feeding Pokémon has an exception shaped like this file.
*[The invariant →](../AI-INVARIANTS/ATTACK-ROAD.md)*

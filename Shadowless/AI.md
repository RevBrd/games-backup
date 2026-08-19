# Shadowless — the opponent AI

Depth behind the AI row in `CLAUDE.md`'s status table. **Read this before changing anything in
`src/ai.js`** — how the bot scores, where it can fail without anything going red, and the invariant
each shipped change left behind.

**Before you believe a number that says the bot got better, read [MEASUREMENT.md](MEASUREMENT.md)
instead.** That is the other half of this file: the three instruments, the seven ways they have lied, how
to read a saved match log, and the standing figures. **Nothing here tells you whether a change
worked.** If you are holding a duel result, a playtest report or a match log, you want that file.

The one-line summary: **the AI is an expected-value scorer over enumerated coin-flip outcomes, and
its one structural weakness is that a verb it cannot score costs nothing at runtime and is misplayed
forever.**

**This file is the rules. The accounts are in [GRABHIST.md](GRABHIST.md)** — how each fault was
found, what the log said, what the diagnosis turned out to be, and the numbers. That register is
append-only and it is the fuller copy; this file deliberately does not repeat it. **What is still
open is at the bottom.**

## The silent-failure surface

`ai.js` scores attacks with a `switch` over the verb list, and **a verb it has no case for scores as
plain base damage**. Nothing throws, no suite goes red, and the card works perfectly for the human —
the AI just misvalues it forever. That is the same failure the deck validator exists to prevent, one
level up: an unimplemented *card* can never silently do nothing, but an unscored *verb* currently
can.

The runtime behaviour is right — throwing mid-game over a scoring gap would be worse than
misplaying — so the guard lives in the tooling. **It is in `selftest.js`:** walk every verb appearing
in `effects.js`, and assert `ai.js` either scores it or it sits on `UNSCORED_ON_PURPOSE`. It found
**eleven** the first time it ran — Thunderbolt believed free, Super Fang valued at zero, Earthquake's
damage to its own bench invisible. None of the eleven appears in a theme deck, so 480 full games ran
byte-identical before and after the fix; nothing but this check could see them.

**The opt-out list is the point, and it is deliberately almost empty.** One verb is on it
(`REQUIRE_DEF_STATUS`, a legality gate the engine refuses outright, so an illegal attack never
reaches the AI to be scored). Putting a verb there is a decision somebody made; leaving one off is
an oversight, and before the check the two were indistinguishable from outside.

**A verb that must not be *worth* anything is not the same as one that must not be scored**, and the
distinction matters because the list is the smaller of the two. Peek and Clairvoyance are worthless
to a bot that already reads full engine state — so `ai.js` scores `PEEK` at `-Infinity` on purpose,
with a comment saying why. That is a live declaration in the file that does the work, which beats an
entry on an opt-out list in a file that does not. *[The ruling behind it →](Rulings/PEEK-CLAIRVOYANCE.md)*;
don't "fix" it by moving it.

## The Active and the Bench are scored in different units

`potential()` values an Active's attacks with `scoreAttackHypothetical` — full expected value — and
a benched Pokémon's with the printed damage number. **Anything comparing the two is comparing two
scales**, and `bestAffordableDamage()` exists as the honest comparator for decisions that must.

Measured across ~64 games, because the obvious story turned out to be wrong. **The means are nearly
identical** (27.0 EV against 25.4 raw) — `scoreAttack` is calibrated so a point is roughly a damage.
It is the **tail** that diverges:

| | p50 | p90 | p95 | p99 |
|---|---|---|---|---|
| Active, expected value | 20 | 81 | 99 | 115 |
| Bench, printed damage | 30 | 50 | 50 | 60 |

**16.7% of Active evaluations exceed 55**, which is knockout scale — a number the bench branch cannot
produce at any merit, because printed damage stops around 60.

State the fault precisely, since the loose version invites a bad fix: the Active is **not**
over-valued. Its number is right, a knockout really is worth more, and the Active deserves a premium
anyway for being the one that can act this turn — `teamReadiness` weights it ×4 deliberately. What is
wrong is that **a benched Pokémon has no way to say "I could take a Prize if you promoted me."**

Left unfixed on purpose; it is Open #1 below. **If you take it on, duel it — and read the tail, not
the mean, or you will conclude there was never a problem.**

## The cliff: a quantity about proximity, written as an equality check

**Six instances, and it is the most productive sniff test this project has.** A term that should fall
away with distance from an edge, written flat with a cliff at the end:

| Where | Was | Is |
|---|---|---|
| `retreatPrize`'s divisor | Prizes remaining, linear | **squared** |
| `selftest.js`'s ladder gate | a threshold at a sample that could not carry it | a floor plus a significance test |
| Arcanine's recoil | flat, with a cliff only at outright suicide | share of HP remaining, squared |
| `attachBuild` | flat per step | amortised over the attack at the end |
| promotion readiness | `short === 0 ? 25 : 0` | `promoteReady / (1 + min(short, 4))` |
| `survivesCharge` | — | written graded from the start, *because* of the other five |

**Suspect it on sight**, and check your own diff against it — #16 added one of these while writing up
four others and caught it only by accident. The one-line version is in `CLAUDE.md`, because the list
above is not confined to `ai.js`: one of them is in a test suite.

## What has shipped, and the invariant each one left

Chronological. Each is one paragraph of *what must stay true*; the account of how it was found, what
the log said and what it measured is in [GRABHIST.md](GRABHIST.md) under the same date.

**The retreat re-tune — a curve, not a number.** *13 Aug.* `retreatPrize` divides by the Prizes the
opponent still needs, and the divisor is **squared**: 1.7 at six Prizes, 6.7 at three, 60 at one.
**Do not replace it with a scalar.** A flat sweep improves monotonically all the way to *deleting the
term* — 30 → 20 → 10 → 0 reads as a plateau at nothing — because the scalar moves both ends of the
curve at once and a duel cannot see the endgame case at all. Every one of those rows buys the early
game by selling the last Prize. **When a sweep plateaus at zero, suspect the shape before you believe
the conclusion.**

**Stickiness — what a Pokémon is *for*.** *13 Aug.* Some cards exist to stand there and soak, and no
weight can express that because it is a claim about the card rather than the position. Three things
about how it is built are load-bearing. It is **derived, not tagged** — everything that makes a wall
a wall is already in the card data, so a tag would be re-typing a fact on 221 cards going on 1,251.
It is **terminal Basics only**: "cannot evolve further" would call Charizard a wall, and a Stage 2 is
three cards of investment you badly want to rescue. And utility is matched by **effect verb, not card
text** (`STALL_VERBS`), because Tauros carries `STATUS_SELF_ON_TAILS` — it confuses *itself*, and a
regex on "Confused" promotes it. **Stickiness suppresses the rescue, never the Prize**, which is how
Trevor's caveat — leave them in *unless the opponent has one Prize* — falls out of the arithmetic
instead of being a special case: at one Prize the squared divisor puts that term at 60 and no amount
of stickiness reaches it. Measured at +0.2 in a duel and kept on correctness; it has eight assertions
in `powertest.js` instead.

**Weakness and Resistance reach the retreat comparison.** *13 Aug.* Three of the four forecast paths
already went through `computeDamage`; `bestAffordableDamage` did not, so the "one currency"
comparator the retreat delta runs on answered in printed numbers. **The engine's own comment promises
the AI can never predict something the engine would not do** — that is the property being preserved,
and it is why this shipped flat.

**Recoil is priced on what it leaves you, and overkill is not paid for.** *14 Aug.* Recoil costs a
share of the HP remaining, **squared, meeting the old flat cliff exactly at `frac` of 1** — so every
decision the cliff got right is unchanged and only the slope below it is new. Separately, `forecast`
returns `expUseful` beside `expDmg`, capped **per outcome** rather than on the mean (an attack doing
0-or-80 into 40 HP averages 40 raw and 20 useful, and the mean of the capped values is the true one).
**`expUseful` is a second field and not a cap in place, and that is not caution:** PlusPower asks *"is
this 10 short of lethal"*, a question about real damage that capping makes unanswerable for anything
already lethal. Leech healing and the Transparency test read `expDmg` too.

**Inert Energy, and an attachment that could never make anything bigger.** *16 Aug.* Attaching a
Grass onto a cost of F leaves the slot exactly as short as it was and strands the card. The rule was
the easy half; **the exception was the whole job.** Every inert attachment was being waved through on
*"but it could pay for a retreat"* — and only the Active can be made to retreat, so the exception is
one slot wide now. 9% of all attachments to 3%, where widening the rule alone had moved it by
nothing. **When a rule already has a carve-out, measure the carve-out before you widen the rule.**
A real bug fell out of a test written for something else: `potential()` counted the hypothetical
Energy against attack *costs* only and never put it on the slot, so **no attack in the game could be
known to get bigger from an attachment** — every `DMG_PER_SPARE_ENERGY` card, Hydro Pump included.
Seven assertions in `powertest.js`, one of which pins the Active/Bench split as it stands so whoever
closes Open #1 trips over a named case.

**Progress is worth a share of what it is progress toward.** *16 Aug, and the design came out of
Trevor's plain-English reasoning rather than out of the code.* Finishing an attack pays
`attachEnable` for the whole attack; advancing one used to pay a flat `attachBuild` per step with no
idea what was at the end of the road, so one Lightning completing a Voltorb's 10-damage Tackle beat
one of four toward a 60 — permanently and by construction. Advancing is **amortised** now. Two
details are load-bearing: **`potential()` returns `goal` beside `short`**, the printed damage of the
attack `short` is actually counting down to, ties broken by size — amortising toward a Thunderbolt
the Pokémon will never afford prices a road it is not on. And **`survivesCharge` discounts only the
Active**, by turns-it-has over turns-it-needs, graded rather than a cliff. **This is the only
significantly better duel result in the batch** (52.2% ± 1.4, confirmed at 51.9% ± 1.1) — the fault
is not symmetric, because the bot that charges its real threat is playing a different game two turns
later.

**Who gets sent up.** *16 Aug.* Promoting, being Whirlwinded up and choosing a Switch target were
three nearly-identical formulas with no obligation to agree, so a promotion the next turn could
reverse cost a card, a turn, and the player's belief that the opponent knows what it is doing. **They
are one `promoteValue` now — keep it that way.** Survival inside it is priced with **the retreat
rule's own arithmetic**, because it is the same bill read from the other side, and reusing it is the
point: one formula cannot disagree with itself. `threatAgainst(pi, slot)` is the new half;
`incomingThreat` is a call to it. **The sacrificial promote survives for free** — a bare Basic has
nothing invested, so feeding it stays cheap without a rule saying so. Doomed promotions 32% → 21%.

**Two things the scorer could not see at all.** *16 Aug, both omissions rather than misjudgements.*
**Attacking while Confused had no price** — half the time the attack does not happen *and* the
attacker takes 30, so it is worth half its value against half that cost, which bites on a 5-point
draw and not on a 60-point swing. **Both directions are asserted**, because "never attack while
Confused" would be worse play than the bug. *The generalisable half: the retreat rule learned about
Confusion on 13 Aug and the attack path never did — the same gap twice in one engine, one branch
apart. **Check any decision that reads `status` for one branch and not its siblings.*** And **recoil
is waived when the defender prevents the damage** — see
[Rulings/PREVENTED-DAMAGE-RECOIL.md](Rulings/PREVENTED-DAMAGE-RECOIL.md) — priced at `f.pStopped`,
the odds the recoil actually lands, rather than as an on/off switch, because Transparency is a coin
and this must not become entry seven in the cliff table above.

**Don't lose the game either.** *16 Aug, the exact mirror of the "win the game if you can win the
game" rule.* A 10 HP Electabuzz took a coin-flip recoil attack, Knocked out its target, killed
itself, handed over the last Prize and lost on the turn it scored — rated 73.5 against a safe
alternative at 33. **An average hid it, and that is the part that generalises.** Expected recoil was
5, and 5 never killed anybody; this scorer is built on expected value, so *any* catastrophic minority
branch is invisible to it by construction. `rawOutcomes` carries `selfWorst` and `pSelfWorst` beside
`selfDmg`, and a self-Knock-Out that **ends the match** is charged `lastPrize` rather than `selfKO`.
**It had to be a different kind of term, not a bigger one** — `selfKO` is 70 against a Knock Out
worth 55 plus 35 damage, so no value of that weight fixes this without breaking every ordinary recoil
decision. **Losing is not a large Knock Out.** The win shortcut in `choose()` needed its own guard,
because it returns a near-certain lethal *before any scoring runs*. **Where to look for more of
these: anywhere the scorer averages over outcomes and one of those outcomes is terminal.** Prizes,
empty boards and deck-out are the three ways this game ends — **that sentence named deck-out as still
unpriced and the next entry is what closed it**, which is the best argument in this file for writing
down where you did not look.

**Your own deck is a resource, and running out of it loses.** *16 Aug 2026, from two of Trevor's grab
bag items that turned out to be one.* `deck.length` reached the scorer in exactly one place —
Wildfire, where it prices the **opponent** decking out as a weapon. So the bot understood running you
out of cards as a way to win and had no concept of doing it to itself: every draw was flat `drawCard`
per card, Bill, Fetch, Pay Day, Gambler and Professor Oak at up to 35 points, none of them looking at
what was left. **17.7% of ladder games ended in a deck-out** and 45 of those losers had burned cards
with under five remaining. Two terms, and the split is the recoil work's lesson reused: `deckBurn` is
a cost on the **squared share of what remains**, and `deckLoss` is terminal for a play that empties
the deck outright.

**It is a curve and not the floor at 20 cards the report asked for** — a floor is the cliff shape in
the table above and would make 21-vs-19 a personality change. But the *band* the curve occupies is
Trevor's, settled by showing him the table rather than arguing it: **`deckBurn` is set so the band
runs 20 down to 10.** Bill costs 2.5 points of its 10 at twenty cards left and exactly 10 — its whole
value — at ten. The squaring is what makes that a band; the weight is only how wide and how high it
sits. `powertest.js` asserts the curve is monotonic *and* not flat, so a later threshold trips it.

**Gambler is priced on NET change and must not be capped alongside Bill:** it shuffles the hand back
in before drawing 1-or-8, so on a hand of more than five it makes the deck *bigger*, and it is the
only recycling card in the game — capping it would suppress the one play that digs out. Its credit
has its own weight (`deckRecycle`) rather than sharing `deckBurn`, and that split is load-bearing:
the two were one number, and widening the burn band to Trevor's range would have quietly made
recycling pay 55 points, more than a Knock Out. ***A constant doing two jobs gets retuned for one.***
Oak and Gambler also weigh what the hand is worth keeping and get a boost when the board is starved
of Energy or Basics, which is Trevor's rule.

**Plays that empty the deck outright 14 → 0**, burns under ten cards 6% → 1%, games lost to deck-out
9% → 5%. **51.4% ± 1.2, significant, and confirmed on an independent sample** — only the second
result in Job 9 to clear the bar, and for the same reason as the first: this fault is *not*
symmetric. Both bots misplay it, but the one that is still holding cards two turns later is playing a
different game.

**Opening placement ranks before it measures.** *18 Aug.* `setupAuto` chose the opening Active by
one line — highest HP among the Basics in hand — and it is **both sides'**, since the player's "auto"
button calls it too. That makes it a shared sensible default rather than an AI decision, which is why
the fix stayed in `engine.js`; an earlier draft of this file said to move it into `ai.js` and that was
wrong for the player-facing half. Basics are now ranked *stranded last*, then sorted by HP inside the
rank. **A line-starter is only stranded when nothing rescues it** — its evolution in hand, a spare copy
in hand (Trevor's refinement: only one can be Active, so the duplicate covers the evolution path and
the one out front is free to be spent), or nothing evolving from it at all. **Measured 16.6% → 0.0%**
across Trevor's eight Base Set decks, worst deck 27.4%; `abtest` puts 13.3% of games on a different
line with the win rate unmoved at 49.1% → 48.4%. **Keep HP as the tiebreak** — it was never the wrong
question, only the wrong *first* question.

**The instrument lied first, and the lesson is the transferable part.** `tools/openercheck.js`
originally reimplemented `setupAuto`'s rule in order to measure it, so it reported *identical figures
before and after the fix* — it was measuring a copy of the code rather than the code, and it also put
the defect at 6.0% when driving the real engine says 16.6%. **A measurement tool must call the thing
it measures.** Same shape as the green-for-the-wrong-reason case in [HISTORY.md](HISTORY.md), and it
was caught only by running the control against the pre-fix engine — which is [MEASUREMENT.md](MEASUREMENT.md)'s
standing rule doing exactly its job.

## Open

1. **The Bench cannot say "I could take a Prize."** `potential()` prices a benched Pokémon in printed
   damage while an Active gets full expected value; the measured size is in *The Active and the Bench
   are scored in different units* above. Closing it means making expected value computable for a slot
   that is not Active, which is a real refactor of `scoreAttack`'s relationship with engine state,
   against a measured prize of one in six comparisons in a direction that is partly correct already.
   **If you take it on, duel it, and read the tail rather than the mean** — and there is a named case
   waiting: `powertest.js` asserts that a benched Poliwag is refused a second Water because
   `aiParseDamage` reads Water Gun's "10+" as 10. **That test is written to fail when you fix this**,
   and its comment says to delete it.
   *(The promotion half of this entry is closed — a wall is preferred when promoting now, on survival
   rather than on stickiness.)*
2. **Nothing has re-tuned the weights as a set.** Every AI change since 13 Aug has been one term at a
   time, each with a reason and a measurement. A sweep over `AI_WEIGHTS` as a whole has never been
   done and there is no measured reason to think it would pay — recorded so nobody proposes it as a
   known-good job. It is a speculative one.
3. **The AI is not told about `progress.lost`, difficulty per bracket, or anything the ladder knows.**
   Every opponent plays at the tier deck select hands them. Whether a named rival should play better
   than a Club Master is an unasked design question — see [PROGRESSION.md](PROGRESSION.md) and
   [OPPONENTS.md](OPPONENTS.md), which argues the AI probably should *not* be the dial.

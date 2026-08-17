# Shadowless — the opponent AI

Depth behind the AI row in `CLAUDE.md`'s status table. **Read this before changing anything in
`src/ai.js`** — how the bot scores, where it can fail without anything going red, and the three
stretches of work that have shipped.

**Before you believe a number that says the bot got better, read [MEASUREMENT.md](MEASUREMENT.md)
instead.** That is the other half of this file, split off on 15 Aug 2026: the two instruments, the
six ways they have lied, how to read a saved match log, and the standing figures. **Nothing here
tells you whether a change worked.** If you are holding a duel result, a playtest report or a match
log, you want that file and not this one.

Assembled out of `ENGINE.md` and `TOOLING.md` on 11 Aug 2026, because AI material was living in three
files and none of them announced it.

The one-line summary: **the AI is an expected-value scorer over enumerated coin-flip outcomes, and
its one structural weakness is that a verb it cannot score costs nothing at runtime and is misplayed
forever.**

**What is actually open is at the bottom of this file**, under `Open`. Everything between here and
there is an account of work that has shipped.

## The silent-failure surface

`ai.js` scores attacks with a `switch` over the verb list, and **a verb it has no case for scores as
plain base damage**. Nothing throws, no suite goes red, and the card works perfectly for the human —
the AI just misvalues it forever. That is the same failure the deck validator exists to prevent, one
level up: an unimplemented *card* can never silently do nothing, but an unscored *verb* currently
can.

The runtime behaviour is right — throwing mid-game over a scoring gap would be worse than
misplaying — so the guard belongs in the tooling. **It was built in Job 6a and it lives in
`selftest.js`:** walk every verb appearing in `effects.js`, and assert `ai.js` either scores it or
it sits on `UNSCORED_ON_PURPOSE`. It reports `96 of 97 verbs scored` today and it found **eleven**
the first time it ran — Thunderbolt believed free, Super Fang valued at zero, Earthquake's damage to
its own bench invisible. None of the eleven appears in a theme deck, so 480 full games ran
byte-identical before and after the fix; nothing but this check could see them.

**The opt-out list is the point, and it is deliberately almost empty.** One verb is on it
(`REQUIRE_DEF_STATUS`, a legality gate the engine refuses outright, so an illegal attack never
reaches the AI to be scored). Putting a verb there is a decision somebody made; leaving one off is
an oversight, and before the check the two were indistinguishable from outside.

**A verb that must not be *worth* anything is not the same as one that must not be scored**, and the
distinction matters because the list is the smaller of the two. Peek and Clairvoyance are worthless
to a bot that already reads full engine state — so `ai.js` scores `PEEK` at `-Infinity` on purpose,
with a comment saying why. That is a live declaration in the file that does the work, which beats an
entry on an opt-out list in a file that does not. The ruling behind it is in
[RULINGS.md](RULINGS.md); don't "fix" it by moving it.

## The Active and the Bench are scored in different units

`potential()` values an Active's attacks with `scoreAttackHypothetical` — full expected value — and
a benched Pokemon's with the printed damage number. **Anything comparing the two is comparing two
scales**, and `bestAffordableDamage()` exists as the honest comparator for decisions that must.

Measured across ~64 games before assuming the worst, because the obvious story turned out to be
wrong. **The means are nearly identical** (27.0 EV against 25.4 raw) — `scoreAttack` is calibrated
so a point is roughly a damage, so most of the time the two agree. It is the **tail** that diverges:

| | p50 | p90 | p95 | p99 |
|---|---|---|---|---|
| Active, expected value | 20 | 81 | 99 | 115 |
| Bench, printed damage | 30 | 50 | 50 | 60 |

**16.7% of Active evaluations exceed 55**, which is knockout scale — a number the bench branch
cannot produce at any merit, because printed damage stops around 60.

So state the fault precisely, since the loose version invites a bad fix: the Active is **not**
over-valued. Its number is right, a knockout really is worth more, and the Active deserves a premium
anyway for being the one that can act this turn — `teamReadiness` weights it ×4 deliberately. What
is wrong is that **a benched Pokemon has no way to say "I could take a Prize if you promoted me."**

Left unfixed on purpose. Closing it means making expected value computable for a slot that is not
Active, which is a real refactor of `scoreAttack`'s relationship with engine state, and the measured
prize is one in six comparisons in a direction that is partly correct already. **If you do take it
on, duel it** — and read the tail, not the mean, or you will conclude there was never a problem.

## The retreat re-tune — a curve, not a number

**Done 13 Aug 2026.** This section sat under a heading reading `Open` for a day after it shipped,
which is the exact trap `MAINTENANCE.md` names: a reader looking for the next AI job found finished
work under the word that promises unfinished work.

**What it found was a curve, not a number.** `retreatPrize` divides by the Prizes the opponent still
needs, so the 12-Prize repair silently
doubled it and left the bot twice as eager to run away. The obvious response is to shrink the
scalar, and measured against the old value it plainly works:

| `retreatPrize` | vs previous AI |
|---|---|
| 30, flat | 51.3% ± 5.0 |
| 20, flat | 55.2% ± 5.0 |
| 10, flat | 57.0% ± 5.0 |
| 0 (term deleted) | 56.8% ± 5.0 |

**Read that table the wrong way and you delete the term.** It plateaus at nothing, and a duel will
happily tell you a capability it cannot see is worthless — the endgame case is rare, symmetric and
shared by both seats, which is [MEASUREMENT.md](MEASUREMENT.md)'s oldest warning. The scalar moves *both* ends of the curve
at once, so every row above buys the early game by selling the last Prize.

The comment on the weight claimed it was worth *"little when they need six more and everything when
they need one"*, and it never was: `60/6` is **10**, a sixth of the endgame value, paid on every
rescue from turn one. **Squaring the divisor** delivers the curve as described — 1.7 at six Prizes,
6.7 at three, 60 at one — and it moves only the end that was wrong.

**55.7% ± 5.0, then 55.9% ± 4.2 on an independent sample.** Significant twice, and the Zap row is
the one that matters, because Zap's cheap 30–40 HP Basics are why this term exists at all: **53% and
51% against 44% in the control**, the best of any variant tried. Every deck improved over control.
The counters agree — retreats 323 → 260, those costing the turn's attack 33% → 25%, total attack
score given up 2928 → 1419, retreats that *improved* the hit 53% → 61%.

**The lesson is worth more than the weight.** A term whose magnitude is a function of game state was
fitted in a game whose state was wrong, and a scalar sweep could only trade one end of it against
the other. When a sweep plateaus at zero, suspect the shape before you believe the conclusion.

## Stickiness — what a Pokémon is *for*

**Built 13 Aug 2026**, from Trevor's playtest note that Kangaskhan, Chansey, Snorlax and an
Electabuzz were being retreated when they should have stood and soaked. No weight can express that,
because it is not a claim about the position — it is a claim about the card.

**Proposed as a per-card tag and built as a derivation.** A tag is per-card labour on 221 cards going
on 1,251, inherited by every set added afterwards and skipped by the first session in a hurry.
Everything that makes those four walls is already in the data, so a tag would be re-typing a fact
rather than adding one. Three signals — HP, retreat cost, and an attack that pays rent for standing
there (drawing, stalling, or locking down) — over **terminal Basics only**.

**That last restriction is Trevor's and it is the load-bearing part.** The tempting rule is "cannot
evolve any further" and it calls **Charizard** a wall: 120 HP, retreat 3, nothing evolves from it. A
Stage 2 is three cards of investment and you badly want to rescue it. A Basic with nowhere to go has
no future to protect.

Utility is matched by **effect verb, not card text** (`STALL_VERBS` in `ai.js`), because Tauros
carries `STATUS_SELF_ON_TAILS` — it confuses *itself*. A regex on "Confused" makes Tauros a wall.

It comes out sparse and it finds cards nobody named: **23 of 150 species** score above zero, with
Kangaskhan, Snorlax and **Lickitung** at 0.90, Chansey 0.80, **Onix** and Lapras 0.70, Electabuzz
0.60 — and Charizard, Blastoise, Alakazam and Pikachu at flat 0. Lickitung and Onix arriving
unprompted is the argument for deriving rather than listing.

**Stickiness suppresses the rescue, never the Prize.** A wall about to die is the card doing its job,
so what it has "invested" was always going to be spent — but conceding a Prize can still lose the
game outright. That split is also how Trevor's own caveat, *leave them in unless the opponent has one
Prize*, falls out of the arithmetic rather than being written as a special case: at one Prize the
squared divisor puts that term at 60 and no amount of stickiness reaches it.

**Measured at +0.2 points and kept anyway** — 51.2% against 51.0% with the weight zeroed, over 2,592
`--gbc` games. Not a hedge: the rescue branch requires `danger >= remainingHP`, and a wall's defining
property is too much HP to be in that state until it is *already hurt*, which is exactly when Trevor
watched it happen. This is the "rare, symmetric, about perception" case that [MEASUREMENT.md](MEASUREMENT.md) makes twice
already belongs in `powertest.js` rather than in a duel, and it has eight assertions there — including
the Charizard exclusion and the one-Prize override.

**Weakness and Resistance reach the retreat comparison now, too.** Trevor's note that the bot was not
reading them into its damage predictions was right in exactly one place: three of the four forecast
paths went through `computeDamage`, and `bestAffordableDamage` — the "one currency" comparator the
retreat delta runs on — did not. It answered *"would the Pokémon I am swapping to hit harder?"* in
printed numbers, so a 30 that is really 60 against the thing actually standing opposite counted as
30. Both operands were wrong in different directions at once, which is why it never looked like a
bias. Flat in a duel (50.8% ± 5.0), better on the independent yardstick — retreats costing the turn's
attack 25% → 23%, retreats improving the hit 61% → 63% — and kept on correctness: the engine's own
comment promises the AI can never predict something the engine would not do.

## Recoil, overkill, and a report that was right about the wrong game

**14 Aug 2026, from a match log.** Trevor reported the bot using Arcanine's Take Down (80, 30 recoil)
to knock something out where Flamethrower (50, discard a Fire) would have done. **The log did not
contain that.** All four Take Downs in it are listed below, and in both cases that killed, Flamethrower
could not have reached the target. Worth stating plainly, because a report you take at face value
sends you fixing the wrong thing:

| turn | outcome | could Flamethrower have killed? |
|---|---|---|
| 14 | Lickitung → 10/90, no KO | no |
| 16 | Lickitung KO'd | no — it had 80 left |
| ~38 | Dragonair KO'd | no — 80 HP, at full |
| 42 | Arcanine → 20/100, no KO | no |

**The instinct was right and the fault was in the other two.** On turn 42 Ken's Arcanine sat on 60
damage of 100, took Take Down anyway for 30 extra damage that killed nothing, and finished on 90 —
one hit from conceding a Prize it never had to give. It had done the same thing on turn 14.

Two separate faults, and they need different fixes:

**Recoil was flat with a cliff.** `selfDmg * 0.8`, the same charge whether the Pokémon was untouched
or one hit from dead, and only a *lethal* recoil paid `selfKO`. It is now priced on the share of what
remains — squared, and meeting the old cliff exactly at `frac` of 1, so every decision the cliff got
right is unchanged and only the slope below it is new. Arcanine now takes Take Down at 0–20 damage
and Flamethrower from 40 on.

**Overkill was still being paid for.** `scoreAttack` credited full expected damage, so when *both*
attacks killed, Take Down beat Flamethrower **by a tenth of a point** — which is Trevor's report
exactly, just not the game he found it in. There is no trample here: 80 into a Pokémon with 40 left
removes 40 and wastes 40. `forecast` now returns `expUseful` beside `expDmg`, capped **per outcome**
rather than on the mean (an attack doing 0-or-80 into 40 HP averages 40 raw and 20 useful, and the
mean of the capped values is the true one).

**`expUseful` is a second field rather than a cap in place, and that is not caution.** PlusPower asks
*"is this 10 short of lethal"* — a question about real damage that capping makes unanswerable for
anything already lethal. Leech healing and the Transparency test read it too.

**Flat on both duel pools** (51.0% ± 1.9 on `--gbc`), which by now is the expected reading for this
whole family: rare, symmetric, and about a position a human recognises instantly. Six assertions in
`powertest.js`, including the two that guard against over-correcting — a healthy Arcanine must still
take the recoil, and the bigger attack must still be used when only it reaches.

*Third instance in two days of the same shape: a quantity that should scale with proximity to an edge,
written flat with a cliff at the end.* `retreatPrize`'s divisor, `selftest`'s threshold, and now this.
Worth suspecting on sight.

**Left open**, and carried down to the `Open` list at the bottom of this file: stickiness only reads
the *rescue*, so a wall is not yet preferred when **promoting** off the Bench, and `potential()`
still prices a benched Pokémon in printed damage.

## Inert Energy, and an attachment that could never make anything bigger

**16 Aug 2026, from Trevor's note that the bot attaches Energy its Pokémon cannot use "when no other
options exist."** True, and **9% of every attachment it made** — three times the surplus fault Job 6
fixed. Surplus caught *"the target needed nothing"*; this is *"the target needed something else"*, a
Grass onto a cost of F, which leaves the slot exactly as short as it was and strands the card where
it can never be spent.

**The rule was the easy half. The exception was the whole job.** Widening the test to "no progress on
either axis" moved 218 inert attachments to 190, which is nothing. Deleting the escape-route
exception entirely took it to **zero** — every one of them was being waved through on *"but it could
pay for a retreat"*, since retreat counts Energy cards rather than symbols. Only the Active can be
made to retreat, and a benched Pokémon's retreat cost is a bill it is not handed until it is Active,
by which time the Energy can be attached to a slot that actually wants it. One slot wide: **9% → 3%**,
and the 3% left is the exception working.

*Generalisable: when a rule already has a carve-out, measure the carve-out before you widen the rule.*

**And a real bug fell out of a test written for something else.** `potential()` counted the
hypothetical Energy against attack *costs* only and never put it on the slot, so
`scoreAttackHypothetical` worked the damage out with the card absent. The consequence is bigger than
it sounds: **no attack in the game could ever be known to get bigger from an attachment.** Every
`DMG_PER_SPARE_ENERGY` card is one — Blastoise's Hydro Pump, Poliwrath, both Vaporeon, Lapras,
Omastar, Seadra — and a paid-up Blastoise scored a fourth Water exactly as it scored the third, so
the surplus rule held the card and Hydro Pump never grew. Rain Dance escaped by luck: `EXTRA_ATTACH`
goes straight to `attachValue` and never meets that rule.

Flat in a duel, as this whole family is (50.6% ± 1.4 on `--gbc`, control 50.0%). Seven assertions in
`powertest.js`, one of which asserts the **Active/Bench split as it stands** so that whoever closes
Open #1 below trips over a named case instead of a paragraph.

## Progress is worth a share of what it is progress toward

**16 Aug 2026, from log `04-31-25` — and the design came out of Trevor's plain-English reasoning
about it rather than out of the code.** He said the Zapdos was the better investment because it is
Active, can *realistically survive* long enough to charge, and nothing better is waiting on the
Bench. All three of those are in the fix.

**This is the only significantly better duel result in the batch: 52.2% ± 1.4, then 51.9% ± 1.1 on an
independent larger sample, control 50.0%.** Worth noting against the four flat results around it —
this family of fault is *not* symmetric. Both seats misallocate, but the misallocation compounds:
the bot that charges its real threat is playing a different game two turns later.

**Finishing an attack pays `attachEnable` for the whole attack. Advancing one paid a flat
`attachBuild` per step and had no idea what was at the end of the road.** So one Lightning completing
a Voltorb's 10-damage Tackle beat one of four Lightning toward a 60 — permanently, and by
construction, because the card that can never do anything is the cheap one to finish.

Advancing is **amortised** now: one Energy of the N a Pokémon still needs is worth roughly its share
of the attack waiting at the end. A third of a 60 beats all of a 10.

Two details that are load-bearing:

- **`potential()` returns `goal` beside `short`** — the printed damage of the attack `short` is
  actually counting down to, ties broken by size. Amortising a step toward Thunder against a
  Thunderbolt the Pokémon will never afford would price a road it is not on.
- **`survivesCharge` is Trevor's other condition.** Only the Active is being hit, so only the Active
  is discounted, by turns-it-has over turns-it-needs. Graded, not a cliff — see the running tally
  below.

Four assertions in `powertest.js`. **Two of them were written wrong first and both mistakes are worth
knowing**: a survivability test whose attacker one-shots the subject either way reads "one turn to
live" on both sides and proves nothing, and Charmeleon cannot demonstrate the `goal` rule at all
because Slash CCC and Flamethrower RRC tie on cost, so the documented tie-break correctly returns
the 50.

## Who gets sent up

**16 Aug 2026, from log `04-22-45`.** After a Knock Out the bot promoted a 40 HP Voltorb over a 90 HP
Zapdos, into an Arcanine that had just dealt 80 — and spent a Switch on its next turn undoing it.

**Both decisions were correct on their own scorer, and that is the fault.** Promoting, being
Whirlwinded up and choosing a Switch target were three nearly-identical formulas with no obligation
to agree, so a promotion the next turn reverses cost a card, a turn, and the player's belief that the
opponent knows what it is doing. They are one `promoteValue` now, and it knows two things none of the
three did.

**Readiness is a countdown, not a switch.** `short === 0 ? 25 : 0` charged the same nothing for one
Energy short as for four, so *"which of these can fight soonest"* was unaskable — which is Trevor's
separate promotion note, from a different game. `promoteReady / (1 + min(short, 4))`: 25 ready, 12.5
one away, 5 at four or more.

**This is the running tally of the same mistake, and it is now at six.** A quantity that should fall
away with distance from an edge, written flat with a cliff at the end: `retreatPrize`'s divisor,
`selftest`'s sample threshold, Arcanine's recoil, this, the flat `attachBuild` in the section above,
and `survivesCharge` — which was written graded on purpose *because* of the other five. **Suspect it
on sight.** If a term is about proximity and it is written as an equality check, look again.

**Surviving the turn, priced with the retreat rule's own arithmetic**, because it is the same bill
read from the other side: the Energy invested dies with the Pokémon, and the Prize is the larger half
and scales with how few they still need. Reusing it is the point — one formula cannot disagree with
itself. `threatAgainst(pi, slot)` is the new half, asking what the opponent would hit a *candidate*
for; `incomingThreat` is now a call to it. The **sacrificial promote survives for free**: a bare Basic
has nothing invested, so feeding it stays cheap without a rule saying so.

The old scores rebuild from the log exactly — 41 / 31.3 / 17.3 — and the choice flips to Zapdos.
**Promotions into a hit that kills them: 32% → 21%** over 511, counted by `aitest.js`. Flat in a duel
(49.4% ± 1.4), four assertions in `powertest.js` including one that pins Switch and promote to the
same ranking.

## Two things the scorer could not see at all

**16 Aug 2026, both from Trevor's log 06-13-50 and the Scrunch report, and both omissions rather
than misjudgements.**

**Attacking while Confused had no price.** A Confused Kangaskhan used Fetch on three separate turns
to draw one card and hit itself for 30 doing it. Half the time the attack simply does not happen
*and* the attacker takes 30, so it is worth half its value against half that cost — which bites on a
5-point draw and not on a 60-point swing, and that split is the whole point. "Never attack while
Confused" would be worse play than the bug, so both directions are asserted.

*The generalisable bit: the retreat rule learned about Confusion on 13 Aug and the attack path never
did — the same gap twice in one engine, one branch apart.* **Worth checking any decision that reads
`status` for one branch and not its siblings.**

**Recoil is waived when the defender prevents the damage** — a rules change settled with Trevor, see
[Rulings/PREVENTED-DAMAGE-RECOIL.md](Rulings/PREVENTED-DAMAGE-RECOIL.md). The bot has to know or it
goes on refusing Take Down into a Scrunched Chansey for a cost it will not pay. Priced at
`f.pStopped`, the odds the recoil actually lands, rather than as an on/off switch — Transparency is a
coin, and this must not become the next entry in the tally below.

## Don't lose the game either

**16 Aug 2026, from log `06-53-35`** — the exact mirror of the *win the game if you can win the game*
rule, and found the same way: a match that turned on the bot not seeing a game-ending branch.

Electabuzz on 10 HP took Thunderpunch, a coin for either a bonus or 30-plus-10-recoil. It Knocked
Arcanine out, the recoil killed Electabuzz, that handed over the last Prize, and the game ended on
the turn it scored. **73.5, against a safe Thundershock at 33.**

**An average hid it, and that is the part that generalises.** Expected recoil on that attack is 5,
and 5 never killed anybody. This entire scorer is built on expected value, so *any* catastrophic
minority branch is invisible to it by construction — a mean cannot represent "and sometimes the game
just ends". `rawOutcomes` now carries `selfWorst` and `pSelfWorst` beside `selfDmg`, and a
self-Knock-Out that ends the match is charged `lastPrize` rather than `selfKO`.

**It had to be a different kind of term, not a bigger one.** `selfKO` is 70; the Knock Out it was
competing with was worth 55 plus 35 damage. No value of that weight would ever have fixed this
without breaking every ordinary recoil decision. Losing is not a large Knock Out.

The win shortcut in `choose()` needed its own guard, because it returns a near-certain lethal
*before any scoring runs* — the rule above cannot reach it, and it would have taken the mutual kill.

**Where to look for more of these:** anywhere the scorer averages over outcomes and one of those
outcomes is terminal. Prizes, empty boards, and deck-out are the three ways this game ends, and only
the first two are priced anywhere.

## Open

1. **The Bench cannot say "I could take a Prize."** `potential()` prices a benched Pokémon in printed
   damage while an Active gets full expected value. It is still not obviously worth the refactor; the
   measured size is in *The Active and the Bench are scored in different units* above. **If you take
   it on, duel it, and read the tail rather than the mean** — and there is a named case waiting for
   you now rather than a paragraph: `powertest.js` asserts that a benched Poliwag is refused a second
   Water because `aiParseDamage` reads Water Gun's "10+" as 10. That test is written to **fail when
   you fix this**, and its comment says to delete it.
   *(The promotion half of this entry is closed — a wall is preferred when promoting now, on
   survival rather than on stickiness. See "Who gets sent up" above.)*
2. **Nothing has re-tuned the weights as a set.** Every AI change since 13 Aug has been one term at a
   time, each with a reason and a measurement. A sweep over `AI_WEIGHTS` as a whole has never been
   done and there is no measured reason to think it would pay — recorded so nobody proposes it as a
   known-good job. It is a speculative one.
3. **The AI is not told about `progress.lost`, difficulty per bracket, or anything the ladder knows.**
   Every opponent plays at the tier deck select hands them. Whether a named rival should play better
   than a Club Master is an unasked design question — see [PROGRESSION.md](PROGRESSION.md).

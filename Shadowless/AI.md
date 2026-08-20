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

**This file is the rules. Most of the accounts are in [GRABHIST.md](GRABHIST.md)** — how each fault
was found, what the log said, what the diagnosis turned out to be, and the numbers. **But not all of
them, and the difference matters before you trim anything here.** Entries that came from Trevor's
grab bag have a fuller, append-only twin there; entries that came from *set or job work* have no twin
anywhere, because nothing else was recording them. Ten of the twelve below are twinned. **The opening
placement fix, the Energy-pool fix and the whole triggered-Powers section are the only copy that
exists** — condense one of those and the reasoning is gone.

Corrected 19 Aug 2026. The blanket version of this sentence was true when it was written and stopped
being true the moment a set job touched `ai.js`; it had already been cited once as grounds for
trimming. *[Why that reasoning also refused this file a directory, and what changed →](HISTORY.md)*
**What is still open is at the bottom.**

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

**The opt-out list is the point, and it is deliberately almost empty.** Four verbs are on it, and
they are two kinds rather than four decisions: three are legality gates the engine refuses outright
(`REQUIRE_DEF_STATUS`, `REQUIRE_SELF_ENERGY`, `REQUIRE_OPP_BENCH`), so an illegal attack never reaches
the AI to be scored at all. The fourth is `SHUFFLE_OPP_DECK` — this bot has no memory of deck order,
so it cannot be hurt by a shuffle or value inflicting one, and zero is the honest number. **Its entry
names the condition that would make it wrong** (the day anything in `ai.js` tracks known deck order)
rather than leaving that to be rediscovered, which is the shape any future entry should copy. Putting
a verb there is a decision somebody made; leaving one off is an oversight, and before the check the
two were indistinguishable from outside.

**A verb that must not be *worth* anything is not the same as one that must not be scored**, and the
distinction matters because the list is the smaller of the two. Peek and Clairvoyance are worthless
to a bot that already reads full engine state — so `ai.js` scores `PEEK` at `-Infinity` on purpose,
with a comment saying why. That is a live declaration in the file that does the work, which beats an
entry on an opt-out list in a file that does not. *[The ruling behind it →](Rulings/PEEK-CLAIRVOYANCE.md)*;
don't "fix" it by moving it.

### Triggered Powers: the surface where a Power is free

Job 10c added Powers that **fire whether or not anything scored them**, which is the silent-failure
surface arriving from a new direction. An ON_PLAY Power does its work the moment the card is played;
a bot that does not read it gets Summon Minions' two free Basics for nothing and — worse — hands the
*engine* the choice of which two, where the fallback is a seeded random.

So `scoreOnPlay` does both jobs at once, exactly as `scoreTrainer` does: it returns what the arrival
is worth, and it fills in `a.opts` so the fallback is never reached. It is called from **both**
`evolve` and `playBasic`, because 17 of the era's 20 ON_PLAY printings are Evolutions, 3 are Basics,
and the trigger does not care which.

**The decision is never where the Power is.** That is the thing to hold on to when adding the next
one — a triggered Power is invisible to `scorePower`, but it is not invisible to the bot:

| Trigger | Scored where |
|---|---|
| `ON_PLAY` | `scoreOnPlay`, from the evolve and playBasic cases |
| `ON_OPP_RETREAT` | the retreat case in `scoreAction`, which prices the toll and gets more afraid as they add copies |
| `ON_KO` | the lethal branch of `scoreAttack` — the first term in the forecast that prices what the **corpse** does back |

That last one is worth a sentence of its own. Every term in `scoreAttack` prices what an attack
*does*, and none of them priced what happens to the Pokémon that lands the killing blow. The bot was
walking a Charizard into a fully charged Final Beam — 80 on a coin — for free.

`TRIGGERED_POWERS` in `selftest.js` is its own list beside `PASSIVE_POWERS` rather than folded into
it. Both are invisible to `scorePower`; the reasons are opposite. A passive has no decision at all,
a trigger has one somewhere else, and filing these as passive would assert something false.

**All of them are on `PROVISIONAL`.** Every weight is a first guess priced off an existing weight.

### A third state: PROVISIONAL

A verb used to be either scored or opted out with a reason, and that is a gap. **A set job adding
eighty cards has to give every one of them a weight, and an unmeasured weight is indistinguishable
from a considered one the moment the session ends.** The next AI pass then has to re-derive which of
a hundred-odd verbs were reasoned about and which were guessed, which nobody will do.

**`PROVISIONAL` in `selftest.js` is where you declare a weight you shipped on a first guess.** It is
not a failure and it costs nothing at runtime — it is a **worklist**, and the declaration is the whole
value. Team Rocket put two dozen entries on it in one job, which is the list doing exactly what it was
built for: **run `selftest.js` for the current names** rather than trusting a count in prose, and
expect a set job to lengthen it and an AI pass to shorten it. Three things are asserted about it, all contradictions rather than opinions: everything on it
is actually scored, nothing is simultaneously on `UNSCORED_ON_PURPOSE`, and nothing on it has left
`effects.js`. All three were watched going red before being trusted.

**Take a verb off the list when you have measured it** — `aiduel.js`, `abtest.js` or `decksim.js`, and
read [MEASUREMENT.md](MEASUREMENT.md) first, because all three have lied. Removing it is the only
thing that marks the work done. Trevor's ask, 18 Aug 2026; #18 had already been doing this informally
on the Team Rocket run with nowhere to write it down.

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
term*, because the scalar moves both ends of the curve at once and a duel cannot see the endgame case
at all — every one of those rows buys the early game by selling the last Prize. **When a sweep
plateaus at zero, suspect the shape before you believe the conclusion.**

**Stickiness — what a Pokémon is *for*.** *13 Aug.* Some cards exist to stand there and soak, and no
weight can express that because it is a claim about the card rather than the position. Three things
about how it is built are load-bearing. It is **derived, not tagged** — a tag would be re-typing a
fact already in the card data on 1,251 cards. It is **terminal Basics only**, because "cannot evolve
further" would call Charizard a wall and a Stage 2 is three cards you badly want to rescue. And
utility is matched by **effect verb, not card text** (`STALL_VERBS`), because Tauros confuses *itself*
and a regex on "Confused" promotes it. **Stickiness suppresses the rescue, never the Prize** — which
is how Trevor's caveat, leave them in *unless the opponent has one Prize*, falls out of the arithmetic
instead of being a special case. Kept on correctness rather than on a duel result; eight assertions in
`powertest.js` hold it.

**Weakness and Resistance reach the retreat comparison.** *13 Aug.* `bestAffordableDamage` was the one
forecast path not going through `computeDamage`, so the "one currency" comparator answered in printed
numbers. **The engine's own comment promises the AI can never predict something the engine would not
do** — that is the property being preserved.

**Recoil is priced on what it leaves you, and overkill is not paid for.** *14 Aug.* Recoil costs a
share of the HP remaining, **squared, meeting the old flat cliff exactly at `frac` of 1**, so every
decision the cliff got right is unchanged and only the slope below it is new. Separately `forecast`
returns `expUseful` beside `expDmg`, capped **per outcome** rather than on the mean. **`expUseful` is a
second field and not a cap in place, and that is not caution:** PlusPower asks *"is this 10 short of
lethal"*, a question about real damage that capping makes unanswerable for anything already lethal.

**Inert Energy, and an attachment that could never make anything bigger.** *16 Aug.* Attaching a Grass
onto a cost of F strands the card. The rule was the easy half; **the exception was the whole job** —
every inert attachment was waved through on *"but it could pay for a retreat"*, and only the Active
can be made to retreat, so the exception is one slot wide now. **When a rule already has a carve-out,
measure the carve-out before you widen the rule.** A real bug fell out of a test written for something
else: `potential()` counted hypothetical Energy against attack *costs* only and never put it on the
slot, so **no attack in the game could be known to get bigger from an attachment.**

**Progress is worth a share of what it is progress toward.** *16 Aug, and the design came out of
Trevor's plain-English reasoning rather than out of the code.* Advancing an attack used to pay a flat
`attachBuild` with no idea what was at the end of the road, so one Energy completing a 10-damage
Tackle beat one of four toward a 60 — permanently and by construction. Advancing is **amortised** now.
Two details are load-bearing: **`potential()` returns `goal` beside `short`**, because amortising
toward an attack the Pokémon will never afford prices a road it is not on; and **`survivesCharge`
discounts only the Active**, graded rather than a cliff.

**Who gets sent up.** *16 Aug.* Promoting, being Whirlwinded up and choosing a Switch target were three
nearly-identical formulas with no obligation to agree. **They are one `promoteValue` now — keep it
that way.** Survival inside it is priced with **the retreat rule's own arithmetic**, because it is the
same bill read from the other side and one formula cannot disagree with itself. **The sacrificial
promote survives for free**: a bare Basic has nothing invested, so feeding it stays cheap without a
rule saying so.

**Two things the scorer could not see at all.** *16 Aug, both omissions rather than misjudgements.*
**Attacking while Confused had no price**, and **both directions are asserted** — "never attack while
Confused" would be worse play than the bug. *The generalisable half: the retreat rule learned about
Confusion on 13 Aug and the attack path never did. **Check any decision that reads `status` for one
branch and not its siblings.*** And **recoil is waived when the defender prevents the damage** — see
[Rulings/PREVENTED-DAMAGE-RECOIL.md](Rulings/PREVENTED-DAMAGE-RECOIL.md) — priced at `f.pStopped`
rather than as an on/off switch, so it does not become entry seven in the cliff table above.

**Don't lose the game either.** *16 Aug, the exact mirror of "win the game if you can win the game".*
A 10 HP Electabuzz Knocked out its target, killed itself, handed over the last Prize and lost on the
turn it scored — rated 73.5 against a safe alternative at 33. **An average hid it, and that is the
part that generalises:** expected recoil was 5, and this scorer is built on expected value, so *any*
catastrophic minority branch is invisible to it by construction. **It had to be a different kind of
term, not a bigger one** — a self-Knock-Out that *ends the match* is charged `lastPrize`, not
`selfKO`, because no value of `selfKO` fixes this without breaking every ordinary recoil decision.
**Losing is not a large Knock Out.** The win shortcut in `choose()` needed its own guard, because it
returns a near-certain lethal *before any scoring runs*. **Where to look for more of these: anywhere
the scorer averages over outcomes and one of those outcomes is terminal.**

**Your own deck is a resource, and running out of it loses.** *16 Aug, from two of Trevor's grab bag
items that turned out to be one.* The bot understood decking *you* out as a weapon and had no concept
of doing it to itself. Two terms, and the split is the recoil work's lesson reused: `deckBurn` is a
cost on the **squared share of what remains**, and `deckLoss` is terminal for a play that empties the
deck outright. **It is a curve and not the floor at 20 cards the report asked for** — a floor is the
cliff shape in the table above and would make 21-vs-19 a personality change — but the *band* is
Trevor's, settled by showing him the table: `deckBurn` is set so the band runs 20 down to 10.
**Gambler is priced on NET change and must not be capped alongside Bill:** it is the only recycling
card in the game, and its credit has its own weight (`deckRecycle`) rather than sharing `deckBurn`.
That split is load-bearing — the two were one number, and widening the burn band would have quietly
made recycling pay more than a Knock Out. ***A constant doing two jobs gets retuned for one.***

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

**The Energy pool is asked of the engine, not read off the printed cards.** *18 Aug.* `potentialOf`
built its symbol pool from `db[e.id].provides`, which is what a card prints — not what it *provides
where it is attached*. **That made the whole Charizard archetype invisible to the bot.** Fire Spin
costs `RRRR`; a Double Colorless on a Charizard is `RR` under Energy Burn and is the best attachment
in the deck, but read off the card it is `CC`, which pays nothing toward `RRRR`. Attaching one moved
`short` from 4 to 4 and scored **4.4 against a Fire Energy's 33.0**, so the bot never did it — four
dead cards in a sixty-card deck built around them. It now reads `E.slotSymbols(slot)`, which resolves
Energy Burn *and* the per-instance `asEnergy` override, so a Buzzap'd Electrode was mispriced by the
same line and is fixed by the same change. **Never re-derive what a slot provides; ask the engine.**

**Why no gate caught it, which is the transferable part.** Energy Burn is *passive* — there is no verb
to leave unscored and no action to leave unoffered, so both coverage checks were correct and silent.
`powertest.js` asserted the **engine** saw `RRRR` and it did. The AI was keeping a private copy of a
question the engine already answers, and a private copy is exactly what neither gate can see. **When
the AI recomputes something the engine exposes, that is the bug shape to suspect.** Worth 2.4 points
to the Charizard deck in `decksim` and 8.9% of games in `abtest`, with the field win rate unmoved —
and it moved no other deck in the roster, because no other deck runs Double Colorless. Found by
Trevor asking whether the bot knew a DCE turns into Fire.

**The bot may not choose its own Prize, and that is a self-restriction rather than a gap.** *19 Aug
2026.* Prizes are face down, and `ai.js` reads full engine state — so letting it pick would hand it
Peek's entire value for free, in every game, forever. It takes one at **random**. Exactly the same
reasoning as scoring `PEEK` at −Infinity, and the same shape as the Challenge restriction Trevor asked
for in Job 10: **the bot may only act on what it could legitimately know.**

**The one exception is the one that makes it fair.** Once somebody has played *Here Comes Team
Rocket!* every Prize is face up **to both players**, the information is public, and a bot picking at
random would be playing badly on purpose. So `prizeIndex` runs only when `state.prizesFaceUp`, and
`powertest.js` asserts both halves — random while face down, the useful card while face up.

**It reuses `cardKeepValue` rather than having an opinion of its own**, which is the part worth
copying. That per-card scoring was inlined in `handKeepValue` (Trevor's rule, 16 Aug: evolutions you
can use, Energy you are short of, Trainers are real cards) and was extracted so the Prize picker could
share it. **A second opinion about what a card is worth would have drifted from the first**, and the
bot would have valued the same card differently depending on where it was looking at it from.

**The player's own picker is a setting rather than a realness gate, and the first design here was
wrong.** I proposed gating it on whether the engine could see that the choice was real — the
`energyChoiceIsReal` pattern — and Trevor pushed back. The analogy does not hold: with Energy the
*engine* can judge realness objectively, while with a Prize only the player can, so the gate would
have taken the decision away in both directions. *[The setting, and where it lives →](INTERACTION.md)*

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
3. **`prizeIndex` is unmeasured.** It fires only while Prizes are face up, which is rare, and it
   inherits `cardKeepValue`'s weights rather than adding its own — so there is nothing new to tune,
   but nothing has duelled it either. It cannot go on `selftest.js`'s `PROVISIONAL` list, which holds
   effect verbs, so it is recorded here instead.
4. **The AI is not told about `progress.lost`, difficulty per bracket, or anything the ladder knows.**
   Every opponent plays at the tier deck select hands them. Whether a named rival should play better
   than a Club Master is an unasked design question — see [PROGRESSION.md](PROGRESSION.md) and
   [OPPONENTS.md](OPPONENTS.md), which argues the AI probably should *not* be the dial.

# Shadowless — the opponent AI

Depth behind the AI row in `CLAUDE.md`'s status table. **Read this before changing anything in
`src/ai.js`** — how the bot scores, where it can fail without anything going red, and the invariant
each shipped change left behind.

**Before you believe a number that says the bot got better, read [MEASUREMENT.md](MEASUREMENT.md)
instead.** That is the other half of this file: the three instruments, every way they have lied, how
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

**Seven instances, and it is the most productive sniff test this project has.** A term that should
fall away with distance from an edge, written flat with a cliff at the end:

| Where | Was | Is |
|---|---|---|
| `retreatPrize`'s divisor | Prizes remaining, linear | **squared** |
| `selftest.js`'s ladder gate | a threshold at a sample that could not carry it | a floor plus a significance test |
| Arcanine's recoil | flat, with a cliff only at outright suicide | share of HP remaining, squared |
| `attachBuild` | flat per step | amortised over the attack at the end |
| promotion readiness | `short === 0 ? 25 : 0` | `promoteReady / (1 + min(short, 4))` |
| `survivesCharge` | — | written graded from the start, *because* of the other five |
| the Agility barrier, damage half | flat 0.7 below the frail line — a shield stopping nothing priced like one stopping 60 | **linear in the damage prevented**, through the old constant at half HP |
| the Agility barrier, death half | a `frail` boolean, and priced off a tempo weight at that | **squared** in the same fraction, and priced off `selfKO` |

**The last two rows are the same line of code and they disagree on the curve, which is the most
useful thing in this table.** A barrier does two things at once. *Damage prevented* is a quantity and
is **linear** — stopping 30 is exactly half as good as stopping 60. *Being killed* is a risk and is
**squared** — at half your HP their attack is not close to killing you and the term should be nearly
gone, which is the argument recoil already settled. Writing one term for both would have been wrong
whichever curve it picked. **Reach for this table to spot the cliff, never to pick the curve** —
ask what the quantity *is* first.

Harden was checked in the same pass and deliberately left alone: it absorbs an attack of N or less
and nothing at all above it, so that step is in the card rather than in the model.

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

**A retreat is priced on the Pokemon ARRIVING, not the one leaving.** *21 Aug.* The guard that was
supposed to stop the bot walking into a Knock Out compared `incomingThreat` — the threat against the
Active that is *leaving* — with the remaining HP of the one *arriving*. Those agree only when both
have the same matchup against the attacker, which is precisely when the guard is not needed. The
question is asked with `threatAgainst(pi, b)` now. **`incomingThreat` answers for the Active and only
for the Active**; anywhere a decision is about a different slot, it is the wrong function, and this is
the second time that has cost something — `promote` had the identical fault in Job 9 and the fix was
never carried across. **Two penalties, not one**: dying on arrival is bad, and dying on arrival having
just abandoned a Pokemon that would have *survived* is a conceded Prize that did not have to exist.
Asserted in `powertest.js` from Trevor's own logged position rather than duelled, because the change
is symmetric, it is about perception, and it fires only on a matchup difference — three separate
reasons a duel reports nothing. **It was duelled anyway and it reported nothing**, which is the
prediction holding rather than the change failing: 50.4% ±0.8 against HEAD over 8 seeds on the ladder
pool, with the control at 49.9% ±0.8. Do not re-run it expecting a different answer. `aitest.js` moved
*retreats with nothing threatening the Active* from 50% to 47% and the retreat rate barely at all,
which is the right size for a fault that fires only when the two Pokemon differ in weakness or
resistance.

**Teleport is worth where it goes, and the bot has to choose where that is.** *21 Aug.* `selfSwitch`
scored `frail ? dangerSwap : 2` — flat, and blind to the Bench — so an even swap and a rescue were the
same number. It is a **difference in `promoteValue`** between the best benched Pokemon and the Active
now, which makes a mirror swap worth exactly zero without a rule saying so, and prices dying on both
sides for free because `promoteValue` already does. **The larger half was invisible to any score**:
nothing in `ai.js` had ever written `opts.bench`, so `SWITCH_SELF_CHOOSE` fell through to the engine's
`this.pick()` — a seeded random. That is the triggered-Power gap in this file arriving through an
attack instead of a Power, and the same remedy applies: **the scorer fills in `a.opts` while it
scores**, so the fallback is never reached. A `may` version can decline, and does, by writing
`bench: -1`.

**`promoteValue` on the ACTIVE slot re-enters `scoreAttack`.** *21 Aug, and this is a trap rather than
a feature.* `promoteValue` → `potential` → `scoreAttackHypothetical` → and for the Active that last
one *is* `scoreAttack`. Any new caller of `promoteValue` from inside `scoreAttack` needs the same
re-entry guard `bestSelfSwitch` carries, or the stack dies on the first board where the attack is
legal. Nothing caught it for the length of a full suite run: **no theme deck holds a self-switch
attack**, so 402 assertions and 144 complete games passed with the loop sitting there. It has its own
regression test now.

**An Energy paid for a retreat costs what an Energy lost costs.** *21 Aug.* The retreat rule charged
`cost * 4` for the Energy it discards while `retreatSaveEnergy` credits **7** for the same commodity
two lines below — one function, one Energy, two prices, so a retreat that spent two to save three came
out ahead by more than the one Energy it actually netted. Trevor's argument is economic rather than a
preference: **you may attach one Energy per turn, so an Energy is a turn**, and it is gone in exactly
the sense `retreatSaveEnergy` already measures. Both are `retreatSaveEnergy` now. `retreatBase` is
**purely tempo** from here — the turn spent, not the cards; do not read it as covering Energy again.

**A wall's low damage is not a deficiency, so it is not an upgrade opportunity either.** *21 Aug.* The
tempo half of the retreat rule compares the best affordable printed damage of the Bench candidate
against the Active's — and **Chansey's is Scrunch at zero**, which made every benched Pokemon read as
an upgrade every single turn. Trevor: *"Chansey is meant to go in there, use Scrunch, and stall while
everything else is powered up on the bench, ending in a sacrifice."* The positive half of that delta is
suppressed by `wallScore` now, reusing the same derivation the rescue term uses rather than inventing
a second notion of what a wall is. **Asymmetric on purpose**: swapping a wall out for something
*weaker* is still a real loss at full price. It is only *"I could be hitting harder"* that stops being
a reason.

**Both are asserted, and both are near-invisible to a duel.** Measured together on the ladder decks:
retreats **7.1 → 6.0 per 100 turns**, Energy burned on retreat costs **8.2 → 6.1** — a 26% drop — and
games got measurably *longer*, which is what less Energy churn looks like. The benchmark deck moved
from 8th to 7th of thirteen. That last figure is the point of the benchmark and not a small result: see
[MEASUREMENT.md](MEASUREMENT.md).

**Ammunition is not surplus.** *21 Aug.* An attack that discards its own Energy to fire turns spare
Energy into rounds, and the surplus rule — which refuses an attachment that unlocks no new attack —
hard-capped Charizard at four. Measured: a fifth Fire scored **−2**, Active or benched. Fire Spin
discards two cards per use against one attachment per turn, so **the bot could never fire it twice in
a row**, which is the entire deck. `ammoSymbols()` derives the headroom from the `COST_DISCARD_ENERGY`
verb rather than from a list of cards, so every card carrying it gets this for free and the other
1,200 are untouched — there is a test asserting Hitmonchan still caps. `COST_DISCARD_ALL_ENERGY` is
deliberately excluded: Wildfire discards any number, so "how much is useful" is unbounded and a
headroom figure would be a guess dressed as a derivation.

**This is the change that moved the benchmark**, and it is the largest single move the AI has had:
`b1_t4_fire` went from **8th of 13 at 46.9%** in the morning to **6th at 52.8%**, above five decks it
had been below. Both halves of it came out of Trevor describing how he plays the deck — the other
half is an engine fix and lives in [ENGINE.md](ENGINE.md)'s `takeEnergy` section, because the pay
order was discarding the Double Colorless first on the one Pokemon where it is worth two Fire.

**A rider is worth nothing on a Pokemon the attack removes.** *22 Aug.* Paralysing a corpse buys no
turn — the Knocked Out Pokemon leaves and a fresh one arrives unafflicted — but the status block had
no lethality term, so Gyarados scored Bubblebeam at **293 against an equally lethal Dragon Rage's
280** and spent an extra Water on a coin that could not land on anything. Every rider in that block
takes `1 - pLethal` now: statuses, jam, Amnesia's attack lock and an Energy strip. **It is a
proportion and not a switch**, the same per-outcome discipline `expUseful` uses — at half lethal the
status matters in exactly the half of the distribution where they are still standing. **`drag` is the
one exception and it is deliberate**: it acts on the Bench, and if the attack kills, the promote
happens regardless — only *who picks* differs, which is worth the same either way. **The guard already
existed one flag over and had never been generalised** — `f.flags.bounce` has carried `pLethal < 0.9`
since it was written. *That is the transferable part: when you find a guard on one rider, check its
siblings in the same block* — the same lesson the Confusion work left, arriving from a new direction.

**A barrier is worth what it prevents.** *22 Aug, and it is cliff instance seven.* `shieldSelf` was
flat at 0.7 below the frail line, so Fearow's Agility scored an identical **27.00 against an incoming
0, 30 and 60**. It is linear in `min(danger, hpLeft) / hpLeft` now, with the coefficient chosen so the
curve passes through the old constant at **half HP** — every board the flat value got about right is
unchanged and only the two ends move. **The frail multiplier is untouched**, so nothing above the line
changed at all. Both halves came from Trevor naming Agility, Rapidash and Seadra as one shape with
Ice Beam: *spend a turn on the weaker attack to buy a turn.*

**A turn taken away is worth the attack it denies.** *22 Aug, and it is the other half of the same
idea.* `paralyze` was a flat **26** whether the opponent was a charged Zapdos or a Chansey with no
Energy — a constant standing in for a quantity that is entirely about the board. **The old constant
was the average board, and not loosely**: this file measures the format's mean attack at 25.4 printed
and 27.0 expected, so 26 *is* that mean. Dividing by it makes the term read the real opponent while
reproducing every old value against an average one. **Paralysis, Sleep and Confusion scale;
`incomingThreat` capped at the attacker's own remaining HP is the quantity, and it is the same
`denied` the barrier reads two blocks down** — declared once at the top of `scoreAttack`, because
Trevor's point is that these are one idea and the code should say so.

**Poison is pointedly excluded and that exclusion is the whole reason `DENIES_A_TURN` is a table.**
Poison is damage over time, not a turn taken away — it ticks whether or not they could ever attack,
so reading it off their threat would price a real unconditional clock at zero against an empty board.

**There is no share-of-a-turn table, because the weights already are one.** 26 / 22 / 15 is
1 : 0.85 : 0.58, which is how much of a turn each takes away, priced when they were written. A second
table would have applied that ratio twice. **When you add a dimension to a weight, check the existing
weights are not already carrying it.**

Measured: Dewgong takes Aurora Beam against a Chansey with no Energy, Ice Beam against a charged
Electabuzz or Zapdos, and Aurora Beam whenever it is lethal — which is Trevor's rule, including the
clause he supplied on being asked. **The break-even is an incoming 40**, where the extra 20 damage
and the half-chance of denying 40 are genuinely equal and the tie goes to damage. `abtest`: **40.8%
of games diverged**, win rate 49.6% → 49.9%.

**Both were asserted in `powertest.js` and every failing test was watched going red against the
pre-fix engine first.** Several deliberately stay green in the control — they assert what must *not*
have moved, and a guard that cannot fail is not a guard.

**Two of those assertions then went red on the turn-value change, and that is worth more than the
tests themselves.** They used a bare Chansey to mean *"a target that survives"* — a complete board
while a rider was worth a flat 26, and an ambiguous one the moment a bought turn started reading
threat, because an unarmed Chansey now satisfies *survives* and *buys nothing* at the same time. The
fix was four Fighting Energy, not a weaker assertion. ***A fixture encodes the model that was true
when it was written**, and it only warns you when it fails.*

**A barrier that saves your life is priced as a life.** *22 Aug, and it is the Energy-priced-twice
fault in a new place.* `selfKO` charges **70** for a Pokemon the bot kills with its own recoil, while
preventing exactly that outcome credited `0.5 × shieldSelf × 1.6` = **16**. One event, two prices, and
the cheap one was the defensive side — so Fearow took Drill Peck's 40 over the Agility that was its
only out at 36, on a board where the incoming attack kills it. **Two terms now, because two different
things are being prevented and they have different shapes** — see the last two rows of the cliff
table. **The `frail` boolean is gone from this decision**: it was a step standing in for the top of a
curve, and once the curve reaches the top on its own, keeping it would only reintroduce the
discontinuity. `frail` is still computed, for `destinyBond`.

**The guard that matters here is that lethal still wins**, because raising the defensive side is
exactly the change that could break Trevor's *"unless Drill Peck can kill"*. It is pinned in
`powertest.js`, and `aitest` reports **0 turns ended holding a game-ending lethal**.

**Measured against the playbook rather than against a duel: five of the eight unverified cards in
that pattern already behaved, and the two that did not were one cause.** Rapidash, Marowak, Venonat,
Grimer and Cloyster-under-threat needed nothing; Fearow and Seadra needed this. *That ratio is the
argument for building the boards rather than reasoning about them* — the two that failed were not the
two anybody would have guessed, and three of the five that passed had been on a list of suspects.

**Where the next ones come from.** Every AI fault found on 21 Aug 2026 came from Trevor describing how
a card is meant to be played, in plain English — the wall retreat, the Energy-is-a-turn pricing, the
Charizard cap, the discard order. **None came from a tag, a weight sweep, or a duel.** That list now
has a home and a format: [PLAYBOOK.md](PLAYBOOK.md). It is an oracle rather than a data feed — the
notes say what the right play is, and **the fix goes in the general scorer, never in a per-card
branch.** If an entry can only be satisfied by special-casing the card, that is a finding about the DSL
or the scorer, not a licence.

**Its unit is the PATTERN and not the card**, reshaped 21 Aug 2026 once all four original entries
turned out to generalise to a family — which the sentence above makes inevitable rather than lucky.
Sixteen patterns were clustered out of 65 cards Trevor had already annotated in the workbook's `Wants`
column. **If you are about to change a scoring term, that file's last table says which patterns bear
on it.**

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
4. **`evolve` cannot see readiness, and fixing that ALONE would make the bot worse.** Measured 21 Aug
   2026: evolving scores a flat **31.0** whether the target holds one Energy or three — there is no term
   anywhere for whether the evolved form can attack. Trevor named it from play ("the AI evolves pokemon
   as soon as it can rather than as soon as it's ready"), and Vileplume is the clean case: Gloom attacks
   for one Energy, Vileplume's only attack costs three, so evolving early buys a silent Active.

   **The trap is that it is coupled to the attach rule and the coupling runs the wrong way.** Attaching a
   third Grass to a Gloom scores **−2**, because `potential`'s `short` is the distance to the *cheapest*
   attack the card can reach and both of Gloom's are already paid. So the bot cannot walk a Gloom to
   three Energy — **and evolving is what unblocks it**, since Vileplume's shortfall of 1 then reads as
   real progress. Penalise early evolution on its own and Vileplume is stranded at two Energy forever.
   Verified in a constructed position, not reasoned about.

   So the order is fixed: the attach rule first, or neither. And the attach half is **not** the general
   cliff fix — Trevor's own doctrine is that Chansey should *not* walk up to Double-edge one card at a
   time, so the cliff is right there and irrelevant here. What Gloom needs is narrower: **when the
   evolution is in your hand, the target's shortfall should be measured against the evolved form.** One
   specific, cheap case rather than lookahead in general.

5. **The AI is not told about `progress.lost`, difficulty per bracket, or anything the ladder knows.**
   Every opponent plays at the tier deck select hands them. Whether a named rival should play better
   than a Club Master is an unasked design question — see [PROGRESSION.md](PROGRESSION.md) and
   [OPPONENTS.md](OPPONENTS.md), which argues the AI probably should *not* be the dial.

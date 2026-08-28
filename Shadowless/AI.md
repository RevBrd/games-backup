# Shadowless — the opponent AI

Depth behind the AI row in `CLAUDE.md`'s status table. **Read this before changing anything in
`src/ai.js`** — how the bot scores, where it can fail without anything going red, and the invariant
each shipped change left behind.

**Before you believe a number that says the bot got better, read [MEASUREMENT.md](MEASUREMENT.md)
instead.** That is the other half of this file: every instrument in the project that is not
pass/fail, how to read a saved match log, and the standing figures. **Nothing here tells you whether
a change worked.** If you are holding a duel result, a playtest report or a match log, you want that
file.

The one-line summary: **the AI is an expected-value scorer over enumerated coin-flip outcomes, and
its one structural weakness is that a verb it cannot score costs nothing at runtime and is misplayed
forever.**

**This file is the model. Every shipped invariant is in [AI-INVARIANTS.md](AI-INVARIANTS.md)** and
its [archive](AI-INVARIANTS-ARCHIVE-1.md) — one entry per change, each stating what must stay true.
The index to them is below, so you can find the one you need without opening either.
**Deliberately not counted**: this sentence said *twenty-three* for four days after it stopped being
true, in two files at once, while the index table below silently kept telling the truth. The table
is the count.

**Where the fuller account of each fault lives is a table in that file's header, not a sentence, and
the reason is worth thirty seconds.** The sentence version has been written three times and gone
stale three times — first as *"it is all in `GRABHIST.md`"*, corrected 19 Aug to *"ten of the twelve
are"*, and wrong again by 22 Aug when the playbook work started leaving its accounts in
[`Playbook/`](Playbook/) instead. Each version was true when written. **A claim about where something
is duplicated is a claim about two files, and it decays whenever either one moves** — so it is
maintained as rows you can check rather than a count you would have to re-derive.
*[The refusal that cited the blanket version, and why it expired →](HISTORY.md)*

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

**The most productive sniff test this project has**, and the table is the count — the prose said
*eight* above nine rows, and `CLAUDE.md` said six, which is the sniff test's own lesson arriving in
its own section. A term that should fall away with distance from an edge, written flat with a cliff
at the end:

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
| an Energy discard | flat, 7 a card, however much or little was left behind | **turns of silence, squared**, and discounted by whether it lives to feel them |

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

**Every change, each with a rule that must stay true, and they are in
[AI-INVARIANTS.md](AI-INVARIANTS.md).** They moved there on 22 Aug 2026 because the section had
become a register — append-only, one entry per shipped change, growing by three or four every AI
pass — sitting inside a file that is supposed to be the model and had reached 549 lines because of
it. **Everything before Job 11 is one door further along**, in
[AI-INVARIANTS-ARCHIVE-1.md](AI-INVARIANTS-ARCHIVE-1.md), split off 25 Aug 2026 at 471 lines. An
archived invariant binds exactly as hard as a recent one; the rows below say which file each lives in.

**† marks an entry in [AI-INVARIANTS-ARCHIVE-1.md](AI-INVARIANTS-ARCHIVE-1.md); the rest are in the
live file.** **Read the entry before you touch the term.** Every row below is a rule somebody paid for with a
wrong version first, and several of them look like arbitrary constants until you know what they are
holding up. **The `Term` column is the index**: grep it in `ai.js`, then read its entry.

| When | The invariant | Term |
|---|---|---|
| 13 Aug † | The retreat re-tune is a **curve, not a number** — do not replace the squared divisor with a scalar | `retreatPrize` |
| 13 Aug † | **Stickiness is derived, not tagged**, terminal Basics only, matched by effect verb — and it suppresses the rescue, never the Prize | `STALL_VERBS` |
| 13 Aug † | Weakness and Resistance reach the retreat comparison; the AI can never predict a number the engine would not produce | `bestAffordableDamage` |
| 14 Aug † | Recoil is priced on **what it leaves you**, squared, meeting the old cliff exactly; overkill is not paid for, and `expUseful` is a second field rather than a cap in place | `expUseful` |
| 16 Aug † | An attachment that could never make anything bigger is refused — and the carve-out for retreat is one slot wide | `potential` |
| 16 Aug † | **Progress is worth a share of what it is progress toward**, amortised, and only toward an attack the Pokémon can actually afford | `attachBuild`, `goal` |
| 16 Aug † | Promote, Whirlwind and Switch are **one formula**, priced with the retreat rule's own arithmetic | `promoteValue` |
| 16 Aug † | Attacking while Confused has a price, and **both directions are asserted**; prevented damage waives recoil proportionally | `f.pStopped` |
| 16 Aug † | **Losing is not a large Knock Out** — a self-KO that ends the match is its own term, because an average hides a terminal branch | `lastPrize` |
| 16 Aug † | Your own deck is a resource: a squared cost on what remains, a terminal one for emptying it, and Gambler priced on **net** | `deckBurn`, `deckRecycle` |
| 18 Aug † | Opening placement ranks **stranded last** and then sorts by HP — and it stays in `engine.js`, because the player's auto button calls it too | `setupAuto` |
| 18 Aug † | **Never re-derive what a slot provides; ask the engine.** Reading Energy off the printed card made the whole Charizard archetype invisible | `slotSymbols` |
| 19 Aug † | The bot takes a Prize at **random** unless they are face up — it may only act on what it could legitimately know | `prizeIndex` |
| 21 Aug | A retreat is priced on the Pokémon **arriving**, not the one leaving; `incomingThreat` answers for the Active and only the Active | `threatAgainst` |
| 21 Aug | A self-switch is worth **where it goes**, and the scorer fills in `a.opts` so the engine's random fallback is never reached | `selfSwitch` |
| 21 Aug | **A trap:** `promoteValue` on the Active slot re-enters `scoreAttack`. Any new caller needs the re-entry guard | `bestSelfSwitch` |
| 21 Aug | **An Energy is a turn**, so a retreat pays the same price a lost Energy costs. `retreatBase` is purely tempo from here | `retreatSaveEnergy` |
| 21 Aug | A wall's low damage is not a deficiency, so it is not an upgrade opportunity — asymmetric on purpose | `wallScore` |
| 21 Aug | **Ammunition is not surplus.** Headroom is derived from the discard verb, not from a list of cards | `ammoSymbols` |
| 22 Aug | A rider is worth nothing on a Pokémon the attack removes — a **proportion**, not a switch, and `drag` is the exception | `1 - pLethal` |
| 22 Aug | A barrier is worth what it prevents, **linear** in the damage stopped | `shieldSelf` |
| 22 Aug | A turn taken away is worth the attack it denies; Poison is excluded because it is a clock, not a stolen turn | `DENIES_A_TURN` |
| 22 Aug | A barrier that saves your life is priced **as a life**, squared, off `selfKO` rather than off a tempo weight | `shieldSelf`, `selfKO` |
| 23 Aug | A discard costs **turns of silence**, squared, discounted by survival — and it reads the CHEAPEST attack, never the best | `discardSilence` |
| 23 Aug | A rider is worth nothing on a Pokemon that **already has it** — but Paralysis refreshes, so it is exempt | `statusNovelty` |
| 24 Aug | **A rule proven in `scoreAttack` does not reach `scoreTrainer`.** Three rider rules were missing from the Trainer path entirely | `pLethalThisTurn` |
| 25 Aug | Three PROVISIONAL Power cases referenced a `me` this function never defines and crashed the instant a deck actually fielded one — none had ever been reached before | `SEARCH_EVOLUTION_TO_HAND`, `STATUS_COIN_EITHER_POWER`, `DISCARD_THEN_DRAW` |
| 28 Aug | **Ammunition is only ammunition if you have nothing else to shoot with.** The discard verb was too wide a derivation on its own — a card that DRAINS and owns a free attack stockpiles nothing | `ammoSymbols` |
| 28 Aug | **A Pokemon about to become something else is not paid up.** Shortfall is measured against the evolution when it is in hand, and `evolve` waits until one Energy short of it. Shipped on a measured NULL | `evolutionInHand`, `potentialAs`, `evolveEarly` |
| 28 Aug | **One of the twins gets fed.** The evolution ROAD is rationed to the most-invested copy that is not yet ready — the other keeps its own road, so it is resistant and never blocked | `evolutionRoadFor`, `benchDuplicate` |

**Where the next ones come from.** Every AI fault found on 21 and 22 Aug 2026 came from Trevor
describing how a card is meant to be played, in plain English — the wall retreat, the Energy-is-a-turn
pricing, the Charizard cap, the discard order, and then a whole family of attack choices out of one
sentence about Agility and Ice Beam being the same idea. **Ten faults, and not one came from a tag, a
weight sweep, or a duel.** That list now
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
4. ~~**`evolve` cannot see readiness, and fixing that ALONE would make the bot worse.**~~ **BUILT
   28 Aug 2026, both halves in one commit, from Trevor's account of how the GBC game does it.** Evolve
   scored a flat **31.0** whether the target held one Energy or three; on the Vileplume case it now
   reads 15 / 23 / 31 / 31 as the Gloom is fed, and the bot evolves at **one Energy short of the
   evolution's cheapest attack** rather than as soon as it legally may.

   **The coupling this item warned about was real and the blocker was one level higher than predicted.**
   It named `attachValue` as the thing to fix; the actual refusal came from the **surplus rule** above
   it, which returns `attachSurplus` before `attachValue` is called at all. A Gloom on two Grass can
   pay for Foul Odor, so `noProgress` was true and the third Grass was refused at −2 no matter what
   `attachValue` thought. It took a fourth exception — *a Pokemon about to become something else is not
   paid up* — bounded by the evolution's own cost.

   **It reads as a NULL on win rate and it shipped anyway.** `aiduel 8 --gbc` against HEAD: no
   significant difference, `--control` likewise, so the null is real rather than a broken harness. The
   change does fire — 228,832 attachments became 229,737 over 17,672 ladder games. **Do not inherit
   "this helped" from the fact that it shipped.** *[The three grounds, and the two clauses of Trevor's
   note left unbuilt →](Playbook/EVOLUTION-TIMING.md)*

5. **Sleep against Paralysis: two methods disagree and the weight was left alone.** Reading `endTurn`
   says a Sleep costs **0.67** of a turn — the wake flip runs on both Actives every turn end, so the
   series is 0.5 + 0.125 + …. Measuring 130 games says **1.20**, against Paralysis' exact 1.00. The
   current weights say 0.85. **Three answers, no two alike**, and the measurement rests on twenty
   applications, which is not a sample. Trevor raised it from play (*"even a sleeping opponent has a
   50/50 chance of waking up before missing a turn"*). **Do not retune `sleep` off either number.**
   What settles it is an instrument that counts turns lost per *application* rather than sampling the
   board — the crude one cannot separate a re-application from a persistence — run wide enough to
   carry an interval. *[The rest of that thread →](Playbook/ATTACK-CHOICE.md)*
6. **A status is a free cure away, and the bot does not know — measured at 6.2%, so it was not
   built.** `engine.js` clears status on evolution, so any afflicted Pokemon whose evolution is in
   hand escapes for nothing. Half of all Active observations can evolve, but the evolution is
   actually in hand for only 6.2% of them, which is inside the noise of every weight here. Recorded
   because **the reasoning generalises even though the number does not**: it is public knowledge
   whether a card has an evolution, so this could be priced without ever reading their hand, and
   `namesWithAnEvolution` already exists. Revisit if a set arrives with far denser evolution lines.
7. **The AI is not told about `progress.lost`, difficulty per bracket, or anything the ladder knows.**
   Every opponent plays at the tier deck select hands them. Whether a named rival should play better
   than a Club Master is an unasked design question — see [PROGRESSION.md](PROGRESSION.md) and
   [OPPONENTS.md](OPPONENTS.md), which argues the AI probably should *not* be the dial.
8. **The failing rows in `tools/claims/` are open AI faults, and they are not listed here on
   purpose.** From 23 Aug 2026 a claim out of Trevor's workbook is a row the bot is held to, and a red
   one is a fault report rather than a broken build. **`node tools/claimtest.js` is the live list**
   and `--open` is the sub-list of clauses with no term to assert against at all.

   Copying them into this file would create exactly the duplication claim that has gone stale three
   times at the top of it. **What belongs here is the shape.** The first eleven rows produced one on
   the day the harness was built — *an attack's cost to its own future is underpriced against its
   damage* — and it shipped the same day, so the entry that would have described it is an invariant
   rather than an open item. See `discardSilence` in [AI-INVARIANTS.md](AI-INVARIANTS.md).

   **And a red row can mean the CLAIM is wrong — 28 Aug 2026, and it had not happened before.**
   Arcanine GP's row asserted Quick Attack at four Fire and was red for two days while two sessions
   looked for a missing term in attack choice. Trevor's answer was that the bot was right and the
   fault was one decision upstream, in what it ATTACHED. **A red row localises a fault to a card, not
   to a verb** — check which decision is actually wrong before pricing the one the row is written
   about. The row was rewritten to assert the correct behaviour rather than deleted.
   *[The rule that came out of it →](AI-INVARIANTS.md)*

   **One clause survives and it is worth naming, because three cards ask for it rather than one.**
   Nothing prices holding an attack **in reserve**. Arcanine wants Take Down to stay affordable while
   it attacks with Flamethrower, and the discard rule cannot express that — what it measures is being
   unable to act *at all*, and Arcanine can always act. Ninetales' *"never be required to choose
   between Lure and nothing"* and Charmeleon's refusal to spend down the funnel it is saving for
   Charizard are the same shape. **Build it once for the family or not at all**, and ask Trevor first:
   this is the half he flagged himself, and it may belong with [Ammo](Playbook/AMMO.md)'s open
   Charmeleon note rather than standing alone.
   *[How a note becomes a row →](PLAYBOOK.md)* · *[the harness and its control →](TOOLING.md)*
9. **"Energy is a resource with somewhere else to be" — MEASURED 28 Aug 2026, and two of its three
   halves are already done or would do nothing.** This is the capability [Ammo](Playbook/AMMO.md)'s
   Charmeleon note, its Arcanine GP note and [Evolution timing](Playbook/EVOLUTION-TIMING.md) all
   name as their blocker, so it is worth knowing what is actually left before anyone scopes it as one
   large job. Trevor's sentence decomposes into three, and they are in very different states.

   **(a) Misrouting — putting the card on the wrong slot. Effectively solved: 0.26%.**
   `aitest.js 8 --gbc`, **17,672 games and 228,832 attachments**: 3% surplus (the target could
   already pay for everything it owns), 1% inert (still short afterwards and no new attack), and
   **605 misdirected — 0.26%, which the report prints as 0%.** That is one attachment in 380. The
   per-slot competition through `attachValue` already routes correctly.

   **Quoted from the 228k-attachment run, not from the 1,540-attachment probe that found it.** The
   scratch probe read 0 of 1540 and would have supported "never happens"; at the real rate it should
   have seen about four. **A rate of one-in-380 is indistinguishable from zero in a sample that
   size**, and the difference between "zero" and "rare" is the difference between a closed question
   and an open one. Both were run; the bigger one is the number.

   **And the neighbouring quantity is 27x larger.** 7% of attachments go onto an Active that dies
   before it can spend them, and 1% onto one that could not attack anyway — 15,117 and 2,462 against
   misdirection's 605. `survivesCharge` already discounts for exactly this and 7% still get through.
   Whether that is a fault or is simply what attaching under pressure looks like is unmeasured, but
   **if anyone goes looking for waste in the attach decision, that is where it is**, and it is not
   the thing this open item is about.

   **Read that null carefully, because it is partly tautological.** The bot picks the highest-scoring
   action, so this counter can only fire when the SCORE disagrees with a `short`-based notion of need.
   It says the scoring is internally consistent. It cannot say the routing is *strategically* right,
   and no local counter can — that question is only answerable by outcome, which means any change
   here has to be justified by `aiduel`/`decksim` rather than by a counter going down.

   **(b) Holding the card when Energy is scarce — real, and near-inert. ~0.1% of attachments.** Only
   **1.4%** of attachments score under 6 at all, and of those only **2 of 1540** were made with six or
   fewer Energy left in hand and deck. Scarcity itself is real at the tail — 8.4% of attachments
   happen with ≤6 left, and a tenth of games end with one or none — but when Energy is scarce the bot
   is nearly always attaching it somewhere that matters. A hold-for-later term would fire about once
   every thousand attachments. **Build it for correctness if you like; do not expect it to move a
   win rate, and do not read a null from `aiduel` as evidence it failed.**

   **(c) Attaching toward a card that is not in play yet — HALF BUILT, 28 Aug 2026.** *"This
   Charmeleon is worth four Fire because a Charizard is coming"* is now expressible, but **only when
   the Charizard is in hand.** `evolutionInHand` plus `potentialAs` give the scorer exactly one card
   of lookahead, and only where the plan is a certainty rather than a probability — which is where the
   weight belongs anyway, and is the arm Trevor's GBC account weights "much higher".
   *[Both halves, the null they measured, and why they shipped →](Playbook/EVOLUTION-TIMING.md)*

   **Two clauses of his note are still open and neither follows automatically.**
   **Evolutions in the DECK** need it as a probability rather than a fact, which is a different kind of
   reasoning from anything in the scorer. **The duplicates rule** — *"on a single pokemon of the same
   name, not duplicates at the same time unless nowhere else to go and energies aren't in short
   supply"* — has its exception clause resting on the scarcity measure (b) above found near-inert, so
   it would be built on a term that fires once in a thousand attachments. **Raise both with Trevor
   rather than assuming they follow from (c) landing.**


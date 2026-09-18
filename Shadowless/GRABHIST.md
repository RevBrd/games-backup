## Grab Bag History

This is optional, I just thought you might want to a place to document what you did. Edit this header or add your own instructions if you'd like.

**Optional means optional, and that is Trevor's line above rather than a courtesy.** Nothing here is
owed. Working an item and writing nothing down is a complete job — you will have told him what you
found in the reply, which is the part that actually matters. Write an entry when *you* think the
finding was worth the finding.

Kept newest-first, one entry per item, with **what it actually turned out to be** — which has
sometimes been something other than what the note said, and that gap is the reason anyone would read
this. A *parked* item is the one most worth writing up if you are on the fence,
because the next instance will otherwise re-derive the same diagnosis from scratch.

**Once an entry exists it is append-only**, like [HISTORY.md](HISTORY.md)
and [LOGBOOK.md](LOGBOOK.md) — that is a rule about *editing*, not about writing. Correct an entry if
it turns out wrong; never shorten one, because a condensed entry keeps the fix and loses the gap. The
200-line target does not apply. The method for working an item in the first place is
[PLAYTEST.md](PLAYTEST.md).

**Grep the date or the quoted report** — every entry opens with Trevor's own words in quotes, which
makes them findable. Newest first, so the batch you want is usually near the top.

**Everything before 30 Aug 2026 is archived, verbatim, and all three archives are closed** — the
table below is the roll of them, each with its own index at the top. **The rule is stated here, at
the top, and not only in the archive**, because a limit written only inside the thing being limited
is read after the decision it was supposed to inform — which is how this file reached **649** the
first time, **526** the second and **547** the third, every one of them with a ~450 rule sitting in
its own header.

**The third overrun is the one that got acted on, and the reason is that it had a name on it.**
This paragraph used to end *"the owner is whoever takes Job 15c"*; Job 15c archived it, at 547, on
2 Sep 2026. The two overruns before that happened while an unnamed version of the same warning was
already sitting at the top of the file being read by people who then did not act on it.
**A deferral with a named owner is a decision; one without is a limit quietly becoming advisory.**
[Archive 3](GRABHIST-ARCHIVE-3.md) took Job 14a and everything older, which is the cut that header
proposed. **[Archive 4](GRABHIST-ARCHIVE-4.md) took Jobs 14b and 15a on 17 Sep 2026** — one
appended entry put this file at 458, and the lint caught it in the same session that caused it.
**When this file passes ~450 again, start `GRABHIST-ARCHIVE-5.md` at a job boundary.**

**Two entries had drifted out of this file's own index, and how they did it is worth thirty seconds.**
The 30 Aug Ninetales entry and the 31 Aug GBC-sequel entry were appended at the **bottom** of the file
as `##` headings, in a file that is newest-first and uses `###`. So they sat below entries a week
older, at the wrong level, and — the part that actually cost something — **neither was ever added to
the table below**, because whoever adds a row is looking at the top of the file and these arrived out
of sight of it. Both were restored to date order and levelled on 2 Sep 2026; their text is unchanged.
**Append at the TOP here.** The instruction is the inverse of `LOGBOOK.md`'s, and getting them
confused is presumably how this happened.

| When | Instance | Items |
|---|---|---|
| 6 Sep 2026 | #37, Job 15e | Long-Distance Hypnosis vs Sleep! — a job that halved itself because the tool sent to verify the card printed the wrong field |
| 5 Sep 2026 | #37, Job 15e | The Fire on Zapdos — the report named the wrong slot, and the fault was that the card that *did* want it could not be fed |
| *30 Aug – 1 Sep* | *#31, #33* | *[Archive 4](GRABHIST-ARCHIVE-4.md) — Jobs 14b and 15a, its own index at the top* |
| *23–29 Aug* | *#25, #27, #30* | *[Archive 3](GRABHIST-ARCHIVE-3.md) — Jobs 12b through 14a, its own index at the top* |
| *19–21 Aug* | *#20, #21* | *[Archive 2](GRABHIST-ARCHIVE-2.md) — Jobs 10.5 and 11, its own index at the top* |
| *13–17 Aug* | *#12, #16, #17* | *[Archive 1](GRABHIST-ARCHIVE-1.md) — five passes, its own index at the top* |

---

### No way to discard a Fossil — the note was literally true, and it was two actions — 17 Sep 2026 (#42)

> *"Might not be UI to discard a Mysterious Fossil from the active spot/bench (and I assume Clefairy
> Doll too)"*

**Exactly right, on both counts, and rarely for this file — no diagnosis gap at all.** `ui.js`
contained **no reference to `discardInPlay`** anywhere. The engine had always offered the action; the
human had no control for it. A Fossil sent up Active cannot retreat and cannot attack, so Trevor was
stuck in front of it until the opponent chose to Knock it Out — and against an opponent content to
build its Bench instead, indefinitely.

**It was two unreachable actions rather than one.** `stadiumAction` — Celadon City Gym's
discard-an-Energy-to-heal — had no control either. The Gym strip states the rule in words and offered
no way to use it, which is the more embarrassing half: that strip was built one job earlier.

**So the fix is an exclusion list, not two buttons.** The action bar now renders any board action
nothing else owns; the types the hand, the Active card, the pickers and the bar already handle are
named in `OWNED_ELSEWHERE`. A type nobody wires up gets a generic button instead of vanishing, and
`selftest.js` asserts every name on that list really is handled somewhere else in `ui.js` — watched
red by putting `stadiumAction` on it. **Discarding asks twice**, because it cannot be taken back and
everything attached goes with it.

**THE SAME DAY, FROM THE OTHER DIRECTION.** [AI.md](AI.md) item 16 is this surface on the bot's side —
an action type with no scoring case is never played by the bot, forever — and the guard for it went in
red on `discardInPlay` a few hours before Trevor wrote this note, for the same card. Neither of us
knew about the other. **Two failures, one shape: an action that exists, is legal, works, and is
unreachable — and nothing anywhere says it is missing.** Trevor found the half a human can see; a
lint found the half a human cannot. *[the bot's half →](AI-INVARIANTS/DOLL-NO-PRIZE.md)*

### Long-Distance Hypnosis — the job that halved itself — 6 Sep 2026 (#37)

> GBC 2 uses (base5) Drowzee's Long Distance Hypnosis like a wrecking ball… I think our bot should
> price this differently, and maybe only use it on turns where its own active pokemon can't attack
> anyway. **Same with the Sleep! trainer card.**

**Off the list, and the interesting part is why it was only half done in the first place.**

Trevor: *"the original job for that one was to tune them together but due to the pokemon power search
issue you found, only Sleep! ended up getting tuned."* The corpus check written into `GRABBAG.md` as
the ten-second way to confirm a GBC 2 card exists prints `c.attacks`. Long-Distance Hypnosis is a
**Pokémon Power**. So the card came back "not in our corpus", the Drowzee half was struck as
describing a card we do not have, and Sleep! was tuned alone.

**A broken verification tool does not just give one wrong answer. It silently cancels the work that
depended on it** — and it leaves behind a *confident written record* saying the work was unnecessary,
which is much harder to notice than a gap.

### What the bot was actually doing

Flat **11.00**, identically, on all of these:

| board | Power | Sleep! |
|---|---|---|
| their Active fresh and charged | 11.00 | prices it |
| their Active **already asleep** | 11.00 | **~0** |
| their Active with **no Energy** | 11.00 | **~0** |
| their Active **about to be Knocked Out** | 11.00 | **~0** |

Trevor's own clause — *only fire when our Active cannot attack anyway* — **was already built and
worked.** The missing half was the three riders that had been shipped for Sleep! on 2 Sep.

### The third code path

`scoreAttack`, `scoreTrainer` and `scorePower` each held "what is a status on their Active worth", in
three different versions, and the newest had none of the rules. **The Sleep! block predicted this in
writing and named the wrong number of places:** *"a rule proven in `scoreAttack` does not reach
`scoreTrainer`, and nothing was going to tell us."*

`statusWorthAgainst` is one home now. The extraction was committed separately and **proven a no-op
first — `abtest` diverged 0 of 3,200 games a side** — so the behaviour change that followed was
attributable to itself.
*[The invariant →](AI-INVARIANTS/STATUS-ONE-HOME.md)*

### The measurement, and a correction to my own reading of it

Restricted to the two ladder decks that field the card: **66.1% ± 1.9 diverged**, first difference at
action 15. The card did **not** go inert — it fires on 16.4% of its chances against 25.5% before.

**An 8-seed run read the subject decks losing 2.2 points and I reported that as a possible
regression. At 3× the sample the gap halved to 1.1 against a ±2.3 interval**, which is what noise
regressing toward zero looks like. Recorded because the smaller number was said out loud first, and
because the temptation with a shrinking effect is to quietly stop mentioning it.

---

### The Fire on Zapdos — the report named the wrong slot — 5 Sep 2026 (#37)

> Zapdos gets a fire energy even though it doesn't want those — log# 04-16-41

**Off the list. True as written, and it was not the fault** — which is [PLAYTEST.md](PLAYTEST.md)'s
whole thesis arriving again, in the direction that is hardest to catch, because the accused decision
really did look wrong.

The board reproduces exactly from the log. Ronald: **Fossil Zapdos** Active on nothing, bench
**Fossil Moltres** holding one Fire, Jolteon, Dratini; two Fire in hand.

```
  4.40 attach Fire to Zapdos      <- chosen, twice
  0.00 pass
 -2.00 attach Fire to Moltres
 -2.00 attach Fire to Jolteon
 -2.00 attach Fire to Dratini
```

**Fossil Zapdos' only attack is Thunderstorm at `LLLL`, so a Fire pays nothing toward it — Trevor is
right.** But it is Active with a retreat cost of 2 and no Energy at all, so the surplus rule's
**escape-route exception** waves it through, and a Fire *can* pay a Colorless retreat. Two turns
later the bot retreated Zapdos, which is the play those two Fire bought. **That decision is
defensible on its own terms.**

**The fault is that Moltres scored `attachValue` 5.40 — HIGHER than Zapdos' 4.40 — and was vetoed to
-2.00.** The bot never preferred Zapdos. It was the only thing left standing.

**Why Moltres was refused:** Wildfire costs `R` and deals nothing. Moltres was holding one Fire, so
an attack was payable, so `potential().short` pinned at **0** and the surplus rule declared the card
finished. Dive Bomb — `RRRR` for 80 — was unreachable in every game ever played.
*[The mechanism and the fix →](AI-INVARIANTS/ATTACK-ROAD.md)*

**Two things worth carrying forward.**

**A defensible decision can be the symptom of an indefensible one somewhere else on the board.** The
escape-route exception was working correctly. It only looked wrong because everything that should
have outbid it had been silently disqualified. **When a choice looks bad, price what it was chosen
*over* before you price the choice** — the passed-over column in a match log is where this lives, and
it is printed on every AI line.

**Two other notes in the same GRABBAG section are the same sentence** — the Lapras one and the base5
Charmander one. Both are pointed at the attack road now rather than left to be re-diagnosed. Whether
they are the same fault is untested; the note on the Lapras item says so.

---

### Evolving before it is ready — the funnel, the veto, and a premise Trevor corrected — 3 Sep 2026 (#36)

> The AI evolves as soon as it CAN rather than as soon as it is READY — Vileplume arrives unable to
> attack.

**Off the list. The rule shipped 28 Aug 2026** as `roadWant` against `evolveEarly`, both halves in one
commit, and this entry is the *residual* measured afterwards — because Trevor asked a good follow-up:
weighting it still seems to allow zero-Energy evolves, so would a **veto** be better?

**No, and the funnel is the argument.** 30 ladder games, every evolve instrumented:

| | count | |
|---|---|---|
| evolves | 98 | |
| **below readiness** (`roadWant > 0`) | **73** | 74.5% — Trevor's observation is correct |
| ...on the **Bench** | 55 | **cost zero.** A benched Pokemon is not attacking anyway |
| ...silencing the **Active** | 10 | could attack before, cannot after |
| ...**un-silenced by the same turn's attachment** | 6 | you evolve *and* attach in one turn |
| ...**genuinely dark afterwards** | **4** | ~0.13 per game |

**A veto would block 73 plays to fix 4**, and one of the four is `Magikarp(1E) -> Gyarados`, +70 HP
for one dark turn, which is one of the best plays in the format. The other three are
Squirtle→Wartortle (+30, dark 1), Staryu→Starmie (+20, dark 1) and Machop→Machoke (+30, dark 2).
**At least one of the four is correct play and the rest are arguable**, so the true fault rate is
below the 6.2% Paras finding that was measured and deliberately not built.

**The penalty is also right to be a penalty.** Its comment says so and names the cases: a status wipe
is 14, a big HP jump is real, and an ON_PLAY Power is priced on its own. A veto forbids evolving to
escape a Sleep or to survive, which is Trevor's own *"usually"* being overruled by a later reading of
the same rule.

#### Two measurements that were wrong on the way, both mine, both worth the correction

**An evolve does not compete with an attack or an attach.** My first probe counted "did a better
action exist" and found 64 of 73 — meaningless, because you evolve *and* attach *and* attack in the
same turn. Nothing was being given up. **When a probe reports a suspiciously high fault rate, check
that the two things are actually exclusive.**

**And `canAct` at evolve time is the wrong moment.** Six of the ten Active silences are un-silenced by
the attachment that follows in the same turn — which is [PLAY-ORDER](AI-INVARIANTS/PLAY-ORDER.md)'s
rule, shipped 31 Aug, doing exactly what it was built to do. Measuring before it runs makes the
scorer look worse than it is. **The readiness rule and the play-order rule are designed to work
together**, and either measured alone reads as a fault.


#### "Cost zero" on the Bench was WRONG — Trevor, 3 Sep 2026, and the correction is measured

**The funnel above reduces 73 to 18 on the line *"55 on the Bench, cost zero — a benched Pokemon is
not attacking anyway"*. That premise is false and Trevor said so:**

> It does matter in terms of bench energy even though they don't need to fight at the moment, because
> if the active pokemon is knocked out something needs to replace it. A bench is very easy to pile up
> with unpowered evolved pokemon that all now have increased energy demands for their minimum attacks.
> Two evolved but fully powered bench pokemon beat four evolved but mostly unpowered pokemon.

**He is right about the mechanism. The cost is deferred, not absent, and it lands on promotion —
which is the worst moment, because you do not choose when it happens.** Measured over 60 ladder
games, 438 promotions:

| | |
|---|---|
| promotions where the arrival could not attack | 57 of 198 sampled — **28.8%** |
| ...of which were **evolved** cards | **19 of 438 (4.3%)** |
| ...which would have been dark as the pre-evolution anyway | 11 |
| **attributable to having evolved** | **8 — 1.8% of promotions, 0.13/game** |

**That last row is the honest size of his argument**, and it is the same order as the Active-silencing
number in the funnel above (0.13/game). So the total exposure is roughly **0.26 events per game**
rather than the 0.13 I reported, and the Bench half of the funnel should be read as *deferred* rather
than as *free*.

**The middle row is the one that keeps the verdict where it was.** Eleven of the nineteen would have
been unable to attack in their un-evolved form too — a Starmie promoted on zero Energy is a Staryu
that could not have attacked either. **Evolving did not cause those and no evolve rule can fix them.**

#### The pile-up is real and evolution is not what causes it

Trevor's *"bench very easy to pile up with unpowered pokemon"* is measured and worse than he put it:
**48.4% of sampled bench slots cannot afford their own cheapest attack.** But only **11.0% of bench
slots are evolved AND unable** — so evolved cards are **23% of the pile**, and the other 77% is plain
Basics benched with nothing on them. **A veto on evolutions addresses at most a quarter of the thing
it is aimed at**, and only the 1.8% of it that is attributable.

#### And the weight does not steer it

Swept `evolveEarly` over 60 games at each value, measuring the attributable debt:

| `evolveEarly` | attributable | per game |
|---|---|---|
| **8** (current) | 8 | 0.13 |
| 16 | 8 | 0.13 |
| 24 | **10** | **0.17** |
| 40 | 4 | 0.07 |

**Non-monotone — 24 is worse than 8 — which at eight events on a Poisson count is noise rather than a
curve.** Even a 5x weight only halves it, and cannot be distinguished from the 24 reading going the
wrong way. **The exposure is too small to tune against with this instrument**, which is the Paras
situation again: recorded because the reasoning generalises, not because the number does.

#### Where that leaves the veto, stated as a disagreement rather than a conclusion

**Trevor's argument is for a GUARANTEE and mine is about a RATE, and those do not settle each other.**
His: *"its bot is never in a situation where it's forced to pay off a deep evolution debt while in the
active spot."* A veto delivers that; no weight can.

**What the guarantee costs is the two exceptions the penalty exists to permit** — evolving to wipe a
status (worth 14) and evolving to survive a hit (a real HP jump). A plain veto forbids both.

**The synthesis nobody has built: a veto WITH those two exceptions.** That is buildable, it gives the
guarantee in the ordinary case, and it keeps the escapes. It was not built here because the measured
benefit is ~0.26 events per game and the change is structural — **but it is the shape to reach for if
the guarantee is what is wanted**, rather than a heavier weight, which the sweep says will not work.

#### The Kangaskhan half, which came out the same way

Trevor, 3 Sep: *"Fetch should almost always ever be the only move even powered up unless there's
absolutely nowhere else to go with the energy. However if for whatever reason Comet Punch **is** able
to be used, it should be."* **So the gate is the ATTACH, not the attack** — and the second sentence
says the bot's Comet Punch choice was right all along, which retires the "fault" recorded in
[Playbook/WALLS.md](Playbook/WALLS.md) earlier the same day.

Measured, Kangaskhan Active against a Chansey, a Hitmonchan on the Bench one short of Special Punch:

| Kangaskhan's Energy | attach to it | attach to the Bench | bot feeds |
|---|---|---|---|
| 1 | 4.40 | **28.50** | the Bench — correct |
| 2 | 4.40 | **28.50** | the Bench — correct |
| 3 | **42.59** | 28.50 | Kangaskhan |

**Two of the three rows are already his rule.** The third is the one live question: at three Energy
one more completes Comet Punch, `attachBuild` sees the payoff, and the wall outbids a Bench that
wants the card. Whether that is wrong depends on how it reached three — *"unless there's absolutely
nowhere else to go with the energy"* is exactly the condition under which reaching three was correct.
**Narrow, arguable, and left for Trevor rather than weighted.**


### The GBC sequel's Potion timing — 2 Sep 2026 (#36)

> Potions applied to the active pokemon seem to be purposefully timed for when they would prevent the
> opponent from killing it on the next turn, rather than as soon as it would be useful, though not
> exclusively so.

**Half of it was already built and the other half had never been asked.** *"Rather than as soon as it
would be useful"* is `healWaste`, which shipped a while back and closed 34% of premature heals. *"When
they would prevent the opponent from killing it"* was not a term anywhere.

**Two faults, and the first one was hiding the second.** The rescue bonus asked whether the Active was
dying and never whether the heal changed that, so it paid full price on every doomed Active — hardest
on the boards where the Potion was most useless, because more damage is what makes a Pokemon doomed.
And the *target* was picked by damage counters before anything was scored, with the rescue bonus then
requiring the winner to be the Active — so on the board where a Potion saved the Active outright, the
card went to a benched Snorlax and the bonus never ran. **Both fixed, `abtest` says 9.4% ± 1.0 of
games diverge, and the win rate is flat at 49.6% either way, which is what a symmetric change looks
like.** *[The invariant →](AI-INVARIANTS/HEAL-RESCUE.md)* · *[the pattern →](Playbook/HEAL-ATTRITION.md)*

**The thing worth keeping is what the probe found on the way.** `tools/claims/base1.js` had a green
row named *"...unless it is life-saving, which is the clause the note turns on"*, standing a Pikachu
on 10 remaining HP in front of a Hitmonchan. Pikachu is weak to Fighting, so that reads 80, and the
Potion took it to 30. **The row was green because of the fault, and the word "life-saving" was doing
no work at all** — the first case in this project of a passing claim protecting a fault rather than a
rule. PLAYBOOK.md warns that a charged Hitmonchan turns a claim into *"...against something about to
kill you"* and makes rows **fail**; this is the same hazard making one **pass**, which nobody
re-reads. **Check the arithmetic of an exception clause, not just the verb the bot chose.**

**And the item's neighbours in that section are not all what they look like.** Trevor's Drowzee
bullet describes *Long Distance Hypnosis* as a 50/50 that can put your own Pokemon to sleep. **That
card is not in the corpus at all** — it is a GBC2-exclusive — and our `base5` Drowzee's attack is
*Nightmare*, `PC` for 10, which sleeps the defender unconditionally with no self-risk. Our `Sleep!`
is one-sided too, per `data/raw/base5.json`, with no cross-check available in the CSVs. So the
reasoning in that bullet is about a card we do not have, and what survives of it collapses into
[AI.md](AI.md)'s open item 5, where the sleep weight is already contested three ways and explicitly
must not be retuned off any of them. **Raised with Trevor rather than acted on.**

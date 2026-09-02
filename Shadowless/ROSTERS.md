# Shadowless — the built rosters, measured

What `tools/decksim.js` actually says when a roster meets itself. [OPPONENTS.md](OPPONENTS.md) is the
**spec** — what a tier is, what a rung has to specify, what the player must bring. This file is the
**report card**: the standings, the assembly rates, and the per-deck numbers behind every claim that
file makes about whether the spec survived contact.

Read it when you are about to build a roster and want to know how the last one went, when a
`decksim.js` run disagrees with the spec, or when you are tempted to move a tier's Prize count. You
need none of it to *write* a rung.

Split out of `OPPONENTS.md` on 19 Aug 2026. The seam is that a session authoring the Jungle roster
wants the spec and the *lessons*, and does not want 630-games-per-deck standings on the way — but the
session arguing with the spec needs exactly those. Both halves are load-bearing and neither wants to
read the other. See [MAINTENANCE.md](MAINTENANCE.md).

**One section per roster, in the order the rosters were built.** The lesson goes back into
`OPPONENTS.md` as a claim with a link; the evidence stays here.

**This is an append-only register and the 200-line target does not apply** — a standing is a
measurement somebody took on a date, and condensing one deletes the only record of it. Correct an
entry; never shorten one. **When this file passes ~450, start the next archive at a set boundary
rather than growing it.** Stated here, at the top, before the decision — four rosters was already 395
lines and there are fourteen sets, so this file was on course to be the longest thing in the tree and
was the one register with no threshold written down. Added 29 Aug 2026 by #30, after finding a roster
that had never been measured at all.

**The threshold fired on 1 Sep 2026 and the rule worked exactly as written**, which is worth one line
because a threshold nobody trips is a threshold nobody knows is real. Adding Challenge 1 took the file
to 539; **Base Set and Jungle moved whole into
[ROSTERS-ARCHIVE-1.md](ROSTERS-ARCHIVE-1.md)** and nothing was edited on the way. Two things in there
are still cited from here and from `OPPONENTS.md` — the Prize-count measurement, and the standing
reason to distrust every number in this file — and the archive's own header names both so they stay
findable.

| File | Rosters | Read it for |
|---|---|---|
| [ROSTERS-ARCHIVE-1.md](ROSTERS-ARCHIVE-1.md) | Base Set, Jungle | the Prize-count measurement, and why the instrument cannot be trusted |
| **this file** | Fossil, Team Rocket, Challenge 1 | the three most recent, and the first non-set bracket |

**A section may be added late.** Fossil's was written eight days after its decks went live, and it
says so in its own heading — **date the measurement separately from the build** whenever the two are
not the same day, or a later reader will attribute the numbers to a bot that did not exist yet.

**Every figure carries the date it was measured and the AI it was measured with.** Deck strength
moves whenever the AI moves — [MEASUREMENT.md](MEASUREMENT.md) has the standing version of that
warning — so a row without a date is not a fact, it is a memory. Re-run the sim rather than quoting
these.

```bash
node tools/decksim.js 45 6 data/base3_decks.json      # the shape of the run behind each section
node tools/decksim.js 20 6 data/base3_decks.json data/challenge1_decks.json   # ...and a merged one
```

## Fossil — Trevor's six decks, built 21 Aug 2026, **measured 29 Aug 2026**

**Live on the ladder since 21 Aug 2026**, alongside the four GBC Grand Masters standing in for the
T1 intro that Fossil's own theme decks would fill. Three T2, two T3, one T4, in
`data/base3_decks.json`, converted from `Fossil Opponent Decks v1.xlsx` with **zero id corrections**.

**This section is eight days younger than the roster and that gap is the finding.** Fossil went live
in the same job as Jungle and was assumed to have had the same treatment; it had not been run
through `decksim.js` at all, while [OPPONENTS.md](OPPONENTS.md) said in as many words that *"every
one has been played by `tools/decksim.js` from both seats"* and `CLAUDE.md` promised this file held
what the sim said about **each** roster. Both were written when three of four were true. **A claim
that quantifies over a growing set has to be re-checked every time the set grows**, and nobody had —
including the pass that split this file out of `OPPONENTS.md`. Found and closed by #30 on
29 Aug 2026; the numbers below are what the run actually said.

```bash
node tools/decksim.js 45 6 data/base3_decks.json                                            # alone
node tools/decksim.js 20 6 data/base1_decks.json data/base2_decks.json data/base3_decks.json  # merged, 220s
```

### The recipe

| | T2 (three decks) | T3 (two) | T4 (one) |
|---|---|---|---|
| Feature weight | 11.5 | 16 | 19 |
| Draw + search cards | 4 – 6 | 7 | 11 |
| Rare Trainers | 1 | 3 – 4 | 3 |
| Basic Energy | 28 | 21 – 24 | 24 |
| Basic Pokemon | 15 – 16 | 7 – 9 | 12 |
| Trainers | 10 | 18 – 20 | 17 |

**The Energy-down, Trainers-up shape holds for the third independent roster, and here it is the
widest it has ever been** — 28 basic Energy down to 21, 10 Trainers up to 20. *Consistency, not
power, is what climbs* now has three rosters behind it and is the most durable claim the recipe has.

**And the row Jungle inverted, Fossil does not.** Jungle's T3 ran five draw-and-search against a T2
on six, the only place a lower tier was better supplied than the one above it, and `OPPONENTS.md`
names that as the likely cause of Jungle's tiers failing to order. Fossil's T3s run **seven** against
a T2 band of four to six. Every one of the six axes above is monotone. **Read that against the
standings below before reaching for the recipe as an explanation of anything.**

### What the sim said

Alone — 45 seeds × both seats per ordered pair, 6 Prizes, expert both sides:

| Tier | Field win rate | Range |
|---|---|---|
| T3 (two decks) | **56.7%** | 51.3 – 62.0 |
| T2 (three decks) | **46.7%** | 37.3 – 54.9 |
| T4 (one deck) | **46.7%** | — |

**The T2/T3 boundary does not separate here, and the T4 sits in the T2 band.** T2's ceiling is 54.9
against T3's floor of 51.3 — overlapping by 3.6 points — and the boss finishes **fifth of six**. It
overlaps in the merged field too, more widely: Fossil's best T2 comes **fifth of nineteen** at 60.0%,
above its own second T3 at 51.4%.

**So the recipe is monotone on all six axes and the tiers still do not order.** That is the strongest
version of this file's standing warning that has been measured: *the recipe is a recipe and not
evidence.* Base Set separated, Jungle did not, Team Rocket did, Fossil does not — **two of four**, and
the one with the cleanest recipe is on the losing side. **Do not respond by tuning the recipe**; it is
not currently known to predict the thing it is being read as predicting.

### The merged field, and the T4 finding that needed three rosters to see

19 decks across base1, base2 and base3 — 20 seeds × both seats per ordered pair, 6 Prizes:

| Tier | Merged | Range |
|---|---|---|
| T3 (five decks) | **57.6%** | 41.9 – 65.7 |
| T4 (three decks) | **48.7%** | 47.1 – 49.9 |
| T2 (eleven decks) | **46.9%** | 33.3 – 61.9 |

| Roster | Field win rate | Range |
|---|---|---|
| base1 — Trevor's eight | 50.8% | 36.1 – 65.7 |
| base3 — Trevor's six | **50.5%** | 37.2 – 63.8 |
| base2 — Trevor's five | 48.0% | 33.3 – 61.9 |

**Fossil is a strong bracket and that is the first thing to say** — level with Base Set and above
Jungle, holding third place overall with `b3_t3_water` and fifth with a T2.

**Every T4 in the game finishes below every roster's best T3, and the three of them land within 2.8
points of each other.** 49.9 / 49.2 / 47.1, against a T3 average of 57.6. Three bosses, three
independently built rosters, three different sets, three different centrepieces — and they cluster at
almost exactly the field average. **No single roster could say this.** Base Set's T4 sitting in its
own T2 band read as one deck being mis-built; Jungle's read as a second; the third turns it into a
statement about T4 **as a class**, which is a different question and a better one.

**And the T4 decks are the best in the field at assembling and the worst at converting.** That is a
**level** difference between the tiers, not a relationship inside them, and the distinction cost one
wrong version the same afternoon — see the correction below.

| | mean assembly | mean win% |
|---|---|---|
| T2 | 40% | 46.9 |
| T3 | 50% | **57.6** |
| T4 | **73%** | 48.7 |

| Boss | Centrepiece | Lands | Median turn | Merged rank |
|---|---|---|---|---|
| `b3_t4_psychic` | Gengar | **89%** | 18 | 12 of 19 |
| `b2_t4_grass` | Vileplume | 76% | 18 | 10 of 19 |
| `b1_t4_fire` | Charizard | 53% | 13 | 9 of 19 |

**So the bosses arrive, reliably and on time, and then do not win.** This file has carried Jungle's
one-deck version of that question since 21 Aug — *"either the pressure is worth less than it looks or
the bot cannot press it"* — without anyone able to say whether it generalised. **Three bosses across
three sets say it does**, and it survives the obvious objection: a bot that plays the whole field
badly should be *helped*, not hurt, by a deck that reliably assembles the thing it is built around.
**Something is going wrong after the centrepiece lands**, which is an AI question rather than a deck
question.

**Stage 2 dependence is NOT the explanation, and it was the first thing checked.** Trevor raised it —
Fossil leans on Stage 2 lines and perhaps the bot handles them badly. Mean Stage 2 count is **T2 0.5,
T3 2.2, T4 2.0**: it separates T2 from the two tiers above it and does not separate T3 from T4, which
is the boundary the anomaly sits on. Both upper tiers are Stage 2 decks and one of them wins by nine
points. **A good hypothesis, cheaply killed, and worth recording so Job 14b does not spend a day on
it.**

#### The correction, kept because the wrong version is the more tempting one

**The first draft of this section said assembly and winning were ANTI-correlated. That is not
supported.** It was written off the three bosses in the table above, where the ordering is perfect and
backwards. Checking it against all fourteen decks that have a centrepiece killed it:

| | Pearson r, assembly vs win% |
|---|---|
| all 14 decks with a centrepiece | **+0.31** |
| within T2 (6 decks) | +0.60 |
| within T3 (5 decks) | +0.76 |
| within T4 (3 decks) | −0.91 |

**Assembling your centrepiece helps, and it helps MORE the higher the tier is built.** The −0.91 is
three points, and any three points that are not collinear produce a large coefficient — it is not
evidence of anything. **The tier means are the finding; the correlation was an artefact of quoting the
smallest group in the set**, which is this tree's own favourite error wearing a statistic.

**Two traps in one block, and the second nearly landed as well.** Taking tier means over only the
decks that *have* a centrepiece puts T2 at 58.3% — above T3 — because the five decks with no
centrepiece sit mostly at the bottom of the table, so dropping them is selection on the outcome. **The
tier means above are `decksim`'s own, over all nineteen decks.** Take a tier average from the tool,
never from a filtered subset of its rows.

### The benchmark reading from this run, and why it is NOT in `MEASUREMENT.md`'s table

`b1_t4_fire` came **9th of 19 at 49.9%**, Charizard landing 53% at median turn 13.

**Do not read that against the 5th-of-13 standing in [MEASUREMENT.md](MEASUREMENT.md) — it is a
different field and a different seed count, so it is not a lower reading, it is an unrelated one.**
Six decks joined the field and three of them finished above it; the seed count is 20 rather than 30.
That file's benchmark table is deliberately all one field for exactly this reason, and appending a
row from a wider one would break the only property that makes the table readable. It is recorded
here, with its field stated, which is where a one-off reading belongs.


## Team Rocket — Trevor's eight decks, 25 Aug 2026

**Live on the ladder since 25 Aug 2026**, alongside the two authentic Team Rocket theme decks
(Devastation, Trouble) as the bracket's T1 intro — the first bracket with both an authored roster and
its own real theme decks on day one. Eight decks converted from `data/v1 Opp Decks/Team Rocket
Opponent Decks v1.xlsx` into `data/base5_decks.json`, verified against `Engine.prototype.validateDeck`
— all 60 cards, 4-copy clean, every card implemented. Four T2, three T3, one T4.

### What the sim said

```bash
node tools/decksim.js 30 6 data/base5_decks.json
```

30 seeds × both seats per ordered pair, 6 Prizes, expert both sides:

| Tier | Field win rate | Range |
|---|---|---|
| T4 (one deck) | **64.5%** | — |
| T3 (three decks) | **57.8%** | 48.3 – 67.2 |
| T2 (four decks) | **40.4%** | 30.2 – 48.2 |

**The tiers order, and cleanly — the first roster where they do without qualification.** T2's ceiling
(48.2%) sits just under T3's floor (48.3%), and T3's floor sits under T4's only entry (64.5%). Base
Set's boss finished eighth of eight; Jungle's finished ninth of thirteen. This one finished first,
Dark Blastoise the strongest deck in its own field.

**Read that against the standing caution, not as vindication.** "The reason to distrust every
standing above" — in Jungle's section, now in [ROSTERS-ARCHIVE-1.md](ROSTERS-ARCHIVE-1.md) — is not a
Jungle-specific finding — it is a fact about the instrument, measured once
against Jungle because that is where it was noticed. This run used the same AI, which was last shown
playing the whole field badly on 21 Aug and has not been re-measured since. A roster ordering cleanly
against a bot that plays badly is one data point in the right direction, not a result that survives
the AI improving.

**One real bug had to be fixed to get a clean run at all, and it was not a deck problem.** Three of
`scorePower`'s PROVISIONAL cases (`SEARCH_EVOLUTION_TO_HAND`, `STATUS_COIN_EITHER_POWER`,
`DISCARD_THEN_DRAW`) crashed the instant the AI tried to use them — each referenced a `me` the function
never defines. No roster before this one had fielded enough of these three Powers for the AI to ever
reach the code path, so it had simply never run. See [AI-INVARIANTS.md](AI-INVARIANTS.md) for the fix;
the weights themselves are untouched and still provisional — this cleared the crash, not the pricing.

**Not yet measured against the other three rosters in a merged field**, unlike Jungle's run against
Base Set. That comparison is next if it's wanted, following the same method.

## Challenge 1 — Trevor's seven mono-type decks, 1 Sep 2026

**The first roster that is not a set**, and the first where every deck is the same tier. Seven decks
converted from `data/v1 Opp Decks/Challenge 1 Opponent Decks v1.xlsx` into
`data/challenge1_decks.json`, one per Energy type, drawn from Base, Jungle, Fossil and the promos
those brackets open. All seven validate clean — 60 cards, 4-copy clean, every card implemented, and
**zero id corrections needed for the fifth workbook running**. All T4, no intro, no gate: a Challenge
is a boss round end to end. *[Why the rung pattern does not apply →](OPPONENTS.md)*

**featureWeight is 16.5 to 21 and comparable only within this workbook.** Do not read it against
Fossil's 11.5/16/19.

### What the sim said

```bash
node tools/decksim.js 45 6 data/challenge1_decks.json
```

45 seeds × both seats per ordered pair, 6 Prizes, expert both sides, 189s:

| rank | deck | featureWeight | win% | centrepiece | lands | median turn |
|---|---|---|---|---|---|---|
| 1 | c1_water (Articuno) | 20 | **79.0%** | — | — | — |
| 2 | c1_colorless (Wigglytuff) | **21** | 56.0% | Dragonite | 78% | 19 |
| 3 | c1_fighting (Aerodactyl) | 17.5 | 55.0% | — | — | — |
| 4 | c1_lightning (Zapdos) | 19.5 | 51.3% | — | — | — |
| 5 | c1_psychic (Gengar) | 20 | 45.4% | Gengar | 82% | 19 |
| 6 | c1_grass (Vileplume) | 16.5 | 42.8% | Vileplume | 72% | 20 |
| 7 | c1_fire (Moltres) | 17.5 | **20.2%** | — | — | — |

**There is no tier boundary to test here** — one tier, seven decks — so this run is not asking the
question every previous roster's run asked. What it can say is whether the seven are *level*, and
they are not: the spread is **58.8 points**, by far the widest of any roster measured in this tree.
Base Set's was 30, Jungle's 34, Team Rocket's 37.

**The intended boss is second, and the gap between weight and play is the finding.** Colorless leads
on featureWeight at 21 and Trevor picked it as the leader on that basis, flagging it as provisional.
Played, Water is 23 points clear of it. **Neither number is authoritative** — featureWeight is
Trevor's construction scoring and agrees with itself by design, and `decksim` is the same bot last
shown playing the whole field badly — but they disagree, which is exactly what the instrument is for.
**Do not swap the boss on this run alone.** Water's margin has a plausible confound (see below) that
nothing here separates out.

**`c1_fire` at 20.2% is the weakest deck ever measured in this file** and is the one number worth
acting on before the bracket is played. Moltres is a wincon that demands an engine, the deck fields
no Pokémon Power at all, and Fire's only favourable type matchup in a mono-type field is Grass, which
is itself sixth. It is a candidate for a rebuild rather than a tune.

### The confound that makes this run weaker evidence than it looks

**A mono-type round-robin measures the type wheel as much as it measures the decks**, and no other
roster in this file has that problem. Every previous run was a field of multi-type decks where
Weakness averaged out; here each deck has exactly one Weakness and exactly one thing it doubles
against, so a deck's standing is partly a fact about *who else is in the field* rather than about the
deck.

**And the field is not the situation.** These seven never fight each other in the game. The player
brings **one** deck against all seven, in an order they do not choose, and the whole design question
is whether that deck can survive the spread. `decksim` cannot ask that, because it has no player.
**So treat this table as a screen for outliers, not as a ranking** — the 20.2% and the 79.0% are worth
looking at because a 59-point spread is unlikely to be pure wheel, and the four decks in the middle
are not usefully ordered by it.

The right instrument for a Challenge is a fixed player deck against all seven, which does not exist.
Noted rather than built — Job 15a's job was the bracket.

### The merged field: does a bracket after Fossil sit above Fossil?

```bash
node tools/decksim.js 20 6 data/base3_decks.json data/challenge1_decks.json
```

20 seeds, 13 decks, 294s:

| | mean win% | range |
|---|---|---|
| **base3** (6 decks) | 49.5% | 37.7 – 61.5 |
| **challenge1** (7 decks) | **50.3%** | 15.0 – 75.4 |

**A tie, to within a point.** A bracket the player reaches *after* clearing Fossil is, by this
measure, no harder than Fossil. Fossil's two T3 decks (61.5%, 60.8%) beat every Challenge deck except
Water, and the Challenge boss lands **seventh of thirteen** at 54.4%.

**Read this as the existing T4 finding repeating, not as a new one.** [OPPONENTS.md](OPPONENTS.md)
already records that **T4 decks are the best in the field at assembling and the worst at converting**
— 73% assembly for 48.7% wins, against T3's 50% for 57.6% — measured across three rosters in Job 14a.
Challenge 1 is *seven T4 decks*, so a bracket built entirely from the tier the bot plays worst
finishing level with a mixed bracket is what that finding predicts. The three Challenge decks with a
centrepiece land it 68–80% of the time and two of the three still finish below halfway.

**So this is not evidence that the decks are weak, and it is not evidence that they are strong.** It
is a fifth data point on an AI question that four rosters had already raised, arriving from a bracket
built specifically to be hard. **Do not rebalance the Challenge decks off it.** The thing that would
make this measurement mean something is the AI converting a T4 board, and that is
[AI.md](AI.md)'s.

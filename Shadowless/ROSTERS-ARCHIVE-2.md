# Shadowless — the built rosters, measured: archive 2

**Fossil**, moved out of [ROSTERS.md](ROSTERS.md) on 14 Sep 2026, when adding Gym Heroes' section would
have taken that file past the ~450-line threshold its own header sets. Split at a **set boundary**, as
that header instructs — the live file keeps Team Rocket, Challenge 1 and Gym Heroes.

**Nothing here has been edited or condensed.** One section, verbatim, including the run commands and
the reasoning attached to it.

**Read this when** a claim in `OPPONENTS.md` cites Fossil's numbers, or when you are about to re-measure
Fossil and want to know what it said last time. **Everything this section established as a LESSON is in
[OPPONENTS.md](OPPONENTS.md)** with a link — this is the evidence, not the conclusions.

**Two things in here are still load-bearing and are worth knowing exist:**

- **"The merged field, and the T4 finding that needed three rosters to see"** — the first run to put
  three rosters in one field, and where the observation that bosses convert worst was first made on
  more than one roster.
- **"The benchmark reading from this run, and why it is NOT in `YARDSTICKS.md`'s table"** —
  [YARDSTICKS.md](YARDSTICKS.md) points at it.

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

### The benchmark reading from this run, and why it is NOT in `YARDSTICKS.md`'s table

`b1_t4_fire` came **9th of 19 at 49.9%**, Charizard landing 53% at median turn 13.

**Do not read that against the 5th-of-13 standing in [YARDSTICKS.md](YARDSTICKS.md) — it is a
different field and a different seed count, so it is not a lower reading, it is an unrelated one.**
Six decks joined the field and three of them finished above it; the seed count is 20 rather than 30.
That file's benchmark table is deliberately all one field for exactly this reason, and appending a
row from a wider one would break the only property that makes the table readable. It is recorded
here, with its field stated, which is where a one-off reading belongs.

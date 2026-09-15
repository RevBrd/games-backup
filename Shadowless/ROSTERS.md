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
lines and there are fourteen sets, so this file was on course to be the longest thing in the tree.
Added 29 Aug 2026 by #30, after finding a roster that had never been measured at all.
*(That sentence used to end "and was **the** one register with no threshold written down". It was one
of two: [MISREADINGS.md](MISREADINGS.md) had none either and did not get one until 2 Sep 2026.
Corrected rather than deleted, because the near-miss is the point — a claim that a set has exactly
one member is the same species of quantifier this tree keeps being caught by, and it was written by
the pass that went looking for missing thresholds.)*

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
| [ROSTERS-ARCHIVE-2.md](ROSTERS-ARCHIVE-2.md) | Fossil | the three-roster merged field, the T4 finding, and the benchmark reading `YARDSTICKS.md` cites |
| **this file** | Team Rocket, Challenge 1, Gym Heroes | the three most recent, and the first non-set bracket |

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
reach the code path, so it had simply never run. See [AI-INVARIANTS-ARCHIVE-2.md](AI-INVARIANTS-ARCHIVE-2.md) for the fix;
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

### CORRECTION, same day: the Fire deck was running the wrong Energy

**Everything above this heading is left exactly as it was measured**, per this file's rule, and it is
all wrong about one deck. Trevor read the standings, went and played `c1_fire`, and diagnosed it in
one sentence: *"I wrote F energy instead of R energy in the deck list."*

**In this era's shorthand F is Fighting and R is Fire.** The workbook's Energy row read "F Energy"
against id `base1-97`, which is Fighting Energy; Fire is `base1-98`. The label and the id agreed with
each other and both disagreed with the deck. **Twelve of its twenty-one Pokémon could not pay for a
single one of their attacks** — the entire Magmar, Moltres, Growlithe, Arcanine and Vulpix lines.

Re-measured after the one-character fix, same command, same 45 seeds:

| rank | deck | featureWeight | win% | was | centrepiece | lands |
|---|---|---|---|---|---|---|
| 1 | c1_water (Articuno) | 20 | **78.1%** | 79.0 | — | — |
| 2 | c1_fire (Moltres) | 17.5 | **57.1%** | **20.2** | — | — |
| 3 | c1_fighting (Aerodactyl) | 17.5 | 49.3% | 55.0 | — | — |
| 4 | c1_colorless (Wigglytuff) | **21** | 48.1% | 56.0 | Dragonite | 76% |
| 5 | c1_lightning (Zapdos) | 19.5 | 42.6% | 51.3 | — | — |
| 6 | c1_psychic (Gengar) | 20 | 40.6% | 45.4 | Gengar | 81% |
| 7 | c1_grass (Vileplume) | 16.5 | **33.8%** | 42.8 | Vileplume | 69% |

**Fire went from last to second and the spread closed from 58.8 points to 44.3.** Every other deck's
number moved too, downward, because they had all been beating up a deck that could not attack — which
is the thing to take from this beyond the fix. **In a round-robin every standing is a function of
every other deck**, so one broken entry does not produce one wrong row, it produces seven.

**Three things this changed and one it did not.**

- **The outlier screen worked, and it is the only reason anybody looked.** The original section said
  20.2% was "the one number worth acting on before the bracket is played" and called Fire a rebuild
  candidate. It was a data-entry error instead of a design problem, which is a better outcome than
  the one predicted, and the prediction is what produced it.
- **Water is now the standout on its own.** 78.1%, twenty-one points clear of second, in a field
  where the next five sit inside nine points of each other. Whatever is happening there is not the
  Fire deck's fault and has not been explained.
- **The boss slipped to fourth.** Colorless was second at 56.0% and is now 48.1%, below the field
  average. The featureWeight-versus-play disagreement noted above is therefore *wider* after the fix,
  not narrower. Still not a reason to move the boss on one run, and still not something to let go
  quiet.
- **It did not change the confound below.** A mono-type round-robin still measures the type wheel and
  still has no player in it.

**No suite could have caught this and one now can.** `validateDeck` passed the deck without a murmur
and was right to: 60 cards, 4-copy clean, every card implemented. **A deck of the wrong Energy is a
perfectly legal deck.** `progresstest.js` now asserts that no deck fields a Pokémon it cannot pay a
single attack for — the unit is the *card*, not the attack, because a Pokémon with one dead attack and
one live one is an ordinary choice. Run across all 58 authored decks it finds two more, both small,
both in GBC placeholder decks: `rod_legendary_dragonite` fields 2 stranded Charizard on Fossil's
stand-in intro, and `ronald_legendary` 2 more in a deck nobody fields any more. Both are listed as
known exceptions rather than silenced.

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

#### Re-run after the Fire fix — and the bracket does order

Same command, 20 seeds, 13 decks:

| | mean win% | was | range |
|---|---|---|---|
| **challenge1** (7 decks) | **52.9%** | 50.3 | 39.7 – 75.0 |
| **base3** (6 decks) | 46.4% | 49.5 | 32.3 – 60.8 |

**Not a tie: 6.5 points, and the right way round.** A bracket the player reaches after clearing Fossil
is harder than Fossil. The prediction written above — Challenge up ~3, Fossil down — held (+2.6 and
−3.1), which is worth a line only because it confirms a round-robin behaves the way you expect when
you take a free win out of it.

**Everything the original run concluded about T4 CONVERSION survives, which is why re-running it was
worth more than deleting it.** Fossil's two T3 decks still finish second and third, above five of the
seven Challenge T4s; the Challenge boss finishes **eighth of thirteen** at 50.4% while assembling
Dragonite 76% of the time; and Fossil's own T4 is tenth at 40.7% on 84% assembly. **The tier that
assembles best still converts worst** — now on a fifth roster, and now with the confound removed.
That is [AI.md](AI.md)'s, and it is the most durable thing five rosters have produced.

**T3 is the strongest band in the merged field at 59.4% against T4's 51.3%**, which is what the
three-roster run found and what Fossil's own section found. Four independent fields now say it.

## Gym Heroes — Trevor's seven decks, 14 Sep 2026

**Live on the ladder since 14 Sep 2026**, alongside the four authentic Gym Heroes theme decks (Brock,
Misty, Lt. Surge and Erika) as the bracket's T1 intro. Seven decks converted from `Gym Heroes Opponent
Decks v1.xlsx` into `data/gym1_decks.json`, verified against `Engine.prototype.validateDeck` — all 60
cards, 4-copy clean, every card implemented. **The last of those was not true until the conversion
found it**: Erika's Oddish was refused by the validator while the set counted as complete. See
[DATA.md](DATA.md). Four T2, two T3, one T4.

### What the sim said

```bash
node tools/decksim.js 30 6 data/gym1_decks.json
```

30 seeds × both seats per ordered pair, 6 Prizes, expert both sides, measured 14 Sep 2026:

| rank | deck | tier | win% | centrepiece lands | median turn |
|---|---|---|---|---|---|
| 1 | Brock's Golem | T4 | **75.6%** | 76% | 12 |
| 2 | Erika's Vileplume | T3 | 71.4% | 79% | 13 |
| 3 | Erika's Victreebel | T2 | 52.2% | 21% | 22 |
| 4 | Misty's Poliwrath | T3 | 47.2% | 62% | 14 |
| 5 | Brock's Rhydon | T2 | 39.7% | — | — |
| 6 | Lt. Surge's Raichu | T2 | 32.8% | — | — |
| 7 | Sabrina's Gengar | T2 | 31.1% | 26% | 25 |

| Tier | Field win rate | Range |
|---|---|---|
| T4 (one deck) | **75.6%** | — |
| T3 (two decks) | **59.3%** | 47.2 – 71.4 |
| T2 (four decks) | **39.0%** | 31.1 – 52.2 |

**The averages order and the bands do not.** Victreebel, a T2, finishes above Poliwrath, a T3, by five
points. By this file's own rule a tier boundary is only real if the bands do not overlap, so this is
the Base Set shape rather than Team Rocket's clean one. **Victreebel is the deck to look at first**: it
lands its Stage 2 in only 21% of games with a median of turn 22, and still wins more than half — so its
wins are not coming from the card on its cover.

**The boss finishes first, on 76% assembly** — Team Rocket's pattern again, not the merged-field
finding that the tier which assembles best converts worst. That finding is about a MERGED field, and
this roster has not been put in one.

**The two dashes are not failures to assemble.** `decksim` names a centrepiece only when a deck runs a
Stage 2, and the Rhydon and Raichu decks top out at Stage 1. Nothing is being measured there, which is
worth knowing before reading 0% into it.

**Read all of it against a weaker instrument than the other rosters had.** Every AI weight Job 16 added
for gym1's new verbs is `PROVISIONAL` — about fifty guesses, on the list in `tools/selftest.js` — so on
top of the standing reason to distrust these numbers, the bot is playing this set's cards on first
estimates. A deck that looks weak here may be one whose cards the bot is mispricing.

**Not yet measured in a merged field** against Team Rocket or Challenge 1.

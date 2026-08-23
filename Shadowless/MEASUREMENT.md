# Shadowless — measuring, and the ways it has lied

**Read this before you believe any number that claims something got better**, before you read a saved
match log, and before you conclude from a flat result that your change did nothing. Split out of
[AI.md](AI.md) on 15 Aug 2026 — that file is *how the bot thinks and what has shipped*; this one is
*how you find out whether any of it worked.*

**It holds every instrument in the project that is not pass/fail**, which as of 19 Aug 2026 is six of
them rather than three: the three AI instruments below, and the three that measure a rule, a set or a
roster instead. The suites that *do* return pass or fail are [TOOLING.md](TOOLING.md)'s, and mixing
the two families is how a measurement ends up quoted as a verdict.

The split is here because this half has more entrances than the file it came from.
[PLAYTEST.md](PLAYTEST.md) sends you here when a report lands, [TOOLING.md](TOOLING.md) when you ask
what a suite covers, and `CLAUDE.md` when you want a match log — **and not one of those wants to read
about scoring weights on the way.**

The one-line summary: **`selftest.js` proves the AI is *correct*; nothing but the instruments below
can tell you whether it plays *well*, and every way they have lied is a file of its own —
[MISREADINGS.md](MISREADINGS.md), each entry paid for by somebody.**

*(That sentence used to end "all seven of the ways", and went on saying it for a week after the
section it referred to had stopped counting itself for exactly that reason. Corrected 22 Aug 2026.
**Do not put a count of them back**, here or anywhere.)*

## The three instruments — measuring "well", and measuring "did anything happen"

`selftest.js` proves the AI is correct and that the difficulty ladder is ordered. Neither it nor any
other suite can tell you whether the bot plays **well**, which is a different question and the one
that matters for a quality pass. Two tools answer it, and **neither is pass/fail**. A third answers a
different question again — *did my change alter anything, and where* — which is the one a RULES change
needs, because a rules change is symmetric and a win rate will sit at 50% however large it is.

- **`tools/aitest.js`** counts specific decisions across a few hundred games: retreats that cost the
  turn's attack, retreats with nothing threatening the Active, Energy attached to an Active that
  dies before spending it, healing poured into a barely-scratched Pokemon. Every counter is a
  *suspicion*, not a bug — each of those is occasionally the right play. **Read the rates, compare
  two runs, and never judge a single one.**
- **`tools/aiduel.js`** seats the working-tree AI against a committed one and returns a win rate with
  a confidence interval. This is the only tool that answers "is it better than it was an hour ago".
- **`tools/abtest.js`** swaps the whole of `src/` for a committed version and plays identical seeds
  through both, reporting **how many games came out different** rather than who won. Use it for
  engine and rules work, where both seats play under the same new rule and a win rate is the wrong
  instrument entirely. Its `--card` flag is the point of it rather than a convenience: it restricts
  the pool to decks that actually contain the card your change is about, and refuses — with an
  explanation — when none do. Added 17 Aug 2026, out of *the instrument may simply not contain the
  thing you changed* in [MISREADINGS.md](MISREADINGS.md).

```bash
node tools/aitest.js 6 --gbc           # behaviour counts — TAKE THE FLAG, see below
node tools/aiduel.js 8                  # vs HEAD
node tools/aiduel.js 8 HEAD --control   # baseline vs ITSELF — run this too
node tools/abtest.js 8 HEAD~1          # did my rules change alter any game at all
node tools/abtest.js 8 HEAD~1 --card base1-96   # ...measured only where it can bite
```

**`abtest.js` has its own control and it is free: run it against `HEAD` with a clean tree and it must
report 0% divergence.** It says so itself when `src/` matches the baseline. Every instrument in this
file has lied at least once and the two that had a control got caught fastest.

### Every way this measurement has lied — [MISREADINGS.md](MISREADINGS.md)

**Twelve of them, each paid for by somebody, and the list is deliberately not counted.** They moved
into their own file on 22 Aug 2026: the section had become an append-only register and this file had
reached 388 lines around it. **Read it before you believe a result, and especially before you
believe a null one.**

The shapes, so you can recognise one without opening the file:

- **A counter that says "must be 0" and is not 0 may be counting the wrong thing** — the loudest
  failure mode, because it points at a bug that does not exist.
- **A harness that never deals the situation reports 50% for anything**, which reads as *"your change
  did nothing"* — the one verdict nobody argues with. This is the dangerous one; it fails silently
  and in the safe direction.
- **A threshold is only as meaningful as the sample under it**, and a fixed-seed suite fails
  *deterministically*, which reads as a finding rather than as noise.
- **A harness that reports on its own inputs can be wrong about them** while every game it simulates
  is correct.
- **Check the game you are measuring is the game that exists.** Every scripted game in the repo ran
  at 12 Prizes for two months.

**Always run the control first.** Two of the entries were caught within a day because the tool had
one; the rest took longer. `aiduel.js --control` must read 50%, and `abtest.js` against `HEAD` with a
clean tree must read 0% divergence — that one is free.


## The match log — the only view of what the bot actually thought

**"Save match log" on the game-over screen and after a pack**, and `CLAUDE.md` says to ask Trevor for
one whenever the AI does something baffling. It carries what no suite reports: the opponent's opening
hand, **both** Prize piles, and every option the AI weighed with its score and what it passed over.
The seed is in the header, so any match in it replays exactly.

`src/eventlog.js` is pure data — no DOM, no engine, handed strings by the UI. **The AI's reasoning is
gated behind `ai.explain`, set only by the browser**, because populating it in `selftest.js` would
cost a few hundred games' worth of time for nothing. So a scripted game produces a log with the
scores missing; that is the gate, not a bug.

It is worth more than its size suggests. The 12-Prize bug — every scripted game in the repo running
at twice the intended length since Job 4 — was found by reading one of these and noticing a deck lose
seven cards between two identical turn banners. No test could see it, because every test was making
the same mistake.
## Standing measurements

Neither of these is a job. They are properties of the game that move when the AI moves, recorded here
so nobody re-derives them and nobody quotes a stale one.

**First-player advantage is real and it has a measured size.** Expert mirrors had suggested 58–67%
for whoever is seated first. `aiduel.js --control` settles it: the baseline AI played against
*itself* over mirrored games sat at exactly 50%, but the same harness with seats assigned by seed
rather than mirrored came out at **55.7%** — that gap is the seat advantage, and it is large enough
to have faked a six-point AI improvement once. It may still be a true property of the ruleset rather
than a bug. What is settled is that **no AI measurement here is trustworthy unless it mirrors
seats**.

**Deck balance moves whenever the AI changes, so it is measured here rather than fixed.** Every
figure below is a snapshot with a date on it, and **the snapshot is the point** — read the trend, not
the row.

| Measured | Blackout | Brushfire | Zap | Overgrowth | Spread |
|---|---|---|---|---|---|
| before the retreat re-tune, ~144 games | 72 | 42 | 53 | 33 | 39 |
| after it, 13 Aug | 67 | 50 | 46 | 38 | 29 |
| after Arcanine, 14 Aug (`selftest.js` default, 72 games per deck) | 68 | 56 | 46 | 31 | 37 |

The interesting part was the *spread*, which the retreat re-tune closed from 39 points to 29 with no
deck touched — a bot that runs away less is a bot whose weaker decks get to attack. It reads 37 again
after the recoil work, and **that is not evidence of anything**: at 72 games a row carries about ±12,
so not one deck's movement between those last two lines clears its own interval. The spread is a
difference of differences and is wider still. Raise the seed count if you actually need to know. The
real decks were never balanced against each other either, so a wide spread may simply be correct.

**Run `selftest.js` for today's figures rather than quoting the table**, and never compare against
anything from before 11 Aug 2026 — those were measured at 12 Prizes and the ordering *reverses* at
the correct length, because Zap is a fast deck that wins a short game and loses a grind.

## Three more that are not about the AI at all

Same rule — **none of these returns pass or fail** — but they answer questions about a *rule*, a
*set* and a *roster* rather than about how well the bot plays. They moved here from
[TOOLING.md](TOOLING.md) on 19 Aug 2026 for that one reason: everything in that file has a verdict
and none of these does.

### `openercheck.js` — the opening Active, measured

**Not pass/fail.** It drives the **live engine** — `newGame`, then `setupAuto` — and reports how often
the opening Active is an evolution-line starter that is *stranded*: no evolution in hand, no spare
copy, while a Basic that was not stranded sat in the same hand.

**It lied the first time it was written, and that is why the header says to call the engine.** The
original reimplemented `setupAuto`'s rule in order to measure it, so it reported the same figure before
and after the rule changed, and it under-read the defect at 6.0% against a true 16.6%. **If you extend
this, call the engine; never mirror it.** The failure was caught by running it against the pre-fix
engine — always have a control that is known to fail.

```bash
node tools/openercheck.js                          # data/base1_decks.json, 6000 hands per deck
node tools/openercheck.js data/jungle_decks.json   # any file in the *_decks.json shape
```

Deterministic seed, so the figure is reproducible run to run and a change to the rule can be measured
against it. It reads the deck JSON rather than the engine, so it works on quarantined deck files that
nothing else has wired up yet. The standing figure and what to do about it are in [AI.md](AI.md).

### `pressure.js` — what a set can threaten you with

**Derived, never hand-tagged.** [OPPONENTS.md](OPPONENTS.md) asks a bracket for *variety* of pressure
rather than a ramp of strength, and which pressures a set can field is a fact about the set. This reads
the effect scripts and counts them, so nobody has to read 102 cards — and so the answer cannot drift
away from the cards the way a hand-maintained list would.

```bash
node tools/pressure.js          # every generated set
node tools/pressure.js base3    # one set, with the card names
```

**Run it before building a set's roster.** The profiles are sharply different — Base Set is status and
walls with almost no bench damage, Fossil is made of bench damage, Jungle prints no Energy denial at
all — and a roster that ignores that asks a set for something it cannot supply. It also names the
categories that are too thin to lean on.

Deck-out is absent on purpose: no card in this era mills a deck, so it is a property of a *deck* (a
wall that supplies no clock) and cannot be derived from a card pool.

### `decksim.js` — do the tiers actually order?

**The only instrument that can disagree with [OPPONENTS.md](OPPONENTS.md)'s tier table.** That table
is a *recipe* — its five metrics agree because the decks were built to hit all five. This one plays
them.

```bash
node tools/decksim.js              # base1, 6 Prizes, 45 seeds — about 45 seconds
node tools/decksim.js 45 4         # the same at 4 Prizes
node tools/decksim.js 45 6 data/base1_decks.json
node tools/decksim.js 30 6 data/base1_decks.json data/base2_decks.json    # two rosters, merged
```

**One file and two files are different questions and the answers are not interchangeable.** One
roster alone asks whether *its own* tiers order — and a five-deck field is small enough that a single
deck's type coverage can carry it, which is exactly what Jungle's roster looked like until it was run
in the bigger field. Merging asks whether a later bracket actually sits above an earlier one, which is
the question a second roster creates and the one worth quoting. Merged runs add a `from` column and a
per-roster average; duplicate deck keys are refused rather than silently overwritten.

Every deck meets every other **from both seats on the same seeds**. That is not optional: seat
correlates with a deterministic opening flip, and `aiduel.js` shipped unmirrored for an hour and
reported a 6-point edge for a change that did not exist.

**Read the centrepiece columns beside the standings — they usually explain them.** A Stage 2 that
lands in 45% of games at a median of turn 17, in a game decided by turn 20, is not a centrepiece.

### The benchmark deck — the only ground truth this project has for AI quality

**`b1_t4_fire` is very close to the deck Trevor personally won the whole Base Set bracket with**, and
it is still winning for him against the newer opponents. He said so on 21 Aug 2026, and it is the most
useful sentence anyone has contributed to measuring this AI.

**A round robin runs the same bot on both sides, so it can never say the field is being played badly.**
A bot that retreats too much beats a bot that retreats too much about half the time; every deck's rate
is relative to a standard the instrument itself sets. That is the ceiling on everything else in this
file.

The benchmark punches through it. A deck known to win in a human's hands finishing **eighth of
thirteen** is not a fact about the deck. `decksim.js` prints its rank separately now, and:

> **Its RANK is a measure of the AI. Move it by improving the bot, never by editing the deck.**

Its run on 21 Aug 2026, all three figures from the same 30-seed merged field:

| | rank | win% | Charizard lands |
|---|---|---|---|
| start of day | 8 of 13 | 46.9% | 54% |
| after the retreat repricing | 7 of 13 | 47.5% | 54% |
| after the Charizard fixes | **6 of 13** | **52.8%** | 56% |
| 22 Aug, after the bought-turn work | 6 of 13 | 52.9% | 55% |
| 23 Aug, after the discard repricing | **5 of 13** | 53.8% | 55% |
| 23 Aug, after the status-novelty rule | 5 of 13 | 54.2% | 54% |

**The 22 Aug row is a null and it is recorded as one.** *(It said "that last row" until 23 Aug added
one underneath it, at which point the sentence silently began describing different work. **Name the
row, never point at the end of a table** — a growing table makes a positional reference wrong without
touching it, which is this file's own favourite kind of error arriving in its own prose.)* The three
status and barrier changes of 22 Aug
moved 40.8% of games and did not move the benchmark. **Exposure was checked before that was believed,
and the instrument is not blind here** — all thirteen decks carry a paralysis, sleep, confusion or
barrier. What the benchmark deck has is the *thinnest* holding of them in the field: Chansey's Scrunch
and a Vulpix, against seven such cards in `b2_t4_grass` and eight in `b1_t2_grass_lightning`. So it
gained least from a change every one of its opponents also received, and holding station is the
expected shape rather than a disappointment. **Do not read it as evidence the work did nothing, and
do not read it as evidence it worked** — it is the wrong instrument for a symmetric change, which is
the standing lesson of this whole file.

**The 23 Aug row moved and the accompanying duel did not, which is the most useful pair in the
table.** The discard repricing took the benchmark from 6th to 5th at +0.9 points with **assembly flat
at 55%**, while `aiduel` against the pin read **51.4% ±0.5** against the 51.5% ±0.9 standing before
it — a null. Exposure was checked before that null was believed: **17 of 37 ladder decks carry a card
whose attack burns its own Energy, 65 copies**, so the instrument is not blind. Read the two together
rather than picking the flattering one. A rank that climbs while assembly holds says the bot got
better at *this archetype*, which is the narrow claim the benchmark can actually support; a flat duel
says it did not get better at the field in general, and both can be true of one change.

`--benchmark=KEY` picks a different deck; `--no-benchmark` turns it off. **If Trevor ever says a
different deck is his daily driver, change the default** — the value of this number is entirely in the
claim behind it.

**It is not a pass/fail gate and should not become one.** Rank 1 would be wrong too: the deck is a T4
in a field containing two T3s that beat it in his hands as well.

#### The confound, which Trevor found the same day, and what actually survives it

**Every time the AI gets better, so does the AI piloting the field it is measured against.** A general
improvement raises all thirteen decks and the rank does not move. So the rank is **not** a measure of
AI quality in general — it measures whether the bot can pilot *this archetype* relative to simpler
ones, which is a narrower claim than the paragraph above originally made and still the right question,
because Charizard is the hardest deck in the field to fly and the simplest decks are the ones the bot
flatters.

**Two things survive the confound and both are already on that row.**

**The assembly column is close to absolute.** "Charizard lands 56% at median turn 17" barely depends on
how well the opponent is played. When the rank sticks and assembly climbs, the bot is getting better at
the deck and the field is keeping pace.

**And `aiduel.js --baseline` pins the comparison.** Against `HEAD` the duel answers "did the last commit
help", resets every commit, and therefore reads ~50% forever no matter how far the AI has come — which
is the same confound in the other instrument, and it is why this file's duel figures have all been
nulls. `BASELINE` in `tools/aiduel.js` is a fixed commit (`e23c747`, the state of `ai.js` before Job
11's AI work), so a run against it **accumulates**. Move the pin only deliberately and record it here
when you do; resetting it silently throws away every comparison anyone wrote down.

**It worked the first time it was run.** Against `HEAD`, every AI change of 21 Aug 2026 read as a null —
50.4% ±0.8, 49.9% control, exactly as this file predicts for symmetric perception fixes. Against the
pin, the same day's work together reads **51.5% ±0.9**, outside the interval. Nothing about the AI
changed between those two numbers; only the yardstick did. **A tool that resets its own baseline every
commit cannot show progress, and this one had been doing that since it was written.**

**Not pass/fail.** A tier boundary is real when the tier bands do not overlap. On the Base Set roster
T2 and T3 separate cleanly and T4 does not — **the standings, the assembly rates and what to do about
it are in [ROSTERS.md](ROSTERS.md)**, and the spec they are judged against is
[OPPONENTS.md](OPPONENTS.md).

## Where the rest of it is

**How the bot actually scores anything is [AI.md](AI.md)** — the silent-failure surface where an
unscored verb is misplayed forever and no suite can see it, the Active/Bench unit split, the
invariant every shipped change left behind, and the current `Open` list.

**What each suite covers is [TOOLING.md](TOOLING.md)**, including why none of them subsumes the
others. Nothing in that file can answer the question this one is about.

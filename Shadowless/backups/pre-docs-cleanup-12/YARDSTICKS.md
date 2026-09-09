# Shadowless — the yardsticks, and how both of them rot

**Two things in this project measure how far the AI has come rather than what one change did, and
they are the only two.** A **deck known to win in a human's hands**, and a **pinned commit** the
working tree duels against. Everything else resets: `aiduel` against `HEAD` answers "did the last
commit help" and therefore reads ~50% forever, however far the bot has actually travelled.

[MEASUREMENT.md](MEASUREMENT.md) is the parent and holds the instruments themselves — what each one
measures, how to run it, the match log, and the standing figures. **Read that first.** This file is
the two measurements that accumulate, and it was split out on 2 Sep 2026 on the parent's own test:
three of that file's four entrances are a playtest report, a question about what a suite covers, and
a request for a match log, and **not one of them wants a pin table on the way**.

**They share a failure mode and it is the reason they are one file.** A frozen yardstick measured
against a growing game has a shelf life. The benchmark deck's rank moves when decks join the field
and its win rate moves when the seed count does; the pin is an old `ai.js` played against **today's**
engine and today's decks, so new cards eventually walk in front of a scorer that did not exist when
it was frozen. **Both fail by the world moving, not by anything changing in them** — which is exactly
the kind of failure nobody goes looking for.

**Neither is pass/fail and neither should become a gate.** *[Every way a measurement here has lied
→](MISREADINGS.md)*

---

## The benchmark deck — the only ground truth this project has for AI quality

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

**Every row in that table is the same field — 30 seeds, base1 + base2 merged — and it has to stay
that way for the column to mean anything.** A reading from a *different* field is not a better or
worse number, it is an unrelated one: the rank moves when decks join, and the win rate moves when the
seed count does. There is now one such reading, from the 19-deck three-roster run of 29 Aug 2026
(9th of 19 at 49.9%), and it is deliberately recorded in [ROSTERS.md](ROSTERS.md) beside the field it
came from rather than appended here. **If you run the benchmark in a wider field, do the same** —
otherwise the next reader sees 5th become 9th and reports an AI regression that did not happen.

`--benchmark=KEY` picks a different deck; `--no-benchmark` turns it off. **If Trevor ever says a
different deck is his daily driver, change the default** — the value of this number is entirely in the
claim behind it.

**It is not a pass/fail gate and should not become one.** Rank 1 would be wrong too: the deck is a T4
in a field containing two T3s that beat it in his hands as well.

## The confound, which Trevor found the same day, and what actually survives it

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
nulls. `BASELINE` in `tools/aiduel.js` is a fixed commit, so a run against it **accumulates**. Move
the pin only deliberately and record it here when you do; resetting it silently throws away every
comparison anyone wrote down.

*(**This sentence named `e23c747` until 5 Sep 2026 and the live value had been `582761b` since 28
Aug** — the pin table at the bottom of this file recorded the move correctly on the day, and the
prose above it did not hear. Same failure as `CLAUDE.md`'s bracket count and `AI.md`'s verb count: a
sentence carrying a value that lives somewhere checkable. **The table is the pin**; the prose does not
name a commit any more, which is the only version that cannot go stale.)*

**It worked the first time it was run.** Against `HEAD`, every AI change of 21 Aug 2026 read as a null —
50.4% ±0.8, 49.9% control, exactly as this file predicts for symmetric perception fixes. Against the
pin, the same day's work together reads **51.5% ±0.9**, outside the interval. Nothing about the AI
changed between those two numbers; only the yardstick did. **A tool that resets its own baseline every
commit cannot show progress, and this one had been doing that since it was written.**

**And the HEAD form is not GUARANTEED to read ~50% — 5 Sep 2026, the first counter-example.** The
attack road measured **51.6% ±0.6 over 23,320 games against its own pre-change commit**, which is
significant on the very form this section calls a reliable null.
*[The change →](AI-INVARIANTS/ATTACK-ROAD.md)*

**That is not a contradiction and reading it as one would be the wrong lesson.** The HEAD form cannot
show *cumulative* progress, because it resets — that claim stands untouched. What it can show is a
**single commit large enough to register alone**, and until now nothing had been. So the sentence to
carry forward is narrower than the one this file has been using: *the HEAD form reads ~50% for
anything the size of a normal AI change*, not *the HEAD form always reads ~50%*.

**The practical consequence is worth more than the correction.** A non-null on the HEAD form is a
signal that a change is unusually broad, and it should make you check the instrument rather than
celebrate — which is what [MISREADINGS.md](MISREADINGS.md) is for. Here the checks were that
`aiduel` swaps `ai.js` only and this change is entirely in `ai.js`, the baseline commit's only other
content is `backups/`, and the affected cards are in the `--gbc` pool by name.

**And the two forms AGREE, which is the check that actually settles it.** The HEAD form attributed
**+1.6** to this change alone; the pin moved **51.5% → 53.2%**, which is **+1.7**. Those are
independent runs against different baselines and they land on the same number.

**That agreement is the thing to reach for whenever a single result looks too good.** Neither figure
on its own rules out a broken harness — a duel that is accidentally seating the same bot on both
sides, or a pool that cannot reach the situation, has produced a confident wrong answer here before.
Two baselines agreeing to a tenth of a point is far harder to fake than either number is to get.

## The pin, how it rotted, and the check that catches it

**A frozen yardstick measured against a growing game has a shelf life**, and that is the failure mode
of the whole idea rather than an accident of one commit. The pin is an old `ai.js` played against
**today's** engine and today's decks, so new cards eventually walk in front of a scorer that did not
exist when it was frozen.

**That happened on 28 Aug 2026.** `--baseline --gbc` stopped running and died *inside the baseline*:

```
shadowless-ai-e23c747.js:1509
        const key = STATUS_VALUE[p.status];
ReferenceError: p is not defined
```

**That is a bug in the baseline, not in the working tree, and it was fixed three days after the pin
was set.** `STATUS_COIN_EITHER_POWER` was one of the three PROVISIONAL Power cases #26 found on
25 Aug; `e23c747` predates that fix, and the Team Rocket roster — built after the pin — was the first
thing to field a card carrying that Power. **Nothing about the pin changed. The game grew into it.**

**It fails loudly and it fails invisibly, and those are not a contradiction.** A stack trace is the
good half — far better than a wrong number. But `aiduel` is only ever run by somebody who is changing
the AI, so a broken pin sits unnoticed until one of them turns up; it sat for three days and would
have sat longer. **`--checkpin` moves the discovery to whoever caused it, and takes seconds:**

```bash
node tools/aiduel.js --checkpin --baseline --gbc     # PIN OK / PIN BROKEN
```

**Run it after adding a set or a roster.** Those are the only things that have ever broken a pin. It
plays the baseline against **itself** across every adjacent deck pairing — the question is *"can this
old file still take a turn against today's cards"*, not how well it does — and names the matchup that
crashed. The same instruction is in [TOOLING.md](TOOLING.md)'s "Adding a set", which is where somebody
is actually standing when it matters.

**Two honest workarounds while a pin is broken**, both used on 28 Aug. **`--gbc` is what breaks it**,
because the ladder decks are what field the card — the four theme decks are Base Set only, so
`--baseline` without `--gbc` may still run, at the cost of the blindness `--gbc` exists to fix. Or
**duel against `HEAD`** and accept the smaller question: *did this change help*, rather than *how far
has the AI come*. For a single change that is the right question anyway.

## The pin table — move it deliberately, and add a row when you do

**Do not move a pin to make a break go away.** That is Trevor's call, and it costs every comparison
anyone has written down against the old one.

| Pin | Set | Retired | Why it was retired | Last reading against it |
|---|---|---|---|---|
| `e23c747` | 21 Aug 2026 | **28 Aug 2026** | Predates the 25 Aug fix for three PROVISIONAL Power crashes. The Team Rocket roster then fielded one and `--baseline --gbc` began dying inside the baseline | **51.4% ±0.5**, 23 Aug 2026 |
| `582761b` | **28 Aug 2026** | — | current. First commit whose `ai.js` carries that fix; verified with `--checkpin` against the live ladder before the pin was moved | **53.2% ±0.9**, 5 Sep 2026 (51.5% ±0.9 on 3 Sep; 50.1% ±0.5 on 28 Aug) |

**The pin moved +1.4 points between 28 Aug and 3 Sep 2026, and the yardstick is doing its job.**
50.1% ±0.5 to **51.5% ±0.9**, `--checkpin` clean, 11,656 games. That is the accumulated work of
several sessions — the Over-Attach pattern, the evolution road and plan, the play ordering, the
Trainer fixes — and **it is not attributable to any one of them**, which is the whole point of a
figure that accumulates. Read the second number's wider interval as the smaller sample it is (2
seeds a matchup rather than the 28 Aug run's); it is not a precision regression.

**AND THE SAME DAY'S OWN WORK READ NULL AGAINST ITS OWN START.** Job 15e's three AI changes together
— the heal rescue, the Switch gain and the board-aware wall — measured **50.2% ±0.9 against
`75ed53f`**, the commit the session opened on: *no significant difference*. All three shipped on
correctness, and all three moved `abtest` substantially (9.4%, 34.5%, 26.5% of games diverged), so
they are neither inert nor unexposed.

**That pairing is the clearest demonstration this file has of why both numbers exist.** A day of
real change reads null against its own morning and contributes to a pin that has moved. **Do not
conclude from a null against HEAD that a session did nothing** — and do not conclude from a moving
pin that any particular session is why. The interval on the null is [49.3, 51.1], which also rules
out the large *regression* that a broad change like the wall nudge could plausibly have caused; a
null is evidence about size in both directions, and that half is usually the one left unsaid.
**Readings against different pins are not comparable**, so the 21–25 Aug accumulation now sits
*behind* the current pin and is no longer measured by it. The last reading taken against a retired pin
is kept in its row for exactly that reason. **A retired pin's row never gets deleted.**

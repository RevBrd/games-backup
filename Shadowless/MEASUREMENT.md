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
different question again — *did my change alter anything, and where* — which is the one a SYMMETRIC
change needs, because both seats play under it and a win rate will sit at 50% however large it is.
**"Symmetric" is a wider category than "rules"** and the section below is about why.

- **`tools/aitest.js`** counts specific decisions across a few hundred games: retreats that cost the
  turn's attack, retreats with nothing threatening the Active, Energy attached to an Active that
  dies before spending it, healing poured into a barely-scratched Pokemon. Every counter is a
  *suspicion*, not a bug — each of those is occasionally the right play. **Read the rates, compare
  two runs, and never judge a single one.**
- **`tools/aiduel.js`** seats the working-tree AI against a committed one and returns a win rate with
  a confidence interval. This is the only tool that answers "is it better than it was an hour ago".
- **`tools/abtest.js`** swaps the whole of `src/` for a committed version and plays identical seeds
  through both, reporting **how many games came out different** rather than who won. Its `--card`
  flag is the point of it rather than a convenience: it restricts the pool to decks that actually
  contain the card your change is about, and refuses — with an explanation — when none do. Added
  17 Aug 2026, out of *the instrument may simply not contain the thing you changed* in
  [MISREADINGS.md](MISREADINGS.md).

### Which of the two, and it is not rules-versus-AI

**Asked by Trevor on 2 Sep 2026 — whether `abtest` still carries a purpose "if every change we do is
reflected on both ends" — and the answer is that this is the condition it was built for.** Worth
writing down properly, because the header of `abtest.js` said *"A/B the RULES"* for a fortnight while
eight of the fourteen files in `AI-INVARIANTS/` quoted it for **AI** changes. That reads like drift
and is not.

| | instrument | headline |
|---|---|---|
| **both seats get the change** | `abtest` | divergence |
| **one seat gets the change** | `aiduel` | win rate |

A rules change is symmetric, so a win rate sits at 50% however large it is — that much was always
written down. **What was not: a change to what the bot PERCEIVES is symmetric too.** It ships to
whoever is playing, both seats play under it, and `aiduel` cancels it exactly as it cancels a retreat
ruling. `PLAY-ORDER`, `DRAG-TARGET` and `EVOLUTION-PLAN` are all scorer changes measured here, and
correctly.

`aiduel` is the one that **manufactures** an asymmetry — new bot on one seat, committed bot on the
other — which is what makes a win rate mean anything at all. Its `--baseline` pin is the other half:
against `HEAD` it answers "did the last commit help", resets every commit, and therefore reads ~50%
forever no matter how far the AI has come. *[The pin, and what moving one costs →](YARDSTICKS.md)*

**And `abtest`'s cost is quadratic in the roster, which has tripled since it was written.** Every
figure in `AI-INVARIANTS/` says "17,296 games per side", which is exactly 47×46×8 — true for one
roster and quoted as though it were a property of the tool. At 54 decks it is 22,896. **The tool
prints the count now**, so nothing has to remember it, and `--pairs N` subsamples the round-robin
deterministically when you want an answer this afternoon; it prints the interval so you can see what
the smaller sample costs you.

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

**Its stall floor was ~1.4% and is now ~0.1%**, because the cause was found on 2 Sep 2026 and it was
one missing branch in the dispatch rather than anything about the bot. Do not compare a stall count
against a figure written before that date. *[The table, and why 140 games said the cause was
elsewhere →](MISREADINGS.md)*

### Every way this measurement has lied — [MISREADINGS.md](MISREADINGS.md)

**Each one paid for by somebody, and the list is deliberately not counted — including here.** They
moved
into their own file on 22 Aug 2026: the section had become an append-only register and this file had
reached 388 lines around it. **Read it before you believe a result, and especially before you
believe a null one.**

The shapes, so you can recognise one without opening the file:

- **A counter that says "must be 0" and is not 0 may be counting the wrong thing** — the loudest
  failure mode, because it points at a bug that does not exist.
- **And one sitting AT its ideal value is the reading nobody goes back to question**, which is why it
  is the one that most needs a control. `openercheck` reported a perfect 0.0% for a fortnight with no
  way to tell that from a dead metric.
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

**A turn that ends with no attack now says so**, in both the rail and the saved log — Trevor's, from
the grab bag, 24 Aug 2026. It had no line at all, so the fact was carried by the *absence* of one,
which is the hardest thing there is to read out of a log and effectively impossible in a saved one a
week later. The line names the status when a status caused it (`— Asleep`, `— Paralyzed`), because
that is the case a reader is usually trying to reconstruct. It is styled quieter than everything
around it: it is the only line that reports something **not** happening, and turns without attacks
are common enough that announcing them at the volume of a Knock Out would bury the real events.

Two things in it are deliberate and both are asserted in `powertest.js`. **A Confusion tails still
counts as attacking** — you declared it and it was your attack for the turn, which is how the Game
Boy game treats it. And the line is suppressed on turn 1 **only if** `firstPlayerMayAttack` is off,
which it is not: that flag ships `true` as a flagged assumption in `CONFIG_DEFAULTS`, so under the
live config turn 1 is an ordinary turn. Both directions are tested so reversing the assumption cannot
silently strand either half.
## Is that constant a bug or a policy? Break it and see who screams

**A procedure, added 31 Aug 2026 at Trevor's request, after it paid the first time it was used.**
It costs about a minute and it answers a question this project keeps hitting: *the arithmetic in
this shared helper looks wrong, but everything downstream works. Do I fix it?*

**Neither reasoning nor a green suite can answer that.** Reasoning gets it wrong — `AI.md` records
two sessions reasoning wrong about the same cap. And every suite here stays green through it, because
suites assert what the code does rather than what the cards want.

**`claimtest.js` can answer it, and this is a second use of the harness beyond its documented one.**
The rows are transcriptions of how Trevor says the cards should be played, so they are the only thing
in the repo that knows which *behaviours* a constant is holding up.

1. **Apply the correction as an experiment.** Not a commit, not a branch — an edit you are going to
   revert.
2. **Run `node tools/claimtest.js`.** Do not run the six suites; they will be green and tell you
   nothing.
3. **Read WHICH rows flip, not how many.** The count is noise. The identity of the rows is the answer.
4. **Revert, whatever it said.** The experiment is for deciding, never for shipping.

**Then it is one of three things:**

| what flipped | what it means |
|---|---|
| **nothing** | the arithmetic was genuinely wrong and nothing depended on it. Fix it, and add the row that would have caught it |
| **rows that all sit in one band** | it is a **policy**, not an error. Name the policy, leave the code alone, and record the experiment beside it |
| **rows scattered everywhere** | you are looking at a weight the whole model is fitted around. That is a re-tuning job with its own measurement, not a fix |

**The worked example is `survivesCharge`'s `+1`.** It reads one turn more than the worst case says,
which looks exactly like an off-by-one — a Pokemon acts before each of their attacks, so the attack
that kills it is not a turn it got. Corrected as an experiment, **three rows flipped and all three sat
in the same narrow band**: a Pokemon surviving *exactly one more hit*. That is the middle row of the
table. The `+1` is a hedge against `incomingThreat` being a snapshot projected forward as a
certainty, it had been doing that job by accident since the function was written, and correcting it
would have deleted a policy nobody knew we had. *[The invariant, and the three rows →](AI-INVARIANTS/SURVIVES-CHARGE-HEDGE.md)*

**What makes this work is that the rows are not ours.** A regression suite written alongside the code
agrees with the code by construction. The claim rows come from somebody who has never read it, which
is the whole reason they can referee it. *[Where they come from →](PLAYBOOK.md)*

**And it composes with the control.** `claimtest.js --baseline REF` asks the same question backwards
— *which rows does the OLD bot fail* — so between them you can ask what a change is worth and what a
constant is worth without shipping either. *[The control →](TOOLING.md)*

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

**The retreat counters, 29 Aug 2026, recorded as a baseline rather than as a finding.** Trevor
reported a Gengar retreating instead of attacking with nothing threatening it, which is the
intersection of two `aitest.js` counters — and **one run cannot judge itself**, which is this file's
own first rule. So the figures are here to give the next run something to be compared against.

`node tools/aitest.js 6 --gbc`, 17,672 ladder games, at the commit before the `T_DEFENDER` scoring
change (which cannot move these — it fires only with a Defender in hand):

| | | |
|---|---|---|
| retreats | 28,208 | 6.1 per 100 turns |
| ...that cost that turn's attack | 6,787 | **24%** of retreats, 24.0 attack score given up each |
| ...that improved our hit (good) | 17,110 | 61% of retreats |
| ...**with nothing threatening the Active** | 11,784 | **42%** of retreats |
| Energy burned on retreat costs | 28,010 | 6.0 per 100 turns |

**Every counter here is a suspicion and not a bug** — each of those is occasionally the right play,
and a retreat with nothing threatening the Active is exactly what repositioning for a better matchup
looks like. **What makes it worth a row is that a human watching a game independently flagged the
same behaviour**, which is the one thing a counter cannot do for itself. It is a lead for the AI
work, filed against the open T4 conversion question in [ROSTERS.md](ROSTERS.md); it is not evidence
of a fault.

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
node tools/openercheck.js                          # data/base1_decks.json, 4000 hands per deck
node tools/openercheck.js data/jungle_decks.json   # any file in the *_decks.json shape
node tools/openercheck.js --control                # THE CEILING THE RULE IS BEATING — read this too
```

**IT HAD NO CONTROL UNTIL 2 SEP 2026 AND REPORTED 0.0% ON EVERY DECK**, which is either "the rule
works" or "this has been dead since it was written" — and nothing in the output could tell you which.
A counter sitting at its ideal value is the reading nobody goes back to question, so it is the one
that needs a control most.

| | stranded a line-starter |
|---|---|
| the rule | **0.0%** |
| `--control` | **26.2%** |

The control picks the opening Active at random from the legal Basics **on the same hands**, computed
rather than run through a second engine — mirroring the rule is the exact mistake the paragraph above
is about. **If the control ever reads 0.0% too, the headline figure means nothing.**

Deterministic seed, so the figure is reproducible run to run and a change to the rule can be measured
against it. It reads the deck JSON rather than the engine, so it works on quarantined deck files that
nothing else has wired up yet. The standing figure and what to do about it are in [AI.md](AI.md).

### `pressure.js` — what a set can threaten you with

**Derived, never hand-tagged.** [CHALLENGES.md](CHALLENGES.md) asks a bracket for *variety* of pressure
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

**A tier boundary is real when the tier bands do not overlap**, and as of 29 Aug 2026 two of the four
set rosters clear that and two do not. **The standings, the assembly rates and what to do about them
are in [ROSTERS.md](ROSTERS.md)** and its archive, and the spec they are judged against is
[OPPONENTS.md](OPPONENTS.md). Do not quote a roster verdict from here — this file owns the
instrument, that one owns the results.

**THIS TOOL IS THE WRONG SHAPE FOR A MONO-TYPE BRACKET, and Challenge 1 is the first one.** Two
reasons, both structural rather than a matter of sample size:

- **A round-robin of mono-type decks measures the type wheel.** Every previous field averaged
  Weakness out across multi-type decks; in a bracket where each deck has exactly one Weakness and one
  thing it doubles against, a standing is partly a fact about *who else is in the field*.
- **The field is not the situation.** These seven never fight each other. The player brings **one**
  deck against all seven in an order they do not choose, and the design question is whether that deck
  survives the spread. `decksim` has no player, so it cannot ask.

**Use it on a Challenge as an outlier screen, not as a ranking**, and Challenge 1 is the case that
proves the screen is worth running anyway. Its first run spread 58.8 points, 20.2% to 79.0%. The
20.2% was **a data-entry error in the deck list** — 24 Fighting Energy behind an all-Fire roster —
which Trevor found by going and playing the deck after reading the standings. Fixed, it is second at
57.1% and the spread closes to 44.3.

**So the screen worked twice over: it found something, and what it found was not the thing anybody
would have guessed.** The section had called that deck a rebuild candidate. It needed one character.

**Nothing in a round-robin is independent**, which is the other lesson and the more general one. One
unplayable deck did not produce one wrong row; it produced seven, because every other deck's win rate
included free wins against it. Re-run the whole field after any deck changes, never just the deck.

**The instrument a Challenge actually wants is a fixed player deck against all seven, and it does not
exist.**

### The two yardsticks that accumulate — [YARDSTICKS.md](YARDSTICKS.md)

**Everything above measures one change. Two things measure how far the AI has COME**, and they moved
into their own file on 2 Sep 2026 because three of this file's four entrances want none of it:

- **The benchmark deck.** `b1_t4_fire` is close to the deck Trevor personally won the Base Set
  bracket with, and `decksim.js` prints its rank separately. **Its RANK is a measure of the AI. Move
  it by improving the bot, never by editing the deck.**
- **The pin.** `aiduel.js --baseline` duels a **fixed commit** rather than `HEAD`, so a reading
  accumulates instead of resetting every commit. **Do not move a pin to make a break go away** — that
  costs every comparison anyone has written down.

**Both rot by the world moving rather than by changing**, which is why they are one file. Run
`node tools/aiduel.js --checkpin --baseline --gbc` after adding a set or a roster; those are the only
things that have ever broken a pin.


## Where the rest of it is

**How the bot actually scores anything is [AI.md](AI.md)** — the silent-failure surface where an
unscored verb is misplayed forever and no suite can see it, the Active/Bench unit split, the
invariant every shipped change left behind, and the current `Open` list.

**What each suite covers is [TOOLING.md](TOOLING.md)**, including why none of them subsumes the
others. Nothing in that file can answer the question this one is about.

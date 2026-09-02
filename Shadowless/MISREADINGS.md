# Shadowless — every way a measurement here has lied

**Read this before you believe any number, and before you conclude from a flat result that your
change did nothing.** Every entry below is a real misreading that a session paid for. Not one was
found by inspecting a tool; every one was found by running a control, or by somebody noticing a
figure that did not fit.

[MEASUREMENT.md](MEASUREMENT.md) is the parent and holds the instruments themselves — what each one
measures, how to run it, the match log and the standing figures. This file is what they have done
wrong. Split out on 22 Aug 2026 for length; the parent is the only entrance and every route here
passes through it.

**Append-only, and exempt from the 200-line target.** Add an entry when an instrument misleads you.
Correct one that turns out wrong; never shorten one, because the condensed version keeps the fix and
loses the shape — and the shape is the transferable part. Same category as
[AI-INVARIANTS.md](AI-INVARIANTS.md) and [GRABHIST.md](GRABHIST.md).

**Deliberately not counted, and this is load-bearing rather than fussy.** The heading said "seven"
for a week and was wrong the moment somebody found an eighth — the same failure the list itself is
about. Then the parent file's own one-line summary went on promising *"all seven"* for another week
after the section had stopped counting, which is the identical mistake surviving in the identical
file. **Add to it; do not tally it, and do not quote a count of it anywhere.**

## The entries


**A counter that says "must be 0" and is not 0 may be counting the wrong thing.** `aitest.js`'s
*Declining to win* sat at 13 for weeks: turns where the bot held a guaranteed game-ending attack and
"did something else". It fired on **any** non-attack action taken in such a turn — so attaching an
Energy and then winning read as declining to win. Attacking last is ordinary correct play; the fault
being hunted is *ending* the turn with the lethal still on the table, and only `pass` does that.
Corrected 21 Aug 2026, and **the honest figure is 0 across 9,610 games**. The old number is not
comparable with the new one. The general shape is the nastiest kind of instrument failure here,
because it fails *loudly*: it points at a bug that does not exist, and the label tells you to go
looking.

**`aiduel.js` took its git ref positionally and ate any flag in front of it.** `aiduel 10 --gbc` ran
`git show --gbc:Shadowless/src/ai.js` and died in a stack trace that reads like a git problem. Fixed
the same day — flags are filtered out of the ref now — but it is worth knowing what the failure looked
like, because the obvious response is to go and look at git.

**Never read selftest's win rates as AI quality.** Both seats run the same AI there, so seat 0's
figure measures first-player advantage and drifts several points from any change that alters game
length. It moved 54% → 51% on a change the duel then proved was a *gain*.

**Always run `--control` before believing a duel.** It seats the baseline against itself, so the
answer must be 50%. The first version of `aiduel.js` alternated seats by seed (`newSeat = i % 2`),
which correlated the seat with a deterministic opening coin flip — and the control came back at
**55.7%**. It had been reporting a six-point edge for a change that did not exist. Every seed is now
played **twice, mirrored**, so the bias cancels exactly instead of on average, and the control reads
50.0% by construction. A harness that agrees with you is worth nothing until it has disagreed with
you once.

**Check the game you are measuring is the game that exists.** Every harness in this repo drove setup
as `setupAuto(0); setupConfirm(0); setupAuto(1); setupConfirm(1)` — and `setupAuto` ends by calling
`setupConfirm`, so the fourth call re-ran `beginPlay()` and dealt a second set of Prizes. **Every
scripted game from Job 4 to 11 Aug 2026 ran at 12 Prizes instead of 6.** Nothing failed; the games
were simply twice as long, and the deck balance table reversed when it was fixed. A/B comparisons
survived it, because both sides played the same wrong game, but every absolute figure taken before
the fix is void. **Print the opening position once in a while and look at it.** This was found by
reading a match log, not by a test — see [HISTORY.md](HISTORY.md) for the full account.

**A duel cannot see a rare catastrophic error, and those are the ones that matter to a human.** The
bot used to decline game-winning attacks — 35 times in 96 games, measured. Fixing it moved the duel
by nothing at all (49.8% ± 3.9), because the position is uncommon and *both sides of an AI-vs-AI game
share the fault*, so it cancels. A player who watches it happen once never trusts the opponent again.
**When a fault is rare, symmetric, or about what the AI can perceive rather than how it scores,
assert it in `powertest.js` and count it in `aitest.js` — do not ask the duel.** The duel measures
average strength and nothing else.

**`aiduel.js` played only the four Base Set theme decks, so it could not see a change about any
other card.** The default pool is 240 cards holding **11** Pokémon the stickiness work classifies as
walls — and not one Kangaskhan, Chansey, Snorlax or Electabuzz, which are the four the work is
*for*. Overgrowth contains none at all. The change measured 51.0% ± 5.0 and the honest reading of
that number is **not** "no effect"; it is "the harness never dealt the situation".

This is the most dangerous entry in this list, because it fails *silently and in the safe direction*.
A blind harness reports 50% for anything, which reads as "your change did nothing" — the one verdict
nobody argues with. Everything above at least looked like a result.

`--gbc` swaps the pool for the **18 ladder decks**, which hold 112 wall cards and are what the player
actually faces now. Control run first, as ever: 50.0% ± 1.9 over 2,592 games. **The four theme decks
were the whole game when this tool was written and they are now a sixth of the card pool** — assume
the default pool is unrepresentative for anything touching a card outside Base Set.

**`aitest.js` was still blind in exactly this way until 16 Aug 2026** — a year of `--gbc` existing on
one tool and not the other. The sharpest illustration this project has: the theme decks say **6.3%**
of games end in a deck-out and the ladder decks say **17.7%**, which is the difference between a
curiosity and the third most common way the game ends. It takes the flag now. **Take it.**

**`selftest.js`'s AI ladder was asserting a statistical claim at a sample that could not carry it,
and it looked like a verdict rather than noise.** The check is `expert beats novice`, and it ran at
36 games against a true rate near 61% — one standard error is 8 points, so the 50% threshold sat 1.6
of them away and the gate went red for roughly one change in twenty on merit alone. Worse than
flaky: the seeds are fixed, so it is *deterministic per tree*. It fails identically every run and
reads as a finding.

It cost a diagnosis on 13 Aug 2026. The confusion-on-retreat fix tripped it at 61% against a 66%
baseline — and the **control in the same table**, expert against itself, had moved half as far in the
same direction. Both trees passed comfortably at 90 games. The tell was there on screen and had no
label on it.

Fixed rather than tuned around, and neither half costs anything — the whole suite runs in **under
three seconds**, so the sample was never a runtime tradeoff. The section has a floor of 90 games per
tier, the assertion fails only on a **significant** inversion (the interval is printed beside each
row, matching `aiduel.js`), and `expert vs expert` is now labelled as the control it always was.
**Raising `N` narrows the interval**, so a session that wants a tighter number can still have one.

The general lesson is the one this whole file keeps paying for: *a threshold is only as meaningful as
the sample under it, and a green suite that flickers teaches sessions to distrust the suite.*

**The per-deck table is not a per-deck verdict.** The four theme decks are not balanced against each
other, so the deck rows show deck strength, not AI quality. Zap sits at 25% in the control because
Zap is a 25% deck. Reading its 39% in a duel as a *regression* sent one session chasing a phantom
and "fixing" it — compare each row against the control's row, never against 50.

**The instrument may simply not contain the thing you changed, and it will not say so.** All six
above are ways a measurement *misreports*. This one is worse, because it reports cleanly. The 17 Aug
2026 retreat reversal ran `selftest.js` before and after and got **byte-identical win rates** — not
close, identical — which reads as "no effect" and is in fact "no exposure": the rule only bites where
a multi-symbol Energy meets a retreat cost, and **none of the four theme decks contains a Double
Colorless**. The same blindness had already produced a *false positive* five days earlier, when the
original ruling cited a movement in that table as evidence it was harmless. Measured where the cards
actually are — the ladder decks, 7 of 18 running DCE — the change diverged **22.5% of games**.

The check is one question asked before the run, not after: **does the fixture contain the card, the
verb or the board state the change is about?** Ask it of `selftest.js` in particular, whose deck list
is fixed, authentic and therefore permanently unrepresentative of anything outside Base Set. A count
of how often the changed code path was *entered* belongs in any A/B harness for the same reason.

**`abtest.js` accused a clean control of being a dirty one, and it had done so since it was written.**
*22 Aug 2026.* Its "is the working tree identical to the baseline" check compared `git show`'s blob
against the file on disk **byte for byte**, and on this machine `src/ai.js` is LF in the blob and CRLF
in the working copy. So the flag was permanently false for the one file an AI pass changes. Both
consequences point the wrong way: the reassuring *"src/ is identical, expect 0% divergence"* line
could never print, and the alarming *"0% divergence with a REAL diff in src/ — the change is inert, or
the pool never dealt it"* fired on a **deliberate null control**. Somebody following this file's own
standing rule — run the control first — was told by the tool that their control looked broken.

Found by running one, which is the only way it could have been found. Fixed by normalising line
endings before the comparison, and **verified in both directions**: the NOTE now prints on a null
control and stays silent against a real diff. *The transferable part is not about line endings.*
**A harness that reports on its own inputs can be wrong about them**, and that class of error is
invisible precisely when the harness is otherwise behaving — every game in those runs was simulated
correctly, and only the commentary was false.

**`packtest.js` opened 200,000 packs and only ever opened Base Set.** *24 Aug 2026.* Four sets are
live; the pools differ in size and rarity split; Trevor was opening Team Rocket when he reported his
Shiny and 1st Edition pulls feeling too frequent. **Making the run bigger could never have found
this**, which is the part worth carrying: a sample of 200,000 reads as overwhelming and says nothing
at all about the three sets it does not contain. It is the same shape as the `--gbc` entries above —
a fixture that does not contain the thing you are asking about — arriving in a suite rather than in
an AI harness, and arriving with a five-figure sample size as camouflage. **Ask what the fixture
covers before you ask how big it is.** Swept now, and every live set lands on the table.

**And it reused ONE RNG stream where the game makes a fresh one per pack.** Same day, same
investigation, and this one is nastier because nothing about the code looks wrong. `packtest` drew
200,000 packs from a single `mulberry32(20260809)`. `openNextPack` builds a **new** `mulberry32` per
pack from `Math.random()`, so every real pack samples the first ~50 outputs of a brand new stream —
the one property a single long stream cannot test, by construction. A PRNG whose early output was
biased as a function of its seed would have produced exactly the reported symptom while the suite
stayed green forever. Measured in both directions: clean, and now asserted. *The general shape is
that a harness can reproduce a system's LOGIC exactly while differing in how it is DRIVEN, and the
difference is invisible in a diff because neither side is wrong on its own.*

**Then the fixture built to close that gap flaked deterministically, and read as a finding.** The
fresh-stream check first seeded each pack from an arithmetic stride, `i * 2654435761`. Structured
seeds give structured first outputs: Reverse Holo read **1-in-9.1 at the fast-pass sizes and 1-in-9.9
at the full one**, so `packtest 20000` went red identically on every run and `packtest 200000` was
green. Deterministic, reproducible, and entirely about the fixture — the same trap as the
`selftest.js` AI ladder above, in a file written the same afternoon by someone who had just read this
entry's neighbour. Fixed at the cause rather than by widening the tolerance: the seeds come from a
generator now, which is also what `Math.random()` actually is. **A tolerance you widened until the
suite went green is a finding you deleted.**

**And the fast pass that survived all of that still goes red on a clean tree.** Measured 26 Aug 2026
during a documentation pass, on a tree with no code change in it at all: `node tools/packtest.js
20000` fails **six** assertions, `50000` fails one, `100000` and up are clean. Nothing is wrong. The
rare axes are 1-in-275 and 1-in-1375, so twenty thousand packs give a Shadowless about seventy
sightings and a Misprint about fifteen, and fifteen is not a sample — the tolerances are correctly
sized for the full run and the *count* was the thing that was wrong.

**The reason this one is worth an entry is that the bad count was in the documentation.** Both
`CLAUDE.md` and `TOOLING.md` advertised `20000` as "a fast pass while iterating", so the recommended
command produced a red suite for reasons that were not a fault, in a project whose gate is *run all
six before calling anything done*. **That does not make somebody investigate; it teaches them that
this suite is noisy and to skim past it** — which is the exact failure `pullcheck.js` sets its own
threshold at p<0.01 to avoid, and it would have hidden a real regression the day one arrived. Both
files now say to run it whole; the full run takes about four seconds, so there was never anything to
save.

**The general shape: a sample size named in prose is a threshold, and it rots the same way any
other number in prose does.** Nobody re-derived it when the pack shrank from eleven cards to eight
on 25 Aug 2026 and every per-slot axis got rarer — which is what moved the fast pass from *mostly
green* to *reliably red* without one line of the suite changing.

**A rate of one in 380 is indistinguishable from zero in a sample of 1,540, and "zero" and "rare" are
different answers to different questions.** *28 Aug 2026.* A scratch probe was written to find out how
often the bot attaches an Energy to the wrong slot — *misdirection* — and read **0 of 1,540
attachments**. That looks like a closed question, and the sentence it supports is *"this never
happens."* The real rate, measured the same day over `aitest.js 8 --gbc` at **228,832 attachments**,
is **605 — 0.26%**, which the report prints as 0%. At that rate the small probe should have seen about
four, and seeing none was ordinary luck rather than evidence.

**Both runs were correct and only one of them could answer the question.** The distinction is not
sample-size pedantry: *never happens* closes an open item and deletes a line of reasoning, while *one
in 380* leaves it open and small. **Before you write "never", compute how many the sample should have
contained** — if the answer is single digits, the probe cannot tell zero from rare and you have
measured your own patience.

**And the report rounds.** 0.26% displaying as `0%` is the same trap arriving a second time in the
same afternoon, from the formatter rather than from the sample. A counter that can print zero for a
non-zero quantity needs either a decimal or a raw count beside it.

**A correlation over three points is not a correlation, and the tier with the interesting result is
always the one with fewest members.** *29 Aug 2026.* The three T4 bosses assemble at 89% / 76% / 53%
and finish 12th / 10th / 9th of nineteen — a perfect inverse ordering, which got written into two
files as *"a boss that assembles more reliably wins less."* Checked against all fourteen decks that
have a centrepiece within the hour, Pearson r is **+0.31**, and **+0.60 within T2 and +0.76 within
T3**. Assembling your centrepiece helps, and it helps more the higher the tier is built. The −0.91
inside T4 is three points; any three non-collinear points produce a large coefficient.

**The pull is structural rather than careless.** The finding you want to write up lives in the group
that is interesting *because* it is small — one boss per roster, by design. So the temptation to
generalise is strongest exactly where the sample cannot carry it, every time, and it does not feel
like extrapolating: three out of three reads as unanimous rather than as n=3.

**What actually survived is a LEVEL difference, not a relationship** — T4 assembles at 73% against
T3's 50% and wins 48.7% against 57.6%. That is a comparison of means over nineteen decks and it holds.
**Ask which shape your claim is** before writing it: *these two quantities move together* needs a
sample, *this group sits above that group* needs only the groups.

**And the second trap in the same block, which nearly landed too.** Computing the tier means over only
the decks that *have* a centrepiece put T2 at 58.3% — above T3 — because the five decks with no
centrepiece sit mostly at the bottom of the standings, so excluding them is selection on the outcome.
`decksim.js` prints tier averages over every deck it ran. **Take the tier average from the tool, never
from a filtered subset of its rows.**

**`abtest.js` prints "investigate before reading anything else" on a CLEAN TREE, and the number is
noise.** *29 Aug 2026.* Its stall counter reads ~33 of 2880 games per side — about 1.1% — with `src/`
identical to the baseline and divergence at a correct 0.0%. So the loudest line in the report fires
when nothing is wrong, which is the same disease as `packtest 20000` two entries up: **a documented
command that shouts on a clean tree teaches whoever runs it to skim the output**, and the next real
stall will be skimmed with it.

**The control is what says so, and it is free.** A rules change measured the same afternoon read 34
stalls and 4.0% divergence; the control read **33 stalls and 0.0%**. One stall of difference against a
change that altered 4% of games is nothing, and without the control the 34 would have looked like
something the change had introduced. **Run `abtest` against `HEAD` on a clean tree before you believe
any stall count**, exactly as you would before believing a divergence.

**The cause was NOT found and that is stated rather than implied.** The obvious candidate is wrong:
`abtest`'s game loop dispatches only `pendingSwitch` and `pendingPromote`, where the engine has
**four** owed choices — but a hand-rolled reproduction of that loop over 140 ladder games produced
zero stalls, so `pendingAsk` and `pendingPrize` are not reaching it. The remaining difference is that
one side of an `abtest` run is `src/` **materialised from a git ref**, so the stall may live in the
harness's own plumbing rather than in either engine. **Whoever picks this up: instrument the stall
branch to print `state.pending*` and which side stalled, rather than reasoning about it — two of us
have now reasoned wrong about the same 8000-action cap.**

**What is safe to conclude today:** a stall count near 33 on a Defender-restricted run is the floor,
not a finding. **A stall count that moves a lot is worth reading.**

## The `abtest` stall floor scales with the run, so quote it as a rate — 30 Aug 2026

**The floor recorded above is 33 of 2880 games per side, and somebody reading that number rather than
its rate will investigate a healthy run.** At `abtest 8 HEAD` on the full ladder pool the run is
**17,296 games per side and the floor is 308** — six times the absolute count, and the loudest line
in the output still says *investigate before reading anything else*.

**The run that prompted this read 313.** Five above a floor of 308, which is nothing; but there was
no way to know that without running the null control on an identical tree, because the only figure
written down was an absolute one from a much smaller sample. **The control is the whole answer here
and it costs one run**: check out `src/` clean, run the same command, read the stall count and the
0.0% divergence together.

Both figures are the same instrument at two scales — 1.1% and 1.8% — so **the honest form is a rate,
and even the rate moves with the deck pool**. Treat any stall count as uninterpretable until you have
the control for *that* command, exactly as you would a divergence.

## The stall floor is only a floor when nothing diverged — 31 Aug 2026

**Yesterday's entry above says to quote the `abtest` stall count as a rate rather than an absolute.
That was right and it is not enough**, and the change that exposed it is the turn-ordering one:
**75.6% divergence, and the stall count went 308 → 341.**

**308 was measured on an IDENTICAL tree**, where both sides play the same 17,296 games twice. **A run
that diverges is not playing those games any more.** Once three quarters of the games are different
games, the stall count is a fresh sample from the same distribution — and at a rate of ~1.8% on 17,296
games one standard deviation is about 17, so 341 is under two. **Comparing a diverging run's stalls
against the identical-tree floor is comparing against the wrong baseline**, and it will read as a
regression on any change big enough to matter.

### What a stall actually is, instrumented

Written down because `MISREADINGS` has speculated twice that it "may live in the harness's own
plumbing", and `abtest`'s loudest line still says *investigate before reading anything else*. Running
its own loop over 400 ladder games, on both trees:

| | with the change | HEAD |
|---|---|---|
| mean actions per game | 123.6 | 122.7 |
| **most actions in one turn** | **20** | **20** |
| hit the 8000-action cap | 1 | 1 |
| **`aiChoose` returned null** | **6** | **6** |

**A "stall" is overwhelmingly `aiChoose` returning null — about six times in every four hundred games
— and only rarely the action cap.** Both numbers are *identical* across the change, which is what says
the ordering work introduces no pathology: same ceiling on a single turn, same cap hits, same nulls.
Games are 0.7% longer, which is what drawing earlier looks like.

### The check to run, when a stall count moves

**Do not reason about it** — that is this file's standing advice on this exact counter and two sessions
have now been wrong. Copy `abtest`'s own `playGame` loop, instrument it, and run it against both
`src/` trees. **Copy the loop rather than writing one**: a hand-rolled version got zero actions per
game on the first attempt, because the setup phase is driven by `setupAuto` + `setupConfirm` rather
than by the action loop. Mirroring an engine rule by hand is the failure `openercheck.js` was built
out of, and it cost ten minutes here.

**The three numbers that matter are max-actions-in-one-turn, cap hits and null returns.** A loop moves
the first. A pathology moves the second. Anything else is the sample moving, and the sample moves
whenever the games do.

## A fixture can measure a number the engine cannot produce — 31 Aug 2026

**Three green `powertest.js` assertions had been sweeping the barrier curve against damage no attack
in this game can land, and they were green because the AI agreed with them.**

The fixture piled Water onto a Lapras and read `incomingThreat`, on the stated reasoning that its
"Water Gun grows with its Energy". It does not grow past 30 — the card prints *"you can't add more
than 20 damage in this way"* and the engine has capped it since Job 6. The **scorer** never learned
the cap, so `incomingThreat` cheerfully reported 70 off a Lapras that deals 30, and the three tests
swept threats of 50, 60 and 70 that were all really 30. One of them asserted *"board is not lethal;
the test proves nothing"* as its own guard, and that guard had never once been true.

**They were found by fixing the scorer and watching them go red** — never by reading them. Every one
reads perfectly: the card, the sweep and the comment all say the right thing, and only the printed
text disagrees.

### The shape, which is the transferable part

**A test fixture is AI output too.** This project already holds the invariant — *the AI can never
predict a number the engine would not produce*, 13 Aug, asserted about `bestAffordableDamage` — and
the violation was sitting **inside the suite that asserts it**. Nothing anywhere checks that a
fixture's premise is reachable, and the failure is silent in the worst way: the test does not
merely pass, it passes *for the reason it says it does*, right up until somebody fixes the engine
half and the suite goes red on a correct change.

**The practical check, and it is ten seconds.** If you are sweeping a quantity by attaching Energy to
a card, **execute the attack once at the top of the sweep and read what it deals.** The engine is
right there. A sweep whose rungs are 30, 30 and 30 wearing the labels 50, 60 and 70 cannot be seen
any other way.

**And the repair is not "delete the test".** All three assertions were about the barrier curve and
all three were correct; only the generator was wrong. It is now two cards, because no single live
card sweeps a threat from 10 to 80 — which is itself worth knowing before designing a fixture. A
fourth assertion was added to license the pair: **the barrier must be a function of the threat, not
of the card making it**, checked where two different cards threaten exactly 20.

*[The scorer half, and the two guards it left →](AI-INVARIANTS/SLOT-PRINTED-DAMAGE.md)* ·
*[the pattern the fix came out of →](Playbook/OVER-ATTACH.md)*

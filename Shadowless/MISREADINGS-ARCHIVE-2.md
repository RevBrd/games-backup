# Shadowless — how a measurement lied, archive 2 (30 Aug – 2 Sep 2026)

**The second archive of [MISREADINGS.md](MISREADINGS.md).** Split on 19 Sep 2026 in Job 17b, when the
live file reached 467 against the ~450 threshold in its own header. [Archive
1](MISREADINGS-ARCHIVE-1.md) was at 214 of its own ~250 and had no room for a block this size, which
is the case its header names: **start the next archive rather than growing this one.**

**Everything here is still true and still worth reading.** These are the Job 15d-era entries — the
whole `abtest` stall-floor investigation from "quote it as a rate" through to the one missing branch
that turned out to cause it, the fixture that measured a number the engine cannot produce, the
non-deterministic `smoke.js`, and the counter that reads its ideal value and therefore most needs a
control.

**Append nothing to this file.** New entries go in the live one. Correct an entry here if it turns out
wrong; never shorten one — the condensed version keeps the fix and loses the shape, and the shape is
the transferable part.

**Start `MISREADINGS-ARCHIVE-3.md` rather than growing this one past ~250**, and the live file's
header carries that rule too, because a constraint stated only in the thing being constrained is read
too late.

---
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

**"The `abtest` stall floor scales with the run" says to quote that count as a rate rather than an absolute.
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

## The `abtest` stall floor had a cause after all, and it was one missing branch — 2 Sep 2026

**Three earlier entries are about that stall counter** — "prints 'investigate before reading anything else' on a CLEAN TREE", "the floor scales with the run", and "only a floor when nothing diverged". One says to quote it as a rate, one
says the rate scales with the pool, and one says outright: *"The cause was NOT found and that is
stated rather than implied."* It also names the obvious candidate and rules it out — `abtest`'s loop
dispatches only `pendingSwitch` and `pendingPromote` where the engine owes four choices, but a
hand-rolled reproduction over 140 games produced zero stalls, so the suspicion moved to the harness's
git plumbing.

**The candidate was right and the reproduction was under-powered.** Measured over 600 ladder games
per dispatch form, expert on both seats:

| dispatch | games finished | `aiChoose` returned null |
|---|---|---|
| `pendingPromote` only | 547/600 | **53 (8.8%)** |
| `+ pendingSwitch` | 592/600 | **8 (1.3%)** |
| `+ pendingAsk` | 600/600 | **0** |
| `+ pendingPrize` | 600/600 | 0 |

`abtest` was on the second row. Its ~1.1–1.8% floor is an unhandled **`pendingAsk`** — Challenge! and
its relatives, which stop mid-turn to ask the opponent something. The null control on an identical
tree, 2400 games a side, went **34 stalls → 3** when the branch was added. Not the bot, not the
action cap, not git.

**Why 140 games said zero and 600 said eight.** At 1.3% the expected count in 140 games is under two,
and zero is an ordinary draw. *A null result at a sample that cannot resolve the effect is this
file's founding shape, and it caught the session that was writing in this file about it.* If you are
ruling a cause out, work out what the sample could have detected before you write "not found".

**The generalisation is worth more than the fix.** The correct dispatch already existed, in
`smoke.js`, under a comment stating the rule in full — *"ANY state that owes an action by somebody
other than `s.active` has to be listed here, or the loop asks the wrong player, gets nothing, and
breaks out of a game that was merely waiting."* It never reached the seven other loops **in its own
file**, let alone the five other tools. There were fourteen copies in three versions.
*[The measurement, and the one definition that replaced them →](../Shadowless/tools/lib/owed.js)*

## `smoke.js` was not deterministic, and a green re-run is what hid it — 2 Sep 2026

**A run came back 158 passed, 3 failed. Twenty-two consecutive re-runs came back green.** That is the
worst possible way to meet a flake, because the natural reading of twenty-two greens is that the red
was an artefact of whatever else was happening on the machine — and the session that found it spent
an hour on exactly that theory, testing it under deliberate CPU load, before looking at the suite.

`ui.js` reaches for `Math.random()` in two places: the match seed when `UI.seedDraft` is empty, and
the pack seed in `openNextPack`, which has **no seed knob at all**. A scan of all 59 match and pack
entry points in the suite found 56 pinned and 3 not — the **first** `startMatch()` in the file, and
both pack opens.

**Seven tests hang off that first match**, including one that plays it to completion and throws
unless it finishes inside 800 steps. Its failure message said *"game did not finish in 800 steps"*
for a `break` on a null from `aiChoose`, so the reader was sent to look at a cap that was never the
problem — the same missing `pendingAsk` as "the stall floor had a cause after all", seen from the front.

**Somebody had already met the other half of this and fixed the symptom.** The comment on *"the Rare
is shown last"* says plainly that the pack *"opens on real `Math.random()`, not a fixed seed"* and
that asserting more *"would flake on whichever run happened to roll a bonus one"* — so the assertion
was weakened and the randomness left in place. That was a reasonable local call and it left every
other assertion downstream of that pack exposed.

**The shape: a suite that is deterministic in 95% of its entry points reads as deterministic.** Nobody
audits the other 5%, because the evidence for determinism is the same evidence either way — it passes
every time you run it, until it doesn't. `packtest.js` has never flaked because its seed is fixed by
construction rather than by habit.

## And a counter that reads its ideal value is the one that most needs a control — 2 Sep 2026

**`openercheck.js` reported `OVERALL 0.0%` on every deck, and had done since it was written.** Which
is either "the opening-Active rule is working perfectly" or "this measurement has been dead for a
fortnight", and **nothing in the output could tell you which**. This file opens with the inverse
failure — a counter that should be 0 and is not — and the ideal-value case is worse, because a
number at its target is the one reading nobody goes back to question.

The control it now has computes the counterfactual on the same hands: pick the opening Active at
random from the legal Basics instead of by the rule.

| | stranded a line-starter |
|---|---|
| the rule | **0.0%** |
| `--control` | **26.2%** |

So the metric is alive and the rule is removing a quarter of stranded openings — which is a result
the tool has always been capable of producing and had never been asked for.

**The control had to avoid one specific trap and it is written into the tool's own header.** Its first
version reimplemented `setupAuto`'s rule in order to measure it, and therefore reported identical
figures before and after the rule was fixed. So the control computes the counterfactual on the hand
rather than running a second engine with a mirrored rule.

## The fix for a line that shouts can shout in the other direction — 2 Sep 2026

**Small, and it happened inside one hour, which is the only reason it is here.** `abtest`'s stall line
said *"investigate before reading anything else"* on every clean-tree run. The fix was to print a rate
and warn only outside a known band, and the band was written as `[0.5, 3.5]` from the floor recorded
in "the floor scales with the run".

Then the cause was fixed and the floor went to 0.1%, so the new line said **"OUTSIDE the known band,
worth reading"** on a null control reading zero divergence. Same disease, opposite sign, four commits
apart.

**A threshold with a lower bound asserts that the healthy value cannot improve.** Where zero is the
good reading, the bound belongs on one side only. Worth checking any other "normal range" in this
tree against that.

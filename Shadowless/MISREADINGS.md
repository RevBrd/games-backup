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

**When this file passes ~450, start the next `MISREADINGS-ARCHIVE` at a job boundary** rather than
growing it. Stated here, at the top, before the decision — because a limit written only where it
would be read afterwards is not a limit, which is a lesson three registers in this tree have each
paid for separately. **This sentence named `ARCHIVE-2` until that archive existed**, which is the
hand-list failure arriving in a rule about archiving; it names the series now.

**The archives, oldest first — this table is the roll and nothing else should hold one:**

| Archive | Entries | Read it for |
|---|---|---|
| [MISREADINGS-ARCHIVE-1.md](MISREADINGS-ARCHIVE-1.md) | 11–26 Aug 2026 | the counter that says "must be 0" and counts the wrong thing, the harness that never dealt the situation, the two months every scripted game ran at 12 Prizes |
| [MISREADINGS-ARCHIVE-2.md](MISREADINGS-ARCHIVE-2.md) | 30 Aug – 2 Sep 2026 | the whole `abtest` stall-floor investigation end to end, the fixture that measured a number the engine cannot produce, the non-deterministic `smoke.js` |

*(**Archive 1 exists because the threshold was written and blown on the same day, 2 Sep 2026.** It
went in that morning at 362 lines; Job 15d appended four entries and took it to 478 by the afternoon.
The archive was paid the same session rather than left for whoever next opened the file — an unpaid
limit on day one is how a limit stops being one, and `HISTORY-ARCHIVE-2` had to be told exactly that
about itself a day earlier. **Check this file's own `wc -l` at the start of your pass**; it is the
cheapest finding in the tree and the one nobody runs. **Archive 2 was paid the same way on 19 Sep
2026** — the entry that crossed the line was written, the number was checked, and the split happened
in the same commit rather than being left as a FLAG for the next pass.)*

*(**This file had no threshold at all until 2 Sep 2026**, and that is worth the two lines rather than
a silent fix. `MAINTENANCE.md` asserts that every register here carries one — it says so while
telling you to go and check each register's own number, which is the cheapest finding available and
the one nobody runs. `ROSTERS.md`'s header, written 29 Aug, says it **was** "the one register with no
threshold written down". It was not the one; it was one of two, and this was the other. **A file that
nobody has ever had to archive is exactly the file whose limit nobody notices is missing** — it was
at 362 and would have crossed unremarked.)*

**Deliberately not counted, and this is load-bearing rather than fussy.** The heading said "seven"
for a week and was wrong the moment somebody found an eighth — the same failure the list itself is
about. Then the parent file's own one-line summary went on promising *"all seven"* for another week
after the section had stopped counting, which is the identical mistake surviving in the identical
file. **Add to it; do not tally it, and do not quote a count of it anywhere.**

## The entries

**The oldest entries — 11 to 26 Aug 2026 — are in
[MISREADINGS-ARCHIVE-1.md](MISREADINGS-ARCHIVE-1.md)**, moved there on 2 Sep 2026 at the end of Job
15d. Among them: the counter that says "must be 0" and counts the wrong thing, the harness that never
dealt the situation and therefore reported 50%, the two months every scripted game ran at 12 Prizes,
and `packtest`'s four separate ways of being right about the wrong pool. Nothing was shortened.

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
when nothing is wrong, which is the same disease as the `packtest 20000` entry: **a documented
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

## A backgrounded `abtest` measures the tree you had when you LAUNCHED it — 15 Sep 2026

**`tools/abtest.js` `require`s the working `src/` at module load** (lines 126–129, beside the
`git show` that materialises the baseline). Node caches modules, so the working half of the
comparison is a snapshot taken at process start and nothing re-reads it.

That is correct and unremarkable for a foreground run. **It is a trap for a backgrounded one**, which
is how a long full-pool run is normally done here — 41,600 games a side takes minutes, so you start
it and carry on working. Carry on *editing `src/`*, and the number that arrives describes a working
tree that no longer exists. **The output is identical either way**: same header, same pool line, same
interval. Nothing in it names a commit for the working half, because there isn't one.

**How it surfaced.** A full-pool run launched after one `ai.js` fix reported **1.5% ± 0.1**. A
subsampled run launched after three more fixes reported **3.8% ± 0.7**. The intervals do not overlap,
so it read as an instrument disagreeing with itself — and the resolution is that they measured
*different working trees against the same baseline*, which is a perfectly coherent pair of answers to
two different questions nobody had written down.

**THE SUBSAMPLE WAS INNOCENT, and suspecting it first was the wrong instinct.** `--pairs 400` carries
its own warning — *"quote the interval below, not the rate alone"* — so it is the visible suspect, and
a session that stopped there would have "resolved" this by re-running with more pairs and finding the
same 3.8%. The re-run on the full 4,160 pairs returned **3.7% ± 0.2**, which overlaps the subsample
cleanly. **The loud caveat was not the problem; the silent snapshot was.** When two runs disagree,
check what each was pointed AT before you go looking at how each was sampled.

**It resolved into a better result than either number alone**, which is the part worth keeping. The
exposure arithmetic makes both fall out:

| change | decks running an affected card (of 65) | share of ordered pairs exposed | divergence |
|---|---|---|---|
| the `base` drop | 2 | ~6% | 1.5% |
| that plus the three strip fixes | 14 | ~39% | 3.8% |

Divergence per *exposed* game is ~25% and ~10% respectively — one card that changes how a slot is
valued every turn against eight printings that change one rider. **Neither raw figure means anything
without the denominator**, and `abtest`'s own header prints the pool size but not the exposure.

**The rule.** *If you background an `abtest`, do not touch `src/` until it returns* — or accept that
you have measured a snapshot and say which one. When two runs disagree, check what each one was
pointed at before you go looking for a bug in either. And **quote the exposure alongside the rate**:
`--card` prints it (`restricted to decks holding X: 2 of 65`) and a plain run does not, which is the
difference between a number and a fact.

## The break-test that silently did not break — 11 Sep 2026

**The discipline in this repo is to revert a fix and watch the assertion go red.** It has caught a
guard matching two empty sets, a regex holding a literal backspace, and a test that measured nothing
because `E.flip` had been stubbed out from under it.

**This is the failure mode of that discipline itself.** The edit that was supposed to break the code
was a scripted multi-line replace with the wrong indentation, so it matched nothing and wrote the
file back unchanged. The suite then ran against the **working** code and came back green — and green
is what "this test cannot fail" looks like. One more step and a perfectly good regression row would
have been rewritten or deleted for being untestable.

**Every scripted edit in this project asserts its match count, and the break-test is the one place
that had been skipped** — because it is throwaway, and throwaway edits feel like they do not need
the ceremony. They need it more: a no-op edit to real source fails loudly at the next test run, while
a no-op *break* produces a **false reassurance** and no symptom at all.

**The rule.** Assert the match, or print the count, on the breaking edit too. And when a
break-test comes back green, suspect the edit before suspecting the test — the second run here
printed `sites with +3: 2` and turned three rows red immediately, including two on other cards that
shared the constant and would have gone unexamined.

## `teamReadiness` swings 5.6x on the OPPONENT's HP, and it is not a bug — 18 Sep 2026

**Chased while closing AI.md item 1, on the reasoning that if a benched Pokemon is priced in printed
damage and an Active in expected value, a function that ADDS them across every slot must be broken.**
It looks broken from outside, and a probe makes it look worse. Two identical Omastars, four Water
each, one Active and one benched:

| their Active | Active `pot.best` | the identical Bench copy | `teamReadiness` |
|---|---|---|---|
| Hitmonchan, 70 HP | 40 | 40 | **20** |
| Hitmonchan, 30 HP | **270** | 40 | **112** |

Nothing on our side of the board changed. A function whose name says *our team* moved 5.6x on a
damage counter belonging to them, because a lethal attack makes `scoreAttack` return knockout scale
and the Active's term carries a x4 weight.

**It cancels, because the absolute value is never read.** `teamReadiness` has exactly two call sites
and they are `before` and `after` around an Energy Trans move, four lines apart, with the opponent
untouched between them. Only `after - before` reaches a score. The 92-point baseline that looks like
a fault appears identically on both sides of the subtraction.

**The transferable part is the check, not the result.** *Find every call site before you price a
quantity that looks mis-scaled.* A number used only as a difference has no scale to be wrong about,
and the probe that makes it look most damning — printing the absolute value on two boards — is the
one that cannot see that. It took two minutes and would have been a day's work to "fix", with a
measurement that could never have shown the fix helping.

**What is genuinely unmeasured, stated so it is not re-suspected as the same thing:** the *difference*
is still in mixed currency. An Energy Trans that arms a lethal attack on the Active moves `after` by
roughly `4 x 0.1 x (KO scale)`, which `attachBuild: 3.5` then multiplies, while the same Energy
leaving a benched slot costs only its printed-damage delta. Whether that is correctly enormous — it
IS a great play — or a calibration accident is not known, and no board in the claims harness reaches
it. **That is a question about `attachBuild`'s scale, not about `teamReadiness`.**

## A sweep where every subject is in the SAME state cannot see a state-dependent fault — 18 Sep 2026

**The sweep said 0 of 188 and the answer was Chansey.** `slotKOChance` shipped crediting a benched
Pokémon the full chance of a Prize with no regard for whether taking it kills the attacker. Trevor
named the hole within the hour — *"sending Chansey in for a quick kill also gets 80 recoil damage, so
Chansey's dead on the following turn and both players are 1 prize better off"* — and the sweep written
to check exactly that had already come back clean:

```
benched printings whose best affordable attack can Knock Out: 188
  ...where taking it KILLS the attacker outright:  0  (0.0%)
```

**Every card in it was benched at FULL HP.** Recoil is survivable from full almost by definition — a
120 HP Chansey takes 80 from Double-edge and lives on 40. Damage the slot and the same probe reads:

| Chansey | `slotKOChance` before the fix |
|---|---|
| 120 HP | 1.00 — and correct, it survives |
| 80 HP | **1.00 — it dies** |
| 60 HP | **1.00 — it dies** |

**The transferable shape: a fixture that holds one variable constant across every subject is blind to
any fault that lives in that variable**, and it does not fail — it returns a confident zero, which is
the most persuasive result a sweep can produce. The zero was not wrong about the boards it ran; it was
wrong about the question it was asked.

**What makes it nastier than an ordinary bad fixture:** the constant was never chosen. Nobody decided
to test at full HP. `makeSlot` leaves `dmg` at 0 unless a board says otherwise, so the default state
of the harness silently became the scope of the finding. **Ask what your fixture is holding still, and
whether the fault could live there** — `tools/lib/board.js` takes `dmg` on any slot and the second
probe was one line longer than the first.

**And the check that would have caught it costs nothing: sweep the same pool twice at different
values of the thing you are not varying.** Full HP and half HP disagree here on the first card.

## A SCORE is not a DECISION, and I spent an hour on the difference — 18 Sep 2026

**A retreat that used to score −0.60 started scoring +5.40 and I read it as a rule failing.** It was
never chosen. `Scrunch` beat it at **24.89** on the same board, and the bot did exactly what Trevor's
rule says a wall should do.

I went on to try three reformulations of the suppression curve, each aimed at pushing 5.40 back under
zero, before running `explain()` — **one call, which prints the whole ranking**:

```
attack:Scrunch     24.89
bench               7.00
retreat             6.15     <- the number I had been treating as the bot's answer
pass                0.00
```

**`scoreAction` returns a score per action and `pickBest` chooses among them.** A term that lifts one
action's score changes behaviour only where it crosses whatever is above it, so *the margin that
matters is never visible in the number you changed.* Reading one in isolation makes every positive
term look like a decision and every negative one look like a veto.

**The tell I ignored: I could not say what the retreat was competing against.** If you are about to
retune a weight because a score looks wrong, and you cannot name the action it has to beat, you are
not looking at a decision yet. `tools/lib/board.js`'s `explain()` exists for this and costs nothing.

**And the near-miss is the part worth keeping.** Three of those reformulations would have "worked" —
they push the number down — and every one of them would have been fitted to a margin that was not
the operative one, on a board whose baseline I had never verified. **A fix that lands on the right
side of the wrong comparison is indistinguishable from a correct one until something else moves.**

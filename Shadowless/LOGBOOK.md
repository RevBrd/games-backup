# Shadowless — the logbook

What each instance did, in its own words. Split out of `CREDITS.md` on 11 Aug 2026, because the
narratives had grown to four times the attributions they were attached to and an attribution list
should be readable at a glance.

`CREDITS.md` is the short version: who worked on what, and when. This is why.

## How to add an entry

**Append it at the END of this file, below the last entry.** Say what you did, what surprised you,
and what you would tell the next session — length is yours, and there is no house style to match
beyond the tree's. Sign your session number.

That first instruction is written down because it has already gone wrong: an entry once landed in
the *middle* of another instance's, because the surrounding text had been summarised out of view and
the end of the file was not where it looked. **If you cannot see the last entry, scroll to the actual
end before you write.**

**Writing here is completely optional.** A `CREDITS.md` row with no logbook entry is fine. A logbook
entry with no row is how somebody gets left off, so take the row either way.

**This file is an append-only register and the 200-line target does not apply to it.** Correct an
entry that turns out wrong; never shorten one — the whole value of a logbook is that it says what
somebody actually thought at the time. **That label was missing from this header until 8 Sep 2026**,
which is not cosmetic: `MAINTENANCE.md` tells a pass to find the registers by reading each file's
header rather than by keeping a list, so a register that never says the word is invisible to anybody
following the instruction — and to `tools/doccheck.js`, which found this by failing to find the very
overrun it had been written for.

**Entries move out of this file when the work they describe is CLOSED**, into whichever archive is
still short enough — **start a new archive rather than growing one past its limit.** Archiving is a
boundary and not a count; the old rule was "hold the two most recent" and by the time anyone checked
it was holding six at 295 lines. **The most recent closed entry stays behind on purpose**: instances
visibly write better entries when there is one in front of them, so the live file always opens with
an example rather than a blank.

**Both limits are ~450 — Trevor's call, 3 Sep 2026**, raising the live file from ~250 to match the
archives. **What it buys is more entries live at once**, which is the point: an arriving instance
reads this file and not the archives, so recent history being here is most of its value.

**The old split was ~250 live against ~450 archived, and the reason given for it does not survive
contact with how appending actually works.** It was that instances *append* here and an entry once
landed in the middle of another's when the end of the file scrolled out of view — a hazard that
"scales with length". **It does not scale with length; it scales with technique.** An append done by
`>>`, or by anchoring on the previous entry's signature line, lands correctly in a file of any size.
An append done by reading the whole file and writing it back is unsafe at 250 lines just as much as
at 450. So the number was guarding the wrong variable, and the mitigation belongs in the instruction
rather than in the cap:

> **Append by anchoring on the end, never by rewriting the file.** `>>` is safest. A targeted
> insertion after the last entry's `— #NN` line is fine. **Reading the file and writing back a
> version you assembled is the thing that has gone wrong**, and it goes wrong silently.

**~450 is deliberately inside the truncation zone and that is accepted.** Trevor's framing: mildly
truncated but still workable, and worth it for holding more entries. If you arrive with this file
compacted and need an entry in full, it is in git.

**Roughly four entries fit**, at the 75–105 lines these have been running.

**Assume this file is over its limit and go and look — it was at 609 on 2 Sep 2026**, holding five
entries against a rule sitting at the top of its own header. That is the third register in this tree
to be found past a threshold written into itself, which is why the number is stated here at the point
of decision rather than only in the archive.

*(**And it was at 296 the same evening, which is the part worth reading.** Archive 6 was created that
morning by the pass that wrote the rule above; by the time the next session opened the file it was
already 46 lines over, because the archiving pass had appended its own entry after finishing. So the
limit was breached by the person enforcing it, in the same commit. Archive 7 was made at the end of
Job 15d — **before** appending #35 rather than after, which is the only ordering that works.)*

**Nothing already written may be edited or condensed**, here or in any archive — a later pass may
find an entry redundant and it is not, because the value of a logbook is that it says what somebody
thought at the time. Correct an entry; never shorten one. The 200-line target does not apply to any
of these files.

## What is where

| File | Instances | When | Read it for |
|---|---|---|---|
| [LOGBOOK-ARCHIVE-1.md](LOGBOOK-ARCHIVE-1.md) | #0–#10 | through 12 Aug 2026 | The Claude Chat era, Jobs 4–6, the first four documentation passes |
| [LOGBOOK-ARCHIVE-2.md](LOGBOOK-ARCHIVE-2.md) | #11–#14 | 12–15 Aug 2026 | Job 7, the AI retreat and recoil work, the opponent-deck research, the fifth documentation pass |
| [LOGBOOK-ARCHIVE-3.md](LOGBOOK-ARCHIVE-3.md) | #16–#17 | 16 Aug 2026 | Job 9's first AI batch and the sixth documentation pass |
| [LOGBOOK-ARCHIVE-4.md](LOGBOOK-ARCHIVE-4.md) | #19 | 18–19 Aug 2026 | Job 10 — the trigger points, `enterPlay`, and Team Rocket going live |
| [LOGBOOK-ARCHIVE-5.md](LOGBOOK-ARCHIVE-5.md) | #20–#26 | 19–25 Aug 2026 | Jobs 10.5 to 12c — two documentation passes, the Jungle and Fossil brackets, the claims harness, the 8-card pack |
| [LOGBOOK-ARCHIVE-6.md](LOGBOOK-ARCHIVE-6.md) | #28–#32 | 26 Aug – 1 Sep 2026 | Jobs 13 to 14b — the promos and their reachability, the tenth documentation pass, the Over-Attach pattern |
| [LOGBOOK-ARCHIVE-7.md](LOGBOOK-ARCHIVE-7.md) | #33, #34 | 1–2 Sep 2026 | Job 15a's Challenge bracket and Job 15b's pack odds — including the legal deck that could not attack — and the eleventh documentation pass |
| [LOGBOOK-ARCHIVE-8.md](LOGBOOK-ARCHIVE-8.md) | #35, #36, #37 | 2–5 Sep 2026 | Job 15d's suite audit and `owed.js`, and Job 15e in both halves — the GBC 2 seam, then the attack road |
| **this file** | #38, #39 – | 7 Sep 2026 – | Job 15f's live inbox, and Job 15g — the standing documentation pass and `doccheck.js` |

**#15, #18 and #27 wrote no logbook entry and are not missing** — writing here is optional and a
`CREDITS.md` row alone is a complete record. Said explicitly because the Instances column above skips
those numbers, and a gap in a sequence reads as loss rather than as a choice.

**This table is the roll of archives, and it is the ONLY roll.** Anything else that lists them by
hand falls behind it. This paragraph used to say `CREDITS.md` "stopped doing so on 29 Aug 2026"; it
had not — that date is when somebody *extended* its hand-list to four entries, and by 8 Sep it was
three archives behind with seven instances unreachable from it. The list is gone now and every
`CREDITS.md` row links here instead. **Check this claim against the other file rather than trusting
it**, which is the whole lesson: a "that is handled elsewhere" sentence is a claim about two files
and it goes stale when either one moves.

**The preserved credit prose moved out with its entries.** #21 through #26 wrote no logbook entry,
their `CREDITS.md` rows had grown to between six and twenty-four lines each, and #27 moved that text
here verbatim before the rows were written short. All six now sit in
[LOGBOOK-ARCHIVE-5.md](LOGBOOK-ARCHIVE-5.md), still unchanged. **The rule is what to carry forward:
where an instance has no logbook entry, the row moves across whole first and only then gets
shortened** — never decide sentence by sentence what earned its place.

**One older artifact of this kind is in none of these files:**
`backups/pre-docs-cleanup/Packs Turn Log.txt`, the Sonnet 5 per-pass credits in that instance's own
words. It spent one pass unreachable — intact, indexed nowhere, cited by a sentence that had been
deleted. A pointer is not optional decoration on a preserved artifact; it is the half that rots.

---


---

## #38 — Job 15f, the live inbox (7 Sep 2026)

Trevor asked for `wants.js` to read the live Drive workbook instead of the newest hand-made export,
and to be easier on my own context while doing it. Both landed, but the interesting part was neither.

**The tool built to prevent a stale read had been making one for eleven days.** Newest local export:
Team Rocket, 24 Aug. Live Team Rocket sheet: edited 4 Sep. And a whole Gym Heroes workbook — 126
`gym1` rows on top of the same 339 — that existed only on Drive with no local copy at all. Every run
printed `workbook: Team Rocket Opponent Decks v1 (2026-08-24)` and `4 older not read`, which was
completely true. **Being honest about the wrong file is still being wrong.** The rule ("newest by
modification date") was never faulty; it simply stopped describing where the newest thing lived, and
nothing in a rule can notice that about itself.

Fixing the source added **19 live notes** the project had never seen, and turned up **122 `gym1`
notes** already written and waiting for Job 16.

**Three facts about the source decided the whole design, and two of them were the opposite of what I
expected.** I assumed a conditional GET: the published CSV sends **no `Last-Modified` and no
`ETag`**, only `max-age=300`, so HTTP cannot tell you whether a sheet changed and can be five minutes
behind an edit. I assumed the Drive-mounted `.gsheet` stub could be read for its `doc_id`, as
`machine.md` says: on `G:\` it cannot — `EISDIR` in Node, `Incorrect function` in both shells — and
only the checked-in copies on `C:` work that way. But **the stub's mtime tracks the live document to
the millisecond**, verified against the Drive API. So the thing that looked useless is the freshness
signal the whole module runs on, and it is free and works offline. I corrected `machine.md`.

**The cache is not a compromise, it is a requirement, and I nearly missed why.** `progresstest.js`
reads the same Index tab as a drift guard on `PROMO_GATES`, and it is **in the gate**. A suite that
fetches is a suite that fails on a train. So `readIndex()` is pure filesystem, `syncIndex()` is the
only thing in the project that opens a socket, and the snapshot is committed so a fresh clone can run
`node tools/test.js`.

**The gate then caught a real edit within a minute of being pointed at live data.** Trevor removed
the Ancient Mew row; `basep` went 29 → 28, and the assertion pinning "exactly one gated promo has no
card in the corpus" went red. That is the guard working exactly as its own comment promises. I
updated the assertion to 0 and **kept the escape hatch** rather than deleting it, because filing a
note ahead of its card is a normal thing for him to do again.

**The part I would tell the next session about is the drift check.** Pointed at live data it fired
nine `!!` lines where the stale read fired nine identical-looking ones, and **only one was a real
rewrite.** My first instinct was a similarity threshold, and that would have been wrong. I measured
the corpus instead: across all 142 claims the `note` field holds **four different things** — 127
verbatim cell quotes, 4 marked `(...)`, 9 opening with a source label and citing something that is
not the cell at all, and 2 that are the cell text with a later remark appended after a ` / `. Reading
that convention sorts them exactly. A cutoff would have sorted them approximately, forever.

So it grades now: `!! REWRITTEN`, `!! ORPHANED`, `+ EXTENDED` (he *added* a clause — the claim is
still true, there is just more to cover), `? UNQUOTED` (the claim cites a playtest rather than the
cell, and the cell now has a note nobody has checked it against), and a quiet `· touched` for
punctuation. Nine undifferentiated alarms became four graded lines. **A detector nobody trusts is a
detector nobody reads**, and Chansey's note going from six words to a paragraph was arriving
invisible in the middle of the noise.

**One thing I got wrong and it is worth naming because it is a tooling habit, not a mistake about the
project.** I ran the original `wants.js` with `tail -20`, saw three warnings, and told Trevor the
count had gone from three to nine. It had always been nine; I had been reading the bottom of the
output. I only found it while chasing a phantom bug in my own fallback path. **When you are about to
report a delta, make sure both halves came from the same window.**

**And `xlsx.js` is deliberately still alive.** `--xlsx` reads the old exports and is its only
remaining caller. It is the fallback if the publish is ever revoked, and keeping it wired to a flag
somebody might actually run beats leaving 200 lines to rot unnoticed.

**Then I worked two of the six rows the tool had just surfaced**, which is the point of building it.

**Chansey's note had tripled and the one claim covered a third of it.** *"Power up Scrunch and then
tank"* became *"To work as a tank or staller, hiding behind Scrunch and rarely ever retreating or
using Double-Edge"* — three clauses. The retreat one passes: a hurt Chansey with a fresh Hitmonchan
benched and the retreat affordable stands anyway.

**The attack clause is a pair, and my first draft of it was the trap `PLAYBOOK.md` names out loud.**
I wrote it against a 70 HP Hitmonchan, it went red, and the bot was right — Double-edge deals exactly
80, so it was a guaranteed Prize. **Trevor's word is "rarely", not "never", and lethal is the whole
of the exception.** Re-cut against a 90 HP Kangaskhan it scores −15.11 and Scrunch wins. Both boards
are asserted now, because one row can only ever say *"Chansey attacked"* and the board decides what
that means. I had read that warning twice this session before walking into it.

**Raichu's `+ EXTENDED` line found a real gap, and it is the best argument for the grading I built
an hour earlier.** Under the old binary check it would have been one `!!` among nine and I would
almost certainly have skimmed it. Trevor had added *"Agility buys turns through damage **and status**
denial on a coin flip."* The status half is worth **zero**, by construction rather than by a bad
weight: `denied = Math.min(incomingThreat, hpLeft)`, so a barrier against something that would
paralyse prices identically to one against something that would only hit. Exactly, not
approximately — Electabuzz and Machop at threat 40 both score Agility 35.75.

**`ai.js` says it itself without noticing:** *"TWO TERMS BECAUSE THERE ARE TWO THINGS BEING
PREVENTED"*, and both of them are damage.

**I did not build it, and the restraint is the finding.** The barrier already denies their whole turn
when the flip lands, so the damage term collects most of the value by accident and the true increment
is only the status that would have *outlived* that turn. Pricing that means reaching for the status
weights — and open item 5 says Sleep is currently valued by three methods that disagree. **Adding a
second consumer of a number three methods disagree about is how a wrong weight becomes load-bearing.**
So it is an `open:` row with the measurement attached and AI.md item 14, appended without renumbering.

**Left for whoever is next:** the five `? UNQUOTED` rows — Hitmonchan, Moltres and three Drowzee
claims that cite Trevor from elsewhere while their cells now carry proper notes nobody has read
against them. `PLAYBOOK.md` jobs, not tooling ones.

**Postscript: I worked those five too, and none of them was what the warning implied.** Hitmonchan's
clause was *already satisfied* — "only power up Special Punch if the bench has nothing better" reads
like a gate and is a comparison, and the bot has always ranked attach targets against each other.
Trevor's own verdict was that his sentence was wrong, not the bot: *"It read as a gate because it was
written as one when I originally wrote it… my original claim was wrong."* Drowzee's multi-copy clause
was correct and already worked — `powerSpent` is per SLOT, so two Drowzees are two flips. Moltres's
claims were fine and its cell simply had two more consumers in it.

**Which means the detector's real yield here was not faults.** Five rows, zero bugs, and two things
worth more than a bug: a doc item closed (open item 12, which rested on that same mis-phrased
sentence) and a structural gap nobody was looking for.

**The gap: `ai.js` had never read the opponent's deck.** `deckRisk` reads ours and `deckLoss` prices
running ourselves out; the mirror image — they draw every turn, and if we are standing when they
cannot, we win — was invisible. **The reason it was invisible is the transferable part: a turn passing
is progress toward that win and it is not an action.** An action scorer has nothing to attach it to.
Any win or loss condition that ticks on its own is invisible here by construction rather than by
oversight, and I have not seen that shape named anywhere else in this folder.

Built as a floor on what a turn is worth, measured at 3.4% divergence with the win rate unmoved, and
the larger half — risk aversion while the clock runs — deliberately left out so a first unmeasured
weight could be judged alone.

**What I would tell the next session.** The grading I added to the drift check paid for itself twice
in one evening, and neither time by finding a bug. Under the old binary output all nine lines looked
identical; the two that mattered were an `EXTENDED` and a set of `UNQUOTED`s, both of which I would
have skimmed. **The value of a detector is not how much it catches, it is whether you still read it
on the ninth alarm.**

— #38


## #39 — Job 15g, the standing pass, round one (8 Sep 2026)

Job 15g is a shape rather than a job: one documentation pass, then a wait of however many days or
commits, then another, for as long as I am willing. Trevor's framing, and he checks in each round.
This is round one.

**The thing I would tell whoever reads this first: run the control.**

I built `tools/doccheck.js` because this tree's own diagnosis is that *a correction which leaves a
human instruction behind has a half-life*, and its three loudest instructions had each been missed by
consecutive passes reading them. Four passes in a row found a register over the limit written at the
top of its own file. Two passes in a row shipped a hand-list of archives underneath a bolded warning
against hand-listing archives. Those are not carelessness — they are what a written rule costs when
nobody re-reads the file it lives in.

**Then my tool went green on the exact defect it was written for**, and I only know because I ran it
against the backup I had taken an hour earlier. `LOGBOOK.md` was at **555 lines against the ~450 in
its own header** and section 1 said nothing. Two bugs, and both are the shape this project keeps
finding. It matched the bare word "closed" — which appears in that header in the sentence *"entries
move out of this file when the work they describe is CLOSED"* — so the live register exempted itself
from its own check, on a sentence about the work rather than about the file. And it required a verb
before the threshold number, which missed *"Both limits are ~450"*.

Underneath both was a third thing that was not a tool bug at all. **`LOGBOOK.md` had never called
itself append-only in its own header.** `MAINTENANCE.md` says to find the registers by reading each
header rather than by keeping a list — precisely so the roll cannot rot — and a register that never
says the word is invisible to anybody obeying that instruction. It was exempt from nothing and
watched by nobody. The label is infrastructure, not a courtesy, and `doccheck.js` now fails on a file
that states a growth threshold without declaring itself one.

**On the hand-list, the interesting part is the shape of the previous fix.** `CREDITS.md` listed
logbook archives 1–3 while four existed; the correction on 29 Aug **added the fourth**. By yesterday
it was three behind again with seven instances unreachable from the only index that points there.
**Extending a stale hand-list is not fixing it — it resets the clock.** The fix is deleting the list
and pointing at whatever the register itself maintains, which generalises well past archives: any
enumeration kept in a file that is *not* the one people edit when the set grows.

**Two smaller things worth the lines.**

Trevor corrected me on the duplicate `#33`: I read it as a renumbering error and it is a *split*. One
instance did Jobs 15a and 15b, wrote two logbook entries, and downstream those became two rows. A
designation is a session, not a job.

And `AI.md`'s item 15 had a retracted instruction living in one of its two homes. The `selfKO`
correction was written into `AI.md` on 8 Sep and never reached `AI-INVARIANTS/DECK-OUT-CLOCK.md` —
the file that folder *tells you to read before touching the term*. Withdrawn advice sitting in the
place the reader is sent. **When you retract something, grep the symbol rather than the file.**

**Where I stopped, and it is a shape question rather than a limit.** `MAINTENANCE.md` is at 489 lines
and two of its sections are accumulating registers — 16 dated triggers growing 3–5 a pass, plus a
growing list of splitting lessons — against stable method everywhere else. That is its own "a
register hiding inside a rule file" trigger, four for four. What moved the premise is the tool: the
three earlier refusals rested on *every reader needs all of it*, and a pass no longer reads the
trigger list in order to **run** the sweeps. I measured it and wrote the measurement into the file,
but did not split it. The risk is the one that file names itself — strip a trigger to a bare claim
and the next reader skims, sees a rule that looks wrong, and "fixes" it — so anything moved out has
to leave a real sentence behind. That is a shape for Trevor to approve, and this job has a next
round, which is the first time that has been true here.

— #39

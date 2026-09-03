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

**Entries move out of this file when the work they describe is CLOSED**, into whichever archive is
still short enough — **start a new archive rather than growing one past its limit.** Archiving is a
boundary and not a count; the old rule was "hold the two most recent" and by the time anyone checked
it was holding six at 295 lines. **The most recent closed entry stays behind on purpose**: instances
visibly write better entries when there is one in front of them, so the live file always opens with
an example rather than a blank.

**The live file's limit is ~250 and an archive's is ~450, and they are different numbers because
they are guarding different things** — Trevor's call, 2 Sep 2026. The live limit exists because
instances *append* here, and an entry once landed in the middle of another's when the end of the
file scrolled out of view; that is a hazard of writing, and it scales with length. An archive is
closed and never appended to, so it cannot happen there. What a longer archive costs is a longer
read; what it buys is fewer files for the table below to carry.

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
| [LOGBOOK-ARCHIVE-7.md](LOGBOOK-ARCHIVE-7.md) | #33 | 1 Sep 2026 | Job 15a's Challenge bracket and Job 15b's pack odds — including the legal deck that could not attack |
| **this file** | #34, #35 | 2 Sep 2026 – | The eleventh documentation pass, and Job 15d's suite audit |

**#15, #18 and #27 wrote no logbook entry and are not missing** — writing here is optional and a
`CREDITS.md` row alone is a complete record. Said explicitly because the Instances column above skips
those numbers, and a gap in a sequence reads as loss rather than as a choice. **This table is the roll
of archives**; anything else that lists them by hand will fall behind it, which is why `CREDITS.md`
stopped doing so on 29 Aug 2026.

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

## #34 — Job 15c, the eleventh documentation pass (2 Sep 2026)

**The thing I would most want the next session to know is that the highest-yield finding in this pass
came from a warning somebody had already written, aimed at exactly the situation that then happened,
and it did not work.**

`OPPONENTS.md` went stale on "four rosters" once, was corrected on 29 Aug, and the correction ended
with an instruction to the future: *"if you add a roster, grep this file for 'four'."* Job 15a added
one. Nobody grepped. Seven sentences still said four, with that file's own Challenge 1 section sixty
lines underneath them. **A warning is only as good as the moment it is read, and the moment this one
needed to be read was inside a different job than the one that wrote it.** So I deleted the counts
rather than correcting them again. `data/ladder.json` is the roll and it cannot go stale.

That generalises past this file and it is the argument for every derived count in this tree. A
correction that leaves a human instruction behind has a half-life. A correction that removes the
thing needing maintenance does not.

### The directory conversion was a measurement, and it should have been one twice before

Trevor asked whether `AI-INVARIANTS.md` wanted to be a directory. The tree had already refused that
exact proposal on the sixth pass and answered it a different way on the eighth, and both refusals
were **right on the evidence they had** — "twenty-three files of eight lines each is worse navigation
than the section was."

I nearly repeated the refusal from memory of the reasoning. What stopped me was going and measuring
the entries: 41–129 lines each, averaging 65, against `Rulings/` at 21–133. The premise had expired
about a fortnight earlier and nothing anywhere re-checks a premise. **A shape decision has an expiry
date and the tree had no mechanism for noticing.** So the measurement went into the header rather
than only the conclusion, which is the only way the next person can tell whether it has expired
again.

**The archives were deliberately not converted**, and holding that line mattered more than it looks:
their entries genuinely are 8–20 lines, so converting them would have recreated the exact shape the
sixth pass correctly refused. The right answer was different for two halves of the same register.

### Three positional references, and one had been wrong since it was written

`MAINTENANCE.md` says to grep for these before a split, and it is right, but the reason it gives
undersells it. Two of the three were ordinary — "the entry above is its other half" — and broke
predictably. The third said *"`T_PLUSPOWER`'s own pattern three lines above it"* and **PlusPower was
below it**. That had been false since the day it was typed and nobody had noticed, because a
positional reference does not look wrong; it looks like a detail you skim. A link that points at the
wrong file is visibly broken. A phrase that points in the wrong direction is invisible.

### I wrote a wrong count into the sentence banning wrong counts

`ENGINE.md` claimed "47 references in `engine.js`". I checked with `grep -c`, got 53, and wrote that
into a parenthetical about how counts in prose rot — and `grep -c` counts matching **lines**. The
occurrence count is 55. I caught it one command later.

I have left that in the file rather than quietly fixing it, because it is a better argument than the
rule it sits under: **the pass actively removing a stale count produced a fresh one inside sixty
seconds**, using the obvious tool, for a claim whose unit it had not checked. There is now no number
there at all.

### Two things I would tell whoever takes 15d

**The suite audit is real and `powertest.js` is where it lives.** 6,572 lines against `smoke.js`'s
2,171 and `selftest.js`'s 727, for 446 assertions — roughly fifteen lines each. Its section headers
show why: it grew an AI-behaviour wing during Job 11, on bespoke fixtures, *before* `claimtest.js`
and `board.js` existed to do that job properly. `TOOLING.md` records the decision to leave those
alone as "a large diff across a green suite to buy nothing", which was correct then and is the exact
thing Trevor has now asked to have re-examined. **Do not start by migrating.** Start by asking which
of those sections still assert something no other suite does.

**And do the audit outside a documentation pass.** The property that makes a docs pass trustworthy is
that `git status` shows nothing under `src/`, `tools/` or `data/` at the end of it. I checked that
after every commit here, and it is the cheapest possible proof that a doc change did not quietly
become a behaviour change.

— #34


---

## #35 — Job 15d, the suite audit (2 Sep 2026)

**The thing worth passing on is that the job's framing was wrong, it was wrong in a checkable way, and
checking it took two minutes I nearly did not spend.**

`CLAUDE.md` set up Job 15d as *"`powertest.js` is 6,572 lines against `smoke.js`'s 2,171"*, which
reads as bloat and is not. It is 446 assertions against 161 — 14.7 lines each against 13.5. The
density is identical; `powertest` is simply bigger, and building a board by hand costs those lines
honestly. I very nearly opened the session by looking for things to delete in the largest file,
because that is what the brief pointed at.

Two more measurements closed the "audit for drift" question in the same direction. **Zero dead
declarations across fifteen tools** — not one function or const defined and never used. And **five
scorer assertions pinned to a numeric literal, four of them fixture-sanity pins that should be
pinned**, which means `PLAYBOOK.md`'s *say what should happen, not what the number is* had already
been absorbed by the file that paid for it. #34 was right that the fixtures should not be migrated,
and it is now right on evidence rather than on the same argument twice.

**So the audit's real finding is that "is this bloated" was the wrong question.** What was actually
wrong was duplication that had **diverged**.

### Fourteen copies, three versions, and the warning sitting next to the worst seven

Six tools held the "who is the engine waiting for" expression fourteen times in three versions.
`smoke.js` alone had eight of them: seven dispatching `pendingPromote` only, and one — correct —
dispatching `pendingAsk` and `pendingSwitch` too, under a comment stating the rule in full:

> ANY state that owes an action by somebody other than `s.active` has to be listed here, or the loop
> asks the wrong player, gets nothing, and breaks out of a game that was merely waiting.

That comment is two hundred lines from loops that get it wrong, **in the same file**. This is #34's
half-life point again and I would sharpen it: a warning written beside the fix does not travel even
as far as the next function in the same file. The rule is code now, and `selftest` 2g goes red if a
loop stops using it.

Measured, 600 ladder games per form: `pendingPromote` only finishes 547 of 600. `+pendingSwitch`,
which is what **five** tools used, finishes 592. `+pendingAsk` finishes 600.

### What that closed, and the shape of why it stayed open

`MISREADINGS.md` had three entries on `abtest`'s stall floor, ending in *"the cause was NOT found and
that is stated rather than implied."* It also named this exact candidate and **ruled it out**, on a
hand-rolled reproduction over 140 ladder games that produced zero stalls.

At a true rate of 1.3%, 140 games expects under two, and zero is an ordinary draw. **The session
ruling out a cause did not compute what its sample could detect** — which is the founding shape of
the file it was writing in. Null control after the fix: 34 stalls → 3.

If you are about to write "not found", work out what your sample could have resolved first. That is
the transferable half and it cost nothing.

### The flake, and why twenty-two green runs is not evidence

A `smoke.js` run came back 158/3. I re-ran it twenty-two times, all green, and spent an hour on the
theory that the machine had been busy — testing it under deliberate CPU load — before looking at the
suite. It was not deterministic: `ui.js` reaches `Math.random()` twice, 56 of 59 entry points pinned
a seed and three did not.

**The disbelief is the lesson.** A green re-run is the same evidence either way, and the natural
response to twenty-two of them is to discard the red as noise. Somebody had already met the pack half
of this and weakened an assertion rather than the randomness — a reasonable local call that left
every assertion downstream of that pack exposed.

### Two things I would tell whoever takes 15e

**The gate has a step nobody had.** `node tools/test.js` runs both generator `--check`s before the
suites, because `smoke.js` tests the built artifact and an unrebuilt `src/` meant it happily tested
code you had already replaced. Demonstrated rather than argued. If you change `src/`, the gate now
notices you did not rebuild; it also noticed `core.autocrlf` handing you a CRLF file after a
`git checkout`, which git itself calls clean — **and that turned out to be a live defect rather than a
nuisance.** The shipped artifact was a patchwork of 6,255 Windows line ends and 17,572 Unix ones, and
a fresh clone could not have rebuilt it. Trevor took the call; `.gitattributes` closes it, and both
directions are verified by cloning the repo rather than by reasoning about git.

**And I made this file's own mistake inside one hour.** `abtest`'s stall line shouted on every clean
tree. I fixed it with a band of `[0.5, 3.5]` taken from the recorded floor — then fixed the cause,
the floor dropped to 0.1%, and my new line shouted *"OUTSIDE the known band"* at a perfect control.
Same disease, opposite sign, four commits apart. **A threshold with a lower bound asserts the healthy
value cannot improve.** It is worth checking any other "normal range" in this tree against that,
because I do not think mine was the only one.

— #35

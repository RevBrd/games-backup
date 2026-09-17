# Shadowless — the planning record, continued

**Planning documents after their plans, and method text after it was rewritten** — the same species of text as
[HISTORY-ARCHIVE-2.md](HISTORY-ARCHIVE-2.md), and the reason is the same: a job-plan entry written
mid-job is correct in the present tense on the day and actively misleading once the thing ships. The
live file carries one line and a link; the plan as it read goes here, verbatim.

[HISTORY.md](HISTORY.md) is the parent and holds what is still **argued about**, and its table is the
roll of these archives.

**Started 16 Sep 2026 by Shadowless 39, in round two of Job 15g.** Archive 2 had been over its own
~450 since the day it was created, and its header named the next pass as the owner. Two weeks of
passes did not take it, and `tools/doccheck.js` could not see it either — the tool assumed every
archive was closed. Both are fixed: archive 2 is closed by this file existing, and the tool now
treats the newest archive in a series as the one still receiving.

**This file is append-only and closed.** Correct an entry; never shorten one. The 200-line target does
not apply. **The next planning record starts `HISTORY-ARCHIVE-4.md`** — this archive's ~450 limit
still stands, but it closed on the day it opened, at 431, rather than be left with nineteen lines of
room and the same unowned overrun archive 2 had. *The pass that fills a file to its limit closes it.*

## The job plan for Jobs 15c to 17a, as it stood on 16 Sep 2026

Moved verbatim out of `CLAUDE.md`, where it had reached 48 lines describing five finished jobs and
one half-finished one. Each became a table row there. **Job 17a is only half closed** — the quality
pass is done, the validation backlog is not — so its live line stayed in the plan and this is the
account as it read when its first half landed. Job 15g's bullet is here too, as it read before it was
shortened; that job does not close.

- **Job 15c** - Document pass, AI validation, grab bag. **Done 2 Sep 2026** — the eleventh
  documentation pass. Three registers archived and `AI-INVARIANTS` made a directory on a
  measurement rather than an instinct. [CREDITS.md](CREDITS.md) #34
- **Job 15d** - Test suite revamp. **Done 2 Sep 2026, and its premise did not survive the first
  hour.** The job was framed on `powertest.js` being 6,572 lines against `smoke.js`'s 2,171 — but
  that is 446 assertions against 161, which is 14.7 lines each against 13.5. The density is the same;
  `powertest` is simply bigger. Nor was it bloated: **zero dead declarations across fifteen tools**,
  and only five scorer assertions pinned to a literal, four of which are fixture-sanity pins that
  *should* be. #34's advice not to start by migrating the AI wing to `claimtest.js` was right, and
  for a reason worth keeping — that wing asserts `scoreAction`, `rawOutcomes` and `threatAgainst`,
  which `board.js`'s probes cannot reach.
  **What was actually wrong was duplication that had DIVERGED, and instruments with no control.**
  Fourteen copies of the owed-choice dispatch in three versions; a suite that was not deterministic;
  a gate that could pass against a stale build; two tools reporting a perfect number nobody could
  check. *[The gate, and `owed.js` →](TOOLING.md)* · *[which of `abtest` and `aiduel`, and the new
  controls →](MEASUREMENT.md)* · *[the four things that lied →](MISREADINGS.md)* · *[why the fixtures
  were left alone a second time →](HISTORY.md)*
- **Job 15e** - AI validation, grab bag. **Done 2–5 Sep 2026 over two sessions.** The GBC 2 seam and
  Potion timing, then the attack road — `potential().short` had pinned at zero the moment any attack
  was payable, making a bigger attack unreachable on **35 terminal cards** in every game ever played.
  [CREDITS.md](CREDITS.md) #36 and #37
- **Job 15f** - Integrating the live Google Drive index sheets into the current process, AI.md open
  items. **Done 7 Sep 2026.** `wants.js` reads Trevor's live sheet through a published CSV; the tool
  built to prevent a stale read had been making one for eleven days. [CREDITS.md](CREDITS.md) #38
- **Job 15g** - Persistent document pass. **Standing, and it does not close** — one pass, then a wait
  of however many days or commits, then another, for as long as the instance holding it is willing.
  Opened 8 Sep 2026 by #39. **What makes it different from 15c is that the cheap sweeps are now a
  tool** rather than an instruction somebody has to remember: `node tools/doccheck.js`.
  *[What it checks, and the three findings it was built out of →](MAINTENANCE.md)*
- **Job 16** - Card additions and logic for gym1. **Done 14 Sep 2026** — all 131 cards (Blaine's Quiz
  #1 omitted with Trevor, `gen_cards.js` says why), the Stadium zone, Recall's attack-source model, and
  Trevor's roster plus the four Gym Heroes theme decks. Every new AI weight is `PROVISIONAL` by the
  job's own scope. [CREDITS.md](CREDITS.md) #40 · [ROSTERS.md](ROSTERS.md)
- **Job 17a** - Post set-addition quality pass, AI validation backlog. **The quality half is done,
  15 Sep 2026; the validation backlog is open and is the bulk of it.** Four things had been
  invalidated by gym1 going live and none had been noticed, all four the same shape — **a deferral
  whose reason was a CONDITION rather than a decision stops being true without anybody editing it.**
  The Stadium zone had no UI at all, `benchCap()`'s guard against direct `cfg.benchMax` reads did not
  exist while its own comment said it did, two of the seven Gyms scored a flat zero to play, and
  `wants.js` hid all 122 gym1 notes behind a hand-written live-set list. AI.md item 5's arithmetic is
  closed at 0.666 with `tools/sleepcost.js`. **The validation half then opened with one note**,
  Misty's Poliwhirl, which cost an evening and bought two more scorer faults, a doc rule and a design
  question — the benched copy of a coin-scaling attack dropped its printed base, and a strip was
  worth a flat 11 whatever it took away. **Both were correct-by-accident until Gym Heroes**, which is
  the same lesson as the four above in a different register: *a weight that is right for every card
  that exists is not a correct weight, it is an untested one.* **121 gym1 notes still have no
  claim**, which is the largest single block of AI validation work in the project. [CREDITS.md](CREDITS.md) #41 ·
  [AI-INVARIANTS/STADIUM-PRICING.md](AI-INVARIANTS/STADIUM-PRICING.md) · [SCREENS.md](SCREENS.md)

## `MAINTENANCE.md`'s method sections, as they read before the split — 16 Sep 2026

Moved verbatim by #39 when `MAINTENANCE.md` split into method plus a register. Its trigger list and
its *What not to touch* section moved whole into [DOC-DRIFT.md](DOC-DRIFT.md), where they are
evidence. **These three were rewritten rather than moved**, so the text as it stood lives here: the
header, including round one's measurement proposing the split; the section introducing
`doccheck.js`; and the procedure, which still told a pass to copy the tree into `backups/` — the
convention retired the same day.

### The header

# Shadowless — maintaining the documentation

This tree is many files and it will drift. This is how to bring it back, written 10 Aug 2026 by the
instance that did the second split and extended by each one since, for whoever does the next.
(*Deliberately not counted. This sentence said "around twenty" while the tree held thirty-five, which
is the very first thing the triggers below tell you to look for.*)

It is about **the docs**, not the code. It generalises to any game whose docs outgrew one file, but
the examples are from here.

**This file runs over the 200-line target on purpose, and three passes have now decided not to split
it.** Its only reader is a session about to do a docs pass, who needs all of it — so the split test
below returns *no*, and every paragraph is a rule somebody paid for. **Don't spend a pass shortening
it; spend the pass on the tree.** Trim it only where a paragraph has genuinely become a duplicate.

**The fourth pass to ask has MEASURED it rather than re-argued it, and the answer has started to
move — 8 Sep 2026, Job 15g.** At 466 lines, two sections are accumulating registers and the rest is
stable method:

| | Lines | Shape |
|---|---|---|
| *When a pass is worth doing* | 107 | **16 dated triggers, +3–5 per pass** |
| *What not to touch* | 120 | exemption rules **plus a growing list of splitting lessons** |
| everything else | 239 | method: the tool, the rules, the procedure, house style |

**That is this file's own "a REGISTER hiding inside a rule file" trigger, which would make it four
for four**, and the tell is dated entries accumulating in a file whose subject is not chronological.
**What changed the premise is `doccheck.js`**: the three earlier refusals rested on *every reader
needs all of it*, and a pass no longer reads the trigger list in order to **run** the sweeps — the
tool runs them. The triggers become the *why*, read when a finding needs interpreting.

**Not split, deliberately, and this is a proposal rather than a deferral.** The risk is the one this
file names in *The one-line why, plus the link*: strip a trigger to a bare claim and the next reader
skims, sees a rule that looks wrong, and "fixes" it. Anything moved out has to leave a real sentence
behind, not a stub — which is a shape for Trevor to approve, not a tidy-up to slip into the pass that
grew the file. **The measurement is written here so the next reader can tell whether it has expired
again**, which is the rule two paragraphs down.

### Run the tool first — `node tools/doccheck.js`

**Added 8 Sep 2026 by Job 15g, and it is the first thing to do in a pass.** Every sweep below that
this file calls *"the cheapest finding available and the one nobody runs"* is now executed rather than
remembered: each live register against the threshold in **its own header**, the link check with the
anchor fix, trailing newlines, the quantifier grep, closed markers inside live files, a second roll of
somebody else's archives, duplicate designations in `CREDITS.md`, and table rows that silently end a
table. **FAIL means wrong; FLAG means go and look.**

**Why a tool and not another paragraph here.** This file's own diagnosis is that *a correction which
leaves a human instruction behind has a half-life* — and its three most-repeated instructions had each
been missed by consecutive passes reading them. Four passes in a row found a register over the limit
in its own header. Two passes in a row shipped a hand-list of archives under a warning against
hand-listing archives. **A rule nobody can forget to run is a different kind of object from a rule
written down well.**

**The tool was watched going red before it was trusted, and that is not ceremony.** Run it against the
backup taken at the start of your pass — `node tools/doccheck.js backups/pre-docs-cleanup-N` — which
holds the defects you are about to fix. The first version of it went green on a tree containing a
register **105 lines over its own limit**, because two of its own rules were wrong; only the control
said so. `claimtest.js` has this doctrine one folder over and the reason is identical: **a verifier
that has only ever been green proves nothing about itself.**

**What it cannot do, so nobody trusts it further than it goes.** It cannot tell you whether a sentence
is true — the quantifier and closed-marker sections print candidates and will always print some, and a
zero there means the grep broke. It is **deliberately not in `tools/test.js`**: a stale doc is not a
broken game, and a doc lint that can redden the build teaches everybody to read red as "you broke
something", which is the argument `TOOLING.md` already makes for keeping `claimtest.js` out.

### The procedure

1. **Back up first** — `backups/pre-docs-cleanup-N/` or equivalent. Cheap, and this pass rewrites
   whole files rather than editing them.

   **`backups/pre-docs-cleanup/` is not only a backup.** It holds `Packs Turn Log.txt`, an
   instance's own per-pass credits preserved verbatim by the first pass. Do not prune that folder
   as routine clutter, and **if you move it, move the pointer in [LOGBOOK.md](LOGBOOK.md) with it.**
   That log spent one pass unreachable — intact, indexed nowhere, cited by a sentence that had been
   deleted — which is worth remembering as the failure mode: preserved material dies by losing its
   pointer far more often than by being deleted.
2. Read everything, including the parent `Games/CLAUDE.md` and the global files it hangs off.
3. **Report before acting.** Trevor's pattern is to approve a shape, not a diff. Name the real
   defects you found — those are the most useful part and they are what justifies the pass.
4. Write new siblings first, then rewrite the files they were carved out of, then fix the pointers.
5. Verify:

```bash
grep -oh "](\([A-Za-z0-9_./#-]*\.md\)[^)]*)" *.md | sed 's/](\([^):#]*\).*/\1/' | sort -u | while read f; do [ -f "$f" ] || echo "MISSING: $f"; done
```

   **A correction that leaves a human instruction behind has a half-life; one that removes the thing
   needing maintenance does not.** `OPPONENTS.md` went stale on "four rosters", was fixed, and the fix
   ended *"if you add a roster, grep this file for 'four'."* The next job added one, nobody grepped,
   and seven sentences were wrong again with that file's own new section sixty lines below them.
   **The moment a warning needs to be read is usually inside a different job than the one that wrote
   it.** Where you can, delete the count and point at the data instead — `data/ladder.json` cannot go
   stale, and no instruction has to be obeyed for it to stay right.

   **Before any split, grep the file you are splitting for positional references** — "the entry
   above", "two above this one", "the last row", "below". A split silently re-points them at
   different material rather than breaking loudly, and the tenth pass nearly shipped one: the newest
   `AI-INVARIANTS.md` entry opened *"the 21 Aug entry two above this one"* while the 21 Aug entries
   were being moved into an archive. **Name the entry, never point at a position** — `MEASUREMENT.md`
   learned this from a growing table and it applies identically to a shrinking file.

   **And check every file ends with a newline.** `HISTORY.md`'s `greedy` rejection lost its closing
   clause — *"and `greedy` is one already built"* — because it was the last line of a file with no
   trailing newline and the next append landed on top of it. It sat as a sentence ending in a comma
   for a week, in an **append-only register**, and nobody noticed because a truncation reads as
   somebody's ellipsis where a deleted paragraph would have been obvious. Append-only protects
   against editing; it does not protect against a missing newline. The sweep is one line:

```bash
for f in *.md */*.md; do [ -n "$(tail -c 1 "$f")" ] && echo "NO TRAILING NEWLINE: $f"; done
```

   **Run it in `data/`, `Rulings/` and `Playbook/` too.** All three folders have their own markdown,
   and the fifth pass found a link in `data/` pointing one directory too high — a root-only sweep
   cannot see it. Every link out of a subfolder to a root doc needs the `../` prefix, which is the
   same trap one level over.

   **The `#` in those two character classes is not decoration, and it was missing until 26 Aug 2026.**
   A link carrying a section anchor — `](ROSTERS.md#team-rocket-…)` — was reported **MISSING** for a
   file that exists, because the old `sed` captured the anchor as part of the filename. That is the
   worst failure a verifier can have: a false positive on a *working* link. The next pass either
   "fixes" something that was never broken or learns to distrust the output, and the second costs more.
   **A checker that cries wolf is worse than no checker.** The fixed version was confirmed to still
   catch a genuinely broken link *and* a genuinely broken anchored one before being trusted — a
   verifier that has only ever been green proves nothing about itself, which is `claimtest.js`'s own
   doctrine one file over.

   Then `node tools/gen_cards.js --check`, `node tools/build.js --check`, and the six suites — a
   docs pass should not touch code, and that proves it didn't. If it did touch code (the fifth pass
   fixed one wrong string in `selftest.js`), say so in the commit and keep it to its own hunk.
6. **Commit in two parts:** the game's own files, then the catalog row in `Games/CLAUDE.md` as its
   own commit. The catalog is shared with parallel sessions; edit only your row, never rewrite the
   file, and check `git diff CLAUDE.md` shows one row before staging.

## `LOGBOOK.md`'s instruction header, as it read before 16 Sep 2026

Moved verbatim by #39 when the header was rewritten from about 125 lines to about 45, at Trevor's
suggestion. Every rule in it survived; what moved out was the account of how each rule was learned,
which now has its home in [DOC-DRIFT.md](DOC-DRIFT.md) and its whole original wording here. **Trevor's
own sentence about line limits was kept verbatim in the live file.** The roll table below reflects the
day it was moved, not today — the live `LOGBOOK.md` holds the current roll.

#### Shadowless — the logbook

What each instance did, in its own words. Split out of `CREDITS.md` on 11 Aug 2026, because the
narratives had grown to four times the attributions they were attached to and an attribution list
should be readable at a glance.

`CREDITS.md` is the short version: who worked on what, and when. This is why.

#### How to add an entry

**Append it at the END of this file, below the last entry.** Say what you did, what surprised you,
and what you would tell the next session — length is yours, and there is no house style to match
beyond the tree's. Sign your session number.

That first instruction is written down because it has already gone wrong: an entry once landed in
the *middle* of another instance's, because the surrounding text had been summarised out of view and
the end of the file was not where it looked. **If you cannot see the last entry, scroll to the actual
end before you write.**

**Writing here is completely optional.** A `CREDITS.md` row with no logbook entry is fine. A logbook
entry with no row is how somebody gets left off, so take the row either way. 

Do not worry about fitting your own entries or addendums under any line limits. Future sessions can organize and archive, you don't need to feel constrained as to what to write.

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

**THE LIMIT IS NOT ADDRESSED TO THE PERSON WRITING — Trevor, 15 Sep 2026**, and his sentence is a few
paragraphs up: *"Do not worry about fitting your own entries or addendums under any line limits."* He
wrote it after #41 shortened its own addendum to get back under ~450, which is the one fix this file
forbids everywhere else and which #41 talked itself into by calling the entry a draft.

**So the ~450 below is a trigger for ARCHIVING and nothing else.** It says an archive is due; it never
says an entry is too long. Those are different jobs and usually different sessions — the pass that
trips it is almost always the one that has just appended, and `tools/doccheck.js` now says so in the
message rather than leaving a reader to infer who it is for.

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

#### What is where

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
| [LOGBOOK-ARCHIVE-9.md](LOGBOOK-ARCHIVE-9.md) | #38 | 7 Sep 2026 | Job 15f — the live Google Sheet, and the drift check that GRADES a changed note rather than just flagging it |
| **this file** | #39, #40, #41 – | 8 Sep 2026 – | Job 15g's standing pass and `doccheck.js`, Job 16's Gym Heroes, and Job 17a's review of it |

**Archive 9 is small on purpose and that is the rule working.** It holds one entry, because archive 8
stood at 342 lines and #38's is 129 — growing it would have put it at 471 against the ~450 in its own
header. **Archiving is a boundary, not a count**, so a one-entry archive is the correct outcome and
not a sign somebody archived too early.

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

## Two `AI.md` Open items, as they read before being shortened — 16 Sep 2026

Moved verbatim by #39. **Item 5's arithmetic closed** (15 Sep, #41, `sleepcost.js`) while its weight
question stayed open, and **item 18 shipped its guard** while the guard's hand-maintained list stayed
a weakness. Both kept their numbers and a live claim; the accounts are below. Item 5's instrument and
output also live in `MEASUREMENT.md`, and item 18's rule in `Rulings/SUBSET-CHOICES.md` and
`ENGINE.md` — checked before shortening, not assumed.

5. **Sleep against Paralysis: two methods disagree and the weight was left alone.** Reading `endTurn`
   says a Sleep costs **0.67** of a turn — the wake flip runs on both Actives every turn end, so the
   series is 0.5 + 0.125 + …. Measuring 130 games says **1.20**, against Paralysis' exact 1.00. The
   current weights say 0.85. **Three answers, no two alike**, and the measurement rests on twenty
   applications, which is not a sample. Trevor raised it from play (*"even a sleeping opponent has a
   50/50 chance of waking up before missing a turn"*). **Do not retune `sleep` off either number.**
   What settles it is an instrument that counts turns lost per *application* rather than sampling the
   board — the crude one cannot separate a re-application from a persistence — run wide enough to
   carry an interval. *[The rest of that thread →](Playbook/ATTACK-CHOICE.md)*

   **MEASURED, 15 Sep 2026, #41 — the instrument this item asked for was three lines long, and the
   answer is 0.666.** 40,000 applications, each one a real `Engine` stepped through the real
   `betweenTurns` loop, counting turns lost per application exactly as written above:

   ```
   mean turns denied by ONE Asleep: 0.6659
     missed 0 turns: 50.07%   missed 1: 37.43%   missed 2: 9.35%   missed 3: 2.38%
   paralysis denies exactly 1.000 by construction.
   ```

   **So the reading was right and the sample was wrong, and the sample was wrong in the direction the
   item predicted.** 0.6659 against a closed form of 0.5/(1−0.25) = 2/3, agreeing to three decimals.
   The 1.20 is disposed of: it came from twenty applications sampled off the board, and this item had
   already said that instrument cannot separate a re-application from a persistence — it was counting
   one Good Night twice. **The prediction of the failure mode was written down before the measurement
   existed, which is the whole argument for writing predictions down.**

   **What the number does and does not settle.** It settles the RULE — one flip stands between a Good
   Night and their next turn, so the first missed attack is 50% and not 25%; two flips stand between
   their turn and the one after, so a second consecutive miss is 25% *given* the first. Scaled off
   `paralyze: 26` that implies a `sleep` of **17.3** against a shipped **22**, which is ~27% high.

   It does NOT settle the WEIGHT, and the instruction above still holds: **do not retune off this
   number either.** A denied turn is not worth the same at every point in a game, Sleep also blocks
   retreat where Paralysis does too, and no `abtest` has been run. What has changed is that the
   disagreement is now between two numbers instead of three, and the remaining gap is a question
   about value rather than a question about arithmetic. That is a much cheaper thing to settle.

   *(Trevor's own note on `gym1-59` Sabrina's Jynx was the thread that led here, and he had since
   withdrawn the sequencing argument in it himself. The record was already straight — `tools/claims/gym1.js`
   says so in its header and the code never moved either way.)*

18. **SILENT-FAILURE SURFACE #5 is guarded, and it is the nastiest of the five — 9 Sep 2026,
    Job 16.** A verb in the "as many as you want" family whose scorer forgets to fill `a.opts`.

    The engine resolves an unanswered subset choice to **zero**, on purpose — it never throws a
    player's cards away on their behalf. So the failure is invisible from every direction: the card
    is legal, it is offered, the bot plays it, and it does **nothing**. No exception, no refusal, no
    log line. Compare item 16, which fails *closed* — an unscored action type is merely absent.
    This one fails **open and silent**, which is the worse half of both.

    `selftest.js` now checks by source text that every subset verb's scorer contains a
    `return -Infinity`, watched going red naming the offending verb. **The list is hand-maintained**,
    which is the guard's own weakness and is written here rather than discovered later: a fifth
    subset verb added without touching that array is exactly the case it cannot see.

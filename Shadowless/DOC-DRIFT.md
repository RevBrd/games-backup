# Shadowless — every way this doc tree has drifted

**The register behind [MAINTENANCE.md](MAINTENANCE.md).** That file is the method — how to run a pass,
and every trigger as one rule with one line of why. This file is the full account of each trigger:
what it was, where it was found, and what it cost. **Read it when a finding needs interpreting**, or
when a rule in `MAINTENANCE.md` looks wrong and you are about to "fix" it.

**Split out of `MAINTENANCE.md` on 16 Sep 2026** by Shadowless 39, in round two of Job 15g, agreed
with Trevor. The two sections below it moved **verbatim, as blocks**, which is why they still say
*"this file"* where they mean `MAINTENANCE.md`, and why they refer to sections of it by the names they
had then. The measurement that justified the split, and the sections of `MAINTENANCE.md` that were
rewritten rather than moved, are in [HISTORY-ARCHIVE-3.md](HISTORY-ARCHIVE-3.md).

**Append-only, and exempt from the 200-line target.** Add an entry under *Entries since the split*
when a pass finds a new way the tree drifts, with what it cost — and add its rule to
`MAINTENANCE.md` as one line. Correct an entry that turns out wrong; never shorten one, because the
condensed version keeps the rule and loses the evidence that stops somebody undoing it. **When this
file passes ~450, start `DOC-DRIFT-ARCHIVE-1.md`** with the two verbatim blocks, which are the oldest
material and the least likely to be needed.

---

## When a pass is worth doing — as it stood in MAINTENANCE.md until 16 Sep 2026

Not always on a schedule. The triggers that actually mean something:

- **A big job just landed.** This is the big one. A job that ships in one session writes its
  documentation *while building*, which means the docs end up in the voice of someone who doesn't
  know the outcome yet. Job 5 left `PACKS.md` opening with "nothing here is committed" about a
  system that had shipped and been verified against 200,000 packs.
- **A planning document exists for something that now works.** Highest-value target in the tree,
  every time. A planning doc is a time bomb: it is *correct* when written and becomes actively
  misleading the moment the thing ships, because a future instance reads the header, sees
  speculation, and treats a load-bearing system as a blank slate.
- **The same fact appears in two files and they no longer agree.** The disagreement is the symptom;
  the duplication was the disease, and it was already there when they agreed.
- **A count, a version or a filename in prose can be checked by running something.** They rot
  silently. Nobody notices "48 tests" is now 96.
- **A doc describes a plan the implementation then improved on.** Added after the third pass, which
  found two: `RULINGS.md` telling a reader to move a working `ai.js` case onto an opt-out list, and
  `ENGINE.md` proposing a check that had shipped four commits later. This is the nastiest kind
  because the file is not vague or old — it is *specific, confident and actionable*, and acting on
  it makes the code worse. **Grep the doc's own symbols against the source.** If a file names
  `UNSCORED_ON_PURPOSE`, go and read what is actually in it.
- **A file got long enough that a working session stops reading all of it.** Added on the fifth pass,
  and it is the only trigger here that is about the *reader* rather than the text. Long context gets
  summarised, and a rule that has been summarised away is not in the file as far as that session is
  concerned — it will be confidently believed absent. Two attested cases: Job 7 lost time to
  `LAYOUT.md` sections that had been compacted out of view while the instance believed it had read
  the file, and an instance appended its logbook entry into the *middle* of another's because the end
  of the file was not where it looked. **This trigger can justify a split that topic purity cannot**,
  and it is why the seam below was finally taken. Watch for it above ~300 lines.
- **A QUANTIFIER over a set that has since grown — and this is the highest-yield trigger in the file,
  measured.** Added on the tenth pass, where **nine of eleven findings had this exact shape**. Not a
  count somebody got wrong: a sentence that was arithmetically correct on the day, about a set that
  then gained a member while nothing made anyone re-read it. *"`gen_cards.js` reads exactly four
  files"* sat one line above a nine-row table. *"The rest of the sixteen"* sat four paragraphs from a
  seventeen-item list, in a file that in the same breath called naming the seventeenth an open job.
  *"Every roster has been played by `decksim.js`"* was true of three of four, and the fourth had never
  been run at all.
  **A count reads as a fact somebody might check; a quantifier reads as a property, and nobody checks
  a property.** So the rule *don't put counts in prose* undersells it — **grep for "exactly", "all
  four", "the rest of the", "both", "every one of them" and "two of them also"**, and for each one go
  and count the thing. It is the cheapest sweep in this document and it has the best hit rate.
  **The generative fix is to name the MECHANISM instead of the members**: "everything in
  `OPPONENT_SOURCES`" cannot rot, "exactly four files" rots the next time somebody adds a roster.
- **An invariant stated in terms that stopped being true, while the invariant itself holds.**
  `.boardcol.wide` "must stay last in `style.css`" had not been last since Job 5, and nothing was
  broken, because the real rule was *after the CARD SYSTEM section*. A rule that reads as violated
  is worse than no rule: the next reader either "fixes" a non-bug or trusts the wording and breaks
  the real one. State invariants against the thing that matters, not against a position that
  happened to coincide with it.
- **A file NARRATES a state instead of naming where the state lives.** Added on the eighth pass,
  which found `PROGRESSION.md` telling the story of the same eight opponent decks being moved between
  brackets **four times**, with two of the tellings contradicting each other twelve lines apart. Each
  paragraph was correct on the day it was written; each was appended rather than replacing the last.
  **The tell is the past tense in a section that answers a present-tense question** — *"they moved
  down to Fossil"* where the reader asked *"where are they now?"*. The fix is a table checkable
  against the data plus the command that prints it, and it applies to any roster, count, or roll of
  who-holds-what. **The prose was wrong and the game was right the whole time**, which is the usual
  shape: nobody notices, because nothing breaks.

- **A CLOSED item sitting inside a LIVE one.** Added on the eleventh pass, which had already swept
  the tree for struck-out Open items and still missed two — because they were sub-paragraphs three
  levels down inside items that are genuinely open. **A struck-out heading is easy to spot; a
  finished paragraph under a live heading is not.** `AI.md`'s Open list was 176 lines of 448 that
  way, and a list nobody can scan stops being read. Grep for `~~`, `RESOLVED`, `BUILT`, `DONE`,
  `ANSWERED` and `MEASURED` **inside** items, not only at their heads.
- **A REGISTER hiding inside a rule file, which is now three for three.** `AI-INVARIANTS` came out of
  `AI.md`, `ROSTERS` out of `OPPONENTS.md`, and on the eleventh pass the `Playbook/` pattern files
  turned out to be a rule plus a chronological log of every session that touched them — 449 and 493
  lines, against 82 for a built pattern nobody had revisited. **The tell is dated `##` headings
  accumulating in a file whose subject is not chronological.** The fix each time was the same: split
  the log out, leave the rule, and state the threshold before anyone needs it.
- **A SHAPE decision has an expiry date, and nothing in this tree re-checks one.** The sixth pass
  refused `AI.md` a directory on the grounds that "twenty-three files of eight lines each is worse
  navigation than the section was", and it was right. By the eleventh pass its entries averaged 65
  lines and the register became a directory. **Neither pass was wrong; the premise moved.** So when
  you re-open a shape question, **go and measure the thing the old argument was about** rather than
  re-reading the argument — and write the measurement into the file, not just the conclusion, so the
  next reader can tell whether it has expired again.

- **A "fix" that EXTENDS a stale hand-list instead of deleting it — 8 Sep 2026, and it is a
  correction shape rather than a content one.** `CREDITS.md` hand-listed logbook archives 1–3 while
  four existed; the fix on 29 Aug added the fourth. By 8 Sep it was three behind again, with seven
  instances unreachable from the only index pointing at them — sitting directly under a paragraph
  reading *"**Do not hand-list the archives**"*, which the same pass had written. **A list that went
  stale once will go stale again; extending it resets the clock and changes nothing.** The fix is to
  delete the list and point at whatever the register itself maintains. Generalises past archives:
  **any enumeration maintained in a file that is not the one people edit when the set grows.**
- **A register that never says "append-only" in its own header is invisible to the instruction above
  it — 8 Sep 2026.** This file says to find the registers by *reading each header*, precisely so
  nobody keeps a list that rots. `LOGBOOK.md` had never carried the label; it was therefore exempt
  from nothing, watched by nobody, and reached **555 against the ~450 in its own header**. The label
  is load-bearing infrastructure and not a courtesy. **When you find a register, check that it says
  what it is** — `doccheck.js` now fails on a file that states a growth threshold without declaring
  itself one, which is exactly the pair those two facts make.
- **A correction that reaches one twin and not the other.** The retraction of `AI.md` item 15's
  `selfKO` instruction was written on 8 Sep and did not reach `AI-INVARIANTS/DECK-OUT-CLOCK.md`, so an
  instance following the pointer — which that folder *tells you to do before touching the term* —
  would have read the withdrawn advice as current. This is the "duplicated elsewhere" trigger below,
  arriving from the correction side rather than the drift side. **When you retract something, grep the
  symbol, not the file.**
- **A DESIGNATION can be split, and it reads as two instances — 8 Sep 2026.** #33 did Jobs 15a and
  15b and wrote two logbook entries, "#33" and "#33 again"; downstream those became two `CREDITS.md`
  rows both signed #33. **A designation is a session, not a job.** One row per instance, however many
  jobs it did — a collision makes the credit unattributable, which is the one thing that table exists
  to prevent.

## What not to touch — as it stood in MAINTENANCE.md until 16 Sep 2026

**Do not restructure a file because you would have organised it differently.** The global
`updating.md` is explicit about it and it is right: form divergence across instances produces a
document nobody recognises. `LAYOUT.md` came through this pass at exactly its original length
because it was already the right shape, and shortening it would have meant deleting specifics.

**The target is 200 TOTAL lines — `wc -l`, blanks included.** Trevor settled the unit on 11 Aug 2026
after the fourth pass found the tree had been measured two ways: the third pass reported `LAYOUT.md`
"ends at 283" for a file `wc -l` calls 357, because it had counted non-blank lines. Nobody noticed,
and the file everyone was protecting as slightly over was 78% over.

**Then the sixth pass did it again with this warning in front of it**, measuring the tree with
PowerShell's `(Get-Content f | Measure-Object -Line).Lines` — which **silently does not count blank
lines**, so every figure in its opening report to Trevor was ~25% low. Knowing the unit does not help
if the command you reach for quietly uses a different one. **Run `wc -l` — the literal command — and
nothing that looks equivalent.** Git Bash is on this machine and the Bash tool takes it.

Being over beats cutting the paragraph that stops the next session losing a morning. If you go over,
say why in the commit.

**Two more from the seventh pass, both about claims rather than about length.**

**A "this is duplicated elsewhere" claim is a claim about TWO files, and it has to be re-checked
whenever either one moves.** `AI.md` opened with "the accounts are in `GRABHIST.md`" — true when
written, and the sixth pass used it as the grounds for refusing that file a directory. But
`GRABHIST.md` only ever records **grab bag** items, so the moment a *set job* touched `ai.js` the
parent started accumulating entries with no twin, while still promising every account was duplicated.
A pass acting on the blanket version would have condensed the only copy of three things. **Before you
trim on the grounds that something is preserved elsewhere, go and look at the elsewhere.**

**Put a file's own limit where it will be read BEFORE the decision, not after.**
`LOGBOOK-ARCHIVE-2.md` ends its header with *"Start archive 3 rather than growing this one past
~250."* It was at exactly 253. The seventh pass appended 150 lines to it anyway and had to undo them
— not for missing the sentence, but for reaching it after having already decided where the entries
were going. The live `LOGBOOK.md` now carries the rule at the point of decision as well, which is the
general fix: **a constraint stated only in the thing being constrained is read too late.**

- **Exempt: every append-only register and every archive of one.** **Do not maintain a list of them —
  read each file's header**, because it is the roll that rots and the label that does not. None can
  be shortened without deleting something: a session's account of its own work, a ruling somebody
  then has to make again, a rejection's *why*, an invariant's reason, or the gap between what a
  playtest report said and what was actually found. Correct entries in them; never condense them.
  **Any file of this shape must say so in its own header**, as all of them do — `GRABHIST.md` spent
  two days without the label, which is how one gets tidied by mistake.

  **A register needs its own split threshold, stated at the TOP of the live file and not only in the
  archive**, and every one here carries *"when this passes ~450, start the next archive"*. **Check
  every register's own number at the start of a pass**; it is one `wc -l` and it is the cheapest
  finding available. **It is also the one nobody runs.** Three passes in a row have now found a
  register past the limit written in its own header — `GRABHIST.md` at 649 and `HISTORY.md` at 461 on
  22 Aug 2026, `AI-INVARIANTS.md` at 471 on 26 Aug, the last of those set by the pass that had just
  written the warning above it. A limit is obeyed only if it is read before the growth, and nobody
  re-opens a header they have already scrolled past. **Assume one is over and go and look.**

  **The exemption moved off `RULINGS.md` itself on 15 Aug 2026** and this is the shape to copy when a
  register outgrows one file. It split into a directory page plus one file per ruling in `Rulings/`,
  which means **the parent is no longer exempt** — it is method and an index, it will be revised, and
  it should stay short. The register is the folder. Stating the exemption against `RULINGS.md` after
  that split would have been the "invariant stated in terms that stopped being true" trigger above,
  aimed at the very file that warns about it.
- **What has been learned about splitting, each item paid for by a file in this tree.** The
  narratives are in [HISTORY.md](HISTORY.md); these are the parts you act on. **Deliberately not
  counted** — this line said *three lessons* above four bullets for a week, in the file that bans
  counts in prose.

  **The first question is whether to split at all.** A file nobody but its own specialist reads does
  not want splitting however long it gets, and this file is the example: every route into it is a
  session about to do a docs pass, who needs all of it. Length is a reason to look, not a verdict.
  - **When a split feels right but the topic argument keeps failing, the criterion is probably wrong,
    not the instinct.** `LAYOUT.md` survived two proposals on *sizing vs. interaction*, both
    correctly withdrawn, and was split on the third by Trevor using the split test above instead.
  - **When most inbound links to a file aim at one section, that section is a file.** That is what
    made `MEASUREMENT.md` obvious once someone looked: three of `AI.md`'s callers wanted the
    instruments and none of them wanted scoring weights on the way. **Check inbound links after any
    split** — a stale one lands the reader in the half you just moved away from.
  - **A section with a register twin does not want a directory; it wants deleting down to its rule.**
    `AI.md` was proposed as a second `Rulings/` on the sixth pass and refused, because every one of
    its seven narratives already had a fuller, append-only account in `GRABHIST.md`. A folder would
    have been a third copy. `RULINGS.md` earned its folder because its entries were the *only* copy.
    **Ask what else already holds this before you build it a home.**
  - **But that refusal was about a DIRECTORY, and a register is not always a directory.** The eighth
    pass split the same section out as one append-only sibling, `AI-INVARIANTS.md`, and the reasoning
    is the shape to reuse rather than the answer. Three things had changed: the twin was no longer
    one file but three (`GRABHIST.md`, its archive, and `Playbook/`), several entries had no twin at
    all, and the section had reached twenty-three entries growing by three or four per AI pass. **A
    directory would still have been wrong** — twenty-three files of eight lines each is worse
    navigation than the section was. **One sibling with an index in the parent is the middle option**,
    and it is what `LOGBOOK.md` has always been. So: *how many entries, how long is each, and how many
    copies already exist* — three questions, three different right answers.
  - **A FOURTH question, found when the same proposal was made about `AI.md`'s Open list — 7 Sep
    2026: is the list cited by NUMBER from outside?** That one was proposed as a directory on the
    grounds that the file was long. Measured, it is the refused case almost exactly — thirteen items,
    median ten lines, five of them eight or fewer — so the three questions above already said no. But
    it also carries something the register never did: `CLAUDE.md`, `GRABBAG.md` and four invariant
    files cite it as *"AI.md open item 9(b)"*, and the list's own text warns that renumbering
    silently repoints every one of them. **A structure that invites renaming is a structure that
    invites repointing.** Prefer deleting down to the rule; it took ~23 lines of already-told
    narrative out of three items and touched no number.
  - **And the compaction bought six net lines, which is the honest figure and worth recording.** The
    first draft spent fourteen lines *at the top of the list* explaining why it was not a directory —
    an explanation about where things live, filed in the thing it was about, which is how this file
    ends up being the last place anyone looks. It belongs here. **When a pass produces a rule about
    organisation, the rule goes in `MAINTENANCE.md` and a one-line marker goes where the work
    happened** — otherwise the saving is spent on the note describing the saving.
  - **When one file holds a spec's SHIPPED half and its UNBUILT half, split by state, not by topic.**
    The ninth pass took `CHALLENGES.md` out of `OPPONENTS.md` on that criterion and it is a genuinely
    new one here — every earlier split in this tree was by subject. The argument is the planning-doc
    trigger at the top of this file, applied at file scale rather than at section scale: four live
    rosters were being described in the same voice as three unbuilt mechanisms, so a reader could not
    tell by tone which half they were standing in, and the unbuilt half is the half that reads as
    *specific, confident and actionable*. **The test is whether the shipped half can be rewritten in
    the past tense on its own.** If it can, the two halves were never one document.
- **`CLAUDE.md` has an honest floor and it is not 200.** What it holds is the index, the status, the
  tree, the commands, the standing decisions and the handful of facts that have each cost a session an
  hour. **Getting under 200 means deleting orientation, which is the one thing this file is for.**
  Four passes have now cut it and every one of them was reversed by the next two jobs, because each
  job adds a sibling to the index and a line to the plan. **Expect the creep and treat it as correct**;
  what to check is that the growth is index and status rather than depth that belongs in a sibling.

---

## Entries since the split

### A deferral whose reason was a CONDITION rather than a decision — 15 Sep 2026, #41

**Found by Job 17a, and told in full in #41's own logbook entry** under *"The shape: a deferral whose
reason was a CONDITION, not a DECISION"* — that account is the only copy and this entry does not
restate it. Four things had been invalidated by Gym Heroes going live and none had been noticed:
the Stadium zone had no UI, a guard existed only in its own comment, two Gyms scored a flat zero, and
`wants.js` hid every gym1 note behind a hand-written live-set list. Each had been deferred for a
reason of the form *"not until X"*, and X then happened without anybody re-reading the sentence.
**A decision stays true until somebody changes it; a condition stops being true on its own**, which
is why it belongs beside the quantifier trigger — both are statements that were correct on the day
and are falsified by the world moving rather than by an edit.

### A deferral with a named owner that nobody took — 16 Sep 2026, #39

`HISTORY-ARCHIVE-2.md` was created over its own ~450 on 2 Sep and its header said so, then named the
owner: *"**The next pass owns it**."* `MAINTENANCE.md` said at the time that a deferral with a named
owner is a decision and one without is a limit quietly becoming advisory. Then two weeks and several
passes went by — including round one of Job 15g, the standing documentation pass — and nobody took
it.

**The reason nobody took it is the transferable part: nothing could surface it.** `doccheck.js`
assumed every `-ARCHIVE-N` file was closed and never measured one, so the one instrument built to
catch a register over its own limit was blind to exactly this register. A named owner is a decision
only while something will put the name back in front of somebody. Fixed from both ends: archive 2 is
closed by `HISTORY-ARCHIVE-3.md` existing, and the tool treats the newest archive in a series as the
one still receiving.

**And the obvious fix for the tool would have been wrong.** Reading "closed" off each archive's header
was the first idea. Measured: **eight of twenty-one archives carry the word and thirteen do not**, with
no pattern — the older ones predate the label. A rule built on that label would have been exactly as
unreliable as the label. The structural rule — *the newest archive in a series receives; each earlier
one is closed by the existence of the next* — needs nobody to write anything, which is the same lesson
as the hand-list: prefer the rule that cannot be forgotten over the one that has to be written down.

### A positional count is a hand-list wearing a different hat — 15–16 Sep 2026

`CLAUDE.md`'s paragraph under its command block said *"the last two"* are not pass/fail, was corrected
to *"the last six"*, and stopped being true a second time on 15 Sep when `sleepcost.js` was added. The
fix that day replaced the count with a boundary, *"below the gate"*. **That boundary was wrong on the
day it was written**: every pass/fail suite also sits below `node tools/test.js` in that block, so the
sentence declared `selftest`, `smoke` and the rest not pass/fail. Nobody noticed, because a boundary
reads as a property.

The 16 Sep fix put the boundary **inside the thing it describes** — a divider comment line in the code
block itself, `MEASUREMENTS, not pass/fail` — so a new instrument added under it inherits the claim
and one added elsewhere does not, with no sentence to update. The paragraph as it read, verbatim:

> Run `--control` first where there is one — skipping it has already produced one confident wrong
> answer.
> **Named rather than counted from the end of the list**, because that sentence said "the last two",
> was corrected to "the last six", and stopped being true a second time on 15 Sep 2026 when
> `sleepcost.js` was added. **A positional count is a hand-list wearing a different hat** — it goes
> stale on exactly the same event, somebody adding one. It is a boundary now ("below the gate") rather
> than a number. See [MEASUREMENT.md](MEASUREMENT.md).

### The quantifier trigger, five more times in one file — 16 Sep 2026, #39

Round two of Job 15g checked `CLAUDE.md`'s facts against the code before trimming it, and found the
highest-yield trigger in this register five times over, every one a statement correct on its day:

- Status said *"there are now **five brackets over four sets**"* four lines above *"**six** of them,
  over those five sets"* — inside a paragraph whose own parenthetical apologised for the same
  contradiction having happened on 2 Sep.
- *"**The other ten sets** are unblocked"* — ten stopped being true when Team Rocket went live, and
  again with Gym Heroes.
- The `CREDITS.md` index row said the logbook had *"its three archives"*. There were nine.
- The Open index named three example AI gaps. By 16 Sep two had been built — evolution readiness on
  28 Aug, and the Sleep arithmetic closed at 0.666 in Job 17a.
- The promo paragraph quoted a reachable count and then explained that the count had gone stale in two
  files twice. It was right that day; the explanation was the warning about itself.

**Every one was fixed by deleting the number, not correcting it**, and pointing at the command or the
file that knows. The two passages removed, verbatim:

> **Five sets are live and complete: Base, Jungle, Fossil, Team Rocket and Gym Heroes — 442 of 442
> printings** (Gym Heroes went live 14 Sep 2026, Job 16), and **every bracket on the ladder** — six of
> them, over those five sets — is built from Trevor's own hand-made decks or authentic theme decks rather
> than from placeholders. *(This said "all four
> brackets" three lines above its own "five brackets over four sets" until 2 Sep 2026. Sets and
> brackets stopped being the same count on 1 Sep and one sentence did not hear.)* Run `node tools/selftest.js` for the live figures rather than trusting a number in
> prose; it prints coverage per set. **There is one unit now and there used to be two**, so an older
> figure — Base Set as 95, the three sets as 221 — is measuring the smaller one rather than disagreeing
> with this one. `selftest.js` counts printings; it used to exclude Energy, which was a hole in the
> set-gating rule that Team Rocket's three special Energy would have been the first to fall through.

> and 23 of the 28 are reachable today — `node -e` the
> gate table rather than trusting that number, because **Job 15a moved it and two files did not notice,
> and then Job 16 moved it again and the same two files did not notice a second time.** The instruction
> was already here and was already right; nobody ran it. A promo is

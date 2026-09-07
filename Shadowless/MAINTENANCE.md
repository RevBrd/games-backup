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

## When a pass is worth doing

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

## The rules that did the work

**One fact, one home, pointers at the other end.** This is the whole method. Everything else is
detail. Duplication is not redundancy — it is two copies that will diverge, and the version a reader
happens to hit first wins.

**Deciding the home: ask whose *subject* it is, not what it relates to.** The smoke stub's blindness
to layout bugs relates to layout, and belongs to tooling, because the actual claim is "here is what
this test suite cannot see." Getting this wrong produces a file that is a grab-bag of loosely
associated facts, which is how you end up back here.

**The split test: would a session working on something *else* need this?** If a session touching the
board never needs the variant storage model, that model is not orientation, however important it is.
That single question produced `COLLECTION.md`, and then `INTERACTION.md` and `MEASUREMENT.md`.

**A new file does not automatically earn a row in `CLAUDE.md`'s index. The test is: is its parent
guaranteed to be read first?** If every route to a file passes through a sentence naming its parent,
name it *in the parent's row* instead — findable from the index at no cost in lines. Trevor's call,
15 Aug 2026, and it is what keeps the index from growing once per split forever. **Check the entrance
count before applying it**, because the answer is not always the obvious one: `PLAYTEST.md` looks
like a child of `GRABBAG.md` and kept its own row, because two of its three entrances (a match log,
or Trevor saying something felt off) never touch the grab bag at all. **Naming the child in the
parent's row is not optional** — a row that describes only the parent tells a reader their subject is
undocumented, and they will edit blind rather than open a file the index never mentioned.

**Read every file completely before changing any of them.** You cannot dedupe what you have not
read, and the duplicates are never in the place you'd guess. This costs an hour and there is no
shortcut; a pass that skips it will move text around and fix nothing.

**Verify facts by running the thing.** Every number I checked was wrong somewhere. Run the suites,
run the generators with `--check`, grep the source for the symbol the doc names. A confident wrong
number is worse than an absent one because nobody re-checks it.

## What must survive a pass

The failure mode is not losing text. It is losing the **reason** something is the way it is, which
turns a settled question back into an open one.

- **Rejections keep their why.** `~/.claude/reference/updating.md` says this and it is the most
  important line in the global tree. "We decided against X" hands X back as a fresh idea next month.
  "We decided against X because it changed the default look of the whole game to serve a variant
  almost nobody sees" does not. That is what `HISTORY.md` is for.
- **Anything that cost a session an hour**, stated with what it cost. The auto-margin trap in
  `LAYOUT.md`, `state.winner === 0`, the NUL byte. These read as trivia until they happen to you.
- **Trevor's own material.** The theme decks, his design calls, the reasoning he supplied. Where a
  decision was his, say so — but **say so because the reasoning is worth attributing, not because it
  seals the question.** This bullet used to end "it changes how much authority a future instance has
  to overturn it," and Trevor corrected that on 15 Aug 2026: *settled with Trevor* marks a thing
  **discussed and agreed**, not a directive, and he has never claimed a design call is final. The
  sealed reading is worse in both directions — it stops a later instance bringing real evidence, and
  it makes his actual corrections look like reversals rather than the ordinary thing they are. The
  full statement is in [RULINGS.md](RULINGS.md), where the marker is defined.
- **Anything a screenshot or a test run cannot re-derive.** Measured card heights, the reason a
  media query was replaced by measurement, why the coin lands on the centre line.
- **Credits** and anything the original instance intended to persist, especially anything that reads
  as a documentation of their accomplishments. It can be moved to a reference file for organization
  but it cannot be lost. — *Trevor, 11 Aug 2026.* The third pass acted on this by splitting
  [LOGBOOK.md](LOGBOOK.md) out of `CREDITS.md` and moving the narratives across **verbatim, as a
  block**, rather than deciding sentence by sentence what earned its place. That is the safer shape
  when the instruction is "preserve": move the whole document into the archive and write the short
  version fresh, so the judgement call is about what to *summarise* and never about what to *drop*.
  The logbook is append-only and exempt from the line target; say so in any file like it.

  **`CREDITS.md`'s two-or-three-line rule needs re-imposing about once a week, and the rule plus its
  method now live in that file's own header.** Apply it row by row: **trimming is safe only where
  that instance has a logbook entry**; where none exists the row's text moves to the logbook
  **verbatim first**, and only then is the short version written. Never decide sentence by sentence
  what earned its place. **The violations are always the recent rows** — everything up to #18 has sat
  inside the limit since the day it was set, because the detail only feels indispensable to the
  instance that just did the work. On 26 Aug 2026 six rows needed the verbatim move and eight needed
  trimming; the longest was twenty-four lines.

## What is safe to cut

- **The narrative of how a settled decision was reached**, once it is settled. The v1/v2/v3 history
  of the rarity table is interesting and is not needed to change a number. Move it, don't delete it.
- **Planning-voice framing after the thing ships.** "Open question", "not yet built", "we should
  decide" — check each one, because some are still true and those are the most valuable lines in
  the file.
- **Counts and rosters that duplicate a command's output.** Say where to run it instead.
- **Restating a sibling doc's content "for convenience."** That is the duplication, arriving
  politely.

## What not to touch

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

## The procedure

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

## House style

The house style is your own natural voice. Worth matching, because the tree reads as one voice and that is load-bearing for trust:

- **Second person, present tense, direct.** "Read this before you change anything sized."
- **Lead with the claim, then the reason.** Bold the claim. A skimmer should be able to read only
  the bold and come away with the rules.
- **Say what it cost.** "This cost a session an hour" is the single most effective sentence in this
  tree at making someone actually read the next line.
- **Tables for parallel facts, prose for reasoning.** Don't put an argument in a table cell. **And
  never leave a blank line between rows** — it ends the table, and the rows below it render as stray
  one-cell fragments with no header. It has happened twice: a `PACKS.md` row in the third pass, and
  three `CREDITS.md` rows that spent two days that way. It looks fine in the source and only wrong
  when rendered, which is why it survives.
- **Every file opens by saying who should read it and when**, and points back at `CLAUDE.md`. That
  header is what makes the tree navigable rather than a pile.
- **Never cite a line number.** `COLLECTION.md` pointed at `engine.js:114` for a function that had
  moved to 126, and `LAYOUT.md` at `ui.js:389` for a comment at 459. Both rotted silently within a
  job. Cite the **symbol** and let the reader grep — that reference cannot go stale, and it survives
  the edit that moves the code.

### The one-line why, plus the link

**Trevor's shape, agreed 12 Aug 2026: leave the finding in the live file, move the account to the
register, and link between them.** Adopted, with one boundary, because the tree contains the evidence
for both halves.

The boundary is that **the why is usually what makes the rule get obeyed.** `LAYOUT.md`'s own header
warns that several of its rules look wrong until you know what they protect. Strip those to bare
claims and the next reader skims, sees a rule that looks wrong, does not click, and "fixes" it. The
click is cheap for a human, who can hover and bail; it is expensive for an instance, which has to
decide whether to open the file *before* knowing what is in it. And every link is a new thing that
can rot — `LOGBOOK.md` exists because the Packs Turn Log died of a deleted pointer while the file
itself sat untouched.

So the pattern is neither the full account nor a bare claim. **One line of why, then the link:**

> **Anywhere the coin might move to has to clear the ticker.** You read the log underneath the coin
> while it spins. *[Both arguments, and why this one won →](HISTORY.md)*

The test for what stays: **would someone about to break this rule be stopped by this sentence?** If
yes, inline. If it is how-we-got-here — alternatives weighed, who proposed what, the two versions
that failed first — it links out.

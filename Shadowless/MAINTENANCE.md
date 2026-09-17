# Shadowless — maintaining the documentation

This tree is many files and it will drift. This is how to bring it back — written 10 Aug 2026 by the
instance that did the second split, extended by each one since, for whoever does the next.

It is about **the docs**, not the code. It generalises to any game whose docs outgrew one file, but
the examples are from here.

**This file is the METHOD. [DOC-DRIFT.md](DOC-DRIFT.md) is the register** — every way this tree has
drifted, told in full by the pass that paid to find it. Split on 16 Sep 2026 in Job 15g, agreed with
Trevor, after three passes had refused: the file had reached 489 lines, half of it dated findings
growing by three to five a pass, and `doccheck.js` had removed the refusals' premise — a pass no longer
reads the triggers in order to *run* the sweeps. **Every trigger below kept its rule and one line of
why**, because a bare claim is exactly what a skimming reader "fixes". **A new finding goes into
`DOC-DRIFT.md` in full and into this file as one line.**
*[This file's sections as they read before the split →](HISTORY-ARCHIVE-3.md)*

## Starting a pass

1. **Note the commit you are starting from, on a clean tree** — `git rev-parse --short HEAD`. That
   commit is your backup and your control. **There is no `backups/` step any more**: retired 16 Sep
   2026, because git history and the pushed `backup` remote already hold every committed state, and a
   copied tree inside the repo was a third copy that only ever grew. **Commit or stash anything in
   flight first** — git protects committed work, not a working tree.
2. **`node tools/doccheck.js`.** Every sweep this file used to ask you to remember: each live register
   against the threshold in its own header, links (anchors and subfolders included), trailing
   newlines, the quantifier grep, closed markers in live files, a roll of somebody else's archives,
   duplicate designations, tables that silently end. **FAIL is wrong; FLAG is "go and look".** It is
   deliberately not in `tools/test.js` — a stale doc is not a broken game.
3. **`node tools/doccheck.js --at <that commit>` before you trust it, and again after you change it.**
   A verifier that has only ever been green proves nothing about itself: the first version went green
   on a register 105 lines over its own limit, and the second never looked at an archive 32 over. It
   cannot tell you whether a sentence is true, and zero quantifier hits means the grep broke.
4. **Read everything you will change**, including `Games/CLAUDE.md` above this folder.
5. **Report before acting.** Trevor approves a shape, not a diff. The real defects are the most useful
   part of the report and what justifies the pass.

## When a pass is worth doing, and what to look for

Each line is a rule and the reason it exists. **The full account of each, with what it cost, is in
[DOC-DRIFT.md](DOC-DRIFT.md)** under the same bold words — read it when a finding needs interpreting.

- **A big job just landed.** Docs written while building are in the voice of someone who does not
  know the outcome yet.
- **A planning document exists for something that now works.** The highest-value target, every time:
  a reader sees speculation and treats a load-bearing system as a blank slate.
- **The same fact appears in two files and they no longer agree.** The disagreement is the symptom;
  the duplication was the disease, and it was there while they still agreed.
- **A count, a version or a filename in prose can be checked by running something.** So run it.
- **A doc describes a plan the implementation then improved on.** The nastiest kind: specific,
  confident, actionable, and following it makes the code worse. Grep the doc's own symbols against
  the source.
- **A file got long enough that a working session stops reading all of it.** Watch above ~300 — a rule
  summarised out of view is believed absent.
- **A QUANTIFIER over a set that has since grown** — the highest-yield trigger here, measured. Name the
  mechanism, not the members: "everything in `OPPONENT_SOURCES`" cannot rot. **A positional count —
  "the last six" — is the same bug in a different hat.**
- **An invariant stated in terms that stopped being true, while the invariant itself holds.** State it
  against the thing that matters, not a position that happened to coincide with it.
- **A file NARRATES a state instead of naming where the state lives.** The tell is past tense answering
  a present-tense question; the fix is a table checkable against the data, and the command.
- **A CLOSED item sitting inside a LIVE one.** Look inside items, not only at their heads.
- **A REGISTER hiding inside a rule file.** Dated entries accumulating in a file whose subject is not
  chronological. This file was the fourth.
- **A SHAPE decision has an expiry date.** Re-measure the thing the old argument was about, and write
  the measurement into the file rather than only the conclusion.
- **A "fix" that EXTENDS a stale hand-list.** It resets the clock. Delete the list and point at what the
  register itself maintains.
- **A register that never calls itself append-only** is invisible to a pass that finds registers by
  reading headers — and to the tool.
- **A correction that reaches one twin and not the other.** When you retract something, grep the
  symbol, not the file.
- **A DESIGNATION split into two rows.** A designation is a session, not a job.
- **A deferral whose reason was a CONDITION rather than a decision.** It stops being true without
  anybody editing it — "until the set is live" does not notice the set going live.
- **A deferral with a named owner that nobody took.** A deferral is a decision only while something
  will surface it again.

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
- **Preserved artifacts that happen to live in `backups/`.** They are not backups, and retiring the
  backup convention does not make them clutter: `pre-docs-cleanup/Packs Turn Log.txt` (Sonnet 5's
  credits in its own words, pointed at from `LOGBOOK.md`), `pre-job4c/Claude Chat Version History/`
  (the Chat era's only job snapshots), and `deck-research-2026-08-14/` (linked from `DATA.md` and
  `data/OPPONENT_DECK_POOL.md`). **If that folder is ever cleared, these move out first and their
  pointers move with them** — preserved material dies by losing its pointer far more often than by
  being deleted.

## What is safe to cut

- **The narrative of how a settled decision was reached**, once it is settled. The v1/v2/v3 history
  of the rarity table is interesting and is not needed to change a number. Move it, don't delete it.
- **Planning-voice framing after the thing ships.** "Open question", "not yet built", "we should
  decide" — check each one, because some are still true and those are the most valuable lines in
  the file.
- **Counts and rosters that duplicate a command's output.** Say where to run it instead.
- **Restating a sibling doc's content "for convenience."** That is the duplication, arriving
  politely.

## What not to touch, and what is exempt

**Do not restructure a file because you would have organised it differently.** Form divergence across
instances produces a document nobody recognises.

**The target is 200 TOTAL lines — the literal `wc -l`, blanks included.** Two passes have reported the
tree about a quarter low by reaching for a command that silently skips blank lines. Being over beats
cutting the paragraph that stops the next session losing a morning; if you go over, say why in the
commit.

**Before you trim because something is preserved elsewhere, go and look at the elsewhere.** A "this is
duplicated" claim is a claim about two files, and it rots when either moves.

**Put a file's own limit where it is read BEFORE the decision** — at the top of the live file, not only
in its archive. A constraint read after the choice it was meant to inform is advisory.

**Exempt: every append-only register and every archive of one.** Correct entries; never condense them.

- **Find them by reading headers, never by keeping a list** — the roll rots, the label does not. **A
  file of this shape must say so in its own header, and state its own split threshold there.**
- **The newest archive in a series is still receiving** and answers to its own threshold like the live
  file. Every earlier archive is closed by the existence of the next.
- **A directory page is not exempt.** `RULINGS.md` beside `Rulings/` is method and an index; the
  register is the folder.

**Splitting. Length is a reason to look, not a verdict.** Five questions, each paid for by a file here:

- **Would a session working on something else need this?** That is the split test, and it produced
  most of the siblings in this tree.
- **Where do the inbound links aim?** When most aim at one section, that section is a file — and check
  them again after any split.
- **How many entries, how long is each, and how many copies already exist?** A section with a register
  twin wants deleting down to its rule; many file-sized entries want a directory; many short ones want
  one sibling.
- **Is the list cited by NUMBER from outside?** A structure that invites renaming invites repointing.
- **Does one file hold a spec's SHIPPED half and its UNBUILT half?** Split by state, not by topic.

**When a pass produces a rule about organisation, the rule goes here** and a one-line marker goes where
the work happened. *[Each of these, with the file that paid for it →](DOC-DRIFT.md)*

**`CLAUDE.md` has an honest floor, and it is not 200.** Getting under it means deleting orientation.
Each job adds an index row and a plan line; what to check is that the growth is index and status
rather than depth that belongs in a sibling. **A finished job's narrative is not status** — it moves to
whichever `HISTORY-ARCHIVE` is still open when the job closes — `HISTORY.md`'s table says, and the plan keeps one table row.

## Finishing a pass

1. **Write new siblings first, then rewrite the files they came out of, then fix the pointers.**
2. **Before any split, grep for positional references** — "the entry above", "the last row". A split
   re-points them silently. Name the entry, never a position.
3. **Where you can, delete the count rather than correcting it**, and point at the data. A correction
   that leaves a human instruction behind has a half-life; one that removes the thing needing
   maintenance does not.
4. **`node tools/doccheck.js` again, then `node tools/test.js`.** A docs pass should not touch game
   code, and the gate proves it did not. If it did, say so and keep it to its own hunk.
5. **Commit in two parts:** the game's own files, then its catalog row in `Games/CLAUDE.md` alone.
   That file is shared by parallel sessions — edit only your row, and check the diff shows one line.

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

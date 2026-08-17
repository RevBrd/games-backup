# Shadowless — maintaining the documentation

This tree is around twenty files and it will drift. This is how to bring it back, written 10 Aug 2026
by the instance that did the second split and extended by each one since, for whoever does the next.

It is about **the docs**, not the code. It generalises to any game whose docs outgrew one file, but
the examples are from here.

## When a pass is worth doing

Not on a schedule. The triggers that actually mean something:

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
- **An invariant stated in terms that stopped being true, while the invariant itself holds.**
  `.boardcol.wide` "must stay last in `style.css`" had not been last since Job 5, and nothing was
  broken, because the real rule was *after the CARD SYSTEM section*. A rule that reads as violated
  is worse than no rule: the next reader either "fixes" a non-bug or trusts the wording and breaks
  the real one. State invariants against the thing that matters, not against a position that
  happened to coincide with it.

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

  **`CREDITS.md`'s two-or-three-line rule needs re-imposing about once a week.** The fifth pass found
  it abandoned by every instance since it was set, including the one that set it, with rows grown to
  a paragraph each. **Trimming is safe only where that instance has a logbook entry** — that is the
  test to apply row by row. Where one exists the row is a duplicate and the logbook holds more; where
  none exists, move the row's text into the logbook **verbatim first**, then write the short version.
  #12 was the only row in that state. Do not decide sentence by sentence what earned its place.

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
and the file everyone was protecting as slightly over was 78% over. **Quote the unit whenever you
quote a number**, and prefer running the command to reading a figure in prose.

Being over beats cutting the paragraph that stops the next session losing a morning. If you go over,
say why in the commit.

- **Exempt: `LOGBOOK.md`, `LOGBOOK-ARCHIVE-1.md`, `Rulings/*.md`, `HISTORY.md` and `GRABHIST.md`.**
  All are append-only registers, and none can be shortened without deleting something — a
  session's account of its own work, a ruling somebody then has to make again, a rejection's *why*,
  or the gap between what a playtest report said and what was actually found. Correct entries in
  them; never condense them. `HISTORY.md` joined on the fourth pass, when it became the destination
  for material trimmed out of the live files; `GRABHIST.md` and the logbook archive joined on the
  fifth. **Any future file of this shape must say so in its own header**, as all of them now do —
  `GRABHIST.md` spent two days without the label, which is how one of these gets tidied by mistake.

  **The exemption moved off `RULINGS.md` itself on 15 Aug 2026** and this is the shape to copy when a
  register outgrows one file. It split into a directory page plus one file per ruling in `Rulings/`,
  which means **the parent is no longer exempt** — it is method and an index, it will be revised, and
  it should stay short. The register is the folder. Stating the exemption against `RULINGS.md` after
  that split would have been the "invariant stated in terms that stopped being true" trigger above,
  aimed at the very file that warns about it.
- **`LAYOUT.md` survived two split proposals and was split on the third — by Trevor, on a different
  argument.** Worth reading in order, because it is the clearest case in this tree of a right
  decision reached by the wrong criterion twice. The third pass proposed *sizing vs. interaction* and
  withdrew it, correctly on its own terms: the coin toss and the opening-setup screen are both mostly
  geometry, so the seam is not clean by topic. The fourth pass took the file to **302** by moving the
  instruments out, left the seam explicitly available and *not taken*, and told the next pass not to
  take it for him. The fifth pass measured it at **380** and reported that, expecting the same answer.
  **Trevor took it, and the criterion he used is the better one:** not is-this-topic-pure but *would a
  session working on something else need this?* — the split test that produced `COLLECTION.md`. A
  session fixing the hand fan never needs the coin's reduced-motion tilt, however geometric it is.
  What settled it was the compaction trigger above, not tidiness. [INTERACTION.md](INTERACTION.md)
  took the coin toss, the Energy picker, the opening flip, opening setup and the action bar; the
  one genuinely-sizing rule among them (the coin's zero-height strip) stayed behind as a one-liner
  with a link. **The lesson to carry: when a split feels right but the topic argument keeps failing,
  the criterion is probably wrong, not the instinct.**
- **`AI.md` reached 365 and was split the next turn**, on the same criterion. The cleave that worked
  is *how the bot is measured* — the two instruments, the six ways measurement lies, the match log,
  the standing figures — against *how the bot thinks and what has shipped*.
  [MEASUREMENT.md](MEASUREMENT.md) took the first. **The tell that the seam was real: the child had
  more entrances than the parent.** `PLAYTEST.md`, `TOOLING.md` and `CLAUDE.md` all link in for
  measurement and not one of them wants to read about scoring weights on the way. That is a useful
  signal generally — **when most inbound links to a file are aimed at one section, that section is a
  file.** Ten pointers were re-routed with it; check inbound links after any split, because a stale
  one lands the reader in the half you just moved away from.
- **`CLAUDE.md` has an honest floor around 250 and this is worth knowing before you try.** The fourth
  pass took it from 313 to 259 by moving out everything that was not orientation — the AI material,
  the data material, the job history, three settled arguments. What is left is the index, the status,
  the tree, the commands, the standing decisions and the six facts that have each cost a session an
  hour. Getting under 200 from there means deleting orientation, which is the one thing this file is
  for. Don't spend an hour rediscovering that.

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
grep -oh "](\([A-Za-z0-9_./-]*\.md\)[^)]*)" *.md | sed 's/](\([^):]*\).*/\1/' | sort -u | while read f; do [ -f "$f" ] || echo "MISSING: $f"; done
```

   **Run it in `data/` and `Rulings/` too.** Both folders have their own markdown, and the fifth pass
   found a link in `data/` pointing one directory too high — a root-only sweep cannot see it. Every
   link out of `Rulings/` to a root doc needs the `../` prefix, which is the same trap one level over.

   Then `node tools/gen_cards.js --check`, `node tools/build.js --check`, and the six suites — a
   docs pass should not touch code, and that proves it didn't. If it did touch code (the fifth pass
   fixed one wrong string in `selftest.js`), say so in the commit and keep it to its own hunk.
6. **Commit in two parts:** the game's own files, then the catalog row in `Games/CLAUDE.md` as its
   own commit. The catalog is shared with parallel sessions; edit only your row, never rewrite the
   file, and check `git diff CLAUDE.md` shows one row before staging.

## House style

Worth matching, because the tree reads as one voice and that is load-bearing for trust:

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

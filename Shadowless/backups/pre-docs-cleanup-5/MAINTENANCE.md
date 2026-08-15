# Shadowless — maintaining the documentation

This tree is a dozen files and it will drift. This is how to bring it back, written 10 Aug 2026 by
the instance that did the second split and extended by each one since, for whoever does the next.

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
That single question produced `COLLECTION.md`.

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
  decision was his, say so — it changes how much authority a future instance has to overturn it.
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

- **Exempt: `LOGBOOK.md`, `RULINGS.md` and `HISTORY.md`.** All three are append-only registers, and
  none can be shortened without deleting something — a session's account of its own work, a ruling
  somebody then has to make again, or a rejection's *why*, which is the only part that stops the idea
  coming back. Correct entries in them; never condense them. `HISTORY.md` joined the list on the
  fourth pass, when it became the destination for material trimmed out of the live files. Any future
  file of this shape should say so in its own header, as all three now do.
- **`LAYOUT.md` is the one to watch, and it has now survived two split proposals.** The third pass
  proposed *sizing vs. interaction* and withdrew it, correctly: the coin toss and the opening-setup
  screen are both mostly geometry. The fourth pass took it to **302** without splitting — by moving
  `tools/shot.js` and the DEV tab to `TOOLING.md` (they are instruments, and that reverses an earlier
  call that they belonged where they are used) and two settled narratives to `HISTORY.md`. It is
  still over, deliberately: every rule in it was paid for with a wrong version first, and Trevor's
  constraint is that the visual material stays together. **The seam that is still available** is
  *how the board sizes itself* vs. *what happens when you touch it* — the coin toss, opening setup
  and the action bar are ~100 lines that never mention the fitter. Trevor has seen that proposal and
  not taken it. Don't take it for him.
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

   Then `node tools/gen_cards.js --check`, `node tools/build.js --check`, and the five suites — a
   docs pass should not touch code, and that proves it didn't.
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
- **Tables for parallel facts, prose for reasoning.** Don't put an argument in a table cell.
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

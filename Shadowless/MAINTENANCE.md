# Shadowless — maintaining the documentation

This tree is nine files and it will drift. This is how to bring it back, written 10 Aug 2026 by the
instance that did the second split, for whoever does the third.

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

**The 200-line target is a target.** `LAYOUT.md` at 243 and `CLAUDE.md` at 217 are deliberate. Being
8% over beats cutting the paragraph that stops the next session losing a morning. If you go over,
say why in the commit.

## The procedure

1. **Back up first** — `backups/pre-docs-cleanup/` or equivalent. Cheap, and this pass rewrites
   whole files rather than editing them.
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

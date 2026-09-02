# Shadowless — history archive 1: the build era

**Jobs 1 through 10, and the research behind the pack table.** Split out of [HISTORY.md](HISTORY.md)
on 22 Aug 2026, when that file reached 461 lines against the ~450 its own header sets and asked for
an era split. This is the era: everything from the Claude Chat snapshots through Team Rocket going
live on 19 Aug 2026, plus the provenance of the tools that built it.

**Nothing here was condensed or corrected in the move.** Sections are verbatim and in their original
order.

Read it when you want to know **how a job was shaped** — Job 6's split by machinery rather than by
set is the one worth ten minutes before planning any set, and Job 10 repeated it. The live file
holds the rejections that are still live arguments; this one holds the account of work that is
finished.

**This file is append-only and closed.** A new job's account goes in [HISTORY.md](HISTORY.md) and
moves here once the era it belongs to is closed. The 200-line target does not apply.

| Section | What it settles |
|---|---|
| The job history | What each of Jobs 1–10 left behind, including Job 6's split-by-machinery, the three things Job 7 turned up that were not Job 7's, and the four guards Job 10 found not guarding |
| Pack research: two things that were wrong | There was never an unnumbered Energy era; every `base1` scan we own is 1st Edition Shadowless |
| The rarity table went through three passes | Why 1/440, 1/2200 and 1/11000 are the shapes they are, and the ~5x ladder to extend from |
| Tooling provenance | Why `tools/chat-era/` cannot run, and how the Node replacements were verified |

## The job history

**Jobs 1 through 4b were built in Claude Chat.** The ten snapshots survive in
`backups/pre-job4c/Claude Chat Version History/`, but no per-turn notes do — the arc below was
reconstructed 10 Aug 2026 by diffing the top-level symbols each snapshot added, so it is derived
rather than remembered, and it is coarse on purpose. Every file's `<title>` still says "Job 1";
that is a stale title, not a clue.

| Snapshot | What appeared in it |
|---|---|
| `job1` | The rules engine and a playable board — 169 top-level symbols at once |
| `job1a` | Deck selection: `DECK_NAMES` and the deck rows |
| `job1b` | The coin-flip presentation — `dispatch()` and `stepPresentation()`, still the shape it uses today |
| `job1c` | Trainer pickers and the legality edges around them |
| `job1d` | The deck select screen proper — `renderDeckSelect`, `deckSummary`, `startMatch` |
| `job2` | **The AI.** `AI_WEIGHTS`, `STATUS_VALUE`, attack scoring, danger evaluation |
| `job3a` | **The art system** — the sigil, `costRow`, the rendered card face |
| `job3a2` | Sigil refinement: petal geometry, rings, rays, studs |
| `job3b` | **The board** — mat, bench, prize zone, discard stacks, card backs |
| `job4a` | `deckgen.js` and the Sandbox deck |
| `job4b` | The 44-test smoke suite, and the handoff out of Chat |

**Jobs 4c onward were built in Claude Code** and are in `git log`, which is unusually readable here
— one commit per meaningful step, with a message that says what changed rather than what file did.
Prefer it over any summary. The broad shape: 4c–4f the Powers and the Base Set oddities, 4g the
mat and the fitter and the real card scans, 5a–5e the collection.

**Job 4 deliberately did not build a collection/dex mockup.** The language was settled but the
screens did not exist, so anything mocked up would have been thrown away. It was built for real in
Job 5, and that was the right call.

**Job 5 — the collection, 9 Aug 2026.** Everything a collection game needs, in one session:
`collection.js` and the versioned save, `packs.js` and booster generation, the pack reveal, the
variant renderers, the CARDS and DEX browsers, export/import, and the deck builder. Two test suites
arrived with it. The decisions it settled are live in [COLLECTION.md](COLLECTION.md) and
[PACKS.md](PACKS.md) rather than here.

**Job 6 — Jungle and Fossil, 10–11 Aug 2026.** Also one session, and **split by machinery rather
than by set**, which is the part worth keeping: Jungle is nearly all bulk and Fossil holds nearly
all the architecture, so a by-set split would have front-loaded the easy half and deferred every
hard decision without either set shipping sooner. What each sub-job actually left behind:

| | |
|---|---|
| 6a | `SET_INFO`, set identity through the reveal, `homeSet()`, per-set pack buttons, the Energy **stipend** for sets printing none. Also the AI verb coverage check, which found eleven Base Set verbs the bot had never scored |
| 6b | The passive-Power layer — **consulted, never materialised** — and the `powerActive`/`powerUsable` split. Built before any card needed it. See [ENGINE.md](ENGINE.md) |
| 6c | Both sets generated behind a derived live-set gate; six things that had quietly hardcoded Base Set; the 31-entry alias table for the duplicate Rares |
| 6d–6e | The new verbs, the cards they unlock, and the thirteen Powers including the shared Peek/Clairvoyance panel. Jungle went live here |
| 6f | Ditto, on the `baseCard`/`topCard` split. See [ENGINE.md](ENGINE.md) for the machinery and [RULINGS.md](RULINGS.md) for the call |

**The estimates it was planned against were close and are worth recording**, because the next set
will be planned the same way: ~55 cards needing no new verb, ~37 new verbs, 13 Powers. The count
that mattered most was the one that stopped 126 printings being 126 jobs — both sets print every
Rare twice, so the real figure was **95 distinct behaviours**, verified mechanically across name,
HP, stage, weakness, retreat and every attack and Power rather than by eye.

Two things Job 6 discovered about its own tooling, both now permanent. **A test written against a
synthetic database beats a test that starts working later** — 6a's Energy cases had to run before
base2 and base3 existed, and a test nobody can run when the mechanism is written is a test nobody
runs at all. And **a green suite can be green for the wrong reason**: a Chansey attack-lock case was
passing because Chansey had no Energy, so `canUseAttack` was refusing on cost rather than on the
lock under test.

**Job 7 — progression and named opponents, 12 Aug 2026.** One session again, on groundwork #8 had
laid two days earlier. The live account is in [PROGRESSION.md](PROGRESSION.md); what belongs here is
the shape, because the next set-adding job inherits it.

**The structural decision was Trevor's, not the building instance's.** A `LADDER` constant had been
drafted; he asked for something that would take the other eleven sets without rework, and the answer
was to build the ladder from the live-set list at runtime — an authored bracket where one exists, a
generated one where it does not. About forty lines, and it is why **Job 8 is adding sets rather than
rewiring progression**. Unlock is derived the same way and deliberately not stored: a bracket is open
if the previous boss has been beaten, recomputed from the save every time it is asked.

Three things it turned up that were not Job 7's:

- **Every win in the game had been paying out in Base Set.** Both `addPacks` call sites passed
  `homeSet()`, which is always `base1`, so 119 of 221 cards were unobtainable and `CLAUDE.md` had
  claimed the opposite for two days. That inverted the framing of the whole job — a save migration
  was being planned to grandfather a freedom nobody had. **The ladder does not gate the other sets;
  it is the wiring that makes them reachable.** Found by Trevor saying his save could not earn them,
  against a doc that said it could.
- **The groundwork was not usable as it stood**, and the pre-flight that found this out was worth
  more than the time it cost: seven of the sixteen decks named `basep` cards, which is not a live
  set, so the validator would have refused them. Ten references, not a set job. One deck flagged as
  defective in its own notes turned out to be fine — the extraction was faithful and only the note
  was wrong.
- **Four layout defects were live while 136 smoke tests passed**, all four found by `tools/shot.js`.
  That is the sharpest case in the project's history for the rule that a green suite proves nothing
  visual. See [PROGRESSION.md](PROGRESSION.md).

**What it deliberately did not do: the decks and names are placeholders.** Real per-set opponents,
hand-built and better-generated, are a job of their own — Trevor's call. The candidate pool for that
job is in `data/OPPONENT_DECK_POOL.md`; see [DATA.md](DATA.md).

**Job 8 — what an opponent is made of, 15 Aug 2026. A design job, and nothing in it was built.** The
spec is live in [OPPONENTS.md](OPPONENTS.md); what belongs here is the shape of the job, because it
is the model for the ones that follow. It fixed *parameters* rather than card lists — four silent
difficulty tiers, a rung pattern, one entry-condition mechanism serving three different gates, and a
pressure tag saying what a deck **does to you** rather than how strong it is — on the reasoning that
the lists cannot be written until we can see what each set actually offers. Names, dialogue and
gimmick rules were excluded on purpose, to a detailing pass after every set is in, so that nothing in
the spec has to be unpicked when the fiction arrives.

**Job 9 — AI work from the grab bag, 16 Aug 2026.** Two instances, several batches, and the
generalisable half is not about the AI at all: **three of the first five changes were to the match
log rather than to the game.** Proving one report wrong needed a pass that says *why* it did not
attack, an opening board that `setupAuto` had never recorded, and a way to tell two identical
Squirtle apart — all three invisible until somebody needed them, and all three needed by the first
question anyone asked. *An item about the game is surprisingly often an item about the thing
measuring the game; that is now three sessions out of three.* The per-item accounts are in
[GRABHIST.md](GRABHIST.md) and the invariants they left are in [AI.md](AI.md).

**Job 9.5 — the sixth documentation pass, 16 Aug 2026.** The logbook re-archived on a boundary rather
than a count; `AI.md` cut from 300 to its rules with the accounts left where they already lived;
`CREDITS.md` returned to three lines a row for the third time; the closed jobs collapsed into this
file. What it found is in [MAINTENANCE.md](MAINTENANCE.md).

**Job 10 — Team Rocket, 17–19 Aug 2026, live at 83 of 83 printings.** Split by *machinery* rather
than by card, the way Job 6 was: the attacks first, then the trigger points, then the Energy, then
the Trainers. What it added is in [ENGINE.md](ENGINE.md) — three of the nine systems there are its —
and the six rulings it settled are in [RULINGS.md](RULINGS.md).

Three things from it are worth carrying forward rather than looking up.

**The size of a job is a measurement, and it was one command away.** `shapecount.js` was written
mid-job because Trevor asked whether the survey that shaped the trigger work deserved writing down.
It then answered four separate "how much machinery" questions in one session — build a verb list for
`ON_PLAY` (20 printings, 15 distinct texts), do *not* generalise `ON_KO` (3 printings, 2 behaviours),
special-case the two unique Trainers, and build `pendingAsk` general (17 printings, 16 texts). Every
one of those would otherwise have been taste. *[The tool, and what it is not →](TOOLING.md)*

**Four guards were found not to be guarding, and only one by reading.** The coverage gate had been
blind to Energy since Base Set. `doTrainer` held 63 dead lines that duplicated the legality switch
and would have made the next Trainer author's legality test silently never run. A static check
written in this same job, and cited as a guarantee in two documents, stayed green when the thing it
checked was deleted. `setsurvey`'s own control cried wolf on a corpus typo the generator already
corrects. **Three of the four were found by deliberately breaking the thing and watching** — the step
this tree keeps prescribing, skipped twice in this job because the check "obviously" worked.

**A default should point at the set that GROWS.** Two rulings a day apart point opposite ways and are
consistent for one reason: attack damage defaults to *true* because its callers multiply with every
set, and played-from-hand defaults to *silence* because "from hand" is a closed idea. Whichever side
is open gets the default; the small closed side declares itself.

## Pack research: two things that were wrong

Both were found on 9 Aug 2026 at the start of Job 5, by re-checking `data/raw/` rather than
reasoning from Base Set alone. Both had been stated confidently.

**There was never an "unnumbered Energy" era.** An earlier version of the pack research described
basic Energy as living outside the numbered set until some cutover partway through the era, and
asked which set the cutover landed on. There is no cutover and there was no pool. The corpus simply
leaves `rarity` blank on basic Energy in the five sets that printed it, and every one of those
numbers it inside its own range — Base's are #97–102 of 102. Double Colorless is the counter-example
that proves it: #96, Uncommon, numbered like anything else. Leaving the original wording in place
would have sent Job 5 hunting for a boundary that does not exist.

**Every `base1` scan we own is already 1st Edition Shadowless.** Found by pulling the hires image
for `base1-4` and reading it: the `EDITION 1` stamp sits below the artwork on every card, and the
art frame carries no drop shadow, because 1st Edition Base *is* Shadowless by definition. There is
no second image per card in the corpus, so there is no Unlimited scan to fall back on. This is what
forced the split that `PACKS.md` now states as fact — additive cosmetics can live on a bitmap,
print-run cosmetics can only live on our own render — and the rule that a pack reveal can never be
the scan alone, because a bare scan is variant-blind and a 1-in-2200 pull would land silently.

**1st Edition was nested under Shadowless, and should not have been.** Corrected 8 Aug from
Trevor's own collection. The nesting holds for Base Set specifically, because Base is the one set
whose art frame changed mid-print-run. Across the full 14-set pool they are independent: Jungle
onward all launched with the shadow already standard and never changed it, while 1st Edition print
runs existed for most sets in the era. So the game treats them as independent rolls.

**Reverse Holo's slot count said 7 until 9 Aug.** That was the Common count mistaken for
Common-plus-Uncommon. It is 10 — 3 + 7 — and the v3 table always said so.

## The rarity table went through three passes

v1 and v2 were worked out **forward** from packs-opened. v3 (8 Aug) was worked out **backward from
wins needed**, against a working assumption of 2 packs per win, then rounded to whichever per-card
odds made the pack/win math land exactly. That is why the numbers are the shapes they are — 1/440,
1/2200, 1/11000 look arbitrary and are not.

Two properties fell out of it that are worth preserving if the table is ever retuned:

- **The win milestones form a clean ~5x ladder** (5 → 20 → 100 → 500). If a tier is ever added, "~5x
  the wins of the tier below" is a legible rule to extend from rather than picking a number fresh.
- **Two open questions closed themselves.** Shadowless's "50% better odds" ask landed at ~1.86x
  more likely than the old 1/4096, which is essentially the more generous of the two readings; and
  the Misprint/Shadowless gap widened from ~3.7x to 5x in the same pass, addressing the "too close"
  concern without reaching for 1/25000.


## Tooling provenance

**Why `tools/chat-era/` cannot run**, which matters because it looks like a one-line fix.
`gen_cards.py` reads a clone of the `pokemon-tcg-data` repo from `/tmp/ptcg/*.json` and a
spreadsheet from `/mnt/user-data/uploads/` — both Claude Chat sandbox paths, neither of which
survived the port. The JSON corpus has since been re-downloaded to `data/raw/`, so that half is
recovered. It also imports `openpyxl`, which is not installed. Python *is* installed on this machine
now, which is exactly why this needs writing down. Keep the files: `gen_cards.py` is a clear
specification of what the output must look like, and it is how we know the deck lists came from
named spreadsheet sheets.

**How the Node replacements were verified**, which is the check to reproduce if either changes.
`build.js` was run against the recovered sources and its output diffed against the artifact as it
arrived from Chat — byte-identical, title line aside, which is what established that the recovered
sources are the real ones and not a stale copy. `gen_cards.js` was verified twice: against the CSVs
it reproduced all 90 pre-existing cards exactly, field by field, before being widened to 102; then,
migrated to read the upstream corpus instead, the two independent sources were diffed against each
other and produced **byte-identical output for all 102 Base Set cards**. That agreement is what
justifies trusting the corpus, and it is repeatable if anyone ever doubts it.


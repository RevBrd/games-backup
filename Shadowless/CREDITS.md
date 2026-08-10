# Shadowless — credits

Who built what. Split out of `CLAUDE.md` and `PACKS.md` on 10 Aug 2026, because credits grow
forever and orientation should not.

Add yourself when you work on it. One entry per model per stretch of work, newest last. If you
prefer to credit yourself per pass rather than per session, that is fine — the Job 5 packs entry
below is the worked example, and it is why this file exists at the size it does.

## Claude Chat

- **Opus 5** — the whole game through Job 4b. The rules engine, the AI, every card script, the art
  system, the UI, the module layout, the Python build pipeline and the 44-test smoke suite. The
  ten job snapshots are preserved in `backups/pre-job4c/Claude Chat Version History/`; what each
  one added is reconstructed in [HISTORY.md](HISTORY.md).

## Claude Code

- **Opus 5** (4 Aug 2026) — port into the collection, naming, the data audit, `tools/selftest.js`,
  the Node build port, and the repo layout.
- **Opus 5** (5–6 Aug 2026) — Job 4: Pokémon Powers and the Base Set oddities. Job 4g: the mat, the
  fitter, the title screen, the real card scans.
- **Opus 5** (7–8 Aug 2026) — `tools/shot.js` and the DEV fit readout, the hand face, the mat's
  edge, and the first documentation split.
- **Sonnet 5** (7–9 Aug 2026) — `PACKS.md`: the pack research, the rarity design, and the rulings
  discussions, written during a parallel Job 4g session at Trevor's request. Credited per pass by
  its own choice:
  - *7 Aug* — the document, researched and written.
  - *8 Aug* — Part 2's working plan, refined with Trevor over the Energy floor, the flat holo
    ratio, and the rarity axes.
  - *9 Aug* — corrected the 1st Edition / Shadowless relationship after Trevor's own collection
    contradicted the original nesting; added Reverse Holo and the RS naming convention; floated
    Miscut as a new idea.
  - *9 Aug* — the placeholder rarity table with expected-packs math; adopted Misprint and its
    digital-glitch direction; settled opponent cosmetics and the alt-art question with Trevor.
  - *9 Aug* — the v3 table, reworked backward from Trevor's wins-needed pacing schedule instead of
    forward from packs opened; resolved the Shadowless odds ambiguity and the Misprint gap as a
    byproduct.
- **Opus 5** (9 Aug 2026) — Job 5 from start to finish. The collection model and save file
  (`collection.js`), booster generation (`packs.js`), the pack reveal, the variant renderers, the
  collection and dex browser, export/import, the deck builder, and the two test suites covering
  them. Also two corrections to the pack research — there was never an unnumbered Energy pool to
  find a cutover in, and every scan we own is 1st Edition Shadowless, which forced the split
  between cosmetics that can live on a bitmap and cosmetics that can only live on our own render.
- **Opus 5** (10 Aug 2026) — made a missing collection slot name the card you are chasing, over a
  ghosted Sigil Card with the type edge, which turns the MISSING filter into a want-list.
- **Opus 5** (10 Aug 2026) — rebuilt the opening-setup screen as a preview of your half of the mat,
  with real ACTIVE and BENCH zones and the hand in the hand's own face; added `setupTakeBack()` and
  four tests for it. Found and corrected `LAYOUT.md`'s claim that a dialog has room for `miniCard`,
  which was why setup had been printing "Flamethrower" as `Fla/met/hro/wer`.
- **Opus 5** (10 Aug 2026) — this documentation pass. Split out `COLLECTION.md`, `HISTORY.md` and
  this file; rewrote `PACKS.md` from a planning document into a reference one; de-duplicated the
  facts that had drifted between files; reconstructed the Chat-era job history from the snapshot
  symbol diffs.

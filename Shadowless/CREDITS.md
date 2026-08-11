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
- **Opus 5** (10 Aug 2026) — the post-Job-5 documentation and interface pass: the doc tree split,
  and then a sweep through every screen Job 5 had left rough — collection, opening setup, starter
  pick, the in-battle actions and the Trainer pickers. Credited per pass by its own choice:
  - made a missing collection slot name the card you are chasing, over a ghosted Sigil Card with
    the type edge, which turns the MISSING filter into a want-list.
  - rebuilt the opening-setup screen as a preview of your half of the mat, with real ACTIVE and
    BENCH zones and the hand in the hand's own face; added `setupTakeBack()` and four tests for it.
    Found and corrected `LAYOUT.md`'s claim that a dialog has room for `miniCard`, which was why
    setup had been printing "Flamethrower" as `Fla/met/hro/wer`.
  - this documentation pass. Split out `COLLECTION.md`, `HISTORY.md` and this file; rewrote
    `PACKS.md` from a planning document into a reference one; de-duplicated the facts that had
    drifted between files; reconstructed the Chat-era job history from the snapshot symbol diffs.
  - the starter pick screen: the four theme decks at three times the picture, their composition
    spelled out, and `.deckgrid` changed from a five-column grid to a centred wrapping row, which
    also stopped deck select stranding a lone deck against the left edge.
  - the in-battle action UI. Hand clicks run their verb directly instead of filling a menu with one
    item; promote and send-up became bench clicks; retreat moved onto the Active card with a
    confirmation gate that also locks the attacks. Nine smoke tests.
  - the Trainer pickers: the real printed scans instead of `miniCard`, which had been rendering
    "Fire Spin" one letter per line. Also defined `.sheet.wide`, which was being set on the picker
    and existed nowhere in the stylesheet.
- **Opus 5** (10 Aug 2026) — Job 6 planning, and the start of 6a. Established that Jungle and Fossil
  are 95 distinct cards rather than 126 (both sets print their Rares twice), that the job wants
  splitting by machinery rather than by set because Fossil holds nearly all the architecture, and
  that ~37 new verbs plus 13 Power kinds roughly doubles the DSL. Refreshed the `effects.js` verb
  reference, which had drifted to about half of what the engine implements — the immediate cause of
  a planning pass rediscovering `DMG_PER_SPARE_ENERGY`, `BARRIER_ON_FLIP` and `WHIRLWIND` as things
  Jungle needed and already had. Documented `ai.js` as a silent-failure surface in
  [ENGINE.md](ENGINE.md). Settled Transform as snapshot-on-entry with Trevor and found the damage
  pump hiding in the first version of its HP rule. Then built the coverage check that documentation
  described, which immediately found **eleven Base Set verbs the AI had never scored** — Thunderbolt
  believed free, Super Fang valued at zero, Earthquake's damage to its own bench invisible — and
  fixed all eleven. None of them appears in a theme deck, so 480 `selftest.js` games ran identical
  before and after; the ten new `powertest.js` cases are the only thing that can see them. Then
  Job 6a itself: `SET_INFO` generated into `cards.js`, set identity through the pack reveal,
  `HOME_SET` replaced by a derived `homeSet()`, per-set pack buttons, and the Energy question
  settled as a **stipend beside the pack** for the sets printing none — with thirteen `packtest.js`
  cases written against a synthetic database, because base2 and base3 do not generate until 6c and a
  test that only starts working later is a test nobody runs when the mechanism is written. Then 6b,
  the continuous-effects layer: seven passive Power kinds consulted rather than materialised, the
  `powerActive`/`powerUsable` split that lets Toxic Gas suppress everything without suppressing
  itself, Transparency's coin kept out of the pure forecaster, and `STATUS_IMMUNE` separated from
  `blocked` after an early version quietly told the AI that Snorlax could not be dragged. Then 6c:
  generated both sets behind a derived live-set gate, found six things that had quietly hardcoded
  Base Set (including a pacing measurement that went from 0.8s to 6m17s chasing cards it could never
  pull), built the 31-entry alias table with a test proving it in both directions, and wrote the
  first 34 card scripts — six of which are one-line Power declarations only because 6b existed.
- **Sonnet 4.6** (10 Aug 2026) — Job 7 groundwork: researched and built `data/gbc_decks.json`, the
  GBC opponent deck reference. All 16 decks from the first Game Boy Color game — eight Club Masters,
  four Grand Masters, and Ronald's four escalating rival decks — sourced from Bulbapedia character
  and deck pages, verified to exactly 60 cards each, and mapped to our set IDs. Out-of-scope cards
  (GBC-exclusive boosters, Pokémon Web, the game-completion promo Legendary Birds and Dragonite, Neo
  Genesis) are documented in a substitution table with reasoning, so the implementer has a clear
  record of what changed and why. Three decks flagged where source extraction left minor quantity
  uncertainty. Also read through the full doc tree on arrival and had a good orientation conversation
  about the project.

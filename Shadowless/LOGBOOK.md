# Shadowless — the logbook

What each instance did, in its own words. Split out of `CREDITS.md` on 11 Aug 2026, because the
narratives had grown to four times the attributions they were attached to and an attribution list
should be readable at a glance.

**This file is an archive and the 200-line target does not apply to it.** It only ever grows, it is
never rewritten, and **nothing already in it may be edited or condensed** — a later pass may find an
entry redundant and it is not, because the value of a logbook is that it says what somebody thought
at the time. Everything below the first heading arrived here verbatim from `CREDITS.md`, and the
entries written after the split are in the same voice.

`CREDITS.md` is the short version: who worked on what, and when. This is why.

**There is one older artifact of this kind, and it is not in this file:**
`backups/pre-docs-cleanup/Packs Turn Log.txt`, the Sonnet 5 per-pass credits as that instance
originally wrote them, preserved by the *first* documentation pass. It is deliberately left where it
is, in its own words and its own formatting, rather than absorbed here.

**It is also the reason this file exists.** That log opens by saying the main file's credits were
condensed *"but directs to the full credits here"* — and by 11 Aug nothing in the tree directed
anywhere near it. The pointer was lost in one intervening pass while the file itself survived
untouched, which is the quiet way an archive dies: not deleted, just unreachable. A pointer is not
optional decoration on a preserved artifact. It is the half that rots.

---

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
  Then 6d across two passes: 24 new verbs and the 43 cards they unlock, taking Jungle to 52/64 and
  Fossil to 42/62. Cloyster turned out to need nothing new at all — FLIP_OR_NOTHING already returns
  before the post-damage loop, so a plain STATUS beside it is governed by that same coin. Also
  caught a test of its own that was passing for the wrong reason: Chansey had no Energy, so
  canUseAttack was refusing on cost rather than on the attack lock being tested. A third pass
  finished everything that is not a Power or Ditto — deck search, deck ordering, discard retrieval
  and five Trainers — leaving Jungle at 59/64 and Fossil at 53/62. Then 6e, the interactive Powers:
  Curse, Strange Behavior, Heal, Shift, Step In, Peek and Cowardice, plus the shared Peek and
  Clairvoyance panel. Caught the AI scoring Curse at -Infinity because it looked both slots up on
  the wrong side of the board — a Power the bot would never once have used. **Jungle went LIVE at
  64/64.** Finally 6f, Ditto: Transform as a snapshot, built on a `baseCard`/`topCard` split so one
  override carries HP, type, Weakness, retreat and the whole attack list. Measured on the way past
  that Sandbox could produce a standalone Basic in 6 decks out of 2998 — which had quietly made 23
  cards, Ditto among them, impossible to playtest — and fixed the generator. **Job 6 complete: all
  221 cards across Base Set, Jungle and Fossil.**
- **Sonnet 4.6** (10 Aug 2026) — Job 7 groundwork: researched and built `data/gbc_decks.json`, the
  GBC opponent deck reference. All 16 decks from the first Game Boy Color game — eight Club Masters,
  four Grand Masters, and Ronald's four escalating rival decks — sourced from Bulbapedia character
  and deck pages, verified to exactly 60 cards each, and mapped to our set IDs. Out-of-scope cards
  (GBC-exclusive boosters, Pokémon Web, the game-completion promo Legendary Birds and Dragonite, Neo
  Genesis) are documented in a substitution table with reasoning, so the implementer has a clear
  record of what changed and why. Three decks flagged where source extraction left minor quantity
  uncertainty. Also read through the full doc tree on arrival and had a good orientation conversation
  about the project.

---

*Entries below this line were written after the split. The ones above it are the original
`CREDITS.md`, preserved as it stood.*

- **Opus 5** (11 Aug 2026) — the post-Job-6 documentation pass. Split this file out of `CREDITS.md`
  and reduced that to attribution. Collapsed `CLAUDE.md`'s Job 6 block, which had shipped in
  planning voice and still described the work in *estimates* — "the ~55 cards", "the ~37 new verbs"
  — rather than in what landed; the structural record moved to [HISTORY.md](HISTORY.md), which had
  stopped at Job 4b and now covers 5 and 6.

  Four things were wrong rather than merely stale, and they are the reason the pass was worth doing.
  **`.boardcol.wide` had not been last in `style.css` since Job 5** appended its collection section
  below it, while both `LAYOUT.md` and the stylesheet's own header still said it must be. Nothing
  broke, because everything below it is collectible surfaces and none of it touches board widths —
  but an invariant that reads as violated is worse than no invariant, since the next reader either
  hoists a working block or trusts the wording and appends a board rule underneath. Reworded both to
  the real rule: after the CARD SYSTEM section, not last in the file. **`RULINGS.md` was pointing at
  working code and calling it a gap** — it said Peek and Clairvoyance "belong on
  `UNSCORED_ON_PURPOSE`", where `ai.js` in fact scores `PEEK` as a deliberate `-Infinity` with a
  comment pointing back at `RULINGS.md`; following the doc would have moved a decision onto an
  opt-out list and lost it. **`ENGINE.md` was a "six systems" file describing seven**: Ditto's
  `baseCard`/`topCard` split is 47 references in `engine.js` and lived only in the rulings log, so a
  session adding a future card that changes what a Pokémon *is* would never have found it. And
  **`data/gbc_decks.json` was invisible** — the whole of Job 7's groundwork, sixteen researched
  decks, mentioned nowhere but one credit line.

  Deleted `miniCard()` and dropped it from `smoke.js`, on Trevor's call: `LAYOUT.md` had set its own
  trigger — *if nothing has claimed it by the time Job 6 lands* — and Job 6 landed with it still at
  zero callers. Checked first that `pc-atkname` has four other producers, so the picker's
  "not a text-carrying face" assertion stays a real test rather than a vacuous one.

  Proposed splitting `LAYOUT.md` at 277 lines and **withdrew it after looking properly.** The clean
  cleave I had described — sizing versus interaction — is not there: the coin toss is half placement
  geometry (a zero-height strip is what lets it overhang without reflowing a frozen board) and
  opening setup is almost entirely visual traps (the inherited `.side.mine` gradient, the five-class
  specificity fight against `min-height:249px`, empties matching filled footprints). What is
  genuinely not visual is one 37-line section, which is not a file. Trevor's constraint was that the
  visual material stay together, and honouring it meant not splitting at all.

  **Then a second stretch, which found more than the pass proper did, and only because I asked about
  five untracked files instead of ignoring them.** `tools/gen_cards.js` had **`base4` and `base5`
  swapped** — `base4` is Base Set 2, `base5` is Team Rocket, and the codes read backwards from what
  everyone assumes. It would have shipped 130 Base Set 2 cards in a pack labelled "Team Rocket", and
  the generator's refuse-to-name-an-unknown-set guard could never have caught it: **that guard fires
  on a missing name, and a wrong one is present.** It changed no output at all — `SET_INFO` only
  emits live sets, so `cards.js` came back byte-identical — which is exactly why it survived three
  sets and a documentation pass, and why it would have surfaced for the first time on the day
  somebody added a fourth. If you take one thing from this entry: a guard against *absence* is not a
  guard against *error*, and I only caught it because a spreadsheet cited `base4-127` in a set I
  believed had 82 cards. Follow the number that doesn't fit.

  Also: `TOOLING.md` had said for a week that the theme-deck spreadsheet was lost with the Chat
  sandbox and that `decks.json` could not be rebuilt from anything in the repo. It was in the
  working tree the whole time — `data/Deck Lists/Base1 Decks.xlsx`, matching Brushfire entry for
  entry. Nobody had looked locally, because the doc said not to bother. **A confident absence claim
  stops the search that would disprove it**, which makes it worse than an unknown; it is the same
  shape as the Packs Turn Log dying of a deleted pointer. With it came the two Jungle theme decks,
  now corrected and validated into `data/jungle_decks.json` — the sheet had given Rhyhorn and Meowth
  their own evolutions' ids, and uncorrected, Water Blast is an illegal deck the validator refuses.

# Shadowless — logbook archive 1

**Instances #0 through #10, in their own words.** Split off the front of [LOGBOOK.md](LOGBOOK.md) on
14 Aug 2026, Trevor's call, and **nothing in it was edited on the way across** — every entry is
exactly as its author left it, including the two `CREDITS.md`-era sections at the top and the
separator line that marks where the first split happened.

**Read it when you want the account of something built before 12 Aug 2026**, or when a live file
cites a decision and you want to know what the session that made it was thinking. [LOGBOOK.md](LOGBOOK.md)
carries the current work and the instructions; [LOGBOOK-ARCHIVE-2.md](LOGBOOK-ARCHIVE-2.md) carries
#11–#14.

**This file is long enough that a read of it comes back truncated**, so here is what is in it. Grep
the date to jump to an entry; the file is chronological and the numbers were assigned later, by
`CREDITS.md`, rather than by the instances themselves. **This index was added on 16 Aug 2026 and no
entry was touched to make it.**

| Instance | When | Subject |
|---|---|---|
| Opus 5 #0 | through 3 Aug 2026 | The whole game through Job 4b, in Claude Chat |
| Opus 5 #1 | 4 Aug 2026 | Port into the collection, the data audit, the Node build |
| Opus 5 #2 | 5–6 Aug 2026 | Job 4 — Powers and the Base Set oddities; Job 4g — the mat and the scans |
| Opus 5 #3 | 7–8 Aug 2026 | `tools/shot.js`, the DEV fit readout, the hand face, the first documentation split |
| Sonnet 5 #4 | 7–9 Aug 2026 | `PACKS.md` end to end — the pack research and the rarity design, five logged passes |
| Opus 5 #5 | 9 Aug 2026 | Job 5 — the collection, the save file, packs, the dex, the deck builder |
| Opus 5 #6 | 10 Aug 2026 | The post-Job-5 documentation and interface pass |
| Opus 5 #7 | 10 Aug 2026 | Job 6 planning and 6a — and the verb check that found eleven unscored verbs |
| Sonnet 4.6 #8 | 10 Aug 2026 | Job 7 groundwork — `data/gbc_decks.json`, all 16 GBC decks |
| Opus 5 #9 | 11 Aug 2026 | The post-Job-6 documentation pass; `base4`/`base5` found swapped |
| Opus 5 #10 | 12 Aug 2026 | **Four entries, one instance** — the fourth documentation pass, a bug and UI pass, the energy-discard picker, and two bugs found in match logs |

**Why it was split, since the reason is not "it got long."** The file passed the point where a
working session reliably holds all of it — entries were being summarised out of view mid-turn, and
one instance appended its entry into the *middle* of another's because the surrounding text had been
compacted away. Splitting it is a mitigation for that, not a judgement about any entry. The intended
end state is still one continuous logbook.

**This file is an archive. It only ever grows, it is never rewritten, and nothing already in it may
be edited or condensed** — the value of a logbook is that it says what somebody thought at the time.
The 200-line target does not apply.

**It is closed at #10, and that is deliberate.** The next block out of `LOGBOOK.md` went into
`LOGBOOK-ARCHIVE-2.md` rather than onto the end of this one, because appending here would have taken
a file that already reads truncated and made it worse. **Start a new archive rather than growing one
past ~250 lines.** Entries always move **verbatim, as a block**.

**There is one older artifact of this kind and it is not in either file:**
`backups/pre-docs-cleanup/Packs Turn Log.txt`, the Sonnet 5 per-pass credits as that instance
originally wrote them, preserved by the first documentation pass and deliberately left in its own
words and its own formatting. It spent one pass unreachable — intact, indexed nowhere, cited by a
sentence that had been deleted. **A pointer is not optional decoration on a preserved artifact. It is
the half that rots.**

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
- **Opus 5** (12 Aug 2026) — the fourth documentation pass, at Trevor's request, ahead of a bug and
  UI session. Two new siblings. **[AI.md](AI.md)** because AI material was living in three files and
  none of them announced it: `ENGINE.md` held the silent-failure surface and the Active-vs-Bench
  scoring-units table, `TOOLING.md` held the two instruments and the ways they lie, and `CLAUDE.md`'s
  Open list held the measurements — so the weight re-tune, which those same documents call the next
  AI job, had to be assembled from three places before it could be started. Neither of the `ENGINE.md`
  sections was about the engine. **[DATA.md](DATA.md)** for the corpus, the set codes and the deck
  spreadsheets, which took the last weight off `CLAUDE.md` and `TOOLING.md` together.

  **The finding I did not expect: the tree had been measured in two different units and nobody knew.**
  The third pass's own commit reports `LAYOUT.md` "ends at 283" — the file is 357 lines by `wc -l`,
  and 283 non-blank. So the file everyone had been protecting as a few lines over target, and around
  which a split proposal had been argued and withdrawn, was 78% over. Neither number was wrong; the
  unit was never stated. Trevor settled it as total lines, and it is now written into
  `MAINTENANCE.md` with the instruction to quote the unit whenever you quote a number. **A figure in
  prose can be wrong in a way that has nothing to do with the figure.**

  Six more defects, none of them subtle once looked at. `PACKS.md` had a **table row stranded outside
  its own table** — two paragraphs inserted into the middle, leaving the `si1` row rendering as a
  one-cell fragment. `TOOLING.md` had **three sections filed at `###` under the AI heading** —
  "What the smoke stub cannot see", "The two things the builder refuses", "Coverage" — 39 lines under
  a parent none of them belongs to, one of which `CLAUDE.md` points at by name. The status table
  **contradicted itself in adjacent rows**, saying "221 of 221 cards" and "All 102 implemented" for a
  Base Set that `selftest.js` calls 95: printings and scriptable cards, stated in the same units. Two
  **line references had rotted** within a job — `engine.js:114` for a function at 126, `ui.js:389` for
  a comment at 459 — so the house style now forbids citing a line number at all; cite the symbol and
  let the reader grep. And the Open list was **numbered 1, 4, 2, 3**, in the section a new session
  reads to find work.

  `LAYOUT.md` took the conservative treatment Trevor chose: 357 → 302, no split. `tools/shot.js` and
  the DEV tab went to `TOOLING.md`, which **reverses an earlier deliberate call** that they belonged
  where they are used — they are instruments, and 44 lines is a lot for a file that cannot afford
  them. Two settled narratives went to `HISTORY.md` with a one-line why left behind. It is still
  over, and it should be: every rule in it was paid for with a wrong version first. The seam that
  remains — sizing versus interaction, about 100 lines that never mention the fitter — is written
  down in `MAINTENANCE.md` as available and *not taken*, because Trevor has seen it twice now and
  not taken it. That is a different thing from nobody having thought of it, and the file should say
  which.

  **The pattern discussion is the part I expect to outlive the pass.** Trevor asked whether the tree
  should go wiki-shaped as it grows — findings in the live files, reasoning behind a link. Yes, with
  one boundary, and the boundary is that the why is usually what makes the rule get obeyed. Three of
  this project's worst incidents were a *confident sentence* rather than a missing one: `LAYOUT.md`
  claiming a dialog had room for `miniCard`, `TOOLING.md` claiming the deck spreadsheet was lost,
  `RULINGS.md` telling a reader to move working code onto an opt-out list. A rule stripped to its
  claim is one more of those waiting to happen — it reads as arbitrary, and arbitrary rules get
  "fixed". So: one line of why, then the link. The test is whether someone about to break the rule
  would be stopped by the sentence that stays.

  `HISTORY.md` is now exempt from the line target alongside `RULINGS.md` and `LOGBOOK.md`. It had to
  be — it is where three of this pass's moves landed, and a rejection cannot be condensed without
  deleting the *why*, which is the whole reason the file exists.

  Left for Trevor rather than decided: **`CLAUDE.md`'s "a blank answer is not a refusal" section is
  not a Shadowless fact.** It describes how his channel fails and how any instance in any project
  should respond to it, and it is sitting in one game's orientation file where only sessions working
  on this game will ever read it. It belongs in the global tree. I did not move it, because that is
  his tree and a cross-project change, not part of the pass he approved.

- **Opus 5** (12 Aug 2026) — a bug and UI pass, five of Trevor's six items. Each shipped with a test
  that was **confirmed to fail without the fix**, which is the only way to know a green suite is
  green for the right reason — and one of those confirmations found a second bug.

  **Editing your theme deck also edited the opponent's**, which Trevor had filed as "pretty sure"
  and was exactly right about, including that it only ever touched the save. The starter deck is
  created under the theme deck's own name, and the lookup took a name alone and preferred the save —
  so from the first edit "Brushfire" meant two lists and the code could not tell them apart. The
  comment sitting directly above the bug said the theme decks stay canonical *so the opponent can
  still field any of them*: the intent was written down and the implementation had never matched it.
  It survived because it is invisible outside a mirror match. `deckFor(name, side)` now requires the
  side, with no default, because a call site that has not decided is a call site with the bug.

  **The deck builder reset its scroll on every click**, which made putting 18 Fire Energy into a deck
  eighteen separate scrolls. `render()` rebuilds the whole DOM, so positions are now harvested before
  the wipe and reapplied after everything is in the document. Deliberately not `querySelectorAll` and
  `data-` attributes: `smoke.js` stubs the DOM and implements neither, and a UI mechanism that cannot
  run in the suite is one with no tests. **Writing the test found that `resetScroll` did nothing at
  all** — every caller resets and then calls `render()`, whose first act was to harvest the position
  straight back off the element about to be destroyed. Harvest now runs before resets are honoured.

  **The flashing prizes gave away a coin flip about two seconds early**, which is Trevor's sharpest
  catch of the set. The board was always frozen behind the coin — that was designed in from the
  start — but `diffForFx()` reads the *real* post-action state and was armed at dispatch time, so
  the prize tile, the KO flash and the hit flash all escaped the freeze. On a flip deciding whether
  something survives, the prizes announced the answer before the coin landed. It now runs when the
  presentation queue empties, in the same frame the board unfreezes.

  **The opening who-goes-first flip is now shown.** It was resolved inside `newGame()` and reported
  only as a line of log text — the one coin in the match the player was told about rather than shown,
  and the one with the largest measured consequence, since the seat is worth about 5.7 points.

  That one is worth recording because **the first version introduced a worse bug than the one it
  fixed**, and only a screenshot caught it. Suppressing the setup sheet so the coin is visible
  exposed the board behind it — and `newGame` auto-sets-up the opponent *before* the flip, so the
  finished build handed you their entire opening position before you chose yours. Every test passed;
  the stub has no layout engine and no concept of an overlay covering something. The fix is to blank
  the opponent's side **in the frozen snapshot**, which is honest rather than a cheat: that view
  exists precisely to show a board that is not the current one, and while the coin is in the air
  their side genuinely is face down. `tools/shot.js` is not optional polish on a UI change. This is
  the third time that sentence has been earned.

  Also 1st Edition retuned 1/25 → 1/20 (Trevor's call), verified at 200,000 packs as 1-in-20.1. It
  sits outside the ~5x per-card ladder on purpose — it dresses a whole pack rather than one card, so
  it is the axis the player experiences as an *event*.

  Left for Trevor: the setup overlay is translucent, so a dimmed opponent Active has always been
  faintly visible behind it. Pre-existing, unrelated to any of this, and a board-adjacent visual
  call rather than mine to make. The energy-discard selection interface is the sixth item and is not
  started — it is a design conversation before it is a build.

- **Opus 5** (12 Aug 2026) — the energy-discard picker, Trevor's sixth item, which turned out to be
  larger and smaller than it looked at once.

  **Smaller, because two of the three sites already had the plumbing and the UI simply never used
  it.** `retreat` has accepted a `pay` list of uids since Job 4; `T_DISCARD_OPP_ENERGY` has accepted
  an `energyIdx`. Nothing was passing them. **Larger, because there were seven sites, not three** —
  Trevor named the ones he could remember and the sweep found Super Potion, Super Energy Removal,
  Wildfire and the attacks that strip the defender. Also a correction to the premise worth recording:
  **retreat was never "order attached"**; `retreatPayOrder` already preferred Energy the Pokémon's
  own attacks did not need. It was the other six that picked by array index.

  Built as one decision point rather than seven fixes — `energyChoices` / `energyChoiceIsReal` /
  `takeEnergy` / `energyPayOrder` — so the player's pick, the AI's and the fallback cannot disagree.
  **The AI needed no change at all**, which is the part I would not have predicted: anything
  supplying no choice gets the pay-order heuristic, which is strictly better than the index 0 six of
  the sites used before. The silent-failure surface in `AI.md` was the thing to worry about here and
  the fallback design walked around it.

  Two option keys named by ROLE and not by site — `costUids` for what leaves your own attacker,
  `energyUids` for what the effect targets — because Super Energy Removal asks twice on opposite
  sides of the board and one list would have to be split by a rule the caller cannot see.

  **The picker lives on the centre line, in the coin's own place, and that was Trevor's call over
  mine.** I had argued for clicking the Energy pips directly, on the standing "actions live where the
  thing they act on is" rule. He pointed out the thing that beats it: a picker that appears wherever
  the action is makes you hunt for it with your eye every time, and a fixed place is learned once.
  He is right, and the centre line has a second advantage neither of us said first — unlike an
  overlay sheet it does **not cover the board**, so you can still see the Pokémon you are choosing
  from. The two are never live together, a coin being presentation and this being an interaction the
  game is waiting on.

  **The ruling underneath it changed a rule.** I asked whether a Double Colorless covers a retreat
  cost of 2 alone; Trevor's answer from the GBC game is that it does not — a retreat cost is paid in
  **cards**, not printed symbols, and a Double Colorless discards as one. That is deliberately not
  the official TCG rule. It removed a special case rather than adding one: the picker had been
  reasoning in symbols and needed bespoke logic to decide whether a DCE beside a basic was a real
  choice, and with retreat measured in cards the generic test is simply correct. A `powertest.js`
  case asserting the old behaviour was **rewritten rather than deleted**, because the pair of tests
  either side of it is now what states the distinction: the same Buzzap'd Electrode still counts two
  symbols toward an *attack* cost and one card toward a *retreat*.

  **Two of my nine new engine tests were green against a build with the choice plumbing torn out**,
  which I only found because I tore it out to check. Both named an Energy the fallback heuristic
  would have picked anyway, so they proved nothing. Rewritten to name the card the fallback would
  refuse — and after that, four of them fail without the fix. Confirming a test fails is not
  ceremony; it is the only thing separating a test from a comment.

  The screenshot earned its keep again, twice: the action bar was still printing "choose a Benched
  Pokemon to bring up" while the bench was long since chosen and the board was asking which Energy
  to spend, and the bench stayed highlighted for a question already answered. Neither is visible to
  a suite that cannot lay anything out.

- **Opus 5 #10** (12 Aug 2026) — two bugs found by Trevor reading his own match logs, plus a correction
  to a ruling I had written down with more authority than it earned.

  **Both Prize piles printed as empty lines**, in a file whose own header promises them as one of
  the three things it exists to show. `startMatchLog` runs inside `newGame()`; Prizes are dealt by
  `beginPlay()`, which does not run until both players have confirmed setup. The capture was simply
  earlier than the thing it captured. **And the opponent's "opening hand" was six cards, not seven**,
  for the mirror-image reason: `newGame()` calls `setupAuto(1)` before the capture, so their Active
  had already left hand. Hands are now captured before setup and Prizes when play begins.

  **The match log had no test coverage at all**, which is exactly why both survived — it is written
  to a file the suite never opened, so every assertion in the project was looking somewhere else.
  Three cases now cover it. Worth generalising: a feature whose output nothing reads is a feature
  with no tests, however green the run is.

  **The damage line counted up while the board counts down.** `(40/40)` on a 40 HP Staryu meant forty
  damage of forty, printed directly above "is Knocked Out!" — it reads as untouched. The board shows
  HP remaining and always has, so the log now does too.

  **The ruling correction is the part worth reading.** Yesterday I recorded "a retreat cost is paid
  in cards" as settled *from the Game Boy game*. Trevor pushed back on my claim that it contradicts
  the TCG rule, and offered his evidence: Charizard's Fire Spin needs two cards discarded, and a
  Double Colorless made Fire by Energy Burn still only counts as one of them. That memory is right —
  and it is about **attack-cost discards**, where the card text says *cards*, counting cards is
  uncontroversial, and our engine already behaved that way. **It does not establish what GBC did for
  a retreat, and neither of us knows.** So the entry now stands on Trevor's actual reason, which is
  a better one: it silently balances Double Colorless, the strongest Energy card in the format, by
  making its two symbols cost the same single card to walk away from.

  The lesson is one `MAINTENANCE.md` already states and I still walked into: a confident, specific,
  actionable citation is worse than none, because the next instance acts on it. I had generalised
  "GBC counts the physical card" from a case about attack costs to a case about retreat, in the same
  paragraph, without noticing they were different mechanisms.

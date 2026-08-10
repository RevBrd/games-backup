# Shadowless — history and quarantine

Two jobs. It records **how the project got here**, and it holds the **reasoning behind ideas that
were tried and dropped** — because a rejection recorded without its reason gets handed back to a
future instance as a fresh suggestion, which has already happened here.

Nothing in this file is needed to work on the game. Read it when an idea below is about to be
proposed again, or when you want to know why something looks the way it does.

Live decisions live in `CLAUDE.md` and `COLLECTION.md`. Card-level judgement calls live in
`RULINGS.md`. This file is the losing side of settled arguments.

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

## Shiny was a sheen twice before it was a palette shift

Settled 9 Aug. Two `mix-blend-mode` sheens were built and both failed:

- **`color-dodge`** blew pale card stock out to unreadable white.
- **`overlay`** was legible but landed with wildly different strength depending on how bright a
  card's art was, so it read as inconsistent rather than as a treatment.

The palette shift that replaced them (`hue-rotate(150deg) saturate(1.35)`) was sitting in the
comparison strip as a *Misprint* flavour, and Trevor picked it out of there. It is the better idea
on its own merits: a shiny Pokémon in the mainline games is a recoloured one, so the treatment means
the same thing the word does, and it shifts differently per card — Charizard cyan, Blastoise
magenta, Fire Energy green — which reads as an alternate colouring rather than a filter laid on top.

**Misprint's third flavour became `invert(1)` in the same swap**, because a palette shift and a hue
rotation could no longer coexist without reading as the same effect.

## Shadowless: the shadow is too quiet on its own

The first proposal was to add a hard offset shadow to every sigil box so that one card in two
hundred could lack it. Rejected: it changes the default look of the whole game to serve a variant
almost nobody sees, and the current cards have a balance worth protecting. The fix was to confine it
— the shadowed art window exists only where a card is shown **as a collectible**, so the board is
untouched and the 8 Aug design lock holds.

Confining it did not solve loudness, and both Trevor and the building instance independently landed
on the same objection: a missing shadow cannot carry a 1-in-200 pull. Trevor's fix (9 Aug) was to
print **"SHADOWLESS" across the Sigil Card's art window**, set in the title screen's face — the
game's own name as the mark. It deliberately carries no `text-shadow`, where `.gametitle` has one as
a joke about the word; the thing the word actually describes should not have one. The watermark is
the announcement, the shadow is the fidelity.

**`inverted` is not dead code.** Shadowless-as-the-default, with the rare pull *adding* a shadow,
was built alongside `shadow` and lost the A/B — real-world scarcity points the other way. Trevor's
call was "back pocket, not discarded", so it stays live in the DEV tab and `smoke.js` covers it.
Do not delete it while tidying.

## Ideas raised and shelved, with the reason

- **A curated escalating alt-art tier** — Trevor's read on TCG Pocket's approach: pick specific
  cards, give them an extra rarer version. Genuinely interesting, and shelved 8 Aug because it does
  not *compose* the way the existing axes do. Each of those is "one flag, roll it against any card,
  done"; this one needs someone to choose and tag specific cards, which is per-card design labour
  rather than a system. Worth a firm yes/no eventually so it stops being a vague someday-idea.
- **Opponent cards getting variant treatment** — wanted, and started deliberately small. Agreed
  8 Aug: roll it live at play time, purely cosmetic, no persistence, same render function on both
  sides of the board. The deeper version — Job 7 named opponents with their own persistent pulled
  collections — stays possible, but only after the lightweight one is proven.
- **Mirror Move reading the game log** — Trevor's instinct, and the right one: the information
  genuinely is already there. Rejected because the log holds *sentences*, so the numbers would have
  to be regex'd back out of prose and a reworded log line would silently break a card.
  `lastAttackResult` is the same idea done as data. See `RULINGS.md`.
- **Reviving `tools/chat-era/`** — see `TOOLING.md`. It looks like a one-line fix and is not.

# Shadowless — where the cards come from

Depth behind the Data section of `CLAUDE.md`. Read this before generating a set, before trusting a
set code, and before adopting one of the spreadsheets in `data/Deck Lists/`.

Split out of `CLAUDE.md` and `TOOLING.md` on 11 Aug 2026. How the generator *runs* is in
[TOOLING.md](TOOLING.md); this file is about the inputs it reads.

The one-line summary: **`data/raw/*.json` is the only source of truth, and nothing in the project is
data-blocked.**

## The corpus

**`data/raw/*.json`** — the `pokemon-tcg-data` corpus, downloaded 4 Aug 2026, 14 sets and 1,251
cards. All 189 Trainers carry rules text, none missing.

The CSVs are an **independent cross-check, not a second source of truth**, and the agreement between
them is what justifies trusting the corpus — `gen_cards.js` reproduced all 102 Base Set cards
byte-identically from each source independently, which is repeatable if anyone ever doubts it. Don't
add to them, and don't generate from them.

## Set codes, and the two that read backwards

`base1` Base · `base2` Jungle · `base3` Fossil · **`base4` Base Set 2 · `base5` Team Rocket** ·
`base6` Legendary Collection · `gym1` Gym Heroes · `gym2` Gym Challenge · `neo1`–`neo4` Neo
Genesis/Discovery/Revelation/Destiny · `basep` promos · `si1` Southern Islands.

**`base4` and `base5` are the wrong way round from what everyone guesses** — this project included
until 11 Aug 2026, `gen_cards.js` among them, which would have shipped 130 Base Set 2 cards in a
pack labelled "Team Rocket". **Check against the data, never against the number:** `base4` is 130
cards with 6 basic Energy and no Dark Pokémon; `base5` is 83 cards, no Energy, 45 of them Dark.

Worth knowing *why* it survived three sets and a documentation pass: the generator refuses to emit a
set it cannot name, and that guard **fires on a missing name, and a wrong one is present**. A guard
against absence is not a guard against error.

## Scope

**Settled: everything in the data, promos and Southern Islands included.** That makes `basep` and
`si1` a pack-table and dex question rather than a scope question — they are odd shapes for boosters,
and `base4`/`base6` are reprint sets that will hand the player cards they already own. See
[PACKS.md](PACKS.md) for where that lands.

## `data/decks.json` is source, not output

The four theme deck lists came from named sheets in a spreadsheet of Trevor's, and **cannot be
rebuilt from the card corpus** — it has no notion of a theme deck. They were extracted verbatim into
`data/decks.json`. Back it up like source, because it is.

The spreadsheet is in the repo at **`data/Deck Lists/Base1 Decks.xlsx`**. Its Brushfire tab matches
`decks.json` entry for entry in the same order, which is what identifies it. It also carries **three
competition-level decks** — Haymaker, Rain Dance, Buzzapdos — which are *not* wanted: Trevor's call,
on the grounds that they would make for a miserable opponent. Don't add them without asking.

`gen_cards.js` fails loudly if `decks.json` references a card outside the generated sets, which is
what stops a careless `--sets` from silently producing decks full of undefined ids.

**The four in play are Trevor's authentic lists, not something a model assembled** — so their
lopsided win rates are probably faithful rather than broken. The figures are in [AI.md](AI.md); ask
before "fixing" them.

## The two workbooks nothing reads yet

`data/Deck Lists/` holds two more, and **both are reference data**:

- **`Jungle Decks.xlsx`** — Water Blast and Power Reserve, the two authentic Jungle theme decks, and
  the valuable one. Converted, corrected and validated into **`data/jungle_decks.json`**; use that
  rather than re-reading the sheet, because it carries three id corrections without which Water
  Blast is an illegal deck. Its `_meta` has the table and the reasoning.
- **`Base4 Decks.xlsx`** — Base Set 2 theme decks (Charmander & Friends, Squirtle & Friends…),
  incomplete. Kept, not converted. Note it is named for the set code, and `base4` is Base Set 2.

**Converting a sheet is not the same as adopting it. Wiring either set of decks into `decks.json`
makes them playable and is a job**, not a maintenance action: deck select, the starter pick and the
balance figures all move.

## `data/gbc_decks.json` — Job 7's groundwork

All 16 GBC opponent decks — eight Club Masters, four Grand Masters and Ronald's four — verified to
exactly 60 cards and mapped to our set IDs, with every out-of-scope card substituted and reasoned in
its own `_meta`. **Nothing reads it yet.** Three decks are flagged for a count re-check before use.

They are GBC1 decks, so they need nothing beyond the three live sets — which also means the ruling
policy's known limit (the GBC game is silent from Team Rocket on) does not bite until after Job 7.

## A confident absence claim is worse than an unknown

`TOOLING.md` said for a week that the theme-deck spreadsheet was lost with the Claude Chat sandbox
and that `decks.json` could not be rebuilt from anything in the repo. It was in the working tree the
whole time. Nobody had looked locally, **because the doc said not to bother.**

That is the same shape as the Packs Turn Log dying of a deleted pointer: preserved material is lost
by the sentence that stops the search, far more often than by deletion. If you are about to write
"X is gone", go and look first.

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
lopsided win rates are probably faithful rather than broken. The figures are in [MEASUREMENT.md](MEASUREMENT.md); ask
before "fixing" them.

## Which deck files the game actually reads

**This is the question to check first, because it has been wrong in this file before.** Until 14 Aug
2026 this section called `gbc_decks.json` unread and `jungle_decks.json` reference-only; Job 7 had
wired both into the live ladder on 12 Aug. A doc that quarantines live data is worse than one that
says nothing, because a session will treat the ladder's own decks as scratch.

`gen_cards.js` reads exactly four files out of `data/` besides the corpus, and the list is in the
source — **grep `readFileSync` in the generator rather than trusting the table below.**

| File | Emitted as | Consumed by |
|---|---|---|
| `decks.json` | `DECKS` | the four playable theme decks. Player-facing; a missing card id is **fatal** |
| `gbc_decks.json` | `OPPONENT_DECKS`, `gbc:` prefix | the ladder roster, `progresstest.js`, `aiduel.js --gbc` |
| `jungle_decks.json` | `OPPONENT_DECKS`, `jungle:` prefix | the Jungle bracket's two authentic challengers |
| `ladder.json` | `LADDER` | `buildLadder()`. See [PROGRESSION.md](PROGRESSION.md) |

**The opponent files fail soft where `decks.json` fails hard.** An opponent deck naming a card outside
the generated sets is dropped with a warning; a player deck doing the same is a fatal error. A player
deck that cannot be built is a broken game, an opponent deck that cannot be built is one rung of a
ladder that backfills itself.

**`gbc_decks.json`** is all 16 GBC1 decks — eight Club Masters, four Grand Masters and Ronald's four —
verified to 60 cards each with the substitutions reasoned in its own `_meta`. #8 researched it, and
**#11 repaired it before Job 7 could use it**: seven decks named `basep` cards against a constraint
that does not hold here, and one deck was flagged as defective in its own notes and turned out not to
be. Do not re-open the three "count re-check" flags that older text mentions — they were resolved.

**`jungle_decks.json`** is Water Blast and Power Reserve, converted from `Jungle Decks.xlsx` with
three id corrections without which Water Blast is an illegal deck. Use the JSON, never the sheet.

## The workbooks and the research pool — reference only

Everything in this section is **quarantined**: real material, ID-mapped in some cases, and read by
nothing. Adopting any of it is a job rather than a maintenance action — deck select, the roster and
the balance figures all move.

**`data/Deck Lists/`** holds the spreadsheets. `Base1 Decks.xlsx` is the source of `decks.json`
(above). `Jungle Decks.xlsx` is the source of `jungle_decks.json`. **`Base4 Decks.xlsx`** is Base
Set 2 theme decks, incomplete, kept and not converted — and note it is named for the set code, so it
is Base Set 2 and not Team Rocket. **`GB2 Opponent Deck Guide (Alamedyang, English-patch names).txt`**
is the find of 14 Aug: a hex-extracted guide to ~90 opponents from *Pokémon Card GB2*, the Japan-only
sequel, saved verbatim. It is the closest thing to a second `gbc_decks.json` source that exists, and
its second half runs on Team Rocket cards in named, personality-forward decks.

**`data/OPPONENT_DECK_POOL.md` is the tracker, and it is the file to open**, not this one, when you
are picking opponents for a set going live. It carries a status per deck, a legend, and the record of
what has been adopted. The five JSON files below are its output, all in the same `[qty, id, name]` /
`subs` shape as `gbc_decks.json` so that adopting one is a wiring change and not a conversion:

| File | Contents |
|---|---|
| `fossil_decks.json` | BodyGuard, LockDown — both pass the real `validateDeck`, since Fossil is live |
| `base4_decks.json` | Grass Chopper, Hot Water, Lightning Bug, Psych Out |
| `team_rocket_decks.json` | Devastation, Trouble |
| `gym_decks.json` | all 8 Gym Leader decks |
| `gbc2_flavor_decks.json` | the 8 GB2-Island flavour decks. Only `allison_psychic_battle` is clean; the other 7 carry `subs` entries needing a real substitution decision |

**One lesson from that research is worth more than the decks and is recorded here so it is not
re-learned.** A fetch through a page summariser gave counts that did not match the itemised lists
under them; `Special:Export` for raw wikitext resolved all sixteen official decks to exactly 60 cards
with zero hand corrections. And **a categorical scan is not a lookup** — checking whether a card name
starts with a known-bad prefix passed a deck that runs 4x Bill's Teleporter, a Neo Genesis card with
no prefix at all. Only a resolver against `data/raw/*.json` caught it. *[Both accounts, in the words
of the instance that hit them →](LOGBOOK.md)*

**`data/DECK_RESEARCH_NOTES.md` is the first draft of all of that and is superseded.** It holds the
same card lists in prose, un-ID-mapped and with its own counts flagged unverified — so it is now the
*less* reliable copy of data that exists as validated JSON. Kept for provenance, moved out of the
working set on 14 Aug 2026 to `backups/deck-research-2026-08-14/`. Read it only if you want to know
where a list came from; never type a card out of it.

## A confident absence claim is worse than an unknown

`TOOLING.md` said for a week that the theme-deck spreadsheet was lost with the Claude Chat sandbox
and that `decks.json` could not be rebuilt from anything in the repo. It was in the working tree the
whole time. Nobody had looked locally, **because the doc said not to bother.**

That is the same shape as the Packs Turn Log dying of a deleted pointer: preserved material is lost
by the sentence that stops the search, far more often than by deletion. If you are about to write
"X is gone", go and look first.

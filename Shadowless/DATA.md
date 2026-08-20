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

**One defect is known, in 1,251 cards, and it is corrected at generation.** The corpus renders Dark
Vileplume's Petal Whirlwind as *"Flip a coins"* — the count dropped — on both `base5-13` and
`base5-30`, which makes the attack unimplementable and shows the player broken English on the card
face. The real card reads **"Flip 3 coins."** `data/raw` is never hand-edited (it is downloaded, and
an edit there dies at the next fetch without a trace); the fix lives in `CORRECTIONS` at the top of
`gen_cards.js`, which asserts the broken text is still present before replacing it, so an upstream
fix fails loudly instead of silently re-applying.

**And the CSV had the same typo, which is the part worth learning from.** The two sources are less
independent than the paragraph below hopes, so their *agreement was not evidence* — it was one error
seen twice. What settled it was a photograph of Trevor's own physical `base5-30`. **When both sources
agree and the text is still nonsense, they are not two sources.**

That same card is also the one genuine same-name-different-mechanics split in the era: **`base5-13`
is Weakness Fire, `base5-30` is Weakness Fighting**, on printings otherwise identical. Both sources
said so, nobody believed it, and the physical card confirms Fighting. They are preserved as separate
behaviours and must never be aliased together. `setsurvey.js` flags this class automatically.

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

## How big is the set you are about to add

**Ask this first, because printings are not jobs.** Job 6's most useful number was the one that
stopped 126 Jungle and Fossil printings being 126 pieces of work: both sets print every Rare twice,
so the real figure was **96 distinct behaviours**. Measured across the rest of the era on 15 Aug 2026.

**The signature is deliberately mechanical** — name, supertype, HP, subtypes, retreat cost, Weakness,
Resistance, and every attack's and Power's *name, damage and cost* — and it **ignores rules-text
wording entirely**, for the reason in the first trap below. Anything matching a live card is an
alias, not a job.

| Set | Scriptable | New behaviours | Powers | Trainers |
|---|---|---|---|---|
| `base4` Base Set 2 | 124 | **0** — 124 aliases | 9 | 23 |
| `si1` Southern Islands | 18 | 18 | 0 | 0 |
| `basep` promos | 53 | 49 | 9 | 4 |
| `base5` Team Rocket | 83 | ~~67~~ **BUILT**, Job 10 | 20 | 11 |
| `base6` Legendary Collection | 110 | **4** — was 20; Team Rocket landing absorbed the rest | 16 | 9 |
| `gym1` Gym Heroes | 126 | 122 | 11 | 35 |
| `gym2` Gym Challenge | 126 | 122 | 13 | 31 |
| `neo1`–`neo4` | 359 | 344 | 72 | 44 |

Read against Jungle + Fossil at 96: Team Rocket was about two-thirds of Job 6 and came in at that;
the two Gym sets
together are **two and a half times** it and are Trainer-heavy, which is where new verbs come from;
and Neo is larger than everything else combined. **Base Set 2 and Legendary Collection are
deprioritised because they are cheap rather than despite it** — see `CLAUDE.md`'s job plan.

**Two traps, and the first one moved two numbers by a factor of two.**

- **WotC reworded card text across printings without changing what it does.** Blastoise's Hydro Pump
  reads "extra Water Energy after the 2nd doesn't count" in Base Set and "you can't add more than 20
  damage in this way" in Base Set 2 — the same cap, and the same script. Mr. Mime's Invisible Wall
  went from "can't be used if Asleep" to "stops working while Asleep". A signature that includes
  rules text calls all of these new cards: it reported Base Set 2 at 16 new and Legendary Collection
  at 48, against the true 0 and 20. **Compare mechanics, never prose.**
- **`base1-73` is "Impost*o*r Professor Oak" and `base4-102` is "Impost*e*r Professor Oak."** One
  letter, and it is the only genuine cross-set spelling variant in all 1,251 cards — checked by edit
  distance across every name pair, so a name-keyed alias table needs exactly this one exception and
  no others. It was the last card standing between "Base Set 2 is pure reprints" and "Base Set 2 has
  one new card," and **Trevor caught it from his own collection**, which is the second time a save
  file has corrected a doc.

The alias machinery this leans on already exists — Job 6c's table, with a test proving it in both
directions, and `selftest.js` asserts every alias points at a mechanically identical card.

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
| `base1_decks.json` | `OPPONENT_DECKS`, `b1:` prefix | the whole Base Set bracket — Trevor's eight, built to the tier spec |
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

**`base1_decks.json` is Trevor's eight Base Set decks, and it is LIVE as of 19 Aug 2026** under the
`b1:` prefix — five T2, two T3 and the T4 that is now Base Set's boss. It was written on 18 Aug and
read by nothing for a day: `decksim.js` and `openercheck.js` opened it by filename, and it was absent
from `OPPONENT_SOURCES`, so every measured claim in [OPPONENTS.md](OPPONENTS.md) and
[ROSTERS.md](ROSTERS.md) was about decks no player could meet. **That is the failure shape to watch
for after any job that ends in a measurement: a thing built, verified, and never plugged in.** Its
`_meta` said so plainly and nothing was reading that either.

**`fullpool.json` is a flat list of card ids across the unbuilt sets and is read by nothing.** It
predates the corpus being the source of truth. Left in place rather than deleted, but do not generate
from it and do not treat it as an inventory — `data/raw/*.json` is the only source.

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

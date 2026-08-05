# Shadowless — the build pipeline

Depth behind the Tooling section of `CLAUDE.md`. Read that first; come here when you are about to
regenerate cards, widen a set, or wonder why a Python script in `tools/chat-era/` won't run.

The shape is: `data/raw/` → `src/cards.js` → `shadowless.html`. Two generators, two test suites, and
a `--check` flag on each generator so drift can't go unnoticed.

## The five commands

```bash
node tools/gen_cards.js                  # data/raw/ -> src/cards.js
node tools/build.js                      # src/  -> shadowless.html
node tools/selftest.js                   # rules + AI regression
node tools/powertest.js                  # Pokemon Power behaviour
node tools/smoke.js shadowless.html      # 44 integration tests against the built file
```

Both generators accept `--check`: regenerate to memory, diff against what's committed, exit non-zero
if they differ. Cheap to run and the fastest way to catch someone having hand-edited a generated file.

## gen_cards.js

Reads `data/raw/*.json` and `data/decks.json`, writes `src/cards.js`. Defaults to Base Set; widen with

```bash
node tools/gen_cards.js --sets base1,base2,base3
```

which is how Job 6 begins. All 14 sets generate cleanly today — 1,251 cards, 189 Trainers, none
missing text — so nothing downstream is data-blocked. Cards come out sorted by set then card number;
the Chat-era file was in deck-discovery order, which was an artifact of how it was built.

Field mapping worth knowing:

- **Types are spelled out upstream** (`"Lightning"`), single letters in the engine (`L`). One map
  covers types, attack costs and retreat costs.
- **Weakness values use U+00D7** upstream (`"×2"`) and must be normalised to ASCII `"x2"` — every
  existing effect script and the damage code expect the ASCII form. *Damage* values keep their `×`,
  because that is what the card face prints and what the UI renders. Getting this backwards is a
  silent, wide-reaching break.
- **Basic Energy states no type anywhere** — not in the CSVs, not upstream. It is derived from the
  card name, `"<Type> Energy"` → letter, covering all nine types.
- **Special Energy needs a hand-authored effect regardless**, so anything unrecognised gets an empty
  `provides` and a warning naming the card. Currently eight: Rainbow ×2, Full Heal ×2, Potion ×2,
  Recycle, Miracle. All eight have full rules text in the corpus, so nothing needs fetching — they
  just need `effects.js` entries when their sets land. An empty `provides` keeps the deck validator
  honest about them meanwhile.
- **`power`** is emitted as data — `{kind, name, text}` — from upstream's `abilities`, filtered to
  `Pokémon Power` and `Poké-Body`. 6 in Base Set, 182 across the era. That says a Power *exists*;
  `effects.js` says what it does.

Upstream also carries `flavorText`, `nationalPokedexNumbers` and card `images` URLs that the
generator currently discards. The first two are wanted by Job 5's dex; the images are a live
question for the visual pass.

## data/decks.json is source, not output

The four theme deck lists came from named sheets in Trevor's `P_TCG_Data.xlsx` and **cannot be
rebuilt from anything in the repo** — the card corpus has no notion of a theme deck. They were
extracted verbatim into `data/decks.json`, which is now their only home. Back it up like source,
because it is.

They are Trevor's authentic Base Set theme decks, not something a model assembled — so their
lopsided win rates are probably faithful rather than broken. Ask before "fixing" them.

`gen_cards.js` fails loudly if `decks.json` references a card outside the generated sets, which is
what stops a careless `--sets` from silently producing decks full of undefined ids.

## The three test suites

They overlap barely at all, and none subsumes the others.

- **`selftest.js`** requires the `src/` modules directly — no browser, no DOM stubs, because the
  engine is DOM-free. Validates the decks, checks card coverage against a pinned list of known-missing
  cards, plays ~100 AI-vs-AI games to completion, and asserts the AI difficulty ladder is ordered.
  Catches rules and AI regressions. Takes a seed-count argument for a deeper pass.
- **`powertest.js`** builds boards by hand — no decks, no setup — fires a Power and asserts the
  exact state change. Half its cases assert that something is **illegal**, which is where these rules
  actually live: Damage Swap refusing a move that would Knock Out the receiver, a Power switched off
  by Sleep, Energy Burn not being offered twice. It also covers AI *usage*, which is not the same
  thing as the Power working: Energy Burn passed every unit test while the AI silently never used it,
  because `bestAttackScore` returns `{score, idx}` and the first scorer compared the objects.
- **`smoke.js`** is the original Chat-era harness, 44 tests, driving the **built** HTML through a
  stubbed DOM and a controllable fake clock. Covers the UI, the Trainer pickers, the coin-flip
  presentation and freeze, the deck-select flow and the card renderer. Catches build and UI
  regressions.

The coverage check in `selftest.js` pins `EXPECTED_UNIMPLEMENTED`, the twelve cards known to be
missing. A card dropping off that list is progress and it says so; a card appearing on it
unexpectedly fails the run. Keep it in step with the corresponding section of `CLAUDE.md`.

## tools/chat-era/ — provenance only

`build.py` and `gen_cards.py` are the originals, superseded by the Node equivalents. **Python is
installed on this machine now, and they still cannot run**, which is worth being clear about because
it looks like it should be a one-line fix:

- `gen_cards.py` reads a clone of the `pokemon-tcg-data` repo from `/tmp/ptcg/*.json` and Trevor's
  `P_TCG_Data.xlsx` from `/mnt/user-data/uploads/`. Both were Claude Chat sandbox paths and neither
  survived the port. The JSON corpus has since been re-downloaded to `data/raw/`, so that half is
  recovered; the spreadsheet has not been, and only the deck lists depended on it.
- It also imports `openpyxl`, which is not installed. One `pip install` away if the spreadsheet ever
  turns up — but `data/decks.json` already holds everything we needed from it.

Keep them. `gen_cards.py` in particular is a clear specification of what the output must look like,
and it is how we know the deck lists came from named spreadsheet sheets. Don't try to revive them —
`tools/gen_cards.js` reads the same corpus and does more.

## How the replacements were verified

Neither Node tool was trusted on inspection:

- **`build.js`** was run against the recovered sources and its output diffed against the artifact as
  it arrived from Chat. Byte-identical, title line aside. That is what established that the recovered
  sources are the real ones and not a stale copy.
- **`gen_cards.js`** was verified twice. First, against the CSVs, it reproduced all 90 pre-existing
  cards exactly, field by field, before being widened to 102. Then, when it was migrated to read the
  upstream corpus instead, the two independent sources were diffed against each other and produced
  **byte-identical output for all 102 Base Set cards**. That agreement is what justifies trusting
  the corpus, and it is repeatable if anyone ever doubts it.

If you change either generator, reproduce the equivalent check rather than eyeballing the diff.

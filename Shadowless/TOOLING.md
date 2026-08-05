# Shadowless — the build pipeline

Depth behind the Tooling section of `CLAUDE.md`. Read that first; come here when you are about to
regenerate cards, widen a set, or wonder why a Python script in `tools/chat-era/` won't run.

The shape is: `data/` → `src/cards.js` → `shadowless.html`. Two generators, two test suites, and a
`--check` flag on each generator so drift can't go unnoticed.

## The four commands

```bash
node tools/gen_cards.js                  # data/ -> src/cards.js
node tools/build.js                      # src/  -> shadowless.html
node tools/selftest.js                   # rules + AI regression
node tools/smoke.js shadowless.html      # 44 integration tests against the built file
```

Both generators accept `--check`: regenerate to memory, diff against what's committed, exit non-zero
if they differ. Cheap to run and the fastest way to catch someone having hand-edited a generated file.

## gen_cards.js

Reads the CSVs and `data/decks.json`, writes `src/cards.js`. Defaults to Base Set; widen with

```bash
node tools/gen_cards.js --sets base1,base2,base3
```

which is how Job 6 begins. Cards come out sorted by set then card number — the Chat-era file was in
deck-discovery order, which was an artifact of how it was built rather than a choice.

**Two things it cannot read straight off the CSV**, both handled explicitly rather than guessed:

- **Basic Energy has a blank `provides`.** The type is implied by the card name, so the generator
  maps `"<Type> Energy"` → type letter. Covers all nine types including Darkness and Metal.
- **Every Special Energy has a `provides` of `"any"`**, which means nothing. Double Colorless is
  special-cased to `CC`; everything else emits an empty `provides` and prints a warning naming the
  cards. That is seven Neo and Team-Rocket-era cards — Rainbow, Full Heal, Potion, Recycle, Miracle,
  Darkness, Metal — each of which has its own rules text and will need a hand-authored entry in
  `effects.js` when its set lands. An empty `provides` keeps the deck validator honest about them
  in the meantime.

`power` is emitted as data — `{kind, name, text}` — for the 6 Base Set cards that have one, and
`null` otherwise. That says a Power *exists*; `effects.js` says what it does.

## data/decks.json is source, not output

The four theme deck lists came from named sheets in Trevor's `P_TCG_Data.xlsx` and **cannot be
rebuilt from the CSVs**. They were extracted verbatim into `data/decks.json`, which is now their
only home. Back it up like source, because it is.

They are Trevor's authentic Base Set theme decks, not something a model assembled — so their
lopsided win rates are probably faithful rather than broken. Ask before "fixing" them.

`gen_cards.js` fails loudly if `decks.json` references a card outside the generated sets, which is
what stops a careless `--sets` from silently producing decks full of undefined ids.

## The two test suites

They overlap barely at all, and neither subsumes the other.

- **`selftest.js`** requires the `src/` modules directly — no browser, no DOM stubs, because the
  engine is DOM-free. Validates the decks, checks card coverage against a pinned list of known-missing
  cards, plays ~100 AI-vs-AI games to completion, and asserts the AI difficulty ladder is ordered.
  Catches rules and AI regressions. Takes a seed-count argument for a deeper pass.
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
  `P_TCG_Data.xlsx` from `/mnt/user-data/uploads/`. Both were Claude Chat sandbox paths. Neither
  survived the port, and the spreadsheet has not been recovered.
- It also imports `openpyxl`, which is not installed. If the spreadsheet ever turns up, that is one
  `pip install` away — but the JSON corpus would still be missing.

Keep them. `gen_cards.py` in particular is a clear specification of what the output must look like,
and it is how we know the deck lists came from named spreadsheet sheets. Don't try to revive them.

## How the replacements were verified

Neither Node tool was trusted on inspection:

- **`build.js`** was run against the recovered sources and its output diffed against the artifact as
  it arrived from Chat. Byte-identical, title line aside. That is what established that the recovered
  sources are the real ones and not a stale copy.
- **`gen_cards.js`** was run with the pre-existing card set and every one of the 90 cards compared
  field by field against the old `CARD_DB`. All 90 reproduced exactly, and only then was it widened
  to emit all 102.

If you change either generator, reproduce the equivalent check rather than eyeballing the diff.

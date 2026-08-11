# Shadowless — the build pipeline

Depth behind the Tooling section of `CLAUDE.md`. Read that first; come here when you are about to
regenerate cards, widen a set, or wonder why a Python script in `tools/chat-era/` won't run.

The shape is: `data/raw/` → `src/cards.js` → `shadowless.html`. Two generators, five test suites, and
a `--check` flag on each generator so drift can't go unnoticed.

The command list is in `CLAUDE.md`. Two things about it that live here:

`tools/shot.js` screenshots the built game at an exact viewport using the locally installed Chrome.
It is a looking-at-it tool rather than a build step, so it is documented where it gets used:
**[LAYOUT.md](LAYOUT.md)**.

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

- **`dex` and `flavor`** come from upstream's `nationalPokedexNumbers` and `flavorText`, added for
  Job 5's dex. The Pokédex number is an array upstream and is exactly one entry on every card that
  has one, so it is flattened to a scalar. 191 cards carry no flavour text at all (mostly Neo
  holos), so the dex must render without it rather than assume it.

Card `images` URLs are read by `tools/fetch_art.js` rather than by the generator. Where the scans
do and do not appear is a standing design decision in `CLAUDE.md`.

## data/decks.json is source, not output

The four theme deck lists came from named sheets in Trevor's `P_TCG_Data.xlsx` and **cannot be
rebuilt from anything in the repo** — the card corpus has no notion of a theme deck. They were
extracted verbatim into `data/decks.json`, which is now their only home. Back it up like source,
because it is.

They are Trevor's authentic Base Set theme decks, not something a model assembled — so their
lopsided win rates are probably faithful rather than broken. Ask before "fixing" them.

`gen_cards.js` fails loudly if `decks.json` references a card outside the generated sets, which is
what stops a careless `--sets` from silently producing decks full of undefined ids.

## The five test suites

**None of them subsumes the others**, and they overlap barely at all. Run all five before calling
anything done.

- **`selftest.js`** requires the `src/` modules directly — no browser, no DOM stubs, because the
  engine is DOM-free. Validates the decks, checks card coverage, plays ~100 AI-vs-AI games to
  completion, and asserts the AI difficulty ladder is ordered. Catches rules and AI regressions.
  Takes a seed-count argument for a deeper pass.
  It also carries the **AI verb coverage** check, which scans source rather than playing anything:
  every verb in `effects.js` must be scored by `ai.js` or sit on `UNSCORED_ON_PURPOSE`. That list is
  the deliverable — a verb on it is a decision, a verb missing from it is an oversight, and before
  this check the two were indistinguishable. See [ENGINE.md](ENGINE.md).
- **`powertest.js`** (102 tests) builds boards by hand — no decks, no setup — fires a Power and
  asserts the exact state change. Half its cases assert that something is **illegal**, which is
  where these rules actually live. It also covers AI *usage*, which is not the same thing as the
  Power working. See [ENGINE.md](ENGINE.md).
  Its **AI verb scoring** section exists because of a measured blind spot: eleven verbs were
  reaching `ai.js` with no case and scoring as plain base damage, and *none of the eleven appears in
  a theme deck*, so 480 full `selftest.js` games produced byte-identical output before and after the
  fix. This is the only suite that can see them, for the same reason it is the only one that can see
  a Power. Those cases assert `rawOutcomes()` — the raw distribution, before weights — so retuning a
  weight cannot fail them for the wrong reason.
- **`smoke.js`** (108 tests) is the original Chat-era harness, driving the **built** HTML through a
  stubbed DOM and a controllable fake clock. Covers the UI, the Trainer pickers, the coin-flip
  presentation and freeze, the deck-select flow, the collection screens and the card renderer.
  Catches build and UI regressions — but it has no layout engine, so a green run proves nothing
  visual. `tools/shot.js` is the only test for that class of bug.
- **`collectiontest.js`** (105 tests) drives `src/collection.js`, which is pure data. It **stubs
  `localStorage` rather than skipping persistence**, because "does a save survive a round trip" is
  the whole point and testing everything except that would be testing the easy half. Its sharper
  cases are the failures — see [COLLECTION.md](COLLECTION.md).
- **`packtest.js`** (57 tests) opens 200,000 packs against a fixed seed and checks every row of the
  odds table in [PACKS.md](PACKS.md). Deterministic, so it cannot flake; the tolerances are sized to
  catch a wrong denominator, not to absorb noise. **It takes a count** — `node tools/packtest.js
  20000` is a fast pass while iterating. It also prints, without asserting, how many packs it takes
  to finish a set. That number is the one the economy turns on and nothing else computes it.

### What the smoke stub cannot see

A green `smoke.js` run proves nothing visual, and the gap is not theoretical — two bugs got through
68 passing tests in one session, both found by `tools/shot.js` in a single screenshot each:

- **`node.children` is an HTMLCollection in Chrome and a plain Array in the stub.** `.filter`,
  `.some` and `.map` on it pass every test and throw in the browser. Walk children with an index
  loop. This one silently deleted the pull-detail overlay while the screen behind it rendered fine.
- **`line-height` inherits.** `.vfx` had `line-height:0` — correct for an inline-block wrapping a
  bare image, catastrophic once the same host also wrapped a card full of text. Every line
  collapsed, the type chip became a 2px dash, and the card lost 90px of height.

When a screenshot looks subtly wrong, **measure it rather than squinting** — inject a snippet that
writes `offsetHeight`/`getComputedStyle` into the page and screenshot *that*. It turns "something
looks off" into `lineHeight=0px` immediately.

### The two things the builder refuses

**A module's CommonJS export must be ONE line.** `build.js` strips it with a line-anchored regex, so
a wrapped export list leaves its own body in the bundle and dies as `Unexpected token '}'` thousands
of lines into the generated HTML. The builder now refuses to build that, naming the file and line —
but the convention is why, and the tail of `collection.js` is the ugly worked example.

**No NUL bytes in any source file.** One shipped, inside a string literal in `ui.js`, from a mangled
edit. Every suite passed, because a NUL is a valid string character, and the only symptom was `grep`
declaring the file binary. Editors hide them. The fix is to retype the literal, not to work around it.

### Coverage

The check in `selftest.js` pins `EXPECTED_UNIMPLEMENTED`. **It is empty, because Base Set
is complete** — every card has an effect script. A card appearing on that list unexpectedly fails
the run, which is what keeps the card counts in `CLAUDE.md` honest. When Job 6 lands Jungle and
Fossil, expect it to hold the not-yet-scripted cards until they are done.

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

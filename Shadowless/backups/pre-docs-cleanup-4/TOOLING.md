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

which is what the three live sets are generated with today. All 14 sets generate cleanly — 1,251
cards, 189 Trainers, none missing text — so nothing downstream is data-blocked. Cards come out
sorted by set then card number; the Chat-era file was in deck-discovery order, which was an artifact
of how it was built.

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

## Adding a set

Written after Job 6c, where generating two sets broke six things that had quietly
assumed Base Set was the only one. Most of that is now bracketed — `SET_LIVE`, `LIVE_DB`,
memoised pools, a set-scoped `packsToComplete`, and a `--check` that reads the committed
`SET_INFO` all generalise to any number of sets. **Three things still need a human.**

1. **A display name in `SET_INFO`** (`tools/gen_cards.js`). All fourteen are already there;
   the generator refuses to emit a set it cannot name, so this fails loud rather than
   shipping a pack called `neo3`.
2. **An `ENERGY_GRANT` entry, or deliberately none.** No entry means the set guarantees no
   basic Energy, which is correct from the fourth set on and is the reason the table stops at
   three. See [PACKS.md](PACKS.md).
3. **`REMAINING` in `selftest.js`**, while the set is being written. Forgetting it is safe:
   the live-set assertion fires immediately and names the set, because a set with gaps and
   no `REMAINING` entry is by definition a live set with a hole in it.

Then the order is fixed, and it is the reverse of what feels natural:

```bash
node tools/gen_cards.js --sets base1,base2,base3   # 1. generate — the cards exist but are not live
#    2. write effects.js entries until selftest's per-set count reaches 0
node tools/fetch_art.js base2                      # 3. BEFORE the set goes live, not after
#    4. drop the set from REMAINING; it goes live by itself
```

**Step 3 is the one with no safety net.** Card art is derived and gitignored, the suites
never touch the filesystem, and `smoke.js` has no layout engine — so a set going live with
no scans shows the player a grid of broken images with every test green. `selftest.js` now
prints an `ART MISSING` warning for any live set whose asset folder is short, but it is a
warning and not a failure, because a fresh clone legitimately has none of it.

## data/decks.json is source, not output

The four theme deck lists came from named sheets in a spreadsheet of Trevor's, and **cannot be
rebuilt from the card corpus** — it has no notion of a theme deck. They were extracted verbatim into
`data/decks.json`. Back it up like source, because it is.

**The spreadsheet was recovered on 11 Aug 2026 and is now in the repo**, at
`data/Deck Lists/Base1 Decks.xlsx`. This file said for a week that it was lost with the Chat sandbox;
it had simply never been looked for in the working tree. Its Brushfire tab matches `decks.json`
entry for entry in the same order, which is what identifies it. It also carries **three
competition-level decks** — Haymaker, Rain Dance, Buzzapdos — which are *not* wanted: Trevor's call,
on the grounds that they would make for a miserable opponent. Don't add them without asking.

`data/Deck Lists/` holds two more workbooks, and **both are reference data that nothing reads yet**:

- **`Jungle Decks.xlsx`** — Water Blast and Power Reserve, the two authentic Jungle theme decks, and
  the valuable one. Converted, corrected and validated into **`data/jungle_decks.json`**; use that
  rather than re-reading the sheet, because it carries three id corrections without which Water
  Blast is an illegal deck. Its `_meta` has the table and the reasoning.
- **`Base4 Decks.xlsx`** — Base Set 2 theme decks (Charmander & Friends, Squirtle & Friends…),
  incomplete. Kept, not converted. Note it is named for the set code, and **`base4` is Base Set 2,
  not Team Rocket** — see `CLAUDE.md`.

Converting a sheet is not the same as adopting it. **Wiring either set of decks into `decks.json`
makes them playable and is a job**, not a maintenance action: deck select, the starter pick and the
balance figures all move.

The four in play are Trevor's authentic Base Set theme decks, not something a model assembled — so
their lopsided win rates are probably faithful rather than broken. Ask before "fixing" them.

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
- **`powertest.js`** (139 tests) builds boards by hand — no decks, no setup — fires a Power and
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

## The two AI instruments — measuring "well", not "correct"

`selftest.js` proves the AI is *correct* and that the difficulty ladder is ordered. Neither it nor
any other suite can tell you whether the bot plays **well**, which is a different question and the
one that matters for a quality pass. Two tools answer it, and **neither is pass/fail**.

- **`tools/aitest.js`** counts specific decisions across a few hundred games: retreats that cost the
  turn's attack, retreats with nothing threatening the Active, Energy attached to an Active that
  dies before spending it, healing poured into a barely-scratched Pokemon. Every counter is a
  *suspicion*, not a bug — each of those is occasionally the right play. **Read the rates, compare
  two runs, and never judge a single one.**
- **`tools/aiduel.js`** seats the working-tree AI against a committed one and returns a win rate with
  a confidence interval. This is the only tool that answers "is it better than it was an hour ago".

```bash
node tools/aitest.js 6                  # behaviour counts
node tools/aiduel.js 8                  # vs HEAD
node tools/aiduel.js 8 HEAD --control   # baseline vs ITSELF — run this too
```

### Three ways this measurement lies, all of them paid for

**Never read selftest's win rates as AI quality.** Both seats run the same AI there, so seat 0's
figure measures first-player advantage and drifts several points from any change that alters game
length. It moved 54% → 51% on a change the duel then proved was a *gain*.

**Always run `--control` before believing a duel.** It seats the baseline against itself, so the
answer must be 50%. The first version of `aiduel.js` alternated seats by seed (`newSeat = i % 2`),
which correlated the seat with a deterministic opening coin flip — and the control came back at
**55.7%**. It had been reporting a six-point edge for a change that did not exist. Every seed is now
played **twice, mirrored**, so the bias cancels exactly instead of on average, and the control reads
50.0% by construction. A harness that agrees with you is worth nothing until it has disagreed with
you once.

**Check the game you are measuring is the game that exists.** Every harness in this repo drove
setup as `setupAuto(0); setupConfirm(0); setupAuto(1); setupConfirm(1)` — and `setupAuto` ends by
calling `setupConfirm`, so the fourth call re-ran `beginPlay()` and dealt a second set of Prizes.
**Every scripted game from Job 4 to 11 Aug 2026 ran at 12 Prizes instead of 6.** Nothing failed;
the games were simply twice as long, and the deck balance table reversed when it was fixed — Zap
went from worst at 22% to second at 53%. A/B comparisons survived it, because both sides played the
same wrong game, but every absolute figure taken before the fix is void. **Print the opening
position once in a while and look at it.** This was found by reading a match log, not by a test.

**A duel cannot see a rare catastrophic error, and those are the ones that matter to a human.** The
bot used to decline game-winning attacks — 35 times in 96 games, measured. Fixing it moved the duel
by nothing at all (49.8% ± 3.9), because the position is uncommon and *both sides of an AI-vs-AI game
share the fault*, so it cancels. A player who watches it happen once never trusts the opponent again.
**When a fault is rare, symmetric, or about what the AI can perceive rather than how it scores,
assert it in `powertest.js` and count it in `aitest.js` — do not ask the duel.** The duel measures
average strength and nothing else.

**The per-deck table is not a per-deck verdict.** The four theme decks are not balanced against each
other, so the deck rows show deck strength, not AI quality. Zap sits at 25% in the control because
Zap is a 25% deck. Reading its 39% in a duel as a *regression* sent one session chasing a phantom
and "fixing" it — compare each row against the control's row, never against 50.

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

The check in `selftest.js` reports **221 of 221 scriptable cards implemented**, per set, with each
set's live/in-progress state beside it. A card missing a script fails the run if its set is live,
which is what keeps the counts in `CLAUDE.md` honest.

**A set being written carries a `REMAINING` entry and the run stays green while it shrinks** — that
is how Job 6 was worked, one sub-job at a time, and it is the mechanism to use for the next set
rather than a long red suite. Drop the entry when the count reaches zero and the set goes live by
itself. The suite also asserts **no in-progress set went backwards**, so a script deleted by a bad
merge is caught the same way a missing one is.

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

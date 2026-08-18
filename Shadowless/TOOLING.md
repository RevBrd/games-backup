# Shadowless — the build pipeline and the tools

Depth behind the Tooling section of `CLAUDE.md`. Read that first; come here when you are about to
regenerate cards, widen a set, look at the board, or wonder what a suite actually covers.

The shape is: `data/raw/` → `src/cards.js` → `shadowless.html`. Two generators, six test suites, a
screenshotter and an art fetcher; the command list is in `CLAUDE.md`. Two neighbours own the parts that are not build
steps — **what the inputs are** is in [DATA.md](DATA.md), and **the three instruments that measure
whether a change worked** are in [MEASUREMENT.md](MEASUREMENT.md). The suites here are pass/fail;
those three are not, and neither kind substitutes for the other. In particular **no suite in this
file can tell you that a rules change did anything at all** — that is `abtest.js`, and the reason it
exists is that `selftest.js` reported byte-identical win rates for a ruling reversal that altered a
quarter of ladder games.

Both generators accept `--check`: regenerate to memory, diff against what's committed, exit non-zero
if they differ. Cheap to run and the fastest way to catch someone having hand-edited a generated file.

## setsurvey.js — ask this before planning a set

`node tools/setsurvey.js <setcode>`, and `--novel` to dump every unmatched attack in full. It reads
the **raw corpus**, so it works on a set that has not been generated, which is the point: the number
is available before the job is committed to rather than discovered inside it.

It reports distinct behaviours against printings, then splits the attacks three ways — plain damage,
**rules text already implemented verbatim**, and novel — and buckets the novel ones by machinery. The
reuse figure is a **lower bound by construction**: matching is exact, so a card differing by a comma
reads as novel and turns out free. That is the safe direction for a number a job is planned against.

**Its control is the live sets.** `base1`, `base2` and `base3` must each report **0 novel**, because
every card in them is implemented — if they do not, the reuse detection is broken and every figure it
prints for an unbuilt set is too high. Run one of them alongside whatever you are surveying.

It also flags **same name, different mechanics** inside a set, which is either a real printing
variation or a corpus error and needs a human either way. It found one on its first run: Team
Rocket's two Dark Vileplume differ in **Weakness** — `base5-13` Fire, `base5-30` Fighting — and
`data/wotc_pokemon.csv`, the independent cross-check, agrees. So it is preserved, not aliased. Do not
"tidy" those two together.

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

**If you change either generator, reproduce its verification rather than eyeballing the diff.**
Neither Node tool was trusted on inspection — `build.js` was diffed byte-for-byte against the
artifact as it arrived from Chat, and `gen_cards.js` was checked against two independent sources
that agreed exactly. The accounts are in [HISTORY.md](HISTORY.md).

## Adding a set

**Ask how big it is first, because printings are not jobs** — Jungle and Fossil were 126 printings
and 96 distinct behaviours, and the same measurement exists for every remaining set. *[The table, the
signature it was measured with, and the two traps in it →](DATA.md)*

Written after Job 6c, where generating two sets broke six things that had quietly
assumed Base Set was the only one. Most of that is now bracketed — `SET_LIVE`, `LIVE_DB`,
memoised pools, a set-scoped `packsToComplete`, and a `--check` that reads the committed
`SET_INFO` all generalise to any number of sets. **Three things still need a human.**

1. **A display name in `SET_INFO`** (`tools/gen_cards.js`). All fourteen are already there;
   the generator refuses to emit a set it cannot name, so this fails loud rather than
   shipping a pack called `neo3`. Note what that guard cannot catch: a name that is *present and
   wrong*, which is exactly how `base4` and `base5` stayed swapped for three sets. See
   [DATA.md](DATA.md).
2. **Nothing, usually — `ENERGY_FLOOR` is base1's alone.** A new set needs no entry: if it prints
   basic Energy it draws its own, and if it prints none it borrows base1's into its Common pool
   under base1's ids. Either way `ENERGY_CAP` holds it to two. An entry is only for a set you want
   to *guarantee* Energy from, which so far is Base Set and the early-game pacing it carries. This
   step used to read "an `ENERGY_GRANT` entry, or deliberately none" and described a stipend
   mechanism that no longer exists. See [PACKS.md](PACKS.md).
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

**Step 3 is the one with no safety net.** Card art is derived and gitignored and no suite touches the
filesystem, so a set going live with no scans shows the player a grid of broken images with every
test green. `selftest.js` prints an `ART MISSING` warning for any live set whose asset folder is
short — a warning and not a failure, because a fresh clone legitimately has none of it.

## The six test suites

**None of them subsumes the others**, and they overlap barely at all. Run all six before calling
anything done. **The counts below rot** — they are here to say roughly how heavy each suite is, not
as a figure to quote. Run the suite for the real number.

- **`selftest.js`** requires the `src/` modules directly — no browser, no DOM stubs, because the
  engine is DOM-free. Validates the decks, checks card coverage, plays ~100 AI-vs-AI games to
  completion, and asserts the AI difficulty ladder is ordered. Catches rules and AI regressions.
  Takes a seed-count argument for a deeper pass.
  It also carries the **AI verb coverage** check, which scans source rather than playing anything:
  every verb in `effects.js` must be scored by `ai.js` or sit on `UNSCORED_ON_PURPOSE`. That opt-out
  list is the deliverable, and *[why an unscored verb is invisible to everything else →](AI.md)*
- **`powertest.js`** builds boards by hand — no decks, no setup — fires a Power and
  asserts the exact state change. Half its cases assert that something is **illegal**, which is
  where these rules actually live. It also covers AI *usage*, which is not the same thing as the
  Power working. See [ENGINE.md](ENGINE.md).
  Its **AI verb scoring** section is the only place eleven unscored verbs could ever have been seen,
  for the same reason it is the only suite that can see a Power. Those cases assert `rawOutcomes()`
  — the raw distribution, before weights — so retuning a weight cannot fail them for the wrong
  reason. *[The blind spot they were built for →](MEASUREMENT.md)*
- **`smoke.js`** is the original Chat-era harness, driving the **built** HTML through a
  stubbed DOM and a controllable fake clock. Covers the UI, the Trainer pickers, the coin-flip
  presentation and freeze, the deck-select flow, the collection screens, the ladder and the card
  renderer. Catches build and UI regressions — but it has no layout engine, so a green run proves
  nothing visual. `tools/shot.js` is the only test for that class of bug, and Job 7b is the sharpest
  example yet: **four layout defects were live while every one of these passed** (136 of them, then). See
  [PROGRESSION.md](PROGRESSION.md).
  **It declares free play once, at the top.** Almost every test in it drives a match by setting
  `UI.myDeck` and `UI.foeDeck`, which is free play's contract — on the ladder the opponent's deck
  comes off the roster entry and `UI.foeDeck` is ignored. Without that declaration those tests
  quietly stop testing what they say they test.
- **`collectiontest.js`** drives `src/collection.js`, which is pure data. It **stubs
  `localStorage` rather than skipping persistence**, because "does a save survive a round trip" is
  the whole point and testing everything except that would be testing the easy half. Its sharper
  cases are the failures — see [COLLECTION.md](COLLECTION.md).
- **`progresstest.js`** drives `src/progress.js`, which is pure data, against the real
  card database. Two kinds of case matter here and neither is obvious. It asserts the ladder is
  **derived** — passing an unlive set code into the live list must produce a working generated
  bracket — and it asserts every authored opponent fields a **legal 60-card deck** through the real
  `validateDeck`, which is what stops a roster entry rotting silently when a set is regenerated.
  See [PROGRESSION.md](PROGRESSION.md).
- **`packtest.js`** opens 200,000 packs against a fixed seed and checks every row of the
  odds table in [PACKS.md](PACKS.md). Deterministic, so it cannot flake; the tolerances are sized to
  catch a wrong denominator, not to absorb noise. **It takes a count** — `node tools/packtest.js
  20000` is a fast pass while iterating. It also prints, without asserting, how many packs it takes
  to finish a set. That number is the one the economy turns on and nothing else computes it.

## Looking at it: `tools/shot.js`

You do not have to guess and you do not have to ask for a screenshot.

```bash
node tools/shot.js out.png --size 1366x768 --board --seed 4242 --turns 4
node tools/shot.js out.png --size 1915x863 --board --js "UI.devTab='dev'; render()"
```

It drives the locally installed Chrome headless against the built file. `--board` skips the title
screen and deals a real game; `--turns N` lets the AI play N plies synchronously so the shot is of
a board with something on it; `--js` runs anything you like in the page first. Chrome cannot be
handed a script on the command line, so the tool copies the built HTML **beside itself** — the card
scans load from a relative path, and a copy in the system temp folder would show a board with every
face missing and look like a regression.

Two things about it that will bite otherwise:

- **`--window-size` is not the viewport.** Headless Chrome reserves a virtual frame and a scrollbar
  gutter, so asking for `1366x768` lays the page out at **1348x672** — 96px short, which is more
  than the whole action bar. The tool measures the offset every run (via a `--dump-dom` probe) and
  corrects the window so `--size` really is the viewport. Do not replace that with a constant.
- **The PNG is stretched.** The image comes out at the *window* size while the page was laid out at
  the *viewport* size, and the frame is 96px tall against an 18px gutter, so the bitmap is stretched
  about 1.13x vertically and 1.01x horizontally. Fine for "is the text clipped", wrong for "is that
  gap too big". The tool prints the skew. **Judge proportion from the DEV tab, not off the PNG.**

## Reading it: the DEV tab

The DEV tab's Viewport panel prints the page size, the device pixels, the display scaling, and then
what the fitter actually did with all of it — the applied zoom, which layout was chosen, the board
column's size, the mat cloth's width and whether it got the height it wanted, and the desk showing
between the mat and the hand.

Those bottom lines are filled by `writeViewportDump()`, which `render()` calls **after**
`chooseLayout()` and `layoutHand()`. It has to: `renderDev()` runs while the rail is still being
built, so the board column it wants to measure is not in the document yet and every size reads 0.
That is not a hypothetical — it shipped that way for one build and reported a confident row of
zeroes.

The "spare desk" figure measures `handpanel.offsetTop` against the mat's bottom rather than
subtracting heights, because the gap is made by the hand panel's `margin-top:auto` and therefore
lives *inside* `scrollHeight` where a height subtraction cannot see it.

What both of these are *for* — the rules they exist to check — is [LAYOUT.md](LAYOUT.md).

## What the smoke stub cannot see

A green `smoke.js` run proves nothing visual, and the gap is not theoretical — two bugs got through
68 passing tests in one session, both found by `tools/shot.js` in a single screenshot each:

- **`node.children` is an HTMLCollection in Chrome and a plain Array in the stub.** `.filter`,
  `.some` and `.map` on it pass every test and throw in the browser. Walk children with an index
  loop. This one silently deleted the pull-detail overlay while the screen behind it rendered fine.
- **`line-height` inherits.** `.vfx` had `line-height:0` — correct for an inline-block wrapping a
  bare image, catastrophic once the same host also wrapped a card full of text. Every line
  collapsed, the type chip became a 2px dash, and the card lost 90px of height.
- **`position:absolute` with no positioned ancestor escapes to the page.** The variant markings were
  wired into the in-play card faces with **204 tests passing**, and the first screenshot showed a
  SHADOWLESS watermark painted across the middle of the board and a stray 1st Edition stamp beside
  the End Turn button. Two causes, both invisible to a stub: `.sigil` had `overflow:hidden` but not
  `position:relative`, and `sigilOf` searched direct children only, so on the Active card it found
  nothing and the caller appended the mark to the card root. **A stubbed DOM has no cascade and no
  containing blocks, so it cannot see where an absolutely-positioned child actually lands.**

When a screenshot looks subtly wrong, **measure it rather than squinting** — inject a snippet that
writes `offsetHeight`/`getComputedStyle` into the page and screenshot *that*. It turns "something
looks off" into `lineHeight=0px` immediately.

## The two things the builder refuses

**A module's CommonJS export must be ONE line.** `build.js` strips it with a line-anchored regex, so
a wrapped export list leaves its own body in the bundle and dies as `Unexpected token '}'` thousands
of lines into the generated HTML. The builder now refuses to build that, naming the file and line —
but the convention is why, and the tail of `collection.js` is the ugly worked example.

**No NUL bytes in any source file.** One shipped, inside a string literal in `ui.js`, from a mangled
edit. Every suite passed, because a NUL is a valid string character, and the only symptom was `grep`
declaring the file binary. Editors hide them. The fix is to retype the literal, not to work around it.

## Coverage

The check in `selftest.js` reports **221 of 221 scriptable cards implemented**, per set, with each
set's live/in-progress state beside it. A card missing a script fails the run if its set is live,
which is what keeps the counts in `CLAUDE.md` honest.

**A set being written carries a `REMAINING` entry and the run stays green while it shrinks** — that
is how Job 6 was worked, one sub-job at a time, and it is the mechanism to use for the next set
rather than a long red suite. The suite also asserts **no in-progress set went backwards**, so a
script deleted by a bad merge is caught the same way a missing one is.

## tools/chat-era/

`build.py` and `gen_cards.py` are the originals, superseded by the Node equivalents. **Keep them, and
don't try to revive them** — it looks like a one-line fix and is not, for reasons in
[HISTORY.md](HISTORY.md).

## `openercheck.js` — the opening Active, measured

**Not pass/fail.** `setupAuto` in `engine.js` picks the opening Active by one line — highest HP among
the Basics in hand — and `ai.js` is never consulted. This deals hands against real deck lists and
reports how often that strands an evolution-line starter in the Active spot while a standalone Basic
sat in the same hand, which is the case the HP rule structurally cannot see.

```bash
node tools/openercheck.js                          # data/base1_decks.json, 6000 hands per deck
node tools/openercheck.js data/jungle_decks.json   # any file in the *_decks.json shape
```

Deterministic seed, so the figure is reproducible run to run and a change to the rule can be measured
against it. It reads the deck JSON rather than the engine, so it works on quarantined deck files that
nothing else has wired up yet. The standing figure and what to do about it are in [AI.md](AI.md).


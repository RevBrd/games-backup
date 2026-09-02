# Shadowless — the build pipeline and the suites

Depth behind the Tooling section of `CLAUDE.md`. Read that first; come here when you are about to
regenerate cards, widen a set, or wonder what a suite actually covers.

The shape is: `data/raw/` → `src/cards.js` → `shadowless.html`. Two generators, six test suites and
an art fetcher; the command list is in `CLAUDE.md`. **`node tools/test.js` runs the whole gate** —
both generator `--check`s and all six suites, in the order they have to run in. **Three neighbours
own the parts that are not build steps**, and the split between them is what the tool *returns*:

| | Owns | Returns |
|---|---|---|
| this file | the generators, the gate and the six suites | **pass / fail** |
| [MEASUREMENT.md](MEASUREMENT.md) | whether the change made it *better* | a rate, with an interval |
| [INSPECTION.md](INSPECTION.md) | `shot.js`, `probe.js`, the DEV tab — what it *looks* like | a picture, or a row that moved |
| [DATA.md](DATA.md) | what the inputs are | — |

Neither kind substitutes for the other, and mixing them is how a measurement gets quoted as a
verdict. In particular **no suite in this file can tell you that a rules change did anything at
all** — that is `abtest.js`, and the reason it exists is that `selftest.js` reported byte-identical
win rates for a ruling reversal that altered a quarter of ladder games.

Both generators accept `--check`: regenerate to memory, diff against what is committed, exit non-zero
if they differ. Cheap to run and the fastest way to catch someone having hand-edited a generated file.

## shapecount.js — ask this before choosing a SHAPE

`node tools/shapecount.js "<regex>"`, with `--attacks` / `--trainers` to search elsewhere than
ability text and `--texts` to dump the distinct wordings.

**It is not `setsurvey` with a different flag**, and the two get confused because both print
counts. This one looks *across* all fourteen sets and asks how often a shape recurs — the question
that decides whether the thing in front of you gets machinery or a special case.
*[The three-way table, `selftest` included →](ENGINE.md)*

**Read the DISTINCT-TEXT count, not the printing count.** Written during Job 10c, where it decided the
whole design in two minutes: 20 printings and fifteen distinct texts for "when you play this from your
hand" means the trigger takes a verb list; three printings and two behaviours for "when this is
Knocked Out" means generalising it would be waste. Opposite answers in the same job.

**And read the hits, not only the number.** A bare "is Knocked Out" also catches Strikes Back's
parenthetical, which is a card that answers damage rather than one that triggers on dying. The tool
starts the thinking.

## setsurvey.js — ask this before planning a set

`node tools/setsurvey.js <setcode>`, and `--novel` to dump every unmatched attack in full. It reads
the **raw corpus**, so it works on a set that has not been generated, which is the point: the number
is available before the job is committed to rather than discovered inside it.

It reports distinct behaviours against printings, then splits the attacks three ways — plain damage,
**rules text already implemented verbatim**, and novel — and buckets the novel ones by machinery. The
reuse figure is a **lower bound by construction**: matching is exact, so a card differing by a comma
reads as novel and turns out free. That is the safe direction for a number a job is planned against.

**Its control is the live sets.** `base1`, `base2`, `base3` and `base5` must each report **0 novel**, because
every card in them is implemented — if they do not, the reuse detection is broken and every figure it
prints for an unbuilt set is too high. Run one of them alongside whatever you are surveying.

It also flags **same name, different mechanics** inside a set, which is either a real printing
variation or a corpus error and needs a human either way. It found the era's one genuine case on its
first run — Team Rocket's two Dark Vileplume, which differ in Weakness and **must never be aliased
together**. *[Both sources, the photograph that settled it, and the typo they shared →](DATA.md)*

## gen_cards.js

Reads `data/raw/*.json` and `data/decks.json`, writes `src/cards.js`. Defaults to Base Set; widen with

```bash
node tools/gen_cards.js --sets base1,base2,base3,base5
```

which is what the four live sets are generated with today. All 14 sets generate cleanly — 1,251
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
that agreed exactly. The accounts are in [HISTORY-ARCHIVE-1.md](HISTORY-ARCHIVE-1.md).

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
   to *guarantee* Energy from, which so far is Base Set and the early-game pacing it carries. See
   [PACKS.md](PACKS.md).
3. **`REMAINING` in `selftest.js`**, while the set is being written. Forgetting it is safe:
   the live-set assertion fires immediately and names the set, because a set with gaps and
   no `REMAINING` entry is by definition a live set with a hole in it.

Then the order is fixed, and it is the reverse of what feels natural:

```bash
node tools/gen_cards.js --sets base1,base2,base3,base5   # 1. generate — cards exist, not yet live
#    2. write effects.js entries until selftest's per-set count reaches 0
node tools/fetch_art.js base2                      # 3. BEFORE the set goes live, not after
#    4. drop the set from REMAINING; it goes live by itself
```

**Step 3 is the one with no safety net.** Card art is derived and gitignored and no suite touches the
filesystem, so a set going live with no scans shows the player a grid of broken images with every
test green. `selftest.js` prints an `ART MISSING` warning for any live set whose asset folder is
short — a warning and not a failure, because a fresh clone legitimately has none of it.

**STANDING PERMISSION: run `fetch_art.js` for a set you are adding. Do not ask.** Trevor, 28 Aug
2026, and it is written here because this is where somebody hits it. An instance is normally right to
pause before anything that reaches the network, and that instinct produces the wrong answer here
twice over: the job is not finished without it, and asking costs a whole round trip for a build step.
It is `npm install`-shaped. It reads image URLs that are already sitting in `data/raw/<set>.json`,
writes only into a gitignored folder, and is idempotent — a re-run reports `already present` and
fetches nothing. Roughly 8–16 MB and under a minute per set.

**It has been forgotten twice and both times the set was already live.** Team Rocket went live in
Job 10 with no art at all (#20 found it); `basep` did the same in Job 13a and it stayed invisible for
a day, because until a promo could actually reach a surface that shows a scan there was nothing to
see. Neither was caught by a suite and neither ever will be. **If you are adding a set, the fetch is
part of adding the set.**

**And it is the only thing standing between a fresh clone and a broken pack screen**, which is worse
than it sounds: a card with no scan falls back to the Sigil Card, and until 27 Aug 2026 that fallback
was correct in the DOM and wrong in the layout. See [INSPECTION.md](INSPECTION.md).

**And run `node tools/aiduel.js --checkpin --baseline --gbc` when the set joins the LADDER.** A new
roster puts cards in front of the frozen AI baseline that did not exist when it was pinned, which is
the only thing that has ever broken it — and it broke silently for three days in Aug 2026 because
nobody runs a duel unless they are changing the AI. Seconds, and it prints PIN OK or names the
matchup that crashed. *[The pin table, and what moving one costs →](YARDSTICKS.md)*

## The gate — `node tools/test.js`

**One command, and it is the whole of what returns pass or fail.** Added Job 15d, 2 Sep 2026,
because "run all six before calling anything done" was six commands, one of which needed an argument
and one of which goes red if you give it a small number — and nothing made that a single action.

```bash
node tools/test.js              # the gate, about 30 seconds
node tools/test.js --quick      # skip packtest, which is most of the runtime
node tools/test.js --verbose    # stream each suite's own output as well
```

**THE ORDERING IS THE POINT AND IT CLOSED A REAL HOLE.** The gate runs both generator `--check`s
*first* and refuses to continue if either fails:

```
gen_cards --check   is src/cards.js still what data/ generates?
build --check       is shadowless.html still what src/ builds?
```

Because `smoke.js` tests the **built** artifact. Edit `src/`, forget to rebuild, and it reads the
previous build, tests code you have already replaced, and **passes** — so a green six-suite run could
be describing a version of the game that no longer exists. Every suite was individually correct and
nothing in the tree could see it. Both `--check`s already existed and were in nobody's routine.

*Demonstrated rather than argued: a comment appended to `src/engine.js` without a rebuild leaves the
old six green and stops the gate dead at step two.*

**One thing it will catch that is not your fault.** `core.autocrlf` is `true` on this machine and
Shadowless has no `.gitattributes`, so `git checkout -- src/anything.js` hands the file back with
CRLF, the build then differs from the committed HTML — and `git status` reports the tree **clean**,
because git normalises line endings on read and the build does not. The gate is more sensitive than
git here. Convert the file back to LF; do not rebuild and commit the difference.

### The six suites

**None of them subsumes the others**, and they overlap barely at all. **The counts below rot** — they
are here to say roughly how heavy each suite is, not as a figure to quote. Run the suite for the real
number.

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
  Power working. See [POWERS.md](POWERS.md).
  Its **AI verb scoring** section is the only place eleven unscored verbs could ever have been seen,
  for the same reason it is the only suite that can see a Power. Those cases assert `rawOutcomes()`
  — the raw distribution, before weights — so retuning a weight cannot fail them for the wrong
  reason. *[The blind spot they were built for →](MEASUREMENT.md)*
  It also carries the **engine/scorer agreement** sweep, added 31 Aug 2026 for the shape #28 hit four
  times in one session and thought had no cheap guard: a verb implemented in both `engine.js` and
  `ai.js` with nothing holding the two to each other. Where the damage is a pure function of the
  attacker's own board it is cheap — **make the engine resolve the attack and compare**. It is a
  sweep over the live pool rather than a card list, so a new set is covered the day it goes live.
  **There are two guards and you want both: agreement is not correctness**, and three Base Set cards
  were caught only by the one that reads the printed card text.
  *[Both, and what they found →](AI-INVARIANTS/SLOT-PRINTED-DAMAGE.md)*
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
  **AND IT RUNS ON A SEEDED PRNG SINCE 2 SEP 2026, because it was not deterministic and everything
  about how it was read assumed it was.** `ui.js` reaches for `Math.random()` for the match seed and
  the pack seed; 56 of its 59 entry points pinned one and three did not. `--seed N` sweeps it, and
  the seed is printed, so a red run is reproducible rather than an anecdote — `packtest.js`'s rule,
  which has never flaked. **A green re-run is not evidence a red run was noise.**
  *[The flake, and the twenty-two greens that hid it →](MISREADINGS.md)*
- **`collectiontest.js`** drives `src/collection.js`, which is pure data. It **stubs
  `localStorage` rather than skipping persistence**, because "does a save survive a round trip" is
  the whole point and testing everything except that would be testing the easy half. Its sharper
  cases are the failures — see [COLLECTION.md](COLLECTION.md).
- **`progresstest.js`** drives `src/progress.js`, which is pure data, against the real
  card database. Two kinds of case matter here and neither is obvious. It asserts the ladder is
  **derived** — passing an unlive set code into the live list must produce a working generated
  bracket — and it asserts every authored opponent fields a **legal 60-card deck** through the real
  `validateDeck`, which is what stops a roster entry rotting silently when a set is regenerated.
  **Since 1 Sep 2026 it also drives the brackets that are NOT sets** — that a standalone appears only
  when everything it is made of is live, that its `packSets` is derived from ladder position and is
  therefore identical on a fresh save and a finished one, and that `bossAfter: 'all'` resolves to a
  number before anything downstream sees it. See [PROGRESSION.md](PROGRESSION.md).
- **`packtest.js`** opens 200,000 packs against a fixed seed and checks every row of the
  odds table in [PACKS.md](PACKS.md). Deterministic, so it cannot flake; the tolerances are sized to
  catch a wrong denominator, not to absorb noise. It sweeps every live set and the fresh-RNG-per-pack
  path the game actually uses. It also prints, without asserting, how many packs it takes to finish a
  set — the number the economy turns on, and nothing else computes it.
  **It takes a count, and a small one goes RED for reasons that are not a fault, so just run it
  whole**; the full run is about four seconds and there was never anything to save. *[Which counts go
  red, why the tolerance is the honest half, and what a documented red command teaches whoever runs it
  →](MISREADINGS.md)*

## `tools/lib/owed.js` — who is the engine waiting for

**One expression, and it had fourteen copies in three versions.** `CLAUDE.md` carries the rule as a
standing decision: *every choice a player is owed is PER PLAYER, and there are four of them* —
`pendingAsk`, `pendingSwitch`, `pendingPromote`, `pendingPrize`. Getting it wrong hangs the game, and
it had gone wrong in every harness in the repo rather than in the game.

| what the loop dispatched | where | games finished, of 600 | `aiChoose` returned null |
|---|---|---|---|
| `pendingPromote` only | 7 loops, all in `smoke.js` | 547 | **53 (8.8%)** |
| `+ pendingSwitch` | `selftest`, `abtest`, `aiduel`, `decksim`, `aitest` | 592 | **8 (1.3%)** |
| `+ pendingAsk` | 1 loop, in `smoke.js` | 600 | 0 |
| `+ pendingPrize` | nothing | 600 | 0 |

**The correct version was already written, in the same file as the seven worst**, under a comment
stating the rule in full. It never reached its own siblings. That is why the rule is now code rather
than advice, and why `selftest.js`'s **2g** scans `tools/` and goes red if a loop stops using it —
verified by reverting one by hand and watching it name the file.

**`pendingPrize` is dispatched even though it is measurably unreachable from a loop.** A harness that
silently depends on a state never arising is one card away from this bug, which is how the other
three got here. Gym brings sixteen more cards that stop to ask the opponent something.

*[The abtest stall floor this explains, and the 91% drop →](MISREADINGS.md)*

## `claimtest.js` — pass/fail, but a red row is not a broken build

**Deliberately not one of the six, and this is the whole point of the section.** It is pass/fail, so
it does not belong with [MEASUREMENT.md](MEASUREMENT.md)'s instruments — there is no sample and no
interval, a claim is true on its board or it is not. But it is **not a regression suite either**, and
putting it in `tools/test.js` would teach everybody to read it wrong.

**A failing row here is a fault report about the AI, filed on purpose.** You write a claim out of
Trevor's note *before* you know whether the bot satisfies it; red means you found something. That is
the opposite of every other suite in this file, where red means you broke something. **Never "fix" a
red claim by weakening the row** — either fix the scorer or move the row to `open:` with the reason.

**IT IS ALSO AN ORACLE FOR WHETHER A CONSTANT IS A BUG**, which is a second use and is written up as
a procedure: apply the correction as an experiment, run only this, read *which* rows flip, revert.
Nothing else in the repo can tell a wrong number from a policy nobody named.
*[The procedure and its worked example →](MEASUREMENT.md)*

```bash
node tools/claimtest.js                      # assert everything
node tools/claimtest.js Arcanine --explore   # what the bot ACTUALLY does, scored
node tools/claimtest.js --open               # clauses with no term to assert against
node tools/claimtest.js --baseline 96c53fd   # the control — see below
node tools/wants.js base1 --todo             # which notes have no claim yet
```

**`wants.js` checks for DRIFT on every run, and that is the check worth copying.** A claim quotes
Trevor's note verbatim so a reader can hold the row against the sentence it came from — and the moment
he revises that sentence, the row is silently testing something he no longer says, **while still
passing**. Nothing else in the project can see it. The tool re-reads the workbook every run and prints
`!! REWRITTEN` or `!! ORPHANED` with both texts. Added 24 Aug 2026 when a workbook update took the
live notes from 148 to 219; nothing had drifted that time, and it was verified by deliberately
corrupting a claim and watching it fire.

**Three parts, and the split matters.** `tools/lib/xlsx.js` reads Trevor's workbook with no
dependencies, because it is a zip of XML and adding a package to a project whose deliverable is one
double-clickable file was not worth it. `tools/wants.js` reports the inbox and the backlog.
`tools/lib/board.js` builds a position out of card **names** and hands you probes written from player
0's seat — `prefers('Ice Beam')`, `threat()`, `lethal('Take Down')`, `explain()`.

**It exists because twenty-nine bespoke fixture functions in `powertest.js` were the bottleneck.**
`zardBoard`, `dyingWall`, `weezingBoard`, `duel2`, `arbokBoard` — most of them the same eight lines,
and with 148 plain-English notes waiting to become several claims each, that boilerplate was the tax
on the whole method. **The existing fixtures were left alone.** Migrating them wholesale would be a
large diff across a green 421-case suite to buy nothing; new work goes here, and `powertest.js` keeps
what it has.

**NO CLAIM BOARD COULD TEST AN EVOLUTION UNTIL 30 Aug 2026, and nothing anywhere said so.**
`canEvolve` refuses while `turnsTaken <= 1` under `noEvolveFirstTurn`, and `setup()` set
`state.turn` without ever advancing either player past **zero** — so every `evolve` action was
silently absent from `legalActions` on every board this harness has ever built.

**It did not look like a failure, which is the whole lesson.** Nothing threw, nothing went red, and a
`sane` fixture asserting something else passes happily beside it: the option simply was not on the
table. **EVOLUTION TIMING is a built pattern with its own file**, and none of its claims could have
been written here. `setup()` now derives `turnsTaken` from `turn`, with `myTurnsTaken` /
`theirTurnsTaken` overrides for a board that means to sit in the first-turn rule. All 94 rows stayed
green across the change, which is what says it widened the action list without moving any existing
answer.

**The shape to watch for in any fixture builder: an absent option is indistinguishable from a
rejected one.** `board.js` throws loudly when you name a card it cannot resolve and stayed perfectly
silent about a whole verb it could never reach.

**`board.js` refuses to guess between two printings of a name**, and the refusal is about behaviour
rather than about printing: `base5-1` and `base5-18` are both Dark Alakazam and play identically, so
it picks one, while two mechanically different Pikachus are a real ambiguity and it makes you say
which. The fingerprint is what separates them, so no set needs a line of exceptions.

**Every row carries a `sane` fixture assertion and it is required, not encouraged.** It states what
the board must be for the claim to mean anything, and its failure is reported as its own kind —
*"your board no longer isolates anything"* and *"the bot got this wrong"* want completely different
responses. The reason is written into `powertest.js` at `CHANSEY_ARMED`: two tests there used a bare
Chansey to mean "cannot be killed", which quietly also meant "cannot threaten" the moment a bought
turn started reading the opponent's threat.

### The control, which is the reason to believe any of it

**A suite that has only ever been green proves nothing about itself.** `--baseline REF` materialises
`src/` from a git ref (the same trick as `abtest.js`, with the same stated limit — the whole of `src/`
comes from the ref) and runs the identical rows against the older bot.

Run against `96c53fd`, the commit before the 22 Aug bought-turn work, **the Dewgong and Gyarados rows
go red with the numbers `Playbook/ATTACK-CHOICE.md` recorded at the time** — Aurora Beam 50 against
Ice Beam 43, and a Bubblebeam beating an equally lethal Dragon Rage. Three rows that were never about
that work stay green. **If that ever stops happening, this harness is not measuring what it claims and
nothing it reports should be believed.**

That run also separated two open faults from two fixed ones for free: Zapdos and Arcanine fail against
*both* commits, so they are standing gaps rather than regressions.

## `pullcheck.js` — did MY packs behave?

```bash
node tools/pullcheck.js "Save File/shadowless-collection (15).json"
node tools/pullcheck.js <file> --packs 140      # override the denominator
```

**Not a suite and not in the gate.** `packtest.js` asks whether the generator matches the table;
this asks whether one real save's pulls are consistent with it, which is the question a *player*
asks and the one that has now come up twice. It reads an exported save, counts variants against
`stats.packsOpened`, and prints an exact two-sided Poisson p per row.

Three things it is built to stop, each of which cost time the first time:

- **1st Edition is a whole-pack roll**, so a bare tally of flagged *cards* reads eleven times too
  lucky. It reports packs.
- **Poisson, not a normal interval.** At the means a realistic save produces — Shadowless and
  Misprint are both under 1 — a symmetric interval calls an ordinary zero surprising.
- **p < 0.01, not 0.05**, because five rows are tested at once and at 0.05 apiece roughly one save
  in four would flag something by chance, which teaches whoever runs it to ignore the output.

**And the caveat it prints is the point of it.** A count you went looking for *because it felt wrong*
is a filtered sample — the noticing came first. So it is good at saying "that is ordinary" and weak
at saying "something is broken", and if a row does look extreme the next step is `packtest.js`, which
samples fresh, rather than a change to `PACK_ODDS`.

## Looking at it lives next door — [INSPECTION.md](INSPECTION.md)

**`shot.js`, `probe.js`, the DEV tab, and the four classes of bug the smoke stub cannot see moved
there on 25 Aug 2026.** Same seam that created [MEASUREMENT.md](MEASUREMENT.md): the callers. Every
UI file in this tree was reaching in here for that one section and wanting none of the rest of it.

**The half of it that belongs to this file is the warning: a green `smoke.js` run proves nothing
visual.** It has no layout engine and no cascade, so it cannot see where an absolutely-positioned
child lands, that a `line-height` inherited, or that 864px of content is in a 768px viewport. Two
bugs got through 68 passing tests in one session and four were live under 136. **A screenshot is not
optional polish on a UI change** — it is the only test that exists for a whole class of defect.

## The two things the builder refuses

**A module's CommonJS export must be ONE line.** `build.js` strips it with a line-anchored regex, so
a wrapped export list leaves its own body in the bundle and dies as `Unexpected token '}'` thousands
of lines into the generated HTML. The builder now refuses to build that, naming the file and line —
but the convention is why, and the tail of `collection.js` is the ugly worked example.

**No NUL bytes in any source file.** One shipped, inside a string literal in `ui.js`, from a mangled
edit. Every suite passed, because a NUL is a valid string character, and the only symptom was `grep`
declaring the file binary. Editors hide them. The fix is to retype the literal, not to work around it.

## Coverage

The check in `selftest.js` reports the implemented count per set with each set's live/in-progress
state beside it — **311 of 311 across four live sets** as of 19 Aug 2026. **Run it rather than
quoting that**; the figure moves every set job and it counts *printings*, which is not the unit older
text in this tree used. A card missing a script fails the run if its set is live,
which is what keeps the counts in `CLAUDE.md` honest.

**A set being written carries a `REMAINING` entry and the run stays green while it shrinks** — that
is how Job 6 was worked, one sub-job at a time, and it is the mechanism to use for the next set
rather than a long red suite. The suite also asserts **no in-progress set went backwards**, so a
script deleted by a bad merge is caught the same way a missing one is.

## tools/chat-era/

`build.py` and `gen_cards.py` are the originals, superseded by the Node equivalents. **Keep them, and
don't try to revive them** — it looks like a one-line fix and is not, for reasons in
[HISTORY-ARCHIVE-1.md](HISTORY-ARCHIVE-1.md).

## Three more tools live next door, because they are not pass/fail

**`openercheck.js`, `pressure.js` and `decksim.js` moved to [MEASUREMENT.md](MEASUREMENT.md) on
19 Aug 2026.** Every suite in this file returns pass or fail; not one of those three does, and
reading one as though it did is how a measurement gets quoted as a verdict. That is the same seam
that created `MEASUREMENT.md` in the first place — go there for what the opening Active promotes,
what a set can threaten you with, and whether a roster's tiers actually order.

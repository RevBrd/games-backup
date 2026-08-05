# Shadowless

A Pokémon TCG simulator covering the entire Wizards of the Coast era, in the spirit of the
Game Boy Color *Pokémon Trading Card Game*. Play matches, win booster packs, build decks from
what you own, fill a dex. Local-only, for Trevor's own entertainment, never hosted publicly.

The name is the Base Set **Shadowless** print run — the early sheets that lacked the drop shadow
on the art frame. It was picked over the placeholder "Pokemon TCG" because the collection's games
carry their own names rather than licensed ones, and because a set-printing term is the right
register for a project whose real subject is a card pool. Anything still reading "Pokemon TCG" in
code or data is the old placeholder.

**This game is sincere. It has no authored defects.** Bugs are bugs — fix them freely. Nothing in
it is pretending to be broken, and there is no register of intentional artifacts to check against.

## Read this first: the HTML is a build artifact

`shadowless.html` is **generated**. Do not hand-edit it — your changes will be silently destroyed
the next time anyone runs the build. The truth is in `src/`.

```bash
node tools/build.js           # src/ -> shadowless.html
node tools/build.js --check   # is the committed HTML in sync? (exit 1 if not)
```

The build concatenates the modules into one `<script>` rather than emitting `<script src>` tags,
which is what keeps the game a single double-clickable file with no server. (ES modules would be
the natural alternative and they do **not** work from `file://` — see `~/.claude/reference/building.md`.)

## Status

Job 4b of a long plan. The **rules engine and the AI are the finished part**; everything a
*collection* game needs is not built yet.

| Area | State |
|---|---|
| Rules engine | Complete for what it covers. WotC ruleset, followed to the letter |
| Opponent AI | Four tiers, expected-value based. Beats its own baselines |
| Base Set cards | **90 of 102.** The remaining 12 are the hard ones — see below |
| Card art | None, by design. Each card gets a deterministic geometric sigil from its id |
| Collection / packs / dex | Not started (Job 5) |
| Deck building | Not started. Four fixed theme decks + a random Sandbox deck for testing |
| Persistence | **None.** Not one `localStorage` call anywhere. Job 5 builds it from scratch |
| Progression / named opponents | Not started (Job 7) |
| Sets beyond Base | Not started. Card data on hand; Trainer *text* is the gap — see Data |
| Audio | None |

Don't trust that table — `node tools/selftest.js` and `node tools/smoke.js shadowless.html` between
them take under a minute and check most of it.

## The twelve missing Base Set cards

The most important thing to understand before picking up Job 4. These are not 12% of the remaining
work; they are the 12% that each need **new engine machinery**, and the previous instance deferred
them deliberately as a block.

- **Six Pokémon Powers** — Alakazam (Damage Swap), Blastoise (Rain Dance), Charizard (Energy Burn),
  Machamp (Strikes Back), Venusaur (Energy Trans), Electrode (Buzzap). The engine has **no concept
  of a Pokémon Power at all**: `CARD_DB` carries a `power` field and it is `null` on all 90 cards.
  Powers are not attacks — they fire outside the attack step, some of them repeatedly, and Damage
  Swap and Energy Trans each need an interactive mode of their own.
- **Five oddities** — Clefairy (Metronome copies the defender's attack), Porygon (Conversion
  rewrites Weakness/Resistance), Pidgey and Pidgeotto (Whirlwind / Mirror Move), Poliwhirl (Amnesia
  disables a chosen attack).
- **Clefairy Doll** (`base1-70`) — a Trainer that plays *as a Basic Pokémon*. Worth doing early
  despite looking like a curiosity, because **Mysterious Fossil** (`base3-62`) needs exactly the
  same machinery and Job 6 cannot ship Fossil without it. It is also the one integrity anomaly in
  the card data: three Fossil cards list `evolves_from = "Mysterious Fossil"`, which is not a Pokémon.

The four playable theme decks contain none of these, which is why the game is playable end-to-end
at 90 cards. Beyond Base Set the pattern scales — **182 cards WotC-wide carry a Power**, and Neo
adds 10 **Baby** Pokémon (their own coin-flip rule) and one **Poké-Body**. Powers are by a distance
the biggest unbuilt system in the project.

## Layout

```
shadowless.html        GENERATED — the playable game. Never hand-edit
src/
  cards.js             CARD_DB + the four theme deck lists. GENERATED — see Tooling
  effects.js           hand-authored effect scripts, one per card. The DSL verb
                       reference is the comment block at the top — read it before adding cards
  art.js               deterministic card sigils. Petals = attack count, rings = retreat cost
  deckgen.js           builds a legal 60-card deck from a pool. Sandbox now, campaign opponents later
  ai.js                expected-value scoring: enumerates coin-flip outcomes into a
                       distribution and runs each through the engine's own damage math
  engine.js            the whole ruleset. Pure logic, no DOM
  ui.js                everything that touches `document`
  style.css            dark instrument-panel palette, one `:root` block
data/
  wotc_pokemon.csv     1,020 Pokemon, all 14 WotC sets
  wotc_energy.csv      42 Energy cards
  core_trainers.csv    32 Trainers — base1 + Jungle + Fossil ONLY
  core_energy.csv      7 base1 Energy (strict subset of wotc_energy.csv; redundant)
  fullpool.json        completion manifest: id/name/kind for all 1,251 WotC cards
tools/
  build.js             src/ -> shadowless.html
  selftest.js          engine + AI statistical regression (drives src/ directly)
  smoke.js             44-test integration suite against the BUILT artifact, incl. UI
  chat-era/            the original Python tools. Cannot run here — see Tooling
backups/
```

`src/` modules each end with a `if (typeof module …) module.exports` line so they `require` cleanly
in Node; the build strips those on the way in. Keep that property — it is what makes the harnesses
possible without a browser.

## Tooling

Three commands. Run the last two before calling anything done.

```bash
node tools/build.js                      # rebuild the HTML after editing src/
node tools/selftest.js                   # rules + AI regression (add a number for a deeper pass)
node tools/smoke.js shadowless.html      # 44 integration tests against the built file
```

`selftest.js` drives the source modules; `smoke.js` drives the built HTML through a stubbed DOM and
covers the UI, the Trainer pickers, the coin-flip presentation and the deck-select flow. **Neither
subsumes the other** — a build bug shows up only in `smoke`, an AI regression only in `selftest`.

**`tools/chat-era/` cannot run on this machine and is kept for provenance only.** Both scripts are
Python, and there is no Python installed here. Worse, `gen_cards.py` reads `/tmp/ptcg/*.json` (a
clone of the `pokemon-tcg-data` repo) and `/mnt/user-data/uploads/P_TCG_Data.xlsx`, both of which
were Claude Chat sandbox paths that did not survive the port, and it imports `openpyxl`.
`build.py` has been superseded by `tools/build.js`, which is a faithful Node port — verified by
rebuilding and diffing byte-for-byte against the as-received artifact.

**So `src/cards.js` currently cannot be regenerated, and Job 6 needs it to be.** The fix is to write
a fresh CSV → `cards.js` generator in Node against `data/`. This is very doable: the CSVs carry
everything `CARD_DB` holds and more. Read `tools/chat-era/gen_cards.py` first — it is a clear spec
for what the output must look like, including the type-letter mapping. Note that the deck lists came
from named sheets in Trevor's spreadsheet, so **the four theme decks are his authentic lists**, not
something a model invented.

## Working on it

**Play it.** Open `shadowless.html`. The right-hand rail has four tabs: CARD (preview), LOG, DEV,
CARDS (implementation coverage + live deck validation). Deck select exposes prize count, AI tier and
a **seed** — every match is reproducible, and the game-over screen offers "Replay this seed". Use it
when chasing a bug.

**`state.winner` can legitimately be `0`.** Test it against `null`, never for truthiness. This
already cost one session an hour of phantom "stalled game" reports.

**Unimplemented cards can never silently do nothing.** The deck validator refuses any deck
containing a card with no effect script. Preserve that property — it is why the card counts above
can be trusted.

**Adding a card** means a `cards.js` entry plus an `effects.js` entry. If the card needs behaviour
the DSL cannot express, add a verb rather than special-casing it, and document it in the verb
reference. Trevor is happy to work through new card logic in plain English — he has good instincts
for how the logic should hang together and is not trying to read the code.

## Data

`wotc_pokemon.csv` is clean: 1,020 rows, no duplicate ids, no missing HP/type/stage/retreat, every
`evolves_from` resolving to a real card except the Mysterious Fossil case above. It carries
`dex_number` and `flavor_text` that `CARD_DB` throws away — Job 5's dex will want both.

**The Trainer gap is narrower than it looks.** `fullpool.json` is a complete manifest of all 1,251
WotC cards and includes the id and name of **all 189 Trainers**, so the set lists and completion
targets are known. What is missing is the *rules text* for the 157 Trainers outside Base, Jungle
and Fossil. Jobs 4–6 are unaffected; Job 8 is blocked on it. Trevor is chasing an export.

Set codes: `base1` Base · `base2` Jungle · `base3` Fossil · `base4` Team Rocket · `base5` Base Set 2
· `base6` Legendary Collection · `gym1` Gym Heroes · `gym2` Gym Challenge · `neo1`–`neo4` Neo
Genesis/Discovery/Revelation/Destiny · `basep` promos · `si1` Southern Islands.

**Scope is settled: everything in the data, promos and Southern Islands included.** That makes
`basep` and `si1` a pack-table and dex question rather than a scope question, and worth thinking
about early — they are odd shapes for boosters, and `base5`/`base6` are reprint sets that will
hand the player cards they already own.

## Job plan

Trevor's ordering, and he is explicit that it is yours to rearrange and to break into sub-jobs.

- **Job 4** — finish Base Set. In practice: build the Pokémon Power system, then the five
  oddities, then Clefairy Doll. *Current job.*
- **Job 5** — collection, packs, deck building, persistence.
- **Job 6** — Jungle and Fossil. Needs the card generator rewritten first.
- **Job 7** — progression, named opponents.
- **Job 8+** — remaining sets. Blocked on Trainer text.

## Open

1. **`src/cards.js` cannot currently be regenerated** — see Tooling. Blocks Job 6.
2. **No Trainer text past Fossil** — see Data. Blocks Job 8.
3. **Deck balance.** The four theme decks are Trevor's authentic lists and run roughly
   70 / 60 / 40 / 28 percent across ~100 AI games. The real ones were never balanced against each
   other either, so this may simply be correct. Confirm before touching them.
4. **Possible first-player advantage.** Expert-vs-expert mirrors came in around 58–67% for whoever
   is seated first, over a few hundred games. Suggestive rather than proven, and it may be a true
   property of the ruleset. Worth a dedicated run before concluding anything.

## Credits

- **Opus 5** (Claude Chat) — the whole game through Job 4b: engine, AI, card scripts, art system,
  UI, the module layout, the Python build pipeline and the 44-test smoke suite.
- **Opus 5** (Claude Code, 4 Aug 2026) — port into the collection, naming, data audit,
  `tools/selftest.js`, the Node build port, and this layout.

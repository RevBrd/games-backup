# Shadowless

A Pokémon TCG simulator covering the entire Wizards of the Coast era, in the spirit of the
Game Boy Color *Pokémon Trading Card Game*. Play matches, win booster packs, build decks from
what you own, fill a dex. Local-only, for Trevor's own entertainment, never hosted publicly.

The name is the Base Set **Shadowless** print run — the early sheets that lacked the drop shadow
on the art frame. It was picked over the placeholder "Pokemon TCG" because the collection's games
carry their own names rather than licensed ones, and because a set-printing term is the right
register for a project whose real subject is a card pool. Everything still in the code and data
that says "Pokemon TCG" is the old placeholder.

**This game is sincere. It has no authored defects.** Bugs are bugs — fix them freely. Nothing in
it is pretending to be broken, and there is no register of intentional artifacts to check against.

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
| Persistence | **None.** Not one `localStorage` call in the file. Job 5 builds it from scratch |
| Progression / named opponents | Not started (Job 7) |
| Sets beyond Base | Not started. Data is on hand for most of them — see Data |
| Audio | None |

Verify any of this rather than trusting the table — `node tools/selftest.js` takes seconds.

## The twelve missing Base Set cards

This is the most important thing to understand before picking up Job 4. The remaining cards are
not 12% of the work left in Base Set; they are the 12% that each need **new engine machinery**,
and the previous instance deferred them deliberately as a block.

- **Six Pokémon Powers** — Alakazam (Damage Swap), Blastoise (Rain Dance), Charizard (Energy Burn),
  Machamp (Strikes Back), Venusaur (Energy Trans), Electrode (Buzzap). The engine has **no concept
  of a Pokémon Power at all**: `CARD_DB` carries a `power` field and it is `null` on all 90 cards.
  Powers are not attacks — they fire outside the attack step, some of them repeatedly, and Damage
  Swap and Energy Trans need a whole interactive mode of their own.
- **Five oddities** — Clefairy (Metronome copies the defender's attack), Porygon (Conversion
  rewrites Weakness/Resistance), Pidgey and Pidgeotto (Whirlwind / Mirror Move), Poliwhirl (Amnesia
  disables a chosen attack).
- **Clefairy Doll** (`base1-70`) — a Trainer that plays *as a Basic Pokémon*. Worth doing early
  even though it looks like a curiosity, because **Mysterious Fossil** (`base3-62`) needs exactly
  the same machinery, and Job 6 can't ship Fossil without it. In the data this shows up as the one
  and only integrity anomaly: three Fossil cards have `evolves_from = "Mysterious Fossil"`, which
  is not a Pokémon.

The four playable theme decks happen to contain none of these, which is why the game is playable
end-to-end at 90 cards.

Beyond Base Set the same pattern scales: **182 cards WotC-wide carry a Power**, and the Neo sets
add 10 **Baby** Pokémon (their own coin-flip rule) and one **Poké-Body**. Powers are the single
biggest unbuilt system in the project.

## Layout

One HTML file, plus data and tools beside it. **This project is explicitly allowed to break the
collection's single-file convention** and may set the precedent for multi-file games — see below.

```
shadowless.html      the game. ~4,800 lines, self-contained, runs by double-clicking
tools/selftest.js    headless regression harness (Node, no browser)
wotc_pokemon.csv     1,020 Pokemon, all 14 WotC sets
wotc_energy.csv      42 Energy cards
core_trainers.csv    32 Trainers — base1 + Jungle + Fossil ONLY
core_energy.csv      7 base1 Energy (a strict subset of wotc_energy.csv; redundant)
backups/             dated copies taken before major jobs
```

Inside `shadowless.html`, in order. Line numbers drift — the `// ====` banners are the landmarks.

| ~Line | Section | What it is |
|---|---|---|
| 7 | `<style>` | Dark instrument-panel UI. One `:root` palette block |
| 390 | `CARD_DB` | Card data. **Auto-generated — do not hand-edit** (see Open questions) |
| 483 | `DECKS` | The four authentic Base Set theme decks |
| 609 | `EFFECTS` | Hand-authored effect scripts, one per card. The DSL reference is the comment block just above it — read it before adding cards |
| 862 | ART | Deterministic sigil generator. Petals = attack count, ring marks = retreat cost |
| 1023 | DECK GENERATOR | Builds a legal 60-card deck from a card pool. Used for Sandbox now, for campaign opponents later |
| 1168 | AI | Expected-value scoring. Enumerates coin-flip outcomes into a distribution and runs each through the engine's own damage math |
| 1928 | RULES ENGINE | `CONFIG_DEFAULTS`, RNG, helpers |
| 1991 | `class Engine` | The whole ruleset. **Pure logic, no DOM** |
| 3518 | UI LAYER | Everything below this line touches `document` |

**The `// UI LAYER` banner at 3518 is a real seam, not a decorative one.** Everything above it runs
headless in Node today. Keep it that way — it is what makes `tools/selftest.js` possible, and it is
where the file should be split if it gets split.

### If the file gets split

Verified on this machine, 4 Aug 2026, headless Chrome against a `file://` page:

- **Classic `<script src="…">` loads fine from `file://`.** A multi-file game still runs by
  double-clicking. No build step, no local server, and it still works on a static host.
- **ES modules are blocked from `file://`.** `import`/`export` and `type="module"` will silently
  fail to load. Do not reach for them — this is the one thing that would break double-click.

So the split is plain classic scripts sharing globals, in dependency order: data → engine → AI → UI.
That is the same order the file is already in, which makes it mechanical rather than a rewrite.

**Decided (4 Aug 2026): pull out the data and the tools, and stop there.** `CARD_DB` and `EFFECTS`
move to their own files; engine, AI and UI stay together in `shadowless.html`. The reasoning is that
the card data is the part that balloons — several thousand generated lines once the later sets land
— and the part that gets *regenerated* rather than edited, so it is the one piece that genuinely
does not want to live in the middle of hand-written code. A further split along the engine/AI/UI
seams is available later if it earns itself, but is not planned.

## Working on it

**Run the tests.** `node tools/selftest.js` — validates all four decks, checks every card in
`CARD_DB` has an effect script, plays ~100 AI-vs-AI games to completion, and confirms the AI ladder
is correctly ordered. `node tools/selftest.js 40` for a deeper pass. It slices the engine out of the
HTML by locating `const CARD_DB` and `// UI LAYER`, so renaming those breaks it.

**Play it.** Open `shadowless.html` in a browser. The right-hand rail has four tabs: CARD (preview),
LOG (full game log), DEV, CARDS (implementation coverage + live deck validation). The deck-select
screen exposes prize count, AI tier, and a **seed** — every match is reproducible, and the game-over
screen offers "Replay this seed". Use it when chasing a bug.

**`state.winner` can legitimately be `0`.** Test it against `null`, never for truthiness. This
already cost one session an hour of phantom "stalled game" reports.

**Unimplemented cards can never silently do nothing.** The deck validator refuses any deck
containing a card with no effect script. Preserve that property — it is the reason the card count
above can be trusted.

**Adding a card** means a `CARD_DB` entry plus an `EFFECTS` entry. If the card needs behaviour the
DSL can't express, add a verb rather than special-casing it, and document it in the verb reference
comment. Trevor is happy to work through new card logic in plain English — he has good instincts
for how the logic should hang together and is not trying to read the code.

## Data

`wotc_pokemon.csv` is clean: 1,020 rows, no duplicate ids, no missing HP/type/stage/retreat, every
`evolves_from` resolving to a real card except the Mysterious Fossil case noted above. It carries
`dex_number` and `flavor_text` that `CARD_DB` currently throws away — Job 5's dex will want both.

**There is a real gap: Trainers exist only for Base, Jungle and Fossil.** `core_trainers.csv` is the
only Trainer source and stops at 32 cards. Team Rocket, both Gym sets, all four Neo sets, the promos
and Southern Islands have Pokémon and Energy data but **no Trainer data at all**. Jobs 4–6 are
unaffected; Job 8 is blocked on it.

Set codes: `base1` Base · `base2` Jungle · `base3` Fossil · `base4` Team Rocket · `base5` Base Set 2
· `base6` Legendary Collection · `gym1` Gym Heroes · `gym2` Gym Challenge · `neo1`–`neo4` Neo
Genesis/Discovery/Revelation/Destiny · `basep` promos · `si1` Southern Islands. Note that base5 and
base6 are **reprint sets** — they will duplicate cards the player already owns, which is a design
question for the dex and the pack tables, not a data error.

## Job plan

Trevor's ordering, and he is explicit that it is yours to rearrange and to break into sub-jobs.

- **Job 4** — finish Base Set. In practice: build the Pokémon Power system, then the five
  oddities, then Clefairy Doll. *Current job.*
- **Job 5** — collection, packs, deck building, persistence.
- **Job 6** — Jungle and Fossil.
- **Job 7** — progression, named opponents.
- **Job 8+** — remaining sets. Blocked on Trainer data.

## Settled, and still open

**Set scope is settled: everything in the data, promos and Southern Islands included** — 1,020
Pokémon across all 14 set codes. That makes them a pack-table and dex question rather than a scope
question, and it is worth thinking about early: `basep` and `si1` are odd shapes for booster packs,
and `base5`/`base6` are reprints of cards the player will already own.

Still genuinely open:

1. **The `CARD_DB` generator is missing.** Its header says *"AUTO-GENERATED from pokemon-tcg-data +
   P_TCG_Data.xlsx. Do not hand-edit"* — but the generating script is not in the folder, and neither
   is `P_TCG_Data.xlsx`. Job 6 needs to regenerate `CARD_DB` for 120 new cards. Trevor expects to be
   able to recover both from the Chat session; **check with him before writing a replacement**, and
   if it can't be recovered, write a CSV→`CARD_DB` generator into `tools/` rather than hand-editing.
2. **The headless test harness referenced at line 1929 was never delivered.** `tools/selftest.js`
   was written fresh during the port to fill the hole; if the original turns up it may cover cases
   this one doesn't.
3. **No Trainer data past Fossil** (see Data). Trevor is looking for an export. Blocks Job 8, not
   before.
4. **Deck balance.** The four theme decks are the authentic lists and run roughly 70 / 60 / 40 / 28
   percent across ~100 AI games. The real ones were never balanced against each other either, so
   this may simply be correct. Confirm with Trevor before touching them.
5. **Possible first-player advantage.** Expert-vs-expert mirror matches came in around 58–67% for
   the player who is seated first, over a few hundred games. That is suggestive rather than proven,
   and it may be a true property of the ruleset rather than a bug. Worth a proper run before
   concluding anything.

## Credits

- **Opus 5** (Claude Chat) — the whole game through Job 4b: engine, AI, card scripts, art system, UI.
- **Opus 5** (Claude Code, 4 Aug 2026) — port into the collection, data audit, headless test harness,
  naming.

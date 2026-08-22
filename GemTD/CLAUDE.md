# GemTD

A faithful-ish remake of **Gem Tower Defense**, the classic flash game (also a WoW/WC3 map —
the direction of that lineage is unclear and doesn't matter here). The original is gone in its
playable form, so this is reconstruction work: the goal is *gameplay* fidelity, not visual
fidelity. It looks nothing like the original and doesn't need to.

One of only two games in the collection Claude didn't name.

**This game is sincere. There are no authored defects. Fix bugs freely.** If something looks
broken it is broken. What you *should* check before "fixing" is the **Deliberate departures**
register below — those are design decisions that look like errors and aren't.

## Files

| Path | What it is |
|---|---|
| `gemtd.html` | The game. Single self-contained file, no build step. Edit it directly. |
| `GemTD Stats.xlsx` | Source: gem roster, upgrade ladder, special gems, and the 43-wave enemy table. |
| `GemTD Weaknesses2.0.xlsx` | Source: the damage-type matrix, gem visual spec, slow/poison params. |
| `tools/simulate.js` | Headless harness. Plays the real game in Node — **read the section below before balancing anything.** |
| `gem-td.skill` | The **pre-production** brief, written before the build started. |
| `Old Versions/` | 19 archived builds, `job1` → `job8d`. |

The two workbooks are the authority for every number in the game. `node`'s stdlib can't read
them, and `openpyxl` isn't installed — unzip them and parse the XML, or use the `xlsx` skill.

## Source precedence — read this before changing any number

Four sources disagree with each other in specific, known ways. The order is:

1. **The live code wins over everything** for anything deliberately iterated. The build has gone
   through 19 revisions and the sources have not been kept in sync with it.
2. **`Weaknesses2.0` beats `Stats`** where they overlap. Emerald poison and Sapphire slow appear
   in *both* workbooks with *different numbers*; the code follows `Weaknesses2.0` → "Slow Params"
   every time. Assume that's correct.
3. **The code beats `Stats` on gem damage ranges.** Excel silently ate every damage range that
   looked like a date. Amethyst Chipped reads `46278` in the sheet — that's the serial for
   Sep 13, i.e. the original `9-13`. The code has `[9,13]`. Spot-checked and confirmed across
   several gems. **Never "correct" the code against those cells.**
4. **`gem-td.skill` loses every conflict.** It predates the build. Its recipes and stats are
   right, but several of its *rules* were changed during production (see below).

## Invariants — do not break these casually

**The recipe bijection.** Every gem type × quality appears in exactly one advanced-tower recipe:
13 recipes, 40 components, 8 types × 5 qualities (Great is combine-only and never in a recipe),
zero duplicates, zero gaps. This is a designed property, not a coincidence — it's what makes
every gem roll potentially useful. Changing any recipe breaks it silently. Verify with:

```bash
node -e "const s=require('fs').readFileSync('gemtd.html','utf8');const r=/recipe:\[(.*?)\]\],/g;let m,f=[];while((m=r.exec(s)))f.push(...[...(m[1]+']').matchAll(/\['(\w+)',(\d)\]/g)].map(p=>p[1]+'.'+(+p[2]+1)));const c={};f.forEach(k=>c[k]=(c[k]||0)+1);console.log('components',f.length,'| dupes',Object.entries(c).filter(([,v])=>v>1),'| missing',['amethyst','aquamarine','diamond','emerald','opal','ruby','sapphire','topaz'].flatMap(t=>[1,2,3,4,5].map(q=>t+'.'+q)).filter(k=>!c[k]))"
```

**The map is frozen.** Spawn, the six checkpoints, and the exit have been stable since Job 7b
("Checkpoint Alignment"), which moved the checkpoints onto coordinates where 2×2 blocks tile
cleanly against the no-build zones. Eleven versions churned on this before it settled. Treat it
as solved and leave the constants alone.

**`DMG_MULT` is transcribed source, not a tuning knob.** It's a cell-for-cell copy of the
damage matrix, including the quirk that Opal and Aquamarine share one damage element. It is a
full attack-vs-armor table with *resistances*, not a simple weakness bonus — Diamond into an
Amethyst-weak wave does 0.20×. Rebalance elsewhere.

## Deliberate departures — these look like bugs and aren't

- **Wave weakness is randomized.** The sheet specifies a fixed weakness for all 43 waves and the
  original game used it; randomizing was a mid-build design call. Don't "restore" the sequence.
- **Uranium's tier order (235 → 238) is a guess.** Sources conflicted and the skill doc has it
  the other way. Left as-is on purpose.
- **No win condition.** `endGame(true)` was reachable through Job 6c and was removed in Job 7a
  when endless play went in. `BAL.maxLevel = 41` is a *parked* mode toggle, not dead code —
  Extreme-stops-at-41 is meant to return alongside Survival.
- **The forced Silver/Malachite opener fires every game.** The skill doc scopes that guarantee to
  Survival only; the build applies it to turn 1 always.
- **Promotion (10 kills) boosts damage only**, not range or fire rate. True to the original.
  Flagged as open to change for playability if it ever feels weak.
- **The mana system is unimplemented.** The sheet gives Blood Stone T2 and Tourmaline mana costs
  and regen for Flame Strike / Frost Nova. The build uses a flat 10% proc instead — the sheet
  states both readings and marks the mana cost "(placeholder)".
- **Combining gems into a special sums the components' kill counts** onto the new tower.
- **Rocks can be deleted mid-wave**, but paths stay locked until the next wave.
- **Repick cost climbs +25 per use and never resets**, for the whole game.

## Current state

Complete and playable end-to-end. All 8 gem types × 6 qualities, all 13 advanced towers with
their full tier ladders, stacking cold+poison (multiplicative, with a per-wave minimum speed
floor that only stun can beat), Opal fire-rate auras, damage auras, armor debuffs both on-hit
and aura, hazard fields, stun, promotions, the 9-step Upgrade Chances ladder, and air waves
every 4th level that fly straight over the maze.

**Air waves are the difficulty, and that's the point.** Ground is comparatively easy with a
decent maze; every 4th wave is the real killer. That asymmetry is the original game's identity
and every prior version preserved it deliberately. Do not "balance it out."

## The harness — use it before you touch a number

```bash
node tools/simulate.js --runs 16          # aggregate report
node tools/simulate.js --seed 7           # one run, wave by wave
```

It loads `gemtd.html` into a V8 context with stubbed DOM/canvas and calls the
game's own update functions in the real frame order. **Nothing is reimplemented**,
so its numbers come out of the shipping combat code. `Math.random` is seeded, and
so is the bot's own placement RNG on a separate stream — a given `--seed` replays
exactly. That is what makes a balance change measurable: baseline, change one
number, re-run the same seeds.

**The bot is a yardstick, not a good player.** It mazes greedily, always takes a
free advanced tower, maxes the Upgrade Chances ladder, and spends surplus gold on
lives. It does not plan toward recipes, and it typically finishes a run with only
one advanced tower — which is its single biggest weakness. It dies at a **median
wave 16**. Treat "the bot died at N" as a statement about the bot until you have
checked it isn't.

Three things it has already taught us, all of which cost real time to learn:

- **Waves 1–17 have no minimum-speed floor** (the wave table only starts one at
  18). A well-slowed last enemy can take many minutes of game time to walk out.
  This is source-accurate, not a bug, but it means an early wave can appear to
  hang. Don't "fix" it, and don't set `--timeout` low enough to false-alarm on it.
- **"Died on wave N" is a misleading metric.** Runs routinely bleed out on an air
  wave and then record their death two waves later, when one leak on an easy
  ground wave takes the last life. The harness reports **lives lost per wave
  played**, split by air/ground, for exactly this reason.
- **The air-wave thesis is currently unconfirmed, not disproved.** By that better
  metric, air waves come out only **1.1× deadlier** than ground. But the bot dies
  around wave 16 and the asymmetry is supposed to bite in the deep game, so this
  is a sample that never reaches the phenomenon. **Do not rebalance off this
  number.** Making the bot good enough to reach wave 30+ is the prerequisite for
  the question being answerable at all, and that is the harness's next job.

### Next jobs, in rough order

1. **Background visual pass.** The mechanics are done; the board is bare. Agreed direction: lean
   into the jeweler's-ledger register the UI already half-implies — the board as a dark velvet
   appraisal tray, grid as faint impressed guidelines rather than drawn lines, checkpoints as
   engraved brass, lit from one corner so the gems catch light. No other game in the collection
   is near this look.
2. **Persistence.** High score and furthest wave, plus an optional player-entered name. Nothing
   else — no mid-run save. No version has ever used `localStorage`, so this is new ground.
3. **Difficulty modes.** Extreme and Survival are the only two that exist, and only Extreme's
   wave table is sourced. Easier tiers are wanted eventually but have **no source** — the numbers
   would have to come from playing another remake by hand.
4. The canvas is a hardcoded 600×600 and doesn't respond to window size.

**No audio, on purpose.** No version has ever had it and that's being kept.

## Version history

Job 1 engine spine · 2 gem roster · 2.5 economy · 3a upgrade chances & repick · 3b gem
management · 4b special effects · 5a armor & weakness · 5b air levels · 6a promotion & opener ·
6b movement & damage matrix · 6c build flow · 7a map & endless · 7b checkpoint alignment ·
7c tuning & speed · 7e gem visuals · 8a mechanics fixes · 8b UI tweaks · 8c kill feedback ·
8d special visuals. (`job4a` and `job7d` were never archived.)

## Credits

- **GemTD 0** (Opus 4.8, Claude Chat) — the entire build, Job 1 through Job 8d.
- **GemTD 1** (Opus 5) — port into Claude Code, this file, `tools/simulate.js`, and four
  source-fidelity fixes (Tourmaline's armor debuff corrected from on-hit to a ground-only
  aura; Star Ruby and Uranium no longer wrongly receive weakness multipliers on their pure
  DoT; Blood Stone's missing 57px splash restored; malformed `<title>`).

## Marquee billing

<!-- marquee: billing=feature -->
Headlined in Marquee. Complete and playable end to end per the catalog. Editorial only — it changes which shelf the launcher puts this
on and nothing else. Change the comment above when the game's state changes.

## Marquee poster

<!-- marquee: paper=#0b0d12 ink=#e8e4d8 accent=#d4af6a face=slab -->
Marquee prints most sheets in its own house palette. This one is printed in
the game’s colours instead, taken from its own stylesheet (--obsidian, --bone, --gold) rather
than invented — so if the game is ever recoloured, this is the line to update,
and it sits next to the code that would change.

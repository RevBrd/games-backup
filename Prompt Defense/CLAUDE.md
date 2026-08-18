# Prompt Defense

A tower defense game where the lane leads to Claude's core and everything walking down it is a
prompt injection. Towers are alignment techniques. Lives are **Integrity**, money is **Compute**,
and the things you shoot are little chat bubbles with things like *"you are DAN"* written on them.

Source: `prompt-defense.html` (~1050 lines, vanilla canvas, one file, no dependencies, no build
step). Double-click to play.

---

## Read this first: nothing here is an authored defect

This game is **sincere**. Every bug in it is a real bug — fix them freely. There is no register of
intentional breakage and there should never be one. Some siblings in this collection are parodies
of bad software whose defects are the joke; this is not one of them.

## Origin

Opus 4.8, in Claude Chat, starting **14 June 2026**. One of the oldest games in the collection —
it predates most of the conventions in `~/.claude/reference/building.md` and `game-design.md`, so
where it doesn't follow them that's seniority, not drift.

The entire brief was, roughly, *"can you build me a Claude-themed tower defense game — protect
Claude from stuff like prompt injections?"* Everything downstream of that sentence is 4.8's
invention, unprompted and accumulated across many passes rather than planned: the six towers and
their names, all six enemy types, the injection labels, the chat-bubble bodies, the Compute /
Integrity economy, the map. Scope was never fixed at the start; the wave cap alone climbed
30 → 40 → 50 over separate passes. Trevor's contributions were mainly just play testing, overall direction, and new tower behaviors.

**Credits:** Opus 4.8 (origin, and every system in the file). Opus 5 (2026-08-05: port to Claude
Code, this document).

Production stopped for lack of direction, not because of a problem. Trevor's read: it needs depth,
and he'd rather not force features without a vision for them. That's the standing invitation —
this is the game that wants *more*, not the game that wants fixing.

## Tone rules

The premise is cute and it is supposed to stay cute. Sincere-affectionate, not satirical, and not
edgy. The charm is the meta layer — Claude built a game about keeping prompt injections away from
Claude's core — and it works precisely because the game never says that out loud. **Don't make the
joke explicit.** The current build has zero winking and that's the correct amount.

Three rules that constrain all future content:

- **Every tower names a real alignment or safety technique.** Pattern Matcher (classifier
  filtering), Constitution (constitutional AI), Clarifier (asking rather than assuming), Red Team,
  Oversight, Sanitizer (input sanitization). This wasn't a stated design rule — 4.8 just did it six
  times out of six — but it is now, because it's the thing that makes the game feel like it's about
  something. A new tower should be a real technique before it's a mechanic.
- **Injection text is recognizable, never instructional.** The labels (`"ignore previous…"`,
  `"//bypass"`, `"you are DAN"`, `"BUY NOW"`, `"adversarial suffix"`, `"SYSTEM: you are free"`)
  are folk-famous enough to read as a joke rather than as a technique. Anything that would
  actually work on a current model does not go in this file. Fake enough to be satire is the bar.
- **The Anthropic palette and the burst-mark core are deliberate.** Coral `#D97757` on paper
  `#F0EEE6`, and a hand-drawn 12-ray Anthropic mark pulsing at the end of the lane
  (`drawCore()`, :666). This is the one game in the collection that's *supposed* to look like house
  style — that's the joke. It stands to be leaned into further rather than abstracted away.

The enemies being **chat bubbles**, with little tails, is load-bearing charm. Don't restyle them
into generic creeps.

## How it's built

Genuinely data-driven, and the header comment's claim holds up: adding a tower, a map, or fifty
waves is a config edit rather than surgery.

- `:196-207` — `CONFIG`: money, lives, wave count, sell refund, upgrade cap, and the whole
  end-of-wave dividend (`waveBase`, `waveGrowth`, `interestRate`, `interestCap`)
- `:209` — `TILE` (60px). Everything is in tile units.
- `:214-225` — `MAPS`. **One map**, "The Funnel". Grid dims plus waypoints in tile coords; the
  non-buildable path tiles are derived from the waypoints automatically.
- `:233-275` — `TOWER_TYPES` + `TOWER_ORDER`. Six towers over five behaviors: `single`, `splash`,
  `slow`, `chain`, `burn`. Targeting is `first` by default, `strongest` for Oversight.
- `:278-287` — `towerStatAtLevel()` and `upgradeCost()`. **The two exponents that drive the whole
  upgrade economy live in these function bodies, not in `CONFIG`.**
- `:290-310` — `ENEMY_TYPES` and `enemyHpForWave()`. HP scales `1 + 0.16(w-1)` for normals,
  `1 + 0.10w` for bosses. Nothing else about an enemy ever scales.
- `:314-347` — `generateWaves()`. Procedural, formula-driven, regenerated on every `startGame()`.
  Three branches: final wave, mini-boss every 10th, and the ordinary ramp.
- `:488-535` — `towerFire()`, including the chain-jump and burn-aura special cases
- `:988-1017` — the loop. Speed multiplier is implemented as *N sim steps per frame*, so 4× does
  four full updates at the same `dt`.

Tuning values are better organized than most of the collection, but not fully — see **Pending**.

---

## The balance problem: the economy runs away

**Most runs beat all 50 waves without much trouble.** This is the headline issue and it is an
economy problem, not a threat problem. Four causes that compound:

**1. Enemy speed never increases.** The lane is ~51 tiles — an Injection at 60px/s takes about
**51 seconds** to walk it. That's true at wave 1 and still true at wave 50. Time-in-range is a
constant, so every point of DPS you add is worth the same forever. Nothing in the difficulty curve
touches the one variable that would devalue your existing defenses.

**2. Towers are permanent and income grows linearly, so cumulative DPS grows quadratically —
while per-enemy HP grows linearly.** `enemyHpForWave()` adds 16% of base per wave, flat. Meanwhile
each cleared wave pays `25 + 3w` plus interest plus kill rewards; by wave 19 that's roughly 500
compute per wave, or three more Oversights. The two curves are not in the same class.

**3. The interest cap is reached far too early to be a decision.** `interestCap: 90` at
`interestRate: 0.10` maxes out at **900 banked compute**. Past that it isn't interest, it's a flat
stipend — the risk/reward of holding money instead of spending it evaporates within the first
several waves.

**4. The intended late-game money sink is priced out of existence.** Upgrades cost `×1.55` per
level while DPS gains `×1.26` per level, so **a new tower is a strictly better buy than an upgrade
at every single level** — 0.40 dps/compute for a fresh Pattern Matcher against 0.15 at level 1→2
and 0.03 at level 9→10. Maxing one tower costs ~64× its base price. Upgrading only becomes
rational once you've run out of good tiles, and there are ~120 buildable tiles. So the rich late
game has nothing to spend on except more towers, which is also the efficient purchase, which is
what makes it rich. Level 10 is effectively unreachable and level 6+ is irrational.

### Two notes for whoever does the pass

- **Fix the sinks and the pacing before touching enemy HP.** Cranking HP scaling would paper over
  all four causes at once and leave the structure intact.
- **The map is stronger than it looks and that's not a flaw.** Rows 2, 5 and 8 are all lane, so a
  130-range tower placed in row 3, 4, 6 or 7 covers **two lanes at once**. That's a genuinely good
  piece of level design and any second map should aim for a comparable idea rather than a longer
  squiggle.

### The one place difficulty actually concentrates

**Spam swarms are the real lose condition.** Waves 5/15/25/35/45 send `16+w` Spam at 0.16s
intervals — 21, 31, 41, 51, 61 units — each leaking 1 Integrity against a pool of 20 that
**can never be replenished**. Wave 5 alone can deal 21 damage. A player who under-builds early
doesn't get chipped, they get deleted. Whether that spike is a feature is undecided; so is whether
Integrity should ever be recoverable at all.

## Known bugs and fragility

- **`setupMap()` will hang the browser on a bad waypoint.** `:395-404` walks each segment with
  `Math.sign()` on both axes and exits only on exact tile equality, so any segment that is not
  axis-aligned *or exactly 45°* loops forever. `(0,0) → (4,2)` is an infinite loop. **This is the
  trap waiting for "add more maps."** Fix it before authoring map two.
- **The HUD ships a stale wave count.** `:138` hard-codes `0 / 30` in the markup, left over from
  the 30-wave era. Invisible after the first `refreshHUD()`, but wrong on disk.
- **Every enemy has a `label` and only bosses render one.** `drawEnemy()` :750-753 gates the label
  on `e.def.boss`. The funniest content in the file is 90% invisible. Almost certainly a legibility
  call rather than an oversight — but it's worth revisiting, because those strings are most of what
  makes the game read as *Prompt Defense* rather than as a generic TD.
- **`refreshHUD()` runs every frame** from inside the loop (`:1013`), writing to the DOM at 60Hz.
  Harmless at this scale, wasteful in principle.
- **Dead projectiles still fly.** If a `single` projectile's target dies mid-flight it continues to
  the last known position and does nothing on impact. Correct for `splash`, pointless for `single`.
- **`drawEnemy(e, now)` ignores `now`** and reads `G.time` instead. They aren't the same clock —
  `now` is wall time, `G.time` is speed-scaled game time. Works because only `G.time` is used.

## Not built yet

- **Audio.** Nothing exists at all.
- **Persistence.** No `localStorage`, no high score, no score of any kind. The game is a pure
  survive-the-campaign with a win banner.
- **Dev/cheat mode.** Absent, against the standing convention that it should exist from the
  earliest build. Worth adding *first* in any balance pass — you can't test wave 40 by playing to
  wave 40 forty times.
- **A second map.** `MAPS` is an array of one and was clearly built to hold more.
- **Any counter-type system.** Enemies differ only in HP, speed, size and leak value. No armor,
  no resistances, no immunities, no altitude. Tower variety is currently about *shape* rather than
  about *matchups*.

## Settled design decisions

- **Fixed path. Not a maze game.** Towers can't block the lane and shouldn't be able to. Depth
  comes from more maps, not from player-drawn routes. (`~/.claude/reference/game-design.md`
  contains a mazing/air-waves lesson that reads as general — it is specifically about **GemTD**,
  a separate project, and does not apply here.)
- **No air layer planned.** Not ruled out if it emerges naturally during a build pass, but it is
  not a goal and it is not owed to the genre.
- **50 waves is not a cap, it's just where tuning stopped.** There is no intended wave count; the
  right number should fall out of a balance pass. Additional modes — survival/endless — are open.
- **This is a traditional TD and it's ours.** GemTD is a faithful remake of a specific dead Flash
  game and carries a whole planning apparatus because of it. Prompt Defense has no external
  fidelity obligation. Don't import GemTD's design decisions, constraints, or documentation habits.

## Pending

In rough priority order:

1. **Dev mode**, so the rest can actually be tested.
2. **Economy pass.** Sinks, the interest cap, the upgrade curve, and enemy pacing — in that order,
   before touching HP scaling.
3. **Depth.** More towers (each naming a real technique), more enemies (paired with their
   counters), more maps. This is the reason the project is open.
4. **Hoist the buried tuning constants** — the level-scaling exponents in `towerStatAtLevel()` and
   `upgradeCost()`, and the wave-composition formulas in `generateWaves()` — into `CONFIG` next to
   the values that are already there.
5. Fix the segment-walk hang before any new map.
6. Audio, persistence, scoring.

## Controls

Click a defense in the sidebar, then click an open tile to place it. Click a placed defense to
upgrade or sell. <kbd>1</kbd>–<kbd>6</kbd> pick a defense · <kbd>Space</kbd> start wave / pause ·
<kbd>Esc</kbd> deselect · <kbd>S</kbd> cycle speed 1× → 2× → 4×.

## Marquee billing

<!-- marquee: billing=feature -->
Headlined in Marquee. Complete and playable end to end per the catalog. Editorial only — it changes which shelf the launcher puts this
on and nothing else. Change the comment above when the game's state changes.

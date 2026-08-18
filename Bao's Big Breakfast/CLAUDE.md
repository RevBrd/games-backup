# Bao's Big Breakfast

A cutesy platformer built on Super Mario Bros. world 1. Made **for a friend of Trevor's**, not from
Trevor's own vision — so treat direction on this one as coming through her rather than from him,
and expect the brief and conventions to shift more than usual.

File: [baos-big-breakfast.html](baos-big-breakfast.html) — single self-contained file, no deps,
runs by double-clicking. [tools/autopilot.js](tools/autopilot.js) is the test harness and is not
shipped; see **Validation**.

**This game is sincere. Every defect in it is a real defect — fix them freely.** There is no
authored-bug register here and no joke that depends on looking broken.

## Premise

A very small steamed bun on a very large kitchen counter at sunrise. The whole skin runs on one
conceit — *tiny creature, enormous everyday objects* — and that scale gag is what keeps it from
being generic pastel cute. Keep new art inside it.

| Mario thing | Here |
|---|---|
| Mario | **Bao**, a steamed bun with a leaf sprout |
| Super Mushroom / Fire Flower | **Butter Pat** (big) / **Berry Jam Jar** (throws blobs) |
| Starman | **Sprinkle Star** |
| Coins | **Honey drops** (100 = 1UP) |
| Goomba | **Yolkling** — a wobbling fried egg. Stomps flat. |
| Koopa | **Cubie** — a sugar cube. Stomped → a slidable shell that wakes back up. |
| Piranha Plant | **Straw Sprout** — a mint sprig in the straw |
| Brick / `?` block | Waffle square / jam-jar lid |
| Pipes | Green bendy drinking straws |
| Ground | Wooden cutting board |
| Flagpole → castle | Bamboo skewer with a cherry → **a toaster you walk into** |
| Clouds / hills / bushes | Steam puffs / dough mounds / parsley |
| Underground (1-2) | **The cupboard under the counter** — see below |
| Lift platforms | **Crackers** |

World label is "COUNTER", then the level number. Win text is "TOASTY!".

## What's actually in it

Two levels, start to finish, with the win sequence and progression between them. Small/big/jam
power states, damage and shrink, stomp chains, shell kicking, brick breaking when big, hidden 1UP
blocks, invincibility star, one-way moving platforms, lives, timer, score, time bonus. Procedural
WebAudio SFX plus two short original loops, one per theme (`M` mutes music, `N` mutes SFX).
Everything is drawn at runtime — sprites are authored as character grids baked to offscreen
canvases at boot, tiles and backdrops are procedural.

Power carries forward when you clear a level; dying always drops you back to small and replays the
level you were on.

## Counter 1-2, the cupboard

The only place under a kitchen counter is the cupboard, so 1-2 is the underground level: Bao falls
through a gap in the boards into the dark and walks out the cupboard door at the far end. What
carries it is silhouette — tins, a flour sack and a bottle the size of buildings, rim-lit from the
door — plus two shafts of light through holes in the counter overhead.

Both themes run the **same tile-drawing code with a different palette** (`PAL` / `PAL_DARK`), baked
once into `TILESETS.counter` and `TILESETS.cupboard`. That is deliberate: the cupboard cannot drift
away from the counter by accident. `LEVEL.theme` picks the tileset, the backdrop and the music.

New to this level:

- **The counter overhead is a real solid ceiling** (rows 0-2), with holes where the light comes in.
- **The low tunnel at x=59** — two tiles of headroom. Walk through it or run along the roof; both
  are real routes and the roof route has the honey drops on it.
- **Cracker lifts** — one-way moving platforms. `LEVEL.lifts` entries are
  `[x, y, wTiles, mode, a, b, speed]`, all in tiles; mode `h` patrols x between a and b, `v`
  patrols y.
- **No straw sprouts in the dark on purpose.** The one sprig is the straw at x=180, standing in
  the light from the open door. It is internal logic, not an oversight — don't "fix" it.

## Fidelity: physics real, layout approximate

Deliberate split, worth preserving:

- **Physics is the faithful part.** Separate walk/run acceleration, skid deceleration, and the two
  different gravity values depending on whether jump is held. Measured against the original:
  walk caps 1.56 px/f, dash 2.62, standing jump ~4.4 tiles, running jump ~5.1.
- **Layout is a reconstruction by beat, not by tile.** The lone `?`, the five-block row, four
  straws of rising height, three pits, twin pyramids, the eight-step climb. Spacing was tuned to
  the physics above, *not* measured from the ROM. Don't claim it's tile-accurate.

## Rules that bit once already

- **Row 9 is the low shelf, row 5 is the high shelf.** A standing jump cannot reach row 5 from the
  counter — that needs ~6 tiles of lift and you have 4.4. Anything on row 5 must sit directly
  above a row-9 block or be a walk-on canopy entered from a neighbouring shelf. The first draft
  put a whole coin run up there that no player could ever have reached.
- **A standing jump must clear a 4-tile straw from a dead stop.** Walk into one flush and you have
  no run-up; if `jumpBase` drops below ~4.7 you are stranded and have to back up. This is what
  sets that constant — don't lower it without re-checking.
- **The skewer column is deliberately not solid.** A solid base block stops Bao a few pixels short
  of the grab trigger and the level silently becomes uncompletable.
- **Draw the background outside the camera translate.** It is in screen space and does its own
  parallax from `world.camX`; move it inside the translate and it only clears 256px of world,
  which smears the whole screen.
- **Boxes resting exactly on a tile boundary don't overlap it.** `moveBox` probes a pixel below and
  snaps, otherwise `grounded` flickers every other frame.
- **Lifts must move before the player, and stamp `prevX/prevY` before they do.** `updateLifts()`
  runs first in `step()` for exactly this reason. Move them inside `updateEntities` — i.e. after
  him — and a descending platform leaves a one-frame hole under his feet every frame. The landing
  test also needs its few pixels of slack for the same reason; don't tighten it to an exact
  comparison.
- **Under a row-2 ceiling, row 5 is the highest standable row.** Row 4 leaves 16px of headroom,
  which fits small Bao and *not* big Bao — he would be stuck. Row 3 is flush against the ceiling
  and fits nobody.
- **The lift crossing runs at counter height (row 13) on purpose.** Every earlier version had the
  lifts a tile or two up, which turned each transition into a precision jump onto a moving 3-tile
  platform over a bottomless drop — repeatedly unclearable, and wrong for this game besides. Flat
  makes it a matter of timing your step. If you raise them, re-run the autopilot and expect it to
  fail. Four tiles wide, also on purpose: you arrive at a dead run and need room to stop.
- **In the cupboard a pit needs to be drawn dark or it does not read.** Outdoors you see sky
  through a hole; against a dark backdrop a missing floor looks exactly like shadow on the floor.
  `drawBackgroundCupboard` lays a near-black band below the shelf line for this.

## Layout of the file

Numbered sections in order: TUNING → LEVELS → palettes → pixel art → tile atlas → world → entities →
player → session → input → audio → collision → block interactions → player update → entity update →
camera/step → render → main loop → boot.

`TUNE` and `LEVELS` are both at the very top and are the only things worth editing to change how it
plays. Levels are `LEVEL_1_1` and `LEVEL_1_2` collected into `LEVELS`; `LEVEL` is a mutable pointer
at the current one and **only `loadLevel()` may move it**, because the tileset has to change with
it. The full field list is documented in the comment above `LEVEL_1_1`. Adding a 1-3 should be a
data change plus one row in `LEVELS`.

`window.BAO` exposes world/player/game/TUNE/dev, the tile helpers, and `step()` for console poking
— the test harness drives the game entirely through those.

## Dev mode

Backquote (`` ` ``) opens the Kitchen Inspector: position, velocity, state, timers, entity counts,
fps, current level, and hitbox overlay. Then `I` invincible, `O` cycle power, `H` hitboxes,
`G` slow-mo, `L` +life, `T` +time, `R` restart, `[` `]` warp a screen, `1`/`2` jump to a level.

## Validation

No Node on this machine, and the game needs a real canvas at boot, so validation drives the live
page. Open the game in a browser, open the console, paste [tools/autopilot.js](tools/autopilot.js),
then `BAOTEST.all()`. It checks the speed caps and jump heights against the numbers above, checks
that a rider stays glued to a moving platform, and autopilots both levels end to end.

**Re-run it after any change to `TUNE` or to a `LEVEL`** — it is the regression test that catches a
level that has silently become impossible, which has happened more than once here.

The autopilot is a dumb heuristic bot, not a good player, and several of its rules exist only
because it kept killing itself: tap short hops rather than holding the full arc, take a run-up
before leaving a platform, never take an enemy-avoidance jump toward a drop it cannot clear. When
a run fails, use `BAOTEST.play(1, {traceFrom: 130})` and read `.trace` rather than guessing — the
trace prints the decision and the reachability numbers every frame. And do check whether the level
or the bot is at fault; it has genuinely been each of them.

## Not done yet

- Two levels. No 1-3, no warp zones, no bonus rooms — though the pieces for a bonus room (a warp
  entity plus a camera reset) are the obvious next mechanic.
- No pause menu, no persistence, no mobile/touch controls.
- Balance numbers are placeholders and have had no holistic pass.
- 1-2's enemy placement is sparser than 1-1's and has not been tuned against the two routes.

## Credits

- The game, 1-1, the physics and the art — built with Claude (model not recorded at the time).
- Counter 1-2, the cupboard theme, the lift platforms, level progression and
  [tools/autopilot.js](tools/autopilot.js) — Claude Opus 5, 2026-08-06.

## Marquee billing

<!-- marquee: billing=feature -->
Headlined in Marquee. Complete and playable end to end per the catalog. Editorial only — it changes which shelf the launcher puts this
on and nothing else. Change the comment above when the game's state changes.

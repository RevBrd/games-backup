# Bao's Big Breakfast

A cutesy platformer built on Super Mario Bros. 1-1. Made **for a friend of Trevor's**, not from
Trevor's own vision — so treat direction on this one as coming through her rather than from him,
and expect the brief and conventions to shift more than usual.

File: [baos-big-breakfast.html](baos-big-breakfast.html) — single self-contained file, no deps,
runs by double-clicking.

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

World label is "COUNTER 1-1". Win text is "TOASTY!".

## What's actually in it

One level, start to finish, with the win sequence. Small/big/jam power states, damage and shrink,
stomp chains, shell kicking, brick breaking when big, a hidden 1UP block, invincibility star,
lives, timer, score, time bonus. Procedural WebAudio SFX plus a short original loop (`M` mutes
music, `N` mutes SFX). Everything is drawn at runtime — sprites are authored as character grids
baked to offscreen canvases at boot, tiles are procedural.

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

## Layout of the file

Numbered sections in order: TUNING → LEVEL → palette → pixel art → tile atlas → world → entities →
player → session → input → audio → collision → block interactions → player update → entity update →
camera/step → render → main loop → boot.

`TUNE` and `LEVEL` are both at the very top and are the only things worth editing to change how it
plays. `window.BAO` exposes world/player/game/TUNE/dev and `step()` for console poking — the
headless harness drives the game through those.

## Dev mode

Backquote (`` ` ``) opens the Kitchen Inspector: position, velocity, state, timers, entity counts,
fps, and hitbox overlay. Then `I` invincible, `O` cycle power, `H` hitboxes, `G` slow-mo, `L` +life,
`T` +time, `R` restart, `[` `]` warp a screen.

## Validation

No Node on this machine. Validated instead by driving the live page through `window.BAO`: unit-ish
checks on speed caps and jump heights, isolated tests for every powerup/damage/stomp/kick path, and
an autopilot that plays the level end-to-end and must reach the pole. Re-run that autopilot after
any change to `TUNE` or `LEVEL` — it is the regression test that catches an unreachable level.

## Not done yet

- Only one level. No 1-2, no underground, no warp zones.
- No pause menu, no persistence, no mobile/touch controls.
- Balance numbers are placeholders and have had no holistic pass.
- The folder is still named `Untitled` — rename when the game's name is settled.

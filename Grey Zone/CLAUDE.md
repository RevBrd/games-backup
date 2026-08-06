# Grey Zone

An artillery duel in which the shooting is the easy part and **seeing is the whole game**. You
are a fixed gun. Somewhere in the right 60% of the field is another one. You cannot move, cannot
dodge, and cannot see it. It is already ranging you in. Find it first.

Sincere throughout. **There are no authored defects in this game** — every bug is a real bug, fix
it freely.

Single self-contained file, no build step: `grey_zone.html`. Double-click to play.

---

## The thesis

Modern war, drawn from Russo-Ukrainian imagery, with no side named because which side you are
doesn't matter. "Grey zone" is the current name for No Man's Land.

The reference image is a tank reversed into a dug revetment in a snowy pine wood, camo netting
strung overhead, crew working under it. It is not hidden because it is fast. It is hidden because
nobody has looked at it yet, and the moment somebody does it is dead. **That is the entire design.**

Consequences that are not up for renegotiation:

- **The player never moves.** Immobility is the thesis, not a limitation to be engineered away.
  Shoot-and-scoot would be a fine mechanic in a different game; here it is the wrong game.
- **Both sides are the same kind of thing** — a dug-in gun that can't run. Long-term goal is full
  symmetry between player and CPU so the game could eventually be built into PvP. Prefer
  mechanisms that could run for either side over ones that only work because the CPU is scenery.
- **Nobody is depicted.** No faces, no infantry, no flags, no casualty language. The opponent is
  an arrival rate. Keep it that way.
- **Cold, quiet, instrument-forward.** Olive and ash on near-black, monospace, faint scanlines,
  corner brackets. All text is radio-procedural — `TARGET UNKNOWN`, `SIGNAL LOST — DRONE JAMMED`.
  No score popups, no exclamation marks, no personality in the HUD.

## What the game does that's worth protecting

1. **Fog is per-column and sensor-driven** (`explored`/`liveStr`, `computeFog`, `vis`). You see
   only what your own optics or your drone cover *right now*; everything you've ever covered stays
   dimly explored. Terrain, trees, craters, shells and even your own explosions are all gated
   through `vis()`.
2. **Your shells only teach you something if you were watching them land.** `playerShellImpact`
   only pushes a ranging mark when `liveStr` at the impact point clears 0.12. Firing blind into
   the dark produces nothing — no splash, no grid, no correction. This is the best idea in the file.
3. **Concealment is destructible.** The enemy sits in a wood. Intact canopy multiplies detection
   down to ~8% (`CONCEAL_WEIGHT:0.92`), so the loop is: shell the treeline blind to fell trees,
   *then* the drone can resolve what's under it. Bombardment as a reconnaissance act.
4. **Optics cost something.** Fidelity is `(REF_ALT/alt)^FALLOFF`, falling off again toward the
   cone edge. High altitude sees a wide strip badly; low sees a narrow strip well. The EW station
   makes that a real dilemma by killing drones below its ceiling.
5. **Ranging marks read as corrections, not scores** — `GRID 14` until the target is confirmed,
   then `+180 OVER` / `-95 SHORT` / `ON TARGET`.

## How a match plays

`fresh()` randomises enemy position, terrain, woods, wind, and an EW station offset to one side
of the enemy. Then, in practice:

- Launch the drone (`E`), fly it right (arrows, or click the field to send it), find the woods.
- Shell the woods blind at 5s reload to strip cover. Watch for felled trees inside your coverage.
- Detection accumulates while the drone holds the enemy in its cone. At 100% you get
  `TARGET ACQUIRED` — the emplacement is drawn, HP pips appear, and your marks start reporting
  over/short.
- Meanwhile the enemy walks its fire onto you: `SEARCHING` → `RANGING YOU IN` → `DIALED IN`.
- Two near-direct hits kill it (`MAX_DMG:58` vs `ENEMY_HP:100`).

The EW station is the side puzzle: it kills any drone within 330 of it below 620m altitude, so you
either climb over it at terrible fidelity or shell the mast (`EW.HP:130`) to clear the spectrum.
Its mast is tall enough that it's spotted the moment it enters coverage — it cannot hide.

## Where things are

All in `grey_zone.html`, one script block, roughly in this order:

The source was reflowed on 2026-08-05 — it was written hand-minified in Chat artifact style, which
made targeted edits fragile. Formatting only; behavior is unchanged and was verified. Every
`/* ---------- name ---------- */` banner is a section marker, so grep for those rather than
trusting these line numbers after any edit.

| Region | Contents |
|-|-|
| `CONFIG` (68) | Every tunable. `C`, `D` (drone), `EN` (enemy) aliases below it |
| terrain (128) | `genTerrain`, `surfaceY`, `crater`, `flattenAround` — 240-sample heightfield |
| woods (177) | `genTrees`, `countConceal`, `recomputeConceal` — one wood guaranteed on the enemy |
| fog (226) | `addCircle`, `computeFog`, `vis` |
| `fresh()` (249) | Match setup and full state reset |
| drone (279) | `toggleDrone`, `nudgeAlt`; the flight/battery/detection update lives in `step` |
| firing (305) | `fire`, `blast`, `playerShellImpact`, `enemyShellImpact`, `enemyFire` |
| `step()` (399) | Fixed 1/120 timestep, 4x substepped ballistics |
| drawing (541) | Painter's order is set in `frame()`; trees deliberately draw *behind* terrain |
| `hud()` (929) | Threat bar, gun telemetry, drone panel, toasts, end card |
| input (1197) | `A/D` elev, `W/S` charge, `SPACE` fire, `E` drone, arrows fly it, `R` resets |

The game is driveable from the console for testing — `step(C.DT)` advances one tick, `fresh()`
resets, and every draw function can be called standalone. Running a few thousand ticks headless
is a much better check than a screenshot.

`R` for a new engagement is real but undocumented in the hint bar.

## Design history

Built by **Opus 4.8** across three jobs in a single Claude Chat session, before the backup
convention existed. **The earlier job files were overwritten and are gone** — there is nothing to
recover or preserve, and this file is the only record.

It began as "Tanks, but modern" and was boring. The shape arrived in pieces rather than all at
once; terrain concealment — now the core of the whole thing — was only conceived in Job 3.

### The counterbattery mechanic: pulled, not rejected

**Read this before touching the enemy AI.** The current enemy is explicitly labelled a "dumb
placeholder" in the source header, and it is: `enemyFire()` is driven purely by `matchTime`. It
does not know you exist. It cannot see your muzzle flashes, doesn't care whether you've fired at
all, and cannot be interfered with.

The correct version — **the enemy ranges you in by observing your muzzle flashes, so firing is
what gets you killed and concealment cuts both ways** — was already built once and then torn back
out. It was removed because it killed Trevor too fast to playtest anything else, at a time when
the game had no dev mode. It was pulled for ergonomics. **It was not judged a bad idea, and it is
the intended destination.** Rebuild it, but land a dev mode in the same job so tuning doesn't
require dying.

Dev mode is a loose house convention: Æthermoor toggles a readout with backtick, DRIFT hides one
behind the konami code. Backtick is the better fit here.

### Two disabled features

`SHOW_SECTOR:false` and `SHOW_EW_FIELD:false` each switch off working, fully-written draw code.
Trevor doesn't remember turning them off; both were training wheels.

- **`drawSector`** drew a dashed `SUSPECTED HOSTILE SECTOR` band across a ±340-520 window around
  the enemy. It hands you the answer and defeats the premise. **Recommend deleting it outright**,
  along with `state.sector` and the `SECTOR_MIN/MAX` naming that implies it still matters.
- **`drawEW`'s field overlay** drew the jamming boundary as a purple box once the station was
  spotted. Worth keeping as a flag: without it, you learn the field's extent by losing drones to
  it, softened only by the `SIGNAL DEGRADING — JAMMING NEAR` warning at 1.25x range. That's a
  legitimate difficulty knob, not a training wheel.

## Current state and known gaps

Playable end-to-end and winnable, but **not yet a real contest** — the AI and the combat both have
distance to travel. Trevor is not treating win/loss as meaningful yet.

Unbuilt: audio, persistence, progression, any menu or difficulty selection, enemy drone, enemy EW,
any weapon other than the standard shell, mobile-native drone controls (flying is arrow-keys or
click-to-send; the on-screen bar only does altitude).

### Numbers that look wrong

Found by reading, not by playtesting — verify by feel before acting:

- **`enemyFire()` clamps its aimpoint to a minimum of x=90 while scattering ±900 around your
  x=230.** Early in a match roughly half of all incoming is clipped onto that one spot, 140m short
  of you and harmlessly outside `SPLASH:90`. It reads as a stack of shells hitting the same patch
  of dirt.
- **The race isn't a race.** First shell lands at t≈22s, cadence ≈22s, fully dialed at t≈86s.
  Once dialed, expected damage is ~13 per shell against 100 HP, putting death somewhere near the
  four-minute mark — and the drone-and-treeline loop resolves well inside that.
- **Enemy shells ignore wind.** `step()` applies `wind` to the player's shell only. May be a
  deliberate simplification; it does break symmetry, which matters given the PvP goal.
- **`state.detect` never decays**, so detection banks across sorties: recall, recharge, relaunch,
  resume where you left off. Undecided whether that's mercy or a leak.
- **Concealment is weaker than it looks, and the EW station is what actually enforces the loop.**
  Measured: under fully intact canopy the detection rate is 0.044/sec, so a drone loitering
  directly over the enemy at 200m acquires in ~23s — inside a single 31s battery. You can skip
  the shell-the-treeline step entirely. What stops you is that the EW station spawns 180-340 from
  the enemy with a 330 field, so the low-altitude hover that makes canopy irrelevant is usually
  the exact spot that kills drones. The concealment mechanic is being carried by the jammer.
  Worth deciding whether that's an elegant interlock or an accident to be fixed at the source.

## Direction

Nothing here is committed yet.

- **Symmetry first.** Every new system should be answerable in the CPU's hands as well as the
  player's, because the long-term target is a shared engine and eventually PvP.
- **Progression and an arsenal.** Trevor wants the Tanks-lineage idea of purchasable ordnance —
  where the originals had rocket launchers and nukes, this wants FPV drones and similar. Nothing
  designed yet, and the fog/recon loop should shape it rather than the other way around.
- Keep the field-of-view economy central. Anything that lets you skip the seeing is a mistake.

## Family

Grey Zone is the second of two Tanks descendants here; the first is **Arcane Artillery** (wizards,
still a `.jsx`, no directory entry yet). Trevor names **Afterglow** as its closest thematic
sibling — that connection isn't documented yet and neither game has a `CLAUDE.md`.

**Grey Zone is not Salient.** Salient is WW1 trench defence from a map table, where artillery is
background. Different war, different register, different scale. Do not let them converge.

## Credits

- **Opus 4.8** — original concept, title, and the entire build across three jobs.
- **Opus 5** — this file (2026-08-05).

Per collection convention, the creating instance picks the title, and this one is Opus 4.8's:
"grey zone" is what No Man's Land is called now.

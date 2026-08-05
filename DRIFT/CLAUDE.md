# DRIFT

Asteroids where your gun is also a thruster. No brakes, no friction worth the name, and every
shot you fire shoves you the other way. Aiming and moving are the same decision.

**This game is sincere. Its bugs are real bugs — fix them freely.** There is no register of
authored defects here and there should never be one. Everything odd in this file is either
deliberate design (documented below) or a genuine mistake worth fixing.

## Origin

Trevor opened a session with Opus 4.8 and sent exactly this:

> "I have 28% of my 5 hour token limit remaining and 18 minutes to use it before it resets. Can
> you build me an arcade-style artifact game? I won't be more descriptive than that, you have
> complete artistic liberty in every single direction."

What came back was Asteroids with recoil. Trevor liked it enough to keep building on it for
weeks — and **the entire file is that same 4.8 session**, carried across at least four context
compactions. The project was never handed to a fresh model; by the fourth compaction it wasn't
really the same context anymore, but the continuity was kept on purpose.

Several conventions in `Projects/Games/CLAUDE.md` were written *after* this game and partly
because of it. Where DRIFT doesn't match them, that's usually seniority rather than drift.

**Credits:** Opus 4.8 (origin, and every system in the file). Opus 5 (2026-08-03: port to Claude
Code, this document, score persistence, responsive canvas, HUD outage escalation).

## The one untouchable thing

`fire()` applies recoil opposite the shot direction. That is the 18-minute invention and the
reason the game exists. Its values, method, and feel are all original 4.8 and have **never been
adjusted** — treat `rec`, the `0.16` thrust, and the `0.992` drag as load-bearing constants, not
tuning knobs.

Bullets also inherit 40% of ship velocity (`+ship.vx*0.4`). That part is Trevor's, added later
for *visual coherence* — shots looked wrong flying off a moving ship — not for gameplay. Worth
knowing the two halves have different authors and different intents.

## Modes

One engine, four configs in the `MODES` table. Adding a mode should mean adding a row.

| Mode | Keys | Shape |
|---|---|---|
| **DRIFT** | 1 | The real game. Fuel, drops, hazards, 3 lives, one of each weapon, death wipes the rack |
| **CLASSIC** | 2 | Just you and the rocks. No fuel, no drops, no hazards, no pulse |
| **SURVIVAL** | 3 | **No guns at all.** One life, dodge until you die. Rocks leave instead of wrapping. Scored in time |
| **RIDICULOUS** | 4 | 1 life, weapons stack to 3 each, everything at once |

SURVIVAL's spareness is intentional and should stay — it's a pure test of piloting, deliberately
stripped of every system the other modes add. It is not an underbuilt mode. Don't "finish" it.

## Systems that carry the design

- **The pulse is a Faustian bargain that ratchets.** Screen-clearing bomb, `PULSE_R` 170. Backfire
  risk starts at 12%, climbs 4% every time you fire it *and* every time you die holding it, caps
  at 75%, and **never resets inside a run**. Backfiring kills you and comes apart into the ship's
  three actual triangle edges, tumbling. The one-way ratchet is the point — don't add a decay.
- **The pulse blinds you, and the blindness escalates too.** Firing it takes the HUD out: a total
  blackout, then a flickering recovery that speeds up and brightens as it heals, with
  character-level scrambling in one of three styles. **This is the second ratchet.** Every firing
  in a run lengthens both the blackout and the recovery — `PULSE_HUD_ESC`, +0.2s per use, capped
  at 6 uses. Unescalated it's 1.5s dark inside 3.0–4.5s total; fully escalated, 2.7s dark inside
  5.4–8.1s.

  The two ratchets are deliberately different in kind: **risk is a gamble, outage is a
  certainty.** One you talk yourself into, the other you budget for. Keep them distinct if you
  tune either.

  Three rules this must keep:
  - **It takes the HUD, never the playfield.** Rocks, ship and hazards render normally throughout.
    What you lose is the fuel gauge and pulse readout. That's what makes the escalation affordable;
    if you ever make it dim the playfield, the whole cost calculation changes.
  - **The escalation is added to the random spread, not swapped for a fixed value.** Individual
    outages stay noisy and non-monotonic on purpose — the distribution shifts, the shape doesn't.
  - **`hudZap()` never shortens a disruption already running.** Without that guard a pulsar hit
    (a flat 150-frame zap) landing on a heavily-escalated outage would *reduce* it. That was a
    real bug — being hit used to be gentler than firing voluntarily.
- **A backfire hands you a clean ship.** The zap is applied before the risk is rolled, so on a
  backfire `hudClear()` cancels it: the hull that was blinded no longer exists, and the
  replacement arrives with working instruments regardless of how far escalation had gone. The
  escalation counter itself does *not* reset — only `startGame()` clears it.
- **Getting stronger costs you points.** `scoreMult()` docks 15% per held weapon in DRIFT, 5% in
  RIDICULOUS (which caps at 9 stacks). Death wipes the rack. Score chase and power chase pull
  against each other permanently. Recently raised from 10% because late waves were minting points;
  the mechanic is settled, the exact values are still fair game.
- **Hazards ladder in, each with a warning and a guaranteed debut.** Gravity well (wave 7), solar
  flare (9), pulsar (13), comet (15). `introTick()` guarantees each one debuts the first wave it's
  eligible rather than leaving the first encounter to dice. Max two live at once (`HAZ_CAP`), one
  warning label at a time.
- **Rocks ladder the same way.** Big at wave 3, iron at 5, shielded at 11 — and `spawnWave()`
  forces the first few rocks of a wave to each newly unlocked type so it actually shows up when it
  unlocks. Iron and shielded rocks split into iron and shielded children.
- **The pulsar is the most elaborate hazard.** Cycles gravity across its 4s burst timer, fires a
  repulse wave that frees rocks from gravity for 5s, and on a hit disables the ship for 2.5s with
  a *"REBOOTING SYSTEMS, PLEASE STAND BY"* progress bar. It also auto-fires your pulse if charged,
  which can backfire and kill you — `pulsarHit()` handles that case explicitly, don't unpick it.
- **Fuel makes the gun a maneuvering tool.** Thrust is the only thing that burns fuel. At empty the
  HUD reads *"NO FUEL — fire to maneuver"* and it means it literally: recoil is your only
  remaining control authority.
- **Ranks are sci-fi pilots, worst to best.** Zap Brannigan through Rick Sanchez at 200k.
  `nextRankInfo()` deliberately returns null past 150k so the top rank stays a secret.

## Not built yet

- **Audio.** Nothing exists. The intent is deliberately minimal and diegetic — only what you'd
  hear from *inside* the ship. A muted weapon report, a crash when you hit a rock. Not an arcade
  soundscape. This is now the largest unbuilt feature.
- **RIDICULOUS needs quality passes.** It got neglected during the build and hasn't had real
  playtesting. Most likely place to find genuine balance problems.
- Visual fine-tuning, unspecified.

## Persistence

`loadBests()` / `saveBests()`, key `drift.bests.v1`. Written only on game over and only when
`devUnlocked` is false, so dev runs still never record. Three things to preserve if you touch it:

- **SURVIVAL stores its best as *frames*** in the same `.score` field the other modes use for
  points; `fmtTime()` is what makes it a clock. Any serializer or leaderboard that treats all four
  modes uniformly will produce nonsense.
- **The load path copies field by field and validates types**, so a corrupt, hand-edited or
  future-version blob can't inject keys or push `NaN` into live state. Don't replace it with
  `Object.assign`.
- **Refused storage and corrupt data are different failures with different recoveries.** If
  storage itself throws, `saveOK` goes false and the game-over screen says so rather than losing
  runs silently. If only the *data* is junk, storage still works — keep defaults and let the next
  save overwrite. Collapsing these two into one catch was a bug once already.

## Display

`fitCanvas()` scales the canvas to fit the viewport, never past 1:1, and renders at device pixel
ratio (capped at 2). **`W` and `H` are the logical playfield and never change** — they're read
from the markup before the backing store is ever resized, and `ctx.setTransform` maps logical
space onto it. Every coordinate, radius and constant in the file is in logical units. If you need
the drawing surface size, do not read `cv.width` for game logic; that's the device-pixel store.

The overlay lives inside `#stage` alongside the canvas, so the menu can't decouple from the
playfield, and inherits `--ui` (the fit scale) so it shrinks in step.

Before this, the canvas was a fixed 820×620 box under `body{overflow:hidden}`: perfect above that
viewport size, silently clipped with no scroll recovery below it. The Chat iframe was always big
enough to hide the cliff.

## Deliberate behavior that looks wrong but isn't

- **`stats.destroyed` counts only rocks erased from existence**, not rocks split. Shooting a big
  rock increments nothing until its last tier-0 grandchild dies. The pulse increments once per
  rock it zaps — which is a *net penalty* to the stat, because it removes the rock whole and the
  children never exist to be counted. Working as intended.
- **Pulse kills don't build combo** (`// flat, no combo`). Intended.
- **Accuracy counts every projectile**, so twin/fan builds dilute it. Fine.

## Known fragility

- `breakRock()` rolls for hazards per rock at 0.004, so hazard frequency scales with how fast
  you're clearing. `HAZ_CAP` and the four cooldown constants are what keep that sane — changing
  either without checking the other will flood or starve the game.
- Iron *and* shielded children inherit the parent's property at full strength. Deliberate, but it
  means shielded rocks at wave 11+ compound faster than the linear-looking spawn rates suggest.

## Controls

`Arrows`/`WASD` rotate + thrust · `Space` fire · `Shift`/`0` pulse · `P`/`Esc` pause
(then `R` restart, `Q` quit, both confirm) · `1`–`4` mode select from the menu.

**Dev mode:** Konami code at the menu toggles it. Then in-game:
`B` big rock · `I` iron · `L` large iron · `H` shielded · `G` well · `O` flare · `Z` pulsar ·
`C` comet · `F` refuel · `K` arm pulse · `U` random weapon up · `M` gem · `N` clear rocks ·
`J` +4 waves · `V` godmode. Dev runs are flagged and **not recorded to bests**.

## Naming

The folder is `DRIFT` in caps while every sibling is Title Case. Nobody remembers why, possibly
not even the first version. Keeping it — the shout suits the game, and it predates the convention
it breaks.

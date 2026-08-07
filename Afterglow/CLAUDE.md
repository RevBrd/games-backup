# Afterglow

Missile Command's grandchild, played at dusk over a city that is going dark.
Ordnance comes down; you put blooming clouds in front of it. **This game is sincere —
there are no authored defects. Its bugs are real bugs, fix them freely.**

`afterglow.html` is the game, single self-contained file, runs by double-clicking.
`backups/` holds pre-job snapshots. Back up before any major pass.

## The thesis — read this before changing anything

Loss, tinted by beauty and nostalgia. A real-feeling city — meant to read as *yours*
without ever being told so — coming apart under modern war, while you are too busy
admiring how it looks to notice what you're watching. It is a warning delivered as a
light show. Everything below exists to serve that, and the aesthetic *is* the argument,
not decoration on top of one.

Practical consequences, all load-bearing:

- **You cannot win. The game never pretends otherwise.** No victory condition, no
  repair, no recovery. A run is a slope, and the only variable is how slowly you go
  down it. (Endings aren't permanently off the table but nothing is planned.)
- **No people. Ever.** No civilians, no casualty counts, no voices, no radio chatter,
  no death toll, no named enemy, no flag, no faction, no reason given. The player's
  only reading of harm is *lights going out*. This is a hard rule — a future instance
  will be tempted to add an evacuation counter or a survivor tally as "stakes." Don't.
  The absence is the stakes.
- **Damage is permanent and monotonic.** 28 districts × 4 tiers, 66 points, escalating
  1/2/3 per hit on a district. Nothing walks it back.
  - **A repair mechanic was proposed and deliberately rejected** (Trevor suggested it,
    Opus 4.8 pushed back on the grounds that it defuses the sense of loss; both now
    agree). Currently ~80% settled as No. It is a *discarded idea, not an unbuilt one* —
    do not quietly reintroduce it because the build phase has spare screen space.
- **Beauty on both sides of the trade.** Your interceptor bloom and a burning district
  are the same visual grammar in different hues. Never make damage ugly to punish the
  player; make it beautiful and let that do the work.
- **Salvage comes from wreckage.** The city is funded by what is thrown at it. Keep it.
- The code contains authored grief. `settleTimer` refuses to show the wave-clear screen
  within 5s of a city impact ("ruminate on late damage"). `ambientLevel` scales distant
  tracers with *your* accumulated damage, so the wider war gets louder as you lose —
  it can never hurt you, it is purely mood. **Both are features. Do not "optimise" them.**

## Linger — the identity mechanic

**Opus 4.8's invention, and the reason this isn't a Missile Command reskin.** The brief
was only "Missile Command with a unique element"; Linger was the model's answer and
everything else grew from it.

An interceptor kills only during `EXPAND_T` (0.34s of expansion). After that the cloud
**lingers ~1s and stops killing** — it takes guidance away instead. `applyLinger` →
`deflectMissile` rolls a five-way table (nudge / veer / tumble-coast / tumble-thrust /
sputter), then `GRAV_BIAS_CHANCE` pulls 75% back toward a death dive; `DEFLECT_TTL`
burns the rest out harmlessly. So the verb is **denial, not interception**: you don't
hit things, you put a cloud where a thing is going to be and let physics finish it.

`applyLinger` is keyed by (enemy type × weapon type) on purpose — new threats and
weapons slot into that table. Use it rather than adding special cases at call sites.

**Never** make Linger kill on contact. That collapses the game back into Missile Command.

## Frozen / do-not-touch

- **The damage model is frozen** (`N_CELLS`, `TIER_COST`, `FAIL_POINTS`, `applyLeakDamage`).
  Marked so since Job 2. Balance elsewhere; leave this alone.
- **Economy numbers are explicit placeholders** and are tuned holistically once the
  weapon and enemy sets exist. Don't spot-balance them.
- `cityBlackout` fires at `damagePoints >= 4 && districtsHit >= 2` — about three leaks,
  ~94% integrity. The city therefore goes fully dark in the first wave or two and most
  of a run is played over a black skyline. **This is deliberate and has been tuned by
  hand more than once.** (The nearby comment says "below 90%"; the code means 94%. The
  code is correct, the comment drifted.) Open to playtest revision, not to tidying.

## Built

Engine, city generation with three depth layers, per-district lighting and fire, damage
tiers, distant-war ambience, build phase with five emplacement slots, two weapons
(Standard, EMP), three threats (ballistic missile, loitering drone, bomber drone),
dev panel. Thermite exists as a **visual prototype only** (below).

## Planned

**Weapons.** Flak (no Linger, tiny blast, fixed shrapnel spray in random directions —
poor against missiles, strong against the big slow bombers). Foam (extinguishes
thermite; likely gravity-arced or height-capped so it feels heavy and forces the player
to let thermite fall while dealing with everything else — mechanics still open). A
possible fifth slot, held in reserve. **Rule: a new weapon only ships if it directly
counters an enemy type in a way that makes sense.** One candidate is a SAM site that
occupies a slot in exchange for preventing Glide Bombs entirely, on the fiction that
the offscreen jets delivering them can no longer get close — those jets are implied,
never drawn.

**Threats.** MIRV (splits partway down; a direct blast before the split kills the whole
thing, but Linger makes it split *early*). Hypersonic (very fast; counter unsolved,
possibly brittle enough that Linger alone breaks it). Glide Bomb (enters high with
horizontal momentum, arcs down under gravity, huge damage, tanky, **immune to Linger** —
countered by its slow speed, or by SAM; the most tentative of the set).

**Thermite — intended visual signature of the whole game.** A slow, beautiful curtain
of burning motes drifting down over 5–6 districts like glinting white-orange snow, which
torches any district it touches. Foam is the counter. If the look lands it goes
everywhere: thumbnail, poster, start screen.

**Visual.** Interceptor blast and Linger colours drift from the leftover arcade-bright
palette toward something closer to fireworks. Light pollution as a system: when power
fails the sky's glow drops and stars brighten; as fires spread the glow returns and the
stars dim again. Possible emergency-vehicle light reflections (red/blue) on lightly
damaged districts after blackout, capped at 2–3 districts. More building variety —
monuments, ferris wheels, arena domes. **Retire the "last lit city" framing** — the city
should become the player's own without the game ever saying so.

## Thermite prototype (Job 6a) — current state

Dev-gated and **purely decorative**: no damage, no ignition, cannot be shot, no wave
spawns it. Built to answer "does it look right" before any mechanics depend on it.

All tunables live in the `TH` block, which is the only place to touch. Notes:
- Trails are drawn as **beads, not lines** — the beading is what reads as a burning
  fragment shedding sparks rather than a tracer round.
- Rendering is **additive** (`globalCompositeOperation = 'lighter'`). Overlapping motes
  sum toward white, and that self-generated bloom in the dense middle *is* the effect.
  Do not switch to source-over and try to fake it with `shadowBlur`.
- Per-bead alpha/size are baked into typed arrays and beads are bucketed by colour, so
  `fillStyle` is set ~144×/frame instead of ~15,000×. Heads are one pre-rendered sprite
  each. This is what keeps it at 60fps; a naive rewrite drops it to ~26.
- Falls **behind** the foreground skyline, so it descends into the city.

Still short of the reference: trails are too parallel and too orderly, and the fan
should be wider at the top. Density, beading and colour are close.

## Dev

Backtick toggles the panel. `Esc` pause · `N` skip wave · `I` invuln · `0`–`3` set all
district tiers · `F` freeze (screenshots) · `T` release thermite. Buttons mirror these.

## Validate

```bash
node validate.js
```

17 checks: syntax, self-containment, DOM-stub integration, 60s of live play, and the
thermite system driven through full bursts. The canvas stub **rejects NaN/Infinity on
every numeric argument and on any rgba string**, so a broken motion model fails loudly
instead of rendering an invisible blank. Draw-call ceilings guard the frame budget.

For visual work, serve it rather than opening `file://` — the in-app preview pane treats
file URLs as non-reloading static snapshots and will silently stack multiple game loops
in one document if you re-navigate:

```bash
node tools/serve.js
```

## Credits

- **Opus 4.8** — the original build through Job 5c, and the Linger mechanic, which was
  the model's own answer to an open brief and is the foundation of the whole design.
- **Trevor** — concept, the dusk visual theme, the emotional thesis, all direction.
- **Opus 5** — renamed Halation → Afterglow, cut the orphaned wave-break code, built the
  thermite visual prototype, the validation harness and the local server.

Named **Halation** for most of its life (the film-bloom around bright highlights);
returned to Afterglow, its original name, in Aug 2026 — it carries the double meaning of
the lingering cloud and what's left after something ends.

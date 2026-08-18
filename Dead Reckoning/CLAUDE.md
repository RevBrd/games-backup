# Dead Reckoning

Newtonian dueling with no brakes, framed end to end as a Western gunslinger picture. You fly a
ship. The game will never once admit that.

**This game is sincere. Its bugs are real bugs — fix them freely.** There is no register of
authored defects here and there should never be one. Anything that looks broken is broken.

## Read this first: the file you have is not the game

The current `dead-reckoning.html` is a **flight sandbox**, and it is the third shape this project
has taken:

1. **v1 — the game.** "DRIFT meets *Spacewar!*" — 1v1 arena duel around a central gravity well,
   full inertia, no damping. Abandoned: the physics never converged, so the game was never
   playtestable enough to judge. **The v1 file no longer exists** — v2 was built by editing v1 in
   place, before the backup convention. There is no CPU opponent code to recover. See
   "What actually went wrong in v1" — that section is the only surviving record.
2. **v2 — the sandbox.** Opponent and well stripped out, everything narrowed to making the *flying*
   feel right. The well has since been re-added behind the `K` key, off by default. **This is the
   file in the folder.** It works and it feels good.
3. **v3 — the game again.** The Western pivot, decided 2026-08-05. Not started.

So: the code is honest about what it is, and it is not lagging behind an unbuilt design — the
design is genuinely new. Don't read the sandbox's spareness as unfinished work. It finished its job.

The full v3 concept lives in the **`dead-reckoning-concept` skill**, not in the repo. Read it.

## The premise, and the one rule that carries it

Every surface the player reads is a Western. Outlaws, sheriffs, saloons, dust, wanted posters,
high noon. The gameplay underneath is space combat and **nobody in the fiction ever notices.**

The joke is structural, not written, and that distinction is the whole design:

> **The vocabulary ban.** The game never uses the words *space, ship, spacecraft, thruster, orbit,
> gravity, fuel, laser, pilot, asteroid,* or any sibling of them. Not in a menu, not in a tutorial,
> not in a death message, not in a tooltip. Anywhere the player can read.

Hold that ban and the comedy renews itself for free on the fortieth match, because it comes from
the gap between what the player is doing and what the game says they're doing. Break it once and
the whole thing collapses into a skin.

**Tone is deadpan and sparse.** Leone, not *Blazing Saddles*. Few words, long pauses, total
sincerity. The concept skill contains one sample line in a louder, chattier voice
("faster than a sarsaparilla jackrabbit") — that voice was considered and **set aside on
2026-08-05** in favor of straight-faced. Don't reintroduce it from the skill document.

## Decided (2026-08-05, with Trevor)

- **PvC is the primary mode.** Named outlaws with personalities. Local same-keyboard PvP is
  welcome *late* if it fits, not a v3 gate.
- **The sandbox survives as the Practice Range**, re-themed. It's already built, it's good, and it
  becomes the tutorial — where you learn flip-and-burn before anyone shoots back. The **obstacle
  course** idea from the v2 era is still live and belongs here, not in the duel.
- **HUD: Western in styling, honest in data.** Brass, etched glass, wood bezel, saloon lettering —
  but SPEED, HEAT, HEADING and the velocity vector stay legible and technical. The instruments do
  not get translated into cowboy. Losing readouts to a joke is a bad trade; `building.md` records
  "more information rather than less" as a standing preference.
- **Palette must move hard away from the sandbox's cold blue and teal.** Dust, bone, rust,
  sun-bleached. This isn't taste — see "Distance from DRIFT" below.

## Proposed, NOT ratified

Written down so it isn't lost, flagged so it doesn't harden into a decision by being written down.
These are Opus 5's proposals from the 2026-08-05 review and Trevor has not yet ruled on them:

- **A duel should be a series of passes, not a deathmatch.** Close, take one firing solution,
  separate, come around, re-set. The argument: v1 died of an arena-size problem, and sustained
  dogfighting under pure Newtonian flight eats space faster than any 1000×700 board can supply. A
  duel structured as jousting rather than boxing turns inertia from the obstacle into the drama —
  every approach is a commitment you can't take back. If this is adopted it changes match pacing,
  arena size, and probably the health model, so it wants deciding early.
- **Build the CPU before the content.** See "The real risk" below.

## What actually went wrong in v1

The file is gone, so this is the whole record. From Trevor, 2026-08-05:

- **Gravity was too strong and too weak at the same time**, in different parts of the arena, and no
  single value fixed both.
- **The game ran roughly 4× too fast** to read or react to.
- **Control bugs** — genuine implementation defects, not physics.
- Net effect: *the controls and feel were never testable at all.* That is why it was stripped to a
  sandbox. v1 wasn't rejected on its merits; it was never legible enough to have merits.

**The gravity complaint was arithmetic, not tuning, and it has been fixed** (2026-08-05). v1 used
`accel = G / r²`. Across this arena `r` runs ~60 to ~610, so `r²` spans 3.6k to 372k and the corner
pull is ~1% of the core pull *for every value of G*. Any increase that made the outfield matter
turned the core into a shredder. Both complaints were true simultaneously and always would be —
inverse-square is right for real gravity and wrong for a 1000-unit box.

The `anchored` model replaces it: you set `aCore` and `aEdge` as two independent numbers and shape
the curve between them with `shape`. Core:corner spread is now a dial (currently 6.5×) instead of
an emergent 70×. **`newton` is preserved behind the `J` key** so the difference can be felt rather
than taken on faith — do not delete it, it's evidence.

The speed complaint has a dial now too (`timeScale`), but **note it is not the only lever and may
not be the right one.** `timeScale` slows rotation along with everything else, which will fight the
snappy RCS authority the sandbox was tuned for. Pulling `mainThrust` and `muzzle` down instead
slows how fast you cross the arena while leaving the ship's handling crisp. Those are different
feels; both are on the bench; this is unresolved and wants playtesting.

## The real risk, and it is not the writing

An opponent flying forward-only Newtonian with no damping must plan a flip-and-burn, lead shots
against a target whose bullets inherit shooter velocity, and not fall into the well. Too competent
and it's an unbeatable vector calculator. Too dumb and it isn't a duel. And the Western frame needs
more than competence — an outlaw with a name and a wanted poster needs **legible, imperfect,
characterful** flying, which is harder to write than good flying.

**This is the same class of problem that killed v1.** Prototype one nameless CPU that can fly a
pass and take a shot, behind a dev gate, before a single line of Western copy is written. If it
doesn't land we find out cheap, and we find out before there's a game's worth of content resting
on it.

Corollary: the well is back in the design after being part of what killed v1. The model is fixed
(above) but **keep `well.aCore` under `mainThrust`** — that inequality is what guarantees the engine
can always climb out of the core. The field overlay enforces it visually: the red `1.00×ENG` ring
only appears when you have broken it, and its appearance means there is now a region of the arena
where the player is falling no matter what they do. That may occasionally be a deliberate design
choice. It must never be an accident.

## The physics, and what's load-bearing

`CONFIG` at the top of the script holds every feel-critical number, deliberately grouped and
commented. Tune by feel with telemetry live; that's what it's for.

**Untouchable in spirit, tunable in value:**

- **No damping anywhere. Pure semi-implicit Euler, no drag term.** This is the entire identity of
  the game and the reason it isn't DRIFT (which runs a `0.992` drag). Do not add friction,
  auto-stabilization, or a rotational damper "to make it feel better." If it feels bad, the fix is
  elsewhere.
- **Main engine is forward-only.** No reverse. To slow down you flip and burn. Non-negotiable.
- **RCS never builds heat**, so you can always maneuver — only the main engine and the gun heat up.
  This is the `game-design.md` principle *penalties constrain the fun loop, don't remove it*,
  already correctly applied. An overheat that took away rotation would be the wrong kind of pain.
- **Bullets inherit full ship velocity** (`vx + nx*muzzle`) and **never wrap** — they die at the
  arena edge, while the ship and rocks wrap toroidally. That asymmetry is deliberate and the
  collision code is split to match: bullet↔rock uses plain distance, ship↔rock uses `toroDist`.
  Making bullets wrap would let you shoot yourself in the back across the seam.
- **Recoil is a per-shot impulse** (`recoil: 9`), not a thrust. With no damping every shot
  permanently alters your trajectory. Sized so a long burst visibly drifts you without spoiling a
  single aimed shot. *(This is DRIFT's invention re-used, not this game's — DRIFT's own recoil
  constants are locked; these are not.)*

**Primary dials:** `mainThrust` 220 · `rcsTorque` 13 · `rcsStrafe` 78 (deliberately ~⅓ of main) ·
`engineHeat` 0.45 (~5s of continuous burn to overheat) · `vent` 0.26 · `ventRelease` 0.55
(hysteresis — you must cool to here before the engine and gun come back).

## The tuning bench

Backquote (`` ` ``) opens a live panel with all 14 feel-critical dials. **`EXPORT CONFIG` is the
handoff, not a convenience** — Trevor tunes by feel and pastes the JSON back, and those numbers get
baked into `CONFIG`. Don't ask him for numbers in prose; ask him to export.

Also on the bench: `K` well on/off · `J` swap well model · `T` the prediction line.

**The prediction line is the game's name made literal** — it forward-integrates the ship's
*ballistic* path (gravity only, no thrust) and draws where you end up if you do nothing. It reads
the same `wellAccel()` the physics does, so what you see is what you fly; the selftest asserts the
predicted endpoint lands within 12 units of the simulated one over 4 seconds. It's dev-gated for
now. Whether it belongs in the Practice Range, in duels, or as an earned ability is **undecided**
and worth deciding on purpose — it's a large accessibility lever on the hardest thing in the game.

## Validation

`node tools/selftest.js` — 27 assertions, no dependencies. It slices the `<script>` out of the HTML
and runs it under DOM stubs, then checks the well profile (anchor endpoints, monotonicity,
escapability, the newton-vs-anchored spread), the prediction line against the live simulation,
`timeScale` proportionality, held fire against `fireCd`, and that every dev dial resolves to a real
`CONFIG` path inside its own slider range. **Run it after touching physics.** It caught a real bug
already: iso-rings were drawn for thresholds the field never reaches, which falsely advertised an
inescapable core.

It also reports the Google Fonts refs as a standing NOTE rather than a failure — see below.

## Known issues

- **Google Fonts is a runtime network dependency.** Two `<link>` tags to `fonts.googleapis.com`.
  The file still runs offline, it just silently drops to fallback stacks. Against the
  single-self-contained-file target; worth inlining or dropping before this is called finished.
  The selftest prints these every run so they don't get forgotten.
- Minor: `bullets.filter(...)` runs twice per `step()`, harmless. The `resize()` handler is bound
  to `window.resize` only — fine for the current fixed-aspect stage, but it won't survive a
  DRIFT-style responsive rework unchanged.

*Fixed 2026-08-05: holding SPACE fired exactly one shot, because `keydown` bails on key repeat
before reaching `fire()`. Sustained fire is now driven from the sim clock in `step()` and gated by
`fireCd`; `CONFIG.autoFire` restores the old behaviour if it turns out to have been load-bearing.
**This changes how `recoil` feels** — a held burst now accumulates drift the way the comment on
`recoil` always claimed it did. Retune after playtesting, not before.*

## Distance from DRIFT

These two games are closer than any other pair in the collection: wrapping arena, triangle ship,
recoil, particle exhaust, cold blue-and-teal HUD, Asteroids ancestry. The collection's standing
rule is that games must not converge.

**The Western pivot is what separates them, and that makes it load-bearing rather than decorative.**
Every step toward the Western is a step away from being DRIFT's little brother. Concretely: the
palette has to move, the typography has to move, and the sound (if built) has to move — six-shooter
reports and overdone ricochets, per the concept skill, not arcade zaps. Reaching for anything that
feels like DRIFT because it's proven is the wrong instinct here even when it works.

Mechanically they stay distinct on their own: **DRIFT has drag and Dead Reckoning has none**, and
DRIFT is PvE wave survival while this is a 1v1 duel.

## Not built yet

Effectively all of v3. In the order I'd take it:

1. CPU opponent prototype, dev-gated, nameless, no theming. The gate on everything else.
2. Duel structure — match shape, win condition, arena size, whether the well is in.
3. Western frame — menus, wanted posters, outlaw roster, copy. Cheap once 1 and 2 hold.
4. Practice Range re-theme + the obstacle course.
5. Audio. Six-shooters and ricochets. Explicitly wanted in the concept, wholly unbuilt.
6. Persistence — records, which outlaws you've put down. Nothing exists.

## Open questions

- **What does a good engagement look like?** Two ships circling and trading fire continuously, or
  two ships passing at speed with one firing window per pass? This sets arena size, the health
  model, and how clever the CPU has to be. Asked 2026-08-05, not yet answered. **Don't decide it
  unilaterally** — it's a feel question and Trevor is the one who has flown this.
- **`timeScale` vs. lower thrust** as the answer to "too fast." See the v1 section.
- **Where the prediction line lives** in the finished game, if anywhere.

## Credits

- **Opus 4.8** — v1 (the original duel) and v2 (the sandbox). *The same instance built both*: v2
  was v1, edited in place, which is why v1 no longer exists. Every number in `CONFIG` that predates
  2026-08-05 is 4.8's, arrived at by feel.
- **Opus 5** — 2026-08-05: this document, the v3 design review, the catalog entry, the `anchored`
  well model, the field overlay, the prediction line, `timeScale`, the tuning bench, the held-fire
  fix, and `tools/selftest.js`.

## Controls

**Flight** — `←` `→` rotate (RCS) · `↑`/`W` main engine, forward only · `Q`/`E` strafe (RCS, weak) ·
`SPACE` fire (hold for sustained) · `R` reset velocity and spin.

**Instruments and dev** — `G` telemetry · `P` pause · `H` summon asteroid · `K` gravity well
(off by default) · `J` swap well model · `T` prediction line · `` ` `` tuning bench.

## Marquee billing

<!-- marquee: billing=preview -->
Shelved as a Sneak Preview in Marquee. An early build, not a finished game. Editorial only — it changes which shelf the launcher puts this
on and nothing else. Change the comment above when the game's state changes.

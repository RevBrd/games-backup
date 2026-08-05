# Dead Reckoning

Newtonian dueling with no brakes, framed end to end as a Western gunslinger picture. You fly a
ship. The game will never once admit that.

**This game is sincere. Its bugs are real bugs — fix them freely.** There is no register of
authored defects here and there should never be one. Anything that looks broken is broken.

## Read this first: the file you have is not the game

The current `dead-reckoning.html` is a **flight sandbox**, and it is the third shape this project
has taken:

1. **v1 — the game.** "DRIFT meets *Spacewar!*" — 1v1 arena duel around a central gravity well,
   full inertia, no damping. Abandoned: the physics resisted tuning and the arena couldn't give two
   fighters enough room to maneuver. *(See "History gaps" — the v1 file may or may not still exist.)*
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

Corollary: the gravity well is being walked back into the design after being part of what made v1
untunable. Do that deliberately. The current config is at least honest about the danger —
`well.maxA` (170) sits under `mainThrust` (220) specifically so the engine can always climb out of
the core. Keep that inequality or know why you broke it.

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

## Known issues in the sandbox file

Neither has been fixed, both are real:

- **Holding SPACE fires exactly one shot.** `keydown` bails on key repeat (`if(keys[k]) return;`)
  before reaching `fire()`, so `fireCd` only ever governs how fast you can mash. For a game about
  managing recoil drift across a burst this is almost certainly wrong, and fixing it will change
  how `recoil` feels — retune after, don't retune before.
- **Google Fonts is a runtime network dependency.** Two `<link>` tags to `fonts.googleapis.com`.
  The file still runs offline, it just silently drops to fallback stacks. Against the
  single-self-contained-file target; worth inlining or dropping before this is called finished.

Minor: `bullets.filter(...)` runs twice per `step()`, harmless. The `resize()` handler is bound to
`window.resize` only, which is fine for the current fixed-aspect stage but won't survive a
DRIFT-style responsive rework unchanged.

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

## History gaps

Unanswered as of 2026-08-05; fill these in when Trevor answers rather than guessing:

- **Which model built the v1 game and the v2 sandbox?** The collection asks that assisting models
  be credited here. Currently unknown.
- **Does the v1 file still exist anywhere?** It contained a working CPU opponent. Even a bad one is
  worth reading before writing a new one from scratch.
- **What tuning was already tried and rejected in v1?** "The physics resisted tuning" is all the
  concept doc says. Knowing which specific dials were pushed and how it failed is exactly the
  context a fresh instance cannot recover from code, and exactly what stops us repeating it.

**Credits:** Opus 5 (2026-08-05: this document, the v3 design review, the catalog entry).
Earlier authorship unknown — see above.

## Controls (sandbox)

`←` `→` rotate (RCS) · `↑`/`W` main engine, forward only · `Q`/`E` strafe (RCS, weak) ·
`SPACE` fire · `H` summon asteroid · `R` reset velocity and spin · `G` toggle telemetry ·
`P` pause · `K` toggle gravity well (off by default).

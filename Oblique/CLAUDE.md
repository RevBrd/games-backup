# Oblique

A Civil War battle where you are the general, standing on the field, and **every order you give has
to be carried there by a man on a horse.** Under that sits a line-of-battle simulation: regiments
are links in a hinged chain that bends, stretches, tears open, and closes up.

Sincere throughout. **There are no authored defects** — every bug is a real bug, fix it freely.

Single self-contained file, no build step: `oblique.html`. Double-click to play.

---

## Status in one paragraph

**This is a kernel, not a game.** Three jobs have gone into one thing only: making a line of battle
feel right to shape. That part works and is the foundation everything else stands on. There is no
enemy, no firing, no morale, no ammunition, no courier, no win condition, and no general. Almost
everything you can *see* — the palette, the terrain, the size of a regiment, the six-regiment
starting line — is placeholder. See the register at the bottom before "fixing" any of it.

## The thesis: orders take time to arrive

This is the piece that isn't in the code yet and matters more than anything that is.

You are a Civil War general, physically present on the map, reasonably safe but *there*. You do not
have radio. Ordering a regiment to do anything means a courier — a dot — physically travelling from
you to that regiment and delivering it. **Distance is latency.** A brigade on the far flank takes
real seconds to hear you; the regiment at your elbow reacts almost at once. Where you stand is
therefore a live decision with a cost on both sides of it, and the game's pacing is deliberately
slow so that latency has room to be felt rather than merely endured.

Consequences worth protecting:

- **The player's hand is never on a regiment.** Dragging a line is *writing an order*, not moving
  troops. The kernel is already built this way and it is the single luckiest thing about it —
  `L.joints` is where the line physically stands, `L.target` is where it has been told to go, and
  `march()` walks one toward the other. A courier system slots in as a delay between the drag and
  the assignment to `L.target`. Nothing needs to be rearchitected.
- **The ghost is the order in flight.** `drawGhost` already draws the intended shape and the dotted
  leader lines from where each joint is to where it's going. That is the visual vocabulary for
  "orders issued, not yet obeyed" and it exists already.
- **Slow is the point.** Do not speed the game up to make it feel responsive. If it feels
  unresponsive, the answer is better legibility of what's in flight, not less delay.

**This is what keeps Oblique away from Salient.** Salient is a WW1 general at a map table, remote
from the field, reading a situation he cannot see. Oblique's general is standing in the field
looking at it. Same century-adjacent subject, opposite relationship to the ground. Do not let them
converge — if a mechanic would work equally well in both, it probably belongs to neither.

## The line model

The good ideas here, in rough order of how much would be lost by breaking them:

1. **A line is a chain of hinged slots, and a slot holds frontage whether or not anyone is in it.**
   Slot `i` spans joints `i..i+1`. Take a regiment out and the slot stays, empty. The line keeps its
   length and its shape and there is now a *hole* — nobody stands there and nobody will fire from
   there. Gaps are the central tactical object.
2. **Closing up costs frontage.** `closeUp` (key `C`) contracts a line onto its gaps, resampling the
   curve the player already shaped so a bent line closes into a shorter bend instead of snapping
   straight. It holds the anchored joint fixed. Solid line or wide line, pick one.
3. **A regiment can be drawn out or closed up, and depth follows frontage inversely.** Same men,
   spread thin or packed deep — `slotDepth()` is the whole idea in three lines. Span is clamped to
   `MIN_SPAN`/`MAX_SPAN`, and a regiment at its limit draws brass tick marks so reach is something
   you feel at the edge rather than read in a number.
4. **Dragging a stake changes a span, not a position.** This is the least obvious behaviour in the
   file and the one most likely to be "fixed" by mistake. `dragStake` picks a *pivot* — the anchored
   neighbour if there is one, otherwise whichever neighbour you're pulling away from — and reshapes
   the one regiment between stake and pivot. The slot on the other side keeps its frontage and is
   towed. That's what makes "pin one end, pull the other" behave the way it reads.
5. **Strain is only reported when the line is asked for something it cannot do.** Neighbours that
   can't reach their ordered span, or a joint bent past `MAX_HINGE`. Deliberate stretching is not
   strain — the span moved, so the regiment is content. Keep that distinction; it's what makes the
   red rings mean something.
6. **The solver is a Jacobi-ish relaxation with a distance-graded pull toward rest.** Joints near
   the dragged one move freely; distant ones are pulled back toward where they were, so a line
   conforms locally instead of the whole thing swinging. `SPREAD` and `PULL` are the feel knobs.

## Where things are

`oblique.html`, one script block, split into two clearly banner-marked halves so the kernel can be
sliced out and run under Node:

| Region | Contents |
|-|-|
| `CFG` | Every tunable, top of the kernel |
| geometry / designations | Vector helpers; the weighted Union-state regiment name roll |
| model | `makeLine`, slots, `resetField` |
| solver | `solveChain`, `measureStrain` — pure, no DOM |
| slot geometry | `slotQuad`, hit tests, `dragStake` |
| detach / close up / merge | `detach`, `trimEmptyFlanks`, `closeUp`, `tryFillGap`, `tryMerge` |
| **`=== VIEW ===`** | Everything below this banner touches the DOM |
| view | canvas, `resize`, `buildTerrain`, all `draw*`, `updateReadout`, input, `march`, loop |

`tools/selftest.js` slices everything above the `=== VIEW ===` banner and runs it headless — solver
convergence, span clamping, gaps surviving a detach, close-up conserving regiments, merge and
gap-fill. Run it before trusting any change to `CFG` or the solver:

```bash
node "tools/selftest.js"
```

**The in-app preview pane doesn't composite frames when it isn't on screen**, so screenshots time
out and `requestAnimationFrame` never fires. Use the harness, or a real browser window.

## Planned systems

Order is not fixed; take them in whatever sequence makes each one testable.

- **Volleys.** Timed firing with realistic reload, ordered per regiment, **damage scaling by angle
  to the target** — enfilade fire down the length of a line is devastating, frontal fire is not.
  This is the mechanic that makes the line geometry pay off, and it comes from Volley (below).
- **Morale, and casualties feeding it.** Both, together. Casualties reduce the damage a regiment
  deals and raise the chance its officer is hit in the next volley (fewer other targets). Morale
  falls from casualties, from enfilade, from a neighbour breaking, from gaps beside them. **A
  regiment should almost never be destroyed** — historically they broke first, and if the numbers
  produce annihilation the numbers are wrong.
- **Officers.** One per formation, never drawn, no portrait, no name on the map. Killing one is a
  morale multiplier and nothing else.
- **Ammunition** *(leaning yes, not committed)*. A regiment that runs dry **falls out of line on its
  own** and walks back to a player-placed ammunition depot — probably immovable once sited — refills
  and returns. You can order it to hold the line with bayonets instead, at a large morale cost.
  Note the shape: this is a unit *disobeying the line* for a legible reason, which is a different
  and better failure than routing. Managing the two is the general's job.
- **Reserves**, constantly repositioned to anticipate the next gap. The gap system already exists
  and is waiting for them.
- **The enemy: the Confederacy**, with **AI personalities named for real generals** — an aggressive
  one is Jackson, a cautious defensive one is Longstreet. Historical names, used straight.
- **Cannons**, and **melee** when lines meet.

## Volley, the sibling

**Volley** is a separate game from the same Claude Chat sessions, not yet ported into this
collection. Its core was timing and ordering volleys regiment by regiment against an enemy trying
to do the same, with realistic reloads and damage scaling by angle — closer in feel to Total War
combat. It arrived at that shape in parallel with Oblique rather than by design.

The two are extremely close and **may eventually be combined.** Nothing is decided. If you're the
instance that ports Volley, that decision is partly yours; read both before proposing anything.

## Open and undecided

- **Win condition.** Two live candidates: the player is handicapped and defends against successive
  waves to a threshold, or an even fight where the goal is to win the map. Neither is chosen and
  other shapes are welcome.
- **Playable sides.** The CSA is definitely the enemy. Whether the player may ever *be* the CSA is
  genuinely open — Trevor is a strong Unionist and the game may simply stay Union-side.
- **The title.** "Oblique" is Opus 4.8's, and was flagged by it as a **working title**. The
  alternate on the table is **Enfilade**, which Trevor likes and Opus 4.8 declined in favour of
  Oblique. Worth noting that the two words split the game cleanly: *oblique* is a manoeuvre — angled
  attack, refused flank, weight one wing — and describes the shaping half; *enfilade* is a fire
  effect and describes the volley half almost exactly, angle-scaled damage being literally what the
  word means. Collection convention gives the naming right to the instance that starts a project, so
  Oblique stands. If the combine with Volley happens, that's the moment to revisit it.
- **Scale.** Regiments are currently far too large on screen. The intent is smaller bricks, more air
  around them, and a field that reads at brigade scale with room to grow toward corps later.

## Placeholder register

The inverse of an authored-defects register. Nothing below is a decision, and none of it needs
asking about before being replaced:

- **The whole palette.** Dark teal night map, blue-only units. The reference is *modern Civil War
  battle-map presentation* — American Battlefield Trust, Hal Jespersen, the animated map style: buff
  paper, green woods, brown hachured ridges, blue and red rectangles, white designations. The
  current look is not that and was never meant to be defended; it survived only because three jobs
  went into mechanics.
- **Terrain.** Three procedural contour blobs and a bezier river. Decorative, not simulated —
  nothing in the model reads it. Ground that affects the line is entirely unbuilt.
- **Regiment size and the six-regiment starting line.** Both arbitrary test values.
- **Union-only designations.** `STATES` is weighted by how many regiments each Union state actually
  fielded, so NY and PA turn up often; regiment numbers are power-skewed low because early-war
  numbers read better. The generator is worth keeping. It needs a Confederate counterpart.
- **The `[` `]` strength keys** are a rendering preview — they thin a regiment's slats to show what
  casualties will look like. There is no casualty system behind them.

## Credits

- **Opus 4.8** — the concept, the title, and the entire line kernel across three jobs.
- **Trevor** — direction throughout; the courier system, the ammunition mechanic, and the
  break-before-annihilation principle are his.
- **Opus 5** — this file, the port into the collection, the kernel/view split and the test harness
  (2026-08-07).

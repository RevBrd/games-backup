# SALIENT

A WW1 trench-defence game played from the cold, clinical top-down of a general reading a map.
The player is handed a sector, digs a trench network into it between assaults, and watches waves
of faceless dots try to reach the rear. Soldiers on both sides are blobs that shatter and vanish.
Wave results arrive as dispatches from superiors who count the dead as statistics.

Over a run, every shell that lands scars the ground permanently. The game begins on grass and ends
on a moonscape with a spiderweb cut into it. That transformation is the emotional arc; nothing else
in the design carries across waves the way it does.

**Full design concept lives in the `salient-concept` skill**, not here. Invoke it before any
substantial work. This file records what the skill doesn't: build history, what's been tried, and
the open problem.

<!-- marquee: play=none -->
**Neither file on disk is the game.** `salient.html` (v2) and `salient_job1.html` (v1) are both
abandoned prototypes, kept for reference — see the build history below. Marquee is told to offer
nothing here on purpose, and it should stay that way until v3 exists. Trevor's call, 17 Aug 2026:
the concept is worth returning to, so this is a deliberate hold, not an abandonment. When v3
lands, change the comment above to name it.

This game is **sincere**. It has no authored defects. Its bugs are real bugs — fix them freely.

---

## The open problem, and it is the whole project

**Trench building doesn't feel right yet, and until it does nothing else matters.** Two prototypes
have been built. Neither got past this gate, which is why neither reached artillery or scarring.

Trevor's own read (5 Aug 2026): *"I think it was the trench building mechanic. I feel as though
that's the core of the sandbox and I just couldn't get the feel right."*

### The diagnosis this session arrived at

**There is currently only one good shape for a trench line, so building has no design space.**

Work it through. With no enemy artillery in either build:

- A straight wall spanning the front is optimal. Zigzag costs more for identical frontage.
- Depth is pointless — the rear rank can't fire over the front rank, so a second row buys nothing.
- Traverses buy nothing. Communication trenches buy a little, for reinforcement routing.

So the player draws one straight line and is finished thinking. That is not a sandbox with bad
feel; it is a sandbox with a dominant solution, which reads *as* bad feel from the chair.

**Enemy artillery is not a later feature. It is the mechanic that gives trench geometry its
meaning**, and every shape decision in the design — zigzag, depth, dispersal, where the dugouts
go — is downstream of a shell landing somewhere random. It has to be in the first playable v3
build, ahead of the usual instinct to get the sandbox right before adding pressure. Here the
pressure *is* the sandbox.

This inverts normal staging and it should be done on purpose.

---

## The two prototypes

Both are preserved. Neither is the baseline for v3 — read both, take from both.

### `salient_job1.html` — v1, Opus 4.8, before the concept skill existed

The deeper simulation by a distance. 42×34 grid, **every soldier on both sides is an entity
occupying one cell.** Dijkstra cost field for enemy movement, BFS through trench cells for
reinforcement routing, per-cell melee, dugout reserves that walk the network to the post that
needs them. This is the concept document's mechanical description implemented almost literally,
and it works.

It also ships a headless test API on `window.__salient` — worth keeping in v3.

What it lacks: wire, MG nests, artillery, scarring, upgrade tiers, the depth rule.

**Why it feels worse despite being deeper:**

- **Every cell renders as its own box** (2px inset plus an inner dark rect), so a run of fire
  trench reads as a row of dominoes rather than a trench.
- **Unfillable one-cell gaps.** A 2-wide bay needs two free cells. Place at column 5 and again at
  column 8 and the hole at 7 can never be filled by anything. The line is supposed to be unbroken
  and the geometry actively prevents it.
- **Three player actions to get one rifle firing**: dig the trench, switch tools and designate the
  cell a firing post, and separately have bought a dugout with reserves in it. The intuition is
  "men in the trench shoot." The game makes it a pipeline.
- Comm trench is a *vertical* 1×2 on its own tool — a second shape and a second mode for what the
  player thinks of as the same verb.

### `salient.html` — v2, Fable 5, built from the concept skill

Shallower and **it felt closer**, which is the most useful single fact on record.

Aggregate garrisons instead of individual defenders — a work holds an integer `men` count, and
melee is a coin flip per 350ms against the whole work. Free-floating attackers in pixel space
rather than grid cells. Gained wire with lateral avoidance, MG nests, a pit→fire-trench "develop"
upgrade, garrison-driven rate of fire, and one genuinely excellent idea: **a captured trench
becomes a covered highway the attacker flows down** (`trenchStep`).

**What it got right, and these are the parts to carry forward:**

- **Adjacent works fuse visually into one continuous trench.** `cellIsLine()` neighbour checks drop
  the inset on shared edges. A row of separate rifle pits *looks* like a trench. This is very
  probably the largest single contributor to it feeling closer.
- **The parapet emerges from the shape.** Drawn only where no line cell sits in front
  (`if (!cellIsLine(c, r-1))`), so it automatically traces the front edge of whatever the player
  built, at any shape, with no authoring.
- **Garrison is intrinsic to the work.** Place it, it's manned. No assign step.
- Works have identity — click one, get a panel, issue orders to it.

**What it lost:** individual soldier dots. The concept is emphatic that soldiers are dots that
shatter and that melee is two dots vibrating until one breaks. In v2 defenders are pips inside a
rectangle and melee is `Math.random()` against a box.

**v2 has had only light playtesting.** Undiscovered sincere bugs are likely.

---

## Settled direction

Decided by Trevor, 5 Aug 2026, in answer to this session's questions.

**The field is literal ground seen from above, not map paper.** v2's green is the target. v1's
ochre paper-map treatment is off-concept. This matters most for scarring — craters on soil and
craters on a paper map are different games.

**Building is tower-defence placement, not freehand drawing.** Discrete blocks that interconnect
with their neighbours into an unbroken line.

**The base block is a bay, 2 wide and 1 deep, parapet on the enemy-facing side only.**
Place beside → the line extends. Place behind → the trench deepens, which is an artillery risk.
Depth does not increase frontage or firepower.

**The player acts only between waves.** The gas-mask command is an idea, not a commitment, and may
not survive in that form.

**The map grows outward on both flanks** as promotions arrive. It doesn't scroll to a new sector —
the sector you have keeps getting wider.

**Faction choice picks the historical battle**, and the player always defends:
British → 2nd Ypres · French → Fort Vaux · German → Loos · American → Château-Thierry.
Beat all four and a fifth unlocks: Germans holding a captured Fort Vaux against the French
counterattack, on a battlefield that starts pre-scarred.

**Casualties are meant to feel weightless, on purpose.** The dispatches count the dead coldly and
the player is meant to be complicit in reading them that way. Losses may eventually carry between
waves as a capped reinforcement draft, but that is undecided and the weightlessness is the point,
not an oversight to correct.

### Still open

- **Run length.** Undecided; let it fall out of the pacing.
- **Loss condition.** Both builds use a breach counter as lives. Placeholder, leaning toward
  keeping, open to better.
- **Whether losses carry between waves at all.** See above.
- No aesthetic touchstones have been named. If a future session finds one that fits, say so.

---

## A shape for v3's building mechanic

Proposed this session, **not yet approved or built.** Recorded so it isn't re-derived from scratch.

The point of all of it is to make several trench shapes viable rather than one.

- **The bay is the atom** — 2 wide, 1 deep, billed per bay. Press and sweep along a row to fill a
  run of bays at once: the blockiness of placement, the gesture of drawing.
- **Bays snap to a fixed 2-cell lattice**, so orphan single cells are structurally impossible and
  the line is always fillable. This kills v1's worst defect by construction rather than by care.
- **Behind merges into depth.** A bay placed directly behind another forms a 2×2. Parapet stays on
  the front edge; frontage and firepower are unchanged. What it buys is a **rear lane** — a covered
  road behind the fire step, so men moving laterally don't have to squeeze through the firing bays
  and congest them during a melee. This is the actual historical reason for support trenches and it
  makes depth a real decision. What it costs is that a shell landing in a 2×2 catches more men.
- **Traverses emerge from splash propagation.** Artillery splash travels *along* connected trench
  interior, losing a little strength per cell and a lot at every change of direction. A straight
  20-cell run takes a catastrophe; a run stepped every few bays contains it. The player is never
  told to zigzag — they work out why the real ones did.
- **Communication trench** stays a cheap 1-wide connector: no parapet, no firing, purely a road.

Carry forward from v2: the seamless fused rendering, the emergent parapet, intrinsic garrisons.
Carry forward from v1: per-soldier entities, and the headless test API.

---

## Conventions for this game

- Single self-contained HTML file, runs from `file://` by double-clicking. No build step.
- Balance and economy numbers are placeholders until the systems exist. Label them as such.
- Dev/cheat mode from the earliest v3 build, hotkeys documented here.
- Keep tweakables in one labelled config block at the top.
- Validate headlessly under Node before delivering. v1's `__salient` export is the pattern.

---

## Credits

- **Trevor** — the concept in full, the design skill document, and the correct diagnosis that
  trench building is the gate everything else waits behind.
- **Claude Opus 4.8** — v1 (`salient_job1.html`): the per-soldier grid simulation, cost-field
  enemy pathing, trench-network reinforcement routing, per-cell melee, and the dispatch voice.
- **Claude Fable 5** — v2 (`salient.html`): the seamless line rendering and emergent parapet, works
  with identity and intrinsic garrisons, wire avoidance, and the captured-trench-as-enemy-highway
  idea.
- **Claude Opus 5** (2026-08-05) — port to Claude Code, this document, and the diagnosis that the
  building mechanic feels flat because enemy artillery is what gives trench geometry a decision
  space, plus the v3 mechanic proposal above.

# Oblique

A Civil War battle where you are the general, standing on the field, and **every order you give has
to be carried there by a man on a horse.** Under that sits a line-of-battle simulation: regiments
are links in a hinged chain that bends, stretches, tears open, and closes up.

Sincere throughout. **There are no authored defects** — every bug is a real bug, fix it freely.

Single self-contained file, no build step: `oblique.html`. Double-click to play.

---

## Status in one paragraph

**This is a kernel, not a game.** Four jobs have gone into two things: making a line of battle feel
right to shape, and making every order to it travel by hand. Both work. There is no enemy, no
firing, no morale, no ammunition and no win condition. Almost everything you can *see* — the
palette, the terrain, the size of a regiment, the six-regiment starting line — is placeholder. See
the register at the bottom before "fixing" any of it.

## The thesis: orders take time to arrive

You are a Civil War general, physically present on the map, reasonably safe but *there*. You do not
have radio. Ordering a regiment to do anything means a courier physically riding from you to that
regiment. **Distance is latency.** Where you stand is a live decision with a cost on both sides of
it, and the pacing is deliberately slow so latency has room to be felt rather than merely endured.

Built in Job 4. A line now has up to three states visible at once, and telling them apart is most
of the game's legibility:

| | | |
|-|-|-|
| `L.pending` | what you have ordered | drawn in **brass** — nobody has heard it |
| `L.target` | what the regiment knows | drawn in **green** — it is walking there |
| `L.joints` | where the men are standing | drawn as men |

Consequences worth protecting:

- **The player's hand is never on a regiment.** A drag writes an order. Nothing reaches `L.target`,
  `L.slots` or the roster of lines until `deliver()` runs. That includes taking a regiment out of
  line: alt-drag is an *intent*, the hole does not open until the rider gets there.
- **Some things are free, and the line between them is the design.** An order is anything that
  changes where troops stand. Anchors and selection change *your map*, not your troops — an anchor
  is you deciding where the line ought to pin, and it only bites through the next order you
  actually send. Making planning cost a rider would tax the one thing a general can do freely.
- **Merging happens on arrival, not on delivery.** Ordering a regiment into a gap does not put it
  in the gap; it makes it walk there, and the line is short until it gets there.
- **Slow is the point.** Do not speed the game up to make it feel responsive. If it feels
  unresponsive, the answer is better legibility of what's in flight, not less delay.

### Rejected: latency in the other direction

**Do not build report latency.** The symmetrical idea — that you also *learn* things late, seeing a
map that is true where you stand and stale toward the flanks — was proposed and **turned down by
Trevor on 2026-08-07**. The reason is concrete: the player can see the field happening in real time,
so a map contradicting what is plainly visible reads as the game lying to you, not as fog. It would
be frustrating rather than tense. Orders are slow; information is not. This is quarantined here so
it doesn't get quietly reintroduced as a good idea — it has already been considered and declined.

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
| the general | `dispatch`, `deliver`, `tickOrders`, `marchGeneral`, `general`, `orders` |
| march | `march` — walks joints toward target, fires the arrival merge |
| **`=== VIEW ===`** | Everything below this banner touches the DOM |
| view | canvas, `resize`, `buildTerrain`, all `draw*`, `updateReadout`, input, loop |

Two harnesses, both worth running before trusting a change:

```bash
node tools/selftest.js && node tools/smoke.js
```

**`tools/selftest.js`** (29 tests) slices everything above the `=== VIEW ===` banner and runs it
with **no DOM stubs at all** — so if the kernel ever grows a `document` reference it fails with a
ReferenceError instead of silently passing against a fake. Covers the solver, span clamping, gaps,
closing up, merging, marching, and every courier rule.

**`tools/smoke.js`** (12 tests) runs the *whole page* against a stubbed DOM and drives the real
pointer and key handlers through `window.__oblique`, a deliberate read-only test seam at the foot
of the file. This is the only thing that checks the part that matters most: that a drag becomes an
order rather than a movement, and that nothing reaches the troops early.

**The in-app preview pane doesn't composite frames when it isn't on screen**, so screenshots time
out and `requestAnimationFrame` never fires. Use the harnesses, or a real browser window.

## Dev mode

**Backtick** opens a panel, drawn deliberately off-palette in lilac so it can never be mistaken for
the map: the general's position, courier and march rates, and every order in flight with its time
remaining. With the panel open, **`I`** toggles **instant orders** — couriers deliver on the spot,
which is how you test line mechanics without waiting through a rider every time. `I` is inert while
the panel is closed, so a stray press costs nothing.

Instant orders is not just a convenience. Any change to the *line* systems should be tested with it
on, so a courier delay never masks a solver bug.

## Tuning the courier

The sim runs roughly 35x real time, so absolute speeds are meaningless and **ratios are the only
defensible way to tune this.** `CFG.COURIER` and `CFG.GENERAL` are therefore derived from
`CFG.MARCH` rather than written as numbers — a rider is about 4.5x infantry at the pace of a line of
battle, the general repositioning himself about 2.5x. **Tune the multipliers, not the products.**

Measured on the default field (135 px/s courier):

| | |
|-|-|
| From the starting position, any regiment | 1.9 – 2.5s |
| General in a far corner, far flank | 6.2s |
| Standing behind the left flank → that regiment | 0.3s |
| Standing behind the left flank → the right flank | 3.1s |

**The mechanic works, but the default field barely exercises it.** From where the general starts,
everything costs about two seconds — a flat tax rather than a decision. It only becomes interesting
when he is near one part of the line and far from another, where the spread is 10x. That is an
argument that the scale pass matters more than the courier tuning: a wider front with smaller
regiments is what turns "where do I stand" into a real question. Don't tune `COURIER` up to
compensate for a field that is too small.

## Where it's going

**`DESIGN.md`, next to this file** — planned systems (volleys, morale, officers, ammunition,
reserves, the Confederate AI), how the courier could grow, the relationship with the sibling game
**Volley**, and everything still undecided including the win condition and the title. Read it when
you're choosing what to build; nothing in it is built.

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
- **The general's marker** is a ring and a small standard. It says "someone important is here" and
  nothing more; it is not a considered piece of iconography.

## Known simplifications in the courier

Deliberate, and each one is a place a future job could add depth:

- **A rider goes to a fixed point** — where the addressee was when the order was written. He does
  not chase a marching regiment. This keeps the delivery time knowable the instant you release the
  mouse, which matters more for reading the game than the small realism it costs.
- **One order per body; a new one supersedes the old**, and the superseded rider simply vanishes.
  Letting several ride at once and applying them in arrival order would be more interesting — and
  it has a genuinely good consequence, that riding forward makes a later order *overtake* an
  earlier one — but it is much harder to read on screen. Worth revisiting once orders are richer.
- **Riders are never lost, delayed, or intercepted.** All obvious hooks. None are built.
- **The general is not yet in danger and does nothing but stand and dispatch.**

## Credits

- **Opus 4.8** — the concept, the title, and the entire line kernel across three jobs.
- **Trevor** — direction throughout; the courier system, the ammunition mechanic, the officer
  survivability rule and the break-before-annihilation principle are his.
- **Opus 5** — this file, the port into the collection, the kernel/view split, both test harnesses,
  and Job 4: the general, the couriers and deferred orders (2026-08-07).

## Marquee billing

<!-- marquee: billing=preview -->
Shelved as a Sneak Preview in Marquee. An early build, not a finished game. Editorial only — it changes which shelf the launcher puts this
on and nothing else. Change the comment above when the game's state changes.

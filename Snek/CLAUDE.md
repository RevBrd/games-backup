# Snek

Snake, drawn badly on purpose, by someone who is not enjoying the meeting they're in.

**This game is sincere. Its bugs are real bugs — fix them freely.** There is no register of
authored defects and there should never be one. The *drawing* is deliberately bad; the *code*
is not. Wobbly lines and a lopsided apple are the art direction. A snake that clips through
itself is a bug.

## The one rule

**The joke never touches the mechanics.** Snake is a good game and this is a straight
implementation of it — grid, wrap-around walls, self-collision is the only way to die, speed
ramps with score. Everything funny lives in the *rendering* and the *chrome*. If a change would
make the game worse to play in exchange for a laugh, it's the wrong change.

## Look

Ballpoint pen on ruled notebook paper. Committing to one specific medium is what keeps "poorly
drawn" from reading as "unfinished" — the badness has to be legible as a choice.

- **Printed things are machine-straight. Drawn things wobble.** The blue rules and the red margin
  line have zero jitter. Everything made of ink does. That contrast carries the whole conceit;
  don't wobble the paper.
- **The rules are the grid.** Ruled lines sit exactly on cell boundaries, so the playfield's
  structure comes from the paper rather than from a drawn grid.
- **The fill and the outline don't agree.** The pale body wash is jittered on a different seed
  from the pen outline (`FILL_SLOP` vs `WOBBLE`), so the colouring-in misses the lines. Same for
  the apple's scribble fill, which deliberately overshoots. This is the strongest single signal
  of a hand drawing — keep it.
- **3-phase boil.** Lines re-jitter at ~9Hz (`BOIL_MS`), not per frame. Per-frame jitter reads as
  television static; a slow boil reads as hand-drawn animation. Do not raise this to 60fps.
- **Only the snake boils.** The border, the tally marks, the apple and the margin notes are drawn
  with `phase: STILL` and never re-jitter. This is how hand-drawn animation actually works — the
  background art is painted once and only the character is re-inked each frame — and it roughly
  halves the wiggle on screen, which was too much when everything moved at once. The apple's seed
  comes from its cell, so each new apple is drawn differently but holds that drawing until eaten.
  If you add page furniture, it goes in `STILL`.
- **Score is tally marks** in the left margin, in pencil, five-bar gate. The numeral in the HUD is
  the legible readout; the tallies are the doodle.

## The googly eyes

Real googly eyes are gravity toys: the pupil falls to the bottom of its dome and gets flung
around when the thing moves. These are simulated as exactly that — gravity, a socket-radius
constraint, restitution, damping, an impulse on every step and a bigger one on every turn. They
run on real time, not on game ticks, so they keep sloshing between moves and keep settling after
death. They are the only thing on the page that isn't hand-drawn: white plastic stuck onto a pen
sketch. That contrast is the gag, so don't "draw" them.

Dead snek's pupils settle at the bottom and stay there. That reads as a blank stare and it costs
nothing, because it's just the physics being left alone.

## Face

Four states, no text involved: **slack** (default, mouth open, unintelligent), **chomp** (~260ms
after eating), **alarm** (the cell 1–2 ahead is body — mouth small, eyes bigger), **dead** (mouth
a flat line, tongue lolling sideways). The snout exists purely so the face has somewhere to live;
a blunt cylinder head has no room for a mouth.

## Voice

All strings are in one `VOICE` block. Register is **mildly tired**, not zany, and it is aimed at
the situation rather than at the player. "you ate yourself." is right. Anything that reads as an
insult is not — the player is the only person here doing any work.

**The copy is a promise the code has to keep.** The note says "press anything", so the ready and
dead screens start on *any* key except the ones the browser owns (bare modifiers, Tab, F-keys,
ctrl/meta/alt combos). Shipped once accepting only arrows/WASD/space/Enter, which left the note
sitting there for anyone who pressed a letter. The `!alive` branch must come **before** the pause
key, or `P` gets swallowed by a `togglePause()` that no-ops when you aren't playing. There are
input tests covering all of this.

## Files

- `snek.html` — the whole game, self-contained, runs by double-clicking.
- `validate.js` — headless Node harness, 57 checks. Run before delivering:
  `& "C:\Program Files\nodejs\node.exe" validate.js` (node is installed but **not on PATH**).
- `snake.html` — the untouched original from a Claude Chat session, kept as a reference for what
  the mechanics were before the reskin. Nothing loads it. Safe to delete once nobody cares.

## Architecture

One IIFE, four blocks in order: `T` (every tunable number), `VOICE` (every string), the ink
primitives, then sim / render / input. `window.SNEK` exposes state and the step function — that's
both the test surface for `validate.js` and a console poking surface.

The body is drawn as a **smoothed outline**, not as cells:

1. segment centres → per-index widths (`segWidth`, includes belly lumps and tail taper)
2. split into runs at wrap seams, prepend a snout point
3. **jitter the spine**, then Chaikin corner-cut it, *then* build the L/R offsets and end caps

Step 3's order is load-bearing and was got wrong twice. Wobbling the finished outline instead of
the spine makes thin tails self-intersect and fork. And `dirs` point **tailward**, so both end
caps sweep −π from their starting side; sweeping +π arcs back into the body and bites a notch out
of the tip.

## Speed

**The ramp is geometric, not linear, and that's the whole point.** Every apple multiplies the gap
between steps by `STEP_RAMP` (0.9616), so every apple is worth an identical **3.8%**.

A flat "+0.34 cells/sec per apple" is even on paper and uneven to play. Speed is judged
proportionally, so that same increment is a 6.8% change on the first apple and 2.7% on the
twenty-fourth — the late ones land under the just-noticeable threshold and register only once
several have stacked up, which reads as the game lurching every few apples. It was reported as
"the speed seems to jump every few apples" and the diagnosis was exactly right even though there
was never a step in the code. Don't go back to a linear gain.

`STEP_MS` (200) is the gap at score 0, `STEP_MS_MIN` (71) is the floor, hit around score 27. Those
three numbers preserve the original pace at both ends; only the shape between them changed.

## Belly lumps

Every apple eaten pushes a lump that travels tailward one segment per tick and is dropped when it
passes the tail. Purely cosmetic, but it doubles as a live readout of your last few meals, and
it's the thing that makes the snake feel like an animal rather than a queue.

`LUMP_SIZE` is 13px on a 12.5px body — the bulge is wider than a 24px cell on purpose. It was 8px
and playtested as "seeable if you know to look for it," which is not enough for something that's
meant to be readable at a glance. Chaikin smoothing is *not* what was eating it (92% of the peak
survives); it was simply too small. `LUMP_MAX` caps the total so a back-to-back run of apples
doesn't sum into one uniformly fat tube.

## Dev controls

`` ` `` toggles a live readout — fps, state, tick, speed, length, head cell, food cell, lump
positions, both pupil offsets, boil phase, and whether the alarm check is firing. `P` pauses.

## Not built yet

Deliberately. Pass 1 answered one question: *does the doodle hold up in motion?* Candidates,
roughly in the order they'd be worth trying:

Agreed order:

1. **Shedding.** Drop 3 segments to escape a box you drew yourself into, at the cost of the length
   you spent earning them. Constrains the fun loop instead of removing it, and a snake shedding is
   thematically free. First because it's the only one that changes how the game is *played*, so
   it's the one most likely to need tuning rounds. Open: do shed segments stay on the paper as an
   obstacle, and is it free or on a cooldown.
2. **A food that runs away.** A bug that skitters a cell every few ticks, worth more than an apple.
   Adds a chase without adding a system. Purely additive, so it slots in after shedding settles.
3. **The tongue grab + sound**, together, as one feel pass. The tongue lashes out and drags the
   apple in over ~150ms; pen-scratch audio for movement.

   **The grab has to be retroactive.** The apple is consumed the instant the head enters its cell,
   and it must stay that way — predicting the grab one cell early would either desync the sim or
   lie when you turn away at the last moment. So the animation plays *after* the fact: on eat,
   draw the tongue extended back toward the cell the apple was in, with the apple sliding along it
   into the mouth. Reads as a snatch, changes no rules. This is also why it belongs with sound —
   both are juice on the same moment, and sound wants the movement cadence already settled.

- Anything that turns this into a powerup game is the wrong direction.

## Credits

Original Snake implementation: Claude Opus 4.8 (Claude Chat session — one of Trevor's
first).
Snek reskin, hand-drawn renderer, googly eye physics, validation harness: **Claude Opus 5**.

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
- `validate.js` — headless Node harness, 90 checks. Run before delivering:
  `& "C:\Program Files\nodejs\node.exe" validate.js` (node is installed but **not on PATH**).
- `backups/` — pre-job safety copies, per the collection convention.
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

## Shedding — prototype, not a decision

**Space drops the last `SHED_DROP` segments.** Live in the base game so it gets played naturally,
but every number is provisional and the whole mechanic can be switched off with `SHED_ON` for an
A/B against no shedding at all. Nothing here is tuned yet.

Three modes for what a shed leaves behind, and this is the live question:

- `none` — vanishes.
- `skin` — a **dashed** outline that fades over `SKIN_FADE_MS`. Harmless. Dashed because that's
  the drawing convention for a thing that isn't there any more, and it reads instantly as distinct
  from the body without needing a colour change.
- `wall` — solid pencil-grey fill, **permanent and lethal**, and food won't spawn on it.

### The rig

Feel can't be A/B'd across two runs that trapped you differently — you'd be comparing one bad
situation against a differently-bad one. So there's a trap trainer.

`T` arms a fixed, hand-verified position: identical board, identical heading, every time. It arms
**paused**, so the board can be read before the clock starts. `shift+T` steps back. Two traps:

- **cap** — sealed in on all sides, one tick to live. Shedding frees the cell directly above.
- **corridor** — three cells of runway into a dead end, with the ceiling above the corridor made
  of the last segments. Shedding opens a three-cell escape window.

Both are laid out so the cells shedding frees are the **last** entries in the array, because
shedding takes from the tail. `validate.js` re-derives that geometry rather than trusting the
comments — it checks connectivity, uniqueness, that the head really is sealed, and that a freed
cell is actually reachable. It also runs the trap end to end both ways: do nothing and die, shed
and live.

With the dev panel open, `1`–`5` cycle `SHED_ON`, `SHED_LEAVES`, `SHED_DROP`, `SHED_COOL_MS` and
`SHED_MIN_LEN` live, mid-run, and they work while paused so you can reconfigure between attempts.
`shift` cycles backwards. **Flip one knob, re-arm the same trap.** That's the whole method; without
it you're collecting anecdotes.

### Hypotheses on record, so they can be wrong

1. **Persistent walls will feel bad.** Snake's tension is that the board fills with *you* —
   legible, and your own fault. Debris fills it with something you can't reason about as your
   body, and it compounds: shed to escape, the debris worsens the board, shed again. That's a doom
   loop, and the standing principle is that penalties constrain the fun loop rather than remove
   it. Prediction: fading skins win.
2. **A cooldown is double-charging.** Length is already the price, and it self-balances — shedding
   while short hurts proportionally more. Prediction: free is correct, and a cooldown only earns
   its place if shedding turns out to be spammable.

## Dev controls

`` ` `` toggles a live readout — fps, state, tick, speed, length, head cell, food cell, lump
positions, both pupil offsets, boil phase, whether the alarm check is firing, and the full
shedding block (ready/cooling/too-short, every knob, live shed count, and the armed trap).
`P` pauses. `Space` sheds. Dev keys `1`–`5` and `T` only respond while the panel is open, so a
normal player can't fall into them.

## Not built yet

Deliberately. Pass 1 answered one question: *does the doodle hold up in motion?* Candidates,
roughly in the order they'd be worth trying:

Shedding is built and in prototype — see its section above. It is **not** settled, and the two
open questions (what a shed leaves behind, and whether it needs a cooldown) are what the trap
trainer exists to answer. Don't promote the current defaults to "decided" without playtest
evidence.

Remaining, in order:

1. **A food that runs away.** A bug that skitters a cell every few ticks, worth more than an apple.
   Adds a chase without adding a system. Purely additive, so it slots in once shedding settles.
2. **The tongue grab + sound**, together, as one feel pass. The tongue lashes out and drags the
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

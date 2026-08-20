# Snek

Snake, drawn badly on purpose, by someone who is not enjoying the meeting they're in.

**This game is sincere. Its bugs are real bugs — fix them freely.** There is no register of
authored defects and there should never be one. The *drawing* is deliberately bad; the *code*
is not. Wobbly lines and a lopsided apple are the art direction. A snake that clips through
itself is a bug.

<!-- marquee: play=snek.html defects=none -->
**`snek.html` is the game.** `snake.html` is a different, discarded build titled "SERPENT // 8K",
from before the ballpoint-pen reskin — neon-on-black, nothing to do with this. It is kept, not
used. The comment above is how Marquee knows which is which; without it this folder is ambiguous,
and a launcher offering "Snek" would be a coin flip between two unrelated games.

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

**The pull comes from the apple, not from below.** While there's an apple on the board the constant
force points at it, so the pupils lean toward it and swing across when it moves — which lands right
on the eat beat. Every other part of the simulation is untouched: still sloshing, still flung on
turns, still bouncing off the socket rim. Only the direction of "down" changed.

Two details that are easy to get wrong:

- **Take the short way round.** The board wraps, so an apple two cells behind must not read as an
  apple nineteen cells ahead. Wrap the delta into ±half the board before normalising.
- **Aim from each socket, not from the head.** Costs nothing and makes the eyes converge slightly
  when the apple is close. Free cross-eyed look.

`EYE_LOOK` blends between the two: 1 is full tracking, 0 is plain gravity.

This does bend the conceit — real googly eyes fall down, they don't track. What keeps it honest is
that **death reverts to true gravity.** Dead snek's pupils drop to the bottom and stay there, so
the blank stare survives and the physics gets the last word. If tracking ever starts reading as
"drawn eyes that follow you", pull `EYE_LOOK` back to ~0.5 rather than removing it.

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
- `validate.js` — headless Node harness, 125 checks. Run before delivering:
  `& "C:\Program Files\nodejs\node.exe" validate.js` (node is installed but **not on PATH**).
- `backups/` — pre-job safety copies, per the collection convention.
- `snake.html` — the untouched original from a Claude Chat session, kept as a reference for what
  the mechanics were before the reskin. Nothing loads it. Worth preserving.

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

## Belly lumps and deferred growth

Every apple eaten pushes a lump that travels tailward `DIGEST_RATE` segments per tick. **The lump
reaching the tail is what makes the snake longer** — the apple visibly arriving is what holds the
tail still for one tick. Lumps are not decoration; they are the growth, in transit.

- **Score is immediate, length is deferred.** The tally goes up on the bite, because feedback has
  to. Only the body waits. Deferring the score too would also mean shedding could cost you points,
  which is a much bigger change than it looks.
- **The lag is one body-length of ticks**, so it grows as you do: snappy early, a long pipeline
  late. That's thematically right (longer gut, longer digestion) and it self-balances.
- Eating several apples quickly produces a delayed *run* of growth rather than a step. Watch this
  in playtest — it's a real change to how risk reads, not only a visual.
- `DEFER_GROWTH: false` restores instant growth for the A/B. Keep that working.

**Shedding's cost is positional, and this was discovered by testing, not designed.** A shed only
discards lumps that have already travelled into the stretch being dropped — an apple swallowed a
moment ago sits up at the head and survives. So shedding right after eating is nearly free, and
shedding late in the pipeline throws away several meals. Emergent and arguably richer than a flat
cost, but it is *less legible* than "shedding wastes your food", so don't describe it that way in
player-facing copy until it's been felt. If it plays as arbitrary, the fix is to discard a
proportion of all in-flight lumps rather than only the ones in the dropped range.

`LUMP_SIZE` is 13px on a 12.5px body — the bulge is wider than a 24px cell on purpose. It was 8px
and playtested as "seeable if you know to look for it," which is not enough for something that's
meant to be readable at a glance. Chaikin smoothing is *not* what was eating it (92% of the peak
survives); it was simply too small. `LUMP_MAX` caps the total so a back-to-back run of apples
doesn't sum into one uniformly fat tube.

## Shedding

**Space drops a slice of the tail.** Playtested once and substantially revised; the remaining
open question is packaging (see *Modes*, below), not whether the mechanic works.

Three things a shed can leave behind. All three earned their keep in testing and the intent is to
ship them as **selectable modes**, not to pick a winner:

- `none` — vanishes. The classic game plus an escape hatch.
- `skin` — a **dashed** outline that fades over `SKIN_FADE_MS`. Harmless. Dashed because that's
  the drawing convention for a thing that isn't there any more; it reads as distinct from the body
  without needing a colour change.
- `wall` — hardens into solid pencil-grey, **lethal and permanent**, and food won't spawn on it.
  This is the one with the most in it.

### Walls need a grace period, and it is not optional

A shed drops the cells the snake was just occupying — so in wall mode, the cells shedding frees
are *exactly* the cells it makes lethal. Net gain zero. Without a grace period **shedding cannot
save you from anything in wall mode**; it is pure downside.

So a fresh wall is **soft**: passable, drawn dashed. It hardens when either

- the snake has finished passing through it (it entered, and is now clear), or
- `WALL_GRACE` ticks elapse having never been entered.

It must **never** harden while the snake is still inside it. That would set solid around a body
mid-transit and kill you for something you could not have seen coming. The in-transit case holds
the grace open indefinitely.

`WALL_GRACE` counts **ticks, not milliseconds.** Escaping is a spatial problem — you need N cells
of travel — and a fixed 2000ms would buy 10 cells early and 28 late, silently changing the rule as
you speed up.

Soft and hard must stay visually distinct (dashed vs filled). A player who can't tell which debris
is safe isn't being challenged, they're guessing.

### Why the drop is a percentage

`SHED_MODE: 'pct'` drops `SHED_PCT` of current length (min `SHED_MIN_DROP`). Playtest found bigger
drops strictly better — a small drop opens too narrow a window to actually escape through — and a
percentage delivers that *and* kills spam in the same move:

- long snake, which is when you get trapped → big drop → a real escape window
- short snake, which is when you don't need it → negligible drop → won't bail you out
- chain-shedding pays less every time and asymptotes at `SHED_MIN_LEN` instead of emptying

`'fixed'` is kept as a knob so the comparison stays available.

### Shedding has to cost something, and length alone isn't it

`SHED_COOL_MS` is **1500**. The reasoning that said it was double-charging was wrong, and wrong in
a specific way worth recording: **speed tracks `score`, never length**, and `shed()` doesn't touch
score. So shedding costs no points, no speed, and leaves you shorter — and short is *safer* in
Snake. Length is a score-flavoured cost masquerading as a survival cost.

Playtest confirmed spam was viable, and the sharper version of the problem: if you can shed away
the whole snake, the end state of spamming is indistinguishable from starting a new game. A cost
you can pay down to nothing isn't a cost. The cooldown blocks it outright rather than trying to
out-clever it with incentives.

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

With the dev panel open, `1`–`0` cycle `SHED_ON`, `SHED_LEAVES`, `SHED_MODE`, `SHED_PCT`,
`SHED_DROP`, `SHED_COOL_MS`, `SHED_MIN_LEN`, `WALL_GRACE`, `DEFER_GROWTH` and `EYE_LOOK` live,
mid-run, and they work while paused so you can reconfigure between attempts. `shift` cycles backwards. **Flip one knob, re-arm
the same trap.** That's the whole method; without it you're collecting anecdotes.

**The rig has a known blind spot:** the end-to-end trap tests originally only ran in `skin` mode,
which is why the harness passed 90 checks while wall-mode shedding was fundamentally broken. When
you add a `SHED_LEAVES` value, add an end-to-end trap test for it.

### The two predictions, and how they died

Both were wrong. Kept because *how* they were wrong is the useful part.

1. **"Persistent walls will feel bad."** The mechanism was right — walls compound, the board
   degrades, shedding to escape worsens the board, repeat. The verdict was backwards: that
   compounding is the tension, and it may be the mode's whole identity. The error was misreading
   the standing principle. "Penalties constrain the fun loop rather than remove it" *endorses*
   this — you can still move and eat, the board just gets meaner. Escalating pressure is
   constraint. I filed it as removal.
2. **"A cooldown is double-charging."** Wrong because the premise was wrong: length is not a
   price. See the cost section above. The tell was there in the code the whole time — `shed()`
   never touches `score` — and playtest found the consequence before the reasoning error was
   spotted.

The pattern in both: a plausible mechanism reasoned correctly, then a confident evaluative leap
that the rig would have settled in ninety seconds. **Predict the mechanism, test the verdict.**

### Modes — the open question

The three `SHED_LEAVES` values are meant to become selectable game modes rather than a setting to
resolve. Unbuilt: mode selection, per-mode best scores, and whatever the modes end up called.

## Dev controls

`` ` `` toggles a live readout — fps, state, tick, speed, length, head cell, food cell, lump
positions, both pupil offsets, boil phase, whether the alarm check is firing, and the full
shedding block (ready/cooling/too-short, every knob, live shed count, and the armed trap).
`P` pauses. `Space` sheds. Dev keys `1`–`0` and `T` only respond while the panel is open, so a
normal player can't fall into them.

The readout also carries **`lag`** — `score − (length − START_LEN)`, i.e. how many apples are
still travelling down the body. Under deferred growth that number is the pipeline depth, and it's
the fastest way to see whether digestion is behaving.

## Not built yet

Deliberately. Pass 1 answered one question: *does the doodle hold up in motion?* Candidates,
roughly in the order they'd be worth trying:

Shedding is built and playtested — see its section above. What's left there is **mode selection**,
not tuning.

Deferred growth is built — see *Belly lumps and deferred growth*. It wants playtesting, not
building.

Remaining, in order:

1. **A food that runs away.** A bug that skitters a cell every few ticks, worth more than an apple.
   Adds a chase without adding a system.
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

## Marquee billing

<!-- marquee: billing=feature -->
Headlined in Marquee. Complete and playable end to end per the catalog. Editorial only — it changes which shelf the launcher puts this
on and nothing else. Change the comment above when the game's state changes.

## Marquee poster

<!-- marquee: paper=#f6f2e3 ink=#2f3d8c accent=#d9736f face=hand -->
Marquee prints most sheets in its own house palette. This one is printed in
the game’s colours instead, taken from its own stylesheet (--paper, --ink, --margin) rather
than invented — so if the game is ever recoloured, this is the line to update,
and it sits next to the code that would change.

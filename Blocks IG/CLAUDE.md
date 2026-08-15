# blocks, i guess

A game about a developer who couldn't be bothered. You press play, someone upends a bag of
tetrominoes into a box, they pile up until they hit the top, and you are awarded a random number.
It lasts about thirteen seconds. That's the whole thing, and it is finished.

**Credits:** concept by Trevor. Built in Claude Chat by **Fable 5** over two turns (11 Jul 2026) —
the anti-design wrapper, the physics engine, every gag. Port into the collection, measurement pass
and this file by **Claude Opus 5** (10 Aug 2026).

**State:** complete. Fable called it "possibly complete-complete; this might genuinely be a one-job
game," and after a second pass for dump pacing that still looks right. Open to fine-tuning and to
small additions that fit the joke. Not open to features.

---

## Read this before touching anything

**This is a parody of low-effort software, and nearly everything that looks broken is authored.**
This game has a register and it is long, because the whole surface of the game is the joke. Do not
silently fix a typo, a dead control, a missing stylesheet, or an unsorted table here.

### The register

1. **There is no CSS. At all.** Times New Roman, blue underlined links, white background, a canvas
   with a plain 1px black border, a `border=1` table with default browser cell chrome. The game
   looks like a 1996 homework assignment. Fable's rule, and it is the sharpest line in the design:
   **"lazy means default, not ugly."** No Comic Sans — *Comic Sans is trying.* Nobody chose these
   fonts; that's the point. **Adding a stylesheet deletes the game.**
2. **The options menu does nothing.** A music checkbox labelled "music (there is no music)", a
   difficulty dropdown with exactly one option, and the line "colors: yes". None of it is wired to
   anything and none of it ever should be.
3. **`version: probably`.** On the menu, under everything else.
4. **The credits are fake** — "made by: someone / engine: html / special thanks: no". Real credit
   lives in this file, on purpose. Do not put a real name on that screen.
5. **The leaderboard is unsorted**, headed "leaderboard (real)", and seeded with `bob / 8` so
   somebody is always beating you with a single-digit score. Your entry is spliced in at a
   **random index**, not a ranked one.
6. **The leaderboard also never resets, and grows forever.** `S.lb` is built once at page load and
   `startGame()` doesn't touch it, so playing five times leaves five entries all marked "(you)"
   scattered through the table at random positions. This reads exactly like a state-teardown bug
   and is funnier than anything that was designed on purpose. **Leave it.** (Verified 10 Aug 2026.)
7. **The score is random** — `100 + floor(random * 900)` — and the card visibly *thinks* for 700ms
   before producing it, so you watch it decide.
8. **The game can declare victory on a technicality.** A piece that wedges high on a loose pile and
   holds still for a quarter second triggers the top-out even when the pile below it has gaps.
   Fable considered guarding against this and **chose not to**: "the game declared victory on a
   technicality" is in character. If it ever starts reading as a bug rather than a shrug, the knob
   is `SETTLED_T`, not a new rule.

### The two things that are sincere

**The physics engine is real and it is the load-bearing joke.** Under the unstyled HTML is an
honest impulse-based rigid-body solver: sequential impulses with accumulated normal and friction
components, Baumgarte positional bias, per-square point-in-square contact generation, Coulomb
friction clamped to the normal impulse, and sleeping bodies with a wake-on-fast-impact rule. It is
by far the most work in the file and it exists entirely to be ignored.

That contrast *is* the comedy. Fable's framing: "enormous effort spent on exactly the thing nobody
asked for, wrapped in menus that took nine seconds." The pile has to settle convincingly or the
gag has nothing to push against. **Do not simplify this into a grid of falling rectangles**, and
do not treat its complexity as accidental — a future instance skimming a ten-second joke game is
exactly the reader who would "clean it up."

Trevor's verdict on it, first playtest: *"The physics feels perfect right now."* It is done — with
one real flaw that nobody can see, documented under **Known defect: square interpenetration** below.
Read that before you either "improve" the solver or repeat the claim that it's flawless.

**The pile is slightly sticky and that is comedy-positive.** Sleeping bodies resist being shoved
awake, which reads as "packed." Fable ruled on this deliberately. Only revisit it if it crosses
into looking broken.

---

## The one rule

**The apathy is the creator's, never the game's, and the player never gets to do anything.**

Mash a key and small text appears: *"that doesn't do anything."* Click the canvas: *"no."* That is
the entire input surface and it is permanent — asked and confirmed, 10 Aug 2026. The messages are
deliberately quiet because **discovering your own irrelevance is better than being told upfront**.

The moment one input works, you have promised a system, and this game cannot pay that off. Any
proposal that gives the player a verb — rotate, nudge, a secret key, anything — is the wrong
change no matter how funny the individual bit is.

The joke also never punches at the player. The player is the only person in this transaction doing
any work. "good job or whatever" is aimed at the absent developer's indifference, not at you.

---

## Measured behaviour

Twelve headless runs through `window.__blocksTest`, 10 Aug 2026, current build:

| | |
|---|---|
| Run length | 10.7–15.9 s, **avg 13 s** |
| Bodies at top-out | 68–99 |
| `MAX_PIECES: 110` cap | **never reached** — pure safety net, not a mechanic |
| Worst physics step | **1.9–7.3 ms** against a 16.6 ms budget |
| `nice` fires per run | 0–3, **avg 1.25**; 3 of 12 runs saw none |

Two things this settles:

- **No spatial hashing needed.** Fable offered to add it if the peak hitched. It doesn't — worst
  case is under half a frame budget with the broadphase as it stands (O(n²) circle-reject over
  ≤99 bodies). The offer is closed; don't build it speculatively.
- **The old "~38 seconds to top-out" figure is stale.** That was measured before the bag-dump
  pass, which roughly tripled the pour rate. 13 s is the current number.

### `nice` — settled at once-ish per run

`nice` is **an achievement for an act of God**: if the tumbling pieces ever accidentally fill about
a full row, a small "nice" appears and nothing else happens. It is the only moment in the entire
game that acknowledges the player exists, and it is addressed to nobody in particular — the game
complimenting its own pile.

**Fable designed it to be near-impossible** — *"you will almost certainly never see it, which is
the point"* — and that was true of the build they wrote it for. It stopped being true in the same
turn that fixed the pour. The bag-dump pass packs the bottom of the pile, and `checkNice` scans
**bottom-up and returns on the first hit**, so what it now measures is whether the *bottom* of the
pile is dense rather than whether a row formed by luck. It needs 15 of 16 sample columns covered
(`NICE_FRAC: 0.93`, 16 columns across 360px). Measured rate: about once per run.

**Trevor ruled on this 10 Aug 2026: once-ish per run is the keeper rate, and it should not go
higher.** A gag nobody ever sees isn't a gag, and at this rate it lands often enough to read as a
small recurring grace note without ever becoming a system. The near-impossible version is recorded
above as history, not as a target — **do not "restore" it.**

If it ever does need pulling back down, the knobs are `NICE_FRAC` toward 1.0 and/or scanning
top-down so it tests the loose part of the pile instead of the packed part. Raising it further is
out of bounds.

---

## Known defect: square interpenetration

**Found 10 Aug 2026 while building `validate.js`, confirmed visually, and deliberately left alone.**
It is the one place where this file's praise of the physics engine needs qualifying.

**What happens.** Two pieces that get more than about half overlapped are driven into *perfect*
coincidence rather than being pushed apart, and then go to sleep there permanently. It is not rare
and it is not an edge case: **about 28 deeply-overlapped pairs per run, involving roughly half of
all bodies, in every run measured.** A confirmed example had an S and a J piece sharing two entire
22×22 squares, both asleep.

**Why nobody has ever noticed.** The renderer draws opaque squares in array order, so the piece
underneath is simply painted over. A merged pair looks exactly like one piece. You can only see it
by drawing the pair in isolation with alpha, which is how it was confirmed.

**Mechanism.** `pointVsSquare` resolves a contact along the *nearest face* of the square the corner
is inside. That is correct for shallow contacts and backwards for deep ones: once a corner is past
the square's midline the nearest face is the *far* side, so the impulse pushes it further through
instead of back out. Full overlap is therefore a stable attractor rather than something the solver
resists. And at exact coincidence the four corners land precisely on the other square's boundary,
where the test's `>=` on the half-extent counts them as outside — so **zero contacts are generated**,
the pair stops interacting entirely, and both bodies sleep.

**Consequences, such as they are.** The pile is denser than it looks and holds more pieces than it
appears to. This very likely contributes to the packed bottom that makes `nice` fire once a run.
Nothing destabilises: no escapes, no explosions, no non-finite state, and the pile still settles
convincingly, which is the only thing this game actually needs from its physics.

**Why it is not fixed.** The player cannot see it, Trevor signed off on how the pile feels, and the
game is finished. The honest fix means replacing the corner-based contact generator with real SAT
or clipping — the single riskiest change available, aimed at the one system that already feels
right, to correct something invisible. That trade is bad.

**If it ever does get fixed**, the cheap targeted version is roughly five lines: in
`pointVsSquare`, when penetration exceeds about half the square, take the normal from the vector
between the two square centres instead of from the nearest face. That turns the attractor around
without touching the solver. **It will change how the pile settles**, so it needs a fresh feel
check from Trevor rather than a green harness — and a green harness is not evidence here, because
`validate.js` deliberately guards this defect at its current level rather than asserting it away.

---

## Rejected, with reasons

Fable made these calls explicitly. Quarantined here so nobody cheerfully re-proposes them.

- **"Tetris, i guess"** as the name. Real, actively-litigated trademark. Zero practical risk for a
  local joke, but the dodge got folded into the joke instead: the developer who couldn't be
  bothered to design menus also couldn't be bothered to license the name. `blocks, i guess`,
  lowercase, is funnier.
- **Comic Sans.** "Comic Sans is trying." See the register.
- **A sound gag.** An options page acknowledging there's no music is funnier than a single sad beep.
- **An achievements page.** No.
- **Over-stuffing generally.** Fable's line, and the best guardrail in the file: **"lazy has to stay
  disciplined or it becomes a different, worse joke."** Judge every proposed addition against it.
- **Guarding the premature top-out.** See register item 8.

### Prior art, checked

*Not Tetris 2* (stabyourself.net) is tetrominoes with rigid-body physics, so the mechanic isn't
novel. The joke is: theirs is "Tetris where rotation is analog and you suffer" — a hard game
wearing a joke. This is a joke wearing a game, where the player doesn't act at all. Not a
duplicate; the anti-design wrapper and the fake leaderboard are the actual product.

---

## Open threads

Only one, and it's Trevor's to call:

- **The end beat.** Top-out → 1 s pause (`END_PAUSE`) → card → score "thinks" for 700ms before
  producing a number. Trevor: *"the timing of the ending beat is fine for now, though I might ask
  for some tweaks later depending on the vibe of the big picture."* Knobs are `END_PAUSE` and the
  hard-coded `700` in `showDone()`.

Anything else should clear a high bar. This is a finished ten-second joke, and the failure mode is
making it into a five-minute one.

---

## Files

- `blocks-i-guess.html` — the whole game, self-contained, runs by double-clicking. No external
  dependencies of any kind. Renamed from `blocks_i_guess_job1.html` on 10 Aug 2026 via `git mv`,
  for the collection's kebab-case convention; history follows.
- `backups/blocks_i_guess_job1.html` — the Chat original under its original name. That's history,
  leave the name alone.

- `validate.js` — headless Node harness, **43 assertions**. Run before delivering any change:

  ```
  & "C:\Program Files\nodejs\node.exe" validate.js
  ```

  (node is installed on this machine but is **not** on PATH.) It takes an optional path argument
  so a mutated copy can be checked without touching the real file.

### The harness asserts the jokes, and that is the point

Half of it is ordinary engine protection — piece construction, resting, stacking, containment,
determinism under a seeded RNG, the `dt` clamp, wake-on-impact, no NaN, no escapes.

The other half asserts **the register**, because in this game the jokes *are* the spec. There are
tests that fail if someone adds a stylesheet, sorts the leaderboard, resets it in `startGame()`,
makes the score meaningful, deletes the 700ms thinking beat, puts a real name in the credits, adds
a second difficulty option, or guards the premature top-out. There is a test that fails if the
player ever gets a verb. The harness prints a warning on failure telling you to read this file
before "fixing" anything in those two groups.

This is the transferable idea from this game: **where authored defects are the design, a harness
that only tests correctness will happily watch someone dismantle the product.** Worth stealing for
any parody build in the collection.

**It was mutation-tested.** Twelve deliberate breakages were introduced into a scratch copy and the
harness was checked for catching each one. It caught 11 — and the miss mattered: a handler that
nudged a piece's *velocity* slipped past the "player never gets a verb" test, because that test
compared positions at the instant of the key press and velocity does not become position until the
next step. It is now an A/B against an identical seeded run, comparing full body state after the
sim has had 90 steps to carry any injected impulse into position. 12/12 after the fix. **If you add
a test here, break the thing on purpose and confirm it goes red** — the first version of that test
passed happily against a game that had been broken exactly as forbidden.

`window.__blocksTest` exposes `S`, `CONFIG`, `stepSim`, `spawnPiece`, `spawnBurst`, `startGame`,
`checkTopOut`, `checkNice`, `makePiece` and `bodyMinY`. The harness needs a few DOM-side functions
too and gets them by appending its own export line to the extracted script rather than editing the
game — **the game file is never modified by the harness.**

## Architecture

One `<script>`, six banner-commented blocks in order: `CONFIG` (every tunable), `SHAPES`/`COLORS`/
`LB_SEED`, `State`, `Physics`, `Game step`, `Rendering`, `Screens / DOM`, `Loop`.

Screens are six sibling `<div>`s toggled by `display`; there is no router and doesn't need to be.
The loop is a plain rAF with `dt` clamped at 250ms in `frame()` and again at 50ms in `stepSim()`,
then split into `SUBSTEPS` — so a backgrounded tab doesn't detonate the pile.

Contact generation is corner-vs-square in both directions per square pair, which over-generates
contacts (a resting face-to-face pair produces several). The solver's accumulated-impulse clamping
absorbs that, and at these body counts it costs nothing. It is not a bug.

Two guards worth knowing about, both real defensive code rather than jokes:

- **The NaN guard** in `physicsStep()` splices out any body whose position or angle goes
  non-finite. Comment reads "if physics ever explodes, quietly delete the evidence." It has never
  been observed firing.
- **`MAX_PIECES`** force-ends the game if the pile somehow never reaches `END_Y`. Never reached in
  testing; keep it anyway.

## If you're picking this up

The tempting move is to make it more of a game — a score that means something, a real leaderboard,
one input that works, some CSS to make it "presentable." Every one of those is the wrong change.
The game is a ten-second demonstration of not caring, and it only works because the not-caring is
total and the physics underneath is quietly excellent.

If you want to add something, the safe surface is **copy**: the menu strings, the options labels,
the credits lines, the two input rebuffs, the end-card text. Those are free-standing and the
register above tells you the register to write in — flat, unbothered, aimed at nobody.

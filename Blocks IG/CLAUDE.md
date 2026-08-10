# blocks, i guess

A game about a developer who couldn't be bothered. You press play, someone upends a bag of
tetrominoes into a box, they pile up until they hit the top, and you are awarded a random number.
It lasts about thirteen seconds. That's the whole thing, and it is finished.

**Credits:** concept by Trevor. Built in Claude Chat by **Fable 5** over two turns (5 Aug 2026) —
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

Trevor's verdict on it, first playtest: *"The physics feels perfect right now."* It is done.

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

### `nice` has drifted from its intent

`nice` was designed as **an achievement for an act of God** — if the tumbling pieces ever
accidentally fill about a full row, a small "nice" appears and nothing else happens. Fable's stated
intent: *"you will almost certainly never see it, which is the point."*

That was true of the pre-dump build. It is no longer true: it fires about **once per run**. The
mechanism is that `checkNice` scans **bottom-up and returns on the first hit**, so what it actually
measures is whether the bottom of the pile is packed — and after a bag dump it reliably is. It
needs 15 of 16 sample columns covered (`NICE_FRAC: 0.93`, 16 columns across 360px).

**This is a live discrepancy, not a decision.** It is documented here rather than fixed because the
rarity was Fable's design call and Trevor's to re-rule on. If you want the original intent back,
raise `NICE_FRAC` to 1.0 and/or scan top-down instead of bottom-up so it tests the *loose* part of
the pile. If once-a-run turns out to be the better game, delete this section and update the intent
above rather than leaving the two in contradiction.

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

**No validation harness yet.** `window.__blocksTest` exposes `S`, `CONFIG`, `stepSim`,
`spawnPiece`, `spawnBurst`, `startGame`, `checkTopOut`, `checkNice`, `makePiece` and `bodyMinY`,
so the physics is fully drivable headlessly — the measurement table above was produced through it.
A harness would be cheap and would protect the one part of this game worth protecting. Worth
building if anyone ever touches the solver.

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

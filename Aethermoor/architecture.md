# Æthermoor · architecture

How the single HTML file is actually put together, and how to validate a change to it. Split out
of `CLAUDE.md` to keep that file inside the collection's 200-line target — read it first for the
register of authored defects and the settled design decisions, which are what you must know
*before* touching anything. This file is what you need once you're in the code.

---

## Shape

Roughly 1,450 lines, three parts: a `:root` palette and stylesheet, ten `<section class="screen">`
blocks, and one script.

**Screens** are `data-screen` sections; only `.active` displays. `go(screen)` swaps the class,
scrolls to top, shows or hides Glim's dock, and sets his line. There is **no back navigation
anywhere and that is intentional** — *"A name, once given to the Aethervein, cannot be unspoken."*
Irreversibility is in the fiction and in the code.

Order: `title → intro → name → stats → aspects → appearance → background → confirm → loading`,
then `lesson` and `interlude` alternating for as long as there are lessons. `lesson` is a single
generic screen that every tutorial renders through; `interlude` is the short bar between them.

**The two point-allocation screens run on one generic allocator.** `ALLOC` keys a config by system
id (`primary` / `secondary`) — its definition list, base value, pool size, state key, DOM ids, and
the line Glim says when the pool hits zero. `buildAlloc`, `adjA`, `updateA` are shared.
`buildStats()` / `commitStats()` etc. are thin wrappers kept so the inline `onclick` call sites in
the markup still read plainly.

**Adding a third allocation system is a data change**: append a config to `ALLOC`, add a `<section>`
with a grid div, a points element and a next button, and wire the wrapper. This seam is the single
most useful thing in the file for the road ahead — the game is going to need a lot of these.

**Glim's voice** lives in `glimLines`, keyed by screen. `setGlim(html)` writes raw HTML into the
dock, so lines may use `<span class='g-em'>` for the gold emphasis. Every line is routed through
`personalize()`, which resolves a `{name}` token to the player's escaped name (or "traveller"
before the naming rite). No current line uses the token — Job 1 hand-weaves the name in
`commitName()` — but the seam is there so later jobs don't rebuild it.

`GLIM_SCREENS` controls where he appears. **He is absent from the title screen and from the naming
rite** — you face the naming alone — and returns for everything after. That absence is authored;
don't dock him everywhere for consistency.

**The dock is fixed to the bottom of the viewport** and its height feeds back into `#stage`'s
bottom padding through the `--dock-h` custom property, maintained by `fitDock()` and a
`ResizeObserver`. Glim's lines vary a lot in length and wrap to five lines on a phone; without this
the dock covers the bottom of long screens. If you add anything else fixed to an edge, do the same.

**Tweakable values** are all near the top of their sections: `CAP` (20) and `FLOOR` (1) for
allocation bounds, pool sizes in `ALLOC`, `IL_TICK`/`IL_STEP`/`IL_HOLD` for interlude pacing,
`STATS` / `ASPECTS` / `RUNE_PROPS` / `APP` / `BGS` / `wyrdNames` / `loadTips` as flat arrays.

### The lesson engine (Job 2)

**Adding a tutorial is a row in `TUTORIALS`.** A row is a title block plus an ordered list of
steps. A step is one of six verbs, each with its own renderer, and every step may read and write
`world` — which is what makes lessons interlock rather than merely follow one another.

| Verb | What the player does | Gate |
|---|---|---|
| `choose` | Picks one of N option cards | on selection |
| `socket` | Picks one of N compact glyph tiles | on selection |
| `charge` | Presses and holds to fill a meter | on completion |
| `alloc` | Spends a pool across properties — **reuses the rites' allocator** | when the pool hits 0 |
| `read` | Reads prose and acknowledges | immediately |
| `damage` | Watches a value fall | after its beat |

Prompts and Glim lines may be strings or functions; functions are evaluated at render so they can
quote what the player just built. `{font}` and `{resonance}` tokens interpolate in prompts, and
Glim lines additionally run through `personalize()` for `{name}`.

**`ALLOC.rune` is the seam paying off.** Lesson 2's allocation system is a third `ALLOC` config
and no new allocator code — its `pool` is rewritten from `world.resonance` before each build,
`floor:0` lets a property empty again, and `gatesStep:true` makes `updateA` drive the lesson's
gate. That last flag exists because the rites' allocators enable their own next button directly
and never touch `tut.satisfied`; without it Continue lights up and does nothing. **If you add a
fourth allocation system inside a lesson, it needs `gatesStep`.**

**Steps that resolve on a timer register a `stepFinish`.** Dev's `\` key calls that rather than
`satisfy()`, because merely unlocking the button skips the step's writes to `world` and leaves
every later lesson reading stale state. Anything that adds a self-resolving verb must set it.

### The load that never finishes now runs underneath everything

The big loading bar still never completes. After ~17s Glim offers to use the wait, and **every
lesson happens inside it** — `#ribbon` is a thin always-visible reminder pinned to the same
percentage, riding the same `loadTimer`. `enterLessons()` stops the tip cycle and cancels any
pending `loadSpeech` timeouts so the loading narration cannot fire over a lesson.

**Interludes between lessons always complete.** That contrast is the joke and it only works if one
of the two bars is honest — everything in Æthermoor finishes loading except Æthermoor. Do not make
the interlude asymptotic too.

### Dev mode

Backtick (`` ` ``) toggles a readout. `[` / `]` previous/next lesson, `\` finish the current step
properly, `0` return to the endless loading screen. Its main job is surfacing `attn`, which is
invisible by design and will drive Phase 2.

### Validating a change

Node is available. The harnesses live in the session scratchpad rather than the repo; rebuild them
cheaply by extracting the single `<script>` block and (a) `new Function()`-ing it for syntax, (b)
stubbing a minimal DOM and driving `TUTORIALS` / `buildAlloc` / `mendCost` directly. The checks
worth keeping: every step has a known verb and a prompt; `resonancePool()` tracks Attunement; the
allocator opens with exactly the drawn pool and cannot over- or under-spend; `mendCost()` reduces
every property, never below 1, and records deltas for display.

Browser-side, the useful thing is driving a full run with only the interactions a real player has
and asserting each step actually advances — that is how the `gatesStep` stall was found. Note that
timers throttle to 1Hz when the preview tab is backgrounded, so an interlude that looks stuck in a
harness may be fine in play.

---

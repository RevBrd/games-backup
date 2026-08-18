# Dead Space: Block Party!

A Tetris game presented as a licensed tie-in that a cheap studio made without playing the source
material — and which is running, in-fiction, on the entertainment system of a ship where everyone
is already dead.

Nobody in the game ever acknowledges either layer. That is the whole piece.

Source: `dead-space-block-party.html` (~1300 lines, self-contained, double-click to play).
`DS-BP.txt` is the **retired** React original — kept for reference, not loaded by anything. Don't
edit it; if you need to know what shipped, read the HTML.

---

## Read this first: the defects are authored

This game is a parody of shovelware. Its broken-looking artifacts are the joke, and a cold
instance will sand every one of them off in about four minutes. **Do not fix these.**

| Where | Artifact |
|---|---|
| `:938` | `Congratulaions!` — misspelled on the level-complete card |
| `:396` | `{{TIP_BODY_EN_US_HAMMOND_07}}` — untranslated string token shipped as a tip |
| `:392` | `displayName:"Dr. Hammond"` — wrong title, on exactly one tip out of eleven |
| `:314-315` | "Mr. Temple" becomes "Mr. Tempe" one line later; neither is ever found |
| `:441` | "Hi I'm Ellie. This is Tetris." — a placeholder that never got written |
| `:443-449` | One tip copy-pasted across six characters (`// Shared tip (outsourced QA)`) |
| `:289,309` | "Infirmary" is the name of both level 1 and level 6 — asset reuse |
| `:617` | Multiplayer connects, thinks about it, reports all crew unavailable |
| `:1264-1265` | Leaderboard: `Rank: #1 of 1!` on a win, `[Connection unavailable]` on a loss |
| end screen | A win reports **Level: 12** on an 11-level game (`level+1` after the last level-up) |

Line numbers are in `dead-space-block-party.html`.

**The general rule, and it comes from the project's own history: in this game a bug is a candidate
feature.** The single best mechanic here started as an actual defect (see *Origin* below). If
something looks wrong, surface it and ask. Never quietly correct it.

## The other layer: horror in plain sight

Distinct from the defects above — these read as filler and are load-bearing. Preserve them.

- **Nicole is dead and is guiding you anyway.** She sends video messages, invites you to her
  office, and narrates the whole game. You never reach her.
- `:381` — "Complete each line to **make us whole**!" Convergence, dressed as encouragement.
- **Mercer** describes vivisection as mentorship and healing. **Kyne** describes Marker devotion as
  scientific enthusiasm. **Mathius** insists across six tips that he is calm. **Necro** describes
  predation as friendship and promotion.
- **Kendra is the crew member you are sent to find twice and never find.** Level 2 fails to find
  her; level 4 appears to find her. She is the one canon manipulator and here she is only sweet.
- Levels 2, 5, 7, 10 unlock nobody. The search fails more often than it succeeds.

## The Marker mechanic

The load-bearing system, and the one most at risk from a well-meaning balance pass.

Markers (`✦`) spawn on the board and are worth **+250** when their row clears. Five separate tips
(`:450-455`, `// Marker cover story`) tell the player they're valuable and to grab them.

Every Marker collected permanently ratchets `MARKER_INTERFERENCE` (`:471-478`), applied at
`:1001` (preview) and `:1114` (input):

1. **Display drift** (from Marker 0): the Next-piece preview shows a piece that isn't coming. Starts
   at 1%, climbs to 35%.
2. **Input loss** (from Marker 4): arrow presses are silently swallowed.
3. **Input drift** (from Marker 7): left and right silently swap.

**The score incentive is the trap, and the game never once acknowledges it.** No warning, no
tell, no "the Marker is interfering" message. That silence is the mechanic. Do not add feedback.

Corruption is monotonic — it never decreases within a run.

### Origin — why this exists

Worth knowing because it explains the whole project's disposition toward bugs:

1. The game started as a straight parody of a bad early-2000s licensed reskin, made by developers
   who clearly never played the source material.
2. **An early build had a genuine bug**: the piece preview ran off a separate RNG from the actual
   piece queue, so it was simply wrong. Rather than fix it, it was kept and formalized as a flat
   10% chance to lie — justified in-fiction as the game being badly built.
3. Separately, the Marker was added as a scoring pickup: tone-deaf, treated as a straightforwardly
   good thing, and there are *several* of them, which is already wrong.
4. **The convergence:** the two were merged so that collecting Markers drives escalating
   corruption, never acknowledged in-game. The pickup and the corruption source became one object.

That last point is the thing to protect. Anyone tuning "the Marker economy" or "the interference
curve" as separate systems has already broken it.

## Design rules

- **Hard drop is deliberately immune to interference.** `inputLoss` and `inputDrift` fire only on
  `Arrow` keys (`:1114-1125`); Space is untouched. Rationale: late-game the player isn't
  hard-dropping much anyway — they're panic-tapping left, and having one of those inputs go right
  is where the corruption should be *felt*. The intended locus is lateral movement under time
  pressure. So the answer to "make it scarier" is never "corrupt more input types."
- **Satire aims at the absent developers and the charlatan, never at the crew.** Every character
  is a sympathetic victim, including Necro. Nobody in the fiction is in on it.
- **Everything stays relentlessly upbeat.** No character ever gets a moment of dawning horror. The
  tone must not crack, including on the game-over and win screens.
- **Most tips end with a crowbarred Tetris tip**, often a total non-sequitur after something
  ominous. That gear-change is part of the joke — keep it, and keep it clumsy.

### Writing new tips

Tips live in `TIPS` (`:345-456`, 99 of them) and are gated by which crew are unlocked. Each character
has one specific failure mode; stay inside it:

`isaac` cheerful ignorance, ship trivia that's ominous only if you know the source · `necro`
predation as friendship · `nicole` sweetly dead · `hammond` security chief insisting nothing is
wrong while describing evidence that it is · `kendra` warm, oblivious, doomed · `kyne` Marker
devotion as science · `mercer` atrocity as care · `mathius` escalating insistence on calm ·
`ellie` activities-coordinator obliviousness

## How it's built

One HTML file, no assets, no libraries, no build step. Plain CSS and plain JS — the React and the
two icon imports are gone. Tuning constants are grouped at the top under a `TUNING` banner:

- `:237-262` — `TUNING`: gravity curve, scoring, Marker rates, tip timings, card durations
- `:264-274` — board dims, shapes, colors
- `:276-343` — `CREW` and `LEVELS` (11 levels, level *n* completes at 10·*n* lines; the
  final level sets `ending:true`, so a win is 110 lines)
- `:471-478` — the interference table
- `:510-521` — nine hand-drawn SVG character portraits, no image files
- Scoring: `[0,100,300,500,800][cleared] * (level+1)`, plus 250/Marker
- Speed: `Math.max(100, 800 - level*63)` ms per gravity tick (`gravitySpeed()`, `:677`)
- Marker spawn: 20% chance on any clear, max 2 on board, rows 8–17 only

**Rendering:** the game screen is built once and updated in place — a pool of 200 board cells, four
piece divs, four ghost divs, and a keyed map of Marker divs. Nothing re-renders wholesale, which is
what keeps the starfield and the tip animation from restarting on every gravity tick. The
splash / intro / end screens are cheap enough to rebuild from strings.

**Window fit:** `fitStage()` scales the active screen to the window (never above 1:1) and a
`ResizeObserver` re-fits when content changes size. The tip slot is a fixed 112 px — measured
against all 99 tips, the tallest renders at 106 — so a tip appearing never rescales the board
mid-game.

### Dev mode — `Ctrl+Shift+D`

Off and invisible by default; the corruption is supposed to be unannounced, and this panel breaks
that on purpose for testing only. Shows the live interference tier, the measured lie rate against
the table rate, running counts of swallowed and swapped inputs, and whether the preview is lying
*right now*. `M` grants a Marker, `N` adds 10 lines to skip a level. Built at `:1159`.

## Known fragility — accurate, not a to-do list

- **The top of the interference table is probably unreachable.** Reaching tier 10 needs 10 Markers
  collected; at 20% per clear with a cap of 2 on board, a 110-line run realistically lands around
  6–8. Still an estimate — but dev mode now makes it measurable, and that's the way to settle it
  before touching the spawn rate. See the warning about tuning these as separate systems.
- **`lock()` doesn't bounds-check the top of the piece** (`:1019`) — it guards `pr+r>=0` but not
  `pr+r<ROWS`. Unreachable in play, because `collides()` already refuses any position with a cell
  at or past the floor, so `lock()` is only ever called on a legal position. Carried over from the
  original unchanged. It only bites if you call `lock()` by hand from the console.
- **The pause overlay covers more than the board.** The board wrapper is a flex item that stretches
  to the sidebar's height, so the dim layer runs about 50 px below the playfield. This is exactly
  what the React build did; it's preserved, not fixed. Same for the transition cards, which centre
  on the stretched wrapper rather than on the board.

### Resolved by the port — do not reintroduce

These were real hazards in the React build. The port removed the conditions that caused them.
Quarantined here so nobody restores them as if they were load-bearing.

- `setLines` doing side effects inside its state updater (double-fired level transitions under
  StrictMode). The level-up now runs as ordinary sequential code inside `lock()`.
- The 30 ms `setTimeout` before a hard-drop lock, which was waiting for refs to catch up and could
  double-lock on two fast Space presses. Now: render the landed piece, lock on the next animation
  frame, guarded by `hardDropPending`. The visual beat is preserved; the race is gone.
- Refs mirroring state on every render so the `setInterval` loop wouldn't read stale values. There
  is no render cycle to go stale against now — the loop reads `G` directly.

## Format

**Done.** `dead-space-block-party.html` runs by double-clicking it, works offline, and uploads to a
static host as-is. Validated with a headless harness (syntax, DOM-stub boot, 41 logic and content
assertions including a verbatim check of every tip, level and crew string against the original) plus
a played browser pass through both endings.

`DS-BP.txt` remains as the retired React original. It needs Claude Chat's invisible React and
lucide to run; uploading *it* still produces a blank page. It is reference only.

## Pending

- **More character tips** — wanted, see *Writing new tips*.
- **Audio.** None at all. The genre being parodied would absolutely have had a four-bar MIDI loop.
- **Measure the interference curve** with dev mode and settle whether tiers 8–10 are ever seen.
- ~~Port to standalone HTML.~~ Done 4 Aug 2026.
- ~~Re-date the fiction from 2008 to 2001 and drop the EA attribution.~~ Done. A tie-in dated
  seven years before the game it's licensed from is itself a broken artifact, and 2001 is the more
  accurate era for the shovelware being parodied. The visual language was already late-90s.

## Credits

- Original build (React, in Claude Chat) — Trevor's concept; assisting model not recorded.
- Port to standalone HTML, dev mode, window fit — Opus 5, 4 Aug 2026.

## Marquee billing

<!-- marquee: billing=feature -->
Headlined in Marquee. Complete and playable end to end per the catalog. Editorial only — it changes which shelf the launcher puts this
on and nothing else. Change the comment above when the game's state changes.

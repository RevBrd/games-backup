# Dead Space: Block Party!

A Tetris game presented as a licensed tie-in that a cheap studio made without playing the source
material — and which is running, in-fiction, on the entertainment system of a ship where everyone
is already dead.

Nobody in the game ever acknowledges either layer. That is the whole piece.

Source: `DS-BP.txt` (~630 lines, one React component). See **Format** below for why it's a `.txt`.

---

## Read this first: the defects are authored

This game is a parody of shovelware. Its broken-looking artifacts are the joke, and a cold
instance will sand every one of them off in about four minutes. **Do not fix these.**

| Where | Artifact |
|---|---|
| `DS-BP.txt:268` | `Congratulaions!` — misspelled on the level-complete card |
| `DS-BP.txt:133` | `{{TIP_BODY_EN_US_HAMMOND_07}}` — untranslated string token shipped as a tip |
| `DS-BP.txt:129` | `displayName:"Dr. Hammond"` — wrong title, on exactly one tip out of eleven |
| `DS-BP.txt:51-52` | "Mr. Temple" becomes "Mr. Tempe" one line later; neither is ever found |
| `DS-BP.txt:178` | "Hi I'm Ellie. This is Tetris." — a placeholder that never got written |
| `DS-BP.txt:181-186` | One tip copy-pasted across six characters (`// Shared tip (outsourced QA)`) |
| `DS-BP.txt:26,46` | "Infirmary" is the name of both level 1 and level 6 — asset reuse |
| `DS-BP.txt:339` | Multiplayer connects, thinks about it, reports all crew unavailable |
| `DS-BP.txt:389` | Leaderboard: `Rank: #1 of 1!` on a win, `[Connection unavailable]` on a loss |

**The general rule, and it comes from the project's own history: in this game a bug is a candidate
feature.** The single best mechanic here started as an actual defect (see *Origin* below). If
something looks wrong, surface it and ask. Never quietly correct it.

## The other layer: horror in plain sight

Distinct from the defects above — these read as filler and are load-bearing. Preserve them.

- **Nicole is dead and is guiding you anyway.** She sends video messages, invites you to her
  office, and narrates the whole game. You never reach her.
- `DS-BP.txt:118` — "Complete each line to **make us whole**!" Convergence, dressed as encouragement.
- **Mercer** describes vivisection as mentorship and healing. **Kyne** describes Marker devotion as
  scientific enthusiasm. **Mathius** insists across six tips that he is calm. **Necro** describes
  predation as friendship and promotion.
- **Kendra is the crew member you are sent to find twice and never find.** Level 2 fails to find
  her; level 4 appears to find her. She is the one canon manipulator and here she is only sweet.
- Levels 2, 5, 7, 10 unlock nobody. The search fails more often than it succeeds.

## The Marker mechanic

The load-bearing system, and the one most at risk from a well-meaning balance pass.

Markers (`✦`) spawn on the board and are worth **+250** when their row clears. Six separate tips
(`DS-BP.txt:188-192`, `// Marker cover story`) tell the player they're valuable and to grab them.

Every Marker collected permanently ratchets `MARKER_INTERFERENCE` (`DS-BP.txt:204-212`):

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
  `Arrow` keys (`DS-BP.txt:539-543`); Space is untouched. Rationale: late-game the player isn't
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

Tips live in `TIPS` (`DS-BP.txt:82-193`) and are gated by which crew are unlocked. Each character
has one specific failure mode; stay inside it:

`isaac` cheerful ignorance, ship trivia that's ominous only if you know the source · `necro`
predation as friendship · `nicole` sweetly dead · `hammond` security chief insisting nothing is
wrong while describing evidence that it is · `kendra` warm, oblivious, doomed · `kyne` Marker
devotion as science · `mercer` atrocity as care · `mathius` escalating insistence on calm ·
`ellie` activities-coordinator obliviousness

## How it's built

Everything is one file, no assets. Tuning constants are at the top and grouped:

- `DS-BP.txt:4-11` — board dims, shapes, colors
- `DS-BP.txt:13-70` — `CREW` and `LEVELS` (11 levels, level *n* completes at 10·*n* lines; the
  final level sets `ending:true`, so a win is 110 lines)
- `DS-BP.txt:204-212` — the interference table
- `DS-BP.txt:220-232` — nine hand-drawn SVG character portraits, no image files
- Scoring: `[0,100,300,500,800][cleared] * (level+1)`, plus 250/Marker
- Speed: `Math.max(100, 800 - level*63)` ms per gravity tick
- Marker spawn: 20% chance on any clear, max 2 on board, rows 8–17 only

## Known fragility — accurate, not a to-do list

Do not "clean these up" in isolation. They matter mainly because they will bite during the port.

- **`setLines` does side effects inside its updater** (`DS-BP.txt:489-507`) — it calls `setLevel`,
  `setUnlockedCrew`, and `setTransCards`. React invokes updaters twice under StrictMode, which
  would double-fire level transitions. It works today only because the current runtime doesn't
  enable StrictMode. Any port must either preserve that or restructure this properly.
- **The hard drop waits 30 ms for refs to catch up** (`DS-BP.txt:548`) before locking. It's a race
  that happens to win. It also means two fast Space presses can double-lock.
- **Refs mirror state on every render** (`DS-BP.txt:428-430`) so the `setInterval` game loop reads
  fresh values instead of closing over stale ones. This is deliberate and load-bearing — a port
  that drops it gets a game loop that silently reads stale state.
- **The top of the interference table is probably unreachable.** Reaching level 10 needs 10 Markers
  collected; at 20% per clear with a cap of 2 on board, a 110-line run realistically lands around
  6–8. Estimate, not measured. If the deep-corruption tiers should actually be seen, the spawn rate
  is the knob — but see the warning about tuning these as separate systems.

## Format

`DS-BP.txt` is a React component: it's written in a shorthand browsers can't read, and it names two
external libraries. Claude Chat supplies both invisibly, which is why it runs there. A static host
serves files as-is with no translation step, so **as it stands, uploading this produces a blank
page.**

Target is a **single self-contained HTML file** — double-click to play, works offline, uploads
anywhere. That port is a real pass, not a quick edit: the game-loop plumbing gets rewritten (see
*Known fragility*). The three borrowed icons are trivial to drop — the game already hand-draws
nine portraits in raw SVG.

Do the port with this document open. It is the operation where the authored defects are most
likely to get silently repaired.

## Pending

- **Port to standalone HTML.** Not started.
- **More character tips** — wanted, see *Writing new tips*.
- ~~Re-date the fiction from 2008 to 2001 and drop the EA attribution.~~ Done. A tie-in dated
  seven years before the game it's licensed from is itself a broken artifact, and 2001 is the more
  accurate era for the shovelware being parodied. The visual language was already late-90s.

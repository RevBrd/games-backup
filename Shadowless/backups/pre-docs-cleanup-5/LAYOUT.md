# Shadowless — the board layout

Depth behind the "Working on it" section of `CLAUDE.md`. Read that first. Come here before you
change anything about how the board is sized, where the mat's halves sit, or how the hand fans —
every rule below was paid for with a wrong version first, and several of them look wrong until you
know what they are protecting against.

The one-line summary: **the board fits itself to the window by measuring, never by targeting a
number, and never by a media query.**

## Looking at it, and reading it back

**You do not have to guess and you do not have to ask for a screenshot.** `tools/shot.js` renders the
built game at any exact viewport, and the DEV tab prints what the fitter actually did with it — the
applied zoom, the layout chosen, the mat cloth width, the spare desk. Both are documented where they
are run, in **[TOOLING.md](TOOLING.md)**, along with the two traps that will otherwise bite: the
screenshot is stretched relative to the layout, so **judge proportion from the DEV tab and not off
the PNG**.

## Why the mat has a visible rim

`--mat2` (the cloth's bottom stop) and `--bg` (the desk) are four points apart, and `.side.mine`'s
warm gradient has faded out by then. Without a light inner rim the mat simply dissolves into the
table, and the board reads as trailing off into empty space. **This cost a session an hour** hunting
a "dead band" between the mat and the hand that did not exist — the DEV readout said `spare desk
7px` while the eye insisted on ninety. Dark border outside, light rim inside; that is the edge.

## `fitBoard()` — scale to what you actually got

A "1920x1080 laptop" is not a 1920x1080 page. Browser chrome and the taskbar take 150–200px, and
Windows display scaling at 125–150% can leave the page as little as **1280x600 CSS pixels**. The
first sizing pass targeted 1366x768 and missed for exactly that reason.

So the fitter measures the mat against the height it actually got and scales the whole board column
with `zoom`, **both ways**: down to 0.6x when the mat would scroll, and up to 1.3x when there is
room going spare, so a large window gets bigger cards rather than a band of empty desk.

`zoom` rather than `transform:scale` because zoom reflows — the mat really does get smaller instead
of being drawn smaller over the same footprint. It costs nothing perceptually on a scaled display:
at 150% OS scaling a 0.8 zoom is still larger than 1:1 on an unscaled screen.

The shrink pass runs four times rather than solving in one shot, because each pass changes the
CSS-pixel space the next one measures in. It converges. The growth pass steps and re-measures
rather than solving, because the binding constraint moves: sometimes the mat starting to scroll,
sometimes the action bar reaching the bottom of the window, sometimes the mat running out of width.

## `chooseLayout()` — measure, never a media query

When there is room, the field (prizes + bench) stands beside the Active instead of under it — the
`.boardcol.wide` block. Whether there is room is decided by **applying the layout and measuring
whether it overflowed**.

This was a `@media (min-width:1560px)` rule once and it silently never fired on the machine it was
written for: a media query tests CSS pixels, and with Windows display scaling at 125% a 1920-wide
screen is a 1536-wide page. `fitBoard()` also scales the column, which changes the available CSS
width again. There is no honest static threshold.

**`.boardcol.wide` must come AFTER the CARD SYSTEM section in `style.css`.** It overrides widths set
there at equal specificity, so moving it earlier silently loses and the two Actives stop lining up.

Both this file and the stylesheet said *last in the file* until 11 Aug 2026, and it had not been
last since Job 5 appended its collection section below it. Nothing broke, because none of that
touches board widths — but **an invariant that reads as violated is worse than no invariant**: the
next reader either hoists a working block or trusts the wording and appends a board rule underneath.

## Rules that look wrong and are not

**Never give the two mat halves `flex:1 1 0`.** It looks right and it is wrong twice. Your half is
much taller than the opponent's — it carries the attack buttons — so equal halves leave a band of
dead mat above the opponent while clipping your own bench. Worse, the overflow then happens *inside*
a flex item and never reaches the table's `scrollHeight`, so `fitBoard()` cannot see it and silently
does nothing. Sides take their natural height and `.table` centres the pair; that keeps the content
against the centre line **and** keeps overflow measurable. This cost a round trip to find.

**The Active card's heights in `style.css` are MEASURED, not chosen.** `min-height` 249px yours /
149px theirs — the tallest of all 69 implemented Pokémon rendered into each slot at 318px wide,
poisoned and confused so the status row is populated (Clefairy and Chansey win). Re-derive by
rendering the pool if the card face or fonts change. The status row is always appended even when
empty for the same reason: poisoning something used to grow the card by a line and shift the whole
board.

**Anything that measures a size must pick one coordinate space.** `getBoundingClientRect()` reports
*post*-zoom screen pixels; `offsetWidth` / `clientWidth` / `scrollHeight` report *pre*-zoom layout
pixels. Because `fitBoard()` zooms the board column, mixing the two silently mis-measures whenever a
scale is applied — it put the fanned hand off the right edge on exactly the viewports that needed
scaling, and nowhere else, which is why it survived the first sweep.

**No `auto` margins anywhere in `.boardcol`.** This one is nastier than the coordinate-space trap,
because it makes the DOM *lie to you*. An auto margin resolved inside a `zoom`ed flex column shows
up in **neither** `offsetTop` **nor** `getBoundingClientRect()`: the hand panel sat 90px lower than
both APIs reported, they agreed with each other and with the arithmetic, and all three were wrong.
Two rounds of instrumentation were spent trusting them. What settled it was painting the three
column children solid red/green/blue and looking — when the geometry API is the thing under
suspicion, colour in the boxes:

```bash
node tools/shot.js out.png --size 1366x768 --board --turns 6 \
  --js "UI.handPanelEl.style.background='#f00'; UI.tableEl.style.background='#00f'; UI.barEl.style.background='#0f0'"
```

The fix was to stop needing the measurement: `.table` is `flex:1 1 auto` and takes the leftover
height, and `.handpanel` has no auto margin. Spare room becomes **mat** — the cloth grows and
`justify-content:safe center` keeps the two halves centred in it — instead of becoming a band of
bare desk that nothing could see. Note that `fitBoard()`'s `boardFitsAt()` still reads
`bar.getBoundingClientRect().bottom`; that is safe only because there is no longer an auto margin
above it. Put one back and the fitter goes blind again.

**The cloth is as wide as its contents, at two levels.** `.mat` is `width:max-content` so the
leftover green is margin by construction, and `.table` is too, so the *cloth itself* stops where the
board stops and the desk shows either side. Before that second one, a 1900px window printed a metre
of empty mat around 800px of content — sprawl rather than a mat.

## The hand

**It never wraps.** A second row costs ~70px of mat, and on a laptop the mat has none to give. The
cards fan instead: they overlap only as far as they have to, measured after layout rather than
assumed, so it holds at any window width.

**The hand face is `handCard()`, and it deliberately carries no attack names or rules text.** A card
in hand is a thing you are deciding whether to play, and what you decide on is its name, its kind,
and what its attacks cost against what they do. The words were the whole of the problem:
"Poisonpowder" cannot wrap inside a 95px column, so it broke mid-word into three lines, and a
clamped Trainer paragraph was cut off mid-sentence anyway — which is worse than not showing it.
Hovering peeks the real printed card into the rail; that is where the words live.

**There is no compact text-carrying face any more, and do not rebuild one.** `miniCard()` was it,
and it was deleted on 11 Aug 2026 — a gravestone comment in `ui.js` marks where it was. **A dialog
does not have more room than the hand**, which this file claimed for a job and which is why opening
setup printed "Flamethrower" as `Fla/met/hro/wer`: `.sheet .hand .pcard` is the same 150px. Three
separate screens replaced that face for the same reason, and `smoke.js` asserts a picker renders no
`pc-atkname` specifically to stop a fourth trying. **Opening setup uses `handCard`** like the real
hand. *[The three screens, and the sentence in this file that caused it →](HISTORY.md)*

A picker shows `pullFace()`, the printed scan, because a picker is the surface where the card is
most completely the **subject** — you are choosing which physical card, not steering a token in
play. That is the standing decision in `CLAUDE.md` about where scans belong; pickers predate the
scans, which is the only reason they were not on its list. The scan also solves the layout problem
by not having one: it is a picture of the answer. Tiles shrink past eight items, because with a
dozen cards you are scanning for a name rather than reading, and a grid that scrolls at reading size
hides half of itself.

**`.sheet.wide` was set on the picker and defined nowhere**, so the widest sheet in the game was the
same 820px as the narrowest. It is 1040px now, which is what the card grid needed.

Dropping the words bought the width back, which was the other half of the job: **98px instead of
150px is 11 cards with no overlap at all on a 1915px window, where the old face managed 6 at
1366px.**

**A sigil in a flex column needs `flex-basis: 0`, never `auto`.** The emblem is a square `viewBox`
with no intrinsic size, so at `width:100%` an `auto` basis resolves to the element's own width — the
art silently *sets* the row height instead of consuming what is left of it, and because the hand
stretches every card to the tallest, one ballooned emblem inflates all of them. That is most of why
the first hand face came out too big. With a basis of 0 the row is sized by the text, `min-height`
gives the art a floor, and the grow factor hands it the leftover. `.hc-art` and `.bcart` both do
this; so should anything else that fills space with a sigil.

**The fan's 34px floor is a legibility floor**, not an arbitrary minimum: it is what a card must
still show of itself when the fan is at its tightest — the type-coloured left edge, the first
characters of the name, and the left of its sigil. It only binds past ~28 cards at 1366px, and
overflowing is the correct failure there; a row of 22px slivers says nothing. Anything that must
survive the overlap belongs in the card's **left** strip, because that is the part the next card
does not cover.

**The hand panel starts at the mat's width and grows past it only when the hand needs the room**
(up to the full board column). Spanning the whole column unconditionally left a bordered box two
thirds empty sitting under a mat that had just been narrowed to its contents; it read as a container
rather than as a hand. `layoutHand()` sets that width explicitly in JS rather than with
`width:max-content`, because max-content plus the fan's `--fan` margin is circular — the fan shrinks
the content, which shrinks the panel, which changes the fan.

`layoutHand()` uses `offsetWidth`, **not** `getBoundingClientRect()`, for the reason in the
coordinate-space rule above.

## The bench

**Bench tile height is a budget set by the OPPONENT's side, not by yours.** Both benches must be the
same height or the mirror the whole mat is built on stops reading — and the opponent's field column
is only as tall as their Active (149px), of which prizes already take 56. That leaves 84px, which is
what both tiles get. Your side has more slack than that; it stays in the ticker above rather than
making your bench taller than theirs.

Fixed, not stretched, for the same reason the Active is fixed: a benched Pokémon getting Poisoned
must not resize the board. The sigil absorbs the difference instead.

**The bench sigil is cropped, not shrunk.** 84px of tile leaves about 30px for art against 94px of
width, and the emblem keeps its square aspect — so letting it fit gives a 30px mark adrift in pale
stock, which reads as a smudge. It is drawn at the tile's full width and the box clips it to the
height available, centred, giving an illustration window rather than a speck. A bench tile still
carries no attacks and no text: the size gap against the Active is what makes the Active read as the
one that is actually fighting.

**The on-mat ticker is top-aligned** so it starts level with the top of the Active card opposite it.
It was bottom-aligned, which anchored it to the BENCH label below and put the column's slack at the
top — the most conspicuous empty space on the mat.

## The coin toss

**It lands on the centre line, and that is the design decision** — the animation is the easy part.
Roughly half of all flips are the **opponent's**: Poison Sting, Confuse Ray, their Whirlwind. So
anything anchored to your hand, your half, or the space beside your discard pile would be claiming
their coin was tossed on your side of the table. The centre line is between the two players, it is
already where the board shouts at you, and it is the one spot that is there whatever the hand is
doing. It is also, for once, a case where an empty gap is not a risk: the toss is absolutely
positioned out of a **zero-height** strip, so it overhangs both halves without reflowing either and
costs nothing when no flip is happening.

That no-reflow property is load-bearing rather than tidy. The board behind it is frozen on a
pre-action snapshot for the duration, and a coin that resized the mat would move the very cards you
are waiting on.

**Anywhere the coin might move to has to clear the ticker.** You read the log underneath the coin
while it spins, so landing the coin *in* the ticker would cover the one thing a player is doing
during the two seconds it is in the air. Moving it there was proposed and rejected on 10 Aug 2026;
*[both arguments, and why this one beat the attribution one →](HISTORY.md)*

**The result is announced in exactly one place.** It used to be in the action bar; the bar now says
only *why* the game has stopped. Having it in both made the mat's version read as decoration rather
than as the event, which is the whole thing the toss was moved to fix.

Two smaller notes. The faces are **drawn, not lettered** — an H and a T are unambiguous and say
nothing, and the point of putting the toss on the mat is that it should look like an object; obverse
is struck in the board's amber, reverse in its steel, both with a milled rim so the edge reads as
metal while it tumbles. And the tumbling coin carries a **static 62° tilt underneath its animation**,
which is the reduced-motion fallback: with the animation suppressed a flat coin would sit showing
its obverse for the whole toss, which looks like a result that then changes its mind. Edge-on
commits to nothing. The landed *face* survives reduced motion, because that is information.

**`UI.flipDelay < 250` skips presentation entirely** (`dispatch()`), which is what the DEV tab's
"coin pause: off" setting does. Worth knowing before you try to screenshot a fast flip and find
there is nothing to screenshot — and it is how every test that is not *about* the flip gets past it.

**Nothing may change on screen until the coin lands, and the visual effects were exempt from that
for a job.** The board is frozen on a pre-action snapshot for the whole toss, which was always
right — but `diffForFx()` reads the **real** post-action state and used to be armed at dispatch
time, so the prize tile, the KO flash and the hit flash all fired while the coin was still in the
air. On any flip that decides whether a Pokémon survives, the flashing prizes announced the result
about two seconds early. `diffForFx` now runs when the presentation queue empties, in the same frame
the board unfreezes. **Anything else that reacts to the outcome must be armed there too**, not in
`dispatch`.

## The Energy picker shares the coin's spot

**Which Energy gets discarded is asked on the centre line, in the coin's own place** — Trevor's call,
12 Aug 2026. A picker that appears wherever the action is makes you hunt for it with your eye every
time; a fixed place is learned once. The two are never live together, because a coin is presentation
and this is an interaction the game is waiting on, so they share the strip rather than compete.

It also beats an overlay sheet for a reason specific to this choice: **a sheet would cover the board,
and you are choosing from a Pokémon you want to look at while you choose.**

Three things it inherits and one it must not:

- The zero-height absolutely-positioned strip, so it overhangs both halves without reflowing either.
- The rule that it **must clear the ticker**, for the same reason the coin does — the ticker is what
  says *why* you are being asked.
- The capsule styling, so it reads as the same object the game uses to stop and ask you something.
- **It must NOT inherit `pointer-events:none`.** `.cointoss` sets it so a landing coin cannot swallow
  a click on the board underneath; a picker that ignores clicks is not a picker. `.pickcap` turns
  them back on.

**The action bar has to say what is happening now.** It kept printing "choose a Benched Pokemon to
bring up" while the bench was long since chosen and the board was asking which Energy to spend —
`UI.energyPick` outranks targeting in `renderActionBar`, and arming the picker clears `UI.targeting`
so the bench stops being highlighted for a question already answered.

**The picker only appears when the choice is real.** Three identical Fire Energy is not a decision.
The rule lives in the engine (`energyChoiceIsReal`) rather than here, so the AI and the UI cannot
disagree about it — see [ENGINE.md](ENGINE.md).

## The opening flip

**The game opens by presenting the who-goes-first flip**, over an empty board, before the setup
sheet. It is the flip with the largest measured consequence in the game — the seat is worth about
5.7 points of win rate, see [AI.md](AI.md) — and until 12 Aug 2026 it was the one coin the player
was *told* about in the log rather than shown.

Two things make it work, and both are load-bearing:

- **The setup sheet is suppressed while it plays** (`renderScreen`). The coin lands on the mat's
  centre line and the sheet is a full overlay, so a sheet drawn during the toss covers the thing
  being presented.
- **The snapshot blanks the opponent's side.** `newGame()` runs `setupAuto(1)` before the flip, so
  the real state already holds their Active and Bench — and suppressing the sheet exposed all of it,
  handing you their entire opening position before you chose yours. Both the card game and the Game
  Boy game place face down and turn up together. Blanking them **in the frozen snapshot** is the
  honest fix rather than a cheat: that view exists precisely to show a board that is not the current
  one, and while this coin is in the air their side genuinely is face down.

Note the overlay is *translucent*, so a dimmed version of the opponent's Active has always been
faintly visible behind the setup sheet itself. That is pre-existing and separate from this.

## Opening setup is a preview of the mat, not a dialog about it

`renderSetup()` builds your half of the board — an `ACTIVE` zone and a five-tile `BENCH`, in the
mat's own silk-screened captions, filled by clicking your real hand face. It replaced a wrapping
grid of `miniCard`s and a two-line text readout that said `Active: — none —` next to a board.

Three things it reuses on purpose, because reproducing them by hand is how they drift:

- **`renderBenchTile`, not `renderSlot`, for the bench.** The board's bench is deliberately not a
  small copy of the Active, and that size gap is most of what this screen is previewing.
- **`.side.mine` on the strip**, which brings the warm gradient with it, so it reads as a piece of
  your own cloth rather than a second panel inside the sheet. It also brings
  `.side.mine .slot.pcard.act{min-height:249px}`, which has to be overridden — that number is
  measured for a card carrying attack buttons on a board that must not resize mid-turn, and neither
  applies here. **Any override of it needs five classes to win**; `.setupmat .slot.act` silently
  loses to `.side.mine .slot.pcard.act`.
- **The empties match their filled footprint exactly** — 106×84 for a bench tile, 318 wide for the
  Active — so placing a Pokémon never moves the row or resizes the strip.

**The hand here does not fan and does not wrap.** `layoutHand()` measures the real panel and has
nothing to measure against in a sheet, and seven cards at 98px fit without overlapping anyway.
`align-items:flex-start` matters more than it looks: the old screen inherited `stretch`, which made
a Fire Energy as tall as a Charmeleon and filled the difference with dead grey.

**`setupTakeBack()` exists because this screen has slots.** A slot you can click and cannot un-click
is a trap, so the engine gained a take-back — legal anyway, since setup is arranging cards before
anything is revealed. Taking the **Active** back returns the whole bench with it: a bench with no
Active is not a legal board and nothing downstream knows how to dig the player out of it.

## Actions live where the thing they act on is

Settled with Trevor 10 Aug. The board used to speak two interaction languages:
direct manipulation on the mat, *and* a detached row of verb buttons at the bottom that described
things already visible on screen. The bar is now a **status line plus commitments**, not a menu.

**Almost every card in hand has exactly one verb.** Energy can only be attached, a Stage 1 can only
evolve, a Trainer can only be played, a Basic can only be benched — so the bar's menu was nearly
always a menu of one, and choosing from it was a click with no choice in it. `handVerbs(i)` is the
single definition; `clickHandCard()` runs it when there is one and falls back to the bar's menu when
there are several, which is the only case where it is a real choice. **`smoke.js` drives the bar by
setting `UI.sel` directly**, which is why that fallback has to keep working.

**A Basic plays on click, with no confirmation.** Trevor's call, taken knowingly: the risk is a
misclick benching something, and the deal is that it stays this way unless it actually becomes
annoying. It is the one action with no target to double as a confirmation.

**Promote and Whirlwind's send-up are bench clicks.** `slotTargetable` had a `'promote'` scope the
whole time while the bar printed "Promote Growlithe" as text two inches below Growlithe. Both are
`forced: true` — the game cannot continue until you choose, so there is no Cancel, and the generic
targeting branch in the bar skips forced targeting so it cannot render one.

**`armForcedChoice()` runs at the top of `render()`, and that placement is the whole point.** It
lived in `renderActionBar()` first, which is wrong by exactly one step: `render()` builds the table
and *then* the bar, so the bench tiles asked `slotTargetable()` while `UI.targeting` was still null
and drew themselves unhighlighted. The prompt appeared and nothing lit up. Same shape as
`writeViewportDump()` having to run after `chooseLayout()`.

**Retreat is a row on the Active card and is the one confirmation-gated action.** It sits under the
attacks, beside the retreat cost it charges. Two things earn it the gate where attacking does not:
it is now a one-pixel misclick away from the attacks, and it spends Energy without giving an effect
back. Arming it **disables every attack button** for as long as it is armed — without that, arming
retreat and then misclicking an attack ends your turn.

The armed row says only "Retreating" and "Cancel". The instruction is already on the centre line and
in the bar, and a third copy would make the card's version read as decoration — the same mistake the
coin toss made when its result was announced in two places.

## The title screen is not fitted, and deck select is now bounded

`.deckscreen` sizes itself with `clamp(..vh..)` rather than the board's JS fitter. **Still no JS
fitter, and do not add one** — CSS is enough here and there is nothing to measure.

What changed in Job 7b is that **deck select is the one screen whose content grows without bound**:
the opponent ladder gains a bracket every time a set goes live. So `.deckscreen:not(.starter)` is
pinned to `100vh`, the ladder is the single `flex:1 1 auto` child that absorbs the leftover, and the
Play bar is `position:sticky`. The starter pick is excluded — it is one row on an empty page and
wants to grow.

Two rules in there were each paid for with a wrong version first, and both are the same mistake in
opposite directions. **The ladder needs a `min-height` floor of one full tile**: without it the flex
squeeze wins on a short viewport and at 1280x600 it collapsed to ~70px of card art with every name
clipped off. **Its two wrapper divs must NOT have `min-height:0`**: with the floor in place but the
wrappers allowed to shrink below their contents, the locked strips escaped and painted straight over
the options row. Only the scroll container may shrink, and only to its floor.

**The sticky Play bar is what actually holds.** The fixed chrome plus one full row of challengers
exceeds 768px and no amount of shaving fixes that as the ladder grows, so the box scrolls and the
one control you always need stays put. *[The four defects a screenshot caught here, and what 136
passing tests could not see →](PROGRESSION.md)*

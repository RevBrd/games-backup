# Shadowless — the board layout

Depth behind the "Working on it" section of `CLAUDE.md`. Read that first. Come here before you
change anything about how the board is sized, where the mat's halves sit, or how the hand fans —
every rule below was paid for with a wrong version first, and several of them look wrong until you
know what they are protecting against.

The one-line summary: **the board fits itself to the window by measuring, never by targeting a
number, and never by a media query.**

## Seeing it: `tools/shot.js`

You do not have to guess and you do not have to ask for a screenshot.

```bash
node tools/shot.js out.png --size 1366x768 --board --seed 4242 --turns 4
node tools/shot.js out.png --size 1915x863 --board --js "UI.devTab='dev'; render()"
```

It drives the locally installed Chrome headless against the built file. `--board` skips the title
screen and deals a real game; `--turns N` lets the AI play N plies synchronously so the shot is of
a board with something on it; `--js` runs anything you like in the page first. Chrome cannot be
handed a script on the command line, so the tool copies the built HTML **beside itself** — the card
scans load from a relative path, and a copy in the system temp folder would show a board with every
face missing and look like a regression.

Two things about it that will bite otherwise:

- **`--window-size` is not the viewport.** Headless Chrome reserves a virtual frame and a scrollbar
  gutter, so asking for `1366x768` lays the page out at **1348x672** — 96px short, which is more
  than the whole action bar. The tool measures the offset every run (via a `--dump-dom` probe) and
  corrects the window so `--size` really is the viewport. Do not replace that with a constant.
- **The PNG is stretched.** The image comes out at the *window* size while the page was laid out at
  the *viewport* size, and the frame is 96px tall against an 18px gutter, so the bitmap is stretched
  about 1.13x vertically and 1.01x horizontally. Fine for "is the text clipped", wrong for "is that
  gap too big". The tool prints the skew. **Judge proportion from the DEV tab, not off the PNG.**

## Reading it: the DEV tab

The DEV tab's Viewport panel prints the page size, the device pixels, the display scaling, and then
what the fitter actually did with all of it — the applied zoom, which layout was chosen, the board
column's size, the mat cloth's width and whether it got the height it wanted, and the desk showing
between the mat and the hand.

Those bottom lines are filled by `writeViewportDump()`, which `render()` calls **after**
`chooseLayout()` and `layoutHand()`. It has to: `renderDev()` runs while the rail is still being
built, so the board column it wants to measure is not in the document yet and every size reads 0.
That is not a hypothetical — it shipped that way for one build and reported a confident row of
zeroes.

The "spare desk" figure measures `handpanel.offsetTop` against the mat's bottom rather than
subtracting heights, because the gap is made by the hand panel's `margin-top:auto` and therefore
lives *inside* `scrollHeight` where a height subtraction cannot see it.

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

**A dialog does not have more room, and this file used to claim it did.** The line here said the
overlay sheets could keep the old compact face "because there is room in a dialog and nothing
competing for it". They cannot: `.sheet .hand .pcard` is the same 150px, so the opening-setup screen
printed "Flamethrower" as `Fla/met/hro/wer` for as long as that sentence stood. **Opening setup now
uses `handCard`** like the real hand — see the section below.

**The Trainer pickers were worse, and they use the real scans.** The guess was that they might
legitimately keep a text-carrying face for the rules text, and one screenshot settled it: in the
picker's column "Fire Spin" rendered *one letter per line*, "Twineedle" as `Tw/ine/edl/e`, and every
Trainer's text was clamped mid-sentence — so the information the guess was protecting was the
information being destroyed.

**`miniCard()` was that face, and it is gone as of 11 Aug 2026.** It was kept unused for a job on
the argument that it was the only compact text-carrying face we had and the next session wanting one
should find it rather than rebuild it. Nothing claimed it, the trigger this file set — *if nothing
has by the time Job 6 lands* — fired, and Trevor called it. A comment at [ui.js:389](src/ui.js:389)
marks where it was and why. **Do not rebuild one**: three separate screens replaced it for the same
reason, and `smoke.js` asserts a picker renders no `pc-atkname` specifically to stop a fourth trying.

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

**Proposed and rejected, 10 Aug 2026: moving it into the on-mat ticker zone.** Trevor's report was
that the centre line gets in the way, and testing had convinced him the attribution worry above was
overblown — a coin on your side does not actually read as only your coin. Both fair, and the ticker
looked like the right home because it is already where flip *results* print, which would have put
the coin and its outcome in one place instead of two.

**It was wrong for a reason neither of us had written down: you read the log underneath the coin
while it spins.** The centre line puts the toss directly above the ticker, so the text explaining
what is being flipped for stays legible for the whole animation. Landing the coin *in* the ticker
would cover the one thing a player is doing during the two seconds the coin is in the air. Trevor
caught this himself, and it is a better argument than the attribution one — that one is about what a
position implies, this one is about what it costs you. **Anywhere the coin might move to has to
clear the ticker.**

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
there is nothing to screenshot.

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

## The title screen is not fitted

`.deckscreen` sizes itself with `clamp(..vh..)` rather than the board's JS fitter. It is static —
CSS is enough, and there is nothing to measure.

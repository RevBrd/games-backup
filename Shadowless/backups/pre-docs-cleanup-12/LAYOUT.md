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
are run, in **[INSPECTION.md](INSPECTION.md)**, along with the two traps that will otherwise bite: the
screenshot is stretched relative to the layout, so **judge proportion from the DEV tab and not off
the PNG**.

**And when the complaint is that the board MOVES, neither of those is the instrument.** A shot is one
state and the smoke stub has no layout engine at all, so "did this get 9px taller" is a question
only `tools/probe.js` answers: it measures one board in a series of UI states inside a single page
load and prints what differed. Every resizing fault this project has had was invisible to both of
the others and obvious to that one, twice over — #20 built the same thing as a throwaway and had to.

```bash
node tools/probe.js --size 1191x684          # every state, at Trevor's real viewport
node tools/probe.js --setup                  # the opening-setup screen instead
```

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

**The centre line is the mat's SHOCK ABSORBER, and nothing may be put in its normal flow.** Both
`.side`s are `flex:0 0 auto`, so `.centreline` is the only shrinkable item in the column — when the
mat is squeezed it gives up its own height first and the board keeps its zoom. At Trevor's 1191x684
it sits at **4px** rather than its declared 17, at 1280x600 at 3px, and that is the system working
rather than a bug.

What makes it work is `min-height:0`. A flex item's automatic minimum size is its *content's*, so
**anything placed in normal flow in there stops the strip shrinking**, the mat overflows, and
`fitBoard()` rescales the whole board. That is exactly what the Knock Out banner and the targeting
prompt did until 23 Aug 2026: 0.892 → 0.875 at Trevor's viewport, 1.000 → 0.982 at 1366x768, and
nothing at all at 1600x900 and above — which is why it survived so long and why he could never catch
it in a screenshot. Everything on that line now hangs off `.midstrip`, which shares `.cointoss`'s
zero-height geometry. **Several things live on the centre line and every one of them is out of flow.
The next one must be too** — deliberately not counted, because that sentence said "four" for exactly
as long as it took to add the fifth.

A `.midline{min-height:0}` rule sat in `style.css` matching nothing in `ui.js` — an orphan from a
rename, and half the fix. *An orphan selector is not dead weight; it is a rule that lost its
element*, and it is worth asking what it was protecting before deleting it.

**The opening-setup Active spot is one height for both states, and it is `--setupact`.** The empty
placeholder and the placed card are declared from the same custom property on `.setupmat` because
they were declared separately and drifted: the five-class `min-height:0` that frees the setup card
from the board's 249px also beat the four-class `min-height:106px` on the `CHOOSE A BASIC`
placeholder, so the empty shape stood at **26px** against the card's **99px** and the row jumped
73px the moment you placed a Basic.

**And 99px was itself the symptom of something else.** Trevor read the setup Active as *stretched*,
and it was: 318 wide by 99 tall is a bar, not a card. The cause is that the attack buttons are gated
on `phase === 'main'`, so in setup the card had **nothing in its bottom half at all**. It carries the
opponent-Active's read-only attack lines now — cost, name, damage — which is the content it was
missing rather than padding, and which answers the question that screen exists to ask. `--setupact`
is **150px**, measured across all 113 Basics: 72 at 150 with two attacks, 39 at 129 with one, 2 at 99
with none. Fixed rather than natural, so swapping one Basic for another does not move the strip
either. Re-derive with `node tools/probe.js --setup --eval`.

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

**A hand card's height is FIXED at 118px and that is the whole point.** It used to be its content's:
95px for an Energy or a Trainer, 118px with one attack row, 139px with two. `.hand` is
`align-items:stretch`, so **every card took the height of the tallest one you happened to be
holding** — drawing a two-attack Pokémon grew the whole hand by 21px and playing it shrank it back.
And the hand panel is a child of the column `fitBoard()` measures, so past a certain hand size the
extra height tipped the mat into overflow and **the fitter rescaled the entire board.** Measured: at
1366x768 the board sat at zoom 1.000 up to eleven cards and 0.973 at twelve; at 1280x600 the hand
alone drove **three** different zoom levels. Trevor reported this as "hand cards change size in
different situations" and it was never really about the hand — it was the board following it.

**118 is measured, exactly the way the Active card's 249px is, and it is the era's worst case rather
than today's.** Only two printings in all fourteen sets carry three attacks — Gym Challenge's
Rocket's Mewtwo and Neo Revelation's Ho-oh — and both fit at 118 with the art at its floor, verified
by rendering one rather than by arithmetic. So Gym landing will not move it. Re-derive by rendering
the pool if the face or the fonts change.

**The sigil is what absorbs the difference, cropped rather than shrunk** — the bench tile's own
treatment, and for the same reason plus one more: with a fixed card height something has to give
between a Trainer with no attack rows and a Pokémon with three, and letting the art keep its square
aspect is what made it *set* the height instead. It is drawn at the card's full width and clipped to
whatever is left, centred, so a Pokémon shows a wide strip and an Energy shows most of the emblem.
**Do not give it back its aspect ratio.**

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

## The specific pieces live next door

**Five parts of the board are their own subject and moved to [INTERACTION.md](INTERACTION.md) on
14 Aug 2026** — the coin toss, the Energy picker that shares its spot, the opening who-goes-first
flip, the opening-setup screen, and the action bar with the retreat gate. None of them is needed to
change how the board sizes itself, which is what this file is for, and keeping them here had made it
long enough that a working session stopped reading all of it.

Go there when you are moving one of those, and specifically when you want: **why the coin lands on
the centre line and must clear the ticker**, why the Energy picker is asked in the coin's own place,
why the setup sheet is suppressed during the opening flip, the five-class specificity fight the
setup mat has to win against `min-height:249px`, or why a Basic plays on click with no confirmation.

**One rule from over there is really a sizing rule and stays here: the coin's strip is zero-height
and absolutely positioned**, so a flip overhangs both mat halves without reflowing either. The board
behind it is frozen on a pre-action snapshot, and a coin that resized the mat would move the very
cards you are waiting on. Anything else that appears on the centre line inherits that. *[The rest of
the coin, and everything that shares its strip →](INTERACTION.md)*

## The other sized screens live next door — [SCREENS.md](SCREENS.md)

**The pack reveal, deck select and the title screen moved there on 26 Aug 2026**, on this file's own
split test: none of them is the board, none of them is fitted, and a session changing how the mat
sizes itself needs none of them. What they share is a different problem — a centred box whose content
arrives over time, where anything that grows the box moves what is already on screen.

**One rule from over there is really a board rule and stays here**: `.deckscreen` and the pack screen
are sized with `clamp()` against the viewport and **must not gain a JS fitter**. The board has one
because the mat has a shape to preserve and a zoom to apply; these have neither, and adding a second
fitter would give the project two answers to "how big is the page".

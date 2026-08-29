# Shadowless — looking at the built game, and measuring what you see

**Read this before you change anything visual, and read it the moment a report is about how the board
LOOKS or how it MOVES.** Three instruments live here — a screenshotter, a two-state geometry probe,
and the DEV tab the game prints about itself — plus the one section that says why none of the six
suites can do their job.

[TOOLING.md](TOOLING.md) is the parent: the generators, the six suites, and what each one proves.
Split out of it on 25 Aug 2026 for the reason that made [MEASUREMENT.md](MEASUREMENT.md) — the
callers. Every UI file in this tree ([LAYOUT.md](LAYOUT.md), [INTERACTION.md](INTERACTION.md),
[COLLECTION.md](COLLECTION.md)) was reaching into a build-pipeline document for one section, and
none of them wanted `gen_cards.js` on the way. What the rules those instruments check actually *are*
is [LAYOUT.md](LAYOUT.md); this file is how you look.

The one-line summary: **a green test suite proves nothing visual, and two of these three exist
because a bug got through one.**

## Pick the right one, because they answer different questions

| The complaint | Reach for | Because |
|---|---|---|
| "is this clipped / missing / painted in the wrong place" | `shot.js` | one state, rendered, at an exact viewport |
| "the board MOVES when X happens" | `probe.js` | the only instrument that measures the same board **twice** |
| "why did the fitter do that" | the DEV tab | it prints what `fitBoard()` and `chooseLayout()` actually decided |
| "the suite is green and it still looks wrong" | **What the smoke stub cannot see**, below | four attested classes of bug that pass every test |

**Run the cramped viewports.** The roomy ones are where a layout bug hides — the centre-line fault
moved the board at 1191x684, 1280x600 and 1366x768 and did nothing at all at 1600x900 and above,
which is why it survived for weeks and why Trevor could never catch it in a screenshot.

## Comparing two states: `tools/probe.js`

**Reach for this one first whenever the complaint is that something MOVES.** It is the only
instrument in the project that measures the same board twice.

```bash
node tools/probe.js --size 1191x684          # every state, at Trevor's real viewport
node tools/probe.js --only ko,prompt-long    # just these
node tools/probe.js --setup                  # the opening-setup screen instead of a board
node tools/probe.js --pack                   # the booster reveal (--pack-set base1)
node tools/probe.js --state "mine:UI.sel={idx:0}"          # an ad hoc one
node tools/probe.js --setup --eval "<expression>"          # re-derive a MEASURED number
```

It boots the built file in headless Chrome exactly the way `shot.js` does, then walks a list of
named UI states — a Knock Out banner, a targeting prompt, a coin in the air, a card selected, four
more cards in hand — applying each, measuring the geometry, and reverting. It prints only the
columns that ever moved, so the one that changed is not buried under eleven that did not.

**Three screens, three state tables.** The board is the default; `--setup` boots the opening-setup
sheet and places Basics into it; `--pack` grants a booster, opens it through the real `openNextPack`
and walks `reveal-1` → `reveal-half` → `reveal-strip` → `reveal-all`. **Those states are derived from
`UI.pack.revealed.length`, never written down**, and this paragraph named the old hard-coded ones —
*"one, five, ten and eleven at a time"* — for three days after they were removed. They were removed
because `reveal-10` had silently become a duplicate of `reveal-all` when the pack shrank from eleven
cards to eight: **a state measuring nothing, inside the one instrument built to notice that something
moved.** The state that replaced it found the ribbon fault on its first run.
*[The reveal screen those states are walking →](SCREENS.md)*

A hand-built `UI.pack` would have been
easier and would have measured nothing — the `NEW`/`×N` ribbons come off `isNew` and the variant
flags, and the ribbons were the whole fault. **Boot the screen the way the game boots it.**

**Three things about it are worth knowing before you read a table.**

- **`idle` is measured again at the end, as `idle-again`, and it is the control.** Every state is
  applied to one board in one page load, so an incomplete revert would accumulate down the table and
  every row after it would be measuring drift. If the two `idle` rows disagree the tool says so and
  tells you to fix the revert rather than the game. Run it, read it, do not skip it —
  [MISREADINGS.md](MISREADINGS.md) is a file full of what happens otherwise.
- **A null result here is meaningful in a way most of this project's null results are not.** There is
  no sample and no interval: the geometry either changed or it did not. But it is only null *for the
  viewport you ran it at* — the centre-line fault moved the board at 1191x684, 1280x600 and 1366x768
  and did **nothing at all** at 1600x900 and above. **Run the cramped sizes.** The roomy ones are
  where a layout bug hides.
- **`--eval` is for re-deriving the measured numbers**, of which `style.css` has several — the
  Active's 249px, the hand card's 118px, the setup Active's 99px. It runs one expression after the
  control and prints what it returns, so sweeping the whole card pool through a slot is a command
  rather than a throwaway script. It runs *after* the control on purpose: an expression that
  mutates the DOM would otherwise corrupt the one row certifying the table.

The Chrome plumbing both this and `shot.js` need lives in `tools/lib/chrome.js` — finding the
browser, calibrating the viewport, staging the page beside the real one, launching it.

## Looking at it: `tools/shot.js`

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

What both of these are *for* — the rules they exist to check — is [LAYOUT.md](LAYOUT.md).

## What the smoke stub cannot see

A green `smoke.js` run proves nothing visual, and the gap is not theoretical — two bugs got through
68 passing tests in one session, both found by `tools/shot.js` in a single screenshot each:

- **`node.children` is an HTMLCollection in Chrome and a plain Array in the stub.** `.filter`,
  `.some` and `.map` on it pass every test and throw in the browser. Walk children with an index
  loop. This one silently deleted the pull-detail overlay while the screen behind it rendered fine.
- **`line-height` inherits.** `.vfx` had `line-height:0` — correct for an inline-block wrapping a
  bare image, catastrophic once the same host also wrapped a card full of text. Every line
  collapsed, the type chip became a 2px dash, and the card lost 90px of height.
- **`position:absolute` with no positioned ancestor escapes to the page.** The variant markings were
  wired into the in-play card faces with **204 tests passing**, and the first screenshot showed a
  SHADOWLESS watermark painted across the middle of the board and a stray 1st Edition stamp beside
  the End Turn button. Two causes, both invisible to a stub: `.sigil` had `overflow:hidden` but not
  `position:relative`, and `sigilOf` searched direct children only, so on the Active card it found
  nothing and the caller appended the mark to the card root. **A stubbed DOM has no cascade and no
  containing blocks, so it cannot see where an absolutely-positioned child actually lands.**

- **A stub has no cascade, so it cannot see one rule silently defeating another.** `.cardface.miss`
  is how a 404'd scan hides itself, and `.pullslot .cardface{display:block}` — added 500 lines
  further down for an unrelated 2px baseline gap — has the same specificity and therefore won. On
  the pack screen a card whose set had no fetched art rendered the browser's **broken-image box and
  the sigil fallback underneath it**, in a real browser, permanently. Nobody had seen it because
  every live set's art was fetched; a forced promo intrusion put an unfetched card on that screen
  for the first time on 27 Aug 2026, and the `smoke.js` DOM stub — which has no stylesheet at all —
  could never have reported it. **The fix was structural rather than local**: `.miss` now sits last
  in `style.css`, where an equal-specificity rule cannot outrank it by accident. A rule meaning
  "this element is OFF" must not sit where ordinary styling can beat it, which is the CSS twin of a
  lesson this tree already had in JavaScript.
- **A fallback can exist in the DOM and not in the layout.** The same screenshot showed the second
  half: `pullFace` promises that an unfetched set "falls back to the sigil rather than a blank
  tile", and it did — but `.sigil.lg` is `width:100%` with a flat `height:150px`, so the fallback
  came out wider than a card and taller than the slot clamp, forced a flex wrap onto its own row,
  and pushed the hero Rare off the bottom of a 1366x768 window. **Both halves were general, not
  promo bugs**: any set renders this way between `gen_cards.js` and `fetch_art.js`, which is the
  supported order.
When a screenshot looks subtly wrong, **measure it rather than squinting** — inject a snippet that
writes `offsetHeight`/`getComputedStyle` into the page and screenshot *that*. It turns "something
looks off" into `lineHeight=0px` immediately.


## What this file cannot do

**It cannot tell you a rules or AI change worked.** Nothing here has a sample or an interval — a
screenshot is one state and a probe row either moved or it did not. The instruments that measure
*better* rather than *different* are in [MEASUREMENT.md](MEASUREMENT.md), and every one of them has
lied at least once.

**And it cannot tell you the build is correct.** The six suites are in [TOOLING.md](TOOLING.md),
along with the two things `build.js` refuses outright. A shot of a broken build is a shot of a
broken build.

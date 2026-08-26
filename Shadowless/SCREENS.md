# Shadowless — the sized screens that are not the board

**The pack reveal, deck select and the title screen.** Read this before you change anything about how
one of those is laid out. [LAYOUT.md](LAYOUT.md) is the parent and owns **the board** — `fitBoard()`,
`chooseLayout()`, the mat, the hand fan, the bench. Split out of it on 26 Aug 2026 on that file's own
test: a session fixing the hand fan never needs a ribbon's height reservation, and a session fixing
the pack reveal never needs the zoom fitter.

**None of these screens is fitted and none of them should be.** No JS fitter, no measuring pass —
`clamp()` against the viewport is enough, and the board's machinery is the wrong tool here. What they
have instead is a single shared problem, which is why they are one file:

> **Every one of them is a centred box whose content arrives over time.** A booster is turned over a
> card at a time; deck select gains a bracket every time a set goes live. **Anything that grows the
> box moves everything already on it**, including the parts the player has not reached yet — so the
> job is not fitting the content, it is stopping the box changing size.

**Two rules do most of the work and both were bought with wrong versions first.**

**Reserve what the finished state needs, from the first render.** An empty ribbon, an empty summary
line, a `min-height` floor on the ladder. A space that arrives with the content is a space that
shoves the content.

**And if you can render the real thing and hide it, do that instead of measuring it.** Three separate
reservations on the reveal screen were numbers somebody derived from a font size, and all three were
wrong — by 0.22px, by 3px, and by an amount no number could have covered. `visibility:hidden` on the
actual element cannot be wrong at any viewport, for any content, ever.

## The pack reveal: every slot reserves what a revealed slot needs

`.packscreen` centres its box in the viewport, so **anything that grows the box moves everything
already on screen** — including every card you have not turned over yet. It is not fitted and does
not need to be; the cards are sized by `vh` clamps. It just has to stop changing size.

**It is a centred flex strip of seven with the hero under it, and the shape is fixed rather than
wrapped.** It was a five-column grid while a pack held ten ordinary cards plus the Rare; the pack
shrank to eight on 25 Aug 2026 and seven-in-five-columns is a full row plus a two-card row hanging
off the **left** edge, so rows one and three sat on the centre line and row two did not. Seven always
fits one row, so there is nothing left to wrap.

**The hero is a POSITION, not a rarity, and that distinction is load-bearing.** A bonus tier-jump
card carries `slot: 'rare'` too — it is drawn from the Rare pool — so keying the hero treatment off
the rarity gave ~7% of packs a **second full-width hero card wherever it happened to sit**, which
split the strip and opened the reveal on the best card in the pack. `openNextPack` records the hero
index where the order is decided, so the two cannot drift. *[Why a jumped Rare gets no special
treatment at all →](PACKS.md)*

Three things were making it change, and they compounded. Measured at 1191x684, the header climbed
**61px** on the final reveal:

- **A revealed slot carries a ribbon — `NEW` or a `×N` count — and a face-down slot did not.** So
  turning any card over grew its whole grid row by 16px. `renderPackScreen()` appends an **empty**
  `.vribbon` to face-down slots for exactly the reason the Active card always appends its status row.
- **The Rare's face-down back was a common's height.** `.packback` had one clamp; the revealed Rare
  has a taller one. The last card in the pack therefore jumped its row by another **48px** — the
  biggest single move on the screen, arriving at the most conspicuous possible moment.
- **`.packsum` was rendered only once everything was revealed.** It is always in the DOM now, empty
  until then, with a `min-height` of its own one line.

Two smaller rules came out of the same pass and generalise. **`.pullslot .cardface` declares
`aspect-ratio:240/330`**, because `width:auto` against a fixed height only knows the ratio once the
image has *loaded* — so a freshly revealed card is 0px wide for a frame and pops out. And it is
`display:block`: an inline image inside an inline-block `.vfx` sits on the text baseline with a ~2px
descender gap under it, which was the last 2px of the shift. **Not `line-height:0`** — see
[INSPECTION.md](INSPECTION.md) for what that did the last time somebody reached for it.

**Then three more, and every one was a reservation somebody had GUESSED** — `.packsum` at 15px for a
15.22px line, `.vribbon` at 12px for a ribbon that is 14 or 15, and one that no number could fix at
all. **Two rules came out of them.**

**Ribbon content must never decide strip geometry.** `.pullslot .vribbon` is `width:0;min-width:100%`
so a percentage — which does not contribute to a shrink-to-fit parent's intrinsic width — is all the
slot ever sees. Without it a card carrying `1ST EDITION` + `MISPRINT` widened its own slot to 157px,
dropped the strip below seven per row and moved the box **175px** at the instant the rarest card a
player will ever pull was turned over.

**If you can render the real thing and hide it, do that instead of measuring it.** A face-down slot
now builds the **actual** ribbon it will carry and sets `visibility:hidden` on it, so the space
reserved is exactly the space needed for any chip count, any label and any viewport, with nothing to
re-derive. That is the always-appended status row on the Active card, taken one step further.
*[All three numbers, and what each cost →](GRABHIST.md)*

`node tools/probe.js --pack` walks the reveal and is what found all of it. **Its states are counted
from `UI.pack.revealed.length`** since 26 Aug 2026: they were written as `reveal-5` / `reveal-10` for
an eleven-card pack, and `reveal-10` silently became a duplicate of `reveal-all` when the pack shrank
— a state measuring nothing, in the one instrument built to notice that something moved. The state
that replaced it found the ribbon fault on its first run.

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
one control you always need stays put. Verified at 1280x600, 1366x768, 1600x900 and 1920x1080.

**Four defects were live on this screen while `smoke.js` had 136 tests passing**, and the two above
are the pair that were each fixed by a wrong version first. The other two were **864px of content in
a 768px viewport**, the Play button simply gone, caused by **locked brackets drawn as full grids of
unclickable ~150px tiles** — they are one line each now and sit *outside* the scroller, so what is
ahead never scrolls away. **Why this screen and no other** — the ladder gains a bracket every time a
set goes live — is [PROGRESSION.md](PROGRESSION.md); the instrument that found all four is
[INSPECTION.md](INSPECTION.md).

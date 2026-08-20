# Shadowless — the collection, the save, and deck building

Depth behind the collection rows in `CLAUDE.md`'s status table. Read this before touching
`src/collection.js`, the collection browser, the dex, or the deck builder. Everything here was
settled with Trevor on 9 Aug 2026 and is tested by `tools/collectiontest.js`.

If you are working on the board, the engine or a card, you need none of it.

The one-line summary: **the unit of storage is the variant combination, not the physical card.**

## The storage model

`src/collection.js` is pure data — no DOM, no engine, no `CARD_DB` import. Anything needing the
card database takes a `db` argument, which is what lets `collectiontest.js` drive the whole module
with no browser. Keep that property.

A player with twelve Rattata, one Shiny and two Reverse Holo, is stored as:

```js
owned['base1-61'] = { '': 9, 'sh': 1, 'rh': 2 }
```

Twelve cards, three numbers. That is what makes two things true at once: the collection screen can
show a card **once** with its best variant as the face, and the deck builder can still put that
specific Shiny in a deck while the other eleven stay plain. Per-physical-card objects would buy the
same power for thousands of entries.

A deck entry is `[qty, id]` or `[qty, id, vkey]`. The two-element form means plain — which is why
`data/decks.json` and the `DECKS` in `cards.js` are still valid deck definitions with no migration
at all.

**The `VARIANTS` array is declared in ascending order of how impressive a pull is**, and that single
order does three jobs: it canonicalises keys (`'sh+fe'` and `'fe+sh'` are the same pile), it ranks
variants for `bestVariant()`, and it is the order the UI lists them in. Add a flag there and the
rest follows. Read the module header before touching a key.

The Misprint flavours (`mp1`/`mp2`/`mp3`) live **in** the key rather than beside it, so two
differently-broken Rattata are genuinely different collectibles while two identically-broken ones
still collapse into one pile. They are mutually exclusive — a card is misprinted one way or not at
all.

## The save file

Versioned, migrated and validated. `tools/collectiontest.js` stubs `localStorage` rather than
skipping persistence, because "does a save survive a round trip" is the whole point.

Its sharper cases are the failures, and they are the behaviour to preserve: an unparseable save is
kept under a backup key instead of being overwritten, a full quota reports failure instead of
throwing, a missing `localStorage` is distinguishable from an empty one, and a save naming cards
from a set this build wasn't generated for still loads. Migration is exercised with a temporarily
registered fake step, so the machinery is tested rather than merely present.

Export downloads a JSON file, with a copy-it-out fallback when the download is blocked. Import is a
paste box on the collection screen.

**`save.settings` is the third additive field and the first that is not collection data.** It arrived
19 Aug 2026 holding one key — `prizePick`, `'auto'` or `'manual'` — and it is handled in
`ensureShape` rather than by a migration, for the same reason `progress` and `draws` were: absent and
default are the same thing. **An unrecognised value is reset rather than rejected**, which is the one
place this module is deliberately lenient: a preference is not collection data, and a save that
refuses to load over a bad toggle is a far worse failure than a toggle that quietly goes back to its
default. **Nothing in `settings` may ever affect what the player owns.**

## Built decks vs. layouts

**A deck is BUILT or it is a layout, and only built decks reserve cards.** A built deck holds its
cards and can be played. A layout (`built: false`) holds nothing, cannot be played, and costs
nothing to keep — which makes a half-finished *draft* and an unaffordable *blueprint* the same
object.

This landed by accident and is better for it: Trevor's answer to "should an illegal draft be
saveable" was yes-but-its-cards-stay-available, which is the definition of a non-reserving deck, and
it independently reproduces the GBC game's split between decks you have built and layouts you have
merely saved.

- **Un-building is lossless.** The list survives, so dismantling is reversible. That is what removed
  the argument for capping the number of decks — the collection caps built decks by itself, and the
  recovery is one click.
- **The last built deck cannot be un-built or deleted.** Not protection against losing work, just
  against a confusing state where deck select offers nothing but Sandbox.
- **A layout goes stale** when another deck claims a card it wanted, so `deckShortfall()` is
  recomputed at build time and never cached.
- **Reservation returns everything, including Energy.** That answers "do we grant starting Energy":
  you already have ~25, they are simply committed.

**No cap on the number of decks, and no player-facing auto-build.** The first because reservation
already caps it in a way the player can see and fix. The second because the labour of building is
what makes a collection mean anything — `~/.claude/reference/game-design.md` says the work is the
setup. `deckgen.js` stays for **opponent** decks in Job 7, and behind the DEV tab for testing.

**Deck legality already exists: `Engine.prototype.validateDeck` in [engine.js](src/engine.js).**
Exactly 60, four-by-name with basic Energy correctly exempt, at least one Basic, the
unimplemented-card refusal, and an evolution-line warning. **Do not write a second one.**
`collection.js` adds only the ownership layer on top; the two are deliberately separate because
legality is a property of the deck and availability is a property of the save.

**Sandbox ignores ownership on purpose.** It draws from everything implemented, which is what makes
it the deck for playing against the bespoke cards.

## A deck name does not identify a deck

**The starter is created in your save under the theme deck's own name**, so from your first edit
onwards "Brushfire" means two different 60-card lists — yours and the printed one. `deckFor(name,
side)` is the single lookup and **the side is required**:

| | |
|---|---|
| `'mine'` | your save's deck. The only kind you can field |
| `'theme'` | the printed theme deck. What the opponent always gets |

Until 12 Aug 2026 the lookup took a name alone and preferred the save, so **editing your Brushfire
silently rewrote the opponent's Brushfire too** — in the match and on the select screen's OPPONENT
panel. Only the save was ever touched; `DECKS` in `cards.js` is never mutated. It survived because
it is invisible outside a mirror match, which is exactly the case nobody plays by accident.

**Never restore a default for `side`.** A call site that has not decided is a call site with the bug.
Two `smoke.js` tests cover it, and both were confirmed to fail without the fix.

### The same heading, the second half of the same bug — 13 Aug 2026

Saying which *side* a name belongs to was only half of it. Within your own save a name still had to
identify **one** deck, and it did not: `deckFor` searched `save.decks` flat and took the first match,
while `myDeckNames()` — which decides what deck select is even allowed to offer — lists **built decks
only**. So the screen offered one deck and the resolver answered with another.

Reported by Trevor from a real save, and the numbers are worth keeping because they say how ordinary
it was:

```
id=2  "New deck"  built=false  41 cards      a blueprint he had saved earlier
id=3  "New deck"  built=true   60 cards      the deck he had just built
```

The tile carried the built deck's name and the blueprint's hero art and card count. **The builder's
default name is "New deck"**, so this is the *default path* — save a draft, build a deck, rename
neither — rather than an unlucky collision.

And it was not cosmetic. `resolveDeck()` shares `deckFor`, and **nothing between deck select and a
match calls `validateDeck()`**, so pressing Play would have taken an illegal 41-card list into a
scored ladder game.

Two guards now, failing in opposite directions:

- **`deckFor` prefers a BUILT deck**, which simply makes the resolver agree with the list of names
  the screen is willing to show. The unbuilt fallback is outranked, not deleted — a layout is still
  reachable by name when nothing built claims it.
- **`commitBuilder` keeps names unique**, suffixing rather than refusing. The colliding name is
  nearly always the one the player never chose, so refusing would be friction over a decision they
  did not make, and the new name is on the tile the moment they return.

The first is what repairs a save written before this; the second is what stops it recurring. Trevor's
save needed no migration — it resolves correctly the moment the rule changes.

**A local patch for this already existed at one call site and hid how general it was.** The Edit
button did its own `builtDecks().concat(decks).find(byName)` — correct, unexplained, and applied to
one of the three places that needed it. It now goes through `deckFor` like everything else. *If you
find yourself hand-rolling a deck lookup, the bug is that `deckFor` is wrong, not that your call site
is special.*

## Scroll position survives a render

`render()` throws the whole DOM away and rebuilds it, so every scroll position in the game is
destroyed on every click. On the board that is invisible — nothing there scrolls. In these screens it
was the worst friction in the game: adding one card to a deck threw you back to the top of a grid
that is 311 cards now and grows with every set, so putting 18 Fire Energy into a deck meant
re-scrolling eighteen times.

`keepScroll(node, key)` opts an element in; positions are read from the old elements before the wipe
and written to the new ones **after everything is in the document**, because a `scrollTop` set on a
detached node is silently discarded. `resetScroll(key)` sends one back to the top, and the filter
chips use it — holding position through a filter change lands you in the middle of results you never
scrolled past.

Two things to preserve. **Harvest runs before resets are honoured**: every caller does its work and
*then* calls `render()`, so a reset applied first is read straight back off the element about to be
thrown away — which made `resetScroll` do nothing at all until a test tried to prove it worked.
And it deliberately avoids `querySelectorAll` and `data-` attributes, because `smoke.js` stubs the
DOM and implements neither; **a UI mechanism that cannot run in the suite is one with no tests.**

## How each variant is drawn

The **full** treatment is confined to collectible surfaces — the preview rail, the dex, the pack
reveal, the detail panel. Where a variant lost an argument on its way here, the reason is in
[HISTORY.md](HISTORY.md).

**In play a card wears a reduced MARKING, and that is a deliberate narrowing of the 8 Aug lock
rather than a break in it** — Trevor, 16 Aug 2026, from a grab bag item asking whether variants
displayed in game. They did not, and *could* not: `buildDeck` destructured `[qty, id]` and silently
dropped the variant key, so the copy you picked in the deck builder never reached the table. The key
rides on the card instance as `v` now; the engine does nothing with it and every rules path still
reads `id`.

What shows in play is confined to the **art window**: Shiny recolours the emblem only (not the card's
typography, which the lock covers), 1st Edition stamps the ①, Shadowless prints the watermark. No
card changes size — the marks are absolutely positioned inside a fixed box.

**Adding a variant's in-play marking is a row in `SIGIL_MARKS` plus at most one CSS rule, and that
seam is the point.** Reverse Holo and Misprint are deliberately absent from that table — they have
scan treatments and no sigil treatment. **Trevor's spec for both is in [GRABBAG.md](GRABBAG.md)**,
and note what it costs: Misprint mimicking formatting glitches means this game acquires artifacts
that *look* like bugs, so `CLAUDE.md`'s "no authored defects" line has to change in the same commit
or the next instance will dutifully fix them. Two rules keep it working and both were paid for with a wrong version:
**`.sigil` must stay `position:relative`** (the marks are `position:absolute`, and without a
positioned host they resolve against the page — a SHADOWLESS watermark painted across the whole
board), and **`sigilOf` searches descendants, not just direct children** (the in-play sigil hangs off
`.pc-body`, so a direct-child search found nothing and the marks landed on the card root). *[What
204 passing tests could not see →](TOOLING.md)*

| | On the real scan | On the Sigil Card |
|---|---|---|
| Shiny | `hue-rotate(150deg) saturate(1.35)` — a palette shift, which is what "shiny" means in the mainline games. Shifts differently per card, so it reads as an alternate colouring rather than a filter | every line of ink turns teal, via `--ink`/`--ink2`; the sigil drawing takes the same rotation |
| Reverse Holo | fine diagonal banding, `screen` | — |
| Misprint | mp1 channel split · mp2 wrong aspect · mp3 inverted | — |
| 1st Edition | ribbon only | the ① stamp, inside the art window |
| Shadowless | ribbon only | **"SHADOWLESS" printed across the art window** in the title-screen face, plus the shadow A/B |

**Filter-based treatments are composed in `variantFilter()`, never as CSS classes.** `filter` is a
single property, so two classes that both set it do not stack — one silently wins. This became
load-bearing the moment Shiny stopped being a sheen.

**`shadow` is the default** — the art window carries a drop shadow and Shadowless removes it, which
keeps real-world scarcity pointing the right way. `inverted` is the losing side of that A/B and
stays switchable in the DEV tab as a back-pocket option. Do not delete it as dead code; it isn't.
Both are covered by `smoke.js`.

## A missing slot names what you are missing

Both grids used to print a card's **number and nothing else** in an empty slot, which meant the
collection and the dex were walls of small grey digits: you could see how much was left and not what
any of it was. A missing tile now carries the card's **name**, its number, a **type-coloured left
edge**, and a ghosted **Sigil Card** behind the text.

The sigil rather than the scan is the point. It is our own drawing, so it says "this is the shape of
what goes in this hole" without handing over a printed face you have not earned — and it is not
decoration: petals are the attack count and rings the retreat cost, so the placeholder tells you
something real about the card. The type edge is what makes a grid of holes scannable for "I am
short three Water cards".

The view this pays off in is **MISSING**, which is now a want-list rather than a count. On a fresh
save it opens on the sixteen Rare Holos, which is exactly the chase [PACKS.md](PACKS.md) says the
game actually is.

Two traps that surface here, both already documented and both live:

- **`.colltile` sets `line-height:0`** for the scan it usually wraps, and line-height inherits. A
  missing tile has real text in it, so it has to set its own — this is the same bug that once cost
  the pull-detail card 90px of height. See [LAYOUT.md](LAYOUT.md).
- **The sigil is positioned absolutely, not as a flex child.** A sigil is a square viewBox with no
  intrinsic size, so as a flex item it resolves its basis from its own width and *sets* the row
  height instead of consuming what is left. Taking it out of flow sidesteps the whole problem.

## Left open on purpose

**Blueprints have no dedicated screen.** The mechanism exists — any `built: false` deck is one — but
there is no "what am I missing" view over your *layouts* specifically. The MISSING filter above
turned the general chase specific; doing the same per-blueprint ("this deck is four cards away") is
the remaining half and is still unbuilt.

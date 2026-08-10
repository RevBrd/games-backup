# Shadowless — the collection, the save, and deck building

Depth behind the collection rows in `CLAUDE.md`'s status table. Read this before touching
`src/collection.js`, the collection browser, the dex, or the deck builder. Everything here was
settled with Trevor on 9 Aug 2026 and is tested by `tools/collectiontest.js` (105 tests).

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

**Deck legality already exists: `Engine.prototype.validateDeck`, [engine.js:114](src/engine.js:114).**
Exactly 60, four-by-name with basic Energy correctly exempt, at least one Basic, the
unimplemented-card refusal, and an evolution-line warning. **Do not write a second one.**
`collection.js` adds only the ownership layer on top; the two are deliberately separate because
legality is a property of the deck and availability is a property of the save.

**Sandbox ignores ownership on purpose.** It draws from everything implemented, which is what makes
it the deck for playing against the bespoke cards.

## How each variant is drawn

All confined to **collectible surfaces** — the preview rail, the dex, the pack reveal, the detail
panel. **The board is untouched by every one of them**, which is what keeps the 8 Aug design lock
intact. Where a variant lost an argument on its way here, the reason is in [HISTORY.md](HISTORY.md).

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

## Left open on purpose

**Blueprints have no dedicated screen.** The mechanism exists — any `built: false` deck is one — but
there is no "what am I missing" view over your layouts. That is the obvious next quality pass, and
it would turn a vague card chase into a specific one.

# Shadowless — the ladder, and what a win is worth

Depth behind the progression row in `CLAUDE.md`'s status table. Read this before touching
`src/progress.js`, `data/ladder.json`, the opponent section of deck select, or anything that grants
a pack. Built in Job 7, 12 Aug 2026, and tested by `tools/progresstest.js` plus a ladder
section in `tools/smoke.js`. **Run them for the counts** — a test count quoted in prose is a thing
this tree has had to correct twice.

If you are working on the engine, a card, or the collection, you need none of it.

The one-line summary: **the ladder is derived from the live-set list, not declared, and so is every
unlock.**

## Brackets, not sets

`data/ladder.json` holds one **bracket** per set. No bracket names its own position, and none names
what it unlocks. `buildLadder(liveSets, LADDER)` walks the live sets in order and, for each one,
uses the authored bracket if there is one and **synthesises a generated bracket if there is not**.

Three things fall out of that, and they are the reason it is built this way rather than as a
constant. Trevor's ask, 12 Aug: brackets rather than defined sets, because we will not have authored
decks for most of the fourteen sets for a long time.

- **A set going live adds a bracket** with no code change and no data change. `progresstest.js`
  asserts this by passing `base5` into the live list and checking a working Team Rocket bracket
  comes out.
- **Authoring real opponents later is an override, not a prerequisite.**
- **A bracket whose set is not live never appears.**

**A roster entry whose deck cannot be resolved is backfilled with a generated challenger** rather
than throwing, and a bracket is never shorter than `bossAfter`. That is what keeps a narrow
`gen_cards.js --sets base1` producing a working ladder instead of a dangling reference.

## Unlock is derived, never stored

There is no `unlocked` list in the save. A bracket is open if it is the first, or if the previous
bracket's boss has been beaten — recomputed from `save.progress.beaten` every time it is asked.

A stored list would be a second source of truth that can drift from the one the player can see, and
the save already carries the fact that settles it. `progresstest.js` asserts the absence.

The save gained one additive field, so it is handled in `ensureShape` rather than by a migration and
there is no version bump: a save written before Job 7 has beaten nobody, which is exactly what an
empty map means. See [COLLECTION.md](COLLECTION.md) for why absent and empty are the same thing
there and corruption is not.

## The tunables, and their starting values

All in `data/ladder.json`'s `defaults`, overridable per bracket via `cfg`. Trevor's numbers, 12 Aug:

| | | |
|---|---|---|
| `bossAfter` | 5 | **distinct** roster opponents beaten before the boss appears |
| `packsPerWin` | 2 | `PACKS.md`'s yardstick, unchanged |
| `bossFirstWinBonus` | 1 | an extra pack the first time you beat a boss, and only a boss |

**`bossAfter` counts distinct opponents, not wins.** Beating the same challenger five times does not
summon anybody. This is the easy thing to get wrong and it has its own test.

## What a win pays, and the constant that was hiding

**A win pays in its bracket's own set.** `winReward()` computes it without touching the save;
`recordWin()` records the win and returns the same thing. Neither grants a pack — `collection.js`
owns the save's pack data and the caller does `addPacks(save, r.set, r.packs)`, so the one function
that creates packs stays the only one.

Before Job 7 there were exactly two `addPacks` call sites and both passed `homeSet()`, which is
derived as *the first live set*, which is always `base1`. **So there was no path in the game to a
Jungle or Fossil pack** — not through play, not through the DEV tab. A collection could only ever
contain Base Set cards and 119 of the 221 in the dex were unobtainable. `CLAUDE.md` had claimed
"earn booster packs of any live set" for two days; the machinery was all there and nothing called
it.

That is worth keeping because it changes how to think about the gating. **The ladder does not take
away a freedom the player had — it is the wiring that makes the other sets reachable at all.** It
also means there was nothing to migrate: an existing save cannot have earned a pack it had no way to
earn.

## Free play pays nothing

The OPPONENT section toggles between the ladder and the old deck grid. Free play keeps every
previous behaviour — any deck against any deck, mirrors included, seed chasing — and **awards no
packs and records nothing**. A mode that both ignores the ladder and funds the collection would make
the ladder optional. The DEV tab's `+5` hatch is still there for testing a pull.

**`freePlay` is the ONE switch that decides who you are facing**, and `currentFoe()` checks it
directly. `UI.foe` is only the remembered ladder selection, so it survives a trip through free play.

Written the other way first, with the toggle's click handler clearing `UI.foe` on the way in: that
put the invariant in an event handler instead of in the accessor, so anything setting `UI.foeDeck`
without going through the toggle was silently ignored. Three `smoke.js` tests found it in one run.
Same shape as `deckFor`'s mandatory `side` — a call site that has not said which mode it wants is a
call site with the bug. `smoke.js` now declares free play once, up front, because almost every test
in it drives a match through `UI.foeDeck`.

## Deck references, and where a challenger's deck comes from

A roster entry names a **source and a key**, so adding a fourth source later touches nothing else:

| Ref | Resolves to | Lives in |
|---|---|---|
| `theme:Brushfire` | `DECKS` | `data/decks.json` |
| `gbc:ken_fire_charge` | `OPPONENT_DECKS` | `data/gbc_decks.json` |
| `jungle:water_blast` | `OPPONENT_DECKS` | `data/jungle_decks.json` |
| `generate` | `deckgen.js` at match time | nothing |

`gen_cards.js` emits `OPPONENT_DECKS` and `LADDER` into `cards.js` alongside `CARD_DB`, and **drops
an opponent deck referencing a card outside the generated sets, with a warning** — the opposite of
its rule for `data/decks.json`, which is fatal. A player deck that cannot be built is a broken game;
an opponent deck that cannot be built is one rung of a ladder that backfills itself.

**A generated challenger is seeded off their own id**, so the same challenger brings the same deck
in every session. A rival whose deck changes every match is not a rival, it is noise. Their pool is
every live set up to and including their own bracket's, so a late generated challenger is
automatically harder than an early one with nobody tuning a number.

## The roster as it stands

Contents are **placeholders and Trevor expects to replace them** — the structure is what had to be
right. Everything marked `placeholder: true` in the data is ours rather than the GBC's.

| Bracket | Roster | Boss | Extra |
|---|---|---|---|
| Base — The Clubs | 4 theme decks (T1) + 5 T2 + 2 T3, **all Trevor's** | the T4, *Ashfall* | Ronald, *I'm Ronald!* |
| Jungle — The Jungle | 2 Jungle theme decks (T1) + 3 T2 + 1 T3, **all Trevor's** | the T4, *Deep Bloom* | Ronald, *Invincible Ronald* |
| Fossil — The Dome | the 4 Grand Masters + **all 8** Club Masters | Ronald, *Powerful Ronald* | Ronald, *Legendary Ronald* |
| Team Rocket | **entirely generated** | generated | — |

**Jungle followed on 21 Aug 2026, and the move settled what a placeholder IS.** Trevor's five Jungle
decks made the bracket intro → body → gate → boss on their own, which displaced the eight Club Masters
that had been filling it. His rule: **anybody not holding a hand-built deck or an authentic theme deck
is a placeholder filling the gap between a set going live and its own decks being authored.** So they
were not deleted — `data/gbc_decks.json` keeps every one on file — they moved **down** to Fossil, which
is the last bracket where they are set-appropriate. Every GBC deck plays only Base, Jungle and Fossil
cards, so putting them in a Team Rocket bracket would be worse than the generated decks already there.
Fossil's two `generate` placeholders were dropped in the same move, since it now has twelve real ones.

**And every bracket ends in its T4.** Ronald's second deck joined his first in an `extra`; he is the
boss of nothing except Fossil, and only until Fossil has an authored T4. **The rival is not a segment
and is not per bracket** — Trevor, 21 Aug: roughly four encounters across the whole ladder, a small
group with a leader, decks drawn from every previous set and paying combined packs. That is a design
sketch and not a spec; see [OPPONENTS.md](OPPONENTS.md), whose open item 3 it replaces.

**Base Set stopped being a placeholder on 19 Aug 2026.** Its eleven rungs are Trevor's own decks
built to [OPPONENTS.md](OPPONENTS.md)'s tier spec, and the bracket now reads intro → body → gate →
boss exactly as that file describes. **The names and titles are still ours and still marked
`placeholder: true`** — that flag has always meant *the identity is ours*, not *the deck is*, which
is why the theme-deck rungs carry it too. The detailing pass is what clears them.

Two consequences. **Ronald moved from boss to `extra`**, because the boss slot is the T4 by
definition and Ronald is a rival rather than a tier; he is the post-boss challenger now, the same
shape *Legendary Ronald* has in Fossil. And **the four Club Masters he shared the bracket with joined
the other four in Jungle**, which is more faithful than the old split-by-Base-heaviness — PROGRESSION
called that "the arbitrary call in there" and it no longer has to be made.

**Team Rocket's bracket is generated, and that is the derivation working rather than a gap.**
`base5` went live in Job 10 with nothing authored for it in `ladder.json`, `buildLadder()`
synthesised a bracket, and no code or data changed for it to appear. It is what the claim above looks
like when it actually happens. Authoring a roster over the top is an override — see
[OPPONENTS.md](OPPONENTS.md). (This paragraph used to end by noting that `data/base1_decks.json` was
read by no part of the game. Both hand-built roster files are wired in now, through `gen_cards.js`'s
`b1:` and `b2:` sources.)

All 16 GBC decks are assigned and none is stranded; `progresstest.js` asserts that, and its count moved
from 30 authored opponents to 35 when the Jungle roster went in. The eight Club Masters used to be
split across two brackets by how Base-heavy each deck was — "the arbitrary call in there" — and that
call no longer has to be made: they are all in Fossil. Ronald's fourth deck, *Legendary Ronald*, is the **post-boss challenger**
in Fossil: a bracket's `extra` list unlocks once its own boss falls. When a fourth set goes live it
should probably become that bracket's boss instead.

**None of the 16 GBC decks is Base-Set-only** — every one plays Jungle or Fossil cards, Isaac the
fewest at 3 and Nikki the most at 16. So a bracket is named for **what beating it unlocks**, not for
what its opponents may field. Seeing a Fossil Lapras before you can buy Fossil packs is a lure, and
it is what the GBC game did.

## The screen, and the four things only a screenshot caught

Deck select is **the one screen whose content grows without bound** — every set that goes live adds
a bracket. It is pinned to the viewport with the ladder as the single flexible child, and the Play
bar is `position:sticky`. Still CSS-only, so [LAYOUT.md](LAYOUT.md)'s rule that this screen needs no
JS fitter still holds.

`smoke.js` had 136 tests passing while every one of these was live. **The stub has no layout engine;
`tools/shot.js` is the only instrument that can see any of it.**

- **864px of content in a 768px viewport** — the Play button simply gone.
- **Locked brackets drawn as full grids of unclickable tiles**, ~150px each, which is what caused
  that. They are one line each now, and they sit **outside** the scroller so what is ahead never
  scrolls away.
- **At 1280x600 the ladder was squeezed to ~70px**: a row of card art with every name, title and
  status clipped off. It has a floor of one full tile now.
- **With that floor, the locked strips escaped their wrapper** and painted over the options row —
  `min-height:0` on a box that has to stay as tall as its contents.

**The sticky Play bar is the fix that holds**, and it replaced three rounds of shaving pixels off
other things. The fixed chrome plus one full row of challengers exceeds 768px; there is no
viewport-independent way to fit both, and the ladder only grows. So the box scrolls and the one
control you always need stays put. Verified at 1280x600, 1366x768, 1600x900 and 1920x1080.

## Open

1. **Opponents do not speak.** Trevor is open to a couple of generic lines later and does not want
   portraits — a challenger's face is their deck's hero card, which reuses the deck-tile idiom
   rather than inventing an art system.
2. **The real per-set decks are a future job**, Trevor's and mine together: hand-built lists per set
   and a better automated builder. **What those decks have to hit is now specified —
   [OPPONENTS.md](OPPONENTS.md)**, Job 8: tiers, rung composition, entry conditions and pressure
   tags. This file stays the machinery; that one is the content.
   The GBC 16 are placeholders until then, and the `subs` records in
   `data/gbc_decks.json` say which cards are standing in for something we cannot generate yet.
   **The candidate pool for that job already exists and is researched** — 16 official WotC theme
   decks, 8 Gym Leader decks and 8 GB2 flavour decks, ID-mapped and count-verified but read by
   nothing. `data/OPPONENT_DECK_POOL.md` is the tracker; see [DATA.md](DATA.md) for what is in each
   file and what "quarantined" means here.
3. **Nothing reads `progress.lost` yet.** It is recorded, and a "this one keeps beating you" surface
   is the obvious use.

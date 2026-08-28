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

## The promos hang off this, per card

The promo gates live here rather than in `packs.js` because "has the player reached this" is a
progression question. `PROMO_GATES` maps a card id to the **bracket key** that must be OPEN, and
`unlockedPromos(save, ladder, isPlayable)` resolves it against the same derived `unlockedSets` as
everything else — so it stores nothing, exactly like unlock itself.

**Four of the eight keys name brackets that do not exist**, and they fail closed. `gym1` and `gym2`
resolve for free the day those sets go live. `challenge1` and `challenge2` need
[CHALLENGES.md](CHALLENGES.md)'s bracket, which "belongs to NO SET" — so whoever builds it has to
pick that key deliberately, and that is the only step.

**The second filter is not optional.** `isPlayable` is the caller's own test, and the game passes
"does this card have an effect script" — `basep` is half-scripted and stays that way for a long
time. A gate opening is necessary and not sufficient. See [PACKS.md](PACKS.md) for the gates
themselves and [COLLECTION.md](COLLECTION.md) for what a gated-open promo does to the binder.

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

**Record ratios, never counts.** Pack size dropped from eleven cards to eight on 25 Aug 2026, and
every absolute written into an outline became a lie the moment it did.

| Rung | Pays |
|---|---|
| T1 intro | ½ a standard win — it is a faucet, not a reward |
| T2 / T3 | 1 standard win |
| T4 boss | 1, and **1.5 on the first victory only** |
| Rival | 2, sets chosen at random without repeats |

That table came from [OPPONENTS.md](OPPONENTS.md) on 22 Aug 2026 and belongs here: it is what
`winReward` pays, and the tunables above are what it pays *with*. One subject, one file — the tier
each rung *is* stays over there.

**Repeat wins pay full, which makes farming optimal and dull.** The fix is optional **challenge
conditions on re-battles** — an entry condition, for a better reward — which turns the re-battle loop
from grinding into a decision and reuses a mechanism [CHALLENGES.md](CHALLENGES.md) already specifies
rather than inventing one. What the better reward *is* — richer pack odds, or a differently-composed
pack — is a [PACKS.md](PACKS.md) question. Note it is not a tuning change: a pack with different odds
is a new pack **type**.

**Two things were proposed on 15 Aug 2026 and dropped the same day, for the same shape of reason:**
paying out free play by chosen Prize count, and gating the main line on dex completion %. Both would
fund the collection from something that is not a decision. **Free play still pays nothing** and **dex
% is a good unlock for the optional challenge tier and a bad one for the main line.**
*[Both arguments in full, so neither comes back as a fresh idea →](HISTORY.md)*

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

**Verified against the live ladder 26 Aug 2026, and the way to check it is to read the data rather
than this table** — the snippet below prints it, and this table has been a job out of date before.

| Bracket | Intro (T1) | Body + gate | Boss | Extra |
|---|---|---|---|---|
| Base — The Clubs | 4 theme decks | 5 T2 + 2 T3, **all Trevor's** | the T4, *Ashfall* | Ronald, *I'm Ronald!* |
| Jungle — The Jungle | 2 Jungle theme decks | 3 T2 + 1 T3, **all Trevor's** | the T4, *Deep Bloom* | Ronald, *Invincible Ronald* |
| Fossil — The Dome | the 4 Grand Masters, standing in | 3 T2 + 2 T3, **all Trevor's** | the T4, *Nightshade* | Ronald, *Powerful Ronald* |
| Team Rocket — The Syndicate | 2 Team Rocket theme decks | 4 T2 + 3 T3, **all Trevor's** | the T4, *Undertow* | Ronald, *Legendary Ronald* |

**Fossil is the one place the placeholder rule still bends**, and it is worth one line: its own theme
decks are not in `data/`, so the T1 intro slot is genuinely empty and the four Grand Masters hold it.
Their legendary birds are Fossil cards, which makes them the least wrong stand-in available. Getting
the real Fossil theme decks in is the fix — not shuffling placeholders.

**What a placeholder IS — Trevor's rule, and it is the only part of this worth carrying.** Anybody
not holding a **hand-built deck or an authentic theme deck** is a placeholder, filling the gap between
a set going live and its own decks being authored. **As of 25 Aug 2026 every live set has its own
decks**, so the only placeholders left on the ladder are the four Grand Masters holding Fossil's
empty intro, and Ronald. The eight Club Masters retired rather than moving on, because no unauthored
bracket remained for them to fill.

**Where a given placeholder currently sits is not worth tracking, and this file used to track it
badly.** Trevor, 22 Aug 2026: any GBC deck can fill any gap — they are not a tier, a bracket or a
roster, and none of them is going to stay. Four separate paragraphs here narrated the Club Masters
being moved between brackets, and two of them **disagreed about where the eight ended up**, twelve
lines apart. **The table above is generated from the same data the game reads and is the answer; read
it, or run the snippet under it.** Nothing was wrong with the ladder — only with the prose describing
it, which is the failure mode to expect from any file that narrates a state instead of naming where
the state lives.

```bash
node -e "const{LADDER}=require('./src/cards.js');console.log(JSON.stringify(LADDER.brackets,null,1))"
```

**`placeholder: true` means the IDENTITY is ours, not the deck.** That is why the theme-deck rungs
carry it too — the lists are authentic, the names and titles are not. The detailing pass is what
clears the flag, and it is a *labelling* job precisely because nothing mechanical hangs off it.

**Every bracket ends in its own T4, and as of 25 Aug 2026 all four do.** The boss slot is a tier, so
a rival cannot hold it on merit; Ronald held Team Rocket's until that bracket had a T4 and is now the
post-boss `extra` in all four. **The rival is not a segment and is not per bracket** — Trevor, 21 Aug:
roughly four encounters across the whole ladder, a small group with a leader, decks drawn from every
previous set and paying combined packs. That is a design sketch and not a spec; see
[CHALLENGES.md](CHALLENGES.md), where it became the Challenge brackets.

**Team Rocket's bracket was generated for two days and that is the derivation working rather than a
gap.** `base5` went live in Job 10 with nothing authored for it in `ladder.json`, `buildLadder()`
synthesised a bracket, and no code or data changed for it to appear. Authoring a roster over the top
is an override, which is what then happened.

**None of the 16 GBC decks is Base-Set-only** — every one plays Jungle or Fossil cards, Isaac the
fewest at 3 and Nikki the most at 16. So a bracket is named for **what beating it unlocks**, not for
what its opponents may field. Seeing a Fossil Lapras before you can buy Fossil packs is a lure, and
it is what the GBC game did. `progresstest.js` asserts that no GBC deck is stranded.

## The screen this file makes unbounded

**Deck select is the one screen in the game whose content grows without bound, and that is a fact
about the ladder rather than about CSS** — every set that goes live adds a bracket, forever. It is
the one thing this file owes the layout, so it is stated here and the rules are next door.

**Four defects were live on that screen while `smoke.js` had 136 tests passing**, including 864px of
content in a 768px viewport with the Play button simply gone. The stub has no layout engine, so not
one of them was visible to it. **The three CSS rules that hold the screen together each look wrong
until you know what they protect**, and one of them is a `min-height` that must NOT be applied.
*[All four, the rules, and the viewports they were verified at →](SCREENS.md)* ·
*[the instrument that found them →](INSPECTION.md)*

## Open

1. **Opponents do not speak.** Trevor is open to a couple of generic lines later and does not want
   portraits — a challenger's face is their deck's hero card, which reuses the deck-tile idiom
   rather than inventing an art system.
2. **The real per-set decks are a future job**, Trevor's and mine together: hand-built lists per set
   and a better automated builder. **What those decks have to hit is specified and four brackets are
   built to it — [OPPONENTS.md](OPPONENTS.md)** for tiers and rung composition,
   [CHALLENGES.md](CHALLENGES.md) for entry conditions and pressure tags, neither of which is built.
   This file stays the machinery; those two are the content. The only GBC placeholders left are the
   four Grand Masters on Fossil, and the `subs` records in `data/gbc_decks.json` say which cards are
   standing in for something we cannot generate yet.
   **The candidate pool for that job already exists and is researched** — 16 official WotC theme
   decks, 8 Gym Leader decks and 8 GB2 flavour decks, ID-mapped and count-verified but read by
   nothing. `data/OPPONENT_DECK_POOL.md` is the tracker; see [DATA.md](DATA.md) for what is in each
   file and what "quarantined" means here.
3. **Nothing reads `progress.lost` yet.** It is recorded, and a "this one keeps beating you" surface
   is the obvious use.

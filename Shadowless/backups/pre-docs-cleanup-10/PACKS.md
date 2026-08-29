# Shadowless — booster packs

What a pack contains, how rarity works, and what the odds actually are. **Built and shipped in
Job 5b** — `src/packs.js` is the implementation, `tools/packtest.js` opens 200,000 of them against
a fixed seed and checks every row below.

The research that produced this, and the three passes the rarity table went through, are in
[HISTORY-ARCHIVE-1.md](HISTORY-ARCHIVE-1.md). How a variant is *stored* and *drawn* once pulled is in
[COLLECTION.md](COLLECTION.md). This file is generation only.

**Every number in `PACK_ODDS` is a placeholder** in the sense that Trevor's framing is a pacing
schedule rather than tuned values — but they are implemented, tested and load-bearing, so change
them deliberately and re-run `packtest.js`. They live in one object for exactly that reason.

## What WotC actually printed

Verified against `data/raw/*.json` and corroborated by web search 7 Aug 2026; sources at the bottom.

**Eleven cards per pack across the whole era**: 1 Rare, 3 Uncommon, 7 Common-tier, with roughly a
1-in-3 chance the Rare slot is a holo printing.

**Holo is not a separate rarity slot** — it is a coin flip on which physical card fills the single
Rare slot. Base Set's 16 Rare Holo and 16 Rare are two disjoint sets of *characters*, not a foil and
non-foil printing of the same 16. Pulling the Rare slot gives you one card from a pool of 32, about
a third of which happens to be foil.

**Basic Energy is a normal numbered card**, in the five sets that print it. The corpus leaves
`rarity` blank on it, which is a corpus quirk and not a statement about distribution — Base's six
Energies are #97–102 of 102. Base Set's real breakdown is 16 Rare Holo / 16 Rare / 32 Uncommon /
32 Common / 6 blank-rarity Energy = 102.

| Sets | Basic Energy | Numbering |
|---|---|---|
| `base1` `base4` `gym1` `gym2` `neo1` | 6 cards, blank `rarity` | at the end of the set's own range |
| `base2` `base3` `base5` `base6` `basep` `neo2` `neo3` `neo4` | **none at all** | n/a |
| `si1` | n/a — all 18 cards blank | Southern Islands had no rarity concept; it was a fixed boxed set |

Every row was derived from the data and is correct, but note that **`base4` is Base Set 2 and
`base5` is Team Rocket**, not the reverse — the codes read backwards and `gen_cards.js` named them
backwards until 11 Aug 2026. It is Base Set 2 that reprints Energy and Team Rocket that prints none.
See [DATA.md](DATA.md).

Rarity tiers present in `CARD_DB` across all 14 sets: Common 359 · Uncommon 358 · Rare 214 · Rare
Holo 208 · **Rare Shining 10** · Rare Secret 1 · Promo 53.

**Rare Shining ("RS" in code and UI chrome) is a real printed rarity**, not a game invention — Neo
Revelation and Neo Destiny only, shiny Pokémon rendered in a partial-holo pattern, WotC's own idea
years before the mainline games had shiny Pokémon at all. Pulling one of those 10 cards *is* pulling
an RS; no RNG layer sits on top of the rarity table. Spell it out only where a specific card is
being named.

**Print-run variants are not a pull mechanic — they are a calendar.** 1st Edition, Shadowless and
Unlimited are sequential print runs of Base Set, never randomised within a pack: a 1st Edition
booster box has zero Shadowless cards in it, not a low chance of one. Today's scarcity is pure
print-quantity history, not a chase WotC engineered. **So there is no real precedent to copy** —
everything in the next section that borrows one of those words is an invented mechanic wearing a
real term, and is flagged as such.

## What Shadowless does with it

**Design goal driving all of it:** the GBC game ran out of purpose for booster packs once a player
had good decks, and packs became filler. Every axis exists to keep a pack worth opening
indefinitely.

**Pack shape is 1 Rare + 2 Uncommon + 5 Common-tier = 8, shrunk from 11 on 25 Aug 2026** — Trevor,
from play: Commons and Uncommons were filling up too fast. Energy is a Common-tier card inside that
5-slot bucket rather than a separate slot, which is what the sets actually did. See "Bonus rare-tier
jumps" below for the mechanic that shipped alongside the shrink, and "Still open" for what the shrink
did to the cosmetic axes further down this file, which nobody touched but which moved anyway.

**A floor and a cap, and they are different things** — `ENERGY_FLOOR` and `ENERGY_CAP`, rebuilt
16 Aug 2026 from two of Trevor's playtest notes. The floor is a per-set guarantee and **only base1
has one**: early game the player is starved for Energy building a first deck and this reproduces that
pressure on purpose. The cap is **two, everywhere**, and it is the actual fix.

**A set that prints no basic Energy borrows base1's, into its Common pool, under base1's own ids.**
Jungle and Fossil print none at all. The Energy is drawn like any other Common and **never counts
toward the set it fell out of**, so the dex, the set-completion counters and the numbering need no
special case for it. Setting `ENERGY_FLOOR.base1` to 0 is the one line that makes Base Set behave
like every other set.

**A borrowing set draws Energy at the SOURCE set's share, not at its own array length's.** Drawing
uniformly from a Common pool looks like "the set's natural rate" and stops being that the moment a
set borrows: base1's six Energy are six of its own 38 Commons (**16%**), but dropped into Jungle's 16
they become six of 22 (**27%**). Jungle would get more Energy than Base Set purely for having fewer
Commons to dilute it. So `pools.energyShare` is inherited and the roll is explicit. For a set that
prints its own, the explicit roll is arithmetically identical to what uniform drawing already did,
so **nothing about Base Set changes**.

Measured over 40,000 packs each:

| | before | after | 0 / 1 / 2 Energy |
|---|---|---|---|
| base1 | 2.79 | **2.00** | 0% / 0% / 100% (floor and cap meet) |
| base2, base3 | 2.00, mandatory and beside the pack | **1.01**, drawn | 30% / 39% / 31% |

**What this replaced, and why the old reasoning stopped holding.** Job 6a delivered the guarantee for
Jungle and Fossil as a **stipend beside the pack** — two extra cards hung off an eleven-card
booster — specifically to protect set identity, on the grounds that drawing Base's Energy into the
pack proper makes an eleven-card Jungle booster secretly nine Jungle cards. Trevor's call on 16 Aug
overrides that: a thirteen-card pack with two mandatory cards in it reads to a player as *being
robbed of cards*, which is a worse failure than the one the stipend was avoiding, and it was a
thirteen-card pack every single time. **The other rejected alternative still stands**: basic Energy
does not move out of the sets into one shared pool, because that would make Base Set a 96-card set
when its Energies are printed as #97–102 of 102, and would collapse five sets' genuinely distinct
Energy printings into one. Borrowed Energy keeps base1's ids precisely so that stays true.

Borrowed Energy rolls variants like any other card, so a Shiny Water Energy out of a Jungle pack is
possible and is the convergence this table calls a feature.

**The Rare slot rolls holo-vs-non-holo first at a flat 2:1**, then picks the card from within that
tier's pool. Deliberately not each set's real ratio, which drifts 45–55% and isn't worth chasing.

### The axes, and how they stack

Every axis is independent — one pulled card can carry any number of them. **Convergence is a
feature**: a Common basic Energy that rolls Shiny *and* Shadowless *and* lands in a 1st Edition pack
should be able to happen, and should be funny when it does.

| Axis | Invented? | Rolls against | Odds | Packs to expect one | Wins @2/win |
|---|---|---|---|---|---|
| Holo Rare | no | the Rare slot | 1/3 | — | — |
| 1st Edition | yes | **whole pack** | 1/20 | ~20 | ~10 |
| Reverse Holo | yes | each of the 7 Common/Uncommon slots | 1/100 | ~15 | ~7 |
| Promo/SI intrusion | yes | whole pack, **adds** a 9th card | 1/100 | ~100 | ~50 |
| Shiny | yes | each of 8 slots | 1/440 | ~55 | ~28 |
| Shadowless | yes | each of 8 slots | 1/2200 | ~275 | ~138 |
| Misprint | yes | each of 8 slots | 1/11000 | ~1375 | ~688 |

**The "Packs to expect one" and "Wins @2/win" columns moved on 25 Aug 2026 when the pack shrank from
11 cards to 8** — the four per-slot odds above did not change, but there are fewer slots to roll them
against, so they all fire less often per pack than they used to. See "Still open" for whether that
rebalances back.

Notes on the invented ones:

- **1st Edition is a whole-pack roll.** When it hits, every card in that pack renders as its 1st
  Edition version — a single flashy moment, distinct in kind from the long-tail per-card chases.
  **Retuned from 1/25 to 1/20 on 12 Aug 2026, Trevor's call.** It is the only axis that dresses a
  whole pack rather than one card, so it is the one the player experiences as an *event*; at 1/25 it
  was rare enough to be forgettable between sightings. It sits outside the ~5x ladder below on
  purpose — that ladder is the per-card chases, and this is not one.
  It is **independent of Shadowless**, because across the full 14-set pool the two are independent
  facts about a print run; the nesting only holds for Base Set. See [HISTORY-ARCHIVE-1.md](HISTORY-ARCHIVE-1.md).
- **Reverse Holo borrows a later-era term.** Real reverse holo did not exist until the e-Card era
  (Expedition, 2002), which is after this corpus ends at Neo Destiny. It rolls only on the
  Common/Uncommon slots (7 of them, since the shrink) — Rares already have their own holo axis, and
  a holographic Common is a distinct, better feeling than overlapping with a system that exists. A
  card that jumped up to Rare-tier (see "Bonus rare-tier jumps") is excluded too, for the same reason.
- **Shiny is the forever-chase**, the layer the original game lacked entirely, and unrelated to RS.
  Any card in any slot can be Shiny, including a Common.
- **Misprint is a digital-error joke, not a period miscut** — text overflowing its box, artwork at
  the wrong aspect ratio, an inverted card. Three flavours (`mp1`/`mp2`/`mp3`) so a sighting reads
  as a fresh joke rather than "oh, the misprint effect again", and they are separate variant keys so
  two differently-broken cards are different collectibles.
- **Promo/SI intrusion is an EXTRA card, never the Rare, and never at a Common's expense** — the
  Rare stays the pack's emotional centre and an intrusion is a bonus surprise rather than
  competition for the headline pull. **It replaced a Common until 27 Aug 2026 and now adds a
  ninth card instead**, which is Trevor's reversal and worth the paragraph below, because the old
  rule was not wrong when it was written — it was repriced by a change nobody connected to it.

### Why the intrusion stopped replacing a Common

**The replacement rule was priced against an eleven-card pack.** One slot was ~9% of what you
opened. The 25 Aug shrink to eight silently moved that to 12.5%, and this file already carries a
paragraph about four cosmetic axes that moved the same way without anyone touching them — this was
the fifth, and the only one whose movement ran *against the player at the exact moment something
rare happened*.

Three things settled it:

- **The Common slot is not nothing.** It carries its own Reverse Holo chase and it is the currency
  of set completion, which is the long game. The principle that protects the Rare from competition
  protects the Commons too, just more quietly. The old rule read the Rare as the only slot with
  anything at stake.
- **The precedent was three days old.** The bonus rare-tier jump had already turned "exactly one
  Rare per pack" from a promise into a norm, so the pack already had a mechanism for *sometimes you
  just get more*. An additive intrusion is the same idea one step further.
- **The ninth face-down slot is a better reveal than the flip.** You sit down to a pack that is
  visibly one card too long and do not know which one it is. Under the old rule the surprise only
  existed after you turned over the specific slot; now it exists before you touch anything.

**`PACK_SIZE` is therefore no longer an invariant, and that is asserted rather than assumed.**
`packtest.js` checks a pack's length against its intrusion flag, and the old line — *"an intruded
pack is still PACK_SIZE cards with one promo"* — went red by itself the moment `packs.js` changed,
which is what a structural assertion is for. It now also measures the point of the change directly:
**an intruded pack still contains all eight set cards**, so an intrusion costs the player nothing.

**Two small consequences on screen.** The reveal header reports the *real* count rather than
`PACK_SIZE` — nine face-down slots against a header insisting on eight reads as a bug rather than
as a secret, and *which* card it is stays hidden either way. And `.packbox` widens from 1060px to
1220px on an intruded pack so the promo joins the row of seven instead of sitting alone on one; a
lone card reads as a second headline, which is the same reason the hero is a *position* rather than
a rarity. Below ~1200px of viewport it wraps, which flex already handled.

### Which promos can actually intrude

**A promo is gated PER CARD, not per set**, and the gates are Trevor's, authored in the `Gated
Until` column of the workbook's Index tab. `PROMO_GATES` in `src/progress.js` is that column, and
`tools/progresstest.js` re-reads the workbook and asserts the two still agree — a hand-copied table
and its source being two lists that cannot see each other.

**The gate is the bracket being OPEN, not CLEARED** (Trevor, 27 Aug 2026), so the four `base1`-gated
promos are reachable from the very first pack. He is reconsidering the gate *order* against a
cleared-based reading; that would change the values in that table and nothing else.

**Twenty-eight of the fifty-three promos carry a gate and seventeen resolve today.** The other
eleven name `challenge1`, `challenge2`, `gym1` or `gym2` — brackets that do not exist — and they
**fail closed**, which is the safe direction. Each turns on with no code change the day a ladder
bracket carries that key. The twenty-five promos with no gate at all are the unscripted half of
`basep`, and a second test keeps them out independently: the eligible pool is filtered by *has an
effect script* as well as by gate, so CLAUDE.md's "no collecting a card you cannot play" holds for a
set that is deliberately half-built.

Verified at 200,000 packs against the 8-card pack (25 Aug 2026): holo 1-in-3.0, 1st Edition 1-in-20.1,
Reverse Holo 1-in-14.3, Shiny 1-in-55.5, Shadowless 1-in-264.2, Misprint 1-in-1183.4. The ~5x ladder
between the per-card tiers holds at 3.89x / 4.76x / 4.48x, so it survives as the rule for extending
the table. **The pre-shrink numbers were holo 1-in-3.0, 1st Edition 1-in-20.1, Reverse Holo 1-in-9.9,
Shiny 1-in-39.3, Shadowless 1-in-200.2, Misprint 1-in-897** — every per-slot axis is rarer now, purely
because there are fewer slots for the same odds to roll against. See "Still open".

### Bonus rare-tier jumps

**Since 25 Aug 2026, "exactly one Rare per pack" is the norm rather than a promise.** Each Uncommon
slot and each Common slot carries a small independent chance to resolve as something better instead —
TCG Pocket's tier-jump is the reference point, not anything WotC printed. A jumped card gets EXACTLY
the guaranteed Rare slot's **odds**: the same 2:1 holo split, and the same Reverse Holo exclusion,
because once a card is Rare-tier it has its own holo axis for the same reason the guaranteed slot does.

**That word is *odds*, and the sentence was read as being about PRESENTATION.** Worth the line,
because the misreading shipped and lasted a day. A jumped card carries `slot: 'rare'` in the data —
correctly, since that names which pool it was drawn from — and the reveal screen read the same field
to mean *hero*, so every jumped card rendered full-width and hero-sized wherever it happened to sit
in the order. **A jumped Rare gets no special presentation at all**, not even a ribbon: Trevor's
call, 26 Aug 2026, that a Rare is recognisable on sight and is better as a bonus hiding in the crowd
than as a second headline. The general shape is worth more than the fix — **a field naming a card's
ORIGIN is not a field naming its ROLE**, and one screen read it as both. *[The reveal →](SCREENS.md)*

| Roll | Chance per card | Applies to |
|---|---|---|
| Uncommon → Rare | 3.3% | both Uncommon slots |
| Common → Uncommon | 2.4% | Common slots past the floor |
| Common → Rare (the two-tier jump) | 0.1% | Common slots past the floor |

**Three tuning drafts, all Trevor's, landed here.** v1 gave any bonus Rare-tier card about a 1-in-29
pack rate; v2 doubled the per-card odds and shrank Uncommon from 3 slots to 2, landing near 1-in-20 —
the same frequency as 1st Edition; v3 is shipped, retuned so a bonus Rare-tier card beats Reverse
Holo's own per-pack frequency and the two-tier jump stays clearly under it. **The Uncommon-to-Rare odds
were nudged from Trevor's original 3% to 3.3%** after measurement showed his three v3 numbers landed
the "beats Reverse Holo" goal as a near-tie (6.38% vs 6.79%) rather than clearing it. Flagged rather
than applied quietly; `PACK_ODDS` carries the same note and a one-line revert.

**The Energy floor is exempt from the jump roll, on purpose.** base1's two guaranteed Energy slots are
drawn before the jump-eligible loop even starts, so "the floor and the cap meet at two" (above) stays
literally true — a floor that could occasionally jump away would defeat its own purpose.

**One consequence of that exemption is worth recording rather than rediscovering.** base1 is the only
live set with a floor, so only 3 of its 5 Common slots are jump-eligible instead of 5. Measured at
200,000 packs, Base Set's own bonus-Rare-tier rate lands at essentially a **tie with Reverse Holo**
(~6.8% either side, inside each other's sampling noise) even after the nudge above, while every other
live set clears it comfortably (~6.9-7.5%, per-set sweep). **Whether that is an acceptable
"Base-Set-is-already-the-exception" outcome, or worth its own further nudge, is open** — flagged to
Trevor rather than resolved a second time by guessing.

**That run covered a quarter of the live content and one RNG stream, and both gaps are now closed —
24 Aug 2026.** Trevor reported his Shiny and 1st Edition pulls feeling too frequent, twice, and
neither gap could have been seen by making the run bigger:

- **It only ever opened `base1`.** Three other sets are live and the pools differ. Swept at N/4 each:
  every rate in every live set lands on the table, Team Rocket included, which is the set he was
  actually opening.
- **It reused one `mulberry32` stream across all 200,000 packs. The game makes a fresh one per
  pack**, seeded from `Math.random()` — so a real pack only ever samples the *first ~50 outputs of a
  brand new stream*, which a single long stream cannot test by construction. A PRNG whose early
  output was biased by its seed would have produced precisely the reported symptom while this file
  stayed green forever. Measured: clean.

**So the odds are right, and saying so is a result rather than a formality.** *[Both gaps, and the
deterministic flake found while closing them →](MISREADINGS.md)*

**`tools/pullcheck.js` answers the other question**, the one `packtest.js` cannot: not "does the
generator match the table" but *"did MY packs behave"* — it reads a real exported save. Reach for it
when Trevor reports a rate feeling wrong, and read its own caveats before believing either answer.
*[The three traps it exists to stop, each of which cost time the first time →](TOOLING.md)*

## The pacing number the economy turns on

`packtest.js` prints this without asserting it. Re-measured 25 Aug 2026 against the 8-card pack; the
pre-shrink figures (11-card pack) are alongside for comparison:

| To complete Base Set | Median packs | ~Wins at 2 packs/win | Pre-shrink median |
|---|---|---|---|
| Commons + Energy | 43 | 22 | 27 |
| Uncommons | 59 | 30 | 42 |
| Rares (non-holo) | 63 | 32 | 71 |
| **Rare Holos** | **140** | **70** | **164** |
| **All 102** | **156** | **78** | **157** |

**The whole Base Set collection game is still the sixteen Rare Holos, but a smaller share of it than
before.** Commons now finish about 28% of the way to the set (43 of 156 packs) and Uncommons about
38% (59 of 156) — both a larger share than pre-shrink (17% and 27%), because the Common and Uncommon
slots shrank while the Rare slot's own rate barely moved. Each specific holo still arrives at
1/3 × 1/16 per pack **plus whatever the bonus rare-tier jump adds on top** (see above) — and
coupon-collecting sixteen of those is still the long tail that *is* the game, now finishing slightly
FASTER than before (140 median packs vs. 164) because the jump mechanic hands out a small trickle of
extra Rare-tier pulls the old shape never gave it.

Two consequences, both still holding. **~78 wins to finish one set is still a good length**, almost
unchanged from before, so the economy still does not need a duplicate sink to have a purpose. And
**any future pity timer or duplicate protection should still aim at the Rare Holo slot specifically**
— the 73-to-389 pack spread on holos is still by far the widest of any tier, so two players can have
wildly different experiences of the same economy.

## Still open

1. **Southern Islands' fixed distribution vs. our intrusion model.** SI was a real boxed set with
   guaranteed contents, not a randomised pack, so folding 18 fixed cards into a probabilistic
   intrusion chance is itself an invented mechanic wearing a real set's name. Flagged rather than
   let ride on the promo idea by association.
2. ~~**Progression-gating the intrusion pool.**~~ **BUILT, Job 13b, 27 Aug 2026.** It went further
   than this item asked. The item wanted the pool to track the unlocked *era*; Trevor had already
   authored a gate per *card*, so it is gated per card instead — see "Which promos can actually
   intrude" above. The rest of the prediction held exactly: it needed nothing added to the save,
   because `unlockedSets` was already derived from `save.progress.beaten`.
   **The part nobody had noticed is that the intrusion had never fired at all.** `openPack` took an
   `opts.promos` pool, defaulted it to empty, and no caller ever passed one — so the 1-in-100 roll
   built in Job 5b was dead code in the shipped game for three weeks, in a suite-green tree. The
   guard that would have caught it is the one that now exists: `packtest.js` asserted the mechanism
   worked *when given a pool* and never asked whether anything gave it one. **A default that makes a
   feature inert is invisible to a test that supplies the argument.**
3. **The Challenge pack — a pool of every card up to that point.** Trevor's proposal, 21 Aug 2026, as
   the reward for the Challenge brackets in [CHALLENGES.md](CHALLENGES.md). **It works, and most of the
   machinery is already here**, which is worth knowing before anyone plans it as a large job:
   `buildPools(db, null)` already returns a union of every booster set — 65 rare-holo, 64 rare, 88
   uncommon, 88 common — and `openPack` already accepts a pre-built pool through `opts.pools`. Two
   things are missing and neither is big. The pool has to be built from the sets **the player has
   unlocked** rather than every set that exists, or a Challenge 1 pack could hand out Neo cards. And
   the save keys packs by set code, so a Challenge pack needs its own key.

   **It is a pack TYPE, not a set, and the distinction is load-bearing.** A set code entering
   `liveSets` would give itself a ladder bracket, a dex section and a completion percentage. Nothing
   about a Challenge pack wants any of those — its cards already belong to their own sets and already
   count toward those dexes, which is exactly the behaviour that makes it a good reward.

   **The design risk is dilution and it is worth deciding before building.** After Neo, "every card
   up to this point" is around a thousand cards, so any specific chase card is vanishingly rare — and
   a pack that is *conceptually* the biggest reward on the ladder could feel worse to open than an
   ordinary one. That cuts both ways: for a player filling a dex it is the only way back to the rares
   they missed four brackets ago, which is the whole point. The suggestion is to keep the union pool
   and make the pack read as a prize some other way — **more cards, or richer rarity odds**, rather
   than a narrower pool. Note that richer odds make it a new pack type anyway, so the two changes are
   one change.

   **Trevor answered the dilution question the same day and the answer dissolves it.** A player chasing
   one specific card **re-battles the bracket that card's set belongs to** — the ladder already provides
   targeted chasing, because `winReward` pays in the bracket's own set and repeat wins pay full. So a
   Challenge pack is not competing with that and does not need to. Its job is *better cards, any set*,
   which is complementary rather than diluted: **slightly richer rarity odds, less chance of a specific
   card, higher chance of a good one.** His words, offered as a thought rather than a commitment.

   **One thing to decide rather than let happen.** Richer rarity odds compound with the cosmetic variant
   rolls, so a Challenge pack would also become the best place in the game to pull a Shadowless or a 1st
   Edition. That is probably wanted — it is the biggest reward on the ladder — but it should be a
   decision, because nobody would have chosen it and it would arrive anyway.
4. **Restoring the pre-shrink pacing on the four per-slot cosmetic axes is a deferred agenda item, not
   an oversight.** Reverse Holo, Shiny, Shadowless and Misprint all roll once per SLOT rather than once
   per pack, so shrinking the pack from 11 cards to 8 on 25 Aug 2026 silently thinned all four —
   Reverse Holo alone moved from 1-in-9.9 to 1-in-14.3 packs, with nobody touching its `PACK_ODDS`
   value. Trevor's call, same day: leave the four odds as they are for now — retuning them on top of
   the rarity-jump mechanic that shipped the same day risks losing track of which change did what —
   and revisit as its own pass once the new pack shape has actually been played. Whoever picks this up
   should run `packtest.js` first rather than trust this file: its per-axis targets are now DERIVED
   from `PACK_ODDS` + `PACK_SHAPE` rather than hardcoded, so a wrong number there means the derivation
   needs revisiting, not just the odds.
5. **Base Set's bonus-Rare-tier rate runs close to a tie with Reverse Holo, specifically because of the
   Energy floor** — see "Bonus rare-tier jumps" above for the mechanism. Every other live set clears
   Reverse Holo's rate comfortably; base1 alone does not, because its floor removes 2 of 5 Common slots
   from jump eligibility. Open because whether that is an acceptable Base-Set-is-already-the-exception
   outcome, or worth its own nudge, is Trevor's call.

## Sources

- [Booster pack (TCG) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Booster_pack_(TCG))
- [The Ultimate Pokemon Base Set Guide — Poke Master Center](https://www.pokemastercenter.com/pokemon-base-set-guide/)
- [Pulling rare cards (holo, shadowless, 1st edition) wotc odds — Elite Fourum](https://www.elitefourum.com/t/pulling-rare-cards-holo-shadowless-1st-edition-wotc-odds/33900)
- [Identifying Early Pokémon Cards — Relentless Dragon](https://relentlessdragon.com/pokemon-card-game/identifying-early-pokemon-cards/)
- `data/raw/*.json` — ground truth for every count above, cross-checked live rather than recalled

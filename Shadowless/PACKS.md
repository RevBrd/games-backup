# Shadowless — booster packs

What a pack contains, how rarity works, and what the odds actually are. **Built and shipped in
Job 5b** — `src/packs.js` is the implementation, `tools/packtest.js` opens 200,000 of them against
a fixed seed and checks every row below.

The research that produced this, and the three passes the rarity table went through, are in
[HISTORY.md](HISTORY.md). How a variant is *stored* and *drawn* once pulled is in
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

**Pack shape is constant: 1 Rare + 3 Uncommon + 7 Common-tier = 11.** Energy is a Common-tier card
inside that 7-slot bucket rather than a separate slot, which is what the sets actually did.

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
| Reverse Holo | yes | each of the 10 Common/Uncommon slots | 1/100 | 10 | 5 |
| Promo/SI intrusion | yes | whole pack, replaces 1 Common | 1/100 | ~100 | ~50 |
| Shiny | yes | each of 11 slots | 1/440 | 40 | 20 |
| Shadowless | yes | each of 11 slots | 1/2200 | 200 | 100 |
| Misprint | yes | each of 11 slots | 1/11000 | 1000 | 500 |

Notes on the invented ones:

- **1st Edition is a whole-pack roll.** When it hits, every card in that pack renders as its 1st
  Edition version — a single flashy moment, distinct in kind from the long-tail per-card chases.
  **Retuned from 1/25 to 1/20 on 12 Aug 2026, Trevor's call.** It is the only axis that dresses a
  whole pack rather than one card, so it is the one the player experiences as an *event*; at 1/25 it
  was rare enough to be forgettable between sightings. It sits outside the ~5x ladder below on
  purpose — that ladder is the per-card chases, and this is not one.
  It is **independent of Shadowless**, because across the full 14-set pool the two are independent
  facts about a print run; the nesting only holds for Base Set. See [HISTORY.md](HISTORY.md).
- **Reverse Holo borrows a later-era term.** Real reverse holo did not exist until the e-Card era
  (Expedition, 2002), which is after this corpus ends at Neo Destiny. It rolls only on the 10
  Common/Uncommon slots — Rares already have their own holo axis, and a holographic Common is a
  distinct, better feeling than overlapping with a system that exists.
- **Shiny is the forever-chase**, the layer the original game lacked entirely, and unrelated to RS.
  Any card in any slot can be Shiny, including a Common.
- **Misprint is a digital-error joke, not a period miscut** — text overflowing its box, artwork at
  the wrong aspect ratio, an inverted card. Three flavours (`mp1`/`mp2`/`mp3`) so a sighting reads
  as a fresh joke rather than "oh, the misprint effect again", and they are separate variant keys so
  two differently-broken cards are different collectibles.
- **Promo/SI intrusion replaces a Common slot, never the Rare** — the Rare stays the pack's
  emotional centre and intrusion is a bonus surprise, not competition for the headline pull.

Verified at 200,000 packs: holo 1-in-3.0, 1st Edition 1-in-20.1, Reverse Holo 1-in-9.9, Shiny
1-in-39.3, Shadowless 1-in-200.2, Misprint 1-in-897. The ~5x ladder between the per-card tiers holds
at 3.96x / 5.09x / 4.48x, so it survives as the rule for extending the table.

## The pacing number the economy turns on

`packtest.js` prints this without asserting it:

| To complete Base Set | Median packs | ~Wins at 2 packs/win |
|---|---|---|
| Commons + Energy | 27 | 14 |
| Uncommons | 42 | 21 |
| Rares (non-holo) | 71 | 36 |
| **Rare Holos** | **164** | **82** |
| **All 102** | **157** | **79** |

**The whole Base Set collection game is the sixteen Rare Holos.** Everything else finishes inside
the first third of the run — by the time you have your last Uncommon you are barely a quarter of the
way to the set. Each specific holo arrives at 1/3 × 1/16 per pack, and coupon-collecting sixteen of
those is the long tail that *is* the game.

Two consequences. **~79 wins to finish one set is a good length**, so the economy does not need a
duplicate sink to have a purpose. And **any future pity timer or duplicate protection should aim at
the Rare Holo slot specifically** — the 34-to-390 pack spread on holos is by far the widest of any
tier, so two players can have wildly different experiences of the same economy.

## Still open

1. **Southern Islands' fixed distribution vs. our intrusion model.** SI was a real boxed set with
   guaranteed contents, not a randomised pack, so folding 18 fixed cards into a probabilistic
   intrusion chance is itself an invented mechanic wearing a real set's name. Flagged rather than
   let ride on the promo idea by association.
2. **Progression-gating the intrusion pool.** A promo from an era the player hasn't reached would
   read as broken rather than delightful, so the eligible pool should track whatever era is
   unlocked. **This was blocked on Job 7 and no longer is** — Job 7 shipped 12 Aug 2026, and the
   fact it needed exists: a bracket is open if the previous boss has been beaten, derived from
   `save.progress.beaten` rather than stored. So the eligible pool is computable from the save
   without adding anything to it. Nobody has built it. See [PROGRESSION.md](PROGRESSION.md).

## Sources

- [Booster pack (TCG) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Booster_pack_(TCG))
- [The Ultimate Pokemon Base Set Guide — Poke Master Center](https://www.pokemastercenter.com/pokemon-base-set-guide/)
- [Pulling rare cards (holo, shadowless, 1st edition) wotc odds — Elite Fourum](https://www.elitefourum.com/t/pulling-rare-cards-holo-shadowless-1st-edition-wotc-odds/33900)
- [Identifying Early Pokémon Cards — Relentless Dragon](https://relentlessdragon.com/pokemon-card-game/identifying-early-pokemon-cards/)
- `data/raw/*.json` — ground truth for every count above, cross-checked live rather than recalled

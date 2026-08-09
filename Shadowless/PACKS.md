# Packs

Planning document for Job 5's booster pack system — what a pack contains, how rarity works, and
whether print-run variants (Shadowless, 1st Edition) and Shining cards become pull mechanics.
Written ahead of the build, in parallel with the Job 4g visual pass, at Trevor's request. **Nothing
here is committed** — nothing in Job 5 exists yet, and every open question below is a real open
question, not a rhetorical one. Read [TOOLING.md](TOOLING.md) alongside this for how `CARD_DB`
rarity fields are actually populated from `data/raw/`.

## Part 1: what WotC actually printed

Verified against `data/raw/*.json` (the `pokemon-tcg-data` corpus) and corroborated by web search
7 Aug 2026 — sources at the bottom.

### Pack composition changed once, partway through the era

**Base Set, Jungle, Fossil** (the "unnumbered energy" era) — 11 cards per pack:

- 1 Rare (roughly 1-in-3 chance of being the holo printing instead of non-holo)
- 3 Uncommon
- 5 Common
- 2 Energy — **unnumbered**, drawn from a small pool outside the set's card count entirely

This is why `base1.json` shows 102 numbered cards (16 Rare Holo / 16 Rare / 32 Uncommon /
32 Common) **plus 6 "(none)"-rarity Energy cards** that aren't part of the 102. Jungle and Fossil
are cleaner — 16/16/16/16 and 15/15/16/16 — because both are exactly half and roughly-half Base's
size with proportionally identical slotting, and neither reprinted Energy into their own numbered
list (the corpus still shows Team Rocket, Gym Heroes/Challenge, and Neo Genesis carrying their own
6-card unnumbered Energy pools too — the "(none)" rarity persists further into the era than a clean
Base/Jungle/Fossil-only cutoff would suggest; the pack-composition question below needs a real
per-set check before Job 5 locks anything in).

**From some point in the Team Rocket/Neo stretch onward** — Energy became **numbered Common cards
within the set itself** rather than a separate unnumbered pool. Neo Genesis packs are reported as
7 Common / 3 Uncommon / 1 Rare = 11, no dedicated Energy slot, because Energy is already sitting
inside that Common count. Exactly where the cutover happens is not yet nailed down — see Open
Question 1.

### Rarity tiers, as implemented

Four real tiers appear in `CARD_DB` today, at these totals across all 14 sets:

| Rarity | Count | Notes |
|---|---|---|
| Common | 359 | |
| Uncommon | 358 | |
| Rare (non-holo) | 214 | |
| Rare Holo | 208 | The foil printing. Same rarity *slot* as non-holo Rare — see below |
| Rare Shining | 10 | Neo Revelation (2) and Neo Destiny (8) only. A **real, distinct printed rarity** — not a game invention. "Shiny" Pokémon rendered in a partial-holo pattern, WotC's own idea, years before the mainline games had shiny Pokémon at all |
| Rare Secret | 1 | Base Set 2's Pikachu Gold Star-style secret — a single card, numbered past the set's stated count |
| Promo | 53 | Southern Islands (18) and the promo set (53, overlapping some) don't slot into booster packs at all — different distribution, see Open Question 4 |

**Holo isn't a separate rarity slot** — it's a coin-flip on which physical card fills the single
Rare slot. Base Set's 16 Rare Holo and 16 Rare are two disjoint sets of *characters*, not a holo
and non-holo printing of the same 16 cards — pulling the Rare slot gives you one specific card from
a pool of 32, and roughly a third of that pool happens to be foil.

### Print-run variants are not a pull mechanic — they're a calendar

**1st Edition, Shadowless, Unlimited are not rarities and were never randomized within a pack.**
They're sequential print runs of Base Set specifically, distinguished by a stamp (1st Edition) and
a graphic tweak (the drop shadow behind the art frame, absent on the first press run and present
from then on). Every pack from a given print run contained only cards from that run — a 1st
Edition booster box has zero Shadowless or Unlimited cards in it, not a low chance of one. Scarcity
today is pure print-quantity history (1st Edition ran smallest and sold out before "Pokémania"
hit, Shadowless ran next, Unlimited is common), not anything WotC engineered as a chase mechanic.

This matters for Job 5 because **it means there is no real precedent to copy.** Modeling Shadowless
as something a pack *pulls* would be an invented mechanic wearing a real term, not a
recreation — see Part 2.

**One more wrinkle, caught 8 Aug via Trevor's own collection:** the shadow/shadowless frame change
is a **Base Set-only event.** Base is the one set whose art frame changed mid-print-run; every set
after it (Jungle onward) launched with the shadow already standard and it never changed again. 1st
Edition stamps, though, exist across most of the era's sets, not just Base — Jungle, Fossil, Team
Rocket, both Gym sets, and Neo all had their own 1st Edition print runs, and every one of those
already had the shadow, because the frame never reverted. So "1st Edition implies Shadowless" is
true only for Base Set specifically; project-wide, across all 14 sets, the two are independent
facts about a print run, not nested. That reshapes how Job 5 should model them — see Part 2.

## Part 2: what Shadowless (the game) does with this

Discussed with Trevor 8 Aug 2026. The shape below is agreed; the specific percentages in it are
**placeholders, not tuned values** — they're stakes in the ground to build against and adjust once
packs actually run. Nothing here is final in the sense that Job 5 can't revisit it, but it's no
longer a blank slate either.

**Design goal driving all of it:** the original GBC game ran out of purpose for booster packs once
a player had good decks — packs became pure filler. Every axis below exists to keep a pack worth
opening indefinitely, not just early on.

### Pack composition — Energy folded into a floored Common bucket

Energy gets numbered from the start in every set (no more "(none)"-rarity unnumbered pool), and
lives inside a single 7-slot Common-tier bucket rather than a separate Energy slot. Pack shape is
constant across the whole game: **1 Rare + 3 Uncommon + 7 Common-tier = 11 cards.**

- **Base, Jungle, Fossil:** floor of ≥2 of those 7 Common-tier slots must be Energy. Early game, the
  player is starved for Energy building first decks — this reproduces that pressure deliberately.
- **Team Rocket onward:** no floor. Energy just competes at its natural (small) share of the Common
  pool, so it becomes scarce exactly when a stocked player stops needing it.

This sidesteps the real-world cutover question entirely — a look back at the corpus shows
unnumbered Energy sitting in *every* set through Neo Genesis, which is almost certainly the
`pokemon-tcg-data` API repeating a basic-Energy convenience list per set for deckbuilding, not
evidence of a real per-set print change. There was no clean historical cutover to find, so
designing our own at the Team Rocket boundary is the right move rather than a shortcut around one.

### Rare slot — flat 2:1 ratio, not per-set fidelity

Roll holo-vs-non-holo first at a flat **2:1 non-holo:holo** ratio (33% holo) for every set, then
pick the specific card from within that tier's pool. Deliberately not reading each set's actual
pool ratio (which drifts 45–55% and isn't worth chasing) — 33% is simple, tunable in one place, and
matches the commonly-remembered "1 in 3" folklore rate closely enough to feel right.

### The rarity axes, and how they stack

Every axis below is fully independent of the others — a single pulled card can combine any number
of them. **Convergence is a feature, not something to guard against**: a Common basic Energy that
happens to roll Shiny, Shadowless, *and* land in a First Edition pack should be able to happen, and
should be funny when it does. (Naming convention: **"RS" for Rare Shining** in code, comments, and
UI chrome from here on — spelled out only where a specific card is being named, e.g. a dex entry or
card-detail view. Cheap fix for the naming collision noted below, agreed 8 Aug.)

1. **Printed rarity + Rare Shining (RS)** — not a roll. RS is a real WotC rarity (10 cards, Neo
   Revelation/Destiny only); pulling one of those 10 specific cards *is* pulling an RS, same as
   pulling any other Rare. No RNG layer needed on top of the existing rarity table. At only 10 cards
   across the whole pool, RS stays rare enough on its own that it won't get lost under the
   more-common invented "Shiny" layer below.
2. **Shiny (invented)** — an independent low-odds cosmetic roll on **any** pulled card, any tier,
   unrelated to RS. A Common can be Shiny. This is the layer the original game lacked entirely, and
   the one Trevor most wants as a forever-chase. Placeholder odds: somewhere around **1/128** —
   rare enough to feel earned, common enough that a long session sees a few. Tunable.
3. **Reverse Holo (invented, borrows a later-era term)** — real reverse holo didn't exist until the
   e-Card era (Expedition, 2002), which is *after* this project's 14-set corpus ends at Neo Destiny.
   Same honesty flag as Shadowless below: this is vocabulary borrowed from later WotC history, not a
   recreation of anything that existed in these specific sets. Restricted to **Common/Uncommon pulls
   only** — Rares already have their own holo/non-holo axis (see below), and a holographic Common is
   a distinct, better feeling than overlapping with a system that already exists. Placeholder odds
   **1/20–1/50**.
4. **Shadowless (invented, ultra-rare)** — independent per-card roll, candidate odds **~1/4096**
   (Trevor's own mainline-shiny-hunting reference number), cosmetic frame/marking rather than a
   gameplay difference. Can land on any card of any tier.
5. **1st Edition (invented, independent of Shadowless)** — corrected 8 Aug from an earlier version
   of this doc that nested it under Shadowless. That nesting only holds for Base Set specifically
   (see Part 1's note on the Base-only frame change); across the full 14-set pool the two are
   independent facts, so the game should treat them that way too. Back to Trevor's original
   pitch: a rare (~2% placeholder) chance the **entire pack** gets swapped to a 1st Edition version
   of what it would've gotten anyway — a single flashy whole-pack moment, distinct in kind from the
   long-tail per-card chases above, not a rung on the same ladder.

### Ideas raised, not yet adopted

- **A curated escalating alt-art tier** (Trevor's read on TCG Pocket's approach: pick specific
  cards, give them an extra "special-er" rarer version). Genuinely interesting, but it doesn't
  compose the way the five axes above do — those are each "one flag, apply the roll to any card,
  done"; this needs someone to actually choose and tag specific cards, which is real per-card
  design labor, not a system. Recommend shelving for a later job rather than folding into Job 5's
  first pass.
- **"Miscut" / misprint tier** — an idea worth floating in return: genuine WotC-era misprints
  (off-center cuts, wrong-color energy symbols) are real, famous collector chase items from exactly
  this era. Unlike Shadowless-as-roll or Reverse Holo, this one's actually *true to the era's real
  oddities*, just gamifying what was originally a factory accident, and it's cheap — a CSS
  transform/skew on the existing scan, no new art needed. Would sit near Shadowless rarity or
  rarer. Not decided either way.
- **Opponent cards getting the same treatment.** Trevor wants Shiny/Shadowless/etc. rolled for
  opponent cards too, not just the player's pulls. Leaning toward the lightweight version: roll it
  live at play time, purely cosmetic, no persistence — the AI doesn't need its own collection for
  this, it just runs the same render function on both sides of the board. A deeper version (Job-7
  named opponents with their own persistent pulled collections) is a much bigger scope decision —
  flagging the fork rather than assuming which one was meant.

### Promo / Southern Islands intrusion

A small chance (candidate 1–2%) that a Common slot in an otherwise-normal pack gets replaced by a
promo or Southern Islands card instead — "every once in a while a promo Mewtwo jumps into your
pack." Two refinements on top of the original ask:

- **Replace a Common slot, not the Rare.** Keeps the Rare slot as the pack's emotional center;
  intrusion is a bonus surprise, not competition for the headline pull.
- **Gate the eligible pool by progression.** A promo from an era the player hasn't reached yet
  showing up early would read as broken rather than delightful — the eligible intrusion pool should
  track whatever era range is currently unlocked. Exact mechanics depend on Job 7's progression
  design, which doesn't exist yet — see Open Question 4.

### Open questions — genuinely unresolved, want Trevor's read on each

1. **Southern Islands' fixed distribution vs. our intrusion model.** SI was a real boxed set with
   its own guaranteed contents, not a randomized pack — folding 18 fixed-distribution cards into a
   probabilistic intrusion chance is itself an invented mechanic wearing a real set's name. Worth
   flagging explicitly rather than let it ride on the promo-intrusion idea by association.
2. **Progression-gating specifics.** What "eligible intrusion pool" and "which packs even exist yet"
   actually mean depends on Job 7's opponent/unlock schedule, which is still unbuilt. This doc can't
   fully resolve it in isolation — revisit once Job 7 has real shape.
3. **Miscut tier — adopt it or not?** Floated 8 Aug as a creative addition, grounded in real
   collector lore, cheap to render. Not yet a decision either way.
4. **Opponent-cosmetic depth.** Live per-play cosmetic roll (recommended, cheap) vs. persistent
   opponent collections tied to Job 7 progression (much bigger scope). Leaning toward the former
   unless Trevor wants the latter.
5. **Curated alt-art tier — timing, if ever.** Shelved above as not composing cleanly with the rest;
   worth a firm yes/no/later at some point so it doesn't linger as a vague someday-idea.
6. **Every percentage above is a placeholder.** 2:1 holo ratio, ≥2 Energy floor, ~1/128 Shiny,
   1/20–1/50 Reverse Holo, ~1/4096 Shadowless, ~2% First Edition — none of these are tuned, they're
   starting points to build against and feel out once packs actually run.

## Sources

- [Booster pack (TCG) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Booster_pack_(TCG))
- [The Ultimate Pokemon Base Set Guide — Poke Master Center](https://www.pokemastercenter.com/pokemon-base-set-guide/)
- [Pulling rare cards (holo, shadowless, 1st edition) wotc odds — Elite Fourum](https://www.elitefourum.com/t/pulling-rare-cards-holo-shadowless-1st-edition-wotc-odds/33900)
- [Identifying Early Pokémon Cards — Relentless Dragon](https://relentlessdragon.com/pokemon-card-game/identifying-early-pokemon-cards/)
- `data/raw/*.json` (the `pokemon-tcg-data` corpus already in this repo) — ground truth for every
  count in Part 1's tables, cross-checked live 7 Aug 2026 rather than trusted from memory

## Credits

- **Sonnet 5** (Claude Code, 7 Aug 2026) — this document, researched and written during a parallel
  Job 4g session at Trevor's request.
- **Sonnet 5** (Claude Code, 8 Aug 2026) — Part 2's working plan, refined with Trevor over the
  energy floor, the flat holo ratio, and the rarity axes.
- **Sonnet 5** (Claude Code, 8 Aug 2026, same day) — corrected the 1st-Edition/Shadowless
  relationship after Trevor's own collection contradicted the original nesting, added Reverse Holo
  and the RS naming convention, and floated Miscut as a new idea.

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

## Part 2: what Shadowless (the game) could do with this

Everything below is a proposal, not a decision. Marked options are starting points for discussion,
not defaults to build toward.

### Base pack structure — low-risk, mirrors history directly

A pack draws against the set's actual `CARD_DB` rarity distribution:

- 1 Rare slot (weighted by that set's real holo/non-holo split — e.g. Base Set ~50/50, since
  16 Rare Holo vs 16 Rare is dead even there; other sets vary and should read their own ratio
  rather than hardcoding 1-in-3 everywhere)
- 3 Uncommon
- 5 Common (Base/Jungle/Fossil-shaped sets) or 6 Common (sets where Energy is already a numbered
  Common, once Open Question 1 is settled)
- Energy slot(s) only for sets that still carry unnumbered Energy in `CARD_DB`

This is the part that's basically just "read the set's own rarity table and deal accordingly" —
little design risk, mostly implementation work once Open Question 1 resolves.

### Open questions — genuinely unresolved, want Trevor's read on each

1. **Where does the pack-composition cutover actually happen?** Confirmed 11-card unnumbered-Energy
   packs for Base/Jungle/Fossil, confirmed 7C/3U/1R for Neo Genesis. Team Rocket and both Gym sets
   still show a 6-card "(none)" pool in the corpus, which muddies a clean cutoff — needs a
   per-set pack-list check (Bulbapedia or similar) before Job 5's pack tables can be trusted set by
   set, rather than assumed from the two confirmed endpoints.
2. **Should "Shiny" as a game mechanic just *be* the real Rare Shining cards, full stop?** They
   already exist in the data (10 cards, Neo Revelation/Destiny), already read as a distinct rarity,
   and inventing a separate sparkle-variant system on top would create two things named "shiny"
   that mean different things. Leaning toward: no invented shiny system, Rare Shining is shiny,
   done — but flagging it because "chase mechanic" instincts pull toward wanting more than 10 cards
   worth of one across the whole eventual 1,251-card pool.
3. **Does Shadowless-as-print-variant become a pull axis at all, and if so, on what?** Three shapes
   worth naming, none chosen:
   - **Don't model it.** Every pulled card is just "the card" — cleanest, most honest to the fact
     that this was never a randomized thing historically.
   - **Cosmetic-only variant roll.** A pulled card randomly renders with the Shadowless (or 1st
     Edition) art-frame difference for flavor, no gameplay or value distinction — closest to
     "invented mechanic wearing a real term" from Part 1, worth being honest with ourselves about.
   - **A collection/dex axis, not a pack axis.** Packs stay exactly as historical; a *separate*,
     much rarer roll (or a dedicated pack type, or a Job-7-style unlock) is where a Shadowless
     print might show up, kept clearly distinct from normal pack contents rather than blended into
     them.
4. **What do Southern Islands and the promo pool do, given they never had real booster packs?**
   Southern Islands was a Japan-only boxed set with its own fixed distribution, not a randomized
   pack; promos were event/mail-away singles. Both are already in scope per Shadowless/CLAUDE.md's
   Data section — this is a "what UI surfaces them" question (special pack type? dex-only
   unlocks? tied to Job 7 progression?) more than a rarity-table question.
5. **Per-set holo ratio vs. a flat assumption.** Base Set's Rare pool is an even 16/16 holo split,
   but that's a property of Base Set, not a rule — later sets (see the table in Part 1: Gym
   Heroes 19/23, Neo Destiny 16/19) don't split evenly. Worth deciding early whether packs read the
   real ratio per set or use one flat number everywhere, since it's cheap to do correctly now and
   awkward to unwind after pack code is written against a hardcoded assumption.

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

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

### Pack composition, and the "unnumbered Energy" story that turned out not to exist

**Corrected 9 Aug 2026**, at the start of Job 5, by re-querying every set in `data/raw/` rather
than reasoning from Base Set alone. The earlier version of this section described an "unnumbered
Energy era" that gave way to numbered Energy partway through, and asked which set the cutover
landed on. **There is no cutover, because there was never an unnumbered pool.** Leaving the
original wording here would have sent Job 5 hunting for a boundary that doesn't exist.

Eleven cards per pack across the whole era, and the commonly-reported slotting is:

- 1 Rare (roughly 1-in-3 chance of being the holo printing instead of non-holo)
- 3 Uncommon
- 7 Common-tier

What the corpus actually says about Energy, per set:

| Sets | Basic Energy in the set | Numbering |
|---|---|---|
| `base1` `base4` `gym1` `gym2` `neo1` | 6 cards, **blank `rarity` string** | Numbered at the **end of the set's own range** — Base's are #97–102 of 102 |
| `base2` `base3` `base5` `base6` `basep` `neo2` `neo3` `neo4` | **none at all** | n/a |
| `si1` | n/a — all 18 cards carry a blank rarity | Southern Islands has no rarity concept; it was a fixed boxed set |

So the six Base Set Energies **are** part of the 102, not a pool outside it — the corpus simply
leaves `rarity` empty on basic Energy, in exactly the five sets that reprinted it, and every one of
those numbers them inside its own range. Double Colorless Energy is the counter-example that proves
the point: it is #96, Uncommon, and sits in the numbered list like anything else. Base Set's real
breakdown is 16 Rare Holo / 16 Rare / 32 Uncommon / 32 Common / 6 blank-rarity Energy = 102.

**This vindicates Part 2's design rather than undermining it.** The decision below — Energy is a
numbered Common-tier card from the start, in every set — was made to sidestep a messy historical
cutover. It turns out to be the *faithful* option, not a shortcut around one.

**One genuine Job 6 problem falls out of the table above: Jungle and Fossil contain no basic Energy
whatsoever.** The "≥2 Energy floor" in Part 2 cannot be satisfied from a Jungle or Fossil pack's own
pool, because there is nothing to draw. Either the floor draws basic Energy from Base's pool (which
is what really happened — players used the Energy they already had), or those two sets get no floor.
Not urgent, but it must be settled before Job 6 and it is not settled here.

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

### Every scan we own is already 1st Edition Shadowless

**Found 9 Aug 2026** by pulling the hires image for `base1-4` and reading it. The `base1` card faces
in `data/raw/` — the ones `tools/fetch_art.js` downloads into `assets/cards/base1/` — are scans of
the **1st Edition print run**. The `EDITION 1` stamp sits below the artwork on every card, and the
art frame carries no drop shadow, because 1st Edition Base *is* Shadowless by definition.

Two of Part 2's five axes therefore have nothing to distinguish them from the default, on the scans:
a 1st Edition pack would render identically to every other pack, and Shadowless is already true of
all 102 cards. There is no second image per card in the corpus, so no Unlimited scan to fall back on.

The resolution, agreed with Trevor 9 Aug, is to split the axes by what they can physically express:

- **Additive cosmetics** — Shiny, Reverse Holo, Misprint. These are laid *on top*, so they work on
  our rendered card face **and** over a scan: a sheen with `mix-blend-mode`, a glitch filter. No
  bitmap surgery required, and they can appear anywhere a card appears.
- **Print-run cosmetics** — 1st Edition and Shadowless. A stamp that is already present and a shadow
  that is already absent. These can only ever be expressed on **our own render**, never on a scan.

The consequence worth carrying forward: **the pack reveal cannot be the scan alone.** It is the one
moment a variant matters most, and a bare scan is variant-blind — a 1-in-2200 Shadowless would pull
silently. The reveal uses the `fullCard()` shape (real scan *plus* our marked render underneath),
which already exists as the hover panel. See Part 2's rendering notes.

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

Energy is treated as a Common-tier card and lives inside a single 7-slot Common-tier bucket rather
than a separate Energy slot. Pack shape is constant across the whole game: **1 Rare + 3 Uncommon +
7 Common-tier = 11 cards.**

- **Base, Jungle, Fossil:** floor of ≥2 of those 7 Common-tier slots must be Energy. Early game, the
  player is starved for Energy building first decks — this reproduces that pressure deliberately.
- **Team Rocket onward:** no floor. Energy just competes at its natural (small) share of the Common
  pool, so it becomes scarce exactly when a stocked player stops needing it.

This holds up under the corrected Part 1, but for a different reason than originally written. The
earlier text justified it as sidestepping a messy real-world cutover; there was no cutover, and
basic Energy is a normal numbered card in each of the five sets that printed it. So this isn't a
sidestep at all — it's what the sets actually did, minus the blank `rarity` string that the corpus
happens to leave on Energy.

**The floor is the part that needs work, not the bucket.** Jungle and Fossil print no basic Energy,
so their floor has nothing to draw from — see the note at the end of Part 1. The bucket itself is
fine everywhere.

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
2. **Shiny (invented)** — an independent low-odds cosmetic roll, per card, on **any** pulled card
   in any of the 11 slots, unrelated to RS. A Common can be Shiny. This is the layer the original
   game lacked entirely, and the one Trevor most wants as a forever-chase.
3. **Reverse Holo (invented, borrows a later-era term)** — real reverse holo didn't exist until the
   e-Card era (Expedition, 2002), which is *after* this project's 14-set corpus ends at Neo Destiny.
   Same honesty flag as Shadowless below: this is vocabulary borrowed from later WotC history, not a
   recreation of anything that existed in these specific sets. Rolled per card, but only on the
   **10 Common/Uncommon slots** — Rares already have their own holo/non-holo axis, and a holographic
   Common is a distinct, better feeling than overlapping with a system that already exists.
   (Said "7" until 9 Aug, which was the Common count mistaken for Common-plus-Uncommon. The v3
   table below always said 10, and 3 + 7 = 10 is right.)
4. **Shadowless (invented, ultra-rare)** — independent per-card roll across all 11 slots, cosmetic
   frame/marking rather than a gameplay difference. Can land on any card of any tier.
5. **1st Edition (invented, independent of Shadowless)** — corrected 8 Aug from an earlier version
   of this doc that nested it under Shadowless. That nesting only holds for Base Set specifically
   (see Part 1's note on the Base-only frame change); across the full 14-set pool the two are
   independent facts, so the game should treat them that way too. Back to Trevor's original pitch:
   a rare, **whole-pack** roll — when it hits, every card in that pack renders as a 1st Edition
   version of what it would've gotten anyway. A single flashy moment, distinct in kind from the
   long-tail per-card chases above, not a rung on the same ladder.

### Where the markings actually get drawn

Trevor, 9 Aug 2026. **The scans stay pristine.** A real card face is a general display of the real
card and carries no variant marking; everything cosmetic is drawn on **our own rendered card face**,
the one with the sigil. That render doubles as a detail view — most board positions can't show full
attack stats, so hovering any card gives you the complete printing plus whatever variants it carries.

That view already exists: `fullCard()` in `src/ui.js` stacks the scan on top of our full rendered
stat block. What Job 5 adds is the markings on the lower half, and the same markings on the smaller
in-play renders (`miniCard`, `handCard`, `renderSlot`) so a Shiny reads as Shiny on the board rather
than only on hover.

- **1st Edition** — our own stamp glyph, echoing where the real one sits. Deliberately legible at
  dex-thumbnail size too: it's a whole-pack roll, so you'll want to spot it across a grid.
- **Shiny** — **settled 9 Aug: a palette shift, not a sheen.** `hue-rotate(150deg) saturate(1.35)`
  on the scan, and every line of the Sigil Card's ink turned teal. Trevor picked it out of a
  comparison strip, where it had been sitting as a Misprint flavour, and it is the better idea on
  its own merits: a shiny Pokémon in the mainline games *is* a recoloured one, so the treatment
  means the same thing the word does. It also shifts differently on every card — Charizard goes
  cyan, Blastoise magenta, Fire Energy green — which reads as an alternate colouring rather than a
  filter applied on top. Two sheens were tried first and both failed: `color-dodge` blew pale card
  stock to unreadable white, and `overlay` was legible but landed with wildly different strength
  depending on how bright a card's art was. Misprint's third flavour became `invert(1)` in the
  swap, since a palette shift and a hue rotation could no longer coexist.
- **Shadowless** — **not settled.** Our render has no art frame to un-shadow, and the nearest
  analogue is the sigil box. Adding a hard offset shadow to every sigil box, so that one card in two
  hundred can lack it, would change the default look of the whole game to serve a variant almost
  nobody sees — and Trevor's note is that the current cards have a balance worth protecting.
  *Proposed, not agreed:* confine it. The board keeps exactly the look it has now, and the shadowed
  art window exists only where a card is shown **as a collectible** — dex, pack reveal, detail panel.
  That puts the entire visual change inside screens Job 5 builds from scratch, touches nothing the
  8 Aug design lock covers, and is honest to the original, which was itself only ever visible when
  you were looking at a card rather than playing it.

  **BOTH ARE NOW BUILT (Job 5c), switchable from the DEV tab, and the shadow question is still
  open.** `UI.shadowMode = 'shadow'` draws the shadow and Shadowless removes it; `'inverted'` is
  Trevor's version, where Shadowless is the base state and the rare pull adds a shadow. The
  confinement above holds in both — the board is identical either way.

  **The loudness problem is solved separately, and that was Trevor's idea (9 Aug).** Looking at the
  A/B, we independently landed on the same objection: the shadow alone is too quiet to carry a
  1-in-200 pull. So the Sigil Card now prints **"SHADOWLESS" across its art window**, set in the
  title screen's face — the game's own name as the mark. It deliberately carries no `text-shadow`,
  where `.gametitle` has one as a joke about the word; the thing the word actually describes should
  not have one. That makes the watermark the announcement and the shadow the fidelity, so the
  remaining A/B is a question about faithfulness rather than about legibility.

Placeholder odds for all of these, plus Promo/SI intrusion (below), are in one table:

### Placeholder rarity table (v3, 8 Aug 2026 — pacing-first)

v2 was worked out forward from packs-opened; this pass (same day) was worked out **backward from
wins needed**, using a working assumption of **2 packs earned per win**, then rounded to whichever
per-card odds make the pack/win math land exactly. That assumption is a calibration yardstick, not
a locked economy decision — if Job 5's real reward rate differs, only the "wins to expect one"
column moves, not the per-card odds themselves. 1st Edition and Promo/SI are left at their v1
values; both were already judged fine and weren't part of this pass.

| Axis | Rolls against | Odds | Packs to expect one | Wins to expect one (@2 packs/win) |
|---|---|---|---|---|
| 1st Edition | whole pack | 1/25 (4%) | ~25 | ~13 |
| Reverse Holo | each of 10 Common/Uncommon slots | 1/100 | 10 | 5 |
| Promo/SI intrusion | whole pack, replaces 1 Common | 1/100 (1%) | ~100 | ~50 |
| Shiny | each of 11 slots | 1/440 | 40 | 20 |
| Shadowless | each of 11 slots | 1/2200 | 200 | 100 |
| Misprint | each of 11 slots | 1/11000 | 1000 | 500 |

### Verified against 200,000 simulated packs (9 Aug 2026, Job 5b)

`src/packs.js` implements the table above and `tools/packtest.js` opens 200,000 packs against it
with a fixed seed. **Every row lands where it promises** — holo 1-in-3.0, 1st Edition 1-in-25.1,
Reverse Holo 1-in-9.9, Shiny 1-in-39.3, Shadowless 1-in-200.2, Misprint 1-in-897. The ~5x ladder
holds at 3.96x / 5.09x / 4.48x between rungs, so it survives as the rule for extending the table.

**The number nobody had computed, and the one Job 5's economy actually turns on:**

| To complete | Median packs | ~Wins at 2 packs/win |
|---|---|---|
| Commons + Energy | 27 | 14 |
| Uncommons | 42 | 21 |
| Rares (non-holo) | 71 | 36 |
| **Rare Holos** | **164** | **82** |
| **All 102** | **157** | **79** |

The whole Base Set collection game is the sixteen Rare Holos. Everything else finishes inside the
first third of the run — by the time you have your last Uncommon you are barely a quarter of the way
to the set. Each specific holo arrives at 1/3 x 1/16 per pack, and coupon-collecting sixteen of
those is the long tail that *is* the game.

Two consequences worth holding onto. **~79 wins to finish one set is a good length**, and it means
the Job 5 economy does not need a duplicate sink to have a purpose — the chase is long enough on its
own. And **any future "pity timer" or duplicate-protection idea should aim at the Rare Holo slot
specifically**, because that is the only slot where the tail is long enough to hurt: the 34-to-390
pack spread on holos is by far the widest of any tier, so two players can have wildly different
experiences of the same economy.

Nothing here needs to stay this exact — Trevor's framing is a pacing schedule, not hard numbers.
Two properties worth preserving if these get retuned later:

- **The win milestones form a clean ~5x ladder** (5 → 20 → 100 → 500, i.e. 4x then 5x then 5x).
  If a tier ever gets added above Misprint or between two existing tiers, "~5x the wins of the tier
  below" is now a legible rule to extend from rather than picking a number from scratch.
- **Shadowless's "50% better odds" ask resolved itself in the process** — 1/2200 is ~1.86x more
  likely than the old 1/4096, landing almost exactly on "twice as likely," which was the more
  generous of the two readings flagged in v2. And the Misprint/Shadowless gap widened from ~3.7x to
  5x (200 packs vs. 1000) in the same pass, addressing the "too close" concern without needing to
  reach for 1/25000+. Both prior open questions are settled by this table.

### Ideas raised, not yet adopted

- **A curated escalating alt-art tier** (Trevor's read on TCG Pocket's approach: pick specific
  cards, give them an extra "special-er" rarer version). Genuinely interesting, but it doesn't
  compose the way the axes above do — those are each "one flag, apply the roll to any card,
  done"; this needs someone to actually choose and tag specific cards, which is real per-card
  design labor, not a system. Both agreed 8 Aug: shelve for a later job rather than fold into
  Job 5's first pass — it's a genuinely different shape and risks becoming bloat next to systems
  that are already committed.
- **Opponent cards getting the same treatment.** Trevor wants Shiny/Shadowless/etc. rolled for
  opponent cards too, not just the player's pulls. **Agreed 8 Aug: start with the lightweight
  version** — roll it live at play time, purely cosmetic, no persistence, same render function on
  both sides of the board. A deeper version (Job-7 named opponents with their own persistent pulled
  collections) stays possible later, but only after the lightweight version is proven out.

### Misprint — adopted, visual direction still open

Adopted 8 Aug as the rarest tier (see table above). Two visual directions on the table, not
mutually exclusive:

- **Period-accurate:** a skewed border/crop, echoing genuine WotC-era off-center miscuts — a real,
  famous collector chase item from exactly this era, just gamifying what was originally a factory
  accident.
- **Trevor's addition, and the stronger pitch:** render it as a **digital-error joke** instead —
  text overflowing the textbox, artwork at the wrong aspect ratio, a wrong-color energy symbol.
  Funnier, cheaper (still just CSS), and fits this collection's sense of humor better than a
  straight period recreation would.

Given how rarely a save will ever see one, worth having **2–3 distinct glitch flavors it can
randomly pick between** rather than one fixed treatment — a Misprint sighting should feel like a
fresh joke each time, not "oh, the misprint effect again."

### Promo / Southern Islands intrusion

A small chance (see table above — 1%) that a Common slot in an otherwise-normal pack gets replaced
by a promo or Southern Islands card instead — "every once in a while a promo Mewtwo jumps into your
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
3. **Misprint's visual direction.** Period-accurate skewed crop, digital-glitch joke, or (leaning
   this way) a rotating pool of several glitch flavors — see the Misprint section above.
4. **Curated alt-art tier — timing, if ever.** Shelved as not composing cleanly with the rest;
   worth a firm yes/no/later at some point so it doesn't linger as a vague someday-idea.
5. **Every number in the placeholder table is exactly that — a placeholder.** All of it (including
   the 2:1 holo ratio and ≥2 Energy floor from earlier sections) is a starting point to build
   against and feel out once packs actually run, not a tuned value. (Resolved as of the v3 pass:
   Shadowless's "50% better odds" and the Misprint/Shadowless gap — see the v3 table above.)

## Sources

- [Booster pack (TCG) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Booster_pack_(TCG))
- [The Ultimate Pokemon Base Set Guide — Poke Master Center](https://www.pokemastercenter.com/pokemon-base-set-guide/)
- [Pulling rare cards (holo, shadowless, 1st edition) wotc odds — Elite Fourum](https://www.elitefourum.com/t/pulling-rare-cards-holo-shadowless-1st-edition-wotc-odds/33900)
- [Identifying Early Pokémon Cards — Relentless Dragon](https://relentlessdragon.com/pokemon-card-game/identifying-early-pokemon-cards/)
- `data/raw/*.json` (the `pokemon-tcg-data` corpus already in this repo) — ground truth for every
  count in Part 1's tables, cross-checked live 7 Aug 2026 rather than trusted from memory

## Credits

- **Sonnet 5** (Claude Code, 7-9 Aug 2026) — this document, researched, refined and written during a parallel
  Job 4g session at Trevor's request, as well as collaborative decision-making with Trevor. This instance kept a turn log, which can be found at \Turn Logs\Packs Turn Log.txt
- **Opus 5** (Claude Code, 9 Aug 2026) — Job 5b. Built `src/packs.js` and `tools/packtest.js`,
  verified every row of the v3 table against 200,000 packs, corrected the Reverse Holo slot count
  from 7 to 10 in the prose, and measured the set-completion pacing the table never implied.
- **Opus 5** (Claude Code, 9 Aug 2026) — Job 5 opening pass over Part 1. Re-queried all 14 sets and
  found there was never an unnumbered Energy pool or a cutover to hunt for; found that every `base1`
  scan is 1st Edition Shadowless, which forced the additive/print-run split and the rule that a pack
  reveal can't be the scan alone; caught that Jungle and Fossil print no Energy for the ≥2 floor to
  draw on. Part 2's rendering section is Trevor's direction from the same day.


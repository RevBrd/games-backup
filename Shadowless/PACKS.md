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
| Reverse Holo | yes | each of the 7 Common/Uncommon slots | **1/70** | ~10 | ~5 |
| Promo/SI intrusion | yes | whole pack, **adds** a 9th card | 1/100 | ~100 | ~50 |
| Shiny | yes | each of 8 slots | **1/320** | ~40 | ~20 |
| Shadowless | yes | each of 8 slots | **1/1600** | ~200 | ~100 |
| Misprint | yes | each of 8 slots | **1/8000** | ~1000 | ~500 |

**The four per-slot odds were RETUNED on 1 Sep 2026 (Job 15b) and the pacing is back where it was
before the pack shrank.** They roll per SLOT, so the 25 Aug drop from eleven cards to eight thinned
all four without anybody touching a value — Reverse Holo from 1-in-9.9 packs to 1-in-14.3, Shiny 39.3
to 55.5, Shadowless 200 to 264, Misprint 897 to 1183. Each is now scaled by the slots it lost:
**Reverse Holo by 10/7** (it rolls on the non-Rare slots, ten before and seven now) and the other
three **by 11/8**, rounded to a clean denominator.

**Do not eyeball a per-slot odd against a per-pack rate.** They look alike written down, and that is
exactly how this drifted unnoticed for a week — the table above carries both columns for that reason.

Design targets are **10.4 / 40.4 / 200 / 1000**, and the ~5x ladder came out *tighter* than before as
a side effect of choosing round denominators rather than as the goal. Extend at 5x if a fifth tier is
wanted. **The measured figures are in one place only** — the three-column table under *Which promos
can actually intrude* — because three copies of four numbers in one file is three things to update
and two of them will be forgotten.

**Set-completion pacing did not move**, because not one of these four is a rarity: still a median 156
packs and ~78 wins for all of Base Set.

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

### The queued gate removal, and why the thing it was answering does not happen

**Trevor asked for the gates to be removed on 1 Sep 2026**, after Challenge 1 shipped: *"I actually
didn't realize the promo cards were gated until they were in a CPU deck. We're going to have to
remove that gate for them at some point, though it doesn't have to be now."*

**The stated trigger was an asymmetry, and the asymmetry does not exist. Measured 2 Sep 2026.** The
worry was that an authored deck may name a promo freely, so the player meets a card across the table
that the gate says they cannot own. Only **five** promos are named by any authored deck, all five in
Challenge 1 — and every one of them is gated on a bracket that opens *before* Challenge 1 does:

| Promo | Gate | Fielded by | Ownable when you meet it? |
|---|---|---|---|
| `basep-1` Pikachu | `base1` | Challenge 1, Lightning | **yes** |
| `basep-12` Mewtwo | `base2` | Challenge 1, Psychic | **yes** |
| `basep-11` Eevee | `base3` | Challenge 1, Lightning | **yes** |
| `basep-14` Mewtwo | `base3` | Challenge 1, Psychic | **yes** |
| `basep-26` Pikachu | `base3` | Challenge 1, Lightning | **yes** |

Challenge 1 sits after Fossil, so `base1`, `base2` and `base3` are all open before you can sit down
against any of these decks. **Nobody is shown a card they are barred from.** That is the gate order
working rather than a coincidence, and it is worth knowing before anyone reopens this.

**So it is a decision waiting on a different reason, not queued work.** The gates may still be wrong
on their own merits — a drip nobody notices is arguably not worth the mechanism — but **ask before
acting**, because the request admits two readings and they are different jobs: drop `PROMO_GATES`
entirely, or keep it and open specific gates. **The mechanism is worth keeping either way**, since
seven promos are gated against brackets that do not exist and that half was never the complaint.

**The observation underneath the request was true and had a different cause.** Trevor had opened 164
packs and pulled no promo — not the gates, and not luck. **Job 13b, which made the intrusion roll
fire at all, landed 27 Aug 2026, the same day his newest export was written**, so nearly every pack
in that save was opened while the roll was dead code.
*[The roll that had never fired →](HISTORY-ARCHIVE-2.md)*

**Twenty-eight of the fifty-three promos carry a gate and twenty-one resolve today.** The other
seven name `challenge2`, `gym1` or `gym2` — brackets that do not exist — and they **fail closed**,
which is the safe direction.
*(This read "seventeen" and "the other eleven" until 2 Sep 2026, and `CLAUDE.md` agreed with it. Both
were correct until Challenge 1 opened on 1 Sep and turned four on, which `PROGRESSION.md` recorded
and neither of the other two heard about. **The gate table is derived and checkable in one command;
the three prose copies of its answer were not.**)* Each turns on with no code change the day a ladder
bracket carries that key. The twenty-five promos with no gate at all are the unscripted half of
`basep`, and a second test keeps them out independently: the eligible pool is filtered by *has an
effect script* as well as by gate, so CLAUDE.md's "no collecting a card you cannot play" holds for a
set that is deliberately half-built.

**Verified at 200,000 packs after the 1 Sep 2026 retune, and this table is the only copy in the
file.** The ~5x ladder sits at 4.03x / 4.80x / 4.90x. **Three sets of numbers exist for this pack and
confusing them is easy**, so all three are here rather than one being quoted loose:

| | 11-card pack | 8-card pack, pre-retune | 8-card pack, now |
|---|---|---|---|
| Holo | 1-in-3.0 | 1-in-3.0 | 1-in-3.0 |
| 1st Edition | 1-in-20.1 | 1-in-20.1 | 1-in-20.1 |
| Reverse Holo | 1-in-9.9 | 1-in-14.3 | **1-in-10.0** |
| Shiny | 1-in-39.3 | 1-in-55.5 | **1-in-40.5** |
| Shadowless | 1-in-200.2 | 1-in-264.2 | **1-in-194** |
| Misprint | 1-in-897 | 1-in-1183.4 | **1-in-952** |

The middle column is the accident and the outer two are the intent. Holo and 1st Edition never moved
because they are not per-slot rolls.

### The Challenge pack

**A pack that is not a set — built 1 Sep 2026, Job 15a**, as the reward for the Challenge 1 bracket.
It is the first thing in the game to make "pack type" and "set" different words, and everything
awkward about it comes from that one fact.

| | |
|---|---|
| Save key | `challenge1` — the bracket's own key, not a set code |
| Pool | the union of every booster set **before** the bracket: Base, Jungle, Fossil |
| Shape | identical — 1 Rare + 2 Uncommon + 5 Common, same intrusion roll, same cosmetics |
| Odds | **4x the standard rarity-jump rate, and nothing else.** See below |
| Energy | no floor; drawn at the union's own share of **8.6%**, against Base Set's 15.8% |
| Called | "Challenge 1" — which is not what the *bracket* is called |

**The pool is derived from ladder position, not from the save**, which is the one design decision in
here worth arguing about and it was settled the right way. A C1 pack holds Base, Jungle and Fossil on
a brand-new save and on a completed one; you can know what is in it before you open it. The
alternative — build the union from the sets the player has currently unlocked — is what this file
proposed for three weeks and it is subtly broken: it would make a pack's contents depend on *when you
got round to opening it*. *[The field, and the four questions `bracket.set` was answering
→](PROGRESSION.md)*

**It costs nothing when there is no Challenge bracket.** `buildPools(db, [...])` is the only new
capability in `packs.js`; an ordinary booster still calls `buildPools(db, 'base1')` down exactly the
path it always did, and the memo keys the two forms apart so a union and a single set can never be
served each other's pool.

**What makes it richer: 4x the jump, and only the jump.** Trevor's proposal, 1 Sep 2026, taken as
written. `PACK_ODDS_BY_KIND.challenge1` multiplies the three bonus rare-tier jump chances by four and
leaves every other number alone — same shape, same guaranteed Rare with the same 2:1 holo split, same
cosmetic axes, same intrusion roll. Measured at 40,000 packs a side against an ordinary Fossil pack:

| | Challenge pack | ordinary pack |
|---|---|---|
| Packs with a bonus Rare-tier card | **25.9%** | 6.9% |
| Rare-tier cards per pack | **1.281** | 1.070 |

So roughly one Challenge pack in four has a second Rare in it, which is what "better cards, any set"
buys. **The lever is the jump because the jump is the mechanism that already means *sometimes you just
get more*** — a Challenge pack is an ordinary pack with an existing surprise turned up, rather than a
second system a player has to learn, and it is one number to revisit.

**AND IT SIDESTEPS THE SPILLOVER THIS FILE WARNED ABOUT.** The warning was that richer rarity odds
compound with the cosmetic rolls, so a Challenge pack would quietly become the best place in the game
to pull a Shadowless — arriving as a side effect nobody chose. **The jump does not do that**, and it
is measured rather than argued: Shiny, Shadowless and Misprint roll per slot regardless of what tier
the card resolved to, so they came out at 201 against 199 in 40,000 packs a side. Reverse Holo went
*down* by 4.5%, because a jumped card is Rare-tier and therefore ineligible for it.

**That is a property of this lever and not of the pack**, so it is asserted in `packtest.js` rather
than trusted: swap the jump for a holo-rate bump and the Shadowless assertion goes red. Trevor's
instinct picked the one lever with no cosmetic spillover, which is worth knowing before anybody
"improves" it.

**A promo can still intrude into one**, on the same 1-in-100 as anywhere else, drawn from the same
gate-filtered pool. Nothing about a Challenge pack changes the intrusion, and the union deliberately
excludes `NON_BOOSTER_SETS` so a promo can never arrive through the *pool* — which would have made it
a Common rather than a bonus ninth card.

**Four promos turned on with the bracket and not with the pack.** `basep-13`, `-15`, `-25` and `-28`
are gated `challenge1`, so they became intrudable into *every* pack the moment the bracket opened.
That is the per-card gate doing its job and it needed no code. *[The gates →](PROGRESSION.md)*

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

~~**The target the shipped numbers hit: a bonus Rare-tier card beats Reverse Holo's own per-pack
frequency.**~~ **THAT ORDERING IS RETIRED — 1 Sep 2026, Job 15b — and the three constants are
unchanged.** Restoring Reverse Holo above moves it from ~6.8% of packs to ~9.5%, which puts it above
the bonus-rare-tier rate in every set rather than only in Base Set, and inverts an ordering this file
used to say was the thing to preserve.

**The rule was the part that was wrong, and it is worth saying why rather than just deleting it.** It
was written while Reverse Holo was sitting 44% below its own design intent, so it was anchored to a
number that was itself broken by an unrelated change. And on the merits the inversion is the better
arrangement: a Reverse Holo is cosmetic, a bonus Rare is real value, and the more valuable surprise
being the rarer one is what anybody would pick if they were picking.

**The alternative was measured and rejected.** Chasing the restored Reverse Holo needs
`jumpUncommonToRare` at ~0.054, which makes Rares about 55% more common from jumps alone and
accelerates set completion — and this file's own pacing section says ~78 wins per set is already a
good length. **Not a tuning detail: it is one line either way and it changes the economy**, so
disagree out loud rather than quietly.

The 3% → 3.3% nudge that chased the old goal is left in place. It is now doing nothing in particular,
which is a fine reason to leave a number alone. *[The three tuning drafts →](HISTORY.md)*

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

**That run covered a quarter of the live content and one RNG stream, and both gaps are closed —
24 Aug 2026.** Trevor reported Shiny and 1st Edition feeling too frequent, twice; neither gap could
have been seen by making the run bigger, because one was *which set* it opened and the other was that
it reused a single stream where the game builds a fresh one per pack. Both were measured clean, and
`packtest.js` now sweeps every live set and the fresh-RNG path. **So the odds are right, and saying so
is a result rather than a formality.** *[Both gaps in full, and the deterministic flake found while
closing them →](MISREADINGS.md)*

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

**One item, and it is small.** Everything else this list held has shipped; the bodies moved to
[HISTORY-ARCHIVE-2.md](HISTORY-ARCHIVE-2.md) on 2 Sep 2026 rather than being deleted, because each
records what a prediction got right and wrong and one of them caught a latent bug.

1. **Southern Islands' fixed distribution vs. our intrusion model.** SI was a real boxed set with
   guaranteed contents, not a randomised pack, so folding 18 fixed cards into a probabilistic
   intrusion chance is itself an invented mechanic wearing a real set's name. Flagged rather than
   let ride on the promo idea by association.

**And one consequence that is not a decision.** A Challenge pack has no Energy floor and draws at the
union's 8.6% against Base Set's 15.8%, so most contain no Energy at all. Defensible for a reward pack
rather than a faucet, and recorded here so nobody rediscovers it as a fault.

### What closed, and where the reasoning went

| Item | Outcome | Reasoning |
|---|---|---|
| Progression-gating the intrusion pool | **Built**, Job 13b — and gated per *card*, further than the item asked. It also turned up that **the intrusion roll had never fired in the shipped game** | [archive](HISTORY-ARCHIVE-2.md) |
| The Challenge pack | **Built**, Job 15a. Its spec was **wrong in a way that would have shipped** — the pool was specified as save state read at open time | [archive](HISTORY-ARCHIVE-2.md) · [PROGRESSION.md](PROGRESSION.md) |
| Restoring the four cosmetic axes' pacing | **Done**, Job 15b. The deferral reasoning was right and cost nothing | [archive](HISTORY-ARCHIVE-2.md) |
| Base Set's bonus-Rare-tier near-tie | **Dissolved** rather than fixed — the comparison moved and the residual is 0.2 points | [archive](HISTORY-ARCHIVE-2.md) |
| What "richer" means for a Challenge pack | **Answered**, Job 15b: 4x the rarity jump, the one lever with no cosmetic spillover | [archive](HISTORY-ARCHIVE-2.md) |


## Sources

- [Booster pack (TCG) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Booster_pack_(TCG))
- [The Ultimate Pokemon Base Set Guide — Poke Master Center](https://www.pokemastercenter.com/pokemon-base-set-guide/)
- [Pulling rare cards (holo, shadowless, 1st edition) wotc odds — Elite Fourum](https://www.elitefourum.com/t/pulling-rare-cards-holo-shadowless-1st-edition-wotc-odds/33900)
- [Identifying Early Pokémon Cards — Relentless Dragon](https://relentlessdragon.com/pokemon-card-game/identifying-early-pokemon-cards/)
- `data/raw/*.json` — ground truth for every count above, cross-checked live rather than recalled

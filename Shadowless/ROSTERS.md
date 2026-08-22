# Shadowless — the built rosters, measured

What `tools/decksim.js` actually says when a roster meets itself. [OPPONENTS.md](OPPONENTS.md) is the
**spec** — what a tier is, what a rung has to specify, what the player must bring. This file is the
**report card**: the standings, the assembly rates, and the per-deck numbers behind every claim that
file makes about whether the spec survived contact.

Read it when you are about to build a roster and want to know how the last one went, when a
`decksim.js` run disagrees with the spec, or when you are tempted to move a tier's Prize count. You
need none of it to *write* a rung.

Split out of `OPPONENTS.md` on 19 Aug 2026. The seam is that a session authoring the Jungle roster
wants the spec and the *lessons*, and does not want 630-games-per-deck standings on the way — but the
session arguing with the spec needs exactly those. Both halves are load-bearing and neither wants to
read the other. See [MAINTENANCE.md](MAINTENANCE.md).

**One section per roster, appended as each is built.** The lesson goes back into `OPPONENTS.md` as a
claim with a link; the evidence stays here.

**Every figure carries the date it was measured and the AI it was measured with.** Deck strength
moves whenever the AI moves — [MEASUREMENT.md](MEASUREMENT.md) has the standing version of that
warning — so a row without a date is not a fact, it is a memory. Re-run the sim rather than quoting
these.

```bash
node tools/decksim.js 45 6 data/base1_decks.json     # the run that produced everything below
```

## Base Set — Trevor's eight decks, 18 Aug 2026

**Live on the ladder since 19 Aug 2026.** Everything below was measured a day before the decks were
wired in, against `data/base1_decks.json` directly — which is what `decksim.js` still reads, so the
figures remain reproducible exactly as printed.

Eight decks, verified against `Engine.prototype.validateDeck` — all 60 cards, 4-copy clean, every
card implemented, and between them they use all 69 distinct Base Set Pokemon. Five T2, two T3, one
T4.

### The recipe the decks were built to

**Five axes separate the tiers monotonically, and only the first was authored deliberately:**

| | T2 (five decks) | T3 (two) | T4 (one) |
|---|---|---|---|
| Feature weight (Trevor's own scoring) | 7 – 7.5 | 10 – 10.5 | 12.5 |
| Draw + search cards | 3 – 5 | 6 – 7 | 8 |
| Rare Trainers | 1 | 2 – 3 | 3 |
| Basic Energy | 28 | 25 – 26 | 25 |
| Basic Pokemon | 15 – 16 | 12 – 13 | 13 |

**Read this as a RECIPE, not as evidence.** The first version of this table called the four lower
rows independent confirmation of the top one; that was wrong and Trevor corrected it — he was tracking
all five while building, so they agree by construction. It is still the most useful table in this
file, but for a different reason: it is **what to aim at when building a roster**, not proof that the
tiers mean anything on their own. Higher tiers run *less* Energy and *more* Trainers — **consistency,
not power, is what climbs.**

### What the sim said

630 games per deck, 6 Prizes, expert on both sides:

| Tier | Field win rate | Range |
|---|---|---|
| T3 (two decks) | **65.1%** | 61.0 – 69.2 |
| T2 (five decks) | **45.2%** | 38.1 – 53.5 |
| T4 (one deck) | **42.4%** | — |

**The T2/T3 boundary is real — the bands do not overlap.** That was the first externally-verified
claim the spec ever had, and it says the tier vocabulary describes something a player will actually
feel.

**The T4 boundary is not.** The boss sits *inside* the T2 band and finishes sixth of eight, below
four of the five decks it is supposed to cap. The sim says why: its Charizard lands in 45% of games at
a median of turn 17, and the deck underneath is Chansey and Ninetales doing ordinary work — so it is a
fast deck wearing a slow deck's clothes, and the 6-Prize length it was assigned is the one that hurts
it most (54.3% at 4 Prizes, 42.4% at 6). **Weakness matters too: it is a Fire deck in a field whose
two strongest decks are Water.**

**Part of it was an AI bug and it is fixed: the bot could not see that a Double Colorless becomes Fire
on a Charizard**, so the deck's four DCE were dead cards. That was worth **+2.4 points** (42.4 → 44.8)
and moved no other deck, since no other deck runs DCE. See [AI.md](AI.md). **It is not the whole gap** —
the boss is still fifth of eight and below both T3s, so the deck itself is the remaining question.

Two readings, and they are not exclusive: the boss needs rebuilding toward what it actually does, or
T4 should not be the longest game on the ladder. **Do not "fix" this by weakening the T3 decks** —
they are the part that works.

**Within-tier spread is the other finding: T2 runs 38.1 to 53.5**, a 15-point spread on rungs meant to
be interchangeable. The bottom two are the Psychic/Fire and Water/Psychic decks.

### What the Prize count is worth, measured

The spec calls the Prize count an archetype selector rather than a difficulty dial. **That is right at
one end and wrong at the other.**

| Change | Effect |
|---|---|
| 2 → 4 Prizes | **+10.7 points** to the Grass T3 deck — the short end of the claim holds exactly as written |
| 4 → 6 Prizes | **nothing** to any deck measured. The effect saturates by four |
| 4 → 6 Prizes, T4 | **−11.9 points**. It runs backwards |

So the spec's 6 for both T3 and T4 is one length too long, and assigning T4 the *longest* games is the
part with evidence against it. **It is kept in the spec's table anyway, because changing it moves
every deck** and no roster has been rebuilt against the finding yet.

**And the spread has a design reason that measurement cannot see.** Trevor, 18 Aug: 6 Prizes is the
*full* count, and giving it to the top tiers is partly about how the rung reads — the powered-up
Blastoise gets to ride a little longer, a comeback has room to happen, and 4 is deliberately a
slightly gated experience rather than a shorter one. **The measured flatness of 4 → 6 is an argument
that it costs nothing, not that it does nothing.** Weigh both before changing the table.

## Jungle — Trevor's five decks, 21 Aug 2026

**Live on the ladder the same day.** Three T2, one T3, one T4, joining the two authentic Jungle theme
decks as the T1 intro. All five validate clean and — unlike `jungle_decks.json` — **every id in the
workbook was already correct**, checked mechanically with accents and the NH/B2 suffixes normalised
away. Zero corrections.

```bash
node tools/decksim.js 45 6 data/base2_decks.json                          # the roster alone
node tools/decksim.js 30 6 data/base1_decks.json data/base2_decks.json    # against Base Set's eight
```

**`decksim.js` takes more than one file as of this roster, and the two runs answer different
questions.** A five-deck field is small enough that one deck's type coverage can carry it, so the
roster alone cannot tell "this deck is strong" from "this deck is Fire in a field of Grass". Merging
the two rosters is the question a second bracket creates and it is the one worth quoting.

### The recipe

| | T2 (three decks) | T3 (one) | T4 (one) |
|---|---|---|---|
| Feature weight | 9 | 12 | 16 |
| Draw + search cards | 4 – 6 | 5 | 8 |
| Rare Trainers | 1 | 2 | 4 |
| Basic Energy | 24 – 28 | 20 | 23 |
| Basic Pokemon | 15 | 13 | 12 |
| Trainers | 10 – 11 | 14 | 14 |

**The Energy-down, Trainers-up shape holds exactly as Base Set's did**, which is the one part of the
recipe that has now repeated across two independently built rosters.

**One row does not, and it is the row the T3 loses on.** `b2_t3_colorless` runs **five** draw-and-search
cards against the Eevee T2's **six** — the only place in either roster where a lower tier is better
supplied than the tier above it. Base Set's two T3s ran 6 and 7 against a T2 band of 3 to 4. Given the
standings below, that is the most likely single cause and it is one card wide.

*(Counted with one definition across both files — Bill, Professor Oak, Computer Search, Pokémon
Trader, Poké Ball, Pokédex, Gambler, Item Finder, Imposter Professor Oak, Pokémon Breeder — and
"Basic Energy" excludes Double Colorless. Base Set's table above predates that definition and counts
its T4 slightly differently; the two tables agree on shape, not on every cell.)*

**The feature weights are on a different scale and that is not drift.** Base Set ran 7–7.5 / 10–10.5 /
12.5; Jungle runs 9 / 12 / 16. Trevor, 21 Aug: Jungle simply had more weight to distribute, because
Base Set opened evolution lines that Jungle finishes, and the five decks are scaled **relative to each
other** rather than to the previous eight. **So never compare a featureWeight across rosters** — it is
an ordering within one workbook, not a unit. (The figure is now stored per deck in both files;
`base1_decks.json` was backfilled from its workbook the same day, because its own `_meta` had been
describing a field that was not there.)

### What the sim said, in the merged field

13 decks, 30 seeds × both seats per ordered pair, 6 Prizes, expert both sides:

| | Field win rate | Range |
|---|---|---|
| base1 — Trevor's eight | **51.7%** | 38.3 – 68.9 |
| base2 — Trevor's five | **47.2%** | 31.7 – 64.0 |

| Tier | Merged | Range |
|---|---|---|
| T3 (three decks) | 56.4% | 39.0 – 68.9 |
| T2 (eight decks) | 48.4% | 31.7 – 64.0 |
| T4 (two decks) | 46.5% | 46.1 – 46.9 |

**Three findings, and the first is the one that matters.**

**The Jungle roster does not order by tier, and it is not close.** Its T2 Eevee deck finishes
**second of thirteen at 64.0%**, above every deck on the ladder except one Base Set T3 — while its T3
finishes eleventh at 39.0% and its T4 ninth at 46.1%. The Base Set roster's T2/T3 boundary is the one
externally-verified claim `OPPONENTS.md` has; **this roster does not reproduce it.**

**The gate is the problem child, and the centrepiece column says why.** `b2_t3_colorless` lands its
Pidgeot in 45% of games at a **median of turn 29**, in a field whose games are decided around turn 20.
It runs a 4/3/1 Pidgey line and a 3/2/1 Caterpie line — two three-card Stage 2 chains, one copy each
at the top. That is a construction fact rather than an AI fact, and it is the same diagnosis Base
Set's T4 Charizard got: *a slow deck's clothes on a deck that never gets there.*

**The T4 does exactly what it was built to do and still finishes ninth.** Vileplume lands in **78% of
games at a median of turn 16** — the best assembly rate in the whole thirteen-deck field, better than
any Base Set deck. So Status Lock arrives, reliably and on time, and converts to 46.1%. That is the
more interesting half of this run: it is not a consistency failure, so either the pressure is worth
less than it looks or the bot does not know how to press it once it has it. **Nobody has measured
which**, and it is a better question than "rebalance the deck".

**Two cautions before anyone acts on the above.** Every deck was run at 6 Prizes, which is the T3/T4
length and not the T2 one — the spec's own measured finding is that 2 → 4 Prizes is worth +10.7 to a
T3 and 4 → 6 is worth nothing, so the T2 decks are being played at a length that suits them. And
`decksim` is a **round robin**, which the ladder is not: these decks never meet each other in play,
only the player's deck. The instrument measures relative strength, which is exactly what a tier claim
is — but it is not a claim about how the bracket feels.

**Nothing here was acted on**, and on 21 Aug 2026 Trevor made that a decision rather than a default:
*"Let's leave the decks where they are until our test games can be refined a bit more, not because
they're wrong but because we can't know if they're right."* Which is the correct read of this whole
file. `OPPONENTS.md`'s standing warning applies in both directions: do not "fix" a roster because a
round robin ranked it.

### The reason to distrust every standing above, and it is not sample size

**The instrument runs the same AI on both sides.** So it can rank decks against each other and it can
never say the whole field is being played badly — which, as of 21 Aug 2026, we know it is. Trevor:
`b1_t4_fire` is essentially the deck he won the Base Set bracket with himself, it is still winning for
him against the newer opponents, and in here it finished **eighth of thirteen**.

That single fact reframes most of this page. **The Jungle T4's 78%-assembly-and-46%-conversion is
probably not a deck finding**, and neither is Base Set's T4 sitting in the T2 band. Both are what a
badly-piloted good deck looks like. Three AI changes the same day moved it to **sixth at 52.8%** — two
retreat repricings worth a rank between them, and then the pair of Charizard fixes worth **+5.3 points
on their own**. Every figure on this page predates all three.

*[The benchmark, what it is for, and why its rank is an AI metric →](MEASUREMENT.md)*

### How to read a run of this

**Read the centrepiece columns beside the standings — they usually explain them.** A Stage 2 that
lands in 45% of games at a median of turn 17, in a game decided by turn 20, is not a centrepiece, and
that single column is what diagnosed the T4 above.

**A tier boundary is real when the tier bands do not overlap.** That is the whole verdict this
instrument delivers; it is not pass/fail and it never says a deck is *good*.

**Both seats, same seeds, or the number is worthless.** Seat correlates with a deterministic opening
flip — `aiduel.js` shipped unmirrored for an hour and reported a six-point edge for a change that did
not exist. *[Every other way this project's measurements have lied →](MEASUREMENT.md)*

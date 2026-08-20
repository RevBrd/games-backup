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

### How to read a run of this

**Read the centrepiece columns beside the standings — they usually explain them.** A Stage 2 that
lands in 45% of games at a median of turn 17, in a game decided by turn 20, is not a centrepiece, and
that single column is what diagnosed the T4 above.

**A tier boundary is real when the tier bands do not overlap.** That is the whole verdict this
instrument delivers; it is not pass/fail and it never says a deck is *good*.

**Both seats, same seeds, or the number is worthless.** Seat correlates with a deterministic opening
flip — `aiduel.js` shipped unmirrored for an hour and reported a six-point edge for a change that did
not exist. *[Every other way this project's measurements have lied →](MEASUREMENT.md)*

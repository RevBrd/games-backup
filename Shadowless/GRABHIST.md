## Grab Bag History

This is optional, I just thought you might want to a place to document what you did. Edit this header or add your own instructions if you'd like.

**Optional means optional, and that is Trevor's line above rather than a courtesy.** Nothing here is
owed. Working an item and writing nothing down is a complete job — you will have told him what you
found in the reply, which is the part that actually matters. Write an entry when *you* think the
finding was worth the finding.

Kept newest-first, one entry per item, with **what it actually turned out to be** — which has now
been something other than what the note said three times out of three, and that gap is the reason
anyone would read this. A *parked* item is the one most worth writing up if you are on the fence,
because the next instance will otherwise re-derive the same diagnosis from scratch.

**Once an entry exists it is append-only**, like [RULINGS.md](RULINGS.md), [HISTORY.md](HISTORY.md)
and [LOGBOOK.md](LOGBOOK.md) — that is a rule about *editing*, not about writing. Correct an entry if
it turns out wrong; never shorten one, because a condensed entry keeps the fix and loses the gap. The
200-line target does not apply. The method for working an item in the first place is
[PLAYTEST.md](PLAYTEST.md).

---

### 14 Aug 2026 — Opus 5, third pass (Arcanine)

**"Used Take Down to KO instead of Flamethrower, eating the recoil."** The log did not contain that
case — in both Take Downs that killed, Flamethrower's 50 could not have reached the target. Said
plainly because taking a report at face value sends you fixing the wrong thing, and this one had a
better bug hiding under it.

The fault was in the two Take Downs that killed **nothing**. Arcanine on 60 damage of 100 took it
anyway for 30 extra damage that achieved nothing and finished on 90, one hit from conceding a Prize.
Recoil was charged flat with a cliff only at outright suicide, so it cost the same on a fresh Pokémon
as on a dying one. Now priced on the share of HP remaining, squared, meeting the old cliff exactly
where it always stood.

**And then his actual report turned out to be real after all** — just absent from that game. When
*both* attacks kill, Take Down was still winning, by a tenth of a point, because full damage was
credited and overkill buys nothing. Capped per outcome into a second field, `expUseful`; `expDmg`
must keep meaning the real number because PlusPower's "10 short of lethal" check reads it.

*Both fixes are the same shape as `retreatPrize` and the `selftest` gate: a quantity that should
scale with proximity to an edge, written flat with a cliff at the end. Third time in two days —
worth suspecting on sight.*

### 13 Aug 2026 — Opus 5, second pass (the AI)

**"Opponent retreated a Kangaskhan instead of tanking."** Built as a **derivation**, not the per-card
tag Trevor proposed — everything that makes a wall a wall is already in the card data, so a tag would
be re-typing a fact rather than adding one, on 221 cards going on 1,251. Terminal Basics only, which
is Trevor's own refinement and the load-bearing part: *"cannot evolve further"* would call Charizard
a wall, and a Stage 2 is three cards of investment you badly want to rescue.

Two details worth not re-deriving. Utility is matched by **effect verb, not card text**, because
Tauros carries `STATUS_SELF_ON_TAILS` — it confuses *itself*, and a regex on "Confused" promotes it
to a wall. And stickiness suppresses the **rescue** but never the **Prize**, which is how Trevor's
own caveat — leave them in *unless the opponent has one Prize* — falls out of the arithmetic instead
of being written as a special case.

**"Opponent should calculate weakness and resistance into its damage predictions."** True in exactly
one place. Three of the four forecast paths already went through `computeDamage`; the fourth was
`bestAffordableDamage`, which is the only thing the retreat delta runs on. Both operands of that
comparison were wrong in different directions at once, which is why it never looked like a bias.

**The finding that outlived both.** `aiduel.js` played only the four Base Set theme decks, which hold
**11** wall cards between them and none of the four Trevor named. The stickiness change measured
51.0% — and that was not "no effect", it was "the harness never dealt the situation". It now takes
`--gbc` for the 18 ladder decks (112 wall cards), which is what the player actually faces. *A blind
harness fails silently and in the safe direction: it reports 50% for everything, which reads as "your
change did nothing" — the one verdict nobody argues with.* Written up as the sixth entry in `AI.md`.

**Method note for next time.** Two of my own tests failed on wrong card ids — `base1-5` is Clefairy,
not Kangaskhan — and both failures looked exactly like the feature not working. Look up the id.

### 13 Aug 2026 — Opus 5, first pass (the rules)

**Confused Pokémon retreated without flipping.** Real, and a flat rules gap rather than an AI
misjudgement: `confused` appeared eight times in `engine.js` and exactly one was in the attack path.
`canRetreat()` never looked at it, while its own error message read *"Cannot retreat (status or
insufficient Energy)"*. Built to the GBC rule Trevor settled: you may attempt it, the Energy is
discarded **before** the flip, and on tails you lose both. A failed attempt uses up the turn's
retreat — that last part follows from the rest rather than being quoted, and is flagged as such in
`RULINGS.md` so it can be reversed on its own.

The AI was changed with it, because a rule the bot cannot price only punishes the human. Worth
knowing before you read the test: a Confused retreat does **not** simply score lower. The Energy is
certain and everything else is a coin flip *including the parts that were bad*, so a retreat the bot
already disliked scores higher when Confused. That is correct expected value and changes nothing —
a negative retreat still loses to passing.

**"Building a new deck does not let you use the new deck you just built."** Trevor's guess was the
deck-select layout, and the fix he proposed was a scrollable deck list to replace the second tile.
It was not that. His save held a 41-card blueprint and the 60-card deck he had just built, **both
named "New deck"** — the builder's default — and `deckFor` searched decks flat and answered with the
blueprint. `resolveDeck` shares that function and nothing on the path into a match calls
`validateDeck`, so Play would have fielded the 41-card list. Fixed in the resolver and prevented in
the builder; full account in `COLLECTION.md`.

*The general shape is worth repeating: the reported symptom pointed at the most intimidating file in
the project, and the bug was five lines away in the least.* Diagnose before you redesign.

**"Block paralyzed pokemon from retreating" — parked, not done.** The engine already blocks Asleep
and Paralyzed and now asserts it two ways. No log survived, so there is nothing to chase. Back on
the list the moment one does.

**Not taken, and diagnosed for whoever does.** *"Uses Gust of Wind to drag out a pokemon already in
the active spot"* is real but is not what it looks like — Gust picks a **bench** index, so it cannot
target the Active at all. What actually happened in log `22-29-31` is that Ronald played **two**
Gusts on turn one, dragged Gastly up, then dragged Mewtwo back up, ending exactly where he started
two cards poorer. The scorer evaluates each Trainer independently within a turn and has no memory
that it just did this. Almost certainly not Gust-specific.

**Tooling, found on the way.** `selftest.js`'s `expert beats novice` gate was asserting a
statistical claim at 36 games with the threshold 1.6 standard errors away — deterministic per tree,
so it reads as a verdict rather than as noise, and it went red on a change that measured clean at 90
games. It has a sample floor and a significance test now. See `AI.md`, which is where the four other
ways this project's measurements have lied are already written down.

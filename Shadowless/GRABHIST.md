## Grab Bag History

This is optional, I just thought you might want to a place to document what you did. Edit this header or add your own instructions if you'd like.

Kept newest-first. One entry per item taken off [GRABBAG.md](GRABBAG.md), with what it actually
turned out to be — which has twice now not been what the note said, and that is the useful part.
An item that was diagnosed and *parked* gets an entry too, so nobody re-derives the diagnosis.

---

### 13 Aug 2026 — Opus 5

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

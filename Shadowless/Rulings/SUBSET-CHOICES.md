# "As many as you want" — the decision shape, decided once

*Append-only, and exempt from the 200-line target like every entry in this folder. Correct it; never
condense it.*

**Settled 9 Sep 2026, Job 16 (Shadowless 40).** Four Gym Heroes Trainers were deliberately deferred
as a cluster rather than built one at a time, because they appeared to share a decision this engine
had no convention for. Three of them did. The fourth is written up here too, because finding out it
*didn't* is half of what the cluster was for.

## The cards

| Card | Text | Shape |
|---|---|---|
| **Secret Mission** (`gym1-118`) | Look at your opponent's hand. Then, you may **discard as many other cards as you want** and draw that many | subset of hand |
| **Blaine's Gamble** (`gym1-121`) | **Discard any number** of other cards, then flip a coin. If heads, draw twice that many | subset of hand |
| **Energy Flow** (`gym1-122`) | For each of your Pokémon, you may **return any number** of Energy cards attached to it to your hand | subset of the **board** |
| **Erika's Maids** (`gym1-109`) | **Trade 2** of the other cards in your hand for up to 2 Pokémon with Erika in their names | a **fixed** cost |

**Erika's Maids only looked like it belonged.** Its cost is exactly two, which makes it Computer
Search with a name filter — a shape shipped since Job 1. Three of the four shared something; the
fourth shared a *surface*. That distinction was worth an hour and would not have been visible from
inside any one of them.

## The rule

> **An "any number" choice with no `opts` supplied resolves to ZERO. The engine never throws a
> player's cards away on their behalf.**

This runs **against** the convention everywhere else in the file, and the difference is worth stating
precisely because a future reader will otherwise read it as an oversight:

| | the open question | so the fallback |
|---|---|---|
| `takeEnergy` | **which** Energy pays | picks the ones this Pokémon's attacks don't want |
| `T_DIG` (Misty's Wrath) | **which** two to keep | keeps the first two |
| `T_TRADE_FOR_NAMED` | **which** two to trade | takes the first two |
| **the subset three** | **whether** to do it at all | **nothing happens** |

Where the choice is *which*, something must happen and a deterministic pick is correct. Where the
choice is *whether*, the safe reading of an unanswered question is "you declined" — any other answer
has the engine spending cards nobody agreed to spend.

## The cost of that rule, and the guard

**A scorer that forgets to fill `a.opts` produces a card that is legal, offered, played, and inert.**
No exception, no refusal, nothing in the log. That is silent-failure surface **#5**, and it is worse
than the four before it precisely because the card *works*.

Two things hold it:

- **Arithmetic, per card.** Every subset scorer returns `-Infinity` on an empty chosen set, so the
  bot cannot play a card it has already decided will do nothing.
- **A source-text check in `selftest.js`**, watched going red naming the offending verb. Its
  weakness is that the verb list is hand-maintained, which is stated in `AI.md` item 18 rather than
  left to be discovered.

## The break-even line, which is the same for both cycle cards

**A card that trades a known card for an unknown one breaks even at the average value of a card in
your own deck.** `deckDrawValue` is that number: `cardKeepValue` summed over the deck's contents,
divided by its size. Discard everything in hand worth less than it.

**This reads the deck's CONTENTS and never its ORDER**, which is the line between knowing your own
decklist — which every real player does — and looking at the top card, which none of them may. A sum
over the whole pile is order-independent by construction, so the distinction is structural rather
than a promise in a comment.

**Secret Mission and Blaine's Gamble have identical expectation.** Half of twice as many is as many.
So the same threshold decides what to pitch for both, and the entire difference between the two cards
is variance — which is why the Gamble is priced as the same EV less a discount that *shrinks* as the
hand starves. A hand with nothing in it wants the coin; a hand doing fine does not. `powertest`
asserts the two agree on the contents of the hand, so a second opinion growing in one of them goes
red rather than going unnoticed.

## What is NOT modelled, named rather than discovered

**Energy Flow's best use is a slow one and the bot cannot see it.** Peeling Energy off a Pokémon you
have given up on, so it can go somewhere else two turns from now, needs a notion of *abandoning a
slot* that this bot does not have. What it can see is an Active about to be Knocked Out with no
attack worth making, so that is what it plays. The card is under-used rather than misused, which is
the right direction for a gap to point.

**Secret Mission's look is priced at nothing**, on the same reasoning as `Rulings/
PEEK-CLAIRVOYANCE.md`: a bot that reads full state learns nothing from being shown a hand. Against a
**human** opponent the card is therefore underrated by exactly the amount that information is worth
to a person — a real asymmetry, and the honest place to record it is here.

## What generalises

| Principle | Why it is here |
|---|---|
| **Where the open question is WHICH, pick for them; where it is WHETHER, do nothing.** One rule tells the two fallbacks apart | Four verbs in one file go opposite ways and both are right |
| **A card that is legal, played, and inert is worse than one that crashes.** Price the empty choice at `-Infinity` so the scorer cannot reach it | The bot would otherwise spend a card on nothing, forever, silently |
| **A known card trades against the average of your own deck** — and reading a deck's contents is not reading its order | The break-even line for every cycle card in the era |
| **Deferring a cluster is worth it even when the cluster turns out not to be one** | Three shared a shape; Erika's Maids shared a surface, and only building them together showed which |

# 3 Sep 2026 — a card's wall-ness rises as its evolution stops being live

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `roadLive`, `wallHere`, `wallShape`, `W.wallRoadInDeck`

---

**`wallScore` → `wallHere`** · Job 15e · Trevor's Rhyhorn note, and the GBC 2 observation that
independently matched it.

**The invariant: what a card is FOR is partly a question about the board, and being a wall is the
first place that bites.** `roadLive(pi, slot)` answers *how live is this slot's evolution road*, in
three states, and wall-ness is scaled by `1 - roadLive`.

| state | value | reading |
|---|---|---|
| evolution **in hand** | 1 | a certainty this turn — not a wall at all |
| evolution **in deck** | `W.wallRoadInDeck` (0.5) | a hope, and the card is standing there now |
| **nowhere** | 0 | discarded, in play or prized: the road is over — full wall-ness |

## Two sources that did not know about each other

Trevor's workbook note predates his first session with the Japan-only sequel. The sequel's bot then
did the thing the note describes.

> **workbook** — *"Leer is the primary as it turns Rhyhorn into a very good staller. Horn Attack
> should only be powered up **if it's planning to evolve**, but takes over the primary position once
> powered."*
>
> **GRABBAG, from GBC 2** — *"Rhyhorn… brought in just to use Leer as long as it can and be thrown
> away, on purpose, because the AI needed to buy time for the bench, never powering up Horn Attack."*

**The conditional in the workbook note is the rule.** Rhyhorn is a wall exactly when Rhydon is not
coming — and that is a fact about the board, which `wallScore` was structurally unable to ask because
it is memoised as a property of the card.

## The old gate is derived, not removed

`wallScore` refused every Basic that has an evolution. **A terminal Basic is now simply a card whose
road is permanently dead** — nothing evolves from it, so `roadLive` is 0 and `wallHere` returns
exactly what `wallScore` returned.

**That equivalence is asserted over the whole pool in `powertest.js`, to machine precision**, and it
was watched going red before being trusted. It is what makes this a generalisation rather than a
replacement. `wallScore` itself is untouched and still exported: it is the card property, it is what
`powertest`'s stickiness wing pins, and one of the two has to stay answerable with no game in
progress.

**The Stage-2 protection moved somewhere nothing here can relax it.** The recorded reason for
terminal-only was that *"cannot evolve further" would call Charizard a wall* — but `stage === 'Basic'`
already excludes Charizard, and that condition now lives in `wallShape`. **The written reason did not
actually justify the rule it was attached to**, and the rule was still right; what the evolution half
was really buying is that a Squirtle you mean to evolve is not disposable. *Check whether a
documented reason reaches the code it justifies — the rule surviving does not mean the reason did.*

## What it measured, and it is broader than the story

**`abtest.js 8 HEAD --pairs 400` — 3,200 games a side: 26.5% ± 1.5 diverged, median first difference
at action 46. Win rate 49.4% → 48.6%, flat inside a ±1.7 interval.**

**Read the 26.5% as the honest correction to the Rhyhorn framing.** This does not touch one card. It
gives a small wall-ness to **every non-terminal Basic whose evolution is not in hand** — Squirtle at
0.15, Machop at 0.10 — and one meaningful case, Rhyhorn at 0.70 falling to 0.35 with a Rhydon still
in the deck. The broad nudge is most of the divergence.

**And for the one card that scores meaningfully, the decision does not flip.** Rhyhorn's retreat cost
is **3**, which is a −21 fixed penalty before any of this is consulted, so retreating it was already
refused on every board probed. Wall-ness moved the *price* — −13.50 with Rhydon in hand, −15.43 in
deck, −17.35 nowhere, monotone as designed — and not the *choice*. **The behavioural payoff on this
card today is smaller than the mechanism**, which is stated here rather than left for somebody to
discover after quoting the invariant.

## What is a guess, and what is not

**Only the middle state.** In-hand and nowhere are facts; `wallRoadInDeck: 0.5` is an unmeasured
first guess at what a hope is worth against a certainty. **The claim rows assert the ORDERING rather
than the value**, so a retune does not touch them.

**Reading our own deck is legitimate**, and `ai.js` already did it in five places — a player knows
their own decklist. This is not `prizeIndex`'s problem, and the comparison should not be made.

## What is NOT built

**The Charmeleon half.** Trevor's other note — *"a Charmeleon that ends up fighting and having to use
Flamethrower should almost be written off for evolution and used only as a fodder attacker"* — is the
same sentence pointed at the evolution road rather than at wall-ness, and it needs a signal this does
not have: **the card has spent something it cannot get back.** `roadLive` asks whether the destination
exists, not whether this carrier is still worth sending. `evolutionRoadFor`'s survival predicate is
the nearest existing machinery. Trevor has already said that one should be a **discount rather than a
hard stop**, so the shape is settled and the trigger is not.

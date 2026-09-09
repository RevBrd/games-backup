# Eevee's Chain Reaction answers YOUR evolutions, not the opponent's

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Recorded 26 Aug 2026, during Job 13, from Trevor's note in the promo workbook.**

`basep-11` Eevee prints:

> **Chain Reaction.** This power can only be used when a Pokémon evolves. Search your deck for a card
> that evolves from Eevee and attach it to Eevee. This counts as evolving Eevee. Shuffle your deck
> afterward.

**"A Pokémon" is unqualified**, and on a literal reading the opponent's Ivysaur becoming a Venusaur
is a Pokémon evolving. Nothing on the card says whose.

## The decision

**Allied evolutions only.** Trevor's note, written before the card was built:

> Its pokemon power allows it to summon its own evolution **whenever an allied pokemon evolves**, so
> timing that can be important.

## Why, and it is not just deference

The GBC arbiter runs out at Fossil and this is a promo, so [RULINGS.md](../RULINGS.md)'s four-step
order applies and this landed on playability — where Trevor is the authority. But the reading stands
on its own for two reasons worth recording, because the next unqualified trigger will want them:

**The card is a tempo tool and the literal reading makes it a coin toss instead.** Trevor's "timing
that can be important" is the whole strategic content: you hold an evolution, and the turn you play
it you get a second one free. If the opponent's evolutions also fire it, the card mostly resolves on
*their* turn, at a moment you did not choose, and the timing you were supposed to be managing is
theirs. That is a different and much worse card than the one the note describes.

**Every other trigger in this engine is owner-scoped.** `ON_PLAY` fires on your own arrival, `ON_KO`
on your own Knock Out. `ON_OPP_RETREAT` is the exception that proves it — it says *opponent* in its
name, because it had to. An unqualified trigger joining that set as the only both-sides one would be
a rule nothing else in the era follows.

## What is deliberately NOT settled here

**Whether it is optional.** The card says "can only be *used*", which implies a choice, and it is
built as automatic — a triggered Power in POWERS.md's sense, where nobody chooses and there is a
definite moment. That is defensible (an Eevee becoming a Stage 1 is close to always good, and the
player still chooses *when* by choosing when to evolve something else) but it is a second question,
and if it ever bites — a deck wanting Eevee to stay an Eevee, or the deck holding only the wrong
evolution — the fix is to offer a decline, not to revisit whose evolutions count.

## The re-entrancy note, which is implementation rather than ruling

Chain Reaction evolving Eevee **is itself an evolution**, so a second Eevee answers it and a third
answers that. Two Eevees on a Bench is an ordinary board, not a contrived one. The engine guards it
with a flag rather than a depth limit, because "one Eevee per evolution" is the rule — a chain is not
a deeper version of the card. See `fireChainReactions` in `engine.js`.

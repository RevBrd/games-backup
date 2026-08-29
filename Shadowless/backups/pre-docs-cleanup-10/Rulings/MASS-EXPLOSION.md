# An attack that names a group hits every member of it, the attacker included

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled with Trevor 17 Aug 2026.** Dark Weezing's Mass Explosion:

> Does 20 damage times the total number of Koffings, Weezings, and Dark Weezings in play (Apply
> Weakness and Resistance.). Then, this attack does 20 damage to each Koffing, Weezing, and Dark
> Weezing (even your own). Don't apply Weakness and Resistance.

Two waves, and the question is who the second one reaches. **It reaches everything the sentence
names, on both sides of the board, with no exceptions carved out:**

- **The attacking Dark Weezing takes 20.** It is a Dark Weezing in play. The card is a bomb and it is
  standing inside its own blast.
- **A Defending Pokémon that is one of the three takes the main damage AND the 20**, hit twice by one
  attack. Weakness and Resistance apply to the first wave and not to the second.
- **Your own Bench takes it**, which is what *"even your own"* exists to say.

## Why the literal reading, when two of those look like bugs

The temptation to soften one is exactly why this file exists.

**Every softer version needs a carve-out the card never states.** Sparing the attacker requires
reading "even your own" as meaning your Bench specifically. Sparing the defender from the second wave
requires a rule that one attack cannot damage the same Pokémon twice, which is true of nothing else
in the engine. Each is one clause invented to make a card less alarming, and clauses invented for
comfort are how a ruleset stops being predictable.

**The tiebreaker points the same way:** prefer the reading with fewer live dependencies. Counting a
group and then damaging that same group resolves once, off one enumeration. Every alternative needs
the enumeration *plus* a running test of who has already been hit.

## What it commits us to

**A group-naming attack enumerates the group once and applies to all of it, and *in play* means both
sides.** Neo is full of this shape — cards that count their own species — so this is the pattern they
inherit.

Two implementation properties worth keeping, because they are what make it one rule rather than two.
**The same enumeration serves both halves**: count it, then damage it. And **the count is by card
name**, matching [Do the Wave and Boyfriends](DO-THE-WAVE-BOYFRIENDS.md) — a Koffing is a Koffing
because the card says Koffing, not because of what it evolves into.

If a later card counts one group and damages a different one, that is a different card and gets its
own reading rather than a flag on this one.

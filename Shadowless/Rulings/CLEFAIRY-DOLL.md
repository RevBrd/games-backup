# Clefairy Doll — in hand it is a Trainer, in play it is a Pokémon

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 5 Aug 2026, with Trevor, on two points the card does not answer.**

The printed text covers most of it: played as a Basic Pokémon, 10 HP, no attacks, cannot retreat,
immune to Asleep/Confused/Paralyzed/Poisoned, no Prize when Knocked Out, discardable at will. Two
things it leaves open, and no period ruling turned up for either:

**It cannot be your opening Pokémon.** The card counts as a Pokémon *while in play*; sitting in your
opening hand it is still a Trainer. So it does not satisfy the "you must start with a Basic" check
and does not save you from a mulligan. The competing reading is that "play it as if it were a Basic
Pokémon" covers setup too, since setup is when you play Basics — genuinely ambiguous, and decided
this way because the "while in play" clause is the more specific statement.

**You still lose if it was your last Pokémon.** "Doesn't count as a Knocked Out Pokémon" is about
the Knock Out *event* — it is what denies the opponent a Prize. Losing when you have nothing left is
a separate condition keyed on the *board*, and once the Doll is gone the board is empty. A search
summary claimed the opposite; it was inferring rather than quoting, and the mechanical reading is
the one implemented.

Both fall out of one flag: `playsAs: 'pokemon'`, set by the generator on any Trainer that carries an
`hp`, which is exactly Clefairy Doll and Mysterious Fossil across all fourteen sets. Because it is
read at the point of *play* rather than baked into the card kind, the setup path and `basicsIn()`
(Revive, Pokémon Flute) simply never consult it, which is the correct behaviour in both.

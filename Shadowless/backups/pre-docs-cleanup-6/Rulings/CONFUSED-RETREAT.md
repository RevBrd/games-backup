# A Confused Pokémon flips to retreat, and pays before it flips

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 13 Aug 2026, with Trevor, from the GBC game.** The arbiter had something to say here and
it was asked.

Confusion under the original ruleset touches **both** of a Pokémon's exits, not just attacking. This
engine implemented one of them. `confused` appeared eight times in `engine.js` and exactly one was
in the attack path; `canRetreat()` never looked at it, while its own failure message read *"Cannot
retreat (status or insufficient Energy)"*.

The rule as Trevor states it, and as built:

- A Confused Pokémon **may** attempt to retreat — it is not blocked the way Asleep and Paralyzed are.
- **The Energy is discarded first, then the coin is flipped.** Paying up front is the whole
  character of the rule and it is why the order in `doRetreat` is deliberate rather than incidental.
- On tails the retreat fails: Energy gone, Pokémon still Active, still Confused.
- **A failed attempt uses up the turn's retreat.** Otherwise a Confused Pokémon with spare Energy
  re-rolls until it succeeds and the rule becomes a tax rather than a decision. It is also what makes
  *end the turn doing nothing* a real option, which Trevor names as the correct play often enough
  that the rule has to permit it.

The last point is the one not directly quoted from him — it follows from the rest, and it is flagged
here rather than buried so it can be reversed on its own if the GBC game turns out to be looser.

**Found by reading a saved match log, not by a test.** The bot retreated out of Confusion repeatedly
in one game without a single flip. That is the second rules-level fault the logs have caught that no
suite could see; see [MEASUREMENT.md](../MEASUREMENT.md).

The AI was changed with it, because a rule the bot cannot price is a rule that only punishes the
human. A Confused retreat is now valued at **the Energy it certainly costs, plus half of everything
else the retreat achieves**. Note what that does *not* say: a retreat the bot already disliked scores
*higher* when Confused, because half the time the bad swap does not happen either. That is correct
expected value and it changes nothing in practice — a negative retreat still loses to passing.
`powertest.js` asserts the distance from the bill rather than the direction, for exactly this reason.

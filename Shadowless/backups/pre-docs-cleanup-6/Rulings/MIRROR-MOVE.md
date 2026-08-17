# Mirror Move replays a recorded result, it does not recompute

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 5 Aug 2026.** "Do the final result of that attack on Pidgeotto to the Defending Pokémon."
*Final result* is read literally: the damage that actually landed, already past Weakness and
Resistance, plus any Special Conditions that actually stuck. It is re-applied flat to the new
target, with no Weakness or Resistance recalculated against them.

The alternative — re-running the original attack against the new defender — would give a different
number whenever the two defenders have different Weakness, and "final result" reads like a fixed
outcome rather than a fresh roll.

Mechanically this is why the engine writes `lastAttackResult` onto the defender when an attack
resolves: `{turn, by, label, damage, statuses}`. Trevor asked whether Mirror Move could read the
game log instead, which is the right instinct — the information does already exist — but the log
holds *sentences*, so the numbers would have to be regex'd back out of prose, and a reworded log
line would silently break a card. The record is the same idea done as data.

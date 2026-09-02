# Which Energy gets discarded is the player's choice

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 12 Aug 2026, with Trevor.** Not a reading of any card — a decision about who decides.

Seven effects discard Energy off a Pokémon: retreat, Energy Removal, Super Energy Removal, Super
Potion, an attack cost like Flamethrower's, Wildfire, and the attacks that strip the defender. Every
one of them used to pick by array order — "the first one attached", or "the first of the right
type". Which Fire leaves a Charizard is the difference between attacking next turn and not, so the
cards were being chosen by an implementation detail.

**The player is asked, but only when it is a real choice.** If the eligible Energy are all the same
card, or there is no slack because they are all going anyway, the game does not stop — a prompt to
choose between three identical Fire Energy is friction with no decision in it. A Buzzap'd Electrode
counts as distinct from a basic of the same type, which is correct: one of them is a Pokémon you may
want back. *[Buzzap →](BUZZAP.md)*

**The AI is not asked and does not need to be.** Where no choice is supplied the engine falls back to
`energyPayOrder`, which spends what the Pokémon's own attacks do not ask for — so the bot gets a
sensible answer for free, and it is strictly better than the index 0 that six of the seven sites used
before.

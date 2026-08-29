# Ditto — Transform is a snapshot taken on entry, not a live mirror

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 10 Aug 2026, with Trevor.** Deliberately **not** the printed reading.

The card says *"treat it as if it were the same card as the Defending Pokémon"*, which is continuous:
the opponent changes their Active and Ditto changes with it. We read it as a **snapshot instead** —
Transform fires when Ditto enters the Active spot, copies whatever is opposite at that moment, and
holds it until Ditto is benched. Coming back up re-snapshots. It is the main-series shape, it is
Trevor's call, and it is better for a video game in three concrete ways: there is no continuous
re-evaluation loop, the opponent cannot kill your Ditto by retreating into something small, and
**Ditto-vs-Ditto stops being a regress** — the opposing Ditto is already a Pikachu, so ours copies
the Pikachu.

The GBC game is silent: it did not implement this card at all, giving its Ditto an ordinary attack
instead, the same dodge it used for Buzzap. So the standing arbiter has nothing to say and the WotC
rulings should be **read rather than inferred** before 6f — that is the whole lesson of
[the Buzzap entry](BUZZAP.md).

**A correction worth recording, because the same source will be asked again.** Checking the GBC
question produced a confident description of a Ditto power called *"Travel Back"* that swapped Ditto
for a Basic from hand, carrying damage, Energy and status across. No card named Travel Back exists
anywhere in the 1,251-card corpus, and Fossil Ditto (`base3-3` / `base3-18`) is a 50 HP Basic with
**no attacks at all** and one Power, Transform. Verified by grep across all 14 sets, not by memory.

**Built 11 Aug 2026 and it behaves as described.** The mechanism is a `baseCard` / `topCard` split
in `engine.js`: `topCard` is what a slot is *treated as* and returns the copy, so HP, type, Weakness,
Resistance, retreat cost, name and the entire attack list all come from one override instead of
seven. `baseCard` is the physical card and answers the three questions that are still about Ditto —
which Power it has, whether it may evolve, and what goes to the discard when it dies. `powerOf`
reads `baseCard`, which is what stops it inheriting the copied Pokémon's Power.

Transform settles in `settleTransforms()`, called after **every** action rather than at the eight
separate places a Pokémon can reach the Active spot. It is idempotent, and that is deliberate: a
ninth entry path added later cannot forget about Ditto.

One rule covers three interactions, and it is the reason snapshot semantics are cheap:
**anything that switches the Power off blocks the firing but never reverses one already made.**

- **Status.** The printed "isn't a copy while Asleep, Confused or Paralyzed" clause goes nearly dead,
  because benching clears status and a Ditto arriving Active is therefore always clean. Accepted:
  the alternative is a Ditto oscillating between two HP totals mid-combat.
- **Toxic Gas.** Muk out *first* means Ditto never transforms and sits there as a 50 HP body that
  cannot attack. Muk arriving later changes nothing.
- **An empty opposing Active** (the promote gap after a Knock Out) defers the firing rather than
  cancelling it — Ditto copies the first thing it sees.

Three consequences of the copy itself:

- **Ditto does not gain the copied Pokémon's Power.** "Always has this Pokémon Power" is read as
  *Transform is the one it has*. Also the choice that keeps 6f finite: copying Invisible Wall or
  Kabuto Armor would multiply the passive-Power surface by every Pokémon in the game.
- **Energy is wild by quantity, not quality.** Any Energy on Ditto pays any symbol; Double Colorless
  still pays for two. That is a cost-check change, not a rewrite of what the card provides, so it is
  a different mechanism from Charizard's `energyAs`.
- **The transform may Knock Ditto Out, in either direction, and the damage is never adjusted.**
  Copying something smaller than the damage already on it kills it; so does reverting to a 50 HP
  Ditto while badly hurt. Trevor's first proposal floored it at 10 HP remaining instead, and that
  was withdrawn once it turned out to be a **damage pump**: "10 remaining" can only be expressed by
  *reducing* `dmg`, so copy-a-Chansey → take 100 → bench → revert → re-promote launders 60 damage
  away, repeatably, for the price of a retreat. Carrying the damage is safe precisely because the
  snapshot model makes every transform player-initiated and fully informed — the opponent's Active
  is face up. The retreat confirmation gate warns.

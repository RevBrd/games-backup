# Metronome copies a CHOSEN attack, and cannot copy another Metronome

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 5 Aug 2026.** The card says "Choose 1 of the Defending Pokémon's attacks" — it is a
player choice, not random. (The video-game move of the same name is random; the card is not.)

Two calls beyond the printed text:

- **Metronome may not copy a Metronome.** Nothing in the era's text says what that would resolve to,
  and it invites unbounded recursion. Those options are simply not offered.
- **"Anything else required in order to use that attack" is read as the cost verbs only.** So a
  copied Fire Blast does not discard Clefairy's Energy, and a copied Leek Slap does not inherit
  Farfetch'd's once-per-play restriction. Damage, recoil and Special Conditions all still happen.

The card's own footnote — *"No matter what type the Defending Pokémon is, Clefairy's type is still
Colorless"* — needed no special handling. The copy runs through `runAttack` with Clefairy still as
the attacking slot, and Weakness is computed from the attacker, so it falls out for free. The same
fact makes "does damage to itself" land on Clefairy.

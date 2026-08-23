# Do the Wave counts a Clefairy Doll; Boyfriends matches on card name

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

**One file, two cards, because it was one decision** — both are about what an attack *counts*, and
both were settled in the same conversation when the cards landed in Job 6d.

---

**Both settled 10 Aug 2026, with Trevor, when the cards landed in Job 6d.**

**Wigglytuff's Do the Wave** — "10 damage plus 10 more for each of your Benched Pokémon" — **counts
a Clefairy Doll**. The Doll is a Pokémon while in play, which is the same reading that already
decides it cannot be your opening Pokémon and that Revive cannot reach it: `playsAs` is read at the
point of play, so once it is on the Bench it is a Benched Pokémon like any other. Neither of us
could recall the GBC game ever being asked, and both of us landed on yes while admitting it feels
odd at the table. Reversible if it plays badly. *[The `playsAs` reading →](CLEFAIRY-DOLL.md)*

**Nidoqueen's Boyfriends** — "20 damage plus 20 more for each Nidoking you have in play" — matches
on **card name**, not species or Pokédex number. A differently-named Nidoking would not count.

The implementation counts every slot on your side rather than the Bench specifically, which sounds
looser than the card and is not: Boyfriends is Nidoqueen's own attack, so Nidoqueen is Active
whenever it resolves, and every Nidoking you have is necessarily Benched. Trevor made the same
observation from the other direction. Counting all slots matches the printed text exactly and stays
correct if a later card ever attacks from somewhere else.

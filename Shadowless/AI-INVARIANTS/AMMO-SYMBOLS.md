# `ammoSymbols` — ammunition is only ammunition if you have nothing else to shoot with

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `ammoSymbols`

---

*28 Aug 2026, #29. The rule this narrows is **`ammoSymbols`, 21 Aug — #21**, now in
[archive 2](../AI-INVARIANTS-ARCHIVE-2.md); it is still correct, and what was wrong was how wide the
derivation reached. (It said "the entry two above this one" until the archive split moved that entry
out from under it — **name the entry, never point at a position**, which is `MEASUREMENT.md`'s own
lesson about a growing table arriving here in a shrinking file.)*

**Headroom is granted only when the burn OUTPACES the attachment and the card owns no free attack.**
Both are read off the card's own effect scripts, so this is still a derivation and not a list — but
the verb alone was not enough. `COST_DISCARD_ENERGY` on its own told the bot to stock **Arcanine GP
to six Fire** for a 40-damage attack, using the pre-load rule written for Charizard's 100.

**The claim that found it was asserting the wrong thing, and that is the entry.** `tools/claims/basep.js`
had a red row saying Arcanine GP should prefer Quick Attack at four Fire. It was red for two days and
two sessions read it as a missing term in attack choice. Trevor, asked directly: *"If it ever found
itself in a situation where it did have 4 energies attached then yes, it should use Flames of Rage.
However, it should be exceedingly rare that it finds itself in that situation."* **The attack choice
was right the whole time and the fault was one decision upstream.** The row was rewritten to assert
the behaviour that turned out to be correct, the way the 14 Aug `powertest` assertion was rewritten
rather than deleted — and the real claim is now an *attach* row.

**THE NESTING IS LOAD-BEARING AND THE FLAT VERSION MOVED FIFTEEN CARDS.** Written first as "no
headroom for any card with a free attack", it stripped Ninetales, Charmeleon, Charmander, Magmar,
Starmie, Kadabra, Mewtwo, Gastly, Slowpoke, both Flareons, Ponyta, Dark Golduck and base1 Arcanine —
fourteen rate-neutral cards, most of them in live ladder decks, on the strength of an argument about
two cards that are nothing like them. A card burning one against one attached a turn was never at
risk of running out, so the fallback test has nothing to say about it. **Ask it second, and only
under a real drain.** Then it moves exactly one card. The sweep is the only thing that told the two
versions apart, and the first one felt just as principled while writing it.

**THE INSTRUMENTS ARE BLIND HERE AND THAT IS STATED RATHER THAN MEASURED AROUND.** `basep-6` appears
in **0 of 51 authored decks** and promos are excluded from generated decks by design, so `aiduel` and
`decksim` cannot see this change at all. Running them would return a symmetric null that means
nothing — the exact failure [MISREADINGS.md](../MISREADINGS.md) exists for, and the reason the 23 Aug
entry above checked exposure before believing its own null. The evidence here is three claim rows and
a full sweep of every card carrying the verb.

**One of those three rows is a CONTROL and it is not optional.** A fifth Fire on Charizard must still
score positive. Without it, deleting `ammoSymbols` outright would pass every other row in the file.

**The board-level half is still open and Trevor's answer sharpened it.** *"After it's at 2 energies,
additional ones better serve the bench... unless they're in abundance"* is three conditions about the
rest of the board, and nothing in the scorer reasons about Energy as a resource with somewhere else
to be. Same capability the Charmeleon half and Evolution timing wait on.
*[The pattern, with the note verbatim →](../Playbook/AMMO.md)*

---

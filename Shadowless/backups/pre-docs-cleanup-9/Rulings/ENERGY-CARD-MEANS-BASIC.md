# "1 &lt;Type&gt; Energy card" means a basic one

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

> **CORRECTED 19 Aug 2026 — read [RAINBOW-IN-PLAY.md](RAINBOW-IN-PLAY.md) alongside this.** The
> paragraph below says Rainbow Energy would "otherwise become movable by Energy Trans and attachable
> by Rain Dance", and treats both as things to prevent. Only the second is. Rainbow's printed text
> says it does not count as a basic Energy card **when not in play** — so while attached it does, and
> Energy Trans can move it. Everything else here stands.

**Settled 5 Aug 2026.** Rain Dance says "1 Water Energy card", Energy Trans says "1 Grass Energy
card". Both are read as **basic** Energy of that type, matching the WotC rulings.

In Base Set the distinction is invisible: the only non-basic Energy is Double Colorless, which is
Colorless and so fails the type check anyway. It starts mattering at Base Set 2, where **Rainbow
Energy counts as every type** and would otherwise become movable by Energy Trans and attachable by
Rain Dance. The engine checks `cls === 'Basic'` rather than the type alone, so that case is already
handled rather than waiting to surprise someone.

Energy Trans has **no restriction on the destination's type** — the card only qualifies the Energy,
not the Pokémon receiving it. Grass Energy onto a Lightning Pokémon is legal, and there is a test
asserting it. Rain Dance does restrict its destination, to Water Pokémon.

# 1 Sep 2026 — a Water that pays a Colorless is still a Water that was used

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `spareEnergyFor`

---

**`spareEnergyFor` — #32, Job 14b, out of the Poliwrath claim row written the day before.**
*[The ruling →](../Rulings/SPARE-ENERGY-PAYS-COLORLESS.md)*

**THE INVARIANT, and it is about where the function lives as much as what it does.**
`DMG_PER_SPARE_ENERGY` counted only the cost's **typed** symbols, so a Water paying a **Colorless**
symbol was never marked as used. **`spareEnergyFor` in `engine.js` is now the whole clause, and
`ai.js` calls it rather than keeping a copy. Do not re-inline it.**

Instance methods resolve at call time, so the concatenation order that forces `aiParseDamage` and
`aiEnergyIsType` to be local copies does not apply — `potentialOf` has been asking `E.slotSymbols`
for the same reason since 18 August.

### Why one implementation and not a third assertion that two agree

**This arithmetic has drifted twice, in opposite directions, and only one of the two was catchable
by an agreement test:**

| | shape | caught by |
|---|---|---|
| `maxSpare`, Job 6 → 31 Aug | two copies, **disagreeing** | the engine-resolves-it sweep, added 31 Aug |
| the Colorless clause | two copies, **agreeing on a number the card forbids** | **nothing** — only the printed card |

**That is the general lesson and it is worth more than either bug.** An agreement guard is cheap and
real, and it is structurally blind to a shared mistake. When you find yourself writing one, ask what
the *card* says as well — and prefer deleting one of the two copies to asserting they match.

### The measurement, and it is a pair rather than a table

| board | before | card says |
|---|---|---|
| Poliwrath, 4 Water | **50** | 40 |
| Poliwrath, 3 Water + 1 Fighting | 40 | 40 |

Same three symbols paid. **Paying the Colorless with a worse Energy dealt ten more damage.** Every
count on Poliwrath, Omastar, Lapras and Blastoise now matches the printed rule, including two Double
Colorless boards where the DCE pays the Colorless and frees a Water to be spare. Lapras and Blastoise
are the controls — costs typed all the way through, unchanged at every count.

Six live printings moved: Poliwrath, both Vaporeons, Omastar, Seadra, Psyduck.

### It exposed a second thing, and that one is NOT fixed

**Omastar takes one of its two spares and refuses the other**, and the cause is Spike Cannon rather
than Water Gun. `potentialOf` prices a benched slot at printed damage and takes the best attack;
Spike Cannon prints "30×", which `aiParseDamage` reads as 30. At two Water, Water Gun deals 20 and
the slot's `best` is already 30, so the third Water brings Water Gun **level** rather than past it,
`best` does not move, and the surplus rule refuses. The fourth Water is taken normally.

**A guaranteed 30 and a coin-flip 30 are equal in the printed-damage currency, and they are not
equal.** That is [AI.md](../AI.md)'s open item 1 arriving as a card-sized case, and it is the cheapest
statement of that item anybody has written down — it needs no tail analysis and no duel to see.
**Left open deliberately**: the Over-Attach work corrected a wrong *fact* and this is a *unit*, which
is the distinction that whole job turned on. It is a red claim row in `tools/claims/base3.js` with the
diagnosis attached.

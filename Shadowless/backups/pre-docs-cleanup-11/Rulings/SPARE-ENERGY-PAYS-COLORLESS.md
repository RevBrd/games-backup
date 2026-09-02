# A Colorless symbol consumes an Energy too, and the engine pays it as well as it can

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled with Trevor, 1 Sep 2026.** He is the arbiter here on both the GBC game and Pocket, and the
answer was the same in both.

## The clause

*"Does 30 damage plus 10 more damage for each Water Energy attached to Poliwrath **but not used to
pay for this attack's Energy cost**."* Base Set Poliwrath, and the same sentence on eleven other
printings. Water Gun costs **WWC**.

## Two questions, and only the second one is a ruling

**The first is not a judgement call and this engine had it wrong.** A cost is paid in symbols and
**every symbol consumes an Energy, including the Colorless ones**. `DMG_PER_SPARE_ENERGY` counted
only the cost's *typed* symbols, so a Water paying the Colorless was never marked as used. Four
Water on a Poliwrath pay Water Gun with three cards and leave **one** spare; the engine called two
of them spare and dealt 50 where the card says 40.

**The arithmetic was not what settled it. This pair was:**

| board | engine dealt | card says |
|---|---|---|
| Poliwrath, 4 Water | **50** | 40 |
| Poliwrath, 3 Water + 1 Fighting | **40** | 40 |

The same three symbols are paid both times. Paying the Colorless with the *worse* Energy dealt ten
**more** damage, which no reading of the card supports. Lapras, whose cost carries no Colorless, was
correct at every count and is the control.

**The second question is the ruling: when both a Water and a non-Water could pay the Colorless, who
chooses, and how well?** The player is never asked in this engine — there is no picker for cost
payment — so the engine picks, and it had to be told which way.

## Trevor's answer, 1 Sep 2026

> Both GBC and Pocket resolve it by having the engine choose for the player. In Poliwrath's case, it
> would be the W energies resolve the W requirements and then whatever else can fill the C one, even
> another W (which would benefit the Over-Attach move if so).

**So: typed symbols are answered by their own type, then the Colorless is filled by anything else
available, and only falls to the typed Energy when there is nothing else.** That is the assignment a
human would make every time, and the engine makes it on the player's behalf rather than offering a
choice.

**It is also the reading that makes a Double Colorless do something interesting on these cards**,
which is worth noticing because nothing else in the format rewards it this way:

| Poliwrath, Water Gun WWC | spare Water | damage |
|---|---|---|
| 2 Water + 1 Double Colorless | 0 | 30 — the DCE pays the C, both Water pay WW |
| 3 Water + 1 Double Colorless | **1** | **40** — the DCE frees a Water to be spare |
| 3 Water | 0 | 30 |
| 4 Water | 1 | 40 |

## Where it lives, and the property to keep

`engine.js`'s **`spareEnergyFor`**, which is the clause and nothing else. **`ai.js` calls it rather
than keeping a copy**, and that is deliberate to the point of being the entry's real content: this
arithmetic has now drifted **twice**, in opposite directions, and an agreement test between two
copies would only have caught one of them.

- `maxSpare` went into the engine in Job 6 and never into the scorer — two copies, disagreeing. An
  agreement test catches this.
- The Colorless clause was missing from **both** copies, which agreed perfectly on a number the card
  forbids. **No agreement test can ever catch that**; only the printed card can.

*[Both guards, and why you want both →](../AI-INVARIANTS.md)* ·
*[the pattern this came out of →](../Playbook/OVER-ATTACH.md)*

## Six printings moved, and the rest are the control

Poliwrath, both Vaporeons, Omastar, Seadra and Psyduck — every live card whose spare-Energy cost
carries a Colorless. **Blastoise, Lapras, Omanyte, Poliwag and both Dark Blastoises are untouched**
and were verified unchanged, because their costs are typed all the way through.

## The corroboration, recorded because it arrived from outside the code

**Trevor's own workbook note on Poliwrath asks for behaviour that was impossible under the old
arithmetic**: *"the bot should be willing to add that fifth energy to do so."* Under the engine's
reading a Poliwrath on four Water was already at the printed cap, so the fifth Energy was worth
exactly nothing and the bot correctly refused it. He was describing the card; the engine was
describing itself. **A claim row written straight off that sentence went red and named the fault** —
which is the whole method in [PLAYBOOK.md](../PLAYBOOK.md) working in the direction it was built for.

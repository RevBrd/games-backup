# "Energy" counts by type; "Energy card" counts by class

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 17 Aug 2026, and it is the first ruling made under the post-Fossil order.** Step 3 of that
order — the WotC rules, *read* rather than inferred — is what actually decided it, and Trevor is the
one who went and read them.

**Rainbow Energy counts toward "for each Water Energy attached."** Dark Blastoise's Hydrocannon does
20 more for each spare Water Energy on it, and a Rainbow sitting there is one. So is a Rainbow for a
Fire-scaling attack, a Psychic one, and so on — while it is in play it is every type.

## Why this does not contradict the basic-only ruling

It looks like it should. [ENERGY-CARD-MEANS-BASIC.md](ENERGY-CARD-MEANS-BASIC.md) settled that
*"1 Water Energy card"* means a **basic** one, which is what stops Rain Dance and Energy Trans moving
a Rainbow around. Two rulings about Rainbow and Water, pointing opposite ways.

**They point opposite ways because the cards use different words, and the difference is load-bearing
rather than accidental.** Rain Dance says *Energy **card***. Hydrocannon says *Energy*. One is about
the physical card you are picking up and moving; the other is about what is attached and what it
currently counts as. WotC wrote them differently and meant it.

So the rule is a reading rule, not a Rainbow rule:

| The card says | What to count |
|---|---|
| *"Energy"* — attached, provided, powering something | **type**, live, as the card currently counts. Rainbow qualifies for every type |
| *"Energy card"* — search, move, discard, retrieve, attach | **class**, the physical card. Rainbow is not a basic Energy card and never qualifies |

**Both of us reasoned our way to the right answer here and it was still worth checking.** The Buzzap
entry is the standing warning about that exact complacency — two instances reasoned confidently to
the wrong answer while the source said otherwise in plain language. This time the reasoning and the
source agreed, which is *evidence*, where the reasoning alone would only have been a preference.

## What it commits us to

**A card can be Water and Fire and Psychic at once for counting purposes**, simultaneously, for
different attacks in the same turn. That falls straight out of "counts as every type" and it is not a
loophole to close later — it is the printed behaviour.

**`isBasicEnergyOf` is already the right check and already exists**, written during Base Set against
a Rainbow Energy that did not exist yet: *"In Base Set the type check alone would do, since Double
Colorless is Colorless — but Rainbow Energy counts as every type, so the class check is what keeps
this honest."* Whoever wrote that predicted this ruling by a week and built for it. The counting side
reads `energyProvides` instead, which is the same split one level down.

**One thing this ruling does NOT settle**, flagged so nobody assumes it did: Rainbow does 10 damage
to the Pokémon it is attached to when played from hand, and whether that can Knock Out a 10-HP
Pokémon on attachment is a separate question nobody has asked yet.

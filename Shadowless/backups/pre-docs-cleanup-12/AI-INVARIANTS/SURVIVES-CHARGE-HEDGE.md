# 31 Aug 2026 — the off-by-one is a hedge, and the fix was in the selection

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `turnsLeft`, `survivesCharge`

---

**`turnsLeft`, `survivesCharge`, `evolutionRoadFor`** · Job 14b · Trevor's Charmeleon note, and his
question about what the reusable answer should be.

**The invariant: `survivesCharge`'s `+1` is a POLICY and must not be "corrected".** It reads one turn
more than the worst case says, which looks exactly like an off-by-one — a Pokemon acts before each of
their attacks, so the attack that kills it is not a turn it got. **It was corrected as an experiment
and the experiment is why the `+1` is now documented instead of gone.**

`incomingThreat` is a snapshot of the worst thing they can do **right now**, and `survivesCharge`
projects it forward as a certainty — no heal, no switch, no Gust, no coin landing wrong. That
over-projection gets less true the further out it reaches, and the `+1` is the hedge against it.

**It is load-bearing on one narrow band, measured.** Removing it flips three claim rows and all three
sit in the same place — a Pokemon that survives **exactly one more hit**, where the honest count
halves the discount:

| board | shipped | honest | outcome |
|---|---|---|---|
| Zapdos, 70 HP under 80 | 1 | 0 | already discounted hard — **stays green** |
| Charizard, 120 HP under 80 | 2 | 1 | *"firing at four is charged for"* **flips** |
| Arcanine GP, 70 HP under 40 | 2 | 1 | *"never at exactly two Fire"* **flips** |

**Trevor's own notes settle it, and they only look contradictory until the band is visible.** Zapdos
is genuinely dying and its note says burn freely. The other two are at or near **full HP** facing one
hit, and their notes say do not silence yourself there. **A Pokemon at full HP is not "about to die"
in any sense a player would recognise** — it is one heal, one Gust or one bad coin from a different
board. The hedge is what encodes that, and it had been doing it by accident since the function was
written.

**`turnsLeft(pi, slot)` is the fact, split out from the policy**, and that split is the general
answer to *"what should the next item that needs this reach for."* It returns future turns of mine,
unhedged, `Infinity` on the Bench. The same idea had been written **four times** — inside
`survivesCharge`, inside `discardSilence`'s call, inside `attachBuild`'s, and as a bare boolean in
`T_PLUSPOWER` written the day before, which **disagreed with `survivesCharge` on the same board.**
That boolean is now a call to `turnsLeft`; the arithmetic is identical (`hp <= threat` and
`ceil(hp/threat) - 1 === 0` are the same condition), so nothing moved and there is one expression of
the idea instead of four.

**THE RULE FOR THE NEXT CALLER: take the fact, state your own policy at your own call site.** Do not
add a second hedge inside `survivesCharge` and do not remove the one that is there. If the hedge is
ever revisited it is a policy change wanting its own measurement, not a bug fix.

---

**And the Charmeleon fault was never in the magnitude.** The road was worth **101.0 to an Active on
80 HP and 101.0 to the same Active on 10 HP**, with the safe benched twin passed over at 62.0 —
sweeping the Active from 80 down to 10 never moved it by a point. No survival discount fixes that,
because `evolutionRoadFor` ranks by **investment and nothing else**, and a discount to the magnitude
leaves the road where it was.

**So a copy that will not live to finish its road now steps aside, exactly as a ready one does.** That
is the same shape as the existing release rather than a new kind of rule: a leader stops leading when
it can no longer be the one that arrives. Trevor, 31 Aug: *"I'd say the active one is pretty safe to
write off... switching powerup focus to the Charmeleon on the bench."*

**ONLY WHEN SOMEBODY ELSE CAN TAKE IT UP.** A sole carrier keeps its road however doomed it is —
there is no better home for the Energy and refusing would strand it. That guard is what keeps this
from being a veto, and it is why the common single-copy case is untouched.

**Hedged through `survivesCharge`'s own `+1`** rather than the raw count, so the two places that ask
*"will you be here"* cannot drift apart. A healthy Active two turns from death with a shortfall of two
keeps the road; a Charmeleon with zero turns left against a shortfall of two does not.

**A claim about twins must go through the uid.** The first version of that row read
`explain()`'s label, and with two Charmeleons in play *"Attach Fire Energy to Charmeleon"* is the same
string twice — so it read the wrong slot and stayed red after the fix had landed. **`explain()` is
for humans; anything comparing two copies of one card needs the action's `target`.**

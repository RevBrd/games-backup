# 30 Aug 2026 — a Switch is worth the retreat cost it nullifies, and half of that is open

> **THE OPEN HALF IS CLOSED — 3 Sep 2026.** Trevor was asked and answered that the cost should not be
> priced at all; it was then measured and found to be in the arithmetic already, because a Switch does
> not pay `retreatSaveEnergy` and a retreat does. What was actually broken was the OTHER half of his
> note. Nothing below is wrong — the title is just no longer the whole story.
> *[The entry →](SWITCH-DESIRE-TO-RUN.md)*

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `T_SWITCH_OWN`

---

**`T_SWITCH_OWN`** · Job 14b · Trevor's `Wants` on Switch.

**The invariant: a Switch on a Pokemon that can already walk away for nothing is worth nothing**, because
retreating does the identical thing and keeps the card. The retreat cost was not read anywhere in
this case. Measured before the fix: **a Switch on a free-retreat Rattata scored 24.00 and was
played**, while one on a retreat-4 Snorlax — the card in the format it is worth most on — scored
**-4.00** and was refused.

**A GATE, NOT A WEIGHT, and only half his note deliberately.** *"Does not want to be used on a
free-retreat cost pokemon"* is a gate with no number in it. *"Prefers heavier retreat costs to
nullify"* is a quantity, it is **not built**, and there is an `open:` row saying why: the saving is
only real if you wanted to move at all, so adding `cost * retreatSaveEnergy` unconditionally buys
Switches for Snorlaxes that were perfectly happy standing there — and gating it on *"did we want to
move"* is circular, because that is the sum the term would be part of. **Ask before building it, and
build it once**: the retreat path already owns this quantity as `retreatSaveEnergy` and there must
not be a second rate for it.

**All three conditions on the gate are load-bearing and none is defensive.** `canRetreat` is what
makes it safe under Paralysis and Sleep, where retreating is illegal and the card is the only way
out. `retreated` is the once-a-turn limit, after which the card is again the only way out — there is
a control row for exactly that board. And the cost is read **live** through `retreatCostOf` rather
than off the printed card, so Dodrio's Retreat Aid is already in it.

**`T_SWITCH_OWN` also computes its best destination and throws the value away**, which is the third
time this session that pattern has turned up — `bestDragTarget`'s old home did it, and so did the
Gust ranking. **When a scorer picks an index out of a loop, check whether the score that chose it
survives.** It usually should.

**Measured.** `abtest 8 HEAD`: **3.3% of 17,296 games diverge**, against a null control reading 0.0%.
Win rate 49.1% → 48.9%, which is 23 games and symmetric; **do not read it in either direction.**

---

**`AI-INVARIANTS.md` has passed 450 lines here — 544 by the end of Job 14b — and this is the named deferral rather than a silent
one.** The four Job 14b entries above were written the same day as the work, and the 28 Aug precedent
in this file's header is that archiving fresh reasoning buries it before anybody reads it. **The owner
is Job 15c's document pass** — `AI-INVARIANTS-ARCHIVE-3.md`, split at the Job 14b boundary, which
puts Jobs 13 through 14b in it. A deferral with a named owner is a decision; one without is a limit
quietly becoming advisory.

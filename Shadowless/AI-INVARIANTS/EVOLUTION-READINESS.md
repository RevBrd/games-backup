# `evolutionInHand` / `potentialAs` / `evolveEarly` — a Pokemon about to become something else is not paid up

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `evolutionInHand`, `potentialAs`, `evolveEarly`

---

*28 Aug 2026, #29. AI.md open item 4, closed — and it is the first entry here whose measured result is
a null that shipped anyway.*

**Two rules, one commit, and the file said so before either existed.** Open item 4's whole warning was
that a readiness penalty on `evolve` must not ship without the attach half, because evolving was the
only thing that unblocked the Energy. That held. Trevor's account of the GBC game gave both halves at
once: *"careful not to evolve unless it was one energy away from being able to use the evolution's
cheapest attack of value, so it would get energies close to that point before actually evolving."*

**THE BLOCKER WAS ONE LEVEL HIGHER THAN THE OPEN ITEM PREDICTED.** It named `attachValue` as the thing
to fix. `attachValue` was never reached: the **surplus rule** in `case 'attachEnergy'` returns
`W.attachSurplus` first, and a Gloom holding two Grass can already pay for Foul Odor, so `noProgress`
was true and the third Grass was refused at −2 whatever `attachValue` would have said. Fixing the
predicted site alone would have changed nothing and looked like the rule not working. **A diagnosis
that names a function is still a hypothesis about which function.**

**`potentialOf` held an assumption silently and my change broke it.** It takes the card as an argument
and had exactly one caller, which always passed `this.top(slot)` — so its `scoreAttackHypothetical`
branch could index attacks by position against the real card. Ask it about an *evolution* with more
attacks than the Basic underneath and it indexes off the end: `Cannot read properties of undefined
(reading 'dmg')`, three Overgrowth games, caught by `selftest.js` and not by anything else.
`isReal` now guards it and printed damage is the fallback — which is right rather than merely safe,
since a card not on the board cannot be scored as though it were attacking this turn.

**THE RESULT IS A NULL AND IT SHIPPED. Read this before citing it as an improvement.** `aiduel 8
--gbc` against HEAD: no significant difference, and `--control` reads the same, so the harness is
working and the null is real. The change is not inert — 17,672 ladder games went from 228,832
attachments to 229,737 and from 633,654 turns to 635,509. Three grounds for shipping: it is the
behaviour Trevor specified; it closes a fault he named from PLAY rather than from a metric, and a
Vileplume that arrives unable to attack is visible to a human in a way 0.4% of attachments is not; and
MEASUREMENT.md predicts symmetric perception fixes read flat. **What is not claimed is that the AI got
better.** If a later pass finds this costs something, the null is why that is fair game.

**Only from hand, deliberately.** Trevor's note has a lower-weighted arm for evolutions still in the
deck, and a duplicates clause — feed one Gloom, not two. Neither is built; both are named in
*[Playbook/EVOLUTION-TIMING.md](../Playbook/EVOLUTION-TIMING.md)*. The duplicates clause depends on the
scarcity measure that AI.md open item 9(b) measured at near-inert, so it does not follow automatically
and should be raised with Trevor rather than assumed.

---

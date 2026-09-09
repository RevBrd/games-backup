# 1 Sep 2026 — the destination is not always the cheapest attack, and it is asked in three places

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `attackThreatens`, `destShort`

---

**`attackThreatens`, `destShort` — #32, Job 14b, from Trevor's general rule rather than from a card.**
*[The eight notes that confirm it, and the curve →](../Playbook/EVOLUTION-TIMING.md)*

**THE INVARIANT. An evolution road is measured to the cheapest attack the evolution is trying to
REACH, not the cheapest one it owns.** `potentialOf` returns both — `short` and `destShort` — and the
evolution road reads the second. A Kadabra owns Recover at two Energy and does nothing with it; it is
trying to reach Super Psy at three, which is what Trevor's note means by *"a pokemon that wants to
stay at 3 energies at all times."*

**Only the evolution road switches.** A card fighting now keeps `short`, because a utility attack it
can use *this turn* is a real destination. That is the control and it is asserted: an Abra with no
Kadabra in hand is fed one Psychic and refuses the second, unchanged.

### IT IS ASKED IN THREE PLACES AND THE THIRD ONE RETURNS FIRST

**The transferable half, and it cost a wrong reading of a claim row.** One idea — *how far is this
card from being worth having* — has three call sites:

| Site | Decides |
|---|---|
| `readiness` in `case 'evolve'` | when to pull the trigger |
| `beforeShort`/`afterShort` in `attachBuild` | how long the road is |
| **`evolving` in the surplus rule** | **whether an attachment is considered at all** |

The first two were changed and the behaviour did not move an inch — the Abra board still scored −2.00,
because the surplus rule returns `attachSurplus` before either is reached. **Find every call site
before you measure**, or a correct change reads as a null and gets reverted.

### `attackThreatens` reads the SCRIPT, and that is not fussiness

Six attacks print no damage number and deal damage anyway — Stretch Kick, Dig Under, Stare, Flitter,
Coin Hurl and Telekinesis snipe the Bench, Super Fang halves the defender, Miraculous Comeback counts
heads. **Trusting `aiParseDamage` here would have been the exact fault the Over-Attach entry above
had just finished fixing**, one day later and in a new place.

The defensive verbs deliberately do not qualify — `DAMAGE_REDUCTION_SELF`, `DAMAGE_HALVE_SELF`,
`DAMAGE_REDUCTION_FROM` — nor `RECOIL`, which is damage pointed the wrong way. **A card with no
threatening attack at all falls back to the cheapest of any**, because then the utility attack
genuinely is the destination.

**Guarded, in the one direction that can regress**: `powertest.js` asserts that nothing the predicate
calls harmless actually produces damage or a bench-splash flag in `rawOutcomes`. Watched failing —
dropping `BENCH_SNIPE` names all nine attacks it should.

### Why "offensive" alone is wrong, and why the walls are safe anyway

Trevor's own wording was *"cheapest offensive (or otherwise specified) attack"*, and the parenthetical
is where the real rule was. **Chansey's Scrunch and Ninetales' Lure are both zero-damage cheapest
attacks and they are opposite cases.** What separates them is not the attack: **a wall is a terminal
Basic and is never an evolution target**, so the wall case cannot reach this predicate. `WALLS.md`'s
derivation protects it from one file away, and that is why the predicate can be blunt.

### Eight of Trevor's notes confirm it and none contradicts it

22 evolution printings of 151 change target. Eight of them have a `Wants` note written **before this
rule existed**, naming no code, and every one names the damaging attack the derivation independently
picked — Ninetales, Wigglytuff, Nidorina, Hypno, Kadabra, Wartortle, Parasect, Victreebel. **Three
use nearly the same sentence**, *"doesn't want to be in a situation where it has to use it"*, which is
the readiness discount in English before anybody wrote it in code.

**That is the strongest argument in this tree for deriving over tagging**, and it is worth more than
the feature: the derived rule reproduced eight hand-written judgements without any of those cards
being named anywhere in `ai.js`.

### Measured: a null, and it shipped — `aiduel 8 HEAD --gbc`

**49.9% ±0.5 over 34,564 ladder games. No significant difference at this sample size.**

**Do not inherit "this helped" from the fact that it shipped**, and do not inherit "this failed" from
the null either. Every evolution-timing change in this file has read null on a duel — the 28 Aug
readiness work shipped on one too, and its entry says the same thing. The grounds are elsewhere:

- **the claim rows**, which are behavioural and specific — Kadabra's went red against the old rule
  and green against the new one, and Wartortle's control passed both ways
- **eight of Trevor's own notes**, written before the rule existed, naming the attack the derivation
  independently picked
- **the direct before/after**, which is what actually proves the two trees differ: an Abra on two
  Psychic scored the next attachment at **−2.00 before and +15.00 after**

**The separate `--control` run was NOT done, and the reason is stated rather than skipped quietly.**
`aiduel --control` exists to catch a harness lie that *inflates a difference* — the unmirrored-seat
bug that once faked six points. It guards false positives, and this is a null, so it would have had
nothing to say. The failure it could not have ruled out is the opposite one — a harness that never
swapped `ai.js` at all, which would produce a null no matter what — and **a control cannot see that
either, because it is baseline-versus-baseline by construction.** What rules that out is the
before/after pair above, measured on a built board: the two trees demonstrably disagree.

**If you are shipping a POSITIVE duel result, run the control.** This entry is not a precedent for
skipping it.

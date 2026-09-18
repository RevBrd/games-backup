# 17 Sep 2026 — a barrier that stops effects stops the status too, and that status is OUR turn

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `flags.effectShield`, `statusThreatAgainst`, and the line after the shield term in
`scoreAttack`

---

**Job 17b** · #42 · AI.md item 14, from Trevor's Raichu note: *"Agility buys turns through damage
*and status* denial on a coin flip."*

**The invariant: a barrier that prevents all EFFECTS is credited with the status the opponent's
attack would have put on us, priced as that status landing on us. A barrier that prevents only
DAMAGE is not.**

## Two kinds of barrier, and the engine already knew

| Verb | Engine effect | `effectShield` |
|---|---|---|
| `BARRIER` (Barrier) | `PREVENT_ALL_EFFECTS` | 1 |
| `BARRIER_ON_FLIP` (Agility) | `PREVENT_ALL_EFFECTS` | 0.5 |
| `FLIP_BONUS_OR_RECOIL` with `barrierOnHeads` (Fly) | `BARRIER` on heads | 0.5 |
| `PREVENT_ALL_DMG_SELF_ON_FLIP` (Withdraw, Stiffen, Scrunch) | `PREVENT_ALL_DAMAGE` | — |
| `SHADOW_IMAGES` | a miss on damage; *"any other effects still happen"* | — |

`flags.shield` was one number for both kinds. **Do not merge them back**: Withdraw would be
credited with blocking a Paralysis that walks straight through it. A `powertest` row holds the split.

## The whole status, not an increment — the item as filed was wrong about the ORDER

Item 14 said the damage term already buys the opponent's turn, so only a status that *outlived* that
turn would be new value. Derived from the turn order:

1. **Our turn:** Agility, and the coin lands.
2. **Their turn:** their attack is prevented, damage and rider both.
3. **Our next turn:** the Paralysis that attack carried would have taken **this** attack.

Step 3 is our turn, not theirs, and neither damage term touches it. So there is no overlap to
subtract. It is priced as a status landing on us: the same `W[key]`, scaled by what our slot's next
attack is worth (`bestAffordableDamage / AVG_ATTACK`), with novelty read on our slot. Poison keeps
its flat weight, as it does on the other side.

**`bestAffordableDamage`, never `scoreAttack`** — `scoreAttack` is the caller (AI.md item 19).

**Named bias:** damage is read from their worst-damage attack and status from their worst-status
attack. Those can be two different attacks, so on a board where they differ the barrier is slightly
over-credited. That is the same snapshot stance `threatAgainst` takes, and the safe direction for a
defensive card; recorded rather than hidden.

## Measured

`base1:Raichu` on 3 Lightning, threat 40 either way: Agility against **Electabuzz** (Thundershock's
paralysis coin) **40.75**; against **Machop** (no status) **35.75**. They were exactly equal before.
The claim row in `tools/claims/base1.js` asserts that ordering, and it is **red against the commit
before this change** (`claimtest Raichu --baseline HEAD`).

Divergence: `abtest 8 HEAD --pairs 400` **0.3% ± 0.2** — few ladder decks field an effect barrier against a
status attacker, so the claim row, not a win rate, is the instrument for this term.

## The AI.md item as it read, verbatim

Moved out of [AI.md](../AI.md)'s open list on 17 Sep 2026 by #42, once the item closed — that
file's own rule is that a shipped item leaves the live claim and a pointer behind, and six
closures in one session had instead left their full text in place (644 lines to 737). Indentation
is the list's; nothing else is changed.

    **A barrier denies a status as well as damage, and the shield term cannot see it — 7 Sep 2026.**
    `denied` is `Math.min(incomingThreat, hpLeft)`, so `f.flags.shield` is a pure function of damage
    prevented. An Agility against a Pokemon whose attack would **paralyse** prices identically to one
    against a Pokemon that would only hit, and the equality is exact rather than close:
    `base1:Electabuzz` at threat 40 and `base1:Machop` at threat 40 both score Agility **35.75**.

    **The file says so itself without noticing.** The comment above that term reads *"TWO TERMS
    BECAUSE THERE ARE TWO THINGS BEING PREVENTED"* — damage, linear, and the Knock Out, squared.
    Both of them are damage. The same block quotes Trevor calling Agility *"the same shape as Ice
    Beam… instead of inflicting paralysis it has a coin flip that prevents all damage"*, which was
    the right model in August and is the half-model his own note has now outgrown: **"Agility buys
    turns through damage *and status* denial on a coin flip."**

    **It is smaller than it looks and that is the reason to size it before building it.** The barrier
    already denies their whole turn when the flip lands, so the damage term is picking up most of the
    value by accident. The genuine increment is only the status that would have **outlived** that
    turn — a Sleep or Paralysis still on you the turn after. That is not nothing, and it is not the
    whole of a status weight either.

    **Do not build this before item 5.** Pricing it means reaching for `paralyze`/`sleep`/`confuse`,
    and item 5 records that the Sleep weight is still unsettled — its arithmetic now says 17.3 against
    a shipped 22. Adding a second consumer of a weight nobody has validated is how a wrong weight gets
    load-bearing. *(Corrected 16 Sep 2026: this said "three methods that disagree — 0.67, 1.20 and a
    shipped 0.85" for a day after #41 had closed the arithmetic. The blocker survives; the reason for
    it changed.)* *[The row, with the measurement attached →](../PLAYBOOK.md)* —
    `tools/claimtest.js --open`.

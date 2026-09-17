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

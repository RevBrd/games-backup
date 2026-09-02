# Defender blunts an attack's self-harm, and is used up if it spends its whole 20

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled with Trevor 29 Aug 2026**, from a grab bag note: *"Defender should also defend from
self-harm the turn that it's placed, per GBC. If it takes 20 damage from self-harm, it's used up. If
it takes 10 damage, it's free."*

## The rule

**An attack's self-damage is damage done by an attack**, so it passes the same `DAMAGE_REDUCTION`
band that the attack's damage to its target passes — on the attacker's own slot. And **a Defender
that fully spends its 20 is discarded there and then**, rather than lasting into the opponent's turn.

| Self-damage | Lands | The Defender |
|---|---|---|
| 30 (Arcanine, Take Down) | 10 | **used up and discarded** |
| 20 (Machoke, Submission) | 0 | **used up and discarded** |
| 10 (Fossil Gastly, Energy Conversion) | 0 | **survives at full strength** |

## Why it departs from the printed card, and why that is step 1 rather than step 3

The card reads *"Damage done to that Pokémon by attacks is reduced by 20 (after applying Weakness and
Resistance)."* **Take Down's 30 is damage done to that Pokémon by an attack** — its own. So the
absorption half is arguably not a departure at all; it is the printed text read literally, and the
engine was the thing being loose by routing recoil around `computeDamage` entirely.

**The consumption half IS invented, and it is the half worth defending.** Nothing else in this
engine's reduction band is consumed by use — Minimize, Pounce, Snivel and Defender itself are all
duration effects. Adding a spend condition for one card is exactly the shape
[RULINGS.md](../RULINGS.md)'s tiebreaker warns against: *prefer the reading with fewer live
dependencies.*

**Trevor's argument beat that and it is the reason the entry exists.** Without consumption, this is a
pure free buff — you would always want a Defender on a Take Down Arcanine and there would be no
decision in it. **Consumption is the price that makes it a choice**, and it tells a coherent story:
the card does exactly what it prints against your opponent, and spending it early on your own attack
costs you the shield you would have had. Harden is the standing precedent that a discrete threshold
is fine in a *rule* where it would be a cliff in a *scorer*.

## The phrasing is load-bearing: "spends its whole 20", not "20 is used up, 10 is free"

Same outcomes, and the reason for the change is rot. The note's original 10/20 pair is a pair of
magic numbers that would need re-deriving the moment anything self-damaged an amount the reduction
does not divide. **"It is discarded when it fully spends its 20"** already knows what to do with 25,
and it states the rule against the thing that matters rather than against two values that happen to
coincide with it today.

## The question that dissolved, which is worth keeping

The obvious follow-up was whether Defender is consumed only by the holder's own attack or by any 20+
hit including the opponent's. **Trevor: it does not matter, because of when the card is live.** Its
window is the rest of your turn plus the opponent's next turn — so it contains **at most one
self-harm event (yours) and at most one opponent attack (theirs), in that order**. Consumption from
the opponent's side always coincides with the natural expiry at the end of that turn, so the two
readings are behaviourally identical.

**So the implementation takes the one with no source check at all**, which is one condition rather
than two. A question that dissolves is better than a question answered.

## The scope, and the line that generates it

Defender's own text says *"(after applying Weakness and Resistance)"*. **So the band is the W/R band,
and the corollary is the whole scope rule: anything that skips Weakness and Resistance skips this.**

| | blunted? | why |
|---|---|---|
| `RECOIL`, `RECOIL_ON_FLIP`, the pending recoil from `FLIP_BONUS_OR_RECOIL` | **yes** | damage done by an attack |
| Thunderstorm's per-tail self-damage (`BENCH_SPLASH_PER_FLIP`) | **yes** | same — and see below |
| Confusion's 30 to itself | **no** | `engine.js` already rules it not an attack's damage and never gives it W/R |
| Poison | **no** | a between-turns clock, not an attack |
| Rainbow Energy's 10 on attachment | **no** | not an attack at all. See [RAINBOW-ATTACH-DAMAGE.md](RAINBOW-ATTACH-DAMAGE.md) |

**Both negative cases are asserted in `powertest.js`, and both were watched going red** — the
positive cases against a sabotaged reduction, and the Confusion case against a version that
deliberately leaked Confusion into the band. A boundary that has only ever been green does not prove
it is a boundary.

**Deliberately NOT the whole defensive stack.** Barrier, Harden, the halving family and the
prevent-on-flip family are different verbs with different printed wording; widening to them was not
asked for and is not implied by this. The `DAMAGE_REDUCTION` kind holds exactly **Defender and
Minimize** in the live sets. Pounce and Snivel carry `fromUid` and exclude themselves for free, which
is correct — a reduction placed by somebody else is not a reduction against yourself.

**Minimize blunts and is never consumed.** Consumption is a property of the **card**, not of the
effect: `e.card` is what tells a Defender from an attack's lingering effect, and it was already in
the data. A duration effect expiring early would be a second, unasked change.

## A fourth self-damage site, which this found

[PREVENTED-DAMAGE-RECOIL.md](PREVENTED-DAMAGE-RECOIL.md) says `runAttack` has **three** recoil sites
and it is right about the `RECOIL` family. **Zapdos' Thunderstorm is a fourth self-damage site under a
different verb** — `BENCH_SPLASH_PER_FLIP`, self-damage per tail — and nothing had enumerated it. It
is correctly *not* gated on `stopped`, since its damage comes from its own coins rather than from the
opponent's hit landing, which is the same principle that leaves Tauros confusing itself. It is routed
through the band like the other three. **Grep `selfDamage` in `engine.js` for the live set rather than
trusting a count in any file, including this one.**

## The AI half, which is a separate job and was done in the same commit

**A rule proven in `scoreAttack` does not reach `scoreTrainer`** — the standing invariant, and it
applies here exactly. Without a scoring change the bot owns a capability it can never reach for,
which is the silent-failure surface arriving in the Trainer path. `scoreTrainer`'s `T_DEFENDER` case
now prices the prevented self-harm **as the barrier it is**, reusing `shieldSelf`'s own curve rather
than inventing a second notion: linear in the damage stopped, squared in the share of remaining HP,
off `selfKO`. See [AI-INVARIANTS.md](../AI-INVARIANTS.md) for the entry and its known limit.

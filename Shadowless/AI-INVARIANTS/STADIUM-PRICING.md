# 15 Sep 2026 — every Stadium kind gets a branch, and the bench cap is asked, not assumed

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `scoreTrainer`'s `T_STADIUM` chain, `gymNamed`, every bench-room calculation in `ai.js`

---

**Job 17a** · #41 · found by reading the Gym Heroes work rather than by playing it.

Two faults, one family. Both are a rule the engine implements correctly that the **scorer cannot
see**, so nothing is ever wrong on the board and nothing is ever red in a suite.

## 1. Two of the seven Gyms were worth exactly zero to play

`T_STADIUM` prices a Stadium by its `gym:` kind through an `if`/`else if` chain. It handled five
kinds. **`STADIUM_HEAL_STATUS_NAMED` (Celadon City Gym) and `STADIUM_ATTACK_BONUS_NAMED` (Vermilion
City Gym) fell off the end of it** and contributed nothing, so the bot would put either card down
only when the unrelated "replace a Gym that is helping them" term below happened to fire.

**This is the unscored-verb surface one level down.** The usual version is a verb with no `case`,
which [AI.md](../AI.md) has been chasing for a month. This is a `case` with no branch for half its
parameters — and it is *quieter*, because the verb is demonstrably scored and a reader checking
"does `ai.js` know about `T_STADIUM`" gets a yes.

**Celadon is the sharper of the two, because half of it WAS scored.** Its *use* has a proper scorer
in `scoreStadiumAction`, priced off `T_FULL_HEAL`. So the bot knew exactly what the Gym was worth
once it was on the board and had no idea whether to put it there — and a spot check of "is Celadon
handled" finds the half that is.

**What they are priced at now, both PROVISIONAL:**

| kind | term | why that shape |
|---|---|---|
| `STADIUM_ATTACK_BONUS_NAMED` | `(mine - yours) * 3` | name-scoped, so same shape as the retreat gyms — but **below** them, because the card says "he or she MAY flip". An option is worth less than an unconditional discount, and its two faces are +10 to them and 10 to yourself. |
| `STADIUM_HEAL_STATUS_NAMED` | `(mine - yours) * 2 + afflicted * 6` | the margin buys the *outlet*; the second term is whether anything is afflicted right now. A Gym that can heal nothing is not worth a Trainer play this turn, and it is still playable next turn. |

**The guard is the part that outlives the numbers.** `selftest.js` now asserts that every `gym:` kind
declared by a card appears in the `T_STADIUM` chain. That is the **third** end of a string whose
other two ends were already guarded: `effects.js` against `engine.js` catches a Gym that *does*
nothing, and this catches a Gym that *is never played*. Watched going red before being trusted.

## 2. `benchCap()` was one doorway with nine people walking round it

Narrow Gym rewrites the bench limit, so `engine.js` routed every read through `benchCap()` and its
comment said *"a selftest assertion keeps the twelfth caller from reading cfg directly."*

**No such assertion existed**, and there were nine direct `cfg.benchMax` reads outside the engine —
five in `ai.js`, four in `ui.js`. The engine itself was clean the whole time, which is why it
survived: the doorway worked, and everyone who walked around it was in another file.

**A claimed guard is worse than an absent one.** The next person to write a bench-room calculation
reads that sentence and believes they are covered. This tree's standing diagnosis is *a correction
that leaves a human instruction behind*; this is the same shape one step earlier — an instruction
that was never true in the first place. **Grep the symbol, not the file.**

**Severity, honestly stated.** Two of the nine were harmless: `T_REVIVE` and `T_POKEMON_FLUTE` test
the cap redundantly and `legalActions()` had already filtered them with `benchCap()`, so nothing
could hang. The other seven over-count room by one while Narrow Gym is out — a Bench search priced
for a slot that cannot be filled, a picker offering a tile the engine will refuse. **The whole family
this project keeps finding: the wrong answer is a plausible one.**

**Two reads survive and they are DRAWING rather than DECIDING.** `ui.js`'s two bench-slot loops still
read `cfg.benchMax`, because the mat has five zones silk-screened onto it and a Gym imposes a rule
rather than repainting cloth. The guard matches those **by shape** — the literal `for` loop — rather
than exempting them by name, so a third one has to be a deliberate act of writing the same loop. What
tells the player about the cap is the Stadium strip, in words. *[Why the zones stay at five
→](../SCREENS.md)*

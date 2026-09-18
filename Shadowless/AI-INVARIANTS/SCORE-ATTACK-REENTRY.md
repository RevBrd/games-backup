# 17 Sep 2026 — nothing inside `scoreAttack` may ask what a card is worth

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `scoreAttack`, `bestAttackScore`, `cardKeepValue`, `shortfallFor`, `attackShortfalls`,
and every future caller that wants a card's worth from somewhere it should not

---

**Job 17b** · #42 · AI.md item 19, named 11 Sep 2026 in Job 16 and lifted on 17 Sep. The rule itself
is in [AI.md](../AI.md)'s body under *Nothing inside `scoreAttack` may ask what a card is worth*,
because three other entries in this folder cite it and a rule cited three times does not belong in a
list of finished work.

**The invariant: no function reachable from inside `scoreAttack` may ask what a card is worth.
Cost questions are read with `shortfallFor` or `attackShortfalls`, which read costs and score
nothing. A Trainer in `cardKeepValue` stays a flat 2.5 for the same reason.**

## Why it is structural and not a bug

```
scoreAttack -> cardKeepValue -> potential -> potentialOf
            -> scoreAttackHypothetical -> scoreAttack
```

`cardKeepValue` is the correct question for a tutor, a discard, the Prize picker and the cycle
Trainers. But its Energy branch read `potential()` to decide whether an Energy was wanted, `potential`
evaluates every attack the slot could make, and evaluating an attack is `scoreAttack`. The cycle is
not a mistake anybody made; it is what happens when a valuation function is asked to value the thing
that calls it.

**It bit twice in one session, in two different functions.** An hour before the `cardKeepValue` case,
Tunneling's self-lock priced *next* turn's attack by asking `bestAttackScore` for *this* turn's best
— and `bestAttackScore` scores every attack.

**The tell is that it fails LOUDLY and somewhere else.** Both times the gate reported
`Maximum call stack size exceeded` from a test three files away — a Stadium row, then the evolution
destination row. Neither failing test was anywhere near the fault. **Read the trace, not the test
name.**

## The two safe shapes

- **One level lower.** A function that reads the board but does not score it. `bestAffordableDamage`
  is printed damage where `bestAttackScore` is score; `shortfallFor` is symbols-missing where
  `potential` is value.
- **Structural and flat**, with no board read at all. A tutor is *a draw you get to choose*, so it is
  worth somewhat more than a draw and nothing cleverer than that. `cardKeepValue`'s Trainer branch is
  the live example: a flat 2.5, with the comment saying why it is not something better.

## The lift, and what it measured

Item 19 proposed a "cheap mode" for `cardKeepValue` that skipped the `potential` read. **It needed
none.** The only branch reaching the scorer was the Energy one, asking `potential().short > 0` — and
`potentialOf` computes `short` with the **same loop** as `shortfallFor`, which reads costs and scores
nothing. The call was swapped rather than guarded.

| Measurement | Result |
|---|---|
| live comparisons over 60 ladder games | **16,593, disagreeing zero times** |
| `abtest 8 HEAD --pairs 400` | **0 of 3,200 games diverged** |

A swap of two expressions of the same arithmetic, confirmed to be the same arithmetic on real boards
rather than by reading both. **`cardKeepValue` is safe to call from anywhere now**, which is what
item 17's Energy queue needed.

**What the lift did NOT do is repeal the rule.** It removed one caller from under it. The cycle is
still reachable the moment somebody asks `potential`, `scoreAttackHypothetical` or `bestAttackScore`
from inside the attack scorer, and the comment above `cardKeepValue` says so in the file that would
have to obey it. **`scoreAction` is not `scoreAttack`** — that distinction is what makes the Sleight
of Hand pitch legal, and it is worth checking which one you are in before calling.

## The AI.md item as it read, verbatim

Moved out of [AI.md](../AI.md)'s open list on 18 Sep 2026 by #43, once the item's rule had been
promoted into that file's body. Indentation is the list's; nothing else is changed.

    ~~**`scoreAttack` cannot ask what a card is worth.**~~ **LIFTED 17 Sep 2026 (#42), and it needed
    no cheap mode.** The only branch of `cardKeepValue` reaching the scorer was the Energy one, asking
    `potential().short > 0` — and `potentialOf` computes `short` with the **same loop** as
    `shortfallFor`, which reads costs and scores nothing. Swapped: 16,593 live comparisons over 60
    ladder games disagreed zero times, and `abtest 8 HEAD --pairs 400` diverged 0 of 3,200.
    **`cardKeepValue` is now safe to call from anywhere**, which is what item 17 needed.
    **The lesson survives the fix and is kept below**: nothing that `scoreAttack` can reach may ask a
    question whose answer is `scoreAttack`. The item itself is one hop away.

    **`scoreAttack` cannot ask what a card is worth — 11 Sep 2026, Job 16.** A structural limit rather
    than a missing weight, and it cost a stack overflow twice in one session before it was named.

    ```
    scoreAttack -> cardKeepValue -> potential -> potentialOf
                -> scoreAttackHypothetical -> scoreAttack
    ```

    `cardKeepValue` is the right question for a tutor, a discard or anything that moves a card — it is
    what the Prize picker and the cycle Trainers ask, and AI.md item 17 is an argument for using it
    *more*. But it reads `potential()` to decide whether an Energy is wanted, `potential` evaluates
    every attack the slot could make, and evaluating an attack is this function. **Nothing reachable
    from inside `scoreAttack` may ask what a card is worth, because that question is answered by
    `scoreAttack`.**

    The same shape bit `bestAttackScore` an hour earlier: Tunneling's self-lock priced next turn's
    attack by asking for this turn's best, and `bestAttackScore` scores every attack.

    **The tell is that it fails LOUDLY and somewhere else.** Both times the gate reported
    `Maximum call stack size exceeded` from a test three files away — a Stadium row, then the
    evolution-destination row — so the stack trace, not the failing test name, is what points at the
    cause. Read the trace before believing the test that failed is the test that is wrong.

    **The two safe shapes**, both now used here:
    - price it one level lower, in a function that reads the board but not the scorer —
      `bestAffordableDamage` is printed damage where `bestAttackScore` is score;
    - or price it structurally and flatly, with no board read at all. A tutor is *a draw you get to
      choose*, so it is worth somewhat more than a draw and nothing cleverer than that.

    **What it would cost to lift:** giving `cardKeepValue` a cheap mode that skips the `potential`
    read — the Energy branch is the only one that reaches it — which would make the natural valuation
    available everywhere. Worth doing when the second card needs it; one flat weight is not yet
    evidence of a problem.

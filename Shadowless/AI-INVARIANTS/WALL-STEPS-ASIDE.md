# 18 Sep 2026 — a Prize is not "hitting harder", and a wall steps aside for one

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** the `koGain` term in `scoreAction`'s retreat case, and the two exceptions that lift the
wall suppression on it

---

**Job 17b** · #43 · AI.md item 1's second site, with the rule from Trevor on 18 Sep 2026.

**The invariant: the retreat comparison has TWO currencies now. `delta` is printed damage and says how
hard the arriving body hits; `koGain` is a probability and says whether that is enough. A wall
suppresses the second by default, and the suppression lifts on whichever of two squared exceptions is
nearer — their Prizes, or their Bench.**

## What it replaced, and the sentence that stopped being true

```js
let delta = this.bestAffordableDamage(pi, b) - this.bestAffordableDamage(pi, me.active);
// ...both sides are measured in printed damage because that is the only currency they share.
```

**That comment was correct for eleven weeks and stopped being true the morning `forecast` took the
attacker as a parameter.** *[The rung that appeared →](SLOT-KO-CHANCE.md)* Printed damage says how
hard; it cannot say whether that is enough, and "enough" is the whole of a retreat that exists to
cash a Prize.

## Trevor's rule, and the reason underneath it

Asked whether a wall should retreat to bring up something that can take a Prize:

> **I wouldn't retreat a wall to bring up a killer unless the opponent was low on prizes.**

Shown a board where it fired anyway, he gave the reason — and **the reason is not about walls at
all.** The short form: what is behind *their* Active, and what is behind *ours*. With a few bench
Pokemon on their side and only the wall and the attacker on ours, spending the attacker risks having
nothing to go to; better to stall, draw, and get something stronger ready. **But if they are low on
bench Pokemon, the Knock Out threatens to leave them with no Pokemon at all** — a board-out win rather
than a prize-out. *[His answer in full →](../Playbook/WALLS.md)*

**So the default is HOLD**, and there are two exits. Both are graded, both squared, neither is a
threshold:

| Exit | Curve | Why that curve |
|---|---|---|
| **their Prizes** | `1 / left²` | `retreatPrize` already prices "close to winning" as `60 / left²` twenty lines down. Reusing the arithmetic rather than growing a second notion of it |
| **their Bench** | `1 / (1 + n)²` | `scoreAttack` already knows emptying their board wins outright. This is the same win condition one move earlier, seen from the decision that puts the attacker up there |

`urgent` is the larger of the two, and only the **positive** half is suppressed — matching `delta`'s
existing asymmetry exactly. Walking a wall *away from* a Knock Out it could land is a loss and costs
full price.

## What it does, as a grid

Chansey Active on one Double Colorless (Scrunch only), a charged Hitmonchan benched, their Active on
20 HP — so retreating takes a Prize this turn. **The chosen action**, not the score:

| their bench | they need 6 | need 3 | need 1 |
|---|---|---|---|
| **0** | **retreat** | **retreat** | **retreat** |
| 1 | Scrunch | Scrunch | **retreat** |
| 2 | Scrunch | Scrunch | **retreat** |
| 3 | Scrunch | Scrunch | **retreat** |
| 5 | Scrunch | Scrunch | **retreat** |

Chansey holds through the midgame, steps aside for the Prize that ends the game, and steps aside
early only when there is nothing behind their Active.

## The measurement

| | result |
|---|---|
| `abtest 8 HEAD --pairs 400` | **41.1% ± 1.7 diverged** — retreat decisions come up every turn |
| `aiduel 8 HEAD --gbc` | **51.0% ± 0.4** over 67,583 games. *BETTER — significant* |
| `aiduel 8 HEAD --control --gbc` | **49.9% ± 0.4**. *no significant difference* |

**The Prize half alone measured 40.7% divergence and the bench half took it to 41.1%** — so the second
exception did not widen the reach, it redirected it. Read that as evidence the two clauses bite on
different boards rather than one dominating.

## Two things I got wrong building it, both worth more than the term

**A SCORE IS NOT A DECISION.** The retreat went from −0.60 to +5.40 and I read that as the wall rule
failing. It was never chosen: Scrunch beat it at 24.89. I spent a while trying to force the number
down before running `explain()` on the board, which is one call and shows the whole ranking.
*[The entry →](../MISREADINGS.md)*

**A RULE WITH A MISSING INPUT DOES NOT READ AS MISSING.** The first version had only the Prize
clause, and the board I tested it on gave the opponent **no bench at all** — which is the second
clause's own exception. So it looked like the Prize curve misfiring, when it was the bench clause,
unbuilt, firing correctly. **I would have "fixed" the half that existed to compensate for the half
that did not.** That is the shape to watch for whenever a rule arrives in pieces: the built half
absorbs the blame for the missing one, and the fix makes it permanently wrong.

## Still open

**Our own bench depth is the half not built**, and it is Trevor's too: *"a deep bench once all the
actual blows start landing can be a big asset"*, and *"you don't have to worry too much about the
Charizard/Blastoise example […] if you have two Blastoises."* That is a cost on committing a body
rather than a benefit on taking a Prize, so it belongs with `commitExposure` in `promoteValue` — item
20's open half — where it would reach both sites instead of being bolted onto this one.

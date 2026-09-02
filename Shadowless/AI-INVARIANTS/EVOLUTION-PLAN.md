# 1 Sep 2026 — the plan is the whole line, and the evolve goes before the attach

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `evolutionPlan`, `roadWant`

---

**`evolutionPlan`, `roadWant`, and the evolve promotion in `playFirst` — #32, from Trevor's account of
the GBC game and Pocket.** *[His words, the three numbers and the deck-arm framing →](../Playbook/EVOLUTION-TIMING.md)*

**THE INVARIANT. A card on an evolution road wants its destination's cost MINUS one Energy per
remaining evolution step**, because each step is a turn and each turn brings an attachment. The line
finances itself.

```
roadWant = destShort(deepest form the hand can reach) − steps
```

**The rule three entries above is this one truncated to depth 1**, and `readiness > 1` is
`roadWant > 0` when `steps` is 1 — so nothing about the one-step case changed. **`roadWant` is the
single quantity all three call sites now read**, which is what stops them drifting apart again.

**Only cards in HAND count.** The plan must be a certainty; the deck arm is open item 9 and its
framing changed today — see that item, and do not inherit its old scope estimate.

### The same card wants a different amount depending on the depth

That is the thing no per-card target could ever express, and it is why this had to be derived:

| Abra, with… | destination | steps | target |
|---|---|---|---|
| Kadabra **and Alakazam** in hand | Confuse Ray `PPP` = 3 | 2 | **1** |
| Kadabra alone | Super Psy `PPC` = 3 | 1 | **2** |

Both are claim rows and **both are needed** — a single row is green under a rule that ignores depth
entirely, which is what shipped hours earlier. The Kadabra row that already existed **had to be
rewritten**: it asserted a third Psychic, was built on the depth-1 truncation, and went red the moment
this landed. **The bot was right and the claim was wrong**, for the second time in this file's history.

### The evolve promotion, and the guard that is the whole safety of it

`playFirst` now promotes an evolve ahead of the attachment. #31 named this case and declined it,
reasoning that `attachBuild` already looks ahead through `evolutionInHand`. **True of the attachment's
value; not true of the BODY** — after the evolve the card competes for the Energy as the evolved form,
so `survivesCharge` prices a Kadabra at 60 HP rather than an Abra at 30.

**ONLY A READY EVOLVE IS PROMOTED (`roadWant === 0`).** An evolve the readiness rule is deliberately
holding back must never be promoted, or an ordering rule silently overrules a scoring rule two
functions away. Both directions are pinned, and the control was watched: removing the promotion turns
the ready test red and leaves the unready one green.

**`playBasic` remains deliberately unextended** — #31 flags it as the one with a real case of its own.
Trevor's observation was about evolving; extending an ordering rule because its argument happens to
reach is how a narrow fix becomes a turn-structure rewrite.

### Measured — 63.8% divergence, the second-largest change on record here

`abtest 8 HEAD`, full ladder pool:

| | |
|---|---|
| games per side | 17,296 |
| **diverged** | **11,042 — 63.8%** |
| median first difference | **action 24** |
| subject-deck wins, HEAD → working | 48.6% → 48.5% |

**Second only to #31's turn-ordering change at 75.6%**, and for the same reason: evolution roads run
in most decks in the format, so a rule about how long one is fires on most turns of most games. The
median at action 24 rather than action 3 is right — this changes the middle of a turn sequence, not
the opening play.

**`abtest` rather than `aiduel`, and the win rate is the uninformative half as always.** Both seats
play under the same rule; divergence is the question a symmetric change can answer.

**Stalls: 334 of 17,296, a rate of 1.93%.** The documented identical-tree floor is 308 on this exact
command and #31's comparably-diverging run read 341, so this sits between them. Per the two entries in
[MISREADINGS.md](../MISREADINGS.md), **a diverging run is not playing the floor's games any more** and
the floor is the wrong baseline — the rate against the 1.8% band, and the neighbouring diverging run,
are what say this is the sample moving rather than a pathology.

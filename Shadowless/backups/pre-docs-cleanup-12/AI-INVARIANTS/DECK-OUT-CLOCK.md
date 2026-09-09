# 7 Sep 2026 — the opponent's deck is a clock, and a bought turn is worth more while it runs

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `deckOutClock`, both copies of `turnScale`, `W.deckOutRange`

---

**`deckOutClock`** · Job 15f · a Fossil Moltres note of Trevor's whose subject turned out to be the
whole bot rather than the card.

**The invariant: `ai.js` may read the opponent's deck, and what it means there is a clock we win by
outliving.** Before this, `deckRisk(pi, burn)` read `players[pi].deck` — **ours** — and `deckLoss: 150`
correctly priced running ourselves out as a loss rather than an expensive draw. **Nothing in the file
had ever read `players[1 - pi].deck`.** The mirror image of that loss was therefore invisible: they
draw every turn whether we act or not, and if we are still standing when they cannot draw, we win.

## Why nothing had scored it, which is the transferable part

**A turn passing is progress toward that win and it is not an action.** The scorer prices actions
against the board in front of them, so a win condition that advances *by itself* has nothing to
attach to. That is a different shape from every other gap in this folder, all of which were an action
priced wrongly. **Look for this shape again**: any win or loss condition that ticks on its own is
invisible to an action scorer by construction, not by oversight.

## The hook, and why it is a floor rather than a term

Two places compute *what is a turn worth* and both derived it purely from damage:

```js
const denied    = Math.min(danger, hpLeft);
const turnScale = denied / AVG_ATTACK;
```

Against something that threatens nothing that reads **zero**, so a paralysis on a harmless opponent is
worth nothing — which is right, until their deck is nearly empty and a turn bought off them is a turn
closer to the game ending in our favour. So:

```js
const turnScale = Math.max(denied / AVG_ATTACK, this.deckOutClock(pi));
```

**A `max` and not a sum, deliberately.** Where real damage is being denied the damage reading is
already the larger number and nothing changes at all; the clock only speaks where the old answer was
near zero. That makes the change additive in effect but not in arithmetic, which is what keeps it from
disturbing the boards it was not written about.

**`deckOutClock` ramps and does not step.** Zero at `deckOutRange` cards and rising linearly to 1 at
an empty deck. `CLAUDE.md` names *"a quantity that should fall away with distance from an edge,
written flat with a cliff at the end"* as this project's most repeated fault, and this is exactly that
shape of quantity.

## Measured

| | |
|---|---|
| **Divergence** (`abtest 6 HEAD --pairs 200`) | **3.4% ± 1.0** of 1200 games per side |
| **Median first difference** | action **139** — deep late game, which is where a deck gets short |
| **Win rate** | 49.4% → 49.3%, i.e. unmoved, which is correct for a symmetric change |

**3.4% is higher than the shape of the change suggests and that is worth understanding rather than
celebrating.** A 60-card deck loses 13 to the opening hand and Prizes, so a bot drawing one a turn
would need past turn 30 to see fifteen left — but Bill, Oak and Computer Search mean real games get
there far sooner. The change is genuinely late-game and genuinely fires.

**Do not read the flat win rate as "it did nothing".** `abtest` puts the same bot on both seats, so a
symmetric change cancels in the win column by construction; divergence is the headline and 49.3% is
the control working. *[Which instrument answers which question →](../MEASUREMENT.md)*

## What is deliberately NOT built

**Risk aversion, which is the larger half.** If we win by outliving their deck, we should also take
*fewer* risks while the clock runs — decline the recoil attack, avoid the trade that might cost the
Active. That lives in `selfKO` and the recoil pricing, not in `turnScale`, and scaling it is a broad
change to the bot's whole posture rather than a floor on one term.

**It was left out on purpose and not forgotten.** A first, unmeasured weight should not arrive
attached to a general re-tune; this one can be judged on its own. *[The remaining half →](../AI.md)*,
open item 15.

**`W.deckOutRange: 15` is a guess.** Nothing has measured where a deck becomes short enough to plan
around, and it cannot go on `selftest.js`'s `PROVISIONAL` list, which holds effect verbs — so it is
recorded in `AI.md` beside `prizeIndex` and `wallRoadInDeck` for the same reason.

## The two copies

`scoreAttack` and `statusWorthAgainst` both answer *what is a turn worth*, neither reads the other,
and both now carry the floor. **That duplication is the hazard here** — it is the shape
[MISREADINGS.md](../MISREADINGS.md) keeps finding, and Job 15d's whole finding was fourteen copies of
one dispatch in three versions. Both sites carry a comment saying so. **Change one, change both.**

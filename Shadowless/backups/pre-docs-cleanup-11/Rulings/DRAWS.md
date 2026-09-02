# A game can be drawn, and a draw pays nothing

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled with Trevor 18 Aug 2026**, while scoping Dark Wartortle's Mirror Shell — which reflects
damage from a Pokémon that may already be Knocked Out, and is therefore the most likely card in the
era to finish both players at once.

**Both players can meet a win condition on the same action, and when they do the game is a draw.**
It pays nothing, unlocks nothing, and is recorded as its own statistic rather than as a loss.

## It was already reachable, and it was already wrong

This is not a Team Rocket feature. `checkKOs` asked its win conditions **inside** the Knock Out loop
and returned on the first one it found, and the loop always looked at seat 0 first — so **seat 1 won
every simultaneous finish**, which is the CPU. Measured before the change, with both Actives lethally
damaged and both players on their last Prize:

```
winner: 1
reason: P1 took all Prizes
P0 active: false     P1 active: true
```

Seat 1's Pokémon is **still standing** — its Knock Out was never processed at all. Destiny Bond,
Machamp's Strikes Back and any mutual Selfdestruct could all reach this, so it had been live since
Base Set.

**Every Knock Out now resolves before anybody wins**, and the question is asked once for both players
together. That is the same shape as the [empty-board fix](../ENGINE.md) two days earlier and for the
same reason: a rule that was right when written, and was never revisited when new routes arrived.

## `winner: 'draw'`, and why not null

**Trevor's word**, from the Game Boy game and Pocket, which both use it.

The value matters more than it looks. **`winner === null` is the in-progress sentinel** that every
loop in the project tests — the AI harnesses, the UI, `selftest.js`. A draw stored as `null` would
read as *keep playing* and hang. `winner` is now `0 | 1 | 'draw' | null`, and there is a test whose
only job is to assert a draw is not null.

## What a draw is worth

**Trevor's call: nothing, identical to a loss, marked differently.** No packs, no unlock, `recordLoss`
on the ladder, and `stats.draws` rather than `stats.losses`.

The separate counter is the part worth defending, since nothing reads it yet. **A run that draws is
telling you something a run that loses is not** — that two decks are killing each other — and folding
it into losses destroys that permanently and cheaply. It is an additive save field, so it needed no
migration: a save written before draws could happen has drawn zero games.

**The alternative considered and rejected was sudden death**, which is what the modern rules do. It is
a whole extra mode to make a rare event feel less flat, and *"nothing happened"* is the honest
outcome. Open to revisit if draws turn out to be common enough to be annoying — which would itself be
information worth having.

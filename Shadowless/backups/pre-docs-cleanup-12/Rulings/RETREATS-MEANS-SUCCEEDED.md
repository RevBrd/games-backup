# "Retreats" is the retreat that worked; "tries to retreat" is the attempt

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 18 Aug 2026, Job 10c, with Trevor** — he read the card and agreed with the reading before
it was built.

**Dark Dugtrio's Sinkhole fires when the opponent's Active *retreats*, and a retreat that failed is
not a retreat.** So it does not fire on:

- **a Confused retreat that flipped tails** — the Energy is paid and the Pokémon stays Active. This
  is the live case, and it is the one that looks unfair
- Switch, or any Trainer that moves the Active
- Whirlwind, Gust of Wind, or any attack that drags
- Teleport, Step In, or any Power that swaps

Only the retreat action, only when it succeeded.

## The evidence is in the era itself, which is unusually lucky

This would be a coin-flip judgement call on the wording alone. It isn't, because **Neo 4 prints the
other half of the sentence**: Unown [C]'s [Chase] reads *"whenever your opponent's Active Pokémon
**tries to** retreat"*.

Nobody writes "tries to" unless the plain word already means the successful one. Two cards, one
mechanism, and the difference between them is the whole distinction — which retroactively settles
Sinkhole harder than any amount of reasoning about intent could.

**This is worth remembering as a method and not only as a result.** When a wording is ambiguous, look
for a later card that says the *other* thing explicitly. The WotC designers drew the distinction on
purpose; finding the pair is better evidence than deciding what they probably meant.

## The failed Confused retreat, stated plainly because it will look wrong

A Confused Pokémon that pays its Energy and flips tails has: lost the Energy, used up the turn's
retreat, stayed Active, stayed Confused — and taken nothing from the Sinkhole it was retreating into.

That reads like the card missing a trigger it should have caught. It isn't. The Energy loss is
settled separately in [CONFUSED-RETREAT.md](CONFUSED-RETREAT.md) and is a cost paid up front for an
*attempt*; Sinkhole is priced against the *result*. A card that wanted the attempt would have said
so, and one does.

## Two smaller consequences

**Every copy fires its own.** Sinkhole is a Power and Powers work wherever their Pokémon is unless
the card says otherwise — Sinkhole doesn't — so a Bench holding four Dark Dugtrios takes four
separate coins, and retreating into that board is a different proposition from retreating into one.
Same shape as several Muks each carrying their own Toxic Gas.

**The damage lands on the Pokémon that left, which is on the Bench by the time it lands.** The card
says not to apply Weakness and Resistance, so the fact that it is no longer Active changes nothing —
but the ordering is real, and the hook fires after the switch rather than before it.

## What is deliberately not built

`onAttempt` is reserved on the Power object for Unown [C] and **is not implemented**. Building a flag
for a card two sets away is how a shape gets guessed wrong; the note exists so the next instance
knows the distinction was seen rather than missed.

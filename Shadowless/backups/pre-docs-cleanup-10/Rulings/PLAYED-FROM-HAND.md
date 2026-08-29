# "When you play this from your hand" means from your hand, and nowhere else

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 18 Aug 2026, Job 10c.** Step 1 of the post-Fossil order — the printed text settles it —
which is why the interesting half of this entry is not the ruling but the *count*.

**A Power that says "when you play this from your hand" fires when the card is played from hand:
benched as a Basic, played as an Evolution, or put down by Pokémon Breeder. It does not fire when the
card reaches play any other way**, and it does not fire during the opening setup.

Twenty printings across six sets read this way, starting with Team Rocket's Dark Dragonite, Dark
Golbat and Dark Slowbro. A Dark Golbat that got there by Pokémon Flute must not do its 10 damage.

## Eight doorways, and only three of them are hands

The reason this is a ruling rather than a comment is that the answer is not obvious from any single
place in the code. Every path a Pokémon can take into play, as of Fossil:

| Path | From | Fires? |
|---|---|---|
| the opening setup | hand | **no** — face down, nothing has begun |
| `doPlayBasic` | hand | **yes** |
| `doEvolve` | hand | **yes** |
| Pokémon Breeder | hand | **yes** |
| Revive | your discard pile | no |
| Pokémon Flute | *their* discard pile | no |
| `SEARCH_BASIC_TO_BENCH` (Call for Family, Sprout) | deck | no |
| `EVOLVE_SELF_FROM_DECK` (Rapid Evolution) | deck | no |

Summon Minions itself is a ninth, and it benches from the deck, so a Power arriving that way is
silent too.

**The opening setup is the one that could go either way and doesn't.** The cards genuinely come out
of your hand. But setup is arranging face-down cards before the game has begun — nothing is revealed,
no turn has started, and there is no opponent board to aim a Sneak Attack at. No card in the era
fires during setup and none is written as though it might.

## Which side the default points, and why it is the opposite of the last one

[POWER-IS-NOT-AN-ATTACK.md](POWER-IS-NOT-AN-ATTACK.md) puts its default on *true* and makes the
exceptions declare themselves. This one points the other way: **silence is the default and the three
hand paths declare themselves.** The two rulings are one week apart and they disagree on purpose.

The test in both cases is *which set is small and closed, and which one grows*. Attack damage is the
growing set, so it gets the default. **"From hand" is the closed one** — there are only so many ways
to play a card out of your hand, and the concept is not one that sets extend. What Gym and Neo keep
adding is new ways for a Pokémon to arrive from a deck, a discard pile, or another Pokémon.

Get this backwards and the failure is a rules bug that is loud but wrong; get it right and a new
deck-search verb written in Neo is correct without knowing this file exists.

## The guard, which is the part worth copying

A rule like this is enforced by everyone remembering it, which means it is not enforced.

So `engine.enterPlay(pi, slot, {source})` is the single doorway, and it is **hung off something no
path can omit**: it does the `playedTurn` / `evolvedTurn` stamp and the Special Condition clear that
every path already needs, and that `canEvolve` and Cowardice already read. A path that forgets to
call it is visibly broken within a turn, rather than quietly failing to fire a Power.

`selftest.js` then asserts statically that every method in `engine.js` containing a `mkSlot` or a
`stack.push` also calls `enterPlay`, so the ninth doorway cannot skip it in silence. It is scoped by
method rather than by nearby lines because the first draft was scoped by lines, stayed green when the
call was deleted, and had never matched `doPlayBasic` in the first place.

**Coupling the invisible rule to the visible one is the whole technique**, and it is the same shape
as `settleTransforms` being called after every action rather than at the eight places a Pokémon can
become Active. See [ENGINE.md](../ENGINE.md).

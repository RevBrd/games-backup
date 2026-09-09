# Owner's Pokémon are their own evolution line, and it costs nothing

*Append-only, and exempt from the 200-line target like every entry in this folder. Correct it; never
condense it.*

**Settled 8 Sep 2026, Job 16 (Shadowless 40). Trevor supplied the WotC rule; the implementation
turned out to already be correct, which is the entire point of writing this down.**

## The rule

Gym Heroes prints 91 Pokémon and **every one of them belongs to a Gym Leader** — Blaine's, Brock's,
Erika's, Lt. Surge's, Misty's, Sabrina's, and Rocket's. WotC's rule is that these **cannot
cross-evolve with the ordinary line**, the same way Dark Pokémon cannot. A plain Geodude may not
become Brock's Graveler, and Brock's Geodude may not become a plain Graveler.

Trevor, 8 Sep 2026: *"apparently the WotC rules are that they cannot cross-evolve with the regular
line. Similar to Dark Pokemon, they're their own thing."*

## It needs no code, and that is worth a file

`engine.js`'s evolution check is a single exact-name comparison:

```js
if (topCard(this.db, slot).name !== evoCard.evolvesFrom) return false;
```

and the corpus supplies `evolvesFrom: "Brock's Rhyhorn"` on Brock's Rhydon. **Measured across the
whole set before relying on it: 29 evolutions, 0 crossing an owner boundary, and no evolution naming
a basic that is not itself in the set.** So the rule the WotC rulebook states as a special case
falls out of the general mechanism, in both directions, for free.

**This entry exists because "no code needed" is the conclusion nobody records.** The next instance
to meet an owner's set — Gym Challenge is 126 more of them, and it is the very next set — will read
the WotC rule, reach for a name-prefix check or an `owner` field on the card, and add a system to
enforce something already true. A ruling that says *checked, and the mechanism already covers it* is
the only thing that stops that, and it is cheaper than the system would be.

**What would break it** is the honest other half. Exact-name matching is doing the work, so:

- **Anything that matches evolutions loosely** — a fuzzy lookup, a "base species" notion, a
  name-normaliser that strips the owner prefix — silently reopens cross-evolution. If a future card
  wants to ask *"is this a Geodude, whoever owns it"*, that is a second question and needs a second
  method, not a relaxation of this one.
- **`evolvesFromName`/the Stage 2 walker** answer through the same table, so they inherit the
  property rather than needing their own check.

## What generalises

| Principle | Why it is here |
|---|---|
| **Record a rule that needed no code, and say what would break it** — the absence of an implementation is invisible, so the next reader cannot tell "checked, already covered" from "nobody thought about it" | Gym Challenge is 126 more owner's cards and will ask the identical question |
| **An exact-match check is a load-bearing decision, not an implementation detail**, once a set exists whose whole identity is a name prefix | A loosened match would reopen this silently, with no test to catch it |

Same shape as the [promo evolution](PROMO-EVOLUTION.md) entry's lesson from the other direction:
there, the sources ruled case by case and an exception list *was* the honest answer. Here the general
mechanism genuinely covers it. **Both are worth a file precisely because you cannot tell which case
you are in without going and looking.**

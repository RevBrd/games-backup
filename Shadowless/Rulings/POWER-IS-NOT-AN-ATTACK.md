# A Pokémon Power is not an attack

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 18 Aug 2026, Job 10c, with Trevor.** Made under the post-Fossil order, and it stopped at
step 4 — his call on playability, from Pocket, against a reading I had argued for.

**A card that says "attack" means an attack.** Damage dealt by a Pokémon Power, by Poison, by
Confusion, by a Retaliate or by a Mirror Shell is not damage done by an attack, and nothing that
keys on the word sees it.

Three cards read the same way and all three now agree:

| Card | Prints | So it does not see |
|---|---|---|
| Machamp, Strikes Back | "whenever an opponent's **attack** damages Machamp" | a Power's damage |
| Dark Wartortle, Mirror Shell | "if an **attack** does damage to Dark Wartortle" | a Power's damage |
| Dark Gyarados, Final Beam | "when Dark Gyarados is Knocked Out **by an attack**" | a Power, Poison, Confusion, a Retaliate, a Mirror Shell |

## What I argued for, and why it lost

I leaned the other way on Final Beam: that anything *originating during an attack step* should count,
so a Machamp finishing a Gyarados with Strikes Back would be answered. The argument was that the
damage traces back to an attack and that a rule nobody can predict from the card is worse than a
generous one.

**Trevor's answer is the better one and it is about the shape of the rule rather than this card.**
Pocket rules it narrowly — only the attack itself — and the reason to follow that here is that the
generous reading *has no natural edge to stop at*. Every future card that deals damage without
attacking would need a fresh decision about whether it counts, and there are a great many of them
coming: Gym and Neo are full of Powers that put damage counters on things. The narrow reading needs
deciding once.

In his words: there are going to be a lot more edge cases to account for in the opposite direction.

**This is the tiebreaker in `RULINGS.md` doing its job** — *prefer the reading with fewer live
dependencies*. "Was this damage an attack's own?" is answered once, at the moment the damage lands.
"Did this damage originate during an attack step, transitively?" is a question that has to be
re-decided for every new source.

## How it is implemented, and the direction the default points

`dealDamage` writes `lastHitBy = { uid, turn, byAttack }`, and **`byAttack` defaults to true**.

That direction is the whole safety of it. Thirteen of the sixteen callers are an attack's own
damage — the hit itself, every bench splash, every snipe — and **that is the list that grows with
every set**. The three that are not (Retaliate, Mirror Shell, and the Power verbs added in Job 10c)
are a small closed set, so they declare themselves with `notAttack: true` and a new attack verb
written in Gym is correct without anybody remembering this file exists.

Two things this deliberately does *not* do:

- **`notAttack` is a separate flag from `noRetaliate`**, even though the same three callers pass both
  today. They mean different things — one is *do not provoke a counter*, the other is *this was not
  an attack* — and collapsing them is exactly the mistake `STATUS_IMMUNE` was kept clear of when it
  would have been cheaper to reuse `blocked`. The day a card provokes a counter without being an
  attack, or is an attack that provokes none, one flag would have to be split under pressure.
- **Poison and Confusion self-damage need no flag at all**, because neither goes through
  `dealDamage` — both add to `slot.dmg` directly. That is luck rather than design, and it is written
  down here so that a later refactor routing them through `dealDamage` knows it has to pass
  `notAttack`.

## The other half: what a Power's damage does not provoke

The same sentence, read from the other end. Every damaging Power verb passes `noRetaliate` and
`noMirror`, so Dark Golbat's Sneak Attack can hit a Machamp for 10 and take nothing back.

That is not a courtesy to Dark Golbat. It falls out of the two cards' own text, which is why it is
one ruling and not three.

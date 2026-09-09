# Shadowless — the three kinds of Pokémon Power

**Read this before adding a card that carries a Power, and before assuming a Power has to be
*fired*.** Three of the systems in [ENGINE.md](ENGINE.md) are Powers, and they are three
different mechanisms rather than three flavours of one — which is the thing to hold on to, because
the mistake is always to file a new one under the wrong kind.

| Kind | Who decides | Where it lives |
|---|---|---|
| **Interactive** | the player, from the action list | `powerActions` / `doPower` |
| **Triggered** | nobody — there is a definite moment it happens | `ON_PLAY` / `ON_KO` / `ON_OPP_RETREAT` hooks |
| **Passive** | nobody, ever — it is *consulted* at the moment it matters | `activePower(slot, kind)` |

Split out of `ENGINE.md` on 22 Aug 2026, on that file's own test: a session adding an ordinary card,
or touching `takeEnergy`, `pendingPrize` or the `baseCard`/`topCard` split, needs none of this — and
it is a third of the file.

**182 cards carry a Power across the WotC era**, against 52 in the four live sets, so this is the
system that scales furthest. Neo adds one **Poké-Body**, which the generator already emits as a
Power, and 10 **Baby** Pokémon whose coin-flip rule is a whole rule rather than a card effect — see
`RULINGS.md`.

**How `ai.js` scores any of this is in [AI.md](AI.md)**, and it is not a footnote: a Power the bot
never reaches for is not a working Power, and no suite but `powertest.js` can see that.

### Pokémon Powers

`powerOf` / `powerUsable` / `powerActions` / `doPower` in `engine.js`, declared per card as a `p:`
object in `effects.js` with its reference comment above `EFFECTS`.

**Read Buzzap first.** It turns the Electrode card *itself* into an Energy card via an `asEnergy`
override on the card **instance**, which is why `energyProvides()` consults that before consulting
the card definition. It is the most structurally unusual thing in the engine and the pattern
generalises to anything that changes what a card *is* while in play.

Six in Base Set; the era-wide figure and what Neo adds are in this file's header, not repeated here.

**"As often as you like during your turn" is a mode you enter and leave, and that is a standing
design decision rather than an implementation detail.** Click the power; the board enters that mode
and says so; legal sources and targets highlight; click source then target as many times as you want;
press Done. **One pattern serves Damage Swap, Energy Trans and Rain Dance** — build the fourth one
the same way rather than inventing a second shape for it. Every individual move gets its own log
line, because the log is what a player reads back to work out what just happened to their board.

This lived in `CLAUDE.md`'s standing decisions until 14 Aug 2026 and moved here because the only
person who needs it is adding a Power, which is what this file is for.

### Triggered Powers, and the one doorway into play

Job 10c, and the third kind of Power. An **interactive** Power is offered as an action and the player
chooses it. A **passive** Power is never fired — it is consulted at the moment it matters. A
**triggered** Power is neither: nobody chooses it, and there is a definite moment it happens.

**Three triggers, and they are deliberately not one mechanism.** The survey is the argument:

| | In the era | So it is built as |
|---|---|---|
| `ON_PLAY` | 20 printings across seven sets, **no two doing the same thing** — search a deck, mill either deck on a coin, heal every Grass in play, hand the opponent a redraw | a trigger plus a **verb list**. What generalises is the moment, not the effect, so a card author writes a script rather than engine code |
| `ON_KO` | three printings, two behaviours, in the whole era | narrow and exact. There is nothing to generalise |
| `ON_OPP_RETREAT` | two behaviours, and **they disagree** — Sinkhole fires when the opponent *retreats*, Neo 4's Unown [C] when it *tries to* | one hook with the distinction reserved as a flag. *[The ruling →](Rulings/RETREATS-MEANS-SUCCEEDED.md)* |

**`enterPlay(pi, slot, {source})` is the one doorway**, and it is the part to understand before adding
anything here. Eight paths put a Pokémon into play and only three are from hand; the ruling and the
full table are in [PLAYED-FROM-HAND.md](Rulings/PLAYED-FROM-HAND.md). Two properties keep it honest,
and both are the same technique used twice:

- **It is hung off a stamp no path can omit.** `enterPlay` does the `playedTurn` / `evolvedTurn` set
  and the Special Condition clear that every path already needs and that `canEvolve` and Cowardice
  already read. A path that forgets it is visibly broken within a turn rather than quietly silent.
- **`selftest.js` asserts it statically** — every method holding a `mkSlot` or a `stack.push` also
  calls `enterPlay`. Scoped by method, because a line-window version stayed green when the call was
  deleted. The ninth doorway, added in Gym, cannot skip it in silence.

**`runPowerScript` is a third verb namespace** after attack verbs and Trainer cases, and it is
consistent with them rather than a new idea — Trainers have had their own switch since Base Set. It
deliberately does **not** re-enter the attack pipeline: that loop is built around an attacker, a
defender, a damage number and a Barrier check, and most of its cases assume a defender exists.
Re-entering it with a null defender means auditing every one of them on behalf of a card that has no
defender at all.

Choices arrive the way every other choice in this engine arrives — on the action's `opts`, with a
deterministic fallback — and the context the engine supplies is a **separate argument** from the
player's answer, for the same reason `costUids` and `energyUids` are two keys.

**A Pokémon Power is not an attack**, so every damaging verb here passes `noRetaliate` and `noMirror`,
and `dealDamage` records `byAttack` so Final Beam can answer an attack and nothing else. That default
points *true*, which is the opposite direction from the doorway above, and the two are one week apart
on purpose. *[Both, and the test for which way a default should point →](Rulings/POWER-IS-NOT-AN-ATTACK.md)*


### Passive Powers

Added in Job 6b, before any card needed one. Base Set has exactly one passive Power (Machamp's
Strikes Back); Jungle and Fossil add seven, two of which rewrite the rules for **both players**.

**They are consulted, never materialised.** Nothing pushes a passive into `slot.effects` when a card
enters play. Everything asks `activePower(slot, kind)` at the moment the answer matters.

That is not a style preference, it is Muk. Toxic Gas switches every other Power in the game off and
back on — from either side, from the Bench, and transiently: Muk falls asleep, is Knocked Out,
retreats, or evolves out of a Grimer halfway through a turn. A materialised copy of every passive
would have to be resynchronised on all of those, and the first missed case is a silent wrong ruling.
Consulted, the whole thing is one question in one place.

The gate is two steps, and splitting them is what stops Toxic Gas asking whether Toxic Gas is on:

| | |
|---|---|
| `powerActive(slot)` | the card's own condition — status, Barrier, and `always` for cards printing no status clause |
| `powerUsable(slot)` | that, **and** not suppressed by somebody's Toxic Gas |

Three consequences worth knowing before you add one:

- **`always: true` exists because the blanket status gate is wrong for some cards.** Every Base Set
  Power carries "can't be used if Asleep, Confused or Paralyzed", so the engine applied it to all of
  them. Dodrio's Retreat Aid and Dragonite's Step In print no such clause. Do not set the flag
  without reading the card.
- **Deterministic passives go in `computeDamage`, coin-flip ones do not.** `computeDamage` is pure
  and is what the AI forecasts with, so Kabuto Armor and Invisible Wall live there and the bot sees
  them for free — it can never predict a number the engine would not produce. Haunter's Transparency
  flips, so it lives in `runAttack` instead, and the AI is told about it separately.
- **Transparency shields only what is aimed at Haunter.** One coin for the whole attack, before
  anything resolves; recoil, bench splash and the attacker's own buffs are untouched. That falls out
  of `blocked` gating exactly the defender-targeting verbs, which is worth preserving.

`STATUS_IMMUNE` is deliberately **not** the same flag as `blocked`. Snorlax cannot be given a
condition, but it can still be Smokescreened, dragged and stripped of Energy, and an early version
that reused `blocked` quietly told the AI otherwise.


## Testing them

**The four playable theme decks contain none of the bespoke cards, so full games never exercise
any of this.** A green `selftest.js` run says nothing about Powers. Use:

- **`tools/powertest.js`** — builds boards by hand, fires a Power, asserts the exact state change.
  Half its cases assert that something is **illegal**, which is where these rules actually live:
  Damage Swap refusing a move that would Knock Out the receiver, a Power switched off by Sleep,
  Energy Burn never being offered at all. Its 6b section runs against a **synthetic database**, because
  the machinery was built before the cards: each stand-in carries the exact Power its real card
  will, and every assertion switches a Power on or off underneath an already-built board — which is
  precisely what a materialised cache would get wrong.
- **the Sandbox deck**, which draws from everything implemented, for playing against them for real.

`powertest.js` also covers AI *usage*, which is not the same thing as the Power working: Energy Burn
passed every unit test while the AI silently never used it, because `bestAttackScore` returns
`{score, idx}` and the first scorer compared the objects. A Power the AI never reaches for is not
a working Power, and no other suite can see it.

**Energy Burn is passive as of 16 Aug 2026** and no longer an action either side takes — Trevor's
call, *"similar to Muk's Toxic Gas"*. Charizard's only attack is Fire Spin at RRRR, so declining was
never a decision. `slotSymbols` consults the Power the way every other passive here is consulted,
which is also why it now switches off under Sleep, Confusion, Paralysis and Toxic Gas; the old flag
was set once and re-checked by nothing. It does **not** reach a cost demanding a specific Energy
*card* — that still reads `energyProvides`, matching the Buzzap ruling.


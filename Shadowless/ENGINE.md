# Shadowless — the engine's awkward-card machinery

Depth behind the card rows in `CLAUDE.md`'s status table. Read this before adding cards, and
before writing a special case for one — **nine systems** already exist for the shapes that do not fit
the DSL, and every set after Base Set leans on them.

Ordinary cards need none of this. A `cards.js` entry plus an `effects.js` entry is the whole job,
and the DSL verb reference is the comment block at the top of `effects.js` — **larger than most
sessions expect, and `selftest.js` prints the live count**, so read it before deciding something is
not expressible. (A number in prose here rots; TOOLING.md has had to correct one twice.) **If a
card needs behaviour the DSL cannot express, add a verb rather than special-casing it**, and document
it there.

## Before you add cards: account for the verbs

**Trevor's section, 17 Aug 2026**, and the instinct behind it is the useful part — the drift below is
not only something to prevent, it is something to **check at the start of a job**, before any of it
gets planned.

**Three commands, in this order. None takes a minute**, and they answer three
different questions that get confused with one another because all three print counts.

```bash
node tools/selftest.js                   # among much else: "N verbs, all documented"
node tools/setsurvey.js <setcode>        # how much of the set you are adding is already built
node tools/shapecount.js "<wording>"     # how often this SHAPE recurs across all 14 sets
```

| | Looks | Answers |
|---|---|---|
| `selftest` | inward | what machinery already exists, and is the list of it trustworthy |
| `setsurvey` | down, at one set | how much of this set is already built |
| `shapecount` | across, at all fourteen | how often the thing in front of me recurs |

**The third one is new as of Job 10c and it is there because it changed a job.** That job had three
triggered Powers to build and several plausible designs, and two minutes of `shapecount` settled it:
`"When you play .* from your hand"` is **20 printings across seven sets and fifteen distinct texts**,
so the trigger has to take a verb list or you write fifteen bespoke Power kinds by Neo 4. `"When .* is
Knocked Out"` is **three printings and two behaviours in the entire era**, so generalising it would
have been pure waste. Same job, opposite answers, and nothing but the count could tell them apart.

**Read the distinct-text count, never the printing count** — the same lesson `setsurvey.js` and
`DATA.md` keep making. And read the hits themselves: a bare `"is Knocked Out"` also catches Strikes
Back's parenthetical, which is a card that answers damage rather than one that triggers on dying. The
tool starts the thinking; it does not finish it.

**The first is what makes the second worth trusting.** `selftest.js` asserts that every verb the
engine dispatches, and every verb a card uses, appears in the reference block at the top of
`effects.js`. While that is green the block is not merely *a* list of verbs — it is **the whole
surface**, so you can plan against it and legitimately conclude that a card needs new machinery.
Before the check existed you could only ever conclude that you had not found it.

**It has gone stale twice, which is why the check exists.** Base Set's drift cost the Job 6 planning
pass an hour of rediscovering verbs that were already built; by the Job 10 survey, 42 of the 117 were
missing, five of them ones Team Rocket needed on its first day. The failure is invisible by
construction — an undocumented verb *works*, no suite goes red, and the only symptom arrives months
later as a second verb doing the same thing under a different name. A warning in prose did not
survive two sets. **If the check goes red, write the entry** — deleting it restores exactly the
condition it was written for.

`setsurvey.js` then reports how much of the set is already built: how many attacks are plain damage,
and how many print rules text implemented verbatim somewhere live. It is a **lower bound** by
construction, and its control is the live sets, which must each report zero novel — see
[TOOLING.md](TOOLING.md).

## The nine systems

### Pokémon Powers

`powerOf` / `powerUsable` / `powerActions` / `doPower` in `engine.js`, declared per card as a `p:`
object in `effects.js` with its reference comment above `EFFECTS`.

**Read Buzzap first.** It turns the Electrode card *itself* into an Energy card via an `asEnergy`
override on the card **instance**, which is why `energyProvides()` consults that before consulting
the card definition. It is the most structurally unusual thing in the engine and the pattern
generalises to anything that changes what a card *is* while in play.

Six in Base Set. **182 cards carry a Power across the WotC era**, so this is the system that scales
furthest. Neo adds one **Poké-Body**, which the generator already emits as a Power (filtered from
upstream's `abilities`), and 10 **Baby** Pokémon whose coin-flip rule is a whole rule rather than a
card effect — see the Pending section of `RULINGS.md`.

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

### `runAttack`

Split out of `doAttack`, and the seam that made Metronome cheap: it re-enters with the *defender's*
attack while `atk` is still Clefairy, so the copied attack really is Colorless and its recoil lands
on Clefairy. **Anything that copies or replays an attack should reuse it** rather than reimplementing
the resolution order.

### `lastAttackResult`

An event record written onto the defender when an attack resolves — `{turn, by, label, damage,
statuses}`. Mirror Move replays exactly that rather than recomputing.

Nothing parses the log. The log is prose for humans, and a reworded line must never break a card.
Trevor asked whether Mirror Move could read the log instead — the right instinct, the information
genuinely is already there — but the numbers would have to be regex'd back out of sentences. The
record is the same idea done as data.

### `pendingSwitch`, `pendingPrize`, and the rule they share

**Every owed choice in this engine is PER PLAYER, and there are now four of them** — `pendingAsk`,
`pendingSwitch`, `pendingPromote` and `pendingPrize`. Two can be outstanding at once *for different
people*, which is the normal case rather than the edge one: the player who just lost a Pokémon owes a
promotion and the player who Knocked it out owes a Prize.

**A new one needs a branch in THREE places, and all three must ask what *this player* owes rather
than what is outstanding anywhere:** the gate at the top of `act()`, the offer in `legalActions()`,
and the dispatch at the top of `ai.js`'s `choose()`. Miss any one and the game hangs with both sides
waiting.

**This has now been got wrong four times** — Whirlwind's `pendingSwitch` when Jungle landed,
`pendingAsk` in Job 10, and twice while adding `pendingPrize` on 19 Aug 2026, once in `act()` and once
in `choose()`. The second of those is the instructive one: `choose()` had four independent
*is-anything-pending* blocks, each returning `null` when its own thing was owed by somebody else — so a
Prize owed to player 1 was swallowed by the promotion owed to player 0 and nobody ever answered. It is
one ordered question now (*what does `pi` owe?*) rather than four unordered ones, and that shape is
what to copy. `powertest.js` pins the exact deadlock.

**`pendingSwitch`** is Whirlwind: a choice made during your opponent's turn. **`pendingPrize`** is a
queue rather than a slot, for the same reason promotion is one — a Selfdestruct that Knocks Out three
Pokémon owes three Prizes, taken one at a time. Entries repeat: `[0,0,0]` is three owed to player 0.

**Both Knock-Out sites go through `awardPrize`, which is the one doorway.** Auto resolves it
immediately at a **random** index; manual queues it. That randomness is not cosmetic — Prizes used to
come off with `shift()`, so Rattata's Trickery on slot 0 meant *"into my hand next Knock Out"* and on
slot 5 meant *"buried"*, which was real strategy nobody designed and nobody could see.

**Do not read "took all Prizes" off the pile at a Knock-Out site any more.** On a manual pick the
Prize is still sitting there until the player chooses, so the win is declared in `afterOwedChoice`
and by `settleWinConditions` — one answer, both modes.

*[Why the player gets a toggle and the bot does not →](AI.md)*

### `playsAs: 'pokemon'`

Marks a Trainer that is played as a Basic Pokémon. `gen_cards.js` sets it from the one reliable
upstream signal — a Trainer carrying an `hp` — which across all 14 sets picks out exactly **Clefairy
Doll and Mysterious Fossil**. That is why Fossil needs only an `effects.js` entry for Mysterious
Fossil when it lands.

Note what the flag deliberately does *not* touch, both of which are correct and both of which fall
out of it being read at the point of **play** rather than baked into the card kind:

- **the opening setup**, where these are still Trainer cards that cannot start and do not prevent a
  mulligan;
- **`basicsIn()`**, so Revive and Pokémon Flute cannot pull one out of the discard.

The reasoning for both is in `RULINGS.md` under Clefairy Doll.

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

### `baseCard` / `topCard`

Added in Job 6f for Ditto, and the system to reach for whenever a card changes **what another card
is** rather than what it does. 47 references in `engine.js`; the ruling it implements is in
`RULINGS.md`.

| | |
|---|---|
| `topCard(slot)` | what the slot is **treated as**. HP, type, Weakness, Resistance, retreat cost, name and the whole attack list |
| `baseCard(slot)` | the **physical card**. Which Power it has, whether it may evolve, what goes to the discard when it dies |

One override carries seven properties, which is the entire reason this is a system and not seven
special cases. **`powerOf` reads `baseCard`** — that single choice is what stops a transformed Ditto
inheriting the Power of whatever it copied, and it is what keeps the passive-Power surface finite.

Two properties to preserve if you add a second card here. **`settleTransforms()` is called after
every action**, not at the eight separate places a Pokémon can reach the Active spot, and it is
**idempotent** — a ninth entry path added later cannot forget about it. And **anything that switches
the Power off blocks a transform but never reverses one already made**, which is the one rule that
covers status, Toxic Gas and an empty opposing Active between them.

### `takeEnergy` — which Energy leaves

Added 12 Aug 2026. **Seven effects discard Energy off a slot** — retreat, Energy Removal, Super
Energy Removal, Super Potion, an attack cost like Flamethrower's, Wildfire, and the attacks that
strip the defender — and every one of them used to decide for itself, by array order. Which Fire
leaves a Charizard is the difference between attacking next turn and not.

They now share one decision point, which is what lets the player's pick, the AI's and the fallback
agree and gives the whole thing one place to test:

| | |
|---|---|
| `energyChoices(slot, filter)` | what this discard is allowed to take |
| `energyChoiceIsReal(slot, n, filter)` | is it worth stopping to ask — slack, **and** the cards are not all the same |
| `takeEnergy(slot, n, filter, chosen)` | takes n cards and returns them; the caller decides which discard pile |
| `energyPayOrder(slot, filter)` | the fallback: spend what this Pokémon's own attacks do not ask for |

**The fallback is the load-bearing part.** Anything that supplies no choice — the AI, every older
call site, every test written before this existed — gets `energyPayOrder`, which is strictly better
than the index 0 that six of the seven sites used. So the AI needed no change at all.

**And the fallback read the CARD rather than the SLOT until 21 Aug 2026, which inverted it on the one
Pokemon the paragraph above names.** `energyProvides` answers what a card *is*; under Energy Burn
every Energy on a Charizard *is* Fire. So a Double Colorless read as "Colorless, this Pokemon's
attacks do not ask for it" and was spent first — when on that Pokemon it is the single most valuable
card attached, worth two symbols where a basic Fire is worth one. Fire + Fire + Double Colorless is
exactly RRRR; the old order left **one** symbol after Fire Spin and the right order leaves **two**.
Every Fire Spin was costing three symbols instead of two, forever.

Two changes, and the second is what actually fixes it: the "is it needed" test now reads symbols
**through the slot**, and where two cards are equally useful it **spends the smaller one**. Under
Energy Burn everything attached is needed, so the primary key can no longer separate them and the
tiebreaker is the whole answer. Asserted in `powertest.js`. Trevor named the behaviour from play, and
it is the kind of fault that is invisible in every log because nothing prints which card left.

**Two option keys, named by role rather than by site**, because one attack can do both and a single
list would have to be split by a rule the caller cannot see: `opts.costUids` is Energy discarded off
**your** attacker to pay, `opts.energyUids` is Energy the effect **targets**, on either side. Retreat
predates both and takes `a.pay`.

**Retreat is measured in symbols, not cards** — a Double Colorless covers two of one, and pays for a
cost of one by being thrown away whole. That is a ruling, not an implementation detail; it was the
other way round between 12 and 17 Aug 2026 and the reversal is reasoned in
[RULINGS.md](RULINGS.md). Three engine methods exist only to serve it — `retreatPayOptions`
enumerates the legal payments, `retreatPayOrder` picks the fallback out of that list, and
`retreatChoiceIsReal` decides whether the player is asked at all. **The fallback must be chosen from
the enumeration rather than constructed**, and that is not style: a greedy version could build a
payment `doRetreat` then refused as redundant, which hung 26% of ladder games in a retreat loop.

## A question this raised, and the answer

**A flat damage bonus lands AFTER Weakness, and that is correct.** `computeDamage` applies Weakness
and Resistance first, then walks the flat-bonus loop — PlusPower, Defender, and Dark Primeape's
Frenzy. So a Frenzied Attack into a Fighting Weakness is 80 + 30 = **110**, not (40 + 30) doubled =
**140**, and PlusPower behaves the same way.

**Confirmed against the Game Boy game by Trevor, 19 Aug 2026**, which is the arbiter for the three
live sets and settles it for everything built on top of them. Bonuses stack on the doubled number.

Worth knowing three things about how this got asked, because the shape recurs:

- **It surfaced from a failing test with the wrong expectation.** The Frenzy case asserted 140 and got
  110; the card was fine and the convention was two sets old.
- **It was flagged rather than changed.** The convention predates Team Rocket, every PlusPower
  interaction rests on it, and a card being added is the worst moment to alter a rule that old — the
  change would have been invisible in the diff and enormous in play.
- **It went to the arbiter rather than to reasoning**, which is step 1 of `RULINGS.md` and is what the
  Buzzap entry is a warning about. Two of us once reasoned our way to the opposite of a source that
  was explicit all along.

`powertest.js` pins the number.

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

## What this file deliberately does not cover

**How `ai.js` scores any of it is in [AI.md](AI.md)**, and it is not a footnote: a verb the AI
cannot score is free at runtime, misplayed forever, and invisible to every suite. If you add a verb,
you are not done when `powertest.js` goes green — read the silent-failure surface there.


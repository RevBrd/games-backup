# Shadowless — the engine's awkward-card machinery

Depth behind the card rows in `CLAUDE.md`'s status table. Read this before adding cards, and
before writing a special case for one — seven systems already exist for the shapes that do not fit
the DSL, and every set after Base Set leans on them.

Ordinary cards need none of this. A `cards.js` entry plus an `effects.js` entry is the whole job,
and the DSL verb reference is the comment block at the top of `effects.js`. **If a card needs
behaviour the DSL cannot express, add a verb rather than special-casing it**, and document it there.

## The seven systems

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

### `pendingSwitch`

The only place a player decides something during their *opponent's* turn (Whirlwind). It follows the
same deferred-turn-end shape as `pendingPromote`, and the two can be outstanding at once **for
different players** — the gates in `act()` and `legalActions()` are per-player for that reason, and
were briefly not, which hung games.

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

## Testing them

**The four playable theme decks contain none of the bespoke cards, so full games never exercise
any of this.** A green `selftest.js` run says nothing about Powers. Use:

- **`tools/powertest.js`** — builds boards by hand, fires a Power, asserts the exact state change.
  Half its cases assert that something is **illegal**, which is where these rules actually live:
  Damage Swap refusing a move that would Knock Out the receiver, a Power switched off by Sleep,
  Energy Burn not being offered twice. Its 6b section runs against a **synthetic database**, because
  the machinery was built before the cards: each stand-in carries the exact Power its real card
  will, and every assertion switches a Power on or off underneath an already-built board — which is
  precisely what a materialised cache would get wrong.
- **the Sandbox deck**, which draws from everything implemented, for playing against them for real.

`powertest.js` also covers AI *usage*, which is not the same thing as the Power working: Energy Burn
passed every unit test while the AI silently never used it, because `bestAttackScore` returns
`{score, idx}` and the first scorer compared the objects. A Power the AI never reaches for is not
a working Power, and no other suite can see it.

## The silent-failure surface

`ai.js` scores attacks with a `switch` over the verb list, and **a verb it has no case for scores as
plain base damage**. Nothing throws, no suite goes red, and the card works perfectly for the human —
the AI just misvalues it forever. That is the same failure the deck validator exists to prevent, one
level up: an unimplemented *card* can never silently do nothing, but an unscored *verb* currently
can.

The runtime behaviour is right — throwing mid-game over a scoring gap would be worse than
misplaying — so the guard belongs in the tooling. **It was built in Job 6a and it lives in
`selftest.js`:** walk every verb appearing in `effects.js`, and assert `ai.js` either scores it or
it sits on `UNSCORED_ON_PURPOSE`. It reports `96 of 97 verbs scored` today and it found **eleven**
the first time it ran — Thunderbolt believed free, Super Fang valued at zero, Earthquake's damage to
its own bench invisible. None of the eleven appears in a theme deck, so 480 full games ran
byte-identical before and after the fix; nothing but this check could see them.

**The opt-out list is the point, and it is deliberately almost empty.** One verb is on it
(`REQUIRE_DEF_STATUS`, a legality gate the engine refuses outright, so an illegal attack never
reaches the AI to be scored). Putting a verb there is a decision somebody made; leaving one off is
an oversight, and before the check the two were indistinguishable from outside.

## The Active and the Bench are scored in different units

`potential()` values an Active's attacks with `scoreAttackHypothetical` — full expected value — and
a benched Pokemon's with the printed damage number. **Anything comparing the two is comparing two
scales**, and `bestAffordableDamage()` exists as the honest comparator for decisions that must.

Measured across ~64 games before assuming the worst, because the obvious story turned out to be
wrong. **The means are nearly identical** (27.0 EV against 25.4 raw) — `scoreAttack` is calibrated
so a point is roughly a damage, so most of the time the two agree. It is the **tail** that diverges:

| | p50 | p90 | p95 | p99 |
|---|---|---|---|---|
| Active, expected value | 20 | 81 | 99 | 115 |
| Bench, printed damage | 30 | 50 | 50 | 60 |

**16.7% of Active evaluations exceed 55**, which is knockout scale — a number the bench branch
cannot produce at any merit, because printed damage stops around 60.

So state the fault precisely, since the loose version invites a bad fix: the Active is **not**
over-valued. Its number is right, a knockout really is worth more, and the Active deserves a premium
anyway for being the one that can act this turn — `teamReadiness` weights it ×4 deliberately. What
is wrong is that **a benched Pokemon has no way to say "I could take a Prize if you promoted me."**

Left unfixed on purpose. Closing it means making expected value computable for a slot that is not
Active, which is a real refactor of `scoreAttack`'s relationship with engine state, and the measured
prize is one in six comparisons in a direction that is partly correct already. **If you do take it
on, duel it** — and read the tail, not the mean, or you will conclude there was never a problem.

**A verb that must not be *worth* anything is not the same as one that must not be scored**, and the
distinction matters because the list is the smaller of the two. Peek and Clairvoyance are worthless
to a bot that already reads full engine state — so `ai.js` scores `PEEK` at `-Infinity` on purpose,
with a comment saying why. That is a live declaration in the file that does the work, which beats an
entry on an opt-out list in a file that does not.

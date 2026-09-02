# Shadowless — the engine's awkward-card machinery

Depth behind the card rows in `CLAUDE.md`'s status table. Read this before adding cards, and
before writing a special case for one — **the shapes that do not fit the DSL already have machinery**,
and every set after Base Set leans on it. **The Pokémon Powers are three of it and live in
[POWERS.md](POWERS.md)**; the rest are the headings below.

*(This said "nine systems", "three of the nine" and "the other six" until a tenth was added on
29 Aug 2026 — three numbers to keep in step across two files, in a file that warns about exactly this
two paragraphs down. **The headings are the count.**)*

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

**`shapecount` is the one that decides whether the thing in front of you gets machinery or a special
case, and it settled three designs in one job in two minutes.** Same job, opposite answers — build a
verb list for one trigger, hard-code another — and nothing but the count could tell them apart.
**Read the distinct-text count, never the printing count**, and read the hits and not only the
number. *[What each tool does and does not tell you, with the worked example →](TOOLING.md)*

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

## The systems

### The three kinds of Pokémon Power — [POWERS.md](POWERS.md)

**The Powers are three of these, and they are three mechanisms rather than three flavours of one.**
An **interactive** Power is offered as an action and the player chooses it. A **triggered** Power is
never chosen — there is a definite moment it happens. A **passive** Power is never *fired* at all;
it is consulted at the moment the answer matters, which is Muk's Toxic Gas being switchable from
either side, from the Bench, and halfway through a turn.

They moved into their own file on 22 Aug 2026 — a third of this one, and needed by nobody who is not
adding a Power. **Read Buzzap first when you get there**: it turns the Electrode card *itself* into
an Energy card via an `asEnergy` override on the card **instance**, and it is the most structurally
unusual thing in the engine.

**One rule from over there belongs here, because it constrains every path in this file:**
`enterPlay(pi, slot, {source})` is the **one doorway into play**. Eight paths put a Pokémon into
play and only three are from hand; it carries the stamp every one of them already needs, and
`selftest.js` asserts statically that no method holding a `mkSlot` or a `stack.push` skips it.
*[Why the trigger hangs off a stamp nobody can omit →](Rulings/PLAYED-FROM-HAND.md)*

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

### `baseCard` / `topCard`

Added in Job 6f for Ditto, and the system to reach for whenever a card changes **what another card
is** rather than what it does. It is threaded through `engine.js` densely enough that grepping either
name is the honest way to see its reach; the ruling it implements is in
[Ditto](Rulings/DITTO.md). *(This said "47 references" until 2 Sep 2026, by which point it was well
past that. **No replacement number is given on purpose** — and the pass that removed it immediately
wrote a wrong one, because `grep -c` counts matching LINES and the claim was about occurrences. A
count in prose about a growing codebase is what this tree corrects most often; cite the symbol and
let the reader grep.)*

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

### `selfDamage` — an attack's self-harm is damage done by an attack

Added 29 Aug 2026. **The three recoil sites and one more all route through it**, and it applies the
`DAMAGE_REDUCTION` band to the attacker's own slot — so a Defender on your Arcanine turns Take Down's
30 recoil into 10, and is discarded if it spends its whole 20 doing so.

**The scope rule is generated rather than listed, and it is worth knowing before you add a
self-damaging card.** Defender prints *"after applying Weakness and Resistance"*, so the band is the
W/R band: **anything that skips W/R skips this.** Confusion's 30 is a flat add that never reaches
`computeDamage`, Poison is a between-turns clock, Rainbow's 10 lands on attachment. None of the three
comes through here and none should. *[The ruling, the scope table and the invented half
→](Rulings/DEFENDER-BLUNTS-SELF-HARM.md)*

**Consumption is a property of the CARD, not of the effect.** `e.card` is what separates a Defender
that gets discarded from a Minimize that runs to its own expiry, and it was already in the data.

**Wiring a new self-damaging card means calling `selfDamage`, not `atk.dmg +=`.** Two sites in the
engine still add directly and both are correct — Confusion's penalty, and Thunderstorm's log line
before it defers. Grep `selfDamage` for the live set rather than trusting a count here.

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

## Testing any of it

**The four playable theme decks contain none of the bespoke cards, so full games never exercise a
single system in this file.** A green `selftest.js` run says nothing about any of them. Everything
here is asserted in **`tools/powertest.js`**, which builds boards by hand and checks the exact state
change — and half its cases assert that something is **illegal**, which is where these rules actually
live. The **Sandbox deck** draws from everything implemented, for playing against them for real.
*[What that suite covers, and why the others cannot →](POWERS.md)*

## What this file deliberately does not cover

**The three kinds of Pokémon Power are in [POWERS.md](POWERS.md)**, which is a third of what this
file used to be.

**How `ai.js` scores any of it is in [AI.md](AI.md)**, and it is not a footnote: a verb the AI
cannot score is free at runtime, misplayed forever, and invisible to every suite. If you add a verb,
you are not done when `powertest.js` goes green — read the silent-failure surface there.


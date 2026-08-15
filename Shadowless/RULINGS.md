# Shadowless — card rulings log

Every case where the printed card text didn't settle how a card behaves, and what we decided.
One entry per call, with the reasoning and the source, so a later instance can see *why* rather
than re-deriving it — and can reverse it deliberately if it turns out wrong.

The standing policy this operates under is in `CLAUDE.md`: **when the text is ambiguous, follow the
Game Boy Color game.** It is a single consistent arbiter and it is the version Trevor knows well
enough to settle a call in plain English, so ask him — he expects to be asked. Where the GBC game
has nothing to say, the WotC-era rulings are the next authority, and the call gets logged here.

Add an entry whenever you make a judgement call. An unlogged one will be re-litigated.

**What *settled with Trevor* means, since the tree had drifted into reading it wrong.** It marks a
call that was **discussed and agreed** — not a directive handed down. Trevor's own words, 15 Aug
2026: he has never said his design calls are final, and the early entries carrying the mark were
recording a conversation, not an instruction. Two things follow. **The mark is not a lock**: bring
new evidence and reopen the entry, exactly as you would one settled between two instances. And **the
mark is still worth writing**, because it says a human who plays this game agreed with the reasoning,
which is information a later pass genuinely wants. What it does *not* do is transfer authority.

The clearest proof that the mark was never a lock is in this file already: the retreat-cost entry was
recorded as settled *from the Game Boy game*, Trevor pushed back on the citation, and the entry now
stands on his reasoning instead — corrected by the person the mark names.

**This file is append-only and the 200-line target does not apply to it.** It is a register, not an
explanation — one entry per call, and there is no way to shorten it that does not delete a ruling
somebody has to make again. Entries are only ever *corrected*, never condensed. Same category as
[LOGBOOK.md](LOGBOOK.md); see [MAINTENANCE.md](MAINTENANCE.md).

---

## Buzzap — Electrode (base1-21)

**Settled 4 Aug 2026. The opponent takes a Prize.**

Both the GBC game and its sequel omitted this Pokémon Power when implementing the card — so the policy's usual arbiter was silent and this went to the WotC rulings.

Two sources, both explicit and agreeing:

- The **WotC Rulings Compendium** entry for Buzzap: using it gives the opponent a Prize.
- A **period WotC Q&A**: *"Any time a Pokemon of yours is knocked out your opponent gets to draw a
  card - even if you knock it out yourself."*
  ([pojo.com CCQA](https://www.pojo.com/CCQA/QandA/500/1b.htm))

**Two of us guessed the opposite** — Trevor via Gemini, me by inference from "surely nobody prints a
Holo Rare whose signature power costs you a Prize." Both wrong. Buzzap is a genuine sacrifice, and
that's the interesting thing about the card. Don't re-derive this.

The same rulings settle the implementation:

- The Electrode card **itself** becomes the Energy — one Energy card providing **two** Energy of the
  chosen type. The engine already handles one-card-two-symbols for Double Colorless (`provides:
  'CC'`), so this needs a per-instance `provides` override and nothing structural.
- **The Voltorb underneath goes to the discard pile.** Only the Electrode card becomes Energy.
- Because the Electrode stays *in play* as Energy rather than going to the discard, Revive and
  Pokémon Flute can't reach it — with no special-casing — and Energy Removal can, which is right.

Rejected alternative: discard Electrode and conjure a basic Energy in its place. It was the
first instinct and it's close, but it needs a "non-returnable" flag to keep Revive away, gets the
count wrong at one Energy instead of two, and behaves differently under Energy Removal, where one
discard should take both symbols with it. The faithful version is less code, not more.

**Built 5 Aug 2026 and it behaves as described.** The mechanism is an `asEnergy` override set on the
card *instance* — `energyProvides()` consults it before the card definition — so the Electrode is an
Energy card while in play without Electrode-the-card ever changing. Two consequences worth knowing:
a Buzzap'd Electrode is **not a basic Energy card**, so Energy Trans cannot move it and a "discard 1
Fire Energy" cost cannot pay with it, both of which match the rulings; and because it never enters
the discard, Revive and Pokémon Flute cannot reach it with no special-casing at all.

---

## "1 <Type> Energy card" means a basic one

**Settled 5 Aug 2026.** Rain Dance says "1 Water Energy card", Energy Trans says "1 Grass Energy
card". Both are read as **basic** Energy of that type, matching the WotC rulings.

In Base Set the distinction is invisible: the only non-basic Energy is Double Colorless, which is
Colorless and so fails the type check anyway. It starts mattering at Base Set 2, where **Rainbow
Energy counts as every type** and would otherwise become movable by Energy Trans and attachable by
Rain Dance. The engine checks `cls === 'Basic'` rather than the type alone, so that case is already
handled rather than waiting to surprise someone.

Energy Trans has **no restriction on the destination's type** — the card only qualifies the Energy,
not the Pokémon receiving it. Grass Energy onto a Lightning Pokémon is legal, and there is a test
asserting it. Rain Dance does restrict its destination, to Water Pokémon.

---

## Mirror Move replays a recorded result, it does not recompute

**Settled 5 Aug 2026.** "Do the final result of that attack on Pidgeotto to the Defending Pokémon."
*Final result* is read literally: the damage that actually landed, already past Weakness and
Resistance, plus any Special Conditions that actually stuck. It is re-applied flat to the new
target, with no Weakness or Resistance recalculated against them.

The alternative — re-running the original attack against the new defender — would give a different
number whenever the two defenders have different Weakness, and "final result" reads like a fixed
outcome rather than a fresh roll.

Mechanically this is why the engine writes `lastAttackResult` onto the defender when an attack
resolves: `{turn, by, label, damage, statuses}`. Trevor asked whether Mirror Move could read the
game log instead, which is the right instinct — the information does already exist — but the log
holds *sentences*, so the numbers would have to be regex'd back out of prose, and a reworded log
line would silently break a card. The record is the same idea done as data.

---

## Metronome copies a CHOSEN attack, and cannot copy another Metronome

**Settled 5 Aug 2026.** The card says "Choose 1 of the Defending Pokémon's attacks" — it is a
player choice, not random. (The video-game move of the same name is random; the card is not.)

Two calls beyond the printed text:

- **Metronome may not copy a Metronome.** Nothing in the era's text says what that would resolve to,
  and it invites unbounded recursion. Those options are simply not offered.
- **"Anything else required in order to use that attack" is read as the cost verbs only.** So a
  copied Fire Blast does not discard Clefairy's Energy, and a copied Leek Slap does not inherit
  Farfetch'd's once-per-play restriction. Damage, recoil and Special Conditions all still happen.

The card's own footnote — *"No matter what type the Defending Pokémon is, Clefairy's type is still
Colorless"* — needed no special handling. The copy runs through `runAttack` with Clefairy still as
the attacking slot, and Weakness is computed from the attacker, so it falls out for free. The same
fact makes "does damage to itself" land on Clefairy.

---

## Clefairy Doll — in hand it is a Trainer, in play it is a Pokémon

**Settled 5 Aug 2026, with Trevor, on two points the card does not answer.**

The printed text covers most of it: played as a Basic Pokémon, 10 HP, no attacks, cannot retreat,
immune to Asleep/Confused/Paralyzed/Poisoned, no Prize when Knocked Out, discardable at will. Two
things it leaves open, and no period ruling turned up for either:

**It cannot be your opening Pokémon.** The card counts as a Pokémon *while in play*; sitting in your
opening hand it is still a Trainer. So it does not satisfy the "you must start with a Basic" check
and does not save you from a mulligan. The competing reading is that "play it as if it were a Basic
Pokémon" covers setup too, since setup is when you play Basics — genuinely ambiguous, and decided
this way because the "while in play" clause is the more specific statement.

**You still lose if it was your last Pokémon.** "Doesn't count as a Knocked Out Pokémon" is about
the Knock Out *event* — it is what denies the opponent a Prize. Losing when you have nothing left is
a separate condition keyed on the *board*, and once the Doll is gone the board is empty. A search
summary claimed the opposite; it was inferring rather than quoting, and the mechanical reading is
the one implemented.

Both fall out of one flag: `playsAs: 'pokemon'`, set by the generator on any Trainer that carries an
`hp`, which is exactly Clefairy Doll and Mysterious Fossil across all fourteen sets. Because it is
read at the point of *play* rather than baked into the card kind, the setup path and `basicsIn()`
(Revive, Pokémon Flute) simply never consult it, which is the correct behaviour in both.

---

## Ditto — Transform is a snapshot taken on entry, not a live mirror

**Settled 10 Aug 2026, with Trevor.** Deliberately **not** the printed reading.

The card says *"treat it as if it were the same card as the Defending Pokémon"*, which is continuous:
the opponent changes their Active and Ditto changes with it. We read it as a **snapshot instead** —
Transform fires when Ditto enters the Active spot, copies whatever is opposite at that moment, and
holds it until Ditto is benched. Coming back up re-snapshots. It is the main-series shape, it is
Trevor's call, and it is better for a video game in three concrete ways: there is no continuous
re-evaluation loop, the opponent cannot kill your Ditto by retreating into something small, and
**Ditto-vs-Ditto stops being a regress** — the opposing Ditto is already a Pikachu, so ours copies
the Pikachu.

The GBC game is silent: it did not implement this card at all, giving its Ditto an ordinary attack
instead, the same dodge it used for Buzzap. So the standing arbiter has nothing to say and the WotC
rulings should be **read rather than inferred** before 6f — that is the whole lesson of the Buzzap
entry above.

**A correction worth recording, because the same source will be asked again.** Checking the GBC
question produced a confident description of a Ditto power called *"Travel Back"* that swapped Ditto
for a Basic from hand, carrying damage, Energy and status across. No card named Travel Back exists
anywhere in the 1,251-card corpus, and Fossil Ditto (`base3-3` / `base3-18`) is a 50 HP Basic with
**no attacks at all** and one Power, Transform. Verified by grep across all 14 sets, not by memory.

**Built 11 Aug 2026 and it behaves as described.** The mechanism is a `baseCard` / `topCard` split
in `engine.js`: `topCard` is what a slot is *treated as* and returns the copy, so HP, type, Weakness,
Resistance, retreat cost, name and the entire attack list all come from one override instead of
seven. `baseCard` is the physical card and answers the three questions that are still about Ditto —
which Power it has, whether it may evolve, and what goes to the discard when it dies. `powerOf`
reads `baseCard`, which is what stops it inheriting the copied Pokémon's Power.

Transform settles in `settleTransforms()`, called after **every** action rather than at the eight
separate places a Pokémon can reach the Active spot. It is idempotent, and that is deliberate: a
ninth entry path added later cannot forget about Ditto.

One rule covers three interactions, and it is the reason snapshot semantics are cheap:
**anything that switches the Power off blocks the firing but never reverses one already made.**

- **Status.** The printed "isn't a copy while Asleep, Confused or Paralyzed" clause goes nearly dead,
  because benching clears status and a Ditto arriving Active is therefore always clean. Accepted:
  the alternative is a Ditto oscillating between two HP totals mid-combat.
- **Toxic Gas.** Muk out *first* means Ditto never transforms and sits there as a 50 HP body that
  cannot attack. Muk arriving later changes nothing.
- **An empty opposing Active** (the promote gap after a Knock Out) defers the firing rather than
  cancelling it — Ditto copies the first thing it sees.

Three consequences of the copy itself:

- **Ditto does not gain the copied Pokémon's Power.** "Always has this Pokémon Power" is read as
  *Transform is the one it has*. Also the choice that keeps 6f finite: copying Invisible Wall or
  Kabuto Armor would multiply the passive-Power surface by every Pokémon in the game.
- **Energy is wild by quantity, not quality.** Any Energy on Ditto pays any symbol; Double Colorless
  still pays for two. That is a cost-check change, not a rewrite of what the card provides, so it is
  a different mechanism from Charizard's `energyAs`.
- **The transform may Knock Ditto Out, in either direction, and the damage is never adjusted.**
  Copying something smaller than the damage already on it kills it; so does reverting to a 50 HP
  Ditto while badly hurt. Trevor's first proposal floored it at 10 HP remaining instead, and that
  was withdrawn once it turned out to be a **damage pump**: "10 remaining" can only be expressed by
  *reducing* `dmg`, so copy-a-Chansey → take 100 → bench → revert → re-promote launders 60 damage
  away, repeatably, for the price of a retreat. Carrying the damage is safe precisely because the
  snapshot model makes every transform player-initiated and fully informed — the opponent's Active
  is face up. The retreat confirmation gate warns.

---

## Aerodactyl beats Muk, and order of arrival decides it

**Settled 10 Aug 2026, with Trevor.** Prehistoric Power stops all evolution; Toxic Gas switches off
all Powers but its own. Each would disable the other, so something has to break the tie.

**Whichever is already in play wins**, because the game asks the question at the moment of the
attempted evolution and the evolution has not happened yet. An Aerodactyl on the board means Grimer
can never become Muk, so Toxic Gas never gets the chance to fire. A Muk already out when Aerodactyl
lands switches Prehistoric Power off, and evolution — including into more Muks — is legal again.

Two corollaries that will read as bugs if they are not written down:

- The same two cards produce **opposite outcomes depending on sequence**. That is correct.
- **Aerodactyl is a Stage 1**, evolving from Mysterious Fossil, so Prehistoric Power locks out its
  own line: you can land the first one and never a second.

---

## Peek follows the card; Clairvoyance follows the Game Boy

**Settled 10 Aug 2026, with Trevor.** Both are information Powers and they share one panel.

Trevor's recollection of the GBC game is that it showed the opponent's **whole hand** in a window you
closed when you were done, and that the permanent version simply let you open that window whenever
you liked, on your own turn.

**The presentation is adopted wholesale** — for Clairvoyance especially, a window you open beats a
panel permanently eating board space, and "your turn only" is right.

**Peek's scope is not.** The card is specific rather than ambiguous — *"the top card of either
player's deck, a random card from your opponent's hand, or one of either player's Prizes"* — and the
standing policy hands ambiguity to the GBC game, not clear text. So Peek offers those three, one
card at a time, in the same window Clairvoyance opens. Note the third includes **your own** Prizes:
finding out whether your Charizard got prized is the most useful thing the card does, and it would
be easy to build only the opponent-facing half.

Both are **no-ops for the AI**, which reads full engine state already — it would be spending a Power
to learn something it knows. This file said they belonged on `UNSCORED_ON_PURPOSE`; **they don't,
and the implementation is better.** `ai.js` scores `PEEK` at `-Infinity` as an explicit case, with a
comment pointing back here. Deliberately worthless beats deliberately unscored: the declaration
lives in the file that does the scoring, and the opt-out list stays reserved for verbs the AI is
never even offered. Don't "fix" this by moving it.

---

## Do the Wave counts a Clefairy Doll; Boyfriends matches on card name

**Both settled 10 Aug 2026, with Trevor, when the cards landed in Job 6d.**

**Wigglytuff's Do the Wave** — "10 damage plus 10 more for each of your Benched Pokémon" — **counts
a Clefairy Doll**. The Doll is a Pokémon while in play, which is the same reading that already
decides it cannot be your opening Pokémon and that Revive cannot reach it: `playsAs` is read at the
point of play, so once it is on the Bench it is a Benched Pokémon like any other. Neither of us
could recall the GBC game ever being asked, and both of us landed on yes while admitting it feels
odd at the table. Reversible if it plays badly.

**Nidoqueen's Boyfriends** — "20 damage plus 20 more for each Nidoking you have in play" — matches
on **card name**, not species or Pokédex number. A differently-named Nidoking would not count.

The implementation counts every slot on your side rather than the Bench specifically, which sounds
looser than the card and is not: Boyfriends is Nidoqueen's own attack, so Nidoqueen is Active
whenever it resolves, and every Nidoking you have is necessarily Benched. Trevor made the same
observation from the other direction. Counting all slots matches the printed text exactly and stays
correct if a later card ever attacks from somewhere else.

---

## A retreat cost is paid in CARDS, not Energy symbols

**Settled 12 Aug 2026. Trevor's design call, and deliberately not the official rule.**

The printed TCG rule is that you discard Energy cards whose **total value** meets the retreat cost,
so a Double Colorless — printing two Colorless — covers a cost of 2 on its own. We count the
**physical card**: a Double Colorless discards as one Energy, and a Pokémon with a retreat cost of 2
needs two cards however they print.

**Recorded carefully, because the first version of this entry claimed GBC authority it does not
have.** The supporting memory was Charizard's Fire Spin — "discard 2 Fire Energy cards", where a
Double Colorless made Fire by Energy Burn still only counts as one of the two. That is real, and it
is how this engine has always behaved, but it settles **attack-cost discards**, where counting cards
is uncontroversial and matches the official rule too: the card says *cards*. It does not establish
what the GBC game did for a **retreat**, and neither of us actually knows. So this one stands on
Trevor's reasoning rather than on the arbiter: **it silently balances Double Colorless**, which is
otherwise the strongest Energy card in the format, by making its two symbols cost the same one card
to walk away from. That is a good reason and it does not need a citation propping it up.

The consequences are worth writing down because two of them look like bugs:

- **A Pokémon with retreat 2 and only a Double Colorless attached cannot retreat.** It could before
  12 Aug 2026.
- **A Buzzap'd Electrode pays one toward a retreat**, despite providing `CC`. `powertest.js` asserted
  the opposite until this ruling and the test was rewritten rather than deleted, because the pair of
  tests either side of it is now what states the distinction.
- **Attack costs are untouched and still read symbols.** A Double Colorless still pays two toward
  `LC`. Only the *discard* counts cards, which is the whole distinction: paying a cost you keep the
  Energy, paying a retreat you lose the card. Fire Spin's "discard 2 Fire Energy cards" was always
  two cards and is unchanged — that clause says *cards* and always meant them.

This also removed a special case rather than adding one. The Energy picker had been reasoning in
symbols and needed bespoke logic to work out whether a Double Colorless beside a basic was a real
choice; with retreat measured in cards, the generic "is there slack, and are the cards different"
test is simply correct.

**The four theme decks re-measured at 75 / 50 / 43 / 32** (Blackout / Zap / Brushfire / Overgrowth)
against 72 / 53 / 42 / 33 before. That is within noise at this sample size and the direction is
right — decks leaning on Double Colorless retreat slightly less freely. Re-run `selftest.js` rather
than trusting the line; see [MEASUREMENT.md](MEASUREMENT.md).

---

## A Confused Pokémon flips to retreat, and pays before it flips

**Settled 13 Aug 2026, with Trevor, from the GBC game.** The arbiter had something to say here and
it was asked.

Confusion under the original ruleset touches **both** of a Pokémon's exits, not just attacking. This
engine implemented one of them. `confused` appeared eight times in `engine.js` and exactly one was
in the attack path; `canRetreat()` never looked at it, while its own failure message read *"Cannot
retreat (status or insufficient Energy)"*.

The rule as Trevor states it, and as built:

- A Confused Pokémon **may** attempt to retreat — it is not blocked the way Asleep and Paralyzed are.
- **The Energy is discarded first, then the coin is flipped.** Paying up front is the whole
  character of the rule and it is why the order in `doRetreat` is deliberate rather than incidental.
- On tails the retreat fails: Energy gone, Pokémon still Active, still Confused.
- **A failed attempt uses up the turn's retreat.** Otherwise a Confused Pokémon with spare Energy
  re-rolls until it succeeds and the rule becomes a tax rather than a decision. It is also what makes
  *end the turn doing nothing* a real option, which Trevor names as the correct play often enough
  that the rule has to permit it.

The last point is the one not directly quoted from him — it follows from the rest, and it is flagged
here rather than buried so it can be reversed on its own if the GBC game turns out to be looser.

**Found by reading a saved match log, not by a test.** The bot retreated out of Confusion repeatedly
in one game without a single flip. That is the second rules-level fault the logs have caught that no
suite could see; see [MEASUREMENT.md](MEASUREMENT.md).

The AI was changed with it, because a rule the bot cannot price is a rule that only punishes the
human. A Confused retreat is now valued at **the Energy it certainly costs, plus half of everything
else the retreat achieves**. Note what that does *not* say: a retreat the bot already disliked scores
*higher* when Confused, because half the time the bad swap does not happen either. That is correct
expected value and it changes nothing in practice — a negative retreat still loses to passing.
`powertest.js` asserts the distance from the bill rather than the direction, for exactly this reason.

---

## Which Energy gets discarded is the player's choice

**Settled 12 Aug 2026, with Trevor.** Not a reading of any card — a decision about who decides.

Seven effects discard Energy off a Pokémon: retreat, Energy Removal, Super Energy Removal, Super
Potion, an attack cost like Flamethrower's, Wildfire, and the attacks that strip the defender. Every
one of them used to pick by array order — "the first one attached", or "the first of the right
type". Which Fire leaves a Charizard is the difference between attacking next turn and not, so the
cards were being chosen by an implementation detail.

**The player is asked, but only when it is a real choice.** If the eligible Energy are all the same
card, or there is no slack because they are all going anyway, the game does not stop — a prompt to
choose between three identical Fire Energy is friction with no decision in it. A Buzzap'd Electrode
counts as distinct from a basic of the same type, which is correct: one of them is a Pokémon you may
want back.

**The AI is not asked and does not need to be.** Where no choice is supplied the engine falls back to
`energyPayOrder`, which spends what the Pokémon's own attacks do not ask for — so the bot gets a
sensible answer for free, and it is strictly better than the index 0 that six of the seven sites used
before.

---

## Pending

Calls we already know are coming, so nobody is surprised by them.

- **The arbiter runs out at Fossil, and Job 8 is where that starts to bite.** The standing policy
  hands an ambiguous card to the Game Boy Color game, which contains only Base, Jungle and Fossil —
  so from **Team Rocket onward there is no arbiter at all**, and every set Job 8 adds is on the far
  side of that line. Nothing is settled about what replaces it. The two candidates are the WotC
  Rulings Compendium, which this file has already used twice where the GBC game was silent (Buzzap
  and Ditto), and Trevor's own judgement, which is what actually settled the retreat-cost entry when
  the citation for it turned out not to hold. **Both are already precedents in this file** — the
  question is only which one leads. Raise it with Trevor before the first Team Rocket card, not
  during it. This was flagged in `CLAUDE.md` as needed "around Job 7, not before" and Job 7 has
  shipped.
- **Baby Pokémon (Neo era, 10 cards)** — the Baby Rule is a coin flip that can negate an attack
  entirely. Not a Base Set problem, but it is a whole rule, not a card effect.

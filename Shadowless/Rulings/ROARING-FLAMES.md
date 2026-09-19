# Roaring Flames — the confusing clause names a Base Set card, and it is already in the engine

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Written 19 Sep 2026 by Shadowless 43, ahead of Job 20 (gym2).** Trevor found the card while working
through the set, called it the most confusing description he had ever read, and brought a Gemini
answer with it. **The Gemini answer is wrong about the one clause that matters**, in a way that is
checkable against our own engine rather than against history — so the correction is below and the
original is preserved at the foot of this file, because a wrong answer with a reason is worth more
than a deleted one.

**Not locked on Trevor's authority.** He offered it as a starting point. Steps 1 and 2 of the
post-Fossil order settle it, step 3 was unavailable, and **one call is flagged for him** under
*The one thing worth your eye*.

## The card

`gym2-2` Blaine's Charizard, Stage 2, 100 HP, Fire. The corpus text, verbatim — it matches Trevor's
transcription exactly:

> **Roaring Flames** — cost `[R]`, damage `20+`
> Discard all Fire Energy cards attached to Blaine's Charizard. If all Energy cards attached to
> Blaine's Charizard provide 2 Fire Energy, discard all of them. This attack does 20 damage plus 20
> more damage for each Fire Energy discarded in this way.

Three sentences, and **they are not one rule said three ways.** Each one does a different job, and
the middle one is the whole ruling.

## Sentence 2 is about Buzzap, and it is reachable today

**Gemini says the clause is "early Wizards trying to future-proof interaction rules for multi-type or
double-energy cards." That is wrong, and it is wrong in the direction that matters** — it reads the
clause as hypothetical, which would make it safe to skip.

**One card in the Wizards era provides 2 Energy of a chosen type, and it is three sets older than
this one.** Base Set Electrode's Buzzap: *"Electrode is now an Energy card (instead of a Pokémon)
that provides 2 energy of that type."* Our engine already models it — `engine.js` sets
`card.asEnergy = a.type + a.type`, with the comment *"one card, two symbols"*. **Choose Fire and
attach it to Blaine's Charizard and sentence 2's condition is met exactly.**

**And sentence 1 cannot catch it, which is why sentence 2 exists.** `isBasicEnergyOf` opens with
`if (!c || c.kind !== 'energy') return false`, and a Buzzap'd Electrode's card id is still
`base1-21`, a Pokémon. It is an Energy card by effect, not by class. So:

| attached | is it a *Fire Energy card*? | caught by | counts as |
|---|---|---|---|
| basic Fire Energy | **yes** | sentence 1 | 1 Fire |
| Rainbow Energy, while attached | **yes** — it is a basic Energy card of whatever type is asked, in play only | sentence 1 | 1 Fire |
| Rainbow Energy, in hand or deck | no | — | — |
| **Buzzap'd Electrode, Fire chosen** | **no** — a Pokémon acting as an Energy card | **sentence 2** | **2 Fire** |
| Double Colorless | no — provides `CC` | neither | 0 |

**So the card is not over-written. It is written for a specific interaction and reads as noise until
you find the card it names.** *[Why Rainbow is caught →](RAINBOW-IN-PLAY.md)* · *[why "Energy card"
and "Energy" count differently →](ENERGY-VS-ENERGY-CARD.md)*

## What it does, then

1. **Discard every attached Fire Energy *card*** — basic Fire, and a Rainbow while it is attached.
2. **If sentence 2's condition holds, discard those as well.**
3. **20 damage, plus 20 per Fire *Energy* discarded** — counted by type, not by card. A Rainbow is 1.
   **A Buzzap'd Electrode is 2**, because that is what it provides.

Worked, with the corrected arithmetic:

| attached | discarded | Fire Energy counted | damage |
|---|---|---|---|
| 1 basic Fire | 1 card | 1 | **40** |
| 3 basic Fire | 3 cards | 3 | **80** |
| 2 basic Fire + 1 Rainbow | 3 cards | 3 | **80** |
| 4 basic Fire + 1 Double Colorless | 4 cards | 4 | **100** (the DCE stays) |
| 3 basic Fire + 1 Buzzap'd Electrode | see below | see below | see below |

**The cost is not a discard.** Paying `[R]` does not spend the Energy, so a Blaine's Charizard holding
exactly one Fire can attack and discards that same card: the floor is 40, never 20.

## The one thing worth your eye — "all" against "any"

**The printed condition is *"If **all** Energy cards attached … provide 2 Fire Energy"*, and read
literally it fires only when every attached Energy card is a double-Fire provider.** A Blaine's
Charizard holding three basic Fire and one Buzzap'd Electrode does **not** meet it: sentence 1 takes
the three Fire, sentence 2 does not fire, the Electrode stays, and the attack does 80.

Read as *"any"* — which is what the clause plainly wants to do — the Electrode goes too and counts 2,
for **140**.

**Implemented as printed, on step 1 and on this tree's own principle: *implement the ruling, not the
intent*** — the rule that stopped Dark Charmeleon's Fire clause being read as a combat rule.
*[That principle →](RAINBOW-IN-PLAY.md)* Step 3 could not be reached: the Rulings Compendium has
refused a fetch here before, and the Recall entry records the same failure.

**Trevor, this is the one to overrule if you want to, and step 4 is yours.** The argument for *any*:
the literal reading makes the clause nearly unreachable, and a clause written to catch a Buzzap'd
Electrode fails to catch one in every realistic board. The argument for *all*, which is why it is
implemented that way: it is what the card says, and this tree has been bitten before by deciding what
a card probably meant.

My response to previous paragraph, please treat it as a point of discussion rather than a ruling. I think this card might be niche enough that we can get away with treating all special energies for it as a case by case basis. Right now only Buzzap applies to this (as far as I know) so we can maybe hard code it in, and then in the event of any future energy types creating a conflict we'll talk each one through at the time. I don't think this will happen very often, if at all. Pushback, comments, or caveats are welcome either here in this doc or at the time we actually handle it.

## For whoever builds it — Job 20

**The DSL has no verb for this yet and the nearest two are both wrong.** `COST_DISCARD_ALL_ENERGY`
discards everything regardless of type; `COST_DISCARD_ENERGY {n, t}` discards a fixed count. This
wants *discard every Energy providing type `t`, count the symbols discarded, and scale damage by
them* — a pair, and the damage half has no `DMG_PER_ENERGY_DISCARDED` today.

**Do not reach for `DMG_PER_SPARE_ENERGY`.** That is the Over-Attach family, which counts Energy
**left on** the Pokémon; this counts Energy **taken off** it. The numbers coincide on a board with
nothing else attached and diverge the moment a Double Colorless is there.

**The AI consequences are real and are not the same as Charizard's.** `ammoSymbols` derives a
stockpile from `COST_DISCARD_ENERGY` and deliberately excludes `COST_DISCARD_ALL_ENERGY`, because
Wildfire's useful count is unbounded. **Roaring Flames is bounded — by the defender's HP.** Past
five Fire it is buying overkill, so it is neither Charizard's case nor Wildfire's, and it will want
its own read. It also empties the card completely: after firing, Blaine's Charizard can use neither
attack, because **Flame Jet costs `[R][R]` and there is nothing left.** That is `discardSilence`
territory and the silence is total.

## Gemini's answer, preserved

Kept because Trevor brought it and because the part it got right is the easy part — the scaling
arithmetic, which the card states plainly. What it got wrong is the clause that needed the help.

> That card features one of the most notoriously over-complicated text descriptions in classic WotC
> history, compounded by a notorious printing typo. […] **The Effect:** You discard all Fire Energy
> attached to Blaine's Charizard. For every Fire Energy discarded this way, you add +20 damage. […]
> This confusing wording was early Wizards of the Coast trying to future-proof interaction rules for
> multi-type or double-energy cards (like Double Colorless Energy or potential Rainbow/Special
> Energy). […] In practical, standard play with basic Fire Energy cards, you simply discard all Fire
> Energy attached to him, count how many Fire Energy units were discarded, and add +20 for each one.
>
> **The Infamous Printing Typo.** 1st Edition copies and early Unlimited runs of *Gym Challenge*
> featured a famous printing mistake: the attack cost symbol for Roaring Flames was mistakenly
> printed with a Fighting Energy symbol instead of a Fire symbol.

**Three corrections, in order of how much they cost:**

1. **The clause is not future-proofing.** It names Buzzap, which was already three sets old. Reading
   it as hypothetical is what would have got it skipped.
2. **Double Colorless is the wrong example.** It provides `CC` — two *Colorless* — so it never
   satisfies a Fire test and is never discarded here. Rainbow is the right example for sentence *1*
   and provides only 1, which is the reason it is not what sentence 2 is for.
3. **The printing-typo claim cannot be checked from anything we hold and does not change the build.**
   Our corpus prints the cost as `["Fire"]` and that is what we implement. Worth noting without
   asserting either way: Blaine's Charizard **resists Fighting −30**, which is a plausible source of
   a half-remembered Fighting symbol on this card.

**The transferable lesson is not "Gemini was wrong".** It is that *a clause that reads as unreachable
is worth one grep before it is modelled as hypothetical* — the pool is 1,251 cards and the answer here
was one `asEnergy` assignment in the engine.

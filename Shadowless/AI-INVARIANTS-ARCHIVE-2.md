# Shadowless — AI invariants archive 2: Jobs 11 through 12c

**The 21–25 Aug 2026 entries, verbatim and unedited.** Split off the front of
[AI-INVARIANTS.md](AI-INVARIANTS.md) on 28 Aug 2026, when that file reached **476** lines against the
~450 its own header sets, and split at a **job boundary** as that header asks: everything here belongs
to Jobs 11, 12a, 12b and 12c, and what stayed behind is Job 13's own day.

**Read it when you are about to touch one of the terms below**, exactly as you would the live file.
These are not superseded — **an archived invariant binds precisely as hard as a recent one.** Several
of these are the terms most likely to be "simplified" by somebody who has not read them, and three of
them are curves that look like arbitrary constants.

| The invariant | Term |
|---|---|
| A retreat is priced on the Pokémon **arriving**, not the one leaving; `incomingThreat` answers for the Active and only the Active | `threatAgainst` |
| A self-switch is worth **where it goes**, and the scorer fills in `a.opts` so the engine's random fallback is never reached | `selfSwitch` |
| **A trap:** `promoteValue` on the Active slot re-enters `scoreAttack`. Any new caller needs the re-entry guard | `bestSelfSwitch` |
| **An Energy is a turn**, so a retreat pays the same price a lost Energy costs. `retreatBase` is purely tempo from here | `retreatSaveEnergy` |
| A wall's low damage is not a deficiency, so it is not an upgrade opportunity — asymmetric on purpose | `wallScore` |
| **Ammunition is not surplus.** Headroom is derived from the discard verb, not from a list of cards | `ammoSymbols` |
| A rider is worth nothing on a Pokémon the attack removes — a **proportion**, not a switch, and `drag` is the exception | `1 - pLethal` |
| A barrier is worth what it prevents, **linear** in the damage stopped | `shieldSelf` |
| A turn taken away is worth the attack it denies; Poison is excluded because it is a clock, not a stolen turn | `DENIES_A_TURN` |
| A barrier that saves your life is priced **as a life**, squared, off `selfKO` rather than off a tempo weight | `shieldSelf`, `selfKO` |
| A discard costs **turns of silence**, squared, discounted by survival — and it reads the CHEAPEST attack, never the best | `discardSilence` |
| A rider is worth nothing on a Pokémon that **already has it** — but Paralysis refreshes, so it is exempt | `statusNovelty` |
| **A rule proven in `scoreAttack` does not reach `scoreTrainer`.** Three rider rules were missing from the Trainer path entirely | `pLethalThisTurn` |
| Three PROVISIONAL Power cases referenced a `me` this function never defines and crashed the instant a deck actually fielded one | `SEARCH_EVOLUTION_TO_HAND`, `STATUS_COIN_EITHER_POWER`, `DISCARD_THEN_DRAW` |

**This file is an archive. It only ever grows, it is never rewritten, and nothing in it may be
condensed** — an invariant stripped to its claim loses the reason, and the reason is what stops the
next pass undoing it. Correct an entry that turns out wrong; never shorten one. The 200-line target
does not apply. **Start `AI-INVARIANTS-ARCHIVE-3.md` rather than growing this one past ~450.**

**Where each account lives is a table in the live file's header**, and it covers these dates: the
21–22 Aug retreat and Charizard work came out of match logs and has a fuller account in
[GRABHIST.md](GRABHIST.md); the status, barrier and attack-choice work came out of a playbook pattern
and its measurement tables are in [`Playbook/`](Playbook/); **the 25 Aug Power-scoring crash came out
of a `decksim.js` run and this is the only copy that exists.** Condense that one and the reasoning is
gone.

## The entries

Chronological, oldest first.

**A retreat is priced on the Pokemon ARRIVING, not the one leaving.** *21 Aug — #21.* The guard that was
supposed to stop the bot walking into a Knock Out compared `incomingThreat` — the threat against the
Active that is *leaving* — with the remaining HP of the one *arriving*. Those agree only when both
have the same matchup against the attacker, which is precisely when the guard is not needed. The
question is asked with `threatAgainst(pi, b)` now. **`incomingThreat` answers for the Active and only
for the Active**; anywhere a decision is about a different slot, it is the wrong function, and this is
the second time that has cost something — `promote` had the identical fault in Job 9 and the fix was
never carried across. **Two penalties, not one**: dying on arrival is bad, and dying on arrival having
just abandoned a Pokemon that would have *survived* is a conceded Prize that did not have to exist.
Asserted in `powertest.js` from Trevor's own logged position rather than duelled, because the change
is symmetric, it is about perception, and it fires only on a matchup difference — three separate
reasons a duel reports nothing. **It was duelled anyway and it reported nothing**, which is the
prediction holding rather than the change failing: 50.4% ±0.8 against HEAD over 8 seeds on the ladder
pool, with the control at 49.9% ±0.8. Do not re-run it expecting a different answer. `aitest.js` moved
*retreats with nothing threatening the Active* from 50% to 47% and the retreat rate barely at all,
which is the right size for a fault that fires only when the two Pokemon differ in weakness or
resistance.

**Teleport is worth where it goes, and the bot has to choose where that is.** *21 Aug — #21.* `selfSwitch`
scored `frail ? dangerSwap : 2` — flat, and blind to the Bench — so an even swap and a rescue were the
same number. It is a **difference in `promoteValue`** between the best benched Pokemon and the Active
now, which makes a mirror swap worth exactly zero without a rule saying so, and prices dying on both
sides for free because `promoteValue` already does. **The larger half was invisible to any score**:
nothing in `ai.js` had ever written `opts.bench`, so `SWITCH_SELF_CHOOSE` fell through to the engine's
`this.pick()` — a seeded random. That is the triggered-Power gap in this file arriving through an
attack instead of a Power, and the same remedy applies: **the scorer fills in `a.opts` while it
scores**, so the fallback is never reached. A `may` version can decline, and does, by writing
`bench: -1`.

**`promoteValue` on the ACTIVE slot re-enters `scoreAttack`.** *21 Aug — #21, and this is a trap rather than
a feature.* `promoteValue` → `potential` → `scoreAttackHypothetical` → and for the Active that last
one *is* `scoreAttack`. Any new caller of `promoteValue` from inside `scoreAttack` needs the same
re-entry guard `bestSelfSwitch` carries, or the stack dies on the first board where the attack is
legal. Nothing caught it for the length of a full suite run: **no theme deck holds a self-switch
attack**, so 402 assertions and 144 complete games passed with the loop sitting there. It has its own
regression test now.

**An Energy paid for a retreat costs what an Energy lost costs.** *21 Aug — #21.* The retreat rule charged
`cost * 4` for the Energy it discards while `retreatSaveEnergy` credits **7** for the same commodity
two lines below — one function, one Energy, two prices, so a retreat that spent two to save three came
out ahead by more than the one Energy it actually netted. Trevor's argument is economic rather than a
preference: **you may attach one Energy per turn, so an Energy is a turn**, and it is gone in exactly
the sense `retreatSaveEnergy` already measures. Both are `retreatSaveEnergy` now. `retreatBase` is
**purely tempo** from here — the turn spent, not the cards; do not read it as covering Energy again.

**A wall's low damage is not a deficiency, so it is not an upgrade opportunity either.** *21 Aug — #21.* The
tempo half of the retreat rule compares the best affordable printed damage of the Bench candidate
against the Active's — and **Chansey's is Scrunch at zero**, which made every benched Pokemon read as
an upgrade every single turn. Trevor: *"Chansey is meant to go in there, use Scrunch, and stall while
everything else is powered up on the bench, ending in a sacrifice."* The positive half of that delta is
suppressed by `wallScore` now, reusing the same derivation the rescue term uses rather than inventing
a second notion of what a wall is. **Asymmetric on purpose**: swapping a wall out for something
*weaker* is still a real loss at full price. It is only *"I could be hitting harder"* that stops being
a reason.

**Both are asserted, and both are near-invisible to a duel.** Measured together on the ladder decks:
retreats **7.1 → 6.0 per 100 turns**, Energy burned on retreat costs **8.2 → 6.1** — a 26% drop — and
games got measurably *longer*, which is what less Energy churn looks like. The benchmark deck moved
from 8th to 7th of thirteen. That last figure is the point of the benchmark and not a small result: see
[MEASUREMENT.md](MEASUREMENT.md).

**Ammunition is not surplus.** *21 Aug — #21.* An attack that discards its own Energy to fire turns spare
Energy into rounds, and the surplus rule — which refuses an attachment that unlocks no new attack —
hard-capped Charizard at four. Measured: a fifth Fire scored **−2**, Active or benched. Fire Spin
discards two cards per use against one attachment per turn, so **the bot could never fire it twice in
a row**, which is the entire deck. `ammoSymbols()` derives the headroom from the `COST_DISCARD_ENERGY`
verb rather than from a list of cards, so every card carrying it gets this for free and the other
1,200 are untouched — there is a test asserting Hitmonchan still caps. `COST_DISCARD_ALL_ENERGY` is
deliberately excluded: Wildfire discards any number, so "how much is useful" is unbounded and a
headroom figure would be a guess dressed as a derivation.

**This is the change that moved the benchmark**, and it is the largest single move the AI has had:
`b1_t4_fire` went from **8th of 13 at 46.9%** in the morning to **6th at 52.8%**, above five decks it
had been below. Both halves of it came out of Trevor describing how he plays the deck — the other
half is an engine fix and lives in [ENGINE.md](ENGINE.md)'s `takeEnergy` section, because the pay
order was discarding the Double Colorless first on the one Pokemon where it is worth two Fire.

**A rider is worth nothing on a Pokemon the attack removes.** *22 Aug — #22.* Paralysing a corpse buys no
turn — the Knocked Out Pokemon leaves and a fresh one arrives unafflicted — but the status block had
no lethality term, so Gyarados scored Bubblebeam at **293 against an equally lethal Dragon Rage's
280** and spent an extra Water on a coin that could not land on anything. Every rider in that block
takes `1 - pLethal` now: statuses, jam, Amnesia's attack lock and an Energy strip. **It is a
proportion and not a switch**, the same per-outcome discipline `expUseful` uses — at half lethal the
status matters in exactly the half of the distribution where they are still standing. **`drag` is the
one exception and it is deliberate**: it acts on the Bench, and if the attack kills, the promote
happens regardless — only *who picks* differs, which is worth the same either way. **The guard already
existed one flag over and had never been generalised** — `f.flags.bounce` has carried `pLethal < 0.9`
since it was written. *That is the transferable part: when you find a guard on one rider, check its
siblings in the same block* — the same lesson the Confusion work left, arriving from a new direction.

**A barrier is worth what it prevents.** *22 Aug, and it is cliff instance seven — #22.* `shieldSelf` was
flat at 0.7 below the frail line, so Fearow's Agility scored an identical **27.00 against an incoming
0, 30 and 60**. It is linear in `min(danger, hpLeft) / hpLeft` now, with the coefficient chosen so the
curve passes through the old constant at **half HP** — every board the flat value got about right is
unchanged and only the two ends move. **The frail multiplier is untouched**, so nothing above the line
changed at all. Both halves came from Trevor naming Agility, Rapidash and Seadra as one shape with
Ice Beam: *spend a turn on the weaker attack to buy a turn.*

**A turn taken away is worth the attack it denies.** *22 Aug — #22, and it is the other half of the same
idea.* `paralyze` was a flat **26** whether the opponent was a charged Zapdos or a Chansey with no
Energy — a constant standing in for a quantity that is entirely about the board. **The old constant
was the average board, and not loosely**: this file measures the format's mean attack at 25.4 printed
and 27.0 expected, so 26 *is* that mean. Dividing by it makes the term read the real opponent while
reproducing every old value against an average one. **Paralysis, Sleep and Confusion scale;
`incomingThreat` capped at the attacker's own remaining HP is the quantity, and it is the same
`denied` the barrier reads two blocks down** — declared once at the top of `scoreAttack`, because
Trevor's point is that these are one idea and the code should say so.

**Poison is pointedly excluded and that exclusion is the whole reason `DENIES_A_TURN` is a table.**
Poison is damage over time, not a turn taken away — it ticks whether or not they could ever attack,
so reading it off their threat would price a real unconditional clock at zero against an empty board.

**There is no share-of-a-turn table, because the weights already are one.** 26 / 22 / 15 is
1 : 0.85 : 0.58, which is how much of a turn each takes away, priced when they were written. A second
table would have applied that ratio twice. **When you add a dimension to a weight, check the existing
weights are not already carrying it.**

Measured: Dewgong takes Aurora Beam against a Chansey with no Energy, Ice Beam against a charged
Electabuzz or Zapdos, and Aurora Beam whenever it is lethal — which is Trevor's rule, including the
clause he supplied on being asked. **The break-even is an incoming 40**, where the extra 20 damage
and the half-chance of denying 40 are genuinely equal and the tie goes to damage. `abtest`: **40.8%
of games diverged**, win rate 49.6% → 49.9%.

**Both were asserted in `powertest.js` and every failing test was watched going red against the
pre-fix engine first.** Several deliberately stay green in the control — they assert what must *not*
have moved, and a guard that cannot fail is not a guard.

**Two of those assertions then went red on the turn-value change, and that is worth more than the
tests themselves.** They used a bare Chansey to mean *"a target that survives"* — a complete board
while a rider was worth a flat 26, and an ambiguous one the moment a bought turn started reading
threat, because an unarmed Chansey now satisfies *survives* and *buys nothing* at the same time. The
fix was four Fighting Energy, not a weaker assertion. ***A fixture encodes the model that was true
when it was written**, and it only warns you when it fails.*

**A barrier that saves your life is priced as a life.** *22 Aug — #22, and it is the Energy-priced-twice
fault in a new place.* `selfKO` charges **70** for a Pokemon the bot kills with its own recoil, while
preventing exactly that outcome credited `0.5 × shieldSelf × 1.6` = **16**. One event, two prices, and
the cheap one was the defensive side — so Fearow took Drill Peck's 40 over the Agility that was its
only out at 36, on a board where the incoming attack kills it. **Two terms now, because two different
things are being prevented and they have different shapes** — see the last two rows of the cliff
table. **The `frail` boolean is gone from this decision**: it was a step standing in for the top of a
curve, and once the curve reaches the top on its own, keeping it would only reintroduce the
discontinuity. `frail` is still computed, for `destinyBond`.

**The guard that matters here is that lethal still wins**, because raising the defensive side is
exactly the change that could break Trevor's *"unless Drill Peck can kill"*. It is pinned in
`powertest.js`, and `aitest` reports **0 turns ended holding a game-ending lethal**. `abtest`: **13.3%
of games diverged**, win rate 49.9% → 49.7%, retreats and Energy burned unmoved at 6.1 and 6.0 per
100 turns.

**Measured against the playbook rather than against a duel: five of the eight unverified cards in
that pattern already behaved, and the two that did not were one cause.** Rapidash, Marowak, Venonat,
Grimer and Cloyster-under-threat needed nothing; Fearow and Seadra needed this. *That ratio is the
argument for building the boards rather than reasoning about them* — the two that failed were not the
two anybody would have guessed, and three of the five that passed had been on a list of suspects.


**A discard costs TURNS OF SILENCE, not cards.** *23 Aug — #24, and it is the first invariant that
came from a claim row rather than from a log or a suite.* `energyCost * energyDiscard` charged a flat
**7 a card** for every attack that eats its own Energy — the same rate whether Charizard spent two of
six it would replace on the next two turns, or Zapdos emptied itself to nothing and stood silent for
four. **`discardSilence` measures symbols short of the CHEAPEST attack after the discard**, which is
turns you cannot attack at all because you may attach one Energy a turn, and it is **squared** on the
cliff table's own rule: silence is a cost, and two turns of standing there while they attack you
freely is worse than twice one turn.

**The survival factor is not a second idea and that is the whole shape of this entry.**
`survivesCharge` already answered *"will this Pokemon live long enough for a shortfall of N to
matter"*, written for attachment; a discard is that question asked backwards, so it took no new term.
Thunderbolt is priced out of a healthy Zapdos at **44 against Thunder's 46**, and priced back in at
**72** the moment Zapdos will die to the next hit — Trevor's endgame clause, closed by the term
written for the other half of his note.

**Both halves are Trevor's, sent as two guesses about two different cards.** *"An energy burn while
holding an energy abundance is rather cheap"* and *"could this be weighed over turns of expected
life"* are the two factors of one quantity: how much you will miss it, and how long you will live to
miss it. **The second time he has unified a cluster from outside it** — the first was paralysis and an
Agility barrier being one bought turn. *[The pattern, with the note verbatim →](Playbook/AMMO.md)*

**IT READS THE CHEAPEST ATTACK AND NOT THE BEST, DELIBERATELY.** Arcanine's note asks for Take Down to
be held *in reserve*, which is an option value nothing here prices; what this prices is being unable
to act at all. Do not "fix" that by switching it to the most expensive attack — Charizard would then
be charged for a Fire Spin it can fire again next turn, which is the ammunition rule inverted.

**Measured, and the honest reading is mixed.** Every card that burns Energy was swept and none was
turned off; Recover still scores exactly 0 on Starmie and Kadabra, which is Trevor's *"Recover should
never be used"* arriving from a direction nobody was testing. The benchmark deck went **rank 6 to
rank 5**, 52.9% → 53.8%, assembly flat at 55%. **`aiduel` against the pin reads 51.4% ±0.5 against
51.5% ±0.9 before it — a null**, and exposure was checked before that was believed: **17 of 37 ladder
decks carry a burner, 65 copies**, so the instrument is not blind here. A symmetric perception change
reading flat is what [MEASUREMENT.md](MEASUREMENT.md) predicts, and it is recorded rather than
explained away.

**It reversed a 14 Aug assertion**, which is the only invariant in this file to have overturned
another. `powertest.js` held that a fresh Arcanine prefers Take Down; Trevor's card note says
Flamethrower. The test was rewritten rather than deleted, because what it was *protecting* — that
recoil pricing must not turn Take Down off — is still true and is still worth a guard.
*[Why, and what the rewrite asserts instead →](HISTORY.md)*

**A rider is worth nothing on a Pokemon that ALREADY has it.** *23 Aug — #24, and it is the 22 Aug
rider rule with a different ending.* That one said a rider is worth nothing on a Pokemon the attack
*removes*; this one says the same about one it cannot affect. Both were flat: **every status verb in
the game scored identically against a clean target and an afflicted one.** Poison Sting kept its full
poison credit against something already poisoned, and Toxic scored **44** against a target it could
not change in any way.

**Found by two of Trevor's notes landing on one term**, neither of which mentions scoring and neither
of which is about the other's card. Nidoking: *"Once the opponent is poisoned, Toxic cannot add
additional poison damage, so Thrash becomes more valuable."* Beedrill: *"Poison Sting first, and then
Twineedle when the opponent is already poisoned."*

**IT IS NOT ONE RULE FOR ALL FOUR STATUSES, and that is the care in it.** `statusNovelty` reads what
the engine actually does rather than a table of opinions. Poison, Sleep and Confusion persist until
cured, so re-applying is worthless. **Paralysis is not redundant** — `endTurn` clears it on
`paralyzedTurn < turn`, so a second application refreshes the timer and genuinely buys another turn.
And the big three replace each other in `applyStatus`, so a *different* one on an afflicted Pokemon
is a swap and is not discounted at all. **Toxic against a 10-poison target is the partial case**, worth
half: it cannot re-poison but it can raise the tick to 20, which is why the card is printed "(even if
it was already Poisoned)".

**Measured, and the exposure is small — recorded rather than dressed up.** 250 games, 1,791 attacks: a
defender is afflicted by anything at all in **1.5%** of attacks, and **10 of 333 status attacks (3.0%)**
landed where the rider was fully or partly redundant. Both aggregates read null — `aiduel` against the
pin held at 51.4% ±0.5, the benchmark held at rank 5 — and **the exposure was measured before either
null was believed.**

**Kept anyway, and not for the win rate.** A bot that Toxics a Pokemon already carrying Toxic is
*visibly* stupid to the person sitting opposite, and [MISREADINGS.md](MISREADINGS.md) already says a
duel cannot see the rare error that matters to a human. Compare the Paras finding of 22 Aug, measured
at 6.2% and deliberately **not** built: the difference is cost, not size. That one needed a new
capability; this one needed a multiplier on a term that already existed and is derived rather than
tuned, so there is nothing to maintain.

**A rule proven in `scoreAttack` does not reach `scoreTrainer`.** *24 Aug — #24, and the entry is
about the code path rather than the card.* `T_STATUS_ON_FLIP` scored a flat `0.5 * W[key]` and carried
**none** of the three things the attack path had learned about riders during the same week — novelty,
lethality, and pricing a bought turn off what it denies. All three were built, tested and shipped;
none of them was in this function. Sleep! scored an identical **11.00** against a healthy target, a
target the bot could Knock Out that same turn, and a target **already asleep**.

**Trevor's note named two of the three from play** — *"should not be played against a pokemon that's
going to die in the same turn or is already asleep"* — and the third was added anyway, because leaving
it out would have left the game holding two different prices for one bought turn, which is exactly the
inconsistency #22 fixed for attacks two days earlier.

**`pLethalThisTurn` is the new part and it is deliberately pessimistic.** A Trainer is played *before*
the attack, so there is no `forecast` to read `pLethal` off; it takes the **maximum** across affordable
attacks rather than the one the bot will pick. Over-stating the kill chance under-values the rider,
and that is the safe direction here — the failure being fixed is a card spent on something already
leaving.

**LIVE EXPOSURE IS ONE CARD AND THAT IS STATED RATHER THAN BURIED.** `Sleep!` is the only printing in
the four live sets carrying either verb. `T_STATUS` was folded into the same case for the sets that
come later, where status Trainers are common. **The value here is not the card; it is the class.** No
suite covered it, the situation is far too rare to move any duel, and the card works perfectly for a
human — which is the silent-failure surface `AI.md` opens with, arriving in a function nobody had
checked. **Worth a systematic pass**: `scoreTrainer` has never been read against the invariants above
it in this file, and 36 of Trevor's 219 live notes are Trainers.

**Three of Job 10c's "ordinary Powers" referenced a `me` (and one a bare `p`) that this function never
defines, and every one of them crashed the instant the bot actually held the card.** *25 Aug — #26.*
`SEARCH_EVOLUTION_TO_HAND`, `STATUS_COIN_EITHER_POWER` and `DISCARD_THEN_DRAW` all read `me.deck` /
`me.hand` / (in the last case) `p.status` straight off, with no local binding — `scorePower(pi, a)`
has no outer `me`, unlike `scoreAttack`'s scope. `STEP_IN`, `COWARDICE` and `BUZZAP` in the same switch
each define their own (`me`, `me`, `me3`), which is what a ReferenceError looks like next to three
cases that quietly never ran. **Found by `decksim.js` against `data/base5_decks.json`** — the Team
Rocket roster is the first to field enough Powers of these three kinds for the AI to actually choose
one in a simulated game, so nothing had ever called this code path before. Fixed by giving each case
its own `const me = E.state.players[pi]` (and reading the Power's own config via `E.powerOf(slot)`
for the `status` field, the same pattern `MOVE_DAMAGE` already used for `side`) — see PLAYTEST.md's
own warning that a blind harness "fails silently, and fails in the safe direction": these three did not
fail safely, they threw, and only because nothing had ever reached them to notice. **The weights
themselves are still PROVISIONAL and untouched** — this fixed the crash, not the pricing.

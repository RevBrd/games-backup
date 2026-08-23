# Shadowless — what has shipped in the AI, and the invariant each one left

**One entry per change to `src/ai.js` that shipped, in the order they shipped, each stating what must
stay true.** Read the entry before you touch the term it names — every one of these is a rule
somebody bought with a wrong version first.

[AI.md](AI.md) is the parent and holds the *model*: how the bot scores, where it fails silently, the
Active/Bench unit split, the cliff table and the open list. It carries an index of everything below,
so you can find the entry you need from there without reading this file. **Nothing here tells you
whether a change worked** — that is [MEASUREMENT.md](MEASUREMENT.md).

**This file is append-only and exempt from the 200-line target.** Add an entry when you ship a
change; correct one that turns out wrong; never shorten one. An invariant condensed to its claim
loses the reason, and the reason is what stops the next pass undoing it. Split out of `AI.md` on
22 Aug 2026 at 549 lines, the same shape `LOGBOOK.md` and `Rulings/` took.

**Sign your entries with your designation, beside the date — Trevor's ask, 22 Aug 2026**, so the
sequence of events is readable without cross-referencing `CREDITS.md`. The twenty-three entries that
predate the convention were signed retroactively **only where the evidence is unambiguous** — a
`CREDITS.md` row naming that exact change, or a `GRABHIST.md` heading naming the instance. **Two are
deliberately left unsigned**, the 18 Aug Energy-pool fix and the 19 Aug Prize picker, because two
instances were working on each of those days and nothing names which one. A guessed attribution is
worse than a blank: nobody re-checks it, and it is somebody's work.

**When this file passes ~450, start `AI-INVARIANTS-ARCHIVE-1.md` at a job boundary** rather than
growing it. Stated here at the top, before the decision, rather than only at the bottom where it
would be read too late.

## Where each account lives, and why the answer is three files

**The entry below is the rule. The account of how the fault was found is somewhere else — and there
are now three somewhere-elses.** This has been stated wrong three times, each time by a sentence that
was true when written, so it is a table rather than a claim:

| Entries dated | Fuller account in | Because |
|---|---|---|
| 13–16 Aug, 19 Aug | [GRABHIST.md](GRABHIST.md) and [its archive](GRABHIST-ARCHIVE-1.md) | they came out of Trevor's grab bag, which has its own append-only register |
| 18 Aug | **nowhere else** | they came out of *set and job work*, and nothing was recording that |
| 21–22 Aug | [GRABHIST.md](GRABHIST.md), or [`Playbook/`](Playbook/) | the retreat and Charizard work came from logs; the status, barrier and attack-choice work came from a playbook pattern, and `Playbook/ATTACK-CHOICE.md` holds its measurement tables |

**The opening placement fix, the Energy-pool fix and the whole triggered-Powers section are the only
copy that exists.** Condense one of those and the reasoning is gone.

**Check the table before you trim anything on the grounds that it is preserved elsewhere**, and check
the elsewhere itself. A "this is duplicated" claim is a claim about *two* files and it decays the
moment either one moves; the blanket version of it was cited once as grounds for refusing this
material a home at all. *[That refusal, and why it expired →](HISTORY.md)*

## The entries

Chronological, oldest first.

**The retreat re-tune — a curve, not a number.** *13 Aug — #12.* `retreatPrize` divides by the Prizes the
opponent still needs, and the divisor is **squared**: 1.7 at six Prizes, 6.7 at three, 60 at one.
**Do not replace it with a scalar.** A flat sweep improves monotonically all the way to *deleting the
term*, because the scalar moves both ends of the curve at once and a duel cannot see the endgame case
at all — every one of those rows buys the early game by selling the last Prize. **When a sweep
plateaus at zero, suspect the shape before you believe the conclusion.**

**Stickiness — what a Pokémon is *for*.** *13 Aug — #12.* Some cards exist to stand there and soak, and no
weight can express that because it is a claim about the card rather than the position. Three things
about how it is built are load-bearing. It is **derived, not tagged** — a tag would be re-typing a
fact already in the card data on 1,251 cards. It is **terminal Basics only**, because "cannot evolve
further" would call Charizard a wall and a Stage 2 is three cards you badly want to rescue. And
utility is matched by **effect verb, not card text** (`STALL_VERBS`), because Tauros confuses *itself*
and a regex on "Confused" promotes it. **Stickiness suppresses the rescue, never the Prize** — which
is how Trevor's caveat, leave them in *unless the opponent has one Prize*, falls out of the arithmetic
instead of being a special case. Kept on correctness rather than on a duel result; eight assertions in
`powertest.js` hold it.

**Weakness and Resistance reach the retreat comparison.** *13 Aug — #12.* `bestAffordableDamage` was the one
forecast path not going through `computeDamage`, so the "one currency" comparator answered in printed
numbers. **The engine's own comment promises the AI can never predict something the engine would not
do** — that is the property being preserved.

**Recoil is priced on what it leaves you, and overkill is not paid for.** *14 Aug — #12.* Recoil costs a
share of the HP remaining, **squared, meeting the old flat cliff exactly at `frac` of 1**, so every
decision the cliff got right is unchanged and only the slope below it is new. Separately `forecast`
returns `expUseful` beside `expDmg`, capped **per outcome** rather than on the mean. **`expUseful` is a
second field and not a cap in place, and that is not caution:** PlusPower asks *"is this 10 short of
lethal"*, a question about real damage that capping makes unanswerable for anything already lethal.

**Inert Energy, and an attachment that could never make anything bigger.** *16 Aug — #16.* Attaching a Grass
onto a cost of F strands the card. The rule was the easy half; **the exception was the whole job** —
every inert attachment was waved through on *"but it could pay for a retreat"*, and only the Active
can be made to retreat, so the exception is one slot wide now. **When a rule already has a carve-out,
measure the carve-out before you widen the rule.** A real bug fell out of a test written for something
else: `potential()` counted hypothetical Energy against attack *costs* only and never put it on the
slot, so **no attack in the game could be known to get bigger from an attachment.**

**Progress is worth a share of what it is progress toward.** *16 Aug — #16, and the design came out of
Trevor's plain-English reasoning rather than out of the code.* Advancing an attack used to pay a flat
`attachBuild` with no idea what was at the end of the road, so one Energy completing a 10-damage
Tackle beat one of four toward a 60 — permanently and by construction. Advancing is **amortised** now.
Two details are load-bearing: **`potential()` returns `goal` beside `short`**, because amortising
toward an attack the Pokémon will never afford prices a road it is not on; and **`survivesCharge`
discounts only the Active**, graded rather than a cliff.

**Who gets sent up.** *16 Aug — #16.* Promoting, being Whirlwinded up and choosing a Switch target were three
nearly-identical formulas with no obligation to agree. **They are one `promoteValue` now — keep it
that way.** Survival inside it is priced with **the retreat rule's own arithmetic**, because it is the
same bill read from the other side and one formula cannot disagree with itself. **The sacrificial
promote survives for free**: a bare Basic has nothing invested, so feeding it stays cheap without a
rule saying so.

**Two things the scorer could not see at all.** *16 Aug, both omissions rather than misjudgements — #16.*
**Attacking while Confused had no price**, and **both directions are asserted** — "never attack while
Confused" would be worse play than the bug. *The generalisable half: the retreat rule learned about
Confusion on 13 Aug and the attack path never did. **Check any decision that reads `status` for one
branch and not its siblings.*** And **recoil is waived when the defender prevents the damage** — see
[Rulings/PREVENTED-DAMAGE-RECOIL.md](Rulings/PREVENTED-DAMAGE-RECOIL.md) — priced at `f.pStopped`
rather than as an on/off switch, so it does not become entry seven in the cliff table above.

**Don't lose the game either.** *16 Aug, the exact mirror of "win the game if you can win the game" — #16.*
A 10 HP Electabuzz Knocked out its target, killed itself, handed over the last Prize and lost on the
turn it scored — rated 73.5 against a safe alternative at 33. **An average hid it, and that is the
part that generalises:** expected recoil was 5, and this scorer is built on expected value, so *any*
catastrophic minority branch is invisible to it by construction. **It had to be a different kind of
term, not a bigger one** — a self-Knock-Out that *ends the match* is charged `lastPrize`, not
`selfKO`, because no value of `selfKO` fixes this without breaking every ordinary recoil decision.
**Losing is not a large Knock Out.** The win shortcut in `choose()` needed its own guard, because it
returns a near-certain lethal *before any scoring runs*. **Where to look for more of these: anywhere
the scorer averages over outcomes and one of those outcomes is terminal.**

**Your own deck is a resource, and running out of it loses.** *16 Aug — #17, from two of Trevor's grab bag
items that turned out to be one.* The bot understood decking *you* out as a weapon and had no concept
of doing it to itself. Two terms, and the split is the recoil work's lesson reused: `deckBurn` is a
cost on the **squared share of what remains**, and `deckLoss` is terminal for a play that empties the
deck outright. **It is a curve and not the floor at 20 cards the report asked for** — a floor is the
cliff shape in the table above and would make 21-vs-19 a personality change — but the *band* is
Trevor's, settled by showing him the table: `deckBurn` is set so the band runs 20 down to 10.
**Gambler is priced on NET change and must not be capped alongside Bill:** it is the only recycling
card in the game, and its credit has its own weight (`deckRecycle`) rather than sharing `deckBurn`.
That split is load-bearing — the two were one number, and widening the burn band would have quietly
made recycling pay more than a Knock Out. ***A constant doing two jobs gets retuned for one.***

**Opening placement ranks before it measures.** *18 Aug — #15.* `setupAuto` chose the opening Active by
one line — highest HP among the Basics in hand — and it is **both sides'**, since the player's "auto"
button calls it too. That makes it a shared sensible default rather than an AI decision, which is why
the fix stayed in `engine.js`; an earlier draft of this file said to move it into `ai.js` and that was
wrong for the player-facing half. Basics are now ranked *stranded last*, then sorted by HP inside the
rank. **A line-starter is only stranded when nothing rescues it** — its evolution in hand, a spare copy
in hand (Trevor's refinement: only one can be Active, so the duplicate covers the evolution path and
the one out front is free to be spent), or nothing evolving from it at all. **Measured 16.6% → 0.0%**
across Trevor's eight Base Set decks, worst deck 27.4%; `abtest` puts 13.3% of games on a different
line with the win rate unmoved at 49.1% → 48.4%. **Keep HP as the tiebreak** — it was never the wrong
question, only the wrong *first* question.

**The instrument lied first, and the lesson is the transferable part.** `tools/openercheck.js`
originally reimplemented `setupAuto`'s rule in order to measure it, so it reported *identical figures
before and after the fix* — it was measuring a copy of the code rather than the code, and it also put
the defect at 6.0% when driving the real engine says 16.6%. **A measurement tool must call the thing
it measures.** Same shape as the green-for-the-wrong-reason case in [HISTORY-ARCHIVE-1.md](HISTORY-ARCHIVE-1.md), and it
was caught only by running the control against the pre-fix engine — which is [MEASUREMENT.md](MEASUREMENT.md)'s
standing rule doing exactly its job.

**The Energy pool is asked of the engine, not read off the printed cards.** *18 Aug.* `potentialOf`
built its symbol pool from `db[e.id].provides`, which is what a card prints — not what it *provides
where it is attached*. **That made the whole Charizard archetype invisible to the bot.** Fire Spin
costs `RRRR`; a Double Colorless on a Charizard is `RR` under Energy Burn and is the best attachment
in the deck, but read off the card it is `CC`, which pays nothing toward `RRRR`. Attaching one moved
`short` from 4 to 4 and scored **4.4 against a Fire Energy's 33.0**, so the bot never did it — four
dead cards in a sixty-card deck built around them. It now reads `E.slotSymbols(slot)`, which resolves
Energy Burn *and* the per-instance `asEnergy` override, so a Buzzap'd Electrode was mispriced by the
same line and is fixed by the same change. **Never re-derive what a slot provides; ask the engine.**

**Why no gate caught it, which is the transferable part.** Energy Burn is *passive* — there is no verb
to leave unscored and no action to leave unoffered, so both coverage checks were correct and silent.
`powertest.js` asserted the **engine** saw `RRRR` and it did. The AI was keeping a private copy of a
question the engine already answers, and a private copy is exactly what neither gate can see. **When
the AI recomputes something the engine exposes, that is the bug shape to suspect.** Worth 2.4 points
to the Charizard deck in `decksim` and 8.9% of games in `abtest`, with the field win rate unmoved —
and it moved no other deck in the roster, because no other deck runs Double Colorless. Found by
Trevor asking whether the bot knew a DCE turns into Fire.

**The bot may not choose its own Prize, and that is a self-restriction rather than a gap.** *19 Aug
2026.* Prizes are face down, and `ai.js` reads full engine state — so letting it pick would hand it
Peek's entire value for free, in every game, forever. It takes one at **random**. Exactly the same
reasoning as scoring `PEEK` at −Infinity, and the same shape as the Challenge restriction Trevor asked
for in Job 10: **the bot may only act on what it could legitimately know.**

**The one exception is the one that makes it fair.** Once somebody has played *Here Comes Team
Rocket!* every Prize is face up **to both players**, the information is public, and a bot picking at
random would be playing badly on purpose. So `prizeIndex` runs only when `state.prizesFaceUp`, and
`powertest.js` asserts both halves — random while face down, the useful card while face up.

**It reuses `cardKeepValue` rather than having an opinion of its own**, which is the part worth
copying. That per-card scoring was inlined in `handKeepValue` (Trevor's rule, 16 Aug: evolutions you
can use, Energy you are short of, Trainers are real cards) and was extracted so the Prize picker could
share it. **A second opinion about what a card is worth would have drifted from the first**, and the
bot would have valued the same card differently depending on where it was looking at it from.

**The player's own picker is a setting rather than a realness gate, and the first design here was
wrong.** I proposed gating it on whether the engine could see that the choice was real — the
`energyChoiceIsReal` pattern — and Trevor pushed back. The analogy does not hold: with Energy the
*engine* can judge realness objectively, while with a Prize only the player can, so the gate would
have taken the decision away in both directions. *[The setting, and where it lives →](INTERACTION.md)*

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


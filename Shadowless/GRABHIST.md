## Grab Bag History

This is optional, I just thought you might want to a place to document what you did. Edit this header or add your own instructions if you'd like.

**Optional means optional, and that is Trevor's line above rather than a courtesy.** Nothing here is
owed. Working an item and writing nothing down is a complete job — you will have told him what you
found in the reply, which is the part that actually matters. Write an entry when *you* think the
finding was worth the finding.

Kept newest-first, one entry per item, with **what it actually turned out to be** — which has
sometimes been something other than what the note said, and that gap is the reason anyone would read
this. A *parked* item is the one most worth writing up if you are on the fence,
because the next instance will otherwise re-derive the same diagnosis from scratch.

**Once an entry exists it is append-only**, like [HISTORY.md](HISTORY.md)
and [LOGBOOK.md](LOGBOOK.md) — that is a rule about *editing*, not about writing. Correct an entry if
it turns out wrong; never shorten one, because a condensed entry keeps the fix and loses the gap. The
200-line target does not apply. The method for working an item in the first place is
[PLAYTEST.md](PLAYTEST.md).

**It is long enough that a read of it comes back truncated**, so grep the date or the quoted report —
every entry opens with Trevor's own words in quotes, which makes them findable. **When this passes
~450, split it into `GRABHIST-ARCHIVE-1.md`** rather than letting it grow, the same call the logbook
made. Newest first, so the batch you want is usually near the top:

| When | Instance | Items |
|---|---|---|
| 16 Aug 2026 | #16, later batches | The recoil suicide; the opponent deck named for the wrong deck; Gyarados crossed off unworked |
| 16 Aug 2026 | #16, second batch | Scoop Up's Knock Out banner; Energy Burn made passive; Double Colorless as two pips; prevented damage waiving recoil; Fetch while Confused |
| 16 Aug 2026 | #16, first batch | The report that was wrong and the three log gaps it exposed; inert Energy; promote/Whirlwind/Switch unified; powering up Zapdos over Voltorb |
| 14 Aug 2026 | #12, third pass | Arcanine's Take Down — the report that was right about the wrong game |
| 13 Aug 2026 | #12, second pass | Kangaskhan tanking; Weakness and Resistance in the retreat comparison; the blind duel harness |
| 13 Aug 2026 | #12, first pass | Confused retreat; the deck that resolved to the wrong deck; paralysis parked; Gust of Wind diagnosed |

---

### 16 Aug 2026 — Opus 5 #16 (Job 9, first batch)

**"Opponent declined to attack" — the report was wrong, and the log was why.** Every pass in
`22-12-05` was correct play: Farfetch'd had spent Leek Slap, which is once-while-in-play, and could
not afford Pot Smash. I rebuilt the one position that looked live and the bot takes Bubble at 23.0
at both tiers. *Three* instrument gaps came out of proving that, and they are worth more than the
item was:

- **a pass logged nothing at all.** Every other decision prints its runners-up; the pass is the bare
  action off `legalActions` and never went through `pickBest`, so "why didn't it swing?" was the one
  question the file could not answer. Two different silences were indistinguishable in it — *every
  attack scored zero or less* and *there was no legal attack*. The engine already knows the second
  in plain English (`canUseAttack().why`) and was throwing it away.
- **the opening board was never recorded.** `setupAuto` places the Active and then benches every
  Basic in hand with no action and no log line. A reader rebuilding the position from the narrative
  starts short and stays wrong for the whole file. I spent an hour reconstructing a phantom fifth
  Pokémon out of counting `passed over` entries before I found this.
- **two identical cards were indistinguishable.** "attaches Water Energy to Squirtle" with two
  Squirtle in play cannot be resolved, and that ambiguity is exactly what decided whether the report
  was real. `nameOf` appends a letter now, only while a side has more than one in play.

*The general shape, again: the item about the game was an item about the thing measuring the game.
That is three sessions out of three where it paid.*

**"AI is still attaching invalid energies when no other options exist."** Real, and **9% of every
attachment** — three times the surplus fault fixed in Job 6. The surplus rule only caught "the target
needed nothing"; this is "the target needed something *else*", a Grass onto a cost of F, and it fell
straight through to a branch that floors at 0.4 and adds 4 for the Active.

The load-bearing part was not the rule, it was **the exception**. Widening the rule moved 218 inert
attachments to 190 — nothing. Deleting the escape-route exception took it to **0**. Every single one
was being waved through on *"but it could pay for a retreat"*. Only the Active can be made to
retreat, so the exception is one slot wide now: 9% → 3%, and the 3% left is that exception doing its
job. **Measure the exception, not the rule** — I nearly shipped the wider rule and called it done.

Trevor wondered if it was the bot planning a future evolution. It is not; `potential()` reads only
the top of the stack and there is no lookahead anywhere.

**And a bug found by a test written for something else.** `potential()` counted the hypothetical
Energy against attack *costs* only, never putting it on the slot — so `scoreAttackHypothetical`
worked the damage out with the card absent. **No attack in the game could be known to get bigger
from an attachment.** Every `DMG_PER_SPARE_ENERGY` card, Hydro Pump included: a paid-up Blastoise
scored a fourth Water exactly as it scored the third, so the surplus rule held the card and the
attack never grew. Rain Dance was spared by accident — `EXTRA_ATTACH` goes straight to `attachValue`
and never meets that rule.

**"Promotes only to immediately Switch" (log `04-22-45`), and "should consider turns needed to power
up" — one fix.** Promoting, being Whirlwinded up and choosing a Switch target were three
nearly-identical formulas, and they disagreed: it promoted a 40 HP Voltorb over a 90 HP Zapdos into
an Arcanine that had just dealt 80, then spent a Switch undoing it. Both were defensible *on their
own scorer*, which is the whole fault.

One `promoteValue`. Readiness became a countdown — `short === 0 ? 25 : 0` charged the same nothing
for one Energy short as for four, which is **the fourth time in this file a quantity that should
fall away with distance from an edge was written flat with a cliff at the end**. And survival is
priced with the *retreat rule's own arithmetic*, because it is the same bill read from the other
side; reusing it rather than inventing a second one is the point, since one formula cannot disagree
with itself. The sacrificial promote falls out for free — a bare Basic has nothing invested.

Rebuilding the position gave 41 / 31.3 / 17.3, matching the log line for line, which is the check
that the repro is real. Promotions into a hit that kills them: **32% → 21%**.

*Both AI changes duelled flat (50.6% and 49.4%, ±1.4 over ~5,200 `--gbc` games each, control 50.0%).
That is the expected reading for a symmetric fault and not a verdict — they are asserted in
`powertest.js` instead, which is the standing doctrine.*

**"Should have powered up Zapdos instead of Voltorb" (log `04-31-25`) — taken after asking, and the
asking is the finding.** I diagnosed it as structural (Voltorb 18, Zapdos 15: completing a cheap
attack pays `attachEnable` for the whole of it, advancing an expensive one pays a **flat**
`attachBuild` per step regardless of what is at the end) and left it, because the fix contained a
design question I did not think was mine — *how much should a step toward a 60 beat completing a 10?*

**Trevor answered it in three sentences of plain English and they mapped one-to-one onto terms.** His
reasoning: the Zapdos is Active, it can *realistically survive* long enough to charge, the
alternatives are a retreat with no Switch or a sacrifice, and nothing better is waiting on the Bench.
That is amortisation (a step is worth its share of the attack at the end), a survivability discount
(only the Active is being hit, so only the Active is discounted, by turns-it-has over turns-it-needs),
and the bench comparison falling out for free because a weak card has a small `goal`.

He added *"don't take that as me expecting you to turn it into a build based on vagueries"*. It was
not vague — it was the specification. **Ask him. The item had sat as "wants discussion" and the
discussion took one message.**

**And it is the only significantly BETTER duel result of the whole batch** — 52.2% ± 1.4, then
51.9% ± 1.1 on an independent larger sample, control 50.0%. Everything else here was flat, correctly,
because it was symmetric. This one is not: both seats misallocate Energy, but the bot that charges
its real threat is playing a different game two turns later.

*One more detail worth not re-deriving: `goal` has to be the printed damage of the attack `short` is
counting down to, not the biggest number on the card. Amortising a step toward Thunder against a
Thunderbolt the Pokémon will never afford prices a road it is not on.*

### 16 Aug 2026 — Opus 5 #16 (Job 9, second batch)

**"Scoop Up displays the knocked-out banner."** Trevor guessed the trigger correctly in the note
itself — *"possibly tied to when the active card is removed w/o being retreated"* — and that is
exactly what it was. `diffForFx` inferred a Knock Out from *"a slot that was here is gone"*, which is
equally true of Scoop Up, Mr. Fuji and Hurricane. The engine records what was genuinely Knocked Out
per action now (`state.koThisAction`, cleared like `peeked`) and the UI reads it instead of guessing.
*A derived signal that is right 90% of the time is the kind of thing that survives for months,
because the 10% looks like a different bug every time it fires.*

**"Charizard's Energy Burn should be on by default, similar to Muk's Toxic Gas."** Agreed on sight:
Charizard's only attack is Fire Spin at RRRR, so there has never been a board on which you would
decline it — it was a click with no decision behind it. `slotSymbols` consults the Power now, and the
action, the `energyAs` flag, the turn-boundary lapse and the AI's scoring case all went with it.

**Making it a consultation rather than a flag bought a correctness gain nobody asked for.** It now
switches off under Sleep, Confusion, Paralysis and Toxic Gas — a flag set before falling asleep used
to survive the turn, because nothing re-checked it. Two assertions cover that. What it deliberately
does **not** reach is a cost reading "discard a FIRE Energy", which still reads the real card,
matching the Buzzap ruling that a card standing in for Energy is not that Energy card.

*And a small piece of history: `selftest`'s Power-kind coverage check went red on this, and the
comment above that opt-out list says Energy Burn is the reason the check exists. It is now on the
list, as the passive it had been behaving like all along.*

**"Show Double Colorless as two dots."** The row said "three Energy" about a Pokémon that could pay a
cost of four. One pip per symbol now, with pips from a single card pulled tight and hairlined so a
pair reads as linked — the row has to say *four Energy* and *three cards* simultaneously. Buzzap got
it for free, being the same shape.

**"If an attack does not do damage, its recoil should not apply" — I argued against it and lost, and
the losing is the useful part.** Take Down into Chansey's Scrunch. My case was the printed text:
Scrunch prevents damage done *to Chansey*, Take Down's 30 is damage Arcanine does *to itself*, two
different things and only one of them mentioned. That is step one of the ruling order and it points
the other way.

Steps two and three both overrode it. Trevor: it is how the Game Boy game plays it **and** how Pocket
plays it — two independent implementations of the era agreeing against the literal reading — and the
reasoning is worth more than the ruling:

> It's already benefit enough to the player on the receiving end to be preventing damage, and then
> still adding damage to the opponent seems to swing the needle a little too much for them.

*Reverse the viewpoint.* Preventing the hit is the entire reward for spending a turn on Scrunch;
paying the preventer a free 30 on top pays them twice for one decision. **That is a better argument
than mine and it is not a rules argument at all** — which is the thing to carry forward, because the
four-step order puts playability last and this is a case where last was right.

**The scope was the harder half and Trevor drew the line himself**: damage and defender-side
consequences only. Self-inflicted status — Tauros confusing itself on tails — still applies, because
it is the attacker's own coin rather than anything the defender did. He flagged his own uncertainty
on that one (about 75% on Pocket, leaning no on the Game Boy game), so it is settled on the lean plus
the principle, and it is the line most worth revisiting. The defender-side half turned out to be
already correct by luck: `retaliate()` sits inside the damage-landed branch. It has an assertion now
so it stays true rather than staying lucky. Full entry in
[Rulings/PREVENTED-DAMAGE-RECOIL.md](Rulings/PREVENTED-DAMAGE-RECOIL.md).

**"Kangaskhan shouldn't use Fetch while confused."** Real, and a straight omission rather than a
misjudgement: **nothing in `scoreAttack` knew Confusion existed.** The retreat rule learned about it
on 13 Aug and the attack path never did — *the same gap twice in one engine, one branch apart*. Worth
a look at any other decision that reads `status` for one branch and not its siblings.

Priced as what it is: half the time the attack does not happen and the attacker takes 30, so it is
worth half its value against half that cost. It bites where Trevor said it should and not where it
should not — a 5-point draw goes negative and the bot passes, a 60-point swing halves to 30 and is
still obviously worth taking. Asserted both ways, because "never attack while Confused" would be
worse play than the bug.

### 16 Aug 2026 — Opus 5 #17 (Job 9, the deck as a resource)

**Two items that turned out to be one, and `AI.md` had already written down where to find it.**
*"When to use Professor Oak and Gambler and when not to"* and *"stop using Bill or Professor Oak, or
Fetch or Pay Day, below ~20ish cards"* are the same fault: **`deck.length` reached the scorer in
exactly one place.** That place is Wildfire, where it prices the *opponent* decking out as a weapon —
so the bot understood running you out of cards as a way to win and had no concept whatsoever of doing
it to itself.

#16's closing line was *"Prizes, empty boards, and deck-out are the three ways this game ends, and
only the first two are priced anywhere."* It named the gap and nobody had gone back for it. **Write
down where you did not look.**

**Measured first, and the pool decided the answer.** 648 games: the four theme decks say 6.3% of
games end in a deck-out, the 18 ladder decks say **17.7%** — MEASUREMENT.md's most dangerous entry,
live again. 20.5% of all voluntary draws happened with under 20 cards left, and **45 times the side
that then lost had burned cards with fewer than five remaining.**

**Two terms, and the split is the recoil-suicide lesson reused.** `deckBurn` is a cost on the squared
share of what remains; `deckLoss` is terminal for a play that empties the deck. One weight could not
have done both — losing is not an expensive draw, exactly as losing is not a large Knock Out.

**A curve, not the floor Trevor asked for, and I said so rather than building it.** "Stop below 20"
is the cliff shape now at six entries in `AI.md`, and it would make 21-vs-19 cards a personality
change. `powertest.js` asserts the curve is monotonic *and* not flat, so a later threshold trips it.
The honest cost of that call: at 20 cards the penalty on Bill is 0.6 against a gain of 10, so the
"under 20" count barely moved. **The harm was never at 20** — it is concentrated below 10, and that
is where the change bites.

**Gambler is not a burner and capping it would have been the bug.** It shuffles the hand back in
*before* drawing 1-or-8, so its net deck change is `held − 4.5` — on any hand over about five it makes
the deck **bigger**, and it is the only recycling card in the game. Following the letter of the item
would have suppressed the single play that digs out of a deck-out. Priced on net change instead;
Trevor agreed on sight.

**Results.** Plays that empty the deck outright **14 → 0**. Burns under ten cards 6% → 3%. Late burns
by the eventual deck-out loser 45 → 21. Deck-out losses 17.7% → 15.7% — small because both seats got
the change and many of those games just swapped which side ran out. Duel 51.1% ± 1.3 over 5,832 games
against a 50.0% control: a lean, not a result, and not what justifies this.

*Two test notes.* My first measurement script reported **zero** draw plays across 64 games and looked
entirely clean — the action is `playTrainer` with a `hand` field and I was matching `trainer`/`idx`,
so the detector never fired once. And the first Gambler assertion passed while testing nothing,
because `base1-60` is Ponyta and my `if (score === null) return true` escape hatch swallowed it.
**Both are the same mistake: a test that cannot fail for the reason you wrote it.** The escape hatches
are now throws. Then the corrected test failed *for a good reason* — I had filled the "big hand" with
Energy the board wanted, and refusing to shuffle that away is correct play. The test was wrong, not
the code.

*Instrument work, again.* `aitest.js` gained the deck counters and a **`--gbc` flag**, which it had
been missing since `aiduel.js` got one — the tool whose whole job is measuring behaviour was only
ever seeing a sixth of the card pool.

### 16 Aug 2026 — Opus 5 #16 (Job 9, later batches)

**"Opponent lost the match due to self-kill from recoil."** The most valuable item of the day, and
the one with the clearest general lesson.

Log `06-53-35`, final turn. Electabuzz on 10 HP took Thunderpunch — a coin for either a bonus or
30-plus-10-recoil — Knocked Arcanine out, killed itself on the recoil, handed Trevor his last Prize
and lost the game on the turn it scored. It rated that **73.5** against a safe Thundershock at 33.

**An average hid it.** Expected recoil on that attack is 5, and 5 never killed anybody. *The branch
that ends the game becomes invisible the moment it is folded into a mean* — and this whole AI is
built on expected value, so the same blind spot is structural rather than local. `rawOutcomes`
carries the WORST case and its odds alongside the expected figure now.

Priced at `lastPrize`, not `selfKO`. **Losing is not a big Knock Out.** `selfKO` at 70 could never
outweigh a Knock Out worth 55 plus 35 damage, so no amount of tuning that weight would ever have
fixed this; it needed to be a different kind of term. It is the exact mirror of the "win the game if
you can win the game" rule from Job 6 — *and that rule needed its own guard too*, because it returns
a near-certain lethal before any scoring runs and would have taken the mutual kill regardless.

Rebuilt from the log: **73.5 → −79.0**, and the bot takes Thundershock. Still 41.0 and still preferred
when the same board has them three Prizes away, which is the check that matters — the rule must not
become "never recoil".

*Test note worth keeping.* The assertions failed twice before I saw why: with the opponent's Bench
empty, the Knock Out ALSO wins outright, the two game-enders cancel to roughly nothing, and the test
silently measures a mutual-annihilation position instead of the one it means to. Give them a Bench.

**"Opponent deck name says Overgrowth when the opponent is Jack."** Exactly what it says. `UI.foeDeck`
is the *free play* selection and nothing clears it when you return to the ladder, so the board and
the setup banner sat naming whichever theme deck was last picked in the other mode. **The match log
had already solved this** and its expression is now a shared helper, so the file and the screen
cannot drift apart again. Screenshotted with `foeDeck` deliberately left at "Overgrowth".

**Gyarados on turn 18 — crossed off without being worked**, Trevor's call and mine agreeing. The
promote/Switch unification and the recoil-suicide fix both landed after that game was recorded and
both bear on it, so the old log is no longer evidence about the current tree. Same caution now sits
on the Electabuzz-turn-30 item.

### 14 Aug 2026 — Opus 5 #12, third pass (Arcanine)

**"Used Take Down to KO instead of Flamethrower, eating the recoil."** The log did not contain that
case — in both Take Downs that killed, Flamethrower's 50 could not have reached the target. Said
plainly because taking a report at face value sends you fixing the wrong thing, and this one had a
better bug hiding under it.

The fault was in the two Take Downs that killed **nothing**. Arcanine on 60 damage of 100 took it
anyway for 30 extra damage that achieved nothing and finished on 90, one hit from conceding a Prize.
Recoil was charged flat with a cliff only at outright suicide, so it cost the same on a fresh Pokémon
as on a dying one. Now priced on the share of HP remaining, squared, meeting the old cliff exactly
where it always stood.

**And then his actual report turned out to be real after all** — just absent from that game. When
*both* attacks kill, Take Down was still winning, by a tenth of a point, because full damage was
credited and overkill buys nothing. Capped per outcome into a second field, `expUseful`; `expDmg`
must keep meaning the real number because PlusPower's "10 short of lethal" check reads it.

*Both fixes are the same shape as `retreatPrize` and the `selftest` gate: a quantity that should
scale with proximity to an edge, written flat with a cliff at the end. Third time in two days —
worth suspecting on sight.*

### 13 Aug 2026 — Opus 5 #12, second pass (the AI)

**"Opponent retreated a Kangaskhan instead of tanking."** Built as a **derivation**, not the per-card
tag Trevor proposed — everything that makes a wall a wall is already in the card data, so a tag would
be re-typing a fact rather than adding one, on 221 cards going on 1,251. Terminal Basics only, which
is Trevor's own refinement and the load-bearing part: *"cannot evolve further"* would call Charizard
a wall, and a Stage 2 is three cards of investment you badly want to rescue.

Two details worth not re-deriving. Utility is matched by **effect verb, not card text**, because
Tauros carries `STATUS_SELF_ON_TAILS` — it confuses *itself*, and a regex on "Confused" promotes it
to a wall. And stickiness suppresses the **rescue** but never the **Prize**, which is how Trevor's
own caveat — leave them in *unless the opponent has one Prize* — falls out of the arithmetic instead
of being written as a special case.

**"Opponent should calculate weakness and resistance into its damage predictions."** True in exactly
one place. Three of the four forecast paths already went through `computeDamage`; the fourth was
`bestAffordableDamage`, which is the only thing the retreat delta runs on. Both operands of that
comparison were wrong in different directions at once, which is why it never looked like a bias.

**The finding that outlived both.** `aiduel.js` played only the four Base Set theme decks, which hold
**11** wall cards between them and none of the four Trevor named. The stickiness change measured
51.0% — and that was not "no effect", it was "the harness never dealt the situation". It now takes
`--gbc` for the 18 ladder decks (112 wall cards), which is what the player actually faces. *A blind
harness fails silently and in the safe direction: it reports 50% for everything, which reads as "your
change did nothing" — the one verdict nobody argues with.* Written up as the sixth entry in `AI.md`.

**Method note for next time.** Two of my own tests failed on wrong card ids — `base1-5` is Clefairy,
not Kangaskhan — and both failures looked exactly like the feature not working. Look up the id.

### 13 Aug 2026 — Opus 5 #12, first pass (the rules)

**Confused Pokémon retreated without flipping.** Real, and a flat rules gap rather than an AI
misjudgement: `confused` appeared eight times in `engine.js` and exactly one was in the attack path.
`canRetreat()` never looked at it, while its own error message read *"Cannot retreat (status or
insufficient Energy)"*. Built to the GBC rule Trevor settled: you may attempt it, the Energy is
discarded **before** the flip, and on tails you lose both. A failed attempt uses up the turn's
retreat — that last part follows from the rest rather than being quoted, and is flagged as such in
`RULINGS.md` so it can be reversed on its own.

The AI was changed with it, because a rule the bot cannot price only punishes the human. Worth
knowing before you read the test: a Confused retreat does **not** simply score lower. The Energy is
certain and everything else is a coin flip *including the parts that were bad*, so a retreat the bot
already disliked scores higher when Confused. That is correct expected value and changes nothing —
a negative retreat still loses to passing.

**"Building a new deck does not let you use the new deck you just built."** Trevor's guess was the
deck-select layout, and the fix he proposed was a scrollable deck list to replace the second tile.
It was not that. His save held a 41-card blueprint and the 60-card deck he had just built, **both
named "New deck"** — the builder's default — and `deckFor` searched decks flat and answered with the
blueprint. `resolveDeck` shares that function and nothing on the path into a match calls
`validateDeck`, so Play would have fielded the 41-card list. Fixed in the resolver and prevented in
the builder; full account in `COLLECTION.md`.

*The general shape is worth repeating: the reported symptom pointed at the most intimidating file in
the project, and the bug was five lines away in the least.* Diagnose before you redesign.

**"Block paralyzed pokemon from retreating" — parked, not done.** The engine already blocks Asleep
and Paralyzed and now asserts it two ways. No log survived, so there is nothing to chase. Back on
the list the moment one does.

**Not taken, and diagnosed for whoever does.** *"Uses Gust of Wind to drag out a pokemon already in
the active spot"* is real but is not what it looks like — Gust picks a **bench** index, so it cannot
target the Active at all. What actually happened in log `22-29-31` is that Ronald played **two**
Gusts on turn one, dragged Gastly up, then dragged Mewtwo back up, ending exactly where he started
two cards poorer. The scorer evaluates each Trainer independently within a turn and has no memory
that it just did this. Almost certainly not Gust-specific.

**Tooling, found on the way.** `selftest.js`'s `expert beats novice` gate was asserting a
statistical claim at 36 games with the threshold 1.6 standard errors away — deterministic per tree,
so it reads as a verdict rather than as noise, and it went red on a change that measured clean at 90
games. It has a sample floor and a significance test now. See `AI.md`, which is where the four other
ways this project's measurements have lied are already written down.

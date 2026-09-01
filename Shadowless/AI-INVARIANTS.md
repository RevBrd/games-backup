# Shadowless — what has shipped in the AI, and the invariant each one left

**One entry per change to `src/ai.js` that shipped, in the order they shipped, each stating what must
stay true.** Read the entry before you touch the term it names — every one of these is a rule
somebody bought with a wrong version first.

[AI.md](AI.md) is the parent and holds the *model*: how the bot scores, where it fails silently, the
Active/Bench unit split, the cliff table and the open list. It carries an index of everything below
**and everything in the archive**, so you can find the entry you need from either file without
reading both. **Nothing here tells you whether a change worked** — that is [MEASUREMENT.md](MEASUREMENT.md).

**Two archives hold everything before Job 13, verbatim, and an archived invariant binds exactly as
hard as a recent one** — the split is about length, not about authority. Most of the terms you will
grep for are in one of them:

| Archive | Entries | Jobs | Terms that live there |
|---|---|---|---|
| [AI-INVARIANTS-ARCHIVE-1.md](AI-INVARIANTS-ARCHIVE-1.md) | 13–19 Aug 2026 | 9 through 10.5 | `retreatPrize`, `STALL_VERBS`, `expUseful`, `setupAuto`, `slotSymbols`, `prizeIndex` |
| [AI-INVARIANTS-ARCHIVE-2.md](AI-INVARIANTS-ARCHIVE-2.md) | 21–25 Aug 2026 | 11 through 12c | `threatAgainst`, `selfSwitch`, `retreatSaveEnergy`, `wallScore`, `shieldSelf`, `discardSilence`, `statusNovelty`, `pLethalThisTurn` |

**`AI.md`'s index table covers this file and both archives**, marking which one each row is in, so
you can find the entry you need without opening any of them.

**This file is append-only and exempt from the 200-line target.** Add an entry when you ship a
change; correct one that turns out wrong; never shorten one. An invariant condensed to its claim
loses the reason, and the reason is what stops the next pass undoing it. Split out of `AI.md` on
22 Aug 2026 at 549 lines, the same shape `LOGBOOK.md` and `Rulings/` took.

**When this file passes ~450, start `AI-INVARIANTS-ARCHIVE-3.md` at a job boundary** rather than
growing it. Stated here at the top, before the decision, rather than only at the bottom where it
would be read too late. **It has now been reached twice, and the second time is the one worth
knowing about.** On 28 Aug 2026 the file hit 476 and was deliberately left whole, because the three
entries that took it there had been written the same day as the work they describe and archiving them
immediately buries fresh reasoning before anyone has read it. That was a real reason and it expires by
itself — so the same paragraph named the split as *the next docs pass's first job*, which is how it
got done rather than re-deferred. **A deferral with a named owner is a decision; one without is a
limit quietly becoming advisory.**

**Deliberately not counted, here or in `AI.md`.** The number was written into prose as *twenty-three*
on 22 Aug 2026 and was wrong four entries later, in two files at once, while the index table beside
it silently kept telling the truth — which is this tree's most reliable source of wrong facts
arriving in the one file that is supposed to be checkable. **The table is the count.**

**Sign your entries with your designation, beside the date — Trevor's ask, 22 Aug 2026**, so the
sequence of events is readable without cross-referencing `CREDITS.md`. Entries predating the
convention were signed retroactively **only where the evidence is unambiguous** — a `CREDITS.md` row
naming that exact change, or a `GRABHIST.md` heading naming the instance. **Two are deliberately left
unsigned**, the 18 Aug Energy-pool fix and the 19 Aug Prize picker, because two instances were working
on each of those days and nothing names which one. A guessed attribution is worse than a blank: nobody
re-checks it, and it is somebody's work.

## Where each account lives, and why the answer is three files

**The entry below is the rule. The account of how the fault was found is somewhere else — and there
are now three somewhere-elses.** This has been stated wrong three times, each time by a sentence that
was true when written, so it is a table rather than a claim:

| Entries dated | Fuller account in | Because |
|---|---|---|
| 13–16 Aug, 19 Aug — **archived** | [GRABHIST.md](GRABHIST.md) and [its archive](GRABHIST-ARCHIVE-1.md) | they came out of Trevor's grab bag, which has its own append-only register |
| 18 Aug — **archived** | **nowhere else** | they came out of *set and job work*, and nothing was recording that |
| 21–22 Aug — **archive 2** | [GRABHIST.md](GRABHIST.md), or [`Playbook/`](Playbook/) | the retreat and Charizard work came from logs; the status, barrier and attack-choice work came from a playbook pattern, and `Playbook/ATTACK-CHOICE.md` holds its measurement tables |
| 23–25 Aug — **archive 2** | [`Playbook/`](Playbook/) and `tools/claims/`, or **nowhere else** | the claims harness leaves its own artifact; the 25 Aug crash came out of a `decksim.js` run and is recorded only here |
| 28 Aug — **live, below** | [`Playbook/`](Playbook/) | all three came out of Ammo and Evolution timing, which hold the measurements |

**The opening placement fix, the Energy-pool fix, the whole triggered-Powers section and the 25 Aug
Power-scoring crash are the only copy that exists.** Condense one of those and the reasoning is gone.

**Check the table before you trim anything on the grounds that it is preserved elsewhere**, and check
the elsewhere itself. A "this is duplicated" claim is a claim about *two* files and it decays the
moment either one moves; the blanket version of it was cited once as grounds for refusing this
material a home at all. *[That refusal, and why it expired →](HISTORY.md)*

## The entries

Chronological, oldest first. **Job 13 onward** — for 21–25 Aug see
[AI-INVARIANTS-ARCHIVE-2.md](AI-INVARIANTS-ARCHIVE-2.md), for 13–19 Aug see
[AI-INVARIANTS-ARCHIVE-1.md](AI-INVARIANTS-ARCHIVE-1.md).

---

## `ammoSymbols` — ammunition is only ammunition if you have nothing else to shoot with

*28 Aug 2026, #29. The rule this narrows is **`ammoSymbols`, 21 Aug — #21**, now in
[archive 2](AI-INVARIANTS-ARCHIVE-2.md); it is still correct, and what was wrong was how wide the
derivation reached. (It said "the entry two above this one" until the archive split moved that entry
out from under it — **name the entry, never point at a position**, which is `MEASUREMENT.md`'s own
lesson about a growing table arriving here in a shrinking file.)*

**Headroom is granted only when the burn OUTPACES the attachment and the card owns no free attack.**
Both are read off the card's own effect scripts, so this is still a derivation and not a list — but
the verb alone was not enough. `COST_DISCARD_ENERGY` on its own told the bot to stock **Arcanine GP
to six Fire** for a 40-damage attack, using the pre-load rule written for Charizard's 100.

**The claim that found it was asserting the wrong thing, and that is the entry.** `tools/claims/basep.js`
had a red row saying Arcanine GP should prefer Quick Attack at four Fire. It was red for two days and
two sessions read it as a missing term in attack choice. Trevor, asked directly: *"If it ever found
itself in a situation where it did have 4 energies attached then yes, it should use Flames of Rage.
However, it should be exceedingly rare that it finds itself in that situation."* **The attack choice
was right the whole time and the fault was one decision upstream.** The row was rewritten to assert
the behaviour that turned out to be correct, the way the 14 Aug `powertest` assertion was rewritten
rather than deleted — and the real claim is now an *attach* row.

**THE NESTING IS LOAD-BEARING AND THE FLAT VERSION MOVED FIFTEEN CARDS.** Written first as "no
headroom for any card with a free attack", it stripped Ninetales, Charmeleon, Charmander, Magmar,
Starmie, Kadabra, Mewtwo, Gastly, Slowpoke, both Flareons, Ponyta, Dark Golduck and base1 Arcanine —
fourteen rate-neutral cards, most of them in live ladder decks, on the strength of an argument about
two cards that are nothing like them. A card burning one against one attached a turn was never at
risk of running out, so the fallback test has nothing to say about it. **Ask it second, and only
under a real drain.** Then it moves exactly one card. The sweep is the only thing that told the two
versions apart, and the first one felt just as principled while writing it.

**THE INSTRUMENTS ARE BLIND HERE AND THAT IS STATED RATHER THAN MEASURED AROUND.** `basep-6` appears
in **0 of 51 authored decks** and promos are excluded from generated decks by design, so `aiduel` and
`decksim` cannot see this change at all. Running them would return a symmetric null that means
nothing — the exact failure [MISREADINGS.md](MISREADINGS.md) exists for, and the reason the 23 Aug
entry above checked exposure before believing its own null. The evidence here is three claim rows and
a full sweep of every card carrying the verb.

**One of those three rows is a CONTROL and it is not optional.** A fifth Fire on Charizard must still
score positive. Without it, deleting `ammoSymbols` outright would pass every other row in the file.

**The board-level half is still open and Trevor's answer sharpened it.** *"After it's at 2 energies,
additional ones better serve the bench... unless they're in abundance"* is three conditions about the
rest of the board, and nothing in the scorer reasons about Energy as a resource with somewhere else
to be. Same capability the Charmeleon half and Evolution timing wait on.
*[The pattern, with the note verbatim →](Playbook/AMMO.md)*

---

## `evolutionInHand` / `potentialAs` / `evolveEarly` — a Pokemon about to become something else is not paid up

*28 Aug 2026, #29. AI.md open item 4, closed — and it is the first entry here whose measured result is
a null that shipped anyway.*

**Two rules, one commit, and the file said so before either existed.** Open item 4's whole warning was
that a readiness penalty on `evolve` must not ship without the attach half, because evolving was the
only thing that unblocked the Energy. That held. Trevor's account of the GBC game gave both halves at
once: *"careful not to evolve unless it was one energy away from being able to use the evolution's
cheapest attack of value, so it would get energies close to that point before actually evolving."*

**THE BLOCKER WAS ONE LEVEL HIGHER THAN THE OPEN ITEM PREDICTED.** It named `attachValue` as the thing
to fix. `attachValue` was never reached: the **surplus rule** in `case 'attachEnergy'` returns
`W.attachSurplus` first, and a Gloom holding two Grass can already pay for Foul Odor, so `noProgress`
was true and the third Grass was refused at −2 whatever `attachValue` would have said. Fixing the
predicted site alone would have changed nothing and looked like the rule not working. **A diagnosis
that names a function is still a hypothesis about which function.**

**`potentialOf` held an assumption silently and my change broke it.** It takes the card as an argument
and had exactly one caller, which always passed `this.top(slot)` — so its `scoreAttackHypothetical`
branch could index attacks by position against the real card. Ask it about an *evolution* with more
attacks than the Basic underneath and it indexes off the end: `Cannot read properties of undefined
(reading 'dmg')`, three Overgrowth games, caught by `selftest.js` and not by anything else.
`isReal` now guards it and printed damage is the fallback — which is right rather than merely safe,
since a card not on the board cannot be scored as though it were attacking this turn.

**THE RESULT IS A NULL AND IT SHIPPED. Read this before citing it as an improvement.** `aiduel 8
--gbc` against HEAD: no significant difference, and `--control` reads the same, so the harness is
working and the null is real. The change is not inert — 17,672 ladder games went from 228,832
attachments to 229,737 and from 633,654 turns to 635,509. Three grounds for shipping: it is the
behaviour Trevor specified; it closes a fault he named from PLAY rather than from a metric, and a
Vileplume that arrives unable to attack is visible to a human in a way 0.4% of attachments is not; and
MEASUREMENT.md predicts symmetric perception fixes read flat. **What is not claimed is that the AI got
better.** If a later pass finds this costs something, the null is why that is fair game.

**Only from hand, deliberately.** Trevor's note has a lower-weighted arm for evolutions still in the
deck, and a duplicates clause — feed one Gloom, not two. Neither is built; both are named in
*[Playbook/EVOLUTION-TIMING.md](Playbook/EVOLUTION-TIMING.md)*. The duplicates clause depends on the
scarcity measure that AI.md open item 9(b) measured at near-inert, so it does not follow automatically
and should be raised with Trevor rather than assumed.

---

## `evolutionRoadFor` / `benchDuplicate` — one of the twins gets fed

*28 Aug 2026, #29, from Trevor's duplicates clause. The entry above is its other half and they were
built an hour apart.*

**The evolution ROAD is rationed; the Energy is not.** A non-primary duplicate still scores
attachments against its own attacks like any other Pokemon — it can be built as a staller or an
attacker. What it loses is `potentialAs` measuring it against what it might become, and the fourth
surplus exception that travels with that. **Resistance, never a veto**, which is Trevor's own word.

**The primary is the most-invested copy that is NOT YET READY, and defining it that way is what makes
the release automatic.** When the leader's shortfall against its evolution hits zero it stops being
short, drops out of the running, and the next copy inherits the road. Trevor's *"once one is fully at
the point it needs to be and is just waiting on the evolution card"* is then the definition rather
than a second rule that could disagree with the first. Ordered by Energy attached so feeding the
leader keeps it the leader; `uid` breaks the opening tie. **A leader that flip-flops is worse than no
rule at all.**

**IT EXPOSED A FAULT IN THE ENTRY ABOVE, WRITTEN THE SAME MORNING.** At two Fire the leader scored
**15.00** against an untouched twin's 22.00, so the bot fed the twin and left the leader one short of
a Charmeleon. `attachValue`'s completing branch pays a flat `attachBuild * short * 2` on the stated
grounds that *"`attachEnable` has already paid the attack's real value"* — **true only when the attack
is on the card standing there.** `attachEnable` reads `best`, `best` is deliberately the current
card's, so on an evolution road it paid nothing and the last Fire before a 50-damage Charmeleon was
worth seven. An evolution road now always takes the amortise branch. **A rule can be right and still
look wrong because something it leans on was never exercised at that value before**, and the way this
surfaced is worth more than the fix: putting two roads side by side is what made one of them
obviously mispriced.

**`benchDuplicate` is counted across the whole board and is silent for the first two.** An Active
Growlithe is as much "one of them" as a benched one. Silent for two on purpose — the rationing rule
above is built on there being a second copy to fall back on, so charging for it would fight the rule
directly overhead. Third copy pays once, fourth twice: 7.00 → −2.00 → −16.00 while a different Basic
holds 7.00.

**Null again — 50.3% ±0.5 against HEAD, and 50.1% ±0.5 for the whole day against the freshly moved
pin.** Same three grounds as the `evolutionInHand` entry, and the same warning: **do not quote either
as an improvement.**

**Trevor's own wording pointed at a term that would not have worked.** The note as first written said
duplicates should be fed *"unless nowhere else to go and energies aren't in short supply"* — a
scarcity condition, and `AI.md` open item 9(b) had measured scarcity at near-inert hours earlier. Asked
directly, he gave a release condition the board already knows: the leader is ready and waiting on the
card. **The four lines it cost to ask were worth more than the term they replaced.**

---

## `T_DEFENDER` — a shield is a shield whichever direction the damage comes from

*29 Aug 2026, #30. Shipped alongside the engine change, in the same commit, because the two halves
are worthless apart: a rules capability the scorer cannot reach is a capability the bot does not
have.*

**Defender now blunts an attack's self-harm** — 30 recoil becomes 10, at the price of the card being
used up before the opponent's turn. *[The ruling and its scope table
→](Rulings/DEFENDER-BLUNTS-SELF-HARM.md)*

**The invariant: prevented self-harm is priced through `shieldSelf`'s curve, not a second one.**
Linear in the damage stopped, squared in the share of remaining HP it stops, off `selfKO`. That is
the same pair of curves the barrier work settled on 22 Aug and they disagree **on purpose** — a
quantity is linear, a risk is squared. **Do not collapse them into one term here** any more than
there; a Defender that stops 20 of a 30 recoil and a Defender that stops the 20 that would have
killed you are doing two different things, and the second one is worth far more.

**It reads the attack the bot would pick ANYWAY**, through `bestAttackScore` + `forecast`, which is
`T_PLUSPOWER`'s own pattern three lines above it. **Deliberately not the worst self-harm available:**
over-stating it would buy Defenders for attacks the bot was never going to use, and the failure being
closed is a capability *never used at all*, so the conservative direction is the safe one. That is the
opposite choice from `pLethalThisTurn`, which takes the maximum — **and the reason is the same rule
applied honestly**: pick the direction whose error is the smaller failure, which depends on which way
the term is wrong.

**KNOWN LIMIT, recorded rather than discovered later. A Defender can UNLOCK an attack the bot has
already ruled out, and the bot cannot see it.** At 30 HP an Arcanine refuses Take Down because 30
recoil kills it — correctly. With a Defender the recoil is 10 and Take Down is safe, but
`bestAttackScore` runs *before* the Trainer is played, so the forecast it reads is the one without
the shield. The term therefore goes quiet in exactly the spot where the play is most interesting.
**This is the `pLethalThisTurn` problem in a second place** — a Trainer is played before the attack
and there is no forecast of the board it creates — and fixing it properly means letting `scoreTrainer`
forecast a hypothetical post-Trainer board, which is a real refactor and not worth it for one card.
**Do not "fix" it by widening the term to the worst attack**; that trades a quiet miss for a noisy one.

**UNMEASURED, and it cannot go on `selftest.js`'s `PROVISIONAL` list**, which holds effect verbs
rather than Trainer branches — same reason `prizeIndex` is recorded in `AI.md` instead. Exposure is
thin: Defender is one Uncommon, and the term only fires when the bot's chosen attack self-damages.
**Do not read a null from `aiduel` as evidence it failed**, and do not retune the two constants off
one duel — they are `shieldSelf`'s, already measured in their own place.

## 30 Aug 2026 — a strip is not a payment, and the AI was never choosing at all

**`energyStripOrder`, `energyUids`** · Job 14b · Trevor's `Wants` on Energy Removal and Super Energy
Removal, worked as claims.

**The invariant: which Energy a HOSTILE effect takes is the AI's decision, and it is the inverse of
the order a Pokemon pays its own costs in.** `energyPayOrder` answers *"which of mine do I miss
least"*. A strip asks *"which of theirs do they miss most"*. They are different questions and for as
long as both cards have existed only the first one was being asked.

**The AI was not choosing badly. It was not choosing.** `scoreTrainer` set `a.opts.energyIdx = 0` —
the only occurrence of that key anywhere in the project, and one the engine has not read since the
human's Energy picker replaced it. `ui.js` still carries the comment noting the human path moved to
`energyUids`; the AI path was simply left behind. Super Energy Removal set neither `costUids` nor
`energyUids`, so **both** its halves fell through. With no uids, `takeEnergy` reaches
`energyPayOrder` and politely takes whatever the target needed **least**.

**A dead key that looks like a considered choice is worse than no key**, which is the transferable
half of this. `energyIdx: 0` reads as *"take the first one attached"* — a decision somebody made —
and it survived a picker migration, a full Trainer scoring pass on 24 Aug, and every suite in the
repo. Nothing was going to catch it: the card works perfectly for the human, no verb is unscored, and
`selftest.js`'s guard is about verbs rather than about option keys.

**The key priority SWAPS, it does not merely reverse**, and Trevor's note is explicit about the
order: *"DCE should be the first target and its own energy type ... should be the second."* So the
primary key is **how many symbols the card is worth on this slot** and the tiebreaker is **whether
its type is a hard requirement of the target's attacks**. Reversing `energyPayOrder` outright gives
needed-first and gets the Charizard board wrong.

**Read the SLOT, never the card** — the 18 Aug `slotSymbols` invariant, arriving here from the other
side. Under Energy Burn every Energy on a Charizard is Fire, so its Double Colorless is worth two,
which is exactly why 21 Aug reversed the *friendly* order to stop Charizard spending it first. The
same fact makes it the right thing to take away.

**Why it stayed invisible, which is the part worth keeping.** The friendly order and the hostile
order **agree wherever the Double Colorless is surplus** — "what they need least" and "what costs them
most" pick the same card. They diverge only where the Energy is load-bearing, which is the only case
worth spending a card on. A probe that read `a.opts` back would have reported a choice being made;
`board.js`'s new `strips()` plays the card and watches what actually left, which is why it can see
this at all.

| board | took, before | takes, now |
|---|---|---|
| Magmar, 1 Fire + 1 Water (needs R) | Water — the filler | **Fire** |
| Kangaskhan, 1 Water + 1 DCE (every cost Colorless) | Water | **the DCE** |
| Charizard, 3 Fire + 1 DCE (Energy Burn) | Fire | **the DCE** — two symbols, not one |
| Super Energy Removal on that Charizard | two Fire | **the DCE and a Fire** — three symbols, not two |

**And the card is part of the price on Super Energy Removal alone.** Trevor: *"DOES NOT want to be
used on an opponent pokemon with only one energy because then you don't gain an advantage."* At one
Energy you trade your Energy **and** the card for their Energy; the old formula scored that 4.00 and
played it. `- W.drawCard` now applies at every count rather than as a test for one, because a
quantity about how bad a trade is, written as an equality check, is this project's most reliable
sniff test for a wrong curve. **Energy Removal is deliberately NOT charged it** — it costs the card
and nothing else, which is the whole difference between Trevor's two notes.

**Measured, and read the null correctly.** `abtest 8 HEAD`: **12.1% of 17,296 games diverge**, median
first difference at action 43, against a null control on an identical tree that read **0.0%**. Win
rate is 49.0% → 49.1%, which is **not** evidence of nothing — both seats get the fix, so this is the
symmetric case [MISREADINGS.md](MISREADINGS.md) exists for. The evidence is the divergence and the
five claim rows, all five of which go red against the commit before it.

**Nine rows hold it, four of them controls.** The target half (Active over Bench, and never on a
Pokemon about to be Knocked Out) was already right and must stay so; the self-payment half of Super
Energy Removal correctly uses the **friendly** order and must keep using it. **Do not unify the two
orders** — one card now uses both, in opposite directions, on purpose.

## 30 Aug 2026 — PlusPower is worth the turn it takes off the kill, not only the last one

**`turnsWith`, `T_PLUSPOWER`** · Job 14b · Trevor's `Wants` on PlusPower, worked as claims.

**The invariant: the value of ten damage is how much sooner the target dies, and it is a staircase
rather than a step.** `T_PLUSPOWER` paid a flat 6 and then +34 for exactly one board — the extra 10
makes *this* attack lethal. That is the top rung, priced as though it were the only rung.

**Trevor names the general quantity and hands over the arithmetic**: *"when an additional 10 damage
would result in 1 fewer turn to kill the opponent, as in a move doing 30 damage attacking a pokemon
with 70 HP."* Three turns becomes two. The bot scored that board **6.00 — identical to a board where
the extra 10 changes nothing at all.**

**This is the cliff table's tenth row and it is in a Trainer**, which is worth noticing on its own:
the sniff test has now paid in `ai.js`, in a test suite, and here in `scoreTrainer`. *A quantity
about proximity, written as an equality check.* Turns removed is a **quantity**, so it is linear,
discounted by how far off the turn it removes is: `40 / turnsWith`.

**The lethal case comes out at exactly 40.00 by arithmetic, not by a branch** — `turnsWith === 1` —
which is the same 6 + 34 it used to score. That is the calibration check: a general term that
subsumes a special case should land on it, and this one does to the point.

| board (Fire Punch, 30 flat) | before | after |
|---|---|---|
| 70 HP left — three turns becomes two | 6.00 | **20.00** |
| 60 HP left — two turns becomes two | 6.00 | **0.20**, held |
| 40 HP left — two turns becomes one | 40.00 | **40.00**, unchanged |
| 60 HP left, attacker about to die | 6.00 | **6.00**, spent anyway |

**Holding is the default and it has an escape clause, which is Trevor's next sentence.** Ten damage
that changes no turn count changes nothing, and spending it now spends the option of playing it on
the turn it *would* have converted — that option is the whole of *"plan to hit for 30 on the first
turn and use the PlusPower for 40 on the second."* But: *"If you might not survive until the second
turn, the PlusPower could probably be used early."* **The card survives your Pokemon; the PLAN does
not**, because the attacker it was built around is the thing about to die. So the held branch pays
0.2 — under `threshold` — unless `incomingThreat >= remainingHP`, where it pays the old flat 6.

**`expDmg + 10` is exact, not an approximation.** PlusPower is a `DAMAGE_BONUS` effect and
`computeDamage` applies those **after** Weakness and Resistance. Checked rather than assumed; if that
order ever changes, this term changes with it.

**Measured.** `abtest 8 HEAD`: **15.9% of 17,296 games diverge**, median first difference at action
48, against a null control reading 0.0%. Win rate 49.1% → 49.1% — symmetric, both seats hold
PlusPowers, and that null says nothing either way. Four rows hold it; three of them are controls and
**only one goes red against the prior commit**, which is the point of writing the already-correct
behaviours down.

**Do not re-collapse this into a lethality test.** The old form is recoverable from the new one and
looks simpler; it is the special case.

## 30 Aug 2026 — one drag, one rule, and the attack half was rolling dice

**`bestDragTarget`, `dragScore`** · Job 14b · Trevor's `Wants` on Ninetales, and his GRABBAG report
of the same thing from play.

**The invariant: dragging one of THEIRS is one decision with one ranking, wherever it is printed.**
Gust of Wind, Lure, Fascinate and Tempt are the same effect. `T_SWITCH_OPPONENT` ranked their whole
Bench and filled `a.opts.bench`; the **attack** path scored a flat `W.drag` and filled nothing, so
`SWITCH_DEFENDER_CHOOSE` fell through to the engine's seeded random pick.

**This is 21 Aug's `selfSwitch` invariant, unhonoured in the mirror case.** *The scorer fills in
`a.opts` so the engine's random fallback is never reached* — written for switching one of ours, and
exactly as true for dragging one of theirs. `scoreAction` already does it for `SWITCH_SELF_CHOOSE`
three lines away.

**Trevor found it in play first**, and the report is the reason to trust the diagnosis rather than
the other way round: *"Ninetales also used Lure to draw out a much more dangerous pokemon on turn
49"* — GRABBAG, log# 04-02-53.

**The demonstration is one board printed twice.** Their Bench holds a fully charged Charizard and an
Energy-less Rattata:

| | `[Charizard, Rattata]` | `[Rattata, Charizard]` |
|---|---|---|
| **Lure**, before | Rattata | **Charizard** |
| **Lure**, after | Rattata | Rattata |
| **Gust of Wind**, before *and* after | Rattata | Rattata |

**Same effect, same board, two answers — and the answer changed with the order of their Bench.**
Lure also scored a flat 14.00 either way, so nothing in the score could have told anyone.

**ASSERT BOTH BENCH ORDERINGS.** The first of the two Ninetales rows was **green before the fix**, on
this seed, by coincidence. A row a coin is winning is indistinguishable from a row a rule is winning,
and only the pair separates them — the same reason `dragsUp()` and `strips()` execute the card and
read the board rather than reading `a.opts` back. **A single row here would have shipped a false
green.**

**`attackVariants` deliberately does not enumerate this choice**, unlike Metronome and both
Conversions, so there is no per-option action for `pickBest` to score and the pick has to be filled
in from `scoreAction`. That is a decision, not an oversight — enumerating it would multiply the
action list and the UI builds its own bench prompt in `doAttack` rather than reading variants. **If
anyone changes that, this fill becomes redundant rather than wrong.**

**Two callers, one ranking, and the Trainer's behaviour is unchanged** — 39.80 on the demonstration
board before and after, held by two control rows written for exactly this refactor. **Do not grow a
second ranking for attacks.** The whole finding is that there were two paths and only one of them was
thinking.

**Blast radius is four cards** — Ninetales, Victreebel, and Dark Persian twice — across three live
sets, and Ninetales is in Trevor's own ladder decks, which is why he saw it.

**Measured.** `abtest 8 HEAD`: **4.1% of 17,296 games diverge**, median first difference at action 83
— late, which is when a Lure gets used — against a null control reading 0.0%. Win rate flat and
symmetric, as it must be.

## 30 Aug 2026 — a Switch is worth the retreat cost it nullifies, and half of that is open

**`T_SWITCH_OWN`** · Job 14b · Trevor's `Wants` on Switch.

**The invariant: a Switch on a Pokemon that can already walk away for nothing is worth nothing**, because
retreating does the identical thing and keeps the card. The retreat cost was not read anywhere in
this case. Measured before the fix: **a Switch on a free-retreat Rattata scored 24.00 and was
played**, while one on a retreat-4 Snorlax — the card in the format it is worth most on — scored
**-4.00** and was refused.

**A GATE, NOT A WEIGHT, and only half his note deliberately.** *"Does not want to be used on a
free-retreat cost pokemon"* is a gate with no number in it. *"Prefers heavier retreat costs to
nullify"* is a quantity, it is **not built**, and there is an `open:` row saying why: the saving is
only real if you wanted to move at all, so adding `cost * retreatSaveEnergy` unconditionally buys
Switches for Snorlaxes that were perfectly happy standing there — and gating it on *"did we want to
move"* is circular, because that is the sum the term would be part of. **Ask before building it, and
build it once**: the retreat path already owns this quantity as `retreatSaveEnergy` and there must
not be a second rate for it.

**All three conditions on the gate are load-bearing and none is defensive.** `canRetreat` is what
makes it safe under Paralysis and Sleep, where retreating is illegal and the card is the only way
out. `retreated` is the once-a-turn limit, after which the card is again the only way out — there is
a control row for exactly that board. And the cost is read **live** through `retreatCostOf` rather
than off the printed card, so Dodrio's Retreat Aid is already in it.

**`T_SWITCH_OWN` also computes its best destination and throws the value away**, which is the third
time this session that pattern has turned up — `bestDragTarget`'s old home did it, and so did the
Gust ranking. **When a scorer picks an index out of a loop, check whether the score that chose it
survives.** It usually should.

**Measured.** `abtest 8 HEAD`: **3.3% of 17,296 games diverge**, against a null control reading 0.0%.
Win rate 49.1% → 48.9%, which is 23 games and symmetric; **do not read it in either direction.**

---

**`AI-INVARIANTS.md` has passed 450 lines here — 544 by the end of Job 14b — and this is the named deferral rather than a silent
one.** The four Job 14b entries above were written the same day as the work, and the 28 Aug precedent
in this file's header is that archiving fresh reasoning buries it before anybody reads it. **The owner
is Job 15c's document pass** — `AI-INVARIANTS-ARCHIVE-3.md`, split at the Job 14b boundary, which
puts Jobs 13 through 14b in it. A deferral with a named owner is a decision; one without is a limit
quietly becoming advisory.

## 31 Aug 2026 — the off-by-one is a hedge, and the fix was in the selection

**`turnsLeft`, `survivesCharge`, `evolutionRoadFor`** · Job 14b · Trevor's Charmeleon note, and his
question about what the reusable answer should be.

**The invariant: `survivesCharge`'s `+1` is a POLICY and must not be "corrected".** It reads one turn
more than the worst case says, which looks exactly like an off-by-one — a Pokemon acts before each of
their attacks, so the attack that kills it is not a turn it got. **It was corrected as an experiment
and the experiment is why the `+1` is now documented instead of gone.**

`incomingThreat` is a snapshot of the worst thing they can do **right now**, and `survivesCharge`
projects it forward as a certainty — no heal, no switch, no Gust, no coin landing wrong. That
over-projection gets less true the further out it reaches, and the `+1` is the hedge against it.

**It is load-bearing on one narrow band, measured.** Removing it flips three claim rows and all three
sit in the same place — a Pokemon that survives **exactly one more hit**, where the honest count
halves the discount:

| board | shipped | honest | outcome |
|---|---|---|---|
| Zapdos, 70 HP under 80 | 1 | 0 | already discounted hard — **stays green** |
| Charizard, 120 HP under 80 | 2 | 1 | *"firing at four is charged for"* **flips** |
| Arcanine GP, 70 HP under 40 | 2 | 1 | *"never at exactly two Fire"* **flips** |

**Trevor's own notes settle it, and they only look contradictory until the band is visible.** Zapdos
is genuinely dying and its note says burn freely. The other two are at or near **full HP** facing one
hit, and their notes say do not silence yourself there. **A Pokemon at full HP is not "about to die"
in any sense a player would recognise** — it is one heal, one Gust or one bad coin from a different
board. The hedge is what encodes that, and it had been doing it by accident since the function was
written.

**`turnsLeft(pi, slot)` is the fact, split out from the policy**, and that split is the general
answer to *"what should the next item that needs this reach for."* It returns future turns of mine,
unhedged, `Infinity` on the Bench. The same idea had been written **four times** — inside
`survivesCharge`, inside `discardSilence`'s call, inside `attachBuild`'s, and as a bare boolean in
`T_PLUSPOWER` written the day before, which **disagreed with `survivesCharge` on the same board.**
That boolean is now a call to `turnsLeft`; the arithmetic is identical (`hp <= threat` and
`ceil(hp/threat) - 1 === 0` are the same condition), so nothing moved and there is one expression of
the idea instead of four.

**THE RULE FOR THE NEXT CALLER: take the fact, state your own policy at your own call site.** Do not
add a second hedge inside `survivesCharge` and do not remove the one that is there. If the hedge is
ever revisited it is a policy change wanting its own measurement, not a bug fix.

---

**And the Charmeleon fault was never in the magnitude.** The road was worth **101.0 to an Active on
80 HP and 101.0 to the same Active on 10 HP**, with the safe benched twin passed over at 62.0 —
sweeping the Active from 80 down to 10 never moved it by a point. No survival discount fixes that,
because `evolutionRoadFor` ranks by **investment and nothing else**, and a discount to the magnitude
leaves the road where it was.

**So a copy that will not live to finish its road now steps aside, exactly as a ready one does.** That
is the same shape as the existing release rather than a new kind of rule: a leader stops leading when
it can no longer be the one that arrives. Trevor, 31 Aug: *"I'd say the active one is pretty safe to
write off... switching powerup focus to the Charmeleon on the bench."*

**ONLY WHEN SOMEBODY ELSE CAN TAKE IT UP.** A sole carrier keeps its road however doomed it is —
there is no better home for the Energy and refusing would strand it. That guard is what keeps this
from being a veto, and it is why the common single-copy case is untouched.

**Hedged through `survivesCharge`'s own `+1`** rather than the raw count, so the two places that ask
*"will you be here"* cannot drift apart. A healthy Active two turns from death with a shortfall of two
keeps the road; a Charmeleon with zero turns left against a shortfall of two does not.

**A claim about twins must go through the uid.** The first version of that row read
`explain()`'s label, and with two Charmeleons in play *"Attach Fire Energy to Charmeleon"* is the same
string twice — so it read the wrong slot and stayed red after the fix had landed. **`explain()` is
for humans; anything comparing two copies of one card needs the action's `target`.**

## 31 Aug 2026 — the attachment is last, and a search goes before a draw

**`playFirst`, `handGrowKind`** · Job 14b · Trevor, from playing the Japan-only GBC sequel and from
Pocket. Grab bag, not the workbook.

**The invariant: some plays are ordered by INFORMATION rather than by value, and `choose` could not
express that.** Setup actions were picked purely by score, one per call — so an attach scoring 101
always went before a Bill scoring 10, and then the Bill drew the Charizard that would have changed
where the Energy went. **No score can fix this, because the Bill is not worth more; it is worth
EARLIER.**

Two orderings, both his:

- **Anything that grows your hand goes before the attachment**, so the attachment is made knowing
  what arrived. His note: *"there's a general order of operations to the AI's turns, where the energy
  attachment is always last before attacking/ending their turn, that way things are allowed to change
  if a trainer card alters the scenario mid-turn."*
- **A deck-NARROWING search goes before a random draw.** *"Using a Poke Ball to draw a basic pokemon
  out of the deck would be played before a Bill that draws two cards... removing the Poke Ball's basic
  pokemon from the pool increases the pull odds by one card."* One card of improvement, free, on every
  draw made afterwards.

**IT REORDERS, IT NEVER ADDS A PLAY.** Every candidate has to clear `threshold` on its own score,
exactly as it would to be chosen at all. A turn where nothing else was worth doing is byte-identical.

### The carve-out is the whole care, and it is four verbs rather than a category

**Only cards that cost NOTHING from hand are promoted**: `T_DRAW`, `T_POKE_BALL`,
`T_ENERGY_SEARCH`, `T_SEARCH_TO_HAND`.

**Professor Oak discards your hand. Gambler shuffles it back. Computer Search pitches two.** Promoting
any of those ahead of an attachment can eat the very Energy the turn was about to attach — the play
would destroy its own reason. **Trevor's own Professor Oak note is this rule from the other side**:
*"consumables like Potion or PlusPower want to be used immediately before Professor Oak even if
they're not needed, because they get discarded otherwise."*

**So the rule is: an action that can consume your hand is never promoted ahead of one that uses it.**
A new card joins the set only if it takes nothing from hand. Do not widen this to "hand-growing
Trainers" — that is the category, and the category is wrong.

### What it does, measured on one board

A Charmeleon on the evolution road with a Charizard in hand — the attach is worth ~101 and everything
else is worth ten or less:

| hand | before | now |
|---|---|---|
| Energy, Charizard | attach | attach — unchanged |
| Energy, Charizard, **Bill** | attach | **Bill** |
| Energy, Charizard, Bill, **Poké Ball** | attach | **Poké Ball**, then Bill, then attach |
| Energy, Charizard, **Professor Oak** | attach | **attach** — the carve-out holding |

**Three assertions in `powertest.js` rather than claim rows**, because these came off the grab bag and
not out of the workbook, and because they are about *when* rather than *what*. **Two of the three go
red against the previous commit; the third — Oak staying behind the attach — passes both ways on
purpose**, since it guards a behaviour that was already right and must survive.

### Deliberately NOT extended to benching or evolving, though the argument covers them

**Printing a whole turn makes the question obvious**, which is worth doing when you touch an
ordering. It now reads:

```
Poké Ball  ->  Bill  ->  attachEnergy  ->  evolve  ->  playBasic  ->  pass
```

**`playBasic` sits after the attachment and by the same argument it should not** — a Basic you have
not benched yet is an attach target that does not exist when the attach is scored. `evolve` is the
milder version of the same thing.

**Left alone on purpose, twice over.** Trevor's observation was about Trainers altering the scenario,
and the two cases are much weaker: `attachBuild` already looks ahead through `evolutionInHand` and
`potentialAs`, so an attachment made before an evolution is not blind to it; and a Basic benched this
turn has no Energy and is rarely the best target anyway. **Extending an ordering rule because its
argument happens to reach is how a narrow fix becomes a turn-structure rewrite** — the carve-out above
is the same lesson. If anyone does extend it, `playBasic` is the one with a real case and it wants its
own measurement.

### Measured, and the divergence is the point

`abtest 8 HEAD`: **75.6% of 17,296 games diverge, median first difference at action 3** — by far the
largest change of the job, and exactly what an ordering rule should look like. It fires on almost
every turn of almost every game, because Bill is in almost every deck. Win rate 48.9% → 49.0%,
symmetric and uninformative as always.

**The stall count read 341 against a documented floor of 308 and that is NOT a regression.** The floor
was measured on an identical tree playing the same games twice; once three quarters of the games are
different games the count resamples, and 341 is under two standard deviations of a 1.8% rate. Checked
properly rather than reasoned about — same instrument on both trees gives **20 actions in the longest
single turn on each, one cap hit on each, six null choices on each**, with games 0.7% longer. No loop,
no pathology. *[What a stall actually is, and the check to run →](MISREADINGS.md)*

### And the promoted action keeps its own score

An earlier version copied the attachment's score onto it, which would have written a Bill into the
match log at **101.00** — a number true of nothing. The log is the one instrument that shows what the
bot weighed, so a promotion has to read as a promotion. `__why` says so instead.

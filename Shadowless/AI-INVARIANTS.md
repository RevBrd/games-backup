# Shadowless — what has shipped in the AI, and the invariant each one left

**One entry per change to `src/ai.js` that shipped, each stating what must stay true.** Read the
entry before you touch the term it names — every one is a rule somebody bought with a wrong version
first, and several look like arbitrary constants until you know what they are holding up.

**This file is the directory and the method. Each invariant is its own file in
[`AI-INVARIANTS/`](AI-INVARIANTS/)** — the same shape [`Rulings/`](Rulings/) took, and for the same
reason: a reader opens one door rather than scrolling past thirteen decisions they did not come for.

[AI.md](AI.md) is the parent and holds the *model*: how the bot scores, where it fails silently, the
Active/Bench unit split, the cliff table and the open list. **Nothing here tells you whether a change
worked** — that is [MEASUREMENT.md](MEASUREMENT.md).

## Why a directory now, when this was refused as one before

**The sixth pass refused `AI.md` a directory and the eighth made it a single sibling instead, and
both were right on the evidence they had.** The refusal's stated reason was *"twenty-three files of
eight lines each is worse navigation than the section was."* **That premise expired.** Measured
2 Sep 2026:

| | Entries | Lines each |
|---|---|---|
| The two archives — what the refusal was about | ~23 | 8–20, bold-lead paragraphs |
| **This register, when it was split** | **14** | **41–129, averaging 65, with their own `###` subsections** |
| [`Rulings/`](Rulings/), for comparison | 28 | 21–133 |

The entry grew by three to six times while the *rule about* the entry did not.
[MAINTENANCE.md](MAINTENANCE.md)'s three questions — **how many entries, how long is each, and how
many copies already exist** — now return "directory" on all three: 38 across this folder and both
archives, file-sized, and the table below says a third of them exist nowhere else. **The lesson is
not that the earlier passes were wrong. It is that a shape decision has an expiry date and nothing
re-checks it**, so the measurement is written here rather than only the conclusion.

**The two archives stay as archives and are NOT converted.** Their entries genuinely are
paragraph-sized, and splitting them would recreate exactly the shape the sixth pass correctly
refused.

| Archive | Entries | Jobs | Terms that live there |
|---|---|---|---|
| [AI-INVARIANTS-ARCHIVE-1.md](AI-INVARIANTS-ARCHIVE-1.md) | 13–19 Aug 2026 | 9 through 10.5 | `retreatPrize`, `STALL_VERBS`, `expUseful`, `setupAuto`, `slotSymbols`, `prizeIndex` |
| [AI-INVARIANTS-ARCHIVE-2.md](AI-INVARIANTS-ARCHIVE-2.md) | 21–25 Aug 2026 | 11 through 12c | `threatAgainst`, `selfSwitch`, `retreatSaveEnergy`, `wallScore`, `shieldSelf`, `discardSilence`, `statusNovelty`, `pLethalThisTurn` |

**`AI.md`'s index table covers this folder and both archives**, marking which one each row is in, so
you can find the entry you need from either end without opening all three.

## Adding an entry

**A new file in [`AI-INVARIANTS/`](AI-INVARIANTS/), plus a row below.** Copy an existing entry's
header block. **Name the file for the TERM it governs**, not for the date — the term is what somebody
greps after reading `ai.js`, and a date is what nobody ever searches for. Four of the fourteen
original entries were headed by a date, and their filenames were taken from their subject instead.

**Never point at a position.** *"The entry above"*, *"three lines above it"* — a split re-points those
at different material rather than breaking loudly, and three had to be repaired on the way into this
folder. One of the three had been pointing the **wrong way** since the day it was written, which is
the argument for the rule: a positional reference can be wrong without ever looking wrong. Name the
entry and link it.

**Deliberately not counted, here or in `AI.md`.** The number was written into prose as *twenty-three*
on 22 Aug 2026 and was wrong four entries later, in two files at once, while the index table beside
it silently kept telling the truth. **The table is the count.**

**Sign your entries with your designation, beside the date — Trevor's ask, 22 Aug 2026.** Entries
predating the convention were signed retroactively **only where the evidence is unambiguous**. **Two
are deliberately left unsigned**, the 18 Aug Energy-pool fix and the 19 Aug Prize picker, because two
instances were working on each of those days and nothing names which one. A guessed attribution is
worse than a blank: nobody re-checks it, and it is somebody's work.

## Where each account lives, and why the answer is several places

**The entry is the rule. The account of how the fault was found is somewhere else.** This has been
stated wrong three times, each time by a sentence that was true when written, so it is a table rather
than a claim — and **three of its rows were still wrong on 2 Sep 2026**, all failing the same way:
they named `GRABHIST.md` for material that had since moved into its archives.

| Entries dated | Fuller account in | Because |
|---|---|---|
| 13–16 Aug — **archive 1** | [GRABHIST-ARCHIVE-1.md](GRABHIST-ARCHIVE-1.md) | they came out of Trevor's grab bag, which has its own append-only register |
| 18 Aug — **archive 1** | **nowhere else** | they came out of *set and job work*, and nothing was recording that |
| 19, 21 Aug — **archives 1 and 2** | [GRABHIST-ARCHIVE-2.md](GRABHIST-ARCHIVE-2.md) | the hand-resize, retreat and Charizard work all came out of match logs |
| 22 Aug — **archive 2** | [`Playbook/`](Playbook/) **only** | the status, barrier and attack-choice work came from a playbook pattern. **There is no 22 Aug grab bag entry at all**, and this row promised one |
| 23–25 Aug — **archive 2** | [`Playbook/`](Playbook/) and `tools/claims/`, or **nowhere else** | the claims harness leaves its own artifact; the 25 Aug Power-scoring crash came out of a `decksim.js` run and is recorded only there |
| 28–29 Aug — **this folder** | [`Playbook/`](Playbook/) | Ammo and Evolution timing hold the measurements |
| 30–31 Aug — **this folder** | [`Playbook/`](Playbook/), [GRABHIST.md](GRABHIST.md), [LOGBOOK-ARCHIVE-6.md](LOGBOOK-ARCHIVE-6.md) | the Trainer sweep and the Over-Attach work; Ninetales and the GBC-sequel ordering are grab bag entries |
| 1 Sep — **this folder** | [Playbook/EVOLUTION-TIMING.md](Playbook/EVOLUTION-TIMING.md) | all three came out of Trevor's account of the GBC turn order |
| 5 Sep — **this folder** | [GRABHIST.md](GRABHIST.md) and [Playbook/WALLS.md](Playbook/WALLS.md) | the attack road came out of a grab bag note, and its wall gate is the boundary WALLS.md had already described |
| 6 Sep — **this folder** | [Playbook/AMMO.md](Playbook/AMMO.md) and `tools/claims/` | the discard billing came out of Trevor's Charmeleon rule; the five rows that pin it ARE the fuller account |
| 6 Sep — **this folder** | [GRABHIST.md](GRABHIST.md) | the status paths came out of Trevor's reopened GBC 2 item, and why it was half done belongs with the grab bag |

**The opening placement fix, the Energy-pool fix, the whole triggered-Powers section and the 25 Aug
Power-scoring crash are the only copy that exists.** Condense one of those and the reasoning is gone.

**Check this table before you trim anything on the grounds that it is preserved elsewhere, and go and
look at the elsewhere.** A "this is duplicated" claim is a claim about *two* files and it decays the
moment either one moves — which is exactly how three rows here went stale, and the blanket version of
it was once cited as grounds for refusing this material a home at all.
*[That refusal, and why it expired →](HISTORY.md)*

## The entries

**Oldest first, in the order they shipped.** The `Term` column is the index: grep it in `ai.js`, then
open the entry.

| When | The invariant | Term | Entry |
|---|---|---|---|
| 28 Aug 2026 | **ammunition is only ammunition if you have nothing else to shoot with** | `ammoSymbols` | [AMMO-SYMBOLS](AI-INVARIANTS/AMMO-SYMBOLS.md) |
| 28 Aug 2026 | **a Pokemon about to become something else is not paid up** | `evolutionInHand`, `potentialAs`, `evolveEarly` | [EVOLUTION-READINESS](AI-INVARIANTS/EVOLUTION-READINESS.md) |
| 28 Aug 2026 | **one of the twins gets fed** | `evolutionRoadFor`, `benchDuplicate` | [EVOLUTION-ROAD-TWINS](AI-INVARIANTS/EVOLUTION-ROAD-TWINS.md) |
| 28 Aug 2026 | **a shield is a shield whichever direction the damage comes from** | `T_DEFENDER` | [DEFENDER-SELF-HARM](AI-INVARIANTS/DEFENDER-SELF-HARM.md) |
| 30 Aug 2026 | **a strip is not a payment, and the AI was never choosing at all** | `energyStripOrder`, `energyUids` | [ENERGY-STRIP-ORDER](AI-INVARIANTS/ENERGY-STRIP-ORDER.md) |
| 30 Aug 2026 | **PlusPower is worth the turn it takes off the kill, not only the last one** | `turnsWith`, `T_PLUSPOWER` | [PLUSPOWER-TURNS-WITH](AI-INVARIANTS/PLUSPOWER-TURNS-WITH.md) |
| 30 Aug 2026 | **one drag, one rule, and the attack half was rolling dice** | `bestDragTarget`, `dragScore` | [DRAG-TARGET](AI-INVARIANTS/DRAG-TARGET.md) |
| 30 Aug 2026 | **a Switch is worth the retreat cost it nullifies, and half of that is open** | `T_SWITCH_OWN` | [SWITCH-NULLIFIES-RETREAT](AI-INVARIANTS/SWITCH-NULLIFIES-RETREAT.md) |
| 31 Aug 2026 | **the off-by-one is a hedge, and the fix was in the selection** | `turnsLeft`, `survivesCharge` | [SURVIVES-CHARGE-HEDGE](AI-INVARIANTS/SURVIVES-CHARGE-HEDGE.md) |
| 31 Aug 2026 | **the attachment is last, and a search goes before a draw** | `playFirst`, `handGrowKind` | [PLAY-ORDER](AI-INVARIANTS/PLAY-ORDER.md) |
| 31 Aug 2026 | **the printed number is not what the card does, and the Bench read it anyway** | `slotPrintedDamage`, `spareEnergyDamage` | [SLOT-PRINTED-DAMAGE](AI-INVARIANTS/SLOT-PRINTED-DAMAGE.md) |
| 1 Sep 2026 | **a Water that pays a Colorless is still a Water that was used** | `spareEnergyFor` | [SPARE-ENERGY-FOR](AI-INVARIANTS/SPARE-ENERGY-FOR.md) |
| 1 Sep 2026 | **the destination is not always the cheapest attack, and it is asked in three places** | `attackThreatens`, `destShort` | [EVOLUTION-DESTINATION](AI-INVARIANTS/EVOLUTION-DESTINATION.md) |
| 1 Sep 2026 | **the plan is the whole line, and the evolve goes before the attach** | `evolutionPlan`, `roadWant` | [EVOLUTION-PLAN](AI-INVARIANTS/EVOLUTION-PLAN.md) |
| 2 Sep 2026 | **a heal is worth a rescue only if it actually rescues, and the target is chosen by value** | `healRescues`, `T_HEAL`, `T_DISCARD_ENERGY_THEN_HEAL` | [HEAL-RESCUE](AI-INVARIANTS/HEAL-RESCUE.md) |
| 3 Sep 2026 | **a Switch is worth how much you want to move, and the cost is already priced** | `T_SWITCH_OWN`, `bestSelfSwitch` | [SWITCH-DESIRE-TO-RUN](AI-INVARIANTS/SWITCH-DESIRE-TO-RUN.md) |
| 3 Sep 2026 | **a card's wall-ness rises as its evolution stops being live** | `roadLive`, `wallHere`, `wallShape` | [WALL-ROAD-LIVE](AI-INVARIANTS/WALL-ROAD-LIVE.md) |
| 5 Sep 2026 | **a card has a road to its own bigger attack, and `short` pins at zero so nobody could see it** | `destGoal`, `wallPlanFloor`, `attachValue` | [ATTACK-ROAD](AI-INVARIANTS/ATTACK-ROAD.md) |
| 6 Sep 2026 | **...and the road runs to the nearest attack BETTER than what is affordable, self-destruct included** | `upShort`, `upGoal` | [ATTACK-ROAD](AI-INVARIANTS/ATTACK-ROAD.md) (same entry, widened) |
| 6 Sep 2026 | **silence is counted in Energy and was billed as turns, and the discount for dying was unreachable** | `energyRefillTurns`, `turnsLeft` | [SILENCE-IN-TURNS](AI-INVARIANTS/SILENCE-IN-TURNS.md) |
| 6 Sep 2026 | **one home for what a status on their Active is worth, and the Power path had none of the rules** | `statusWorthAgainst` | [STATUS-ONE-HOME](AI-INVARIANTS/STATUS-ONE-HOME.md) |
| 7 Sep 2026 | **the opponent's deck is a clock, and a bought turn is worth more while it runs** | `deckOutClock`, both copies of `turnScale` | [DECK-OUT-CLOCK](AI-INVARIANTS/DECK-OUT-CLOCK.md) |
| 10 Sep 2026 | **a coin-scaling attack is a correct multiplication over the wrong pool, and the pool is the only thing that can be wrong** | `rawOutcomes` (`DMG_PER_ENERGY_HEADS`, `DMG_PER_NAMED_IN_PLAY`), `slotPrintedDamage` | [DYNAMIC-COIN-COUNT](AI-INVARIANTS/DYNAMIC-COIN-COUNT.md) |

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

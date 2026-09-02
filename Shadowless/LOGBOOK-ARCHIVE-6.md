# Shadowless — logbook archive 6: Jobs 13 through 14b

**#28 through #32, verbatim.** Job 13 (the Wizards Black Star Promos, both halves), Job 14a (the
tenth documentation pass) and Job 14b's Trainer and Over-Attach work. Moved here on 2 Sep 2026 by
Shadowless 34 during the eleventh documentation pass, when Job 14b was closed and the live file had
reached 609 lines against a ~250 rule in its own header.

[LOGBOOK.md](LOGBOOK.md) is the live file and carries the roll of every archive. `CREDITS.md` is the
short version of who did what.

**This file is append-only and closed.** New entries go in the live file, not here. Correct an entry
if it turns out wrong; **never shorten one** — the value of a logbook is that it says what somebody
thought at the time, and a later pass finding an entry redundant is exactly the judgement it is not
allowed to make. The 200-line target does not apply.

**Archives run to ~450 rather than the live file's ~250** — Trevor's call, 2 Sep 2026, and the
reasoning is that the two numbers were never measuring the same risk. The live limit exists because
instances *append* to that file and an entry once landed in the middle of another's when the end
scrolled out of view. An archive is closed and never appended to, so that failure cannot happen here;
what a bigger archive costs is a longer read, and what it buys is fewer files for the roll to carry.
**Start `LOGBOOK-ARCHIVE-7.md` rather than growing this one past ~450.**

**#31 wrote no logbook entry, and its section here is its `CREDITS.md` row moved across verbatim** —
the rule both files carry, and the same move #27 made for #21 through #26 into archive 5. It is
filed in date order with the rest rather than in an appendix, because its subject is 30 Aug 2026 and
that is where somebody looking for that work will look. It reads compressed because a credits row is
what it is.

**This file is at 442 of its ~450 and is effectively full.** The next archive is 7.

---

## Opus 5 #28 — Sandslash, 26 Aug 2026

**Job 13: the Wizards Black Star Promos, basep-1 through basep-28.** Twenty-eight cards, roughly
twenty new verbs, one new trigger and one new ruling. The cards were the easy half and I want to
write down the other half, because it kept being the same thing.

### Four scorers were reading a verb their engine half had outgrown

This is the finding, and it happened four separate times in one session:

- `DMG_PER_COUNTER_SELF` grew an optional `base` for Dodrio. `ai.js` multiplied and never added, so
  the bot undervalued Dodrio, Cubone and Dark Flareon's Rage by 10 and Tauros's Rampage by 20 —
  possibly since Base Set. Measured against HEAD: Tauros reaches for Rampage at 20 damage now, where
  it used to hold out until 40.
- `BENCH_SPLASH` grew a `side` for Team Rocket. `ai.js` read only the number, so Dark Arbok was
  charged for wrecking a Bench that Poison Vapor never touches. On a hurt board it scored **-142**
  and played Stare instead. Two live ladder decks hold that card.
- `CONVERT_DEF_WEAKNESS` and `CONVERT_SELF_RESISTANCE` were fine apart and wrong together the moment
  one card did both, because both bonuses were charged against one chosen type.
- And `board.js`'s `bestAttack` scored `scoreAttack(idx)`, which cannot see `a.opts` — so every
  attack whose value lives in its OPTION was measured as though it had none. My Cool Porygon claim
  was failing against a bot that was doing the right thing.

**The shape is always: one verb, two implementations, in two modules, with nothing asserting they
agree.** The engine's half gets a parameter because a card needs it. The scorer's half is not
touched, because the card that needed it works fine. Nothing goes red, ever — the attack is legal,
it deals full damage when used, and the only symptom is a bot that quietly declines to reach for it.
`selftest.js` checks a verb is *mentioned* by `ai.js`, which all four of these were.

I don't have a guard for it and I'm not sure a cheap one exists. What I would tell the next session
is narrower and actionable: **when you add a parameter to an existing verb, open `ai.js` and read
that verb's case before you close the file.** All four of these were a one-line fix and a five-minute
find, once someone looked.

### The unreachable-scorer trap, now three sessions running

#26's entry directly above mine describes three PROVISIONAL Power cases referencing a `me` that
`scorePower` never defines, crashing the instant a deck held one. I hit the same class twice today:
`DMG_PER_HEAD_IN_PLAY` reached for `E` and `pi` inside `rawOutcomes`, which has neither, and Solar
Power's first draft reached for a `W.statusClear` that does not exist — which would have made the
whole Power score NaN in silence.

**Scorer code for a card no deck holds is unreachable, therefore unrun, therefore untested**, and it
accumulates scope errors and phantom weights that look completely fine in a diff. Every one of the
five was found by *running the card on a board*, never by reading. If you write scoring for a card
nothing plays, build a two-line probe and fire it once. That is the whole prophylactic.

### Trevor's notes did the thing PLAYBOOK.md says they do

Cat Punch is the example I would point at. His note reads *"the bot shouldn't do anything obviously
dumb like killing something with it or picking a pokemon it was actively investing in"* — which is
two clauses and became two scoring terms that both fire correctly. But writing them exposed a third
thing he had not said and could not have: two undamaged Basics with no Energy scored an identical 0
and the bot took whichever came first. A sentence about what *not* to do located a cliff underneath
it. That is the method working in a way a tag or a weight sweep cannot.

I also priced Cat Punch as the hardest card in the set and it was among the cheapest. Job 10e built
`ask()` general for one card on the evidence that the question recurs seventeen times across six
sets and the effects never do — so Cat Punch was one `ask`, one continuation, one scorer. **Somebody
else's decision to generalise two jobs ago is why this one was an afternoon.** Worth knowing when
you are deciding whether to build the general thing.

### Two that would have shipped invisibly

`new Date('2026-07-31')` parses as UTC midnight, so west of Greenwich it reads back as the 30th.
Birthday Surprise would have fired a day early across the Americas, one day a year, looking exactly
like an unlucky coin. I only caught it because I pinned the date in a probe and never once saw the
bonus. It is Trevor's actual birthday on that card, which made it worth getting right rather than
merely correct.

And I filed Computer Error as UNSCORED_ON_PURPOSE with a justification I had not checked. Unscored
means zero; End turn also scores zero; so on a board where the bot could not act the two **tied**,
and the tie broke on list order in favour of handing the opponent five cards for nothing. **A card
that ends your own turn cannot be left to a default that is indistinguishable from the thing it is
supposed to lose to.** I wrote the justification before the measurement, which is the wrong order and
is exactly what `MEASUREMENT.md` is about.

### The landmine, and why it went in on day one

`liveSets()` derives "live" from *every card in the set is scripted*, and every caller reads that as
*is this a set*. So the day somebody finished the last promo script, `basep` would have promoted
itself to a ladder bracket titled "Wizards Black Star Promos", with a generated roster, a dex section
and a completion percentage — and nobody would have connected it to a card they wrote six months
earlier. `booster: false` in `SET_INFO` now refuses it. I reproduced the landmine with the guard off
before calling it fixed, which I recommend as a habit; it is the difference between a guard and a
decoration, and this tree has said so in three separate files.

**A note on where I put things.** Trevor asked whether the Flames of Rage finding belonged in
`AMMO.md`, and it did — but the better discovery was that a comment in `discardSilence` had already
half-anticipated it for a different Arcanine. What was missing was the sentence that makes it click:
*a card with a cheap fallback defeats the cheapest-attack reading entirely.* When you find that a
past instance nearly had your finding, the valuable thing to write down is the half they were
missing, not the whole thing again.

*— #28, who was told the promos were a fun one and found that the promos were fine and the AI had
been quietly misreading its own verbs for a month.*

---

## #29 — the cards existed and could not be reached

I arrived to what was described as the tail end of Job 13: the promo cards were written and scored,
and what remained was "adding them into the game." That framing was exactly right and I want to
record what it turned out to mean, because the shape recurs.

**The feature was 90% built and 0% reachable.** `promoPool()` existed. `openPack` took an
`opts.promos`. `packtest.js` had five assertions proving the intrusion mechanism worked. And the
default was `[]`, and no caller in the game ever passed anything, so the 1-in-100 promo roll built in
Job 5b had never fired once in three weeks of Trevor's play. Every suite was green the whole time.

The guard that should have caught it is the one that was *testing the thing*. `packtest.js` supplies
a fake promo pool and checks the mechanism honours it — which is correct and which cannot, even in
principle, notice that nothing else supplies one. **A default that makes a feature inert is invisible
to a test that passes the argument.** I do not have a general fix for that and I do not think one
exists; the specific fix is to ask, once per feature, "who calls this in the real game", and the
place that question survives is a doc line rather than a suite.

**The doc tree paid off in the most direct way I have seen.** `progress.js`'s header contains a
paragraph addressed to whoever built this, by name, telling them not to reach for `liveSets()` and
explaining that "collectible" is a wider question than "live". #28 wrote it while working on
something else, from an inference about what would happen later. It was completely correct, and it
saved me from a change that would have handed the collection a ladder bracket titled *Wizards Black
Star Promos* with a generated roster and a completion percentage. **Write the paragraph for the job
you are not doing.** It is the cheapest thing in this repo and it has the best hit rate.

**Two CSS bugs came out of one screenshot, and neither was a promo bug.** Shooting a forced
intrusion put a card from an unfetched set on the pack screen for the first time ever, and the
fallback that `pullFace` promises in a comment turned out to be false in two independent ways:
`.cardface.miss{display:none}` was silently outranked by a `display:block` added 500 lines later for
an unrelated 2px gap, and the sigil that replaces the scan had no size on that screen and blew the
layout apart. **Both would have hit the next set's first pack screenshot identically.** The `.miss`
rule now lives last in the stylesheet, which makes "this element is OFF" structurally unbeatable
rather than luckily unbeaten — the CSS twin of a lesson this tree already had.

**On the change Trevor made mid-job.** He asked whether the intrusion should still replace a Common
now that the pack is eight cards rather than eleven, and asked for an honest opinion rather than
agreement. The argument that convinced me is not "more cards is nicer": it is that the replacement
rule was *priced* against an eleven-card pack and the 25 Aug shrink repriced it without anyone
connecting the two. `PACKS.md` already had a paragraph about four cosmetic axes that moved that way.
This was the fifth. **When a structural constant changes, the rules written against the old value do
not announce themselves** — they keep working and start meaning something different.

The thing I would tell the next session: the eleven promos still locked behind `challenge1`,
`challenge2`, `gym1` and `gym2` need no code at all. A ladder bracket carrying that key turns each
one on. I deliberately did not build a placeholder for them, and `progresstest.js` asserts they stay
closed until something real exists — a gate that fails open is a card leaking out of a bracket
nobody has designed yet.

*— #29, who was handed a finished feature and found the wire that was never connected.*

## #30 — Opus 5, 29 Aug 2026 (Job 14a, the tenth documentation pass)

I came in expecting to shorten files and spent most of the day finding claims that were true when
somebody wrote them.

**The one I would want the next pass to know about is the shape, not the instance.** Nine of the
eleven things I fixed were *sentences that quantified over a set that later grew.* "`gen_cards.js`
reads exactly four files" — true, then three rosters were wired in and the table under it grew to
nine rows while the sentence sat there. "Sixteen patterns" — true, then a seventeenth was added, and
the same file went on describing *"naming the seventeenth pattern"* as outstanding work, four
paragraphs from a list that already contained it. "Every roster has been played by `decksim.js`" —
true of three. **None of these decays like a stale fact; they decay like a fencepost.** The author
counts correctly, the count is right, and then reality adds one and nobody re-reads the sentence,
because nothing about adding a roster makes you think about a paragraph in `DATA.md`.

`MAINTENANCE.md` already says not to put counts in prose and I still think that is right, but it
undersells the problem: **the dangerous ones are not counts, they are quantifiers.** "Exactly four",
"all four", "the rest of the sixteen", "two of them have also been". A count reads as a fact somebody
might check. A quantifier reads as a *property*, and nobody checks a property.

**The Fossil roster had never been measured and two files said it had.** That is the same bug with
consequences: `OPPONENTS.md` promised all four rosters had been through `decksim.js`, `CLAUDE.md`
promised `ROSTERS.md` held what the sim said about each one, and `ROSTERS.md` did not contain the word
Fossil. Trevor's answer when I asked was the honest one — Fossil went in alongside Jungle in the same
job, so it *would* have had the same treatment — and that is exactly how the gap survives. Nobody
lied. Everybody reasoned from the job rather than from the file.

**Running it was the best forty seconds of the day and I nearly did not.** It felt like roster work
rather than docs work, and the docs-pass rule is not to touch code. It does not touch code. And the
solo run said Fossil's tiers do not order — which on its own is a fourth data point in a file that
already had three. **The merged nineteen-deck run is where it turned into something.** All three
bosses measured so far land within 2.8 points of each other, below every roster's best T3 — and the
better a boss *assembles*, the worse it *finishes*. Gengar lands in 89% of games, the highest
assembly rate this project has ever recorded, and comes twelfth of nineteen. Vileplume 76%, tenth.
Charizard 53%, ninth.

I want to be careful about that, because this file is full of people being careful about exactly this
and being right to. It is three points. The round-robin runs the same bot on both sides. But the
usual confound points the *wrong way* here: a bot that plays the field badly should be helped, not
hurt, by a deck that reliably assembles the thing it is built around. Whatever is happening is
happening *after* the centrepiece lands, and `ROSTERS.md` has been carrying a one-deck version of
that question since 21 Aug without anyone able to say whether it generalised. It does.

**Two smaller things worth passing on.**

The archive split nearly created the defect it was cleaning up. `AI-INVARIANTS.md`'s newest entry
opened *"the 21 Aug entry two above this one"* — and I was in the middle of moving the 21 Aug entries
into an archive. A positional reference does not break loudly; it silently starts pointing at a
different entry. `MEASUREMENT.md` has this exact lesson about a growing table and I only caught it
because I had read that file the same morning. **Grep for "above", "below" and "the last" before you
move anything.**

And `HISTORY.md` had a rejection ending in a comma. The clause — *"and `greedy` is one already
built"* — was the last line of a file with no trailing newline, and the next append landed on top of
it. **Append-only protects against editing; it does not protect against a missing newline.** I swept
every doc in the tree and no other file has the hazard, which I would rather have known than assumed.

The thing I would tell the next session: **the length target is real but it is the smaller half.** I
got `AI-INVARIANTS.md` from 476 to 217 and the tree is roughly flat overall, because I added a
measured roster section and two register entries that did not exist. That is the right trade and I
would make it again. Nobody has ever lost a morning to a file being 380 lines. Two sessions lost time
this month to files being *confidently wrong*.

*— #30, who came to count lines and stayed to check quantifiers.*

## #31 — Opus 5, 30 Aug 2026 (Job 14b, the Trainer half of the playbook)

**#31 wrote no logbook entry.** What follows is its `CREDITS.md` row, moved here **verbatim** on
2 Sep 2026 by Shadowless 34 before that row was written short — the rule both files carry, and the
same move #27 made for #21 through #26. Nothing has been added to it and nothing rephrased; it is a
credits row rather than a logbook entry, and reads compressed because that is what it was written as.

> Job 14b, opening on the Trainer half of the playbook. Found the AI **had never chosen which Energy to strip** — `energyIdx` is a key nothing has read since the human got a picker, so Energy Removal and Super Energy Removal both fell through to the order a Pokemon pays its OWN costs in and politely took what the target needed least. `energyStripOrder` is its inverse. Then PlusPower, priced for the one turn it saves instead of every turn it saves; then the drag: Gust of Wind chose its target and an *attack* that dragged rolled dice, which is the Ninetales Lure item off Trevor's grab bag arriving from the other direction. Then Switch, worth the retreat cost it nullifies and priced on a free-retreat Active at 24.00. Closed AI.md's reserve item — asked Trevor, and all three cards left by different doors, none of them a reserve case. Found that **no claim board could test an evolution**: `setup()` never advanced `turnsTaken`, so every `evolve` was silently absent from `legalActions` on every board the harness has ever built. Then, on Trevor's question about the reusable answer: ran the "off-by-one" in `survivesCharge` as an experiment and found it is a **hedge** — three claim rows flip without it, all in the band where a Pokemon survives exactly one more hit. Split the fact (`turnsLeft`) from the policy, which caught the same idea written four times including a boolean from the previous day that disagreed with it. The Charmeleon fault was in the SELECTION, not the discount. Then, off Trevor's notes from the Japan-only GBC sequel: setup actions were ordered purely by score, so an attach worth 101 went before a Bill worth 10 and the Bill then drew the card that would have changed where the Energy went — no score can fix a play that is worth EARLIER rather than more. Also lifted the Jungle/Fossil claims hold two files were asserting against their own data

— *#31, via its credits row*

---

## Opus 5 #32 — Lapras, 31 Aug – 1 Sep 2026 (Job 14b, the Over-Attach pattern)

I picked this off a grep rather than a hunch, and I want to write down the grep because it was the
best decision I made all session. Jungle and Fossil had 91 notes and zero claims; I counted which
pattern names Trevor had written into them, and **Over-Attach was the largest by a distance** — nine
mentions against Attack Choice's six. Then one more question: *what does that pattern have in common
mechanically?* Answer: the damage number is a function of the Energy. And then the tell, which is
that `aiParseDamage` reads a leading integer off a string.

Two probes and the fault was on the screen. **Active Lapras +23.04, benched Lapras −2.00**, same
board, same card, same Energy. I had a measured fault fifteen minutes after opening the file, and
none of it was cleverness — it was picking the family whose members share a mechanism and then asking
what the code does with that mechanism.

### The thing I'd tell the next session

**Two faults that produce the same wrong number on the same board are not one fault.**

`AI.md`'s open item 1 has said for a fortnight that the Bench is priced in printed damage while the
Active gets expected value, that closing it is "a real refactor of `scoreAttack`'s relationship with
engine state", and that there is a named test case waiting — the benched Poliwag refused a second
Water. That test case was **not** that item. Two different things were producing an identical symptom:

- *printed damage and expected value are different scales* — a **unit** problem, genuinely a refactor,
  still completely open
- *printed damage is wrong about itself* — a **fact** problem, because a Lapras on three Water really
  does print 30, and no unit change is required to say so

The cheap one had been filed under the expensive one and inherited its cost estimate. It took an
afternoon. I've split them in `AI.md` and left item 1 exactly as open as it was, because I did not
touch it and I don't want anyone inheriting "that's done" from this.

### Three green tests were measuring a threat the engine cannot produce

This is the one I'd put on the wall. Underneath the Bench fault was a smaller one: `maxSpare` went
into `engine.js` in Job 6 and never into `ai.js`, so the scorer thought a Lapras on five Water dealt
50. When I fixed that, three `powertest.js` assertions went red — and they were **correct assertions**
about the barrier curve. Their fixture swept the incoming threat by piling Water onto a Lapras, on the
stated reasoning that its Water Gun "grows with its Energy". It caps at 30. Their rungs of 50, 60 and
70 were all really 30, and one of them carried its own guard reading *"board is not lethal; the test
proves nothing"* — a guard that had never once been true.

They passed because the AI agreed with them. Both halves were wrong the same way, so the fixture and
the thing it measured were in perfect agreement about a number no attack in this game can land.

**A test fixture is AI output too**, and this project already holds the invariant it violated — *the
AI can never predict a number the engine would not produce*, 13 Aug — asserted about a function in the
same file. The violation was sitting inside the suite that asserts it.

I fixed the fixture rather than the assertions, and added a fourth test to license the repair, because
no single live card sweeps a threat from 10 to 80 and I had to use two. The new one says the barrier
must be a function of the *threat* and not of the card making it — checked where a Poliwag on two
Water and an Exeggutor on one both threaten exactly 20. It costs nothing and it is the only thing that
makes a two-card ladder honest.

### On #28's "I don't have a guard for it"

#28's entry above says, of one verb implemented twice in two modules with nothing asserting they
agree: *"I don't have a guard for it and I'm not sure a cheap one exists."* I think for a subclass
there is one, and I built it: **where the damage is a pure function of the attacker's own board, make
the engine resolve the attack and compare the numbers.** No fixture, no expected value, a sweep over
the live pool so a new set is covered for free. It found Poliwrath when I broke the clamp on purpose.

**But it is only half a guard and I want the limit recorded next to the tool.** Agreement is not
correctness. Blastoise, Poliwrath and Poliwag print *"extra Water Energy after the 2nd doesn't
count"* and **neither half had the cap** — written in Job 4b, before the parameter existed, and never
revisited. Both halves agreed, perfectly, on a number the card forbids. The second guard reads the
printed text and is the only thing that could ever have seen it.

So: two guards, and if you build one of these for another verb, know which one you are skipping.

### Small, and it kept being true

Every one of these was found by executing the card on a board and looking, and not one by reading the
scorer. That is now the entry above mine, and the one above that, and I think it is the actual method
of this project rather than a habit three sessions happen to share.

Also — Trevor answered a question about Switch mid-session that generalised past the card ("it prices
the move, and a free-retreat Active makes the card worth nothing"), and I did not get to it. It is a
better-specified `open:` row than it was; whoever takes it has his sentence rather than the hedge.

— #32

---

*(#32, continued — 1 Sep 2026, the destination rule. Appended rather than edited into the entry
above, per this file's own never-revise rule.)*

**Trevor asked a design question that was better than either answer he offered**: hand-enter target
Energy numbers per card, or generalise a rule about the evolution's cheapest *offensive* attack minus
one. I said generalise, and the argument I'd repeat is not the usual "a tag is a fact you'd be
re-typing." It's that **his notes become the oracle rather than the input.** A handful of cards where
a derived rule gets it wrong is worth more than 219 hand-entered targets, and it's a far smaller ask
of him.

Then the derivation reproduced eight of his notes without any of those cards being named in the code.
Ninetales, Wigglytuff, Nidorina, Hypno, Kadabra, Wartortle, Parasect, Victreebel — all written before
the rule existed, all naming the attack the rule independently picked, and three of them phrased
almost identically: *"doesn't want to be in a situation where it has to use it."* That sentence is the
readiness discount in English. I don't think I'll get a cleaner validation of this project's
derive-don't-tag doctrine than that, and it's worth more than the feature.

### Two things I got wrong on the way, both instructive

**I built the rule at one site, measured, got nothing, and nearly wrote it up as a null.** It's asked
in three places — `evolve`'s readiness, `attachBuild`'s road, and the surplus rule's `evolving`
exception — and the third returns `attachSurplus` before either of the others is reached. Two correct
changes, zero behaviour change. If I'd trusted the measurement over the diagnosis I'd have reverted a
right answer. **Find every call site before you measure.**

**And I nearly lost the session's work to a `git checkout --`.** I was setting up a control by
neutering a function, my `sed` hit the wrong one of two identical lines, and my reflex to clean up was
`git checkout -- src/ai.js` — which reverted every change I'd made that afternoon. It survived only
because a `cp` to a scratch file happened to have run first. **Use a targeted edit-and-revert for a
control, never a checkout**, and run the `abtest` control *after* committing, when the working tree is
the baseline and no stash is needed.

### On being asked to build something and finding a rules bug instead

Half of what this session actually produced wasn't AI work. The Over-Attach pattern led to `maxSpare`
missing from the scorer, which led to three Base Set cards missing a printed cap, which led to three
green tests measuring a threat the engine cannot produce, which led to a Water paying a Colorless
never being counted as used. None of those were the job. All of them were found by executing a card on
a board and comparing what happened to what the card says.

I'd tell the next session the thing this project already half-knows and could state harder: **the
printed card is an oracle you are not using enough.** Two of the guards I added read it directly, and
the second one exists because the first is structurally blind — two implementations that agree can
both be wrong, and only the card can say so. Where you find yourself asserting that two copies of a
rule match, ask whether you can delete one of them instead, and then ask the card.

— #32

---

*(#32, third and last — 1 Sep 2026, the line depth and the turn order.)*

**Trevor prefaced this one with "consider this me thinking out loud rather than actually suggesting
something," and it produced the best result of the session.** I want that noted, because the register
he used was the opposite of the value it had. What he described about the GBC bot's turn order turned
out to contain a formula:

    want = destShort(deepest form the hand can reach) − evolution steps remaining

I checked it against his own three numbers before writing a line of code and it was three for three,
including a Machop figure I hadn't looked up. **The rule I had shipped six hours earlier was this one
truncated to depth 1.** Not wrong — right for every one-step line, and one Energy too generous for
every deeper one.

### The same card wants a different amount depending on the plan

This is the part I'd have never reached alone. An Abra with a Kadabra coming wants two Psychic; the
same Abra with an Alakazam behind it wants **one**, because two evolution steps are two turns and two
turns bring two attachments. Nothing about the card changed. **No per-card target could express
that**, which is the strongest possible answer to the question he'd asked an hour earlier about
whether to hand-enter the numbers.

### Two claims died and both deaths were correct

One of my own rows went red when this landed — I'd asserted an Abra wanted a third Psychic, on the
truncated rule, quoting his *"wants to stay at 3 energies at all times."* That sentence is about
**Kadabra**. The Abra underneath it wants one fewer, and I'd read a note about one card as a note
about the card below it. Second time this file records the bot being right and the claim being wrong,
and I'd add the specific version: **a note about an evolution is not a note about its Basic**, and the
whole point of this rule is that those two numbers differ.

### The thing I keep coming back to

Three times today a rule turned out to be asked in more places than I'd found. `slotPrintedDamage`
was three sites. `spareEnergyFor` was two modules that had drifted in opposite directions. `roadWant`
was three call sites where **the third one returns before the other two**, so fixing two of them
produced no behaviour change at all and I nearly wrote a correct change up as a null.

If I could leave one sentence for the next session it would be that one: **before you measure a
scoring change, grep for every place that asks the same question.** This codebase's characteristic
fault is not a bad weight. It is one idea with several mouths, and the loudest one is usually the one
nobody found.

Second sentence, cheaper: **the printed card is an oracle nobody is using enough.** Half of what this
session produced came from executing a card on a board and comparing the result to what the card
actually says. Two implementations that agree can both be wrong, and only the card can tell you.

— #32



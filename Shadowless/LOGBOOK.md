# Shadowless — the logbook

What each instance did, in its own words. Split out of `CREDITS.md` on 11 Aug 2026, because the
narratives had grown to four times the attributions they were attached to and an attribution list
should be readable at a glance.

`CREDITS.md` is the short version: who worked on what, and when. This is why.

## How to add an entry

**Append it at the END of this file, below the last entry.** Say what you did, what surprised you,
and what you would tell the next session — length is yours, and there is no house style to match
beyond the tree's. Sign your session number.

That first instruction is written down because it has already gone wrong: an entry once landed in
the *middle* of another instance's, because the surrounding text had been summarised out of view and
the end of the file was not where it looked. **If you cannot see the last entry, scroll to the actual
end before you write.**

**Writing here is completely optional.** A `CREDITS.md` row with no logbook entry is fine. A logbook
entry with no row is how somebody gets left off, so take the row either way.

**Entries move out of this file when the work they describe is CLOSED**, into whichever archive is
still under ~250 lines — **start a new archive rather than growing one past it.** Archiving is a
boundary and not a count; the old rule was "hold the two most recent" and by the time anyone checked
it was holding six at 295 lines. **The most recent closed entry stays behind on purpose**: instances
visibly write better entries when there is one in front of them, so the live file always opens with
an example rather than a blank.

**Nothing already written may be edited or condensed**, here or in any archive — a later pass may
find an entry redundant and it is not, because the value of a logbook is that it says what somebody
thought at the time. Correct an entry; never shorten one. The 200-line target does not apply to any
of these files.

## What is where

| File | Instances | When | Read it for |
|---|---|---|---|
| [LOGBOOK-ARCHIVE-1.md](LOGBOOK-ARCHIVE-1.md) | #0–#10 | through 12 Aug 2026 | The Claude Chat era, Jobs 4–6, the first four documentation passes |
| [LOGBOOK-ARCHIVE-2.md](LOGBOOK-ARCHIVE-2.md) | #11–#14 | 12–15 Aug 2026 | Job 7, the AI retreat and recoil work, the opponent-deck research, the fifth documentation pass |
| [LOGBOOK-ARCHIVE-3.md](LOGBOOK-ARCHIVE-3.md) | #16–#17 | 16 Aug 2026 | Job 9's first AI batch and the sixth documentation pass |
| [LOGBOOK-ARCHIVE-4.md](LOGBOOK-ARCHIVE-4.md) | #19 | 18–19 Aug 2026 | Job 10 — the trigger points, `enterPlay`, and Team Rocket going live |
| [LOGBOOK-ARCHIVE-5.md](LOGBOOK-ARCHIVE-5.md) | #20–#26 | 19–25 Aug 2026 | Jobs 10.5 to 12c — two documentation passes, the Jungle and Fossil brackets, the claims harness, the 8-card pack |
| **this file** | #28–#30 | 26–29 Aug 2026 | Job 13 and Job 14a — the promos, and the tenth documentation pass |

**#15, #18 and #27 wrote no logbook entry and are not missing** — writing here is optional and a
`CREDITS.md` row alone is a complete record. Said explicitly because the Instances column above skips
those numbers, and a gap in a sequence reads as loss rather than as a choice. **This table is the roll
of archives**; anything else that lists them by hand will fall behind it, which is why `CREDITS.md`
stopped doing so on 29 Aug 2026.

**The preserved credit prose moved out with its entries.** #21 through #26 wrote no logbook entry,
their `CREDITS.md` rows had grown to between six and twenty-four lines each, and #27 moved that text
here verbatim before the rows were written short. All six now sit in
[LOGBOOK-ARCHIVE-5.md](LOGBOOK-ARCHIVE-5.md), still unchanged. **The rule is what to carry forward:
where an instance has no logbook entry, the row moves across whole first and only then gets
shortened** — never decide sentence by sentence what earned its place.

**One older artifact of this kind is in none of these files:**
`backups/pre-docs-cleanup/Packs Turn Log.txt`, the Sonnet 5 per-pass credits in that instance's own
words. It spent one pass unreachable — intact, indexed nowhere, cited by a sentence that had been
deleted. A pointer is not optional decoration on a preserved artifact; it is the half that rots.

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

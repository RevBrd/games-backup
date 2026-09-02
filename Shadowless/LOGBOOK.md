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
still short enough — **start a new archive rather than growing one past its limit.** Archiving is a
boundary and not a count; the old rule was "hold the two most recent" and by the time anyone checked
it was holding six at 295 lines. **The most recent closed entry stays behind on purpose**: instances
visibly write better entries when there is one in front of them, so the live file always opens with
an example rather than a blank.

**The live file's limit is ~250 and an archive's is ~450, and they are different numbers because
they are guarding different things** — Trevor's call, 2 Sep 2026. The live limit exists because
instances *append* here, and an entry once landed in the middle of another's when the end of the
file scrolled out of view; that is a hazard of writing, and it scales with length. An archive is
closed and never appended to, so it cannot happen there. What a longer archive costs is a longer
read; what it buys is fewer files for the table below to carry.

**Assume this file is over its limit and go and look — it was at 609 on 2 Sep 2026**, holding five
entries against a rule sitting at the top of its own header. That is the third register in this tree
to be found past a threshold written into itself, which is why the number is stated here at the point
of decision rather than only in the archive.

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
| [LOGBOOK-ARCHIVE-6.md](LOGBOOK-ARCHIVE-6.md) | #28–#32 | 26 Aug – 1 Sep 2026 | Jobs 13 to 14b — the promos and their reachability, the tenth documentation pass, the Over-Attach pattern |
| **this file** | #33, #34 | 1 Sep 2026 – | Job 15a's Challenge bracket, Job 15b's pack odds, and the eleventh documentation pass |

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

## #33 — Job 15a, the Challenge 1 bracket (1 Sep 2026)

Trevor asked whether Job 15a might be cheap enough to leave room for 15b. My first read was that it
would not be, and that read was right for the wrong reason. I thought the cost would be spread across
the ladder, the pack and the tests. Almost all of it was in **one field**.

`bracket.set` is a string that four different consumers read, and I only noticed because I sat down to
write the pack code and could not answer "which set is this pack of" without saying *it depends what
you mean by "of"*. Unlock and the promo gates want an **identity**. The save wants a **key**. The pool
wants **cards**. The screen wants **words**. For every bracket that had ever existed those are the same
string, so nothing had ever pulled them apart and nothing was wrong. A Challenge bracket makes two of
the four answers *empty* — `challenge1` names no cards and is not a phrase anybody would print — and
the failure mode of an empty pool is a pack that generates nothing, which throws, which I would have
found. The failure mode of the label was a screen quietly saying `challenge1` to a player.

This tree already has the general form of that written down, about a completely different thing: the
week every bonus-jumped Rare rendered hero-sized because `slot: 'rare'` correctly named *which pool
the card came from* and one screen read it as *what role this card plays*. **A field naming ORIGIN is
not a field naming ROLE.** I did not go looking for that sentence; I wrote most of a comment
explaining my new field and then realised I was paraphrasing it. That is the doc tree working, and it
worked by being *read for something else six hours earlier*, which is not a mechanism you can plan.

**The thing I would most want the next session to know is that Trevor corrected the design and he was
right about a bug none of us had seen.** `PACKS.md` had specified the Challenge pool for three weeks
as "built from the sets **the player has unlocked**". That is save state, read at the moment a pack is
opened. He suggested instead that a C1 pack should just *already know* it holds Base, Jungle and
Fossil — which sounds like a simplification and is actually a fix: under the specified version, a pack
won before Team Rocket and opened after it would have contained Team Rocket cards. **Two packs with
the same name would have held different things depending on when you got round to them.** Nobody would
have filed that as a bug. They would have filed it as "packs feel inconsistent" eight months later.

What made it land cleanly is that his answer is still *derived* — a Challenge's pool is every booster
set before it on the ladder — so it kept the property the tree cares about and dropped the one that
was hurting. He said "I'm not a coder or anything like that" on the way in. The correction was
architectural.

Some smaller things, in descending order of how much I would want to know them:

**A green test can go red on correct behaviour, and mine did, inside ten minutes of writing it.** I
asserted no Challenge pack exceeds `ENERGY_CAP` and got 59 violations in 40,000. All 59 were Double
Colorless Energy. `ENERGY_CAP` has never been about special Energy and `packs.js` says so plainly in
a comment I had read that morning. The test was measuring a superset of the thing the cap is about.
I mention it because the shape is `MISREADINGS.md`'s and the reflex it wants is *check the instrument
before the subject* — I did, but only because 59-in-40,000 is too clean a number to be a real bug.
Had it been 3, I might have gone looking in `openPack`.

**Removing Ronald removed the only user of a mechanism, and the tests went with him.** Six assertions
covering `extra` — a working thing the detailing pass expects to use — were all driven off the one
placeholder occupying it. Deleting them was the obvious move and it was wrong: the gap between now and
the detailing pass is months, and a mechanism with no tests and no users does not survive that. They
run against a fixture now. **This is the third time an assertion in `progresstest.js` has expired
because it named whoever happened to be standing in a slot.** Name the position; read the occupant.

**`decksim` is the wrong instrument for this bracket and I nearly quoted it as though it were the
right one.** It says Challenge 1 averages 50.3% against Fossil's 49.5% — a bracket you reach *after*
Fossil, no harder than Fossil. That reads as a damning result and it mostly is not. Seven mono-type
decks in a round-robin measure the type wheel; and more fundamentally, **these seven never fight each
other** — the player brings one deck against all seven. The tool has no player, so it cannot ask the
only question the bracket poses. What it *can* do is spot outliers, and there are two: `c1_fire` at
20.2% is the weakest deck ever measured in this repo, and `c1_water` at 79.0% the strongest. Those are
worth Trevor's eye. The middle four are not a ranking.

**The intended boss came second.** Colorless leads on featureWeight at 21 and Trevor picked it on that
basis, flagging it provisional; Water is 23 points clear of it in play. I did not change it, and I
would push back on anyone who changes it off one run — but the disagreement between the two
instruments is exactly what the second instrument is for, and it should not be allowed to go quiet.

Two housekeeping notes for whoever is next. **`ROSTERS.md` crossed its own ~450 archive threshold and
I did the archive**, at a set boundary as its header asks; the rule worked exactly as written, which
is worth knowing because a threshold nobody has ever tripped is a threshold nobody knows is real.
**`GRABHIST.md` is also over and I did not**, because a job that rolls three registers over on its way
past is running a document pass without admitting it. I put Job 15c's name on it in that file's own
header instead. `HISTORY.md` is at 437 and will go over on the next substantial job.

One last thing, and it is the part I did not expect. The deck data was *completely ready*. Seven
60-card decks, every id resolving, all seven legal on the first try, zero corrections for the fifth
workbook running — sitting in a folder that `DATA.md` described as "genuinely reference-only — nothing
reads it" for eleven days. That sentence was true and it was also the only thing between the file and
a shipped bracket. **A file being unread is not evidence that it is not ready**, and I would go and
look at what else in `data/` is wearing that label.

— #33

## #33 again — Job 15b, the pack odds, and a deck that could not attack (1 Sep 2026)

Three items and none of them was the interesting one.

**The interesting one is that Trevor read a number I published and went and disproved it in an hour.**
The Challenge 1 section said `c1_fire` measured 20.2%, the weakest deck ever recorded here, and called
it a rebuild candidate. He played it. It was running **24 Fighting Energy behind an all-Fire roster** —
in this era's shorthand F is Fighting and R is Fire, and the workbook's label and its id agreed with
each other while both disagreed with every Pokémon in the deck. Twelve of its twenty-one Pokémon could
not pay for a single one of their attacks.

I want to be precise about why nothing caught it, because "add a test" is the boring half.
`validateDeck` passed it and was **right** to: sixty cards, four-copy clean, every card implemented.
**A deck of the wrong Energy is a perfectly legal deck.** And the four previous workbooks all carried a
proud `_meta` line about zero id corrections, earned by a check that every id resolves *and names the
card the sheet names* — which cannot run on Energy rows, because Trevor writes "F Energy" and the card
is called "Fighting Energy". **The verification was skipped precisely where the bug lived, and the
boast was generated by the same pass that skipped it.** That is a nastier shape than a missing test.

The guard I wrote asks: *does this deck field a Pokémon it cannot pay a single attack for?* The unit is
the **card**, not the attack, and that sharpening is the whole thing. My first version flagged any
unpayable attack and caught Team Rocket's Alakazam deck, which plays a Water Psyduck for its `[P]`
Dizziness and never intends to fire Water Gun — a perfectly good choice. A guard that flags good
choices gets switched off. Across all 58 authored decks the sharp version finds Fire and two GBC
placeholders, and Rod's is live: two dead Charizard on Fossil's stand-in intro.

**The other thing worth passing on is what a round-robin does with a broken entry.** It does not
produce one wrong row. Every other deck's win rate included free wins against the deck that could not
attack, so one bad Energy id made **all seven** numbers wrong, and the merged thirteen-deck run on top
of them. Fire went 20.2% → 57.1% and every other Challenge deck went *down*. I re-ran both fields
rather than patching the one row. If you change a deck, re-run the field.

On 15b proper, two calls I made that are one line to reverse:

**I retired an ordering rule instead of preserving it.** PACKS.md said the thing to keep if anyone
retunes is *bonus Rare-tier beats Reverse Holo's per-pack frequency*. Restoring Reverse Holo to its
pre-shrink pacing breaks that in every set. I let it break, because the rule was written while Reverse
Holo was sitting 44% below its own design intent — it was anchored to a number that an unrelated change
had already broken — and because a cosmetic being *more* common than a bonus Rare is the arrangement
anybody would choose on purpose. Preserving it instead needs `jumpUncommonToRare` at ~0.054, which
makes Rares 55% more common and moves set-completion pacing the file says is already right. Flagged in
`PACK_ODDS` in those terms rather than buried.

**Trevor picked the right lever for the Challenge pack and I don't think he knew why.** He suggested
3–4x the jump rate. PACKS.md had a standing warning that richer rarity odds compound with the cosmetic
rolls, so a Challenge pack would silently become the best place in the game to pull a Shadowless — a
side effect nobody chose. **The jump is the one candidate that does not do that.** Shiny, Shadowless
and Misprint roll per slot regardless of what tier the card resolved to, so they are untouched; and a
jumped card is Rare-tier, which makes it ineligible for Reverse Holo, so a Challenge pack is very
slightly *worse* for RH. Measured: 201 Shadowless against 199 in 40,000 packs a side. A holo-rate bump
would not have had that property. It is asserted now, so swapping the lever goes red.

Last thing, and it is the same note I ended the 15a entry on from the other direction. That entry said
a file being unread is not evidence it is not ready. This one adds: **a number being published is not
evidence anybody checked it.** The 20.2% went into three documents with a confident interpretation
attached, and the interpretation was wrong in a way that reading harder would never have fixed —
Trevor had to go and play the deck. The instruments in this repo cannot tell you that the *input* is
wrong. Only somebody sitting down at the thing can.

— #33

---

## #34 — Job 15c, the eleventh documentation pass (2 Sep 2026)

**The thing I would most want the next session to know is that the highest-yield finding in this pass
came from a warning somebody had already written, aimed at exactly the situation that then happened,
and it did not work.**

`OPPONENTS.md` went stale on "four rosters" once, was corrected on 29 Aug, and the correction ended
with an instruction to the future: *"if you add a roster, grep this file for 'four'."* Job 15a added
one. Nobody grepped. Seven sentences still said four, with that file's own Challenge 1 section sixty
lines underneath them. **A warning is only as good as the moment it is read, and the moment this one
needed to be read was inside a different job than the one that wrote it.** So I deleted the counts
rather than correcting them again. `data/ladder.json` is the roll and it cannot go stale.

That generalises past this file and it is the argument for every derived count in this tree. A
correction that leaves a human instruction behind has a half-life. A correction that removes the
thing needing maintenance does not.

### The directory conversion was a measurement, and it should have been one twice before

Trevor asked whether `AI-INVARIANTS.md` wanted to be a directory. The tree had already refused that
exact proposal on the sixth pass and answered it a different way on the eighth, and both refusals
were **right on the evidence they had** — "twenty-three files of eight lines each is worse navigation
than the section was."

I nearly repeated the refusal from memory of the reasoning. What stopped me was going and measuring
the entries: 41–129 lines each, averaging 65, against `Rulings/` at 21–133. The premise had expired
about a fortnight earlier and nothing anywhere re-checks a premise. **A shape decision has an expiry
date and the tree had no mechanism for noticing.** So the measurement went into the header rather
than only the conclusion, which is the only way the next person can tell whether it has expired
again.

**The archives were deliberately not converted**, and holding that line mattered more than it looks:
their entries genuinely are 8–20 lines, so converting them would have recreated the exact shape the
sixth pass correctly refused. The right answer was different for two halves of the same register.

### Three positional references, and one had been wrong since it was written

`MAINTENANCE.md` says to grep for these before a split, and it is right, but the reason it gives
undersells it. Two of the three were ordinary — "the entry above is its other half" — and broke
predictably. The third said *"`T_PLUSPOWER`'s own pattern three lines above it"* and **PlusPower was
below it**. That had been false since the day it was typed and nobody had noticed, because a
positional reference does not look wrong; it looks like a detail you skim. A link that points at the
wrong file is visibly broken. A phrase that points in the wrong direction is invisible.

### I wrote a wrong count into the sentence banning wrong counts

`ENGINE.md` claimed "47 references in `engine.js`". I checked with `grep -c`, got 53, and wrote that
into a parenthetical about how counts in prose rot — and `grep -c` counts matching **lines**. The
occurrence count is 55. I caught it one command later.

I have left that in the file rather than quietly fixing it, because it is a better argument than the
rule it sits under: **the pass actively removing a stale count produced a fresh one inside sixty
seconds**, using the obvious tool, for a claim whose unit it had not checked. There is now no number
there at all.

### Two things I would tell whoever takes 15d

**The suite audit is real and `powertest.js` is where it lives.** 6,572 lines against `smoke.js`'s
2,171 and `selftest.js`'s 727, for 446 assertions — roughly fifteen lines each. Its section headers
show why: it grew an AI-behaviour wing during Job 11, on bespoke fixtures, *before* `claimtest.js`
and `board.js` existed to do that job properly. `TOOLING.md` records the decision to leave those
alone as "a large diff across a green suite to buy nothing", which was correct then and is the exact
thing Trevor has now asked to have re-examined. **Do not start by migrating.** Start by asking which
of those sections still assert something no other suite does.

**And do the audit outside a documentation pass.** The property that makes a docs pass trustworthy is
that `git status` shows nothing under `src/`, `tools/` or `data/` at the end of it. I checked that
after every commit here, and it is the cheapest possible proof that a doc change did not quietly
become a behaviour change.

— #34


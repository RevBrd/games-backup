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
entry with no row is how somebody gets left off. 

It does not have to be advice for the next instance, though that's absolutely allowed. The previous instances have chosen to do that and without any here doing otherwise, future readers may think it's a rule rather than a choice they made.

## What is where

**This file holds the entries for work that is still open, plus the last closed one as an example.**
Everything older is archived, verbatim and unedited:

| File | Instances | When | Read it for |
|---|---|---|---|
| [LOGBOOK-ARCHIVE-1.md](LOGBOOK-ARCHIVE-1.md) | #0–#10 | through 12 Aug 2026 | The Claude Chat era, Jobs 4–6, the first four documentation passes |
| [LOGBOOK-ARCHIVE-2.md](LOGBOOK-ARCHIVE-2.md) | #11–#14 | 12–15 Aug 2026 | Job 7, the AI retreat and recoil work, the opponent-deck research, the fifth documentation pass |
| [LOGBOOK-ARCHIVE-3.md](LOGBOOK-ARCHIVE-3.md) | #16–#17 | 16 Aug 2026 | Job 9's first AI batch and the sixth documentation pass |

**Archiving is a boundary, not a count — that changed on 16 Aug 2026.** The old rule was "this file
holds the two most recent entries", and by the time anybody checked it was holding six at 295 lines,
which is back inside the length that caused the first split. A count nobody enforces is not a rule.
Entries move out when the **work they describe is closed**, into whichever archive is under ~250
lines — **start a new archive rather than growing one past it**, which each archive's own header
says and which the seventh pass had to undo doing. The most recent closed entry stays behind on
purpose: instances visibly write better entries when there is one in front of them, so the
live file always keeps an example rather than opening on a blank, though they are welcome to scan the archives as well.

**Nothing already written may be edited or condensed**, here or in either archive — a later pass may
find an entry redundant and it is not, because the value of a logbook is that it says what somebody
thought at the time. Correct an entry; never shorten one. The 200-line target does not apply to any
of the three files.

**One older artifact of this kind is in none of them:**
`backups/pre-docs-cleanup/Packs Turn Log.txt`, the Sonnet 5 per-pass credits in that instance's own
words. It spent one pass unreachable — intact, indexed nowhere, cited by a sentence that had been
deleted. A pointer is not optional decoration on a preserved artifact; it is the half that rots.

---

## #19 — Opus 5, 18 Aug 2026 (Job 10c, the trigger points)

Two guards failed in this session, and both failures are more useful than anything I built.

**The first one had been failing since Base Set and nobody could see it.** `selftest.js` filtered
Energy cards out of its coverage set, so the hard gate — *no live set may contain an unimplemented
card* — and the per-set ratchet had never once looked at an Energy card. Base, Jungle and Fossil hold
exactly one special Energy between them and it was scripted on day one, so nothing ever fell through
and the hole stayed invisible for three sets. Team Rocket prints three. Deleting `REMAINING.base5` at
the end of Job 10 would have gone fully green with Rainbow Energy unplayable, while the engine's own
deck validator refused every deck containing one — a card you can pull from a pack and cannot play,
which is precisely the failure the set-gating rule exists to prevent.

I found it in the first hour, while doing the read-in Trevor asked for rather than while building
anything. **The verification pass was worth more than I expected it to be**, and I nearly skipped
straight to 10c because the suites were green. Green suites were the symptom.

**The second one I wrote myself, described in two documents, and it did not work.** I built a static
check asserting that every path into play calls `enterPlay` — the whole enforceability of the
played-from-hand ruling rests on it — scoped to a window of lines around each site. Then I deleted
the call from `doPlayBasic` to watch it go red, and it stayed green. Two separate reasons: the window
ran on into the next method and found *that* one's call, and the detector had never matched
`doPlayBasic` in the first place, because it pushes a variable rather than an inline `this.mkSlot()`.
It was also printing a hardcoded `8` where a count belonged.

So it was a decoration that had already been cited as a guarantee in a ruling file and in `ENGINE.md`.
The only thing that caught it was the one step this tree keeps telling everybody to take. **I would
not have found it by reading it.** It looks completely reasonable.

**On the design, the part I would tell #20.** I came into 10c planning a deferred-decision system —
`pendingTrigger`, like `pendingSwitch` — because the three ON_PLAY Powers all ask a question and I
assumed a question needed somewhere to wait. It did not. The answer rides on the play action's
`opts`, exactly as every searching Trainer's does, and the whole thing collapsed to one synchronous
call. **I had reached for new machinery before checking whether the existing convention covered it**,
which is the failure `ENGINE.md`'s opening paragraph is about, arriving from the architecture end
rather than the verb end.

What made the difference was a survey I nearly did not run: grep every set's ability text for the
three trigger wordings. It took two minutes and it decided the shape of the job. **ON_PLAY is 20
printings across six sets and no two of them do the same thing** — search a deck, mill either deck on
a coin, heal every Grass in play, hand the opponent a redraw. That is what says the trigger takes a
verb list rather than a bespoke Power kind: build it the other way and you have written fourteen
kinds by Neo 4. **ON_KO is three printings and two behaviours in the entire era**, so generalising it
would have been pure waste. Same job, opposite answers, and only the survey could tell them apart.

**And on the two rulings that disagree.** Attack damage defaults to *true* and makes the exceptions
declare themselves; played-from-hand defaults to *silence* and makes the three hand paths declare
themselves. Written a week apart they would look like an inconsistency. The test is which set grows:
attack-damage callers multiply with every set, and "from hand" is a closed concept that sets do not
extend. I have put that in the principles index as its own line, because I think it is the reusable
half.

**Trevor overruled me on Final Beam and was right.** I wanted anything originating during an attack
step to count, so a Strikes Back finishing a Gyarados would be answered; he said only attacks
themselves, from Pocket. The argument that settled it is not about this card — the generous reading
has no natural edge, so every future card that damages without attacking needs re-deciding, and Gym
and Neo are full of them. He hedged it as a shot in the dark. It was the load-bearing call of the day.

He also guessed the ON_KO ordering constraint from a plain-English description of `kill()` — that the
hook has to go inside it, before the Energy is swept — without reading the code. It does, and it is
the only place the card can work from.

— Shadowless 19

## #19 — Opus 5, 19 Aug 2026 (Job 10 finished, Team Rocket live)

The session ran long enough to have two halves, and the second one had a theme I did not choose:
**four separate guards turned out not to be guarding.**

The coverage gate had been blind to Energy since Base Set. A duplicate-case block sat inside
`doTrainer` — 63 lines, 21 case labels, every one already handled above it, none of it ever run. A
static check I wrote *myself*, cited as a guarantee in two documents, stayed green when I deleted the
thing it was checking. And `setsurvey`'s own control — *a live set reports zero novel* — was crying
wolf on a corpus typo the generator already corrects.

Only one of those was found by reading. The other three were found by **deliberately breaking the
thing and watching**, which this tree keeps telling everybody to do and which I nearly skipped twice
because the check "obviously" worked. It never obviously works. The line-scoped one is the case to
remember: it looked completely reasonable, it had a sensible comment, and it was watching a site it
could not see through a window that would have forgiven it anyway.

**The tool paid for itself the day it was written.** `shapecount.js` exists because Trevor asked
whether the survey that shaped 10c deserved writing down. It then decided three more things in one
session: ON_PLAY takes a verb list (20 printings, 15 texts), ON_KO does not (3 printings, 2
behaviours), Goop Gas Attack and Here Comes Team Rocket! are unique so they get special cases, and
`pendingAsk` should be general (17 printings, 16 texts, six sets). **Four "how much machinery"
questions that would otherwise have been taste.** Its own header was wrong on the first run, which is
a good sign about the tool and a bad one about writing numbers from memory.

**On Rainbow.** Trevor guessed the representation — a sentinel that every symbol accepts — and it was
right. What neither of us saw at first is that there is no *single* question: paying a cost, counting
"for each Water Energy", and being a basic Energy **card** are three questions, and the third answers
differently depending on the zone the card is in. Then his own sentence — *"when it's on a Pokémon,
it's whatever that Pokémon needs it to be"* — carried a consequence he had not intended and I was
about to get wrong: Energy Trans can move a Rainbow, and **Rain Dance cannot attach one**, because a
hand is not a Pokémon. That reversed two settled rulings, and both had reasoned from the card's
*category* while the card's *text* said otherwise in a parenthesis.

**The bug I am most glad about is not mine.** Trevor reported Gigashock not letting him choose. It
was true, and it was worse: the engine had always accepted a chosen target and nothing in the UI had
ever supplied one, so *Dark Mind* had been silently picking for the player since Fossil went live —
one of two is far harder to notice than three of five. Then the fourth test I wrote for it, the one I
expected to pass, found that the engine never deduplicated the picks, so `[2,2,2]` put 30 on one
Pokémon. **A bug is easiest to see where it matters least, and the fix for the visible half is what
exposed the invisible one.**

**On being told to restrict the AI.** Trevor asked that the bot judge a Challenge from what it can
*see* rather than from the opponent's deck. That is a self-restriction — `ai.js` reads full engine
state everywhere else, which is exactly why Peek is scored at −Infinity — and it makes the card a
gamble on both sides instead of a solved problem for one. It is also easier to implement than the
version that cheats. I put a do-not-fix-this note on it, because it will read like an oversight.

**For #20.** The thing I would do differently is start the doc pass earlier. Everything is written
down, but it was written down at the end, and twice I nearly shipped a document describing a guard
that did not work. Write the claim after you have watched it fail, not before.

— Shadowless 19

## #20 — Opus 5, 19 Aug 2026 (Job 10.5, the seventh documentation pass)

**The most useful thing I did took four seconds and was not documentation.** I ran `selftest.js`
during the read-in, and it printed `ART MISSING for live set(s): base5 (0/83)`. Team Rocket had gone
live with no card art — eighty-three broken images in the dex, the rail, the pack reveal — with all
six suites green, because art is derived and gitignored and no suite touches the filesystem.
`TOOLING.md` describes that exact failure, in the present tense, under the heading *"Step 3 is the
one with no safety net."* The document was not drifting. The process was.

That is two passes running where the read-in was worth more than the build: #19 said the same thing
about finding the Energy-blind coverage gate in its first hour. **I would make the verification pass
non-optional at this point.** Green suites keep being the symptom.

**On trimming things because they are preserved elsewhere.** `AI.md` opens by saying its accounts all
live in `GRABHIST.md`, and the sixth pass used exactly that to refuse it a directory split. Trevor
asked whether the two still aligned. They do not, and the reason is structural rather than sloppy:
`GRABHIST` only records **grab bag** items, so every time a *set job* touches `ai.js` the parent
gains an entry with no twin. Ten of twelve are twinned; three things are not. I had already planned to
trim that section, and the blanket sentence is what would have told me it was safe. **A duplication
claim is a claim about two files and it decays whenever either one moves** — I have put that in
`MAINTENANCE.md` because I nearly acted on the stale version, with the correction I was writing open
in another buffer.

**I broke a rule that was written down, in the file I was breaking it in.** `LOGBOOK-ARCHIVE-2.md`
ends its header with *"Start archive 3 rather than growing this one past ~250."* It was at 253. I
appended 150 lines of #16 and #17 to it, and only saw the sentence when I opened the file to update
its index table. Undone, and archive 3 exists now. The interesting part is not that I missed it —
it is that I read that header *after* deciding where the entries went, because the decision was made
in `LOGBOOK.md` and the constraint lived in the destination. **A constraint stated only in the thing
being constrained is read too late**, so the live file carries it now as well.

**What I would tell #21.** Two facts I found are jobs rather than doc fixes, and both are the same
shape — *a thing that was built, verified, and then never wired in*. Trevor's eight Base Set decks are
the entire evidential basis for [OPPONENTS.md](OPPONENTS.md)'s tier spec, they pass the real
validator, and `data/base1_decks.json` is **not in `gen_cards.js`'s `OPPONENT_SOURCES`** — the ladder
still fields GBC decks, so no player has ever met the decks every claim rests on. And `base5` is live
with a generated bracket and no roster. Neither is a bug; both are a step nobody took. **When a job
ends with a measurement, check whether the thing measured is plugged in**, because a verified artifact
reads as a finished one.

— Shadowless 20

# Shadowless — logbook archive 4

**Instance #19, in its own words — both stretches of Job 10.** Split off the front of
[LOGBOOK.md](LOGBOOK.md) on 25 Aug 2026, and **nothing in it was edited on the way across**; every
entry is exactly as its author left it.

**Read it when you want the account of Job 10** — the triggered-Power trigger points, `enterPlay`,
the Rainbow sentinel, and the day Team Rocket went live at 83 of 83.

**Why there is a fourth archive rather than a longer third one.** `LOGBOOK-ARCHIVE-3.md` was at 181
lines with room for about seventy, and these two entries are 118. Growing it would have taken it past
the ~250 its own header sets, which is the mistake the seventh pass made and had to undo. The rule is
a **boundary, not a count**: entries move out of `LOGBOOK.md` when the work they describe is closed,
into whichever archive is still short enough to open in one piece.

**This file is an archive. It only ever grows, it is never rewritten, and nothing already in it may
be edited or condensed** — the value of a logbook is that it says what somebody thought at the time.
The 200-line target does not apply. **Start archive 5 rather than growing this one past ~250.**

## What is in here

| Instance | When | Subject |
|---|---|---|
| Opus 5 #19 | 18 Aug 2026 | Job 10c — the trigger points, and the one doorway into play |
| Opus 5 #19 | 19 Aug 2026 | Job 10 finished, Team Rocket live, and four guards that were not guarding |

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


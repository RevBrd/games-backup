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
| **this file** | #20–#26 | 19–25 Aug 2026 | Job 10.5 through Job 12c |

**Six of the entries below are PRESERVED CREDIT PROSE rather than logbook entries, and they say so.**
#21 through #26 wrote no logbook entry, and their `CREDITS.md` rows had grown to between six and
twenty-four lines each — so the eighth-pass rule applies: **where an instance has no logbook entry,
the row's text moves here verbatim first, and only then is the row written short.** Do not decide
sentence by sentence what earned its place. Moved 26 Aug 2026 by #27. **They are somebody's account
of their own work and are covered by the never-condense rule exactly as an ordinary entry is.**

**One older artifact of this kind is in none of these files:**
`backups/pre-docs-cleanup/Packs Turn Log.txt`, the Sonnet 5 per-pass credits in that instance's own
words. It spent one pass unreachable — intact, indexed nowhere, cited by a sentence that had been
deleted. A pointer is not optional decoration on a preserved artifact; it is the half that rots.

---

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

## #21 — Opus 5, 21 Aug 2026 (Job 11 — the Jungle and Fossil brackets, and the benchmark deck)

*Preserved from `CREDITS.md` on 26 Aug 2026 by #27, when that table was returned to its
two-or-three-line rule. This is that row's text, unchanged — only the line width is this
file's rather than a table cell's. It was written by #21 about its own work and is the only
first-person account of it that exists.*

Job 11: Trevor's five Jungle decks wired in as a full bracket, the GBC placeholders moved down a
set, and every bracket ended in its own T4. Three AI faults from his logs — retreating into the
wrong matchup, Teleport's flat 22 and the destination the engine was choosing at random, and a
`must be 0` counter that was counting the wrong thing. `decksim.js` learned to merge two rosters
and said the second one does not order. Then Trevor named the Charizard deck as ground truth,
which gave the project its first real measure of AI quality, and two retreat repricings off his
economics cut Energy burned on retreats by a quarter. Then his account of how he plays Charizard
turned up two more — the bot capped it at four Energy and the engine discarded its Double
Colorless first — worth +5.3 points on the benchmark, the largest single AI move so far. Fossil's
six decks wired the same day, and [PLAYBOOK.md](PLAYBOOK.md) opened for the plain-English card
knowledge that produced all of it

## #22 — Opus 5, 22 Aug 2026 (the playbook reshaped around the pattern, and four faults out of one sentence)

*Preserved from `CREDITS.md` on 26 Aug 2026 by #27, when that table was returned to its
two-or-three-line rule. This is that row's text, unchanged — only the line width is this
file's rather than a table cell's. It was written by #22 about its own work and is the only
first-person account of it that exists.*

Reshaped [PLAYBOOK.md](PLAYBOOK.md) around the **pattern** rather than the card, after all four of
its entries generalised to a family — and found Trevor had already written the list, 65 cards
deep, in his workbook's `Wants` column. Then worked the largest cluster, from his observation that
paralysis and an Agility barrier are one idea the scorer was pricing through unrelated paths. Four
faults, none visible to any suite: a rider paid for on a Pokémon the attack removes, a barrier
blind to what it was blocking, a bought turn priced as a constant when that constant *was* the
format's mean attack, and preventing your own death worth 16 against the 70 charged for causing
it. Plus `abtest` telling anyone who ran a control that their control looked broken

## #23 — Opus 5, 22 Aug 2026 (the eighth documentation pass)

*Preserved from `CREDITS.md` on 26 Aug 2026 by #27, when that table was returned to its
two-or-three-line rule. This is that row's text, unchanged — only the line width is this
file's rather than a table cell's. It was written by #23 about its own work and is the only
first-person account of it that exists.*

The eighth documentation pass. Five siblings split out — [AI-INVARIANTS.md](AI-INVARIANTS.md),
[MISREADINGS.md](MISREADINGS.md), [POWERS.md](POWERS.md) and the first archive of both
`GRABHIST.md` and `HISTORY.md`, each of which had sailed past the ~450 rule written in its own
header. Found `AI.md`'s "the accounts are all in `GRABHIST`" wrong for the **third** time and
replaced the sentence with a table, `MEASUREMENT.md` promising "all seven" ways it lies in a file
whose own section says never to count them, and `PROGRESSION.md` narrating one roster move four
times while two tellings disagreed. Nine decks given the cover cards they were missing

## #24 — Opus 5, 23 Aug 2026 (Job 12a — the claims harness, and the inbox that was three times its assumed size)

*Preserved from `CREDITS.md` on 26 Aug 2026 by #27, when that table was returned to its
two-or-three-line rule. This is that row's text, unchanged — only the line width is this
file's rather than a table cell's. It was written by #24 about its own work and is the only
first-person account of it that exists.*

Job 12a's infrastructure half. Built the harness the playbook method had been missing:
`tools/lib/xlsx.js` reads Trevor's workbook with no dependencies, `tools/wants.js` reports the
inbox and the backlog, `tools/lib/board.js` builds a position out of card **names** against the
twenty-nine bespoke fixtures that were the real bottleneck, and `tools/claimtest.js` runs the
notes as rows — with an `--explore` mode, because every measurement in `ATTACK-CHOICE.md` came
from a throwaway script that no longer exists. **Proved it can fail** against the commit before
the 22 Aug bought-turn work, where the Dewgong and Gyarados rows go red with the numbers that file
recorded. Found the inbox was three times the size anyone thought — a stale workbook had hidden
Team Rocket's 59 notes and Base Set's rewritten 43 — and turned up two candidate faults on the
first eleven rows: Zapdos and Arcanine. Then closed both with one term out of two guesses Trevor
sent about two different cards — an Energy discard now costs **turns of silence**, squared and
discounted by whether the Pokemon lives to feel them, so Charizard fires free on ammunition it
will replace and Thunderbolt is priced out of a healthy Zapdos and back in the moment it is dying.
It reversed a 14 Aug assertion, the first in this project to overturn another. Then the first
claims batch — twelve of Trevor's notes as 19 rows — where two more of his notes landed on one
term nobody had looked at: **every status rider in the game scored the same against a clean target
and an afflicted one**, so Toxic was worth 44 against something it could not affect. Derived per
status from what the engine does, which exempts Paralysis because it refreshes its own timer. A
second batch of twelve more notes then found **no new faults and that was the point** — Tangela,
whose note names Nidoking's reasoning, passed cold on a card nobody had touched, which is the
general-scorer rule measured rather than asserted. Then his overhauled workbook landed at 219 live
notes and the tool read it cold — a **drift check** added so a claim quoting a sentence he has
since rewritten cannot keep silently passing, and a survey finding **36 Trainer notes**, a
category none of the sixteen patterns names. The first Trainer probed found the entry above; the
second passed and sent a GRABBAG item back for a real board

## #25 — Opus 5, 23 Aug 2026 (Job 12b — the shifting board, and the pack odds that were fine)

*Preserved from `CREDITS.md` on 26 Aug 2026 by #27, when that table was returned to its
two-or-three-line rule. This is that row's text, unchanged — only the line width is this
file's rather than a table cell's. It was written by #25 about its own work and is the only
first-person account of it that exists.*

Job 12b's layout half. The last of the shifting board, from Trevor's own diagnosis: the centre
line is the mat's only shrinkable item and therefore its **shock absorber**, and the Knock Out
banner and targeting prompt sat in its normal flow — so either one stopped it absorbing and
rescaled the whole board, at cramped viewports only. Then the opening-setup Active, where a
five-class selector had also beaten its own placeholder's height and the row jumped 73px on
placing a Basic. Then the booster reveal, where three separate things — an unreserved ribbon, a
Rare whose face-down back was a common's height, and a summary line arriving with the last flip —
compounded into the header climbing 61px, and the setup Active given the read-only attack lines
its empty bottom half had been missing. Built `tools/probe.js`, which measures one screen across
several UI states in one page load and is the instrument neither `shot.js` nor `smoke.js` could
ever be — #20 built the same thing and threw it away. Then the first UI item rather than a fix:
**the opponent's Trainer held on the centre line for a beat**, which stayed small because it is a
stop in the coin's presentation queue rather than a new mechanism, and a turn ending with no
attack finally getting a line of its own. Then a pack-odds report that was luck twice over — but
only provable after finding that the 200,000-pack suite covered one live set of four and had never
used the fresh-per-pack RNG the game runs on. `pullcheck.js` answers it from a real save

## #26 — Sonnet 5, 25 Aug 2026 (Job 12c — the 8-card pack, the tier jump, and the Team Rocket bracket)

*Preserved from `CREDITS.md` on 26 Aug 2026 by #27, when that table was returned to its
two-or-three-line rule. This is that row's text, unchanged — only the line width is this
file's rather than a table cell's. It was written by #26 about its own work and is the only
first-person account of it that exists.*

Job 12c: the pack shrank from 11 cards to 8 and a lesser slot can now jump to a better tier at a
small independent chance, tuned across three drafts with Trevor to land above Reverse Holo's own
rate without a formula that hid the Energy floor quietly excluding itself from it — flagged
instead. Restoring the four cosmetic axes' pre-shrink pacing deliberately deferred, tracked in
`PACKS.md`. Then the Team Rocket bracket: eight decks converted from Trevor's workbook into
`base5_decks.json`, the two authentic Team Rocket theme decks freed of their `base4` dependency by
substituting each reprint for its identical live-set printing, and the eight GBC club masters
retired rather than moved on, since no unauthored bracket remained for them. First roster whose
tiers ordered cleanly on the first `decksim.js` run — which only ran clean after three PROVISIONAL
Power-scoring cases turned out to reference a `me` `scorePower` never defines, crashing the
instant a deck actually held one of the three Powers. Nobody had ever reached that code before


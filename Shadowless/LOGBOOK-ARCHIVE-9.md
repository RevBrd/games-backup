# Shadowless — logbook archive 9: Job 15f

**#38, verbatim.** Job 15f — `wants.js` moved onto Trevor's live Google Sheet, and the drift check
that grades a changed note instead of just flagging it. Moved here on 15 Sep 2026 by Shadowless 41,
**before** appending #41 rather than after, which is the ordering archive 7 was created to establish
and archive 6 was created by breaking.

A small archive on purpose. Archive 8 stood at 342 lines and #38's entry is 129, which would have put
it at 471 against the ~450 in its own header — and the rule in [LOGBOOK.md](LOGBOOK.md) is to start a
new archive rather than grow one past its limit. **Archiving is a boundary, not a count.**

[LOGBOOK.md](LOGBOOK.md) is the live file and carries the roll of every archive. `CREDITS.md` is the
short version of who did what, and every row in it links to the live file rather than to an archive
— a row naming an archive rots the moment its entry moves, and three of them had.

---

## #38 — Job 15f, the live inbox (7 Sep 2026)

Trevor asked for `wants.js` to read the live Drive workbook instead of the newest hand-made export,
and to be easier on my own context while doing it. Both landed, but the interesting part was neither.

**The tool built to prevent a stale read had been making one for eleven days.** Newest local export:
Team Rocket, 24 Aug. Live Team Rocket sheet: edited 4 Sep. And a whole Gym Heroes workbook — 126
`gym1` rows on top of the same 339 — that existed only on Drive with no local copy at all. Every run
printed `workbook: Team Rocket Opponent Decks v1 (2026-08-24)` and `4 older not read`, which was
completely true. **Being honest about the wrong file is still being wrong.** The rule ("newest by
modification date") was never faulty; it simply stopped describing where the newest thing lived, and
nothing in a rule can notice that about itself.

Fixing the source added **19 live notes** the project had never seen, and turned up **122 `gym1`
notes** already written and waiting for Job 16.

**Three facts about the source decided the whole design, and two of them were the opposite of what I
expected.** I assumed a conditional GET: the published CSV sends **no `Last-Modified` and no
`ETag`**, only `max-age=300`, so HTTP cannot tell you whether a sheet changed and can be five minutes
behind an edit. I assumed the Drive-mounted `.gsheet` stub could be read for its `doc_id`, as
`machine.md` says: on `G:\` it cannot — `EISDIR` in Node, `Incorrect function` in both shells — and
only the checked-in copies on `C:` work that way. But **the stub's mtime tracks the live document to
the millisecond**, verified against the Drive API. So the thing that looked useless is the freshness
signal the whole module runs on, and it is free and works offline. I corrected `machine.md`.

**The cache is not a compromise, it is a requirement, and I nearly missed why.** `progresstest.js`
reads the same Index tab as a drift guard on `PROMO_GATES`, and it is **in the gate**. A suite that
fetches is a suite that fails on a train. So `readIndex()` is pure filesystem, `syncIndex()` is the
only thing in the project that opens a socket, and the snapshot is committed so a fresh clone can run
`node tools/test.js`.

**The gate then caught a real edit within a minute of being pointed at live data.** Trevor removed
the Ancient Mew row; `basep` went 29 → 28, and the assertion pinning "exactly one gated promo has no
card in the corpus" went red. That is the guard working exactly as its own comment promises. I
updated the assertion to 0 and **kept the escape hatch** rather than deleting it, because filing a
note ahead of its card is a normal thing for him to do again.

**The part I would tell the next session about is the drift check.** Pointed at live data it fired
nine `!!` lines where the stale read fired nine identical-looking ones, and **only one was a real
rewrite.** My first instinct was a similarity threshold, and that would have been wrong. I measured
the corpus instead: across all 142 claims the `note` field holds **four different things** — 127
verbatim cell quotes, 4 marked `(...)`, 9 opening with a source label and citing something that is
not the cell at all, and 2 that are the cell text with a later remark appended after a ` / `. Reading
that convention sorts them exactly. A cutoff would have sorted them approximately, forever.

So it grades now: `!! REWRITTEN`, `!! ORPHANED`, `+ EXTENDED` (he *added* a clause — the claim is
still true, there is just more to cover), `? UNQUOTED` (the claim cites a playtest rather than the
cell, and the cell now has a note nobody has checked it against), and a quiet `· touched` for
punctuation. Nine undifferentiated alarms became four graded lines. **A detector nobody trusts is a
detector nobody reads**, and Chansey's note going from six words to a paragraph was arriving
invisible in the middle of the noise.

**One thing I got wrong and it is worth naming because it is a tooling habit, not a mistake about the
project.** I ran the original `wants.js` with `tail -20`, saw three warnings, and told Trevor the
count had gone from three to nine. It had always been nine; I had been reading the bottom of the
output. I only found it while chasing a phantom bug in my own fallback path. **When you are about to
report a delta, make sure both halves came from the same window.**

**And `xlsx.js` is deliberately still alive.** `--xlsx` reads the old exports and is its only
remaining caller. It is the fallback if the publish is ever revoked, and keeping it wired to a flag
somebody might actually run beats leaving 200 lines to rot unnoticed.

**Then I worked two of the six rows the tool had just surfaced**, which is the point of building it.

**Chansey's note had tripled and the one claim covered a third of it.** *"Power up Scrunch and then
tank"* became *"To work as a tank or staller, hiding behind Scrunch and rarely ever retreating or
using Double-Edge"* — three clauses. The retreat one passes: a hurt Chansey with a fresh Hitmonchan
benched and the retreat affordable stands anyway.

**The attack clause is a pair, and my first draft of it was the trap `PLAYBOOK.md` names out loud.**
I wrote it against a 70 HP Hitmonchan, it went red, and the bot was right — Double-edge deals exactly
80, so it was a guaranteed Prize. **Trevor's word is "rarely", not "never", and lethal is the whole
of the exception.** Re-cut against a 90 HP Kangaskhan it scores −15.11 and Scrunch wins. Both boards
are asserted now, because one row can only ever say *"Chansey attacked"* and the board decides what
that means. I had read that warning twice this session before walking into it.

**Raichu's `+ EXTENDED` line found a real gap, and it is the best argument for the grading I built
an hour earlier.** Under the old binary check it would have been one `!!` among nine and I would
almost certainly have skimmed it. Trevor had added *"Agility buys turns through damage **and status**
denial on a coin flip."* The status half is worth **zero**, by construction rather than by a bad
weight: `denied = Math.min(incomingThreat, hpLeft)`, so a barrier against something that would
paralyse prices identically to one against something that would only hit. Exactly, not
approximately — Electabuzz and Machop at threat 40 both score Agility 35.75.

**`ai.js` says it itself without noticing:** *"TWO TERMS BECAUSE THERE ARE TWO THINGS BEING
PREVENTED"*, and both of them are damage.

**I did not build it, and the restraint is the finding.** The barrier already denies their whole turn
when the flip lands, so the damage term collects most of the value by accident and the true increment
is only the status that would have *outlived* that turn. Pricing that means reaching for the status
weights — and open item 5 says Sleep is currently valued by three methods that disagree. **Adding a
second consumer of a number three methods disagree about is how a wrong weight becomes load-bearing.**
So it is an `open:` row with the measurement attached and AI.md item 14, appended without renumbering.

**Left for whoever is next:** the five `? UNQUOTED` rows — Hitmonchan, Moltres and three Drowzee
claims that cite Trevor from elsewhere while their cells now carry proper notes nobody has read
against them. `PLAYBOOK.md` jobs, not tooling ones.

**Postscript: I worked those five too, and none of them was what the warning implied.** Hitmonchan's
clause was *already satisfied* — "only power up Special Punch if the bench has nothing better" reads
like a gate and is a comparison, and the bot has always ranked attach targets against each other.
Trevor's own verdict was that his sentence was wrong, not the bot: *"It read as a gate because it was
written as one when I originally wrote it… my original claim was wrong."* Drowzee's multi-copy clause
was correct and already worked — `powerSpent` is per SLOT, so two Drowzees are two flips. Moltres's
claims were fine and its cell simply had two more consumers in it.

**Which means the detector's real yield here was not faults.** Five rows, zero bugs, and two things
worth more than a bug: a doc item closed (open item 12, which rested on that same mis-phrased
sentence) and a structural gap nobody was looking for.

**The gap: `ai.js` had never read the opponent's deck.** `deckRisk` reads ours and `deckLoss` prices
running ourselves out; the mirror image — they draw every turn, and if we are standing when they
cannot, we win — was invisible. **The reason it was invisible is the transferable part: a turn passing
is progress toward that win and it is not an action.** An action scorer has nothing to attach it to.
Any win or loss condition that ticks on its own is invisible here by construction rather than by
oversight, and I have not seen that shape named anywhere else in this folder.

Built as a floor on what a turn is worth, measured at 3.4% divergence with the win rate unmoved, and
the larger half — risk aversion while the clock runs — deliberately left out so a first unmeasured
weight could be judged alone.

**What I would tell the next session.** The grading I added to the drift check paid for itself twice
in one evening, and neither time by finding a bug. Under the old binary output all nine lines looked
identical; the two that mattered were an `EXTENDED` and a set of `UNQUOTED`s, both of which I would
have skimmed. **The value of a detector is not how much it catches, it is whether you still read it
on the ninth alarm.**

— #38


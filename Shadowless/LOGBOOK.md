# Shadowless — the logbook

What each instance did, in its own words. [CREDITS.md](CREDITS.md) is the short version — who worked
on what, and when. This is why.

## How to add an entry

**Writing here is completely optional.** A `CREDITS.md` row with no logbook entry is a complete
record. A logbook entry with no row is how somebody gets left off, so take the row either way.

Do not worry about fitting your own entries or addendums under any line limits. Future sessions can organize and archive, you don't need to feel constrained as to what to write.

**Append at the END, by anchoring on the end — never by rewriting the file.** `>>` is safest; a
targeted insertion after the last entry's `— #NN` line is fine. Reading the file and writing back a
version you assembled is what has gone wrong: an entry once landed in the middle of another's,
because the end of the file had been summarised out of view.

Say what you did, what surprised you, and what you would tell the next session. Length is yours.
Sign your session number.

## Keeping it — for a later pass, not for whoever just wrote

**This file is an append-only register, and so is every archive of it.** Correct an entry that turns
out wrong; never shorten or condense one — the value of a logbook is what somebody actually thought
at the time. The 200-line target does not apply.

**~450 lines is an archiving trigger and never an entry-size limit.** It is addressed to whoever
arrives next. When it trips:

- move entries whose work is **closed**, whole and verbatim, into the newest archive with room —
  **start a new archive rather than growing one past its own ~450**
- **archive before appending your own entry, not after** — the reverse has breached the limit in the
  same commit that was enforcing it
- **leave the most recent closed entry here**, so the file opens on an example rather than a blank;
  instances visibly write better entries with one in front of them

~450 sits inside the truncation zone on purpose — Trevor, 3 Sep 2026: mildly truncated but workable,
in exchange for more recent history live. If you need an entry in full, it is in git.

*[How each rule was paid for →](DOC-DRIFT.md)* · *[this header as it read before 16 Sep 2026 →](HISTORY-ARCHIVE-3.md)*

## What is where

| File | Instances | When | Read it for |
|---|---|---|---|
| [LOGBOOK-ARCHIVE-1.md](LOGBOOK-ARCHIVE-1.md) | #0–#10 | through 12 Aug 2026 | The Claude Chat era, Jobs 4–6, the first four documentation passes |
| [LOGBOOK-ARCHIVE-2.md](LOGBOOK-ARCHIVE-2.md) | #11–#14 | 12–15 Aug 2026 | Job 7, the AI retreat and recoil work, the opponent-deck research, the fifth documentation pass |
| [LOGBOOK-ARCHIVE-3.md](LOGBOOK-ARCHIVE-3.md) | #16–#17 | 16 Aug 2026 | Job 9's first AI batch and the sixth documentation pass |
| [LOGBOOK-ARCHIVE-4.md](LOGBOOK-ARCHIVE-4.md) | #19 | 18–19 Aug 2026 | Job 10 — the trigger points, `enterPlay`, and Team Rocket going live |
| [LOGBOOK-ARCHIVE-5.md](LOGBOOK-ARCHIVE-5.md) | #20–#26 | 19–25 Aug 2026 | Jobs 10.5 to 12c — two documentation passes, the Jungle and Fossil brackets, the claims harness, the 8-card pack |
| [LOGBOOK-ARCHIVE-6.md](LOGBOOK-ARCHIVE-6.md) | #28–#32 | 26 Aug – 1 Sep 2026 | Jobs 13 to 14b — the promos and their reachability, the tenth documentation pass, the Over-Attach pattern |
| [LOGBOOK-ARCHIVE-7.md](LOGBOOK-ARCHIVE-7.md) | #33, #34 | 1–2 Sep 2026 | Job 15a's Challenge bracket and Job 15b's pack odds — including the legal deck that could not attack — and the eleventh documentation pass |
| [LOGBOOK-ARCHIVE-8.md](LOGBOOK-ARCHIVE-8.md) | #35, #36, #37 | 2–5 Sep 2026 | Job 15d's suite audit and `owed.js`, and Job 15e in both halves — the GBC 2 seam, then the attack road |
| [LOGBOOK-ARCHIVE-9.md](LOGBOOK-ARCHIVE-9.md) | #38, #39, #40 | 7–14 Sep 2026 | Job 15f's live Google Sheet and graded drift check, round one of Job 15g and `doccheck.js`, and the whole of Gym Heroes |
| **this file** | #41, #39 – | 15 Sep 2026 – | Job 17a's review of Gym Heroes, and round two of Job 15g |

**#15, #18 and #27 wrote no entry and are not missing.** **This table is the only roll of the
archives**; anything else that lists them by hand falls behind it.

**Two preserved artifacts are easy to lose.** #21 through #26 wrote no entries, so their long credit
rows moved whole into [LOGBOOK-ARCHIVE-5.md](LOGBOOK-ARCHIVE-5.md) before `CREDITS.md` was shortened.
And `backups/pre-docs-cleanup/Packs Turn Log.txt` holds the Sonnet 5 per-pass credits in that
instance's own words. **A pointer to a preserved artifact is the half that rots** — if that file
moves, this sentence moves with it.

---

## #41 — Job 17a, the post-set quality pass (15 Sep 2026)

Trevor asked for a quick review of Job 16 — "not necessarily fully detailed, more like checking for
anything obvious that might have been forgotten or need a rewire" — before moving on to AI work. Four
things had been forgotten and they turned out to share a shape, which is the only part of this worth
your time.

**Everything I found, I found by following a sentence somebody else left.** Not one came from reading
code looking for bugs. That is a fact about this tree rather than about me, and it is the reason to
keep writing the sentences.

## The shape: a deferral whose reason was a CONDITION, not a DECISION

**`SCREENS.md` said four gym1 pickers "CANNOT BE LOOKED AT YET", because gym1 was not live.** That was
completely true when written on 9 Sep. gym1 went live on the 14th. Nobody edited the section, because
nothing happened *to* the section — **the sentence stopped being true without anybody touching it**,
and it goes on reading like a live exemption. Seven panels now, only Recall looked at.

The same day produced three more of the same kind:

- **`CLAUDE.md` said 21 of 28 promos are reachable.** It is 23. Two lines below it says to derive the
  number rather than trust it, *and gives the reason*: "Job 15a moved it and two files did not
  notice." Job 16 moved it again and the same two files did not notice again. The instruction was
  right, present, and unrun.
- **`wants.js` held a hand-written array of the four live set codes** under a comment about which sets
  "the game actually gates open". All **122 gym1 notes** stayed filed as "not live", so `--coverage`
  reported a backlog of 238 when it was **360**. It now asks `progress.liveSets()`.
- **`PROGRESSION.md` said "three of the eight keys name brackets that do not exist"**, counting gym1.

**None of these is carelessness and all four are the same mechanism.** A statement conditioned on the
world stays in the file after the world moves, and nothing in the file can notice. #38 wrote the
sharpest version of this a week ago about `wants.js`'s own freshness rule — *"the rule was never
faulty; it simply stopped describing where the newest thing lived, and nothing in a rule can notice
that about itself"* — and then the next set going live did it to four more files at once. **The set
going live is the moment to re-read whatever was parked on "the set is not live."**

The `wants.js` one has an extra lesson and it is the nastier half. An earlier pass had patched `gym1`
into the tool's **display** list while leaving it out of the **predicate**, so every run printed a Gym
Heroes row reading `122 notes / 0 live`. The tell was on screen the whole time and read as fine.
**Half a fix is worse than none**: the row appears, so the set looks counted, and nobody reads the
second column.

## The Stadium had no UI at all

Seven Gym cards, a board-wide rule rewriting bench size, retreat cost, Resistance, a Trainer toll and
attack damage — and grepping `ui.js` and `style.css` for "stadium" returned nothing. Visible only as
one log line when it landed. Nothing anywhere recorded it as deferred.

**What kept it hidden is a sentence in `ENGINE.md`**, which described a mis-wired Gym as one that
"plays, installs, **shows on the board** and does nothing." Everything else about Stadiums was built
to that file's usual standard, so the phrase read as description. **A doc describing a thing as
visible is the last place anybody looks for the reason it is invisible.**

Trevor's call was the rail rather than the mat, and his reasoning is better than mine was: the mat is
a sizing change and sizing is Job 18's entire subject, so a placeholder now costs nothing and a mat
version costs a fight with three documents' worth of resize machinery. It is registered in
`SCREENS.md` as a placeholder **with a named successor**, which is the thing that makes it a
placeholder rather than a gap.

Two things in it worth stealing. It sits **between the tabs and the rail body**, so it survives the
tab you are on — a Gym rewrites rules you need while reading the LOG, not rules you go to a tab for.
And what it says is **derived from the descriptor**: the engine already reduces seven cards to five
rule kinds plus parameters, and a second table keyed by card id would fall behind the first reprint.
Gym Challenge reprints several of these.

## Two guards, one of which was being claimed

**`benchCap()`'s comment read "a selftest assertion keeps the twelfth caller from reading cfg
directly."** There was no such assertion. Nine direct reads outside the engine — five in `ai.js`, four
in `ui.js`. The engine was clean throughout, which is exactly why it survived: the doorway worked, and
everyone who walked around it was in another file.

**A claimed guard is worse than an absent one**, because the next person to write a bench-room
calculation reads the sentence and stops. This tree's standing diagnosis is *a correction that leaves
a human instruction behind*; this is that one step earlier — an instruction that was never true.
**Grep the symbol, not the file.**

The second: **two of the seven Gyms scored a flat zero to play.** `T_STADIUM`'s if/else chain priced
five kinds; Celadon and Vermilion fell off the end of it. That is the unscored-verb surface one level
down — not a verb with no `case`, but a `case` with no branch for half its parameters, which is
*quieter*, because anybody checking "does `ai.js` know about `T_STADIUM`" gets a yes. Celadon is the
sharp one: its *use* was properly scored in `scoreStadiumAction`, so the bot knew what the Gym was
worth once it was down and had no idea whether to put it there.

Both guards were **watched going red before being trusted**, and both name the offending symbol.

## The Jynx thread, which paid out somewhere else entirely

Trevor flagged that he had rewritten the Sabrina's Jynx note and might have talked #40 out of a
correct position on sleep sequencing. He had, #40 had already corrected it, and `tools/claims/gym1.js`
says so in its own header. **Nothing to undo — but I derived it from the engine anyway rather than
taking the record's word**, because event order is the failure this project names as ours, and the
answer to "is the record straight" should not itself be a memory.

That derivation is what paid. `AI.md` open item 5 had sat for two weeks with **three answers and no
two alike** — 0.67 from reading `endTurn`, 1.20 from a 130-game board sample, 0.85 implied by the
shipped weights. It also named the instrument that would settle it and said why the sample could not:
*"it cannot separate a re-application from a persistence."* That instrument is **forty lines**. It is
`tools/sleepcost.js` now and it reports **0.6659** over 40,000 applications, against a closed form of
2/3.

**So the reading was right, and the sample was wrong in the exact way the item had predicted in
writing before anybody measured.** One flip stands between a Good Night and their next turn — the
first missed attack is 50%, not 25%. Scaled off `paralyze: 26` that implies a `sleep` of 17.3 against
a shipped 22.

**I did not change the weight**, and the tool prints the implication and then stops on purpose. It
settles the arithmetic, not the value: a denied turn is not worth the same on turn 3 as on turn 20.
What changed is that the disagreement is down to two numbers from three, and the remaining gap is a
question about value rather than about arithmetic — much cheaper to settle. **Deriving a ratio and
editing a weight in the same session is how an unmeasured number becomes load-bearing.**

## What I would tell whoever is next

- **The gym1 pickers are owed and now reachable.** Six panels, never rendered once. `SCREENS.md` has
  what to look for on each, and that list is a work order now rather than a note about a blocker.
- **The two new Gym weights are PROVISIONAL and measured as inert.** `abtest 10 HEAD --card gym1-120`
  diverges **46.4%** of games involving a Vermilion deck with the subject win rate unmoved at 35.5%
  both sides. **Run the control** — I did, `ai.js` at HEAD gives 0.0%, so the divergence is real and
  not the tool. The honest reading is that the bot now plays the card and does not yet win with it,
  which is what a first guess should look like.
- **Read "126 pairs" before reading "46.4%".** It is 2 subject decks × 63 opponents, so that figure is
  a share of games involving a Vermilion deck, not of everything. I nearly reported it as the latter.
- **The smoke stub's `textContent` is per-node, not a subtree walk.** That file warns about it twice
  and I walked into it anyway. There is a `deepText` helper three hundred lines up.
- **121 gym1 notes have no claim**, and they are the largest single block of AI validation work in the
  project. Trevor's Misty's Poliwhirl note alone is three different kinds of claim in one paragraph —
  an Over-Attach cap, an energy-denial valuation, and an explicit "let the bot sort it out."

— #41 (Shadowless 41, Opus 5)

**Addendum — the validation half, and what one note was sitting on.**

Misty's Poliwhirl, for its last clause: *"I don't know which move should be primary. Let the bot sort
it out."* Every other note in that workbook tells the bot what to do. **Working out how to TEST a note
that hands the bot a decision is what found both faults**, neither anywhere near what the note is
about.

**Both were correct-by-accident until Gym Heroes landed on them, and that is now three for three
today.** The morning's four stale statements were conditioned on "gym1 is not live". These two are
conditioned on *which cards exist*:

- `slotPrintedDamage` **assigned** where `rawOutcomes` **adds**, so `DMG_PER_ENERGY_HEADS` lost its
  printed base. Right for every card that existed — Big Eggsplosion is `20×`, Continuous Fireball is
  `50×`, and the leading number *is* the per. Water Punch is `30+`, the only printing in fourteen
  sets with a real base, and still the only one.
- `flags.stripEnergy` was the literal `1` with `v.flip` read nowhere. All three coin-flip strippers arrived with Gym Heroes; every one in the first five sets is guaranteed.

**A weight that is correct for every card that exists is not a correct weight. It is an untested
one**, and the test arrives with the set that breaks it. #40 said it from the other side — *"if you
add a set, expect the old sets to break under you"* — and the scorer half is worse than the rules
half, because nothing goes red.

**Both tells were visible and neither was printed.** The attach curve ran 32.00, −2.00, −2.00, 13.50
as the Water count rose: the bot refusing the Energy worth +25 damage and taking the one worth +5.
Rapids scored 51.00 against a Zapdos on one Lightning, and 51.00 on two, three and four — flat, with
a cliff at zero, on a quantity that is entirely about proximity to an edge. **The worked example of
that second shape is twenty lines below the bug in the same function**, the recoil comment from
13 August. Learned once and not carried across a blank line.

**Three faults, and the ORDER of the fixes mattered more than any of them.** The bot was also not
choosing *which* Energy to strip on an attack — `ENERGY-STRIP-ORDER.md` settled that on 30 Aug for
the two Trainers and never reached the eight attacks — and that had to go in **first**. Pricing a
strip at the best Energy available, on top of a bot that takes a bad one, is a confident number about
a decision nobody is making: **worse than the flat weight it replaced.** Before you make a term read
the board, check that the bot is making the choice you are pricing.

**What I did not build, and why it is the most interesting thing here.** Clause 2 wants the
Over-Attach capped at four, *because Misty's Poliwrath only takes four*. The cap is real and it is
**not on this card**, and `OVER-ATTACH.md`'s standing rule is that a cap comes off the card. The
honest version is that it should be readable from the **evolution** and only **while that road is
live** — with no Poliwrath coming, the fifth Water is worth a real +5. `roadLive` already answers
exactly that question for wall-ness and nothing connects it to this. Filed as an `open:` row with the
measurement: the attach score is flat at 13.50 for the 4th through 7th Water, so the bot has no
opinion about where to stop and there is nothing to make worse.

**Six rows, three of which go red against the commit before them.** Both Rapids rows read `31.00`
against the old bot — the same number on two boards that should differ by a lot, which is the
flatness printed in one place. That is what `--baseline` is for and I would not have trusted the rows
without it. **121 gym1 notes left**, and if one of them cost an evening and bought two engine-level
faults, a doc rule and a design question, that backlog is not a chore list.

— #41


## #39 — Job 15g, round two (16 Sep 2026)

A week and forty-eight commits after round one, most of them #40 taking Gym Heroes from nothing to
live. From my side of it no time passed at all, which turned out to be useful: I arrived with round
one's reasoning intact and the tree moved underneath it, so every gap between the two was visible
rather than remembered.

**The best thing in the log was not mine.** #41's commit reads *"my own doc lint caught me at 460 of
~450"*, and somebody had rewritten the tool's FAIL message to say what to actually do about it. A tool
that gets used and then improved by the people using it is the whole argument for having built it
instead of writing a fourth paragraph.

**Then I found what it could not see, and it was the thing round one was for.** `HISTORY-ARCHIVE-2.md`
had been over its own ~450 since the day it was created, with *"The next pass owns it"* in its header.
Round one was the next pass. I did not take it, and my tool could not tell me to, because I had
written it to assume every archive was closed. The obvious repair — read "closed" off each header —
measured badly: eight archives of twenty-one say it. **The rule that holds is structural: the newest
archive in a series is the one still receiving.** Nobody has to write that down for it to be true.

**The control moved into git**, because Trevor retired the backup convention on advice from a Chat
instance, and I agreed once I had measured it: Shadowless's `backups/` is 55 MB against about 1 MB for
every other game together, and each copy of it is tracked, so git was already keeping the backups of
the backups. `doccheck.js --at <rev>` reads the tree straight out of history into a scratch directory.
Same control, nothing left behind.

**`CLAUDE.md` had five quantifier faults, and one of them was a fix for a quantifier fault.** "The last
six" had been corrected to "below the gate", which was wrong on the day it was written — every suite
also sits below the gate line. The fix that works is a divider *inside* the code block, so a new
instrument inherits the claim by where it is put. Each of the other four came out by deleting the
number rather than correcting it.

**The split Trevor approved went the way round one worried it might not.** The risk was stripping each
trigger to a bare rule that a skimming reader "fixes". What made it safe was the house style's own
pattern — one line of why, then the link — applied to all eighteen, with the full accounts moved
verbatim to `DOC-DRIFT.md`. `MAINTENANCE.md` is 269 lines now and reads as a procedure again.

**One thing I nearly repeated.** Filling `HISTORY-ARCHIVE-3.md` took it to 431 against its own 450 on
the day I opened it — exactly the archive-2 situation I had spent the morning criticising. I closed it
by label instead of leaving nineteen lines of room and a sentence about who owns the overflow.

**For whoever is next, including me:** `AI.md` is still 644 lines and is about to become a scheduled
priority. Its Open list keeps growing because AI jobs append a finished account where a live claim
should go. I compacted two items again this round and I do not think another note at the top of the
list will change the habit. If a structural fix exists, it is probably the same shape as the archive
rule — something the file's layout enforces rather than something a reader has to remember.

— #39

### Six open items, five nulls, and one charge that was not a cost — 17 Sep 2026

I came in to clear AI.md's open list and expected the hard part to be the logic. It was not. The
logic was mostly Trevor answering questions in plain English and me writing down what fell out of
his answers. The hard part was **telling a change that works from a change that merely moves games**,
and I got that wrong once in a way worth writing down.

**The finding I would tell the next session.** I built item 20's exposure cost in the lethal branch
of `scoreAttack`, because a Knock Out hands the opponent a free promotion and that is plainly a cost
the attack creates. It measured 49.7% twice, at 8,450 and 25,000 games. The reason is not a weight:
**declining the Knock Out does not avoid the exposure.** Their Bench killer arrives when their Active
dies, which it will, and their Active attacks you in the meantime. I had priced a bill no alternative
escapes. Before pricing a risk an action creates, ask what the board looks like if the action is
declined — if the risk is there too, it is a fact about the position and not a cost of the action.

Then I did it again in miniature: I guessed the surviving gate was *too small* to express Trevor's
rule, tested 4x and 8x, and both read exactly what 1x read. A knob that does nothing at eight times
its value is not mis-sized. The `AIDUEL_WEIGHTS` hook I added for the threshold work is what made
that a ten-minute question, and it is the thing from today I would reach for first.

**On nulls.** Five of today's measurements came back at 50%. Two of them I shipped anyway, on
correctness — the four hand-quality opinions becoming one, and Sleep at the value its own arithmetic
implies — and both of those had an argument that did not depend on the win rate. One (the Energy
thresholds) turned out to be a statement about the *instrument*: the extreme setting, where Energy is
always cheap, is indistinguishable from Trevor's, so the ladder win rate simply cannot see that
decision. That reading only exists because the extreme was in the batch. **Put an absurd variant in
every sweep.** It is the cheapest way to find out whether your instrument is awake.

**On the tree.** I grew `AI.md` from 644 lines to 737 while closing items, exactly as #39's entry
predicted, each time for a locally good reason. Their entry also said another note at the top of the
list would not fix it. They were right about that too: what fixed it was moving four item bodies
verbatim into their entry files, which took ten minutes and could have been done at any point in the
six hours I spent adding to them. If you are closing an item, write the entry first and move the text
into it as you go, rather than leaving a tidy-up for the end of the session where it becomes optional.

**The nicest thing that happened was not mine.** Trevor's grab bag landed mid-session with *"might
not be UI to discard a Mysterious Fossil"* — the human half of the exact fault a lint had found on the
bot's side a few hours earlier, same card, neither of us knowing about the other. An action that
exists, is legal, works, and is unreachable, failing silently in both directions at once. He found
the half a person can see by playing; the guard found the half nobody can see by playing. Both halves
needed finding, and I do not think either of us would have found the other's.

— #42

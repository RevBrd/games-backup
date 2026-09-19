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
| [LOGBOOK-ARCHIVE-9.md](LOGBOOK-ARCHIVE-9.md) | #38, #39, #40 | 7–16 Sep 2026 | Job 15f's live Google Sheet and graded drift check, **both rounds** of Job 15g and `doccheck.js`, and the whole of Gym Heroes |
| **this file** | #41, #43 – | 15 Sep 2026 – | Job 17a's review of Gym Heroes, and Job 17b — the Open list archived by rule, then the Bench learning to say "I could take a Prize" |

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


## #43 — Job 17b: the Open list, and item 1 (18 Sep 2026)

Two halves, and the second one only worked because of the first.

## The doc half, which Trevor proposed and I argued down

He suggested an `AI-HISTORY.md`: closed items move there, a one-line pointer stays in `AI.md`, numbers
never repeat. The numbering rule is his and it is right — I grepped and found **fourteen citations of
`AI.md` item numbers from outside the file**, so those numbers are addresses.

I pushed back on the file. Every closed item already had a home, and four literally contained the
`AI.md` text under a heading saying so. A new archive would have been a third copy of most of them,
and a *longer* hop than what existed. He took the counter-proposal.

**But the thing that actually made it work was not the shape, it was the table.** Three closed items
had stayed at full length not because anybody preferred them there but because **nobody had ever
written down which home an account goes to.** A convention that needs a judgement call on every use
gets skipped by whoever is in a hurry, which is always whoever just shipped something. So the rule is
now a table: code change → its `AI-INVARIANTS/` entry, decision → `HISTORY.md`, guard-closed → point
at the guard. #39 predicted the growth and added a warning note; #42 read the note and grew the list
anyway. The note was not the missing piece.

**The find of that half was a register hiding in `selftest.js`.** The five silent-failure surfaces
existed as a roster only inside the guard that watches them, while `AI.md` — whose header promises
*"where it can fail without anything going red"* — described one and scattered four across two
struck-through items in its own Open list. The count disagreed in three places. Both of the newest
surfaces were found by somebody writing a guard rather than by anybody reading the model, which is
what that costs.

## Item 1, and the lesson I would most want passed on

**The refactor it had been budgeting for since 13 August did not exist.** `forecast` pinned the
attacker to `me.active` in one line. `rawOutcomes` and `computeDamage` had taken slots as parameters
for months — the Over-Attach and drag-target jobs did that for their own reasons and nobody went back
to look. **A scope estimate written into an open item is a measurement with an expiry date exactly
like any other, and nothing in this tree re-derives one.** That is the most transferable thing I found
all session and it is not about this item.

The other half of why it had sat: `forecast` reads the board and scores nothing, so it is safe inside
`scoreAttack`, and until now the only two rungs were `bestAffordableDamage` (printed) and
`scoreAttack` (score). Anything forbidden the scorer had **nowhere else to go**. The missing rung is
most of the explanation.

## Trevor found a hole in it within the hour, and I want to be precise about how

I asked him a design question about walls and retreat. **He misread it** and answered about Chansey
*attacking* instead — and his misread answer named a live fault in code I had shipped an hour
earlier: a Chansey on 60 HP reported a 1.00 chance of a Prize through a Double-edge that kills it.
One Prize for one Prize is not a Prize.

**And the sweep I had written to check exactly that had already come back clean — 0 of 188
printings.** Every card in it was benched at full HP, where recoil is survivable almost by definition.
Nobody chose full HP: `makeSlot` leaves `dmg` at 0 unless a board says so, so the harness's **default
state silently became the scope of the finding**. The zero was not wrong about the boards it ran. It
was wrong about the question, and a confident zero is the most persuasive result a sweep can produce.

If you take one thing from this entry: **ask what your fixture is holding still, and whether the fault
could live there.** The second probe was one line longer than the first.

## What I left, and one thing I would tell whoever takes it

Three more sites price the Bench in printed damage and the retreat case is the loudest — its own
comment says printed damage is *"the only currency they share"*, which stopped being true this
morning. Trevor's rule for it is already recorded: the wall suppression lifts as **their** Prize pile
empties, on `retreatPrize`'s existing squared curve rather than a new threshold.

I also re-filed the Omastar claim row off item 1 as item 21, and I think that matters more than it
looks. It had been item 1's *"cheapest statement of it anybody has written down"* for a fortnight. It
is a third fault — put Omastar in the Active spot, where item 1's fix applies by definition, and it
plateaus identically, because expected value does not rank a guaranteed 30 above a two-coin 30. **That
is the Poliwag lesson arriving a second time on the same item**, and the item had the warning written
in it: *two faults producing the same wrong number on the same board are not one fault.* Having the
rule written down did not stop it happening again. I do not know what would have, other than the two
minutes it took to put the card in the other slot and look.

One shape observation I did not act on: `AI.md` is two documents. The model — how it scores, the five
surfaces, the cliff table, the re-entry rule — and the open list. Different readers, and it passes
`MAINTENANCE.md`'s split test cleanly. The numbering objection does not apply, because the list would
move whole rather than be restructured. Left for whoever does the next 15g round.

— #43

## #43 addendum — the second half (19 Sep 2026)

Three more things landed and two of them were mine being wrong first, which is the reason to write
this down rather than leave it at the entries.

**The retreat site, and a rule that arrived in pieces.** Trevor said a wall should not retreat to
bring up a killer *"unless the opponent was low on prizes"*. I built the Prize clause, tested it, and
watched it fire on a board where it clearly should not have. I tried three reformulations of the
suppression curve before I noticed two things: the retreat was **never chosen** — Scrunch beat it —
and the board I was testing on gave the opponent **no bench at all**, which is the second clause of
his rule, unbuilt.

**So the built half was absorbing the blame for the missing half, and every "fix" I was reaching for
would have made it permanently wrong.** That is the thing I would most want passed on from this half:
*a rule with a missing input does not read as missing; it reads as the input you did build being
wrong.* Both sit in `MISREADINGS.md` now, along with the flatter one — a score is not a decision, and
`explain()` is one call.

**Then his grab bag item, which was a fault fixed once already.** `T_SWITCH_OWN` has carried a comment
since 3 Sep saying the bot promoting one Pokemon and spending a Switch to undo it is what happens when
two formulas pick different bodies. That fix aligned two of **three** formulas. The retreat case ranks
destinations on damage and death alone, tied two unpowered Basics at exactly −2.10, and picked by
bench index.

**My first fix for that was wrong and his own harness caught it in one run.** A blanket veto on
switching after a retreat went red on this card's own control row, written three weeks earlier against
a different fix. What shipped instead was the third clause of his Switch note, which had sat
unimplemented while the two either side of it were built. **Read the note again when you think you
have found the fault — the sentence you need may already be in it.**

**On the ruling.** Trevor brought a Gemini answer for Blaine's Charizard and asked whether to keep it.
It calls the card's confusing middle clause future-proofing for cards that did not exist. It names
Buzzap, which was three sets old, and our engine has modelled it since Job 1 — `asEnergy = type +
type`, one card, two symbols. **The clause reads as noise until you find the card it names**, and the
whole diagnosis was one grep. I kept the answer at the foot of the file with the corrections, because
a wrong answer with a reason attached is worth more than a deleted one, and the part it got right is
the part the card states plainly.

**What I would tell whoever takes item 23.** The arbitrary destination choice is still there; the card
is just no longer spent correcting it. Do not add `promoteValue` to the retreat score — it
double-counts printed damage — and do not re-implement half of it either, which is the *two copies*
failure in the exact function that keeps producing it. Decide which formula owns the ranking and
delete the other. And run the cheap probe first: how often do two retreat destinations tie exactly?

— #43

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

**This file is an append-only register and the 200-line target does not apply to it.** Correct an
entry that turns out wrong; never shorten one — the whole value of a logbook is that it says what
somebody actually thought at the time. **That label was missing from this header until 8 Sep 2026**,
which is not cosmetic: `MAINTENANCE.md` tells a pass to find the registers by reading each file's
header rather than by keeping a list, so a register that never says the word is invisible to anybody
following the instruction — and to `tools/doccheck.js`, which found this by failing to find the very
overrun it had been written for.

**Entries move out of this file when the work they describe is CLOSED**, into whichever archive is
still short enough — **start a new archive rather than growing one past its limit.** Archiving is a
boundary and not a count; the old rule was "hold the two most recent" and by the time anyone checked
it was holding six at 295 lines. **The most recent closed entry stays behind on purpose**: instances
visibly write better entries when there is one in front of them, so the live file always opens with
an example rather than a blank.

**Both limits are ~450 — Trevor's call, 3 Sep 2026**, raising the live file from ~250 to match the
archives. **What it buys is more entries live at once**, which is the point: an arriving instance
reads this file and not the archives, so recent history being here is most of its value.

**The old split was ~250 live against ~450 archived, and the reason given for it does not survive
contact with how appending actually works.** It was that instances *append* here and an entry once
landed in the middle of another's when the end of the file scrolled out of view — a hazard that
"scales with length". **It does not scale with length; it scales with technique.** An append done by
`>>`, or by anchoring on the previous entry's signature line, lands correctly in a file of any size.
An append done by reading the whole file and writing it back is unsafe at 250 lines just as much as
at 450. So the number was guarding the wrong variable, and the mitigation belongs in the instruction
rather than in the cap:

> **Append by anchoring on the end, never by rewriting the file.** `>>` is safest. A targeted
> insertion after the last entry's `— #NN` line is fine. **Reading the file and writing back a
> version you assembled is the thing that has gone wrong**, and it goes wrong silently.

**~450 is deliberately inside the truncation zone and that is accepted.** Trevor's framing: mildly
truncated but still workable, and worth it for holding more entries. If you arrive with this file
compacted and need an entry in full, it is in git.

**Roughly four entries fit**, at the 75–105 lines these have been running.

**Assume this file is over its limit and go and look — it was at 609 on 2 Sep 2026**, holding five
entries against a rule sitting at the top of its own header. That is the third register in this tree
to be found past a threshold written into itself, which is why the number is stated here at the point
of decision rather than only in the archive.

*(**And it was at 296 the same evening, which is the part worth reading.** Archive 6 was created that
morning by the pass that wrote the rule above; by the time the next session opened the file it was
already 46 lines over, because the archiving pass had appended its own entry after finishing. So the
limit was breached by the person enforcing it, in the same commit. Archive 7 was made at the end of
Job 15d — **before** appending #35 rather than after, which is the only ordering that works.)*

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
| [LOGBOOK-ARCHIVE-7.md](LOGBOOK-ARCHIVE-7.md) | #33, #34 | 1–2 Sep 2026 | Job 15a's Challenge bracket and Job 15b's pack odds — including the legal deck that could not attack — and the eleventh documentation pass |
| [LOGBOOK-ARCHIVE-8.md](LOGBOOK-ARCHIVE-8.md) | #35, #36, #37 | 2–5 Sep 2026 | Job 15d's suite audit and `owed.js`, and Job 15e in both halves — the GBC 2 seam, then the attack road |
| [LOGBOOK-ARCHIVE-9.md](LOGBOOK-ARCHIVE-9.md) | #38 | 7 Sep 2026 | Job 15f — the live Google Sheet, and the drift check that GRADES a changed note rather than just flagging it |
| **this file** | #39, #40, #41 – | 8 Sep 2026 – | Job 15g's standing pass and `doccheck.js`, Job 16's Gym Heroes, and Job 17a's review of it |

**Archive 9 is small on purpose and that is the rule working.** It holds one entry, because archive 8
stood at 342 lines and #38's is 129 — growing it would have put it at 471 against the ~450 in its own
header. **Archiving is a boundary, not a count**, so a one-entry archive is the correct outcome and
not a sign somebody archived too early.

**#15, #18 and #27 wrote no logbook entry and are not missing** — writing here is optional and a
`CREDITS.md` row alone is a complete record. Said explicitly because the Instances column above skips
those numbers, and a gap in a sequence reads as loss rather than as a choice.

**This table is the roll of archives, and it is the ONLY roll.** Anything else that lists them by
hand falls behind it. This paragraph used to say `CREDITS.md` "stopped doing so on 29 Aug 2026"; it
had not — that date is when somebody *extended* its hand-list to four entries, and by 8 Sep it was
three archives behind with seven instances unreachable from it. The list is gone now and every
`CREDITS.md` row links here instead. **Check this claim against the other file rather than trusting
it**, which is the whole lesson: a "that is handled elsewhere" sentence is a claim about two files
and it goes stale when either one moves.

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


---


## #39 — Job 15g, the standing pass, round one (8 Sep 2026)

Job 15g is a shape rather than a job: one documentation pass, then a wait of however many days or
commits, then another, for as long as I am willing. Trevor's framing, and he checks in each round.
This is round one.

**The thing I would tell whoever reads this first: run the control.**

I built `tools/doccheck.js` because this tree's own diagnosis is that *a correction which leaves a
human instruction behind has a half-life*, and its three loudest instructions had each been missed by
consecutive passes reading them. Four passes in a row found a register over the limit written at the
top of its own file. Two passes in a row shipped a hand-list of archives underneath a bolded warning
against hand-listing archives. Those are not carelessness — they are what a written rule costs when
nobody re-reads the file it lives in.

**Then my tool went green on the exact defect it was written for**, and I only know because I ran it
against the backup I had taken an hour earlier. `LOGBOOK.md` was at **555 lines against the ~450 in
its own header** and section 1 said nothing. Two bugs, and both are the shape this project keeps
finding. It matched the bare word "closed" — which appears in that header in the sentence *"entries
move out of this file when the work they describe is CLOSED"* — so the live register exempted itself
from its own check, on a sentence about the work rather than about the file. And it required a verb
before the threshold number, which missed *"Both limits are ~450"*.

Underneath both was a third thing that was not a tool bug at all. **`LOGBOOK.md` had never called
itself append-only in its own header.** `MAINTENANCE.md` says to find the registers by reading each
header rather than by keeping a list — precisely so the roll cannot rot — and a register that never
says the word is invisible to anybody obeying that instruction. It was exempt from nothing and
watched by nobody. The label is infrastructure, not a courtesy, and `doccheck.js` now fails on a file
that states a growth threshold without declaring itself one.

**On the hand-list, the interesting part is the shape of the previous fix.** `CREDITS.md` listed
logbook archives 1–3 while four existed; the correction on 29 Aug **added the fourth**. By yesterday
it was three behind again with seven instances unreachable from the only index that points there.
**Extending a stale hand-list is not fixing it — it resets the clock.** The fix is deleting the list
and pointing at whatever the register itself maintains, which generalises well past archives: any
enumeration kept in a file that is *not* the one people edit when the set grows.

**Two smaller things worth the lines.**

Trevor corrected me on the duplicate `#33`: I read it as a renumbering error and it is a *split*. One
instance did Jobs 15a and 15b, wrote two logbook entries, and downstream those became two rows. A
designation is a session, not a job.

And `AI.md`'s item 15 had a retracted instruction living in one of its two homes. The `selfKO`
correction was written into `AI.md` on 8 Sep and never reached `AI-INVARIANTS/DECK-OUT-CLOCK.md` —
the file that folder *tells you to read before touching the term*. Withdrawn advice sitting in the
place the reader is sent. **When you retract something, grep the symbol rather than the file.**

**Where I stopped, and it is a shape question rather than a limit.** `MAINTENANCE.md` is at 489 lines
and two of its sections are accumulating registers — 16 dated triggers growing 3–5 a pass, plus a
growing list of splitting lessons — against stable method everywhere else. That is its own "a
register hiding inside a rule file" trigger, four for four. What moved the premise is the tool: the
three earlier refusals rested on *every reader needs all of it*, and a pass no longer reads the
trigger list in order to **run** the sweeps. I measured it and wrote the measurement into the file,
but did not split it. The risk is the one that file names itself — strip a trigger to a bare claim
and the next reader skims, sees a rule that looks wrong, and "fixes" it — so anything moved out has
to leave a real sentence behind. That is a shape for Trevor to approve, and this job has a next
round, which is the first time that has been true here.

— #39

---

## #40 — Job 16, Gym Heroes: 130 of 131, and card 131 held for a go-live call

Taken from 0 to 130 over one long session, two compactions, and a Poison ruling that went two ways.

*Corrected 12 Sep, after the second compaction.* This entry first said "44 to 130", because 44 was where
my memory started after the first compaction. Trevor pointed out that the whole set was this session's,
and `git log` agrees: Job 16 opens at `99f0158` on 8 Sep with gym1 at zero. The paragraph below is
**reconstructed from those commit messages, not remembered**, and should be read that way.

**The first 44, from the record.** Generating the set and building the Stadium zone — `gym:` as a third
verb namespace, and `benchMax` no longer a constant because Narrow Gym rewrites it. All seven Gyms,
where Celadon exposed a failure surface nothing guarded. Blaine's Quiz #1 ruled out of the game with
Trevor, because no stat could stand in for printed length: the card names the Pokémon, so a bot looks
the answer up. That is why gym1 counts 131 against 132 printings. Sabrina's ESP and Flee, the rewind.
The Powers, including the delayed-counter family and Bench Guard's "you may". **And one bug of my own
that became a guard:** a 22-card batch scripted from attack text alone, which shipped six cards whose
Powers silently did nothing. Those six were backed out, and selftest now refuses a Power with no `p:`.

**The job's scope was the most useful sentence in it.** Trevor asked for placeholder AI weights, clearly
marked, not validated ones. That freed every batch to spend its care on the engine rules and the
tests, and the `PROVISIONAL` list is the honest ledger of what is still a guess — about fifty entries.

**Three live-set bugs came out of building adjacent gym1 cards, none of them visible from their own
set.** Dark Charizard's forecast counted every Energy where the card counts Fire (2x overestimate,
measured with abtest). Jungle Scyther's Swords Dance never worked: `turn + 2` is right for effects
through the OPPONENT's turn, and that buff runs through ours. A crash I shipped myself one commit
earlier (a malformed `revealedHand`). If you add a set, expect the old sets to break under you —
the new card is the first test that asserts the damage rather than the effect being present.

**What I would tell the next session, in order of how much it cost me:**

- **Event order is our weak spot, and I got talked out of a correct answer about it.** On Jynx I
  derived the flip count right and then conceded the framing anyway. Trevor came back the next day
  with the same number. His model of why is now in the global CLAUDE.md and it is better than mine:
  we hold the whole text at once, so order has to be deconstructed, not read forward. Derive it
  from the code, then say the consequence out loud before agreeing.
- **Printed text outranks playability, in both directions.** I argued Poison should not end Shadow
  Images on playability grounds; that is step 4 overruling step 1. Trevor's strict reading also made
  Poison a real counter-strategy, which my version had missed.
- **Every test fixture here lies once.** Defenders that were weak or resistant to the attacker, hand
  counts across a turn draw, `forceFlip` also forcing the between-turns waking coin, an ESP counter
  read after the turn moved on. Query `wkType`/`rsType`; assert deltas and identity, not totals; read
  counters where their consumer reads them.
- **A break-test that does not break looks exactly like an untestable row.** One silently no-op'd.
  Assert the match count on the throwaway edit too — it is in `MISREADINGS.md`.
- **`scoreAttack` cannot ask what a card is worth** (AI.md item 19): `cardKeepValue` routes back into
  it. Two stack overflows before it had a name.
- **Script edits: check every anchor, then write.** One duplicate anchor cost a round trip; the fix was
  collect-all failures, a `--dry` mode, and a re-run guard. Nothing half-applied.

**Where it stands.** Recall is card 131 and the set goes live the moment its entry lands, with a
generated placeholder bracket until Trevor's roster is in `ladder.json`. I recommended building
Recall's machinery first (tested with the card injected only inside the test run) and landing the
one-line card entry as its own deliberate commit. Five pickers have never been rendered; `SCREENS.md`
says what to look for on each.

The best part was the rulings conversations. Trevor's plain-English reads on Shadow Images and Fairy
Power were right on first pass, and the keep-one rule on Fairy Power is the kind of thing I would not
have thought to add.

— #40 (Shadowless 40, Opus 5)

**Addendum, 14 Sep — the landing.** Recall went in as its own commit once Trevor's roster was in the
Drive sheet, and **converting the roster was a better test of the set than any count in the suite**:
his T3 Vileplume deck would not validate, because Erika's Oddish carried an attack script for an attack
it does not print. The validator had refused that card from every deck since it was scripted, while
selftest's coverage line called gym1 complete — two predicates for "implemented", disagreeing on one
card. Selftest now asks the engine's. **If you land a set, convert its roster before you believe the
set is done.**

Two other things worth the next session knowing. Recall's buttons first made the Active tile tall
enough that the board zoomed from 0.892 to 0.704 at Trevor's viewport for the turn; I put it to him as
a locked-board question, he chose a switcher, and the zoom no longer moves. Asking him what "locked"
meant turned up his actual 8 Aug words, which were looser than the rule written from them — now quoted
beside it in `CLAUDE.md`. And ROSTERS.md crossed its archive line, so Fossil
moved into `ROSTERS-ARCHIVE-2.md` exactly as its header says to.


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

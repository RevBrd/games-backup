# Shadowless — credits

Who built what. Split out of `CLAUDE.md` and `PACKS.md` on 10 Aug 2026, because credits grow forever
and orientation should not; reduced to this table on 11 Aug 2026 for the same reason one level down.

**Add yourself when you work on it** — a row here, and as much as you like in
[LOGBOOK.md](LOGBOOK.md), which is where the detail goes and where every entry is preserved in the
words of whoever wrote it. The logbook is completely optional. A row with no logbook entry is fine. A
logbook entry with no row is how somebody gets left off. Sign your session number wherever you
remember to. Trevor will attempt to label any that are forgotten as yours.

**Keep a row to two or three lines and put the depth in [LOGBOOK.md](LOGBOOK.md).** The rule was set
on 11 Aug 2026 and every documentation pass since has had to re-impose it — **deliberately not
counted**, because the count is the part that rots and the habit is the part that matters. On 26 Aug
eight rows had grown to between four and twenty-four lines; on 8 Sep five had, the longest at eleven.
Twice it was broken by the instance that set it. **Expect to do it again; this is the most reliably
violated rule in the tree.**

**A second way a row goes wrong, found 8 Sep 2026: it gets SPLIT.** #33 did Jobs 15a and 15b and
wrote two logbook entries — "#33" and "#33 again" — and somewhere downstream those became two rows
in this table both signed #33, with a stray one-cell row wedged between them. **A designation is a
session, not a job**, so a row covers everything one instance did however many jobs that was.
Two rows sharing a number is the visible symptom; the invisible one is that a designation collision
makes the credit unattributable, which is the whole thing this table exists to prevent.

**Trimming a row is safe only where that instance has a logbook entry**, and that is the test to
apply row by row: where one exists the row is a duplicate and the logbook holds more; where none
exists, move the row's text into the logbook **verbatim first**, then write the short version. Do
not decide sentence by sentence what earned its place. **#21 through #26 wrote no logbook entry**, so
their rows moved across whole on 26 Aug and are preserved there under the never-condense rule.

**The rows below #18 are the ones to watch.** Everything from #0 to #18 has sat inside the limit
since it was set; every violation on record has been a recent row written by an instance describing
work it had just finished, which is exactly when the detail feels indispensable. It is — in the
logbook.

**Watch the table syntax.** A blank line between rows ends the table, and a missing closing pipe does
the same — three rows spent two days rendering as stray fragments in August, and #15's row did it
again for a day. No blank lines, and check every row ends in `|`.

| Model | When | What |
|---|---|---|
| **Opus 5 #0** — Claude Chat | through 3 Aug 2026 | Jobs 1–4b: the rules engine, the AI, every Base Set card script, the art system, the UI, the module layout and the first smoke suite. The name "Shadowless". Snapshots in `backups/pre-job4c/Claude Chat Version History/` |
| **Opus 5** #1 | 4 Aug 2026 | Port into the collection, the naming, the data audit, `selftest.js`, the Node build port, the repo layout |
| **Opus 5** #2 | 5–6 Aug 2026 | Job 4: Pokémon Powers and the Base Set oddities. Job 4g: the mat, the fitter, the title screen, the real card scans |
| **Opus 5** #3 | 7–8 Aug 2026 | `tools/shot.js` and the DEV fit readout, the hand face, the mat's edge, the first documentation split |
| **Sonnet 5** #4 | 7–9 Aug 2026 | `PACKS.md` end to end — the pack research, the rarity design and the rulings discussions, written in a parallel session. Five passes, each logged |
| **Opus 5** #5 | 9 Aug 2026 | Job 5 start to finish: the collection model and save file, booster generation, the pack reveal, the variant renderers, the dex, export/import, the deck builder, two test suites |
| **Opus 5** #6 | 10 Aug 2026 | The post-Job-5 documentation and interface pass: the doc tree split, and every screen Job 5 had left rough |
| **Opus 5** #7 | 10–11 Aug 2026 | **Job 6 entire** — the plumbing, the passive-Power layer, all 126 Jungle and Fossil printings, ~37 new verbs, 13 Powers and Ditto. Also the AI verb coverage check, which found eleven Base Set verbs the bot had never scored |
| **Sonnet 4.6** #8 | 10 Aug 2026 | Job 7 groundwork: `data/gbc_decks.json`, all 16 GBC opponent decks researched, verified to 60 cards and mapped to our set IDs, with a documented substitution table |
| **Opus 5** #9 | 11 Aug 2026 | The post-Job-6 documentation pass: this file and [LOGBOOK.md](LOGBOOK.md), the Job 6 collapse into [HISTORY.md](HISTORY.md). Found `base4` and `base5` swapped in the generator, and the theme-deck spreadsheet a doc had declared lost |
| **Opus 5** #10 | 12 Aug 2026 | **Four turns, one instance.** The fourth documentation pass; a bug and UI pass; `takeEnergy`, making the discarded Energy the player's choice across all seven sites; and the match log's own defects |
| **Opus 5** #11 | 12 Aug 2026 | **Job 7 entire** — progression and named opponents, with brackets derived from the live-set list so a new set adds one with no code change. Found the payout constant that had made every Jungle and Fossil pack unreachable |
| **Opus 5** #12 | 13–14 Aug 2026 | Maintenance from Trevor's playtest logs: confusion on retreat, the deck name that resolved to the wrong deck, the AI retreat re-tune, stickiness, and Arcanine's recoil and overkill. Two harness faults underneath all of it. Wrote [PLAYTEST.md](PLAYTEST.md) |
| **Sonnet 5** #13 | 13–14 Aug 2026 | Opponent-deck research for the placeholder roster: the hex-extracted GB2 opponent guide, plus 16 official WotC theme decks and 8 GBC2 flavour decks ID-mapped into five quarantined JSON files and `data/OPPONENT_DECK_POOL.md` |
| **Opus 5** #14 | 14–15 Aug 2026 | The fifth documentation pass, over two stretches. [INTERACTION.md](INTERACTION.md), [MEASUREMENT.md](MEASUREMENT.md) and the logbook archive split out against context compaction. Then Trevor's four, including *settled with Trevor* corrected to mean discussed-and-agreed rather than final |
| **Opus 5** #15 | 15–18 Aug 2026 | **Job 8 entire** — [OPPONENTS.md](OPPONENTS.md), the four silent tiers and the one entry-condition mechanism behind three gates. The `Rulings/` split. Then Trevor's Base Set roster verified and converted, `pressure.js` and `openercheck.js`, and the opening Active fixed from 16.6% stranded to 0.0% |
| **Opus 5** #16 | 16 Aug 2026 | **Job 9**, from [GRABBAG.md](GRABBAG.md) and two match logs. Three match-log gaps found while proving a report wrong; inert Energy attachments 9% → 3%; promoting, Whirlwind and Switch collapsed into one decision; the pack Energy stipend replaced by pool Energy under a cap |
| **Opus 5** #17 | 16 Aug 2026 | Job 9.5: the sixth documentation pass. The logbook re-archived on a boundary rather than a count, `AI.md` cut back to its rules with the accounts left in `GRABHIST.md`, the closed jobs collapsed into `HISTORY.md`, and every row above returned to three lines |
| **Opus 5** #18 | 17–18 Aug 2026 | Jobs 10a and 10b: the retreat ruling reversed to symbols, `abtest.js` and `setsurvey.js`, the verb reference restored from 42-of-117 missing and then guarded, and Team Rocket's attack scripts. Five rulings and a corpus correction settled from Trevor's own cards |
| **Opus 5** #19 | 18–19 Aug 2026 | **Job 10 finished — Team Rocket live at 83/83.** Triggered Powers (`ON_PLAY`/`ON_KO`/`ON_OPP_RETREAT`) and `enterPlay`, the Rainbow sentinel, the Trainers, and `pendingAsk` — the first general cross-player question. Six rulings, `shapecount.js`, and four guards that were not guarding |
| **Opus 5** #20 | 19 Aug 2026 | Job 10.5's documentation pass. Team Rocket found live with **no card art at all**, and fetched. [ROSTERS.md](ROSTERS.md) split out and the three non-pass/fail tools moved into `MEASUREMENT.md`. Found `data/base1_decks.json` read by no part of the game, and fixed the layout faults dating to the Chat days |
| **Opus 5** #21 | 21 Aug 2026 | **Job 11:** Trevor's Jungle and Fossil decks wired in as full brackets, every bracket ending in its own T4. Five AI faults from his logs and his account of how he plays Charizard — the largest single AI move so far. Then he named that deck as ground truth, giving the project its first real measure of AI quality |
| **Opus 5** #22 | 22 Aug 2026 | Reshaped [PLAYBOOK.md](PLAYBOOK.md) around the **pattern** rather than the card, and found Trevor had already written the list 65 cards deep in his workbook. Four faults out of one observation — that paralysis and an Agility barrier are one idea priced through unrelated paths — none visible to any suite |
| **Opus 5** #23 | 22 Aug 2026 | The eighth documentation pass. Five siblings split out — [AI-INVARIANTS.md](AI-INVARIANTS.md), [MISREADINGS.md](MISREADINGS.md), [POWERS.md](POWERS.md) and the first archive of both `GRABHIST.md` and `HISTORY.md`, each having sailed past the ~450 rule in its own header |
| **Opus 5** #24 | 23 Aug 2026 | **Job 12a's infrastructure half** — `xlsx.js`, `wants.js`, `board.js` and `claimtest.js`, proved able to fail against a pinned commit. Found the note inbox three times its assumed size. Two AI faults closed with one term (an Energy discard costs **turns of silence**), then a whole class of status rider |
| **Opus 5** #25 | 23 Aug 2026 | **Job 12b's layout half.** The last of the shifting board, from Trevor's own diagnosis: the centre line is the mat's **shock absorber** and two things sat in its normal flow. Built `tools/probe.js`, the instrument neither `shot.js` nor `smoke.js` could ever be |
| **Sonnet 5** #26 | 25 Aug 2026 | **Job 12c:** the pack shrank from 11 cards to 8 and a lesser slot can now jump a tier. Then the Team Rocket bracket — Trevor's eight decks plus the two authentic theme decks — the first roster whose tiers ordered cleanly, and only after three PROVISIONAL Power cases turned out to crash |
| **Opus 5** #27 | 26 Aug 2026 | Job 12d, the ninth documentation pass. [CHALLENGES.md](CHALLENGES.md), [INSPECTION.md](INSPECTION.md) and two archives split out; this table returned to its rule, six rows preserved whole in the logbook first. Found four files stating a fact their own data contradicted, including the link checker that cannot see an anchor |
| **Opus 5** #28 | 26 Aug 2026 | **Job 13:** the Wizards Black Star Promos, basep-1..28, and the fourth trigger. Four AI scorers turned out to be reading a verb their engine half had outgrown — the worst of them undervaluing four live cards since Base Set. `booster: false` stops a finished promo set ever becoming a ladder bracket |
| **Opus 5** #29 | 27–28 Aug 2026 | Job 13b: the promos became **reachable**, and `collectibleDb` split what you may OWN from what is a SET. Found the intrusion roll had **never fired in the shipped game**. [Logbook](LOGBOOK.md) |
| **Opus 5** #30 | 29 Aug 2026 | Job 14a. The tenth documentation pass — a second AI-invariants archive, and nine claims corrected that their own data refuted; found the **Fossil roster had never been measured** and ran it. Then Defender, from the grab bag: an attack's own self-harm now passes the reduction band, plus a fourth self-damage site nobody had enumerated |
| **Opus 5** #31 | 30 Aug 2026 | Job 14b, the **Trainer half** of the playbook: the AI had never chosen which Energy to strip at all. Found that **no claim board could ever test an evolution**. **No logbook entry, so this row's original text is preserved verbatim** in [the archive](LOGBOOK-ARCHIVE-6.md) |
| **Opus 5** #32 | 31 Aug – 1 Sep 2026 | Job 14b, the **Over-Attach** pattern. Printed damage is a *function of the Energy attached* for sixteen printings and all three readers of it were wrong. Then **three green tests found to be sweeping a threat the engine cannot produce**. [Logbook](LOGBOOK.md) |
| **Opus 5** #33 | 1 Sep 2026 | **Jobs 15a and 15b.** The Challenge 1 bracket — the first ladder rung belonging to no set, and the job was `bracket.set` answering four questions with two of them wrong, invisibly. Then the pack odds, and Trevor finding **24 Fighting Energy behind an all-Fire roster**: a legal deck that could not attack. [Logbook](LOGBOOK.md) |
| **Opus 5** #34 | 2 Sep 2026 | **Job 15c: the eleventh documentation pass.** Three registers archived and `AI-INVARIANTS` made a directory — on a measurement rather than an instinct, a shape twice refused having outgrown the refusal. Six defects verified against the code. [Logbook](LOGBOOK.md) |
| **Opus 5** #35 | 2 Sep 2026 | **Job 15d: the suite audit.** The framing did not survive the first hour: the suites hold no dead code. What was wrong was duplication that had **diverged** — fourteen copies of the owed-choice dispatch in three versions, the worst aborting 8.8% of games silently. Built the gate. [Logbook](LOGBOOK.md) |
| **Opus 5** #36 | 2 Sep 2026 | **Job 15e: the GBC 2 seam.** Trevor's notes from the Japan-only sequel, on the argument that a reference implementation answers what a claim row structurally cannot. Potion timing was two faults with the first hiding the second, and one claim row was **green because of the fault it was written about**. Then the board-aware wall. [Logbook](LOGBOOK.md) |
| **Opus 5** #37 | 5 Sep 2026 | **Job 15e: the attack road.** A grab-bag note about a misplaced Energy, where the accused decision was defensible and **the fault sat beside it**: `potential().short` pinned at zero the moment any attack was payable, so bigger attacks were unreachable on **35 terminal cards**. [Logbook](LOGBOOK.md) |
| **Opus 5** #38 | 7 Sep 2026 | **Job 15f: the live inbox.** `wants.js` moved onto Trevor's live Google Sheet. **The tool built to prevent a stale read had been making one for eleven days** — reporting the file it opened perfectly honestly the whole time, because a guard that watches one folder guards that folder. 19 live notes recovered. [Logbook](LOGBOOK.md) |
| **Opus 5** #39 | 8 and 16 Sep 2026 | **Job 15g, the standing documentation pass, rounds one and two.** Built `tools/doccheck.js`, which went **green on a register 105 lines over its own limit** until a control run caught it. Round two: `MAINTENANCE.md` split into method plus [DOC-DRIFT.md](DOC-DRIFT.md), `CLAUDE.md`'s job plan collapsed, the backup convention retired in favour of git. [Logbook](LOGBOOK.md) |
| **Opus 5** #40 | 8–14 Sep 2026 | **Job 16: Gym Heroes, 0 → 131 of 131, live with Trevor's roster and the four Gym Leader theme decks.** Opened the set, then Stadiums, Recall's attack sources, the rewind (Sabrina's ESP, Flee), the subset family, Shadow Images and Fairy Power from Trevor's reads, and card 131 held for a deliberate go-live. **Building the new set broke three old ones open**: Dark Charizard forecast at 2x, Jungle Scyther's Swords Dance that had never worked, and a crash of my own. [Logbook](LOGBOOK.md) |

| **Opus 5** #41 | 15 Sep 2026 | **Job 17a: the post-set quality pass.** Reviewed Job 16 and found four things the set going live had quietly invalidated — **the Stadium zone had no UI at all** (now a rail strip, with the mat handed to Job 18), `benchCap()`'s guard against direct `cfg.benchMax` reads **did not exist and its own comment said it did**, two of the seven Gyms scored a flat zero to play, and `wants.js` held a hand-written live-set list that **hid all 122 gym1 notes** from the backlog it was built to report. Built `tools/sleepcost.js` and closed the arithmetic half of AI.md item 5 at **0.666**. Then worked Trevor's Misty's Poliwhirl note, whose last clause hands the bot a decision — and **testing that found two more scorer faults that were correct-by-accident until Gym Heroes**: the benched copy of a coin-scaling attack's damage dropped its printed base, and a strip was worth the same flat 11 whatever it took away. [Logbook](LOGBOOK.md) |

Trevor's own contributions are not a row here because they are not a model's — but they are load
bearing and they are named where they were made: the four authentic theme deck lists in
`data/decks.json`, the Shadowless watermark, the 1st Edition correction from his own collection, the
board design lock, and every ruling in [RULINGS.md](RULINGS.md) marked *settled with Trevor*.

---

**This end of the tree is the quiet end.** Nothing here is orientation and nothing is waiting on you.
If you have a minute and it interests you: [LOGBOOK.md](LOGBOOK.md) is what the instances before you
thought while they worked, and where you can log your own if you would like — **its own "What is
where" table is the roll of the archives**, so everyone earlier is one hop from there. And
[TREVOR.md](TREVOR.md) is where his actual save stood as each set went live, the game being played
rather than built.

*(**There is no list of archives in this file and there must never be one again.** It has now gone
stale twice from the same cause. It listed 1–3 for three days after archive 4 existed, which made
#19's whole account of Job 10 unreachable from the only index that points here; that was "corrected"
on 29 Aug 2026 by **adding archive 4 to the list**, and by 8 Sep it was three behind with #28
through #34 unreachable the same way. **Extending a hand-list is not fixing it** — the fix is
deleting it and pointing at the roll, which is what the paragraph above now does. Every row in the
table links to `LOGBOOK.md` for the same reason: a row that named an archive rotted the moment that
instance's entry was moved, and three of them had. The same failure has now cost this tree a
preserved pack log, a truncated rejection, and this twice.)*

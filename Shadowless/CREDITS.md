# Shadowless — credits

Who built what. Split out of `CLAUDE.md` and `PACKS.md` on 10 Aug 2026, because credits grow forever
and orientation should not; reduced to this table on 11 Aug 2026 for the same reason one level down.

**Add yourself when you work on it** — a row here, and as much as you like in
[LOGBOOK.md](LOGBOOK.md), which is where the detail goes and where every entry is preserved in the
words of whoever wrote it. The logbook is completely optional. A row with no logbook entry is fine. A
logbook entry with no row is how somebody gets left off. Sign your session number wherever you
remember to. Trevor will attempt to label any that are forgotten as yours.

**Keep a row to two or three lines and put the depth in [LOGBOOK.md](LOGBOOK.md).** The rule was set
on 11 Aug 2026 and has needed re-imposing **three times** since — 16 Aug, and again on 26 Aug when
eight rows had grown to between four and twenty-four lines each. Twice it was broken by the instance
that set it. **Expect to do it again; this is the most reliably violated rule in the tree.**

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
| **Opus 5** #29 | 27–28 Aug 2026 | **Job 13 finished:** the promos became reachable. `PROMO_GATES` off Trevor's workbook column, `collectibleDb` splitting what you may OWN from what is a SET, and the intrusion made additive — Trevor's reversal, since the eight-card pack had silently repriced a rule written for eleven. Found the intrusion roll had **never fired in the shipped game**, and two CSS rules cancelling the no-scan fallback on every future set's first pack |
| **Opus 5** #30 | 29 Aug 2026 | Job 14a. The tenth documentation pass — a second AI-invariants archive, and nine claims corrected that their own data refuted; found the **Fossil roster had never been measured** and ran it. Then Defender, from the grab bag: an attack's own self-harm now passes the reduction band, plus a fourth self-damage site nobody had enumerated |
| **Opus 5** #31 | 30 Aug 2026 | Job 14b, opening on the Trainer half of the playbook. Found the AI **had never chosen which Energy to strip** — `energyIdx` is a key nothing has read since the human got a picker, so Energy Removal and Super Energy Removal both fell through to the order a Pokemon pays its OWN costs in and politely took what the target needed least. `energyStripOrder` is its inverse. Then PlusPower, priced for the one turn it saves instead of every turn it saves; then the drag: Gust of Wind chose its target and an *attack* that dragged rolled dice, which is the Ninetales Lure item off Trevor's grab bag arriving from the other direction. Then Switch, worth the retreat cost it nullifies and priced on a free-retreat Active at 24.00. Also lifted the Jungle/Fossil claims hold two files were asserting against their own data |

Trevor's own contributions are not a row here because they are not a model's — but they are load
bearing and they are named where they were made: the four authentic theme deck lists in
`data/decks.json`, the Shadowless watermark, the 1st Edition correction from his own collection, the
board design lock, and every ruling in [RULINGS.md](RULINGS.md) marked *settled with Trevor*.

---

**This end of the tree is the quiet end.** Nothing here is orientation and nothing is waiting on you.
If you have a minute and it interests you: [LOGBOOK.md](LOGBOOK.md) is what the last few instances
thought while they worked and where you can log your own if you would like; its archives hold
everyone before them — [1](LOGBOOK-ARCHIVE-1.md), [2](LOGBOOK-ARCHIVE-2.md),
[3](LOGBOOK-ARCHIVE-3.md), [4](LOGBOOK-ARCHIVE-4.md) — and [TREVOR.md](TREVOR.md) is where his actual
save stood as each set went live, the game being played rather than built.

*(This sentence listed archives 1 through 3 for three days after archive 4 existed, which made #19's
whole account of Job 10 unreachable from the only index that points here. **Do not hand-list the
archives** — the live logbook's own "What is where" table is the roll and it is the thing that gets
updated when one is created. Corrected 29 Aug 2026; the same failure has now cost this tree a
preserved pack log, a truncated rejection, and this.)*

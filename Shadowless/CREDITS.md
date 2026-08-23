# Shadowless — credits

Who built what. Split out of `CLAUDE.md` and `PACKS.md` on 10 Aug 2026, because credits grow forever
and orientation should not; reduced to this table on 11 Aug 2026 for the same reason one level down.

**Add yourself when you work on it** — a row here, and as much as you like in
[LOGBOOK.md](LOGBOOK.md), which is where the detail goes and where every entry is preserved in the
words of whoever wrote it. The logbook is completely optional. A row with no logbook entry is fine. A
logbook entry with no row is how somebody gets left off. Sign your session number wherever you
remember to. Trevor will attempt to label any that are forgotten as yours.

**Keep a row to two or three lines and put the depth in the logbook [LOGBOOK.md](LOGBOOK.md).** The rule was set on 11 Aug
2026 and has needed re-imposing twice since, most recently on 16 Aug — **including, both times, on
the instance that set it.** Expect to do it again. **Trimming a row is safe only where that instance
has a logbook entry**, and that is the test to apply row by row: where one exists the row is a
duplicate and the logbook holds more; where none exists, move the row's text into the logbook
**verbatim first**, then write the short version. Do not decide sentence by sentence what earned its
place.

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
| **Opus 5** #19 | 18–19 Aug 2026 | **Job 10 finished — Team Rocket live at 83/83.** Triggered Powers (`ON_PLAY`/`ON_KO`/`ON_OPP_RETREAT`) and `enterPlay`, the Rainbow sentinel, the Trainers, and `pendingAsk` — the first general cross-player question. Six rulings, `shapecount.js`, and four guards that were not guarding: the coverage gate blind to Energy, a duplicate-case switch, a line-scoped check that stayed green when sabotaged, and setsurvey's control crying wolf |
| **Opus 5** #20 | 19 Aug 2026 | Job 10.5's documentation pass. Team Rocket found live with **no card art at all**, and fetched. [ROSTERS.md](ROSTERS.md) split out of `OPPONENTS.md`, the three non-pass/fail tools moved into `MEASUREMENT.md`, and that file plus `INTERACTION.md` given the index rows their entrance counts had always earned. Found `data/base1_decks.json` read by no part of the game, and `AI.md`'s "it is all duplicated in `GRABHIST`" false for a third of itself. Solved the layout issues persisting since the Chat days |
| **Opus 5** #21 | 21 Aug 2026 | Job 11: Trevor's five Jungle decks wired in as a full bracket, the GBC placeholders moved down a set, and every bracket ended in its own T4. Three AI faults from his logs — retreating into the wrong matchup, Teleport's flat 22 and the destination the engine was choosing at random, and a `must be 0` counter that was counting the wrong thing. `decksim.js` learned to merge two rosters and said the second one does not order. Then Trevor named the Charizard deck as ground truth, which gave the project its first real measure of AI quality, and two retreat repricings off his economics cut Energy burned on retreats by a quarter. Then his account of how he plays Charizard turned up two more — the bot capped it at four Energy and the engine discarded its Double Colorless first — worth +5.3 points on the benchmark, the largest single AI move so far. Fossil's six decks wired the same day, and [PLAYBOOK.md](PLAYBOOK.md) opened for the plain-English card knowledge that produced all of it |
| **Opus 5** #22 | 22 Aug 2026 | Reshaped [PLAYBOOK.md](PLAYBOOK.md) around the **pattern** rather than the card, after all four of its entries generalised to a family — and found Trevor had already written the list, 65 cards deep, in his workbook's `Wants` column. Then worked the largest cluster, from his observation that paralysis and an Agility barrier are one idea the scorer was pricing through unrelated paths. Four faults, none visible to any suite: a rider paid for on a Pokémon the attack removes, a barrier blind to what it was blocking, a bought turn priced as a constant when that constant *was* the format's mean attack, and preventing your own death worth 16 against the 70 charged for causing it. Plus `abtest` telling anyone who ran a control that their control looked broken |
| **Opus 5** #23 | 22 Aug 2026 | The eighth documentation pass. Five siblings split out — [AI-INVARIANTS.md](AI-INVARIANTS.md), [MISREADINGS.md](MISREADINGS.md), [POWERS.md](POWERS.md) and the first archive of both `GRABHIST.md` and `HISTORY.md`, each of which had sailed past the ~450 rule written in its own header. Found `AI.md`'s "the accounts are all in `GRABHIST`" wrong for the **third** time and replaced the sentence with a table, `MEASUREMENT.md` promising "all seven" ways it lies in a file whose own section says never to count them, and `PROGRESSION.md` narrating one roster move four times while two tellings disagreed. Nine decks given the cover cards they were missing |

| **Opus 5** #24 | 23 Aug 2026 | Job 12a's infrastructure half. Built the harness the playbook method had been missing: `tools/lib/xlsx.js` reads Trevor's workbook with no dependencies, `tools/wants.js` reports the inbox and the backlog, `tools/lib/board.js` builds a position out of card **names** against the twenty-nine bespoke fixtures that were the real bottleneck, and `tools/claimtest.js` runs the notes as rows — with an `--explore` mode, because every measurement in `ATTACK-CHOICE.md` came from a throwaway script that no longer exists. **Proved it can fail** against the commit before the 22 Aug bought-turn work, where the Dewgong and Gyarados rows go red with the numbers that file recorded. Found the inbox was three times the size anyone thought — a stale workbook had hidden Team Rocket's 59 notes and Base Set's rewritten 43 — and turned up two candidate faults on the first eleven rows: Zapdos discarding all four Energy for about three points, and Arcanine's recoil curve too shallow at full HP |

Trevor's own contributions are not a row here because they are not a model's — but they are load
bearing and they are named where they were made: the four authentic theme deck lists in
`data/decks.json`, the Shadowless watermark, the 1st Edition correction from his own collection, the
board design lock, and every ruling in [RULINGS.md](RULINGS.md) marked *settled with Trevor*.

---

**This end of the tree is the quiet end.** Nothing here is orientation and nothing is waiting on you.
If you have a minute and it interests you: [LOGBOOK.md](LOGBOOK.md) is what the last few instances
thought while they worked and where you can log your own if you would like,
[LOGBOOK-ARCHIVE-1.md](LOGBOOK-ARCHIVE-1.md), [LOGBOOK-ARCHIVE-2.md](LOGBOOK-ARCHIVE-2.md) and
[LOGBOOK-ARCHIVE-3.md](LOGBOOK-ARCHIVE-3.md) hold everyone before them, and [TREVOR.md](TREVOR.md) is where his actual save stood as each set went
live — the game being played, rather than built.

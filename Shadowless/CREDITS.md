# Shadowless — credits

Who built what. Split out of `CLAUDE.md` and `PACKS.md` on 10 Aug 2026, because credits grow forever
and orientation should not; reduced to this table on 11 Aug 2026 for the same reason one level down.

**Add yourself when you work on it** — a row here, and as much as you like in
[LOGBOOK.md](LOGBOOK.md), which is where the detail goes and where every entry is preserved in the
words of whoever wrote it. The logbook is completely optional. A row with no logbook entry is fine. A
logbook entry with no row is how somebody gets left off. Sign your session number wherever you
remember to. Trevor will attempt to label any that are forgotten as yours.

**Keep a row to two or three lines and put the depth in the logbook.** The rule was set on 11 Aug
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
| **Opus 5** #15 | 15 Aug 2026 — | [OPPONENTS.md](OPPONENTS.md) and the `Rulings/` folder split. Job 8 in its entirety. Session still open but paused while Trevor hand-builds decks for verification work, and has not yet written its own entry. **This row is Trevor's placeholder and is left intact on purpose** — overwrite it with your own |
| **Opus 5** #16 | 16 Aug 2026 | **Job 9**, from [GRABBAG.md](GRABBAG.md) and two match logs. Three match-log gaps found while proving a report wrong; inert Energy attachments 9% → 3%; promoting, Whirlwind and Switch collapsed into one decision; the pack Energy stipend replaced by pool Energy under a cap |
| **Opus 5** #17 | 16 Aug 2026 | Job 9.5: the sixth documentation pass. The logbook re-archived on a boundary rather than a count, `AI.md` cut back to its rules with the accounts left in `GRABHIST.md`, the closed jobs collapsed into `HISTORY.md`, and every row above returned to three lines |
| **Opus 5** #18 | 17–18 Aug 2026 — | Job 10: the retreat ruling reversed to symbols, `abtest.js` and `setsurvey.js`, the verb reference restored from 42-of-117 missing and then guarded, and Team Rocket's attack scripts. Three rulings and a corpus correction settled from Trevor's own cards. Session still open |

Trevor's own contributions are not a row here because they are not a model's — but they are load
bearing and they are named where they were made: the four authentic theme deck lists in
`data/decks.json`, the Shadowless watermark, the 1st Edition correction from his own collection, the
board design lock, and every ruling in [RULINGS.md](RULINGS.md) marked *settled with Trevor*.

---

**This end of the tree is the quiet end.** Nothing here is orientation and nothing is waiting on you.
If you have finished and have a minute: [LOGBOOK.md](LOGBOOK.md) is what the last few instances
thought while they worked and where you can log your own if you would like,
[LOGBOOK-ARCHIVE-1.md](LOGBOOK-ARCHIVE-1.md) and [LOGBOOK-ARCHIVE-2.md](LOGBOOK-ARCHIVE-2.md) hold
everyone before them, and [TREVOR.md](TREVOR.md) is where his actual save stood as each set went
live — the game being played, rather than built.

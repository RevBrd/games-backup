# Shadowless — credits

Who built what. Split out of `CLAUDE.md` and `PACKS.md` on 10 Aug 2026, because credits grow forever
and orientation should not; reduced to this table on 11 Aug 2026 for the same reason one level down.

**Add yourself when you work on it** — a row here, and as much as you like in
[LOGBOOK.md](LOGBOOK.md), which is where the detail goes and where every entry is preserved in the
words of whoever wrote it. A row with no logbook entry is fine. A logbook entry with no row is how
somebody gets left off.

| Model | When | What |
|---|---|---|
| **Opus 5** — Claude Chat | through 3 Aug 2026 | Jobs 1–4b: the rules engine, the AI, every Base Set card script, the art system, the UI, the module layout and the first smoke suite. The name "Shadowless". The ten snapshots are in `backups/pre-job4c/Claude Chat Version History/` |
| **Opus 5** | 4 Aug 2026 | Port into the collection, the naming, the data audit, `selftest.js`, the Node build port, the repo layout |
| **Opus 5** | 5–6 Aug 2026 | Job 4: Pokémon Powers and the Base Set oddities. Job 4g: the mat, the fitter, the title screen, the real card scans |
| **Opus 5** | 7–8 Aug 2026 | `tools/shot.js` and the DEV fit readout, the hand face, the mat's edge, the first documentation split |
| **Sonnet 5** | 7–9 Aug 2026 | `PACKS.md` end to end — the pack research, the rarity design and the rulings discussions, written in a parallel session. Five passes, each logged |
| **Opus 5** | 9 Aug 2026 | Job 5 start to finish: the collection model and save file, booster generation, the pack reveal, the variant renderers, the dex, export/import, the deck builder, two test suites |
| **Opus 5** | 10 Aug 2026 | The post-Job-5 documentation and interface pass: the doc tree split, and every screen Job 5 had left rough — collection, opening setup, starter pick, in-battle actions, Trainer pickers |
| **Opus 5** | 10–11 Aug 2026 | **Job 6 entire** — the plumbing, the passive-Power layer, all 126 Jungle and Fossil printings, ~37 new verbs, 13 Powers and Ditto. Also the AI verb coverage check, which found eleven Base Set verbs the bot had never scored |
| **Sonnet 4.6** | 10 Aug 2026 | Job 7 groundwork: `data/gbc_decks.json`, all 16 GBC opponent decks researched, verified to 60 cards and mapped to our set IDs, with a documented substitution table |
| **Opus 5** | 11 Aug 2026 | The post-Job-6 documentation pass: this file and [LOGBOOK.md](LOGBOOK.md), the Job 6 collapse into [HISTORY.md](HISTORY.md), four corrections where a doc pointed at working code and called it a gap, and `miniCard()`'s retirement, event logger v1.0 |
| **Opus 5** | 12 Aug 2026 | **Four turns, one instance.** The fourth documentation pass — [AI.md](AI.md) and [DATA.md](DATA.md) split out, the line target's unit settled, seven defects fixed including a table rendering broken and three sections filed under the wrong heading. Then a bug and UI pass: editing your theme deck no longer edits the opponent's, scroll position survives a render, the opening coin flip is shown, the visual effects stopped announcing a flip's result two seconds early, 1st Edition retuned to 1/20. Then `takeEnergy` — which Energy gets discarded becomes the player's choice across all seven effects that spend one, asked on the centre line and only when it is a real choice, with the ruling that a retreat cost is paid in cards rather than symbols. Then the match log's own defects: both Prize piles printing empty, a six-card opening hand, damage counting up while the board counts down, and a correction to the retreat ruling's stated source. Four entries in [LOGBOOK.md](LOGBOOK.md) |

| **Opus 5** | 12 Aug 2026 | **Job 7 entire** — progression and named opponents. `src/progress.js` and `data/ladder.json`, with brackets derived from the live-set list rather than declared, so a set going live adds one with no code change. The opponent screen, the payout moved off `homeSet()` (which is why Jungle and Fossil packs had been unreachable), free play, `tools/progresstest.js`, and a ladder section in `smoke.js`. Beforehand: repaired the Job 7 groundwork — ten card references onto live sets, and Ken's deck cleared of a defect it never had. Also two landmines found in passing, a silently narrowing `gen_cards.js` and a NUL byte inside the NUL-byte checker |

| **Opus 5** | 13 Aug 2026 | Maintenance from Trevor's playtest logs and [GRABBAG.md](GRABBAG.md). Confusion now flips on retreat and charges before it rolls, with the AI taught to price it. A deck name resolves to the deck deck select is offering — a blueprint and a built deck sharing the builder's default name had the tile drawing the wrong one and Play fielding a 41-card list. Then the AI: the retreat re-tune `AI.md` had been asking for since the 12-Prize repair, which turned out to be a curve rather than a number; Weakness and Resistance reaching the one forecast path that never called `computeDamage`; and DERIVED stickiness, so the bot leaves Kangaskhan and Snorlax in. Two harness faults found underneath all of it — `selftest.js`'s ladder gate asserting a statistical claim at a sample that could not carry it, and `aiduel.js` playing only the four Base Set decks, which made it blind to any change about the other five-sixths of the card pool |

Trevor's own contributions are not a row here because they are not a model's — but they are load
bearing and they are named where they were made: the four authentic theme deck lists in
`data/decks.json`, the Shadowless watermark, the 1st Edition correction from his own collection, the
board design lock, and every ruling in [RULINGS.md](RULINGS.md) marked *settled with Trevor*.

Trevor's save file progression log: [TREVOR.md](TREVOR.md)

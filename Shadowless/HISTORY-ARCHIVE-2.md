# Shadowless — the planning record

**Planning documents, after their plans.** A job plan entry written mid-job, and a struck-out item in
a live file's Open list, are the same species of text: correct in the present tense on the day, and
**actively misleading the moment the thing ships** — because a reader hits the header, sees
speculation, and treats a load-bearing system as a blank slate. [MAINTENANCE.md](MAINTENANCE.md)
calls that the highest-value target in the tree. This is where the text goes so the live file can
carry one line and a link instead.

[HISTORY.md](HISTORY.md) is the parent and holds what is still **argued about** — a rejection whose
idea can come back, with the reason it lost. This file holds what is finished. The build era, Jobs
1–10, is in [HISTORY-ARCHIVE-1.md](HISTORY-ARCHIVE-1.md).

Started 2 Sep 2026 by Shadowless 34 in Job 15c, when `HISTORY.md` was approaching the ~450 rule in its
own header and `CLAUDE.md`'s job plan had reached 105 lines of which 90 described jobs already done.

**Append-only. Correct an entry; never shorten one.** The 200-line target does not apply. **When this
file passes ~450, start `HISTORY-ARCHIVE-3.md`** — stated here, at the top, before the decision,
because three registers in this tree have now been found past a limit written only where it would be
read too late.

**Nothing here is needed to work on the game.** Read it when you want to know what somebody expected
before they found out.

## The job plans, as they stood while the jobs were open

*Moved out of `CLAUDE.md` on 26 Aug 2026 by #27, verbatim, when those five entries were collapsed to
two lines. Every one of them was written in the present tense by a session in the middle of the work,
which is exactly what makes them worth keeping and exactly what made them wrong to leave in an
orientation file — three said "what is left is X" about things that had since shipped.*

- **Job 10.5** - Scheduled post-new set maintenance. **The docs pass and the Base Set wiring are
  done** — Trevor's eight decks went live as the whole base1 bracket, the first built to
  [OPPONENTS.md](OPPONENTS.md). **What is left is the layout-related grab bag items.**
- **Job 11** - Major grab bag pass, AI and UI focused, add Trevor's new Jungle decks. **The Jungle
  and Fossil decks are in and live** — eleven hand-built decks across two brackets, body, gate and
  boss each, with the GBC placeholders pushed on to Team Rocket. Measured; neither new roster orders
  by tier and the report is in [ROSTERS.md](ROSTERS.md). **The AI half is well under way**: ten faults
  closed across three sessions, every one of them found by Trevor describing how a card is meant to be
  played rather than by any instrument — see [PLAYBOOK.md](PLAYBOOK.md), which is the method that
  produced them. **The UI half is untouched.** **The GBC placeholders left on Team Rocket are now gone
  too** — 25 Aug 2026, Job 12c/#26: Trevor's eight Team Rocket decks plus the two authentic Team Rocket
  theme decks replaced them, and this is the first roster measured where the tiers actually order
  cleanly. See [ROSTERS.md](ROSTERS.md#team-rocket--trevors-eight-decks-25-aug-2026).
- **Job 11.5** - Continued maintenance passes. We need to make the structure more load-bearing before we continue. *Job Closed*
- **Job 12a** - Continuing the AI pattern overhaul and testing behaviors. **It did need its own
  infrastructure and that half is built** — `tools/wants.js` reads Trevor's workbook, `tools/lib/board.js`
  makes a position out of card names, and `tools/claims/` holds the notes as rows. Proved by a control
  that goes red against the pre-fix commit. **The remaining work is claims**, and the backlog is a
  command rather than a number here: `node tools/wants.js --coverage`. Base Set first, and **Jungle and
  Fossil are on hold** — their notes are one-liners awaiting the same overhaul base1 and base5 got.
- **Job 12b** - Layout pass and then UI updates from GRABBAG.md. 
- **Job 12c** - Pack and rarity drop overhaul. **The pack shape and the bonus rare-tier jump mechanic
  landed 25 Aug 2026** — pack shrank from 11 cards to 8, and a lesser slot can now jump to a better
  tier at a small independent chance. **Rebalancing the four per-slot cosmetic axes (Reverse Holo,
  Shiny, Shadowless, Misprint) to restore the pre-shrink pacing is deliberately deferred**, tracked as
  its own open item in [PACKS.md](PACKS.md).

- **Job 13** - Wizards Black Star Promos. **Done, both halves** — the cards in 13a, reachability in
  13b. See [PACKS.md](PACKS.md) and [COLLECTION.md](COLLECTION.md).
- **Job 14a / 14b** - Document pass, grab bag, and the AI validation work. **14b is still open** and
  its live items are named in `CLAUDE.md`.
- **Job 15a** - The Challenge 1 bracket. **Done, 1 Sep 2026.** Seven mono-type decks between Fossil
  and Team Rocket, the first ladder bracket that belongs to no set, and the first pack type that is
  not a set's. What it left behind, beyond the feature:
  - **`bracket.set` was answering four questions and only two of them correctly**, which nothing had
    noticed because a set bracket gives the same answer to all four. `packSets` split the *pool*
    question off. Same shape as the `slot`-means-hero misreading in [PACKS.md](PACKS.md).
  - **Trevor's own correction to this file tree's plan.** `PACKS.md` had specified the Challenge pool
    as "the sets the player has unlocked", which reads the save at OPEN time — so a pack's contents
    would have depended on when you got round to opening it. He caught it from the player's side
    before any code existed. The built version derives from ladder position instead.
  - **A green suite went red on correct behaviour**, briefly and in the new tests themselves: an
    Energy-cap assertion written as `kind === 'energy'` caught 59 Double Colorless in 40,000 packs.
    `ENERGY_CAP` has only ever been about *basic* Energy. Kept as a comment at the assertion.
  - **`ROSTERS.md` crossed its own archive threshold** and the rule fired as written: Base Set and
    Jungle moved whole into `ROSTERS-ARCHIVE-1.md` at a set boundary.
- **Job 15b** - Rebalancing variant odds to match new pack sizes. **Now three items rather than one**
  — the four per-slot cosmetic axes, Base Set's bonus-Rare-tier near-tie, and what "richer" means for
  a Challenge pack. All three are in [PACKS.md](PACKS.md)'s Still open, deliberately bundled: they are
  measured against each other and tuning one alone loses track of which change did what.

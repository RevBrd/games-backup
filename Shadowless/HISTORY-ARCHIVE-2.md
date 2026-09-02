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

## PACKS.md's Still-open list, after the five items closed

*Moved out of [PACKS.md](PACKS.md) on 2 Sep 2026 by Shadowless 34, verbatim. Five of its six items
had shipped and each had kept its full body — about 77 lines of past tense sitting in a
present-tense list, which is the single largest instance of this shape found in the eleventh pass.*

**Why they were kept inline for so long, and why that instinct was right.** Every one of these
records something worth having: what a prediction got right, what it got wrong, and — in item 3's
case — **a latent bug that would have shipped**. The reasoning is the valuable half and deleting it
was never the option. What was wrong was only the *place*: an Open list is a work surface, and a
reader scanning it for what is still open had to walk five struck-out headings to find the one item
that is. The live file now carries a line each and a link here.

**Item 3 is the one to read if you only read one.** It is a worked example of a specification being
wrong in a way nobody could see from the code: this tree specified the Challenge pack's pool as *the
sets the player has unlocked*, read at the moment a pack is opened, so two packs of the same name
would have held different things depending on when you got round to them. Trevor caught it from the
player's side before a line was written.

2. ~~**Progression-gating the intrusion pool.**~~ **BUILT, Job 13b, 27 Aug 2026.** It went further
   than this item asked. The item wanted the pool to track the unlocked *era*; Trevor had already
   authored a gate per *card*, so it is gated per card instead — see "Which promos can actually
   intrude" above. The rest of the prediction held exactly: it needed nothing added to the save,
   because `unlockedSets` was already derived from `save.progress.beaten`.
   **The part nobody had noticed is that the intrusion had never fired at all.** `openPack` took an
   `opts.promos` pool, defaulted it to empty, and no caller ever passed one — so the 1-in-100 roll
   built in Job 5b was dead code in the shipped game for three weeks, in a suite-green tree. The
   guard that would have caught it is the one that now exists: `packtest.js` asserted the mechanism
   worked *when given a pool* and never asked whether anything gave it one. **A default that makes a
   feature inert is invisible to a test that supplies the argument.**
3. ~~**The Challenge pack — a pool of every card up to that point.**~~ **BUILT, Job 15a, 1 Sep 2026** —
   the pack exists, is earned, and opens. **The ODDS half is deliberately still open and is item 6.**
   The full description is in "The Challenge pack" above; what this item got right and wrong is worth
   keeping, because one of the two was a latent bug.

   **Right:** most of the machinery was already here. `buildPools` needed to learn an array, `openPack`
   already took `opts.pools`, and the save already keyed packs by an arbitrary string. It was a small
   job in `packs.js` and a smaller one in `ui.js`; the size of Job 15a was all in the *ladder*.

   **Right, and load-bearing:** a pack TYPE is not a set. A set code entering `liveSets` would give
   itself a ladder bracket, a dex section and a completion percentage. `challenge1` is not in
   `SET_INFO` and gets none of them, and its cards count toward their own sets' dexes, which is
   exactly the behaviour that makes it a good reward.

   **Wrong, and it would have shipped:** this item said the pool should be built from the sets *the
   player has unlocked*. That reads the save at the moment a pack is **opened**, so a Challenge 1 pack
   won before Team Rocket and opened after it would have quietly contained Team Rocket cards, and two
   packs of the same name would have held different things. **Trevor caught it before a line was
   written**, from the player's side rather than the code's — his framing was that a C1 pack should
   *already know* it holds Base, Jungle and Fossil. The fix keeps the derivation the tree prefers and
   changes only what it derives from: **ladder position, not save state.**
   *[The field it became →](PROGRESSION.md)*

   **The dilution question was answered on 21 Aug and the answer still holds.** A player chasing one
   specific card **re-battles the bracket that card's set belongs to** — the ladder already provides
   targeted chasing, because `winReward` pays in the bracket's own set and repeat wins pay full. So a
   Challenge pack is not competing with that. Its job is *better cards, any set*: slightly richer
   rarity odds, less chance of a specific card, higher chance of a good one. Nothing built yet delivers
   the "richer" half — see item 6.
4. ~~**Restoring the pre-shrink pacing on the four per-slot cosmetic axes.**~~ **DONE, 1 Sep 2026,
   Job 15b** — see the axes table above for the new values, the measurement and the three-column
   comparison. The old text is kept below because its *reasoning about the deferral* was right and is
   worth reusing: the reason to wait was to avoid tangling the retune with the jump mechanic that
   shipped the same day, and that is a good instinct that cost nothing and made this pass readable.

   ~~**Restoring the pre-shrink pacing on the four per-slot cosmetic axes.**~~ Reverse Holo, Shiny,
   Shadowless and Misprint each roll once per SLOT, so the 25 Aug 2026 shrink from 11 cards to 8
   thinned all four without anyone touching a value in `PACK_ODDS` — the before-and-after figures are
   in the verification paragraph above. **Deferred deliberately, Trevor, same day**: retuning them on
   top of the rarity-jump mechanic that shipped the same day would lose track of which change did
   what, so it waits until the new pack shape has actually been played. **Run `packtest.js` before
   trusting anything here** — its per-axis targets are DERIVED from `PACK_ODDS` + `PACK_SHAPE` now, so
   a wrong number means the derivation needs revisiting rather than the odds.
5. ~~**Base Set alone does not clear Reverse Holo with its bonus-Rare-tier rate.**~~ **DISSOLVED
   rather than fixed, 1 Sep 2026.** The comparison it was asking about is retired: restoring Reverse
   Holo puts it above the bonus-rare rate in *every* set, so Base Set stopped being the exception by
   the rest of the field joining it. **The underlying asymmetry is real and is small** — Base Set's
   floor removes 2 of its 5 Common slots from jump eligibility, so it runs 6.7% against everyone
   else's 6.9-7.0%, a gap of about 0.2 points. It was only ever alarming because it was being read
   against a moving target. `packtest.js` still prints it, now framed as base1-against-the-others
   rather than against Reverse Holo. **No nudge applied.** The original text follows.

   ~~**Base Set alone does not clear Reverse Holo with its bonus-Rare-tier rate**,~~ because the Energy
   floor removes 2 of its 5 Common slots from jump eligibility — mechanism and measurement both under
   "Bonus rare-tier jumps" above. Whether that is an acceptable Base-Set-is-already-the-exception
   outcome or wants its own nudge is Trevor's call. **It is a consequence of item 4 and should be
   decided in the same pass**, since any nudge to the four axes moves the comparison it is measured
   against.
6. ~~**What "richer" means for a Challenge pack.**~~ **ANSWERED, 1 Sep 2026: 4x the rarity jump and
   nothing else** — Trevor's proposal, taken as written. See "The Challenge pack" above for the
   measurement and for why this lever, alone among the candidates, produces no cosmetic spillover.
   **One thing was flagged in the same breath and NOT resolved**: the union's Energy share is 8.6%
   against Base Set's 15.8%, so a Challenge pack has no floor and most contain no Energy at all. That
   is defensible for a reward pack rather than a faucet, and it is still a consequence rather than a
   decision. It is the only open question left about this pack and it is small.

## AI.md's Open list, after items 4 and 10 closed

*Moved out of [AI.md](AI.md) on 2 Sep 2026 by Shadowless 34, verbatim. Both shipped in Job 14b and
both kept their full pre-build text underneath the strike-through, which is right — in each case the
original prediction was wrong in an instructive way and the entry says so.*

**Both are worth reading as a pair, because they fail in opposite directions.** Item 4 predicted a
coupling that was real and named the wrong function for it — the blocker sat one level higher than
the entry said, in the surplus rule rather than in `attachValue`. Item 10 predicted the wrong *kind*
of fix entirely: it pointed at a survival discount, and no discount could have worked, because the
road was being ranked on investment alone and a cheaper road is still the same road. The fix was in
the selection. **An open item is a hypothesis, and the useful ones are wrong in a way you can name
afterwards.**

**Item 4 also shipped on a measured NULL and said so**, which is the behaviour to copy rather than
the exception to explain away.

4. ~~**`evolve` cannot see readiness, and fixing that ALONE would make the bot worse.**~~ **BUILT
   28 Aug 2026, both halves in one commit, from Trevor's account of how the GBC game does it.** Evolve
   scored a flat **31.0** whether the target held one Energy or three; on the Vileplume case it now
   reads 15 / 23 / 31 / 31 as the Gloom is fed, and the bot evolves at **one Energy short of the
   evolution's cheapest attack** rather than as soon as it legally may.

   **The coupling this item warned about was real and the blocker was one level higher than predicted.**
   It named `attachValue` as the thing to fix; the actual refusal came from the **surplus rule** above
   it, which returns `attachSurplus` before `attachValue` is called at all. A Gloom on two Grass can
   pay for Foul Odor, so `noProgress` was true and the third Grass was refused at −2 no matter what
   `attachValue` thought. It took a fourth exception — *a Pokemon about to become something else is not
   paid up* — bounded by the evolution's own cost.

   **It reads as a NULL on win rate and it shipped anyway.** `aiduel 8 --gbc` against HEAD: no
   significant difference, `--control` likewise, so the null is real rather than a broken harness. The
   change does fire — 228,832 attachments became 229,737 over 17,672 ladder games. **Do not inherit
   "this helped" from the fact that it shipped.** *[The three grounds, and the two clauses of Trevor's
   note left unbuilt →](Playbook/EVOLUTION-TIMING.md)*

10. ~~**The evolution road cannot see whether its carrier will live to travel it.**~~ **BUILT 31 Aug
    2026, and not where this item said to look.** Kept because the wrong turning is the useful part:
    the item pointed at the survival DISCOUNT, and no discount could have fixed it — `evolutionRoadFor`
    ranks by investment alone, so a cheaper road is still the same road. The fix was in the
    SELECTION. And the "off-by-one" it named turned out to be a deliberate hedge whose removal flips
    three claim rows. *[Both, and the experiment →](AI-INVARIANTS.md)*

    The original text, for the reasoning that led there: **MEASURED 30 Aug
    2026, NOT BUILT, and the safe fix is not the obvious one.** Two Charmeleons on two Fire each, one
    Charizard in hand, a threat of 30: the road is worth **101.0 on an Active at 80 HP and 101.0 on
    the same Active at 10 HP**, while the healthy benched twin is passed over at 62.0. Sweeping the
    Active's HP from 80 to 10 never moves the number.

    Trevor's clause, 30 Aug: *"If a new Charmander is gained while it's fighting, the AI might shift
    its future evolution focus to that instead, if that one seems more realistic to get to its full
    evolution at full power."*

    **`survivesCharge` is already in that branch and returns 1**, because `turnsLeft =
    ceil(hp/threat)` counts the attack that **kills** you as a turn you survived — `ceil(10/30) = 1`
    against a shortfall of 1. The honest quantity is future turns of *mine*, `ceil(hp/threat) - 1`.
    **Do not just fix that line.** It is shared with `discardSilence`, where the same off-by-one is
    baked into the 23 Aug measurements, so correcting it re-tunes a shipped invariant. The local
    alternative is a filter in `evolutionRoadFor` beside its existing *"a ready copy steps aside"*
    rule — which touches nothing else but is a selection predicate on a quantity, in a function whose
    own comment warns in capitals that a flip-flopping leader is worse than no rule.
    **The two readings differ by two cards against every discard in the game; ask before picking.**
    *[The board, red on purpose →](tools/claims/base1.js)*

## CHALLENGES.md's Open list, after items 1 to 3 closed

*Moved out of [CHALLENGES.md](CHALLENGES.md) on 2 Sep 2026 by Shadowless 34, verbatim. All three
closed and each records something the closing did not obviously imply.*

**Item 1 is the one worth keeping.** It asked for "a flag saying whether a set is ladder content,
pack content, or both", and it closed **without ever getting one** — because a Challenge is not a set
with a flag saying it is not a set, it is a bracket that never had a set. Two different jobs, neither
aimed at this item, solved its two halves with two different mechanisms (`booster: false` and
`standalone: true`). **An item phrased around the wrong object cannot be closed as phrased**, and the
tell was that both halves resolved somewhere the item was not looking.

1. ~~**A set needs a flag saying whether it is ladder content, pack content, or both.**~~ **CLOSED —
   both halves, and by two different jobs neither of which was aimed at this item.** The
   *pack-not-ladder* half was Job 13's `booster: false` in `SET_INFO`, which is why `basep` never
   promoted itself to a bracket. The *ladder-not-set* half — the one this item called "the second and
   harder case" — was Job 15a's `standalone: true`. **Neither is a flag ON A SET**, which is why the
   item as phrased could not be closed: a Challenge is not a set with a flag saying it is not one, it
   is a bracket that never had a set. *[Both →](PROGRESSION.md)*
2. ~~**The rival problem is solved, and the answer is CHALLENGES 1–3.**~~ **CHALLENGE 1 IS BUILT**,
   1 Sep 2026, Job 15a — seven mono-type decks between Fossil and Team Rocket. The whole entry moved
   to [OPPONENTS.md](OPPONENTS.md) in the past tense, per this file's own rule at the top, and the
   ideas it discarded on the way went to [HISTORY.md](HISTORY.md) first.

   **What is left is Challenges 2 and 3, and they need no design.** Challenge 2 sits after Gym
   Challenge and Challenge 3 after Neo; both are a workbook of decks plus one `standalone` entry in
   `data/ladder.json` — no code. Two things to carry across rather than rediscover:

   - **Order the rungs by ascending featureWeight and then CHECK the pressure spacing.** Challenge 1's
     weight order happened to satisfy the no-consecutive-pressure rule as well. That was luck.
   - **`challenge2` is already a live promo gate** (`basep-21`, `-22`, `-23` — the three legendary
     birds), so building that bracket turns them on with no other change, exactly as `challenge1`
     turned four on.

   **Challenge 3 scales itself**: Neo prints Darkness and Metal, so it is bigger than Challenge 1
   without anyone tuning a number. Same property that makes the brackets derived.
3. ~~**What still has to be answered about a Challenge's leader.**~~ **Answered structurally, and the
   alternative is dead.** The old exit was "a leader's pool is every set you have unlocked at once"
   while everyone else is set-flavoured — which is what Challenge 1's whole *bracket* turned out to be,
   so it stopped being a way to distinguish the leader from the rungs beside them. What separates a
   leader now is position: seventh of seven, on a bracket that demands all six others first. **Nobody
   has played it end to end**, so this is a claim rather than a result. The "mostly Colorless" version
   is rejected and its reasoning is in [HISTORY.md](HISTORY.md).

## The job plan for Jobs 1 to 15b, as it stood when each one closed

*Moved out of `CLAUDE.md` on 2 Sep 2026 by Shadowless 34, verbatim. Its Job plan section had reached
105 lines of which **90 described jobs already done** — a quarter of the orientation file — while the
four genuinely forward-looking entries came to six lines between them.*

**These are not the same thing as the mid-job entries in the section above.** Those were written in
the present tense by a session inside the work and were wrong the moment it shipped. These were
written *after* each job closed, as a record of what it left behind, and most of them are accurate.
**They were still in the wrong file**, for a reason worth separating from correctness: `CLAUDE.md` is
read in full by every session, and a done job's findings are depth. The findings themselves each have
a home in the file that owns them — the promo intrusion in `PACKS.md`, the roster measurements in
`ROSTERS.md`, the invariants in `AI-INVARIANTS/` — and the live plan now names those instead.

**Job 6's entry is the one worth ten minutes before planning any set**, and it is why the collapse
kept a pointer rather than only a link: it was split by *machinery* rather than by set, and the
reason 126 printings came to only 95 distinct behaviours is the kind of count that decides how big a
job actually is.

- **Jobs 1–10 are done**, through Team Rocket live at 83 of 83 printings. **What each one left behind
  is in [HISTORY-ARCHIVE-1.md](HISTORY-ARCHIVE-1.md)**, and Job 6's entry is worth ten minutes before
  planning any set:
  it was split by *machinery* rather than by set, and the reason 126 printings were only **95 distinct
  behaviours** is the kind of count that decides how big a job actually is.
  **Two are still live as *documents* rather than as work.** Job 8's spec is now four built brackets
  in [OPPONENTS.md](OPPONENTS.md) and one unbuilt file in [CHALLENGES.md](CHALLENGES.md); Job 9
  continues wherever [GRABBAG.md](GRABBAG.md) has AI items in it, and the invariants it has left are
  in [AI.md](AI.md).
- **Jobs 10.5 through 12c are done.** Between them they wired all four brackets from Trevor's own
  hand-built decks, closed the layout faults that had been shifting the board since the Chat days,
  built the claims harness that turns his card notes into rows the bot is held to, and reshaped the
  pack. **What each one left behind is in [HISTORY.md](HISTORY.md)**; the live consequences are in the
  files that own them — [ROSTERS.md](ROSTERS.md) for what the rosters measured,
  [AI-INVARIANTS.md](AI-INVARIANTS.md) for what the AI work must keep true, [PACKS.md](PACKS.md) for
  the 8-card pack and the tier jump.
  **Two things from them are still open and both are named where they live**: Job 12a's claims
  backlog is a command rather than a number — `node tools/wants.js --coverage`. **The Jungle and
  Fossil hold is LIFTED** (Trevor, 30 Aug 2026): he went back through both in the full-paragraph
  style after Team Rocket's came back useful, and Fossil's notes are now the longest of the four
  sets. Two files were still fencing them off. **All four live sets are one pool** — and
  Job 12c deliberately deferred rebalancing the four cosmetic axes after the pack shrank, tracked as
  its own item in [PACKS.md](PACKS.md).
- **Job 12d** - Scheduled document pass and grab bag run. More UI, maybe more AI. **The docs pass is
  done** — three siblings and two archives split out, and four files found stating a fact their own
  data contradicted. See [CREDITS.md](CREDITS.md) #27.
- **Job 13 is done.** The Wizards Black Star Promos, `basep-1..28`, are written, ruled, scored and
  now **reachable**: gated per card off the ladder, pulled through the pack intrusion roll, kept in
  the binder and the dex, buildable with. The other 25 promos are a much later job. Two things it
  turned up are worth more than the feature — **the intrusion roll had never fired in the shipped
  game** (`openPack` defaulted its promo pool to empty and no caller ever passed one, invisible to a
  suite that supplied the argument), and **two CSS rules were quietly cancelling the no-scan
  fallback** on the pack screen for any set generated before its art was fetched. See
  [PACKS.md](PACKS.md), [COLLECTION.md](COLLECTION.md) and [INSPECTION.md](INSPECTION.md).
- **Job 14a** - Document pass, then grab bag UI/AI items. **The docs pass is done** — the tenth. The
  AI invariants got their second archive, nine claims were found stating something their own data
  refuted, and the **Fossil roster turned out never to have been measured at all** while two files
  said every roster had been. Running it produced the most useful thing the pass found: across three
  rosters in one field, **T4 decks are the best in the field at assembling their centrepiece and the
  worst at converting it** — 73% assembly against T3's 50%, for 48.7% wins against T3's 57.6%. That is
  an AI question and it is [ROSTERS.md](ROSTERS.md)'s. Stage 2 reliance was checked and is not the
  cause; a stronger first version of the claim was corrected the same day and both are recorded.
  See [CREDITS.md](CREDITS.md) #30. **The grab bag half has one item done** — Defender now blunts an
  attack's own self-harm and is used up if it spends its whole 20, a rules call settled with Trevor
  rather than a bug. It also turned up a fourth self-damage site the recoil ruling never enumerated.
  *[The ruling →](Rulings/DEFENDER-BLUNTS-SELF-HARM.md)*
- **Job 14b** - AI validation work, in [PLAYBOOK.md](PLAYBOOK.md)'s shape. **In progress.** #31 opened
  it on the Trainer half; #32 opened the **Over-Attach** pattern and wrote the first claims Jungle and
  Fossil have ever had. The printed damage number is a *function of the Energy attached* for sixteen
  printings and all three places reading it in printed units were wrong — plus `maxSpare` sitting in
  the engine and not the scorer since Job 6, and three Base Set cards printing a cap **neither** half
  had. *[The pattern →](Playbook/OVER-ATTACH.md)* · *[the two guards, and the three green tests that
  were measuring an impossible threat →](AI-INVARIANTS.md)*
  Then, off Trevor's question about whether to hand-enter per-card Energy targets: **an evolution
  road is measured to the attack the evolution is trying to REACH, not the cheapest one it owns.**
  Derived rather than tagged, 22 printings move, and **eight of his own notes confirm it without any
  of those cards being named in the code** — the strongest argument in this tree for deriving over
  tagging. *[The rule, the curve and the eight →](Playbook/EVOLUTION-TIMING.md)*
  Then, on his account of the GBC and Pocket turn order: **the plan is the whole LINE and each
  evolution step pays for one of its own Energy** — an Abra wants two with a Kadabra coming and
  **one** with an Alakazam behind it, which is the thing no per-card target could express. And a
  **ready** evolve now goes before the attachment, so the card competes for the Energy as the body
  that will hold it.
  **CLOSED 2 Sep 2026** (Trevor), and both debts it left were settled in Job 15c: the invariants
  register became the `AI-INVARIANTS/` directory rather than being archived again, because the entry
  had outgrown the shape twice refused for it. The AI validation work is **not** finished and is not
  meant to be — it is sprinkled through later jobs rather than blocking on one. The live backlog is
  `node tools/wants.js --coverage`, never a number here.
- **Job 15a is done.** The **Challenge 1 bracket** is live — seven of Trevor's mono-type decks, one
  per Energy type, sitting between Fossil and Team Rocket. **It is the first ladder bracket that
  belongs to no set and the first pack type that is not a set's**, which is the whole of the job:
  the decks were free, the surgery was `bracket.set` turning out to answer four different questions
  with only two of them right. `packSets` split the pool question off, derived from **ladder
  position** rather than from the save — Trevor's correction, and it closed a latent bug this tree had
  specified for three weeks, where a Challenge pack's contents would have depended on when you got
  round to opening it. **Ronald is gone from the ladder** (his grab-bag ask) and the `extra` mechanism
  he occupied was kept and re-tested against a fixture. Four `challenge1`-gated promos turned on with
  no code at all. *[The bracket →](OPPONENTS.md)* · *[the machinery and `bossAfter: 'all'`
  →](PROGRESSION.md)* · *[the pack →](PACKS.md)* · *[what it measured →](ROSTERS.md)*
- **Job 15b is done.** All three bundled items closed. **The four per-slot cosmetic axes are back at
  their pre-shrink pacing** — each scaled by the slots it lost, Reverse Holo by 10/7 and the rest by
  11/8, measured at 1-in-10.0 / 40.5 / 194 / 952 against targets of 10.4 / 40.4 / 200 / 1000. **Base
  Set's bonus-Rare-tier "near-tie" dissolved rather than being fixed** — the comparison it was made
  against moved, and the residual asymmetry is 0.2 points. **A Challenge pack rolls the rarity jump at
  4x and changes nothing else**, Trevor's proposal: a bonus Rare-tier card in 25.9% of packs against
  6.9%, and 1.281 Rare-tier cards per pack against 1.070. That lever turns out to be the only
  candidate with **no cosmetic spillover** — Shadowless came out at 201 against 199 in 40,000 packs a
  side, and Reverse Holo went *down*, because a jumped card is Rare-tier and so ineligible for it.
  **One ordering rule was retired rather than preserved** and the reasoning is in `PACK_ODDS`; say so
  if you disagree, because it is one line. *[Everything, with the three-column comparison
  →](PACKS.md)*

## Two closed sub-items out of AI.md's Open list

*Moved out of [AI.md](AI.md) on 2 Sep 2026 by Shadowless 34, verbatim. Both sat INSIDE items that are
still open, which is why they survived the earlier sweep — a struck-out heading is easy to spot, a
closed paragraph three levels down inside a live item is not. **`AI.md`'s Open list was 176 lines of
448**, and a list nobody can scan is a list that stops being read.*

### The reserve clause, out of item 8

**The most reusable thing in it: the item was written about a CARD and the answer was about a SLOT.**
Three cards were named as asking for "something prices holding an attack in reserve" and all three
left by different doors when Trevor was actually asked. Standing still to bank an Energy is a thing a
**Bench** does; an Active that declines to swing pays a turn of damage for it. A note that does not
say which slot it is about can be true in one place and wrong in the other.

   ~~**One clause survives and it is worth naming, because three cards ask for it rather than one.**~~
   **RESOLVED 30 Aug 2026, and there was never a family.** The clause was *nothing prices holding an
   attack in reserve*, and it named Arcanine, Ninetales and Charmeleon. **Asked, and all three left by
   different doors:**

   - **Ninetales was never a reserve case.** *"Never be required to choose between Lure and nothing"*
     is about not being **Active** without Fire Blast — entry, not holding. Trevor, 30 Aug. Its Lure
     half is separately closed by `bestDragTarget`.
   - **Charmeleon is lookahead**, open item 9(c) above, and has been all along.
   - **Arcanine is a SLOT question, and the row was asking for the opposite of what he wants.**
     Trevor, 30 Aug: *"An Arcanine in the active spot with 3 energies should probably attack anyway,
     if pausing for a turn to gather energies would result in a net negative... But on the bench, the
     AI shouldn't want to stop powering it up at Flamethrower, and always continue on to Takedown."*
     **Both halves measured as already correct** and are now claim rows.

   **The transferable part: the item was written about a CARD and the answer was about a SLOT.**
   Standing still to bank an Energy is a thing a Bench does; an Active that declines to swing pays a
   turn of damage for it. A note that does not say which slot it is about can be true in one place
   and wrong in the other, and this one was.
   *[How a note becomes a row →](PLAYBOOK.md)* · *[the harness and its control →](TOOLING.md)*

### The three measured arms, out of item 9

**Kept because the measurements are the reason the item is scoped the way it is**, and re-deriving
them costs a 17,672-game run. The short version that stayed live: misrouting is effectively solved at
0.26%, the scarcity arm is real and near-inert, and the lookahead arm is half built. **The neighbouring
quantity is 27x larger than the one that was measured** — 7% of attachments go onto an Active that
dies before spending them — and that is where anyone hunting waste in the attach decision should look.

   The original entry, still accurate: **MEASURED 28 Aug 2026. Two of its three halves
   are done or would do nothing, and this item exists mainly to stop it being re-scoped as one large
   job.** It is the capability [Ammo](Playbook/AMMO.md)'s Charmeleon and Arcanine notes and
   [Evolution timing](Playbook/EVOLUTION-TIMING.md) all name as their blocker. Trevor's sentence
   decomposes into three and they are in very different states.

   **(a) Misrouting — putting the card on the wrong slot. Effectively solved: 0.26%.** `aitest.js 8
   --gbc`, **17,672 games and 228,832 attachments**: 605 misdirected, one attachment in 380. The
   per-slot competition through `attachValue` already routes correctly. **Read that null carefully,
   because it is partly tautological** — the bot picks the highest-scoring action, so this counter can
   only fire where the *score* disagrees with a `short`-based notion of need. It says the scoring is
   internally consistent. It cannot say the routing is *strategically* right, and no local counter can;
   that is only answerable by outcome, so any change here needs `aiduel`/`decksim` rather than a
   counter going down. *[Why the small probe that found it read zero →](MISREADINGS.md)*

   **And the neighbouring quantity is 27x larger.** 7% of attachments go onto an Active that dies
   before spending them and 1% onto one that could not attack anyway — 15,117 and 2,462 against
   misdirection's 605. `survivesCharge` already discounts for this and 7% still get through. Whether
   that is waste or simply what attaching under pressure looks like is **unmeasured**, and if anyone
   goes hunting for waste in the attach decision, that is where it is.

   **(b) Holding the card when Energy is scarce — real, and near-inert at ~0.1% of attachments.** Only
   1.4% of attachments score under 6 at all, and 2 of 1,540 were made with six or fewer Energy left in
   hand and deck. Scarcity is real at the tail — 8.4% of attachments happen with ≤6 left, a tenth of
   games end with one or none — but when Energy is scarce the bot is nearly always attaching it
   somewhere that matters. **Build it for correctness if you like; do not expect it to move a win
   rate, and do not read a null from `aiduel` as evidence it failed.**

   **(c) Attaching toward a card not yet in play — HALF BUILT.** *"This Charmeleon is worth four Fire
   because a Charizard is coming"* is expressible now, but **only while the Charizard is in hand**:
   `evolutionInHand` plus `potentialAs` give the scorer one card of lookahead, and only where the plan
   is a certainty rather than a probability — which is the arm Trevor's GBC account weights much
   higher anyway. *[Both halves, the null they shipped on, and why →](Playbook/EVOLUTION-TIMING.md)*

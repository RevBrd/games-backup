# Shadowless — what an opponent is made of

The **content** of the ladder: what separates a tutorial opponent from a champion, and what a deck
has to specify before somebody can build one. [PROGRESSION.md](PROGRESSION.md) is the **machinery** —
brackets, unlocks, `winReward`. If you are wiring the ladder you want that file; if you are deciding
what goes *in* a rung, you want this one.

Read it when adding a set's roster or hand-building an opponent deck. **It was written for the
auto-builder, which was deferred indefinitely on 29 Aug 2026** — so its intended consumer is gone and
its actual one is a person with a spreadsheet, which is who has built every live bracket anyway.
*[Why, and what the deferral cost this file →](HISTORY.md)*

**Every live bracket is built to this spec and it survived.** Base Set's eleven rungs went in on
19 Aug 2026, Jungle's seven and Fossil's ten on 21 Aug, Team Rocket's ten on 25 Aug, Challenge 1's
seven on 1 Sep — every one of them from decks Trevor hand-made or authentic WotC theme decks. Job 8
wrote the spec on 15 Aug 2026; this file has been past tense since the fourth roster landed.
**Build the next one against the ones that exist**, not against the tables below, and expect the
tables to move as more brackets do. **`data/ladder.json` is the roll**; do not count them here.

**The unbuilt half moved out on 25 Aug 2026 — [CHALLENGES.md](CHALLENGES.md)**: entry conditions,
the pressure vocabulary and its no-repeat rule, the Challenge brackets that replaced the rival, and
the open questions those three carry. Not one of them is built, and keeping them beside the shipped
rosters was making a reader walk through a hundred lines of speculation to reach the part that works.
**Names, dialogue, gimmick rules and story are an explicit non-goal here** and are deferred to a
detailing pass; the reasoning is over there.

**Which set has hand-authored decks is the thing to check, and it is not a fact about this file.**
Trevor, 22 Aug 2026: the GBC decks are **placeholders, and any of them can fill any gap** — they are
not a tier, a bracket or a roster, and where a particular one currently sits is not worth tracking or
writing down. A bracket uses them only until that set's own decks are authored. **As of 25 Aug 2026
every live set has its own**, so the eight GBC club masters that had been standing in for Team Rocket
retired rather than moving on; `data/gbc_decks.json` keeps all sixteen on file regardless, and the
four Grand Masters still hold Fossil's T1 intro because Fossil's own theme decks are not in `data/`.
**`data/ladder.json` is the answer**, and two paragraphs in this tree disagreed about it before the
question was retired. *[The live roster, and the one-line command that prints it →](PROGRESSION.md)*

**If you rewrite a section here, move its rejections to [HISTORY.md](HISTORY.md) first.** Several
claims below record an idea that was proposed and dropped *with the reason it lost*, which is the
only thing stopping it coming back.

## The four tiers

Silent. These are the internal classes; the on-brand labels ("Club Member", "Champion") map on top
later and change nothing mechanical. That separation is the same one that makes the brackets derived
rather than declared, and it is what keeps the detailing pass a *labelling* job.

| Tier | Construction | Prizes | AI |
|---|---|---|---|
| T1 | A theme deck or its equivalent. Two types, no engine, too much Energy | 2 | novice |
| T2 | Multi-type, coherent, few or no Stage 2 lines | 4 | expert |
| T3 | Built around **one** Stage 2 line plus support. Openers that can hold the Active spot | 6 | expert |
| T4 | A centrepiece that **is** an engine or **needs** one, plus a second axis under it | 6 | expert |

**The prize count is not a difficulty dial — it is an archetype selector.** Match length decides which
decks can function at all: a 2-Prize game ends before a Stage 2 line assembles. Anyone who
"rebalances" a tier by nudging its Prizes is changing which decks can exist there, not how hard they
are.

**MEASURED 18 Aug 2026, and it is right at one end and wrong at the other.** The short end of the
claim holds exactly as written; the long end does not, and assigning T4 the *longest* games is the
part with evidence against it. **The table is kept as it stands anyway**, because changing it moves
every deck and because the spread has a design reason measurement cannot see.
*[The numbers, both arguments, and Trevor's →](ROSTERS.md)*

Two consequences that follow from it and are not obvious:

- **Short games are high-variance.** Fewer Prizes means fewer draws means the weaker deck steals more
  games. That is wanted at T1 (quick, forgiving) and unwanted at T4 (long, skill decides), so both
  ends happen to point the right way. The dial is doing three jobs — length, archetype, variance —
  and they agree by luck rather than by design. Do not assume the third one when you move it.
- **Prizes stay symmetric.** Asymmetric counts (they need 6, you need 4) were considered and
  declined: it is unfaithful to the ruleset and it makes one number on screen mean two things.

**T3 versus T4 is the line most likely to collapse, so it is defined structurally rather than by
adjective.** "Stronger cards" is not a tier, it is bigger numbers. Not all Stage 2s are the same
card: Beedrill is an attacker, Blastoise is an *engine wearing a Stage 2*, and a Basic like Moltres
is a wincon that demands an engine to pay for it. So:

> **T3 is one thing done well. T4's centrepiece either IS an engine or NEEDS one, and something else
> in the deck answers that.** Rain Dance feeding a second attacker; Energy Trans under a wall; a
> Trainer lock running beneath the beatdown.

That is testable, it is what actually separated a good WotC-era deck from a theme deck, and it gives
the auto-builder a rule rather than a vibe.

**Refined 18 Aug 2026 against Trevor's built Base Set roster, and the refinement matters: an engine
CARD is not an engine DECK.** Base Set prints four engines — Rain Dance, Energy Trans, Energy Burn,
Damage Swap — and the roster spreads them across T2, T3, T3 and T4 rather than reserving them for the
top. Alakazam sits in a T2 deck with three draw cards and will almost never assemble; Charizard sits
in the T4 with eight draw-and-search, four Double Colorless and two Energy Retrieval, and will. **The
same card is a different tier depending on whether the deck can find and power it.** So the operative
question is not *does the centrepiece need an engine* but *can this deck reliably get there*.

### What the rosters measured, and where they disagree

**Every roster built to this spec has been played by `tools/decksim.js` from both seats**, and
several have also met each other in a merged field. **The standings, the assembly rates and every
number behind the claims below are in [ROSTERS.md](ROSTERS.md), one section per roster** — that file
is the evidence and this one is the spec, and the numbers deliberately live in exactly one of them.

*(**This paragraph has now gone stale twice in the same way and the second time is the instructive
one.** It first said all four rosters had been measured while Fossil never had, closed 29 Aug 2026 by
running Fossil rather than by softening the claim — and the fix ended with the instruction* "if you
add a roster, grep this file for 'four'". *Job 15a then added Challenge 1, and nobody grepped:
**seven sentences here still said "four" on 2 Sep 2026, with this file's own Challenge 1 section
sixty lines below them.** A warning aimed at a future reader is only as good as the moment it is
read, and the moment it needed to be read was inside a different job. **So the counts are gone rather
than corrected** — the roll is `data/ladder.json` and `ROSTERS.md`, both checkable, neither prose.)*

What the spec learned:

- **Consistency, not power, is what climbs.** Higher tiers run *less* Energy and *more* Trainers, and
  the shape repeated across two independently built rosters. That is the one part of the recipe now
  supported by something other than construction, and it is what to aim at when building the next one.
- **The recipe is a recipe and not evidence.** Trevor was tracking all five axes while building, so
  they agree by construction. `decksim.js` is the only instrument that can disagree with them.
- **The T2/T3 boundary separates in two rosters of four.** Real in Base Set and clean in Team Rocket;
  it does not reproduce in Jungle or in Fossil. Jungle's failure had a candidate cause — one row of
  the recipe, draw-and-search, inverting between the tiers — and **Fossil kills that explanation as a
  general one**: its recipe is monotone on all six axes, more widely separated than any other roster's,
  and its tiers still do not order. **Do not respond by tuning the recipe.**
- **The T4 boundary is the one that has now been measured as a CLASS rather than a deck at a time, and
  it does not hold.** Base Set's boss finished eighth of eight and Jungle's ninth of thirteen, both
  inside their own T2 band; Team Rocket's finished **first** in its own field. In a merged
  nineteen-deck run of the first three rosters, **all three of their bosses land within 2.8 points of
  each other and all three sit below every roster's best T3** — 49.9 / 49.2 / 47.1 against a T3
  average of 57.6. One roster could not say that; three can. **Do not "fix" it by weakening the T3
  decks**, which are the part that works.
- **T4 decks are the best in the field at ASSEMBLING and the worst at CONVERTING** — mean assembly
  73% against T3's 50% and T2's 40%, for a mean win rate of 48.7% against T3's 57.6%. The bosses
  arrive, reliably and on time, and then do not win. **That is an AI question, not a deck question**,
  and it is the most concrete thing this spec's rosters have produced.
  *(Stated as a level difference between tiers on purpose. The first version of this bullet said
  assembly and winning were **anti-correlated**, off the three bosses alone; across all fourteen decks
  that have a centrepiece the correlation is **+0.31**, and it is +0.60 within T2 and +0.76 within T3.
  Assembling helps. **Corrected the same day it was written**, which is the only reason it is worth
  the parenthesis — a three-point correlation is not a correlation.)*
  *[The tables, the correction, and the Stage 2 hypothesis this killed →](ROSTERS.md)*
- **One clean run is not the spec vindicated**, and the file holding the numbers says so first: it
  was measured with the same bot that was last shown playing the whole field badly, so it is one data
  point pointing the right way rather than a result that survives the AI improving.
- **A pressure that arrives on time can still fail to convert.** Jungle's T4 has the best assembly
  rate in the whole field and finishes ninth of thirteen. **Nobody has measured whether Status Lock is
  worth less than it looks or whether the bot cannot press it** — a better question than rebalancing
  the deck. The pressure vocabulary itself is in [CHALLENGES.md](CHALLENGES.md).
- **Every standing above was measured with a bot we know plays the field badly**, which is why none
  of it has been acted on. Trevor's call, 21 Aug 2026, and it still stands.

**featureWeight is not comparable across rosters.** Each workbook scales its own decks relative to each
other — Jungle had more weight to distribute, because Base Set opened evolution lines that Jungle
finishes. It is an ordering within one workbook, not a unit.

### The AI is two tiers, not four — and that is probably fine

`expert` and `novice` are the only ladder-appropriate settings. `greedy` (damage-only) and `random`
are **measurement baselines**, and the whole difference between the two real ones is one branch in
`pickBest` — novice adds ±6 of score noise and takes the second-best *sensible* line 22% of the time.

**So the AI cannot be the dial that separates T2 from T3 from T4.** It separates T1 from everything
above it, and that is all. Every other rung of difficulty comes from deck construction, prize count
and entry conditions.

**Do not treat that as a gap to be closed before this can ship.** Trevor's position, 15 Aug, and the
reasoning is good: deck quality may well carry the whole spread on its own, and if it does not, the
existing shape extends almost for free — the novice/expert difference is *a noise constant*, so a
third and fourth tier are a numbers change rather than an architecture change. The structure is
already the right shape for an outcome we have not had to decide yet. Build the decks first and find
out whether the AI needs to move at all.

**`greedy` is retained on purpose and is not dead code.** Trevor proposed deleting it in an earlier
session; it stayed because `selftest.js` and `smoke.js` drive games with it. If it ever *is* wanted as
a difficulty setting, it is already there. See [HISTORY.md](HISTORY.md).

## The rung pattern, and what scales with it

A bracket runs **intro → body → gate → boss**, in that order, and the shape is the same every time so
that a player learns to read it once:

| Segment | Tier | Count | Purpose |
|---|---|---|---|
| Intro | T1 | **flexes** | The set's **official theme decks**. Beatable with the deck you walked in with |
| Body | T2 | **flexes** | Ease in and accumulate. Still winnable on last set's deck |
| Gate | T3 | **flexes** | The first rung that requires a deck built from this set |
| Boss | T4 | **always 1** | Unlocks the next bracket |

**Every tier except the boss flexes, and the boss is always exactly one.** Trevor, 19 Aug 2026,
revising this table's own earlier claim that intro was fixed at 2 — the built Base Set bracket has
**four** intro rungs and is the model, so the fixed count was wrong before it ever met a set.

**Two inputs decide a tier's size: the card pool, and pacing.** Base Set at 102 printings earns the
long version; a small set earns the short one. That is the honest answer to fill-rate — a small set
produces fewer rungs, so fewer packs, so a bracket cannot outrun its own card pool — but **pacing
overrides it where the two disagree.** How the ladder feels at that point in the game is the senior
argument.

**T1 is the set's official theme decks, and that is what makes it T1** rather than a difficulty
band. It is a source rule, not a count: the rungs are however many that set printed. **The exception
to expect is a set with an unreasonable number of them**, which gets trimmed rather than granted a
twelve-rung intro. Exceptions where exceptions need to happen.

**None of the above is settled and Trevor says so explicitly: the four-tier shape is the current
DRAFT.** What makes it usable now is that there is a worked model rather than a specification — four
live brackets, built from decks he hand-made for the purpose. **Build the next one against those, not
against this table**, and expect the table to move as more brackets exist.

**There used to be a release valve here and it has been withdrawn — say so rather than leaving the
sentence.** This file argued that a good auto-builder would pad a bracket short of authored decks,
which is what made a flexible tier size affordable across fourteen sets. **Trevor deferred the
auto-builder indefinitely on 29 Aug 2026**, to the phase-two bundle with dialogue and art, on two
grounds: it cannot be trained on strategy until the AI is further along, and its only customer was
opponent decks, which he is hand-building anyway.

**So a bracket short of authored decks is simply short, and that has to be fine.** The rung pattern
already flexes everywhere except the boss, and a small set is supposed to earn a small bracket — the
argument is one paragraph up and does not depend on the valve. **What still works today is the crude
version**: `deckgen.js` backfills any roster entry whose deck will not resolve, and a bracket is never
shorter than `bossAfter`, so the ladder cannot dangle. See [PROGRESSION.md](PROGRESSION.md).
*[The deferral, both reasons, and what this argument lost →](HISTORY.md)*

**Length is a stated goal, not a side effect.** The GBC game was too short and turned into re-battle
grinding once the champions fell; that is the failure mode being designed against. A long ladder is
the intent.

**This pattern is not invented here.** Both the GBC game and TCG Pocket structure their opponent
progressions this way, so the blueprint is in front of us and the open work is plugging cards into a
known shape rather than proving the shape. That is also the reason to be suspicious of any future
proposal to restructure it: the burden is on the new idea.


## The Challenge brackets, and the one that is built

**Challenge 1 shipped on 1 Sep 2026, Job 15a** — seven mono-type decks between Fossil and Team
Rocket, one per Energy type, all Trevor's. It is the rival, solved: not a person you beat but a
**round** you clear, which is what two revisions of the rival entry had been circling without
landing. This section is the past-tense half; [CHALLENGES.md](CHALLENGES.md) keeps Challenges 2 and 3
and the two mechanisms still unbuilt.

**Where it sits and what it pays.** After Fossil, before Team Rocket — so beating Fossil's boss no
longer opens Team Rocket, it opens the Gauntlet, and the Gauntlet's boss opens Team Rocket. It
belongs to no set and pays in a **Challenge pack**, drawn from every booster set before it.
*[The machinery →](PROGRESSION.md)* · *[the pack →](PACKS.md)*

**It breaks the rung pattern on purpose, and that is the finding.** No intro, no body, no gate: all
seven rungs are T4 and every one of them is a boss-tier deck. Trevor, 1 Sep 2026, on why — *"it would
really make the round feel like a boss round overall"*. So `intro → body → gate → boss` is a **set
bracket's** shape rather than the ladder's, and this is the first evidence that the distinction is
real rather than pedantic. A Challenge is a different kind of object and gets a different shape.

**`bossAfter` is `'all'` here**, so every one of the six falls before the seventh appears. Trevor
wants that to become the default at every tier; it is per bracket for now because flipping it re-gates
four shipped brackets against a live save.

**Mono-type is the whole design and it is the only place on the ladder that is.** Weakness is ×2 in
this era, so a Challenge is the one round where *build a counter-type deck* is dramatically right —
and the player has to decide whether to build ONE deck that survives all seven or rebuild between
them. No other rung asks that, and it is a decision rather than a difficulty.

**It scales itself.** Challenge 3 sits after Neo, which prints Darkness and Metal, so it is bigger
than Challenge 1 without anyone tuning a number — the same property that makes the brackets derived.

**Two things that were flagged as risks and how they actually came out.**

*"One per type may need to mean one LED by each type."* Trevor's worry was that a strict mono-Lightning
deck before Neo would be thin, producing one weak rung for reasons that have nothing to do with design.
**It did not happen.** Every one of the seven is a genuine 60-card build and the Lightning deck is
*fourth* of seven on featureWeight. The weakest by weight is Grass at 16.5 and the weakest by play is
Grass again at 33.8%, so nothing about the type wheel produced a dud rung.
*[The measurement →](ROSTERS.md)*

*(This paragraph named Fire at 20.2% as the weakest by play, on the day, off a run made with the
wrong Energy in the deck — 24 Fighting where 24 Fire was meant, which stranded twelve of its Pokémon.
Trevor found it by playing the deck, within hours of reading the standings. Fixed and re-measured the
same day: Fire is **second** at 57.1%. Corrected rather than quietly rewritten, because the wrong
version is the one a reader would find plausible.)*

*"A Challenge bracket cannot exist as the code stands."* True when written, and the fix was one branch.
The consequence that mattered was the one this predicted for the right reason: **combined packs are not
flavour on top of the idea, they are forced by the structure** — there is no single set for a Challenge
to pay in.

**The rung ORDER is derived rather than chosen**, which is worth copying for Challenges 2 and 3:
ascending featureWeight, which for these seven *also* satisfies the no-consecutive-pressure rule —
SL, WP, AP, BD, SL, WP, and the boss alone on HD. Two constraints, one ordering, no compromise.
Do not assume that luck repeats; check it.

**The boss is Colorless (Wigglytuff), on featureWeight 21, the highest of the seven.** Trevor's call,
and he flagged it as provisional: *"putting together a really good deck that doesn't significantly
repeat a previous one was a challenge."*

**Play disagrees with the weight, and the gap WIDENED once the Fire deck was fixed.** Wigglytuff
finishes fourth of seven at 48.1%, below the field average; Water finishes first at 78.1%, twenty-one
points clear of second in a field where the next five sit inside nine points of each other. **Water
being that far out is not explained**, and it is the live question this bracket leaves behind. Not a
reason to move the boss on one run — a mono-type round-robin is a weak instrument here, for reasons
[MEASUREMENT.md](MEASUREMENT.md) now spells out — but not something to let go quiet either.
*[The standings →](ROSTERS.md)*

**What still has no answer, carried over from the rival entry this replaced:** what makes a Challenge
*leader* tougher than an ordinary T4. The old exit was "mostly Colorless", which was a deck constraint
pretending to be a difficulty requirement and is now dead — Wigglytuff leads a Colorless deck because
it is the strongest of seven, not because Colorless is what a leader plays. The current answer is
structural and may be enough: **a leader is seventh of seven, behind six T4 decks, on a bracket that
demands all of them.** Nobody has played it end to end yet.

## Open

1. **The player-facing Prize selector is going away** on the ladder, keeping the tier dial from being
   opt-out. It survives in free play, which is a relic of the early build rather than a design.
   Trevor's call, 15 Aug 2026.
2. **Every set bracket reads intro → body → gate → boss and nobody has walked one end to end.** That is
   still the cheapest remaining test of this whole document, and it is the one nothing here can do
   for itself: `decksim.js` plays the rosters against each other and cannot tell you how the ladder
   *feels* from the seat of somebody climbing it. Report where the spec does not survive contact.
3. **Everything else this file used to hold as open is in [CHALLENGES.md](CHALLENGES.md)**, because
   all of it was about a bracket's *demands* rather than a deck's *construction*.

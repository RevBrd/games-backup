# Shadowless — what an opponent is made of

The **content** of the ladder: what separates a tutorial opponent from a champion, what a deck has to
specify before somebody can build one, and what the player must bring to be allowed at the table.
[PROGRESSION.md](PROGRESSION.md) is the **machinery** — brackets, unlocks, `winReward`. If you are
wiring the ladder you want that file; if you are deciding what goes *in* a rung, you want this one.

Read it when adding a set's roster, hand-building an opponent deck, or working the auto-builder
(Job 11), which is the consumer this was written for.

**Status: design, and TWO brackets are now built to it.** Job 8, 15 Aug 2026, worked out with Trevor;
Base Set's eleven rungs went in on 19 Aug and Jungle's seven on 21 Aug. Everything about
*naming, entry conditions, pressure assignment and the rival* is still unbuilt. It is the target
the set jobs build against, and it is deliberately about *parameters* rather than card lists — the
lists come per-set, when we can see what the set actually offers. **When a section here ships, rewrite
it in the past tense and say where it lives.** A planning document that outlives its plan is the
nastiest thing in this tree: specific, confident, and wrong. See [MAINTENANCE.md](MAINTENANCE.md).

**And when you rewrite a section, move its rejections to [HISTORY.md](HISTORY.md) first.** This file
carries several ideas that were proposed and dropped *with the reason each one lost*, which is the
only thing stopping them coming back. They would otherwise die with the paragraph around them.

**Explicit non-goal: names, dialogue, gimmick rules and story.** Trevor's call — those come in a
detailing pass after every set is in, so that nothing here has to be unpicked when the fiction
arrives. Excluded on purpose, not forgotten.

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

**MEASURED 18 Aug 2026, and it is right at one end and wrong at the other.** 2 → 4 Prizes is
worth **+10.7 points** to a T3 deck, so the short end of the claim holds exactly as written; 4 → 6 is
worth **nothing** to any deck measured, and runs **backwards** for the T4. So the table's 6 for T3 and
T4 is one length too long, and assigning T4 the *longest* games is the part with evidence against it.
**Kept in the table until a roster is rebuilt against it**, because changing it moves every deck — and
because the spread has a design reason measurement cannot see. *[Both, with the numbers →](ROSTERS.md)*

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

### What the second roster measured, and where it disagrees

**Jungle's five decks do not order by tier.** Its T2 Eevee deck finishes second of thirteen in a merged
field with Base Set's eight; its T3 finishes eleventh and its T4 ninth. So the T2/T3 boundary that Base
Set verified **did not reproduce**, which is the first time this spec has been contradicted by the same
instrument that confirmed it.

Three things worth carrying forward, all with the evidence in [ROSTERS.md](ROSTERS.md):

- **The recipe's Energy-down / Trainers-up shape repeated across two independently built rosters.** That
  is the part of the recipe now supported by something other than construction.
- **The one row that did NOT repeat is the one the gate loses on.** Jungle's T3 runs five draw-and-search
  cards against a T2 in the same roster running six — the only inversion in either file. Base Set's T3s
  ran 6 and 7 against a T2 band of 3 to 4. If a single number explains the standings, it is that one.
- **A pressure that arrives on time can still fail to convert.** Jungle's T4 lands Vileplume in 78% of
  games at a median of turn 16 — the best assembly rate in either roster — and finishes ninth of
  thirteen. That is not the Base Set T4's problem (Charizard at 45%, turn 17) wearing different colours;
  it is the opposite, and **nobody has measured whether Status Lock is worth less than it looks or
  whether the bot cannot press it.** Better question than rebalancing the deck.

**featureWeight is not comparable across rosters.** Jungle runs 9 / 12 / 16 against Base Set's 7–7.5 /
10–10.5 / 12.5, because Jungle had more weight to distribute — Base Set opened evolution lines that
Jungle finishes — and Trevor scaled its five decks relative to each other. It is an ordering within one
workbook, not a unit.

### What the first roster measured

Trevor's eight Base Set decks are the only roster that has ever met this spec, and `tools/decksim.js`
played them against each other from both seats. Three findings; the evidence for each is in
[ROSTERS.md](ROSTERS.md) rather than here.

- **The T2/T3 boundary is real** — the win-rate bands do not overlap. That is the first
  externally-verified claim this file ever had, and it says the tier vocabulary describes something a
  player will actually feel.
- **The T4 boundary is not.** The boss finishes sixth of eight, inside the T2 band. Its Charizard
  lands in only 45% of games, so it is a fast deck wearing a slow deck's clothes. **Do not "fix" this
  by weakening the T3 decks** — they are the part that works.
- **Consistency, not power, is what climbs.** Higher tiers run *less* Energy and *more* Trainers.
  That is the recipe to aim at when building the next roster, and it is five axes wide.

**The recipe is a recipe and not evidence**, which is the trap in it: Trevor was tracking all five
axes while building, so they agree by construction. `decksim.js` is the separate instrument that can
disagree with them, and it is the only one. *[The table, the standings, the assembly rates and what
the Prize count is worth →](ROSTERS.md)*

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
DRAFT.** What makes it usable now is that there is a worked model rather than a specification —
Base Set's live bracket, built from decks Trevor hand-made for the purpose. **Build the next one
against that, not against this table**, and expect the table to move as more brackets exist.

**The auto-builder is the release valve.** If Job 11 gets deck generation good enough, a bracket
short of authored decks can be padded with generated opponents rather than left thin — which is what
makes a flexible tier size affordable at fourteen sets. See [PROGRESSION.md](PROGRESSION.md) for how
a generated challenger already works today.

**Some live sets get no bracket at all.** Southern Islands and the promos are *sprinkled into packs*
rather than laddered — Trevor, 15 Aug. That is a real change to Job 7's derivation, which currently
produces one bracket per live set: a set needs a flag saying whether it is ladder content, pack
content, or both. Cheap now, irritating later.

**Length is a stated goal, not a side effect.** The GBC game was too short and turned into re-battle
grinding once the champions fell; that is the failure mode being designed against. A long ladder is
the intent.

**This pattern is not invented here.** Both the GBC game and TCG Pocket structure their opponent
progressions this way, so the blueprint is in front of us and the open work is plugging cards into a
known shape rather than proving the shape. That is also the reason to be suspicious of any future
proposal to restructure it: the burden is on the new idea.

## Entry conditions — one mechanism, three uses

Three separate ideas turned out to be the same object, and unifying them is the main structural call
in this document. **A rung carries zero or more constraints on the deck you bring**, checked against
the deck list before the match, with no engine involvement:

| Kind | Example | Used for |
|---|---|---|
| Minimum from a set | "at least 12 cards from Fossil" | The T3 gate and the T4 boss, scaling up between them |
| Minimum of a type | "at least 10 Grass cards" | Late rungs and optional challenges |
| A construction ban | "no Stage 2 Pokémon", "max 20 Energy" | Optional challenge re-battles |

One concept for the deck validator, one input for the auto-builder, one thing for the player to
learn. **Add a fourth kind rather than a fourth mechanism.**

**Why the set-minimum sits on T3 *and* T4 rather than only at the bracket boundary.** The first
version of this document put one gate on the boss, reasoning that a player arriving at T3 has already
banked eight-to-twelve packs of the set and would satisfy any sane requirement incidentally. That
conflated *owning* with *playing*. Owning thirty Fossil cards does not put one of them in the
Charizard deck you have been carrying since Base — and a working deck gives its owner every reason to
leave it alone. **The gate is on deck composition, so it fires every time regardless of collection
size**, and scaling it between T3 and T4 makes it fire twice per bracket.

**Trevor's read, and it has a source rather than being an instinct: this is what the modern TCG
Pocket game does.** Worth recording, because the argument against it is genuinely plausible — it is
the one I made — and "a shipped game does this and it works" is the evidence that settles it.

**The constraints are crude on purpose, and gaming them is fine.** A player can satisfy "12 Fossil
cards" by stuffing in twelve bad Fossil commons. Twelve dead cards in sixty is a real cost, so they
have traded deck quality for access, which is a genuine decision, and it self-corrects because they
will want those twelve to be good. Policing "meaningfully uses" is unbuildable and would be worse.
The **type** constraint is stronger still: if a late rung demands ten cards of a type that is *weak
to* what you are about to face, then complying badly IS the handicap. It cannot be gamed, because
satisfying it is the cost.

**None of it can soft-lock**, which is what makes it safe: `winReward` pays `packsPerWin` on every
win including repeats, so a player short of a requirement can farm any opponent they have already
beaten. Verified in `progress.js`, not assumed.

**Every number here is a tunable in `ladder.json`'s `defaults`, and none of them can be set today.**
They have to be measured against real pull rates from real play — Trevor's own save is the
instrument. Start conservative. A gate set too high does not lock anybody out; it turns the game into
a grind, which is the same damage arriving slowly.

## Pressure tags

Tier says how *strong* a deck is. It does not say what the deck *does to you*, and that is the half
that makes a player rebuild. Two T3 decks "built around a Stage 2 line with support" can play
identically. What forces a new deck is meeting one that punishes something yours has no answer to.

So an opponent deck **may** carry a **pressure tag**, independent of tier. **The vocabulary below is
derived from the DSL rather than invented** — each one is a real family of verbs in `effects.js`, which
is what makes `tools/pressure.js` able to count them:

| Pressure | What it does to you | Verb family |
|---|---|---|
| Energy denial | strips the investment you already made | `DISCARD_DEF_ENERGY`, `T_DISCARD_OPP_ENERGY` |
| Bench damage | your safe cards are not safe | the `BENCH_SNIPE` / `BENCH_SPLASH` family |
| Position control | you fight with the wrong Pokemon | `WHIRLWIND`, `SWITCH_DEFENDER_*` |
| Status lock | it takes your turns away | `STATUS*`, `TOXIC`, `ATTACK_LOCK`, `JAM_DEFENDER` |
| Hand / Trainer denial | your outs stop arriving | `NO_TRAINERS_NEXT_TURN`, `T_LASS` |
| Wall / prevention | your damage stops landing | `PREVENT_*`, `DAMAGE_REDUCTION*`, `BARRIER`, `HARDEN` |
| Attrition / recovery | it refuses to run out | `ENERGY_FROM_DISCARD`, `HEAL_SELF_*` |

**Deck-out is not on that list and deliberately so.** Nothing in this era mills a deck — there is no
verb for it, because no card does it. Deck-out is what a *wall* deck does to you by refusing to supply
a clock, so it is a property of a **deck** and never of a card. Tag it on the roster entry if a deck
earns it; do not go looking for cards that produce it.

The rule that makes it work:

> **The gate and the boss must not share a pressure with each other or with anything in the body,
> and no two body rungs in a row may share one.**

That is what turns eight opponents into eight opponents rather than one opponent getting bigger, and
it is a specifiable request for Job 11 in a way "make it harder" is not: *build a T3 Water deck whose
pressure is Energy denial.*

**The first draft of this rule said simply "a bracket may not repeat a pressure tag", and it was
unsatisfiable.** A bracket runs 7–10 rungs against a vocabulary of seven, so the rule failed
arithmetic before it ever met a card. The version above binds where it actually matters — the rungs a player
remembers are the gate and the boss, and consecutive sameness is what makes a body feel like one
opponent — and it is satisfiable at every bracket length. **T1 intro decks carry no pressure tag at
all**; they are theme decks, and having no identity is the identity.

**Count a set's pressures before authoring its roster, and count them with `pressure.js` rather than
by reading the cards.** Each set has a fingerprint — Base Set is status and walls with almost no bench
damage, Fossil is the bench damage set, Jungle prints no Energy denial at all — so a roster that
ignores it asks a set for something it cannot supply, and the length of a bracket is partly a fact
about how many distinct pressures its set can field. **Do not quote a figure here from memory**: an
earlier version of this paragraph said Base Set supported "about three", which came from eyeballing
the Trainer pool and missed that attacks create pressure too. *[The tool, and what it will not tell
you →](MEASUREMENT.md)*

**So this file owns the vocabulary and the no-repeat rule; each set job picks its own tags from what
it actually has.** Trevor's correction and the right one — we use what the set gives us rather than
forcing a schedule onto it. The vocabulary is not a closed list either; it may grow with the era.

**"No pressure — straight beatdown" is a legitimate and common state**, and the no-repeat rule
constrains only the decks that carry a tag. In Trevor's built Base Set roster exactly one deck has a
strong pressure identity — the T3 Water deck, at five disruption cards against one or two everywhere
else — and the rest are honest beatdown. That is the right outcome for a first set.

The tags are also the natural seed for the detailing pass — an opponent whose deck strips your Energy
writes their own personality — which is a bonus, not a reason.

## What a win pays

**Record ratios, never counts.** Pack size may drop to ten cards, and every absolute in an outline
becomes a lie the moment it does.

| Rung | Pays |
|---|---|
| T1 intro | ½ a standard win — it is a faucet, not a reward |
| T2 / T3 | 1 standard win |
| T4 boss | 1, and **1.5 on the first victory only** |
| Rival | 2, sets chosen at random without repeats |

**Repeat wins pay full, which makes farming optimal and dull.** The fix is optional **challenge
conditions on re-battles** — an entry condition of the third kind, for a better reward. That turns
the re-battle loop from grinding into a decision, and it reuses the mechanism above rather than
inventing one. What the better reward *is* — richer pack odds, or a differently-named pack — is a
[PACKS.md](PACKS.md) question and is not settled here. Note it is not a tuning change: a pack with
different odds is a new pack **type**.

**Two things were proposed here on 15 Aug and dropped the same day, for the same shape of reason:**
paying out free play by chosen Prize count, and gating the main line on dex completion %. Both would
fund the collection from something that is not a decision. **Free play still pays nothing** and **dex
% is a good unlock for the optional challenge tier and a bad one for the main line.**
*[Both arguments in full, so neither comes back as a fresh idea →](HISTORY.md)*

## Open

1. **The player-facing Prize selector is going away** on the ladder, keeping the tier dial from being
   opt-out. It survives in free play, which is a relic of the early build rather than a design.
   Trevor's call, 15 Aug.
2. **A set needs a flag saying whether it is ladder content, pack content, or both.**
   `buildLadder()` currently derives exactly one bracket per live set, and Southern Islands and the
   promos are to be *sprinkled into packs* rather than laddered — See [PACKS.md](PACKS.md) Cheap now,
   irritating once eleven sets are in.
3. **The rival problem is solved, and the answer is CHALLENGES 1–3.** Trevor's proposal, 21 Aug 2026,
   arrived while he was building the Fossil decks. Three special brackets — **after Fossil, after Gym
   Challenge, and after Neo** — each one **an opponent per Energy type, with the strongest of them as
   its overall boss.** Names, personalities and any story are deferred to the detailing pass as usual.

   **Take it.** It does four things at once and none of them is a compromise:

   - **It makes the rival a ROUND rather than a person**, which is what the entry below had been
     circling for two revisions without landing. A boss you beat is a wall; seven you must beat is a
     campaign, and it is the natural home for the combined-pack reward.
   - **It is the only mono-type situation on the whole ladder**, and in this era Weakness is ×2. So a
     Challenge is the one place where "build a counter-type deck" is dramatically right — and the
     player has to decide whether to build ONE deck that survives all seven or rebuild between them.
     No other rung asks that, and it is a decision rather than a difficulty.
   - **It scales itself.** Challenge 3 sits after Neo, which prints Darkness and Metal, so it is bigger
     than Challenge 1 without anyone tuning a number. Same property that makes the brackets derived.
   - **It is where entry conditions finally have a reason to exist.** The mechanism above is specified
     and unbuilt because nothing needed it yet. "Beat the Fire challenger with no Water in your deck"
     is exactly the optional-challenge shape, and it fits a Challenge better than it fits a T4.

   **Two things to watch, neither fatal.**

   **A Challenge bracket belongs to NO SET, and the ladder is set-indexed.** `buildLadder()` derives
   exactly one bracket per live set and `winReward()` pays in the bracket's own set — so as the code
   stands today a Challenge bracket cannot exist and could not pay if it did. That is the second and
   harder case of open item 2 below. **The consequence is worth stating because it validates the
   design**: combined packs are not flavour on top of the idea, they are *forced* by the structure —
   there is no single set for a Challenge to pay in. See [PACKS.md](PACKS.md); a differently-composed
   pack is a new pack **type**, not a tuning change.

   **"One per type" may need to mean "one LED by each type."** A mono-Lightning deck before Neo is
   thin, and a strict reading would produce one weak rung per Challenge for reasons that have nothing
   to do with design. Trevor will feel this while building; the fix is to loosen the rule rather than
   to force the deck.

4. **What still has to be answered about a Challenge's leader**, carried over from the rival entry
   this replaced: what makes them *tougher than a T4* without leaning on "mostly Colorless", which is a
   deck constraint fighting a difficulty requirement. The exit recorded before fits the new shape better
   than the old one — **a leader's pool is every set you have unlocked at once** while everyone else is
   set-flavoured. Under Challenges that is nearly free, because a Challenge already sits outside the
   set-per-bracket structure. Ronald is the placeholder until this exists.

5. **The spec is now playable across two brackets and nobody has walked either.** Base Set's eleven
   rungs went in on 19 Aug 2026 and Jungle's seven on 21 Aug — intro → body → gate → boss both times.
   The cheapest remaining test of this whole document is somebody playing them end to end and
   reporting where it does not survive contact. **Entry conditions are still not built**, so no rung
   carries one. **Pressure tags now exist as data and are still not read by anything**: Trevor's Jungle
   workbook carries a per-card Pressure column, `data/base2_decks.json` derives a deck-level tag from
   it by copy count, and three of the five decks earn one — the T4 is Status Lock overwhelmingly, one
   T2 is Wall/Prevention, and the rest are honest beatdown. **Trevor's key extends the vocabulary above
   with two more: HD (High Damage) and BD's neighbour BG (Bench Growth).** The no-repeat rule has never
   been checked against a real bracket because until now there was nothing to check it with.

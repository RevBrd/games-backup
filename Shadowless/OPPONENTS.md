# Shadowless — what an opponent is made of

The **content** of the ladder: what separates a tutorial opponent from a champion, what a deck has to
specify before somebody can build one, and what the player must bring to be allowed at the table.
[PROGRESSION.md](PROGRESSION.md) is the **machinery** — brackets, unlocks, `winReward`. If you are
wiring the ladder you want that file; if you are deciding what goes *in* a rung, you want this one.

Read it when adding a set's roster, hand-building an opponent deck, or working the auto-builder
(Job 13), which is the consumer this was written for.

**Status: design, and ALL FOUR live brackets are now built to it** — Base Set's eleven rungs on
19 Aug 2026, Jungle's seven and Fossil's on 21 Aug, and Team Rocket's ten on 25 Aug, all from decks
Trevor hand-made or authentic theme decks against this spec. Job 8, 15 Aug 2026, worked out with him.
Everything about *naming, entry conditions, pressure assignment and the rival* is still unbuilt. It is
the target the set jobs build against, and it is deliberately about *parameters* rather than card
lists — the lists come per-set, when we can see what the set actually offers. **When a section here
ships, rewrite it in the past tense and say where it lives.** A planning document that outlives its
plan is the nastiest thing in this tree: specific, confident, and wrong. See [MAINTENANCE.md](MAINTENANCE.md).

**Which set has hand-authored decks is the thing to check, and it is not a fact about this file.**
Trevor, 22 Aug 2026: the GBC decks are **placeholders, and any of them can fill any gap** — they are
not a tier, a bracket or a roster, and where a particular one currently sits is not worth tracking or
writing down. A bracket uses them only until that set's own decks are authored. **As of 25 Aug 2026
every live set has its own**, so the eight GBC decks that had been standing in for Team Rocket retired
rather than moving on — `data/gbc_decks.json` keeps all sixteen on file regardless, four Grand Masters
and four Ronalds still assigned elsewhere. `data/` is the answer; two paragraphs in this tree disagreed
about it before the question was retired.

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

Three rosters have been built to this spec and two have been played against each other by
`tools/decksim.js`, from both seats. **The standings, the assembly rates and every number behind the
claims below are in [ROSTERS.md](ROSTERS.md), one section per roster** — that file is the evidence and
this one is the spec, and the numbers deliberately live in exactly one of them.

What the spec learned:

- **Consistency, not power, is what climbs.** Higher tiers run *less* Energy and *more* Trainers, and
  the shape repeated across two independently built rosters. That is the one part of the recipe now
  supported by something other than construction, and it is what to aim at when building the next one.
- **The recipe is a recipe and not evidence.** Trevor was tracking all five axes while building, so
  they agree by construction. `decksim.js` is the only instrument that can disagree with them.
- **The T2/T3 boundary is real in Base Set and did not reproduce in Jungle.** That is the first time
  this spec has been contradicted by the same instrument that confirmed it, and the likely cause is one
  row of the recipe — draw-and-search — inverting between the two tiers.
- **The T4 boundary is not real in either.** Both bosses finish inside their own T2 band. **Do not
  "fix" this by weakening the T3 decks**; they are the part that works.
- **A pressure that arrives on time can still fail to convert.** Jungle's T4 has the best assembly rate
  in the whole field and finishes ninth of thirteen. **Nobody has measured whether Status Lock is worth
  less than it looks or whether the bot cannot press it** — a better question than rebalancing the deck.
- **And every standing above was measured with a bot we now know plays the field badly**, which is why
  none of it has been acted on. Trevor's call, 21 Aug 2026.

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
DRAFT.** What makes it usable now is that there is a worked model rather than a specification — three
live brackets, built from decks he hand-made for the purpose. **Build the next one against those, not
against this table**, and expect the table to move as more brackets exist.

**The auto-builder is the release valve.** If Job 13 gets deck generation good enough, a bracket
short of authored decks can be padded with generated opponents rather than left thin — which is what
makes a flexible tier size affordable at fourteen sets. See [PROGRESSION.md](PROGRESSION.md) for how
a generated challenger already works today, and Open item 2 below for the sets that want no bracket
at all.

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

**The set-minimum sits on T3 *and* T4, not only at the bracket boundary, because owning is not
playing.** The first version gated only the boss, on the reasoning that a player reaching T3 has
banked enough packs to satisfy any sane requirement incidentally — true, and beside the point.
Owning thirty Fossil cards does not put one of them in the Charizard deck you have been carrying
since Base, and a working deck gives its owner every reason to leave it alone. **The gate is on deck
composition, so it fires regardless of collection size**, twice per bracket. Trevor's read, with a
source rather than an instinct behind it: it is what TCG Pocket does, and a shipped game doing it is
what settles an argument that was genuinely plausible both ways.

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

| Code | Pressure | What it does to you | Verb family |
|---|---|---|---|
| `ED` | Energy denial | strips the investment you already made | `DISCARD_DEF_ENERGY`, `T_DISCARD_OPP_ENERGY` |
| `BD` | Bench damage | your safe cards are not safe | the `BENCH_SNIPE` / `BENCH_SPLASH` family |
| `PC` | Position control | you fight with the wrong Pokemon | `WHIRLWIND`, `SWITCH_DEFENDER_*` |
| `SL` | Status lock | it takes your turns away | `STATUS*`, `TOXIC`, `ATTACK_LOCK`, `JAM_DEFENDER` |
| `HT` | Hand / Trainer denial | your outs stop arriving | `NO_TRAINERS_NEXT_TURN`, `T_LASS` |
| `WP` | Wall / prevention | your damage stops landing | `PREVENT_*`, `DAMAGE_REDUCTION*`, `BARRIER`, `HARDEN` |
| `AP` | Attrition / recovery | it refuses to run out | `ENERGY_FROM_DISCARD`, `HEAL_SELF_*` |
| `HD` | High damage | it hits harder than you can absorb | — **deck-level, see below** |
| `BG` | Bench growth | it builds reserves faster than you can race — **Trevor has widened this** to cover drawing cards and buying turns through quick evolution or extra attachments | — **deck-level, see below** |
| — | Deck-out | it refuses to supply a clock | — **deck-level, see below** |

**The two-letter codes are what the data actually holds** — `pressure` in `data/base2_decks.json` and
`data/base3_decks.json` is a code, and until 23 Aug 2026 it was decodable nowhere in this repo. The
key lives in the workbook's Index tab; this table is the copy the code can be read against. **Where a
card lists more than one, the FIRST has priority** — Trevor's rule, and the copy-count derivation
relies on it.

**The last three have no verb family and that is the distinction to preserve.** The seven above them
are derived from the DSL, so `pressure.js` counts them and the answer cannot drift from the cards.
These three are properties of a **deck**: nothing in this era mills, no verb means "hits hard", and a
bench that grows is a curve rather than an effect. **Tag them on the roster entry; never go looking
for cards that produce them.** HD and BG are Trevor's, from his workbook key, and the vocabulary is
not a closed list — it may grow with the era.

The rule that makes it work:

> **The gate and the boss must not share a pressure with each other or with anything in the body,
> and no two body rungs in a row may share one.**

That is what turns eight opponents into eight opponents rather than one opponent getting bigger, and
it is a specifiable request for the auto-builder in a way "make it harder" is not: *build a T3 Water
deck whose pressure is Energy denial.*

**The first draft said simply "a bracket may not repeat a pressure tag", and it was unsatisfiable** —
7–10 rungs against a vocabulary of seven fails arithmetic before it ever meets a card. The version
above binds where it matters: the rungs a player remembers are the gate and the boss, and consecutive
sameness is what makes a body feel like one opponent. **T1 intro decks carry no pressure tag at all**;
they are theme decks, and having no identity is the identity.

**Count a set's pressures before authoring its roster, and count them with `pressure.js` rather than
by reading the cards.** The profiles are sharply different, so a roster that ignores one asks a set
for something it cannot supply, and the length of a bracket is partly a fact about how many distinct
pressures its set can field. **Do not quote a figure from memory**: an earlier version of this
paragraph said Base Set supported "about three", which came from eyeballing the Trainer pool and
missed that attacks create pressure too. *[The tool, each set's profile, and what it will not tell
you →](MEASUREMENT.md)*

**So this file owns the vocabulary and the no-repeat rule; each set job picks its own tags from what
it actually has.** Trevor's correction and the right one — we use what the set gives us rather than
forcing a schedule onto it.

**"No pressure — straight beatdown" is a legitimate and common state**, and the rule constrains only
the decks that carry a tag. In every built roster so far a minority of decks have a strong pressure
identity and the rest are honest beatdown, which is the right outcome. The tags are also the natural
seed for the detailing pass — an opponent whose deck strips your Energy writes their own personality —
which is a bonus, not a reason.

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

5. **The spec is playable across three brackets and nobody has walked any of them.** Base Set, Jungle
   and Fossil all read intro → body → gate → boss. The cheapest remaining test of this whole document
   is somebody playing them end to end and reporting where it does not survive contact.
   **Entry conditions are still not built**, so no rung carries one.
6. **Pressure tags exist as data and are read by nothing.** Trevor's workbooks carry a per-card
   Pressure column, `gen_cards.js` derives a deck-level tag from it by copy count, and a minority of
   decks earn one — the rest are honest beatdown, which is the right outcome. **Trevor's key extends
   the vocabulary above with two more: HD (High Damage) and BG (Bench Growth).** The no-repeat rule has
   never been checked against a real bracket, and now there are three to check it with.

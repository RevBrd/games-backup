# Shadowless — what a bracket ASKS of you, and who is waiting at the end

**The unbuilt half of the ladder's design.** Three things live here and they belong together because
each one exists to serve the next: **entry conditions** (what your deck must contain to sit down),
**pressure tags** (what stops eight opponents being one opponent getting bigger), and the **Challenge
brackets** — the round of mono-type opponents that replaced the rival, and the only place either of
the other two has a real reason to exist yet.

[OPPONENTS.md](OPPONENTS.md) is the parent and is the **built** half: the four tiers, the rung
pattern, and what four live rosters measured against them. Split out of it on 25 Aug 2026 because
every one of those sections now describes something that shipped, and a reader coming for *how a deck
is built* was walking through a hundred lines of speculation to reach it.
[PROGRESSION.md](PROGRESSION.md) is the machinery.

**Status: none of this is built.** The pressure vocabulary exists as data and is read by nothing;
entry conditions are specified and no rung carries one; the Challenge brackets cannot exist as the
code stands, and the reason why is written into their own section. **When a section here ships,
rewrite it in the past tense, move it to `OPPONENTS.md`, and say where it lives** — a planning
document that outlives its plan is the nastiest thing in this tree, and this file is the whole
outstanding stock of it. See [MAINTENANCE.md](MAINTENANCE.md).

**And when you rewrite a section, move its rejections to [HISTORY.md](HISTORY.md) first.** Several
ideas below were proposed and dropped *with the reason each one lost*, which is the only thing
stopping them coming back. They would otherwise die with the paragraph around them.

**Explicit non-goal: names, dialogue, gimmick rules and story.** Trevor's call — those come in a
detailing pass after every set is in, so that nothing here has to be unpicked when the fiction
arrives. Excluded on purpose, not forgotten.

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

1. **A set needs a flag saying whether it is ladder content, pack content, or both.**
   `buildLadder()` currently derives exactly one bracket per live set, and Southern Islands and the
   promos are to be *sprinkled into packs* rather than laddered — See [PACKS.md](PACKS.md) Cheap now,
   irritating once eleven sets are in.
2. **The rival problem is solved, and the answer is CHALLENGES 1–3.** Trevor's proposal, 21 Aug 2026,
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
   harder case of open item 1 above. **The consequence is worth stating because it validates the
   design**: combined packs are not flavour on top of the idea, they are *forced* by the structure —
   there is no single set for a Challenge to pay in. See [PACKS.md](PACKS.md); a differently-composed
   pack is a new pack **type**, not a tuning change.

   **"One per type" may need to mean "one LED by each type."** A mono-Lightning deck before Neo is
   thin, and a strict reading would produce one weak rung per Challenge for reasons that have nothing
   to do with design. Trevor will feel this while building; the fix is to loosen the rule rather than
   to force the deck.

3. **What still has to be answered about a Challenge's leader**, carried over from the rival entry
   this replaced: what makes them *tougher than a T4* without leaning on "mostly Colorless", which is a
   deck constraint fighting a difficulty requirement. The exit recorded before fits the new shape better
   than the old one — **a leader's pool is every set you have unlocked at once** while everyone else is
   set-flavoured. Under Challenges that is nearly free, because a Challenge already sits outside the
   set-per-bracket structure. Ronald is the placeholder until this exists, and he currently stands as
   the post-boss `extra` in all four live brackets.

4. **Pressure tags exist as data and are read by nothing.** Trevor's workbooks carry a per-card
   Pressure column, `gen_cards.js` derives a deck-level tag from it by copy count, and a minority of
   decks earn one — the rest are honest beatdown, which is the right outcome. **Trevor's key extends
   the vocabulary above with two more: HD (High Damage) and BG (Bench Growth).** The no-repeat rule has
   never been checked against a real bracket, and as of 25 Aug 2026 there are **four** to check it
   with.

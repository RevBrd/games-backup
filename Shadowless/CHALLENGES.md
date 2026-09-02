# Shadowless — what a bracket ASKS of you, and who is waiting at the end

**The unbuilt half of the ladder's design.** Two things live here: **entry conditions** (what your
deck must contain to sit down) and **pressure tags** (what stops eight opponents being one opponent
getting bigger). A third used to — the **Challenge brackets** — and it **shipped on 1 Sep 2026**.

[OPPONENTS.md](OPPONENTS.md) is the parent and is the **built** half: the four tiers, the rung
pattern, what five live rosters measured against them, and now the Challenge brackets. Split out of
it on 25 Aug 2026 because every one of those sections describes something that shipped, and a reader
coming for *how a deck is built* was walking through a hundred lines of speculation to reach it.
[PROGRESSION.md](PROGRESSION.md) is the machinery.

**Status: neither of the two remaining things is built.** The pressure vocabulary exists as data and
is read by nothing; entry conditions are specified and no rung carries one.

**Challenge 1 is built and its section has gone.** Seven mono-type decks between Fossil and Team
Rocket, paying in a Challenge pack. *[What it became →](OPPONENTS.md)* ·
*[the machinery →](PROGRESSION.md)* · *[the pack →](PACKS.md)* ·
*[what it measured →](ROSTERS.md)*. **Challenges 2 and 3 are still unbuilt** and what they need is
one paragraph rather than a section, because the first one settled every structural question — see
the Open list.

**When a section here ships, rewrite it in the past tense, move it to `OPPONENTS.md`, and say where
it lives** — a planning document that outlives its plan is the nastiest thing in this tree, and this
file is the whole outstanding stock of it. That is what happened to the Challenge section on
1 Sep 2026, and it is the first time this instruction has been followed rather than written. See
[MAINTENANCE.md](MAINTENANCE.md).

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
4. **Pressure tags exist as data and are read by nothing.** Trevor's workbooks carry a per-card
   Pressure column, the extraction derives a deck-level tag from it by copy count, and a minority of
   decks earn one — the rest are honest beatdown, which is the right outcome. **Trevor's key extends
   the vocabulary above with two more: HD (High Damage) and BG (Bench Growth).**

   **The no-repeat rule has now been checked against one bracket and it passes** — Challenge 1,
   1 Sep 2026, and it is the first time. Ordered by ascending featureWeight the seven read
   **SL · WP · AP · BD · SL · WP · HD**: no two in a row share one, and the boss (HD) shares with
   nobody. **That was luck, not construction.** The order was chosen for difficulty and the pressure
   spacing fell out of it; a future bracket that orders the same way may well collide, and the fix
   would be to reorder rather than to relax the rule. Nothing enforces any of this — the tags are
   still read by nothing.

   **Two collisions inside the bracket, reported rather than fudged**, the same way Fossil's were:
   SL appears on Grass and Water, WP on Psychic and Fighting. Neither pair is adjacent, so the rule as
   written is satisfied — but a seven-rung bracket against a nine-code vocabulary is close to the
   arithmetic limit the rule's first draft failed on, and Challenges 2 and 3 are bigger.

   **One derivation detail worth knowing before you read a tag.** Fire's tally ties WP and AP at 3
   copies each, and the tie is broken alphabetically so the extraction is reproducible. A tag that
   came out of a tie is not a fact about the deck's identity, and Fire's is the only one so far.

# Shadowless — what an opponent is made of

The **content** of the ladder: what separates a tutorial opponent from a champion, what a deck has to
specify before somebody can build one, and what the player must bring to be allowed at the table.
[PROGRESSION.md](PROGRESSION.md) is the **machinery** — brackets, unlocks, `winReward`. If you are
wiring the ladder you want that file; if you are deciding what goes *in* a rung, you want this one.

Read it when adding a set's roster, hand-building an opponent deck, or working the auto-builder
(Job 11), which is the consumer this was written for.

**Status: design. None of it is built.** Job 8, 15 Aug 2026, worked out with Trevor. It is the target
the set jobs build against, and it is deliberately about *parameters* rather than card lists — the
lists come per-set, when we can see what the set actually offers. **When a section here ships, rewrite
it in the past tense and say where it lives.** A planning document that outlives its plan is the
nastiest thing in this tree: specific, confident, and wrong. See [MAINTENANCE.md](MAINTENANCE.md).

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

**The prize count is not a difficulty dial — it is an archetype selector, and this is the sentence
that stops someone breaking it.** Match length decides which decks can function at all. A 2-Prize
game ends before a Stage 2 line assembles; a 6-Prize game is long enough that setting up pays. So T3
being "built around a Stage 2 line" and T3 playing to 6 Prizes are not two decisions — **the prize
count is what makes that deck able to work.** Anyone who later "rebalances" a tier by nudging its
Prizes will silently delete the archetype it exists to enable.

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

### The AI is two tiers, not four

`expert` and `novice` are the only ladder-appropriate settings. `greedy` (damage-only) and `random`
are **measurement baselines** used by `selftest.js` and `smoke.js`, and the whole difference between
the two real ones is one branch in `pickBest` — novice adds ±6 of score noise and takes the
second-best *sensible* line 22% of the time.

**So the AI cannot be the dial that separates T2 from T3 from T4.** It separates T1 from everything
above it, and that is all. Every other rung of difficulty has to come from deck construction, prize
count and entry conditions. That is workable, and it also hands Job 9 a concrete deliverable if we
want one: an intermediate tier between novice and expert would give T2 somewhere of its own to stand.

## The rung pattern, and what scales with it

A bracket runs **intro → body → gate → boss**, in that order, and the shape is the same every time so
that a player learns to read it once:

| Segment | Tier | Count | Purpose |
|---|---|---|---|
| Intro | T1 | 2 | The set's first cards. Beatable with the deck you walked in with |
| Body | T2 | 3–5 | Ease in and accumulate. Still winnable on last set's deck |
| Gate | T3 | 1–2 | The first rung that requires a deck built from this set |
| Boss | T4 | 1 | Unlocks the next bracket |

**The counts scale with the set's size.** Base Set at 102 printings earns the long version; a small
set earns the short one. We already have every set's card count and `buildLadder()` already
synthesises brackets, so this is the existing derivation doing more work rather than new machinery.
It is also the honest answer to fill-rate: a small set produces fewer rungs, so fewer packs, so it
cannot outrun its own card pool. Only the body and gate counts flex — intro is always 2 and boss is
always 1, so every bracket stays recognisable.

**Some live sets get no bracket at all.** Southern Islands and the promos are *sprinkled into packs*
rather than laddered — Trevor, 15 Aug. That is a real change to Job 7's derivation, which currently
produces one bracket per live set: a set needs a flag saying whether it is ladder content, pack
content, or both. Cheap now, irritating later.

**Length is a stated goal, not a side effect.** The GBC game was too short and turned into re-battle
grinding once the champions fell; that is the failure mode being designed against. A long ladder is
the intent.

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
size**, and scaling it between T3 and T4 makes it fire twice per bracket. Trevor's read, and it is
right.

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

So every opponent deck carries a **pressure tag**, independent of tier: *Energy denial · bench sniping
· status lock · single-target beatdown · Trainer denial · deck-out*. The rule that makes it work:

> **A bracket may not repeat a pressure tag.**

That is what turns eight opponents into eight opponents rather than one opponent getting bigger, and
it is a specifiable request for Job 11 in a way "make it harder" is not: *build a T3 Water deck whose
pressure is Energy denial.*

**Assignment waits for the set, and this is deliberate.** Which pressures a bracket can field depends
on what the set prints — Base Set has no deck-out enabler worth the name, and there is no real
Trainer lock before the Gym sets. So this file owns the **vocabulary and the no-repeat rule**; each
set job picks the tags from what it actually has. Trevor's correction and the right one: we use what
the set gives us rather than forcing a schedule onto it.

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

## Open

1. **Free play pays nothing, and changing that would reverse a Job 7 decision.** The proposal to vary
   free-play rewards by chosen Prize count is reasonable on its own terms, but the reason free play
   pays zero is recorded: *a mode that both ignores the ladder and funds the collection makes the
   ladder optional* — see [PROGRESSION.md](PROGRESSION.md). The challenge re-battles above already
   deliver the same loop (vary the difficulty, vary the reward) **on** the ladder, so the
   recommendation is to keep free play at zero and spend the idea there instead. Trevor's call, and
   it should be made knowingly rather than by drift.
2. **Dex completion % is off the critical path**, and the recommendation is that it stays off. A gate
   satisfied by *owning* is a grind gate — pack luck with no decision in it — and grind belongs in
   opt-in content. It is a good **unlock for the optional challenge tier**, where returning to an
   older bracket to fill a gap is a choice rather than a toll.
3. **The player-facing Prize selector is going away** on the ladder, keeping the tier dial from being
   opt-out. It survives in free play. Trevor's call, 15 Aug.
4. **The rival is loose on purpose** — not every bracket, tougher than T4, and hard to make so,
   because "mostly Colorless" is a deck constraint fighting a difficulty requirement. One exit that is
   not about card choice: make the rival the only opponent whose pool is **every set you have
   unlocked at once** while everyone else is set-flavoured. Identity and power without leaning on
   Colorless, and it scales for free. Parked, not proposed.
5. **An intermediate AI tier** between novice and expert would give T2 its own footing. See the AI
   section above and the `Open` list in [AI.md](AI.md).

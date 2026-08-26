# Rainbow Energy is a basic Energy card while it is IN PLAY, and not before

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled with Trevor 19 Aug 2026, and it CORRECTS two earlier entries.** Step 3 of the post-Fossil
order decided it — the printed text plus the WotC rules, read rather than inferred.

> While in play, Rainbow Energy counts as every type of basic Energy but only provides 1 Energy at a
> time. **(Doesn't count as a basic Energy card when not in play.)**

The parenthetical is the ruling. It denies the status **when not in play**, which means it grants it
while in play — a clause that exists for no other reason.

| Zone | Is it a basic Energy card? | So |
|---|---|---|
| attached to a Pokémon | **yes**, of whatever type is being asked for | Energy Trans can move it |
| in your hand | no | Rain Dance cannot attach it |
| in your deck | no | Afternoon Nap cannot fetch it |
| in your discard pile | no | Energy Retrieval cannot take it back |

Trevor's own phrasing is the rule in one line: **"when it's on a Pokémon, it's whatever that Pokémon
needs it to be, as long as it's just one."** A card in your hand is not on a Pokémon.

**And the rule turns out to describe the card's DESIGN, not just its edge cases** — Trevor, on being
shown where his own sentence led: *"it's not searchable from the deck but becomes what it needs to be
once it's in play."*

That is worth having written down in one place, because it is the thing that makes Rainbow make sense
as a card rather than as a pile of exceptions. It cannot be tutored for, so you cannot build a deck
that assumes one; once it lands it solves whatever problem that Pokémon has. The awkward half of the
ruling — a Rain Dance that will not pick it up — stops reading as a restriction and starts reading as
the point. **Every future card of this shape should be checked against that sentence first.**

## What this corrects

Two entries said Rainbow was **never** a basic Energy card, and both are wrong on the in-play half:

- [ENERGY-CARD-MEANS-BASIC.md](ENERGY-CARD-MEANS-BASIC.md), 5 Aug 2026 — *"Rainbow Energy counts as
  every type and would otherwise become movable by Energy Trans and attachable by Rain Dance."* Half
  right. Movable, yes; attachable, no.
- [ENERGY-VS-ENERGY-CARD.md](ENERGY-VS-ENERGY-CARD.md), 17 Aug 2026 — *"Rainbow is not a basic Energy
  card and never qualifies."* The word to strike is *never*.

**Neither entry had the card's text in front of it**, and that is the interesting part rather than an
excuse. On 5 Aug Rainbow had not been generated; on 17 Aug the question was about counting, not about
moving. Both reasoned from the *category* — Rainbow is a Special Energy card — and the category is
right and the conclusion still did not follow, because the card overrides its own category in one
zone and says so in a parenthesis.

**The lesson is the one the Buzzap entry keeps making, arriving from a new direction.** There the
failure was reasoning past an explicit source. Here it was reasoning from a card's *type* when the
card's *text* was more specific. Both times the answer was printed and nobody had read it, because
nobody thought there was a question.

**Everything the two entries say about counting is untouched and still correct.** *Energy* counts by
live type and *Energy card* counts by class; this ruling only establishes that Rainbow's class
depends on where it is.

## The 10 damage, and yes it can kill

> When you attach this card from your hand to 1 of your Pokémon, it does 10 damage to that Pokémon.
> (Don't apply Weakness and Resistance.)

**Attaching a Rainbow to a Pokémon on its last 10 HP Knocks it Out, and the opponent takes a Prize.**
Settled in the same conversation. This is the [Buzzap](BUZZAP.md) principle rather than a new one — a
Knock Out is a Knock Out even when you did it to yourself — and it needed no separate argument.

The [ENERGY-VS-ENERGY-CARD](ENERGY-VS-ENERGY-CARD.md) entry flagged this as unasked and framed it as
*"whether that can Knock Out a 10-HP Pokémon"*. **No 10-HP Pokémon exists anywhere in the 14 sets** —
the floor is 30 — so as literally posed the question is empty. The real case is the common one: a
damaged Pokémon on its last counter, which happens constantly.

And it fires **from hand only**. Energy Trans moving a Rainbow onto something does not hurt it, which
is the [played-from-hand](PLAYED-FROM-HAND.md) rule one card kind along.

## The representation, because it is the one card that breaks a data structure

`provides` is a string of symbols: `'W'` is one Water, `'CC'` is two Colorless. It says both **how
many** and **which**. Rainbow is one symbol whose type is *all of them*, which no string of letters
can express — `'WFPLGR'` would be six symbols, an absurd card.

So it is a **sentinel**: `'*'`, one symbol matching any type. Trevor arrived at the same shape
independently, from the other end — *"labelling it X energy and then turning every symbol into
accepting its own letter as well as X"* — and the two are the same idea read in opposite directions.
What his version leaves out is that **there is no single question to answer**. Three read the
sentinel and they give three different answers:

| | Rainbow? |
|---|---|
| `costSatisfied` — does this pay a typed symbol | yes, any type |
| `energyIsType` — does it count toward *"for each Water Energy"* | yes, every type at once |
| `isBasicEnergyOf` — is it a basic Energy **card** | **only in play** |

**It must not be "choose a type on attachment"**, which the earlier entry forbids in as many words:
Rainbow is genuinely Water *and* Fighting *and* Psychic simultaneously, so the same card is the spare
Water for Hydrocannon and the spare Fire for a Fire-scaling attack in one turn. Nothing chooses, so
nothing has to remember what was chosen.

**One implementation trap, recorded because it is invisible and it is a rules bug.** When matching
attack costs, exact types must be taken **before** wildcards. A Rainbow and a Water paying `WR` fails
if the `W` greedily eats the Rainbow — the `R` then has only a real Water left, and a board that can
plainly pay refuses to. Spending a universal substitute while a specific one is available is never
right, which makes exact-first optimal rather than merely better. `powertest.js` asserts it in both
card orders, and the assertion was watched going red against a single-pass matcher.

## A fourth reader, and the exploit the printed clause was guarding against

**Added 23 Aug 2026, from Trevor reading his own workbook entry back.** Two Team Rocket cards gate an
attack on Energy rather than counting it, which is a use of the sentinel the table above does not
cover:

> **Dark Charmeleon**, Fireball — *"Use this attack only if there are any Fire Energy cards attached
> to Dark Charmeleon."* **Dark Flareon**, Playing with Fire, the same clause.

**The clause says "Energy cards", and while attached a Rainbow is one.** So three Rainbow and no Fire
makes Fireball legal, and a Rainbow is a legal discard for it. That follows from this entry rather
than extending it — recorded because it was checked against the engine and reported as a suspected
bug first, and the thing that refuted the report was this file.

**Why the clause exists at all, which is the part worth keeping.** Trevor: it stops somebody dropping
a Dark Charmeleon into a deck with no Fire in it and paying for a cheap high-damage Fire attack out
of three Rainbow. Requiring *one real Fire* keeps the card in a Fire deck. **That is a deckbuilding
guard, not a combat rule** — which is exactly why our reading does not break it and why he closed the
question rather than pushing on it: *"such a limited-use exploit that our game probably doesn't need
to account for it."*

**Settled: we implement the ruling, not the intent.** Recorded so the same suspicion does not get
raised a third time, and so that nobody "fixes" the gate to demand a physical Fire — which would
contradict every other reader in the table above for the sake of a deck nobody is going to build.

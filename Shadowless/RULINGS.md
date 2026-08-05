# Shadowless — card rulings log

Every case where the printed card text didn't settle how a card behaves, and what we decided.
One entry per call, with the reasoning and the source, so a later instance can see *why* rather
than re-deriving it — and can reverse it deliberately if it turns out wrong.

The standing policy this operates under is in `CLAUDE.md`: **when the text is ambiguous, follow the
Game Boy Color game.** It is a single consistent arbiter and it is the version Trevor knows well
enough to settle a call in plain English, so ask him — he expects to be asked. Where the GBC game
has nothing to say, the WotC-era rulings are the next authority, and the call gets logged here.

Add an entry whenever you make a judgement call. An unlogged one will be re-litigated.

---

## Buzzap — Electrode (base1-21)

**Settled 4 Aug 2026. The opponent takes a Prize.**

Both the GBC game and its sequel omitted this Pokémon Power when implementing the card — so the policy's usual arbiter was silent and this went to the WotC rulings.

Two sources, both explicit and agreeing:

- The **WotC Rulings Compendium** entry for Buzzap: using it gives the opponent a Prize.
- A **period WotC Q&A**: *"Any time a Pokemon of yours is knocked out your opponent gets to draw a
  card - even if you knock it out yourself."*
  ([pojo.com CCQA](https://www.pojo.com/CCQA/QandA/500/1b.htm))

**Two of us guessed the opposite** — Trevor via Gemini, me by inference from "surely nobody prints a
Holo Rare whose signature power costs you a Prize." Both wrong. Buzzap is a genuine sacrifice, and
that's the interesting thing about the card. Don't re-derive this.

The same rulings settle the implementation:

- The Electrode card **itself** becomes the Energy — one Energy card providing **two** Energy of the
  chosen type. The engine already handles one-card-two-symbols for Double Colorless (`provides:
  'CC'`), so this needs a per-instance `provides` override and nothing structural.
- **The Voltorb underneath goes to the discard pile.** Only the Electrode card becomes Energy.
- Because the Electrode stays *in play* as Energy rather than going to the discard, Revive and
  Pokémon Flute can't reach it — with no special-casing — and Energy Removal can, which is right.

Rejected alternative: discard Electrode and conjure a basic Energy in its place. It was the
first instinct and it's close, but it needs a "non-returnable" flag to keep Revive away, gets the
count wrong at one Energy instead of two, and behaves differently under Energy Removal, where one
discard should take both symbols with it. The faithful version is less code, not more.

---

## "1 <Type> Energy card" means a basic one

**Settled 5 Aug 2026.** Rain Dance says "1 Water Energy card", Energy Trans says "1 Grass Energy
card". Both are read as **basic** Energy of that type, matching the WotC rulings.

In Base Set the distinction is invisible: the only non-basic Energy is Double Colorless, which is
Colorless and so fails the type check anyway. It starts mattering at Base Set 2, where **Rainbow
Energy counts as every type** and would otherwise become movable by Energy Trans and attachable by
Rain Dance. The engine checks `cls === 'Basic'` rather than the type alone, so that case is already
handled rather than waiting to surprise someone.

Energy Trans has **no restriction on the destination's type** — the card only qualifies the Energy,
not the Pokémon receiving it. Grass Energy onto a Lightning Pokémon is legal, and there is a test
asserting it. Rain Dance does restrict its destination, to Water Pokémon.

---

## Pending

Calls we already know are coming, so nobody is surprised by them.

- **Metronome (Clefairy, base1-5)** — copies the defender's attack, minus costs and requirements.
  The engine has to run an arbitrary attack script with Clefairy as the attacker, and needs a guard
  against Metronome copying a Metronome. GBC does implement Clefairy, so ask Trevor first.
- **Mirror Move (Pidgeotto, base1-22)** — "the final result of that attack" means the *resolved*
  outcome, after Weakness and Resistance and including statuses. `lastHitBy` currently records only
  a uid and a turn number, so this needs new recorded state.
- **Strikes Back (Machamp, base1-8)** — does it trigger on damage to a *benched* Machamp, e.g. from
  Selfdestruct? The text says "whenever your opponent's attack damages Machamp", which reads yes.
- **Baby Pokémon (Neo era, 10 cards)** — the Baby Rule is a coin flip that can negate an attack
  entirely. Not a Base Set problem, but it is a whole rule, not a card effect.

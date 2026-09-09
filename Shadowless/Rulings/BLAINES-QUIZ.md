# Blaine's Quiz #1 — a card this game does not print, and the slot kept vacant

*Append-only, and exempt from the 200-line target like every entry in this folder. Correct it; never
condense it.*

**Settled 8–9 Sep 2026, Job 16 (Shadowless 40), with Trevor.** The first and so far only card in
1,251 dropped from the game rather than implemented.

## The card

> Put a Basic Pokémon or Evolution card from your hand face down in front of you and tell your
> opponent its name. **Your opponent guesses the length of that Pokémon.** Flip the card over. If
> your opponent guessed right, he or she draws 2 cards. If your opponent guessed wrong, you draw 2
> cards. Either way, return the card to your hand.

**"Length" is the flavour stat printed under the artwork** — a Pokémon's height in feet and inches.
It is not modelled here and there is no reason to model it: no other card in any of the fourteen
sets reads it, so it would be a field added for one card and never consulted again.

## Why it cannot be reinterpreted, which is the part that settles it

The obvious rescue is to swap the guessed stat for one the game *does* have — HP, retreat cost,
Stage. **It does not work, and the reason is in the card's own second sentence: it tells the opponent
the Pokémon's name.**

Once the name is known, every modelled stat is a lookup in `CARD_DB`. A bot guesses right **100% of
the time**, so the card becomes *"your opponent draws 2 cards"* — a strictly bad Trainer you would
never play. It would not be a compromise, it would be a different and worse card wearing this one's
name.

**This is exactly what separates it from [`_____`'s Pikachu](VARIABLE-ATTACK-DAMAGE.md)**, where a
card reading state the game does not model got a **declared constant** and kept its point. That
answer works there and cannot work here: **a declared constant is public, and this card requires the
value to be hidden from the person guessing.** The quiz needs uncertainty, and a constant is the
absence of it.

**A coin flip was considered and turned down.** *"Your opponent flips a coin; heads they draw 2,
tails you draw 2"* preserves the card as playable with no new machinery, and it is roughly what a
50/50 guess would produce. It is also **inventing a card rather than implementing one** — the quiz
is the whole character of the thing, and a coin keeps the payout while throwing away the reason
anybody would remember it. Recorded here rather than in [HISTORY.md](../HISTORY.md) because the
reasoning belongs beside the decision it lost to.

## What was done instead

**The card is not printed in this game at all.** It is dropped at generation by the `OMITTED` map in
`tools/gen_cards.js` — absent from `CARD_DB`, from the pack pool, and from the dex denominator. Gym
Heroes is therefore **131 cards and complete at 131**, rather than 132 with a permanent hole.

**That honours the set-gating rule rather than bending it.** The standing rule is *a set goes live
only when every card in it is playable*, and its purpose is that a player never collects a card no
deck can contain. A card that does not exist cannot be collected; a card that exists and can never
be played is precisely the failure the rule was written against. **Omission is the stricter reading,
not the loophole.**

Three properties of the mechanism, each chosen for a reason this project has already been bitten by:

- **It asserts before it drops.** The entry checks the id still carries the name it expects and exits
  loudly otherwise, exactly as `CORRECTIONS` asserts the text it is replacing. An omission that has
  quietly stopped matching anything would ship the card it meant to remove.
- **It announces itself on every run.** The generator prints the omission by name. An absence is
  invisible in a card count — the set simply comes out one smaller and nothing says why — and this
  tree's most reliable source of wrong beliefs is a silent absence nobody can distinguish from an
  oversight.
- **It lives in the generator, not in `effects.js`.** A card with no effect script is *unimplemented*
  and the ratchet counts it; a card that is omitted is **not a card**. Filing this as the former
  would have left Gym Heroes permanently reading "1 to go" — a set that never completes, and a
  number somebody would eventually try to fix.

## The slot is vacant on purpose

**`gym1-97` is reserved for a future Shadowless original Trainer.** Trevor's idea, 8 Sep 2026, and
it is the reason the number is left as a gap rather than the set being renumbered: a renumber would
close the hole and lose the invitation with it.

**Nothing depends on this happening**, and nothing breaks if it never does. It is recorded so that
the next instance to notice a missing number finds an intention rather than a bug — which is the
whole job of this file.

## What generalises

| Principle | Why it is here |
|---|---|
| **A substitution needs the substituted value to carry the same INFORMATION, not merely the same type** — a stat is only a quiz answer while it is unknown to the guesser | The declared-constant answer works for `_____`'s Pikachu and fails here for exactly this reason |
| **Omitting a card is the strict reading of the set-gating rule, not an exception to it** — the rule exists so nobody collects an unplayable card, and a card that does not exist cannot be collected | Keeps the set complete at its own size rather than permanently one short |
| **An absence must announce itself.** A card count one smaller than the corpus is indistinguishable from an oversight | The generator names every omission on every run |

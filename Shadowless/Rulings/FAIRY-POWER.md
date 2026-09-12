# Fairy Power — a mass Scoop Up that must leave one behind

*Append-only, and exempt from the 200-line target like every entry in this folder. Correct it; never
condense it.*

**Settled 12 Sep 2026, Job 16 (Shadowless 40), with Trevor.** Erika's Clefable (`gym1-3`).

## The card

> Flip a coin. If heads, you may return any number of your Pokémon in play and all cards attached to
> them to your hand.

## Trevor's reading

**"Mass Scoop Up is basically what this is."** Two constraints came with it:

- **The bot must not over-apply it**, since even ordinary Scoop Up only has limited use cases.
- **At least one Pokémon must stay in play.** Returning all of them loses the game on the spot, and
  rather than hand either player a loss they could take by accident, the card simply will not do it.
  That is a house rule on top of the printed text, made on playability — step 4 of the rulings order,
  and his to make.

## How it is built

- **Everything returns to hand** — the evolution stack, the Energy, any attached Trainer. That is the
  printed difference from Scoop Up, which keeps only the Basic and discards the rest.
  `RETURN_DEFENDER_TO_HAND` already had this shape for the other side of the board.
- **A request for all of them is trimmed, not refused.** The attack still returns everything but one,
  and says so in the log. The UI picker's ceiling is one short of the board, so a player never sees
  the option; the trim exists for anything else that asks.
- **An unanswered choice returns nothing** — the rule of the "as many as you want" family
  (`Rulings/SUBSET-CHOICES.md`). The engine never throws a player's board into their hand on its own.
- **Returning the Active leaves a promotion owed**, through the same `addPromote` every other exit from
  the Active spot uses.

## The choice is made before the coin, and that costs nothing

The card says flip first, then choose. **Here the choice is asked before the attack**, and this is
not an approximation, for a reason worth writing down: tails makes the choice moot, heads uses it,
and **nothing happens between choosing and the coin**. No information arrives in that gap that could
change the answer.

It is also the only option available: an attack resolves synchronously, and there is no point in the
middle of one where the UI can stop and ask. Every other attack question in `ui.js` is asked up front
for the same reason.

## What the bot does with it

**One narrow use, by instruction: the escape.** If the Active is about to be Knocked Out and a Bench
can take its place, returning it denies the opponent the Prize. Priced at half that, for the coin, and
the choice it fills in is exactly *the Active and nothing else* — computed by the same test as the
price, so the two cannot disagree about what is returned. Healthy, it returns nothing, and Moon
Impact's 30 wins the comparison on every ordinary board.

**What it is deliberately not asked to judge:** a mass reset, re-playing an evolution line from hand,
pulling back an Energy-heavy Benched Pokémon that is about to be sniped. Those are real uses; they are
also exactly the over-application Trevor warned about, and a wrong guess here throws away a board.

## What generalises

| Principle | Why it is here |
|---|---|
| **A choice can be taken before a coin when nothing happens between them** — the coin gates whether the choice is used, not what it should be | Fairy Power; any "flip, if heads you may choose" |
| **A house rule that prevents an accidental loss is a trim, not a refusal** | The attack still does everything it can |

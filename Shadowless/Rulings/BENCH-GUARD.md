# "You may" resolved as a rule, and the one case where declining is right

*Append-only, and exempt from the 200-line target like every entry in this folder. Correct it; never
condense it.*

**Settled 9 Sep 2026, Job 16 (Shadowless 40).** Brock's Rhydon's Bench Guard, and the general
question it forced: what to do with an optional benefit the engine has no good moment to ask about.

## The card

> As long as Brock's Rhydon is Benched, whenever 1 of your Benched Pokémon is damaged, **you may** do
> 10 of that damage to Brock's Rhydon instead. (If more than 1 of your Benched Pokémon is damaged at
> the same time, you may use this power once for each of them.)

## The problem is the moment, not the rule

The redirect happens **as damage lands**, which is in the middle of resolving somebody else's attack
— usually the opponent's. Asking the player would mean suspending an attack mid-resolution, once per
damaged Pokémon, on a board where a bench splash can hit three at a time. That is three prompts
inside one attack for a decision whose answer is almost always the same.

**Three other cards in this set print "you may" in the same awkward place**, and they were resolved
the same way for the same reason: Shell Armor's *"you may reduce all damage"*, Rebirth's *"you may
return it to your hand"*, and this one. In each case the option exists and there is no board on which
a player would sensibly decline.

## So: resolve it as a rule, and encode the exception you can actually detect

**Redirect, unless taking the 10 would Knock the guard out.**

That is the whole of it, and the exception is not a heuristic dressed up — it is the one case where
declining is unambiguously correct, and it is decidable from the board with no preference involved.
A Rhydon with 80 HP soaking 10 off something frailer is what the card is *for*; a Rhydon dying to do
it is a Prize handed over to save a Pokémon that might have survived anyway.

**What this deliberately does not model** is the subtler preference: hoarding the guard's HP for
later, declining early so Rhydon is healthy at the end. That is a real way to play the card and it is
not encoded. **If it turns out to matter, this becomes a prompt** — and the entry is written down so
that change is a decision rather than a discovery.

## Why this is not the same as inventing a card

The distinction worth keeping, because it is the line between this and
[Blaine's Quiz](BLAINES-QUIZ.md):

- **Blaine's Quiz** could not be implemented *as printed* at all — the information the card needs
  does not exist here — so implementing something else would have been a different card.
- **Bench Guard is implemented exactly as printed.** Every clause is enforced: the guard must be
  Benched, the victim must be Benched, it cannot guard itself, and it applies once per damaged
  Pokémon. Only the *choice* is resolved by a rule instead of a question, and the rule agrees with
  what a player would answer everywhere except a case it declines on their behalf.

**An automatic yes is a defensible reading of "you may"; an automatic *different effect* is not.**

## What generalises

| Principle | Why it is here |
|---|---|
| **"You may" can be resolved as a rule when there is no board on which a player would decline** — and when there IS one, encode that case rather than the preference around it | Shell Armor, Rebirth and Bench Guard all print it at a moment the engine cannot politely interrupt |
| **Say what the rule does NOT model.** The unencoded preference is the thing a later session will otherwise rediscover as a bug | Hoarding the guard's HP is a real way to play and is deliberately absent |
| **Implementing the choice differently is not implementing the card differently** — every printed clause still binds | The line between this and a card that cannot be implemented at all |

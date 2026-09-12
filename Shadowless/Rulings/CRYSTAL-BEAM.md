# Crystal Beam — what "attach" covers, and when "the Defending Pokémon" stops being one

*Append-only, and exempt from the 200-line target like every entry in this folder. Correct it; never
condense it.*

**Settled 12 Sep 2026, Job 16 (Shadowless 40).** Misty's Tentacool (`gym1-57`).

## The card

> Flip a coin. If heads, your opponent can't attach Energy cards to the Defending Pokémon during his
> or her next turn.

## Read strictly by the wording

The same day Trevor overturned the Poison call on Shadow Images by reading the printed text strictly,
and this card is read the same way, in both directions.

**"Attach" means every way an Energy card becomes attached**, not only the turn's one attachment:

| Path | Blocked | Why |
|---|---|---|
| The turn's attachment from hand (`doAttach`) | **yes** | the ordinary case |
| Rain Dance and its relatives (`EXTRA_ATTACH`) | **yes** | attaches an Energy card from hand |
| Buzzap | **yes** | the Electrode becomes an Energy card *attached to* the target |
| An attack that fetches its own Energy (`SEARCH_ENERGY_TO_SELF`, `ENERGY_FROM_DISCARD_TO_SELF`) | **yes** | it attaches |
| Energy Trans, Energy Charge (`MOVE_ENERGY`) | **no** | those cards say **move**, and an Energy already in play changing Pokémon is a different verb |

**"The Defending Pokémon" stops being one when it is Benched.** Retreat it and it can be attached to on
the Bench, because it is no longer what the card names. That is checked where the question is asked
rather than by clearing the effect, so a Pokémon Benched and returned to the Active spot in the same
turn is locked again — it is the Defending Pokémon again.

## How it is built

**One question, `canReceiveEnergy(slot)`, asked at every attach site** — and asked in two places for
the Powers: where they resolve **and** where they list their targets. A guard in resolution alone left
the bot free to pick a Rain Dance onto the locked Pokémon that the engine would then refuse, which is
an action offered that cannot be taken.

**+2 on the expiry**, because it runs through the *opponent's* next turn. The same constant, one turn
further out, is what Swords Dance got wrong for its whole life.

## What generalises

| Principle | Why it is here |
|---|---|
| **Filter the OFFER as well as the resolution** — an action that is listed and then refused is a trap for the bot | Rain Dance's target list named every slot |
| **"Move" and "attach" are different verbs on the cards that print them** | Energy Trans is not blocked by a card that forbids attaching |

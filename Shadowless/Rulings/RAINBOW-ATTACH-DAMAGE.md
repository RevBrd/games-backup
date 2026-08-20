# Rainbow's 10 damage can Knock Out the Pokémon it lands on, and the attachment still happens

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

> When you attach this card from your hand to 1 of your Pokémon, it does 10 damage to that Pokémon.
> (Don't apply Weakness and Resistance.)

**Settled with Trevor across two sessions: the damage half on 19 Aug 2026 with #19, the Prize half
the same week.** Both halves were live in the engine before either was written down here, which is
why this entry exists — the code carried the decision and the register said the question was still
open. *[Why that gap is the expensive kind →](../MAINTENANCE.md)*

**Attaching a Rainbow to a Pokémon on its last 10 HP Knocks it Out. The opponent takes a Prize.**

## The part that was a real call

The alternative readings are not silly, and one of them is how a lot of card games work:

- the damage is a **cost**, so an attachment that would be lethal is simply illegal;
- the damage resolves but the Energy does not attach, since there is nothing left to attach it to;
- the attachment completes and the Knock Out happens.

**The third, and the card's own wording is what picks it.** *"When you attach this card"* makes the
attachment the trigger, not the consequence — it has already happened by the time the damage is dealt.
Nothing on the card is phrased as a condition or a cost. A card that meant the first thing would have
to say so, and Rainbow does not.

The practical consequence is the one worth remembering: **Rainbow is not a free fix for a starving
Pokémon.** On something already hurt it is a real decision, and on something at 10 it is a way to lose
a Prize by not reading.

## The Prize half was NOT a fresh decision, and that is the point

It is step 2 of the four-step order — *a settled principle, matched by shape rather than by card* —
and the principle was two weeks old:

> Any time a Pokemon of yours is knocked out your opponent gets to draw a [Prize] — even if you knock
> it out yourself.

That is the period WotC Q&A cited in [BUZZAP.md](BUZZAP.md), where it settled whether Electrode's own
Power costs its owner a Prize. It does. **A Knock Out is a Knock Out regardless of who caused it**,
and nothing about Rainbow distinguishes it.

**So the lesson here is about the register rather than the card.** That principle sat in Buzzap's
prose for two weeks without a line in the principles index, so when the identical question arrived on
a different card it read as unasked and went into `RULINGS.md`'s Pending list — where it stayed for
long enough to be forgotten twice. It has an index line now. **When a ruling generalises, put the
general form in the index in the same commit**, or the next card of that shape pays for it again.

## How it is built

`{ t: [{ v: 'E_SELF_DAMAGE', n: 10 }] }` on `base5-17`, and three properties are deliberate:

- **`doAttach` calls `checkKOs` straight after running the Energy script**, which is the whole
  mechanism. Without it the Pokémon would sit at zero HP until something else happened to look.
- **The damage is applied directly rather than through `dealDamage`**, because `dealDamage` needs an
  attacking slot and there is no attacker. That also means no Retaliate and no Mirror Shell, which is
  correct — this is not an attack. *[Why that matters generally →](POWER-IS-NOT-AN-ATTACK.md)*
- **It fires only from hand.** An Energy Trans move of an already-attached Rainbow deals nothing,
  because *"when you attach this card from your hand"* is the trigger. Same rule, same reading, as
  every other from-hand effect. *[The doorway →](PLAYED-FROM-HAND.md)*

`powertest.js` pins all four cases: the flat 10 with no Weakness applied, the lethal attachment
handing over a Prize, the Energy Trans move dealing nothing, and **the AI refusing the play outright**
at `-Infinity` rather than merely discounting it — a bot that occasionally kills its own Pokémon to
attach an Energy is a bot the player stops trusting.

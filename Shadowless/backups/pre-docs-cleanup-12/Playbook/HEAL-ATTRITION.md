# Heal & attrition — the card goes where it does the most good

**Read this before touching `T_HEAL`, `T_DISCARD_ENERGY_THEN_HEAL`, or any future card that removes
damage counters.** A heal is not valued by how much damage it erases. It is valued by what the erased
damage lets you keep doing, and on the Active that is usually a **turn**.

**State: built, 2 Sep 2026.** Two faults, one fix, both halves shipped together.
*[The invariant →](../AI-INVARIANTS/HEAL-RESCUE.md)*

## Trevor's notes

Verbatim and append-only. The analysis below them is not.

From the workbook's `Wants` column:

> **Potion** — To not be used to heal only 10 damage unless that has the immediate potential to be
> life saving (and the pokemon is worth saving)
>
> **Super Potion** — To heal a moderate amount of damage at the cost of 1 tempo of energy. Should not
> be used to save a pokemon that it would prevent from powering up enough to attack, as that would
> just be stalling for no benefit
>
> **Pokemon Center** — *(unclaimed)*

And from `GRABBAG.md`'s *Ideas stolen from GBC 2*, which is where this pattern actually came from:

> Potions applied to the active pokemon seem to be purposefully timed for when they would prevent the
> opponent from killing it on the next turn, rather than as soon as it would be useful, though not
> exclusively so.

## How the family is detected

**It is not detected, and that is the finding.** There is no "healer" family to derive — the cards
are simply the Trainers and Powers that remove damage counters, and they are already distinguishable
by verb. **The work is entirely in what the effect is worth once you have it**, which is why this
pattern has no `STALL_VERBS`-shaped list in it and should not grow one.

Three questions, and each of the shipped cards answers a different mix:

| Question | Term |
|---|---|
| Is the damage even there to erase? | `healWaste` — healing poured past the damage is thrown away |
| Does erasing it buy the Active another turn? | `healRescues` → `W.healRescue` |
| Does the cost of erasing it silence the thing being healed? | `healDisarm` |

## What the notes bought

**A heal is worth a rescue only if it actually rescues.** The rescue bonus asked *is this Pokémon
dying* and never *does the heal change that*, so it paid full price across the whole band where the
card had stopped working — and paid it hardest on the boards where the Active was most damaged, which
is exactly where a Potion is least able to save it.

**And the target was chosen before anything was scored.** Most damage counters won, and the rescue
bonus then required the winner to *be* the Active — **so the selection could suppress its own
correction**. A Potion walked past an Active it would have saved outright, to a benched Snorlax under
no threat at all.

**Trevor's Super Potion note is the same shape from the other end.** The disarm penalty was charged to
the card *after* the worst slot had been picked, so the only thing it could do was refuse the play —
measured at **−15.00, under `threshold`**, with a benched Machop standing there wanting exactly that
heal. He wrote *should not be used **on***; the fix was to let it be used **somewhere else**.

## Open

**`HEAL_ON_FLIP`'s urgency test reads backwards and is deliberately untouched.** It asks
`threat >= remaining - heal`, subtracting a quantity that *increases* remaining HP. As a **near-miss**
band ("the threat is within one heal of killing me") it is defensible and genuinely different from a
rescue test; as arithmetic it looks like a sign error. It has no note behind it and no measurement.
**Ask what it was for before changing it** — and if it is retuned, that is a policy change wanting its
own number, not a tidy-up folded into somebody else's commit.

**Pokemon Center has no claims and no note.** It heals every Pokémon you own and discards every
Energy on the ones it healed, which makes it the only card here whose cost scales with how well it
works. `T_POKEMON_CENTER` prices both sides flat and nothing has looked at it.

**Nothing prices a heal against the Prize it protects.** A rescue is currently worth a fixed
`healRescue` whether the thing being saved is a Rattata or a fully charged Charizard. The quantity
that would fix it — what the slot is worth — already exists as `potential`, and `HEAL_DAMAGE_MOVE`
above it already reaches for exactly that (`worth * 0.2` on a doomed source). **This is a real
inconsistency between two heal sites and it is smaller than it looks.**

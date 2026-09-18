# 17 Sep 2026 — the cost of committing a body, and the exposure charge that was not a cost

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `threatFrom`, `benchThreatAgainst`, `slotLossCost`, and the commit gate at the end of
`promoteValue`

---

**Job 17b** · #42 · AI.md item 20, from Trevor's Blastoise/Charizard standoff, 17 Sep 2026.

**The invariant: their BENCH is only a threat where something forces their Active out, and the only
thing the bot can force is its own Knock Out. So the exposure is priced where a body is COMMITTED —
`promoteValue` — and nowhere else.**

## What the bot could not see

`threatAgainst` and `incomingThreat` read `you.active` and nothing else, so a fully charged Charizard
on their Bench was invisible to every scorer until the turn it was already Active. Trevor:

> Bringing in Blastoise to finish off a stalling Kangaskhan while the opponent has a Charizard that's
> able to attack next turn on the bench is a bad idea, because then the opponent just switches in the
> Charizard and kills your Blastoise before Blastoise could do any real damage.

`threatFrom(theirSlot, mySlot)` is `threatAgainst` with the attacker named — the old function is now
one line of it. `benchThreatAgainst` is its max over their Bench, counting only Pokémon that can
already pay for an attack. **Their Bench is face up, so this is public information** and the
self-restriction that governs `prizeIndex` does not apply.

## The gate, and why it is a gate

At the end of `promoteValue`, `slotLossCost` is charged only when **both** hold:

- the body being sent up **would Knock their Active out** (`bestAffordableDamage` ≥ its remaining HP);
- their Bench holds a ready reply that **would Knock the newcomer out**.

**A Pokémon sent into a stalemate is not exposed to their Bench at all**, because nothing makes their
Active leave. Trevor's own correction, 17 Sep: outside a Knock Out they should not usually be paying
a retreat cost to ambush, so an unconditional fear of their Bench would be wrong.

Printed damage on both sides, never the scorer: `promoteValue` is reachable from `scoreAttack` through
`bestSelfSwitch` (AI.md item 19, and the re-entry guard in that function).

## THE FINDING: an exposure cost is only a cost if an alternative avoids it

**It was built in the lethal branch of `scoreAttack` first, and that version measured worse.** The
Knock Out hands them a free promotion, so charging the Knock Out for it looked obvious.

| | |
|---|---|
| `aiduel 1 HEAD --gbc` | 49.7% ± 1.1 |
| `aiduel 3 HEAD --gbc`, 25,343 games | **49.7% ± 0.6** — same point estimate at three times the sample |
| how often it fired | **17% of lethal looks**, average bill 20.5 |
| the commit gate, for contrast | 0.75% of promote evaluations, bill 25.0 |

**Declining the Knock Out does not keep their Bench killer benched.** It arrives the moment their
Active dies, which it will, and their Active attacks us in the meantime. The charge was a bill no
alternative escaped, so it did nothing but bias the bot away from Prizes — against Trevor's own
"Prize should usually come first" — and `slotLossCost` being capped by `W.dangerSwap` meant a fodder
attacker paid nearly what an invested one did, which is the opposite of the point.

**It also had the wrong sign on the board it came from.** *"If Charizard comes in first, then
Blastoise gets to jump in and hit for weakness and kill it before it can take any damage itself."*
Forcing their big card up while our answer is still benched is the *good* half of the standoff.

**Generalise this, because the shape recurs:** before pricing a risk an action creates, ask what the
board looks like if the action is declined. If the risk is there too, it is not a cost of the action —
it is a fact about the position, and pricing it moves the bot for no reason.

## The gate itself is a measured null, and the SIZE hypothesis was refuted

| | |
|---|---|
| divergence, gate only | **7.5% ± 0.9** (15.1% with the Knock Out charge as well) |
| `aiduel 3 HEAD --gbc`, 25,341 games | **49.8% ± 0.6** |
| `commitExposure: 4` | 49.8% ± 1.1 |
| `commitExposure: 8` | 49.8% ± 1.1 |
| **`commitExposure: 0` — the gate switched off** | **50.0% ± 1.1** |

**The 0 row is the control and it is exact**, so the gate is the only thing differing and the rest of
the refactor is behaviour-neutral. **The hypothesis it kills was mine:** that the bill was too small
to express *"do not commit your best card"* while still being large enough to shuffle promotions. If
that were true, 4x and 8x would move it. They do not move it at all — so the gate is not mis-sized,
it is simply not paying.

**The live hypothesis, untested.** Trevor's rule assumes the body that goes up INSTEAD does
something: *"do as much damage as possible to Blastoise with the current active before it's killed."*
The bot has no such condition, so it can decline to commit its attacker in favour of a fodder that
chips nothing, and hand over the same Prize a turn later. **A gate on the ALTERNATIVE's usefulness is
the next thing to try**, and it is a comparison between two promotions rather than a price on one.

## Open, and named rather than guessed

- **The benefit side is unbuilt.** Forcing their charged attacker up while we hold a ready answer is
  worth something, and nothing prices it.
- **`slotLossCost` prices the CARD, not the stream.** Trevor: *"a Blastoise entering the game ready
  and undamaged might be worth anywhere between 2-5 prizes."* That is AI.md item 1's quantity — what a
  slot is worth if it lives — and it is not invented here.
- **The standoff itself is item 13's planner.** Trading jabs while counting whose wall arrives first
  is a comparison across turn sequences, not a term.

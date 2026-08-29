# Setup turn — spending a turn to make the next one better

**Read this before touching how riders are valued against a defender that already has one.**
One attack sets something up; the next one cashes it. The cards say it plainly — *Toxic first, then
Thrash* — and the scorer is greedy over a single turn, so it can only ever see half of that.

**State: one half built, 23 Aug 2026.** The *cashing* half is done and general. The *setting up*
half — knowing this turn is worth less than it looks because it buys a better next turn — is not,
and it is the same missing capability three other patterns want.

## Trevor's notes

Verbatim and append-only.

> **Nidoking.** Both its moves cost the same and both are worth using, but it usually wants to start
> with Toxic due to the extra poision damage before switching to Thrash, as the extra poision damage
> on top of Toxic's natural damage equal the 50/50 damage potential of Thrash. Once the opponent is
> poisoned, Toxic cannot add additional poison damage, so Thrash becomes more valuable.
>
> **Beedrill.** To use Poison Sting first, and then Twineedle when the opponent is already poisoned.
> Poison Sting is preferred again when a guaranteed 40 damage or less is needed, rather than gambled
> on Twineedle's coin flip.
>
> **Haunter.** Hypnosis + Dream Eater is a Setup Turn combo but Dream Eater only has a 1/4 chance of
> being successful before even before you factor in the opponent's chance to wake up by evolving.

## What the two notes had in common, which neither of them says

**Every status rider in the game scored identically against a clean target and an afflicted one.**
Poison Sting kept its full poison credit against something already poisoned; Toxic scored 44 against
a target it could not affect in any way; Stun Spore scored the same against a Pokémon already asleep.

Two of Trevor's notes, about two cards, in two different decks, landing on one term nobody had
looked at. Neither note mentions scoring and neither is about the other's card.

**The 22 Aug rule was *a rider is worth nothing on a Pokémon the attack REMOVES*. This is the same
sentence ending *...that already HAS it*.** `statusNovelty` is the term.
*[The invariant, and why it is not one rule for all four statuses →](../AI-INVARIANTS.md)*

**It is derived from what the engine does, not from a table of opinions**, which is the part worth
copying. Poison, Sleep and Confusion persist until cured, so re-applying is worthless. **Paralysis is
not**, because `endTurn` clears it on a turn comparison and a second application refreshes the timer
— it really does buy another turn. And the big three replace each other, so putting a *different* one
on an afflicted Pokémon is a swap rather than a redundancy and is not discounted at all.

## What it is worth, measured, and it is small

**250 games, 1,791 attacks.** A defender is afflicted by anything at all in **1.5%** of attacks —
status does not persist in this format, because the afflicted Pokémon dies, retreats, or wakes up.
Of the 333 attacks carrying a status verb, **10 (3.0%) landed on a target where the rider was fully
or partly redundant.**

Both aggregate instruments read null and **that is the expected shape rather than a disappointment**:
`aiduel` against the pin held at 51.4% ±0.5, the benchmark deck held at rank 5. The exposure was
measured before either null was believed.

**It was kept anyway, and the reason is not win rate.** A bot that Toxics a Pokémon already carrying
Toxic is *visibly* stupid to the human sitting opposite it, and
[MISREADINGS.md](../MISREADINGS.md) makes exactly this point — a duel cannot see a rare
catastrophic-looking error, and those are the ones a person notices. The fix was nearly free and the
rule is derived rather than tuned, so there is nothing to maintain.

**Compare the Paras finding of 22 Aug**, which measured 6.2% and was deliberately *not* built. The
difference is cost, not size: that one needed a new capability, this one needed a multiplier on a
term that already existed.

## Open

**Beedrill's second clause is CLOSED, 23 Aug 2026, and the note lost.** The redundancy half was right
and shipped. But Twineedle still loses to Poison Sting after it, and not to a scoring error:
**Poison Sting does 40 flat and Twineedle averages 30** across two coins, with a real chance of doing
nothing at all. With the rider worth exactly zero, 40 still beats 30. Trevor, asked: *"you're right,
rather than my original note."* The row now asserts the **correct** behaviour rather than being
deleted, so nobody re-opens it from the workbook cell — the Cloyster and Paras outcome again, which is
the third and fourth time asking for the *because* has said the bot was already right.

**The setting-up half is not built and should not be built here.** Knowing that Toxic is worth more
than its 20 damage *because of what it makes possible next turn* needs multi-turn lookahead, which is
the same capability [Ammo](AMMO.md)'s Charmeleon half, [Evolution timing](EVOLUTION-TIMING.md) and
[Attack choice](ATTACK-CHOICE.md)'s Lapras entry all want. **Four patterns now want one capability.**
If it lands, it lands once and all four read it.

Haunter's note is filed here and untouched — it is a Setup Turn combo by name, and Trevor's own
arithmetic in the note argues the combo is bad, which makes it a claim about *not* setting up.

## Tangela, which nobody touched

**The general fix was tested rather than asserted, and it held.** Trevor's Tangela note points at
Nidoking's reasoning by name — *"Poisonpowder first, Bind once poisoned. See Nidoking for
reasoning"* — and Nidoking's fault had been closed hours earlier by `statusNovelty`, a term in the
general scorer with no card in it.

Tangela was written as a claim and run cold. **It passed on the first attempt**, on a card nobody had
looked at, because the rule it needed was already there. That is the argument for
[PLAYBOOK.md](../PLAYBOOK.md)'s standing rule — *the fix goes in the general scorer, never in a
per-card branch* — measured instead of asserted, and it is the cheapest evidence for it this project
has produced.

**Its other clause found where the line sits.** *"Bind before Poisonpowder can be afforded"* is a cost
sequence, but the bot also prefers Bind against a big threat regardless — measured, Bind overtakes
Poisonpowder between an incoming 20 and 40. Tangela has 50 HP, so a 40 threat two-shots it and the
paralysis is most of a life. **That is the 22 Aug barrier rule reaching paralysis**, and it is correct
play rather than a fault; both sides are asserted so the boundary is pinned rather than assumed.

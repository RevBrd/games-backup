# 31 Aug 2026 — the printed number is not what the card does, and the Bench read it anyway

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `slotPrintedDamage`, `spareEnergyDamage`

---

**`slotPrintedDamage`, `spareEnergyDamage` — Job 14b, from the Over-Attach notes in Jungle and
Fossil, the first claims ever written against either set.**
*[The pattern, its ten notes and the four controls →](../Playbook/OVER-ATTACH.md)*

**THE INVARIANT. Printed damage is a currency, not a constant.** For sixteen printings in the live
pool the printed string is a *function of the Energy attached to the slot* — Water Gun prints "10+"
and a Lapras on three Water deals 30, Big Eggsplosion prints "20×" and an Exeggutor on four Energy
averages 40. **Anywhere `ai.js` asks "how hard does this slot hit" in printed-damage units, it must
go through `slotPrintedDamage`.** There are three such places and all three were wrong:
`potentialOf`'s non-Active branch, `scoreAttackHypothetical`'s two fallbacks, and
`bestAffordableDamage`. `aiParseDamage` stays for the one honest case — ranking a card **in the
deck**, which has no slot and no Energy to read.

**Derived from the verb and only from the two verbs an attachment can move.**
`DMG_PER_SPARE_ENERGY` and `DMG_PER_ENERGY_HEADS`. The other scaling verbs read the bench, the damage
counters or a coin, and no attachment changes any of them — pricing them here would charge a decision
for something it cannot affect. Every other attack in the game returns `aiParseDamage` unchanged, so
the blast radius is those sixteen printings by construction rather than by care.

### What it cost, and it was hiding in the slot the notes talk about most

`potentialOf` prices a benched Pokemon at printed damage, so an attachment that grew Water Gun by 10
moved `best` from 10 to 10 — `noProgress` — and the surplus rule refused it at `attachSurplus`.

| Lapras, one Water attached, one Water in hand | before | after |
|---|---|---|
| **Active** | 23.04 | 23.04 — this slot always worked |
| **benched** | **−2.00** | **+18.50** |
| benched, already at its printed cap | −2.00 | **−2.00** — unchanged, now for a reason |

**Do not read this as AI.md's open item 1.** That one is the Active/Bench *unit* split — a benched
Pokemon having no way to say "I could take a Prize" — and it is untouched and still open. This was
the raw-damage currency being wrong **about itself**, which is a fact rather than a unit, and fixing
a wrong fact needed no refactor of `scoreAttack`. The two were tangled together in one paragraph for
weeks because the same test named both.

### `maxSpare` had been in the engine and not in the scorer since Job 6

`rawOutcomes` kept its own copy of the spare-Energy arithmetic and never learned the cap, so the bot
valued a Lapras on five Water at **50** where the card, the printed text and the engine all say 30.
**Eleven weeks, invisible to everything.** That is #28's *one verb, two implementations, in two
modules, with nothing asserting they agree* — for the fifth time.

**`spareEnergyDamage` is now the single implementation** and both halves of `ai.js` call it. Do not
re-inline it; that is precisely how it drifted.

### The guard #28 said it did not have — and why there are TWO of them

#28 wrote that it had no guard for this shape and was not sure a cheap one existed. **For a verb
whose damage is a pure function of the attacker's own board, one is cheap**: make the engine resolve
the attack and compare the two numbers.

- **`every spare-Energy attack scores exactly what the engine resolves`** sweeps every
  `DMG_PER_SPARE_ENERGY` printing at five Energy counts each and names the card on a mismatch.
  Watched failing on Poliwrath before being trusted.
- **`a printed cap on a spare-Energy attack reaches the effect script`** exists because **agreement
  is not correctness and the first guard cannot tell the difference.** Two halves wrong the same way
  pass it — which is what was happening: **Blastoise, Poliwrath and Poliwag print a cap and neither
  half had it.** Written in Job 4b, before Job 6 added `maxSpare` for the cards that needed it, so
  the three oldest cards carrying the verb were the three the engine over-paid. The second guard
  reads the **printed text** rather than either implementation.

**Generalise the pair, not the verb.** Where two modules implement one rule, an agreement test is
cheap and catches drift; it can never catch a shared mistake, and only the printed card can. Reach
for both or know which one you are skipping.

### And it took three green tests down with it, which is the finding worth the most

**Three `powertest.js` assertions swept the barrier curve by piling Water onto a Lapras, "whose Water
Gun grows with its Energy".** It does not grow past 30. The engine has always capped it; the
**scorer** had not, so `incomingThreat` reported 70 off a Lapras that deals 30 — and the barrier
curve had been calibrated against damage no attack in the game could land. One of the three asserted
its board was lethal, and it never was.

**That is the 13 Aug invariant arriving from the side nobody watches:** *the AI can never predict a
number the engine would not produce.* It was asserted about `bestAffordableDamage`, and the reverse
case was sitting inside the suite that asserts it. **A test fixture is AI output too.**

The three assertions are unchanged; only the generator is, and it is now two cards because no single
live card sweeps a threat from 10 to 80 — Poliwag caps at 30, Exeggutor is uncapped. A fourth test
was added to license that: **the barrier must be a function of the threat and not of the card making
it**, asserted where a Poliwag on two Water and an Exeggutor on one both threaten 20.

**If you are about to sweep a quantity by attaching Energy to a card, check the card can actually go
that far.** Nothing in the project checks this and the fixture reads perfectly.

### Measured — 41.3% divergence, and the win rate says nothing as usual

`abtest 8 HEAD --card base3-10`, restricted to the **9 of 47** ladder decks holding a Lapras:

| | |
|---|---|
| games per side | 2,736 |
| **diverged** | **1,131 — 41.3%** |
| median first difference | action 49 |
| subject-deck wins, HEAD → working | 55.1% → 55.5% |

**Four games in ten come out differently, and the win rate moves 0.4 points.** That is the expected
shape and not a disappointment: half of this change is a **rules** fix — the three missing caps — which
both seats play under, so `abtest` is the right instrument and a win rate is the wrong one. The
median first difference at action 49 rather than action 3 is also right: this changes where Energy
goes over a game, not what the opening play is.

**`--card` is why the number means anything.** On the unrestricted pool it would be diluted by the
majority of decks that hold none of the sixteen printings, and a small figure there would have read
as "small effect" when it actually meant "small exposure" — the seventh lie in this project's own
list, which is why the flag exists.

**Stalls: 29 of 2,736, a rate of 1.06%**, inside the 1.1–1.8% band the two entries in
[MISREADINGS.md](../MISREADINGS.md) record. Read as a rate rather than instrumented, and stated plainly
so the next session knows which check was skipped: with 41% of games diverging, the identical-tree
floor is the wrong baseline by that file's own argument, so the instrumented loop would have had
nothing to compare against.

### The control, run after committing — 0.0%, and the stall floor for that exact command

`abtest 8 HEAD --card base3-10` with `src/` identical to the baseline: **0.0% divergence over the
same 2,736 games, and 28 stalls.** The measured run read 29. So the stall line resolves properly
rather than by appeal to a band — **one above the floor for this command**, which is the check
[MISREADINGS.md](../MISREADINGS.md) says costs one run and settles it. The 41.3% is the change.

**Run the control AFTER committing, not before.** The working tree is the baseline at that moment,
so the control is free and requires no stash — and stashing a session's uncommitted work to obtain a
control is how you lose it. *(Nearly done here: a `git checkout --` reflex during a different
experiment reverted the whole of `src/ai.js`, and it was recovered only because a scratch copy
happened to exist. Use a targeted edit-and-revert for a control, never a checkout.)*

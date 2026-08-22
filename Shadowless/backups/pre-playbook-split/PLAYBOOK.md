# Shadowless — how the cards are supposed to be played

**Trevor's list, and the guide to writing it.** He knows how this era plays; the AI does not, and no
amount of reading the card data will teach it. This file is where that knowledge goes.

**Guide on top, list underneath, one file.** That is deliberately unlike [GRABBAG.md](GRABBAG.md),
which keeps its method in a separate file — and the difference is worth knowing so nobody "fixes" it.
A grab bag item is *consumed*: it gets worked and removed, so a guide sitting above it would be
re-read on every scan of a list that is mostly other people's closed business. **A playbook entry is
permanent.** Once it becomes an assertion the note stays as the reason that assertion exists. Both
halves here are reference, so both halves live together — and the format being visible directly above
where Trevor types is worth more than the tidiness of a split.

**When it outgrows one file, it becomes a directory, the way `Rulings/` did** — one file per set, with
this guide and an index left behind. Do that on size, not on a schedule.

---

### What is not worth writing down

**Anything the card already says.** The engine knows Ice Beam can paralyse and that Fire Spin discards
two. A note restating printed text is the tag idea coming back in prose.

**A number.** "Chansey should score about 15" is a weight, and weights get measured against instruments
you would have to run. Say what should *happen*; the number is somebody else's job.

**Archetype labels are the exception to "one entry per card", and they are worth as much as the
entries.** Three of the first day's fixes generalised to every card sharing a shape — every wall, every
attack that eats its own Energy, every retreat in the game. If a note is true of a family, say so and
name the family; it is worth ten single-card entries.

### Being wrong is fine and has been productive

Several notes so far described something real whose cause was somewhere else entirely — *"the AI avoids
non-DCE energy on Colorless Pokemon"* turned out to be true as an observation, nothing to do with type,
and **correct behaviour** for the card that prompted it. All of them were worth writing.
[PLAYTEST.md](PLAYTEST.md) is the same lesson for bug reports.

## Working an entry (whoever picks one up)

**Build the position and watch it happen before you change anything.** Every fix on 21 Aug 2026 was
reproduced from a constructed board first, and two of them turned out to be a different fault than the
note described. [PLAYTEST.md](PLAYTEST.md) is the method file and it applies here unchanged.

**The fix goes in the GENERAL scorer, not in a per-card branch.** That is the whole reason this list is
an oracle rather than a data feed. If a note can only be satisfied by special-casing the card, say so
and stop — that is a finding, and it usually means the DSL or the scorer is missing a concept.

**Assert it in `powertest.js`, not in a duel.** These are almost all symmetric between the two seats, or
about what the bot can *perceive*, and `aiduel.js` is blind to both by construction. It will report
~50% and that reads as "your change did nothing".
*[Every way this project's measurement has lied →](MEASUREMENT.md)*

**Mark the entry, do not delete it.** Unlike a grab bag item, a satisfied entry stays — it is the reason
its assertion exists, and somebody rewriting that part of the scorer needs to know what it was
protecting. Add **DONE** and the date.

---

## The list

*Format is loose on purpose. Card or family, what it should do, what it must never do, and why.*

### Chansey — DONE 21 Aug 2026

Chansey is a tank. It goes in, uses Scrunch, and stalls while everything else is powered up on the
bench, ending in a sacrifice. **There are very few circumstances where it would ever retreat rather
than let itself get killed.** Six Prizes is time you are able to stall for before you can power up
something strong enough to fight — but leave it too late and you still might not dig yourself out of
the hole before your opponent gets something else going.

Double Edge is almost never used **unless you get a DCE that could power it up the rest of the way in
one turn** — then you can land a surprise kamikaze on the attacker, at the cost of the opponent going
first with the new Pokémon in play.

> Built as a general rule about **walls** rather than about Chansey. The tempo term in the retreat
> scorer compared best affordable printed damage, and a wall's is zero, so every benched Pokémon read as
> an upgrade every turn. Suppressed by `wallScore`, one-sided. And the Energy a retreat burns is now
> priced at the rate the rescue values it — *an Energy is a turn* — which came out of the second half of
> this note and changed every retreat in the game. See [AI.md](AI.md).

### Charizard, and anything whose attack eats its own Energy — DONE 21 Aug 2026

Evolve it **on the bench** and pre-load it with as much Energy as you can beyond the four the attack
costs. Fire Spin discards two per turn and you can only attach one, so pre-load enough to last,
supplement with DCE as you go, and try not to run out.

**A DCE is worth two Fire on a Charizard because of Energy Burn**, so when you are forced to discard one
it takes two away by itself — keep enough basic Fire attached to be the thing that gets discarded each
turn.

A player might pre-load a **Charmeleon** on the bench with extra Energy in anticipation, even with no
Charizard in hand yet.

> Two faults, both fixed, worth +5.3 points on the benchmark deck. The attach rule capped it at four
> Energy so it could never fire twice in a row; the engine's discard order read the *card* rather than
> the *slot* and spent the DCE first. **The Charmeleon half is NOT built** — it needs the same
> attach-toward-an-evolution capability Gloom does, below.

### This should be a general rule and is the most important item on the list. Gloom and Vileplume are used as examples, but this should be the default. — OPEN

The answer from GBC and Pocket, except where a card requires an exception, **comes from what is in the
AI's hand.**

- No Vileplume in hand → the Gloom stays at two Energy.
- Vileplume drawn, and it seems realistic Gloom survives the opponent's next turn → give Gloom the third
  Energy **now** and evolve the following turn, so Vileplume can attack right away.
- Gloom might be killed next turn but Vileplume would survive it → **evolve early**, take the hit, attack
  the turn after.
- Base it on the Energy in hand too: with only one Grass available it might hold off on powering up or
  evolving at all, unless desperate enough to bank on the next draw.

> `evolve` currently scores a flat 31.0 whether the target holds one Energy or three. **Do not fix that
> alone** — attaching a third Grass to a Gloom scores −2, so evolving is what unblocks the Energy today,
> and a naive penalty strands Vileplume at two forever. [AI.md](AI.md) open item 4 has the ordering. The
> "Energy in hand" condition is a new capability: nothing in the scorer reasons about the hand as a
> resource for a multi-turn plan.

### Dewgong, and choosing between two attacks — OPEN

Dewgong uses **Aurora Beam** if its 50 is enough to kill outright, and **Ice Beam** if it is not —
because even though Ice Beam does 30 and costs more, its coin flip can paralyse, which buys a turn and
may let Aurora Beam finish the job next turn.

> This one should already be derivable: expected value over damage plus status is arithmetic the scorer
> claims to do. So it is a **test of the scorer** rather than knowledge it lacks, and if it comes out
> wrong the fix is in how status is priced, not in a Dewgong branch. Unmeasured.

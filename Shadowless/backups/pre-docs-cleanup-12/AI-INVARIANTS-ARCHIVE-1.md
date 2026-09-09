# Shadowless — AI invariants archive 1: Jobs 9 through 10.5

**The first thirteen entries, 13–19 Aug 2026, verbatim and unedited.** Split off the front of
[AI-INVARIANTS.md](AI-INVARIANTS.md) on 25 Aug 2026, when that file reached **471** lines against the
~450 its own header sets, and split at a **job boundary** as that header asks: everything here
predates Job 11, which opened on 21 Aug with the first playbook-driven AI work.

**Read it when you are about to touch one of the terms below**, exactly as you would the live file.
These are not superseded — an archived invariant binds precisely as hard as a recent one, and three
of them are the terms most likely to be "simplified" by somebody who has not read them.

| The invariant | Term |
|---|---|
| The retreat re-tune is a **curve, not a number** — do not replace the squared divisor with a scalar | `retreatPrize` |
| **Stickiness is derived, not tagged**, terminal Basics only, matched by effect verb — and it suppresses the rescue, never the Prize | `STALL_VERBS` |
| Weakness and Resistance reach the retreat comparison; the AI can never predict a number the engine would not produce | `bestAffordableDamage` |
| Recoil is priced on **what it leaves you**, squared, meeting the old cliff exactly; overkill is not paid for | `expUseful` |
| An attachment that could never make anything bigger is refused — and the carve-out for retreat is one slot wide | `potential` |
| **Progress is worth a share of what it is progress toward**, amortised, and only toward an attack the Pokémon can actually afford | `attachBuild`, `goal` |
| Promote, Whirlwind and Switch are **one formula**, priced with the retreat rule's own arithmetic | `promoteValue` |
| Attacking while Confused has a price, and **both directions are asserted**; prevented damage waives recoil proportionally | `f.pStopped` |
| **Losing is not a large Knock Out** — a self-KO that ends the match is its own term, because an average hides a terminal branch | `lastPrize` |
| Your own deck is a resource: a squared cost on what remains, a terminal one for emptying it, and Gambler priced on **net** | `deckBurn`, `deckRecycle` |
| Opening placement ranks **stranded last** and then sorts by HP — and it stays in `engine.js`, because the player's auto button calls it too | `setupAuto` |
| **Never re-derive what a slot provides; ask the engine.** Reading Energy off the printed card made the whole Charizard archetype invisible | `slotSymbols` |
| The bot takes a Prize at **random** unless they are face up — it may only act on what it could legitimately know | `prizeIndex` |

**This file is an archive. It only ever grows, it is never rewritten, and nothing in it may be
condensed** — an invariant stripped to its claim loses the reason, and the reason is what stops the
next pass undoing it. Correct an entry that turns out wrong; never shorten one. The 200-line target
does not apply. **Start `AI-INVARIANTS-ARCHIVE-2.md` rather than growing this one past ~450.**

**Where each account lives is a table in the live file's header**, and it covers these dates: 13–16
and 19 Aug came out of Trevor's grab bag and have a fuller account in [GRABHIST.md](GRABHIST.md) or
[its archive](GRABHIST-ARCHIVE-1.md); **18 Aug came out of set and job work and this is the only
copy that exists.** Condense one of those and the reasoning is gone.

## The entries

Chronological, oldest first.

**The retreat re-tune — a curve, not a number.** *13 Aug — #12.* `retreatPrize` divides by the Prizes the
opponent still needs, and the divisor is **squared**: 1.7 at six Prizes, 6.7 at three, 60 at one.
**Do not replace it with a scalar.** A flat sweep improves monotonically all the way to *deleting the
term*, because the scalar moves both ends of the curve at once and a duel cannot see the endgame case
at all — every one of those rows buys the early game by selling the last Prize. **When a sweep
plateaus at zero, suspect the shape before you believe the conclusion.**

**Stickiness — what a Pokémon is *for*.** *13 Aug — #12.* Some cards exist to stand there and soak, and no
weight can express that because it is a claim about the card rather than the position. Three things
about how it is built are load-bearing. It is **derived, not tagged** — a tag would be re-typing a
fact already in the card data on 1,251 cards. It is **terminal Basics only**, because "cannot evolve
further" would call Charizard a wall and a Stage 2 is three cards you badly want to rescue. And
utility is matched by **effect verb, not card text** (`STALL_VERBS`), because Tauros confuses *itself*
and a regex on "Confused" promotes it. **Stickiness suppresses the rescue, never the Prize** — which
is how Trevor's caveat, leave them in *unless the opponent has one Prize*, falls out of the arithmetic
instead of being a special case. Kept on correctness rather than on a duel result; eight assertions in
`powertest.js` hold it.

**Weakness and Resistance reach the retreat comparison.** *13 Aug — #12.* `bestAffordableDamage` was the one
forecast path not going through `computeDamage`, so the "one currency" comparator answered in printed
numbers. **The engine's own comment promises the AI can never predict something the engine would not
do** — that is the property being preserved.

**Recoil is priced on what it leaves you, and overkill is not paid for.** *14 Aug — #12.* Recoil costs a
share of the HP remaining, **squared, meeting the old flat cliff exactly at `frac` of 1**, so every
decision the cliff got right is unchanged and only the slope below it is new. Separately `forecast`
returns `expUseful` beside `expDmg`, capped **per outcome** rather than on the mean. **`expUseful` is a
second field and not a cap in place, and that is not caution:** PlusPower asks *"is this 10 short of
lethal"*, a question about real damage that capping makes unanswerable for anything already lethal.

**Inert Energy, and an attachment that could never make anything bigger.** *16 Aug — #16.* Attaching a Grass
onto a cost of F strands the card. The rule was the easy half; **the exception was the whole job** —
every inert attachment was waved through on *"but it could pay for a retreat"*, and only the Active
can be made to retreat, so the exception is one slot wide now. **When a rule already has a carve-out,
measure the carve-out before you widen the rule.** A real bug fell out of a test written for something
else: `potential()` counted hypothetical Energy against attack *costs* only and never put it on the
slot, so **no attack in the game could be known to get bigger from an attachment.**

**Progress is worth a share of what it is progress toward.** *16 Aug — #16, and the design came out of
Trevor's plain-English reasoning rather than out of the code.* Advancing an attack used to pay a flat
`attachBuild` with no idea what was at the end of the road, so one Energy completing a 10-damage
Tackle beat one of four toward a 60 — permanently and by construction. Advancing is **amortised** now.
Two details are load-bearing: **`potential()` returns `goal` beside `short`**, because amortising
toward an attack the Pokémon will never afford prices a road it is not on; and **`survivesCharge`
discounts only the Active**, graded rather than a cliff.

**Who gets sent up.** *16 Aug — #16.* Promoting, being Whirlwinded up and choosing a Switch target were three
nearly-identical formulas with no obligation to agree. **They are one `promoteValue` now — keep it
that way.** Survival inside it is priced with **the retreat rule's own arithmetic**, because it is the
same bill read from the other side and one formula cannot disagree with itself. **The sacrificial
promote survives for free**: a bare Basic has nothing invested, so feeding it stays cheap without a
rule saying so.

**Two things the scorer could not see at all.** *16 Aug, both omissions rather than misjudgements — #16.*
**Attacking while Confused had no price**, and **both directions are asserted** — "never attack while
Confused" would be worse play than the bug. *The generalisable half: the retreat rule learned about
Confusion on 13 Aug and the attack path never did. **Check any decision that reads `status` for one
branch and not its siblings.*** And **recoil is waived when the defender prevents the damage** — see
[Rulings/PREVENTED-DAMAGE-RECOIL.md](Rulings/PREVENTED-DAMAGE-RECOIL.md) — priced at `f.pStopped`
rather than as an on/off switch, so it does not become entry seven in the cliff table above.

**Don't lose the game either.** *16 Aug, the exact mirror of "win the game if you can win the game" — #16.*
A 10 HP Electabuzz Knocked out its target, killed itself, handed over the last Prize and lost on the
turn it scored — rated 73.5 against a safe alternative at 33. **An average hid it, and that is the
part that generalises:** expected recoil was 5, and this scorer is built on expected value, so *any*
catastrophic minority branch is invisible to it by construction. **It had to be a different kind of
term, not a bigger one** — a self-Knock-Out that *ends the match* is charged `lastPrize`, not
`selfKO`, because no value of `selfKO` fixes this without breaking every ordinary recoil decision.
**Losing is not a large Knock Out.** The win shortcut in `choose()` needed its own guard, because it
returns a near-certain lethal *before any scoring runs*. **Where to look for more of these: anywhere
the scorer averages over outcomes and one of those outcomes is terminal.**

**Your own deck is a resource, and running out of it loses.** *16 Aug — #17, from two of Trevor's grab bag
items that turned out to be one.* The bot understood decking *you* out as a weapon and had no concept
of doing it to itself. Two terms, and the split is the recoil work's lesson reused: `deckBurn` is a
cost on the **squared share of what remains**, and `deckLoss` is terminal for a play that empties the
deck outright. **It is a curve and not the floor at 20 cards the report asked for** — a floor is the
cliff shape in the table above and would make 21-vs-19 a personality change — but the *band* is
Trevor's, settled by showing him the table: `deckBurn` is set so the band runs 20 down to 10.
**Gambler is priced on NET change and must not be capped alongside Bill:** it is the only recycling
card in the game, and its credit has its own weight (`deckRecycle`) rather than sharing `deckBurn`.
That split is load-bearing — the two were one number, and widening the burn band would have quietly
made recycling pay more than a Knock Out. ***A constant doing two jobs gets retuned for one.***

**Opening placement ranks before it measures.** *18 Aug — #15.* `setupAuto` chose the opening Active by
one line — highest HP among the Basics in hand — and it is **both sides'**, since the player's "auto"
button calls it too. That makes it a shared sensible default rather than an AI decision, which is why
the fix stayed in `engine.js`; an earlier draft of this file said to move it into `ai.js` and that was
wrong for the player-facing half. Basics are now ranked *stranded last*, then sorted by HP inside the
rank. **A line-starter is only stranded when nothing rescues it** — its evolution in hand, a spare copy
in hand (Trevor's refinement: only one can be Active, so the duplicate covers the evolution path and
the one out front is free to be spent), or nothing evolving from it at all. **Measured 16.6% → 0.0%**
across Trevor's eight Base Set decks, worst deck 27.4%; `abtest` puts 13.3% of games on a different
line with the win rate unmoved at 49.1% → 48.4%. **Keep HP as the tiebreak** — it was never the wrong
question, only the wrong *first* question.

**The instrument lied first, and the lesson is the transferable part.** `tools/openercheck.js`
originally reimplemented `setupAuto`'s rule in order to measure it, so it reported *identical figures
before and after the fix* — it was measuring a copy of the code rather than the code, and it also put
the defect at 6.0% when driving the real engine says 16.6%. **A measurement tool must call the thing
it measures.** Same shape as the green-for-the-wrong-reason case in [HISTORY-ARCHIVE-1.md](HISTORY-ARCHIVE-1.md), and it
was caught only by running the control against the pre-fix engine — which is [MEASUREMENT.md](MEASUREMENT.md)'s
standing rule doing exactly its job.

**The Energy pool is asked of the engine, not read off the printed cards.** *18 Aug.* `potentialOf`
built its symbol pool from `db[e.id].provides`, which is what a card prints — not what it *provides
where it is attached*. **That made the whole Charizard archetype invisible to the bot.** Fire Spin
costs `RRRR`; a Double Colorless on a Charizard is `RR` under Energy Burn and is the best attachment
in the deck, but read off the card it is `CC`, which pays nothing toward `RRRR`. Attaching one moved
`short` from 4 to 4 and scored **4.4 against a Fire Energy's 33.0**, so the bot never did it — four
dead cards in a sixty-card deck built around them. It now reads `E.slotSymbols(slot)`, which resolves
Energy Burn *and* the per-instance `asEnergy` override, so a Buzzap'd Electrode was mispriced by the
same line and is fixed by the same change. **Never re-derive what a slot provides; ask the engine.**

**Why no gate caught it, which is the transferable part.** Energy Burn is *passive* — there is no verb
to leave unscored and no action to leave unoffered, so both coverage checks were correct and silent.
`powertest.js` asserted the **engine** saw `RRRR` and it did. The AI was keeping a private copy of a
question the engine already answers, and a private copy is exactly what neither gate can see. **When
the AI recomputes something the engine exposes, that is the bug shape to suspect.** Worth 2.4 points
to the Charizard deck in `decksim` and 8.9% of games in `abtest`, with the field win rate unmoved —
and it moved no other deck in the roster, because no other deck runs Double Colorless. Found by
Trevor asking whether the bot knew a DCE turns into Fire.

**The bot may not choose its own Prize, and that is a self-restriction rather than a gap.** *19 Aug
2026.* Prizes are face down, and `ai.js` reads full engine state — so letting it pick would hand it
Peek's entire value for free, in every game, forever. It takes one at **random**. Exactly the same
reasoning as scoring `PEEK` at −Infinity, and the same shape as the Challenge restriction Trevor asked
for in Job 10: **the bot may only act on what it could legitimately know.**

**The one exception is the one that makes it fair.** Once somebody has played *Here Comes Team
Rocket!* every Prize is face up **to both players**, the information is public, and a bot picking at
random would be playing badly on purpose. So `prizeIndex` runs only when `state.prizesFaceUp`, and
`powertest.js` asserts both halves — random while face down, the useful card while face up.

**It reuses `cardKeepValue` rather than having an opinion of its own**, which is the part worth
copying. That per-card scoring was inlined in `handKeepValue` (Trevor's rule, 16 Aug: evolutions you
can use, Energy you are short of, Trainers are real cards) and was extracted so the Prize picker could
share it. **A second opinion about what a card is worth would have drifted from the first**, and the
bot would have valued the same card differently depending on where it was looking at it from.

**The player's own picker is a setting rather than a realness gate, and the first design here was
wrong.** I proposed gating it on whether the engine could see that the choice was real — the
`energyChoiceIsReal` pattern — and Trevor pushed back. The analogy does not hold: with Energy the
*engine* can judge realness objectively, while with a Prize only the player can, so the gate would
have taken the decision away in both directions. *[The setting, and where it lives →](INTERACTION.md)*


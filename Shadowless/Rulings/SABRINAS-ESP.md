# Sabrina's ESP — the one card that makes the board go back

*Append-only, and exempt from the 200-line target like every entry in this folder. Correct it; never
condense it.*

**Settled 9 Sep 2026, Job 16 (Shadowless 40), with Trevor.** The only card in fourteen sets that
re-flips, and the only place in this engine where state is restored.

## The card

> Attach Sabrina's ESP to 1 of your Pokémon with Sabrina in its name. At the end of your turn,
> discard Sabrina's ESP. **If that Pokémon uses an attack that involves flipping coins, Sabrina's ESP
> lets you re-flip those coins once. If you do, re-flip all the coins.**

## Why this needed something new, and nothing else does

**A re-flip is a decision made after seeing the result.** There is no pre-commitment that reproduces
it — asking "will you use ESP?" before the coins land is a different and much weaker card, and
auto-taking the better roll takes the choice away from the player and quietly assumes more heads is
always better, which is true of nearly every coin attack in the era and not something worth resting
a card on.

So the attack has to be able to **un-happen**, and nothing in this engine could do that.

**`shapecount` decided it, and its own message says a special case is correct here**: one printing,
one set, one distinct text, across all fourteen sets — searched over attacks, Powers *and* Trainer
text. **That last clause matters and is the correction this entry carries**: the first run of that
query used the tool's default scope, which is ability text only, and reported a zero that read as a
statement about the whole corpus. The conclusion survived the re-run; the process did not.
`shapecount` now names the scope it searched in every zero, because a zero is the one result nobody
re-reads.

## How it is built

**Snapshot, resolve, offer, restore-and-re-run.** State is JSON-cloneable — measured at 5.9 KB and
0.06 ms, so the cost is not the issue and never was.

Five decisions, each of which is the part that would be got wrong:

- **The snapshot is taken AFTER the Confusion gate and the once-per-play mark**, not at the top of
  `doAttack`. A re-flip must not re-roll a Confusion check or un-spend a once-per-stay attack —
  neither is the attack's coin, and re-flipping them would be a stronger card than the one printed.
- **Restore happens IN PLACE, not by reassigning `this.state`.** Callers up the stack hold
  `const s = this.state` across the gap — `doAnswer` does — and swapping the object would leave them
  writing `pendingAsk` onto a board nobody is looking at. Object identity is the contract; the
  contents are not.
- **The snapshot lives on the ENGINE, not in state.** A serialised copy of state stored inside state
  would nest a copy of the board inside the board. The consequence to know: a game saved between the
  attack and the answer loses the snapshot. Nothing saves mid-attack today, and if anything ever
  does, **the honest fix is to refuse the re-flip, not to restore a board that was never written
  down.**
- **The log is kept across the restore.** Everything else goes back. A silent rewind reads as the
  first result never having happened, which is precisely what a player who just watched three coins
  land will not believe — so the discarded flips, the rewind, and the new flips all stay in the log.
- **The spent mark is set on the RESTORED board.** The snapshot has the effect unspent, so without
  this the re-run offers the re-flip again and the card is an infinite reroll. `powertest` asserts
  it, and the assertion was watched going red with the mark removed.

**Whether the attack "involves flipping coins" is answered by counting the coins it actually threw**,
not by reading its script. A card can flip conditionally — Removal Pulse only flips if the defender
is holding Energy — so the script says *may flip* where the rule needs *did flip*.

## A note for whoever writes the next test here

**Do not stub `E.flip`.** The coin counter lives inside that method, so replacing it removes the
thing ESP keys on, the re-flip is never offered, and the test passes while measuring nothing. Use
`E.dev.forceFlip`, which is the engine's own hook and exists for this. The first draft of these rows
made exactly that mistake and reported `pendingAsk: null` as a bug in the card.

## What generalises

| Principle | Why it is here |
|---|---|
| **Restore IN PLACE when anything up the stack holds a reference** — object identity is the contract, the contents are not | `doAnswer` holds `const s = this.state` across the ask |
| **A snapshot cannot live inside the thing it snapshots**, and the state it cannot survive must be named rather than discovered | A mid-attack save would lose it; the answer is to refuse, not to improvise |
| **Rewind the board, keep the record.** An undone event that leaves no trace is indistinguishable from one that never happened | The player watched the coin land |
| **Ask what the code DID, not what it declares** — a conditional flip makes "does this attack flip coins" unanswerable from the script | Removal Pulse flips only against Energy |

## A second customer, and it wants the opposite — 9 Sep 2026

**Misty's Tentacruel's Flee also re-runs an attack, and it must come out IDENTICAL.** Only the escape
differs; the damage must not move. That is the exact inverse of what ESP wants, and building the
second one is what turned this card's bespoke pair of fields into a shared mechanism.

**`mulberry32` now exposes its state**, and restoring it is the whole difference:

| | restores state | restores the generator |
|---|---|---|
| **ESP** | yes | **no** — new coins are the entire point |
| **Flee** | yes | **yes** — the hit must be the same hit |

The function's arithmetic is untouched, so every existing seeded replay is bit-identical to before;
`get`/`set` are a window onto the seed rather than a change to it.

**Order matters and is fixed: ESP is asked first.** A re-flip changes the damage Flee would be
answering, so asking the defender about a result that is about to be thrown away would be asking
twice. `afterAttack` is the one place that decides this, and `espSkip` is what stops the chain
re-offering a question already declined.

**The snapshot is no longer ESP's private field**, so the caution in this entry now covers both: a
game saved between an attack and either answer loses it, and the honest fix remains refusing the
option rather than restoring a board that was never written down.

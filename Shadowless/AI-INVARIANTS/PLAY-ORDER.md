# 31 Aug 2026 — the attachment is last, and a search goes before a draw

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `playFirst`, `handGrowKind`

---

**`playFirst`, `handGrowKind`** · Job 14b · Trevor, from playing the Japan-only GBC sequel and from
Pocket. Grab bag, not the workbook.

**The invariant: some plays are ordered by INFORMATION rather than by value, and `choose` could not
express that.** Setup actions were picked purely by score, one per call — so an attach scoring 101
always went before a Bill scoring 10, and then the Bill drew the Charizard that would have changed
where the Energy went. **No score can fix this, because the Bill is not worth more; it is worth
EARLIER.**

Two orderings, both his:

- **Anything that grows your hand goes before the attachment**, so the attachment is made knowing
  what arrived. His note: *"there's a general order of operations to the AI's turns, where the energy
  attachment is always last before attacking/ending their turn, that way things are allowed to change
  if a trainer card alters the scenario mid-turn."*
- **A deck-NARROWING search goes before a random draw.** *"Using a Poke Ball to draw a basic pokemon
  out of the deck would be played before a Bill that draws two cards... removing the Poke Ball's basic
  pokemon from the pool increases the pull odds by one card."* One card of improvement, free, on every
  draw made afterwards.

**IT REORDERS, IT NEVER ADDS A PLAY.** Every candidate has to clear `threshold` on its own score,
exactly as it would to be chosen at all. A turn where nothing else was worth doing is byte-identical.

### The carve-out is the whole care, and it is four verbs rather than a category

**Only cards that cost NOTHING from hand are promoted**: `T_DRAW`, `T_POKE_BALL`,
`T_ENERGY_SEARCH`, `T_SEARCH_TO_HAND`.

**Professor Oak discards your hand. Gambler shuffles it back. Computer Search pitches two.** Promoting
any of those ahead of an attachment can eat the very Energy the turn was about to attach — the play
would destroy its own reason. **Trevor's own Professor Oak note is this rule from the other side**:
*"consumables like Potion or PlusPower want to be used immediately before Professor Oak even if
they're not needed, because they get discarded otherwise."*

**So the rule is: an action that can consume your hand is never promoted ahead of one that uses it.**
A new card joins the set only if it takes nothing from hand. Do not widen this to "hand-growing
Trainers" — that is the category, and the category is wrong.

### What it does, measured on one board

A Charmeleon on the evolution road with a Charizard in hand — the attach is worth ~101 and everything
else is worth ten or less:

| hand | before | now |
|---|---|---|
| Energy, Charizard | attach | attach — unchanged |
| Energy, Charizard, **Bill** | attach | **Bill** |
| Energy, Charizard, Bill, **Poké Ball** | attach | **Poké Ball**, then Bill, then attach |
| Energy, Charizard, **Professor Oak** | attach | **attach** — the carve-out holding |

**Three assertions in `powertest.js` rather than claim rows**, because these came off the grab bag and
not out of the workbook, and because they are about *when* rather than *what*. **Two of the three go
red against the previous commit; the third — Oak staying behind the attach — passes both ways on
purpose**, since it guards a behaviour that was already right and must survive.

### Deliberately NOT extended to benching or evolving, though the argument covers them

**Printing a whole turn makes the question obvious**, which is worth doing when you touch an
ordering. It now reads:

```
Poké Ball  ->  Bill  ->  attachEnergy  ->  evolve  ->  playBasic  ->  pass
```

**`playBasic` sits after the attachment and by the same argument it should not** — a Basic you have
not benched yet is an attach target that does not exist when the attach is scored. `evolve` is the
milder version of the same thing.

**Left alone on purpose, twice over.** Trevor's observation was about Trainers altering the scenario,
and the two cases are much weaker: `attachBuild` already looks ahead through `evolutionInHand` and
`potentialAs`, so an attachment made before an evolution is not blind to it; and a Basic benched this
turn has no Energy and is rarely the best target anyway. **Extending an ordering rule because its
argument happens to reach is how a narrow fix becomes a turn-structure rewrite** — the carve-out above
is the same lesson. If anyone does extend it, `playBasic` is the one with a real case and it wants its
own measurement.

### Measured, and the divergence is the point

`abtest 8 HEAD`: **75.6% of 17,296 games diverge, median first difference at action 3** — by far the
largest change of the job, and exactly what an ordering rule should look like. It fires on almost
every turn of almost every game, because Bill is in almost every deck. Win rate 48.9% → 49.0%,
symmetric and uninformative as always.

**The stall count read 341 against a documented floor of 308 and that is NOT a regression.** The floor
was measured on an identical tree playing the same games twice; once three quarters of the games are
different games the count resamples, and 341 is under two standard deviations of a 1.8% rate. Checked
properly rather than reasoned about — same instrument on both trees gives **20 actions in the longest
single turn on each, one cap hit on each, six null choices on each**, with games 0.7% longer. No loop,
no pathology. *[What a stall actually is, and the check to run →](../MISREADINGS.md)*

### And the promoted action keeps its own score

An earlier version copied the attachment's score onto it, which would have written a Bill into the
match log at **101.00** — a number true of nothing. The log is the one instrument that shows what the
bot weighed, so a promotion has to read as a promotion. `__why` says so instead.

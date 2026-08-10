# Shadowless — the engine's awkward-card machinery

Depth behind the "Base Set is complete" line in `CLAUDE.md`. Read this before adding cards, and
before writing a special case for one — five systems already exist for the shapes that do not fit
the DSL, and every set after Base Set leans on them.

Ordinary cards need none of this. A `cards.js` entry plus an `effects.js` entry is the whole job,
and the DSL verb reference is the comment block at the top of `effects.js`. **If a card needs
behaviour the DSL cannot express, add a verb rather than special-casing it**, and document it there.

## The five systems

### Pokémon Powers

`powerOf` / `powerUsable` / `powerActions` / `doPower` in `engine.js`, declared per card as a `p:`
object in `effects.js` with its reference comment above `EFFECTS`.

**Read Buzzap first.** It turns the Electrode card *itself* into an Energy card via an `asEnergy`
override on the card **instance**, which is why `energyProvides()` consults that before consulting
the card definition. It is the most structurally unusual thing in the engine and the pattern
generalises to anything that changes what a card *is* while in play.

Six in Base Set. **182 cards carry a Power across the WotC era**, so this is the system that scales
furthest. Neo adds one **Poké-Body**, which the generator already emits as a Power (filtered from
upstream's `abilities`), and 10 **Baby** Pokémon whose coin-flip rule is a whole rule rather than a
card effect — see the Pending section of `RULINGS.md`.

### `runAttack`

Split out of `doAttack`, and the seam that made Metronome cheap: it re-enters with the *defender's*
attack while `atk` is still Clefairy, so the copied attack really is Colorless and its recoil lands
on Clefairy. **Anything that copies or replays an attack should reuse it** rather than reimplementing
the resolution order.

### `lastAttackResult`

An event record written onto the defender when an attack resolves — `{turn, by, label, damage,
statuses}`. Mirror Move replays exactly that rather than recomputing.

Nothing parses the log. The log is prose for humans, and a reworded line must never break a card.
Trevor asked whether Mirror Move could read the log instead — the right instinct, the information
genuinely is already there — but the numbers would have to be regex'd back out of sentences. The
record is the same idea done as data.

### `pendingSwitch`

The only place a player decides something during their *opponent's* turn (Whirlwind). It follows the
same deferred-turn-end shape as `pendingPromote`, and the two can be outstanding at once **for
different players** — the gates in `act()` and `legalActions()` are per-player for that reason, and
were briefly not, which hung games.

### `playsAs: 'pokemon'`

Marks a Trainer that is played as a Basic Pokémon. `gen_cards.js` sets it from the one reliable
upstream signal — a Trainer carrying an `hp` — which across all 14 sets picks out exactly **Clefairy
Doll and Mysterious Fossil**. That is why Fossil needs only an `effects.js` entry for Mysterious
Fossil when it lands.

Note what the flag deliberately does *not* touch, both of which are correct and both of which fall
out of it being read at the point of **play** rather than baked into the card kind:

- **the opening setup**, where these are still Trainer cards that cannot start and do not prevent a
  mulligan;
- **`basicsIn()`**, so Revive and Pokémon Flute cannot pull one out of the discard.

The reasoning for both is in `RULINGS.md` under Clefairy Doll.

## Testing them

**The four playable theme decks contain none of the bespoke cards, so full games never exercise
any of this.** A green `selftest.js` run says nothing about Powers. Use:

- **`tools/powertest.js`** — builds boards by hand, fires a Power, asserts the exact state change.
  Half its cases assert that something is **illegal**, which is where these rules actually live.
- **the Sandbox deck**, which draws from everything implemented, for playing against them for real.

`powertest.js` also covers AI *usage*, which is not the same thing as the Power working: Energy Burn
passed every unit test while the AI silently never used it, because `bestAttackScore` returns
`{score, idx}` and the first scorer compared the objects.

## Two engine facts that have each cost an hour

**`state.winner` can legitimately be `0`.** Test it against `null`, never for truthiness.

**Unimplemented cards can never silently do nothing.** The deck validator refuses any deck
containing a card with no effect script. Preserve that property — it is why the card counts in
`CLAUDE.md` can be trusted.

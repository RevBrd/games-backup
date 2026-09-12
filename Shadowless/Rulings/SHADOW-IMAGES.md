# Shadow Images — an evasion the opponent rolls, until it fails

*Append-only, and exempt from the 200-line target like every entry in this folder. Correct it; never
condense it.*

**Settled 12 Sep 2026, Job 16 (Shadowless 40), with Trevor.** Rocket's Scyther (`gym1-13`).

## The card

> Whenever Rocket's Scyther is attacked, your opponent flips a coin. If tails, that attack does no
> damage to Rocket's Scyther. (Any other effects of the attack still happen.) This effect lasts until
> Rocket's Scyther takes damage (or is Benched or is evolved).

## Trevor's reading, which is the ruling

**It is an attack, not a Pokémon Power**, so it has to be put up and it has an end — and the text is
confusing unless that is kept in mind. His sequence:

1. Scyther uses Shadow Images. No damage; the turn ends.
2. The opponent attacks Scyther and flips a coin.
3. Heads: the attack proceeds normally. Tails: the attack proceeds, **does no damage**, and every
   other effect — a Paralysis, a discard — lands as normal.
4. **It persists.** Tails on the next attack, still up; tails again, still up; the first heads that
   actually deals damage ends it, and Scyther has to spend another turn to put it back.

## Where the coin goes, derived rather than assumed

**Event order is a documented weak spot for the assistants on this project**, so this was read off
the engine instead of reasoned about. `doAttack` resets the ESP counter and hands off to `runAttack`,
which does, in line order: the attack's **damage-shaping coins** → the **does-nothing exit** →
**Transparency's coin** → the **main hit** → the **post-damage effect coins**.

The Shadow Images coin sits **beside Transparency's**, which had already solved the same placement
problem. That gives exactly the causal shape of Trevor's sequence: the attack's damage is worked out,
then this coin decides whether it lands, then the attack's other effects carry on. An attack that
does nothing throws no coin, because it never reaches that line.

**One place this differs from a literal "after all of its own flips", said plainly:** a *status* coin
("flip; if heads, Paralyzed") belongs to the post-damage phase and so comes *after* the Shadow Images
coin rather than before. Coins are independent, so no outcome changes; only the order they appear in
the log and a seeded replay do.

## Five decisions

- **The coin is thrown in the application path, never in `computeDamage`.** The AI's forecast calls
  `computeDamage` directly, so a coin in there would be thrown every time the bot *thought* about
  attacking. Transparency's comment already says this and the placement follows it.
- **Damage only.** The miss feeds the main hit and not `blocked`, so the attack's other effects land.
  That is the entire difference from Transparency, where the coin stops everything.
- **One coin per attack**, kept by uid for the rest of that attack, so a snipe that reaches the Active
  is the same attack and does not get a coin of its own. Swift, which ignores "any other effects on
  the Defending Pokémon", throws no coin at all.
- **The coin does not count toward Sabrina's ESP.** ESP re-flips *"those coins"* — the attack's. A coin
  the defender's card throws is not one of them. **Transparency had the same fault and is fixed by the
  same flag**, before gym1 goes live and makes it observable. The first test of this reported a bug
  that was not there: it read the counter after the turn ended and picked up two between-turns waking
  coins. The row now reads it inside `afterAttack`, which is where ESP reads it.
- **"Benched or evolved" is a lazy settle, not a clear-on-move.** `settleConversions` already explains
  why: a clear at every route off the Active spot would have to find all of them and stay found. The
  effect is a promise about conditions, so the settle after every action asks whether they still hold.

## The call the repo had no ruling for: does Poison end it?

**Decided: no.** This is the one part of the card that is a genuine rules question rather than a
reading, and there is no settled principle in `Rulings/` distinguishing damage from damage counters.

The line drawn: **anything that *does damage* ends it — an attack, recoil, Rainbow Energy, Digger,
Bench Guard. Anything that *places or moves damage counters* does not — Poison between turns, Damage
Swap.** Two reasons, and they are not equally strong:

1. The engine's own vocabulary already splits those into two groups — `dealDamage` and `selfDamage`
   against direct counter writes. The weaker half of this: Poison's own log line says the Pokémon
   *"takes 10 from Poison"*, which cuts the other way.
2. The card's whole frame is attacks. If one Poison ended it, an opponent could disarm Shadow Images
   permanently without ever beating a coin, which inverts what the card is for. That is a playability
   argument — step 4 of the rulings order — and so it is **Trevor's to overturn**.

**Flipping it costs one line**: a `tookDamage` call in `betweenTurns` beside the Poison tick.

## What generalises

| Principle | Why it is here |
|---|---|
| **A defender's coin thrown during someone else's attack is not that attack's coin** | ESP re-flips the attack's coins; Transparency and Shadow Images both throw one |
| **An effect with an end condition is a promise; check the promise, don't guard every route** | Benched and evolved are found by the settle, not by fifteen call sites |
| **Read a counter where its consumer reads it** | The ESP counter looked wrong only because it was read after the turn had moved on |

## Poison DOES end it — Trevor, 12 Sep 2026

**The call above is overturned, and the reason it was wrong is worth more than the call.**

Trevor, the same day: *"if we go strictly by the wording on the card, I think poisoning should end it,
as should any theoretical trainer card or pokemon power that (somehow) does damage to it before the
main attack."* Printed text is **step 1** of the rulings order. The case for "no" was a playability
argument — **step 4** — and it was being used to overrule step 1, which is backwards. His playability
point also ran the other way from mine: *"It's a strong move but making it beatable with limited
creative counters keeps things kinda interesting."*

**It turns Poison from a loophole into a counter, because of the card's own clause.** An attack that
misses on tails still poisons — *"any other effects of the attack still happen"* — and the tick
between turns then strips Shadow Images. So a poisoning attack is a real answer to the card even on
the coin it loses. The first version of this entry saw only the loophole.

**How it is built now.** A counter that lands is damage taken, whatever put it there:

- **Immediately**, at every site known to land one — `tookDamage` is now called from the Poison tick
  and Damage Swap as well, so the log says so at the moment it happens.
- **As a guarantee**, in `settleLapses`: the effect records the damage total when it goes up, and the
  settle after every action ends it on any increase. A site nobody hooked — Pain Amplifier, landing
  in the same batch, or a verb not written yet — cannot slip past. **A heal lowers the mark**, so
  damage is measured from the lowest point since it went up.

**What the bot does and does not know.** It will not put Shadow Images up while Poisoned, since the tick
would end it before anyone could attack into it. It does **not** yet go looking for Poison as the
counter to an opponent's Shadow Images — a real strategy this ruling creates, named here rather than
guessed at.

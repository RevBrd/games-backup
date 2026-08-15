# Shadowless — the opponent AI

Depth behind the AI row in `CLAUDE.md`'s status table. Read this before changing anything in
`src/ai.js`, and before believing any number that claims the bot got better.

Split out of `ENGINE.md` and `TOOLING.md` on 11 Aug 2026, because AI material was living in three
files and none of them announced it. The next AI job — the weight re-tune in **Open** below — had to
be assembled from all three.

The one-line summary: **`selftest.js` proves the AI is *correct*; nothing but the two instruments
below can tell you whether it plays *well*, and all three of the ways that measurement lies have
already been paid for.**

## The two instruments — measuring "well", not "correct"

`selftest.js` proves the AI is correct and that the difficulty ladder is ordered. Neither it nor any
other suite can tell you whether the bot plays **well**, which is a different question and the one
that matters for a quality pass. Two tools answer it, and **neither is pass/fail**.

- **`tools/aitest.js`** counts specific decisions across a few hundred games: retreats that cost the
  turn's attack, retreats with nothing threatening the Active, Energy attached to an Active that
  dies before spending it, healing poured into a barely-scratched Pokemon. Every counter is a
  *suspicion*, not a bug — each of those is occasionally the right play. **Read the rates, compare
  two runs, and never judge a single one.**
- **`tools/aiduel.js`** seats the working-tree AI against a committed one and returns a win rate with
  a confidence interval. This is the only tool that answers "is it better than it was an hour ago".

```bash
node tools/aitest.js 6                  # behaviour counts
node tools/aiduel.js 8                  # vs HEAD
node tools/aiduel.js 8 HEAD --control   # baseline vs ITSELF — run this too
```

### Six ways this measurement lies, all of them paid for

**Never read selftest's win rates as AI quality.** Both seats run the same AI there, so seat 0's
figure measures first-player advantage and drifts several points from any change that alters game
length. It moved 54% → 51% on a change the duel then proved was a *gain*.

**Always run `--control` before believing a duel.** It seats the baseline against itself, so the
answer must be 50%. The first version of `aiduel.js` alternated seats by seed (`newSeat = i % 2`),
which correlated the seat with a deterministic opening coin flip — and the control came back at
**55.7%**. It had been reporting a six-point edge for a change that did not exist. Every seed is now
played **twice, mirrored**, so the bias cancels exactly instead of on average, and the control reads
50.0% by construction. A harness that agrees with you is worth nothing until it has disagreed with
you once.

**Check the game you are measuring is the game that exists.** Every harness in this repo drove setup
as `setupAuto(0); setupConfirm(0); setupAuto(1); setupConfirm(1)` — and `setupAuto` ends by calling
`setupConfirm`, so the fourth call re-ran `beginPlay()` and dealt a second set of Prizes. **Every
scripted game from Job 4 to 11 Aug 2026 ran at 12 Prizes instead of 6.** Nothing failed; the games
were simply twice as long, and the deck balance table reversed when it was fixed. A/B comparisons
survived it, because both sides played the same wrong game, but every absolute figure taken before
the fix is void. **Print the opening position once in a while and look at it.** This was found by
reading a match log, not by a test — see [HISTORY.md](HISTORY.md) for the full account.

**A duel cannot see a rare catastrophic error, and those are the ones that matter to a human.** The
bot used to decline game-winning attacks — 35 times in 96 games, measured. Fixing it moved the duel
by nothing at all (49.8% ± 3.9), because the position is uncommon and *both sides of an AI-vs-AI game
share the fault*, so it cancels. A player who watches it happen once never trusts the opponent again.
**When a fault is rare, symmetric, or about what the AI can perceive rather than how it scores,
assert it in `powertest.js` and count it in `aitest.js` — do not ask the duel.** The duel measures
average strength and nothing else.

**`aiduel.js` played only the four Base Set theme decks, so it could not see a change about any
other card.** The default pool is 240 cards holding **11** Pokémon the stickiness work classifies as
walls — and not one Kangaskhan, Chansey, Snorlax or Electabuzz, which are the four the work is
*for*. Overgrowth contains none at all. The change measured 51.0% ± 5.0 and the honest reading of
that number is **not** "no effect"; it is "the harness never dealt the situation".

This is the most dangerous entry in this list, because it fails *silently and in the safe direction*.
A blind harness reports 50% for anything, which reads as "your change did nothing" — the one verdict
nobody argues with. Everything above at least looked like a result.

`--gbc` swaps the pool for the **18 ladder decks**, which hold 112 wall cards and are what the player
actually faces now. Control run first, as ever: 50.0% ± 1.9 over 2,592 games. **The four theme decks
were the whole game when this tool was written and they are now a sixth of the card pool** — assume
the default pool is unrepresentative for anything touching a card outside Base Set.

**`selftest.js`'s AI ladder was asserting a statistical claim at a sample that could not carry it,
and it looked like a verdict rather than noise.** The check is `expert beats novice`, and it ran at
36 games against a true rate near 61% — one standard error is 8 points, so the 50% threshold sat 1.6
of them away and the gate went red for roughly one change in twenty on merit alone. Worse than
flaky: the seeds are fixed, so it is *deterministic per tree*. It fails identically every run and
reads as a finding.

It cost a diagnosis on 13 Aug 2026. The confusion-on-retreat fix tripped it at 61% against a 66%
baseline — and the **control in the same table**, expert against itself, had moved half as far in the
same direction. Both trees passed comfortably at 90 games. The tell was there on screen and had no
label on it.

Fixed rather than tuned around, and neither half costs anything — the whole suite runs in **under
three seconds**, so the sample was never a runtime tradeoff. The section has a floor of 90 games per
tier, the assertion fails only on a **significant** inversion (the interval is printed beside each
row, matching `aiduel.js`), and `expert vs expert` is now labelled as the control it always was.
**Raising `N` narrows the interval**, so a session that wants a tighter number can still have one.

The general lesson is the one this whole file keeps paying for: *a threshold is only as meaningful as
the sample under it, and a green suite that flickers teaches sessions to distrust the suite.*

**The per-deck table is not a per-deck verdict.** The four theme decks are not balanced against each
other, so the deck rows show deck strength, not AI quality. Zap sits at 25% in the control because
Zap is a 25% deck. Reading its 39% in a duel as a *regression* sent one session chasing a phantom
and "fixing" it — compare each row against the control's row, never against 50.

## The match log — the only view of what the bot actually thought

**"Save match log" on the game-over screen and after a pack**, and `CLAUDE.md` says to ask Trevor for
one whenever the AI does something baffling. It carries what no suite reports: the opponent's opening
hand, **both** Prize piles, and every option the AI weighed with its score and what it passed over.
The seed is in the header, so any match in it replays exactly.

`src/eventlog.js` is pure data — no DOM, no engine, handed strings by the UI. **The AI's reasoning is
gated behind `ai.explain`, set only by the browser**, because populating it in `selftest.js` would
cost a few hundred games' worth of time for nothing. So a scripted game produces a log with the
scores missing; that is the gate, not a bug.

It is worth more than its size suggests. The 12-Prize bug — every scripted game in the repo running
at twice the intended length since Job 4 — was found by reading one of these and noticing a deck lose
seven cards between two identical turn banners. No test could see it, because every test was making
the same mistake.

## The silent-failure surface

`ai.js` scores attacks with a `switch` over the verb list, and **a verb it has no case for scores as
plain base damage**. Nothing throws, no suite goes red, and the card works perfectly for the human —
the AI just misvalues it forever. That is the same failure the deck validator exists to prevent, one
level up: an unimplemented *card* can never silently do nothing, but an unscored *verb* currently
can.

The runtime behaviour is right — throwing mid-game over a scoring gap would be worse than
misplaying — so the guard belongs in the tooling. **It was built in Job 6a and it lives in
`selftest.js`:** walk every verb appearing in `effects.js`, and assert `ai.js` either scores it or
it sits on `UNSCORED_ON_PURPOSE`. It reports `96 of 97 verbs scored` today and it found **eleven**
the first time it ran — Thunderbolt believed free, Super Fang valued at zero, Earthquake's damage to
its own bench invisible. None of the eleven appears in a theme deck, so 480 full games ran
byte-identical before and after the fix; nothing but this check could see them.

**The opt-out list is the point, and it is deliberately almost empty.** One verb is on it
(`REQUIRE_DEF_STATUS`, a legality gate the engine refuses outright, so an illegal attack never
reaches the AI to be scored). Putting a verb there is a decision somebody made; leaving one off is
an oversight, and before the check the two were indistinguishable from outside.

**A verb that must not be *worth* anything is not the same as one that must not be scored**, and the
distinction matters because the list is the smaller of the two. Peek and Clairvoyance are worthless
to a bot that already reads full engine state — so `ai.js` scores `PEEK` at `-Infinity` on purpose,
with a comment saying why. That is a live declaration in the file that does the work, which beats an
entry on an opt-out list in a file that does not. The ruling behind it is in
[RULINGS.md](RULINGS.md); don't "fix" it by moving it.

## The Active and the Bench are scored in different units

`potential()` values an Active's attacks with `scoreAttackHypothetical` — full expected value — and
a benched Pokemon's with the printed damage number. **Anything comparing the two is comparing two
scales**, and `bestAffordableDamage()` exists as the honest comparator for decisions that must.

Measured across ~64 games before assuming the worst, because the obvious story turned out to be
wrong. **The means are nearly identical** (27.0 EV against 25.4 raw) — `scoreAttack` is calibrated
so a point is roughly a damage, so most of the time the two agree. It is the **tail** that diverges:

| | p50 | p90 | p95 | p99 |
|---|---|---|---|---|
| Active, expected value | 20 | 81 | 99 | 115 |
| Bench, printed damage | 30 | 50 | 50 | 60 |

**16.7% of Active evaluations exceed 55**, which is knockout scale — a number the bench branch
cannot produce at any merit, because printed damage stops around 60.

So state the fault precisely, since the loose version invites a bad fix: the Active is **not**
over-valued. Its number is right, a knockout really is worth more, and the Active deserves a premium
anyway for being the one that can act this turn — `teamReadiness` weights it ×4 deliberately. What
is wrong is that **a benched Pokemon has no way to say "I could take a Prize if you promoted me."**

Left unfixed on purpose. Closing it means making expected value computable for a slot that is not
Active, which is a real refactor of `scoreAttack`'s relationship with engine state, and the measured
prize is one in six comparisons in a direction that is partly correct already. **If you do take it
on, duel it** — and read the tail, not the mean, or you will conclude there was never a problem.

## Open

**The retreat re-tune is DONE — 13 Aug 2026 — and what it found was a curve, not a number.**
`retreatPrize` divides by the Prizes the opponent still needs, so the 12-Prize repair silently
doubled it and left the bot twice as eager to run away. The obvious response is to shrink the
scalar, and measured against the old value it plainly works:

| `retreatPrize` | vs previous AI |
|---|---|
| 30, flat | 51.3% ± 5.0 |
| 20, flat | 55.2% ± 5.0 |
| 10, flat | 57.0% ± 5.0 |
| 0 (term deleted) | 56.8% ± 5.0 |

**Read that table the wrong way and you delete the term.** It plateaus at nothing, and a duel will
happily tell you a capability it cannot see is worthless — the endgame case is rare, symmetric and
shared by both seats, which is this file's oldest warning. The scalar moves *both* ends of the curve
at once, so every row above buys the early game by selling the last Prize.

The comment on the weight claimed it was worth *"little when they need six more and everything when
they need one"*, and it never was: `60/6` is **10**, a sixth of the endgame value, paid on every
rescue from turn one. **Squaring the divisor** delivers the curve as described — 1.7 at six Prizes,
6.7 at three, 60 at one — and it moves only the end that was wrong.

**55.7% ± 5.0, then 55.9% ± 4.2 on an independent sample.** Significant twice, and the Zap row is
the one that matters, because Zap's cheap 30–40 HP Basics are why this term exists at all: **53% and
51% against 44% in the control**, the best of any variant tried. Every deck improved over control.
The counters agree — retreats 323 → 260, those costing the turn's attack 33% → 25%, total attack
score given up 2928 → 1419, retreats that *improved* the hit 53% → 61%.

**The lesson is worth more than the weight.** A term whose magnitude is a function of game state was
fitted in a game whose state was wrong, and a scalar sweep could only trade one end of it against
the other. When a sweep plateaus at zero, suspect the shape before you believe the conclusion.

## Stickiness — what a Pokémon is *for*

**Built 13 Aug 2026**, from Trevor's playtest note that Kangaskhan, Chansey, Snorlax and an
Electabuzz were being retreated when they should have stood and soaked. No weight can express that,
because it is not a claim about the position — it is a claim about the card.

**Proposed as a per-card tag and built as a derivation.** A tag is per-card labour on 221 cards going
on 1,251, inherited by every set added afterwards and skipped by the first session in a hurry.
Everything that makes those four walls is already in the data, so a tag would be re-typing a fact
rather than adding one. Three signals — HP, retreat cost, and an attack that pays rent for standing
there (drawing, stalling, or locking down) — over **terminal Basics only**.

**That last restriction is Trevor's and it is the load-bearing part.** The tempting rule is "cannot
evolve any further" and it calls **Charizard** a wall: 120 HP, retreat 3, nothing evolves from it. A
Stage 2 is three cards of investment and you badly want to rescue it. A Basic with nowhere to go has
no future to protect.

Utility is matched by **effect verb, not card text** (`STALL_VERBS` in `ai.js`), because Tauros
carries `STATUS_SELF_ON_TAILS` — it confuses *itself*. A regex on "Confused" makes Tauros a wall.

It comes out sparse and it finds cards nobody named: **23 of 150 species** score above zero, with
Kangaskhan, Snorlax and **Lickitung** at 0.90, Chansey 0.80, **Onix** and Lapras 0.70, Electabuzz
0.60 — and Charizard, Blastoise, Alakazam and Pikachu at flat 0. Lickitung and Onix arriving
unprompted is the argument for deriving rather than listing.

**Stickiness suppresses the rescue, never the Prize.** A wall about to die is the card doing its job,
so what it has "invested" was always going to be spent — but conceding a Prize can still lose the
game outright. That split is also how Trevor's own caveat, *leave them in unless the opponent has one
Prize*, falls out of the arithmetic rather than being written as a special case: at one Prize the
squared divisor puts that term at 60 and no amount of stickiness reaches it.

**Measured at +0.2 points and kept anyway** — 51.2% against 51.0% with the weight zeroed, over 2,592
`--gbc` games. Not a hedge: the rescue branch requires `danger >= remainingHP`, and a wall's defining
property is too much HP to be in that state until it is *already hurt*, which is exactly when Trevor
watched it happen. This is the "rare, symmetric, about perception" case that this file has said twice
already belongs in `powertest.js` rather than in a duel, and it has eight assertions there — including
the Charizard exclusion and the one-Prize override.

**Weakness and Resistance reach the retreat comparison now, too.** Trevor's note that the bot was not
reading them into its damage predictions was right in exactly one place: three of the four forecast
paths went through `computeDamage`, and `bestAffordableDamage` — the "one currency" comparator the
retreat delta runs on — did not. It answered *"would the Pokémon I am swapping to hit harder?"* in
printed numbers, so a 30 that is really 60 against the thing actually standing opposite counted as
30. Both operands were wrong in different directions at once, which is why it never looked like a
bias. Flat in a duel (50.8% ± 5.0), better on the independent yardstick — retreats costing the turn's
attack 25% → 23%, retreats improving the hit 61% → 63% — and kept on correctness: the engine's own
comment promises the AI can never predict something the engine would not do.

## Recoil, overkill, and a report that was right about the wrong game

**14 Aug 2026, from a match log.** Trevor reported the bot using Arcanine's Take Down (80, 30 recoil)
to knock something out where Flamethrower (50, discard a Fire) would have done. **The log did not
contain that.** All four Take Downs in it are listed below, and in both cases that killed, Flamethrower
could not have reached the target. Worth stating plainly, because a report you take at face value
sends you fixing the wrong thing:

| turn | outcome | could Flamethrower have killed? |
|---|---|---|
| 14 | Lickitung → 10/90, no KO | no |
| 16 | Lickitung KO'd | no — it had 80 left |
| ~38 | Dragonair KO'd | no — 80 HP, at full |
| 42 | Arcanine → 20/100, no KO | no |

**The instinct was right and the fault was in the other two.** On turn 42 Ken's Arcanine sat on 60
damage of 100, took Take Down anyway for 30 extra damage that killed nothing, and finished on 90 —
one hit from conceding a Prize it never had to give. It had done the same thing on turn 14.

Two separate faults, and they need different fixes:

**Recoil was flat with a cliff.** `selfDmg * 0.8`, the same charge whether the Pokémon was untouched
or one hit from dead, and only a *lethal* recoil paid `selfKO`. It is now priced on the share of what
remains — squared, and meeting the old cliff exactly at `frac` of 1, so every decision the cliff got
right is unchanged and only the slope below it is new. Arcanine now takes Take Down at 0–20 damage
and Flamethrower from 40 on.

**Overkill was still being paid for.** `scoreAttack` credited full expected damage, so when *both*
attacks killed, Take Down beat Flamethrower **by a tenth of a point** — which is Trevor's report
exactly, just not the game he found it in. There is no trample here: 80 into a Pokémon with 40 left
removes 40 and wastes 40. `forecast` now returns `expUseful` beside `expDmg`, capped **per outcome**
rather than on the mean (an attack doing 0-or-80 into 40 HP averages 40 raw and 20 useful, and the
mean of the capped values is the true one).

**`expUseful` is a second field rather than a cap in place, and that is not caution.** PlusPower asks
*"is this 10 short of lethal"* — a question about real damage that capping makes unanswerable for
anything already lethal. Leech healing and the Transparency test read it too.

**Flat on both duel pools** (51.0% ± 1.9 on `--gbc`), which by now is the expected reading for this
whole family: rare, symmetric, and about a position a human recognises instantly. Six assertions in
`powertest.js`, including the two that guard against over-correcting — a healthy Arcanine must still
take the recoil, and the bigger attack must still be used when only it reaches.

*Third instance in two days of the same shape: a quantity that should scale with proximity to an edge,
written flat with a cliff at the end.* `retreatPrize`'s divisor, `selftest`'s threshold, and now this.
Worth suspecting on sight.

**Left open.** Stickiness only reads the *rescue*. A wall is not yet preferred when **promoting** off
the Bench, and `potential()` still prices a benched Pokémon in printed damage — the Active/Bench unit
split above. Those are the same refactor and it is still not obviously worth it.

**First-player advantage is real and it has a measured size.** Expert mirrors had suggested 58–67%
for whoever is seated first. `aiduel.js --control` settles it: the baseline AI played against
*itself* over mirrored games sat at exactly 50%, but the same harness with seats assigned by seed
rather than mirrored came out at **55.7%** — that gap is the seat advantage, and it is large enough
to have faked a six-point AI improvement once. It may still be a true property of the ruleset rather
than a bug. What is settled is that **no AI measurement here is trustworthy unless it mirrors
seats**.

**Deck balance moves whenever the AI changes, so it is measured here rather than fixed.** After the
13 Aug retreat re-tune the four decks read **67 / 50 / 46 / 38** percent (Blackout / Brushfire / Zap
/ Overgrowth) — and the interesting part is the *spread*, which closed from 42 points to 29 with no
deck touched. A bot that runs away less is a bot whose weaker decks get to attack. Before the
re-tune they ran roughly **72 / 53 / 42 / 33** (Blackout / Zap / Brushfire / Overgrowth) across ~144
AI games at 40 turns each. The real ones were never
balanced against each other either, so this may simply be correct, and it is a good deal tighter
than it used to look. **Confirm with `selftest.js` before touching them**, and never compare against
a figure quoted before 11 Aug 2026 — those were measured at 12 Prizes and the ordering *reverses* at
the correct length, because Zap is a fast deck that wins a short game and loses a grind.

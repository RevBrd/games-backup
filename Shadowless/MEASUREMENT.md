# Shadowless — measuring the AI, and the six ways it has lied

**Read this before you believe any number that claims the bot got better**, before you read a saved
match log, and before you conclude from a flat result that your change did nothing. Split out of
[AI.md](AI.md) on 15 Aug 2026 — that file is *how the bot thinks and what has shipped*; this one is
*how you find out whether any of it worked.*

The split is here because this half has more entrances than the file it came from.
[PLAYTEST.md](PLAYTEST.md) sends you here when a report lands, [TOOLING.md](TOOLING.md) when you ask
what a suite covers, and `CLAUDE.md` when you want a match log — **and not one of those wants to read
about scoring weights on the way.**

The one-line summary: **`selftest.js` proves the AI is *correct*; nothing but the two instruments
below can tell you whether it plays *well*, and all six of the ways that measurement lies have
already been paid for by somebody.**

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
node tools/aitest.js 6 --gbc           # behaviour counts — TAKE THE FLAG, see below
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

**`aitest.js` was still blind in exactly this way until 16 Aug 2026** — a year of `--gbc` existing on
one tool and not the other. The sharpest illustration this project has: the theme decks say **6.3%**
of games end in a deck-out and the ladder decks say **17.7%**, which is the difference between a
curiosity and the third most common way the game ends. It takes the flag now. **Take it.**

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
## Standing measurements

Neither of these is a job. They are properties of the game that move when the AI moves, recorded here
so nobody re-derives them and nobody quotes a stale one.

**First-player advantage is real and it has a measured size.** Expert mirrors had suggested 58–67%
for whoever is seated first. `aiduel.js --control` settles it: the baseline AI played against
*itself* over mirrored games sat at exactly 50%, but the same harness with seats assigned by seed
rather than mirrored came out at **55.7%** — that gap is the seat advantage, and it is large enough
to have faked a six-point AI improvement once. It may still be a true property of the ruleset rather
than a bug. What is settled is that **no AI measurement here is trustworthy unless it mirrors
seats**.

**Deck balance moves whenever the AI changes, so it is measured here rather than fixed.** Every
figure below is a snapshot with a date on it, and **the snapshot is the point** — read the trend, not
the row.

| Measured | Blackout | Brushfire | Zap | Overgrowth | Spread |
|---|---|---|---|---|---|
| before the retreat re-tune, ~144 games | 72 | 42 | 53 | 33 | 39 |
| after it, 13 Aug | 67 | 50 | 46 | 38 | 29 |
| after Arcanine, 14 Aug (`selftest.js` default, 72 games per deck) | 68 | 56 | 46 | 31 | 37 |

The interesting part was the *spread*, which the retreat re-tune closed from 39 points to 29 with no
deck touched — a bot that runs away less is a bot whose weaker decks get to attack. It reads 37 again
after the recoil work, and **that is not evidence of anything**: at 72 games a row carries about ±12,
so not one deck's movement between those last two lines clears its own interval. The spread is a
difference of differences and is wider still. Raise the seed count if you actually need to know. The
real decks were never balanced against each other either, so a wide spread may simply be correct.

**Run `selftest.js` for today's figures rather than quoting the table**, and never compare against
anything from before 11 Aug 2026 — those were measured at 12 Prizes and the ordering *reverses* at
the correct length, because Zap is a fast deck that wins a short game and loses a grind.

## Where the rest of it is

**How the bot actually scores anything is [AI.md](AI.md)** — the silent-failure surface where an
unscored verb is misplayed forever and no suite can see it, the Active/Bench unit split, the three
stretches of work that have shipped, and the current `Open` list.

**What each suite covers is [TOOLING.md](TOOLING.md)**, including why none of them subsumes the
others. Nothing in that file can answer the question this one is about.

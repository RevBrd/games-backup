# Shadowless — every way a measurement here has lied

**Read this before you believe any number, and before you conclude from a flat result that your
change did nothing.** Every entry below is a real misreading that a session paid for. Not one was
found by inspecting a tool; every one was found by running a control, or by somebody noticing a
figure that did not fit.

[MEASUREMENT.md](MEASUREMENT.md) is the parent and holds the instruments themselves — what each one
measures, how to run it, the match log and the standing figures. This file is what they have done
wrong. Split out on 22 Aug 2026 for length; the parent is the only entrance and every route here
passes through it.

**Append-only, and exempt from the 200-line target.** Add an entry when an instrument misleads you.
Correct one that turns out wrong; never shorten one, because the condensed version keeps the fix and
loses the shape — and the shape is the transferable part. Same category as
[AI-INVARIANTS.md](AI-INVARIANTS.md) and [GRABHIST.md](GRABHIST.md).

**Deliberately not counted, and this is load-bearing rather than fussy.** The heading said "seven"
for a week and was wrong the moment somebody found an eighth — the same failure the list itself is
about. Then the parent file's own one-line summary went on promising *"all seven"* for another week
after the section had stopped counting, which is the identical mistake surviving in the identical
file. **Add to it; do not tally it, and do not quote a count of it anywhere.**

## The entries


**A counter that says "must be 0" and is not 0 may be counting the wrong thing.** `aitest.js`'s
*Declining to win* sat at 13 for weeks: turns where the bot held a guaranteed game-ending attack and
"did something else". It fired on **any** non-attack action taken in such a turn — so attaching an
Energy and then winning read as declining to win. Attacking last is ordinary correct play; the fault
being hunted is *ending* the turn with the lethal still on the table, and only `pass` does that.
Corrected 21 Aug 2026, and **the honest figure is 0 across 9,610 games**. The old number is not
comparable with the new one. The general shape is the nastiest kind of instrument failure here,
because it fails *loudly*: it points at a bug that does not exist, and the label tells you to go
looking.

**`aiduel.js` took its git ref positionally and ate any flag in front of it.** `aiduel 10 --gbc` ran
`git show --gbc:Shadowless/src/ai.js` and died in a stack trace that reads like a git problem. Fixed
the same day — flags are filtered out of the ref now — but it is worth knowing what the failure looked
like, because the obvious response is to go and look at git.

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

**The instrument may simply not contain the thing you changed, and it will not say so.** All six
above are ways a measurement *misreports*. This one is worse, because it reports cleanly. The 17 Aug
2026 retreat reversal ran `selftest.js` before and after and got **byte-identical win rates** — not
close, identical — which reads as "no effect" and is in fact "no exposure": the rule only bites where
a multi-symbol Energy meets a retreat cost, and **none of the four theme decks contains a Double
Colorless**. The same blindness had already produced a *false positive* five days earlier, when the
original ruling cited a movement in that table as evidence it was harmless. Measured where the cards
actually are — the ladder decks, 7 of 18 running DCE — the change diverged **22.5% of games**.

The check is one question asked before the run, not after: **does the fixture contain the card, the
verb or the board state the change is about?** Ask it of `selftest.js` in particular, whose deck list
is fixed, authentic and therefore permanently unrepresentative of anything outside Base Set. A count
of how often the changed code path was *entered* belongs in any A/B harness for the same reason.

**`abtest.js` accused a clean control of being a dirty one, and it had done so since it was written.**
*22 Aug 2026.* Its "is the working tree identical to the baseline" check compared `git show`'s blob
against the file on disk **byte for byte**, and on this machine `src/ai.js` is LF in the blob and CRLF
in the working copy. So the flag was permanently false for the one file an AI pass changes. Both
consequences point the wrong way: the reassuring *"src/ is identical, expect 0% divergence"* line
could never print, and the alarming *"0% divergence with a REAL diff in src/ — the change is inert, or
the pool never dealt it"* fired on a **deliberate null control**. Somebody following this file's own
standing rule — run the control first — was told by the tool that their control looked broken.

Found by running one, which is the only way it could have been found. Fixed by normalising line
endings before the comparison, and **verified in both directions**: the NOTE now prints on a null
control and stays silent against a real diff. *The transferable part is not about line endings.*
**A harness that reports on its own inputs can be wrong about them**, and that class of error is
invisible precisely when the harness is otherwise behaving — every game in those runs was simulated
correctly, and only the commentary was false.

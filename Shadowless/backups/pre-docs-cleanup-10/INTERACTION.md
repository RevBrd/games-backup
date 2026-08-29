# Shadowless — the moments the board stops and asks you something

Read this before you move the coin toss, the Energy picker, the opening flip, the opening-setup
screen, or any control on or around the Active card. Everything here is a *specific* piece of the
board — you need none of it to change how the board sizes itself, which is [LAYOUT.md](LAYOUT.md).

Split out of `LAYOUT.md` on 14 Aug 2026, at Trevor's request, and the reason is worth stating
because it reverses a proposal the tree records as rejected. The earlier seam was *sizing vs.
interaction* and it was withdrawn on the grounds that the coin toss is half placement geometry and
opening setup is nearly all visual traps. Both true, and neither is the criterion. The criterion is
the one that produced `COLLECTION.md`: **would a session working on something else need this?** A
session fixing the hand fan never needs the coin's tilt fallback, however geometric it is. And there
is attested harm — `LAYOUT.md` grew past the point where a long session reads all of it, and Job 7
lost time to sections that had been compacted out of view while the instance believed it had read
the file. See [MAINTENANCE.md](MAINTENANCE.md).

The one-line summary: **every one of these is a place the game interrupts itself, and each was built
once in the wrong spot first.**

## The rail's hover peek is a targeted DOM swap

**Hovering any card peeks its real printed face into the right-hand rail, and leaving puts the LOG
tab straight back.** That is what lets LOG be the working default — before it, inspecting a card cost
you the log you were reading.

**The peek writes into the rail directly. It must never call `render()`.** The whole board is rebuilt
on every render, and doing that on `mouseenter` is visible — you get a flicker on the one interaction
a player performs constantly. Anything else that reacts to hover has the same constraint.

## The coin toss

**It lands on the centre line, and that is the design decision** — the animation is the easy part.
Roughly half of all flips are the **opponent's**: Poison Sting, Confuse Ray, their Whirlwind. So
anything anchored to your hand, your half, or the space beside your discard pile would be claiming
their coin was tossed on your side of the table. The centre line is between the two players, it is
already where the board shouts at you, and it is the one spot that is there whatever the hand is
doing. It is also, for once, a case where an empty gap is not a risk: the toss is absolutely
positioned out of a **zero-height** strip, so it overhangs both halves without reflowing either and
costs nothing when no flip is happening.

That no-reflow property is load-bearing rather than tidy, and it is the one rule here that is really
a sizing rule. The board behind it is frozen on a pre-action snapshot for the duration, and a coin
that resized the mat would move the very cards you are waiting on.

**Anywhere the coin might move to has to clear the ticker.** You read the log underneath the coin
while it spins, so landing the coin *in* the ticker would cover the one thing a player is doing
during the two seconds it is in the air. Moving it there was proposed and rejected on 10 Aug 2026;
*[both arguments, and why this one beat the attribution one →](HISTORY.md)*

**The result is announced in exactly one place.** It used to be in the action bar; the bar now says
only *why* the game has stopped. Having it in both made the mat's version read as decoration rather
than as the event, which is the whole thing the toss was moved to fix.

Two smaller notes. The faces are **drawn, not lettered** — an H and a T are unambiguous and say
nothing, and the point of putting the toss on the mat is that it should look like an object; obverse
is struck in the board's amber, reverse in its steel, both with a milled rim so the edge reads as
metal while it tumbles. And the tumbling coin carries a **static 62° tilt underneath its animation**,
which is the reduced-motion fallback: with the animation suppressed a flat coin would sit showing
its obverse for the whole toss, which looks like a result that then changes its mind. Edge-on
commits to nothing. The landed *face* survives reduced motion, because that is information.

**`UI.flipDelay < 250` skips presentation entirely** (`dispatch()`), which is what the DEV tab's
"coin pause: off" setting does. Worth knowing before you try to screenshot a fast flip and find
there is nothing to screenshot — and it is how every test that is not *about* the flip gets past it.

**Nothing may change on screen until the coin lands, and the visual effects were exempt from that
for a job.** The board is frozen on a pre-action snapshot for the whole toss, which was always
right — but `diffForFx()` reads the **real** post-action state and used to be armed at dispatch
time, so the prize tile, the KO flash and the hit flash all fired while the coin was still in the
air. On any flip that decides whether a Pokémon survives, the flashing prizes announced the result
about two seconds early. `diffForFx` now runs when the presentation queue empties, in the same frame
the board unfreezes. **Anything else that reacts to the outcome must be armed there too**, not in
`dispatch`.

## The opponent's Trainer is held on the coin's strip too

**Trevor, from playing it: "it sometimes goes too fast and has you checking the really small print of
the log."** The opponent's whole turn resolved in one frame and the only record of a Trainer was a
line of 9.5px type in the rail. Now the board freezes and the card is shown for a beat — the same
treatment as a coin, in the same place, for the same reason the Energy picker is there.

**It is a stop in the presentation queue, not a new mechanism**, and that is the whole reason it was
cheap. `stepPresentation()` already froze the board on a pre-action snapshot and replayed the log
pausing on each flip; `presStops()` now also stops on `kind:'trainer'`. Everything else came free —
the freeze, the AI being gated (`maybeRunAI` returns early while `presenting()`), the unfreeze, and
`diffForFx` firing in the right frame.

Four things about it are load-bearing:

- **`UI.trainerHold` is 1000ms**, Trevor's figure, on the reasoning that both the Game Boy game and
  Pocket hold theirs slightly too long. Set it to 0 and the pause goes away while the log line still
  gets written. There is a DEV slider.
- **`UI.flipDelay < 250` is the master switch for ALL presentation and always was.** About forty
  places in `smoke.js` use it to mean "deal me a board with no pauses in it", so a Trainer hold with
  its own independent escape would have silently changed every one of them. The DEV panel says so on
  screen, because the label reads *coin pause* and nothing about it suggests it governs this.
- **Your own Trainers never pop.** You played it; you know. The test for that is one `e.p === 1` away
  from being wrong, so `smoke.js` asserts it directly.
- **The log line goes into the frozen log in the same frame the card appears.** The card *is* the
  announcement, and holding the text back would leave the rail contradicting the mat for a second.

The engine's `log()` takes an optional extra object now, and the Trainer line carries `card: inst.id`.
**A name is not an identifier** — four printings are called Rattata — so parsing the card back out of
the sentence could never have picked the right face.

## The Energy picker shares the coin's spot

**Which Energy gets discarded is asked on the centre line, in the coin's own place** — Trevor's call,
12 Aug 2026. A picker that appears wherever the action is makes you hunt for it with your eye every
time; a fixed place is learned once. The two are never live together, because a coin is presentation
and this is an interaction the game is waiting on, so they share the strip rather than compete.

It also beats an overlay sheet for a reason specific to this choice: **a sheet would cover the board,
and you are choosing from a Pokémon you want to look at while you choose.**

Three things it inherits and one it must not:

- The zero-height absolutely-positioned strip, so it overhangs both halves without reflowing either.
- The rule that it **must clear the ticker**, for the same reason the coin does — the ticker is what
  says *why* you are being asked.
- The capsule styling, so it reads as the same object the game uses to stop and ask you something.
- **It must NOT inherit `pointer-events:none`.** `.cointoss` sets it so a landing coin cannot swallow
  a click on the board underneath; a picker that ignores clicks is not a picker. `.pickcap` turns
  them back on.

**The action bar has to say what is happening now.** It kept printing "choose a Benched Pokemon to
bring up" while the bench was long since chosen and the board was asking which Energy to spend —
`UI.energyPick` outranks targeting in `renderActionBar`, and arming the picker clears `UI.targeting`
so the bench stops being highlighted for a question already answered.

**The picker only appears when the choice is real.** Three identical Fire Energy is not a decision.
The rule lives in the engine (`energyChoiceIsReal`) rather than here, so the AI and the UI cannot
disagree about it — see [ENGINE.md](ENGINE.md).

## The opening flip

**The game opens by presenting the who-goes-first flip**, over an empty board, before the setup
sheet. It is the flip with the largest measured consequence in the game — the seat is worth about
5.7 points of win rate, see [MEASUREMENT.md](MEASUREMENT.md) — and until 12 Aug 2026 it was the one coin the player
was *told* about in the log rather than shown.

Two things make it work, and both are load-bearing:

- **The setup sheet is suppressed while it plays** (`renderScreen`). The coin lands on the mat's
  centre line and the sheet is a full overlay, so a sheet drawn during the toss covers the thing
  being presented.
- **The snapshot blanks the opponent's side.** `newGame()` runs `setupAuto(1)` before the flip, so
  the real state already holds their Active and Bench — and suppressing the sheet exposed all of it,
  handing you their entire opening position before you chose yours. Both the card game and the Game
  Boy game place face down and turn up together. Blanking them **in the frozen snapshot** is the
  honest fix rather than a cheat: that view exists precisely to show a board that is not the current
  one, and while this coin is in the air their side genuinely is face down.

Note the overlay is *translucent*, so a dimmed version of the opponent's Active has always been
faintly visible behind the setup sheet itself. That is pre-existing and separate from this.

## Opening setup is a preview of the mat, not a dialog about it

`renderSetup()` builds your half of the board — an `ACTIVE` zone and a five-tile `BENCH`, in the
mat's own silk-screened captions, filled by clicking your real hand face. It replaced a wrapping
grid of `miniCard`s and a two-line text readout that said `Active: — none —` next to a board.

Three things it reuses on purpose, because reproducing them by hand is how they drift:

- **`renderBenchTile`, not `renderSlot`, for the bench.** The board's bench is deliberately not a
  small copy of the Active, and that size gap is most of what this screen is previewing.
- **`.side.mine` on the strip**, which brings the warm gradient with it, so it reads as a piece of
  your own cloth rather than a second panel inside the sheet. It also brings
  `.side.mine .slot.pcard.act{min-height:249px}`, which has to be overridden — that number is
  measured for a card carrying attack buttons on a board that must not resize mid-turn, and neither
  applies here (the measurement itself is in [LAYOUT.md](LAYOUT.md)). **Any override of it needs five
  classes to win**; `.setupmat .slot.act` silently loses to `.side.mine .slot.pcard.act`.
- **The empties match their filled footprint exactly** — 106×84 for a bench tile, 318 wide for the
  Active — so placing a Pokémon never moves the row or resizes the strip.

**The hand here does not fan and does not wrap.** `layoutHand()` measures the real panel and has
nothing to measure against in a sheet, and seven cards at 98px fit without overlapping anyway.
`align-items:flex-start` matters more than it looks: the old screen inherited `stretch`, which made
a Fire Energy as tall as a Charmeleon and filled the difference with dead grey.

**`setupTakeBack()` exists because this screen has slots.** A slot you can click and cannot un-click
is a trap, so the engine gained a take-back — legal anyway, since setup is arranging cards before
anything is revealed. Taking the **Active** back returns the whole bench with it: a bench with no
Active is not a legal board and nothing downstream knows how to dig the player out of it.

**Opening setup uses `handCard`, the real hand's own face.** It reached for a compact
text-carrying one first and printed "Flamethrower" as `Fla/met/hro/wer`; there is no longer such a
face and do not rebuild one. *[The rule, and why a dialog has no more room than the hand →](LAYOUT.md)*

## Actions live where the thing they act on is

Settled with Trevor 10 Aug. The board used to speak two interaction languages:
direct manipulation on the mat, *and* a detached row of verb buttons at the bottom that described
things already visible on screen. The bar is now a **status line plus commitments**, not a menu.

**Almost every card in hand has exactly one verb.** Energy can only be attached, a Stage 1 can only
evolve, a Trainer can only be played, a Basic can only be benched — so the bar's menu was nearly
always a menu of one, and choosing from it was a click with no choice in it. `handVerbs(i)` is the
single definition; `clickHandCard()` runs it when there is one and falls back to the bar's menu when
there are several, which is the only case where it is a real choice. **`smoke.js` drives the bar by
setting `UI.sel` directly**, which is why that fallback has to keep working.

**A Basic plays on click, with no confirmation.** Trevor's call, taken knowingly: the risk is a
misclick benching something, and the deal is that it stays this way unless it actually becomes
annoying. It is the one action with no target to double as a confirmation.

**Promote and Whirlwind's send-up are bench clicks.** `slotTargetable` had a `'promote'` scope the
whole time while the bar printed "Promote Growlithe" as text two inches below Growlithe. Both are
`forced: true` — the game cannot continue until you choose, so there is no Cancel, and the generic
targeting branch in the bar skips forced targeting so it cannot render one.

**`armForcedChoice()` runs at the top of `render()`, and that placement is the whole point.** It
lived in `renderActionBar()` first, which is wrong by exactly one step: `render()` builds the table
and *then* the bar, so the bench tiles asked `slotTargetable()` while `UI.targeting` was still null
and drew themselves unhighlighted. The prompt appeared and nothing lit up. Same shape as
`writeViewportDump()` having to run after `chooseLayout()` — see [INSPECTION.md](INSPECTION.md).

**Retreat is a row on the Active card and is the one confirmation-gated action.** It sits under the
attacks, beside the retreat cost it charges. Two things earn it the gate where attacking does not:
it is now a one-pixel misclick away from the attacks, and it spends Energy without giving an effect
back. Arming it **disables every attack button** for as long as it is armed — without that, arming
retreat and then misclicking an attack ends your turn.

The armed row says only "Retreating" and "Cancel". The instruction is already on the centre line and
in the bar, and a third copy would make the card's version read as decoration — the same mistake the
coin toss made when its result was announced in two places.

## The pause menu, and the Prize you pick yourself

**The first settings surface this game has, and it exists because a forfeit had nowhere to live.**
Trevor's shape, 19 Aug 2026. `MENU` sits at the far end of the status bar — **not on the action bar**,
because that bar is a status line plus commitments about *this turn* and a settings menu is neither.
It is a sheet for the same reason.

**Two rules on the button and one on the sheet.** The button carries no `margin-left:auto`, because
`.seedno` already has one and a second auto margin splits the free space between them instead of
pushing both right — it put the seed in the middle of the bar. And the sheet is **suppressed when
either the live state or the frozen view says the game is over**: `S()` is the presentation snapshot,
so during a coin flip that ends the match it still reads `main`, and offering to forfeit an already
decided game is exactly the wrong thing to do with that gap.

**A forfeit is a loss, not an escape hatch.** It goes through the engine's own `endGame`, so the
ladder, the stats and `progress.lost` all see it exactly as they would a real one. It is
confirmation-gated, which makes it the second action in the game to earn that after retreat — same
test: it cannot be undone and it spends something real.

## Choosing a Prize

**Your own Prize row IS the picker.** No sheet, no overlay — the tiles you have been looking at all
game light up amber and you click one. That is the Energy picker's argument reused: a card you are
choosing between is a card you want to *look at* while you choose, and a sheet would cover the board.

**Only your own row arms, and only when you are the one who owes a pick.** The opponent's row is
never clickable, and `armPrizeTile` is one function so the face-up and face-down tiles cannot drift
apart — Here Comes Team Rocket! means both kinds can be on screen in the same row.

**The default is Random and the toggle lives in the pause menu, which is deliberate.** Trevor's
framing: mostly not be bothered, but able to choose when it matters. It applies to the **next Knock
Out rather than the next match**, because Here Comes Team Rocket! can turn every Prize face up on turn
6 — possibly played by the opponent — and a setting you could only change at deck select would strand
you through the one situation where choosing is unambiguously worth it.

*[Why the bot does not get the same toggle →](AI.md)* · *[the queue behind it →](ENGINE.md)*

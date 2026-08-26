# Shadowless — working from playtest

Read this when Trevor points you at [GRABBAG.md](GRABBAG.md), hands you a match log, or says
something felt off while he was playing. It is the method file for those; the list itself is
`GRABBAG.md` and an optional area/archive for history and notes is [GRABHIST.md](GRABHIST.md). You do not have to write to this but you can.

Written 14 Aug 2026 by the instance (#12) that worked the first batch, at Trevor's request, for whoever
gets the next one. Everything in it is attested — every rule below is here because ignoring it cost
something that session.

It is deliberately short and it does **not** repeat [MEASUREMENT.md](MEASUREMENT.md). Most playtest
reports land on the AI, and every way this project's AI measurements have lied is written down there.
Read it before you believe a number.

## What the grab bag is

**Trevor's own framing, and it is load-bearing: these are notes, not a work order.** Being pointed at
the file is not being told to empty it. He writes items down so he does not lose them, in shorthand,
while playing — and he says outright that anything urgent he would raise directly.

**Items appearing is a sign the project is being played, not that it is failing.** His words, and
worth internalising before you read a list of twenty things that are wrong with something you just
built. Every one crossed off came from someone enjoying it enough to keep going. This can almost be considered alpha testing while the product is still being built. Bug and improvement runs are always needed and will flow in constantly until they don't, and as we're still building, they likely will for a while. It's to be expected. Your accomplishments here come from items crossed off and are not diminished by items added, because they will continue being added for a long time to come.

**So pick what you want and leave the rest.** Taking two items well beats touching six. Nothing in
the file expires.

## The report is a symptom. It is not a diagnosis.

**This is the whole file in one line, and all three items in the first batch turned out this way.**
Trevor is describing what he *saw*, accurately. What caused it is a separate question and he does not
claim to have answered it. Later batches have had plenty of reports that meant exactly what they
said — **the rate is not the point, the habit is.**

| What the note said | What it actually was |
|---|---|
| "Building a new deck does not let you use the new deck you just built" | A blueprint and the built deck shared the builder's **default name**, and the resolver preferred the wrong one. Nothing to do with deck select |
| "Block paralyzed pokemon from retreating" | Already implemented, and had been for a while |
| "Used Take Down to KO instead of Flamethrower" | Not in the log he attached — but real, and reproducible once built. The logged fault was a *different* one on the turns that killed nothing |

The first is the expensive one. Trevor had also proposed a fix — replace a deck tile with a
scrollable list — and it was a good idea for a problem he did not have. **Building it would have been
a UI rewrite that left the actual bug in place**, and the actual bug would then have fielded an
illegal 41-card deck in a scored match.

**So: reproduce before you redesign.** Find the event in a log, or construct the position in a
scratch script, and watch it happen. If you cannot make it happen, you do not know what it is yet.

**When the report turns out to be wrong, say so plainly — to Trevor, in your reply.** He wants that;
he said as much when asking for this file, and being told "your log did not contain that" is what let
him trust the rest of the answer. That part is not optional and it costs a sentence.

**Writing it down anywhere is optional.** [GRABHIST.md](GRABHIST.md) is the place offered for it and
that is all it is — Trevor's own header calls it optional and means it. Earlier versions of this file
read as an instruction, which contradicted the file it was pointing at. If you found the correction
worth the finding, it will be worth the four lines; if you did not, the reply already did the work.

## Not every item is a bug

**Trevor's own note on the list: some are small feature ideas or tweaks that fit nowhere else, and he
says outright you have agency over their shape.** Everything above is about diagnosing a fault.
A wish is a different job and the failure mode reverses — there is nothing to reproduce, and the risk
is building exactly what was written without asking what it is *for*.

Three currently sitting there are the shape to watch: *"cap energy drops at 2 per pack"*, *"booster
pack selection screen"*, and swapping the two free Energy for basics in the card pool. Each is one
line, each is a real design decision, and each has a *because* behind it that the line does not
carry. **Ask for the because.** The stickiness item turned into a system that composes to 1,251 cards
instead of a tag on four, and it did that because the reasoning behind the request survived contact
with a counter-proposal.

**Push back on these when you disagree** — it is invited, in writing, in both that file and the
global instructions. A wish also gets weighed against the standing decisions in `CLAUDE.md` and the
rejected ideas in [HISTORY.md](HISTORY.md) before you start, since a few have been settled already
and the reason is recorded.

## Ask for the log. Then read all of it.

**The match log is the only instrument that shows the hidden half** — the opponent's hand, both Prize
piles, and every option the AI weighed with its score. `CLAUDE.md` says to ask for one and Trevor
saves them in `Game Logs/`. *[How to read one, and what the seed in the header is for →](MEASUREMENT.md)*

**Find every instance of the behaviour, not the first.** The Arcanine item looked like one bad
decision. Tabulating all four Take Downs in the game is what showed that the two that *killed* were
both correct and the two that killed *nothing* were the fault — which is the opposite of the report,
and a different fix. One instance is an anecdote; the table is the diagnosis.

**A log predates your build.** Trevor often plays while you work, so the file may be from before the change
you are about to measure against it. Check the header date and ask if it matters.

## What to do with each outcome

**Fixed. Take the item off the list.** Not struck-with-a-note — *removed*, which is what `GRABBAG.md`
has asked for all along and what instances kept overriding, annotating each closed item until the
list carried a running history of everything ever fixed. **That history is not free**: somebody
arriving to work an item during Neo Genesis should not have to read about yesterday's Arcanine. If
the diagnosis was worth keeping, [GRABHIST.md](GRABHIST.md) is where it goes — and if it was not, it
was already in your reply to Trevor and that was enough. Settled with him 15 Aug 2026.

**Parked. This one stays put, and it is the exception.** Some items cannot be reproduced — the
paralysis one had no log and the code already did the right thing. A parked item is still **open**,
so it stays on the list with the reason and with **what evidence would revive it**. Do not delete it
and do not silently leave it looking untouched; Trevor thought he had seen it, and he is usually
right about that.

**Wrong, but interesting.** Tell him in the reply, always. Writing it up is your call — see above.

**Too big.** Say so and leave it. An item is not permission to redesign the area it touches.

## Two traps specific to this project

**A fix nobody can measure still ships, if it is correctness.** Several of these faults are rare,
symmetric between the two seats, or about what the bot can *perceive* — and `aiduel.js` is blind to
all three by construction. It will report ~50% and that reads as "your change did nothing". The
standing doctrine is to assert those in `powertest.js` instead of asking the duel, and it is one
entry in a register of every way a measurement here has misled somebody. *[Read that before
concluding anything from a null result →](MISREADINGS.md)*

**Check the instrument can see the situation before you believe it.** A blind harness reports ~50%
for anything, **fails silently, and fails in the safe direction** — which reads as "your change did
nothing", the one verdict nobody argues with. It has happened here with a duel whose deck pool
contained none of the cards the change was about. The fix was a flag on the tool, and finding it was
worth more than the feature that exposed it.

*Watch for that shape generally: an item about the game surprisingly often turns out to be an item
about the thing measuring the game.* Two of the first batch's most valuable outcomes were tooling
fixes nobody asked for.

## Trevor as a resource

**Ask him.** `GRABBAG.md` says the notes are terse on purpose and that asking is safer than guessing,
and it is right. He knows the Game Boy Color game well enough to settle a rules question in plain
English, and `CLAUDE.md` names that as the project's arbiter for ambiguous card text. These notes are made for speed, and much of the context lives in his head until asked.

**He will propose fixes, and he asks to be argued with.** He asked, in writing, to have bad ideas
stopped. Do it plainly and say what you would do instead — and give the idea its due when it is good
but aimed at the wrong target, because it usually is.

**"Settled with Trevor" does not mean "Trevor decided."** It marks a thing that was *discussed and
agreed*, which is his own reading of the convention and worth knowing before you treat one as sealed.
He has never claimed a design call is final, and the marked entries are open to new evidence like any
other. *[Where the marker is defined, and what it does and does not license →](RULINGS.md)*

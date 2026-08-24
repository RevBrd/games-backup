## Grab Bag History

This is optional, I just thought you might want to a place to document what you did. Edit this header or add your own instructions if you'd like.

**Optional means optional, and that is Trevor's line above rather than a courtesy.** Nothing here is
owed. Working an item and writing nothing down is a complete job — you will have told him what you
found in the reply, which is the part that actually matters. Write an entry when *you* think the
finding was worth the finding.

Kept newest-first, one entry per item, with **what it actually turned out to be** — which has
sometimes been something other than what the note said, and that gap is the reason anyone would read
this. A *parked* item is the one most worth writing up if you are on the fence,
because the next instance will otherwise re-derive the same diagnosis from scratch.

**Once an entry exists it is append-only**, like [HISTORY.md](HISTORY.md)
and [LOGBOOK.md](LOGBOOK.md) — that is a rule about *editing*, not about writing. Correct an entry if
it turns out wrong; never shorten one, because a condensed entry keeps the fix and loses the gap. The
200-line target does not apply. The method for working an item in the first place is
[PLAYTEST.md](PLAYTEST.md).

**Grep the date or the quoted report** — every entry opens with Trevor's own words in quotes, which
makes them findable. Newest first, so the batch you want is usually near the top.

**Everything before 19 Aug 2026 is in [GRABHIST-ARCHIVE-1.md](GRABHIST-ARCHIVE-1.md)**, verbatim —
#12, #16 and #17, thirteen items across five passes. **When this file passes ~450 again, start
`GRABHIST-ARCHIVE-2.md` rather than growing either one.** The rule is stated here, at the top, and
not only in the archive, because a limit written only inside the thing being limited is read after
the decision it was supposed to inform — which is exactly how this file reached **649** with a ~450
rule in its own header. It was split on 22 Aug 2026 and the archive is closed.

| When | Instance | Items |
|---|---|---|
| 23 Aug 2026 | #25, Job 12b | The centre line, which turned out to be the mat's shock absorber; the setup Active that was a bar because its bottom half was empty; the booster reveal climbing 61px as you turned cards over |
| 21 Aug 2026 | #21, third pass | Charizard capped at four Energy; the pay order discarding the Double Colorless first; a duel that reset its own baseline every commit |
| 21 Aug 2026 | #21, second pass | The Charizard benchmark; an Energy priced twice in one function; a wall is not an upgrade opportunity; why the evolve fix has to wait for the attach fix |
| 21 Aug 2026 | #21, Job 11 | Retreating into the wrong matchup; Teleport's flat 22 and the destination nobody chose; the Colorless Energy dead end; a counter that said "must be 0" and was counting the wrong thing |
| 19 Aug 2026 | #20, the UI pass | The hand that resized itself — a correct report whose stated cause was wrong twice over |
| *13–17 Aug* | *#12, #16, #17* | *[Archive 1](GRABHIST-ARCHIVE-1.md) — five passes, its own index at the top* |

---

### 23 Aug 2026 — Opus 5 #25 (the last of the shifting layout, and a strip nobody knew was load-bearing)

**"There are some events like a Pokemon being knocked out that cause a message to appear in that
centre line, causing the entire field to stretch."** Trevor's, with red brackets drawn on a
screenshot of where the centre line is, and the note that it happens too fast to capture. #20 had
already fixed the big one — the hand card whose height followed its contents — and this was the
residue: "very minor now, and I think I've found one."

**He was right about the location and right about the mechanism, which is not the usual outcome
here.** [PLAYTEST.md](PLAYTEST.md) is full of reports that meant something other than what they
said; this one meant exactly what it said. Worth recording, because the file's own table can read
as "assume the report is wrong."

**What it was.** `.centreline` is the only shrinkable item in the mat's flex column — both `.side`s
are `flex:0 0 auto`. So it is the mat's **shock absorber**: when the mat is squeezed it gives up its
own height first, and at Trevor's 1191x684 it sits at 4px rather than its declared 17. Nobody had
written that down and I do not think anybody knew it. The Knock Out banner and the targeting prompt
were ordinary flex children of that strip, and **a flex item's automatic minimum size is its
content's** — so the moment either appeared, the strip could no longer shrink, the mat overflowed,
and `fitBoard()` rescaled the entire board. Measured: **zoom 0.892 → 0.875** at 1191x684, 1.000 →
0.982 at 1366x768, 0.782 → 0.767 at 1280x600, and **nothing at all at 1600x900 and above**.

That last figure is the whole reason it survived a year. It is invisible on a roomy window, and the
tighter the viewport the worse it gets — so it was only ever reproducible on the machine of the one
person who could not stop to screenshot it.

**The fix was already written down, one section away.** `LAYOUT.md` says the coin's strip is
zero-height and absolutely positioned so a flip cannot reflow the mat, and adds *"anything else that
appears on the centre line inherits that."* The coin obeyed it. The Energy picker obeyed it. The
banner and the prompt never did. They hang off a `.midstrip` now, sharing the coin's geometry, and
`.centreline` carries an explicit `min-height:0`.

**And half the fix was sitting in the stylesheet as an orphan.** `.midline{min-height:0}` matched
nothing in `ui.js` — a rule left behind by a rename to `.centreline`, which had taken the element
and left the guard. *An orphan selector is not dead weight; it is a rule that lost its element.* Ask
what it was protecting before deleting it.

**The second item, which Trevor raised as "probably a separate pass".** The opening-setup screen,
where "the card being added to the active spot often gets horizontally stretched." Also true, also
not quite what it looked like. The setup Active is deliberately freed from the board's measured
249px min-height, by a five-class selector — and that selector **also beat the `CHOOSE A BASIC`
placeholder's own `min-height:106px`**, which is four classes. So the empty shape stood at **26px**
against the placed card's **99px**: a thin bar that popped to a squat card, and the strip grew 14px
under it. Both come from one `--setupact` custom property now.

**And when I showed him that, he said the card was still stretched — which it was, and I had stopped
one step short.** Fixing the jump made the two states agree at 318 wide by 99 tall, and 318x99 is a
bar rather than a card. The reason is that the attack buttons are gated on `phase === 'main'`, so in
setup the card had **nothing in its bottom half at all**. It carries the opponent-Active's read-only
attack lines now — cost, name, damage — which is the content it was missing rather than padding, and
which happens to answer the question the opening screen exists to ask. `--setupact` is **150px**,
swept across all 113 Basics: 72 at 150 with two attacks, 39 at 129 with one, 2 at 99 with none.
*The general shape: making two states agree is not the same as either of them being right.*

**Then Trevor found a third screen doing it, and it was the worst of them.** The booster reveal.
Same shape, three causes compounding, and the numbers are at 1191x684:

- A revealed slot carries a `NEW` tag or a `×N` count and a face-down slot did not, so turning any
  card over grew its grid row by **16px**.
- **The Rare's face-down back was sized with the commons' clamp** while the revealed Rare has its
  own taller one, so the last card jumped its row by another **48px** — at the most conspicuous
  possible moment, which is the one you are actually watching.
- The summary line was rendered only once everything was revealed, arriving in the same frame.

Total: the header climbed **61px** on the final flip. All three are the Active card's status-row rule
in different clothes — *reserve what the filled state needs in the empty one* — and it is now written
in [LAYOUT.md](LAYOUT.md) as a rule about that screen rather than as three separate patches.

Two smaller ones fell out of the same run and both generalise. **`width:auto` against a fixed height
does not know an image's ratio until it has loaded**, so a freshly revealed card was 0px wide for a
frame; declaring `aspect-ratio` reserves it. And **an inline image inside an inline-block sits on the
text baseline**, with a ~2px descender gap under it — that gap was literally the last 2px of the
shift, and `display:block` on the image is the fix. Not `line-height:0`; this project has a scar from
that one already.

**The instrument is the part worth stealing.** Neither `shot.js` nor `smoke.js` can see this class
of bug — one shoots a single state and the other has no layout engine — and #20 hit the same wall,
built a throwaway Chrome probe, found its fault with it and threw it away. `tools/probe.js` is that
instrument, kept: it walks one board through a list of named UI states in a single page load,
measures after each, reverts, and prints only the columns that moved. It re-measures `idle` at the
end as a control, because an incomplete revert would otherwise silently corrupt every row below it.
Both faults above went from "somewhere in the layout" to a named CSS rule in one run each.

Four notes across four logs all pointed at retreating and promoting. **They were not one fault, and
they were not four either.** Two were real and share a root, one was a design question wearing a bug's
clothes, and one thing nobody reported turned out to be the measuring tool.

**"Moltres shouldn't have retreated... The pokemon that replaced it was killed immediately by the same
attack Moltres would have survived"** — log 04-06-28. Right, reproducible, and Trevor's own guess at
the cause was one step off in an instructive way. He suspected resistance was missing from the damage
calculation. It is not: the engine applies it, the log even prints `Resistance: -30 -> 20`, and
`threatAgainst` runs damage through `computeDamage`. What was missing was resistance's **absence** on
the other Pokemon. The guard that stops the bot walking into a Knock Out read `incomingThreat` — the
threat against the Pokemon *leaving* — and compared it with the remaining HP of the one *arriving*.
Moltres resists Fighting, so High Jump Kick was 20 into its 30; Magmar resists nothing, so the same
attack was 50 into its 50. The bot compared 20 with 50, found no danger, and paid a Prize for it.

Rebuilt the position from the log and the retreat scored **31.5**, matching the logged figure exactly,
which is the point at which it stopped being a theory. It scores **−10.5** now and the bot plays Bill
instead. `threatAgainst` — the function that asks the question properly — has existed since Job 9 and
was written for `promote`, **which had the identical fault and was fixed without the fix being carried
across.** Second time. Worth expecting a third somewhere.

**"Exeggutor teleports to switch with Exeggutor of equal condition... Exeggutor promoted and switched
out immediately through Teleport"** — log 04-37-10. Also right, also reproducible, and the log makes it
vivid: Teleport scored **exactly 22 on four consecutive turns**, a flat number that never once looked
at the Bench. `selfSwitch` was `frail ? dangerSwap : 2`.

**The half no score could have shown is that the AI was not choosing where to go.** `SWITCH_SELF_CHOOSE`
falls back to `this.pick(me.bench.length)` — a seeded random — when the action carries no `opts.bench`,
and nothing in `ai.js` had ever written one. So "switched into an identical Exeggutor" was not a
misjudgement, it was a dice roll. It is a difference in `promoteValue` now, which makes a mirror swap
worth exactly 0 without a rule saying so, and the scorer fills in the destination while it scores —
the same pattern `scoreOnPlay` uses for triggered Powers, for the same reason.

**That fix introduced a crash and the crash is worth more than the fix.** `promoteValue` → `potential`
→ `scoreAttackHypothetical` → and for the ACTIVE slot that last one *is* `scoreAttack`, which is what
called in. Infinite recursion on any board where a self-switch attack is legal. **402 assertions and
144 complete games passed with the loop sitting there**, because no theme deck holds a self-switch
attack; it took building the Exeggutor position by hand to see it. There is a re-entry guard and a
regression test, and the trap is written up in [AI.md](AI.md) for the next caller.

**"The AI might be avoiding adding non-DCE energy to colorless pokemon"** — log 04-26-10. **The
observation is real and the mechanism is somewhere else**, which is the third time that shape has come
up in this file. Nothing avoids Energy by type: Fire, Grass and Psychic all score **identically** on a
Chansey, measured at every Energy count.

What is actually happening is a **cliff** — the sniff test this project has now been paid by seven
times. `potential()`'s `short` is the distance to the *cheapest attack the card can reach*, so it pins
at 0 the moment any attack becomes payable, and the attach rule's `noProgress` test then reads a card
with a paid-up Scrunch as finished. Chansey with two Energy scores a basic Energy at **−2** and a
Double Colorless at **185**. It can never walk up to Double-edge one card at a time; it stalls at two
Energy forever, and so does anything else with a cheap first attack and an expensive second one that
does not scale with spare Energy.

**Left unfixed on purpose.** It is a genuine design question — what is an Energy toward an attack two
turns away worth — in the most carefully tuned rule in the file, whose surplus and inert cases were
each measured at 18% and 9% of all attachments. That deserves its own pass and Trevor's answer, not a
third weight change in one session.

**The two Chansey retreats in that log are fine.** Both set up an attack and the first won a Prize. The
Energy attached to Chansey immediately before retreating it is not waste either — it was what made the
retreat payable, and `ai.js` prices that deliberately.

**"Bad retreat by Gloom on turn 14"** — same log as the Exeggutors, and this one does not survive
contact. The retreat set up the Bulbasaur Leech Seed that took the Prize, and Gloom held one Grass
against Poisonpowder's cost of two, so it could not have made the kill itself.

**And one nobody reported.** `aitest.js` prints *Declining to win* with the note **"must be 0"**, and
it had been sitting at 13. It counted **any** non-attack action taken in a turn where a game-ending
lethal was available — so attaching an Energy and then winning read as declining to win. Attacking
last is ordinary correct play; the fault is *ending* the turn with the lethal on the table, which only
`pass` does. Corrected, and the honest figure across 9,610 games is **0**. That is the nastiest kind of
instrument failure in this project's collection, because it fails loudly: it points at a bug that does
not exist and its own label sends you looking.

### 21 Aug 2026 — Opus 5 #21, third pass (Charizard, and a yardstick that reset itself)

**Trevor found the confound in his own benchmark before I did.** Every time the AI improves, so does
the AI piloting the field it is measured against — so a general improvement raises all thirteen decks
and the rank does not move. Correct, and it narrows the claim: the rank measures whether the bot can
fly *this archetype* relative to simpler ones, not AI quality in general.

**Two things survive it, and one of them fixed a tool that had been lying by construction since it was
written.** The assembly column is close to absolute — how often Charizard lands barely depends on how
well the opponent is played. And `aiduel.js` compares against `HEAD`, which **resets every commit**, so
it answers "did the last commit help" and reads ~50% forever no matter how far the AI has come. That
is why every duel figure in this project is a null. It takes `--baseline` now against a pinned commit.
The same day's work read 50.4% ±0.8 against HEAD and **51.5% ±0.9 against the pin**. Nothing about the
AI changed between those two numbers; only the yardstick did.

**Then Trevor described how he actually plays the Charizard deck, and it contained two faults.**
"Evolve on the bench and pre-load it with as much energy as you can beyond the 4 energy limit... when
you're forced to discard a DCE because you ran low on R it takes two away just by itself."

**The bot hard-capped Charizard at four Energy.** A fifth Fire scored **−2**, Active or benched.
Fire Spin discards two cards every use against one attachment per turn, so it could never fire twice
in a row — which is the deck. The surplus rule already carried two exceptions; this is the third, and
it is derived from the `COST_DISCARD_ENERGY` verb rather than from a list of cards, so every card that
eats its own Energy gets it and the other 1,200 do not. There is a test asserting Hitmonchan still
caps, because that rule is the most carefully tuned thing in `ai.js` and an exception that leaks is
worse than no exception.

**And the engine was discarding the wrong card, every single turn, invisibly.** `energyPayOrder`
spends what the Pokemon's own attacks do not ask for — but it asked `energyProvides`, which answers
what a card *is*, and under Energy Burn every Energy on a Charizard *is* Fire. So the Double Colorless
read as "Colorless, not needed" and went first. Fire + Fire + Double Colorless is exactly RRRR;
the old order left **one** symbol behind and the right order leaves **two**. Every Fire Spin cost
three symbols instead of two. **Nothing in any log would ever have shown this** — no line prints which
Energy card left.

**Together: the benchmark went from 8th of 13 at 46.9% in the morning to 6th at 52.8%.** The two
retreat repricings earlier in the day were worth one rank between them; this pair was worth **+5.3
points on its own**, and it is the largest single move the AI has had. Both halves came from one
paragraph of Trevor describing his own play, neither was in any grab bag item, and neither would have
been found by reading the code — the Charizard cap looks like the surplus rule working correctly, and
the discard order looks like the fallback working correctly.

*The pattern across all three passes today: every fault came from someone who knows how the cards are
supposed to be played saying so in plain English. None of them came from a tag, a weight sweep, or a
duel.*

### 21 Aug 2026 — Opus 5 #21, second pass (the retreat economy, and a benchmark)

Appended the same day. Trevor read the first pass and gave three things back that changed what was
worth doing, and the first of them is the most useful sentence anyone has contributed to measuring
this AI.

**"The Charizard deck is the benchmark."** It is very close to the deck he won the whole Base Set
bracket with himself, and it is still winning for him against the newer opponents. In `decksim` it
finished **eighth of thirteen**.

That punches through the ceiling on every number this project produces. A round robin runs the same
bot on both sides, so it can rank decks against each other and it can **never say the whole field is
being played badly** — a bot that retreats too much beats a bot that retreats too much about half the
time. A deck known to win in a human's hands finishing eighth is not a fact about the deck.
`decksim.js` prints its rank separately now with a line saying so, because that claim lives in
Trevor's head and nowhere else.

**"Every energy spent in a retreat is an entire turn you're losing."** This is an economic argument
rather than a preference, and it pointed at something concrete: the retreat rule charged **4** per
Energy discarded while `retreatSaveEnergy` credits **7** for the same commodity two lines below. One
function, one Energy, two prices — so a retreat that spent two to save three came out ahead by more
than the one Energy it actually netted. Both are 7 now, and `retreatBase` is purely tempo from here.

**The second half of the same argument was Chansey, and it needed a different fix.** *"Chansey is
meant to go in there, use Scrunch, and stall while everything else is powered up on the bench, ending
in a sacrifice."* The tempo term compares best affordable printed damage — and **Chansey's is Scrunch
at zero**, so every benched Pokemon read as an upgrade, every turn, and the swap spent the very Energy
that was charging the thing it was swapping to. `wallScore` suppresses the positive half of that delta
now, one-sided, so swapping a wall *down* still costs full price.

Together on the ladder decks: retreats **7.1 → 6.0 per 100 turns**, Energy burned **8.2 → 6.1**, and
games got measurably longer, which is what less Energy churn looks like. Benchmark 8th → 7th.

**"The AI evolves as soon as it can rather than as soon as it's ready."** True, and worse than it
sounds: `evolve` scores a flat **31.0** whether the target holds one Energy or three. Gloom attacks for
one Energy; Vileplume's only attack costs three.

**And this is the entry to read before touching it, because the obvious fix makes the bot worse.**
Attaching a third Grass to a Gloom scores **−2** — both Gloom's attacks are already paid, so
`potential`'s `short` sits at 0 and the attach rule reads no progress. **The bot cannot walk a Gloom to
three Energy, and evolving is what unblocks it**, because Vileplume's shortfall of 1 then reads as real
progress. Penalise premature evolution alone and Vileplume is stranded at two Energy permanently.
Verified in a constructed position, not reasoned about. Left unbuilt with the ordering written down.

**One thing I had wrong in the first pass and Trevor corrected.** I called the Chansey Energy cliff a
fault. It is correct play *for Chansey* — Double-edge is a kamikaze you only set up when a Double
Colorless finishes it in one turn. The rule is right there and wrong elsewhere, which is exactly why
the answer is per-card judgement rather than a weight, and why it stayed unbuilt.

### 19 Aug 2026 — Opus 5 #20 (the hand that resized itself)

**"Hand cards change size in different situations, sometimes as things are moving between turns or
after a turn has ended... It might be the whole screen any time anything is selected resizing
itself."** Trevor flagged it for a dedicated pass and asked for a backup first, which was the right
call — it turned out to reach the whole board.

**The report was accurate and both of its guesses at a cause were wrong, including mine.** Trevor
suspected coin flips and then selection. I suspected the action bar: `boardFitsAt()` refuses a zoom
step when the bar comes within 6px of the viewport bottom, so a bar that grew a line would rescale
everything. **Measured across five UI states at four viewports and `barH` was 34 in every single
one.** Nothing about selecting, targeting or flipping moves it. That hypothesis was dead in one run,
which is the entire argument for reproducing before redesigning.

**What it actually was: the hand's height is a function of what is IN the hand.** `handCard()`
renders one row per attack, so a card is 95px as an Energy or Trainer, 118px with one attack and
139px with two — and `.hand` is `align-items:stretch`, so every card takes the height of the tallest
one you are holding. Draw a two-attack Pokémon and the whole hand grows 21px. Play it and it shrinks
back. **That is exactly what Trevor saw, and "between turns" is right because that is when you draw.**

**The board followed because the hand panel is a child of the column `fitBoard()` measures.** Past a
certain hand size the extra height tipped the mat into overflow and the fitter rescaled the entire
board: at 1366x768, zoom 1.000 up to eleven cards and 0.973 at twelve. **At 1280x600 the hand alone
drove three different zoom levels.** So the "whole screen resizing" half of the report was also
literally true — it just was not caused by selecting anything.

**The fix is the bench tile's, reused.** Fix the card height and let the sigil absorb the difference,
cropped at full width rather than shrunk to keep a square aspect — which is what had made the art
*set* the height instead of consuming what was left. Height is **118px**, measured against the era's
worst case rather than today's: **only two printings in fourteen sets carry three attacks**
(Rocket's Mewtwo, Ho-oh) and both fit at 118 with the art at its floor, checked by rendering one.
Gym landing will not move it.

**It made the board bigger, which nobody asked for and is worth knowing.** Because 118 is *below*
the old two-attack height of 139, the fitter now holds zoom 1.000 at 1366x768 at every hand size —
where before a twelve-card hand cost 2.7%. One card height, one zoom, every viewport, hand sizes 2
through 20.

**Two things about the method.** Every number here came from a throwaway Chrome probe that renders
the built file and dumps geometry into the DOM, because `smoke.js` has no layout engine and
`shot.js` shoots one state at a time — **neither can compare two states, which is what this bug
was.** And the first useful measurement was the one that *refuted* me; I had a plausible mechanism,
a matching symptom, and it was not the cause.

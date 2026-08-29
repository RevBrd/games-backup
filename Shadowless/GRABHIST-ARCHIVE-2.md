# Shadowless — grab bag history archive 2: Jobs 10.5 and 11

**The 19–21 Aug 2026 entries, verbatim and unedited** — #20's UI pass and #21's three passes through
Job 11. Split off [GRABHIST.md](GRABHIST.md) on 26 Aug 2026, when that file reached 526 lines against
the ~450 its own header sets, at the **job boundary** between Job 11 and Job 12.

**Read it when you meet one of the behaviours below**, or when you want the account behind an
[AI-INVARIANTS-ARCHIVE-2.md](AI-INVARIANTS-ARCHIVE-2.md) entry dated 21 Aug. Nothing here is
superseded; it is older, not wrong.

| When | Instance | Items |
|---|---|---|
| 21 Aug 2026 | #21, third pass | Charizard capped at four Energy; the pay order discarding the Double Colorless first; a duel that reset its own baseline every commit |
| 21 Aug 2026 | #21, second pass | The Charizard benchmark; an Energy priced twice in one function; a wall is not an upgrade opportunity; why the evolve fix has to wait for the attach fix |
| 21 Aug 2026 | #21, Job 11 | Retreating into the wrong matchup; Teleport's flat 22 and the destination nobody chose; the Colorless Energy dead end; a counter that said "must be 0" and was counting the wrong thing |
| 19 Aug 2026 | #20, the UI pass | The hand that resized itself — a correct report whose stated cause was wrong twice over |

**This file is an archive. It only ever grows, it is never rewritten, and nothing already in it may
be edited or condensed** — a condensed entry keeps the fix and loses the gap between what the report
said and what was actually found, which is the only reason anyone reads one. Correct an entry that
turns out wrong; never shorten one. The 200-line target does not apply. **Start
`GRABHIST-ARCHIVE-3.md` rather than growing this one past ~450.**

---

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

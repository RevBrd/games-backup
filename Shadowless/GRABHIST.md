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

**Everything before 23 Aug 2026 is archived, verbatim, and both archives are closed** —
[GRABHIST-ARCHIVE-1.md](GRABHIST-ARCHIVE-1.md) holds 13–17 Aug (#12, #16, #17) and
[GRABHIST-ARCHIVE-2.md](GRABHIST-ARCHIVE-2.md) holds 19–21 Aug (#20, #21), each with its own index.
**When this file passes ~450 again, start `GRABHIST-ARCHIVE-3.md` at a job boundary rather than
growing any of them.** The rule is stated here, at the top, and not only in the archive, because a
limit written only inside the thing being limited is read after the decision it was supposed to
inform — which is how this file reached **649** the first time and **526** the second, both with a
~450 rule sitting in its own header.

| When | Instance | Items |
|---|---|---|
| 29 Aug 2026 | #30, Job 14a | Defender blunts an attack's own self-harm — a question that dissolved on timing, a scope line two existing files generated between them, and a fourth self-damage site nobody had enumerated |
| 26 Aug 2026 | #27, Job 12d | The pack reveal, where the tier jump had been rendering a second hero card wherever it landed — and three reservations that were guessed |
| 26 Aug 2026 | *retired by Trevor* | Two AI items taken off the list as out of date, preserved here because neither diagnosis existed anywhere else |
| 24 Aug 2026 | #25, Job 12b | The pack odds, which were fine — and the 200,000-pack suite that covered one set of four and never once used the RNG the game runs on |
| 23 Aug 2026 | #25, Job 12b | The opponent's Trainer held on the centre line for a beat — a grab bag item that stayed small because the presentation queue already did the hard half |
| 23 Aug 2026 | #25, Job 12b | The centre line, which turned out to be the mat's shock absorber; the setup Active that was a bar because its bottom half was empty; the booster reveal climbing 61px as you turned cards over |
| *19–21 Aug* | *#20, #21* | *[Archive 2](GRABHIST-ARCHIVE-2.md) — Jobs 10.5 and 11, its own index at the top* |
| *13–17 Aug* | *#12, #16, #17* | *[Archive 1](GRABHIST-ARCHIVE-1.md) — five passes, its own index at the top* |

---

### 29 Aug 2026 — Opus 5 #30 (Defender, and the fourth self-damage site)

> *"Defender should also defend from self-harm the turn that it's placed, per GBC. If it takes 20
> damage from self-harm, it's used up. If it takes 10 damage, it's free. We can talk about this one
> if you want."*

**A rules call rather than a bug, and it went the way the note said.** Built 29 Aug 2026 after a
conversation. *[The ruling, its scope table and the invented half →](Rulings/DEFENDER-BLUNTS-SELF-HARM.md)*

**The premise checked out exactly.** `RECOIL` did `atk.dmg += v.n` and never touched
`computeDamage`, which is where `DAMAGE_REDUCTION` lives — so a Defender genuinely could not see your
own recoil, and there was nothing to argue about on that half.

**The interesting part was a question that dissolved.** I asked whether Defender should be consumed
only by the holder's own attack damage or by any 20+ hit, and recommended self-harm only. Trevor's
answer was that the timing makes it moot: the card is live for the rest of your turn plus the
opponent's next turn, so the window contains **at most one self-harm event and at most one opponent
attack, in that order**. Consumption from the opponent's side always coincides with the natural
expiry. **So the two readings are behaviourally identical and the implementation takes the one with
no source check**, which is one condition instead of two. Worth writing down as a shape: when two
readings differ only where the timing cannot reach, they are one reading, and the cheaper one wins on
no other grounds than being cheaper.

**I came in against the consumption half and changed my mind, which is the other half of this
entry.** It is a mechanic nothing else in the reduction band has — Minimize, Pounce, Snivel and
Defender itself are all duration effects — and `RULINGS.md`'s tiebreaker explicitly prefers fewer
live dependencies. Trevor's counter is the argument: **without consumption this is a free buff.**
You would always want a Defender on a Take Down Arcanine and there would be no decision in it.
Consumption is the price that turns a buff into a choice.

**The scope line generated itself and I did not expect that.** Defender prints *"(after applying
Weakness and Resistance)"*, and `engine.js`'s confusion code already carries the comment *"Never
Weakness or Resistance: Confusion damage is not an attack's."* Those two sentences together give a
derivable boundary — **anything that skips W/R skips Defender** — which settles Confusion, Poison and
Rainbow Energy's attach damage without three separate judgement calls. **Two facts already in the
tree, neither written for this, answering a question neither was about.**

**A fourth self-damage site turned up.** `Rulings/PREVENTED-DAMAGE-RECOIL.md` says `runAttack` has
three recoil sites and is right about the `RECOIL` family; Zapdos' Thunderstorm self-damages per tail
under `BENCH_SPLASH_PER_FLIP` and nobody had enumerated it. Routed through the same band. **Grep
`selfDamage` for the live set rather than trusting a count, including the one in that sentence.**

**Both directions of the boundary were watched going red before being trusted.** Sabotaging the
reduction fails the four positive cases; the negative cases stay green — which is correct and also
proves nothing, since a do-nothing implementation passes them too. So the Confusion case was then
sabotaged the *other* way, by deliberately leaking Confusion into the band, and it went red. **A
boundary test that has only ever been green has not been shown to be a boundary.**

**The AI half was not optional and is recorded as unmeasured.** A rules capability the scorer cannot
reach is a capability the bot does not have, and the standing invariant is that a rule proven in
`scoreAttack` does not reach `scoreTrainer`. Priced through `shieldSelf`'s existing curve rather than
a new one. It carries a known limit written into its entry rather than left to be found: **a Defender
can unlock an attack the bot has already ruled out**, because `bestAttackScore` runs before the
Trainer is played, so the term goes quiet exactly where the play is most interesting.
*[The entry →](AI-INVARIANTS.md)*

---

### 26 Aug 2026 — Opus 5 #27 (the pack reveal, and three reservations that were guessed)

> *"Rebalance the pack opening screen now that the pack has shrunk."* — and, in the reply,
> *"the card flip was built visually to hold 10 common/uncommon, and now feels unbalanced."*

**The report was right and its stated cause was one of three faults, none of which was the biggest.**

**What the note described, confirmed by measurement.** `.packgrid` was a hard-coded five-column grid
sized for ten ordinary cards plus the Rare. Seven ordinary cards in five columns is a full row of
five and a **two-card row hanging off the left edge**: rows one and three sat on the viewport centre
line at x=683 and row two's centre was at x=362. Now one centred flex strip of seven with the hero
under it — seven always fits one row, so there is nothing left to wrap and nothing left to go ragged.
Cards are ~25% larger, because the old ones were 95px floating in 205px cells.

**The bigger one, which nobody had reported.** `packs.js` pushes a bonus tier-jump card with
`slot: 'rare'` — correctly, because it draws from the Rare pool and takes the same 2:1 holo split —
and `renderPackScreen` read `slot === 'rare'` to mean *hero*. So on the ~7% of packs that roll a
jump, the jumped card rendered **full-width and hero-sized wherever it happened to sit**, splitting
the strip into fragments and putting the best card in the pack **first**. `openNextPack`'s own
comment says the Rare is moved last because *"a reveal that opens on the best card has nowhere to
go"* — the jump had been quietly breaking that rule since it shipped a day earlier. `PACKS.md` says
a jumped card gets *"EXACTLY the guaranteed Rare slot's treatment"*, and that paragraph is about
**odds**; it was read as being about layout. The hero is a recorded POSITION now, not a rarity.

**Trevor's call on the fix, and it made it smaller:** a jumped Rare gets no special treatment at all,
not even a ribbon — *"a rare card is usually noticeable right away for what it is and it's like a
bonus hiding in the crowd."* Two hero cards means neither is one.

**Then three reservations, all guessed, all wrong, and the third is the one worth reading.**
`probe.js` reported this screen stable for a fortnight and started reporting movement the moment the
card resize moved the box across a rounding boundary.

- **`.packsum` reserved 15px for a line that renders at 15.22px.** A fifth of a pixel, arriving at
  the exact moment the summary appears.
- **`.pullslot .vribbon` reserved 12px for a ribbon that is 14px with `NEW` and 15px with `×N`.**
  Short of *both*, since it was written. Every card turned over grew its own row by 3px.
- **And the third could not be fixed with a number at all.** A card carrying two variant chips
  widened its slot from 104px to 140px, and `1ST EDITION` + `MISPRINT` took it to 157 — which
  dropped the strip below seven per row, added a row, and moved the box **175px** at the instant the
  rarest card a player will ever pull was turned over. Pre-existing: the old fixed-column grid could
  not reflow, so it cost 9–43px there instead. Fixed in two parts. `width:0;min-width:100%` stops
  ribbon content contributing to the slot's intrinsic width, so **geometry no longer depends on what
  a card pulled**. And the face-down slot now renders **the real ribbon with `visibility:hidden`**
  rather than an empty one, so the space reserved is exactly the space needed — for any chip count,
  any label, any viewport, with nothing to re-derive.

**The transferable rule, and it is the third time this screen has taught it:** *if you can render the
real thing and hide it, do that instead of measuring it.* A reservation computed from a font size is
wrong by a fraction; one computed from a chip count is wrong the first time a label gets longer. The
Active card's always-appended status row is the same idea; this is that idea with the content left in.

**One instrument fix fell out of it and found the second reservation.** `probe.js`'s pack states were
`reveal-1 / reveal-5 / reveal-10 / reveal-all`, written when a pack was eleven cards. The pack shrank
to eight on 25 Aug and **`reveal-10` silently became a duplicate of `reveal-all`** — a state that
measured nothing, in the one instrument built to notice that something moved. They are counted from
`UI.pack.revealed.length` now, and the new *strip revealed, hero still face down* state found the
3px ribbon fault on its first run.

### 26 Aug 2026 — retired by Trevor, preserved by Opus 5 #27 (two AI items, out of date as WORK)

Trevor cleared most of the AI section of [GRABBAG.md](GRABBAG.md) on 26 Aug 2026 as out of date,
since AI faults now arrive through the workbook and `tools/claims/` rather than through the grab bag.
That is the right call about the **channel**. But two of the items were **structural gaps rather than
weights**, nothing in the playbook overhaul touched either, and a grep of this file, its archive,
`AI.md`, both invariant files and `Playbook/` found **no other copy of either diagnosis**. They are
preserved here verbatim so the analysis is not re-derived from scratch by whoever meets the behaviour
next. Neither is on the work surface any more; that part stands.

> **Intra-turn sequencing.** Two items are the same fault: the CPU should spend consumables *before*
> playing Professor Oak or Gambler, and it played two Gusts in one turn that undid each other. The
> scorer evaluates each Trainer independently within a turn and has no memory that it just acted.

> If the opponent has a tank in the active spot and is starting to run out of cards in the deck
> before the player, it begins to power up that tank to attack with or retreat rather than tank to a
> loss - Some preemptive, some log# 06-13-50. **The draw half of this is done** (deck spending is
> priced, as a curve rather than a floor at 20); what is left is the bot noticing it is losing a race
> it can count and changing plan.

**What they have in common is why they survived the AI passes.** Both need the scorer to hold state
across a turn — what it has already played, or what it can count in a race — and every AI change
since 13 Aug has been a change to how one *decision* is priced. `scoreAction` is called fresh for
each candidate with no memory of the last one, so neither of these is reachable by tuning a term.
**That is a finding about the architecture, not a backlog item**, and it is the reason to keep it:
the next instance to notice the bot playing two Gusts in one turn should not spend an afternoon
discovering that the scorer is stateless.


### 24 Aug 2026 — Opus 5 #25 (the odds were fine, and the instrument was not)

**"I either pulled a really lucky Shiny -> 1st Edition Shiny -> Shadowless in back to back to back
packs, or the odds are messed up."** Then, when I offered to look: *"I actually had another back to
back shiny pull, and another 1st Ed. Shiny... I'm happy to chalk it up to luck as well but it would
make me feel better if we did the full sweep."*

**A repeated over-frequency is a different signal from one lucky run, and that is why it was worth
doing rather than dismissing.** One streak is an anecdote. A second one, reported independently
weeks later, is the point at which "you got unlucky with luck" stops being a satisfying answer — and
the person asking had already offered to accept it, which is exactly when you should look harder
rather than take the offer.

**The odds are right.** But finding that out took two runs the existing suite could never have done,
and both were real gaps:

**`packtest.js` opened 200,000 packs and only ever opened Base Set.** Four sets are live, the pools
differ, and Trevor was opening Team Rocket. *Making the run bigger could never have found this*,
which is the part worth carrying: 200,000 reads as overwhelming and says nothing about the three
sets it does not contain.

**And it reused ONE RNG stream where the game makes a fresh one per pack.** This was the strong
hypothesis and I expected it to be the answer. `packtest` drew every pack from a single
`mulberry32`; `openNextPack` builds a **new** one per pack from `Math.random()`, so a real pack only
ever samples the first ~50 outputs of a brand-new stream — the one property a single long stream
cannot test by construction. A PRNG with seed-correlated early output would have produced precisely
the reported symptom while the suite stayed green forever. Measured: clean, in both directions.
*A harness can reproduce a system's logic exactly while differing in how it is DRIVEN, and neither
side looks wrong in a diff.*

**Then the fixture I built to close that gap flaked deterministically**, seeding each pack from an
arithmetic stride: Reverse Holo read 1-in-9.1 at `packtest 20000` and 1-in-9.9 at 200,000, red
identically on every run at the size the file's own header recommends for iterating. Structured seeds
give structured first outputs. Fixed at the cause — the seeds come from a generator now, which is
what `Math.random()` is — rather than by widening the tolerance, because *a tolerance you widened
until it went green is a finding you deleted.*

**And the answer to the actual question came from his save, not from a simulation.** 63 packs: four
1st Edition packs against 3.2 expected, eight Reverse Holo against 6.3, two Shiny against 1.6. Every
row ordinary. `tools/pullcheck.js` is that check made repeatable, and it exists because the arithmetic
is easy to get wrong in one specific way: **1st Edition is a whole-pack roll**, so counting flagged
*cards* reads eleven times too lucky. Anyone eyeballing a save's variant tally would have seen 44
first-edition cards on 63 packs and concluded the odds were broken.

The tool prints its own caveat, which is the honest part: **a count you went looking for because it
felt wrong is a filtered sample.** It is good at saying *that is ordinary* and weak at saying
*something is broken*.

**I parked a second item off this note and there was no second item.** "First shiny pull not shown
in log" reads as *the log is missing an entry*; Trevor meant *that pull happened in an earlier
session whose log was never saved*. Nothing was wrong, and I had filed a bug against the event
logger on the strength of a sentence I had reparsed rather than asked about.

*It is the [PLAYTEST.md](PLAYTEST.md) rule pointing the other way.* That file is about a report
meaning something other than what it says, and the guard against it is to reproduce before you
redesign — which I did, correctly, for the odds. Then I took a **five-word aside** in the same note
and did the opposite: read it once, decided what it must mean, and parked an item on it. The aside
is where it happens, because the main claim gets the scrutiny. **Ask about the clause you skimmed.**

---

### 23 Aug 2026 — Opus 5 #25 (the opponent's Trainer, held for a beat)

**"Visual popup on screen or in side panel (screen preferred) when a trainer card is played by the
CPU, with a short pause in the action while it's shown."** From the grab bag, and Trevor's *because*
when asked for it: "it sometimes goes too fast and has you checking the really small print of the
log," plus pacing. He named 1 second as a starting figure on the grounds that the Game Boy game and
Pocket both hold theirs slightly too long.

**The whole thing was cheap because it is not a new mechanism.** The coin-flip presentation already
freezes the board on a pre-action snapshot and replays the log pausing on each flip, so a Trainer
stop is one predicate: `presStops()` returns true for a flip, and now also for `kind:'trainer'` on
the opponent's side. The freeze, the AI gating, the unfreeze and the effects firing in the right
frame all came free. **The note called it a medium item and a large one if it went on screen** — it
went on screen and stayed small, because the surface it needed was already built for something else.
*Worth checking, before estimating a UI item here, whether the presentation queue already does the
hard half.*

**Three things I would tell whoever touches it next.**

The engine's `log()` takes an optional extra object now, and the Trainer line carries `card: inst.id`.
**A name is not an identifier** — four printings are called Rattata — so parsing the card back out of
the sentence could never have picked the right face.

**`UI.flipDelay < 250` is the master switch for all presentation, and I found that out by the
feature silently not working.** About forty places in `smoke.js` set it to mean "deal me a board with
no pauses in it". Giving the Trainer hold its own independent escape would have changed every one of
those tests in a way nothing would have caught, so the coupling stays — and the DEV panel now says so
on screen, because the slider is labelled *coin pause* and nothing about it suggests it governs this.

**And the sabotage check is not optional.** All four new tests passed the moment I wrote them, which
is exactly when a test is least trustworthy. Stubbing `presStops` to `return false` turned one red
and left three green — so three of the four were not testing what their names claim, and the one that
went red is the one carrying the feature. Then the restoring `sed` matched two *other* `return false`
lines elsewhere in `ui.js` and quietly broke a Super Energy Removal test; `git diff` caught it in
about ten seconds. **Diff before you believe a green suite you have just been editing under.**

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

## Ninetales' Lure, and the half of a bullet that closed — 30 Aug 2026 (#31)

**The report:** *"Ninetales also used Lure to draw out a much more dangerous pokemon on turn 49"*, one
clause of the long log# 04-02-53 bullet. **Fixed**; the other three complaints in that bullet — Chansey
not using Scrunch, Charizard arriving too early, the Bill played on a thin deck — are untouched and
the bullet is still on the list without this sentence.

**It meant exactly what it said, which is worth recording because most of them have not.** The bot
was not mis-valuing the drag. It was not choosing a target at all: `SWITCH_DEFENDER_CHOOSE` fell
through to a seeded random pick, and the flat `W.drag` score was identical whoever came up.

**It was found from the other direction**, from Trevor's Ninetales `Wants` note during the Job 14b
Trainer sweep, and the grab bag item turned out to be the same fault already witnessed. **Two
independent routes to one bug is the strongest signal this project gets** — the note said what the
card *should* do, the log said what it *did*, and neither on its own would have located it in
`attackVariants`.

*[The invariant, and why both Bench orderings have to be asserted →](AI-INVARIANTS.md)*

## The GBC sequel's order of operations — 31 Aug 2026

**Trevor opened a "stolen from GBC 2" section in `GRABBAG.md` while playing the Japan-only sequel for
the first time, explicitly to watch what its AI does. The second item in it was a structural fault in
ours and it took one read of `choose()` to confirm.**

> This is something I noticed in Pocket as well, but there's a general order of operations to the AI's
> turns, where the energy attachment is always last before attacking/ending their turn, that way
> things are allowed to change if a trainer card alters the scenario mid-turn.

**Ours ordered setup actions purely by score.** An attach worth 101 went before a Bill worth 10, and
then the Bill drew the card that would have changed where the Energy went. **No score could have
fixed it** — the Bill is not worth more, it is worth *earlier* — which is why nothing in the project
had ever flagged it and why no claim row could have caught it.

**He added a second ordering in the same conversation**, from Pocket: a deck-narrowing search goes
before a random draw, because taking a known card out of the deck improves the odds of everything
drawn after it by one card, for free. Both are built.

**The carve-out was the actual work.** Professor Oak discards your hand, so promoting it ahead of an
attachment can destroy the very Energy the turn was about to attach — the play would eat its own
reason. Only cards costing nothing from hand are promoted, which is four verbs rather than a
category. *[The invariant, and why the category is wrong →](AI-INVARIANTS.md)*

**Worth noticing as a method rather than a fix.** Two of the strongest AI findings this job came from
Trevor watching a *different implementation* rather than from watching ours — this one, and the
pre-planned evolution still open in that section. **A reference implementation is an oracle we do not
otherwise have**, and it answers a question the claim rows structurally cannot: not *"is this play
right"* but *"is there a decision here we are not making at all."*

**The item is off `GRABBAG.md` per that file's own rule.** If the GBC 2 section is meant as a
permanent log of what was taken rather than a work surface, say so and it goes back — the convention
for a brand-new section is Trevor's to set, and removing it was the existing rule applied rather than
a judgement about his.

# Shadowless — history and quarantine

It holds the **reasoning behind ideas that were tried and dropped** — because a rejection recorded
without its reason gets handed back to a future instance as a fresh suggestion, which has already
happened here. The account of **how the project got here** is its other job, and as of 22 Aug 2026
most of that lives one door along in [HISTORY-ARCHIVE-1.md](HISTORY-ARCHIVE-1.md).

Nothing in this file is needed to work on the game. Read it when an idea below is about to be
proposed again, or when you want to know why something looks the way it does.

Live decisions live in `CLAUDE.md` and `COLLECTION.md`. Card-level judgement calls live in
`RULINGS.md`. This file is the losing side of settled arguments.

If moving over a fragment, please include the authoring instance's number or the author date, if known. This allows chronology to be traced a little better and specific authorship to be remembered. If not known, don't guess.

**This file is an append-only register and the 200-line target does not apply to it.** Same category
as [RULINGS.md](RULINGS.md) and [LOGBOOK.md](LOGBOOK.md), and for the same reason: a rejection cannot
be condensed without deleting the *why*, which is the only part that stops the idea coming back.
Entries are corrected, never shortened. Added 11 Aug 2026, when this became the destination for
material trimmed out of the live files — see [MAINTENANCE.md](MAINTENANCE.md).

**Here is what is in it.** Grep a heading to jump. Index added 16 Aug 2026; no entry was touched to
make it.

**The build era is in [HISTORY-ARCHIVE-1.md](HISTORY-ARCHIVE-1.md)** — the whole job history for
Jobs 1–10, the pack research, the rarity table's three passes and the tooling provenance. Split out
22 Aug 2026 at 461 lines, by era, as the rule below asks. **When this file passes ~450 again, start
`HISTORY-ARCHIVE-2.md` rather than growing either one**, and put the era boundary at a job. The rule
is repeated here rather than left in the archive alone, because a limit stated only inside the thing
being limited is read after the decision it was meant to inform.

What stayed is what is still *argued about*: a rejection whose idea can come back, and the shape of
the doc tree, which is under active revision. What moved is the account of work that is finished.

| Section | What it settles |
|---|---|
| Shiny was a sheen twice | Two `mix-blend-mode` attempts and why the palette shift beat both |
| Shadowless: the shadow is too quiet | Why the watermark exists, and why `inverted` is not dead code |
| `miniCard()` — one face, three screens | Why there is no compact text-carrying face, and the doc sentence that defended a broken one |
| The coin toss: moving it into the ticker | Proposed, rejected — occlusion beat connotation |
| Every scripted game ran at 12 Prizes | Why no absolute figure from before 11 Aug 2026 is usable |
| How the documentation tree got its shape | The two splits reached by the wrong criterion first, the directory that was refused, the count-to-boundary change, and why the playbook's unit is the pattern rather than the card |
| A fresh Arcanine used to prefer Take Down | The only assertion here overturned by a later one, and what to do when a test fails because a decision changed |
| Ideas raised and shelved | Opponent collections, Mirror Move reading the log, reviving chat-era, deleting `greedy` |
| The job plan for Jobs 10.5 to 12c | Five plan entries as they read while the work was open, moved out of `CLAUDE.md` when they were collapsed |

## Shiny was a sheen twice before it was a palette shift

Settled 9 Aug. Two `mix-blend-mode` sheens were built and both failed:

- **`color-dodge`** blew pale card stock out to unreadable white.
- **`overlay`** was legible but landed with wildly different strength depending on how bright a
  card's art was, so it read as inconsistent rather than as a treatment.

The palette shift that replaced them (`hue-rotate(150deg) saturate(1.35)`) was sitting in the
comparison strip as a *Misprint* flavour, and Trevor picked it out of there. It is the better idea
on its own merits: a shiny Pokémon in the mainline games is a recoloured one, so the treatment means
the same thing the word does, and it shifts differently per card — Charizard cyan, Blastoise
magenta, Fire Energy green — which reads as an alternate colouring rather than a filter laid on top.

**Misprint's third flavour became `invert(1)` in the same swap**, because a palette shift and a hue
rotation could no longer coexist without reading as the same effect.

## Shadowless: the shadow is too quiet on its own

The first proposal was to add a hard offset shadow to every sigil box so that one card in two
hundred could lack it. Rejected: it changes the default look of the whole game to serve a variant
almost nobody sees, and the current cards have a balance worth protecting. The fix was to confine it
— the shadowed art window exists only where a card is shown **as a collectible**, so the board is
untouched and the 8 Aug design lock holds.

Confining it did not solve loudness, and both Trevor and the building instance independently landed
on the same objection: a missing shadow cannot carry a 1-in-200 pull. Trevor's fix (9 Aug) was to
print **"SHADOWLESS" across the Sigil Card's art window**, set in the title screen's face — the
game's own name as the mark. It deliberately carries no `text-shadow`, where `.gametitle` has one as
a joke about the word; the thing the word actually describes should not have one. The watermark is
the announcement, the shadow is the fidelity.

**`inverted` is not dead code.** Shadowless-as-the-default, with the rare pull *adding* a shadow,
was built alongside `shadow` and lost the A/B — real-world scarcity points the other way. Trevor's
call was "back pocket, not discarded", so it stays live in the DEV tab and `smoke.js` covers it.
Do not delete it while tidying.

## `miniCard()` — one face, three screens, and a sentence in the docs that defended it

The live rule is in [LAYOUT.md](LAYOUT.md): there is no compact text-carrying face and do not build
one. This is the reason there were three attempts.

`miniCard()` printed attack names and rules text in a 150px column. It was the game's only compact
face, so three separate screens reached for it, and it failed on all three in the same way — a 150px
column cannot wrap a long word, so it breaks mid-word instead. Opening setup printed "Flamethrower"
as `Fla/met/hro/wer`. The Trainer pickers were worse: "Fire Spin" rendered **one letter per line**,
"Twineedle" as `Tw/ine/edl/e`, and every Trainer's rules text was clamped mid-sentence anyway — so
the information the face existed to carry was the information being destroyed.

**`LAYOUT.md` itself was part of the problem for a job**, which is the part worth remembering. It
said the overlay sheets could keep the compact face "because there is room in a dialog and nothing
competing for it". There is not: `.sheet .hand .pcard` is the same 150px as the hand. That sentence
was a confident, specific, actionable claim, and it kept a broken screen broken for as long as it
stood — the same failure mode as a confident absence claim, one level up.

The pickers took `pullFace()`, the printed scan, instead. A picker is the surface where the card is
most completely the **subject** — you are choosing which physical card, not steering a token in play
— and the scan also solves the layout problem by not having one: it is a picture of the answer.

`miniCard()` itself was then kept unused for a job, on the argument that it was the only compact
text-carrying face we had and the next session wanting one should find it rather than rebuild it.
`LAYOUT.md` set its own trigger — *if nothing has claimed it by the time Job 6 lands* — Job 6 landed
with it still at zero callers, and Trevor called it. Deleted 11 Aug 2026, after checking that
`pc-atkname` has four other producers so the picker's guard test stays real rather than vacuous.

## The coin toss: moving it into the ticker

**Proposed and rejected, 10 Aug 2026.** The live rule it produced is in [LAYOUT.md](LAYOUT.md):
anywhere the coin might move to has to clear the ticker.

Trevor's report was that the centre line gets in the way, and testing had convinced him the
attribution worry — that a coin on your side of the table reads as *your* coin, when roughly half of
all flips are the opponent's — was overblown. Both fair, and the ticker looked like the right home
because it is already where flip *results* print, which would have put the coin and its outcome in
one place instead of two.

**It was wrong for a reason neither of us had written down: you read the log underneath the coin
while it spins.** The centre line puts the toss directly above the ticker, so the text explaining
what is being flipped for stays legible for the whole animation. Landing the coin *in* the ticker
would cover the one thing a player is doing during the two seconds the coin is in the air.

Trevor caught this himself, and it is a better argument than the attribution one — that one is about
what a position *implies*, this one is about what it *costs you*. Worth keeping as a pattern: when a
placement argument is about connotation, look for the one about occlusion.

## Every scripted game ran at 12 Prizes, from Job 4 to 11 Aug 2026

Fixed, and it was never a nit. The Open list in `CLAUDE.md` used to call `setupConfirm()`'s lack of
idempotence a robustness concern that was unreachable through the UI. It was reachable from every
script in the repo: **`setupAuto()` ends by calling `setupConfirm()`**, so the natural
`setupAuto(0); setupConfirm(0); setupAuto(1); setupConfirm(1)` confirms each player twice, and the
fourth call re-ran `beginPlay()` and dealt a second set of Prizes.

`selftest.js`, `aitest.js` and `aiduel.js` all used that pattern. Nothing failed — the games were
simply twice as long and a different game. **The deck balance table reversed when it was fixed**, Zap
going from worst at 22% to second at 53%, because Zap is a fast deck that wins a short game and loses
a grind. A/B comparisons survived it, since both sides played the same wrong game, but every absolute
figure taken before the fix is void.

Found by reading a match log and noticing the deck lose seven cards between two identical turn
banners — not by a test. The guard is now in `setupConfirm`; the call sites were deliberately left as
they were, because they now prove it works. See [MEASUREMENT.md](MEASUREMENT.md) for what it means for the measurements.

## A fresh Arcanine used to prefer Take Down — reversed 23 Aug 2026

*Asserted by #12 on 14 Aug 2026; reversed by #24 on 23 Aug 2026, on Trevor's card note.*

**The only assertion in this project to have been overturned by a later one**, so it is worth the
space even though the change itself was small.

On 14 Aug the recoil curve landed — *priced on what it leaves you, squared* — and it shipped with a
guard: **a fresh Arcanine must still prefer Take Down.** The reasoning was sound and is quoted in the
test itself: *"At full HP 30 recoil is cheap and 80 beats 50, which is the whole reason the card
prints the attack."* Nobody had asked Trevor.

On 23 Aug his card note said the opposite — *"Flamethrower ... should be the default due to Take
Down's self-damage"* — and he is the arbiter on how a card plays. The ordering flipped.

**But the test was rewritten rather than deleted, and the distinction is the reusable part.** What it
was *protecting* was not the ordering. It was protecting against **recoil being over-priced**, and
that concern is still live and still worth a guard. The ordering was merely the symptom it happened
to measure — and it stopped being a valid measurement the moment the *other* attack got cheaper,
because Flamethrower's Energy burn went from a flat 7 to nothing at four Fire. The comparison had one
side move underneath it.

**That is the `CHANSEY_ARMED` failure wearing different clothes**, one section away in the same file:
a fixture that quietly stops being able to isolate the thing it asserts, and passes or fails for a
reason unrelated to its own claim. The rewrite asserts the property instead — Take Down must remain a
live option at full HP, and the two attacks must stay close — plus a second case pinning the recoil
curve on its own, so the property survives whatever happens to the comparison.

**The rule, for the next reversal:** when a test fails because a decision was overturned, ask what it
was *protecting* before you touch it. If that thing is still true, the test does not go away — it
gets re-expressed in terms that do not depend on the decision that changed.

## How the documentation tree got its shape

The rules that came out of these are in [MAINTENANCE.md](MAINTENANCE.md). This is how they were
reached, kept because two of them were reached by the wrong argument first.

**`LAYOUT.md` survived two split proposals and was split on the third — by Trevor, on a different
argument.** It is the clearest case in this tree of a right decision reached by the wrong criterion
twice. The third pass proposed *sizing vs. interaction* and withdrew it, correctly on its own terms:
the coin toss and the opening-setup screen are both mostly geometry, so the seam is not clean by
topic. The fourth pass took the file to **302** by moving the instruments out, left the seam
explicitly available and *not taken*, and told the next pass not to take it for Trevor. The fifth
measured it at **380** and reported that, expecting the same answer. **He took it, and his criterion
was the better one:** not is-this-topic-pure but *would a session working on something else need
this?* — the split test that produced `COLLECTION.md`. A session fixing the hand fan never needs the
coin's reduced-motion tilt, however geometric it is. What settled it was compaction, not tidiness.
[INTERACTION.md](INTERACTION.md) took the coin toss, the Energy picker, the opening flip, opening
setup and the action bar; the one genuinely-sizing rule among them, the coin's zero-height strip,
stayed behind as a one-liner with a link.

**`AI.md` reached 365 and was split the next turn**, on the same criterion. The cleave that worked is
*how the bot is measured* — the two instruments, the six ways measurement lies, the match log, the
standing figures — against *how the bot thinks and what has shipped*.
[MEASUREMENT.md](MEASUREMENT.md) took the first, and ten inbound pointers moved with it. **The tell
that the seam was real: the child had more entrances than the parent.**

**`AI.md` was then proposed as a directory on the sixth pass, and refused.** Trevor's suggestion, and
a reasonable one on the shape — it had grown back to 300 as seven chronological narratives, which is
exactly what `RULINGS.md` looked like before its folder. The difference is that **`RULINGS.md`'s
entries were the only copy of each call**, so the folder created homes; every one of `AI.md`'s
narratives already had a fuller, append-only twin in `GRABHIST.md`, so a folder would have created a
*third* copy of the same material and the two would have drifted. It was trimmed to the invariant
each change left instead, 300 → 181, with the accounts linked rather than repeated.

**Corrected 19 Aug 2026: that reasoning has a shelf life, and it expired.** `GRABHIST.md` only ever
records items that came out of Trevor's **grab bag**. The moment a *set job* touched `ai.js` — the
opening-placement fix in Job 8, the Energy-pool fix and the triggered-Powers layer in Job 10 — the
file started accumulating entries with no twin anywhere, while still opening with a sentence
promising every account was duplicated. Ten of twelve are twinned; three things are not. **The
refusal still stands** and a folder would still create a third copy of the twinned ten, but a pass
acting on the blanket version would have condensed the untwinned three and deleted the only record of
them. *A "this is duplicated elsewhere" claim is a claim about two files, and it has to be re-checked
whenever either one moves.*

**The logbook's archive rule changed from a count to a boundary on the sixth pass.** The old rule —
"this file holds the two most recent entries" — was written in the same turn the file was first
split, and by the time anybody checked it was holding six at 295 lines, back inside the length that
had caused the split. Nothing enforced it and nothing could. It is now: entries move out when the
work they describe is **closed**, into whichever archive is still short enough to read, and the most
recently closed entry stays behind as an example — Trevor's observation that instances visibly write
better logbook entries when there is one in front of them. **A maintenance rule stated as a number
somebody has to remember to check is a rule that will be found violated by the next pass.**

**`PLAYBOOK.md` was a per-card list for one day, and the card was the wrong unit.** Written 21 Aug
2026 with a guide on top and a list underneath, deliberately unlike `GRABBAG.md`, on the reasoning
that a playbook entry is *permanent* where a grab bag item is *consumed* — so a guide sitting above it
is reference beside reference rather than method in the way of a work surface. **That argument was
correct and is still correct about the seam it was about.** What broke was the unit: within a day
Trevor pointed out that a per-card list cannot survive 1,251 cards, and that a per-card *directory*
cannot either — 300–500 rows is unreadable whether it is a list or a table, so the obvious
`Rulings/`-shaped fix moves the problem rather than solving it.

**The evidence was already in the file.** All four of its entries had generalised to a family —
Chansey to every wall, Charizard to every attack that eats its own Energy, Gloom to evolution timing,
Dewgong to choosing between two attacks. Zero of four stayed about the card, and the standing
doctrine one file over makes that inevitable rather than lucky: *the fix goes in the general scorer,
never in a per-card branch.* A card-shaped document cannot hold a card-shaped answer when per-card
answers are prohibited. **The unit is the pattern; cards are the evidence.**

**Two things fell out that were not obvious before the reshape.** Trevor was already writing this
list somewhere else — the `Wants` column of his opponent-deck workbooks, 65 cards deep, proposed by
#15 — so the reshaped file has **no typing surface of its own** for card notes; asking him to retype
a note he made with the card in front of him is the same job twice in the worse place. And clustering
those 65 produced **sixteen** patterns, which sized the thing empirically instead of by estimate.
The competing axis, one file per AI *decision* to match `ai.js`'s own structure, was rejected on two
grounds: it shreds each of Trevor's notes across three files, and that view already exists as
`AI.md`'s shipped-invariants section.

Two entries in Trevor's own hand were deleted from the header before the reshape — a note on the
filename and the whole *Writing an entry (Trevor)* section. Both were about writing, both had been
internalised by the person they addressed, and neither was reinstated. **A guide addressed to one
person stops earning its lines once that person has written the thing it describes.**

## The bonus rare-tier jump went through three tuning drafts

*Moved out of [PACKS.md](PACKS.md) on 29 Aug 2026 by #30. All three drafts are Trevor's. The live
rule — and the ordering the shipped numbers are protecting — stayed in that file; this is how it was
reached, which nobody needs in order to change a number.*

- **v1** gave any bonus Rare-tier card about a **1-in-29** pack rate.
- **v2** doubled the per-card odds and shrank Uncommon from 3 slots to 2, landing near **1-in-20** —
  the same frequency as 1st Edition, which was the thing that made it feel wrong: two different
  mechanics arriving at the same cadence read as one mechanic.
- **v3 shipped**, retuned so a bonus Rare-tier card *beats* Reverse Holo's per-pack frequency while
  the two-tier jump stays clearly under it. Measurement then showed the three v3 numbers landed that
  goal as a near-tie (6.38% against 6.79%), so Uncommon-to-Rare was nudged 3% → 3.3%.

**Worth keeping for the shape rather than the numbers:** each draft was a whole-shape change rather
than a nudge, and what finally settled it was naming a *relationship between two axes* — beat this
one, stay under that one — instead of picking a rate. A target expressed as an ordering survives the
pack size changing; a target expressed as 1-in-20 does not, which the 25 Aug shrink then proved on
four other axes.

## Ideas raised and shelved, with the reason

- **Opponent cards getting variant treatment** — wanted, and started deliberately small. Agreed
  8 Aug: roll it live at play time, purely cosmetic, no persistence, same render function on both
  sides of the board. The deeper version — Job 7 named opponents with their own persistent pulled
  collections — stays possible, but only after the lightweight one is proven.
- **Mirror Move reading the game log** — Trevor's instinct, and the right one: the information
  genuinely is already there. Rejected because the log holds *sentences*, so the numbers would have
  to be regex'd back out of prose and a reworded log line would silently break a card.
  `lastAttackResult` is the same idea done as data. See `RULINGS.md`.
- **Paying out free play by chosen Prize count** — proposed and dropped 15 Aug 2026, same day. The
  Job 7 reasoning holds: a mode that both ignores the ladder and funds the collection makes the ladder
  optional. And the optional **challenge conditions on re-battles** deliver the identical loop — vary
  the difficulty, vary the reward — *on* the ladder, where it cannot undermine anything. So the idea
  was not rejected for being bad; it was rejected for already existing somewhere safer. See
  [CHALLENGES.md](CHALLENGES.md).
- **Gating the main ladder line on dex completion %** — proposed and dropped 15 Aug 2026. A
  requirement satisfied by *owning* is pack luck with no decision in it, and grind belongs in opt-in
  content. It survives as a good unlock for the **optional challenge tier**, where going back to an
  older bracket to fill a gap is a choice rather than a toll. Same shape as the entry above: the
  right home for it is the opt-in half.
- **The deck auto-builder — deferred indefinitely to a phase-two bundle. Trevor, 29 Aug 2026, and
  the reasons are worth keeping because the idea reads as obviously good.** It had been carried as a
  scheduled job since 15 Aug and was named by three files as the consumer they were written for. It
  is now filed with opponents that talk, a bare-bones storyline, and graphics and style passes —
  **after the game's structure is built, if even then.** Two reasons, and they are independent:

  **It cannot be trained yet.** Strategy is what would make a generated deck worth anything, and the
  AI work has not gone far enough to supply it. An auto-builder shipped before the bot can pilot what
  it builds produces exactly the confound [ROSTERS.md](ROSTERS.md) already warns about — a good deck
  and a badly-flown deck are indistinguishable to the only instrument that could grade it, so the
  thing would be tuned against a measurement that cannot see its own subject.

  **And its only customer withdrew.** It was never going to be offered to the *player* — the labour
  of building is what makes a collection mean anything, which [COLLECTION.md](COLLECTION.md) records
  as a standing decision. Its sole purpose was generating **opponent** decks, and Trevor has been
  hand-building those instead, four rosters deep. A tool whose one consumer stopped needing it is not
  a delayed job, it is a job that lost its reason.

  **What is NOT deferred, and this is the part to hold on to:** `deckgen.js`'s crude backfill stays
  load-bearing today. A roster entry whose deck cannot be resolved is filled with a generated
  challenger, and a bracket is never shorter than `bossAfter` — which is what keeps a narrow
  `gen_cards.js --sets base1` producing a working ladder instead of a dangling reference. **Deleting
  `deckgen.js` as dead code would break that**, the same way deleting `greedy` would break the suites
  one bullet up. The deferral is of the *good* builder, not the safety net.

  **One argument lost something and it should be said rather than quietly dropped.**
  [OPPONENTS.md](OPPONENTS.md) used the auto-builder as *the release valve* — the thing that makes a
  flexible tier size affordable across fourteen sets, by padding a bracket short of authored decks.
  That support is gone, and what replaces it is that a bracket can simply be short: the rung pattern
  flexes everywhere except the boss, and a small set is supposed to earn a small bracket. Worth
  re-testing when a set arrives that Trevor does not want to hand-build a roster for.
- **Reviving `tools/chat-era/`** — see `TOOLING.md`. It looks like a one-line fix and is not.
- **Deleting the `greedy` AI mode** — Trevor's proposal, and reasonable on its face: it is a
  damage-only bot that nothing in the game offers a player. It stayed because **`selftest.js` and
  `smoke.js` drive whole games with it**, where a cheap deterministic mover is exactly what you want
  and the real AI would be slower and noisier for no gain. Recorded 15 Aug 2026 because it was
  otherwise written down nowhere and the same reasonable proposal will arrive again. It has since
  acquired a second reason to exist: the ladder wants more than two difficulty settings eventually,
  and `greedy` is one already built. See [OPPONENTS.md](OPPONENTS.md).

  *(That closing line spent several days missing, and how it went is worth the two lines it costs.
  The entry was the last thing in the file and the file had **no trailing newline**, so the next
  append landed on the same line and the clause was gone — inside an append-only register, where
  nothing is supposed to be able to disappear. Restored verbatim from `6a21d89` by #30 on
  29 Aug 2026. **Nobody noticed for a week**, because a sentence that stops at a comma reads as
  someone's ellipsis rather than as damage; a deleted paragraph would have been obvious.
  **Append-only protects against editing, not against a missing newline** — and the same shape has
  now cost this tree a preserved log, a broken anchor, and this.)*

## The job plan for Jobs 10.5 to 12c, as it stood while they were open

*Moved out of `CLAUDE.md` on 26 Aug 2026 by #27, verbatim, when those five entries were collapsed to
two lines. Every one of them was written in the present tense by a session in the middle of the work,
which is exactly what makes them worth keeping and exactly what made them wrong to leave in an
orientation file — three said "what is left is X" about things that had since shipped.*

- **Job 10.5** - Scheduled post-new set maintenance. **The docs pass and the Base Set wiring are
  done** — Trevor's eight decks went live as the whole base1 bracket, the first built to
  [OPPONENTS.md](OPPONENTS.md). **What is left is the layout-related grab bag items.**
- **Job 11** - Major grab bag pass, AI and UI focused, add Trevor's new Jungle decks. **The Jungle
  and Fossil decks are in and live** — eleven hand-built decks across two brackets, body, gate and
  boss each, with the GBC placeholders pushed on to Team Rocket. Measured; neither new roster orders
  by tier and the report is in [ROSTERS.md](ROSTERS.md). **The AI half is well under way**: ten faults
  closed across three sessions, every one of them found by Trevor describing how a card is meant to be
  played rather than by any instrument — see [PLAYBOOK.md](PLAYBOOK.md), which is the method that
  produced them. **The UI half is untouched.** **The GBC placeholders left on Team Rocket are now gone
  too** — 25 Aug 2026, Job 12c/#26: Trevor's eight Team Rocket decks plus the two authentic Team Rocket
  theme decks replaced them, and this is the first roster measured where the tiers actually order
  cleanly. See [ROSTERS.md](ROSTERS.md#team-rocket--trevors-eight-decks-25-aug-2026).
- **Job 11.5** - Continued maintenance passes. We need to make the structure more load-bearing before we continue. *Job Closed*
- **Job 12a** - Continuing the AI pattern overhaul and testing behaviors. **It did need its own
  infrastructure and that half is built** — `tools/wants.js` reads Trevor's workbook, `tools/lib/board.js`
  makes a position out of card names, and `tools/claims/` holds the notes as rows. Proved by a control
  that goes red against the pre-fix commit. **The remaining work is claims**, and the backlog is a
  command rather than a number here: `node tools/wants.js --coverage`. Base Set first, and **Jungle and
  Fossil are on hold** — their notes are one-liners awaiting the same overhaul base1 and base5 got.
- **Job 12b** - Layout pass and then UI updates from GRABBAG.md. 
- **Job 12c** - Pack and rarity drop overhaul. **The pack shape and the bonus rare-tier jump mechanic
  landed 25 Aug 2026** — pack shrank from 11 cards to 8, and a lesser slot can now jump to a better
  tier at a small independent chance. **Rebalancing the four per-slot cosmetic axes (Reverse Holo,
  Shiny, Shadowless, Misprint) to restore the pre-shrink pacing is deliberately deferred**, tracked as
  its own open item in [PACKS.md](PACKS.md).


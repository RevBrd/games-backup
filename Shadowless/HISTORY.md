# Shadowless — history and quarantine

Two jobs. It records **how the project got here**, and it holds the **reasoning behind ideas that
were tried and dropped** — because a rejection recorded without its reason gets handed back to a
future instance as a fresh suggestion, which has already happened here.

Nothing in this file is needed to work on the game. Read it when an idea below is about to be
proposed again, or when you want to know why something looks the way it does.

Live decisions live in `CLAUDE.md` and `COLLECTION.md`. Card-level judgement calls live in
`RULINGS.md`. This file is the losing side of settled arguments.

**This file is an append-only register and the 200-line target does not apply to it.** Same category
as [RULINGS.md](RULINGS.md) and [LOGBOOK.md](LOGBOOK.md), and for the same reason: a rejection cannot
be condensed without deleting the *why*, which is the only part that stops the idea coming back.
Entries are corrected, never shortened. Added 11 Aug 2026, when this became the destination for
material trimmed out of the live files — see [MAINTENANCE.md](MAINTENANCE.md).

**It is long enough that a read of it comes back truncated, so here is what is in it.** Grep a
heading to jump. Index added 16 Aug 2026; no entry was touched to make it. **When this passes ~450,
split it by era into `HISTORY-ARCHIVE-1.md` rather than letting it grow** — the same call the logbook
made, for the same reason.

| Section | What it settles |
|---|---|
| The job history | What each of Jobs 1–9.5 left behind, including Job 6's split-by-machinery and the three things Job 7 turned up that were not Job 7's |
| Pack research: two things that were wrong | There was never an unnumbered Energy era; every `base1` scan we own is 1st Edition Shadowless |
| The rarity table went through three passes | Why 1/440, 1/2200 and 1/11000 are the shapes they are, and the ~5x ladder to extend from |
| Shiny was a sheen twice | Two `mix-blend-mode` attempts and why the palette shift beat both |
| Shadowless: the shadow is too quiet | Why the watermark exists, and why `inverted` is not dead code |
| `miniCard()` — one face, three screens | Why there is no compact text-carrying face, and the doc sentence that defended a broken one |
| The coin toss: moving it into the ticker | Proposed, rejected — occlusion beat connotation |
| Every scripted game ran at 12 Prizes | Why no absolute figure from before 11 Aug 2026 is usable |
| Tooling provenance | Why `tools/chat-era/` cannot run, and how the Node replacements were verified |
| How the documentation tree got its shape | The two splits reached by the wrong criterion first, the directory that was refused, the count-to-boundary change, and why the playbook's unit is the pattern rather than the card |
| Ideas raised and shelved | Opponent collections, Mirror Move reading the log, reviving chat-era, deleting `greedy` |

## The job history

**Jobs 1 through 4b were built in Claude Chat.** The ten snapshots survive in
`backups/pre-job4c/Claude Chat Version History/`, but no per-turn notes do — the arc below was
reconstructed 10 Aug 2026 by diffing the top-level symbols each snapshot added, so it is derived
rather than remembered, and it is coarse on purpose. Every file's `<title>` still says "Job 1";
that is a stale title, not a clue.

| Snapshot | What appeared in it |
|---|---|
| `job1` | The rules engine and a playable board — 169 top-level symbols at once |
| `job1a` | Deck selection: `DECK_NAMES` and the deck rows |
| `job1b` | The coin-flip presentation — `dispatch()` and `stepPresentation()`, still the shape it uses today |
| `job1c` | Trainer pickers and the legality edges around them |
| `job1d` | The deck select screen proper — `renderDeckSelect`, `deckSummary`, `startMatch` |
| `job2` | **The AI.** `AI_WEIGHTS`, `STATUS_VALUE`, attack scoring, danger evaluation |
| `job3a` | **The art system** — the sigil, `costRow`, the rendered card face |
| `job3a2` | Sigil refinement: petal geometry, rings, rays, studs |
| `job3b` | **The board** — mat, bench, prize zone, discard stacks, card backs |
| `job4a` | `deckgen.js` and the Sandbox deck |
| `job4b` | The 44-test smoke suite, and the handoff out of Chat |

**Jobs 4c onward were built in Claude Code** and are in `git log`, which is unusually readable here
— one commit per meaningful step, with a message that says what changed rather than what file did.
Prefer it over any summary. The broad shape: 4c–4f the Powers and the Base Set oddities, 4g the
mat and the fitter and the real card scans, 5a–5e the collection.

**Job 4 deliberately did not build a collection/dex mockup.** The language was settled but the
screens did not exist, so anything mocked up would have been thrown away. It was built for real in
Job 5, and that was the right call.

**Job 5 — the collection, 9 Aug 2026.** Everything a collection game needs, in one session:
`collection.js` and the versioned save, `packs.js` and booster generation, the pack reveal, the
variant renderers, the CARDS and DEX browsers, export/import, and the deck builder. Two test suites
arrived with it. The decisions it settled are live in [COLLECTION.md](COLLECTION.md) and
[PACKS.md](PACKS.md) rather than here.

**Job 6 — Jungle and Fossil, 10–11 Aug 2026.** Also one session, and **split by machinery rather
than by set**, which is the part worth keeping: Jungle is nearly all bulk and Fossil holds nearly
all the architecture, so a by-set split would have front-loaded the easy half and deferred every
hard decision without either set shipping sooner. What each sub-job actually left behind:

| | |
|---|---|
| 6a | `SET_INFO`, set identity through the reveal, `homeSet()`, per-set pack buttons, the Energy **stipend** for sets printing none. Also the AI verb coverage check, which found eleven Base Set verbs the bot had never scored |
| 6b | The passive-Power layer — **consulted, never materialised** — and the `powerActive`/`powerUsable` split. Built before any card needed it. See [ENGINE.md](ENGINE.md) |
| 6c | Both sets generated behind a derived live-set gate; six things that had quietly hardcoded Base Set; the 31-entry alias table for the duplicate Rares |
| 6d–6e | The new verbs, the cards they unlock, and the thirteen Powers including the shared Peek/Clairvoyance panel. Jungle went live here |
| 6f | Ditto, on the `baseCard`/`topCard` split. See [ENGINE.md](ENGINE.md) for the machinery and [RULINGS.md](RULINGS.md) for the call |

**The estimates it was planned against were close and are worth recording**, because the next set
will be planned the same way: ~55 cards needing no new verb, ~37 new verbs, 13 Powers. The count
that mattered most was the one that stopped 126 printings being 126 jobs — both sets print every
Rare twice, so the real figure was **95 distinct behaviours**, verified mechanically across name,
HP, stage, weakness, retreat and every attack and Power rather than by eye.

Two things Job 6 discovered about its own tooling, both now permanent. **A test written against a
synthetic database beats a test that starts working later** — 6a's Energy cases had to run before
base2 and base3 existed, and a test nobody can run when the mechanism is written is a test nobody
runs at all. And **a green suite can be green for the wrong reason**: a Chansey attack-lock case was
passing because Chansey had no Energy, so `canUseAttack` was refusing on cost rather than on the
lock under test.

**Job 7 — progression and named opponents, 12 Aug 2026.** One session again, on groundwork #8 had
laid two days earlier. The live account is in [PROGRESSION.md](PROGRESSION.md); what belongs here is
the shape, because the next set-adding job inherits it.

**The structural decision was Trevor's, not the building instance's.** A `LADDER` constant had been
drafted; he asked for something that would take the other eleven sets without rework, and the answer
was to build the ladder from the live-set list at runtime — an authored bracket where one exists, a
generated one where it does not. About forty lines, and it is why **Job 8 is adding sets rather than
rewiring progression**. Unlock is derived the same way and deliberately not stored: a bracket is open
if the previous boss has been beaten, recomputed from the save every time it is asked.

Three things it turned up that were not Job 7's:

- **Every win in the game had been paying out in Base Set.** Both `addPacks` call sites passed
  `homeSet()`, which is always `base1`, so 119 of 221 cards were unobtainable and `CLAUDE.md` had
  claimed the opposite for two days. That inverted the framing of the whole job — a save migration
  was being planned to grandfather a freedom nobody had. **The ladder does not gate the other sets;
  it is the wiring that makes them reachable.** Found by Trevor saying his save could not earn them,
  against a doc that said it could.
- **The groundwork was not usable as it stood**, and the pre-flight that found this out was worth
  more than the time it cost: seven of the sixteen decks named `basep` cards, which is not a live
  set, so the validator would have refused them. Ten references, not a set job. One deck flagged as
  defective in its own notes turned out to be fine — the extraction was faithful and only the note
  was wrong.
- **Four layout defects were live while 136 smoke tests passed**, all four found by `tools/shot.js`.
  That is the sharpest case in the project's history for the rule that a green suite proves nothing
  visual. See [PROGRESSION.md](PROGRESSION.md).

**What it deliberately did not do: the decks and names are placeholders.** Real per-set opponents,
hand-built and better-generated, are a job of their own — Trevor's call. The candidate pool for that
job is in `data/OPPONENT_DECK_POOL.md`; see [DATA.md](DATA.md).

**Job 8 — what an opponent is made of, 15 Aug 2026. A design job, and nothing in it was built.** The
spec is live in [OPPONENTS.md](OPPONENTS.md); what belongs here is the shape of the job, because it
is the model for the ones that follow. It fixed *parameters* rather than card lists — four silent
difficulty tiers, a rung pattern, one entry-condition mechanism serving three different gates, and a
pressure tag saying what a deck **does to you** rather than how strong it is — on the reasoning that
the lists cannot be written until we can see what each set actually offers. Names, dialogue and
gimmick rules were excluded on purpose, to a detailing pass after every set is in, so that nothing in
the spec has to be unpicked when the fiction arrives.

**Job 9 — AI work from the grab bag, 16 Aug 2026.** Two instances, several batches, and the
generalisable half is not about the AI at all: **three of the first five changes were to the match
log rather than to the game.** Proving one report wrong needed a pass that says *why* it did not
attack, an opening board that `setupAuto` had never recorded, and a way to tell two identical
Squirtle apart — all three invisible until somebody needed them, and all three needed by the first
question anyone asked. *An item about the game is surprisingly often an item about the thing
measuring the game; that is now three sessions out of three.* The per-item accounts are in
[GRABHIST.md](GRABHIST.md) and the invariants they left are in [AI.md](AI.md).

**Job 9.5 — the sixth documentation pass, 16 Aug 2026.** The logbook re-archived on a boundary rather
than a count; `AI.md` cut from 300 to its rules with the accounts left where they already lived;
`CREDITS.md` returned to three lines a row for the third time; the closed jobs collapsed into this
file. What it found is in [MAINTENANCE.md](MAINTENANCE.md).

**Job 10 — Team Rocket, 17–19 Aug 2026, live at 83 of 83 printings.** Split by *machinery* rather
than by card, the way Job 6 was: the attacks first, then the trigger points, then the Energy, then
the Trainers. What it added is in [ENGINE.md](ENGINE.md) — three of the nine systems there are its —
and the six rulings it settled are in [RULINGS.md](RULINGS.md).

Three things from it are worth carrying forward rather than looking up.

**The size of a job is a measurement, and it was one command away.** `shapecount.js` was written
mid-job because Trevor asked whether the survey that shaped the trigger work deserved writing down.
It then answered four separate "how much machinery" questions in one session — build a verb list for
`ON_PLAY` (20 printings, 15 distinct texts), do *not* generalise `ON_KO` (3 printings, 2 behaviours),
special-case the two unique Trainers, and build `pendingAsk` general (17 printings, 16 texts). Every
one of those would otherwise have been taste. *[The tool, and what it is not →](TOOLING.md)*

**Four guards were found not to be guarding, and only one by reading.** The coverage gate had been
blind to Energy since Base Set. `doTrainer` held 63 dead lines that duplicated the legality switch
and would have made the next Trainer author's legality test silently never run. A static check
written in this same job, and cited as a guarantee in two documents, stayed green when the thing it
checked was deleted. `setsurvey`'s own control cried wolf on a corpus typo the generator already
corrects. **Three of the four were found by deliberately breaking the thing and watching** — the step
this tree keeps prescribing, skipped twice in this job because the check "obviously" worked.

**A default should point at the set that GROWS.** Two rulings a day apart point opposite ways and are
consistent for one reason: attack damage defaults to *true* because its callers multiply with every
set, and played-from-hand defaults to *silence* because "from hand" is a closed idea. Whichever side
is open gets the default; the small closed side declares itself.

## Pack research: two things that were wrong

Both were found on 9 Aug 2026 at the start of Job 5, by re-checking `data/raw/` rather than
reasoning from Base Set alone. Both had been stated confidently.

**There was never an "unnumbered Energy" era.** An earlier version of the pack research described
basic Energy as living outside the numbered set until some cutover partway through the era, and
asked which set the cutover landed on. There is no cutover and there was no pool. The corpus simply
leaves `rarity` blank on basic Energy in the five sets that printed it, and every one of those
numbers it inside its own range — Base's are #97–102 of 102. Double Colorless is the counter-example
that proves it: #96, Uncommon, numbered like anything else. Leaving the original wording in place
would have sent Job 5 hunting for a boundary that does not exist.

**Every `base1` scan we own is already 1st Edition Shadowless.** Found by pulling the hires image
for `base1-4` and reading it: the `EDITION 1` stamp sits below the artwork on every card, and the
art frame carries no drop shadow, because 1st Edition Base *is* Shadowless by definition. There is
no second image per card in the corpus, so there is no Unlimited scan to fall back on. This is what
forced the split that `PACKS.md` now states as fact — additive cosmetics can live on a bitmap,
print-run cosmetics can only live on our own render — and the rule that a pack reveal can never be
the scan alone, because a bare scan is variant-blind and a 1-in-2200 pull would land silently.

**1st Edition was nested under Shadowless, and should not have been.** Corrected 8 Aug from
Trevor's own collection. The nesting holds for Base Set specifically, because Base is the one set
whose art frame changed mid-print-run. Across the full 14-set pool they are independent: Jungle
onward all launched with the shadow already standard and never changed it, while 1st Edition print
runs existed for most sets in the era. So the game treats them as independent rolls.

**Reverse Holo's slot count said 7 until 9 Aug.** That was the Common count mistaken for
Common-plus-Uncommon. It is 10 — 3 + 7 — and the v3 table always said so.

## The rarity table went through three passes

v1 and v2 were worked out **forward** from packs-opened. v3 (8 Aug) was worked out **backward from
wins needed**, against a working assumption of 2 packs per win, then rounded to whichever per-card
odds made the pack/win math land exactly. That is why the numbers are the shapes they are — 1/440,
1/2200, 1/11000 look arbitrary and are not.

Two properties fell out of it that are worth preserving if the table is ever retuned:

- **The win milestones form a clean ~5x ladder** (5 → 20 → 100 → 500). If a tier is ever added, "~5x
  the wins of the tier below" is a legible rule to extend from rather than picking a number fresh.
- **Two open questions closed themselves.** Shadowless's "50% better odds" ask landed at ~1.86x
  more likely than the old 1/4096, which is essentially the more generous of the two readings; and
  the Misprint/Shadowless gap widened from ~3.7x to 5x in the same pass, addressing the "too close"
  concern without reaching for 1/25000.

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

## Tooling provenance

**Why `tools/chat-era/` cannot run**, which matters because it looks like a one-line fix.
`gen_cards.py` reads a clone of the `pokemon-tcg-data` repo from `/tmp/ptcg/*.json` and a
spreadsheet from `/mnt/user-data/uploads/` — both Claude Chat sandbox paths, neither of which
survived the port. The JSON corpus has since been re-downloaded to `data/raw/`, so that half is
recovered. It also imports `openpyxl`, which is not installed. Python *is* installed on this machine
now, which is exactly why this needs writing down. Keep the files: `gen_cards.py` is a clear
specification of what the output must look like, and it is how we know the deck lists came from
named spreadsheet sheets.

**How the Node replacements were verified**, which is the check to reproduce if either changes.
`build.js` was run against the recovered sources and its output diffed against the artifact as it
arrived from Chat — byte-identical, title line aside, which is what established that the recovered
sources are the real ones and not a stale copy. `gen_cards.js` was verified twice: against the CSVs
it reproduced all 90 pre-existing cards exactly, field by field, before being widened to 102; then,
migrated to read the upstream corpus instead, the two independent sources were diffed against each
other and produced **byte-identical output for all 102 Base Set cards**. That agreement is what
justifies trusting the corpus, and it is repeatable if anyone ever doubts it.

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
  [OPPONENTS.md](OPPONENTS.md).
- **Gating the main ladder line on dex completion %** — proposed and dropped 15 Aug 2026. A
  requirement satisfied by *owning* is pack luck with no decision in it, and grind belongs in opt-in
  content. It survives as a good unlock for the **optional challenge tier**, where going back to an
  older bracket to fill a gap is a choice rather than a toll. Same shape as the entry above: the
  right home for it is the opt-in half.
- **Reviving `tools/chat-era/`** — see `TOOLING.md`. It looks like a one-line fix and is not.
- **Deleting the `greedy` AI mode** — Trevor's proposal, and reasonable on its face: it is a
  damage-only bot that nothing in the game offers a player. It stayed because **`selftest.js` and
  `smoke.js` drive whole games with it**, where a cheap deterministic mover is exactly what you want
  and the real AI would be slower and noisier for no gain. Recorded 15 Aug 2026 because it was
  otherwise written down nowhere and the same reasonable proposal will arrive again. It has since
  acquired a second reason to exist: the ladder wants more than two difficulty settings eventually,
  and `greedy` is one already built. See [OPPONENTS.md](OPPONENTS.md).
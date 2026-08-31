# Shadowless — how the cards are supposed to be played

**Trevor's knowledge, turned into things the scorer can be held to.** He knows how this era plays;
the AI does not, and no amount of reading the card data will teach it. This file is the directory
and the method; **each pattern is its own file in [`Playbook/`](Playbook/)**.

**The unit is the PATTERN, not the card.** That is the whole reshape, 21 Aug 2026, and this file's
own first four entries are the evidence for it — Chansey became every wall in the game, Charizard
became anything whose attack eats its own Energy, Gloom became evolution timing, Dewgong became
choosing between two attacks. Zero of four stayed about the card, and they could not have: **the fix
goes in the general scorer, never in a per-card branch**, so a card-shaped document can never hold a
card-shaped answer. Cards are the *evidence*. The pattern is the entry.

## Where the notes come from

**Trevor writes per card, in the workbook, while going through a set** — the `Wants` column of the
Index tab in `data/v1 Opp Decks/`. That is the inbox and there is no second one, because asking him
to retype a note here that he already wrote with the card in front of him is the same job twice in
the worse place, though it's perfectly fine to ask for clarification or more detail. #15 proposed the column, Trevor filled it, #21 spotted it was worth more than the
scoring tags it sits beside. **65 cards carried a `Wants` when this file was reshaped, and they
clustered into sixteen patterns** — that clustering is what produced the directory below.

**The newest workbook is always the live one, and it is the whole history.** Trevor's method: copy the
previous workbook, add the next set's cards, fill in the judgement-call cells, build the decks. So
each one is a strict superset of the last — `Challenge 1` was verified as exactly the Fossil
workbook's 229 rows plus 28 promos and a `Gated Until` column. **Read the newest and never diff two
of them for content.**

**`node tools/wants.js` reads it, and reading it by hand is no longer the job.** Until 23 Aug 2026
nothing in the project could open an `.xlsx`, so the inbox was only reachable through Excel and
[DATA.md](DATA.md) called these workbooks reference-only. They were never reference; they are the
source this entire method runs on. **Do not quote a note count in prose** — run the tool, which also
prints which notes have no claim yet.

**Being pointed at a stale workbook is the failure this tool exists to prevent, and it is not
hypothetical.** A session read `Challenge 1` believing it was current, found Team Rocket absent,
concluded the newest live set had no annotation at all, and sized the job at a third of its real
weight. `wants.js` picks by modification date and **prints which file it opened and how many it
ignored, every single run.** The note register changed shape at the same time and that is the tell if
you ever suspect a stale read: **every live set now runs to full paragraphs.** `wants.js` prints the
register per set and the medians are Base Set 208, Jungle 229, **Fossil 251** — the longest of the
four — and Team Rocket 242.

**The overhaul is DONE and this paragraph told everybody otherwise for six days.** It read *"Jungle
and Fossil are still one-liners awaiting the same overhaul — do not work a Jungle or Fossil claim
from the current text"*, which was true of the workbook on 23 Aug and false of the one `wants.js`
actually opens. Trevor's method, in his own account: the one-line `Wants` were the first thing he
wrote, Team Rocket got the full-paragraph treatment, and when that came back useful he **went back
through the earlier sets in the same style.** Jungle and Fossil are in that pass, and the tell is
that they use the controlled vocabulary — Clefable's names *Copy Effects* and *Setup Turn* in one
sentence, Lapras's names *Over-Attach* and says explicitly that it is **not** a wall and why.

**The general lesson is the one this file already teaches about stale workbooks, arriving from the
other side.** A hold written on a dated observation goes stale silently, and nothing in the project
checks a sentence like that — `wants.js` re-reads the workbook every run and had been printing the
refutation in its own output the whole time. **A claim about the SHAPE of the inbox is as
perishable as a claim about its size**, so state it as a command rather than a fact: run the tool.

**Its promos are not in the game yet**, which is why `Gated Until` exists. A `Wants` on a card that no
set has made live is a note filed early, not a gap — do not treat one as unfiled work, and if you
build a coverage tool, filter to the live sets.

**Two kinds of note live in that column and they have different consumers.** *"To use Agility unless
Drill Peck can kill"* is an in-play decision and belongs to `ai.js`. *"Replace 4x R energy with DCE in
deck"* and *"5-ish extra W energy in deck"* are **deckbuild** wants and belong to the autobuilder —
**which was deferred indefinitely on 29 Aug 2026**, so they are parked rather than pending. Filing one
as the other sends a real instruction to a component that cannot act on it.
*[The deckbuild ones, parked with their cards →](Playbook/DECKBUILD-WANTS.md)*

### The inbox, for notes with no card to sit on

Some knowledge is not about a card and has no cell in the workbook — *an Energy is a turn* was one,
and it changed every retreat in the game. It goes here, loose, and gets filed like any other note.
**Trevor: type whatever you like below, in any shape.**

- *(empty — the four that were here are filed)*

## The directory

| Pattern | The claim | State |
|---|---|---|
| [Walls](Playbook/WALLS.md) | Some cards go in to be spent. Standing there *is* the job, and low damage is not a deficiency | **Built** |
| [Ammo](Playbook/AMMO.md) | An attack that discards its own Energy turns spare Energy into rounds, so surplus is not surplus | **Built**, one half open |
| [Attack choice](Playbook/ATTACK-CHOICE.md) | The small utility attack is usually right; the big one is conditional on lethal — and on there being something to fear | **Built.** 11 of 11 cards measured; 2 questions open |
| [Setup turn](Playbook/SETUP-TURN.md) | One attack sets up the next. A rider is worth nothing on a target that already has it | **Half built.** Cashing-in is general; setting-up needs lookahead |
| [Evolution timing](Playbook/EVOLUTION-TIMING.md) | Evolve when the line is *ready*, not when it is legal — and readiness is read off your hand | **Built** 28 Aug 2026; two clauses of the note open |
| [Deckbuild wants](Playbook/DECKBUILD-WANTS.md) | Not AI patterns. Parked for the autobuilder | **Parked** — no scheduled job; the autobuilder was deferred 29 Aug 2026 |

**The rest are named and defined at the bottom of this file, under *Possible patterns*, and that
list is the authority.** The clustering is #22's, out of the 65 `Wants`; the one-line definitions are
Trevor's. **It is the controlled vocabulary he writes into the `Wants` column**, so a pattern's name
there has to match a name here. Do not restate it up here; a second copy would drift, and the copy a
reader hits first wins.

**Deliberately not counted, as of 29 Aug 2026, and this file had to learn it the hard way.** The
clustering produced sixteen, that number went into four sentences, and then Energy Funnel was added
as a genuine seventeenth on 23 Aug — so this file spent six days saying *sixteen* over a
seventeen-item list **while simultaneously describing the naming of "the seventeenth pattern" as
outstanding work.** Both halves were written by instances who had the list in front of them. **The
list is the count**; the vocabulary is expected to grow, which is exactly why no sentence should
carry its size.

Each of the unwritten ones already has between two and nine cards behind it. **Write the file when
you work the pattern, not before** — an empty pattern file is a planning document, and
[MAINTENANCE.md](MAINTENANCE.md) calls those the highest-value target in the tree for exactly the
reason you would be creating one.

### The paragraph is the payload; the pattern name is only routing

**Trevor asked whether the long per-card paragraphs are still worth writing now that the vocabulary
exists. They are, and the answer is not politeness.** Every fault found on 21 and 22 Aug 2026 came out
of a *clause* — *"unless Drill Peck can kill"*, *"when there's something to be afraid of"*, *"a
sleeping basic can just evolve to wake up anyway"*. A label carries none of those, and a cell reading
only `Attack Choice` would have produced a category and nothing testable.

**The load-bearing version: every pattern in that list exists only because sixty-five notes were written
as prose.** Nothing clustered them into being except the paragraphs. A label can only route to a
pattern that already exists; **prose is the only thing that can produce a new one.** So
under-categorising is cheap and self-corrects on the next pass, while over-categorising silently caps
the system at whatever the list happens to say today.

**Treat a note that fits nothing as a finding.** It is the candidate pile for the NEXT pattern,
and it is worth more than a note filed neatly under the wrong one.

**And the pile has a shape, surveyed 24 Aug 2026 when Trevor’s overhauled workbook took the live
notes to 219.** Eighty-seven of them match none of the patterns below, and **thirty-six are TRAINERS** — a
whole category the vocabulary does not name, sitting in a different function (`scoreTrainer`) from
everything the playbook had touched until then. *Computer Search, PlusPower, Energy Removal, Gust of
Wind, Defender, Digger, Goop Gas Attack.* **The first two probed found one fault and one pass**, which
is a better rate than the Pokemon notes were returning by then.

**The rate held on the next two, and the fault they found was bigger than either card — 30 Aug 2026.**
Energy Removal and Super Energy Removal between them produced **five red rows out of five written**,
one fault, and one fix: the AI had never chosen which Energy to strip at all, because it was writing a
key the engine stopped reading when the human got a picker. *[The invariant →](AI-INVARIANTS.md)*

**Two things about the Trainer pile are now worth knowing before you pick one.**

**The faults here are in the PLUMBING at least as often as in the weights.** Three of the four
Trainers probed so far were misplayed because a rule or a key did not reach `scoreTrainer`, not
because a number was wrong — Sleep! had three shipped rider rules that lived in `scoreAttack`, and
the removals had an option key nobody had migrated. That is a different failure shape from the
attack-choice work, and it means **executing the card and watching the board is the probe that
matters.** `board.js` gained `strips()` and `spends()` for exactly this: reading `a.opts` back
would have reported a choice being made.

**And the pattern is still unnamed, which is Trevor's call and not a blocker.** These rows carry
`pattern: 'Trainer (pattern unnamed - see PLAYBOOK.md)'` rather than being forced into one of the
seventeen. Per this file's own rule, under-categorising is cheap and a note that fits nothing is a
finding — so the placeholder is deliberate and the rows work fine without it.

**Naming the pattern that would cover them is Trevor’s**, since the list is the controlled vocabulary he writes
into the column — this is the candidate pile reported, not a rename. Note that ~25 of the 87 are
**deckbuild** wants rather than play ones (*“the autobuilder should avoid”*, *“exist in almost every
deck”*, *“weak decks have 1-2”*), so the pile is at least two things and splitting it is the first job
rather than the last.

**Two taxonomies that already exist elsewhere are deliberately not patterns here.** Opener archetypes
are the workbook's column G and are half-built in `setupAuto`; pressure tags are deck-level and belong
to [CHALLENGES.md](CHALLENGES.md) and `tools/pressure.js`. Do not fork either into this folder.

## Writing a pattern file

**Trevor's words go in verbatim, as a block, and they are append-only.** The analysis around them is
not — that gets revised as the thing gets built. This is the `LOGBOOK.md` shape: move the note whole,
write the short version fresh, and never decide sentence by sentence what earned its place.

**Say how the family is DETECTED, not which cards are in it.** `WALLS.md` does not list Chansey,
Snorlax and Kangaskhan; it names the derivation — terminal Basics, scored on HP, retreat cost and a
`STALL_VERBS` attack — and the pool answers the rest. That is `ai.js`'s own doctrine applied one level
up: *a tag is a fact we would be re-typing rather than one we would be adding*, and it is why these
files do not grow when the card pool does. **Hand-list cards only where the family genuinely resists
derivation**, and say that it does.

**A card that fits no pattern does not get a file.** Per the standing rule, if a note can only be
satisfied by special-casing the card, that is a finding about the DSL or the scorer — it goes to
[AI.md](AI.md)'s Open list, not here.

**One note, one home.** A note touching two patterns is filed whole in its primary one and the other
gets a pointer row. Chansey's second half — the DCE kamikaze — is a pointer out of `WALLS.md`, not a
second copy.

## Working an entry

**Build the position and watch it happen before you change anything.** Every fix on 21 Aug 2026 was
reproduced from a constructed board first, and two of them turned out to be a different fault than the
note described. [PLAYTEST.md](PLAYTEST.md) is the method file and it applies here unchanged.

**Write the claim as a row in `tools/claims/`, and run it with `--explore` BEFORE you know the answer.**
That is the whole loop, and the investigation leaves an artifact instead of a table in a document —
every measurement in [ATTACK-CHOICE.md](Playbook/ATTACK-CHOICE.md) came out of a throwaway script that
is gone, so none of them can be re-run. `tools/lib/board.js` builds the position out of card *names*.
*[The harness, what it refuses to do, and the control that proves it can fail →](TOOLING.md)*

```bash
node tools/wants.js base1 --todo        # which notes have no claim yet
node tools/claimtest.js Arcanine --explore   # what does the bot ACTUALLY do here
node tools/claimtest.js                 # assert them all
```

**PICK THE OPPONENT ON PURPOSE, because the obvious one is the format's extreme.** A Chansey
holding four Fighting Energy threatens 80 — a fully charged Double-edge, lethal against most of the
format — and it silently turns every claim into *"...against something about to kill you"*. Three rows
in one batch "failed" to it, and all three were the bot correctly choosing to survive, because a
barrier or a paralysis preventing a **lethal** turn is priced as a life on purpose. **Where a note has
a defensive exception, assert both sides**; the pair says where the line is and one row never can.
*[The boards to reach for instead →](tools/claims/base1.js)*

**ONE NOTE IS SEVERAL CLAIMS, and this is the trap the whole method turns on.** Dark Alakazam's note
is six: hit and run with Teleport Blast; hide behind fodder; hide behind a *tank* instead, which is a
different trade; Mind Shock when they resist Psychic; Mind Shock when the extra 10 is lethal; stay in
when they are harmless. **A card reads DONE the moment one clause is tested and the other five go
invisible forever** — which is why `wants.js` prints the note's own text beside its claims and says
outright that its coverage figure is the weak reading. Decomposing the paragraph *is* the work; the
board is the easy part.

**A clause with no term to assert against is a ROW, not an omission.** Give it `open:` and say what is
missing. `claimtest.js --open` lists them, never passes them, and that list is where the next AI job
comes from. Dropping the half of a sentence the scorer cannot reach is how a note quietly shrinks to
the part that already worked.

**Assert it here, not in a duel.** These are almost all symmetric between the two seats, or about what
the bot can *perceive*, and `aiduel.js` is blind to both by construction. It will report ~50% and that
reads as "your change did nothing".
*[Every way this project's measurement has lied →](MEASUREMENT.md)*

**Mark it, do not delete it.** Unlike a grab bag item, a satisfied claim stays — it is the reason its
assertion exists, and somebody rewriting that part of the scorer needs to know what it was protecting.
Add **DONE** and the date.

**When two readings of a note disagree on a real board, ask him — it is one sentence and it has never
not been worth it.** *"Ice Beam whenever Aurora Beam is not lethal"* and *"...when there's something
to be afraid of"* are the same note with and without a clause Trevor had not thought to write down,
and only the second one is buildable. He supplied it in a line. **A note is his shorthand, not his
whole model**, which is what [GRABBAG.md](GRABBAG.md)'s own header says about the other list too.

### What is not worth writing down

**Anything the card already says.** The engine knows Ice Beam can paralyse and that Fire Spin discards
two. A note restating printed text is the scoring-tag idea coming back in prose, and that has been
turned down twice on those grounds.

**A number.** *"Chansey should score about 15"* is a weight, and weights get measured against
instruments you would have to run. Say what should *happen*; the number is somebody else's job.

### Being wrong is fine and has been productive

Several notes described something real whose cause was somewhere else entirely — *"the AI avoids
non-DCE energy on Colorless Pokemon"* turned out to be true as an observation, nothing to do with
type, and **correct behaviour** for the card that prompted it. All of them were worth writing.
[PLAYTEST.md](PLAYTEST.md) is the same lesson for bug reports.

## If you are here from `ai.js`

The finding aid, because splitting by pattern is exactly what makes cross-scanning hard — the same
problem `RULINGS.md` hit after its own split, with the same remedy. **Which patterns bear on the code
you are about to touch:**

| Touching | Read |
|---|---|
| the retreat / switch case in `scoreAction` | [Walls](Playbook/WALLS.md) |
| `scoreAttack` choosing between two legal attacks | [Attack choice](Playbook/ATTACK-CHOICE.md) |
| the `evolve` case, or `scoreOnPlay` | [Evolution timing](Playbook/EVOLUTION-TIMING.md) |
| `attachBuild`, `potential`, the surplus rule | [Ammo](Playbook/AMMO.md), [Evolution timing](Playbook/EVOLUTION-TIMING.md) |
| `promoteValue` / `bestSelfSwitch` | [Walls](Playbook/WALLS.md) |

**What the scorer already does about each of these is in [AI.md](AI.md), and it is not repeated here.**
That file is the shipped invariants, read by decision; this one is what the cards want, read by
pattern. They link, they do not overlap.


## Possible patterns

#22 Tentatively identified 16 behavior patterns so far that could eventually be built into this, and some already have been. There are expected to be more added as we go. The ones not listed as documents here still need to be verified and built into the game. These patterns are used as references in the Wants and behaviors column in the v1 Opponent Deck file index page. More will be added as identified.


- Attack Choice - choosing between two legal attacks
- Bench Engines - prefer to stay on the bench and offer support, usually through Pokémon Powers
- Bench Target - attacks vulnerable pokemon on the opponent's bench
- Walls - exists to stall, not attack or retreat
- Evolution Timing - wants to evolve quickly to get a jump on the opponent or gate the opponent's evolutions (Aerodactyl)
- Setup Turn - using one attack to set up the next one, usually the turn before the second attack becomes affordable
- Over-Attach - wants extra energy past the listed amount on the card
- Kamikaze Timing - pokemon that want to self-destruct at high damage and take the opponent with it
- Copy Effects - pokemon like Ditto or Clefable who want to copy a pokemon or its moves
- Damage Scaling - staying in and taking damage because high damage taken translates into high damage dealt
- Entry Timing - wanting to come in at a specific point in the game. An example could be coming in mid-game when there are already energies in the discard pile, because a move relies on that
- Heal & Attrition - heals itself or heals allies
- Escape - Jumps to the bench or the player's hand when under pressure
- Power Suppression - Prevents pokemon powers from working
- Defensive Type Manipulation - changing its own type to avoid a weak type matchup
- Coin Luck - relies on coin flips to be effective at all, beyond the baseline
- Energy Funnel - wants a constant supply of energy fed to it due to its primary move requiring an energy discard. Applies to many Fire types. *(Written as "Energy Feed" when this list was first made and as "Energy Funnel" in every note since; Trevor settled it on 23 Aug 2026. **Its relationship to the built [Ammo](Playbook/AMMO.md) pattern is open** — Arcanine's note reads like Ammo's unbuilt half, Charmeleon's reads like something else, and whether that is one pattern or two gets decided when the family is worked, not before.)*




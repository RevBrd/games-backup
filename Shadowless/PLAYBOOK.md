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
the worse place. #15 proposed the column, Trevor filled it, #21 spotted it was worth more than the
scoring tags it sits beside. **65 cards carried a `Wants` when this file was reshaped, and they
clustered into sixteen patterns** — that clustering is what produced the directory below.

**The newest workbook is always the live one, and it is the whole history.** Trevor's method: copy the
previous workbook, add the next set's cards, fill in the judgement-call cells, build the decks. So
each one is a strict superset of the last — `Challenge 1` was verified as exactly the Fossil
workbook's 229 rows plus 28 promos and a `Gated Until` column. **Read the newest and never diff two
of them for content.**

**Its promos are not in the game yet**, which is why `Gated Until` exists. A `Wants` on a card that no
set has made live is a note filed early, not a gap — do not treat one as unfiled work, and if you
build a coverage tool, filter to the live sets.

**Two kinds of note live in that column and they have different consumers.** *"To use Agility unless
Drill Peck can kill"* is an in-play decision and belongs to `ai.js`. *"Replace 4x R energy with DCE in
deck"* and *"5-ish extra W energy in deck"* are **deckbuild** wants and belong to the autobuilder,
Job 13. Filing one as the other sends a real instruction to a component that cannot act on it.
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
| [Evolution timing](Playbook/EVOLUTION-TIMING.md) | Evolve when the line is *ready*, not when it is legal — and readiness is read off your hand | **Open**, blocked in a known order |
| [Deckbuild wants](Playbook/DECKBUILD-WANTS.md) | Not AI patterns. Parked for the autobuilder | **Parked** — Job 13 |

**The rest of the sixteen are named and defined at the bottom of this file, under *Possible
patterns*, and that list is the authority** — it is Trevor's, it carries a one-line definition each,
and **it is the controlled vocabulary he writes into the `Wants` column**, so a pattern's name there
has to match a name here. Do not restate it up here; a second copy would drift, and the copy a reader
hits first wins.

Each of the unwritten ones already has between two and nine cards behind it. **Write the file when
you work the pattern, not before** — an empty pattern file is a planning document, and
[MAINTENANCE.md](MAINTENANCE.md) calls those the highest-value target in the tree for exactly the
reason you would be creating one.

**Two taxonomies that already exist elsewhere are deliberately not patterns here.** Opener archetypes
are the workbook's column G and are half-built in `setupAuto`; pressure tags are deck-level and belong
to [OPPONENTS.md](OPPONENTS.md) and `tools/pressure.js`. Do not fork either into this folder.

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

**Assert it in `powertest.js`, not in a duel.** These are almost all symmetric between the two seats,
or about what the bot can *perceive*, and `aiduel.js` is blind to both by construction. It will report
~50% and that reads as "your change did nothing".
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

#21 Tentatively identified 15-16 behavior patterns so far that could eventually be built into this, and some already have been. There are expected to be more added as we go. The ones not listed as documents here still need to be verified and built into the game. These patterns are used as references in the Wants and behaviors column in the v1 Opponent Deck file index page.


- Attack Choice - choosing between two legal attacks
- Bench Engines - prefer to stay on the bench and offer support, usually through Pokémon Powers
- Bench Target - attacks vulnerable pokemon on the opponent's bench
- Walls - exists to stall, not attack or retreat
- Evolution Timing - wants to evolve quickly to get a jump on the opponent or gate the opponent's evolutions (Aerodactyl)
- Setup Turn - using one attack to set up the next one, usually the turn before the second attack became affordable
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




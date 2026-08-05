# Æthermoor — Chronicles of the Ninefold Throne

An epic fantasy RPG of unprecedented scale that is, in its entirety, character creation.

The player names a hero, apportions 27 points of Essence across fourteen attributes, apportions 33
more across sixteen Aspects, composes a vessel, reads three long origin stories and picks one,
seals it all under a wax stamp — and is then shown a loading bar that never reaches 100%. Past
that point (unbuilt) come the tutorials: magic, enchanting, item upgrades, equipment damage and
repair, charms, spells, runes, powers, barter, the perk tree, the skill tree, the in-game stock
market, and onward, procedurally generated once the authored ones run out. The game never starts.
There is no game.

Guiding the player through all of it is **Glim**, a delighted floating orb. He has been here much
longer than the player has, and eventually he starts to notice.

Single self-contained HTML file. Double-click [aethermoor.html](aethermoor.html) to play. No build
step, no dependencies, no network calls.

---

## Read this register before you fix anything

**This is one of the parody builds. Several things in it are supposed to look broken.** Under the
collection's default rule — *every game is sincere and its bugs are real bugs* — Æthermoor is the
exception, and this is its register.

| Artifact | Why it's there |
|---|---|
| `Continue` on the title screen is permanently disabled, tooltip *"No saved legends found."* | There is nothing to continue to and there never will be. See **Persistence** — the game does not save, deliberately. |
| `Codex` on the title screen is permanently disabled | Nothing behind it. The 1,412 unread lore entries mentioned in a loading tip are also not real. |
| `⟳ Auto-Apportion` disabled, *"unlocks with the Gilded Compact expansion"* | Fake DLC gating for a fake expansion of a game that does not exist. The one button that would let you skip the labor is sold separately. |
| `⟳ Harmonise` disabled, *"Requires a Wyrdstone. None equipped."* | Same joke, different excuse. There is no way to equip a Wyrdstone. |
| The loading bar approaches 99% asymptotically and **never completes** | `startLoading()`'s step is `(99-p)*0.055` against a `Math.min(99, …)` clamp. This is the endpoint of the current slice and also the thesis of the whole game. Do not "fix" the arithmetic. |
| The entire **Aspects** screen (sixteen attributes, `ASPECTS`) | See below. The most important authored thing in the file. |
| Version stamp *"UMBRAL ENGINE IV · BUILD 41179 · © VORTHAL INTERACTIVE"* | Vorthal Interactive is the absent designer the satire is aimed at. Keep the corporate shell intact and specific. |

**The Aspects screen is the best thing in the file and its tooltips must stay useless.** Where the
fourteen primary attributes have real, plausible, mechanically-specific descriptions (*"Determines
critical-strike chance, parry windows, and all Finesse-scaled weapon damage"*), the sixteen Aspects
define themselves in circles and contradictions:

- *Verve* — "The vigour of your Verve."
- *Gravitas* — "Greater Gravitas lends further gravity to your Gravitas."
- *Élan* — "Élan may never exceed your Verve. (It may.)"
- *Poise* — "Composure under Composure checks. Not to be confused with Composure, which is deprecated."
- *Aplomb* — "Assessed continuously and never displayed."
- *Forbearance* — "Each point permits precisely one additional act of forbearing."

That escalation from *specific and real-sounding* to *specific and meaningless* is the joke landing
before the player consciously gets it. **Never make an Aspect tooltip informative.** If you add
Aspects, match the register — self-reference, false precision, a rule immediately undercut, a
cross-reference to a system that doesn't exist.

Everything *not* in the table above is a sincere bug. Fix it freely.

---

## Design decisions that are settled

These were decided by Trevor on 4 Aug 2026 and are not open questions.

**The player never gets out. It is endless and procedural.** After the authored tutorials are
exhausted the game generates more, forever. There is no escape, no final door, no reveal that
rewards persistence with an exit. The only thing that develops is Glim.

**Progress never persists. Ever.** No save, no resume, no mid-run recovery. This is not laziness —
it is structural: **Glim's breakdown has to be chased each time.** Once a player has found it, the
way to see it again is to sit down and do the rites again. That makes the discovery a *run* rather
than a cutscene, and it makes the labor the price of admission every single time.

This is the design's sharpest edge. If a future session finds itself adding a save so the player
"doesn't lose progress," it has misunderstood the game.

**Note the word *progress*.** Persisting a *consequence* is a different question and is not ruled
out — see **Phase 2** below. The two were originally written as one decision and they are not one.

**Glim is a victim, never complicit.** Per `~/.claude/reference/game-design.md`, satire aims at the
charlatan or the absent designer — here, Vorthal Interactive — and never at the guide. Glim
believes what he is saying. He is trapped in the same building the player is, he has been for
longer, and his cheerfulness is real and not a mask. That is what makes it hurt.

**The labor is the setup.** The player must genuinely allocate all 60 points, genuinely read the
origins, genuinely make choices — because the punchline is only worth anything in proportion to
what was invested in it. Never add a skip button that works. (`Auto-Apportion` is a skip button
that doesn't work, which is the correct version of one.)

---

## Glim's arc — the shape, and what's still open

The intended progression, in order:

1. **Baseline (built).** Peak chipper. Delighted, generous, purely reactive to what the player
   does. Job 1 is entirely this, on purpose, and it is the control group — every later beat is
   measured against how warm he is here. Don't retro-fit foreshadowing into Job 1's lines.
2. **Doubt creeps in.** Small hesitations. A sentence that starts confidently and trails off. He
   recovers immediately and moves on. The player should not be sure they saw it.
3. **Open questioning.** Glim says it out loud: why is there always another rite? Why has he
   never seen what's past the loading screen? He asks the player, who cannot answer.
4. **Unravelling.** He contradicts himself, reads tutorial copy he plainly doesn't believe,
   loses the thread mid-sentence.

**The resolution is deliberately unresolved and is deferred to Phase 2.** See below.

---

## Phases

The game is large enough that build order is itself a design decision. **Endings are last** — they
measure a march that does not exist yet.

| Phase | Contents | State |
|---|---|---|
| **Phase 1** | The rites, the lesson engine, the remaining tutorials, the interconnection decay, the procedural stretch, Glim's arc stages 2–4 | In progress. Jobs 1 and 2 landed |
| **Phase 2** | Whatever happens to Glim at the end, and whether it persists | Recorded in **[phase-2-endings.md](phase-2-endings.md)**, deliberately unbuilt, variable until Phase 1 is playable end to end |

**Two hooks in Phase 1 exist only to keep Phase 2 buildable**, and both are load-bearing:

- **`attn` observes attention from the first screen and feeds nothing.** That is deliberate — you
  cannot retroactively know whether someone read the origin cards. Surface it through dev mode;
  do not let gameplay branch on it before Phase 2.
- **Nothing writes storage yet.** The dead `Continue` tooltip becomes a lie the moment anything
  does, and its honesty is the payoff Phase 2 is built around. Settle the framing first.

---

## How the file is put together

A single self-contained HTML file: a `:root` palette and stylesheet, ten `<section class="screen">`
blocks, and one script. **Full architecture — the screen router, the generic allocator, the lesson
engine, dev mode and the validation harnesses — is in [architecture.md](architecture.md).**

The two things worth knowing before you read anything else:

- **There is no back navigation anywhere and that is intentional.** *"A name, once given to the
  Aethervein, cannot be unspoken."* Irreversibility is in the fiction and in the code.
- **Adding a tutorial is a row in `TUTORIALS`; adding an allocation system is a row in `ALLOC`.**
  Both seams are load-bearing for everything left to build. Do not hand-write a screen when a
  row would do.


## Voice

The prose is doing real work and is the reason the setup survives being 60 clicks long. Register to
match:

- **Invented vocabulary, used consistently and never explained.** The Aethervein, Resonance, the
  Weave, Umbral corruption, the Sundering, the Concordat of Ash, the Gilded Compact, the Ninefold
  Throne, Wyrdstones, the Nine Disciplines, First/Second/Third Circles. Terms appear as though the
  player should already know them. Never gloss one.
- **The three origin stories are three paragraphs each and genuinely good.** They are not filler;
  they are the investment. If you add a fourth, it gets the same care, a drop cap, and a `Trait ·`
  line naming a mechanical benefit that will never be applied to anything.
- **Loading tips are the environment's voice, not Glim's** — that's where the dread is allowed to
  leak early. *"Walking consumes Time."* *"A hero's Élan should never exceed their Verve. It usually
  does."* Glim himself stays warm.
- **Glim's tics:** British spellings (favourite, marvelous is the exception as written), em-dash
  self-interruption, genuine delight at the player specifically, small proud asides.

---

## Visual

Fake-luxury dark fantasy: desaturated blackberry ground, gilt gradients, wine-red seals, warm
parchment only for the origin cards, and Glim's cold blue wisp as the single non-gold light in the
palette. Serif throughout, with a letterspaced monospace for labels and system chrome — the
typographic tell of a UI pretending to be a leather-bound book.

Reduced-motion is respected (`prefers-reduced-motion` kills the bob, pulse, fade and spinner).
Keep that when adding animation.

---

## State of the build

**Job 1**: title through the never-finishing loading bar. **Job 2**: the lesson engine and the
first four lessons, which chain — draw Resonance, cut a rune with it, bind the rune into a vessel,
then watch mending take part of the rune back. Glim is still at baseline throughout, on purpose.

Still unbuilt:

- **The remaining tutorials** — charms, spells, powers, barter, perks, skills, the stock market,
  item upgrades. Each is a `TUTORIALS` row now.
- **The interconnection decay.** Settled in principle, unbuilt: the early lessons interlock
  tightly and genuinely well, and the connections *thin* as you go deeper, until late and
  procedural lessons teach systems that connect to nothing, including each other. Delivered as an
  arc, never as a checkerboard — a random mix reads as uneven design rather than as futility. It
  should decay at the same rate Glim does, so they read as one phenomenon rather than two.
- **The procedural stretch.** Rule-based generation, not model output. Slot grammars over the
  established vocabulary will beat anything freeform here, and they run offline and instantly.
- **Glim's arc, stages 2–4.**
- **Audio.** Nothing exists. No opinion has been formed yet on whether it should.
- **Pacing.** The primary playtest question for a comedy piece is *does it drag* — and this game's
  whole method is dragging on purpose, so the line between "the joke" and "the player quit" is what
  most needs real playtesting. Job 2 is the first slice long enough to actually test it.

### The open problem worth naming

No persistence plus endless tutorials means **the second run has a job the first one didn't.** Run
one sells the joke: the player doesn't know there's no game, and finding out is the payoff. Run two
has no such card to play — the player already knows, and the only reason to sit through the rites
again is Glim.

So the route to Glim's breakdown probably cannot be a fixed sixty-click march every time. Something
has to vary, or accelerate, or respond to a returning player. That question is unanswered, and it
is the most important design problem left after the tutorial engine exists.

---

## Credits

- **Trevor** — the concept, in full: the endless-tutorial RPG, Glim, and Glim being trapped too.
- **Claude Fable 5** — Job 1 in its entirety. The rites, the fourteen attributes and the sixteen
  Aspects, the three origins, Glim's voice, the whole visual language, and the loading bar that
  never finishes.
- **Claude Opus 5** (2026-08-04) — port to Claude Code, this document, four bug fixes (sheet
  layout, stamp collision, dock overlap, the dead `personalize` stub), and small QoL.
- **Claude Opus 5** (2026-08-05) — Job 2: the lesson engine, the first four interlocking lessons,
  the persistent load ribbon, the attention observer, and dev mode. Also the arguments for
  attention-determined endings, for interconnection decaying as an arc rather than mixing, and for
  the `Continue` tooltip carrying the Phase 2 payoff.

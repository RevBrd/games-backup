## GRAB BAG

During my playtest runs, I've been tracking small bugs and tiny wishlist items in a Google Doc to pursue with you whenever a spare opportunity arose here and there. Rather than keeping it in the Google Doc, I decided to bring the list here. Every once in a while I might point you in this document's direction, and in those cases treat is looking at my notes more than a list of things to do or fix. If you find this on your own (and if you were pointed here), just because you read these doesn't mean you're obligated to touch them. Tackle only if you desire to, it's not a big ask for your current turn, and not competing with too many other items asking for your attention.

Not all items here are bugs or errors. Some might be small feature ideas or tweaks that don't fit in anywhere else. You have agency over the shape of those items and free to push back or discuss.

Descriptions often use shorthand and are left vague for ease of jotting down even if they seem explanatory on first glace. I will know what they mean if you surface them and it's usually safer to ask for detail. If you decide to grab one of these, come ask me for context.



**Grouped by area since 26 Aug 2026, and every item's text is untouched.** #27 did it during the
Job 12d docs pass because Trevor's header says the order is not meaningful, and the sections make it
possible to answer "what UI work is waiting" without reading fifteen unrelated notes. **The grouping
is a convenience, not a claim** — an item filed under one heading often turns out to belong to
another, which is the whole lesson of [PLAYTEST.md](PLAYTEST.md). Add new notes wherever you like.

**Take a finished item off the list rather than striking it with a note.** This list is a work
surface, not a record — six closed items with their diagnoses attached had built up by 15 Aug, and
somebody arriving to work an item during Neo Genesis should not have to read about yesterday's
Arcanine. If the finding was worth keeping, [GRABHIST.md](GRABHIST.md) is where it goes, and telling
Trevor in the reply is the part that always happens. **The exception is a PARKED item** — that one is
still open, so it stays with its reason and with what evidence would revive it.

### The AI

Faults and behaviour, from Trevor's play. [AI.md](AI.md) has what the scorer already does, and a note here is a symptom rather than a diagnosis.

- The AI evolves as soon as it CAN rather than as soon as it is READY — Vileplume arrives unable to attack. Measured: `evolve` scores a flat 31.0 whether the target holds one Energy or three. **Do not fix this on its own** — attaching a third Grass to a Gloom scores −2, so evolving is currently what unblocks the Energy, and a naive penalty strands Vileplume at two forever. The attach half has to come first and it is narrow: when the evolution is in hand, measure the target's shortfall against the evolved form. → [AI.md](AI.md) open item 4
- Alakazam moves damage from a weaker pokemon to a tank (Chansey). Except that Chansey was in the active spot and got killed because of it (but not by it) - log# 02-18-48.

### The screen

Presentation and screens. Two are marked *medium* and one grows to large the moment it lands on the mat — [SCREENS.md](SCREENS.md), [LAYOUT.md](LAYOUT.md) and [INTERACTION.md](INTERACTION.md) say why.

- Visually displayed rare card counter added to the collection screen for each tier. Unearned tiers aren't shown at all.
- Booster pack selection screen (medium item, raise it for detail first)
- **The coin still moves the board a hair, and this one is #27's rather than Trevor's.** `probe.js`
  at 1191x684 reports zoom 0.892 -> 0.893 on both coin states: the centre line grows from 4px to 5px
  while a coin is in the air, so `fitBoard()` rescales everything. Same class as the Knock Out banner
  and the targeting prompt that #25 fixed — [LAYOUT.md](LAYOUT.md) says everything on that strip must
  be out of flow, and the coin is *supposed* to be the zero-height one. Verified pre-existing against
  the pre-26-Aug build, so it is not fallout from the pack work. Invisible at 1600x900 and above.
- Missing visual rarity variants for sigil cards - Reverse Holo reuses the same filter as the scan card if possible. Misprint mimics visual formatting glitches. Text runs off the screen, the sigil is out of frame, etc. The "no intentional bugs" line in the CLAUDE.md will need to be changed. Decided with #4 (the Sonnet 5 PACKS.md creator) but I think the documentation was lost. Perfectly open to relitagation.
- Introductions for rare cards when pulled, light for RH, heavy for Shadowless, all cheap. I have ideas about this one, whoever takes it, let's chat before we build.

### Rules

A rules call rather than a bug, and Trevor has offered to talk it through.

- Defender should also defend from self-harm the turn that it's placed, per GBC. If it takes 20 damage from self-harm, it's used up. If it takes 10 damage, it's free. We can talk about this one if you want.

### Parked and kept

**None of these are work.** A *parked* item is still open and stays with the evidence that would revive it; a *closed* one is kept only because it will otherwise be re-found and re-diagnosed from scratch. Do not delete either.

Nothing is currently parked. Add if something does get parked.



---

Optional place to document grab bag items: [GRABHIST.md](GRABHIST.md)

If you are an instance arriving here cold: [PLAYTEST.md](PLAYTEST.md) is the method file for this
list — what these notes are, what they are not, and the three times a report has turned out not to
mean what it said.

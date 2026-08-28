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
- base5 Charmander uses its pokemon power to strip an energy from the active pokemon that it depended on. Then on the next turn attaches an energy that it couldn't use - log# 03-56-31
- AI retreats Rattata instead of scoring a kill - log# 04-58-05

### The screen

Presentation and screens. Two are marked *medium* and one grows to large the moment it lands on the mat — [SCREENS.md](SCREENS.md), [LAYOUT.md](LAYOUT.md) and [INTERACTION.md](INTERACTION.md) say why.

- Booster pack selection screen (medium item, raise it for detail first)
- **LOW PRIORITY — Trevor, 26 Aug: not noticeable in play.** The board grows 1px while a coin is in
  the air, and it is the ACTION BAR rather than the coin.
  #27's, not Trevor's, and the first version of this note blamed the wrong element — worth keeping
  because the symptom points somewhere else entirely. `probe.js` at 1191x684 reports zoom 0.892 ->
  0.893 and the centre line growing 4px -> 5px, which reads as *something on the centre line is in
  flow*. It is not: the coin is `position:absolute;height:0` and always was. **The bar swaps a 25px
  `btn end` for a 14px `barmsg`, so it shrinks 36px -> 34px, and `fitBoard()` grows the board into
  the 2px that just came free.** The centre line growing is the *result* of the zoom, not the cause.
  Same family as the pack reveal's three reservations: a container whose height depends on which of
  two different-height things is in it. The fix is probably one `min-height` on `.actionbar` sized to
  a button, but it is the board, so it is an ask rather than a do. Verified pre-existing against the
  pre-26-Aug build. Invisible at 1600x900 and above. **Nothing anywhere records a reason for leaving
  it** — I looked, since Trevor thought #25 might have had one, and #25's own notes are about the
  Knock Out banner and the targeting prompt rather than this. Absent reasoning is not consent either
  way; treat it as open.
- **Missing sigil-card treatment for Reverse Holo** — reuse the same filter as the scan card if
  possible. `SIGIL_MARKS` has the row commented as absent *by design*, so this is a row plus at most
  one CSS rule. **The Misprint half of this note is DONE and has been for a while** — all three
  flavours render on the sigil card: mp1 runs the rules text off the right edge, mp2 stretches the
  card and its art, mp3 prints the whole thing as a negative. `COLLECTION.md` said they were absent
  and that is why nobody knew; corrected 26 Aug 2026. Trevor has not pulled one — Misprint is
  1-in-1,183 packs and he is 162 in.
- Introductions for rare cards when pulled, light for RH, heavy for Shadowless, all cheap. I have ideas about this one, whoever takes it, let's chat before we build.
- Attaching an energy or applying an item to a pokemon needs to not be canceled by the item clicked underneath it.


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

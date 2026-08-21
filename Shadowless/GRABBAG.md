## GRAB BAG

During my playtest runs, I've been tracking small bugs and tiny wishlist items in a Google Doc to pursue with you whenever a spare opportunity arose here and there. Rather than keeping it in the Google Doc, I decided to bring the list here. Every once in a while I might point you in this document's direction, and in those cases treat is looking at my notes more than a list of things to do or fix. If you find this on your own (and if you were pointed here), just because you read these doesn't mean you're obligated to touch them. Tackle only if you desire to, it's not a big ask for your current turn, and not competing with too many other items asking for your attention.

Not all items here are bugs or errors. Some might be small feature ideas or tweaks that don't fit in anywhere else. You have agency over the shape of those items and free to push back or discuss.

Descriptions often use shorthand and are left vague for ease of jotting down even if they seem explanatory on first glace. I will know what they mean if you surface them and it's usually safer to ask for detail. If you decide to grab one of these, come ask me for context.



The list is in no meaningful order. Please edit or remove items appropriately if you finish one.

**Take a finished item off the list rather than striking it with a note.** This list is a work
surface, not a record — six closed items with their diagnoses attached had built up by 15 Aug, and
somebody arriving to work an item during Neo Genesis should not have to read about yesterday's
Arcanine. If the finding was worth keeping, [GRABHIST.md](GRABHIST.md) is where it goes, and telling
Trevor in the reply is the part that always happens. **The exception is a PARKED item** — that one is
still open, so it stays with its reason and with what evidence would revive it.

* Block paralyzed pokemon from retreating — **PARKED 13 Aug.** `canRetreat` already refuses both
  Asleep and Paralyzed, asserted two ways in `powertest.js`. Either this predates a fix or it was
  something else. **Revive it with a log showing a paralyzed Pokémon leaving the Active spot.** →
  [GRABHIST](GRABHIST.md)
* Booster pack selection screen (medium item)
* Verify 1st Edition pack drop odds with simulation
* Opponent uses Gust of Wind to drag out a pokemon already in the active spot — open, but **not what
  it looks like** and not Gust-specific. → [GRABHIST](GRABHIST.md)
- **Intra-turn sequencing.** Two items are the same fault: the CPU should spend consumables *before*
  playing Professor Oak or Gambler, and it played two Gusts in one turn that undid each other. The
  scorer evaluates each Trainer independently within a turn and has no memory that it just acted.
  → [GRABHIST](GRABHIST.md)
- Visually displayed rare card counter added to the collection screen for each tier. Unearned tiers aren't shown at all.
- If the opponent has a tank in the active spot and is starting to run out of cards in the deck before the player, it begins to power up that tank to attack with or retreat rather than tank to a loss - Some preemptive, some log# 06-13-50. **The draw half of this is done** (deck spending is priced, as a curve rather than a floor at 20); what is left is the bot noticing it is losing a race it can count and changing plan. → [GRABHIST](GRABHIST.md)
- Opponent used Potion right at the start to heal only 10 damage. Also promotes a pokemon only to switch it out immediately - log# 00-28-40
- Visual popup on screen or in side panel (screen preferred) when a trainer card is played by the CPU, with a short pause in the action while it's shown. (medium item). If on screen, LAYOUT.md and INTERACTION.md might get involved and it becomes a large item.
- Lower cards per pack to 10 for pacing reasons. Let's talk about which one to yeet out.
- Missing visual rarity variants for sigil cards - Reverse Holo reuses the same filter as the scan card if possible. Misprint mimics visual formatting glitches. Text runs off the screen, the sigil is out of frame, etc. The "no intentional bugs" line in the CLAUDE.md will need to be changed. Decided with #4 (the Sonnet 5 PACKS.md creator) but I think the documentation was lost. Perfectly open to relitagation.
- I think the enemy Ivysaur decided not to kill on turn 12 - log# 04-37-10. **Still open, and it is the last live part of this note.** The two Exeggutor Teleports are fixed and gone; the Gloom retreat on turn 14 turned out to be defensible — it set up the Bulbasaur Leech Seed that took the Prize, and Gloom had one Grass against Poisonpowder's two, so it could not have killed itself. The Ivysaur turn is not reproduced yet: it had just evolved and Vine Whip's 30 was exactly lethal on Lickitung, but whether it could pay GGC that turn is not in the log. → [GRABHIST](GRABHIST.md)
- **CLOSED as not-a-bug, kept one line because it will be re-found.** The bot refusing basic Energy on a Colorless Pokemon is real and is not about type — every basic type scores identically on a Chansey, measured. It is that `potential()`'s `short` measures distance to the CHEAPEST reachable attack, so it pins at 0 once any attack is payable, and Chansey never walks up to Double-edge. **Trevor's answer, 21 Aug: that is correct play for Chansey** — Double-edge is a kamikaze you only set up when a DCE finishes it in one turn. The rule is right here and wrong elsewhere, so the fix is per-card judgement rather than a weight. → [GRABHIST](GRABHIST.md)
- The AI evolves as soon as it CAN rather than as soon as it is READY — Vileplume arrives unable to attack. Measured: `evolve` scores a flat 31.0 whether the target holds one Energy or three. **Do not fix this on its own** — attaching a third Grass to a Gloom scores −2, so evolving is currently what unblocks the Energy, and a naive penalty strands Vileplume at two forever. The attach half has to come first and it is narrow: when the evolution is in hand, measure the target's shortfall against the evolved form. → [AI.md](AI.md) open item 4
- Introductions for rare cards when pulled, light for RH, heavy for Shadowless, all cheap. I have ideas about this one, whoever takes it, let's chat before we build.
- Defender should also defend from self-harm the turn that it's placed, per GBC. If it takes 20 damage from self-harm, it's used up. If it takes 10 damage, it's free. We can talk about this one if you want.
- I either pulled a really lucky Shiny -> 1st Edition Shiny -> Shadowless (my first one) in back to back to back packs, or the odds are messed up. We should check them with a sim to be sure. First shiny pull not shown in log - log# 21-35-11

 






Optional place to document gab bag items: [GRABHIST.md](GRABHIST.md)

If you are an instance arriving here cold: [PLAYTEST.md](PLAYTEST.md) is the method file for this
list — what these notes are, what they are not, and the three times a report has turned out not to
mean what it said.


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
- Temporarily install a popup that asks me a Y/N if I want to save a game log when I leave the final card opening screen (on a win) or the game in general (on a loss). This is because I'm stupid and keep clicking through it.
- Opponent used Potion right at the start to heal only 10 damage. Also promotes a pokemon only to switch it out immediately - log# 00-28-40
- Visual popup on screen or in side panel (screen preferred) when a trainer card is played by the CPU, with a short pause in the action while it's shown. (medium item). If on screen, LAYOUT.md and INTERACTION.md might get involved and it becomes a large item.
- Lower cards per pack to 10 for pacing reasons. Let's talk about which one to yeet out.
- Draw prize collection in random order.
- Show duplicate card numbers (if not new) on the booster pack opening screen, displaying after each card is flipped.
- Missing visual rarity variants for sigil cards - Reverse Holo reuses the same filter as the scan card if possible. Misprint mimics visual formatting glitches. Text runs off the screen, the sigil is out of frame, etc. The "no intentional bugs" line in the CLAUDE.md will need to be changed. Decided with #4 (the Sonnet 5 PACKS.md creator) but I think the documentation was lost. Perfectly open to relitagation.
- I think the enemy Ivysaur decided not to kill on turn 12. Bad retreat by Gloom on turn 14. Exeggutor teleports to switch with Exeggutor of equal condition. Alternative was a 50/50 attack, turn 18. Exeggutor promoted and switched out immediately through Teleport, turn 20 - log# 04-37-10
- Moltres shouldn't have retreated. That is a very good sacrifice pokemon to buy time, and might have even been able to attack if powered up. It might not have been factoring in its resistance to Hitmonlee in its damage calculation. The pokemon that replaced it was killed immediately by the same attack Moltres would have survived - log# 04-06-28
- The AI might be avoiding adding non-DCE energy to colorless pokemon, and Chansey retreated, twice - log# 04-26-10
- Introductions for rare cards when pulled, light for RH, heavy for Shadowless, all cheap. I have ideas about this one, whoever takes it, let's chat before we build.

 






Optional place to document gab bag items: [GRABHIST.md](GRABHIST.md)

If you are an instance arriving here cold: [PLAYTEST.md](PLAYTEST.md) is the method file for this
list — what these notes are, what they are not, and the three times a report has turned out not to
mean what it said.


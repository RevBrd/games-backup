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
* Cap energy drops at 2 per pack, even in base1
* Booster pack selection screen (medium item)
* Verify 1st Edition pack drop odds with simulation
* AI is still attaching invalid energies to its pokemon when no other options exist. Maybe due to planning for future evolutions. We should consider changing even if so.
* Opponent declined to attack - log# 22-12-05
* Opponent avoids powering up Arcanine because my Mewtwo's Psychic builds damage based on opp energy
* Opponent uses Gust of Wind to drag out a pokemon already in the active spot — **diagnosed, not
  taken.** It is not what it looks like: Gust picks a *bench* index and cannot target the Active at
  all. What happened in log 22-29-31 is two Gusts in one turn undoing each other. Almost certainly
  not Gust-specific. → [GRABHIST](GRABHIST.md)
* Opponent should better calculate when to promote a pokemon from the bench, considering number of turns needed to power it up.
- The two free energies after base1 is proving too much. I would rather ditch them and include base1 energies in the card pool for subsequent sets but with their own card numbers.
- Check if variant cards are displaying in game. Ideally the sigil cards should show their markings.







Optional place to document gab bag items: [GRABHIST.md](GRABHIST.md)

If you are an instance arriving here cold: [PLAYTEST.md](PLAYTEST.md) is the method file for this
list — what these notes are, what they are not, and the three times a report has turned out not to
mean what it said.


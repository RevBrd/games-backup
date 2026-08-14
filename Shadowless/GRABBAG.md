## GRAB BAG

During my playtest runs, I've been tracking small bugs and tiny wishlist items in a Google Doc to pursue with you whenever a spare opportunity arose here and there. Rather than keeping it in the Google Doc, I decided to bring the list here. Every once in a while I might point you in this document's direction, and in those cases treat is looking at my notes more than a list of things to do or fix. If you find this on your own (and if you were pointed here), just because you read these doesn't mean you're obligated to touch them. Tackle only if you desire to, it's not a big ask for your current turn, and not competing with too many other items asking for your attention.

Descriptions often use shorthand and are left vague for ease of jotting down even if they seem explanatory on first glace. I will know what they mean if you surface them and it's usually safer to ask for detail. If you decide to grab one of these, come ask me for context.



The list is in no meaningful order. Please edit or remove items appropriately if you finish one.

* Block paralyzed pokemon from retreating — **PARKED 13 Aug.** `canRetreat` already blocks both
  Asleep and Paralyzed, and `powertest.js` now asserts it two ways (the predicate refuses, and
  `act()` refuses without charging Energy). So either this predates a fix or it was something else.
  Grab a log if it happens again and it goes straight back on the list.
* Cap energy drops at 2 per pack, even in base1
* Booster pack selection screen (medium item)
* Verify 1st Edition pack drop odds with simulation
* ~~Building a new deck does not let you use the new deck you just built. Basic one instead.~~
  **DONE 13 Aug.** Not a layout problem — a blueprint and the built deck shared the default name
  "New deck", and the name resolved to the blueprint. See `COLLECTION.md`.
* AI is still attaching invalid energies to its pokemon when no other options exist. Maybe due to planning for future evolutions. We should consider changing even if so.
* Opponent declined to attack - log# 22-12-05
* ~~Opponent retreated a Kangaskhan instead of tanking. Electabuzz should have been left in too~~ - log# 22-20-14
  **DONE 13 Aug.** Derived stickiness, not a per-card tag — terminal Basics only, scored on HP,
  retreat cost and stalling attacks. Kangaskhan/Snorlax 0.90, Chansey 0.80, Electabuzz 0.60, and it
  found Lickitung and Onix on its own. See `AI.md`.
* Opponent avoids powering up Arcanine because my Mewtwo's Psychic builds damage based on opp energy,
  ~~illegally retreats pokemon,~~ and uses Gust of Wind to drag out a pokemon already in the active spot,
  ~~illegally retreated a second time by not flipping the coin while confused~~ - log#
  **CONFUSION DONE 13 Aug** — the flip exists now, and the Energy is paid before it. The Gust item is
  real but is a different bug than it looks: see `GRABHIST.md`. The Arcanine half is still open.
* Opponent should better calculate when to promote a pokemon from the bench, considering number of turns needed to power it up.
- ~~Opponent should calculate weakness and resistance into its damage predictions.~~ **DONE 13 Aug.**
  Right in exactly one place: three of the four forecast paths already did, `bestAffordableDamage`
  did not, and that is the one the retreat decision runs on.
- The two free energies after base1 is proving too much. I would rather ditch them and include base1 energies in the card pool for subsequent sets but with their own card numbers.







Optional place to document gab bag items: [GRABHIST.md](GRABHIST.md)


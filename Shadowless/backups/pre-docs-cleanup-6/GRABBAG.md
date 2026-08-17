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
* Opponent avoids powering up Arcanine because my Mewtwo's Psychic builds damage based on opp energy — **PARKED 16 Aug**, Trevor's call, no log survived. Worth knowing for
  whoever revives it: there is no path by which the opponent's attack text reaches
  the bot's own attachment decision, so it cannot have been doing it for that
  reason. **Revive it with a log.** → [GRABHIST](GRABHIST.md)
* Opponent uses Gust of Wind to drag out a pokemon already in the active spot — **diagnosed, not
  taken.** It is not what it looks like: Gust picks a *bench* index and cannot target the Active at
  all. What happened in log 22-29-31 is two Gusts in one turn undoing each other. Almost certainly
  not Gust-specific. → [GRABHIST](GRABHIST.md)
- Check if variant cards are displaying in game. Ideally the sigil cards should show their markings.
- Add to the logic something about when to use Professor Oak and Gambler and when not to. Might be worth discussion first.
- Visually displayed rare card counter added to the collection screen for each tier. Unearned tiers aren't shown at all.
- If the opponent has a tank in the active spot and is starting to run out of cards in the deck before the player, it begins to power up that tank to attack with or retreat rather than tank to a loss. It should also stop using cards like Bill or Professor Oak, or moves like Fetch or Pay Day below ~20ish cards - Some preemptive, some log# 06-13-50.
- Hand cards change size in different situations, sometimes as things are moving between turns or after a turn has ended. Please do not touch this one without carefully consulting LAYOUT.md and saving it for its own dedicated pass with minimal competing items, just in case. Trigger might be during coin flips, after which it reverts back. Update - It might be the whole screen any time anything is selected resizing itself. Back up before this one.
- Electabuzz shouldn't have been retreated Turn 30. Possibly same root case as example from 06-13-50 - log#16-06-53
  **Not looked at yet, and worth a re-check before chasing.** The recoil-suicide
  fix came out of the same log and changes what the bot thinks a damaged Active
  is worth, and the promote/Switch unification landed after this game was
  recorded. A fresh log would be better evidence than this one.
- Temporarily install a popup that asks me a Y/N if I want to save a game log when I leave the final card opening screen (on a win) or the game in general (on a loss). This is because I'm stupid and keep clicking through it.
- Opponent used Potion right at the start to heal only 10 damage. Also promotes a pokemon only to switch it out immediately - log# 00-28-40
- Double Colorless energy when attached to a pokemon should visually display two dots instead of one.
- Visual popup on screen or in side panel (screen preferred) when a trainer card is played by the CPU, with a short pause in the action while it's shown. (medium item)
- Lower cards per pack to 10 for pacing reasons. Let's talk about which one to yeet out.







Optional place to document gab bag items: [GRABHIST.md](GRABHIST.md)

If you are an instance arriving here cold: [PLAYTEST.md](PLAYTEST.md) is the method file for this
list — what these notes are, what they are not, and the three times a report has turned out not to
mean what it said.


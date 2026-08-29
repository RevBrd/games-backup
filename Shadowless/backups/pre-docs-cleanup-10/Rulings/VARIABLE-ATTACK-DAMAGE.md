# A card that reads the real world gets a fixed stand-in, declared once

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Trevor's call, recorded 23 Aug 2026 from his promo workbook.** Made before Job 12 rather than
during it, which is why it is here.

`basep-24` is **`_____'s Pikachu`** — a promo printed with a blank for its owner's name. Birthday
Surprise:

> If it's not your birthday, this attack does 30 damage. If it is your birthday, flip a coin. If
> heads, this attack does 30 damage plus 50 more damage; if tails, this attack does 30 damage.

**The card asks a question about the calendar, and the game has no reason to know the answer.**

## The decision

**Trevor's own birthday is the stand-in, and the card is named for him.** In his words: *"Rather than
building in a birthday system, I decided to use mine as a placeholder."*

So the attack is a plain 30 on all but one day of the year, and on that day it is 30 plus a coin for
50 more. Nothing is asked of the player and nothing is stored in the save.

## Why a stand-in beats the two obvious alternatives

**Not a settings field.** A birthday in `save.settings` would be the first thing in that object that
changes what a card *does* — [COLLECTION.md](../COLLECTION.md) is explicit that nothing in `settings`
may affect what the player owns, and this is the same boundary one step over. It would also be a
personal-data field in a save file that gets exported and pasted around, for one card.

**Not "always 30".** Flattening it deletes the card's only joke. The whole point of the printing is
that it is a birthday present, and a player who happens to fire it on the right day should get the
surprise. It costs one date comparison.

**The general shape, since this will recur:** *a card that reads state the game does not model gets a
declared constant, not a new system and not a deletion.* Whichever constant is chosen, **write down
whose it is and why**, because a bare `if (month === 7 && day === 31)` in `effects.js` is exactly the
kind of line a later session deletes as a leftover.

## One thing to get right when it is built

**The date is read once per attack, not cached at load**, or a session left open overnight answers
for yesterday. Trivial, and the sort of thing that is only ever found on the one day it matters.

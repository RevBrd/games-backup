# Peek follows the card; Clairvoyance follows the Game Boy

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

**One file, two cards, because it was one decision** — they share a panel and were settled together.

---

**Settled 10 Aug 2026, with Trevor.** Both are information Powers and they share one panel.

Trevor's recollection of the GBC game is that it showed the opponent's **whole hand** in a window you
closed when you were done, and that the permanent version simply let you open that window whenever
you liked, on your own turn.

**The presentation is adopted wholesale** — for Clairvoyance especially, a window you open beats a
panel permanently eating board space, and "your turn only" is right.

**Peek's scope is not.** The card is specific rather than ambiguous — *"the top card of either
player's deck, a random card from your opponent's hand, or one of either player's Prizes"* — and the
standing policy hands ambiguity to the GBC game, not clear text. So Peek offers those three, one
card at a time, in the same window Clairvoyance opens. Note the third includes **your own** Prizes:
finding out whether your Charizard got prized is the most useful thing the card does, and it would
be easy to build only the opponent-facing half.

Both are **no-ops for the AI**, which reads full engine state already — it would be spending a Power
to learn something it knows. The rulings log said they belonged on `UNSCORED_ON_PURPOSE`; **they
don't, and the implementation is better.** `ai.js` scores `PEEK` at `-Infinity` as an explicit case,
with a comment pointing back here. Deliberately worthless beats deliberately unscored: the
declaration lives in the file that does the scoring, and the opt-out list stays reserved for verbs
the AI is never even offered. Don't "fix" this by moving it.

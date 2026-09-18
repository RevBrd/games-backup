# 17 Sep 2026 — a Doll is not a Prize, and nothing had ever discarded one

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** the `discardInPlay` case in `scoreAction`; `givesPrize` in `scoreAttack`'s lethal
branch; the Prize term in `promoteValue`

---

**Job 17b** · #42 · found by a guard, not by a game. AI.md item 16 asked for a check that every
action type `legalActions` emits has a case in `scoreAction`, and predicted it would go in green.

**The invariant: Clefairy Doll and Mysterious Fossil concede no Prize when they fall, and every
scorer that prices a Prize has to know that. The bot discards one only to put an attacker in front
that can swing THIS turn.**

## What was wrong — three places, one fact

| Where | Was | Consequence |
|---|---|---|
| `scoreAction` | **no `discardInPlay` case**, so `default: return -Infinity` | no bot ever discarded one. A Fossil sent up Active cannot retreat or attack, so it stood there until the opponent chose to Knock it Out. Three roster decks run four |
| `scoreAttack`, lethal branch | `takesLastPrize` read only `me.prizes.length <= 1` | on our last Prize, **a KO on their Fossil was priced as winning the game** — Gnaw scored 250 |
| `promoteValue` | charged `W.retreatPrize / left²` whenever the slot would die | a Fossil looked worth fleeing for a Prize it could never concede |

The engine has always had it right: `c.playsAs === 'pokemon'` → *"doesn't count as a Knocked Out
Pokemon — no Prize"*. Only the AI's copies of the question were wrong, which is the `slotSymbols`
shape again.

## The discard rule, and why it is gated rather than a free Switch

It is priced by `bestSelfSwitch`, the same yardstick as Switch and promotion — **but only when the
destination can attack this turn**: already paid (`short === 0`), or one short with an Energy in hand
and the attachment unspent. Otherwise `-Infinity`.

The gate is there because a Doll is the one wall that costs nothing when it dies. Trading it for a
Pokemon that cannot swing yet gives the opponent a free target instead of a free stall. Trevor, 17
Sep 2026, on item 1: *once a tank is out there it's okay to sit behind it powering up multiple
things.* The gate is the smallest version of that.

**Not built, deliberately:**
- **A benched one is `-Infinity`.** Discarding it only frees a Bench slot, which matters on a full
  Bench with a Basic waiting.
- **Never while its evolution is in hand** (`evolutionInHand`) — that is the other way out.
- **What an ordinary `W.knockout` is worth on a Doll is open.** The Prize is gone and the forced
  promotion is not, so it is neither 55 nor 0. Only the last-Prize misfire, which was definite, is
  fixed.

## Measured

`abtest.js 8 HEAD --card base3-62`: **12.2% ± 1.7 of games diverged** (182 of 1,488 per side, the
3 decks holding Mysterious Fossil). Subject-deck wins 821 on both sides — plausible for a symmetric
change, and exactly equal is a coincidence recorded rather than explained.

`powertest.js` holds four rows under *Doll and Fossil — the bot*. **Three of the four were watched
failing against the pre-change `ai.js`**; the fourth — stay behind the wall — passed there too,
because the old answer was `-Infinity` for everything.

## The AI.md item as it read, verbatim

Moved out of [AI.md](../AI.md)'s open list on 17 Sep 2026 by #42, once the item closed — that
file's own rule is that a shipped item leaves the live claim and a pointer behind, and six
closures in one session had instead left their full text in place (644 lines to 737). Indentation
is the list's; nothing else is changed.

    **An ACTION TYPE is a third silent-failure surface, and it is the one nothing guards — 8 Sep
    2026, Job 16.** This file's opening line is about a *verb* the scorer cannot price, and
    `selftest.js` covers that, plus Power kinds, plus (since Gym Heroes) Stadium kinds. **None of
    them sees a new `a.t`.**

    `scoreAction` ends in `default: return -Infinity`. So an action type nobody scored is not
    misplayed — it is **never played at all**, by anything, forever. The Stadium zone added
    `stadiumAction` for Celadon City Gym, and until it was scored the bot owned a card it could not
    reach for, with every suite green and the card working perfectly for the human.

    **It fails CLOSED, which is why it has survived unnoticed and why it is item 16 rather than a
    bug.** An unscored verb is played badly and shows up in a log; an unscored action type is absent
    from every log there has ever been. That is strictly harder to find and strictly less harmful,
    and the two properties are the same property.

    **What it would cost:** `legalActions()` can emit an `a.t` and `scoreAction`'s switch can be
    read for its cases, both statically, so this is the same shape as the three guards that already
    exist — walk one list, assert the other covers it, with an opt-out set for anything deliberately
    priced at `-Infinity`. The existing action types are few and all scored, so it goes in green;
    **write it before the next one is added, not after**, since a guard added after the fact cannot
    tell you what it would have caught.

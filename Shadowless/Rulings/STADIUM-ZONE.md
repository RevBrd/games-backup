# The Stadium zone — the newcomer wins, and it is the card that says so

*Append-only, and exempt from the 200-line target like every entry in this folder. Correct it; never
condense it.*

**Settled 8 Sep 2026, Job 16 (Shadowless 40), before the first Gym Heroes Pokémon was written.**
Gym Heroes prints seven Stadium cards and the engine had no persistent Trainer-in-play zone at all.
This entry is the four calls that came with building one.

## 1. Which Stadium wins — and why it is NOT the Aerodactyl/Muk rule

Every Stadium in the era prints the same boilerplate:

> This card stays in play when you play it. **Discard this card if another Stadium card comes into
> play.**

**So the newcomer wins, the incumbent is discarded, and this is step 1 of `RULINGS.md`'s order — the
printed text settles it.** It is written down anyway because of what it *looks* like.

It looks exactly like [Aerodactyl vs. Muk](AERODACTYL-MUK.md), whose principle is the opposite:
*when two continuous effects would each disable the other, whichever is already in play wins.* Two
board-wide continuous effects, one arriving while the other stands — the shape matches on sight, and
matching by shape is precisely what step 2 of the ruling order tells you to do.

**It matches, and it is wrong, because Aerodactyl/Muk is what you reach for when nothing settles the
question and here something does.** The Gym prints its own answer, so the general principle never
gets consulted. That is the whole reason this section exists: the next instance to meet a continuous
effect will scan the principles table, find the incumbent-wins row, and apply it to a card that
explicitly says otherwise.

**The transferable rule: a principle matched by shape is only reached when step 1 has already
failed.** Read the card first, every time, even when the shape is familiar — *especially* when the
shape is familiar, because a recognised shape is what stops people reading.

## 2. Replaying a Stadium that is already in play

**Legal in this era.** WotC only banned playing a Stadium with the same name as the one in play in a
later era; for Gym Heroes there is no such restriction, so the printed text stands alone and it says
a Stadium is discarded when *another Stadium card* comes into play.

But six of the seven Gyms are pure continuous rules, so replaying one changes nothing at all — and
`trainerPlayable()` is this engine's standing gate against a card that would do nothing. **So the
implementation refuses a same-name replay unless the Stadium declares `onPlay`.**

**Narrow Gym is the exemption and the reason the flag exists rather than a name check.** Its on-play
clause forces a Bench return, so replaying it really does something, and hard-coding "except Narrow
Gym" would be a card-shaped answer to a rule-shaped question — the thing this project's own doctrine
turns down. A future Stadium with an arrival effect declares the flag and is exempt for free.

**This is a playability call, not a rules change.** The rules permit the replay; the engine declines
to *offer* it where it is provably inert, which is the same thing it already does for a Potion with
nothing damaged.

## 3. A Stadium is scoped by NAME, and never by who played it

Three of the seven key off a Gym Leader's name — Cerulean helps *"his or her Pokémon if it has Misty
in its name"*, Pewter *"attacks made by Pokémon with Brock in their names"*, Vermilion *"a player
attacks with a Pokémon with Lt. Surge in its name"*.

**None of them says whose.** So a Cerulean City Gym you played discounts your opponent's Misty's
Seadra exactly as much as it discounts yours, and that is the card working rather than a bug. It is
[Do the Wave and Boyfriends](DO-THE-WAVE-BOYFRIENDS.md) again — *count what the card says, not what
the situation implies, and match on card name.*

Two consequences worth stating, because both are easy to get wrong in the other direction:

- **The scope lives in the descriptor, not in the caller.** Six call sites consult the zone; if each
  one decided for itself what *"his or her"* meant, they would drift. The engine's `stadiumNameMatch`
  is the one matcher and `ai.js` reads it rather than keeping a copy.
- **It is a SUBSTRING test, because the card says "in its name".** Every Gym Heroes owner's card
  happens to lead with the owner's name, so a prefix test would pass every case in this set and be
  wrong at the first card that does not. Implement the sentence, not the sample.

## 4. What a returning Pokémon carries with it

Narrow Gym returns a Benched Pokémon *"and all cards attached to it"*. That is `gatherSlot`, which
Hurricane and Mr. Fuji already use. **A Gym does not get to invent a second answer to what a Pokémon
carries**, and reaching for the existing doorway is what keeps that true without anyone having to
check.

Its ordering clause — *"if both players have to return a Pokémon, your opponent returns a Pokémon
first"* — is implemented as a **chain rather than a loop**: the opponent is asked, and their answer
poses our question. That falls out of `pendingAsk` being one question at a time, and it means the
printed ordering is enforced by construction rather than by a comparison somebody could invert.

## What generalises

| Principle | Why it is here |
|---|---|
| **A principle matched by SHAPE is only reached when the printed text has already failed to settle it** | The Stadium boilerplate answers the question Aerodactyl/Muk exists for, in the opposite direction |
| **A rule-shaped exemption beats a card-shaped one** — `onPlay`, not "except Narrow Gym" | The next Stadium with an arrival effect is exempt without an edit |
| **Implement the sentence, not the sample** — "in its name" is a substring test even when every card in the set would pass a prefix test | A set is not a specification |

# Energy Search finds any Energy card, including Double Colorless

**Settled with Trevor, 18 Aug 2026. Deliberately not the printed text, and it bends a principle this
tree already settled — that part is written down below rather than glossed.**

Energy Search reads *"Search your deck for a basic Energy card and put it into your hand."* Double
Colorless is a Special Energy, not a basic one, so the printed text excludes it. **The Game Boy Color
game allowed it anyway**, which Trevor remembers surprising him as a child, and it is the reason
Charizard is a workable deck there: Fire Spin costs `RRRR`, Energy Burn turns a Double Colorless into
two Fire, and nothing else in the era can go and find one.

**The implementation takes any Energy card**, not basic-plus-Double-Colorless. A card-name special
case would be the narrower change but it is the worse one — it puts a specific card in the rules
engine, and the next Special Energy would have to be argued about individually rather than falling
under a rule.

## The principle it bends, stated plainly

`RULINGS.md`'s order says the printed text settles the question first, and where the text is *clear*
the Game Boy game does not get a vote. That is not a technicality here — it is the exact reasoning of
the [Peek ruling](PEEK-CLAIRVOYANCE.md), which **refused** the GBC's wider behaviour because Peek's
text is specific rather than ambiguous. Energy Search's text is specific in the same way.

So this is an **exception, taken knowingly, on step 4 of the order** — Trevor on playability. It is
not a new general principle, and it does not license reading "basic" loosely anywhere else. Trevor's
scope, in his words: *only touch it here for now.* Two cards say "basic Energy card" in a way this
does **not** change:

- **Energy Retrieval** — still basic Energy only, from the discard.
- **Rain Dance and Energy Trans** — still basic, and that has its own ruling.
  See [ENERGY-CARD-MEANS-BASIC.md](ENERGY-CARD-MEANS-BASIC.md), which this entry does not disturb.

**If a later card makes "basic" load-bearing again, that card wins and this stays an exception.** The
test to apply: does the GBC game demonstrably contradict the text for *that* card, and is an archetype
resting on it? Both were true here. Neither is true generally.

## What to watch

**Team Rocket prints three Special Energy cards, and this ruling reaches them.** The GBC game's pool
stops at Fossil, so it cannot tell us anything about them — its precedent covers Double Colorless and
nothing else. That is the known consequence of choosing the general rule over the special case, and it
is recorded here so it is a decision somebody made rather than a surprise somebody finds. **If Energy
Search fetching a Team Rocket Special Energy plays badly, the fix is to narrow this rule, not to
re-open whether the GBC was right about Double Colorless.**

## Built

Three sites in `engine.js`, all previously filtering `kind === 'energy' && cls === 'Basic'`: the two
legality gates and the resolution itself. All three now test `kind === 'energy'` only. The AI needed
no change — it scores `T_ENERGY_SEARCH` as a draw and does not reason about which card comes back.

**The deck this exists for does not currently run Energy Search.** Trevor's Base Set T4 Charizard deck
has one Computer Search and no Energy Search, so this ruling changes nothing about the roster as built
— it makes a deck that *wants* Energy Search possible. See [OPPONENTS.md](../OPPONENTS.md) for why
that deck's access to its own Double Colorless is the open question.

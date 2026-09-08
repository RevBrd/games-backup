# Deckbuild wants — not AI patterns

**Read this if you are filing a `Wants` note and it does not seem to be about a decision the bot
makes in play** — or if the deck autobuilder is ever revived. **It was deferred indefinitely on
29 Aug 2026** (Trevor) to the phase-two bundle with dialogue and art, so the consumer these notes were
parked for does not currently exist and has no scheduled date. *[Both reasons →](../HISTORY.md)*

**They stay parked anyway, and the deferral makes that MORE right rather than less.** A note filed
against `ai.js` is a note sent to a component that cannot obey it; that was true when the builder was
next quarter and it is true now that it is nowhere.

**These are parked on purpose and it is not neglect.** The workbook's `Wants` column carries two kinds
of note with two different consumers. *"To use Agility unless Drill Peck can kill"* is an in-play
decision and belongs to `ai.js`. *"5-ish extra W energy in deck"* is an instruction to whoever builds
the list, and `ai.js` cannot act on it at any weight. **Filing one as the other sends a real
instruction to a component that cannot obey it** — which is worse than not filing it, because it then
reads as satisfied.

## The notes

Verbatim and append-only. From the workbook's `Wants` column.

> **Charizard** — Replace 4x R energy with DCE in deck
> **Blastoise** — 5-ish extra W energy in deck, 2 extra W energy attached
> **Vaporeon** — Two extra W energy attached
> **Lapras** — 2 extra W energy attached, and to use Confuse Ray when smart
> **Nidoqueen** — Many Nidokings on the bench
> **Psyduck** — To play in a Psychic deck if Golduck (from this set) is there too
> **Golduck** — A combined P/W deck, but doesn't need one
> **Surfing Pikachu** — To play in a Water type deck instead of Lightning type
> **Wigglytuff** — Many bench pokemon
> **Moltres (Fossil)** — *"If the autobuilder wants a Moltres, it should take a different variant"*

## Three of these are split notes, and the split is the useful part

**"Extra Energy in the deck" and "extra Energy attached" are different consumers in one sentence.**
Blastoise and Lapras both say both. The *in deck* half is the builder's; the *attached* half is an
in-play claim about over-attaching past the cheapest payable attack — which is the same fault behind
`potential`'s `short` pinning at zero. **When that pattern gets written, those halves move to it** and
this file keeps a pointer, per [PLAYBOOK.md](../PLAYBOOK.md)'s one-note-one-home rule.

**Lapras also carries a third:** *use Confuse Ray when smart* is [attack choice](ATTACK-CHOICE.md).
One cell, three consumers. Expect more like it.

**Wigglytuff and Nidoqueen look like deckbuild and may not be.** *Many bench pokemon* and *many
Nidokings on the bench* describe attacks that scale with a count — Do the Wave and Boyfriends. The
builder should favour a wide bench, but the **bot also has to know its own attack got bigger**, which
is the Bench-as-a-target-set pattern. Left here until that one is written, because guessing wrong in
that direction is the expensive way round.

## A want that is an instruction NOT to pick a card — 7 Sep 2026

**Fossil Moltres is the first entry here that tells the builder to choose something else**, and it is
worth separating from the others because the reason is a judgement about the card rather than about a
deck. Trevor's cell: *"Its main attack is expensive and is a 50/50 chance of landing, making this card
nearly useless."*

Every other row here asks for a deck to be shaped around a card. This one asks for the card to be
passed over in favour of another printing of the same Pokemon. **A builder that only reads rows as
"include X with Y" cannot express it**, so it is flagged now rather than discovered as an unreadable
row later.

**Its in-play half is already built and is NOT parked** — *"to only use Dive Bomb"* is three green
rows in `tools/claims/base3.js`. One cell, two consumers, and only one of them is waiting.

## What the builder should not read this as

**Not a target list.** These are things a human noticed while going through a set, not a spec. The
autobuilder is deferred and its design is unstarted; if it ever starts, this file is input, not
requirements.

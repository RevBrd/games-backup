# Opponent deck research notes — raw, not yet converted

Trevor's ask, 13 Aug: gather candidate opponent-deck material beyond the placeholder GBC1 roster
in `gbc_decks.json`, so there's a real pool to choose from when the ladder's placeholder brackets
get filled in — flavorful named decks preferred over tournament-optimized ones, and looking as far
afield as GitHub if anything labeled "opponent decks" for this era exists. Raw notes as requested,
not a conversion — nothing here is wired into `data/` in a way the game reads yet, except the one
raw source file saved for reference (noted below). Not yet reviewed against actual card IDs.

## 1. Official WotC theme decks — small, authentic, high-confidence

Same category as the existing `decks.json` (Base) and `jungle_decks.json` (Jungle) sources: real
printed two-player decks, not tournament netdecks. Pulled from Bulbapedia's per-deck pages (PokeBeach's
own pages 403'd on fetch — Bulbapedia mirrors the same lists). **Caveat: the fetch tool's own subtotal
headers (e.g. "Pokémon (23 cards)") didn't always match the sum of the list under them — I didn't
trust those headers, only the itemized lines, and even those want a manual recount against Bulbapedia
before anything is typed into JSON.** Treat every count below as unverified until re-checked by hand.

### Fossil (already a live set — bonus per Trevor's "maybe Jungle or Fossil too")

**BodyGuard** (Grass/Fighting) — Bulbapedia: `BodyGuard_(TCG)`
- Pokémon: 1 Muk, 3 Geodude, 2 Graveler, 4 Grimer, 4 Zubat, 2 Golbat, 1 Onix, 2 Bulbasaur, 4 Koffing
- Trainers: 4 Potion, 2 Professor Oak, 1 Pokémon Center, 2 Super Potion
- Energy: 16 Grass, 12 Fighting

**LockDown** (Fire/Water) — Bulbapedia: `LockDown_(TCG)`
- Pokémon: 1 Lapras, 2 Magmar, 4 Horsea, 2 Seadra, 4 Krabby, 2 Kingler, 3 Vulpix, 3 Ponyta
- Trainers: 1 Gambler, 1 Energy Search, 2 Bill, 2 Switch, 2 Potion, 2 Super Potion, 1 Full Heal
- Energy: 14 Fire, 14 Water

### Base Set 2 (`base4` — the natural "next set" chronologically, and it already has a partial,
incomplete workbook: `Base4 Decks.xlsx`. These four might replace or supplement that effort.)

**Grass Chopper** (Fighting/Grass) — Bulbapedia: `Grass_Chopper_(TCG)`
- Pokémon: 1 Clefairy, 2 Nidoran♂, 1 Nidorina, 3 Nidoran♀, 2 Weepinbell, 4 Bellsprout, 4 Sandshrew, 2 Machoke, 4 Machop
- Trainers: 1 Energy Removal, 1 Super Energy Removal, 1 Super Potion, 2 PlusPower, 1 Gust of Wind, 3 Potion
- Energy: 14 Fighting, 14 Grass

**Hot Water** (Fire/Water) — Bulbapedia: `Hot_Water_(TCG)`
- Pokémon: 1 Poliwrath, 1 Dodrio, 3 Doduo, 2 Magmar, 1 Charmeleon, 3 Charmander, 3 Goldeen, 2 Poliwhirl, 4 Poliwag
- Trainers: 1 Pokémon Trader, 2 Energy Retrieval, 3 Potion, 2 Poké Ball, 3 Energy Removal, 1 Gust of Wind
- Energy: 15 Water, 13 Fire

**Lightning Bug** (Lightning/Grass) — Bulbapedia: `Lightning_Bug_(TCG)`
- Pokémon: 1 Chansey, 3 Magnemite, 4 Pikachu, 1 Beedrill, 2 Kakuna, 4 Weedle, 1 Metapod, 4 Caterpie
- Trainers: 1 Pokédex, 1 PlusPower, 2 Defender, 2 Energy Retrieval, 1 Switch, 2 Gust of Wind, 3 Bill
- Energy: 16 Grass, 12 Lightning

**Psych Out** (Psychic/Water) — Bulbapedia: `Psych_Out_(TCG)`
- Pokémon: 1 Wigglytuff, 3 Jigglypuff, 2 Jynx, 2 Drowzee, 1 Kadabra, 3 Abra, 1 Wartortle, 4 Squirtle, 1 Seel, 1 Starmie, 3 Staryu
- Trainers: 1 Computer Search, 1 Super Potion, 1 Potion, 2 Switch, 2 Defender, 3 Gust of Wind
- Energy: 15 Water, 13 Psychic

Note: none of these four hit 60 in my rough add-up either (Grass Chopper adds to 56, for instance) —
almost certainly the fetch missed a line or two of Trainers/Energy padding to round out to 60.
**Don't trust these as complete until pulled again directly off Bulbapedia's table, not through a
summarizer.**

### Team Rocket (`base5` — one set past Base Set 2, still close)

**Devastation** (Grass/Water, Dark Pokémon) — Bulbapedia: `Devastation_(TCG)`
- Pokémon: 1 Dark Weezing, 3 Eevee, 1 Wartortle, 3 Squirtle, 1 Magikarp, 1 Dark Wartortle, 2 Dark Vaporeon, 3 Weedle, 3 Tangela, 3 Oddish (Team Rocket print), 4 Koffing, 1 Dark Gloom
- Trainers: 1 Super Potion, 2 Potion, 1 Imposter Professor Oak's Revenge, 1 Gust of Wind, 1 Full Heal
- Energy: 10 Water, 18 Grass

**Trouble** (Grass/Psychic, Dark Pokémon) — Bulbapedia: `Trouble_(TCG)`
- Pokémon: 1 Dark Arbok, 2 Meowth, 2 Farfetch'd, 2 Weedle, 4 Ekans, 1 Kadabra, 1 Jynx, 1 Haunter, 2 Gastly, 3 Drowzee, 2 Abra (Base Set 2 print), 2 Abra (Team Rocket print), 2 Dark Kadabra
- Trainers: 1 Switch, 2 Potion, 1 Gust of Wind, 1 The Boss's Way, 1 Bill, 1 Full Heal Energy
- Energy: 10 Grass, 18 Psychic

### Gym Heroes / Gym Challenge (`gym1` / `gym2`)

Four decks per set, each themed to a Gym Leader and named for them — the most personality-forward
of any official product, since every Pokémon in the deck is a "Leader's <name>" card and there's a
Trainer for the Leader themself plus a Gym Stadium card. Pulled all eight full lists.

**Gym Heroes**

**Brock** (Fighting) — Bulbapedia: `Brock_(TCG)`
- Pokémon: 1 Rhydon, 2 Sandshrew, 3 Rhyhorn, 4 Onix, 3 Mankey, 3 Geodude, 1 Lickitung, 1 Graveler (all "Brock's ___")
- Trainers: 3 Potion, 2 Energy Retrieval, 2 Brock's Training Method, 1 Full Heal, 2 Switch, 1 Bill, 1 Pewter City Gym
- Energy: 28 Fighting

**Misty** (Water) — Bulbapedia: `Misty_(TCG)`
- Pokémon: 1 Tentacruel, 2 Psyduck, 4 Staryu, 3 Poliwag, 4 Horsea, 2 Tentacool, 3 Goldeen, 2 Starmie, 1 Poliwhirl (all "Misty's ___")
- Trainers: 1 Misty, 2 Potion, 3 Poké Ball, 2 Energy Removal, 1 Cerulean City Gym, 1 Switch
- Energy: 28 Water

**Lt. Surge** (Lightning) — Bulbapedia: `Lt._Surge_(TCG)`
- Pokémon: 1 Magneton, 3 Voltorb, 4 Magnemite, 4 Rattata, 2 Raticate, 4 Spearow, 4 Pikachu (all "Lt. Surge's ___")
- Trainers: 1 Lt. Surge, 1 Vermilion City Gym, 2 Gust of Wind, 2 Secret Mission, 2 Potion, 1 PlusPower, 1 Energy Removal
- Energy: 28 Lightning

**Erika** (Grass) — Bulbapedia: `Erika_(TCG)`
- Pokémon: 1 Vileplume, 4 Tangela, 4 Oddish, 3 Exeggcute, 1 Dratini, 2 Weepinbell, 4 Bellsprout, 2 Gloom, 1 Exeggutor (all "Erika's ___")
- Trainers: 1 Erika, 1 Erika's Perfume, 2 Potion, 2 Poké Ball, 3 Switch, 1 Celadon City Gym
- Energy: 22 Grass, 6 Psychic

**Gym Challenge**

**Sabrina** (Psychic) — Bulbapedia: `Sabrina_(TCG)`
- Pokémon: 1 Alakazam, 3 Porygon, 3 Drowzee, 4 Gastly, 2 Kadabra, 4 Abra, 2 Jynx, 2 Haunter (all "Sabrina's ___")
- Trainers: 1 Sabrina, 2 Bill, 2 Potion, 2 Sabrina's Gaze, 1 Sabrina's Psychic Control, 2 Switch, 1 Saffron City Gym
- Energy: 28 Psychic

**Koga** (Grass/Poison) — Bulbapedia: `Koga_(TCG)`
- Pokémon: 1 Beedrill, 3 Ekans, 3 Pidgey, 2 Weezing, 2 Kakuna, 4 Koffing, 4 Weedle, 3 Grimer (all "Koga's ___")
- Trainers: 1 Koga, 2 Gust of Wind, 3 Potion, 1 Full Heal, 1 Energy Removal, 1 PlusPower, 1 Fuchsia City Gym
- Energy: 28 Grass

**Blaine** (Fire) — Bulbapedia: `Blaine_(TCG)`
- Pokémon: 1 Arcanine, 4 Growlithe (Heroes+Challenge prints), 2 Charmeleon, 2 Doduo, 4 Ponyta, 3 Charmander, 2 Vulpix, 1 Dodrio, 2 Rapidash (all "Blaine's ___")
- Trainers: 1 Blaine, 2 Bill, 2 Fervor, 1 Blaine's Gamble, 2 Potion, 1 Super Potion, 1 Max Revive, 1 Cinnabar City Gym
- Energy: 28 Fire

**Giovanni** (Fighting/Grass) — Bulbapedia: `Giovanni_(TCG)`
- Pokémon: 1 Persian, 3 Nidoran♀, 1 Nidorina, 4 Meowth (2 different prints, 1+3), 4 Nidoran♂, 4 Machop, 2 Nidorino, 2 Machoke (all "Giovanni's ___")
- Trainers: 1 Giovanni, 2 Energy Removal, 2 Warp Point, 2 Potion, 2 Bill, 1 Full Heal, 1 Viridian City Gym
- Energy: 8 Fighting, 20 Grass

Same caveat as Base Set 2/Team Rocket above: these came through the same summarizer, several
subtotals look a card or two short of a clean 60, and every list wants a hand recount against
Bulbapedia before it goes into JSON. But structurally these are the best-fitting official candidates
found all around — a card in a Leader's deck says "Brock's Onix" not "Onix", which is about as
personality-first as printed product gets.

## 2. GBC2 opponent deck guide — the big find

**`Pokémon Card GB2: Here Comes The Great Team Rocket!`** — a Japan-only sequel to the GBC1 game our
existing `gbc_decks.json` is built from. Same engine, same card-collecting structure, roughly 90 named
opponents. Alamedyang's fan guide (2001–2018) documents **every single opponent deck**, extracted
directly from the game's save data with a hex editor — not a fan reconstruction, not a memory-based
writeup. Saved to the repo for reference:

**`data/Deck Lists/GB2 Opponent Deck Guide (Alamedyang, English-patch names).txt`** (5,687 lines,
plain text, English-patch character names). Source: http://alamedyang.tejat.net/tcg2/ — his site's
TLS cert doesn't match its hostname, so it only loaded via a plain HTTP fetch; the content itself
looks legitimate and long-standing (guide's been maintained since 2001).

What's in it, by section:
- **Starter deck** Dr. Mason gives you at the start.
- **GB1 Island** (roughly 90 opponents, sections B through I) — Club Members/Masters, same roster
  shape as our existing GBC1 data. **These use only Base/Jungle/Fossil/Vending-promo cards**, same
  as the western GBC1 game, and several names overlap with `gbc_decks.json`'s existing roster (Mitch,
  Nikki, Rick, Amy, Isaac, Ken, Murray...). **Important: this is a different game (Japan-only GBC2)
  from the western GBC1 our existing data came from** — same character *names* in some cases, but not
  guaranteed to be the same decks. Worth a diff pass, not an assumption of overlap.
- **GB2 Island** (sections J onward, roughly 60 more opponents, including Team Rocket boss fights,
  "GRX" Ronald-equivalent, and joke opponents like Imakuni?) — **these decks use `Rocket`-prefixed
  cards**, confirmed by grep (`x Rocket ` appears 145 times) alongside the usual Base/Jungle/Fossil/
  Vending/Promo prefixes. That means this section is the first source found that has **named,
  non-tournament opponent decks built with Team Rocket set cards** — directly useful once `base5`
  is the set being wired up. No Gym- or Neo-era cards appear anywhere in the file (grepped for both,
  no hits) — GBC2's card pool tops out at Team Rocket.
- Several opponents have **flavor-named deck variants** rather than just a number — e.g. Allison has
  a "Psychic Battle deck", "Poison Mist deck" and "Ultra Removal deck"; Villicchi has "Stop Life!",
  "Scorcher!", "Tsunami Starter!" and "Smash to Minemeat!" decks. That's closer to what Trevor
  described wanting (personality-first, not competition-first) than anything else found this round.

**Not yet done:** picking specific decks out of this file, checking their card counts, or mapping
any of it to our card IDs. It's a big source dropped in raw — next pass would be picking, say, half
a dozen personality-forward decks from the GB2-Island section (the ones with real named strategies)
and doing for them what Job 7 did for the GBC1 roster: verify counts, map ids, note substitutions.

## 3. Checked and set aside

- **`ptcgarchive.com/wotc-decks/base-fossil/`** — 16-17 Base-Fossil era decks, but every one is an
  explicitly competitive/tournament deck (Rain Dance, Haymaker-adjacent, stall variants). This is the
  same category DATA.md already says to avoid for `decks.json` ("three competition-level decks... not
  wanted... would make for a miserable opponent"). Noted for completeness, not recommended.
- **GitHub search** (`sethkarten/tcg`, `bcollazo/deckgym-core`, and similar) — every hit is built
  around **Pokémon TCG Pocket**, the 2024+ mobile game with its own much smaller, non-WotC card pool.
  Nothing found that targets the WotC/vintage era specifically. Didn't find any GitHub repo with
  hand-labeled "opponent decks" for this era — the GBC2 fan guide above is a better source than
  anything on GitHub turned out to be.

## Open questions for Trevor

1. Want me to pull the two remaining Gym Heroes/Gym Challenge full lists now, or hold until Gym is
   actually the set being readied?
2. For the GB2-Island Team Rocket-era decks — want a first pass at picking a handful of the
   flavor-named ones (Allison, Villicchi, etc.) and doing the count/mapping work Job 7 did for the
   GBC1 roster, or is raw-notes-and-file-saved enough for this round?
3. Should `Base4 Decks.xlsx`'s existing (incomplete) Base Set 2 work get thrown out in favor of the
   four official theme decks above, or kept as a separate track?

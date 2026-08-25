# Opponent deck pool — master tracker (quarantined)

**Status: quarantined, per Trevor 13 Aug.** Nothing here is wired into `gbc_decks.json`,
`ladder.json`, or anything the game reads. This is the shared reference for picking real opponents
as sets go live — the intent is for this file to become the actual source list, with rows crossed
off into `data/<set>_decks.json` as each one gets adopted. Companion to
[DECK_RESEARCH_NOTES.md](../backups/deck-research-2026-08-14/DECK_RESEARCH_NOTES.md), which has the
narrative version of where all of this came from — **archived 14 Aug 2026 and superseded by the JSON
files below.** It holds the same lists in prose, un-ID-mapped and with its own counts flagged
unverified, so it is now the less reliable copy. Read it for provenance; never type a card out of it.

**14 Aug — formalized into ready-to-plug JSON.** Every deck marked ✅ in Table 1, plus all 8 of
Table 3's flavor decks, has been ID-mapped against `data/raw/*.json`, count-verified to exactly 60,
and checked for 4-copy-limit violations, following the same `[qty, id, name]` / `subs` shape as
`jungle_decks.json` and `gbc_decks.json`. Still nothing reads these files — same quarantine, just a
form that's actually pluggable now instead of prose:

| File | Contents |
|---|---|
| `data/fossil_decks.json` | BodyGuard, LockDown — both also pass `Engine.prototype.validateDeck` for real, since Fossil is live |
| `data/base4_decks.json` | Grass Chopper, Hot Water, Lightning Bug, Psych Out |
| `data/team_rocket_decks.json` | Devastation, Trouble — **LIVE 25 Aug 2026**, the Team Rocket bracket's T1 intro. No longer quarantined; the row below is stale, kept for provenance |
| `data/gym_decks.json` | All 8 Gym Leader decks |
| `data/gbc2_flavor_decks.json` | The 8 GB2-Island flavor decks — only `allison_psychic_battle` is clean (also engine-validated); the other 7 carry `subs` entries per card needing a real substitution decision, not resolved automatically |

**How to use this:** change a row's Status cell and add a one-line note. Nothing fancier than that —
plain markdown table edits, by hand, by either of us.

**Status legend**

| Mark | Meaning |
|---|---|
| 🆕 | Found, not yet looked at closely |
| 📋 | Cataloged (name/reward known) but card list not pulled |
| ✅ | Full card list pulled and count-verified (adds to 60) |
| 🔧 | Verified, but contains cards needing substitution before it's playable (GBC-exclusive, or from an unreleased set) |
| 🔒 | Assigned — in use somewhere in `data/` |
| ❌ | Looked at and rejected — reason in the note |

---

## Table 1 — Official WotC theme decks

Real printed product, same category as the existing `decks.json`/`jungle_decks.json`. Full lists
(where pulled) are in the archived `DECK_RESEARCH_NOTES.md` §1 — but prefer the JSON files, which are
ID-mapped and count-verified where that file's own counts are not.

| Status | Set | Deck | Note |
|---|---|---|---|
| 🔒 | Base | Brushfire, Overgrowth, Zap!, Blackout | already in `decks.json`, live |
| 🔒 | Jungle | Water Blast, Power Reserve | already in `jungle_decks.json`, live |
| ✅ | Fossil | BodyGuard | Grass/Fighting. Counts unverified against Bulbapedia table directly — pulled via a summarizer, recount before use |
| ✅ | Fossil | LockDown | Fire/Water. Same caveat |
| ✅ | Base Set 2 (`base4`) | Grass Chopper | Fighting/Grass. Same caveat — my rough add-up came up short of 60, recount needed |
| ✅ | Base Set 2 (`base4`) | Hot Water | Fire/Water. Same caveat |
| ✅ | Base Set 2 (`base4`) | Lightning Bug | Grass/Lightning. Same caveat |
| ✅ | Base Set 2 (`base4`) | Psych Out | Water/Psychic. Same caveat |
| 🔒 | Team Rocket (`base5`) | Devastation | Grass/Water, Dark Pokémon. **Live 25 Aug 2026** as the bracket's T1 intro — its `base4` ids were substituted for identical live-set printings first, see DATA.md |
| 🔒 | Team Rocket (`base5`) | Trouble | Grass/Psychic, Dark Pokémon. Same |
| ✅ | Gym Heroes (`gym1`) | Brock (Fighting) | every card is a "Brock's ___" print — most personality-forward official source found. Counts unverified, recount before use |
| ✅ | Gym Heroes (`gym1`) | Misty (Water) | same |
| ✅ | Gym Heroes (`gym1`) | Lt. Surge (Lightning) | same |
| ✅ | Gym Heroes (`gym1`) | Erika (Grass) | same |
| ✅ | Gym Challenge (`gym2`) | Sabrina (Psychic) | same |
| ✅ | Gym Challenge (`gym2`) | Koga (Grass/Poison) | same |
| ✅ | Gym Challenge (`gym2`) | Blaine (Fire) | same |
| ✅ | Gym Challenge (`gym2`) | Giovanni (mixed) | same |

**"✅ but unverified counts" is a real caveat, not boilerplate** — every one of the ten
Bulbapedia-sourced lists above needs a hand recount against the source page before it goes anywhere
near `decks.json`. The GBC2 guide's own lists (Table 3 below) don't have this problem — see there.

## Table 2 — GBC2 "GB1 Island" roster (character-name overlaps with our existing GBC1 data)

~90 opponents in `data/Deck Lists/GB2 Opponent Deck Guide...txt`, lines 314–2175, sections B–I.
**This is a different game from the western GBC1 our `gbc_decks.json` was built from** — Japan-only
sequel, same engine, some of the same character names reused. Not catalogued individually this
round; flagging the block exists and where, since several names (Mitch, Nikki, Rick, Amy, Isaac,
Ken, Murray, Jessica, Britanny...) match existing roster entries and are worth a diff pass before
assuming they're the same deck. Only pull from here if a specific existing placeholder is being
reconsidered — otherwise Table 3 is the more useful pool, since it's new material rather than a
possible re-derivation of what Job 7 already has.

## Table 3 — GBC2 "GB2 Island" roster — the new pool, Team Rocket era

Sections J–T of the same file, lines 2182–4701, roughly 45 opponents. **Every deck in this block
needs `base5` (Team Rocket) live before it's playable at all** — even the ones that read mostly
Base/Jungle/Fossil lean on at least one Rocket-prefixed card, and several lean on cards that were
never printed anywhere (see the 🔧 note below). Not a near-term pool for `base4`; a real one for
whenever Team Rocket is the set going up.

### Fully extracted and count-verified (8 of 45)

The named-strategy decks — picked first because they're the ones that read like actual
personalities rather than a numbered list, which was the brief. All eight total exactly 60 by the
guide's own subtotals, cross-checked by hand. Full lists below; raw source at the cited line number
if the surrounding context (location, unlock rule) is wanted.

**🔧 Every one of these needs card-substitution work before it's playable** — they run a mix of
`Rocket` (base5, not live), `Vending`/`S-Deck`/`B-Deck` (GBC-exclusive promos, no printed
equivalent), and `Gameboy Dark X` (GBC-exclusive "Dark" evolutions that were never printed as TCG
cards at all — not to be confused with printed Dark Pokémon like the Team Rocket set's real Dark
Blastoise). That's the same shape of problem `gbc_decks.json`'s `subs` system already solves for
the GBC1 roster — these would use the same `kind: "placeholder"` / `kind: "mapping"` machinery, not
a new one.

| Status | Character | Deck name | Line | Rule/gimmick | Pokémon (basic) | Trainers | Substitution load |
|---|---|---|---|---|---|---|---|
| 🔧 | Clay | (unnamed) | 4317 | must run 1 each Moltres/Zapdos/Articuno/Dragonite | 20 (12) | 18 | Rocket-only, no Vending/Gameboy cards — the cleanest of the eight |
| 🔧 | Allison | Psychic Battle | 4371 | Resistance −10 instead of −30 | 17 (14) | 21 | No Rocket/Vending at all — pure Base/Jungle/Fossil, just needs `base5` for nothing. **Playable today if the rule variant is dropped.** |
| 🔧 | Allison | Poison Mist | 4417 | Retreat cost +1 | 19 (12) | 19 | Rocket + Vending + S-Deck mix, heaviest substitution load of the eight |
| 🔧 | Allison | Ultra Removal | 4463 | can't retrieve from discard | 17 (8) | 25 | Pure Base/Fossil — **also playable today**, no Rocket cards at all |
| 🔧 | Villicchi | Stop Life! | 4506 | (none noted) | 20 (12) | 22 | B-Deck, Gameboy Dark, Vending, Rocket — heavy |
| 🔧 | Villicchi | Scorcher! | 4554 | (none noted) | 20 (12) | 22 | Rocket, Vending, Gameboy Dark — heavy |
| 🔧 | Villicchi | Tsunami Starter! | 4602 | (none noted) | 18 (12) | 24 | Rocket, Vending, Gameboy Dark — heavy |
| 🔧 | Villicchi | Smash to Mincemeat! | 4654 | (none noted) | 20 (12) | 20 | Rocket, Vending, Gameboy Dark — heavy |

**Correction, 14 Aug:** the claim that Ultra Removal was playable today was wrong. Full ID-resolution
(see `data/gbc2_flavor_decks.json`) turned up 4x Bill's Teleporter in its Trainer line — a real
printed card, but from Neo Genesis, not anything in Base/Jungle/Fossil. **Only Allison's "Psychic
Battle" deck is actually clean** — the one standout find of this pass, fully ID-mapped, resolves
against nothing but base1/base2/base3, and validates clean against the live engine (`ok:true`, 14
Basics). If Trevor wants one placeholder swapped out for something real before Job 8 even starts,
this is the one that's ready today; `data/gbc2_flavor_decks.json` has its exact card list.

**The card lists themselves are in `data/gbc2_flavor_decks.json`, not here.** They used to be
duplicated into this file as prose, copied verbatim from the guide — and that copy was the *less*
reliable one for exactly the reason this file already gives about `DECK_RESEARCH_NOTES.md`: it is
un-ID-mapped, so it cannot be checked against the corpus and cannot be adopted without retyping. The
JSON is ID-mapped, count-verified to 60 and in the same shape as `gbc_decks.json`. Removed 16 Aug
2026. **Read the JSON; the guide's own raw text is still at the cited line numbers above if you want
provenance.**

### Cataloged, not yet pulled (37 of 45)

Name, section id, and reward pack only — enough to spot which ones sound promising for a future
pull. `Rocket R`/`Rocket Grunt` reward packs are GBC2-era rewards (i.e. Team Rocket-adjacent);
`Moltres`/`Omanyte`/`Mr. Mime`/`Pidgeot`/`Bulbasaur` are the original GBC1 pack names carried over,
which usually (not always) means an earlier, more Base/Jungle/Fossil-heavy deck.

| Char | §id | Reward |
|---|---|---|
| Sam | J1 | (Base deck, GB2 intro fight) |
| Aaron | J2–J5 | four numbered "Step" decks + a normal-duel deck — a boss ladder of his own, not individually named |
| Courtney | K1 | — |
| Steve | K2 | — |
| Jack | K3 | Moltres(2) + Omanyte(3) + Mr. Mime(4) |
| Rod | K4 | — |
| GR#1–GR#4, GRX | L1–L5 | Team Rocket grunt fights — GRX is Ronald's GBC2 equivalent, see `_meta` on U2 |
| Melissa | M1 | Rocket R(6) |
| James | M2 | Rocket R(6) |
| Liz | M3 | Rocket R(6) |
| Parker | M4 | Rocket R(6) x2 |
| Peter | N1 | Moltres(2) + Bulbasaur(1) |
| Cassie | N2 | Rocket R(6) |
| Chip | N3 | Rocket R(6) |
| Catherine | N4 | Rocket R(6) x2 |
| Jess | O1 | Omanyte(3) |
| Kara | O2 | Rocket R(6) |
| Ellen | O3 | Rocket R(6) + Rocket Grunt(7) |
| Bernard | O4 | Rocket R(6) + Rocket Grunt(7) |
| Jacob | P1 | Omanyte(3) |
| Cody | P2 | Mr. Mime(4) |
| Alex | P3 | Rocket Grunt(7) |
| Brooke | P4 | Rocket R(6) x2 |
| Grace | Q1 | Pidgeot(5) + Rocket Grunt(7) |
| Tony | Q2 | Mr. Mime(4) + Rocket Grunt(7) |
| Brutus | Q3 | Rocket R(6) + Rocket Grunt(7) |
| Kevin | R1 | Rocket Grunt(7) + Moltres(2) |
| Victoria | R2 | Rocket Grunt(7) + Bulbasaur(1) |
| Clyde | R3 | Rocket R(6) + Moltres(2) |
| Heidi | R4 | Rocket R(6) + Omanyte(3) |
| Claire | R5 | Rocket Grunt(7) x2 |
| Seth | S1 | Moltres(2) x2 |
| Alan | S2 | Mr. Mime(4) x2 |
| Avery | S3 | Omanyte(3) x2 |

Later still (past line 4701, not catalogued at all): Ronald's GBC2 arc (GRX/"Half of the GR Coin"),
then a run of ~15 post-castle opponents (Axel through Mary, §V1–V9), five "chess piece" opponents
(Pawn/Knight/Bishop/Rook/Queen, §W1–W5), and three joke fights (Imakuni?, Red Imakuni?, Mr.
Ishihara, §X1–X3). All still sitting in the raw file, none looked at.

## Table 4 — Neo series official theme decks (names only, catalog for later)

Trevor's ask, 14 Aug: check for intermediate decks past Gym, with low expectations since no GBC-era
game ever reached this far — right, GBC2's card pool tops out at Team Rocket (see Table 3's header
note). But the *official product* pattern (WotC shipping two to four named theme decks per set)
continues well past where any game covers, so there's still something real to catalog even with
zero game-sourced material available. Not pulled — just names, so the shape of what's out there is
known whenever one of these sets is actually being worked toward.

| Status | Set | Deck | Note |
|---|---|---|---|
| 📋 | Neo Genesis (`neo1`) | Cold Fusion (Water/Lightning) | holo Kingdra |
| 📋 | Neo Genesis (`neo1`) | Hotfoot (Grass/Fire) | holo Jumpluff |
| 📋 | Neo Discovery (`neo2`) | Brain Wave (Espeon) | |
| 📋 | Neo Discovery (`neo2`) | Wallop (Hitmontop) | |
| — | Neo Revelation (`neo3`) | none | the only English-language TCG set ever released with **no** theme decks at all |
| 📋 | Neo Destiny (`neo4`) | Dark | |
| 📋 | Neo Destiny (`neo4`) | Light | |

**Not checked at all:** Legendary Collection (`base6`, an all-reprint set — may not have shipped
theme decks, didn't verify) and Southern Islands (`si1`, a small specialty set, same caveat).

## Rejected sources

| Source | Reason |
|---|---|
| `ptcgarchive.com/wotc-decks/base-fossil/` | All competitive tournament decks — the thing DATA.md already says `decks.json` doesn't want |
| GitHub (`sethkarten/tcg`, `bcollazo/deckgym-core`, etc.) | Target Pokémon TCG Pocket (2024+), not the WotC/vintage era — nothing usable found |

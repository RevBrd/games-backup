# Shadowless — card rulings

Every case where the printed card text didn't settle how a card behaves, and what we decided. **This
file is the directory and the method; each ruling is its own file in [`Rulings/`](Rulings/)**, so a
reader opens one door rather than scrolling past eleven decisions they didn't come for. Every entry
carries its reasoning and its source, so a later instance can see *why* rather than re-deriving it —
and can reverse it deliberately if it turns out wrong.

Split into a folder on 15 Aug 2026, Trevor's shape. The entry files hold the original text
**unchanged**; only cross-references between them became links. **The directory below quotes each
entry's own header verbatim — never paraphrase a row.** A hand-written summary drifts from the entry
it describes and the reader who hits it first wins; a copied header cannot, and correcting a ruling
moves its row automatically.

The standing policy this operates under is in `CLAUDE.md`: **when the text is ambiguous, follow the
Game Boy Color game.** It is a single consistent arbiter and it is the version Trevor knows well
enough to settle a call in plain English, so ask him — he can be a resource on conflicting rulings.

## The directory

| Ruling | Entry |
|---|---|
| Buzzap — Electrode (base1-21) | [BUZZAP.md](Rulings/BUZZAP.md) |
| "1 &lt;Type&gt; Energy card" means a basic one | [ENERGY-CARD-MEANS-BASIC.md](Rulings/ENERGY-CARD-MEANS-BASIC.md) |
| Energy Search means basic Energy — the Game Boy game is wrong here | [ENERGY-SEARCH.md](Rulings/ENERGY-SEARCH.md) |
| Mirror Move replays a recorded result, it does not recompute | [MIRROR-MOVE.md](Rulings/MIRROR-MOVE.md) |
| Metronome copies a CHOSEN attack, and cannot copy another Metronome | [METRONOME.md](Rulings/METRONOME.md) |
| Clefairy Doll — in hand it is a Trainer, in play it is a Pokémon | [CLEFAIRY-DOLL.md](Rulings/CLEFAIRY-DOLL.md) |
| Ditto — Transform is a snapshot taken on entry, not a live mirror | [DITTO.md](Rulings/DITTO.md) |
| Aerodactyl beats Muk, and order of arrival decides it | [AERODACTYL-MUK.md](Rulings/AERODACTYL-MUK.md) |
| Peek follows the card; Clairvoyance follows the Game Boy | [PEEK-CLAIRVOYANCE.md](Rulings/PEEK-CLAIRVOYANCE.md) |
| Do the Wave counts a Clefairy Doll; Boyfriends matches on card name | [DO-THE-WAVE-BOYFRIENDS.md](Rulings/DO-THE-WAVE-BOYFRIENDS.md) |
| A retreat cost is paid in SYMBOLS; the discard is whole cards | [RETREAT-COST.md](Rulings/RETREAT-COST.md) |
| A Confused Pokémon flips to retreat, and pays before it flips | [CONFUSED-RETREAT.md](Rulings/CONFUSED-RETREAT.md) |
| Which Energy gets discarded is the player's choice | [ENERGY-DISCARD-CHOICE.md](Rulings/ENERGY-DISCARD-CHOICE.md) |
| Prevented damage waives the recoil, and nothing else | [PREVENTED-DAMAGE-RECOIL.md](Rulings/PREVENTED-DAMAGE-RECOIL.md) |
| "Energy" counts by type; "Energy card" counts by class | [ENERGY-VS-ENERGY-CARD.md](Rulings/ENERGY-VS-ENERGY-CARD.md) |
| An attack that names a group hits every member of it, the attacker included | [MASS-EXPLOSION.md](Rulings/MASS-EXPLOSION.md) |
| "Even to itself" reaches the Confusion penalty | [FRENZY-SELF-DAMAGE.md](Rulings/FRENZY-SELF-DAMAGE.md) |
| A game can be drawn, and a draw pays nothing | [DRAWS.md](Rulings/DRAWS.md) |
| A Pokémon Power is not an attack | [POWER-IS-NOT-AN-ATTACK.md](Rulings/POWER-IS-NOT-AN-ATTACK.md) |
| "When you play this from your hand" means from your hand, and nowhere else | [PLAYED-FROM-HAND.md](Rulings/PLAYED-FROM-HAND.md) |
| "Retreats" is the retreat that worked; "tries to retreat" is the attempt | [RETREATS-MEANS-SUCCEEDED.md](Rulings/RETREATS-MEANS-SUCCEEDED.md) |
| Rainbow Energy is a basic Energy card while it is IN PLAY, and not before | [RAINBOW-IN-PLAY.md](Rulings/RAINBOW-IN-PLAY.md) |
| Rainbow's 10 damage can Knock Out the Pokémon it lands on, and the attachment still happens | [RAINBOW-ATTACH-DAMAGE.md](Rulings/RAINBOW-ATTACH-DAMAGE.md) |
| A promo's name does not decide whether it can evolve — the WotC ruling does | [PROMO-EVOLUTION.md](Rulings/PROMO-EVOLUTION.md) |
| A card that reads the real world gets a fixed stand-in, declared once | [VARIABLE-ATTACK-DAMAGE.md](Rulings/VARIABLE-ATTACK-DAMAGE.md) |
| Chain Reaction answers YOUR evolutions, not the opponent's | [CHAIN-REACTION-ALLIED-ONLY.md](Rulings/CHAIN-REACTION-ALLIED-ONLY.md) |
| Defender blunts an attack's self-harm, and is used up if it spends its whole 20 | [DEFENDER-BLUNTS-SELF-HARM.md](Rulings/DEFENDER-BLUNTS-SELF-HARM.md) |

**The unit is the *call*, not the card.** Four of these are not about a card at all, and two cover a
pair that was one decision — Peek and Clairvoyance share a panel, Do the Wave and Boyfriends were
settled in the same conversation about what an attack counts. Splitting those to satisfy a filename
would break a decision in half. Name a new file for its **subject**.

**Each entry file is append-only and exempt from the 200-line target**, and says so in its own
header. Correct an entry; never condense it. The folder inherited that property from this file when
it split — see [MAINTENANCE.md](MAINTENANCE.md). This directory page is *not* exempt: it is method,
it will be revised, and it should stay short.

Add an entry whenever you make a judgement call. An unlogged one will be re-litigated.

## After Fossil there is no arbiter, and this is what replaces it

**Settled with Trevor 15 Aug 2026, before the first Team Rocket card rather than during it.** The GBC
game holds only Base, Jungle and Fossil, so from Team Rocket onward the policy above simply runs out.
Trevor's position, and it is the right one: **there is no arbiter past this point and it is up to us
case by case**, weighing the real TCG rules, staying true to the GBC's spirit, and aiming at
playability and at rulings that will not contradict each other — because future cards will reuse
these rules or play off them. Taking an extra level of thought or discussion is fine.

The one thing worth adding is structure, because *case by case* across the ~800 remaining cards is
exactly how a tree accumulates contradictions. A single arbiter gave consistency for free; without
one it has to be maintained on purpose. **So work down this order and stop at the first step that
answers:**

1. **The printed text, where it settles the question.** Most cards. This is not a ruling and does not
   belong in this file.
2. **A settled principle below, matched by *shape* rather than by card.** This is the step that
   replaces the arbiter and it is the one that will get skipped. Aerodactyl versus Muk did not settle
   "Aerodactyl beats Muk" — it settled what happens when two continuous effects would each disable
   the other, which Neo will ask again and again.
3. **The WotC Rulings Compendium and period rulings — read, never inferred.** Already the precedent
   here twice, for Buzzap and Ditto. The Buzzap entry is the warning: two of us reasoned our way to
   the opposite answer and the source was explicit all along.
4. **Trevor, on playability.** His tie-break, in his words: prefer the reading that will not
   contradict the others and that a later card can build on.

**A tiebreaker with evidence behind it, for when "the GBC's spirit" needs an operational meaning:
prefer the reading with fewer live dependencies.** Something that resolves once beats something that
must be continuously re-checked. That is not a guess — three independent decisions in this file
already have that shape: Transform is a snapshot rather than the printed live mirror, passive Powers
are *consulted* rather than materialised, and Aerodactyl/Muk resolves at the moment of the attempted
evolution. Each was chosen for its own reasons and they converged.

### Settled principles, and the cards that produced them

Extracted 15 Aug 2026 from the entries, which are unchanged — **this index is a finding aid, not a
summary, and the entry is always the authority.** Add a line when a new ruling generalises.

**Step 2 above is the reason this table exists, and the split made it load-bearing.** Matching a new
card by *shape* means scanning every ruling at once, which is the one job that got harder when the
entries moved behind their own doors. This table is that scan, compressed: read it, then open the one
that matches.

| Principle | From |
|---|---|
| When two continuous effects would each disable the other, **whichever is already in play wins** — the question is asked at the moment of the attempt | [Aerodactyl vs. Muk](Rulings/AERODACTYL-MUK.md) |
| **A snapshot beats a live mirror**, and anything that switches the power off blocks a fresh copy but never reverses one already made | [Ditto](Rulings/DITTO.md) |
| **A flag read at the point of *play*, not baked into the card kind** — so setup and discard-retrieval never consult it, for free | [Clefairy Doll, `playsAs`](Rulings/CLEFAIRY-DOLL.md) |
| **Discards count cards; costs count symbols** — and a retreat is a cost, so a Double Colorless covers two of one. What it cannot do is pay half: an overshoot you cannot avoid is legal, one you chose is not | [retreat cost, Fire Spin](Rulings/RETREAT-COST.md) |
| **Replay a recorded result rather than recomputing it**, and record it as data — never parse the log, which holds prose | [Mirror Move, `lastAttackResult`](Rulings/MIRROR-MOVE.md) |
| **Qualify an Energy by class, not only by type** — "1 Water Energy card" means a basic one | [Rain Dance, Energy Trans](Rulings/ENERGY-CARD-MEANS-BASIC.md) |
| **Ask the player only when the choice is real**; supply a sensible fallback so the AI never has to be asked | [which Energy is discarded](Rulings/ENERGY-DISCARD-CHOICE.md) |
| **Deliberately worthless is not the same as deliberately unscored** — declare it where the work happens | [Peek, Clairvoyance](Rulings/PEEK-CLAIRVOYANCE.md) |
| **Count what the card says, not what the situation implies**, and match on card *name* | [Do the Wave, Boyfriends](Rulings/DO-THE-WAVE-BOYFRIENDS.md) |
| **No unbounded recursion**: an option that could copy itself is simply not offered | [Metronome](Rulings/METRONOME.md) |
| **The card's own wording picks the test**: *Energy* counts by live type, *Energy card* counts by physical class — so Rainbow scales a damage bonus but Rain Dance still cannot move it | [Rainbow Energy, Hydrocannon](Rulings/ENERGY-VS-ENERGY-CARD.md) |
| **A group-naming attack enumerates once and applies to all of it**, both sides and the attacker included, even where that damages one Pokemon twice | [Mass Explosion](Rulings/MASS-EXPLOSION.md) |
| **A damage modifier reaches damage this Pokemon DOES, not damage it TAKES** — including damage the rules make it inflict on itself | [Frenzy, Confusion](Rulings/FRENZY-SELF-DAMAGE.md) |
| **Resolve every consequence before asking who won** — a win condition evaluated mid-resolution answers for whoever the loop reached first | [draws, `checkKOs`](Rulings/DRAWS.md) |
| **A Knock Out is a Knock Out whoever caused it** — your opponent takes the Prize even when you did it to your own Pokémon, with a period WotC Q&A behind it | [Buzzap](Rulings/BUZZAP.md), [Rainbow's attach damage](Rulings/RAINBOW-ATTACH-DAMAGE.md) |
| **A card that says *attack* means an attack** — a Power, Poison, Confusion, a Retaliate and a Mirror Shell all leave the same corpse and none of them counts | [Final Beam, Strikes Back, Mirror Shell](Rulings/POWER-IS-NOT-AN-ATTACK.md) |
| **Point a default at the set that GROWS, and make the small closed set declare itself** — which is why attack-damage defaults to true and played-from-hand defaults to silence | [both](Rulings/POWER-IS-NOT-AN-ATTACK.md) |
| **Hang an invisible rule off a visible one**: a trigger nobody can see rides on the stamp every caller already cannot omit | [`enterPlay`](Rulings/PLAYED-FROM-HAND.md) |
| **When a wording is ambiguous, look for a later card that says the OTHER thing explicitly** — the pair is better evidence than deciding what they probably meant | [Sinkhole vs. Unown [C]](Rulings/RETREATS-MEANS-SUCCEEDED.md) |
| **A card's own text outranks its category**, and a category is exactly what a confident wrong answer is reasoned from — Rainbow is a Special Energy card that is a basic one in one zone, and says so in a parenthesis | [Rainbow, in play](Rulings/RAINBOW-IN-PLAY.md) |
| **The same property can answer differently by ZONE** — in play, in hand, in the deck. A check that takes only a card is asking half a question | [Rainbow, `isBasicEnergyOf`](Rulings/RAINBOW-IN-PLAY.md) |
| **Implement the ruling, not the intent** — a clause printed to stop a *deckbuilding* exploit is not a combat rule, and reading it as one contradicts every other reader of the same property | [Dark Charmeleon's Fire clause](Rulings/RAINBOW-IN-PLAY.md) |
| **Some answers are a lookup and not a principle**, and saying so is the ruling — where a source ruled case by case, no derivable rule exists and an exception list is the honest shape | [promo evolution](Rulings/PROMO-EVOLUTION.md) |
| **A card reading state the game does not model gets a declared constant** — not a new system, and not a deletion of the card's point | [`_____`'s Pikachu](Rulings/VARIABLE-ATTACK-DAMAGE.md) |
| **An unqualified trigger is owner-scoped unless the card says otherwise** — every other trigger in the engine is, and the one exception says "opponent" in its own name | [Chain Reaction](Rulings/CHAIN-REACTION-ALLIED-ONLY.md) |
| **A card's printed qualifier defines its whole scope** — Defender says *after applying Weakness and Resistance*, so the band IS the W/R band and anything skipping W/R skips it. Confusion, Poison and an attachment cost all fall outside for free | [Defender, self-harm](Rulings/DEFENDER-BLUNTS-SELF-HARM.md) |
| **A question that DISSOLVES beats a question answered** — two readings that differ only where the timing cannot reach are one reading, and the implementation takes the one with fewer conditions | [Defender, consumption](Rulings/DEFENDER-BLUNTS-SELF-HARM.md) |

## What *settled with Trevor* means

Since the tree had drifted into reading it wrong. It marks a call that was **discussed and agreed** —
not a directive handed down. Trevor's own words, 15 Aug 2026: he has never said his design calls are
final, and the early entries carrying the mark were recording a conversation, not an instruction. Two
things follow. **The mark is not a lock**: bring new evidence and reopen the entry, exactly as you
would one settled between two instances. And **the mark is still worth writing**, because it says a
human who plays this game agreed with the reasoning, which is information a later pass genuinely
wants. What it does *not* do is transfer authority.

The clearest proof that the mark was never a lock is in the folder already: the
[retreat-cost entry](Rulings/RETREAT-COST.md) was recorded as settled *from the Game Boy game*,
Trevor pushed back on the citation, and the entry now stands on his reasoning instead — corrected by
the person the mark names.

## Pending

Calls we already know are coming, so nobody is surprised by them.

- **~~The arbiter runs out at Fossil~~ — settled 15 Aug 2026**, before the first Team Rocket card
  rather than during it. The replacement is the four-step order above, and the short version is that
  there is no single arbiter and there does not need to be one. Left here so nobody re-opens it as an
  unknown.
- **Baby Pokémon (Neo era, 10 cards)** — the Baby Rule is a coin flip that can negate an attack
  entirely. Not a Base Set problem, but it is a whole rule, not a card effect.
- **~~The promos are Job 12~~ — they were Job 13 and they SHIPPED**, 26–28 Aug 2026, with both of
  their calls already in the folder: [promo evolution](Rulings/PROMO-EVOLUTION.md) and
  [variable attack damage](Rulings/VARIABLE-ATTACK-DAMAGE.md). Left here rather than deleted for the
  observation underneath it, which is still live and still pays: **both came out of Trevor's workbook
  rather than out of the cards.** His spreadsheets accumulate rulings, and a ruling that lives only in
  a spreadsheet gets re-derived by whoever opens the card next. **Read the workbook's Index legend
  before the corpus** on any set job — that instruction was written for a job that has been and gone,
  and it is the general rule that survives it. The other 25 promos are a much later job.
- **~~Rainbow Energy's 10 damage on attachment~~ — settled**, and it was never as open as this list
  said: the damage half was decided with Trevor on 19 Aug 2026 and written into `engine.js`, and the
  Prize half had been answered by [Buzzap](Rulings/BUZZAP.md) two weeks earlier. It sat here because
  Buzzap's principle was in that entry's prose and **not in the index above**, so the identical
  question read as new. *[The entry, and the lesson about the register →](Rulings/RAINBOW-ATTACH-DAMAGE.md)*

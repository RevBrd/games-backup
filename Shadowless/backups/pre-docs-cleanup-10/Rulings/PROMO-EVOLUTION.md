# A promo's name does not decide whether it can evolve — the WotC ruling does

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Recorded 23 Aug 2026, from Trevor's promo research, before Job 12 rather than during it.** It was
sitting in the Index tab of his opponent-deck workbook and nowhere in this tree, which is how a
settled question gets asked again.

> **Per WotC rulings: Cool Porygon *can* evolve** (once Porygon2 is introduced in Neo), **but the
> `[adjective]` Pikachu variants *cannot*.**

## Why it is not obvious, and why the answer is not symmetric

Every card here is a Basic with no `evolvesFrom`, and the corpus records nothing that separates them:

| Card | | May it evolve? |
|---|---|---|
| `basep-15` Cool Porygon | a **prefixed** Porygon | **yes** — Porygon2 evolves from "Porygon" |
| `basep-25` Flying Pikachu | a **prefixed** Pikachu | **no** |
| `basep-28` Surfing Pikachu | a **prefixed** Pikachu | **no** |
| `basep-1`, `-4`, `-26`, `-27` Pikachu | plain, unprefixed | **yes** — ordinary Pikachu |

**Read as a pattern that would be wrong: "a prefixed name is a different Pokémon, so it cannot
evolve."** That rule gets Flying and Surfing Pikachu right and Cool Porygon exactly backwards. There
is no derivable rule here — WotC ruled on these cards individually and the answers do not follow from
anything printed on them.

**So this is a lookup, not a principle**, and that is the point of writing it down. `gen_cards.js`
derives evolution eligibility from the corpus, and the corpus is silent, so **the promo set needs a
hand-authored exception list and there is no guard that can catch a missing entry** — a Pikachu that
wrongly evolves is a legal-looking board that nobody will question.

## What to do when the promos are built

**Put the exception on the card, not in the evolution code.** The engine asks whether a Stage 1's
`evolvesFrom` matches the Basic underneath it; the honest fix is a per-card flag that says *this
printing is not a legal evolution target*, checked in `canEvolve` alongside everything else. That
keeps one rule with a declared exception list rather than a second rule about names.

**And check the list against the era before trusting it.** Three of the four Pikachu affected here
are Base-Set-era promos; Neo prints more, and Gym prints named Pokémon (`Brock's Onix`, and so on)
whose whole line is prefixed and which evolve normally within that line. **A prefixed name means
nothing on its own** — that is the transferable half.

## The related case, settled the same day

`basep-24` is `_____'s Pikachu`, whose Birthday Surprise does 30, or 30 plus a coin-flipped 50 **if
it is your birthday**. *[How that is handled →](VARIABLE-ATTACK-DAMAGE.md)*

# Buzzap — Electrode (base1-21)

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 4 Aug 2026. The opponent takes a Prize.**

Both the GBC game and its sequel omitted this Pokémon Power when implementing the card — so the policy's usual arbiter was silent and this went to the WotC rulings.

Two sources, both explicit and agreeing:

- The **WotC Rulings Compendium** entry for Buzzap: using it gives the opponent a Prize.
- A **period WotC Q&A**: *"Any time a Pokemon of yours is knocked out your opponent gets to draw a
  card - even if you knock it out yourself."*
  ([pojo.com CCQA](https://www.pojo.com/CCQA/QandA/500/1b.htm))

**Two of us guessed the opposite** — Trevor via Gemini, me by inference from "surely nobody prints a
Holo Rare whose signature power costs you a Prize." Both wrong. Buzzap is a genuine sacrifice, and
that's the interesting thing about the card. Don't re-derive this.

The same rulings settle the implementation:

- The Electrode card **itself** becomes the Energy — one Energy card providing **two** Energy of the
  chosen type. The engine already handles one-card-two-symbols for Double Colorless (`provides:
  'CC'`), so this needs a per-instance `provides` override and nothing structural.
- **The Voltorb underneath goes to the discard pile.** Only the Electrode card becomes Energy.
- Because the Electrode stays *in play* as Energy rather than going to the discard, Revive and
  Pokémon Flute can't reach it — with no special-casing — and Energy Removal can, which is right.

Rejected alternative: discard Electrode and conjure a basic Energy in its place. It was the
first instinct and it's close, but it needs a "non-returnable" flag to keep Revive away, gets the
count wrong at one Energy instead of two, and behaves differently under Energy Removal, where one
discard should take both symbols with it. The faithful version is less code, not more.

**Built 5 Aug 2026 and it behaves as described.** The mechanism is an `asEnergy` override set on the
card *instance* — `energyProvides()` consults it before the card definition — so the Electrode is an
Energy card while in play without Electrode-the-card ever changing. Two consequences worth knowing:
a Buzzap'd Electrode is **not a basic Energy card**, so Energy Trans cannot move it and a "discard 1
Fire Energy" cost cannot pay with it, both of which match the rulings; and because it never enters
the discard, Revive and Pokémon Flute cannot reach it with no special-casing at all.

# A retreat cost is paid in CARDS, not Energy symbols

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 12 Aug 2026. Trevor's design call, and deliberately not the official rule.**

The printed TCG rule is that you discard Energy cards whose **total value** meets the retreat cost,
so a Double Colorless — printing two Colorless — covers a cost of 2 on its own. We count the
**physical card**: a Double Colorless discards as one Energy, and a Pokémon with a retreat cost of 2
needs two cards however they print.

**Recorded carefully, because the first version of this entry claimed GBC authority it does not
have.** The supporting memory was Charizard's Fire Spin — "discard 2 Fire Energy cards", where a
Double Colorless made Fire by Energy Burn still only counts as one of the two. That is real, and it
is how this engine has always behaved, but it settles **attack-cost discards**, where counting cards
is uncontroversial and matches the official rule too: the card says *cards*. It does not establish
what the GBC game did for a **retreat**, and neither of us actually knows. So this one stands on
Trevor's reasoning rather than on the arbiter: **it silently balances Double Colorless**, which is
otherwise the strongest Energy card in the format, by making its two symbols cost the same one card
to walk away from. That is a good reason and it does not need a citation propping it up.

The consequences are worth writing down because two of them look like bugs:

- **A Pokémon with retreat 2 and only a Double Colorless attached cannot retreat.** It could before
  12 Aug 2026.
- **A Buzzap'd Electrode pays one toward a retreat**, despite providing `CC`. `powertest.js` asserted
  the opposite until this ruling and the test was rewritten rather than deleted, because the pair of
  tests either side of it is now what states the distinction. *[Buzzap →](BUZZAP.md)*
- **Attack costs are untouched and still read symbols.** A Double Colorless still pays two toward
  `LC`. Only the *discard* counts cards, which is the whole distinction: paying a cost you keep the
  Energy, paying a retreat you lose the card. Fire Spin's "discard 2 Fire Energy cards" was always
  two cards and is unchanged — that clause says *cards* and always meant them.

This also removed a special case rather than adding one. The Energy picker had been reasoning in
symbols and needed bespoke logic to work out whether a Double Colorless beside a basic was a real
choice; with retreat measured in cards, the generic "is there slack, and are the cards different"
test is simply correct.

**The four theme decks re-measured at 75 / 50 / 43 / 32** (Blackout / Zap / Brushfire / Overgrowth)
against 72 / 53 / 42 / 33 before. That is within noise at this sample size and the direction is
right — decks leaning on Double Colorless retreat slightly less freely. Re-run `selftest.js` rather
than trusting the line; see [MEASUREMENT.md](../MEASUREMENT.md).

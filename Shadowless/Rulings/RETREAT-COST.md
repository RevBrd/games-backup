# A retreat cost is paid in SYMBOLS; the discard is whole cards

**Reversed 17 Aug 2026.** This file previously headed *"A retreat cost is paid in CARDS, not
Energy symbols"*, and that ruling — with all of its reasoning — is preserved below exactly as it
was written. The correction is the last section. Read both: the original is still the best account
of the case against the rule now in force.

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

---

## CORRECTED 17 Aug 2026 — reversed, and the reversal is Trevor's too

**Everything above stands as written and is what the project did between 12 and 17 August 2026.**
This section reverses it. The entry keeps both because the reasoning above is still the best account
of the case *against* the current rule, and a later pass deserves to read it rather than rediscover it.

**The rule now: a retreat cost is a COST, and costs count symbols.** A Double Colorless covers two of
it on its own. What is paid in whole **cards** is the *discard* — you cannot spend half a Double
Colorless, so a Colorless retreat paid with one loses the spare symbol entirely.

**Trevor's, and he raised it unprompted while scoping Team Rocket.** In his words, he had conflated
two things that only look alike: an effect that says *"discard 1 Energy card"* — Energy Removal,
Super Potion, Fire Spin — counts the **physical card**, and discarding a Double Colorless there loses
both symbols. That half never moved and is not in question. A retreat is the other kind of quantity:
it is printed as ⚪⚪, which is cost notation, and it is the only entry that was sitting on the wrong
side of a line this tree already draws everywhere else.

**The principle survives the reversal verbatim, which is the strongest argument for it.**
*Discards count cards; costs count symbols* was already the row in
[RULINGS.md](../RULINGS.md)'s index. Retreat was the exception to it. It no longer is.

### Three things found while making the change

**The engine had never stopped saying so.** Two comments written before 12 Aug 2026 survived the
original ruling untouched and describe the behaviour restored here — `energyProvides`' header
("cost matching **and retreat** have to count symbols while discarding whole cards") and the
`takeEnergy` block ("retreat... validates against a symbol total rather than a card count"). Neither
was true for five days and nothing caught it. **A stale comment beside changed code is not noise; it
is the previous author disagreeing with you, and it was right this time.**

**The measurement in the original ruling above could not have been measuring the ruling.** It cites
the four theme decks re-measuring at 75/50/43/32 against 72/53/42/33 as evidence the change was
benign. **None of the four theme decks contains a Double Colorless Energy** — and DCE is the only
multi-symbol Energy in the live pool, so cards and symbols are the same number in every game
`selftest.js` plays. That table was seed noise. It is not a small error: it is a measurement that
*read as supporting evidence* for a ruling it was structurally blind to. The instrument that can see
this is the ladder, where 7 of 18 decks run DCE across 23 copies. Measured there, over 1,848 paired
games on identical seeds: **22.5% of games diverge** between the two rules, retreats rise 2.5%, and
the win rate of the decks actually running DCE moves 53.6% → 53.8% — flat. So the reversal changes a
fifth of all games and advantages nobody, which is what a correctness fix should look like.
*[The seventh way a measurement lies →](../MEASUREMENT.md)*

**A cost that can be overpaid needs a rule about overpaying, and that is where the old tax went.**
Trevor's framing: *"I do also think it's worth the whole card retreat for a ⚪ cost, and maybe that's
where our former tax moves to."* So overpayment is legal but never gratuitous — `doRetreat` refuses
any payment containing a **redundant** card (drop it and the cost is still covered), which permits
the forced waste of a lone Double Colorless on a Colorless retreat and refuses three basics for a
cost of one. The fallback and the player's picker both choose from the same enumerated list of legal
payments, ranked to spend the fewest symbols and then to spare multi-symbol cards.

His own recollection is worth recording, because it is the GBC evidence the original entry said
neither of us had: *"I am starting to remember the GBC days trying to avoid dropping a DCE for only a
single energy retreat."* **That dilemma only exists under this rule.** Under the card-counting one a
Double Colorless pays one toward a retreat exactly like a basic and there is nothing to avoid.

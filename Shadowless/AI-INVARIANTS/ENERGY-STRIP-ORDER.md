# 30 Aug 2026 — a strip is not a payment, and the AI was never choosing at all

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `energyStripOrder`, `energyUids`

---

**`energyStripOrder`, `energyUids`** · Job 14b · Trevor's `Wants` on Energy Removal and Super Energy
Removal, worked as claims.

**The invariant: which Energy a HOSTILE effect takes is the AI's decision, and it is the inverse of
the order a Pokemon pays its own costs in.** `energyPayOrder` answers *"which of mine do I miss
least"*. A strip asks *"which of theirs do they miss most"*. They are different questions and for as
long as both cards have existed only the first one was being asked.

**The AI was not choosing badly. It was not choosing.** `scoreTrainer` set `a.opts.energyIdx = 0` —
the only occurrence of that key anywhere in the project, and one the engine has not read since the
human's Energy picker replaced it. `ui.js` still carries the comment noting the human path moved to
`energyUids`; the AI path was simply left behind. Super Energy Removal set neither `costUids` nor
`energyUids`, so **both** its halves fell through. With no uids, `takeEnergy` reaches
`energyPayOrder` and politely takes whatever the target needed **least**.

**A dead key that looks like a considered choice is worse than no key**, which is the transferable
half of this. `energyIdx: 0` reads as *"take the first one attached"* — a decision somebody made —
and it survived a picker migration, a full Trainer scoring pass on 24 Aug, and every suite in the
repo. Nothing was going to catch it: the card works perfectly for the human, no verb is unscored, and
`selftest.js`'s guard is about verbs rather than about option keys.

**The key priority SWAPS, it does not merely reverse**, and Trevor's note is explicit about the
order: *"DCE should be the first target and its own energy type ... should be the second."* So the
primary key is **how many symbols the card is worth on this slot** and the tiebreaker is **whether
its type is a hard requirement of the target's attacks**. Reversing `energyPayOrder` outright gives
needed-first and gets the Charizard board wrong.

**Read the SLOT, never the card** — the 18 Aug `slotSymbols` invariant, arriving here from the other
side. Under Energy Burn every Energy on a Charizard is Fire, so its Double Colorless is worth two,
which is exactly why 21 Aug reversed the *friendly* order to stop Charizard spending it first. The
same fact makes it the right thing to take away.

**Why it stayed invisible, which is the part worth keeping.** The friendly order and the hostile
order **agree wherever the Double Colorless is surplus** — "what they need least" and "what costs them
most" pick the same card. They diverge only where the Energy is load-bearing, which is the only case
worth spending a card on. A probe that read `a.opts` back would have reported a choice being made;
`board.js`'s new `strips()` plays the card and watches what actually left, which is why it can see
this at all.

| board | took, before | takes, now |
|---|---|---|
| Magmar, 1 Fire + 1 Water (needs R) | Water — the filler | **Fire** |
| Kangaskhan, 1 Water + 1 DCE (every cost Colorless) | Water | **the DCE** |
| Charizard, 3 Fire + 1 DCE (Energy Burn) | Fire | **the DCE** — two symbols, not one |
| Super Energy Removal on that Charizard | two Fire | **the DCE and a Fire** — three symbols, not two |

**And the card is part of the price on Super Energy Removal alone.** Trevor: *"DOES NOT want to be
used on an opponent pokemon with only one energy because then you don't gain an advantage."* At one
Energy you trade your Energy **and** the card for their Energy; the old formula scored that 4.00 and
played it. `- W.drawCard` now applies at every count rather than as a test for one, because a
quantity about how bad a trade is, written as an equality check, is this project's most reliable
sniff test for a wrong curve. **Energy Removal is deliberately NOT charged it** — it costs the card
and nothing else, which is the whole difference between Trevor's two notes.

**Measured, and read the null correctly.** `abtest 8 HEAD`: **12.1% of 17,296 games diverge**, median
first difference at action 43, against a null control on an identical tree that read **0.0%**. Win
rate is 49.0% → 49.1%, which is **not** evidence of nothing — both seats get the fix, so this is the
symmetric case [MISREADINGS.md](../MISREADINGS.md) exists for. The evidence is the divergence and the
five claim rows, all five of which go red against the commit before it.

**Nine rows hold it, four of them controls.** The target half (Active over Bench, and never on a
Pokemon about to be Knocked Out) was already right and must stay so; the self-payment half of Super
Energy Removal correctly uses the **friendly** order and must keep using it. **Do not unify the two
orders** — one card now uses both, in opposite directions, on purpose.

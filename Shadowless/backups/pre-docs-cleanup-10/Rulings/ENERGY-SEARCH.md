# Energy Search means basic Energy — the Game Boy game is wrong here

**Proposed and reversed on 18 Aug 2026, the same day. The reversal is the ruling; the proposal is
kept because the evidence for it is real and somebody will find it again.**

Energy Search reads *"Search your deck for a basic Energy card and put it into your hand."* Double
Colorless is a Special Energy, so the printed text excludes it. **The Game Boy Color game allowed it
anyway** — Trevor remembers being surprised by that as a child — and there it is load-bearing:
Fire Spin costs `RRRR`, Energy Burn turns a Double Colorless into two Fire, and nothing else in the
era can go and *find* one.

So the case for matching the GBC was genuinely strong, and it was built. It stands reversed.

## Why it lost

**Clear printed text beats the arbiter, and this tree had already settled that.** The standing policy
hands *ambiguity* to the Game Boy game. Energy Search is not ambiguous — it says "basic", and "basic"
has a precise meaning in this engine that other cards depend on.

The governing precedent is [PEEK-CLAIRVOYANCE.md](PEEK-CLAIRVOYANCE.md), which **refused** the GBC's
wider behaviour for exactly this reason: Peek's text is specific rather than ambiguous, so the GBC did
not get a vote. Energy Search is the same shape. Adopting it here would have made that ruling look
arbitrary in hindsight — the arbiter overruling text when we like the result and not when we don't.

**The consequence that decided it: Team Rocket prints three Special Energy and the rule would have
reached them.** The GBC pool stops at Fossil, so its precedent covers Double Colorless and nothing
else — every other card the rule touched would have been granted by an arbiter that never ruled on it.

**A note on how this went, because the process matters more than the call.** The objection above was
identified *while implementing* and written into the first version of this file rather than raised
before building. Trevor had explicitly invited the pushback. **A conflict with a settled principle is
a reason to stop and ask, not a caveat to document on the way past.**

## What would reopen it

Not "the GBC did it" — that is already weighed and recorded here. It would take **an archetype that is
dead without it**, demonstrated rather than argued: build the deck, run `tools/decksim.js`, and show
the gap. Base Set's Charizard deck is the obvious candidate and it **does not currently run Energy
Search at all** — it has one Computer Search, which can fetch any card including a Double Colorless.
So the case has not actually been made yet even for the deck it was proposed for.

If it is ever taken, take it **narrowly** — basic Energy plus Double Colorless by name — rather than
as "any Energy card". The general rule is cleaner to write and it is the one that silently swept in
three unreviewed Team Rocket cards.

## What the attempt turned up, which was worth the trip

Reverting it did not work, and that is how a live bug surfaced. **A restricted deck search computed an
`eligible` list and then looked the requested card up in the whole zone**, so `pickUid` was never
checked against eligibility — Energy Search would fetch a **Charizard** if asked by uid. Four sites had
it: `T_POKE_BALL`, `T_ENERGY_SEARCH`, `SEARCH_BASIC_TO_BENCH` and `TRAINER_FROM_DISCARD`.

Three related sites were **correct and were left alone**: Computer Search and Recycle have no
restriction to enforce, and `EVOLVE_SELF_FROM_DECK` already validated its pick — **the fix already
existed in the codebase, applied once.**

Never reachable by clicking, because the UI only offers legal cards. That is exactly why nothing caught
it: **the engine does not get to trust its caller.** Three assertions in `powertest.js` now hold the
line, and the red state was observed directly before the fix.

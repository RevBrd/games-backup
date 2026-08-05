# Æthermoor · Phase 2 — Glim's ending, and whether it persists

Split out of `CLAUDE.md` to keep that file inside the collection's 200-line target. This is the
forward-looking design for the end of the piece. **None of it is built, and nothing in Phase 1 may
assume it.** Read `CLAUDE.md` first — it holds the settled decisions and the register of authored
defects.

Trevor's proposal, 5 Aug 2026. It is the best version anyone has articulated, and it is explicitly
open to replacement.

---

## Why endings are last

The game is large enough that build order is itself a design decision. Endings measure a march
that does not exist yet, and building them early would mean tuning them against a guess.

| Phase | Contents | State |
|---|---|---|
| **Phase 1** | The rites (done), the lesson engine (done), the remaining tutorials, the interconnection decay, the procedural stretch, Glim's arc stages 2–4 | In progress |
| **Phase 2** | Everything in this file | Recorded, deliberately unbuilt, **variable until Phase 1 is playable end to end** |

---

## The proposal

**Glim's fate persists across runs.** Progress still doesn't — the rites are redone in full every
time — but the *outcome* of a completed arc is written once and is there at the next boot. Reach
the end and quit, and the next time the game is opened, that's the guide you get.

**This does not contradict the no-save rule.** What persists is world state, not progress. The
labor is still the price of admission every time. And it sharpens the thesis rather than softening
it: the one permanent consequence the player's labor ever had was not to the game. They didn't
unlock anything, they didn't progress. They broke a person. The only thing they were ever able to
change was the part that was never supposed to be content at all.

**Frame it as damage, never as a save.** A save file implies someone cared enough to keep it, and
Vorthal does not care. What persists is a broken help system staying broken because nobody is
coming to fix it. Never call it a save, never call it progress — not in UI, not in code, not in a
storage key.

**This hands the dead `Continue` button its payoff.** Its tooltip is currently *"No saved legends
found."* The moment anything is written to storage that tooltip becomes a lie, and this collection
has a standing honesty rule about that. So it stays disabled forever, and it starts telling the
truth: there *is* a record, and it isn't yours. Something was saved. It just wasn't you.

That one line does more work than any of the endings it announces.

---

## Determined by attention, never random

If the outcome is a die roll, then the first time any player sees a second one — cleared storage,
another browser, a friend's screen — the endings stop being *what happened to Glim* and become
*which card you drew*. All the weight of permanence comes from it feeling caused.

The intended mapping, legible in hindsight:

| The player | Glim |
|---|---|
| **Paid close attention** — hovered tooltips, read the origins, allocated deliberately | Gets furthest, because someone was finally looking at him. Unravels, and **stays** |
| **Rushed** — dumped points, skipped the reading | **Replaced** by a fresh compliant guide. The sharp one: a player who wasn't looking won't notice the guide changed. The punishment for not looking is that you don't see it |
| **Somewhere in between** | **Simply gone.** Empty dock, no explanation |
| **Thorough, efficient, perfect at everything** | Watches a flawless run and concludes **the system works**. Acceptance, and arguably the bleakest |
| *(fifth candidate)* | Still there, completely fine, and **does not remember.** The Job 1 lines verbatim — which a returning player recognises *as* verbatim. Cheapest to build, since the content already exists, and the worst thing that could happen to him. Uniquely, the player can never be certain it happened: it looks identical to a fresh install |

**The honest cost:** each player sees one ending, ever. Four or five where all but one are
invisible is real expense. It is affordable only if the departure moments stay short and the
aftermath states are data-driven — the aftermath is just which guide config boots. The upside is
social: different people getting different Glims makes this something they compare notes about.

**If Glim disappears, the in-fiction mechanism is still open.** Don't quietly pick one in passing.

---

## What Phase 1 must not preclude

Two hooks, and only two, have to exist before any of this can be built:

- **Attention must be observed from the first screen.** You cannot retroactively determine whether
  someone read the origin cards. `attn` exists in Job 2, records silently, and feeds nothing — that
  is deliberate. It is cheap now and impossible to retrofit honestly later. Surface it through dev
  mode (backtick); do not let gameplay branch on it before Phase 2.
- **The storage decision gates the `Continue` beat.** Settle the key and its framing before
  anything writes storage, because the tooltip's honesty depends on it.

Everything else — which endings exist, how they trigger, what the aftermath looks like — stays
open on purpose.

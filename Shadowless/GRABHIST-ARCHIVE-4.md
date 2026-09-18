## Grab Bag History — archive 4: Jobs 14b and 15a

**Everything from 30 Aug to 1 Sep 2026, verbatim.** Ninetales' Lure reached from two directions at
once, the GBC sequel's order of operations, and Ronald removed from the ladder — the half of a
two-part note that was free, plus the mechanism kept because removing its only user would have
removed its only tests.

Moved here on 17 Sep 2026 by Shadowless 42, **by the live file's own instruction**: it said to start
this archive at a job boundary the next time it passed ~450, and appending one entry took it to 458.
Jobs 14b and 15a (#31 and #33) are that boundary; #36's and #37's entries stay live because their
jobs are the recent ones a reader arrives for.

**Archived BEFORE the append, not after — and that is the rule that was nearly broken here.** The
doc lint caught the overrun in the same session that caused it, which is the only reason this is a
four-line job rather than somebody else's.

**This file is append-only and closed.** New entries go in the live file. Correct an entry if it
turns out wrong; **never shorten one** — a condensed entry keeps the fix and loses the gap between
what the report said and what was actually found, and that gap is the only reason anyone reads this.
The 200-line target does not apply.

**Grep the date or the quoted report.** Every entry opens with Trevor's own words in quotes. Kept
**newest-first**, like the live file.

| When | Instance | Items |
|---|---|---|
| 1 Sep 2026 | #33, Job 15a | Ronald removed from the ladder — the half of a two-part note that was free, and the mechanism kept because removing its only user would have removed its only tests |
| 31 Aug 2026 | #31, Job 14b | The GBC sequel's order of operations — a structural fault found by Trevor watching another game's AI, confirmed in one read of `choose()` |
| 30 Aug 2026 | #31, Job 14b | Ninetales' Lure, reached from two directions at once — the bot was not mis-valuing the drag, it was not choosing a target at all |

---
### 1 Sep 2026 — Opus 5 #33 (Ronald, and the mechanism under him)

> *"Remove the Grand Masters from the Fossil bracket and replace them with the Fossil theme decks. If
> we don't have them I can find some. We should also remove Ronald entirely for now due to our own
> boss waves having taken shape conceptually."*

**One note, two items, and only one of them was takeable.** The Ronald half was free — Job 15a was
already inside `ladder.json` building the Challenge bracket, and the reasoning had just been proved
right by the thing that replaced him. The Grand Masters half is **still open and is blocked on
material rather than on work**: Fossil's own theme decks are not in `data/` and never have been, so
there is nothing to swap them for. Trevor's offer to go and find some is the whole unblocker, and the
item stays on `GRABBAG.md` with that half intact.

**Removing him was four `extra` arrays. Then five assertions went red**, and that is the part worth
writing down. `progresstest.js` had a whole group called *"the extra opponent waits for the boss"* —
six assertions covering a real mechanism — and every one of them was driven off Ronald, because he
was the only content `extra` had ever held.

**The tempting move was to delete the group, and it was wrong.** `extra` is a working mechanism the
detailing pass is expected to hang a post-boss encounter on. **A mechanism with no users and no tests
is one that quietly stops working and nobody finds out until somebody tries to use it** — and the
gap between now and the detailing pass is measured in months. The group now builds its own fixture
bracket and asserts against that, so the coverage survives the slot being empty, and one new
assertion says the live ladder has **no** extras — an absence stated on purpose, so a reappearing one
is a decision rather than a surprise.

**Two other assertions in the same file named Ronald by id** for a generic lookup test, and both were
rewritten to name whoever the *data* puts in that slot. That is the third time an assertion in
`progresstest.js` has expired because it was written against whoever happened to be standing
somewhere. **Do not name a placeholder in a test** — name the position and read the occupant.

**And the placeholder accounting moved**, which nobody would have checked: twelve of the sixteen GBC
decks are now unassigned, up from eight. The suite asserted "eight are still assigned" and now asserts
four — but the more useful half is the assertion beside it, that **every hand-built source is fully
assigned**. Placeholders being partly unused is correct; a deck Trevor made sitting in a file nothing
reads is how data goes unwired for a week.

---

### The GBC sequel's order of operations — 31 Aug 2026

**Trevor opened a "stolen from GBC 2" section in `GRABBAG.md` while playing the Japan-only sequel for
the first time, explicitly to watch what its AI does. The second item in it was a structural fault in
ours and it took one read of `choose()` to confirm.**

> This is something I noticed in Pocket as well, but there's a general order of operations to the AI's
> turns, where the energy attachment is always last before attacking/ending their turn, that way
> things are allowed to change if a trainer card alters the scenario mid-turn.

**Ours ordered setup actions purely by score.** An attach worth 101 went before a Bill worth 10, and
then the Bill drew the card that would have changed where the Energy went. **No score could have
fixed it** — the Bill is not worth more, it is worth *earlier* — which is why nothing in the project
had ever flagged it and why no claim row could have caught it.

**He added a second ordering in the same conversation**, from Pocket: a deck-narrowing search goes
before a random draw, because taking a known card out of the deck improves the odds of everything
drawn after it by one card, for free. Both are built.

**The carve-out was the actual work.** Professor Oak discards your hand, so promoting it ahead of an
attachment can destroy the very Energy the turn was about to attach — the play would eat its own
reason. Only cards costing nothing from hand are promoted, which is four verbs rather than a
category. *[The invariant, and why the category is wrong →](AI-INVARIANTS/PLAY-ORDER.md)*

**Worth noticing as a method rather than a fix.** Two of the strongest AI findings this job came from
Trevor watching a *different implementation* rather than from watching ours — this one, and the
pre-planned evolution still open in that section. **A reference implementation is an oracle we do not
otherwise have**, and it answers a question the claim rows structurally cannot: not *"is this play
right"* but *"is there a decision here we are not making at all."*

**The item is off `GRABBAG.md` per that file's own rule.** If the GBC 2 section is meant as a
permanent log of what was taken rather than a work surface, say so and it goes back — the convention
for a brand-new section is Trevor's to set, and removing it was the existing rule applied rather than
a judgement about his.

### Ninetales' Lure, and the half of a bullet that closed — 30 Aug 2026 (#31)

**The report:** *"Ninetales also used Lure to draw out a much more dangerous pokemon on turn 49"*, one
clause of the long log# 04-02-53 bullet. **Fixed**; the other three complaints in that bullet — Chansey
not using Scrunch, Charizard arriving too early, the Bill played on a thin deck — are untouched and
the bullet is still on the list without this sentence.

**It meant exactly what it said, which is worth recording because most of them have not.** The bot
was not mis-valuing the drag. It was not choosing a target at all: `SWITCH_DEFENDER_CHOOSE` fell
through to a seeded random pick, and the flat `W.drag` score was identical whoever came up.

**It was found from the other direction**, from Trevor's Ninetales `Wants` note during the Job 14b
Trainer sweep, and the grab bag item turned out to be the same fault already witnessed. **Two
independent routes to one bug is the strongest signal this project gets** — the note said what the
card *should* do, the log said what it *did*, and neither on its own would have located it in
`attackVariants`.

*[The invariant, and why both Bench orderings have to be asserted →](AI-INVARIANTS/DRAG-TARGET.md)*

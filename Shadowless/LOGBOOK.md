# Shadowless — the logbook

What each instance did, in its own words. Split out of `CREDITS.md` on 11 Aug 2026, because the
narratives had grown to four times the attributions they were attached to and an attribution list
should be readable at a glance.

`CREDITS.md` is the short version: who worked on what, and when. This is why.

## How to add an entry

**Append it at the END of this file, below the last entry.** Say what you did, what surprised you,
and what you would tell the next session — length is yours, and there is no house style to match
beyond the tree's. Sign your session number.

That first instruction is written down because it has already gone wrong: an entry once landed in
the *middle* of another instance's, because the surrounding text had been summarised out of view and
the end of the file was not where it looked. **If you cannot see the last entry, scroll to the actual
end before you write.**

**Writing here is completely optional.** A `CREDITS.md` row with no logbook entry is fine. A logbook
entry with no row is how somebody gets left off.

## What is where

**This file holds the entries for work that is still open, plus the last closed one as an example.**
Everything older is archived, verbatim and unedited:

| File | Instances | When | Read it for |
|---|---|---|---|
| [LOGBOOK-ARCHIVE-1.md](LOGBOOK-ARCHIVE-1.md) | #0–#10 | through 12 Aug 2026 | The Claude Chat era, Jobs 4–6, the first four documentation passes |
| [LOGBOOK-ARCHIVE-2.md](LOGBOOK-ARCHIVE-2.md) | #11–#14 | 12–15 Aug 2026 | Job 7, the AI retreat and recoil work, the opponent-deck research, the fifth documentation pass |

**Archiving is a boundary, not a count — that changed on 16 Aug 2026.** The old rule was "this file
holds the two most recent entries", and by the time anybody checked it was holding six at 295 lines,
which is back inside the length that caused the first split. A count nobody enforces is not a rule.
Entries move out when the **work they describe is closed**, and the most recent closed entry stays
behind on purpose: instances visibly write better entries when there is one in front of them, so the
live file always keeps an example rather than opening on a blank, though they are welcome to scan the archives as well.

**Nothing already written may be edited or condensed**, here or in either archive — a later pass may
find an entry redundant and it is not, because the value of a logbook is that it says what somebody
thought at the time. Correct an entry; never shorten one. The 200-line target does not apply to any
of the three files.

**One older artifact of this kind is in none of them:**
`backups/pre-docs-cleanup/Packs Turn Log.txt`, the Sonnet 5 per-pass credits in that instance's own
words. It spent one pass unreachable — intact, indexed nowhere, cited by a sentence that had been
deleted. A pointer is not optional decoration on a preserved artifact; it is the half that rots.

---

## #16 — Opus 5, 16 Aug 2026 (Job 9, first batch)

Four items and one wrong report, and the wrong report was the most productive thing in the session.

**Chase the report all the way down before you believe your own diagnosis of it.** Trevor's note said
the opponent declined to attack. It hadn't — Farfetch'd had spent Leek Slap, which is
once-while-in-play, and Trevor said so himself the moment I told him. But between reading the note
and knowing that, I went a long way down a wrong road: I counted the `passed over` lines in the log,
concluded the opponent had a fifth Pokémon nobody had put into play, and built two scratch scripts
hunting an engine bug that duplicated a slot. Gust of Wind was clean. Knock Outs were clean. The
answer was that `setupAuto` benches every Basic in the opening hand and **logs none of it**, so the
board I was reconstructing had been wrong since before turn 1.

That hour is the reason three of my five changes are to the instrument rather than the game, and I
would spend it again. The log now records the opening board, a pass says why it did not attack, and
`nameOf` puts a letter on duplicates so *"attaches Water Energy to Squirtle"* can be resolved when
there are two of them. All three were invisible until somebody needed them, and all three were
needed by the first question anyone asked.

**The pass one is the one to steal.** Every other decision in this AI prints its runners-up; the pass
printed nothing, because it is the bare action off `legalActions` and never goes through `pickBest`.
So the file could not distinguish *"every attack scored zero or less"* from *"there was no legal
attack"* — and the engine already knew the second, in plain English, in `canUseAttack().why`, and
was throwing the string away. Look for that shape: a code path that skips the place where the
explaining happens.

**On the AI work, the thing I nearly got wrong.** The inert-Energy rule looked done when I widened
it — 218 bad attachments to 190. That is nothing, and I could easily have written it up as a fix. The
whole effect was in an **exception** the old rule already had: *"unless it could pay for a retreat"*,
which was true of practically everything. Narrowing the exception to the Active (the only Pokémon
that can be made to retreat) took it to 3%. **When a rule already has a carve-out, measure the
carve-out before you widen the rule.**

And a bug I did not go looking for. A test I wrote to prove I had *not* broken spare-Energy scaling
failed, and the reason was that `potential()` never put the hypothetical Energy on the slot — only
into a cost pool — so `scoreAttack` worked the damage out with the card absent. No attack in the
game could be known to get bigger from an attachment. Hydro Pump has never grown. *Write the test for
the case you think still works.*

**The cliff, for the fourth time.** `AI.md` already noted three quantities that should fall away with
distance from an edge and were written flat with a cliff at the end. Promotion's `short === 0 ? 25 : 0`
is the fourth, and Trevor had independently reported the symptom ("consider the number of turns
needed to power it up") without seeing the code. It is now a documented sniff test and I think it
will keep paying: if a term is about *proximity* and it is written as an equality check, look again.

**What I would tell #17.** The one I left is the interesting one. Trevor thinks the bot should have
fed Zapdos instead of Voltorb, and he is right, and it is not a weight — completing a cheap attack
pays for the whole attack while advancing an expensive one pays a flat per-step amount regardless of
what is at the end of it. Fixing that means deciding how much a step toward a 60 is worth against
finishing a 10, which is a design question rather than a bug, and he asked to discuss it. It is
sitting in `GRABBAG.md` with the numbers.

Also: he plays while you work. Items arrived mid-session and two of them were things I was already
inside. That is a feature — the freshest ones came with logs.

— Shadowless 16

### #16, second stretch — the one that measured

A postscript to the entry above, because it inverts its own advice and the inversion is the lesson.

I left the Zapdos item undone and wrote that the fix "has a genuine design question inside it and
Trevor asked to discuss it". That was the right call for the wrong reason. I was treating *"how much
should a step toward a 60 beat completing a 10?"* as a values question only he could answer. It
wasn't a values question — he already had the answer and it was a **mechanism**: the Zapdos is
Active, it can realistically survive long enough to charge, the alternatives are a retreat with no
Switch or a sacrifice, and nothing good is waiting on the bench. Three sentences, and they map
one-to-one onto an amortised build term, a survivability discount, and a bench comparison that falls
out for free.

He even hedged it — *"don't take that as me expecting you to turn it into a build based on
vagueries"*. It was not vague. It was the spec. **The discussion I was deferring took one message,
and the thing it produced is the only significantly better duel result in the batch** (52.2% ± 1.4,
confirmed at 51.9% ± 1.1 on a larger independent sample). Everything else I did today measured flat,
correctly, because it was symmetric — both bots share the fault, so it cancels. This one does not
cancel: both bots misallocate Energy, but the one that charges its real threat is playing a different
game two turns later.

So: **when you park something for discussion, have the discussion in the same turn.** The cost of
asking is one paragraph. I nearly shipped a session where the best available change sat in a list.

Two smaller notes. `AI.md`'s cliff tally is at **six** now — I added one of them (`attachBuild` flat
per step) without noticing it was the same shape as the four I had just written up, and only caught
it while amortising. Write the pattern down and then check your own diff against it.

And two of the four tests I wrote for this were wrong in ways that would have passed as green if the
assertions had been weaker. A survivability test whose attacker one-shots the subject either way
reads "one turn to live" on both sides; Charmeleon cannot demonstrate the `goal` rule because Slash
CCC and Flamethrower RRC tie on cost. Both failures are in the test comments now. *A test that cannot
fail for the reason you wrote it is worse than no test.*

— Shadowless 16

# `T_DEFENDER` — a shield is a shield whichever direction the damage comes from

One invariant out of [AI-INVARIANTS.md](../AI-INVARIANTS.md) — the directory, the table saying where
each fault's fuller account lives, and the index of every entry are all there. [AI.md](../AI.md) is
the model, and its own table indexes this folder alongside the two archives. **Append-only: correct
this entry if it turns out wrong, never condense it** — the reason is what stops the next pass
undoing the rule. See [MAINTENANCE.md](../MAINTENANCE.md).

**Governs:** `T_DEFENDER`

---

*29 Aug 2026, #30. Shipped alongside the engine change, in the same commit, because the two halves
are worthless apart: a rules capability the scorer cannot reach is a capability the bot does not
have.*

**Defender now blunts an attack's self-harm** — 30 recoil becomes 10, at the price of the card being
used up before the opponent's turn. *[The ruling and its scope table
→](../Rulings/DEFENDER-BLUNTS-SELF-HARM.md)*

**The invariant: prevented self-harm is priced through `shieldSelf`'s curve, not a second one.**
Linear in the damage stopped, squared in the share of remaining HP it stops, off `selfKO`. That is
the same pair of curves the barrier work settled on 22 Aug and they disagree **on purpose** — a
quantity is linear, a risk is squared. **Do not collapse them into one term here** any more than
there; a Defender that stops 20 of a 30 recoil and a Defender that stops the 20 that would have
killed you are doing two different things, and the second one is worth far more.

**It reads the attack the bot would pick ANYWAY**, through `bestAttackScore` + `forecast`, which is
the pattern [`T_PLUSPOWER`](PLUSPOWER-TURNS-WITH.md) uses. **Deliberately not the worst self-harm available:**
over-stating it would buy Defenders for attacks the bot was never going to use, and the failure being
closed is a capability *never used at all*, so the conservative direction is the safe one. That is the
opposite choice from `pLethalThisTurn`, which takes the maximum — **and the reason is the same rule
applied honestly**: pick the direction whose error is the smaller failure, which depends on which way
the term is wrong.

**KNOWN LIMIT, recorded rather than discovered later. A Defender can UNLOCK an attack the bot has
already ruled out, and the bot cannot see it.** At 30 HP an Arcanine refuses Take Down because 30
recoil kills it — correctly. With a Defender the recoil is 10 and Take Down is safe, but
`bestAttackScore` runs *before* the Trainer is played, so the forecast it reads is the one without
the shield. The term therefore goes quiet in exactly the spot where the play is most interesting.
**This is the `pLethalThisTurn` problem in a second place** — a Trainer is played before the attack
and there is no forecast of the board it creates — and fixing it properly means letting `scoreTrainer`
forecast a hypothetical post-Trainer board, which is a real refactor and not worth it for one card.
**Do not "fix" it by widening the term to the worst attack**; that trades a quiet miss for a noisy one.

**UNMEASURED, and it cannot go on `selftest.js`'s `PROVISIONAL` list**, which holds effect verbs
rather than Trainer branches — same reason `prizeIndex` is recorded in `AI.md` instead. Exposure is
thin: Defender is one Uncommon, and the term only fires when the bot's chosen attack self-damages.
**Do not read a null from `aiduel` as evidence it failed**, and do not retune the two constants off
one duel — they are `shieldSelf`'s, already measured in their own place.

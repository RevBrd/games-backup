# Prevented damage waives the recoil, and nothing else

One ruling out of [RULINGS.md](../RULINGS.md) — the directory, the four-step order for making a new
one, and the principles index all live there. **Append-only: correct this entry if it turns out
wrong, never condense it.** See [MAINTENANCE.md](../MAINTENANCE.md).

---

**Settled 16 Aug 2026, with Trevor**, from his playtest note about Arcanine's Take Down into
Chansey's Scrunch.

**When the defender prevents an attack's damage, the attack's recoil does not apply.** Take Down
does 80 and 30 to itself; against a Scrunched Chansey it now does neither.

## This one departs from the printed text, deliberately

Worth stating plainly because the printed text is the first step of the order and it points the
other way. **Scrunch prevents all damage done *to Chansey*. Take Down's 30 is damage Arcanine does
*to itself*.** Read literally those are two different things, only one of which Scrunch mentions, and
that is the reading I argued for.

**Steps two and three both overrode it.** Trevor: it is how the Game Boy game plays it *and* how
Pocket plays it — two independent implementations of the same era agreeing against the literal text.
And his reasoning for why they are right is the part worth keeping, because it generalises:

> It's already benefit enough to the player on the receiving end to be preventing damage, and then
> still adding damage to the opponent seems to swing the needle a little too much for them.

**Reverse the viewpoint.** Preventing the hit is the entire reward for spending a turn on Scrunch.
Handing the preventer a free 30 on top pays them twice for one decision.

## The scope, which is the part most likely to be widened by accident

The note that raised this said *"its recoil or other negative effects"*, which could reach a long way.
Settled at: **damage and defender-side consequences only.**

| | prevented? | why |
|---|---|---|
| The attack's damage | yes | what prevention is for |
| The attack's recoil / self-damage | **yes** | this ruling |
| A defender-side punish — a Power that damages or poisons the attacker | **yes** | it keys on damage having landed |
| Self-inflicted status — Tauros confusing itself on tails | **no** | the attacker's own coin, not anything the defender did |
| Status inflicted on the defender | unchanged | governed by `effectsBlocked`, a separate question |

**Trevor was explicit that he was unsure about Tauros** — about 75% confident Pocket negates it, and
leaning toward the Game Boy game not doing so. It is settled *no* on that lean plus the principle
above, and it is the line most worth revisiting if evidence turns up. A card that explicitly says
otherwise overrules this.

The defender-side row turned out to be **already true, by accident**: `retaliate()` sits inside
`dealDamage`'s damage-landed branch, so a Machamp's Strikes Back never fired on a prevented hit.
It has an assertion now so it stays true rather than staying lucky.

## Where it lives

`runAttack` in `engine.js` has **three** recoil sites — a pending one applied straight after the
damage step, plus `RECOIL` and `RECOIL_ON_FLIP` in the post-damage verb loop — and all three are
gated on the same `stopped` flag. `RECOIL_ON_FLIP` skips its coin entirely rather than rolling one
nobody is bound by, since flips are announced to the player.

**Keyed on the defender having stopped it, not on the damage number coming out zero.** A whiffed coin
flip is the attacker's own bad luck and still pays its recoil. The test is
`res.prevented || (base > 0 && res.dealt === 0)`, so a Defender card reducing 20 to 0 counts as
prevention while a status-only attack with no damage box does not.

`ai.js` prices it at the odds the recoil actually lands (`f.pStopped`) rather than as an on/off
switch, because Transparency is a coin — see the standing note in [AI.md](../AI.md) about quantities
near an edge being written flat.

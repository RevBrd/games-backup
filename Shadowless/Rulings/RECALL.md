# Recall — attacking from the cards underneath, and what a lock names

*Append-only, and exempt from the 200-line target like every entry in this folder. Correct it; never
condense it.*

**Settled 12 Sep 2026, Job 16 (Shadowless 40), with Trevor.** Recall (`gym1-116`), the last card in
Gym Heroes. **Its machinery is built and tested; the card's one-line effect entry is held back on
purpose**, because landing it turns the set live — see *Landing the card* below.

## The card

> For your attack this turn, your Active Pokémon can use any attack from its Basic Pokémon card or any
> Evolution card attached to it. (You still have to pay for that attack's Energy cost.)

No GBC arbiter (Gym Heroes is past Fossil), and the Rulings Compendium could not be read for it — the
site refused the fetch. So everything below is step 2 (the printed shape) and step 4 (Trevor).

## The four calls read off the wording

| Question | Call | Why |
|---|---|---|
| Recall, then Switch — who gets it? | **the new Active** | "your Active Pokémon" for "your attack this turn": read when you attack, not when you play it. The mark lives on the PLAYER (`recallTurn`), not on a Pokémon |
| A Stage 1 skipped by Pokémon Breeder? | **not offered** | "attached to it" — a card never attached is not in the stack |
| Whose attack is it? | **the Pokémon in play** | Weakness, Resistance, self-damage and the log all belong to the attacker. The Metronome split: `card` is the Pokémon, `attack`/`script` are what it uses |
| Playable with nothing underneath? | **yes** | evolving later the same turn puts a card there. Only a second Recall in one turn is refused — it marks what is already marked |

## What a lock names — Trevor's call

Three effects lock a particular attack: Amnesia (`ATTACK_LOCK`), Screaming Headbutt
(`SELF_ATTACK_DISABLED`) and Leek Slap (`ONCE_WHILE_IN_PLAY`). In the live pool **32 evolutions share an
attack name with the card below them** — Wartortle and Squirtle both print Withdraw, Raticate and Rattata
Bite, Dragonite and Dratini Slam.

So: Amnesia locks Wartortle's Withdraw. Can Wartortle Recall Squirtle's Withdraw?

**Yes.** A lock names the printed attack on the card it was put on, and Squirtle's Withdraw is a
different printed attack. Trevor's reasoning was playability in the good sense: it lets cards be
combined to work around a lock without anything getting too strong, and the workaround costs a Trainer
card and only escapes one turn. The one line of the Compendium's Amnesia entry that surfaced in search
points the same way — Amnesia chooses from the attacks present on the opponent's card at the time.

**Confirmed the same day.** Trevor's first answer argued for this reading and then, in its last
sentence, agreed with a lean toward "Locked" — he had taken "Locked" to mean the opposite of what it
said. Asked rather than guessed, and he confirmed: Wartortle can use Squirtle's Withdraw. Worth knowing
if a label like "Locked" ever carries a ruling again: **name the outcome in the example** ("Wartortle can
use it") rather than in a one-word label, because the label is the part that got read backwards.

**A bug came out of asking, and it is wrong under either reading.** Locks were keyed by POSITION
(`e.idx`) alone. Amnesia on Wartortle's Withdraw — its first attack — would also have locked Squirtle's
Bubble, which is Squirtle's first attack. Locks now record `srcId`, the card they were put on, and a lock
written before that field existed means the top card.

## How it is built

**One question, `attackSources(pi)`**, asked by legality, the action list, the AI and the UI: which
cards may the Active attack FROM right now. The top card is always first with `uid: null`; the cards in
its stack follow only while Recall is in effect. `hypothetical` skips the "is Recall in effect" half, for
the AI pricing the card before it is played.

**A recalled attack carries `opts.from`, the uid of the card it is printed on**, because an index alone
names a different attack on a different card. `opts` was chosen over a new top-level field because it
already travels everywhere an action goes: `attackVariants`, the AI's `forecast` and `rawOutcomes`, the
UI's single dispatch line, and the action ESP and Flee replay after a rewind.

**`attackKey(idx, from)`** keeps "once while in play" per printed attack. The top card keeps the bare
index every save already holds.

**Aerodactyl's Prehistoric Memory (`neo3-15`) prints the same shape as a Power**, for both players.
When Neo Destiny arrives it is a second reason inside `attackSources`, not a second mechanism.

## What the bot does

Plays Recall only when the best attack it would open beats the best one already open, scored as the gap
(`PROVISIONAL`). Priced on the Energy attached **now**, so a recalled attack that needs this turn's
attachment first is not seen — the same blind spot PlusPower has.

## Landing the card

Held for Trevor's gym1 roster (Option A, 12 Sep 2026). When it lands, in ONE commit:

1. `'gym1-116': { t: [{ v: 'T_RECALL' }] }` in `src/effects.js`
2. `'T_RECALL'` on `PROVISIONAL` in `tools/selftest.js` — **not before**: the guard refuses a
   provisional verb no card uses, which is why it is not there now
3. drop `gym1` from `REMAINING` in `tools/selftest.js`, which the ratchet will ask for
4. then the go-live checks: `SCREENS.md` (the pickers, and Recall's buttons), `CLAUDE.md` status

The powertest rows inject the entry for the length of each test and leave a real one alone, so they keep
passing on both sides of that commit.

## What generalises

| Principle | Why it is here |
|---|---|
| **A lock or a mark names the CARD it was put on, not a position** — a position stops identifying an attack the moment a second card can offer one | Amnesia at index 0 reached Squirtle's Bubble |
| **A "this turn" effect printed on the player is read when it is USED** — whoever is Active at that moment | Recall, then Switch |

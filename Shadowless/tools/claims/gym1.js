// Gym Heroes claims. Same rules as `base1.js` — read its header first, including
// the note about which opponent to build a board against, and the warning about
// a `sane` that names anything the change introduced.
//
// THIS FILE STARTS FROM A CONVERSATION RATHER THAN FROM THE WORKBOOK, which is
// the only thing unusual about it. Trevor read back a fault report on Sabrina's
// Jynx — "the bot woke a sleeping attacker" — and argued the bot's original
// choice was defensible. He was right about the case he was picturing, and the
// rows below are that argument turned into boards, so it stops being a thing
// either of us has to remember.

const CLAIMS = [
  // ------------------------------------------------------------ Sabrina's Jynx
  // Good Night (P, 10, Asleep) and Good Morning (PC, 20, wakes them) on one card,
  // which makes Jynx the only Pokemon in the era that can choose to undo its own
  // Special Condition for damage.
  //
  // THE WHOLE QUESTION IS HOW BIG THE ATTACK BEING DENIED IS. `W.sleep` is 22 and
  // its comment already says "~50% they stay down", so the coin is in the weight;
  // `turnScale` then scales it by what that turn would have cost us, against
  // AVG_ATTACK of 26. So the crossover sits near one average attack, and both
  // rows below are one side of it.
  {
    id: 'gym1-59', card: "Sabrina's Jynx", pattern: 'Wake-For-Damage',
    note: "Sleep depends on a coin flip between each player's turn, meaning it has to flip twice before the opponent can miss a second turn through sleep. 10 damage now might be worth more than a 25% chance at a missed attack, especially since if it wakes up between its turn and yours (the first coin flip), you can try to put it asleep again if available.",
    claim: 'against a small attack, take the 20 and wake them — the Sleep was not buying much',
    // Machop's Low Kick is 20. Half of one Low Kick is not worth 10 damage, and
    // Trevor's renewal point applies: Good Night is still there next turn.
    board: {
      me:   { card: "Sabrina's Jynx", energy: '2 Psychic' },
      them: { card: 'base1:Machop', energy: '1 Fighting' },
    },
    sane: b => b.them.active.status.asleep !== true && b.affordable().includes('Good Morning'),
    expect: b => {
      b.them.active.status.asleep = true;
      return b.prefers('Good Morning');
    },
  },
  {
    id: 'gym1-59', card: "Sabrina's Jynx", pattern: 'Wake-For-Damage',
    note: "Sleep depends on a coin flip between each player's turn, meaning it has to flip twice before the opponent can miss a second turn through sleep. 10 damage now might be worth more than a 25% chance at a missed attack, especially since if it wakes up between its turn and yours (the first coin flip), you can try to put it asleep again if available.",
    claim: 'THE OTHER SIDE — against something that would Knock Jynx out, leave it asleep',
    // Venusaur on four Grass threatens 60 into a 60 HP Jynx. Half a chance at
    // denying a lethal turn is worth more than 10 damage by a wide margin, and
    // this is the row that the original always-wake behaviour got wrong.
    board: {
      me:   { card: "Sabrina's Jynx", energy: '2 Psychic' },
      them: { card: 'base1:Venusaur', energy: '4 Grass' },
    },
    sane: b => b.ai.incomingThreat(0) >= b.ai.remainingHP(b.me.active),
    expect: b => {
      b.them.active.status.asleep = true;
      return b.prefers('Good Night');
    },
  },
  {
    id: 'gym1-59', card: "Sabrina's Jynx", pattern: 'Wake-For-Damage',
    note: "Sleep depends on a coin flip between each player's turn, meaning it has to flip twice before the opponent can miss a second turn through sleep. 10 damage now might be worth more than a 25% chance at a missed attack, especially since if it wakes up between its turn and yours (the first coin flip), you can try to put it asleep again if available.",
    claim: 'THE CONTROL — with them awake, Good Night is the play against a real threat',
    // Without this row the two above could both pass on a bot that simply liked
    // whichever attack cost more. This one has to go the other way.
    board: {
      me:   { card: "Sabrina's Jynx", energy: '2 Psychic' },
      them: { card: 'base1:Venusaur', energy: '4 Grass' },
    },
    sane: b => b.them.active.status.asleep !== true,
    expect: b => b.prefers('Good Night'),
  },
];

module.exports = { CLAIMS };

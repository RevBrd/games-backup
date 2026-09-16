// Gym Heroes claims. Same rules as `base1.js` — read its header first, including
// the note about which opponent to build a board against, and the warning about
// a `sane` that names anything the change introduced.
//
// THIS FILE STARTS FROM A CONVERSATION RATHER THAN FROM THE WORKBOOK, which is
// the only thing unusual about it. Trevor read back a fault report on Sabrina's
// Jynx — "the bot woke a sleeping attacker" — and argued the original choice was
// defensible; a day later he re-derived the turn order and withdrew the argument,
// and so did I. THE CODE NEVER MOVED EITHER WAY.
//
// The rows survive all of that because they were never really about who was
// right. They pin WHERE THE CROSSOVER SITS — which attack size makes 10 damage
// worth more than half a denied turn — and that is worth holding the bot to
// whatever anybody believed on the way to writing them down.

// Trevor's note on Misty's Poliwhirl, declared once. It carries four clauses and
// seven rows below read it, so repeating it per row the way the Jynx entries do
// would be three thousand characters of duplicate text that a workbook edit then
// has to be applied to in seven places. `wants.js`'s drift check compares this
// string to the live cell, so it must stay VERBATIM.
const NOTE_POLIWHIRL = "Rapids is a 50/50 chance at Energy Denial, and Energy Denial is disproportionately valuable (though still dampened by the coin flip). However, Water Punch calls for Over-Attach with an unlimited cap, but this card's evolution only takes 4 energies max. Therefore, this card should probably be capped at 4 since the benefit of more isn't very good. I don't know which move should be primary. Let the bot sort it out";

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

  // ------------------------------------------------------ Misty's Poliwhirl --
  // THE NOTE THAT PAID FOR THE WHOLE EVENING, and none of what it bought is in
  // the clause anybody would have read first. Trevor's three clauses:
  //
  //   1. "Rapids is a 50/50 chance at Energy Denial, and Energy Denial is
  //      disproportionately valuable (though still dampened by the coin flip)."
  //   2. "Water Punch calls for Over-Attach with an unlimited cap, but this
  //      card's evolution only takes 4 energies max. Therefore this card should
  //      probably be capped at 4."
  //   3. "I don't know which move should be primary. Let the bot sort it out."
  //
  // Clause 3 is the unusual one — every other note in the workbook tells the bot
  // what to do and this one hands it a decision. Working out how to TEST that is
  // what turned up two faults nobody was looking for, and both of them were
  // introduced by Gym Heroes arriving on top of machinery that had been right for
  // every card that existed before it.
  //
  // WHAT THE BOT SAYS TO CLAUSE 3: Water Punch the moment it is payable, Rapids
  // until then, and Rapids on a tie. That is a real answer rather than a shrug,
  // and it is asserted below in both directions.
  {
    id: 'gym1-53', card: "Misty's Poliwhirl", pattern: 'Over-Attach',
    note: NOTE_POLIWHIRL,
    claim: 'the THIRD Water is taken on the Bench — it turns Rapids-for-20 into Water Punch-for-45',
    // THE ROW THAT FOUND THE `base` DROP. `slotPrintedDamage` ASSIGNED rather
    // than added for DMG_PER_ENERGY_HEADS, so Water Punch's printed 30 was thrown
    // away and the benched bot valued it at `5 x waters` — under Rapids' flat 20
    // until the FIFTH Water. The attach curve was 32.00, -2.00, -2.00, 13.50: it
    // refused the Energy worth +25 damage and took the one worth +5.
    //
    // Misty's Poliwhirl is the ONLY printing in fourteen sets whose
    // DMG_PER_ENERGY_HEADS carries a base. Every other one prints "20x", "30x" or
    // "50x", where the parsed number IS the per and overwriting was correct.
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: "Misty's Poliwhirl", energy: '2 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 2 && b.me.hand.length === 1,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Poliwhirl') && e.score > 20),
  },
  {
    id: 'gym1-53', card: "Misty's Poliwhirl", pattern: 'Over-Attach',
    note: NOTE_POLIWHIRL,
    claim: 'THE CONTROL - a FIFTH Water is still taken, but for much less, because it buys 5 damage',
    // Stops the row above being "always feed a Water Pokemon". Past the cost each
    // extra Water is one more coin at 10, so +5 expected and no more — it should
    // stay positive (the cap is Trevor's clause 2 and is NOT built, see the open
    // row below) and it must not be worth anything like the third.
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: "Misty's Poliwhirl", energy: '4 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 4 && b.me.hand.length === 1,
    expect: b => {
      const rows = b.explain().filter(e => e.label === 'attach'
        && (e.detail || '').includes('Poliwhirl'));
      return rows.length > 0 && rows.every(e => e.score > 0 && e.score < 20);
    },
  },
  {
    id: 'gym1-53', card: "Misty's Poliwhirl", pattern: 'Energy denial',
    note: NOTE_POLIWHIRL,
    claim: 'Rapids is worth far more than its damage when the strip turns their attack OFF',
    // Clause 1, and the row that found the second fault. Zapdos on exactly four
    // Lightning has Thunder live and nothing else; take one away and it cannot
    // attack at all. The denial is therefore worth a whole turn of theirs, and
    // the premium over the printed 20 should be large.
    //
    // A DELIBERATELY NON-WEAK TARGET. Charizard makes the arithmetic prettier and
    // is Water-weak, which doubles Water Punch and hides what this row is about.
    board: {
      me:   { card: "Misty's Poliwhirl", energy: '3 Water' },
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],
      them: { card: 'base1:Zapdos', energy: '4 Lightning' },
    },
    sane: b => b.them.active.energy.length === 4 && b.affordable().includes('Rapids'),
    expect: b => b.score('Rapids') - b.damage('Rapids') > 15,
  },
  {
    id: 'gym1-53', card: "Misty's Poliwhirl", pattern: 'Energy denial',
    note: NOTE_POLIWHIRL,
    claim: 'THE CONTROL - and worth almost nothing when they have spares and lose no attack',
    // The row the old bot fails, and the whole of "disproportionately valuable".
    // Two Lightning on a Zapdos powers nothing; taking one costs them a turn of
    // build and no capability. Before 15 Sep 2026 both boards scored the same
    // flat 11, because the term read `you.active.energy.length` as a BOOLEAN —
    // the sniff test this project already names, twenty lines above the worked
    // example of it in the same function.
    board: {
      me:   { card: "Misty's Poliwhirl", energy: '3 Water' },
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],
      them: { card: 'base1:Zapdos', energy: '2 Lightning' },
    },
    sane: b => b.them.active.energy.length === 2 && b.affordable().includes('Rapids'),
    expect: b => b.score('Rapids') - b.damage('Rapids') < 5,
  },
  {
    id: 'gym1-53', card: "Misty's Poliwhirl", pattern: 'Attack choice',
    note: NOTE_POLIWHIRL,
    claim: "clause 3, the bot's answer: Water Punch is primary the moment it is payable",
    board: {
      me:   { card: "Misty's Poliwhirl", energy: '3 Water' },
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
    },
    sane: b => b.affordable().includes('Rapids') && b.affordable().includes('Water Punch'),
    expect: b => b.prefers('Water Punch'),
  },
  {
    id: 'gym1-53', card: "Misty's Poliwhirl", pattern: 'Attack choice',
    note: NOTE_POLIWHIRL,
    claim: 'THE CONTROL - ...and Rapids below that, where Water Punch cannot be paid for',
    // Water Punch is CCC and Rapids is WC, so two Water is the window where the
    // denial attack is the only attack. Without this row the one above passes on
    // a bot that simply likes whichever attack costs more.
    board: {
      me:   { card: "Misty's Poliwhirl", energy: '2 Water' },
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
    },
    sane: b => !b.affordable().includes('Water Punch'),
    expect: b => b.prefers('Rapids'),
  },
  {
    id: 'gym1-53', card: "Misty's Poliwhirl", pattern: 'Over-Attach',
    note: NOTE_POLIWHIRL,
    claim: 'clause 2: the Over-Attach should stop at FOUR, because Misty\'s Poliwrath only takes four',
    open: "The cap Trevor names is not on this card — it is Water Ring's WWCC on the "
        + "EVOLUTION, and OVER-ATTACH.md's standing rule is that the cap comes off the "
        + "card and never off a number somebody picked. So this wants `maxSpare` to be "
        + "readable from the evolution rather than from the printed text, and only WHILE "
        + "THE ROAD IS LIVE: with no Poliwrath coming, the fifth Water is worth a real "
        + "+5 expected damage and capping it would be wrong. `roadLive` already answers "
        + "exactly that question for wall-ness (AI-INVARIANTS/WALL-ROAD-LIVE.md) and "
        + "nothing connects it to the Over-Attach cap. Measured 15 Sep 2026: the attach "
        + "score is FLAT at 13.50 for the 4th, 5th, 6th and 7th Water, so today the bot "
        + "has no opinion about where to stop at all.",
  },
];

module.exports = { CLAIMS };

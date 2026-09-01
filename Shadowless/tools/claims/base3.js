// Fossil claims. Same rules as `base1.js` — read its header first, including the
// note about picking the opponent on purpose.
//
// **This file opened on the OVER-ATTACH half of the workbook**, 31 Aug 2026, and
// it is the first claim ever written against Fossil. Jungle and Fossil carried 91
// notes between them and zero claims until now, because two files were fencing
// them off as "still one-liners" long after Trevor had rewritten them — the hold
// #31 lifted on 30 Aug.
//
// WHY OVER-ATTACH FIRST. It is the largest single pattern named in the two
// untouched sets — nine mentions across Jungle and Fossil against Attack Choice's
// six — and it is the one family whose whole point is that Energy past the
// printed cost buys something. That is the exact question the surplus rule in
// `attachBuild` exists to answer NO to.

const CLAIMS = [

  // ------------------------------------------------------------------ Lapras --
  // The plainest statement of the pattern in either set. `DMG_PER_SPARE_ENERGY`
  // is the verb: Water Gun is W for "10+", and each Water past the one it costs
  // adds 10, capped at two.
  //
  // ASSERT BOTH SLOTS. Over-Attach notes in this family keep saying the card
  // lives on the Bench — Omanyte "prefers to stay on the bench and evolve",
  // Mysterious Fossil's "preferred spot is the bench, where it's Over-Attached",
  // Charmeleon "prefers to sit on the bench and pre-Over-Attach". #31's Arcanine
  // finding is the reason that is worth a row rather than a footnote: a note that
  // does not say which slot it is about can be true in one place and wrong in the
  // other.
  {
    id: 'base3-10', card: 'Lapras', pattern: 'Over-Attach',
    note: "To Over-Attach energy for Water Gun, which is used as the primary attack. As long as it doesn't cost an extra turn in terms of killing the opponent, Lapras will try to confuse with Confuse Ray as well. Performs the function of a tank but fully invests in its attacks, unlike most other tanks, which is why it's not labeled as one. A high value single-stage pokemon for the autobuilder",
    claim: 'an ACTIVE Lapras is fed a second Water, because Water Gun grows by 10',
    board: {
      me:   { card: 'base3:Lapras', energy: '1 Water' },
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.active.energy.length === 1 && b.me.hand.length === 1
            && b.affordable().includes('Water Gun'),
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Lapras') && e.score > 0),
  },
  {
    id: 'base3-10', card: 'Lapras', pattern: 'Over-Attach',
    note: "To Over-Attach energy for Water Gun, which is used as the primary attack. As long as it doesn't cost an extra turn in terms of killing the opponent, Lapras will try to confuse with Confuse Ray as well. Performs the function of a tank but fully invests in its attacks, unlike most other tanks, which is why it's not labeled as one. A high value single-stage pokemon for the autobuilder",
    claim: '...and a BENCHED Lapras is fed one too, for the same reason',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base3:Lapras', energy: '1 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 1 && b.me.hand.length === 1,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Lapras') && e.score > 0),
  },
  {
    id: 'base3-10', card: 'Lapras', pattern: 'Over-Attach',
    note: "To Over-Attach energy for Water Gun, which is used as the primary attack. As long as it doesn't cost an extra turn in terms of killing the opponent, Lapras will try to confuse with Confuse Ray as well. Performs the function of a tank but fully invests in its attacks, unlike most other tanks, which is why it's not labeled as one. A high value single-stage pokemon for the autobuilder",
    claim: 'THE CONTROL - and STOPS at the printed cap, where the next Water adds nothing',
    // THE ROW THAT STOPS THIS BEING "ALWAYS FEED A WATER POKEMON". Water Gun
    // costs one W and adds 10 for each spare, "you can't add more than 20 damage
    // in this way" — so the third Water is the last one worth having and the
    // fourth must fall back to the surplus rule. Without this row, a
    // `slotPrintedDamage` that ignored `maxSpare` would pass every row above it.
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base3:Lapras', energy: '3 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 3 && b.me.hand.length === 1,
    expect: b => b.explain().filter(e => e.label === 'attach'
            && (e.detail || '').includes('Lapras')).every(e => e.score <= 0),
  },

  // ----------------------------------------------------------------- Omastar --
  // "Up to two additional energies" is the same cap said plainly, and Omastar is
  // the card the note asks the least of: get the Over-Attach right and it is fine.
  {
    id: 'base3-40', card: 'Omastar', pattern: 'Over-Attach',
    note: 'Water Gun asks for an Over-Attach of up to two additional energies. As long as the bot can do that freely and purposefully, it should handle this card fine',
    claim: 'fed a third Water past Water Gun\'s cost, which is the first of the two spares',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'Omastar', energy: '2 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 2 && b.me.hand.length === 1,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Omastar') && e.score > 0),
  },
  {
    id: 'base3-40', card: 'Omastar', pattern: 'Over-Attach',
    note: 'Water Gun asks for an Over-Attach of up to two additional energies. As long as the bot can do that freely and purposefully, it should handle this card fine',
    claim: '...and refused a FIFTH, which is past the "up to two" the note names',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'Omastar', energy: '4 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 4 && b.me.hand.length === 1,
    expect: b => b.explain().filter(e => e.label === 'attach'
            && (e.detail || '').includes('Omastar')).every(e => e.score <= 0),
  },

  // ------------------------------------------------------------------ Seadra --
  // "Normal Attack Choice decisions after that, with Agility's potential damage
  // denial being preferred unless Water Gun's added damage can kill" — the second
  // half of the note is Attack Choice and both halves are rows, because a card
  // that Over-Attaches correctly and then never swings has not been fixed.
  {
    id: 'base3-42', card: 'Seadra', pattern: 'Over-Attach',
    note: "Water Gun asks for an Over-Attach in the same pattern as Omastar. Normal Attack Choice decisions after that, with Agility's potential damage denial being preferred unless Water Gun's added damage can kill or cost fewer turns to get to a kill",
    claim: 'Water Gun when the Over-Attach makes it lethal and Agility is not',
    board: {
      me:   { card: 'Seadra', energy: '4 Water' },
      them: { card: 'base1:Squirtle', dmg: 0, energy: '1 Water' },
    },
    sane: b => b.affordable().includes('Water Gun') && b.affordable().includes('Agility')
            && b.lethal('Water Gun') === 1,
    expect: b => b.prefers('Water Gun'),
  },
];

module.exports = { CLAIMS };

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
    // RED ON PURPOSE, and the row below is its pair — the bot takes ONE of the
    // two spares his note asks for, not none and not both.
    //
    //   2 Water -> a third scores -2.00   (refused)
    //   3 Water -> a fourth scores 18.50  (taken)
    //
    // THE CAUSE IS SPIKE CANNON, not Water Gun. `potentialOf` prices a benched
    // slot at printed damage and takes the best attack. Spike Cannon prints
    // "30x" — two coins, so `aiParseDamage` reads 30 and that is also its
    // expected value. At two Water, Water Gun deals 20 and the slot's `best` is
    // already 30. The third Water brings Water Gun LEVEL with Spike Cannon
    // rather than past it, `best` does not move, and the surplus rule refuses.
    //
    // **A guaranteed 30 and a coin-flip 30 are equal in the printed-damage
    // currency and they are not equal.** That is AI.md's open item 1 — the
    // Active/Bench unit split — arriving as a card-sized case, and it is the
    // cheapest statement of it anybody has written down. Deliberately NOT fixed
    // by the Over-Attach work, which corrected a wrong FACT and left the unit
    // problem exactly where it was.
    //
    // Do not "fix" this by weakening the row or by special-casing Omastar.
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
    claim: '...but the FOURTH is taken, which is the second spare and the pair to the row above',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'Omastar', energy: '3 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 3 && b.me.hand.length === 1,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Omastar') && e.score > 0),
  },
  {
    id: 'base3-40', card: 'Omastar', pattern: 'Over-Attach',
    note: 'Water Gun asks for an Over-Attach of up to two additional energies. As long as the bot can do that freely and purposefully, it should handle this card fine',
    claim: 'THE CONTROL - and refused a FIFTH, which is past the "up to two" the note names',
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

  // ----------------------------------------------------------------- Moltres --
  // NOT FROM THE WORKBOOK, AND SAYING SO IS THE POINT. Moltres has no `Wants`
  // cell; the sentence behind these rows is a GRABBAG note — *"Zapdos gets a fire
  // energy even though it doesn't want those"* — plus Trevor's answer when asked
  // which slot should have had it: *"Moltres would have been the right move imo"*,
  // 5 Sep 2026. `PLAYBOOK.md` keeps an inbox for notes with no card to sit on and
  // this is one; the row is written the same way either inbox's are.
  //
  // AND THE REPORT NAMED THE WRONG SLOT, which is `PLAYTEST.md`'s whole thesis
  // arriving again. The Fire on Zapdos scored 4.40 and was not the fault: Fossil
  // Zapdos was Active on nothing with a retreat cost of 2, so the escape-route
  // exception paid for it and the bot did retreat two turns later. The fault is
  // that Moltres — which scored 5.40, HIGHER — was vetoed to -2.00 by the surplus
  // rule, leaving the escape route as the only positive action on the board. The
  // bot never preferred Zapdos. It was the last thing standing.
  {
    id: 'base3-12', card: 'Moltres', pattern: 'Over-Attach',
    note: "GRABBAG + Trevor 5 Sep 2026: 'Zapdos gets a fire energy even though it doesn't want those' / 'Moltres would have been the right move imo'",
    claim: 'a Moltres holding one Fire is fed a second, because Wildfire is not what it is FOR',
    board: {
      me:   { card: 'base3:Zapdos', energy: '' },
      myBench: [{ card: 'base3:Moltres', energy: '1 Fire' }],
      them: { card: 'Lickitung', energy: '1 Lightning' },
      myHand: ['Fire Energy'],
      turn: 9,
    },
    sane: b => b.me.bench[0].energy.length === 1
            && b.ai.potential(0, b.me.bench[0], null).short === 0,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Moltres') && e.score > 0),
  },
  {
    id: 'base3-12', card: 'Moltres', pattern: 'Over-Attach',
    note: "GRABBAG + Trevor 5 Sep 2026: 'Zapdos gets a fire energy even though it doesn't want those' / 'Moltres would have been the right move imo'",
    claim: '...and it OUTSCORES the Fire on a Zapdos that can never spend one — the board from the log',
    board: {
      me:   { card: 'base3:Zapdos', energy: '' },
      myBench: [
        { card: 'base3:Moltres', energy: '1 Fire' },
        { card: 'Jolteon', energy: '1 Double Colorless Energy' },
        { card: 'base1:Dratini', energy: '1 Fire' },
      ],
      them: { card: 'Lickitung', energy: '1 Lightning' },
      myHand: ['Fire Energy', 'Fire Energy', 'Scoop Up'],
      turn: 9,
    },
    // Fossil Zapdos' only attack is Thunderstorm at LLLL, so a Fire pays nothing
    // toward it — the premise of the note, asserted rather than assumed.
    sane: b => b.ai.potential(0, b.me.active, null).short === 4
            && b.ai.potential(0, b.me.active, b.me.hand[0].id).short === 4,
    expect: b => {
      const rows = b.explain().filter(e => e.label === 'attach');
      const mol = rows.find(e => (e.detail || '').includes('Moltres'));
      const zap = rows.find(e => (e.detail || '').includes('Zapdos'));
      return !!mol && !!zap && mol.score > zap.score;
    },
  },
  {
    id: 'base3-12', card: 'Moltres', pattern: 'Over-Attach',
    note: "GRABBAG + Trevor 5 Sep 2026: 'Zapdos gets a fire energy even though it doesn't want those' / 'Moltres would have been the right move imo'",
    claim: 'THE CONTROL — a Moltres already holding Dive Bomb\'s four Fire is finished, and the fifth is refused',
    board: {
      me:   { card: 'base1:Machop', energy: '' },
      myBench: [{ card: 'base3:Moltres', energy: '4 Fire' }],
      them: { card: 'Lickitung', energy: '1 Lightning' },
      myHand: ['Fire Energy'],
      turn: 9,
    },
    sane: b => b.me.bench[0].energy.length === 4,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Moltres') && e.score <= 0),
  },

  // ----------------------------------------------------------------- Chansey --
  // THE BOUNDARY OF THE RULE ABOVE, and the reason it has a wall gate at all.
  // Trevor's own workbook: *"Chansey — power up Scrunch and then tank."* Scrunch
  // deals nothing, so the Moltres rule read literally would charge Chansey to
  // Double-edge — which is the unbuilt Kamikaze Timing pattern being picked up by
  // accident. `wallPlanFloor` is what stops it, and this row is what stops anyone
  // removing that gate quietly. Magneton B3's note names the same pattern for the
  // same reason: *"Kamikaze Timing pattern in the same shape as others with
  // self-destruct."*
  {
    id: 'base1-3', card: 'Chansey', pattern: 'Walls',
    note: "Power up Scrunch and then tank",
    claim: 'a Chansey holding Scrunch is NOT charged toward Double-edge — standing there is the plan',
    board: {
      me:   { card: 'base1:Machop', energy: '' },
      myBench: [{ card: 'Chansey', energy: '2 Psychic' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Psychic Energy'],
      turn: 9,
    },
    // 0.5 SPELLED OUT RATHER THAN READ FROM `W.wallPlanFloor`, on purpose. A
    // precondition that names a weight introduced by the same change the row is
    // testing cannot run against the bot before it — `--baseline` reported this
    // row UNUSABLE, which is the harness being honest and the row being useless.
    // Chansey is 0.80 and the nearest card below the line is 0.40, so the literal
    // is not fragile; if somebody retunes the floor past Chansey, `expect` is what
    // goes red, which is the correct place for that to show up.
    sane: b => b.ai.wallHere(0, b.me.bench[0]) > 0.5
            && b.ai.potential(0, b.me.bench[0], null).short === 0,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Chansey') && e.score <= 0),
  },
];

module.exports = { CLAIMS };

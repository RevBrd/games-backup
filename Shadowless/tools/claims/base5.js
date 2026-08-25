// Team Rocket claims. Same rules as `base1.js` — read its header first, including
// the note about which opponent to build a board against.
//
// **This file opened on the TRAINER half of the workbook**, 24 Aug 2026. When
// Trevor's overhauled workbook landed, 36 of the 219 live notes turned out to be
// Trainers — a category none of the sixteen patterns names, and a different
// function in `ai.js` (`scoreTrainer`) from everything the playbook had touched
// until then. The first Trainer probed found a fault.

const CLAIMS = [

  // ------------------------------------------------------------------ Sleep! --
  // THE FAULT WAS THE CODE PATH, NOT THE CARD. Sleep! scored a flat 11.00 against
  // a healthy target, a target the bot could kill that same turn, and a target
  // already asleep. All three of the refinements that would have caught it were
  // already built, tested and shipped — in `scoreAttack`. None of them reached
  // `scoreTrainer`, and nothing in the project could see that.
  {
    id: 'base5-79', card: 'Sleep!', pattern: 'Attack choice',
    note: "Should not be played against a pokemon that's going to die in the same turn or is already asleep. Other than that, it's a very good thing to play whenever it's received",
    claim: 'played freely against a healthy target that can hurt you back',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'Chansey', energy: '4 Fighting' },
      myHand: ['Sleep!'],
    },
    sane: b => b.playable('Sleep!') && b.threat() > 0 && !b.them.active.status.asleep,
    expect: b => b.wouldPlay('Sleep!'),
  },
  {
    id: 'base5-79', card: 'Sleep!', pattern: 'Attack choice',
    note: "Should not be played against a pokemon that's going to die in the same turn or is already asleep. Other than that, it's a very good thing to play whenever it's received",
    claim: '...but never on something the bot is about to Knock Out this turn',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'base1:Squirtle', dmg: 30 },
      myHand: ['Sleep!'],
    },
    sane: b => b.playable('Sleep!') && b.lethal('Jab') === 1,
    expect: b => !b.wouldPlay('Sleep!'),
  },
  {
    id: 'base5-79', card: 'Sleep!', pattern: 'Attack choice',
    note: "Should not be played against a pokemon that's going to die in the same turn or is already asleep. Other than that, it's a very good thing to play whenever it's received",
    claim: '...and never on something already asleep, where it can add nothing',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'Chansey', energy: '4 Fighting', status: 'asleep' },
      myHand: ['Sleep!'],
    },
    sane: b => b.playable('Sleep!') && b.them.active.status.asleep && b.threat() > 0,
    expect: b => !b.wouldPlay('Sleep!'),
  },
  {
    id: 'base5-79', card: 'Sleep!', pattern: 'Attack choice',
    note: "Should not be played against a pokemon that's going to die in the same turn or is already asleep. Other than that, it's a very good thing to play whenever it's received",
    // NOT in Trevor's note, and included anyway. A bought turn is worth the
    // attack it denies — 22 Aug, for attacks — and leaving it out here would mean
    // the game holds two prices for one idea, which is the exact inconsistency
    // that fault was about. Recorded so the extra clause is visible as a
    // deliberate addition rather than mistaken for something he asked for.
    claim: 'and it is worth nothing against something with no Energy, which has no turn to lose',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'Chansey' },
      myHand: ['Sleep!'],
    },
    sane: b => b.playable('Sleep!') && b.threat() === 0 && !b.them.active.status.asleep,
    expect: b => !b.wouldPlay('Sleep!'),
  },
];

module.exports = { CLAIMS };

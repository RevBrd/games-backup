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

  // ------------------------------------------- Drowzee, Long-Distance Hypnosis --
  // **THE OTHER HALF OF THE SLEEP! JOB, AND IT WAS MISSED FOR A REASON WORTH
  // KEEPING.** Trevor, 6 Sep 2026: *"the original job for that one was to tune
  // them together but due to the pokemon power search issue you found, only
  // Sleep! ended up getting tuned."* The corpus check that was supposed to
  // confirm the card existed printed `c.attacks`, and Long-Distance Hypnosis is
  // a Pokemon Power — so the card was reported absent and the job halved itself.
  //
  // The Power scored a flat **11.00** on all four boards below. Sleep! prices
  // three of them at nothing and has since 2 Sep. Same rules, three code paths,
  // and `statusWorthAgainst` is now the one home.
  //
  // ASSERT THE PAIR ON BOTH HALVES. This Power is the only card in the pool whose
  // downside lands on YOU — tails puts your own Active to sleep — so "should
  // fire" and "should not fire" are genuinely different rules rather than one
  // threshold, and a row for either alone would pass against a bot that always
  // says yes or always says no.
  {
    id: 'base5-54', card: 'Drowzee', pattern: 'Coin Luck',
    note: "Its Pokemon Power is a gamble so it doesn't want to be used as a default. If the player won't be able to attack this turn anyway, that might be a very good time to take the chance. Worth keeping on the bench for that reason. Nightmare along with its 50 HP doesn't make it a bad opener either, but sitting on the bench is where it's most valuable. The card text does not state a limit, so a valid strategy would be to have multiple of these on the bench for multiple chances and putting an opponent to sleep on a turn where you already couldn't attack / GBC 2 / Trevor: 'I think our bot should price this differently, and maybe only use it on turns where its own active pokemon can't attack anyway. Same with the Sleep! trainer card'",
    claim: 'fired when our own Active has nothing to lose and theirs has a turn worth taking',
    board: {
      me:   { card: 'base5:Drowzee', energy: '' },
      them: { card: 'base1:Hitmonchan', energy: '3 Fighting' },
    },
    sane: b => b.threat() > 0 && !b.them.active.status.asleep,
    expect: b => b.explain().some(e => /Hypnosis/i.test(e.detail || '') && e.score > 0),
  },
  {
    id: 'base5-54', card: 'Drowzee', pattern: 'Coin Luck',
    note: "Its Pokemon Power is a gamble so it doesn't want to be used as a default. If the player won't be able to attack this turn anyway, that might be a very good time to take the chance. Worth keeping on the bench for that reason. Nightmare along with its 50 HP doesn't make it a bad opener either, but sitting on the bench is where it's most valuable. The card text does not state a limit, so a valid strategy would be to have multiple of these on the bench for multiple chances and putting an opponent to sleep on a turn where you already couldn't attack / GBC 2 / Trevor: 'maybe only use it on turns where its own active pokemon can't attack anyway'",
    claim: "THE CONTROL — refused while our own Active can attack, which is Trevor's whole clause",
    board: {
      me:   { card: 'base5:Drowzee', energy: '2 Psychic' },
      myBench: [{ card: 'Chansey', energy: '4 Psychic' }],
      them: { card: 'base1:Hitmonchan', energy: '3 Fighting' },
    },
    sane: b => b.affordable().length > 0 && b.threat() > 0,
    expect: b => b.explain().every(e => !/Hypnosis/i.test(e.detail || '') || e.score <= 0),
  },
  {
    id: 'base5-54', card: 'Drowzee', pattern: 'Coin Luck',
    note: "Its Pokemon Power is a gamble so it doesn't want to be used as a default. If the player won't be able to attack this turn anyway, that might be a very good time to take the chance. Worth keeping on the bench for that reason. Nightmare along with its 50 HP doesn't make it a bad opener either, but sitting on the bench is where it's most valuable. The card text does not state a limit, so a valid strategy would be to have multiple of these on the bench for multiple chances and putting an opponent to sleep on a turn where you already couldn't attack / matched to Sleep!, whose note carries the same three riders",
    claim: '...and never on something already asleep, exactly as Sleep! is not',
    board: {
      me:   { card: 'base5:Drowzee', energy: '' },
      them: { card: 'base1:Hitmonchan', energy: '3 Fighting', status: 'asleep' },
    },
    sane: b => b.them.active.status.asleep && b.threat() > 0,
    expect: b => b.explain().every(e => !/Hypnosis/i.test(e.detail || '') || e.score <= 0),
  },
  {
    id: 'base5-54', card: 'Drowzee', pattern: 'Coin Luck',
    note: "Its Pokemon Power is a gamble so it doesn't want to be used as a default. If the player won't be able to attack this turn anyway, that might be a very good time to take the chance. Worth keeping on the bench for that reason. Nightmare along with its 50 HP doesn't make it a bad opener either, but sitting on the bench is where it's most valuable. The card text does not state a limit, so a valid strategy would be to have multiple of these on the bench for multiple chances and putting an opponent to sleep on a turn where you already couldn't attack / matched to Sleep!, whose note carries the same three riders",
    claim: '...and worth nothing against something with no Energy, which has no turn to lose',
    board: {
      me:   { card: 'base5:Drowzee', energy: '' },
      them: { card: 'base1:Hitmonchan', energy: '' },
    },
    sane: b => b.threat() === 0 && !b.them.active.status.asleep,
    expect: b => b.explain().every(e => !/Hypnosis/i.test(e.detail || '') || e.score <= 0),
  },

  // THE MULTI-COPY CLAUSE, AND IT IS A CONFIRMATION RATHER THAN A FAULT — 7 Sep
  // 2026, from the rewritten cell note. Trevor reasoned it out from the card text
  // rather than from the code: *"The card text does not state a limit, so a valid
  // strategy would be to have multiple of these on the bench for multiple chances
  // and putting an opponent to sleep on a turn where you already couldn't attack."*
  //
  // He is right, and the engine already agrees: `powerSpent` is tracked PER SLOT,
  // not per player or per card name, so two Drowzees are two flips. Measured — two
  // legal `power` actions, both scored 8.46, on a board where the Active can still
  // attack for 20 and therefore correctly does neither.
  //
  // THE ROW EXISTS BECAUSE THE BEHAVIOUR IS EASY TO BREAK AND NOTHING ELSE WATCHES
  // IT. Any future "don't offer the same Power twice" de-duplication — by kind, by
  // card id, by name — would silently halve this and every suite would stay green.
  // Per PLAYBOOK.md: mark a satisfied claim, do not delete it; the next person to
  // touch power enumeration needs to know what it was protecting.
  {
    id: 'base5-54', card: 'base5:Drowzee', pattern: 'Coin Luck',
    note: "Its Pokemon Power is a gamble so it doesn't want to be used as a default. If the player won't be able to attack this turn anyway, that might be a very good time to take the chance. Worth keeping on the bench for that reason. Nightmare along with its 50 HP doesn't make it a bad opener either, but sitting on the bench is where it's most valuable. The card text does not state a limit, so a valid strategy would be to have multiple of these on the bench for multiple chances and putting an opponent to sleep on a turn where you already couldn't attack",
    claim: 'two Drowzees on the bench offer TWO flips — the card states no limit and neither does the engine',
    board: {
      me:   { card: 'base1:Machop', energy: '1 Fighting' },
      myBench: [{ card: 'base5:Drowzee', energy: '' }, { card: 'base5:Drowzee', energy: '' }],
      them: { card: 'base1:Hitmonchan', energy: '3 Fighting' },
      turn: 9,
    },
    sane: b => b.me.bench.length === 2,
    expect: b => b.E.legalActions(0).filter(a => a.t === 'power').length === 2
            && b.explain().filter(e => /Hypnosis/i.test(e.detail || '')).length === 2,
  },
];

module.exports = { CLAIMS };

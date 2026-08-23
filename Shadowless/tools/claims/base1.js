// Base Set claims — Trevor's notes turned into boards the bot can be held to.
//
// READ `PLAYBOOK.md` FIRST. This file is downstream of the `Wants` column in the
// newest workbook in `data/v1 Opp Decks/`, which is the inbox and the only one.
// `node tools/wants.js base1 --todo` says what has no claim yet.
//
// ONE NOTE IS SEVERAL CLAIMS, and `id` is what joins them back to the cell they
// came from. Do not collapse a note into one row because it is one sentence in
// the workbook — Zapdos below is three, and the note is quoted whole on each so
// the clause a row is NOT covering stays visible.
//
// EVERY ROW NEEDS A `sane`. It is the fixture assertion and it is not optional:
// it states what the board must be for the claim to mean anything. The reason is
// written into `powertest.js` at CHANSEY_ARMED — two tests there used a bare
// Chansey to mean "cannot be killed", which quietly also meant "cannot threaten"
// once a bought turn started reading the opponent's threat, and the board stopped
// being able to distinguish the two answers it was asserting between. A claim
// that cannot fail is worse than no claim.
//
// SAY WHAT SHOULD HAPPEN, NOT WHAT THE NUMBER IS. `PLAYBOOK.md`'s rule, and
// `powertest.js` paid for it once: a test pinned a barrier at exactly 16 and had
// to be rewritten the next day by the person changing the constant, who is the
// one person least able to notice they broke the idea.

const CLAIMS = [

  // ---------------------------------------------------------------- Dewgong --
  // The card that started the attack-choice cluster. Both halves of the rule are
  // asserted; the one-sided version passes for a bot that has simply stopped
  // valuing damage.
  {
    id: 'base1-25', card: 'Dewgong', pattern: 'Attack choice',
    note: 'Classic Attack Choice between Aurora Beam and Ice Beam. Punches above its weight and doesn\'t retreat',
    claim: 'Aurora Beam against a target that cannot hurt it — there is no turn worth buying',
    board: {
      me:   { card: 'Dewgong', energy: '4 Water' },
      them: { card: 'Chansey' },
    },
    sane: b => b.threat() === 0 && b.lethal('Aurora Beam') === 0,
    expect: b => b.prefers('Aurora Beam'),
  },
  {
    id: 'base1-25', card: 'Dewgong', pattern: 'Attack choice',
    note: 'Classic Attack Choice between Aurora Beam and Ice Beam. Punches above its weight and doesn\'t retreat',
    claim: 'Ice Beam when Aurora Beam cannot kill and there IS something to be afraid of',
    board: {
      me:   { card: 'Dewgong', energy: '4 Water' },
      them: { card: 'Electabuzz', energy: '3 Lightning' },
    },
    sane: b => b.threat() > 60 && b.lethal('Aurora Beam') === 0,
    expect: b => b.prefers('Ice Beam'),
  },
  {
    id: 'base1-25', card: 'Dewgong', pattern: 'Attack choice',
    note: 'Classic Attack Choice between Aurora Beam and Ice Beam. Punches above its weight and doesn\'t retreat',
    claim: 'lethal beats afraid — the gate in the rule is that Aurora Beam cannot kill',
    board: {
      me:   { card: 'Dewgong', energy: '4 Water' },
      them: { card: 'Chansey', dmg: 90, energy: '4 Fighting' },
    },
    sane: b => b.lethal('Aurora Beam') === 1 && b.threat() > 0,
    expect: b => b.prefers('Aurora Beam'),
  },
  {
    id: 'base1-25', card: 'Dewgong', pattern: 'Walls',
    note: 'Classic Attack Choice between Aurora Beam and Ice Beam. Punches above its weight and doesn\'t retreat',
    claim: "doesn't retreat — it attacks rather than leaving, even at a retreat cost it can pay",
    board: {
      me:   { card: 'Dewgong', energy: '4 Water', dmg: 40 },
      them: { card: 'Electabuzz', energy: '3 Lightning' },
      myBench: [{ card: 'Chansey', energy: '2 Fighting' }],
    },
    sane: b => b.me.bench.length > 0 && b.me.active.energy.length >= b.card(b.me.active).retreat,
    expect: b => !b.does('retreat'),
  },

  // --------------------------------------------------------------- Gyarados --
  // Not from Gyarados' own note — its `Wants` is a deckbuild want (keep Magikarp
  // safe). This is the rider fault found on 22 Aug, filed here because Gyarados
  // is the board that exposed it. The pattern is Attack choice; the note that
  // generalises it is Dewgong's.
  {
    id: 'base1-6', card: 'Gyarados', pattern: 'Attack choice',
    note: '(no note of its own — this is the rider rule, found on this board 22 Aug 2026)',
    claim: 'paralysing a Pokemon the attack Knocks Out is worth nothing, so the cheaper lethal wins',
    board: {
      me:   { card: 'Gyarados', energy: '4 Water' },
      them: { card: 'base1:Squirtle', dmg: 30 },
    },
    sane: b => b.lethal('Dragon Rage') === 1 && b.lethal('Bubblebeam') === 1,
    expect: b => b.score('Bubblebeam') <= b.score('Dragon Rage'),
  },
  {
    id: 'base1-6', card: 'Gyarados', pattern: 'Attack choice',
    note: '(no note of its own — this is the rider rule, found on this board 22 Aug 2026)',
    claim: '...but the rider is full price when they survive AND can hurt you',
    board: {
      me:   { card: 'Gyarados', energy: '4 Water' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.threat() > 0 && b.lethal('Dragon Rage') === 0 && b.lethal('Bubblebeam') === 0,
    expect: b => b.score('Bubblebeam') > b.score('Dragon Rage'),
  },

  // ----------------------------------------------------------------- Zapdos --
  // Three claims out of one note, and the third is the one no single board can
  // reach. Recorded as a row with no assertion rather than left out — see the
  // `open` field, which `claimtest.js` reports separately and never passes.
  {
    id: 'base1-16', card: 'Zapdos', pattern: 'Attack choice',
    note: 'To deal high damage and die rather quickly. Prefers to go down fighting over retreat, though not by self-kill. Thunder is the preferred attack until Zapdos looks like it will die on the opponent\'s next turn, or it risks a self-kill on this turn. In those cases, Thunderbolt should be used.',
    claim: 'Thunder is the default while Zapdos is healthy and nothing is about to kill it',
    board: {
      me:   { card: 'base1:Zapdos', energy: '4 Lightning' },
      them: { card: 'Chansey' },
    },
    sane: b => b.threat() < b.hp() && b.affordable().includes('Thunderbolt'),
    expect: b => b.prefers('Thunder'),
  },
  {
    id: 'base1-16', card: 'Zapdos', pattern: 'Walls',
    note: 'To deal high damage and die rather quickly. Prefers to go down fighting over retreat, though not by self-kill. Thunder is the preferred attack until Zapdos looks like it will die on the opponent\'s next turn, or it risks a self-kill on this turn. In those cases, Thunderbolt should be used.',
    claim: 'goes down fighting rather than retreating when something can kill it',
    board: {
      me:   { card: 'base1:Zapdos', energy: '4 Lightning', dmg: 70 },
      them: { card: 'Dugtrio', energy: '4 Fighting' },
      myBench: [{ card: 'Chansey', energy: '2 Fighting' }],
    },
    sane: b => b.threat() >= b.hp() && b.me.bench.length > 0,
    expect: b => !b.does('retreat'),
  },
  {
    id: 'base1-16', card: 'Zapdos', pattern: 'Attack choice',
    note: 'To deal high damage and die rather quickly. Prefers to go down fighting over retreat, though not by self-kill. Thunder is the preferred attack until Zapdos looks like it will die on the opponent\'s next turn, or it risks a self-kill on this turn. In those cases, Thunderbolt should be used.',
    claim: 'Thunderbolt instead when Zapdos will die next turn anyway — the discard costs nothing it will get to use',
    open: 'Needs the bot to price its OWN death next turn against an Energy cost it will never pay. `survivesCharge` knows the survival half and nothing spends against it. Not a board problem — the term does not exist.',
  },

  // ---------------------------------------------------------------- Arcanine --
  {
    id: 'base1-23', card: 'Arcanine', pattern: 'Energy funnel',
    note: 'Both attacks do high damage and both have drawbacks. Flamethrower requires an energy funnel but should be the default due to Take Down\'s self-damage. However, Take Down should stay powered up and ready to go for when it\'s needed, meaning the bot should not want to use even Flamethrower until Arcanine has four energies attached, as it requires that constant funnel that would make Take Down unavailable if used at three energies',
    claim: 'Flamethrower over Take Down at four Energy — the self-damage is the tiebreaker',
    board: {
      me:   { card: 'Arcanine', energy: '4 Fire' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.affordable().includes('Flamethrower') && b.affordable().includes('Take Down')
            && b.lethal('Take Down') === 0,
    expect: b => b.prefers('Flamethrower'),
  },
  {
    id: 'base1-23', card: 'Arcanine', pattern: 'Energy funnel',
    note: 'Both attacks do high damage and both have drawbacks. Flamethrower requires an energy funnel but should be the default due to Take Down\'s self-damage. However, Take Down should stay powered up and ready to go for when it\'s needed, meaning the bot should not want to use even Flamethrower until Arcanine has four energies attached, as it requires that constant funnel that would make Take Down unavailable if used at three energies',
    claim: 'at THREE Energy it should hold Flamethrower, because using it drops Take Down out of reach',
    open: 'The clause is clear and the term is not there: nothing prices an attack by what it takes AWAY from the same Pokemon next turn. Related to Ammo\'s open half. Ask before building — this may want to be one rule with Charmeleon and Ninetales.',
  },
];

module.exports = { CLAIMS };

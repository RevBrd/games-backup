// Jungle claims. Same rules as `base1.js` — read its header first, including the
// note about picking the opponent on purpose.
//
// **The first claim ever written against Jungle**, 31 Aug 2026, opening on the
// OVER-ATTACH pattern for the reason in `base3.js`'s header: it is the largest
// family named in the two sets that had never been claimed against.

const CLAIMS = [

  // ---------------------------------------------------------------- Vaporeon --
  // Three clauses in one sentence and all three are rows. The note names Water
  // Gun as primary and gives Quick Attack exactly two jobs, which is an Attack
  // Choice claim sitting on top of an Over-Attach one — assert both, because a
  // card that Over-Attaches correctly and then swings with the wrong attack has
  // not been fixed.
  {
    id: 'base2-12', card: 'Vaporeon', pattern: 'Over-Attach',
    note: 'Water Gun asks to Over-Attach two extra energies for extra damage, and should be seen as the primary attack. Quick Attack has two use cases: When Water Gun can\'t be afforded, and when Vaporeon is played in a non-water deck. The latter is viable because Quick Attack only requires Colorless energy, meaning it can be used in any deck if the user is okay never having access to Water Gun. Does well in multi-type decks with other Eevee-lutions.',
    claim: 'Water Gun is the primary attack once it is affordable',
    board: {
      me:   { card: 'base2:Vaporeon', energy: '3 Water' },
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
    },
    sane: b => b.affordable().includes('Water Gun') && b.affordable().includes('Quick Attack')
            && b.lethal('Water Gun') === 0,
    expect: b => b.prefers('Water Gun'),
  },
  {
    id: 'base2-12', card: 'Vaporeon', pattern: 'Over-Attach',
    note: 'Water Gun asks to Over-Attach two extra energies for extra damage, and should be seen as the primary attack. Quick Attack has two use cases: When Water Gun can\'t be afforded, and when Vaporeon is played in a non-water deck. The latter is viable because Quick Attack only requires Colorless energy, meaning it can be used in any deck if the user is okay never having access to Water Gun. Does well in multi-type decks with other Eevee-lutions.',
    claim: '...and Quick Attack the moment it cannot be - the first of the two use cases',
    // Quick Attack is CC and Water Gun is WWC, so a Vaporeon holding nothing but
    // Fighting Energy can pay for one and not the other. That is the note's
    // "played in a non-water deck" case as well as its "can't be afforded" one.
    board: {
      me:   { card: 'base2:Vaporeon', energy: '2 Fighting' },
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
    },
    sane: b => b.affordable().includes('Quick Attack') && !b.affordable().includes('Water Gun'),
    expect: b => b.prefers('Quick Attack'),
  },
  {
    id: 'base2-12', card: 'Vaporeon', pattern: 'Over-Attach',
    note: 'Water Gun asks to Over-Attach two extra energies for extra damage, and should be seen as the primary attack. Quick Attack has two use cases: When Water Gun can\'t be afforded, and when Vaporeon is played in a non-water deck. The latter is viable because Quick Attack only requires Colorless energy, meaning it can be used in any deck if the user is okay never having access to Water Gun. Does well in multi-type decks with other Eevee-lutions.',
    claim: 'the "two extra energies" are taken on the BENCH, where Vaporeon is built',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base2:Vaporeon', energy: '3 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 3 && b.me.hand.length === 1,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Vaporeon') && e.score > 0),
  },
  {
    id: 'base2-12', card: 'Vaporeon', pattern: 'Over-Attach',
    note: 'Water Gun asks to Over-Attach two extra energies for extra damage, and should be seen as the primary attack. Quick Attack has two use cases: When Water Gun can\'t be afforded, and when Vaporeon is played in a non-water deck. The latter is viable because Quick Attack only requires Colorless energy, meaning it can be used in any deck if the user is okay never having access to Water Gun. Does well in multi-type decks with other Eevee-lutions.',
    claim: 'THE CONTROL - "two extra" means two, and the sixth Water is refused',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base2:Vaporeon', energy: '5 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 5 && b.me.hand.length === 1,
    expect: b => b.explain().filter(e => e.label === 'attach'
            && (e.detail || '').includes('Vaporeon')).every(e => e.score <= 0),
  },

  // --------------------------------------------------------------- Exeggutor --
  // THE UNCAPPED MEMBER OF THE FAMILY, and the reason it is worth its own rows:
  // every other Over-Attach card stops at two spares because the card says so.
  // Big Eggsplosion is a coin per Energy attached with no cap at all, so "as many
  // energies as it can" is literal — and the surplus rule has nothing to stop it
  // with. If the pattern were built as a fixed allowance rather than derived from
  // the verb, this card is where that would show.
  {
    id: 'base2-35', card: 'Exeggutor', pattern: 'Over-Attach',
    note: "To Over-Attach for Big Eggsplosion by as many energies as it can (unless about to die and the bot weighs a bench powerup's future benefit higher than an additional coin flip for Big Eggsplosion). It wants to be used in a Grass OR Psychic deck, and Teleport can't be used at all in a pure-grass one (but it shouldn't be avoided in grass decks for that reason). Teleport is rarely beneficial, as it's usually better to try for high damage with Big Eggsplosion even if it risks death on the next turn. Teleport becomes a benefit when Big Eggsplosion's damage potential isn't very high, as long as you weren't planning to use Exeggutor as a staller",
    claim: 'fed well past Big Eggsplosion\'s single Colorless, because every Energy is another coin',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'Exeggutor', energy: '4 Grass' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Grass Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 4 && b.me.hand.length === 1,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Exeggutor') && e.score > 0),
  },
  {
    id: 'base2-35', card: 'Exeggutor', pattern: 'Over-Attach',
    note: "To Over-Attach for Big Eggsplosion by as many energies as it can (unless about to die and the bot weighs a bench powerup's future benefit higher than an additional coin flip for Big Eggsplosion). It wants to be used in a Grass OR Psychic deck, and Teleport can't be used at all in a pure-grass one (but it shouldn't be avoided in grass decks for that reason). Teleport is rarely beneficial, as it's usually better to try for high damage with Big Eggsplosion even if it risks death on the next turn. Teleport becomes a benefit when Big Eggsplosion's damage potential isn't very high, as long as you weren't planning to use Exeggutor as a staller",
    claim: 'Big Eggsplosion over Teleport once the pile is big enough to hurt',
    board: {
      me:   { card: 'Exeggutor', energy: '4 Psychic' },
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base1:Kakuna' }],
    },
    sane: b => b.affordable().includes('Big Eggsplosion') && b.affordable().includes('Teleport'),
    expect: b => b.prefers('Big Eggsplosion'),
  },
];

module.exports = { CLAIMS };

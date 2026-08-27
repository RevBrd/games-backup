// Promo claims — Trevor's notes turned into boards the bot can be held to.
//
// READ `PLAYBOOK.md` FIRST, and `tools/claims/base1.js`'s header for the rules
// every row here follows: one note is several claims, every row needs a `sane`,
// say what should happen rather than what the number is, and pick the opponent
// on purpose.
//
// THREE OF THESE BOARDS WERE BUILT WRONG THE FIRST TIME, in exactly the way that
// header warns about, so it is worth restating with the specific trap: Jigglypuff,
// Pikachu and Cool Porygon are all WEAK TO FIGHTING, and the header's own
// recommended "ordinary" opponent is a Hitmonchan holding three Fighting Energy.
// That doubles to a threat of 80 against a 50 HP Basic — every one of those rows
// silently became "...while about to die", which is a different claim. They run on
// a Lightning attacker now. CHECK THE WEAKNESS AGAINST THE OPPONENT YOU PICK.
//
// `node tools/wants.js basep` prints the notes these come from. THE PROMOS ARE NOT
// A LIVE SET and never will be — `basep` carries `booster: false` — so wants.js
// counts them as "filed early". That is a report about the LADDER and not about
// this file: a board is built from card names and does not care what a pack holds.

const CLAIMS = [

  // ------------------------------------------------------------ Arcanine GP --
  // The first row is RED ON PURPOSE and is a fault report, not a broken build.
  // The other two pass, which is what makes it a useful one: the model already
  // has the shape of Trevor's note — it escalates as Arcanine is hurt, and it
  // refuses the attack outright when firing would silence the card — and is
  // missing exactly one term. See AI.md.
  {
    id: 'basep-6', card: 'Arcanine GP', pattern: 'Ammo',
    note: 'Flames of Rage is a Damage Scaling move that should be treated like a Kamikaze Timer. It requires a double Energy Funnel to maintain, so it should not plan to be maintained. Quick Attack is preferred unless near death, then Flames of Rage becomes valuable. This card should be expected to be lost on the following turn.',
    claim: 'Quick Attack while healthy, even holding Energy to spare — Flames of Rage is not a move you maintain',
    board: {
      me:   { card: 'basep:Arcanine', energy: '4 Fire' },
      them: { card: 'base1:Hitmonchan', energy: '3 Fighting' },   // Arcanine is weak to WATER, so this is threat 40
    },
    sane: b => b.affordable().includes('Flames of Rage') && b.affordable().includes('Quick Attack')
            && b.lethal('Flames of Rage') === 0 && b.threat() < 70,
    expect: b => b.prefers('Quick Attack'),
  },
  {
    id: 'basep-6', card: 'Arcanine GP', pattern: 'Ammo',
    note: 'Flames of Rage is a Damage Scaling move that should be treated like a Kamikaze Timer. It requires a double Energy Funnel to maintain, so it should not plan to be maintained. Quick Attack is preferred unless near death, then Flames of Rage becomes valuable. This card should be expected to be lost on the following turn.',
    claim: '...but Flames of Rage once badly hurt, where the scaling is the point and the Energy is lost anyway',
    board: {
      me:   { card: 'basep:Arcanine', energy: '4 Fire', dmg: 50 },
      them: { card: 'base1:Hitmonchan', energy: '3 Fighting' },
    },
    sane: b => b.affordable().includes('Flames of Rage') && b.damage('Flames of Rage') > b.damage('Quick Attack'),
    expect: b => b.prefers('Flames of Rage'),
  },
  {
    id: 'basep-6', card: 'Arcanine GP', pattern: 'Ammo',
    note: 'Flames of Rage is a Damage Scaling move that should be treated like a Kamikaze Timer. It requires a double Energy Funnel to maintain, so it should not plan to be maintained. Quick Attack is preferred unless near death, then Flames of Rage becomes valuable. This card should be expected to be lost on the following turn.',
    claim: 'and never at exactly two Fire, where firing it silences the card completely',
    board: {
      me:   { card: 'basep:Arcanine', energy: '2 Fire' },
      them: { card: 'base1:Hitmonchan', energy: '3 Fighting' },
    },
    sane: b => b.affordable().includes('Flames of Rage') && b.affordable().includes('Quick Attack'),
    expect: b => b.prefers('Quick Attack'),
  },

  // -------------------------------------------------------- Cool Porygon ----
  // TWO CLAIMS OUT OF ONE SENTENCE, and separating them is what makes the failure
  // readable: the bot picks the RIGHT type and then never uses the attack. Rolled
  // into one row it would just read "Cool Porygon is broken".
  {
    id: 'basep-15', card: 'Cool Porygon', pattern: 'Attack choice',
    note: 'To use Texture Magic to become resistant to its opponent, and then use 3-D Attack. If the opponent switches out and is replaced by a new type, first priority becomes changing its resistance again.',
    claim: 'the Resistance it reaches for is the type standing opposite, not another of the seven',
    board: {
      me:   { card: 'Cool Porygon', energy: '3 Psychic' },
      them: { card: 'base1:Electabuzz', energy: '2 Lightning' },   // Cool Porygon is weak to FIGHTING, so not Hitmonchan
    },
    sane: b => b.explain().filter(e => /Texture Magic/.test(e.detail)).length === 7,
    expect: b => {
      const best = b.explain().filter(e => /Texture Magic/.test(e.detail))
        .sort((x, y) => y.score - x.score)[0];
      return /Resistance to L/.test(best.detail);
    },
  },
  {
    id: 'basep-15', card: 'Cool Porygon', pattern: 'Attack choice',
    note: 'To use Texture Magic to become resistant to its opponent, and then use 3-D Attack. If the opponent switches out and is replaced by a new type, first priority becomes changing its resistance again.',
    claim: 'Texture Magic BEFORE 3-D Attack — 30 denied every turn from here on beats 30 dealt once',
    board: {
      me:   { card: 'Cool Porygon', energy: '3 Psychic' },
      them: { card: 'base1:Electabuzz', energy: '2 Lightning' },
    },
    sane: b => b.affordable().includes('Texture Magic') && b.affordable().includes('3-D Attack')
            && b.threat() >= 30,
    expect: b => b.prefers('Texture Magic'),
  },

  // ------------------------------------------------------------ Pikachu MS --
  {
    id: 'basep-4', card: 'Pikachu MS', pattern: 'Setup turn',
    note: 'Thunderbolt deals high damage but costs 3 energy and demands that all be discarded each time. However, Recharge adds an extra energy from the deck, making it a Setup Turn move that recharges Thunderbolt in 2 turns rather than the natural 3. The bot might do fine with this',
    claim: 'Recharge is taken as a setup turn while Thunderbolt is still out of reach',
    board: {
      me:   { card: 'basep-4', energy: '1 Lightning' },
      them: { card: 'base1:Electabuzz', energy: '2 Lightning' },
    },
    sane: b => b.affordable().includes('Recharge') && !b.affordable().includes('Thunderbolt'),
    expect: b => b.prefers('Recharge'),
  },

  // ----------------------------------------------------------- Jigglypuff ---
  {
    id: 'basep-7', card: 'Jigglypuff GP', pattern: 'Attack choice',
    note: 'To evolve before fighting. If fighting, it only wants to use Double-Edge if there aren\'t better targets on the bench for those energy cards. If it\'s already powered up, Double-Edge is the primary attack unles resulting in self-kill',
    claim: 'never Double-edge into its own death — 20 recoil on 20 remaining HP is a Prize handed over for nothing',
    board: {
      // A 120 HP Chansey holding one Energy: Double-edge cannot Knock it Out and
      // it cannot hurt Jigglypuff back, so the ONLY thing separating the two
      // attacks on this board is the recoil. That is the claim and nothing else.
      me:   { card: 'basep:Jigglypuff', energy: '3 Psychic', dmg: 30 },
      them: { card: 'Chansey', energy: '1 Fighting' },
    },
    sane: b => b.affordable().includes('Double-edge') && b.affordable().includes('First Aid')
            && b.lethal('Double-edge') === 0 && b.threat() === 0,
    expect: b => !b.prefers('Double-edge'),
  },
];

module.exports = { CLAIMS };

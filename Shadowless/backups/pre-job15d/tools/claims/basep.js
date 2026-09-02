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
  // THE FIRST ROW USED TO ASSERT THE OPPOSITE AND IT WAS WRONG — 28 Aug 2026.
  // It read "Quick Attack while healthy, even holding Energy to spare", was red
  // for two days, and two sessions spent that time looking for the missing term
  // in ATTACK CHOICE. Trevor, asked directly: "If it ever found itself in a
  // situation where it did have 4 energies attached then yes, it should use
  // Flames of Rage. However, it should be exceedingly rare that it finds itself
  // in that situation."
  //
  // The claim was reading the right card and the wrong verb. The bot was correct
  // at four Fire and the fault was one decision upstream — it was STOCKING
  // Arcanine GP to six, because `ammoSymbols` gave a 40-damage attack the same
  // pre-load treatment as Charizard's 100. Rewritten to assert the behaviour
  // that turned out to be right, and the real claim is the attach row below.
  //
  // *[Why a report is a symptom and not a diagnosis →](../../PLAYTEST.md)*
  {
    id: 'basep-6', card: 'Arcanine GP', pattern: 'Ammo',
    note: "Flames of Rage is a Damage Scaling move that should be treated like a Kamikaze Timer. It requires a double Energy Funnel to maintain, so it should not plan to be maintained. Quick Attack is preferred unless near death, then Flames of Rage becomes valuable. This card should be expected to be lost on the following turn.",
    claim: 'Flames of Rage IS right at four Fire — the fault was ever getting there, not firing it',
    board: {
      me:   { card: 'basep:Arcanine', energy: '4 Fire' },
      them: { card: 'base1:Hitmonchan', energy: '3 Fighting' },   // Arcanine is weak to WATER, so this is threat 40
    },
    sane: b => b.affordable().includes('Flames of Rage') && b.affordable().includes('Quick Attack')
            && b.lethal('Flames of Rage') === 0 && b.threat() < 70,
    expect: b => b.prefers('Flames of Rage'),
  },
  {
    id: 'basep-6', card: 'Arcanine GP', pattern: 'Ammo',
    // THE CHAT ANSWER THIS ROW WAS WRITTEN FROM, 28 Aug 2026, kept because the
    // workbook cell does not carry it: "After it is at 2 energies, additional ones
    // better serve the bench. Over-Attaching in anticipation of that move for
    // Arcanine GP is the same price as spending the energy reactively instead."
    // That sentence is what the row asserts; the cell below is what wants.js diffs.
    note: "Flames of Rage is a Damage Scaling move that should be treated like a Kamikaze Timer. It requires a double Energy Funnel to maintain, so it should not plan to be maintained. Quick Attack is preferred unless near death, then Flames of Rage becomes valuable. This card should be expected to be lost on the following turn.",
    claim: 'and a FIFTH Fire is surplus — the pre-load that buys Charizard a second shot buys this card nothing',
    board: {
      me:   { card: 'basep:Arcanine', energy: '4 Fire' },
      them: { card: 'base1:Hitmonchan', energy: '3 Fighting' },
      myHand: ['Fire Energy'],
    },
    sane: b => b.explain().some(e => e.label === 'attach'),
    expect: b => b.explain().filter(e => e.label === 'attach').every(e => e.score < 0),
  },
  {
    id: 'base1-4', card: 'Charizard', pattern: 'Ammo',
    // The 21 Aug ammo doctrine, in Trevor's words at the time: "Evolve it on the
    // bench and pre-load it with as much Energy as you can beyond the four the
    // attack costs." His current cell says the same thing and adds the DCE
    // deckbuild want, which is not this row's business.
    note: "A deck where four DCE replace four R energies, and to be pre-Over-Attached with as many energies as possibe before being sent into battle. Even Charmeleon should be preloaded on the bench before evolution in anticipation of this card's high Energy Funel costs.",
    claim: 'THE CONTROL — a fifth Fire on Charizard is still ammunition, because Fire Spin is all it has',
    board: {
      me:   { card: 'Charizard', energy: '5 Fire' },
      them: { card: 'Chansey', energy: '3 Water' },
      myHand: ['Fire Energy'],
    },
    sane: b => b.explain().some(e => e.label === 'attach'),
    expect: b => b.explain().filter(e => e.label === 'attach').every(e => e.score > 0),
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

  // ------------------------------------------------------- Electabuzz MS --
  // THIS PAIR TESTS SCORING WRITTEN THIS SESSION AND NEVER MEASURED. Light
  // Screen's value is proportional (it halves), where every other reduction in
  // the file is flat, so the term was written from scratch. Trevor's note is the
  // only thing that can say whether the number is right.
  {
    id: 'basep-2', card: 'Electabuzz MS', pattern: 'Attack choice',
    note: 'Quick Attack is primary, Light Screen only if it can\'t be afforded or won\'t land damage (like if the opponent protects itself first)',
    claim: 'Quick Attack is primary — Light Screen is not what you do with a full turn',
    board: {
      me:   { card: 'basep-2', energy: '2 Lightning' },
      them: { card: 'base1:Squirtle', energy: '2 Water' },     // NOT Fighting: Electabuzz is weak to it
    },
    sane: b => b.affordable().includes('Quick Attack') && b.affordable().includes('Light Screen')
            && b.threat() < 60,
    expect: b => b.prefers('Quick Attack'),
  },
  {
    id: 'basep-2', card: 'Electabuzz MS', pattern: 'Attack choice',
    note: 'Quick Attack is primary, Light Screen only if it can\'t be afforded or won\'t land damage (like if the opponent protects itself first)',
    claim: '...but Light Screen when Quick Attack cannot be afforded — one Lightning buys the wall',
    board: {
      me:   { card: 'basep-2', energy: '1 Lightning' },
      them: { card: 'base1:Squirtle', energy: '2 Water' },
    },
    sane: b => b.affordable().includes('Light Screen') && !b.affordable().includes('Quick Attack'),
    expect: b => b.prefers('Light Screen'),
  },

  // ------------------------------------------------------------ Mewtwo GP --
  // "Energy Control should only be used when Telekinesis can't." A direct
  // ordering claim on a term I guessed at — MOVE_OPP_ENERGY_ON_FLIP is priced as
  // half a Magnetic Lines and nothing has ever checked that against a real board.
  {
    id: 'basep-12', card: 'Mewtwo GP', pattern: 'Attack choice',
    note: 'To disrupt with Energy Control before it\'s ready to use Telekinesis to hurt the bench. Telekinesis can also hit the active pokemon if desired, so all in play should be considered potential targets that the bot weighs. Energy Control should only be used when Telekinesis can\'t, and should not be intentionally used as a stalling move. If it is used and successful, energy choices should follow the pattern of Dark Magneton\'s Electric Lines.',
    claim: 'Telekinesis the moment it is affordable — Energy Control is what you do while waiting for it',
    board: {
      me:   { card: 'basep-12', energy: '3 Psychic' },
      them: { card: 'Chansey', energy: '2 Fighting' },
      theirBench: ['base1:Growlithe'],
    },
    sane: b => b.affordable().includes('Telekinesis') && b.affordable().includes('Energy Control'),
    expect: b => b.prefers('Telekinesis'),
  },
  {
    id: 'basep-12', card: 'Mewtwo GP', pattern: 'Attack choice',
    note: 'To disrupt with Energy Control before it\'s ready to use Telekinesis to hurt the bench. Telekinesis can also hit the active pokemon if desired, so all in play should be considered potential targets that the bot weighs. Energy Control should only be used when Telekinesis can\'t, and should not be intentionally used as a stalling move. If it is used and successful, energy choices should follow the pattern of Dark Magneton\'s Electric Lines.',
    claim: '...and Energy Control while Telekinesis is still out of reach, rather than standing there',
    board: {
      me:   { card: 'basep-12', energy: '1 Psychic' },
      them: { card: 'Chansey', energy: '2 Fighting' },
      theirBench: ['base1:Growlithe'],
    },
    sane: b => b.affordable().includes('Energy Control') && !b.affordable().includes('Telekinesis'),
    expect: b => b.prefers('Energy Control'),
  },

  // -------------------------------------------------------- Dark Persian CH --
  // "To ONLY use Poison Claws." An absolute, and the strongest kind of row to
  // have: Tempt is a drag effect, drags score well, and the note says it should
  // still lose. Priced at half of Gust of Wind for the coin.
  {
    id: 'basep-17', card: 'Dark Persian CH', pattern: 'Attack choice',
    note: 'To only use Poison Claws. Tempt is only useful in the same pattern as Ninetales\' Lure, except it relies on a coin flip and should be treated with even less value because of that',
    claim: 'Poison Claws over Tempt even with a Bench worth dragging — the coin makes the drag cheap talk',
    board: {
      me:   { card: 'basep-17', energy: '2 Psychic' },
      them: { card: 'Chansey', energy: '2 Fighting' },
      theirBench: ['base1:Growlithe', 'base1:Voltorb'],
    },
    sane: b => b.affordable().includes('Poison Claws') && b.affordable().includes('Tempt'),
    expect: b => b.prefers('Poison Claws'),
  },

  // ------------------------------------------------------------- Mewtwo MS --
  // The Setup Turn, and the clause that makes it conditional. Both halves are
  // Trevor's and the second is the one a naive scorer gets wrong: an empty
  // discard makes Energy Absorption a wasted turn, not a cheap one.
  {
    id: 'basep-3', card: 'Mewtwo MS', pattern: 'Energy funnel',
    note: 'To come in mid-game with energy in the discard pile without even being powered up. As long as two energy exist in discard, it can attach a single energy and use a Setup Turn (Energy Absorbtion attack) to power up the rest of the way, essentially skipping a turn of powerup at the cost of giving the opponent a free attack during the Setup Turn. Having it enter fully powered is a good strategy too. Does not want to fight if there is insufficient energy in the discard pile and doesn\'t have enough energy for Psyburn on its own.',
    claim: 'Energy Absorption as a setup turn while Psyburn is out of reach and the discard can pay for it',
    board: {
      me:   { card: 'basep-3', energy: '1 Psychic' },
      discard: ['base1:Psychic Energy', 'base1:Psychic Energy'],
      them: { card: 'Chansey', energy: '2 Fighting' },
    },
    sane: b => b.affordable().includes('Energy Absorption') && !b.affordable().includes('Psyburn'),
    expect: b => b.prefers('Energy Absorption'),
  },
  {
    id: 'basep-3', card: 'Mewtwo MS', pattern: 'Energy funnel',
    note: 'To come in mid-game with energy in the discard pile without even being powered up. As long as two energy exist in discard, it can attach a single energy and use a Setup Turn (Energy Absorbtion attack) to power up the rest of the way, essentially skipping a turn of powerup at the cost of giving the opponent a free attack during the Setup Turn. Having it enter fully powered is a good strategy too. Does not want to fight if there is insufficient energy in the discard pile and doesn\'t have enough energy for Psyburn on its own.',
    claim: '...and Psyburn once it IS affordable — the setup turn has done its job and stops being worth one',
    board: {
      me:   { card: 'basep-3', energy: '3 Psychic' },
      discard: ['base1:Psychic Energy', 'base1:Psychic Energy'],
      them: { card: 'Chansey', energy: '2 Fighting' },
    },
    sane: b => b.affordable().includes('Psyburn') && b.affordable().includes('Energy Absorption'),
    expect: b => b.prefers('Psyburn'),
  },

  // ---------------------------------------------------------------- Mew GP --
  // Trevor's rule is a CONDITIONAL and both sides of it are the claim. This is
  // the one that most directly tests scoring written this session: the devolve
  // term reads "would the smaller card hold the damage already on it".
  {
    id: 'basep-8', card: 'Mew GP', pattern: 'Attack choice',
    note: 'To use Devolution Beam only when the HP reduction from the de-evolved opponent would result in its death. Otherwise, the opponent can just re-evolve it again. Otherwise, Psywave scales in damage based on opponent energy count, and can be a hard hitting attack in certain situations. The bot should calculate that when deciding who to promote.',
    claim: 'Devolution Beam when devolving KILLS — a Charizard on 90 becomes a Charmeleon that cannot hold it',
    board: {
      me:   { card: 'basep-8', energy: '2 Psychic' },
      // 90, NOT 100. At 100 the Charizard has 20 HP left and Psywave ALREADY
      // kills it — so the bot taking the direct kill was correct and the row was
      // wrong, which is the board-construction trap this file's own header is
      // about. At 90 it has 30 left, Psywave does 20, and devolving is the only
      // thing on the card that ends the turn with a Prize. The sane guard says so
      // now instead of leaving it to the reader.
      them: { card: 'base1:Charmander > base1:Charmeleon > base1:Charizard', energy: '2 Fire', dmg: 90 },
    },
    sane: b => b.affordable().includes('Devolution Beam') && b.affordable().includes('Psywave')
            && b.lethal('Psywave') === 0,
    expect: b => b.prefers('Devolution Beam'),
  },
  {
    id: 'basep-8', card: 'Mew GP', pattern: 'Attack choice',
    note: 'To use Devolution Beam only when the HP reduction from the de-evolved opponent would result in its death. Otherwise, the opponent can just re-evolve it again. Otherwise, Psywave scales in damage based on opponent energy count, and can be a hard hitting attack in certain situations. The bot should calculate that when deciding who to promote.',
    claim: '...but never when it does not, because they simply re-evolve it — Psywave instead',
    board: {
      me:   { card: 'basep-8', energy: '2 Psychic' },
      them: { card: 'base1:Charmander > base1:Charmeleon > base1:Charizard', energy: '4 Fire', dmg: 0 },
    },
    sane: b => b.affordable().includes('Devolution Beam') && b.affordable().includes('Psywave')
            && b.damage('Psywave') >= 40,
    expect: b => b.prefers('Psywave'),
  },

  // ------------------------------------------------------------- Pikachu GP --
  // "Rarely ever use Growl." Growl is a damage reduction and those score as
  // stalling tools, so this is a real test of whether the stall vocabulary
  // outranks a plain attack when it should not.
  {
    id: 'basep-1', card: 'Pikachu GP', pattern: 'Attack choice',
    note: 'To use Thundershock as its main attack and rarely ever use Growl. Similar pattern to other basics',
    claim: 'Thundershock is the main attack — Growl is not what a healthy Pikachu does with its turn',
    board: {
      me:   { card: 'basep-1', energy: '2 Lightning' },
      them: { card: 'base1:Squirtle', energy: '2 Water' },      // NOT Fighting — Pikachu is weak to it
    },
    sane: b => b.affordable().includes('Thundershock') && b.affordable().includes('Growl')
            && b.threat() < 50,
    expect: b => b.prefers('Thundershock'),
  },

  // ---------------------------------------------------------- Computer Error --
  // A TRAINER row, and the note is a single word: "desperate". Both halves are
  // asserted because the card was briefly filed as unscored, and unscored ties
  // with End turn — so "does not play it" has to be checked against a board where
  // the bot has something better AND one where it has nothing at all.
  {
    id: 'basep-16', card: 'Computer Error', pattern: 'Trainer',
    note: 'To be used only when desperate, as the card drawing also benefits your opponent AND it makes you miss a turn',
    claim: 'never played while a real attack is available — it hands them five cards and skips your turn',
    board: {
      me:   { card: 'base1:Hitmonchan', energy: '3 Fighting' },
      myHand: ['basep-16', 'base1:Potion', 'base1:Bill', 'base1:Gust of Wind'],
      them: { card: 'Chansey', energy: '2 Fighting' },
    },
    sane: b => b.playable('Computer Error'),
    expect: b => !b.wouldPlay('Computer Error'),
  },
];

module.exports = { CLAIMS };

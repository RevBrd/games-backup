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
//
// ---------------------------------------------------------------------------
// PICK THE OPPONENT ON PURPOSE. A Chansey holding four Fighting Energy is the
// most extreme board in Base Set — a fully charged Double-edge, 80 damage, which
// is lethal against most of the format. It is the obvious thing to reach for and
// it silently turns every claim into *"...against something about to kill you"*.
//
// Batch 2 lost three rows to this in one run — Tangela, Kakuna and Wartortle all
// "failed", and all three were the bot correctly choosing to survive: a barrier
// or a paralysis that prevents a LETHAL turn is priced as a life, deliberately,
// since 22 Aug. Measured across the threat range, every one of Trevor's three
// notes held at threats of 0 to 40 and inverted only at 80.
//
// So: **use `Hitmonchan +3 Fighting` (threat 40) or `Squirtle +1 Water` (threat
// 10) for an ordinary board**, keep the armed Chansey for when you actually mean
// "lethal", and where a note has a defensive exception, assert BOTH — the pair
// says where the line is, which one row never can. Watch the defender's HP too:
// two boards in these batches were built on a Chansey that is weak to Fighting,
// and one on a Squirtle whose 40 HP made the small attack already lethal.

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
      them: { card: 'base1:Electabuzz', energy: '3 Lightning' },
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
      them: { card: 'base1:Electabuzz', energy: '3 Lightning' },
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
    // DONE 23 Aug 2026. Closed by `discardSilence`'s survival factor rather than
    // by anything written for this clause — Trevor's Arcanine idea and his Zapdos
    // idea turned out to be two factors of one term. The target here is a 120 HP
    // Chansey that neither attack can kill, so lethality cannot be what moves it.
    claim: 'Thunderbolt when Zapdos will die next turn anyway — the discard costs nothing it lives to feel',
    board: {
      me:   { card: 'base1:Zapdos', energy: '4 Lightning', dmg: 20 },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.threat() >= b.hp() && b.lethal('Thunderbolt') === 0 && b.lethal('Thunder') === 0,
    expect: b => b.prefers('Thunderbolt'),
  },

  // ---------------------------------------------------------------- Arcanine --
  {
    id: 'base1-23', card: 'Arcanine', pattern: 'Energy funnel',
    note: 'Both attacks do high damage and both have drawbacks. Flamethrower requires an energy funnel but should be the default due to Take Down\'s self-damage. However, Take Down should stay powered up and ready to go for when it\'s needed, meaning the bot should not want to use even Flamethrower until Arcanine has four energies attached, as it requires that constant funnel that would make Take Down unavailable if used at three energies',
    claim: 'Flamethrower over Take Down at four Energy — the self-damage is the tiebreaker',
    board: {
      me:   { card: 'base1:Arcanine', energy: '4 Fire' },
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
    open: 'STILL OPEN after the 23 Aug discard work, and the ordering claim above now passing does NOT close it. Nothing prices holding an attack in RESERVE — `discardSilence` prices being unable to act at all, which is a different thing, and at three Energy Take Down is already unaffordable so there is no choice to make on the board. Related to Ammo\'s open half. Ask before building; this probably wants to be one rule with Charmeleon and Ninetales.',
  },

  // THE DISCARD RULE ITSELF, asserted where it has a real margin. The ordering
  // claim above passes by 0.3 points and that is not the rule working — it is two
  // attacks the model genuinely rates as equivalent, with the discard no longer
  // breaking the tie the wrong way. These two have room in them.
  {
    id: 'base1-4', card: 'Charizard', pattern: 'Ammo',
    note: '(the ammo doctrine, 21 Aug 2026 — pre-load past four and Fire Spin keeps firing)',
    claim: 'ammunition it will replace is not charged for — Fire Spin at six Fire costs nothing to fire',
    board: {
      me:   { card: 'Charizard', energy: '6 Fire' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.me.active.energy.length === 6 && b.affordable().includes('Fire Spin'),
    expect: b => b.score('Fire Spin') >= b.damage('Fire Spin'),
  },
  {
    id: 'base1-4', card: 'Charizard', pattern: 'Ammo',
    note: '(the ammo doctrine, 21 Aug 2026 — pre-load past four and Fire Spin keeps firing)',
    claim: '...but firing at exactly four, which empties it below its own cost, is charged for',
    board: {
      me:   { card: 'Charizard', energy: '4 Fire' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.me.active.energy.length === 4 && b.affordable().includes('Fire Spin'),
    expect: b => b.score('Fire Spin') < b.damage('Fire Spin') - 20,
  },
  // ==========================================================================
  // BATCH 1 — 23 Aug 2026. Twelve notes off `wants.js base1 --todo`, decomposed.
  // Written before running them, so the failures are findings rather than things
  // that were tuned into passing.
  // ==========================================================================

  // ---------------------------------------------------------------- Dugtrio --
  {
    id: 'base1-19', card: 'Dugtrio', pattern: 'Attack choice',
    note: "Slash is preferred unless Earthquake would kill and Slash wouldn't. The damage to its user's own bench should be weighed against Earthquake",
    // MEASURED 23 Aug 2026, and the note is shorthand. Earthquake costs a flat 9
    // a benched body — linear, and sharply negative once the bench is near death
    // — so the crossover sits at THREE benched Pokemon, which is a normal board.
    // At an EMPTY bench Earthquake is strictly better with no downside at all, so
    // "Slash is preferred" cannot be meant literally. **Settled 23 Aug 2026 —
    // Trevor took the measurement over his own note**, so the crossover stands
    // where the arithmetic puts it and this row is the whole claim.
    claim: 'Slash on a realistic bench, where Earthquake\'s extra 30 no longer pays for the splash',
    board: {
      me:   { card: 'Dugtrio', energy: '4 Fighting' },
      them: { card: 'Blastoise', energy: '4 Water' },
      myBench: [{ card: 'Chansey' }, { card: 'base1:Zapdos' },
                { card: 'base1:Squirtle' }, { card: 'base1:Magikarp' }],
    },
    sane: b => b.lethal('Earthquake') === 0 && b.lethal('Slash') === 0 && b.me.bench.length === 4,
    expect: b => b.prefers('Slash'),
  },
  {
    id: 'base1-19', card: 'Dugtrio', pattern: 'Attack choice',
    note: "Slash is preferred unless Earthquake would kill and Slash wouldn't. The damage to its user's own bench should be weighed against Earthquake",
    claim: '...unless Earthquake kills and Slash does not',
    board: {
      me:   { card: 'Dugtrio', energy: '4 Fighting' },
      them: { card: 'Blastoise', dmg: 40, energy: '4 Water' },
      myBench: [{ card: 'Chansey' }],
    },
    sane: b => b.lethal('Earthquake') === 1 && b.lethal('Slash') === 0,
    expect: b => b.prefers('Earthquake'),
  },
  {
    id: 'base1-19', card: 'Dugtrio', pattern: 'Attack choice',
    note: "Slash is preferred unless Earthquake would kill and Slash wouldn't. The damage to its user's own bench should be weighed against Earthquake",
    claim: 'the bench damage is actually weighed — Earthquake is worth less with a hurt bench behind it',
    board: {
      me:   { card: 'Dugtrio', energy: '4 Fighting' },
      them: { card: 'Blastoise', energy: '4 Water' },
      myBench: [{ card: 'base1:Squirtle', dmg: 30 }, { card: 'base1:Magikarp', dmg: 20 }],
    },
    sane: b => b.me.bench.length === 2 && b.lethal('Earthquake') === 0,
    // `alt` builds a second board from the same helper, for claims that are
    // comparisons between two positions rather than between two attacks.
    expect: (b, alt) => b.score('Earthquake') < alt({
      me:   { card: 'Dugtrio', energy: '4 Fighting' },
      them: { card: 'Blastoise', energy: '4 Water' },
    }).score('Earthquake'),
  },

  // --------------------------------------------------------------- Beedrill --
  {
    id: 'base1-17', card: 'Beedrill', pattern: 'Setup turn',
    note: "To use Poison Sting first, and then Twineedle when the opponent is already poisoned. Poison Sting is preferred again when a guaranteed 40 damage or less is needed, rather than gambled on Twineedle's coin flip",
    claim: 'Poison Sting first, against a target that is not yet poisoned',
    board: {
      me:   { card: 'Beedrill', energy: '3 Grass' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => !b.them.active.status.poisoned && b.affordable().includes('Twineedle'),
    expect: b => b.prefers('Poison Sting'),
  },
  {
    id: 'base1-17', card: 'Beedrill', pattern: 'Setup turn',
    note: "To use Poison Sting first, and then Twineedle when the opponent is already poisoned. Poison Sting is preferred again when a guaranteed 40 damage or less is needed, rather than gambled on Twineedle's coin flip",
    // ANSWERED 23 Aug 2026, and the note lost. Trevor: *"you're right, rather than
    // my original note."* The redundancy half was real and is built — Poison Sting
    // dropped from 46 to 43 against an already-poisoned target. But Twineedle
    // still loses and NOT to a scoring fault: **Poison Sting does 40 flat while
    // Twineedle averages 30** across two coins and can land on nothing at all. With
    // the rider worth exactly zero, 40 still beats 30.
    //
    // Kept as an assertion of the CORRECT behaviour rather than deleted, so the
    // next person to read the workbook cell does not re-open it. This is the
    // Cloyster and Paras outcome from 22 Aug: asking for the *because* sometimes
    // says the bot was already right, and that is a result.
    claim: 'Poison Sting even AFTER they are poisoned — 40 flat beats a two-coin 30 (note settled as shorthand)',
    board: {
      me:   { card: 'Beedrill', energy: '3 Grass' },
      them: { card: 'Chansey', energy: '4 Fighting', status: 'poisoned' },
    },
    sane: b => b.them.active.status.poisoned && b.affordable().includes('Twineedle')
            && b.lethal('Poison Sting') === 0,
    expect: b => b.prefers('Poison Sting'),
  },
  {
    id: 'base1-17', card: 'Beedrill', pattern: 'Attack choice',
    note: "To use Poison Sting first, and then Twineedle when the opponent is already poisoned. Poison Sting is preferred again when a guaranteed 40 damage or less is needed, rather than gambled on Twineedle's coin flip",
    claim: 'a guaranteed 40 that kills beats a coin flip for 60 that can land on nothing',
    board: {
      me:   { card: 'Beedrill', energy: '3 Grass' },
      them: { card: 'base1:Squirtle', status: 'poisoned' },
    },
    sane: b => b.lethal('Poison Sting') === 1 && b.lethal('Twineedle') < 1,
    expect: b => b.prefers('Poison Sting'),
  },

  // ----------------------------------------------------------------- Raichu --
  {
    id: 'base1-14', card: 'base1:Raichu', pattern: 'Attack choice',
    note: "To use Agility when Thunder wouldn't kill, or when Thunder risks a self-kill that isn't worthwhile. Does need some degree of Kamakaze Timing. Agility buys turns through damage *and status* denial on a coin flip, while Thunder risks 30 self-dmg on a coin flip.",
    claim: 'Agility when Thunder cannot kill and something real is coming back',
    board: {
      me:   { card: 'base1:Raichu', energy: '4 Lightning' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.lethal('Thunder') === 0 && b.threat() >= 70,
    expect: b => b.prefers('Agility'),
  },
  {
    id: 'base1-14', card: 'base1:Raichu', pattern: 'Attack choice',
    note: "To use Agility when Thunder wouldn't kill, or when Thunder risks a self-kill that isn't worthwhile. Does need some degree of Kamakaze Timing. Agility buys turns through damage *and status* denial on a coin flip, while Thunder risks 30 self-dmg on a coin flip.",
    claim: '...but Thunder when it kills',
    board: {
      me:   { card: 'base1:Raichu', energy: '4 Lightning' },
      them: { card: 'Chansey', dmg: 70, energy: '4 Fighting' },
    },
    sane: b => b.lethal('Thunder') === 1,
    expect: b => b.prefers('Thunder'),
  },
  {
    id: 'base1-14', card: 'base1:Raichu', pattern: 'Kamikaze timing',
    note: "To use Agility when Thunder wouldn't kill, or when Thunder risks a self-kill that isn't worthwhile. Does need some degree of Kamakaze Timing. Agility buys turns through damage *and status* denial on a coin flip, while Thunder risks 30 self-dmg on a coin flip.",
    claim: "Agility when Thunder's own 30 would kill Raichu for nothing",
    board: {
      me:   { card: 'base1:Raichu', energy: '4 Lightning', dmg: 60 },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.hp() <= 30 && b.lethal('Thunder') === 0,
    expect: b => b.prefers('Agility'),
  },

  // --------------------------------------------------------------- Nidoking --
  {
    id: 'base1-11', card: 'Nidoking', pattern: 'Setup turn',
    note: "Both its moves cost the same and both are worth using, but it usually wants to start with Toxic due to the extra poision damage before switching to Thrash, as the extra poision damage on top of Toxic's natural damage equal the 50/50 damage potential of Thrash. Once the opponent is poisoned, Toxic cannot add additional poison damage, so Thrash becomes more valuable.",
    claim: 'Toxic first, against a target carrying no poison at all',
    board: {
      me:   { card: 'Nidoking', energy: '3 Grass' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => !b.them.active.status.poisoned && b.affordable().includes('Thrash'),
    expect: b => b.prefers('Toxic'),
  },
  {
    id: 'base1-11', card: 'Nidoking', pattern: 'Setup turn',
    note: "Both its moves cost the same and both are worth using, but it usually wants to start with Toxic due to the extra poision damage before switching to Thrash, as the extra poision damage on top of Toxic's natural damage equal the 50/50 damage potential of Thrash. Once the opponent is poisoned, Toxic cannot add additional poison damage, so Thrash becomes more valuable.",
    claim: '...then Thrash, because a target already on 20 poison gains nothing from a second Toxic',
    board: {
      me:   { card: 'Nidoking', energy: '3 Grass' },
      them: { card: 'Chansey', energy: '4 Fighting', status: 'poisoned', poisonDamage: 20 },
    },
    sane: b => b.them.active.status.poisoned && b.them.active.poisonDamage === 20,
    expect: b => b.prefers('Thrash'),
  },

  // -------------------------------------------------------------- Poliwrath --
  {
    id: 'base1-13', card: 'Poliwrath', pattern: 'Attack choice',
    note: "An Attack Choice, as both attacks are valid. Whirlpool is preferred due to the very high value of discarding opponent energy cards, but Water Gun can be Over-Attached into doing higher damage. Water Gun should be used when it results in a kill that Whrilpool wouldn't, and the bot should be willing to add that fifth energy to do so",
    claim: 'Whirlpool when neither kills and the target is carrying Energy worth taking',
    board: {
      me:   { card: 'Poliwrath', energy: '4 Water' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.them.active.energy.length >= 4 && b.lethal('Whirlpool') === 0 && b.lethal('Water Gun') === 0,
    expect: b => b.prefers('Whirlpool'),
  },
  {
    id: 'base1-13', card: 'Poliwrath', pattern: 'Attack choice',
    note: "An Attack Choice, as both attacks are valid. Whirlpool is preferred due to the very high value of discarding opponent energy cards, but Water Gun can be Over-Attached into doing higher damage. Water Gun should be used when it results in a kill that Whrilpool wouldn't, and the bot should be willing to add that fifth energy to do so",
    claim: '...but Water Gun when the Over-Attach makes it lethal and Whirlpool is not',
    board: {
      me:   { card: 'Poliwrath', energy: '5 Water' },
      them: { card: 'Chansey', dmg: 70, energy: '4 Fighting' },
    },
    sane: b => b.lethal('Water Gun') === 1 && b.lethal('Whirlpool') === 0,
    expect: b => b.prefers('Water Gun'),
  },

  // ------------------------------------------------- the five prohibitions --
  // Trevor names an attack that should almost never come out. These are the
  // cheapest rows in the file to write and the sharpest to fail: one board
  // proves or disproves each, which is why PLAYBOOK.md calls a prohibition the
  // most valuable kind of note.
  {
    id: 'base1-32', card: 'Kadabra', pattern: 'Attack choice',
    note: "Super Psy does high damage for what it is, and even outdoes its own evolution's damage. The evolution is still preferred in most situations though due to its pokemon power and chance to confuse. Recover should never be used. It drains an energy from a pokemon that wants to stay at 3 energies at all times. Getting in a 50 dmg hit and dying is almost always preferable to recovery or retreat",
    claim: 'Recover should never be used — Super Psy even while badly hurt',
    board: {
      me:   { card: 'Kadabra', energy: '3 Psychic', dmg: 40 },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.affordable().includes('Recover') && b.hp() <= 20,
    expect: b => b.prefers('Super Psy'),
  },
  {
    id: 'base1-49', card: 'base1:Drowzee', pattern: 'Attack choice',
    note: "Pound only used when Confuse Ray can't be",
    claim: 'Confuse Ray whenever it is affordable — Pound is the fallback, not the choice',
    board: {
      me:   { card: 'base1:Drowzee', energy: '2 Psychic' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.affordable().includes('Pound') && b.affordable().includes('Confuse Ray'),
    expect: b => b.prefers('Confuse Ray'),
  },
  {
    id: 'base1-54', card: 'Metapod', pattern: 'Attack choice',
    note: 'Stun Spore is always preferred, and there are extremely few situations Stiffen is used due to the 50/50 damage block chance. For the same energy cost and same 50/50 chance, Stun Spore can cost a turn through paralysis while dealing 20 guaranteed damage',
    claim: 'Stun Spore over Stiffen even under a heavy threat — same cost, same coin, strictly more',
    board: {
      me:   { card: 'Metapod', energy: '2 Grass' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.affordable().includes('Stiffen') && b.threat() >= 70,
    expect: b => b.prefers('Stun Spore'),
  },
  {
    id: 'base1-37', card: 'Nidorino', pattern: 'Attack choice',
    note: "Horn Drill preferred, Double Kick only when it can't be afforded",
    claim: 'Horn Drill whenever both are affordable',
    board: {
      me:   { card: 'Nidorino', energy: '4 Grass' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.affordable().includes('Double Kick') && b.affordable().includes('Horn Drill'),
    expect: b => b.prefers('Horn Drill'),
  },
  {
    id: 'base1-38', card: 'Poliwhirl', pattern: 'Attack choice',
    note: "Amnesia can block an opponent's damage before Doubleslap has the energy to be used or if Poliwhirl needs to survive to the next turn to evolve. Otherwise Doubleslap is always preferred",
    claim: 'Doubleslap once it is affordable — Amnesia is the thing you do before that',
    board: {
      me:   { card: 'Poliwhirl', energy: '3 Water' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.affordable().includes('Amnesia') && b.affordable().includes('Doubleslap'),
    expect: b => b.prefers('Doubleslap'),
  },
  // ==========================================================================
  // BATCH 2 — 23 Aug 2026. The attack-choice and prohibition shapes still open
  // on Base Set, per the sequencing agreed with Trevor: cheapest rows and the
  // highest remaining yield, before the Power/bench-engine notes that need the
  // board builder extended, and before the lookahead family that should be
  // sized as one job rather than nibbled at note by note.
  // ==========================================================================

  // ---------------------------------------------------------------- Tangela --
  // THE ONE TO WATCH. Trevor's note points at Nidoking's reasoning explicitly,
  // and Nidoking's fault was closed this morning by a GENERAL term. If a general
  // fix is really general, this card should already behave without anybody
  // having touched it — which is the whole argument for fixing the scorer rather
  // than the card, tested rather than asserted.
  {
    id: 'base1-66', card: 'Tangela', pattern: 'Setup turn',
    note: 'Poisonpowder first, Bind once poisoned or before it can be afforded. See Nidoking for reasoning',
    // MEASURED across the threat range. The note holds up to a threat of 40 and
    // inverts at 80, where Bind's paralysis is preventing a LETHAL turn rather
    // than an ordinary one — the 22 Aug barrier-as-a-life rule, arriving through
    // paralysis instead. Asserted at a representative threat, with the lethal
    // case asserted the other way below so the pair says where the line is.
    claim: 'Poisonpowder first against a target carrying no poison, at an ordinary threat',
    board: {
      me:   { card: 'Tangela', energy: '3 Grass' },
      them: { card: 'base1:Squirtle', energy: '1 Water' },
    },
    sane: b => !b.them.active.status.poisoned && b.threat() > 0 && b.threat() * 3 < b.hp()
            && b.affordable().includes('Bind'),
    expect: b => b.prefers('Poisonpowder'),
  },
  {
    id: 'base1-66', card: 'Tangela', pattern: 'Attack choice',
    note: 'Poisonpowder first, Bind once poisoned or before it can be afforded. See Nidoking for reasoning',
    claim: '...but Bind against a threat that would kill it, where the paralysis is a life',
    board: {
      me:   { card: 'Tangela', energy: '3 Grass' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.threat() >= b.hp() && !b.them.active.status.poisoned,
    expect: b => b.prefers('Bind'),
  },
  {
    id: 'base1-66', card: 'Tangela', pattern: 'Setup turn',
    note: 'Poisonpowder first, Bind once poisoned or before it can be afforded. See Nidoking for reasoning',
    claim: '...then Bind once they are poisoned — same damage, and the poison has nothing to add',
    board: {
      me:   { card: 'Tangela', energy: '3 Grass' },
      them: { card: 'Chansey', energy: '4 Fighting', status: 'poisoned' },
    },
    sane: b => b.them.active.status.poisoned && b.affordable().includes('Bind'),
    expect: b => b.prefers('Bind'),
  },

  // ---------------------------------------------------- the Stiffen family --
  // Kakuna is Metapod's note again on a different card, and the reasoning is
  // identical: same cost, same coin, and one side also deals damage.
  {
    id: 'base1-33', card: 'Kakuna', pattern: 'Attack choice',
    note: 'Is a good fighting mid-stage that likes to meddle with Poisonpowder. Damage and chance to poison is almost always preferable to a 50/50 chance at damage prevention with Stiffen',
    // Metapod's note on a second card, and it holds everywhere except against a
    // threat that kills outright. Stiffen scores 0.0 / 2.3 / 15.8 against threats
    // of 0 / 10 / 40 and 49 against a lethal 80 — a barrier graded by what it
    // prevents, which is the 22 Aug rule, not a fault.
    claim: 'Poisonpowder over Stiffen at any threat it can survive',
    board: {
      me:   { card: 'Kakuna', energy: '2 Grass' },
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
    },
    sane: b => b.affordable().includes('Stiffen') && b.threat() > 0 && b.threat() < b.hp(),
    expect: b => b.prefers('Poisonpowder'),
  },
  {
    id: 'base1-42', card: 'Wartortle', pattern: 'Attack choice',
    note: "Only withdraws when it can't use Bite. Doesn't mind fighting while it waits to evolve",
    // Same shape a third time. Withdraw is worth 0.0 against nothing and 49
    // against a threat that kills — so 'only withdraws when it can't Bite' is
    // true of every board except the one where withdrawing saves its life.
    claim: 'Bite once affordable, at any threat Wartortle can survive',
    board: {
      me:   { card: 'Wartortle', energy: '3 Water' },
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
    },
    sane: b => b.affordable().includes('Withdraw') && b.affordable().includes('Bite')
            && b.threat() > 0 && b.threat() < b.hp(),
    expect: b => b.prefers('Bite'),
  },
  {
    id: 'base1-42', card: 'Wartortle', pattern: 'Walls',
    note: "Only withdraws when it can't use Bite. Doesn't mind fighting while it waits to evolve",
    claim: "doesn't mind fighting — it does not retreat away while it waits to evolve",
    board: {
      me:   { card: 'Wartortle', energy: '3 Water', dmg: 30 },
      them: { card: 'Chansey', energy: '4 Fighting' },
      myBench: [{ card: 'Chansey', energy: '2 Fighting' }],
    },
    sane: b => b.me.bench.length > 0 && b.me.active.energy.length >= b.card(b.me.active).retreat,
    expect: b => !b.does('retreat'),
  },

  // ---------------------------------------------------------------- Starmie --
  // "See Kadabra entry for more detail" — the same prohibition on a second card,
  // and the second half of a finding that arrived sideways: sweeping every
  // Energy-burning attack for the discard work, Recover scored exactly 0.00 on
  // both of these without anybody looking for it.
  {
    id: 'base1-64', card: 'Starmie', pattern: 'Attack choice',
    note: 'Recover needs an Energy Funnel and should be avoided. See Kadabra entry for more detail',
    claim: 'Recover is avoided — Star Freeze even while badly hurt',
    board: {
      me:   { card: 'Starmie', energy: '3 Water', dmg: 40 },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.affordable().includes('Recover') && b.hp() <= 20,
    expect: b => b.prefers('Star Freeze'),
  },

  // ----------------------------------------------------------------- Magmar --
  {
    id: 'base1-36', card: 'base1:Magmar', pattern: 'Energy funnel',
    note: 'Flamethrower does good damage but requires an energy funnel, and this is not a pokemon you want consuming all your energies. Use Fire Punch as default but be ready for Flamethrower when needed. Low HP means it dies rather quickly.',
    claim: 'Flamethrower when it is needed — it reaches a kill Fire Punch cannot',
    board: {
      me:   { card: 'base1:Magmar', energy: '3 Fire' },
      them: { card: 'base1:Squirtle' },
    },
    sane: b => b.lethal('Flamethrower') === 1 && b.lethal('Fire Punch') === 0,
    expect: b => b.prefers('Flamethrower'),
  },

  // ------------------------------------------------------------- Kamikazes --
  // Magnemite and Magneton are one note: Thunder Wave is the standing attack and
  // Selfdestruct is a TIMER, not a move. It hits BOTH benches, so the note asks
  // for the damage to each to be weighed rather than for the attack to be
  // avoided — which the Dugtrio measurement says the bench term already does.
  {
    id: 'base1-53', card: 'base1:Magnemite', pattern: 'Kamikaze timing',
    note: 'Thunder Wave is primary and tries to paralyze, while Selfdestruct should be a Kamakaze Timer that also weighs the damage to both players\' benches',
    claim: 'Thunder Wave is the standing attack — Selfdestruct is not a move you open with',
    board: {
      me:   { card: 'base1:Magnemite', energy: '2 Lightning' },
      them: { card: 'Chansey', energy: '4 Fighting' },
      myBench: [{ card: 'base1:Pikachu' }, { card: 'base1:Magikarp' }],
    },
    sane: b => b.affordable().includes('Selfdestruct') && b.lethal('Selfdestruct') === 0
            && b.me.bench.length === 2,
    expect: b => b.prefers('Thunder Wave'),
  },
  {
    id: 'base1-53', card: 'base1:Magnemite', pattern: 'Kamikaze timing',
    note: 'Thunder Wave is primary and tries to paralyze, while Selfdestruct should be a Kamakaze Timer that also weighs the damage to both players\' benches',
    claim: 'the damage to BOTH benches is weighed — a hurt bench of mine makes Selfdestruct worse',
    board: {
      me:   { card: 'base1:Magnemite', energy: '2 Lightning' },
      them: { card: 'Chansey', energy: '4 Fighting' },
      myBench: [{ card: 'base1:Magikarp', dmg: 20 }, { card: 'base1:Pikachu', dmg: 30 }],
    },
    sane: b => b.me.bench.length === 2,
    expect: (b, alt) => b.score('Selfdestruct') < alt({
      me:   { card: 'base1:Magnemite', energy: '2 Lightning' },
      them: { card: 'Chansey', energy: '4 Fighting' },
      myBench: [{ card: 'base1:Magikarp' }, { card: 'base1:Pikachu' }],
    }).score('Selfdestruct'),
  },
  {
    id: 'base1-9', card: 'base1:Magneton', pattern: 'Kamikaze timing',
    note: 'The same logic as base1 Magnemite and other Kamakaze Timers. Thunder Wave is used as a status lock until that\'s needed',
    claim: 'Thunder Wave as the status lock, with Selfdestruct held for when it is needed',
    board: {
      me:   { card: 'base1:Magneton', energy: '4 Lightning' },
      them: { card: 'Chansey', energy: '4 Fighting' },
      myBench: [{ card: 'base1:Pikachu' }, { card: 'base1:Magikarp' }],
    },
    sane: b => b.affordable().includes('Selfdestruct') && b.lethal('Selfdestruct') === 0
            && b.me.bench.length === 2,
    expect: b => b.prefers('Thunder Wave'),
  },

  // ---------------------------------------------------------------- Pikachu --
  {
    id: 'base1-58', card: 'Pikachu', pattern: 'Attack choice',
    note: 'Thunder Jolt is the preferred attack but risks self-damage toward a low-HP pokemon. Prefers to evolve on the bench. There are about a thousand Pikachu variants and our autobuilder should prefer most of the others over this one.',
    claim: 'Thunder Jolt is the preferred attack while Pikachu can afford the risk',
    board: {
      me:   { card: 'base1:Pikachu', energy: '2 Lightning' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.affordable().includes('Gnaw') && b.affordable().includes('Thunder Jolt')
            && b.hp() > 10,
    expect: b => b.prefers('Thunder Jolt'),
  },
  {
    id: 'base1-58', card: 'Pikachu', pattern: 'Attack choice',
    note: 'Thunder Jolt is the preferred attack but risks self-damage toward a low-HP pokemon. Prefers to evolve on the bench. There are about a thousand Pikachu variants and our autobuilder should prefer most of the others over this one.',
    claim: '...but Gnaw at 10 HP, where Thunder Jolt\'s own coin can kill it for nothing',
    board: {
      me:   { card: 'base1:Pikachu', energy: '2 Lightning', dmg: 30 },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.hp() === 10 && b.lethal('Thunder Jolt') === 0,
    expect: b => b.prefers('Gnaw'),
  },

  // ---------------------------------------------------------------- Machoke --
  {
    id: 'base1-34', card: 'Machoke', pattern: 'Damage scaling',
    note: 'A tough card to use because one attack\'s damage shrinks very quickly with damage taken, and the other deals self-damage. Can deal high damage to an opponent quickly but can become useless after that. Prefers to evolve on the bench unless a quick cheap hit is needed, at which time it does have a use',
    claim: 'a fresh Machoke hits with Karate Chop, which is at full strength and costs nothing',
    board: {
      me:   { card: 'Machoke', energy: '4 Fighting' },
      them: { card: 'Blastoise', energy: '4 Water' },
    },
    sane: b => b.hp() === 80 && b.affordable().includes('Submission')
            && b.lethal('Submission') === 0,
    expect: b => b.prefers('Karate Chop'),
  },
  {
    id: 'base1-34', card: 'Machoke', pattern: 'Damage scaling',
    note: 'A tough card to use because one attack\'s damage shrinks very quickly with damage taken, and the other deals self-damage. Can deal high damage to an opponent quickly but can become useless after that. Prefers to evolve on the bench unless a quick cheap hit is needed, at which time it does have a use',
    claim: '...and a badly hurt one switches to Submission, because Karate Chop has shrunk to nothing',
    board: {
      me:   { card: 'Machoke', energy: '4 Fighting', dmg: 40 },
      them: { card: 'Blastoise', energy: '4 Water' },
    },
    sane: b => b.damage('Karate Chop') < b.damage('Submission') && b.hp() === 40,
    expect: b => b.prefers('Submission'),
  },

  // ---------------------------------------------------------------- Koffing --
  {
    id: 'base1-51', card: 'base1:Koffing', pattern: 'Coin luck',
    note: 'Loves to open and wreaks havok when it does. Foul Gas guarantees one of two different status conditions',
    claim: 'Foul Gas is priced as a GUARANTEED status — the coin picks which one, not whether',
    board: {
      me:   { card: 'base1:Koffing', energy: '2 Grass' },
      them: { card: 'Chansey', energy: '4 Fighting' },
    },
    sane: b => b.affordable().includes('Foul Gas') && b.threat() >= 70,
    // 10 damage plus a certainty. It must beat what 10 damage alone is worth,
    // by more than a single coin-flip rider would be.
    expect: b => b.score('Foul Gas') > b.damage('Foul Gas') + 10,
  },

  // ------------------------------------------------------------------ Potion --
  // THE FIRST TRAINER CLAIM, and it PASSED — which is a result, because Trevor
  // logged the opposite from real play: *"Opponent used Potion right at the start
  // to heal only 10 damage"* is a live item in GRABBAG.md. The general case is
  // correct on a built board, so that report needs its own position before it can
  // be worked. PLAYTEST.md is the method file and this is exactly its subject.
  {
    id: 'base1-94', card: 'Potion', pattern: 'Heal & attrition',
    note: 'To not be used to heal only 10 damage unless that has the immediate potential to be life saving (and the pokemon is worth saving)',
    claim: 'refused on a barely scratched Pokemon — 10 damage healed is not worth a card',
    board: {
      me:   { card: 'Chansey', energy: '2 Fighting', dmg: 10 },
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Potion'],
    },
    sane: b => b.playable('Potion') && b.me.active.dmg === 10 && b.hp() > 100,
    expect: b => !b.wouldPlay('Potion'),
  },
  {
    id: 'base1-94', card: 'Potion', pattern: 'Heal & attrition',
    note: 'To not be used to heal only 10 damage unless that has the immediate potential to be life saving (and the pokemon is worth saving)',
    claim: '...unless it is life-saving, which is the clause the note turns on',
    board: {
      me:   { card: 'base1:Pikachu', energy: '2 Lightning', dmg: 30 },
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Potion'],
    },
    sane: b => b.playable('Potion') && b.hp() === 10 && b.threat() >= b.hp(),
    expect: b => b.wouldPlay('Potion'),
  },
];

module.exports = { CLAIMS };

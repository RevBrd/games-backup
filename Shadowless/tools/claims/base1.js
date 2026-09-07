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
// A `sane` MUST NOT NAME ANYTHING THE CHANGE INTRODUCED, and this has now cost
// two sessions in two days. A precondition reading a field, weight or method that
// arrived with the same commit as the row makes `--baseline` report the row
// **UNUSABLE** rather than **RED** — the harness being honest, and the row proving
// nothing at all. The control is the whole reason to write the row.
//
// It is easy to miss because the row is green in both readings and the failure is
// a *third* status you have to go looking for. **Write preconditions out of things
// that were always there** — an Energy count, `short`, `threat()`, HP — and put the
// new field in `expect`, where a difference is supposed to show up. Both times the
// fix was to spell a literal or count cards instead.
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
  // CLOSED BY ITS AUTHOR, 30 Aug 2026, and by measurement rather than by code.
  // This was an `open:` row from 23 Aug reading "at THREE Energy it should hold
  // Flamethrower, because using it drops Take Down out of reach", and it is the
  // clause `AI.md` Open #8 named as surviving because "three cards ask for it
  // rather than one".
  //
  // ALL THREE HAVE NOW GONE, and none of them to a reserve term. Ninetales was
  // never a reserve case — Trevor: it is about not being Active without Fire
  // Blast, which is entry, not holding. Charmeleon is lookahead, `AI.md` Open
  // #9(c) - the attach-toward-a-card-not-in-play half. And Arcanine is this, in his own words on 30 Aug 2026:
  //
  //   "Being in the active spot should change things, in terms of it forces
  //   certain realities before your pokemon is ready sometimes. An Arcanine in
  //   the active spot with 3 energies should probably attack anyway, if pausing
  //   for a turn to gather energies would result in a net negative in terms of
  //   what would be gained by powering up Take Down, which would probably be
  //   most situations where it would take damage. But on the bench, the AI
  //   shouldn't want to stop powering it up at Flamethrower, and always continue
  //   on to Takedown."
  //
  // THE ROW WAS ASKING FOR THE OPPOSITE OF WHAT HE WANTS, and the reason it read
  // plausibly for a week is that it was written about a card rather than about a
  // SLOT. Standing still to bank an Energy is a thing a Bench does; an Active
  // that declines to swing is paying a turn of damage for it. The workbook cell
  // below still carries the older sentence and is quoted unchanged, per the
  // drift contract — the newer reading is here in the comment.
  //
  // Measured against a Snorlax, which survives Take Down and so keeps the lethal
  // shortcut out of it. Both rows below were ALREADY GREEN when written.
  {
    id: 'base1-23', card: 'Arcanine', pattern: 'Energy funnel',
    note: "Both attacks do high damage and both have drawbacks. Flamethrower requires an energy funnel but should be the default due to Take Down's self-damage. However, Take Down should stay powered up and ready to go for when it's needed, meaning the bot should not want to use even Flamethrower until Arcanine has four energies attached, as it requires that constant funnel that would make Take Down unavailable if used at three energies",
    claim: 'an ACTIVE Arcanine on three Energy swings rather than standing still to bank a fourth',
    board: {
      me:   { card: 'base1:Arcanine', energy: '3 Fire' },
      myBench: [{ card: 'Hitmonchan', energy: '1 Fighting' }],
      them: { card: 'base2:Snorlax', energy: '4 Fighting' },
      myHand: [],
    },
    sane: b => b.affordable().includes('Flamethrower') && !b.affordable().includes('Take Down')
            && b.threat() > 0 && !b.me.hand.length,
    expect: b => b.does('attack'),
  },
  {
    id: 'base1-23', card: 'Arcanine', pattern: 'Energy funnel',
    // THE OTHER HALF OF THE SAME SENTENCE, and the reason both are rows: the two
    // slots want opposite things out of the same Energy, so a claim that does not
    // say which slot it is about cannot be right in both places.
    note: "Both attacks do high damage and both have drawbacks. Flamethrower requires an energy funnel but should be the default due to Take Down's self-damage. However, Take Down should stay powered up and ready to go for when it's needed, meaning the bot should not want to use even Flamethrower until Arcanine has four energies attached, as it requires that constant funnel that would make Take Down unavailable if used at three energies",
    claim: '...but a BENCHED one is fed past Flamethrower\'s cost and on to Take Down\'s',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base1:Arcanine', energy: '3 Fire' }],
      them: { card: 'base2:Snorlax', energy: '4 Fighting' },
      myHand: ['Fire Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 3 && b.me.hand.length === 1,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Arcanine') && e.score > 0),
  },
  {
    id: 'base1-23', card: 'Arcanine', pattern: 'Energy funnel',
    // THE CONTROL, and it is what stops the row above from meaning "the Bench is
    // always worth feeding". The surplus rule is doing the work: a fourth Fire on
    // Arcanine buys Take Down, a fourth Fighting on a Hitmonchan that already
    // pays for Special Punch buys nothing, and only the first is taken.
    note: "Both attacks do high damage and both have drawbacks. Flamethrower requires an energy funnel but should be the default due to Take Down's self-damage. However, Take Down should stay powered up and ready to go for when it's needed, meaning the bot should not want to use even Flamethrower until Arcanine has four energies attached, as it requires that constant funnel that would make Take Down unavailable if used at three energies",
    claim: 'THE CONTROL - and refused where the extra Energy unlocks nothing bigger',
    board: {
      me:   { card: 'base1:Arcanine', energy: '3 Fire' },
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],
      them: { card: 'base2:Snorlax', energy: '4 Fighting' },
      myHand: ['Fighting Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 3 && b.me.hand.length === 1,
    expect: b => b.explain().filter(e => e.label === 'attach'
            && (e.detail || '').includes('Hitmonchan')).every(e => e.score <= 0),
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

  // THE HALF OF THAT SENTENCE NOTHING CAN ASSERT — 7 Sep 2026, and it arrived as
  // an `EXTENDED` line out of `wants.js` rather than as a bug report. Trevor added
  // *"Agility buys turns through damage **and status** denial on a coin flip"* to a
  // note whose three rows above only ever tested the damage half.
  //
  // THE STATUS HALF IS WORTH EXACTLY ZERO TO THE BOT, and it is worth zero by
  // construction rather than by a wrong weight. In `scoreAttack`:
  //
  //     const danger  = this.incomingThreat(pi);
  //     const denied  = Math.min(danger, hpLeft);
  //     if (f.flags.shield) s += f.flags.shield * (1.4 * shieldFrac * W.shieldSelf
  //                                              + shieldFrac**2 * W.selfKO);
  //
  // `denied` is damage and nothing else, so a barrier against a Pokemon whose
  // attack would PARALYSE prices identically to one against a Pokemon that would
  // only hit. Measured, and the equality is exact rather than approximate:
  //
  //     base1:Electabuzz 2L (Thunderpunch, paralysis line)  threat 40  Agility 35.75
  //     base1:Machop     2F (Low Kick, plain damage)        threat 40  Agility 35.75
  //
  // The file's own comment says so without noticing: *"TWO TERMS BECAUSE THERE ARE
  // TWO THINGS BEING PREVENTED"* — and both of them are damage.
  //
  // WHY IT IS NOT BEING FIXED HERE. Agility already denies the opponent's whole
  // turn when the flip lands, so some of this is priced through `denied` by
  // accident; the increment is only the status that would have OUTLIVED that turn.
  // Pricing it means reaching for the status weights, and `AI.md` open item 5 says
  // Sleep is currently valued by three methods that disagree with each other. A new
  // consumer of those numbers is the wrong thing to add while that is true.
  {
    id: 'base1-14', card: 'base1:Raichu', pattern: 'Attack choice',
    note: "To use Agility when Thunder wouldn't kill, or when Thunder risks a self-kill that isn't worthwhile. Does need some degree of Kamakaze Timing. Agility buys turns through damage *and status* denial on a coin flip, while Thunder risks 30 self-dmg on a coin flip.",
    claim: 'Agility is worth MORE against an opponent whose attack also applies a status',
    open: "`denied` is damage only, so the shield term cannot see a status it prevents. "
        + "Needs a term for the status that would outlive the barrier's own turn — and "
        + "AI.md open item 5 (three disagreeing Sleep prices) should settle first.",
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
    // THIS ROW WAS GREEN AGAINST A BOARD WHERE THE POTION SAVED NOTHING — 2 Sep
    // 2026, and it is the first case in this file of a passing row protecting a
    // fault rather than a rule.
    //
    // It used to stand a Pikachu on 10 remaining HP in front of a Hitmonchan.
    // Pikachu is weak to Fighting, so Special Punch reads 80, and a Potion takes
    // it from 10 to 30 against an incoming 80. The bot played it, the row went
    // green, and the claim said "life-saving" about a heal that could not save.
    // It passed BECAUSE of the fault below: the rescue bonus fires on
    // `threat >= remaining` and never asks whether the heal crosses the line.
    //
    // This is PLAYBOOK.md's "pick the opponent on purpose" hazard arriving from
    // the other side. That file warns a fully charged Hitmonchan turns a claim
    // into "...against something about to kill you" and makes rows fail; here it
    // made one PASS, which is the harder direction to notice. **A row asserting
    // an exception has to be built on a board where the exception is actually true** —
    // check the arithmetic of the clause, not just the verb the bot chose.
    //
    // The board is now Chansey at 70 remaining under an incoming 80, where a
    // Potion genuinely does buy the turn. Its pair is the row below.
    board: {
      me:   { card: 'Chansey', energy: '2 Fighting', dmg: 50 },
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Potion'],
    },
    sane: b => b.playable('Potion') && b.threat() >= b.hp() && b.hp() + 20 > b.threat(),
    expect: b => b.wouldPlay('Potion'),
  },
  // The Potion goes where it does the most good, and "most damage counters" is
  // not that. Trevor, from the GBC sequel: "Potions applied to the active pokemon
  // seem to be purposefully timed for when they would prevent the opponent from
  // killing it on the next turn, rather than as soon as it would be useful."
  //
  // THE PAIR IS THE POINT. Both boards put MORE damage on the Bench than on the
  // Active, so a target chosen by damage alone answers "the Bench" to both. What
  // separates them is whether the heal actually buys the Active a turn.
  {
    id: 'base1-94', card: 'Potion', pattern: 'Heal & attrition',
    note: 'To not be used to heal only 10 damage unless that has the immediate potential to be life saving (and the pokemon is worth saving)',
    claim: 'the Potion goes to the Active it SAVES, even though the Bench carries more damage',
    board: {
      me:      { card: 'Chansey', energy: '2 Fighting', dmg: 50 },   // 70 left under 80
      them:    { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base2:Snorlax', dmg: 60 }],                 // more damage, no threat
      myHand:  ['Potion'],
    },
    sane: b => b.playable('Potion') && b.threat() >= b.hp() && b.hp() + 20 > b.threat()
               && b.me.bench[0].dmg > b.me.active.dmg,
    expect: b => b.healsWho('Potion').join() === 'Chansey',
  },
  {
    id: 'base1-94', card: 'Potion', pattern: 'Heal & attrition',
    note: 'To not be used to heal only 10 damage unless that has the immediate potential to be life saving (and the pokemon is worth saving)',
    claim: 'THE CONTROL — ...but not when the heal cannot save it, where the Bench is the better home',
    board: {
      me:      { card: 'Chansey', energy: '2 Fighting', dmg: 70 },   // 50 left under 80
      them:    { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base2:Snorlax', dmg: 80 }],
      myHand:  ['Potion'],
    },
    sane: b => b.playable('Potion') && b.threat() >= b.hp() && b.hp() + 20 <= b.threat()
               && b.me.bench[0].dmg > b.me.active.dmg,
    expect: b => b.healsWho('Potion').join() === 'Snorlax',
  },
  {
    id: 'base1-94', card: 'Potion', pattern: 'Heal & attrition',
    note: 'To not be used to heal only 10 damage unless that has the immediate potential to be life saving (and the pokemon is worth saving)',
    claim: 'THE CONTROL — and an Active in no danger does not take the card off a more damaged Bench',
    board: {
      me:      { card: 'Chansey', energy: '2 Fighting', dmg: 50 },
      them:    { card: 'Hitmonchan', energy: '1 Fighting' },         // Jab, 40 doubled
      myBench: [{ card: 'base2:Snorlax', dmg: 60 }],
      myHand:  ['Potion'],
    },
    sane: b => b.playable('Potion') && b.threat() < b.hp()
               && b.me.bench[0].dmg > b.me.active.dmg,
    expect: b => b.healsWho('Potion').join() === 'Snorlax',
  },
  // ============================================================= Super Potion
  // THE DISARM WAS CHARGED TO THE CARD, AFTER THE WORST SLOT HAD BEEN PICKED.
  // Target selection ran on damage counters alone, then the penalty for
  // discarding an Energy the target needed was applied to whatever that had
  // chosen — so the only thing the rule could do was refuse the play. Measured
  // on the board below against the pre-fix source: **-15.00, which is under
  // `threshold`**, so the card sat in hand unplayable while a benched Pokemon
  // with spare Energy stood there wanting exactly this heal.
  //
  // Trevor's note is what this is: "Should not be used to save a pokemon that it
  // would prevent from powering up enough to attack, as that would just be
  // stalling for no benefit." He wrote should-not-be-used-on, and the fix is to
  // let it be used SOMEWHERE ELSE.
  //
  // THE BOARD HAS TO REMOVE THE ATTACK ENTIRELY. `potential().short` pins at
  // zero while any attack is still payable, so a Hitmonchan downgraded from
  // Special Punch to Jab reads as no disarm at all — the first board tried here
  // and it looked like a passing control. Chansey on two Energy loses Scrunch
  // and has nothing else. That limit is WALLS.md's, where it is correct; this is
  // the place it bites.
  {
    id: 'base1-90', card: 'Super Potion', pattern: 'Heal & attrition',
    note: 'To heal a moderate amount of damage at the cost of 1 tempo of energy. Should not be used to save a pokemon that it would prevent from powering up enough to attack, as that would just be stalling for no benefit',
    claim: 'goes to the slot whose Energy is SPARE, not the one it would disarm — even with less damage on it',
    board: {
      me:      { card: 'Chansey', energy: '2 Psychic', dmg: 50 },     // Scrunch is CC: the discard silences it
      them:    { card: 'base1:Charmander', energy: '1 Fire' },
      myBench: [{ card: 'base1:Machop', energy: '2 Fighting', dmg: 40 }],  // Low Kick is F: one is spare
      myHand:  ['Super Potion'],
    },
    sane: b => b.playable('Super Potion') && b.me.active.dmg > b.me.bench[0].dmg
               && b.threat() < b.hp(),
    expect: b => b.healsWho('Super Potion').join() === 'Machop',
  },
  {
    id: 'base1-90', card: 'Super Potion', pattern: 'Heal & attrition',
    note: 'To heal a moderate amount of damage at the cost of 1 tempo of energy. Should not be used to save a pokemon that it would prevent from powering up enough to attack, as that would just be stalling for no benefit',
    claim: 'THE CONTROL — with the Energy spare on BOTH, it goes to the one carrying more damage',
    board: {
      me:      { card: 'Chansey', energy: '3 Psychic', dmg: 50 },     // a spare above Scrunch's CC
      them:    { card: 'base1:Charmander', energy: '1 Fire' },
      myBench: [{ card: 'base1:Machop', energy: '2 Fighting', dmg: 40 }],
      myHand:  ['Super Potion'],
    },
    sane: b => b.playable('Super Potion') && b.me.active.dmg > b.me.bench[0].dmg
               && b.threat() < b.hp(),
    expect: b => b.healsWho('Super Potion').join() === 'Chansey',
  },
  // ============================================================ Energy Removal
  // THE AI HAS NEVER CHOSEN WHICH ENERGY TO STRIP, and the line that looks like
  // it does is the reason nobody noticed. `scoreTrainer` sets
  // `a.opts.energyIdx = 0` - a key the engine has not read since the human's
  // Energy picker replaced it (see the comment left behind at `resolveTarget` in
  // `ui.js`). It is the only occurrence of that name anywhere in the project.
  //
  // With no `energyUids`, `takeEnergy` falls through to `energyPayOrder`, which
  // is the order written for a Pokemon paying its OWN cost: spend what this card
  // needs least, and among equals spend the smaller one. That is right for a
  // Super Potion and exactly inverted for a hostile strip.
  //
  // IT IS INVISIBLE BECAUSE THE TWO ORDERS AGREE ON THE EASY BOARD. Where the
  // Double Colorless is genuinely surplus, "what they need least" and "what
  // costs them most" pick the same card. They diverge only where the Energy is
  // load-bearing - which is the only case Trevor's note is about.
  //
  // Same fault, same fix, two cards: Super Energy Removal below sets neither
  // `costUids` nor `energyUids` and falls through on both halves.
  {
    id: 'base1-92', card: 'Energy Removal', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    note: "To be used liberally and strategically. Do not remove an energy just to remove an energy, do it to something that it would inconvenience by having to re-attach. The opponent's active pokemon usually makes for the best target, but something powerful on the bench could work as well. Denying the active pokemon forces the opponent to re-power that one instead of preparing the bench, might lead to the opponent taking an extra turn to attack, and might completely stop the opponent if he doesn't have any extra energies. After a pokemone is selected, if it has multiple energy types, DCE should be the first target and its own energy type (as in the hard requirements for its moves rather than the colorless extras) should be the second.",
    claim: 'the Energy its attacks actually require goes, not the colorless filler beside it',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'base1:Magmar', energy: '1 Fire, 1 Water' },   // Magmar's costs are R and RR
      myHand: ['Energy Removal'],
    },
    sane: b => b.playable('Energy Removal') && b.them.active.energy.length === 2,
    expect: b => b.strips('Energy Removal').includes('Fire Energy'),
  },
  {
    id: 'base1-92', card: 'Energy Removal', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    note: "To be used liberally and strategically. Do not remove an energy just to remove an energy, do it to something that it would inconvenience by having to re-attach. The opponent's active pokemon usually makes for the best target, but something powerful on the bench could work as well. Denying the active pokemon forces the opponent to re-power that one instead of preparing the bench, might lead to the opponent taking an extra turn to attack, and might completely stop the opponent if he doesn't have any extra energies. After a pokemone is selected, if it has multiple energy types, DCE should be the first target and its own energy type (as in the hard requirements for its moves rather than the colorless extras) should be the second.",
    claim: 'a Double Colorless goes first - one card, two symbols, and they only get one back a turn',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'Kangaskhan', energy: '1 Water, 1 DCE' },      // every cost Colorless: nothing is "needed"
      myHand: ['Energy Removal'],
    },
    sane: b => b.playable('Energy Removal') && b.them.active.energy.length === 2,
    expect: b => b.strips('Energy Removal').includes('Double Colorless Energy'),
  },
  {
    id: 'base1-92', card: 'Energy Removal', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    // The sharpest board for it. Energy Burn makes every Energy on a Charizard
    // Fire, so the DCE is worth TWO - which the project already established from
    // the other side on 21 Aug, when this same order was reversed so Charizard
    // would stop spending its own DCE first.
    note: "To be used liberally and strategically. Do not remove an energy just to remove an energy, do it to something that it would inconvenience by having to re-attach. The opponent's active pokemon usually makes for the best target, but something powerful on the bench could work as well. Denying the active pokemon forces the opponent to re-power that one instead of preparing the bench, might lead to the opponent taking an extra turn to attack, and might completely stop the opponent if he doesn't have any extra energies. After a pokemone is selected, if it has multiple energy types, DCE should be the first target and its own energy type (as in the hard requirements for its moves rather than the colorless extras) should be the second.",
    claim: '...and hardest on a Charizard, where Energy Burn makes that one card worth two Fire',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'Charizard', energy: '3 Fire, 1 DCE' },
      myHand: ['Energy Removal'],
    },
    sane: b => b.playable('Energy Removal') && b.them.active.energy.length === 4,
    expect: b => b.strips('Energy Removal').includes('Double Colorless Energy'),
  },
  {
    id: 'base1-92', card: 'Energy Removal', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    // THE CONTROL for the target half, which is already right and must stay so.
    note: "To be used liberally and strategically. Do not remove an energy just to remove an energy, do it to something that it would inconvenience by having to re-attach. The opponent's active pokemon usually makes for the best target, but something powerful on the bench could work as well. Denying the active pokemon forces the opponent to re-power that one instead of preparing the bench, might lead to the opponent taking an extra turn to attack, and might completely stop the opponent if he doesn't have any extra energies. After a pokemone is selected, if it has multiple energy types, DCE should be the first target and its own energy type (as in the hard requirements for its moves rather than the colorless extras) should be the second.",
    claim: 'THE CONTROL - the Active is the target over an equally loaded Bench, which already works',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'base1:Magmar', energy: '2 Fire' },
      theirBench: [{ card: 'base1:Squirtle', energy: '2 Water' }],
      myHand: ['Energy Removal'],
    },
    sane: b => b.playable('Energy Removal') && b.them.bench.length === 1
            && b.them.bench[0].energy.length === b.them.active.energy.length,
    expect: b => b.strips('Energy Removal').includes('Fire Energy'),
  },
  {
    id: 'base1-92', card: 'Energy Removal', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    // THE SECOND CONTROL. Trevor's "do not remove an energy just to remove an
    // energy" already has one implementation - `killingActiveNow` - and a fix to
    // the ORDER must not disturb it.
    note: "To be used liberally and strategically. Do not remove an energy just to remove an energy, do it to something that it would inconvenience by having to re-attach. The opponent's active pokemon usually makes for the best target, but something powerful on the bench could work as well. Denying the active pokemon forces the opponent to re-power that one instead of preparing the bench, might lead to the opponent taking an extra turn to attack, and might completely stop the opponent if he doesn't have any extra energies. After a pokemone is selected, if it has multiple energy types, DCE should be the first target and its own energy type (as in the hard requirements for its moves rather than the colorless extras) should be the second.",
    claim: 'THE CONTROL - never spent on a Pokemon this turn is about to Knock Out anyway',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'base1:Squirtle', energy: '1 Water', dmg: 30 },
      myHand: ['Energy Removal'],
    },
    sane: b => b.playable('Energy Removal') && b.lethal('Jab') === 1,
    expect: b => !b.wouldPlay('Energy Removal'),
  },

  // ====================================================== Super Energy Removal
  {
    id: 'base1-79', card: 'Super Energy Removal', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    note: "Costs you a turn of tempo in exchange for costing the opponent two turns of tempo. Your own energy drop should be from a pokemon who needs it the least, and the opponent pokemon selected should be one where this would really cost it, usually the active one. DOES NOT want to be used on an opponent pokemon with only one energy because then you don't gain an advantage.",
    claim: 'the two it takes include the Double Colorless, for the reason Energy Removal takes it',
    board: {
      me:   { card: 'Hitmonchan' },
      myBench: [{ card: 'base1:Squirtle', energy: '2 Water' }],
      them: { card: 'Charizard', energy: '3 Fire, 1 DCE' },
      myHand: ['Super Energy Removal'],
    },
    sane: b => b.playable('Super Energy Removal') && b.them.active.energy.length === 4,
    expect: b => b.strips('Super Energy Removal').includes('Double Colorless Energy'),
  },
  {
    id: 'base1-79', card: 'Super Energy Removal', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    note: "Costs you a turn of tempo in exchange for costing the opponent two turns of tempo. Your own energy drop should be from a pokemon who needs it the least, and the opponent pokemon selected should be one where this would really cost it, usually the active one. DOES NOT want to be used on an opponent pokemon with only one energy because then you don't gain an advantage.",
    claim: 'played against a target carrying enough Energy for the two-for-one to be worth making',
    board: {
      me:   { card: 'Hitmonchan' },
      myBench: [{ card: 'base1:Squirtle', energy: '2 Water' }],
      them: { card: 'base1:Magmar', energy: '3 Fire' },
      myHand: ['Super Energy Removal'],
    },
    sane: b => b.playable('Super Energy Removal') && !b.affordable().length,
    expect: b => b.wouldPlay('Super Energy Removal'),
  },
  {
    id: 'base1-79', card: 'Super Energy Removal', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    // THE PAIR. Trevor's note says this outright and in capitals, and the row
    // above is what stops "never plays it" from passing as a fix.
    note: "Costs you a turn of tempo in exchange for costing the opponent two turns of tempo. Your own energy drop should be from a pokemon who needs it the least, and the opponent pokemon selected should be one where this would really cost it, usually the active one. DOES NOT want to be used on an opponent pokemon with only one energy because then you don't gain an advantage.",
    claim: '...but NOT against a target holding a single Energy, where you pay one to take one',
    board: {
      me:   { card: 'Hitmonchan' },
      myBench: [{ card: 'base1:Squirtle', energy: '2 Water' }],
      them: { card: 'base1:Magmar', energy: '1 Fire' },
      myHand: ['Super Energy Removal'],
    },
    sane: b => b.playable('Super Energy Removal') && b.them.active.energy.length === 1
            && !b.affordable().length,
    expect: b => !b.wouldPlay('Super Energy Removal'),
  },
  {
    id: 'base1-79', card: 'Super Energy Removal', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    // THE CONTROL for the half that is already right: you pay from the Pokemon
    // that needs it least, which here means not the Active.
    note: "Costs you a turn of tempo in exchange for costing the opponent two turns of tempo. Your own energy drop should be from a pokemon who needs it the least, and the opponent pokemon selected should be one where this would really cost it, usually the active one. DOES NOT want to be used on an opponent pokemon with only one energy because then you don't gain an advantage.",
    claim: 'THE CONTROL - the Energy you pay with comes off the Bench, not off the Active',
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base1:Squirtle', energy: '2 Water' }],
      them: { card: 'base1:Magmar', energy: '3 Fire' },
      myHand: ['Super Energy Removal'],
    },
    sane: b => b.playable('Super Energy Removal') && b.me.active.energy.length === 3,
    expect: b => b.spends('Super Energy Removal').every(n => n === 'Water Energy'),
  },
  // ================================================================ PlusPower
  // THE CLIFF, IN A TRAINER. `T_PLUSPOWER` paid a flat 6 and then +34 for one
  // case: the extra 10 makes THIS attack lethal. That is the last step of a
  // staircase, priced as though it were the whole staircase.
  //
  // Trevor names the general quantity outright and gives the arithmetic: "when
  // an additional 10 damage would result in 1 fewer turn to kill the opponent,
  // as in a move doing 30 damage attacking a pokemon with 70 HP." Three turns
  // becomes two. The bot scored that board 6.00 - identical to a board where the
  // extra 10 changes nothing at all.
  //
  // A quantity about how much sooner something dies, written as an equality
  // check on lethality. Same sniff test as the other nine.
  {
    id: 'base1-84', card: 'PlusPower', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    note: "To be used strategically but not be held onto like it's in a vault. The best times are when your own pokemon would fall 10 damage short of knocking out the opponent, or when an additional 10 damage would result in 1 fewer turn to kill the opponent, as in a move doing 30 damage attacking a pokemon with 70 HP. The best practice there is to plant to hit for 30 on the first turn and use the PlusPower for 40 on the second turn. If you might not survive until the second turn, the PlusPower could probably be used early",
    claim: 'played when the extra 10 takes a whole turn off the kill - his own 30-against-70',
    board: {
      me:   { card: 'base1:Magmar', energy: '2 Fire' },        // Fire Punch, 30 flat
      them: { card: 'base1:Electabuzz', energy: '2 Lightning' },  // 70 HP: 3 turns, or 2 with the 10
      myHand: ['PlusPower'],
    },
    sane: b => b.playable('PlusPower') && b.theirHP() === 70 && b.damage('Fire Punch') === 30
            && b.threat() < b.hp(),
    expect: b => b.wouldPlay('PlusPower'),
  },
  {
    id: 'base1-84', card: 'PlusPower', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    // THE PAIR, and the fault. Ten damage that changes no turn count changes
    // nothing at all, and spending it now destroys the option of spending it on
    // the turn it would have converted - which is the plan his note describes.
    note: "To be used strategically but not be held onto like it's in a vault. The best times are when your own pokemon would fall 10 damage short of knocking out the opponent, or when an additional 10 damage would result in 1 fewer turn to kill the opponent, as in a move doing 30 damage attacking a pokemon with 70 HP. The best practice there is to plant to hit for 30 on the first turn and use the PlusPower for 40 on the second turn. If you might not survive until the second turn, the PlusPower could probably be used early",
    claim: '...but held when the extra 10 takes nothing off it, because next turn it might',
    board: {
      me:   { card: 'base1:Magmar', energy: '2 Fire' },
      them: { card: 'base1:Electabuzz', energy: '2 Lightning', dmg: 10 },   // 60 left: two turns either way
      myHand: ['PlusPower'],
    },
    sane: b => b.playable('PlusPower') && b.theirHP() === 60 && b.damage('Fire Punch') === 30
            && b.threat() < b.hp(),
    expect: b => !b.wouldPlay('PlusPower'),
  },
  {
    id: 'base1-84', card: 'PlusPower', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    // THE CONTROL for the case that already worked. The general term has to
    // subsume it, not replace it - the lethal board is turns 2 -> 1, the top of
    // the same staircase, and it must stay the most valuable rung.
    note: "To be used strategically but not be held onto like it's in a vault. The best times are when your own pokemon would fall 10 damage short of knocking out the opponent, or when an additional 10 damage would result in 1 fewer turn to kill the opponent, as in a move doing 30 damage attacking a pokemon with 70 HP. The best practice there is to plant to hit for 30 on the first turn and use the PlusPower for 40 on the second turn. If you might not survive until the second turn, the PlusPower could probably be used early",
    claim: 'THE CONTROL - taken at once when it converts a Knock Out this turn',
    board: {
      me:   { card: 'base1:Magmar', energy: '2 Fire' },
      them: { card: 'base1:Electabuzz', energy: '2 Lightning', dmg: 30 },   // 40 left
      myHand: ['PlusPower'],
    },
    sane: b => b.playable('PlusPower') && b.theirHP() === 40 && b.damage('Fire Punch') === 30,
    expect: b => b.wouldPlay('PlusPower'),
  },
  {
    id: 'base1-84', card: 'PlusPower', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    // THE SECOND CONTROL, and the clause that stops the fix going too far.
    // Holding it is only better if you get the later turn. Trevor: "If you might
    // not survive until the second turn, the PlusPower could probably be used
    // early." Same board as the held row, with the attacker about to die.
    note: "To be used strategically but not be held onto like it's in a vault. The best times are when your own pokemon would fall 10 damage short of knocking out the opponent, or when an additional 10 damage would result in 1 fewer turn to kill the opponent, as in a move doing 30 damage attacking a pokemon with 70 HP. The best practice there is to plant to hit for 30 on the first turn and use the PlusPower for 40 on the second turn. If you might not survive until the second turn, the PlusPower could probably be used early",
    claim: '...and spent anyway when the attacker may not live to take that later turn',
    board: {
      me:   { card: 'base1:Magmar', energy: '2 Fire', dmg: 30 },            // 20 left
      them: { card: 'base1:Electabuzz', energy: '2 Lightning', dmg: 10 },   // 60 left: still two turns either way
      myHand: ['PlusPower'],
    },
    sane: b => b.playable('PlusPower') && b.theirHP() === 60 && b.threat() >= b.hp(),
    expect: b => b.wouldPlay('PlusPower'),
  },
  // ================================================== Ninetales / Gust of Wind
  // ONE EFFECT, TWO CODE PATHS, AND ONLY ONE OF THEM CHOOSES. Gust of Wind runs
  // through `T_SWITCH_OPPONENT`, which ranks their whole Bench and fills
  // `a.opts.bench`. An ATTACK that drags - Lure, Fascinate, Tempt - scored a
  // flat `W.drag` and filled nothing, so `SWITCH_DEFENDER_CHOOSE` fell straight
  // through to the engine's seeded random pick.
  //
  // Trevor saw it in play before it was found here: "Ninetales also used Lure to
  // draw out a much more dangerous pokemon on turn 49" - GRABBAG, log# 04-02-53.
  // The identical board with the two Bench slots swapped drags up a Rattata one
  // way and a fully-charged Charizard the other. Gust of Wind, handed the same
  // board, takes the Rattata both times.
  //
  // THE PAIR IS THE POINT. The first row below passes today, by coincidence, on
  // this seed. A row a coin is winning looks exactly like a row a rule is
  // winning, and only the ordering pair tells them apart - the same reason
  // `dragsUp()` executes rather than reading `a.opts` back.
  {
    id: 'base1-12', card: 'Ninetales', pattern: 'Attack choice',
    note: "To come in after it's ready to use Fire Blast, and to never be required to choose between Lure and nothing. Fire Blast wants an energy funnel but does high damage, so it requires some maintenance and stops bench growth every turn it attacks, but can one-shot many opponents. Lure does have uses, such as removing a dangerous pokemon and replacing it with one that is not ready to attack and is not able to retreat.",
    claim: "Lure brings up the one that cannot attack, not the one that can",
    board: {
      me:   { card: 'Ninetales', energy: '2 Fire' },
      them: { card: 'Chansey', energy: '1 Fighting' },
      theirBench: [{ card: 'Charizard', energy: '4 Fire' }, { card: 'base1:Rattata' }],
    },
    sane: b => b.affordable().includes('Lure') && b.them.bench.length === 2,
    expect: b => b.dragsUp('Lure') === 'Rattata',
  },
  {
    id: 'base1-12', card: 'Ninetales', pattern: 'Attack choice',
    // THE ROW THAT WAS RED. Its twin above was green on nothing but the seed.
    note: "To come in after it's ready to use Fire Blast, and to never be required to choose between Lure and nothing. Fire Blast wants an energy funnel but does high damage, so it requires some maintenance and stops bench growth every turn it attacks, but can one-shot many opponents. Lure does have uses, such as removing a dangerous pokemon and replacing it with one that is not ready to attack and is not able to retreat.",
    claim: "...and still does with the Bench the other way round, which is the whole test",
    board: {
      me:   { card: 'Ninetales', energy: '2 Fire' },
      them: { card: 'Chansey', energy: '1 Fighting' },
      theirBench: [{ card: 'base1:Rattata' }, { card: 'Charizard', energy: '4 Fire' }],
    },
    sane: b => b.affordable().includes('Lure') && b.them.bench.length === 2,
    expect: b => b.dragsUp('Lure') === 'Rattata',
  },
  {
    id: 'base1-93', card: 'Gust of Wind', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    // THE CONTROL, and the reason it is here: the fix makes the attack path
    // call the Trainer path's selection rather than growing a second one.
    // These two rows are what says the Trainer path did not move meanwhile.
    note: "To drag in a damaged bench pokemon to finish it off, preferably a strong one that could pose a menace. Bringing in a high damage pokemon from the bench with low HP can still lay a large hit on you before you have a turn to finish it off, and this card allows you to preempt that. It can also shift a dangerous pokemon out of the active spot and replace it with something else that doesn't have the energy to attack or retreat yet.",
    claim: "THE CONTROL - Gust already chooses, and takes the one that cannot swing",
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'Chansey', energy: '1 Fighting' },
      theirBench: [{ card: 'Charizard', energy: '4 Fire' }, { card: 'base1:Rattata' }],
      myHand: ['Gust of Wind'],
    },
    sane: b => b.playable('Gust of Wind') && b.them.bench.length === 2,
    expect: b => b.dragsUp('Gust of Wind') === 'Rattata',
  },
  {
    id: 'base1-93', card: 'Gust of Wind', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    note: "To drag in a damaged bench pokemon to finish it off, preferably a strong one that could pose a menace. Bringing in a high damage pokemon from the bench with low HP can still lay a large hit on you before you have a turn to finish it off, and this card allows you to preempt that. It can also shift a dangerous pokemon out of the active spot and replace it with something else that doesn't have the energy to attack or retreat yet.",
    claim: "THE CONTROL - ...and the same with the Bench reversed",
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      them: { card: 'Chansey', energy: '1 Fighting' },
      theirBench: [{ card: 'base1:Rattata' }, { card: 'Charizard', energy: '4 Fire' }],
      myHand: ['Gust of Wind'],
    },
    sane: b => b.playable('Gust of Wind') && b.them.bench.length === 2,
    expect: b => b.dragsUp('Gust of Wind') === 'Rattata',
  },
  // =================================================================== Switch
  // THE CARD IS WORTH THE RETREAT COST IT NULLIFIES, and the retreat cost was
  // not read at all. `T_SWITCH_OWN` scored danger, status, and nothing else - it
  // even computes the best destination and then discards its value, the same
  // shape the drag bug had.
  //
  // Measured: a Switch on a FREE-retreat Rattata scored 24.00 and was played,
  // when simply retreating would have done the identical thing and kept the
  // card. A Switch on a retreat-4 Snorlax - the card in the format it is worth
  // most on - scored -4.00 and was refused.
  //
  // TWO HALVES, AND ONLY ONE IS BUILDABLE WITHOUT ASKING HIM. "Does not want to
  // be used on a free-retreat cost pokemon" is a gate with no weight in it: if
  // the Active can retreat right now for nothing, the card buys nothing. "Prefers
  // heavier retreat costs to nullify" is a quantity, and pricing it means
  // deciding whether the saving is an addend or a multiplier on wanting to move
  // at all - which is circular the obvious way round. That half is `open:`.
  {
    id: 'base1-95', card: 'Switch', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    note: "To retreat a high value pokemon without paying the retreat cost, or launch a sudden switch for a quick attack that the opponent wasn't expecting. Does not want to be used on a free-retreat cost pokemon and prefers heavier retreat costs to nullify. Should not be played just because it exists in the bot's hand",
    claim: 'held when the Active can already retreat for free - retreating does the same and keeps the card',
    board: {
      me:   { card: 'base1:Rattata', energy: '1 Fighting' },   // retreat 0
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],
      them: { card: 'base1:Magmar', energy: '2 Fire' },
      myHand: ['Switch'],
    },
    sane: b => b.playable('Switch') && b.E.retreatCostOf(b.me.active) === 0
            && b.E.canRetreat(b.me.active) && !b.me.retreated,
    expect: b => !b.wouldPlay('Switch'),
  },
  {
    id: 'base1-95', card: 'Switch', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    // THE CONTROL. A free-retreat Active that CANNOT retreat - already retreated
    // this turn - is the case the gate must not swallow. Here the card is the
    // only way to move at all and the note's objection does not apply.
    note: "To retreat a high value pokemon without paying the retreat cost, or launch a sudden switch for a quick attack that the opponent wasn't expecting. Does not want to be used on a free-retreat cost pokemon and prefers heavier retreat costs to nullify. Should not be played just because it exists in the bot's hand",
    claim: 'THE CONTROL - ...but not held when the retreat has already been spent, where the card IS the move',
    board: {
      me:   { card: 'base1:Rattata', energy: '1 Fighting' },
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],
      them: { card: 'base1:Magmar', energy: '2 Fire' },
      myHand: ['Switch'],
      retreated: true,
    },
    sane: b => b.playable('Switch') && b.me.retreated === true,
    expect: b => b.wouldPlay('Switch'),
  },
  // ANSWERED AND BUILT — Trevor, 3 Sep 2026, and the answer was that the
  // question was the wrong one. This row asked whether the nullified retreat
  // cost should be an ADDEND or a SCALE, and it ended in capitals: ASK TREVOR.
  //
  // His answer: "I'm not sure we need to price cost at all... it would be almost
  // entirely situational without the exact retreat cost it was saving getting
  // much consideration beyond the fact that it's being saved. If you really
  // think we should price it, I'd say we should price it lower than the spot's
  // desire to run."
  //
  // MEASURED FIRST, AND IT IS ALREADY IN THE ARITHMETIC. A Switch does not pay
  // `retreatSaveEnergy` and a retreat does, so the Switch's advantage over
  // retreating rises with the cost with no term for it at all — 16.50 on a
  // Machop, 42.05 on an Onix, 55.35 on a Kangaskhan, same board otherwise. So
  // the note's own words, "prefers heavier retreat costs to nullify", were
  // already true and nobody had checked.
  //
  // WHAT WAS ACTUALLY BROKEN WAS THE OTHER HALF OF HIS SENTENCE. The Switch
  // scored a **flat -4.00 on every board that was not an emergency** — five
  // different Actives with five different Bench upgrades behind them, all
  // -4.00 — because `T_SWITCH_OWN` computed the gain and threw it away. "The
  // spot's desire to run" was not in the score, so the only Switch the bot ever
  // played was one escaping a Knock Out. The three rows below are that fix, and
  // two of them are controls because a term that makes the card playable is one
  // that can make it played for nothing.
  {
    id: 'base1-95', card: 'Switch', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    note: "To retreat a high value pokemon without paying the retreat cost, or launch a sudden switch for a quick attack that the opponent wasn't expecting. Does not want to be used on a free-retreat cost pokemon and prefers heavier retreat costs to nullify. Should not be played just because it exists in the bot's hand",
    claim: 'played to bring up a much better Pokemon, which is the "sudden switch" half of the note',
    board: {
      me:      { card: 'base1:Machop' },                              // nothing attached, cost 1
      them:    { card: 'base1:Charmander', energy: '1 Fire' },        // no emergency
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],        // charged and waiting
      myHand:  ['Switch'],
    },
    sane: b => b.playable('Switch') && b.E.retreatCostOf(b.me.active) > 0
            && b.threat() < b.hp()
            && b.ai.promoteValue(0, b.me.bench[0]) > b.ai.promoteValue(0, b.me.active),
    expect: b => b.wouldPlay('Switch'),
  },
  {
    id: 'base1-95', card: 'Switch', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    note: "To retreat a high value pokemon without paying the retreat cost, or launch a sudden switch for a quick attack that the opponent wasn't expecting. Does not want to be used on a free-retreat cost pokemon and prefers heavier retreat costs to nullify. Should not be played just because it exists in the bot's hand",
    // The wall rule reaching a card it was never written for. `promoteValue`
    // already knows Chansey is worth more standing in the Active spot than the
    // charged Hitmonchan behind it, so the gain goes NEGATIVE and the Switch
    // refuses itself. Nothing here is about Switch — this is WALLS.md holding
    // through a term added a fortnight later, and it is the row that would go
    // red if somebody "fixed" the gain by taking its absolute value.
    claim: 'THE CONTROL — but a wall does not run, even with a charged attacker behind it',
    board: {
      me:      { card: 'Chansey', energy: '2 Psychic' },
      them:    { card: 'base1:Charmander', energy: '1 Fire' },
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],
      myHand:  ['Switch'],
    },
    sane: b => b.playable('Switch') && b.E.retreatCostOf(b.me.active) > 0
            && b.threat() < b.hp(),
    expect: b => !b.wouldPlay('Switch'),
  },
  {
    id: 'base1-95', card: 'Switch', pattern: "Trainer (pattern unnamed - see PLAYBOOK.md)",
    note: "To retreat a high value pokemon without paying the retreat cost, or launch a sudden switch for a quick attack that the opponent wasn't expecting. Does not want to be used on a free-retreat cost pokemon and prefers heavier retreat costs to nullify. Should not be played just because it exists in the bot's hand",
    claim: 'THE CONTROL — and never to swap DOWN, which is the "not just because it exists in hand" half',
    board: {
      me:      { card: 'Hitmonchan', energy: '3 Fighting' },
      them:    { card: 'base1:Charmander', energy: '1 Fire' },
      myBench: [{ card: 'base1:Rattata' }],
      myHand:  ['Switch'],
    },
    sane: b => b.playable('Switch') && b.E.retreatCostOf(b.me.active) > 0
            && b.ai.promoteValue(0, b.me.bench[0]) < b.ai.promoteValue(0, b.me.active),
    expect: b => !b.wouldPlay('Switch'),
  },
  // =============================================================== Charmeleon
  // THE EVOLUTION ROAD CANNOT SEE WHETHER ITS CARRIER WILL LIVE TO TRAVEL IT.
  //
  // Trevor, 30 Aug 2026, verbatim: "A Charmeleon that isn't explicitly in a
  // stalling role doesn't want to fight, but if it finds itself fighting it
  // might still use Flamethrower if that's what it takes to survive. If a new
  // Charmander is gained while it's fighting, the AI might shift its future
  // evolution focus to that instead, if that one seems more realistic to get to
  // its full evolution at full power."
  //
  // Measured. Two Charmeleons, both on two Fire, one Charizard in hand, a threat
  // of 30 opposite. The road is rationed by `evolutionRoadFor` to "the
  // most-invested copy that is not yet ready", and the tie falls to the Active:
  //
  //   Active on 80 HP   attach -> Active 101.0   |   benched twin 62.0
  //   Active on 10 HP   attach -> Active 101.0   |   benched twin 62.0
  //
  // IDENTICAL. A Charmeleon that dies at the end of this turn holds the road as
  // firmly as a healthy one, and the healthy twin standing safely on the Bench
  // is passed over. Sweeping the Active from 80 HP down to 10 never moves the
  // number by a point.
  //
  // This row is RED ON PURPOSE and is a fault report, per TOOLING.md. The fix is
  // NOT being guessed at, and the `open:` says why - the obvious one lands on a
  // shared function carrying two shipped invariants.
  {
    id: 'base1-24', card: 'Charmeleon', pattern: 'Evolution timing',
    note: "Does decent damage but does not want to fight. Prefers to sit on the bench and pre-Over-Attach energies for an evolution to Charizard, even when Charizard isn't in the hand. Flamethrower does good damage but requires an energy funnel on the card that you want to evolve into the biggest energy funnel of all, so it's best avoided unless necessary. A Charmeleon that ends up fighting and having to use Flamethrower should almost be written off for evolution and used only as a fodder attacker.",
    claim: 'the evolution road goes to the twin that will live to reach the evolution',
    board: {
      me:   { card: 'base1:Charmeleon', energy: '2 Fire', dmg: 70 },   // 10 left under a threat of 30
      myBench: [{ card: 'base1:Charmeleon', energy: '2 Fire' }],       // the same investment, safe
      them: { card: 'base2:Snorlax', energy: '4 Fighting' },
      myHand: ['Fire Energy', 'Charizard'],
    },
    sane: b => b.me.bench.length === 1 && b.me.bench[0].energy.length === b.me.active.energy.length
            && b.threat() >= b.hp() && b.me.hand.length === 2,
    // SCORED BY SLOT, NOT BY LABEL. Both Pokemon here are called Charmeleon, so
    // `explain()`'s "Attach Fire Energy to Charmeleon" is the same string twice
    // and cannot say which one it means — the first version of this row read the
    // wrong one and stayed red after the fix had landed. Any claim about twins
    // has to go through the uid.
    expect: b => {
      const acts = b.E.legalActions(0).filter(a => a.t === 'attachEnergy');
      const at = u => { const a = acts.find(x => x.target === u); return a ? b.ai.scoreAction(0, a) : -Infinity; };
      return at(b.me.bench[0].uid) > at(b.me.active.uid);
    },
  },
  // ANSWERED AND CLOSED — Trevor, 31 Aug 2026, and this row used to be the
  // question. It asked whether a doomed carrier should have its road DISCOUNTED
  // (one line, inside `survivesCharge`, re-tuning every discard attack in the
  // game) or whether the doomed copy should simply STEP ASIDE (a selection
  // predicate in `evolutionRoadFor`, touching two cards). It ended in capitals:
  // ASK TREVOR WHICH.
  //
  // He answered the same day — "I'd say the active one is pretty safe to write
  // off... switching powerup focus to the Charmeleon on the bench" — the
  // selection route shipped, and the row above now asserts it. Nothing updated
  // this one, so `claimtest --open` went on printing a settled question as
  // outstanding work for two days. **An `open:` row is a worklist entry, and a
  // worklist entry that has been done is worse than one that was never written.**
  //
  // WHAT IT BECOMES IS THE GUARD, WHICH NOTHING ASSERTED. The invariant says in
  // capitals that a doomed copy steps aside ONLY WHEN SOMEBODY ELSE CAN TAKE THE
  // ROAD UP — a sole carrier keeps it however doomed it is, because there is no
  // better home for the Energy and refusing would strand it. That is what stops
  // the rule being a veto, it is the common single-copy case, and the twin row
  // above cannot see it: remove the guard and that row stays green while every
  // lone Charmeleon in the game quietly stops being fed.
  //
  // A CONTROL RATHER THAN A FAULT REPORT, said plainly. It passes today and is
  // here to go red on somebody's future change.
  {
    id: 'base1-24', card: 'Charmeleon', pattern: 'Evolution timing',
    note: "Does decent damage but does not want to fight. Prefers to sit on the bench and pre-Over-Attach energies for an evolution to Charizard, even when Charizard isn't in the hand. Flamethrower does good damage but requires an energy funnel on the card that you want to evolve into the biggest energy funnel of all, so it's best avoided unless necessary. A Charmeleon that ends up fighting and having to use Flamethrower should almost be written off for evolution and used only as a fodder attacker.",
    claim: 'THE GUARD — a SOLE carrier keeps its road however doomed, because nobody else can take it up',
    board: {
      me:      { card: 'base1:Charmeleon', energy: '2 Fire', dmg: 70 },  // 10 left under 30
      myBench: [{ card: 'base1:Vulpix', energy: '1 Fire' }],             // wants Fire, but is not on the road
      them:    { card: 'base2:Snorlax', energy: '4 Fighting' },
      myHand:  ['Fire Energy', 'Charizard'],
    },
    sane: b => b.threat() >= b.hp() && b.me.bench.length === 1
            && b.me.bench.every(x => b.E.db[x.stack[x.stack.length - 1].id].name !== 'Charmeleon'),
    expect: b => {
      const acts = b.E.legalActions(0).filter(a => a.t === 'attachEnergy');
      const at = u => { const a = acts.find(x => x.target === u); return a ? b.ai.scoreAction(0, a) : -Infinity; };
      return at(b.me.active.uid) > at(b.me.bench[0].uid);
    },
  },
  // ------------------------------------------- Charmeleon, the attack half --
  // Trevor, 31 Aug 2026, asked why Slash rather than Flamethrower when it does
  // not kill, since the Energy is lost anyway on a Pokemon being written off:
  //
  //   "If it's not actually going to die on the next turn, you can still
  //   maximize damage per energy spent by using Slash when Flamethrower can't
  //   kill. And even that energy funnel might be kept up if it looks like
  //   Charmeleon will survive to deal even more damage. Slash on the turns that
  //   Flamethrower wouldn't kill allows it to be a pest while not depriving the
  //   bench of energy due the funnel, except for maybe one or two turns where it
  //   resulted in a kill. If it seems like it *would* die on the next turn,
  //   burning that energy with Flamethrower just to maximize damage costs
  //   nothing."
  //
  // THREE CLAUSES AND THE SCORER REACHES NONE OF THEM. Measured at three Fire,
  // where Slash (CCC, 30) and Flamethrower (RRC, 50, discards a Fire) both cost
  // three, against a Chansey that survives either:
  //
  //   healthy, threat 0     Slash 30.0  Flamethrower 43.0  -> Flamethrower
  //   hurt, still survives  Slash 30.0  Flamethrower 43.0  -> Flamethrower
  //   dies next turn        Slash 30.0  Flamethrower 43.0  -> Flamethrower
  //
  // A FLAT 13-POINT GAP IN ALL THREE, and two separate reasons for it:
  //
  // (1) The discard costs a flat 7. `discardSilence` prices being unable to act
  //     and Charmeleon can always act, so the whole cost is one turn of silence
  //     at `energyDiscard`. Trevor's cost is somewhere else entirely - the
  //     attachment that must replace the burned Fire is one the BENCH does not
  //     get. That is the board-level opportunity cost `Playbook/AMMO.md` has
  //     named as unbuilt since 26 Aug and that three files call their blocker.
  //
  // (2) The dying clause cannot fire. `survivesCharge(pi, slot, 1)` returns 1
  //     even at `turnsLeft` zero, because the +1 hedge exactly cancels a
  //     one-symbol discard. That hedge is load-bearing elsewhere - three rows
  //     flip without it - so this is a genuine tension between two of Trevor's
  //     own rules rather than something to go and fix. RAISE IT, do not tune it.
  {
    id: 'base1-24', card: 'Charmeleon', pattern: 'Attack choice',
    note: "Does decent damage but does not want to fight. Prefers to sit on the bench and pre-Over-Attach energies for an evolution to Charizard, even when Charizard isn't in the hand. Flamethrower does good damage but requires an energy funnel on the card that you want to evolve into the biggest energy funnel of all, so it's best avoided unless necessary. A Charmeleon that ends up fighting and having to use Flamethrower should almost be written off for evolution and used only as a fodder attacker.",
    claim: 'Slash while it expects to live - the extra 20 is not worth an attachment the Bench needs',
    board: {
      me:   { card: 'base1:Charmeleon', energy: '3 Fire' },
      myBench: [{ card: 'base1:Charmeleon', energy: '2 Fire' }],   // the copy waiting on the funnel
      them: { card: 'Chansey', energy: '2 Fighting' },             // 120 HP: neither attack kills
      myHand: [],
    },
    sane: b => b.affordable().includes('Slash') && b.affordable().includes('Flamethrower')
            && b.lethal('Flamethrower') === 0 && b.ai.turnsLeft(0, b.me.active) > 0,
    expect: b => b.prefers('Slash'),
  },
  {
    id: 'base1-24', card: 'Charmeleon', pattern: 'Attack choice',
    // THE PAIR, and it is what stops "always Slash" passing as a fix.
    //
    // IT IS GREEN TODAY AND THAT IS A FALSE GREEN, recorded so nobody reads the
    // pair as half-solved. It passes because the bot prefers Flamethrower on
    // EVERY board, including the one above where it should not - so this row is
    // measuring the fault rather than the rule. It only starts meaning anything
    // once its twin goes green. Same shape as the Lure ordering pair: a row a
    // fault is winning looks exactly like a row a rule is winning.
    note: "Does decent damage but does not want to fight. Prefers to sit on the bench and pre-Over-Attach energies for an evolution to Charizard, even when Charizard isn't in the hand. Flamethrower does good damage but requires an energy funnel on the card that you want to evolve into the biggest energy funnel of all, so it's best avoided unless necessary. A Charmeleon that ends up fighting and having to use Flamethrower should almost be written off for evolution and used only as a fodder attacker.",
    claim: '...but Flamethrower once it will not see another turn, where the burn costs nothing',
    board: {
      me:   { card: 'base1:Charmeleon', energy: '3 Fire', dmg: 60 },
      myBench: [{ card: 'base1:Charmeleon', energy: '2 Fire' }],
      them: { card: 'Chansey', energy: '4 Fighting' },
      myHand: [],
    },
    sane: b => b.affordable().includes('Slash') && b.affordable().includes('Flamethrower')
            && b.lethal('Flamethrower') === 0 && b.ai.turnsLeft(0, b.me.active) === 0,
    expect: b => b.prefers('Flamethrower'),
  },
  // WRITTEN AS A REAL ROW — 2 Sep 2026. This was `open:` with the instruction
  // "write it as the control the moment either row above goes green", because a
  // green row here proves nothing on its own: a kill is already worth far more
  // than the 13-point gap the Slash rows are about, so this passes today and
  // would have passed before any of that work started.
  //
  // ITS VALUE IS ENTIRELY IN THE DIRECTION IT FAILS. The Slash row above is
  // still red, and whoever fixes it is going to make the bot prefer the smaller
  // attack. **A fix that made it prefer Slash into a lethal Flamethrower would
  // be worse than the fault it was closing** — and nothing else in this file
  // would have noticed. That is what a control is for, and it is needed MORE
  // while its neighbour is red, not less.
  {
    id: 'base1-24', card: 'Charmeleon', pattern: 'Attack choice',
    note: "Does decent damage but does not want to fight. Prefers to sit on the bench and pre-Over-Attach energies for an evolution to Charizard, even when Charizard isn't in the hand. Flamethrower does good damage but requires an energy funnel on the card that you want to evolve into the biggest energy funnel of all, so it's best avoided unless necessary. A Charmeleon that ends up fighting and having to use Flamethrower should almost be written off for evolution and used only as a fodder attacker.",
    claim: 'THE CONTROL — and Flamethrower whenever the extra 20 converts, which is the exception he names',
    board: {
      me:      { card: 'base1:Charmeleon', energy: '3 Fire' },
      them:    { card: 'base1:Squirtle' },        // 40 HP: Slash leaves 10, Flamethrower kills
      myBench: [{ card: 'base1:Charmander' }],    // a Bench that wants the Energy, so the trade is live
    },
    sane: b => b.lethal('Flamethrower') === 1 && b.lethal('Slash') === 0,
    expect: b => b.prefers('Flamethrower'),
  },

  // ===========================================================================
  // THE DESTINATION — 1 Sep 2026, Trevor's general rule for pre-evolution Energy:
  // price it at what the EVOLVED card needs for its cheapest attack worth
  // arriving for, minus one, since the last Energy can be attached on the turn it
  // evolves. `potentialOf().destShort`.
  //
  // Kadabra is the cleanest card in the era for it and Trevor's note settles it
  // in one clause: **"a pokemon that wants to stay at 3 energies at all times."**
  // Recover costs 2 and does nothing; Super Psy costs 3 and hits for 50.
  // ===========================================================================
  {
    id: 'base1-32', card: 'Kadabra', pattern: 'Evolution timing',
    note: "Super Psy does high damage for what it is, and even outdoes its own evolution's damage. The evolution is still preferred in most situations though due to its pokemon power and chance to confuse. Recover should never be used. It drains an energy from a pokemon that wants to stay at 3 energies at all times. Getting in a 50 dmg hit and dying is almost always preferable to recovery or retreat",
    claim: 'an Abra with only a Kadabra coming is fed a SECOND Psychic',
    // THE PAIR BELOW IS THE POINT AND ONE ROW COULD NEVER SAY IT: the same Abra
    // on the same Energy wants a different amount depending on how deep the plan
    // is. Kadabra's Super Psy costs 3, one evolution step supplies one of them on
    // the turn it evolves, so the target is 2.
    //
    // THIS ROW USED TO ASSERT A THIRD PSYCHIC and was written that way the same
    // day. It was a claim built on the depth-1 truncation — the rule looked
    // exactly one evolution ahead — and it went red the moment the depth rule
    // landed. **The bot was right and the claim was wrong**, which is the second
    // time that has happened here and is the outcome PLAYBOOK.md says to expect.
    // Trevor's "wants to stay at 3 energies at all times" is about KADABRA; the
    // Abra underneath it wants one fewer.
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base1:Abra', energy: '1 Psychic' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['base1:Kadabra', 'Psychic Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 1
            && b.me.hand.some(h => h.id === 'base1-32')
            && !b.me.hand.some(h => h.id === 'base1-1'),
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Abra') && e.score > 0),
  },
  {
    id: 'base1-32', card: 'Kadabra', pattern: 'Evolution timing',
    note: "Super Psy does high damage for what it is, and even outdoes its own evolution's damage. The evolution is still preferred in most situations though due to its pokemon power and chance to confuse. Recover should never be used. It drains an energy from a pokemon that wants to stay at 3 energies at all times. Getting in a 50 dmg hit and dying is almost always preferable to recovery or retreat",
    claim: '...but with an ALAKAZAM behind it, one Psychic is enough and the second is refused',
    // Trevor, 1 Sep 2026: *"It would only give Abra 1 energy. Why? Because
    // Alakazam needs 3, and Abra would need two turns to evolve twice."* Two
    // evolution steps, two turns, two attachments the line supplies itself — so
    // Confuse Ray's three symbols minus two steps is a target of one.
    //
    // The row above is the same board with the Alakazam removed and it wants a
    // second Energy. **Assert both or neither**: a single row here is green under
    // a rule that ignores depth entirely, which is what shipped hours earlier.
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base1:Abra', energy: '1 Psychic' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['base1:Kadabra', 'base1:Alakazam', 'Psychic Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 1
            && b.me.hand.some(h => h.id === 'base1-32')
            && b.me.hand.some(h => h.id === 'base1-1'),
    expect: b => b.explain().filter(e => e.label === 'attach'
            && (e.detail || '').includes('Abra')).every(e => e.score <= 0),
  },
  {
    id: 'base1-42', card: 'Wartortle', pattern: 'Evolution timing',
    note: "Only withdraws when it can't use Bite. Doesn't mind fighting while it waits to evolve",
    claim: 'THE CONTROL - a Squirtle is still fed at Withdraw\'s cost, because Bite is the destination',
    // The same rule on a card where the road and the evolve half still agree,
    // because Wartortle's own Basic is cheap enough that neither has run out.
    // Withdraw costs 2 and does nothing; Bite costs 3. If the destination rule
    // were reverted, this row would still pass — it is here to say the rule did
    // not break the ordinary case, not to prove the rule.
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'base1:Squirtle', energy: '1 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['base1:Wartortle', 'Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 1
            && b.me.hand.some(h => h.id === 'base1-42'),
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Squirtle') && e.score > 0),
  },

  // ===========================================================================
  // OVER-ATTACH — 31 Aug 2026, and these two Base Set cards are why the pattern
  // has a printed-text guard as well as an engine-agreement one.
  //
  // Blastoise, Poliwrath and Poliwag all print "extra Water Energy after the 2nd
  // doesn't count" and NONE of them carried the cap — written in Job 4b, before
  // Job 6 added `maxSpare` for the Jungle and Fossil Water Guns. The engine and
  // the scorer agreed perfectly on a number the card forbids.
  //
  // THE CONTROLS ARE THE POINT OF THESE ROWS. Trevor's Poliwrath note asks for
  // exactly one extra Energy past the cost ("willing to add that fifth energy"),
  // which is the cap landing precisely where he put it by hand. A cap off by one
  // in either direction fails one of the two rows below.
  // *[The pattern →](../../Playbook/OVER-ATTACH.md)*
  // ===========================================================================
  {
    id: 'base1-13', card: 'Poliwrath', pattern: 'Over-Attach',
    note: 'An Attack Choice, as both attacks are valid. Whirlpool is preferred due to the very high value of discarding opponent energy cards, but Water Gun can be Over-Attached into doing higher damage. Water Gun should be used when it results in a kill that Whrilpool wouldn\'t, and the bot should be willing to add that fifth energy to do so',
    claim: 'the FIFTH Water is added, which is the one his note names',
    // RED ON PURPOSE, AND THE FAULT IS IN THE ENGINE — 1 Sep 2026.
    //
    // The bot refuses it at -2.00 and it is right to, given what the engine
    // believes: `DMG_PER_SPARE_ENERGY` counts the cost's TYPED symbols only, so
    // a Water paying a COLORLESS symbol is not counted as used. Water Gun is
    // WWC. Four Water pay it with three cards and leave one spare, but the
    // engine reads `need = 2` and calls two of them spare — already at the
    // printed cap of two, so a fifth genuinely adds nothing to a number that was
    // 10 too high in the first place.
    //
    // MEASURED, and the second line is the one that settles it:
    //   Poliwrath, 4 Water                 -> engine deals 50, card says 40
    //   Poliwrath, 3 Water + 1 Fighting    -> engine deals 40, card says 40
    // The same three symbols are paid both times. Using a WORSE Energy to pay
    // the Colorless deals 10 LESS damage, which no reading of the card supports.
    //   Lapras, whose cost has no Colorless -> correct at every count (control)
    //
    // Affects the six live printings whose spare-Energy cost contains Colorless:
    // Poliwrath, both Vaporeons, Omastar, Seadra, Psyduck. NOT Blastoise, Lapras,
    // Omanyte, Poliwag or Dark Blastoise.
    //
    // TREVOR'S NOTE IS EVIDENCE FOR THE CORRECTION. "The bot should be willing to
    // add that fifth energy" is only true under the card's own arithmetic; under
    // the engine's, the fifth is worthless. He described the card, not the code.
    //
    // NOT FIXED HERE because it is an engine rules change, and the sub-question
    // it carries is a real one for Trevor: when both a Water and a non-Water
    // could pay the Colorless, the player picks the non-Water, and the engine
    // needs to be told to. See PLAYBOOK.md on asking. The row stays red until
    // then — it is a fault report, and it goes green when the engine is right.
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'Poliwrath', energy: '4 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 4 && b.me.hand.length === 1,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Poliwrath') && e.score > 0),
  },
  {
    id: 'base1-13', card: 'Poliwrath', pattern: 'Over-Attach',
    note: 'An Attack Choice, as both attacks are valid. Whirlpool is preferred due to the very high value of discarding opponent energy cards, but Water Gun can be Over-Attached into doing higher damage. Water Gun should be used when it results in a kill that Whrilpool wouldn\'t, and the bot should be willing to add that fifth energy to do so',
    claim: 'THE CONTROL - and the SIXTH is not, because the card stops counting at two spares',
    // He says "that fifth energy", not "energy". Water Gun costs WWC and the
    // printed cap is two spares, so five is the last one worth having — the note
    // and the card agree to the card, and this row is where that is checked.
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'Poliwrath', energy: '5 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 5 && b.me.hand.length === 1,
    expect: b => b.explain().filter(e => e.label === 'attach'
            && (e.detail || '').includes('Poliwrath')).every(e => e.score <= 0),
  },
  {
    id: 'base1-2', card: 'Blastoise', pattern: 'Over-Attach',
    note: "5-ish extra W energy in deck, Over-Attach 2 extra energy for Hydro Pump's max potential, which is worth it. Loves to fight. When it evolves, its user should immediately use Rain Dance to dump as many energy cards on their pokemon as those pokemon require, prioritizing the ones currently fighting and Blastoise itself",
    claim: 'the two extra for "Hydro Pump\'s max potential" are taken on the bench',
    // "5-ish extra W energy in deck" is a DECKBUILD want and is parked with the
    // others; this row is the play half of the same sentence.
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'Blastoise', energy: '4 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 4 && b.me.hand.length === 1,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Blastoise') && e.score > 0),
  },
  {
    id: 'base1-2', card: 'Blastoise', pattern: 'Over-Attach',
    note: "5-ish extra W energy in deck, Over-Attach 2 extra energy for Hydro Pump's max potential, which is worth it. Loves to fight. When it evolves, its user should immediately use Rain Dance to dump as many energy cards on their pokemon as those pokemon require, prioritizing the ones currently fighting and Blastoise itself",
    claim: 'THE CONTROL - "max potential" is 2 extra, so the sixth Water buys nothing',
    // The worst place in the game to be uncapped, which is why it gets a row:
    // Rain Dance can dump a whole hand of Water onto this card, and every one of
    // them was adding 10 to Hydro Pump until 31 Aug 2026.
    board: {
      me:   { card: 'Hitmonchan', energy: '3 Fighting' },
      myBench: [{ card: 'Blastoise', energy: '5 Water' }],
      them: { card: 'Hitmonchan', energy: '3 Fighting' },
      myHand: ['Water Energy'],
    },
    sane: b => b.me.bench[0].energy.length === 5 && b.me.hand.length === 1,
    expect: b => b.explain().filter(e => e.label === 'attach'
            && (e.detail || '').includes('Blastoise')).every(e => e.score <= 0),
  },

  // -------------------------------------------------------------- Hitmonchan --
  // NOT FROM THE WORKBOOK — Hitmonchan has no `Wants` cell. Trevor, 6 Sep 2026,
  // answering AI.md open item 12 directly: *"a pokemon like Hitmonchan or Raichu
  // should be powered up toward their bigger attack. Hitmonchan in particular is a
  // very good opener because Jab comes at a single energy cost and Special Punch
  // can be powered up in just a couple turns without having to evolve anything,
  // with Jab being used every turn that it spends powering up."*
  //
  // THIS IS THE CARD THE FIRST VERSION OF THE ATTACK ROAD COULD NOT REACH.
  // `destShort` pins at zero the moment any *threatening* attack is payable, and
  // Jab threatens — so the 5 Sep rule freed a Moltres and did nothing here.
  {
    id: 'base1-7', card: 'Hitmonchan', pattern: 'Over-Attach',
    note: "Trevor 6 Sep 2026: 'Hitmonchan in particular is a very good opener because Jab comes at a single energy cost and Special Punch can be powered up in just a couple turns without having to evolve anything, with Jab being used every turn that it spends powering up'",
    claim: 'fed past Jab toward Special Punch — the cheap attack is a placeholder, not the plan',
    board: {
      me:   { card: 'base1:Machop', energy: '' },
      myBench: [{ card: 'Hitmonchan', energy: '1 Fighting' }],
      them: { card: 'Lickitung', energy: '1 Water' },
      myHand: ['Fighting Energy'],
      turn: 9,
    },
    // Jab IS affordable, which is the whole difficulty: the card looks finished.
    // `short` and the Energy count only — NOT `upShort`, which this change
    // introduced. A precondition naming a new field makes the row UNUSABLE against
    // the bot before it rather than RED, which is the harness being honest and the
    // row proving nothing. Second time in two days; see this file's header.
    sane: b => b.ai.potential(0, b.me.bench[0], null).short === 0
            && b.me.bench[0].energy.length === 1,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Hitmonchan') && e.score > 0),
  },
  {
    id: 'base1-7', card: 'Hitmonchan', pattern: 'Over-Attach',
    note: "Trevor 6 Sep 2026: 'Hitmonchan in particular is a very good opener because Jab comes at a single energy cost and Special Punch can be powered up in just a couple turns without having to evolve anything, with Jab being used every turn that it spends powering up'",
    claim: 'THE CONTROL — and it STOPS at Special Punch, because nothing on the card is better',
    board: {
      me:   { card: 'base1:Machop', energy: '' },
      myBench: [{ card: 'Hitmonchan', energy: '3 Fighting' }],
      them: { card: 'Lickitung', energy: '1 Water' },
      myHand: ['Fighting Energy'],
      turn: 9,
    },
    sane: b => b.ai.potential(0, b.me.bench[0], null).short === 0
            && b.me.bench[0].energy.length === 3,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Hitmonchan') && e.score <= 0),
  },

  // ------------------------------------------------------------------ Raichu --
  // The workbook note is about ATTACK CHOICE and already has its own rows. This
  // is the other half, from Trevor 6 Sep 2026: *"Raichu prefers to use Agility
  // when Thunder won't kill... but it likes to have both attacks available so it
  // can choose between them at any given time depending on the situation."*
  //
  // **Having the choice is the thing being asserted, not taking it.** The two
  // existing Raichu rows assert it still picks Agility when Thunder cannot kill;
  // this one asserts it gets fed far enough for that choice to exist. A card that
  // correctly prefers the cheap attack and is therefore never charged has been
  // reasoned about twice and helped once.
  {
    id: 'base1-14', card: 'Raichu', pattern: 'Over-Attach',
    note: "To use Agility when Thunder wouldn't kill, or when Thunder risks a self-kill that isn't worthwhile. Does need some degree of Kamakaze Timing. Agility buys turns through damage *and status* denial on a coin flip, while Thunder risks 30 self-dmg on a coin flip. / Trevor 6 Sep 2026: 'it likes to have both attacks available so it can choose between them at any given time depending on the situation'",
    claim: 'fed past Agility toward Thunder, so the choice its note turns on actually exists',
    board: {
      me:   { card: 'base1:Machop', energy: '' },
      myBench: [{ card: 'base1:Raichu', energy: '1 Lightning, 2 Fire' }],
      them: { card: 'Lickitung', energy: '1 Water' },
      myHand: ['Lightning Energy'],
      turn: 9,
    },
    sane: b => b.ai.potential(0, b.me.bench[0], null).short === 0
            && b.me.bench[0].energy.length === 3,
    expect: b => b.explain().some(e => e.label === 'attach'
            && (e.detail || '').includes('Raichu') && e.score > 0),
  },
];

module.exports = { CLAIMS };

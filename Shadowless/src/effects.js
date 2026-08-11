// EFFECT SCRIPTS — hand-authored. Each card_id maps to its implemented behaviour.
// Attacks: `a` is an array parallel to CARD_DB[id].attacks; each entry is a verb list.
// Trainers/Energy: `t` is a verb list.
// A card absent from this table, or with a null entry, is NOT IMPLEMENTED and the
// deck validator will refuse to build a deck containing it.
//
// VERB REFERENCE — THIS LIST IS THE CONTRACT. Adding a verb to engine.js without
// adding it here is how the next card author reinvents it under a second name.
// It went stale once, during Base Set, and cost the Job 6 planning pass an hour of
// rediscovery: half the verbs Jungle and Fossil need were already built and
// undocumented. Every verb the engine implements appears below.
//
//   ATTACKS — whole-attack replacements. Intercepted BEFORE the normal pipeline,
//   so nothing else in the script runs:
//     METRONOME                    copy a CHOSEN attack of the defender's, re-entering
//                                  runAttack with self still the attacker. Cannot copy
//                                  another Metronome. See RULINGS.md
//     MIRROR_MOVE                  re-apply the defender's `lastAttackResult` flat, past
//                                  W/R. A recorded event, NOT a recomputation
//
//   ATTACKS — cost phase (checked for legality, paid on use; Metronome skips these):
//     COST_DISCARD_ENERGY {n, t}   discard n Energy providing type t, attached to self
//     COST_DISCARD_ALL_ENERGY      discard every Energy attached to self
//     ONCE_WHILE_IN_PLAY           this attack may be used only once per stay in play
//     REQUIRE_DEF_STATUS {s, label}  illegal unless the defender has status s
//
//   ATTACKS — damage-shaping. These REPLACE the printed damage and run in script
//   order, so a later one overwrites an earlier one:
//     FLIP_OR_NOTHING              flip; tails => whole attack does nothing
//     DMG_PER_HEAD {coins, per}    flip N coins; damage = per * heads
//     DMG_PER_COUNTER_SELF {per}   damage = per * (own damage / 10)
//     DMG_MINUS_PER_COUNTER_SELF {base, per}
//                                  base - per * (own damage / 10), floored at 0
//     DMG_PER_DEF_ENERGY {base, per}   base + per * Energy attached to the defender
//     DMG_PER_DEF_COUNTER {base, per}  base + per * damage counters on the defender
//     DMG_PER_SPARE_ENERGY {base, per, t}
//                                  base + per * (Energy of type t attached to self
//                                  MINUS what this attack's own cost needs). The
//                                  Water Gun / Hydro Pump family
//     DMG_HALF_REMAINING           half the defender's REMAINING HP, rounded up to 10
//                                  (Super Fang)
//     FLIP_BONUS_OR_RECOIL {base, bonus, recoil, label}
//                                  ONE flip governs both: heads => base + bonus,
//                                  tails => base and self takes `recoil`. Pass
//                                  recoil: 0 for a plain heads-bonus attack
//
//   ATTACKS — post-damage. All of these are skipped on a target whose effects are
//   blocked (Barrier); the ones acting on SELF are not:
//     STATUS {s}                   apply status to defender
//     STATUS_ON_FLIP {s}           flip; heads => apply status to defender
//     STATUS_COIN_EITHER {heads, tails}
//                                  heads one condition, tails the other — never nothing
//     TOXIC {n}                    Poison the defender, and set its between-turns
//                                  Poison damage to n instead of the usual 10
//     RECOIL {n}                   self takes n damage (never W/R, never Retaliate)
//     RECOIL_ON_FLIP {n, label}    flip; TAILS => self takes n damage
//     HEAL_SELF_ALL                remove all damage counters from self
//     HEAL_SELF_IF_DAMAGED {n}     remove n counters from self unless ALL damage
//                                  was prevented
//     BENCH_SPLASH {n}             n damage to every Benched Pokemon on BOTH sides,
//                                  ignoring Weakness/Resistance
//     BENCH_SPLASH_OWN {n}         n damage to your OWN Benched Pokemon only (Earthquake)
//     DISCARD_DEF_ENERGY           discard 1 Energy card from the defender
//     ATTACK_LOCK                  disable ONE of the defender's attacks (by index)
//                                  during the opponent's next turn (Amnesia)
//     JAM_DEFENDER {label}         defender must flip to attack next turn or it fails
//     WHIRLWIND                    the DEFENDING player chooses a Benched Pokemon and
//                                  switches it in. Sets state.pendingSwitch and defers
//                                  the end of turn — the one decision a player makes
//                                  during the opponent's turn
//     SWITCH_DEFENDER_CHOOSE       the ATTACKER picks one of the defender's benched
//                                  and drags it into the Active spot
//     BARRIER                      prevent ALL effects of attacks (incl. damage) on
//                                  self during the opponent's next turn
//     BARRIER_ON_FLIP {label}      flip; heads => the same (Agility)
//     PREVENT_ALL_DMG_SELF_ON_FLIP flip; heads => prevent all DAMAGE to self during the
//                                  opponent's next turn. Other effects still land
//     HARDEN {threshold}           prevent damage to self of `threshold` or less
//                                  during the opponent's next turn (after W/R)
//     DESTINY_BOND                 if something KOs self during the opponent's next
//                                  turn, that Pokemon is Knocked Out too
//     CONVERT_DEF_WEAKNESS         set the defender's Weakness to a chosen type,
//                                  PERMANENTLY while it stays in play (Conversion 1)
//     CONVERT_SELF_RESISTANCE      the same for self's Resistance (Conversion 2)
//
//   TRAINERS — `t` rather than `a`. Each is one whole card; the legality check and
//   the effect live in two switches in engine.js and BOTH must gain a case:
//     T_DRAW {n}                   T_HEAL {n}                T_POKEDEX {n}
//     T_ENERGY_RETRIEVAL {n}       T_DISCARD_ENERGY_THEN_HEAL {n}
//     T_SWITCH_OWN                 T_SWITCH_OPPONENT         T_SCOOP_UP
//     T_DISCARD_OPP_ENERGY         T_SUPER_ENERGY_REMOVAL    T_DEVOLUTION_SPRAY
//     T_PLUSPOWER                  T_DEFENDER                T_FULL_HEAL
//     T_LASS                       T_PROFESSOR_OAK           T_IMPOSTOR_OAK
//     T_MAINTENANCE                T_POKEMON_CENTER          T_REVIVE
//     T_POKEMON_FLUTE              T_COMPUTER_SEARCH         T_ITEM_FINDER
//     T_POKEMON_TRADER             T_POKEMON_BREEDER
//
// POKEMON POWERS
//   `p` is a single object, not a verb list — Powers are not attacks and don't
//   share the attack pipeline. They fire outside the attack step, and the ones
//   that say "as often as you like" fire repeatedly within one turn.
//
//   Every Base Set Power carries "can't be used if <self> is Asleep, Confused or
//   Paralyzed", so the engine gates ALL of them on that and no card restates it.
//   A Power works wherever its Pokemon is — Active or Bench — unless noted.
//
//   { kind, name, ... }
//     RETALIATE {dmg}        passive. When an opponent's attack damages this
//                            Pokemon, deal `dmg` back to the attacker, ignoring
//                            Weakness and Resistance. Fires even if this Pokemon
//                            is Knocked Out by that damage.
//     ENERGY_AS {type}       toggle, lasts the rest of the turn. Every Energy
//                            attached to this Pokemon counts as `type` for
//                            paying attack costs. Symbol COUNT is unchanged, so
//                            Double Colorless still pays for two.
//     MOVE_DAMAGE            interactive, repeatable. Move 1 damage counter
//                            between your own Pokemon. Illegal if it would Knock
//                            Out the receiving Pokemon.
//     MOVE_ENERGY {energy}   interactive, repeatable. Move 1 basic Energy of that
//                            type from one of your Pokemon to a different one.
//                            No restriction on the destination's type.
//     BUZZAP                 interactive, ONCE. Knocks out its own Pokemon and
//                            turns that card into an Energy card providing 2 of a
//                            chosen type, attached to another of your Pokemon.
//                            The opponent takes a Prize — see RULINGS.md, which
//                            is emphatic, and which two of us guessed wrong.
//                            Takes a `type` as well as a target, so its actions
//                            enumerate (target, type) pairs.
//     EXTRA_ATTACH {energy, targetType}
//                            interactive, repeatable. Attach 1 basic Energy of
//                            that type FROM HAND to one of your Pokemon of
//                            `targetType`. Does NOT consume the turn's one
//                            Energy attachment.
//
//   PASSIVE POWERS (Job 6b). Nothing fires these — they are CONSULTED at the
//   moment they matter, via engine.activePower(slot, kind). Never push one into
//   slot.effects: Toxic Gas switches every one of them on and off from either
//   side of the board, and a materialised copy would need resynchronising on
//   evolution, Knock Out, retreat and status. See ENGINE.md.
//
//     DAMAGE_HALVE           incoming damage is halved, rounded DOWN to the
//                            nearest 10, after Weakness and Resistance.
//                            (Kabuto Armor)
//     PREVENT_AT_LEAST {n}   incoming damage of n or MORE is prevented entirely.
//                            The inverse of HARDEN: big hits bounce, small ones
//                            land. (Invisible Wall)
//     FLIP_TO_NEGATE         one coin for the whole attack; heads prevents
//                            everything done to this Pokemon. Damage aimed
//                            elsewhere, and the attacker's own recoil, still
//                            happen. (Transparency)
//     STATUS_IMMUNE          cannot be given a Special Condition. (Thick Skinned)
//     NO_EVOLUTION           NEITHER player may play an Evolution card.
//                            (Prehistoric Power)
//     TOXIC_GAS              every Power except other Toxic Gases is switched
//                            off, both sides, from anywhere. (Muk)
//     RETREAT_DISCOUNT {n}   while BENCHED, this side's retreat costs n less.
//                            Stacks. (Retreat Aid)
//
//   `always: true` on a Power means the card prints no "can't be used if Asleep,
//   Confused or Paralyzed" clause and the blanket gate must not apply — Dodrio
//   and Dragonite. Every Base Set Power carries the clause; do not add `always`
//   without checking the printed text.
//
//   "1 <Type> Energy card" means a BASIC one. Double Colorless is excluded by
//   type anyway, but Rainbow Energy later on would not be, so the check is on
//   cls === 'Basic' rather than on the type alone.
//
//   Interactive Powers come in two shapes and the UI reads which from the
//   enumerated actions: those carrying `from` need a source click then a target
//   click; those without need only a target click.
//
//   Interactive Powers enumerate one legal action per (source, target) pair, so
//   the AI can score them like any other action and the UI can highlight them.
//
// LASTING EFFECTS — what the verbs above actually PUSH
//   Several verbs do their work by appending to `slot.effects`, which is an
//   ordered modifier chain read by computeDamage() and cleared by expiry. Reach
//   for an existing kind before inventing a verb; three of these have no verb of
//   their own yet and are placed only by Trainers.
//     DAMAGE_BONUS      {amount, label}     added AFTER W/R          (PlusPower)
//     DAMAGE_REDUCTION  {amount, label}     subtracted AFTER W/R     (Defender)
//     PREVENT_UP_TO     {threshold, label}  prevent if <= threshold  (Harden)
//     PREVENT_ALL_DAMAGE                    damage only, effects land
//     PREVENT_ALL_EFFECTS                   damage AND effects; also switches the
//                                           slot's own Power off (see powerUsable)
//     ATTACK_DISABLED   {idx, label}        one attack, by index     (Amnesia)
//     ATTACK_FLIP       {label}             must flip to attack      (Smokescreen)
//     DESTINY_BOND
//   `expireAtStartOfTurn: turn + 2` is the standard "during the opponent's next
//   turn" duration. An effect carrying a `card` discards that card when it expires.
//
// AND THE PART NO SUITE CAN SEE
//   ai.js scores attacks with a switch over these verb names, and a verb it has no
//   case for scores as PLAIN BASE DAMAGE — silently, forever. Adding a verb here
//   means adding it there too, or adding it to that file's explicit opt-out list.
//   See ENGINE.md, "The silent-failure surface".

const EFFECTS = {

  // ---- Brushfire ----
  'base1-12': { a: [                                   // Ninetales
    [{ v: 'SWITCH_DEFENDER_CHOOSE' }],                 //   Lure
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'R' }],      //   Fire Blast
  ]},
  'base1-69': { a: [                                   // Weedle
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],          //   Poison Sting
  ]},
  'base1-66': { a: [                                   // Tangela
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Bind
    [{ v: 'STATUS', s: 'Poisoned' }],                  //   Poisonpowder
  ]},
  'base1-55': { a: [                                   // Nidoran M
    [{ v: 'FLIP_OR_NOTHING' }],                        //   Horn Hazard
  ]},
  'base1-23': { a: [                                   // Arcanine
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'R' }],      //   Flamethrower
    [{ v: 'RECOIL', n: 30 }],                          //   Take Down
  ]},
  'base1-28': { a: [ [] ]},                            // Growlithe / Flare
  'base1-24': { a: [                                   // Charmeleon
    [],                                                //   Slash
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'R' }],      //   Flamethrower
  ]},
  'base1-68': { a: [                                   // Vulpix
    [{ v: 'STATUS_ON_FLIP', s: 'Confused' }],          //   Confuse Ray
  ]},
  'base1-46': { a: [                                   // Charmander
    [],                                                //   Scratch
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'R' }],      //   Ember
  ]},

  // ---- Overgrowth ----
  'base1-6': { a: [                                    // Gyarados
    [],                                                //   Dragon Rage
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Bubblebeam
  ]},
  'base1-35': { a: [                                   // Magikarp
    [],                                                //   Tackle
    [{ v: 'DMG_PER_COUNTER_SELF', per: 10 }],          //   Flail
  ]},
  'base1-64': { a: [                                   // Starmie
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'W' },       //   Recover
     { v: 'HEAL_SELF_ALL' }],
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Star Freeze
  ]},
  'base1-65': { a: [ [] ]},                            // Staryu / Slap
  'base1-17': { a: [                                   // Beedrill
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 30 }],        //   Twineedle
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],          //   Poison Sting
  ]},
  'base1-33': { a: [                                   // Kakuna
    [{ v: 'PREVENT_ALL_DMG_SELF_ON_FLIP' }],           //   Stiffen
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],          //   Poisonpowder
  ]},
  'base1-30': { a: [                                   // Ivysaur
    [],                                                //   Vine Whip
    [{ v: 'STATUS', s: 'Poisoned' }],                  //   Poisonpowder
  ]},
  'base1-44': { a: [                                   // Bulbasaur
    [{ v: 'HEAL_SELF_IF_DAMAGED', n: 1 }],             //   Leech Seed
  ]},

  // ---- Trainers ----
  'base1-75': { t: [{ v: 'T_LASS' }] },
  'base1-84': { t: [{ v: 'T_PLUSPOWER' }] },
  'base1-81': { t: [{ v: 'T_ENERGY_RETRIEVAL', n: 2 }] },
  'base1-95': { t: [{ v: 'T_SWITCH_OWN' }] },
  'base1-94': { t: [{ v: 'T_HEAL', n: 2 }] },
  'base1-93': { t: [{ v: 'T_SWITCH_OPPONENT' }] },
  'base1-92': { t: [{ v: 'T_DISCARD_OPP_ENERGY' }] },
  'base1-91': { t: [{ v: 'T_DRAW', n: 2 }] },
  'base1-90': { t: [{ v: 'T_DISCARD_ENERGY_THEN_HEAL', n: 4 }] },

  // ---- Blackout ----
  'base1-7': { a: [ [], [] ]},                         // Hitmonchan: Jab / Special Punch
  'base1-52': { a: [ [] ]},                            // Machop: Low Kick
  'base1-34': { a: [                                   // Machoke
    [{ v: 'DMG_MINUS_PER_COUNTER_SELF', base: 50, per: 10 }],  //   Karate Chop
    [{ v: 'RECOIL', n: 20 }],                                   //   Submission
  ]},
  'base1-63': { a: [                                   // Squirtle
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Bubble
    [{ v: 'PREVENT_ALL_DMG_SELF_ON_FLIP' }],           //   Withdraw
  ]},
  'base1-42': { a: [                                   // Wartortle
    [{ v: 'PREVENT_ALL_DMG_SELF_ON_FLIP' }],           //   Withdraw
    [],                                                //   Bite
  ]},
  'base1-27': { a: [                                   // Farfetch'd
    [{ v: 'FLIP_OR_NOTHING' }, { v: 'ONCE_WHILE_IN_PLAY' }],   //   Leek Slap
    [],                                                //   Pot Smash
  ]},
  'base1-56': { a: [                                   // Onix
    [],                                                //   Rock Throw
    [{ v: 'HARDEN', threshold: 30 }],                  //   Harden
  ]},
  'base1-62': { a: [                                   // Sandshrew
    [{ v: 'JAM_DEFENDER', label: 'Sand-attack' }],     //   Sand-attack
  ]},
  'base1-79': { t: [{ v: 'T_SUPER_ENERGY_REMOVAL' }] },
  'base1-88': { t: [{ v: 'T_PROFESSOR_OAK' }] },
  'base1-97': { t: [] },                               // Fighting Energy

  // ---- Zap! ----
  'base1-10': { a: [                                   // Mewtwo
    [{ v: 'DMG_PER_DEF_ENERGY', base: 10, per: 10 }],  //   Psychic
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'P' },       //   Barrier
     { v: 'BARRIER' }],
  ]},
  'base1-29': { a: [                                   // Haunter
    [{ v: 'STATUS', s: 'Asleep' }],                    //   Hypnosis
    [{ v: 'REQUIRE_DEF_STATUS', s: 'asleep', label: 'Asleep' }],  // Dream Eater
  ]},
  'base1-50': { a: [                                   // Gastly
    [{ v: 'STATUS_ON_FLIP', s: 'Asleep' }],            //   Sleeping Gas
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'P' },       //   Destiny Bond
     { v: 'DESTINY_BOND' }],
  ]},
  'base1-31': { a: [                                   // Jynx
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 10 }],        //   Doubleslap
    [{ v: 'DMG_PER_DEF_COUNTER', base: 20, per: 10 }], //   Meditate
  ]},
  'base1-32': { a: [                                   // Kadabra
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'P' },       //   Recover
     { v: 'HEAL_SELF_ALL' }],
    [],                                                //   Super Psy
  ]},
  'base1-43': { a: [                                   // Abra
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Psyshock
  ]},
  'base1-49': { a: [                                   // Drowzee
    [],                                                //   Pound
    [{ v: 'STATUS_ON_FLIP', s: 'Confused' }],          //   Confuse Ray
  ]},
  'base1-53': { a: [                                   // Magnemite
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Thunder Wave
    [{ v: 'BENCH_SPLASH', n: 10 },                     //   Selfdestruct
     { v: 'RECOIL', n: 40 }],
  ]},
  'base1-58': { a: [                                   // Pikachu
    [],                                                //   Gnaw
    [{ v: 'RECOIL_ON_FLIP', n: 10, label: 'avoid recoil?' }],  // Thunder Jolt
  ]},
  'base1-71': { t: [{ v: 'T_COMPUTER_SEARCH' }] },
  'base1-80': { t: [{ v: 'T_DEFENDER' }] },
  'base1-100': { t: [] },                              // Lightning Energy
  'base1-101': { t: [] },                              // Psychic Energy

  // ================= PASS 4a — remaining Base Set Pokemon =================
  // Vanilla (no effect text at all)
  'base1-26': { a: [ [] ]},                            // Dratini / Pound
  'base1-41': { a: [ [] ]},                            // Seel / Headbutt
  'base1-47': { a: [ [], [] ]},                        // Diglett
  'base1-60': { a: [ [], [] ]},                        // Ponyta
  'base1-61': { a: [ [] ]},                            // Rattata / Bite
  'base1-67': { a: [ [] ]},                            // Voltorb / Tackle

  'base1-3': { a: [                                    // Chansey
    [{ v: 'PREVENT_ALL_DMG_SELF_ON_FLIP' }],           //   Scrunch
    [{ v: 'RECOIL', n: 80 }],                          //   Double-edge
  ]},
  'base1-9': { a: [                                    // Magneton
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Thunder Wave
    [{ v: 'BENCH_SPLASH', n: 20 },                     //   Selfdestruct
     { v: 'RECOIL', n: 80 }],
  ]},
  'base1-11': { a: [                                   // Nidoking
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 30, bonus: 10, recoil: 10 }],   // Thrash
    [{ v: 'TOXIC', n: 20 }],                                            // Toxic
  ]},
  'base1-13': { a: [                                   // Poliwrath
    [{ v: 'DMG_PER_SPARE_ENERGY', base: 30, per: 10, t: 'W' }],         // Water Gun
    [{ v: 'DISCARD_DEF_ENERGY' }],                                      // Whirlpool
  ]},
  'base1-14': { a: [                                   // Raichu
    [{ v: 'BARRIER_ON_FLIP', label: 'Agility' }],      //   Agility
    [{ v: 'RECOIL_ON_FLIP', n: 30, label: 'avoid recoil?' }],           // Thunder
  ]},
  'base1-16': { a: [                                   // Zapdos
    [{ v: 'RECOIL_ON_FLIP', n: 30, label: 'avoid recoil?' }],           // Thunder
    [{ v: 'COST_DISCARD_ALL_ENERGY' }],                                 // Thunderbolt
  ]},
  'base1-18': { a: [                                   // Dragonair
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 30 }],        //   Slam
    [{ v: 'DISCARD_DEF_ENERGY' }],                     //   Hyper Beam
  ]},
  'base1-19': { a: [                                   // Dugtrio
    [],                                                //   Slash
    [{ v: 'BENCH_SPLASH_OWN', n: 10 }],                //   Earthquake
  ]},
  'base1-20': { a: [                                   // Electabuzz
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Thundershock
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 30, bonus: 10, recoil: 10 }],   // Thunderpunch
  ]},
  'base1-25': { a: [                                   // Dewgong
    [],                                                //   Aurora Beam
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Ice Beam
  ]},
  'base1-36': { a: [                                   // Magmar
    [],                                                //   Fire Punch
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'R' }],      //   Flamethrower
  ]},
  'base1-37': { a: [                                   // Nidorino
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 30 }],        //   Double Kick
    [],                                                //   Horn Drill
  ]},
  'base1-40': { a: [                                   // Raticate
    [],                                                //   Bite
    [{ v: 'DMG_HALF_REMAINING' }],                     //   Super Fang
  ]},
  'base1-45': { a: [                                   // Caterpie
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   String Shot
  ]},
  'base1-48': { a: [                                   // Doduo
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 10 }],        //   Fury Attack
  ]},
  'base1-51': { a: [                                   // Koffing
    [{ v: 'STATUS_COIN_EITHER', heads: 'Poisoned', tails: 'Confused' }],  // Foul Gas
  ]},
  'base1-54': { a: [                                   // Metapod
    [{ v: 'PREVENT_ALL_DMG_SELF_ON_FLIP' }],           //   Stiffen
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Stun Spore
  ]},
  'base1-59': { a: [                                   // Poliwag
    [{ v: 'DMG_PER_SPARE_ENERGY', base: 10, per: 10, t: 'W' }],         // Water Gun
  ]},

  // ================= PASS 4b — remaining Base Set Trainers =================
  'base1-82': { t: [{ v: 'T_FULL_HEAL' }] },              // Full Heal
  'base1-73': { t: [{ v: 'T_IMPOSTOR_OAK' }] },           // Impostor Professor Oak
  'base1-83': { t: [{ v: 'T_MAINTENANCE' }] },            // Maintenance
  'base1-85': { t: [{ v: 'T_POKEMON_CENTER' }] },         // Pokemon Center
  'base1-89': { t: [{ v: 'T_REVIVE' }] },                 // Revive
  'base1-86': { t: [{ v: 'T_POKEMON_FLUTE' }] },          // Pokemon Flute
  'base1-78': { t: [{ v: 'T_SCOOP_UP' }] },               // Scoop Up
  'base1-72': { t: [{ v: 'T_DEVOLUTION_SPRAY' }] },       // Devolution Spray
  'base1-74': { t: [{ v: 'T_ITEM_FINDER' }] },            // Item Finder
  'base1-77': { t: [{ v: 'T_POKEMON_TRADER' }] },         // Pokemon Trader
  'base1-87': { t: [{ v: 'T_POKEDEX', n: 5 }] },          // Pokedex
  'base1-76': { t: [{ v: 'T_POKEMON_BREEDER' }] },        // Pokemon Breeder
  'base1-96': { t: [] },                                  // Double Colorless Energy

  // ---- Basic Energy (no scripted behaviour needed) ----
  'base1-99': { t: [] },
  'base1-98': { t: [] },
  'base1-102': { t: [] },

  // ================= PASS 4d — the first Pokemon Powers =================
  'base1-4': {                                          // Charizard
    p: { kind: 'ENERGY_AS', name: 'Energy Burn', type: 'R' },
    a: [
      [{ v: 'COST_DISCARD_ENERGY', n: 2 }],             //   Fire Spin
    ],
  },
  'base1-8': {                                          // Machamp
    p: { kind: 'RETALIATE', name: 'Strikes Back', dmg: 10 },
    a: [
      [],                                               //   Seismic Toss
    ],
  },
  'base1-1': {                                          // Alakazam
    p: { kind: 'MOVE_DAMAGE', name: 'Damage Swap' },
    a: [
      [{ v: 'STATUS_ON_FLIP', s: 'Confused' }],         //   Confuse Ray
    ],
  },

  // ================= PASS 4e — the two Energy-shuffling Powers =================
  'base1-2': {                                          // Blastoise
    p: { kind: 'EXTRA_ATTACH', name: 'Rain Dance', energy: 'W', targetType: 'W' },
    a: [
      [{ v: 'DMG_PER_SPARE_ENERGY', base: 40, per: 10, t: 'W' }],   // Hydro Pump
    ],
  },
  'base1-15': {                                         // Venusaur
    p: { kind: 'MOVE_ENERGY', name: 'Energy Trans', energy: 'G' },
    a: [
      [],                                               //   Solarbeam
    ],
  },

  // ================= PASS 4h — Clefairy Doll =================
  // Nothing to script: it is never "played" as a Trainer. The empty entry is
  // what marks it implemented for the deck validator; everything it does lives
  // in the engine, gated on the generator's `playsAs` flag.
  'base1-70': { t: [] },                                // Clefairy Doll

  // ================= PASS 4g — the oddities =================
  // Poliwhirl needed nothing new at all: ATTACK_LOCK was already built and
  // already enforced in canUseAttack, it had simply never been wired to a card.
  'base1-38': { a: [                                    // Poliwhirl
    [{ v: 'ATTACK_LOCK' }],                             //   Amnesia
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 30 }],         //   Doubleslap
  ]},
  'base1-5': { a: [                                     // Clefairy
    [{ v: 'STATUS_ON_FLIP', s: 'Asleep' }],             //   Sing
    [{ v: 'METRONOME' }],                               //   Metronome
  ]},
  'base1-39': { a: [                                    // Porygon
    [{ v: 'CONVERT_DEF_WEAKNESS' }],                    //   Conversion 1
    [{ v: 'CONVERT_SELF_RESISTANCE' }],                 //   Conversion 2
  ]},
  'base1-57': { a: [                                    // Pidgey
    [{ v: 'WHIRLWIND' }],                               //   Whirlwind
  ]},
  'base1-22': { a: [                                    // Pidgeotto
    [{ v: 'WHIRLWIND' }],                               //   Whirlwind
    [{ v: 'MIRROR_MOVE' }],                             //   Mirror Move
  ]},

  // ================= PASS 4f — Buzzap =================
  'base1-21': {                                         // Electrode
    p: { kind: 'BUZZAP', name: 'Buzzap' },
    a: [
      [{ v: 'RECOIL_ON_FLIP', n: 10, label: 'Electric Shock' }],     // Electric Shock
    ],
  },

  // ============================================================================
  // JOB 6c — Jungle and Fossil, the cards needing no verb that did not exist.
  //
  // Only CANONICAL printings appear here. Each set prints its Rares twice and
  // the second printing is aliased at the bottom of this file, never copied.
  //
  // Four of these are playable only because 6b built the passive-Power layer
  // first: Mr. Mime, Snorlax, Aerodactyl, Haunter, Muk and Kabuto are one-line
  // `p:` declarations against kinds the engine already consults.
  // ============================================================================

  // ---- Jungle ----
  'base2-3': { a: [                                    // Flareon
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 10, bonus: 20, recoil: 0, label: 'Quick Attack' }],
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'R' }],      //   Flamethrower
  ]},
  'base2-4': { a: [                                    // Jolteon
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 10, bonus: 20, recoil: 0, label: 'Quick Attack' }],
    [{ v: 'DMG_PER_HEAD', coins: 4, per: 20 }],        //   Pin Missile
  ]},
  'base2-6': {                                         // Mr. Mime
    p: { kind: 'PREVENT_AT_LEAST', n: 30, name: 'Invisible Wall' },
    a: [[{ v: 'DMG_PER_DEF_COUNTER', base: 10, per: 10 }]],   // Meditate
  },
  'base2-9': { a: [                                    // Pinsir
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Irongrip
    [],                                                //   Guillotine
  ]},
  'base2-11': {                                        // Snorlax
    p: { kind: 'STATUS_IMMUNE', name: 'Thick Skinned' },
    a: [[{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }]],    //   Body Slam
  },
  'base2-36': { a: [                                   // Fearow
    [{ v: 'BARRIER_ON_FLIP', label: 'Agility' }],      //   Agility
    [],                                                //   Drill Peck
  ]},
  'base2-38': { a: [                                   // Lickitung
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Tongue Wrap
    [{ v: 'STATUS_ON_FLIP', s: 'Confused' }],          //   Supersonic
  ]},
  'base2-40': { a: [                                   // Nidorina
    [{ v: 'STATUS_ON_FLIP', s: 'Confused' }],          //   Supersonic
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 30 }],        //   Double Kick
  ]},
  'base2-41': { a: [                                   // Parasect
    [{ v: 'STATUS', s: 'Asleep' }],                    //   Spore
    [],                                                //   Slash
  ]},
  'base2-44': { a: [                                   // Rapidash
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 20, bonus: 10, recoil: 0, label: 'Stomp' }],
    [{ v: 'BARRIER_ON_FLIP', label: 'Agility' }],      //   Agility
  ]},
  'base2-45': { a: [                                   // Rhydon
    [],                                                //   Horn Attack
    // Ram. RECOIL then WHIRLWIND, in that order, because the card says "switch
    // the Pokemon even if Rhydon is knocked out" — pendingSwitch is set after
    // the self-damage and survives the Knock Out that may follow.
    [{ v: 'RECOIL', n: 20 }, { v: 'WHIRLWIND' }],
  ]},
  'base2-46': { a: [ [], [] ]},                        // Seaking / Horn Attack, Waterfall
  'base2-48': { a: [                                   // Weepinbell
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],          //   Poisonpowder
    [],                                                //   Razor Leaf
  ]},
  'base2-52': { a: [                                   // Exeggcute
    [{ v: 'STATUS', s: 'Asleep' }],                    //   Hypnosis
    [{ v: 'HEAL_SELF_IF_DAMAGED', n: 1 }],             //   Leech Seed
  ]},
  'base2-53': { a: [ [] ]},                            // Goldeen / Horn Attack
  'base2-54': { a: [                                   // Jigglypuff
    [{ v: 'STATUS', s: 'Asleep' }],                    //   Lullaby
    [],                                                //   Pound
  ]},
  'base2-59': { a: [                                   // Paras
    [],                                                //   Scratch
    [{ v: 'STATUS', s: 'Asleep' }],                    //   Spore
  ]},
  'base2-62': { a: [                                   // Spearow
    [],                                                //   Peck
    [{ v: 'MIRROR_MOVE' }],                            //   Mirror Move
  ]},

  // ---- Fossil ----
  'base3-1': {                                         // Aerodactyl
    p: { kind: 'NO_EVOLUTION', name: 'Prehistoric Power' },
    a: [[]],                                           //   Wing Attack
  },
  'base3-6': {                                         // Haunter
    p: { kind: 'FLIP_TO_NEGATE', name: 'Transparency' },
    a: [[{ v: 'STATUS', s: 'Asleep' }]],               //   Nightmare
  },
  'base3-13': {                                        // Muk
    p: { kind: 'TOXIC_GAS', name: 'Toxic Gas' },
    a: [[{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }]],     //   Sludge
  },
  'base3-35': { a: [                                   // Golduck
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Psyshock
    [{ v: 'DISCARD_DEF_ENERGY' }],                     //   Hyper Beam
  ]},
  'base3-36': { a: [                                   // Golem
    [],                                                //   Avalanche
    [{ v: 'BENCH_SPLASH', n: 20 }, { v: 'RECOIL', n: 100 }],   // Selfdestruct
  ]},
  'base3-37': { a: [                                   // Graveler
    [{ v: 'HARDEN', threshold: 30 }],                  //   Harden
    [],                                                //   Rock Throw
  ]},
  'base3-38': { a: [                                   // Kingler
    [{ v: 'DMG_PER_COUNTER_SELF', per: 10 }],          //   Flail
    [],                                                //   Crabhammer
  ]},
  'base3-39': { a: [                                   // Magmar
    [{ v: 'JAM_DEFENDER', label: 'Smokescreen' }],     //   Smokescreen
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],          //   Smog
  ]},
  'base3-41': { a: [                                   // Sandslash
    [],                                                //   Slash
    [{ v: 'DMG_PER_HEAD', coins: 3, per: 20 }],        //   Fury Swipes
  ]},
  'base3-44': { a: [                                   // Tentacruel
    [{ v: 'STATUS_ON_FLIP', s: 'Confused' }],          //   Supersonic
    [{ v: 'STATUS', s: 'Poisoned' }],                  //   Jellyfish Sting
  ]},
  'base3-45': { a: [                                   // Weezing
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],          //   Smog
    [{ v: 'BENCH_SPLASH', n: 10 }, { v: 'RECOIL', n: 60 }],    // Selfdestruct
  ]},
  'base3-46': { a: [                                   // Ekans
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],          //   Spit Poison
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Wrap
  ]},
  'base3-49': { a: [                                   // Horsea
    [{ v: 'JAM_DEFENDER', label: 'Smokescreen' }],     //   Smokescreen
  ]},
  'base3-50': {                                        // Kabuto
    p: { kind: 'DAMAGE_HALVE', name: 'Kabuto Armor' },
    a: [[]],                                           //   Scratch
  },
  'base3-54': { a: [                                   // Shellder
    [{ v: 'STATUS_ON_FLIP', s: 'Confused' }],          //   Supersonic
    [{ v: 'PREVENT_ALL_DMG_SELF_ON_FLIP' }],           //   Hide in Shell
  ]},
  // Mysterious Fossil. Needs no machinery at all — gen_cards sets playsAs from
  // the upstream `hp`, exactly as it does for Clefairy Doll. See ENGINE.md.
  'base3-62': { t: [] },

  // ============================================================================
  // JOB 6d — the cards unlocked by the first batch of new verbs.
  // ============================================================================

  'base2-5': { a: [                                    // Kangaskhan
    [{ v: 'DRAW', n: 1 }],                             //   Fetch
    [{ v: 'DMG_PER_HEAD', coins: 4, per: 20 }],        //   Comet Punch
  ]},
  'base2-7': { a: [                                    // Nidoqueen
    // Matched on card NAME, per Trevor. Counts every slot you have, which in
    // practice is the Bench — Nidoqueen is the one attacking. See RULINGS.md.
    [{ v: 'DMG_PER_NAMED_IN_PLAY', name: 'Nidoking', base: 20, per: 20 }],
    [],                                                //   Mega Punch
  ]},
  'base2-12': { a: [                                   // Vaporeon
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 10, bonus: 20, recoil: 0, label: 'Quick Attack' }],
    // "Extra Water Energy after the 2nd doesn't count" — a cap on the COUNT,
    // where the Fossil Water Guns cap the BONUS. Same cap, stated two ways.
    [{ v: 'DMG_PER_SPARE_ENERGY', base: 30, per: 10, t: 'W', maxSpare: 2 }],
  ]},
  'base2-16': { a: [                                   // Wigglytuff
    [{ v: 'STATUS', s: 'Asleep' }],                    //   Lullaby
    [{ v: 'DMG_PER_OWN_BENCH', base: 10, per: 10 }],   //   Do the Wave
  ]},
  'base2-33': { a: [                                   // Butterfree
    [{ v: 'WHIRLWIND' }],                              //   Whirlwind
    [{ v: 'HEAL_SELF_EQUAL_DAMAGE', half: true }],     //   Mega Drain
  ]},
  'base2-34': {                                        // Dodrio
    // No status clause printed on this card, so `always` — see ENGINE.md.
    p: { kind: 'RETREAT_DISCOUNT', n: 1, name: 'Retreat Aid', always: true },
    a: [[{ v: 'DMG_PER_COUNTER_SELF', base: 10, per: 10 }]],   // Rage
  },
  'base2-37': { a: [                                   // Gloom
    [{ v: 'STATUS', s: 'Poisoned' }],                  //   Poisonpowder
    [{ v: 'STATUS', s: 'Confused' }, { v: 'STATUS_SELF', s: 'Confused' }],   // Foul Odor
  ]},
  'base2-43': { a: [                                   // Primeape
    [{ v: 'DMG_PER_HEAD', coins: 3, per: 20 }],        //   Fury Swipes
    [{ v: 'STATUS_SELF_ON_TAILS', s: 'Confused', label: 'Tantrum' }],
  ]},
  'base2-47': { a: [                                   // Tauros
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 20, bonus: 10, recoil: 0, label: 'Stomp' }],
    [{ v: 'DMG_PER_COUNTER_SELF', base: 20, per: 10 },
     { v: 'STATUS_SELF_ON_TAILS', s: 'Confused', label: 'Rampage' }],
  ]},
  'base2-56': { a: [ [{ v: 'DRAW_ON_FLIP' }] ]},       // Meowth / Pay Day
  'base2-60': { a: [ [{ v: 'BENCH_SNIPE', n: 1, dmg: 10 }] ]},   // Pikachu / Spark
  'base2-63': { a: [                                   // Venonat
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Stun Spore
    [{ v: 'HEAL_SELF_EQUAL_DAMAGE' }],                 //   Leech Life
  ]},

  'base3-7': { a: [                                    // Hitmonlee
    [{ v: 'BENCH_SNIPE', n: 1, dmg: 20 }],             //   Stretch Kick
    [],                                                //   High Jump Kick
  ]},
  'base3-9': { a: [                                    // Kabutops
    [],                                                //   Sharp Sickle
    [{ v: 'HEAL_SELF_EQUAL_DAMAGE', half: true }],     //   Absorb
  ]},
  'base3-10': { a: [                                   // Lapras
    [{ v: 'DMG_PER_SPARE_ENERGY', base: 10, per: 10, t: 'W', maxSpare: 2 }],
    [{ v: 'STATUS_ON_FLIP', s: 'Confused' }],          //   Confuse Ray
  ]},
  'base3-11': { a: [                                   // Magneton
    [{ v: 'NO_WR' }],                                  //   Sonicboom
    [{ v: 'BENCH_SPLASH', n: 20 }, { v: 'RECOIL', n: 100 }],   // Selfdestruct
  ]},
  'base3-14': { a: [                                   // Raichu
    // "If your opponent has fewer than 3 Benched Pokemon, do the damage to each
    // of them" — BENCH_SNIPE already clamps n to the bench size.
    [{ v: 'BENCH_SNIPE', n: 3, dmg: 10 }],             //   Gigashock
  ]},
  'base3-34': { a: [                                   // Golbat
    [],                                                //   Wing Attack
    [{ v: 'HEAL_SELF_EQUAL_DAMAGE' }],                 //   Leech Life
  ]},
  'base3-40': { a: [                                   // Omastar
    [{ v: 'DMG_PER_SPARE_ENERGY', base: 20, per: 10, t: 'W', maxSpare: 2 }],
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 30 }],        //   Spike Cannon
  ]},
  'base3-42': { a: [                                   // Seadra
    [{ v: 'DMG_PER_SPARE_ENERGY', base: 20, per: 10, t: 'W', maxSpare: 2 }],
    [{ v: 'BARRIER_ON_FLIP', label: 'Agility' }],      //   Agility
  ]},
  'base3-57': { a: [                                   // Zubat
    [{ v: 'STATUS_ON_FLIP', s: 'Confused' }],          //   Supersonic
    [{ v: 'HEAL_SELF_EQUAL_DAMAGE' }],                 //   Leech Life
  ]},

  // ============================================================================
  // JOB 6d, second batch — lasting effects, restrictions and bench geometry.
  // ============================================================================

  'base2-1': { a: [                                    // Clefable
    [{ v: 'METRONOME' }],                              //   Metronome
    [{ v: 'DAMAGE_REDUCTION_SELF', n: 20, label: 'Minimize' }],
  ]},
  'base2-2': { a: [                                    // Electrode
    [],                                                //   Tackle
    [{ v: 'BENCH_SPLASH_TYPED', n: 10 }],              //   Chain Lightning
  ]},
  'base2-10': { a: [                                   // Scyther
    [{ v: 'BUFF_OWN_ATTACK', attack: 'Slash', base: 60, label: 'Swords Dance' }],
    [],                                                //   Slash
  ]},
  'base2-14': { a: [                                   // Victreebel
    [{ v: 'SWITCH_DEFENDER_CHOOSE' }],                 //   Lure
    [{ v: 'CANT_RETREAT_ON_FLIP', label: 'Acid' }],    //   Acid
  ]},
  'base2-35': { a: [                                   // Exeggutor
    [{ v: 'SWITCH_SELF_CHOOSE' }],                     //   Teleport
    [{ v: 'DMG_PER_ENERGY_HEADS', per: 20 }],          //   Big Eggsplosion
  ]},
  'base2-42': { a: [                                   // Persian
    [],                                                //   Scratch
    [{ v: 'DAMAGE_REDUCTION_FROM', n: 10, label: 'Pounce' }],
  ]},
  'base2-50': { a: [                                   // Cubone
    [{ v: 'DAMAGE_REDUCTION_FROM', n: 20, label: 'Snivel' }],
    [{ v: 'DMG_PER_COUNTER_SELF', base: 10, per: 10 }],   // Rage
  ]},
  'base2-51': { a: [                                   // Eevee
    [{ v: 'CANT_ATTACK_ON_FLIP', label: 'Tail Wag' }],
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 10, bonus: 20, recoil: 0, label: 'Quick Attack' }],
  ]},
  'base2-61': { a: [                                   // Rhyhorn
    [{ v: 'CANT_ATTACK_ON_FLIP', label: 'Leer' }],     //   Leer
    [],                                                //   Horn Attack
  ]},

  'base3-2': { a: [                                    // Articuno
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Freeze Dry
    [{ v: 'BENCH_SPLASH_FLIP_SIDE', n: 10, label: 'Blizzard' }],
  ]},
  'base3-15': { a: [                                   // Zapdos
    [{ v: 'BENCH_SPLASH_PER_FLIP', dmg: 20, selfPerTail: 10 }],   // Thunderstorm
  ]},
  'base3-31': { a: [                                   // Arbok
    [{ v: 'WHIRLWIND_ON_FLIP', label: 'Terror Strike' }],
    [{ v: 'STATUS', s: 'Poisoned' }],                  //   Poison Fang
  ]},
  // Cloyster's Clamp needed nothing new: FLIP_OR_NOTHING returns before the
  // post-damage loop runs, so the plain STATUS beside it is governed by that
  // same coin instead of flipping a second one. "Not even damage" falls out too.
  'base3-32': { a: [
    [{ v: 'FLIP_OR_NOTHING' }, { v: 'STATUS', s: 'Paralyzed' }],   // Clamp
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 30 }],        //   Spike Cannon
  ]},
  'base3-47': { a: [ [{ v: 'DMG_PER_HEAD_UNTIL_TAILS', per: 10 }] ]},   // Geodude
  'base3-48': { a: [                                   // Grimer
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Nasty Goo
    [{ v: 'DAMAGE_REDUCTION_SELF', n: 20, label: 'Minimize' }],
  ]},
  'base3-53': { a: [                                   // Psyduck
    [{ v: 'NO_TRAINERS_NEXT_TURN' }],                  //   Headache
    [{ v: 'DMG_PER_HEAD', coins: 3, per: 10 }],        //   Fury Swipes
  ]},

  // ============================================================================
  // JOB 6d, third batch — deck search, deck order, and the discard pile.
  // This finishes every Jungle and Fossil card that is not a Power or Ditto.
  // ============================================================================

  'base2-8': { a: [                                    // Pidgeot
    [],                                                //   Wing Attack
    [{ v: 'RETURN_DEFENDER_TO_HAND' }],                //   Hurricane
  ]},
  'base2-39': { a: [                                   // Marowak
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 30 }],        //   Bonemerang
    [{ v: 'SEARCH_BASIC_TO_BENCH', type: 'F' }],       //   Call for Friend
  ]},
  'base2-49': { a: [                                   // Bellsprout
    [],                                                //   Vine Whip
    [{ v: 'SEARCH_BASIC_TO_BENCH', name: 'Bellsprout' }],
  ]},
  'base2-57': { a: [                                   // Nidoran F
    [{ v: 'DMG_PER_HEAD', coins: 3, per: 10 }],        //   Fury Swipes
    // Either Nidoran, which is why the verb takes a list as well as a name.
    [{ v: 'SEARCH_BASIC_TO_BENCH', names: ['Nidoran ♂', 'Nidoran ♀'] }],
  ]},
  'base2-58': { a: [                                   // Oddish
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Stun Spore
    [{ v: 'SEARCH_BASIC_TO_BENCH', name: 'Oddish' }],  //   Sprout
  ]},
  'base2-64': { t: [{ v: 'T_POKE_BALL' }] },           // Poke Ball

  'base3-8': { a: [                                    // Hypno
    // Either deck. Rearranging THEIRS is a real effect even against an opponent
    // that sees everything — it decides what they draw and when. See RULINGS.md.
    [{ v: 'REARRANGE_TOP', n: 3 }],                    //   Prophecy
    [{ v: 'BENCH_SNIPE', n: 1, dmg: 10 }],             //   Dark Mind
  ]},
  'base3-12': { a: [                                   // Moltres
    [{ v: 'WILDFIRE' }],                               //   Wildfire
    [{ v: 'FLIP_OR_NOTHING' }],                        //   Dive Bomb
  ]},
  'base3-33': { a: [                                   // Gastly
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Lick
    [{ v: 'ENERGY_FROM_DISCARD', n: 2 }, { v: 'RECOIL', n: 10 }],   // Energy Conversion
  ]},
  'base3-51': { a: [                                   // Krabby
    [{ v: 'SEARCH_BASIC_TO_BENCH', name: 'Krabby' }],  //   Call for Family
    [],                                                //   Irongrip
  ]},
  'base3-55': { a: [                                   // Slowpoke
    [{ v: 'REQUIRE_SELF_DAMAGED' }, { v: 'HEAL_SELF_ON_FLIP', n: 1, label: 'Spacing Out' }],
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'P' }, { v: 'TRAINER_FROM_DISCARD' }],   // Scavenge
  ]},
  'base3-58': { t: [{ v: 'T_MR_FUJI' }] },             // Mr. Fuji
  'base3-59': { t: [{ v: 'T_ENERGY_SEARCH' }] },       // Energy Search
  'base3-60': { t: [{ v: 'T_GAMBLER' }] },             // Gambler
  'base3-61': { t: [{ v: 'T_RECYCLE' }] },             // Recycle

  // ============================================================================
  // JOB 6e — the interactive Powers. The seven passive ones shipped with their
  // cards in 6c; these are the ones the player drives.
  // ============================================================================

  'base2-13': {                                        // Venomoth
    p: { kind: 'CHANGE_OWN_TYPE', name: 'Shift' },
    a: [
      // One coin, two conditions. Poison sits outside the
      // Asleep/Confused/Paralyzed group, so both can be held at once.
      [{ v: 'STATUS_ON_FLIP', s: ['Confused', 'Poisoned'] }],   // Venom Powder
    ],
  },
  'base2-15': {                                        // Vileplume
    p: { kind: 'HEAL_ON_FLIP', n: 1, name: 'Heal' },
    a: [
      [{ v: 'DMG_PER_HEAD', coins: 3, per: 40 },
       { v: 'STATUS_SELF', s: 'Confused' }],           //   Petal Dance
    ],
  },
  'base2-55': {                                        // Mankey
    p: { kind: 'PEEK', name: 'Peek' },
    a: [[]],                                           //   Scratch
  },

  'base3-4': {                                         // Dragonite
    // No status clause printed at all, so `always` — see ENGINE.md.
    p: { kind: 'STEP_IN', name: 'Step In', always: true },
    a: [[{ v: 'DMG_PER_HEAD', coins: 2, per: 40 }]],   //   Slam
  },
  'base3-5': {                                         // Gengar
    // The only Power in the game that may deliberately Knock something Out, and
    // it hands over a Prize when it does. Confirmed intended by Trevor, who
    // names it his favourite thing about playing Psychic in the GBC game.
    p: { kind: 'MOVE_DAMAGE', name: 'Curse', side: 'opponent', allowKO: true, once: true },
    a: [[{ v: 'BENCH_SNIPE', n: 1, dmg: 10 }]],        //   Dark Mind
  },
  'base3-43': {                                        // Slowbro
    p: { kind: 'MOVE_DAMAGE', name: 'Strange Behavior', toSelf: true },
    a: [[{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }]],    //   Psyshock
  },
  'base3-52': {                                        // Omanyte
    p: { kind: 'REVEAL_OPP_HAND', name: 'Clairvoyance' },
    a: [[{ v: 'DMG_PER_SPARE_ENERGY', base: 10, per: 10, t: 'W', maxSpare: 2 }]],
  },
  'base3-56': {                                        // Tentacool
    p: { kind: 'COWARDICE', name: 'Cowardice' },
    a: [[]],                                           //   Acid
  },
};

// ---------------------------------------------------------------- ALIASES --
// Jungle and Fossil each print every Rare TWICE — once as Rare Holo and once as
// a non-holo Rare, the same character with the same everything. 31 of the 126
// new cards are exact mechanical duplicates of another card in their own set.
//
// They are aliased rather than copy-pasted. Two Vileplume entries that drift
// apart is a bug nobody would ever find: the game would play correctly right up
// until the moment you happened to own the other printing.
//
// `selftest.js` proves this table rather than trusting it, in both directions —
// every alias points at a mechanically identical card, and every mechanically
// identical pair is aliased. So a set that turns out to print a Rare twice with
// a real difference between them cannot be silently flattened, and a new
// duplicate pair cannot be silently missed.
const EFFECT_ALIASES = {
  'base2-17': 'base2-1',   // Clefable
  'base2-18': 'base2-2',   // Electrode
  'base2-19': 'base2-3',   // Flareon
  'base2-20': 'base2-4',   // Jolteon
  'base2-21': 'base2-5',   // Kangaskhan
  'base2-22': 'base2-6',   // Mr. Mime
  'base2-23': 'base2-7',   // Nidoqueen
  'base2-24': 'base2-8',   // Pidgeot
  'base2-25': 'base2-9',   // Pinsir
  'base2-26': 'base2-10',  // Scyther
  'base2-27': 'base2-11',  // Snorlax
  'base2-28': 'base2-12',  // Vaporeon
  'base2-29': 'base2-13',  // Venomoth
  'base2-30': 'base2-14',  // Victreebel
  'base2-31': 'base2-15',  // Vileplume
  'base2-32': 'base2-16',  // Wigglytuff
  'base3-16': 'base3-1',   // Aerodactyl
  'base3-17': 'base3-2',   // Articuno
  'base3-18': 'base3-3',   // Ditto
  'base3-19': 'base3-4',   // Dragonite
  'base3-20': 'base3-5',   // Gengar
  'base3-21': 'base3-6',   // Haunter
  'base3-22': 'base3-7',   // Hitmonlee
  'base3-23': 'base3-8',   // Hypno
  'base3-24': 'base3-9',   // Kabutops
  'base3-25': 'base3-10',  // Lapras
  'base3-26': 'base3-11',  // Magneton
  'base3-27': 'base3-12',  // Moltres
  'base3-28': 'base3-13',  // Muk
  'base3-29': 'base3-14',  // Raichu — the corpus words its reminder text a
                           //   fraction differently on the two printings
                           //   ("do the damage" / "do that damage"). Same rule.
  'base3-30': 'base3-15',  // Zapdos
};

// Applied by reference on purpose: the two ids resolve to the SAME object, so
// they cannot drift even if somebody mutates one at runtime.
for (const dup in EFFECT_ALIASES) {
  const src = EFFECTS[EFFECT_ALIASES[dup]];
  if (src) EFFECTS[dup] = src;
}

if (typeof module !== 'undefined') module.exports = { EFFECTS, EFFECT_ALIASES };

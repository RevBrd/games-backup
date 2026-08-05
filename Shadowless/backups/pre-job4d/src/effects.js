// EFFECT SCRIPTS — hand-authored. Each card_id maps to its implemented behaviour.
// Attacks: `a` is an array parallel to CARD_DB[id].attacks; each entry is a verb list.
// Trainers/Energy: `t` is a verb list.
// A card absent from this table, or with a null entry, is NOT IMPLEMENTED and the
// deck validator will refuse to build a deck containing it.
//
// VERB REFERENCE
//   cost phase (checked for legality, paid on use):
//     COST_DISCARD_ENERGY {n, t}   discard n Energy providing type t, attached to self
//     ONCE_WHILE_IN_PLAY           this attack may be used only once per stay in play
//   damage-shaping (replaces/gates the printed damage):
//     FLIP_OR_NOTHING              flip; tails => whole attack does nothing
//     DMG_PER_HEAD {coins, per}    flip N coins; damage = per * heads
//     DMG_PER_COUNTER_SELF {per}   damage = per * (own damage / 10)
//     DMG_MINUS_PER_COUNTER_SELF {base, per}
//                                  damage = base - per * (own damage / 10), floored at 0
//     DMG_PER_DEF_ENERGY {base, per}   base + per * Energy attached to the defender
//     DMG_PER_DEF_COUNTER {base, per}  base + per * damage counters on the defender
//     REQUIRE_DEF_STATUS {s, label}    attack is illegal unless the defender has status s
//   post-damage:
//     STATUS {s}                   apply status to defender
//     STATUS_ON_FLIP {s}           flip; heads => apply status to defender
//     RECOIL {n}                   self takes n damage (no weakness/resistance)
//     HEAL_SELF_ALL                remove all damage counters from self
//     HEAL_SELF_IF_DAMAGED {n}     remove n counters from self unless all damage prevented
//     PREVENT_ALL_DMG_SELF_ON_FLIP flip; heads => prevent all damage to self during
//                                  opponent's next turn
//     HARDEN {threshold}           prevent damage to self of `threshold` or less
//                                  during opponent's next turn (after W/R)
//     JAM_DEFENDER {label}         defender must flip to attack next turn or it fails
//     BARRIER                      prevent ALL effects of attacks (incl. damage) on self
//                                  during the opponent's next turn
//     DESTINY_BOND                 if something KOs self during the opponent's next
//                                  turn, that Pokemon is Knocked Out too
//     RECOIL_ON_FLIP {n, label}    flip; TAILS => self takes n damage
//     BENCH_SPLASH {n}             n damage to every Benched Pokemon on BOTH sides,
//                                  ignoring Weakness/Resistance
//     SWITCH_DEFENDER_CHOOSE       attacker picks one of defender's benched; swap to active
//   trainers:
//     T_DRAW {n} / T_HEAL {n} / T_DISCARD_ENERGY_THEN_HEAL {n} / T_SWITCH_OWN
//     T_SWITCH_OPPONENT / T_DISCARD_OPP_ENERGY / T_PLUSPOWER / T_LASS
//     T_ENERGY_RETRIEVAL {n} / T_PROFESSOR_OAK / T_SUPER_ENERGY_REMOVAL
//     T_DEFENDER / T_COMPUTER_SEARCH

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
};

if (typeof module !== 'undefined') module.exports = { EFFECTS };

// EFFECT SCRIPTS — hand-authored. Each card_id maps to its implemented behaviour.
// Attacks: `a` is an array parallel to CARD_DB[id].attacks; each entry is a verb list.
// Trainers/Energy: `t` is a verb list.
// A card absent from this table, or with a null entry, is NOT IMPLEMENTED and the
// deck validator will refuse to build a deck containing it.
//
// VERB REFERENCE — THIS LIST IS THE CONTRACT. Adding a verb to engine.js without
// adding it here is how the next card author reinvents it under a second name.
//
// IT WENT STALE TWICE, and the second time is why there is now a test. During
// Base Set it cost the Job 6 planning pass an hour of rediscovery — half the verbs
// Jungle and Fossil needed were already built and undocumented. By the Job 10
// survey on 17 Aug 2026 it had drifted again and further: 42 of 117 verbs were
// missing, five of them ones Team Rocket needs on its first day.
//
// NOTE FOR WHOEVER EDITS THIS PARAGRAPH: do not name those five, or any verb, in
// prose up here. The test below asks whether a verb's name appears anywhere in
// this header, so an example in a comment satisfies it forever. The first draft
// of this warning listed all five and silently exempted them — caught only by
// deleting an entry to check the test could go red, which is the one step that
// separates a guard from a decoration.
//
// A warning in prose did not survive two sets. `selftest.js` now asserts this list
// is complete and names anything missing, so the third drift fails a suite instead
// of costing an hour. **If that test is red, write the entry — do not delete the
// check.** Every verb the engine implements or a card uses appears below.
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
//     REQUIRE_EQUAL_ENERGY         illegal unless self and the defender have the
//                                  SAME NUMBER OF ENERGY CARDS attached. Cards,
//                                  not symbols — a Double Colorless counts once
//                                  though it pays for two (Synchronize)
//     REQUIRE_DEF_STATUS {s, label}  illegal unless the defender has status s
//     REQUIRE_SELF_DAMAGED         illegal unless self has damage to remove
//     REQUIRE_OPP_BENCH            illegal unless the opponent has a Benched
//                                  Pokemon. Printed on Fling and Drag Off, which
//                                  would otherwise empty their board entirely
//     REQUIRE_SELF_ENERGY {t}      illegal unless at least one Energy providing t
//                                  is attached to self. "Use this attack only if
//                                  there are any Fire Energy cards attached"
//     SEARCH_ENERGY_TO_SELF {t}    search the deck for a basic Energy card of type t
//                                  and attach it to the ATTACKER. Basic by CLASS —
//                                  the card says "Energy card" — so a Rainbow is
//                                  never found by it. Does NOT spend the turn's
//                                  one attachment, which governs playing an
//                                  Energy from HAND (Afternoon Nap)
//     SEARCH_BASIC_TO_BENCH {name|names|type}
//                                  put a Basic from the deck onto your Bench. Named,
//                                  a list of names, or by type; unqualified means
//                                  any. Illegal on a full Bench, which is checked
//                                  in the COST phase — hence its place here
//
//   ATTACKS — damage-shaping. These REPLACE the printed damage and run in script
//   order, so a later one overwrites an earlier one:
//     FLIP_OR_NOTHING              flip; tails => whole attack does nothing
//     DMG_PER_HEAD {coins, per, selfStatusAtHeads: {n, s}}
//                                  flip N coins; damage = per * heads.
//                                  `selfStatusAtHeads` reads THE SAME ROLL for a
//                                  condition on SELF at n or more heads, applied
//                                  after the damage — Petal Whirlwind. Two verbs
//                                  would flip six times and could pay full
//                                  damage without the Confusion, which is a
//                                  different card
//     DMG_PER_COUNTER_SELF {base, per}
//                                  base + per * (own damage / 10). `base` is
//                                  optional and defaults to 0 — Flail is pure
//                                  multiplication, Rage is "10 damage plus 10
//                                  more for each counter". UNDOCUMENTED UNTIL
//                                  JOB 13, and ai.js had quietly dropped it, so
//                                  four live cards scored low for months. If you
//                                  add a parameter to a verb, add it here too:
//                                  the completeness test below checks verb NAMES
//                                  and cannot see a missing argument.
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
//     DMG_PER_OWN_BENCH {base, per}    base + per * YOUR Benched Pokemon. A Clefairy
//                                  Doll counts — see RULINGS.md (Do the Wave)
//   NAME MATCHING IS DELIBERATELY CROSS-SET, and it will look like a bug the
//   first time it is seen. 31 Pokemon names are printed in more than one set —
//   Team Rocket reprints a pile of Base Set basics under identical names — so a
//   Base Set Magnemite counts toward a Team Rocket Magnemite's Magnetism, and a
//   Base Set Koffing is in Dark Weezing's blast. That is correct: the cards say
//   "Magnemite", not "this printing of Magnemite". Do not add a set check.
//   Trevor flagged the general case on 17 Aug 2026; the routes that reach it
//   today all run through Team Rocket, and Gym and Neo add many more.
//
//     DMG_PER_NAMED_IN_PLAY {name|names, base, per, where}
//                                  base + per * slots whose card NAME matches.
//                                  Name, not species (Boyfriends). `names` takes
//                                  a list. `where` picks the search: 'mine'
//                                  (default, every slot you have), 'bench'
//                                  (yours only — Magnetism), 'all' (BOTH sides,
//                                  which is what "in play" means — Mass Explosion)
//     DMG_PER_OPP_BENCH_TAILS {per}    THE OPPONENT flips one coin per Pokemon on
//                                  their own Bench; damage is per * TAILS, so a
//                                  wide bench is their liability (Bench Manipulation)
//     DMG_PER_ENERGY_HEADS {per, t, discardPerHead}
//                                  one coin per Energy ATTACHED — not per Energy
//                                  paid — and per * heads (Big Eggsplosion). `t`
//                                  narrows the count to one type and
//                                  `discardPerHead` then burns one per head,
//                                  which together are Continuous Fireball
//     DMG_PER_HEAD_UNTIL_TAILS {per}   flip until the first tails; per * heads.
//                                  Capped at 20 flips so a seed cannot hang a
//                                  turn, far beyond anything reachable (Stone Barrage)
//     NO_WR                        this attack ignores Weakness and Resistance.
//                                  Not damage-shaping strictly — it is read when
//                                  the damage is DEALT — but it belongs beside
//                                  them because it changes the number that lands
//     FLIP_BONUS_OR_RECOIL {base, bonus, recoil, label,
//                           statusOnHeads, discardOnHeads: {n, t},
//                           benchSplashOnHeads: {n, side}, snipeOnHeads: {dmg},
//                           barrierOnHeads, nothingOnTails}
//                                  ONE flip governs EVERYTHING listed: heads =>
//                                  base + bonus, plus a status on the defender
//                                  and/or an Energy discard off self; tails =>
//                                  base, and self takes `recoil`. Pass recoil: 0
//                                  for a plain heads-bonus attack.
//                                  REACH FOR THIS RATHER THAN STACKING VERBS when
//                                  a card ties several consequences to one coin.
//                                  Two verbs would flip twice, which is a
//                                  different card — it could pay the bonus and
//                                  miss the status. statusOnHeads is deferred to
//                                  the post-damage phase, so a Barrier stops it
//                                  exactly as it stops a printed STATUS
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
//     HEAL_SELF {n}                remove n COUNTERS from self, unconditionally.
//                                  Not HEAL_SELF_IF_DAMAGED, which is Leech
//                                  Seed's and reads the defender's protection
//                                  because its own text ties the heal to the
//                                  damage dealt. First Aid touches nobody else
//     HEAL_SELF_ALL                remove all damage counters from self
//     HEAL_SELF_IF_DAMAGED {n}     remove n counters from self unless ALL damage
//                                  was prevented
//     BENCH_SPLASH {n, side}       n damage to Benched Pokemon, ignoring
//                                  Weakness/Resistance. Default is BOTH sides,
//                                  which is the Selfdestruct family;
//                                  `side: 'theirs'` is Poison Vapor
//     BENCH_SPLASH_OWN {n}         n damage to your OWN Benched Pokemon only (Earthquake)
//     BENCH_SPLASH_TYPED {n}       n to every Benched Pokemon on BOTH sides sharing
//                                  the DEFENDER's type. A Colorless defender stops
//                                  it dead, which is the card's clause and not a
//                                  guard (Chain Lightning)
//     BENCH_SPLASH_PER_FLIP {dmg}  a coin per opposing Benched Pokemon; heads hits
//                                  it, and every tail comes back at you (Thunderstorm)
//     BENCH_SPLASH_FLIP_SIDE {n}   ONE coin decides whose Bench takes it (Blizzard)
//     MIRROR_SHELL                 anything that damages SELF during the
//                                  opponent's next turn is answered for the same
//                                  amount, aimed at whoever is Active opposite —
//                                  and it fires even if self was Knocked Out by
//                                  it, which is why it hangs off dealDamage
//                                  beside RETALIATE rather than off checkKOs
//     BENCH_SNIPE {n, dmg, target, suppressPower, label}
//                                  dmg to n of the opponent's Pokemon, chosen by
//                                  the ATTACKER, never W/R. DEFAULT IS BENCH ONLY,
//                                  which is what Base Set's wording asks for
//                                  (Dark Mind, Gigashock). `target: 'any'` widens
//                                  it to include the Active, which is what Team
//                                  Rocket's "1 of your opponent's Pokemon" wording
//                                  asks for and is a materially stronger card.
//                                  PROTECTION IS CHECKED PER TARGET here, not
//                                  inherited from the defender, because a snipe
//                                  can hit a Benched Pokemon. `suppressPower`
//                                  switches the chosen target's Power off until
//                                  the end of the opponent's next turn (Stare) —
//                                  it rides the SAME chosen target, which is why
//                                  it is a flag and not a second verb
//     SHUFFLE_OPP_DECK             shuffle the opponent's deck (Mischief)
//     SWITCH_DEFENDER_FIRST        drag one of their Benched up BEFORE the damage
//                                  and hit what came up. COST-PHASE, unlike
//                                  SWITCH_DEFENDER_CHOOSE which replaces the
//                                  defender AFTER hitting it — Drag Off against
//                                  Lure, and the two are not interchangeable
//     OPTIONAL_DISCARD_THEN_SNIPE {t, n, dmg}
//                                  you MAY burn n Energy of type t; if you do,
//                                  and only if they have a Bench, snipe one of
//                                  their Benched for dmg. Declining is
//                                  `costUids: []`; ABSENT means take it, so the
//                                  AI and older callers stay aggressive
//     SCATTER_OWN_ENERGY           move EVERY Energy off the attacker onto your
//                                  own Bench, distributed as you like; DISCARD it
//                                  all if you have no Bench (Energy Bomb)
//     DMG_PER_HEAD_IN_PLAY {per}   one coin per Pokemon IN PLAY — both sides,
//                                  Actives and Benches — damage = per * heads,
//                                  and self takes per * TAILS off the SAME roll.
//                                  The self-damage is a parameter rather than a
//                                  RECOIL beside it because the two halves must
//                                  sum to the coin count (Miraculous Comeback)
//     BIRTHDAY {month, day, base, bonus, whose}
//                                  base damage, except on one calendar date when
//                                  a coin pays the bonus. THE ONLY THING IN THE
//                                  ENGINE THAT READS THE WORLD OUTSIDE THE GAME,
//                                  so a seeded replay of a match played on that
//                                  date does NOT reproduce in another month —
//                                  the birthday branch consumes a coin the
//                                  ordinary branch does not. `cfg.today` pins it
//                                  for tests and is where a player profile would
//                                  eventually supply a real date
//                                  (_____'s Pikachu, Birthday Surprise)
//     SWITCH_DEFENDER_CHOOSE_ON_FLIP {label}
//                                  flip; heads => the ATTACKER drags one of their
//                                  Benched into the Active spot. Gust of Wind on
//                                  a coin. No Bench means no coin at all rather
//                                  than a coin that cannot pay, so the attack
//                                  stays legal and does nothing (Tempt)
//     DISCARD_ENERGY_COIN {heads: {n, t}, label}
//                                  ONE coin choosing between two DIFFERENT
//                                  discards off self: `heads` on heads, EVERYTHING
//                                  on tails. Pair it with REQUIRE_SELF_ENERGY for
//                                  "if you can't discard, this attack does
//                                  nothing" — an attack that can do nothing should
//                                  be refused rather than waste the turn
//                                  (Hyper Flame)
//     ENERGY_FROM_DISCARD_TO_SELF {n}
//                                  take UP TO n Energy cards out of your discard
//                                  pile and ATTACH them to the attacker. The
//                                  sibling above puts them in HAND and that is a
//                                  different card. Does NOT spend the turn's one
//                                  attachment, which governs playing an Energy
//                                  from hand — same reasoning as
//                                  SEARCH_ENERGY_TO_SELF (Energy Absorption)
//     DAMAGE_HALVE_SELF {label}    damage to self is HALVED during the opponent's
//                                  next turn, rounded DOWN to the nearest 10.
//                                  Shares its arithmetic with the passive Power
//                                  of the same name (Kabuto Armor) and
//                                  computeDamage reads both, applying it once
//                                  rather than compounding. NOT a Barrier —
//                                  "any other effects of attacks still happen",
//                                  so statuses and discards land (Light Screen)
//     DEVOLVE_CHOOSE               return the HIGHEST Stage Evolution card on any
//                                  ONE evolved Pokemon, either side, to its
//                                  OWNER'S HAND — so a Stage 2 becomes a Stage 1
//                                  rather than collapsing to its Basic. Status
//                                  and effects clear exactly as doEvolve clears
//                                  them, which is what "just as if you had
//                                  evolved it" asks for. Not T_DEVOLUTION_SPRAY:
//                                  that DISCARDS, and only hits your own side
//                                  (Devolution Beam)
//     MOVE_OPP_ENERGY_ON_FLIP      flip; heads => move one BASIC Energy from any
//                                  of the OPPONENT'S Pokemon to any other of
//                                  theirs, attacker choosing both ends. Magnetic
//                                  Lines with both ends free and a coin on it;
//                                  basic by CLASS, so a Rainbow never moves
//                                  (Energy Control)
//     CAT_PUNCH {dmg}              flip; heads => dmg to the Defending Pokemon
//                                  normally. Tails => THE DEFENDING PLAYER names
//                                  one of their own Benched Pokemon and it takes
//                                  dmg with no W/R. Tails with an empty Bench
//                                  does nothing, and the Active is never the
//                                  tails target. Rides engine.ask(), so the
//                                  damage lands in resolveAsk and not here
//     MOVE_DEF_ENERGY_TO_BENCH     take one BASIC Energy off the defender and put
//                                  it on one of THEIR Benched. Basic by CLASS, so
//                                  Rainbow does not qualify — the card says
//                                  "Energy card". Nothing happens with no basic
//                                  Energy or no Bench (Magnetic Lines)
//     SHUFFLE_INTO_DECK {target, attached}
//                                  put a Pokemon and its pile into its OWNER's
//                                  deck and shuffle. target 'self' or 'defender';
//                                  attached 'deck' (everything goes, Fling) or
//                                  'discard' (the Energy burns, Vanish). The
//                                  owner promotes if it was their Active
//     BENCH_SPLASH_DOUBLE_FLIP {hi, lo, label}
//                                  first coin decides WHETHER their Bench is hit,
//                                  second decides HOW HARD. The attack's own
//                                  damage lands either way (Surprise Thunder)
//     SPLASH_NAMED {names, n}      n to EVERY Pokemon in play whose card name is
//                                  in the list, both sides, THE ATTACKER
//                                  INCLUDED, never W/R. Shares its enumeration
//                                  with DMG_PER_NAMED_IN_PLAY `where: 'all'`,
//                                  which is what the Mass Explosion ruling
//                                  requires rather than a convenience
//     EVOLVE_SELF_FROM_DECK {names}
//                                  search the deck for one of the named Evolution
//                                  cards and put it on the ATTACKER, which counts
//                                  as evolving — stack, evolvedTurn and status
//                                  clear, exactly as doEvolve does them. Then
//                                  shuffle. The player picks which (Rapid Evolution)
//     STATUS_SELF {s}              apply status to SELF. `blocked` is deliberately
//                                  not consulted — the defender's Barrier has no
//                                  bearing on what you do to yourself (Petal Dance)
//     STATUS_SELF_ON_TAILS {s, label}   flip; TAILS => the same
//     DRAW {n}                     draw n
//     DRAW_ON_FLIP                 flip; heads => draw one
//     ENERGY_FROM_DISCARD {n}      take UP TO n Energy cards out of your discard
//                                  pile into your hand; an empty pile is fine
//     TRAINER_FROM_DISCARD         take one Trainer back out of your discard pile
//     HEAL_SELF_EQUAL_DAMAGE {half}    remove damage from self equal to what this
//                                  attack just dealt, or half of it rounded up
//     HEAL_SELF_ON_FLIP {n}        flip; heads => remove n from self
//     DAMAGE_REDUCTION_SELF {n, label}   incoming damage to self reduced by n
//                                  during the opponent's next turn (Minimize)
//     DAMAGE_REDUCTION_FROM {n, label}  the same, but only from THIS defender.
//                                  `fromUid` also implements "if either is
//                                  Benched this ends", for free (Pounce, Snivel)
//     BUFF_OWN_ATTACK {attack, base, label}
//                                  one named attack of self does `base` during
//                                  your next turn (Swords Dance)
//     CANT_ATTACK_ON_FLIP {label}  flip; heads => the defender cannot attack THIS
//                                  Pokemon during the opponent's next turn (Tail Wag)
//     CANT_RETREAT_ON_FLIP {label} flip; heads => the defender cannot retreat
//                                  during the opponent's next turn (Acid)
//     NO_TRAINERS_NEXT_TURN        the opponent may play no Trainer during their
//                                  next turn. Sets `noTrainersUntil` rather than
//                                  pushing an effect, because it is a PLAYER-level
//                                  restriction and not a slot's
//     WHIRLWIND_ON_FLIP {label}    flip; heads => WHIRLWIND. The damage lands
//                                  either way; only the switch rides the coin
//     SWITCH_SELF_CHOOSE {optional}
//                                  Bench. No retreat cost, no Energy, and it does
//                                  not use up the turn's retreat (Teleport).
//                                  `optional: true` makes it "you MAY switch" —
//                                  the player can decline with `bench: -1`, which
//                                  is the difference between Teleport and Teleport
//                                  Blast and is not cosmetic
//     RETURN_DEFENDER_TO_HAND      the defender and everything on it go back to
//                                  its owner's hand — UNLESS the attack Knocked it
//                                  Out, in which case the Knock Out simply
//                                  happens (Hurricane)
//     WILDFIRE                     discard as many Fire Energy off self as the
//                                  player chooses, and mill one card off the
//                                  opponent's deck for each. The COUNT is the
//                                  player's, capped at what is attached
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
//     CONVERT_DEF_WEAKNESS {endsOnBench}
//                                  set the defender's Weakness to a chosen type,
//                                  PERMANENTLY while it stays in play (Conversion 1)
//     CONVERT_SELF_RESISTANCE {endsOnBench}
//                                  the same for self's Resistance (Conversion 2)
//                                  `endsOnBench` is Texture Magic's parenthetical
//                                  and NOTHING else in the era carries it, so it
//                                  is per-card. Swept by settleConversions() the
//                                  way Ditto's Transform is, because there are
//                                  seven routes onto the Bench and a clear-on-move
//                                  would have to find all of them. The two halves
//                                  expire SEPARATELY — "the effect on that
//                                  Pokemon" — so one can be Benched while the
//                                  other keeps what it was given
//
//   SPECIAL ENERGY — also `t`, because a card is either a Trainer or an Energy and
//   never both, and `isImplemented` already reads `t` for everything that is not
//   a Pokemon. The verbs are prefixed E_ so the two namespaces stay readable.
//
//   These run ON ATTACHMENT FROM HAND and nowhere else — all three of the era's
//   on-attach Energy print "if you play this card from your hand", which is the
//   played-from-hand rule one card kind along. Energy Trans moving one, or a
//   Buzzapped Electrode becoming one, must not re-fire it. See doAttach.
//
//   Kept deliberately small: the era has eight distinct special Energy and only
//   three do anything on arrival. The other five are CONTINUOUS — Metal reduces
//   incoming damage, Darkness adds to outgoing — and that is a different system
//   that nobody needs before Neo. Do not build it early.
//
//     E_CLEAR_STATUS               remove every Special Condition from the
//                                  Pokemon it lands on. ONE-SHOT, not a
//                                  continuous immunity: it can be Paralyzed
//                                  again next turn and the card stays attached
//                                  as plain Colorless (Full Heal Energy)
//     E_HEAL {n}                   remove n damage, capped at what is there.
//                                  "If it has any" — an undamaged Pokemon is a
//                                  legal target and simply gets nothing
//                                  (Potion Energy)
//     E_SELF_DAMAGE {n}            n damage to the Pokemon it lands on, never
//                                  W/R. IT CAN KNOCK THAT POKEMON OUT and hand
//                                  the opponent a Prize — the Buzzap principle,
//                                  and doAttach calls checkKOs for it
//                                  (Rainbow Energy)
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
//     T_POKEMON_TRADER             T_POKEMON_BREEDER         T_POKE_BALL
//     T_ENERGY_SEARCH              T_GAMBLER                 T_MR_FUJI
//     T_RECYCLE
//     T_DUEL                       Misty's Duel. A coin decides the winner, and the
//                                  WINNER shuffles their hand away and draws 5. The
//                                  card prints the coin substitution itself
//     T_TICKLE                     Tickling Machine. Heads: the opponent's whole hand
//                                  goes to the set-aside zone until the end of their
//                                  next turn. Tails: your turn ends with no attack
//     T_STADIUM {gym, n, who, names, onPlay}
//                                  GYM HEROES. Installs this card in the board-wide
//                                  Stadium zone instead of discarding it; whatever
//                                  was there is discarded to ITS OWNER's pile. The
//                                  card's own text says the newcomer wins. `gym` is
//                                  A SECOND NAMESPACE, deliberately not called `kind`:
//                                  Power kinds and Stadium kinds are different rule
//                                  surfaces and a shared field name made selftest ask
//                                  ai.js to score a Gym as though it were a Power.
//                                  NARROW_GYM is its one pendingAsk kind: the on-play
//                                  Bench return, asked of whoever is over the cap,
//                                  opponent first, chained rather than looped.
//                                  Read back by engine.js's stadium(gym) at the
//                                  moment the rule it rewrites is consulted — never
//                                  materialised onto slots. See Rulings/STADIUM-ZONE.md
//     T_COMPUTER_ERROR             you draw up to 5, THEN your opponent draws up
//                                  to 5, and your turn ends without an attack.
//                                  The only Trainer in the era that ends your own
//                                  turn — deferred through endTurn rather than
//                                  switching sides here, because a draw can deck
//                                  somebody out and either player may owe a Prize
//                                  or a promotion first. `opts.mine`/`opts.theirs`
//                                  take fewer than five ("up to"); an unattended
//                                  caller takes the lot (Computer Error)
//
//   TRAINERS, Job 10e. Parameterised rather than named for their card, because
//   Gym and Neo reprint every one of these shapes with a different setting:
//     T_STATUS_ON_FLIP {s}         flip; heads gives the Defending Pokemon that
//                                  condition (Sleep!)
//     T_SEARCH_TO_HAND {kind, evolution, nameHas}
//                                  search your deck for one card matching the
//                                  filter and take it into hand. Shown to the
//                                  opponent, so it IS named in the log
//                                  (The Boss'''s Way: evolution + nameHas Dark)
//     T_SHUFFLE_FROM_DISCARD {n}   up to n Pokemon and/or BASIC Energy out of
//                                  your discard pile and back into your deck.
//                                  Not Trainers, and not a special Energy — so a
//                                  Rainbow in the discard stays there
//                                  (Nightly Garbage Run)
//     T_DISCARD_THEN_OPP_REDRAW {n}
//                                  discard a card as a COST, then the opponent
//                                  shuffles their hand away and draws n. Illegal
//                                  on a hand holding nothing but this card
//                                  (Imposter Oak'''s Revenge)
//     T_POWERS_OFF                 EVERY Pokemon Power on BOTH boards stops
//                                  working until the end of the opponent'''s next
//                                  turn — including Toxic Gas, which has no
//                                  exemption from this the way it has from
//                                  itself. Player-level and consulted, never
//                                  materialised onto slots (Goop Gas Attack)
//     T_PRIZES_FACE_UP             every Prize card on BOTH sides is turned face
//                                  up for the rest of the game. One boolean,
//                                  because the card changes only what can be
//                                  SEEN — nothing about taking a Prize moves.
//                                  Refused once it is already on
//                                  (Here Comes Team Rocket!)
//     T_LOOK_AND_SHUFFLE_BACK      look at the opponent's hand; if it holds a
//                                  Trainer, one of them is shuffled into their
//                                  deck. THE LOOK IS UNCONDITIONAL and is the
//                                  card's floor, so a hand with no Trainer is
//                                  still a legal target — an EMPTY hand is not
//                                  (Rocket's Sneak Attack)
//     T_CHALLENGE                  ask the opponent to accept. Declining, or
//                                  both Benches already being full, draws 2
//                                  instead. Accepting fills BOTH Benches from
//                                  BOTH decks. Always legal, because the floor
//                                  is a draw (Challenge!)
//
//
//   POKEMON POWERS — `p:` rather than `a:` or `t:`. Three MECHANISMS, not three
//   flavours, and filing one under the wrong kind is the standing mistake:
//   INTERACTIVE (offered as an action), TRIGGERED (a definite moment, nobody
//   chooses) and PASSIVE (consulted, never fired). See POWERS.md. Job 13 adds:
//     TOP_DECK_SWAP                INTERACTIVE, once a turn. Draw one, then put a
//                                  card from hand on TOP of the deck. The draw
//                                  comes first and that is the whole card — the
//                                  card just drawn is a legal thing to put back,
//                                  so it is a free look at your deck that costs
//                                  nothing when the top card is bad
//                                  (Dragonite, Special Delivery)
//     CLEAR_STATUS_BOTH_ACTIVE     INTERACTIVE, once a turn. Every Special
//                                  Condition off BOTH Active Pokemon, the
//                                  opponent's included — which is a real drawback
//                                  and why the AI scores it NEGATIVE on a board
//                                  where only they are afflicted. It cannot heal
//                                  itself and that falls out rather than being
//                                  coded (Venusaur, Solar Power)
//     CHAIN_REACTION               TRIGGERED, and the FOURTH trigger — the first
//                                  added since Job 10c. When one of YOUR Pokemon
//                                  evolves, this one searches the deck for its own
//                                  Evolution and evolves too. Allied only; the
//                                  card says "a Pokemon" and does not say whose.
//                                  Not re-entrant — a second Eevee would otherwise
//                                  answer the first. Hangs off enterPlay, the same
//                                  doorway the other three use
//                                  (Eevee, Chain Reaction)
//                                  *[Whose evolutions count →](Rulings/CHAIN-REACTION-ALLIED-ONLY.md)*
//
//   QUESTION KINDS — not verbs. engine.ask() defers a decision to the OTHER
//   player mid-turn and engine.resolveAsk() continues the card once it is
//   answered; `kind` names which continuation to run. The mechanism is general
//   and the continuations are per-card, which is the ON_PLAY split again.
//     CHALLENGE                    accept or decline (Challenge!)
//     CAT_PUNCH                    which of THEIR OWN Benched Pokemon takes the
//                                  hit, asked of the DEFENDER. The one question
//                                  in this list the opponent answers about their
//                                  own board, and the one the AI must score or it
//                                  feeds Cat Punch whatever comes first
//     CONVERT_WEAKNESS             which type to make the defender weak to, asked
//                                  of the ATTACKER — engine.ask()'s `self` flag.
//                                  Texture Magic grants two independent type
//                                  choices in one attack and the attack-options
//                                  list can only carry one, so the first rides
//                                  `opts.type` and the second is a question.
//                                  Enumerating both would be 7 x 8 buttons.
//                                  Carries a "Leave it" because the card says
//                                  "you MAY", and the AI takes it when its own
//                                  board is Colorless-only and has nothing to gain
//
//     T_COIN_PINGPONG {n}          flip; tails does n to YOUR Active and stops,
//                                  heads passes the coin to your opponent, and
//                                  so on. THE COIN STARTS WITH YOU, so you take
//                                  it two times in three — it is a finisher that
//                                  misses more often than not, and the AI is
//                                  told so explicitly (Digger)
//
// THE COIN-FLIP FAMILY — an index by SHAPE rather than by function.
//
// TREVOR ASKED FOR THIS, 17 Aug 2026, and the reason is a repeat: #7 asked
// during Job 6 whether a dual-outcome verb existed, concluded it did not, and
// found one afterwards. The sections below sort verbs by WHAT THEY DO, which is
// the wrong axis when the question you actually have is "my card flips a coin —
// what is already built?" That question is now one list.
//
// SEVENTEEN verbs read a coin. Find your card's shape here before writing one:
//
//   heads does something, tails does nothing
//     FLIP_OR_NOTHING            the whole attack is cancelled on tails
//     STATUS_ON_FLIP             a status on the defender
//     DRAW_ON_FLIP  HEAL_SELF_ON_FLIP  BARRIER_ON_FLIP
//     PREVENT_ALL_DMG_SELF_ON_FLIP    WHIRLWIND_ON_FLIP
//     CANT_ATTACK_ON_FLIP  CANT_RETREAT_ON_FLIP
//
//   tails does something instead
//     RECOIL_ON_FLIP             self takes damage on TAILS
//     STATUS_SELF_ON_TAILS       self takes a status on TAILS
//
//   ONE coin, two different outcomes — check here first, this is the one
//   that gets missed
//     STATUS_COIN_EITHER {heads, tails}
//                                a status either way, never nothing
//     FLIP_BONUS_OR_RECOIL {base, bonus, recoil, statusOnHeads, discardOnHeads}
//                                the general one. Damage both ways, plus any
//                                combination of a status on the defender, an
//                                Energy discard off self, and recoil on tails —
//                                ALL on the same coin
//
//   many coins
//     DMG_PER_HEAD {coins, per}          a fixed number of coins
//     DMG_PER_ENERGY_HEADS {per}         one per Energy ATTACHED
//     DMG_PER_HEAD_UNTIL_TAILS {per}     until the first tails
//     BENCH_SPLASH_PER_FLIP {dmg}        one per opposing Benched Pokemon
//     BENCH_SPLASH_FLIP_SIDE {n}         one coin picks WHOSE bench
//
// THE RULE THIS INDEX EXISTS TO ENFORCE: if a card ties several consequences to
// ONE coin, that is one verb. Two verbs flip twice, which is a different card —
// it can pay a bonus and miss the status the same coin was supposed to carry.
// Sticky Hands, Thunder Attack and Playing with Fire are all this shape.
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
//     PEEK                   interactive, ONCE per turn. Look at the top of
//                            either deck, or one random card of their hand.
//                            Deliberately UNSCORED by the AI — see RULINGS.md,
//                            which explains why worthless and unscored are not
//                            the same claim.
//     REVEAL_OPP_HAND        interactive, ONCE. See the opponent's whole hand.
//                            The Game Boy's reading of Clairvoyance rather than
//                            the card's — RULINGS.md
//     REARRANGE_TOP {n}      interactive, ONCE. Reorder the top n of EITHER
//                            deck. Rearranging theirs is a real effect even
//                            against an opponent who can see it (Prophecy)
//     HEAL_ON_FLIP {n}       interactive, ONCE. Choose one of your Pokemon,
//                            THEN flip — the coin is part of the resolution, not
//                            of the choice, so the player is picking a target
//                            rather than a gamble (Vileplume)
//     STEP_IN                interactive, ONCE. A BENCHED Pokemon swaps itself
//                            with your Active. No Energy, no retreat cost, and
//                            it does not use up the retreat (Dragonite)
//     COWARDICE              interactive, ONCE. Return this Pokemon to your
//                            hand. Illegal on the turn it came into play, which
//                            `slot.playedTurn` already knows (Tentacool)
//     CHANGE_OWN_TYPE        interactive, ONCE. Become any type already in play
//                            on this slot's side (Conversion-style)
//     TRANSFORM              interactive, ONCE. Copy the opposing Active — a
//                            SNAPSHOT, not a live mirror, carried by the
//                            baseCard/topCard split. See ENGINE.md and the
//                            Ditto ruling before touching it (Ditto)
//     EXTRA_ATTACH {energy, targetType}
//                            interactive, repeatable. Attach 1 basic Energy of
//                            that type FROM HAND to one of your Pokemon of
//                            `targetType`. Does NOT consume the turn's one
//                            Energy attachment.
//
//     SEARCH_EVOLUTION_TO_HAND
//                            interactive, ONCE. Search your deck for ANY
//                            Evolution card and put it into your hand. "Show it
//                            to your opponent", so it IS logged by name
//                            (Evolutionary Light)
//     STATUS_COIN_EITHER_POWER {status}
//                            interactive, ONCE. Flip: heads gives the DEFENDING
//                            Pokemon that condition, tails gives it to YOUR OWN
//                            Active. Never nothing, which is what makes it a
//                            gamble rather than a free effect. One shape serves
//                            both cards printing it — Pollen Stench (Confused)
//                            and Long-Distance Hypnosis (Asleep)
//     DISCARD_THEN_DRAW      interactive, ONCE. Discard a card from hand in
//                            order to draw one. The discard is a COST, so an
//                            empty hand makes it illegal (Matter Exchange)
//     PRIZE_SWAP             interactive, ONCE. Exchange one of your Prizes with
//                            the top card of your deck. Nothing is revealed and
//                            nothing is logged by name — a Prize is face down to
//                            both players. Deliberately scored at -Infinity by
//                            the AI, which is a declaration and not an oversight;
//                            see RULINGS.md on Peek (Trickery)
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
//     RETREAT_TAX {n}        while ACTIVE, the OPPONENT's retreat costs n more.
//                            The mirror of the above and computed in the same
//                            place. Active-only, unlike almost everything here,
//                            because the card says so (Sticky Goo)
//     NO_TRAINERS            NEITHER player may play a Trainer card. Both sides,
//                            from anywhere, exactly as NO_EVOLUTION is — so it
//                            locks your OWN hand too, and it cannot be removed
//                            by Goop Gas Attack, which is itself a Trainer.
//                            (Hay Fever)
//     CONFUSED_BONUS {n}     while this Pokemon is CONFUSED, the damage it does
//                            is n more — including the damage the Confusion
//                            rules make it do to ITSELF, which is the whole of
//                            Rulings/FRENZY-SELF-DAMAGE.md. MUST carry
//                            `always: true`: it only applies while Confused, so
//                            the blanket status gate would switch it off in
//                            precisely the state it keys on (Frenzy)
//
//   TRIGGERED POWERS (Job 10c). A THIRD kind, and the distinction from the two
//   above is what each one costs to get wrong. An interactive Power is offered
//   as an action and can be declined. A passive Power is consulted and never
//   fires. A TRIGGERED Power fires ITSELF, at a definite moment, whether or not
//   anybody scored it — which is the silent-failure surface AI.md describes,
//   arriving from a new direction.
//
//   The trigger is declared as the `kind`; WHAT IT DOES is a verb list under
//   `do`, run by engine.runPowerScript. That split is the whole design, and the
//   era is the reason for it: 20 printings across six sets say "when you play
//   this from your hand" and no two of them do the same thing. What generalises
//   is the moment, not the effect.
//
//     ON_PLAY {do}           fires when the card is played FROM HAND — benched,
//                            evolved, or dropped by Pokemon Breeder. NOT from
//                            the deck, the discard pile, or the opening setup;
//                            engine.enterPlay is the single doorway that knows
//                            which is which. A Muk switches it off like any
//                            other Power
//     ON_KO {do}             fires when this Pokemon is Knocked Out BY AN
//                            ATTACK, before a single card leaves the slot —
//                            Final Beam counts Energy that is one line away from
//                            the discard pile. Damage from a Power, from Poison,
//                            from Confusion or from a Retaliate does NOT count.
//                            See RULINGS.md
//     ON_OPP_RETREAT {do}    fires when the OPPONENT's Active retreats — the
//                            successful retreat, not the attempt. Every copy on
//                            the board fires its own. `onAttempt` is reserved
//                            for Neo 4's Unown [C] and is not built
//
//   POWER VERBS — the `do` list. A THIRD namespace after attack verbs and
//   Trainer cases, and deliberately NOT the attack pipeline: that loop is built
//   around an attacker, a defender and a damage number, and a Power has none of
//   them. Verbs here take a `slot` (the Power's own Pokemon) and, for the two
//   triggers that need it, engine-supplied context.
//
//     P_SEARCH_BENCH {n, stage}    search your deck for up to n Pokemon of that
//                                  stage and put them onto your Bench, then
//                                  shuffle. "Up to", so a full Bench and an
//                                  empty deck are both fine (Summon Minions)
//     P_FROM_DISCARD {n}           take up to n Pokemon cards out of your own
//                                  discard pile into your hand (Reel In)
//     P_SNIPE {dmg, wr, optional}  dmg to one of the OPPONENT's Pokemon, Active
//                                  included, chosen by this Power's owner. `wr`
//                                  applies Weakness and Resistance, which is
//                                  unusual enough to be a flag rather than an
//                                  assumption. `optional` allows declining with
//                                  trigTargetUid: null (Sneak Attack)
//     P_REVENGE {per, t, wr}       ON_KO only. Flip; heads does per * (Energy of
//                                  type t still attached to this Pokemon) to
//                                  whatever Knocked it Out (Final Beam)
//     P_RETREAT_TOLL {dmg, onHeads}
//                                  ON_OPP_RETREAT only. A coin; dmg to the
//                                  Pokemon that just retreated if it lands the
//                                  named way. `onHeads: false` is Sinkhole,
//                                  where the opponent flips and tails hurts
//
//   NONE OF THESE PROVOKE A COUNTER. A Pokemon Power is not an attack, so every
//   damaging verb here passes noRetaliate and noMirror — Strikes Back reads
//   "whenever an opponent's ATTACK damages" and Mirror Shell reads "if an ATTACK
//   does damage". It is the same sentence that keeps Final Beam narrow.
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
    // maxSpare 2: "Extra Water Energy after the 2nd doesn't count." THE CAP WAS
    // MISSING ON ALL THREE BASE SET PRINTINGS OF THIS VERB until 31 Aug 2026.
    // These were written in Job 4b, before Job 6 added `maxSpare` for the Jungle
    // and Fossil Water Guns, and nobody went back — so the three oldest cards
    // carrying the verb were the three the engine over-paid. A Poliwrath on five
    // Water dealt 60 where the card prints 50.
    [{ v: 'DMG_PER_SPARE_ENERGY', base: 30, per: 10, t: 'W', maxSpare: 2 }],  // Water Gun
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
    // maxSpare 2 — see Poliwrath. The corpus words this printing "...after the
    // 2nd don't count", so it is the same cap and not a Poliwag exception.
    [{ v: 'DMG_PER_SPARE_ENERGY', base: 10, per: 10, t: 'W', maxSpare: 2 }],  // Water Gun
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
      // maxSpare 2 — see Poliwrath. Rain Dance makes this the worst place in the
      // game to be uncapped: the Power can dump a whole hand of Water onto
      // Blastoise, and every card of it was adding 10 to Hydro Pump.
      [{ v: 'DMG_PER_SPARE_ENERGY', base: 40, per: 10, t: 'W', maxSpare: 2 }],  // Hydro Pump
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

  // ============================================================================
  // JOB 6f — Ditto. The last card in Fossil, and the only one that needed a job.
  //
  // 50 HP, Basic, retreat 1, and NO ATTACKS AT ALL — so with Transform switched
  // off it is a body that cannot do anything. Everything it can ever do comes
  // from the copy. See RULINGS.md for the snapshot rule and why it is not the
  // printed continuous reading.
  // ============================================================================
  'base3-3': {
    p: { kind: 'TRANSFORM', name: 'Transform' },
    a: [],
  },

  // ---- Team Rocket ----
  // Job 10b. THE ENTRIES IN THIS FIRST BLOCK WERE DERIVED, NOT TYPED: each
  // attack below prints rules text BYTE-IDENTICAL to a card already live, so
  // its script is that card's script, copied rather than re-read. The comment
  // on each line names where it came from, and selftest.js re-checks the claim
  // — if a source card's script ever changes and one of these does not follow,
  // the text they share has stopped meaning the same thing and somebody needs
  // to look.
  //
  // Everything Team Rocket actually ADDS is hand-authored below this block.
  // The split is setsurvey.js's: derived where the printed text is identical,
  // hand-written everywhere else, and never the other way round.
  'base5-45': { a: [                                 // Dark Vaporeon
    [],                                              //   Bite
    [{ v: 'DISCARD_DEF_ENERGY' }],                   //   Whirlpool  — as Poliwrath
  ]},
  'base5-48': { a: [                                 // Porygon
    [{ v: 'CONVERT_DEF_WEAKNESS' }],                 //   Conversion 1  — as Porygon
    [{ v: 'STATUS_ON_FLIP', s: 'Confused' }],        //   Psybeam  — as Alakazam
  ]},
  'base5-51': { a: [                                 // Dark Raticate
    [],                                              //   Gnaw
    [{ v: 'FLIP_OR_NOTHING' }],                      //   Hyper Fang  — as Nidoran ♂
  ]},
  'base5-53': { a: [                                 // Dratini
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],       //   Wrap  — as Gyarados
  ]},
  'base5-55': { a: [                                 // Eevee
    [],                                              //   Tackle
    [{ v: 'JAM_DEFENDER', label: 'Sand-attack' }],   //   Sand-attack  — as Sandshrew
  ]},
  'base5-56': { a: [                                 // Ekans
    [],                                              //   Bite
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],        //   Poison Sting  — as Beedrill
  ]},
  'base5-58': { a: [                                 // Koffing
    [],                                              //   Tackle
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],        //   Poison Gas  — as Beedrill
  ]},
  'base5-59': { a: [                                 // Machop
    [],                                              //   Punch
    [],                                              //   Kick
  ]},
  'base5-63': { a: [                                 // Oddish
    [{ v: 'STATUS', s: 'Asleep' }],                  //   Sleep Powder  — as Haunter
    [{ v: 'STATUS', s: 'Poisoned' }],                //   Poisonpowder  — as Ivysaur
  ]},
  'base5-68': { a: [                                 // Squirtle
    [],                                              //   Shell Attack
  ]},
  'base5-69': { a: [                                 // Voltorb
    [],                                              //   Speed Ball
  ]},
  'base5-70': { a: [                                 // Zubat
    [],                                              //   Ram
    [],                                              //   Bite
  ]},

  // ---- Team Rocket, hand-authored ----
  'base5-64': { a: [                                 // Ponyta
    [{ v: 'COST_DISCARD_ENERGY', n: 1, t: 'R' }],    //   Ember — pay a Fire to fire
  ]},
  'base5-65': { a: [                                 // Psyduck
    [{ v: 'DRAW', n: 1 }],                           //   Dizziness
    // Same shape as Squirtle's Water Gun, different numbers — which is exactly
    // why the derived block above could not take it: identical MECHANICS, and
    // the printed text differs by the figures in it.
    [{ v: 'DMG_PER_SPARE_ENERGY', base: 20, per: 10, t: 'W', maxSpare: 2 }],
  ]},
  'base5-52': { a: [                                 // Diglett
    // "Choose 1 of your opponent's Pokemon" — the Active included, so this is
    // the widened snipe rather than the Bench-only one. No printed damage at
    // all: the 10 IS the attack.
    [{ v: 'BENCH_SNIPE', n: 1, dmg: 10, target: 'any' }],   //   Dig Under
    [],                                              //   Scratch
  ]},
  'base5-62': { a: [                                 // Meowth
    // Coin Hurl picks the target and THEN flips, so a tails wastes the turn on a
    // choice already made. FLIP_OR_NOTHING runs first and short-circuits the
    // whole script, which is the order the card describes.
    [{ v: 'FLIP_OR_NOTHING' },
     { v: 'BENCH_SNIPE', n: 1, dmg: 20, target: 'any' }],   //   Coin Hurl
  ]},
  'base5-61': { a: [                                 // Mankey
    [{ v: 'SHUFFLE_OPP_DECK' }],                     //   Mischief
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 20, bonus: 20, recoil: 0, label: 'Anger' }],
  ]},
  'base5-3': { a: [                                  // Dark Blastoise
    [{ v: 'DMG_PER_SPARE_ENERGY', base: 30, per: 20, t: 'W', maxSpare: 2 }],
    // Rocket Tackle hurts ITSELF and then flips for a shield. RECOIL is
    // unconditional here — the card does not tie it to the coin — so the two
    // verbs are genuinely independent and stacking them is correct.
    [{ v: 'RECOIL', n: 10 }, { v: 'PREVENT_ALL_DMG_SELF_ON_FLIP' }],
  ]},
  'base5-37': { a: [                                 // Dark Golduck
    // Third Eye pays an Energy in the COST phase and draws in the effect phase,
    // so an empty deck still costs you the card — which is what the card says.
    [{ v: 'COST_DISCARD_ENERGY', n: 1 }, { v: 'DRAW', n: 3 }],
    [],                                              //   Super Psy
  ]},
  'base5-42': { a: [                                 // Dark Persian
    // Fascinate flips FIRST and does nothing on tails, so FLIP_OR_NOTHING
    // short-circuits the drag rather than the drag being attempted and failing.
    [{ v: 'FLIP_OR_NOTHING' }, { v: 'SWITCH_DEFENDER_CHOOSE' }],
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],        //   Poison Claws
  ]},
  'base5-57': { a: [                                 // Grimer
    [{ v: 'STATUS', s: 'Asleep' }],                  //   Poison Gas
    // ONE coin pays the bonus AND paralyses. Two verbs would flip twice and let
    // it do one without the other, which this card cannot.
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 10, bonus: 20, recoil: 0,
       statusOnHeads: 'Paralyzed', label: 'Sticky Hands' }],
  ]},
  'base5-38': { a: [                                 // Dark Jolteon
    [{ v: 'JAM_DEFENDER', label: 'Lightning Flash' }],
    // The same one-coin shape pointing both ways: heads paralyses, tails hurts
    // Dark Jolteon. Damage is flat at 30 either way, so bonus is 0.
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 30, bonus: 0, recoil: 10,
       statusOnHeads: 'Paralyzed', label: 'Thunder Attack' }],
  ]},
  'base5-35': { a: [                                 // Dark Flareon
    [{ v: 'DMG_PER_COUNTER_SELF', base: 10, per: 10 }],   //   Rage
    // Heads burns a Fire AND pays 50; tails is a bare 30 and keeps the Energy.
    // The legality gate is separate because it is checked before the coin.
    [{ v: 'REQUIRE_SELF_ENERGY', t: 'R' },
     { v: 'FLIP_BONUS_OR_RECOIL', base: 30, bonus: 20, recoil: 0,
       discardOnHeads: { n: 1, t: 'R' }, label: 'Playing with Fire' }],
  ]},
  'base5-32': { a: [                                 // Dark Charmeleon
    [],                                              //   Tail Slap
    // "If tails, this attack does nothing (not even damage)" is base 0 with the
    // whole 70 in the bonus — which is the same coin that pays the Energy, and
    // the reason this is not FLIP_OR_NOTHING plus a discard.
    [{ v: 'REQUIRE_SELF_ENERGY', t: 'R' },
     { v: 'FLIP_BONUS_OR_RECOIL', base: 0, bonus: 70, recoil: 0,
       discardOnHeads: { n: 1, t: 'R' }, label: 'Fireball' }],
  ]},
  'base5-1': { a: [                                  // Dark Alakazam
    // "You MAY switch" — optional, which the verb now supports. Forcing it
    // would drag a charged Alakazam off the front every time you attack.
    [{ v: 'SWITCH_SELF_CHOOSE', optional: true }],   //   Teleport Blast
    [{ v: 'NO_WR' }],                                //   Mind Shock
  ]},
  'base5-47': { a: [                                 // Magikarp
    [],                                              //   Flop
    // Trevor, 17 Aug: it pulls either Gyarados out of the deck — the player
    // chooses from what is actually there — evolves Magikarp on the spot, and
    // the turn ends with no attack damage.
    [{ v: 'EVOLVE_SELF_FROM_DECK', names: ['Gyarados', 'Dark Gyarados'] }],
  ]},
  'base5-14': { a: [                                 // Dark Weezing
    // Both halves name the same group and share one enumeration. The attacker is
    // in it, and a Defending Koffing/Weezing takes the splash ON TOP of the main
    // damage — see Rulings/MASS-EXPLOSION.md before 'fixing' either.
    [{ v: 'DMG_PER_NAMED_IN_PLAY', names: ['Koffing', 'Weezing', 'Dark Weezing'],
       base: 0, per: 20, where: 'all' },
     { v: 'SPLASH_NAMED', names: ['Koffing', 'Weezing', 'Dark Weezing'], n: 20 }],
    // Stun Gas is STATUS_COIN_EITHER, which has existed since Base Set. Trevor
    // remembered it when I was about to build a third one-coin verb.
    [{ v: 'STATUS_COIN_EITHER', heads: 'Poisoned', tails: 'Paralyzed' }],
  ]},
  // ---- Job 10e: the six Trainers that needed no new decisions ---------------

  'base5-73': { t: [{ v: 'T_SEARCH_TO_HAND', evolution: true, nameHas: 'Dark' }] },
  'base5-75': { t: [{ v: 'T_COIN_PINGPONG', n: 10 }] },
  'base5-76': { t: [{ v: 'T_DISCARD_THEN_OPP_REDRAW', n: 4 }] },
  'base5-77': { t: [{ v: 'T_SHUFFLE_FROM_DISCARD', n: 3 }] },
  'base5-78': { t: [{ v: 'T_POWERS_OFF' }] },
  'base5-79': { t: [{ v: 'T_STATUS_ON_FLIP', s: 'Asleep' }] },

  'base5-15': { t: [{ v: 'T_PRIZES_FACE_UP' }] },      // Here Comes Team Rocket!
  'base5-16': { t: [{ v: 'T_LOOK_AND_SHUFFLE_BACK' }] },// Rocket'''s Sneak Attack
  'base5-74': { t: [{ v: 'T_CHALLENGE' }] },            // Challenge!

  // ---- Job 10d: two of the three special Energy -----------------------------
  // Both print their effect as "IF YOU PLAY THIS CARD FROM YOUR HAND", which is
  // the played-from-hand rule one card kind along — see doAttach. Neither is an
  // Energy of any particular type: both provide plain Colorless and both stay
  // attached afterwards as ordinary Energy.
  //
  // RAINBOW ENERGY IS THE ONE CARD THAT BREAKS `provides`. It is one symbol that
  // is every type at once, written as the sentinel '*' — see engine.js, where
  // three separate questions read it and they do NOT all answer the same way.
  // Its 10 damage can Knock Out the Pokemon it lands on.

  'base5-17': { t: [{ v: 'E_SELF_DAMAGE', n: 10 }] },// Rainbow Energy
  'base5-81': { t: [{ v: 'E_CLEAR_STATUS' }] },      // Full Heal Energy
  'base5-82': { t: [{ v: 'E_HEAL', n: 10 }] },       // Potion Energy

  // ---- Job 10c widened: the ordinary Powers behind the triggers -------------
  // Ten cards that are not trigger points and were in no sub-job at all. They
  // live here because they are the same file and the same machinery, not because
  // they belong to the trigger work.

  'base5-13': { a: [                                 // Dark Vileplume (Weakness Fire)
    // Three coins govern the damage AND the self-Confusion, so they are one
    // verb. Two would flip six times, and could do 90 without the Confusion or
    // Confuse itself for nothing.
    [{ v: 'DMG_PER_HEAD', coins: 3, per: 30, selfStatusAtHeads: { n: 2, s: 'Confused' } }],
  ],
    // "No Trainer cards can be played" — no owner named, so BOTH players, which
    // includes you. Playing this is a decision about your own deck as much as
    // theirs. Goop Gas Attack is the obvious answer and cannot be played while
    // this is up; see Rulings and trainersLocked().
    p: { kind: 'NO_TRAINERS', name: 'Hay Fever' } },

  'base5-30': { a: [                                 // Dark Vileplume (Weakness FIGHTING)
    // NOT AN ALIAS OF base5-13, and it must never become one. The two printings
    // differ in Weakness — Fire on 13, Fighting on 30 — which both sources
    // reported, nobody believed, and Trevor's physical card confirmed. Identical
    // scripts, separate entries, and setsurvey.js flags the class. See DATA.md.
    [{ v: 'DMG_PER_HEAD', coins: 3, per: 30, selfStatusAtHeads: { n: 2, s: 'Confused' } }],
  ],
    p: { kind: 'NO_TRAINERS', name: 'Hay Fever' } },

  'base5-33': { a: [                                 // Dark Dragonair
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 20, bonus: 20, recoil: 0 }],   // Tail Strike
  ],
    p: { kind: 'SEARCH_EVOLUTION_TO_HAND', name: 'Evolutionary Light' } },

  'base5-36': { a: [                                 // Dark Gloom
    [{ v: 'STATUS', s: 'Poisoned' }],                //   Poisonpowder
  ],
    // Pollen Stench and Long-Distance Hypnosis are the same mechanism with the
    // condition as a setting. Heads hits them, tails hits YOU — never nothing,
    // which is what makes it a gamble rather than a free effect.
    p: { kind: 'STATUS_COIN_EITHER_POWER', name: 'Pollen Stench', status: 'Confused' } },

  'base5-39': { a: [                                 // Dark Kadabra
    [{ v: 'NO_WR' }],                                //   Mind Shock
  ],
    p: { kind: 'DISCARD_THEN_DRAW', name: 'Matter Exchange' } },

  'base5-41': { a: [                                 // Dark Muk
    [{ v: 'STATUS', s: 'Poisoned' }],                //   Sludge Punch
  ],
    // "As long as Dark Muk is your ACTIVE Pokemon" — the one Power in the set
    // that stops working from the Bench, which is why RETREAT_TAX reads the
    // opposing Active rather than looping a whole board the way Retreat Aid does.
    p: { kind: 'RETREAT_TAX', name: 'Sticky Goo', n: 2 } },

  'base5-43': { a: [                                 // Dark Primeape
    [{ v: 'STATUS_SELF', s: 'Confused' }],           //   Frenzied Attack
  ],
    // `always` is mandatory here rather than convenient. Frenzy ONLY does
    // anything while its Pokemon is Confused, so the blanket "can't be used if
    // Asleep, Confused or Paralyzed" gate would switch it off in exactly the
    // state it keys on. The card prints no such clause.
    //
    // "Even to itself" reaches the Confusion penalty, so a failed attack costs
    // 60 rather than 30 — settled, and it will look wrong in the log.
    // See Rulings/FRENZY-SELF-DAMAGE.md.
    p: { kind: 'CONFUSED_BONUS', name: 'Frenzy', n: 30, always: true } },

  'base5-50': { a: [                                 // Charmander
    [],                                              //   Fire Tail
  ],
    // Energy Trans with two settings on. "1 of your OTHER Pokemon" is `toSelf`;
    // "once during your turn" is `once`.
    p: { kind: 'MOVE_ENERGY', name: 'Gather Fire', energy: 'R', once: true, toSelf: true } },

  'base5-54': { a: [                                 // Drowzee
    [{ v: 'STATUS', s: 'Asleep' }],                  //   Nightmare
  ],
    p: { kind: 'STATUS_COIN_EITHER_POWER', name: 'Long-Distance Hypnosis', status: 'Asleep' } },

  'base5-66': { a: [                                 // Rattata
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 10, bonus: 10, recoil: 0 }],   // Quick Attack
  ],
    // Worthless against a bot that reads full engine state, and worth real money
    // to a human — the opposite way round from Peek. Nothing is revealed and
    // nothing is logged by name, because a Prize is face down to both players.
    p: { kind: 'PRIZE_SWAP', name: 'Trickery' } },

  'base5-67': { a: [                                 // Slowpoke
    // "Energy CARD", so basic by class. A Rainbow will not be found by this once
    // Rainbow exists — the other half of Rulings/ENERGY-VS-ENERGY-CARD.md.
    [{ v: 'SEARCH_ENERGY_TO_SELF', t: 'P' }],        //   Afternoon Nap
    [],                                              //   Headbutt
  ]},

  // ---- Job 10c: the five triggered Powers -----------------------------------
  // `always: true` on the three ON_PLAY cards is not a shortcut. None of them
  // prints "can't be used if Asleep, Confused or Paralyzed" — the two ON_KO and
  // ON_OPP_RETREAT cards below DO, and are gated for it. The flag is inert in
  // practice, because a card arriving from your hand has no Special Conditions
  // and evolving clears them, but ENGINE.md's rule is to set it from the printed
  // text rather than from whether it currently matters.

  'base5-5': { a: [                                  // Dark Dragonite
    [{ v: 'FLIP_OR_NOTHING' }],                      //   Giant Tail
  ],
    // "search your deck for up to 2 Basic Pokemon and put them onto your Bench"
    // — a Stage 2 that pays for itself twice over on arrival. Up to 2, so one
    // Basic, none, or a full Bench are all fine rather than failures.
    p: { kind: 'ON_PLAY', name: 'Summon Minions', always: true,
         do: [{ v: 'P_SEARCH_BENCH', n: 2, stage: 'Basic' }] } },

  'base5-6': { a: [                                  // Dark Dugtrio
    // "YOUR OPPONENT flips a coin. If TAILS, this attack does 20 plus 20 more."
    // Both halves are backwards from the house shape, which is why onTails
    // exists — see FLIP_BONUS_OR_RECOIL.
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 20, bonus: 20, recoil: 0, onTails: true,
       label: 'their coin — TAILS pays the bonus' }],
  ],
    p: { kind: 'ON_OPP_RETREAT', name: 'Sinkhole',
         do: [{ v: 'P_RETREAT_TOLL', dmg: 20, onHeads: false, label: 'Sinkhole' }] } },

  'base5-7': { a: [                                  // Dark Golbat
    // Flitter prints NO damage of its own — the whole attack is the snipe, and
    // "1 of your opponent's Pokemon" is the Team Rocket wording that widens
    // BENCH_SNIPE past the Bench.
    [{ v: 'BENCH_SNIPE', n: 1, dmg: 20, target: 'any', label: 'Flitter' }],
  ],
    // "you MAY choose 1 of your opponent's Pokemon" — declining is real, and
    // "Apply Weakness and Resistance" is the unusual half. Ten damage into a
    // Weakness is twenty, off a card that has not attacked yet.
    p: { kind: 'ON_PLAY', name: 'Sneak Attack', always: true,
         do: [{ v: 'P_SNIPE', dmg: 10, wr: true, optional: true }] } },

  'base5-8': { a: [                                  // Dark Gyarados
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],       //   Ice Beam
  ],
    // The one card in the era that answers its own Knock Out with damage. Four
    // Water on it is 80 back into whatever killed it, on a coin — and Weakness
    // applies, which the card says and almost nothing else of this shape does.
    p: { kind: 'ON_KO', name: 'Final Beam',
         do: [{ v: 'P_REVENGE', per: 20, t: 'W', wr: true }] } },

  'base5-12': { a: [                                 // Dark Slowbro
    [{ v: 'FLIP_OR_NOTHING' }],                      //   Fickle Attack
  ],
    // "up to 3 Basic Pokemon and/or Evolution cards from your discard pile" —
    // every Pokemon card, in other words, and no Energy or Trainers. An empty
    // discard pile is not a failure.
    p: { kind: 'ON_PLAY', name: 'Reel In', always: true,
         do: [{ v: 'P_FROM_DISCARD', n: 3 }] } },

  'base5-4': { a: [                                  // Dark Charizard
    [],                                              //   Nail Flick
    // A coin per FIRE attached, 50 a head, and it burns one Fire per head. The
    // discard rides the same count as the damage, so it cannot pay for heads it
    // did not get.
    [{ v: 'DMG_PER_ENERGY_HEADS', per: 50, t: 'R', discardPerHead: true }],
  ]},
  'base5-60': { a: [                                 // Magnemite
    [],                                              //   Tackle
    // "on your Bench" — not in play, not yours-everywhere. Magnemite itself is
    // Active when it attacks and must not count itself.
    [{ v: 'DMG_PER_NAMED_IN_PLAY', names: ['Magnemite', 'Magneton', 'Dark Magneton'],
       base: 10, per: 10, where: 'bench' }],
  ]},
  'base5-49': { a: [                                 // Abra
    // Vanish burns everything attached and can legally shuffle away your LAST
    // Pokemon, which loses you the game. The card prints no guard against that
    // and neither do we.
    [{ v: 'SHUFFLE_INTO_DECK', target: 'self', attached: 'discard' }],
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],       //   Psyshock
  ]},
  'base5-10': { a: [                                 // Dark Machamp
    [],                                              //   Mega Punch
    // Fling RECYCLES their Energy rather than burning it — everything attached
    // rides into the deck with the Pokemon. The bench gate is printed.
    [{ v: 'REQUIRE_OPP_BENCH' },
     { v: 'SHUFFLE_INTO_DECK', target: 'defender', attached: 'deck' }],
  ]},
  'base5-9': { a: [                                  // Dark Hypno
    [],                                              //   Psypunch
    [{ v: 'DMG_PER_OPP_BENCH_TAILS', per: 20 }, { v: 'NO_WR' }],
  ]},
  'base5-83': { a: [                                 // Dark Raichu
    // The 30 to the Active lands whatever the coins do; only the Bench splash
    // rides them, which is why this is post-damage and not damage-shaping.
    [{ v: 'BENCH_SPLASH_DOUBLE_FLIP', hi: 20, lo: 10, label: 'Surprise Thunder' }],
  ]},
  'base5-40': { a: [                                 // Dark Machoke
    // Drag Off drags FIRST and hits what it dragged. Knock Back is the ordinary
    // Whirlwind shape — damage, then THEY choose who comes up.
    [{ v: 'REQUIRE_OPP_BENCH' }, { v: 'SWITCH_DEFENDER_FIRST' }],
    [{ v: 'WHIRLWIND' }],                            //   Knock Back
  ]},
  'base5-34': { a: [                                 // Dark Electrode
    [],                                              //   Rolling Tackle
    [{ v: 'SCATTER_OWN_ENERGY' }],                   //   Energy Bomb
  ]},
  'base5-11': { a: [                                 // Dark Magneton
    [{ v: 'NO_WR' }],                                //   Sonicboom
    [{ v: 'MOVE_DEF_ENERGY_TO_BENCH' }],             //   Magnetic Lines
  ]},
  'base5-44': { a: [                                 // Dark Rapidash
    [],                                              //   Rear Kick
    // "You MAY discard" — the same optionality Dark Alakazam needed, pointed at
    // a cost instead of a switch. Declining is `costUids: []`, and the snipe
    // simply does not happen without the discard.
    [{ v: 'OPTIONAL_DISCARD_THEN_SNIPE', t: 'R', n: 1, dmg: 10 }],
  ]},
  'base5-2': { a: [                                  // Dark Arbok
    // No printed damage: the 10 IS the attack, aimed anywhere on their side,
    // and the Power goes off on the same target. Stare a Muk and everyone
    // else's Powers come back on for a turn.
    [{ v: 'BENCH_SNIPE', n: 1, dmg: 10, target: 'any', suppressPower: true, label: 'Stare' }],
    [{ v: 'STATUS', s: 'Poisoned' }, { v: 'BENCH_SPLASH', n: 10, side: 'theirs' }],
  ]},
  'base5-46': { a: [                                 // Dark Wartortle
    [{ v: 'DMG_PER_HEAD', coins: 2, per: 10 }],      //   Doubleslap
    [{ v: 'MIRROR_SHELL' }],                         //   Mirror Shell
  ]},

  // ============================================================================
  // JOB 13 — WIZARDS BLACK STAR PROMOS, basep-1..28.
  //
  // NOT A SET, and the distinction is enforced rather than remembered: `basep`
  // carries `booster: false` in SET_INFO, so progress.js's liveSets() refuses it
  // a ladder bracket and a dex section however complete it gets. The player meets
  // these through the pack INTRUSION roll. See PACKS.md and progress.js.
  //
  // basep-29..53 are Neo-era promos and are DELIBERATELY unscripted — out of the
  // job's scope, gated behind sets that do not exist. `REMAINING.basep` in
  // selftest.js is expected to come to rest at 25 rather than reach zero.
  //
  // GATING IS DATA, NOT CODE. Which promo becomes reachable at which bracket lives
  // in the `Gated Until (promo only)` column of the workbook in data/v1 Opp Decks/
  // and is read by tools/wants.js. Nothing here knows about it; the switch that
  // does is a separate job.
  //
  // WAVE 1 — the nine that needed no new machinery at all.
  // ============================================================================

  'basep-1': { a: [                                    // Pikachu
    // "(Benching either Pokemon ends this effect.)" is FREE — DAMAGE_REDUCTION_FROM
    // carries a fromUid and the engine drops the effect when either slot leaves.
    [{ v: 'DAMAGE_REDUCTION_FROM', n: 10, label: 'Growl' }],   //   Growl
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Thundershock
  ]},
  'basep-4': { a: [                                    // Pikachu
    // Recharge is a SETUP TURN, not a stall: it pulls the Lightning out of the
    // deck rather than off the turn's one attachment, so a Thunderbolt that
    // emptied the slot is back in two turns instead of three. Trevor's note.
    [{ v: 'SEARCH_ENERGY_TO_SELF', t: 'L' }],          //   Recharge
    [{ v: 'COST_DISCARD_ALL_ENERGY' }],                //   Thunderbolt
  ]},
  'basep-6': { a: [                                    // Arcanine
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 10, bonus: 20, recoil: 0, label: 'Quick Attack' }],
    // Flames of Rage is the card that exposed ai.js dropping `base` from this
    // verb — at 40 it is most of the attack, where Dodrio's 10 was survivable.
    [{ v: 'COST_DISCARD_ENERGY', n: 2, t: 'R' },
     { v: 'DMG_PER_COUNTER_SELF', base: 40, per: 10 }],  //   Flames of Rage
  ]},
  'basep-7': { a: [                                    // Jigglypuff
    [{ v: 'HEAL_SELF', n: 1 }],                        //   First Aid
    [{ v: 'RECOIL', n: 20 }],                          //   Double-edge
  ]},
  'basep-15': { a: [                                   // Cool Porygon
    // Both halves of Texture Magic already existed as Porygon's two SEPARATE
    // attacks (base1-39, Conversion 1 and 2). This card does both at once, which
    // is a composition rather than a new verb — the card that looked hardest on
    // the survey and turned out to be free.
    // `endsOnBench` is Texture Magic's parenthetical and Porygon has no such
    // clause, so the flag is per-card rather than per-verb. Both halves carry it:
    // the card says "the effect on that Pokemon", so they expire separately.
    [{ v: 'CONVERT_SELF_RESISTANCE', endsOnBench: true },
     { v: 'CONVERT_DEF_WEAKNESS', endsOnBench: true }],   //   Texture Magic
    [{ v: 'DMG_PER_HEAD', coins: 3, per: 20 }],        //   3-D Attack
  ]},
  'basep-26': { a: [                                   // Pikachu
    // The printed text drops "in order to use this attack" that base1-16's
    // Thunderbolt carries, so strictly this is a post-damage discard rather than a
    // cost. Scripted as a COST anyway and the outcome is identical either way: the
    // attack's own LL cost guarantees there is something to discard, and a
    // self-effect is not stopped by anything the defender can do. Consistency with
    // every other Thunderbolt in the corpus wins the tie.
    [],                                                //   Scratch
    [{ v: 'COST_DISCARD_ALL_ENERGY' }],                //   Thunderbolt
  ]},
  'basep-27': { a: [                                   // Pikachu
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Thundershock
    [{ v: 'BARRIER_ON_FLIP', label: 'Agility' }],      //   Agility
  ]},
  'basep-28': { a: [ [] ]},                            // Surfing Pikachu / Surf

  // WAVE 2 — the five that needed new machinery. Four of the five reuse a shape
  // that already existed; only Cat Punch needed a mechanism, and that mechanism
  // was built in Job 10e for a different card.

  'basep-2': { a: [                                    // Electabuzz
    [{ v: 'DAMAGE_HALVE_SELF', label: 'Light Screen' }],   //   Light Screen
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 10, bonus: 20, recoil: 0, label: 'Quick Attack' }],
  ]},
  'basep-3': { a: [                                    // Mewtwo
    // Trevor's Setup Turn: two Energy out of the discard costs a turn and skips
    // a turn, which is only worth it when the discard actually holds them.
    [{ v: 'ENERGY_FROM_DISCARD_TO_SELF', n: 2 }],      //   Energy Absorption
    [],                                                //   Psyburn
  ]},
  'basep-8': { a: [                                    // Mew
    [{ v: 'DMG_PER_DEF_ENERGY', base: 0, per: 10 }],   //   Psywave
    [{ v: 'DEVOLVE_CHOOSE' }],                         //   Devolution Beam
  ]},
  'basep-10': { a: [                                   // Meowth
    [{ v: 'CAT_PUNCH', dmg: 20 }],                     //   Cat Punch
  ]},
  'basep-12': { a: [                                   // Mewtwo
    [{ v: 'MOVE_OPP_ENERGY_ON_FLIP' }],                //   Energy Control
    // "1 of your opponent's Pokemon" — the Active included, which is the wider
    // Team Rocket scope rather than Base Set's Bench-only wording. Trevor's note
    // says the same: "Telekinesis can also hit the active pokemon if desired, so
    // all in play should be considered potential targets."
    [{ v: 'BENCH_SNIPE', n: 1, dmg: 30, target: 'any', label: 'Telekinesis' },
     { v: 'NO_WR' }],                                  //   Telekinesis
  ]},
  // WAVE 3 — the one-coin-many-consequences group. Four of the seven are
  // parameters on FLIP_BONUS_OR_RECOIL rather than verbs of their own, which is
  // that verb's stated purpose: a card tying several outcomes to ONE coin cannot
  // be two verbs, because two verbs flip twice.

  'basep-17': { a: [                                   // Dark Persian
    [{ v: 'SWITCH_DEFENDER_CHOOSE_ON_FLIP', label: 'tempt them out?' }],   // Tempt
    [{ v: 'STATUS_ON_FLIP', s: 'Poisoned' }],          //   Poison Claws
  ]},
  'basep-18': { a: [                                   // Team Rocket's Meowth
    [{ v: 'DMG_PER_HEAD_IN_PLAY', per: 10 }],          //   Miraculous Comeback
  ]},
  'basep-19': { a: [                                   // Sabrina's Abra
    [],                                                //   Pound
    [{ v: 'REQUIRE_EQUAL_ENERGY' }],                   //   Synchronize
  ]},
  'basep-21': { a: [                                   // Moltres
    // "If you can't discard Energy cards, this attack does nothing" — enforced as
    // a COST requirement so the turn is never spent on an attack that cannot do
    // anything. The attack's own RRR cost already guarantees Fire is attached, so
    // this only bites when something else has emptied the slot mid-turn.
    [{ v: 'REQUIRE_SELF_ENERGY', t: 'R' },
     { v: 'DISCARD_ENERGY_COIN', heads: { n: 1, t: 'R' }, label: 'discard just one Fire?' }],
  ]},
  'basep-22': { a: [                                   // Articuno
    // ONE coin: the Paralysis and the Bench splash both ride it. Scripted as
    // three verbs this card could paralyse without splashing, which it cannot do.
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 20, bonus: 0, recoil: 0,
       statusOnHeads: 'Paralyzed', benchSplashOnHeads: { n: 10, side: 'theirs' },
       label: 'Diamond Dust' }],                       //   Diamond Dust
  ]},
  'basep-23': { a: [                                   // Zapdos
    // The 30 to the Active lands either way; the coin only decides whether the
    // Bench takes 30 as well or Zapdos takes it instead.
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 30, bonus: 0, recoil: 30,
       snipeOnHeads: { dmg: 30 }, label: 'Lightning Burn' }],   //   Lightning Burn
  ]},
  'basep-24': { a: [                                   // _____'s Pikachu
    // Trevor's, and the date is his. A player profile is the right long-term home
    // for a real birthday — settled 26 Aug 2026 as out of scope here — so the day
    // is written into the effect script and `cfg.today` lets a test pin it.
    [{ v: 'BIRTHDAY', month: 7, day: 31, base: 30, bonus: 50, whose: "Trevor's" }],
  ]},
  'basep-25': { a: [                                   // Flying Pikachu
    [{ v: 'STATUS_ON_FLIP', s: 'Paralyzed' }],         //   Thundershock
    // "if tails, this attack does nothing (not even damage)" plus a Barrier on
    // heads, off ONE coin. FLIP_OR_NOTHING beside BARRIER_ON_FLIP would flip
    // twice and could shield a Flying Pikachu whose attack did nothing.
    [{ v: 'FLIP_BONUS_OR_RECOIL', base: 30, bonus: 0, recoil: 0,
       barrierOnHeads: true, nothingOnTails: true, label: 'Fly' }],   //   Fly
  ]},
  // WAVE 4 — the three Powers and the Trainer. This finishes basep-1..28, the
  // whole of Job 13's scope.

  'basep-5': {                                         // Dragonite
    p: { kind: 'TOP_DECK_SWAP', name: 'Special Delivery' },
    a: [
      [{ v: 'FLIP_OR_NOTHING' }],                      //   Supersonic Flight
    ],
  },
  'basep-11': {                                        // Eevee
    // The card prints no status clause of its own beyond the standard one, so it
    // does NOT get `always` — see POWERS.md on why that flag needs the card read.
    p: { kind: 'CHAIN_REACTION', name: 'Chain Reaction' },
    a: [
      [],                                              //   Bite
    ],
  },
  'basep-13': {                                        // Venusaur
    p: { kind: 'CLEAR_STATUS_BOTH_ACTIVE', name: 'Solar Power' },
    a: [
      [{ v: 'HEAL_SELF_EQUAL_DAMAGE', half: true }],   //   Mega Drain
    ],
  },
  'basep-16': { t: [{ v: 'T_COMPUTER_ERROR' }] },      // Computer Error

  // ── GYM HEROES ─────────────────────────────────────────────────────────────
  // THE STADIUM ZONE. All seven Gyms are continuous rules rather than scheduled
  // events, so each one is a single T_STADIUM descriptor and the engine consults
  // it where the rule lives. Nothing here runs again after the card is played.
  'gym1-103': { t: [{ v: 'T_STADIUM', gym: 'STADIUM_TRAINER_TOLL', n: 2,
                      names: ['Energy Removal', 'Super Energy Removal'] }] },
  'gym1-104': { t: [{ v: 'T_STADIUM', gym: 'STADIUM_RETREAT_TAX', n: 1 }] },
  'gym1-108': { t: [{ v: 'T_STADIUM', gym: 'STADIUM_RETREAT_DISCOUNT_NAMED', n: 1, who: 'Misty' }] },
  'gym1-115': { t: [{ v: 'T_STADIUM', gym: 'STADIUM_NO_RESISTANCE_NAMED', who: 'Brock' }] },
  // onPlay: replaying Narrow Gym really does force another Bench return, so it is
  // exempt from the "a Stadium that changes nothing is unplayable" gate.
  'gym1-124': { t: [{ v: 'T_STADIUM', gym: 'STADIUM_BENCH_CAP', n: 4, onPlay: true }] },
  'gym1-107': { t: [{ v: 'T_STADIUM', gym: 'STADIUM_HEAL_STATUS_NAMED', who: 'Erika' }] },
  'gym1-120': { t: [{ v: 'T_STADIUM', gym: 'STADIUM_ATTACK_BONUS_NAMED', n: 10, who: 'Lt. Surge' }] },
  'gym1-123': { t: [{ v: 'T_DUEL' }] },
  'gym1-119': { t: [{ v: 'T_TICKLE' }] },

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

  // ---- Team Rocket ----
  // Every Rare in the set is printed twice, holo and not. NOTE WHICH CARD IS
  // ABSENT: Dark Vileplume. Its two printings differ in WEAKNESS (base5-13
  // Fire, base5-30 Fighting), confirmed against the physical card, so they are
  // two behaviours and must never be aliased together. See DATA.md.
  'base5-18': 'base5-1',      // Dark Alakazam
  'base5-19': 'base5-2',      // Dark Arbok
  'base5-20': 'base5-3',      // Dark Blastoise
  'base5-21': 'base5-4',      // Dark Charizard
  'base5-22': 'base5-5',      // Dark Dragonite
  'base5-23': 'base5-6',      // Dark Dugtrio
  'base5-24': 'base5-7',      // Dark Golbat
  'base5-25': 'base5-8',      // Dark Gyarados
  'base5-26': 'base5-9',      // Dark Hypno
  'base5-27': 'base5-10',     // Dark Machamp
  'base5-28': 'base5-11',     // Dark Magneton
  'base5-29': 'base5-12',     // Dark Slowbro
  'base5-31': 'base5-14',     // Dark Weezing
  'base5-71': 'base5-15',     // Here Comes Team Rocket!
  'base5-72': 'base5-16',     // Rocket's Sneak Attack
  'base5-80': 'base5-17',     // Rainbow Energy
  // ---- Promos ----
  // basep-14 and basep-9 are the same card printed twice in the promo run, which
  // is the ordinary holo/non-holo shape above. Trevor's workbook independently
  // says "Identical to basep-3" and "Identical to basep-8" on exactly these two,
  // and selftest's in-set duplicate check named the same pair unprompted.
  'basep-14': 'basep-3',      // Mewtwo
  'basep-9': 'basep-8',       // Mew
  // AND ONE CROSS-SET, which is new here and is why it gets a note. basep-20 is
  // Fossil's Psyduck reprinted as a promo — same HP, type, retreat, weakness and
  // both attacks, verified field by field rather than by name. selftest's
  // duplicate check is IN-SET by construction and cannot see this one, so nothing
  // would have complained about a second copy of the script; it is aliased because
  // two identical cards running two scripts is how they drift apart later.
  'basep-20': 'base3-53',     // Psyduck

  // GYM HEROES prints its four Gym Leader Trainers twice each, at two different
  // numbers. Aliased before either side is written — the loop below is a no-op
  // while the source is missing, and both halves land together when it is.
  'gym1-98':  'gym1-15',      // Brock
  'gym1-100': 'gym1-16',      // Erika
  'gym1-101': 'gym1-17',      // Lt. Surge
  'gym1-102': 'gym1-18',      // Misty
};

// Applied by reference on purpose: the two ids resolve to the SAME object, so
// they cannot drift even if somebody mutates one at runtime.
for (const dup in EFFECT_ALIASES) {
  const src = EFFECTS[EFFECT_ALIASES[dup]];
  if (src) EFFECTS[dup] = src;
}

if (typeof module !== 'undefined') module.exports = { EFFECTS, EFFECT_ALIASES };

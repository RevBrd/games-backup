// Behavioural tests for the Pokemon Power system (Job 4d).
//
//   node tools/powertest.js
//
// selftest.js proves games don't crash; this proves the Powers do what the cards
// say. Each case builds a board by hand, fires the Power, and asserts the exact
// state change â€” including the cases where it must be ILLEGAL, which is where
// these rules actually live.

const { CARD_DB, DECKS } = require('../src/cards.js');
const { EFFECTS } = require('../src/effects.js');
const { Engine } = require('../src/engine.js');
const { wallScore } = require('../src/ai.js');   // `AI` is imported lower down

let pass = 0, fail = 0;
const T = (name, fn) => {
  try {
    const r = fn();
    if (r === false) { console.log(`  FAIL  ${name}`); fail++; }
    else { console.log(`  ok    ${name}`); pass++; }
  } catch (e) { console.log(`  FAIL  ${name}  [${e.message}]`); if (process.env.PT_STACK) console.log(e.stack); fail++; }
};
const eq = (a, b, what) => { if (a !== b) throw new Error(`${what}: expected ${b}, got ${a}`); return true; };

// Build a board directly. Decks/hands are irrelevant to Power behaviour, so this
// skips the whole setup dance and just places what each test needs.
function board(activeId, benchIds = [], oppActiveId = 'base1-58') {
  const E = new Engine(CARD_DB, EFFECTS, { seed: 1 });
  E.newGame(DECKS.Brushfire, DECKS.Zap, ['A', 'B']);
  const mk = id => E.mkSlot({ id, uid: E.uid++ });
  const p = E.state.players[0], o = E.state.players[1];
  p.active = mk(activeId);
  p.bench = benchIds.map(mk);
  o.active = mk(oppActiveId);
  o.bench = [];
  // Prizes matter as soon as anything can Knock a Pokemon Out â€” Buzzap hands one
  // over. Without them the engine reads "no Prizes left" as someone having won.
  const prize = () => ({ id: 'base1-99', uid: E.uid++ });
  p.prizes = Array.from({ length: 6 }, prize);
  o.prizes = Array.from({ length: 6 }, prize);
  E.state.phase = 'main';
  E.state.active = 0;
  E.state.pendingPromote = null;
  E.state.turn = 3;
  [...E.allSlots(0), ...E.allSlots(1)].forEach(s => { s.playedTurn = 0; });
  return E;
}
// engine.js keeps topCard module-scoped, so the harness needs its own â€” and it
// has to honour Transform the same way, or every Ditto assertion reads the card
// underneath instead of what the game is treating it as.
const top = (E, slot) => (slot && slot.transformedId && E.db[slot.transformedId])
  || E.db[slot.stack[slot.stack.length - 1].id];
const attach = (E, slot, energyId, n = 1) => {
  for (let i = 0; i < n; i++) slot.energy.push({ id: energyId, uid: E.uid++ });
};

console.log('\nPokemon Power behaviour\n');

// ---------------------------------------------------------------- Damage Swap
console.log('Alakazam â€” Damage Swap');

T('moves one damage counter between your own Pokemon', () => {
  const E = board('base1-1', ['base1-3']);                 // Alakazam active, Chansey benched
  const [alak, chansey] = E.allSlots(0);
  alak.dmg = 30;
  const r = E.act(0, { t: 'power', uid: alak.uid, kind: 'MOVE_DAMAGE', from: alak.uid, to: chansey.uid });
  if (!r.ok) throw new Error(r.error);
  eq(alak.dmg, 20, 'source damage'); eq(chansey.dmg, 10, 'destination damage');
  return true;
});

T('refuses a move that would Knock Out the receiving Pokemon', () => {
  const E = board('base1-1', ['base1-43']);                 // Abra, 30 HP
  const [alak, abra] = E.allSlots(0);
  alak.dmg = 30; abra.dmg = 20;                             // one more counter kills Abra
  const r = E.act(0, { t: 'power', uid: alak.uid, kind: 'MOVE_DAMAGE', from: alak.uid, to: abra.uid });
  eq(r.ok, false, 'should be rejected');
  eq(abra.dmg, 20, 'destination unchanged');
  return true;
});

T('offers no move from an undamaged Pokemon', () => {
  const E = board('base1-1', ['base1-3']);
  const acts = E.legalActions(0).filter(a => a.t === 'power');
  eq(acts.length, 0, 'power actions with no damage on the board');
  return true;
});

T('works from the Bench, not just the Active spot', () => {
  const E = board('base1-3', ['base1-1']);                  // Alakazam benched
  const [chansey, alak] = E.allSlots(0);
  chansey.dmg = 20;
  const acts = E.legalActions(0).filter(a => a.t === 'power' && a.from === chansey.uid);
  if (!acts.length) throw new Error('no Damage Swap offered from the Bench');
  return true;
});

T('is switched off by Asleep, Confused and Paralyzed', () => {
  for (const st of ['asleep', 'confused', 'paralyzed']) {
    const E = board('base1-1', ['base1-3']);
    const [alak, chansey] = E.allSlots(0);
    alak.dmg = 30; alak.status[st] = true;
    if (E.legalActions(0).some(a => a.t === 'power')) throw new Error(`still offered while ${st}`);
    const r = E.act(0, { t: 'power', uid: alak.uid, kind: 'MOVE_DAMAGE', from: alak.uid, to: chansey.uid });
    if (r.ok) throw new Error(`still usable while ${st}`);
  }
  return true;
});

T('every enumerated move is legal when played', () => {
  const E = board('base1-1', ['base1-3', 'base1-43', 'base1-58']);
  const slots = E.allSlots(0);
  slots[0].dmg = 40; slots[1].dmg = 20; slots[3].dmg = 10;
  for (const a of E.legalActions(0).filter(x => x.t === 'power')) {
    const probe = board('base1-1', ['base1-3', 'base1-43', 'base1-58']);
    const ps = probe.allSlots(0);
    ps[0].dmg = 40; ps[1].dmg = 20; ps[3].dmg = 10;
    // uids are allocated in the same order, so the action transfers cleanly
    const r = probe.act(0, a);
    if (!r.ok) throw new Error(`enumerated action was rejected: ${a.label} â€” ${r.error}`);
  }
  return true;
});

// ---------------------------------------------------------------- Energy Burn
console.log('\nCharizard â€” Energy Burn');

// ALWAYS ON as of 16 Aug 2026 — Trevor, "similar to Muk's Toxic Gas". It was an
// interactive Power you switched on for the turn, which is a click with no
// decision behind it: Charizard's only attack is Fire Spin at RRRR, so there has
// never been a board on which you would decline. These four tests used to drive
// the toggle; they assert the consultation now.
T('lets non-Fire Energy pay a Fire cost, with nothing switched on', () => {
  const E = board('base1-4');                               // Fire Spin costs RRRR
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-102', 4);                          // four Water Energy
  eq(E.canUseAttack(0, 0).ok, true, 'Fire Spin is payable immediately');
  return true;
});

T('preserves symbol count, so Double Colorless still pays for two', () => {
  const E = board('base1-4');
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-96', 2);                           // 2 x DCE = 4 symbols
  eq(E.slotSymbols(zard).join(''), 'RRRR', 'symbols under Energy Burn');
  return true;
});

T('is never offered as an action, because there is nothing to choose', () => {
  const E = board('base1-4');
  attach(E, E.state.players[0].active, 'base1-102', 4);
  eq(E.legalActions(0).filter(a => a.t === 'power' && a.kind === 'ENERGY_AS').length, 0, 'offers');
  return true;
});

T('switches off with the Power, which a set flag never did', () => {
  // The real gain from making it passive rather than a toggle: it now respects
  // everything that shuts a Power down. A flag set before falling asleep used to
  // survive the turn.
  const E = board('base1-4');
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-102', 4);
  zard.status.asleep = true;
  eq(E.slotSymbols(zard).join(''), 'WWWW', 'asleep, so no Energy Burn');
  eq(E.canUseAttack(0, 0).ok, false, 'and Fire Spin is unpayable again');
  return true;
});

T('...and under Toxic Gas', () => {
  const E = board('base1-4');
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-102', 4);
  E.state.players[1].bench = [E.mkSlot({ id: 'base3-13', uid: E.uid++ })];   // Muk
  eq(E.slotSymbols(zard).join(''), 'WWWW', 'Toxic Gas shuts Energy Burn off too');
  return true;
});

// --------------------------------------------------------------- Strikes Back
console.log('\nMachamp â€” Strikes Back');

// Pikachu's Gnaw (idx 0) is used throughout rather than Thunder Jolt, because
// Thunder Jolt damages itself on tails and the tests could not then tell
// retaliation apart from recoil. Gnaw is a plain 10 with no side effects.
T('damages the attacker when Machamp is hit', () => {
  const E = board('base1-8', [], 'base1-58');               // Machamp vs Pikachu
  E.state.active = 1;
  const pika = E.state.players[1].active, champ = E.state.players[0].active;
  attach(E, pika, 'base1-100', 1);
  const r = E.act(1, { t: 'attack', idx: 0 });              // Gnaw, 10, no recoil
  if (!r.ok) throw new Error(r.error);
  if (champ.dmg <= 0) throw new Error('Machamp took no damage â€” test setup wrong');
  eq(pika.dmg, 10, 'attacker took exactly the retaliation damage');
  if (!E.state.log.some(l => (l.text || '').includes('Strikes Back'))) throw new Error('no Strikes Back in the log');
  return true;
});

T('does not fire on an attack that deals no damage', () => {
  const E = board('base1-8', [], 'base1-50');               // Gastly: Sleeping Gas does 0
  E.state.active = 1;
  const gastly = E.state.players[1].active;
  attach(E, gastly, 'base1-101', 1);
  E.act(1, { t: 'attack', idx: 0 });
  eq(gastly.dmg, 0, 'attacker damage after a damageless attack');
  return true;
});

T('is switched off while Machamp is Asleep', () => {
  const E = board('base1-8', [], 'base1-58');
  E.state.active = 1;
  const pika = E.state.players[1].active, champ = E.state.players[0].active;
  champ.status.asleep = true;
  attach(E, pika, 'base1-100', 1);
  E.act(1, { t: 'attack', idx: 0 });
  eq(pika.dmg, 0, 'attacker damage while Machamp sleeps');
  return true;
});

T('fires even when the hit Knocks Machamp Out', () => {
  const E = board('base1-8', [], 'base1-58');
  E.state.active = 1;
  const pika = E.state.players[1].active, champ = E.state.players[0].active;
  champ.dmg = 90;                                           // 100 HP, one hit from death
  attach(E, pika, 'base1-100', 1);
  E.act(1, { t: 'attack', idx: 0 });
  eq(pika.dmg, 10, 'attacker damaged by a dying Machamp');
  return true;
});

T('two Machamps do not retaliate at each other forever', () => {
  const E = board('base1-8', [], 'base1-8');
  E.state.active = 1;
  const them = E.state.players[1].active;
  attach(E, them, 'base1-97', 4);
  const r = E.act(1, { t: 'attack', idx: 0 });              // Seismic Toss
  if (!r.ok) throw new Error(r.error);
  return true;                                              // reaching here at all is the assertion
});

// ----------------------------------------------------------------- Rain Dance
console.log('\nBlastoise â€” Rain Dance');

T('attaches a Water Energy from hand to a Water Pokemon', () => {
  const E = board('base1-2', ['base1-63']);                 // Blastoise, Squirtle
  const p = E.state.players[0];
  p.hand = [{ id: 'base1-102', uid: E.uid++ }];
  const [blast, squirt] = E.allSlots(0);
  const a = E.legalActions(0).find(x => x.t === 'power' && x.to === squirt.uid);
  if (!a) throw new Error('Rain Dance not offered');
  const r = E.act(0, a);
  if (!r.ok) throw new Error(r.error);
  eq(squirt.energy.length, 1, 'Energy on Squirtle');
  eq(p.hand.length, 0, 'card left the hand');
  return true;
});

T('does not use up the turn\'s one Energy attachment', () => {
  const E = board('base1-2', ['base1-63']);
  const p = E.state.players[0];
  p.hand = [{ id: 'base1-102', uid: E.uid++ }, { id: 'base1-102', uid: E.uid++ }];
  const a = E.legalActions(0).find(x => x.t === 'power');
  E.act(0, a);
  eq(p.energyAttached, false, 'attachment flag untouched');
  // and the ordinary attachment is still available afterwards
  if (!E.legalActions(0).some(x => x.t === 'attachEnergy')) throw new Error('normal attach no longer offered');
  return true;
});

T('refuses a non-Water Pokemon', () => {
  const E = board('base1-2', ['base1-58']);                 // Pikachu is Lightning
  const p = E.state.players[0];
  p.hand = [{ id: 'base1-102', uid: E.uid++ }];
  const pika = E.allSlots(0)[1];
  if (E.legalActions(0).some(x => x.t === 'power' && x.to === pika.uid))
    throw new Error('offered Rain Dance onto a Lightning Pokemon');
  const r = E.act(0, { t: 'power', uid: E.allSlots(0)[0].uid, kind: 'EXTRA_ATTACH', to: pika.uid });
  eq(r.ok, false, 'direct call rejected too');
  return true;
});

T('will not attach Double Colorless, which is not Water Energy', () => {
  const E = board('base1-2', ['base1-63']);
  E.state.players[0].hand = [{ id: 'base1-96', uid: E.uid++ }];   // DCE
  eq(E.legalActions(0).filter(x => x.t === 'power').length, 0, 'power actions offered');
  return true;
});

T('is not offered with no Water Energy in hand', () => {
  const E = board('base1-2', ['base1-63']);
  E.state.players[0].hand = [{ id: 'base1-98', uid: E.uid++ }];   // Fire
  eq(E.legalActions(0).filter(x => x.t === 'power').length, 0, 'power actions offered');
  return true;
});

// ---------------------------------------------------------------- Energy Trans
console.log('\nVenusaur â€” Energy Trans');

T('moves a Grass Energy between your own Pokemon', () => {
  const E = board('base1-15', ['base1-44']);                // Venusaur, Bulbasaur
  const [venu, bulba] = E.allSlots(0);
  attach(E, venu, 'base1-99', 2);                           // 2 Grass on Venusaur
  const a = E.legalActions(0).find(x => x.t === 'power' && x.from === venu.uid && x.to === bulba.uid);
  if (!a) throw new Error('Energy Trans not offered');
  const r = E.act(0, a);
  if (!r.ok) throw new Error(r.error);
  eq(venu.energy.length, 1, 'source Energy'); eq(bulba.energy.length, 1, 'destination Energy');
  return true;
});

T('has no destination type restriction', () => {
  const E = board('base1-15', ['base1-58']);                // Pikachu, a Lightning Pokemon
  const [venu, pika] = E.allSlots(0);
  attach(E, venu, 'base1-99', 1);
  const a = E.legalActions(0).find(x => x.t === 'power' && x.to === pika.uid);
  if (!a) throw new Error('Energy Trans should allow any of your own Pokemon');
  eq(E.act(0, a).ok, true, 'move accepted');
  eq(pika.energy.length, 1, 'Grass Energy on a Lightning Pokemon');
  return true;
});

T('moves only Grass Energy, not whatever happens to be attached', () => {
  const E = board('base1-15', ['base1-44']);
  const [venu, bulba] = E.allSlots(0);
  attach(E, venu, 'base1-101', 2);                          // Psychic, not Grass
  eq(E.legalActions(0).filter(x => x.t === 'power').length, 0, 'power actions offered');
  return true;
});

T('can pull Energy off the Bench onto the Active', () => {
  const E = board('base1-15', ['base1-44']);
  const [venu, bulba] = E.allSlots(0);
  attach(E, bulba, 'base1-99', 1);
  const a = E.legalActions(0).find(x => x.t === 'power' && x.from === bulba.uid && x.to === venu.uid);
  if (!a) throw new Error('no Bench-to-Active move offered');
  eq(E.act(0, a).ok, true, 'accepted');
  eq(venu.energy.length, 1, 'Energy arrived on Venusaur');
  return true;
});

T('is switched off by Asleep, Confused and Paralyzed', () => {
  for (const st of ['asleep', 'confused', 'paralyzed']) {
    const E = board('base1-15', ['base1-44']);
    const [venu] = E.allSlots(0);
    attach(E, venu, 'base1-99', 2);
    venu.status[st] = true;
    if (E.legalActions(0).some(a => a.t === 'power')) throw new Error(`still offered while ${st}`);
  }
  return true;
});

// --------------------------------------------------------------------- Buzzap
console.log('\nElectrode â€” Buzzap');

const buzzap = (E, fromSlot, toSlot, type = 'L') =>
  E.act(0, { t: 'power', uid: fromSlot.uid, kind: 'BUZZAP', to: toSlot.uid, type });

T('the Electrode becomes one Energy card providing two of the chosen type', () => {
  const E = board('base1-21', ['base1-58']);                // Electrode active, Pikachu bench
  const [trode, pika] = E.allSlots(0);
  const r = buzzap(E, trode, pika, 'L');
  if (!r.ok) throw new Error(r.error);
  eq(pika.energy.length, 1, 'ONE card attached');
  eq(E.slotSymbols(pika).join(''), 'LL', 'providing TWO Lightning');
  return true;
});

T('the opponent takes a Prize', () => {
  const E = board('base1-21', ['base1-58']);
  const [trode, pika] = E.allSlots(0);
  const before = E.state.players[1].prizes.length;
  buzzap(E, trode, pika);
  eq(E.state.players[1].prizes.length, before - 1, 'opponent prizes remaining');
  eq(E.state.players[1].hand.length > 0, true, 'the Prize went to their hand');
  return true;
});

T('the Electrode leaves play but does NOT go to the discard', () => {
  const E = board('base1-21', ['base1-58']);
  const [trode, pika] = E.allSlots(0);
  buzzap(E, trode, pika);
  const p = E.state.players[0];
  eq(p.active, null, 'no longer Active');
  eq(p.discard.some(c => c.id === 'base1-21'), false, 'not in the discard');
  eq(pika.energy[0].id, 'base1-21', 'it IS the Electrode card, attached as Energy');
  return true;
});

T('a Voltorb beneath it is discarded', () => {
  const E = board('base1-21', ['base1-58']);
  const [trode, pika] = E.allSlots(0);
  trode.stack.unshift({ id: 'base1-67', uid: E.uid++ });    // Voltorb under the Electrode
  buzzap(E, trode, pika);
  eq(E.state.players[0].discard.some(c => c.id === 'base1-67'), true, 'Voltorb in the discard');
  return true;
});

T('Energy attached to the Electrode is discarded with it', () => {
  const E = board('base1-21', ['base1-58']);
  const [trode, pika] = E.allSlots(0);
  attach(E, trode, 'base1-100', 2);
  buzzap(E, trode, pika);
  eq(E.state.players[0].discard.filter(c => c.id === 'base1-100').length, 2, 'its Energy discarded');
  eq(pika.energy.length, 1, 'only the Electrode moved across');
  return true;
});

T('the resulting Energy actually pays for an attack', () => {
  const E = board('base1-21', ['base1-20']);                // Electabuzz: Thundershock costs L
  const [trode, buzz] = E.allSlots(0);
  buzzap(E, trode, buzz, 'L');
  E.act(0, { t: 'promote', bench: 0 });                     // Electabuzz comes up
  eq(E.canUseAttack(0, 0).ok, true, 'Thundershock payable');
  eq(E.canUseAttack(0, 1).ok, true, 'Thunderpunch (LC) payable from the same card');
  return true;
});

// UPDATED TWICE, and the history is the interesting part — this one assertion
// has stated the project's position on retreat costs three separate times.
//
//   originally  a Buzzap'd Electrode counts TWO toward a retreat, providing 'CC'
//   12 Aug 26   retreat is paid in CARDS, so it counts ONE and Onix needs three
//   17 Aug 26   reversed — a retreat is a COST and costs count symbols, so it is
//               back to two, and Onix retreats on two cards
//
// The reversal is reasoned in Rulings/RETREAT-COST.md, which keeps the original
// ruling above its correction rather than replacing it. What never moved through
// any of the three: the DISCARD is still whole cards. That is the distinction the
// test above this one states, and it is why this pair sits together.
T('it pays TWO toward a retreat cost, because that is what it provides', () => {
  const E = board('base1-21', ['base1-56']);                // Onix, retreat 3
  const [trode, onix] = E.allSlots(0);
  eq(E.canRetreat(onix), false, 'cannot retreat with nothing attached');
  buzzap(E, trode, onix, 'F');
  eq(E.canRetreat(onix), false, 'CC alone is two, and two is not three');
  attach(E, onix, 'base1-97', 1);
  eq(E.canRetreat(onix), true, 'CC plus one basic is three — two cards, three symbols');
  return true;
});

T('needs one of your OTHER Pokemon, and offers nothing when alone', () => {
  const E = board('base1-21');
  const trode = E.state.players[0].active;
  eq(E.legalActions(0).filter(a => a.t === 'power').length, 0, 'power actions offered');
  eq(buzzap(E, trode, trode).ok, false, 'targeting itself rejected');
  return true;
});

T('forces a promotion when the Electrode was Active', () => {
  const E = board('base1-21', ['base1-58']);
  const [trode, pika] = E.allSlots(0);
  buzzap(E, trode, pika);
  eq(E.state.pendingPromote, 0, 'player must promote');
  return true;
});

T('does not force a promotion when the Electrode was benched', () => {
  const E = board('base1-58', ['base1-21']);                // Electrode on the Bench
  const [pika, trode] = E.allSlots(0);
  buzzap(E, trode, pika);
  eq(E.state.pendingPromote, null, 'no promotion needed');
  eq(pika.energy.length, 1, 'Energy attached to the Active');
  return true;
});

T('is switched off by Asleep, Confused and Paralyzed', () => {
  for (const st of ['asleep', 'confused', 'paralyzed']) {
    const E = board('base1-21', ['base1-58']);
    const [trode, pika] = E.allSlots(0);
    trode.status[st] = true;
    if (E.legalActions(0).some(a => a.t === 'power')) throw new Error(`still offered while ${st}`);
    if (buzzap(E, trode, pika).ok) throw new Error(`still usable while ${st}`);
  }
  return true;
});

T('rejects a type that is not an Energy type', () => {
  const E = board('base1-21', ['base1-58']);
  const [trode, pika] = E.allSlots(0);
  eq(buzzap(E, trode, pika, 'Q').ok, false, 'nonsense type rejected');
  eq(buzzap(E, trode, pika, '').ok, false, 'empty type rejected');
  return true;
});

T('handing over the last Prize ends the game', () => {
  const E = board('base1-21', ['base1-58']);
  E.state.players[1].prizes = [{ id: 'base1-99', uid: E.uid++ }];
  const [trode, pika] = E.allSlots(0);
  buzzap(E, trode, pika);
  eq(E.state.winner, 1, 'opponent wins');
  return true;
});

// ================== the oddities (Job 4g) ==================
// Not Pokemon Powers, but the same reason for living here: each needed bespoke
// engine machinery, and the theme decks contain none of them, so nothing else
// exercises these paths.

console.log('\nPoliwhirl â€” Amnesia');

T('disables the chosen attack, and only that one', () => {
  const E = board('base1-38', [], 'base1-20');              // Poliwhirl vs Electabuzz
  const poli = E.state.players[0].active, buzz = E.state.players[1].active;
  attach(E, poli, 'base1-102', 2);
  const r = E.act(0, { t: 'attack', idx: 0, opts: { attackIdx: 1 } });   // lock Thunderpunch
  if (!r.ok) throw new Error(r.error);
  attach(E, buzz, 'base1-100', 2);
  eq(E.canUseAttack(1, 1).ok, false, 'Thunderpunch locked');
  eq(E.canUseAttack(1, 0).ok, true, 'Thundershock still usable');
  return true;
});

console.log('\nClefairy â€” Metronome');

T('copies a chosen attack from the Defending Pokemon', () => {
  const E = board('base1-5', [], 'base1-3');                // Clefairy vs Chansey
  const clef = E.state.players[0].active, chan = E.state.players[1].active;
  attach(E, clef, 'base1-101', 3);
  const acts = E.legalActions(0).filter(a => a.t === 'attack' && a.idx === 1);
  if (acts.length < 2) throw new Error(`expected one action per copyable attack, got ${acts.length}`);
  const dbl = acts.find(a => /Double-edge/.test(a.label));
  if (!dbl) throw new Error('Double-edge not offered as a copy target');
  const r = E.act(0, dbl);
  if (!r.ok) throw new Error(r.error);
  eq(chan.dmg, 80, 'Chansey took Double-edge');
  return true;
});

T('the recoil lands on Clefairy, not on the card it was copied from', () => {
  const E = board('base1-5', ['base1-58'], 'base1-3');
  const clef = E.state.players[0].active;
  attach(E, clef, 'base1-101', 3);
  const dbl = E.legalActions(0).filter(a => a.t === 'attack' && a.idx === 1)
    .find(a => /Double-edge/.test(a.label));
  E.act(0, dbl);
  // Clefairy has 40 HP and Double-edge self-inflicts 80, so it dies â€” which is
  // the point: "does damage to itself" means the Pokemon USING the attack.
  eq(E.state.players[0].discard.some(c => c.id === 'base1-5'), true, 'Clefairy took its own recoil');
  return true;
});

T('does not pay the copied attack\'s costs', () => {
  const E = board('base1-5', [], 'base1-12');              // Ninetales: Fire Blast discards Fire
  const clef = E.state.players[0].active;
  attach(E, clef, 'base1-101', 3);
  const before = clef.energy.length;
  const fb = E.legalActions(0).filter(a => a.t === 'attack' && a.idx === 1)
    .find(a => /Fire Blast/.test(a.label));
  if (!fb) throw new Error('Fire Blast not offered');
  E.act(0, fb);
  eq(clef.energy.length, before, 'Clefairy discarded nothing');
  return true;
});

T('cannot copy another Metronome', () => {
  const E = board('base1-5', [], 'base1-5');               // Clefairy mirror
  attach(E, E.state.players[0].active, 'base1-101', 3);
  const opts = E.legalActions(0).filter(a => a.t === 'attack' && a.idx === 1);
  eq(opts.length, 1, 'only Sing should be copyable');
  // The label reads "Metronome: copy X", so match the copied name, not the prefix.
  if (/copy Metronome/.test(opts[0].label)) throw new Error('offered Metronome as a copy target');
  return true;
});

console.log('\nPidgeotto â€” Mirror Move');

T('returns the damage that was dealt to it last turn', () => {
  const E = board('base1-22', [], 'base1-20');            // Pidgeotto vs Electabuzz
  const pidg = E.state.players[0].active, buzz = E.state.players[1].active;
  attach(E, buzz, 'base1-100', 2);
  E.state.active = 1;
  E.act(1, { t: 'attack', idx: 0 });                       // Thundershock, 10
  const dealt = pidg.dmg;
  if (dealt <= 0) throw new Error('setup: Pidgeotto took no damage');
  attach(E, pidg, 'base1-99', 3);
  E.state.active = 0; E.state.pendingPromote = null;
  E.act(0, { t: 'attack', idx: 1 });                        // Mirror Move
  eq(buzz.dmg, dealt, `mirrored ${dealt} back`);
  return true;
});

T('does nothing if it was not attacked last turn', () => {
  const E = board('base1-22', [], 'base1-20');
  const pidg = E.state.players[0].active, buzz = E.state.players[1].active;
  attach(E, pidg, 'base1-99', 3);
  E.act(0, { t: 'attack', idx: 1 });
  eq(buzz.dmg, 0, 'no damage dealt');
  if (!E.state.log.some(l => /not attacked last turn/.test(l.text || ''))) throw new Error('no explanation logged');
  return true;
});

T('mirrors the Special Condition too, not just the damage', () => {
  const E = board('base1-22', [], 'base1-53');             // Magnemite: Thunder Wave paralyses
  const pidg = E.state.players[0].active, mag = E.state.players[1].active;
  attach(E, mag, 'base1-100', 1);
  E.state.active = 1;
  E.dev.forceFlip = 'H';                                   // make the Paralyze land
  E.act(1, { t: 'attack', idx: 0 });
  E.dev.forceFlip = null;
  if (!pidg.status.paralyzed) throw new Error('setup: Pidgeotto was not Paralyzed');
  pidg.status.paralyzed = false;                            // clear so it may attack
  attach(E, pidg, 'base1-99', 3);
  E.state.active = 0; E.state.pendingPromote = null;
  E.act(0, { t: 'attack', idx: 1 });
  eq(mag.status.paralyzed, true, 'Paralysis mirrored back');
  return true;
});

console.log('\nPidgey / Pidgeotto â€” Whirlwind');

T('damage lands first, then the DEFENDER owes a choice', () => {
  const E = board('base1-57', [], 'base1-20');             // Pidgey vs Electabuzz
  const opp = E.state.players[1];
  opp.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ }), E.mkSlot({ id: 'base1-3', uid: E.uid++ })];
  const buzz = opp.active;
  attach(E, E.state.players[0].active, 'base1-99', 2);
  E.act(0, { t: 'attack', idx: 0 });                        // Whirlwind, 10
  eq(buzz.dmg, 10, 'damage applied before the switch');
  eq(E.state.pendingSwitch, 1, 'the defending player owes the choice');
  eq(E.state.active, 0, 'and the turn has not changed hands yet');
  return true;
});

T('only the defender may act, and the turn resumes once they have', () => {
  const E = board('base1-57', [], 'base1-20');
  const opp = E.state.players[1];
  opp.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  attach(E, E.state.players[0].active, 'base1-99', 2);
  E.act(0, { t: 'attack', idx: 0 });
  eq(E.legalActions(0).length, 0, 'attacker has nothing to do');
  const mine = E.legalActions(1);
  eq(mine.length > 0 && mine.every(a => a.t === 'switchIn'), true, 'defender may only switch in');
  E.act(1, mine[0]);
  eq(E.state.pendingSwitch, null, 'choice resolved');
  eq(E.state.active, 1, 'turn passed to the defender');
  eq(top(E, opp.active).name, 'Pikachu', 'the chosen Pokemon came up');
  return true;
});

T('does nothing when the defender has an empty Bench', () => {
  const E = board('base1-57', [], 'base1-20');
  attach(E, E.state.players[0].active, 'base1-99', 2);
  E.act(0, { t: 'attack', idx: 0 });
  eq(E.state.pendingSwitch, null, 'no choice owed');
  eq(E.state.active, 1, 'turn ended normally');
  return true;
});

T('is skipped when the damage Knocked the Defending Pokemon Out', () => {
  const E = board('base1-57', [], 'base1-43');             // Abra, 30 HP
  const opp = E.state.players[1];
  opp.active.dmg = 20;                                      // 10 more kills it
  opp.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  attach(E, E.state.players[0].active, 'base1-99', 2);
  E.act(0, { t: 'attack', idx: 0 });
  eq(E.state.pendingSwitch, null, 'no switch owed â€” they are promoting instead');
  eq(E.state.pendingPromote, 1, 'promotion owed');
  return true;
});

console.log('\nPorygon â€” Conversion');

T('Conversion 1 rewrites the defender\'s Weakness, and it bites', () => {
  const E = board('base1-39', [], 'base1-58');             // Pikachu, weak to Fighting
  const pory = E.state.players[0].active, pika = E.state.players[1].active;
  attach(E, pory, 'base1-99', 2);
  const opt = E.legalActions(0).filter(a => a.t === 'attack' && a.idx === 0)
    .find(a => /Weakness to C?G/.test(a.label) || /Weakness to G/.test(a.label));
  if (!opt) throw new Error('no Conversion 1 option offered');
  E.act(0, opt);
  eq(E.weaknessOf(pika), 'G', 'Weakness rewritten to Grass');
  // and the damage maths now reads the override
  const r = E.computeDamage(E.mkSlot({ id: 'base1-44', uid: E.uid++ }), pika, 20);
  eq(r.dmg, 40, 'a Grass attacker now doubles');
  return true;
});

T('Conversion 1 is not offered against a Pokemon with no Weakness', () => {
  const E = board('base1-39', [], 'base1-50');             // Gastly has no Weakness
  attach(E, E.state.players[0].active, 'base1-99', 2);
  eq(E.legalActions(0).filter(a => a.t === 'attack' && a.idx === 0).length, 0, 'Conversion 1 offered');
  return true;
});

T('Conversion 2 rewrites Porygon\'s own Resistance', () => {
  const E = board('base1-39', [], 'base1-58');
  const pory = E.state.players[0].active;
  attach(E, pory, 'base1-99', 2);
  const opt = E.legalActions(0).filter(a => a.t === 'attack' && a.idx === 1)
    .find(a => /Resistance to L/.test(a.label));
  if (!opt) throw new Error('no Conversion 2 option offered');
  E.act(0, opt);
  eq(E.resistanceOf(pory), 'L', 'Resistance rewritten to Lightning');
  return true;
});

// ------------------------------------------------------------- Clefairy Doll
console.log('\nClefairy Doll â€” a Trainer played as a Basic Pokemon');

// It is not in any theme deck and is played from hand rather than placed, so
// these build the hand rather than the board.
function withDollInHand() {
  const E = board('base1-58');                              // Pikachu Active
  E.state.players[0].hand = [{ id: 'base1-70', uid: E.uid++ }];
  return E;
}

T('can be played from hand as a Basic Pokemon', () => {
  const E = withDollInHand();
  const a = E.legalActions(0).find(x => x.t === 'playBasic');
  if (!a) throw new Error('not offered as a Basic');
  eq(E.act(0, a).ok, true, 'accepted');
  eq(E.state.players[0].bench.length, 1, 'on the Bench');
  eq(top(E, E.state.players[0].bench[0]).name, 'Clefairy Doll', 'and it is the Doll');
  return true;
});

T('is never offered as an ordinary Trainer play', () => {
  const E = withDollInHand();
  eq(E.legalActions(0).filter(x => x.t === 'playTrainer').length, 0, 'Trainer plays offered');
  return true;
});

T('cannot be your opening Pokemon â€” in hand it is still a Trainer', () => {
  const E = new Engine(CARD_DB, EFFECTS, { seed: 1 });
  E.newGame(DECKS.Brushfire, DECKS.Zap, ['A', 'B']);
  const p = E.state.players[0];
  p.active = null; p.bench = [];
  p.hand = [{ id: 'base1-70', uid: E.uid++ }];
  eq(E.basicsIn(p.hand).length, 0, 'counted as a Basic in hand');
  const r = E.setupPlace(0, 0, 'active');
  eq(r.ok, false, 'setupPlace accepted it');
  return true;
});

T('cannot retreat, and cannot be given a Special Condition', () => {
  const E = board('base1-58');
  const p = E.state.players[0];
  p.active = E.mkSlot({ id: 'base1-70', uid: E.uid++ });
  p.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  attach(E, p.active, 'base1-99', 4);                       // plenty of Energy
  eq(E.canRetreat(p.active), false, 'retreat refused');
  for (const st of ['Asleep', 'Confused', 'Paralyzed', 'Poisoned']) {
    E.applyStatus(p.active, st);
    if (p.active.status[st.toLowerCase()]) throw new Error(`${st} stuck to it`);
  }
  return true;
});

T('gives the opponent no Prize when Knocked Out', () => {
  const E = board('base1-58');
  const p = E.state.players[0];
  p.active = E.mkSlot({ id: 'base1-70', uid: E.uid++ });
  p.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  const before = E.state.players[1].prizes.length;
  p.active.dmg = 10;                                        // 10 HP, so this kills it
  E.checkKOs();
  eq(E.state.players[1].prizes.length, before, 'no Prize taken');
  eq(E.state.pendingPromote, 0, 'but a replacement is still owed');
  return true;
});

T('you still lose if it was your last Pokemon', () => {
  // The Knock Out does not count; having nothing in play still does.
  const E = board('base1-58');
  const p = E.state.players[0];
  p.active = E.mkSlot({ id: 'base1-70', uid: E.uid++ });
  p.bench = [];
  p.active.dmg = 10;
  E.checkKOs();
  eq(E.state.winner, 1, 'opponent wins');
  return true;
});

T('can be discarded from play at will, taking attachments with it', () => {
  const E = board('base1-58');
  const p = E.state.players[0];
  p.bench = [E.mkSlot({ id: 'base1-70', uid: E.uid++ })];
  attach(E, p.bench[0], 'base1-99', 2);
  const before = E.state.players[1].prizes.length;
  const a = E.legalActions(0).find(x => x.t === 'discardInPlay');
  if (!a) throw new Error('discard not offered');
  eq(E.act(0, a).ok, true, 'accepted');
  eq(p.bench.length, 0, 'gone from the Bench');
  eq(p.discard.filter(c => c.id === 'base1-99').length, 2, 'its Energy discarded too');
  eq(p.discard.some(c => c.id === 'base1-70'), true, 'the Doll is in the discard');
  eq(E.state.players[1].prizes.length, before, 'discarding is not a Knock Out');
  return true;
});

T('discarding it from the Active spot forces a promotion', () => {
  const E = board('base1-58');
  const p = E.state.players[0];
  p.active = E.mkSlot({ id: 'base1-70', uid: E.uid++ });
  p.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  E.act(0, E.legalActions(0).find(x => x.t === 'discardInPlay'));
  eq(E.state.pendingPromote, 0, 'promotion owed');
  return true;
});

T('Revive cannot reach one in the discard â€” there it is a Trainer again', () => {
  const E = board('base1-58');
  E.state.players[0].discard = [{ id: 'base1-70', uid: E.uid++ }];
  eq(E.basicsIn(E.state.players[0].discard).length, 0, 'offered as a Basic in the discard');
  return true;
});

// ------------------------------------------------------------------- AI usage
console.log('\nAI');

// Damage Swap costs nothing and doesn't use up the turn's Energy attachment, so
// the bot is right to interleave it with other work rather than always leading
// with it. These assert the OUTCOME of a whole turn, not the move order.
T('the AI uses Damage Swap to unload a badly hurt Alakazam', () => {
  const E = board('base1-1', ['base1-3']);                  // Alakazam active, Chansey bench
  const [alak, chansey] = E.allSlots(0);
  alak.dmg = 70;                                            // 80 HP, one hit from death
  E.aiTurn(0, 'expert');
  if (alak.dmg >= 70) throw new Error(`damage never moved off Alakazam (still ${alak.dmg})`);
  eq(chansey.dmg > 0, true, 'Chansey absorbed it');
  return true;
});

T('the AI prefers a high-HP low-threat sink', () => {
  const E = board('base1-1', ['base1-3', 'base1-20']);      // Chansey 120 vs Electabuzz 70
  const [alak, chansey, buzz] = E.allSlots(0);
  alak.dmg = 70;
  E.aiTurn(0, 'expert');
  if (chansey.dmg === 0 && buzz.dmg === 0) throw new Error('AI did not use the Power at all');
  eq(chansey.dmg > buzz.dmg, true, `Chansey ${chansey.dmg} should carry more than Electabuzz ${buzz.dmg}`);
  return true;
});

T('the AI will not dump damage onto something it would Knock Out', () => {
  const E = board('base1-1', ['base1-43']);                 // Abra, 30 HP
  const [alak, abra] = E.allSlots(0);
  alak.dmg = 70; abra.dmg = 20;                             // one more counter kills Abra
  // Empty the hand so Abra is the only possible sink. Left alone the bot benches
  // a fresh Pokemon and uses that instead, which is correct but tests nothing.
  E.state.players[0].hand = [];
  E.aiTurn(0, 'expert');
  eq(abra.dmg, 20, 'Abra survived untouched');
  eq(alak.dmg, 70, 'and the damage stayed put, there being nowhere legal to send it');
  return true;
});

// This one is here because its absence hid a real bug: bestAttackScore returns
// {score, idx}, the first version compared the objects, and Energy Burn was
// silently never worth anything. Unit tests passed; the AI just never used it.
// These two used to assert that the AI switched Energy Burn on when it helped
// and left it alone when it did not. It is passive now, so there is no decision
// left to get wrong — what matters is that the bot still ATTACKS with the Energy
// it could not previously pay with, which is what the Power was for.
T('the AI attacks with Energy Burn Energy without being told to', () => {
  const E = board('base1-4');
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-102', 4);                          // Water, pays RRRR only via the Power
  E.state.players[0].hand = [];
  E.aiTurn(0, 'expert');
  if (!E.state.log.some(l => (l.text || '').includes('Fire Spin'))) throw new Error('AI never attacked');
  return true;
});

T('and never spends an action on it, because there is no longer one to spend', () => {
  const E = board('base1-4');
  attach(E, E.state.players[0].active, 'base1-102', 4);
  E.state.players[0].hand = [];
  E.aiTurn(0, 'expert');
  if (E.state.log.some(l => (l.text || '').includes('Energy Burn'))) throw new Error('a Power action was still taken');
  return true;
});

T('the AI uses Rain Dance rather than spending its one attachment', () => {
  const E = board('base1-2');                               // Blastoise, Hydro Pump costs WWW
  const blast = E.state.players[0].active;
  attach(E, blast, 'base1-102', 2);
  E.state.players[0].hand = [{ id: 'base1-102', uid: E.uid++ }];
  E.aiTurn(0, 'expert');
  if (!E.state.log.some(l => (l.text || '').includes('Rain Dance'))) throw new Error('AI never used Rain Dance');
  return true;
});

T('the AI uses Energy Trans to feed the Pokemon that needs it', () => {
  const E = board('base1-15', ['base1-44']);                // Solarbeam costs GGGG
  const [venu, bulba] = E.allSlots(0);
  attach(E, venu, 'base1-99', 3);
  attach(E, bulba, 'base1-99', 2);
  E.state.players[0].hand = [];
  E.aiTurn(0, 'expert');
  if (!E.state.log.some(l => (l.text || '').includes('Energy Trans'))) throw new Error('AI never used Energy Trans');
  eq(venu.energy.length >= 4, true, `Venusaur ended with ${venu.energy.length} Energy`);
  return true;
});

T('the AI does not strip Energy off the Pokemon that is about to attack', () => {
  const E = board('base1-15', ['base1-44']);
  const [venu, bulba] = E.allSlots(0);
  attach(E, venu, 'base1-99', 4);                           // Solarbeam ready right now
  E.state.players[0].hand = [];
  E.aiTurn(0, 'expert');
  eq(venu.energy.length >= 4, true, `Venusaur was left with ${venu.energy.length} Energy`);
  return true;
});

T('Energy Trans does not send the AI into an infinite shuffle', () => {
  // The regression this exists for: with the source's loss ignored, moving
  // Energy Aâ†’B and Bâ†’A both scored as gains, so the bot moved Energy 44,000
  // times across 80 games and hung eleven of them. A whole turn should need a
  // handful of moves, not hundreds.
  const E = board('base1-15', ['base1-44', 'base1-30', 'base1-45']);
  const slots = E.allSlots(0);
  attach(E, slots[1], 'base1-99', 3);
  attach(E, slots[2], 'base1-99', 3);
  attach(E, slots[3], 'base1-99', 2);
  E.state.players[0].hand = [];
  const mark = E.state.log.length;
  E.aiTurn(0, 'expert');
  const moves = E.state.log.slice(mark).filter(l => (l.text || '').includes('Energy Trans')).length;
  if (moves > 20) throw new Error(`${moves} Energy Trans moves in a single turn`);
  return true;
});

T('the AI never Buzzaps away the opponent\'s last Prize', () => {
  // Buzzap is the one Power that can lose the game outright. Checked across a
  // range of boards rather than one, because this must never happen.
  for (const opp of [1, 2]) {
    for (const dmg of [0, 30, 70]) {
      const E = board('base1-21', ['base1-20', 'base1-58']);
      E.state.players[1].prizes = Array.from({ length: opp }, () => ({ id: 'base1-99', uid: E.uid++ }));
      E.allSlots(0)[0].dmg = dmg;
      E.state.players[0].hand = [];
      E.aiTurn(0, 'expert');
      if (opp === 1 && E.state.log.some(l => (l.text || '').includes('Buzzap')))
        throw new Error(`AI used Buzzap with the opponent on their last Prize (dmg ${dmg})`);
      if (E.state.winner === 1) throw new Error(`AI lost the game to its own Buzzap (opp ${opp}, dmg ${dmg})`);
    }
  }
  return true;
});

T('the AI leaves a healthy Electrode alone', () => {
  const E = board('base1-21', ['base1-20']);
  E.state.players[0].hand = [];
  E.aiTurn(0, 'expert');
  if (E.state.log.some(l => (l.text || '').includes('Buzzap')))
    throw new Error('AI sacrificed an undamaged Electrode for no reason');
  return true;
});

// The oddities have the same trap the Powers did: an attack that resolves to
// something OTHER than its printed line forecasts as zero damage forever, so the
// card works perfectly and the bot never once chooses it.
T('the AI values a Metronome copy by what it would actually do', () => {
  const E = board('base1-5', [], 'base1-3');               // Clefairy vs Chansey
  attach(E, E.state.players[0].active, 'base1-101', 3);
  const ai = new (require('../src/ai.js').AI)(E, { mode: 'expert' });
  const opts = E.legalActions(0).filter(a => a.t === 'attack' && a.idx === 1);
  const scores = opts.map(a => ai.scoreAction(0, a));
  if (scores.every(x => x === scores[0])) throw new Error('every copy option scored the same â€” forecast is blind');
  // Double-edge self-inflicts 80 onto a 40 HP Clefairy; it must be scored as suicide.
  const dbl = opts.findIndex(a => /copy Double-edge/.test(a.label));
  eq(scores[dbl] < 0, true, `Double-edge should score negative, got ${scores[dbl]}`);
  return true;
});

T('the AI values Mirror Move by the hit it is returning', () => {
  const E = board('base1-22', [], 'base1-20');
  const pidg = E.state.players[0].active;
  attach(E, pidg, 'base1-99', 3);
  const ai = new (require('../src/ai.js').AI)(E, { mode: 'expert' });
  const mm = { t: 'attack', idx: 1 };
  const cold = ai.scoreAction(0, mm);
  pidg.lastAttackResult = { turn: E.state.turn, by: -1, damage: 60, statuses: [], label: 'a big hit' };
  const warm = ai.scoreAction(0, mm);
  if (!(warm > cold)) throw new Error(`Mirror Move scored ${warm} with a 60 damage record vs ${cold} with none`);
  return true;
});

T('the AI picks a Conversion type it can actually exploit', () => {
  const E = board('base1-39', ['base1-44'], 'base1-58');   // Grass on the Bench, Lightning opposite
  attach(E, E.state.players[0].active, 'base1-99', 2);
  const ai = new (require('../src/ai.js').AI)(E, { mode: 'expert' });
  const best = (idx) => E.legalActions(0).filter(a => a.t === 'attack' && a.idx === idx)
    .sort((x, y) => ai.scoreAction(0, y) - ai.scoreAction(0, x))[0];
  if (!/Weakness to G/.test(best(0).label)) throw new Error(`chose ${best(0).label} over Grass`);
  if (!/Resistance to L/.test(best(1).label)) throw new Error(`chose ${best(1).label} over Lightning`);
  return true;
});

T('no Power can leave one of your own Pokemon Knocked Out', () => {
  // The invariant behind the rule, checked across a lot of real boards rather
  // than one contrived one.
  for (let s = 1; s <= 30; s++) {
    const E = board('base1-1', ['base1-43', 'base1-3', 'base1-58']);
    const slots = E.allSlots(0);
    slots.forEach((sl, i) => { sl.dmg = [70, 20, 100, 30][i]; });
    E.aiTurn(0, 'expert');
    for (const sl of E.allSlots(0)) {
      const c = CARD_DB[sl.stack[sl.stack.length - 1].id];
      if (sl.dmg >= c.hp) throw new Error(`${c.name} left at ${sl.dmg}/${c.hp} on seed ${s}`);
    }
  }
  return true;
});

// ---------------------------------------------------------------------------
// setupTakeBack â€” added with the rebuilt opening-setup screen, which shows real
// ACTIVE and BENCH slots and therefore has to let you click one back off.
// ---------------------------------------------------------------------------

// A fresh game with the opening hand replaced by four known Basics, so the
// indices below are stable and nothing depends on the shuffle.
function setupBoard() {
  const E = new Engine(CARD_DB, EFFECTS, { seed: 1 });
  E.newGame(DECKS.Brushfire, DECKS.Zap, ['A', 'B']);
  const p = E.state.players[0];
  p.active = null; p.bench = [];
  p.hand = ['base1-46', 'base1-58', 'base1-63', 'base1-68']
    .map(id => ({ id, uid: E.uid++ }));
  return E;
}

T('setup: a benched Pokemon goes back to hand, and the card is the same one', () => {
  const E = setupBoard();
  const p = E.state.players[0];
  E.setupPlace(0, 0, 'active');
  E.setupPlace(0, 0, 'bench');
  const uid = p.bench[0].stack[0].uid;
  eq(p.hand.length, 2, 'hand size after placing two');
  eq(E.setupTakeBack(0, 'bench', 0).ok, true, 'take back refused');
  eq(p.bench.length, 0, 'bench did not empty');
  eq(p.hand.length, 3, 'card did not come back');
  eq(p.hand[p.hand.length - 1].uid, uid, 'a different physical card came back');
  return true;
});

T('setup: taking the Active back also clears the bench', () => {
  // A bench with no Active is not a legal board, and nothing downstream knows
  // how to dig the player out of it â€” so the take-back returns the lot.
  const E = setupBoard();
  const p = E.state.players[0];
  E.setupPlace(0, 0, 'active');
  E.setupPlace(0, 0, 'bench');
  E.setupPlace(0, 0, 'bench');
  eq(p.hand.length, 1, 'hand size after placing three');
  eq(E.setupTakeBack(0, 'active', 0).ok, true, 'take back refused');
  eq(p.active, null, 'Active still set');
  eq(p.bench.length, 0, 'bench survived the Active leaving');
  eq(p.hand.length, 4, 'not every card came back');
  return true;
});

T('setup: take-back is refused once setup is confirmed, and outside setup', () => {
  const E = setupBoard();
  E.setupPlace(0, 0, 'active');
  const p = E.state.players[0];
  eq(E.setupTakeBack(0, 'bench', 0).ok, false, 'took back an empty bench slot');
  E.setupConfirm(0);
  eq(E.setupTakeBack(0, 'active', 0).ok, false, 'took back after confirming');
  eq(p.active !== null, true, 'Active was removed anyway');
  return true;
});

T('setup: a taken-back Pokemon can be placed again and keeps nothing', () => {
  const E = setupBoard();
  const p = E.state.players[0];
  E.setupPlace(0, 0, 'active');
  E.setupTakeBack(0, 'active', 0);
  eq(E.setupPlace(0, p.hand.length - 1, 'active').ok, true, 'replace refused');
  eq(p.active.dmg, 0, 'damage survived the round trip');
  eq(p.active.energy.length, 0, 'energy survived the round trip');
  eq(p.active.stack.length, 1, 'stack grew');
  return true;
});

// ---------------------------------------------------------------------------
// Passive Powers â€” the continuous-effects layer (Job 6b).
//
// Built against a SYNTHETIC database. Jungle and Fossil do not generate until
// 6c, and the whole point of doing the machinery first is that it must be
// provable before a single card depends on it. Each stand-in carries the exact
// Power its real card will, so 6e swaps the id and deletes nothing.
//
// The thing under test is that these are CONSULTED rather than materialised:
// every assertion below turns a Power on or off underneath a board that has
// already been built, which a slot.effects cache would get wrong.
// ---------------------------------------------------------------------------
console.log('\nPassive Powers (6b)');

const P_DB = Object.assign({}, CARD_DB);
const P_FX = Object.assign({}, EFFECTS);
{
  const mon = (id, name, hp, type, extra = {}) => Object.assign({
    id, name, set: 'test', num: id, rarity: 'Rare', kind: 'pokemon', stage: 'Basic',
    hp, type, evolvesFrom: '', wkType: '', wkVal: '', rsType: '', rsVal: '',
    retreat: 2, attacks: [{ name: 'Poke', cost: 'C', dmg: '10', text: '' }],
  }, extra);
  const add = (card, power) => { P_DB[card.id] = card; P_FX[card.id] = { a: [[]], p: power }; };

  add(mon('t-mime',    'Mr. Mime',   40, 'P'), { kind: 'PREVENT_AT_LEAST', n: 30, name: 'Invisible Wall' });
  add(mon('t-kabuto',  'Kabuto',     30, 'F'), { kind: 'DAMAGE_HALVE', name: 'Kabuto Armor' });
  add(mon('t-haunter', 'Haunter',    60, 'P'), { kind: 'FLIP_TO_NEGATE', name: 'Transparency' });
  add(mon('t-snorlax', 'Snorlax',    90, 'C'), { kind: 'STATUS_IMMUNE', name: 'Thick Skinned' });
  add(mon('t-aero',    'Aerodactyl', 60, 'C'), { kind: 'NO_EVOLUTION', name: 'Prehistoric Power' });
  add(mon('t-muk',     'Muk',        70, 'G'), { kind: 'TOXIC_GAS', name: 'Toxic Gas' });
  add(mon('t-dodrio',  'Dodrio',     70, 'C'), { kind: 'RETREAT_DISCOUNT', n: 1, name: 'Retreat Aid', always: true });
}

// Same shape as board(), on the synthetic database. Player 0 is the attacker.
function pboard(mine, oppActive = 'base1-58', oppBench = []) {
  const E = new Engine(P_DB, P_FX, { seed: 1 });
  E.newGame(DECKS.Brushfire, DECKS.Zap, ['A', 'B']);
  const mk = id => E.mkSlot({ id, uid: E.uid++ });
  const p = E.state.players[0], o = E.state.players[1];
  p.active = mk(mine[0]); p.bench = mine.slice(1).map(mk);
  o.active = mk(oppActive); o.bench = oppBench.map(mk);
  const prize = () => ({ id: 'base1-99', uid: E.uid++ });
  p.prizes = Array.from({ length: 6 }, prize);
  o.prizes = Array.from({ length: 6 }, prize);
  E.state.phase = 'main'; E.state.active = 0;
  E.state.pendingPromote = null; E.state.turn = 3;
  // Both sides have had a turn, or cfg.noEvolveFirstTurn refuses every evolution
  // and the Prehistoric Power cases pass for entirely the wrong reason.
  p.turnsTaken = 2; o.turnsTaken = 2;
  [...E.allSlots(0), ...E.allSlots(1)].forEach(s => { s.playedTurn = 0; });
  return E;
}

T('Invisible Wall bounces 30 or more and lets 20 through', () => {
  const E = pboard(['base1-58'], 't-mime');
  const [atk, def] = [E.state.players[0].active, E.state.players[1].active];
  eq(E.computeDamage(atk, def, 20).dmg, 20, '20 lands');
  eq(E.computeDamage(atk, def, 30).dmg, 0, '30 bounces');
  eq(E.computeDamage(atk, def, 90).dmg, 0, '90 bounces');
  eq(E.computeDamage(atk, def, 30).prevented, true, 'and reports itself prevented');
  return true;
});

T('Kabuto Armor halves and rounds DOWN to the nearest 10', () => {
  const E = pboard(['base1-58'], 't-kabuto');
  const [atk, def] = [E.state.players[0].active, E.state.players[1].active];
  eq(E.computeDamage(atk, def, 40).dmg, 20, '40 -> 20');
  eq(E.computeDamage(atk, def, 30).dmg, 10, '30 -> 15 -> rounds DOWN to 10');
  eq(E.computeDamage(atk, def, 10).dmg, 0, '10 -> 5 -> rounds down to nothing');
  return true;
});

T('a Power switched off by Sleep stops protecting', () => {
  const E = pboard(['base1-58'], 't-kabuto');
  const [atk, def] = [E.state.players[0].active, E.state.players[1].active];
  eq(E.computeDamage(atk, def, 40).dmg, 20, 'halved while awake');
  def.status.asleep = true;
  eq(E.computeDamage(atk, def, 40).dmg, 40, 'and full while asleep');
  return true;
});

T('Thick Skinned refuses every condition, and Poison too', () => {
  const E = pboard(['base1-58'], 't-snorlax');
  const def = E.state.players[1].active;
  for (const st of ['Asleep', 'Confused', 'Paralyzed', 'Poisoned']) E.applyStatus(def, st);
  eq(Object.values(def.status).some(Boolean), false, 'nothing stuck');
  return true;
});

T('Transparency is one coin for the whole attack, and only shields itself', () => {
  const E = pboard(['base1-58'], 't-haunter', ['base1-58']);
  const def = E.state.players[1].active, ob = E.state.players[1].bench[0];
  E.flip = () => true;                                        // heads: negated
  E.runAttack(0, E.state.players[0].active, def, top(E, E.state.players[0].active),
    { name: 'Test', cost: 'C', dmg: '40' }, [{ v: 'STATUS', s: 'Poisoned' }], {});
  eq(def.dmg, 0, 'no damage got through');
  eq(def.status.poisoned, false, 'and no status either â€” "prevent all effects"');

  const E2 = pboard(['base1-58'], 't-haunter');
  const d2 = E2.state.players[1].active;
  E2.flip = () => false;                                      // tails: it lands
  E2.runAttack(0, E2.state.players[0].active, d2, top(E2, E2.state.players[0].active),
    { name: 'Test', cost: 'C', dmg: '40' }, [{ v: 'STATUS', s: 'Poisoned' }], {});
  eq(d2.dmg, 40, 'tails and the damage lands');
  eq(d2.status.poisoned, true, 'and so does the status');
  return true;
});

T('Prehistoric Power stops BOTH players evolving', () => {
  const evo = Object.values(CARD_DB).find(c => c.kind === 'pokemon' && c.evolvesFrom === 'Charmander');
  const base = Object.values(CARD_DB).find(c => c.name === 'Charmander');
  const E = pboard([base.id], 'base1-58');
  const mine = E.state.players[0].active;
  eq(E.canEvolve(0, mine, evo), true, 'legal with no Aerodactyl');
  E.state.players[1].active = E.mkSlot({ id: 't-aero', uid: E.uid++ });
  E.state.players[1].active.playedTurn = 0;
  eq(E.canEvolve(0, mine, evo), false, 'and refused once it is out, from the OTHER side of the board');
  E.state.players[1].active.status.confused = true;
  eq(E.canEvolve(0, mine, evo), true, 'Confused Aerodactyl stops stopping it');
  return true;
});

T('Toxic Gas switches every other Power off, from the Bench, both sides', () => {
  const E = pboard(['base1-58'], 't-kabuto');
  const [atk, def] = [E.state.players[0].active, E.state.players[1].active];
  eq(E.computeDamage(atk, def, 40).dmg, 20, 'Kabuto Armor working');
  // A Muk on the ATTACKER's bench â€” the opposite side from the Power it kills.
  E.state.players[0].bench.push(E.mkSlot({ id: 't-muk', uid: E.uid++ }));
  eq(E.computeDamage(atk, def, 40).dmg, 40, 'and gone the moment Muk arrives');
  E.state.players[0].bench[0].status.asleep = true;
  eq(E.computeDamage(atk, def, 40).dmg, 20, 'a sleeping Muk suppresses nothing');
  return true;
});

T('Toxic Gas never switches off another Toxic Gas', () => {
  const E = pboard(['t-muk'], 't-muk');
  eq(E.powerUsable(E.state.players[0].active), true, 'ours still on');
  eq(E.powerUsable(E.state.players[1].active), true, 'and so is theirs');
  eq(E.toxicGasActive(), true, 'the suppression itself is live');
  return true;
});

T('Muk stops Aerodactyl, and Aerodactyl stops Muk arriving â€” order decides it', () => {
  const evo = Object.values(CARD_DB).find(c => c.kind === 'pokemon' && c.evolvesFrom === 'Charmander');
  const base = Object.values(CARD_DB).find(c => c.name === 'Charmander');
  const E = pboard([base.id, 't-muk'], 't-aero');
  eq(E.canEvolve(0, E.state.players[0].active, evo), true,
    'a Muk already in play unlocks evolution again');
  // And with no Muk, the lock holds â€” which is what keeps Grimer from ever
  // becoming one. RULINGS.md.
  const E2 = pboard([base.id], 't-aero');
  eq(E2.canEvolve(0, E2.state.players[0].active, evo), false, 'no Muk, no evolution, no future Muk');
  return true;
});

T('Retreat Aid discounts from the Bench, stacks, and ignores the status gate', () => {
  const E = pboard(['base1-58']);
  const act = E.state.players[0].active;
  const printed = top(E, act).retreat;
  eq(E.retreatCostOf(act), printed, 'printed cost with no Dodrio');
  const d1 = E.mkSlot({ id: 't-dodrio', uid: E.uid++ });
  const d2 = E.mkSlot({ id: 't-dodrio', uid: E.uid++ });
  E.state.players[0].bench.push(d1, d2);
  eq(E.retreatCostOf(act), Math.max(0, printed - 2), 'two Dodrio, two off');
  d1.status.asleep = true;
  eq(E.retreatCostOf(act), Math.max(0, printed - 2), 'and `always` means Sleep does not switch it off');
  E.state.players[0].bench.push(E.mkSlot({ id: 't-muk', uid: E.uid++ }));
  eq(E.retreatCostOf(act), printed, 'but Toxic Gas does');
  return true;
});

T('the AI halves its forecast against Transparency and stops paying for status against Snorlax', () => {
  const plain = pboard(['base1-58'], 'base1-58');
  const veiled = pboard(['base1-58'], 't-haunter');
  const proof = pboard(['base1-58'], 't-snorlax');
  const fc = E => { E.aiChoose(0, 'expert'); return E._ai.forecast(0, 1); };  // Thunder Jolt, 30
  const a = fc(plain), b = fc(veiled), c = fc(proof);
  if (!(b.expDmg < a.expDmg)) throw new Error(`Transparency ignored: ${b.expDmg} vs ${a.expDmg}`);
  eq(c.statusProof, true, 'Snorlax is flagged status-proof');
  eq(b.statusProof, false, 'and Haunter is not');
  eq(c.blocked, false, 'status-proof is NOT the same as blocked â€” drag and jam still work on it');
  return true;
});

// ---------------------------------------------------------------------------
// AI verb scoring (Job 6a).
//
// Eleven verbs were reaching ai.js with no case and scoring as plain base
// damage. selftest.js could never have caught it: NONE of the eleven appears in
// a theme deck, so 480 full games produced byte-identical output before and
// after the fix. This is the only suite that can see them, for the same reason
// it is the only one that can see a Power.
//
// These assert rawOutcomes() â€” the raw distribution, before weights â€” so tuning
// a weight later cannot make them fail for the wrong reason.
// ---------------------------------------------------------------------------
console.log('\nAI verb scoring');

// The engine builds its AI lazily on the first aiChoose and caches it on _ai.
function scorer(E) { E.aiChoose(0, 'expert'); return E._ai; }
function raw(E, idx) {
  return scorer(E).rawOutcomes(E.state.players[0].active, E.state.players[1].active, idx);
}
const expected = o => o.outcomes.reduce((a, x) => a + x.p * x.dmg, 0);

T('Thunderbolt is costed at the Energy it burns, not as free', () => {
  const E = board('base1-16', [], 'base1-2');               // Zapdos vs Blastoise
  attach(E, E.state.players[0].active, 'base1-100', 4);     // 4 Lightning
  eq(raw(E, 1).energyCost, 4, 'Thunderbolt energyCost');
  eq(raw(E, 0).energyCost, 0, 'Thunder costs no discard');
  return true;
});

T('Super Fang forecasts half the target, not the blank damage box', () => {
  const E = board('base1-40', [], 'base1-3');               // Raticate vs Chansey 120
  eq(expected(raw(E, 1)), 60, 'half of 120');
  E.state.players[1].active.dmg = 40;                       // 80 left
  eq(expected(raw(E, 1)), 40, 'half of 80');
  return true;
});

T('Hydro Pump counts the Energy the cost does not eat', () => {
  const E = board('base1-2', [], 'base1-3');                // Blastoise, cost WWW
  attach(E, E.state.players[0].active, 'base1-102', 5);     // 5 Water -> 2 spare
  eq(expected(raw(E, 0)), 60, '40 + 10 per spare Water');
  return true;
});

T('Thrash splits its own coin, recoil included', () => {
  const E = board('base1-11', [], 'base1-2');               // Nidoking
  const o = raw(E, 0);
  eq(expected(o), 35, 'half 40, half 30');
  eq(o.selfDmg, 5, 'half of 10 recoil');
  return true;
});

T('Toxic is worth more than ordinary Poison', () => {
  const E = board('base1-11', [], 'base1-2');
  eq(raw(E, 1).statuses.Poisoned, 2, '20 per turn rather than 10');
  return true;
});

T('Foul Gas always lands something, so both halves are counted', () => {
  const E = board('base1-51', [], 'base1-2');               // Koffing
  const st = raw(E, 0).statuses;
  eq(st.Poisoned, 0.5, 'heads'); eq(st.Confused, 0.5, 'tails');
  return true;
});

T('the remaining five verbs set the flags the scorer reads', () => {
  const eq2 = (id, idx, key, want) => {
    const E = board(id, [], 'base1-2');
    eq(raw(E, idx).flags[key], want, `${top(E, E.state.players[0].active).name} ${key}`);
  };
  eq2('base1-19', 1, 'benchSplashOwn', 10);   // Dugtrio   Earthquake
  eq2('base1-13', 1, 'stripEnergy', 1);       // Poliwrath Whirlpool
  eq2('base1-38', 0, 'attackLock', true);     // Poliwhirl Amnesia
  eq2('base1-14', 0, 'shield', 0.5);          // Raichu    Agility
  eq2('base1-22', 0, 'dragWeak', true);       // Pidgeotto Whirlwind
  return true;
});

// Whirlwind is a drag the OPPONENT steers, so it must be worth something, worth
// nothing against an empty bench, and never worth as much as a chosen drag.
T('a Whirlwind drag is priced below a chosen one, and at nothing with no bench', () => {
  const bare = board('base1-22', [], 'base1-2');
  const empty = scorer(bare).scoreAttack(0, 0);

  const E = board('base1-22', [], 'base1-2');
  E.state.players[1].bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  const ai = scorer(E);
  const weak = ai.scoreAttack(0, 0);

  if (!(weak > empty)) throw new Error('the drag was worth nothing even with a bench to drag from');
  // Same board, same damage â€” only the flag differs, so the gap IS the pricing.
  const chosen = empty + ai.W.drag;
  if (!(weak < chosen)) throw new Error(`weak drag ${weak} not discounted below chosen ${chosen}`);
  eq(raw(E, 0).flags.drag, undefined, 'and Whirlwind never sets the attacker-chooses flag');
  return true;
});

// The two that change a real decision rather than a number.
T('the AI now takes Super Fang over Bite against a healthy target', () => {
  const E = board('base1-40', [], 'base1-3');               // 60 vs Bite's 20
  attach(E, E.state.players[0].active, 'base1-99', 3);
  const ai = scorer(E);
  if (!(ai.scoreAttack(0, 1) > ai.scoreAttack(0, 0))) throw new Error('Bite still preferred');
  return true;
});

T('the AI refuses Earthquake when it would wipe its own bench', () => {
  const E = board('base1-19', ['base1-58', 'base1-58'], 'base1-2');
  attach(E, E.state.players[0].active, 'base1-97', 4);      // 4 Fighting
  const ai = scorer(E);
  const better = () => ai.scoreAttack(0, 1) > ai.scoreAttack(0, 0);
  eq(better(), true, 'Earthquake wins outright on an empty-risk bench');
  E.state.players[0].bench.forEach(b => { b.dmg = 30; });   // Pikachu 40 HP: 10 left each
  eq(better(), false, 'and loses to Slash once the bench would die for it');
  return true;
});

// ---------------------------------------------------------------------------
// Job 6d â€” the verbs whose semantics are easy to get subtly wrong.
// ---------------------------------------------------------------------------
console.log('\nJob 6d verbs');

// Fire an attack directly, so the test controls the coin instead of the deck.
function fire(E, idx, heads, act) {
  const me = E.state.players[0], you = E.state.players[1];
  E.flip = () => heads;
  const card = top(E, me.active);
  const scr = (EFFECTS[card.id] && EFFECTS[card.id].a && EFFECTS[card.id].a[idx]) || [];
  return E.runAttack(0, me.active, you.active, card, card.attacks[idx], scr, act || {});
}

T('Clamp is ONE coin governing damage and Paralysis together', () => {
  const heads = board('base3-32', [], 'base1-3');            // Cloyster vs Chansey
  fire(heads, 0, true);
  eq(heads.state.players[1].active.dmg, 30, 'heads: the damage lands');
  eq(heads.state.players[1].active.status.paralyzed, true, 'and so does the Paralysis');

  const tails = board('base3-32', [], 'base1-3');
  fire(tails, 0, false);
  eq(tails.state.players[1].active.dmg, 0, 'tails: NOT EVEN DAMAGE, as the card says');
  eq(tails.state.players[1].active.status.paralyzed, false, 'and no Paralysis either');
  return true;
});

T('Swords Dance raises Slash next turn, and only Slash', () => {
  const E = board('base2-10', [], 'base1-3');                 // Scyther vs Chansey 120
  fire(E, 0, true);                                           // Swords Dance
  E.state.turn += 2;                                          // our next turn
  fire(E, 1, true);                                           // Slash
  eq(E.state.players[1].active.dmg, 60, 'Slash does 60, not its printed 30');

  const plain = board('base2-10', [], 'base1-3');
  fire(plain, 1, true);
  eq(plain.state.players[1].active.dmg, 30, 'and 30 with no Swords Dance');
  return true;
});

T('Tail Wag stops every attack, but only against Eevee', () => {
  const E = board('base2-51', [], 'base1-3');                 // Eevee vs Chansey
  fire(E, 0, true);                                           // Tail Wag, heads
  const chansey = E.state.players[1].active;
  eq(chansey.effects.some(e => e.kind === 'CANT_ATTACK'), true, 'the lock landed');
  // Chansey must be ABLE to attack for any of this to mean anything. Without
  // Energy, canUseAttack refuses on cost and every assertion below passes for
  // entirely the wrong reason â€” which is what the first version of this test did.
  attach(E, chansey, 'base1-99', 4);
  E.state.active = 1;
  eq(E.costSatisfied(chansey, 'CCCC'), true, 'and it can actually pay for one');
  eq(E.canUseAttack(1, 0).ok, false, 'Chansey cannot attack Eevee');
  eq(E.canUseAttack(1, 1).ok, false, 'and not with its other attack either');
  // Swapping Eevee out ends it, which is the card's "benching either" clause.
  E.state.players[0].active = E.mkSlot({ id: 'base1-58', uid: E.uid++ });
  eq(E.canUseAttack(1, 0).ok, true, 'and a different Active is fair game');
  return true;
});

T('Pounce reduces damage from that defender and nobody else', () => {
  const E = board('base2-42', [], 'base1-3');                 // Persian vs Chansey
  fire(E, 1, true);                                           // Pounce
  const persian = E.state.players[0].active, chansey = E.state.players[1].active;
  eq(E.computeDamage(chansey, persian, 50).dmg, 40, 'Chansey hits for 10 less');
  const other = E.mkSlot({ id: 'base1-58', uid: E.uid++ });
  eq(E.computeDamage(other, persian, 50).dmg, 50, 'anything else hits for full');
  return true;
});

T('Chain Lightning does nothing at all against a Colorless defender', () => {
  // Chansey is Colorless, so the card stops there by its own clause.
  const none = board('base2-2', [], 'base1-3');
  none.state.players[1].bench = [none.mkSlot({ id: 'base1-58', uid: none.uid++ })];
  fire(none, 1, true);
  eq(none.state.players[1].bench[0].dmg, 0, 'no Bench damage against Colorless');
  eq(none.state.players[1].active.dmg, 20, 'but the attack itself still lands');

  // Pikachu is Lightning, so every Lightning on either Bench takes 10.
  const hit = board('base2-2', ['base1-58'], 'base1-58');
  hit.state.players[1].bench = [hit.mkSlot({ id: 'base1-58', uid: hit.uid++ }),
                                hit.mkSlot({ id: 'base1-3', uid: hit.uid++ })];
  fire(hit, 1, true);
  eq(hit.state.players[1].bench[0].dmg, 10, 'their Lightning Bench takes it');
  eq(hit.state.players[1].bench[1].dmg, 0, 'their Colorless Bench does not');
  eq(hit.state.players[0].bench[0].dmg, 10, 'and so does OUR own Lightning Bench');
  return true;
});

T('Headache stops the opponent playing Trainers, for one turn', () => {
  const E = board('base3-53', [], 'base1-3');                 // Psyduck
  fire(E, 0, true);                                           // Headache
  eq(E.trainersLocked(1), true, 'locked now');
  eq(E.trainersLocked(0), false, 'and only on their side');
  E.state.turn += 2;
  eq(E.trainersLocked(1), false, 'and it expires');
  return true;
});

// ---------------------------------------------------------------------------
// Job 6d third batch â€” deck search, deck order, the discard pile.
// ---------------------------------------------------------------------------
console.log('\nDeck, discard and search');

// Put a Trainer in hand and play it, so the test drives the real action path.
function playTrainer(E, id, opts) {
  const p = E.state.players[0];
  p.hand.push({ id, uid: E.uid++ });
  return E.act(0, { t: 'playTrainer', hand: p.hand.length - 1, opts });
}

T('Hurricane returns the whole Pokemon and everything on it, unless it kills', () => {
  const E = board('base2-8', [], 'base1-3');                  // Pidgeot vs Chansey 120
  const you = E.state.players[1];
  attach(E, you.active, 'base1-99', 3);
  you.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  const handBefore = you.hand.length;
  fire(E, 1, true);                                            // Hurricane, 30
  eq(you.active, null, 'the Defending Pokemon left the board');
  eq(you.hand.length, handBefore + 4, 'Chansey plus its three Energy went to hand');
  eq(E.state.pendingPromote, 1, 'and they owe a promotion');

  // A lethal Hurricane is a Knock Out instead, by the card's own wording.
  const kill = board('base2-8', [], 'base1-58');               // Pikachu, 40 HP
  kill.state.players[1].active.dmg = 20;                       // 30 will finish it
  const hand2 = kill.state.players[1].hand.length;
  fire(kill, 1, true);
  eq(kill.state.players[1].hand.length, hand2, 'nothing went back to hand');
  return true;
});

T('Call for Family refuses a full Bench and pulls only the named card', () => {
  const E = board('base2-49');                                 // Bellsprout
  const me = E.state.players[0];
  me.deck = [{ id: 'base2-49', uid: E.uid++ }, { id: 'base1-58', uid: E.uid++ }];
  fire(E, 1, true);
  eq(me.bench.length, 1, 'one came out');
  eq(top(E, me.bench[0]).name, 'Bellsprout', 'and it was the named one, not the Pikachu');

  const full = board('base2-49', ['base1-58', 'base1-58', 'base1-58', 'base1-58', 'base1-58']);
  eq(full.canUseAttack(0, 1).ok, false, 'and a full Bench makes the attack illegal');
  return true;
});

T('Mr. Fuji shuffles the whole slot into the deck, not the discard', () => {
  const E = board('base1-58', ['base1-3']);
  const me = E.state.players[0];
  attach(E, me.bench[0], 'base1-99', 2);
  const deckBefore = me.deck.length, discardBefore = me.discard.length;
  playTrainer(E, 'base3-58', { targetUid: me.bench[0].uid });
  eq(me.bench.length, 0, 'the Pokemon left the Bench');
  eq(me.deck.length, deckBefore + 3, 'Chansey and both Energy went into the deck');
  eq(me.discard.length, discardBefore + 1, 'and only Mr. Fuji itself was discarded');
  return true;
});

T('Recycle puts its card on TOP of the deck, where it is drawn next', () => {
  const E = board('base1-58');
  const me = E.state.players[0];
  const want = { id: 'base1-4', uid: E.uid++ };                // Charizard
  me.discard.push(want);
  E.flip = () => true;
  playTrainer(E, 'base3-61', { pickUid: want.uid });
  eq(me.deck[0].uid, want.uid, 'it is the very next card');
  return true;
});

T('Gambler shuffles the hand in FIRST, so what you gave up can come back', () => {
  const E = board('base1-58');
  const me = E.state.players[0];
  me.hand = [];
  for (let i = 0; i < 5; i++) me.hand.push({ id: 'base1-99', uid: E.uid++ });
  const total = me.hand.length + me.deck.length;              // conserved, plus Gambler
  E.flip = () => true;
  playTrainer(E, 'base3-60');
  eq(me.hand.length, 8, 'heads draws eight');
  eq(me.hand.length + me.deck.length, total, 'and no card was created or lost â€” Gambler itself is in the discard');
  return true;
});

T('Wildfire burns exactly as many cards as Fire discarded, capped at what is attached', () => {
  const E = board('base3-12', [], 'base1-3');                  // Moltres
  const me = E.state.players[0], you = E.state.players[1];
  attach(E, me.active, 'base1-98', 3);                         // 3 Fire
  const deckBefore = you.deck.length;
  fire(E, 0, true, { opts: { count: 2 } });
  eq(me.active.energy.length, 1, 'two Fire discarded');
  eq(you.deck.length, deckBefore - 2, 'two cards burned off their deck');

  const over = board('base3-12', [], 'base1-3');
  attach(over, over.state.players[0].active, 'base1-98', 1);
  const d2 = over.state.players[1].deck.length;
  fire(over, 0, true, { opts: { count: 99 } });
  eq(over.state.players[1].deck.length, d2 - 1, 'and asking for more than you have burns only what you have');
  return true;
});

T('Prophecy reorders the top of either deck without changing its size', () => {
  const E = board('base3-8', [], 'base1-3');                   // Hypno
  const me = E.state.players[0];
  const before = me.deck.slice(0, 3).map(x => x.uid);
  const n = me.deck.length;
  fire(E, 0, true, { opts: { side: 'me', order: [2, 0, 1] } });
  eq(me.deck.length, n, 'the deck is the same size');
  eq(me.deck[0].uid, before[2], 'and the third card is now on top');
  eq(me.deck[1].uid, before[0], 'followed by the first');
  return true;
});

// ---------------------------------------------------------------------------
// Job 6e â€” the interactive Powers.
// ---------------------------------------------------------------------------
console.log('\nInteractive Powers (6e)');

const powerAct = (E, uid, kind, extra) => Object.assign({ t: 'power', uid, kind }, extra || {});

T('Curse moves the OPPONENTâ€™s counters, and may Knock Out on purpose', () => {
  const E = board('base3-5', [], 'base1-58');                  // Gengar vs Pikachu
  const you = E.state.players[1];
  you.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  you.active.dmg = 30; you.bench[0].dmg = 10;                  // Pikachu is 40 HP
  const gengar = E.state.players[0].active;
  const prizes = E.state.players[0].prizes.length;

  const r = E.act(0, powerAct(E, gengar.uid, 'MOVE_DAMAGE',
    { from: you.bench[0].uid, to: you.active.uid }));
  eq(r.ok, true, 'the move was legal');
  eq(you.active, null, 'and it Knocked the Defending Pokemon Out');
  eq(E.state.players[0].prizes.length, prizes - 1, 'we took a Prize for it');
  return true;
});

T('Curse is once a turn; Strange Behavior is not', () => {
  const E = board('base3-5', [], 'base1-3');
  const you = E.state.players[1];
  you.bench = [E.mkSlot({ id: 'base1-3', uid: E.uid++ })];
  you.active.dmg = 30; you.bench[0].dmg = 30;
  const g = E.state.players[0].active;
  E.act(0, powerAct(E, g.uid, 'MOVE_DAMAGE', { from: you.bench[0].uid, to: you.active.uid }));
  const second = E.act(0, powerAct(E, g.uid, 'MOVE_DAMAGE', { from: you.bench[0].uid, to: you.active.uid }));
  eq(second.ok, false, 'the second Curse this turn is refused');

  const S2 = board('base3-43', ['base1-3']);                   // Slowbro + Chansey
  const slowbro = S2.state.players[0].active;
  S2.state.players[0].bench[0].dmg = 40;
  eq(S2.act(0, powerAct(S2, slowbro.uid, 'MOVE_DAMAGE', { from: S2.state.players[0].bench[0].uid })).ok,
    true, 'Strange Behavior once');
  eq(S2.act(0, powerAct(S2, slowbro.uid, 'MOVE_DAMAGE', { from: S2.state.players[0].bench[0].uid })).ok,
    true, 'and again, because it is not once a turn');
  eq(slowbro.dmg, 20, 'both counters landed on Slowbro');
  return true;
});

T('Strange Behavior refuses a move that would Knock Slowbro Out', () => {
  const E = board('base3-43', ['base1-3']);
  const slowbro = E.state.players[0].active;
  slowbro.dmg = top(E, slowbro).hp - 10;                        // one counter from death
  E.state.players[0].bench[0].dmg = 40;
  eq(E.act(0, powerAct(E, slowbro.uid, 'MOVE_DAMAGE', { from: E.state.players[0].bench[0].uid })).ok,
    false, 'refused');
  return true;
});

T('Shift changes the type Weakness is matched against', () => {
  const E = board('base2-13', [], 'base1-2');                   // Venomoth vs Blastoise (weak to L)
  const [v, b] = [E.state.players[0].active, E.state.players[1].active];
  eq(E.computeDamage(v, b, 20).dmg, 20, 'Grass Venomoth hits for 20');
  // A Lightning Pokemon has to be in play for Shift to be able to choose it.
  E.state.players[0].bench.push(E.mkSlot({ id: 'base1-58', uid: E.uid++ }));
  eq(E.act(0, powerAct(E, v.uid, 'CHANGE_OWN_TYPE', { type: 'L' })).ok, true, 'Shift to Lightning');
  eq(E.computeDamage(v, b, 20).dmg, 40, 'and now Blastoise takes double');
  return true;
});

T('Step In swaps a Benched Dragonite with the Active, once a turn, free', () => {
  const E = board('base1-58', ['base3-4']);                     // Pikachu active, Dragonite benched
  const drag = E.state.players[0].bench[0];
  eq(E.act(0, powerAct(E, drag.uid, 'STEP_IN')).ok, true, 'it stepped in');
  eq(E.state.players[0].active.uid, drag.uid, 'Dragonite is Active');
  eq(E.state.players[0].retreated, false, 'and it did NOT use up the retreat');
  return true;
});

T('Cowardice returns Tentacool to hand and discards what was attached', () => {
  const E = board('base3-56', ['base1-58']);
  const tenta = E.state.players[0].active;
  attach(E, tenta, 'base1-102', 2);
  const me = E.state.players[0];
  const hand = me.hand.length, disc = me.discard.length;
  eq(E.act(0, powerAct(E, tenta.uid, 'COWARDICE')).ok, true, 'it fled');
  eq(me.hand.length, hand + 1, 'Tentacool itself came back to hand');
  eq(me.discard.length, disc + 2, 'and both Energy were discarded');

  const fresh = board('base3-56', ['base1-58']);
  fresh.state.players[0].active.playedTurn = fresh.state.turn;
  eq(fresh.act(0, powerAct(fresh, fresh.state.players[0].active.uid, 'COWARDICE')).ok,
    false, 'and not on the turn it was played');
  return true;
});

T('Vileplumeâ€™s Heal is a coin, and only once a turn', () => {
  const E = board('base2-15', ['base1-3']);
  const plume = E.state.players[0].active;
  E.state.players[0].bench[0].dmg = 30;
  E.flip = () => true;
  eq(E.act(0, powerAct(E, plume.uid, 'HEAL_ON_FLIP', { to: E.state.players[0].bench[0].uid })).ok, true, 'heads heals');
  eq(E.state.players[0].bench[0].dmg, 20, 'one counter removed');
  eq(E.act(0, powerAct(E, plume.uid, 'HEAL_ON_FLIP', { to: E.state.players[0].bench[0].uid })).ok, false, 'and only once');
  return true;
});

T('Peek reveals without moving the card', () => {
  const E = board('base2-55', [], 'base1-3');                   // Mankey
  const mankey = E.state.players[0].active;
  const them = E.state.players[1];
  const topId = them.deck[0].id, n = them.deck.length;
  const r = E.act(0, powerAct(E, mankey.uid, 'PEEK', { look: 'deck', side: 'them' }));
  eq(r.ok, true, 'it looked');
  eq(r.peeked.id, topId, 'at the right card');
  eq(them.deck.length, n, 'and the deck is untouched');
  return true;
});

// ---------------------------------------------------------------------------
// Job 6f â€” Ditto. Every assertion here is a DESIGN DECISION rather than a
// reading of the card, so each one is a thing that could be changed on purpose
// later. The rule and its reasoning are in RULINGS.md.
// ---------------------------------------------------------------------------
console.log('\nDitto (6f)');

// Ditto is 'base3-3'. board() places the Active directly, so settleTransforms
// has to be nudged the way act() would.
function dittoBoard(oppId, oppBench) {
  const E = board('base3-3', [], oppId);
  if (oppBench) E.state.players[1].bench = oppBench.map(id => E.mkSlot({ id, uid: E.uid++ }));
  E.settleTransforms();
  return E;
}

T('Ditto becomes whatever it finds, and gets its HP and attacks', () => {
  const E = dittoBoard('base1-3');                              // Chansey, 120 HP
  const d = E.state.players[0].active;
  eq(top(E, d).name, 'Chansey', 'it is a Chansey');
  eq(top(E, d).hp, 120, 'with Chansey HP');
  eq(top(E, d).attacks.length, 2, 'and Chansey attacks â€” Ditto itself has none');
  return true;
});

T('the snapshot HOLDS: evolving or switching opposite it changes nothing', () => {
  const E = dittoBoard('base1-58');                             // Pikachu
  const d = E.state.players[0].active;
  eq(top(E, d).name, 'Pikachu', 'copied Pikachu');
  // They switch to something else entirely.
  E.state.players[1].active = E.mkSlot({ id: 'base1-3', uid: E.uid++ });
  E.settleTransforms();
  eq(top(E, d).name, 'Pikachu', 'still Pikachu â€” a snapshot, not a mirror');
  return true;
});

T('benching it makes it a Ditto again, and it re-snapshots on the way back', () => {
  const E = dittoBoard('base1-58');
  const me = E.state.players[0], d = me.active;
  eq(top(E, d).name, 'Pikachu', 'Pikachu to start');
  // Bench it.
  me.bench.push(d); me.active = E.mkSlot({ id: 'base1-58', uid: E.uid++ });
  E.settleTransforms();
  eq(top(E, d).name, 'Ditto', 'itself again on the Bench');
  eq(top(E, d).hp, 50, 'and back to 50 HP');
  // Send it back up against something different.
  E.state.players[1].active = E.mkSlot({ id: 'base1-3', uid: E.uid++ });
  me.bench.pop(); me.active = d;
  E.settleTransforms();
  eq(top(E, d).name, 'Chansey', 're-snapshots against whatever is there now');
  return true;
});

T('it does NOT gain the copied Pokemon Power, and keeps Transform', () => {
  const E = dittoBoard('base1-1');                              // Alakazam, Damage Swap
  const d = E.state.players[0].active;
  eq(top(E, d).name, 'Alakazam', 'it looks like Alakazam');
  eq(E.powerOf(d).kind, 'TRANSFORM', 'but the Power is still Transform');
  return true;
});

T('its Energy pays for anything, by quantity', () => {
  const E = dittoBoard('base1-4');                              // Charizard, Fire Spin RRRR
  const d = E.state.players[0].active;
  attach(E, d, 'base1-102', 4);                                 // four WATER
  eq(E.costSatisfied(d, 'RRRR'), true, 'four Water pay a four-Fire cost');
  eq(E.costSatisfied(d, 'RRRRR'), false, 'but four cannot pay five â€” quantity still counts');
  return true;
});

T('Ditto cannot evolve', () => {
  const E = dittoBoard('base1-58');                             // copied Pikachu
  const d = E.state.players[0].active;
  const raichu = Object.values(CARD_DB).find(c => c.name === 'Raichu' && c.set === 'base1');
  eq(E.canEvolve(0, d, raichu), false, 'no evolving a Ditto, even one wearing a Pikachu');
  return true;
});

T('Toxic Gas blocks the transform, but never reverses one already made', () => {
  // Muk out FIRST: Ditto never transforms and is a 50 HP body with no attacks.
  const first = board('base3-3', [], 'base3-13');               // Muk opposite
  first.settleTransforms();
  const d1 = first.state.players[0].active;
  eq(top(first, d1).name, 'Ditto', 'no transform while Toxic Gas is up');
  eq(top(first, d1).attacks.length, 0, 'and Ditto has no attacks of its own');

  // Muk arriving AFTER: the snapshot stands.
  const later = dittoBoard('base1-58');
  const d2 = later.state.players[0].active;
  eq(top(later, d2).name, 'Pikachu', 'transformed first');
  later.state.players[1].bench = [later.mkSlot({ id: 'base3-13', uid: later.uid++ })];
  later.settleTransforms();
  eq(top(later, d2).name, 'Pikachu', 'and Muk does not undo it');
  return true;
});

T('a Ditto opposite a Ditto copies what that one currently IS', () => {
  // Theirs is already a Chansey; ours copies the Chansey, not the Ditto.
  const E = board('base3-3', [], 'base3-3');
  E.state.players[1].active.transformedId = 'base1-3';
  E.settleTransforms();
  eq(top(E, E.state.players[0].active).name, 'Chansey', 'no regress');

  // Both untransformed: nothing to copy, and no infinite loop.
  const both = board('base3-3', [], 'base3-3');
  both.settleTransforms();
  eq(top(both, both.state.players[0].active).name, 'Ditto', 'they stay themselves');
  return true;
});

T('the transform can Knock It Out, in either direction', () => {
  // Copying something SMALLER than the damage already on it.
  const down = dittoBoard('base1-3');                           // Chansey, 120
  const d = down.state.players[0].active;
  down.state.players[0].bench = [down.mkSlot({ id: 'base1-58', uid: down.uid++ })];
  d.dmg = 100;                                                  // fine on a 120 body
  down.state.players[1].active = down.mkSlot({ id: 'base1-58', uid: down.uid++ });
  // Bench and re-promote so it re-snapshots against a 40 HP Pikachu.
  const me = down.state.players[0];
  me.bench.push(d); me.active = me.bench.shift();
  down.settleTransforms();                                       // reverts to 50 HP Ditto...
  eq(me.bench.indexOf(d) < 0 && me.active !== d, true,
    'reverting to a 50 HP Ditto with 100 damage Knocked It Out');
  return true;
});

T('Ditto is what goes to the discard pile, not the copy', () => {
  const E = dittoBoard('base1-3');
  const me = E.state.players[0], d = me.active;
  me.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  d.dmg = 999;
  E.checkKOs();
  const names = me.discard.map(x => CARD_DB[x.id].name);
  eq(names.indexOf('Ditto') >= 0, true, 'the Ditto card is in the discard');
  eq(names.indexOf('Chansey') >= 0, false, 'and no Chansey was ever created');
  return true;
});

// ------------------------------------------------- the AI must take a win ---
// All four found in one game of Trevor's: his last Pokemon sat on 10 HP, the bot
// held a lethal Beedrill, and it spent the turn on a Super Potion and a retreat.
// Three separate faults compounded, and no existing suite could see any of them â€”
// selftest only proves games finish, and a bot that declines to win still
// finishes the game.
console.log('\nThe AI takes a win when it has one');

const { AI } = require('../src/ai.js');

// Charmeleon with four Fire against a Mewtwo on 10 HP, and a Super Potion in
// hand. Every case below is that position with one thing varied.
function endgame() {
  const E = board('base1-24', [], 'base1-10');
  const p = E.state.players[0], o = E.state.players[1];
  attach(E, p.active, 'base1-98', 4);
  attach(E, o.active, 'base1-101', 1);
  o.active.dmg = 50;                 // 10 HP left of 60
  p.active.dmg = 40;                 // hurt enough that healing looks attractive
  p.hand = [{ id: 'base1-90', uid: E.uid++ }];      // Super Potion
  return E;
}

T('attacks for the win when the opponent has no Bench left', () => {
  const E = endgame();
  const a = new AI(E, { mode: 'expert' }).choose(0);
  return !!a && a.t === 'attack';
});

T('...and that is a WIN condition the scorer knew nothing about', () => {
  const E = endgame();
  const ai = new AI(E, { mode: 'expert' });
  const withNoBench = ai.scoreAttack(0, 0);
  // Same board, but they have somewhere to promote from, so the KO is worth a
  // Prize rather than the game. The gap between these two IS the fix.
  const E2 = endgame();
  E2.state.players[1].bench = [E2.mkSlot({ id: 'base1-58', uid: E2.uid++ })];
  E2.state.players[1].bench[0].playedTurn = 0;
  const withBench = new AI(E2, { mode: 'expert' }).scoreAttack(0, 0);
  if (!(withNoBench > withBench)) throw new Error(`no-bench ${withNoBench.toFixed(1)} should beat bench ${withBench.toFixed(1)}`);
  return true;
});

T('attacks for the win when its OWN Prize pile is down to one', () => {
  const E = endgame();
  // Give them a Bench so the board-empty condition cannot be what fires, and
  // put US one Prize from victory.
  E.state.players[1].bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  E.state.players[1].bench[0].playedTurn = 0;
  E.state.players[0].prizes = [{ id: 'base1-99', uid: E.uid++ }];
  const a = new AI(E, { mode: 'expert' }).choose(0);
  return !!a && a.t === 'attack';
});

T('the winning Prize is OURS, not theirs â€” the check was inverted', () => {
  const E = endgame();
  E.state.players[1].bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  E.state.players[1].bench[0].playedTurn = 0;
  const ai = new AI(E, { mode: 'expert' });
  E.state.players[0].prizes = [{ id: 'base1-99', uid: E.uid++ }];   // WE are one away
  const oursLow = ai.scoreAttack(0, 0);
  E.state.players[0].prizes = Array.from({ length: 6 }, () => ({ id: 'base1-99', uid: E.uid++ }));
  E.state.players[1].prizes = [{ id: 'base1-99', uid: E.uid++ }];   // THEY are one away
  const theirsLow = ai.scoreAttack(0, 0);
  if (!(oursLow > theirsLow)) throw new Error(`our last Prize ${oursLow.toFixed(1)} must beat their last Prize ${theirsLow.toFixed(1)}`);
  return true;
});

T('refuses a heal that would discard the Energy its own attack needs', () => {
  const E = board('base1-24', [], 'base1-10');
  const p = E.state.players[0];
  attach(E, p.active, 'base1-98', 3);      // exactly enough for Flamethrower
  p.active.dmg = 40;
  p.hand = [{ id: 'base1-90', uid: E.uid++ }];
  const ai = new AI(E, { mode: 'expert' });
  const trainer = E.legalActions(0).find(x => x.t === 'playTrainer');
  if (!trainer) throw new Error('Super Potion was not even legal');
  // It may still be worth playing in some spots, but never at a score that
  // beats swinging with the attack it is about to switch off.
  const heal = ai.scoreAction(0, trainer);
  const swing = ai.bestAttackScore(0).score;
  if (!(swing > heal)) throw new Error(`heal ${heal.toFixed(1)} must not beat attack ${swing.toFixed(1)}`);
  return true;
});

T('prefers on-type Energy over a Colorless-filler for the same slot', () => {
  const E = board('base1-24', [], 'base1-58');        // Charmeleon: RRC and RC costs
  const p = E.state.players[0];
  p.hand = [{ id: 'base1-98', uid: E.uid++ },     // Fire  â€” pays the typed half
            { id: 'base1-99', uid: E.uid++ }];    // Grass â€” can only pay Colorless
  const ai = new AI(E, { mode: 'expert' });
  const acts = E.legalActions(0).filter(x => x.t === 'attachEnergy' && x.target === p.active.uid);
  const fire = acts.find(x => p.hand[x.hand].id === 'base1-98');
  const grass = acts.find(x => p.hand[x.hand].id === 'base1-99');
  if (!fire || !grass) throw new Error('both attachments should be legal');
  const fs = ai.scoreAction(0, fire), gs = ai.scoreAction(0, grass);
  if (!(fs > gs)) throw new Error(`Fire ${fs.toFixed(1)} must beat Grass ${gs.toFixed(1)} on a Fire Pokemon`);
  return true;
});

// ===========================================================================
// WHICH ENERGY GETS DISCARDED  (12 Aug 2026)
// Seven effects discard Energy off a slot and every one of them used to decide
// by array order — "the first attached", or "the first of the right type".
// Which Fire leaves a Charizard is the difference between attacking next turn
// and not. These cover the single decision point they now share.
// ===========================================================================

const en = (E, id) => ({ id, uid: E.uid++ });

T('takeEnergy honours the caller\'s choice, in the order given', () => {
  const E = board('base1-24');                       // Charmeleon
  const p = E.state.players[0];
  const fire = en(E, 'base1-98'), grass = en(E, 'base1-99'), dce = en(E, 'base1-96');
  p.active.energy = [fire, grass, dce];
  const got = E.takeEnergy(p.active, 2, null, [dce.uid, grass.uid]);
  if (got.map(x => x.uid).join() !== [dce.uid, grass.uid].join())
    throw new Error('took the wrong cards: ' + got.map(x => CARD_DB[x.id].name).join('/'));
  if (p.active.energy.length !== 1 || p.active.energy[0].uid !== fire.uid)
    throw new Error('the Fire should be what is left');
  return true;
});

// The fallback matters more than the choice: it is what the AI and every older
// caller get, and it must be the heuristic rather than the array order.
T('a stale uid falls back to the pay order, never to index 0', () => {
  const E = board('base1-24');                       // Charmeleon wants its Fire
  const p = E.state.players[0];
  const fire = en(E, 'base1-98'), grass = en(E, 'base1-99');
  p.active.energy = [fire, grass];                   // the Fire is FIRST in the array
  const got = E.takeEnergy(p.active, 1, null, [999999]);
  if (CARD_DB[got[0].id].name !== 'Grass Energy')
    throw new Error('should spend the Grass its attacks do not need, got ' + CARD_DB[got[0].id].name);
  return true;
});

T('a type filter refuses a choice that does not match it', () => {
  const E = board('base1-24');
  const p = E.state.players[0];
  const fire = en(E, 'base1-98'), grass = en(E, 'base1-99');
  p.active.energy = [grass, fire];
  const got = E.takeEnergy(p.active, 1, 'R', [grass.uid]);   // naming the illegal one
  if (CARD_DB[got[0].id].name !== 'Fire Energy')
    throw new Error('a Grass cannot pay a Fire cost, got ' + CARD_DB[got[0].id].name);
  return true;
});

// The rule that keeps the picker rare enough to mean anything. A prompt for
// three identical Fire is pure friction.
T('identical Energy is not a choice worth stopping for', () => {
  const E = board('base1-24');
  const p = E.state.players[0];
  p.active.energy = [en(E, 'base1-98'), en(E, 'base1-98'), en(E, 'base1-98')];
  if (E.energyChoiceIsReal(p.active, 1, null)) throw new Error('three identical Fire is not a decision');
  p.active.energy.push(en(E, 'base1-99'));
  if (!E.energyChoiceIsReal(p.active, 1, null)) throw new Error('a Grass among them IS a decision');
  return true;
});

T('no slack is no choice: taking everything eligible needs no prompt', () => {
  const E = board('base1-24');
  const p = E.state.players[0];
  p.active.energy = [en(E, 'base1-98'), en(E, 'base1-99')];
  if (E.energyChoiceIsReal(p.active, 2, null)) throw new Error('both are going regardless');
  return true;
});

// A Buzzap'd Electrode is an Energy card that is also a Pokemon you may want
// back, so it must never collapse into "another Lightning" for this test.
T('a Buzzap\'d Electrode is distinct from a basic of the same type', () => {
  const E = board('base1-24');
  const p = E.state.players[0];
  const a = en(E, 'base1-100'), b = en(E, 'base1-100');
  p.active.energy = [a, b];
  if (E.energyChoiceIsReal(p.active, 1, null)) throw new Error('two identical Lightning is not a choice');
  b.asEnergy = 'L';
  if (!E.energyChoiceIsReal(p.active, 1, null)) throw new Error('the Buzzap\'d one is a different card');
  return true;
});

// Each of these names the card the FALLBACK would refuse to take, so passing
// cannot mean "the heuristic happened to agree". Two of them originally did
// agree, and were green against a build with the choice plumbing torn out.
T('Energy Removal discards the Energy the player named', () => {
  const E = board('base1-24', [], 'base1-58');       // their Pikachu wants Lightning
  const p = E.state.players[0], o = E.state.players[1];
  const spare = en(E, 'base1-99'), wanted = en(E, 'base1-100');
  o.active.energy = [spare, wanted];
  p.hand = [{ id: 'base1-92', uid: E.uid++ }];
  // Naming the Lightning is the better play and the opposite of the fallback,
  // which spends what the Pokemon does not need.
  const r = E.act(0, { t: 'playTrainer', hand: 0,
    opts: { targetUid: o.active.uid, energyUids: [wanted.uid] } });
  if (!r.ok) throw new Error('Energy Removal failed: ' + r.error);
  if (o.active.energy.length !== 1 || o.active.energy[0].uid !== spare.uid)
    throw new Error('took the fallback\'s pick, not the player\'s');
  return true;
});

T('an attack cost discards the Fire the player named', () => {
  const E = board('base1-24', [], 'base1-58');       // Charmeleon: Flamethrower
  const p = E.state.players[0];
  const keep = en(E, 'base1-98'), spend = en(E, 'base1-98');
  spend.asEnergy = 'R';                              // same type, different card
  p.active.energy = [keep, spend, en(E, 'base1-98'), en(E, 'base1-98')];
  const r = E.act(0, { t: 'attack', idx: 1, opts: { costUids: [spend.uid] } });
  if (!r.ok) throw new Error('Flamethrower failed: ' + r.error);
  if (p.active.energy.some(e => e.uid === spend.uid))
    throw new Error('the named Energy is still attached');
  if (!p.active.energy.some(e => e.uid === keep.uid))
    throw new Error('it took one that was not named');
  return true;
});

// Super Energy Removal asks twice, on opposite sides of the board, which is why
// the option keys are named by role rather than by site.
T('Super Energy Removal keeps its two choices apart', () => {
  const E = board('base1-24', [], 'base1-58');
  const p = E.state.players[0], o = E.state.players[1];
  // Pay with the FIRE your Charmeleon wants — the fallback would spend the Grass.
  const mineSpare = en(E, 'base1-99'), minePay = en(E, 'base1-98');
  p.active.energy = [mineSpare, minePay];
  // Strip the two LIGHTNING their Pikachu wants — the fallback would take Grass.
  const theirSpare = en(E, 'base1-99'), a = en(E, 'base1-100'), b = en(E, 'base1-100');
  o.active.energy = [theirSpare, a, b];
  p.hand = [{ id: 'base1-79', uid: E.uid++ }];
  const r = E.act(0, { t: 'playTrainer', hand: 0, opts: {
    selfUid: p.active.uid, targetUid: o.active.uid,
    costUids: [minePay.uid], energyUids: [a.uid, b.uid] } });
  if (!r.ok) throw new Error('Super Energy Removal failed: ' + r.error);
  if (p.active.energy.length !== 1 || p.active.energy[0].uid !== mineSpare.uid)
    throw new Error('paid with the fallback\'s pick, not the player\'s');
  if (o.active.energy.length !== 1 || o.active.energy[0].uid !== theirSpare.uid)
    throw new Error('stripped the fallback\'s pick, not the player\'s');
  return true;
});

// ------------------------------------------------- Confusion and retreating
// Settled with Trevor 13 Aug 2026 from the GBC game, and asserted here rather
// than measured by a duel: this is a RULE, so it is about what the AI is
// allowed to do rather than how well it scores. See AI.md.
//
// Found by reading a saved match log — the bot retreated out of Confusion four
// times in one game without a single flip, because `confused` appeared exactly
// once in engine.js and it was in the attack path.
console.log('\nConfusion — retreating');

// Machoke: retreat cost 3, so the Energy bill is unmistakable in the discard.
function confusedRetreat(flip) {
  const E = board('base1-34', ['base1-58']);            // Machoke active, Rattata benched
  const p = E.state.players[0];
  attach(E, p.active, 'base1-97', 3);                   // Fighting ×3
  p.active.status.confused = true;
  E.dev.forceFlip = flip;
  const r = E.act(0, { t: 'retreat', bench: 0 });
  E.dev.forceFlip = null;
  return { E, p, r };
}

T('a Confused Pokemon may still attempt to retreat', () => {
  const E = board('base1-34', ['base1-58']);
  attach(E, E.state.players[0].active, 'base1-97', 3);
  E.state.players[0].active.status.confused = true;
  if (!E.canRetreat(E.state.players[0].active)) throw new Error('Confusion blocked the attempt outright');
  // ...and the attempt is offered, or the human never gets to make the call.
  const acts = E.legalActions(0);
  if (!acts.some(a => a.t === 'retreat')) throw new Error('no retreat was offered');
  return true;
});

T('on heads it retreats normally and the Confusion is left behind', () => {
  const { p, r } = confusedRetreat('H');
  if (!r.ok) throw new Error(r.error);
  eq(p.active.stack[0].id, 'base1-58', 'Rattata is now Active');
  eq(p.bench[0].status.confused, false, 'the retreating Pokemon sheds its status');
  eq(p.discard.length, 3, 'three Energy paid');
  return true;
});

T('on tails the retreat fails, and the Energy is still gone', () => {
  const { p, r } = confusedRetreat('T');
  // The ACTION succeeded — it is the retreat that failed. A rejected action
  // would let the UI offer it again for free, which is the whole point.
  if (!r.ok) throw new Error('the attempt should resolve, not be refused: ' + r.error);
  eq(p.active.stack[0].id, 'base1-34', 'Machoke is still Active');
  eq(p.active.status.confused, true, 'and still Confused');
  eq(p.active.energy.length, 0, 'the Energy was paid before the flip');
  eq(p.discard.length, 3, 'and it is in the discard pile');
  return true;
});

T('a failed retreat uses up the turn — no re-rolling until it works', () => {
  const { E, p } = confusedRetreat('T');
  attach(E, p.active, 'base1-97', 3);                   // fresh Energy to try again with
  const r2 = E.act(0, { t: 'retreat', bench: 0 });
  if (r2.ok) throw new Error('a second attempt was allowed in the same turn');
  eq(p.discard.length, 3, 'and the second attempt cost nothing');
  return true;
});

T('Asleep and Paralyzed still block the attempt outright, flip or no flip', () => {
  for (const st of ['asleep', 'paralyzed']) {
    const E = board('base1-34', ['base1-58']);
    const p = E.state.players[0];
    attach(E, p.active, 'base1-97', 3);
    p.active.status[st] = true;
    if (E.canRetreat(p.active)) throw new Error(`${st} allowed a retreat`);
    const r = E.act(0, { t: 'retreat', bench: 0 });
    if (r.ok) throw new Error(`${st} let a retreat through act()`);
    if (p.discard.length) throw new Error(`${st} charged Energy for a refused action`);
  }
  return true;
});

// NOT "a Confused retreat scores lower" — that is false, and the reason is the
// interesting part. The Energy is certain but everything else the retreat does
// is a coin flip, INCLUDING the parts that were bad. A retreat the bot already
// hated really is less bad when half of it may not happen; it still loses to
// passing, which is where that decision actually gets made.
//
// So the invariant is about the DISTANCE from the certain bill: whatever the
// retreat was worth above or below the Energy it costs, the flip halves it.
T('the AI values a Confused retreat at the Energy plus half of the rest', () => {
  const score = confused => {
    const E = board('base1-34', ['base1-58']);
    const p = E.state.players[0];
    attach(E, p.active, 'base1-97', 3);
    p.active.status.confused = confused;
    return scorer(E).scoreAction(0, { t: 'retreat', bench: 0 });
  };
  const E0 = board('base1-34', ['base1-58']);
  const paid = scorer(E0).W.retreatBase - 3 * 4;      // Machoke retreats for 3
  const plain = score(false), muddled = score(true);
  if (Math.abs(muddled - paid) >= Math.abs(plain - paid))
    throw new Error(`the flip is free to the bot: ${plain} unconfused, ${muddled} Confused, bill ${paid}`);
  if (Math.abs((paid + (plain - paid) / 2) - muddled) > 1e-9)
    throw new Error(`expected ${paid + (plain - paid) / 2}, got ${muddled}`);
  return true;
});

// ------------------------------------------- what a Pokemon is FOR (walls)
// Asserted here rather than dueled, and that is the doctrine in AI.md rather
// than a shortcut. Stickiness measured at +0.2 points over 2,592 games even on
// the ladder decks, which hold ten times the walls the theme decks do — because
// the rescue branch needs `danger >= remainingHP`, and a wall's whole problem
// is that it has too much HP to be in that state until it is already hurt.
// Which is exactly when Trevor watched it happen.
//
// A duel measures average strength. This is a bot doing something visibly
// stupid in a position a human recognises, and those are worth more than their
// win rate.
console.log('\nStickiness — Pokemon whose job is to stand there');

const named = n => Object.values(CARD_DB).find(c => c.name === n && c.kind === 'pokemon');
const stick = n => wallScore(CARD_DB, EFFECTS, named(n));

T('the four Trevor named all derive as walls, with nobody tagging them', () => {
  for (const n of ['Kangaskhan', 'Chansey', 'Snorlax', 'Electabuzz'])
    if (stick(n) < 0.5) throw new Error(`${n} scored ${stick(n)}`);
  return true;
});

T('and so do two he did not — the derivation is not a list in disguise', () => {
  // Lickitung and Onix were never mentioned; they arrive on their own merits.
  return stick('Lickitung') >= 0.5 && stick('Onix') >= 0.5;
});

T('TERMINAL BASICS ONLY — a Stage 2 is investment, not a wall', () => {
  // The tempting rule is "cannot evolve any further", and it calls Charizard a
  // wall: 120 HP, retreat 3, nothing evolves from it. Trevor's refinement is
  // what keeps three cards of investment worth rescuing.
  for (const n of ['Charizard', 'Blastoise', 'Alakazam'])
    if (stick(n) !== 0) throw new Error(`${n} scored ${stick(n)} and must be 0`);
  return eq(stick('Pikachu'), 0, 'a Basic that evolves is not terminal');
});

T('Tauros is not a wall, and the verb list is why', () => {
  // Tauros carries STATUS_SELF_ON_TAILS — it confuses ITSELF. Matching card
  // text for "Confused" would have promoted it; STALL_VERBS does not list it.
  return stick('Tauros') < 0.5;
});

// A wall on death's door, with somewhere to run to. Scored twice off the same
// board, so the ONLY difference is the weight under test.
function dyingWall(activeId, prizesLeft) {
  const E = board(activeId, ['base1-61'], 'base1-16');      // Rattata benched, vs Zapdos
  const p = E.state.players[0], o = E.state.players[1];
  attach(E, p.active, 'base1-97', 3);                       // something worth "rescuing"
  attach(E, o.active, 'base1-100', 4);                      // Zapdos can afford Thunder
  p.active.dmg = top(E, p.active).hp - 10;                  // one hit from gone
  o.prizes = o.prizes.slice(0, prizesLeft);
  const score = w => new AI(E, { mode: 'expert', weights: { wallStick: w } })
    .scoreAction(0, { t: 'retreat', bench: 0 });
  return { off: score(0), on: score(1.0) };
}

T('a dying wall is worth less to rescue than the same board says without it', () => {
  const r = dyingWall('base2-5', 6);                        // Kangaskhan
  if (!(r.on < r.off)) throw new Error(`rescue not suppressed: ${r.off} -> ${r.on}`);
  return true;
});

T('a dying Stage 2 is unaffected — it is not a wall and must still be saved', () => {
  const r = dyingWall('base1-4', 6);                        // Charizard
  return Math.abs(r.on - r.off) < 1e-9;
});

T("...unless the opponent is one Prize from winning, which is Trevor's caveat", () => {
  // Not written as a special case anywhere. At one Prize the squared divisor
  // puts the Prize term at 60 and stickiness cannot reach it, so the exception
  // falls out of the two terms sitting side by side.
  const six = dyingWall('base2-5', 6), one = dyingWall('base2-5', 1);
  if (!(one.on > six.on + 40))
    throw new Error(`the last Prize did not override stickiness: ${six.on} vs ${one.on}`);
  return true;
});

T('Weakness and Resistance reach the retreat comparison', () => {
  // bestAffordableDamage was the one forecast path that never called
  // computeDamage, and the retreat delta is its only consumer.
  const E = board('base1-61', [], 'base1-2');               // Rattata vs Blastoise
  attach(E, E.state.players[0].active, 'base1-99', 1);      // Bite is affordable
  const A = new AI(E, { mode: 'expert' });
  const plain = A.bestAffordableDamage(0, E.state.players[0].active);
  eq(plain, 20, 'Bite prints 20');
  // Rattata is Colorless. wkOverride is the per-slot hook Porygon's Conversion
  // writes, which is the honest way to move a Weakness without inventing a field.
  E.state.players[1].active.wkOverride = 'C';
  const weak = A.bestAffordableDamage(0, E.state.players[0].active);
  eq(weak, 40, 'and doubles against a defender Weak to Colorless');
  E.state.players[1].active.wkOverride = undefined;
  E.state.players[1].active.rsOverride = 'C';
  eq(A.bestAffordableDamage(0, E.state.players[0].active), 0, 'Resistance subtracts too');
  return true;
});

// ---------------------------------------- recoil, and damage nobody needed
// From a match log of Trevor's, 14 Aug 2026. Two faults sharing one card.
console.log('\nRecoil and overkill — Arcanine');

// Arcanine: Flamethrower RRC 50 (discard a Fire), Take Down RRCC 80 (30 recoil).
// Four Energy makes both affordable, so the ONLY thing separating them is cost.
function arcanine(selfDmg, defId, defDmg) {
  const E = board('base1-23', [], defId);
  const p = E.state.players[0], o = E.state.players[1];
  attach(E, p.active, 'base1-98', 4);
  p.active.dmg = selfDmg; o.active.dmg = defDmg;
  const A = new AI(E, { mode: 'expert' });
  return { fl: A.scoreAttackHypothetical(0, p.active, 0),
           td: A.scoreAttackHypothetical(0, p.active, 1) };
}

T('a fresh Arcanine still takes the recoil for the bigger hit', () => {
  // The fix must not turn Take Down off. At full HP 30 recoil is cheap and 80
  // beats 50, which is the whole reason the card prints the attack.
  const r = arcanine(0, 'base1-2', 0);              // vs Blastoise, neither kills
  if (!(r.td > r.fl)) throw new Error(`Take Down abandoned while healthy: ${r.fl} vs ${r.td}`);
  return true;
});

T('a hurt one does not — recoil is priced on what is LEFT, not on its size', () => {
  // The log: Arcanine on 60 damage of 100 chose Take Down anyway, ended on 90,
  // and killed nothing with the extra 30.
  const r = arcanine(60, 'base1-2', 0);
  if (!(r.fl > r.td)) throw new Error(`still eating recoil at 60 damage: ${r.fl} vs ${r.td}`);
  return true;
});

T('and the old cliff still stands where it always did', () => {
  // 30 recoil on a Pokemon with 30 left is suicide, and always scored as such.
  // The new curve has to MEET that, not replace it.
  const r = arcanine(70, 'base1-2', 0);
  return r.td < 0 && r.fl > r.td;
});

T('when both attacks kill, the cheaper one wins — overkill buys nothing', () => {
  // Trevor's actual report. 80 into a Pokemon with 40 left removes 40 and
  // wastes 40, so the two attacks are worth the same for killing and the
  // decision is their cost. Take Down used to win this by a tenth of a point.
  const r = arcanine(30, 'base1-18', 40);           // Dragonair, 40 HP remaining
  if (!(r.fl > r.td)) throw new Error(`took recoil to overkill: ${r.fl} vs ${r.td}`);
  return true;
});

T('...but the bigger hit is still taken when only IT reaches', () => {
  // Both of the Take Downs in Trevor's log that actually knocked something out
  // were correct, because Flamethrower's 50 could not have reached either one.
  const r = arcanine(30, 'base1-18', 0);            // Dragonair at full 80
  if (!(r.td > r.fl)) throw new Error(`declined the only lethal attack: ${r.fl} vs ${r.td}`);
  return true;
});

T('expDmg keeps meaning the real number, because other rules read it', () => {
  // The cap is a SECOND field on purpose. PlusPower asks "is this 10 short of
  // lethal", which is a question about actual damage — capping in place makes
  // it unanswerable for anything already lethal.
  const E = board('base1-23', [], 'base1-61');      // Rattata, 30 HP, vastly overkilled
  attach(E, E.state.players[0].active, 'base1-98', 4);
  const f = new AI(E, { mode: 'expert' }).forecast(0, 1);
  eq(f.expUseful, 30, 'useful damage stops at what is left');
  if (!(f.expDmg > f.expUseful)) throw new Error('expDmg was capped and must not be');
  return true;
});

// ===========================================================================
// INERT ENERGY  (16 Aug 2026)
// Trevor, from play: the bot attaches Energy its Pokemon cannot use "when no
// other options exist". True, and 9% of every attachment it made — a Grass onto
// something whose only cost is F leaves it exactly as short as it was, buys no
// attack, and strands the card where it can never be spent.
//
// It belongs here rather than in a duel. The fault is symmetric — both seats do
// it — so aiduel reports 50.0% +/-1.4 for the fix, which is the reading
// MEASUREMENT.md tells you to expect and not a verdict on the change.
// ===========================================================================
console.log('\nInert Energy — attachments that achieve nothing');

const attachScore = (E, slotUid, energyId) => {
  const p = E.state.players[0];
  p.hand = [{ id: energyId, uid: E.uid++ }];
  const a = E.legalActions(0).find(x => x.t === 'attachEnergy' && x.target === slotUid);
  if (!a) throw new Error('the attachment should be legal');
  return new AI(E, { mode: 'expert' }).scoreAction(0, a);
};
const HELD = -1;                    // anything at or under this is not attached

T('holds Energy that gets a BENCHED Pokemon no closer to any attack', () => {
  const E = board('base1-3', ['base1-52']);          // Chansey active, Machop benched
  const s = attachScore(E, E.state.players[0].bench[0].uid, 'base1-99');   // Grass on "F"
  if (!(s < HELD)) throw new Error(`Grass onto a benched Machop scored ${s.toFixed(1)}; it should be held`);
  return true;
});

T('...but attaches it to the ACTIVE that cannot yet pay its own retreat', () => {
  // The exception is real and it is one slot wide. Only the Active can retreat,
  // and retreat counts Energy CARDS rather than symbols, so even a useless type
  // is a genuine escape route for the one Pokemon that might have to run.
  const E = board('base1-52', ['base1-3']);          // Machop active, retreat 1, no Energy
  const s = attachScore(E, E.state.players[0].active.uid, 'base1-99');
  if (!(s > 0.5)) throw new Error(`the escape route was refused: ${s.toFixed(1)}`);
  return true;
});

T('...and stops once that retreat is covered', () => {
  const E = board('base1-52', ['base1-3']);
  attach(E, E.state.players[0].active, 'base1-99', 1);   // retreat 1, already paid
  const s = attachScore(E, E.state.players[0].active.uid, 'base1-99');
  if (!(s < HELD)) throw new Error(`second useless Grass scored ${s.toFixed(1)}; it should be held`);
  return true;
});

T('an Energy that shortens the wait is still attached', () => {
  const E = board('base1-3', ['base1-52']);
  const s = attachScore(E, E.state.players[0].bench[0].uid, 'base1-97');   // Fighting on "F"
  if (!(s > 0.5)) throw new Error(`over-corrected: a useful attachment scored ${s.toFixed(1)}`);
  return true;
});

T('an Energy that only makes an existing attack BIGGER is still attached', () => {
  // Poliwag's Water Gun scales with spare Water, so a second Water buys no new
  // attack and shortens nothing — `short` is already 0 — and is still worth
  // making. This is the case the rule must not sweep up: it tests `best`, not
  // just `short`, and this is why.
  const E = board('base1-59', ['base1-3']);          // Poliwag ACTIVE — see below
  attach(E, E.state.players[0].active, 'base1-102', 1);
  const s = attachScore(E, E.state.players[0].active.uid, 'base1-102');
  if (!(s > 0.5)) throw new Error(`spare-Energy scaling was ignored: ${s.toFixed(1)}`);
  return true;
});

T('KNOWN GAP: the same Poliwag on the BENCH is refused that Water', () => {
  // Not a regression and not this rule's doing — it is the Active/Bench unit
  // split in `potential()`, which prices a benched Pokemon at PRINTED damage.
  // Water Gun prints "10+", so `aiParseDamage` reads 10 and the scaling is
  // invisible off the Active. The pre-existing surplus rule already refused this
  // attachment for exactly the same reason.
  //
  // Asserted as it STANDS, deliberately, so that whoever closes AI.md's Open #1
  // trips over a test that names the case rather than a paragraph describing it.
  // If this starts failing, the bench learned to see its own attacks — delete
  // this test and keep the one above.
  //
  // Rain Dance is NOT affected: EXTRA_ATTACH goes straight to `attachValue` and
  // never meets this rule, so piling Water on a benched Blastoise still works.
  const E = board('base1-3', ['base1-59']);
  attach(E, E.state.players[0].bench[0], 'base1-102', 1);
  const s = attachScore(E, E.state.players[0].bench[0].uid, 'base1-102');
  if (!(s < HELD)) throw new Error(`the bench can see spare-Energy scaling now: ${s.toFixed(1)}`);
  return true;
});

T('the original surplus rule still holds — a fully-paid Pokemon is passed over', () => {
  const E = board('base1-3', ['base1-59']);
  attach(E, E.state.players[0].bench[0], 'base1-102', 1);   // retreat 1, paid; Water Gun payable
  const s = attachScore(E, E.state.players[0].bench[0].uid, 'base1-99');   // Grass adds nothing
  if (!(s < HELD)) throw new Error(`surplus Grass scored ${s.toFixed(1)}; it should be held`);
  return true;
});

// ===========================================================================
// WHO GETS SENT UP  (16 Aug 2026)
// From Trevor's log 04-22-45: the bot promoted a 40 HP Voltorb over a 90 HP
// Zapdos into an Arcanine that had just dealt 80, and then spent a Switch on its
// next turn undoing it. Promoting, being Whirlwinded up and choosing a Switch
// target were three nearly-identical formulas that disagreed; they are one now.
// ===========================================================================
console.log('\nPromotion — who gets sent up');

// A board where the opponent's Active can actually hurt: Arcanine, Take Down 80.
function facingArcanine(benchIds) {
  const E = board('base1-3', benchIds, 'base1-23');
  attach(E, E.state.players[1].active, 'base1-98', 4);
  return E;
}
const promoteScore = (E, i) =>
  new AI(E, { mode: 'expert' }).scoreAction(0, { t: 'promote', bench: i });

T('sends up the one that SURVIVES over the one that can attack but dies', () => {
  // The log, rebuilt: Voltorb charged and lethal-in-one, Zapdos big and still
  // charging. The old scorer read 41 against 31.3 and took the Voltorb.
  const E = facingArcanine(['base1-67', 'base1-16']);        // Voltorb, Zapdos
  const p = E.state.players[0];
  p.active = null;
  attach(E, p.bench[0], 'base1-100', 1);                     // Voltorb can swing
  attach(E, p.bench[1], 'base1-100', 1);                     // Zapdos 1 of 4
  const volt = promoteScore(E, 0), zap = promoteScore(E, 1);
  if (!(zap > volt)) throw new Error(`fed the Voltorb: ${volt.toFixed(1)} vs Zapdos ${zap.toFixed(1)}`);
  return true;
});

T('readiness is a countdown — one Energy short beats three', () => {
  // Both survive, both are the same card, so nothing but the wait separates
  // them. Under `short === 0 ? 25 : 0` this was a dead tie.
  const E = board('base1-3', ['base1-16', 'base1-16']);      // two Zapdos, no threat
  E.state.players[0].active = null;
  attach(E, E.state.players[0].bench[0], 'base1-100', 3);    // one Energy short
  attach(E, E.state.players[0].bench[1], 'base1-100', 1);    // three short
  const near = promoteScore(E, 0), far = promoteScore(E, 1);
  if (!(near > far)) throw new Error(`ignored the countdown: ${near.toFixed(1)} vs ${far.toFixed(1)}`);
  return true;
});

T('a Pokemon with nothing invested is the cheaper one to feed', () => {
  // Both Machop are 50 HP, both die to Take Down, and both are one Fighting
  // short — three Grass buys a cost of "F" exactly nothing, so readiness is
  // identical and the only difference is what dies with them. The sacrificial
  // promote is real play and this is the arithmetic it falls out of.
  const E = facingArcanine(['base1-52', 'base1-52']);
  E.state.players[0].active = null;
  attach(E, E.state.players[0].bench[0], 'base1-99', 3);     // three Energy sunk in
  const sunk = promoteScore(E, 0), bare = promoteScore(E, 1);
  if (!(bare > sunk)) throw new Error(`threw away the invested one: ${sunk.toFixed(1)} vs bare ${bare.toFixed(1)}`);
  return true;
});

T('Switch brings in whoever promoting would have chosen', () => {
  // The visible symptom was these two disagreeing. Assert they cannot.
  const E = facingArcanine(['base1-67', 'base1-16', 'base1-51']);
  const p = E.state.players[0];
  attach(E, p.bench[0], 'base1-100', 1);
  attach(E, p.bench[1], 'base1-100', 1);
  p.hand = [{ id: 'base1-95', uid: E.uid++ }];               // Switch
  const ai = new AI(E, { mode: 'expert' });
  const sw = E.legalActions(0).find(x => x.t === 'playTrainer');
  if (!sw) throw new Error('Switch should be playable');
  ai.scoreAction(0, sw);                                     // fills in a.opts.bench
  let bestI = -1, bestV = -Infinity;
  p.bench.forEach((b, i) => { const v = ai.promoteValue(0, b); if (v > bestV) { bestV = v; bestI = i; } });
  eq(sw.opts.bench, bestI, 'Switch target vs promotion ranking');
  return true;
});

// ===========================================================================
// AMORTISED PROGRESS  (16 Aug 2026)
// From Trevor's log 04-31-25 and, more usefully, from his reasoning about it:
// the Zapdos is the better investment because it is Active, can realistically
// survive long enough to charge, and nothing better is waiting on the Bench.
// Advancing used to pay a flat amount per step with no idea what was at the end
// of the road, so completing a Voltorb's 10-damage Tackle beat one of four
// Lightning toward a real attack. Every time.
//
// The only significantly BETTER duel result of the batch: 52.2% +/-1.4, and
// 51.9% +/-1.1 on an independent larger sample, control 50.0%.
// ===========================================================================
// ===========================================================================
// A KNOCK OUT IS NOT MERELY A POKEMON LEAVING THE BOARD  (16 Aug 2026)
// Trevor, from play: Scoop Up threw the Knock Out banner. The UI inferred a KO
// from "a slot that was here is gone", which is equally true of Scoop Up, Mr.
// Fuji and Hurricane. The engine records the real thing per action now.
// ===========================================================================
// ===========================================================================
// PREVENTED DAMAGE WAIVES THE RECOIL  (16 Aug 2026, settled with Trevor)
// Take Down into a Scrunched Chansey was hurting Arcanine for 30 and achieving
// nothing. It is how the Game Boy game and Pocket both play it, and the balance
// reasoning is to reverse the viewpoint: preventing the hit is already the whole
// reward for standing there.
//
// SCOPE: damage and defender-side consequences only. Self-inflicted status is
// the attacker's own coin and still applies — that boundary is asserted below,
// because it is the part a later session would most easily widen by accident.
// ===========================================================================
console.log('\nPrevented damage and recoil');

// Arcanine's Take Down (idx 1): 80 damage, 30 to itself.
function takeDownInto(shield) {
  const E = board('base1-23', [], 'base1-3');            // Arcanine vs Chansey
  attach(E, E.state.players[0].active, 'base1-98', 4);
  if (shield) E.state.players[1].active.effects.push({ kind: 'PREVENT_ALL_DAMAGE' });
  E.act(0, { t: 'attack', idx: 1 });
  return E.state.players[0].active.dmg;
}

T('Arcanine still takes its recoil when the hit lands', () => {
  eq(takeDownInto(false), 30, 'recoil on a normal hit');
  return true;
});

T('...and takes none when the damage was prevented', () => {
  eq(takeDownInto(true), 0, 'recoil against a prevented hit');
  return true;
});

T('a defender-side punish does not fire either', () => {
  // Already true before this change, because retaliate() sits inside the
  // damage-landed branch — asserted so it stays true.
  const E = board('base1-58', [], 'base1-8');            // Pikachu into Machamp
  attach(E, E.state.players[0].active, 'base1-100', 2);
  E.state.players[1].active.effects.push({ kind: 'PREVENT_ALL_DAMAGE' });
  E.act(0, { t: 'attack', idx: 0 });
  eq(E.state.players[0].active.dmg, 0, 'Strikes Back on a prevented hit');
  return true;
});

T('SELF-INFLICTED status still applies — the boundary of the rule', () => {
  // Trevor's call: Tauros confusing itself is the attacker's own coin, not
  // anything the defender did, so prevention has no claim on it. Rampage is
  // idx 1 and confuses Tauros on tails.
  // Both coin outcomes are forced rather than sampled, so the assertion cannot
  // depend on a seed: one of the two must confuse Tauros, prevented or not.
  let sawSelfStatus = false;
  for (const r of [0, 0.99]) {
    const E = board('base2-47', [], 'base1-3');          // Tauros vs Chansey
    E.rand = () => r;
    attach(E, E.state.players[0].active, 'base1-99', 4);
    E.state.players[1].active.effects.push({ kind: 'PREVENT_ALL_DAMAGE' });
    E.act(0, { t: 'attack', idx: 1 });                   // Rampage
    eq(E.state.players[1].active.dmg, 0, 'the damage really was prevented');
    if (E.state.players[0].active.status.confused) sawSelfStatus = true;
  }
  if (!sawSelfStatus) throw new Error('prevention swallowed the self-confusion too');
  return true;
});

T('the AI stops paying for recoil it will not take', () => {
  const score = shield => {
    const E = board('base1-23', [], 'base1-3');
    attach(E, E.state.players[0].active, 'base1-98', 4);
    if (shield) E.state.players[1].active.effects.push({ kind: 'PREVENT_ALL_DAMAGE' });
    return new AI(E, { mode: 'expert' }).scoreAttack(0, 1);
  };
  // Against a shield both attacks do nothing, so what is being asserted is that
  // Take Down is no longer additionally punished for a cost it will not pay.
  const plain = score(false), shielded = score(true);
  if (!(shielded > plain - 80)) throw new Error(
    `recoil still charged behind a shield: ${shielded.toFixed(1)} vs ${plain.toFixed(1)}`);
  return true;
});

// ===========================================================================
// ATTACKING WHILE CONFUSED  (16 Aug 2026)
// From Trevor's log 06-13-50: a Confused Kangaskhan used Fetch on turns 32, 34
// and 36 to draw one card, and hit itself for 30 doing it. Nothing in the
// scorer knew Confusion existed — the retreat rule learned it on 13 Aug and the
// attack path never did.
// ===========================================================================
// ===========================================================================
// DON'T LOSE THE GAME EITHER  (16 Aug 2026)
// The mirror of "win the game if you can win the game", and found the same way.
// Log 06-53-35, final turn: Electabuzz on 10 HP took Thunderpunch — a coin for a
// bonus or 30-plus-10-recoil — Knocked Arcanine out, killed itself on the
// recoil, handed Trevor his last Prize and lost the match on the turn it scored.
// It rated that 73.5 against a safe Thundershock at 33.
//
// An average hid it: expected recoil on that attack is 5, and 5 never killed
// anybody. The worst case is carried alongside the mean now.
// ===========================================================================
console.log("\nDon't lose the game either");

// Electabuzz, 70 HP, Thunderpunch is idx 1 (LC, 30+, 10 recoil on tails).
function lastTurn(theirPrizesLeft, ourBench) {
  const E = board('base1-20', ourBench, 'base1-23');     // Electabuzz vs Arcanine
  const p = E.state.players[0], o = E.state.players[1];
  attach(E, p.active, 'base1-100', 3);
  p.active.dmg = 60;                                     // 10 HP left
  o.active.dmg = 60;                                     // 40 left; Thunderpunch reaches
  o.prizes = Array.from({ length: theirPrizesLeft }, () => ({ id: 'base1-99', uid: E.uid++ }));
  // THEY NEED A BENCH, or the Knock Out empties their board and wins outright —
  // the two game-enders then cancel to roughly nothing and the test measures a
  // mutual-annihilation case instead of the one it means to. That confound cost
  // this test two runs; it is a genuinely ambiguous position and not what the
  // logged one was.
  o.bench = [E.mkSlot({ id: 'base1-46', uid: E.uid++ })];
  return new AI(E, { mode: 'expert' });
}

T('refuses a Knock Out whose own recoil hands over the last Prize', () => {
  const ai = lastTurn(1, ['base1-48']);
  const punch = ai.scoreAttack(0, 1), shock = ai.scoreAttack(0, 0);
  if (!(punch < 0)) throw new Error(`suicidal attack still positive: ${punch.toFixed(1)}`);
  if (!(shock > punch)) throw new Error('the safe attack must win');
  return true;
});

T('...and when it would leave us with no Pokemon at all', () => {
  const ai = lastTurn(6, []);                            // plenty of Prizes, empty Bench
  if (!(ai.scoreAttack(0, 1) < 0)) throw new Error('emptying our own board is not a loss?');
  return true;
});

T('but takes it happily when losing is not on the table', () => {
  // The rule must not become "never recoil". Same board, they need three more.
  const ai = lastTurn(3, ['base1-48']);
  const punch = ai.scoreAttack(0, 1), shock = ai.scoreAttack(0, 0);
  if (!(punch > shock)) throw new Error(
    `over-corrected — the good attack was refused: ${punch.toFixed(1)} vs ${shock.toFixed(1)}`);
  return true;
});

T('the win shortcut does not take a mutual kill', () => {
  // `choose` returns a near-certain lethal outright, BEFORE any scoring, so the
  // rule above cannot reach it. Arcanine on 10 HP: Take Down kills them and the
  // 30 recoil kills us, and they are one Prize from winning.
  const E = board('base1-23', [], 'base1-43');           // Arcanine vs Abra, 30 HP
  const p = E.state.players[0], o = E.state.players[1];
  attach(E, p.active, 'base1-98', 4);
  p.active.dmg = 90;                                     // 10 left — the recoil is fatal
  o.prizes = [{ id: 'base1-99', uid: E.uid++ }];
  p.prizes = [{ id: 'base1-99', uid: E.uid++ }];         // our own lethal would win outright
  const a = new AI(E, { mode: 'expert' }).choose(0);
  if (a && a.t === 'attack' && a.idx === 1) throw new Error('took the mutual kill via the shortcut');
  return true;
});

console.log('\nAttacking while Confused');

const confusedScore = (cardId, idx, confused) => {
  const E = board(cardId, [], 'base1-3');
  attach(E, E.state.players[0].active, 'base1-99', 4);
  E.state.players[0].active.status.confused = confused;
  return new AI(E, { mode: 'expert' }).scoreAttack(0, idx);
};

T("Kangaskhan's Fetch goes negative when Confused, so the bot passes", () => {
  const sane = confusedScore('base2-5', 0, false);
  const dizzy = confusedScore('base2-5', 0, true);
  if (!(sane > 0)) throw new Error(`Fetch should be worth taking normally: ${sane.toFixed(1)}`);
  if (!(dizzy < 0)) throw new Error(`Fetch is still worth taking Confused: ${dizzy.toFixed(1)}`);
  return true;
});

T('...but a real attack is still worth the coin', () => {
  // The rule has to bite on a 5-point draw and not on a 60-point swing, or it is
  // just "never attack while Confused", which is worse play than the bug.
  const dizzy = confusedScore('base2-5', 1, true);       // Comet Punch
  if (!(dizzy > 0)) throw new Error(`over-corrected — real attacks refused too: ${dizzy.toFixed(1)}`);
  return true;
});

console.log('\nWhat counts as a Knock Out');

T('a Knock Out is recorded on the action that caused it', () => {
  const E = board('base1-58', [], 'base1-43');              // Pikachu vs Abra, 30 HP
  attach(E, E.state.players[0].active, 'base1-100', 2);
  E.state.players[1].active.dmg = 20;                       // Gnaw's 10 finishes it
  E.act(0, { t: 'attack', idx: 0 });
  eq((E.state.koThisAction || []).length, 1, 'exactly one Knock Out');
  eq(E.state.koThisAction[0].pi, 1, 'and it was theirs');
  return true;
});

T('Scoop Up records none, which is the bug', () => {
  const E = board('base1-58', ['base1-43']);
  const target = E.state.players[0].bench[0];
  E.state.players[0].hand = [{ id: 'base1-78', uid: E.uid++ }];    // Scoop Up
  const a = E.legalActions(0).find(x => x.t === 'playTrainer');
  if (!a) throw new Error('Scoop Up should be playable');
  a.opts = { targetUid: target.uid };
  const r = E.act(0, a);
  if (!r.ok) throw new Error(r.error);
  eq(E.state.players[0].bench.length, 0, 'the Pokemon did leave the board');
  eq((E.state.koThisAction || []).length, 0, '...but nothing was Knocked Out');
  return true;
});

T('and the record is cleared per action, not per turn', () => {
  const E = board('base1-58', [], 'base1-43');
  attach(E, E.state.players[0].active, 'base1-100', 2);
  // They need something to promote, or the Knock Out ends the game and `act`
  // returns before it can clear anything.
  E.state.players[1].bench = [E.mkSlot({ id: 'base1-43', uid: E.uid++ })];
  E.state.players[1].active.dmg = 20;
  E.act(0, { t: 'attack', idx: 0 });
  eq(E.state.koThisAction.length, 1, 'recorded');
  // The promote that follows a Knock Out is the very next action, and it must
  // come back clean — the banner is keyed on this and would otherwise re-fire.
  const pro = E.legalActions(1).find(x => x.t === 'promote');
  E.act(1, pro || { t: 'pass' });
  eq(E.state.koThisAction.length, 0, 'and gone by the next action');
  return true;
});

console.log('\nAmortised progress — a share of what it builds toward');

const ZAPDOS = 'base3-15';          // 80 HP, Thunderstorm LLLL 40
const VOLTORB = 'base1-67';         // 40 HP, Tackle C 10
const attachTo = (E, uid, energyId) => {
  E.state.players[0].hand = [{ id: energyId, uid: E.uid++ }];
  const a = E.legalActions(0).find(x => x.t === 'attachEnergy' && x.target === uid);
  if (!a) throw new Error('the attachment should be legal');
  return new AI(E, { mode: 'expert' }).scoreAction(0, a);
};

T('one Lightning toward a real attack beats finishing a Voltorb', () => {
  // The logged position. Voltorb came out at 18.0 then and comes out at 18.0
  // now, which is the check that the rebuild is honest; Zapdos was 15.
  const E = board(ZAPDOS, [VOLTORB], 'base1-46');       // Charmander opposite
  attach(E, E.state.players[1].active, 'base1-98', 1);
  E.state.players[0].active.dmg = 20;
  attach(E, E.state.players[0].active, 'base1-100', 1);
  const zap = attachTo(E, E.state.players[0].active.uid, 'base1-100');
  const volt = attachTo(E, E.state.players[0].bench[0].uid, 'base1-100');
  if (!(zap > volt)) throw new Error(`fed the Voltorb: ${volt.toFixed(1)} vs Zapdos ${zap.toFixed(1)}`);
  return true;
});

T('progress is amortised against the attack `short` counts down to', () => {
  // Charmander prints a cheap weak attack and a dearer strong one. With nothing
  // attached, `short` is counting toward the CHEAP one, so that is the attack a
  // step is a fraction of — pricing it against the big number on the card would
  // value a road the Pokemon is not on.
  //
  // Charmeleon looks like the obvious card here and is useless for it: Slash CCC
  // and Flamethrower RRC are the same total cost, so they tie on `short` and the
  // documented tie-break (take the bigger) correctly returns the 50.
  const E = board('base1-3', ['base1-46']);             // Charmander benched
  const slot = E.state.players[0].bench[0];
  const p = new AI(E, { mode: 'expert' }).potential(0, slot, null);
  // Work out by hand which attack is the cheapest to reach from nothing, and
  // what it hits for. With an empty slot that is simply the shortest cost.
  const atks = CARD_DB['base1-46'].attacks;
  const cheapest = atks.reduce((a, b) => (b.cost.length < a.cost.length ? b : a));
  const biggest = atks.reduce((a, b) =>
    (Number(String(b.dmg).match(/\d+/)[0]) > Number(String(a.dmg).match(/\d+/)[0]) ? b : a));
  if (cheapest === biggest) throw new Error(
    `this card cannot distinguish the two and the test proves nothing: ${cheapest.name}`);
  eq(p.short, cheapest.cost.length, 'short counts down to the cheapest attack');
  eq(p.goal, Number(String(cheapest.dmg).match(/\d+/)[0]),
    'and the goal is that attack rather than the biggest number on the card');
  return true;
});

T('a step is worth less than finishing the same attack', () => {
  // Structural, and the guard against over-correcting: a share of a thing can
  // never be worth more than the thing.
  const far = board(ZAPDOS, [], 'base1-46');
  attach(far, far.state.players[0].active, 'base1-100', 1);         // three short
  const early = attachTo(far, far.state.players[0].active.uid, 'base1-100');
  const near = board(ZAPDOS, [], 'base1-46');
  attach(near, near.state.players[0].active, 'base1-100', 3);       // one short
  const last = attachTo(near, near.state.players[0].active.uid, 'base1-100');
  if (!(last > early)) throw new Error(`the last Energy must pay most: ${last.toFixed(1)} vs ${early.toFixed(1)}`);
  return true;
});

T('and is discounted when the Pokemon will not live to fire it', () => {
  // Trevor's own condition: it has to *realistically survive* until the move is
  // powered up. Same board twice, one of them nearly dead.
  // The attacker has to be one the healthy Zapdos actually outlasts. Against an
  // Arcanine that one-shots it either way both sides read "one turn to live",
  // the discount is identical, and the test proves nothing — which is how the
  // first version of it failed.
  const score = dmg => {
    const E = board(ZAPDOS, [], 'base1-46');            // Charmander, Scratch 10
    attach(E, E.state.players[1].active, 'base1-98', 1);
    E.state.players[0].active.dmg = dmg;
    attach(E, E.state.players[0].active, 'base1-100', 1);
    return attachTo(E, E.state.players[0].active.uid, 'base1-100');
  };
  const healthy = score(0), dying = score(70);
  if (!(healthy > dying)) throw new Error(`no discount applied: ${healthy.toFixed(1)} vs ${dying.toFixed(1)}`);
  return true;
});

// ============================================================================
// YOUR DECK IS A RESOURCE — 16 Aug 2026, from two of Trevor's grab bag items
// ============================================================================
//
// Asserted here rather than measured in a duel, and deliberately: both seats
// share the fault, so it is symmetric and aiduel.js cancels it. That is the
// standing doctrine in MEASUREMENT.md.
//
// Score one Trainer out of a hand, with the deck trimmed to `left` cards.
function trainerScore(id, left, extraHand = []) {
  const E = board('base1-46');                       // Charmander, nothing special
  const p = E.state.players[0];
  p.hand = extraHand.map(x => ({ id: x, uid: E.uid++ }));
  p.hand.push({ id, uid: E.uid++ });
  p.deck = p.deck.slice(0, left);
  E.aiChoose(0, 'expert');
  const ai = E._ai;
  const a = E.legalActions(0).find(x => x.t === 'playTrainer'
    && p.hand[x.hand] && p.hand[x.hand].id === id);
  // NOT `return null` on a miss. An earlier version of these tests did that and
  // paired it with `if (s === null) return true` at every call site, so a wrong
  // card id (base1-60 is Ponyta, not Gambler) made two assertions pass while
  // testing nothing at all. Fail loudly: a miss here is a broken test, never an
  // inapplicable one.
  if (!a) throw new Error(`no legal play for ${id} — wrong card id, or the engine refuses it`);
  return ai.scoreTrainer(0, a);
}

T('Bill is worth taking on a full deck', () => {
  const s = trainerScore('base1-91', 40);
  if (!(s > 0)) throw new Error(`Bill refused at 40 cards: ${s.toFixed(1)}`);
  return true;
});

T('...and refused when it would empty the deck', () => {
  const s = trainerScore('base1-91', 2);
  if (!(s < 0)) throw new Error(`Bill still taken with 2 cards left: ${s.toFixed(1)}`);
  return true;
});

T('the deck cost is a CURVE, not a floor', () => {
  // The whole point of not writing this as "stop below 20". If these three are
  // ever equal, someone has replaced the curve with a threshold — which is the
  // cliff shape this project has now been bitten by six times.
  const hi = trainerScore('base1-91', 40);
  const mid = trainerScore('base1-91', 14);
  const lo = trainerScore('base1-91', 6);
  if (!(hi > mid && mid > lo))
    throw new Error(`not monotonic: 40=${hi.toFixed(1)} 14=${mid.toFixed(1)} 6=${lo.toFixed(1)}`);
  if (Math.abs(hi - mid) < 0.01)
    throw new Error('flat between 40 and 14 — this is a threshold, not a curve');
  return true;
});

T('Professor Oak keeps a hand worth keeping', () => {
  // Six cards the board can actually use versus an empty hand, same deck size.
  const full = trainerScore('base1-88', 40,
    ['base1-98', 'base1-98', 'base1-98', 'base1-98', 'base1-98', 'base1-98']);
  const empty = trainerScore('base1-88', 40, []);
  if (!(empty > full))
    throw new Error(`Oak not discriminating by hand: full=${full.toFixed(1)} empty=${empty.toFixed(1)}`);
  return true;
});

T('Gambler is deck-POSITIVE on a big hand and a burner on a bare one', () => {
  // The deck term in isolation, because the behavioural score is legitimately
  // confounded by hand quality — the first version of this test filled the big
  // hand with Energy the board wanted, and the bot correctly refused to shuffle
  // it away. That was the TEST being wrong, not the code, and it is the second
  // time in this file that a wrong premise looked like a failing feature.
  //
  // Gambler shuffles the hand back in BEFORE drawing 1-or-8, so the net deck
  // change is `held - 4.5`. On eight cards it hands 3.5 back; on none it eats
  // 4.5. It is the only recycling card in the game and must not be capped
  // alongside Bill.
  const E = board('base1-46');
  E.aiChoose(0, 'expert');
  const ai = E._ai;
  E.state.players[0].deck = E.state.players[0].deck.slice(0, 8);
  const bigHand = ai.deckRisk(0, 4.5 - 8);     // holding eight
  const bareHand = ai.deckRisk(0, 4.5 - 0);    // holding none
  if (!(bigHand > 0)) throw new Error(`recycling scored as a cost: ${bigHand.toFixed(1)}`);
  if (!(bareHand < 0)) throw new Error(`burning 4.5 of 8 scored as free: ${bareHand.toFixed(1)}`);
  return true;
});

T('...and the bot prefers it on a big hand of cards it cannot use', () => {
  // The same comparison behaviourally, with a hand the board has no use for:
  // Blastoise with no Wartortle in play is a dead card.
  const bigHand = trainerScore('base3-60', 8, Array(8).fill('base1-2'));
  const bareHand = trainerScore('base3-60', 8, []);
  if (!(bigHand > bareHand))
    throw new Error(`Gambler priced as a burner: big=${bigHand.toFixed(1)} bare=${bareHand.toFixed(1)}`);
  return true;
});

// ------------------------------------------- Retreat is measured in symbols
// The 17 Aug 2026 reversal, asserted from both ends. Rulings/RETREAT-COST.md
// carries the reasoning; what these pin down is the pair of behaviours that make
// it a real ruling rather than a renamed constant — a Double Colorless COVERS
// two, and a Double Colorless SPENT on a cost of one is gone entirely.
console.log('\nRetreat — symbols, not cards');

// A fixture that states its own assumptions. Every test below depends on the
// printed retreat cost of its subject, and a card errata'd underneath one of
// them would otherwise turn a real failure into a confusing one.
const retreatFixture = (id, want) => {
  const E = board(id, ['base1-58']);
  const act = E.state.players[0].active;
  const got = E.retreatCostOf(act);
  if (got !== want) throw new Error(`fixture wants ${id} at retreat ${want}, got ${got}`);
  return { E, act, p: E.state.players[0] };
};

T('a Double Colorless covers two of a retreat cost on its own', () => {
  const { E, act } = retreatFixture('base1-13', 3);         // Machoke
  attach(E, act, 'base1-96', 1);                            // DCE = CC
  eq(E.energyTotal(act), 2, 'symbol total');
  eq(act.energy.length, 1, 'card count — one card, two symbols');
  eq(E.canRetreat(act), false, 'still one short of retreat 3');
  attach(E, act, 'base1-97', 1);
  eq(E.canRetreat(act), true, 'DCE plus a basic makes three');
  return true;
});

T('the fallback prefers an exact fit over wasting a Double Colorless', () => {
  const { E, act } = retreatFixture('base1-13', 3);
  attach(E, act, 'base1-96', 1);                            // DCE  = 2
  attach(E, act, 'base1-97', 3);                            // three basics = 3
  const pay = E.retreatPayOrder(act);
  eq(pay.length, 3, 'three basics pay it exactly');
  eq(pay.some(e => e.id === 'base1-96'), false, 'and the DCE is left alone');
  return true;
});

T('...but spends it when nothing else will cover the cost', () => {
  const { E, act, p } = retreatFixture('base1-13', 3);
  attach(E, act, 'base1-96', 1);                            // DCE   = 2
  attach(E, act, 'base1-97', 1);                            // basic = 1
  const before = p.discard.length;
  eq(E.act(0, { t: 'retreat', bench: 0 }).ok, true, 'retreat allowed');
  eq(p.discard.length - before, 2, 'both cards spent — exactly 3 symbols');
  return true;
});

T('with ONLY a Double Colorless it pays a cost of one, and the change is lost', () => {
  // The tax Trevor moved when he reversed the ruling: under the card rule this
  // Pokemon could not have retreated at all on one card, and under this one it
  // can, at the price of throwing a symbol away. Both halves are the point.
  const { E, act, p } = retreatFixture('base1-58', 1);
  attach(E, act, 'base1-96', 1);
  eq(E.canRetreat(act), true, 'two symbols cover one');
  eq(E.retreatChoiceIsReal(act), false, 'nothing to choose between — do not ask');
  const before = p.discard.length;
  E.act(0, { t: 'retreat', bench: 0 });
  eq(p.discard.length - before, 1, 'the whole card left');
  eq(act.energy.length, 0, 'and nothing came back as change');
  return true;
});

T('a redundant payment is refused, but a forced overshoot is not', () => {
  const { E, act } = retreatFixture('base1-58', 1);
  attach(E, act, 'base1-96', 1);                            // DCE
  attach(E, act, 'base1-97', 1);                            // basic
  const dce = act.energy.find(e => e.id === 'base1-96');
  const bas = act.energy.find(e => e.id === 'base1-97');
  eq(E.act(0, { t: 'retreat', bench: 0, pay: [dce.uid, bas.uid] }).ok, false,
     'paying 3 symbols for a cost of 1 is refused');
  eq(E.act(0, { t: 'retreat', bench: 0, pay: [dce.uid] }).ok, true,
     'the unavoidable overshoot is allowed');
  return true;
});

T('the same card is not accepted twice for one retreat', () => {
  const { E, act } = retreatFixture('base1-13', 3);
  attach(E, act, 'base1-96', 1);
  attach(E, act, 'base1-97', 1);
  const dce = act.energy.find(e => e.id === 'base1-96');
  eq(E.act(0, { t: 'retreat', bench: 0, pay: [dce.uid, dce.uid] }).ok, false,
     'a uid listed twice does not pay twice');
  return true;
});

T('the picker is offered exactly when the choice is real', () => {
  // The case a card-count test gets wrong in BOTH directions, which is why
  // retreatChoiceIsReal enumerates the legal payments instead of counting cards.
  const one = retreatFixture('base1-58', 1);
  attach(one.E, one.act, 'base1-96', 1);
  attach(one.E, one.act, 'base1-97', 1);
  eq(one.E.retreatChoiceIsReal(one.act), true,
     'DCE or basic for a cost of 1 is a real choice, and a sharp one');

  const three = retreatFixture('base1-13', 3);
  attach(three.E, three.act, 'base1-96', 1);
  attach(three.E, three.act, 'base1-97', 1);
  eq(three.E.energyTotal(three.act), 3, 'exactly enough');
  eq(three.E.retreatChoiceIsReal(three.act), false,
     'both cards are needed, so there is nothing to ask about');
  return true;
});

// THE REGRESSION TEST FOR THIS WHOLE SECTION, and the one that earned its place.
//
// The first version of retreatPayOrder was a greedy scan and it could construct
// a payment that doRetreat then refused as redundant — retreat 2 holding a Fire
// and a Double Colorless, where taking the Fire first strands you on a total of
// 3. The engine rejected its own fallback, the AI re-picked the same retreat
// every action, and 26% of ladder games span until the harness cut them off.
//
// None of the hand-written cases above caught it, because every one of them was
// a board somebody had thought about. This one thinks about none of them: it
// enumerates small Energy pools against every retreat cost and asserts the one
// property that actually matters — THE FALLBACK MUST NEVER PROPOSE A PAYMENT
// THE VALIDATOR REJECTS. Write the property, not the example.
T('the fallback never proposes a payment doRetreat would refuse', () => {
  const KINDS = ['base1-96', 'base1-97', 'base1-98'];   // DCE(2), Fighting, Fire
  let checked = 0;
  // Every multiset of up to 4 Energy cards, against Machoke's retreat of 3 and
  // against a discounted 1 and 2 via a benched Dodrio stand-in.
  const pools = [];
  const walk = (acc, start) => {
    if (acc.length) pools.push(acc.slice());
    if (acc.length === 4) return;
    for (let i = start; i < KINDS.length; i++) { acc.push(KINDS[i]); walk(acc, i); acc.pop(); }
  };
  walk([], 0);

  for (const pool of pools) {
    const E = board('base1-13', ['base1-58']);           // Machoke, retreat 3
    const act = E.state.players[0].active;
    pool.forEach(id => attach(E, act, id, 1));
    if (!E.canRetreat(act)) continue;                    // nothing to check
    const pay = E.retreatPayOrder(act).map(e => e.uid);
    const r = E.act(0, { t: 'retreat', bench: 0, pay });
    if (!r.ok) throw new Error(
      `pool [${pool.join(', ')}] cost ${E.retreatCostOf(act)}: fallback refused — ${r.error}`);
    checked++;
  }
  if (checked < 8) throw new Error(`only ${checked} pools were legal — fixture is not exercising this`);
  return true;
});

T('two identical basics are one option wearing two hats', () => {
  const { E, act } = retreatFixture('base1-58', 1);
  attach(E, act, 'base1-97', 2);
  eq(E.retreatChoiceIsReal(act), false,
     'picking which of two Fighting Energy dies is not a decision');
  return true;
});

// -------------------------------- One coin, several consequences (Job 10b)
// FLIP_BONUS_OR_RECOIL grew statusOnHeads and discardOnHeads for Team Rocket,
// and the property worth asserting is not what each option does — it is that
// THEY ALL RIDE THE SAME COIN. Scripting Sticky Hands as a bonus verb plus a
// status verb would flip twice and produce a card that can pay 30 and fail to
// paralyse, which the printed card cannot do. A test that only checked 'heads
// paralyses' would pass on that broken version, so these count the flips.
console.log('\nOne coin, several consequences');

// Counts how many times the engine actually asked for a coin, which is the
// assertion the obvious test misses.
function countingBoard(activeId, oppId, heads) {
  const E = board(activeId, ['base1-58'], oppId);
  E.flips = 0;
  const real = E.flip.bind(E);
  E.flip = (...args) => { E.flips++; return heads; };
  E.restore = () => { E.flip = real; };
  return E;
}

T('Sticky Hands pays the bonus and paralyses on ONE coin', () => {
  const E = countingBoard('base5-57', 'base1-58', true);   // Grimer
  const me = E.state.players[0], you = E.state.players[1];
  attach(E, me.active, 'base1-99', 2);                     // Grass x2
  const r = E.act(0, { t: 'attack', idx: 1 });
  eq(r.ok, true, 'attack resolved');
  eq(E.flips, 1, 'exactly one coin was flipped');
  eq(you.active.dmg, 30, 'heads pays 10 + 20');
  eq(you.active.status.paralyzed, true, 'and paralyses on the same coin');
  return true;
});

T('...and on tails does neither', () => {
  const E = countingBoard('base5-57', 'base1-58', false);
  const me = E.state.players[0], you = E.state.players[1];
  attach(E, me.active, 'base1-99', 2);
  E.act(0, { t: 'attack', idx: 1 });
  eq(E.flips, 1, 'still exactly one coin');
  eq(you.active.dmg, 10, 'tails is the bare 10');
  eq(you.active.status.paralyzed, false, 'and no status');
  return true;
});

T('Thunder Attack points the same coin both ways', () => {
  // Heads paralyses; tails hurts Dark Jolteon. Damage is flat either way, which
  // is what makes this a different use of the same verb rather than a copy.
  const H = countingBoard('base5-38', 'base1-58', true);    // Dark Jolteon
  attach(H, H.state.players[0].active, 'base1-100', 3);
  H.act(0, { t: 'attack', idx: 1 });
  eq(H.flips, 1, 'one coin on heads');
  eq(H.state.players[1].active.status.paralyzed, true, 'heads paralyses');
  eq(H.state.players[0].active.dmg, 0, 'and costs nothing');

  const Tl = countingBoard('base5-38', 'base1-58', false);
  attach(Tl, Tl.state.players[0].active, 'base1-100', 3);
  Tl.act(0, { t: 'attack', idx: 1 });
  eq(Tl.state.players[1].active.status.paralyzed, false, 'tails does not');
  eq(Tl.state.players[0].active.dmg, 10, 'tails costs 10');
  return true;
});

T('Playing with Fire burns the Energy only on the coin that pays', () => {
  // Chansey, 120 HP — Pikachu dies to the 50 and the assertion then reads a
  // null Active. A fixture that gets Knocked Out is a fixture that stops
  // measuring what you asked it to.
  const H = countingBoard('base5-35', 'base1-3', true);     // Dark Flareon
  const me = H.state.players[0];
  attach(H, me.active, 'base1-98', 2);                      // Fire x2
  H.act(0, { t: 'attack', idx: 1 });
  eq(H.flips, 1, 'one coin');
  eq(H.state.players[1].active.dmg, 50, 'heads pays 30 + 20');
  eq(me.active.energy.length, 1, 'and burns one Fire');

  const Tl = countingBoard('base5-35', 'base1-3', false);
  const me2 = Tl.state.players[0];
  attach(Tl, me2.active, 'base1-98', 2);
  Tl.act(0, { t: 'attack', idx: 1 });
  eq(Tl.state.players[1].active.dmg, 30, 'tails is the bare 30');
  eq(me2.active.energy.length, 2, 'and keeps the Energy');
  return true;
});

T('Fireball does NOTHING on tails, not even damage', () => {
  const Tl = countingBoard('base5-32', 'base1-58', false);  // Dark Charmeleon
  attach(Tl, Tl.state.players[0].active, 'base1-98', 3);
  Tl.act(0, { t: 'attack', idx: 1 });
  eq(Tl.state.players[1].active.dmg, 0, 'no damage at all on tails');
  eq(Tl.state.players[0].active.energy.length, 3, 'and nothing discarded');
  return true;
});

T('REQUIRE_SELF_ENERGY is currently UNREACHABLE on both cards that print it', () => {
  // Written as a gate test and it failed, for the exact reason Job 6 recorded:
  // canUseAttack was refusing on COST, not on the rule under test. Chasing that
  // produced a real finding rather than a broken test.
  //
  // Fireball costs RRR and Playing with Fire costs RR, so a board that cannot
  // satisfy "any Fire Energy attached" cannot pay the cost either — the clause
  // is redundant on both cards WotC printed it on. The verb is kept because it
  // is what the card says and it costs nothing, but nothing exercises it, so
  // this asserts the redundancy instead of pretending to test the gate.
  //
  // IT STOPS BEING REDUNDANT the moment a card pays a Colorless cost and demands
  // a specific type, or an effect pays a Fire cost with something that is not a
  // Fire card. Write a real gate test then.
  const E = board('base5-32', ['base1-58']);
  attach(E, E.state.players[0].active, 'base1-96', 2);       // two DCE = CCCC
  const why = E.canUseAttack(0, 1);
  eq(why.ok, false, 'refused with no Fire attached');
  if (/Fire|R Energy/i.test(why.why || ''))
    throw new Error('the gate is reachable after all — write the real test');
  return true;
});

T('a Barrier stops the coin-borne status exactly as it stops a printed one', () => {
  // statusOnHeads is deferred into the post-damage phase for this reason. If it
  // were applied where the coin is read, it would land through a Barrier.
  const E = countingBoard('base5-57', 'base1-58', true);    // Grimer, heads
  const me = E.state.players[0], you = E.state.players[1];
  attach(E, me.active, 'base1-99', 2);
  you.active.effects.push({ kind: 'PREVENT_ALL_EFFECTS', expireAtStartOfTurn: E.state.turn + 2 });
  E.act(0, { t: 'attack', idx: 1 });
  eq(you.active.status.paralyzed, false, 'the status was blocked');
  return true;
});

// ---------------------------------- "You may", and evolving off the deck
console.log('\nOptional switch, and Rapid Evolution');

T('Teleport Blast switches when asked', () => {
  const E = board('base5-1', ['base1-58']);            // Dark Alakazam, Pikachu benched
  const me = E.state.players[0];
  attach(E, me.active, 'base1-101', 3);                // Psychic x3
  const was = E.nameOf(me.active);
  eq(E.act(0, { t: 'attack', idx: 0, opts: { bench: 0 } }).ok, true, 'attack resolved');
  eq(E.nameOf(me.active), 'Pikachu', 'the benched Pokemon came up');
  eq(E.nameOf(me.bench[me.bench.length - 1]), was, 'and Alakazam went down');
  return true;
});

T('...and DECLINES on bench: -1, which is the whole point of `optional`', () => {
  const E = board('base5-1', ['base1-58']);
  const me = E.state.players[0];
  attach(E, me.active, 'base1-101', 3);
  eq(E.act(0, { t: 'attack', idx: 0, opts: { bench: -1 } }).ok, true, 'attack resolved');
  eq(E.nameOf(me.active), 'Dark Alakazam', 'it stayed put');
  eq(E.state.players[1].active.dmg, 30, 'and the damage still landed');
  return true;
});

T('an ABSENT choice still switches, so no older caller changed behaviour', () => {
  // The compatibility half. Every pre-existing caller — the AI, every test
  // written before `optional` — supplies nothing, and Exeggutor's Teleport is
  // NOT optional. Absent must therefore keep meaning "switch", not "decline".
  const E = board('base5-1', ['base1-58']);
  const me = E.state.players[0];
  attach(E, me.active, 'base1-101', 3);
  E.act(0, { t: 'attack', idx: 0 });
  eq(E.nameOf(me.active), 'Pikachu', 'absent is not declining');
  return true;
});

T('Rapid Evolution pulls a named Gyarados out of the deck and evolves', () => {
  const E = board('base5-47');                          // Magikarp
  const me = E.state.players[0];
  attach(E, me.active, 'base1-102', 3);                 // Water x3
  me.deck.unshift({ id: 'base5-8', uid: E.uid++ });      // Dark Gyarados
  const before = me.deck.length;
  eq(E.act(0, { t: 'attack', idx: 1 }).ok, true, 'attack resolved');
  eq(E.nameOf(me.active), 'Dark Gyarados', 'Magikarp evolved on the spot');
  eq(me.deck.length, before - 1, 'and the card left the deck');
  eq(me.active.stack.length, 2, 'stacked, not replaced — Magikarp is underneath');
  return true;
});

T('...and does nothing at all when neither Gyarados is in the deck', () => {
  const E = board('base5-47');
  const me = E.state.players[0];
  attach(E, me.active, 'base1-102', 3);
  me.deck = me.deck.filter(x => !/Gyarados/.test(E.db[x.id].name));
  eq(E.act(0, { t: 'attack', idx: 1 }).ok, true, 'the attack is still legal');
  eq(E.nameOf(me.active), 'Magikarp', 'and simply achieves nothing');
  return true;
});

T('it refuses a Gyarados that does not evolve from what is Active', () => {
  // The name list is not the whole check — `evolvesFrom` is. Dark Gyarados
  // evolves from Magikarp, so a board with something else Active must not be
  // able to pull it, even though the NAME matches.
  const E = board('base5-47');
  const me = E.state.players[0];
  attach(E, me.active, 'base1-102', 3);
  me.deck.unshift({ id: 'base5-8', uid: E.uid++ });
  // Swap the Active for something Dark Gyarados cannot evolve from.
  me.active = E.mkSlot({ id: 'base1-58', uid: E.uid++ });   // Pikachu
  me.active.playedTurn = 0;
  attach(E, me.active, 'base1-102', 3);
  const n = me.deck.length;
  E.act(0, { t: 'attack', idx: 1 });
  eq(me.deck.length, n, 'nothing was taken from the deck');
  eq(E.nameOf(me.active), 'Pikachu', 'and nothing evolved');
  return true;
});

// ------------------------------------------ Mass Explosion, and its ruling
// Rulings/MASS-EXPLOSION.md is the reasoning; this is the ruling as assertions,
// because two of its three consequences look exactly like bugs and somebody
// will eventually try to 'fix' one. A test is the cheapest way to make that
// attempt fail loudly instead of quietly shipping a softer card.
console.log('\nMass Explosion');

// A DAMAGE LEDGER, because three of these assertions kept reading a null Active:
// the subject was Knocked Out by the very damage under test and left the board
// before it could be measured. Raising HP is not available — the cards are the
// cards — so record what dealDamage was ASKED to do instead of inspecting the
// wreckage afterwards. It also measures each wave separately, which reading a
// final `dmg` never could.
function ledger(E) {
  const seen = new Map();
  const real = E.dealDamage.bind(E);
  E.dealDamage = (src, tgt, amt, opts) => {
    const k = tgt && tgt.uid;
    if (!seen.has(k)) seen.set(k, []);
    const r = real(src, tgt, amt, opts);
    seen.get(k).push(r && r.dealt !== undefined ? r.dealt : amt);
    return r;
  };
  E.hits = uid => seen.get(uid) || [];
  E.total = uid => (seen.get(uid) || []).reduce((a, b) => a + b, 0);
  return E;
}

function weezingBoard(oppActive, myBench, oppBench) {
  const E = board('base5-14', myBench || [], oppActive);
  const you = E.state.players[1];
  you.bench = (oppBench || []).map(id => {
    const sl = E.mkSlot({ id, uid: E.uid++ }); sl.playedTurn = 0; return sl;
  });
  attach(E, E.state.players[0].active, 'base1-99', 1);
  attach(E, E.state.players[0].active, 'base1-97', 1);   // GC paid
  return ledger(E);
}

T('the attacker is in its own blast', () => {
  // base5-58 Koffing opposite, nothing else. Two named cards in play: the
  // attacking Dark Weezing and that Koffing.
  const E = weezingBoard('base5-58');
  const me = E.state.players[0], you = E.state.players[1];
  eq(E.act(0, { t: 'attack', idx: 0 }).ok, true, 'attack resolved');
  eq(me.active.dmg, 20, 'Dark Weezing took its own 20');
  return true;
});

T('a Defending Pokemon that is one of the named takes BOTH waves', () => {
  const E = weezingBoard('base5-58');                   // Koffing, 50 HP
  const uid = E.state.players[1].active.uid;
  E.act(0, { t: 'attack', idx: 0 });
  // TWO separate hits is the assertion, not the total. Two named in play (the
  // attacker and this Koffing) so the main wave is 40 and the splash adds 20.
  // The Koffing dies to the first, which is exactly why this reads the ledger.
  const hits = E.hits(uid);
  eq(hits.length, 2, 'hit twice by one attack');
  eq(E.total(uid), 60, '40 from the count, then 20 from the splash');
  return true;
});

T('...and OUR OWN Bench takes it, which is what "even your own" says', () => {
  const E = weezingBoard('base5-58', ['base5-58']);      // a Koffing on our bench
  const me = E.state.players[0];
  E.act(0, { t: 'attack', idx: 0 });
  eq(me.bench[0].dmg, 20, 'our own Koffing took 20');
  return true;
});

T('the count is BOTH sides, not just ours', () => {
  // One extra Koffing on THEIR bench must raise the damage. If the enumeration
  // were our-side-only this reads the same as the test above and proves nothing.
  const one = weezingBoard('base1-58');                  // Pikachu opposite: 1 named
  const u1 = one.state.players[1].active.uid;
  one.act(0, { t: 'attack', idx: 0 });
  const dmgOne = one.total(u1);

  const two = weezingBoard('base1-58', [], ['base5-58']); // + a Koffing on their bench
  const u2 = two.state.players[1].active.uid;
  two.act(0, { t: 'attack', idx: 0 });
  const dmgTwo = two.total(u2);

  if (!(dmgTwo > dmgOne))
    throw new Error(`their bench did not count: ${dmgOne} then ${dmgTwo}`);
  return true;
});

console.log('\nContinuous Fireball and Magnetism');

T('Continuous Fireball flips per FIRE attached and burns one per head', () => {
  const E = ledger(board('base5-4', ['base1-58'], 'base1-3'));  // vs Chansey
  const me = E.state.players[0];
  const uid = E.state.players[1].active.uid;
  attach(E, me.active, 'base1-98', 3);                  // Fire x3
  attach(E, me.active, 'base1-99', 2);                  // Grass x2 — must NOT be counted
  let flips = 0;
  E.flip = () => { flips++; return true; };
  E.act(0, { t: 'attack', idx: 1 });
  eq(flips, 3, 'three coins — one per FIRE, not per Energy');
  // 150 asked for; Chansey only has 120, so the ledger records what LANDED. The
  // number under test is the count of coins and the discard, not the overkill.
  if (E.hits(uid)[0] < 120) throw new Error(`expected a lethal 50-a-head, got ${E.hits(uid)[0]}`);
  eq(me.active.energy.filter(e => E.db[e.id].provides === 'R').length, 0, 'all three Fire burned');
  eq(me.active.energy.length, 2, 'and the Grass is untouched');
  return true;
});

T('...and burns nothing on all tails', () => {
  const E = board('base5-4', ['base1-58'], 'base1-3');
  const me = E.state.players[0];
  attach(E, me.active, 'base1-98', 3);
  E.flip = () => false;
  E.act(0, { t: 'attack', idx: 1 });
  eq(E.state.players[1].active.dmg, 0, 'no heads, no damage');
  eq(me.active.energy.length, 3, 'and no discard');
  return true;
});

T('Magnetism counts your BENCH only, never the attacker itself', () => {
  // Magnemite is Active when it attacks. `where: 'mine'` would count it and
  // silently add 10 to every use.
  const bare = board('base5-60', [], 'base1-3');
  attach(bare, bare.state.players[0].active, 'base1-100', 1);
  attach(bare, bare.state.players[0].active, 'base1-99', 1);
  bare.act(0, { t: 'attack', idx: 1 });
  eq(bare.state.players[1].active.dmg, 10, 'alone it is the printed 10');

  // BOTH of these are named Magnemite — base1-53 is Base Set's and base5-60 is
  // Team Rocket's, two collectibles with one name. The first version of this
  // test expected 20 from them, which was my arithmetic being wrong rather than
  // the code: the verb matches on NAME, so it correctly counted two.
  const withFriends = board('base5-60', ['base5-60', 'base1-53'], 'base1-3');
  attach(withFriends, withFriends.state.players[0].active, 'base1-100', 1);
  attach(withFriends, withFriends.state.players[0].active, 'base1-99', 1);
  withFriends.act(0, { t: 'attack', idx: 1 });
  eq(withFriends.state.players[1].active.dmg, 30, 'two benched Magnemite add 10 each');

  // And a benched Pokemon that is NOT named must not count, which is the half
  // that would still pass if `names` were being ignored entirely.
  const stranger = board('base5-60', ['base1-58'], 'base1-3');
  attach(stranger, stranger.state.players[0].active, 'base1-100', 1);
  attach(stranger, stranger.state.players[0].active, 'base1-99', 1);
  stranger.act(0, { t: 'attack', idx: 1 });
  eq(stranger.state.players[1].active.dmg, 10, 'a benched Pikachu adds nothing');
  return true;
});

// ------------------------------------------- Shuffled off the board entirely
// Vanish and Fling are one verb pointed two ways, and the two things that
// differ — WHO goes and where their Energy lands — are exactly what these
// assert. Get either backwards and both cards still 'work'.
console.log('\nShuffled into the deck');

T('Fling puts their Active AND its Energy into their DECK', () => {
  const E = board('base5-10', [], 'base1-58');          // Dark Machamp vs Pikachu
  const me = E.state.players[0], you = E.state.players[1];
  you.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  you.bench[0].playedTurn = 0;
  attach(E, me.active, 'base1-97', 4);                  // FFFC
  attach(E, you.active, 'base1-100', 2);                // two Energy to follow it
  const deckWas = you.deck.length, discardWas = you.discard.length;
  eq(E.act(0, { t: 'attack', idx: 1 }).ok, true, 'attack resolved');
  eq(you.deck.length, deckWas + 3, 'Pikachu and both Energy went into the deck');
  eq(you.discard.length, discardWas, 'and NOTHING was discarded');
  return true;
});

T('...and is illegal with their Bench empty, as printed', () => {
  const E = board('base5-10', [], 'base1-58');
  attach(E, E.state.players[0].active, 'base1-97', 4);
  E.state.players[1].bench = [];
  const why = E.canUseAttack(0, 1);
  eq(why.ok, false, 'refused');
  if (!/Bench/i.test(why.why || '')) throw new Error(`refused for the wrong reason: ${why.why}`);
  return true;
});

T('Vanish takes Abra to the deck but BURNS what was attached', () => {
  const E = board('base5-49', ['base1-58']);            // Abra, Pikachu benched
  const me = E.state.players[0];
  attach(E, me.active, 'base1-101', 3);                 // one pays, two spare
  const deckWas = me.deck.length, discardWas = me.discard.length;
  eq(E.act(0, { t: 'attack', idx: 0 }).ok, true, 'attack resolved');
  eq(me.deck.length, deckWas + 1, 'only Abra itself went into the deck');
  eq(me.discard.length, discardWas + 3, 'and all three Energy burned');
  return true;
});

T('...and Vanishing your LAST Pokemon loses the game, with no guard invented', () => {
  // The card prints no gate and neither do we. See Rulings/MASS-EXPLOSION.md on
  // clauses invented for comfort; the engine already ends the game correctly.
  const E = board('base5-49');                          // Abra alone
  attach(E, E.state.players[0].active, 'base1-101', 1);
  eq(E.canUseAttack(0, 0).ok, true, 'the attack is legal');
  E.act(0, { t: 'attack', idx: 0 });
  eq(E.state.winner, 1, 'and the opponent wins');
  return true;
});

console.log('\nBench Manipulation and Surprise Thunder');

T('Bench Manipulation counts THEIR tails, one coin per THEIR bench', () => {
  const E = board('base5-9', [], 'base1-3');            // Dark Hypno vs Chansey
  const you = E.state.players[1];
  you.bench = ['base1-58', 'base1-58', 'base1-58'].map(id => {
    const sl = E.mkSlot({ id, uid: E.uid++ }); sl.playedTurn = 0; return sl;
  });
  attach(E, E.state.players[0].active, 'base1-101', 3);
  let flips = 0;
  E.flip = () => { flips++; return false; };            // all TAILS
  E.act(0, { t: 'attack', idx: 1 });
  eq(flips, 3, 'three coins for three benched');
  eq(you.active.dmg, 60, 'all tails is 20 x 3');
  return true;
});

T('...and an empty bench means no coins and no damage', () => {
  const E = board('base5-9', [], 'base1-3');
  E.state.players[1].bench = [];
  attach(E, E.state.players[0].active, 'base1-101', 3);
  let flips = 0;
  E.flip = () => { flips++; return false; };
  E.act(0, { t: 'attack', idx: 1 });
  eq(flips, 0, 'nothing to flip for');
  eq(E.state.players[1].active.dmg, 0, 'and no damage');
  return true;
});

T('Surprise Thunder still does its 30 when the first coin is tails', () => {
  // The half most likely to be got wrong: a tails must spare the BENCH, not the
  // attack. Scripting it as FLIP_OR_NOTHING would silently drop the 30.
  const E = board('base5-83', [], 'base1-3');           // Dark Raichu vs Chansey
  const you = E.state.players[1];
  you.bench = [E.mkSlot({ id: 'base1-3', uid: E.uid++ })];
  you.bench[0].playedTurn = 0;
  attach(E, E.state.players[0].active, 'base1-100', 3);
  E.flip = () => false;
  E.act(0, { t: 'attack', idx: 0 });
  eq(you.active.dmg, 30, 'the Active still took the printed 30');
  eq(you.bench[0].dmg, 0, 'and the Bench was spared');
  return true;
});

T('...and the SECOND coin picks 20 or 10', () => {
  const mk = heads => {
    const E = board('base5-83', [], 'base1-3');
    E.state.players[1].bench = [E.mkSlot({ id: 'base1-3', uid: E.uid++ })];
    E.state.players[1].bench[0].playedTurn = 0;
    attach(E, E.state.players[0].active, 'base1-100', 3);
    let n = 0;
    E.flip = () => { n++; return n === 1 ? true : heads; };   // first always heads
    E.act(0, { t: 'attack', idx: 0 });
    return E.state.players[1].bench[0].dmg;
  };
  eq(mk(true), 20, 'second heads is the big one');
  eq(mk(false), 10, 'second tails is the small one');
  return true;
});

// ------------------------------- An empty board loses, however it got empty
// The Vanish test above found this and it is NOT a Team Rocket bug. Three
// separate no-Pokemon checks existed and every one was local to the path that
// could cause it, so a route added later was never covered. Pidgeot's Hurricane
// has had the same hole since Base Set.
//
// settleEmptyBoard() runs after every action instead. These two assert it from
// the OLD card as well as the new one, because a fix that only covers the case
// that found it is the same mistake one layer up.
console.log('\nAn empty board loses');

T('Hurricane bouncing their LAST Pokemon ends the game — a Base Set bug', () => {
  const E = board('base2-8', [], 'base1-58');           // Pidgeot vs a lone Pikachu
  const me = E.state.players[0], you = E.state.players[1];
  you.bench = [];
  attach(E, me.active, 'base1-99', 3);                  // GCC for Hurricane
  eq(E.state.winner, null, 'nobody has won yet');
  E.act(0, { t: 'attack', idx: 1 });
  eq(you.active, null, 'Pikachu went back to hand rather than being Knocked Out');
  eq(E.state.winner, 0, 'and the game is over');
  return true;
});

T('...and a board that still has a Bench carries on normally', () => {
  // The half that stops the fix being a blunt instrument: emptying the ACTIVE
  // spot is not the same as emptying the board, and a promote is owed instead.
  const E = board('base2-8', [], 'base1-58');
  const you = E.state.players[1];
  you.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  you.bench[0].playedTurn = 0;
  attach(E, E.state.players[0].active, 'base1-99', 3);
  E.act(0, { t: 'attack', idx: 1 });
  eq(E.state.winner, null, 'the game continues');
  eq(E.state.pendingPromote, 1, 'and they owe a promotion');
  return true;
});

// -------------------------------------- Before the damage, and after it
// Drag Off and Lure look like the same card and are opposites. The assertion
// that separates them is WHO TOOK THE DAMAGE, and it is the only one that can:
// both end the turn with a different Pokemon Active.
console.log('\nDrag Off, Energy Bomb, Magnetic Lines, Flame Pillar');

// FIXTURE DEATH IS THE RECURRING FAILURE IN THIS FILE, three times now, and it
// is a Team Rocket problem specifically: the Dark cards hit harder than anything
// the Base Set fixtures were chosen against, and half of them are Fighting types
// against Colorless and Lightning subjects that are WEAK to Fighting. A 20 that
// doubles to 40 kills a Pikachu exactly.
//
// The subject then leaves the board and the next assertion reads null, which
// reports as a crash rather than as the mundane thing it is. Pick a subject that
// survives, or use the damage ledger above. Do not read a slot after an attack
// without knowing it lived.
T('Drag Off hits the Pokemon it dragged UP, not the one that was there', () => {
  // Pikachu Active (takes nothing), Chansey benched and dragged into the 20 —
  // doubled to 40 by its Fighting weakness, which 120 HP absorbs.
  const E = board('base5-40', [], 'base1-58');          // Dark Machoke vs Pikachu
  const me = E.state.players[0], you = E.state.players[1];
  you.bench = [E.mkSlot({ id: 'base1-3', uid: E.uid++ })];    // Chansey behind it
  you.bench[0].playedTurn = 0;
  attach(E, me.active, 'base1-97', 3);                  // FFC
  const pikachu = you.active;
  eq(E.act(0, { t: 'attack', idx: 0, opts: { bench: 0 } }).ok, true, 'attack resolved');
  eq(E.nameOf(you.active), 'Chansey', 'Chansey was dragged up');
  if (!(you.active.dmg > 0)) throw new Error('the dragged Pokemon took nothing');
  eq(pikachu.dmg, 0, 'and Pikachu, who was there first, took NOTHING');
  return true;
});

T('...and Knock Back is the opposite order, as Lure always was', () => {
  // Same card, other attack. Damage lands on who was there, THEN they choose.
  const E = board('base5-40', [], 'base1-3');
  const you = E.state.players[1];
  you.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  you.bench[0].playedTurn = 0;
  const chansey = you.active;
  attach(E, E.state.players[0].active, 'base1-97', 3);
  E.act(0, { t: 'attack', idx: 1 });
  // 60, not 30: Chansey is Colorless and WEAK TO FIGHTING, so Dark Machoke
  // doubles it. Expecting the printed number here was my error, not the card's.
  eq(chansey.dmg, 60, 'Chansey took the hit before anyone moved');
  return true;
});

T('Energy Bomb spreads onto the Bench and empties the attacker', () => {
  const E = board('base5-34', ['base1-58', 'base1-58'], 'base1-3');   // Dark Electrode
  const me = E.state.players[0];
  attach(E, me.active, 'base1-100', 4);                 // four Lightning
  E.act(0, { t: 'attack', idx: 1 });
  eq(me.active.energy.length, 0, 'the attacker kept none');
  eq(me.bench[0].energy.length + me.bench[1].energy.length, 4, 'all four landed on the Bench');
  return true;
});

T('...and BURNS it all when there is no Bench, as the card says', () => {
  const E = board('base5-34', [], 'base1-3');
  const me = E.state.players[0];
  attach(E, me.active, 'base1-100', 4);
  const was = me.discard.length;
  E.act(0, { t: 'attack', idx: 1 });
  eq(me.active.energy.length, 0, 'gone from the attacker');
  eq(me.discard.length, was + 4, 'and into the discard, not nowhere');
  return true;
});

T('Magnetic Lines moves a BASIC Energy and refuses a special one', () => {
  const E = board('base5-11', [], 'base1-3');           // Dark Magneton
  const me = E.state.players[0], you = E.state.players[1];
  you.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  you.bench[0].playedTurn = 0;
  attach(E, me.active, 'base1-100', 2);
  attach(E, you.active, 'base1-96', 1);                 // Double Colorless — SPECIAL
  E.act(0, { t: 'attack', idx: 1 });
  eq(you.active.energy.length, 1, 'the Double Colorless stayed put');
  eq(you.bench[0].energy.length, 0, 'and nothing reached the Bench');

  const E2 = board('base5-11', [], 'base1-3');
  const me2 = E2.state.players[0], you2 = E2.state.players[1];
  you2.bench = [E2.mkSlot({ id: 'base1-58', uid: E2.uid++ })];
  you2.bench[0].playedTurn = 0;
  attach(E2, me2.active, 'base1-100', 2);
  attach(E2, you2.active, 'base1-100', 1);              // a basic one
  E2.act(0, { t: 'attack', idx: 1 });
  eq(you2.active.energy.length, 0, 'the basic Energy left the Active');
  eq(you2.bench[0].energy.length, 1, 'and landed on their Bench');
  return true;
});

T('Flame Pillar snipes when it burns, and declining keeps the Energy', () => {
  const mk = opts => {
    const E = board('base5-44', [], 'base1-3');         // Dark Rapidash
    const me = E.state.players[0], you = E.state.players[1];
    you.bench = [E.mkSlot({ id: 'base1-3', uid: E.uid++ })];
    you.bench[0].playedTurn = 0;
    attach(E, me.active, 'base1-98', 3);                // three Fire
    E.act(0, { t: 'attack', idx: 1, opts });
    return { me, you };
  };
  const took = mk({});
  eq(took.me.active.energy.length, 2, 'one Fire burned');
  eq(took.you.bench[0].dmg, 10, 'and the Bench took 10');

  const kept = mk({ costUids: [] });
  eq(kept.me.active.energy.length, 3, 'declining keeps all three');
  eq(kept.you.bench[0].dmg, 0, 'and the Bench is untouched');
  return true;
});

T('...and it does not burn an Energy for a snipe it cannot make', () => {
  // "If you do AND if your opponent has any Benched Pokemon" — with no Bench
  // the discard buys nothing, so it must not be taken.
  const E = board('base5-44', [], 'base1-3');
  const me = E.state.players[0];
  E.state.players[1].bench = [];
  attach(E, me.active, 'base1-98', 3);
  E.act(0, { t: 'attack', idx: 1 });
  eq(me.active.energy.length, 3, 'nothing was burned for nothing');
  return true;
});

// ------------------------------------------------- Stare, and Mirror Shell
console.log('\nStare and Mirror Shell');

// Muk opposite, so the suppression has something visible to switch off.
function arbokBoard(oppActive, oppBench) {
  const E = board('base5-2', [], oppActive);
  const you = E.state.players[1];
  you.bench = (oppBench || []).map(id => {
    const sl = E.mkSlot({ id, uid: E.uid++ }); sl.playedTurn = 0; return sl;
  });
  attach(E, E.state.players[0].active, 'base1-99', 2);   // GG
  return E;
}

T('Stare hits a chosen target and switches its Power off', () => {
  const E = arbokBoard('base1-58', ['base3-13']);        // Muk on their Bench
  const you = E.state.players[1];
  const muk = you.bench[0];
  eq(E.powerUsable(muk), true, 'Toxic Gas is on to start with');
  E.act(0, { t: 'attack', idx: 0, opts: { bench: 1 } });  // index 1 = first bench
  eq(muk.dmg, 10, 'the Bench target took the 10');
  eq(E.powerUsable(muk), false, 'and its Power is off');
  return true;
});

T('...and Staring a Muk turns everyone ELSE\'s Powers back on', () => {
  // The interaction that falls out of asking the targeted mark BEFORE the Toxic
  // Gas exemption. Muk exempts itself from its own suppression; it does not get
  // to exempt itself from an attack that named it.
  const E = arbokBoard('base1-58', ['base3-13']);
  const me = E.state.players[0], you = E.state.players[1];
  const muk = you.bench[0];
  // Give our own side a Power to watch: Alakazam's Damage Swap.
  me.bench = [E.mkSlot({ id: 'base1-1', uid: E.uid++ })];
  me.bench[0].playedTurn = 0;
  eq(E.powerUsable(me.bench[0]), false, 'Toxic Gas has ours switched off');
  E.act(0, { t: 'attack', idx: 0, opts: { bench: 1 } });
  eq(E.powerUsable(muk), false, 'Muk itself is suppressed');
  eq(E.powerUsable(me.bench[0]), true, 'so OUR Power came back on');
  return true;
});

T('a protected target takes nothing AND keeps its Power', () => {
  // Protection is asked per target because a snipe reaches the Bench, where the
  // defender's own `blocked` says nothing at all.
  const E = arbokBoard('base1-58', ['base3-13']);
  const muk = E.state.players[1].bench[0];
  muk.effects.push({ kind: 'PREVENT_ALL_EFFECTS', expireAtStartOfTurn: E.state.turn + 2 });
  E.act(0, { t: 'attack', idx: 0, opts: { bench: 1 } });
  eq(muk.dmg, 0, 'no damage got through');
  // NOT powerUsable — a Barrier switches the slot's OWN Power off by itself, so
  // that would read false whether Stare marked it or not. The assertion has to
  // be that no mark was ADDED, which is the thing under test.
  eq(muk.effects.some(e => e.kind === 'POWER_OFF'), false, 'and Stare left no mark');
  return true;
});

T('Poison Vapor splashes THEIR bench only', () => {
  const E = arbokBoard('base1-3', ['base1-3']);
  const me = E.state.players[0], you = E.state.players[1];
  me.bench = [E.mkSlot({ id: 'base1-3', uid: E.uid++ })];
  me.bench[0].playedTurn = 0;
  attach(E, me.active, 'base1-99', 1);                   // GGG total
  E.act(0, { t: 'attack', idx: 1 });
  eq(you.active.status.poisoned, true, 'the defender is Poisoned');
  eq(you.bench[0].dmg, 10, 'their Bench took 10');
  eq(me.bench[0].dmg, 0, 'and OURS took nothing');
  return true;
});

T('Mirror Shell answers a hit for the same amount', () => {
  const E = board('base5-46', [], 'base1-3');            // Dark Wartortle vs Chansey
  const me = E.state.players[0], you = E.state.players[1];
  attach(E, me.active, 'base1-102', 2);                  // WC
  E.act(0, { t: 'attack', idx: 1 });                     // raise the shell
  eq(me.active.effects.some(e => e.kind === 'MIRROR_SHELL'), true, 'shell is up');
  // Now they hit it for 40.
  E.dealDamage(you.active, me.active, 40, {});
  eq(me.active.dmg, 40, 'Wartortle took the 40');
  eq(you.active.dmg, 40, 'and answered for exactly 40');
  return true;
});

T('...and answers even when the hit Knocks it Out', () => {
  // "even if Dark Wartortle is Knocked Out" — the reason this hangs off
  // dealDamage beside retaliate rather than off checkKOs.
  const E = board('base5-46', ['base1-58'], 'base1-3');
  const me = E.state.players[0], you = E.state.players[1];
  attach(E, me.active, 'base1-102', 2);
  E.act(0, { t: 'attack', idx: 1 });
  const wartortle = me.active;
  E.dealDamage(you.active, wartortle, 60, {});           // lethal: 60 HP
  eq(you.active.dmg, 60, 'the answer went out anyway');
  E.checkKOs();
  eq(me.active, null, 'and Wartortle really did die');
  return true;
});

T('...and two shells do not answer each other forever', () => {
  const E = board('base5-46', [], 'base5-46');
  const me = E.state.players[0], you = E.state.players[1];
  me.active.effects.push({ kind: 'MIRROR_SHELL', expireAtStartOfTurn: E.state.turn + 2 });
  you.active.effects.push({ kind: 'MIRROR_SHELL', expireAtStartOfTurn: E.state.turn + 2 });
  E.dealDamage(you.active, me.active, 20, {});
  eq(me.active.dmg, 20, 'the first hit landed');
  eq(you.active.dmg, 20, 'the answer landed');
  return true;                                            // and it terminated
});

// -------------------------------------------------------------- Draws
// Before 18 Aug 2026 a simultaneous finish was resolved by array order: the
// Knock Out loop checked win conditions inside itself and returned on the first
// one, and it always looked at seat 0 first, so SEAT 1 WON EVERY TIE — with its
// own Pokemon still standing, because its Knock Out was never processed.
//
// Every Knock Out now resolves before anybody wins. These assert the draw AND
// the ordinary outcomes, because a draw-only test would pass on a build that
// declared everything a draw.
console.log('\nDraws');

// Two lone Actives, one Prize each, both about to die.
// NAMED FOR ITS SECTION, and that is not fussiness: this file is one flat scope
// of ~3,000 lines and it already had an `drawBoard()` five hundred lines up. My
// first version reused the name, function hoisting silently replaced theirs, and
// four unrelated AI tests started reporting NaN. A helper in here needs a name
// nothing else would reach for.
function drawBoard(dmg0, dmg1, prizes0, prizes1) {
  const E = board('base1-58', [], 'base1-58');
  const p = E.state.players[0], o = E.state.players[1];
  p.bench = []; o.bench = [];
  const prize = () => ({ id: 'base1-99', uid: E.uid++ });
  p.prizes = Array.from({ length: prizes0 }, prize);
  o.prizes = Array.from({ length: prizes1 }, prize);
  p.active.dmg = dmg0; o.active.dmg = dmg1;
  E.checkKOs();
  return E;
}

T('both sides finishing at once is a DRAW, not seat 1 winning', () => {
  const E = drawBoard(999, 999, 1, 1);
  eq(E.state.winner, 'draw', 'the result is a draw');
  eq(E.state.players[0].active, null, 'and BOTH Knock Outs were processed');
  eq(E.state.players[1].active, null, '...including the one the old loop skipped');
  return true;
});

T('...and an ordinary win is still an ordinary win, from either seat', () => {
  // The half a draw-only test cannot see. Seat 0 takes its last Prize alone.
  const a = drawBoard(0, 999, 1, 6);
  eq(a.state.winner, 0, 'seat 0 wins when only seat 0 finishes');
  const b = drawBoard(999, 0, 6, 1);
  eq(b.state.winner, 1, 'and seat 1 wins when only seat 1 does');
  return true;
});

T('a game with both sides alive is still in progress', () => {
  const E = drawBoard(0, 0, 3, 3);
  eq(E.state.winner, null, 'null still means keep playing');
  return true;
});

T('running out of Pokemon on both sides at once is also a draw', () => {
  // The other win condition, and it must reach the same place. Six Prizes each,
  // so nobody is winning on Prizes — this is purely an empty-board double loss.
  const E = drawBoard(999, 999, 6, 6);
  eq(E.state.winner, 'draw', 'both boards emptied together');
  return true;
});

T('a draw is not null, because null means the game is still running', () => {
  // The trap this whole change turns on. Every loop in the project — the AI
  // harnesses, the UI, selftest — tests `winner === null` to mean in-progress.
  // A draw stored as null would loop forever.
  const E = drawBoard(999, 999, 1, 1);
  if (E.state.winner === null) throw new Error('a draw must never be null');
  eq(E.state.phase, 'over', 'and the game really is over');
  return true;
});

T('every Knock Out resolves before anybody counts Prizes', () => {
  // A Selfdestruct-shaped board: three Benched Pokemon die at once. The old
  // loop took ONE per pass and checked the win condition between each, so a
  // Prize could run out with corpses still on the board.
  const E = board('base1-58', ['base1-58', 'base1-58', 'base1-58'], 'base1-58');
  const p = E.state.players[0];
  p.bench.forEach(b => { b.dmg = 999; });
  E.checkKOs();
  eq(p.bench.length, 0, 'all three left together');
  return true;
});

// --------------------------------------------------- pickUid is validated ---
// A restricted deck search computes an `eligible` list and then looked the
// requested card up in the WHOLE zone, so any uid in the deck was reachable:
// Energy Search fetched a Charizard. The UI only ever offers legal cards, so it
// was never reachable by clicking — which is exactly why nothing caught it. The
// engine does not get to trust its caller. See Rulings/ENERGY-SEARCH.md.
function askEnergySearch(targetId) {
  const E = new Engine(CARD_DB, EFFECTS, { seed: 3 });
  const deck = { name: 'a', list: [[4, 'base3-59'], [4, 'base1-96'], [4, 'base1-4'],
                                   [4, 'base1-46'], [4, 'base1-24'], [40, 'base1-98']] };
  E.newGame(deck, deck, ['A', 'B']);   // BOTH seats — `active` may be either
  E.setupAuto(0); E.setupConfirm(0); E.setupAuto(1); E.setupConfirm(1);
  const pi = E.state.active, p = E.state.players[pi];
  p.hand.push({ uid: 9990, id: 'base3-59' });
  const want = p.deck.find(x => x.id === targetId);
  if (!want) throw new Error('target not in deck: ' + targetId);
  E.act(pi, { t: 'playTrainer', hand: p.hand.length - 1, opts: { pickUid: want.uid } });
  const got = p.hand.find(x => x.uid === want.uid);
  return got ? CARD_DB[got.id].name : null;
}
T('Energy Search refuses a Pokemon asked for by uid', () => {
  eq(askEnergySearch('base1-4'), null, 'Charizard was not fetched');
  return true;
});
T('Energy Search refuses a Special Energy asked for by uid', () => {
  // Double Colorless is Energy but NOT basic. The GBC game allowed it; we
  // deliberately do not, because clear printed text beats the arbiter.
  eq(askEnergySearch('base1-96'), null, 'Double Colorless was not fetched');
  return true;
});
T('Energy Search still finds a basic Energy asked for by uid', () => {
  eq(askEnergySearch('base1-98'), 'Fire Energy', 'a legal request still works');
  return true;
});


// ============================================================================
// Job 10c — the triggered Powers
//
// These are the first Powers nobody clicks, which makes them the first Powers
// that can be completely wrong while every other suite stays green: a trigger
// that never fires looks exactly like a card with no Power, and a trigger that
// fires from the wrong doorway looks like a rules bug in something else.
//
// So more than half of what is below asserts that a trigger DOES NOT fire.
// ============================================================================
console.log('\nJob 10c — triggered Powers');

// A board where player 0 can actually play cards from hand.
function handBoard(activeId, oppActiveId = 'base1-58') {
  const E = board(activeId, [], oppActiveId);
  E.state.players[0].hand = [];
  E.state.players[0].deck = [];
  E.state.players[0].discard = [];
  // canEvolve refuses while turnsTaken <= 1, and board() has never needed to set
  // it because no earlier Power test evolves anything. Every ON_PLAY case here
  // does, so the whole section silently failed to evolve until this line existed.
  E.state.players[0].turnsTaken = 5;
  E.state.players[1].turnsTaken = 5;
  return E;
}
const give = (E, pi, id) => {
  const inst = { id, uid: E.uid++ };
  E.state.players[pi].hand.push(inst);
  return inst;
};
const intoDeck = (E, pi, id, n = 1) => {
  const out = [];
  for (let i = 0; i < n; i++) { const x = { id, uid: E.uid++ }; E.state.players[pi].deck.push(x); out.push(x); }
  return out;
};

// ---------------------------------------------------------- Sneak Attack ----
// Dark Golbat (base5-7), Stage 1 on Zubat. "When you play Dark Golbat from your
// hand, you may choose 1 of your opponent's Pokemon. If you do, Dark Golbat does
// 10 damage to that Pokemon. Apply Weakness and Resistance."
console.log('Dark Golbat — Sneak Attack (ON_PLAY)');

function golbatBoard(oppActiveId = 'base1-58') {
  const E = handBoard('base5-70', oppActiveId);          // Zubat, Active
  return E;
}

T('evolving into Dark Golbat from hand fires Sneak Attack', () => {
  const E = golbatBoard();
  const g = give(E, 0, 'base5-7');
  const target = E.state.players[1].active;
  E.act(0, { t: 'evolve', hand: E.state.players[0].hand.indexOf(g),
             target: E.state.players[0].active.uid,
             opts: { trigTargetUid: target.uid } });
  eq(top(E, E.state.players[0].active).name, 'Dark Golbat', 'the evolution happened');
  eq(target.dmg, 10, 'and Sneak Attack landed on the chosen target');
  return true;
});

T('...and it can choose a BENCHED Pokemon, not only the Active', () => {
  const E = golbatBoard();
  const o = E.state.players[1];
  o.bench = [E.mkSlot({ id: 'base1-58', uid: E.uid++ })];
  const g = give(E, 0, 'base5-7');
  E.act(0, { t: 'evolve', hand: 0, target: E.state.players[0].active.uid,
             opts: { trigTargetUid: o.bench[0].uid } });
  eq(o.bench[0].dmg, 10, 'the Benched Pokemon took it');
  eq(o.active.dmg, 0, 'and the Active did not');
  return true;
});

T('...and Weakness DOUBLES it, which almost no other snipe does', () => {
  // Dark Golbat is Grass. Poliwag (base1-59) is Water, Weakness Grass. The first
  // draft of this used Machop, which is Weak to PSYCHIC — the test failed for the
  // right reason and the card was fine.
  const E = golbatBoard('base1-59');
  const g = give(E, 0, 'base5-7');
  E.act(0, { t: 'evolve', hand: 0, target: E.state.players[0].active.uid,
             opts: { trigTargetUid: E.state.players[1].active.uid } });
  eq(E.state.players[1].active.dmg, 20, '10 into a Grass Weakness is 20');
  return true;
});

T('...and "you may" means trigTargetUid: null really declines', () => {
  const E = golbatBoard();
  const target = E.state.players[1].active;
  give(E, 0, 'base5-7');
  E.act(0, { t: 'evolve', hand: 0, target: E.state.players[0].active.uid,
             opts: { trigTargetUid: null } });
  eq(top(E, E.state.players[0].active).name, 'Dark Golbat', 'it still evolved');
  eq(target.dmg, 0, 'and nothing was damaged');
  return true;
});

T('...and supplying NO choice at all still takes the shot, at their Active', () => {
  // The house convention: absent means take it. This is what the AI and every
  // older caller rely on, and it is why declining has to be an explicit null.
  const E = golbatBoard();
  give(E, 0, 'base5-7');
  E.act(0, { t: 'evolve', hand: 0, target: E.state.players[0].active.uid });
  eq(E.state.players[1].active.dmg, 10, 'the fallback fired at their Active');
  return true;
});

T('Sneak Attack does NOT provoke Strikes Back — a Power is not an attack', () => {
  // Machamp (base1-8) answers "whenever an opponent's ATTACK damages" it.
  const E = golbatBoard('base1-8');
  give(E, 0, 'base5-7');
  E.act(0, { t: 'evolve', hand: 0, target: E.state.players[0].active.uid,
             opts: { trigTargetUid: E.state.players[1].active.uid } });
  eq(E.state.players[1].active.dmg, 10, 'Machamp took the 10');
  eq(E.state.players[0].active.dmg, 0, 'and Dark Golbat took nothing back');
  return true;
});

T('a Muk on the board switches Sneak Attack off entirely', () => {
  const E = golbatBoard();
  E.state.players[1].bench = [E.mkSlot({ id: 'base3-13', uid: E.uid++ })];   // Muk
  give(E, 0, 'base5-7');
  E.act(0, { t: 'evolve', hand: 0, target: E.state.players[0].active.uid,
             opts: { trigTargetUid: E.state.players[1].active.uid } });
  eq(top(E, E.state.players[0].active).name, 'Dark Golbat', 'it still evolved');
  eq(E.state.players[1].active.dmg, 0, 'but no damage — Toxic Gas');
  return true;
});

// ------------------------------------------------------ the doorway rule ----
// The half of ON_PLAY that is easiest to get wrong, because getting it wrong
// looks like the card working.
console.log('ON_PLAY fires from hand and from nowhere else');

T('a Pokemon placed during SETUP does not fire its Power', () => {
  const E = new Engine(CARD_DB, EFFECTS, { seed: 3 });
  E.newGame(DECKS.Brushfire, DECKS.Zap, ['A', 'B']);
  const p = E.state.players[0];
  // Dark Slowbro is a Stage 1 and cannot legally be set up, so use the Basic
  // that carries an ON_PLAY-shaped question: put a Dark Golbat in hand and try.
  // setupPlace refuses non-Basics, which is itself the assertion.
  p.hand.push({ id: 'base5-7', uid: E.uid++ });
  const r = E.act(0, { t: 'setupPlace', hand: p.hand.length - 1, where: 'active' });
  eq(r.ok, false, 'a Stage 1 cannot be placed during setup');
  return true;
});

T('SEARCH_BASIC_TO_BENCH pulls from the DECK, so no ON_PLAY fires', () => {
  // The generalisable version of the rule, tested with the machinery rather than
  // with a card that happens to have both properties. Dark Dragonite's Summon
  // Minions benches Basics from the deck; if one of THOSE had a Power it must
  // not fire, and the same doorway serves Call for Family.
  const E = handBoard('base5-70');
  const p = E.state.players[0];
  // Put a Basic with an ON_PLAY-carrying evolution behind it into the deck.
  intoDeck(E, 0, 'base1-58', 3);
  const before = p.bench.length;
  E.runPowerScript(0, p.active, [{ v: 'P_SEARCH_BENCH', n: 2, stage: 'Basic' }], null, null);
  eq(p.bench.length, before + 2, 'two Basics arrived from the deck');
  eq(p.bench.every(b => b.playedTurn === E.state.turn), true, 'and they were stamped as played');
  return true;
});

T('Pokemon Breeder IS from hand, so a Stage 2 Power fires on arrival', () => {
  // Breeder skips the Stage 1 entirely, and it is still playing the card from
  // your hand. Dark Dragonite onto a Dratini.
  const E = handBoard('base5-53');                    // Dratini, Active
  const p = E.state.players[0];
  intoDeck(E, 0, 'base1-58', 4);
  p.hand.push({ id: 'base5-5', uid: E.uid++ });       // Dark Dragonite
  p.hand.push({ id: 'base1-76', uid: E.uid++ });      // Pokemon Breeder
  const benchBefore = p.bench.length;
  E.act(0, { t: 'playTrainer', hand: p.hand.length - 1 });
  eq(top(E, p.active).name, 'Dark Dragonite', 'Breeder put it straight down');
  eq(p.bench.length, benchBefore + 2, 'and Summon Minions fetched two Basics');
  return true;
});

// ---------------------------------------------------------- Summon Minions ---
console.log('Dark Dragonite — Summon Minions (ON_PLAY)');

T('Summon Minions fetches exactly the two Basics it was told to', () => {
  const E = handBoard('base5-33');                    // Dark Dragonair, Active
  const p = E.state.players[0];
  // base5-70 is Zubat. The first draft asked for base1-58 and asserted it was
  // one — base1-58 is Pikachu, so the test failed while the card was correct.
  const zubats = intoDeck(E, 0, 'base5-70', 2);
  intoDeck(E, 0, 'base1-52', 2);                      // Machop, also legal
  p.hand.push({ id: 'base5-5', uid: E.uid++ });
  E.act(0, { t: 'evolve', hand: 0, target: p.active.uid,
             opts: { trigUids: zubats.map(z => z.uid) } });
  eq(p.bench.length, 2, 'two arrived');
  eq(p.bench.every(b => top(E, b).name === 'Zubat'), true, 'and they are the two asked for');
  return true;
});

T('...and a FULL Bench is not a failure, it just fetches nothing', () => {
  const E = handBoard('base5-33');
  const p = E.state.players[0];
  p.bench = Array.from({ length: 5 }, () => E.mkSlot({ id: 'base1-58', uid: E.uid++ }));
  intoDeck(E, 0, 'base1-58', 3);
  p.hand.push({ id: 'base5-5', uid: E.uid++ });
  const r = E.act(0, { t: 'evolve', hand: 0, target: p.active.uid });
  eq(r.ok, true, 'the evolution still succeeded');
  eq(p.bench.length, 5, 'and the Bench is unchanged');
  return true;
});

T('...and it fetches only ONE when only one is left in the deck', () => {
  const E = handBoard('base5-33');
  const p = E.state.players[0];
  intoDeck(E, 0, 'base1-58', 1);
  intoDeck(E, 0, 'base1-98', 5);                      // Energy — not a Basic Pokemon
  p.hand.push({ id: 'base5-5', uid: E.uid++ });
  E.act(0, { t: 'evolve', hand: 0, target: p.active.uid });
  eq(p.bench.length, 1, 'one arrived, not two, and nothing threw');
  return true;
});

// ---------------------------------------------------------------- Reel In ----
console.log('Dark Slowbro — Reel In (ON_PLAY)');

T('Reel In takes up to three Pokemon out of the discard and no Energy', () => {
  const E = handBoard('base5-67');                    // Slowpoke, Active
  const p = E.state.players[0];
  p.discard = [{ id: 'base1-98', uid: E.uid++ }, { id: 'base1-58', uid: E.uid++ },
               { id: 'base1-52', uid: E.uid++ }, { id: 'base1-99', uid: E.uid++ },
               { id: 'base1-4', uid: E.uid++ }];
  p.hand.push({ id: 'base5-12', uid: E.uid++ });
  E.act(0, { t: 'evolve', hand: 0, target: p.active.uid });
  const got = p.hand.map(x => CARD_DB[x.id]);
  eq(got.length, 3, 'three cards came back');
  eq(got.every(c => c.kind === 'pokemon'), true, 'and every one of them is a Pokemon');
  eq(p.discard.filter(x => CARD_DB[x.id].kind === 'energy').length, 2, 'the Energy stayed put');
  return true;
});

T('...and an empty discard pile is not a failure', () => {
  const E = handBoard('base5-67');
  const p = E.state.players[0];
  p.discard = [];
  p.hand.push({ id: 'base5-12', uid: E.uid++ });
  const r = E.act(0, { t: 'evolve', hand: 0, target: p.active.uid });
  eq(r.ok, true, 'it still evolved');
  eq(p.hand.length, 0, 'and took nothing');
  return true;
});

// -------------------------------------------------------------- Final Beam ---
// The one that has to fire in exactly the right place: the Energy it counts is
// one line away from being swept into the discard pile.
console.log('Dark Gyarados — Final Beam (ON_KO)');

// THE ATTACKER IS ZAPDOS, NOT CHARIZARD, and that is the whole reason this
// helper has a comment. The first draft used Charizard, which is Weak to Water —
// so every "20 per Water" assertion was silently measuring 40 per Water, and the
// separate Weakness case below could not have failed. Zapdos has no Weakness at
// all, so the plain cases measure the Power and the Weakness case measures
// Weakness. Two tests that cannot be confused with each other.
function beamBoard(waters = 4, attackerId = 'base1-16') {
  const E = board(attackerId, [], 'base5-8');
  const gy = E.state.players[1].active;
  attach(E, gy, 'base1-102', waters);
  attach(E, E.state.players[0].active, 'base1-98', 4);
  return E;
}

T('Final Beam answers the attack that Knocked it Out, 20 per Water', () => {
  const E = beamBoard(3);
  E.dev.forceFlip = 'H';
  const me = E.state.players[0].active;
  E.dealDamage(me, E.state.players[1].active, 200);
  E.checkKOs();
  eq(me.dmg, 60, '3 Water is 60 back into Zapdos');
  return true;
});

T('...and it counts Energy that is one line from the discard pile', () => {
  // The ordering assertion, stated as its own case: fire this from checkKOs
  // instead of from kill() and the count is always zero.
  const E = beamBoard(4);
  E.dev.forceFlip = 'H';
  const me = E.state.players[0].active;
  E.dealDamage(me, E.state.players[1].active, 200);
  E.checkKOs();
  eq(me.dmg, 80, '4 Water is 80, counted before the sweep');
  eq(E.state.players[1].discard.filter(x => CARD_DB[x.id].kind === 'energy').length, 4,
     'and the Energy still reached the discard pile afterwards');
  return true;
});

T('...tails does nothing at all', () => {
  const E = beamBoard(4);
  E.dev.forceFlip = 'T';
  const me = E.state.players[0].active;
  E.dealDamage(me, E.state.players[1].active, 200);
  E.checkKOs();
  eq(me.dmg, 0, 'the coin came up tails');
  return true;
});

T('...and no Water attached means no damage even on heads', () => {
  const E = beamBoard(0);
  E.dev.forceFlip = 'H';
  const me = E.state.players[0].active;
  E.dealDamage(me, E.state.players[1].active, 200);
  E.checkKOs();
  eq(me.dmg, 0, '20 times nothing is nothing');
  return true;
});

T('Final Beam does NOT answer damage from a Power', () => {
  // Trevor's call, 18 Aug 2026, from Pocket: only an attack counts. This is the
  // assertion that pins it — the same 200 damage, delivered by something that
  // is not an attack.
  const E = beamBoard(4);
  E.dev.forceFlip = 'H';
  const me = E.state.players[0].active;
  E.dealDamage(me, E.state.players[1].active, 200, { notAttack: true });
  E.checkKOs();
  eq(me.dmg, 0, 'a Power killed it, so nothing came back');
  return true;
});

T('...and does not answer Poison, which never touches dealDamage at all', () => {
  const E = beamBoard(4);
  E.dev.forceFlip = 'H';
  const gy = E.state.players[1].active;
  gy.status.poisoned = true;
  gy.dmg = top(E, gy).hp - 10;
  E.betweenTurns(0);
  E.checkKOs();
  eq(E.state.players[0].active.dmg, 0, 'Poison finished it and nothing answered');
  return true;
});

T('...and is switched off by Sleep, because the card says so', () => {
  // Final Beam PRINTS the status clause and the three ON_PLAY Powers do not,
  // which is the entire reason `always` exists. If this passes while the Sneak
  // Attack cases also pass, both halves of that flag are being read.
  const E = beamBoard(4);
  E.dev.forceFlip = 'H';
  const me = E.state.players[0].active;
  E.state.players[1].active.status.asleep = true;
  E.dealDamage(me, E.state.players[1].active, 200);
  E.checkKOs();
  eq(me.dmg, 0, 'an Asleep Gyarados fires nothing');
  return true;
});

T('...and Weakness applies to it, which the card says and its cousins do not', () => {
  // Dark Gyarados is Water. Base Set Charizard is Fire, Weakness Water — so
  // the SAME two Energy that do 40 to a Zapdos do 80 to a Charizard.
  eq(CARD_DB['base1-4'].wkType, 'W', 'Charizard is Weak to Water');
  const plain = beamBoard(2);
  plain.dev.forceFlip = 'H';
  plain.dealDamage(plain.state.players[0].active, plain.state.players[1].active, 200);
  plain.checkKOs();
  eq(plain.state.players[0].active.dmg, 40, '2 Water into a Zapdos is 40');

  const weak = beamBoard(2, 'base1-4');
  weak.dev.forceFlip = 'H';
  weak.dealDamage(weak.state.players[0].active, weak.state.players[1].active, 200);
  weak.checkKOs();
  eq(weak.state.players[0].active.dmg, 80, 'and into a Charizard it is 80');
  return true;
});

// ----------------------------------------------------------------- Sinkhole ---
console.log('Dark Dugtrio — Sinkhole (ON_OPP_RETREAT)');

function sinkBoard(dugtrios = 1) {
  const E = board('base1-58', ['base1-58'], 'base5-6');
  const o = E.state.players[1];
  for (let k = 1; k < dugtrios; k++) o.bench.push(E.mkSlot({ id: 'base5-6', uid: E.uid++ }));
  attach(E, E.state.players[0].active, 'base1-99', 4);
  return E;
}

T('retreating into a Sinkhole costs 20 on tails', () => {
  const E = sinkBoard();
  E.dev.forceFlip = 'T';
  const zubat = E.state.players[0].active;
  E.act(0, { t: 'retreat', bench: 0 });
  eq(E.state.players[0].bench.indexOf(zubat) >= 0, true, 'the retreat happened');
  eq(zubat.dmg, 20, 'and it took the toll on the way out');
  return true;
});

T('...and heads costs nothing', () => {
  const E = sinkBoard();
  E.dev.forceFlip = 'H';
  const zubat = E.state.players[0].active;
  E.act(0, { t: 'retreat', bench: 0 });
  eq(zubat.dmg, 0, 'the coin saved it');
  return true;
});

T('...and the damage lands on the Pokemon that LEFT, not the one that came up', () => {
  const E = sinkBoard();
  E.dev.forceFlip = 'T';
  const leaving = E.state.players[0].active, arriving = E.state.players[0].bench[0];
  E.act(0, { t: 'retreat', bench: 0 });
  eq(leaving.dmg, 20, 'the retreater took it');
  eq(arriving.dmg, 0, 'the new Active did not');
  return true;
});

T('...and TWO Dark Dugtrios each take their own flip', () => {
  const E = sinkBoard(2);
  E.dev.forceFlip = 'T';
  const zubat = E.state.players[0].active;
  E.act(0, { t: 'retreat', bench: 0 });
  eq(zubat.dmg, 40, 'two Powers, two coins, two tolls');
  return true;
});

T('a FAILED Confused retreat pays the Energy and pays no toll', () => {
  // The card says "retreats". Neo 4 prints a card that says "TRIES to retreat",
  // which is a distinction nobody draws unless the plain wording means the
  // successful one. See RULINGS.md.
  const E = sinkBoard();
  const zubat = E.state.players[0].active;
  zubat.status.confused = true;
  E.dev.forceFlip = 'T';                              // fails the Confusion flip
  E.act(0, { t: 'retreat', bench: 0 });
  eq(E.state.players[0].active, zubat, 'the retreat failed and it is still Active');
  eq(zubat.energy.length < 4, true, 'the Energy was still paid');
  eq(zubat.dmg, 0, 'and Sinkhole never fired');
  return true;
});

T('a Sinkhole on a PARALYZED Dugtrio does not fire', () => {
  const E = sinkBoard();
  E.dev.forceFlip = 'T';
  E.state.players[1].active.status.paralyzed = true;
  const zubat = E.state.players[0].active;
  E.act(0, { t: 'retreat', bench: 0 });
  eq(zubat.dmg, 0, 'the card prints the status clause and it is being read');
  return true;
});

T('Switch does not trigger Sinkhole, because switching is not retreating', () => {
  const E = sinkBoard();
  E.dev.forceFlip = 'T';
  const p = E.state.players[0], zubat = p.active;
  p.hand.push({ id: 'base1-95', uid: E.uid++ });      // Switch
  E.act(0, { t: 'playTrainer', hand: p.hand.length - 1 });
  eq(p.active === zubat, false, 'the switch happened');
  eq(zubat.dmg, 0, 'and no toll was taken');
  return true;
});


// ============================================================================
// Job 10c widened — the ordinary Powers
// ============================================================================
console.log('\nJob 10c widened — the ordinary Powers');

// -------------------------------------------------------------- Hay Fever ----
console.log('Dark Vileplume — Hay Fever (NO_TRAINERS)');

T('Hay Fever stops the OPPONENT playing a Trainer', () => {
  const E = board('base1-58', [], 'base5-13');
  const p = E.state.players[0];
  p.hand.push({ id: 'base1-91', uid: E.uid++ });     // Bill — unconditionally legal
  const r = E.act(0, { t: 'playTrainer', hand: p.hand.length - 1 });
  eq(r.ok, false, 'refused');
  return true;
});

T('...and stops ITS OWN CONTROLLER too, which is the half that surprises', () => {
  // "No Trainer cards can be played" names no owner. Same as Aerodactyl.
  const E = board('base5-13', [], 'base1-58');
  const p = E.state.players[0];
  p.hand.push({ id: 'base1-91', uid: E.uid++ });
  eq(E.act(0, { t: 'playTrainer', hand: p.hand.length - 1 }).ok, false, 'own Trainer refused too');
  return true;
});

T('...and it works from the BENCH, like every Power that does not say otherwise', () => {
  const E = board('base1-58', ['base5-13'], 'base1-58');
  const p = E.state.players[0];
  p.hand.push({ id: 'base1-91', uid: E.uid++ });
  eq(E.act(0, { t: 'playTrainer', hand: p.hand.length - 1 }).ok, false, 'refused from the Bench');
  return true;
});

T('...and a SLEEPING Vileplume lets the Trainers through again', () => {
  const E = board('base1-58', [], 'base5-13');
  E.state.players[1].active.status.asleep = true;
  const p = E.state.players[0];
  p.hand.push({ id: 'base1-91', uid: E.uid++ });
  eq(E.act(0, { t: 'playTrainer', hand: p.hand.length - 1 }).ok, true, 'the card prints the clause');
  return true;
});

T('...and a Muk switches Hay Fever off, so Trainers work', () => {
  const E = board('base3-13', [], 'base5-13');       // my Muk vs their Vileplume
  const p = E.state.players[0];
  p.hand.push({ id: 'base1-91', uid: E.uid++ });
  eq(E.act(0, { t: 'playTrainer', hand: p.hand.length - 1 }).ok, true, 'Toxic Gas beats Hay Fever');
  return true;
});

// ------------------------------------------------------------- Sticky Goo ----
console.log('Dark Muk — Sticky Goo (RETREAT_TAX)');

T('Sticky Goo adds CC to the opponent\'s retreat', () => {
  const E = board('base1-58', ['base1-58'], 'base5-41');
  const base = CARD_DB['base1-58'].retreat;
  eq(E.retreatCostOf(E.state.players[0].active), base + 2, 'two more to retreat');
  return true;
});

T('...and does NOTHING from the Bench, unlike every other Power in the set', () => {
  const E = board('base1-58', ['base1-58'], 'base1-58');
  E.state.players[1].bench = [E.mkSlot({ id: 'base5-41', uid: E.uid++ })];
  eq(E.retreatCostOf(E.state.players[0].active), CARD_DB['base1-58'].retreat,
     '"as long as Dark Muk is your ACTIVE Pokemon"');
  return true;
});

T('...and Retreat Aid still cancels against it', () => {
  // The two are computed in one place on purpose, so they net out rather than
  // one winning. Dodrio (base2-34) discounts by 1 from the bench.
  const E = board('base1-58', ['base2-34'], 'base5-41');
  eq(E.retreatCostOf(E.state.players[0].active), CARD_DB['base1-58'].retreat + 2 - 1,
     '+2 from the Goo, -1 from the Aid');
  return true;
});

// ----------------------------------------------------------------- Frenzy ----
console.log('Dark Primeape — Frenzy (CONFUSED_BONUS)');

T('Frenzy adds 30 to an attack made while Confused', () => {
  const E = board('base5-43', [], 'base1-58');
  const atk = E.state.players[0].active, def = E.state.players[1].active;
  attach(E, atk, 'base1-97', 2);
  atk.status.confused = true;
  E.dev.forceFlip = 'H';                              // pass the Confusion check
  E.act(0, { t: 'attack', idx: 0 });
  // Frenzied Attack is 40 printed and Pikachu is Weak to Fighting.
  //
  // 110, NOT 140, AND THE DIFFERENCE IS AN ENGINE CONVENTION worth knowing
  // before anybody "fixes" it: Frenzy sits in computeDamage's flat-bonus loop
  // alongside PlusPower and Defender, which runs AFTER Weakness. So the sum is
  // (40 x 2) + 30 rather than (40 + 30) x 2. That convention predates this card
  // by two sets and every PlusPower interaction in the game rests on it —
  // changing it here would silently change those.
  //
  // CONFIRMED AGAINST THE GAME BOY GAME by Trevor, 19 Aug 2026: bonuses stack on
  // the doubled number. This assertion is the pin. See ENGINE.md.
  eq(def.dmg, 110, '40 printed, doubled to 80, then +30 from Frenzy');
  return true;
});

T('...and does NOTHING while it is not Confused', () => {
  const E = board('base5-43', [], 'base1-58');
  const atk = E.state.players[0].active, def = E.state.players[1].active;
  attach(E, atk, 'base1-97', 2);
  E.act(0, { t: 'attack', idx: 0 });
  eq(def.dmg, 80, 'just the printed 40, doubled');
  return true;
});

T('"even to itself" — a FAILED Confused attack costs 60, not 30', () => {
  // The whole of Rulings/FRENZY-SELF-DAMAGE.md, as one number. The Confusion
  // penalty never goes through computeDamage, so this is a second consultation
  // and it is the one that would be silently missed.
  const E = board('base5-43', [], 'base1-58');
  const atk = E.state.players[0].active;
  attach(E, atk, 'base1-97', 2);
  atk.status.confused = true;
  E.dev.forceFlip = 'T';                              // fail the Confusion check
  E.act(0, { t: 'attack', idx: 0 });
  eq(atk.dmg, 60, '30 from Confusion plus 30 from Frenzy');
  return true;
});

T('...and an ordinary Confused Pokemon still takes only 30', () => {
  // The control. Without it the case above proves nothing about Frenzy.
  const E = board('base1-58', [], 'base1-58');
  const atk = E.state.players[0].active;
  attach(E, atk, 'base1-100', 2);
  atk.status.confused = true;
  E.dev.forceFlip = 'T';
  E.act(0, { t: 'attack', idx: 0 });
  eq(atk.dmg, 30, 'no Frenzy, no bonus');
  return true;
});

// ------------------------------------------------- the four interactive ones --
console.log('Evolutionary Light, Pollen Stench, Matter Exchange, Trickery');

T('Evolutionary Light pulls a named Evolution card into hand', () => {
  const E = board('base5-33', [], 'base1-58');
  const p = E.state.players[0];
  p.deck = [{ id: 'base1-98', uid: E.uid++ }, { id: 'base1-4', uid: E.uid++ }];
  const want = p.deck[1].uid;
  E.act(0, { t: 'power', uid: p.active.uid, kind: 'SEARCH_EVOLUTION_TO_HAND', pickUid: want });
  eq(p.hand.some(x => x.uid === want), true, 'Charizard is in hand');
  eq(p.deck.length, 1, 'and out of the deck');
  return true;
});

T('...and is once a turn', () => {
  const E = board('base5-33', [], 'base1-58');
  const p = E.state.players[0];
  p.deck = [{ id: 'base1-4', uid: E.uid++ }, { id: 'base1-18', uid: E.uid++ }];
  E.act(0, { t: 'power', uid: p.active.uid, kind: 'SEARCH_EVOLUTION_TO_HAND' });
  eq(E.act(0, { t: 'power', uid: p.active.uid, kind: 'SEARCH_EVOLUTION_TO_HAND' }).ok, false,
     'the second is refused');
  return true;
});

T('Pollen Stench confuses THEM on heads', () => {
  const E = board('base5-36', [], 'base1-58');
  E.dev.forceFlip = 'H';
  E.act(0, { t: 'power', uid: E.state.players[0].active.uid, kind: 'STATUS_COIN_EITHER_POWER' });
  eq(E.state.players[1].active.status.confused, true, 'the Defending Pokemon');
  eq(E.state.players[0].active.status.confused, false, 'and not us');
  return true;
});

T('...and confuses YOU on tails, which is the point of the card', () => {
  const E = board('base5-36', [], 'base1-58');
  E.dev.forceFlip = 'T';
  E.act(0, { t: 'power', uid: E.state.players[0].active.uid, kind: 'STATUS_COIN_EITHER_POWER' });
  eq(E.state.players[0].active.status.confused, true, 'our own Active');
  eq(E.state.players[1].active.status.confused, false, 'and not theirs');
  return true;
});

T('Long-Distance Hypnosis is the same mechanism with Asleep instead', () => {
  // Two cards, one shape. If this needs its own code path something went wrong.
  const E = board('base5-54', [], 'base1-58');
  E.dev.forceFlip = 'H';
  E.act(0, { t: 'power', uid: E.state.players[0].active.uid, kind: 'STATUS_COIN_EITHER_POWER' });
  eq(E.state.players[1].active.status.asleep, true, 'Asleep, not Confused');
  return true;
});

T('Matter Exchange trades a named card for a draw', () => {
  const E = board('base5-39', [], 'base1-58');
  const p = E.state.players[0];
  p.hand = [{ id: 'base1-98', uid: E.uid++ }];
  p.deck = [{ id: 'base1-4', uid: E.uid++ }];
  const junk = p.hand[0].uid, top = p.deck[0].uid;
  E.act(0, { t: 'power', uid: p.active.uid, kind: 'DISCARD_THEN_DRAW', discardUid: junk });
  eq(p.discard.some(x => x.uid === junk), true, 'the chosen card was discarded');
  eq(p.hand.length === 1 && p.hand[0].uid === top, true, 'and the top of the deck replaced it');
  return true;
});

T('...and is illegal with an empty hand, because the discard is the COST', () => {
  const E = board('base5-39', [], 'base1-58');
  const p = E.state.players[0];
  p.hand = [];
  p.deck = [{ id: 'base1-4', uid: E.uid++ }];
  eq(E.act(0, { t: 'power', uid: p.active.uid, kind: 'DISCARD_THEN_DRAW' }).ok, false, 'refused');
  return true;
});

T('Trickery exchanges a Prize with the top of the deck, both ways', () => {
  const E = board('base5-66', [], 'base1-58');
  const p = E.state.players[0];
  p.prizes = [{ id: 'base1-4', uid: 8001 }, { id: 'base1-58', uid: 8002 }];
  p.deck = [{ id: 'base1-98', uid: 8003 }, { id: 'base1-99', uid: 8004 }];
  E.act(0, { t: 'power', uid: p.active.uid, kind: 'PRIZE_SWAP', idx: 0 });
  eq(p.prizes[0].uid, 8003, 'the top of the deck became the Prize');
  eq(p.deck[0].uid, 8001, 'and the Prize went to the top of the deck');
  eq(p.prizes.length, 2, 'the pile is still the same size');
  eq(p.deck.length, 2, 'and so is the deck');
  return true;
});

T('...and it reveals nothing — no card name reaches the log', () => {
  // A Prize is face down to BOTH players. The log is a shared screen.
  const E = board('base5-66', [], 'base1-58');
  const p = E.state.players[0];
  p.prizes = [{ id: 'base1-4', uid: 8001 }];
  p.deck = [{ id: 'base1-98', uid: 8003 }];
  const before = E.state.log.length;
  E.act(0, { t: 'power', uid: p.active.uid, kind: 'PRIZE_SWAP', idx: 0 });
  const said = E.state.log.slice(before).map(l => l.text || l).join(' ');
  eq(/Charizard|Fire Energy/.test(said), false, 'neither card was named');
  return true;
});

// ------------------------------------------------------------ Gather Fire ----
console.log('Charmander — Gather Fire (MOVE_ENERGY, once + toSelf)');

T('Gather Fire pulls Fire off another of your Pokemon onto itself', () => {
  const E = board('base5-50', ['base1-46'], 'base1-58');
  const p = E.state.players[0];
  attach(E, p.bench[0], 'base1-98', 2);
  E.act(0, { t: 'power', uid: p.active.uid, kind: 'MOVE_ENERGY',
             from: p.bench[0].uid, to: p.active.uid });
  eq(p.active.energy.length, 1, 'Charmander gained one');
  eq(p.bench[0].energy.length, 1, 'and the Bench lost one');
  return true;
});

T('...and is ONCE a turn, unlike Energy Trans', () => {
  const E = board('base5-50', ['base1-46'], 'base1-58');
  const p = E.state.players[0];
  attach(E, p.bench[0], 'base1-98', 3);
  E.act(0, { t: 'power', uid: p.active.uid, kind: 'MOVE_ENERGY', from: p.bench[0].uid, to: p.active.uid });
  eq(E.act(0, { t: 'power', uid: p.active.uid, kind: 'MOVE_ENERGY',
                from: p.bench[0].uid, to: p.active.uid }).ok, false, 'the second is refused');
  return true;
});

T('...and never offers a destination other than itself', () => {
  // "attach it to Charmander" — toSelf. Energy Trans can move anywhere.
  const E = board('base5-50', ['base1-46', 'base1-46'], 'base1-58');
  const p = E.state.players[0];
  attach(E, p.bench[0], 'base1-98', 2);
  const acts = E.powerActions(0).filter(x => x.kind === 'MOVE_ENERGY');
  eq(acts.length > 0, true, 'it is offered');
  eq(acts.every(x => x.to === p.active.uid), true, 'and every destination is Charmander');
  return true;
});

// ------------------------------------------------------ Afternoon Nap --------
console.log('Slowpoke — Afternoon Nap (SEARCH_ENERGY_TO_SELF)');

T('Afternoon Nap fetches a Psychic Energy onto Slowpoke', () => {
  const E = board('base5-67', [], 'base1-58');
  const p = E.state.players[0];
  attach(E, p.active, 'base1-101', 1);                // pay the C cost
  p.deck = [{ id: 'base1-98', uid: E.uid++ }, { id: 'base1-101', uid: E.uid++ }];
  E.act(0, { t: 'attack', idx: 0 });
  eq(p.active.energy.filter(e => CARD_DB[e.id].provides === 'P').length, 2, 'a Psychic arrived');
  eq(p.deck.length, 1, 'and left the deck');
  return true;
});

T('...and does not spend the turn\'s one Energy attachment', () => {
  const E = board('base5-67', [], 'base1-58');
  const p = E.state.players[0];
  attach(E, p.active, 'base1-101', 1);
  p.deck = [{ id: 'base1-101', uid: E.uid++ }];
  E.act(0, { t: 'attack', idx: 0 });
  eq(!!p.energyAttached, false, 'the attachment rule governs cards played from HAND');
  return true;
});

T('...and an empty deck is not a crash', () => {
  const E = board('base5-67', [], 'base1-58');
  const p = E.state.players[0];
  attach(E, p.active, 'base1-101', 1);
  p.deck = [{ id: 'base1-98', uid: E.uid++ }];        // no Psychic
  eq(E.act(0, { t: 'attack', idx: 0 }).ok, true, 'the attack still resolved');
  return true;
});

// ------------------------------------------------------- Petal Whirlwind -----
console.log('Dark Vileplume — Petal Whirlwind (one roll, two consequences)');

T('three heads is 90 damage AND self-Confusion, off ONE roll', () => {
  // Chansey (base1-3, 120 HP) rather than a Pikachu: 90 damage Knocks a Pikachu
  // Out, and a Knocked Out slot is null by the time the assertion reads it. The
  // first draft crashed on that, and the second picked a Snorlax — 90 HP, which
  // 90 damage kills exactly. A target has to SURVIVE the thing being measured.
  const E = board('base5-13', [], 'base1-3');
  const p = E.state.players[0];
  attach(E, p.active, 'base1-99', 3);
  E.dev.forceFlip = 'H';
  E.act(0, { t: 'attack', idx: 0 });
  eq(E.state.players[1].active.dmg, 90, '3 heads x 30');
  eq(p.active.status.confused, true, '2 or more heads');
  return true;
});

T('...and no heads is no damage and no Confusion', () => {
  const E = board('base5-13', [], 'base1-58');
  const p = E.state.players[0];
  attach(E, p.active, 'base1-99', 3);
  E.dev.forceFlip = 'T';
  E.act(0, { t: 'attack', idx: 0 });
  eq(E.state.players[1].active.dmg, 0, 'nothing landed');
  eq(p.active.status.confused, false, 'and it stayed clear-headed');
  return true;
});

T('the two Dark Vileplume printings are NOT aliased, and differ in Weakness', () => {
  // DATA.md: base5-13 is Weakness Fire, base5-30 is Weakness Fighting, confirmed
  // from Trevor's physical card after both sources were disbelieved. Aliasing
  // them would be silent and permanent.
  eq(CARD_DB['base5-13'].wkType, 'R', '13 is Weak to Fire');
  eq(CARD_DB['base5-30'].wkType, 'F', '30 is Weak to Fighting');
  eq(EFFECTS['base5-13'] === EFFECTS['base5-30'], false, 'and they are separate entries');
  return true;
});


// ============================================================================
// Job 10d — the special Energy that fire on arrival
// ============================================================================
console.log('\nJob 10d — Full Heal Energy and Potion Energy');

function energyBoard(activeId) {
  const E = board(activeId, [], 'base1-58');
  E.state.players[0].hand = [];
  return E;
}
const attachFromHand = (E, energyId, target) => {
  const p = E.state.players[0];
  p.hand.push({ id: energyId, uid: E.uid++ });
  return E.act(0, { t: 'attachEnergy', hand: p.hand.length - 1, target: target.uid });
};

T('Full Heal Energy clears every condition as it lands', () => {
  const E = energyBoard('base1-4');
  const sl = E.state.players[0].active;
  sl.status.asleep = true; sl.status.confused = true; sl.status.poisoned = true;
  attachFromHand(E, 'base5-81', sl);
  eq(sl.status.asleep || sl.status.confused || sl.status.poisoned || sl.status.paralyzed,
     false, 'all four gone');
  eq(sl.energy.length, 1, 'and it stayed attached');
  return true;
});

T('...and it is a ONE-SHOT, not a continuous immunity', () => {
  // "The Pokemon you attach it to IS NO LONGER Asleep" — once, on arrival.
  // Nothing stops it being Paralyzed again a moment later.
  const E = energyBoard('base1-4');
  const sl = E.state.players[0].active;
  sl.status.asleep = true;
  attachFromHand(E, 'base5-81', sl);
  E.applyStatus(sl, 'Paralyzed');
  eq(sl.status.paralyzed, true, 'the card does not keep protecting it');
  return true;
});

T('...and it provides ONE Colorless symbol afterwards, not two', () => {
  const E = energyBoard('base1-4');
  const sl = E.state.players[0].active;
  attachFromHand(E, 'base5-81', sl);
  eq(E.slotSymbols(sl).length, 1, 'one symbol — it is not a Double Colorless');
  return true;
});

T('Potion Energy removes one damage counter as it lands', () => {
  const E = energyBoard('base1-4');
  const sl = E.state.players[0].active;
  sl.dmg = 50;
  attachFromHand(E, 'base5-82', sl);
  eq(sl.dmg, 40, '10 removed');
  return true;
});

T('..."if it has any" means an undamaged target is legal and gets nothing', () => {
  const E = energyBoard('base1-4');
  const sl = E.state.players[0].active;
  eq(attachFromHand(E, 'base5-82', sl).ok, true, 'the attachment is still legal');
  eq(sl.dmg, 0, 'and nothing happened');
  return true;
});

T('...and it cannot heal past zero', () => {
  const E = energyBoard('base1-4');
  const sl = E.state.players[0].active;
  sl.dmg = 10;
  attachFromHand(E, 'base5-82', sl);
  eq(sl.dmg, 0, 'floored, not negative');
  return true;
});

T('an on-attach Energy does NOT fire when it arrives any other way', () => {
  // The played-from-hand rule, one card kind along. An Energy that reaches a
  // Pokemon without being played from hand — moved by Energy Trans, or already
  // attached — has not been played, and must not re-fire.
  const E = energyBoard('base1-4');
  const sl = E.state.players[0].active;
  sl.dmg = 50;
  sl.energy.push({ id: 'base5-82', uid: E.uid++ });    // attached, never played
  eq(sl.dmg, 50, 'it healed nothing, because it was never played from a hand');
  return true;
});

T('Potion Energy can be attached to a BENCHED Pokemon, and heals that one', () => {
  const E = energyBoard('base1-4');
  const p = E.state.players[0];
  p.bench = [E.mkSlot({ id: 'base1-46', uid: E.uid++ })];
  p.bench[0].dmg = 30;
  attachFromHand(E, 'base5-82', p.bench[0]);
  eq(p.bench[0].dmg, 20, 'the Bench was healed');
  eq(p.active.dmg, 0, 'and not the Active');
  return true;
});


// ============================================================================
// Job 10d — Rainbow Energy, the card that breaks `provides`
//
// One symbol that is every type at once. THREE questions read it and they do
// NOT all answer the same way, which is the whole of this section.
// ============================================================================
console.log('\nJob 10d — Rainbow Energy');

T('a Rainbow pays a typed cost of any colour', () => {
  const E = board('base1-4', [], 'base1-58');         // Charizard, Fire Spin RRRR
  const sl = E.state.players[0].active;
  attach(E, sl, 'base5-17', 4);
  eq(E.costSatisfied(sl, 'RRRR'), true, 'four Rainbows pay four Fire');
  return true;
});

T('...and one Rainbow is ONE symbol, not two', () => {
  const E = board('base1-4', [], 'base1-58');
  const sl = E.state.players[0].active;
  attach(E, sl, 'base5-17', 1);
  eq(E.slotSymbols(sl).length, 1, 'one symbol — "only provides 1 Energy at a time"');
  eq(E.costSatisfied(sl, 'RR'), false, 'so it cannot pay for two');
  return true;
});

T('THE GREEDY TRAP: a Rainbow plus a Water pays "WR", in either order', () => {
  // The case that decides whether the matcher is written correctly. If the W
  // need eats the Rainbow first, the R has only a real Water left and the whole
  // cost fails — on a board that plainly can pay it. Exact matches must be taken
  // before wildcards.
  const E = board('base1-2', [], 'base1-58');
  const sl = E.state.players[0].active;
  sl.energy = [];
  attach(E, sl, 'base5-17', 1);                       // Rainbow first in the array
  attach(E, sl, 'base1-102', 1);                      // then a real Water
  eq(E.costSatisfied(sl, 'WR'), true, 'Rainbow first');

  const E2 = board('base1-2', [], 'base1-58');
  const sl2 = E2.state.players[0].active;
  sl2.energy = [];
  attach(E2, sl2, 'base1-102', 1);                    // real Water first
  attach(E2, sl2, 'base5-17', 1);
  eq(E2.costSatisfied(sl2, 'WR'), true, 'and real Water first');
  return true;
});

T('...and it still refuses a cost it genuinely cannot pay', () => {
  const E = board('base1-2', [], 'base1-58');
  const sl = E.state.players[0].active;
  sl.energy = [];
  attach(E, sl, 'base5-17', 1);
  attach(E, sl, 'base1-102', 1);
  eq(E.costSatisfied(sl, 'WRG'), false, 'two cards cannot pay three symbols');
  eq(E.costSatisfied(sl, 'RRR'), false, 'one Rainbow is not three Fire');
  return true;
});

T('a Rainbow counts toward "for each <type> Energy attached", for every type', () => {
  // Hydrocannon's shape. The same card is a spare Water AND a spare Fire, in the
  // same turn, with nothing choosing.
  const E = board('base5-45', [], 'base1-58');        // Dark Blastoise
  const sl = E.state.players[0].active;
  sl.energy = [];
  attach(E, sl, 'base5-17', 1);
  eq(E.energyChoices(sl, 'W').length, 1, 'it is a Water');
  eq(E.energyChoices(sl, 'R').length, 1, '...and a Fire');
  eq(E.energyChoices(sl, 'P').length, 1, '...and a Psychic, all at once');
  return true;
});

T('Energy Trans CAN move a Rainbow, because it is in play', () => {
  // "(Doesn't count as a basic Energy card WHEN NOT IN PLAY.)" — so while
  // attached, it does. Settled with Trevor 19 Aug 2026 against the WotC rules,
  // reversing two earlier entries written before this card existed.
  const E = board('base1-15', ['base1-2'], 'base1-58');   // Venusaur, Energy Trans
  const p = E.state.players[0];
  p.active.energy = [];
  attach(E, p.active, 'base5-17', 1);
  const acts = E.powerActions(0).filter(x => x.kind === 'MOVE_ENERGY');
  eq(acts.length > 0, true, 'the move is offered');
  E.act(0, { t: 'power', uid: p.active.uid, kind: 'MOVE_ENERGY',
             from: p.active.uid, to: p.bench[0].uid });
  eq(p.bench[0].energy.length, 1, 'and it moved');
  return true;
});

T('...but Rain Dance CANNOT attach one from hand, because a hand is not in play', () => {
  // The other half of the same parenthetical, and the half that is easy to miss.
  // Trevor's own phrasing carries it: "when it's ON A POKEMON it's whatever that
  // Pokemon needs it to be". A card in your hand is not on a Pokemon.
  const E = board('base1-2', ['base1-2'], 'base1-58');    // Blastoise, Rain Dance
  const p = E.state.players[0];
  p.hand = [{ id: 'base5-17', uid: E.uid++ }];
  const acts = E.powerActions(0).filter(x => x.kind === 'EXTRA_ATTACH');
  eq(acts.length, 0, 'Rain Dance does not see a Rainbow in hand');
  return true;
});

T('...and Rain Dance still sees a real basic Water in hand', () => {
  // The control. Without it the case above passes for any reason at all.
  const E = board('base1-2', ['base1-2'], 'base1-58');
  const p = E.state.players[0];
  p.hand = [{ id: 'base1-102', uid: E.uid++ }];
  eq(E.powerActions(0).filter(x => x.kind === 'EXTRA_ATTACH').length > 0, true,
     'a Water Energy card is found');
  return true;
});

T('Rainbow does 10 to the Pokemon it lands on, and never W/R', () => {
  const E = board('base1-4', [], 'base1-58');
  const p = E.state.players[0];
  p.hand = [{ id: 'base5-17', uid: E.uid++ }];
  E.act(0, { t: 'attachEnergy', hand: 0, target: p.active.uid });
  eq(p.active.dmg, 10, 'ten, flat');
  return true;
});

T('...and it CAN Knock Out the Pokemon it is attached to, for a Prize', () => {
  // Settled with Trevor 19 Aug 2026, and it is the Buzzap principle: a Knock Out
  // is a Knock Out even when you did it to yourself.
  const E = board('base1-4', ['base1-46'], 'base1-58');
  const p = E.state.players[0], o = E.state.players[1];
  p.active.dmg = CARD_DB['base1-4'].hp - 10;          // one counter from death
  const prizesBefore = o.prizes.length;
  p.hand = [{ id: 'base5-17', uid: E.uid++ }];
  E.act(0, { t: 'attachEnergy', hand: 0, target: p.active.uid });
  eq(p.active === null || p.active === undefined, true, 'Charizard is gone');
  eq(o.prizes.length, prizesBefore - 1, 'and they took a Prize for it');
  return true;
});

T('...and it does not fire when it arrives any other way', () => {
  // "WHEN YOU ATTACH THIS CARD FROM YOUR HAND." An Energy Trans move is not that.
  const E = board('base1-15', ['base1-2'], 'base1-58');
  const p = E.state.players[0];
  p.active.energy = [];
  attach(E, p.active, 'base5-17', 1);                 // placed, not played
  eq(p.active.dmg, 0, 'no damage on arrival');
  E.act(0, { t: 'power', uid: p.active.uid, kind: 'MOVE_ENERGY',
             from: p.active.uid, to: p.bench[0].uid });
  eq(p.bench[0].dmg, 0, 'and none on the way to the Bench either');
  return true;
});

T('Afternoon Nap will not fetch a Rainbow out of the deck', () => {
  // "Search your deck for a Psychic ENERGY CARD" — the deck is not in play, so
  // the parenthetical excludes it. Third zone, third answer.
  const E = board('base5-67', [], 'base1-58');
  const p = E.state.players[0];
  attach(E, p.active, 'base1-101', 1);
  p.deck = [{ id: 'base5-17', uid: E.uid++ }];
  E.act(0, { t: 'attack', idx: 0 });
  eq(p.active.energy.length, 1, 'nothing was fetched');
  eq(p.deck.length, 1, 'and the Rainbow is still in the deck');
  return true;
});

T('the AI never attaches a Rainbow to something it would kill', () => {
  const E = board('base1-4', [], 'base1-58');
  const p = E.state.players[0];
  p.active.dmg = CARD_DB['base1-4'].hp - 10;
  const ai = new AI(E, 'expert');
  const v = ai.attachValue(0, p.active, 'base5-17');
  eq(v === -Infinity, true, 'refused outright, not merely discounted');
  return true;
});

console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail === 0 ? 0 : 1);

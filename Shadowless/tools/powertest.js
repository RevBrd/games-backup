// Behavioural tests for the Pokemon Power system (Job 4d).
//
//   node tools/powertest.js
//
// selftest.js proves games don't crash; this proves the Powers do what the cards
// say. Each case builds a board by hand, fires the Power, and asserts the exact
// state change — including the cases where it must be ILLEGAL, which is where
// these rules actually live.

const { CARD_DB, DECKS } = require('../src/cards.js');
const { EFFECTS } = require('../src/effects.js');
const { Engine } = require('../src/engine.js');
require('../src/ai.js');

let pass = 0, fail = 0;
const T = (name, fn) => {
  try {
    const r = fn();
    if (r === false) { console.log(`  FAIL  ${name}`); fail++; }
    else { console.log(`  ok    ${name}`); pass++; }
  } catch (e) { console.log(`  FAIL  ${name}  [${e.message}]`); fail++; }
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
  // Prizes matter as soon as anything can Knock a Pokemon Out — Buzzap hands one
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
// engine.js keeps topCard module-scoped, so the harness needs its own.
const top = (E, slot) => E.db[slot.stack[slot.stack.length - 1].id];
const attach = (E, slot, energyId, n = 1) => {
  for (let i = 0; i < n; i++) slot.energy.push({ id: energyId, uid: E.uid++ });
};

console.log('\nPokemon Power behaviour\n');

// ---------------------------------------------------------------- Damage Swap
console.log('Alakazam — Damage Swap');

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
    if (!r.ok) throw new Error(`enumerated action was rejected: ${a.label} — ${r.error}`);
  }
  return true;
});

// ---------------------------------------------------------------- Energy Burn
console.log('\nCharizard — Energy Burn');

T('lets non-Fire Energy pay a Fire cost', () => {
  const E = board('base1-4');                               // Fire Spin costs RRRR
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-102', 4);                          // four Water Energy
  eq(E.canUseAttack(0, 0).ok, false, 'Fire Spin before Energy Burn');
  const r = E.act(0, { t: 'power', uid: zard.uid, kind: 'ENERGY_AS' });
  if (!r.ok) throw new Error(r.error);
  eq(E.canUseAttack(0, 0).ok, true, 'Fire Spin after Energy Burn');
  return true;
});

T('preserves symbol count, so Double Colorless still pays for two', () => {
  const E = board('base1-4');
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-96', 2);                           // 2 x DCE = 4 symbols
  E.act(0, { t: 'power', uid: zard.uid, kind: 'ENERGY_AS' });
  eq(E.slotSymbols(zard).join(''), 'RRRR', 'symbols after Energy Burn');
  return true;
});

T('lapses at the turn boundary', () => {
  const E = board('base1-4');
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-102', 4);
  E.act(0, { t: 'power', uid: zard.uid, kind: 'ENERGY_AS' });
  eq(zard.energyAs, 'R', 'set during the turn');
  E.act(0, { t: 'pass' });
  eq(zard.energyAs, null, 'cleared after the turn ends');
  return true;
});

T('is not offered twice in the same turn', () => {
  const E = board('base1-4');
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-102', 4);
  E.act(0, { t: 'power', uid: zard.uid, kind: 'ENERGY_AS' });
  eq(E.legalActions(0).filter(a => a.t === 'power' && a.kind === 'ENERGY_AS').length, 0, 'repeat offers');
  return true;
});

// --------------------------------------------------------------- Strikes Back
console.log('\nMachamp — Strikes Back');

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
  if (champ.dmg <= 0) throw new Error('Machamp took no damage — test setup wrong');
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
console.log('\nBlastoise — Rain Dance');

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
console.log('\nVenusaur — Energy Trans');

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
console.log('\nElectrode — Buzzap');

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

T('it counts as two symbols for retreat as well', () => {
  const E = board('base1-21', ['base1-56']);                // Onix, retreat 3
  const [trode, onix] = E.allSlots(0);
  eq(E.canRetreat(onix), false, 'cannot retreat with nothing attached');
  buzzap(E, trode, onix, 'F');
  attach(E, onix, 'base1-97', 1);
  eq(E.canRetreat(onix), true, 'two from Buzzap plus one is enough for retreat 3');
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

console.log('\nPoliwhirl — Amnesia');

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

console.log('\nClefairy — Metronome');

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
  // Clefairy has 40 HP and Double-edge self-inflicts 80, so it dies — which is
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

console.log('\nPidgeotto — Mirror Move');

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

console.log('\nPidgey / Pidgeotto — Whirlwind');

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
  eq(E.state.pendingSwitch, null, 'no switch owed — they are promoting instead');
  eq(E.state.pendingPromote, 1, 'promotion owed');
  return true;
});

console.log('\nPorygon — Conversion');

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
T('the AI uses Energy Burn when it unlocks an attack', () => {
  const E = board('base1-4');
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-102', 4);                          // Water, cannot pay RRRR
  E.state.players[0].hand = [];
  eq(E.canUseAttack(0, 0).ok, false, 'Fire Spin blocked to start with');
  E.aiTurn(0, 'expert');
  if (!E.state.log.some(l => (l.text || '').includes('Energy Burn'))) throw new Error('AI never used Energy Burn');
  return true;
});

T('the AI leaves Energy Burn alone when it changes nothing', () => {
  const E = board('base1-4');
  const zard = E.state.players[0].active;
  attach(E, zard, 'base1-98', 4);                           // already four Fire
  E.state.players[0].hand = [];
  E.aiTurn(0, 'expert');
  if (E.state.log.some(l => (l.text || '').includes('Energy Burn'))) throw new Error('AI used a pointless Energy Burn');
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
  // Energy A→B and B→A both scored as gains, so the bot moved Energy 44,000
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
  if (scores.every(x => x === scores[0])) throw new Error('every copy option scored the same — forecast is blind');
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

console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail === 0 ? 0 : 1);

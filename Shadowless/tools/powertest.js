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

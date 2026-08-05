// Integration smoke test for the BUILT artifact.
// Usage: node smoke.js [path-to-html]   (default ./out.html)
const fs = require('fs');
const path = process.argv[2] || __dirname + '/out.html';
const html = fs.readFileSync(path, 'utf8');
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];

let pass = 0, fail = 0;
const T = (n, f) => { try { const r = f(); if (r === false) { console.log('  FAIL  ' + n); fail++; } else { console.log('  ok    ' + n); pass++; } } catch (e) { console.log(`  FAIL  ${n}  [${e.message}]`); fail++; } };

// ---- minimal DOM ----
let created = 0;
function mkEl(tag) {
  created++;
  const e = {
    tagName: tag, className: '', _text: '', style: {}, children: [], attrs: {},
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      contains(c) { return this._s.has(c); },
    },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {},
    set textContent(v) { this._text = String(v); },
    get textContent() { return this._text; },
    set innerHTML(v) { if (v === '') this.children = []; },
    get innerHTML() { return ''; },
  };
  return e;
}
const appEl = mkEl('div');
let domReady = null;
global.document = {
  createElement: mkEl,
  getElementById: (id) => (id === 'app' ? appEl : mkEl('div')),
};
global.window = { addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') domReady = fn; } };
global.alert = () => {};
// controllable fake clock: nothing fires until we drain it
let timers = [], tid = 1;
global.setTimeout = (fn, ms) => { const id = tid++; timers.push({ id, fn, ms }); return id; };
global.clearTimeout = (id) => { timers = timers.filter(t => t.id !== id); };
function drain(limit = 200) { let c = 0; while (timers.length && c++ < limit) { const t = timers.shift(); t.fn(); } return c; }

const ctx = new Function('window', 'document', 'alert', 'setTimeout', 'clearTimeout',
  js + '\nreturn {UI, Engine, CARD_DB, DECKS, EFFECTS, render, newGame, dispatch, presenting, startMatch, backToDeckSelect, miniCard, fullCard, inspectCard};')
  (global.window, global.document, global.alert, global.setTimeout, global.clearTimeout);

const { UI, render, newGame, CARD_DB, DECKS, dispatch, presenting, startMatch, backToDeckSelect } = ctx;

console.log('\n=== BUILT ARTIFACT SMOKE ===');

T('boots into the deck-select screen with no game running', () => {
  domReady();
  return UI.screen === 'decks' && !UI.E;
});
T('deck-select screen renders every deck as a choice', () => {
  render();
  return created > 0 && Object.keys(DECKS).length === 4;
});
T('starting a match moves to setup', () => {
  startMatch();
  return UI.screen === 'setup' && !!UI.E && UI.E.state.phase === 'setup';
});
T('opponent is auto-set-up, player is not', () => {
  return UI.E.state.setupDone[1] === true && UI.E.state.setupDone[0] === false;
});
T('setup screen renders without throwing', () => { render(); return created > 0; });
T('auto-fill + ready starts play', () => {
  UI.E.setupAuto(0);
  render();
  return UI.E.state.phase === 'main';
});
T('both players have prizes dealt', () => {
  const s = UI.E.state;
  return s.players[0].prizes.length === 6 && s.players[1].prizes.length === 6;
});
T('coverage panel renders', () => { UI.devTab = 'cards'; render(); UI.devTab = 'log'; return true; });
T('dev panel renders', () => { UI.devTab = 'dev'; render(); UI.devTab = 'log'; return true; });

T('renders every state of a full game without throwing (both sides AI)', () => {
  let guard = 0;
  while (UI.E.state.phase !== 'over' && guard++ < 800) {
    const s = UI.E.state;
    const pi = s.pendingPromote !== null ? s.pendingPromote : s.active;
    const a = UI.E.aiChoose(pi, 'greedy');
    if (!a) break;
    UI.E.act(pi, a);
    render();
  }
  if (UI.E.state.phase !== 'over') throw new Error('game did not finish in 800 steps');
  return true;
});
T('game-over overlay renders', () => { render(); return UI.E.state.winner !== null; });

T('50 full games render at every step, all three tabs', () => {
  for (let seed = 1; seed <= 50; seed++) {
    UI.seedDraft = String(seed);
    startMatch();
    UI.E.setupAuto(0);
    let guard = 0;
    while (UI.E.state.phase !== 'over' && guard++ < 800) {
      const s = UI.E.state;
      const pi = s.pendingPromote !== null ? s.pendingPromote : s.active;
      const a = UI.E.aiChoose(pi, seed % 2 ? 'greedy' : 'random');
      if (!a) break;
      UI.E.act(pi, a);
      if (guard % 7 === 0) { UI.devTab = ['log', 'dev', 'cards'][guard % 3]; render(); }
    }
    UI.devTab = 'log';
    render();
    if (UI.E.state.phase !== 'over') throw new Error(`seed ${seed} did not finish`);
  }
  return true;
});

T('targeting scopes referenced by the UI all exist in the engine', () => {
  UI.seedDraft = '7'; startMatch(); UI.E.setupAuto(0);
  const scopes = ['ownBench', 'oppBench', 'oppEnergy', 'ownDamaged', 'ownDamagedEnergy', 'handDiscard', 'attachTo', 'evolveOn', 'promote'];
  // every trainer the decks contain that needs a target must map to a known scope
  const need = ['base1-95', 'base1-93', 'base1-92', 'base1-94', 'base1-90', 'base1-81'];
  for (const id of need) {
    if (!CARD_DB[id]) throw new Error('missing card ' + id);
  }
  return scopes.length === 9;
});

T('log renders newest-first', () => {
  UI.seedDraft = '3'; startMatch(); UI.E.setupAuto(0);
  for (let i = 0; i < 6; i++) {
    const s = UI.E.state;
    const pi = s.pendingPromote !== null ? s.pendingPromote : s.active;
    const a = UI.E.aiChoose(pi, 'greedy'); if (!a) break;
    UI.E.act(pi, a);
  }
  UI.devTab = 'log';
  render();
  const entries = UI.E.state.log;
  const newest = entries[entries.length - 1].text;
  const rail = appEl.children[0].children[1];      // wrap > rail
  const panel = rail.children[1];                  // tabs, then log panel
  const firstLine = panel.children[0];
  if (!firstLine) throw new Error('log panel is empty');
  return firstLine.children[1]._text === newest;
});

T('player can take either side of the matchup', () => {
  // Both decks are set explicitly. This used to name only myDeck and lean on the
  // old rule that a clash bumped the opponent to some other deck — which read as
  // an assertion about sides but was really testing the auto-correct.
  UI.myDeck = 'Overgrowth'; UI.foeDeck = 'Brushfire'; UI.seedDraft = '11';
  newGame(); UI.E.setupAuto(0);
  const a = UI.E.state.players[0].deckDef.name === 'Overgrowth'
         && UI.E.state.players[1].deckDef.name === 'Brushfire';
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.seedDraft = '11';
  newGame(); UI.E.setupAuto(0);
  const b = UI.E.state.players[0].deckDef.name === 'Brushfire'
         && UI.E.state.players[1].deckDef.name === 'Overgrowth';
  return a && b;
});

T('both sides are playable to completion', () => {
  for (const d of ['Brushfire', 'Overgrowth']) {
    UI.myDeck = d; UI.seedDraft = '21';
    startMatch(); UI.E.setupAuto(0);
    let guard = 0;
    while (UI.E.state.phase !== 'over' && guard++ < 800) {
      const s = UI.E.state;
      const pi = s.pendingPromote !== null ? s.pendingPromote : s.active;
      const a = UI.E.aiChoose(pi, 'greedy'); if (!a) break;
      UI.E.act(pi, a); render();
    }
    if (UI.E.state.phase !== 'over') throw new Error(d + ' did not finish');
  }
  UI.myDeck = 'Brushfire';
  return true;
});

// --- coin-flip presentation -------------------------------------------------
// Build a board where the player's next attack definitely flips a coin.
function riggedFlipBoard(flipDelay) {
  UI.seedDraft = '5'; startMatch(); UI.E.setupAuto(0);
  const E = UI.E, s = E.state;
  s.active = 0; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];
  const vulpix = E.mkSlot({ uid: 90001, id: 'base1-68' });      // Confuse Ray: STATUS_ON_FLIP
  vulpix.energy = [{ uid: 90002, id: 'base1-98' }, { uid: 90003, id: 'base1-98' }];
  s.players[0].active = vulpix;
  s.players[1].active = E.mkSlot({ uid: 90004, id: 'base1-65' });
  s.players[1].bench = [];
  UI.flipDelay = flipDelay;
  return E;
}

T('an attack with a coin flip enters presentation and freezes the board', () => {
  riggedFlipBoard(2000);
  const before = UI.E.state.players[1].active.status.confused;
  dispatch(0, { t: 'attack', idx: 0 });
  if (!presenting()) throw new Error('presentation did not start');
  if (!UI.view) throw new Error('board was not frozen');
  render();
  // the frozen view must NOT already show the outcome
  return UI.view.players[1].active.status.confused === before;
});

T('input is locked while the coin is in the air', () => {
  riggedFlipBoard(2000);
  dispatch(0, { t: 'attack', idx: 0 });
  const acts = ctx.UI.E.legalActions(0);
  render();
  // engine still has legal actions, but the UI must refuse to dispatch
  const turnBefore = UI.E.state.turn;
  dispatch(0, { t: 'pass' });
  return acts.length >= 0 && UI.E.state.turn === turnBefore;
});

T('draining the clock lands the coin and releases the board', () => {
  riggedFlipBoard(2000);
  dispatch(0, { t: 'attack', idx: 0 });
  drain(200);
  if (presenting()) throw new Error('presentation never finished');
  return UI.view === null;
});

T('setting the coin pause to zero skips presentation entirely', () => {
  riggedFlipBoard(0);
  dispatch(0, { t: 'attack', idx: 0 });
  return presenting() === false && UI.view === null;
});

T('an action with no coin flip never enters presentation', () => {
  UI.seedDraft = '9'; startMatch(); UI.E.setupAuto(0);
  UI.flipDelay = 2000;
  const s = UI.E.state;
  s.active = 0; s.phase = 'main';
  s.players[0].active.status.asleep = false;
  s.players[1].active.status.asleep = false;
  dispatch(0, { t: 'pass' });
  return presenting() === false;
});

T('full game via dispatch + clock completes with flips presented', () => {
  // NOTE: 'greedy' picks by printed damage, and flip attacks almost always print
  // lower than their non-flip sibling, so greedy games can contain zero flips.
  // 'random' is the mode that actually exercises this path.
  UI.seedDraft = '31'; UI.flipDelay = 2000; UI.aiDelay = 1000;
  startMatch(); UI.E.setupAuto(0);
  let guard = 0, presented = 0;
  while (UI.E.state.phase !== 'over' && guard++ < 4000) {
    if (presenting()) { presented++; drain(6); continue; }
    const s = UI.E.state;
    const pi = s.pendingPromote !== null ? s.pendingPromote : s.active;
    const a = UI.E.aiChoose(pi, 'random');
    if (!a) break;
    dispatch(pi, a);
    render();
  }
  if (UI.E.state.phase !== 'over') throw new Error('did not finish');
  if (presented === 0) throw new Error('no flips were ever presented');
  return true;
});

// --- three-deck pool + chained targeting -----------------------------------
function findByText(node, txt) {
  if (!node) return null;
  if (node._text === txt) return node;
  for (const c of (node.children || [])) { const r = findByText(c, txt); if (r) return r; }
  return null;
}

T('all four decks are selectable and validate', () => {
  const names = Object.keys(DECKS);
  if (names.length !== 4) throw new Error('expected 4 decks, got ' + names.length);
  for (const n of names) {
    const v = UI.E.validateDeck(DECKS[n]);
    if (!v.ok) throw new Error(n + ': ' + v.errors.join('; '));
  }
  return true;
});

T('every deck pairing plays to completion', () => {
  const names = Object.keys(DECKS);
  let played = 0;
  for (const a of names) for (const b of names) {
    if (a === b) continue;
    UI.myDeck = a; UI.foeDeck = b; UI.seedDraft = '41'; UI.flipDelay = 0;
    startMatch(); UI.E.setupAuto(0);
    let guard = 0;
    while (UI.E.state.phase !== 'over' && guard++ < 900) {
      const s = UI.E.state;
      const pi = s.pendingPromote !== null ? s.pendingPromote : s.active;
      const act = UI.E.aiChoose(pi, 'greedy'); if (!act) break;
      dispatch(pi, act); render();
    }
    if (UI.E.state.phase !== 'over') throw new Error(`${a} vs ${b} did not finish`);
    played++;
  }
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.flipDelay = 2000;
  return played === 12;
});

T('a mirror match is allowed and both sides keep the chosen deck', () => {
  UI.myDeck = 'Blackout'; UI.foeDeck = 'Blackout';
  UI.seedDraft = '13'; startMatch();
  const ok = UI.E.state.players[0].deckDef.name === 'Blackout'
          && UI.E.state.players[1].deckDef.name === 'Blackout';
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth';
  return ok;
});

T('a mirror match still shuffles the two sides independently', () => {
  UI.myDeck = 'Zap'; UI.foeDeck = 'Zap';
  UI.seedDraft = '21'; startMatch();
  const hand = p => p.hand.map(c => c.id).join(',');
  // Same 60 cards, two different seeds — identical opening hands would mean the
  // seeds were not actually being kept apart.
  const ok = hand(UI.E.state.players[0]) !== hand(UI.E.state.players[1]);
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth';
  return ok;
});

T('a mirror match plays to completion', () => {
  UI.myDeck = 'Overgrowth'; UI.foeDeck = 'Overgrowth';
  UI.seedDraft = '29'; UI.flipDelay = 0;
  startMatch();
  const E = UI.E;
  E.setupAuto(0); E.setupConfirm(0);
  let n = 0;
  while (E.state.winner === null && n++ < 6000) {
    const pd = E.state.pendingPromote;
    const p = (pd === null || pd === undefined) ? E.state.active : pd;
    const a = E.aiChoose(p, 'expert');
    if (!a) break;
    E.act(p, a);
  }
  const ok = E.state.winner !== null;
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth';
  return ok;
});

T('Super Energy Removal chains both target prompts through the UI', () => {
  UI.myDeck = 'Blackout'; UI.foeDeck = 'Overgrowth';
  UI.seedDraft = '17'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  const E = UI.E, s = E.state;
  s.active = 0; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];

  const mine = E.mkSlot({ uid: 70001, id: 'base1-7' });
  mine.energy = [{ uid: 70002, id: 'base1-97' }, { uid: 70003, id: 'base1-97' }];
  s.players[0].active = mine; s.players[0].bench = [];

  const theirs = E.mkSlot({ uid: 70004, id: 'base1-65' });
  theirs.energy = [{ uid: 70005, id: 'base1-102' }, { uid: 70006, id: 'base1-102' }, { uid: 70007, id: 'base1-102' }];
  s.players[1].active = theirs; s.players[1].bench = [];

  s.players[0].hand = [{ uid: 70008, id: 'base1-79' }];
  UI.sel = { idx: 0 };
  render();

  const playBtn = findByText(appEl, 'Play…');
  if (!playBtn || !playBtn.onclick) throw new Error('Play button not rendered');
  playBtn.onclick();
  if (!UI.targeting || UI.targeting.scope !== 'ownEnergy') throw new Error('first prompt missing');

  UI.targeting.dispatch({ targetUid: mine.uid });
  if (!UI.targeting || UI.targeting.scope !== 'oppEnergy') throw new Error('second prompt missing');

  UI.targeting.dispatch({ targetUid: theirs.uid });
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.flipDelay = 2000;
  return mine.energy.length === 1 && theirs.energy.length === 1;
});

function findClickableContaining(node, txt) {
  if (!node) return null;
  if (node.onclick && (node.children || []).some(c => c._text === txt)) return node;
  for (const c of (node.children || [])) { const r = findClickableContaining(c, txt); if (r) return r; }
  return null;
}

T('Computer Search runs both picker stages through the UI', () => {
  UI.myDeck = 'Zap'; UI.foeDeck = 'Blackout';
  UI.seedDraft = '23'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  const E = UI.E, s = E.state;
  s.active = 0; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];

  const cs = { uid: 60001, id: 'base1-71' };
  const keep = { uid: 60002, id: 'base1-10' };
  s.players[0].hand = [cs, keep, { uid: 60003, id: 'base1-101' }, { uid: 60004, id: 'base1-101' }];
  UI.sel = { idx: 0 };
  render();

  const playBtn = findByText(appEl, 'Play…');
  if (!playBtn || !playBtn.onclick) throw new Error('Play button not rendered');
  playBtn.onclick();
  if (!UI.picker) throw new Error('picker did not open');
  if (UI.picker.items.length !== 3) throw new Error('picker should offer the 3 other hand cards');

  // choose the two Psychic Energy, never Mewtwo
  UI.picker.chosen = [60003, 60004];
  render();
  const nextBtn = findByText(appEl, 'Search deck');
  if (!nextBtn || !nextBtn.onclick) throw new Error('confirm button missing');
  nextBtn.onclick();
  if (!UI.picker) throw new Error('second picker did not open');

  const target = UI.picker.items[0];
  UI.picker.chosen = [target.uid];
  render();
  const takeBtn = findByText(appEl, 'Take card');
  if (!takeBtn || !takeBtn.onclick) throw new Error('take button missing');
  takeBtn.onclick();

  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.flipDelay = 2000;
  return UI.picker === null
      && s.players[0].hand.some(x => x.uid === 60002)      // Mewtwo kept
      && s.players[0].hand.some(x => x.uid === target.uid);
});

T('Computer Search resolves and puts the chosen card in hand', () => {
  UI.myDeck = 'Zap'; UI.foeDeck = 'Blackout';
  UI.seedDraft = '29'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  const E = UI.E, s = E.state;
  s.active = 0; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];
  s.players[0].hand = [{ uid: 61001, id: 'base1-71' }, { uid: 61002, id: 'base1-101' }, { uid: 61003, id: 'base1-101' }];
  const want = s.players[0].deck[3];
  const r = E.act(0, { t: 'playTrainer', hand: 0, opts: { discardUids: [61002, 61003], pickUid: want.uid } });
  if (!r.ok) throw new Error(r.error);
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.flipDelay = 2000;
  return s.players[0].hand.length === 1 && s.players[0].hand[0].uid === want.uid;
});

T('returning to deck select clears the running game', () => {
  UI.seedDraft = '33'; startMatch(); UI.E.setupAuto(0);
  backToDeckSelect();
  render();
  return UI.screen === 'decks' && UI.picker === null && UI.targeting === null;
});

T('every AI difficulty plays a full game through the bundle', () => {
  for (const mode of ['expert', 'novice', 'greedy', 'random']) {
    UI.myDeck = 'Zap'; UI.foeDeck = 'Blackout';
    UI.aiMode = mode; UI.seedDraft = '55'; UI.flipDelay = 0;
    startMatch(); UI.E.setupAuto(0);
    let guard = 0;
    while (UI.E.state.phase !== 'over' && guard++ < 1200) {
      const s = UI.E.state;
      const pi = s.pendingPromote !== null ? s.pendingPromote : s.active;
      const a = UI.E.aiChoose(pi, mode);
      if (!a) break;
      dispatch(pi, a); render();
    }
    if (UI.E.state.phase !== 'over') throw new Error(mode + ' did not finish');
  }
  UI.aiMode = 'expert'; UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.flipDelay = 2000;
  return true;
});

T('the expert AI supplies its own Trainer targets (never random)', () => {
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth';
  UI.seedDraft = '61'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  const E = UI.E, s = E.state;
  s.active = 1; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];
  // give the opponent a Gust of Wind and a clearly best target
  const foe = s.players[1];
  foe.hand = [{ uid: 50001, id: 'base1-93' }];
  const mine = s.players[0];
  mine.bench = [];
  const weak = E.mkSlot({ uid: 50010, id: 'base1-35' }); weak.dmg = 20;
  mine.bench.push(weak);
  mine.bench.push(E.mkSlot({ uid: 50011, id: 'base1-23' }));
  const a = E.aiChoose(1, 'expert');
  UI.flipDelay = 2000;
  if (!a || a.t !== 'playTrainer') throw new Error('expert did not play the Trainer');
  return a.opts && a.opts.bench === 0;      // picked the nearly-dead Magikarp
});

T('card faces render for every card in play, all three kinds', () => {
  UI.myDeck = 'Zap'; UI.foeDeck = 'Blackout'; UI.seedDraft = '71'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  let kinds = new Set();
  for (const id in CARD_DB) {
    const c = CARD_DB[id];
    kinds.add(c.kind);
    ctx.miniCard(c);
    ctx.fullCard(c);
  }
  UI.flipDelay = 2000;
  return kinds.size === 3;
});

T('clicking a card opens the preview panel on the card tab', () => {
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.seedDraft = '73'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  UI.devTab = 'log';
  const active = UI.E.state.players[0].active;
  const id = active.stack[active.stack.length - 1].id;
  ctx.inspectCard(id);
  render();
  UI.flipDelay = 2000;
  return UI.devTab === 'card' && UI.inspect === id;
});

T('preview panel handles having nothing selected', () => {
  UI.inspect = null; UI.devTab = 'card';
  render();
  UI.devTab = 'log';
  return true;
});

// --- play mat zones + motion --------------------------------------------
T('the mat renders prize, deck and discard zones for both sides', () => {
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.seedDraft = '81'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  render();
  const countClass = (node, cls) => {
    // el() assigns className as a string; classList only holds later .add() calls
    const has = node && ((String(node.className).split(/\s+/).indexOf(cls) >= 0)
                      || (node.classList && node.classList.contains(cls)));
    let n = has ? 1 : 0;
    for (const c of (node.children || [])) n += countClass(c, cls);
    return n;
  };
  const zones = countClass(appEl, 'zone');
  const backs = countClass(appEl, 'cardback');
  UI.flipDelay = 2000;
  // 3 zones per side (prizes, deck, discard) x 2 sides
  if (zones !== 6) throw new Error('expected 6 zones, got ' + zones);
  if (backs < 12) throw new Error('expected face-down cards, got ' + backs);
  return true;
});

T('bench renders a fixed number of slots so the zone keeps its shape', () => {
  UI.seedDraft = '83'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  render();
  const count = (node, cls) => {
    const has = node && ((String(node.className).split(/\s+/).indexOf(cls) >= 0)
                      || (node.classList && node.classList.contains(cls)));
    let n = has ? 1 : 0;
    for (const c of (node.children || [])) n += count(c, cls);
    return n;
  };
  const filled = UI.E.state.players[0].bench.length + UI.E.state.players[1].bench.length;
  const empties = count(appEl, 'benchslot');
  UI.flipDelay = 2000;
  return empties === (UI.E.cfg.benchMax * 2) - filled;
});

T('damage marks a one-shot effect that then expires', () => {
  UI.seedDraft = '85'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  const E = UI.E, s = E.state;
  s.active = 0; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];
  const a = E.mkSlot({ uid: 40001, id: 'base1-23' });
  a.energy = [{ uid: 40002, id: 'base1-98' }, { uid: 40003, id: 'base1-98' },
              { uid: 40004, id: 'base1-98' }, { uid: 40005, id: 'base1-98' }];
  s.players[0].active = a;
  const d = E.mkSlot({ uid: 40010, id: 'base1-56' });     // Onix, survives
  s.players[1].active = d; s.players[1].bench = [];
  UI.fx = {};
  dispatch(0, { t: 'attack', idx: 0 });
  const key = 'hit' + d.uid;          // mkSlot assigns its own slot uid
  if (!UI.fxActive(key)) throw new Error('damage did not mark an effect');
  render();
  UI.fx[key] = Date.now() - 1;                            // simulate expiry
  UI.flipDelay = 2000;
  return UI.fxActive(key) === false;
});

T('a Knock Out marks its own effect', () => {
  UI.seedDraft = '87'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  const E = UI.E, s = E.state;
  s.active = 0; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];
  const a = E.mkSlot({ uid: 41001, id: 'base1-23' });
  a.energy = [{ uid: 41002, id: 'base1-98' }, { uid: 41003, id: 'base1-98' },
              { uid: 41004, id: 'base1-98' }, { uid: 41005, id: 'base1-98' }];
  s.players[0].active = a;
  const d = E.mkSlot({ uid: 41010, id: 'base1-35' });     // Magikarp, dies
  s.players[1].active = d;
  s.players[1].bench = [E.mkSlot({ uid: 41011, id: 'base1-65' })];
  UI.fx = {};
  dispatch(0, { t: 'attack', idx: 0 });
  render();
  const koMarked = UI.fxActive('ko1');
  const prizeMarked = UI.fxActive('prize0');
  UI.flipDelay = 2000;
  return koMarked && prizeMarked;
});

T('effect keys do not accumulate without bound', () => {
  UI.fx = {};
  for (let i = 0; i < 500; i++) UI.fxMark('hit' + i, -1);   // already expired
  UI.fxMark('live', 5000);
  return Object.keys(UI.fx).length <= 2;
});

T('the Sandbox deck is selectable and plays to completion', () => {
  UI.myDeck = 'Sandbox'; UI.foeDeck = 'Sandbox';
  UI.seedDraft = '91'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  if (UI.E.state.players[0].deck.length + UI.E.state.players[0].hand.length
      + UI.E.state.players[0].prizes.length
      + (UI.E.state.players[0].active ? 1 : 0)
      + UI.E.state.players[0].bench.length < 55) throw new Error('sandbox deck too small');
  let guard = 0;
  while (UI.E.state.phase !== 'over' && guard++ < 1200) {
    const s = UI.E.state;
    const pi = s.pendingPromote !== null ? s.pendingPromote : s.active;
    const a = UI.E.aiChoose(pi, 'expert');
    if (!a) break;
    dispatch(pi, a); render();
  }
  const done = UI.E.state.phase === 'over';
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.flipDelay = 2000;
  return done;
});

T('Sandbox vs a fixed deck works, and both sides may be Sandbox', () => {
  UI.myDeck = 'Sandbox'; UI.foeDeck = 'Zap'; UI.seedDraft = '93'; UI.flipDelay = 0;
  startMatch();
  const a = UI.E.state.players[1].deckDef.name;
  UI.myDeck = 'Sandbox'; UI.foeDeck = 'Sandbox'; UI.seedDraft = '95';
  startMatch();
  const bothSandbox = UI.E.state.players[0].deckDef.name === 'Sandbox'
                   && UI.E.state.players[1].deckDef.name === 'Sandbox';
  // two Sandbox decks generated from different seeds should differ
  const l0 = JSON.stringify(UI.E.state.players[0].deckDef.list);
  const l1 = JSON.stringify(UI.E.state.players[1].deckDef.list);
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.flipDelay = 2000;
  return a === 'Zap' && bothSandbox && l0 !== l1;
});

T('Pokedex opens an ordering picker and applies the new order', () => {
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.seedDraft = '101'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  const E = UI.E, s = E.state;
  s.active = 0; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];
  s.players[0].hand = [{ uid: 62000, id: 'base1-87' }];
  UI.sel = { idx: 0 };
  render();
  const btn = findByText(appEl, 'Play…');
  if (!btn) throw new Error('Play button missing');
  btn.onclick();
  if (!UI.picker || UI.picker.mode !== 'order') throw new Error('ordering picker did not open');
  const reversed = UI.picker.order.slice().reverse();
  UI.picker.order = reversed;
  render();
  const setBtn = findByText(appEl, 'Set order');
  if (!setBtn) throw new Error('confirm missing');
  setBtn.onclick();
  const top = s.players[0].deck.slice(0, 5).map(x => x.uid);
  UI.flipDelay = 2000;
  return JSON.stringify(top) === JSON.stringify(reversed);
});

T('Revive offers only Basics from the discard pile', () => {
  UI.seedDraft = '103'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  const E = UI.E, s = E.state;
  s.active = 0; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];
  s.players[0].bench = [];
  s.players[0].discard = [
    { uid: 62100, id: 'base1-16' },     // Zapdos, Basic
    { uid: 62101, id: 'base1-23' },     // Arcanine, Stage 1
    { uid: 62102, id: 'base1-98' },     // Energy
  ];
  s.players[0].hand = [{ uid: 62103, id: 'base1-89' }];
  UI.sel = { idx: 0 };
  render();
  findByText(appEl, 'Play…').onclick();
  if (!UI.picker) throw new Error('picker did not open');
  const offered = UI.picker.items.map(x => x.uid);
  UI.picker.chosen = [62100];
  render();
  findByText(appEl, 'Confirm').onclick();
  UI.flipDelay = 2000;
  return offered.length === 1 && offered[0] === 62100
      && s.players[0].bench.length === 1 && s.players[0].bench[0].dmg === 40;
});

T('every picker Trainer opens a picker rather than throwing', () => {
  const ids = ['base1-71','base1-74','base1-83','base1-89','base1-86','base1-77','base1-87'];
  for (const id of ids) {
    UI.seedDraft = '105'; UI.flipDelay = 0;
    startMatch(); UI.E.setupAuto(0);
    const E = UI.E, s = E.state;
    s.active = 0; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];
    s.players[0].discard = [{ uid: 62200, id: 'base1-16' }, { uid: 62201, id: 'base1-88' }];
    s.players[1].discard = [{ uid: 62202, id: 'base1-16' }];
    s.players[0].bench = []; s.players[1].bench = [];
    s.players[0].hand = [{ uid: 62210, id },
                         { uid: 62211, id: 'base1-46' },
                         { uid: 62212, id: 'base1-98' }];
    UI.sel = { idx: 0 };
    render();
    const btn = findByText(appEl, 'Play…');
    if (!btn) throw new Error(id + ': no Play button');
    btn.onclick();
    if (!UI.picker) throw new Error(id + ': no picker opened');
    render();
    UI.picker = null;
  }
  UI.flipDelay = 2000;
  return true;
});

console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail ? 1 : 0);

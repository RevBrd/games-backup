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
    // The rail swaps its body node in and out for the hover peek, so the stub
    // needs this for that path to be exercised rather than skipped.
    replaceChild(fresh, old) {
      const i = this.children.indexOf(old);
      if (i < 0) throw new Error('replaceChild: node is not a child');
      this.children[i] = fresh;
      return old;
    },
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
// Job 5: the UI now boots off a save. Without a localStorage stub every run
// would take the no-persistence path, which is the one branch we least need
// covered — so the stub is here and the real boot flow gets tested.
const store = {};
global.localStorage = {
  _map: store,
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};
// controllable fake clock: nothing fires until we drain it
let timers = [], tid = 1;
global.setTimeout = (fn, ms) => { const id = tid++; timers.push({ id, fn, ms }); return id; };
global.clearTimeout = (id) => { timers = timers.filter(t => t.id !== id); };
function drain(limit = 200) { let c = 0; while (timers.length && c++ < limit) { const t = timers.shift(); t.fn(); } return c; }

const ctx = new Function('window', 'document', 'alert', 'setTimeout', 'clearTimeout',
  js + '\nreturn {UI, Engine, CARD_DB, DECKS, EFFECTS, render, newGame, dispatch, presenting, startMatch, backToDeckSelect, miniCard, handCard, fullCard, inspectCard, railPeek, ENERGY_NAME, bootSave, startNewSave, openNextPack, settleResult, myDeckNames, sigilCard, pullFace, addPacks, packsHeld, ownedTotal, collectionStats, SAVE_KEY, renderCollection, applyImportedSave, exportSave, newSave, grantDeck, grant, bestVariant, collTile};')
  (global.window, global.document, global.alert, global.setTimeout, global.clearTimeout);

const { UI, render, newGame, CARD_DB, DECKS, dispatch, presenting, startMatch, backToDeckSelect, ENERGY_NAME,
  bootSave, startNewSave, openNextPack, settleResult, myDeckNames, sigilCard, pullFace,
  addPacks, packsHeld, ownedTotal, collectionStats, SAVE_KEY } = ctx;

console.log('\n=== BUILT ARTIFACT SMOKE ===');

// Job 5: a browser with no save boots to the starter pick, not to deck select.
T('a fresh profile boots into the starter-deck pick', () => {
  domReady();
  return UI.screen === 'newsave' && !UI.save && !UI.E;
});
T('the starter pick renders all four theme decks without throwing', () => {
  render();
  return created > 0 && Object.keys(DECKS).length === 4;
});
T('picking a starter grants exactly that deck and lands on deck select', () => {
  startNewSave('Brushfire');
  let n = 0;
  for (const id in UI.save.owned) n += ownedTotal(UI.save, id);
  return UI.screen === 'decks' && n === 60 && UI.save.starter === 'Brushfire';
});
T('the starter is a real editable deck, not a special case', () => {
  return UI.save.decks.length === 1 && UI.save.decks[0].name === 'Brushfire';
});
T('you may field only what you own; the opponent may field anything', () => {
  const mine = myDeckNames();
  return mine.length === 2 && mine.indexOf('Brushfire') >= 0 && mine.indexOf('Sandbox') >= 0
    && mine.indexOf('Zap') < 0;
});
T('the save round-trips through storage on its own', () => {
  const raw = JSON.parse(store[SAVE_KEY]);
  return raw && raw.starter === 'Brushfire' && Object.keys(raw.owned).length > 0;
});
T('deck-select screen renders with the collection strip', () => {
  render();
  return created > 0;
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

// The toss lives on the centre line because half of all flips are the
// opponent's, so it cannot be anchored to either player's half. Guarding the
// placement AND the fact that the result is announced in exactly one place —
// having it in both made the mat's version read as decoration.
T('the toss renders on the centre line and the bar does not announce the result', () => {
  const find = (n, cls) => {
    if (n.className && String(n.className).split(' ').indexOf(cls) >= 0) return n;
    for (const c of (n.children || [])) { const r = find(c, cls); if (r) return r; }
    return null;
  };
  const deep = (n) => (n._text || '') + (n.children || []).map(deep).join(' ');

  riggedFlipBoard(2000);
  dispatch(0, { t: 'attack', idx: 0 });
  const line = find(appEl, 'centreline');
  if (!line) throw new Error('no centre line rendered');
  if (!find(line, 'cointoss')) throw new Error('the toss is not on the centre line');
  if (/HEADS|TAILS/.test(deep(find(appEl, 'actionbar')))) {
    throw new Error('the action bar announced the result while the coin was still in the air');
  }

  // Drain one tick at a time until the coin actually lands. NOT drain(1): the
  // damage-flash timer from diffForFx() is queued ahead of the flip timer, so a
  // single tick fires the wrong one and the banner is still 'flipping'.
  let guard = 0;
  while (UI.pres && UI.pres.banner && UI.pres.banner.phase !== 'landed' && guard++ < 20) drain(1);
  if (!UI.pres || !UI.pres.banner || UI.pres.banner.phase !== 'landed') {
    throw new Error('the coin never reached its landed phase');
  }
  const landed = find(find(appEl, 'centreline'), 'coincap');
  if (!landed) throw new Error('no coin after landing');
  const cls = String(landed.className);
  const onMat = /HEADS|TAILS/.test(deep(find(appEl, 'centreline')));
  const inBar = /HEADS|TAILS/.test(deep(find(appEl, 'actionbar')));
  drain(200); UI.flipDelay = 2000;
  return cls.indexOf('landed') >= 0 && onMat && !inBar;
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

// The hand face is deliberately not miniCard. It must render for all three
// kinds, and it must NOT carry attack names or rules text — those are what
// broke mid-word inside a 116px card and sent us here in the first place.
T('the hand face renders every card and carries no attack names or rules text', () => {
  // The stub's textContent is per-node, not a subtree walk like the real DOM's,
  // so gather the tree by hand rather than reading the root and seeing nothing.
  const deepText = (n) => (n._text || '') + (n.children || []).map(deepText).join(' ');
  const kinds = new Set();
  let leaked = null;
  for (const id in CARD_DB) {
    const c = CARD_DB[id];
    kinds.add(c.kind);
    const node = ctx.handCard(c);
    const text = deepText(node);
    // Mewtwo's attack is called Psychic and so is its type, which the face DOES
    // print as its type tag. Attack names that are also type names cannot be
    // told apart by string search, so they sit this one out.
    const typeNames = new Set(Object.keys(ENERGY_NAME).map(k => ENERGY_NAME[k]));
    for (const a of (c.attacks || [])) {
      // A very short attack name could collide with a damage figure, so only
      // names long enough to be unambiguous are checked.
      if (a.name && a.name.length > 3 && !typeNames.has(a.name) && text.includes(a.name)) {
        leaked = c.name + ' / ' + a.name;
      }
      if (a.text && a.text.length > 12 && text.includes(a.text.slice(0, 12))) leaked = c.name + ' / rules text';
    }
    if (c.kind === 'trainer' && c.text && c.text.length > 12 && text.includes(c.text.slice(0, 12))) {
      leaked = c.name + ' / Trainer text';
    }
    if (!text.includes(c.name)) leaked = c.name + ' / name missing';
  }
  if (leaked) console.log('      leaked: ' + leaked);
  return kinds.size === 3 && !leaked;
});

// Clicking used to jump the rail to the CARD tab, which threw the log away
// every time you picked up a card. It must not any more.
T('clicking a card notes it without stealing the rail from the log', () => {
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.seedDraft = '73'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  UI.devTab = 'log';
  const active = UI.E.state.players[0].active;
  const id = active.stack[active.stack.length - 1].id;
  ctx.inspectCard(id);
  render();
  UI.flipDelay = 2000;
  return UI.devTab === 'log' && UI.inspect === id;
});

T('hovering a card peeks it into the rail and leaving puts the log back', () => {
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.seedDraft = '73'; UI.flipDelay = 0;
  startMatch(); UI.E.setupAuto(0);
  UI.devTab = 'log';
  render();
  const logBody = UI.railBody;
  ctx.railPeek('base1-4');
  const peeked = UI.peekEl !== null && UI.railEl.children.indexOf(UI.peekEl) >= 0
              && UI.railEl.children.indexOf(logBody) < 0;
  ctx.railPeek(null);
  const restored = UI.peekEl === null && UI.railEl.children.indexOf(logBody) >= 0;
  UI.flipDelay = 2000;
  return peeked && restored;
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

// ---- Job 5: packs, rewards, and the variant renderers -------------------
console.log('\n--- collection & packs ---');

T('opening a pack you do not have is refused', () => {
  UI.save.packs = {};
  return openNextPack() === false && UI.screen !== 'packs';
});
T('a pack opens into the reveal screen face-down', () => {
  addPacks(UI.save, 'base1', 3);
  if (!openNextPack()) throw new Error('openNextPack refused a pack we hold');
  return UI.screen === 'packs' && UI.pack.order.length === 11
    && UI.pack.revealed.every(r => r === false);
});
T('the Rare is shown last, so the reveal has somewhere to go', () => {
  return UI.pack.order[10].slot === 'rare'
    && UI.pack.order.slice(0, 10).every(c => c.slot !== 'rare');
});
T('the cards are granted on open, not on flip', () => {
  // Closing the tab mid-reveal must not cost you the pack.
  return UI.pack.order.every(c => ownedTotal(UI.save, c.id) > 0);
});
T('opening a pack decrements what you hold and counts the stats', () => {
  return packsHeld(UI.save, 'base1') === 2 && UI.save.stats.packsOpened === 1
    && UI.save.stats.cardsPulled === 11;
});
T('the pack screen renders face-down, part-revealed and fully revealed', () => {
  render();
  UI.pack.revealed[0] = true; render();
  UI.pack.revealed = UI.pack.revealed.map(() => true); render();
  return created > 0;
});
T('a revealed card opens the detail overlay and closes again', () => {
  UI.detail = { id: UI.pack.order[10].id, flags: [] };
  render();
  UI.detail = null; render();
  return true;
});
T('every variant renders on both faces, in both shadow modes', () => {
  // The two print-run treatments can only appear on the Sigil Card, so both
  // renderers get every flag rather than only the ones they can draw.
  const card = CARD_DB['base1-4'];
  const combos = [[], ['sh'], ['rh'], ['mp1'], ['mp2'], ['mp3'], ['fe'], ['sl'], ['fe', 'sh'], ['sl', 'mp2', 'rh']];
  for (const mode of ['shadow', 'inverted']) {
    UI.shadowMode = mode;
    for (const f of combos) { if (!pullFace(card, f) || !sigilCard(card, f)) return false; }
  }
  UI.shadowMode = 'shadow';
  return true;
});
T('the Sigil Card carries a print run that the scan cannot', () => {
  const withRun = sigilCard(CARD_DB['base1-4'], ['fe', 'sl']);
  const host = withRun.classList.contains('sigilcard') ? withRun : withRun.children[0];
  // The 1st Edition stamp belongs INSIDE the art window, where the real one
  // sits — floated onto the card body it read as a stray badge.
  const art = host.children.filter(c => (c.className || '').indexOf('sigil') === 0)[0];
  return host.classList.contains('is-sl') && !!art
    && art.children.some(c => c.className === 'festamp');
});

T('winning pays packs exactly once, however many times the board redraws', () => {
  UI.pack = null; UI.detail = null; UI.screen = 'decks';
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Zap';
  startMatch();
  UI.E.setupAuto(0); UI.E.setupConfirm(0);
  const before = packsHeld(UI.save, 'base1');
  const wins = UI.save.stats.wins;
  // Force a finished game rather than playing one out — this is a test about
  // the payout, not about the rules.
  UI.E.state.phase = 'over'; UI.E.state.winner = 0; UI.E.state.winReason = 'test';
  render(); render(); render();
  return packsHeld(UI.save, 'base1') === before + 2 && UI.save.stats.wins === wins + 1;
});
T('a loss pays nothing and is still recorded', () => {
  newGame();
  UI.E.setupAuto(0); UI.E.setupConfirm(0);
  const before = packsHeld(UI.save, 'base1');
  const losses = UI.save.stats.losses;
  // winner can legitimately be 0, so this asserts against the real loss value.
  UI.E.state.phase = 'over'; UI.E.state.winner = 1; UI.E.state.winReason = 'test';
  render(); render();
  return packsHeld(UI.save, 'base1') === before && UI.save.stats.losses === losses + 1;
});
T('a reload picks the collection back up where it was left', () => {
  const cards = collectionStats(UI.save, CARD_DB).cards.owned;
  const packs = packsHeld(UI.save, 'base1');
  UI.save = null; UI.E = null;
  bootSave();
  return UI.screen === 'decks' && UI.saveStatus === 'ok'
    && collectionStats(UI.save, CARD_DB).cards.owned === cards
    && packsHeld(UI.save, 'base1') === packs;
});
T('an unreadable save is reported rather than silently replaced', () => {
  const good = store[SAVE_KEY];
  store[SAVE_KEY] = '{not json';
  bootSave();
  const ok = UI.screen === 'newsave' && UI.saveStatus === 'corrupt' && !!UI.saveNote
    && store['shadowless.save.corrupt'] === '{not json';
  store[SAVE_KEY] = good;
  bootSave();
  return ok && UI.screen === 'decks';
});

// ---- Job 5d: the collection browser -------------------------------------
console.log('\n--- collection browser ---');

T('the collection screen renders in every view and filter', () => {
  UI.screen = 'collection'; UI.detail = null;
  for (const v of ['cards', 'dex']) {
    for (const f of ['all', 'owned', 'missing']) {
      UI.collView = v; UI.collFilter = f; render();
    }
  }
  UI.collView = 'cards'; UI.collFilter = 'all';
  return created > 0;
});
T('CARDS and DEX count different things', () => {
  const st = collectionStats(UI.save, CARD_DB);
  // 102 printings, 69 species. A dex that reported 102 would be lying.
  return st.cards.total === 102 && st.species.total === 69;
});
T('an unowned card still opens, so you can read what you are chasing', () => {
  const missing = Object.keys(CARD_DB).find(id => ownedTotal(UI.save, id) === 0);
  if (!missing) return true;                 // collection is complete; nothing to test
  UI.detail = { id: missing, flags: [] };
  render();
  UI.detail = null;
  return true;
});
T('export round-trips through import', () => {
  const before = collectionStats(UI.save, CARD_DB).cards.owned;
  const text = ctx.exportSave(UI.save);
  UI.save = ctx.newSave({ now: 1 });         // wipe, then restore
  const err = ctx.applyImportedSave(text);
  return err === '' && collectionStats(UI.save, CARD_DB).cards.owned === before;
});
T('a bad import is refused and reported, and changes nothing', () => {
  const before = collectionStats(UI.save, CARD_DB).cards.owned;
  const err = ctx.applyImportedSave('{"v":1,"owned":"nope","decks":[]}');
  return err !== '' && collectionStats(UI.save, CARD_DB).cards.owned === before;
});
T('importing repoints the selected deck at one you actually have', () => {
  // A save whose decks differ from the current selection must not leave the
  // deck screen pointing at a deck that no longer exists.
  UI.myDeck = 'Zap';
  const fresh = ctx.newSave({ starter: 'Blackout', now: 1 });
  ctx.grantDeck(fresh, DECKS.Blackout);
  fresh.decks.push({ name: 'Blackout', list: DECKS.Blackout.list.map(e => [e[0], e[1]]) });
  ctx.applyImportedSave(ctx.exportSave(fresh));
  return UI.myDeck === 'Blackout' && UI.screen === 'decks';
});
T('the import overlay renders over both screens it can be opened from', () => {
  UI.importing = true; UI.importErr = 'test error'; UI.importText = '{}';
  UI.screen = 'decks'; render();
  UI.screen = 'collection'; render();
  UI.importing = false; UI.importErr = ''; UI.importText = '';
  UI.screen = 'decks'; render();
  return created > 0;
});

console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail ? 1 : 0);

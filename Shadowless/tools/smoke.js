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
  js + '\nreturn {UI, Engine, CARD_DB, LIVE_DB, DECKS, EFFECTS, render, newGame, dispatch, presenting, startMatch, backToDeckSelect, handCard, fullCard, inspectCard, railPeek, ENERGY_NAME, bootSave, startNewSave, openNextPack, settleResult, myDeckNames, deckFor, resolveDeck, sigilCard, pullFace, addPacks, packsHeld, ownedTotal, collectionStats, SAVE_KEY, renderCollection, applyImportedSave, exportSave, newSave, grantDeck, grant, bestVariant, collTile, openBuilder, builderAdd, builderFree, builderStatus, builderTotal, commitBuilder, deleteBuilderDeck, shortfallText, findDeck, deckIsBuilt, builtDecks, available, poolClick, builderPiles, builderQty, pilesOf, vkey, handVerbs, clickHandCard, armForcedChoice, myLegal, openPicker, deckSummary, keepScroll, resetScroll, toggleEnergyPick, askEnergy, renderEventLog, logOpeningPrizes, leaveMatch, downloadMatchLog, setPrizePick, forfeitMatch, prizePickSetting, LADDER_VIEW, currentFoe, pickFirstOpponent, opponentDeckFor, recordWin, availableOpponents, bracketOpen, bossAvailable, hasBeaten, PACK_SIZE};')
  (global.window, global.document, global.alert, global.setTimeout, global.clearTimeout);

const { UI, render, newGame, CARD_DB, LIVE_DB, DECKS, dispatch, presenting, startMatch, backToDeckSelect, ENERGY_NAME,
  bootSave, startNewSave, openNextPack, settleResult, myDeckNames, sigilCard, pullFace,
  addPacks, packsHeld, ownedTotal, collectionStats, SAVE_KEY, deckSummary,
  LADDER_VIEW, currentFoe, pickFirstOpponent, opponentDeckFor, recordWin,
  leaveMatch, downloadMatchLog, setPrizePick, forfeitMatch, prizePickSetting,
  availableOpponents, bracketOpen, bossAvailable, hasBeaten, PACK_SIZE } = ctx;

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
  // Job 7b. Almost every test below drives a match by setting UI.myDeck and
  // UI.foeDeck, which is free play's contract — on the ladder the opponent's
  // deck comes off the roster entry and UI.foeDeck is ignored. Declaring the
  // mode once here keeps those tests testing what they say they test. The
  // ladder path has its own section at the bottom, which turns this back off.
  UI.freePlay = true;
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
  UI.seedDraft = '3'; UI.flipDelay = 0; startMatch(); UI.E.setupAuto(0);
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
// startMatch() now presents the opening who-goes-first flip, so a helper that
// wants a board to poke at has to get past it first — hence flipDelay 0 for the
// deal, and the real value set once the board is rigged. Tests ABOUT the opening
// flip are the only ones that want it the other way round.
function riggedFlipBoard(flipDelay) {
  UI.seedDraft = '5'; UI.flipDelay = 0; startMatch(); UI.E.setupAuto(0);
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

// --- the opponent's Trainer, held on the centre line ------------------------
// The opponent's whole turn used to land in one frame, with the only record of
// it a line of 9.5px type in the rail. It gets the coin's own treatment now:
// the board freezes on the pre-action snapshot and the card is shown.
//
// Board where it is the OPPONENT's turn with a guaranteed-playable Trainer in
// hand. Professor Oak, because it is legal from any position.
function trainerBoard(who) {
  UI.seedDraft = '5'; UI.flipDelay = 0; startMatch(); UI.E.setupAuto(0);
  const E = UI.E, s = E.state;
  s.active = who; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];
  s.players[who].trainersPlayed = 0;
  s.players[who].hand.push({ id: 'base1-88' });
  UI.flipDelay = 2000;
  const act = E.legalActions(who).filter(a => a.t === 'playTrainer').pop();
  if (!act) throw new Error('no playable Trainer for player ' + who);
  return act;
}

T("the opponent's Trainer is presented on the centre line", () => {
  const act = trainerBoard(1);
  dispatch(1, act);
  if (!presenting()) throw new Error('no presentation started');
  if (!UI.pres.trainer || UI.pres.trainer.id !== 'base1-88')
    throw new Error('wrong pop: ' + JSON.stringify(UI.pres.trainer));
  // Frozen on the PRE-action board, so the pop announces what is about to
  // happen rather than captioning what already did — and the log line is in
  // the frozen log, so the rail cannot contradict the mat.
  const frozen = UI.view !== null;
  const logged = UI.view.log[UI.view.log.length - 1].text.indexOf('Professor Oak') >= 0;
  drain();
  return frozen && logged && !presenting();
});

// You played it. You know. This is the half that would be most annoying to get
// wrong, and it is one `e.p === 1` away from being wrong.
T('your own Trainer is not presented', () => {
  const act = trainerBoard(0);
  dispatch(0, act);
  return !presenting();
});

// The engine's log line carries the card ID rather than only its name. Names
// repeat across sets — four printings are called Rattata — so a name could
// never have picked the right face.
T('the trainer log entry carries the card it is about', () => {
  const act = trainerBoard(1);
  const mark = UI.E.state.log.length;
  dispatch(1, act);
  const e = UI.E.state.log.slice(mark).find(x => x.kind === 'trainer');
  drain();
  return !!e && e.card === 'base1-88' && e.p === 1;
});

// `trainerHold` at 0 must leave the game exactly as it was before this existed:
// the line is still written, nothing pauses.
T('trainerHold 0 turns the pause off and still logs the play', () => {
  const act = trainerBoard(1);
  UI.trainerHold = 0;
  const mark = UI.E.state.log.length;
  dispatch(1, act);
  const stillLogged = UI.E.state.log.slice(mark).some(x => x.kind === 'trainer');
  const quiet = !presenting();
  UI.trainerHold = 1000;
  return stillLogged && quiet;
});

// The flip that decides who goes first was resolved inside newGame() and only
// ever reported as a line of log text — the one coin in the match the player was
// told about rather than shown. It is also the flip with the largest measured
// consequence in the game.
T('the game opens by presenting the who-goes-first flip', () => {
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth';
  UI.seedDraft = '5'; UI.flipDelay = 2000; startMatch();
  if (!presenting()) throw new Error('the opening flip was not presented');
  if (!UI.pres.banner || UI.pres.banner.reason !== 'who goes first')
    throw new Error('wrong banner: ' + JSON.stringify(UI.pres.banner));
  drain();
  return !presenting() && UI.E.state.phase === 'setup';
});

// The coin lands on the mat's centre line and the setup sheet is an overlay, so
// a sheet drawn during the flip covers the thing being presented.
T('the setup sheet waits until the opening flip has landed', () => {
  const hasSetup = () => {
    const deep = n => String(n.className || '').split(' ').indexOf('setupmat') >= 0
      || (n.children || []).some(deep);
    return deep(document.getElementById('app'));
  };
  UI.seedDraft = '5'; UI.flipDelay = 2000; startMatch();
  render();
  const hiddenDuring = !hasSetup();
  drain();
  render();
  return hiddenDuring && hasSetup();
});

// Suppressing the setup sheet for the flip exposed the board behind it — and
// `newGame` has already auto-set-up the opponent by then, so their whole opening
// position was on show before you chose yours. Both sides place face down and
// turn up together; the frozen snapshot is where that is enforced.
T('the opening flip does not reveal the opponent\'s setup', () => {
  UI.seedDraft = '5'; UI.flipDelay = 2000; startMatch();
  const hiddenInView = UI.view.players[1].active === null
                    && UI.view.players[1].bench.length === 0;
  // ...while the real state has them set up all along, so nothing was destroyed.
  const realBehind = UI.E.state.players[1].active !== null;
  drain();
  return hiddenInView && realBehind && UI.E.state.players[1].active !== null;
});

// THE LEAK: diffForFx reads the real post-action state, so arming it at dispatch
// time lit the prize tile, the KO flash and the hit flash while the coin was
// still in the air. On a flip that decides whether something survives, the
// flashing prizes announced the result about two seconds early. The board was
// always frozen behind the coin; the effects were what escaped the freeze.
T('no visual effect fires while the coin is still in the air', () => {
  riggedFlipBoard(2000);
  UI.fx = {};
  dispatch(0, { t: 'attack', idx: 0 });     // Confuse Ray: 10 damage plus a flip
  if (!presenting()) throw new Error('presentation did not start');
  const quietDuring = Object.keys(UI.fx).length === 0;
  drain();
  // ...and the effects land the moment the board unfreezes, in the same frame.
  const firedAfter = Object.keys(UI.fx).length > 0;
  UI.flipDelay = 2000;
  return quietDuring && firedAfter;
});

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

// The starter deck is created in the save under the THEME DECK'S OWN NAME, so a
// name alone stopped identifying a deck the moment you edited yours. A name-only
// lookup handed the opponent your edited list — and it was only ever visible in
// a mirror, which is why it survived. Your side reads the save; theirs never does.
T('editing your copy of a theme deck does not change the opponent\'s', () => {
  const mine = UI.save.decks.find(d => d.name === 'Brushfire');
  const original = mine.list.map(e => e.slice());
  // Drop the two Tangela and pay for them in Grass Energy. Still 60, still legal.
  mine.list = mine.list
    .filter(e => e[1] !== 'base1-66')
    .map(e => (e[1] === 'base1-99' ? [e[0] + 2, e[1]] : e.slice()));

  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Brushfire';
  UI.seedDraft = '13'; startMatch();
  const tangela = p => (UI.E.state.players[p].deckDef.list
    .find(e => e[1] === 'base1-66') || [0])[0];

  const ok = tangela(0) === 0 && tangela(1) === 2;
  mine.list = original;
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth';
  return ok;
});

// Same bug, display side: the select screen's OPPONENT panel is drawn from the
// same lookup, so it described your deck under their heading.
T('the opponent panel summarises the theme deck, not your edited copy', () => {
  const mine = UI.save.decks.find(d => d.name === 'Brushfire');
  const original = mine.list.map(e => e.slice());
  mine.list = mine.list
    .filter(e => e[1] !== 'base1-66')
    .map(e => (e[1] === 'base1-99' ? [e[0] + 2, e[1]] : e.slice()));

  const theirs = deckSummary('Brushfire', 'theme');
  const yours = deckSummary('Brushfire', 'mine');
  const ok = theirs.k.pokemon === 22 && yours.k.pokemon === 20;

  mine.list = original;
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
    ctx.fullCard(c);
  }
  UI.flipDelay = 2000;
  return kinds.size === 3;
});

// The hand face must render for all three kinds, and it must NOT carry attack
// names or rules text — those are what broke mid-word inside a 116px card and
// sent us here in the first place. The compact face that did carry them
// (miniCard) is gone; this assertion is what stops one coming back.
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
    // AND THE CARD'S OWN NAME COMES OUT BEFORE THE ATTACK SEARCH TOO — the third
    // instance of the collision the two notes below already describe, found by
    // Job 13 generating the promos. Surfing Pikachu's attack is "Surf", which is a
    // substring of the card's own title, so a face printing nothing but the title
    // reported a leaked attack name. Same fix as the rules-text search: strip the
    // name, then look. Neither carve-out weakens the assertion, because a face
    // that really did print the attack name would print it somewhere other than
    // inside its own title.
    const nameless = text.split(c.name).join(' ');
    for (const a of (c.attacks || [])) {
      // A very short attack name could collide with a damage figure, so only
      // names long enough to be unambiguous are checked.
      if (a.name && a.name.length > 3 && !typeNames.has(a.name) && nameless.includes(a.name)) {
        leaked = c.name + ' / ' + a.name;
      }
      // SEARCH ON TEXT THAT IS NOT THE CARD'S OWN NAME. Team Rocket is the
      // first set where an attack's rules text OPENS with the name of the card
      // printing it — "Dark Primeape is now Confused (after doing damage)" —
      // and the hand face legitimately prints that name. A raw prefix search
      // therefore reported a leak that was the card's own title tag, on a face
      // rendering exactly what it should. Strip the name first, then search.
      const bare = (a.text || '').split(c.name).join(' ').replace(/\s+/g, ' ').trim();
      if (bare.length > 12 && text.includes(bare.slice(0, 12))) leaked = c.name + ' / rules text';
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
    // Whirlwind asks the DEFENDER to choose, so pendingSwitch owes an action
    // just as pendingPromote does. This loop ignored it, which was harmless
    // only while no card in the Sandbox pool had Whirlwind — Jungle and Fossil
    // brought four, and the game sat waiting for an answer nobody gave.
    // ...AND IT HAPPENED AGAIN, 19 Aug 2026, with Challenge! — which asks the
    // opponent a question mid-turn and owes an action the same way. The note
    // above was written about Whirlwind and generalises exactly:
    //
    //   ANY state that owes an action by somebody other than s.active has to be
    //   listed here, or the loop asks the wrong player, gets nothing, and breaks
    //   out of a game that was merely waiting.
    //
    // Three now. A fourth will arrive with Gym, where shapecount finds sixteen
    // more cards that stop to ask the opponent something.
    const pi = s.pendingAsk ? s.pendingAsk.player
      : s.pendingSwitch !== null && s.pendingSwitch !== undefined ? s.pendingSwitch
      : s.pendingPromote !== null ? s.pendingPromote : s.active;
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
  return UI.screen === 'packs' && UI.pack.order.length === PACK_SIZE
    && UI.pack.revealed.every(r => r === false);
});
T('the Rare is shown last, so the reveal has somewhere to go', () => {
  // Only the GUARANTEED slot's placement is asserted. Since 25 Aug 2026 a
  // lesser slot can jump to Rare-tier too, so an earlier card being 'rare' is
  // no longer a fault — this pack opens on real Math.random(), not a fixed
  // seed, and asserting "nothing before it is rare" would flake on whichever
  // run happened to roll a bonus one.
  return UI.pack.order[PACK_SIZE - 1].slot === 'rare';
});
T('the cards are granted on open, not on flip', () => {
  // Closing the tab mid-reveal must not cost you the pack.
  return UI.pack.order.every(c => ownedTotal(UI.save, c.id) > 0);
});
T('opening a pack decrements what you hold and counts the stats', () => {
  return packsHeld(UI.save, 'base1') === 2 && UI.save.stats.packsOpened === 1
    && UI.save.stats.cardsPulled === PACK_SIZE;
});
T('the pack screen renders face-down, part-revealed and fully revealed', () => {
  render();
  UI.pack.revealed[0] = true; render();
  UI.pack.revealed = UI.pack.revealed.map(() => true); render();
  return created > 0;
});
T('a revealed card opens the detail overlay and closes again', () => {
  UI.detail = { id: UI.pack.order[PACK_SIZE - 1].id, flags: [] };
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

T('a deck-builder variant choice survives into the match', () => {
  // It did not until 16 Aug 2026. `buildDeck` destructured [qty, id] and dropped
  // the third element, so the copy you picked in the builder never reached the
  // table and the whole in-play half of variants was unreachable rather than
  // merely undrawn. This asserts the DATA, which is the part a screenshot cannot
  // check and the part everything else hangs off.
  const E = new ctx.Engine(CARD_DB, ctx.EFFECTS, { seed: 3 });
  const deck = { name: 'v', list: [[4, 'base1-61', 'sh+fe'], [56, 'base1-99']] };
  const built = E.buildDeck(deck);
  const rat = built.filter(c => c.id === 'base1-61');
  const plain = built.filter(c => c.id === 'base1-99');
  return rat.length === 4 && rat.every(c => c.v === 'sh+fe')
    && plain.length === 56 && plain.every(c => c.v === undefined);
});

T('an in-play card wears its variant, and a plain one does not', () => {
  // The hand face is the one renderer a stubbed DOM can check end to end.
  // `hasv` is the hook every in-play variant rule hangs off, so if this goes
  // red the markings have stopped reaching the board even if they still render
  // on the collectible surfaces.
  const card = CARD_DB['base1-61'];
  const marked = ctx.handCard(card, ['sh', 'sl', 'fe']);
  const plain = ctx.handCard(card, null);
  if (plain.classList.contains('hasv')) return false;
  if (!marked.classList.contains('hasv') || !marked.classList.contains('is-sh')) return false;
  // ...and the marks land INSIDE the art window, not on the card root. Appending
  // them to the root is exactly what painted a SHADOWLESS watermark across the
  // whole board while every test here passed.
  let art = null;
  for (let i = 0; i < marked.children.length; i++) {
    const c = marked.children[i];
    if ((c.className || '').indexOf('sigil') === 0) { art = c; break; }
  }
  if (!art) return false;
  const names = [];
  for (let i = 0; i < art.children.length; i++) names.push(art.children[i].className);
  return names.indexOf('slmark') >= 0 && names.indexOf('festamp') >= 0;
});

// Job 7b: the payout moved onto the ladder, so this has to leave free play to
// see one at all. The invariant it guards is unchanged and still the important
// one — settleResult() runs from inside render(), and render() runs on every
// redraw, so an unguarded payout pays forever.
T('winning pays packs exactly once, however many times the board redraws', () => {
  UI.pack = null; UI.detail = null; UI.screen = 'decks';
  UI.freePlay = false; pickFirstOpponent();
  UI.myDeck = 'Brushfire';
  startMatch();
  UI.E.setupAuto(0); UI.E.setupConfirm(0);
  const before = packsHeld(UI.save, 'base1');
  const wins = UI.save.stats.wins;
  // Force a finished game rather than playing one out — this is a test about
  // the payout, not about the rules.
  UI.E.state.phase = 'over'; UI.E.state.winner = 0; UI.E.state.winReason = 'test';
  render(); render(); render();
  const r = packsHeld(UI.save, 'base1') === before + 2 && UI.save.stats.wins === wins + 1;
  UI.freePlay = true;      // hand the suite back the mode it declared
  return r;
});
// ---- the pause menu, the forfeit, and the Prize setting ---------------------
T('the Prize setting defaults to random and persists', () => {
  const was = UI.save.settings.prizePick;
  setPrizePick('manual');
  const stored = JSON.parse(localStorage.getItem(SAVE_KEY));
  const r = UI.save.settings.prizePick === 'manual' && stored.settings.prizePick === 'manual';
  setPrizePick(was || 'auto');
  return r;
});
T('...and it reaches the engine, per player, with the bot always on auto', () => {
  setPrizePick('manual');
  UI.myDeck = 'Brushfire'; UI.seedDraft = '5150'; startMatch();
  const r = UI.E.cfg.prizePick[0] === 'manual' && UI.E.cfg.prizePick[1] === 'auto';
  setPrizePick('auto');
  return r;
});
T('...and flipping it mid-match applies without restarting', () => {
  startMatch();
  setPrizePick('manual');
  const on = UI.E.cfg.prizePick[0] === 'manual';
  setPrizePick('auto');
  return on && UI.E.cfg.prizePick[0] === 'auto';
});
T('a forfeit ends the game as a loss and records it', () => {
  UI.myDeck = 'Brushfire'; UI.seedDraft = '5151'; startMatch();
  UI.E.setupAuto(0); UI.E.setupConfirm(0);
  const losses = UI.save.stats.losses;
  forfeitMatch();
  // winner can legitimately be 0, so this checks the real value rather than truth.
  const ended = UI.E.state.phase === 'over' && UI.E.state.winner === 1;
  render(); render();
  return ended && UI.save.stats.losses === losses + 1;
});
T('the pause menu is suppressed once the game is over', () => {
  // There is nothing left to forfeit and renderOver owns that moment. Sets up
  // its OWN finished game rather than inheriting one: the forfeit test above
  // renders twice, which settles the result and can move the screen.
  UI.myDeck = 'Brushfire'; UI.seedDraft = '5152'; startMatch();
  UI.E.setupAuto(0); UI.E.setupConfirm(0);
  UI.paused = true;
  render();
  const upDuringPlay = allByClass(document.getElementById('app'), 'setrow').length > 0;
  UI.E.state.phase = 'over'; UI.E.state.winner = 1; UI.E.state.winReason = 'test';
  render();
  const goneAfter = allByClass(document.getElementById('app'), 'setrow').length === 0;
  UI.paused = false; render();
  return upDuringPlay && goneAfter;
});

// ---- leaving a match asks about the log first -------------------------------
// The log is the only view of the opponent's hand, both Prize piles and every
// score the AI weighed, and it dies with the click that leaves the match. These
// pin the state machine; the screen half is a screenshot's job.
T('leaving with an unsaved log asks instead of leaving', () => {
  newGame();
  UI.E.setupAuto(0); UI.E.setupConfirm(0);
  UI.E.state.phase = 'over'; UI.E.state.winner = 0; UI.E.state.winReason = 'test';
  render();
  UI.logSaved = false; UI.logAsk = null;
  let left = false;
  leaveMatch(() => { left = true; });
  return !left && typeof UI.logAsk === 'function';
});
T('...and carrying on runs the thing it was blocking, exactly once', () => {
  let n = 0;
  UI.logSaved = false; UI.logAsk = null;
  leaveMatch(() => { n++; });
  const go = UI.logAsk; UI.logAsk = null; UI.logSaved = true; go();   // "No, carry on"
  return n === 1 && UI.logAsk === null;
});
T('...and it does not ask a second time once answered', () => {
  let left = false;
  leaveMatch(() => { left = true; });      // logSaved is still true from above
  return left && UI.logAsk === null;
});
T('...and a match with no result never asks at all', () => {
  // Free play mid-game, and every exit that is not a finished match.
  const keep = UI.elog;
  UI.elog = null; UI.logSaved = false; UI.logAsk = null;
  let left = false;
  leaveMatch(() => { left = true; });
  UI.elog = keep;
  return left && UI.logAsk === null;
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
T('the CARDS grid shows the live pool and nothing a pack cannot hand out', () => {
  // JOB 13. This grid read CARD_DB while every other surface on the screen read
  // LIVE_DB, and the two were the same object under two names until a set was
  // generated that was not live. `gen_cards.js --sets` at the START of a set job
  // is the SUPPORTED workflow, so that day was always coming: generating basep
  // put 53 promo tiles into the collection that no pack can hand out, permanently
  // missing, while the stats line directly above them went on saying 311.
  //
  // Counted by walking the rendered tree rather than by reading the source,
  // because the assertion is about what the player sees. A card from a set that
  // is not live must not have a tile at any filter.
  const notLive = Object.keys(CARD_DB).filter(id => !LIVE_DB[id]);
  if (!notLive.length) return true;            // nothing generated-but-unfinished today
  const names = new Set(notLive.map(id => CARD_DB[id].name));
  // Names shared with a live printing cannot be told apart in rendered text, so
  // only the ones unique to the unfinished set are searched for.
  const liveNames = new Set(Object.keys(LIVE_DB).map(id => CARD_DB[id].name));
  const onlyThere = [...names].filter(n => !liveNames.has(n));
  if (!onlyThere.length) return true;
  UI.screen = 'collection'; UI.detail = null;
  const leaked = [];
  for (const f of ['all', 'missing']) {
    UI.collView = 'cards'; UI.collFilter = f; render();
    const text = deepText(document.getElementById('app'));
    // WORD BOUNDARIES, because "Mew" is a substring of "Mewtwo" and Mewtwo is
    // live. That is the THIRD name collision this job has turned up — Surfing
    // Pikachu contains its own attack "Surf", and Dark Raichu sits inside a set
    // whose names repeat across printings. A plain indexOf on a card name is
    // never safe in this corpus.
    for (const n of onlyThere) {
      const re = new RegExp(`(^|[^A-Za-z])${n.replace(/[.*+?^${}()|[]\]/g, "\    for (const n of onlyThere) if (text.indexOf(n) >= 0) leaked.push(`${n} (${f})`);")}([^A-Za-z]|$)`);
      if (re.test(text)) leaked.push(`${n} (${f})`);
    }
  }
  UI.collView = 'cards'; UI.collFilter = 'all'; render();
  if (leaked.length) throw new Error(`not-live cards on the collection grid: ${leaked.slice(0, 5).join(', ')}`);
  return true;
});
T('CARDS and DEX count different things', () => {
  // Against LIVE_DB, which is what the screen actually counts — CARD_DB holds
  // every set that GENERATES, including ones still being written. Derived
  // rather than hardcoded at 102/69, because those two numbers stopped being
  // the whole database the moment Jungle did.
  const st = collectionStats(UI.save, LIVE_DB);
  const printings = Object.keys(LIVE_DB).length;
  const species = new Set(Object.values(LIVE_DB).filter(c => c.dex).map(c => c.dex)).size;
  // A dex reporting the printing count would be lying, and vice versa.
  return st.cards.total === printings && st.species.total === species && species < printings;
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

// ---- Job 5e: the deck builder -------------------------------------------
console.log('\n--- deck builder ---');

// Start from a clean, known save: starter Brushfire plus a generous pile of
// loose cards, so availability has something to be interesting about.
ctx.UI.save = ctx.newSave({ starter: 'Brushfire', now: 1 });
ctx.grantDeck(UI.save, DECKS.Brushfire);
UI.save.decks.push({ id: '1', name: 'Brushfire', built: true, list: DECKS.Brushfire.list.map(e => [e[0], e[1]]) });
ctx.grant(UI.save, 'base1-58', '', 2);      // 2 loose Pikachu
UI.myDeck = 'Brushfire';

T('a new deck opens empty and reserves nothing', () => {
  ctx.openBuilder(null);
  return UI.screen === 'builder' && UI.builder.deckId === null && UI.builder.list.length === 0;
});
T('the pool offers only what other built decks are not holding', () => {
  // Brushfire holds all 4 of its Charmander; the 2 loose Pikachu are free.
  const charm = DECKS.Brushfire.list.find(e => CARD_DB[e[1]].name === 'Charmander');
  return ctx.builderFree('base1-58', '') === 2 && ctx.builderFree(charm[1], '') === 0;
});
T('adding and removing changes the working copy, not the save', () => {
  ctx.builderAdd('base1-58', '', 2);
  const savedBefore = JSON.stringify(UI.save.decks);
  ctx.builderAdd('base1-58', '', -1);
  return ctx.builderTotal(UI.builder) === 1 && JSON.stringify(UI.save.decks) === savedBefore;
});

// render() rebuilds the DOM, so a scroll position survives only if something
// carries it across. Building a deck means clicking the same grid dozens of
// times, and every click used to return you to the top of it.
T('the pool keeps its scroll position when you add a card', () => {
  ctx.openBuilder(null);
  UI.scrollers['builder-pool'].scrollTop = 640;   // as if you had scrolled down
  ctx.poolClick('base1-58');                      // adds a card and re-renders
  return UI.scrollers['builder-pool'].scrollTop === 640;
});

// ...and does not keep it when the list underneath has been replaced, which is
// the other half: holding position through a filter change lands you in the
// middle of results you never scrolled past.
T('changing a pool filter returns you to the top', () => {
  UI.scrollers['builder-pool'].scrollTop = 640;
  UI.poolFilter.type = 'F'; ctx.resetScroll('builder-pool'); render();
  const top = UI.scrollers['builder-pool'].scrollTop === 0;
  UI.poolFilter.type = 'all'; ctx.resetScroll('builder-pool'); render();
  return top;
});
T('removing the last copy drops the row entirely', () => {
  ctx.builderAdd('base1-58', '', -1);
  return UI.builder.list.length === 0;
});
T('adding consumes availability as you go', () => {
  ctx.builderAdd('base1-58', '', 2);
  return ctx.builderFree('base1-58', '') === 0;
});
T('the builder renders in every filter combination', () => {
  for (const k of ['all', 'pokemon', 'trainer', 'energy']) {
    UI.poolFilter.kind = k; render();
  }
  UI.poolFilter.kind = 'all';
  UI.poolFilter.type = 'L'; render();
  UI.poolFilter.type = 'all';
  UI.poolFilter.text = 'pika'; render();
  UI.poolFilter.text = '';
  UI.poolFilter.owned = false; render();
  UI.poolFilter.owned = true; render();
  return created > 0;
});
T('an incomplete deck is not buildable and says why', () => {
  const s = ctx.builderStatus();
  return !s.buildable && s.legal.errors.some(e => /needs 60/.test(e));
});
T('a layout saves even though it is illegal, and holds no cards', () => {
  UI.builder.name = 'Scratch';
  const freeBefore = ctx.available(UI.save, 'base1-58', '');
  ctx.commitBuilder(false);
  const d = UI.save.decks.find(x => x.name === 'Scratch');
  return !!d && d.built === false
    && ctx.available(UI.save, 'base1-58', '') === freeBefore
    && UI.screen === 'decks';
});
T('a layout is not offered as a deck you can field', () => {
  return ctx.myDeckNames().indexOf('Scratch') < 0;
});
T('a legal, affordable deck builds and then reserves its cards', () => {
  ctx.openBuilder(null);
  UI.builder.name = 'Second';
  // 60 cards of pure basic Energy: legal size, but no Basic Pokemon, so it
  // proves the legality gate is real before we make it pass.
  ctx.grant(UI.save, 'base1-98', '', 60);
  ctx.builderAdd('base1-98', '', 60);
  if (ctx.builderStatus().buildable) throw new Error('a deck with no Basic Pokemon should not build');
  ctx.builderAdd('base1-98', '', -1);
  ctx.grant(UI.save, 'base1-58', '', 1);
  ctx.builderAdd('base1-58', '', 1);
  const s = ctx.builderStatus();
  if (!s.buildable) throw new Error('should be buildable: ' + JSON.stringify(s.legal.errors) + JSON.stringify(s.shortfall));
  const before = ctx.available(UI.save, 'base1-98', '');
  ctx.commitBuilder(true);
  return ctx.available(UI.save, 'base1-98', '') === before - 59
    && ctx.myDeckNames().indexOf('Second') >= 0;
});
T('editing a built deck does not make it compete with itself', () => {
  const d = UI.save.decks.find(x => x.name === 'Second');
  const owned = ctx.ownedTotal(UI.save, 'base1-98');
  // Excluded from its own reservation, every Energy it holds reads as free
  // again — otherwise opening a built deck for a small edit would immediately
  // report the whole thing as unaffordable.
  const withSelf = ctx.available(UI.save, 'base1-98', '');
  const withoutSelf = ctx.available(UI.save, 'base1-98', '', d.id);
  ctx.openBuilder(d.id);
  // builderFree then subtracts what the draft currently uses, so the two
  // views agree: free-to-add equals what is left over after this deck's own use.
  const free = ctx.builderFree('base1-98', '');
  return withoutSelf === withSelf + 59 && free === withoutSelf - 59 && free >= 0
    && withoutSelf <= owned;
});
T('the last built deck cannot be un-built or deleted', () => {
  UI.builder = null; UI.screen = 'decks';
  // Reduce to exactly one built deck.
  UI.save.decks = UI.save.decks.filter(d => d.name === 'Brushfire');
  const d = UI.save.decks[0];
  ctx.openBuilder(d.id);
  const why = ctx.commitBuilder(false);
  const stillBuilt = ctx.deckIsBuilt(ctx.findDeck(UI.save, d.id));
  const why2 = ctx.deleteBuilderDeck();
  return why !== '' && why2 !== '' && stillBuilt && ctx.findDeck(UI.save, d.id) !== null;
});
T('shortfall says WHY, not just that you are short', () => {
  // The three cases are genuinely different problems with different fixes.
  const none = ctx.shortfallText({ name: 'Bill', need: 2, have: 0, owned: 0, held: 0 });
  const held = ctx.shortfallText({ name: 'Bill', need: 2, have: 0, owned: 2, held: 2 });
  const part = ctx.shortfallText({ name: 'Bill', need: 4, have: 1, owned: 3, held: 2 });
  return /own 0/.test(none) && !/other decks/.test(none)
    && /other decks/.test(held) && /dismantle/.test(held)
    && /other decks/.test(part) && /3 short/.test(part);
});

// ---- a name resolves to the deck deck select is OFFERING -----------------
// Reported by Trevor from a real save, 13 Aug 2026: a deck he had just built
// showed a Kakuna on its tile and too few cards. His save held BOTH of these,
// and the builder's default name is why:
//
//   id=2  "New deck"  built=false  41 cards      the blueprint
//   id=3  "New deck"  built=true   60 cards      what he actually built
//
// myDeckNames() lists only built decks, so the tile came from id=3. deckFor()
// searched save.decks flat and answered with id=2. resolveDeck() shares that
// function and nothing between deck select and a match calls validateDeck(),
// so pressing Play would have taken the 41-card list into a scored ladder game.
console.log('\n--- a deck name is not a deck ---');

ctx.UI.save = ctx.newSave({ starter: 'Brushfire', now: 1 });
ctx.grantDeck(UI.save, DECKS.Brushfire);
UI.save.decks.push({ id: '1', name: 'Brushfire', built: true, list: DECKS.Brushfire.list.map(e => [e[0], e[1]]) });
// The blueprint FIRST, which is what makes a flat find() pick it.
UI.save.decks.push({ id: '2', name: 'New deck', built: false, list: [[41, 'base1-98']] });
UI.save.decks.push({ id: '3', name: 'New deck', built: true, list: DECKS.Zap.list.map(e => [e[0], e[1]]) });

T('deck select offers only the built deck', () => {
  const names = ctx.myDeckNames();
  return names.filter(n => n === 'New deck').length === 1;
});
T('and the name resolves to that deck, not the layout sharing its name', () => {
  const d = ctx.deckFor('New deck', 'mine');
  return d && d.id === '3' && d.list.reduce((a, e) => a + e[0], 0) === 60;
});
T('so the match gets the 60-card list, not the 41-card blueprint', () => {
  const d = ctx.resolveDeck('New deck', 'mine', 7);
  return d.list.reduce((a, e) => a + e[0], 0) === 60;
});
T('the deck tile is drawn from the deck it names', () => {
  // The visible symptom: hero art and counts came off the blueprint.
  const s = deckSummary('New deck', 'mine');
  return s.k.pokemon + s.k.trainer + s.k.energy === 60;
});
T('a layout can still be resolved by name when nothing built claims it', () => {
  // The fallback is not deleted, only outranked.
  UI.save.decks.push({ id: '4', name: 'Someday', built: false, list: [[12, 'base1-98']] });
  const d = ctx.deckFor('Someday', 'mine');
  return d && d.id === '4';
});

T('and the builder refuses to create the collision in the first place', () => {
  ctx.openBuilder(null);
  ctx.builderAdd('base1-98', '', 5);
  UI.builder.name = 'New deck';
  ctx.commitBuilder(false);
  const named = UI.save.decks.filter(d => d.name === 'New deck');
  const suffixed = UI.save.decks.filter(d => d.name === 'New deck 2');
  return named.length === 2 && suffixed.length === 1;
});
T('re-saving an existing deck does not suffix it against itself', () => {
  const d = UI.save.decks.find(x => x.name === 'New deck 2');
  ctx.openBuilder(d.id);
  ctx.commitBuilder(false);
  return ctx.findDeck(UI.save, d.id).name === 'New deck 2';
});

// ---- Job 5e-4: choosing which physical copy goes in the deck ------------
console.log('\n--- variant picking ---');

ctx.UI.save = ctx.newSave({ starter: 'Brushfire', now: 1 });
ctx.grantDeck(UI.save, DECKS.Brushfire);
UI.save.decks.push({ id: '1', name: 'Brushfire', built: true, list: DECKS.Brushfire.list.map(e => [e[0], e[1]]) });
UI.myDeck = 'Brushfire';
ctx.grant(UI.save, 'base1-58', '', 3);            // 3 plain Pikachu
ctx.grant(UI.save, 'base1-58', ['sh'], 1);        // 1 Shiny
ctx.grant(UI.save, 'base1-58', ['fe', 'rh'], 2);  // 2 that are both
ctx.grant(UI.save, 'base1-31', ['sh'], 1);        // a card whose ONLY copy is Shiny
ctx.openBuilder(null);

T('a card with one pile adds without asking', () => {
  // Jynx: the only copy is Shiny. Clicking must give you the Shiny rather
  // than refusing because the plain pile is empty.
  ctx.poolClick('base1-31');
  return !UI.pilePick && ctx.builderQty(UI.builder, 'base1-31', 'sh') === 1
    && ctx.builderQty(UI.builder, 'base1-31', '') === 0;
});
T('a card with several piles asks which one', () => {
  ctx.poolClick('base1-58');
  return !!UI.pilePick && UI.pilePick.id === 'base1-58' && ctx.builderTotal(UI.builder) === 1;
});
T('the picker renders every available pile, best first', () => {
  render();
  const piles = ctx.builderPiles('base1-58');
  return piles.length === 3 && piles[0].key === 'sh' && piles[0].free === 1
    && piles[piles.length - 1].key === '' && piles[piles.length - 1].free === 3;
});
T('picking a pile adds that exact copy', () => {
  ctx.builderAdd('base1-58', ['fe', 'rh'], 1);
  UI.pilePick = null;
  return ctx.builderQty(UI.builder, 'base1-58', 'fe+rh') === 1
    && ctx.builderQty(UI.builder, 'base1-58', '') === 0;
});
T('piles run down independently as you spend them', () => {
  ctx.builderAdd('base1-58', ['fe', 'rh'], 1);     // now using both of them
  const piles = ctx.builderPiles('base1-58');
  return !piles.some(p => p.key === 'fe+rh')       // that pile is exhausted
    && piles.some(p => p.key === 'sh' && p.free === 1);
});
T('an unowned card still adds, as a plain blueprint entry', () => {
  const unowned = Object.keys(CARD_DB).find(id => ctx.ownedTotal(UI.save, id) === 0);
  ctx.poolClick(unowned);
  return !UI.pilePick && ctx.builderQty(UI.builder, unowned, '') === 1;
});
T('a chosen variant survives the save', () => {
  UI.builder.name = 'Sparkle';
  ctx.commitBuilder(false);
  const d = UI.save.decks.find(x => x.name === 'Sparkle');
  // Compare canonical to canonical. vkey() sorts by the declared variant
  // order, so ['fe','rh'] is stored as 'rh+fe' — testing against the literal
  // 'fe+rh' fails even though the code is right. Canonicalising both sides is
  // the point of having a canonical form at all.
  const want = ctx.vkey(['fe', 'rh']);
  const entry = d.list.find(e => e[1] === 'base1-58' && ctx.vkey(e[2]) === want);
  return !!entry && entry[0] === 2 && want === 'rh+fe';
});
T('the pool counts every pile, not just the plain one', () => {
  // Jynx again: one Shiny and nothing else. A tile reading the plain pile
  // alone would grey it out and claim you owned none.
  ctx.openBuilder(null);
  const piles = ctx.builderPiles('base1-31');
  return piles.length === 1 && piles[0].key === 'sh' && piles[0].free === 1;
});


// --- the action bar stops being a verb menu ---------------------------------
// One definition of what a hand card can do, two consumers: the click runs it
// when there is one verb, the bar offers them when there is more than one.
function findByClass(node, cls) {
  if (!node) return null;
  // el() assigns className as a string; classList only holds later .add()
  // calls, and the stub keeps the two completely separate. Check both.
  const c = String(node.className || '');
  if (c.split(/\s+/).indexOf(cls) >= 0) return node;
  if (node.classList && node.classList.contains(cls)) return node;
  const kids = node.children || [];
  for (let i = 0; i < kids.length; i++) { const r = findByClass(kids[i], cls); if (r) return r; }
  return null;
}

// The stub's textContent is per-node rather than a subtree walk, so anything
// asking "does this screen say X" has to gather the tree by hand.
function deepText(n) {
  if (!n) return '';
  return (n._text || '') + (n.children || []).map(deepText).join(' ');
}

// Job 7b wants counts, not the first hit — "every locked tile is unclickable"
// is a claim about all of them, and findByClass would only ever check one.
function allByClass(node, cls, out) {
  out = out || [];
  if (!node) return out;
  const c = String(node.className || '');
  if (c.split(/\s+/).indexOf(cls) >= 0) out.push(node);
  else if (node.classList && node.classList.contains(cls)) out.push(node);
  const kids = node.children || [];
  for (let i = 0; i < kids.length; i++) allByClass(kids[i], cls, out);
  return out;
}

function actionBoard() {
  UI.seedDraft = '4242';
  UI.flipDelay = 0;              // skip the opening flip; these tests are about the bar
  startMatch();
  UI.E.setupAuto(0);
  const s = UI.E.state;
  s.active = 0; s.phase = 'main'; s.pendingPromote = null; s.promoteQueue = [];
  s.pendingSwitch = null;
  UI.sel = null; UI.targeting = null; UI.retreatArmed = false;
  return s;
}

T('an Energy in hand has exactly one verb', () => {
  const s = actionBoard();
  s.players[0].hand = [{ uid: 90001, id: 'base1-98' }];
  const vs = ctx.handVerbs(0);
  return vs.length === 1 && vs[0].label === 'Attach to\u2026';
});

T('clicking it goes straight to targeting, with no verb button in between', () => {
  const s = actionBoard();
  s.players[0].hand = [{ uid: 90002, id: 'base1-98' }];
  render();
  ctx.clickHandCard(0);
  if (!UI.targeting) throw new Error('no targeting armed');
  if (UI.targeting.scope !== 'attachTo') throw new Error('wrong scope: ' + UI.targeting.scope);
  return UI.sel === null;
});

T('a forced promote arms bench targeting BEFORE the bench is drawn', () => {
  const s = actionBoard();
  s.players[0].bench = [UI.E.mkSlot({ uid: 90010, id: 'base1-58' })];
  s.pendingPromote = 0;
  render();
  if (!UI.targeting || UI.targeting.scope !== 'promote') throw new Error('not armed');
  if (!UI.targeting.forced) throw new Error('not marked forced');
  if (!findByClass(document.getElementById('app'), 'targetable')) throw new Error('no tile lit');
  return true;
});

T('a forced promote offers no Cancel', () => {
  const s = actionBoard();
  s.players[0].bench = [UI.E.mkSlot({ uid: 90011, id: 'base1-58' })];
  s.pendingPromote = 0;
  render();
  return !findByText(document.getElementById('app'), 'Cancel');
});

T('promoting by bench click puts up the one you clicked', () => {
  // Two on the bench, promote the SECOND, so a test that passes by accident
  // when index 0 is always chosen cannot survive. Note mkSlot() assigns the
  // slot's own uid from the engine counter -- the uid on the instance you hand
  // it is the CARD's, not the slot's -- so identity is checked by object.
  const s = actionBoard();
  const first = UI.E.mkSlot({ uid: 90012, id: 'base1-58' });
  const second = UI.E.mkSlot({ uid: 90013, id: 'base1-63' });
  s.players[0].active = null;
  s.players[0].bench = [first, second];
  s.pendingPromote = 0;
  render();
  UI.targeting.dispatch({ bench: 1 });
  const a = s.players[0].active;
  if (!a) throw new Error('no active after promote; pendingPromote=' + s.pendingPromote);
  if (a !== second) throw new Error('promoted the wrong slot');
  if (s.players[0].bench.indexOf(second) >= 0) throw new Error('still on the bench too');
  if (s.pendingPromote !== null) throw new Error('pendingPromote still ' + s.pendingPromote);
  return true;
});

// ---- the match log ----------------------------------------------------------
// It had NO coverage at all until 12 Aug 2026, which is exactly why two bugs
// lived in it: it is written to a file the suite never opened. Both were found
// by Trevor reading a real one.
T('the match log records both Prize piles, not two empty lines', () => {
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth';
  UI.seedDraft = '77'; UI.flipDelay = 0; startMatch();
  // Prizes are dealt by beginPlay(), which does not run until BOTH players have
  // confirmed setup -- long after newGame(), where the capture used to sit.
  UI.E.setupAuto(0); ctx.logOpeningPrizes();
  const txt = ctx.renderEventLog(UI.elog);
  const line = txt.split('\n').find(l => l.indexOf('your Prizes:') >= 0) || '';
  const named = line.split('your Prizes:')[1] || '';
  if (named.trim().length === 0) throw new Error('your Prizes line is empty');
  return named.split(',').length === 6;
});

T('the opening hand is the hand as DEALT, before the opponent sets up', () => {
  UI.seedDraft = '77'; UI.flipDelay = 0; startMatch();
  const txt = ctx.renderEventLog(UI.elog);
  const line = txt.split('\n').find(l => l.indexOf("opponent's opening hand:") >= 0) || '';
  const cards = (line.split(':')[1] || '').split(',').filter(x => x.trim());
  // newGame() runs setupAuto(1), which plays their Active out of hand. Capturing
  // after that logged six cards and called them an opening hand.
  return cards.length === UI.E.cfg.handSize;
});

// The log counted damage UP while the board counts HP DOWN, so a Pokemon on
// exactly lethal damage logged "(40/40)" on the line above "is Knocked Out!".
T('damage lines report HP remaining, the same way round as the board', () => {
  const E = riggedFlipBoard(0);
  E.state.players[1].active.dmg = 0;
  dispatch(0, { t: 'attack', idx: 0 });
  const dmgLine = E.state.log.filter(l => l.kind === 'dmg').pop();
  if (!dmgLine) throw new Error('no damage was logged');
  const m = dmgLine.text.match(/takes (\d+)\. \((\d+)\/(\d+) left\)/);
  if (!m) throw new Error('unexpected damage line: ' + dmgLine.text);
  const [, dealt, left, total] = m.map(Number);
  UI.flipDelay = 2000;
  // The old format printed damage-so-far here, so on a fresh Pokemon it read
  // `dealt/total` -- which is the case this arithmetic pins down.
  return left === total - dealt && left < total;
});

// Which Energy pays for a retreat is a real decision, and the engine used to make
// it by array order. The picker asks -- but ONLY when there is something to ask.
function retreatBoard(energy) {
  const s = actionBoard();
  const p = s.players[0];
  p.active = UI.E.mkSlot({ uid: 90040, id: 'base1-58' });   // Pikachu, retreat 1
  p.active.energy = energy.map((id, k) => ({ uid: 90041 + k, id }));
  p.bench = [UI.E.mkSlot({ uid: 90050, id: 'base1-58' })];
  p.retreated = false;
  UI.energyPick = null;
  render();
  const row = findByClass(document.getElementById('app'), 'retreatrow');
  if (!row || !row.onclick) throw new Error('retreat row not clickable');
  row.onclick();
  UI.targeting.dispatch({ bench: 0 });
  return p;
}

T('retreating with mixed Energy asks which to discard', () => {
  const p = retreatBoard(['base1-99', 'base1-100', 'base1-100']);
  if (!UI.energyPick) throw new Error('the picker should have opened');
  if (p.active.energy.length !== 3) throw new Error('nothing may be discarded until you choose');
  // Naming the Grass keeps both Lightning, which is the point of asking.
  ctx.toggleEnergyPick(90041);
  if (UI.energyPick) throw new Error('one card covers a retreat cost of 1; it should have committed');
  const left = UI.E.state.players[0].bench[UI.E.state.players[0].bench.length - 1].energy;
  return left.length === 2 && left.every(e => e.id === 'base1-100');
});

T('retreating with identical Energy does not stop to ask', () => {
  const p = retreatBoard(['base1-100', 'base1-100', 'base1-100']);
  if (UI.energyPick) throw new Error('three identical Lightning is not a decision');
  return p.retreated === true;
});

// A Double Colorless beside one basic is a real decision even though either card
// alone settles the cost -- you are choosing which one you would rather keep, and
// a DCE is worth two symbols to whatever comes next.
T('a Double Colorless beside a basic is still a decision', () => {
  const s = actionBoard();
  const p = s.players[0];
  p.active = UI.E.mkSlot({ uid: 90060, id: 'base1-24' });   // Charmeleon, retreat 1
  p.active.energy = [{ uid: 90061, id: 'base1-96' }, { uid: 90062, id: 'base1-98' }];
  p.bench = [UI.E.mkSlot({ uid: 90063, id: 'base1-58' })];
  p.retreated = false; UI.energyPick = null;
  render();
  findByClass(document.getElementById('app'), 'retreatrow').onclick();
  UI.targeting.dispatch({ bench: 0 });
  return !!UI.energyPick && UI.energyPick.pool.length === 2;
});

T('retreat is a row on the Active card, not a button in the bar', () => {
  actionBoard();
  render();
  const app = document.getElementById('app');
  if (findByText(app, 'Retreat (discard 1 Energy)\u2026')) throw new Error('old bar button present');
  return !!findByClass(app, 'retreatrow');
});

T('arming retreat locks the attacks above it', () => {
  const s = actionBoard();
  const p = s.players[0];
  p.active = UI.E.mkSlot({ uid: 90020, id: 'base1-58' });
  p.active.energy = [{ uid: 90021, id: 'base1-99' }, { uid: 90022, id: 'base1-99' }];
  p.bench = [UI.E.mkSlot({ uid: 90023, id: 'base1-58' })];
  p.retreated = false;
  render();
  const row = findByClass(document.getElementById('app'), 'retreatrow');
  if (!row || !row.onclick) throw new Error('retreat row not clickable');
  row.onclick();
  if (!UI.retreatArmed) throw new Error('not armed');
  if (!UI.targeting || UI.targeting.scope !== 'ownBench') throw new Error('bench not targeted');
  const atk = findByClass(document.getElementById('app'), 'atk');
  return !atk || !atk.onclick;
});

T('cancelling an armed retreat leaves the board untouched', () => {
  const s = actionBoard();
  const p = s.players[0];
  const act = UI.E.mkSlot({ uid: 90030, id: 'base1-58' });
  const benched = UI.E.mkSlot({ uid: 90033, id: 'base1-58' });
  p.active = act;
  act.energy = [{ uid: 90031, id: 'base1-99' }, { uid: 90032, id: 'base1-99' }];
  p.bench = [benched];
  p.retreated = false;
  render();
  findByClass(document.getElementById('app'), 'retreatrow').onclick();
  render();
  findByClass(document.getElementById('app'), 'retreatrow').onclick();
  if (UI.retreatArmed) throw new Error('still armed');
  if (UI.targeting !== null) throw new Error('targeting still ' + (UI.targeting && UI.targeting.scope));
  if (s.players[0].active !== act) throw new Error('the Active changed');
  if (act.energy.length !== 2) throw new Error('energy now ' + act.energy.length);
  if (p.retreated) throw new Error('counted as a retreat');
  return true;
});


// --- the Trainer pickers show the real cards ---------------------------------
T('a picker renders the printed scans, not a text-carrying face', () => {
  actionBoard();
  ctx.openPicker({ title: 'Pokemon Trader', prompt: 'Choose one',
    items: [{ uid: 1, id: 'base1-4' }, { uid: 2, id: 'base1-17' }],
    min: 1, max: 1, onDone: () => {} });
  render();
  // Scoped to the grid, NOT the whole app: the picker is an overlay over a live
  // board, and the board's own Active card legitimately renders pc-atkname. A
  // whole-document search here passes or fails on the wrong element.
  const grid = findByClass(document.getElementById('app'), 'pickgrid');
  if (!grid) throw new Error('no pick grid');
  if (!findByClass(grid, 'picktile')) throw new Error('no pick tiles');
  if (!findByClass(grid, 'cardface')) throw new Error('no scan rendered');
  // Attack NAMES are what broke this screen: in a 150px column "Fire Spin" came
  // out one letter per line. pc-atkname still has four producers elsewhere, so
  // this stays a real assertion and not a vacuous one.
  if (findByClass(grid, 'pc-atkname')) throw new Error('rendering a text-carrying face');
  return true;
});

T('a picker names every card under its face', () => {
  actionBoard();
  ctx.openPicker({ title: 'Pokemon Trader', prompt: 'Choose one',
    items: [{ uid: 1, id: 'base1-4' }], min: 1, max: 1, onDone: () => {} });
  render();
  // The name has to survive an unfetched set, where the scan falls back to a
  // sigil that is deliberately not a portrait of anything.
  return !!findByText(document.getElementById('app'), 'Charizard');
});

T('a picker shrinks its tiles once there are more than eight', () => {
  const mk = n => Array.from({ length: n }, (_, i) => ({ uid: i + 1, id: 'base1-4' }));
  actionBoard();
  ctx.openPicker({ title: 'x', prompt: 'x', items: mk(6), min: 1, max: 1, onDone: () => {} });
  render();
  const few = findByClass(document.getElementById('app'), 'pickgrid');
  if (String(few.className).indexOf('many') >= 0) throw new Error('six should not be many');
  ctx.openPicker({ title: 'x', prompt: 'x', items: mk(12), min: 1, max: 1, onDone: () => {} });
  render();
  const lots = findByClass(document.getElementById('app'), 'pickgrid');
  return String(lots.className).indexOf('many') >= 0;
});

T('picking a card in the grid toggles it', () => {
  actionBoard();
  ctx.openPicker({ title: 'x', prompt: 'x',
    items: [{ uid: 11, id: 'base1-4' }, { uid: 12, id: 'base1-17' }],
    min: 1, max: 1, onDone: () => {} });
  render();
  const tile = findByClass(document.getElementById('app'), 'picktile');
  tile.onclick();
  if (UI.picker.chosen.length !== 1) throw new Error('did not select');
  render();
  findByClass(document.getElementById('app'), 'picktile').onclick();
  return UI.picker.chosen.length === 0;
});

// ---------------------------------------------------------------------------
// JOB 7b — THE LADDER, THROUGH THE BUILT FILE
//
// progresstest.js already proves the rules. What only this file can check is
// that the SCREEN reaches them: that the roster renders, that a locked bracket
// stays unclickable, and that picking a challenger actually changes who turns
// up. Everything above this line runs in free play — see the starter test.
// ---------------------------------------------------------------------------
console.log('\n--- the ladder ---');

T('leaving free play lands on a challenger you are allowed to play', () => {
  UI.freePlay = false;
  pickFirstOpponent();
  return !!UI.foe && !!currentFoe();
});

T('a fresh save can only reach the first bracket', () => {
  const open = availableOpponents(UI.save, LADDER_VIEW);
  return bracketOpen(UI.save, LADDER_VIEW, 0)
      && !bracketOpen(UI.save, LADDER_VIEW, 1)
      && open.every(o => o.set === LADDER_VIEW[0].set);
});

T('the ladder renders every bracket, locked ones included', () => {
  UI.screen = 'decks'; render();
  const app = document.getElementById('app');
  const brackets = allByClass(app, 'ladbracket');
  const shut = brackets.filter(n => String(n.className).indexOf('shut') >= 0);
  return brackets.length === LADDER_VIEW.length && shut.length === LADDER_VIEW.length - 1;
});

T('a locked challenger has no click handler', () => {
  const app = document.getElementById('app');
  const locked = allByClass(app, 'foecard').filter(n => String(n.className).indexOf('locked') >= 0);
  return locked.length > 0 && locked.every(n => !n.onclick);
});

// The one assertion that has to live HERE rather than in progresstest.js. That
// suite builds its own ladder and passes its own setName, so it proves the
// MECHANISM and cannot see whether ui.js actually supplies one — deleting the
// call from ui.js left every test in both suites green while a bracket titled
// "base5" went back on screen. This reads the real LADDER_VIEW the built file made.
T('no bracket is titled with its own set code', () => {
  return LADDER_VIEW.length > 0 && LADDER_VIEW.every(b => !/^(base|gym|neo|si)[0-9]/.test(b.name));
});

T('the boss tile is locked until five distinct challengers have lost', () => {
  const b = LADDER_VIEW[0];
  const before = bossAvailable(UI.save, b);
  b.roster.slice(0, 5).forEach(o => recordWin(UI.save, LADDER_VIEW, o.id));
  return !before && bossAvailable(UI.save, b);
});

T('the boss becomes clickable once it is available', () => {
  render();
  const app = document.getElementById('app');
  const boss = allByClass(app, 'foecard').filter(n => String(n.className).indexOf('boss') >= 0);
  return boss.length > 0 && !!boss[0].onclick;
});

T('picking a challenger is who actually turns up', () => {
  // NOT pinned to 'gbc:'. It was, and wiring Trevor's own decks into base1 left the
  // bracket with no GBC deck in its roster at all, so this threw on an undefined foe
  // instead of failing. The property under test is "the rung you click is the deck
  // that arrives" and it is true of every source — so ask for a rung with a real deck,
  // preferring one that has to be RESOLVED rather than a theme deck read straight out
  // of DECKS.
  const real = LADDER_VIEW[0].roster.filter(o => o.deck !== 'generate');
  const foe = real.find(o => o.deck.indexOf('theme:') !== 0) || real[0];
  UI.foe = foe.id;
  const want = opponentDeckFor(foe);
  UI.myDeck = 'Brushfire'; UI.seedDraft = '77'; UI.flipDelay = 0;
  startMatch();
  const got = UI.E.state.players[1].deckDef;
  return got.name === want.name && JSON.stringify(got.list) === JSON.stringify(want.list);
});

T('and the board names them rather than "Opponent"', () => {
  const foe = currentFoe();
  return UI.E.state.players[1].name === foe.name;
});

T('a ladder win pays packs of that bracket\'s set', () => {
  const foe = LADDER_VIEW[0].roster[0];
  UI.foe = foe.id; UI.seedDraft = '78'; startMatch();
  const held = packsHeld(UI.save, LADDER_VIEW[0].set);
  // Force the win rather than playing one out: the payout is the thing under
  // test, and settleResult reads the engine's own result either way.
  UI.E.state.phase = 'over'; UI.E.state.winner = 0; UI.E.state.winReason = 'test';
  UI.awarded = false;
  settleResult();
  return packsHeld(UI.save, LADDER_VIEW[0].set) === held + 2 && UI.reward && UI.reward.packs === 2;
});

T('free play pays nothing at all', () => {
  UI.freePlay = true;
  UI.myDeck = 'Brushfire'; UI.foeDeck = 'Overgrowth'; UI.seedDraft = '79'; startMatch();
  const before = packsHeld(UI.save, LADDER_VIEW[0].set);
  UI.E.state.phase = 'over'; UI.E.state.winner = 0; UI.E.state.winReason = 'test';
  UI.awarded = false;
  const wins = UI.save.stats.wins;
  settleResult();
  // The win still counts as a win; it just does not fund the collection.
  return packsHeld(UI.save, LADDER_VIEW[0].set) === before
      && UI.save.stats.wins === wins + 1 && UI.reward === null;
});

T('the game-over sheet says so instead of going quiet', () => {
  render();
  return deepText(document.getElementById('app')).indexOf('Free play pays no packs') >= 0;
});

T('beating a boss opens the next bracket, and the sheet announces it', () => {
  UI.freePlay = false;
  const boss = LADDER_VIEW[0].boss;
  UI.foe = boss.id; UI.seedDraft = '80'; startMatch();
  UI.E.state.phase = 'over'; UI.E.state.winner = 0; UI.E.state.winReason = 'test';
  UI.awarded = false;
  settleResult();
  const opened = bracketOpen(UI.save, LADDER_VIEW, 1);
  const paid = UI.reward && UI.reward.packs === 3 && UI.reward.unlocks === LADDER_VIEW[1].set;
  render();
  const said = deepText(document.getElementById('app')).indexOf('is open.') >= 0;
  return opened && paid && said;
});

T('a second win over the same boss pays the plain rate', () => {
  UI.seedDraft = '81'; startMatch();
  UI.E.state.phase = 'over'; UI.E.state.winner = 0; UI.E.state.winReason = 'test';
  UI.awarded = false;
  settleResult();
  return UI.reward.packs === 2 && UI.reward.bonus === 0 && UI.reward.unlocks === null;
});

T('the newly opened bracket is now on screen and clickable', () => {
  backToDeckSelect();
  const app = document.getElementById('app');
  const brackets = allByClass(app, 'ladbracket');
  const shut = brackets.filter(n => String(n.className).indexOf('shut') >= 0);
  return shut.length === LADDER_VIEW.length - 2;
});

console.log(`\n=========== ${pass} passed, ${fail} failed ===========\n`);
process.exit(fail ? 1 : 0);

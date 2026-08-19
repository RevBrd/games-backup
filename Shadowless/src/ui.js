// ============================================================================
// UI LAYER — deliberately instrument-like. Job 1 is about reading the rules
// engine clearly, not about card art. The log is a first-class panel.
// ============================================================================


// Trainers that need the player to choose something.
// How each Trainer asks the player for its choices. `flow` runs when the card
// is played; it either opens a picker or dispatches directly.
// Trainers whose play opens a card picker (handled in pickerFlow()).
const PICKER_TRAINERS = ['base1-71','base1-74','base1-83','base1-89','base1-86','base1-77','base1-87','base1-76'];

const TRAINER_FLOW = {
  'base1-95': { scope: 'ownBench', prompt: 'Choose a Benched Pokemon to bring up' },
  'base1-93': { scope: 'oppBench', prompt: "Choose an opposing Benched Pokemon to drag up" },
  'base1-92': { scope: 'oppEnergy', prompt: 'Choose an opposing Pokemon to remove Energy from' },
  'base1-94': { scope: 'ownDamaged', prompt: 'Choose a damaged Pokemon to heal' },
  'base1-90': { scope: 'ownDamagedEnergy', prompt: 'Choose a damaged Pokemon with Energy attached' },
  'base1-79': { scope: 'ownEnergy', prompt: 'Choose one of YOUR Pokemon to discard an Energy from',
                then: { scope: 'oppEnergy', prompt: 'Now choose an opposing Pokemon to strip 2 Energy from' } },
  'base1-78': { scope: 'ownAny', prompt: 'Choose one of your Pokemon to scoop up' },
  'base1-72': { scope: 'ownEvolved', prompt: 'Choose an evolved Pokemon to devolve' },
  'base1-80': { scope: 'ownAny', prompt: 'Choose a Pokemon to attach Defender to' },
};


const UI = {
  E: null,
  sel: null,          // {kind:'hand', idx} | null
  inspect: null,      // card id shown in the preview panel
  lastTab: 'log',
  fx: {},             // key -> expiry timestamp; drives one-shot animations
  picker: null,       // Computer Search two-stage chooser
  targeting: null,    // {scope, prompt, dispatch(payload)} — cleared after each action
  // A Pokemon Power mode you stay in across actions: {uid, kind, name, from}.
  // Deliberately NOT cleared by dispatch(), because "as often as you like during
  // your turn" means one move must not close the mode. It auto-exits when no
  // legal move remains, which also covers the turn ending.
  powerMode: null,
  reveal: null,        // Peek / Clairvoyance panel — see renderReveal
  aiMode: 'expert',
  aiDelay: 1000,
  aiTimer: null,
  flipDelay: 2000,      // "Flipping coin..." hold
  flipHold: 800,        // how long the result sits on screen after landing
  presTimer: null,
  view: null,           // frozen board snapshot while a flip is being presented
  pres: null,           // {queue, banner}
  devTab: 'log',
  fitZoom: 1,           // set by fitBoard(); 1 means the mat fitted unscaled
  boardEl: null, tableEl: null, handEl: null,
  railEl: null, railBody: null, peekEl: null,
  myDeck: 'Brushfire',
  foeDeck: 'Overgrowth',
  // --- Job 7 ---
  foe: null,            // the ladder opponent's id, or null in free play
  freePlay: false,      // OPPONENT section shows the raw deck grid instead of
                        // the ladder. Mirror matches and seed-chasing live here,
                        // and it pays nothing — see settleResult().
  reward: null,         // what the finished match paid; renderOver() reads it
  cfgDraft: { prizeCount: 6, firstPlayerMayAttack: true, noEvolveFirstTurn: true },
  seedDraft: '',
  screen: 'decks',      // 'newsave' -> 'decks' -> 'setup' -> board; 'packs' from either end

  // --- Job 5 ---
  save: null,
  saveStatus: '',       // 'ok' | 'empty' | 'nostore' | 'corrupt' — see collection.js
  saveNote: '',         // a one-line problem to show the player, or ''
  pack: null,           // the pack being opened; see openNextPack()
  detail: null,         // {card, flags} — the pull the detail overlay is showing
  collView: 'cards',    // 'cards' (every printing) | 'dex' (one per species)
  collFilter: 'all',    // 'all' | 'owned' | 'missing'
  importing: false, importText: '', importErr: '',
  // The Shadowless A/B, switched from the DEV tab. 'shadow' draws the art
  // window with a drop shadow and Shadowless removes it (correct real-world
  // scarcity). 'inverted' makes Shadowless the base state, matching our
  // 1st-Edition scans exactly, and the rare pull adds the shadow instead.
  // Undecided on purpose — this exists so the two can be looked at rather than
  // argued about. See PACKS.md.
  shadowMode: 'shadow',
  // Retreat is the one confirmation-gated action; this is its armed state.
  retreatArmed: false,
};

const PACKS_PER_WIN = 2;      // PACKS.md's yardstick, and now the real rule

// Set identity (Job 6a). `SET_INFO` comes from cards.js and holds only the sets
// this build actually generated, so anything derived from it can never offer a
// pack whose cards do not exist.
//
// homeSet() is DERIVED rather than declared — whichever generated set comes
// first, which is base1 today and stays correct in a build generated without
// it. It answers "which set does a win pay out in", and Job 7's progression is
// what eventually replaces it. It is deliberately not a constant named after
// Base Set: that constant was threaded through nine call sites and every one of
// them had to be found again to widen the game.
// A set is LIVE once every card in it is playable. CLAUDE.md's rule — no
// collecting a card you cannot play, and no half-open sets — enforces ITSELF
// from this rather than from anyone remembering it. That is what lets a set sit
// in CARD_DB half-scripted for a whole job: it generates, it is testable, and it
// stays invisible to the collection until the last script lands.
//
// THE DERIVATION MOVED TO progress.js ON 17 AUG 2026 and this is now a call
// rather than a copy. It lived here, which meant every pure consumer had to
// re-derive it or guess — and `progresstest.js` guessed `Object.keys(SET_INFO)`,
// which is GENERATED rather than live. That was correct only for as long as the
// two were the same, and it went red the first time a set was generated before
// it was finished. One definition, in a pure module, callable by the suites.
const SET_LIVE = (() => {
  const out = {};
  for (const code of liveSets(CARD_DB, EFFECTS, SET_INFO)) out[code] = 1;
  return out;
})();
const setIsLive = code => !!SET_LIVE[code];

// The card pool the collection, the dex, the stats and the packs all work from.
// CARD_DB is everything that GENERATES; this is everything that COUNTS.
const LIVE_DB = (() => {
  const out = {};
  for (const id in CARD_DB) if (SET_LIVE[CARD_DB[id].set]) out[id] = CARD_DB[id];
  return out;
})();

// What retreating this Pokemon ACTUALLY costs right now. Dodrio's Retreat Aid
// discounts it from the Bench, so the printed number on the card face and the
// number the player is about to pay are two different things — the card preview
// keeps the printed one, every actionable surface uses this.
const retreatCost = (slot, card) =>
  (UI.E && slot) ? UI.E.retreatCostOf(slot) : (card ? card.retreat : 0);
const setName = code => (SET_INFO[code] || {}).name || code;
const setShort = code => (SET_INFO[code] || {}).short || code;
const homeSet = () => Object.keys(SET_INFO).find(setIsLive) || Object.keys(SET_INFO)[0];
const packSets = save => Object.keys(SET_INFO).filter(s => setIsLive(s) && packsHeld(save, s) > 0);

// ------------------------------------------------------------ the ladder ---
// Job 7b. The live sets IN ORDER are the brackets, and progress.js turns them
// into one. Built once: it depends only on which sets are live and on LADDER,
// neither of which changes at runtime. What changes is the SAVE, and every
// question about what is open takes the save as an argument rather than being
// baked in here — see progress.js's header on why unlock is derived.
const LIVE_SETS = Object.keys(SET_INFO).filter(setIsLive);

// The three authored deck sources, keyed the way a ladder entry names them.
const DECK_SOURCES = (() => {
  const out = { theme: DECKS, gbc: {}, jungle: {} };
  for (const k in OPPONENT_DECKS) {
    const cut = k.indexOf(':');
    const kind = k.slice(0, cut);
    (out[kind] = out[kind] || {})[k.slice(cut + 1)] = OPPONENT_DECKS[k];
  }
  return out;
})();

const LADDER_VIEW = buildLadder(LIVE_SETS, LADDER, {
  hasDeck: ref => ref.startsWith('theme:') ? !!DECKS[ref.slice(6)] : !!OPPONENT_DECKS[ref],
});

// A generated challenger's deck. Seeded off the OPPONENT rather than off the
// match, so the same challenger brings the same deck every time you face them —
// a rival whose deck is different every match is not a rival, it is noise.
function opponentDeckFor(opp) {
  if (!opp) return null;
  const bracket = bracketOf(LADDER_VIEW, opp.id);
  const poolSets = bracket ? poolSetsFor(LADDER_VIEW, bracket) : LIVE_SETS;
  return resolveOpponentDeck(opp, DECK_SOURCES, {
    poolSets,
    generate: (sets, seed, o) => {
      const pool = Object.keys(LIVE_DB).filter(id => sets.indexOf(LIVE_DB[id].set) >= 0);
      return generateDeck(LIVE_DB, pool, mulberry32(seed), { name: `${o.name}'s deck` });
    },
  });
}

// ONE switch decides which opponent you are facing, and it is `freePlay`.
// `UI.foe` is only the remembered ladder selection — it deliberately survives a
// trip through free play so coming back does not lose your place.
//
// Written the other way first, with the toggle clearing UI.foe on the way in:
// that put the invariant in an event handler instead of in the accessor, so
// anything setting UI.foeDeck without going through the toggle got silently
// ignored. Three smoke tests found it immediately. Same lesson as deckFor's
// mandatory `side` — a call site that has not said which mode it wants is a
// call site with the bug.
const currentFoe = () => (!UI.freePlay && UI.foe) ? findOpponent(LADDER_VIEW, UI.foe) : null;

// WHAT TO CALL THE OTHER SIDE'S DECK — 16 Aug 2026, from Trevor: the board said
// "Overgrowth" while he was playing Jack.
//
// `UI.foeDeck` is the FREE PLAY selection and nothing clears it when you go back
// to the ladder, so it sat there naming whichever theme deck was last chosen in
// the other mode. Two places read it raw. The match log had already solved this
// and its string is reused verbatim, so the file and the screen agree.
const foeDeckLabel = () => {
  const f = currentFoe();
  return f ? `${f.name} — ${f.title}` : UI.foeDeck;
};

const SANDBOX = 'Sandbox';
const DECK_NAMES = Object.keys(DECKS).concat([SANDBOX]);

// The Sandbox deck is generated fresh each game from every implemented card,
// so newly added cards are immediately playable without waiting for the
// deckbuilder. It deliberately IGNORES the collection — agreed with Trevor,
// 9 Aug: it is the only way to test a newly implemented card without grinding
// for it, so it is a dev affordance rather than a deck you own.
// A NAME DOES NOT IDENTIFY A DECK. The starter is created in your save under the
// theme deck's own name, so from the first edit onwards "Brushfire" means two
// different 60-card lists — yours and the printed one. Every lookup must say
// which it wants, and the answer is never ambiguous:
//
//   'mine'   your save's deck. The only kind you can field.
//   'theme'  the printed theme deck. What the opponent always gets.
//
// Getting this wrong is invisible except in a mirror, which is how a name-only
// lookup shipped for a job handing the opponent your edited list. Never restore
// a default here — a call site that has not decided is a call site with the bug.
// BUILT WINS, and that is an invariant rather than a preference. myDeckNames()
// offers only BUILT decks, so a name arriving here on the 'mine' side is by
// construction the name of a built deck — and a flat search could answer it
// with an unbuilt layout that happens to share the name.
//
// Not hypothetical, and not an edge case: the builder's default name is "New
// deck", so a player who saves a draft and then builds a deck without renaming
// either gets two. Trevor's save held a 41-card blueprint and a 60-card deck
// both called "New deck"; deck select drew the blueprint's hero card and its
// card count under the built deck's name. resolveDeck() shares this function,
// so Play would have handed the engine the 41-card list — nothing on the path
// from deck select into a match calls validateDeck().
//
// commitBuilder() now keeps names unique, so the collision cannot recur. This
// stays anyway: the two guards fail in opposite directions, and this is the one
// that holds for a save written before that.
function deckFor(name, side) {
  if (side === 'theme') return DECKS[name] || null;
  const mine = UI.save && (UI.save.decks.find(d => d.name === name && deckIsBuilt(d))
                        || UI.save.decks.find(d => d.name === name));
  // Your side falls back to the printed list, which is safe precisely because a
  // save that lacks the deck is a save that cannot be the ambiguous one.
  return mine || DECKS[name] || null;
}

function resolveDeck(name, side, seed) {
  if (name === SANDBOX) {
    // Deliberately gated on IMPLEMENTED rather than on a live set: reaching a
    // newly scripted card before its set opens is the entire point of Sandbox.
    // It does have to be implemented, though — validateDeck refuses the rest.
    const pool = Object.keys(CARD_DB).filter(id => CARD_DB[id].kind === 'energy' || EFFECTS[id]);
    const d = generateDeck(CARD_DB, pool, mulberry32(seed), { name: SANDBOX });
    return d || DECKS[Object.keys(DECKS)[0]];
  }
  return deckFor(name, side) || DECKS[Object.keys(DECKS)[0]];
}

// Decks YOU may field: only what you own, and only what is BUILT. A draft or a
// blueprint reserves nothing and is not a deck yet, so it cannot be taken to a
// match. The opponent may field anything — their deck is the game's, not yours,
// so it has never been a collection question.
const myDeckNames = () => (UI.save ? builtDecks(UI.save).map(d => d.name) : []).concat([SANDBOX]);

// ------------------------------------------------------------- the save ----
function bootSave() {
  const r = loadSave();
  UI.saveStatus = r.status;
  UI.saveNote = '';
  if (r.status === 'ok') { UI.save = r.save; afterLoad(); return; }
  if (r.status === 'corrupt') {
    // Do not offer to start over by default. The old text is preserved under a
    // backup key and a player who has been collecting for weeks should be told
    // that, not handed a fresh save that quietly buries it.
    UI.saveNote = 'A save was found but could not be read. The original is kept in your browser under '
      + SAVE_BACKUP_KEY + ' — nothing has been overwritten. Import a backup, or start fresh below.';
  } else if (r.status === 'nostore') {
    UI.saveNote = 'This browser is not allowing local storage, so nothing will be remembered '
      + 'after you close the tab. Everything still works — it just will not persist.';
  }
  UI.save = null;
  UI.screen = 'newsave';
}

// Called after any load or import: keep the selected deck pointing at something
// that exists, or the deck screen renders a selection you cannot play.
function afterLoad() {
  const names = myDeckNames();
  if (names.indexOf(UI.myDeck) < 0) UI.myDeck = names[0];
  // Same reasoning one level along: the ladder selection has to point at
  // somebody this save is allowed to play, or Play is dead on arrival.
  pickFirstOpponent();
  UI.screen = 'decks';
}

// Every mutation goes through here, so there is exactly one place that can fail
// and exactly one place that reports it. A write that silently does nothing is
// the worst outcome available in a collection game.
function persist() {
  if (!UI.save || UI.saveStatus === 'nostore') return;
  const r = writeSave(UI.save);
  if (r.ok) { UI.saveStatus = 'ok'; UI.saveNote = ''; return; }
  UI.saveStatus = 'nostore';
  UI.saveNote = 'Could not write your save: ' + r.error + '. Progress this session is not being kept.';
}

function startNewSave(deckName) {
  UI.save = newSave({ starter: deckName });
  grantDeck(UI.save, DECKS[deckName]);
  // The starter arrives as a real, editable, BUILT deck rather than a special
  // case, so the deck builder will have nothing to learn about it later.
  UI.save.decks.push({
    id: nextDeckId(UI.save), name: deckName, built: true,
    list: DECKS[deckName].list.map(e => [e[0], e[1]]),
  });
  UI.myDeck = deckName;
  pickFirstOpponent();
  persist();
  UI.screen = 'decks';
  render();
}

// -------------------------------------------------------------- bootstrap --
function startMatch() {
  UI.screen = 'setup';
  newGame();
}

function backToDeckSelect() {
  clearTimeout(UI.aiTimer); clearTimeout(UI.presTimer);
  UI.pres = null; UI.view = null; UI.sel = null; UI.targeting = null; UI.picker = null; UI.powerMode = null; UI.reveal = null; UI.retreatArmed = false;
  UI.screen = 'decks';
  render();
}

function newGame() {
  clearTimeout(UI.aiTimer); clearTimeout(UI.presTimer);
  UI.pres = null; UI.view = null;
  const seed = UI.seedDraft === '' ? (Math.random() * 2147483647 | 0) : (parseInt(UI.seedDraft, 10) | 0);
  UI.E = new Engine(CARD_DB, EFFECTS, { seed, cfg: Object.assign({}, UI.cfgDraft) });
  // Mirror matches are allowed. Both sides build from the same list, but the two
  // seeds differ, so they shuffle and draw independently.
  //
  // Job 7: in ladder play the opponent IS a named challenger, so their deck and
  // their AI tier both come off the roster entry rather than off the controls.
  // Free play keeps the old behaviour exactly — that is what it is for.
  const foe = currentFoe();
  const foeDeck = foe ? opponentDeckFor(foe) : null;
  UI.foeTier = foe ? foe.ai : UI.aiMode;
  UI.E.newGame(resolveDeck(UI.myDeck, 'mine', seed),
               foeDeck || resolveDeck(UI.foeDeck, 'theme', seed ^ 0x5f5f),
               ['You', foe ? foe.name : 'Opponent']);
  startMatchLog(seed);                   // BEFORE setupAuto — see startMatchLog
  UI.E.setupAuto(1);                     // opponent sets itself up
  UI.sel = null; UI.targeting = null; UI.picker = null; UI.powerMode = null; UI.reveal = null; UI.retreatArmed = false;
  UI.awarded = false;                    // this game has not paid out yet
  presentOpeningFlip();
}

// The very first flip of the game decides who goes first, and until now it was
// resolved inside `newGame()` and reported only as a line of log text — the one
// coin in the match that the player was told about instead of shown. It is also
// the flip with the largest measured consequence: the seat is worth about 5.7
// points of win rate (see AI.md), so it deserves the same two seconds as a
// Poison Sting.
//
// It plays over the empty board, BEFORE the setup sheet, for two reasons: the
// coin lives on the mat's centre line and a sheet would cover it, and knowing
// who goes first is information you want while you are arranging your Bench.
function presentOpeningFlip() {
  const log = UI.E.state.log;
  const at = log.findIndex(e => e.kind === 'flip');
  if (at < 0 || UI.flipDelay < 250) { render(); return; }
  const before = JSON.parse(JSON.stringify(UI.E.state));
  before.log = log.slice(0, at);
  // THE OPPONENT HAS NOT REVEALED YET. `newGame` runs `setupAuto(1)` before this,
  // so the real state already holds their Active and Bench — and the setup sheet,
  // which normally hides all of it until you commit, is suppressed for the flip.
  // Showing the frozen board as-is therefore handed you their whole opening
  // position before you chose yours, which is worth a great deal and is not how
  // either the card game or the Game Boy game deals it: both sides place face
  // down and turn up together.
  //
  // Blanking them in the SNAPSHOT is the honest fix rather than a cheat. The
  // frozen view exists precisely to show a board that is not the current one, and
  // at the moment this coin is in the air their side genuinely is face down.
  before.players[1].active = null;
  before.players[1].bench = [];
  UI.view = before;
  // No `before` on the presentation itself: there is nothing to diff at the start
  // of a game, and handing one over would flash effects for the opening deal.
  UI.pres = { queue: log.slice(at), banner: null, before: null };
  stepPresentation();
}

// --------------------------------------------------------------- match log -
// See src/eventlog.js for what this is for. Recording is always on; the AI's
// own reasoning is switched on with it, which is the only part that costs
// anything and only ever runs against one opponent in a browser.
function startMatchLog(seed) {
  UI.elog = newEventLog({
    started: new Date().toISOString().replace('T', ' ').slice(0, 19),
    seed,
    // In ladder play the opponent's "deck" is the challenger, which is what you
    // would want to read back off a log six matches later.
    decks: [UI.myDeck, foeDeckLabel()],
    tier: UI.foeTier || UI.aiMode,
    prizes: (UI.cfgDraft && UI.cfgDraft.prizes) || null,
  });
  UI.elogLen = 0;
  UI.elogTurn = null;
  if (UI.E._ai) UI.E._ai.explain = true;

  // The opening hands, as dealt. THIS HAS TO RUN BEFORE `setupAuto(1)`: the
  // opponent places its Active out of hand during setup, so capturing afterwards
  // logged six cards and called them an opening hand of seven.
  const s = UI.E.state;
  logEvent(UI.elog, 'hidden', 0, `opponent's opening hand: ${s.players[1].hand.map(cardName).join(', ')}`);
  logEvent(UI.elog, 'hidden', 0, `your opening hand: ${s.players[0].hand.map(cardName).join(', ')}`);
}

const cardName = uid => { const c = CARD_DB[uid.id]; return c ? c.name : uid.id; };

// Prizes are dealt by `beginPlay()`, which does not run until BOTH players have
// confirmed setup — so the header promised both Prize piles and the file printed
// two empty lines for the first week this existed. Idempotent, because more than
// one path reaches the start of play.
function logOpeningPrizes() {
  if (!UI.elog || UI.elog.prizesLogged) return;
  const s = UI.E && UI.E.state;
  if (!s || !s.players[0].prizes.length) return;
  UI.elog.prizesLogged = true;
  logEvent(UI.elog, 'hidden', 0, `opponent's Prizes: ${s.players[1].prizes.map(cardName).join(', ')}`);
  logEvent(UI.elog, 'hidden', 0, `your Prizes: ${s.players[0].prizes.map(cardName).join(', ')}`);
  // THE OPENING BOARD, which nothing recorded until 16 Aug 2026. `setupAuto`
  // places the Active and then benches EVERY Basic in hand, and none of it goes
  // through an action or an engine log line — so a reader reconstructing the
  // board from the narrative starts one or more Pokemon short and stays wrong
  // for the whole file. It cost a session an hour chasing a Pokemon that had
  // simply been there since before turn 1.
  //
  // Not marked HIDDEN for our own side, but both are printed together: the point
  // is that the file should let anyone rebuild the position at any turn.
  const board = pi => {
    const p = s.players[pi];
    const nm = sl => UI.E.nameOf(sl);
    return `${p.active ? nm(p.active) : '(none)'} active`
      + (p.bench.length ? `, bench ${p.bench.map(nm).join(', ')}` : ', empty bench');
  };
  logEvent(UI.elog, 'hidden', 0, `opponent's opening board: ${board(1)}`);
  logEvent(UI.elog, 'hidden', 0, `your opening board: ${board(0)}`);
}

// Pull anything new off the engine's own log and mirror it in order. The engine
// log is the narrative; this keeps the file readable as a story rather than as a
// list of AI decisions with no context between them.
function drainEngineLog() {
  if (!UI.elog || !UI.E) return;
  const lg = UI.E.state.log;
  // The engine stores its log OLDEST-FIRST; renderLog() is what reverses it, not
  // the log itself. Reading it backwards here re-emitted the opening lines on
  // every drain, so the first version of this file said "New game. Seed 4242."
  // about thirty times.
  if (lg.length < UI.elogLen) {
    // The engine caps its log at 4000 entries and shifts off the front, which
    // moves every index. Far beyond a normal match, but say so rather than
    // silently duplicating or dropping.
    logEvent(UI.elog, 'public', 0, '[engine log hit its 4000-line cap; earlier lines were dropped]');
    UI.elogLen = 0;
  }
  for (let i = UI.elogLen; i < lg.length; i++) {
    const e = lg[i];
    if (!e) continue;
    // The engine already prints its own turn banner. Promote it to a separator
    // rather than emitting a second marker beside it.
    const m = /^---\s*Turn (\d+):\s*(.+?)\s*---$/.exec(e.text || '');
    if (m) logEvent(UI.elog, 'turn', Number(m[1]), m[2]);
    else logEvent(UI.elog, 'public', e.t, e.text);
  }
  UI.elogLen = lg.length;
}

// One AI decision, with what it passed over and what it was holding.
function logAIChoice(a) {
  if (!UI.elog || !a) return;
  const s = UI.E.state;
  const ai = UI.E._ai;
  const nm = uid => { const c = CARD_DB[uid.id]; return c ? c.name : uid.id; };
  const label = (ai && ai.actionLabel) ? ai.actionLabel(a) : a.t;
  logDecision(UI.elog, s.turn,
    a.__why ? `${label} — ${a.__why}` : label,
    a.__score,
    a.__considered,
    s.players[1].hand.map(nm).join(', ') || '(empty)');
}

// ------------------------------------------------------------------- fx ----
// The whole board is rebuilt on every render, so a CSS animation attached
// unconditionally would replay constantly. Instead we diff the state before and
// after each action and mark only what actually changed, with a short expiry.
UI.fxActive = (key) => (UI.fx[key] || 0) > Date.now();
UI.fxMark = (key, ms) => {
  const now = Date.now();
  for (const k in UI.fx) if (UI.fx[k] <= now) delete UI.fx[k];   // prune
  UI.fx[key] = now + (ms || 620);
};

function slotIndex(state) {
  const m = {};
  for (let pi = 0; pi < 2; pi++) {
    const p = state.players[pi];
    const all = (p.active ? [p.active] : []).concat(p.bench);
    all.forEach(s2 => { m[s2.uid] = { dmg: s2.dmg, pi }; });
  }
  return m;
}

function diffForFx(before, after) {
  const b = slotIndex(before), a = slotIndex(after);
  for (const uid in a) {
    if (b[uid] && a[uid].dmg > b[uid].dmg) UI.fxMark('hit' + uid);
  }
  // A KNOCK OUT, not merely a Pokemon that stopped being on the board. This read
  // "a slot that was here is gone", which is equally true of Scoop Up, Mr. Fuji
  // and Hurricane — so scooping your own Pokemon up threw the Knock Out banner.
  // The engine records the real thing per action now; see `koThisAction`.
  for (const k of (after.koThisAction || [])) UI.fxMark('ko' + k.pi, 900);
  for (let pi = 0; pi < 2; pi++) {
    if (after.players[pi].prizes.length < before.players[pi].prizes.length)
      UI.fxMark('prize' + pi, 900);
  }
  const anyFx = Object.keys(UI.fx).some(k => UI.fx[k] > Date.now());
  if (anyFx) setTimeout(() => { if (!presenting()) render(); }, 700);
}

// ------------------------------------------------- coin-flip presentation --
// The engine resolves an action synchronously, so the outcome is already in the
// state by the time we could announce a flip. Instead of predicting flips, we
// freeze the board on a pre-action snapshot and replay the log, pausing on each
// flip. Nothing is predicted; we only re-show what actually happened.
const presenting = () => UI.pres !== null;

function dispatch(pi, action) {
  if (presenting()) return;
  const before = JSON.parse(JSON.stringify(UI.E.state));
  const mark = UI.E.state.log.length;
  UI.E.state.peeked = null;
  UI.E.act(pi, action);
  // Peek reveals rather than moves, so the engine leaves the card it looked at
  // on the state and the UI is what actually shows it.
  const pk = UI.E.state.peeked;
  if (pi === 0 && pk) {
    const whose = pk.side === 'them' ? "your opponent's" : 'your';
    const where = pk.what === 'deck' ? `the top of ${whose} deck`
      : pk.what === 'hand' ? "a random card from your opponent's hand"
      : `one of ${whose} Prizes`;
    openReveal('Peek', where, [{ id: pk.id, uid: pk.uid }]);
    UI.E.state.peeked = null;
  }
  UI.sel = null; UI.targeting = null; UI.retreatArmed = false;
  const fresh = UI.E.state.log.slice(mark);
  if (!fresh.some(e => e.kind === 'flip') || UI.flipDelay < 250) {
    diffForFx(before, UI.E.state); render(); return;
  }
  // THE FX MUST NOT FIRE UNTIL THE COIN HAS LANDED. `diffForFx` reads the real
  // post-action state, so arming it here lights the prize tile, the KO flash and
  // the hit flash while the coin is still in the air — and on a flip that decides
  // whether something survives, the flashing prizes announce the result about two
  // seconds early. The board itself was always frozen behind the coin; the effects
  // were the one thing that escaped the freeze, which is why it went unnoticed.
  UI.view = before;
  UI.pres = { queue: fresh.slice(), banner: null, before };
  stepPresentation();
}

function stepPresentation() {
  const p = UI.pres;
  if (!p) return;
  while (p.queue.length && p.queue[0].kind !== 'flip') UI.view.log.push(p.queue.shift());
  if (!p.queue.length) {
    UI.pres = null; UI.view = null;
    // Unfrozen at last: the board and its effects update in the same frame, which
    // is the whole point. `presenting()` is already false, so diffForFx's own
    // follow-up render will fire and clear them when they expire.
    if (p.before) diffForFx(p.before, UI.E.state);
    render(); return;
  }

  const entry = p.queue.shift();
  const m = entry.text.match(/^Coin flip(?: \((.*?)\))?: (HEADS|TAILS)$/);
  const reason = (m && m[1]) ? m[1] : '';
  const result = m ? m[2] : '';

  p.banner = { phase: 'flipping', reason, result: '' };
  render();
  UI.presTimer = setTimeout(() => {
    UI.view.log.push(entry);
    p.banner = { phase: 'landed', reason, result };
    render();
    UI.presTimer = setTimeout(() => { p.banner = null; stepPresentation(); }, UI.flipHold);
  }, UI.flipDelay);
}

// ---------------------------------------------------------------- helpers --
const el = (tag, cls, txt) => { const d = document.createElement(tag); if (cls) d.className = cls; if (txt !== undefined) d.textContent = txt; return d; };
const S = () => UI.view || UI.E.state;
const me = () => S().players[0];
const foe = () => S().players[1];

function myLegal() {
  if (presenting()) return [];
  const s = UI.E.state;
  return (s.phase === 'main' || s.pendingPromote !== null || s.pendingSwitch !== null) ? UI.E.legalActions(0) : [];
}

function costPips(cost) {
  const w = el('span', 'pips');
  for (const c of cost) {
    const p = el('i', 'pip'); p.style.background = ENERGY_COLOR[c] || '#888'; p.title = ENERGY_NAME[c] || c;
    w.appendChild(p);
  }
  if (!cost) w.appendChild(el('span', 'free', 'free'));
  return w;
}

// ---------------------------------------------------------- card rendering -
function sigilBox(card, cls) {
  const d = el('div', 'sigil ' + (cls || ''));
  d.innerHTML = sigilSVG(card);
  return d;
}

function costRow(cost) {
  const w = el('span', 'pips');
  if (!cost) { w.appendChild(el('span', 'free', '—')); return w; }
  for (const c of cost) {
    const p = el('i', 'pip ink');
    p.style.background = ENERGY_INK[c] || ENERGY_INK.C;
    p.title = ENERGY_NAME[c] || c;
    w.appendChild(p);
  }
  return w;
}

function typeTag(t) {
  const s = el('span', 'typetag');
  s.style.background = ENERGY_INK[t] || ENERGY_INK.C;
  s.textContent = ENERGY_NAME[t] || t;
  return s;
}

// The colour a card is filed under: its own type for a Pokemon, the type it
// provides for an Energy, one purple for every Trainer. Painted onto the left
// edge, which is the only strip that survives being overlapped in a fanned hand.
function cardAccent(card) {
  if (card.kind === 'pokemon') return ENERGY_INK[card.type] || ENERGY_INK.C;
  if (card.kind === 'energy') return ENERGY_INK[(card.provides || 'C')[0]] || ENERGY_INK.C;
  return '#6F4C86';
}

// There was a `miniCard()` here: a compact face carrying attack names and
// clamped rules text, used by the hand, opening setup and the Trainer pickers.
// Every one of those replaced it — attack names cannot wrap in a ~100px column
// ("Fire Spin" rendered one letter per line) and a clamped Trainer paragraph is
// cut off mid-sentence, so the text it existed to carry was the text it
// destroyed. It survived unused for a job in case something wanted a compact
// text face; nothing did, and it was deleted 11 Aug 2026. See LAYOUT.md.

// The hand face. A card in hand is a thing you are
// deciding whether to play, and what you decide on is name, kind, and what the
// attacks cost against what they do. Attack NAMES and rules text were the whole
// of the problem — "Poisonpowder" cannot wrap inside a 95px column, so it broke
// mid-word into three lines, and a clamped Trainer paragraph got cut off mid-
// sentence anyway, which is worse than not showing it. The rail shows the real
// printed card on hover; that is where the words live now.
//
// Dropping the words also buys the width back, which is the other half of the
// job: a narrower card is a hand that fits more cards before it has to overlap.
function handCard(card, flags) {
  const d = el('div', 'pcard handcard k-' + card.kind);
  d.style.borderLeftColor = cardAccent(card);
  d.appendChild(el('div', 'hc-name', card.name));

  const tags = el('div', 'hc-tags');
  if (card.kind === 'pokemon') {
    tags.appendChild(typeTag(card.type));
    tags.appendChild(el('span', 'hc-hp', card.hp + ' HP'));
  } else if (card.kind === 'energy') {
    // Double Colorless provides 'CC'; the tag takes the type, the count rides
    // beside it rather than colouring a second pip that means the same thing.
    tags.appendChild(typeTag((card.provides || 'C')[0]));
    if ((card.provides || '').length > 1) tags.appendChild(el('span', 'hc-hp', '×' + card.provides.length));
  } else {
    tags.appendChild(el('span', 'typetag trainer', card.sub));
  }
  d.appendChild(tags);

  d.appendChild(sigilBox(card, 'hc-art'));

  // Cost on the left, damage on the right, nothing in between. Attacks with no
  // damage number still get their row — the cost is the information there, and
  // an absent row would make a two-attack Pokemon look like a one-attack one.
  if (card.kind === 'pokemon' && (card.attacks || []).length) {
    const atks = el('div', 'hc-atks');
    card.attacks.forEach(a => {
      const r = el('div', 'hc-atk');
      r.appendChild(costRow(a.cost));
      r.appendChild(el('span', 'hc-dmg', a.dmg || '·'));
      atks.appendChild(r);
    });
    d.appendChild(atks);
  }
  applySigilMarks(d, flags);
  return d;
}

// The real printed face, from assets/cards/<set>/<number>.png. These are the
// whole 1999 card — border, name box, the lot — so they belong only where the
// card is the SUBJECT rather than a token in play. If the set has not been
// fetched the image simply hides itself and the rendered face carries on alone.
function cardFaceImage(card, host) {
  const m = /^([a-z0-9]+)-(.+)$/.exec(card.id || '');
  if (!m) return null;
  const img = el('img', 'cardface');
  img.src = `assets/cards/${m[1]}/${m[2]}.png`;
  img.alt = card.name;
  img.loading = 'lazy';
  // The sigil is a stand-in for art we don't have. When the real face loads it
  // is no longer standing in for anything, so it goes — but only on success, so
  // an unfetched set falls back to exactly the old panel.
  img.onerror = () => {
    img.classList.add('miss');
    if (host && host.classList) host.classList.remove('has-face');
  };
  return img;
}

// Full face: the preview panel.
//
// `opts.noFace` renders the Sigil Card ALONE — our own drawing of the card,
// with no scan above it. That is the only surface that can express a print run
// (1st Edition, Shadowless), because every scan we have is permanently 1st
// Edition Shadowless. See PACKS.md Part 1 and sigilCard() below.
function fullCard(card, opts = {}) {
  const d = el('div', 'pcard full has-face k-' + card.kind);
  d.style.borderLeftColor = cardAccent(card);
  const face = opts.noFace ? null : cardFaceImage(card, d);
  if (face) d.appendChild(face); else d.classList.remove('has-face');
  const eyebrow = el('div', 'pc-eyebrow');
  eyebrow.appendChild(el('span', null,
    card.kind === 'pokemon' ? card.stage.toUpperCase()
      : card.kind === 'energy' ? (card.cls + ' ENERGY').toUpperCase()
      : String(card.sub).toUpperCase()));
  if (card.evolvesFrom) eyebrow.appendChild(el('span', 'pc-from', 'evolves from ' + card.evolvesFrom));
  d.appendChild(eyebrow);

  const head = el('div', 'pc-head');
  head.appendChild(el('div', 'pc-name big', card.name));
  if (card.kind === 'pokemon') head.appendChild(el('div', 'pc-hp big', card.hp + ' HP'));
  d.appendChild(head);

  d.appendChild(sigilBox(card, 'lg'));

  if (card.kind === 'pokemon') {
    const tr = el('div', 'pc-typerow');
    tr.appendChild(typeTag(card.type));
    d.appendChild(tr);

    if (card.power) {
      const pw = el('div', 'pc-power');
      // `kind` is what gen_cards.js writes ("Pokémon Power"). Reading `.type`
      // here printed "undefined: Energy Burn" on all six Power cards.
      pw.appendChild(el('div', 'pc-powname', card.power.kind + ': ' + card.power.name));
      pw.appendChild(el('div', 'pc-text', card.power.text));
      d.appendChild(pw);
    }
    (card.attacks || []).forEach(a => {
      const blk = el('div', 'pc-attack');
      const r = el('div', 'pc-atkline');
      r.appendChild(costRow(a.cost));
      r.appendChild(el('span', 'pc-atkname', a.name));
      r.appendChild(el('span', 'pc-atkdmg', a.dmg || '—'));
      blk.appendChild(r);
      if (a.text) blk.appendChild(el('div', 'pc-text', a.text));
      d.appendChild(blk);
    });

    const foot = el('div', 'pc-stats');
    const stat = (lbl, node) => { const b = el('div', 'pc-stat'); b.appendChild(el('span', 'pc-statlbl', lbl)); b.appendChild(node); return b; };
    const wk = card.wkType ? (() => { const w = el('span', 'pc-statval'); w.appendChild(costRow(card.wkType)); w.appendChild(el('span', null, ' ' + card.wkVal)); return w; })() : el('span', 'pc-statval', '—');
    const rs = card.rsType ? (() => { const w = el('span', 'pc-statval'); w.appendChild(costRow(card.rsType)); w.appendChild(el('span', null, ' ' + card.rsVal)); return w; })() : el('span', 'pc-statval', '—');
    foot.appendChild(stat('weakness', wk));
    foot.appendChild(stat('resistance', rs));
    foot.appendChild(stat('retreat', card.retreat ? costRow('C'.repeat(card.retreat)) : el('span', 'pc-statval', '—')));
    d.appendChild(foot);
  } else {
    d.appendChild(el('div', 'pc-text body', card.text || (card.cls === 'Basic' ? 'Provides one ' + (ENERGY_NAME[card.provides] || '') + ' Energy.' : '')));
  }

  const cred = el('div', 'pc-credit');
  cred.appendChild(el('span', null, card.id));
  if (card.rarity) cred.appendChild(el('span', null, card.rarity));
  if (card.artist) cred.appendChild(el('span', null, card.artist));
  d.appendChild(cred);
  return d;
}

// Clicking a card notes it as the inspected one but deliberately does NOT
// switch the rail to the CARD tab. It used to, and it meant every card you
// picked up threw the log away — which is the panel you actually want up while
// a turn is running. Hovering is how you look at a card now; the CARD tab holds
// whatever you last clicked, for when you want it to stay put.
function inspectCard(id) {
  UI.inspect = id;
}

// Peek: swap the rail's body for a card while the pointer is over it, and put
// the old body back on the way out. Deliberately a targeted DOM swap rather
// than a render() — the whole board is rebuilt on every render, and doing that
// on mouseenter would be visible.
function railPeek(cardId) {
  const rail = UI.railEl, body = UI.railBody;
  if (!rail || !body || typeof rail.replaceChild !== 'function') return;
  if (UI.peekEl) { rail.replaceChild(body, UI.peekEl); UI.peekEl = null; }
  if (!cardId) return;
  const c = CARD_DB[cardId];
  if (!c) return;
  const box = el('div', 'prevbox peek');
  box.appendChild(fullCard(c));
  rail.replaceChild(box, body);
  UI.peekEl = box;
}

function peekOn(node, cardId) {
  node.onmouseenter = () => railPeek(cardId);
  node.onmouseleave = () => railPeek(null);
  return node;
}

// ------------------------------------------------------------- rendering ---

// Promote and Whirlwind's send-up are bench clicks, so their targeting has to
// be armed BEFORE the bench is drawn.
//
// It lived in renderActionBar() first, which looks reasonable and is wrong by
// exactly one step: render() builds the table and then the bar, so the tiles
// asked slotTargetable() while UI.targeting was still null and drew themselves
// unhighlighted. The prompt appeared, nothing lit up, and only a second
// unrelated render would fix it. Same shape as writeViewportDump() having to
// run after chooseLayout() — see LAYOUT.md.
function armForcedChoice() {
  if (!UI.E) return;
  const s = UI.view || UI.E.state;
  if (!s || s.winner !== null) return;
  const promote = s.pendingPromote === 0;
  const send = s.pendingSwitch === 0;
  if (!promote && !send) {
    if (UI.targeting && UI.targeting.forced) UI.targeting = null;
    return;
  }
  if (UI.targeting && UI.targeting.forced) return;      // already armed
  UI.targeting = {
    scope: 'promote', forced: true,
    prompt: promote
      ? 'Your Active Pokemon was Knocked Out — choose a replacement from your Bench.'
      : 'Whirlwind! Choose one of your Benched Pokemon to send up.',
    dispatch: (opts) => dispatch(0, { t: promote ? 'promote' : 'switchIn', bench: opts.bench }),
  };
}
// ---------------------------------------------------------- scroll memory --
// `render()` throws the whole DOM away and rebuilds it, so every scroll position
// in the game is destroyed on every click. On the board that is invisible —
// nothing there scrolls. In the collection screens it was the single worst piece
// of friction in the game: adding one card to a deck threw you back to the top of
// a 221-card grid, so building anything meant re-scrolling once per card, and
// putting in 18 Fire Energy meant doing it eighteen times.
//
// `keepScroll(node, key)` opts an element in. Positions are read from the OLD
// elements before the wipe and written to the NEW ones after everything is in the
// document — a scrollTop set on a detached node is silently discarded, which is
// the whole reason this is two passes rather than one.
//
// Deliberately not `querySelectorAll` + `data-` attributes: `smoke.js` stubs the
// DOM and implements neither, and a UI mechanism that cannot run in the suite is
// a UI mechanism with no tests.
UI.scrollKeep = {};        // key -> last known scrollTop
UI.scrollers = {};         // key -> element from the render in progress
UI.scrollReset = {};       // keys to send back to the top on the next render
function keepScroll(node, key) { UI.scrollers[key] = node; return node; }

// Harvest FIRST, then honour resets. Every caller of `resetScroll` does its work
// and then calls `render()`, so a reset applied before the harvest is read
// straight back off the element that is about to be thrown away — which is
// exactly what happened, and made `resetScroll` do nothing at all until a test
// tried to prove it worked.
function harvestScroll() {
  for (const k in UI.scrollers) {
    const n = UI.scrollers[k];
    if (n && typeof n.scrollTop === 'number') UI.scrollKeep[k] = n.scrollTop;
  }
  for (const k in UI.scrollReset) delete UI.scrollKeep[k];
  UI.scrollReset = {};
}
// Always writes, and no entry means the top. Writing 0 to a freshly built element
// is a no-op in a browser — it is already 0 — but it makes "we deliberately reset
// this one" a thing the code states rather than a thing that happens by omission.
function applyScroll() {
  for (const k in UI.scrollers) {
    const n = UI.scrollers[k];
    if (n) n.scrollTop = UI.scrollKeep[k] || 0;
  }
}
// Call when the list underneath a scroller changes so much that holding position
// would be meaningless — switching collection tab, or opening a different deck.
function resetScroll(key) { UI.scrollReset[key] = 1; }

function render() {
  harvestScroll();
  UI.scrollers = {};
  renderScreen();
  applyScroll();
}

function renderScreen() {
  const root = document.getElementById('app');
  armForcedChoice();
  root.innerHTML = '';
  if (UI.screen === 'newsave') { root.appendChild(renderNewSave()); return; }
  if (UI.screen === 'packs' && UI.pack) {
    root.appendChild(renderPackScreen());
    if (UI.detail) root.appendChild(renderPullDetail());
    return;
  }
  if (UI.screen === 'builder' && UI.builder) {
    root.appendChild(renderBuilder());
    if (UI.pilePick) root.appendChild(renderPilePicker());
    return;
  }
  if (UI.screen === 'collection' && UI.save) {
    root.appendChild(renderCollection());
    if (UI.detail) root.appendChild(renderPullDetail());
    if (UI.importing) root.appendChild(renderImport());
    return;
  }
  if (UI.screen === 'decks') {
    root.appendChild(renderDeckSelect());
    if (UI.importing) root.appendChild(renderImport());
    return;
  }
  if (!UI.E) { root.appendChild(el('div', 'empty', 'No game loaded.')); return; }
  settleResult();      // pays out a finished game exactly once

  UI.handEl = null; UI.handPanelEl = null; UI.vpDumpEl = null;
  const wrap = el('div', 'wrap');
  wrap.appendChild(renderBoardColumn());
  wrap.appendChild(renderRail());
  root.appendChild(wrap);

  if (UI.picker) root.appendChild(renderPicker());
  if (UI.reveal) root.appendChild(renderReveal());
  // The setup sheet would cover the centre line, which is where the coin lands —
  // so the opening flip gets the board to itself and the sheet arrives after it.
  if (S().phase === 'setup' && !presenting()) root.appendChild(renderSetup());
  if (S().phase === 'over') root.appendChild(renderOver());

  chooseLayout();
  layoutHand();
  writeViewportDump();      // only meaningful once the fitter has settled
  maybeRunAI();
}

// Wide layout or stacked? Decided by MEASURING, never by a media query.
// A media query tests CSS pixels, and CSS pixels are not what you see: with
// Windows display scaling at 125%, a 1920-wide screen is a 1536-wide page, so
// a `min-width:1560px` rule silently never fires on the machine it was written
// for. Worse, fitBoard() may scale the column, which changes how much CSS width
// the content has — so the honest test is to lay it out and look.
function chooseLayout() {
  const col = UI.boardEl;
  if (!col || !col.classList) { fitBoard(); return; }
  col.classList.add('wide');
  fitBoard();
  if (typeof col.scrollWidth === 'number' && col.scrollWidth - col.clientWidth > 1) {
    col.classList.remove('wide');
    fitBoard();
  }
  UI.wideLayout = col.classList.contains('wide');
}

// Fit the board to whatever height it actually got, rather than to a height we
// guessed. A "1920x1080 laptop" is not a 1920x1080 page: browser chrome and the
// taskbar take 150-200px, and Windows display scaling at 125% or 150% can leave
// the page as little as 1280x600 CSS pixels. Hand-tuning to any one of those
// numbers is how the first attempt went wrong.
//
// So when the mat is squeezed, scale the whole column down until it isn't.
// `zoom` rather than transform:scale because zoom reflows — the mat really does
// get smaller instead of being drawn smaller over the same footprint. And it
// costs nothing perceptually on a scaled display: at 150% OS scaling, a 0.8 zoom
// is still larger than 1:1 on an unscaled screen.
function fitBoard() {
  const col = UI.boardEl, table = UI.tableEl;
  if (!col || !table || !col.style || typeof col.clientHeight !== 'number') return;
  col.style.zoom = '';
  UI.fitZoom = 1;

  // --- too tall: shrink until the mat stops scrolling ---
  // Each pass changes the CSS-pixel space the next one measures in, so this
  // converges rather than solving in one shot. Four passes is plenty.
  for (let i = 0; i < 4; i++) {
    const over = table.scrollHeight - table.clientHeight;
    if (over <= 1) break;
    const h = col.clientHeight;
    if (!h) break;
    // +4px of cushion: solving for an exact fit leaves a few pixels of overflow
    // once rounding lands, and a mat that scrolls by 4px is still a mat that
    // scrolls.
    const z = Math.max(0.6, UI.fitZoom * (h / (h + over + 4)));
    if (Math.abs(z - UI.fitZoom) < 0.002) break;
    UI.fitZoom = z;
    col.style.zoom = z.toFixed(3);
  }
  if (UI.fitZoom < 0.999) return;

  // --- room to spare: grow, rather than leaving a band of empty desk ---
  // Standing the bench beside the Active freed a lot of height, and on a large
  // window that turned into 230px of nothing between the mat and the hand. The
  // useful thing to do with spare room is bigger cards, not a bigger gap.
  // Stepped and re-measured rather than solved, because the binding constraint
  // moves: sometimes it is the mat starting to scroll, sometimes the action bar
  // reaching the bottom of the window, sometimes the mat running out of width.
  let z = 1;
  for (let i = 0; i < 12; i++) {
    const next = Math.round((z + 0.05) * 100) / 100;
    if (next > 1.3) break;
    col.style.zoom = String(next);
    if (boardFitsAt()) z = next;
    else break;
  }
  col.style.zoom = z > 1.001 ? String(z) : '';
  UI.fitZoom = z;
}

// Measured with whatever zoom is currently applied.
function boardFitsAt() {
  const col = UI.boardEl, table = UI.tableEl, bar = UI.barEl;
  if (table.scrollHeight - table.clientHeight > 1) return false;
  if (col.scrollWidth - col.clientWidth > 1) return false;
  if (bar && typeof bar.getBoundingClientRect === 'function') {
    const vh = (typeof innerHeight === 'number') ? innerHeight : 0;
    if (vh && bar.getBoundingClientRect().bottom > vh - 6) return false;
  }
  return true;
}

// The hand must never wrap — a second row costs ~70px of mat, and on a laptop
// the mat has none to give. So the cards fan instead: they overlap only as far
// as they have to, which for a normal 5-7 card hand is not at all. Measured
// after layout rather than assumed, so it holds at any window width.
function layoutHand() {
  // renderHand() stashes the node rather than us querying for it: the headless
  // harness's DOM stub has no querySelector, and there is no reason to search
  // the tree for something we just built.
  const hand = UI.handEl;
  if (!hand || !hand.style) return;
  const cards = hand.children;
  const n = cards.length;

  // The hand panel is the near edge of the same table, so it starts at the
  // mat's width rather than at the board column's. Spanning the whole column
  // left a bordered box two thirds empty sitting under a mat that had just
  // been narrowed to its contents — the panel read as a container, not as a
  // hand. It still grows past the mat when the hand genuinely needs the room,
  // up to the full column, so a big hand is never squeezed for symmetry.
  const panel = UI.handPanelEl, table = UI.tableEl, col = UI.boardEl;
  if (panel && panel.style && table && col && typeof table.offsetWidth === 'number') {
    const cw = n ? (cards[0].offsetWidth || 0) : 0;
    const natural = n ? cw * n + 7 * (n - 1) + 22 : 0;   // 22 = the panel's own padding
    const roomy = Math.max(0, (col.clientWidth || 0) - 24);
    const want = Math.max(table.offsetWidth || 0, Math.min(roomy, natural));
    if (want > 0) panel.style.width = want + 'px';
  }

  if (n < 2) return;
  // offsetWidth, NOT getBoundingClientRect: fitBoard() may have zoomed the whole
  // column, and getBoundingClientRect reports post-zoom screen pixels while
  // clientWidth reports pre-zoom layout pixels. Mixing the two under-counts the
  // card width and overflows the hand off the right edge. Both of these are
  // layout pixels, so they are comparable.
  const w = cards[0].offsetWidth;
  // 2px of slack: fitBoard applies fractional zoom, and the browser's rounding
  // of a scaled layout can report a pixel or two of overflow even when every
  // card demonstrably fits. That spurious pixel raises a scrollbar.
  const avail = (hand.clientWidth || 0) - 2;
  if (!w || avail <= 0) return;
  // Floor, never round: the error is multiplied by (n-1) gaps, so rounding up
  // pushes the last card past the edge on a big hand. Floor only ever tightens.
  //
  // The 34px lower bound is what a card must still show of itself when the fan
  // is at its tightest: the type-coloured left edge, the first characters of
  // the name, and the left of its sigil. It was 22, which was tuned against a
  // 150px card carrying attack names it could not fit anyway. It only binds
  // past ~28 cards at 1366px, and overflowing is the correct failure there —
  // the alternative is a row of 22px slivers that says nothing.
  const step = Math.max(34, Math.min(w + 7, (avail - w) / (n - 1)));
  hand.style.setProperty('--fan', Math.floor(step - w) + 'px');
}

// The two halves share one mat rather than sitting in separate panels — that is
// most of what makes the board read as a board. The centre line is printed on
// it, and doubles as where the game shouts at you.
function renderBoardColumn() {
  const col = el('div', 'boardcol');
  col.appendChild(renderStatusBar());
  const table = el('div', 'table');
  table.appendChild(renderSide(1, true));
  table.appendChild(renderCentreLine());
  table.appendChild(renderSide(0, false));
  UI.boardEl = col; UI.tableEl = table;
  col.appendChild(table);
  col.appendChild(renderHand());
  UI.barEl = renderActionBar();
  col.appendChild(UI.barEl);
  return col;
}

function renderStatusBar() {
  const s = S();
  const bar = el('div', 'statusbar');
  const who = s.phase === 'over' ? 'Game over'
    : s.pendingSwitch !== null ? (s.pendingSwitch === 0 ? 'Whirlwind — choose a Pokemon to send up' : 'Opponent is choosing')
    : s.pendingPromote !== null ? (s.pendingPromote === 0 ? 'Choose a Pokemon to promote' : 'Opponent is promoting')
    : (s.active === 0 ? 'Your turn' : "Opponent's turn");
  const t = el('div', 'turnflag' + (s.active === 0 && s.phase === 'main' ? ' mine' : ''), who);
  bar.appendChild(t);
  bar.appendChild(el('div', 'turnno', `turn ${s.turn}`));
  bar.appendChild(el('div', 'seedno', `seed ${UI.E.seed}`));
  return bar;
}

// The last handful of log entries, printed on the mat. Oldest at the top so it
// reads downward like a ticker — the opposite of the rail, which is newest-first
// because you scroll back through it.
function renderMatLog() {
  const box = el('div', 'matlog');
  const entries = S().log.slice(-5);
  entries.forEach(e => {
    const d = el('div', 'mlline k-' + e.kind);
    d.appendChild(el('span', 'lx', e.text));
    box.appendChild(d);
  });
  return box;
}

// The two coin faces, drawn rather than lettered. An H and a T are unambiguous
// and say nothing; the point of putting the toss on the mat is that a flip is
// the one moment the whole game stops and waits, so it should look like an
// object. Obverse is struck in the board's amber, reverse in its steel, and
// both carry a milled rim so the edge reads as metal when it tumbles.
function coinFaceSVG(kind) {
  const heads = kind === 'heads';
  const col = heads ? '#E2A84B' : '#9AA5B0';
  const field = heads ? '#3A2F1C' : '#242C35';
  const p = [];
  p.push(`<circle cx="50" cy="50" r="47" fill="${field}" stroke="${col}" stroke-width="2.5"/>`);
  // milled rim
  for (let i = 0; i < 36; i++) {
    const a = (i * 10) * Math.PI / 180;
    p.push(`<line x1="${(50 + 43 * Math.cos(a)).toFixed(1)}" y1="${(50 + 43 * Math.sin(a)).toFixed(1)}" x2="${(50 + 47 * Math.cos(a)).toFixed(1)}" y2="${(50 + 47 * Math.sin(a)).toFixed(1)}" stroke="${col}" stroke-width="1.4" opacity="0.55"/>`);
  }
  if (heads) {
    // a struck hexagon with rays — the same geometric family as the sigils
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 - 90) * Math.PI / 180;
      pts.push((50 + 20 * Math.cos(a)).toFixed(1) + ',' + (50 + 20 * Math.sin(a)).toFixed(1));
    }
    p.push(`<circle cx="50" cy="50" r="33" fill="none" stroke="${col}" stroke-width="1" opacity="0.45"/>`);
    p.push(`<polygon points="${pts.join(' ')}" fill="${col}"/>`);
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 - 60) * Math.PI / 180;
      p.push(`<line x1="${(50 + 25 * Math.cos(a)).toFixed(1)}" y1="${(50 + 25 * Math.sin(a)).toFixed(1)}" x2="${(50 + 32 * Math.cos(a)).toFixed(1)}" y2="${(50 + 32 * Math.sin(a)).toFixed(1)}" stroke="${col}" stroke-width="2" opacity="0.8"/>`);
    }
  } else {
    p.push(`<circle cx="50" cy="50" r="31" fill="none" stroke="${col}" stroke-width="2.4"/>`);
    p.push(`<circle cx="50" cy="50" r="18" fill="none" stroke="${col}" stroke-width="1.5" opacity="0.7"/>`);
    p.push(`<circle cx="50" cy="50" r="5.5" fill="${col}"/>`);
  }
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${p.join('')}</svg>`;
}

// The toss happens ON THE CENTRE LINE, and that placement is the whole design
// decision. Half of all flips are the opponent's — Poison Sting, Confuse Ray,
// their Whirlwind — so anything anchored to your hand or your half would be
// claiming their coin was tossed on your side of the table. The centre line is
// between the two players, it is already where the board shouts at you, and it
// is the one spot that is there whatever the hand is doing.
//
// It is absolutely positioned out of a zero-height line so it overhangs both
// halves without reflowing either. That matters: the board is frozen behind it
// anyway, and a coin that resized the mat would move the very cards you are
// waiting on.
function renderCoinToss(b) {
  const landed = b.phase === 'landed';
  const side = b.result === 'HEADS' ? 'heads' : 'tails';
  const box = el('div', 'cointoss');
  const cap = el('div', 'coincap ' + (landed ? 'landed ' + side : 'flipping'));

  const coin = el('div', 'coin');
  const o = el('div', 'coinside obverse'); o.innerHTML = coinFaceSVG('heads');
  const r = el('div', 'coinside reverse'); r.innerHTML = coinFaceSVG('tails');
  coin.appendChild(o); coin.appendChild(r);
  cap.appendChild(coin);

  const txt = el('div', 'cointext');
  txt.appendChild(el('div', 'coinresult', landed ? b.result : 'IN THE AIR'));
  txt.appendChild(el('div', 'coinreason', b.reason || (landed ? '' : 'flipping')));
  cap.appendChild(txt);

  box.appendChild(cap);
  return box;
}

// ------------------------------------------------- choosing which Energy ---
// Seven effects discard Energy off a Pokemon and the engine used to pick by
// array order. Which Fire leaves a Charizard is the difference between attacking
// next turn and not, so it is the player's call — but only when it IS a call:
// `energyChoiceIsReal` suppresses the picker whenever the eligible cards are all
// the same thing, which is most of the time.
//
// It lives on the centre line, in the coin's own spot, on Trevor's call (12 Aug):
// a picker that appears wherever the action is makes you hunt for it with your
// eye every time, and a fixed place is learned once. The two are never live
// together — a coin is presentation, this is an interaction the game is waiting
// on — so they share the strip rather than competing for it. Unlike the coin it
// takes pointer events, and like the coin it must clear the ticker underneath,
// because the ticker is what says WHY you are being asked.
function renderEnergyPick(p) {
  const box = el('div', 'cointoss energypick');
  const cap = el('div', 'coincap pickcap');

  const need = el('div', 'picklabel');
  need.appendChild(el('div', 'coinresult', p.title));
  need.appendChild(el('div', 'coinreason', p.hint));
  cap.appendChild(need);

  const row = el('div', 'pickrow');
  p.pool.forEach(e => {
    const on = p.chosen.indexOf(e.uid) >= 0;
    const card = CARD_DB[e.id];
    const t = el('div', 'picken' + (on ? ' on' : ''));
    const face = pullFace(card, []);
    if (face) t.appendChild(face);
    t.appendChild(el('div', 'pickname', card.name + (e.asEnergy ? ` → ${ENERGY_NAME[e.asEnergy] || e.asEnergy}` : '')));
    t.title = card.name;
    t.onclick = () => toggleEnergyPick(e.uid);
    row.appendChild(t);
  });
  cap.appendChild(row);

  if (p.cancel) {
    const x = el('button', 'btn small', 'Cancel');
    x.onclick = () => { UI.energyPick = null; render(); };
    cap.appendChild(x);
  }
  box.appendChild(cap);
  return box;
}

// Clicking an Energy toggles it. The pick commits the moment it is satisfied
// rather than needing a Done — every one of these is "choose exactly N", so a
// confirmation step would be a click with no choice in it, which is the same
// argument that took the verb menu off the action bar.
function toggleEnergyPick(uid) {
  const p = UI.energyPick;
  if (!p) return;
  const at = p.chosen.indexOf(uid);
  if (at >= 0) p.chosen.splice(at, 1);
  else p.chosen.push(uid);
  if (p.satisfied(p.chosen)) {
    const done = p.onDone, chosen = p.chosen.slice();
    UI.energyPick = null;
    done(chosen);
    return;
  }
  render();
}

// Arms the picker if the choice is real, and otherwise runs the action straight
// through — the engine's fallback picks, exactly as it did before there was a
// picker. Returns true if it took over.
function askEnergy(opts) {
  const pool = UI.E.energyChoices(opts.slot, opts.filter || null);
  const real = opts.real !== undefined ? opts.real
    : UI.E.energyChoiceIsReal(opts.slot, opts.n, opts.filter || null);
  if (!real) return false;
  // The choice that led here is made, so the targeting that made it must go —
  // otherwise the bench stays highlighted and the bar keeps printing the prompt
  // for a question already answered.
  UI.targeting = null;
  UI.energyPick = {
    title: opts.title, hint: opts.hint, pool, chosen: [],
    cancel: opts.cancel !== false,
    satisfied: opts.satisfied || (c => c.length >= opts.n),
    onDone: opts.onDone,
  };
  render();
  return true;
}

// Three Trainers ask a second, finer question once you have picked the Pokemon:
// which Energy on it. Each step names the uid field holding its slot and the
// engine option key its answer fills — see `takeEnergy` for why there are two.
const TRAINER_ENERGY = {
  'base1-92': [{ uidKey: 'targetUid', n: 1, key: 'energyUids', title: 'ENERGY REMOVAL', hint: 'choose the Energy to discard' }],
  'base1-90': [{ uidKey: 'targetUid', n: 1, key: 'energyUids', title: 'SUPER POTION', hint: 'choose the Energy to discard' }],
  'base1-79': [{ uidKey: 'selfUid',   n: 1, key: 'costUids',   title: 'SUPER ENERGY REMOVAL', hint: 'choose YOUR Energy to discard as the cost' },
               { uidKey: 'targetUid', n: 2, key: 'energyUids', title: 'SUPER ENERGY REMOVAL', hint: 'choose 2 of theirs to strip' }],
};

// Walks the steps in order, skipping any whose choice is not real, and plays the
// card once they are answered. Cancelling any step abandons the whole play,
// which is right — you have not committed the card until it resolves.
function playTrainerEnergy(hand, card, opts, step) {
  const steps = TRAINER_ENERGY[card.id] || [];
  let k = step || 0;
  const play = () => dispatch(0, { t: 'playTrainer', hand, opts });
  while (k < steps.length) {
    const s = steps[k];
    const slot = UI.E.allSlots(0).concat(UI.E.allSlots(1)).find(x => x.uid === opts[s.uidKey]);
    const next = k + 1;
    if (slot && askEnergy({
      slot, n: s.n, title: s.title, hint: `${slot ? nameOfSlot(slot) : ''} — ${s.hint}`,
      onDone: (uids) => { opts[s.key] = uids; playTrainerEnergy(hand, card, opts, next); },
    })) return;
    k = next;
  }
  play();
}

const nameOfSlot = slot => (CARD_DB[(slot.stack && slot.stack.length ? slot.stack[slot.stack.length - 1].id : slot.id)] || {}).name || '';

function renderCentreLine() {
  const m = el('div', 'centreline');
  // The toss outranks both of the others: it is the only one of the three that
  // the game is actually WAITING on, and a Knock Out that happened in the same
  // action still gets its banner once the coin has landed and play resumes.
  const b = UI.pres && UI.pres.banner;
  if (b) { m.classList.add('tossing'); m.appendChild(renderCoinToss(b)); return m; }
  // Same slot as the coin, and they cannot both be live: a coin is presentation
  // and this is an interaction the game is waiting on.
  if (UI.energyPick) {
    m.classList.add('tossing');
    m.appendChild(renderEnergyPick(UI.energyPick));
    return m;
  }
  if (UI.fxActive('ko0') || UI.fxActive('ko1')) {
    m.appendChild(el('div', 'kobanner', 'KNOCKED OUT'));
  } else if (UI.targeting) {
    m.appendChild(el('div', 'prompt', UI.targeting.prompt));
  }
  return m;
}

// ---------------------------------------------------------------- zones ----
// Prizes, deck and discard are physical stacks on the mat, not numbers in a
// header. Face-down cards read as objects you can count at a glance.
function cardBack(cls) {
  const d = el('div', 'cardback ' + (cls || ''));
  d.appendChild(el('i', 'cb-mark'));
  return d;
}

function stackZone(label, n, cls) {
  const z = el('div', 'zone ' + (cls || ''));
  const stack = el('div', 'stack');
  const shown = Math.min(3, n);
  for (let i = 0; i < shown; i++) {
    const c = cardBack('sm');
    c.style.transform = `translate(${i * 2}px, ${-i * 2}px)`;
    stack.appendChild(c);
  }
  if (n === 0) stack.appendChild(el('div', 'stack-empty'));
  z.appendChild(stack);
  const cap = el('div', 'zone-cap');
  cap.appendChild(el('b', null, String(n)));
  cap.appendChild(el('span', null, label));
  z.appendChild(cap);
  if (n <= 5 && label === 'deck') z.classList.add('hot');
  return z;
}

function prizeZone(p, mine) {
  const z = el('div', 'zone prizes');
  z.appendChild(el('div', 'zonelabel', 'PRIZES'));
  const grid = el('div', 'prizegrid');
  const total = UI.E.cfg.prizeCount;
  for (let i = 0; i < total; i++) {
    if (i < p.prizes.length) grid.appendChild(cardBack('pz'));
    else {
      const t = el('div', 'cardback pz taken');
      if (UI.fxActive('prize' + (mine ? '0' : '1'))) t.classList.add('fx-prize');
      grid.appendChild(t);
    }
  }
  z.appendChild(grid);
  const cap = el('div', 'zone-cap');
  cap.appendChild(el('b', null, String(p.prizes.length)));
  cap.appendChild(el('span', null, 'prizes'));
  z.appendChild(cap);
  if (p.prizes.length <= 2) z.classList.add('hot');
  return z;
}

function renderSide(pi, isFoe) {
  const p = S().players[pi];
  const side = el('div', 'side' + (isFoe ? ' foe' : ' mine'));

  const head = el('div', 'sidehead');
  head.appendChild(el('div', 'sidename', isFoe ? 'OPPONENT' : 'YOU'));
  head.appendChild(el('div', 'sidedeck', isFoe ? foeDeckLabel() : UI.myDeck));
  const hand = el('div', 'handcount');
  hand.appendChild(el('b', null, String(p.hand.length)));
  hand.appendChild(el('span', null, 'in hand'));
  head.appendChild(hand);
  side.appendChild(head);

  const mat = el('div', 'mat');

  const play = el('div', 'playarea');
  const benchWrap = el('div', 'benchzone');
  const bl = el('div', 'zonelabel', 'BENCH');
  benchWrap.appendChild(bl);
  const benchRow = el('div', 'bench');
  for (let i = 0; i < UI.E.cfg.benchMax; i++) {
    if (p.bench[i]) benchRow.appendChild(renderBenchTile(p.bench[i], pi, i));
    else benchRow.appendChild(el('div', 'slot empty benchslot', ''));
  }
  benchWrap.appendChild(benchRow);

  const actWrap = el('div', 'activezone');
  actWrap.appendChild(el('div', 'zonelabel', 'ACTIVE'));
  const actRow = el('div', 'activerow');
  if (p.active) actRow.appendChild(renderSlot(p.active, pi, 'active', -1));
  else actRow.appendChild(el('div', 'slot empty act', 'EMPTY'));
  actWrap.appendChild(actRow);

  // Always Active then field, both halves — CSS `order` flips the opponent back
  // when the two are stacked. Doing it here instead would stop the wide layout
  // from putting them in a row with the Actives aligned.
  //
  // Prizes ride above the bench inside the field rather than sitting in a column
  // of their own. That column was the widest empty thing on the mat, and losing
  // it pulls both sides in by its whole width.
  play.appendChild(actWrap);
  const field = el('div', 'fieldzone');
  // Your Active is taller than your field, which leaves a gap beside it in the
  // wide layout. Rather than pad it, put the last few log lines on the mat —
  // so the game narrates itself without you having to keep the rail on LOG.
  // Hidden when stacked, where there is no gap to fill.
  if (!isFoe) field.appendChild(renderMatLog());
  field.appendChild(prizeZone(p, !isFoe));
  field.appendChild(benchWrap);
  play.appendChild(field);
  mat.appendChild(play);

  const rails = el('div', 'railzones');
  rails.appendChild(stackZone('deck', p.deck.length, 'deckzone'));
  rails.appendChild(stackZone('discard', p.discard.length, 'discardzone'));
  mat.appendChild(rails);

  side.appendChild(mat);
  return side;
}

// While a Power mode is open the board highlights whatever is legal RIGHT NOW,
// read straight off the engine's own action list rather than re-deriving the
// rules here. That is what keeps "can't Knock Out the receiver" from having to
// be stated twice.
// Powers come in two shapes. Two-step ones enumerate actions carrying `from`
// (Damage Swap, Energy Trans): pick a source, then a destination. One-step ones
// don't (Rain Dance — every basic Water Energy in hand is the same card, so
// there is nothing to choose but the destination).
// [source prompt, destination prompt]. One-step Powers only ever use index 1.
const POWER_PROMPT = {
  MOVE_DAMAGE: ['choose a Pokemon to move a damage counter FROM', 'choose a Pokemon to move it TO'],
  MOVE_ENERGY: ['choose a Pokemon to take Energy FROM', 'choose a Pokemon to move that Energy TO'],
  EXTRA_ATTACH: ['', 'choose a Pokemon to attach Energy to'],
  // Buzzap picks a target and then a TYPE, so it has its own branch below.
  BUZZAP: ['choose one of your other Pokemon to attach the Energy to', 'choose a type of Energy'],
};

function powerMoves(pm) {
  return myLegal().filter(a => a.t === 'power' && a.uid === pm.uid && a.kind === pm.kind);
}
function powerIsTwoStep(pm) {
  const m = powerMoves(pm);
  return m.length > 0 && m[0].from !== undefined;
}

function slotPowerTargetable(slot, pi) {
  const pm = UI.powerMode; if (!pm || pi !== 0) return false;
  const moves = powerMoves(pm);
  // Buzzap picks the Pokemon first, then the Energy type from the action bar —
  // so once a target is chosen the board stops offering anything.
  if (pm.kind === 'BUZZAP') return pm.to === null && moves.some(a => a.to === slot.uid);
  if (!powerIsTwoStep(pm)) return moves.some(a => a.to === slot.uid);
  return pm.from === null
    ? moves.some(a => a.from === slot.uid)
    : moves.some(a => a.from === pm.from && a.to === slot.uid);
}

function slotTargetable(slot, pi, where, idx) {
  if (UI.powerMode) return slotPowerTargetable(slot, pi);
  const t = UI.targeting; if (!t) return false;
  switch (t.scope) {
    case 'ownBench': return pi === 0 && where === 'bench';
    case 'oppBench': return pi === 1 && where === 'bench';
    case 'oppEnergy': return pi === 1 && slot.energy.length > 0;
    case 'ownEnergy': return pi === 0 && slot.energy.length > 0;
    case 'ownAny': return pi === 0;
    case 'ownEvolved': return pi === 0 && slot.stack.length > 1;
    case 'ownDamaged': return pi === 0 && slot.dmg > 0;
    case 'ownDamagedEnergy': return pi === 0 && slot.dmg > 0 && slot.energy.length > 0;
    case 'promote': return pi === 0 && where === 'bench';
    case 'attachTo': case 'evolveOn': case 'breederTarget':
      return pi === 0 && t.uids.includes(slot.uid);
    // Sneak Attack picks "1 of your opponent's Pokemon" — Active INCLUDED, which
    // no earlier scope covers: oppBench stops at the Bench and oppEnergy wants
    // Energy on it.
    case 'oppAny': return pi === 1;
    default: return false;
  }
}

// The variant of the PHYSICAL card occupying a slot — the top of the stack,
// which is the card you actually played. Not `topCard`: that honours Transform,
// and a Ditto wearing a Blastoise is still physically a Ditto, so it keeps its
// own printing. Empty for anything without a chosen variant, which is nearly
// everything.
function slotVariantFlags(slot) {
  const phys = slot && slot.stack && slot.stack[slot.stack.length - 1];
  return (phys && phys.v) ? vflags(phys.v) : [];
}

function renderSlot(slot, pi, where, idx) {
  const c = topCard(CARD_DB, slot);
  const d = el('div', 'slot pcard play k-pokemon');
  if (where === 'active') d.classList.add('act');
  const can = slotTargetable(slot, pi, where, idx);
  if (can) d.classList.add('targetable');
  if (UI.inspect === c.id) d.classList.add('inspected');
  if (UI.fxActive('hit' + slot.uid)) d.classList.add('fx-hit');

  const top = el('div', 'pc-head');
  top.appendChild(el('div', 'pc-name', c.name));
  const hp = el('div', 'pc-hp');
  hp.textContent = Math.max(0, c.hp - slot.dmg) + '/' + c.hp;
  if (slot.dmg > 0) hp.classList.add('hurt');
  top.appendChild(hp);
  d.appendChild(top);

  const body = el('div', 'pc-body');
  body.appendChild(sigilBox(c, where === 'active' ? 'md' : 'sm'));

  const info = el('div', 'pc-info');
  const meta = el('div', 'slotmeta');
  meta.appendChild(typeTag(c.type));
  meta.appendChild(el('span', 'stage', c.stage + (slot.stack.length > 1 ? ' (' + slot.stack.length + ')' : '')));
  info.appendChild(meta);

  const bar = el('div', 'dmgbar');
  const fill = el('i'); fill.style.width = Math.min(100, (slot.dmg / c.hp) * 100) + '%';
  bar.appendChild(fill); info.appendChild(bar);

  const en = energyPips(slot, 'full');
  en.appendChild(el('span', 'retreatnote', 'retreat ' + retreatCost(slot, c)));
  info.appendChild(en);

  // Always appended, even empty. The status row is what made the Active card
  // change height mid-turn — poisoning something grew it by a line. Reserving
  // the row costs 13px of stock and keeps the board still.
  info.appendChild(statusBadges(slot, false));
  body.appendChild(info);
  d.appendChild(body);

  // The opponent's Active lists what it can hit you with — cost, name, damage,
  // and nothing else. The text is deliberately absent: it would double the card's
  // height for something you can read in the rail by hovering. Knowing the
  // numbers is the part you steer by.
  if (pi === 1 && where === 'active' && (c.attacks || []).length) {
    const atks = el('div', 'attacks foeatks');
    c.attacks.forEach(a => {
      const l = el('div', 'pc-atkline');
      l.appendChild(costRow(a.cost));
      l.appendChild(el('span', 'pc-atkname', a.name));
      l.appendChild(el('span', 'pc-atkdmg', a.dmg || '—'));
      atks.appendChild(l);
    });
    d.appendChild(atks);
  }

  if (pi === 0 && where === 'active' && !presenting() && S().phase === 'main' && S().active === 0 && S().pendingPromote === null) {
    const atks = el('div', 'attacks');
    (c.attacks || []).forEach((a, i) => {
      const chk = UI.E.canUseAttack(0, i);
      const canAtk = chk.ok && UI.E.canAttackAtAll(0);
      const b = el('button', 'atk' + (canAtk ? '' : ' off'));
      const l = el('div', 'pc-atkline');
      l.appendChild(costRow(a.cost));
      l.appendChild(el('span', 'pc-atkname', a.name));
      l.appendChild(el('span', 'pc-atkdmg', a.dmg || '—'));
      b.appendChild(l);
      if (a.text) b.appendChild(el('div', 'pc-text', a.text));
      if (!canAtk) {
        const why = !UI.E.canAttackAtAll(0)
          ? (slot.status.asleep ? 'Asleep — cannot attack' : slot.status.paralyzed ? 'Paralyzed — cannot attack' : 'Cannot attack')
          : chk.why;
        b.appendChild(el('div', 'atkwhy', why));
      } else if (UI.targeting || UI.powerMode) {
        // Locked while the board is waiting for a target. Without this, arming
        // Retreat and then misclicking an attack fires the attack and ends the
        // turn — the retreat row sits directly under the attacks, so that is a
        // one-pixel mistake with an unrecoverable outcome.
        b.classList.add('off');
      } else b.onclick = () => doAttack(i);
      atks.appendChild(b);
    });
    d.appendChild(atks);
    const rr = retreatRow(slot, c);
    if (rr) d.appendChild(rr);
  }

  d.onclick = slotOnClick(slot, pi, where, idx, can, c);
  applySigilMarks(d, slotVariantFlags(slot));
  return peekOn(d, c.id);
}

// Retreat, on the Active card under its attacks — where the cost it charges is
// printed, and where the thing it acts on actually is. It was a button in the
// action bar, which is the last place in the game that described the Active
// Pokemon from a distance.
//
// It is the ONE action here that is confirmation-gated (Trevor, 10 Aug). Two
// reasons it earns the extra click where attacking does not: it now sits
// directly beneath the attacks, so the misclick is a one-pixel mistake; and it
// spends Energy you chose to attach, which is the only cost in the game you pay
// without getting an effect for it. Arming also LOCKS the attacks above it, so
// the armed state cannot be escaped by accidentally attacking.
function retreatRow(slot, c) {
  const p = me();
  if (!p.bench.length) return null;
  const armed = UI.retreatArmed;
  const legal = myLegal().some(a => a.t === 'retreat');

  if (!legal) {
    // Say why, in the place the action would have been, rather than in the bar.
    const why = p.retreated ? 'Already retreated this turn'
      : slot.status.asleep ? 'Asleep — cannot retreat'
      : slot.status.paralyzed ? 'Paralyzed — cannot retreat'
      : `Needs ${retreatCost(slot, c)} Energy to retreat`;
    return el('div', 'retreatrow off', why);
  }

  const row = el('div', 'retreatrow' + (armed ? ' armed' : ''));
  if (armed) {
    // Just the label and the way out. The instruction is already on the centre
    // line and in the bar; a third copy on the card would make the card's
    // version read as decoration, which is the same mistake the coin toss made
    // when its result was announced twice. See LAYOUT.md.
    row.appendChild(el('span', 'rr-lbl', 'Retreating'));
    const x = el('span', 'rr-cancel', 'Cancel');
    row.appendChild(x);
    row.onclick = () => { UI.retreatArmed = false; UI.targeting = null; render(); };
    return row;
  }
  row.appendChild(el('span', 'rr-lbl', 'Retreat'));
  const rc = retreatCost(slot, c);
  row.appendChild(el('span', 'rr-cost', rc ? `discard ${rc} Energy` : 'free'));
  row.onclick = () => {
    UI.retreatArmed = true;
    UI.targeting = { scope: 'ownBench', prompt: `Retreating ${c.name} — choose a Benched Pokemon to bring up`,
      dispatch: (opts) => { UI.retreatArmed = false; retreatTo(opts.bench, slot, c, rc); } };
    render();
  };
  return row;
}

// Bench chosen; now WHICH Energy pays for it. Retreat is the one discard measured
// in SYMBOLS rather than cards, so it satisfies on the symbol total — a Double
// Colorless can cover a cost of 2 on its own, and the picker has to know that or
// it would sit there waiting for a second card that is not needed.
//
// Both the realness test and the satisfied test are bespoke here, and that is the
// cost of the 17 Aug reversal being paid in full: the generic card-count versions
// in askEnergy are wrong in both directions once a card can be worth two. The
// engine owns the actual rule — see retreatPayOptions — so this only translates.
function retreatTo(bench, slot, c, rc) {
  const go = pay => dispatch(0, pay ? { t: 'retreat', bench, pay } : { t: 'retreat', bench });
  if (!rc) return go(null);
  const E = UI.E;
  const valOf = uid => {
    const e = slot.energy.find(x => x.uid === uid);
    return e ? E.energyValue(e) : 0;
  };
  // PRUNE IN REVERSE CLICK ORDER, because the last click is the deliberate one.
  // Pick a basic and then a Double Colorless for a cost of 2 and the total is 3
  // with the basic redundant — which the engine refuses, correctly. Rather than
  // making the player work that out, honour the DCE they just clicked and hand
  // the basic back. Walking newest-first is the whole of it.
  const prune = chosen => {
    const out = [];
    let left = rc;
    for (const uid of chosen.slice().reverse()) {
      if (left <= 0) break;
      out.push(uid); left -= valOf(uid);
    }
    return out;
  };
  const armed = askEnergy({
    slot, n: rc, filter: null,
    real: E.retreatChoiceIsReal(slot),
    satisfied: chosen => chosen.reduce((a, uid) => a + valOf(uid), 0) >= rc,
    title: 'DISCARD TO RETREAT',
    hint: `${c.name} — discard Energy worth ${rc} to retreat`,
    onDone: chosen => go(prune(chosen)),
  });
  if (!armed) go(null);
}

// Shared by the Active card and the bench tiles — a benched Pokemon is just as
// clickable a target as the Active one, so the two must not drift apart.
function slotOnClick(slot, pi, where, idx, can, c) {
  return () => {
    if (can && UI.powerMode) {
      const pm = UI.powerMode;
      if (pm.kind === 'BUZZAP') { pm.to = slot.uid; render(); return; }
      const twoStep = powerIsTwoStep(pm);
      if (twoStep && pm.from === null) { pm.from = slot.uid; render(); return; }
      // Stay in the mode after each move — the card says "as often as you like".
      const move = powerMoves(pm).find(a => a.to === slot.uid && (!twoStep || a.from === pm.from));
      if (move) dispatch(0, move);
      if (UI.powerMode) UI.powerMode.from = null;
      render(); return;
    }
    if (can) return resolveTarget(slot, pi, where, idx);
    inspectCard(c.id); render();
  };
}

function statusBadges(slot, terse) {
  const st = el('div', 'statuses');
  const badge = (long, short, cls) => st.appendChild(el('span', 'badge ' + cls, terse ? short : long));
  if (slot.status.asleep) badge('ASLEEP', 'SLP', 'slp');
  if (slot.status.paralyzed) badge('PARALYZED', 'PAR', 'par');
  if (slot.status.confused) badge('CONFUSED', 'CNF', 'cnf');
  if (slot.status.poisoned) badge('POISONED', 'PSN', 'psn');
  slot.effects.forEach(e => {
    if (e.kind === 'PREVENT_ALL_DAMAGE' || e.kind === 'PREVENT_ALL_EFFECTS') badge('SHIELDED', 'SHLD', 'shd');
    if (e.kind === 'PREVENT_UP_TO') badge('HARDENED', 'HARD', 'shd');
    if (e.kind === 'DAMAGE_REDUCTION') badge('-' + e.amount, '-' + e.amount, 'shd');
    if (e.kind === 'DAMAGE_BONUS') badge('+' + e.amount, '+' + e.amount, 'bns');
    if (e.kind === 'DESTINY_BOND') badge('DESTINY BOND', 'BOND', 'bond');
    if (e.kind === 'ATTACK_FLIP') badge('DAZED', 'DAZE', 'cnf');
  });
  return st;
}

function energyPips(slot, cls) {
  const en = el('div', 'energyrow');
  // ONE PIP PER SYMBOL, NOT PER CARD — Trevor, 16 Aug 2026, from play.
  //
  // Double Colorless pays for two and showed one dot, so the row said "three
  // Energy" about a Pokemon that could pay a cost of four. The row is what you
  // read the board off, and it was answering a different question from the one
  // being asked of it. Buzzap is the same shape and gets the same treatment: an
  // Electrode standing in as two Fire now looks like two Fire.
  //
  // The card is STILL one card everywhere it matters — discarding, retreat cost,
  // Energy Removal. Only the picture changed. Pips from one card carry `.multi`
  // so they sit closer together than two separate cards do, which is what keeps
  // the count honest without pretending you can discard half of one.
  slot.energy.forEach(e => {
    // asEnergy is set on the card instance by Buzzap, which turns an Electrode
    // into an Energy card; the card definition still says Pokemon.
    const prov = String(e.asEnergy || CARD_DB[e.id].provides || 'C');
    const syms = prov.split('');
    syms.forEach((sym, i) => {
      const p = el('i', 'pip ink' + (syms.length > 1 ? ' multi' : '') + (i ? ' cont' : ''));
      p.style.background = ENERGY_INK[sym] || ENERGY_INK.C;
      p.title = CARD_DB[e.id].name
        + (syms.length > 1 ? ` — one card, ${syms.length} Energy` : '')
        + (e.asEnergy ? ` (Buzzap: ${e.asEnergy})` : '');
      en.appendChild(p);
    });
  });
  if (!slot.energy.length) en.appendChild(el('span', 'none', cls === 'terse' ? '—' : 'no energy'));
  return en;
}

// A bench tile is NOT a small copy of the Active card. It carries only what you
// steer by from across the table — who it is, how hurt, how charged, what's
// wrong with it — and the size gap is what makes the Active read as the one
// that is actually fighting.
function renderBenchTile(slot, pi, idx) {
  const c = topCard(CARD_DB, slot);
  const d = el('div', 'benchcard');
  d.style.borderLeftColor = ENERGY_INK[c.type] || ENERGY_INK.C;
  const can = slotTargetable(slot, pi, 'bench', idx);
  if (can) d.classList.add('targetable');
  if (UI.inspect === c.id) d.classList.add('inspected');
  if (UI.fxActive('hit' + slot.uid)) d.classList.add('fx-hit');
  d.title = `${c.name} — ${c.stage}, ${Math.max(0, c.hp - slot.dmg)}/${c.hp} HP, retreat ${c.retreat}`;

  d.appendChild(el('div', 'bn', c.name));

  const hp = el('div', 'bhp');
  const left = el('b', null, String(Math.max(0, c.hp - slot.dmg)));
  if (slot.dmg > 0) left.classList.add('hurt');
  hp.appendChild(left);
  hp.appendChild(el('span', null, '/' + c.hp));
  if (slot.stack.length > 1) hp.appendChild(el('span', 'bstack', '×' + slot.stack.length));
  d.appendChild(hp);

  // The emblem, sized by the room the fixed tile height leaves. It is the only
  // thing added when the bench grew: the tile still carries no attacks and no
  // text, so it is not a small copy of the Active card — the size gap is what
  // makes the Active read as the one that is actually fighting.
  d.appendChild(sigilBox(c, 'bcart'));

  const bar = el('div', 'dmgbar');
  const fill = el('i'); fill.style.width = Math.min(100, (slot.dmg / c.hp) * 100) + '%';
  bar.appendChild(fill); d.appendChild(bar);

  d.appendChild(energyPips(slot, 'terse'));

  const st = statusBadges(slot, true);
  if (st.children.length) d.appendChild(st);

  d.onclick = slotOnClick(slot, pi, 'bench', idx, can, c);
  applySigilMarks(d, slotVariantFlags(slot));
  return peekOn(d, c.id);
}

function renderHand() {
  const h = el('div', 'handpanel');
  const head = el('div', 'panelhead');
  head.appendChild(el('span', null, 'YOUR HAND'));
  head.appendChild(el('span', 'dimtxt', me().hand.length + ' cards'));
  h.appendChild(head);

  const row = el('div', 'hand');
  const legal = myLegal();
  me().hand.forEach((inst, i) => {
    const c = CARD_DB[inst.id];
    const acts = legal.filter(a => a.hand === i);
    const card = handCard(c, inst.v ? vflags(inst.v) : null);
    if (UI.sel && UI.sel.idx === i) card.classList.add('sel');
    if (!acts.length) card.classList.add('dead');
    if (UI.inspect === c.id) card.classList.add('inspected');
    if (UI.targeting && UI.targeting.scope === 'handDiscard') card.classList.add('targetable');
    card.onclick = () => {
      if (presenting()) return;
      if (UI.targeting && UI.targeting.scope === 'handDiscard') { UI.targeting.dispatch({ discardUid: me().hand[i].uid }); return; }
      inspectCard(c.id);
      // A card with nothing legal about it still gets inspected, and still
      // reports itself in the bar — "why can't I play this" is information.
      if (!acts.length) { UI.sel = { idx: i }; render(); return; }
      clickHandCard(i);
    };
    row.appendChild(peekOn(card, c.id));
  });
  if (!me().hand.length) row.appendChild(el('div', 'empty', 'hand empty'));
  UI.handEl = row; UI.handPanelEl = h;
  h.appendChild(row);
  return h;
}

// Everything a card in hand can legally do, as {label, run} pairs.
//
// ONE definition, two consumers, and that is the point. Clicking a hand card
// runs the verb directly when there is only one; the action bar renders them as
// buttons when there is more than one, or when something set UI.sel by hand.
// They used to be the same code written once, inline, in the bar — which is why
// the bar was the only way to play anything.
//
// The finding that drove this: almost every card has exactly ONE verb. Energy
// can only be attached, a Stage 1 can only evolve, a Trainer can only be
// played, a Basic can only be benched. So the bar's "menu" was nearly always a
// menu of one, and the click that chose from it was a click with no choice in
// it. Genuine multi-verb cards still get the menu, because then it IS a choice.
function handVerbs(i) {
  const inst = me().hand[i];
  if (!inst) return [];
  const c = CARD_DB[inst.id];
  const acts = myLegal().filter(a => a.hand === i);
  const out = [];

  const bench = acts.find(a => a.t === 'playBasic');
  if (bench) out.push({ label: 'Put on Bench', run: () => {
    if (onPlayFlow(c.id, (opts) => dispatch(0, Object.assign({}, bench, { opts })))) return;
    dispatch(0, bench);
  } });

  const evos = acts.filter(a => a.t === 'evolve');
  if (evos.length) out.push({ label: 'Evolve…', run: () => {
    UI.targeting = { scope: 'evolveOn', uids: evos.map(a => a.target), prompt: `Choose the Pokemon to evolve into ${c.name}`,
      // Two questions in a row when the card has a Power: which Pokemon to
      // evolve, THEN what the Power does. The order is the card's — it is not
      // in play until the first is answered.
      dispatch: (uid) => {
        const act = evos.find(a => a.target === uid);
        if (onPlayFlow(c.id, (opts) => dispatch(0, Object.assign({}, act, { opts })))) return;
        dispatch(0, act);
      } };
    render();
  } });

  const atts = acts.filter(a => a.t === 'attachEnergy');
  if (atts.length) out.push({ label: 'Attach to…', run: () => {
    UI.targeting = { scope: 'attachTo', uids: atts.map(a => a.target), prompt: `Choose a Pokemon to attach ${c.name} to`,
      dispatch: (uid) => dispatch(0, atts.find(a => a.target === uid)) };
    render();
  } });

  const tr = acts.find(a => a.t === 'playTrainer');
  if (tr) {
    const need = TRAINER_FLOW[c.id];
    const needsChoice = !!need || PICKER_TRAINERS.indexOf(c.id) >= 0;
    out.push({ label: needsChoice ? 'Play…' : 'Play', run: () => {
      if (pickerFlow(i, inst, c)) return;
      if (!need) { dispatch(0, tr); return; }
      if (need.then) {
        UI.targeting = { scope: need.scope, prompt: need.prompt, dispatch: (first) => {
          UI.targeting = { scope: need.then.scope, prompt: need.then.prompt,
            dispatch: (second) => playTrainerEnergy(i, c,
              { selfUid: first.targetUid, targetUid: second.targetUid }) };
          render();
        } };
        render(); return;
      }
      if (c.id === 'base1-72') {
        UI.targeting = { scope: need.scope, prompt: need.prompt, dispatch: (opts) => {
          const sl = UI.E.allSlots(0).find(x => x.uid === opts.targetUid);
          if (sl && sl.stack.length > 2) {
            openPicker({ title: 'Devolution Spray', prompt: 'Choose the card to devolve back to',
              items: sl.stack.slice(0, sl.stack.length - 1), min: 1, max: 1,
              onDone: (p) => {
                const keep = sl.stack.findIndex(x => x.uid === p[0]) + 1;
                dispatch(0, { t: 'playTrainer', hand: i, opts: { targetUid: opts.targetUid, keep } });
              } });
          } else dispatch(0, { t: 'playTrainer', hand: i, opts: { targetUid: opts.targetUid, keep: 1 } });
        } };
        render(); return;
      }
      UI.targeting = { scope: need.scope, prompt: need.prompt,
        dispatch: (opts) => playTrainerEnergy(i, c, opts) };
      render();
    } });
  }
  return out;
}

// Clicking a card in hand. One verb runs; several offer themselves in the bar;
// none selects it anyway, so the bar can say the card's name rather than the
// click doing nothing at all.
function clickHandCard(i) {
  if (UI.targeting || UI.powerMode || presenting()) return;
  const s = S();
  if (s.phase !== 'main' || s.active !== 0) return;
  const vs = handVerbs(i);
  if (vs.length === 1) { UI.sel = null; vs[0].run(); return; }
  UI.sel = (UI.sel && UI.sel.idx === i) ? null : { idx: i };
  render();
}

function renderActionBar() {
  const bar = el('div', 'actionbar');
  const s = S();

  if (presenting()) {
    // The coin itself is on the centre line now. The bar only says why the game
    // has stopped, quietly — announcing the result in two places at once made
    // the mat's version feel like a decoration rather than the event.
    const b = UI.pres.banner;
    bar.appendChild(el('div', 'barmsg dimtxt',
      b && b.reason ? 'Coin flip — ' + b.reason : 'Coin flip'));
    return bar;
  }

  if (UI.powerMode) {
    const pm = UI.powerMode;
    const moves = myLegal().filter(a => a.t === 'power' && a.uid === pm.uid && a.kind === pm.kind);
    // Auto-exit the moment nothing legal is left, so the mode never strands you.
    if (!moves.length) { UI.powerMode = null; return renderActionBar(); }
    // Buzzap: board click chooses the target, then the bar offers the types.
    if (pm.kind === 'BUZZAP') {
      bar.appendChild(el('div', 'barmsg',
        `${pm.name}: ${POWER_PROMPT.BUZZAP[pm.to === null ? 0 : 1]}`));
      if (pm.to !== null) {
        const seen = new Set();
        moves.filter(a => a.to === pm.to).forEach(a => {
          if (seen.has(a.type)) return; seen.add(a.type);
          const b = el('button', 'btn etype', ENERGY_NAME[a.type] || a.type);
          b.style.borderColor = ENERGY_COLOR[a.type];
          b.onclick = () => { dispatch(0, a); UI.powerMode = null; render(); };
          bar.appendChild(b);
        });
        const back = el('button', 'btn ghost', 'Back');
        back.onclick = () => { pm.to = null; render(); };
        bar.appendChild(back);
      }
      const cancel = el('button', 'btn ghost', 'Cancel');
      cancel.onclick = () => { UI.powerMode = null; render(); };
      bar.appendChild(cancel);
      return bar;
    }

    // Peek chooses WHAT to look at rather than picking things off the board, so
    // its options are listed in the bar. The Prizes fold into one button a side
    // rather than one per Prize, because which of six face-down cards you turn
    // over is not a decision anybody can make informedly.
    if (pm.kind === 'PEEK') {
      bar.appendChild(el('div', 'barmsg', pm.name + ': choose what to look at'));
      const seen = new Set();
      moves.forEach(a => {
        const key = a.look + a.side;
        if (seen.has(key)) return;
        seen.add(key);
        const label = a.look === 'deck' ? (a.side === 'me' ? 'Top of your deck' : 'Top of their deck')
          : a.look === 'hand' ? 'A card from their hand'
          : (a.side === 'me' ? 'One of your Prizes' : 'One of their Prizes');
        const pb = el('button', 'btn', label);
        pb.onclick = () => { dispatch(0, a); UI.powerMode = null; render(); };
        bar.appendChild(pb);
      });
      const cancel = el('button', 'btn ghost', 'Cancel');
      cancel.onclick = () => { UI.powerMode = null; render(); };
      bar.appendChild(cancel);
      return bar;
    }

    const twoStep = powerIsTwoStep(pm);
    bar.appendChild(el('div', 'barmsg',
      `${pm.name}: ${POWER_PROMPT[pm.kind][(twoStep && pm.from === null) ? 0 : 1]}`));
    if (twoStep && pm.from !== null) {
      const back = el('button', 'btn ghost', 'Back');
      back.onclick = () => { pm.from = null; render(); };
      bar.appendChild(back);
    }
    const done = el('button', 'btn end', 'Done');
    done.onclick = () => { UI.powerMode = null; render(); };
    bar.appendChild(done);
    return bar;
  }

  // An Energy pick outranks everything below it: it is the thing the game is
  // waiting on, and the choice that led to it is already made. The bar is a
  // status line, so it has to say what is happening NOW — it read "choose a
  // Benched Pokemon to bring up" while the bench was long since chosen and the
  // board was asking which Energy to spend.
  if (UI.energyPick) {
    bar.appendChild(el('div', 'barmsg', UI.energyPick.hint));
    return bar;
  }

  // `forced` targeting falls through to the promote/send-up branch below, which
  // re-arms it and prints the prompt WITHOUT a Cancel. Cancelling a forced
  // promote would strand the game with no Active and no way to choose one.
  if (UI.targeting && !UI.targeting.forced && !UI.targeting.noCancel) {
    bar.appendChild(el('div', 'barmsg', UI.targeting.prompt));
    // A DECLINE IS NOT A CANCEL. Cancel abandons the whole action; decline means
    // "do the action, just not the optional part of it" — Dark Alakazam attacking
    // without switching itself out. Both are offered when the targeting supplies
    // one, because a player who opened the attack by mistake still needs the way
    // back out that every other targeting has.
    if (UI.targeting.decline) {
      const skip = el('button', 'btn small', UI.targeting.declineLabel || 'No thanks');
      const go = UI.targeting.decline;
      skip.onclick = () => { UI.targeting = null; UI.sel = null; go(); };
      bar.appendChild(skip);
    }
    const cancel = el('button', 'btn ghost', 'Cancel');
    cancel.onclick = () => { UI.targeting = null; UI.sel = null; render(); };
    bar.appendChild(cancel);
    return bar;
  }

  // A targeting that offers a DECLINE but no Cancel — an optional switch. It
  // needs its own branch because the one above is the only place a non-forced
  // targeting renders, and `noCancel` deliberately skips it.
  if (UI.targeting && UI.targeting.noCancel && UI.targeting.decline) {
    bar.appendChild(el('div', 'barmsg', UI.targeting.prompt));
    const skip = el('button', 'btn small', UI.targeting.declineLabel || 'No thanks');
    const go = UI.targeting.decline;
    skip.onclick = () => { UI.targeting = null; UI.sel = null; go(); };
    bar.appendChild(skip);
    return bar;
  }

  // Promote and Whirlwind's send-up are BENCH CLICKS, not a row of buttons
  // naming Pokemon that are already on screen. `slotTargetable` has had a
  // 'promote' scope the whole time; the bar was printing "Promote Growlithe" as
  // text while Growlithe sat two inches above it, highlightable.
  //
  // Neither is cancellable — the game cannot continue until you choose — so the
  // targeting is armed here on every render rather than by a click, and the bar
  // carries the prompt with no Cancel beside it.
  if (s.pendingSwitch === 0 || s.pendingPromote === 0) {
    bar.appendChild(el('div', 'barmsg', UI.targeting ? UI.targeting.prompt : ''));
    return bar;
  }

  if (s.phase !== 'main' || s.active !== 0) { bar.appendChild(el('div', 'barmsg dimtxt', 'Waiting…')); return bar; }

  if (UI.sel) {
    const i = UI.sel.idx;
    const inst = me().hand[i];
    if (!inst) { UI.sel = null; return bar; }
    bar.appendChild(el('div', 'barmsg', CARD_DB[inst.id].name));
    handVerbs(i).forEach(v => {
      const b = el('button', 'btn', v.label);
      b.onclick = v.run;
      bar.appendChild(b);
    });
    const x = el('button', 'btn ghost', 'Deselect');
    x.onclick = () => { UI.sel = null; render(); };
    bar.appendChild(x);
    return bar;
  }

  // Pokemon Powers. Interactive ones open a mode you stay in until you press
  // Done; the "as often as you like" wording means you can leave, do something
  // else, and come back, so entering is always available before your attack.
  const powers = myLegal().filter(a => a.t === 'power');
  const byPower = new Map();
  powers.forEach(a => { if (!byPower.has(a.uid + a.kind)) byPower.set(a.uid + a.kind, a); });
  byPower.forEach((a) => {
    const slot = UI.E.findSlot(0, a.uid);
    const def = UI.E.powerOf(slot);
    const b = el('button', 'btn power', `${def.name}`);
    b.title = def.name + ' — ' + topCard(CARD_DB, slot).name;
    b.onclick = () => {
      // Anything with a prompt is an interactive mode; the rest fire on the spot.
      if (a.kind === 'PEEK' || POWER_PROMPT[a.kind]) { UI.powerMode = { uid: a.uid, kind: a.kind, name: def.name, from: null, to: null }; render(); }
      else dispatch(0, a);
    };
    bar.appendChild(b);
  });

  // Clairvoyance is passive, so the engine offers no action for it. The button
  // exists for as long as the Power is switched on and opens the same panel
  // Peek uses: their hand is yours to look at whenever you like, on your turn.
  if (clairvoyanceOn()) {
    const cl = el('button', 'btn power', 'Clairvoyance');
    cl.onclick = () => {
      const hand = UI.E.state.players[1].hand.map(x => ({ id: x.id, uid: x.uid }));
      openReveal('Clairvoyance', 'your opponent plays with their hand face up', hand);
      render();
    };
    bar.appendChild(cl);
  }

  // Retreat is not here any more — it is a row on the Active card, under the
  // attacks, next to the retreat cost it charges. See retreatRow().

  const end = el('button', 'btn end', 'End turn');
  end.onclick = () => dispatch(0, { t: 'pass' });
  bar.appendChild(end);
  return bar;
}

function resolveTarget(slot, pi, where, idx) {
  const t = UI.targeting; if (!t) return;
  if (t.scope === 'attachTo' || t.scope === 'evolveOn' || t.scope === 'breederTarget') return t.dispatch(slot.uid);
  if (t.scope === 'ownBench' || t.scope === 'oppBench' || t.scope === 'promote') return t.dispatch({ bench: idx });
  // `energyIdx: 0` used to be sent here — "the first one attached", the very
  // thing the picker replaced. Which Energy is now asked downstream, once the
  // Pokemon is known, in playTrainerEnergy().
  return t.dispatch({ targetUid: slot.uid });
}

function doAttack(i) {
  const c = topCard(CARD_DB, me().active);
  const script = (EFFECTS[c.id] && EFFECTS[c.id].a && EFFECTS[c.id].a[i]) || [];
  const needsBench = script.some(v => v.v === 'SWITCH_DEFENDER_CHOOSE') && foe().bench.length > 0;
  if (needsBench) {
    UI.targeting = { scope: 'oppBench', prompt: 'Choose which Benched Pokemon to drag into the Active spot',
      dispatch: (opts) => attackWithEnergy(i, c, script, opts) };
    render(); return;
  }

  // AN OPTIONAL SWITCH NEEDS A THIRD BUTTON, and that is the whole reason this
  // branch exists rather than reusing the one above. Cancel abandons the ATTACK;
  // declining an optional switch still attacks. Two different answers that a
  // single Cancel cannot express, and conflating them would either lose the
  // attack or force the switch.
  const optSwitch = script.find(v => v.v === 'SWITCH_SELF_CHOOSE' && v.optional);
  if (optSwitch && me().bench.length > 0) {
    UI.targeting = {
      scope: 'ownBench',
      prompt: `${c.name} may switch itself out — choose a Benched Pokemon, or attack without switching`,
      declineLabel: 'Attack without switching',
      // NO CANCEL BESIDE IT. Trevor's call, 17 Aug, and the reasoning is better
      // than the version I shipped first: two adjacent buttons that both read as
      // "no" are worse than one. The decline already IS the way out of the
      // optional part, and clicking an attack commits everywhere else in the
      // game — so a Cancel here would make this one attack uniquely reversible
      // AND put two similar-looking outs side by side. The choice is binary:
      // pick a Pokemon, or attack without switching.
      noCancel: true,
      decline: () => attackWithEnergy(i, c, script, { bench: -1 }),
      dispatch: (opts) => attackWithEnergy(i, c, script, opts),
    };
    render(); return;
  }
  attackWithEnergy(i, c, script, null);
}

// An attack can ask two separate Energy questions and they are asked in the order
// the engine resolves them: first what YOU discard to pay (Flamethrower's Fire,
// Wildfire's however-many), then what you strip off the DEFENDER. Both are asked
// BEFORE the attack is dispatched, because the engine resolves an attack
// synchronously — there is no point mid-resolution at which the UI could stop and
// ask, which is the same constraint that produced the coin-flip replay.
function attackWithEnergy(i, c, script, opts) {
  const o = opts || {};
  const go = () => dispatch(0, { t: 'attack', idx: i, opts: o });

  const cost = script.find(v => v.v === 'COST_DISCARD_ENERGY');
  const strip = script.find(v => v.v === 'DISCARD_DEF_ENERGY');

  const askDefender = () => {
    if (!strip || !foe().active) return go();
    if (askEnergy({
      slot: foe().active, n: 1,
      title: 'STRIP ENERGY',
      hint: `${nameOfSlot(foe().active)} — choose the Energy to discard`,
      onDone: (uids) => { o.energyUids = uids; go(); },
    })) return;
    go();
  };

  // Wildfire is not here on purpose: it discards as many Fire as you choose and
  // defaults to ALL of them, so there is no slack and `energyChoiceIsReal` would
  // decline to ask anyway. It routes through `takeEnergy` in the engine, so the
  // day a count prompt is built, the which-prompt is a `costUids` away.
  const n = cost ? cost.n : 0;
  const t = cost ? (cost.t || null) : null;
  if (cost && askEnergy({
    slot: me().active, n, filter: t,
    title: 'DISCARD TO ATTACK',
    hint: `${c.name} — choose ${n} ${t ? (ENERGY_NAME[t] || t) + ' ' : ''}Energy to discard`,
    onDone: (uids) => { o.costUids = uids; askDefender(); },
  })) return;
  askDefender();
  void wild;   // Wildfire's own count prompt already runs upstream of this
}

// ------------------------------------------------------- deck select ------
// Both summary and hero go through `deckFor` so a deck you BUILT renders on the
// select screen exactly like a theme deck does — and so the OPPONENT's panel
// describes the opponent's actual deck. They take the same `side` as everything
// else; see the note on `deckFor`.
function deckSummary(name, side) {
  const d = name === SANDBOX
    ? generateDeck(CARD_DB, Object.keys(CARD_DB), mulberry32(1), { name: SANDBOX })
    : deckFor(name, side);
  if (!d) return { k: { pokemon: 0, trainer: 0, energy: 0 }, types: {}, basics: 0, stage2: 0 };
  const k = { pokemon: 0, trainer: 0, energy: 0 };
  const types = {};
  let basics = 0, stage2 = 0;
  for (const [q, id] of d.list) {
    const c = CARD_DB[id];
    k[c.kind] += q;
    if (c.kind === 'pokemon') {
      types[c.type] = (types[c.type] || 0) + q;
      if (c.stage === 'Basic') basics += q;
      if (c.stage === 'Stage 2') stage2 += q;
    }
  }
  return { k, types, basics, stage2 };
}

// The deck a deck is "about" — its heaviest evolution, tie-broken on HP. Used to
// give each theme deck a face on the select screen, since we have the real
// printed cards sitting right there. Sandbox has no fixed list, so it gets a
// card back instead, which is honest: you don't know what you're getting.
// The biggest thing in a list, by stage then HP. Split from deckHero so a
// ladder challenger — whose deck is a definition rather than a name — can have
// a face by the same rule the deck tiles use. See renderLadder().
function heroOfList(list) {
  const rank = { 'Basic': 0, 'Stage 1': 1, 'Stage 2': 2 };
  let best = null, bestScore = -1;
  for (const [, id] of list) {
    const c = CARD_DB[id];
    if (!c || c.kind !== 'pokemon') continue;
    const score = (rank[c.stage] || 0) * 1000 + (c.hp || 0);
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return best;
}

function deckHero(name, side) {
  const d = deckFor(name, side);
  return d ? heroOfList(d.list) : null;
}

// ======================================================================
// JOB 5 — VARIANTS, PACKS, AND THE COLLECTION ON SCREEN
// ======================================================================

// Which treatments can be drawn ON TOP of a bitmap. The rest (1st Edition,
// Shadowless) are a stamp already present and a shadow already absent in every
// scan we own, so over a scan they are a ribbon and nothing more.
const ADDITIVE_FX = { sh: 1, rh: 1, mp1: 1, mp2: 1, mp3: 1 };
const additiveClasses = flags => flags.filter(f => ADDITIVE_FX[f]).map(f => 'v-' + f).join(' ');

// Filter-based treatments, composed into ONE string.
//
// This is not a style preference. `filter` is a single CSS property, so two
// classes that each set it do not stack — the later rule in the stylesheet
// wins outright and the other treatment silently disappears. That was survivable
// while Shiny was a sheen and only Misprint used filters. The moment Shiny
// became a hue rotation, a Shiny Misprint would have lost one of the two at
// random depending on stylesheet order. Composing here makes them add up.
//
// Shiny first, so a Misprint's channel split is applied to the shifted colours
// rather than the other way round — the split should look like it happened to
// the card you actually pulled.
const FX_FILTER = {
  sh: 'hue-rotate(150deg) saturate(1.35)',
  mp1: 'drop-shadow(2px 0 0 rgba(255,0,90,.8)) drop-shadow(-2px 0 0 rgba(0,225,255,.8))',
  mp3: 'invert(1)',
};
const FX_ORDER = ['sh', 'mp1', 'mp3'];
const variantFilter = flags =>
  FX_ORDER.filter(f => flags.indexOf(f) >= 0).map(f => FX_FILTER[f]).join(' ');

// The real printed card, with additive cosmetics laid over it.
function pullFace(card, flags) {
  const cls = additiveClasses(flags);
  const host = el('div', 'vfx' + (cls ? ' ' + cls : ''));
  const fx = variantFilter(flags);
  if (fx) host.style.filter = fx;
  const img = cardFaceImage(card, null);
  if (!img) { host.appendChild(sigilBox(card, 'lg')); return host; }
  // A set whose art has not been fetched falls back to the sigil rather than a
  // blank tile — same contract as the preview rail.
  const fb = sigilBox(card, 'lg');
  fb.style.display = 'none';
  img.onerror = () => { img.classList.add('miss'); fb.style.display = ''; };
  host.appendChild(img);
  host.appendChild(fb);
  return host;
}

// The art window inside a rendered card, or null.
//
// Hand-rolled loop, not `.filter` and not `querySelector`. A real browser gives
// an HTMLCollection here, which has no array methods; the smoke DOM stub gives
// a plain array, which has all of them. `.filter` therefore PASSED every test
// and threw in Chrome — the detail overlay silently vanished while the pack
// screen behind it rendered fine. Index with a plain loop and both are happy.
// The art window inside a rendered card, at any depth.
//
// **It searched direct children only until 16 Aug 2026**, which was true of the
// collectible Sigil Card and false of every in-play face: `renderSlot` hangs the
// sigil off `.pc-body`, so it is a grandchild and this returned null. Callers
// then fell back to appending the mark to the card ROOT, where `inset:0`
// resolved against the page and painted a SHADOWLESS watermark across the whole
// board. Two hundred and four tests passed; a screenshot found it in one look.
//
// Index loop and recursion rather than `querySelector` — the smoke stub
// implements neither that nor `.filter` on an HTMLCollection. See TOOLING.md.
function sigilOf(node) {
  if (!node || !node.children) return null;
  for (let i = 0; i < node.children.length; i++) {
    const c = node.children[i];
    if (c && (c.className || '').indexOf('sigil') === 0) return c;
  }
  for (let i = 0; i < node.children.length; i++) {
    const found = sigilOf(node.children[i]);
    if (found) return found;
  }
  return null;
}

// Our own drawing of the card, carrying everything a scan cannot.
// ---------------------------------------------------------- sigil markings ---
// ONE ROW PER VARIANT THAT MARKS A SIGIL CARD. Every renderer that draws our own
// card face consults this table, so **giving a variant an in-play marking is a
// row here and nothing else** — no renderer changes, and it appears on the
// collectible surfaces and on the board in the same commit.
//
// That seam exists because two variants are deliberately missing from it:
// Reverse Holo and Misprint have treatments for the real printed *scan* and none
// for the Sigil Card, and Trevor has a plan for both. When those land they slot
// in here. See GRABBAG.md.
//
//   cls   a class on the card, for anything CSS can express (ink colour, a
//         typesetting defect)
//   art   a node appended INTO the art window — not floated onto the card body,
//         which is where the 1st Edition stamp landed first and read as a stray
//         badge
const SIGIL_MARKS = {
  // Every line of ink turns teal, via --ink/--ink2. A shiny Pokemon in the
  // mainline games is a recoloured one, so the treatment means what the word does.
  sh:  { cls: 'is-sh' },
  // The game's own name across the art window, set the way the title screen sets
  // it. The missing shadow alone was too quiet to carry a 1-in-200 pull; this is
  // the announcement and the shadow is the fidelity.
  sl:  { cls: 'is-sl', art: () => el('div', 'slmark', 'SHADOWLESS') },
  // Where the real stamp sits.
  fe:  { art: () => el('div', 'festamp', '1') },
  // Misprint expresses itself as a TYPESETTING failure here, where the scan gets
  // an image defect. Mutually exclusive by family, so at most one ever applies.
  mp1: { cls: 'is-mp1' },
  mp2: { cls: 'is-mp2' },
  mp3: { cls: 'is-mp3' },
  // rh: Reverse Holo — no sigil treatment yet, by design. Add a row.
};

// Stamp a rendered card with whatever its variant flags call for. Safe on any
// node carrying an art window, and a no-op for a plain card — which is what lets
// the in-play renderers call it unconditionally.
function applySigilMarks(node, flags) {
  if (!node || !flags || !flags.length) return node;
  // One hook every marked card carries, whatever surface it is on. CSS for a
  // variant's IN-PLAY look hangs off `.hasv:not(.sigilcard)`, so it reaches the
  // board, the bench and the hand with a single selector and cannot double up
  // with the collectible card's own rule. Adding a variant later is a row in
  // SIGIL_MARKS plus at most one CSS rule — not a change to any renderer.
  node.classList.add('hasv');
  let art;
  for (const f of flags) {
    const m = SIGIL_MARKS[f];
    if (!m) continue;
    if (m.cls) node.classList.add(m.cls);
    if (m.art) {
      if (art === undefined) art = sigilOf(node);
      (art || node).appendChild(m.art());
    }
  }
  return node;
}

function sigilCard(card, flags) {
  const d = fullCard(card, { noFace: true });
  d.classList.add('sigilcard', 'sm-' + UI.shadowMode);
  applySigilMarks(d, flags);
  const cls = additiveClasses(flags);
  if (!cls) return d;
  const w = el('div', 'vfx ' + cls);
  w.appendChild(d);
  return w;
}

function vribbon(flags) {
  const r = el('div', 'vribbon');
  flags.forEach(f => {
    const v = VARIANT_BY_KEY[f];
    if (v) r.appendChild(el('span', 'vchip c-' + v.family, v.label));
  });
  return r;
}

// ------------------------------------------------------------ opening it ---
// The cards are granted the MOMENT the pack is opened, not as they are flipped.
// Closing the tab halfway through a reveal must not cost you the pack.
function openNextPack(setCode) {
  // Told which set, or the first one the player is actually holding, or home.
  const set = setCode || (UI.save ? packSets(UI.save)[0] : null) || homeSet();
  if (!UI.save || !takePack(UI.save, set)) return false;
  const seed = (Math.random() * 2147483647) | 0;
  const pk = openPack(CARD_DB, set, mulberry32(seed));
  // The Rare comes out of packs.js first; it is shown LAST, because a reveal
  // that opens on the best card has nowhere to go.
  const order = pk.cards.slice(1).concat([pk.cards[0]]);
  UI.pack = {
    set: pk.set, firstEd: pk.firstEd, seed, order,
    revealed: order.map(() => false),
    // Computed BEFORE granting, or every card is already owned by the time we ask.
    isNew: order.map(c => !isOwned(UI.save, c.id)),
  };
  // Recorded before granting so the log can say what was NEW, which is the
  // interesting half of a pull.
  if (UI.elog) {
    const face = (c, isNew) => {
      const card = CARD_DB[c.id];
      const flags = (c.flags && c.flags.length) ? `  [${c.flags.join('+')}]` : '';
      return `${card ? card.name : c.id}  ${card ? card.rarity || '' : ''}${flags}${isNew ? '   NEW' : ''}`;
    };
    const setName = (SET_INFO[pk.set] && SET_INFO[pk.set].name) || pk.set;
    logPack(UI.elog, setName + (pk.firstEd ? '  (1st Edition pack)' : ''),
      order.map((c, i) => face(c, UI.pack.isNew[i])));
  }
  for (const c of order) grant(UI.save, c.id, c.flags);
  UI.save.stats.packsOpened++;
  UI.save.stats.cardsPulled += order.length;
  persist();
  UI.detail = null;
  UI.screen = 'packs';
  return true;
}

// Recorded once per game, not once per render — renderOver() runs every time
// the board redraws, and awarding packs from there would pay out forever.
// Reset by newGame().
function settleResult() {
  if (UI.awarded || !UI.save || !UI.E) return;
  const s = UI.E.state;                       // never S(): a frozen flip view lags
  if (s.phase !== 'over' || s.winner === null) return;   // winner can be 0
  UI.awarded = true;
  drainEngineLog();
  logResult(UI.elog, s.winner === 'draw' ? 'Draw' : (s.winner === 0 ? 'You' : 'Opponent'),
    s.winReason || '', s.turn);

  // Job 7. Packs come from BEATING SOMEBODY, and which set they are packs of is
  // the bracket's, not homeSet()'s — that constant was the only reason Jungle
  // and Fossil packs were unreachable, since every win paid out in base1.
  //
  // Free play deliberately pays nothing. It exists for mirror matches and seed
  // chasing, and a mode that both ignores the ladder and funds the collection
  // would make the ladder optional. The DEV tab's +5 hatch is still there for
  // testing a pull.
  const foe = currentFoe();
  UI.reward = null;
  if (s.winner === 0) {
    UI.save.stats.wins++;
    if (foe) {
      const r = recordWin(UI.save, LADDER_VIEW, foe.id);
      if (r) { addPacks(UI.save, r.set, r.packs); UI.reward = r; }
    }
  } else if (s.winner === 'draw') {
    // A DRAW PAYS NOTHING AND UNLOCKS NOTHING — Trevor's call, 18 Aug: identical
    // to a loss, marked differently. It counts its own stat rather than being
    // folded into losses, because a run that draws is telling you something a
    // run that loses is not, and the two should be distinguishable later even
    // though nothing reads them yet.
    UI.save.stats.draws++;
    if (foe) recordLoss(UI.save, foe.id);
  } else {
    UI.save.stats.losses++;
    if (foe) recordLoss(UI.save, foe.id);
  }
  persist();
}

// The match log, as a file. Offered on the game-over screen and again after a
// pack is opened — Trevor's idea, and it is the right moment: the pulls are the
// payoff, and a log that arrives with them gets read.
function downloadMatchLog() {
  if (!UI.elog) return;
  drainEngineLog();
  const text = renderEventLog(UI.elog);
  const stamp = (UI.elog.meta.started || '').replace(/[: ]/g, '-') || 'match';
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadowless-log-${stamp}.txt`;
    if (typeof a.click === 'function') a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (e) {
    // Same fallback as the save export: show it rather than lose it.
    UI.importText = text; UI.importErr = 'Copy this out — the download was refused.';
    UI.importing = true; render();
  }
}

// ------------------------------------------------------------- the screens -
function renderNewSave() {
  // `.starter` scopes this screen's larger hero cards. Deck select stacks two
  // card rows, a stat bar, an options row and a button into the same viewport
  // and cannot afford them; this screen is one row on an otherwise empty page.
  const ov = el('div', 'deckscreen starter');
  const box = el('div', 'deckbox');
  const title = el('div', 'titleblock');
  title.appendChild(el('h1', 'gametitle', 'SHADOWLESS'));
  title.appendChild(el('div', 'gamesub', 'Choose the deck you start with. Everything else, you win.'));
  title.appendChild(el('div', 'gamenote',
    'These are the four authentic Wizards-era theme decks. You will own every card in the one you pick — '
    + 'and nothing else, until you open your first pack.'));
  box.appendChild(title);
  if (UI.saveNote) box.appendChild(el('div', 'collwarn', UI.saveNote));

  const grid = el('div', 'deckgrid');
  // The starter pick is always the PRINTED deck — you have no save yet, and this
  // screen is the one place that is guaranteed true rather than merely usually.
  Object.keys(DECKS).forEach(n => {
    const s = deckSummary(n, 'theme');
    const c = el('div', 'deckcard');
    const art = el('div', 'dart');
    const hero = deckHero(n, 'theme');
    if (hero) { const img = cardFaceImage(CARD_DB[hero], null); if (img) art.appendChild(img); }
    c.appendChild(art);
    c.appendChild(el('div', 'dname', n));
    const pips = el('div', 'dtypes');
    Object.keys(s.types).sort((a, b) => s.types[b] - s.types[a]).forEach(t => {
      const p = el('i', 'pip'); p.style.background = ENERGY_COLOR[t]; p.title = ENERGY_NAME[t];
      pips.appendChild(p);
    });
    c.appendChild(pips);
    // Spelled out here, unlike deck select's bare "22 / 10 / 28". This is the
    // one screen whose entire job is choosing between four decks you know
    // nothing about, so an unlabelled triple of numbers is the wrong thing to
    // hand someone — there is nothing on the page telling them what it counts.
    // No "·" separators between the three: the row wraps at narrow widths, and
    // a separator that is its own flex item gets stranded at the end of the
    // first line. The gap carries the separation and cannot be orphaned.
    const split = el('div', 'dsplit');
    [[s.k.pokemon, 'Pokémon'], [s.k.trainer, 'Trainer'], [s.k.energy, 'Energy']]
      .forEach(([v, label]) => {
        // el() throughout rather than a text node: the smoke stub implements
        // createElement and appendChild but not createTextNode, so a bare text
        // node passes in Chrome and throws in the suite.
        const w = el('span', 'dsplititem');
        w.appendChild(el('b', null, String(v)));
        w.appendChild(el('span', 'dsplitlbl', ' ' + label));
        split.appendChild(w);
      });
    c.appendChild(split);
    c.appendChild(el('div', 'dstat dim', `${s.basics} Basics${s.stage2 ? ` · ${s.stage2} Stage 2` : ''}`));
    c.onclick = () => startNewSave(n);
    grid.appendChild(c);
  });
  box.appendChild(grid);
  ov.appendChild(box);
  return ov;
}

function renderPackScreen() {
  const p = UI.pack;
  const ov = el('div', 'packscreen');
  // A stipend used to add a whole extra row here, and `hasstipend` tightened
  // the eleven so the action bar still fitted at 768px. Borrowed Energy is drawn
  // inside the pack now, so a pack is always eleven cards and the row is gone.
  const box = el('div', 'packbox');
  const anyRevealed = p.revealed.some(Boolean);
  const allRevealed = p.revealed.every(Boolean);

  const head = el('div', 'packhead');
  head.appendChild(el('h2', null, `${setName(p.set)} booster`));
  // The 1st Edition line is held back until something has been flipped, so the
  // whole-pack roll lands as a discovery rather than as a spoiler in the header.
  head.appendChild(el('div', 'sub', anyRevealed && p.firstEd
    ? '— 1ST EDITION PRINT RUN —'
    : 'eleven cards'));
  box.appendChild(head);

  const grid = el('div', 'packgrid');
  p.order.forEach((c, i) => {
    const card = CARD_DB[c.id];
    const isRare = c.slot === 'rare';
    const slot = el('div', 'pullslot' + (isRare ? ' rare' : '') + (p.revealed[i] ? '' : ' hidden'));
    if (!p.revealed[i]) {
      const back = el('div', 'packback');
      back.appendChild(el('i'));
      slot.appendChild(back);
      slot.onclick = () => { p.revealed[i] = true; render(); };
    } else {
      slot.appendChild(pullFace(card, c.flags));
      const tag = el('div', 'vribbon');
      if (p.isNew[i]) tag.appendChild(el('span', 'pullnew', 'NEW'));
      c.flags.forEach(f => {
        const v = VARIANT_BY_KEY[f];
        if (v) tag.appendChild(el('span', 'vchip c-' + v.family, v.label));
      });
      slot.appendChild(tag);
      slot.onclick = () => { UI.detail = { id: c.id, flags: c.flags }; render(); };
    }
    grid.appendChild(slot);
  });
  box.appendChild(grid);

  if (allRevealed) {
    const nNew = p.isNew.filter(Boolean).length;
    const nVar = p.order.filter(c => c.flags.length).length;
    const sum = el('div', 'packsum');
    sum.appendChild(el('b', null, String(nNew)));
    sum.appendChild(el('span', null, nNew === 1 ? ' card you did not have' : ' cards you did not have'));
    if (nVar) { sum.appendChild(el('span', null, '  ·  ')); sum.appendChild(el('b', null, String(nVar))); sum.appendChild(el('span', null, ' with a variant')); }
    box.appendChild(sum);
  }

  const bar = el('div', 'packbar');
  if (!allRevealed) {
    const all = el('button', 'btn', 'Reveal all');
    all.onclick = () => { p.revealed = p.revealed.map(() => true); render(); };
    bar.appendChild(all);
  }
  // Another of the SAME set first — you are usually working through a stack of
  // one thing — then anything else you hold, named so the choice is visible.
  const sameLeft = packsHeld(UI.save, p.set);
  if (sameLeft > 0) {
    const more = el('button', 'btn end', `Open another (${sameLeft})`);
    more.onclick = () => { openNextPack(p.set); render(); };
    bar.appendChild(more);
  }
  for (const s of packSets(UI.save)) {
    if (s === p.set) continue;
    const other = el('button', 'btn', `${setShort(s)} (${packsHeld(UI.save, s)})`);
    other.onclick = () => { openNextPack(s); render(); };
    bar.appendChild(other);
  }
  // Trevor's idea, and the right moment for it: by the time the pulls are on
  // screen you know whether the match was worth reading back, and the log now
  // carries the pulls too.
  if (UI.elog && UI.elog.result) {
    const dl = el('button', 'btn ghost', 'Save match log');
    dl.onclick = downloadMatchLog;
    bar.appendChild(dl);
  }
  const done = el('button', 'btn ghost', 'Done');
  done.onclick = () => { UI.pack = null; UI.detail = null; UI.screen = 'decks'; render(); };
  bar.appendChild(done);
  box.appendChild(bar);

  ov.appendChild(box);
  return ov;
}

// The scan and your copy, side by side. They are different objects and this is
// the screen that admits it: the scan is what the card looks like, the Sigil
// Card is what YOUR copy looks like — and only the second can carry a print run.
function renderPullDetail() {
  const d = UI.detail;
  const card = CARD_DB[d.id];
  const ov = el('div', 'overlay');
  const box = el('div', 'sheet');
  box.appendChild(el('h2', null, card.name));
  box.appendChild(el('p', 'dimtxt', d.flags.length ? vlabel(vkey(d.flags)) : 'Normal printing'));

  const row = el('div', 'pulldetail');
  const a = el('div', 'dcol');
  a.appendChild(el('div', 'lbl', 'THE PRINTED CARD'));
  a.appendChild(pullFace(card, d.flags));
  row.appendChild(a);
  const b = el('div', 'dcol');
  b.appendChild(el('div', 'lbl', 'YOUR COPY'));
  b.appendChild(sigilCard(card, d.flags));
  row.appendChild(b);
  box.appendChild(row);

  const bar = el('div', 'actionbar');
  const close = el('button', 'btn ghost', 'Close');
  close.onclick = () => { UI.detail = null; render(); };
  bar.appendChild(close);
  box.appendChild(bar);
  ov.appendChild(box);
  return ov;
}

// ---------------------------------------------------- the collection ------
// Two views over the same save. CARDS is every printing, which is what packs
// fill and what the deck builder will shop from. DEX is one entry per species,
// which is the thing the game says you are here to complete — and they are very
// different numbers: Base Set is 102 cards but only 69 species.
const COLL_FILTERS = [['all', 'ALL'], ['owned', 'OWNED'], ['missing', 'MISSING']];

// A dot per variant family on a tile, so a binder page shows at a glance where
// the interesting copies are without opening anything.
const VAR_DOT = { rh: '#A8D8F0', fe: '#D8C48A', sh: '#F0A8DC', sl: '#9FD3C4', mp: '#E88A7A' };

function collFamilies(save, id) {
  const fams = {};
  pilesOf(save, id).forEach(p => vflags(p.key).forEach(f => { fams[VARIANT_BY_KEY[f].family] = 1; }));
  return Object.keys(fams);
}

// `label` is what an empty slot shows. It differs by view and the difference
// matters: in the dex an empty slot is a SPECIES you have never seen, so
// showing its card number there reads as the wrong number entirely.
function collTile(id, count, best, label) {
  const card = CARD_DB[id];
  const t = el('div', 'colltile');
  if (count > 0) {
    t.appendChild(pullFace(card, vflags(best)));
    const q = el('div', 'collqty' + (count >= 40 ? ' hoard' : ''), '×' + count);
    t.appendChild(q);
    const fams = collFamilies(UI.save, id);
    if (fams.length) {
      const dots = el('div', 'collvars');
      fams.forEach(f => { const d = el('i', 'collvdot'); d.style.background = VAR_DOT[f]; dots.appendChild(d); });
      t.appendChild(dots);
    }
    t.onclick = () => { UI.detail = { id, flags: vflags(best) }; render(); };
  } else {
    // A missing slot used to be the card's number and nothing else, which made
    // both grids a wall of small grey digits: you could see how much was left
    // but not what any of it was. The chase was real and completely unspecific,
    // which COLLECTION.md had already flagged as the obvious quality gap.
    //
    // So a slot now names the thing you are missing, over a ghosted Sigil Card.
    // The sigil is OUR drawing rather than the scan, which is exactly right
    // here — it says "this is the shape of what goes in this hole" without
    // handing you the printed face you have not earned. It carries real
    // information too: petals are the attack count, rings the retreat cost.
    const m = el('div', 'collmiss');
    // The type edge every other face in this game carries, so a grid of holes
    // can still be read for "I am short three Water cards".
    m.style.borderLeftColor = cardAccent(card);
    m.appendChild(sigilBox(card, 'missart'));
    m.appendChild(el('div', 'missname', card.name));
    m.appendChild(el('div', 'missnum', label || card.num));
    t.appendChild(m);
    // A card you do not own still opens — you can read what you are chasing.
    t.onclick = () => { UI.detail = { id, flags: [] }; render(); };
  }
  return t;
}

function renderCollection() {
  const save = UI.save;
  const st = collectionStats(save, LIVE_DB);
  const ov = el('div', 'collscreen');
  const box = el('div', 'collbox');

  const head = el('div', 'collhead');
  head.appendChild(el('h2', null, UI.collView === 'dex' ? 'Dex' : 'Collection'));
  const counts = el('div', 'collbar');
  counts.appendChild(el('span', null, UI.collView === 'dex'
    ? `${st.species.owned} of ${st.species.total} species`
    : `${st.cards.owned} of ${st.cards.total} cards`));
  head.appendChild(counts);
  box.appendChild(head);

  const bar = el('div', 'collbar');
  const chip = (label, on, fn) => {
    const c = el('div', 'collchip' + (on ? ' on' : ''), label);
    c.onclick = fn;
    bar.appendChild(c);
  };
  // Switching view or filter replaces the list wholesale, so holding the old
  // scroll position would land you in the middle of something you never scrolled.
  chip('CARDS', UI.collView !== 'dex', () => { UI.collView = 'cards'; resetScroll('collection'); render(); });
  chip('DEX', UI.collView === 'dex', () => { UI.collView = 'dex'; resetScroll('collection'); render(); });
  bar.appendChild(el('span', null, ' '));
  COLL_FILTERS.forEach(([k, label]) => chip(label, UI.collFilter === k,
    () => { UI.collFilter = k; resetScroll('collection'); render(); }));
  box.appendChild(bar);

  const grid = keepScroll(el('div', 'collgrid'), 'collection');
  const show = have => UI.collFilter === 'all' || (UI.collFilter === 'owned') === have;

  if (UI.collView === 'dex') {
    // One row per species, represented by the best card of it that you own —
    // or the lowest-numbered printing as a placeholder if you own none.
    const species = {};
    Object.keys(LIVE_DB).forEach(id => {
      const c = CARD_DB[id];
      if (!c.dex) return;
      const s = species[c.dex] || (species[c.dex] = { dex: c.dex, name: c.name, ids: [] });
      s.ids.push(id);
    });
    Object.keys(species).map(Number).sort((a, b) => a - b).forEach(n => {
      const s = species[n];
      const ownedIds = s.ids.filter(id => isOwned(save, id));
      if (!show(ownedIds.length > 0)) return;
      const pick = ownedIds[0] || s.ids[0];
      const count = ownedIds.reduce((a, id) => a + ownedTotal(save, id), 0);
      grid.appendChild(collTile(pick, count, count ? bestVariant(save, pick) : '', '#' + s.dex));
    });
  } else {
    Object.keys(CARD_DB).forEach(id => {
      const n = ownedTotal(save, id);
      if (!show(n > 0)) return;
      grid.appendChild(collTile(id, n, bestVariant(save, id), CARD_DB[id].num));
    });
  }
  box.appendChild(grid);

  const foot = el('div', 'collfoot');
  const left = el('div', null,
    `${save.stats.packsOpened} packs opened · ${save.stats.cardsPulled} cards pulled · ${save.stats.wins}W-${save.stats.losses}L`);
  foot.appendChild(left);
  const acts = el('div', 'collbar');
  const exp = el('button', 'btn tiny', 'Export save');
  exp.onclick = () => downloadSave();
  acts.appendChild(exp);
  const imp = el('button', 'btn tiny', 'Import');
  imp.onclick = () => { UI.importText = ''; UI.importErr = ''; UI.importing = true; render(); };
  acts.appendChild(imp);
  const back = el('button', 'btn', 'Back');
  back.onclick = () => { UI.screen = 'decks'; render(); };
  acts.appendChild(back);
  foot.appendChild(acts);
  box.appendChild(foot);

  ov.appendChild(box);
  return ov;
}

// ====================================================== 5e: DECK BUILDER ===
// UI.builder = { deckId|null, name, list: [[qty, id, vkey], ...] }
//
// Editing is a WORKING COPY. Nothing touches the save until you press one of
// the two save buttons, so backing out of a session of fiddling costs nothing
// and cannot half-apply.

// A throwaway Engine purely to reach validateDeck(). Deck legality already
// lives there — exactly 60, four-by-name with basic Energy exempt, at least
// one Basic, the unimplemented refusal, the evolution-line warning — and
// writing a second copy of those rules is how they drift apart. The
// constructor only assigns fields, so this is cheap and has no side effects.
function validator() {
  if (!UI.valEngine) UI.valEngine = new Engine(CARD_DB, EFFECTS, { seed: 1 });
  return UI.valEngine;
}

const builderTotal = b => b.list.reduce((a, e) => a + e[0], 0);
const builderQty = (b, id, k) => {
  const e = b.list.find(x => x[1] === id && vkey(x[2]) === vkey(k));
  return e ? e[0] : 0;
};

function builderAdd(id, k, n) {
  const b = UI.builder, key = vkey(k);
  const e = b.list.find(x => x[1] === id && vkey(x[2]) === key);
  if (e) { e[0] += n; if (e[0] <= 0) b.list.splice(b.list.indexOf(e), 1); }
  else if (n > 0) b.list.push(key ? [n, id, key] : [n, id]);
}

function openBuilder(deckId) {
  const d = deckId != null ? findDeck(UI.save, deckId) : null;
  UI.builder = {
    deckId: d ? d.id : null,
    name: d ? d.name : 'New deck',
    // Deep copy. Editing the saved arrays in place would mutate the collection
    // as you clicked, and Cancel would have nothing to restore.
    list: d ? d.list.map(e => e.slice()) : [],
  };
  UI.poolFilter = UI.poolFilter || { kind: 'all', type: 'all', text: '', owned: true };
  resetScroll('builder-pool'); resetScroll('builder-list');
  UI.screen = 'builder';
  render();
}

// How many of a card the player could still put in THIS deck: what they own,
// minus what other BUILT decks hold, minus what this draft already uses.
function builderFree(id, k) {
  const key = vkey(k);
  // `undefined` is how available() is told to exclude nothing, which is what
  // a brand-new deck wants — it is not yet in the save and reserves nothing.
  // This was briefly a magic sentinel string, which worked only by accident
  // (no deck id could ever match it) and smuggled a literal NUL byte into the
  // source and into every built HTML. Use the documented contract instead.
  const except = UI.builder.deckId == null ? undefined : UI.builder.deckId;
  return available(UI.save, id, key, except) - builderQty(UI.builder, id, key);
}

// Every pile of this card the player could still add to this deck, best first.
// A pile is a variant combination — see collection.js. Most cards have exactly
// one, which is what keeps variant picking invisible until it matters.
function builderPiles(id) {
  return pilesOf(UI.save, id)
    .map(p => ({ key: p.key, label: p.label, score: p.score, free: builderFree(id, p.key) }))
    .filter(p => p.free > 0);
}

// What clicking a pool tile does. Three cases, and the middle one is the whole
// reason this is a function rather than a line:
//
//   own none      add plain anyway — that is how a blueprint names a card you
//                 have not pulled yet
//   one pile      add it, WHATEVER IT IS. If your only Rattata is Shiny then
//                 clicking Rattata has to give you the Shiny; refusing because
//                 the plain pile is empty would be absurd
//   several       ask, because now it is a real choice
function poolClick(id) {
  const piles = builderPiles(id);
  if (!ownedTotal(UI.save, id)) { builderAdd(id, '', 1); render(); return; }
  if (!piles.length) return;
  if (piles.length === 1) { builderAdd(id, piles[0].key, 1); render(); return; }
  UI.pilePick = { id };
  render();
}

// Choosing which physical copy goes in the deck. Shown as card faces rather
// than as a list, because the entire point is to look at them — this is where
// a lucky pull stops being a number in a binder and goes on the table.
function renderPilePicker() {
  const id = UI.pilePick.id;
  const card = CARD_DB[id];
  const ov = el('div', 'overlay');
  const box = el('div', 'sheet');
  box.appendChild(el('h2', null, card.name));
  box.appendChild(el('p', 'dimtxt', 'You own more than one printing of this. Which goes in the deck?'));
  const row = el('div', 'pulldetail');
  builderPiles(id).forEach(p => {
    const col = el('div', 'dcol');
    const face = pullFace(card, vflags(p.key));
    face.style.width = '150px';
    col.appendChild(face);
    col.appendChild(el('div', 'lbl', p.label.toUpperCase()));
    col.appendChild(el('div', 'lbl', p.free + ' available'));
    col.onclick = () => { builderAdd(id, p.key, 1); UI.pilePick = null; render(); };
    col.style.cursor = 'pointer';
    row.appendChild(col);
  });
  box.appendChild(row);
  const bar = el('div', 'actionbar');
  const cancel = el('button', 'btn ghost', 'Cancel');
  cancel.onclick = () => { UI.pilePick = null; render(); };
  bar.appendChild(cancel);
  box.appendChild(bar);
  ov.appendChild(box);
  return ov;
}

// Legality from the engine, availability from the save. Kept separate because
// they answer different questions: "is this a legal deck" and "does this
// player have it".
function builderStatus() {
  const b = UI.builder;
  const deck = { name: b.name, list: b.list };
  const legal = validator().validateDeck(deck);
  const shortfall = deckShortfall(UI.save, { id: b.deckId, list: b.list }, CARD_DB);
  return { legal, shortfall, buildable: legal.ok && shortfall.length === 0 };
}

// "You have 0 free" is true and useless. Owning none and having them locked in
// another deck are different problems with different fixes — go open packs, or
// go dismantle something — and the player cannot tell which from a single
// number. This says which, and therefore what to do about it.
function shortfallText(s) {
  const missing = s.need - s.have;
  if (s.held > 0 && s.owned >= s.need) {
    return `${s.name}: all ${s.owned} you own are in your other decks — dismantle one, or drop ${missing} here`;
  }
  if (s.held > 0) {
    return `${s.name}: you own ${s.owned}, but ${s.held} are in other decks — ${missing} short`;
  }
  return `${s.name}: you own ${s.owned} and the deck wants ${s.need} — ${missing} short`;
}

const POOL_KINDS = [['all', 'ALL'], ['pokemon', 'POKÉMON'], ['trainer', 'TRAINER'], ['energy', 'ENERGY']];
const POOL_TYPES = ['G', 'R', 'W', 'L', 'P', 'F', 'C'];

function poolMatches(card) {
  const f = UI.poolFilter;
  if (f.kind !== 'all' && card.kind !== f.kind) return false;
  if (f.type !== 'all') {
    const t = card.kind === 'pokemon' ? card.type
      : card.kind === 'energy' ? (card.provides || '')[0] : '';
    if (t !== f.type) return false;
  }
  if (f.text && card.name.toLowerCase().indexOf(f.text.toLowerCase()) < 0) return false;
  if (f.owned && !isOwned(UI.save, card.id)) return false;
  return true;
}

function renderBuilder() {
  const b = UI.builder;
  const status = builderStatus();
  const ov = el('div', 'buildscreen');
  const box = el('div', 'buildbox');

  const head = el('div', 'buildhead');
  head.appendChild(el('h2', null, b.deckId == null ? 'New deck' : 'Editing deck'));
  const f = UI.poolFilter;
  const fbar = el('div', 'collbar');
  const chip = (label, on, fn) => {
    const c = el('div', 'collchip' + (on ? ' on' : ''), label);
    c.onclick = fn; fbar.appendChild(c);
  };
  // Any filter change rebuilds the pool from scratch, so the old scroll position
  // means nothing — but adding a card does not, which is the case that matters.
  const refilter = fn => () => { fn(); resetScroll('builder-pool'); render(); };
  POOL_KINDS.forEach(([k, label]) => chip(label, f.kind === k, refilter(() => { f.kind = k; })));
  chip('ANY TYPE', f.type === 'all', refilter(() => { f.type = 'all'; }));
  POOL_TYPES.forEach(t => chip(ENERGY_NAME[t] || t, f.type === t, refilter(() => { f.type = t; })));
  chip('OWNED ONLY', f.owned, refilter(() => { f.owned = !f.owned; }));
  const search = el('input');
  search.type = 'text'; search.placeholder = 'search'; search.value = f.text;
  search.className = 'buildname'; search.style.width = '120px'; search.style.fontSize = '11px';
  search.oninput = refilter(() => { f.text = search.value; });
  fbar.appendChild(search);
  head.appendChild(fbar);
  box.appendChild(head);

  const main = el('div', 'buildmain');

  // ---- the pool ----
  const grid = keepScroll(el('div', 'collgrid'), 'builder-pool');
  Object.keys(LIVE_DB).forEach(id => {
    const card = CARD_DB[id];
    if (!poolMatches(card)) return;
    const owned = ownedTotal(UI.save, id);
    // Across ALL piles, not just the plain one. Reading only the plain pile
    // greyed out any card whose only copy happened to be a variant — own one
    // Rattata and it is Shiny, and the tile claimed you had none.
    const piles = builderPiles(id);
    const free = piles.reduce((a, p) => a + p.free, 0);
    const inDeck = b.list.filter(e => e[1] === id).reduce((a, e) => a + e[0], 0);
    const t = el('div', 'colltile' + (owned === 0 ? ' unowned' : (free <= 0 ? ' spent' : '')));
    if (owned > 0) t.appendChild(pullFace(card, vflags(bestVariant(UI.save, id))));
    else t.appendChild(el('div', 'collmiss', card.num));
    if (inDeck) t.appendChild(el('div', 'inuse', String(inDeck)));
    t.appendChild(el('div', 'collqty', owned ? '×' + free : '—'));
    // A dot per variant family you could still add, so a tile worth a second
    // thought looks different from one that is just a card.
    const fams = {};
    piles.forEach(p => vflags(p.key).forEach(f => { fams[VARIANT_BY_KEY[f].family] = 1; }));
    if (Object.keys(fams).length) {
      const dots = el('div', 'collvars');
      Object.keys(fams).forEach(f => { const d = el('i', 'collvdot'); d.style.background = VAR_DOT[f]; dots.appendChild(d); });
      t.appendChild(dots);
    }
    // Unowned cards can still be added: that is how you plan a deck you cannot
    // afford yet. It just cannot be BUILT, and the shortfall says what to chase.
    if (free > 0 || owned === 0) t.onclick = () => poolClick(id);
    grid.appendChild(t);
  });
  main.appendChild(grid);

  // ---- the deck ----
  const side = el('div', 'buildside');
  const nameIn = el('input', 'buildname');
  nameIn.type = 'text'; nameIn.value = b.name;
  nameIn.oninput = () => { b.name = nameIn.value; };
  side.appendChild(nameIn);

  const total = builderTotal(b);
  const cnt = el('div', 'buildcount');
  const num = el('b', total === 60 ? 'good' : 'bad', String(total));
  cnt.appendChild(num);
  cnt.appendChild(el('span', null, 'of 60 cards'));
  side.appendChild(cnt);

  const list = keepScroll(el('div', 'decklist'), 'builder-list');
  const GROUPS = [['pokemon', 'POKÉMON'], ['trainer', 'TRAINER'], ['energy', 'ENERGY']];
  GROUPS.forEach(([kind, label]) => {
    const rows = b.list.filter(e => CARD_DB[e[1]] && CARD_DB[e[1]].kind === kind);
    if (!rows.length) return;
    const n = rows.reduce((a, e) => a + e[0], 0);
    list.appendChild(el('div', 'dlgroup', `${label} — ${n}`));
    rows.sort((x, y) => CARD_DB[x[1]].name.localeCompare(CARD_DB[y[1]].name)).forEach(e => {
      const card = CARD_DB[e[1]];
      const r = el('div', 'dlrow');
      r.appendChild(el('span', 'q', e[0] + '×'));
      r.appendChild(el('span', 'n', card.name));
      if (vkey(e[2])) r.appendChild(el('span', 'v', vlabel(vkey(e[2]))));
      r.appendChild(el('span', 'x', '−'));
      r.onclick = () => { builderAdd(e[1], e[2], -1); render(); };
      peekOn(r, e[1]);
      list.appendChild(r);
    });
  });
  if (!b.list.length) list.appendChild(el('div', 'emptynote', 'Click cards on the left to add them.'));
  side.appendChild(list);

  // ---- why you can or cannot build it ----
  const leg = el('div', 'legality');
  const line = (cls, mark, text) => {
    const r = el('div', 'legrow ' + cls);
    r.appendChild(el('i', null, mark));
    r.appendChild(el('span', null, text));
    leg.appendChild(r);
  };
  status.legal.errors.forEach(e => line('bad', '✕', e));
  status.shortfall.forEach(s => line('bad', '✕', shortfallText(s)));
  status.legal.warnings.forEach(w => line('warn', '!', w));
  if (status.buildable) line('ok', '✓', 'Legal, and you own every card. Ready to build.');
  side.appendChild(leg);

  // ---- actions ----
  const acts = el('div', 'buildacts');
  const build = el('button', 'btn end', 'Save & build');
  build.className = 'btn end' + (status.buildable ? '' : ' off');
  build.onclick = () => { if (status.buildable) commitBuilder(true); };
  acts.appendChild(build);
  const layout = el('button', 'btn', 'Save as layout');
  layout.onclick = () => commitBuilder(false);
  acts.appendChild(layout);
  if (b.deckId != null) {
    const del = el('button', 'btn ghost', 'Delete');
    del.onclick = () => deleteBuilderDeck();
    acts.appendChild(del);
  }
  const cancel = el('button', 'btn ghost', 'Cancel');
  cancel.onclick = () => { UI.builder = null; UI.screen = 'decks'; render(); };
  acts.appendChild(cancel);
  side.appendChild(acts);
  if (UI.builderNote) side.appendChild(el('div', 'verr', UI.builderNote));

  main.appendChild(side);
  box.appendChild(main);
  ov.appendChild(box);
  return ov;
}

// Returns an error string or ''. Saving as a layout is always allowed; the
// only refusal is un-building your last built deck, which would leave deck
// select with nothing but Sandbox on it.
function commitBuilder(built) {
  const b = UI.builder;
  // Unique across the save, excluding this deck so re-saving an edit does not
  // suffix a deck against itself. See uniqueDeckName in collection.js.
  const name = uniqueDeckName(UI.save, (b.name || '').trim() || 'Untitled deck', b.deckId);
  let d = b.deckId != null ? findDeck(UI.save, b.deckId) : null;
  if (d && deckIsBuilt(d) && !built) {
    const can = canUnbuild(UI.save, d.id);
    if (!can.ok) { UI.builderNote = 'Cannot un-build: ' + can.why + '.'; render(); return can.why; }
  }
  if (!d) {
    d = { id: nextDeckId(UI.save), name, built, list: [] };
    UI.save.decks.push(d);
  }
  d.name = name;
  d.built = built;
  d.list = b.list.map(e => e.slice());
  persist();
  UI.builder = null; UI.builderNote = '';
  afterLoad();                 // keep the selected deck pointing at something real
  render();
  return '';
}

function deleteBuilderDeck() {
  const d = findDeck(UI.save, UI.builder.deckId);
  if (!d) { UI.builder = null; UI.screen = 'decks'; render(); return ''; }
  if (deckIsBuilt(d)) {
    const can = canUnbuild(UI.save, d.id);
    if (!can.ok) { UI.builderNote = 'Cannot delete: ' + can.why + '.'; render(); return can.why; }
  }
  UI.save.decks = UI.save.decks.filter(x => x !== d);
  persist();
  UI.builder = null; UI.builderNote = '';
  afterLoad();
  render();
  return '';
}

// ---------------------------------------------------- export / import -----
// There is no server. A cleared browser profile is the only thing standing
// between the player and the entire collection, so this is a real feature
// rather than a convenience.
//
// The DOM plumbing is deliberately thin and guarded, because none of Blob,
// URL.createObjectURL or <a>.click() exists in the smoke stub. The part worth
// testing — validate, migrate, adopt — is applyImportedSave(), which is pure.
function downloadSave() {
  const text = exportSave(UI.save);
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shadowless-collection.json';
    if (typeof a.click === 'function') a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (e) {
    // No Blob support, or a browser that refuses the download: fall back to
    // showing the text so it can still be copied out by hand. Losing the
    // ability to back up is not an acceptable failure here.
    UI.importText = text; UI.importErr = 'Copy this out and keep it somewhere safe.';
    UI.importing = true; render();
  }
}

// Returns an error string, or '' on success. Never throws at the caller.
function applyImportedSave(text) {
  let s;
  try { s = importSave(text); } catch (e) { return String(e && e.message || e); }
  UI.save = s;
  persist();
  afterLoad();
  UI.pack = null; UI.detail = null; UI.importing = false;
  return '';
}

function renderImport() {
  const ov = el('div', 'overlay');
  const box = el('div', 'sheet collsheet');
  box.appendChild(el('h2', null, 'Import a save'));
  box.appendChild(el('p', 'dimtxt',
    'Paste an exported collection. This REPLACES what you have now, so export the current one first if you want to keep it.'));
  const ta = el('textarea');
  ta.value = UI.importText || '';
  ta.oninput = () => { UI.importText = ta.value; };
  box.appendChild(ta);
  if (UI.importErr) box.appendChild(el('p', 'verr', UI.importErr));
  const bar = el('div', 'actionbar');
  const go = el('button', 'btn end', 'Replace my collection');
  go.onclick = () => {
    const err = applyImportedSave(ta.value);
    if (err) { UI.importErr = err; UI.importText = ta.value; }
    render();
  };
  const cancel = el('button', 'btn ghost', 'Cancel');
  cancel.onclick = () => { UI.importing = false; UI.importErr = ''; render(); };
  bar.appendChild(go); bar.appendChild(cancel);
  box.appendChild(bar);
  ov.appendChild(box);
  return ov;
}

function renderDeckSelect() {
  const ov = el('div', 'deckscreen');
  const box = el('div', 'deckbox');

  // The game has never said its own name anywhere. It does now, and the note
  // says what the name means — it is a print-run term, not a mood.
  const title = el('div', 'titleblock');
  title.appendChild(el('h1', 'gametitle', 'SHADOWLESS'));
  title.appendChild(el('div', 'gamesub', 'The Wizards of the Coast era, played to the letter of the original rules.'));
  title.appendChild(el('div', 'gamenote',
    `Named for the early Base Set sheets, printed before the drop shadow. ${Object.keys(LIVE_DB).length} cards implemented.`));
  box.appendChild(title);

  // What you own, and what is waiting to be opened. This is the first thing on
  // the screen after the title because in a collection game it is the score.
  if (UI.save) {
    const st = collectionStats(UI.save, LIVE_DB);
    const strip = el('div', 'collstrip');
    const stat = (n, label) => {
      const s = el('div', 'collstat');
      s.appendChild(el('b', null, String(n)));
      s.appendChild(el('span', null, label));
      strip.appendChild(s);
    };
    stat(`${st.cards.owned}/${st.cards.total}`, 'CARDS');
    stat(`${st.species.owned}/${st.species.total}`, 'SPECIES');
    stat(UI.save.stats.wins, 'WINS');
    stat(UI.save.stats.packsOpened, 'PACKS OPENED');
    const browse = el('button', 'btn', 'Collection');
    browse.onclick = () => { UI.screen = 'collection'; render(); };
    strip.appendChild(browse);
    const edit = el('button', 'btn', 'Edit deck');
    // Edits whatever you currently have selected, which is almost always the
    // one you want — and is one click rather than a per-tile control that
    // would compete with selecting the deck in the first place.
    // Resolved by the same rule as everything else on this screen. This used to
    // do its own `builtDecks().concat(decks).find(byName)` — a local patch for
    // the shadowing bug, applied at one call site out of three. deckFor now
    // owns the rule, so there is one place it can be wrong.
    edit.onclick = () => {
      const d = deckFor(UI.myDeck, 'mine');
      openBuilder(d && d.id != null ? d.id : null);
    };
    strip.appendChild(edit);
    const nu = el('button', 'btn', 'New deck');
    nu.onclick = () => openBuilder(null);
    strip.appendChild(nu);
    if (UI.save.decks.some(d => !deckIsBuilt(d))) {
      const lay = el('button', 'btn ghost', `${UI.save.decks.filter(d => !deckIsBuilt(d)).length} layout(s)`);
      lay.onclick = () => { UI.showLayouts = !UI.showLayouts; render(); };
      strip.appendChild(lay);
    }
    const held = packsTotal(UI.save);
    if (held > 0) {
      const go = el('button', 'btn end', `Open ${held} pack${held === 1 ? '' : 's'}`);
      go.onclick = () => { if (openNextPack()) render(); };
      strip.appendChild(go);
    }
    box.appendChild(strip);
    if (UI.saveNote) box.appendChild(el('div', 'collwarn', UI.saveNote));
  }

  // YOUR side lists only decks you can legally field. The OPPONENT side lists
  // everything — their deck is the game's, not yours, and never was a
  // collection question.
  const mkDeckGrid = (key, side) => {
    const grid = el('div', 'deckgrid');
    (key === 'myDeck' && UI.save ? myDeckNames() : DECK_NAMES).forEach(n => {
      const s = deckSummary(n, side);
      const isSandbox = n === SANDBOX;
      const c = el('div', 'deckcard' + (UI[key] === n ? ' on' : ''));

      const art = el('div', 'dart');
      const hero = isSandbox ? null : deckHero(n, side);
      if (hero) {
        const img = cardFaceImage(CARD_DB[hero], null);
        if (img) art.appendChild(img);
      }
      if (!hero) { const b = cardBack('deckback'); art.appendChild(b); }
      c.appendChild(art);

      c.appendChild(el('div', 'dname', n));
      const pips = el('div', 'dtypes');
      Object.keys(s.types).sort((a, b) => s.types[b] - s.types[a]).forEach(t => {
        const p = el('i', 'pip'); p.style.background = ENERGY_COLOR[t]; p.title = ENERGY_NAME[t];
        pips.appendChild(p);
      });
      c.appendChild(pips);
      c.appendChild(el('div', 'dstat', `${s.k.pokemon} / ${s.k.trainer} / ${s.k.energy}`));
      c.appendChild(el('div', 'dstat dim', isSandbox
        ? 'every implemented card'
        : `${s.basics} Basics${s.stage2 ? ` · ${s.stage2} Stage 2` : ''}`));
      c.onclick = () => { UI[key] = n; render(); };
      grid.appendChild(c);
    });
    return grid;
  };
  const mkGrid = (key, heading) => {
    const sec = el('div', 'deckgrp');
    sec.appendChild(el('div', 'grphead', heading));
    sec.appendChild(mkDeckGrid(key, key === 'myDeck' ? 'mine' : 'theme'));
    return sec;
  };

  box.appendChild(mkGrid('myDeck', 'YOUR DECK'));

  // Layouts are decks you have written down but not committed cards to — a
  // half-finished draft and a plan you cannot afford yet are the same thing.
  // They live behind a toggle rather than in the grid, because they are not
  // playable and putting them beside decks that are would only invite the
  // click that does nothing.
  if (UI.showLayouts) {
    const sec = el('div', 'deckgrp');
    sec.appendChild(el('div', 'grphead', 'LAYOUTS — saved, but no cards committed'));
    const rows = el('div', 'legality');
    UI.save.decks.filter(d => !deckIsBuilt(d)).forEach(d => {
      const short = deckShortfall(UI.save, d, CARD_DB);
      const n = d.list.reduce((a, e) => a + e[0], 0);
      const r = el('div', 'legrow ' + (short.length ? 'warn' : 'ok'));
      r.appendChild(el('i', null, short.length ? '!' : '✓'));
      r.appendChild(el('span', null, `${d.name} — ${n}/60`
        + (short.length ? `, missing ${short.map(s => `${s.need - s.have}× ${s.name}`).join(', ')}` : ', ready to build')));
      const b = el('button', 'btn tiny', 'Open');
      b.onclick = () => openBuilder(d.id);
      r.appendChild(b);
      rows.appendChild(r);
    });
    sec.appendChild(rows);
    box.appendChild(sec);
  }

  // OPPONENT is the ladder, unless you have asked for free play. The toggle is
  // in the section heading rather than beside the seed, because it changes what
  // this whole section IS rather than tuning the match.
  // `ladgrp` is the flexible child of the box: everything else on this screen is
  // fixed-height, so the ladder takes exactly what is left and scrolls inside
  // it. See style.css — the screen has to fit without a JS fitter.
  const foeSec = el('div', 'deckgrp ladgrp');
  const foeHead = el('div', 'grphead');
  foeHead.appendChild(el('span', null, UI.freePlay ? 'OPPONENT — free play' : 'OPPONENT'));
  const swap = el('button', 'btn tiny ghost', UI.freePlay ? 'Back to the ladder' : 'Free play');
  swap.onclick = () => {
    UI.freePlay = !UI.freePlay;
    // Coming back has to land on somebody you are allowed to play, or Play is
    // dead. Going out changes nothing — UI.foe is kept, so your place is still
    // there when you return.
    if (!UI.freePlay) pickFirstOpponent();
    render();
  };
  foeHead.appendChild(swap);
  foeSec.appendChild(foeHead);
  if (UI.freePlay) {
    foeSec.appendChild(el('div', 'dimtxt ladnote',
      'Any deck against any deck, mirrors included. Pays no packs and records nothing.'));
    foeSec.appendChild(mkDeckGrid('foeDeck', 'theme'));
  } else {
    foeSec.appendChild(renderLadder());
  }
  box.appendChild(foeSec);

  const opts = el('div', 'deckopts');
  const field = (lbl, node) => {
    const f = el('div', 'dfield');
    f.appendChild(el('label', null, lbl));
    f.appendChild(node);
    return f;
  };

  const dsel = el('select');
  [['Expert', 'expert'], ['Novice', 'novice'], ['Damage-only bot', 'greedy'], ['Random', 'random']]
    .forEach(([t, v]) => { const o = el('option', null, t); o.value = v; if (UI.aiMode === v) o.selected = true; dsel.appendChild(o); });
  dsel.onchange = () => { UI.aiMode = dsel.value; };
  opts.appendChild(field('opponent plays', dsel));

  const ps = el('select');
  [6, 4, 3, 2, 1].forEach(n => { const o = el('option', null, String(n)); o.value = n; if (UI.cfgDraft.prizeCount === n) o.selected = true; ps.appendChild(o); });
  ps.onchange = () => { UI.cfgDraft.prizeCount = parseInt(ps.value, 10); };
  opts.appendChild(field('prizes', ps));

  const si = el('input'); si.type = 'text'; si.placeholder = 'random'; si.value = UI.seedDraft;
  si.oninput = () => { UI.seedDraft = si.value.trim(); };
  opts.appendChild(field('seed', si));
  box.appendChild(opts);

  const bar = el('div', 'deckgo');
  const foeNow = currentFoe();
  const go = el('button', 'btn end big', foeNow
    ? `Play ${UI.myDeck} against ${foeNow.name}`
    : `Play ${UI.myDeck} vs ${UI.foeDeck}`);
  // Only reachable if the ladder somehow has nobody open, which cannot happen
  // while the first bracket exists — but a dead Play button is worse than a
  // disabled one, so it says why rather than doing nothing.
  if (!UI.freePlay && !foeNow) { go.disabled = true; go.textContent = 'No challenger selected'; }
  go.onclick = () => startMatch();
  bar.appendChild(go);
  box.appendChild(bar);

  ov.appendChild(box);
  return ov;
}

// ---------------------------------------------------------- the ladder ----
// Job 7b. One section per bracket, in order, with the locked ones still drawn
// so the shape of what is ahead is visible from the first match. A challenger
// you have beaten stays fightable forever — that is what makes a set's ~79 wins
// reachable, and it is why nothing here is ever removed from the list.

// Keeps the selection pointing at somebody you are allowed to play. Called on
// load, on leaving free play, and after any win that opens a bracket.
function pickFirstOpponent() {
  if (!UI.save) { UI.foe = null; return; }
  const open = availableOpponents(UI.save, LADDER_VIEW);
  if (!open.length) { UI.foe = null; return; }
  if (UI.foe && open.some(o => o.id === UI.foe)) return;
  // Prefer somebody unbeaten, since that is what a player is looking for.
  const next = open.find(o => !hasBeaten(UI.save, o.id));
  UI.foe = (next || open[0]).id;
}

function opponentTile(opp, state) {
  // state: 'open' | 'locked'
  const beaten = UI.save ? timesBeaten(UI.save, opp.id) : 0;
  // `deckcard` carries the whole tile look; `foecard` only adds what differs.
  const c = el('div', 'deckcard foecard'
    + (UI.foe === opp.id ? ' on' : '')
    + (state === 'locked' ? ' locked' : '')
    + (opp.isBoss ? ' boss' : '')
    + (opp.isExtra ? ' extra' : ''));

  const art = el('div', 'dart');
  // A challenger's face is the deck's own hero card where there is one, which
  // reuses the deck-select idiom rather than inventing a portrait system. There
  // is no character art in this project and Trevor has said he does not want any.
  const deck = state === 'open' ? opponentDeckFor(opp) : null;
  const hero = deck ? heroOfList(deck.list) : null;
  if (hero && CARD_DB[hero]) {
    const img = cardFaceImage(CARD_DB[hero], null);
    if (img) art.appendChild(img);
  }
  if (!art.firstChild) art.appendChild(cardBack('deckback'));
  c.appendChild(art);

  c.appendChild(el('div', 'dname', opp.name));
  c.appendChild(el('div', 'dstat', opp.title));

  const tag = el('div', 'dstat dim');
  if (state === 'locked') tag.textContent = 'locked';
  else if (opp.isBoss) tag.textContent = beaten ? `rival · beaten ${beaten}×` : 'rival';
  else tag.textContent = beaten ? `beaten ${beaten}×` : 'not yet beaten';
  c.appendChild(tag);

  if (state === 'open') c.onclick = () => { UI.foe = opp.id; render(); };
  return c;
}

function renderLadder() {
  // Two regions, and the split is the point. OPEN brackets scroll — the roster
  // grows every time a set goes live and there is no viewport that fits all of
  // it. LOCKED brackets sit BELOW the scroller and never move, because "what is
  // ahead of me" is worth a permanent two lines and is worthless if you have to
  // scroll past everything you can already play to find it. They were inside
  // the scroller first and were simply never on screen.
  //
  // keepScroll on the scroller, not the wrapper: winning re-renders this list,
  // and being thrown back to the first bracket after every match is exactly the
  // friction COLLECTION.md describes.
  const wrap = el('div', 'ladwrap');
  const openBox = keepScroll(el('div', 'ladder'), 'ladder');
  const shutBox = el('div', 'ladlocked');
  wrap.appendChild(openBox);
  wrap.appendChild(shutBox);
  if (!UI.save) return wrap;

  LADDER_VIEW.forEach((b, i) => {
    const open = bracketOpen(UI.save, LADDER_VIEW, i);
    const sec = el('div', 'ladbracket' + (open ? '' : ' shut'));

    // A LOCKED bracket is one line, not a grid of tiles you cannot click.
    // Drawn as a full roster first, and it was wrong twice over: six greyed
    // tiles cost ~150px each bracket and pushed the Play button off a 768px
    // screen, and none of that space said anything a line could not. What the
    // player needs from a bracket they cannot enter is that it exists, what it
    // is called, and what opens it.
    if (!open) {
      const row = el('div', 'ladshut');
      row.appendChild(el('b', null, b.name));
      row.appendChild(el('span', 'ladset', setName(b.set)));
      // The TITLE, not the name: every boss on the authored ladder is Ronald, so
      // "beat Ronald to open" appeared twice and told you nothing about which.
      const prev = LADDER_VIEW[i - 1].boss;
      row.appendChild(el('span', 'ladprog', `beat ${prev.title || prev.name} to open`));
      sec.appendChild(row);
      shutBox.appendChild(sec);
      return;
    }

    const head = el('div', 'ladhead');
    head.appendChild(el('b', null, b.name));
    head.appendChild(el('span', 'ladset', setName(b.set)));
    const cleared = rosterCleared(UI.save, b);
    if (bracketCleared(UI.save, b)) {
      head.appendChild(el('span', 'ladprog done', `cleared · ${setName(b.set)} packs`));
    } else if (bossAvailable(UI.save, b)) {
      head.appendChild(el('span', 'ladprog ready', `${b.boss.name} is waiting`));
    } else {
      head.appendChild(el('span', 'ladprog', `${cleared}/${b.cfg.bossAfter} beaten — then ${b.boss.name}`));
    }
    sec.appendChild(head);
    if (b.blurb) sec.appendChild(el('div', 'dimtxt ladnote', b.blurb));

    const grid = el('div', 'deckgrid foegrid');
    b.roster.forEach(o => grid.appendChild(opponentTile(o, 'open')));
    // The boss is drawn even while locked, because it is the thing the counter
    // in the heading is counting toward.
    grid.appendChild(opponentTile(b.boss, bossAvailable(UI.save, b) ? 'open' : 'locked'));
    if (bracketCleared(UI.save, b)) b.extra.forEach(o => grid.appendChild(opponentTile(o, 'open')));
    sec.appendChild(grid);
    openBox.appendChild(sec);
  });
  return wrap;
}

// ----------------------------------------------------- generic picker -----
// Six Trainers need the player to choose cards out of hidden zones. Rather
// than six bespoke screens, one picker handles them all: a source list, a
// selection count, and an optional ordering mode.
//
//   UI.picker = {
//     title, prompt, items:[{uid,id}], min, max,
//     mode: 'select' | 'order',
//     chosen: [uid...],           // for 'select'
//     order:  [uid...],           // for 'order'
//     onDone(chosen) -> void
//   }
function openPicker(cfg) {
  UI.picker = Object.assign({ mode: 'select', chosen: [], order: [], min: 1, max: 1 }, cfg);
  if (UI.picker.mode === 'order') UI.picker.order = UI.picker.items.map(x => x.uid);
  render();
}

function pickerReady() {
  const pk = UI.picker;
  if (!pk) return false;
  if (pk.mode === 'order') return true;
  return pk.chosen.length >= pk.min && pk.chosen.length <= pk.max;
}

// ---------------------------------------------------------------------------
// Peek and Clairvoyance share ONE panel, and differ only in how often it opens.
//
// Trevor's recollection of the GBC game: it showed you what you had earned and
// waited for you to close it, so the only cost was the time you spent not
// playing. That is a better answer for Clairvoyance than a panel permanently
// eating board space, and "your turn only" comes with it.
//
// Peek follows the printed card rather than the GBC version, which was more
// generous: one item at a time, chosen from the top of either deck, a random
// card from their hand, or one of EITHER player's Prizes — that last is the
// most useful thing the card does and the easiest half to forget to build.
// See RULINGS.md.
// ---------------------------------------------------------------------------
function openReveal(title, sub, cards) {
  UI.reveal = { title, sub, cards };
}

function renderReveal() {
  const r = UI.reveal;
  const ov = el('div', 'overlay');
  const box = el('div', 'sheet wide');
  box.appendChild(el('h2', null, r.title));
  box.appendChild(el('p', 'dimtxt', r.sub));

  const row = el('div', 'revealrow');
  if (!r.cards.length) row.appendChild(el('div', 'dimtxt', 'Nothing to see.'));
  r.cards.forEach(c => {
    const cell = el('div', 'revealcard');
    cell.appendChild(pullFace(CARD_DB[c.id], []));
    cell.appendChild(el('div', 'revealname', CARD_DB[c.id].name));
    row.appendChild(cell);
  });
  box.appendChild(row);

  const bar = el('div', 'actionbar');
  const done = el('button', 'btn end', 'Close');
  done.onclick = () => { UI.reveal = null; render(); };
  bar.appendChild(done);
  box.appendChild(bar);
  ov.appendChild(box);
  return ov;
}

// Clairvoyance is passive and permanent, so it is not an action the engine
// offers — it is a button that exists for as long as the Power is switched on.
function clairvoyanceOn() {
  if (!UI.E || S().phase !== 'main' || S().active !== 0) return false;
  return UI.E.allSlots(0).some(sl => UI.E.activePower(sl, 'REVEAL_OPP_HAND'));
}

function renderPicker() {
  const pk = UI.picker;
  const ov = el('div', 'overlay');
  const box = el('div', 'sheet wide');
  box.appendChild(el('h2', null, pk.title));
  const sub = pk.mode === 'order'
    ? pk.prompt
    : `${pk.prompt} (${pk.chosen.length} of ${pk.max})`;
  box.appendChild(el('p', 'dimtxt', sub));

  if (pk.mode === 'order') {
    const list = el('div', 'orderlist');
    pk.order.forEach((uid, i) => {
      const c = CARD_DB[pk.items.find(x => x.uid === uid).id];
      const row = el('div', 'orderrow k-' + c.kind);
      row.appendChild(el('span', 'ordnum', String(i + 1)));
      row.appendChild(el('span', 'sn', c.name));
      row.appendChild(el('span', 'ss', c.kind === 'pokemon' ? `${c.stage} · ${c.hp} HP`
        : c.kind === 'energy' ? 'Energy' : 'Trainer'));
      const up = el('button', 'btn tiny' + (i === 0 ? ' off' : ''), '↑');
      up.onclick = () => { if (i > 0) { const t = pk.order[i - 1]; pk.order[i - 1] = pk.order[i]; pk.order[i] = t; render(); } };
      const dn = el('button', 'btn tiny' + (i === pk.order.length - 1 ? ' off' : ''), '↓');
      dn.onclick = () => { if (i < pk.order.length - 1) { const t = pk.order[i + 1]; pk.order[i + 1] = pk.order[i]; pk.order[i] = t; render(); } };
      row.appendChild(up); row.appendChild(dn);
      list.appendChild(row);
    });
    box.appendChild(list);
    box.appendChild(el('div', 'dimtxt small', 'Top of the deck is first. These are drawn in this order.'));
  } else if (pk.items.length > 14) {
    // long zones (deck search) read better as a compact list
    const list = el('div', 'searchlist');
    const groups = {};
    pk.items.forEach(it => {
      const c = CARD_DB[it.id];
      if (!groups[c.id]) groups[c.id] = { card: c, uids: [] };
      groups[c.id].uids.push(it.uid);
    });
    Object.values(groups)
      .sort((a, b) => a.card.kind.localeCompare(b.card.kind) || a.card.name.localeCompare(b.card.name))
      .forEach(g => {
        const r = el('div', 'searchrow k-' + g.card.kind);
        if (g.uids.some(u => pk.chosen.includes(u))) r.classList.add('on');
        r.appendChild(el('span', 'sn', g.card.name));
        r.appendChild(el('span', 'sq', '×' + g.uids.length));
        r.appendChild(el('span', 'ss', g.card.kind === 'pokemon' ? `${g.card.stage} · ${g.card.hp} HP`
          : g.card.kind === 'energy' ? g.card.cls + ' Energy' : 'Trainer'));
        r.onclick = () => togglePick(g.uids[0]);
        list.appendChild(r);
      });
    box.appendChild(list);
  } else {
    // The real printed scans, not miniCard.
    //
    // A picker is the surface where the card is most completely the SUBJECT —
    // you are choosing which physical card, not steering a token in play — so
    // it belongs with the preview rail, the dex and the pack reveal under the
    // standing decision in CLAUDE.md. It was simply never enumerated there,
    // because pickers predate the scans.
    //
    // It also fixes the thing that made this screen unusable. miniCard prints
    // attack names in a ~150px column and breaks them mid-word; in here that
    // meant "Fire Spin" rendered one letter per line, and a Trainer's rules
    // text was clamped mid-sentence, which is the whole information you would
    // be choosing on. A scan has none of those problems because it is a
    // picture of the answer.
    // Tiles shrink once there are enough of them to need two rows. With a few
    // cards you are reading them; with a dozen you are scanning for a name, and
    // a grid that scrolls at the size you read at hides half its own contents.
    const row = el('div', 'pickgrid' + (pk.items.length > 8 ? ' many' : ''));
    pk.items.forEach(it => {
      const c = CARD_DB[it.id];
      const t = el('div', 'picktile' + (pk.chosen.includes(it.uid) ? ' on' : ''));
      t.appendChild(pullFace(c, []));
      // Named underneath as well. An unfetched set falls back to the sigil,
      // which is deliberately not a portrait of anything — without the name
      // that fallback would be a row of identical marks.
      t.appendChild(el('div', 'pickname', c.name));
      t.onclick = () => togglePick(it.uid);
      row.appendChild(t);
    });
    if (!pk.items.length) row.appendChild(el('div', 'empty', 'nothing to choose'));
    box.appendChild(row);
  }

  const bar = el('div', 'actionbar');
  const ok = el('button', 'btn end' + (pickerReady() ? '' : ' off'), pk.confirm || 'Confirm');
  ok.onclick = () => {
    const pkk = UI.picker;
    if (!pickerReady()) return;
    const out = pkk.mode === 'order' ? pkk.order.slice() : pkk.chosen.slice();
    UI.picker = null;
    pkk.onDone(out);
  };
  const cancel = el('button', 'btn ghost', 'Cancel');
  cancel.onclick = () => { UI.picker = null; UI.sel = null; render(); };
  bar.appendChild(ok); bar.appendChild(cancel);
  box.appendChild(bar);
  ov.appendChild(box);
  return ov;
}

// A CARD WHOSE POWER ASKS A QUESTION THE MOMENT IT LANDS.
//
// Job 10c. Three Team Rocket cards fire an ON_PLAY Power on arrival and all
// three want an answer: which two Basics, which three cards out of the discard,
// which of their Pokemon to hit. The answer rides on the play action's `opts`,
// exactly as every Trainer's does — so it has to be collected BEFORE the card is
// dispatched, not after.
//
// Returns true if it took over. `go(opts)` is the caller's own dispatch, handed
// back whatever the player chose.
//
// Declining is a real answer and is passed as such: trigTargetUid: null. The
// engine reads an ABSENT key as "take it", which is what keeps the AI aggressive,
// so a Cancel that sent nothing would silently do the opposite of what it says.
function onPlayFlow(cardId, go) {
  const eff = EFFECTS[cardId];
  const p = eff && eff.p;
  if (!p || p.kind !== 'ON_PLAY') return false;
  const me0 = me();
  // The evolve targeting that got us here is finished, and leaving it armed
  // leaves its prompt and its Cancel sitting under the picker — a live control
  // for a question already answered. The snipe branch below arms its OWN
  // targeting after this, which is the one the player is actually being asked.
  UI.targeting = null; UI.sel = null;

  for (const v of (p.do || [])) {
    if (v.v === 'P_SEARCH_BENCH') {
      const room = Math.max(0, UI.E.cfg.benchMax - me0.bench.length);
      const want = Math.min(v.n || 1, room);
      const pool = me0.deck.filter(x => {
        const c = CARD_DB[x.id];
        return c.kind === 'pokemon' && c.stage === (v.stage || 'Basic');
      });
      if (!want || !pool.length) return false;        // nothing to ask about
      openPicker({ title: p.name, prompt: `Choose up to ${want} Basic Pokemon to put onto your Bench`,
        items: pool, min: 0, max: want, confirm: 'Summon',
        onDone: (uids) => go({ trigUids: uids }) });
      return true;
    }
    if (v.v === 'P_FROM_DISCARD') {
      const pool = me0.discard.filter(x => CARD_DB[x.id].kind === 'pokemon');
      if (!pool.length) return false;
      openPicker({ title: p.name, prompt: `Choose up to ${v.n} Pokemon from your discard pile`,
        items: pool, min: 0, max: v.n || 1, confirm: 'Take them back',
        onDone: (uids) => go({ trigUids: uids }) });
      return true;
    }
    if (v.v === 'P_SNIPE') {
      const cands = UI.E.allSlots(1);
      if (!cands.length) return false;
      UI.targeting = { scope: 'oppAny', uids: cands.map(x => x.uid),
        prompt: `${p.name} — choose one of their Pokemon to take ${v.dmg} damage`,
        // "You may" is a DECLINE, not a Cancel, and the bar already knows the
        // difference: Cancel abandons the whole play, No thanks plays the card
        // and skips the optional part. Declining sends the explicit null,
        // because an ABSENT key means "take it" to the engine.
        decline: () => go({ trigTargetUid: null }),
        declineLabel: 'Skip it',
        dispatch: (o) => go({ trigTargetUid: o.targetUid }) };
      render();
      return true;
    }
  }
  return false;
}

// Trainers that choose cards out of hidden zones. Returns true if it handled
// the play (by opening a picker), false to fall through to board targeting.
function pickerFlow(handIdx, inst, card) {
  const me0 = me(), foe0 = foe();
  const send = (opts) => dispatch(0, { t: 'playTrainer', hand: handIdx, opts });
  const others = me0.hand.filter(x => x.uid !== inst.uid);
  const basicsIn = (list) => list.filter(x => CARD_DB[x.id].kind === 'pokemon' && CARD_DB[x.id].stage === 'Basic');

  switch (card.id) {
    case 'base1-71':   // Computer Search
      openPicker({ title: 'Computer Search', prompt: 'Discard 2 cards from your hand',
        items: others, min: 2, max: 2, confirm: 'Search deck',
        onDone: (discardUids) => openPicker({
          title: 'Search your deck', prompt: 'Choose any card to put into your hand',
          items: me0.deck.slice(), min: 1, max: 1, confirm: 'Take card',
          onDone: (p) => send({ discardUids, pickUid: p[0] }) }) });
      return true;

    case 'base1-74':   // Item Finder
      openPicker({ title: 'Item Finder', prompt: 'Discard 2 cards from your hand',
        items: others, min: 2, max: 2, confirm: 'Search discard',
        onDone: (discardUids) => openPicker({
          title: 'Recover a Trainer', prompt: 'Choose a Trainer from your discard pile',
          items: me0.discard.filter(x => CARD_DB[x.id].kind === 'trainer'), min: 1, max: 1,
          onDone: (p) => send({ discardUids, pickUid: p[0] }) }) });
      return true;

    case 'base1-83':   // Maintenance
      openPicker({ title: 'Maintenance', prompt: 'Shuffle 2 cards back into your deck',
        items: others, min: 2, max: 2, confirm: 'Shuffle and draw',
        onDone: (shuffleUids) => send({ shuffleUids }) });
      return true;

    case 'base1-89':   // Revive
      openPicker({ title: 'Revive', prompt: 'Choose a Basic Pokemon from your discard pile',
        items: basicsIn(me0.discard), min: 1, max: 1,
        onDone: (p) => send({ pickUid: p[0] }) });
      return true;

    case 'base1-86':   // Pokemon Flute
      openPicker({ title: 'Pokemon Flute', prompt: "Choose a Basic Pokemon from your opponent's discard pile",
        items: basicsIn(foe0.discard), min: 1, max: 1,
        onDone: (p) => send({ pickUid: p[0] }) });
      return true;

    case 'base1-77':   // Pokemon Trader
      openPicker({ title: 'Pokemon Trader', prompt: 'Choose a Pokemon card from your hand to trade away',
        items: others.filter(x => CARD_DB[x.id].kind === 'pokemon'), min: 1, max: 1, confirm: 'Search deck',
        onDone: (giveP) => openPicker({
          title: 'Pokemon Trader', prompt: 'Choose a Pokemon card from your deck',
          items: me0.deck.filter(x => CARD_DB[x.id].kind === 'pokemon'), min: 1, max: 1,
          onDone: (takeP) => send({ giveUid: giveP[0], takeUid: takeP[0] }) }) });
      return true;

    case 'base1-87':   // Pokedex
      openPicker({ title: 'Pokedex', prompt: 'Rearrange the top cards of your deck',
        items: me0.deck.slice(0, 5), mode: 'order', confirm: 'Set order',
        onDone: (order) => send({ order }) });
      return true;

    case 'base1-76': { // Pokemon Breeder
      const s2 = others.filter(x => CARD_DB[x.id].kind === 'pokemon' && CARD_DB[x.id].stage === 'Stage 2');
      openPicker({ title: 'Pokemon Breeder', prompt: 'Choose a Stage 2 Pokemon to put into play',
        items: s2, min: 1, max: 1, confirm: 'Choose target',
        onDone: (p) => {
          const evoUid = p[0];
          const want = UI.E.basicBehind(CARD_DB[others.find(x => x.uid === evoUid).id].name);
          const targets = UI.E.allSlots(0).filter(sl => topCard(CARD_DB, sl).name === want);
          if (targets.length === 1) return send({ evoUid, targetUid: targets[0].uid });
          UI.targeting = { scope: 'breederTarget', uids: targets.map(t => t.uid),
            prompt: 'Choose which ' + want + ' to evolve',
            dispatch: (uid) => send({ evoUid, targetUid: uid }) };
          render();
        } });
      return true;
    }
  }
  return false;
}

function togglePick(uid) {
  const pk = UI.picker;
  const k = pk.chosen.indexOf(uid);
  if (k >= 0) pk.chosen.splice(k, 1);
  else if (pk.chosen.length < pk.max) pk.chosen.push(uid);
  else if (pk.max === 1) pk.chosen = [uid];
  render();
}

// ------------------------------------------------------------------ setup --
// Opening setup: your half of the mat, before there is a mat.
//
// This was a wrapped grid of miniCards and a two-line text readout saying
// "Active: — none —". Two things were wrong with it beyond the styling. The
// cards used miniCard, which prints attack NAMES in a 150px column and breaks
// them mid-word — "Flamethrower" came out as "Fla/met/hro/wer", which is the
// exact failure handCard() was built to fix and which LAYOUT.md wrongly said
// a dialog had room to avoid. And describing the board in words, next to a
// board, is a worse picture than showing it.
//
// So it renders the thing it is about to become: the ACTIVE and BENCH zones
// from the real mat, in the real slot faces, filled by clicking your real
// hand face. What you arrange here is literally what you will be looking at
// ten seconds later, which is the whole argument for it.
function renderSetup() {
  const ov = el('div', 'overlay');
  const box = el('div', 'sheet setupsheet');

  const head = el('div', 'setuphead');
  const title = el('div', null);
  title.appendChild(el('h2', null, 'Opening setup'));
  title.appendChild(el('p', 'dimtxt', 'Place one Basic Pokemon as your Active, then up to five more on your Bench. Click a placed Pokemon to take it back. Prizes are dealt once both players are ready.'));
  head.appendChild(title);
  const banner = el('div', 'setupdecks');
  banner.appendChild(el('span', 'dimtxt small', `${UI.myDeck} vs ${foeDeckLabel()}`));
  const back = el('button', 'btn ghost', 'Change decks');
  back.onclick = () => backToDeckSelect();
  banner.appendChild(back);
  head.appendChild(banner);
  box.appendChild(head);

  const p = me();
  const takeBack = (where, idx) => () => { UI.E.setupTakeBack(0, where, idx); render(); };

  // The mat's own idiom: silk-screened zone captions, printed outlines for the
  // shapes a card has not been put in yet. `.side.mine` carries the warm
  // gradient, so the strip reads as your half of the cloth rather than as a
  // second dialog inside the first.
  const mat = el('div', 'setupmat side mine');

  const az = el('div', 'activezone');
  az.appendChild(el('div', 'zonelabel', 'ACTIVE'));
  const arow = el('div', 'activerow');
  if (p.active) {
    const s = renderSlot(p.active, 0, 'active', 0);
    s.classList.add('takeback');
    s.onclick = takeBack('active', 0);
    arow.appendChild(s);
  } else {
    // `act` so the empty shape takes the Active's real 318px width — otherwise
    // the whole strip changes width the moment you place something.
    arow.appendChild(el('div', 'slot empty act want', 'CHOOSE A BASIC'));
  }
  az.appendChild(arow);
  mat.appendChild(az);

  const bz = el('div', 'benchzone');
  bz.appendChild(el('div', 'zonelabel', 'BENCH'));
  const brow = el('div', 'bench');
  for (let i = 0; i < UI.E.cfg.benchMax; i++) {
    if (p.bench[i]) {
      // renderBenchTile, not renderSlot — the board's bench is deliberately not
      // a small copy of the Active, and the size gap between them is what makes
      // the Active read as the one that is actually fighting. Reproducing that
      // here is most of why this screen previews the board at all.
      const s = renderBenchTile(p.bench[i], 0, i);
      s.classList.add('takeback');
      s.onclick = takeBack('bench', i);
      brow.appendChild(s);
    } else {
      brow.appendChild(el('div', 'benchcard empty', ''));
    }
  }
  bz.appendChild(brow);
  mat.appendChild(bz);
  box.appendChild(mat);

  // The hand, in the hand's own face. Not fanned: layoutHand() measures the
  // real panel and there is nothing here for it to measure against, and seven
  // cards at 98px fit a dialog without overlapping anyway.
  const handzone = el('div', 'setuphand');
  const cap = el('div', 'zonelabel', 'YOUR HAND');
  cap.appendChild(el('span', 'setupcount', `${p.hand.length} cards`));
  handzone.appendChild(cap);
  const row = el('div', 'hand flat');
  p.hand.forEach((inst, i) => {
    const c = CARD_DB[inst.id];
    const isBasic = c.kind === 'pokemon' && c.stage === 'Basic';
    const card = handCard(c, inst.v ? vflags(inst.v) : null);
    if (!isBasic) card.classList.add('dead');
    else {
      card.classList.add('placeable');
      card.onclick = () => { UI.E.setupPlace(0, i, p.active ? 'bench' : 'active'); render(); };
    }
    // No peekOn() here: the rail sits behind the overlay's 84% scrim, so a
    // peek would render into something the player cannot read.
    row.appendChild(card);
  });
  handzone.appendChild(row);
  box.appendChild(handzone);

  const bar = el('div', 'actionbar');
  const auto = el('button', 'btn ghost', 'Fill automatically');
  auto.onclick = () => { UI.E.setupAuto(0); logOpeningPrizes(); render(); };
  const done = el('button', 'btn end', 'Ready');
  done.onclick = () => { const r = UI.E.setupConfirm(0); if (!r.ok) alert(r.error); logOpeningPrizes(); render(); };
  if (!p.active) done.classList.add('off');
  bar.appendChild(auto); bar.appendChild(done);
  box.appendChild(bar);
  ov.appendChild(box);
  return ov;
}

function renderOver() {
  const s = S();
  const ov = el('div', 'overlay');
  const box = el('div', 'sheet');
  const foe = currentFoe();
  box.appendChild(el('h2', null, s.winner === 'draw' ? 'A draw'
    : s.winner === 0
      ? (foe ? `You beat ${foe.name}` : 'You win')
      : (foe ? `${foe.name} wins` : 'Opponent wins')));
  box.appendChild(el('p', null, s.winReason));
  box.appendChild(el('p', 'dimtxt', `Game lasted ${s.turn} turns. Seed ${UI.E.seed}.`));

  // The reward. Straight from the win into the reveal, with no inventory screen
  // in between — Trevor, 9 Aug: the immediate feedback loop is the point.
  const held = UI.save ? packsTotal(UI.save) : 0;
  const rw = UI.reward;
  if (UI.save && s.winner === 0) {
    if (rw) {
      box.appendChild(el('p', null, `You won ${rw.packs} ${setName(rw.set)} booster pack${rw.packs === 1 ? '' : 's'}`
        + (rw.bonus ? ` — ${rw.packs - rw.bonus}, and ${rw.bonus} more for a first win over a rival.` : '.')));
      // The unlock is the whole point of a boss, so it gets its own line rather
      // than a clause on the end of the pack sentence.
      if (rw.unlocks) {
        const u = el('p', 'unlocknote');
        u.appendChild(el('b', null, `${setName(rw.unlocks)} is open.`));
        u.appendChild(el('span', null, ` Its challengers are on the deck screen, and wins there pay in ${setName(rw.unlocks)} packs.`));
        box.appendChild(u);
      }
    } else {
      box.appendChild(el('p', 'dimtxt', 'Free play pays no packs. Beat a challenger on the ladder for those.'));
    }
  }

  const bar = el('div', 'actionbar');
  if (held > 0) {
    const open = el('button', 'btn end', (rw && held === rw.packs && s.winner === 0)
      ? `Open ${held} packs` : `Open packs (${held})`);
    open.onclick = () => { if (openNextPack()) render(); };
    bar.appendChild(open);
  }
  const again = el('button', held > 0 ? 'btn' : 'btn end', 'New game');
  again.onclick = () => { UI.seedDraft = ''; backToDeckSelect(); };
  const rerun = el('button', 'btn ghost', 'Replay this seed');
  rerun.onclick = () => { UI.seedDraft = String(UI.E.seed); newGame(); };
  // The match log holds what the screen log could not: the opponent's hand, both
  // Prize piles, and every score the AI weighed. Offered here because this is
  // the moment you know whether the game was worth reading back.
  const dl = el('button', 'btn ghost', 'Save match log');
  dl.onclick = downloadMatchLog;
  bar.appendChild(again); bar.appendChild(rerun); bar.appendChild(dl);
  box.appendChild(bar);
  ov.appendChild(box);
  return ov;
}

// ------------------------------------------------------------------- rail --
function renderRail() {
  const rail = el('div', 'rail');
  const tabs = el('div', 'tabs');
  ['card', 'log', 'dev', 'cards'].forEach(t => {
    const b = el('button', 'tab' + (UI.devTab === t ? ' on' : ''), t.toUpperCase());
    b.onclick = () => { UI.devTab = t; render(); };
    tabs.appendChild(b);
  });
  rail.appendChild(tabs);
  const body = UI.devTab === 'card' ? renderPreview()
    : UI.devTab === 'dev' ? renderDev()
    : UI.devTab === 'cards' ? renderCoverage()
    : renderLog();
  // Held so railPeek() can swap it out and back without a full render.
  UI.railEl = rail; UI.railBody = body; UI.peekEl = null;
  rail.appendChild(body);
  return rail;
}

function renderPreview() {
  const box = el('div', 'prevbox');
  const c = UI.inspect && CARD_DB[UI.inspect];
  if (!c) {
    box.appendChild(el('div', 'emptynote', 'Select a card to see its full face.'));
    return box;
  }
  box.appendChild(fullCard(c));
  return box;
}

function renderLog() {
  const box = el('div', 'logbox');
  // Newest first: entries are pushed in at the top and older ones slide down.
  const entries = S().log.slice(-400).reverse();
  entries.forEach(e => {
    const d = el('div', 'logline k-' + e.kind);
    d.appendChild(el('span', 'lt', String(e.t)));
    d.appendChild(el('span', 'lx', e.text));
    box.appendChild(d);
  });
  return box;
}

function renderDev() {
  const box = el('div', 'devbox');

  // --- collection, first, because it is the thing currently being built ---
  if (UI.save) {
    const g0 = el('div', 'grp');
    g0.appendChild(el('div', 'grphead', 'Collection'));

    const packRow = el('div', 'row');
    packRow.appendChild(el('label', null, 'packs'));
    const held = el('span', null, String(packsTotal(UI.save)));
    packRow.appendChild(held);
    const give = el('button', 'btn tiny', '+5');
    // Grinding out wins to test a 1-in-2200 pull is not a reasonable ask, so
    // there is a hatch. It writes to the real save deliberately: a fake save
    // would test a code path nobody ships.
    give.onclick = () => { addPacks(UI.save, homeSet(), 5); persist(); render(); };
    packRow.appendChild(give);
    const openb = el('button', 'btn tiny', 'open');
    openb.onclick = () => { if (openNextPack()) render(); };
    packRow.appendChild(openb);
    g0.appendChild(packRow);

    // The Shadowless A/B. Two defensible answers and no way to pick from a
    // description, so both are built and this switches between them. See
    // PACKS.md — 'shadow' keeps real-world scarcity, 'inverted' makes
    // Shadowless the base state to match our 1st-Edition scans.
    const shRow = el('div', 'row');
    shRow.appendChild(el('label', null, 'shadow'));
    const sm = el('select');
    [['add shadow (Shadowless removes)', 'shadow'], ['inverted (Shadowless is base)', 'inverted']]
      .forEach(([t, v]) => { const o = el('option', null, t); o.value = v; if (UI.shadowMode === v) o.selected = true; sm.appendChild(o); });
    sm.onchange = () => { UI.shadowMode = sm.value; render(); };
    shRow.appendChild(sm);
    g0.appendChild(shRow);

    const stRow = el('div', 'row');
    stRow.appendChild(el('label', null, 'save'));
    stRow.appendChild(el('span', null, `${UI.saveStatus} · ${UI.save.stats.wins}W-${UI.save.stats.losses}L · ${UI.save.stats.packsOpened} opened`));
    g0.appendChild(stRow);
    box.appendChild(g0);
  }

  const g1 = el('div', 'grp');
  g1.appendChild(el('div', 'grphead', 'New game'));
  const seedRow = el('div', 'row');
  seedRow.appendChild(el('label', null, 'seed'));
  const si = el('input'); si.type = 'text'; si.placeholder = 'random'; si.value = UI.seedDraft;
  si.oninput = () => { UI.seedDraft = si.value.trim(); };
  seedRow.appendChild(si);
  g1.appendChild(seedRow);

  const przRow = el('div', 'row');
  przRow.appendChild(el('label', null, 'prizes'));
  const ps = el('select');
  [6, 4, 3, 2, 1].forEach(n => { const o = el('option', null, String(n)); o.value = n; if (UI.cfgDraft.prizeCount === n) o.selected = true; ps.appendChild(o); });
  ps.onchange = () => { UI.cfgDraft.prizeCount = parseInt(ps.value, 10); };
  przRow.appendChild(ps);
  g1.appendChild(przRow);

  const mkChk = (label, key) => {
    const r = el('div', 'row chk');
    const c = el('input'); c.type = 'checkbox'; c.checked = UI.cfgDraft[key];
    c.onchange = () => { UI.cfgDraft[key] = c.checked; };
    r.appendChild(c); r.appendChild(el('label', null, label));
    return r;
  };
  const mkDeckRow = (label, key) => {
    const r = el('div', 'row');
    r.appendChild(el('label', null, label));
    const sel = el('select');
    DECK_NAMES.forEach(n => { const o = el('option', null, n); o.value = n; if (UI[key] === n) o.selected = true; sel.appendChild(o); });
    sel.onchange = () => { UI[key] = sel.value; render(); };
    r.appendChild(sel);
    return r;
  };
  g1.appendChild(mkDeckRow('your deck', 'myDeck'));
  g1.appendChild(mkDeckRow('opponent', 'foeDeck'));

  g1.appendChild(mkChk('first player may attack on turn 1', 'firstPlayerMayAttack'));
  const go = el('button', 'btn', 'Start new game');
  go.onclick = () => startMatch();
  const back2 = el('button', 'btn ghost', 'Deck select');
  back2.onclick = () => backToDeckSelect();
  g1.appendChild(back2);
  g1.appendChild(go);
  box.appendChild(g1);

  const g2 = el('div', 'grp');
  g2.appendChild(el('div', 'grphead', 'Live controls'));
  const coinRow = el('div', 'row');
  coinRow.appendChild(el('label', null, 'coin'));
  const cs = el('select');
  [['auto', ''], ['always heads', 'H'], ['always tails', 'T']].forEach(([t, v]) => {
    const o = el('option', null, t); o.value = v; if ((UI.E.dev.forceFlip || '') === v) o.selected = true; cs.appendChild(o);
  });
  cs.onchange = () => { UI.E.dev.forceFlip = cs.value || null; };
  coinRow.appendChild(cs); g2.appendChild(coinRow);

  const aiRow = el('div', 'row');
  aiRow.appendChild(el('label', null, 'opponent'));
  const as = el('select');
  [['expert (plays to win)', 'expert'], ['novice (makes mistakes)', 'novice'],
   ['damage-only bot', 'greedy'], ['random (rules fuzzer)', 'random']].forEach(([t, v]) => {
    const o = el('option', null, t); o.value = v; if (UI.aiMode === v) o.selected = true; as.appendChild(o);
  });
  as.onchange = () => { UI.aiMode = as.value; };
  aiRow.appendChild(as); g2.appendChild(aiRow);

  const spRow = el('div', 'row');
  spRow.appendChild(el('label', null, 'pace'));
  const sp = el('input'); sp.type = 'range'; sp.min = 200; sp.max = 2500; sp.step = 100; sp.value = UI.aiDelay;
  sp.oninput = () => { UI.aiDelay = parseInt(sp.value, 10); render(); };
  spRow.appendChild(sp);
  spRow.appendChild(el('span', 'dimtxt small', (UI.aiDelay / 1000).toFixed(1) + 's'));
  g2.appendChild(spRow);

  const fpRow = el('div', 'row');
  fpRow.appendChild(el('label', null, 'coin pause'));
  const fp = el('input'); fp.type = 'range'; fp.min = 0; fp.max = 4000; fp.step = 250; fp.value = UI.flipDelay;
  fp.oninput = () => { UI.flipDelay = parseInt(fp.value, 10); render(); };
  fpRow.appendChild(fp);
  fpRow.appendChild(el('span', 'dimtxt small', UI.flipDelay < 250 ? 'off' : (UI.flipDelay / 1000).toFixed(2) + 's'));
  g2.appendChild(fpRow);
  box.appendChild(g2);

  // What the page actually got, which is never what the screen says. Display
  // scaling and browser chrome between them can turn a "1920x1080 laptop" into
  // a 1280x600 page, and guessing at that number instead of reading it is how
  // the first sizing pass got the board wrong.
  const gvp = el('div', 'grp');
  gvp.appendChild(el('div', 'grphead', 'Viewport'));
  const vp = el('div', 'dump');
  // Held, not filled: renderDev() runs while the rail is still being BUILT, so
  // the board column it wants to measure is not in the document yet and every
  // size reads 0. render() calls writeViewportDump() again once the layout has
  // settled, which is the only moment these numbers mean anything.
  UI.vpDumpEl = vp;
  writeViewportDump();
  gvp.appendChild(vp);
  box.appendChild(gvp);

  const g3 = el('div', 'grp');
  g3.appendChild(el('div', 'grphead', 'State'));
  const s = UI.E.state;
  const dump = {
    turn: s.turn, phase: s.phase, activePlayer: s.active,
    pendingPromote: s.pendingPromote, promoteQueue: s.promoteQueue, pendingSwitch: s.pendingSwitch,
    you: playerDump(s.players[0]), opponent: playerDump(s.players[1]),
  };
  const pre = el('pre', 'dump', JSON.stringify(dump, null, 1));
  g3.appendChild(pre);
  box.appendChild(g3);
  return box;
}

// What the page actually got, which is never what the screen says: display
// scaling and browser chrome between them can turn a "1920x1080 laptop" into a
// 1280x600 page, and guessing at that number instead of reading it is how the
// first sizing pass got the board wrong.
//
// Everything below the rule is what the FITTER then did with it. Every layout
// question asked of this board has come down to "what did the mat actually
// get", and hand-instrumenting that each time is how a session loses an hour.
function writeViewportDump() {
  const vp = UI.vpDumpEl;
  if (!vp) return;
  const num = (x) => (typeof x === 'number' ? Math.round(x) : 0);
  const dpr = (typeof devicePixelRatio === 'number') ? devicePixelRatio : 1;
  const cw = (typeof innerWidth === 'number') ? innerWidth : 0;
  const ch = (typeof innerHeight === 'number') ? innerHeight : 0;
  const col = UI.boardEl, table = UI.tableEl, panel = UI.handPanelEl;

  // How much cloth the mat has beyond what its contents need. This used to
  // report the desk showing between the mat and the hand, computed from the
  // hand panel's offsetTop — and it read 7px while ninety were plainly on
  // screen, because an auto margin inside a `zoom`ed flex column shows up in
  // NEITHER offsetTop nor getBoundingClientRect(). There is no auto margin in
  // this column any more, so there is nothing to measure: spare height goes to
  // the mat, and this says how much of it did.
  const spare = (table && typeof table.clientHeight === 'number')
    ? num(table.clientHeight) - num(table.scrollHeight) : 0;

  vp.textContent =
    `page        ${cw} x ${ch} CSS px\n` +
    `device      ${Math.round(cw * dpr)} x ${Math.round(ch * dpr)} device px\n` +
    `scaling     ${dpr}x  (OS display scale + browser zoom)\n` +
    `----------------------------------------\n` +
    `mat fit     ${UI.fitZoom < 0.999 ? UI.fitZoom.toFixed(3) + 'x — scaled DOWN to fit'
      : UI.fitZoom > 1.001 ? UI.fitZoom.toFixed(3) + 'x — grown into spare room'
      : '1.000x — fits unscaled'}\n` +
    `layout      ${UI.wideLayout ? 'wide — field beside the Active' : 'stacked — field under the Active'}\n` +
    `board col   ${num(col && col.clientWidth)} x ${num(col && col.clientHeight)} layout px\n` +
    `mat cloth   ${num(table && table.offsetWidth)} wide · wants ${num(table && table.scrollHeight)} tall, got ${num(table && table.clientHeight)}\n` +
    `hand panel  ${num(panel && panel.offsetWidth)} wide\n` +
    `spare cloth ${spare > 1 ? spare + ' px of mat beyond its contents' : 'none — the mat is exactly full'}`;
}

function playerDump(p) {
  const sl = (x) => x ? {
    name: topCard(CARD_DB, x).name, dmg: x.dmg,
    energy: x.energy.map(e => CARD_DB[e.id].provides).join(''),
    status: Object.keys(x.status).filter(k => x.status[k]),
    effects: x.effects.map(e => e.kind),
  } : null;
  return {
    hand: p.hand.length, deck: p.deck.length, discard: p.discard.length, prizes: p.prizes.length,
    energyAttachedThisTurn: p.energyAttached, retreatedThisTurn: p.retreated,
    active: sl(p.active), bench: p.bench.map(sl),
  };
}

function renderCoverage() {
  const box = el('div', 'covbox');
  const rep = UI.E.coverageReport();
  const head = el('div', 'grphead', `Implemented ${rep.done} / ${rep.total} cards in play`);
  box.appendChild(head);
  box.appendChild(el('div', 'dimtxt small', 'Every card in both decks has a working effect script. Cards without one are rejected by the deck validator, so an unimplemented card can never quietly do nothing.'));
  const list = el('div', 'covlist');
  rep.rows.sort((a, b) => (a.done - b.done) || a.name.localeCompare(b.name));
  rep.rows.forEach(r => {
    const d = el('div', 'covrow');
    d.appendChild(el('span', 'dot ' + (r.done ? 'ok' : 'no')));
    d.appendChild(el('span', 'cn', r.name));
    d.appendChild(el('span', 'ci', r.id));
    list.appendChild(d);
  });
  box.appendChild(list);

  const v = el('div', 'grp');
  v.appendChild(el('div', 'grphead', 'Deck validation'));
  ['Brushfire', 'Overgrowth'].forEach(k => {
    const res = UI.E.validateDeck(DECKS[k]);
    const d = el('div', 'covrow');
    d.appendChild(el('span', 'dot ' + (res.ok ? 'ok' : 'no')));
    d.appendChild(el('span', 'cn', k));
    d.appendChild(el('span', 'ci', `${res.total} cards · ${res.basics} basics`));
    v.appendChild(d);
    res.errors.forEach(e => v.appendChild(el('div', 'verr', e)));
    res.warnings.forEach(e => v.appendChild(el('div', 'vwarn', e)));
  });
  box.appendChild(v);
  return box;
}

// --------------------------------------------------------------- AI driver -
function maybeRunAI() {
  clearTimeout(UI.aiTimer);
  if (presenting()) return;
  const s = S();
  if (s.phase !== 'main') return;
  if (s.pendingSwitch === 0 || s.pendingPromote === 0) return;   // waiting on the player
  const aiTurn = (s.pendingSwitch === 1) || (s.pendingPromote === 1)
    || (s.pendingSwitch === null && s.pendingPromote === null && s.active === 1);
  if (!aiTurn) return;
  UI.aiTimer = setTimeout(() => {
    if (UI.E._ai) UI.E._ai.explain = true;   // survives the AI being rebuilt on a tier change
    drainEngineLog();
    // The tier a ladder challenger plays at is theirs, not the control's.
    const a = UI.E.aiChoose(1, UI.foeTier || UI.aiMode);
    logAIChoice(a);
    if (a) dispatch(1, a); else render();
  }, Math.max(30, UI.aiDelay));
}

window.addEventListener('DOMContentLoaded', () => { bootSave(); render(); });

// The mat is fitted to the window, so it has to be refitted when the window
// changes. Debounced — a drag-resize fires this continuously.
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (!presenting()) render(); }, 120);
});

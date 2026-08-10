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
  cfgDraft: { prizeCount: 6, firstPlayerMayAttack: true, noEvolveFirstTurn: true },
  seedDraft: '',
  screen: 'decks',      // 'newsave' -> 'decks' -> 'setup' -> board; 'packs' from either end

  // --- Job 5 ---
  save: null,
  saveStatus: '',       // 'ok' | 'empty' | 'nostore' | 'corrupt' — see collection.js
  saveNote: '',         // a one-line problem to show the player, or ''
  pack: null,           // the pack being opened; see openNextPack()
  detail: null,         // {card, flags} — the pull the detail overlay is showing
  // The Shadowless A/B, switched from the DEV tab. 'shadow' draws the art
  // window with a drop shadow and Shadowless removes it (correct real-world
  // scarcity). 'inverted' makes Shadowless the base state, matching our
  // 1st-Edition scans exactly, and the rare pull adds the shadow instead.
  // Undecided on purpose — this exists so the two can be looked at rather than
  // argued about. See PACKS.md.
  shadowMode: 'shadow',
};

const PACKS_PER_WIN = 2;      // PACKS.md's yardstick, and now the real rule
const HOME_SET = 'base1';     // the only set generated today; Job 6 widens this

const SANDBOX = 'Sandbox';
const DECK_NAMES = Object.keys(DECKS).concat([SANDBOX]);

// The Sandbox deck is generated fresh each game from every implemented card,
// so newly added cards are immediately playable without waiting for the
// deckbuilder. It deliberately IGNORES the collection — agreed with Trevor,
// 9 Aug: it is the only way to test a newly implemented card without grinding
// for it, so it is a dev affordance rather than a deck you own.
function resolveDeck(name, seed) {
  if (name === SANDBOX) {
    const pool = Object.keys(CARD_DB);
    const d = generateDeck(CARD_DB, pool, mulberry32(seed), { name: SANDBOX });
    return d || DECKS[Object.keys(DECKS)[0]];
  }
  // A deck you built or were given comes from the save; the theme decks remain
  // as definitions so the OPPONENT can still field any of them.
  const mine = UI.save && UI.save.decks.find(d => d.name === name);
  return mine || DECKS[name];
}

// Decks YOU may field: only what you own. The opponent may field anything —
// their deck is the game's, not yours, so it has never been a collection
// question. This is the first place ownership actually bites.
const myDeckNames = () => (UI.save ? UI.save.decks.map(d => d.name) : []).concat([SANDBOX]);

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
  // The starter arrives as a real, editable deck rather than a special case, so
  // the deck builder will have nothing to learn about it later.
  UI.save.decks.push({ name: deckName, list: DECKS[deckName].list.map(e => [e[0], e[1]]) });
  UI.myDeck = deckName;
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
  UI.pres = null; UI.view = null; UI.sel = null; UI.targeting = null; UI.picker = null; UI.powerMode = null;
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
  UI.E.newGame(resolveDeck(UI.myDeck, seed), resolveDeck(UI.foeDeck, seed ^ 0x5f5f), ['You', 'Opponent']);
  UI.E.setupAuto(1);                     // opponent sets itself up
  UI.sel = null; UI.targeting = null; UI.picker = null; UI.powerMode = null;
  UI.awarded = false;                    // this game has not paid out yet
  render();
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
  for (const uid in b) {
    if (!a[uid]) UI.fxMark('ko' + b[uid].pi, 900);
  }
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
  UI.E.act(pi, action);
  UI.sel = null; UI.targeting = null;
  diffForFx(before, UI.E.state);
  const fresh = UI.E.state.log.slice(mark);
  if (!fresh.some(e => e.kind === 'flip') || UI.flipDelay < 250) { render(); return; }
  UI.view = before;
  UI.pres = { queue: fresh.slice(), banner: null };
  stepPresentation();
}

function stepPresentation() {
  const p = UI.pres;
  if (!p) return;
  while (p.queue.length && p.queue[0].kind !== 'flip') UI.view.log.push(p.queue.shift());
  if (!p.queue.length) { UI.pres = null; UI.view = null; render(); return; }

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

// Compact face: hand, setup, search lists.
function miniCard(card) {
  const d = el('div', 'pcard mini k-' + card.kind);
  d.style.borderLeftColor = cardAccent(card);
  const head = el('div', 'pc-head');
  head.appendChild(el('div', 'pc-name', card.name));
  if (card.kind === 'pokemon') head.appendChild(el('div', 'pc-hp', card.hp + ' HP'));
  d.appendChild(head);

  const body = el('div', 'pc-body');
  body.appendChild(sigilBox(card, 'sm'));
  const info = el('div', 'pc-info');
  if (card.kind === 'pokemon') {
    info.appendChild(typeTag(card.type));
    info.appendChild(el('div', 'pc-line', card.stage + (card.evolvesFrom ? ' · from ' + card.evolvesFrom : '')));
    (card.attacks || []).forEach(a => {
      const r = el('div', 'pc-atkline');
      r.appendChild(costRow(a.cost));
      r.appendChild(el('span', 'pc-atkname', a.name));
      r.appendChild(el('span', 'pc-atkdmg', a.dmg || ''));
      info.appendChild(r);
    });
  } else if (card.kind === 'energy') {
    info.appendChild(typeTag(card.provides));
    info.appendChild(el('div', 'pc-line', card.cls + ' Energy'));
  } else {
    info.appendChild(el('span', 'typetag trainer', card.sub));
    info.appendChild(el('div', 'pc-line clamp', card.text));
  }
  body.appendChild(info);
  d.appendChild(body);
  return d;
}

// The hand face. Deliberately NOT miniCard: a card in hand is a thing you are
// deciding whether to play, and what you decide on is name, kind, and what the
// attacks cost against what they do. Attack NAMES and rules text were the whole
// of the problem — "Poisonpowder" cannot wrap inside a 95px column, so it broke
// mid-word into three lines, and a clamped Trainer paragraph got cut off mid-
// sentence anyway, which is worse than not showing it. The rail shows the real
// printed card on hover; that is where the words live now.
//
// Dropping the words also buys the width back, which is the other half of the
// job: a narrower card is a hand that fits more cards before it has to overlap.
function handCard(card) {
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
function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  if (UI.screen === 'newsave') { root.appendChild(renderNewSave()); return; }
  if (UI.screen === 'packs' && UI.pack) {
    root.appendChild(renderPackScreen());
    if (UI.detail) root.appendChild(renderPullDetail());
    return;
  }
  if (UI.screen === 'decks') { root.appendChild(renderDeckSelect()); return; }
  if (!UI.E) { root.appendChild(el('div', 'empty', 'No game loaded.')); return; }
  settleResult();      // pays out a finished game exactly once

  UI.handEl = null; UI.handPanelEl = null; UI.vpDumpEl = null;
  const wrap = el('div', 'wrap');
  wrap.appendChild(renderBoardColumn());
  wrap.appendChild(renderRail());
  root.appendChild(wrap);

  if (UI.picker) root.appendChild(renderPicker());
  if (S().phase === 'setup') root.appendChild(renderSetup());
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

function renderCentreLine() {
  const m = el('div', 'centreline');
  // The toss outranks both of the others: it is the only one of the three that
  // the game is actually WAITING on, and a Knock Out that happened in the same
  // action still gets its banner once the coin has landed and play resumes.
  const b = UI.pres && UI.pres.banner;
  if (b) { m.classList.add('tossing'); m.appendChild(renderCoinToss(b)); return m; }
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
  head.appendChild(el('div', 'sidedeck', isFoe ? UI.foeDeck : UI.myDeck));
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
    default: return false;
  }
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
  en.appendChild(el('span', 'retreatnote', 'retreat ' + c.retreat));
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
      } else b.onclick = () => doAttack(i);
      atks.appendChild(b);
    });
    d.appendChild(atks);
  }

  d.onclick = slotOnClick(slot, pi, where, idx, can, c);
  return peekOn(d, c.id);
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
  slot.energy.forEach(e => {
    const p = el('i', 'pip ink');
    // asEnergy is set on the card instance by Buzzap, which turns an Electrode
    // into an Energy card; the card definition still says Pokemon.
    const prov = e.asEnergy || CARD_DB[e.id].provides;
    p.style.background = ENERGY_INK[(prov || 'C')[0]] || ENERGY_INK.C;
    p.title = CARD_DB[e.id].name + (e.asEnergy ? ` (Buzzap: ${e.asEnergy})` : '');
    en.appendChild(p);
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
    const card = handCard(c);
    if (UI.sel && UI.sel.idx === i) card.classList.add('sel');
    if (!acts.length) card.classList.add('dead');
    if (UI.inspect === c.id) card.classList.add('inspected');
    if (UI.targeting && UI.targeting.scope === 'handDiscard') card.classList.add('targetable');
    card.onclick = () => {
      if (presenting()) return;
      if (UI.targeting && UI.targeting.scope === 'handDiscard') { UI.targeting.dispatch({ discardUid: me().hand[i].uid }); return; }
      inspectCard(c.id);
      if (acts.length) {
        UI.sel = (UI.sel && UI.sel.idx === i) ? null : { idx: i };
        UI.targeting = null;
      }
      render();
    };
    row.appendChild(peekOn(card, c.id));
  });
  if (!me().hand.length) row.appendChild(el('div', 'empty', 'hand empty'));
  UI.handEl = row; UI.handPanelEl = h;
  h.appendChild(row);
  return h;
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

  if (UI.targeting) {
    const cancel = el('button', 'btn ghost', 'Cancel');
    cancel.onclick = () => { UI.targeting = null; UI.sel = null; render(); };
    bar.appendChild(el('div', 'barmsg', UI.targeting.prompt));
    bar.appendChild(cancel);
    return bar;
  }

  if (s.pendingSwitch === 0) {
    bar.appendChild(el('div', 'barmsg', 'Whirlwind! Choose one of your Benched Pokemon to send up.'));
    me().bench.forEach((b, i) => {
      const btn = el('button', 'btn', 'Send up ' + topCard(CARD_DB, b).name);
      btn.onclick = () => dispatch(0, { t: 'switchIn', bench: i });
      bar.appendChild(btn);
    });
    return bar;
  }

  if (s.pendingPromote === 0) {
    bar.appendChild(el('div', 'barmsg', 'Your Active Pokemon was Knocked Out. Choose a replacement from your Bench.'));
    me().bench.forEach((b, i) => {
      const btn = el('button', 'btn', 'Promote ' + topCard(CARD_DB, b).name);
      btn.onclick = () => dispatch(0, { t: 'promote', bench: i });
      bar.appendChild(btn);
    });
    return bar;
  }

  if (s.phase !== 'main' || s.active !== 0) { bar.appendChild(el('div', 'barmsg dimtxt', 'Waiting…')); return bar; }

  if (UI.sel) {
    const i = UI.sel.idx;
    const inst = me().hand[i];
    if (!inst) { UI.sel = null; return bar; }
    const c = CARD_DB[inst.id];
    const acts = myLegal().filter(a => a.hand === i);
    bar.appendChild(el('div', 'barmsg', c.name));

    const bench = acts.find(a => a.t === 'playBasic');
    if (bench) { const b = el('button', 'btn', 'Put on Bench'); b.onclick = () => dispatch(0, bench); bar.appendChild(b); }

    const evos = acts.filter(a => a.t === 'evolve');
    if (evos.length) {
      const b = el('button', 'btn', 'Evolve…');
      b.onclick = () => {
        UI.targeting = { scope: 'evolveOn', uids: evos.map(a => a.target), prompt: `Choose the Pokemon to evolve into ${c.name}`,
          dispatch: (uid) => dispatch(0, evos.find(a => a.target === uid)) };
        render();
      };
      bar.appendChild(b);
    }

    const atts = acts.filter(a => a.t === 'attachEnergy');
    if (atts.length) {
      const b = el('button', 'btn', 'Attach to…');
      b.onclick = () => {
        UI.targeting = { scope: 'attachTo', uids: atts.map(a => a.target), prompt: `Choose a Pokemon to attach ${c.name} to`,
          dispatch: (uid) => dispatch(0, atts.find(a => a.target === uid)) };
        render();
      };
      bar.appendChild(b);
    }

    const tr = acts.find(a => a.t === 'playTrainer');
    if (tr) {
      const need = TRAINER_FLOW[c.id];
      const needsChoice = !!need || PICKER_TRAINERS.indexOf(c.id) >= 0;
      const b = el('button', 'btn', needsChoice ? 'Play…' : 'Play');
      b.onclick = () => {
        if (pickerFlow(i, inst, c)) return;
        if (!need) { dispatch(0, tr); return; }
        if (need.then) {
          UI.targeting = { scope: need.scope, prompt: need.prompt, dispatch: (first) => {
            UI.targeting = { scope: need.then.scope, prompt: need.then.prompt,
              dispatch: (second) => dispatch(0, { t: 'playTrainer', hand: i,
                opts: { selfUid: first.targetUid, targetUid: second.targetUid } }) };
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
          dispatch: (opts) => dispatch(0, { t: 'playTrainer', hand: i, opts }) };
        render();
      };
      bar.appendChild(b);
    }

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
      if (POWER_PROMPT[a.kind]) { UI.powerMode = { uid: a.uid, kind: a.kind, name: def.name, from: null, to: null }; render(); }
      else dispatch(0, a);
    };
    bar.appendChild(b);
  });

  const retreats = myLegal().filter(a => a.t === 'retreat');
  if (retreats.length) {
    const cost = topCard(CARD_DB, me().active).retreat;
    const b = el('button', 'btn', `Retreat (discard ${cost} Energy)…`);
    b.onclick = () => {
      UI.targeting = { scope: 'ownBench', prompt: 'Choose a Benched Pokemon to bring up',
        dispatch: (opts) => dispatch(0, { t: 'retreat', bench: opts.bench }) };
      render();
    };
    bar.appendChild(b);
  } else if (me().active && me().bench.length && !me().retreated) {
    const c = topCard(CARD_DB, me().active);
    const why = me().active.status.asleep ? 'Asleep — cannot retreat'
      : me().active.status.paralyzed ? 'Paralyzed — cannot retreat'
      : `Needs ${c.retreat} Energy to retreat`;
    bar.appendChild(el('div', 'barmsg dimtxt', why));
  }

  const end = el('button', 'btn end', 'End turn');
  end.onclick = () => dispatch(0, { t: 'pass' });
  bar.appendChild(end);
  return bar;
}

function resolveTarget(slot, pi, where, idx) {
  const t = UI.targeting; if (!t) return;
  if (t.scope === 'attachTo' || t.scope === 'evolveOn' || t.scope === 'breederTarget') return t.dispatch(slot.uid);
  if (t.scope === 'ownBench' || t.scope === 'oppBench') return t.dispatch({ bench: idx });
  if (t.scope === 'oppEnergy' || t.scope === 'ownEnergy') return t.dispatch({ targetUid: slot.uid, energyIdx: 0 });
  return t.dispatch({ targetUid: slot.uid });
}

function doAttack(i) {
  const c = topCard(CARD_DB, me().active);
  const script = (EFFECTS[c.id] && EFFECTS[c.id].a && EFFECTS[c.id].a[i]) || [];
  const needsBench = script.some(v => v.v === 'SWITCH_DEFENDER_CHOOSE') && foe().bench.length > 0;
  if (needsBench) {
    UI.targeting = { scope: 'oppBench', prompt: 'Choose which Benched Pokemon to drag into the Active spot',
      dispatch: (opts) => dispatch(0, { t: 'attack', idx: i, opts }) };
    render(); return;
  }
  dispatch(0, { t: 'attack', idx: i });
}

// ------------------------------------------------------- deck select ------
// A deck by name, wherever it lives: your save first, then the theme decks.
// Both summary and hero go through this so a deck you BUILT renders on the
// select screen exactly like a theme deck does.
function deckByName(name) {
  const mine = UI.save && UI.save.decks.find(d => d.name === name);
  return mine || DECKS[name] || null;
}

function deckSummary(name) {
  const d = name === SANDBOX
    ? generateDeck(CARD_DB, Object.keys(CARD_DB), mulberry32(1), { name: SANDBOX })
    : deckByName(name);
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
function deckHero(name) {
  const d = deckByName(name);
  if (!d) return null;
  const rank = { 'Basic': 0, 'Stage 1': 1, 'Stage 2': 2 };
  let best = null, bestScore = -1;
  for (const [, id] of d.list) {
    const c = CARD_DB[id];
    if (!c || c.kind !== 'pokemon') continue;
    const score = (rank[c.stage] || 0) * 1000 + (c.hp || 0);
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return best;
}

// ======================================================================
// JOB 5 — VARIANTS, PACKS, AND THE COLLECTION ON SCREEN
// ======================================================================

// Which treatments can be drawn ON TOP of a bitmap. The rest (1st Edition,
// Shadowless) are a stamp already present and a shadow already absent in every
// scan we own, so over a scan they are a ribbon and nothing more.
const ADDITIVE_FX = { sh: 1, rh: 1, mp1: 1, mp2: 1, mp3: 1 };
const additiveClasses = flags => flags.filter(f => ADDITIVE_FX[f]).map(f => 'v-' + f).join(' ');

// The real printed card, with additive cosmetics laid over it.
function pullFace(card, flags) {
  const cls = additiveClasses(flags);
  const host = el('div', 'vfx' + (cls ? ' ' + cls : ''));
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

// Our own drawing of the card, carrying everything a scan cannot.
function sigilCard(card, flags) {
  const d = fullCard(card, { noFace: true });
  d.classList.add('sigilcard', 'sm-' + UI.shadowMode);
  if (flags.indexOf('sl') >= 0) d.classList.add('is-sl');
  if (flags.indexOf('fe') >= 0) {
    // Into the art window, where the real stamp sits — not floated onto the
    // card body, which is where it landed first and read as a stray badge.
    //
    // Hand-rolled loop, not `.filter` and not `querySelector`. A real browser
    // gives an HTMLCollection here, which has no array methods; the smoke DOM
    // stub gives a plain array, which has all of them. `.filter` therefore
    // PASSED every test and threw in Chrome — the detail overlay silently
    // vanished while the pack screen behind it rendered fine. Index with a
    // plain loop and both are happy.
    let art = null;
    for (let i = 0; i < d.children.length; i++) {
      const c = d.children[i];
      if (c && (c.className || '').indexOf('sigil') === 0) { art = c; break; }
    }
    (art || d).appendChild(el('div', 'festamp', '1'));
  }
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
function openNextPack() {
  if (!UI.save || !takePack(UI.save, HOME_SET)) return false;
  const seed = (Math.random() * 2147483647) | 0;
  const pk = openPack(CARD_DB, HOME_SET, mulberry32(seed));
  // The Rare comes out of packs.js first; it is shown LAST, because a reveal
  // that opens on the best card has nowhere to go.
  const order = pk.cards.slice(1).concat([pk.cards[0]]);
  UI.pack = {
    set: pk.set, firstEd: pk.firstEd, seed, order,
    revealed: order.map(() => false),
    // Computed BEFORE granting, or every card is already owned by the time we ask.
    isNew: order.map(c => !isOwned(UI.save, c.id)),
  };
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
  if (s.winner === 0) { UI.save.stats.wins++; addPacks(UI.save, HOME_SET, PACKS_PER_WIN); }
  else UI.save.stats.losses++;
  persist();
}

// ------------------------------------------------------------- the screens -
function renderNewSave() {
  const ov = el('div', 'deckscreen');
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
  Object.keys(DECKS).forEach(n => {
    const s = deckSummary(n);
    const c = el('div', 'deckcard');
    const art = el('div', 'dart');
    const hero = deckHero(n);
    if (hero) { const img = cardFaceImage(CARD_DB[hero], null); if (img) art.appendChild(img); }
    c.appendChild(art);
    c.appendChild(el('div', 'dname', n));
    const pips = el('div', 'dtypes');
    Object.keys(s.types).sort((a, b) => s.types[b] - s.types[a]).forEach(t => {
      const p = el('i', 'pip'); p.style.background = ENERGY_COLOR[t]; p.title = ENERGY_NAME[t];
      pips.appendChild(p);
    });
    c.appendChild(pips);
    c.appendChild(el('div', 'dstat', `${s.k.pokemon} / ${s.k.trainer} / ${s.k.energy}`));
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
  const box = el('div', 'packbox');
  const anyRevealed = p.revealed.some(Boolean);
  const allRevealed = p.revealed.every(Boolean);

  const head = el('div', 'packhead');
  head.appendChild(el('h2', null, 'Base Set booster'));
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
  const left = packsHeld(UI.save, HOME_SET);
  if (left > 0) {
    const more = el('button', 'btn end', `Open another (${left})`);
    more.onclick = () => { openNextPack(); render(); };
    bar.appendChild(more);
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

function renderDeckSelect() {
  const ov = el('div', 'deckscreen');
  const box = el('div', 'deckbox');

  // The game has never said its own name anywhere. It does now, and the note
  // says what the name means — it is a print-run term, not a mood.
  const title = el('div', 'titleblock');
  title.appendChild(el('h1', 'gametitle', 'SHADOWLESS'));
  title.appendChild(el('div', 'gamesub', 'The Wizards of the Coast era, played to the letter of the original rules.'));
  title.appendChild(el('div', 'gamenote',
    `Named for the early Base Set sheets, printed before the drop shadow. ${Object.keys(CARD_DB).length} cards implemented.`));
  box.appendChild(title);

  // What you own, and what is waiting to be opened. This is the first thing on
  // the screen after the title because in a collection game it is the score.
  if (UI.save) {
    const st = collectionStats(UI.save, CARD_DB);
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
    const held = packsHeld(UI.save, HOME_SET);
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
  const mkGrid = (key, heading) => {
    const sec = el('div', 'deckgrp');
    sec.appendChild(el('div', 'grphead', heading));
    const grid = el('div', 'deckgrid');
    (key === 'myDeck' && UI.save ? myDeckNames() : DECK_NAMES).forEach(n => {
      const s = deckSummary(n);
      const isSandbox = n === SANDBOX;
      const c = el('div', 'deckcard' + (UI[key] === n ? ' on' : ''));

      const art = el('div', 'dart');
      const hero = isSandbox ? null : deckHero(n);
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
    sec.appendChild(grid);
    return sec;
  };

  box.appendChild(mkGrid('myDeck', 'YOUR DECK'));
  box.appendChild(mkGrid('foeDeck', 'OPPONENT'));

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
  const go = el('button', 'btn end big', `Play ${UI.myDeck} vs ${UI.foeDeck}`);
  go.onclick = () => startMatch();
  bar.appendChild(go);
  box.appendChild(bar);

  ov.appendChild(box);
  return ov;
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
    const row = el('div', 'hand');
    pk.items.forEach(it => {
      const c = CARD_DB[it.id];
      const card = miniCard(c);
      if (pk.chosen.includes(it.uid)) card.classList.add('sel');
      card.onclick = () => togglePick(it.uid);
      row.appendChild(card);
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
function renderSetup() {
  const ov = el('div', 'overlay');
  const box = el('div', 'sheet');
  box.appendChild(el('h2', null, 'Opening setup'));
  box.appendChild(el('p', 'dimtxt', 'Place one Basic Pokemon as your Active, then up to five more on your Bench. Prizes are dealt once both players are ready.'));

  const banner = el('div', 'row');
  banner.appendChild(el('span', 'dimtxt small', `${UI.myDeck} vs ${UI.foeDeck}`));
  const back = el('button', 'btn ghost', 'Change decks');
  back.onclick = () => backToDeckSelect();
  banner.appendChild(back);
  box.appendChild(banner);

  const p = me();
  const cur = el('div', 'setupcur');
  cur.appendChild(el('div', 'lbl', 'Active: ' + (p.active ? topCard(CARD_DB, p.active).name : '— none —')));
  cur.appendChild(el('div', 'lbl', 'Bench: ' + (p.bench.length ? p.bench.map(b => topCard(CARD_DB, b).name).join(', ') : '— empty —')));
  box.appendChild(cur);

  const row = el('div', 'hand');
  p.hand.forEach((inst, i) => {
    const c = CARD_DB[inst.id];
    const isBasic = c.kind === 'pokemon' && c.stage === 'Basic';
    const card = miniCard(c);
    if (!isBasic) card.classList.add('dead');
    if (isBasic) card.onclick = () => { UI.E.setupPlace(0, i, p.active ? 'bench' : 'active'); render(); };
    row.appendChild(card);
  });
  box.appendChild(row);

  const bar = el('div', 'actionbar');
  const auto = el('button', 'btn ghost', 'Fill automatically');
  auto.onclick = () => { UI.E.setupAuto(0); render(); };
  const done = el('button', 'btn end', 'Ready');
  done.onclick = () => { const r = UI.E.setupConfirm(0); if (!r.ok) alert(r.error); render(); };
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
  box.appendChild(el('h2', null, s.winner === 0 ? 'You win' : 'Opponent wins'));
  box.appendChild(el('p', null, s.winReason));
  box.appendChild(el('p', 'dimtxt', `Game lasted ${s.turn} turns. Seed ${UI.E.seed}.`));

  // The reward. Straight from the win into the reveal, with no inventory screen
  // in between — Trevor, 9 Aug: the immediate feedback loop is the point.
  const held = UI.save ? packsHeld(UI.save, HOME_SET) : 0;
  if (UI.save && s.winner === 0) {
    box.appendChild(el('p', null, `You won ${PACKS_PER_WIN} booster packs.`));
  }

  const bar = el('div', 'actionbar');
  if (held > 0) {
    const open = el('button', 'btn end', held === PACKS_PER_WIN && s.winner === 0
      ? `Open ${held} packs` : `Open packs (${held})`);
    open.onclick = () => { if (openNextPack()) render(); };
    bar.appendChild(open);
  }
  const again = el('button', held > 0 ? 'btn' : 'btn end', 'New game');
  again.onclick = () => { UI.seedDraft = ''; backToDeckSelect(); };
  const rerun = el('button', 'btn ghost', 'Replay this seed');
  rerun.onclick = () => { UI.seedDraft = String(UI.E.seed); newGame(); };
  bar.appendChild(again); bar.appendChild(rerun);
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
    const held = el('span', null, String(packsHeld(UI.save, HOME_SET)));
    packRow.appendChild(held);
    const give = el('button', 'btn tiny', '+5');
    // Grinding out wins to test a 1-in-2200 pull is not a reasonable ask, so
    // there is a hatch. It writes to the real save deliberately: a fake save
    // would test a code path nobody ships.
    give.onclick = () => { addPacks(UI.save, HOME_SET, 5); persist(); render(); };
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
    const a = UI.E.aiChoose(1, UI.aiMode);
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

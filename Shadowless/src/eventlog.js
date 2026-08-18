// Match recorder — the log the in-game LOG tab cannot show you.
//
// PURE DATA. No DOM, no engine import, no CARD_DB. Anything needing the card
// database is handed names by the caller, which is what lets tools/logtest.js
// drive the whole module with no browser. Keep that property.
//
// WHY THIS EXISTS. The on-screen log is what a player is allowed to see, so it
// is missing exactly the things that matter when the opponent does something
// baffling: what was in its hand, what it was holding back, and — the big one —
// what it thought its options were worth. Trevor reconstructed four AI bugs from
// a pasted screen log in one session; every one of them would have been visible
// at a glance here.
//
// Three kinds of entry, and the split is the whole design:
//   PUBLIC   mirrors the screen log, so the narrative still reads normally
//   HIDDEN   the opponent's hand, both prize piles, opening hands
//   REASON   what the AI chose, what it scored, and what it passed over
//
// Recording is always on and costs a few hundred objects a match. Exporting is
// deliberate. The AI's own reasoning only appears when the engine is asked for
// it (`explain`), because populating it on every decision would slow the test
// suites down for nothing.

function newEventLog(meta) {
  return {
    meta: Object.assign({ started: null, seed: null, decks: [], tier: null, prizes: null }, meta || {}),
    entries: [],
    packs: [],
    result: null,
  };
}

// kind: 'public' | 'hidden' | 'reason' | 'turn'
function logEvent(el, kind, turn, text, extra) {
  if (!el) return;
  el.entries.push(Object.assign({ kind, turn, text }, extra || {}));
}

// A decision the AI made, with the alternatives it rejected. `considered` is
// [{label, score}], already sorted best-first by the caller.
function logDecision(el, turn, label, score, considered, hand) {
  if (!el) return;
  el.entries.push({
    kind: 'reason', turn, text: label,
    score: (typeof score === 'number' && isFinite(score)) ? Math.round(score * 10) / 10 : null,
    considered: (considered || []).slice(0, 6),
    hand: hand || null,
  });
}

function logPack(el, setName, cards) {
  if (!el) return;
  el.packs.push({ set: setName, cards: cards || [] });
}

function logResult(el, winnerName, reason, turns) {
  if (!el) return;
  el.result = { winner: winnerName, reason, turns };
}

// ---------------------------------------------------------------- rendering
// Chronological, top to bottom. The screen log runs newest-first because that is
// right for a live feed you glance at; a file you read start to finish is the
// opposite, and mixing the two is how a reader mis-attributes a cause.
const PAD = '        ';

function renderEventLog(el) {
  if (!el) return '';
  const L = [];
  const m = el.meta;
  L.push('SHADOWLESS — match log');
  L.push('='.repeat(58));
  if (m.started) L.push(`when     ${m.started}`);
  if (m.decks && m.decks.length === 2) L.push(`decks    you: ${m.decks[0]}   opponent: ${m.decks[1]}`);
  if (m.tier) L.push(`opponent ${m.tier}`);
  if (m.seed !== null && m.seed !== undefined) L.push(`seed     ${m.seed}   (deck select accepts this — the match replays exactly)`);
  if (m.prizes) L.push(`prizes   ${m.prizes} each`);
  L.push('');
  L.push('Lines marked HIDDEN were never shown on screen. That is the point of');
  L.push('this file: the opponent\'s hand, both Prize piles, and what the AI');
  L.push('thought each of its options was worth.');
  L.push('');

  let lastTurn = null;
  for (const e of el.entries) {
    if (e.kind === 'turn') {
      L.push('');
      L.push(`--- Turn ${e.turn} — ${e.text} ${'-'.repeat(Math.max(0, 34 - String(e.text).length))}`);
      lastTurn = e.turn;
      continue;
    }
    if (e.kind === 'hidden') {
      L.push(`  HIDDEN  ${e.text}`);
      continue;
    }
    if (e.kind === 'reason') {
      L.push(`  AI      ${e.text}${e.score === null ? '' : `   [${e.score}]`}`);
      if (e.hand) L.push(`${PAD}  holding: ${e.hand}`);
      if (e.considered && e.considered.length > 1) {
        const rest = e.considered.slice(1)
          .map(c => `${c.label} ${c.score === null || c.score === undefined ? '?' : c.score}`)
          .join(', ');
        if (rest) L.push(`${PAD}  passed over: ${rest}`);
      }
      continue;
    }
    L.push(`          ${e.text}`);
  }

  if (el.result) {
    L.push('');
    L.push('='.repeat(58));
    L.push(el.result.winner === 'Draw'
      ? `RESULT   Draw — ${el.result.reason}`
      : `RESULT   ${el.result.winner} wins — ${el.result.reason}`);
    L.push(`         ${el.result.turns} turns`);
  }

  if (el.packs.length) {
    L.push('');
    L.push('='.repeat(58));
    L.push('PACKS OPENED');
    for (const p of el.packs) {
      L.push('');
      L.push(`  ${p.set}`);
      for (const c of p.cards) L.push(`    ${c}`);
    }
  }

  L.push('');
  return L.join('\n');
}

if (typeof module !== 'undefined' && module.exports) module.exports = { newEventLog, logEvent, logDecision, logPack, logResult, renderEventLog };

// ============================================================================
// ART — card sigils.
//
// We have card TEXT but no card ART. Rather than leave an empty illustration
// window, each card gets a geometric emblem generated deterministically from
// its own card_id, so the same card always looks the same and no two look
// alike. It is not pretending to be a picture of the creature.
//
// The emblem also encodes two true facts, readable at a glance in play:
//   petals      = number of attacks (1-3)
//   ring marks  = retreat cost
// ============================================================================

// Type colours. Two sets: BRIGHT for dark surfaces, INK for pale card stock.
const ENERGY_COLOR = { G: '#6FAE5A', R: '#D4603C', W: '#4E9BC4', L: '#D9BB47', P: '#9269A8', F: '#B07248', C: '#AAB2BB', D: '#5A6672', M: '#8A94A0' };
const ENERGY_INK   = { G: '#4A7C3A', R: '#B44A2A', W: '#2F7CA6', L: '#9A7C12', P: '#6F4C86', F: '#8C5430', C: '#6E7780', D: '#414B56', M: '#69737E' };
const ENERGY_NAME  = { G: 'Grass', R: 'Fire', W: 'Water', L: 'Lightning', P: 'Psychic', F: 'Fighting', C: 'Colorless', D: 'Darkness', M: 'Metal' };

// FNV-1a, then a murmur3 finalizer. The finalizer is not optional: raw FNV-1a
// mixes its LOW bits poorly, and every parameter below is derived with `% n`,
// which reads exactly those bits. Without it, cards whose hashes differ wildly
// still land on identical parameter tuples.
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 2246822507);
  h ^= h >>> 13; h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

// Independent parameter streams. Bit-shifting a single hash reuses overlapping
// bits, which quietly shrinks the real parameter space; separate salted hashes
// keep the dimensions independent as the card pool grows.
function hparam(id, salt, n) { return hash32(id + '#' + salt) % n; }

function polyPoints(cx, cy, r, n, rotDeg) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (rotDeg * Math.PI / 180) + (i * 2 * Math.PI / n) - Math.PI / 2;
    pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
}

function sigilType(card) {
  if (card.kind === 'pokemon') return card.type || 'C';
  if (card.kind === 'energy') return card.provides && card.provides.length === 1 ? card.provides : 'C';
  return 'P';
}

// Returns an SVG string. Pure and deterministic: same card_id, same emblem.
function sigilSVG(card) {
  const h = hash32(card.id);
  const t = sigilType(card);
  const col = ENERGY_INK[t] || ENERGY_INK.C;
  const sides = 3 + hparam(card.id, 'sd', 6);   // 3..8
  const rot = hparam(card.id, 'rt', 360);
  const style = hparam(card.id, 'sy', 3);
  const jitter = hparam(card.id, 'jt', 9) - 4;

  const petals = card.kind === 'pokemon' ? Math.max(1, (card.attacks || []).length) : 1;
  const marks = card.kind === 'pokemon' ? Math.min(4, card.retreat || 0) : 0;

  const parts = [];
  parts.push(`<rect x="0" y="0" width="100" height="100" fill="${col}" opacity="0.07"/>`);

  if (card.kind === 'trainer') {
    // Trainers get a bracket-and-seal motif rather than a creature emblem.
    // There are ~190 Trainers in the WOTC run, so the parameter space has to be
    // wide enough that the birthday problem doesn't produce twins.
    const inset = 16 + hparam(card.id, 'in', 7);
    const sz = 100 - inset * 2;
    const tilt = hparam(card.id, 'ti', 45);
    const core = hparam(card.id, 'co', 4);
    const bars = 2 + hparam(card.id, 'ba', 3);
    const corner = hparam(card.id, 'cn', 3);
    const ring = hparam(card.id, 'ri', 3);
    const studs = hparam(card.id, 'st', 5);
    const barW = 10 + hparam(card.id, 'bw', 5) * 2;
    const innerSz = 34 + hparam(card.id, 'is', 5) * 2;
    parts.push(`<rect x="${inset}" y="${inset}" width="${sz}" height="${sz}" fill="none" stroke="${col}" stroke-width="2.5" opacity="0.85"/>`);
    parts.push(`<rect x="${50 - innerSz / 2}" y="${50 - innerSz / 2}" width="${innerSz}" height="${innerSz}" fill="none" stroke="${col}" stroke-width="1.2" opacity="0.5" transform="rotate(${tilt} 50 50)"/>`);
    const cl = 10 + corner * 5;
    parts.push(`<path d="M${inset} ${inset + cl} L${inset} ${inset} L${inset + cl} ${inset}" fill="none" stroke="${col}" stroke-width="4"/>`);
    parts.push(`<path d="M${100 - inset} ${100 - inset - cl} L${100 - inset} ${100 - inset} L${100 - inset - cl} ${100 - inset}" fill="none" stroke="${col}" stroke-width="4"/>`);
    if (ring === 1) parts.push(`<circle cx="50" cy="50" r="27" fill="none" stroke="${col}" stroke-width="1" opacity="0.4"/>`);
    else if (ring === 2) parts.push(`<circle cx="50" cy="50" r="22" fill="none" stroke="${col}" stroke-width="1" opacity="0.4" stroke-dasharray="4 3"/>`);
    for (let i = 0; i < bars; i++) {
      const y = 50 - (bars - 1) * 4 + i * 8;
      parts.push(`<line x1="${50 - barW}" y1="${y}" x2="${50 + barW}" y2="${y}" stroke="${col}" stroke-width="1.6" opacity="0.55"/>`);
    }
    for (let i = 0; i < studs; i++) {
      const a = (-90 + (i - (studs - 1) / 2) * 26) * Math.PI / 180;
      parts.push(`<circle cx="${(50 + 35 * Math.cos(a)).toFixed(1)}" cy="${(50 + 35 * Math.sin(a)).toFixed(1)}" r="2.6" fill="${col}" opacity="0.8"/>`);
    }
    if (core === 0) parts.push(`<circle cx="50" cy="50" r="7" fill="${col}" opacity="0.9"/>`);
    else if (core === 1) parts.push(`<polygon points="${polyPoints(50, 50, 9, 3, tilt)}" fill="${col}" opacity="0.9"/>`);
    else if (core === 2) parts.push(`<rect x="44" y="44" width="12" height="12" fill="${col}" opacity="0.9" transform="rotate(45 50 50)"/>`);
    else parts.push(`<polygon points="${polyPoints(50, 50, 9, 6, tilt)}" fill="${col}" opacity="0.9"/>`);
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${parts.join('')}</svg>`;
  }

  if (card.kind === 'energy') {
    const rays = 6 + hparam(card.id, 'ry', 5);          // 6..10
    const coreR = 26 + hparam(card.id, 'er', 4) * 2;    // 26..32
    const inner = hparam(card.id, 'ei', 3);
    parts.push(`<circle cx="50" cy="50" r="${coreR}" fill="${col}" opacity="0.9"/>`);
    parts.push(`<circle cx="50" cy="50" r="${coreR}" fill="none" stroke="${col}" stroke-width="2"/>`);
    if (inner === 1) parts.push(`<circle cx="50" cy="50" r="${(coreR * 0.55).toFixed(1)}" fill="none" stroke="#FFF" stroke-width="1.6" opacity="0.5"/>`);
    else if (inner === 2) parts.push(`<polygon points="${polyPoints(50, 50, coreR * 0.5, 6, rot)}" fill="none" stroke="#FFF" stroke-width="1.6" opacity="0.5"/>`);
    for (let i = 0; i < rays; i++) {
      const a = (i * (360 / rays) + rot) * Math.PI / 180;
      parts.push(`<line x1="${(50 + (coreR + 4) * Math.cos(a)).toFixed(1)}" y1="${(50 + (coreR + 4) * Math.sin(a)).toFixed(1)}" x2="${(50 + (coreR + 14) * Math.cos(a)).toFixed(1)}" y2="${(50 + (coreR + 14) * Math.sin(a)).toFixed(1)}" stroke="${col}" stroke-width="3" opacity="0.7"/>`);
    }
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${parts.join('')}</svg>`;
  }

  // ---- Pokemon ----
  // Parameter space has to comfortably exceed the pool size, or the birthday
  // problem produces twins: 1020 Pokemon against a ~58k space yields ~9
  // expected collisions, which is what a narrower version of this actually did.
  const petalRx = 7 + hparam(card.id, 'px', 5);        // 7..11
  const petalRy = 17 + hparam(card.id, 'py', 5);       // 17..21
  const coreR = 21 + hparam(card.id, 'cr', 5);         // 21..25
  const dash = hparam(card.id, 'ds', 2);
  const petalTop = 20 + jitter;

  parts.push(`<circle cx="50" cy="50" r="41" fill="none" stroke="${col}" stroke-width="1" opacity="0.35"${dash ? ' stroke-dasharray="3 4"' : ''}/>`);

  // petals = attack count
  for (let i = 0; i < petals; i++) {
    const a = rot + i * (360 / petals);
    parts.push(`<ellipse cx="50" cy="${petalTop}" rx="${petalRx}" ry="${petalRy}" fill="${col}" opacity="0.30" transform="rotate(${a.toFixed(0)} 50 50)"/>`);
  }

  // core polygon, identity-driven
  parts.push(`<polygon points="${polyPoints(50, 50, coreR, sides, rot)}" fill="none" stroke="${col}" stroke-width="2.4" opacity="0.95"/>`);
  if (style === 0) {
    parts.push(`<polygon points="${polyPoints(50, 50, coreR * 0.54, sides, rot + 180 / sides)}" fill="${col}" opacity="0.75"/>`);
  } else if (style === 1) {
    parts.push(`<circle cx="50" cy="50" r="${(coreR * 0.5).toFixed(1)}" fill="none" stroke="${col}" stroke-width="2.4" opacity="0.9"/>`);
    parts.push(`<circle cx="50" cy="50" r="4.5" fill="${col}"/>`);
  } else {
    for (let i = 0; i < sides; i++) {
      const a = (rot + i * (360 / sides) - 90) * Math.PI / 180;
      const rr = coreR * 0.54;
      parts.push(`<circle cx="${(50 + rr * Math.cos(a)).toFixed(1)}" cy="${(50 + rr * Math.sin(a)).toFixed(1)}" r="3.4" fill="${col}" opacity="0.85"/>`);
    }
  }

  // ring marks = retreat cost
  for (let i = 0; i < marks; i++) {
    const a = (-90 + (i - (marks - 1) / 2) * 22) * Math.PI / 180;
    parts.push(`<circle cx="${(50 + 41 * Math.cos(a)).toFixed(1)}" cy="${(50 + 41 * Math.sin(a)).toFixed(1)}" r="3.6" fill="${col}"/>`);
  }

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${parts.join('')}</svg>`;
}

if (typeof module !== 'undefined') module.exports = { sigilSVG, hash32, ENERGY_COLOR, ENERGY_INK, ENERGY_NAME };

// ============================================================================
// DECK GENERATOR
//
// Given a pool of card ids, build a legal 60-card deck: complete evolution
// lines, enough Basics to open reliably, Energy matching the Pokemon's actual
// attack costs, and the 4-copy-by-name rule respected.
//
// Used now for sandbox testing of newly implemented cards, and later for
// generating campaign opponents from a set-gated pool.
// ============================================================================

const DECKGEN_DEFAULTS = {
  size: 60,
  energy: 28,
  maxCopies: 4,
  minBasics: 12,
  trainerTarget: 8,
};

function generateDeck(db, poolIds, rand, opts = {}) {
  const cfg = Object.assign({}, DECKGEN_DEFAULTS, opts);
  const pick = (n) => Math.floor(rand() * n);
  const pool = poolIds.filter(id => db[id]);

  const basicEnergy = pool.filter(id => db[id].kind === 'energy' && db[id].cls === 'Basic');
  const trainers = pool.filter(id => db[id].kind === 'trainer');
  const mons = pool.filter(id => db[id].kind === 'pokemon');
  const basics = mons.filter(id => db[id].stage === 'Basic');
  if (!basics.length || !basicEnergy.length) return null;

  const byName = {};
  mons.forEach(id => { (byName[db[id].name] = byName[db[id].name] || []).push(id); });
  // who evolves from whom
  const evosOf = {};
  mons.forEach(id => {
    const f = db[id].evolvesFrom;
    if (f) (evosOf[f] = evosOf[f] || []).push(id);
  });

  const counts = {};       // card_id -> qty
  const nameCounts = {};   // name -> qty (the 4-copy rule is by NAME)
  let total = 0;

  const room = (id, want) => {
    const name = db[id].name;
    const free = cfg.maxCopies - (nameCounts[name] || 0);
    return Math.max(0, Math.min(want, free, cfg.size - total));
  };
  const add = (id, want) => {
    const n = room(id, want);
    if (n <= 0) return 0;
    counts[id] = (counts[id] || 0) + n;
    nameCounts[db[id].name] = (nameCounts[db[id].name] || 0) + n;
    total += n;
    return n;
  };

  // --- 1. pick a few evolution lines, seeded from Basics that actually evolve
  const seeds = basics.slice();
  for (let i = seeds.length - 1; i > 0; i--) { const j = pick(i + 1); [seeds[i], seeds[j]] = [seeds[j], seeds[i]]; }

  const monTarget = cfg.size - cfg.energy - cfg.trainerTarget;
  let lines = 0;
  for (const baseId of seeds) {
    if (total >= monTarget) break;
    if (lines >= 4) break;
    const name = db[baseId].name;
    const chain = [];
    let cur = name;
    while (evosOf[cur] && evosOf[cur].length) {
      const nxt = evosOf[cur][pick(evosOf[cur].length)];
      chain.push(nxt);
      cur = db[nxt].name;
    }
    if (chain.length) {
      add(baseId, 4);
      add(chain[0], 3);
      if (chain[1]) add(chain[1], 2);
      lines++;
    }
  }
  // --- 2. top up with standalone Basics so we always open with something
  for (const baseId of seeds) {
    if (total >= monTarget) break;
    add(baseId, 3);
  }
  // guarantee a healthy Basic count
  let basicCount = Object.keys(counts).reduce((a, id) =>
    a + (db[id].kind === 'pokemon' && db[id].stage === 'Basic' ? counts[id] : 0), 0);
  for (const baseId of seeds) {
    if (basicCount >= cfg.minBasics) break;
    const got = add(baseId, 1);
    basicCount += got;
    if (!got) continue;
  }

  // --- 3. Trainers
  const trShuffled = trainers.slice();
  for (let i = trShuffled.length - 1; i > 0; i--) { const j = pick(i + 1); [trShuffled[i], trShuffled[j]] = [trShuffled[j], trShuffled[i]]; }
  let trAdded = 0;
  for (const id of trShuffled) {
    if (trAdded >= cfg.trainerTarget) break;
    trAdded += add(id, 2);
  }

  // --- 4. Energy, weighted by what the chosen Pokemon actually need
  const need = {};
  for (const id in counts) {
    const c = db[id];
    if (c.kind !== 'pokemon') continue;
    (c.attacks || []).forEach(a => a.cost.split('').forEach(t => {
      if (t !== 'C') need[t] = (need[t] || 0) + counts[id];
    }));
  }
  const types = Object.keys(need);
  const remaining = cfg.size - total;
  if (!types.length) {
    // colourless-only deck: any basic Energy will do
    add(basicEnergy[0], remaining);
  } else {
    const totalNeed = types.reduce((a, t) => a + need[t], 0);
    let placed = 0;
    types.forEach((t, i) => {
      const src = basicEnergy.find(id => db[id].provides === t);
      if (!src) return;
      const share = i === types.length - 1
        ? remaining - placed
        : Math.round(remaining * (need[t] / totalNeed));
      const n = Math.max(0, Math.min(share, cfg.size - total));
      if (n > 0) { counts[src] = (counts[src] || 0) + n; total += n; placed += n; }
    });
    // any shortfall (missing Energy type in the pool) goes to whatever exists
    if (total < cfg.size) {
      const src = basicEnergy[0];
      const n = cfg.size - total;
      counts[src] = (counts[src] || 0) + n; total += n;
    }
  }

  if (total !== cfg.size) return null;
  const list = Object.keys(counts).map(id => [counts[id], id]);
  return { name: opts.name || 'Sandbox', list, generated: true };
}

if (typeof module !== 'undefined') module.exports = { generateDeck, DECKGEN_DEFAULTS };

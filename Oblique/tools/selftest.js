/* Oblique — headless kernel harness.
 *
 * Slices everything above the `===  VIEW  ===` banner out of oblique.html and
 * runs it under Node with NO DOM stubs of any kind. That is deliberate: if the
 * kernel ever grows a reference to document or window, this file fails with a
 * ReferenceError, which is exactly the signal we want.
 *
 *   node tools/selftest.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const HTML = path.join(__dirname, "..", "oblique.html");
const BANNER = "===  VIEW  ===";

/* ---------- slice ---------- */
function loadKernel() {
  const html = fs.readFileSync(HTML, "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!script) throw new Error("no <script> block found in oblique.html");
  const cut = script[1].indexOf(BANNER);
  if (cut < 0) throw new Error("VIEW banner not found — has the file been restructured?");
  const src = script[1].slice(0, cut).replace(/\/\*\s*=+\s*$/, "");

  // Top-level const/let don't escape a function body, so hand them back explicitly.
  const exports = `
    return {
      CFG, skipMin, solveChain, measureStrain, makeLine, lineFromRegts, makeRegiment,
      straightJoints, resetField, detach, trimEmptyFlanks, closeUp, closeUpPlan,
      tryMerge, tryFillGap, occupied, gaps, spansOf, slotDepth, stretchRatio, slotQuad,
      dragStake, commitSpans, atSpanLimit, slotCentre, lineCentre, nearestGapTo,
      hitRegiment, hitStake, lineOfReg, slotIndex, rollDesignation, ordinal, dist, norm,
      march, marchGeneral, tickOrders, dispatch, cancelOrders, resetGeneral, general,
      selection,
      get orders(){ return orders; },
      get instantOrders(){ return instantOrders; }, setInstant(v){ instantOrders = v; },
      get lines(){ return lines; }, setLines(v){ lines = v; },
      setField(w,h){ W = w; H = h; }
    };`;
  return new Function(src + exports)();
}

/* ---------- tiny assert framework ---------- */
let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log("  ok   " + name); pass++; }
  catch (e) { console.log("  FAIL " + name + "\n         " + e.message); fail++; }
}
function ok(cond, msg) { if (!cond) throw new Error(msg || "assertion failed"); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || "expected") + ": got " + a + ", want " + b); }
function near(a, b, tol, msg) {
  if (Math.abs(a - b) > tol) throw new Error((msg || "expected") + ": got " + a + ", want " + b + " ±" + tol);
}

/* ---------- helpers ---------- */
const K = loadKernel();
const { CFG } = K;

function freshField() {
  K.setField(1200, 800);
  K.resetField();
  return K.lines[0];
}
function totalRegiments() { return K.lines.reduce((s, L) => s + K.occupied(L), 0); }
function maxHinge(pts) {
  let m = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1], c = pts[i], q = pts[i + 1];
    const d = Math.abs(K.norm(Math.atan2(q.y - c.y, q.x - c.x) - Math.atan2(c.y - p.y, c.x - p.x)));
    m = Math.max(m, d);
  }
  return m;
}

console.log("\nOblique kernel — headless self-test\n");

/* ---------- the kernel is pure ---------- */
t("kernel loads with no DOM present", () => {
  ok(typeof document === "undefined", "test env leaked a document global; the purity check is void");
  ok(typeof K.solveChain === "function");
});

/* ---------- field setup ---------- */
t("resetField lays out one full line", () => {
  const L = freshField();
  eq(K.lines.length, 1, "bodies");
  eq(K.occupied(L), 6, "regiments");
  eq(L.joints.length, 7, "joints");
  eq(K.gaps(L), 0, "gaps");
  eq(L.target.length, L.joints.length, "target length");
});

t("a fresh line is under no strain", () => {
  const L = freshField();
  ok(Math.max(...K.measureStrain(L, L.joints)) < 0.001, "fresh line reports strain");
});

t("designations are unique and well-formed", () => {
  freshField();
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const tag = K.rollDesignation();
    ok(!seen.has(tag), "duplicate designation " + tag);
    ok(/^\d+(st|nd|rd|th) [A-Z]{2}$/.test(tag), "malformed designation " + tag);
    seen.add(tag);
  }
});

t("ordinals are right where English is irregular", () => {
  const cases = [[1,"1st"],[2,"2nd"],[3,"3rd"],[4,"4th"],[11,"11th"],[12,"12th"],
                 [13,"13th"],[21,"21st"],[101,"101st"],[111,"111th"],[112,"112th"]];
  for (const [n, want] of cases) eq(K.ordinal(n), want, "ordinal(" + n + ")");
});

/* ---------- the solver ---------- */
t("solveChain holds every span and never over-bends", () => {
  const L = freshField();
  const rest = L.joints.map(p => ({ x: p.x, y: p.y }));
  const pts = rest.map(p => ({ x: p.x, y: p.y }));
  const driven = new Map([[0, { x: rest[0].x - 120, y: rest[0].y - 200 }]]);
  K.solveChain(pts, rest, driven, new Set(), K.spansOf(L));

  const spans = K.spansOf(L);
  for (let i = 0; i < pts.length - 1; i++) {
    near(K.dist(pts[i], pts[i + 1]), spans[i], 1.5, "segment " + i + " length");
  }
  ok(maxHinge(pts) <= CFG.MAX_HINGE + 0.02, "hinge exceeded MAX_HINGE: " + maxHinge(pts));
  near(pts[0].x, driven.get(0).x, 0.01, "driven joint x");
  near(pts[0].y, driven.get(0).y, 0.01, "driven joint y");
});

t("an anchored joint does not move", () => {
  const L = freshField();
  const rest = L.joints.map(p => ({ x: p.x, y: p.y }));
  const pts = rest.map(p => ({ x: p.x, y: p.y }));
  K.solveChain(pts, rest, new Map([[6, { x: rest[6].x, y: rest[6].y - 260 }]]), new Set([0]), K.spansOf(L));
  near(pts[0].x, rest[0].x, 0.01, "anchor x");
  near(pts[0].y, rest[0].y, 0.01, "anchor y");
});

t("strain appears when the line is asked for the impossible", () => {
  const L = freshField();
  // Fold joint 3 hard back against its neighbours — the hinge cap must refuse.
  const rest = L.joints.map(p => ({ x: p.x, y: p.y }));
  const pts = rest.map(p => ({ x: p.x, y: p.y }));
  K.solveChain(pts, rest, new Map([[3, { x: rest[3].x, y: rest[3].y - 400 }]]), new Set([0, 6]), K.spansOf(L));
  ok(Math.max(...K.measureStrain(L, pts)) > CFG.STRAIN_T, "no strain reported on an impossible order");
});

/* ---------- drawing out and closing up ---------- */
t("dragStake clamps span to MIN_SPAN..MAX_SPAN", () => {
  const L = freshField();
  let r = K.dragStake(L, 6, { x: L.joints[6].x + 4000, y: L.joints[6].y });
  for (const s of r.spans) {
    ok(s <= CFG.MAX_SPAN + 0.01 && s >= CFG.MIN_SPAN - 0.01, "span out of range: " + s);
  }
  ok(K.atSpanLimit(r.spans[5]), "a stake dragged to infinity should sit at its limit");

  r = K.dragStake(L, 6, { x: L.joints[5].x + 1, y: L.joints[5].y });
  ok(K.atSpanLimit(r.spans[5]), "a stake dragged onto its pivot should sit at its limit");
});

t("dragStake mutates nothing — a span is an order, not a fact", () => {
  const L = freshField();
  const before = K.spansOf(L);
  const beforeJoints = L.joints.map(p => ({ x: p.x, y: p.y }));
  K.dragStake(L, 6, { x: L.joints[6].x + 4000, y: L.joints[6].y });
  const after = K.spansOf(L);
  for (let i = 0; i < before.length; i++) eq(after[i], before[i], "span " + i + " changed");
  for (let i = 0; i < L.joints.length; i++) {
    near(K.dist(L.joints[i], beforeJoints[i]), 0, 1e-9, "joint " + i + " moved");
  }
});

t("commitSpans is what actually writes a frontage", () => {
  const L = freshField();
  const r = K.dragStake(L, 6, { x: L.joints[6].x + 4000, y: L.joints[6].y });
  K.commitSpans(L, r.spans);
  ok(K.atSpanLimit(L.slots[5].span), "span was not committed");
});

t("depth follows frontage inversely", () => {
  const thin = K.slotDepth(CFG.MAX_SPAN), packed = K.slotDepth(CFG.MIN_SPAN);
  ok(thin < packed, "a drawn-out regiment should be shallower than a closed-up one");
  near(K.slotDepth(CFG.SLOT_LEN), CFG.REG_DEPTH, 0.001, "nominal span should give nominal depth");
});

/* ---------- gaps ---------- */
t("detaching from the middle leaves a real gap", () => {
  const L = freshField();
  const made = K.detach(L, [2]);
  eq(made.length, 1, "bodies made");
  eq(K.occupied(made[0]), 1, "detached regiments");
  eq(L.slots.length, 6, "the line keeps its frontage");
  eq(K.gaps(L), 1, "gaps");
  eq(totalRegiments(), 6, "regiments conserved");
});

t("detaching from a flank leaves no gap, just a shorter line", () => {
  const L = freshField();
  K.detach(L, [0]);
  eq(L.slots.length, 5, "flank slot should be trimmed, not left as a hole");
  eq(K.gaps(L), 0, "gaps");
  eq(totalRegiments(), 6, "regiments conserved");
});

t("detaching adjacent regiments makes one body, not two", () => {
  const L = freshField();
  const made = K.detach(L, [1, 2, 3]);
  eq(made.length, 1, "a contiguous run is one body");
  eq(K.occupied(made[0]), 3, "detached regiments");
  eq(K.gaps(L), 3, "gaps");
});

t("closing up removes the gaps and keeps everyone", () => {
  const L = freshField();
  K.detach(L, [2]);
  ok(K.closeUp(L), "closeUp reported nothing to do");
  eq(K.gaps(L), 0, "gaps after closing up");
  eq(K.occupied(L), 5, "regiments in the closed line");
  eq(L.target.length, 6, "target joints");
  eq(L.joints.length, L.target.length, "joints and target must stay the same length");
});

t("closing up a solid line is a no-op", () => {
  const L = freshField();
  eq(K.closeUp(L), false, "closeUp should refuse a line with no gaps");
});

t("a loose body dropped on a gap fills it", () => {
  const L = freshField();
  const loose = K.detach(L, [2])[0];
  const g = { x: (L.joints[2].x + L.joints[3].x) / 2, y: (L.joints[2].y + L.joints[3].y) / 2 };
  const c = { x: (loose.joints[0].x + loose.joints[1].x) / 2, y: (loose.joints[0].y + loose.joints[1].y) / 2 };
  for (const p of loose.joints) { p.x += g.x - c.x; p.y += g.y - c.y; }
  ok(K.tryMerge(loose), "merge failed");
  eq(K.lines.length, 1, "bodies after refilling");
  eq(K.gaps(K.lines[0]), 0, "gaps after refilling");
  eq(totalRegiments(), 6, "regiments conserved");
});

t("a loose body dropped on a flank extends the line", () => {
  const L = freshField();
  const loose = K.detach(L, [0])[0];
  const end = L.joints[L.joints.length - 1];
  const d = { x: end.x - loose.joints[0].x, y: end.y - loose.joints[0].y };
  for (const p of loose.joints) { p.x += d.x; p.y += d.y; }
  ok(K.tryMerge(loose), "merge failed");
  eq(K.lines.length, 1, "bodies after extending");
  eq(totalRegiments(), 6, "regiments conserved");
});

/* ---------- marching ---------- */
t("a line marches onto its ordered position", () => {
  const L = freshField();
  L.target = L.joints.map(p => ({ x: p.x + 140, y: p.y - 90 }));
  for (let i = 0; i < 1200; i++) K.march(1 / 60);
  for (let i = 0; i < L.joints.length; i++) {
    near(K.dist(L.joints[i], L.target[i]), 0, 0.6, "joint " + i + " failed to arrive");
  }
});

t("marching never tears the line apart", () => {
  const L = freshField();
  const r = K.dragStake(L, 0, { x: L.joints[0].x - 60, y: L.joints[0].y - 240 });
  K.commitSpans(L, r.spans);
  L.target = r.joints;
  for (let i = 0; i < 900; i++) K.march(1 / 60);
  const spans = K.spansOf(L);
  for (let i = 0; i < L.joints.length - 1; i++) {
    near(K.dist(L.joints[i], L.joints[i + 1]), spans[i], 2.0, "segment " + i + " after marching");
  }
});

/* ---------- the courier ---------- */
function standAt(x, y) { K.general.x = K.general.tx = x; K.general.y = K.general.ty = y; }

t("an order changes nothing until the courier arrives", () => {
  const L = freshField();
  standAt(80, 740);
  const before = L.target.map(p => ({ x: p.x, y: p.y }));
  const shape = L.joints.map(p => ({ x: p.x, y: p.y - 150 }));
  let applied = false;

  const o = K.dispatch(L, K.slotCentre(L, 0), { kind: "move", shape },
                       () => { applied = true; L.target = shape; });
  ok(o.dur > 1, "a courier should take real time; got " + o.dur.toFixed(2) + "s");

  K.tickOrders(o.dur * 0.5);
  ok(!applied, "the order was obeyed before it arrived");
  ok(L.pending, "pending should be visible while the rider is out");
  for (let i = 0; i < L.target.length; i++) {
    near(K.dist(L.target[i], before[i]), 0, 1e-9, "target joint " + i + " moved early");
  }

  K.tickOrders(o.dur * 0.6);
  ok(applied, "the order never arrived");
  ok(!L.pending, "pending should clear on arrival");
  eq(K.orders.length, 0, "the rider should be gone");
});

t("distance is latency", () => {
  const L = freshField();
  const c = K.slotCentre(L, 0);
  standAt(c.x, c.y + 40);
  const close = K.dispatch(L, c, { kind: "move", shape: L.joints }, () => {});
  K.cancelOrders(L);
  standAt(c.x - 900, c.y + 40);
  const far = K.dispatch(L, c, { kind: "move", shape: L.joints }, () => {});
  K.cancelOrders(L);
  ok(far.dur > close.dur * 3,
     "a far order should cost far more: " + close.dur.toFixed(2) + "s vs " + far.dur.toFixed(2) + "s");
});

t("a new order supersedes the one still in flight", () => {
  const L = freshField();
  standAt(80, 740);
  let first = 0, second = 0;
  K.dispatch(L, K.slotCentre(L, 0), { kind: "move", shape: L.joints }, () => { first++; });
  K.dispatch(L, K.slotCentre(L, 0), { kind: "move", shape: L.joints }, () => { second++; });
  eq(K.orders.length, 1, "riders in flight");
  K.tickOrders(99);
  eq(first, 0, "the superseded order should never be obeyed");
  eq(second, 1, "the new order should be obeyed");
});

t("an order to a body that no longer exists is dropped", () => {
  const L = freshField();
  const loose = K.detach(L, [2])[0];
  standAt(80, 740);
  let applied = false;
  K.dispatch(loose, K.slotCentre(loose, 0), { kind: "move", shape: loose.joints },
             () => { applied = true; });
  K.setLines(K.lines.filter(x => x !== loose));      // destroyed while the rider is out
  K.tickOrders(99);
  ok(!applied, "delivered an order to a body that is gone");
  eq(K.orders.length, 0, "the stale rider was not cleaned up");
});

t("instant orders (dev) deliver on the spot", () => {
  const L = freshField();
  standAt(80, 740);
  let applied = false;
  K.setInstant(true);
  K.dispatch(L, K.slotCentre(L, 0), { kind: "move", shape: L.joints }, () => { applied = true; });
  K.setInstant(false);
  ok(applied, "instant order did not apply");
  eq(K.orders.length, 0, "instant order should not queue a rider");
  ok(!L.pending, "instant order should leave nothing pending");
});

t("a body ordered into a gap merges on arrival, not on delivery", () => {
  const L = freshField();
  const home = [K.slotCentre(L, 2)];   // remembered before anything moves
  const j2 = { x: L.joints[2].x, y: L.joints[2].y };
  const j3 = { x: L.joints[3].x, y: L.joints[3].y };
  const loose = K.detach(L, [2])[0];

  for (const p of loose.joints) { p.x -= 320; p.y -= 320; }   // send it well away
  loose.target = loose.joints.map(p => ({ x: p.x, y: p.y }));
  ok(home.length === 1);

  standAt(loose.joints[0].x, loose.joints[0].y - 30);
  const shape = [j2, j3];
  K.dispatch(loose, K.slotCentre(loose, 0), { kind: "move", shape },
             () => { loose.target = shape; });
  K.tickOrders(99);
  eq(K.lines.length, 2, "it must not teleport into the gap when the order lands");

  for (let i = 0; i < 4000 && K.lines.length > 1; i++) K.march(1 / 60);
  eq(K.lines.length, 1, "it never merged after walking there");
  eq(K.gaps(K.lines[0]), 0, "the gap should be filled");
  eq(totalRegiments(), 6, "regiments conserved");
});

t("a stationary body does not merge with its neighbour unprompted", () => {
  const L = freshField();
  K.detach(L, [2]);                     // the loose body sits exactly in the gap
  for (let i = 0; i < 600; i++) K.march(1 / 60);
  eq(K.lines.length, 2, "bodies merged without ever being ordered to");
  eq(K.gaps(L), 1, "the gap should still be open");
});

t("the general rides to where he is sent", () => {
  freshField();
  standAt(400, 600);
  K.general.tx = 700; K.general.ty = 300;
  for (let i = 0; i < 2000; i++) K.marchGeneral(1 / 60);
  near(K.dist(K.general, { x: 700, y: 300 }), 0, 0.6, "the general failed to arrive");
});

/* ---------- report ---------- */
console.log("\n  " + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);

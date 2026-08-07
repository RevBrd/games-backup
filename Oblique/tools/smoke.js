/* Oblique — integration smoke test.
 *
 * Runs the WHOLE page (kernel + view) against a stubbed DOM and drives the real
 * pointer and key handlers, so it covers the part selftest.js cannot: that a
 * drag becomes an order rather than a movement, and that nothing reaches the
 * troops until a rider gets there.
 *
 *   node tools/smoke.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

/* ---------- clock and frame pump ---------- */
const clock = { t: 0 };
let queued = null;
function pump(ms) {
  clock.t += ms;
  const f = queued; queued = null;
  if (f) f(clock.t);
}
function pumpFor(seconds, dtMs = 16) {
  for (let i = 0; i < Math.ceil((seconds * 1000) / dtMs); i++) pump(dtMs);
}

/* ---------- DOM stub ---------- */
const handlers = { cv: {}, win: {} };
const noopCtx = new Proxy({}, {
  get: (t, k) => (k === "canvas" ? {} : () => ({}))
});
const els = {};
function el(id) {
  if (els[id]) return els[id];
  return (els[id] = {
    id, innerHTML: "", style: {}, width: 0, height: 0,
    clientWidth: 1200, clientHeight: 800,
    getContext: () => noopCtx,
    setPointerCapture: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    addEventListener: (t, f) => { handlers.cv[t] = f; }
  });
}
global.document = { getElementById: el, createElement: () => el("__scratch") };
global.window = { addEventListener: (t, f) => { handlers.win[t] = f; }, devicePixelRatio: 1 };
global.performance = { now: () => clock.t };
global.requestAnimationFrame = f => { queued = f; };

/* ---------- run the page ---------- */
const html = fs.readFileSync(path.join(__dirname, "..", "oblique.html"), "utf8");
vm.runInThisContext(html.match(/<script>([\s\S]*)<\/script>/)[1]);
const O = global.window.__oblique;
if (!O) throw new Error("test seam window.__oblique missing");

/* ---------- input helpers ---------- */
const ev = (x, y, o = {}) =>
  Object.assign({ clientX: x, clientY: y, pointerId: 1, shiftKey: false, altKey: false }, o);
function down(x, y, o) { handlers.cv.pointerdown(ev(x, y, o)); }
function move(x, y, o) { handlers.cv.pointermove(ev(x, y, o)); }
function up() { handlers.cv.pointerup(ev(0, 0)); }
function key(k) { handlers.win.keydown({ key: k }); }
function dragTo(x0, y0, x1, y1, o) {
  down(x0, y0, o);
  move(x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.5, o);
  move(x1, y1, o);
  up();
}

/* ---------- assertions ---------- */
let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log("  ok   " + name); pass++; }
  catch (e) { console.log("  FAIL " + name + "\n         " + e.message); fail++; }
}
function ok(c, m) { if (!c) throw new Error(m || "assertion failed"); }
function eq(a, b, m) { if (a !== b) throw new Error((m || "expected") + ": got " + a + ", want " + b); }

/* The starting line: 6 slots of SLOT_LEN centred on (W/2, H*0.56), running +x,
   with the men occupying REG_DEPTH *below* the spine (the firing face is up). */
const CFG = O.CFG;
const SPINE_Y = 800 * 0.56;
const X0 = 1200 * 0.5 - (6 * CFG.SLOT_LEN) / 2;
const slotPoint = i => ({ x: X0 + CFG.SLOT_LEN * (i + 0.5), y: SPINE_Y + CFG.REG_DEPTH * 0.5 });

console.log("\nOblique — integration smoke test\n");

t("the page boots a field and a general", () => {
  pump(16);
  eq(O.lines.length, 1, "bodies");
  eq(O.lines[0].slots.length, 6, "slots");
  ok(O.general.x > 0 && O.general.y > 0, "the general was never placed");
});

t("clicking a regiment selects it and orders nothing", () => {
  const p = slotPoint(0);
  down(p.x, p.y); up();
  eq(O.orders.length, 0, "a bare click should not cost a rider");
  ok(!O.lines[0].pending, "a bare click should leave nothing pending");
});

t("dragging a regiment writes an order and moves nobody", () => {
  const L = O.lines[0];
  const before = L.joints.map(p => ({ x: p.x, y: p.y }));
  const beforeTarget = L.target.map(p => ({ x: p.x, y: p.y }));
  const p = slotPoint(0);

  dragTo(p.x, p.y, p.x, p.y - 140);
  eq(O.orders.length, 1, "the drag did not dispatch a rider");
  ok(L.pending, "the drag left nothing pending to look at");

  pump(16);
  for (let i = 0; i < L.joints.length; i++) {
    ok(Math.hypot(L.joints[i].x - before[i].x, L.joints[i].y - before[i].y) < 0.001,
       "joint " + i + " moved before the order arrived");
    ok(Math.hypot(L.target[i].x - beforeTarget[i].x, L.target[i].y - beforeTarget[i].y) < 0.001,
       "target " + i + " changed before the order arrived");
  }
});

t("the regiment moves once the rider gets there", () => {
  const L = O.lines[0];
  const before = L.joints[0].y;
  pumpFor(20);
  eq(O.orders.length, 0, "the rider never arrived");
  ok(!L.pending, "pending should clear on arrival");
  ok(L.joints[0].y < before - 40, "the line never marched: " + before + " -> " + L.joints[0].y);
});

t("standing closer shortens the wait", () => {
  const L = O.lines[0];
  const p = { x: L.joints[0].x + CFG.SLOT_LEN * 0.5, y: L.joints[0].y + CFG.REG_DEPTH * 0.5 };

  O.general.x = O.general.tx = 60;  O.general.y = O.general.ty = 760;
  dragTo(p.x, p.y, p.x + 10, p.y - 10);
  const far = O.orders[0].dur;

  O.general.x = O.general.tx = p.x; O.general.y = O.general.ty = p.y + 30;
  dragTo(p.x, p.y, p.x + 10, p.y - 12);
  const near = O.orders[0].dur;

  ok(far > near * 3, "distance should dominate: far " + far.toFixed(2) + "s vs near " + near.toFixed(2) + "s");
  pumpFor(20);
});

t("anchoring a joint is free", () => {
  const L = O.lines[0];
  const j = L.joints[0];
  down(j.x, j.y); up();
  eq(O.orders.length, 0, "an anchor should not cost a rider");
  ok(L.anchors.has(0), "the anchor did not take");
  down(j.x, j.y); up();
  ok(!L.anchors.has(0), "the anchor did not release");
});

t("moving the general is free and he rides there himself", () => {
  const before = { x: O.general.x, y: O.general.y };
  down(before.x, before.y);
  move(before.x + 200, before.y + 60);
  up();
  eq(O.orders.length, 0, "moving yourself should not cost a rider");
  ok(Math.hypot(O.general.x - before.x, O.general.y - before.y) < 1, "he teleported");
  pumpFor(20);
  ok(Math.hypot(O.general.x - (before.x + 200), O.general.y - (before.y + 60)) < 2,
     "he never arrived");
});

t("alt-drag orders a detachment without detaching anything yet", () => {
  const L = O.lines[0];
  const c = { x: (L.joints[2].x + L.joints[3].x) / 2,
              y: (L.joints[2].y + L.joints[3].y) / 2 + CFG.REG_DEPTH * 0.5 };
  down(c.x, c.y); up();                                  // select it first
  dragTo(c.x, c.y, c.x + 30, c.y + 190, { altKey: true });

  eq(O.orders.length, 1, "no rider was sent");
  eq(O.lines.length, 1, "the regiment left the line before the order arrived");
  eq(L.slots.filter(s => s.reg).length, 6, "a hole opened before the order arrived");

  pumpFor(25);
  eq(O.lines.length, 2, "the detachment never happened");
  const src = O.lines.find(x => x.slots.length === 6);
  ok(src, "the parent line lost its frontage");
  eq(src.slots.filter(s => !s.reg).length, 1, "the gap did not open");
});

t("C with a detachment selected closes up that body, not the line it left", () => {
  key("c");
  eq(O.orders.length, 0, "the detached regiment has no gaps and needs no rider");
});

t("close up is an order too, and it lands", () => {
  const src = O.lines.find(x => x.slots.length === 6);
  down(1150, 60); up();                     // empty ground: clear the selection
  key("c");
  ok(O.orders.length >= 1, "close up did not dispatch");
  eq(src.slots.length, 6, "the line closed before the order arrived");
  pumpFor(30);
  eq(src.slots.length, 5, "the line never closed up");
  eq(src.slots.filter(s => !s.reg).length, 0, "the gap survived closing up");
});

t("R resets the field, the riders and the general", () => {
  key("r");
  pump(16);
  eq(O.lines.length, 1, "bodies after reset");
  eq(O.orders.length, 0, "riders survived a reset");
  eq(O.lines[0].slots.length, 6, "slots after reset");
});

t("a thousand frames of nothing changes nothing", () => {
  const L = O.lines[0];
  const before = L.joints.map(p => ({ x: p.x, y: p.y }));
  pumpFor(16);
  eq(O.lines.length, 1, "a line merged or split on its own");
  for (let i = 0; i < L.joints.length; i++) {
    ok(Math.hypot(L.joints[i].x - before[i].x, L.joints[i].y - before[i].y) < 0.001,
       "joint " + i + " drifted with no orders given");
  }
});

console.log("\n  " + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);

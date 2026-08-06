/* ============================================================================
   BAO'S BIG BREAKFAST — validation harness
   ----------------------------------------------------------------------------
   There is no Node on this machine and the game needs a real canvas at boot, so
   validation is done by driving the live page. Open baos-big-breakfast.html in
   a browser, open the console, paste this whole file, then:

       BAOTEST.all()          run everything
       BAOTEST.physics()      speed caps and jump heights
       BAOTEST.play(0)        autopilot counter 1-1
       BAOTEST.play(1)        autopilot counter 1-2

   Everything runs synchronously inside one call so the page's own
   requestAnimationFrame cannot interleave and corrupt the run.

   THE AUTOPILOT IS THE REGRESSION TEST. Re-run it after any change to TUNE or
   to a LEVEL — it is what catches a level that has silently become impossible.
   It is a dumb heuristic bot, not a good player: it holds right, jumps at
   walls, gaps and enemies, and waits on lift platforms until the next landing
   is in range. If it fails, look at where it stalled before assuming the bot
   is at fault, but do check — a bot failure is not always a level failure.
   ========================================================================== */
(function () {
  const B = window.BAO;
  if (!B) throw new Error('window.BAO missing — is the game loaded?');
  const TS = 16, GROUND_ROW = 13;

  function tileSolid(tx, ty) { return B.isSolid(tx, ty); }

  function clearKeys() {
    for (const k in B.keys) B.keys[k] = false;
    for (const k in B.pressed) B.pressed[k] = false;
  }
  // The real loop clears `pressed` after every step. Forgetting to do the same
  // here leaves jump latched and Bao bunny-hops through the whole measurement.
  function step1() {
    B.step();
    for (const k in B.pressed) B.pressed[k] = false;
  }
  function stepN(n) { for (let i = 0; i < n; i++) step1(); }

  // ---- physics ------------------------------------------------------------
  // These are the numbers the level layouts are tuned against. If one of them
  // moves, every reachability decision in LEVEL is suspect.
  function physics() {
    const out = [];
    const p = B.player, g = B.game;

    // Measure on a synthetic flat runway with nothing else in it. Measuring in
    // a real level means an enemy eventually walks into the test and the jump
    // reads as zero because Bao is busy dying.
    function fresh() {
      B.enterLevel(0, false);
      const w = B.world;
      w.tiles.fill(0);
      for (let x = 0; x < w.w; x++) {
        w.tiles[GROUND_ROW * w.w + x] = B.T.BOARD_TOP;
        w.tiles[(GROUND_ROW + 1) * w.w + x] = B.T.BOARD;
      }
      w.entities.length = 0; w.sortedEnemies = []; w.spawnCursor = 0;
      w.camX = 0;
      g.scene = 'play'; g.paused = false; g.time = 999;
      clearKeys();
      p.x = 4 * TS; p.y = (GROUND_ROW - 1) * TS - 1; p.vx = 0; p.vy = 0;
      p.power = 0; p.state = 'play'; p.starT = 0; p.hurtT = 0;
      stepN(20);   // settle onto the floor
      p.vx = 0;
    }

    // one jump, held for the whole arc, measured in tiles of lift
    function jumpHeight() {
      const y0 = p.y;
      let best = 0;
      B.keys.jump = true; B.pressed.jump = true;
      for (let i = 0; i < 140; i++) {
        step1();
        best = Math.max(best, (y0 - p.y) / TS);
        if (i > 4 && p.grounded) break;
      }
      B.keys.jump = false;
      return best;
    }

    // walk cap
    fresh();
    B.keys.right = true;
    stepN(400);
    out.push(['walk cap', p.vx, 1.56, Math.abs(p.vx - 1.56) < 0.03]);

    // dash cap
    fresh();
    B.keys.right = true; B.keys.run = true;
    stepN(500);
    out.push(['dash cap', p.vx, 2.62, Math.abs(p.vx - 2.62) < 0.03]);

    // standing jump height, in tiles
    fresh();
    let h = jumpHeight();
    out.push(['standing jump (tiles)', h, 4.4, h > 4.2 && h < 4.7]);

    // running jump height
    fresh();
    B.keys.right = true; B.keys.run = true;
    stepN(400);
    h = jumpHeight();
    out.push(['running jump (tiles)', h, 5.1, h > 4.8 && h < 5.5]);

    // The constraint jumpBase is set by: walk flush into a 4-tile straw, stop
    // dead, and you must still get on top of it. Drop jumpBase below ~4.7 and
    // this fails, which strands the player and they have to back up.
    fresh();
    const ww = B.world;
    for (let y = 9; y < GROUND_ROW; y++) {
      ww.tiles[y * ww.w + 40] = B.T.PIPE_L;
      ww.tiles[y * ww.w + 41] = B.T.PIPE_R;
    }
    p.x = 30 * TS;
    B.keys.right = true;
    for (let i = 0; i < 400 && p.x < 40 * TS - 12.5; i++) step1();
    B.keys.right = false; p.vx = 0;
    stepN(10);                                  // dead stop, flush against it
    let onTop = false;
    B.keys.jump = true; B.pressed.jump = true; B.keys.right = true;
    for (let i = 0; i < 140; i++) {
      step1();
      if (p.grounded && p.y < 150) { onTop = true; break; }
    }
    out.push(['clears a 4-tile straw from a standstill', onTop ? 1 : 0, 1, onTop]);

    clearKeys();
    return out;
  }

  // ---- lifts --------------------------------------------------------------
  // A separate check because the autopilot riding one successfully does not
  // prove it stays glued to a descending platform.
  function lifts() {
    const out = [];
    const p = B.player, g = B.game;
    const L = B.levels.findIndex(l => (l.lifts || []).length);
    if (L < 0) return [['no level has lifts', 0, 0, false]];

    B.enterLevel(L, false);
    g.scene = 'play'; g.paused = false;
    clearKeys();
    const lift = B.world.entities.find(e => e.kind === 'lift' && e.mode === 'v');
    if (!lift) return [['no vertical lift', 0, 0, false]];

    // drop him onto it from just above
    p.x = lift.x + 16; p.y = lift.y - 40; p.vx = 0; p.vy = 0; p.power = 0;
    let landed = false, ungroundedFrames = 0;
    for (let i = 0; i < 900; i++) {
      step1();
      if (p.grounded && Math.abs((p.y + 13) - lift.y) < 3) landed = true;
      else if (landed) ungroundedFrames++;
      if (p.y > 260) break;
    }
    out.push(['rides the vertical lift', landed ? 1 : 0, 1, landed]);
    out.push(['stays glued (dropped frames)', ungroundedFrames, 0, ungroundedFrames < 4]);
    return out;
  }

  // ---- autopilot ----------------------------------------------------------
  function play(levelIndex, opts) {
    opts = opts || {};
    const maxFrames = opts.maxFrames || 14000;
    const p = B.player, w = B.world, g = B.game;

    B.startGame();
    B.enterLevel(levelIndex, false);
    g.paused = false;
    B.dev.invincible = true;      // we are testing traversal, not combat
    g.lives = 99;
    clearKeys();

    const L = B.level();
    let bestX = p.x, stuckFor = 0, frames = 0, waitFrames = 0;
    let wasDying = false, holdJump = true;
    const deaths = [];        // the tile each death happened at — the useful bit
    // opts.traceFrom: log the decision every frame past this tile. This is the
    // thing to reach for when a run fails; guessing at why is slower.
    const traceFrom = opts.traceFrom === undefined ? Infinity : opts.traceFrom * TS;
    const trace = [];

    for (; frames < maxFrames; frames++) {
      if (g.scene === 'clear' || g.scene === 'over') break;

      // the harness must not run out of clock on a slow bot
      if (g.time < 120) g.time = 300;

      if (p.state === 'dying' && !wasDying) {
        deaths.push(Math.round(bestX / TS));
        bestX = 0; stuckFor = 0;        // a death rewinds him, so rewind the watchdog
      }
      wasDying = p.state === 'dying';
      if (deaths.length > 6) break;

      const box = p.power > 0 && !p.ducking ? 22 : 13;
      const feet = p.y + box;
      const tx = Math.floor((p.x + 6) / TS);
      const feetRow = Math.floor(feet / TS);

      clearKeys();
      B.keys.right = true;
      B.keys.run = true;
      let why = 'air';

      if (!p.grounded) {
        // Holding jump gives the full 4-tile arc and ~55 frames of airtime.
        // That is right for clearing a pit and completely wrong for stepping
        // one tile onto a moving platform — he sails over it while it slides
        // out from under him. Short hops are tapped.
        if (p.vy < 0 && holdJump) B.keys.jump = true;
      } else {
        const onLift = w.entities.find(e =>
          e.kind === 'lift' && !e.dead &&
          p.x + 12 > e.x + 1 && p.x < e.x + e.w - 1 && Math.abs(feet - e.y) < 4);

        // Where does the ground run out, and does it come back within a jump?
        // Rows are scanned from 4 above his feet so a platform he could land on
        // counts as ground — on a lift over the void, everything is "hole"
        // except the island, which is a row higher than he is.
        let holeAt = null, backAt = null, backRow = null;
        for (let d = 1; d <= 8; d++) {
          let sup = false;
          for (let r = Math.max(0, feetRow - 4); r <= GROUND_ROW + 1; r++) {
            if (tileSolid(tx + d, r)) { sup = true; backRow = r; break; }
          }
          if (!sup && holeAt === null) holeAt = d;
          if (sup && holeAt !== null) { backAt = d; break; }
        }
        const holeSoon = holeAt !== null && holeAt <= 3;
        // The right edge of whatever he is standing on. Every reach in the
        // lift section is measured from here, not from where he happens to be
        // standing, because the hops are launched from the edge.
        const surfaceEnd = onLift ? onLift.x + onLift.w
          : (holeAt !== null ? (tx + holeAt) * TS : null);
        const reach = onLift ? 1.6 * TS : 4 * TS;
        const jumpable = backAt !== null && surfaceEnd !== null &&
          (tx + backAt) * TS - surfaceEnd <= reach;

        // a lift sitting close enough to the edge to be worth launching at
        const toLift = surfaceEnd === null ? null : w.entities.find(e =>
          e.kind === 'lift' && !e.dead && e !== onLift &&
          e.x + e.w > surfaceEnd && e.x - surfaceEnd < 2.5 * TS &&
          Math.abs(e.y - feet) < 3 * TS);

        // wall ahead?
        const aheadT = Math.floor((p.x + 16) / TS);
        let wall = false;
        for (let r = feetRow - 1; r > feetRow - 1 - Math.ceil(box / TS) - 1; r--) {
          if (tileSolid(aheadT, r)) wall = true;
        }
        // something to bounce off just ahead?
        const enemyAhead = w.entities.some(e =>
          (e.kind === 'yolk' || e.kind === 'cubie' || e.kind === 'shell' || e.kind === 'sprout') &&
          !e.dead && e.x > p.x && e.x - p.x < 34 && Math.abs(e.y - p.y) < 26);

        // A drop he cannot simply jump — the lift section. Approach it at a
        // walk and never take a wall/enemy jump into it: a full-dash arc from
        // five tiles out clears the whole void and lands on nothing.
        const voidAhead = holeAt !== null && holeAt <= 6 && !jumpable;
        if (voidAhead) B.keys.run = false;

        // How far the next landing actually is, measured from the launch edge.
        // Everything downstream keys off this: a 1-tile step and a 4-tile pit
        // want completely different jumps.
        const targetX = toLift ? toLift.x
          : (backAt !== null ? (tx + backAt) * TS : null);
        const targetY = toLift ? toLift.y
          : (backRow !== null ? backRow * TS : null);
        const gapPx = (targetX !== null && surfaceEnd !== null)
          ? targetX - surfaceEnd : 999;
        // A tap rises about 21px. Anything meaningfully above him needs the
        // full arc no matter how close it is horizontally — tapping at a lift
        // two tiles overhead just walks him off the edge.
        const shortHop = gapPx <= 2.5 * TS && targetY !== null && targetY >= feet - 10;

        // A stone-to-stone hop has to be launched from the edge, with a little
        // speed on but not much: from a standstill he covers nothing, and at
        // full dash with jump held he sails clean over the target while it
        // slides out from under him. Both were real failures here.
        const stoneHop = holeSoon && !jumpable && toLift;

        if (onLift && !jumpable && !toLift) {
          // riding: hold station with room to run up when the next stone comes
          B.keys.run = false;
          const mark = onLift.x + 14;
          if (p.x < mark - 4) B.keys.right = true;
          else if (p.x > mark + 4) B.keys.left = true;
          waitFrames++;
          why = 'ride';
        } else if (stoneHop || (onLift && jumpable)) {
          B.keys.right = true; B.keys.run = false;
          if (p.x > surfaceEnd - 25) {
            B.keys.jump = true; B.pressed.jump = true;
            holdJump = !shortHop;
            why = 'HOP';
          } else why = 'runup';
        } else if (holeSoon && !jumpable) {
          // nothing in position at all: stop at the edge rather than walk in
          B.keys.right = false; B.keys.run = false;
          if (p.vx > 0.1) B.keys.left = true;
          waitFrames++;
          why = 'wait';
        } else if (holeSoon || ((wall || enemyAhead) && !voidAhead)) {
          // Ordinary ground jumps always hold. A tapped jump does not clear a
          // 2-tile pit even though the arithmetic says it is "short".
          B.keys.jump = true; B.pressed.jump = true; holdJump = true;
          why = holeSoon ? 'JUMPgap' : wall ? 'JUMPwall' : 'JUMPenemy';
        } else why = 'run';

        // Last-resort guard: never be past the nose of the platform he is
        // standing on. Station-keeping alone loses this race when he lands
        // fast, and coasting off the front is an instant death in the void.
        if (onLift && p.x > onLift.x + onLift.w - 22 && why !== 'HOP') {
          B.keys.right = false; B.keys.left = true;
        }

        if (p.x > traceFrom) {
          trace.push(frames + ' x=' + p.x.toFixed(0) + ' y=' + p.y.toFixed(0) +
            ' vx=' + p.vx.toFixed(2) + ' | ' + why +
            ' hole=' + holeAt + ' back=' + backAt + ' jmp=' + (jumpable ? 1 : 0) +
            ' toLift=' + (toLift ? 1 : 0) +
            ' onLift=' + (onLift ? onLift.x.toFixed(0) : '-') +
            ' end=' + (surfaceEnd === null ? '-' : surfaceEnd.toFixed(0)));
        }
      }
      if (!p.grounded && p.x > traceFrom) {
        trace.push(frames + ' x=' + p.x.toFixed(0) + ' y=' + p.y.toFixed(0) + ' | air');
      }

      B.step();
      for (const k in B.pressed) B.pressed[k] = false;

      if (p.x > bestX + 0.5) { bestX = p.x; stuckFor = 0; }
      else if (++stuckFor > 1200) break;
    }

    clearKeys();
    B.dev.invincible = false;
    return {
      level: L.name,
      cleared: g.scene === 'clear',
      frames: frames,
      reachedX: Math.round(bestX / TS),
      poleX: L.skewerX,
      diedAtTiles: deaths,
      waited: waitFrames,
      stalled: stuckFor > 1200,
      trace: trace,
    };
  }

  function fmt(rows) {
    return rows.map(r => (r[3] ? '  ok   ' : '  FAIL ') + r[0] +
      '  = ' + (typeof r[1] === 'number' ? r[1].toFixed(3) : r[1]) +
      '  (want ' + r[2] + ')').join('\n');
  }

  function all() {
    const lines = [];
    lines.push('PHYSICS');
    const ph = physics(); lines.push(fmt(ph));
    lines.push('LIFTS');
    const lf = lifts(); lines.push(fmt(lf));
    lines.push('AUTOPILOT');
    const runs = [];
    for (let i = 0; i < B.levels.length; i++) {
      const r = play(i);
      runs.push(r);
      lines.push((r.cleared ? '  ok   ' : '  FAIL ') + 'counter ' + r.level +
        '  reached tile ' + r.reachedX + ' of ' + r.poleX +
        '  in ' + r.frames + 'f' +
        (r.waited ? '  (waited ' + r.waited + 'f)' : '') +
        (r.diedAtTiles.length ? '  died at ' + r.diedAtTiles.join(',') : '') +
        (r.stalled ? '  STALLED' : ''));
    }
    const pass = ph.every(r => r[3]) && lf.every(r => r[3]) && runs.every(r => r.cleared);
    lines.push(pass ? 'ALL PASS' : 'FAILURES ABOVE');
    const text = lines.join('\n');
    console.log(text);
    return text;
  }

  window.BAOTEST = { all: all, physics: physics, lifts: lifts, play: play, fmt: fmt };
  console.log('BAOTEST ready — BAOTEST.all()');
})();

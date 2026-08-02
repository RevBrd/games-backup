# Nebula Strike

A Galaga-style formation shooter whose hook is **weapon variety**: enemies drop glowing pickups
that swap your gun outright, and each of the seven fires completely differently. Neon-on-void
palette, crab-shaped enemies, tiny hand-drawn helmets when they armor up.

Source: `index.html` (~1110 lines, vanilla canvas, one file, no dependencies). Double-click to play.

---

## Read this first: nothing here is an authored defect

This game is played completely straight. It is a sincere arcade shooter and every bug in it is a
real bug — fix them freely.

This needs saying only because its sibling [DeadSpace](../DeadSpace/) is a parody of shovelware
where the broken-looking artifacts are the joke and must never be corrected. **That is the
exception across this collection, not the rule.** Assume any game is sincere unless its own
`CLAUDE.md` says otherwise near the top.

## Origin

The **first** game in the collection, built end-to-end in Claude Chat with Opus 4.8, before any of
the conventions in `~/.claude/reference/building.md` or `game-design.md` existed — those emerged
later, from other sessions, and were retrofitted into the reference files. So this game predates
its own rulebook and does not follow it. That is expected, not a defect.

It started as one request: *Galaga, but with weapon powerups.* The name, the neon-void styling,
the crab silhouettes, and the enemy helmets were all the model's own invention. Everything after
that was undirected iteration — playtest, add, rebalance, repeat — with no design document. It
accumulated rather than being planned.

**Trevor does not remember the design history. The code comments do.** They are unusually good and
they preserve reasoning that exists nowhere else. Read them before changing anything they touch:

- `index.html:180-182` — the whole game was slowed to 75% at some point, and dives separately to
  ~25% of their original rate. Both were deliberate.
- `index.html:483-485` — wingmen used to fire in tandem with the player and inherit PULSE/OVERDRIVE
  cadence. That was a bug; they now run their own slower clock.
- `index.html:719-722` — OVERDRIVE is suppressed on boss waves *and the wave before*, because its
  ~8s timer would otherwise carry in and delete the boss in seconds.
- `index.html:699-703` — a second OVERDRIVE pickup refreshes the timer instead of clobbering the
  weapon it reverts to.

There is no register of rejected ideas. Nothing is known to be off-limits.

## Status: unfinished, actively wanted

Not abandoned. The next real pass is the balance overhaul below.

---

## The balance problem: the player is far too strong

**This is the headline issue and it is the opposite of what the code looks like at first read.**
Runs reach wave 60+ and end because Trevor gets bored, not because he dies. A cold read of the
threat numbers suggests a punishing game; in play it is nearly impossible to lose.

Three structural causes, in order of how much they matter:

**1. You can outrun every projectile in the game.** Enemy bullets move at `4 * SPEED` = 3 px/frame.
The player moves at `6 * SPEED` = 4.5 px/frame — **50% faster than incoming fire**. A shot from the
gunner row takes ~3.4 seconds to reach the player's row, enough time to cross the 540px screen
twice. Boss bullets are slower still at 2.6 px/frame. Nothing can catch you and everything
telegraphs for seconds. *This is the load-bearing number. Fix it before anything else — otherwise
tougher enemies just mean shooting bigger things for longer while still being untouchable.*

**2. `SPEED` was applied unevenly and accidentally buffed the player.** `SPEED` (`index.html:181`)
scales world motion and player *movement*, but **weapon cooldowns are raw frame counts and are not
scaled** (`p.cool--` runs once per update). So slowing the world to 75% left the player's rate of
fire at 100%, raising effective DPS against the world by a third — in the very change meant to calm
the game down.

**3. Difficulty scaling partly cannibalizes itself.** After wave 20 the *only* thing that grows is
dive frequency (`index.html:534`). But enemies only shoot while `formed`, never while diving or
re-entering. A diving-capable enemy spends ~80% of its time in formation at wave 1 and ~28% at
wave 60. Gunners never dive (`noDive: true`) so they anchor a floor, and total incoming fire falls
only ~30% rather than collapsing — but the direction is wrong. **The difficulty knob reduces the
threat.** What it adds instead is dives that take 3.7 seconds to cross the screen and are dodged by
walking sideways.

Everything else is flat. Enemy count caps at 35 (7 columns × 5 rows) from wave 6 forever. HP scaling
ends completely at wave 20 when the last armor tier lands. `fireChance` never scales at all. Boss HP
is 120 at wave 10 and still 120 at wave 60. **Wave 60 is mechanically almost identical to wave 22.**

### Two traps for whoever does the balance pass

- **Weapon drops are already rare — do not nerf the drop rate.** It computes to ~0.9 drops per wave
  (`index.html:730`: 8.5% on brutes, 1% on everything else). If powerups feel constant, the cause is
  that weapons **never expire** — no ammo, no timer, no decay. One LANCE at wave 12 is still your
  gun at wave 60. The faucet is fine; there is no drain.
- **Fixing the multi-life-loss bug (below) makes the player stronger.** It currently costs lives
  unfairly, which is the only thing pushing in the desired direction. Land it *with* the balance
  pass, not before it.

### Weapon loss on hit

`hitPlayer()` (`index.html:749`) unconditionally resets you to Blaster. Best guess is that this was
a player nerf; the reasoning isn't recorded. It sits against the stated principle that *penalties
should constrain the fun loop, not remove it* — weapons are explicitly "the fun part" here, and this
removes them. **Not resolved.** Worth revisiting during the balance pass rather than defended or
deleted on sight.

## Known bugs

Real bugs, confirmed by code reading, none of them intentional.

- **Multiple lives lost in a single frame.** `index.html:640` — the `if (p.inv === 0)` guard is
  evaluated *once*, outside both collision loops. `hitPlayer()` sets `p.inv = 90` but the loops keep
  iterating. Two overlapping enemy bullets cost two lives. The boss's 5-way spread fires all five
  from one origin 0.22 rad apart, so taken point-blank it can cost **three-plus lives in one frame**.
  Never noticed in play because runs last so long.
- **`swift` stops spawning at wave 5 and never returns.** `nextWave()` (`index.html:378-386`): row 0
  becomes gunner at wave ≥5 and row 1 becomes brute at wave ≥3, so the `else if (r < 2)` branch that
  produces swift becomes unreachable. Its `armorWave: 12` is dead code — **armored swift has never
  appeared in any run.** There is no separate armored variant; `armored` is a boolean on the same
  object that doubles HP and draws the helmet.
- **`nearestEnemy()` (`index.html:596`) doesn't skip dead enemies**, so homing shots track corpses
  for a frame until cleanup.
- **Screen shake ignores `prefers-reduced-motion`** even though particles and stars respect it.
- **`drawCenterText()` is dead code.**
- **No touch controls**, despite a mobile viewport meta and a responsive wrapper. Unplayable on
  phones.
- `drawBoss()` comments the HP bar as "across the top of the canvas"; it draws at `H - 34`, the
  bottom.

## How it's built

One file, no assets, no build step. Everything is hand-drawn canvas paths.

- `index.html:181-182` — `SPEED` and `DIVE_SPEED`, the two global pacing knobs
- `index.html:202-262` — the seven weapons; each is an object with a `fire()` that pushes bullets.
  Adding a weapon is genuinely just adding an entry.
- `index.html:266-269` — `SUPER_INDEX`, `SUPER_DURATION` (480f ≈ 8s), `MAX_LIVES` (5), `BOSS_EVERY` (10)
- `index.html:294-300` — `ENEMY_TYPES`: hp, points, color, radius, per-frame `fireChance`, `armorWave`
- `index.html:334-337` — wingman offset and fire cooldown
- `index.html:361-393` — `nextWave()`, formation layout and per-row enemy type
- `index.html:397-430` — `updateBoss()`: sweep, 5-way spread, periodic minion bursts
- `index.html:715-738` — `maybeDrop()`, all drop rates
- Scoring: `points × comboMult()`, where the multiplier is 1 + `floor(combo/8)` capped at 4x, on a
  90-frame chain window. Drops are +50 each.

**Tuning values are scattered across six places**, against the current convention of keeping them
together. Hoisting them into one block is a worthwhile prerequisite for the balance pass.

## Format

Originally `Nebula Strike.txt`, which was misleading — unlike DeadSpace's `.txt`, this was always
plain HTML that any browser could run. Renamed to `index.html` (correct default page for a static
host; git history preserved through the rename).

Chat dependencies, one fixed and one remaining:

- **Fixed:** persistence used `window.storage`, the Claude Chat artifact API, which doesn't exist in
  a real browser. Guarded by `if (window.storage)`, so it silently no-opped — high score and best
  wave displayed 0 forever and never saved, with no error. Now plain `localStorage`
  (`index.html:1069-1088`), keys unchanged, verified round-tripping in-browser.
- **Remaining:** Google Fonts is a runtime CDN call (`index.html:7-8`). Works online, silently falls
  back to system monospace offline. Inlining the two fonts as base64 would make the file genuinely
  self-contained.

## Pending

- **Balance overhaul.** The main event. Projectile speed first, then scaling, then new enemy types.
  Trevor wants more enemy types with more HP; read the whole balance section above first, because
  that alone won't fix it.
- **Fix the known bugs**, timing the multi-life-loss fix with the balance pass.
- **Restore `swift`** to the wave composition.
- **Hoist the tuning constants** into one labeled block.
- Inline the fonts.
- Touch controls, if it should work on phones.

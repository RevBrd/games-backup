# Combat Circuit

Autonomous robot combat. You build the machine in the garage, you press GO, and then you are a
spectator. All the skill lives upstream of the fight.

**This game is sincere. Its bugs are real bugs — fix them freely.** There is no register of
authored defects here and there should never be one.

Spiritual descendant of the Flash game *Bot Arena*, not a replica. Shared DNA: parts with
weight/damage/reach, a chassis weight capacity that gates progression, escalating buy-in and
purse per tier, autonomous fights with visibly stupid AI.

## Tone

Straight-faced late-90s syndicated cable sports. Chunky skewed lower-thirds, a boxed digital
match clock, chevron arena borders, an overexcited caption crawl. Earnest, never winking — the
comedy comes from the robots being bad at their jobs, not from the presentation making fun of
itself. No parody, no fourth wall. Nostalgic for the real *BattleBots* without ever naming it.

## Files

- `combat-circuit.html` — the whole game, self-contained.
- `validate.js` — headless Node harness. Run before delivering:
  `& "C:\Program Files\nodejs\node.exe" validate.js` (node is installed but **not on PATH**).

## Architecture

Four layers with hard boundaries. The separation is load-bearing, not decorative.

1. **Tuning** (`const T`) — every balance-relevant number, one block, near the top.
2. **Parts catalog** (`const PARTS`) — pure data. Balance is editing this table, never code.
3. **Sim** — `makeWorld` / `stepWorld`. Fixed 120Hz timestep, seeded `mulberry32`, zero DOM
   awareness. Deterministic: same seed and same builds give a byte-identical result.
4. **Render + UI** — reads sim state, never writes it.

`runHeadless()` runs a full match with no rendering in ~10ms. The Lab tab uses it to play
hundreds of matches and report win rate. **This is the main advantage of the genre — because
combat is autonomous, balance is directly measurable rather than guessed.** Keep the sim
DOM-free so it stays true.

**The sim is N-vs-M throughout**, even though the garage currently builds one bot per side.
Targeting picks from a list, win conditions count team survivors. The intended end state is a
per-team weight budget the player fills however they like — one tank or three cheap ones — so
never hardcode 1v1.

## Systems built

- **Component damage.** Every part has its own integrity. Armour absorbs first, the remainder
  routes to a random surviving component weighted by part weight. Weapon dies → stops working.
  One of two drives dies → halved power plus a steering bias that pulls the bot to one side.
  Both die → immobile. Chassis at zero → destroyed.
- **Three win conditions.** Knockout, immobilisation (10-count), judges' decision on a 5-3-3
  damage/aggression/control card at the 60s bell.
- **Behavior chips.** The bot's doctrine — targeting and approach — as a weighted, purchasable
  part. Charger, Wedge Doctrine, Circler, Scavenger, Coward. This is the design centrepiece:
  the AI's stupidity is *authored by the player*, which is what converts "no agency during the
  fight" into "agency moved upstream."
- **Clunk comes from two places, both deliberate.** A slow decision tick (`T.REACT_MS`, 260ms)
  so bots commit to bad choices, and simulated drivetrain physics — forward thrust, torque, hard
  lateral scrub — so they arc and overshoot. `T.DECISION_NOISE` is tiny and applied only at
  decision time. **Do not add per-frame jitter.** Random noise reads as a broken game; slow
  decisions plus real physics read as a bad robot. That distinction is the whole feel.
- **Targeting Unit** module halves the reaction interval. Buying your bot a clue is a purchasable
  stat, which is a better upgrade axis than another point of damage.
- **Arena hazards** — floor saws, dev-toggleable, off by default.

## Not built yet

Economy, shop, progression, repairs, rival roster, scouting, multi-bot teams, weight classes as
tiers, custom programmable chips, persistence. Pass 1 answers one question only: *is an
autonomous fight legible and fun to watch?*

## Design commitments made and why

- **Repairs are the economy's teeth.** Damage persists between matches and costs money to fix,
  so winning ugly can lose money. This kills low-tier grinding without an artificial cap, and it
  makes "did I overbuild for this fight?" a live question every match.
- **Named rivals with consistent build philosophies, plus a purchasable scouting report.** Turns
  the garage phase from stat-maxing into counter-building. This is what makes players form
  theories about the game instead of shrugging at outcomes.
- **The count is on *controlled* movement.** A bot with no live drive being shoved around by the
  opponent still counts out. Fixed once already — don't reintroduce a pure velocity check.

## Open design questions

- **Match length may become per-tier rather than fixed at 60s.** Trevor's idea: later rounds run
  longer, so with repair costs in play surviving the distance is itself a wallet drain. Endorsed —
  it makes the clock a difficulty axis instead of a constant. `T.MATCH_SEC` is already a per-world
  parameter (`makeWorld(..., {matchLen})`), so nothing needs restructuring to support it.
- **Chip counters.** Charger beats Circler badly right now — the Circler presents its rear while
  fleeing and gets rammed the whole match. Leaving it: a rock-paper-scissors layer where each
  doctrine has a specific predator is a *feature* for counter-building, and the rival roster is
  what will make that knowledge worth having. Revisit once there are more chips to triangulate
  against, not before.

## Known placeholder balance

All numbers are placeholders; the holistic tune is deferred until the systems exist. What the
batch harness already shows, for whoever picks this up:

- Average match is ~20s of a 60s clock. Fights end too fast.
- Only ~5% reach the judges' cards, so a whole win condition almost never fires.
- Spinners massively outclass every other contact weapon (drum dealt 444 damage in a window
  where the bar saw dealt 10). Sustained-contact weapons need either more DPS or a chip that
  actually maintains contact.

## Dev controls

`Space` fight/pause · `R` reset · `.` step · `1`–`7` sim speed · `H` hitboxes and weapon arcs ·
`V` intent vectors · `Z` hazards · `N` new seed · `B` batch 200 matches.
Live telemetry per bot on the Dev tab: velocity, angular velocity, throttle/steer, drive count,
spin state, weapon cooldowns, damage dealt and taken.

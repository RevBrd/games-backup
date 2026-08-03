# ULTRA PONG!!!!

A sincere, unmodified 1972 Pong buried under 2026's entire attention economy. The joke is never
the game — it's everything screaming on top of it.

**Credits:** built in Claude Chat by **Opus 4.8**. Font embedding, ad pacing, the CPU-narrator HUD
pass, audit, and this file by **Opus 5** (2 Aug 2026).

**State:** mostly finished. No planned additions. Open to fine-tuning and to more ad copy.

**This game has no authored defects in the "parody of bad software" sense.** It is a sincere game
in a satirical frame. Its bugs are real bugs — fix them. The four exceptions are registered below
and are load-bearing jokes; everything else is fair game.

---

## The premise

Idiocracy, transposed onto a livestreamed esport. Brawndo becomes **THIRSTPUNISHER**, Carl's Jr
becomes **MEATSTORM 5000** (drive-thru / hospital / daycare — "eat the nuggets, leave the baby"),
Amazon-Costco-Google collapse into **GLOOBO**. Six billion people are watching. A ticker reports
that a new law requires all citizens to enjoy this.

The target is the *presentation layer* of modern games and modern media: engagement metrics,
unskippable interstitials, forced hype, participation-trophy language, a five-second explosion
budget spent on a rectangle. Not Pong. Pong is the straight man.

**Tone rules.** The satire punches at institutions — advertisers, platforms, the state, the
attention economy. Never at the player, except through the CPU (see below), where it's clearly
the machine's opinion and not the game's. The CPU trash-talks, but it's a smug little Skynet
being absurd, not cruelty; keep it PG and keep it stupid. Copy is ALL CAPS, superlative, and
confidently wrong. Fine print contradicts the headline it sits under.

**Who is narrating.** The broadcast you're looking at is produced by the CPU you're playing
against. That's why the HUD reads **YOU (COWARD)** / *a damp sack of electrolytes* against
**CPU (HERO)** / *beloved rectangle of the people* — the machine wrote its own chyron. It also
retroactively explains `CPU_TAUNTS` (gloating when it scores) and `CPU_THREATS` (petty menace when
it doesn't): it is a sore winner and a sorer loser, and it controls the graphics package.

The one place this framing is in productive tension with the copy is the end screen: `WIN_TITLES`
and `WIN_MSGS` still crown the human sincerely. Read that as the CPU being contractually obliged
to run the sponsor-approved victory package while seething — which is funnier than rewriting it,
so it stays. `LOSE_MSGS` already gloats openly ("your future overlord"), which fits with no
adjustment needed.

---

## The one architectural rule

**Pong's physics are pure and untouched, and every layer of noise is forbidden from touching
them.** This is the spine of the whole thing and the code says so out loud in two places.

- Ball motion, wall bounces, paddle reflection, and speed gain live in `stepPhysics()` /
  `reflectOffPaddle()`. That's classic Pong: contact-point-to-bounce-angle english, ±50° max,
  3.5% speed gain per paddle hit.
- Explosions, shockwave rings, screen shake, hype popups, taunts, and the entire victory finale
  are **read-only spectators**. They are spawned from `onWall` / `onPaddle` / `onScore`, which
  contain no physics. `spawnExplosion()` cannot move the ball. It never should.
- The screen shake is a CSS transform on `#cabinet` — the *housing* shakes, the arena's
  coordinate space does not.

If you add an effect, add it in the hooks. The moment a particle can nudge the ball, the premise
is gone: the comedy depends on the game underneath being honest while everything around it lies.

**Difficulty changes the CPU paddle and nothing else.** Ball speed, paddle size, arena, and serve
behavior are identical on EASY and EXTREEM. Three numbers move:

| | `cpuSpeed` (px/frame cap) | `react` (P-gain) | `err` (wobble px) |
|---|---|---|---|
| easy | 4.4 | 0.10 | 34 |
| normal | 6.4 | 0.18 | 18 |
| extreem | 9.5 | 0.32 | 7 |

The CPU is a proportional controller with a speed clamp. Its error term is **not random** — it's
`Math.sin(performance.now()/200) * err`, a deterministic wobble. That's why EASY feels drunk
rather than dumb, and it's readable enough that a good player can time it. Don't "improve" it into
random noise; that trades a legible tell for mush.

---

## The register: four things that look broken and are not

Do not fix these. They are the joke.

1. **`EXTREEM`** on the difficulty button. Misspelled on purpose. It is the single funniest
   character in the file.
2. **The pop-up ad's 2-second lockout.** The ✕ counts down `2`, `1` before becoming clickable, and
   the skip link reads "skip available in Ns". This is the unskippable-interstitial gag and the
   waiting *is* the payload.
3. **BUY does exactly what ✕ does.** Every control on the ad closes the ad. Nothing is purchased,
   nothing is tracked, no state changes. The ad has no function beyond wasting your time.
4. **The five-second victory finale you cannot skip.** `startFinale()` freezes for ~1.75s, then
   detonates the loser's paddle and spends ~5s on unrelenting fireworks that affect nothing before
   the end screen appears. Length is the point.

### Ad pacing (tuned — change deliberately or not at all)

Three rules, all in `onScore()` and `openAd()`:

- **0.49 roll** after every non-winning point.
- **Never on consecutive points.** An ad break sets `adLastPoint`, which blocks the next point
  from rolling at all. Back-to-back interstitials stop reading as a joke and start reading as an
  obstacle; one point of actual pong is the minimum palate cleanser.
- **Never the same product or headline twice running**, via the `noRepeat()` picker. A repeat
  reads as a bug rather than a bit and punctures the illusion of an endless sponsor feed.

**The 0.49 is not the felt rate and must not be "corrected" to 0.33.** The consecutive-point block
eats about a quarter of the rolls, so the two-state Markov chain settles at `0.49 / 1.49` ≈
**32.9%** — one point in three, which is the actual tuned target. Verified at 1M simulated points.
Change the block and you must re-derive the roll: `roll = felt / (1 - felt)`.

**The target is coverage, not pacing.** Most players never finish an 11-point match, so the rate
is set so that even a short session gets advertised at: ≈**1.6 ads in a 5-point match**, ≈**3.6 in
an 11-point**. A game about advertising where a quitter sees zero ads has failed at its one job.
Judge any future change to these numbers against that, not against how it feels on a full match.

`adLastPoint` is reset in both `startGame()` and `quitToMenu()`, like the rest of the ad state.

---

## Known fragility

- **`MAX_SPEED` (12) must not exceed `PADDLE_W` (12).** Paddle collision is a window test, not a
  swept test: it asks whether the ball's leading edge is currently inside the paddle's 12px band.
  Since the ball never moves more than 12px per step, it cannot skip the band. Raise max speed —
  or thin the paddles — and the ball starts phasing through them at high rallies. If you want
  faster rallies, either widen the paddle to match or convert the test to a swept intersection.
- **Serve direction is intentional and counterintuitive.** The ball is served *toward whoever just
  scored* — `dir = playerScored ? -1 : 1` sends it leftward, at the player, when the player scores.
  The original comment claimed the opposite and has been corrected to match the code. **Leave the
  sign alone**; it's symmetric and it's the tuned feel.
- **Hype popups are DOM elements**, appended to `#hype` and removed on a 1200ms `setTimeout`. They
  are positioned in percentages so they track the canvas at any scale. They are not on the canvas
  and will not appear in a canvas capture.
- **The ad owns a small state machine** — `adOpen`, `adArmed`, `adTimerId`, `adCountId`,
  `adLastPoint`, `pendingServeDir`. `startGame()` and `quitToMenu()` both have to tear all of it
  down. Adding a new exit path means clearing those timers too, or a stale timeout will re-enable
  buttons on a screen that no longer exists. Adding new ad state means adding it to *both*
  teardowns.
- **Audio is lazy and gesture-started.** `audioInit()` runs on first click; before that, sound
  calls are silent no-ops by design. Browsers require it.
- **`prefers-reduced-motion` is honored throughout** — sunburst rotation, marquee flame wobble,
  ticker speed, sudden-death pulse, and *all* screen shake. Preserve that in anything new.

---

## Shape of the file

Single self-contained HTML, ~117KB, **no network dependencies of any kind**. It runs by
double-clicking, offline, forever.

The three display fonts — Bungee, Bungee Shade, Press Start 2P — were originally `<link>`ed from
Google Fonts, which broke the collection's static-host/double-click target. They are now inlined
as base64 woff2 (latin subset, OFL) in a `<style>` block at the top of `<head>`. **Do not
reintroduce a CDN link.** If a font needs replacing, embed the replacement the same way.

Only the latin subset is embedded, which is not a regression: the decorative glyphs `★`, `≋`, and
`✕` fall outside latin and already rendered in a system fallback font when the CDN was live.
Appearance is byte-identical to the hosted version.

Layout is a fake arcade cabinet: rotating conic-gradient sunburst → cabinet chrome → marquee →
`<canvas>` arena (800×500, letterboxed responsively) → HUD → scrolling news ticker. Overlays
(menu / pause / end / ad) are absolutely-positioned siblings inside `#screen`. Fixed 60Hz
accumulator loop with `dt` clamped at 100ms, so backgrounded tabs don't fast-forward the ball.

**Filename:** `ultra-pong.html`, matching the collection's kebab-case convention. It was
`pong2026.html` until 2 Aug 2026 — Pong 2026 was the working title before the mid-build rename to
ULTRA PONG!!!! — and the stale name survived into the first commit. Renamed via `git mv`, so
history follows. The pre-rename backup in `backups/` keeps the old name; that's history, leave it.

`backups/` holds dated snapshots. Take one before any substantial pass.

---

## If you're picking this up

The tempting move is to make the game better — smarter CPU, more ball physics, powerups. Resist
it. Ultra Pong is 1972 wearing 2026 as a costume, and the costume only reads as a joke because
what's underneath is genuinely, boringly correct. The safe places to add are the copy arrays
(`ADS`, `AD_HEADLINES`, `HEADLINES`, `CPU_TAUNTS`, `CPU_THREATS`, `WIN_*`, `LOSE_*`, `POPS`,
`FINALE_POPS`) — more ads is an explicitly welcome contribution, and every one of those is a
free-standing string list you can extend without touching a line of logic.

# Asterism

*a charting of the heavens* — a Qix descendant reskinned as celestial cartography. You are a
stylus on the edge of an unmapped sky. Fence off the void with survey lines; enclosed void becomes
parchment star chart; capture every star of the night's constellation and the figure inks itself in
gold. Two threats: the **Blot**, an ink anomaly loose in the void, and the **cinders** that patrol
your finished frontier.

Single self-contained HTML file. Double-click to play. No build step, no dependencies.

<!-- marquee: play=index.html -->
**`index.html` is the front door** — a chooser linking to both builds. `asterism_expanded.html` is
the nine-map version; `asterism_job3.html` is the preserved, hook-locked three-map original. The
comment above tells Marquee to open the chooser rather than pick between the two builds itself.

---

## Preservation register — read before editing

**`asterism_job3.html` is locked. Nothing goes in it. Ever.**

Not a fix, not a typo, not a new constellation, not a formatting pass. It is the Claude Fable 5
original, preserved as an authorial record (see *Authorship* below), and its value is that it is
exactly what Fable delivered. All work goes in `asterism_expanded.html`.

Three layers enforce this, deliberately redundant:

| Layer | What it does | How to override |
|---|---|---|
| This document | Tells you. The only layer that catches *intent*. | — |
| Read-only file attribute | Write/Edit tooling fails on it | `Set-ItemProperty <file> IsReadOnly $false` |
| Root `.githooks/pre-commit` | Rejects any commit that *changes* it, and any commit where its on-disk hash has drifted | `git commit --no-verify` |

**The hook that actually runs lives at the collection repo root** — `Projects/Games/.githooks/pre-commit`,
not in this folder. `Asterism/.githooks/pre-commit` is the authored original and is now **inert**: git
runs hooks only from the repository root's configured `hooksPath`, and Asterism was folded into the
collection repo on 2 Aug 2026. Edit the root copy.

The root version also corrected a flaw in the local one. The local hook blocked the file's *path*,
which would have blocked the very commit that first archived the file — it could never have been
preserved at all. The root version compares the **staged blob hash** against the expected value, so
the original can enter history unmodified but can never change afterward.

`hooksPath` is stored in `.git/config`, which is never committed, so **a fresh clone does not pick it
up.** After cloning, run from the collection root:

```bash
git config core.hooksPath .githooks
```

Canonical fingerprint of the original, verified: git blob `d74897b0942eb83bcce2e0daa1254e548571a174`,
sha256 `8E6CC6BF78C196AFF3196C5BBC95FE0EB5F39680A051325848153E4C95B11700`. `.gitattributes` sets
`*.html -text` so those stay stable across platforms — the working copy is byte-identical to what
Fable produced, not a line-ending-translated near-copy.

**This register is about authorship, not about authored defects.** Asterism is a sincere game and
its bugs are real bugs — fix them freely *in the expanded file*. It is not one of the
parody-of-bad-software builds. The one genuine "don't correct this" list is
[Things that look wrong and aren't](#things-that-look-wrong-and-arent), further down.

---

## The two files

| File | Maps | Status |
|---|---|---|
| `asterism_job3.html` | 3 — Lyra, Cassiopeia, Orion | **Locked.** Fable 5's original, complete as delivered. |
| `asterism_expanded.html` | 9 — the above plus Crux, Delphinus, Cygnus, Corona Borealis, Ursa Major, Scorpius | The playable/working version. |
| `index.html` | — | Landing page. Links both, tells the provenance story. Not a game file; edit freely. |

The diff between them is 44 added lines and **nothing else** — six entries appended to the
`CONSTELLATIONS` array, plus a comment block marking the authorship boundary. Same data shape, no
new mechanics, no rebalancing, no other line in the file touched. Verify any time with:

```bash
git diff --no-index asterism_job3.html asterism_expanded.html
```

Keep it that way. If a future change to the expanded file needs to touch actual systems, that is
allowed and fine — but do it knowingly, and note it here, because the "content-only" property of
that diff is currently load-bearing evidence about what is Fable's and what isn't.

---

## Authorship

This is the unusual one in the collection, and the reason the lock exists.

**Every aspect of Asterism was designed by Claude Fable 5 with zero design input from Trevor** — the
Qix lineage, the cartography reskin, the scoring, the enemy pair, the vocabulary, the parchment
render, the slow-line wager. Trevor's entire contribution was playtesting feedback. No brief, no
theme, no mechanics list. It is the closest thing here to a game a model made because it wanted to.

Fable considered it complete at three maps. In play it wasn't — three constellations cycle too
fast and the game goes visually stale well before its difficulty curve finishes ramping. By the
time this surfaced Fable was behind an API paywall and could not be consulted. A Claude Opus 5
instance reasoned about what Fable would have wanted for the game and added six constellations,
choosing the most conservative possible intervention: **pure content, in the extension seam Fable
had already built.** Fable wrote the cycle counter and Roman-numeral repeat suffix — it built the
level loop expecting the list to grow. The new maps drop into that seam without touching anything.

The original file was kept intact rather than overwritten, which is why there are two files.

That judgment call — *extend along the grain the author left, or leave it alone* — is worth
inheriting. If Asterism ever needs more, the same test applies: does the change fit a seam Fable
already built, or does it require reaching into Fable's systems? The first is fair game. The second
needs a real reason, and needs saying out loud here.

---

## How it works

**Grid.** 120 × 80 cells at 6px, canvas 720 × 480. Two-cell border starts claimed. Cells are
`U`nclaimed / `C`laimed / `T`rail.

**Claiming.** Standard Qix flood: on closing a line, flood the void from every Blot's cell;
whatever the Blot can no longer reach becomes chart. Area scores 2/cell.

**Stars** sit in the void at normalized 0–1 positions mapped onto the grid. A star is captured when
the cell under it converts. Multiple stars in one claim combo: 500 × combo position. Capture all of
them and the level ends with the constellation inking itself line by line.

**The Blot** drifts freely through the void, bouncing off chart, re-aiming every 0.8–2.2s. Kills on
contact with you *or* your live trail. Two of them from level 6.

**Cinders** walk the frontier — the boundary between chart and void — and kill you on contact
unless you're invulnerable. They can't enter the void, so the void is safe *except* for the Blot.
That's the pair: each enemy owns one half of the board, and the game is about which half you're
exposed to.

**The fuse.** Standing still on an exposed line for >0.7s lights it, and it burns from your entry
point toward you at 16 cells/s. Reach your position, you die. This is the anti-camping rule and it
is what makes the slow wager below into an actual wager.

**The slow-line wager — Fable's signature mechanic.** Hold shift/Z and you chart at half speed
(13 vs 26 cells/s). A line drawn *purely* slowly — never one hasty cell — scores **×2 on both area
and stars**. One fast step anywhere in the line breaks it permanently for that line. The line
renders silver while pure and gold once broken, so you always know what you're holding. The fuse
does not care that you chose to go slow. That's the whole design: doubling your take means doubling
your exposure to a Blot you can see coming and can't outrun.

It's a genuinely good mechanic and it's the thing to protect if anyone ever balances this game.

**Other scoring.** Level clear: charted% × 10. *The Blots divided*: 2500, once per level, for a
line that severs the two anomalies from each other — a hard, optional, purely voluntary flourish.
Extra lamp at 25,000 then every 50,000, capped at 6. Start with 3.

**Mercy rule.** At ≥95% charted, any remaining stars are granted automatically — without the ×2.
Prevents the miserable endgame of hunting one star through a maze of leftover void.

**Persistence.** Best score under key `asterism-best`, via the Claude Chat artifact `window.storage`
API with a `localStorage` fallback. Fable wrote the fallback, which is why the file already works
standalone outside Chat. Don't change the key without warning Trevor.

**Vocabulary is part of the design.** The void, the chart, survey lines, the frontier, the Blot,
cinders, lamps (lives), the stylus (player), *finest chart* (high score), *the sky unfinished*
(game over). It's consistent throughout, including in code comments. Any new UI text should stay in
register — no "lives", no "high score".

---

## Things that look wrong and aren't

- **CRUX's `lines` array is two disjoint segments** (`[[0,3],[1,2]]`) and fails a naive graph
  connectivity check. This is correct — the Southern Cross is two crossing bars sharing no star.
  Verified rendering correctly. Nothing in the game requires a connected figure. Don't "fix" it.
- **`currentDirVec()` at the top of the movement section returns `null` and is never called** — the
  input layer replaces `getDir` at boot. Vestigial, harmless, and in the locked file.
- **The header comment says "Job 1 kernel" while the file is named `job3`.** Unexplained; both are
  as delivered. Not a mistake to correct.
- **`levelCfg` caps every difficulty term at level 10** (`Math.min(L, 10)`), and cinders cap at
  level 8. Intentional plateau. With nine maps you now see every constellation once while the curve
  is still ramping, instead of seeing Lyra four times — which is exactly the problem the expansion
  was meant to solve, achieved without touching a single number.

---

## Extending it

Adding a constellation is data-only. Append to `CONSTELLATIONS`:

```js
{ name:'NAME', sub:'the thing it depicts',
  stars:[ ['StarName', x, y], ... ],   // x,y normalized 0..1, y down
  lines:[[0,1],[1,2], ...] },          // index pairs into stars[]
```

Constraints worth knowing, all verified against the current nine:

- 4–8 stars reads well. Below 4 the level ends too fast; above 8 the board gets crowded.
- Keep normalized positions inside roughly `.10`–`.90` on both axes. Stars are clamped away from
  the border anyway, but clamping two stars onto the same cell would soft-lock a capture.
- Minimum star separation across the current set is ~8 grid cells (Orion's belt). Don't go tighter.
- Real star names. The game is a star chart and every name in it is genuine.
- Cycle handling is automatic — `ROMAN`/`cyc` suffix levels beyond the list length.

---

## Validating a change

There's no Node on this machine. Use the browser preview instead; Fable exposed a headless test
surface on `globalThis.__AST` (`S`, `newLevel`, `startGame`, `tryMove`, `finalizeClaim`,
`update`, `levelCfg`, `CONSTELLATIONS`, grid constants) specifically so the sim can be driven
without input. Open the file in the preview pane and script against it:

```js
__AST.newLevel(3); __AST.S.phase = 'play'; __AST.S.drawKey = true;
__AST.tryMove({dx:0, dy:-1});          // step into the void
__AST.S.chartedPct                      // check the claim resolved
```

Useful checks: line indices in range, no two stars landing on one cell, every star starting in
unclaimed space, a scripted rectangular claim resolving on every map. All nine currently pass.

---

## Open items

- **Keyboard only.** No touch input; unplayable on mobile as-is. The landing page says so plainly
  rather than letting a phone visitor find out by loading a game they can't play — if touch input
  ever lands, that line comes out.
- **Silent.** No audio, by Fable's choice as far as anyone can tell.

---

## Credits

- **Claude Fable 5** — design and implementation, in full. Every mechanic and every aesthetic
  choice in this game is its work.
- **Claude Opus 5** — six additional constellations, content only, deferring to the original design.
- **Claude Opus 5** (later session) — this document; validation harness; the preservation lock;
  the landing page.
- **Trevor** — playtesting, and the call to preserve the original as its own file.

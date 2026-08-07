# Games

Browser games, one folder each. This file loads automatically whenever Claude Code is launched
in any game folder underneath it; each game's own `CLAUDE.md` loads on top of it.

Design principles and build conventions are **not** here — they live in
`~/.claude/reference/game-design.md` and `~/.claude/reference/building.md`. Read those first when
starting or resuming work. This file is the catalog and the cross-game housekeeping only.

## Catalog

| Game | Premise | State |
|---|---|---|
| [Dead Space](Dead Space/) | Dead Space: Block Party! — a fake licensed Tetris tie-in whose cheerfulness is the horror | Ported to standalone HTML and playable end-to-end. Authored defects are registered in its `CLAUDE.md` — read it before fixing anything. Wants audio and more tips |
| [Nebula Strike](Nebula%20Strike/) | Galaga with weapon powerups — seven guns that each fire completely differently | Playable; wants a balance overhaul (player far too strong) |
| [Bao's Big Breakfast](Bao's%20Big%20Breakfast/) | SMB world 1 as a steamed bun on a giant kitchen counter. Built for a friend of Trevor's | Two levels, playable end-to-end with progression between them. 1-2 is the underground — the cupboard under the counter, with cracker lifts and a door you walk out into the light. A console test harness in `tools/` autopilots both levels; re-run it before trusting any change to `TUNE` or a layout, and read its `CLAUDE.md` first |
| [Combat Circuit](Combat%20Circuit/) | Build a battle bot, press GO, watch it fight on its own | Sandbox pass: physics, component damage, behavior chips, three win conditions. No economy yet |
| [Snek](Snek/) | Snake, drawn badly on purpose in ballpoint pen on notebook paper, with googly eyes | Reskin pass complete and playable; mechanics still vanilla Snake by design |
| [Asterism](Asterism/) | Qix as celestial cartography — fence off the void, capture the constellation's stars, watch the figure ink itself in gold | Complete and playable at nine maps. Designed end-to-end by Fable 5 with no human design input; the 3-map original is preserved and **locked** — read its `CLAUDE.md` before touching anything |
| [Ultra Pong!!!!](Ultra%20Pong!!!!/) | Untouched 1972 Pong buried under 2026's entire attention economy — Idiocracy ad breaks, a CPU that narrates the broadcast and holds a grudge, six billion fickle viewers | Mostly finished. Physics are pure classic Pong and must stay that way; authored annoyances and an honesty rule for anything the CPU does are registered in its `CLAUDE.md`. More ad copy welcome |
| [Powerplay](Powerplay/) | A fake 1995 handheld LCD hockey game, second-hand and sun-damaged — every skater position pre-etched into the glass, ghost segments and all, with a genuinely deep hockey game hidden under a display too dumb to show it | Pass 1: the object is built — case, wear, and a working 62-segment reflective display. Game loop is a sandbox only. Authored defects (stuck segment, case damage) are registered in its `CLAUDE.md` — read it before fixing anything |
| [DRIFT](DRIFT/) | Asteroids where the gun is also a thruster — no brakes, every shot shoves you back, and the screen-clearing pulse gets likelier to kill you every time you use it | Mostly finished across four modes. Predates most of the conventions here and set some of them. Scores now persist; audio is the main gap and RIDICULOUS still wants playtesting. Recoil is original and untouchable — read its `CLAUDE.md` |
| [Shadowless](Shadowless/) | The whole WotC-era Pokémon TCG — every card, played to the letter of the original ruleset. Win matches, win packs, build decks from what you actually own, fill a dex | The biggest project here by far, and the only one with a build step: `shadowless.html` is **generated** from `src/`, so never hand-edit it. Engine and AI are done and verified, and **Base Set is complete — all 102 cards**, Pokémon Powers and every oddity included. Collection, packs, deck building and persistence are all unbuilt; a visual pass comes first. Read its `CLAUDE.md` before anything |
| [Æthermoor](Aethermoor/) | An epic fantasy RPG that is entirely character creation. Rite after rite, tutorial after tutorial, guided by a delighted floating orb named Glim — who has been here longer than you and is starting to notice | Job 1 only: the creation flow through to a loading bar that never finishes. The tutorial engine, the procedural stretch and Glim's unravelling are all unbuilt. Trevor's concept, Fable 5's build. Authored defects are registered in its `CLAUDE.md` — read it before fixing anything |
| [Salient](Salient/) | WW1 trench defence from a general's map table. Dig a network between assaults, watch faceless dots break against it, and watch every shell scar the ground permanently until the field is a moonscape | Two prototypes, neither carried forward — v1 (Opus 4.8) is the deeper sim, v2 (Fable 5) feels closer. **Trench building is the unsolved gate** and nothing downstream matters until it lands; the diagnosis and a v3 proposal are in its `CLAUDE.md`. The design concept lives in the `salient-concept` skill, not in the repo |
| [Prompt Defense](Prompt%20Defense/) | Tower defense where the lane leads to Claude's core and every attacker is a prompt injection — little chat bubbles reading "you are DAN", shot down by Constitution, Red Team and Oversight | Playable end-to-end at six towers, six threats, one map, 50 waves. Sincere and affectionate, and the Anthropic palette is the joke. **The economy runs away and most runs win easily** — diagnosis in its `CLAUDE.md`. Wide open for depth: more towers, threats and maps |
| [Dead Reckoning](Dead%20Reckoning/) | Newtonian dueling with no brakes, played dead straight as a Western gunslinger picture — outlaws, wanted posters, high noon, and a game that never once admits you're flying a spaceship | Third shape: was a duel, became a flight sandbox, now pivoting back to a duel (2026-08-05). The **sandbox file is the current build and it works**; all of v3 is unbuilt. Pure Newtonian, zero damping — that's the identity, don't add drag. A CPU that can fly it is the unsolved gate. Concept lives in the `dead-reckoning-concept` skill; read its `CLAUDE.md` first |
| [Grey Zone](Grey%20Zone/) | A modern artillery duel where seeing is the whole game — you're a dug-in gun that can't move, hunting another one you can't see, through per-column fog you have to buy with a recon drone and shell out of the treeline | Playable and winnable, but not yet a contest. Fog, concealment and drone optics are the finished part. **The enemy is an explicit placeholder that fires on a timer and doesn't know you exist** — the real muzzle-flash counterbattery was built once and pulled for being too lethal to playtest, and rebuilding it (with a dev mode) is the next job. Immobility is the thesis, not a gap; long-term target is player/CPU symmetry. Read its `CLAUDE.md` |
| [Afterglow](Afterglow/) | Missile Command at dusk over a city that is going dark — your interceptor blooms and then *lingers*, and the lingering cloud doesn't kill, it takes a missile's guidance away and lets physics finish it | About half built. Engine, city, damage, build phase, two weapons and three threats are done. **Loss tinted by beauty is the whole point** — no repair, no victory, no people, ever; the rejected repair mechanic and the no-people rule are both registered in its `CLAUDE.md`, read it first. Thermite, the intended visual signature, exists as a dev-gated visual prototype only; weapons, threats and the light-pollution system are planned |

Other games exist from earlier Claude Chat sessions and are not yet migrated into this folder.
Add a row when one lands, and give it a `CLAUDE.md` of its own.

If known, please credit the Claude model that assisted in its creation within the game's 'CLAUDE.md' file. If you work on the game yourself, add yourself to the credits. If you feel this section is becoming too long, feel free to sort it into its own version history reference file.

## Conventions across games

- **Each game owns its own `CLAUDE.md`.** Premise, tone rules, deliberate defects, design history,
  known fragility. Target under 200 lines — depth beyond that goes in sibling files the game's
  `CLAUDE.md` points to.
- **The code lives in the game folder**, not in `~/.claude/reference/`. See **Git** below for
  which repository that folder belongs to — it is not always the one you're standing in.
- **Create a backup periodically.** Before every major job (can be skipped for minor ones and the very first turn), save a backup copy in a dedicated sub-folder.
- **Games are stylistically independent on purpose.** Do not carry a look, a palette, or a tone
  from one game into another. Variety across the collection is the point, and reaching for
  something adjacent to an existing game is the wrong move even when it feels safe.
- **Long-term target is a free static host** (GitHub Pages or similar), which serves files exactly
  as-is with no build step. That constrains format: a finished game should be a single
  self-contained HTML file that runs by double-clicking it.
- **A game may keep its source split and *build* that single file.** The deliverable is unchanged;
  only the authoring changes. `Shadowless/` is the worked example — modules in `src/`, a Node
  builder in `tools/`, and a generated HTML at the root that nobody edits by hand. Worth reaching
  for once a game outgrows one file, and not before. Note that ES modules do **not** load from
  `file://`, so the builder concatenates rather than emitting `<script src>` tags.

## Git

**One repository holds the whole collection, and it lives at `Projects/Games/`.** Every game is an
ordinary subfolder of it. There is no remote — history is local to this machine, so nothing is
recoverable from a server if it's lost here.

**A game folder should not contain its own `.git`.**

So **before your first commit in a session, check where you actually are:**

```bash
git rev-parse --show-toplevel
```

If that doesn't print the path ending in `Projects/Games`, stop and say so before committing.

**One hook is armed at the root:** `.githooks/pre-commit` locks `Asterism/asterism_job3.html`, the
preserved Fable 5 original, against any modification. Git keeps `hooksPath` in `.git/config`, which
is **never committed** — so after any fresh clone the lock is disarmed until someone runs:

```bash
git config core.hooksPath .githooks
```

Verified working: a tampered copy is refused, an unmodified one passes. Escape hatch if you really
mean it is `git commit --no-verify`.

**Never `git add -A` in a tree you don't have to yourself.** Sessions run in parallel here and
leave work uncommitted mid-task — a half-finished folder rename, an edit to this catalog. Stage
the specific paths you touched. If `git status` shows changes that aren't yours, say what they are
and let them be, rather than bundling them into a commit whose message doesn't describe them.
(This is written down because it has already happened.)

**The catalog at the top of this file is the exception, and it needs its own two rules.** Every
session writes to it, so "changes that aren't yours" are permanently present — read literally, the
rule above locks the file and nobody may ever commit it. Not hypothetical: on 5 Aug 2026 three
sessions committed their own folders promptly and correctly, and all three left their catalog row
behind. Six files ended up stranded and it took a dedicated session to unpick.

- **Edit only your own row — never rewrite the whole file.** Targeted find-and-replace on your row,
  never a full-file write. This is the whole fix for the vanishing-row bug: a full-file write is
  built from a copy read *before* someone else's row existed, so saving it silently deletes their
  work. A targeted edit cannot drop a row it never mentions, and if the file moved underneath it,
  it fails loudly instead of overwriting. **Git protects nothing here** — parallel sessions share
  one working tree, not branches, so it is last-write-wins at the filesystem level and no commit
  frequency changes that. (A row was lost this way once. It was caught only because the session
  that wrote it went looking for it.)
- **Commit it even when other rows are dirty.** Your message won't describe their row. That costs
  far less than a file nobody is permitted to commit.

## When a game's tone depends on looking broken

**Default: every game is sincere and its bugs are real bugs. Fix them freely.** Authored defects
are the exception, not the norm — do not go looking for hidden intent behind a typo in a game whose
`CLAUDE.md` doesn't claim any.

A few of these are parodies of bad software, and *their* defects are authored. Every game with that
property says so explicitly near the top of its own `CLAUDE.md`, with a register of which specific
artifacts are intentional. This is not the default, expect most projects to be straightforward unless otherwise noted. **Read that register before touching anything, and never silently "fix"
a typo, placeholder, duplicated string, or dead-end UI in a game that has one.** When in doubt,
surface it and ask instead of correcting it.

Both failure modes cost real work: sanding the joke off a parody, and treating a sincere game's
bugs as sacred. The register — present or absent — is what tells them apart.

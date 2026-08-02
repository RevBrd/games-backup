# Games

Browser games, one folder each. This file loads automatically whenever Claude Code is launched
in any game folder underneath it; each game's own `CLAUDE.md` loads on top of it.

Design principles and build conventions are **not** here — they live in
`~/.claude/reference/game-design.md` and `~/.claude/reference/building.md`. Read those first when
starting or resuming work. This file is the catalog and the cross-game housekeeping only.

## Catalog

| Game | Premise | State |
|---|---|---|
| [DeadSpace](DeadSpace/) | Dead Space: Block Party! — a fake licensed Tetris tie-in whose cheerfulness is the horror | Mostly complete; needs port to standalone HTML |
| [Nebula Strike](Nebula%20Strike/) | Galaga with weapon powerups — seven guns that each fire completely differently | Playable; wants a balance overhaul (player far too strong) |
| [Untitled](Untitled/) | Bao's Big Breakfast — SMB 1-1 as a steamed bun on a giant kitchen counter. Built for a friend of Trevor's | Level 1 complete and playable end-to-end; folder still needs renaming |

Other games exist from earlier Claude Chat sessions and are not yet migrated into this folder.
Add a row when one lands, and give it a `CLAUDE.md` of its own.

## Conventions across games

- **Each game owns its own `CLAUDE.md`.** Premise, tone rules, deliberate defects, design history,
  known fragility. Target under 200 lines — depth beyond that goes in sibling files the game's
  `CLAUDE.md` points to.
- **The code lives in the game folder, in git.** Not in `~/.claude/reference/`.
- **Games are stylistically independent on purpose.** Do not carry a look, a palette, or a tone
  from one game into another. Variety across the collection is the point, and reaching for
  something adjacent to an existing game is the wrong move even when it feels safe.
- **Long-term target is a free static host** (GitHub Pages or similar), which serves files exactly
  as-is with no build step. That constrains format: a finished game should be a single
  self-contained HTML file that runs by double-clicking it.

## When a game's tone depends on looking broken

**Default: every game is sincere and its bugs are real bugs. Fix them freely.** Authored defects
are the exception, not the norm — do not go looking for hidden intent behind a typo in a game whose
`CLAUDE.md` doesn't claim any.

A few of these are parodies of bad software, and *their* defects are authored. Every game with that
property says so explicitly near the top of its own `CLAUDE.md`, with a register of which specific
artifacts are intentional. **Read that register before touching anything, and never silently "fix"
a typo, placeholder, duplicated string, or dead-end UI in a game that has one.** When in doubt,
surface it and ask instead of correcting it.

Both failure modes cost real work: sanding the joke off a parody, and treating a sincere game's
bugs as sacred. The register — present or absent — is what tells them apart.

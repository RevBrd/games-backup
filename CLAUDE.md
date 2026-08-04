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
| [Bao's Big Breakfast](Bao's%20Big%20Breakfast/) | SMB 1-1 as a steamed bun on a giant kitchen counter. Built for a friend of Trevor's | Level 1 complete and playable end-to-end |
| [Combat Circuit](Combat%20Circuit/) | Build a battle bot, press GO, watch it fight on its own | Sandbox pass: physics, component damage, behavior chips, three win conditions. No economy yet |
| [Snek](Snek/) | Snake, drawn badly on purpose in ballpoint pen on notebook paper, with googly eyes | Reskin pass complete and playable; mechanics still vanilla Snake by design |
| [Asterism](Asterism/) | Qix as celestial cartography — fence off the void, capture the constellation's stars, watch the figure ink itself in gold | Complete and playable at nine maps. Designed end-to-end by Fable 5 with no human design input; the 3-map original is preserved and **locked** — read its `CLAUDE.md` before touching anything |
| [Ultra Pong!!!!](Ultra%20Pong!!!!/) | Untouched 1972 Pong buried under 2026's entire attention economy — Idiocracy ad breaks, a CPU that narrates the broadcast and holds a grudge, six billion fickle viewers | Mostly finished. Physics are pure classic Pong and must stay that way; authored annoyances and an honesty rule for anything the CPU does are registered in its `CLAUDE.md`. More ad copy welcome |

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

## Git

**One repository holds the whole collection, and it lives at `Projects/Games/`.** Every game is an
ordinary subfolder of it. There is no remote — history is local to this machine, so nothing is
recoverable from a server if it's lost here.

**A game folder should not contain its own `.git`.** This is the thing to actually watch for,
because the failure is silent. Claude Code launched in a game folder reports *"Is a git repository:
true"* either way — that's true whether the repo is the collection or a private one belonging to
that folder. If the folder has its own `.git`, your commits land in a one-game repo that the
collection's history never sees, and nobody notices until someone goes looking.

So **before your first commit in a session, check where you actually are:**

```bash
git rev-parse --show-toplevel
```

If that doesn't print the path ending in `Projects/Games`, stop and say so before committing.

**There are no exceptions left.** `Asterism/` and `Snek/` were folded in on 2 Aug 2026; every game
is now an ordinary subfolder. The nesting arose because **Trevor ran `git init` when creating a
game folder** — a reasonable instinct, and how you *would* start a standalone project, but wrong
here because the collection repo above already covers everything underneath it. (An earlier version
of this file blamed a session for it. That was wrong.) New game folder: create it and start
working. No `git init`.

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

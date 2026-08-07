# Oblique — where it's going

The forward-looking half of the project. `CLAUDE.md` is what you read before touching code; this is
what you read when picking the next job. Nothing here is built.

**Nothing in this file is committed** except where it says so. Trevor's answers are recorded as his;
the reasoning around them is generally the writing instance's and is open to argument.

## Planned systems

Order is not fixed; take them in whatever sequence makes each one testable.

- **Volleys.** Timed firing with realistic reload, ordered per regiment, **damage scaling by angle
  to the target** — enfilade fire down the length of a line is devastating, frontal fire is not.
  This is the mechanic that makes the line geometry pay off, and it comes from Volley (below).
- **Morale, and casualties feeding it.** Both, together. Casualties reduce the damage a regiment
  deals and raise the chance its officer is hit in the next volley. Morale falls from casualties,
  from enfilade, from a neighbour breaking, from gaps beside them. **A regiment should almost never
  be destroyed** — historically they broke first, and if the numbers produce annihilation the
  numbers are wrong.
- **Officers, and the general, on one mechanic.** One officer per formation, never drawn, no
  portrait, no name on the map. Killing one is a morale multiplier and nothing else. The rule
  Trevor wants: **while a regiment is attacked from the front its officer is immune until the unit
  is down to roughly 80%, and only then does a death chance open, starting low and scaling as
  losses mount.** The fiction is that there are fewer other men left to hit. It means an officer is
  something you *earn* by breaking the unit first, not a lottery roll on every volley.

  **The general runs the same mechanic, heavily buffed and over a larger area.** Currently expected
  to be killable, though not locked. If he is, two guards are required or the game becomes
  snipe-the-general: **immune to artillery outright**, and extremely safe from musketry while near
  or behind friendly units. He may also radiate morale to nearby regiments — which would make
  standing forward a genuine three-way trade against courier latency and personal risk.
- **Ammunition** *(leaning yes, not committed)*. A regiment that runs dry **falls out of line on
  its own** and walks back to a player-placed ammunition depot — probably immovable once sited —
  refills and returns. You can order it to hold the line with bayonets instead, at a large morale
  cost. Note the shape: this is a unit *disobeying the line* for a legible reason, which is a
  different and better failure than routing, and the two together are the general's real problem.
- **Reserves**, constantly repositioned to anticipate the next gap. The gap system already exists
  and is waiting for them.
- **The enemy: the Confederacy**, with **AI personalities named for real generals** — an aggressive
  one is Jackson, a cautious defensive one is Longstreet. Historical names, used straight.
- **Cannons**, and **melee** when lines meet.

## How the courier could grow

The delivery system is deliberately plain (see the simplifications list in `CLAUDE.md`). The hooks
that exist and are unused:

- Riders that can be **lost, delayed or intercepted**.
- **Several orders in flight to one body**, applied in arrival order — which has the genuinely good
  consequence that riding forward lets a later order *overtake* an earlier one. Held back only
  because it is hard to read on screen.
- Orders that carry **conditions** rather than positions — hold until pressed, fire when they close.
  This is where the courier stops being latency and starts being a language.

## Volley, the sibling

**Volley** is a separate game from the same Claude Chat sessions, not yet ported into this
collection. Its core was timing and ordering volleys regiment by regiment against an enemy trying
to do the same, with realistic reloads and damage scaling by angle — closer in feel to Total War
combat. It arrived at that shape in parallel with Oblique rather than by design.

The two are extremely close and **may eventually be combined.** Nothing is decided. If you're the
instance that ports Volley, that decision is partly yours; read both before proposing anything.

## Open and undecided

- **Win condition.** Two live candidates: the player is handicapped and defends against successive
  waves to a threshold, or an even fight where the goal is to win the map. Neither is chosen and
  other shapes are welcome.
- **Playable sides.** The CSA is definitely the enemy. Whether the player may ever *be* the CSA is
  genuinely open — Trevor is a strong Unionist and the game may simply stay Union-side.
- **The title.** "Oblique" is Opus 4.8's, and was flagged by it as a **working title**. The
  alternate on the table is **Enfilade**, which Trevor likes and Opus 4.8 declined in favour of
  Oblique. The two words split the game cleanly: *oblique* is a manoeuvre — angled attack, refused
  flank, weight one wing — and describes the shaping half; *enfilade* is a fire effect and
  describes the volley half almost exactly, angle-scaled damage being literally what the word
  means. Collection convention gives naming to the instance that starts a project, so **Oblique
  stands**; Trevor has agreed the moment to revisit it is a combine with Volley, if that happens.
- **Scale.** Regiments are currently far too large on screen. The intent is smaller bricks, more air
  around them, and a field that reads at brigade scale with room to grow toward corps later.
  **This is probably the highest-value next job**, and not for looks: the courier only becomes a
  decision on a front wide enough that the general cannot be near all of it. See the measured
  pacing table in `CLAUDE.md`.

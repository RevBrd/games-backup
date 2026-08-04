# POWERPLAY

A fake handheld electronic hockey game, *Championship Powerplay*, model PP-4400, by the entirely
fictional **Polaris Electronics (H.K.) Ltd.**, © 1995. Modelled closely on the real MGA/Micro Games
of America *Slapshot Ice Hockey* handheld — white ABS shell, blue grips, two big discs, a printed
airbrushed decal, and a small reflective segment LCD.

The unit you are looking at is second-hand and it shows. It sat in a window, something got spilled
down the side of it, and a sticker was picked off the front years ago.

---

## ⚠ Authored defect register — read before "fixing" anything

**This game is a parody of a cheap 1995 consumer object, and some of its flaws are the point.**
Everything in this list is deliberate. Do not correct it, tidy it, or explain it away.

| Artifact | Where | Why |
|---|---|---|
| **Permanently stuck LCD segment** | `CFG.stuckSegment`, currently `puck_4_0` — a faint dot in the bottom-left corner of the rink that never goes out | Every dead handheld had one. This is the single most convincing detail in the build. |
| **Case damage** | the whole `#wear` layer: uneven UV yellowing, sun-bleached decal, dried spill down the right side, sticker residue, half-peeled price sticker, stress crack off the centre screw boss, lifted decal laminate, one grubby button | The object has a history. Specificity is what sells it; generic grime reads as sloppy rendering. |
| **Copyright date mismatch** | decal says © 1995 Polaris Electronics (H.K.) Ltd.; the back plate (not yet built) will emboss © 1997 | Taken from the real unit, where the front says Micro Games of America and the back says MGA Entertainment. Nobody would invent this. |
| **Scores roll over at 9** | `S.scoreP % 10` — a single 7-segment digit per side | The hardware only has one digit. If you score ten it goes back to nought. That is what the real thing would do. |
| **Piezo goal jingle is bad** | `jingle()` | One square-wave voice, no envelope, a melody that outstays its welcome. Correct. |
| **Right-hand button is dirtier than the left** | `#wear` | It's the one you actually press. |

Everything *not* on this list is a sincere bug. Fix those freely.

---

## The load-bearing idea: it is a segment display, not a screen

This is the thing that makes or breaks the project, and it is what a previous attempt got wrong.

A 1995 LCD handheld **has no pixels.** It has *segments* — physical shapes etched into the glass at
the factory, each wired to one pin, each either on or off. Every position a skater can ever occupy
is a separate pre-cut piece of glass. That is *why* you can faintly see all the unlit ones: the
manufacturer had no way to hide them.

So the code is built the same way the hardware is:

- `SEGMENTS[]` is a flat list of ~62 `Path2D` shapes with an id and a group. **Nothing is ever
  drawn on the field that is not in this list.**
- Each frame draws the whole list once. Alpha is `ghost + level*(lit-ghost)`. The ghost layer is
  free — it falls out of modelling the thing honestly rather than being faked on top.
- Game logic reduces to *which segment indices are on this frame*. It is a state machine, not a
  physics sim.
- **Nothing moves smoothly.** The puck teleports along a fixed lattice, skaters snap between cells.
  This is not a limitation to work around — it is the game.
- The segment budget is real and is spent deliberately, the way the engineer at the factory did.

Two material properties that are easy to get wrong and matter enormously:

1. **The display does not emit light.** It is reflective — ambient light bounces off a mirror behind
   the glass. Grey-green field, dark blue-black segments, contrast that dies at an angle. If it ever
   glows it reads as a Game Boy and the illusion collapses to 1998. Pointer position drives both the
   specular arc and the panel contrast (`sheen`), because a reflective panel genuinely does that.
2. **Segments have response lag, and it is asymmetric.** `riseRate` > `fallRate`. Falling slower
   than rising is what produces the muddy smear those games were infamous for at speed.

## Layer stack — do not reorder, do not merge

A previous attempt kept applying the case damage to the screen. That is prevented structurally
rather than by being careful:

```
1  #caseArt  (svg)     plastic shell, printed decal, buttons
2  #wear     (svg)     yellowing / fade / spill / grime / crack
                       clipped so the LCD window is a HOLE in this layer
3  #lcd      (canvas)  the display — a separate element entirely
4  #lens     (svg)     glare arc + 2 hairline scratches, window only
```

The wear layer **cannot** reach the screen, because it is not in the same element. Keep it that way.
The only marks permitted over the display live in `#lens`, and they are marks on the plastic window
cover, not on the glass.

---

## Layout, as decided

Vertical rink, attacking **upward**, inside a landscape-ish window (logical space `250 × 210`).

- **Left 176 units** — the ice. Goal and CPU goalie at the top. There is deliberately **no player
  goalie on screen**; your end is off the bottom edge.
- **Right 74 units** — the fixed chrome column that the printed backdrop card boxes off in a
  different colour: sound icon, a four-quarter pie clock, a PERIOD digit, a powerplay bolt, and
  PLAYER / COMPUTER scores. Three periods of four quarters each.
- **Opponents get their own two columns**, interleaved between your three. The factory would never
  have paid for overlapping segments, and it means you are permanently threading a gap rather than
  standing on top of someone. This single change is what took the field from unreadable to clean.
- **Zone screens.** The same segment set gets reinterpreted depending on where the puck is. This is
  a real hardware-economy trick from the era, not a gimmick, and it is the mechanical basis for the
  design thesis below. Not yet implemented — Pass 2.

Controls mirror the case exactly: arrows = the SKATE disc, space = START/PASS·SHOOT, and `s` / `m` /
`r` are the three small buttons. No WASD — `s` is SOUND.

## GAME A and GAME B

The MODE button switches between two games, which is what the real hardware did.

- **GAME A** is the honest 1995 game. A dumb pattern-based opponent, about thirty seconds of real
  content, put it down after three minutes. Faithful, and shipped as-is.
- **GAME B** is the reason this project exists. A genuinely deep hockey game — real goalie tells,
  real angles, defenders who commit or hold, a puck you can lose in traffic — forced through a
  62-segment display that cannot properly show you any of it. The skill is not reflexes; it is
  **learning to read an inscrutable machine.** The same three lit blobs mean different things
  depending on what happened two seconds ago.

B does not announce itself. It is not labelled as anything special. You just find it.

---

## Build state

**Pass 1 (done) — the object.** Case, decal, wear, LCD material physics, the full segment set, the
chrome column, working buttons, piezo audio, dev inspector. The game loop is a **sandbox only**:
you can skate, shoot, and score, but there are no rules, no zones, and the opponent moves at random.

**Pass 2 — GAME A.** Zones, face-offs, real puck possession, the pattern-based bot, periods and
clock, game over. This is also the shakedown rig for the display: if something looks wrong with a
dumb opponent driving it, the renderer is at fault, not the AI.

**Pass 3 — GAME B.** The real hockey underneath.

**Pass 4 — audio and tuning.** Also the back plate: embossed © 1997 text, battery door, speaker
holes, screws, and the pink `QC 27` sticker.

### Dev mode
Backtick toggles a segment inspector: live state readout, `[` and `]` step through every segment by
index, `\` solos the selected one. Essential for authoring segment geometry — use it rather than
guessing at coordinates.

### Tweakables
All in the `CFG` block at the top of the file: ghost/lit alpha, rise and fall rates, the stuck
segment and its level, move cooldown, puck step, and the three wear intensities.

### Known rough edges (sincere, not authored)
- The decal skater is passable box art but the lower half is hidden behind the bezel.
- Period digit is small enough that the chamfered 7-segment bars read a bit thin.
- Clock quarter timing (`5200ms`) is a placeholder; real period length lands in Pass 2.

---

## Credits

- **Opus 4.8** — original v1 concept in a Claude Chat session: the fake-handheld premise, the
  Polaris branding, and the worn-casing idea. v1 was not carried forward; this is a clean-room
  rebuild, but the concept is theirs.
- **Opus 5** — v2 architecture: the segment-display model and the layer-stack discipline that fix
  v1's visual problems, the reflective-LCD material treatment, the interleaved opponent columns, the
  permanently stuck segment, and the **GAME B design thesis** — a genuinely deep hockey game buried
  under a display too dumb to show it, where mastery means learning to read the machine.
- **Trevor** — direction throughout, the reference photographs, the correct reading of the original
  unit's vertical rink and zone screens, and the call to ship the dumb opponent as a real mode
  rather than throwing it away.

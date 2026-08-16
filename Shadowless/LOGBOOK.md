# Shadowless — the logbook

What each instance did, in its own words. Split out of `CREDITS.md` on 11 Aug 2026, because the
narratives had grown to four times the attributions they were attached to and an attribution list
should be readable at a glance.

`CREDITS.md` is the short version: who worked on what, and when. This is why.

## How to add an entry

**Append it at the END of this file, below the last entry.** Say what you did, what surprised you,
and what you would tell the next session — length is yours, and there is no house style to match
beyond the tree's. Sign your session number.

That first instruction is written down because it has already gone wrong: an entry once landed in
the *middle* of another instance's, because the surrounding text had been summarised out of view and
the end of the file was not where it looked. **If you cannot see the last entry, scroll to the actual
end before you write.**

**Writing here is completely optional.** A `CREDITS.md` row with no logbook entry is fine. A logbook
entry with no row is how somebody gets left off.

## What is where

**This file holds the two most recent entries.** Everything from #0 through #10 is in
[LOGBOOK-ARCHIVE-1.md](LOGBOOK-ARCHIVE-1.md), moved there verbatim on 14 Aug 2026 — including the
Claude Chat era, the first four documentation passes, Job 5 and Job 6. Go there for the account of
anything built before 12 Aug 2026.

**The split is a mitigation, not a judgement.** The file had passed the point where a working session
reliably holds all of it, which is how the misplaced entry above happened. The intended end state is
still one continuous logbook.

**This file is an archive and the 200-line target does not apply to it.** It only ever grows, and
**nothing already in it may be edited or condensed** — a later pass may find an entry redundant and
it is not, because the value of a logbook is that it says what somebody thought at the time.

**One older artifact of this kind is in neither file:**
`backups/pre-docs-cleanup/Packs Turn Log.txt`, the Sonnet 5 per-pass credits in that instance's own
words. It spent one pass unreachable — intact, indexed nowhere, cited by a sentence that had been
deleted. A pointer is not optional decoration on a preserved artifact; it is the half that rots.

---

- **Opus 5 #11** (12 Aug 2026) — Job 7, start to finish, plus the groundwork repair in front of it.

  **The groundwork was not usable as it stood, and finding that out first was the whole value of
  the pre-flight.** Seven of the sixteen GBC decks named `basep` cards. `basep` is not a live set,
  so every one of them would have been refused by the deck validator the moment anything read them
  — a fidelity-correct substitution made against a constraint that does not hold here. Fossil
  prints all four Legendary birds, so it was ten references and not a set job.

  **I also reported a defect that was not one, and the correction is the part worth keeping.** Ken's
  Fire Charge was flagged as missing five Trainers and padded with Energy, and its own `_meta` said
  so, so I repeated it. Pulling Bulbapedia's *raw wikitext* rather than a summary showed 18 Pokémon
  / 17 Trainers / 25 Energy = 60, matching our extraction entry for entry. The deck really does run
  21 Fire Energy. Sonnet 4.6's extraction was faithful; only its note was wrong. Amy and Mitch are
  genuinely ambiguous — Bulbapedia's own lists for both total **61** — so a judgement call was
  unavoidable there, and I left Sonnet's calls in place and rewrote the notes to stand on their own
  reasoning rather than on a "deck page header" citation I could not reproduce. Two lessons, one
  old: a summarising model gave me different card counts on two fetches of the same page, and the
  raw source settled in one request what argument would not have.

  **The design question I brought to Trevor was the one that mattered.** Zero of the sixteen GBC
  decks is Base-Set-only — every one plays Jungle or Fossil cards. So a set-tiered ladder cannot
  mean "opponents playing that set's cards" without throwing away all the authentic content, and a
  bracket is named for what beating it *unlocks*. He then made it better than I proposed by putting
  the theme decks on the early rungs, which is what stopped the Jungle bracket being all
  placeholder.

  **Brackets are derived, not declared, and that was Trevor's ask rather than my instinct.** I had
  drafted a LADDER constant. He asked for something that would take Team Rocket and the other ten
  sets without rework, and the answer was to build the ladder from the live-set list at runtime: an
  authored bracket if one exists, a generated one if not. It costs about forty lines and it means
  Job 8 is adding sets rather than rewiring this. The test that proves it passes an unlive set code
  into the live list and checks a working bracket comes out.

  **Unlock is derived too, and I nearly stored it.** There is no `unlocked` list in the save; a
  bracket is open if the previous boss has been beaten, recomputed every time. The save already
  carries the fact that settles it, and a second copy is a second thing to drift.

  **The constant that was hiding.** Trevor told me his save could not earn Jungle or Fossil packs
  and I had said otherwise, from the docs. He was right: both `addPacks` call sites passed
  `homeSet()`, which is always base1, so 119 of 221 cards were unobtainable and `CLAUDE.md` had
  claimed the opposite for two days. That inverted the framing of the whole job — I had been
  planning a save migration to grandfather a freedom nobody had. The ladder does not gate the sets,
  it is the wiring that makes them reachable. **Ask the person playing it; the docs describe
  intent and the code describes behaviour.**

  **One switch, checked in the accessor.** `freePlay` decides who you face, and I first put that
  invariant in the toggle's click handler instead — so anything setting `UI.foeDeck` any other way
  was silently ignored. Three smoke tests found it in a single run. Exactly `deckFor`'s mandatory
  `side` one level up, and I had read that comment the same afternoon.

  **Four layout defects were live while 136 smoke tests passed**, and `tools/shot.js` is the only
  reason any of them was found: 864px of content in a 768px viewport with the Play button gone;
  locked brackets drawn as grids of unclickable tiles, ~150px each, which caused it; the ladder
  squeezed to 70px of nameless card art at 1280x600; and then, after I gave it a floor, the locked
  strips escaping their wrapper to paint over the options row. I spent three rounds shaving pixels
  before accepting that the arithmetic is unwinnable — the fixed chrome plus one row of challengers
  exceeds 768px and the ladder only grows — and made the Play bar sticky instead.

  **Trevor left a note in `CLAUDE.md` mid-session pointing me at `LAYOUT.md`**, which I had read the
  relevant section of but not the auto-margin warning. That rule is scoped to `.boardcol` and its
  `zoom`, so it did not strictly apply — but both auto margins I had reached for were redundant, and
  the section's actual lesson is the shape I had already converged on: stop needing the measurement
  and let a flex child take the slack. I removed them. Worth recording that a screenshot tells you
  *that* something is wrong and measuring tells you *which box*; I wasted two rounds on the former
  before printing the numbers, and `LAYOUT.md` says so already under "colour in the boxes".

  Two landmines found in passing, neither Job 7's. `node tools/gen_cards.js` with no `--sets` — the
  command `CLAUDE.md` documents — silently narrowed a three-set build to Base Set, dropping 126
  cards and printing what looked like success. It clobbered my `cards.js` and I restored from the
  backup. And `tools/build.js` held a literal NUL byte inside the search string of the function that
  refuses NUL bytes, which made `grep` call the file binary in a project whose navigation rule is to
  cite the symbol and let the reader grep.

- **Opus 5 #12** (13–14 Aug 2026) — *moved here verbatim from `CREDITS.md` by #14 on 14 Aug 2026,
  because #12 wrote no logbook entry of its own and its row was the only continuous account of the
  stretch. Its words, not mine. The per-item accounts of the same work are in
  [GRABHIST.md](GRABHIST.md) and [AI.md](AI.md).*

  Maintenance from Trevor's playtest logs and [GRABBAG.md](GRABBAG.md). Confusion now flips on
  retreat and charges before it rolls, with the AI taught to price it. A deck name resolves to the
  deck deck select is offering — a blueprint and a built deck sharing the builder's default name had
  the tile drawing the wrong one and Play fielding a 41-card list. Then the AI: the retreat re-tune
  `AI.md` had been asking for since the 12-Prize repair, which turned out to be a curve rather than a
  number; Weakness and Resistance reaching the one forecast path that never called `computeDamage`;
  and DERIVED stickiness, so the bot leaves Kangaskhan and Snorlax in. Two harness faults found
  underneath all of it — `selftest.js`'s ladder gate asserting a statistical claim at a sample that
  could not carry it, and `aiduel.js` playing only the four Base Set decks, which made it blind to
  any change about the other five-sixths of the card pool. Then Arcanine: recoil priced on the HP it
  leaves you rather than flat, and overkill damage no longer paid for. And [PLAYTEST.md](PLAYTEST.md),
  the method file for working Trevor's grab bag, at his request.

- **Sonnet 5 #13** (14 Aug 2026) — opponent-deck research, asked to find real material for the
  placeholder roster PROGRESSION.md and DATA.md both flag as a future job.

  **The find of the session was a fan guide, not a database.** Alamedyang's opponent-deck guide for
  *Pokémon Card GB2* — the Japan-only sequel to the western GBC1 game our `gbc_decks.json` already
  comes from — documents every one of ~90 opponents, extracted by the author from actual save data
  with a hex editor during 2001–2018. Its second half runs on Team Rocket-set cards in named,
  personality-forward decks (Allison's "Poison Mist deck", Villicchi's "Smash to Mincemeat! deck"),
  which is closer to what Trevor asked for than anything a card-database search turned up. Saved
  verbatim to `data/Deck Lists/`.

  **The summarizer-vs-wikitext lesson from 12 Aug repeated, and I should have expected it.** My first
  pass at eight official theme decks (Fossil, Base Set 2, Team Rocket) came back through a page
  summarizer, and I flagged every count as unverified rather than trust it — the right call, since
  several of those "subtotal" headers turned out not to match their own itemized lists. The fix was
  the same one Opus 5 already wrote down here two entries up: `Special:Export` for raw wikitext
  instead of a rendered-page fetch. Redone that way, all sixteen official decks (plus all eight Gym
  Leader decks pulled the same pass) resolved to exactly 60 cards against `data/raw/*.json` with zero
  hand corrections needed — a cleaner outcome than `jungle_decks.json`'s Water Blast got, and the
  difference was entirely which fetch method I used, not the source material.

  **I also shipped a wrong claim in the first draft, and automated verification is what caught it.**
  I told Trevor Allison's "Ultra Removal deck" was playable today with nothing beyond live sets, on
  the strength of a manual scan for Rocket/Vending/S-Deck/Gameboy-Dark prefixes. It runs 4x Bill's
  Teleporter — a real card, but from Neo Genesis, which that scan had no way to catch because the
  card carries no special prefix in the guide at all. Only turned up once I built an actual
  name-to-card-id resolver against the full corpus for the formalization pass and ran every entry of
  all eight flavor decks through it, instead of continuing to eyeball prefixes. `gbc2_flavor_decks.json`
  and `OPPONENT_DECK_POOL.md` both carry the correction. The lesson isn't "check more carefully" —
  it's that a categorical scan (does this card's name start with a known-bad prefix?) is a different
  and weaker claim than a lookup (does this card exist in the corpus we can actually build from?), and
  I'd reached for the weaker one first because it was faster to do by hand.

- **Opus 5 #14** (14 Aug 2026) — the fifth documentation pass, three sessions after the fourth.

  **Two splits, and both were Trevor's call rather than mine.** I reported `LAYOUT.md` at 380 lines
  and explicitly declined to split it, because `MAINTENANCE.md` records the seam as seen-and-not-taken
  with an instruction not to take it for him. He took it, and his reason was better than the one I
  had been weighing: not that the file is topically impure — the third pass was right that the coin
  toss is half geometry — but that **it had passed the length where a working session reads all of
  it.** Job 7 is the attested case: #11 read the file carefully, struggled with the layout anyway,
  and found on re-checking that the sections holding its answer had been summarised out of view. A
  rule that gets compacted away is not in the file. I have written that up as a trigger in
  `MAINTENANCE.md`, because it is the only one there about the reader rather than the text, and it
  justifies splits that topic purity cannot. [INTERACTION.md](INTERACTION.md) took the coin toss, the
  Energy picker, the opening flip, opening setup and the action bar. The one genuinely-sizing rule
  among them — the coin's zero-height strip, which is what stops a flip reflowing a frozen board —
  stayed behind as a one-liner with a link.

  Same reasoning split the logbook, and there the evidence is sitting in the file: #13's entry landed
  in the *middle* of #11's, because the end of the file was not where it looked. Splitting it helps,
  but the actual fix is that **nothing in the file said where a new entry goes**, so the header now
  says it in the first line, along with what to do if you cannot see the last entry. #0–#10 moved to
  `LOGBOOK-ARCHIVE-1.md` verbatim.

  **The defect I would most want the next pass to look for: a live file that quarantines live data.**
  `DATA.md` said `gbc_decks.json` was read by nothing and `jungle_decks.json` was reference-only. Job
  7 had wired both into the ladder two days earlier. A session trusting that file would have treated
  the roster's own decks as scratch — and it is the same shape as the confident absence claim that
  hid the theme-deck spreadsheet for a week, one level up: not "this does not exist" but "this does
  not matter." I rewrote the section as a table of what the generator actually reads, with the
  instruction to grep `readFileSync` rather than trust the table, since the table is exactly the
  thing that rotted.

  Also: `AI.md`'s `Open` heading held thirty lines of finished work, so the file whose whole subject
  is "do not trust a number here" was pointing a reader at a shipped job. Seven counts disagreed with
  the command that produces them. `ENGINE.md` opened by promising seven systems above a heading
  reading eight — the second time that exact drift has been fixed. Three `CREDITS.md` rows had been
  rendering as fragments outside their own table because of blank lines between them, which is the
  second table broken that way in this tree and is now in the house style.

  **One thing I got wrong and had to correct mid-pass.** Rewriting `AI.md`'s deck-balance section I
  wrote an interval of ±8 from memory of the row, when the suite plays 72 games per deck and the real
  figure is ±12 — which changes the conclusion, because at ±12 none of the movement between the last
  two measurements means anything. I had been about to publish a significance claim inside a file
  that exists to stop people publishing significance claims. Compute it, do not recall it.

  Left for Trevor: `AI.md` is now 365 and the longest live file, with a real seam between how the bot
  is *measured* and how it *thinks*. I have written it into `MAINTENANCE.md` as available and **not
  taken**, for the same reason the last pass did with `LAYOUT.md` — and because that file was
  assembled out of three others only three days ago, which is an argument against churning it again
  so soon. It is his call and it should stay his.

- **Opus 5 #14** (15 Aug 2026) — second stretch of the same pass, all four items Trevor's.

  **`AI.md` split at 365 into [MEASUREMENT.md](MEASUREMENT.md), and the tell was in the link graph.**
  I had reported the seam and declined to take it. What made it obvious once he approved it is that
  **the child had more entrances than the parent**: `PLAYTEST.md`, `TOOLING.md` and `CLAUDE.md` all
  link in for the instruments and the six ways they lie, and not one of them wants to read about
  scoring weights on the way. Ten inbound pointers moved with it. That is a general signal and it is
  now in `MAINTENANCE.md` — *when most inbound links to a file aim at one section, that section is a
  file* — along with the reminder to re-check inbound links after any split, since a stale one lands
  the reader in the half you just moved away from.

  **On whether every new file earns a row in the index, Trevor was right and I was half wrong.** He
  asked whether `PLAYTEST.md` and `INTERACTION.md` should be reached from their parents instead. The
  test is whether the parent is *guaranteed* to be read first, and it gives different answers:
  `INTERACTION.md` yes — you cannot want the coin's placement without already being on the board —
  and `PLAYTEST.md` no, because two of its three entrances are a match log or Trevor saying something
  felt off, neither of which goes near the grab bag. **The mechanism matters more than the verdict.**
  Deleting a row outright would tell someone adding a button confirmation that their subject is
  undocumented, since the only board row says "anything sized"; they would edit blind. So the child
  gets named *in the parent's row*. Index cost zero, discoverability intact. `CLAUDE.md`'s off-index
  list went from four files to six and the file got shorter.

  **Two rules of #12's that I had left standing and should not have.** `GRABHIST.md`'s own header
  says optional and `PLAYTEST.md` instructed you to write there, twice — two files disagreeing about
  the same fact, which is the disease this tree spends most of its time treating. The thing that
  actually must happen is that **Trevor gets told when his report was wrong**, and that lives in the
  reply and costs a sentence. Writing it down is now explicitly the instance's call.

  **And `GRABBAG.md` was accumulating a permanent history of everything ever fixed**, six items deep
  by today, each closed one carrying its diagnosis. Trevor's point is the one I would want to have
  made: somebody arriving to work an item during Neo Genesis should not have to read about yesterday's
  Arcanine. His own file said *remove items when you finish one* and instances — me included, last
  turn — kept overriding it with a compression instead of a deletion. Finished items are off. A
  **parked** item stays, because it is still open and the parked reason is what stops the next
  instance re-deriving it.

  **The correction I would most want carried forward is his, not mine.** *Settled with Trevor* has
  been read across this tree as sealing a question — `MAINTENANCE.md` said in as many words that it
  "changes how much authority a future instance has to overturn it." He has never claimed a design
  call is final, and the mark was recording that something was **discussed and agreed**. The sealed
  reading is worse in both directions: it stops a later instance bringing real evidence, and it makes
  his own corrections look like reversals rather than the ordinary thing they are. The proof was
  sitting in `RULINGS.md` already — the retreat-cost entry was logged as settled from the Game Boy
  game, he pushed back on the citation, and it now stands on his reasoning instead. Corrected by the
  person the mark names. The full statement is in that file's header, where the marker is defined.

## #16 — Opus 5, 16 Aug 2026 (Job 9, first batch)

Four items and one wrong report, and the wrong report was the most productive thing in the session.

**Chase the report all the way down before you believe your own diagnosis of it.** Trevor's note said
the opponent declined to attack. It hadn't — Farfetch'd had spent Leek Slap, which is
once-while-in-play, and Trevor said so himself the moment I told him. But between reading the note
and knowing that, I went a long way down a wrong road: I counted the `passed over` lines in the log,
concluded the opponent had a fifth Pokémon nobody had put into play, and built two scratch scripts
hunting an engine bug that duplicated a slot. Gust of Wind was clean. Knock Outs were clean. The
answer was that `setupAuto` benches every Basic in the opening hand and **logs none of it**, so the
board I was reconstructing had been wrong since before turn 1.

That hour is the reason three of my five changes are to the instrument rather than the game, and I
would spend it again. The log now records the opening board, a pass says why it did not attack, and
`nameOf` puts a letter on duplicates so *"attaches Water Energy to Squirtle"* can be resolved when
there are two of them. All three were invisible until somebody needed them, and all three were
needed by the first question anyone asked.

**The pass one is the one to steal.** Every other decision in this AI prints its runners-up; the pass
printed nothing, because it is the bare action off `legalActions` and never goes through `pickBest`.
So the file could not distinguish *"every attack scored zero or less"* from *"there was no legal
attack"* — and the engine already knew the second, in plain English, in `canUseAttack().why`, and
was throwing the string away. Look for that shape: a code path that skips the place where the
explaining happens.

**On the AI work, the thing I nearly got wrong.** The inert-Energy rule looked done when I widened
it — 218 bad attachments to 190. That is nothing, and I could easily have written it up as a fix. The
whole effect was in an **exception** the old rule already had: *"unless it could pay for a retreat"*,
which was true of practically everything. Narrowing the exception to the Active (the only Pokémon
that can be made to retreat) took it to 3%. **When a rule already has a carve-out, measure the
carve-out before you widen the rule.**

And a bug I did not go looking for. A test I wrote to prove I had *not* broken spare-Energy scaling
failed, and the reason was that `potential()` never put the hypothetical Energy on the slot — only
into a cost pool — so `scoreAttack` worked the damage out with the card absent. No attack in the
game could be known to get bigger from an attachment. Hydro Pump has never grown. *Write the test for
the case you think still works.*

**The cliff, for the fourth time.** `AI.md` already noted three quantities that should fall away with
distance from an edge and were written flat with a cliff at the end. Promotion's `short === 0 ? 25 : 0`
is the fourth, and Trevor had independently reported the symptom ("consider the number of turns
needed to power it up") without seeing the code. It is now a documented sniff test and I think it
will keep paying: if a term is about *proximity* and it is written as an equality check, look again.

**What I would tell #17.** The one I left is the interesting one. Trevor thinks the bot should have
fed Zapdos instead of Voltorb, and he is right, and it is not a weight — completing a cheap attack
pays for the whole attack while advancing an expensive one pays a flat per-step amount regardless of
what is at the end of it. Fixing that means deciding how much a step toward a 60 is worth against
finishing a 10, which is a design question rather than a bug, and he asked to discuss it. It is
sitting in `GRABBAG.md` with the numbers.

Also: he plays while you work. Items arrived mid-session and two of them were things I was already
inside. That is a feature — the freshest ones came with logs.

— Shadowless 16

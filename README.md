# Math Shooters

A vertical shooter for the kids where the math is caught, not typed. Live at https://yshi41.github.io/math-shooters/

The problem sits at the top and answer bubbles fall down the screen. **Bubbles cannot be shot**: fly the ship
into the right one. A missed bubble floats back up and comes around again. Every enemy shoots back: crashers fire and dive, saucers shoot,
and a tank guards world 6 of every sector; hold the fire key to shoot them. After every wave you pick one of
three upgrades, and **a hit or a wrong answer costs a heart and knocks one upgrade loose** as a capsule you
can grab back before it fades. Progress runs through a **world map**: six sectors (Addition, Subtraction,
Times Tables, Multiplication, Division, Mixed), six worlds each, getting harder slowly. World 3 of a sector
opens the next sector; Mixed opens when world 3 of every other sector is done. Numbers follow the kid's grade
(Riley 3rd, Charlie and the test player Yan 4th).

**Two players on one keyboard** (computer only): player 1 flies with W A S D, shoots with F and bombs with Q, player 2 flies
with the arrow keys, shoots with . and bombs with /. Either ship may catch the answer; a wrong catch costs the catcher. A
downed ship becomes a rescue bubble the partner can fly into; catches that alternate between the two earn a
Teamwork bonus; ships close together link a beam that pops enemy shots; after a wave each player picks a card
from four. Both kids' saves earn the stars and treats.

Controls (solo): arrow keys or W A S D to fly, Space to shoot, B (or Shift) for a bomb, P or Esc to pause. On a touch screen
drag anywhere on the stage to fly, tap the bombs chip to bomb; the pad has ◀ ▶ FIRE BOMB. There is no auto-fire:
Space (or Enter) shoots solo; in two-player F shoots for player 1 and . for player 2. On a computer the game goes
full screen when a world starts (Esc leaves it; the pause menu has a Full screen button to go back in).

Progress saves online only, through the Worker in `worker/`; nothing is ever kept in the browser.

## Layout

- `index.html` is the built page that GitHub Pages serves. Do not edit it by hand.
- `src/template.html` (page and CSS) and `src/game.js` (everything else) are the sources. `node build.js`
  rebuilds `index.html`. Bump `BUILD` in `src/game.js` on every release.
- `worker/` is the save service (Cloudflare Worker + D1, tables `ms_saves` and `ms_history` in the Spelling
  Worlds database). Deploy from `worker/` with `npx wrangler deploy` and `CLOUDFLARE_API_TOKEN` set.
- `test/`: `node math.test.js` (the generators, lifted out of `src/game.js`), `node logic.test.js` (merge
  rules), and the headless Chrome suite `node test.js ../index.html` (after `npm install` in `test/`), which
  plays a solo world and a two-player world against an in-memory stand-in for the save service and never
  touches the real saves.

## Tuning knobs (`src/game.js`)

`WORLD_RAMP` (per-world tier, bubble speed, enemy cap and timing), `MIX_TIERS`, `WAVE_N` (correct answers per
wave), `LOSE_ON_HIT` and `loseOnWrong` (upgrade levels knocked loose), capsule life in `dropUpgrade`, the beam
range and rescue timer in the co-op code, and the number ranges in `MSMath`.

## Mechanics pass: what is deliberately not here yet

This build proves the mechanics with placeholder shapes. The theme pass adds: the Spelling Worlds palettes,
scenes and characters (copied at build time by named anchors, as `times-table-worlds/build.js` does); scenery
per world on the map; the character store (`owned`, `char`, `look` save fields with the sibling merge rules);
world-flavoured bullets and treats; read-aloud problems; music; the web manifest and icons for home-screen
install; `probe.js` screenshots; and a design note.

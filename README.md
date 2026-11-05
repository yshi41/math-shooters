# Math Shooters

A vertical shooter for the kids where the math is caught, not typed. Live at https://yshi41.github.io/math-shooters/

The problem sits at the top and answer bubbles fall down the screen. **Bubbles cannot be shot**: fly the ship
until it touches the right one and press Space (CAPTURE on touch); there is no catching from a distance. A missed bubble floats back up and comes around again. The ship **fires on its own** (Auto-fire,
a per-player setting in the hub and the pause menu, on by default; left Ctrl always works too). Every enemy
glimmers just before it shoots and a red chevron at the screen edge warns before something flies in. Crashers fire and
dive, saucers circle and shoot, **bees** come in swarms of five on a sine path (only the leader shoots; all five down is
+200 and a capsule), **asteroids** drift down and split in two, and the **Bubble Snatcher** grabs an answer bubble and
flies off with it: shoot it and the bubble drops back, let it escape and the bubble returns at the top. Three **lost
astronauts** drift through every world (one per wave); touch one and press Space to rescue it.

**Capsule power-ups** drop from enemies (about one in ten, more with Lucky Drops, always from bosses, and a supply drop
if none has shown for 22 s): Freeze (4 s, everything stops), Double Points (10 s, stacks with Glow Mode), Time Warp
(8 s, bubbles half speed), Overdrive (8 s, double fire rate and piercing shots), Wingman (15 s, a drone), and instant
Shield, Laser Cell (+50% charge) and Bomb. Timers show as chips under the hearts. After every wave you pick one of
three **upgrades**, and **upgrades are kept for good**: they are saved with the kid's profile and carry into every
world (a hit or a wrong answer only costs a heart). Rapid Fire, Spread Shot, Power Shot, Bubble Shield, Speedy Fins,
Slow Bubbles, Extra Heart, Bomb Bag, Treat Magnet, Lucky Drops, Piercing Shot, Buddy Drone, Homing Missiles, Long
Lasting (power-ups last longer) and Laser Battery. Max out two matching ones and a gold **Evolution** card appears:
Plasma Cannon (Rapid Fire + Power Shot), Starburst (Spread + Piercing), Guardian (Shield + Extra Heart), Hive (Drone +
Missiles). The ship's look shows all of it: nose guns, wing pods, a glowing core, bigger flames, drones on tethers,
missile rails, laser cells on the tail. The **laser** (left Shift) charges over 25 seconds, a quarter per right
answer, then burns its column clear for 2 seconds.

Every kill feeds a **chain** (kills within 1.5 s of each other multiply enemy points up to ×4). After the wave-2 pick
comes the **Bonus Blitz**: 15 seconds where nothing can hurt you and two formations of eight sweep through; all 16
down is a perfect (+300, a capsule, a medal). Each world has four **medals** shown on the map: Perfect (no wrong
answers), Untouched (never hit), Rescuer (all three astronauts), Blitz (a perfect bonus round); each pays 10 treats the
first time. Bosses: the **tank** guards world 6 of the even sectors and gets angry at half health (faster, a five-way
fan); the **Mothership** guards the odd ones (two turrets to shoot first, then the core opens, fires a spread). Every boss
fights alone: other enemies flee when it arrives and none spawn while it lives (astronauts and supply drops still
come). The **Math Hydra** (from wave 2 of world 2, or wave 1 from world 3; never on the boss wave) carries its own problem
on its belly and one answer on each arm (3 arms, 4 from world 4). Its armor holds until the arm with the right answer
is shot off; the body then takes hits for 4.5 seconds, until that arm grows back with a new problem. Progress runs
through a **world map**: six sectors (Addition, Subtraction, Times Tables, Multiplication, Division, Mixed), six worlds
each, getting harder slowly, each with its own sky. World 3 of a sector opens the next sector; Mixed opens when world 3
of every other sector is done. Numbers follow the kid's grade (Riley 3rd, Charlie and the test player Yan 4th).

**Missions** (three at a time on the hub, Jetpack Joyride style): "Catch 25 answers", "Rescue 5 astronauts", "Pop 2
Math Hydras" and so on, 24 in a fixed order; each pays treats when it is done and the next one slides in. Progress
is added at the end of every world from the run's counters. **Endless** opens once any world 3 is cleared: mixed
problems, waves that never stop (speed, enemy cap and numbers climb every wave), a boss every fourth wave (tank and
Mothership take turns), a Blitz every fifth, no stars; the best wave and score show on the hub button.

### Borrowed from the games kids play

| Game | What it does | Here |
|---|---|---|
| Sky Force Reloaded | medals per stage, survivors to rescue | four medals per world, lost astronauts |
| Galaga | the Challenging Stage, the tractor beam, the dual fighter | Bonus Blitz, the Bubble Snatcher, the Wingman drone |
| Raiden / Gradius | colour-coded capsules, homing missiles | capsule power-ups, Homing Missiles |
| DoDonPachi | kill chains | the chain multiplier |
| Galaxy Attack | enemies glimmer before firing, edge warnings, boss phases, Endless mode | telegraphs, chevrons, the angry tank and the Mothership, Endless |
| Vampire Survivors | weapon evolutions | the gold Evolution cards |
| Jetpack Joyride | three visible missions, the next slides in | the Missions card on the hub |

**Two players on one keyboard** (computer only): player 1 flies with W A S D, shoots with F, lasers with left Shift and bombs with Q, player 2 flies
with the arrow keys, shoots with . or right Ctrl, lasers with right Shift and bombs with /. Either ship may catch the answer; a wrong catch costs the catcher. A
downed ship becomes a rescue bubble the partner can fly into; catches that alternate between the two earn a
Teamwork bonus; ships close together link a beam that pops enemy shots; after a wave each player picks a card
from four. Both kids' saves earn the stars and treats.

Controls (solo): arrow keys or W A S D to fly, Space or left Ctrl to shoot (or leave Auto-fire on), left Shift for the laser, B for a bomb, P or Esc to pause. On a touch screen
a ghost thumbstick appears under your thumb on the right half of the stage and the ship follows it (the base slides along if the thumb goes past the rim); LASER and BOMB sit bottom-left, FIRE too while Auto-fire is off; Settings can put the stick on the left (`stickLeft`, saved with the profile). Auto-fire is a per-player
setting saved with the profile (`autoFire`, default on); with it off, Space, Enter or left Ctrl shoots solo (Ctrl+W would close the tab, so W is locked in full screen where the browser allows it, and leaving mid-world asks first); in two-player F shoots for player 1 and . for player 2, and each ship follows its own player's setting. Drones and missiles fire whenever the ship does. On a computer the game goes
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
  touches the real saves. `node fuzz.js ../index.html [seconds]` is the crash fuzz: it plays every sector, both
  bosses, Endless and co-op with random power-ups, spawns, bombs, lasers, picks and keys, and fails on any page
  error or stalled frame.

## Tuning knobs (`src/game.js`)

`WORLD_RAMP` (per-world tier, bubble speed, enemy cap and timing, and `foe`, the enemy pace that keeps worlds 1 and 2
slow), `SIZE` (the scale of everything on the field), `MIX_TIERS`, `WAVE_N` (correct answers per
wave), `LASER_T` and `CHARGE_T` (laser length and recharge), `HYDRA_OPEN` and `spawnHydra` (the hydra's open window, arms and
health), `POWERS` (capsule durations and colours), `SUPPLY_T` (seconds without a capsule before one drifts in), `BLITZ_T`,
`CHAIN_T`, the drop odds in `rollDrop`, the gates `rockOK`/`snatchOK`/`swarmOK` and the spawn timers set in `nextWave`
(`rockT` 6–9 s, `snatchT` 18 s, `swarmT` 16 s), `spawnBoss` (turret and core health), the beam
range and rescue timer in the co-op code, and the number ranges in `MSMath`.

## Mechanics pass: what is deliberately not here yet

This build proves the mechanics with placeholder shapes. The theme pass adds: the Spelling Worlds palettes,
scenes and characters (copied at build time by named anchors, as `times-table-worlds/build.js` does); scenery
per world on the map; the character store (`owned`, `char`, `look` save fields with the sibling merge rules);
world-flavoured bullets and treats; read-aloud problems; music; the web manifest and icons for home-screen
install; `probe.js` screenshots; and a design note.

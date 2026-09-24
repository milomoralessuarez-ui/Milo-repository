# MiloPlay 🎮

A free browser game portal with **130 original games** — voxel sandboxes, arena
shooters, puzzles, racers and arcade classics. Everything runs client-side, so
there is no backend, no build step, no account and no tracking.

Open `index.html` and it works. That's the whole story.

---

## Play it

Once GitHub Pages is enabled (see [Deploying](#deploying)), the site lives at:

```
https://milomoralessuarez-ui.github.io/Milo-repository/
```

To run it locally, serve the folder with any static file server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

A plain `file://` open mostly works too, but a server is needed for the service
worker (offline play) and for high scores to persist reliably.

---

## The games

| Category | Games |
|---|---|
| **Sandbox** (2) | Blockcraft, Terra Dig |
| **Arcade** (19) | Asteroid Field, Brick Breaker, Bug Blaster, Burrow Blast, Cave Flyer, Colour Rush, Dash Runner, Flap Rocket, Galaxy Raid, Ghost Escape, Gravity Swap, Lunar Lander, Maze Muncher, Missile Defense, Neon Snake, Pinball, Road Hopper, Sky Hopper, Space Defender |
| **Action** (13) | Astro Blaster, Ball Blast, Barrel Climb, Blast Arena, Blob Eater, Hole Eater, Jump Quest, Key Quest, Lava Run, Ninja Climb, Paper Claim, Snake Royale, Tank Arena |
| **Puzzle** (28) | 2048, Binary Puzzle, Block Stacker, Box Push, Bubble Pop, Dot Connect, Futoshiki, Gem Swap, Ice Slide, Laser Maze, Lights Out, Make 24, Mastermind, Math Blitz, Maze Runner, Merge Drop, Minesweeper, Nonogram, One Line, Peg Solitaire, Quick Math, Roll Block, Slide Puzzle, Sudoku, Sweet Match, Tile Match, Tower of Hanoi, Water Sort |
| **Racing** (2) | Highway Rush, Turbo Drift |
| **Sports** (9) | Air Hockey, Archery, Bowling, Darts, Fling Fortress, Hoop Shot, Mini Golf, Penalty Shootout, Pong Duel |
| **Cards** (9) | Blackjack, Crazy Eights, FreeCell, Golf Solitaire, Klondike Solitaire, Pyramid Solitaire, Spider Solitaire, Video Poker, War |
| **Word** (8) | Anagram Hunt, Hangman, Letter Drop, Typing Test, Word Grid, Word Ladder, Word Search, Word Sleuth |
| **Casual** (23) | Aim Trainer, Balloon Pop, Coin Tycoon, Farm Idle, Fruit Slice, Helix Drop, Knife Throw, Laser Dodge, Memory Match, Memory Sequence, Perfect Circle, Piano Tap, Plinko, Reaction Time, Rhythm Tap, Rise Up, Rolling Ball, Simon Says, Spot the Difference, Stack Ball, Tower Stack, Whack-a-Mole, Zig Zag |
| **Strategy** (17) | Battleship, Cannon Siege, Checkers, Chess Blitz, City Idle, Connect Four, Dots & Boxes, Gomoku, Hex, Mancala, Nim, Nine Men’s Morris, Reversi, Space Trader, Tic Tac Toe, Tower Defence, Ultimate Tic Tac Toe |

**Blockcraft** is the headline: a first-person voxel sandbox rendered with
WebGL, with procedurally generated terrain, chunked meshing, block breaking and
placing, swimming, flight, and edits that persist in `localStorage` — so your
build is still standing when you come back.

**Turbo Drift** is the other big one: a low-poly 3D racer over **50 grand-prix
style circuits** — long straights into braking corners, chicanes, banked
sweepers, tunnels, and ramps that jump gaps in the road. Five red lights start
every race F1-style, and each lap splits into three timed sectors against
your personal bests. You
start at the back of the grid with the fastest rivals on pole, grandstands full
of fans line the straights, and every race runs past **two minutes** even in
the fastest fully-tuned car. The tracks are
generated from seeds rather than hand-drawn, so `tools/verify-tracks.mjs` checks
every one is actually raceable — closed loop, no stretch of track overlapping
another, no corner tighter than the car's turning circle, no jump without a ramp
steep enough to clear it. Run it before changing any seed:

```bash
node tools/verify-tracks.mjs
```

All 130 games were written for this project. Nothing is embedded from another
site; the "Games elsewhere" page simply links out to other sites' own
official pages.

---

## StudyQuest — study site

`study/` is a separate, self-contained study app in the style of Quizlet and
Blooket, one hub for a student's whole schedule. Open `study/index.html` (or
`/study/` on the deployed site).

| Subject | Where the content comes from |
|---|---|
| **Chemistry**, Concepts 1–4 | Built from the class notes: lab safety and equipment, measurement, dimensional analysis and scientific notation, the scientific method |
| **Chemistry**, Units 5–12 ("Beyond your notes") | The rest of a first-year course: atoms, the periodic table, bonding, naming, reactions, the mole, gases, solutions, acids and bases |
| **Math:** Algebra 1 (14 units), Geometry, Algebra 2 | Standard high school courses, unit by unit |
| **Science:** Biology, Physics, Earth & Space Science | Standard high school courses, unit by unit |
| **English and languages:** English, Spanish 1 | Standard high school courses, unit by unit |
| **Social studies:** U.S. History, World History, U.S. Government & Civics, Economics & Personal Finance, Psychology | Standard high school courses, unit by unit |

Everything except the class-notes concepts was written unit by unit, fact-checked
item by item by a separate reviewer, then checked again by a second, independent
reviewer; `verify-study.mjs` (below) then rejects anything a student could not
answer.

Every unit works in every mode:

| Mode | What it does |
|---|---|
| **Flashcards** | Flip, star, sort into "know" / "still learning" (swipe on a phone); "still learning" goes on the Mistakes list |
| **Learn** | Adaptive rounds of multiple choice, true/false and typed answers until every item is mastered; can focus on one topic |
| **Test** | Graded practice test with an explanation for every question and a by-topic breakdown of the score |
| **Mistakes** | Everything missed in any mode, readable as questions and answers, reviewed until each is right |
| **Match** | Race the clock pairing terms with definitions |
| **Gold Quest** | Blooket-style: answer to open chests, swap or steal gold, beat the bots |
| **Race** | Blooket-style: each right answer drives your car forward; beat four bots to the flag |
| **Blitz** | Rapid-fire questions where speed and streaks multiply your score |
| **Study guide** | Every term and question with its answer, grouped by topic and searchable |

Some subjects add their own modes:

| Mode | Where | What it does |
|---|---|---|
| **Algebra Lab** | Algebra 1, every unit | Endless generated problems for 77 skills — equations (including literal and absolute-value), inequalities (including compound), slope and lines, systems, exponents and exponential models, polynomials, factoring (including by grouping), quadratics (factoring, completing the square, the quadratic formula), radicals, statistics, function transformations, piecewise and step functions, and rational expressions and equations — plus reading slope, intercepts, domain and range, a system's solution and a parabola's vertex and zeros off drawn graphs. Each has worked steps and a hint; answers are checked for equivalence, and for form where the form is the point (factored completely, radical simplified, slope-intercept form) |
| **Problem Lab** | Chemistry, Concepts 2–3 and Units 5–12 | Endless problems — metric prefixes, temperature, scientific notation, dimensional analysis; protons, neutrons and electrons, average atomic mass, electron configurations; naming compounds and writing formulas; balancing equations; molar mass, mole conversions, percent composition, stoichiometry, limiting reactant, percent yield; gas laws; molarity, dilution and pH — with "Show me how" and a picket-fence worked solution, graded exactly |
| **Physics Lab** | Physics, every unit | Endless problems for 40 skills — kinematics and free fall, vectors and projectiles, Newton's laws and friction, circular motion and gravitation, work, energy and power, momentum, waves, optics, circuits and Coulomb's law — each worked in the Givens / Unknown / Equation / Substitute / Solve layout, with free-body diagrams, circuits, ray diagrams and motion graphs, graded exactly to the stated rounding |
| **Picture Quiz** | Chemistry, Concepts 1, 2, 4 | Name the lab equipment, judge accuracy and precision targets, read a graduated cylinder, spot what a graph is missing — all from drawings |

Problems from these modes also turn up in Gold Quest, Race, Blitz and Mistakes.
**Collection** (🎒 in the header) pays 10 coins for a question answered right on
the first try anywhere on the site; coins open packs of collectible critters,
and one can be your icon in the games. Guessing does not pay: each question
gets one paid try per 10 minutes, coins pause while more than half of the last
10 first tries were wrong, and flashcards and Match never pay.

Progress, starred terms, mistakes, best scores and the collection are saved in
`localStorage`. Chemistry's class-notes concepts live in `study/data.js`; every
other subject is a file in `study/subjects/` that pushes itself onto
`window.STUDY_SUBJECTS` (a file marked `extend` adds units to a subject that
already exists). The app is `study/app.js` and `study/style.css`; the modes
above are `algebra.js`, `physics.js`, `lab.js`, `visuals.js` and `collect.js`, each
registering itself through the small `window.CQ` interface at the bottom of
`app.js`.

Checks guard the content and the interface. Run them before changing a subject
or the app:

```bash
node tools/verify-study.mjs                          # every question in every subject
node tools/verify-algebra.mjs                        # Algebra Lab: thousands of problems re-solved independently
node tools/verify-lab.mjs                            # Problem Lab: the same for chemistry, plus its element, ion and reaction data
node tools/verify-physics.mjs                        # Physics Lab: the same for physics
node tools/smoke-study.mjs http://127.0.0.1:8000     # every mode and subject, in a browser
```

`verify-study.mjs` fails on a question a student could not answer — a right
answer missing from its options, two options that say the same thing, a prompt
or definition that gives the answer away, a set too small for Match — and runs
the app's own answer checker against every accepted answer and a fixed table of
tricky cases (units and prefixes, variables, ordered pairs, fractions,
scientific notation, Spanish accents). The lab verifiers work every
generated answer out again with their own maths, never the app's, and check
that near misses are rejected. `smoke-study.mjs` plays each mode through,
visits every subject, runs the feature checks in `tools/study-checks/`, and
fails on any console error.

---

## How it fits together

```
index.html                  page shell + one <script> tag per game
assets/css/style.css        all styling, dark-first with a full light theme
assets/js/engine.js         the shared game framework
assets/js/app.js            the portal: routing, search, favourites, player
assets/js/games/*.js        one file per game, each self-registering
sw.js                       service worker for offline play
tools/smoke-test.mjs        headless test that plays every game
tools/build-single.mjs      bundles the site into one self-contained file
dist/miloplay.html          that bundle — open it directly, no server needed
```

### The engine

`engine.js` provides three **runners**, all sharing one set of chrome — stat
readouts, pause/restart/sound/fullscreen buttons, and the start, pause and
game-over overlays:

| Runner | For | Gives you |
|---|---|---|
| `Milo.arcade` | 2D canvas games | A letterboxed design-space canvas, fixed-step loop, pointer + key input |
| `Milo.domGame` | Grid/board games | An HTML root to build into, plus the same chrome |
| `Milo.glGame` | 3D games | A WebGL context, pointer lock and mouse-look deltas |

It also provides input handling (with automatic on-screen controls on touch
devices), a small WebAudio synth for sound effects, `localStorage`-backed high
scores, and utilities like value noise for terrain generation.

### Adding a game

Create `assets/js/games/my-game.js`:

```js
(function () {
  'use strict';

  function mount(host) {
    return window.Milo.arcade(host, {
      id: 'my-game',
      w: 800, h: 500, bg: '#0a0d20',
      stats: ['Score'],
      init:   function (g) { g.data.x = 0; },
      update: function (g, dt) { g.data.x += 60 * dt; },
      draw:   function (g) {
        g.ctx.fillStyle = '#22d3ee';
        g.ctx.fillRect(g.data.x, 200, 40, 40);
      }
    });
  }

  window.Milo.register({
    id: 'my-game',
    title: 'My Game',
    emo: '🎲',
    category: 'Arcade',
    tagline: 'One line for the card',
    description: 'A paragraph for the game page.',
    controls: ['← →'],
    colors: ['#7c5cff', '#22d3ee'],   // thumbnail gradient
    tags: ['arcade'],
    mount: mount
  });
})();
```

Then add a `<script>` tag for it in `index.html` and to the `GAMES` list in
`sw.js`. The portal picks it up automatically — card, search, category page and
all.

Two things worth knowing:

- **`init` runs once before the start overlay appears**, so the game renders
  behind it instead of showing a blank canvas. Write `init` as a pure reset and
  `draw` so it works from that initial state.
- Games draw in a fixed design space (`w` × `h`) that is letterboxed into
  whatever size the stage happens to be. Pass `fit: 'resize'` instead if you
  want to draw at the stage's real pixel size — `g.W` and `g.H` then track it.

---

### One-file build

`dist/miloplay.html` is the entire site — CSS, engine, all 130 games — inlined
into a single 375 KB file with no external references. Open it straight from
disk, email it, or drop it on a USB stick and it works. Rebuild it after
changing anything:

```bash
node tools/build-single.mjs
```

The multi-file version under `assets/` stays the source of truth; the bundle is
generated from it and is never edited by hand.

---

## Testing

`tools/smoke-test.mjs` opens the site in headless Chromium, plays **every**
registered game for a couple of seconds with simulated keyboard and mouse
input, and fails on any console error, uncaught exception or empty stage. It
then walks every portal route.

```bash
# one terminal
python3 -m http.server 8099

# another
node tools/smoke-test.mjs http://127.0.0.1:8099
```

It needs `playwright` resolvable from the repo root. In this environment
Playwright is installed globally, so a symlink is enough:

```bash
mkdir -p node_modules
ln -s "$(npm root -g)/playwright" node_modules/playwright
```

The test earned its keep — it caught three real bugs during development: games
drawing before `init` had run, a game that threw during startup leaking its
global key listeners onto the *next* game, and Blockcraft holding pointer lock
across navigation.

---

## Deploying

`.github/workflows/deploy.yml` publishes the repository to GitHub Pages on
every push to the repository's **default branch** (whatever it is called — the
workflow reads it rather than hardcoding `main`). To turn it on:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Push to the default branch.

The site is then live at `https://<user>.github.io/<repo>/`. Nothing is
published until you enable Pages yourself — until then the workflow simply has
nowhere to deploy to.

### A shorter URL

That address is a mouthful. Two ways to shorten it:

- **Rename the repo** to something like `play` →
  `milomoralessuarez-ui.github.io/play/`
- **Use a custom domain** (~£10/year): add a file named `CNAME` at the repo
  root containing just your domain (e.g. `miloplay.io`), point the domain's
  DNS at GitHub Pages, and set it under **Settings → Pages → Custom domain**.
  You then get `https://miloplay.io/`.

Any static host works just as well — Netlify, Vercel and Cloudflare Pages all
deploy this repository as-is with no build command.

---

## Notes

- **Your data stays yours.** High scores, favourites, recently-played and the
  saved Blockcraft and Terra Dig worlds all live in your browser's
  `localStorage`. Nothing is sent anywhere; clearing site data resets them.
- **Offline.** After the first visit the service worker keeps the whole site
  cached, so it keeps working without a connection.
- **Mobile.** Every game gets on-screen controls automatically on touch
  devices, and the layout adapts down to phone width.
- **Themes.** The design is dark-first, but a visitor whose system asks for
  light gets the light palette on their first visit; the header toggle
  overrides either way and remembers the choice.
- **Accessibility.** The site is keyboard-navigable, respects
  `prefers-reduced-motion`, and gives focus a visible state.

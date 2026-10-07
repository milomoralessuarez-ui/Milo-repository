# MiloPlay 🎮

A free browser game portal with **1,000 games** — a Minecraft-style voxel
sandbox, the Polly Track low-poly racer, shooters, platformers, puzzles,
quizzes, solitaires, jigsaws, and hundreds of arcade games. Everything runs
client-side: no backend, no build step, no account, no tracking.

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

**484 originals** written for this site, plus **516 remixes** of the arcade
originals (see [Remixes](#remixes)). Every game has its own page with a
description of how it actually plays, its controls, a high-score table, and
its other versions.

| Category | Originals | Remixes | Highlights |
|---|---|---|---|
| **Sandbox** | 2 | 2 | Blockcraft (first-person voxel world, WebGL), Terra Dig |
| **Racing** | 19 | 33 | Polly Track — Sunrise Circuit, Canyon, Alpine — Turbo Drift's 50 grand-prix circuits, Rally Stage with a co-driver on the pacenotes, Drag Racer, Monster Truck, Ice Racer, Pit Stop, Time Attack against your own ghost |
| **Action** | 41 | 93 | Zombie Siege, Alien Swarm, Mech Storm, Dungeon Dash, Goblin Gates, Shark Escape, Storm Chaser, Volcano Escape, Ninja Slice |
| **Arcade** | 44 | 103 | Centipede Strike, Photon Cycles, Star Gate, Cube Hopper, Tunnel Digger, Pipe Panic, Bomb Catcher, Tunnel Rush, Neon Snake |
| **Puzzle** | 97 | 67 | 18 jigsaws, 100 pixel-art nonograms, Skyscrapers, Bridges, Star Battle, Number Link, Unblock Car, five sudoku tiers plus Sudoku X, six minesweeper boards, 16 math drills |
| **Casual** | 70 | 90 | 10 idle clickers, 14 memory games, Beat Drop, Dance Arrows, Stroop Rush, Juggle Master, Claw Machine, Perfect Slice |
| **Sports** | 25 | 61 | Curling, Badminton, Boxing, Sumo, High Jump, Javelin, Snowboard Halfpipe, Rowing Sprint, Show Jumping, Fencing, Table Tennis, Blob Volleyball, Batting Cage |
| **Cards** | 31 | 16 | Hearts, Spades, Cribbage, Gin Rummy, Euchre, Durak, Oh Hell!, Casino, Rummy 500, Go Fish, plus Klondike, Spider, FreeCell and nine more solitaires |
| **Word** | 45 | 17 | 20 themed word searches, 10 typing games, Word Guess, Mini Crossword, Honeycomb Words, Missing Vowels, Odd One Out |
| **Strategy** | 32 | 34 | Go (9×9), Quoridor, Onitama, Hnefatafl, Backgammon, Amazons, Lines of Action, Halma, Dominoes, Conquest, Chess Blitz, Checkers, Reversi, Tower Defence |
| **Trivia** | 78 | — | 78 quizzes: science, space, dinosaurs, world capitals, flags, rivers, Olympics, classical music, art history, logic riddles, Acronym Quiz, Trivia Ladder… |

Some things worth calling out:

- **Blockcraft** is a first-person voxel sandbox rendered with WebGL —
  procedurally generated terrain, chunked meshing, block breaking and placing,
  swimming, flight, and edits that persist in `localStorage`. Searching for
  "minecraft" finds it.
- **Polly Track** is a low-poly 3D time-trial racer in the spirit of PolyTrack:
  three circuits built from Catmull-Rom splines, ordered checkpoints, three-lap
  races against the clock, a light drift at speed, a chase camera, and best
  times per track. Searching "polytrack" or "poly track" finds it.
- **Turbo Drift** is a low-poly 3D racer over **50 grand-prix circuits** —
  long straights into braking corners, chicanes, banked sweepers, tunnels and
  ramps that jump gaps in the road. Five red lights start every race F1-style,
  each lap splits into three timed sectors against your personal bests, and you
  start at the back of a 19-car grid. Handling runs on a real vehicle model —
  slip-angle tyres, load transfer, aero downforce and a seven-speed gearbox —
  rather than on velocity nudges. The tracks are generated from seeds rather
  than hand-drawn, so `tools/verify-tracks.mjs` checks every one is raceable —
  closed loop, no overlapping stretches, no corner tighter than the car's
  turning circle, no jump without a ramp steep enough to clear it. Run it before
  changing any seed:

  ```bash
  node tools/verify-tracks.mjs
  ```
- **The quizzes** each draw twelve questions from a hand-written bank of
  twenty or more, with a per-question timer, streak bonuses and three lives.
- **The solitaires** implement the real rules of twelve variants on a shared
  card library, with stuck detection where it is cheap to compute.
- **The sudoku tiers** use a generator that digs a solved grid while a solver
  confirms the puzzle keeps a unique solution.

All originals were written for this project. Nothing is embedded from another
site; the "Games elsewhere" page simply links out to other sites' own official
pages.

### Remixes

Every arcade-runner original has Turbo, Zen and Hyper editions, and many have
an Insane edition. A remix is a real catalogue entry — its own title,
description, thumbnail and high-score table — with the base game's mechanics
untouched and its **game clock retuned**: Zen runs at 72% speed, Turbo at 135%,
Hyper at 170%, Insane at 200%. The canvas is hue-shifted so each edition looks
like its own game. Home-page rows show originals only; remixes appear in
browse, in search, and in the "More versions of this game" row on the base
game's page.

Remixes are data, not code: `assets/js/variants.js` is generated by
`tools/build-variants.mjs` from a plan produced by `tools/plan-variants.mjs`
(which picks eligible bases and allocates tiers so the catalogue lands on an
exact size) and entries from `tools/gen-variant-entries.mjs`.

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
| **Geometry Lab** | Geometry, every unit | Endless problems for 40 skills — midpoint and distance, angle pairs, conditional statements, parallel lines and transversals, triangle angles, congruence and similarity shortcuts, the triangle inequality, the Pythagorean theorem, special right triangles, trigonometry, polygon angles, quadrilateral properties, transformations on a grid, circles, arcs and sectors, circle equations, and area, surface area and volume — each with a drawn figure where geometry needs one, a worked solution, and exact answers in π and radical form where the prompt asks |
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
above are `algebra.js`, `geometry.js`, `physics.js`, `lab.js`, `visuals.js` and `collect.js`, each
registering itself through the small `window.CQ` interface at the bottom of
`app.js`.

Checks guard the content and the interface. Run them before changing a subject
or the app:

```bash
node tools/verify-study.mjs                          # every question in every subject
node tools/verify-algebra.mjs                        # Algebra Lab: thousands of problems re-solved independently
node tools/verify-lab.mjs                            # Problem Lab: the same for chemistry, plus its element, ion and reaction data
node tools/verify-physics.mjs                        # Physics Lab: the same for physics
node tools/verify-geometry.mjs                       # Geometry Lab: the same for geometry, reading the figures too
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
index.html                  page shell + one <script> tag per game file
assets/css/style.css        all styling, dark-first with a full light theme
assets/js/engine.js         the shared game framework (incl. remix support)
assets/js/app.js            the portal: routing, search, favourites, player
assets/js/games/*.js        one file per game — or one file per pack of games
assets/js/variants.js       the generated remix catalogue
sw.js                       service worker for offline play
tools/sync-manifest.mjs     regenerates the script-tag and cache lists
tools/smoke-test.mjs        headless test that plays every game (sharded)
tools/dump-registry.mjs     dumps the live catalogue as JSON
tools/plan-variants.mjs     allocates remixes to reach an exact catalogue size
tools/gen-variant-entries.mjs  writes remix titles, copy and colours
tools/build-variants.mjs    assembles assets/js/variants.js
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
scores, utilities like value noise for terrain generation, and
`Milo.registerVariant` for remixes (a variant mounts the base game unchanged
while the arcade runner scales game time and hue-shifts the canvas).

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

Then run `node tools/sync-manifest.mjs` to add its script tag to `index.html`
and its cache entry to `sw.js`. The portal picks it up automatically — card,
search, category page and all. A file may register several games (the quiz,
solitaire, jigsaw and word-search packs do), and a game may optionally carry
`aliases` — extra search terms — and `featured: true`.

Two things worth knowing:

- **`init` runs once before the start overlay appears**, so the game renders
  behind it instead of showing a blank canvas. Write `init` as a pure reset and
  `draw` so it works from that initial state.
- Games draw in a fixed design space (`w` × `h`) that is letterboxed into
  whatever size the stage happens to be. Pass `fit: 'resize'` instead if you
  want to draw at the stage's real pixel size — `g.W` and `g.H` then track it.

---

### One-file build

`dist/miloplay.html` is the entire site — CSS, engine, all 1,000 games —
inlined into a single file with no external references. Open it straight from
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
registered game for a short burst with simulated keyboard and mouse input, and
fails on any console error, uncaught exception or empty stage. It then walks
every portal route.

```bash
# one terminal
python3 -m http.server 8099

# another — the whole catalogue, split across three processes
node tools/smoke-test.mjs http://127.0.0.1:8099 --shard=1/3 &
node tools/smoke-test.mjs http://127.0.0.1:8099 --shard=2/3 &
node tools/smoke-test.mjs http://127.0.0.1:8099 --shard=3/3 &
wait

# or just a few games while iterating
node tools/smoke-test.mjs http://127.0.0.1:8099 --only=polly-track,neon-snake
```

It needs `playwright` resolvable from the repo root. In this environment
Playwright is installed globally, so a symlink is enough:

```bash
mkdir -p node_modules
ln -s "$(npm root -g)/playwright" node_modules/playwright
```

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

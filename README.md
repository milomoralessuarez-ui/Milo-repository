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

**444 originals** written for this site, plus **556 remixes** of the arcade
originals (see [Remixes](#remixes)). Every game has its own page with a
description of how it actually plays, its controls, a high-score table, and
its other versions.

| Category | Originals | Remixes | Highlights |
|---|---|---|---|
| **Sandbox** | 2 | 2 | Blockcraft (first-person voxel world, WebGL), Terra Dig |
| **Racing** | 9 | 14 | Polly Track — Sunrise Circuit, Canyon, Alpine — and Turbo Drift's 50 grand-prix circuits, plus Kart Sprint, Moto Hill Climb, Highway Rush |
| **Action** | 41 | 110 | Zombie Siege, Alien Swarm, Mech Storm, Dungeon Dash, Goblin Gates, Shark Escape, Storm Chaser, Volcano Escape, Ninja Slice |
| **Arcade** | 44 | 123 | Centipede Strike, Photon Cycles, Star Gate, Cube Hopper, Tunnel Digger, Pipe Panic, Bomb Catcher, Tunnel Rush, Neon Snake |
| **Puzzle** | 97 | 80 | 18 jigsaws, 100 pixel-art nonograms, Skyscrapers, Bridges, Star Battle, Number Link, Unblock Car, five sudoku tiers plus Sudoku X, six minesweeper boards, 16 math drills |
| **Casual** | 70 | 109 | 10 idle clickers, 14 memory games, Beat Drop, Dance Arrows, Stroop Rush, Juggle Master, Claw Machine, Perfect Slice |
| **Sports** | 15 | 41 | Table Tennis, Blob Volleyball, Batting Cage, Free Kick, Ski Slalom, Skate Park, Boat Race, Velodrome Dash |
| **Cards** | 21 | 19 | Klondike, Spider, FreeCell, Yukon, Scorpion, Canfield, Forty Thieves, Tri Peaks, Blackjack, Video Poker |
| **Word** | 45 | 19 | 20 themed word searches, 10 typing games, Word Guess, Mini Crossword, Honeycomb Words, Missing Vowels, Odd One Out |
| **Strategy** | 22 | 39 | Chess Blitz, Checkers, Reversi, Battleship, Tower Defence, Space Trader, Factory Lines, Ant Colony |
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
  start at the back of a 19-car grid. The tracks are generated from seeds rather
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

# MiloPlay 🎮

A free browser game portal with **30 original games** — voxel sandboxes, arena
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
| **Sandbox** | Blockcraft (3D voxel world), Terra Dig (2D mining) |
| **Action** | Blast Arena, Snake Royale, Astro Blaster, Ball Blast |
| **Arcade** | Neon Snake, Brick Breaker, Flap Rocket, Sky Hopper, Dash Runner, Colour Rush |
| **Puzzle** | Block Stacker, 2048, Minesweeper, Slide Puzzle, Lights Out, Maze Runner |
| **Racing** | Turbo Drift, Highway Rush |
| **Sports** | Pong Duel, Hoop Shot |
| **Strategy** | Connect Four, Tic Tac Toe, Reversi |
| **Casual** | Tower Stack, Memory Match, Whack-a-Mole, Aim Trainer, Coin Tycoon |

**Blockcraft** is the headline: a first-person voxel sandbox rendered with
WebGL, with procedurally generated terrain, chunked meshing, block breaking and
placing, swimming, flight, and edits that persist in `localStorage` — so your
build is still standing when you come back.

All 30 games were written for this project. Nothing is embedded from another
site; the "Games elsewhere" page simply links out to other sites' own
official pages.

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

`dist/miloplay.html` is the entire site — CSS, engine, all 30 games — inlined
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
every push to `main`. To turn it on:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Push to `main`.

The site is then live at
`https://<user>.github.io/<repo>/`.

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

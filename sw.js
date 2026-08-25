/* MiloPlay service worker — makes the whole site playable offline.
   Bump CACHE when assets change; old caches are cleaned up on activate. */
const CACHE = 'miloplay-v1';

const GAMES = [
// GAMES:BEGIN
  'aim-trainer', 'anagram-hunt', 'astro-blaster', 'ball-blast', 'battleship', 'blackjack',
  'blast-arena', 'block-stacker', 'blockcraft', 'brick-breaker', 'checkers', 'coin-tycoon',
  'color-rush', 'connect-four', 'crazy-eights', 'dash-runner', 'dots-and-boxes', 'flap-rocket',
  'freecell', 'g2048', 'golf-solitaire', 'gomoku', 'hangman', 'highway-rush', 'hoop-shot',
  'klondike', 'letter-drop', 'lights-out', 'mancala', 'maze-runner', 'memory-match',
  'minesweeper', 'neon-snake', 'nim', 'pong-duel', 'pyramid-solitaire', 'reversi', 'sky-hopper',
  'slide-puzzle', 'snake-royale', 'spider-solitaire', 'sudoku', 'terra-dig', 'tic-tac-toe',
  'tower-stack', 'turbo-drift', 'typing-test', 'video-poker', 'war-cards', 'whack-a-mole',
  'word-grid', 'word-ladder', 'word-search', 'word-sleuth'
// GAMES:END
];

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/js/engine.js',
  './assets/js/lib/cards.js',
  './assets/js/lib/words.js',
  './assets/js/app.js',
  ...GAMES.map((g) => `./assets/js/games/${g}.js`)
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // Individual failures must not abort the whole install.
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // let fonts etc. go to the network

  // Navigations: try the network first so a redeploy is picked up immediately,
  // and fall back to the cached shell when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Assets: serve from cache, refreshing it in the background.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});

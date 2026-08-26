/* MiloPlay service worker — makes the whole site playable offline.
   Bump CACHE when assets change; old caches are cleaned up on activate. */
const CACHE = 'miloplay-v1';

const GAMES = [
// GAMES:BEGIN
  'aim-trainer', 'air-hockey', 'anagram-hunt', 'archery', 'asteroid-field', 'astro-blaster',
  'ball-blast', 'balloon-pop', 'barrel-climb', 'battleship', 'binary-puzzle', 'blackjack',
  'blast-arena', 'blob-eater', 'block-stacker', 'blockcraft', 'bowling', 'box-push',
  'brick-breaker', 'bubble-pop', 'bug-blaster', 'burrow-blast', 'cannon-siege', 'cave-flyer',
  'checkers', 'chess-blitz', 'coin-tycoon', 'color-rush', 'connect-four', 'crazy-eights',
  'darts', 'dash-runner', 'dot-connect', 'dots-and-boxes', 'farm-idle', 'flap-rocket',
  'fling-fortress', 'freecell', 'fruit-slice', 'futoshiki', 'g2048', 'galaxy-raid', 'gem-swap',
  'golf-solitaire', 'gomoku', 'gravity-swap', 'hangman', 'helix-drop', 'hex-game',
  'highway-rush', 'hole-eater', 'hoop-shot', 'ice-slide', 'jump-quest', 'klondike',
  'knife-throw', 'laser-dodge', 'laser-maze', 'lava-run', 'letter-drop', 'lights-out',
  'lunar-lander', 'make-24', 'mancala', 'mastermind', 'math-blitz', 'maze-muncher',
  'maze-runner', 'memory-match', 'memory-sequence', 'merge-drop', 'minesweeper', 'mini-golf',
  'missile-defense', 'neon-snake', 'nim', 'nine-mens-morris', 'ninja-climb', 'nonogram',
  'one-line', 'paper-claim', 'peg-solitaire', 'penalty-shootout', 'perfect-circle', 'piano-tap',
  'pinball', 'plinko', 'pong-duel', 'pyramid-solitaire', 'quick-math', 'reaction-time',
  'reversi', 'rhythm-tap', 'rise-up', 'road-hopper', 'rolling-ball', 'simon-says', 'sky-hopper',
  'slide-puzzle', 'snake-royale', 'space-defender', 'space-trader', 'spider-solitaire',
  'stack-ball', 'sudoku', 'sweet-match', 'tank-arena', 'terra-dig', 'tic-tac-toe', 'tile-match',
  'tower-defence', 'tower-of-hanoi', 'tower-stack', 'turbo-drift', 'typing-test',
  'ultimate-ttt', 'video-poker', 'war-cards', 'water-sort', 'whack-a-mole', 'word-grid',
  'word-ladder', 'word-search', 'word-sleuth', 'zig-zag'
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

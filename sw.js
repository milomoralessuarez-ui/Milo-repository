/* MiloPlay service worker — makes the whole site playable offline.
   Bump CACHE when assets change; old caches are cleaned up on activate. */
const CACHE = 'miloplay-v1';

const GAMES = [
// GAMES:BEGIN
  'aim-trainer', 'air-hockey', 'alien-swarm', 'anagram-hunt', 'archery', 'arrow-storm',
  'asteroid-field', 'astro-blaster', 'ball-blast', 'balloon-pop', 'barrel-climb',
  'batting-cage', 'battleship', 'binary-puzzle', 'blackjack', 'blast-arena', 'blob-eater',
  'block-stacker', 'blockcraft', 'boat-race', 'bowling', 'box-push', 'brick-breaker',
  'bubble-pop', 'bug-blaster', 'burrow-blast', 'cannon-siege', 'cave-flyer', 'checkers',
  'chess-blitz', 'city-idle', 'coin-tycoon', 'color-rush', 'connect-four', 'crazy-eights',
  'darts', 'dash-runner', 'dot-connect', 'dots-and-boxes', 'farm-idle', 'flap-rocket',
  'fling-fortress', 'free-kick', 'freecell', 'fruit-slice', 'futoshiki', 'g2048', 'galaxy-raid',
  'gem-swap', 'ghost-escape', 'golf-solitaire', 'gomoku', 'gravity-swap', 'hangman',
  'helix-drop', 'hex-game', 'highway-rush', 'hole-eater', 'hoop-shot', 'hover-bike',
  'ice-slide', 'jigsaw-pack', 'jump-quest', 'kart-sprint', 'key-quest', 'klondike',
  'knife-throw', 'laser-dodge', 'laser-duel', 'laser-maze', 'lava-run', 'letter-drop',
  'lights-out', 'lunar-lander', 'make-24', 'mancala', 'mastermind', 'math-blitz',
  'maze-muncher', 'maze-runner', 'mech-storm', 'memory-match', 'memory-sequence', 'merge-drop',
  'meteor-surf', 'minesweeper', 'mini-golf', 'missile-defense', 'moto-hill', 'neon-snake',
  'night-rider', 'nim', 'nine-mens-morris', 'ninja-climb', 'nonogram', 'one-line',
  'orbital-defense', 'paint-wars', 'paper-claim', 'peg-solitaire', 'penalty-shootout',
  'perfect-circle', 'piano-tap', 'pinball', 'plinko', 'polly-track', 'pong-duel',
  'pyramid-solitaire', 'quick-math', 'quiz-pack-1', 'quiz-pack-2', 'quiz-pack-3',
  'reaction-time', 'reversi', 'rhythm-tap', 'rise-up', 'river-raft', 'road-hopper',
  'roll-block', 'rolling-ball', 'rooftop-run', 'shadow-leap', 'simon-says', 'skate-park',
  'ski-slalom', 'sky-ace', 'sky-hopper', 'slide-puzzle', 'snake-royale', 'solitaire-pack',
  'space-defender', 'space-trader', 'spider-solitaire', 'spike-dash', 'spot-difference',
  'stack-ball', 'submarine-strike', 'sudoku', 'sweet-match', 'table-tennis', 'tank-arena',
  'terra-dig', 'tic-tac-toe', 'tile-match', 'tower-defence', 'tower-of-hanoi', 'tower-stack',
  'tunnel-rush', 'turbo-drift', 'turret-tower', 'typing-pack', 'typing-test', 'ultimate-ttt',
  'velodrome-dash', 'video-poker', 'volleyball-blobs', 'wall-jumper', 'war-cards', 'water-sort',
  'whack-a-mole', 'wind-glider', 'word-grid', 'word-ladder', 'word-search', 'word-search-pack',
  'word-sleuth', 'zig-zag', 'zombie-siege'
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
  './assets/js/variants.js',
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

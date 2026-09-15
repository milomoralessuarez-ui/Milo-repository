/* MiloPlay service worker — makes the whole site playable offline.
   Bump CACHE when assets change; old caches are cleaned up on activate. */
const CACHE = 'miloplay-v2';

const GAMES = [
// GAMES:BEGIN
  'aim-trainer', 'air-hockey', 'alien-swarm', 'anagram-hunt', 'archery', 'arrow-storm',
  'asteroid-field', 'astro-blaster', 'balance-tower', 'ball-blast', 'balloon-pop',
  'barrel-climb', 'basket-fall', 'batting-cage', 'battleship', 'binary-puzzle', 'blackjack',
  'blast-arena', 'blob-eater', 'block-stacker', 'blockcraft', 'boat-race', 'bowling',
  'box-fort', 'box-push', 'brick-breaker', 'bridges-hashi', 'bubble-pop', 'bubble-trap',
  'bug-blaster', 'burrow-blast', 'cannon-golf', 'cannon-siege', 'castle-raid', 'cave-flyer',
  'checkers', 'chess-blitz', 'city-idle', 'coin-tycoon', 'color-rush', 'connect-four',
  'crazy-eights', 'crystal-caverns', 'darts', 'dash-runner', 'domino-run', 'dot-connect',
  'dots-and-boxes', 'dungeon-dash', 'farm-idle', 'flap-rocket', 'fling-fortress',
  'floor-is-lava', 'free-kick', 'freecell', 'frost-peak', 'fruit-slice', 'futoshiki', 'g2048',
  'galaxy-raid', 'gem-swap', 'ghost-escape', 'ghost-manor', 'goblin-gates', 'golf-blast',
  'golf-solitaire', 'gomoku', 'gravity-swap', 'hangman', 'helix-drop', 'hex-game',
  'highway-rush', 'hole-eater', 'hoop-shot', 'hover-bike', 'ice-breaker', 'ice-slide',
  'jigsaw-pack', 'jump-quest', 'kart-sprint', 'key-quest', 'klondike', 'knife-throw',
  'knight-tour', 'laser-dodge', 'laser-duel', 'laser-maze', 'lava-run', 'letter-drop',
  'lights-out', 'lunar-lander', 'magnet-boots', 'make-24', 'mancala', 'mastermind',
  'math-blitz', 'math-pack', 'maze-muncher', 'maze-runner', 'mech-storm', 'memory-match',
  'memory-pack', 'memory-sequence', 'merge-drop', 'meteor-miner', 'meteor-surf', 'minesweeper',
  'mini-golf', 'missile-defense', 'moto-hill', 'neon-snake', 'night-rider', 'nim',
  'nine-mens-morris', 'ninja-climb', 'ninja-slice', 'nonogram', 'number-link', 'one-line',
  'orbital-defense', 'paint-wars', 'paper-claim', 'peg-solitaire', 'penalty-shootout',
  'perfect-circle', 'piano-tap', 'pinball', 'plinko', 'pogo-bounce', 'polly-track', 'pong-duel',
  'pyramid-solitaire', 'queens-eight', 'quick-math', 'quiz-pack-1', 'quiz-pack-2',
  'quiz-pack-3', 'ragdoll-launch', 'reaction-time', 'reversi', 'rhythm-tap', 'rise-up',
  'river-raft', 'road-hopper', 'roll-block', 'rolling-ball', 'rooftop-run', 'rope-cut',
  'rotate-rings', 'shadow-leap', 'shark-escape', 'simon-says', 'skate-park', 'ski-slalom',
  'sky-ace', 'sky-hopper', 'slide-puzzle', 'slingshot-stars', 'snake-royale', 'solitaire-pack',
  'space-defender', 'space-trader', 'spider-solitaire', 'spike-dash', 'spot-difference',
  'spring-heights', 'stack-ball', 'star-battle', 'stick-bridge', 'storm-chaser',
  'submarine-strike', 'sudoku', 'sudoku-mines-pack', 'sweet-match', 'sword-storm',
  'table-tennis', 'tangram-fit', 'tank-arena', 'terra-dig', 'tic-tac-toe', 'tile-match',
  'tower-defence', 'tower-of-hanoi', 'tower-stack', 'tunnel-rush', 'turbo-drift',
  'turret-tower', 'typing-pack', 'typing-test', 'ultimate-ttt', 'unblock-car', 'velodrome-dash',
  'video-poker', 'vine-swing', 'volcano-escape', 'volleyball-blobs', 'wall-jumper', 'war-cards',
  'water-sort', 'whack-a-mole', 'wind-glider', 'word-grid', 'word-ladder', 'word-search',
  'word-search-pack', 'word-sleuth', 'wrecking-ball', 'zig-zag', 'zombie-siege'
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
